import { INTAKE_RESPONSES } from "../data/demo-content.mjs";

/** @typedef {{version:number, demoPerson:string, currentStep:string, intakeResponses:string[], booking: object|null}} JourneyState */

export const STORAGE_KEY = "switchpath.demoJourney.v1";

export function responsesAreUsable(responses) {
  return Array.isArray(responses) && responses.length === INTAKE_RESPONSES.length
    && responses.every((response) => typeof response === "string" && response.trim().length > 0);
}

/** @returns {JourneyState} */
export function createInitialJourney() {
  return {
    version: 1,
    demoPerson: "Alex",
    currentStep: "adviser",
    intakeResponses: [...INTAKE_RESPONSES],
    booking: null,
  };
}

function isJourney(value) {
  return Boolean(
    value &&
      value.version === 1 &&
      typeof value.demoPerson === "string" &&
      typeof value.currentStep === "string" &&
      responsesAreUsable(value.intakeResponses),
  );
}

function getStorage(storage) {
  if (storage) return storage;
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    return null;
  }
  return null;
}

/** @param {Storage|Map<string,string>|null|undefined} storage */
export function loadJourney(storage) {
  let target;
  try { target = getStorage(storage); } catch { target = null; }
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
  let target;
  try { target = getStorage(storage); } catch { target = null; }
  if (!target) return state;
  const safeResponses = responsesAreUsable(state?.intakeResponses)
    ? state.intakeResponses
    : createInitialJourney().intakeResponses;
  const snapshot = JSON.stringify({ ...createInitialJourney(), ...state, intakeResponses: safeResponses, version: 1 });
  try {
    if (target.setItem) target.setItem(STORAGE_KEY, snapshot);
    else target.set(STORAGE_KEY, snapshot);
  } catch {
    return state;
  }
  return state;
}

/** @param {JourneyState} state @param {Partial<JourneyState>} patch */
export function updateJourney(state, patch) {
  if (patch?.intakeResponses && !responsesAreUsable(patch.intakeResponses)) return { ...state, version: 1 };
  return { ...state, ...patch, version: 1 };
}
