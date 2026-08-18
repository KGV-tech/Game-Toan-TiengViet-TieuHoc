;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.four_operations_expressions'] = generate;
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

function generateExpression(operation, minimum, maximum, random) {
    if (operation === '+') {
        const first = randomInt(minimum, Math.floor(maximum / 3), random);
        const second = randomInt(minimum, Math.floor((maximum - first) / 2), random);
        const third = randomInt(minimum, maximum - first - second, random);
        return { expression: `${formatNumber(first)} + ${formatNumber(second)} + ${formatNumber(third)} = ___`, answer: formatNumber(first + second + third) };
    }
    if (operation === '-') {
        const middle = randomInt(minimum + 1, maximum, random);
        const last = randomInt(minimum, middle - 1, random);
        const inside = middle - last;
        const first = randomInt(Math.max(minimum, inside + 1), maximum, random);
        return { expression: `${formatNumber(first)} − (${formatNumber(middle)} − ${formatNumber(last)}) = ___`, answer: formatNumber(first - inside) };
    }
    if (operation === '*') {
        const divisor = randomInt(2, 9, random);
        const factor = randomInt(2, 9, random);
        const first = randomInt(minimum, Math.floor(maximum / factor), random);
        return { expression: `${formatNumber(first)} × ${formatNumber(divisor * factor)} : ${formatNumber(divisor)} = ___`, answer: formatNumber(first * factor) };
    }
    const divisor = randomInt(2, 9, random);
    const quotient = randomInt(minimum, Math.floor(maximum / divisor), random);
    const addend = randomInt(1, 9, random);
    return { expression: `${formatNumber(quotient * divisor)} : ${formatNumber(divisor)} + ${formatNumber(addend)} = ___`, answer: formatNumber(quotient + addend) };
}

return function generateFourOperationsExpressions(config = {}, random = Math.random) {
    const minimumDigits = Number(config.minimumDigits ?? 2);
    const maximumDigits = Number(config.maximumDigits ?? 5);
    if (!Number.isInteger(minimumDigits) || !Number.isInteger(maximumDigits) || minimumDigits < 2 || maximumDigits > 9 || minimumDigits > maximumDigits) throw new Error('Số lượng chữ số phải là số nguyên từ 2 đến 9.');
    const minimum = Math.max(Number(config.minimum ?? 10 ** (minimumDigits - 1)), 10 ** (minimumDigits - 1));
    const maximum = Math.min(Number(config.maximum ?? (10 ** maximumDigits - 1)), 10 ** maximumDigits - 1);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 10 || maximum < minimum * 2) throw new Error('Phạm vi số chưa đủ để tạo biểu thức.');
    const selected = Array.isArray(config.operations) ? config.operations : OPERATIONS;
    if (selected.length !== 4 || new Set(selected).size !== 4 || !OPERATIONS.every(operation => selected.includes(operation))) throw new Error('Template này luôn cần đủ bốn phép cộng, trừ, nhân, chia.');

    const practiceRows = shuffle(OPERATIONS, random).map((operation, index) => {
        const generated = generateExpression(operation, minimum, maximum, random);
        return { label: String.fromCharCode(97 + index), kind: 'expression', operation, ...generated };
    });
    const exercises = practiceRows.map(row => `${row.label}. ${row.expression}`).join('<br>');
    const prompt = config.prompt || `Tính giá trị của biểu thức:<br>${exercises}`;
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '1. Ôn tập và bổ sung',
        type: 'Điền khuyết', templateId: 'number.four_operations_expressions', q: prompt, options: [], ans: practiceRows.map(row => row.answer).join(', '),
        explanation: 'Bốn ý a–d dùng đủ phép cộng, trừ, nhân, chia; biểu thức có nhiều bước và ngoặc khi cần. Mỗi ý đúng được 0,25 điểm.',
        practiceRows, partAnswerCounts: [1, 1, 1, 1],
        templateVariables: { question: prompt, exercises, practice_rows: exercises, blank: '___' }
    };
};
}));
