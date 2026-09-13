;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.place_value_true_false'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, configuredValues, chooseConfiguredValue, expandedTerms }) {

const DEFAULT_STATEMENT_KINDS = ['class', 'place'];
const STATEMENT_KINDS = ['class', 'place', 'comparison'];
const B01_STATEMENT_LAYOUT = 'b01-four-types';
const B01_LAYOUT_KINDS = ['place', 'number-number', 'number-expression', 'expression-expression'];
const COMPARISON_SIGNS = ['<', '>', '='];
const ORDER_SIGNS = ['<', '>'];
const places = [
    { divisor: 1, className: 'lớp đơn vị', placeName: 'hàng đơn vị' }, { divisor: 10, className: 'lớp đơn vị', placeName: 'hàng chục' }, { divisor: 100, className: 'lớp đơn vị', placeName: 'hàng trăm' },
    { divisor: 1000, className: 'lớp nghìn', placeName: 'hàng nghìn' }, { divisor: 10000, className: 'lớp nghìn', placeName: 'hàng chục nghìn' }, { divisor: 100000, className: 'lớp nghìn', placeName: 'hàng trăm nghìn' },
    { divisor: 1000000, className: 'lớp triệu', placeName: 'hàng triệu' }, { divisor: 10000000, className: 'lớp triệu', placeName: 'hàng chục triệu' }, { divisor: 100000000, className: 'lớp triệu', placeName: 'hàng trăm triệu' },
    { divisor: 1000000000, className: 'lớp tỷ', placeName: 'hàng tỷ' }, { divisor: 10000000000, className: 'lớp tỷ', placeName: 'hàng chục tỷ' }, { divisor: 100000000000, className: 'lớp tỷ', placeName: 'hàng trăm tỷ' }
];

function digitAt(value, divisor) {
    return Math.floor(value / divisor) % 10;
}

function hasDistinctDigits(value) {
    const digits = String(value).split('');
    return new Set(digits).size === digits.length;
}

function comparisonSign(leftValue, rightValue) {
    return leftValue === rightValue ? '=' : (leftValue > rightValue ? '>' : '<');
}

function incorrectComparisonSign(correctSign, random, allowedSigns = COMPARISON_SIGNS) {
    const choices = allowedSigns.filter(sign => sign !== correctSign);
    return choices[randomInt(0, choices.length - 1, random)];
}

function comparisonText(value) {
    return formatNumber(value);
}

function expressionText(value) {
    return expandedTerms(value).map(formatNumber).join(' + ');
}

function createExpressionOperand(minimum, maximum, random, excludedValues = []) {
    for (let attempt = 0; attempt < 10000; attempt++) {
        const value = randomInt(minimum, maximum, random);
        if (excludedValues.includes(value)) continue;
        const terms = expandedTerms(value);
        if (terms.length >= 2) {
            return { value, text: expressionText(value), comparisonKind: 'expression' };
        }
    }
    for (let value = minimum; value <= maximum; value++) {
        if (excludedValues.includes(value)) continue;
        const terms = expandedTerms(value);
        if (terms.length >= 2) {
            return { value, text: expressionText(value), comparisonKind: 'expression' };
        }
    }
    throw new Error('Phạm vi so sánh phải có ít nhất một số viết được dưới dạng tổng.');
}

function createDistinctNumberOperand(number, minimum, maximum, random) {
    for (let attempt = 0; attempt < 10000; attempt++) {
        const value = randomInt(minimum, maximum, random);
        if (value !== number) return { value, text: comparisonText(value), comparisonKind: 'number' };
    }
    const fallback = minimum === number ? minimum + 1 : minimum;
    if (fallback >= minimum && fallback <= maximum && fallback !== number) {
        return { value: fallback, text: comparisonText(fallback), comparisonKind: 'number' };
    }
    throw new Error('Phạm vi so sánh phải có ít nhất hai số khác nhau.');
}

function createComparisonOperand(number, minimum, maximum, random) {
    const requestedKind = randomInt(0, 1, random) === 0 ? 'number' : 'expression';
    for (let attempt = 0; attempt < 10000; attempt++) {
        const value = randomInt(minimum, maximum, random);
        if (requestedKind === 'number' && value !== number) {
            return { value, text: comparisonText(value), comparisonKind: 'number' };
        }
        if (requestedKind === 'expression') {
            const terms = expandedTerms(value);
            if (terms.length >= 2) {
                return { value, text: expressionText(value), comparisonKind: 'expression' };
            }
        }
    }

    for (let value = minimum; value <= maximum; value++) {
        if (value !== number) return { value, text: comparisonText(value), comparisonKind: 'number' };
    }
    throw new Error('Phạm vi so sánh phải có ít nhất hai số khác nhau.');
}

