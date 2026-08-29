# Task 1 report — integrated Arc demo journey

## Implementation summary

Replaced the accountant/investing prototype with the Arc financial-professional navigation demo. The static Astro experience now runs the complete pitch path `/` → `/onboarding` → `/pathway` → `/marketplace`, using Alex’s confirmed five-answer scenario, a four-step professional pathway, three adviser matches, browse-all fictional professionals, filtering, profile detail, and consent-first fictional booking confirmation.

Journey state is handled by small browser-safe modules under `frontend/src/lib/`, persisted under `arc.demoJourney.v1`, recovered safely from absent/corrupt snapshots, and resettable through the visible Restart demo action. Canonical prompts, responses, pathway steps, summary, and provider data live under `frontend/src/data/`.

## Tests and exact results

Commands run from `frontend/`:

```text
npm test
✔ journey state seeds Alex and safely recovers from corrupt storage
✔ journey state updates fields and persists a versioned snapshot
✔ marketplace filters by type, speciality, place, price, and earliest availability
✔ booking confirmation contains only explicitly selected context items
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

```text
npm run build
✓ /marketplace/index.html
✓ /onboarding/index.html
✓ /pathway/index.html
✓ /index.html
✓ 4 page(s) built
```

```text
git diff --check
No whitespace errors.
```

Smoke check used `npm run dev -- --background`, then `Invoke-WebRequest` for all four routes; each returned HTTP 200 with the expected page title. The server was stopped with `npx astro dev stop`.

## RED/GREEN evidence

RED (before production modules existed):

```text
npm test
Error [ERR_MODULE_NOT_FOUND]: Cannot find module .../frontend/src/lib/journey-state.mjs
✖ test\arc-demo.test.mjs
```

This was the expected missing-behavior failure from the newly authored tests. GREEN after implementing the three pure modules:

```text
npm test
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Changed files

- `frontend/src/pages/index.astro` — navigation-focused landing page and life-event examples.
- `frontend/src/pages/onboarding.astro` — five-step scripted conversation, editable responses, review, and pathway CTA.
- `frontend/src/pages/pathway.astro` — ordered four-step pathway with reasons, timing, status, and actions.
- `frontend/src/pages/marketplace.astro` — match/browse tabs, filters, profiles, context checklist, and confirmation.
- `frontend/src/components/Header.astro` — shared navigation and Restart demo action.
- `frontend/src/data/demo-content.mjs` — intake, pathway, and Alex data.
- `frontend/src/data/professionals.mjs` — six fictional providers.
- `frontend/src/lib/journey-state.mjs`, `marketplace-filter.mjs`, `booking-context.mjs` — tested pure behavior.
- `frontend/test/arc-demo.test.mjs` — Node built-in unit tests.
- `frontend/src/styles/global.css` — deep-green/pale-green visual system, focus, responsive, and reduced-motion styles.
- `frontend/package.json` — `npm test` script.
- `docs/design.md` — adopted green palette documentation.
- `frontend/src/pages/accountant/sarah-chen.astro` — removed obsolete accountant-only route.

## Self-review

- [x] Exact Alex prompts/responses and promise are present.
- [x] Arc explains roles/order/questions and avoids objective provider or product recommendations.
- [x] Four pathway steps name role, sequence, reason, timing, status, completion signal, and action.
- [x] Three adviser profiles include speciality, price, availability, individual rationale, and fictional disclosure.
- [x] Browse-all includes a mortgage broker, tax accountant, and conveyancer; filters cover type, speciality, Brisbane/online, price, and earliest availability.
- [x] Booking times are fictional; all context checkboxes start unchecked and confirmation lists only selected items plus the next pathway step.
- [x] Internal links resolve to the four generated pages or existing anchors; obsolete `/fund`, `/intake`, and `#` actions are gone from implementation.
- [x] Inputs have labels, controls are keyboard-operable, focus is visible, and reduced-motion preferences are respected.
- [x] Static output contains no backend, account, payment, external API, secret, or UI framework.

## Concerns

Provider credentials, reviews, and availability are intentionally fictional and not verified, as required for the pitch MVP. Booking is an in-page demo request only; no real provider, calendar, email, payment, or account action occurs.
