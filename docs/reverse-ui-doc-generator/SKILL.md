# SKILL: reverse-ui-doc-generator

## When to Use

Use this skill **after** a crawler has already collected and normalized artifacts for a web application.

Use it to convert those artifacts into:

- component inventory
- page documentation
- API usage documentation
- Storybook draft documentation
- review and validation notes

Do **not** use this skill to:

- crawl websites
- operate a browser
- capture screenshots
- capture network traffic
- discover routes directly from the live site

Those responsibilities belong to the crawler layer.

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
