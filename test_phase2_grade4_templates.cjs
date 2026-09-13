const assert = require('node:assert/strict');
const fs = require('node:fs');

const templates = require('./src/question-templates/grade-4/math');

const phase2Keys = [
  'number.even_odd_classify',
  'number.even_odd_count',
  'number.even_odd_sequence',
  'number.even_odd_form',
  'number.variable_expression_value',
  'number.variable_expression_choice',
  'number.hk1_review_b01_b04'
];

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function numberValue(value) {
  return Number(String(value).replace(/\u00a0/g, ''));
}

function assertFourPartQuestion(question, key) {
  assert.equal(question.classlevel, 'Lớp 4', `${key} must target grade 4.`);
  assert.equal(question.subject, 'Toán', `${key} must target Mathematics.`);
  assert.equal(question.semester, 'Học kỳ 1', `${key} must target semester 1.`);
  assert.equal(question.topic, '1. Ôn tập và bổ sung', `${key} must stay in Topic 1.`);
  assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1], `${key} must have four independently scored parts.`);
  assert.equal(question.subquestions?.length, 4, `${key} must generate four subquestions.`);
  assert.equal(question.subquestions.map(item => item.answer).join(', '), question.ans,
    `${key} answers must follow subquestion order.`);
  question.subquestions.forEach((part, index) => {
    assert.ok(part.prompt, `${key} part ${index + 1} needs a prompt.`);
    assert.equal(new Set(part.options).size, 4, `${key} part ${index + 1} needs four unique options.`);
    assert.ok(part.options.includes(part.answer), `${key} part ${index + 1} answer must be one of the options.`);
    assert.ok(part.explanation, `${key} part ${index + 1} needs an explanation.`);
  });
}

function assertFourPartFillQuestion(question, key) {
  assert.equal(question.classlevel, 'Lớp 4', `${key} must target grade 4.`);
  assert.equal(question.subject, 'Toán', `${key} must target Mathematics.`);
  assert.equal(question.semester, 'Học kỳ 1', `${key} must target semester 1.`);
  assert.equal(question.topic, '1. Ôn tập và bổ sung', `${key} must stay in Topic 1.`);
  assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1], `${key} must have four independently scored parts.`);
  assert.equal(question.practiceRows?.length, 4, `${key} must generate four practice rows.`);
  assert.equal(question.practiceRows.map(row => String(row.answer)).join(', '), question.ans,
    `${key} answers must follow row order.`);
  question.practiceRows.forEach((row, index) => {
    assert.ok(row.display.includes('___'), `${key} row ${index + 1} needs one answer blank.`);
    assert.ok(Number.isSafeInteger(Number(row.answer)), `${key} row ${index + 1} answer must be an integer.`);
    assert.ok(row.explanation, `${key} row ${index + 1} needs an explanation.`);
  });
}

assert.deepEqual(
  phase2Keys.filter(key => templates.templateIds.includes(key)),
  phase2Keys,
  'The Phase 2 generator registry must expose every approved B03/B04/B06 key.'
);
assert.equal(templates.templateIds.some(key => /b05/i.test(key)), false,
  'The deferred Bài 5 family must not be registered in Phase 2.');

const classify = templates.generateQuestion('number.even_odd_classify', {}, seededRandom(11));
assertFourPartQuestion(classify, 'number.even_odd_classify');
classify.subquestions.forEach(part => {
  const answer = numberValue(part.answer);
  assert.equal(answer % 2 === 0 ? 'even' : 'odd', part.targetParity,
    'Classification answer must match its requested parity.');
});
assertBalancedParities(classify, 'number.even_odd_classify');

const count = templates.generateQuestion('number.even_odd_count', {}, seededRandom(12));
assertFourPartQuestion(count, 'number.even_odd_count');
count.subquestions.forEach(part => {
  const expected = part.values.filter(value => (value % 2 === 0 ? 'even' : 'odd') === part.targetParity).length;
  assert.equal(numberValue(part.answer), expected, 'Count answer must match the generated list.');
});
assertBalancedParities(count, 'number.even_odd_count');