function createComparisonStatement(number, minimum, maximum, truthValue, index, random) {
    const operand = createComparisonOperand(number, minimum, maximum, random);
    const expressionOnLeft = randomInt(0, 1, random) === 0;
    const leftValue = expressionOnLeft ? operand.value : number;
    const rightValue = expressionOnLeft ? number : operand.value;
    const leftText = expressionOnLeft ? operand.text : formatNumber(number);
    const rightText = expressionOnLeft ? formatNumber(number) : operand.text;
    const correctSign = comparisonSign(leftValue, rightValue);
    const allowedSigns = leftValue === rightValue ? COMPARISON_SIGNS : ORDER_SIGNS;
    const operator = truthValue ? correctSign : incorrectComparisonSign(correctSign, random, allowedSigns);
    return {
        label: String.fromCharCode(65 + index),
        text: `${leftText} ${operator} ${rightText}`,
        answer: truthValue ? 'Đúng' : 'Sai',
        kind: 'comparison',
        comparisonKind: operand.comparisonKind,
        leftText,
        rightText,
        leftValue,
        rightValue,
        operator,
        layoutKind: operand.comparisonKind === 'number' ? 'number-number' : 'number-expression'
    };
}

function createComparisonStatementFromOperands(left, right, layoutKind, truthValue, index, random) {
    const correctSign = comparisonSign(left.value, right.value);
    const allowedSigns = left.value === right.value ? COMPARISON_SIGNS : ORDER_SIGNS;
    const operator = truthValue ? correctSign : incorrectComparisonSign(correctSign, random, allowedSigns);
    return {
        label: String.fromCharCode(65 + index),
        text: `${left.text} ${operator} ${right.text}`,
        answer: truthValue ? 'Đúng' : 'Sai',
        kind: 'comparison',
        comparisonKind: layoutKind,
        layoutKind,
        leftText: left.text,
        rightText: right.text,
        leftValue: left.value,
        rightValue: right.value,
        operator
    };
}

function createNumberNumberStatement(number, minimum, maximum, truthValue, index, random) {
    const other = createDistinctNumberOperand(number, minimum, maximum, random);
    const numberOperand = { value: number, text: comparisonText(number), comparisonKind: 'number' };
    return randomInt(0, 1, random) === 0
        ? createComparisonStatementFromOperands(numberOperand, other, 'number-number', truthValue, index, random)
        : createComparisonStatementFromOperands(other, numberOperand, 'number-number', truthValue, index, random);
}

function createNumberExpressionStatement(number, minimum, maximum, truthValue, index, random) {
    const numberOperand = { value: number, text: comparisonText(number), comparisonKind: 'number' };
    const expressionOperand = createExpressionOperand(minimum, maximum, random);
    return createComparisonStatementFromOperands(numberOperand, expressionOperand, 'number-expression', truthValue, index, random);
}

function createExpressionExpressionStatement(minimum, maximum, truthValue, index, random) {
    const left = createExpressionOperand(minimum, maximum, random);
    const right = createExpressionOperand(minimum, maximum, random, [left.value]);
    return createComparisonStatementFromOperands(left, right, 'expression-expression', truthValue, index, random);
}

function createPlaceStatement(number, availablePlaces, truthValue, index, random, forcedPlace) {
    const place = forcedPlace || availablePlaces[randomInt(0, availablePlaces.length - 1, random)];
    const digit = digitAt(number, place.divisor);
    const otherPlaces = availablePlaces.filter(item => item.divisor !== place.divisor);
    const placeName = truthValue
        ? place.placeName
        : otherPlaces[randomInt(0, otherPlaces.length - 1, random)].placeName;
    return {
        label: String.fromCharCode(65 + index),
        text: `Trong số ${formatNumber(number)}, chữ số ${digit} ở ${placeName}.`,
        answer: truthValue ? 'Đúng' : 'Sai',
        kind: 'place',
        layoutKind: 'place'
    };
}

