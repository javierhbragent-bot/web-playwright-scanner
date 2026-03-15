# AGENTS.md — Web Playwright Scanner Technical Reference

## Project Overview

Web Playwright Scanner automates the documentation of web applications. Given a URL and a list of routes, it launches a headless browser, navigates to each page, captures the DOM structure, intercepts network requests, takes screenshots, and produces structured JSON artifacts that describe how the frontend works and how it talks to the backend.

The problem it solves: manually documenting a web app's pages, API calls, and component inventory is slow and error-prone. This tool automates the capture phase, producing cross-referenced artifacts that a downstream skill (reverse-ui-doc-generator) can turn into human-readable documentation.

---

## Architecture

```
                        scan-config.json
                              │
                              ▼
                    ┌──────────────────┐
                    │   CLI (index.ts) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Scanner (core)  │  ← orchestrates the entire pipeline
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌─────▼──────┐   ┌──────▼──────┐
    │  Auth        │   │  Route     │   │  Flow       │
    │  Handler     │   │  Explorer  │   │  Runner     │
    │ (explore/)   │   │ (explore/) │   │ (explore/)  │
    └──────┬──────┘   └─────┬──────┘   └──────┬──────┘
           │                │                 │
           └────────────────┼─────────────────┘
                            │
              ┌─────────────┼─────────────────┐
              │             │                 │
       ┌──────▼──────┐ ┌───▼────────┐ ┌──────▼──────┐
       │  Network    │ │  DOM       │ │  Screenshot │
       │  Interceptor│ │  Analyzer  │ │  Capture    │
       │ (capture/)  │ │ (capture/) │ │ (capture/)  │
       └──────┬──────┘ └───┬────────┘ └──────┬──────┘
              │             │                 │
              └─────────────┼─────────────────┘
                            │
                   ┌────────▼─────────┐
                   │ Artifact Builder │  ← transforms raw captures into artifacts
                   │    (build/)      │
                   └────────┬─────────┘
                            │
                   ┌────────▼─────────┐
                   │ Cross-Reference  │  ← wires bidirectional links
                   │    (build/)      │
                   └────────┬─────────┘
                            │
                   ┌────────▼─────────┐
                   │  Writer (output/)│  ← writes JSON files + screenshots
                   └──────────────────┘
```

---

## Data Flow

The scanner transforms data through 7 stages:

```
1. CONFIG          JSON file → validated ScanConfig object
2. AUTH            ScanConfig → browser session with cookies/storage saved
3. ROUTE EXPLORE   For each route: navigate → capture DOM + screenshots + API calls → PageCapture[]
4. FLOW EXECUTE    For each flow: replay steps → capture per-step API calls + states → FlowCapture[]
5. BUILD           PageCapture[] + FlowCapture[] + ApiCalls[] → PageArtifact[] + FlowArtifact[] + EndpointArtifact[] + ComponentArtifact[]
6. CROSS-REF       Wire bidirectional IDs across all artifacts (pages ↔ endpoints ↔ flows ↔ components)
7. OUTPUT          Write scan-output.json + individual artifact files + screenshots to disk
```

---

## Directory Reference

### `src/config/` — Configuration Loading and Validation

#### `loader.ts`

Reads a JSON file from disk, parses it, and runs it through Zod validation. If validation fails, the error propagates and the scan aborts. The validated config object is the single source of truth for the entire scan.

#### `schema.ts`

Defines the shape and defaults of the scan configuration. Key defaults that affect behavior:

- **Browser**: headless mode on, 1280x720 viewport, 30s timeout, 5s network idle window
- **Safety**: 60 requests/minute rate limit, DELETE requests blocked, no URL patterns blocked
- **API Capture**: includes `**/api/**` URLs, excludes static assets (.js, .css, .png, .jpg, .svg, .woff), captures payloads up to 10KB, does not capture headers
- **Output**: writes to `./output/` with screenshots in a `screenshots/` subdirectory

The auth section is optional. If absent, the scanner skips authentication entirely. Routes and targetUrl are the only required fields.

---

