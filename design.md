# Design - Moana

This is the shared visual system for the Moana marketing and authentication
surfaces. It carries the structural DNA of the public Venice reference while
using Moana copy, routes, and working credentials-only authentication.

## Genre

Atmospheric editorial product surface.

## Macrostructure family

- Marketing pages: Marquee Hero with Feature Stack pacing.
- Authentication pages: Single-focus portal with a centred Venice-style form card.
- Chat and studio pages: Workbench layouts remain functional and are not
  decorated with marketing enrichment.

## Theme

- Paper: `#eeede4`, a warm off-white surface.
- Paper alternate: `#f7f6ee`, a brighter content surface.
- Ink: `#0e2942`, a deep sea blue.
- Ink muted: `#536271`.
- Rule: `#0e29421a`.
- Accent: `#125da3`, used for primary actions and active indicators.
- Accent ink: `#ffffff`.
- Auth paper: warm off-white, matching the marketing surface.
- Auth panel: near-white card with a thin ink rule and quiet shadow.
- Auth rule: low-contrast deep-sea ink at 12% opacity.

## Typography

- Display: Canela, roman, for headings and the wordmark.
- Body: Aeonik, for prose and controls.
- Label: Aeonik Fono, for compact labels and code.
- Display tracking is zero. Body measure stays between 45 and 75 characters.

## Spacing

Use the four-point semantic scale in `tokens.css`. Marketing sections may vary
their vertical rhythm, but controls share the 44px touch-target floor.

## Motion

Lenis owns the marketing scroll wrapper. Framer Motion is limited to the
feature stack state and the single scroll-morph navigation transition. Motion
uses transform and opacity only, with an opacity-only fallback under reduced
motion. No universal scroll-triggered reveal.

## Microinteractions

Controls use explicit background, border, transform, and focus transitions.
Focus rings are immediate. Hover-only content gets a focus and tap equivalent.
Success is silent; loading stays inside the control.

## CTA voice

Primary actions are compact blue buttons with a trailing arrow. Secondary
actions are text links with an arrow or low-contrast outlined controls. Labels
stay on one line at every supported width.

## Authentication

Login and registration share the same light Venice-style card, centred mark,
visible labels, and 48px fields. The existing server actions, validation states,
and routes remain unchanged. Third-party provider buttons are omitted until
their backend providers exist.

## Responsive contract

The marketing shell has no horizontal overflow at 320, 375, 414, or 768 CSS
pixels. The desktop navigation collapses to a corner chip on touch widths.
Sticky feature media becomes a normal stacked sequence below 60rem. Auth panels
use 16px minimum side padding and never require a second horizontal axis.
