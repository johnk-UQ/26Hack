import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  STORAGE_KEY,
  createInitialJourney,
  loadJourney,
  saveJourney,
  updateJourney,
  responsesAreUsable,
} from "../src/lib/journey-state.mjs";
import { filterProfessionals } from "../src/lib/marketplace-filter.mjs";
import { buildBookingConfirmation, canCreateScriptedConsultation, CONTEXT_ITEMS } from "../src/lib/booking-context.mjs";
import { getScrollBehavior } from "../src/lib/motion-policy.mjs";

const professionals = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    type: "Financial adviser",
    speciality: "Early-career wealth planning; property readiness",
    location: "Online",
    price: 220,
    availabilityRank: 2,
    availability: "Tue 10:30 am, video",
  },
  {
    id: "harper-loan",
    name: "Harper Jones",
    type: "Mortgage broker",
    speciality: "First-home borrowing",
    location: "Brisbane",
    price: 0,
    availabilityRank: 4,
    availability: "Fri 2:00 pm, Brisbane",
  },
];

test("journey state seeds Alex and safely recovers from corrupt storage", () => {
  const storage = new Map();
  const seeded = loadJourney(storage);
  assert.equal(seeded.version, 1);
  assert.equal(seeded.demoPerson, "Alex");
  assert.equal(seeded.intakeResponses.length, 5);
  assert.equal(storage.get(STORAGE_KEY), undefined);

  storage.set(STORAGE_KEY, "not-json");
  const recovered = loadJourney(storage);
  assert.equal(recovered.currentStep, "adviser");
  assert.deepEqual(recovered.intakeResponses, seeded.intakeResponses);
});

test("journey state updates fields and persists a versioned snapshot", () => {
  const storage = new Map();
  const next = updateJourney(loadJourney(storage), { currentStep: "mortgage-broker" });
  saveJourney(storage, next);
  const restored = loadJourney(storage);
  assert.equal(restored.currentStep, "mortgage-broker");
  assert.equal(JSON.parse(storage.get(STORAGE_KEY)).version, 1);
});

test("journey state rejects JSON-shaped snapshots with unusable response items", () => {
  const storage = new Map();
  const valid = createInitialJourney();
  storage.set(STORAGE_KEY, JSON.stringify({ ...valid, intakeResponses: ["kept", null, 3, {}, "also kept"] }));
  const recovered = loadJourney(storage);
  assert.deepEqual(recovered.intakeResponses, valid.intakeResponses);
});

test("saved response edits are rehydrated for every onboarding field", () => {
  const storage = new Map();
  const valid = createInitialJourney();
  const edited = updateJourney(valid, { intakeResponses: valid.intakeResponses.map((answer, index) => `${answer} [edited ${index}]`) });
  saveJourney(storage, edited);
  assert.deepEqual(loadJourney(storage).intakeResponses, edited.intakeResponses);
});

test("blank response edits cannot replace a prior valid journey", () => {
  const valid = createInitialJourney();
  const blankResponses = ["", ...valid.intakeResponses.slice(1)];
  assert.equal(responsesAreUsable(blankResponses), false);
  const invalid = updateJourney(valid, { intakeResponses: blankResponses });
  assert.deepEqual(invalid.intakeResponses, valid.intakeResponses);
});

test("storage getter and methods failing never break journey recovery", () => {
  const throwingStorage = {
    getItem() { throw new Error("read failed"); },
    setItem() { throw new Error("write failed"); },
  };
  assert.equal(loadJourney(throwingStorage).demoPerson, "Alex");
  assert.doesNotThrow(() => saveJourney(throwingStorage, createInitialJourney()));
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { get localStorage() { throw new Error("getter failed"); } } });
  assert.equal(loadJourney().demoPerson, "Alex");
  assert.doesNotThrow(() => saveJourney(null, createInitialJourney()));
  if (originalWindow === undefined) delete globalThis.window;
  else Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

test("marketplace filters by type, speciality, place, price, and earliest availability", () => {
  assert.deepEqual(
    filterProfessionals(professionals, {
      type: "Mortgage broker",
      speciality: "borrowing",
      location: "Brisbane",
      maxPrice: 100,
      maxAvailabilityRank: 5,
    }).map((person) => person.id),
    ["harper-loan"],
  );
  assert.deepEqual(
    filterProfessionals(professionals, { location: "Online", maxAvailabilityRank: 1 }),
    [],
  );
});

test("booking confirmation contains only explicitly selected context items", () => {
  const confirmation = buildBookingConfirmation({
    professional: { name: "Maya Chen", type: "Financial adviser" },
    time: "Tue 10:30 am, video",
    selectedContext: [CONTEXT_ITEMS[0].id, CONTEXT_ITEMS[3].id],
    nextPathwayStep: "Mortgage broker",
  });
  assert.deepEqual(confirmation.sharedItems, [
    "Goals and timeframe",
    "Arc's pathway summary",
  ]);
  assert.equal(confirmation.professional, "Maya Chen");
  assert.equal(confirmation.nextPathwayStep, "Mortgage broker");
});

test("reduced motion uses instant profile scrolling", () => {
  assert.equal(getScrollBehavior(true), "auto");
  assert.equal(getScrollBehavior(false), "smooth");
});

test("only financial advisers can create the scripted consultation", () => {
  assert.equal(canCreateScriptedConsultation({ type: "Financial adviser" }), true);
  assert.equal(canCreateScriptedConsultation({ type: "Mortgage broker" }), false);
});

test("marketplace controller with imports uses a normal Astro module script", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/pages/marketplace.astro"), "utf8");
  assert.doesNotMatch(source, /<script\s+define:vars=/);
  assert.match(source, /<script>\s+import\s+\{\s*buildBookingConfirmation/);
});

test("dark explainer and profile panels use the dedicated dark panel variant", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const css = readFileSync(resolve(root, "src/styles/global.css"), "utf8");
  const onboarding = readFileSync(resolve(root, "src/pages/onboarding.astro"), "utf8");
  const marketplace = readFileSync(resolve(root, "src/pages/marketplace.astro"), "utf8");
  assert.match(css, /\.panel-dark\s*\{[^}]*background:\s*var\(--forest\)/s);
  assert.match(onboarding, /class="panel panel-dark [^"]*text-white/);
  assert.match(marketplace, /class="panel panel-dark [^"]*text-white/);
});

test("landing hero keeps its primary CTA within the projected desktop viewport", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/pages/index.astro"), "utf8");
  assert.match(source, /<section class="grid[^>]*\blg:py-16\b/);
});
