const assert = require('node:assert/strict');
const fs = require('node:fs');

const migrationPath = 'supabase/migrations/20260910_question_templates_harden_split_replace.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
const main = fs.readFileSync('src/main.js', 'utf8');

const remediationIds = [
  '3df20abd-182a-42be-975d-6a33bf451515',
  'e30cc858-22e8-42fe-b63d-5118d07ade0c',
  '5617107c-9fa0-4ed0-86e2-6d9206732926',
  '7fd969fd-ddb1-4926-a5f9-94cc45e4f754',
  '008efb59-f1e9-4fbf-bb2a-5eb3e6f4cc5e',
  'a5f9b495-42b6-4d92-84b7-e66b347f7471',
  '602aa6d9-1a22-42a8-a3c3-fc0b55e30326',
  '5406d38e-85a8-415f-ad7c-c028aab968fa',
  'd8203d07-f645-479e-8d20-0930ca087550',
  '27345061-c036-42b3-9693-3196623dc95b',
  '475cb396-a04e-40a5-9221-632612ec558b',
  '2beec1a2-63fa-4caa-8c37-79b466490b35',
  '5a30dfbf-7cc9-4c35-9fc8-5bb64b7cd742',
  'c9de8f63-cdab-422a-a52e-7af1001f8ab5',
  '188eda5d-8495-4a34-87dc-62eb3544baaa',
  '98ef2899-fc44-41ef-a600-79fff0379d21',
  '0a62edfa-5d1a-48ef-8496-9715d6b289a0'
];

assert.ok(migration, 'The remediation migration must exist before the live cleanup is applied.');
assert.match(migration, /BEGIN;[\s\S]*COMMIT;/i, 'Remediation must run in one transaction.');
assert.match(migration, /INSERT\s+INTO\s+public\.question_templates/i, 'Split replacements must be seeded.');
assert.match(migration, /NOT\s+EXISTS/i, 'The seed must be idempotent.');
assert.match(migration, /is_active\s*=\s*FALSE/i, 'Superseded records must be archived reversibly.');
assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i, 'Remediation must not physically delete templates.');
assert.doesNotMatch(migration, /CREATE\s+POLICY|DROP\s+POLICY|\bGRANT\s|\bREVOKE\s/i, 'Remediation must not change RLS or permissions.');
assert.doesNotMatch(migration, /g4-math-hk1-b05/i, 'B05 remains deferred.');

for (const id of remediationIds) {
  assert.match(migration, new RegExp(id), `The remediation migration must account for ${id}.`);
}

for (const lesson of ['g4-math-hk1-b11', 'g4-math-hk1-b12', 'g4-math-hk1-b14', 'g4-math-hk1-b15', 'g4-math-hk1-b16', 'g4-math-hk1-b19']) {
  assert.match(migration, new RegExp(lesson), `The migration must assign ${lesson} where appropriate.`);
}
for (const lesson of ['g4-math-hk1-b22', 'g4-math-hk1-b23']) {
  assert.match(migration, new RegExp(lesson), `The migration must seed both operation-specific variants for ${lesson}.`);
}
assert.match(migration, /"operation"\s*:\s*"\+"/);
assert.match(migration, /"operation"\s*:\s*"-"/);
assert.match(main, /template-topic5-operation/, 'Admin editor must expose the Topic 5 operation scope.');
assert.match(main, /topic5OperationKeys/, 'Admin editor must preserve operation scope when saving Topic 5 templates.');

console.log('Template harden/split/replace migration contract verified.');
