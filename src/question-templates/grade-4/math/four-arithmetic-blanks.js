;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.four_arithmetic_blanks'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, formatNumber, createFillBlankQuestion }) {

const LAYOUTS = ['expressionLeft', 'expressionRight', 'twoExpressions'];
const BLANK_POSITIONS = ['first', 'second', 'third', 'fourth'];
const OPERATIONS = ['+', '-', '*', '/'];

function choose(items, random) {
    return items[randomInt(0, items.length - 1, random)];
}

function generatePair(operation, minimum, maximum, random) {
    if (operation === '+') {
        const total = randomInt(minimum * 2, maximum, random);
        const first = randomInt(minimum, total - minimum, random);
        return [first, total - first, total];
    }
    if (operation === '-') {
        const difference = randomInt(minimum, maximum - minimum, random);
        const second = randomInt(minimum, maximum - difference, random);
        return [difference + second, second, difference];
    }
    if (operation === '*') {
        const multiplier = randomInt(2, 9, random);
        const maximumFirst = Math.floor(maximum / multiplier);
        if (maximumFirst < minimum) throw new Error('Phạm vi số chưa đủ để tạo phép nhân.');
        const first = randomInt(minimum, maximumFirst, random);
        return [first, multiplier, first * multiplier];
    }
    const divisor = randomInt(2, 9, random);
    const maximumQuotient = Math.floor(maximum / divisor);
    if (maximumQuotient < minimum) throw new Error('Phạm vi số chưa đủ để tạo phép chia.');
    const quotient = randomInt(minimum, maximumQuotient, random);
    return [quotient * divisor, divisor, quotient];
}

function symbolFor(operation) {
    return operation === '*' ? '×' : (operation === '/' ? '÷' : (operation === '+' ? '+' : '−'));
}

function generateEquivalentPair(operation, target, minimum, maximum, random) {
    if (operation === '+') {
        const first = randomInt(minimum, target - minimum, random);
        return [first, target - first];
    }
    if (operation === '-') {
        const second = randomInt(minimum, maximum - target, random);
        return [target + second, second];
    }
    if (operation === '*') {
        const divisors = Array.from({ length: 8 }, (_, index) => index + 2).filter(divisor => target % divisor === 0 && target / divisor >= minimum && target / divisor <= maximum);
        const divisor = choose(divisors, random);
        return [target / divisor, divisor];
    }
    const divisors = Array.from({ length: 8 }, (_, index) => index + 2).filter(divisor => target * divisor <= maximum);
    const divisor = choose(divisors, random);
    return [target * divisor, divisor];
}

function displayValue(value, isBlank) {
    return isBlank ? '___' : formatNumber(value);
}

function generateArithmeticLine(label, operation, layout, blankPosition, minimum, maximum, random) {
    const symbol = symbolFor(operation);
    const blankIndex = BLANK_POSITIONS.indexOf(blankPosition);
    const [first, second, result] = generatePair(operation, minimum, maximum, random);

    if (layout === 'twoExpressions') {
        const target = result;
        const rightPair = generateEquivalentPair(operation, target, minimum, maximum, random);
        const values = [first, second, rightPair[0], rightPair[1]];
        const display = `${displayValue(values[0], blankIndex === 0)} ${symbol} ${displayValue(values[1], blankIndex === 1)} = ${displayValue(values[2], blankIndex === 2)} ${symbol} ${displayValue(values[3], blankIndex === 3)}`;
        return { label, operation, layout, blankPosition, answer: values[blankIndex], display, values };
    }

    const values = [first, second, result];
    const left = `${displayValue(values[0], blankIndex === 0)} ${symbol} ${displayValue(values[1], blankIndex === 1)}`;
    const right = displayValue(values[2], blankIndex === 2);
    const display = layout === 'expressionRight' ? `${right} = ${left}` : `${left} = ${right}`;
    return { label, operation, layout, blankPosition, answer: values[blankIndex], display, values };
}

function generateFourArithmeticBlanks(config = {}, random = Math.random) {
    const minimumDigits = Number(config.minimumDigits ?? 2);
    const maximumDigits = Number(config.maximumDigits ?? 9);
    if (!Number.isInteger(minimumDigits) || !Number.isInteger(maximumDigits) || minimumDigits < 2 || maximumDigits > 9 || minimumDigits > maximumDigits) {
        throw new Error('Độ dài số phải là số nguyên từ 2 đến 9 chữ số.');
    }
    const minimum = Math.max(Number(config.minimum ?? 10 ** (minimumDigits - 1)), 10 ** (minimumDigits - 1));
    const maximum = Math.min(Number(config.maximum ?? (10 ** maximumDigits - 1)), 10 ** maximumDigits - 1);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 10 || maximum < minimum * 2) {
        throw new Error('Phạm vi số chưa đủ để tạo phép tính với các số có ít nhất hai chữ số.');
    }
    const operations = (Array.isArray(config.operations) ? config.operations : OPERATIONS).filter(item => OPERATIONS.includes(item));
    const layouts = (Array.isArray(config.layouts) ? config.layouts : LAYOUTS).filter(item => LAYOUTS.includes(item));
    const blankPositions = (Array.isArray(config.blankPositions) ? config.blankPositions : BLANK_POSITIONS).filter(item => BLANK_POSITIONS.includes(item));
    if (!operations.length || !layouts.length || !blankPositions.length) throw new Error('Hãy chọn ít nhất một phép tính, dạng hai vế và vị trí ô trống.');

    const compatibleLayouts = layouts.filter(layout => layout === 'twoExpressions' || blankPositions.some(position => position !== 'fourth'));
    if (!compatibleLayouts.length) throw new Error('Vị trí “Số thứ tư” chỉ dùng khi chọn dạng “Hai vế đều là phép tính”.');

    const subquestions = ['a', 'b', 'c', 'd'].map(label => {
        const layout = choose(compatibleLayouts, random);
        const compatibleBlankPositions = layout === 'twoExpressions'
            ? blankPositions
            : blankPositions.filter(position => position !== 'fourth');
        return generateArithmeticLine(
            label,
            choose(operations, random),
            layout,
            choose(compatibleBlankPositions, random),
            minimum,
            maximum,
            random
        );
    });
    const exercises = subquestions.map(item => `${item.label}. ${item.display}`).join('<br>');
    const prompt = `Hãy điền số thích hợp vào chỗ trống:<br>${exercises}`;

    const question = createFillBlankQuestion(
        'number.four_arithmetic_blanks',
        prompt,
        subquestions.map(item => item.answer),
        'Tính từng phép tính rồi điền số còn thiếu vào mỗi dòng a, b, c, d.',
        { question: prompt, exercises, blank: '___', subquestions: exercises }
    );
    question.subquestions = subquestions;
    return question;
}

return generateFourArithmeticBlanks;
}));
