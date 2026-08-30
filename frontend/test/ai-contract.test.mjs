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
  assert.equal(validateGenerateResult({ ...base, matches: [{ ...base.matches[0], speciality: "Credential and company selection" }, ...base.matches.slice(1)] }).ok, false);
  assert.equal(validateGenerateResult({ ...base, matches: [{ ...base.matches[0], rationale: "Choose this company with credential confidence." }, ...base.matches.slice(1)] }).ok, false);
  assert.equal(validateGenerateRequest({ situation: "I am planning finances.", followUpQuestion: "What matters?" }).ok, false);
});

test("AI contract keeps ordinary wording that merely contains a banned word", () => {
  // The ban list guards against invented credentials and marketing claims. It must not
  // fire on substrings ("ope-rating") or on ordinary verb and adverb senses, which this
  // domain uses constantly - that rejected safe model output and surfaced as an error.
  const withRationale = (rationale) => ({ ...base, matches: [{ ...base.matches[0], rationale }, ...base.matches.slice(1)] });
  for (const rationale of [
    "Helps with operating costs and everyday cash flow.",
    "Focused on generating long-term income.",
    "Reviews your contract with you before you sign.",
    "Can accompany you through each decision.",
    "Helps you decide how best to allocate your savings.",
    "Works on integrating super into a wider plan.",
    "Good at separating personal and business money.",
  ]) assert.equal(validateGenerateResult(withRationale(rationale)).ok, true, rationale);
});

test("AI contract still rejects invented credentials, ratings, and superlative claims", () => {
  const withRationale = (rationale) => ({ ...base, matches: [{ ...base.matches[0], rationale }, ...base.matches.slice(1)] });
  for (const rationale of [
    "A registered tax agent who can lodge for you.",
    "A licensed adviser with full accreditation.",
    "Certified and accredited across Australia.",
    "Holds credentials from a major company.",
    "Rated the best adviser in Brisbane.",
    "Carries a five-star rating from past clients.",
    "Has hundreds of customer reviews online.",
    "Comes with a guarantee on returns.",
    "Objectively the strongest option for you.",
    "Available now for a same-day session.",
  ]) assert.equal(validateGenerateResult(withRationale(rationale)).ok, false, rationale);
});

test("AI contract accepts a clarifying question containing an abbreviation", () => {
  // Models routinely write "e.g." or "etc."; the one-sentence guard must not read those
  // internal full stops as a second sentence.
  assert.equal(validateClarifyResult({ status: "needs_clarification", question: "What is your main goal right now (e.g., buying a home, paying down debt, etc.)?" }).ok, true);
  assert.equal(validateClarifyResult({ status: "needs_clarification", question: "Are you planning to buy i.e. within the next year?" }).ok, true);
  assert.equal(validateClarifyResult({ status: "needs_clarification", question: "What is your goal? Also, what is your timeframe?" }).ok, false);
  assert.equal(validateClarifyResult({ status: "needs_clarification", question: "Tell me your goal. Then your timeframe." }).ok, false);
  assert.equal(validateClarifyResult({ status: "needs_clarification", question: "No question mark here" }).ok, false);
});

test("AI contract accepts inclusive consultation duration and price boundaries", () => {
  const atMinimum = { ...base.matches[0], consultationMinutes: 20, priceAud: 0 };
  const atMaximum = { ...base.matches[1], consultationMinutes: 90, priceAud: 600 };
  assert.equal(validateGenerateResult({ ...base, matches: [atMinimum, atMaximum, base.matches[2]] }).ok, true);
  assert.equal(validateGenerateResult({ ...base, matches: [{ ...atMinimum, consultationMinutes: 19 }, atMaximum, base.matches[2]] }).ok, false);
  assert.equal(validateGenerateResult({ ...base, matches: [{ ...atMinimum, priceAud: 601 }, atMaximum, base.matches[2]] }).ok, false);
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
