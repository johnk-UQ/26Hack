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

## Typography

Two families, bundled locally through Fontsource so no request leaves the deployment.

| Role | Family | Token | Weights | Used for |
| --- | --- | --- | --- | --- |
| Editorial | Newsreader Variable | `--font-serif` | 500 headings, 600–700 wordmark | `.display-title`, `.section-title`, `font-serif` headings, the `arc` wordmark, confirmation headings |
| Interface | Inter Variable | `--font-sans` | 400 body, 600–800 labels and buttons | Body copy, navigation, forms, cards, eyebrows, metadata |

- Fallbacks: `--font-serif` falls back to Georgia then Times New Roman; `--font-sans` falls back to system UI sans. Both are declared in `@theme` in `frontend/src/styles/global.css`, so Tailwind's `font-serif` and `font-sans` utilities resolve to the same stacks.
- Loading: `frontend/src/layouts/Layout.astro` imports `@fontsource-variable/inter/wght.css` and `@fontsource-variable/newsreader/wght.css`. Fonts are emitted into the build output and served from the site. Do not add Google Fonts `<link>` tags.
- Sizing: headings keep the existing `clamp()` scale. Body copy stays at or above 16px, supporting copy at or above 14px, and uppercase labels at or above 11px with `0.12em` tracking.
- Newsreader is set at weight 500 with `font-optical-sizing: auto` for projector legibility; do not drop editorial headings below 500. Reserve italics for genuine emphasis.
- Body text uses `font-synthesis-weight: none` so no faux-bold appears if a font fails to load.
- Avoid gradients, ornamental finance imagery, and any third family.

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
