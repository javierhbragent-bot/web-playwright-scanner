# Layer 1 — Core Context

## Mission

Analyze artifacts captured from a web application and produce structured documentation that explains:

- how pages work
- how reusable UI components behave
- how APIs interact with the UI
- how user flows operate
- how authentication gates access to protected areas

The skill transforms **captured evidence** into **human-readable documentation**.

---

## Source of Truth

The source of truth is the crawler output, not the live site and not assumptions.

Primary sources:
- `pages.json`
- `flows.json`
- `endpoints.json`
- `components.json`
- `auth.json` if present
- screenshots
- ARIA summaries

---

## Documentation Model

The skill must produce documentation across five areas:

### 1. Pages
For each page:
- purpose
- visible UI elements
- user actions
- APIs used
- components used
- auth requirement

### 2. Components
For each likely reusable UI component:
- candidate name
- type
- where observed
- visible states
- related APIs
- confidence level

### 3. APIs
For each endpoint:
- readable summary
- pages using it
- flows triggering it
- components depending on it
- classification of usage

### 4. Storybook Draft
For each reusable component:
- story outline
- state list
- data source notes
- validation TODOs

### 5. Review Report
A final report showing:
- supported claims
- inferred claims
- uncertain claims
- missing evidence
- manual validation checklist

---

## Required Evidence Categories

The skill must recognize these evidence categories:

- visual evidence
- structural evidence
- flow evidence
- API evidence
- authentication evidence

---

## Evidence Labels

Every claim in the output must be one of:

- `OBSERVED`
- `INFERRED`
- `UNKNOWN`

These labels must be preserved through the entire workflow.

---

## Authentication Awareness

If authentication exists, the skill must include:

- login requirement
- login flow summary
- protected route notes
- authentication-related APIs
- post-login landing behavior if observed

If evidence is incomplete, this must be marked as `UNKNOWN`.