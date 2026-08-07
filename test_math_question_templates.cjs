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
assert.equal(numericValue(smallest.ans), Math.min(...smallest.options.map(numericValue)));

const largest = generateQuestion('number.largest_of_four', {}, seededRandom(2));
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

const firstVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(10));
const nextVersion = generateQuestion('number.smallest_of_four', {}, seededRandom(11));
assert.notDeepEqual(firstVersion.options, nextVersion.options, 'Different sessions should receive new numbers.');

const matchingFiveFour = generateQuestion('number.match_number_words', {
    shapes: ['5:4'],
    digits: [7, 8, 9]
}, seededRandom(12));
assert.equal(matchingFiveFour.type, 'Đối chiếu trùng khớp');
assert.equal(matchingFiveFour.options.length, 2);
assert.equal(matchingFiveFour.options[0].split(', ').length, 5);
assert.equal(matchingFiveFour.options[1].split(', ').length, 4);
assert.equal(matchingFiveFour.ans.split(', ').length, 4);
for (const pair of matchingFiveFour.ans.split(', ')) {
    const [number, words] = pair.split(':');
    assert(matchingFiveFour.options[0].includes(number), 'Every answer number must appear on the left.');
    assert(matchingFiveFour.options[1].includes(words), 'Every answer reading must appear on the right.');
}

const matchingFourThree = generateQuestion('number.match_number_words', {
    shapes: ['4:3'],
    digits: [7]
}, seededRandom(13));
assert.equal(matchingFourThree.options[0].split(', ').length, 4);
assert.equal(matchingFourThree.options[1].split(', ').length, 3);
assert.equal(matchingFourThree.ans.split(', ').length, 3);
assert.doesNotThrow(() => generateQuestion('number.match_number_words', { shapes: ['3:4'], digits: [7], digitWeights: { 7: 1 } }, seededRandom(14)));
assert.deepEqual(
    generateQuestion('number.match_number_words', { shapes: ['5:4'], digits: [7], seed: 123 }, seededRandom(15)),
    generateQuestion('number.match_number_words', { shapes: ['5:4'], digits: [7], seed: 123 }, seededRandom(16)),
    'A configured seed must reproduce the same question.'
);
assert.throws(() => generateQuestion('number.match_number_words', { shapes: ['4:2'] }, seededRandom(14)));

console.log('Math question templates generate valid, varied multiple-choice questions.');
