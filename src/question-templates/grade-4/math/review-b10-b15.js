;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, { 'number.hk1_review_b10_b15': generate });
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, readNumber, numericOptions, digitOptions, expandedForm, configuredValues, chooseConfiguredValue, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '3. Số có nhiều chữ số';
const SKILLS = ['b10', 'b11', 'b12', 'b13', 'b14', 'b15'];
const SKILL_LABELS = {
    b10: 'Bài 10 · Lập số sáu chữ số',
    b11: 'Bài 11 · Hàng và lớp',
    b12: 'Bài 12 · Lớp triệu',
    b13: 'Bài 13 · Làm tròn số',
    b14: 'Bài 14 · So sánh số',
    b15: 'Bài 15 · Dãy số'
};
const LESSONS = {
    b10: 'g4-math-hk1-b10',
    b11: 'g4-math-hk1-b11',
    b12: 'g4-math-hk1-b12',
    b13: 'g4-math-hk1-b13',
    b14: 'g4-math-hk1-b14',
    b15: 'g4-math-hk1-b15'
};
const SIX_DIGIT_MINIMUM = 100000;
const SIX_DIGIT_MAXIMUM = 999999;

function hasZeroBetweenClasses(value) {
    return [Math.floor(value / 1000000) % 1000, Math.floor(value / 1000) % 1000, value % 1000]
        .some(group => group > 0 && String(group).includes('0'));
}

function millionNumber(random) {
    for (let attempt = 0; attempt < 10000; attempt += 1) {
        const value = randomInt(1000000, 999999999, random);
        if (hasZeroBetweenClasses(value)) return value;
    }
    throw new Error('Không thể tạo dữ liệu lớp triệu cho bộ review.');
}

function row(skill, prompt, answer, options, explanation, extra = {}) {
    return { skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], prompt, answer, options, explanation, ...extra };
}

function makeB10(random) {
    const number = randomInt(SIX_DIGIT_MINIMUM, SIX_DIGIT_MAXIMUM, random);
    const placeValues = [[100000, 'trăm nghìn'], [10000, 'chục nghìn'], [1000, 'nghìn'], [100, 'trăm'], [10, 'chục'], [1, 'đơn vị']];
    const parts = placeValues
        .map(([value, label]) => [Math.floor(number / value) % 10, label])
        .filter(([digit]) => digit > 0)
        .map(([digit, label]) => `${digit} ${label}`);
    return row('b10', `Số gồm ${parts.join(', ')} là số nào?`, formatNumber(number), numericOptions(number, SIX_DIGIT_MINIMUM, SIX_DIGIT_MAXIMUM, random), `Ghép giá trị các hàng để được ${formatNumber(number)}.`, { number });
}

function makeB11(random) {
    const number = randomInt(SIX_DIGIT_MINIMUM, SIX_DIGIT_MAXIMUM, random);
    const places = [[100000, 'trăm nghìn'], [10000, 'chục nghìn'], [1000, 'nghìn'], [100, 'trăm'], [10, 'chục'], [1, 'đơn vị']];
    const [placeValue, place] = places[randomInt(0, places.length - 1, random)];
    const digit = Math.floor(number / placeValue) % 10;
    return row('b11', `Trong số ${formatNumber(number)}, chữ số ở hàng ${place} là chữ số nào?`, String(digit), digitOptions(digit, random), `Chữ số ở hàng ${place} của ${formatNumber(number)} là ${digit}.`, { number, place });
}

function makeB12(random) {
    const number = millionNumber(random);
    const answer = readNumber(number);
    const choices = numericOptions(number, 1000000, 999999999, random).map(value => Number(value.replace(/\s/g, ''))).map(readNumber);
    return row('b12', `Cách đọc đúng của số ${formatNumber(number)} là gì?`, answer, shuffle(choices, random), `Đọc theo từng lớp: ${answer}.`, { number });
}

function makeB13(random) {
    const number = randomInt(100000, 999999999, random);
    const roundedNumber = Math.floor((number + 50000) / 100000) * 100000;
    return row('b13', `Làm tròn số ${formatNumber(number)} đến hàng trăm nghìn được số nào?`, formatNumber(roundedNumber), numericOptions(roundedNumber, 0, 1000000000, random, [100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000]), `Chữ số hàng chục nghìn là ${Math.floor(number / 10000) % 10}; kết quả là ${formatNumber(roundedNumber)}.`, { number, roundedNumber });
}

function makeB14(random) {
    const left = randomInt(100000, 999999999, random);
    const right = randomInt(100000, 999999999, random);
    const answer = left > right ? '>' : left < right ? '<' : '=';
    return row('b14', `Điền dấu thích hợp: ${formatNumber(left)} ? ${formatNumber(right)}`, answer, shuffle(['<', '>', '=', '≠'], random), `So sánh từ hàng lớn nhất: ${formatNumber(left)} ${answer} ${formatNumber(right)}.`, { left, right });
}

function makeB15(random) {
    const step = [1, 2, 5, 10, 100, 1000, 10000][randomInt(0, 6, random)];
    const start = randomInt(0, 999999 - step * 4, random);
    const sequence = Array.from({ length: 4 }, (_, index) => start + step * index);
    const answer = start + step * 4;
    return row('b15', `Số tiếp theo của dãy ${sequence.map(formatNumber).join(', ')}, ... là số nào?`, formatNumber(answer), numericOptions(answer, 0, 999999, random), `Mỗi số hơn số đứng trước ${formatNumber(step)} đơn vị.`, { start, step, sequence });
}

function generateReview(config = {}, random = Math.random) {
    const skills = configuredValues(
        config,
        'skills',
        ['b10', 'b11', 'b12', 'b13'],
        SKILLS,
        'Bộ ôn tập Bài 10 đến Bài 15 cần ít nhất một kỹ năng hợp lệ.'
    );
    const selectedSkill = chooseConfiguredValue(
        config,
        'skills',
        ['b10', 'b11', 'b12', 'b13'],
        SKILLS,
        random,
        'Bộ ôn tập Bài 10 đến Bài 15 cần ít nhất một kỹ năng hợp lệ.'
    );
    const builders = { b10: makeB10, b11: makeB11, b12: makeB12, b13: makeB13, b14: makeB14, b15: makeB15 };
    const subquestions = Array.from({ length: 4 }, (_, index) => ({
        label: String.fromCharCode(97 + index),
        ...builders[selectedSkill](random)
    }));
    const prompt = `Luyện tập ${SKILL_LABELS[selectedSkill]}:`;
    const question = createFourPartMultipleChoiceQuestion(
        'number.hk1_review_b10_b15',
        prompt,
        subquestions,
        `Bốn ý cùng luyện ${SKILL_LABELS[selectedSkill].replace(/^Bài \d+ · /, '').toLocaleLowerCase('vi-VN')}.`,
        { question: prompt, skills: skills.join(', '), selectedSkill }
    );
    question.topic = TOPIC;
    return question;
}

return generateReview;
}));
