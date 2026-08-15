;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.four_operations_fill_blanks'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, formatNumber }) {

const OPERATIONS = ['+', '-', '*', '/'];

function shuffle(items, random) {
    const values = [...items];
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = randomInt(0, index, random);
        [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    return values;
}

function symbolFor(operation) {
    return operation === '*' ? '×' : (operation === '/' ? '÷' : (operation === '-' ? '−' : '+'));
}

function generatePair(operation, minimum, maximum, random) {
    if (operation === '+') {
        const result = randomInt(minimum * 2, maximum, random);
        const first = randomInt(minimum, result - minimum, random);
        return { first, second: result - first, result };
    }
    if (operation === '-') {
        const result = randomInt(minimum, maximum - minimum, random);
        const second = randomInt(minimum, maximum - result, random);
        return { first: result + second, second, result };
    }
    if (operation === '*') {
        const second = randomInt(2, 9, random);
        const first = randomInt(minimum, Math.floor(maximum / second), random);
        return { first, second, result: first * second };
    }
    const second = randomInt(2, 9, random);
    const result = randomInt(minimum, Math.floor(maximum / second), random);
    return { first: result * second, second, result };
}

return function generateFourOperationsFillBlanks(config = {}, random = Math.random) {
    const minimumDigits = Number(config.minimumDigits ?? 2);
    const maximumDigits = Number(config.maximumDigits ?? 5);
    if (!Number.isInteger(minimumDigits) || !Number.isInteger(maximumDigits) || minimumDigits < 2 || maximumDigits > 9 || minimumDigits > maximumDigits) throw new Error('Số lượng chữ số phải là số nguyên từ 2 đến 9.');
    const minimum = Math.max(Number(config.minimum ?? 10 ** (minimumDigits - 1)), 10 ** (minimumDigits - 1));
    const maximum = Math.min(Number(config.maximum ?? (10 ** maximumDigits - 1)), 10 ** maximumDigits - 1);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 10 || maximum < minimum * 2) throw new Error('Phạm vi số chưa đủ để tạo bốn phép tính.');
    const selected = Array.isArray(config.operations) ? config.operations : OPERATIONS;
    if (selected.length !== 4 || new Set(selected).size !== 4 || !OPERATIONS.every(operation => selected.includes(operation))) throw new Error('Template này luôn cần đủ bốn phép cộng, trừ, nhân, chia.');

    const practiceRows = shuffle(OPERATIONS, random).map((operation, index) => {
        const pair = generatePair(operation, minimum, maximum, random);
        const blankIndex = randomInt(0, 2, random);
        const values = [pair.first, pair.second, pair.result];
        const display = `${blankIndex === 0 ? '___' : formatNumber(pair.first)} ${symbolFor(operation)} ${blankIndex === 1 ? '___' : formatNumber(pair.second)} = ${blankIndex === 2 ? '___' : formatNumber(pair.result)}`;
        return { label: String.fromCharCode(97 + index), kind: 'blank', operation, expression: display, answer: formatNumber(values[blankIndex]) };
    });
    const exercises = practiceRows.map(row => `${row.label}. ${row.expression}`).join('<br>');
    const prompt = config.prompt || `Hãy điền số thích hợp vào chỗ trống:<br>${exercises}`;
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '1. Ôn tập và bổ sung',
        type: 'Điền khuyết', templateId: 'number.four_operations_fill_blanks', q: prompt, options: [], ans: practiceRows.map(row => row.answer).join(', '),
        explanation: 'Bốn ý a–d dùng đủ phép cộng, trừ, nhân, chia. Mỗi ý đúng được 0,25 điểm.',
        practiceRows, partAnswerCounts: [1, 1, 1, 1],
        templateVariables: { question: prompt, exercises, practice_rows: exercises, blank: '___' }
    };
};
}));
