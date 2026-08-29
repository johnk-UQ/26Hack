# Groq AI Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scripted five-answer intake with a reliable one-or-two-answer Groq journey that generates a pathway and exactly three synthetic matches for the first professional role.

**Architecture:** Keep Astro static and add a local Node HTTP service on `127.0.0.1:8787`. The browser calls it through a Vite `/api` proxy, persists only validated normalized results in versioned local storage, and renders those results through the existing pathway and marketplace pages. The existing property journey remains the deterministic fallback.

**Tech Stack:** Astro 7, browser JavaScript modules, Node 22 built-in HTTP/fetch/test runner, Groq Chat Completions with `openai/gpt-oss-120b` strict JSON Schema.

**Spec:** `docs/superpowers/specs/2026-08-30-groq-ai-journey-design.md`

## Global Constraints

- Use only GPT-5.6 Luna subagents for implementation, review, and fixes.
- Laptop demo only; do not add or verify mobile-specific behavior.
- Ask one opening question and at most one AI-generated follow-up.
- Use `openai/gpt-oss-120b`, low reasoning effort, strict JSON Schema, a 12-second request timeout, and one transient retry.
- Return only supported professions, one clear first role, a pathway of 1–4 unique roles, and exactly three generated matches for the first role.
- Never expose `GROQ_API_KEY`, raw prompts, reasoning, provider errors, stack traces, or unvalidated output to the browser.
- Keep automated checks focused and mocked; never call Groq from tests.
- Preserve the existing static build and property journey as the known-good example.
- Avoid unrelated redesign and dependencies unless they materially simplify the local launcher.

---

## Task 1: AI Contract, Normalization, and Focused Tests

**Files:**
- Create: `frontend/src/lib/ai-contract.mjs`
- Create: `frontend/test/ai-contract.test.mjs`

- [ ] Define and export the supported role allowlist exactly as specified.
- [ ] Export validators for clarify requests/results and generate requests/results. Reject extra or malformed domain data, unsupported roles, duplicate pathway roles, mismatched first role, match counts other than three, out-of-range duration/price, and prohibited claims/fields.
- [ ] Keep validation results explicit and safe for both server handlers and tests; use a small error class or `{ok, value/error}` convention consistently.
- [ ] Export `normalizeGeneratedJourney(value)` that derives collision-safe slug IDs, initials, `type`, `priceLabel`, `locationLabel`, deterministic accent colors from the existing palette, and response-order availability ranks.
- [ ] Ensure zero-dollar consultations format as `No initial fee`; otherwise include the AUD price and duration.
- [ ] Add focused Node tests covering valid clarification states, the maximum-one-question contract, unsupported/duplicate roles, malformed profiles, exact three-match enforcement, collision-safe IDs, initials, price labels, accents, and ranks.
- [ ] Run `npm test -- --test-name-pattern="AI contract|normalization"` from `frontend` (or the equivalent focused file command) and commit the task.

## Task 2: Groq Client, Prompts, Local API, and One-Command Launcher

**Files:**
- Create: `frontend/server/prompts.mjs`
- Create: `frontend/server/groq-client.mjs`
- Create: `frontend/server/index.mjs`
- Create: `frontend/scripts/dev-ai.mjs`
- Create: `frontend/.env.example`
- Create: `frontend/test/ai-server.test.mjs`
- Modify: `frontend/astro.config.mjs`
- Modify: `frontend/package.json`
- Modify: `frontend/.gitignore`

- [ ] Build separate clarify and generate prompts that enforce plain Australian consumer language, navigation-not-advice boundaries, instruction isolation, the role allowlist, no PII requests, no invented credentials/ratings/businesses, and exactly three differentiated synthetic people for the selected role.
- [ ] Implement a Groq Chat Completions client using native `fetch`, `openai/gpt-oss-120b`, `reasoning_effort: "low"`, strict JSON Schema response formats, approximately 200 and 1,500 maximum output tokens, and a 12-second abort timeout.
- [ ] Retry once only for timeout/network failures, HTTP 429, HTTP 5xx, or invalid structured model output. Map failures to `INVALID_REQUEST`, `AI_UNAVAILABLE`, `AI_TIMEOUT`, or `AI_INVALID_RESPONSE` without returning raw provider details.
- [ ] Implement `POST /api/clarify` and `POST /api/generate` on a Node built-in HTTP server bound to `127.0.0.1:8787`. Enforce a small request-body limit, JSON content, local Astro origins, POST-only behavior, `Cache-Control: no-store`, contract validation, and no persistence/logging of raw answers.
- [ ] Export handler/client seams so tests can inject mocked `fetch` without starting a real Groq request.
- [ ] Add `dev:web`, `dev:api`, and `dev:ai` scripts. `dev:ai` must load an ignored local `.env`, start both processes, stop both on interrupt, and print a clear error if `GROQ_API_KEY` is absent while leaving `npm run build` functional.
- [ ] Configure the Astro development proxy for `/api` to `http://127.0.0.1:8787`; commit `.env.example` with only `GROQ_API_KEY=` and ensure local env files remain ignored.
- [ ] Add mocked tests for successful clarify/generate calls, unsupported methods/origins/bodies, timeout, 429, 5xx, invalid schema, normalization, and safe public errors. Keep assertions on core contracts rather than exhaustive implementation details.
- [ ] Run the focused server tests and `npm run build`, then commit the task.