### `src/core/` — Orchestration, Browser, Safety, Sessions

#### `scanner.ts` — The Orchestrator

This is the main pipeline. It runs these steps in order:

1. Create screenshot output directory
2. Launch Chromium via Playwright
3. If auth is configured: log in, save session
4. For each configured route: navigate, capture DOM/screenshots/API calls
5. For each configured flow: replay steps with per-step captures
6. Collect all intercepted API calls
7. Build structured artifacts from raw captures
8. Write everything to disk
9. Close browser

If any step throws, the browser is still closed (finally block).

#### `browser.ts` — Browser Lifecycle

Manages a single Chromium instance and a single browser context. The context persists across all page navigations, which means cookies and session state carry over between routes. The viewport and timeout are set from config.

#### `safety.ts` — Rate Limiting and Request Blocking

**Rate limiting algorithm**: Maintains an array of timestamps for recent requests. On each check, it removes timestamps older than 60 seconds (sliding window). If the remaining count exceeds `maxRequestsPerMinute`, `waitForRateLimit()` polls every 100ms until the window clears.

**Request blocking**: Checks two conditions:

1. If `blockDestructiveMethods` is true and the HTTP method is DELETE → block
2. If the URL matches any pattern in `blockedUrlPatterns` → block

Pattern matching uses the glob logic from `utils/url.ts`.

#### `session.ts` — Authentication Session Persistence

After login, saves three things:

1. All cookies from the browser context
2. All localStorage key-value pairs (via `page.evaluate`)
3. All sessionStorage key-value pairs (via `page.evaluate`)

Can restore this state to a new page/context. Also detects which session mechanism is in use (cookie > localStorage > sessionStorage > unknown) by checking which store has data.

---

### `src/capture/` — Data Capture from Browser

#### `network-interceptor.ts` — API Call Interception and Categorization

**How it works**: Attaches three event listeners to a Playwright page:

1. **`framenavigated`** — Records the navigation timestamp. This is the reference point for the "network idle window."
2. **`request`** — When a request fires, checks if the URL matches include/exclude patterns. If it passes, stores the request metadata in a `pendingRequests` map keyed by request ID.
3. **`response`** — When the response arrives, looks up the pending request, captures response status/payload, categorizes the call, and pushes it to the `calls` array.

**Categorization logic** (the core decision):

- If the request happened within `networkIdleTimeout` (default 5s) after the last navigation → **`page_load`**
- If `actionInProgress` flag is true (set by Interaction class during clicks/fills/submits) → **`user_action`**
- Otherwise → **`background`**

**URL filtering**: A URL is captured only if it matches at least one `includePatterns` AND does not match any `excludePatterns` AND is not a static asset. Static asset detection checks file extensions (.js, .css, .png, .jpg, .gif, .svg, .woff, .woff2, .ttf, .ico).

**Payload capture**: If enabled, captures request body and response body. Response body is read via `response.text()`. Payloads exceeding `maxPayloadSize` are truncated. JSON payloads are parsed into objects; non-JSON stays as strings.

#### `dom-analyzer.ts` — DOM Structure Extraction

Runs a single `page.evaluate()` call that extracts 7 element categories from the live DOM:

| Category     | What it finds                                              | Key data captured                                                                  |
| ------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Headings** | h1–h6                                                      | level (1-6), text content                                                          |
| **Buttons**  | `<button>`, `[role="button"]`, `input[type=submit/button]` | text, CSS selector, disabled state                                                 |
| **Links**    | `<a href>`                                                 | text, href, CSS selector                                                           |
| **Forms**    | `<form>` with child inputs                                 | selector, action URL, method, array of inputs (name, type, label, required, value) |
| **Tables**   | `<table>`                                                  | selector, header texts, row count                                                  |
| **Dialogs**  | `<dialog>`, `[role="dialog"]`, `.modal`                    | open state, title, selector                                                        |
| **Alerts**   | `[role="alert"]`, `.alert`, `.notification`, `.toast`      | text, type (from class name), selector                                             |

**Selector generation algorithm**: For each element, generates a CSS selector using this priority:

