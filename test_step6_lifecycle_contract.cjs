const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const lifecyclePath = path.join(root, 'src', 'modules', 'lifecycle.js');
const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
const router = fs.readFileSync(path.join(root, 'src', 'modules', 'router.js'), 'utf8');
const remote = fs.readFileSync(path.join(root, 'src', 'modules', 'team-competition-supabase.js'), 'utf8');

assert.match(lifecycle, /app\.lifecycle/);
for (const method of ['listen', 'timeout', 'interval', 'cleanup']) {
    assert.match(lifecycle, new RegExp(`${method}\\s*\\(`), `lifecycle must expose ${method}()`);
}
assert.match(main, /cleanupMatching\s*\(/);
assert.match(main, /removeEventListener\(['"]resize['"]|lifecycle\.cleanup\(['"]game-question['"]\)/);
assert.match(main, /shutdownRealtime\s*\(/);
assert.match(main, /stopTimer\s*\(/);
assert.match(router, /stopTimers/);
assert.match(router, /stopTeamCompetitionBoardTimer/);
assert.match(remote, /shutdown\s*\(/);
assert.match(remote, /removeChannel|removeChannel\?/);
assert.match(remote, /lifecycleEpoch/);
assert.match(remote, /syncEpoch/);
assert.match(remote, /clearRemoteQuestions/);

console.log('Bước 6 lifecycle contract passed.');
