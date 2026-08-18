;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.digit_at_place'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, createFourPartMultipleChoiceQuestion }) {

const places = {
    ones: { divisor: 1, label: 'đơn vị' },
    tens: { divisor: 10, label: 'chục' },
    hundreds: { divisor: 100, label: 'trăm' },
    thousands: { divisor: 1000, label: 'nghìn' },
    tenThousands: { divisor: 10000, label: 'chục nghìn' },
    hundredThousands: { divisor: 100000, label: 'trăm nghìn' },
    millions: { divisor: 1000000, label: 'triệu' },
    tenMillions: { divisor: 10000000, label: 'chục triệu' },
    hundredMillions: { divisor: 100000000, label: 'trăm triệu' },
    billions: { divisor: 1000000000, label: 'tỷ' },
    tenBillions: { divisor: 10000000000, label: 'chục tỷ' },
    hundredBillions: { divisor: 100000000000, label: 'trăm tỷ' }
};

function digitAt(value, place) {
    return Math.floor(value / places[place].divisor) % 10;
}

function randomNumberMatching(minimum, maximum, predicate, random) {
    for (let attempt = 0; attempt < 10000; attempt++) {
        const value = randomInt(minimum, maximum, random);
        if (predicate(value)) return value;
    }
    throw new Error('Template configuration cannot generate a valid number.');
}

function generateDigitAtPlace(config = {}, random = Math.random) {
    const maximum = config.maximum ?? 99999;
    const minimum = config.minimum ?? 10000;
    const allowedPlaces = config.allowedPlaces ?? Object.keys(places);
    const allowedDigits = config.allowedDigits ?? [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const validPlaces = allowedPlaces.filter(place => places[place] && places[place].divisor <= maximum);
    if (!validPlaces.length || !allowedDigits.every(digit => Number.isInteger(digit) && digit >= 0 && digit <= 9)) {
        throw new Error('Invalid digit-at-place template configuration.');
    }

    const subquestions = ['a', 'b', 'c', 'd'].map(label => {
        const place = validPlaces[randomInt(0, validPlaces.length - 1, random)];
        const targetDigit = allowedDigits[randomInt(0, allowedDigits.length - 1, random)];
        const answer = randomNumberMatching(minimum, maximum, value => digitAt(value, place) === targetDigit, random);
        const distractors = new Set();
        while (distractors.size < 3) {
            distractors.add(randomNumberMatching(minimum, maximum, value => digitAt(value, place) !== targetDigit && value !== answer, random));
        }
        return {
            label,
            prompt: `Số nào có chữ số hàng ${places[place].label} là ${targetDigit}?`,
            options: shuffle([answer, ...distractors], random).map(formatNumber),
            answer: formatNumber(answer),
            place: places[place].label,
            digit: String(targetDigit)
        };
    });

    return createFourPartMultipleChoiceQuestion(
        'number.digit_at_place',
        'Hãy chọn số phù hợp với mỗi yêu cầu sau.',
        subquestions,
        'Ở mỗi câu, xét đúng chữ số tại hàng được nêu để chọn đáp án.',
        { question: 'Hãy chọn số phù hợp với mỗi yêu cầu sau.' }
    );
}

return generateDigitAtPlace;
}));