1. If element has an `id` → `#theId`
2. If element has classes → `tag.class1.class2`
3. If element is the only child of its type under parent → `parent > tag`
4. Otherwise → `tag:nth-of-type(n)`

#### `screenshot.ts` — Screenshot Capture

Captures full-page PNG screenshots using Playwright's `page.screenshot({ fullPage: true })`. Screenshots are saved to disk immediately.

**File naming**: `{sanitized_route}_{label}_{timestamp}.png` where the route has `/` replaced with `_`. Example: `_dashboard_default_1710000000.png`.

Also supports element-level screenshots via `page.locator(selector).screenshot()`, returning null if the element isn't found.

#### `state-detector.ts` — UI State Heuristics

Detects 7 UI states by checking for the presence of specific CSS selectors in the DOM:

| State           | Selectors checked                                                                                                          | Logic                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **loading**     | `[class*="loading"]`, `[class*="spinner"]`, `[class*="skeleton"]`, `[role="progressbar"]`, `.loader`, `[aria-busy="true"]` | First visible match wins              |
| **empty**       | `[class*="empty"]`, `[class*="no-data"]`, `[class*="no-results"]`, `[class*="placeholder"]`                                | First visible match wins              |
| **error**       | `[class*="error"]`, `[role="alert"]`, `[class*="danger"]`, `[class*="failure"]`                                            | Must be visible AND have text content |
| **success**     | `[class*="success"]`, `[class*="toast"]`, `[class*="notification"]`                                                        | First visible match wins              |
| **disabled**    | `button:disabled`, `input:disabled`, `[disabled]`                                                                          | Any disabled element on page          |
| **dialog_open** | `dialog[open]`, `[role="dialog"]`, `.modal.show`                                                                           | First visible match wins              |
| **validation**  | `[class*="validation"]`, `[class*="invalid"]`, `.field-error`, `[aria-invalid="true"]`                                     | First visible match wins              |

"Visible" means `getComputedStyle(el).display !== "none"`.

---

### `src/explore/` — Page Navigation and Interaction

#### `route-explorer.ts` — Route-by-Route Scanning

For each route in the config:

1. Wait for rate limit clearance
2. Build full URL from `targetUrl + route`
3. Set the interceptor's current page context (so API calls get tagged to this page)
4. Navigate with `waitUntil: "networkidle"` (waits until no new network requests for 500ms)
5. Get page title
6. Run DOM analyzer → DomSnapshot
7. Run state detector → DetectedState[]
8. Capture full-page screenshot
9. Collect all API calls the interceptor recorded for this page
10. Package everything into a PageCapture object

If navigation fails (timeout, DNS error, etc.), the route is skipped and the scanner continues with the next one.

#### `auth-handler.ts` — Login Flow

Executes when `config.auth` is present:

1. Navigate to `targetUrl + loginUrl`
2. Analyze the login page DOM (captures form structure)
3. Fill the username field: finds `input[name="{usernameField}"]` and types the username
4. Fill the password field: finds `input[name="{passwordField}"]` and types the password
5. Click submit: uses `submitSelector` if provided, otherwise finds the first `button[type="submit"]` or first `button`
6. Wait for navigation (page redirect after login)
7. If `successIndicator` is set: wait for that selector to appear. If it doesn't appear within timeout → throw error, abort scan
8. Save session state (cookies + localStorage + sessionStorage)
9. Collect any API calls made during login (typically the login POST)
10. Return AuthResult with all captured data

#### `flow-runner.ts` — User Journey Replay

For each configured flow:

1. Clear the interceptor's call buffer
2. For each step in the flow:
   a. Record which page we're on
   b. Execute the action via Interaction class
   c. Wait `waitAfter` milliseconds (default 1000ms)
   d. Tag any API calls made during this step with the flow step ID
   e. Detect UI states after the action
   f. Take a screenshot
   g. Package into FlowStepCapture
3. Collect all API calls across all steps
4. Record all unique page IDs visited during the flow

#### `interaction.ts` — Safe Action Execution

