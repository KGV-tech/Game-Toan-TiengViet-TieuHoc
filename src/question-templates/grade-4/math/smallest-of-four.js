;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.smallest_of_four'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, createFourPartMultipleChoiceQuestion }) {

function generateSmallestOfFour(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 1000;
    const maximum = config.maximum ?? 99999;
    const subquestions = ['a', 'b', 'c', 'd'].map(label => {
        const values = new Set();
        while (values.size < 4) values.add(randomInt(minimum, maximum, random));
        const options = [...values];
        const answer = Math.min(...options);
        return {
            label,
            prompt: '',
            options: shuffle(options, random).map(formatNumber),
            answer: formatNumber(answer)
        };
    });

    return createFourPartMultipleChoiceQuestion(
        'number.smallest_of_four',
        'Hãy tìm số bé nhất trong mỗi nhóm bốn số sau.',
        subquestions,
        'So sánh từng nhóm bốn số theo các hàng từ trái sang phải để chọn số bé nhất.',
        { question: 'Hãy tìm số bé nhất trong mỗi nhóm bốn số sau.' }
    );
}

return generateSmallestOfFour;
}));
