;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.round_hundred_thousands'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, configuredValues, chooseConfiguredValue, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '3. Số có nhiều chữ số';
const MODES = ['round', 'rule'];
const MODE_LABELS = { round: 'làm tròn số đến hàng trăm nghìn', rule: 'nhận biết quy tắc làm tròn' };

function integerConfig(value, fallback, label) {
    const result = Number(value ?? fallback);
    if (!Number.isSafeInteger(result)) throw new Error(`${label} phải là số nguyên hợp lệ.`);
    return result;
}

function configuredRange(config) {
    const minimum = integerConfig(config.minimum, 100000, 'Số nhỏ nhất');
    const maximum = integerConfig(config.maximum, 999999999, 'Số lớn nhất');
    if (minimum < 100000 || maximum > 999999999 || minimum > maximum || maximum - minimum + 1 < 4) {
        throw new Error('Bài 13 cần phạm vi có ít nhất bốn số từ 100 000 đến 999 999 999.');
    }
    return { minimum, maximum };
}

function configuredModes(config) {
    return configuredValues(config, 'modes', MODES, MODES, 'Bài 13 cần ít nhất một dạng hợp lệ: làm tròn số hoặc nhận biết quy tắc làm tròn.');
}

function roundToHundredThousands(number) {
    return Math.floor((number + 50000) / 100000) * 100000;
}

function numericChoices(correct, random) {
    const values = [correct];
    for (let distance = 1; values.length < 4 && distance <= 8; distance += 1) {
        for (const candidate of [correct - distance * 100000, correct + distance * 100000]) {
            if (candidate >= 0 && candidate <= 1000000000 && !values.includes(candidate)) values.push(candidate);
            if (values.length === 4) break;
        }
    }
    return shuffle(values, random).map(formatNumber);
}

function ruleStatement(number, random) {
    const digit = Math.floor(number / 10000) % 10;
    const roundUp = digit >= 5;
    const correctStatement = roundUp
        ? 'Nếu chữ số hàng chục nghìn từ 5 đến 9 thì tăng chữ số hàng trăm nghìn lên 1.'
        : 'Nếu chữ số hàng chục nghìn nhỏ hơn 5 thì giữ nguyên chữ số hàng trăm nghìn.';
    const options = [
        'Nếu chữ số hàng chục nghìn nhỏ hơn 5 thì tăng chữ số hàng trăm nghìn lên 1.',
        'Nếu chữ số hàng chục nghìn nhỏ hơn 5 thì giữ nguyên chữ số hàng trăm nghìn.',
        'Nếu chữ số hàng chục nghìn từ 5 đến 9 thì tăng chữ số hàng trăm nghìn lên 1.',
        'Nếu chữ số hàng chục nghìn từ 5 đến 9 thì giữ nguyên chữ số hàng trăm nghìn.'
    ];
    return {
        mode: 'rule',
        number,
        tenThousandsDigit: digit,
        prompt: `Quy tắc nào đúng khi làm tròn số ${formatNumber(number)} đến hàng trăm nghìn?`,
        options: shuffle(options, random),
        answer: correctStatement,
        explanation: `Xét chữ số hàng chục nghìn là ${digit}: ${roundUp ? 'từ 5 đến 9 nên làm tròn lên.' : 'nhỏ hơn 5 nên giữ nguyên hàng trăm nghìn.'}`
    };
}

function makeSubquestion(mode, minimum, maximum, random) {
    const number = randomInt(minimum, maximum, random);
    if (mode === 'rule') return ruleStatement(number, random);
    const roundedNumber = roundToHundredThousands(number);
    return {
        mode: 'round',
        number,
        roundedNumber,
        prompt: `Làm tròn số ${formatNumber(number)} đến hàng trăm nghìn được số nào?`,
        options: numericChoices(roundedNumber, random),
        answer: formatNumber(roundedNumber),
        explanation: `Chữ số hàng chục nghìn là ${Math.floor(number / 10000) % 10}; vì vậy ${formatNumber(number)} làm tròn đến hàng trăm nghìn bằng ${formatNumber(roundedNumber)}.`
    };
}

function generateRoundHundredThousands(config = {}, random = Math.random) {
    const { minimum, maximum } = configuredRange(config);
    const modes = configuredModes(config);
    const selectedMode = chooseConfiguredValue(config, 'modes', MODES, MODES, random, 'Bài 13 cần ít nhất một dạng hợp lệ: làm tròn số hoặc nhận biết quy tắc làm tròn.');
    const subquestions = Array.from({ length: 4 }, (_, index) => ({
        label: String.fromCharCode(97 + index),
        ...makeSubquestion(selectedMode, minimum, maximum, random)
    }));
    const prompt = `Luyện tập ${MODE_LABELS[selectedMode]}:`;
    const question = createFourPartMultipleChoiceQuestion(
        'number.round_hundred_thousands',
        prompt,
        subquestions,
        `Bốn ý cùng luyện ${MODE_LABELS[selectedMode]}.`,
        { question: prompt, modes: modes.join(', '), selectedMode }
    );
    question.topic = TOPIC;
    return question;
}

return generateRoundHundredThousands;
}));
