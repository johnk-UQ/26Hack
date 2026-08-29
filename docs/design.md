# Arc visual design direction

This document governs the demo’s visual implementation. Product behaviour and copy live in [product-blueprint.md](product-blueprint.md).

## Experience principles

1. **Reassuring before impressive.** Explain unfamiliar decisions in plain language and show one next step at a time.
2. **Guided, not prescriptive.** Make sequence and rationale prominent; reserve professional recommendations for fictional matches.
3. **Editorial, not institutional.** Retain Arc’s confident typography and generous space while replacing private-market imagery and jargon.
4. **Stage legibility.** Important headings, progress, prices, and calls to action must read clearly when projected from a laptop.

## Adopted deep-green / pale-green visual system

The demo uses the newer deep-green and pale-green direction for a calmer, more
distinctive marketplace. The green is paired with near-white surfaces and
black-green text for contrast; lime is reserved for primary actions and active
states.

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#f3f7ee` | Main page background |
| Pale green | `#e1efcf` | Grouped content, rationale blocks, active context |
| Raised surface | `#fbfdf9` | Cards, inputs, and conversation bubbles |
| Deep green | `#123b2a` | Header accents, summary, and confirmation panels |
| Ink | `#12231b` | Primary text |
| Secondary ink | `#53665c` | Supporting copy |
| Quiet ink | `#738178` | Labels and metadata |
| Lime | `#c8ec89` | Primary actions and active progress |
| Hairline | `deep green / 14%` | Dividers and card boundaries |

Keep the current serif display treatment—Georgia with Times New Roman fallback—for major editorial headings. Use the existing sans-serif stack for interface copy. Avoid gradients and ornamental finance imagery.

## Interface patterns

- **Header:** compact Arc wordmark, current journey status, and a quiet **Restart demo** action.
- **Conversation:** Arc messages use a soft raised bubble and small lime avatar; Alex’s responses use a dark bubble. Keep line length below roughly 65 characters on desktop.
- **Pathway step:** numbered vertical sequence with status, professional type, reason, timing, and one action. Active lime, future neutral, completed dark with a check.
- **Match card:** name and speciality first; price and earliest time on one scan line; match rationale in a distinct tinted block. Use **Fictional demo profile** as quiet metadata.
- **Filter chip:** outlined at rest, dark when selected. Every selected state must be communicated beyond colour.
- **Primary action:** lime pill with black text. Use one primary action per panel.
- **Context sharing:** plain checkboxes and short labels; start unchecked and show a live “Sharing N items” summary.
- **Confirmation:** dark panel with large serif heading, booking details, shared-context recap, and the next pathway step.

## Page composition

- **Landing:** consumer promise above the fold, a concrete example prompt, one primary action, then a short “how Arc helps” sequence and example life events.
- **Onboarding:** conversation occupies about two-thirds of desktop width; a sticky summary/progress panel occupies one-third. Stack conversation before summary on mobile.
- **Pathway:** lead with “Here’s who can help, and in what order.” Keep the ordered path dominant; supporting summary remains secondary.
- **Marketplace:** tabs and filters precede results. Use a roomy card list or three-column adviser grid at wide widths; profile detail may be a dedicated panel or modal.

## Responsive and motion rules

Optimise the pitch composition for a 13–15-inch laptop around 1440×900. Preserve the entire primary action and the next meaningful content cue within the first viewport. At narrow widths, use one column, full-width actions, and horizontally scrollable filter chips.

Motion should explain state changes: short message reveal, pathway progress, and booking confirmation. Keep transitions around 150–250 ms and disable non-essential movement under `prefers-reduced-motion`.

## Accessibility completion criteria

- Body copy meets WCAG AA contrast; lime is paired with black text.
- Every input has a visible or programmatic label and useful error text.
- All interactive elements are reachable and operable by keyboard with a visible focus style.
- Headings follow a logical hierarchy, and pathway order is meaningful without visual styling.
- Status, matching, and selection never rely on colour alone.
- Dialogs, if used, trap focus, announce their title, and return focus to the opener.
