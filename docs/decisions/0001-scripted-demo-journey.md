# ADR 0001: Scripted, static Switchpath demo journey

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

The hackathon needs one reliable, pitch-ready demonstration of Arc’s differentiation from a professional directory. The current Astro site is static, uses private-markets positioning, and has no working pathway or marketplace. Time does not justify production integrations or regulated-advice automation.

## Decision

Build one scripted Australian journey for an early-career graduate considering an investment property. Switchpath will generate an ordered pathway through a financial adviser, mortgage broker, tax accountant, and conveyancer, then fully demonstrate adviser matching and a fictional booking request.

Keep the Switchpath name and existing visual language. Implement as static Astro pages with local typed demo data, small client-side TypeScript interactions, and versioned `localStorage` state. Add no backend, accounts, payments, or external services.

Switchpath explains professional roles, sequence, and next steps. Licensed professionals—not Arc—provide financial, credit, tax, or legal advice. The user explicitly chooses which intake context is included in a booking request.

## Consequences

- The stage demo remains deterministic, resettable, and deployable as a static site.
- The team can spend its limited time on the complete consumer journey and presentation quality.
- Profiles, availability, credentials, and bookings are visibly fictional.
- Free-form AI intake, credential verification, real matching, payments, calendars, and broad scenario coverage remain future work.
- “Arc” remains the product name for this MVP; the decision can be revisited after the event.
