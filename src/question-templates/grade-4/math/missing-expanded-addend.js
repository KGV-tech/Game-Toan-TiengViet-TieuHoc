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
    const value = randomNumberMatching(minimum, maximum, number => expandedTerms(number).length >= 2, random);
    const terms = expandedTerms(value);
    const missingIndex = randomInt(0, terms.length - 1, random);
    const missingValue = terms[missingIndex];
    const displayedTerms = terms.map((term, index) => index === missingIndex ? '___' : formatNumber(term));
    const expanded = terms.map(formatNumber).join(' + ');
    const prompt = `Điền số còn thiếu:<br>${formatNumber(value)} = ${displayedTerms.join(' + ')}`;

    return createFillBlankQuestion(
        'number.missing_expanded_addend',
        prompt,
        missingValue,
        `Số ${formatNumber(value)} được phân tích thành ${expanded}.`,
        { question: prompt, number: value, expanded }
    );
}

return generateMissingExpandedAddend;
}));
