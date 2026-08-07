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

function createFillBlankQuestion(templateId, prompt, answers, explanation, templateVariables = {}) {
    const answerList = Array.isArray(answers) ? answers : [answers];
    return {
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

return { randomInt, shuffle, formatNumber, createQuestion, createFillBlankQuestion, createComparisonQuestion, randomNumberMatching, expandedTerms };
}));