Wraps Playwright actions with interceptor action tracking. Every action method:

1. Calls `interceptor.markActionStart(description)` — sets the `actionInProgress` flag so any API calls during the action get categorized as `user_action`
2. Executes the Playwright action
3. Calls `interceptor.markActionEnd()` — clears the flag

**Actions supported**:

- **click**: `page.locator(selector).click()` + wait for network idle
- **fill**: `page.locator(selector).clear()` then `fill(value)`
- **select**: `page.locator(selector).selectOption(value)`
- **hover**: `page.locator(selector).hover()`
- **submit**: uses `page.evaluate()` to call `.submit()` on the form element directly
- **navigate**: `page.goto(url)` with rate limit check
- **wait**: simple `setTimeout` delay

---

### `src/build/` — Artifact Construction

#### `artifact-builder.ts` — Assembly Orchestrator

Takes all raw captures and assembles the final ScanOutput:

1. `buildPages(pageCaptures)` → PageArtifact[]
2. `buildFlows(flowCaptures)` → FlowArtifact[]
3. `buildEndpoints(allApiCalls)` → EndpointArtifact[]
4. `buildComponents(pageCaptures)` → ComponentArtifact[]
5. `buildAuth(authResult)` → AuthenticationArtifact | null
6. Collect all screenshots from page captures
7. `crossReference(output, allApiCalls)` — mutates artifacts to add bidirectional links
8. Return complete ScanOutput

#### `page-builder.ts`

Transforms each PageCapture into a PageArtifact. Direct mapping of route, title, DOM snapshot, auth status. Extracts screenshot IDs and API call IDs. Filters detected states to only include those where `detected: true`.

#### `flow-builder.ts`

Transforms each FlowCapture into a FlowArtifact. Maps step captures to FlowStep objects. Collects unique page IDs and API call IDs across all steps.

#### `endpoint-builder.ts` — Endpoint Grouping

Groups individual API calls into endpoint patterns:

1. For each API call, normalize the URL to an endpoint pattern (via `normalizeEndpointPattern`)
2. Group calls by their normalized pattern
3. For each group: collect unique HTTP methods, pick one request/response example per method, collect unique page IDs
4. Produce EndpointArtifact with the pattern, methods, examples, and page associations

#### `component-builder.ts` — Component Detection

Scans page DOMs for three specific HTML element types:

- **Forms** (`<form>`) — Named by joining input `name` attributes (e.g., "Form: email-password")
- **Tables** (`<table>`) — Named by first 3 header texts (e.g., "Table: Name, Status, Date")
- **Dialogs** (`<dialog>`, `[role="dialog"]`, `.modal`) — Named by title element or index

Uses a `seen` Set to deduplicate across pages. Only detects native HTML elements — custom React/Vue components that don't use these tags are NOT detected by the scanner (the reverse-ui-doc-generator skill infers those later from repeated DOM patterns).

#### `auth-builder.ts`

Builds the AuthenticationArtifact from the auth handler's result. Extracts login form inputs from the DOM snapshot, identifies the login API endpoint (the first POST call during login), records the redirect URL, and gets the session mechanism type from SessionManager.

#### `cross-reference.ts` — Bidirectional Link Wiring

This is the final processing step. It mutates the built artifacts to establish relationships:

1. **Pages ↔ Components**: For each component, its `pageIds` are already set. For each page, populate `componentIds` with components that reference this page.
2. **Flows → Endpoints**: For each flow's API calls, find matching endpoints and add the flow ID to the endpoint's `flowIds`.
3. **Auth → Pages**: If auth exists, find pages whose routes don't match the login route and mark them as `protectedPageIds`.
4. **Auth → Flows**: If a flow visits the login page, add it to auth's `relatedFlowIds`.
5. **Components ↔ Flows**: If a flow visits a page that has components, add the flow ID to those components' `relatedFlowIds`.
6. **Components ↔ API Calls**: For each page's API calls, associate them with all components on that page (stored in `relatedApiCallIds`).
7. **No-API flag**: Pages with zero API calls get a state `{ name: "no_api_interactions" }` appended.