const sequence = templates.generateQuestion('number.even_odd_sequence', {}, seededRandom(13));
assertEvenOddSequence(sequence);

assert.throws(
  () => templates.generateQuestion('number.digit_at_place', {
    minimum: 10000,
    maximum: 99999,
    allowedPlaces: ['thousands'],
    allowedDigits: [9]
  }, seededRandom(1313)),
  /ít nhất 4|không trùng|trùng/i,
  'A digit-at-place template must reject a configuration that can only repeat one subquestion condition.'
);

const form = templates.generateQuestion('number.even_odd_form', {}, seededRandom(14));
assertFourPartQuestion(form, 'number.even_odd_form');
form.subquestions.forEach(part => {
  const answer = numberValue(part.answer);
  assert.equal(answer % 2 === 0 ? 'even' : 'odd', part.targetParity,
    'Formed number answer must match its requested parity.');
  assert.equal(String(answer).length, part.cards.length,
    'Formed number must use every digit card exactly once.');
  assert.deepEqual([...String(answer)].map(Number).sort(), [...part.cards].sort(),
    'Formed number must use the displayed digit cards.');
});
assertBalancedParities(form, 'number.even_odd_form');

const value = templates.generateQuestion('number.variable_expression_value', {}, seededRandom(15));
assertFourPartFillQuestion(value, 'number.variable_expression_value');
value.practiceRows.forEach(row => {
  assert.equal(row.answer, row.expressionValue, 'Expression fill answer must equal the evaluated expression.');
  assert.match(row.display, /a\s*=|a\s*[+−×÷]/, 'Expression row must show the variable and its value.');
});

const choice = templates.generateQuestion('number.variable_expression_choice', {}, seededRandom(16));
assertFourPartQuestion(choice, 'number.variable_expression_choice');
choice.subquestions.forEach(part => {
  assert.equal(numberValue(part.answer), part.expressionValue,
    'Expression choice answer must equal the evaluated expression.');
});

const review = templates.generateQuestion('number.hk1_review_b01_b04', {}, seededRandom(17));
assertFourPartQuestion(review, 'number.hk1_review_b01_b04');
assert.equal(new Set(review.subquestions.map(part => part.skill)).size, 1,
  'B06 review must keep one skill across all four parts.');
assert(['b01', 'b02', 'b03', 'b04'].includes(review.subquestions[0].skill),
  'B06 review must select a skill from B01–B04.');
assert.equal(new Set(review.subquestions.map(part => part.lesson)).size, 1,
  'B06 review must keep one lesson metadata value across all four parts.');
assert.equal(review.subquestions[0].lesson, `g4-math-hk1-${review.subquestions[0].skill}`,
  'B06 review must trace each part to the selected lesson.');
assert.equal(review.subquestions.some(part => /b05/i.test(part.skill || part.prompt)), false,
  'B06 review must not include deferred B05 content.');

const parityReview = templates.generateQuestion('number.hk1_review_b01_b04', { skills: ['b03'] }, seededRandom(18));
assertBalancedParities(parityReview, 'number.hk1_review_b01_b04 / b03');

for (let seed = 30; seed < 80; seed++) {
  assertFourPartQuestion(templates.generateQuestion('number.even_odd_classify', {}, seededRandom(seed)), 'number.even_odd_classify');
  assertFourPartQuestion(templates.generateQuestion('number.even_odd_count', {}, seededRandom(seed)), 'number.even_odd_count');
  assertEvenOddSequence(templates.generateQuestion('number.even_odd_sequence', {}, seededRandom(seed)));
  assertFourPartQuestion(templates.generateQuestion('number.even_odd_form', {}, seededRandom(seed)), 'number.even_odd_form');
  assertFourPartFillQuestion(templates.generateQuestion('number.variable_expression_value', {}, seededRandom(seed)), 'number.variable_expression_value');
  assertFourPartQuestion(templates.generateQuestion('number.variable_expression_choice', {}, seededRandom(seed)), 'number.variable_expression_choice');
  const reviewQuestion = templates.generateQuestion('number.hk1_review_b01_b04', {}, seededRandom(seed));
  assertFourPartQuestion(reviewQuestion, 'number.hk1_review_b01_b04');
  assert.equal(new Set(reviewQuestion.subquestions.map(part => part.skill)).size, 1);
}

