const assert = require('node:assert/strict');
const fs = require('node:fs');
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

assert.ok(templateIds.includes('number.min_max_of_four'), 'Bài 1 cần generator gộp tìm số bé/lớn.');
assert.ok(templateIds.includes('number.round_number'), 'Bài 1 cần generator làm tròn theo hàng.');

const minMax = generateQuestion('number.min_max_of_four', {
    minimum: 10000,
    maximum: 99999
}, seededRandom(1201));
assert.equal(minMax.type, 'Trắc nghiệm');
assert.equal(minMax.q, 'Hãy chọn đáp án đúng');
assert.equal(minMax.sharedPrompt, '', 'Câu hỏi chung phải nằm trong q, còn câu con giữ yêu cầu riêng.');
assert.deepEqual(minMax.subquestions.map(item => item.task), ['smallest', 'smallest', 'largest', 'largest']);
assert.deepEqual(minMax.subquestions.map(item => item.prompt), ['Tìm số bé nhất?', 'Tìm số bé nhất?', 'Tìm số lớn nhất?', 'Tìm số lớn nhất?']);
assert.equal(minMax.subquestions.length, 4);
minMax.subquestions.forEach(item => {
    assert.equal(item.options.length, 4);
    assert.equal(new Set(item.options).size, 4);
    const values = item.options.map(numericValue);
    const expected = item.task === 'smallest' ? Math.min(...values) : Math.max(...values);
    assert.equal(numericValue(item.answer), expected);
});

const b01Sequence = generateQuestion('number.natural_sequence', {
    minimum: 10,
    maximum: 99999,
    allowedSteps: [1, 10, 100, 1000, 10000, -1, -10, -100, -1000, -10000],
    sequenceLengthMin: 6,
    sequenceLengthMax: 6,
    blankCountMin: 1,
    blankCountMax: 3
}, seededRandom(1202));
assert.equal(b01Sequence.type, 'Chuỗi Quy luật');
assert.equal(b01Sequence.sequenceRounds.length, 4);
assert(b01Sequence.sequenceRounds.every(round => round.sequence.length === 6));
assert(b01Sequence.sequenceRounds.every(round => round.sequence.every(value => value >= 10 && value <= 99999)));
assert(b01Sequence.sequenceRounds.every(round => {
    const blanks = new Set(round.blankIndexes);
    return round.sequence.some((_, index) => index < round.sequence.length - 1 && !blanks.has(index) && !blanks.has(index + 1));
}), 'Mỗi dãy phải giữ lại ít nhất hai dữ liệu liền kề.');
assert.equal(b01Sequence.ans.split(', ').length, b01Sequence.partAnswerCounts.reduce((sum, count) => sum + count, 0));

let endpointBlankSeen = false;
for (let seed = 1; seed <= 120 && !endpointBlankSeen; seed += 1) {
    const sample = generateQuestion('number.natural_sequence', {
        minimum: 10,
        maximum: 99999,
        allowedSteps: [1, 10, 100, 1000, 10000, -1, -10, -100, -1000, -10000],
        sequenceLengthMin: 6,
        sequenceLengthMax: 6,
        blankCountMin: 1,
        blankCountMax: 3
    }, seededRandom(seed));
    endpointBlankSeen = sample.sequenceRounds.some(round => round.blankIndexes.includes(0) || round.blankIndexes.includes(round.sequence.length - 1));
}
assert(endpointBlankSeen, 'Vị trí ô trống phải có thể bao gồm đầu hoặc cuối dãy.');

const rounding = generateQuestion('number.round_number', {
    minimum: 10,
    maximum: 99999,
    allowedPlaces: ['tens', 'hundreds', 'thousands', 'tenThousands']
}, seededRandom(1203));
assert.equal(rounding.type, 'Trắc nghiệm');
assert.equal(rounding.q, 'Hãy làm tròn số theo yêu cầu.');
assert.deepEqual(new Set(rounding.subquestions.map(item => item.roundingPlace)), new Set(['tens', 'hundreds', 'thousands', 'tenThousands']));
rounding.subquestions.forEach(item => {
    assert.equal(item.options.length, 4);
    assert.equal(new Set(item.options).size, 4);
    assert(item.options.every(option => numericValue(option) > 0), 'Đáp án làm tròn không được có số 0.');
    assert.equal(item.answer, item.options.find(option => numericValue(option) === item.roundedNumber));
});

