;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.compose_from_places'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomNumberMatching, formatNumber, createFillBlankQuestion, expandedTerms }) {

const placeLabels = {
    1: 'đơn vị', 10: 'chục', 100: 'trăm', 1000: 'nghìn', 10000: 'chục nghìn',
    100000: 'trăm nghìn', 1000000: 'triệu', 10000000: 'chục triệu', 100000000: 'trăm triệu',
    1000000000: 'tỷ', 10000000000: 'chục tỷ', 100000000000: 'trăm tỷ'
};

function joinVietnamese(parts) {
    if (parts.length < 2) return parts[0];
    return `${parts.slice(0, -1).join(', ')} và ${parts.at(-1)}`;
}

function generateComposeFromPlaces(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 10000;
    const maximum = config.maximum ?? 99999;
    const subquestions = ['a', 'b', 'c', 'd'].map(label => {
        const value = randomNumberMatching(minimum, maximum, number => expandedTerms(number).length >= 2, random);
        const description = joinVietnamese(expandedTerms(value).map(term => {
            const placeValue = 10 ** Math.floor(Math.log10(term));
            return `${term / placeValue} ${placeLabels[placeValue]}`;
        }));
        return { label, value, description, display: `${label}) Viết số, biết số đó gồm: ${description}. Số đó là ___` };
    });
    const exercises = subquestions.map(item => item.display).join('<br>');
    const prompt = `Hãy điền số thích hợp vào chỗ trống:<br>${exercises}`;

    return createFillBlankQuestion(
        'number.compose_from_places',
        prompt,
        subquestions.map(item => item.value),
        'Ghép các chữ số theo từng hàng ở mỗi câu a, b, c, d để viết số đúng.',
        { question: prompt, exercises, place_values: subquestions.map(item => item.description).join('; '), blank: '___', number: subquestions.map(item => formatNumber(item.value)).join(', ') }
    );
}

return generateComposeFromPlaces;
}));
