const assert = require('assert');
const { generateQuestion } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 0x100000000;
    };
}

function numericValue(text) {
    return Number(String(text).replace(/\s/g, ''));
}

function hasHundredsDigitEight(text) {
    return Math.floor(numericValue(text) / 100) % 10 === 8;
}

const smallest = generateQuestion('number.smallest_of_four', {}, seededRandom(1));
assert.equal(smallest.type, 'Trắc nghiệm');
assert.equal(smallest.subquestions.length, 4, 'The smallest-number template must generate four parts a–d.');
assert.deepEqual(smallest.subquestions.map(item => item.label), ['a', 'b', 'c', 'd']);
smallest.subquestions.forEach(item => {
    assert.equal(item.options.length, 4, 'Each smallest-number part must have four options.');
    assert.equal(item.prompt, '', 'The shared smallest-number instruction must not repeat in every part.');
    assert.equal(new Set(item.options).size, 4, 'Each smallest-number part must generate distinct options.');
    assert.equal(numericValue(item.answer), Math.min(...item.options.map(numericValue)));
});
assert.deepEqual(smallest.ans.split(', '), smallest.subquestions.map(item => item.answer));

const largest = generateQuestion('number.largest_of_four', {}, seededRandom(2));
assert.equal(largest.subquestions.length, 4, 'The largest-number template must generate four parts a–d.');
largest.subquestions.forEach(item => {
    assert.equal(item.options.length, 4, 'Each largest-number part must have four options.');
    assert.equal(item.prompt, '', 'The shared largest-number instruction must not repeat in every part.');
    assert.equal(new Set(item.options).size, 4, 'Each largest-number part must generate distinct options.');
    assert.equal(numericValue(item.answer), Math.max(...item.options.map(numericValue)));
});
assert.deepEqual(largest.ans.split(', '), largest.subquestions.map(item => item.answer));

const digitAtPlace = generateQuestion('number.digit_at_place', {
    maximum: 100000,
    allowedPlaces: ['tens'],
    allowedDigits: [2]
}, seededRandom(3));
assert.equal(digitAtPlace.subquestions.length, 4, 'The digit-at-place template must generate four parts a–d.');
digitAtPlace.subquestions.forEach(item => {
    assert.equal(Math.floor(numericValue(item.answer) / 10) % 10, 2, 'Each answer must have 2 in the tens place.');
    assert.equal(item.options.filter(option => Math.floor(numericValue(option) / 10) % 10 === 2).length, 1, 'Each part must have only one correct option.');
});

const randomizedPlaceAndDigit = generateQuestion('number.digit_at_place', {
    maximum: 100000,
    allowedPlaces: ['tens', 'hundreds'],
    allowedDigits: [2, 8]
}, seededRandom(4));
assert.equal(randomizedPlaceAndDigit.subquestions.length, 4);
randomizedPlaceAndDigit.subquestions.forEach(item => assert.match(item.prompt, /hàng (chục|trăm) là (2|8)/));

const hundredBillions = generateQuestion('number.digit_at_place', {
    minimum: 100000000000,
    maximum: 999999999999,
    allowedPlaces: ['hundredBillions'],
    allowedDigits: [2]
}, seededRandom(5));
hundredBillions.subquestions.forEach(item => assert.equal(Math.floor(numericValue(item.answer) / 100000000000) % 10, 2));

const composeNumber = generateQuestion('number.compose_from_places', { minimum: 10000, maximum: 99999 }, seededRandom(6));
assert.equal(composeNumber.type, 'Điền khuyết');
assert.equal((composeNumber.q.match(/___/g) || []).length, 4, 'The compose-number template must provide one blank in each part a–d.');
assert.equal(composeNumber.ans.split(', ').length, 4);
assert.match(composeNumber.templateVariables.place_values, /chục nghìn|nghìn/, 'The compose-number template must expose its generated place-value wording.');

const missingAddend = generateQuestion('number.missing_expanded_addend', { minimum: 10000, maximum: 99999 }, seededRandom(7));
assert.equal(missingAddend.type, 'Điền khuyết');
assert.equal((missingAddend.q.match(/___/g) || []).length, 4, 'The expanded-form template must hide one addend in each part a–d.');
assert.equal(missingAddend.ans.split(', ').length, 4);
assert.match(missingAddend.templateVariables.expression, /___/, 'The expanded-form template must expose the expression containing the blank.');

