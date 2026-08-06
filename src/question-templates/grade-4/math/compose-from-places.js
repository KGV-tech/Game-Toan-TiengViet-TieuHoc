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
    const value = randomNumberMatching(minimum, maximum, number => expandedTerms(number).length >= 2, random);
    const description = joinVietnamese(expandedTerms(value).map(term => {
        const placeValue = 10 ** Math.floor(Math.log10(term));
        return `${term / placeValue} ${placeLabels[placeValue]}`;
    }));
    const prompt = `Viết số rồi đọc số, biết số đó gồm: ${description}.<br>Số đó là ___`;

    return createFillBlankQuestion(
        'number.compose_from_places',
        prompt,
        value,
        `Ghép các chữ số theo từng hàng, ta được số ${formatNumber(value)}.`,
        { question: prompt, number: value }
    );
}

return generateComposeFromPlaces;
}));
