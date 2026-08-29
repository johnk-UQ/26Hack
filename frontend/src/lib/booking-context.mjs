export const CONTEXT_ITEMS = [
  { id: "goals", label: "Goals and timeframe" },
  { id: "money", label: "Income, savings, and HECS debt" },
  { id: "housing", label: "Housing and dependant status" },
  { id: "pathway", label: "Arc's pathway summary" },
];

/** @param {{professional:{name:string,type:string},time:string,selectedContext?:string[],nextPathwayStep:string}} input */
export function buildBookingConfirmation(input) {
  const selected = new Set(input.selectedContext || []);
  return {
    professional: input.professional.name,
    professionalType: input.professional.type,
    time: input.time,
    sharedItems: CONTEXT_ITEMS.filter((item) => selected.has(item.id)).map((item) => item.label),
    nextPathwayStep: input.nextPathwayStep,
  };
}