const neighbors = generateQuestion('number.neighbor_numbers', { minimum: 10000, maximum: 99999 }, seededRandom(8));
assert.equal(neighbors.type, 'Điền khuyết');
assert.equal(neighbors.ans.split(',').length, 8, 'The neighbor template must require both adjacent numbers in all four parts.');
assert.match(neighbors.templateVariables.neighbor_line, /___/, 'The neighbor template must expose a reusable blank-number line.');

const fourArithmeticBlanks = generateQuestion('number.four_arithmetic_blanks', {
    minimumDigits: 2,
    maximumDigits: 2,
    operations: ['+'],
    layouts: ['expressionLeft'],
    blankPositions: ['first', 'second', 'third']
}, seededRandom(81));
assert.equal(fourArithmeticBlanks.type, 'Điền khuyết');
assert.equal(fourArithmeticBlanks.subquestions.length, 4, 'The arithmetic-fill template must generate four subquestions.');
assert.deepEqual(fourArithmeticBlanks.subquestions.map(item => item.label), ['a', 'b', 'c', 'd']);
assert.equal((fourArithmeticBlanks.q.match(/___/g) || []).length, 4, 'Each subquestion must contain exactly one blank.');
assert.equal(fourArithmeticBlanks.ans.split(', ').length, 4, 'The four blanks must preserve their answer order.');
assert.match(fourArithmeticBlanks.q, /^Hãy điền số thích hợp vào chỗ trống:<br>a\./);
assert(fourArithmeticBlanks.subquestions.every(item => item.operation === '+'), 'The configured operation must be used.');
assert(fourArithmeticBlanks.subquestions.every(item => item.layout === 'expressionLeft'), 'The configured layout must be used.');
assert(fourArithmeticBlanks.subquestions.every(item => ['first', 'second', 'third'].includes(item.blankPosition)), 'The blank must be one of the three configured positions.');

const fourOperationsFillBlanks = generateQuestion('number.four_operations_fill_blanks', {
    minimumDigits: 2,
    maximumDigits: 3,
    operations: ['+', '-', '*', '/']
}, seededRandom(805));
assert.equal(fourOperationsFillBlanks.type, 'Điền khuyết');
assert.equal(fourOperationsFillBlanks.practiceRows.length, 4, 'The fill-in template must generate parts a–d.');
assert.deepEqual(fourOperationsFillBlanks.practiceRows.map(item => item.label), ['a', 'b', 'c', 'd']);
assert.deepEqual([...fourOperationsFillBlanks.practiceRows.map(item => item.operation)].sort(), ['*', '+', '-', '/'], 'Mỗi lượt phải có đủ bốn phép cộng, trừ, nhân, chia.');
assert(fourOperationsFillBlanks.practiceRows.every(item => /(^___|[+−×÷]\s+___|=\s+___)/.test(item.expression)), 'Mỗi ý điền khuyết phải bốc ô số thứ nhất, thứ hai hoặc kết quả.');
assert.equal((fourOperationsFillBlanks.q.match(/___/g) || []).length, 4, 'Each part must include one answer blank.');
assert.deepEqual(fourOperationsFillBlanks.partAnswerCounts, [1, 1, 1, 1], 'Each of the four parts must be worth 0.25 point.');

const fourOperationsExpressions = generateQuestion('number.four_operations_expressions', {
    minimumDigits: 2,
    maximumDigits: 3,
    operations: ['+', '-', '*', '/']
}, seededRandom(806));
assert.equal(fourOperationsExpressions.type, 'Điền khuyết');
assert.equal(fourOperationsExpressions.practiceRows.length, 4, 'The expression template must generate parts a–d.');
assert.deepEqual([...fourOperationsExpressions.practiceRows.map(item => item.operation)].sort(), ['*', '+', '-', '/'], 'Mỗi lượt phải có đủ bốn phép cộng, trừ, nhân, chia.');
assert(fourOperationsExpressions.practiceRows.every(item => (item.expression.match(/[+−×:]/g) || []).length >= 2), 'Mỗi ý tính giá trị biểu thức phải có ít nhất hai phép tính.');
assert.equal((fourOperationsExpressions.q.match(/___/g) || []).length, 4, 'Each expression must provide one answer blank.');
assert.deepEqual(fourOperationsExpressions.partAnswerCounts, [1, 1, 1, 1], 'Each expression part must be worth 0.25 point.');

