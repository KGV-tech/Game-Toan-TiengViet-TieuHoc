const assert = require('node:assert/strict');
const { generateQuestion } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

const operationSpecificCases = [
  ['g4-m-add-sub-multi-digit', question => question.practiceRows.map(row => row.operation)],
  ['g4-m-add-sub-missing-term', question => question.practiceRows.map(row => row.operation)],
  ['g4-m-add-sub-missing-digit', question => question.practiceRows.map(row => row.operation)],
  ['g4-m-add-sub-true-false', question => question.statements.map(row => row.operation)]
];

for (const [templateId, readOperations] of operationSpecificCases) {
  for (const operation of ['+', '-']) {
    const question = generateQuestion(templateId, { minimumDigits: 5, maximumDigits: 6, operation }, seededRandom(700 + operation.charCodeAt(0)));
    assert.deepEqual([...new Set(readOperations(question))], [operation], `${templateId} must support a ${operation} only variant.`);
  }
}

for (const operation of ['+', '-']) {
  for (let seed = 0; seed < 8; seed += 1) {
    const question = generateQuestion('g4-m-add-sub-word-problem', { operation }, seededRandom(720 + seed));
    assert.equal(question.templateVariables.operation, operation, `Word-problem variant must retain operation ${operation}.`);
  }
}
assert.throws(
  () => generateQuestion('g4-m-add-sub-word-problem', { operation: '*' }, seededRandom(730)),
  /phép cộng|phép trừ/i,
  'A word-problem template must reject operations outside its approved family.'
);

const secondsOnly = generateQuestion('measurement.time_unit_convert', {
  allowedKinds: ['minuteToSeconds', 'minutesAndSecondsToSeconds']
}, seededRandom(740));
assert(secondsOnly.practiceRows.every(row => ['minuteToSeconds', 'minutesAndSecondsToSeconds'].includes(row.kind)));
assert(secondsOnly.practiceRows.every(row => /giây/.test(row.display)), 'The B19 time variant must stay on seconds conversions.');
assert.throws(
  () => generateQuestion('measurement.time_unit_convert', { allowedKinds: ['unknown'] }, seededRandom(741)),
  /thời gian không hợp lệ/i
);

const b11Digit = generateQuestion('number.digit_at_place', {
  minimum: 100000,
  maximum: 999999,
  allowedPlaces: ['hundredThousands', 'tenThousands', 'thousands', 'hundreds', 'tens', 'ones'],
  allowedDigits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
}, seededRandom(750));
assert(b11Digit.subquestions.flatMap(item => item.options).every(value => {
  const number = Number(String(value).replace(/\s/g, ''));
  return number >= 100000 && number <= 999999;
}), 'B11 digit-at-place must generate six-digit values.');

const b14Smallest = generateQuestion('number.smallest_of_four', { minimum: 100000, maximum: 999999999 }, seededRandom(751));
const b14Largest = generateQuestion('number.largest_of_four', { minimum: 100000, maximum: 999999999 }, seededRandom(752));
for (const question of [b14Smallest, b14Largest]) {
  assert(question.subquestions.flatMap(item => item.options).every(value => {
    const number = Number(String(value).replace(/\s/g, ''));
    return number >= 100000 && number <= 999999999;
  }), 'B14 comparison templates must stay within the six-to-nine-digit range.');
}

const b15Sequence = generateQuestion('number.natural_sequence', {
  minimum: 0,
  maximum: 999999,
  allowedSteps: [1000],
  sequenceLengthMin: 5,
  sequenceLengthMax: 5,
  blankCountMin: 2,
  blankCountMax: 2
}, seededRandom(753));
assert(b15Sequence.sequenceRounds.every(round => round.sequence.every(value => value >= 0 && value <= 999999)));

const b12Matching = generateQuestion('number.match_number_words', {
  shapes: ['4:3'],
  digits: [7],
  digitStrategy: 'cycle'
}, seededRandom(754));
assert.equal(b12Matching.topic, '3. Số có nhiều chữ số');
assert(b12Matching.options[0].split(', ').every(value => value.replace(/\s/g, '').length === 7), 'B12 matching must generate seven-digit numbers.');

const b16Review = generateQuestion('number.four_arithmetic_blanks', {
  minimumDigits: 6,
  maximumDigits: 9,
  operations: ['+', '-', '*', '/'],
  layouts: ['expressionLeft', 'expressionRight', 'twoExpressions'],
  blankPositions: ['first', 'second', 'third', 'fourth']
}, seededRandom(755));
assert(b16Review.subquestions.every(item => Number.isSafeInteger(item.answer) && item.display.includes('___')), 'B16 review output must remain a valid arithmetic question.');

console.log('Hardened and split template generator contracts verified.');
