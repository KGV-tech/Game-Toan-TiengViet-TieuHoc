# Review and delivery — 2026-10-03

Base: `79dd2c6a03196fa7ace78a0025350af56bca3386`.
Scope: [approved UI requirements](ADMIN_WEEKLY_INTERACTIONS_SPEC.md).

## Standards review

Independent reviewer found a delayed team-save acknowledgement could overwrite a newer week in cache. Fixed by preserving the higher version, checking deletion tombstones, and adding a deferred-RPC regression test. No remaining evidence-backed security blocker.

## Spec review

Independent reviewer found the animated name/progress stage remained hidden during a normal draw; fixed and tested for visible output. Also fixed “Thêm Nhóm mới” without a week opening a Tổ-mode form; creation now receives the requested kind, with a regression test and updated empty-state guidance.

## Validation

- Full `npm test`: 59 Node contract files and 288 Chromium tests passed. Real Supabase requests are blocked in browser tests.
- Laptop 1280×720, 1440×900, landscape tablet 1024×768: screenshots reviewed; sidebar fits, pastel surfaces and mode icons readable.
- Keyboard/form focus, reduced motion, delayed animation, cancellation, balanced random groups, counts, owner cache reload, failure preservation and per-week membership/score isolation verified.
- `npm audit`: zero reported vulnerabilities. Tabler 3.48.0 and DiceBear core 10.7.0 are development tools; only selected local SVG icons ship. Regenerate with `npm run icons:admin`; MIT notice retained.

## Supabase

User explicitly approved `20261003_classroom_week_teams.sql` for `bjgbbrufnryrtimtzvhn`. Applied through its authenticated SQL Editor; success confirmed. Catalog verified both public functions use SECURITY DEFINER, empty search_path, anon EXECUTE=false and authenticated EXECUTE=true. Private validator has EXECUTE=false for both anon/authenticated. Deployment did not invoke membership/point mutations or change existing rows.

Local proof: `tmp/ui-review/admin-polish/supabase-week-teams-verified.png`; visual captures under `tmp/ui-review/admin-polish/`.
