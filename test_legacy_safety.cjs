const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');

const legacyRls = fs.readFileSync('supabase_rls.sql', 'utf8');
assert.match(legacyRls, /DEPRECATED/i, 'The legacy RLS file must be clearly marked as deprecated.');
assert.match(
  legacyRls,
  /supabase_auth_security\.sql/,
  'The legacy RLS file must direct operators to the Auth-enabled migration.'
);
assert.doesNotMatch(
  legacyRls,
  /\b(?:ALTER\s+TABLE|CREATE\s+POLICY)\b/i,
  'The deprecated RLS file must not retain executable policy or table statements.'
);

const legacyPatchScripts = [
  'fix.js',
  'fix2.js',
  'patch.js',
  'patch_main.cjs',
  'update.js',
  'update_note.js',
];

for (const file of legacyPatchScripts) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(
    source,
    /require\('\.\/legacy-patch-guard\.cjs'\)/,
    `${file} must require the explicit legacy-patch safety guard.`
  );

  const syntaxCheck = childProcess.spawnSync(process.execPath, ['--check', file]);
  assert.equal(syntaxCheck.status, 0, `${file} must have valid JavaScript syntax.`);
}

const guard = fs.readFileSync('legacy-patch-guard.cjs', 'utf8');
assert.match(guard, /--allow-legacy-patch/, 'The guard must require an explicit opt-in flag.');

console.log('Legacy database and patch-script safety contracts verified.');
