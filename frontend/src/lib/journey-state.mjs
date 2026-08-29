/** @typedef {{version:number, demoPerson:string, currentStep:string, intakeResponses:string[], booking: object|null}} JourneyState */

export const STORAGE_KEY = "arc.demoJourney.v1";

const RESPONSES = [
  "I have started my first proper job and saved about $35,000. I want to invest and maybe buy an investment property.",
  "Build wealth without making an expensive mistake, and understand whether property is realistic.",
  "$35,000 saved, $24,000 HECS debt, earning $85,000, renting, no dependants.",
  "In the next month. I am thinking about property within two years.",
  "I do not know who to speak to first, what advice is independent, or what I can actually afford.",
];

/** @returns {JourneyState} */
export function createInitialJourney() {
  return {
    version: 1,
    demoPerson: "Alex",
    currentStep: "adviser",
    intakeResponses: [...RESPONSES],
    booking: null,
  };
}

function isJourney(value) {
  return Boolean(
    value &&
      value.version === 1 &&
      typeof value.demoPerson === "string" &&
      typeof value.currentStep === "string" &&
      Array.isArray(value.intakeResponses) &&
      value.intakeResponses.length === 5 &&
      value.intakeResponses.every((response) => typeof response === "string" && response.trim().length > 0),
  );
}

function getStorage(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

/** @param {Storage|Map<string,string>|null|undefined} storage */
export function loadJourney(storage) {
  const target = getStorage(storage);
  if (!target) return createInitialJourney();
  try {
    const raw = target.getItem ? target.getItem(STORAGE_KEY) : target.get(STORAGE_KEY);
    if (!raw) return createInitialJourney();
    const value = JSON.parse(raw);
    return isJourney(value) ? { ...createInitialJourney(), ...value } : createInitialJourney();
  } catch {
    return createInitialJourney();
  }
}

/** @param {Storage|Map<string,string>|null|undefined} storage @param {JourneyState} state */
export function saveJourney(storage, state) {
  const target = getStorage(storage);
  if (!target) return state;
  const snapshot = JSON.stringify({ ...createInitialJourney(), ...state, version: 1 });
  if (target.setItem) target.setItem(STORAGE_KEY, snapshot);
  else target.set(STORAGE_KEY, snapshot);
  return state;
}

/** @param {JourneyState} state @param {Partial<JourneyState>} patch */
export function updateJourney(state, patch) {
  return { ...state, ...patch, version: 1 };
}
