;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.place_value_true_false'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {

const places = [
    { divisor: 1, className: 'lớp đơn vị', placeName: 'hàng đơn vị' }, { divisor: 10, className: 'lớp đơn vị', placeName: 'hàng chục' }, { divisor: 100, className: 'lớp đơn vị', placeName: 'hàng trăm' },
    { divisor: 1000, className: 'lớp nghìn', placeName: 'hàng nghìn' }, { divisor: 10000, className: 'lớp nghìn', placeName: 'hàng chục nghìn' }, { divisor: 100000, className: 'lớp nghìn', placeName: 'hàng trăm nghìn' },
    { divisor: 1000000, className: 'lớp triệu', placeName: 'hàng triệu' }, { divisor: 10000000, className: 'lớp triệu', placeName: 'hàng chục triệu' }, { divisor: 100000000, className: 'lớp triệu', placeName: 'hàng trăm triệu' },
    { divisor: 1000000000, className: 'lớp tỷ', placeName: 'hàng tỷ' }, { divisor: 10000000000, className: 'lớp tỷ', placeName: 'hàng chục tỷ' }, { divisor: 100000000000, className: 'lớp tỷ', placeName: 'hàng trăm tỷ' }
];

function digitAt(value, divisor) {
    return Math.floor(value / divisor) % 10;
}

function hasDistinctDigits(value) {
    const digits = String(value).split('');
    return new Set(digits).size === digits.length;
}

function generatePlaceValueTrueFalse(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 10000000;
    const maximum = config.maximum ?? 99999999;
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 0 || minimum >= maximum) throw new Error('Invalid place-value true/false configuration.');
    let number;
    for (let attempt = 0; attempt < 10000; attempt++) {
        const candidate = randomInt(minimum, maximum, random);
        if (hasDistinctDigits(candidate)) { number = candidate; break; }
    }
    if (number === undefined) throw new Error('Phạm vi số không đủ để sinh các chữ số không lặp.');
    const availablePlaces = places.filter(place => place.divisor <= 10 ** (String(number).length - 1));
    if (availablePlaces.length < 4) throw new Error('The configured range must contain at least four place values.');

    const selectedPlaces = shuffle(availablePlaces, random).slice(0, 4);
    const truthValues = shuffle([true, true, false, false], random);
    const statementKinds = Array.isArray(config.statementKinds) && config.statementKinds.length ? config.statementKinds.filter(kind => kind === 'class' || kind === 'place') : ['class', 'place'];
    const statements = selectedPlaces.map((place, index) => {
        const digit = digitAt(number, place.divisor);
        const kind = statementKinds[index % statementKinds.length];
        if (kind === 'place') {
            const otherPlaces = availablePlaces.filter(item => item.divisor !== place.divisor);
            const placeName = truthValues[index] ? place.placeName : otherPlaces[randomInt(0, otherPlaces.length - 1, random)].placeName;
            return { label: String.fromCharCode(65 + index), text: `Trong số ${formatNumber(number)}, chữ số ${digit} ở ${placeName}.`, answer: truthValues[index] ? 'Đúng' : 'Sai', kind };
        }
        const otherClasses = [...new Set(availablePlaces.map(item => item.className))].filter(className => className !== place.className);
        const className = truthValues[index] ? place.className : otherClasses[randomInt(0, otherClasses.length - 1, random)];
        return { label: String.fromCharCode(65 + index), text: `Trong số ${formatNumber(number)}, chữ số ${digit} thuộc ${className}.`, answer: truthValues[index] ? 'Đúng' : 'Sai', kind };
    });
    const prompt = 'Chọn Đúng/Sai?';

    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số',
        type: 'Đúng/Sai', templateId: 'number.place_value_true_false', q: prompt, options: [],
        ans: statements.map(statement => statement.answer).join(', '), statements,
        explanation: `Xác định lớp hoặc hàng của từng chữ số trong số ${formatNumber(number)} rồi chọn Đúng hoặc Sai.`,
        templateVariables: { question: prompt, number: formatNumber(number), statements: statements.map(statement => `${statement.label}. ${statement.text}`).join('<br>') }
    };
}

return generatePlaceValueTrueFalse;
}));
