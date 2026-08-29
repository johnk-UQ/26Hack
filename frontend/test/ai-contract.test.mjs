import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTED_ROLES,
  validateClarifyRequest,
  validateClarifyResult,
  validateGenerateRequest,
  validateGenerateResult,
  normalizeGeneratedJourney,
} from "../src/lib/ai-contract.mjs";

const base = {
  summary: { headline: "A clear next step", context: ["New job", "Planning ahead"] },
  recommendedRole: "Financial adviser",
  pathway: [{ order: 1, professional: "Financial adviser", reason: "Clarify goals.", timing: "Start this month", completion: "Questions are clear." }],
  matches: ["Maya Chen", "Daniel Okafor", "Sophie Nguyen"].map((name, i) => ({
    name, speciality: "Planning and priorities", specialities: ["Planning"], consultationMinutes: 50 + i * 5,
    priceAud: 200 + i * 10, availability: `Day ${i + 1} at 10 am`, locations: ["Online"], rationale: "A useful fit for this situation.",
  })),
};

test("AI contract accepts valid clarification states and only one question", () => {
  assert.equal(validateClarifyRequest({ situation: "I am changing jobs and planning my finances." }).ok, true);
  assert.equal(validateClarifyResult({ status: "ready", question: null }).ok, true);
  assert.equal(validateClarifyResult({ status: "needs_clarification", question: "What matters most right now?" }).ok, true);
  assert.equal(validateClarifyResult({ status: "needs_clarification", question: "One?", secondQuestion: "Two?" }).ok, false);
  assert.equal(validateClarifyResult({ status: "ready", question: "Unexpected" }).ok, false);
});

test("AI contract rejects unsupported or duplicate pathway roles", () => {
  assert.deepEqual(SUPPORTED_ROLES, ["Financial adviser", "Mortgage broker", "Tax accountant", "Conveyancer", "Financial counsellor", "Insurance adviser", "Estate-planning lawyer"]);
  assert.equal(validateGenerateResult({ ...base, recommendedRole: "Investment manager" }).ok, false);
  assert.equal(validateGenerateResult({ ...base, pathway: [base.pathway[0], { ...base.pathway[0], order: 2 }] }).ok, false);
  assert.equal(validateGenerateResult({ ...base, pathway: [{ ...base.pathway[0], professional: "Mortgage broker" }] }).ok, false);
});

test("AI contract rejects malformed profiles, prohibited fields, and non-three matches", () => {
  assert.equal(validateGenerateResult({ ...base, matches: base.matches.slice(0, 2) }).ok, false);
  assert.equal(validateGenerateResult({ ...base, matches: [{ ...base.matches[0], rating: 5 }, ...base.matches.slice(1)] }).ok, false);
  assert.equal(validateGenerateResult({ ...base, matches: [{ ...base.matches[0], consultationMinutes: 10 }, ...base.matches.slice(1)] }).ok, false);
  assert.equal(validateGenerateResult({ ...base, matches: [{ ...base.matches[0], name: "Acme Financial Pty Ltd" }, ...base.matches.slice(1)] }).ok, false);
  assert.equal(validateGenerateRequest({ situation: "I am planning finances.", followUpQuestion: "What matters?" }).ok, false);
});

test("normalization derives safe IDs, labels, accents, and response-order ranks", () => {
  const value = normalizeGeneratedJourney({ ...base, matches: base.matches.map((m) => ({ ...m, name: "Ana O'Neil" })) });
  assert.equal(value.matches[0].id, "ana-oneil");
  assert.equal(value.matches[1].id, "ana-oneil-2");
  assert.equal(value.matches[0].initials, "AO");
  assert.equal(value.matches[0].type, "Financial adviser");
  assert.equal(value.matches[0].priceLabel, "$200 / 50 min");
  assert.equal(value.matches[0].locationLabel, "Online");
  assert.equal(value.matches[0].availabilityRank, 1);
  assert.notEqual(value.matches[0].accent, value.matches[1].accent);
  assert.equal(normalizeGeneratedJourney({ ...base, matches: [{ ...base.matches[0], priceAud: 0 }, ...base.matches.slice(1)] }).matches[0].priceLabel, "No initial fee");
});
