# Weekly random draw: two explicit stages

## Scope

- Tổ/Nhóm → học sinh first draws a team for six seconds, then shows only its present students. A second click starts the six-second student draw.
- Returning to the team stage preserves hidden student history. Reset clears it; cancelling an animation preserves the selected team and completed draws.
- Team management cards use content-sized rows, smaller headings and member chips. Small random pools use bounded card heights with readable names and scores. Decorative crossing lines are removed from team management cards.
- No schema, Supabase data, dependencies or authentication changes.

## Review

- Standards review: no required findings. Changes are scoped to weekly workspace; existing admin checks, async cancellation guards and HTML sanitization remain in place.
- Spec review: confirmed explicit team/student stages and eligible student filtering. The cancellation fixture initially left only one eligible student in one team; it was corrected to leave two, so Escape consistently tests cancellation rather than exhaustion.
- Self-review: mode changes and reset clear the selected stage; returning to team selection retains history; absent students are excluded; the visible roster retains previously selected students.

## Validation

- Regression tests cover both Tổ and Nhóm, no automatic second draw, selected-team membership, cancellation, retained history and reset.
- Layout checks and screenshots cover 1280×720, 1440×900 and 1024×768, with 31 long student names across six groups. Main content remains within its bounds; long roster content uses the intentional child list.
- Playwright uses local fixtures and does not call real Supabase. Chrome DevTools MCP was unavailable; runtime verification used Playwright.
- Full validation: 59 Node test files and 307 Chromium tests passed.

## Design choices

The same six-second meteor effect runs separately for each click, making the team result visible before the teacher starts the student draw. Small candidate pools no longer stretch to fill the available height. Management cards group the icon, name and member count into one compact header and keep actions below the member list.