---

### `src/output/` — File Writing

#### `writer.ts`

Creates the output directory (recursive mkdir) and writes these files:

| File                  | Content                                              |
| --------------------- | ---------------------------------------------------- |
| `scan-output.json`    | Complete ScanOutput object (everything in one file)  |
| `pages.json`          | PageArtifact array only                              |
| `flows.json`          | FlowArtifact array only                              |
| `endpoints.json`      | EndpointArtifact array only                          |
| `components.json`     | ComponentArtifact array only                         |
| `screenshots.json`    | Screenshot metadata array                            |
| `authentication.json` | AuthenticationArtifact (only if auth was configured) |

All files are pretty-printed JSON (2-space indent). Screenshots PNGs are written separately by the ScreenshotCapture class during the explore phase.

---

### `src/utils/` — Shared Utilities

#### `logger.ts`

Pino-based structured JSON logger. Log level from `LOG_LEVEL` env var (default: "info"). `createChildLogger(name)` creates a child logger with a `module` field for filtering.

#### `id.ts` — Deterministic Artifact IDs

All artifact IDs are deterministic (not random UUIDs). Format: `type:identifier`.

| ID function                           | Format                                   | Example                         |
| ------------------------------------- | ---------------------------------------- | ------------------------------- |
| `pageId("/users")`                    | `page:{route}`                           | `page:/users`                   |
| `endpointId("GET", "/api/users/:id")` | `endpoint:METHOD:pattern`                | `endpoint:GET:/api/users/:id`   |
| `flowId("login")`                     | `flow:{name}`                            | `flow:login`                    |
| `flowStepId("login", 0)`              | `flowstep:{name}:{order}`                | `flowstep:login:0`              |
| `componentId("form", "/login", 0)`    | `component:{type}:{route}:{index}`       | `component:form:/login:0`       |
| `screenshotId(route, label, ts)`      | `screenshot:{route}:{label}:{timestamp}` | `screenshot:/:default:2026-...` |
| `apiCallId(method, url, ts)`          | `apicall:{method}:{url}:{timestamp}`     | `apicall:GET:https://...`       |

Route normalization: strips trailing slashes, ensures leading slash.

#### `url.ts` — URL Normalization and Pattern Matching

**Endpoint normalization** (`normalizeEndpointPattern`): Takes a full URL, extracts the pathname, and replaces dynamic segments with `:id`:

- Numeric segments (`/users/123`) → `/users/:id`
- UUIDs (`/items/550e8400-e29b-...`) → `/items/:id`
- MongoDB ObjectIds (24-char hex like `/docs/507f1f77bcf86cd799439011`) → `/docs/:id`

This groups API calls to the same endpoint regardless of which specific resource was accessed.

**Pattern matching** (`matchesPattern`): Converts glob patterns to regex:

- `**` → matches any number of path segments (`.*`)
- `*` → matches within a single segment (`[^/]*`)
- `?` → matches a single character (`.`)
- Special regex chars are escaped

Used by safety guards (blocked URL patterns) and network interceptor (include/exclude patterns).

---

### `src/types/` — Data Shape Definitions

Brief summary of the data structures (see the artifact JSON files for concrete examples):

- **ScanOutput**: Top-level container with metadata (URL, date, duration), authentication, pages, flows, components, endpoints, screenshots
- **PageArtifact**: A visited route with its DOM snapshot, screenshot refs, API call refs, detected states, auth requirement
- **FlowArtifact**: A named user journey with ordered steps, each step having an action, page context, API calls, and resulting state
- **EndpointArtifact**: A normalized API endpoint pattern with observed HTTP methods, request/response examples, and page/flow associations
- **ComponentArtifact**: A detected UI component (form/table/dialog) with page locations, states, and related flows/API calls
- **CapturedApiCall**: A single network request with full URL, method, payloads, response status, category (page_load/user_action/background), and context (which page, which action)
- **DomSnapshot**: Page structure with headings, buttons, links, forms, tables, dialogs, alerts

---

