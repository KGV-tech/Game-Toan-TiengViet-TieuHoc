const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const curriculum = fs.readFileSync('src/modules/curriculum.js', 'utf8');
const style = fs.readFileSync('src/style.css', 'utf8');
const migrationPath = 'supabase/migrations/20260911_question_templates_phase7_phase8_b27_b37.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

assert(index.includes('src/question-templates/grade-4/math/geometry-phase7.js'));
assert(index.includes('src/question-templates/grade-4/math/review-phase8.js'));
assert(index.indexOf('math/geometry-phase7.js') < index.indexOf('math/index.js'));
assert(index.indexOf('math/review-phase8.js') < index.indexOf('math/index.js'));
[
    'g4-m-perpendicular-identify', 'g4-m-perpendicular-grid-practice',
    'g4-m-parallel-identify', 'g4-m-parallel-grid-practice',
    'g4-m-quad-classify', 'geometry.hk1_review_b27_b31',
    'number.hk1_review_b33_numbers', 'number.hk1_review_b34_add_sub',
    'geometry.hk1_review_b35', 'measurement.hk1_review_b36',
    'number.hk1_review_b37_full'
].forEach(key => assert.match(main, new RegExp(key.replaceAll('.', '\\.')), `Admin phải nhận diện ${key}.`));
assert.match(main, /phase7TemplateOptions/);
assert.match(main, /phase8TemplateOptions/);
assert.match(main, /template-editor__rule--phase7-controls/);
assert.match(main, /template-phase7-review-skills/);
assert.match(main, /template-phase7-quad-kinds/);
assert.match(main, /template-editor__rule--phase8-controls/);
assert.match(main, /template-phase8-review-groups/);
assert.match(main, /Bài 32 · Ôn tập hình học/);
assert.match(main, /Bài 37 · Ôn tập chung/);
assert.match(style, /geometry-visual/);

[
    ['g4-math-hk1-b27', 'g4-m-perpendicular-identify'],
    ['g4-math-hk1-b28', 'g4-m-perpendicular-grid-practice'],
    ['g4-math-hk1-b29', 'g4-m-parallel-identify'],
    ['g4-math-hk1-b30', 'g4-m-parallel-grid-practice'],
    ['g4-math-hk1-b31', 'g4-m-quad-classify'],
    ['g4-math-hk1-b32', 'geometry.hk1_review_b27_b31'],
    ['g4-math-hk1-b33', 'number.hk1_review_b33_numbers'],
    ['g4-math-hk1-b34', 'number.hk1_review_b34_add_sub'],
    ['g4-math-hk1-b35', 'geometry.hk1_review_b35'],
    ['g4-math-hk1-b36', 'measurement.hk1_review_b36'],
    ['g4-math-hk1-b37', 'number.hk1_review_b37_full']
].forEach(([lesson, key]) => {
    assert.match(curriculum, new RegExp(`['"]${key.replaceAll('.', '\\.')}['"]\\s*:\\s*['"]${lesson}['"]`), `Curriculum phải map ${key} về ${lesson}.`);
});

assert.ok(migration, 'Migration Phase 7–8 phải tồn tại.');
assert.match(migration, /BEGIN;[\s\S]*COMMIT;/i);
['g4-math-hk1-b27', 'g4-math-hk1-b28', 'g4-math-hk1-b29', 'g4-math-hk1-b30', 'g4-math-hk1-b31', 'g4-math-hk1-b32', 'g4-math-hk1-b33', 'g4-math-hk1-b34', 'g4-math-hk1-b35', 'g4-math-hk1-b36', 'g4-math-hk1-b37'].forEach(lesson => assert.match(migration, new RegExp(lesson)));
assert.match(migration, /geometry\.hk1_review_b27_b31/);
assert.match(migration, /number\.hk1_review_b37_full/);
assert.match(migration, /NOT\s+EXISTS/i);
assert.match(migration, /existing\.is_active/i);
assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i);
assert.doesNotMatch(migration, /CREATE\s+POLICY|DROP\s+POLICY|\bGRANT\s|\bREVOKE\s/i);
assert.doesNotMatch(migration, /g4-math-hk1-b05/i);

console.log('Phase 7–8 Admin/editor/migration contracts verified.');
