# Task 1 report: AI contract, normalization, and focused tests

## Files changed

- `frontend/src/lib/ai-contract.mjs` — shared role allowlist, explicit `{ ok, value/error }` validators, prohibited-claim checks, generation schema checks, and presentation normalization.
- `frontend/test/ai-contract.test.mjs` — focused Node tests for clarification states, the one-question rule, role/pathway/profile rejection, exact match count, and normalization.

## Design decisions

- Validators return `{ ok: true, value }` or `{ ok: false, error }`, allowing HTTP handlers and tests to handle malformed model/user data without exceptions. `AIContractError` is used when normalization is requested for invalid data.
- Domain objects use exact allowlists for fields, supported roles are fixed to the seven roles in the design spec, pathway order is contiguous, the first role must equal `recommendedRole`, and matches must be exactly three.
- Profiles enforce synthetic person-name formatting, numeric bounds, concise text, and reject credential/rating/review/guarantee/company-style claims and fields.
- Normalization derives collision-safe slugs, initials, recommended-role `type`, `price`/`priceLabel`, joined `locationLabel`, palette accents, and one-based response-order availability ranks. Zero price is `No initial fee`.

## Tests and outputs

Requested command:

```text
npm test -- --test-name-pattern="AI contract|normalization"
```

Result: blocked in this Windows sandbox before test execution because Node's test runner cannot spawn its worker process (`Error: spawn EPERM`). The same failure also occurs with `node --test --test-concurrency=1`.

Equivalent focused execution:

```text
node --input-type=module -e "import('./test/ai-contract.test.mjs')"
```

Result: 4 passed, 0 failed. `git diff --check` passed with no output.

## Self-review

- Reviewed the new module for strict top-level and nested shape checks, role/pathway invariants, bounds, duplicate handling, claim filtering, and deterministic derived fields.
- Reviewed tests against every Task 1 brief item; duplicate names exercise slug suffixing and zero-dollar pricing is covered.
- No existing files outside the Task 1 files and this report were changed.

## Concerns

- The requested npm test command remains un-runnable in this environment due to host-level Node `spawn EPERM`; direct equivalent execution passes.
- The claim filter is intentionally conservative and may reject generated copy containing words such as “registered” or “best,” which is appropriate for the regulated-navigation boundary and can be refined by later server work if needed.

## Fix round 1

Addressed review findings by adding `credential` and `company` to the recursive prohibited-claim text filter. Added focused tests for those terms in profile speciality/rationale and inclusive duration/price boundaries (20/90 minutes and 0/600 AUD), plus just-outside rejection.

Focused test command and exact output:

```text
node --input-type=module -e "import('./test/ai-contract.test.mjs')"
✔ AI contract accepts valid clarification states and only one question
✔ AI contract rejects unsupported or duplicate pathway roles
✔ AI contract rejects malformed profiles, prohibited fields, and non-three matches
✔ AI contract accepts inclusive consultation duration and price boundaries
✔ normalization derives safe IDs, labels, accents, and response-order ranks
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

`git diff --check` passed with no output. Self-review confirms only the claim regex and focused contract tests changed in this round; no remaining concerns beyond the previously documented Node `spawn EPERM` limitation for the npm test runner.
