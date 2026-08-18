;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.missing_expanded_addend'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, randomNumberMatching, formatNumber, createFillBlankQuestion, expandedTerms }) {

function generateMissingExpandedAddend(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 10000;
    const maximum = config.maximum ?? 99999;
    const subquestions = ['a', 'b', 'c', 'd'].map(label => {
        const value = randomNumberMatching(minimum, maximum, number => expandedTerms(number).length >= 2, random);
        const terms = expandedTerms(value);
        const missingIndex = randomInt(0, terms.length - 1, random);
        const missingValue = terms[missingIndex];
        const displayedTerms = terms.map((term, index) => index === missingIndex ? '___' : formatNumber(term));
        return { label, missingValue, display: `${label}) ${formatNumber(value)} = ${displayedTerms.join(' + ')}` };
    });
    const exercises = subquestions.map(item => item.display).join('<br>');
    const prompt = `Hãy điền số thích hợp vào chỗ trống:<br>${exercises}`;

    return createFillBlankQuestion(
        'number.missing_expanded_addend',
        prompt,
        subquestions.map(item => item.missingValue),
        'Phân tích từng số theo tổng giá trị các hàng rồi điền phần còn thiếu ở mỗi câu.',
        { question: prompt, exercises, number: '', expression: exercises, blank: '___', expanded: exercises }
    );
}

return generateMissingExpandedAddend;
}));
