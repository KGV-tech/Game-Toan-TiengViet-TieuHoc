const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const curriculum = fs.readFileSync('src/modules/curriculum.js', 'utf8');
const migrationPath = 'supabase/migrations/20260911_question_templates_phase5_b17_b21.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

assert(index.includes('src/question-templates/grade-4/math/measurement-phase5.js'), 'Browser phải nạp generator Phase 5.');
['measurement.practice_cards', 'measurement.hk1_review_b17_b20'].forEach(key => {
    assert(main.includes(key), `Admin phải nhận diện ${key}.`);
    assert(curriculum.includes(`'${key}'`), `Curriculum phải có mapping fallback cho ${key}.`);
});
assert.match(main, /phase5TemplateOptions/, 'Admin phải có nhóm lựa chọn template Phase 5.');
assert.match(main, /template-editor__rule--phase5-controls/, 'Admin phải có vùng cấu hình Phase 5.');
assert.match(main, /template-phase5-practice-kinds/, 'Admin phải có nhóm đơn vị cho Bài 20.');
assert.match(main, /template-phase5-review-skills/, 'Admin phải có nhóm kỹ năng cho Bài 21.');
assert.match(main, /template-measurement-mass-kinds/, 'Admin phải mở config dạng đổi khối lượng.');
assert.match(main, /template-measurement-area-kinds/, 'Admin phải mở config dạng đổi diện tích.');
assert.match(main, /template-measurement-time-kinds/, 'Admin phải mở config dạng đổi thời gian.');
assert.match(main, /template-measurement-century-start/, 'Admin phải mở config khoảng thế kỉ.');
assert.match(main, /template-measurement-scenario-kinds/, 'Admin phải mở config nhóm tình huống lời văn.');
assert.match(main, /Bài 20 · Thực hành đọc phiếu đo/, 'Admin phải mô tả Bài 20.');
assert.match(main, /Bài 21 · Ôn tập đo lường/, 'Admin phải mô tả Bài 21.');
assert.match(main, /measurement\.practice_cards[\s\S]*defaultPrompt/, 'Preset Bài 20 phải có prompt mặc định.');
assert.match(main, /measurement\.hk1_review_b17_b20[\s\S]*defaultPrompt/, 'Preset Bài 21 phải có prompt mặc định.');

assert.ok(migration, 'Migration seed Phase 5 phải tồn tại.');
assert.match(migration, /BEGIN;[\s\S]*COMMIT;/i, 'Seed Phase 5 phải chạy trong một transaction.');
['g4-math-hk1-b17', 'g4-math-hk1-b18', 'g4-math-hk1-b19', 'g4-math-hk1-b20', 'g4-math-hk1-b21']
    .forEach(lesson => assert.match(migration, new RegExp(lesson), `Seed Phase 5 phải có ${lesson}.`));
assert.match(migration, /NOT\s+EXISTS/i, 'Seed Phase 5 phải idempotent.');
assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i, 'Seed Phase 5 không được xóa vật lý template.');
assert.doesNotMatch(migration, /g4-math-hk1-b05/i, 'Phase 5 không được mở lại B05 đang deferred.');
assert.match(migration, /measurement\.practice_cards/, 'Seed phải có Bài 20 thực hành.');
assert.match(migration, /measurement\.hk1_review_b17_b20/, 'Seed phải có Bài 21 review.');

console.log('Phase 5 Admin/editor/migration contracts verified.');