## Task 3: Journey State and Two-Turn Onboarding

**Files:**
- Modify: `frontend/src/lib/journey-state.mjs`
- Create: `frontend/src/lib/ai-journey-client.mjs`
- Modify: `frontend/src/pages/onboarding.astro`
- Modify: `frontend/test/switchpath-demo.test.mjs`

- [ ] Upgrade journey storage to a new version while safely loading old snapshots and keeping the property example as the default. Add `initialSituation`, `followUpQuestion`, `followUpAnswer`, `generatedSummary`, `generatedPathway`, `generatedMatches`, and `generationSource`.
- [ ] Export a clear reset/default constructor and persist only validated-shaped generated values. Preserve booking behavior.
- [ ] Implement a browser API adapter for `/api/clarify` and `/api/generate`, property-like detection using the exact spec keywords, and safe public-error parsing.
- [ ] Replace the five-step markup/controller with one editable prefilled opening answer plus at most one dynamically inserted follow-up. A `ready` result must proceed immediately to generation; a clarification error must also proceed directly to generation.
- [ ] Reuse the existing streaming-style reveal for the optional question and staged analysis animation during generation. Prevent duplicate sends, keep the conversation inside its auto-scrolling viewport, and navigate directly to `/pathway` on success.
- [ ] On generation failure, automatically use the example result only for property-like input. For unrelated input, show `Try again` and a secondary `Continue with the example journey`; never silently substitute the property result.
- [ ] Save the successful Groq or example journey before navigation. Starting over must clear generated state and restore the prefilled example.
- [ ] Update only the focused DOM/source and journey-state tests needed to cover a maximum of two answers, state migration/persistence/reset, and property-like versus unrelated fallback selection.
- [ ] Run the focused state/onboarding tests and commit the task.

## Task 4: Generated Pathway and Marketplace Rendering

**Files:**
- Modify: `frontend/src/pages/pathway.astro`
- Modify: `frontend/src/pages/marketplace.astro`
- Modify: `frontend/src/lib/marketplace-filter.mjs` only if generated records require a compatibility adjustment
- Modify: `frontend/test/switchpath-demo.test.mjs`
- Modify: `frontend/README.md`

- [ ] Render the persisted generated summary and pathway when present; otherwise render the existing property example. Keep one dominant recommended card and zero to three collapsed later roles.
- [ ] Make headings, role-specific action copy, counts, timing, rationale, completion signals, and context panel derive from the active result without naming the old demo person.
- [ ] Render exactly three generated professionals first under `Your top matches`, using the normalized marketplace fields. Keep the existing catalogue accessible under `Browse all` and preserve profile/booking interaction for generated top matches.
- [ ] Ensure booking confirmation and context selection work with a generated role/person; derive a sensible next pathway label when present and avoid hard-coded adviser/broker assumptions.
- [ ] Document `GROQ_API_KEY` setup and the single laptop run command without implying production hosting.
- [ ] Add or update only core tests covering generated-path rendering hooks, exactly three top matches, static fallback, and generated booking compatibility.
- [ ] Run `npm test` and `npm run build`; perform one browser smoke of the prefilled laptop journey with mocked/fallback operation if no real key is available. Commit the task.

## Task 5: Whole-Flow Review and Minimal Fix Wave

**Files:**
- Modify only files required by confirmed review findings.

- [ ] Review the full branch against the design spec, concentrating on secret isolation, maximum two answers, exact three matches, safe fallback behavior, state persistence, and the laptop happy path.
- [ ] Run one fix wave for confirmed Critical or Important findings only; defer cosmetic or production-hardening suggestions outside the MVP.
- [ ] Re-run `npm test` and `npm run build`, plus a single laptop browser smoke. Do not run real Groq calls without a user-provided local key.
