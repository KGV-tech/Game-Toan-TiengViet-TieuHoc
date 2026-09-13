const assert = require('node:assert/strict');
const { generateQuestion } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 0x100000000;
    };
}

function assertCollectionCohesion(question, collection, field, label) {
    const parts = question[collection];
    assert.equal(parts.length, 4, `${label} phải có đúng bốn ý.`);
    const values = parts.map(part => part[field]);
    assert(values.every(value => value !== undefined && value !== null), `${label} phải ghi nhận ${field} cho cả bốn ý.`);
    assert.equal(new Set(values).size, 1, `${label} không được trộn ${field}: ${values.join(', ')}`);
}

function assertFourPartCohesion(question, field, label) {
    const collection = question.subquestions ? 'subquestions' : question.statements ? 'statements' : 'practiceRows';
    assertCollectionCohesion(question, collection, field, label);
}

function assertBalancedParity(question, label) {
    const parts = question.subquestions || question.sequenceRounds;
    assert.ok(Array.isArray(parts), `${label} phải có các ý để kiểm tra chẵn/lẻ.`);
    const counts = parts.reduce((total, part) => {
        total[part.targetParity] = (total[part.targetParity] || 0) + 1;
        return total;
    }, {});
    assert.deepEqual(counts, { even: 2, odd: 2 }, `${label} phải có 2 ý chẵn và 2 ý lẻ.`);
}

const homogeneousCases = [
    ['number.four_arithmetic_blanks', { operations: ['+', '-'], layouts: ['expressionLeft', 'twoExpressions'], blankPositions: ['first', 'second', 'third'] }, 'subquestions', 'operation'],
    ['number.four_arithmetic_blanks', { operations: ['+', '-'], layouts: ['expressionLeft', 'twoExpressions'], blankPositions: ['first', 'second', 'third'] }, 'subquestions', 'layout'],
    ['number.four_arithmetic_comparisons', { operations: ['+', '-'], layouts: ['expressionLeft', 'twoExpressions'] }, 'comparisonRows', 'operation'],
    ['number.four_arithmetic_comparisons', { operations: ['+', '-'], layouts: ['expressionLeft', 'twoExpressions'] }, 'comparisonRows', 'layout'],
    ['number.four_operations_fill_blanks', { operations: ['+', '-', '*', '/'] }, 'practiceRows', 'operation'],
    ['number.four_operations_expressions', { operations: ['+', '-', '*', '/'] }, 'practiceRows', 'operation'],
    ['number.even_odd_classify', { parities: ['even', 'odd'] }, 'subquestions', 'targetParity'],
    ['number.even_odd_count', { parities: ['even', 'odd'] }, 'subquestions', 'targetParity'],
    ['number.even_odd_sequence', { parities: ['even', 'odd'], sequenceSteps: [2, 4, 6] }, 'subquestions', 'targetParity'],
    ['number.even_odd_sequence', { parities: ['even', 'odd'], sequenceSteps: [2, 4, 6] }, 'sequenceRounds', 'step'],
    ['number.even_odd_form', { parities: ['even', 'odd'] }, 'subquestions', 'targetParity'],
    ['number.variable_expression_value', { operations: ['add', 'subtract', 'multiply', 'divide'] }, 'practiceRows', 'operation'],
    ['number.variable_expression_choice', { operations: ['add', 'subtract', 'multiply', 'divide'] }, 'subquestions', 'operation'],
    ['number.six_digit_numbers', { modes: ['compose', 'read', 'million', 'digit'] }, 'mode'],
    ['number.million_class', { modes: ['read', 'write', 'digit', 'expanded'] }, 'mode'],
    ['number.round_hundred_thousands', { modes: ['round', 'round', 'round', 'rule'] }, 'mode'],
    ['number.place_value_true_false', {}, 'kind'],
    ['number.hk1_review_b01_b04', { skills: ['b01', 'b02', 'b03', 'b04'] }, 'skill'],
    ['number.hk1_review_b10_b15', { skills: ['b10', 'b11', 'b12', 'b13'] }, 'skill'],
    ['measurement.practice_cards', { allowedKinds: ['mass', 'area', 'time', 'century'] }, 'kind'],
    ['measurement.hk1_review_b17_b20', { skills: ['b17', 'b18', 'b19', 'b20'] }, 'skill'],
    ['measurement.mass_unit_convert', {}, 'practiceRows', 'kind'],
    ['measurement.area_unit_convert', {}, 'practiceRows', 'kind'],
    ['measurement.time_unit_convert', {}, 'practiceRows', 'kind'],
    ['measurement.compare_units', {}, 'comparisonRows', 'kind'],
    ['measurement.match_equivalences', {}, 'matchingRows', 'kind'],
    ['measurement.unit_true_false', {}, 'statements', 'kind'],
    ['measurement.word_problem_units', { scenarioKinds: ['mass', 'area', 'time'] }, 'practiceRows', 'kind'],
    ['number.hk1_review_b22_b25', { skills: ['b22', 'b23', 'b24', 'b25'] }, 'skill'],
    ['geometry.hk1_review_b27_b31', { skills: ['b27', 'b28', 'b29', 'b30'] }, 'skill'],
    ['number.hk1_review_b33_numbers', { skills: ['b10', 'b11', 'b12', 'b13'] }, 'skill'],
    ['number.hk1_review_b34_add_sub', { skills: ['b22', 'b23', 'b24', 'b25'] }, 'skill'],
    ['geometry.hk1_review_b35', { skills: ['b27', 'b28', 'b29', 'b30'] }, 'skill'],
    ['measurement.hk1_review_b36', { skills: ['b17', 'b18', 'b19', 'b20'] }, 'skill'],
    ['number.hk1_review_b37_full', { groups: ['numbers', 'addSub', 'geometry', 'measurement'] }, 'skillGroup'],
    ['g4-m-angle-review', {}, 'mode']
];

