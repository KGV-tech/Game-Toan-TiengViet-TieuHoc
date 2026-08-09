;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.four_arithmetic_comparisons'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, formatNumber }) {

const LAYOUTS = ['expressionLeft', 'expressionRight', 'twoExpressions'];

function choose(items, random) {
    return items[randomInt(0, items.length - 1, random)];
}

function generatePair(operation, minimum, maximum, random) {
    if (operation === '+') {
        const value = randomInt(minimum * 2, maximum, random);
        const first = randomInt(minimum, value - minimum, random);
        return { first, second: value - first, value };
    }
    const value = randomInt(minimum, maximum - minimum, random);
    const second = randomInt(minimum, maximum - value, random);
    return { first: value + second, second, value };
}

function expression(pair, operation) {
    return `${formatNumber(pair.first)} ${operation === '+' ? '+' : '−'} ${formatNumber(pair.second)}`;
}

function signFor(left, right) {
    return left === right ? '=' : (left > right ? '>' : '<');
}

function generateRow(label, operation, layout, requestedSign, minimum, maximum, random) {
    for (let attempt = 0; attempt < 100; attempt++) {
        const pair = generatePair(operation, minimum, maximum, random);
        const pairText = expression(pair, operation);
        let leftText;
        let rightText;
        let leftValue;
        let rightValue;

        if (layout === 'expressionLeft') {
            leftText = pairText;
            leftValue = pair.value;
            if (requestedSign === '=') rightValue = leftValue;
            if (requestedSign === '>') rightValue = leftValue > minimum ? randomInt(minimum, leftValue - 1, random) : null;
            if (requestedSign === '<') rightValue = leftValue < maximum ? randomInt(leftValue + 1, maximum, random) : null;
            if (rightValue === null) continue;
            rightText = formatNumber(rightValue);
        } else if (layout === 'expressionRight') {
            rightText = pairText;
            rightValue = pair.value;
            if (requestedSign === '=') leftValue = rightValue;
            if (requestedSign === '>') leftValue = rightValue < maximum ? randomInt(rightValue + 1, maximum, random) : null;
            if (requestedSign === '<') leftValue = rightValue > minimum ? randomInt(minimum, rightValue - 1, random) : null;
            if (leftValue === null) continue;
            leftText = formatNumber(leftValue);
        } else {
            const rightPair = requestedSign === '=' ? generatePair(operation, minimum, maximum, random) : generatePair(operation, minimum, maximum, random);
            leftValue = pair.value;
            rightValue = requestedSign === '=' ? leftValue : rightPair.value;
            if (requestedSign !== '=' && signFor(leftValue, rightValue) !== requestedSign) continue;
            if (requestedSign === '=') {
                const matchingPair = operation === '+'
                    ? (() => { const first = randomInt(minimum, leftValue - minimum, random); return { first, second: leftValue - first, value: leftValue }; })()
                    : (() => { const second = randomInt(minimum, maximum - leftValue, random); return { first: leftValue + second, second, value: leftValue }; })();
                rightText = expression(matchingPair, operation);
            } else {
                rightText = expression(rightPair, operation);
            }
            leftText = pairText;
        }

        const answer = signFor(leftValue, rightValue);
        if (answer === requestedSign) return { label, operation, layout, answer, leftText, rightText, display: `${leftText} ___ ${rightText}` };
    }
    throw new Error('Không thể tạo phép so sánh phù hợp với phạm vi đã chọn.');
}

function generateFourArithmeticComparisons(config = {}, random = Math.random) {
    const minimumDigits = Number(config.minimumDigits ?? 2);
    const maximumDigits = Number(config.maximumDigits ?? 9);
    if (!Number.isInteger(minimumDigits) || !Number.isInteger(maximumDigits) || minimumDigits < 2 || maximumDigits > 9 || minimumDigits > maximumDigits) throw new Error('Độ dài số phải là số nguyên từ 2 đến 9 chữ số.');
    const minimum = Math.max(Number(config.minimum ?? 10 ** (minimumDigits - 1)), 10 ** (minimumDigits - 1));
    const maximum = Math.min(Number(config.maximum ?? (10 ** maximumDigits - 1)), 10 ** maximumDigits - 1);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 10 || maximum < minimum * 2) throw new Error('Phạm vi số chưa đủ để tạo phép so sánh.');
    const operations = (Array.isArray(config.operations) ? config.operations : ['+', '-']).filter(item => item === '+' || item === '-');
    const layouts = (Array.isArray(config.layouts) ? config.layouts : LAYOUTS).filter(item => LAYOUTS.includes(item));
    const comparisons = (Array.isArray(config.comparisons) ? config.comparisons : ['>', '<', '=']).filter(item => ['>', '<', '='].includes(item));
    if (!operations.length || !layouts.length || !comparisons.length) throw new Error('Hãy chọn ít nhất một phép tính, dạng hai vế và dấu so sánh.');

    const comparisonRows = ['a', 'b', 'c', 'd'].map(label => generateRow(label, choose(operations, random), choose(layouts, random), choose(comparisons, random), minimum, maximum, random));
    const exercises = comparisonRows.map(row => `${row.label}. ${row.display}`).join('<br>');
    const prompt = `Điền dấu thích hợp:<br>${exercises}`;
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số',
        type: 'Kéo thả', templateId: 'number.four_arithmetic_comparisons', q: prompt, options: ['>', '<', '='],
        ans: comparisonRows.map(row => row.answer).join(', '), comparisonRows,
        explanation: 'Tính giá trị hai vế của từng dòng rồi kéo dấu so sánh thích hợp vào vòng tròn.',
        templateVariables: { question: prompt, exercises, comparison_rows: exercises, blank: '___' }
    };
}

return generateFourArithmeticComparisons;
}));
