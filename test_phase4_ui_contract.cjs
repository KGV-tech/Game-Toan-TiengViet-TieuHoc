const assert = require('node:assert/strict');
const fs = require('node:fs');

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const curriculum = fs.readFileSync('src/modules/curriculum.js', 'utf8');
const migrationPath = 'supabase/migrations/20260911_question_templates_phase4_b10_b16.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

[
    'six-digit-numbers.js',
    'million-class.js',
    'round-hundred-thousands.js',
    'review-b10-b15.js'
].forEach(file => assert(index.includes(`src/question-templates/grade-4/math/${file}`), `Browser phải nạp ${file}.`));

[
    'number.six_digit_numbers',
    'number.million_class',
    'number.round_hundred_thousands',
    'number.hk1_review_b10_b15'
].forEach(key => {
    assert(main.includes(key), `Admin phải nhận diện ${key}.`);
    assert(curriculum.includes(`'${key}'`), `Curriculum phải có mapping fallback cho ${key}.`);
});

assert.match(main, /phase4TemplateOptions/, 'Admin phải có nhóm lựa chọn template Phase 4.');
assert.match(main, /Bài 10 · Lập và đọc số sáu chữ số/, 'Admin phải mô tả Bài 10.');
assert.match(main, /Bài 12 · Các số trong phạm vi lớp triệu/, 'Admin phải mô tả Bài 12.');
assert.match(main, /Bài 13 · Làm tròn đến hàng trăm nghìn/, 'Admin phải mô tả Bài 13.');
assert.match(main, /Bài 16 · Ôn tập số có nhiều chữ số/, 'Admin phải mô tả Bài 16.');

assert.ok(migration, 'Migration seed Phase 4 phải tồn tại.');
assert.match(migration, /BEGIN;[\s\S]*COMMIT;/i, 'Seed Phase 4 phải chạy trong một transaction.');
['g4-math-hk1-b10', 'g4-math-hk1-b11', 'g4-math-hk1-b12', 'g4-math-hk1-b13', 'g4-math-hk1-b14', 'g4-math-hk1-b15', 'g4-math-hk1-b16']
    .forEach(lesson => assert.match(migration, new RegExp(lesson), `Seed Phase 4 phải có ${lesson}.`));
assert.match(migration, /NOT\s+EXISTS/i, 'Seed Phase 4 phải idempotent.');
assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i, 'Seed Phase 4 không được xóa vật lý template.');
assert.doesNotMatch(migration, /g4-math-hk1-b05/i, 'Phase 4 không được mở lại B05 đang deferred.');
assert.match(migration, /lesson[\s\S]*generator_key/i, 'Mỗi seed phải lưu lesson cùng generator key.');

console.log('Phase 4 Admin/editor/migration contracts verified.');
