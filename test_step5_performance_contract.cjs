const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
const remote = fs.readFileSync(path.join(root, 'src', 'modules', 'team-competition-supabase.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(main, /SUPABASE_LIST_PROJECTIONS/);
assert.match(main, /fetchPageFromSupabase/);
assert.match(main, /ensureAdminDataLoaded/);
assert.doesNotMatch(main, /\.select\(\s*['"]\*['"]\s*\)/, 'main.js must not issue broad select(*) reads');
assert.doesNotMatch(remote, /async function fetchRows\(table, columns = ['"]\*['"]\)/, 'team adapter must use table projections');
assert.match(remote, /TEAM_COMPETITION_PROJECTIONS/);
assert.match(remote, /fetchRows\('team_competitions'\)/);
assert.match(index, /rel="preload"[^>]+login_reference_bg\.webp/);
assert.match(index, /fetchpriority="high"/);

console.log('Bước 5 performance/query contract passed.');
