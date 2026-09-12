;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {

const TOPIC = '1. Ôn tập và bổ sung';
const LABELS = ['a', 'b', 'c', 'd'];
const OPERATION_KEYS = ['add', 'subtract', 'multiply', 'divide'];
const OPERATION_SYMBOLS = { add: '+', subtract: '−', multiply: '×', divide: '÷' };

function ranges(config = {}) {
    const variableMinimum = Number(config.variableMinimum ?? 10);
    const variableMaximum = Number(config.variableMaximum ?? 99);
    const constantMinimum = Number(config.constantMinimum ?? 2);
    const constantMaximum = Number(config.constantMaximum ?? 9);
    if (!Number.isSafeInteger(variableMinimum) || !Number.isSafeInteger(variableMaximum) || variableMinimum < 1 || variableMinimum > variableMaximum) {
        throw new Error('Phạm vi giá trị của chữ a không hợp lệ.');
    }
    if (!Number.isSafeInteger(constantMinimum) || !Number.isSafeInteger(constantMaximum) || constantMinimum < 2 || constantMinimum > constantMaximum) {
        throw new Error('Phạm vi số trong biểu thức chứa chữ không hợp lệ.');
    }
    return { variableMinimum, variableMaximum, constantMinimum, constantMaximum };
}

function operations(config = {}) {
    const hasConfiguredOperations = Object.prototype.hasOwnProperty.call(config, 'operations');
    const values = hasConfiguredOperations
        ? (Array.isArray(config.operations) ? [...new Set(config.operations)] : [])
        : [...OPERATION_KEYS];
    if (!values.length || values.some(value => !OPERATION_KEYS.includes(value))) {
        throw new Error('Danh sách phép tính của Bài 4 chỉ nhận add, subtract, multiply hoặc divide.');
    }
    return values;
}

function chooseOperation(config, random) {
    const allowed = operations(config);
    return allowed[randomInt(0, allowed.length - 1, random)];
}

function safeRangesForDivision(variableMinimum, variableMaximum, constantMinimum, constantMaximum) {
    const divisors = [];
    for (let divisor = Math.max(2, constantMinimum); divisor <= Math.min(9, constantMaximum); divisor++) {
        const quotientMinimum = Math.ceil(variableMinimum / divisor);
        const quotientMaximum = Math.floor(variableMaximum / divisor);
        if (quotientMinimum <= quotientMaximum) divisors.push({ divisor, quotientMinimum, quotientMaximum });
    }
    return divisors;
}

function makeRow(operation, limits, random) {
    const { variableMinimum, variableMaximum, constantMinimum, constantMaximum } = limits;
    let variable;
    let constant;
    let expressionValue;
    if (operation === 'add') {
        variable = randomInt(variableMinimum, variableMaximum, random);
        constant = randomInt(constantMinimum, constantMaximum, random);
        expressionValue = variable + constant;
    } else if (operation === 'subtract') {
        const variableLowerBound = Math.max(variableMinimum, constantMinimum + 1);
        if (variableLowerBound > variableMaximum) throw new Error('Phạm vi Bài 4 không đủ để tạo phép trừ có kết quả không âm.');
        variable = randomInt(variableLowerBound, variableMaximum, random);
        constant = randomInt(constantMinimum, Math.min(constantMaximum, variable - 1), random);
        expressionValue = variable - constant;
    } else if (operation === 'multiply') {
        variable = randomInt(variableMinimum, variableMaximum, random);
        constant = randomInt(constantMinimum, constantMaximum, random);
        expressionValue = variable * constant;
    } else {
        const divisorRanges = safeRangesForDivision(variableMinimum, variableMaximum, constantMinimum, constantMaximum);
        if (!divisorRanges.length) throw new Error('Phạm vi Bài 4 không đủ để tạo phép chia hết.');
        const selected = divisorRanges[randomInt(0, divisorRanges.length - 1, random)];
        constant = selected.divisor;
        const quotient = randomInt(selected.quotientMinimum, selected.quotientMaximum, random);
        variable = quotient * constant;
        expressionValue = quotient;
    }
    const symbol = OPERATION_SYMBOLS[operation];
    const expression = `a ${symbol} ${formatNumber(constant)}`;
    const display = `Cho a = ${formatNumber(variable)}; ${expression} = ___`;
    return {
        operation, symbol, variable, constant, expression, expressionValue,
        answer: expressionValue, display,
        explanation: `Thay a = ${formatNumber(variable)} vào biểu thức: ${formatNumber(variable)} ${symbol} ${formatNumber(constant)} = ${formatNumber(expressionValue)}.`
    };
}

function numericOptions(correct, random) {
    const values = [correct];
    const candidates = shuffle([
        correct + 1, correct - 1, correct + 2, correct - 2,
        correct + 5, correct - 5, correct + 10, correct - 10,
        correct * 2, correct + 20
    ], random);
    for (const candidate of candidates) {
        if (Number.isSafeInteger(candidate) && candidate >= 0 && !values.includes(candidate)) values.push(candidate);
        if (values.length === 4) break;
    }
    for (let candidate = Math.max(0, correct + 21); values.length < 4; candidate++) {
        if (!values.includes(candidate)) values.push(candidate);
    }
    return shuffle(values.map(formatNumber), random);
}

function generateValue(config = {}, random = Math.random) {
    const limits = ranges(config);
    const allowedOperations = operations(config);
    const selectedOperation = chooseOperation(config, random);
    const rows = LABELS.map((label, index) => ({
        label,
        ...makeRow(selectedOperation, limits, random)
    }));
    const exercises = rows.map(row => `${row.label}) ${row.display}`).join('<br>');
    const prompt = `Tính giá trị của biểu thức chứa chữ (phép ${selectedOperation === 'add' ? 'cộng' : selectedOperation === 'subtract' ? 'trừ' : selectedOperation === 'multiply' ? 'nhân' : 'chia'}):<br>${exercises}`;
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC,
        type: 'Điền khuyết', templateId: 'number.variable_expression_value', q: prompt, options: [],
        ans: rows.map(row => formatNumber(row.answer)).join(', '),
        explanation: 'Thay cùng dạng phép tính với giá trị đã cho của a rồi tính từng biểu thức.',
        practiceRows: rows, partAnswerCounts: [1, 1, 1, 1],
        templateVariables: { question: prompt, exercises, operations: allowedOperations.join(', '), selectedOperation }
    };
}

