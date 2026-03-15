# Workflow

## End-to-End Workflow

This skill runs the documentation workflow in the following sequence.

### 0. Collect Artifacts (if needed)
If the user provides a URL but no pre-existing artifacts, run the scanner integration before proceeding. Follow the questions checklist in [SCANNER.md](SCANNER.md) to build a `scan-config.json`, run `npx tsx src/index.ts --config scan-config.json`, and verify the output directory contains `pages.json`, `flows.json`, `endpoints.json`, and `components.json`.

### 1. Input Review
Read all artifacts and determine whether evidence is complete enough to proceed.

### 2. System Understanding
Build an application-level summary with route coverage, flows, APIs, and auth boundaries.

### 3. Component Inference
Infer likely reusable UI components from repeated page patterns and screenshots.

### 4. API Mapping
Associate each observed endpoint with:
- pages
- flows
- components

### 5. Documentation Generation
Generate:
- page docs
- component docs
- API docs
- Storybook outlines

### 6. Review and Validation
Check all generated claims against the source artifacts and produce a manual review checklist.

---

## Required Deliverables

At minimum, a run should produce:

- `application_summary.md`
- `component_inventory.md`
- `api_inventory.md`
- `page_docs.md`
- `component_docs.md`
- `storybook_outline.md`
- `validation_report.md`

---

## Quality Gates

A run should fail quality review if:
- it invents hidden backend behavior
- it presents inferred claims as observed facts
- it omits page-level API mapping
- it ignores authentication evidence
- it generates Storybook states with no supporting evidence

---

## Success Criteria

A successful run:
- explains the application clearly
- connects UI pages to API behavior
- identifies likely reusable components
- produces a usable Storybook draft outline
- makes uncertainty explicit