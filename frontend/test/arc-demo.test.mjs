import test from "node:test";
import assert from "node:assert/strict";

import {
  STORAGE_KEY,
  createInitialJourney,
  loadJourney,
  saveJourney,
  updateJourney,
} from "../src/lib/journey-state.mjs";
import { filterProfessionals } from "../src/lib/marketplace-filter.mjs";
import { buildBookingConfirmation, CONTEXT_ITEMS } from "../src/lib/booking-context.mjs";

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
