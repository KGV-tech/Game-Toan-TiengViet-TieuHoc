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
assert.match(main, /if \(window\.supabase && !app\.data\.adminDataLoaded\)/, 'Admin composer must not schedule a stale offline rerender');
assert.match(main, /needsAdminData && !app\.data\.adminDataLoaded && window\.supabase/, 'Admin tab lazy-load must not replace offline fixture forms');
assert.doesNotMatch(main, /\.select\(\s*['"]\*['"]\s*\)/, 'main.js must not issue broad select(*) reads');
assert.doesNotMatch(remote, /async function fetchRows\(table, columns = ['"]\*['"]\)/, 'team adapter must use table projections');
assert.match(remote, /TEAM_COMPETITION_PROJECTIONS/);
assert.match(remote, /fetchRows\('team_competitions'\)/);
assert.match(index, /rel="preload"[^>]+login_reference_bg\.webp/);
assert.match(index, /fetchpriority="high"/);
assert.doesNotMatch(index, /<script\s+defer\s+src="https:\/\/cdn\.jsdelivr\.net\//i, 'CDN scripts must not block DOMContentLoaded');
assert.match(index, /script\.async\s*=\s*true/);
assert.match(index, /finish\(null, 'timeout'\)/, 'Optional CDN scripts must have a bounded timeout');
assert.match(index, /script\.addEventListener\('error'/, 'Optional CDN scripts must handle load failures');
assert.match(main, /window\.addEventListener\(['"]DOMContentLoaded['"], \(\) =>/);
assert.doesNotMatch(main, /window\.onload\s*=\s*async/);
assert.match(main, /app\.auth\.init\(\)[\s\S]*supabaseClientReady\.then\(\(\) => app\.data\.init\(\)\)/, 'Auth bindings must start before remote SDK initialization');
assert.match(index, /const polyfillApplied = result\.sdk\.polyfill\([\s\S]*?\) === true/);
assert.match(index, /if \(polyfillApplied\) \{[\s\S]*?if \(isIOSDevice\(\)\) \{\s*window\.addEventListener\(['"]touchmove['"], function \(\) \{ \}, \{ passive: false \}\)/, 'The iOS touchmove workaround must only exist when the polyfill applies');

console.log('Bước 5 performance/query contract passed.');
