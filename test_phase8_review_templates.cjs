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
        const expectedCount = Array.isArray(expectedOptions) ? expectedOptions[index] : expectedOptions;
        if (expectedCount !== undefined) assert.equal(item.options.length, expectedCount);
        assert(item.options.includes(item.answer));
        assert(item.prompt && item.explanation);
        assert(!JSON.stringify(item).includes('undefined'));
    });
};

const b33Skills = ['b10', 'b11', 'b12', 'b13'];
const b33 = generateQuestion('number.hk1_review_b33_numbers', { skills: b33Skills }, seededRandom(7330));
assertReview(b33, '7. Ôn tập Học kì 1', [4, 4, 4, 4]);
assert.equal(new Set(b33.subquestions.map(item => item.skill)).size, 1);
assert(b33Skills.includes(b33.subquestions[0].skill));
assert(b33.subquestions.every(item => item.lesson === `g4-math-hk1-${b33.subquestions[0].skill}`));
assert.equal(b33.templateVariables.selectedSkill, b33.subquestions[0].skill);

const b34Skills = ['b22', 'b23', 'b24', 'b25'];
const b34 = generateQuestion('number.hk1_review_b34_add_sub', { skills: b34Skills }, seededRandom(7340));
assertReview(b34, '7. Ôn tập Học kì 1', [4, 4, 4, 4]);
assert.equal(new Set(b34.subquestions.map(item => item.skill)).size, 1);
assert(b34Skills.includes(b34.subquestions[0].skill));

const b35 = generateQuestion('geometry.hk1_review_b35', { skills: ['b27', 'b28', 'b29', 'b30'] }, seededRandom(7350));
assertReview(b35, '7. Ôn tập Học kì 1', [2, 2, 2, 2]);
assert(b35.subquestions.every(item => /^<svg\b/i.test(item.visual)));
assert.equal(new Set(b35.subquestions.map(item => item.skill)).size, 1);

const b36 = generateQuestion('measurement.hk1_review_b36', { skills: ['b17', 'b18', 'b19', 'b20'] }, seededRandom(7360));
assertReview(b36, '7. Ôn tập Học kì 1', [4, 4, 4, 4]);
assert.equal(new Set(b36.subquestions.map(item => item.skill)).size, 1);
assert(b36.subquestions.every(item => item.lesson === `g4-math-hk1-${b36.subquestions[0].skill}`));

const groups = ['numbers', 'addSub', 'geometry', 'measurement'];
const b37 = generateQuestion('number.hk1_review_b37_full', { groups }, seededRandom(7370));
assertReview(b37, '7. Ôn tập Học kì 1');
assert(b37.subquestions.every(item => [2, 4].includes(item.options.length)));
assert.equal(new Set(b37.subquestions.map(item => item.skillGroup)).size, 1);
assert(groups.includes(b37.subquestions[0].skillGroup));
assert.equal(b37.templateVariables.selectedGroup, b37.subquestions[0].skillGroup);

assert.throws(
    () => generateQuestion('number.hk1_review_b37_full', { groups: [] }, seededRandom(7371)),
    /Bài 37/i
);
assert.throws(
    () => generateQuestion('number.hk1_review_b33_numbers', { skills: ['b10', 'b11', 'b17'] }, seededRandom(7372)),
    /Bài 33/i
);

console.log('Phase 8 review templates and HK1 weighting contracts verified.');
