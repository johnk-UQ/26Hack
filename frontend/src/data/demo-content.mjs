export const INTAKE_PROMPTS = [
  "What’s got you thinking about your financial future right now?",
  "What would you most like to achieve over the next two years?",
  "Give me a quick picture of your savings, debts, and living situation.",
  "When would you like to take the first step?",
  "What feels most confusing or concerning?",
];

export const INTAKE_RESPONSES = [
  "I have started my first proper job and saved about $35,000. I want to invest and maybe buy an investment property.",
  "Build wealth without making an expensive mistake, and understand whether property is realistic.",
  "$35,000 saved, $24,000 HECS debt, earning $85,000, renting, no dependants.",
  "In the next month. I am thinking about property within two years.",
  "I do not know who to speak to first, what advice is independent, or what I can actually afford.",
];

export const PATHWAY_STEPS = [
  {
    order: 1,
    id: "adviser",
    professional: "Financial adviser",
    timing: "Start this month",
    reason: "Clarify goals, risk tolerance, cash buffer, and how property fits the broader plan.",
    completion: "Alex understands the questions to resolve before committing money.",
    action: "See adviser matches",
  },
  {
    order: 2,
    id: "mortgage-broker",
    professional: "Mortgage broker",
    timing: "After your broader plan is clear",
    reason: "Test borrowing capacity and explain relevant loan options after the broader plan is clear.",
    completion: "Alex has a realistic borrowing range and knows what evidence lenders require.",
    action: "Preview this step",
  },
  {
    order: 3,
    id: "tax-accountant",
    professional: "Tax accountant",
    timing: "Before a purchase",
    reason: "Explain personal tax implications and record-keeping obligations before a purchase.",
    completion: "Alex knows which tax questions and records to take forward.",
    action: "Preview this step",
  },
  {
    order: 4,
    id: "conveyancer",
    professional: "Conveyancer",
    timing: "Once you identify a property",
    reason: "Review the contract and transaction once Alex identifies a property.",
    completion: "The legal transaction steps are clear before signing.",
    action: "Preview this step",
  },
];

export const ALEX_SUMMARY = [
  "Started first well-paid graduate job",
  "$85,000 income",
  "$35,000 savings",
  "$24,000 HECS debt",
  "Renting · no dependants",
  "Property considered within two years",
];