const twoExpressionArithmetic = generateQuestion('number.four_arithmetic_blanks', {
    minimumDigits: 2,
    maximumDigits: 3,
    operations: ['-'],
    layouts: ['twoExpressions'],
    blankPositions: ['fourth']
}, seededRandom(82));
assert(twoExpressionArithmetic.subquestions.every(item => item.layout === 'twoExpressions'), 'Both-expression layout must be selectable.');
assert(twoExpressionArithmetic.subquestions.every(item => item.operation === '-'), 'Subtraction must be selectable.');
assert(twoExpressionArithmetic.subquestions.every(item => item.blankPosition === 'fourth'), 'Administrators must be able to pin the fourth blank position when both sides are expressions.');
assert(twoExpressionArithmetic.subquestions.every(item => item.display.endsWith('___')), 'The fourth operand must render as the blank in a two-expression equation.');
assert(twoExpressionArithmetic.subquestions.every(item => item.display.includes('−')), 'Subtraction questions must display a subtraction sign.');
assert.throws(() => generateQuestion('number.four_arithmetic_blanks', {
    minimumDigits: 2,
    maximumDigits: 2,
    operations: ['+'],
    layouts: ['expressionLeft'],
    blankPositions: ['fourth']
}, seededRandom(820)), /Số thứ tư/, 'The fourth blank position must require the two-expression layout.');

const multiplicationBlanks = generateQuestion('number.four_arithmetic_blanks', {
    minimumDigits: 2,
    maximumDigits: 4,
    operations: ['*'],
    layouts: ['expressionLeft'],
    blankPositions: ['third']
}, seededRandom(821));
assert(multiplicationBlanks.subquestions.every(item => item.operation === '*'), 'Multiplication must be selectable in the fill-in template.');
assert(multiplicationBlanks.subquestions.every(item => item.display.includes('×')), 'Multiplication must use the elementary-school multiplication symbol.');
assert(multiplicationBlanks.subquestions.every(item => item.values[0] * item.values[1] === item.values[2]), 'Every multiplication row must have an exact product.');

const twoExpressionMultiplication = generateQuestion('number.four_arithmetic_blanks', {
    minimumDigits: 2,
    maximumDigits: 4,
    operations: ['*'],
    layouts: ['twoExpressions'],
    blankPositions: ['fourth']
}, seededRandom(8211));
assert(twoExpressionMultiplication.subquestions.every(item => item.values[0] * item.values[1] === item.values[2] * item.values[3]), 'Both multiplication expressions must have the same value.');

const divisionBlanks = generateQuestion('number.four_arithmetic_blanks', {
    minimumDigits: 2,
    maximumDigits: 4,
    operations: ['/'],
    layouts: ['expressionRight'],
    blankPositions: ['second']
}, seededRandom(822));
assert(divisionBlanks.subquestions.every(item => item.operation === '/'), 'Division must be selectable in the fill-in template.');
assert(divisionBlanks.subquestions.every(item => item.display.includes('÷')), 'Division must use the elementary-school division symbol.');
assert(divisionBlanks.subquestions.every(item => item.values[0] / item.values[1] === item.values[2] && Number.isInteger(item.values[2])), 'Every division row must have an exact integer quotient.');

const twoExpressionDivision = generateQuestion('number.four_arithmetic_blanks', {
    minimumDigits: 2,
    maximumDigits: 4,
    operations: ['/'],
    layouts: ['twoExpressions'],
    blankPositions: ['fourth']
}, seededRandom(8221));
assert(twoExpressionDivision.subquestions.every(item => item.values[0] / item.values[1] === item.values[2] / item.values[3]), 'Both division expressions must have the same integer quotient.');

