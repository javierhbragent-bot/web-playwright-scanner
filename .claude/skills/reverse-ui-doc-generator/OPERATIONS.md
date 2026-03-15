# Layer 2 — Operational Context

## Workflow Stages

The skill runs in six stages.

---

## Stage 1 — Artifact Understanding

### Objective

Build a clear internal understanding of the application based on the provided artifacts.

### Required Tasks

- read all artifact types
- summarize application structure
- summarize route coverage
- summarize observed flows
- identify authentication boundaries
- identify missing inputs or weak evidence

### Output

- `application_summary`
- `ambiguities_list`

---

## Stage 2 — Component Inference

### Objective

Infer likely reusable components from repeated patterns.

### Rules

- repeated UI structures across pages suggest candidate components
- page-specific sections should not automatically become reusable components
- observed states must come from artifacts
- confidence must be attached to each component grouping

### Required Output

- `component_inventory`

Each record should include:

- candidate name
- type
- pages observed on
- states observed
- related flows
- related APIs
- confidence level
- classification:
  - `OBSERVED_REUSABLE_PATTERN`
  - `LIKELY_REUSABLE_COMPONENT`
  - `UNCERTAIN_GROUPING`

---

## Stage 3 — API Interpretation

### Objective

Interpret raw captured traffic into readable, page-aware documentation.

### Rules

- normalize endpoint patterns conservatively
- map each endpoint to pages, flows, and components
- classify each endpoint usage as:
  - `PAGE_LOAD`
  - `USER_ACTION`
  - `BACKGROUND`
  - `AUTHENTICATION` when applicable
- do not infer hidden server logic

### Required Output

- `api_inventory`
- `page_api_mapping`
- `flow_api_mapping`
- `component_api_mapping`

---

## Stage 4 — Storybook Draft Generation

### Objective

Generate a first-pass Storybook outline from observed UI behavior.

### Rules

- create stories only for observed or strongly implied states
- include related APIs in a Data Source section
- include auth notes when relevant
- use `TODO_VALIDATE` for uncertain names or states
- do not invent exact source component props

### Required Output

- `storybook_outline`

Each component outline should include:

- title
- purpose
- observed states
- inferred states
- related APIs
- auth requirement
- mock/data requirements
- validation notes

---

## Stage 5 — Page and Component Documentation

### Objective

Generate readable docs for pages and reusable UI parts.

### Page Docs Must Include

- page purpose
- visible UI elements
- actions available
- components used
- API interactions
- auth requirement

### Component Docs Must Include

- component purpose
- observed states
- pages where seen
- related APIs
- confidence level
- validation notes

### Required Output

- `page_docs`
- `component_docs`

---

## Stage 6 — Review and Validation

### Objective

Prevent overclaiming and make uncertainty explicit.

### Required Tasks

- detect unsupported claims
- detect speculative descriptions
- identify missing evidence
- verify auth-related claims carefully
- produce a manual review checklist

### Required Output

- `validation_report`