homogeneousCases.forEach(([templateId, config, collectionOrField, maybeField], index) => {
    const question = generateQuestion(templateId, config, seededRandom(9100 + index));
    const collection = maybeField ? collectionOrField : (question.subquestions ? 'subquestions' : 'statements');
    const field = maybeField || collectionOrField;
    if (field === 'targetParity') assertBalancedParity(question, templateId);
    else assertCollectionCohesion(question, collection, field, templateId);
});

[
    ['g4-m-add-sub-multi-digit', 'practiceRows', 'operation'],
    ['g4-m-add-sub-missing-term', 'practiceRows', 'operation'],
    ['g4-m-add-sub-missing-digit', 'practiceRows', 'operation'],
    ['g4-m-addition-property-fill', 'practiceRows', 'property'],
    ['g4-m-add-sub-expression', 'practiceRows', 'kind'],
    ['g4-m-add-sub-true-false', 'statements', 'operation']
].forEach(([templateId, collection, field], index) => {
    const question = generateQuestion(templateId, {}, seededRandom(9300 + index));
    assertCollectionCohesion(question, collection, field, templateId);
});

['number.hk1_review_b22_b25', 'number.hk1_review_b34_add_sub'].forEach((templateId, index) => {
    const question = generateQuestion(templateId, { skills: ['b24'] }, seededRandom(9400 + index));
    assertCollectionCohesion(question, 'subquestions', 'property', templateId);
});

[
    ['number.hk1_review_b01_b04', { skills: ['b02'] }, 'operation'],
    ['number.hk1_review_b01_b04', { skills: ['b03'] }, 'targetParity'],
    ['number.hk1_review_b01_b04', { skills: ['b04'] }, 'operation']
].forEach(([templateId, config, field], index) => {
    const question = generateQuestion(templateId, config, seededRandom(9500 + index));
    if (field === 'targetParity') assertBalancedParity(question, `${templateId} ${field}`);
    else assertCollectionCohesion(question, 'subquestions', field, `${templateId} ${field}`);
});

const parityReview = generateQuestion('number.hk1_review_b01_b04', { skills: ['b03'] }, seededRandom(9203));
parityReview.subquestions.forEach(part => {
    const expectedParity = part.targetParity === 'even' ? 0 : 1;
    const matchingOptions = part.options.filter(option => Number(option.replace(/\s/g, '')) % 2 === expectedParity);
    assert.equal(matchingOptions.length, 1, `Bài 3 phải có đúng một đáp án ${part.targetParity === 'even' ? 'chẵn' : 'lẻ'}.`);
});

console.log('Template cohesion and parity contracts verified.');
