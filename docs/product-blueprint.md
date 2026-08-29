# Switchpath MVP product blueprint

Switchpath is an AI-guided front door to financial professional services. The user describes what is happening in their life; Switchpath explains which professionals may help, why they matter, and what to do next.

**Promise:** You do not need to know who to call. Just tell us what is happening.

This document is the product source of truth for the pitch demo. See [design.md](design.md) for visual rules and [domain-glossary.md](domain-glossary.md) for shared terms.

## Current-site review (historical baseline)

The existing Astro site is visually polished but demonstrates a private-markets investing product rather than this service-navigation concept.

| Keep | Replace or add |
| --- | --- |
| Switchpath name, editorial typography, warm neutrals, lime accent, strong spacing | Investment-market language and imagery |
| Responsive landing-page foundation | Consumer promise and example life events |
| Existing onboarding layout | Working scripted conversation and progress |
| Advice disclaimer | Clearer navigation-versus-advice boundary |
| — | `/pathway` and working `/marketplace` experiences |

At the time of the initial review, the onboarding controls were static. Links to `/marketplace` and `/fund` had no corresponding pages, and the main MVP pathway, professional matches, rationale, and booking interaction did not yet exist. Those observations describe the pre-MVP baseline; the current implementation provides the working routes and scripted journey described below.

## Demo user and moment

**Alex**, 24, lives in Brisbane and has started a first well-paid graduate job. Alex earns $85,000, has $35,000 in savings and $24,000 in HECS debt, rents, has no dependants, and is considering an investment property within two years.

Alex arrives thinking:

> I finally have money left over each month. I want to build wealth and maybe buy an investment property, but I do not know what to do first or who to trust.

All amounts are AUD. Alex and every professional are fictional demo data.

## Happy path

| Route | Demo outcome |
| --- | --- |
| `/` | Explain Switchpath in plain language, show relevant life events, and start the journey. |
| `/onboarding` | Run the five-message scripted intake and let Alex review the captured facts. |
| `/pathway` | Show the ordered professional pathway, reasons, timing, and current step. |
| `/marketplace` | Show personalised matches or browse all professionals; open a profile and request a consultation. |

The pitch path is `/` → `/onboarding` → `/pathway` → `/marketplace` → in-page booking confirmation.

## Scripted intake

Use quick replies or prefilled responses, with an editable text field to preserve the conversational feel.

| Switchpath prompt | Scripted response |
| --- | --- |
| What’s got you thinking about your financial future right now? | I have started my first proper job and saved about $35,000. I want to invest and maybe buy an investment property. |
| What would you most like to achieve over the next two years? | Build wealth without making an expensive mistake, and understand whether property is realistic. |
| Give me a quick picture of your savings, debts, and living situation. | $35,000 saved, $24,000 HECS debt, earning $85,000, renting, no dependants. |
| When would you like to take the first step? | In the next month. I am thinking about property within two years. |
| What feels most confusing or concerning? | I do not know who to speak to first, what advice is independent, or what I can actually afford. |

Before generating the pathway, show a short summary with **Edit** and **Build my pathway** actions.

## Generated pathway

Switchpath describes the questions each professional can answer; it does not recommend an investment, property, loan, tax structure, or provider as objectively best.

| Order | Professional | Why now | Completion signal |
| --- | --- | --- | --- |
| 1 | Financial adviser | Clarify goals, risk tolerance, cash buffer, and how property fits the broader plan. | Alex understands the questions to resolve before committing money. |
| 2 | Mortgage broker | Test borrowing capacity and explain relevant loan options after the broader plan is clear. | Alex has a realistic borrowing range and knows what evidence lenders require. |
| 3 | Tax accountant | Explain personal tax implications and record-keeping obligations before a purchase. | Alex knows which tax questions and records to take forward. |
| 4 | Conveyancer | Review the contract and transaction once Alex identifies a property. | The legal transaction steps are clear before signing. |

Each pathway card shows status, reason, suggested timing, and one action. The adviser step is active; later steps are previewable rather than fully built.

## Marketplace and demo data

`/marketplace` has two tabs:

- **Your matches:** ranked for Alex’s active pathway step, with a specific match rationale.
- **Browse all professionals:** filter by professional type, speciality, Brisbane/online, price, and earliest availability.

The adviser step gets three complete fictional profiles:

| Professional | Speciality | Initial consultation | Availability | Why Switchpath matched them |
| --- | --- | --- | --- | --- |
| Maya Chen | Early-career wealth planning; property readiness | $220 / 60 min | Tue 10:30 am, video | Works with first-time investors and charges a clear fixed initial fee. |
| Daniel Okafor | Cash-flow planning; investment foundations | $195 / 50 min | Thu 4:00 pm, Brisbane or video | Fits Alex’s near-term availability and focuses on building a plan before choosing products. |
| Sophie Nguyen | Goals-based advice; property-versus-portfolio decisions | $250 / 60 min | Wed 12:30 pm, video | Relevant to Alex’s unresolved property question and two-year horizon. |

Browse-all may seed one mortgage broker, tax accountant, and conveyancer with the same fields. Every profile must visibly state **Fictional demo profile**. Credential verification is out of scope.

## Booking and context control

From a profile, Alex selects a fictional time and reaches a context-sharing checklist. Start every item unchecked:

- goals and timeframe;
- income, savings, and HECS debt;
- housing and dependant status;
- Arc’s pathway summary.

The primary action changes from **Request consultation** to a confirmation state naming the professional, time, shared items, and next pathway step. No real booking, payment, account, email, or calendar action occurs.

## Implementation shape

- Keep Astro static output and the existing Tailwind/Vite integration.
- Use Astro components plus small page-level TypeScript scripts; add no UI framework.
- Store fictional professionals, intake prompts, and pathway steps in typed local modules.
- Persist demo progress under a versioned `localStorage` key such as `switchpath.demoJourney.v1`.
- Seed the confirmed Alex journey when state is absent, and provide **Restart demo**.
- Add no backend, authentication, external API, payment, or secret.

Suggested content boundaries are `src/data/demoJourney.ts`, `src/data/professionals.ts`, and reusable cards under `src/components/`. Coding agents should follow existing project conventions before introducing new structure.

## Acceptance checklist

- The complete pitch path works from a fresh browser session without a backend.
- Every navigation target in the primary flow exists; remove or replace the dead `/fund` link and `#markets` anchor.
- The pathway names the professional, sequence, reason, timing, and next action.
- At least three adviser profiles show speciality, price, availability, and individual match rationale.
- Browse-all filters visibly change the fictional results.
- Booking confirmation reflects the selected time and only the context Alex chose to share.
- Navigation and controls work by keyboard, inputs have programmatic labels, focus is visible, and reduced-motion preferences are respected.
- The experience is composed for a projected laptop around 1440×900 and remains usable on a narrow mobile viewport.
- Navigation copy consistently distinguishes Arc’s guidance from professional financial, credit, tax, and legal advice.
