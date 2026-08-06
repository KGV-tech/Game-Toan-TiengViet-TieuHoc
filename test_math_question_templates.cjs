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

const firstVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(10));
const nextVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(11));
assert.notDeepEqual(firstVersion.options, nextVersion.options, 'Different sessions should receive new numbers.');

console.log('Math question templates generate valid, varied multiple-choice questions.');
