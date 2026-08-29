# Task 2 report

## Files

Added `frontend/server/prompts.mjs`, `frontend/server/groq-client.mjs`, `frontend/server/index.mjs`, `frontend/scripts/dev-ai.mjs`, `frontend/.env.example`, and `frontend/test/ai-server.test.mjs`. Modified `frontend/astro.config.mjs`, `frontend/package.json`, and `frontend/.gitignore`.

## Decisions

- Used the shared `src/lib/ai-contract.mjs` for all request/result validation and generated journey normalisation.
- Used native Node HTTP and `fetch`; Groq calls use `openai/gpt-oss-120b`, low reasoning effort, strict JSON Schema, 200/1500 token caps, 12-second aborts, and one retry for transient/invalid responses.
- Kept public API errors stable and deliberately free of provider details. The API binds to loopback, checks local Astro origins, enforces JSON/POST/body limits, disables caching, and does not persist or log answers.
- `dev:ai` loads ignored `.env`, warns when the key is absent, and stops both child processes on interruption.

## Verification

Focused command (elevated process permissions were required because sandboxed Windows Node spawning returned EPERM):

```text
npm test -- --test-name-pattern='successful|rejects|maps|normalises'
29 tests, 29 passed, 0 failed
```

Static build:

```text
npm run build
4 page(s) built ... Complete!
```

Also ran `node --check` on all four new JavaScript modules successfully. No real Groq request was made.

## Self-review

The API validates before invoking the client, validates/normalises generated output before returning it, and exposes injectable client/fetch seams. Tests cover mocked success, request policy, safe transient/timeout/invalid errors, and normalisation. Existing static build remains independent of the API key.

## Concerns

- Manual smoke testing with a real key remains intentionally pending; automated tests never contact Groq.
- The local launcher uses npm child processes and is intended for the pitch laptop rather than production process supervision.
