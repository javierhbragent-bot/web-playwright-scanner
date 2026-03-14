# Layer 3 — Execution Context

## Run Sequence

Execute the workflow in the following order.

---

## Step 1 — Load Inputs

Load:
- pages artifact
- flows artifact
- endpoints artifact
- components artifact
- authentication artifact if present
- screenshots if present
- ARIA summaries if present

Build a system overview before generating any docs.

Deliver:
- input completeness summary
- application overview

---

## Step 2 — Analyze Structure and Coverage

Determine:
- routes covered
- flows covered
- protected areas
- which pages have strong evidence
- which pages have weak or incomplete evidence

Deliver:
- coverage summary
- ambiguity list

---

## Step 3 — Infer Components

From repeated structures and states:
- identify candidate components
- separate page sections from reusable patterns
- attach confidence
- record observed states
- record related APIs
- note auth-gated usage when relevant

Deliver:
- component inventory

---

## Step 4 — Interpret APIs

Read normalized endpoints and generate:
- endpoint summaries
- page-level API mapping
- flow-level API mapping
- component-level related APIs

For each mapping, classify the relationship as page load, user action, background, or auth.

Deliver:
- API documentation pack

---

## Step 5 — Generate Component Docs

For each candidate reusable component, generate:
- purpose
- observed states
- inferred states
- pages observed on
- related APIs
- auth requirement
- confidence
- TODO_VALIDATE notes

Deliver:
- component docs

---

## Step 6 — Generate Page Docs

For each page, generate:
- page purpose
- visible UI elements
- actions available
- components used
- API interactions
- auth requirement
- observed versus inferred notes

Deliver:
- page docs

---

## Step 7 — Generate Storybook Draft

For each likely reusable component, generate:
- story title
- story/state list
- data source notes
- mock/data hints
- auth note if required
- validation TODOs

Deliver:
- Storybook outline pack

---

## Step 8 — Produce Review Report

Review the generated documentation against the source artifacts and classify claims as:
- `SUPPORTED`
- `INFERRED`
- `UNCERTAIN`

Also list:
- unsupported claims
- weak evidence
- missing states
- manual review checklist

Deliver:
- validation report

---

## Completion Condition

The run is complete when the skill has produced:
- application summary
- component inventory
- API documentation
- page docs
- component docs
- Storybook draft outline
- validation report