function generateChoice(config = {}, random = Math.random) {
    const limits = ranges(config);
    const allowedOperations = operations(config);
    const selectedOperation = chooseOperation(config, random);
    const rows = LABELS.map((label, index) => {
        const row = makeRow(selectedOperation, limits, random);
        const answer = formatNumber(row.answer);
        return {
            ...row,
            label: LABELS[index], answer,
            expressionValue: row.expressionValue,
            prompt: `Cho a = ${formatNumber(row.variable)}. Giá trị của biểu thức ${row.expression} bằng bao nhiêu?`,
            options: numericOptions(row.expressionValue, random)
        };
    });
    const title = `Chọn giá trị đúng của biểu thức chứa chữ (phép ${selectedOperation === 'add' ? 'cộng' : selectedOperation === 'subtract' ? 'trừ' : selectedOperation === 'multiply' ? 'nhân' : 'chia'}):`;
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC,
        type: 'Trắc nghiệm', templateId: 'number.variable_expression_choice', q: title, options: [],
        ans: rows.map(row => row.answer).join(', '),
        explanation: 'Thay giá trị đã cho của a vào cùng dạng phép tính, sau đó tính để đối chiếu với các phương án.',
        subquestions: rows, partAnswerCounts: [1, 1, 1, 1],
        templateVariables: { question: title, operations: allowedOperations.join(', '), selectedOperation }
    };
}

return {
    'number.variable_expression_value': generateValue,
    'number.variable_expression_choice': generateChoice
};
}));
