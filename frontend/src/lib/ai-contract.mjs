export const SUPPORTED_ROLES = Object.freeze([
  "Financial adviser",
  "Mortgage broker",
  "Tax accountant",
  "Conveyancer",
  "Financial counsellor",
  "Insurance adviser",
  "Estate-planning lawyer",
]);

const ROLE_SET = new Set(SUPPORTED_ROLES);
const ACCENTS = ["#b7e17e", "#d0edaa", "#9ecb70", "#e1efcc", "#c4e396", "#aed17d"];
// Claims the model must never make about a synthetic profile. Each pattern is
// word-bounded: an unbounded /rating/ also fires inside "operating" and "generating",
// and /company/ inside "accompany", which rejected safe output.
const CLAIM_PATTERNS = [
  /\blicen[cs](?:e[sd]?|ing)\b/i,
  /\bregistered\b/i,
  /\bcertified\b/i,
  /\baccredited\b/i,
  /\bcredentials?\b/i,
  /\bcompany\b/i,
  /\bratings?\b/i,
  /\breviews\b/i,
  /\bguarantee[sd]?\b/i,
  /\bbest\b/i,
  /\bavailable now\b/i,
  /\bobjectively\b/i,
];
// "reviews" and "best" also carry ordinary senses this domain uses constantly
// ("reviews your contract", "how best to"). Those are cleared before the ban list runs,
// so the noun senses ("customer reviews", "the best adviser") still fail.
const ORDINARY_SENSES = [
  /\bhow\s+best\s+to\b/gi,
  /\breviews\s+(?:your|the|their|his|her|its|each|every|these|those)\b/gi,
];
const makesClaim = (value) => {
  const probe = ORDINARY_SENSES.reduce((text, pattern) => text.replace(pattern, " "), value);
  return CLAIM_PATTERNS.some((pattern) => pattern.test(probe));
};

export class AIContractError extends Error {
  constructor(message) { super(message); this.name = "AIContractError"; }
}

const result = (value) => ({ ok: true, value });
const failure = (error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) });
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value, keys) => isPlainObject(value) && Object.keys(value).every((key) => keys.includes(key));
const text = (value, min = 1, max = 2000) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
// Models routinely write "e.g." or "etc.", whose full stops must not read as a second
// sentence. Everything else stays one sentence, ending in terminal punctuation.
const ABBREVIATIONS = /\b(?:e\.g|i\.e|etc|vs|approx|incl|mr|mrs|ms|dr|st)\.,?/gi;
const sentence = (value, max = 180) => {
  if (!text(value, 1, max)) return false;
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) && !/[.!?]/.test(trimmed.slice(0, -1).replace(ABBREVIATIONS, " "));
};

function validate(value, checks) {
  try { checks(value); return result(value); } catch (error) { return failure(error); }
}
function requireCondition(condition, message) { if (!condition) throw new AIContractError(message); }
function rejectClaims(value) {
  if (typeof value === "string") requireCondition(!makesClaim(value), "prohibited claim or field");
  else if (Array.isArray(value)) value.forEach(rejectClaims);
  else if (isPlainObject(value)) Object.entries(value).forEach(([key, item]) => {
    requireCondition(!/(license|credential|rating|review|guarantee|availabilityDate)/i.test(key), "prohibited claim or field");
    rejectClaims(item);
  });
}

function checkSituation(value) { requireCondition(exactKeys(value, ["situation"]), "unexpected request field"); requireCondition(text(value.situation, 10, 2000), "situation must be 10-2000 characters"); }

export function validateClarifyRequest(value) { return validate(value, checkSituation); }

function checkClarifyResult(value) {
  requireCondition(exactKeys(value, ["status", "question"]), "unexpected clarification field");
  requireCondition(value.status === "ready" || value.status === "needs_clarification", "invalid clarification status");
  if (value.status === "ready") requireCondition(value.question === null, "ready clarification must not contain a question");
  else requireCondition(sentence(value.question), "clarification question must be one sentence of at most 180 characters");
  rejectClaims(value);
}
export function validateClarifyResult(value) { return validate(value, checkClarifyResult); }

function checkGenerateRequest(value) {
  requireCondition(isPlainObject(value), "request must be an object");
  const keys = ["situation", "followUpQuestion", "followUpAnswer"];
  requireCondition(Object.keys(value).every((key) => keys.includes(key)), "unexpected request field");
  requireCondition(text(value.situation, 10, 2000), "situation must be 10-2000 characters");
  const hasQuestion = Object.hasOwn(value, "followUpQuestion");
  const hasAnswer = Object.hasOwn(value, "followUpAnswer");
  requireCondition(hasQuestion === hasAnswer, "follow-up question and answer must be provided together");
  if (hasQuestion) {
    requireCondition(sentence(value.followUpQuestion), "follow-up question is invalid");
    requireCondition(text(value.followUpAnswer, 1, 2000), "follow-up answer is invalid");
  }
  rejectClaims(value);
}
export function validateGenerateRequest(value) { return validate(value, checkGenerateRequest); }

