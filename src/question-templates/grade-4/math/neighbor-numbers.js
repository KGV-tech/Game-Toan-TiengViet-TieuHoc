;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.neighbor_numbers'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomNumberMatching, formatNumber, createFillBlankQuestion }) {

function generateNeighborNumbers(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 10000;
    const maximum = config.maximum ?? 99999;
    const value = randomNumberMatching(minimum, maximum, number => number > minimum && number < maximum, random);
    const prompt = `Điền số liền trước và số liền sau của ${formatNumber(value)}:<br>___ ; ${formatNumber(value)} ; ___`;

    return createFillBlankQuestion(
        'number.neighbor_numbers',
        prompt,
        [value - 1, value + 1],
        `Số liền trước ${formatNumber(value)} là ${formatNumber(value - 1)}; số liền sau là ${formatNumber(value + 1)}.`,
        { question: prompt, number: value }
    );
}

return generateNeighborNumbers;
}));
