;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {

const TOPIC = '1. Ôn tập và bổ sung';
const SKILLS = ['b01', 'b02', 'b03', 'b04'];
const PLACE_NAMES = ['chục nghìn', 'nghìn', 'trăm', 'chục'];
const PLACE_VALUES = [10000, 1000, 100, 10];
const OPERATIONS = ['+', '−', '×', '÷'];

function numericOptions(correct, random, minimum = 0, maximum = 99999) {
    const values = [correct];
    const candidates = shuffle([
        correct + 1, correct - 1, correct + 10, correct - 10,
        correct + 100, correct - 100, correct + 1000, correct - 1000,
        correct + 5, correct - 5
    ], random);
    for (const candidate of candidates) {
        if (Number.isSafeInteger(candidate) && candidate >= minimum && candidate <= maximum && !values.includes(candidate)) values.push(candidate);
        if (values.length === 4) break;
    }
    for (let candidate = minimum; values.length < 4 && candidate <= maximum; candidate++) {
        if (!values.includes(candidate)) values.push(candidate);
    }
    return shuffle(values.map(formatNumber), random);
}

function row(skill, prompt, correct, options, explanation, extra = {}) {
    return {
        skill, prompt, answer: formatNumber(correct), options, explanation,
        ...extra
    };
}

function makeB01(random) {
    const number = randomInt(10000, 99999, random);
    const placeIndex = randomInt(0, PLACE_NAMES.length - 1, random);
    const correct = Math.floor(number / PLACE_VALUES[placeIndex]) % 10;
    return row(
        'b01',
        `Trong số ${formatNumber(number)}, chữ số ở hàng ${PLACE_NAMES[placeIndex]} là chữ số nào?`,
        correct,
        numericOptions(correct, random, 0, 9),
        `Tách số theo từng hàng: chữ số hàng ${PLACE_NAMES[placeIndex]} là ${correct}.`,
        { number, place: PLACE_NAMES[placeIndex], placeValue: PLACE_VALUES[placeIndex] }
    );
}

function makeB02(random) {
    const operation = OPERATIONS[randomInt(0, OPERATIONS.length - 1, random)];
    let first;
    let second;
    let correct;
    if (operation === '+') {
        first = randomInt(1000, 49999, random);
        second = randomInt(1000, 99999 - first, random);
        correct = first + second;
    } else if (operation === '−') {
        first = randomInt(10000, 99999, random);
        second = randomInt(1000, first, random);
        correct = first - second;
    } else if (operation === '×') {
        second = randomInt(2, 9, random);
        first = randomInt(100, Math.floor(99999 / second), random);
        correct = first * second;
    } else {
        second = randomInt(2, 9, random);
        correct = randomInt(100, Math.floor(99999 / second), random);
        first = correct * second;
    }
    const expression = `${formatNumber(first)} ${operation} ${formatNumber(second)}`;
    return row(
        'b02',
        `Kết quả của phép tính ${expression} là bao nhiêu?`,
        correct,
        numericOptions(correct, random, 0, 99999),
        `Thực hiện phép ${operation === '×' ? 'nhân' : operation === '÷' ? 'chia' : operation === '+' ? 'cộng' : 'trừ'} theo đúng quy tắc, kết quả là ${formatNumber(correct)}.`,
        { first, second, operation, expressionValue: correct }
    );
}

function makeB03(random) {
    const targetParity = random() >= 0.5 ? 'even' : 'odd';
    const parityName = targetParity === 'even' ? 'chẵn' : 'lẻ';
    const correct = randomInt(10, 9999, random);
    const adjusted = correct % 2 === (targetParity === 'even' ? 0 : 1)
        ? correct
        : (correct === 9999 ? 9998 : correct + 1);
    return row(
        'b03',
        `Số nào sau đây là số ${parityName}?`,
        adjusted,
        numericOptions(adjusted, random, 10, 9999),
        `${formatNumber(adjusted)} có chữ số tận cùng là ${adjusted % 10}, nên là số ${parityName}.`,
        { targetParity, number: adjusted }
    );
}

function makeB04(random) {
    const variable = randomInt(10, 99, random);
    const constant = randomInt(2, 9, random);
    const useSubtraction = random() >= 0.5 && variable > constant;
    const symbol = useSubtraction ? '−' : '+';
    const correct = useSubtraction ? variable - constant : variable + constant;
    const expression = `a ${symbol} ${constant}`;
    return row(
        'b04',
        `Cho a = ${formatNumber(variable)}. Giá trị của biểu thức ${expression} bằng bao nhiêu?`,
        correct,
        numericOptions(correct, random, 0, 9999),
        `Thay a = ${formatNumber(variable)}: ${formatNumber(variable)} ${symbol} ${constant} = ${formatNumber(correct)}.`,
        { variable, constant, operation: useSubtraction ? 'subtract' : 'add', expression, expressionValue: correct }
    );
}

function generateReview(config = {}, random = Math.random) {
    const requestedSkills = Array.isArray(config.skills) && config.skills.length ? [...new Set(config.skills)] : [...SKILLS];
    if (requestedSkills.length !== 4 || requestedSkills.some((skill, index) => skill !== SKILLS[index])) {
        throw new Error('Bộ ôn tập Bài 6 chỉ nhận đúng bốn kỹ năng Bài 1 đến Bài 4.');
    }
    const builders = { b01: makeB01, b02: makeB02, b03: makeB03, b04: makeB04 };
    const subquestions = requestedSkills.map(skill => ({ label: String.fromCharCode(97 + SKILLS.indexOf(skill)), ...builders[skill](random) }));
    const title = 'Luyện tập chung Bài 1 đến Bài 4:';
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC,
        type: 'Trắc nghiệm', templateId: 'number.hk1_review_b01_b04', q: title, options: [],
        ans: subquestions.map(part => part.answer).join(', '),
        explanation: 'Bộ câu hỏi ôn lại lần lượt nhận biết số, thực hiện phép tính, nhận biết chẵn lẻ và tính biểu thức chứa chữ.',
        subquestions, partAnswerCounts: [1, 1, 1, 1],
        templateVariables: { question: title, skills: requestedSkills.join(', ') }
    };
}

return { 'number.hk1_review_b01_b04': generateReview };
}));