const b01TrueFalse = generateQuestion('number.place_value_true_false', {
    minimum: 1001,
    maximum: 99999,
    statementKinds: ['place', 'comparison'],
    statementLayout: 'b01-four-types'
}, seededRandom(1204));
assert.equal(b01TrueFalse.type, 'Đúng/Sai');
assert.equal(b01TrueFalse.statements.length, 4);
assert.equal(b01TrueFalse.statements.filter(item => item.answer === 'Đúng').length, 2);
assert.equal(b01TrueFalse.statements.filter(item => item.answer === 'Sai').length, 2);
assert.deepEqual(b01TrueFalse.statements.map(item => item.layoutKind), [
    'place', 'number-number', 'number-expression', 'expression-expression'
]);
assert.deepEqual(b01TrueFalse.statements.map(item => item.kind), ['place', 'comparison', 'comparison', 'comparison']);
assert(b01TrueFalse.statements.every(item => !/lớp/i.test(item.text)), 'Bài 1 không dùng nhận định về lớp.');
assert(numericValue(b01TrueFalse.templateVariables.number) > 1000);
assert(numericValue(b01TrueFalse.templateVariables.number) <= 99999);
assert.equal(b01TrueFalse.templateVariables.statementLayout, 'b01-four-types');
assert.deepEqual(b01TrueFalse.templateVariables.comparisonKinds.split(', '), [
    'number-number', 'number-expression', 'expression-expression'
]);
const b01BoundaryRange = generateQuestion('number.place_value_true_false', {
    minimum: 1000,
    maximum: 100000,
    statementKinds: ['place', 'comparison'],
    statementLayout: 'b01-four-types'
}, seededRandom(12041));
assert(numericValue(b01BoundaryRange.templateVariables.number) > 1000);
assert(numericValue(b01BoundaryRange.templateVariables.number) < 100000);
assert.equal(b01TrueFalse.statements.filter(item => item.layoutKind === 'place').length, 1);
assert.equal(b01TrueFalse.statements.filter(item => item.layoutKind !== 'place').length, 3);
b01TrueFalse.statements.filter(item => item.layoutKind !== 'place').forEach(item => {
    const leftIsExpression = item.leftText.includes(' + ');
    const rightIsExpression = item.rightText.includes(' + ');
    if (item.layoutKind === 'number-number') {
        assert.equal(leftIsExpression, false);
        assert.equal(rightIsExpression, false);
        assert.notEqual(item.leftValue, item.rightValue);
        assert.ok(['<', '>'].includes(item.operator), 'So sánh số–số chỉ được dùng dấu < hoặc >.');
    }
    if (item.layoutKind === 'number-expression') {
        assert.equal(leftIsExpression, false);
        assert.equal(rightIsExpression, true);
    }
    if (item.layoutKind === 'expression-expression') {
        assert.equal(leftIsExpression, true);
        assert.equal(rightIsExpression, true);
    }
    if (item.operator === '=') assert.equal(item.leftValue, item.rightValue, 'Dấu = chỉ dùng khi hai vế thực sự bằng nhau.');
    const relation = item.leftValue === item.rightValue ? '=' : (item.leftValue > item.rightValue ? '>' : '<');
    const isTrue = item.operator === relation;
    assert.equal(isTrue, item.answer === 'Đúng', 'Dấu so sánh phải khớp với giá trị hai vế.');
});

const b01Comparison = generateQuestion('number.place_value_true_false', {
    minimum: 1001,
    maximum: 99999,
    statementKinds: ['comparison']
}, seededRandom(1205));
assert(b01Comparison.statements.every(item => item.kind === 'comparison'));
assert(b01Comparison.statements.every(item => ['number', 'expression'].includes(item.comparisonKind)));
assert(b01Comparison.statements.every(item => !/lớp|hàng/i.test(item.text)), 'Nhận định so sánh không được chèn nội dung về lớp hoặc hàng.');
assert(b01Comparison.statements.every(item => {
    if (item.comparisonKind === 'number') {
        assert.notEqual(item.leftValue, item.rightValue);
        assert.ok(['<', '>'].includes(item.operator), 'So sánh hai số không được sinh dấu =.');
    }
    if (item.operator === '=') assert.equal(item.leftValue, item.rightValue, 'Dấu = chỉ dùng khi hai vế thực sự bằng nhau.');
    const relation = item.leftValue === item.rightValue ? '=' : (item.leftValue > item.rightValue ? '>' : '<');
    const isTrue = item.operator === relation;
    return isTrue === (item.answer === 'Đúng');
}), 'Nhận định so sánh phải khớp với giá trị hai vế.');
let hasComparisonExpression = false;
for (let seed = 1; seed <= 120 && !hasComparisonExpression; seed += 1) {
    const sample = generateQuestion('number.place_value_true_false', {
        minimum: 1001,
        maximum: 99999,
        statementKinds: ['comparison']
    }, seededRandom(seed));
    hasComparisonExpression = sample.statements.some(item => item.comparisonKind === 'expression');
}
assert(hasComparisonExpression, 'Nhận định so sánh phải hỗ trợ số với biểu thức.');

globalThis.app = {};
require('./src/modules/constants.js');
require('./src/modules/curriculum.js');
const topic1 = globalThis.app.constants.topics['4'].math.hk1[0];
const lessonOf = generatorKey => globalThis.app.curriculum.getTemplateLesson({
    classlevel: 'Lớp 4',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: topic1,
    generator_key: generatorKey
});
assert.equal(lessonOf('number.min_max_of_four'), 'g4-math-hk1-b01');
assert.equal(lessonOf('number.natural_sequence'), 'g4-math-hk1-b01');
assert.equal(lessonOf('number.round_number'), 'g4-math-hk1-b01');
assert.equal(lessonOf('number.place_value_true_false'), 'g4-math-hk1-b01');

const migration = fs.readFileSync('supabase/migrations/20260913_b01_template_updates.sql', 'utf8');
assert.match(migration, /prompt_template\s*=\s*'\{question\}'/i, 'Migration phải bỏ phần dẫn trùng ở temp 4.');
assert.match(migration, /question_type\s*=\s*'Chuỗi Quy luật'/i, 'Migration phải giữ đúng loại cho temp chuỗi quy luật.');
assert.match(migration, /number\.min_max_of_four/);
assert.match(migration, /number\.natural_sequence/);
assert.match(migration, /number\.round_number/);
assert.match(migration, /number\.place_value_true_false/);
assert.match(migration, /minimum":1001/);
assert.match(migration, /statementKinds":\["place","comparison"\]/);
assert.match(migration, /statementLayout":"b01-four-types"/);
assert.match(migration, /0cb830c2-3de6-4805-a2e6-19bcd9f1b744/);
assert.match(migration, /93fb31c9-2ef5-421e-a875-8aae79142e4e/);

console.log('Bài 1 template update contracts verified.');
