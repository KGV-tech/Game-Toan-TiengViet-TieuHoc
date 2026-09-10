const assert = require('node:assert/strict');
const fs = require('node:fs');

const main = fs.readFileSync('src/main.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const curriculum = fs.readFileSync('src/modules/curriculum.js', 'utf8');
const migrationPath = 'supabase/migrations/20260910_question_templates_phase3_b07_b09.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

assert(index.includes('src/question-templates/grade-4/math/angle-shared.js'), 'The browser must load the Phase 3 angle helper.');
assert(index.includes('src/question-templates/grade-4/math/angle-measure.js'), 'The browser must load the B07 generator.');
assert(index.includes('src/question-templates/grade-4/math/angle-review.js'), 'The browser must load the B09 generator.');
assert(main.includes('g4-m-angle-measure-read'), 'The Admin editor must expose the B07 generator.');
assert(main.includes('g4-m-angle-review'), 'The Admin editor must expose the B09 generator.');
assert(main.includes('Bài 7 · Đọc số đo góc'), 'The B07 preset must explain its learning outcome.');
assert(main.includes('Bài 9 · Ôn tập góc'), 'The B09 preset must explain its learning outcome.');
assert(main.includes('multi-choice-subquestion__visual'), 'Gameplay must render the generated angle visual inside each subquestion.');
assert(main.includes('part.visual'), 'The generated preview must preserve the angle visual for author review.');
assert(curriculum.includes("'g4-m-angle-measure-read': 'g4-math-hk1-b07'"), 'B07 must resolve to the B07 lesson.');
assert(curriculum.includes("'g4-m-angle-review': 'g4-math-hk1-b09'"), 'B09 must resolve to the B09 lesson.');

assert.ok(migration, 'The Phase 3 seed migration must exist.');
assert.match(migration, /BEGIN;[\s\S]*COMMIT;/i, 'Phase 3 seed must run in one transaction.');
assert.match(migration, /g4-math-hk1-b07/g, 'Phase 3 must seed B07 records.');
assert.match(migration, /g4-math-hk1-b09/g, 'Phase 3 must seed a B09 record.');
assert.match(migration, /NOT\s+EXISTS/i, 'Phase 3 seed must be idempotent.');
assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i, 'Phase 3 seed must not physically delete templates.');
assert.doesNotMatch(migration, /g4-math-hk1-b05/i, 'Phase 3 must not reintroduce deferred B05.');

console.log('Phase 3 Admin/editor/migration contracts verified.');