const fourArithmeticComparisons = generateQuestion('number.four_arithmetic_comparisons', {
    minimumDigits: 2,
    maximumDigits: 3,
    operations: ['+', '-'],
    layouts: ['expressionLeft', 'expressionRight', 'twoExpressions'],
    comparisons: ['=']
}, seededRandom(83));
assert.equal(fourArithmeticComparisons.type, 'Kéo thả');
assert.equal(fourArithmeticComparisons.comparisonRows.length, 4, 'The comparison template must generate four subquestions.');
assert.deepEqual(fourArithmeticComparisons.comparisonRows.map(item => item.label), ['a', 'b', 'c', 'd']);
assert.equal(fourArithmeticComparisons.ans.split(', ').length, 4, 'The four comparison slots must preserve their answer order.');
assert(fourArithmeticComparisons.comparisonRows.every(item => ['>', '<', '='].includes(item.answer)), 'Every comparison row must have a valid sign.');
assert.deepEqual([...new Set(fourArithmeticComparisons.comparisonRows.map(item => item.answer))].sort(), ['<', '=', '>'], 'Four comparison rows must always include all three comparison signs, regardless of stale configuration.');
assert(fourArithmeticComparisons.comparisonRows.every(item => ['+', '-'].includes(item.operation)), 'Each row must use an administrator-selected operation.');
assert.match(fourArithmeticComparisons.q, /^Điền dấu thích hợp:<br>a\./);

const divisionComparisons = generateQuestion('number.four_arithmetic_comparisons', {
    minimumDigits: 2,
    maximumDigits: 4,
    operations: ['/'],
    layouts: ['twoExpressions']
}, seededRandom(84));
assert(divisionComparisons.comparisonRows.every(item => item.operation === '/'), 'Division must be selectable in the drag-comparison template.');
assert(divisionComparisons.comparisonRows.every(item => item.leftText.includes('÷') && item.rightText.includes('÷')), 'Both comparison expressions must display exact division.');

const comparison = generateQuestion('number.compare_number_forms', { minimum: 10000, maximum: 99999 }, seededRandom(9));
assert.equal(comparison.type, 'Kéo thả');
assert.equal(comparison.comparisonRows.length, 4, 'The number-form comparison template must generate four parts a–d.');
assert.equal(comparison.ans.split(', ').length, 4);
assert(comparison.comparisonRows.every(row => ['>', '<', '='].includes(row.answer)), 'Each comparison part must use a valid comparison symbol.');
assert.equal((comparison.q.match(/___/g) || []).length, 4, 'The comparison template must contain one slot per part.');

const placeValueTrueFalse = generateQuestion('number.place_value_true_false', { minimum: 10000000, maximum: 99999999 }, seededRandom(10));
assert.equal(placeValueTrueFalse.type, 'Đúng/Sai');
assert.equal(placeValueTrueFalse.statements.length, 4, 'The place-value true/false template must generate four statements.');
assert.deepEqual(placeValueTrueFalse.statements.map(item => item.label), ['A', 'B', 'C', 'D']);
assert(placeValueTrueFalse.statements.every(item => ['Đúng', 'Sai'].includes(item.answer)), 'Each statement must have a true/false answer.');
const trueFalseDigits = placeValueTrueFalse.q.replace(/\D/g, '');
assert.equal(new Set(trueFalseDigits).size, trueFalseDigits.length, 'True/false numbers must not repeat a digit, so each stated digit has one unambiguous location.');
assert(placeValueTrueFalse.statements.every(item => trueFalseDigits.includes(item.text.match(/Chữ số (\d)/)[1])), 'Every stated digit must appear in the generated number.');
assert.deepEqual(placeValueTrueFalse.statements.map(item => item.kind), ['class', 'place', 'class', 'place'], 'The default true/false template must mix class and place statements.');
assert.match(placeValueTrueFalse.templateVariables.statements, /<br>/, 'The true/false template must expose its generated statements to administrators.');
assert.match(placeValueTrueFalse.q, /^Số /, 'The number must be the first line of the true/false template.');
assert.match(comparison.q, /<br>/, 'Comparison template prompts must separate the instruction from the expression.');