function assertBalancedParities(question, key) {
  const counts = question.subquestions.reduce((total, part) => {
    total[part.targetParity] = (total[part.targetParity] || 0) + 1;
    return total;
  }, {});
  assert.deepEqual(counts, { even: 2, odd: 2 },
    `${key} must distribute the four parts evenly between even and odd targets.`);
}

function assertEvenOddSequence(question) {
  assert.equal(question.type, 'Chuỗi Quy luật', 'The sequence family must be a fill-in sequence, not multiple choice.');
  assert.equal(question.options.length, 0, 'The sequence family must not generate A–D answer choices.');
  assert.equal(question.sequenceRounds?.length, 4, 'The sequence family must generate four sequences.');
  assert(question.sequenceRounds.every(round => round.sequence.length === 6),
    'Each even/odd sequence must always contain six terms.');
  assert(question.partAnswerCounts.every(count => count >= 1 && count <= 3),
    'Each even/odd sequence must have from one to three blanks.');
  question.sequenceRounds.forEach(round => {
    assert.equal(round.step % 2, 0, 'Even/odd sequence step must preserve parity.');
    assert(round.sequence.every(value => (value % 2 === 0 ? 'even' : 'odd') === round.targetParity),
      'Each term must preserve its requested parity.');
  });
  const counts = question.sequenceRounds.reduce((total, round) => {
    total[round.targetParity] = (total[round.targetParity] || 0) + 1;
    return total;
  }, {});
  assert.deepEqual(counts, { even: 2, odd: 2 },
    'Each sequence set must distribute the four parts evenly between even and odd targets.');
}

assert.notEqual(
  templates.generateQuestion('number.even_odd_classify', {}, seededRandom(21)).ans,
  templates.generateQuestion('number.even_odd_classify', {}, seededRandom(22)).ans,
  'B03 output must vary with a different random seed.'
);
assert.throws(
  () => templates.generateQuestion('number.even_odd_classify', { minimum: 4, maximum: 4 }, seededRandom(23)),
  /phạm vi|range/i,
  'B03 must reject an invalid number range.'
);
assert.throws(
  () => templates.generateQuestion('number.variable_expression_value', { operations: [] }, seededRandom(24)),
  /phép tính|operation/i,
  'B04 must reject an empty operation set.'
);
assert.throws(
  () => templates.generateQuestion('number.even_odd_sequence', { minimum: 0, maximum: 23, sequenceSteps: [6] }, seededRandom(25)),
  /bước|range/i,
  'B03 sequence must reject a step that cannot fit the selected number range.'
);

const migration = fs.readFileSync(
  'supabase/migrations/20260909_question_templates_phase2_b03_b04_b06.sql',
  'utf8'
);
for (const key of phase2Keys) {
  assert.match(migration, new RegExp(key.replaceAll('.', '\\.'), 'g'),
    `Phase 2 migration must seed ${key}.`);
}
for (const lesson of ['g4-math-hk1-b03', 'g4-math-hk1-b04', 'g4-math-hk1-b06']) {
  assert.match(migration, new RegExp(lesson, 'g'), `Phase 2 migration must assign ${lesson}.`);
}
assert.doesNotMatch(migration, /g4-math-hk1-b05/i,
  'Phase 2 migration must not create or assign B05.');
assert.match(migration, /WHERE NOT EXISTS/i, 'Phase 2 migration must be idempotent.');
assert.doesNotMatch(migration, /CREATE POLICY|DROP POLICY|GRANT |REVOKE /,
  'Phase 2 migration must not alter RLS or permissions.');

console.log('Phase 2 B03/B04/B06 generator and migration contracts verified.');
