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
const CLAIMS = /(?:licensed?|licen[cs]e|registered|certified|accredited|credential(?:s)?|company|rating|reviews?|guarantee|best|available now|objectively|regulated|approved)/i;

export class AIContractError extends Error {
  constructor(message) { super(message); this.name = "AIContractError"; }
}

const result = (value) => ({ ok: true, value });
const failure = (error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) });
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value, keys) => isPlainObject(value) && Object.keys(value).every((key) => keys.includes(key));
const text = (value, min = 1, max = 2000) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
const sentence = (value, max = 180) => text(value, 1, max) && /[.!?]$/.test(value.trim()) && !/[.!?].*[.!?]/.test(value.trim().slice(0, -1));

function validate(value, checks) {
  try { checks(value); return result(value); } catch (error) { return failure(error); }
}
function requireCondition(condition, message) { if (!condition) throw new AIContractError(message); }
function rejectClaims(value) {
  if (typeof value === "string") requireCondition(!CLAIMS.test(value), "prohibited claim or field");
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
const PROFILE_KEYS = ["name", "speciality", "specialities", "consultationMinutes", "priceAud", "availability", "locations", "rationale"];
function checkProfile(profile) {
  requireCondition(exactKeys(profile, PROFILE_KEYS), "malformed professional profile");
  requireCondition(text(profile.name, 2, 80) && /^[\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*)+$/u.test(profile.name.trim()), "invalid professional name");
  requireCondition(!profile.name.trim().split(/\s+/).some((part) => /^(?:pty|ltd|inc|llc|group|company|bank|wealth)$/i.test(part)), "company name is not allowed");
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

export function normalizeGeneratedJourney(value) {
  const checked = validateGenerateResult(value);
  if (!checked.ok) throw new AIContractError(checked.error);
  const ids = new Map();
  const matches = value.matches.map((profile, index) => {
    const baseId = slug(profile.name); const count = (ids.get(baseId) || 0) + 1; ids.set(baseId, count);
    const id = count === 1 ? baseId : `${baseId}-${count}`;
    return { ...profile, id, initials: initials(profile.name), type: value.recommendedRole,
      price: profile.priceAud, priceLabel: profile.priceAud === 0 ? "No initial fee" : `$${profile.priceAud} / ${profile.consultationMinutes} min`,
      locationLabel: profile.locations.join(" or "), availabilityRank: index + 1, accent: ACCENTS[index % ACCENTS.length] };
  });
  return { ...value, matches };
}
