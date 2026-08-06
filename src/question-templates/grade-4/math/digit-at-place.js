const { randomInt, shuffle, formatNumber, createQuestion } = require('./shared');

const places = {
    ones: { divisor: 1, label: 'đơn vị' },
    tens: { divisor: 10, label: 'chục' },
    hundreds: { divisor: 100, label: 'trăm' },
    thousands: { divisor: 1000, label: 'nghìn' },
    tenThousands: { divisor: 10000, label: 'chục nghìn' }
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
    const place = allowedPlaces[randomInt(0, allowedPlaces.length - 1, random)];
    const targetDigit = allowedDigits[randomInt(0, allowedDigits.length - 1, random)];

    if (!places[place] || !Number.isInteger(targetDigit) || targetDigit < 0 || targetDigit > 9) {
        throw new Error('Invalid digit-at-place template configuration.');
    }

    const answer = randomNumberMatching(minimum, maximum, value => digitAt(value, place) === targetDigit, random);
    const distractors = new Set();
    while (distractors.size < 3) {
        distractors.add(randomNumberMatching(minimum, maximum, value => digitAt(value, place) !== targetDigit && value !== answer, random));
    }

    return createQuestion(
        'number.digit_at_place',
        `Số nào dưới đây có chữ số hàng ${places[place].label} là ${targetDigit}?`,
        shuffle([answer, ...distractors], random),
        answer,
        `Trong số ${formatNumber(answer)}, chữ số ở hàng ${places[place].label} là ${targetDigit}.`
    );
}

module.exports = generateDigitAtPlace;
