# API–UI Documentation Functional Model

## Purpose

Define functional requirements for documenting a web application by linking UI pages,
user interactions, and API calls discovered during automated exploration.

The goal is to ensure documentation explains how the UI and backend interact.
This document describes required system behaviors and artifacts, not implementation.

---

## Page-Level API Mapping

Every documented page must include the API interactions that occur on that page.

Documentation must associate browser-visible API calls with the UI pages where they occur.

Required fields:

- page URL or route
- API endpoint
- HTTP method
- request payload (if visible)
- response payload (if visible)
- response status
- UI action that triggered the request
- timestamp

### API Interaction Categories

**Page Load APIs**
Requests automatically executed when the page loads.

**User Action APIs**
Requests triggered directly by user interactions.

**Background APIs**
Requests triggered automatically such as polling or telemetry.

---

## Flow-Level API Mapping

User flows must include the API interactions triggered at each step.

Each flow must record:

- flow name
- ordered steps
- UI actions taken
- API calls triggered
- resulting UI state changes

---

## Storybook Documentation Integration

Generated Storybook documentation must include the data sources powering each UI component.

Each documentation entry must contain a **Data Source section** describing relevant APIs.

---

## Component-Level API Association

Reusable UI components must record the APIs they interact with.

Each component record should include related APIs when interactions are observed.

---

## Global API Inventory

Maintain a global inventory of all detected APIs.

Each endpoint record must include:

- endpoint pattern
- HTTP methods observed
- request examples
- response examples
- pages using the endpoint
- flows triggering the endpoint
- components related to the endpoint

---

## Artifact Relationship Model

Pages

- UI elements
- Screenshots
- Components used
- APIs used

Components

- States
- Screenshots
- Related APIs

Flows

- Steps
- Screens
- APIs triggered

Endpoints

- Methods
- Request examples
- Response examples

---

## Missing API Detection

If a page triggers no API calls the documentation must explicitly record:

API interactions: none detected
