# Continuous team-to-student presentation

## Behavior

After the first six-second Tổ/Nhóm draw, the existing fullscreen dialog stays open. It announces the chosen team, shows its name above the present student roster, and focuses the enabled “Chọn ngẫu nhiên học sinh” button. A separate click starts the second six-second draw within that dialog.

The previous meteor is hidden while waiting. Workspace refresh restores the waiting team stage; Escape deliberately exits it while retaining the selected team and completed no-repeat history. Student results continue to use the existing fullscreen winner screen.

## Review

- Spec: no required findings. Announcement, team name, roster and second-click control remain in the presentation; eligibility is restricted to the chosen team.
- Standards: no required findings after re-review. Safe text rendering and existing async guards remain intact. Review identified refresh continuity as needing verification; the waiting stage restoration and its regression test were added. A duplicate meteor assignment was removed.
- Scope: weekly UI only. No Supabase schema/data, authentication or dependency changes.

## Verification

Six regression cases cover Tổ/Nhóm on 1280×720, 1440×900 and 1024×768: the same dialog remains open after stage one; heading sits above members; the meteor is hidden while waiting; refresh restores presentation; button focus, separate second click, membership, cancellation, history and reset are checked.

The targeted seven-case suite passed. Screenshots were inspected on tablet. Chrome DevTools MCP is unavailable, so browser verification uses Playwright and local fixtures without real Supabase.

Full `npm test`: 59 Node test files and 316 Chromium tests passed.