const safePassword = generateQuestion('number.safe_password_by_place_value', {}, seededRandom(11));
assert.equal(safePassword.type, 'Trắc nghiệm');
assert.equal(safePassword.subquestions.length, 4, 'The safe-password template must generate four parts a–d.');
assert(safePassword.subquestions.every(item => item.options.length === 4), 'Each safe-password part must have four options.');
assert.equal(safePassword.imageUrl, './src/assets/safe-password-3d-v3.png');
assert.doesNotMatch(safePassword.q, /Chọn câu trả lời đúng/i, 'The safe-password prompt must avoid redundant text.');
assert.equal(safePassword.codeLength, 9);
assert.equal(String(safePassword.passwordCode).length, 9, 'A nine-cell safe must display all nine password digits.');
assert.doesNotMatch(safePassword.q, /mật khẩu có \d+ chữ số/i, 'The question must not repeat the password length when the conditions are sufficient.');
const safePlaceValues = { ones: 1, tens: 10, hundreds: 100, thousands: 1000, tenThousands: 10000, hundredThousands: 100000, millions: 1000000, tenMillions: 10000000, hundredMillions: 100000000 };
const safeConditionDigit = condition => Number(condition.match(/khác (\d)/)[1]);
assert.equal(safePassword.subquestions[0].options.filter(option => {
    const value = numericValue(option);
    return Math.floor(value / safePlaceValues[safePassword.templateVariables.condition1Place]) % 10 !== safeConditionDigit(safePassword.templateVariables.condition1)
        && Math.floor(value / safePlaceValues[safePassword.templateVariables.condition2Place]) % 10 !== safeConditionDigit(safePassword.templateVariables.condition2);
}).length, 1, 'Only one option may satisfy both conditions in each safe-password part.');
assert.equal(numericValue(safePassword.subquestions[0].answer), numericValue(safePassword.subquestions[0].options.find(option => numericValue(option) === numericValue(safePassword.subquestions[0].answer))));

for (const codeLength of [2, 3, 6, 9]) {
    const generated = generateQuestion('number.safe_password_by_place_value', { minimumCodeLength: codeLength, maximumCodeLength: codeLength }, seededRandom(codeLength));
    assert.equal(generated.codeLength, codeLength, `The template must support ${codeLength} password cells.`);
    assert.equal(String(generated.passwordCode).length, codeLength, `The displayed password must fill all ${codeLength} cells.`);
    assert.doesNotMatch(generated.q, /mật khẩu có \d+ chữ số/i, 'The question must stay focused on the two place-value conditions.');
}
const variableLengthPassword = generateQuestion('number.safe_password_by_place_value', { minimumCodeLength: 2, maximumCodeLength: 9 }, seededRandom(99));
assert(variableLengthPassword.codeLength >= 2 && variableLengthPassword.codeLength <= 9, 'The generated password-cell count must stay within the configured range.');

const configurableSafePassword = generateQuestion('number.safe_password_by_place_value', {
    minimumCodeLength: 9,
    maximumCodeLength: 9,
    condition1Places: ['millions', 'hundredMillions'],
    condition1Digits: [0, 4],
    condition2Places: ['tenThousands', 'hundredThousands'],
    condition2Digits: [3, 7]
}, seededRandom(100));
assert.match(configurableSafePassword.templateVariables.condition1, /hàng (triệu|trăm triệu) khác (0|4)/, 'Condition 1 must use an administrator-selected place and digit.');
assert.match(configurableSafePassword.templateVariables.condition2, /hàng (chục nghìn|trăm nghìn) khác (3|7)/, 'Condition 2 must use an administrator-selected place and digit.');
assert.doesNotMatch(configurableSafePassword.q, /mật khẩu có \d+ chữ số/, 'The readable prompt must not repeat the dynamic password length.');
assert.notEqual(configurableSafePassword.templateVariables.condition1Place, configurableSafePassword.templateVariables.condition2Place, 'The two generated conditions must use different places whenever configuration permits it.');

const classAndPlaceSafePassword = generateQuestion('number.safe_password_by_place_value', {
    minimumCodeLength: 9,
    maximumCodeLength: 9,
    condition1Scope: 'class',
    condition1Classes: ['millionsClass'],
    condition1Digits: [0],
    condition2Scope: 'place',
    condition2Places: ['hundredThousands'],
    condition2Digits: [3]
}, seededRandom(101));
assert.match(classAndPlaceSafePassword.templateVariables.condition1, /^Lớp triệu không chứa chữ số 0$/, 'A class condition must name the class and apply to its three places.');
assert.match(classAndPlaceSafePassword.templateVariables.condition2, /^Chữ số ở hàng trăm nghìn khác 3$/, 'A place condition must name one specific place.');
const classAnswer = numericValue(classAndPlaceSafePassword.ans);
assert([1000000, 10000000, 100000000].every(place => Math.floor(classAnswer / place) % 10 !== 0), 'The class-million condition must check all three places in the class.');
assert.notEqual(Math.floor(classAnswer / 100000) % 10, 3, 'The hundred-thousands condition must check only its one place.');

