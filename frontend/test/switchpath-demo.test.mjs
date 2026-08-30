import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
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
  assert.equal(seeded.version, 2);
  assert.equal(seeded.demoPerson, "Alex");
  assert.equal(seeded.intakeResponses.length, 1);
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
  assert.equal(JSON.parse(storage.get(STORAGE_KEY)).version, 2);
});

test("journey state rejects JSON-shaped snapshots with unusable response items", () => {
  const storage = new Map();
  const valid = createInitialJourney();
  storage.set(STORAGE_KEY, JSON.stringify({ ...valid, intakeResponses: ["kept", null, 3, {}, "also kept"] }));
  const recovered = loadJourney(storage);
  assert.deepEqual(recovered.intakeResponses, ["kept"]);
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
    "Switchpath's pathway summary",
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

test("onboarding stays compact while shared dark panels retain the forest theme", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const css = readFileSync(resolve(root, "src/styles/global.css"), "utf8");
  const onboarding = readFileSync(resolve(root, "src/pages/onboarding.astro"), "utf8");
  assert.match(css, /\.panel-dark\s*\{[^}]*background:\s*var\(--forest\)/s);
  assert.doesNotMatch(onboarding, /class="panel panel-dark [^"]*text-white/);
  assert.match(onboarding, /class="conversation-shell"/);
});

test("projector hero reserves desktop clearance for both CTA buttons", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/pages/index.astro"), "utf8");
  const styles = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles/global.css"), "utf8");
  assert.match(source, /<h1 class="display-title hero-title[^>]*>/);
  assert.match(styles, /@media \(min-width: 1024px\)\s*\{\s*\.hero-title\s*\{\s*font-size: 5rem;/);
});

test("landing hero has a one-shot conversation reveal with reduced-motion fallback", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const source = readFileSync(resolve(root, "src/pages/index.astro"), "utf8");
  const styles = readFileSync(resolve(root, "src/styles/global.css"), "utf8");
  assert.match(source, /hero-bubble-soft[^>]*hero-sequence-question/);
  assert.match(source, /hero-bubble-dark[^>]*hero-sequence-response/);
  assert.match(source, /hero-recommendation[^>]*hero-sequence-recommendation/);
  assert.match(source, /hero-thinking/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /hero-sequence-question[^}]*animation/);
  assert.match(styles, /hero-sequence-response[^}]*animation/);
  assert.match(styles, /hero-sequence-recommendation[^}]*animation/);
  assert.match(styles, /hero-thinking-dot[^}]*animation/);
  assert.match(styles, /event-link:hover[^}]*transform/);
  assert.match(styles, /#how-it-works article:hover[^}]*transform/);
  assert.match(styles, /button-primary[^}]*transition/);
});

test("onboarding uses the two-turn AI journey and direct pathway navigation", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/pages/onboarding.astro"), "utf8");
  assert.match(source, /createAiJourneyClient/);
  assert.match(source, /status === "needs_clarification"/);
  assert.match(source, /pendingAnswers/);
  assert.match(source, /location\.assign\(['\"]\/pathway['\"]\)/);
  assert.match(source, /saveJourney\(null, next\)/);
});

test("journey mode defaults to AI while demo mode is explicitly selectable", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const source = readFileSync(resolve(root, "src/pages/onboarding.astro"), "utf8");
  const devAi = readFileSync(resolve(root, "scripts/dev-ai.mjs"), "utf8");
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.match(source, /PUBLIC_JOURNEY_MODE/);
  assert.match(source, /createAiJourneyClient/);
  assert.match(source, /createExampleJourney/);
  assert.match(source, /mode === "demo"/);
  assert.equal(pkg.scripts["dev:demo"], "node scripts/dev-demo.mjs");
  assert.match(pkg.scripts["dev:ai"], /scripts\/dev-ai\.mjs/);
  assert.match(devAi, /PUBLIC_JOURNEY_MODE:\s*"ai"/);
});

test("journey state migrates the opening answer from a v1 five-response snapshot and drops unknown fields", () => {
  const storage = new Map();
  storage.set(LEGACY_STORAGE_KEY, JSON.stringify({ version: 1, intakeResponses: ["A different opening situation.", "second", "third", "fourth", "fifth"], unknown: "discard me" }));
  const migrated = loadJourney(storage);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.intakeResponses, ["A different opening situation."]);
  assert.equal(migrated.initialSituation, "A different opening situation.");
  assert.equal(Object.hasOwn(migrated, "unknown"), false);
});