### `docs/reverse-ui-doc-generator/` — Documentation Generation Skill

Contains the reverse-ui-doc-generator skill source files. This skill takes the scanner's JSON output artifacts and generates human-readable documentation:

- Component inventory (inferred reusable components beyond forms/tables/dialogs)
- Page documentation
- API documentation
- Storybook draft outlines
- Validation reports

Key files: `SKILL.md` (when to use), `CORE.md` (mission and rules), `OPERATIONS.md` (workflow stages), `EXECUTION.md` (step-by-step run sequence), `PROMPTS.md` (prompt templates), `WORKFLOW.md` (end-to-end flow), `SCANNER.md` (how to collect artifacts), `CONFIG.json` (skill metadata).

### `.claude/skills/reverse-ui-doc-generator/` — Installed Skill Copy

Same files as `docs/reverse-ui-doc-generator/`, installed for Claude to use as a local project skill.

---

## Key Algorithms

### Network Call Categorization

```
if (now - lastNavigationTime) < networkIdleTimeout (5s)
  → page_load
else if actionInProgress flag is set
  → user_action
else
  → background
```

The `actionInProgress` flag is toggled by the Interaction class around every click/fill/submit action.

### Rate Limiting (Sliding Window)

```
on each request:
  1. remove timestamps older than 60s from the window
  2. if window.length >= maxRequestsPerMinute → wait
  3. else → add current timestamp, proceed
```

Wait polling interval: 100ms.

### Endpoint URL Normalization

```
pathname segments are checked against:
  /^\d+$/           → numeric ID      → replace with :id
  /^[0-9a-f]{24}$/  → MongoDB ObjectId → replace with :id
  /^[0-9a-f]{8}-...$/ → UUID v4       → replace with :id
```

### Cross-Reference Wiring Order

The order matters because later steps depend on earlier ones:

1. Pages ↔ Components (component pageIds → page componentIds)
2. Flows → Endpoints (flow API calls → endpoint flowIds)
3. Auth → Protected Pages (non-login pages → auth protectedPageIds)
4. Auth → Related Flows (flows visiting login → auth relatedFlowIds)
5. Components ↔ Flows (flow pages with components → component relatedFlowIds)
6. Components ↔ API Calls (page API calls → component relatedApiCallIds)
7. No-API flagging (pages with 0 API calls get "no_api_interactions" state)

---

## CLI Usage

```bash
# Development (via tsx — WARNING: has __name bug with page.evaluate)
npx tsx src/index.ts --config scan-config.json

# Production (compile first, then run — recommended)
npm run build && node dist/index.js --config scan-config.json

# Options
--config <path>    # Required: path to scan config JSON
--output <dir>     # Override output directory
--headed           # Show browser window
--verbose          # Debug-level logging
```

---

## Known Issues

### tsx/esbuild `__name` injection in `page.evaluate()`

**Problem**: When running via `npx tsx` (which uses esbuild under the hood), esbuild injects a `__name` helper function for all function declarations (and sometimes arrow functions assigned to `const`). Code inside `page.evaluate()` is serialized and executed in the browser context, where `__name` doesn't exist — causing `ReferenceError: __name is not defined`.

**Affected file**: `src/capture/dom-analyzer.ts` (the `getSelector` function inside `page.evaluate`)

**Workaround**: Build with `tsc` first (`npm run build`) and run the compiled JS (`node dist/index.js`). The compiled output doesn't inject `__name`.

**Root cause**: esbuild's `keepNames` option (enabled by default in tsx) decorates functions to preserve `.name` property, but this decoration doesn't work in browser evaluate contexts.

### Component Detection Limitations

The scanner only detects components that use native HTML tags: `<form>`, `<table>`, `<dialog>`. Custom React/Vue/Svelte components (e.g., HeadlessUI `Disclosure`, custom card components, modals using `div[role="dialog"]` with class `.modal`) may be missed. The `[role="dialog"]` and `.modal` selectors help catch some custom modals, but coverage is limited.

The reverse-ui-doc-generator skill compensates by inferring components from repeated DOM patterns across pages.
