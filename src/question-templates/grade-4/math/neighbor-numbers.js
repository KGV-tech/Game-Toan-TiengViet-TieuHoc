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
    const subquestions = ['a', 'b', 'c', 'd'].map(label => {
        const value = randomNumberMatching(minimum, maximum, number => number > minimum && number < maximum, random);
        return { label, value, display: `${label}) ___ ; ${formatNumber(value)} ; ___` };
    });
    const exercises = subquestions.map(item => item.display).join('<br>');
    const prompt = `Hãy điền số liền trước và số liền sau vào mỗi dòng:<br>${exercises}`;

    const question = createFillBlankQuestion(
        'number.neighbor_numbers',
        prompt,
        subquestions.flatMap(item => [item.value - 1, item.value + 1]),
        'Mỗi số liền trước kém số đã cho 1 đơn vị, mỗi số liền sau hơn số đã cho 1 đơn vị.',
        { question: prompt, exercises, number: subquestions.map(item => formatNumber(item.value)).join(', '), neighbor_line: exercises, blank: '___' }
    );
    // Mỗi dòng có hai ô, nhưng chỉ tính điểm khi cả cặp liền trước/liền sau đúng.
    question.partAnswerCounts = [2, 2, 2, 2];
    return question;
}

return generateNeighborNumbers;
}));