const SUMMARY_KEYS = ["headline", "context"];
const PATHWAY_KEYS = ["order", "professional", "reason", "timing", "completion"];
const PROFILE_KEYS = ["name", "presentation", "speciality", "specialities", "consultationMinutes", "priceAud", "availability", "locations", "rationale"];
const FACE_COUNTS = { feminine: 7, masculine: 6 };
const FACE_FOLDERS = { feminine: "female", masculine: "male" };
function checkProfile(profile) {
  requireCondition(exactKeys(profile, PROFILE_KEYS), "malformed professional profile");
  requireCondition(text(profile.name, 2, 80) && /^[\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*)+$/u.test(profile.name.trim()), "invalid professional name");
  requireCondition(!profile.name.trim().split(/\s+/).some((part) => /^(?:pty|ltd|inc|llc|group|company|bank|wealth)$/i.test(part)), "company name is not allowed");
  requireCondition(!Object.hasOwn(profile, "presentation") || profile.presentation === "feminine" || profile.presentation === "masculine", "invalid presentation");
  requireCondition(text(profile.speciality, 2, 160), "invalid speciality");
  requireCondition(Array.isArray(profile.specialities) && profile.specialities.length >= 1 && profile.specialities.length <= 5 && profile.specialities.every((item) => text(item, 1, 80)), "invalid specialities");
  requireCondition(Number.isInteger(profile.consultationMinutes) && profile.consultationMinutes >= 20 && profile.consultationMinutes <= 90, "invalid consultation duration");
  requireCondition(Number.isInteger(profile.priceAud) && profile.priceAud >= 0 && profile.priceAud <= 600, "invalid consultation price");
  requireCondition(text(profile.availability, 1, 100), "invalid availability");
  requireCondition(Array.isArray(profile.locations) && profile.locations.length >= 1 && profile.locations.length <= 3 && profile.locations.every((item) => text(item, 1, 50)), "invalid locations");
  requireCondition(text(profile.rationale, 1, 240), "invalid rationale");
}

function checkGenerated(value) {
  requireCondition(exactKeys(value, ["summary", "recommendedRole", "pathway", "matches"]), "unexpected generation field");
  requireCondition(exactKeys(value.summary, SUMMARY_KEYS) && text(value.summary.headline, 1, 180), "invalid summary");
  requireCondition(Array.isArray(value.summary.context) && value.summary.context.length >= 2 && value.summary.context.length <= 6 && value.summary.context.every((item) => text(item, 1, 120)), "invalid summary context");
  requireCondition(ROLE_SET.has(value.recommendedRole), "unsupported recommended role");
  requireCondition(Array.isArray(value.pathway) && value.pathway.length >= 1 && value.pathway.length <= 4, "invalid pathway length");
  const roles = new Set();
  value.pathway.forEach((step, index) => {
    requireCondition(exactKeys(step, PATHWAY_KEYS), "malformed pathway step");
    requireCondition(step.order === index + 1 && ROLE_SET.has(step.professional) && !roles.has(step.professional), "invalid or duplicate pathway role");
    roles.add(step.professional);
    [step.reason, step.timing, step.completion].forEach((item) => requireCondition(text(item, 1, 240), "invalid pathway text"));
  });
  requireCondition(value.pathway[0].professional === value.recommendedRole, "recommended role must be first");
  requireCondition(Array.isArray(value.matches) && value.matches.length === 3, "exactly three matches are required");
  value.matches.forEach(checkProfile);
  rejectClaims(value);
}
export function validateGenerateResult(value) { return validate(value, checkGenerated); }

function slug(name) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "professional";
}
function initials(name) { return name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function faceFor(profile, used) {
  const key = Object.hasOwn(FACE_FOLDERS, profile.presentation) ? profile.presentation : null;
  if (!key) return null;
  const folder = FACE_FOLDERS[key]; const count = FACE_COUNTS[key];
  let seed = 0; for (const character of profile.name) seed = (seed + character.codePointAt(0)) % count;
  for (let step = 0; step < count; step += 1) {
    const candidate = `/faces/${folder}/${folder}-${((seed + step) % count) + 1}.jpg`;
    if (!used.has(candidate)) { used.add(candidate); return candidate; }
  }
  return `/faces/${folder}/${folder}-${seed + 1}.jpg`;
}

export function normalizeGeneratedJourney(value) {
  const checked = validateGenerateResult(value);
  if (!checked.ok) throw new AIContractError(checked.error);
  const ids = new Map(); const usedFaces = new Set();
  const matches = value.matches.map((profile, index) => {
    const baseId = slug(profile.name); const count = (ids.get(baseId) || 0) + 1; ids.set(baseId, count);
    const id = count === 1 ? baseId : `${baseId}-${count}`;
    return { ...profile, id, initials: initials(profile.name), photo: faceFor(profile, usedFaces), type: value.recommendedRole,
      price: profile.priceAud, priceLabel: profile.priceAud === 0 ? "No initial fee" : `$${profile.priceAud} / ${profile.consultationMinutes} min`,
      locationLabel: profile.locations.join(" or "), availabilityRank: index + 1, accent: ACCENTS[index % ACCENTS.length] };
  });
  return { ...value, matches };
}
