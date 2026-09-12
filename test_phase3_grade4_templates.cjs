const assert = require('node:assert/strict');
const { generateQuestion, templateIds } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

assert(templateIds.includes('g4-m-angle-measure-read'), 'Phase 3 must register the B07 angle-measure generator.');
assert(templateIds.includes('g4-m-angle-review'), 'Phase 3 must register the B09 angle-review generator.');

for (let seed = 0; seed < 24; seed += 1) {
  const question = generateQuestion('g4-m-angle-measure-read', {}, seededRandom(8100 + seed));
  assert.equal(question.classlevel, 'Lớp 4');
  assert.equal(question.subject, 'Toán');
  assert.equal(question.semester, 'Học kỳ 1');
  assert.equal(question.topic, '2. Góc và đơn vị đo góc');
  assert.equal(question.type, 'Trắc nghiệm');
  assert.equal(question.subquestions.length, 4);
  assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1]);
  assert.equal(question.ans.split(', ').length, 4);
  assert(question.subquestions.every(item => item.mode === 'measure'));
  assert(question.subquestions.every(item => Number.isInteger(item.degrees) && item.degrees >= 10 && item.degrees <= 170));
  assert(question.subquestions.every(item => item.prompt.includes('độ')));
  assert(question.subquestions.every(item => /^<svg\b/i.test(item.visual)));
  assert(question.subquestions.every(item => /aria-label="Hình góc trên thước đo góc"/.test(item.visual)));
  assert(question.subquestions.every(item => item.options.length === 4));
  assert(question.subquestions.every(item => new Set(item.options).size === 4));
  assert(question.subquestions.every(item => item.options.includes(item.answer)));
  assert.equal(question.templateVariables.question, question.q);
}

const restricted = generateQuestion('g4-m-angle-measure-read', { allowedDegrees: [30, 60] }, seededRandom(8124));
assert(restricted.subquestions.every(item => [30, 60].includes(item.degrees)), 'B07 must honor a configured degree pool.');
assert.throws(
  () => generateQuestion('g4-m-angle-measure-read', { allowedDegrees: [0, 180] }, seededRandom(8125)),
  /độ/i,
  'B07 must reject an invalid degree pool.'
);

for (let seed = 0; seed < 24; seed += 1) {
  const question = generateQuestion('g4-m-angle-review', {}, seededRandom(8200 + seed));
  assert.equal(question.topic, '2. Góc và đơn vị đo góc');
  assert.equal(question.subquestions.length, 4);
  assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1]);
  assert.equal(new Set(question.subquestions.map(item => item.mode)).size, 1);
  assert(['measure', 'classify'].includes(question.subquestions[0].mode));
  assert(question.subquestions.every(item => /^<svg\b/i.test(item.visual)));
  assert(question.subquestions.every(item => item.options.length === 4));
  assert(question.subquestions.every(item => new Set(item.options).size === 4));
  assert(question.subquestions.every(item => item.options.includes(item.answer)));
  assert(question.subquestions.filter(item => item.mode === 'classify').every(item => ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'].includes(item.answer)));
}

console.log('Phase 3 B07/B09 angle template contracts verified.');
