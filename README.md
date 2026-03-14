# Web Playwright Scanner

A Playwright-based web application scanner that automatically documents UI pages, captures API calls, takes screenshots, and produces cross-referenced artifacts describing how the frontend and backend interact.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
- [Configuration Reference](#configuration-reference)
  - [Minimal Config](#minimal-config)
  - [Full Config](#full-config)
  - [targetUrl](#targeturl)
  - [routes](#routes)
  - [auth](#auth)
  - [flows](#flows)
  - [browser](#browser)
  - [safety](#safety)
  - [apiCapture](#apicapture)
  - [output](#output)
- [Flow Step Actions](#flow-step-actions)
- [Output](#output-artifacts)
  - [scan-output.json](#scan-outputjson)
  - [Individual Artifact Files](#individual-artifact-files)
  - [Screenshots](#screenshots)
- [Artifact Types](#artifact-types)
  - [Pages](#pages)
  - [Flows](#flows-1)
  - [Endpoints](#endpoints)
  - [Components](#components)
  - [Authentication](#authentication)
- [API Call Categorization](#api-call-categorization)
- [Examples](#examples)
  - [Public Site (No Auth)](#public-site-no-auth)
  - [Authenticated App](#authenticated-app)
  - [E-Commerce Flow](#e-commerce-flow)
- [Development](#development)
- [Architecture](#architecture)
- [License](#license)

---

## Features

- **Route Exploration** — Navigate to configured routes and capture page structure, screenshots, and API calls
- **Authentication Support** — Log in with credentials, maintain sessions across the scan
- **User Flow Execution** — Run step-by-step user journeys (login, CRUD, search, etc.)
- **API Capture & Categorization** — Intercept all XHR/fetch requests and classify them as page load, user action, or background
- **DOM Analysis** — Extract headings, buttons, links, forms, tables, dialogs, and alerts from every page
- **UI State Detection** — Detect loading, empty, error, success, disabled, dialog, and validation states
- **Screenshot Capture** — Full-page screenshots for every route and flow step
- **Component Detection** — Heuristic identification of reusable components (forms, tables, dialogs)
- **Cross-Referenced Artifacts** — Bidirectional links between pages, endpoints, flows, and components
- **Missing API Detection** — Explicitly flags pages that trigger no API calls
- **Safety Guards** — Rate limiting, destructive method blocking, URL pattern blocking

## Requirements

- Node.js >= 18
- npm >= 9

## Installation

```bash
git clone <repository-url>
cd webPlaywrightScanner
npm install
```

Install Playwright browsers (first time only):

```bash
npx playwright install chromium
```

## Quick Start

1. Create a config file `my-scan.json`:

```json
{
  "targetUrl": "https://your-app.com",
  "routes": ["/", "/about", "/contact"]
}
```

2. Run the scan:

```bash
npx tsx src/index.ts --config my-scan.json
```

3. Find results in `./output/`:
   - `scan-output.json` — Complete scan results
   - `pages.json`, `endpoints.json`, etc. — Individual artifacts
   - `screenshots/` — Captured screenshots

## CLI Usage

```
Usage: web-scanner [options]

Playwright-based web scanner that documents UI pages, API calls, and their relationships

Options:
  -V, --version          output the version number
  -c, --config <path>    Path to scan configuration JSON file (required)
  -o, --output <dir>     Output directory override
  --headed               Run browser in headed mode (visible browser window)
  --verbose              Enable verbose/debug logging
  -h, --help             display help for command
```

### Examples

```bash
# Basic scan
npx tsx src/index.ts --config scan-config.json

# See the browser while scanning
npx tsx src/index.ts --config scan-config.json --headed

# Custom output directory
npx tsx src/index.ts --config scan-config.json --output ./results

# Debug logging
npx tsx src/index.ts --config scan-config.json --verbose

# Combine options
npx tsx src/index.ts --config scan-config.json --headed --verbose --output ./my-results
```

### Using the built version

```bash
npm run build
node dist/index.js --config scan-config.json
```

---

## Configuration Reference

The configuration file is a JSON file validated at runtime with Zod. All fields except `targetUrl` and `routes` have sensible defaults.

### Minimal Config

```json
{
  "targetUrl": "https://example.com",
  "routes": ["/", "/about"]
}
```

### Full Config

```json
{
  "targetUrl": "https://example.com",
  "auth": {
    "loginUrl": "/login",
    "credentials": {
      "usernameField": "email",
      "passwordField": "password",
      "username": "admin@example.com",
      "password": "secret"
    },
    "submitSelector": "button[type='submit']",
    "successIndicator": ".dashboard-header"
  },
  "routes": ["/", "/dashboard", "/users", "/settings"],
  "flows": [
    {
      "name": "create-user",
      "steps": [
        { "action": "navigate", "url": "/users/new", "description": "Go to new user form" },
        { "action": "fill", "selector": "#name", "value": "John Doe", "description": "Enter name" },
        { "action": "fill", "selector": "#email", "value": "john@example.com", "description": "Enter email" },
        { "action": "click", "selector": "button[type='submit']", "description": "Submit form" }
      ]
    }
  ],
  "browser": {
    "headless": true,
    "viewport": { "width": 1280, "height": 720 },
    "timeout": 30000,
    "networkIdleTimeout": 5000
  },
  "safety": {
    "maxRequestsPerMinute": 60,
    "blockedUrlPatterns": ["**/admin/delete**"],
    "blockDestructiveMethods": true
  },
  "apiCapture": {
    "includePatterns": ["**/api/**"],
    "excludePatterns": ["**/*.js", "**/*.css", "**/*.png", "**/*.jpg", "**/*.svg", "**/*.woff*"],
    "captureHeaders": false,
    "capturePayloads": true,
    "maxPayloadSize": 10240
  },
  "output": {
    "directory": "./output",
    "screenshotsDir": "screenshots"
  }
}
```

---

### `targetUrl`

| | |
|---|---|
| **Type** | `string` (valid URL) |
| **Required** | Yes |
| **Description** | Base URL of the application to scan. All routes are resolved relative to this. |

```json
"targetUrl": "https://my-app.com"
```

---

### `routes`

| | |
|---|---|
| **Type** | `string[]` |
| **Required** | Yes |
| **Description** | List of URL paths to visit and document. Each route is navigated, and the page's DOM, screenshots, and API calls are captured. |

```json
"routes": ["/", "/dashboard", "/users", "/users/123", "/settings"]
```

---

### `auth`

| | |
|---|---|
| **Type** | `object` |
| **Required** | No |
| **Description** | Authentication configuration. If provided, the scanner logs in before exploring routes. |

| Field | Type | Default | Description |
|---|---|---|---|
| `loginUrl` | `string` | — | Path to the login page (resolved relative to `targetUrl`) |
| `credentials.username` | `string` | — | Username/email to enter |
| `credentials.password` | `string` | — | Password to enter |
| `credentials.usernameField` | `string` | `"email"` | Name attribute of the username input |
| `credentials.passwordField` | `string` | `"password"` | Name attribute of the password input |
| `submitSelector` | `string` | auto-detected | CSS selector for the submit button. If omitted, clicks the first `button[type="submit"]` or `button` |
| `successIndicator` | `string` | — | CSS selector that must be visible after login to confirm success. If provided and not found, the scan aborts |

```json
"auth": {
  "loginUrl": "/login",
  "credentials": {
    "usernameField": "email",
    "passwordField": "password",
    "username": "admin@example.com",
    "password": "secret123"
  },
  "submitSelector": "#login-btn",
  "successIndicator": ".welcome-message"
}
```

---

### `flows`

| | |
|---|---|
| **Type** | `FlowConfig[]` |
| **Required** | No |
| **Default** | `[]` |
| **Description** | User journeys to execute. Each flow is a named sequence of steps. API calls, screenshots, and state changes are captured at each step. |

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Flow name (used in artifact IDs, e.g., `flow:login`) |
| `steps` | `FlowStep[]` | Ordered list of actions to perform |

See [Flow Step Actions](#flow-step-actions) for step details.

```json
"flows": [
  {
    "name": "login",
    "steps": [
      { "action": "navigate", "url": "/login", "description": "Open login page" },
      { "action": "fill", "selector": "input[name='email']", "value": "user@test.com", "description": "Enter email" },
      { "action": "fill", "selector": "input[name='password']", "value": "pass", "description": "Enter password" },
      { "action": "click", "selector": "button[type='submit']", "description": "Submit" }
    ]
  }
]
```

---

### `browser`

| | |
|---|---|
| **Type** | `object` |
| **Required** | No |
| **Description** | Browser behavior settings. |

| Field | Type | Default | Description |
|---|---|---|---|
| `headless` | `boolean` | `true` | Run browser without a visible window. Override with `--headed` CLI flag |
| `viewport.width` | `number` | `1280` | Browser viewport width in pixels |
| `viewport.height` | `number` | `720` | Browser viewport height in pixels |
| `timeout` | `number` | `30000` | Default timeout for Playwright actions (ms) |
| `networkIdleTimeout` | `number` | `5000` | Time window after navigation during which API calls are classified as "page_load" (ms) |

```json
"browser": {
  "headless": false,
  "viewport": { "width": 1920, "height": 1080 },
  "timeout": 60000,
  "networkIdleTimeout": 3000
}
```

---

### `safety`

| | |
|---|---|
| **Type** | `object` |
| **Required** | No |
| **Description** | Safety controls to prevent the scanner from causing harm. |

| Field | Type | Default | Description |
|---|---|---|---|
| `maxRequestsPerMinute` | `number` | `60` | Rate limit for navigation requests |
| `blockedUrlPatterns` | `string[]` | `[]` | URL patterns to block (supports `**` and `*` wildcards) |
| `blockDestructiveMethods` | `boolean` | `true` | Block HTTP DELETE requests |

```json
"safety": {
  "maxRequestsPerMinute": 30,
  "blockedUrlPatterns": ["**/admin/delete**", "**/destroy**"],
  "blockDestructiveMethods": true
}
```

---

### `apiCapture`

| | |
|---|---|
| **Type** | `object` |
| **Required** | No |
| **Description** | Controls which network requests are captured and how much data is recorded. |

| Field | Type | Default | Description |
|---|---|---|---|
| `includePatterns` | `string[]` | `["**/api/**"]` | URL patterns to capture (wildcards supported) |
| `excludePatterns` | `string[]` | `["**/*.js", "**/*.css", ...]` | URL patterns to exclude |
| `captureHeaders` | `boolean` | `false` | Include request headers in captured data |
| `capturePayloads` | `boolean` | `true` | Include request/response bodies |
| `maxPayloadSize` | `number` | `10240` | Max payload size in bytes (truncated beyond this) |

```json
"apiCapture": {
  "includePatterns": ["**/api/**", "**/graphql**"],
  "excludePatterns": ["**/api/telemetry**"],
  "captureHeaders": true,
  "capturePayloads": true,
  "maxPayloadSize": 51200
}
```

---

### `output`

| | |
|---|---|
| **Type** | `object` |
| **Required** | No |
| **Description** | Controls where output files are written. |

| Field | Type | Default | Description |
|---|---|---|---|
| `directory` | `string` | `"./output"` | Root output directory. Override with `-o` CLI flag |
| `screenshotsDir` | `string` | `"screenshots"` | Subdirectory for screenshots (relative to `directory`) |

```json
"output": {
  "directory": "./scan-results",
  "screenshotsDir": "images"
}
```

---

## Flow Step Actions

Each step in a flow has an `action` type that determines what the scanner does:

| Action | Required Fields | Description |
|---|---|---|
| `navigate` | `url` | Navigate to a URL (resolved relative to `targetUrl`) |
| `click` | `selector` | Click an element matching the CSS selector |
| `fill` | `selector`, `value` | Clear and type a value into an input field |
| `select` | `selector`, `value` | Select an option in a `<select>` dropdown |
| `hover` | `selector` | Hover over an element |
| `submit` | `selector` | Programmatically submit a `<form>` element |
| `wait` | — | Wait for `waitAfter` milliseconds (default: 1000) |

### Common step fields

| Field | Type | Default | Description |
|---|---|---|---|
| `action` | `string` | — | One of the actions above (required) |
| `selector` | `string` | — | CSS selector for the target element |
| `value` | `string` | — | Value to type or select |
| `url` | `string` | — | URL for `navigate` action |
| `description` | `string` | — | Human-readable step description (required) |
| `waitAfter` | `number` | `1000` | Milliseconds to wait after the action completes |

### Example flow

```json
{
  "name": "search-and-filter",
  "steps": [
    { "action": "navigate", "url": "/products", "description": "Go to products page" },
    { "action": "fill", "selector": "input[name='search']", "value": "laptop", "description": "Type search term" },
    { "action": "click", "selector": ".search-btn", "description": "Click search" },
    { "action": "wait", "description": "Wait for results", "waitAfter": 2000 },
    { "action": "select", "selector": "#sort-by", "value": "price-asc", "description": "Sort by price" },
    { "action": "click", "selector": ".product-card:first-child", "description": "Open first result" }
  ]
}
```

---

## Output Artifacts

After a scan, the output directory contains:

```
output/
├── scan-output.json       # Complete scan results (all artifacts in one file)
├── pages.json             # Page artifacts only
├── flows.json             # Flow artifacts only
├── endpoints.json         # Endpoint artifacts only
├── components.json        # Component artifacts only
├── authentication.json    # Auth artifact (if auth was configured)
├── screenshots.json       # Screenshot metadata
└── screenshots/           # PNG files
    ├── _dashboard_default_1710000000.png
    ├── _users_default_1710000001.png
    └── ...
```

### `scan-output.json`

The main output file containing all artifacts and metadata:

```json
{
  "metadata": {
    "targetUrl": "https://example.com",
    "scanDate": "2026-03-14T10:30:00.000Z",
    "duration": 45200
  },
  "authentication": { ... },
  "pages": [ ... ],
  "flows": [ ... ],
  "components": [ ... ],
  "endpoints": [ ... ],
  "screenshots": [ ... ]
}
```

---

## Artifact Types

### Pages

Each visited route produces a page artifact:

```json
{
  "id": "page:/dashboard",
  "route": "/dashboard",
  "title": "Dashboard - My App",
  "dom": {
    "headings": [{ "level": 1, "text": "Dashboard" }],
    "buttons": [{ "text": "New Item", "selector": "#new-btn", "disabled": false }],
    "links": [{ "text": "Settings", "href": "/settings", "selector": "a.nav-link" }],
    "forms": [],
    "tables": [{ "selector": "#data-table", "headers": ["Name", "Status"], "rowCount": 15 }],
    "dialogs": [],
    "alerts": []
  },
  "screenshotIds": ["screenshot:/dashboard:default:2026-03-14T10:30:00.000Z"],
  "componentIds": ["component:table:/dashboard:0"],
  "apiCallIds": ["apicall:GET:https://example.com/api/stats:..."],
  "authRequired": true,
  "states": [{ "name": "default" }]
}
```

Pages with no API calls are flagged with a `"no_api_interactions"` state.

### Flows

Each configured flow produces a flow artifact with per-step details:

```json
{
  "id": "flow:login",
  "name": "login",
  "steps": [
    {
      "id": "flowstep:login:0",
      "order": 0,
      "description": "Enter email",
      "pageId": "page:/login",
      "action": "fill:input[name='email']",
      "apiCallIds": [],
      "resultingState": null,
      "screenshotId": "screenshot:/login:flow_login_step_0:..."
    }
  ],
  "pageIds": ["page:/login", "page:/dashboard"],
  "apiCallIds": ["apicall:POST:https://example.com/api/auth/login:..."]
}
```

### Endpoints

API calls are grouped by normalized endpoint pattern:

```json
{
  "id": "endpoint:GET:/api/users/:id",
  "endpointPattern": "/api/users/:id",
  "methods": ["GET", "PUT"],
  "requestExamples": [{ "method": "PUT", "payload": { "name": "Updated" } }],
  "responseExamples": [{ "method": "GET", "status": 200, "payload": { "id": 1, "name": "John" } }],
  "pageIds": ["page:/users"],
  "flowIds": ["flow:edit-user"],
  "componentIds": []
}
```

URL path segments that look like IDs (numeric, UUID, MongoDB ObjectId) are normalized to `:id`.

### Components

UI components detected heuristically from DOM structure:

```json
{
  "id": "component:form:/login:0",
  "name": "Form: email-password",
  "type": "form",
  "pageIds": ["page:/login"],
  "states": [],
  "screenshotIds": [],
  "relatedFlowIds": ["flow:login"],
  "relatedApiCallIds": ["apicall:POST:https://example.com/api/auth/login:..."]
}
```

Detected component types: `form`, `table`, `dialog`.

### Authentication

```json
{
  "id": "auth:login",
  "loginRoute": "/login",
  "authType": "form",
  "loginInputs": [
    { "name": "email", "type": "email", "label": "Email" },
    { "name": "password", "type": "password", "label": "Password" }
  ],
  "loginApiEndpoint": "/api/auth/login",
  "redirectAfterLogin": "/dashboard",
  "sessionMechanism": "cookie",
  "relatedFlowIds": ["flow:login"],
  "protectedPageIds": ["page:/dashboard", "page:/settings"]
}
```

---

## API Call Categorization

Captured API calls are classified into three categories:

| Category | When | Example |
|---|---|---|
| **page_load** | Fires within the network idle window after a navigation event, before any user action | Initial data fetch when a page loads |
| **user_action** | Fires during a user interaction (click, fill, submit) | Form submission, button click triggers API |
| **background** | Fires outside navigation and user action windows | Polling, telemetry, heartbeat |

Each captured call records:
- HTTP method and full URL
- Normalized endpoint pattern (e.g., `/api/users/:id`)
- Request/response payloads (if `capturePayloads` is enabled)
- Response status code
- Which page triggered it
- Which user action triggered it (if applicable)
- Timestamp

---

## Examples

### Public Site (No Auth)

Scan a public website with no login:

```json
{
  "targetUrl": "https://my-blog.com",
  "routes": ["/", "/posts", "/about", "/contact"],
  "apiCapture": {
    "includePatterns": ["**/api/**", "**/wp-json/**"]
  }
}
```

```bash
npx tsx src/index.ts --config blog-scan.json
```

### Authenticated App

Scan a dashboard app that requires login:

```json
{
  "targetUrl": "https://admin.example.com",
  "auth": {
    "loginUrl": "/login",
    "credentials": {
      "username": "admin@example.com",
      "password": "secure-password"
    },
    "successIndicator": "[data-testid='dashboard']"
  },
  "routes": ["/dashboard", "/users", "/reports", "/settings"],
  "browser": {
    "timeout": 60000
  }
}
```

### E-Commerce Flow

Scan product pages and execute a search flow:

```json
{
  "targetUrl": "https://shop.example.com",
  "routes": ["/", "/products", "/cart"],
  "flows": [
    {
      "name": "product-search",
      "steps": [
        { "action": "navigate", "url": "/products", "description": "Go to products" },
        { "action": "fill", "selector": "#search", "value": "headphones", "description": "Search for headphones" },
        { "action": "click", "selector": ".search-submit", "description": "Submit search" },
        { "action": "wait", "description": "Wait for results", "waitAfter": 2000 },
        { "action": "click", "selector": ".product-card:first-child a", "description": "Open first product" }
      ]
    },
    {
      "name": "add-to-cart",
      "steps": [
        { "action": "navigate", "url": "/products/1", "description": "Go to product detail" },
        { "action": "select", "selector": "#quantity", "value": "2", "description": "Select quantity" },
        { "action": "click", "selector": ".add-to-cart-btn", "description": "Add to cart" },
        { "action": "wait", "description": "Wait for cart update", "waitAfter": 1500 }
      ]
    }
  ],
  "safety": {
    "blockDestructiveMethods": true,
    "maxRequestsPerMinute": 30
  }
}
```

---

## Development

```bash
# Install dependencies
npm install

# Type-check
npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `info` | Logging level (`debug`, `info`, `warn`, `error`). Also set via `--verbose` flag |

---

## Architecture

```
src/
├── index.ts                  # CLI entry point
├── config/                   # Configuration schema (Zod) and loader
├── types/                    # TypeScript interfaces for all artifacts
├── core/
│   ├── scanner.ts            # Orchestrator — sequences the entire scan pipeline
│   ├── browser.ts            # Playwright browser lifecycle
│   ├── session.ts            # Auth session persistence
│   └── safety.ts             # Rate limiting and destructive action blocking
├── capture/
│   ├── network-interceptor.ts # Intercept & categorize API calls
│   ├── dom-analyzer.ts       # Extract page structure via page.evaluate()
│   ├── screenshot.ts         # Full-page and element screenshots
│   └── state-detector.ts     # Heuristic UI state detection
├── explore/
│   ├── route-explorer.ts     # Visit configured routes and capture data
│   ├── flow-runner.ts        # Execute user flow step sequences
│   ├── auth-handler.ts       # Login flow execution
│   └── interaction.ts        # Safe Playwright action wrappers
├── build/
│   ├── artifact-builder.ts   # Assemble all artifacts from raw captures
│   ├── *-builder.ts          # Per-artifact-type builders
│   └── cross-reference.ts    # Wire bidirectional IDs across artifacts
├── output/
│   └── writer.ts             # Write JSON + screenshots to disk
└── utils/                    # Logger, ID generation, URL normalization
```

### Scan Pipeline

1. **Config** — Load and validate JSON config
2. **Browser** — Launch Chromium, attach network interceptor
3. **Auth** — Log in if configured, save session
4. **Route Exploration** — Visit each route, capture DOM/screenshots/API calls
5. **Flow Execution** — Run each flow step-by-step with per-step captures
6. **Artifact Building** — Transform raw captures into typed artifacts
7. **Cross-Reference** — Wire bidirectional IDs (pages ↔ endpoints ↔ flows ↔ components)
8. **Output** — Write JSON files and screenshots to disk

---

## License

MIT