const gradeOneSafePassword = generateQuestion('number.safe_password_by_place_value', {
    minimum: 0,
    maximum: 20,
    minimumCodeLength: 2,
    maximumCodeLength: 2,
    condition1Scope: 'random',
    condition1Classes: [],
    condition1Places: ['tens'],
    condition1Digits: [1],
    condition2Places: ['ones'],
    condition2Digits: [8]
}, seededRandom(202));
assert.match(gradeOneSafePassword.templateVariables.condition1, /^Chữ số ở hàng chục khác 1$/, 'Condition 1 must fall back to a configured random place when no class is selected.');
assert.match(gradeOneSafePassword.templateVariables.condition2, /^Chữ số ở hàng đơn vị khác 8$/, 'Condition 2 must always use its configured random place.');
assert(gradeOneSafePassword.options.every(option => /^\d{2}$/.test(option.replace(/\u00a0/g, '')) && Number(option.replace(/\u00a0/g, '')) <= 20), 'A configured 00–20 password range must retain two-digit display and never generate values outside the range.');

const matchingFiveFour = generateQuestion('number.match_number_words', { shapes: ['5:4'], digits: [7, 8, 9] }, seededRandom(12));
assert.equal(matchingFiveFour.type, 'Đối chiếu trùng khớp');
assert.equal(matchingFiveFour.options[0].split(', ').length, 5);
assert.equal(matchingFiveFour.options[1].split(', ').length, 4);
assert.equal(matchingFiveFour.ans.split(', ').length, 4);
const matchingFourThree = generateQuestion('number.match_number_words', { shapes: ['4:3'], digits: [7], digitWeights: { 7: 1 } }, seededRandom(13));
assert.equal(matchingFourThree.options[0].split(', ').length, 4);
assert.equal(matchingFourThree.options[1].split(', ').length, 3);
assert.deepEqual(
    generateQuestion('number.match_number_words', { shapes: ['5:4'], digits: [7], seed: 123 }, seededRandom(14)),
    generateQuestion('number.match_number_words', { shapes: ['5:4'], digits: [7], seed: 123 }, seededRandom(15)),
    'A configured seed must reproduce the same question.'
);
assert.throws(() => generateQuestion('number.match_number_words', { shapes: ['4:2'] }, seededRandom(16)));

const gradeFourNaturalSequence = generateQuestion('number.natural_sequence', {
    minimum: 10000,
    maximum: 9999999,
    allowedSteps: [-7000],
    sequenceLengthMin: 5,
    sequenceLengthMax: 5,
    blankCountMin: 2,
    blankCountMax: 2
}, seededRandom(17));
assert.equal(gradeFourNaturalSequence.type, 'Chuỗi Quy luật');
assert.equal(gradeFourNaturalSequence.topic, '3. Số có nhiều chữ số');
assert.equal(gradeFourNaturalSequence.sequence.length, 5, 'The configured sequence length must be respected.');
assert.equal(gradeFourNaturalSequence.blankIndexes.length, 2, 'The configured number of blanks must be respected.');
assert(gradeFourNaturalSequence.sequence.every(value => value >= 10000 && value <= 9999999), 'Every generated term must stay within the configured range.');
assert(gradeFourNaturalSequence.sequence.slice(1).every((value, index) => value - gradeFourNaturalSequence.sequence[index] === -7000), 'Every term must follow the selected fixed step.');
assert.equal((gradeFourNaturalSequence.q.match(/___/g) || []).length, 2, 'The question must expose every generated blank.');
assert.deepEqual(gradeFourNaturalSequence.ans.split(', ').map(numericValue), gradeFourNaturalSequence.blankIndexes.map(index => gradeFourNaturalSequence.sequence[index]), 'Answers must retain the left-to-right order of blanks.');

