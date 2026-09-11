;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.million_class'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, readNumber, numericOptions, digitOptions, expandedForm, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '3. Số có nhiều chữ số';
const MODES = ['read', 'write', 'digit', 'expanded'];
const PLACES = [
    [100000000, 'trăm triệu', 'lớp triệu'],
    [10000000, 'chục triệu', 'lớp triệu'],
    [1000000, 'triệu', 'lớp triệu'],
    [100000, 'trăm nghìn', 'lớp nghìn'],
    [10000, 'chục nghìn', 'lớp nghìn'],
    [1000, 'nghìn', 'lớp nghìn'],
    [100, 'trăm', 'lớp đơn vị'],
    [10, 'chục', 'lớp đơn vị'],
    [1, 'đơn vị', 'lớp đơn vị']
];

function integerConfig(value, fallback, label) {
    const result = Number(value ?? fallback);
    if (!Number.isSafeInteger(result)) throw new Error(`${label} phải là số nguyên hợp lệ.`);
    return result;
}

function configuredRange(config) {
    const minimum = integerConfig(config.minimum, 1000000, 'Số nhỏ nhất');
    const maximum = integerConfig(config.maximum, 999999999, 'Số lớn nhất');
    if (minimum < 1000000 || maximum > 999999999 || minimum > maximum || maximum - minimum + 1 < 4) {
        throw new Error('Bài 12 cần phạm vi có ít nhất bốn số trong lớp triệu, từ 1 000 000 đến 999 999 999.');
    }
    return { minimum, maximum };
}

function configuredModes(config) {
    const modes = Array.isArray(config.modes) ? [...config.modes] : [...MODES];
    if (modes.length !== 4 || new Set(modes).size !== 4 || modes.some(mode => !MODES.includes(mode))) {
        throw new Error('Bài 12 cần đúng bốn dạng: đọc số, viết số, giá trị chữ số và phân tích số.');
    }
    return modes;
}

function hasZeroBetweenClasses(value) {
    const groups = [
        Math.floor(value / 1000000) % 1000,
        Math.floor(value / 1000) % 1000,
        value % 1000
    ];
    return groups.some(group => group > 0 && String(group).includes('0'));
}

function pickNumber(minimum, maximum, includeZeroGroups, random) {
    for (let attempt = 0; attempt < 10000; attempt += 1) {
        const value = randomInt(minimum, maximum, random);
        if (!includeZeroGroups || hasZeroBetweenClasses(value)) return value;
    }
    throw new Error('Không thể tạo số có chữ số 0 giữa các lớp với cấu hình Bài 12 hiện tại.');
}

function expandedChoices(correctNumber, minimum, maximum, random) {
    const numbers = numericOptions(correctNumber, minimum, maximum, random).map(value => Number(value.replace(/\s/g, '')));
    return numbers.map(expandedForm);
}

function makeSubquestion(mode, minimum, maximum, includeZeroGroups, random) {
    const number = pickNumber(minimum, maximum, includeZeroGroups, random);
    if (mode === 'read') {
        const answer = readNumber(number);
        const numbers = numericOptions(number, minimum, maximum, random).map(value => Number(value.replace(/\s/g, '')));
        return {
            mode,
            number,
            prompt: `Cách đọc đúng của số ${formatNumber(number)} là gì?`,
            options: shuffle(numbers.map(readNumber), random),
            answer,
            explanation: `Đọc theo từng lớp từ trái sang phải: ${answer}.`
        };
    }
    if (mode === 'write') {
        const answer = formatNumber(number);
        return {
            mode,
            number,
            prompt: `Số nào viết đúng với cách đọc “${readNumber(number)}”?`,
            options: numericOptions(number, minimum, maximum, random),
            answer,
            explanation: `Viết ${readNumber(number)} thành ${answer}, giữ đủ các chữ số 0 ở giữa các lớp.`
        };
    }
    if (mode === 'expanded') {
        const answer = expandedForm(number);
        return {
            mode,
            number,
            prompt: `Dạng phân tích theo giá trị các hàng của số ${formatNumber(number)} là gì?`,
            options: expandedChoices(number, minimum, maximum, random),
            answer,
            explanation: `Tách số theo từng hàng khác 0: ${answer}.`
        };
    }

    const [placeValue, placeLabel, classLabel] = PLACES[randomInt(0, PLACES.length - 1, random)];
    const digit = Math.floor(number / placeValue) % 10;
    return {
        mode,
        number,
        place: placeLabel,
        className: classLabel,
        prompt: `Trong số ${formatNumber(number)}, chữ số hàng ${placeLabel} thuộc ${classLabel} là chữ số nào?`,
        options: digitOptions(digit, random),
        answer: String(digit),
        explanation: `Ở hàng ${placeLabel} của ${formatNumber(number)} có chữ số ${digit}; hàng này thuộc ${classLabel}.`
    };
}

function generateMillionClass(config = {}, random = Math.random) {
    const { minimum, maximum } = configuredRange(config);
    const modes = configuredModes(config);
    const includeZeroGroups = config.includeZeroGroups !== false;
    const subquestions = modes.map(mode => makeSubquestion(mode, minimum, maximum, includeZeroGroups, random));
    const prompt = 'Luyện tập đọc, viết và phân tích số trong phạm vi lớp triệu:';
    const question = createFourPartMultipleChoiceQuestion(
        'number.million_class',
        prompt,
        subquestions,
        'Đọc theo từng lớp triệu, nghìn, đơn vị; các chữ số 0 ở giữa vẫn phải được giữ đúng khi viết và phân tích số.',
        { question: prompt, modes: modes.join(', ') }
    );
    question.topic = TOPIC;
    return question;
}

return generateMillionClass;
}));
