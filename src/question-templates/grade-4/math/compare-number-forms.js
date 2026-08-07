;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.compare_number_forms'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, randomNumberMatching, formatNumber, createComparisonQuestion, expandedTerms }) {

function generateCompareNumberForms(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 10000;
    const maximum = config.maximum ?? 99999;
    const left = randomNumberMatching(minimum, maximum, number => expandedTerms(number).length >= 2, random);
    const mode = randomInt(0, 2, random);
    const right = mode === 0 ? left : randomNumberMatching(minimum, maximum, number => mode === 1 ? number > left : number < left, random);
    const answer = left === right ? '=' : (left > right ? '>' : '<');
    const rightExpanded = expandedTerms(right).map(formatNumber).join(' + ');
    const comparison = `${formatNumber(left)} ___ ${rightExpanded}`;
    const prompt = `Điền dấu thích hợp:<br>${comparison}`;

    return createComparisonQuestion(
        'number.compare_number_forms',
        prompt,
        answer,
        `${formatNumber(left)} ${answer} ${formatNumber(right)}.`,
        { question: prompt, left: formatNumber(left), right_expanded: rightExpanded, comparison, blank: '___', right }
    );
}

return generateCompareNumberForms;
}));
