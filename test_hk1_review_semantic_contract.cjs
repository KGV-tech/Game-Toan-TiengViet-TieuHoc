const assert = require('node:assert/strict');
const { generateQuestion } = require('./src/question-templates/grade-4/math');
globalThis.app = {};
require('./src/modules/constants.js');
require('./src/modules/curriculum.js');
const curriculum = globalThis.app.curriculum;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function skills(question) {
  return question.subquestions.map(part => part.skill || part.mode || part.skillGroup);
}

function assertReviewMetadata(question, label) {
  assert.equal(question.subquestions.length, 4, `${label} phải có bốn ý.`);
  question.subquestions.forEach(part => {
    assert(part.skill, `${label} phải ghi skill cho từng ý.`);
    assert(part.lesson, `${label} phải ghi lesson cho từng ý.`);
    assert(part.family, `${label} phải ghi family cho từng ý.`);
  });
}

const mixedCases = [
  ['number.hk1_review_b01_b04', { skills: ['b01', 'b02', 'b03', 'b04', 'b05'] }],
  ['number.hk1_review_b10_b15', { skills: ['b10', 'b11', 'b12', 'b13', 'b14', 'b15'] }],
  ['measurement.hk1_review_b17_b20', { skills: ['b17', 'b18', 'b19', 'b20'] }],
  ['number.hk1_review_b22_b25', { skills: ['b22', 'b23', 'b24', 'b25'] }],
  ['geometry.hk1_review_b27_b31', { skills: ['b27', 'b28', 'b29', 'b30', 'b31'] }],
  ['number.hk1_review_b33_numbers', { skills: ['b10', 'b11', 'b12', 'b13', 'b14', 'b15'] }],
  ['number.hk1_review_b34_add_sub', { skills: ['b22', 'b23', 'b24', 'b25'] }],
  ['geometry.hk1_review_b35', { skills: ['b07', 'b08', 'b09', 'b28', 'b30', 'b31'] }],
  ['measurement.hk1_review_b36', { skills: ['b17', 'b18', 'b19', 'b20'] }],
  ['number.hk1_review_b37_full', { groups: ['numbers', 'addSub', 'multiplicationDivision', 'geometry', 'measurement', 'statistics', 'probability', 'wordProblem'] }]
];

mixedCases.forEach(([templateId, config], index) => {
  const question = generateQuestion(templateId, config, seededRandom(12000 + index));
  assert.equal(question.templateVariables.reviewMode, 'mixed', `${templateId} phải dùng mixed mặc định.`);
  assertReviewMetadata(question, templateId);
  assert(new Set(skills(question)).size > 1, `${templateId} phải trộn ít nhất hai dạng với pool nhiều phần tử.`);
});

const focused = generateQuestion('number.hk1_review_b10_b15', { skills: ['b14', 'b15'], reviewMode: 'single' }, seededRandom(12100));
assert.equal(focused.templateVariables.reviewMode, 'single');
assert.equal(new Set(skills(focused)).size, 1, 'reviewMode single phải giữ một dạng luyện chuyên biệt.');

const b20 = generateQuestion('measurement.hk1_review_b36', { skills: ['b20'], reviewMode: 'single' }, seededRandom(12101));
assert(b20.subquestions.every(part => part.skill === 'b20'));
assert(b20.subquestions.every(part => part.kind === 'measurement-practice'), 'B20 không được rơi vào builder thế kỉ của B19.');
assert(b20.subquestions.every(part => part.interaction === 'measurement-card'));

const b35 = generateQuestion('geometry.hk1_review_b35', { skills: ['b07', 'b28', 'b30', 'b31'] }, seededRandom(12102));
assert.deepEqual(new Set(skills(b35)), new Set(['b07', 'b28', 'b30', 'b31']));
assert(b35.subquestions.some(part => part.interaction === 'construction-choice'));

const wordProblems = generateQuestion('number.hk1_review_b37_full', { groups: ['wordProblem'], reviewMode: 'single' }, seededRandom(0));
assert(
  wordProblems.subquestions.every(part => Number(String(part.answer).replace(/\s/g, '')) >= 0),
  'B37 không được sinh bài toán trừ có đáp số âm ngoài phạm vi lớp 4.'
);

const grid = generateQuestion('g4-m-perpendicular-grid-practice', {}, seededRandom(12103));
const gridLineCount = (grid.subquestions[0].visual.match(/geometry-visual__grid-line/g) || []).length;
assert.equal(gridLineCount, 20, 'Lưới phải có 12 đường dọc và 8 đường ngang.');

assert.equal(curriculum.getTemplateLesson({ classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số', generator_key: 'number.safe_password_by_place_value' }), 'g4-math-hk1-b12', 'Két sắt phải thuộc Bài 12.');
const migration = require('fs').readFileSync('supabase/migrations/20260923_question_templates_hk1_semantic_review.sql', 'utf8');
assert.match(migration, /g4-math-hk1-b12[\s\S]*safe_password_by_place_value/);
assert.match(migration, /multiplicationDivision[\s\S]*statistics[\s\S]*probability[\s\S]*wordProblem/);
const migrationUpdates = migration.match(/UPDATE public\.question_templates[\s\S]*?;/g) || [];
assert.equal(migrationUpdates.length, 11, 'Migration phải có đúng 11 cập nhật HK1 đã duyệt.');
migrationUpdates.forEach(statement => {
  assert.match(statement, /classlevel = 'Lớp 4'/);
  assert.match(statement, /subject = 'Toán'/);
  assert.match(statement, /semester = 'Học kỳ 1'/);
});
assert.equal((migration.match(/COALESCE\(config, '\{\}'::jsonb\)/g) || []).length, 10, 'Cập nhật config phải an toàn khi config đang NULL.');

console.log('HK1 semantic review contracts verified.');
