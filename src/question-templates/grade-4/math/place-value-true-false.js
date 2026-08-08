;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.place_value_true_false'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {

const places = [
    { divisor: 1, className: 'lớp đơn vị' }, { divisor: 10, className: 'lớp đơn vị' }, { divisor: 100, className: 'lớp đơn vị' },
    { divisor: 1000, className: 'lớp nghìn' }, { divisor: 10000, className: 'lớp nghìn' }, { divisor: 100000, className: 'lớp nghìn' },
    { divisor: 1000000, className: 'lớp triệu' }, { divisor: 10000000, className: 'lớp triệu' }, { divisor: 100000000, className: 'lớp triệu' },
    { divisor: 1000000000, className: 'lớp tỷ' }, { divisor: 10000000000, className: 'lớp tỷ' }, { divisor: 100000000000, className: 'lớp tỷ' }
];

function digitAt(value, divisor) {
    return Math.floor(value / divisor) % 10;
}

function generatePlaceValueTrueFalse(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 10000000;
    const maximum = config.maximum ?? 99999999;
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 0 || minimum >= maximum) throw new Error('Invalid place-value true/false configuration.');
    const number = randomInt(minimum, maximum, random);
    const availablePlaces = places.filter(place => place.divisor <= maximum);
    if (availablePlaces.length < 4) throw new Error('The configured range must contain at least four place values.');

    const selectedPlaces = shuffle(availablePlaces, random).slice(0, 4);
    const truthValues = shuffle([true, true, false, false], random);
    const statements = selectedPlaces.map((place, index) => {
        const digit = digitAt(number, place.divisor);
        const otherClasses = [...new Set(places.map(item => item.className))].filter(className => className !== place.className);
        const className = truthValues[index] ? place.className : otherClasses[randomInt(0, otherClasses.length - 1, random)];
        return { label: String.fromCharCode(65 + index), text: `Chữ số ${digit} thuộc ${className}.`, answer: truthValues[index] ? 'Đúng' : 'Sai' };
    });
    const prompt = `Số ${formatNumber(number)}`;

    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số',
        type: 'Đúng/Sai', templateId: 'number.place_value_true_false', q: prompt, options: [],
        ans: statements.map(statement => statement.answer).join(', '), statements,
        explanation: `Xác định lớp của từng chữ số trong số ${formatNumber(number)} rồi chọn Đúng hoặc Sai.`,
        templateVariables: { question: prompt, number: formatNumber(number) }
    };
}

return generatePlaceValueTrueFalse;
}));
