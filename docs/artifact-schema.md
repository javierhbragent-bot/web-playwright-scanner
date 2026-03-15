# Artifact Schema

## Purpose

Define the normalized artifacts produced by the scanning and analysis system.

Artifacts organize the captured evidence into structured records that can be
used by documentation generators and AI models.

---

## Authentication Artifact

If the application requires login, an authentication artifact must exist.

Fields:

- login route
- authentication type (form, OAuth, SSO, etc.)
- login inputs detected
- login API endpoint
- redirect destination after login
- session persistence mechanism

This artifact allows scanners and documentation systems to understand
how authentication gates the rest of the application.

---

## Pages Artifact

Each page record must include:

- route
- page title
- headings
- actions available
- forms present
- dialogs present
- alerts present
- screenshots
- components used
- APIs triggered
- authentication required (true/false)

---

## Flows Artifact

Each flow record must include:

- flow name
- ordered steps
- pages visited
- UI actions taken
- APIs triggered per step
- resulting UI states

Flows may include:

- authentication flows
- CRUD flows
- navigation flows

---

## Components Artifact

Each component record must include:

- component name
- component type
- pages where observed
- visible states
- screenshots
- related flows
- related APIs

Component classifications should remain tentative until confirmed by source code.

---

## Endpoints Artifact

Each endpoint record must include:

- endpoint pattern
- HTTP methods observed
- request examples
- response examples
- pages using the endpoint
- flows triggering the endpoint
- components related to the endpoint

---

## Artifact Relationships

Pages reference:

- components
- APIs
- screenshots

Flows reference:

- pages
- APIs

Components reference:

- pages
- APIs

Endpoints reference:

- pages
- flows
- components

Authentication artifact links to:

- login flows
- protected pages

These relationships ensure traceability between UI behavior and backend interactions.
