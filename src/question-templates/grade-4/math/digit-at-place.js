const { randomInt, shuffle, formatNumber, createQuestion } = require('./shared');

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
    const place = validPlaces[randomInt(0, validPlaces.length - 1, random)];
    const targetDigit = allowedDigits[randomInt(0, allowedDigits.length - 1, random)];

    if (!validPlaces.length || !Number.isInteger(targetDigit) || targetDigit < 0 || targetDigit > 9) {
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
