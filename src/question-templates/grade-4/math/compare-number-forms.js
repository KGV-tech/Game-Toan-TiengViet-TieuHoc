;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.compare_number_forms'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, randomNumberMatching, formatNumber, expandedTerms }) {

function generateCompareNumberForms(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 10000;
    const maximum = config.maximum ?? 99999;
    const comparisonRows = ['a', 'b', 'c', 'd'].map(label => {
        const left = randomNumberMatching(minimum, maximum, number => expandedTerms(number).length >= 2, random);
        const mode = randomInt(0, 2, random);
        const right = mode === 0 ? left : randomNumberMatching(minimum, maximum, number => mode === 1 ? number > left : number < left, random);
        const answer = left === right ? '=' : (left > right ? '>' : '<');
        return {
            label,
            leftText: formatNumber(left),
            rightText: expandedTerms(right).map(formatNumber).join(' + '),
            answer
        };
    });
    const exercises = comparisonRows.map(item => `${item.label}) ${item.leftText} ___ ${item.rightText}`).join('<br>');
    const prompt = `Điền dấu thích hợp:<br>${exercises}`;

    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '1. Số tự nhiên',
        type: 'Kéo thả', templateId: 'number.compare_number_forms', q: prompt, options: [],
        ans: comparisonRows.map(item => item.answer).join(', '),
        comparisonRows,
        explanation: 'Đổi mỗi vế dạng tổng thành số rồi so sánh hai vế ở từng câu a, b, c, d.',
        templateVariables: { question: prompt, exercises, comparison_rows: exercises, blank: '___' }
    };
}

return generateCompareNumberForms;
}));
