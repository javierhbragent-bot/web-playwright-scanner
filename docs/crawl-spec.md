# Crawl Specification

## Purpose

Define what the site scanner must explore when analyzing a live application.

This specification ensures the crawler captures meaningful evidence rather
than attempting to scan the entire website indiscriminately.

---

## Authentication Capability

The scanner must support accessing **authenticated areas of the application**.

Many modern applications hide the majority of functionality behind login.

The system must therefore support:

- logging in using valid credentials
- maintaining an authenticated session
- accessing protected routes
- exploring user dashboards and account areas
- capturing API calls and UI behavior within authenticated pages

Authentication must be treated as a **precondition for exploration** when required.

---

## Login Flow Documentation

If authentication exists, the system must document the login process as a flow.

The login flow record must include:

- login page route
- authentication method observed
- form inputs required
- API calls triggered during login
- redirect behavior after successful login
- failure states such as invalid credentials

Example conceptual flow:

Login Flow

1. Navigate to /login
2. Enter email and password
3. Submit form
4. API call to authentication endpoint
5. Redirect to dashboard

---

## Route Discovery Scope

The crawler must inspect a predefined set of important routes.

Examples:

- home page
- dashboard
- authentication pages
- entity listing pages
- entity detail pages
- settings pages

Routes should be prioritized based on:

- business importance
- feature complexity
- UI richness
- frequency of use

---

## User Flows to Explore

The crawler must execute representative user journeys.

Examples:

- login
- logout
- create item
- edit item
- delete confirmation
- search or filter
- open modal dialogs
- submit forms with errors
- submit valid forms

Flows should simulate realistic user behavior.

---

## UI States to Capture

For each page and component pattern attempt to capture:

- default state
- loading state
- empty state
- error state
- success state
- disabled state
- open or closed state for dialogs
- validation states for forms

---

## Evidence Types to Collect

### Visual Evidence

- page screenshots
- component screenshots

### Structural Evidence

- headings
- buttons
- links
- form inputs
- tables
- alerts
- dialogs

### Behavioral Evidence

- navigation transitions
- interaction outcomes
- UI state changes

### Network Evidence

- API requests
- request payloads
- response payloads
- response status codes

---

## Crawl Safety Principles

The crawler must avoid:

- destructive actions
- repeated submissions
- unintended data creation
- aggressive request loops

The crawler should behave like a normal user exploring the application.
