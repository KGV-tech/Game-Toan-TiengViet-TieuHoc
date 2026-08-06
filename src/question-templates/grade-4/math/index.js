const generateSmallestOfFour = require('./smallest-of-four');
const generateLargestOfFour = require('./largest-of-four');
const generateDigitAtPlace = require('./digit-at-place');

const generators = {
    'number.smallest_of_four': generateSmallestOfFour,
    'number.largest_of_four': generateLargestOfFour,
    'number.digit_at_place': generateDigitAtPlace
};

function generateQuestion(templateId, config = {}, random = Math.random) {
    const generator = generators[templateId];
    if (!generator) throw new Error(`Unknown Grade 4 Math template: ${templateId}`);
    return generator(config, random);
}

module.exports = { generateQuestion, templateIds: Object.keys(generators) };