test("malformed generated state never escapes load or save", () => {
  const storage = new Map();
  storage.set(STORAGE_KEY, JSON.stringify({ version: 2, generatedMatches: {} }));
  assert.doesNotThrow(() => loadJourney(storage));
  assert.equal(loadJourney(storage).generatedMatches, null);
  assert.doesNotThrow(() => saveJourney(storage, { generatedMatches: [null] }));
  assert.equal(loadJourney(storage).generatedMatches, null);
});

test("onboarding uses a compact send control, one follow-up, and staged analysis", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/pages/onboarding.astro"), "utf8");
  assert.match(source, /aria-label="Send response"/);
  assert.match(source, /analysis\.hidden = false/);
  assert.match(source, /analysis\.querySelectorAll\("li"\)/);
  assert.match(source, /followUp\.answer/);
});

test("onboarding keeps the conversation viewport until direct pathway navigation", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/pages/onboarding.astro"), "utf8");
  assert.doesNotMatch(source, /conversation\.hidden\s*=\s*true/);
  assert.match(source, /conversation-viewport/);
  assert.match(source, /location\.assign\(['\"]\/pathway['\"]\)/);
});

test("header keeps only the streamlined onboarding action", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/components/Header.astro"), "utf8");
  assert.match(source, /Tell Switchpath what’s happening/);
  assert.doesNotMatch(source, /Start over/);
  assert.doesNotMatch(source, /Get started/);
});

test("pathway cards and next action derive from the persisted generated pathway", () => {
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src/pages/pathway.astro"), "utf8");
  assert.doesNotMatch(source, /pathway-summary/);
  assert.match(source, /class="summary-hint"/);
  assert.match(source, /generatedPathway/);
  assert.match(source, /See \$\{step\.professional\} matches/);
});

test("pathway exposes generated rendering and persisted next-step hooks", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const pathway = readFileSync(resolve(root, "src/pages/pathway.astro"), "utf8");
  assert.match(pathway, /generatedPathway/);
  assert.match(pathway, /generatedSummary/);
  assert.match(pathway, /pathway-later/);
  assert.match(pathway, /details/);
  assert.match(pathway, /fallback-later/);
  assert.match(pathway, /class="summary-hint"/);
  assert.match(pathway, /What may come later/);
});

test("static fallback cards use shared progress metadata and persisted completion", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const pathway = readFileSync(resolve(root, "src/pages/pathway.astro"), "utf8");
  assert.match(pathway, /<section aria-labelledby="pathway-title">[\s\S]*<details class="pathway-later" id="fallback-later">[\s\S]*<\/section><aside/);
  assert.match(pathway, /<li data-pathway-step=\{step\.id\} data-order=\{step\.order\} class="path-card path-card-preview">/);
  assert.match(pathway, /if \(steps\) document\.querySelector\("#fallback-later"\)\.hidden = true;/);
  assert.doesNotMatch(pathway, /if \(!steps\) document\.querySelector\("#pathway-summary"\)\.textContent = "0 complete · 1 active · 3 previews"/);
});

test("product blueprint labels pre-MVP controls and pages as historical review", () => {
  const blueprint = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../docs/product-blueprint.md"), "utf8");
  assert.match(blueprint, /At the time of the initial review/);
  assert.doesNotMatch(blueprint, /The current onboarding controls are static\./);
});

test("typography bundles Inter for interface copy and uses system Times New Roman for headings", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const layout = readFileSync(resolve(root, "src/layouts/Layout.astro"), "utf8");
  const css = readFileSync(resolve(root, "src/styles/global.css"), "utf8");
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

  assert.ok(pkg.dependencies["@fontsource-variable/inter"], "Inter Variable must be a bundled dependency");
  assert.ok(!pkg.dependencies["@fontsource-variable/newsreader"], "Newsreader must no longer be a dependency");
  assert.match(layout, /import "@fontsource-variable\/inter/);
  assert.doesNotMatch(layout, /@fontsource-variable\/newsreader/);

  assert.match(css, /--font-sans:\s*"Inter Variable"[^;]*system-ui/);
  assert.match(css, /--font-serif:\s*"Times New Roman",\s*Times,\s*serif/);
  assert.match(css, /body\s*\{[^}]*font-family:\s*var\(--font-sans\)/s);
  assert.match(css, /\.display-title\s*\{[^}]*font-family:\s*var\(--font-serif\)/s);
  assert.match(css, /\.section-title\s*\{[^}]*font-family:\s*var\(--font-serif\)/s);
});
