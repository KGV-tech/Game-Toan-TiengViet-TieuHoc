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
assert.equal(smallest.options.length, 4);
assert.equal(new Set(smallest.options).size, 4, 'The smallest-number template must generate four distinct options.');
assert.equal(numericValue(smallest.ans), Math.min(...smallest.options.map(numericValue)));

const largest = generateQuestion('number.largest_of_four', {}, seededRandom(2));
assert.equal(largest.options.length, 4);
assert.equal(new Set(largest.options).size, 4, 'The largest-number template must generate four distinct options.');
assert.equal(numericValue(largest.ans), Math.max(...largest.options.map(numericValue)));

const digitAtPlace = generateQuestion('number.digit_at_place', {
    maximum: 100000,
    allowedPlaces: ['tens'],
    allowedDigits: [2]
}, seededRandom(3));
assert.equal(Math.floor(numericValue(digitAtPlace.ans) / 10) % 10, 2, 'The answer must have 2 in the tens place.');
assert.equal(digitAtPlace.options.filter(option => Math.floor(numericValue(option) / 10) % 10 === 2).length, 1, 'Only one option may be correct.');

const randomizedPlaceAndDigit = generateQuestion('number.digit_at_place', {
    maximum: 100000,
    allowedPlaces: ['tens', 'hundreds'],
    allowedDigits: [2, 8]
}, seededRandom(4));
assert.match(randomizedPlaceAndDigit.q, /hàng (chục|trăm) là (2|8)/);

const hundredBillions = generateQuestion('number.digit_at_place', {
    minimum: 100000000000,
    maximum: 999999999999,
    allowedPlaces: ['hundredBillions'],
    allowedDigits: [2]
}, seededRandom(5));
assert.equal(Math.floor(numericValue(hundredBillions.ans) / 100000000000) % 10, 2);

const composeNumber = generateQuestion('number.compose_from_places', { minimum: 10000, maximum: 99999 }, seededRandom(6));
assert.equal(composeNumber.type, 'Điền khuyết');
assert.match(composeNumber.q, /___/, 'The compose-number template must provide an input blank.');
assert.equal(numericValue(composeNumber.ans), composeNumber.templateVariables.number);
assert.match(composeNumber.templateVariables.place_values, /chục nghìn|nghìn/, 'The compose-number template must expose its generated place-value wording.');

const missingAddend = generateQuestion('number.missing_expanded_addend', { minimum: 10000, maximum: 99999 }, seededRandom(7));
assert.equal(missingAddend.type, 'Điền khuyết');
assert.match(missingAddend.q, /___/, 'The expanded-form template must hide exactly one addend.');
assert.equal(numericValue(missingAddend.templateVariables.number), missingAddend.templateVariables.expanded.split('+').reduce((sum, term) => sum + numericValue(term), 0));
assert.match(missingAddend.templateVariables.expression, /___/, 'The expanded-form template must expose the expression containing the blank.');

const neighbors = generateQuestion('number.neighbor_numbers', { minimum: 10000, maximum: 99999 }, seededRandom(8));
assert.equal(neighbors.type, 'Điền khuyết');
assert.equal(neighbors.ans.split(',').length, 2, 'The neighbor template must require both adjacent numbers.');
assert.match(neighbors.templateVariables.neighbor_line, /___/, 'The neighbor template must expose a reusable blank-number line.');

const comparison = generateQuestion('number.compare_number_forms', { minimum: 10000, maximum: 99999 }, seededRandom(9));
assert.equal(comparison.type, 'So sánh');
assert(['>', '<', '='].includes(comparison.ans), 'The comparison template must use a comparison symbol as its answer.');
assert.match(comparison.q, /___/, 'The comparison template must contain a comparison slot.');
assert.match(comparison.templateVariables.comparison, /___/, 'The comparison template must expose a reusable comparison expression.');

const firstVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(10));
const nextVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(11));
assert.notDeepEqual(firstVersion.options, nextVersion.options, 'Different sessions should receive new numbers.');

console.log('Math question templates generate valid, varied multiple-choice questions.');
