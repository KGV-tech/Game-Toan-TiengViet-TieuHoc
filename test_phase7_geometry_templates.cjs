const assert = require('node:assert/strict');
const { generateQuestion, templateIds } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 0x100000000;
    };
}

const phase7Keys = [
    'g4-m-perpendicular-identify',
    'g4-m-perpendicular-grid-practice',
    'g4-m-parallel-identify',
    'g4-m-parallel-grid-practice',
    'g4-m-quad-classify',
    'geometry.hk1_review_b27_b31'
];
phase7Keys.forEach(key => assert(templateIds.includes(key), `Phase 7 phải đăng ký ${key}.`));

const assertFourChoiceQuestion = (question, topic) => {
    assert.equal(question.classlevel, 'Lớp 4');
    assert.equal(question.subject, 'Toán');
    assert.equal(question.semester, 'Học kỳ 1');
    assert.equal(question.topic, topic);
    assert.equal(question.type, 'Trắc nghiệm');
    assert.equal(question.subquestions.length, 4);
    assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1]);
    question.subquestions.forEach((item, index) => {
        assert.equal(item.label, 'abcd'[index]);
        assert.match(item.visual, /^<svg\b/i);
        assert(item.prompt && item.answer && item.explanation);
        assert(item.options.includes(item.answer));
        assert(!JSON.stringify(item).includes('undefined'));
    });
};

const relationQuestion = generateQuestion('g4-m-perpendicular-identify', {}, seededRandom(7200));
assertFourChoiceQuestion(relationQuestion, '6. Đường thẳng vuông góc. Đường thẳng song song');
relationQuestion.subquestions.forEach(item => {
    assert(['perpendicular', 'parallel', 'intersecting', 'separate'].includes(item.geometry.relation));
    assert.equal(item.geometry.angle, item.geometry.relation === 'perpendicular' ? 90 : item.geometry.angle);
    assert.deepEqual(item.options.sort(), ['Không vuông góc', 'Vuông góc'].sort());
    assert.equal(item.answer, item.geometry.relation === 'perpendicular' ? 'Vuông góc' : 'Không vuông góc');
});

const gridQuestion = generateQuestion('g4-m-parallel-grid-practice', {}, seededRandom(7201));
assertFourChoiceQuestion(gridQuestion, '6. Đường thẳng vuông góc. Đường thẳng song song');
gridQuestion.subquestions.forEach(item => {
    assert.equal(item.geometry.mode, 'grid');
    assert(Array.isArray(item.geometry.gridLines) && item.geometry.gridLines.length >= 2);
    assert.equal(item.geometry.relation === 'parallel' ? item.answer : item.answer, item.geometry.relation === 'parallel' ? 'Song song' : 'Không song song');
});

const shapeQuestion = generateQuestion('g4-m-quad-classify', { allowedShapes: ['rhombus'] }, seededRandom(7202));
assertFourChoiceQuestion(shapeQuestion, '6. Đường thẳng vuông góc. Đường thẳng song song');
assert(shapeQuestion.subquestions.every(item => item.geometry.shapeKind === 'rhombus'));
assert(shapeQuestion.subquestions.every(item => item.answer === 'Cả hình bình hành và hình thoi'));
assert.throws(
    () => generateQuestion('g4-m-quad-classify', { allowedShapes: ['rhombus', 'unknown'] }, seededRandom(7203)),
    /hình|allowlist|hợp lệ/i,
    'Bài 31 không được âm thầm bỏ qua loại hình ngoài allowlist.'
);

const reviewSkills = ['b27', 'b28', 'b29', 'b31'];
const review = generateQuestion('geometry.hk1_review_b27_b31', { skills: reviewSkills }, seededRandom(7210));
assertFourChoiceQuestion(review, '6. Đường thẳng vuông góc. Đường thẳng song song');
assert.deepEqual(review.subquestions.map(item => item.skill), reviewSkills);
assert.deepEqual(review.subquestions.map(item => item.lesson), [
    'g4-math-hk1-b27', 'g4-math-hk1-b28', 'g4-math-hk1-b29', 'g4-math-hk1-b31'
]);
assert.equal(review.templateVariables.skills, reviewSkills.join(', '));
assert.throws(
    () => generateQuestion('geometry.hk1_review_b27_b31', { skills: ['b27', 'b28', 'b29'] }, seededRandom(7211)),
    /Bài 27 đến Bài 31/i
);
assert.throws(
    () => generateQuestion('geometry.hk1_review_b27_b31', { skills: ['b27', 'b28', 'b28', 'b31'] }, seededRandom(7212)),
    /Bài 27 đến Bài 31/i
);

console.log('Phase 7 perpendicular, parallel and quadrilateral contracts verified.');
