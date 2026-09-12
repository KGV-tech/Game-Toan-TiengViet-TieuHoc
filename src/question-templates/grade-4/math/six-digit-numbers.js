;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.six_digit_numbers'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, readNumber, numericOptions, digitOptions, configuredValues, chooseConfiguredValue, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '3. Số có nhiều chữ số';
const MODES = ['compose', 'read', 'million', 'digit'];
const MODE_LABELS = { compose: 'lập số sáu chữ số', read: 'đọc số sáu chữ số', million: 'số liền trước và liền sau một triệu', digit: 'xác định giá trị chữ số' };
const PLACES = [
    [100000, 'trăm nghìn'],
    [10000, 'chục nghìn'],
    [1000, 'nghìn'],
    [100, 'trăm'],
    [10, 'chục'],
    [1, 'đơn vị']
];

function integerConfig(value, fallback, label) {
    const result = Number(value ?? fallback);
    if (!Number.isSafeInteger(result)) throw new Error(`${label} phải là số nguyên hợp lệ.`);
    return result;
}

function configuredRange(config) {
    const minimum = integerConfig(config.minimum, 100000, 'Số nhỏ nhất');
    const maximum = integerConfig(config.maximum, 999999, 'Số lớn nhất');
    if (minimum < 100000 || maximum > 999999 || minimum > maximum || maximum - minimum + 1 < 4) {
        throw new Error('Bài 10 cần phạm vi có ít nhất bốn số sáu chữ số, từ 100 000 đến 999 999.');
    }
    return { minimum, maximum };
}

function configuredModes(config) {
    return configuredValues(config, 'modes', MODES, MODES, 'Bài 10 cần ít nhất một dạng hợp lệ: lập số, đọc số, số 1 000 000 hoặc giá trị chữ số.');
}

function wordChoices(correctNumber, minimum, maximum, random) {
    const numbers = numericOptions(correctNumber, minimum, maximum, random).map(value => Number(value.replace(/\s/g, '')));
    return numbers.map(readNumber);
}

function composePrompt(number) {
    const parts = PLACES
        .map(([value, label]) => [Math.floor(number / value) % 10, label])
        .filter(([digit]) => digit > 0)
        .map(([digit, label]) => `${digit} ${label}`);
    return `Số gồm ${parts.join(', ')} là số nào?`;
}

function digitAt(number, placeValue) {
    return Math.floor(number / placeValue) % 10;
}

function makeSubquestion(mode, minimum, maximum, random, variant = 0) {
    if (mode === 'million') {
        const boundaryCases = [
            { number: 999998, direction: 'sau', answer: 999999 },
            { number: 999999, direction: 'sau', answer: 1000000 },
            { number: 1000001, direction: 'trước', answer: 1000000 },
            { number: 1000002, direction: 'trước', answer: 1000001 }
        ];
        const boundary = boundaryCases[variant % boundaryCases.length];
        const answer = boundary.answer;
        const options = [answer, answer - 1, answer + 1, answer + 1000]
            .filter((value, index, values) => value >= 0 && values.indexOf(value) === index);
        return {
            mode,
            prompt: `Số liền ${boundary.direction} của ${formatNumber(boundary.number)} là số nào?`,
            options: shuffle(options.map(formatNumber), random),
            answer: formatNumber(answer),
            number: boundary.number,
            explanation: `Số liền ${boundary.direction} của ${formatNumber(boundary.number)} là ${formatNumber(answer)}.`
        };
    }

    const number = randomInt(minimum, maximum, random);
    if (mode === 'compose') {
        return {
            mode,
            prompt: composePrompt(number),
            options: numericOptions(number, minimum, maximum, random),
            answer: formatNumber(number),
            number,
            explanation: `Ghép giá trị của sáu hàng: ${formatNumber(number)}.`
        };
    }
    if (mode === 'read') {
        return {
            mode,
            prompt: `Cách đọc đúng của số ${formatNumber(number)} là gì?`,
            options: wordChoices(number, minimum, maximum, random),
            answer: readNumber(number),
            number,
            explanation: `Đọc lần lượt từ hàng trăm nghìn đến hàng đơn vị: ${readNumber(number)}.`
        };
    }

    const [placeValue, placeLabel] = PLACES[randomInt(0, PLACES.length - 1, random)];
    const digit = digitAt(number, placeValue);
    return {
        mode,
        prompt: `Trong số ${formatNumber(number)}, chữ số ở hàng ${placeLabel} là chữ số nào?`,
        options: digitOptions(digit, random),
        answer: String(digit),
        number,
        place: placeLabel,
        explanation: `Chữ số ở hàng ${placeLabel} của ${formatNumber(number)} là ${digit}.`
    };
}

function generateSixDigitNumbers(config = {}, random = Math.random) {
    const { minimum, maximum } = configuredRange(config);
    const modes = configuredModes(config);
    const selectedMode = chooseConfiguredValue(config, 'modes', MODES, MODES, random, 'Bài 10 cần ít nhất một dạng hợp lệ: lập số, đọc số, số 1 000 000 hoặc giá trị chữ số.');
    const subquestions = Array.from({ length: 4 }, (_, index) => makeSubquestion(selectedMode, minimum, maximum, random, index))
        .map((part, index) => ({ label: String.fromCharCode(97 + index), ...part }));
    const prompt = `Luyện tập ${MODE_LABELS[selectedMode]}:`;
    const question = createFourPartMultipleChoiceQuestion(
        'number.six_digit_numbers',
        prompt,
        subquestions,
        `Bốn ý cùng luyện ${MODE_LABELS[selectedMode]}.`,
        { question: prompt, modes: modes.join(', '), selectedMode }
    );
    question.topic = TOPIC;
    return question;
}

return generateSixDigitNumbers;
}));
