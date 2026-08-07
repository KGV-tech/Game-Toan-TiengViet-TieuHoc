;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.smallest_of_four'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, createQuestion }) {

function generateSmallestOfFour(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 1000;
    const maximum = config.maximum ?? 99999;
    const values = new Set();
    while (values.size < 4) values.add(randomInt(minimum, maximum, random));
    const options = [...values];
    const answer = Math.min(...options);

    return createQuestion(
        'number.smallest_of_four',
        'Hãy tìm số bé nhất trong các số sau.',
        shuffle(options, random),
        answer,
        `So sánh bốn số theo hàng chục nghìn, rồi đến hàng nghìn để chọn số bé nhất là ${formatNumber(answer)}.`,
        { question: 'Hãy tìm số bé nhất trong các số sau.' }
    );
}

return generateSmallestOfFour;
}));
