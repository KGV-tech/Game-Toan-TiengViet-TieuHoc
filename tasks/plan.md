# Implementation Plan: Gameplay, iPad UI, and technical stability

## Overview

Improve the pupil-facing game in three ordered phases: make the play loop clearer and more rewarding, make every core screen work naturally on iPad and phones, then strengthen technical reliability after the visual/gameplay experience is settled.

## Findings from the current UI audit

- The app is hidden on every portrait display, including iPad portrait; this causes an unnecessarily rigid experience.
- The learning map uses fixed absolute positions and several treasure/shop views use fixed-height, horizontal layouts that overflow or feel cramped on tablets.
- Several core flows rely on large inline layouts, so a focused responsive layer is safer than broad visual rewrites.
- Existing correct/wrong feedback, pet effects, rewards, and map exploration are useful gameplay foundations and should be retained.

## Architecture decisions

- Keep the existing art, stations, pets, and learning rules; improve hierarchy, touch targets, and feedback around them.
- Use CSS layout classes and responsive media queries for shared tablet behavior rather than creating separate iPad pages.
- Treat 768px and 1024px as key tablet breakpoints; support both portrait and landscape instead of blocking portrait outright.
- Land each UI slice separately and verify it before moving to technical hardening.

## Task list

### Phase 1: Responsive foundation and map usability

- [x] Task 1: Replace portrait lockout with responsive tablet layouts for login, map, navigation, and modal surfaces.
- [ ] Task 2: Give map stations stable touch targets, readable labels, and safe placement at iPad dimensions.
- [ ] Task 3: Make treasure, shop, and pet layouts stack cleanly on portrait tablets and narrow screens.

### Checkpoint: Tablet foundation

- [ ] Login, map, treasure, and shop fit at 768×1024 and 1024×768 without hidden controls or horizontal overflow.
- [ ] Existing desktop layout remains usable.

### Phase 2: Gameplay polish

- [ ] Task 4: Improve the start-of-practice flow with a visible session goal, clear difficulty/time reminder, and stronger start feedback.
- [ ] Task 5: Improve in-question feedback and end-of-round reward presentation without changing learning rules.
- [ ] Task 6: Apply lightweight button/tap sound controls and reduced-motion-safe micro-feedback.

### Checkpoint: Pupil play loop

- [ ] A pupil can understand what to choose, what reward they earned, and what to do next at every core step.
- [ ] Touch targets and text remain readable on iPad.

### Phase 3: Technical stability

- [ ] Task 7: Add resilient loading/error states for remaining data-dependent screens.
- [ ] Task 8: Review expensive rendering and shared-data refreshes after the UI design is stable.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Fixed inline layouts conflict with responsive CSS | Medium | Override only the identified core layouts in small, testable slices. |
| Large visual changes obscure learning controls | High | Preserve existing actions and add labels/feedback before decorative changes. |
| iPad device differences | Medium | Verify portrait and landscape at 768×1024 and 1024×768 before release. |
