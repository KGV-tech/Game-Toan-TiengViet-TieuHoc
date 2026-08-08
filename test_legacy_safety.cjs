const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');

const legacyRls = fs.readFileSync('supabase_rls.sql', 'utf8');
assert.match(
  legacyRls,
  /RAISE EXCEPTION 'DEPRECATED: do not run supabase_rls\.sql'/,
  'The legacy permissive RLS script must fail before it can change database policies.'
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
