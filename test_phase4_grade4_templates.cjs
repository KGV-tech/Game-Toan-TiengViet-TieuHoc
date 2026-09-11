const assert = require('node:assert/strict');
const { generateQuestion, templateIds } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 0x100000000;
    };
}

function numericValue(value) {
    return Number(String(value).replace(/\D/g, ''));
}

function assertFourPartQuestion(question, key) {
    assert.equal(question.templateId, key);
    assert.equal(question.classlevel, 'Lớp 4');
    assert.equal(question.subject, 'Toán');
    assert.equal(question.semester, 'Học kỳ 1');
    assert.equal(question.topic, '3. Số có nhiều chữ số');
    assert.equal(question.type, 'Trắc nghiệm');
    assert.equal(question.subquestions.length, 4);
    assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1]);
    assert.equal(question.ans.split(', ').length, 4);
    assert(question.subquestions.every(item => item.options.length === 4));
    assert(question.subquestions.every(item => new Set(item.options).size === item.options.length));
    assert(question.subquestions.every(item => item.options.includes(item.answer)));
    assert(!JSON.stringify(question).includes('undefined'));
}

const requiredKeys = [
    'number.six_digit_numbers',
    'number.million_class',
    'number.round_hundred_thousands',
    'number.hk1_review_b10_b15'
];
requiredKeys.forEach(key => assert(templateIds.includes(key), `Phase 4 phải đăng ký ${key}.`));

for (let seed = 0; seed < 24; seed += 1) {
    const question = generateQuestion('number.six_digit_numbers', {
        minimum: 100000,
        maximum: 999999,
        modes: ['compose', 'read', 'million', 'digit']
    }, seededRandom(9100 + seed));
    assertFourPartQuestion(question, 'number.six_digit_numbers');
    assert.deepEqual(question.subquestions.map(item => item.mode), ['compose', 'read', 'million', 'digit']);
    assert(question.subquestions.filter(item => item.mode !== 'million').every(item => item.number >= 100000 && item.number <= 999999));
    assert.equal(question.subquestions.find(item => item.mode === 'million').answer.replace(/\s/g, ''), '1000000');
    assert(/sáu chữ số|1\s*000\s*000/i.test(question.q));
}

const sixDigitEdge = generateQuestion('number.six_digit_numbers', {
    minimum: 100000,
    maximum: 100003,
    modes: ['compose', 'read', 'million', 'digit']
}, seededRandom(9124));
assert(sixDigitEdge.subquestions.filter(item => item.mode !== 'million').every(item => item.number >= 100000 && item.number <= 100003));
assert.throws(
    () => generateQuestion('number.six_digit_numbers', { minimum: 10000, maximum: 999999 }, seededRandom(9125)),
    /sáu chữ số/i
);

for (let seed = 0; seed < 24; seed += 1) {
    const question = generateQuestion('number.million_class', {
        minimum: 1000000,
        maximum: 999999999,
        modes: ['read', 'write', 'digit', 'expanded'],
        includeZeroGroups: true
    }, seededRandom(9200 + seed));
    assertFourPartQuestion(question, 'number.million_class');
    assert.deepEqual(question.subquestions.map(item => item.mode), ['read', 'write', 'digit', 'expanded']);
    assert(question.subquestions.every(item => item.number >= 1000000 && item.number <= 999999999));
    assert(question.subquestions.every(item => String(item.number).includes('0')));
    assert(/lớp triệu/i.test(question.q));
}
assert.throws(
    () => generateQuestion('number.million_class', { minimum: 1000000, maximum: 1000000000 }, seededRandom(9225)),
    /lớp triệu/i
);

for (let seed = 0; seed < 24; seed += 1) {
    const question = generateQuestion('number.round_hundred_thousands', {
        minimum: 100000,
        maximum: 999999999,
        modes: ['round', 'round', 'round', 'rule']
    }, seededRandom(9300 + seed));
    assertFourPartQuestion(question, 'number.round_hundred_thousands');
    assert.deepEqual(question.subquestions.map(item => item.mode), ['round', 'round', 'round', 'rule']);
    assert(question.subquestions.slice(0, 3).every(item => item.options.length === 4));
    assert.equal(question.subquestions[3].mode, 'rule');
    assert.equal(question.subquestions[3].options.length, 4);
    question.subquestions.filter(item => item.mode === 'round').forEach(item => {
        const expected = Math.floor((item.number + 50000) / 100000) * 100000;
        assert.equal(numericValue(item.answer), expected);
        assert.equal(item.roundedNumber, expected);
        assert.equal(expected % 100000, 0);
    });
    assert(question.subquestions[3].options.includes(question.subquestions[3].answer));
}
assert.throws(
    () => generateQuestion('number.round_hundred_thousands', { minimum: 999999, maximum: 100000 }, seededRandom(9325)),
    /phạm vi/i
);

const reviewSkillSets = [
    ['b10', 'b11', 'b12', 'b13'],
    ['b14', 'b15', 'b10', 'b13']
];
reviewSkillSets.forEach((skills, setIndex) => {
    for (let seed = 0; seed < 12; seed += 1) {
        const question = generateQuestion('number.hk1_review_b10_b15', { skills }, seededRandom(9400 + setIndex * 100 + seed));
        assertFourPartQuestion(question, 'number.hk1_review_b10_b15');
        assert.deepEqual(question.subquestions.map(item => item.skill), skills);
        assert.deepEqual(question.subquestions.map(item => item.label), ['a', 'b', 'c', 'd']);
        assert.equal(question.templateVariables.skills, skills.join(', '));
        assert(question.subquestions.every(item => item.prompt && item.explanation));
    }
});
assert.throws(
    () => generateQuestion('number.hk1_review_b10_b15', { skills: ['b10', 'b11', 'b12'] }, seededRandom(9500)),
    /bài 10 đến bài 15/i
);
assert.throws(
    () => generateQuestion('number.hk1_review_b10_b15', { skills: ['b10', 'b11', 'b12', 'b17'] }, seededRandom(9501)),
    /bài 10 đến bài 15/i
);

const b11 = generateQuestion('number.digit_at_place', {
    minimum: 100000,
    maximum: 999999,
    allowedPlaces: ['hundredThousands', 'tenThousands', 'thousands', 'hundreds', 'tens', 'ones']
}, seededRandom(9600));
assert(b11.subquestions.flatMap(item => item.options).every(value => numericValue(value) >= 100000 && numericValue(value) <= 999999));

const b14 = generateQuestion('number.compare_number_forms', { minimum: 100000, maximum: 999999999 }, seededRandom(9601));
assert(b14.comparisonRows.every(row => numericValue(row.leftText) >= 100000 && numericValue(row.leftText) <= 999999999));

const b15 = generateQuestion('number.natural_sequence', {
    minimum: 0,
    maximum: 999999,
    allowedSteps: [1000],
    sequenceLengthMin: 5,
    sequenceLengthMax: 5,
    blankCountMin: 2,
    blankCountMax: 2
}, seededRandom(9602));
assert(b15.sequenceRounds.every(round => round.sequence.every(value => value >= 0 && value <= 999999)));

console.log('Phase 4 B10–B16 multi-digit template contracts verified.');
