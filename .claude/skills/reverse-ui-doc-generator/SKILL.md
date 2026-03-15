# SKILL: reverse-ui-doc-generator

## When to Use

Use this skill when you need to generate documentation for a web application.

**If artifacts already exist** (`pages.json`, `flows.json`, `endpoints.json`, `components.json`), proceed directly to documentation generation.

**If the user provides a URL but no artifacts**, use the scanner integration to collect artifacts first. Follow the questions checklist in [SCANNER.md](SCANNER.md) to gather the information needed to build a scan configuration, run the `web-playwright-scanner`, and then proceed with documentation generation.

Use it to produce:

- component inventory
- page documentation
- API usage documentation
- Storybook draft documentation
- review and validation notes

---

## Pre-requisite: Collecting Artifacts

If artifacts do not already exist, use the `web-playwright-scanner` to collect them. See [SCANNER.md](SCANNER.md) for the full process.

Summary:
1. Ask the user the questions from the checklist (target URL, routes, auth, flows, API patterns, safety, output, browser mode).
2. Generate a `scan-config.json` from the answers.
3. Run the scanner: `npx tsx src/index.ts --config scan-config.json`
4. Verify the output directory contains the required artifact files.
5. Proceed with the documentation workflow below.

---

## Goal

Turn normalized web-application exploration artifacts into a documentation and Storybook draft pack that explains:

- what pages exist
- what reusable UI components likely exist
- how the UI interacts with APIs
- how key user flows behave
- what is observed versus inferred versus unknown

---

## Inputs

Required:
- `pages.json`
- `flows.json`
- `endpoints.json`
- `components.json`

Optional:
- `auth.json`
- screenshots
- ARIA snapshots
- additional structured notes from the crawler

---

## Outputs

The skill must produce:

- component inventory
- page documentation
- API documentation
- Storybook draft outline
- mock/data guidance
- review and validation report

---

## Non-Negotiable Rules

1. Work only from provided artifacts.
2. Never invent hidden backend behavior.
3. Never assume source-code component APIs unless confirmed.
4. Always separate:
   - `OBSERVED`
   - `INFERRED`
   - `UNKNOWN`
5. Include page-level API mapping.
6. Include authentication and login requirements when evidence exists.
7. Prefer conservative documentation over speculative documentation.

---

## Execution Order

1. Read artifacts
2. Build system understanding
3. Infer reusable components
4. Interpret API usage
5. Generate Storybook draft
6. Generate page and component docs
7. Generate review report

---

## Deliverables

- `component_docs`
- `page_docs`
- `api_docs`
- `storybook_outline`
- `validation_report`