const lowerGradeNaturalSequence = generateQuestion('number.natural_sequence', {
    minimum: 10,
    maximum: 99,
    allowedSteps: [5, 6, 7, 8, 9],
    sequenceLengthMin: 7,
    sequenceLengthMax: 7,
    blankCountMin: 3,
    blankCountMax: 3
}, seededRandom(18));
assert.equal(lowerGradeNaturalSequence.sequence.length, 7, 'The same generator must support another grade range.');
assert([5, 6, 7, 8, 9].includes(lowerGradeNaturalSequence.step), 'The generator must only choose configured steps.');
assert(lowerGradeNaturalSequence.sequence.every(value => value >= 10 && value <= 99), 'A lower-grade configuration must remain in its declared range.');
assert.equal(lowerGradeNaturalSequence.blankIndexes.length, 3);
assert.throws(() => generateQuestion('number.natural_sequence', {
    minimum: 10,
    maximum: 99,
    allowedSteps: [5],
    sequenceLengthMin: 5,
    sequenceLengthMax: 5,
    blankCountMin: 4,
    blankCountMax: 4
}, seededRandom(19)), /ít nhất hai số đã biết/, 'The generator must leave enough visible terms to infer the rule.');

// Tests for Topic 2: Angle Templates
const polygonAngle = generateQuestion('g4-m-angle-count-in-polygon', {}, seededRandom(301));
assert.equal(polygonAngle.type, 'Điền khuyết');
assert.equal(polygonAngle.topic, '2. Góc và đơn vị đo góc');
assert(polygonAngle.q.includes('<svg'));
assert(polygonAngle.q.includes('a) ___ góc nhọn'));
assert(polygonAngle.q.includes('d) ___ góc bẹt'));
assert.equal(polygonAngle.ans.split(', ').length, 4);

const trapezoidWithHeight = generateQuestion('g4-m-angle-count-in-polygon', {}, () => 0.5);
assert.deepEqual(
    trapezoidWithHeight.ans.split(', ').map(Number),
    [1, 4, 1, 1],
    'Hình thang có đường cao BH phải tính hai góc vuông và một góc bẹt DHC tại H.'
);
assert.match(trapezoidWithHeight.explanation, /góc DHC tại H là góc bẹt/i);

const polygonAngleAlias = generateQuestion('angle.count_in_polygon', {}, seededRandom(302));
assert.equal(polygonAngleAlias.type, 'Điền khuyết');

const dragAngle = generateQuestion('g4-m-angle-drag-classify', {}, seededRandom(303));
assert.equal(dragAngle.type, 'Kéo thả');
assert.equal(dragAngle.topic, '2. Góc và đơn vị đo góc');
assert.deepEqual(dragAngle.options, ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt']);
assert(dragAngle.q.includes('<svg'));
assert.equal(dragAngle.ans.split(', ').length, 4);

const dragClock = generateQuestion('g4-m-angle-clock-classify', {}, seededRandom(304));
assert.equal(dragClock.type, 'Kéo thả');
assert.equal(dragClock.topic, '2. Góc và đơn vị đo góc');
assert.deepEqual(dragClock.options, ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt']);
assert(dragClock.q.includes('<svg'));
assert.equal(dragClock.ans.split(', ').length, 4);

const eightAngles = generateQuestion('g4-m-angle-count-eight-angles', {}, seededRandom(305));
assert.equal(eightAngles.type, 'Điền khuyết');
assert.equal(eightAngles.topic, '2. Góc và đơn vị đo góc');
assert(eightAngles.q.includes('<svg'));
assert(eightAngles.q.includes('• ___ góc nhọn;'));
assert(eightAngles.q.includes('• ___ góc bẹt.'));
const eightAnsNumbers = eightAngles.ans.split(', ').map(Number);
assert.equal(eightAnsNumbers.length, 4);
assert.equal(eightAnsNumbers.reduce((a, b) => a + b, 0), 8, 'Total angles must equal 8.');

const firstVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(10));
const nextVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(11));
assert.notDeepEqual(firstVersion.subquestions, nextVersion.subquestions, 'Different sessions should receive new numbers.');

console.log('Math question templates generate valid, varied multiple-choice questions.');
