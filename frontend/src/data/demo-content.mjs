export const INTAKE_PROMPTS = [
  "What’s got you thinking about your financial future right now?",
  "What would you most like to achieve over the next two years?",
  "Give me a quick picture of your savings, debts, and living situation.",
  "When would you like to take the first step?",
  "What feels most confusing or concerning?",
];

export const INTAKE_RESPONSES = [
  "hey so im 21 and at uni and honestly have no idea what im doing with money lol",
  "Build wealth without making an expensive mistake, and understand whether property is realistic.",
  "$35,000 saved, $24,000 HECS debt, earning $85,000, renting, no dependants.",
  "In the next month. I am thinking about property within two years.",
  "I do not know who to speak to first, what advice is independent, or what I can actually afford.",
];

export const DEMO_CONVERSATION = [
  { role: "assistant", text: "That’s fine. Tell me what’s going on at the moment. What money is coming in, what do you owe, and is there anything you’re trying to work toward?" },
  { role: "user", text: "i did an internship this yr and made like 30k from it, ive got maybe 18k left in my bank\n\nalso have like 4.5k on a credit card which is probs bad\n\nstill have hecs obviously and i work casual at a bar during semester but the hours are random" },
  { role: "assistant", text: "Got it. A few things are happening at once. Before I work out who might be useful, what are you hoping to achieve with the money you have left?" },
  { role: "user", text: "honestly just wanna not waste it\n\nlike i want to get ahead while im young but idk if that means investing or paying everything off or putting it in super or what\n\nalso pretty sure i didnt do my tax properly from the internship and i got paid some bonus thing at the end" },
  { role: "assistant", text: "And roughly how expensive is the credit card debt? Do you know the interest rate or minimum payment?" },
  { role: "user", text: "no clue on the rate 😭 i just know it keeps charging me interest\n\nminimum is like 120ish i think\n\nalso might do another internship over summer so my income could go up again but its not guaranteed" },
];

export const PATHWAY_STEPS = [
  {
    order: 1,
    id: "adviser",
    professional: "Financial adviser",
    timing: "Start this month",
    firstConversation: "30–60 min · indicative $195–$250",
    reason: "Clarify goals, risk tolerance, cash buffer, and how property fits the broader plan.",
    completion: "You understand the questions to resolve before committing money.",
    action: "See adviser matches",
  },
  {
    order: 2,
    id: "mortgage-broker",
    professional: "Mortgage broker",
    timing: "After your broader plan is clear",
    firstConversation: "30–60 min · indicative fee varies",
    reason: "Test borrowing capacity and explain relevant loan options after the broader plan is clear.",
    completion: "You have a realistic borrowing range and know what evidence lenders require.",
    action: "Preview this step",
  },
  {
    order: 3,
    id: "tax-accountant",
    professional: "Tax accountant",
    timing: "Before a purchase",
    firstConversation: "30–60 min · indicative fee varies",
    reason: "Explain personal tax implications and record-keeping obligations before a purchase.",
    completion: "You know which tax questions and records to take forward.",
    action: "Preview this step",
  },
  {
    order: 4,
    id: "conveyancer",
    professional: "Conveyancer",
    timing: "Once you identify a property",
    firstConversation: "30–60 min · indicative fee varies",
    reason: "Review the contract and transaction once you identify a property.",
    completion: "The legal transaction steps are clear before signing.",
    action: "Preview this step",
  },
];

export const SHARED_CONTEXT = [
  "Started first well-paid graduate job",
  "$85,000 income",
  "$35,000 savings",
  "$24,000 HECS debt",
  "Renting · no dependants",
  "Property considered within two years",
];
