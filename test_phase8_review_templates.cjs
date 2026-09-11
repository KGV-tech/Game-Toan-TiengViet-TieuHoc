const assert = require('node:assert/strict');
const { generateQuestion, templateIds } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 0x100000000;
    };
}

const reviewKeys = [
    'number.hk1_review_b33_numbers',
    'number.hk1_review_b34_add_sub',
    'geometry.hk1_review_b35',
    'measurement.hk1_review_b36',
    'number.hk1_review_b37_full'
];
reviewKeys.forEach(key => assert(templateIds.includes(key), `Phase 8 phải đăng ký ${key}.`));

const assertReview = (question, topic, expectedOptions) => {
    assert.equal(question.topic, topic);
    assert.equal(question.type, 'Trắc nghiệm');
    assert.equal(question.subquestions.length, 4);
    assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1]);
    question.subquestions.forEach((item, index) => {
        assert.equal(item.label, 'abcd'[index]);
        assert.equal(item.options.length, expectedOptions[index]);
        assert(item.options.includes(item.answer));
        assert(item.prompt && item.explanation);
        assert(!JSON.stringify(item).includes('undefined'));
    });
};

const b33Skills = ['b10', 'b11', 'b12', 'b13'];
const b33 = generateQuestion('number.hk1_review_b33_numbers', { skills: b33Skills }, seededRandom(7330));
assertReview(b33, '7. Ôn tập Học kì 1', [4, 4, 4, 4]);
assert.deepEqual(b33.subquestions.map(item => item.skill), b33Skills);
assert.deepEqual(b33.subquestions.map(item => item.lesson), b33Skills.map(skill => `g4-math-hk1-${skill}`));

const b34Skills = ['b22', 'b23', 'b24', 'b25'];
const b34 = generateQuestion('number.hk1_review_b34_add_sub', { skills: b34Skills }, seededRandom(7340));
assertReview(b34, '7. Ôn tập Học kì 1', [4, 4, 4, 4]);
assert.deepEqual(b34.subquestions.map(item => item.skill), b34Skills);

const b35 = generateQuestion('geometry.hk1_review_b35', { skills: ['b27', 'b28', 'b29', 'b30'] }, seededRandom(7350));
assertReview(b35, '7. Ôn tập Học kì 1', [2, 2, 2, 2]);
assert(b35.subquestions.every(item => /^<svg\b/i.test(item.visual)));

const b36 = generateQuestion('measurement.hk1_review_b36', { skills: ['b17', 'b18', 'b19', 'b20'] }, seededRandom(7360));
assertReview(b36, '7. Ôn tập Học kì 1', [4, 4, 4, 4]);
assert.deepEqual(b36.subquestions.map(item => item.lesson), ['g4-math-hk1-b17', 'g4-math-hk1-b18', 'g4-math-hk1-b19', 'g4-math-hk1-b20']);

const groups = ['numbers', 'addSub', 'geometry', 'measurement'];
const b37 = generateQuestion('number.hk1_review_b37_full', { groups }, seededRandom(7370));
assertReview(b37, '7. Ôn tập Học kì 1', [4, 4, 2, 4]);
assert.deepEqual(b37.subquestions.map(item => item.skillGroup), groups);
assert.deepEqual(b37.subquestions.map(item => item.sourceLesson), ['g4-math-hk1-b33', 'g4-math-hk1-b34', 'g4-math-hk1-b35', 'g4-math-hk1-b36']);
assert.equal(b37.subquestions[2].lesson, 'g4-math-hk1-b35');

assert.throws(
    () => generateQuestion('number.hk1_review_b37_full', { groups: ['numbers', 'addSub', 'geometry'] }, seededRandom(7371)),
    /Bài 37/i
);
assert.throws(
    () => generateQuestion('number.hk1_review_b33_numbers', { skills: ['b10', 'b10', 'b12', 'b13'] }, seededRandom(7372)),
    /Bài 33/i
);

console.log('Phase 8 review templates and HK1 weighting contracts verified.');
