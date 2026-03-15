# Scanner Integration — Collecting Artifacts with web-playwright-scanner

This document describes how to use the `web-playwright-scanner` to collect the artifacts required by the reverse-ui-doc-generator skill.

---

## When to Use

Use this process when the user provides a URL but no pre-existing artifacts (`pages.json`, `flows.json`, `endpoints.json`, `components.json`).

---

## Questions Checklist

Before running the scanner, gather the following information from the user. Ask these questions in order, skipping optional sections when the user declines.

### 1. Target URL (required)

> What is the URL of the application to scan?

This is the base URL. All routes are resolved relative to it.

### 2. Routes (required)

> What pages/routes should be scanned? List the URL paths (e.g., `/`, `/dashboard`, `/users`, `/settings`).

If the user is unsure, suggest starting with `/` and any top-level navigation links they know about.

### 3. Authentication (optional)

> Does the application require login to access the pages you want scanned?

If yes, ask:

| Question                                                      | Config Field                     | Default      |
| ------------------------------------------------------------- | -------------------------------- | ------------ |
| What is the login page URL path?                              | `auth.loginUrl`                  | —            |
| What username/email should be used?                           | `auth.credentials.username`      | —            |
| What password should be used?                                 | `auth.credentials.password`      | —            |
| What is the name attribute of the username input?             | `auth.credentials.usernameField` | `"email"`    |
| What is the name attribute of the password input?             | `auth.credentials.passwordField` | `"password"` |
| CSS selector for the submit button? (optional, auto-detected) | `auth.submitSelector`            | auto         |
| CSS selector visible after successful login? (optional)       | `auth.successIndicator`          | —            |

### 4. User Flows (optional)

> Are there specific user journeys you want to capture? (e.g., search for a product, create a user, submit a form)

If yes, for each flow ask:

- **Flow name** (e.g., `"login"`, `"create-user"`, `"search"`)
- **Steps** — each step needs:
  - `action`: one of `navigate`, `click`, `fill`, `select`, `hover`, `wait`, `submit`
  - `selector`: CSS selector for the target element (not needed for `navigate` or `wait`)
  - `value`: value to type or select (needed for `fill` and `select`)
  - `url`: URL path (needed for `navigate`)
  - `description`: human-readable step description
  - `waitAfter`: milliseconds to wait after the action (default: `1000`)

### 5. API Capture Patterns (optional)

> What URL patterns contain API calls? (default: `**/api/**`)

Ask if the app uses a different API path convention (e.g., `**/graphql**`, `**/v1/**`, `**/rest/**`).

Also ask:

- Any API paths to exclude? (e.g., telemetry, analytics)
- Should request/response headers be captured? (default: no)
- Should request/response payloads be captured? (default: yes)

### 6. Safety (optional)

> Are there any URLs that should be blocked during scanning? (e.g., delete endpoints, admin destructive actions)

Defaults:

- Destructive HTTP methods (DELETE) are blocked
- Rate limit: 60 requests/minute

### 7. Output Location (required)

> Where should the scan results and generated documentation be saved?

Always ask this question. The user must confirm or provide a directory path. This location is used for both the scanner output (artifacts, screenshots) and the skill's generated documentation.

- Set via config: `output.directory` in `scan-config.json`
- Set via CLI flag: `--output <dir>` (overrides config value)
- The screenshots subdirectory can also be customized: `output.screenshotsDir` (default: `"screenshots"`)
- Default if the user accepts: `./output`

### 8. Browser Mode (optional)

> Should the browser be visible during scanning? (default: headless/invisible)

---

## Building the Config File

After collecting answers, generate a `scan-config.json` file. Use this template:

```json
{
  "targetUrl": "<TARGET_URL>",
  "auth": {
    "loginUrl": "<LOGIN_PATH>",
    "credentials": {
      "usernameField": "<USERNAME_FIELD_NAME>",
      "passwordField": "<PASSWORD_FIELD_NAME>",
      "username": "<USERNAME>",
      "password": "<PASSWORD>"
    },
    "submitSelector": "<SUBMIT_SELECTOR>",
    "successIndicator": "<SUCCESS_INDICATOR>"
  },
  "routes": ["<ROUTE_1>", "<ROUTE_2>"],
  "flows": [
    {
      "name": "<FLOW_NAME>",
      "steps": [
        {
          "action": "<ACTION>",
          "selector": "<SELECTOR>",
          "value": "<VALUE>",
          "url": "<URL>",
          "description": "<DESCRIPTION>",
          "waitAfter": 1000
        }
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
    "blockedUrlPatterns": [],
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

Remove the `auth` block if no authentication is needed. Remove `flows` if no user journeys are defined. Omit optional fields to use defaults.

---

## Running the Scanner

```bash
# From the project root
npx tsx src/index.ts --config scan-config.json

# With visible browser
npx tsx src/index.ts --config scan-config.json --headed

# With debug logging
npx tsx src/index.ts --config scan-config.json --verbose

# Custom output directory
npx tsx src/index.ts --config scan-config.json --output ./my-results
```

---

## Scanner Output to Skill Input Mapping

After the scanner completes, the output directory contains the artifacts needed by the reverse-ui-doc-generator skill:

| Scanner Output File   | Skill Input Artifact                   |
| --------------------- | -------------------------------------- |
| `pages.json`          | pages artifact                         |
| `flows.json`          | flows artifact                         |
| `endpoints.json`      | endpoints artifact                     |
| `components.json`     | components artifact                    |
| `authentication.json` | auth artifact (optional)               |
| `screenshots/`        | screenshots (optional)                 |
| `scan-output.json`    | complete scan (all artifacts combined) |

The skill can proceed with documentation generation once these files exist in the output directory.

---

## Minimal Quick-Start Config

For a public site with no auth and no flows, the minimum config is:

```json
{
  "targetUrl": "https://example.com",
  "routes": ["/"]
}
```

This will scan the homepage, capture any API calls matching `**/api/**`, take screenshots, and detect components.
