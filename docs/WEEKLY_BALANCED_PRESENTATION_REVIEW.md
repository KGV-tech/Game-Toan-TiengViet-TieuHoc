# Balanced weekly draw presentation

## Request and implementation

- Light Admin loading cards used a dark background with light-theme muted text. Loading, error and empty state cards now consume the existing pastel Admin surface; the spinner uses contrasting teal.
- Direct Tổ/Nhóm results say “Tổ/Nhóm may mắn được chọn”. Student results retain “Bạn may mắn được chọn”.
- Fullscreen pools of 1–10 candidates use centered rows. Four cards form 2+2, five form 3+2, six form 3+3; incomplete last rows remain centered. Larger class lists retain their existing grid.
- No database, authentication or dependency changes.

## Standards review

No required findings. Scoped vanilla UI changes preserve sanitized result names and existing security boundaries. Suggested checking 1440×900 presentation explicitly; that viewport was added alongside 1280×720 and 1024×768.

## Spec review

No required findings. Light loading surfaces, distinct team/student captions and centered fullscreen rows match the request without changing draw eligibility or timing.

## Validation

- The four initial regression cases failed before implementation on the reported colors, caption and row arrangement, then passed after the fix.
- Full `npm test`: 59 Node test files and 311 Chromium tests passed.
- Final focused suite adds the explicit 1440×900 presentation case: five tests passed, covering all counts 1–10 at three viewports, both themes, loading colors and all five winner modes.
- Screenshots verify the pastel loading card and the 3+2 centered layout. DevTools MCP is unavailable; browser validation uses Playwright and local fixtures without real Supabase.
