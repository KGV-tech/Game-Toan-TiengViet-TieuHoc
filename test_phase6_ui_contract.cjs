const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const curriculum = fs.readFileSync('src/modules/curriculum.js', 'utf8');
const migrationPath = 'supabase/migrations/20260911_question_templates_phase6_b22_b26.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

assert(index.includes('src/question-templates/grade-4/math/review-b22-b25.js'), 'Browser phải nạp generator review Phase 6.');
assert(index.indexOf('math/review-b22-b25.js') < index.indexOf('math/index.js'), 'Review Phase 6 phải nạp trước registry.');
assert(main.includes('number.hk1_review_b22_b25'), 'Admin phải nhận diện review B26.');
assert(curriculum.includes("'number.hk1_review_b22_b25': 'g4-math-hk1-b26'"), 'Curriculum phải map review về B26.');
assert.match(main, /phase6TemplateOptions/, 'Admin phải có nhóm lựa chọn template Phase 6.');
assert.match(main, /template-editor__rule--phase6-controls/, 'Admin phải có vùng cấu hình Phase 6.');
assert.match(main, /template-phase6-review-skills/, 'Admin phải có nhóm kỹ năng review B26.');
assert.match(main, /template-phase6-properties/, 'Admin phải có nhóm tính chất B24.');
assert.match(main, /Bài 26 · Ôn tập cộng và trừ/, 'Admin phải mô tả Bài 26.');
assert.match(main, /number\.hk1_review_b22_b25[\s\S]*defaultPrompt/, 'Preset B26 phải có prompt mặc định.');

assert.ok(migration, 'Migration seed Phase 6 phải tồn tại.');
assert.match(migration, /BEGIN;[\s\S]*COMMIT;/i, 'Seed Phase 6 phải chạy trong một transaction.');
['g4-math-hk1-b22', 'g4-math-hk1-b23', 'g4-math-hk1-b24', 'g4-math-hk1-b25', 'g4-math-hk1-b26']
    .forEach(lesson => assert.match(migration, new RegExp(lesson), `Seed Phase 6 phải có ${lesson}.`));
assert.match(migration, /number\.hk1_review_b22_b25/);
assert.match(migration, /NOT\s+EXISTS/i, 'Seed Phase 6 phải idempotent.');
assert.match(migration, /existing\.is_active/i, 'Seed Phase 6 không được chiếm lại template đã archive.');
assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i, 'Seed Phase 6 không được xóa vật lý template.');
assert.doesNotMatch(migration, /CREATE\s+POLICY|DROP\s+POLICY|\bGRANT\s|\bREVOKE\s/i, 'Seed Phase 6 không được đổi RLS hoặc quyền.');
assert.doesNotMatch(migration, /g4-math-hk1-b05/i, 'Phase 6 không được mở lại B05 deferred.');
assert.match(migration, /"operation"\s*:\s*"\+"/);
assert.match(migration, /"operation"\s*:\s*"-"/);

console.log('Phase 6 Admin/editor/migration contracts verified.');
