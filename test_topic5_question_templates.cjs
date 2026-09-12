const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { generateQuestion, templateIds } = require('./src/question-templates/grade-4/math');
const topic5 = require('./src/question-templates/grade-4/math/topic-5');

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

function answerList(question) {
    return String(question.ans).split(', ').filter(Boolean);
}

const approvedTemplateIds = [
    'g4-m-add-sub-multi-digit',
    'g4-m-add-sub-word-problem',
    'g4-m-add-sub-missing-term',
    'g4-m-add-sub-missing-digit',
    'g4-m-addition-property-fill',
    'g4-m-add-sub-expression',
    'g4-m-sum-difference-direct',
    'g4-m-sum-difference-context',
    'g4-m-add-sub-true-false'
];

approvedTemplateIds.forEach(templateId => assert(templateIds.includes(templateId), `${templateId} must be registered.`));
assert(!templateIds.includes('g4-m-addition-match'), 'Deferred template 7 must not be registered yet.');
assert(!templateIds.includes('g4-m-convenient-addition'), 'Deferred template 8 must not be registered yet.');

const browserRoot = { console };
browserRoot.globalThis = browserRoot;
['shared.js', 'topic-5.js', 'index.js'].forEach(fileName => {
    const filePath = path.join(__dirname, 'src', 'question-templates', 'grade-4', 'math', fileName);
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), browserRoot, { filename: filePath });
});
assert(browserRoot.Grade4MathTemplates.templateIds.includes('g4-m-add-sub-word-problem'), 'Browser registry must load Topic 5 generators.');
assert.equal(browserRoot.Grade4MathTopic5Contexts.wordProblem.length, 30);
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(indexHtml.indexOf('math/topic-5.js') < indexHtml.indexOf('math/index.js'), 'Topic 5 script must load before the math registry.');

const additionSubtraction = generateQuestion('g4-m-add-sub-multi-digit', { minimumDigits: 5, maximumDigits: 6 }, seededRandom(501));
assert.equal(additionSubtraction.topic, '5. Phép cộng và phép trừ');
assert.equal(additionSubtraction.type, 'Điền khuyết');
assert.equal(additionSubtraction.practiceRows.length, 4);
assert.equal(new Set(additionSubtraction.practiceRows.map(row => row.operation)).size, 1, 'The merged template must keep one arithmetic operation across all four parts.');
assert(['+', '-'].includes(additionSubtraction.practiceRows[0].operation));
assert.deepEqual(additionSubtraction.partAnswerCounts, [1, 1, 1, 1]);
assert.equal(answerList(additionSubtraction).length, 4);
additionSubtraction.practiceRows.forEach(row => {
    assert.match(row.display, /___/);
    const [first, second, result] = row.values;
    assert.equal(row.operation === '+' ? first + second : first - second, result, 'Every merged arithmetic row must be correct.');
});

const missingTerm = generateQuestion('g4-m-add-sub-missing-term', { minimumDigits: 5, maximumDigits: 6 }, seededRandom(502));
assert.equal(missingTerm.practiceRows.length, 4);
assert.equal((missingTerm.q.match(/___/g) || []).length, 4);
assert.deepEqual(missingTerm.partAnswerCounts, [1, 1, 1, 1]);
missingTerm.practiceRows.forEach(row => {
    const [first, second, result] = row.values;
    assert.equal(row.answer, row.values[row.blankIndex]);
    assert.equal(row.operation === '+' ? first + second : first - second, result);
});
assert.equal(new Set(missingTerm.practiceRows.map(row => row.operation)).size, 1, 'Missing-term parts must keep one arithmetic operation.');

const missingDigit = generateQuestion('g4-m-add-sub-missing-digit', { minimumDigits: 5, maximumDigits: 6 }, seededRandom(503));
assert.equal(missingDigit.practiceRows.length, 4);
assert.equal((missingDigit.q.match(/___/g) || []).length, 4);
assert.deepEqual(missingDigit.partAnswerCounts, [1, 1, 1, 1]);
missingDigit.practiceRows.forEach(row => {
    const [first, second, result] = row.values;
    assert.match(row.expression, /___/);
    assert(/^[0-9]$/.test(String(row.answer)), 'Each missing-digit answer must be one digit.');
    assert.equal(row.operation === '+' ? first + second : first - second, result);
});
assert.equal(new Set(missingDigit.practiceRows.map(row => row.operation)).size, 1, 'Missing-digit parts must keep one arithmetic operation.');

