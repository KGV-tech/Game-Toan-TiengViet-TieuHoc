;(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.Grade4MathTemplateShared = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
function randomInt(min, max, random) {
    return Math.floor(random() * (max - min + 1)) + min;
}

function shuffle(items, random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
        const swapIndex = randomInt(0, index, random);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

const numberWords = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readTriplet(value, forceHundreds = false) {
    const hundreds = Math.floor(value / 100);
    const tens = Math.floor(value / 10) % 10;
    const units = value % 10;
    const words = [];
    if (hundreds) words.push(numberWords[hundreds], 'trăm');
    else if (forceHundreds && value) words.push('không', 'trăm');
    if (tens >= 2) {
        words.push(numberWords[tens], 'mươi');
        if (units === 1) words.push('mốt');
        else if (units === 4) words.push('tư');
        else if (units === 5) words.push('lăm');
        else if (units) words.push(numberWords[units]);
    } else if (tens === 1) {
        words.push('mười');
        if (units === 5) words.push('lăm');
        else if (units) words.push(numberWords[units]);
    } else if (units) {
        if (words.length) words.push('linh');
        words.push(numberWords[units]);
    }
    return words.join(' ') || 'không';
}

function readNumber(value) {
    if (!Number.isInteger(value) || value < 0 || value >= 1000000000) throw new Error('Số phải thuộc khoảng từ 0 đến 999 999 999.');
    if (value < 1000) return readTriplet(value).replace(/^./, char => char.toUpperCase());
    const millions = Math.floor(value / 1000000);
    const thousands = Math.floor(value / 1000) % 1000;
    const units = value % 1000;
    const parts = [];
    if (millions) parts.push(readTriplet(millions), 'triệu');
    if (thousands) parts.push(readTriplet(thousands, Boolean(millions)), 'nghìn');
    if (units) parts.push(readTriplet(units, Boolean(millions || thousands)));
    return parts.join(' ').replace(/^./, char => char.toUpperCase());
}

function numericOptions(correct, minimum, maximum, random, candidateSteps = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]) {
    const values = [correct];
    const candidates = shuffle(candidateSteps.flatMap(step => [correct - step, correct + step]), random);
    for (const candidate of candidates) {
        if (candidate >= minimum && candidate <= maximum && !values.includes(candidate)) values.push(candidate);
        if (values.length === 4) break;
    }
    for (let candidate = minimum; values.length < 4 && candidate <= maximum; candidate += 1) {
        if (!values.includes(candidate)) values.push(candidate);
    }
    if (values.length < 4) throw new Error('Cần ít nhất bốn số khác nhau trong phạm vi đã chọn.');
    return shuffle(values, random).map(formatNumber);
}

function digitOptions(correct, random) {
    const candidates = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(digit => digit !== correct), random).slice(0, 3);
    return shuffle([correct, ...candidates], random).map(String);
}

function expandedForm(value) {
    return expandedTerms(value).map(formatNumber).join(' + ');
}

function createQuestion(templateId, prompt, values, correctValue, explanation, templateVariables = {}) {
    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '1. Số tự nhiên',
        type: 'Trắc nghiệm',
        templateId,
        q: prompt,
        options: values.map(formatNumber),
        ans: formatNumber(correctValue),
        explanation,
        templateVariables
    };
}

function createFourPartMultipleChoiceQuestion(templateId, prompt, subquestions, explanation, templateVariables = {}) {
    if (!Array.isArray(subquestions) || subquestions.length !== 4) throw new Error('Bài trắc nghiệm bốn phần cần đúng bốn câu con.');
    const normalizedSubquestions = subquestions.map((item, index) => ({
        ...item,
        label: item.label || String.fromCharCode(97 + index),
        prompt: item.prompt || '',
        options: [...item.options],
        answer: item.answer,
        imageUrl: item.imageUrl || '',
        openedImageUrl: item.openedImageUrl || ''
    }));
    const question = {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '1. Số tự nhiên',
        type: 'Trắc nghiệm',
        templateId,
        q: prompt,
        options: [],
        ans: normalizedSubquestions.map(item => item.answer).join(', '),
        explanation,
        templateVariables,
        subquestions: normalizedSubquestions,
        sharedPrompt: normalizedSubquestions.every(item => !String(item.prompt || '').trim())
    };
    return question;
}

function createFillBlankQuestion(templateId, prompt, answers, explanation, templateVariables = {}) {
    const answerList = Array.isArray(answers) ? answers : [answers];
    const question = {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '1. Số tự nhiên',
        type: 'Điền khuyết',
        templateId,
        q: prompt,
        options: [],
        ans: answerList.map(formatNumber).join(', '),
        explanation,
        templateVariables
    };
    if (answerList.length === 4) question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

function createComparisonQuestion(templateId, prompt, answer, explanation, templateVariables = {}) {
    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '1. Số tự nhiên',
        type: 'So sánh',
        templateId,
        q: prompt,
        options: [],
        ans: answer,
        explanation,
        templateVariables
    };
}

function randomNumberMatching(minimum, maximum, predicate, random) {
    for (let attempt = 0; attempt < 10000; attempt++) {
        const value = randomInt(minimum, maximum, random);
        if (predicate(value)) return value;
    }
    throw new Error('Template configuration cannot generate a valid number.');
}

function expandedTerms(value) {
    const placeValues = [100000000000, 10000000000, 1000000000, 100000000, 10000000, 1000000, 100000, 10000, 1000, 100, 10, 1];
    return placeValues.reduce((terms, placeValue) => {
        const digit = Math.floor(value / placeValue) % 10;
        if (digit) terms.push(digit * placeValue);
        return terms;
    }, []);
}

return { randomInt, shuffle, formatNumber, readNumber, numericOptions, digitOptions, expandedForm, createQuestion, createFourPartMultipleChoiceQuestion, createFillBlankQuestion, createComparisonQuestion, randomNumberMatching, expandedTerms };
}));
