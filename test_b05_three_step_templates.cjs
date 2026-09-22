const assert = require('node:assert/strict');

const templates = require('./src/question-templates/grade-4/math');

const FAMILIES = [
  'relation_total',
  'purchase_total',
  'divide_compare',
  'remaining',
  'ratio_total',
  'legs_constraint',
  'animal_total'
];

const KEYS = FAMILIES.flatMap(family => [
  `word.three_steps_${family}_mcq`,
  `word.three_steps_${family}_fill`
]);

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function numberValue(value) {
  return Number(String(value).replace(/\s/g, '').replace(/\u00a0/g, ''));
}

function assertMetadata(question, key) {
  assert.equal(question.templateId, key);
  assert.equal(question.classlevel, 'Lớp 4');
  assert.equal(question.subject, 'Toán');
  assert.equal(question.semester, 'Học kỳ 1');
  assert.equal(question.topic, '1. Ôn tập và bổ sung');
  assert.equal(question.lesson, 'g4-math-hk1-b05');
  assert.deepEqual(question.partAnswerCounts, [1]);
  assert.equal(Object.hasOwn(question, 'subquestions'), false);
  assert.equal(Object.hasOwn(question, 'statements'), false);
  assert.equal(Object.hasOwn(question, 'labels'), false);
  assert.equal(typeof question.ans, 'string');
  assert.ok(question.q && question.explanation);
  assert.match(question.explanation, /Bước 1:/);
  assert.match(question.explanation, /Bước 2:/);
  assert.match(question.explanation, /Bước 3:/);
  assert.ok(question.threeStepData);
  assert.equal(question.threeStepData.stepResults.length, 3);
  assert.equal(question.threeStepData.stepResults.at(-1), numberValue(question.ans));
  assert.ok(question.threeStepData.answer <= 100000);
  const { family, operands } = question.threeStepData;
  const recomputed = {
    relation_total: operands.base + (operands.base + operands.firstDifference) + (operands.base + operands.firstDifference - operands.secondDifference),
    purchase_total: operands.quantity1 * operands.price1 + operands.quantity2 * operands.price2,
    divide_compare: Math.abs(operands.total / operands.firstDivisor - operands.total / operands.secondDivisor),
    remaining: operands.initial - (operands.morning + operands.afternoon + operands.evening),
    ratio_total: operands.base + operands.middle + operands.last,
    legs_constraint: (operands.totalLegs - operands.firstLegTotal) / operands.secondLegs,
    animal_total: operands.first + (operands.first - operands.difference) + ((operands.first - operands.difference) * operands.factor)
  }[family];
  assert.equal(recomputed, numberValue(question.ans), `${key} answer must be recomputable from raw operands.`);
}

assert.deepEqual(KEYS.filter(key => templates.templateIds.includes(key)), KEYS,
  'Bài 5 phải đăng ký đủ 14 generator key.');

for (const key of KEYS) {
  const question = templates.generateQuestion(key, {}, seededRandom(5000 + KEYS.indexOf(key)));
  assertMetadata(question, key);
  const isChoice = key.endsWith('_mcq');
  if (isChoice) {
    assert.equal(question.type, 'Trắc nghiệm');
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert(question.options.includes(question.ans));
  } else {
    assert.equal(question.type, 'Điền khuyết');
    assert.deepEqual(question.options, []);
    assert.equal((question.q.match(/___/g) || []).length, 1);
  }
}

for (const key of KEYS) {
  const outputs = new Set();
  for (let seed = 1; seed <= 10; seed += 1) {
    const question = templates.generateQuestion(key, {}, seededRandom(seed));
    assertMetadata(question, key);
    outputs.add(question.q);
  }
  assert.equal(outputs.size, 10, `${key} phải thay đổi dữ kiện qua 10 seed.`);
}

const fixedConfig = {
  difficulty: 'easy',
  minimum: 1,
  maximum: 100000
};
const fixedContexts = {
  relation_total: 'trees',
  purchase_total: 'notebooks',
  divide_compare: 'fruit_trays',
  remaining: 'oranges',
  ratio_total: 'polyline',
  legs_constraint: 'giraffes_peacocks',
  animal_total: 'farm'
};
for (const family of FAMILIES) {
  const key = `word.three_steps_${family}_fill`;
  const question = templates.generateQuestion(key, { ...fixedConfig, contexts: [fixedContexts[family]] }, seededRandom(8800 + FAMILIES.indexOf(family)));
  assertMetadata(question, key);
  assert.equal(question.templateVariables.contextId, fixedContexts[family]);
  assert.equal(question.templateVariables.difficulty, 'easy');
}

assert.throws(
  () => templates.generateQuestion('word.three_steps_relation_total_fill', { difficulty: 'impossible' }, seededRandom(1)),
  /độ khó|difficulty/i
);
assert.throws(
  () => templates.generateQuestion('word.three_steps_relation_total_fill', { contexts: ['unknown'] }, seededRandom(2)),
  /ngữ cảnh|context/i
);
assert.throws(
  () => templates.generateQuestion('word.three_steps_divide_compare_fill', { minimum: 100001 }, seededRandom(3)),
  /phạm vi|100\s*000|maximum/i
);
assert.throws(
  () => templates.generateQuestion('word.three_steps_purchase_total_mcq', { maximum: 20, minimum: 21 }, seededRandom(4)),
  /phạm vi|range/i
);

console.log('Bài 5 three-step template contracts verified.');