const propertyFill = generateQuestion('g4-m-addition-property-fill', {}, seededRandom(504));
assert.equal(propertyFill.practiceRows.length, 4);
assert.equal((propertyFill.q.match(/___/g) || []).length, 4);
assert.deepEqual(propertyFill.partAnswerCounts, [1, 1, 1, 1]);
assert(propertyFill.practiceRows.every(row => ['commutative', 'associative'].includes(row.property)));
assert.equal(new Set(propertyFill.practiceRows.map(row => row.property)).size, 1, 'Property parts must keep one addition property.');

const expressions = generateQuestion('g4-m-add-sub-expression', { minimumDigits: 3, maximumDigits: 5 }, seededRandom(505));
assert.equal(expressions.practiceRows.length, 4);
assert.equal((expressions.q.match(/___/g) || []).length, 4);
assert.deepEqual(expressions.partAnswerCounts, [1, 1, 1, 1]);
assert(expressions.practiceRows.every(row => /[+−]/.test(row.expression)));
assert(expressions.practiceRows.every(row => Number.isInteger(row.answer) && row.answer >= 0));
assert.equal(new Set(expressions.practiceRows.map(row => row.kind)).size, 1, 'Expression parts must keep one expression form.');

const directSumDifference = generateQuestion('g4-m-sum-difference-direct', {}, seededRandom(506));
assert.equal(answerList(directSumDifference).length, 2);
assert.deepEqual(directSumDifference.partAnswerCounts, [1, 1]);
assert.equal((directSumDifference.q.match(/___/g) || []).length, 2);
assert.equal(directSumDifference.values.small + directSumDifference.values.large, directSumDifference.values.sum);
assert.equal(directSumDifference.values.large - directSumDifference.values.small, directSumDifference.values.difference);

assert.equal(topic5.contextBanks.wordProblem.length, 30, 'Template 3 must expose exactly 30 contexts.');
assert.equal(topic5.contextBanks.sumDifference.length, 30, 'Template 11 must expose exactly 30 contexts.');
assert.equal(new Set(topic5.contextBanks.wordProblem.map(context => context.id)).size, 30);
assert.equal(new Set(topic5.contextBanks.sumDifference.map(context => context.id)).size, 30);

topic5.contextBanks.wordProblem.forEach((context, index) => {
    const generated = generateQuestion('g4-m-add-sub-word-problem', { contextId: context.id }, seededRandom(520 + index));
    assert.equal(generated.templateVariables.contextId, context.id);
    assert.equal(answerList(generated).length, 1);
    assert.equal((generated.q.match(/___/g) || []).length, 1);
    assert(Number.isInteger(numericValue(generated.ans)) && numericValue(generated.ans) > 0, `${context.id} must have a positive integer answer.`);
});

topic5.contextBanks.sumDifference.forEach((context, index) => {
    const generated = generateQuestion('g4-m-sum-difference-context', { contextId: context.id }, seededRandom(560 + index));
    assert.equal(generated.templateVariables.contextId, context.id);
    assert.equal(answerList(generated).length, 2);
    assert.equal((generated.q.match(/___/g) || []).length, 2);
    assert.deepEqual(generated.partAnswerCounts, [1, 1]);
    assert(generated.values.small > 0 && generated.values.large > generated.values.small);
    assert.equal(generated.values.small + generated.values.large, generated.values.sum);
    assert.equal(generated.values.large - generated.values.small, generated.values.difference);
});

const trueFalse = generateQuestion('g4-m-add-sub-true-false', {}, seededRandom(590));
assert.equal(trueFalse.type, 'Đúng/Sai');
assert.equal(trueFalse.statements.length, 4);
assert.deepEqual(trueFalse.statements.map(statement => statement.label), ['a', 'b', 'c', 'd']);
assert(trueFalse.statements.every(statement => ['Đúng', 'Sai'].includes(statement.answer)));
assert.equal(new Set(trueFalse.statements.map(statement => statement.operation)).size, 1, 'True/false parts must keep one arithmetic operation.');

console.log('Grade 4 Topic 5 question templates satisfy the approved contracts.');