function generatePlaceValueTrueFalse(config = {}, random = Math.random) {
    const useB01FourTypeLayout = config.statementLayout === B01_STATEMENT_LAYOUT;
    const configuredMinimum = config.minimum ?? (useB01FourTypeLayout ? 1001 : 10000000);
    const configuredMaximum = config.maximum ?? (useB01FourTypeLayout ? 99999 : 99999999);
    const minimum = useB01FourTypeLayout ? Math.max(1001, configuredMinimum) : configuredMinimum;
    const maximum = useB01FourTypeLayout ? Math.min(99999, configuredMaximum) : configuredMaximum;
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum < 0 || minimum >= maximum) throw new Error('Invalid place-value true/false configuration.');
    let number;
    for (let attempt = 0; attempt < 10000; attempt++) {
        const candidate = randomInt(minimum, maximum, random);
        if (hasDistinctDigits(candidate)) { number = candidate; break; }
    }
    if (number === undefined) throw new Error('Phạm vi số không đủ để sinh các chữ số không lặp.');
    const defaultStatementKinds = useB01FourTypeLayout ? ['place', 'comparison'] : DEFAULT_STATEMENT_KINDS;
    const statementKinds = configuredValues(
        config,
        'statementKinds',
        defaultStatementKinds,
        STATEMENT_KINDS,
        'Bài Đúng/Sai cần ít nhất một dạng phát biểu hợp lệ: hàng, lớp hoặc so sánh.'
    );
    if (useB01FourTypeLayout && !['place', 'comparison'].every(kind => statementKinds.includes(kind))) {
        throw new Error('Layout Bài 1 cần có cả nhận định hàng và nhận định so sánh.');
    }
    const selectedKind = useB01FourTypeLayout
        ? 'mixed'
        : chooseConfiguredValue(
            config,
            'statementKinds',
            defaultStatementKinds,
            STATEMENT_KINDS,
            random,
            'Bài Đúng/Sai cần ít nhất một dạng phát biểu hợp lệ: hàng, lớp hoặc so sánh.'
        );
    const availablePlaces = places.filter(place => place.divisor <= 10 ** (String(number).length - 1));
    if ((useB01FourTypeLayout || selectedKind !== 'comparison') && availablePlaces.length < 4) throw new Error('The configured range must contain at least four place values.');

    const truthValues = shuffle([true, true, false, false], random);
    const statements = useB01FourTypeLayout
        ? (() => {
            const place = shuffle(availablePlaces, random)[0];
            return [
                createPlaceStatement(number, availablePlaces, truthValues[0], 0, random, place),
                createNumberNumberStatement(number, minimum, maximum, truthValues[1], 1, random),
                createNumberExpressionStatement(number, minimum, maximum, truthValues[2], 2, random),
                createExpressionExpressionStatement(minimum, maximum, truthValues[3], 3, random)
            ];
        })()
        : selectedKind === 'comparison'
            ? truthValues.map((truthValue, index) => createComparisonStatement(number, minimum, maximum, truthValue, index, random))
        : shuffle(availablePlaces, random).slice(0, 4).map((place, index) => {
            const digit = digitAt(number, place.divisor);
            if (selectedKind === 'place') {
                const otherPlaces = availablePlaces.filter(item => item.divisor !== place.divisor);
                const placeName = truthValues[index] ? place.placeName : otherPlaces[randomInt(0, otherPlaces.length - 1, random)].placeName;
                return { label: String.fromCharCode(65 + index), text: `Trong số ${formatNumber(number)}, chữ số ${digit} ở ${placeName}.`, answer: truthValues[index] ? 'Đúng' : 'Sai', kind: selectedKind, layoutKind: selectedKind };
            }
            const otherClasses = [...new Set(availablePlaces.map(item => item.className))].filter(className => className !== place.className);
            const className = truthValues[index] ? place.className : otherClasses[randomInt(0, otherClasses.length - 1, random)];
            return { label: String.fromCharCode(65 + index), text: `Trong số ${formatNumber(number)}, chữ số ${digit} thuộc ${className}.`, answer: truthValues[index] ? 'Đúng' : 'Sai', kind: selectedKind, layoutKind: selectedKind };
        });
    const prompt = 'Chọn Đúng/Sai?';
    const explanation = useB01FourTypeLayout
        ? `Xác định hàng của chữ số, rồi tính và so sánh giá trị hai vế trước khi chọn Đúng hoặc Sai.`
        : selectedKind === 'place'
            ? `Xác định hàng của từng chữ số trong số ${formatNumber(number)} rồi chọn Đúng hoặc Sai.`
            : selectedKind === 'class'
                ? `Xác định lớp của từng chữ số trong số ${formatNumber(number)} rồi chọn Đúng hoặc Sai.`
                : 'Tính giá trị hai vế rồi kiểm tra dấu so sánh trước khi chọn Đúng hoặc Sai.';

    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số',
        type: 'Đúng/Sai', templateId: 'number.place_value_true_false', q: prompt, options: [],
        ans: statements.map(statement => statement.answer).join(', '), statements,
        explanation,
        templateVariables: {
            question: prompt,
            number: formatNumber(number),
            statements: statements.map(statement => `${statement.label}) ${statement.text}`).join('<br>'),
            statementKinds: statementKinds.join(', '),
            selectedKind,
            ...(useB01FourTypeLayout ? { statementLayout: B01_STATEMENT_LAYOUT, statementLayoutKinds: B01_LAYOUT_KINDS.join(', ') } : {}),
            comparisonKinds: [...new Set(statements.filter(statement => statement.kind === 'comparison').map(statement => statement.comparisonKind))].join(', ')
        }
    };
}

return generatePlaceValueTrueFalse;
}));
