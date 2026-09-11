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
    return Number(String(value).replace(/\s/g, ''));
}

const reviewKey = 'number.hk1_review_b22_b25';
assert(templateIds.includes(reviewKey), 'Phase 6 phải đăng ký review B22–B25.');

const addition = generateQuestion('g4-m-add-sub-multi-digit', {
    minimumDigits: 5,
    maximumDigits: 6,
    operation: '+'
}, seededRandom(6100));
assert(addition.practiceRows.every(row => row.operation === '+'), 'B22 phải chỉ sinh phép cộng khi cấu hình operation=+.');
addition.practiceRows.forEach(row => assert.equal(row.values[0] + row.values[1], row.values[2]));

const subtraction = generateQuestion('g4-m-add-sub-multi-digit', {
    minimumDigits: 5,
    maximumDigits: 6,
    operation: '-'
}, seededRandom(6101));
assert(subtraction.practiceRows.every(row => row.operation === '-'), 'B23 phải chỉ sinh phép trừ khi cấu hình operation=-.');
subtraction.practiceRows.forEach(row => assert.equal(row.values[0] - row.values[1], row.values[2]));

const property = generateQuestion('g4-m-addition-property-fill', { properties: ['commutative'] }, seededRandom(6102));
assert(property.practiceRows.every(row => row.property === 'commutative'), 'B24 phải tôn trọng danh sách tính chất đã chọn.');
assert.throws(
    () => generateQuestion('g4-m-addition-property-fill', { properties: ['commutative', 'unknown'] }, seededRandom(6103)),
    /tính chất/i,
    'B24 không được âm thầm bỏ qua cấu hình tính chất ngoài allowlist.'
);

const skills = ['b22', 'b23', 'b24', 'b25'];
const review = generateQuestion(reviewKey, { skills }, seededRandom(6110));
assert.equal(review.topic, '5. Phép cộng và phép trừ');
assert.equal(review.type, 'Trắc nghiệm');
assert.equal(review.subquestions.length, 4);
assert.deepEqual(review.partAnswerCounts, [1, 1, 1, 1]);
assert.deepEqual(review.subquestions.map(item => item.skill), skills);
assert.deepEqual(review.subquestions.map(item => item.lesson), [
    'g4-math-hk1-b22', 'g4-math-hk1-b23', 'g4-math-hk1-b24', 'g4-math-hk1-b25'
]);
assert.equal(review.templateVariables.skills, skills.join(', '));
assert.equal(review.ans.split(', ').length, 4);
review.subquestions.forEach(item => {
    assert.equal(item.options.length, 4);
    assert.equal(new Set(item.options).size, 4);
    assert(item.options.includes(item.answer));
    assert(item.prompt && item.explanation && item.kind);
    assert(!JSON.stringify(item).includes('undefined'));
    if (item.kind === 'addition') assert.equal(item.values.first + item.values.second, item.values.result);
    if (item.kind === 'subtraction') assert.equal(item.values.first - item.values.second, item.values.result);
    if (item.kind === 'sum-difference') {
        assert.equal(item.values.small + item.values.large, item.values.sum);
        assert.equal(item.values.large - item.values.small, item.values.difference);
    }
});

assert.throws(
    () => generateQuestion(reviewKey, { skills: ['b22', 'b23', 'b24'] }, seededRandom(6111)),
    /Bài 22 đến Bài 25/i
);
assert.throws(
    () => generateQuestion(reviewKey, { skills: ['b22', 'b23', 'b24', 'b24'] }, seededRandom(6112)),
    /Bài 22 đến Bài 25/i
);
assert(review.subquestions.every(item => Number.isFinite(numericValue(item.answer)) || ['Đúng', 'Sai'].includes(item.answer)));

console.log('Phase 6 B22–B26 addition/subtraction template contracts verified.');
