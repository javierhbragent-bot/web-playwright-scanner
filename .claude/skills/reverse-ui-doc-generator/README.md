# reverse-ui-doc-generator

A skill pack for running the full reverse-engineering documentation workflow from crawler artifacts.

This skill is designed to work **after** a site scanner has already explored a web application and produced normalized artifacts.

## Included Files

- `SKILL.md` — main skill definition
- `CORE.md` — layer 1 core context
- `OPERATIONS.md` — layer 2 operational context
- `EXECUTION.md` — layer 3 execution context
- `PROMPTS.md` — prompt pack for each workflow stage
- `WORKFLOW.md` — end-to-end workflow and deliverables
- `CONFIG.json` — machine-readable summary of the skill

## Primary Goal

Turn normalized crawler artifacts into:

- page documentation
- component documentation
- API usage documentation
- Storybook draft documentation
- review and validation notes

## Required Inputs

- `pages.json`
- `flows.json`
- `endpoints.json`
- `components.json`
- `auth.json` (optional)
- screenshots
- ARIA summaries

## Important Constraints

- no live browsing
- no direct crawling
- no implementation guessing
- must distinguish `OBSERVED`, `INFERRED`, and `UNKNOWN`
- must include page-level API mapping
- must include authentication requirements when present