;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.round_number'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, configuredValues, createFourPartMultipleChoiceQuestion }) {

const PLACE_VALUES = Object.freeze({
    tens: { label: 'hàng chục', value: 10 },
    hundreds: { label: 'hàng trăm', value: 100 },
    thousands: { label: 'hàng nghìn', value: 1000 },
    tenThousands: { label: 'hàng chục nghìn', value: 10000 }
});
const PLACE_KEYS = Object.keys(PLACE_VALUES);

function integerConfig(value, fallback, label) {
    const result = Number(value ?? fallback);
    if (!Number.isSafeInteger(result)) throw new Error(`${label} phải là số nguyên hợp lệ.`);
    return result;
}

function roundedValue(number, placeValue) {
    return Math.floor((number + placeValue / 2) / placeValue) * placeValue;
}

function numericChoices(correct, placeValue, random) {
    const values = [correct];
    const candidates = shuffle([
        correct - placeValue,
        correct + placeValue,
        correct - 2 * placeValue,
        correct + 2 * placeValue,
        correct - 5 * placeValue,
        correct + 5 * placeValue,
        correct - 10 * placeValue,
        correct + 10 * placeValue
    ], random);
    for (const candidate of candidates) {
        if (candidate > 0 && candidate <= 1000000000 && !values.includes(candidate)) values.push(candidate);
        if (values.length === 4) break;
    }
    for (let multiplier = 1; values.length < 4 && multiplier <= 100000; multiplier += 1) {
        const candidate = multiplier * placeValue;
        if (candidate > 0 && candidate <= 1000000000 && !values.includes(candidate)) values.push(candidate);
    }
    if (values.length < 4) throw new Error('Không đủ đáp án làm tròn khác 0.');
    return shuffle(values, random).map(formatNumber);
}

function numberWithPositiveRoundedValue(minimum, maximum, placeValue, random) {
    for (let attempt = 0; attempt < 1000; attempt += 1) {
        const number = randomInt(minimum, maximum, random);
        if (roundedValue(number, placeValue) > 0) return number;
    }
    const minimumPositive = Math.max(minimum, Math.floor(placeValue / 2));
    if (minimumPositive > maximum) throw new Error('Phạm vi làm tròn không tạo được kết quả dương.');
    return randomInt(minimumPositive, maximum, random);
}

function generateRoundNumber(config = {}, random = Math.random) {
    const minimum = integerConfig(config.minimum, 10, 'Số nhỏ nhất');
    const maximum = integerConfig(config.maximum, 99999, 'Số lớn nhất');
    if (minimum < 0 || minimum >= maximum || maximum - minimum + 1 < 4) {
        throw new Error('Phạm vi làm tròn phải có ít nhất bốn số nguyên khác nhau.');
    }
    const allowedPlaces = configuredValues(
        config,
        'allowedPlaces',
        PLACE_KEYS,
        PLACE_KEYS,
        'Hãy chọn ít nhất một hàng hợp lệ để làm tròn.'
    );
    const selectedPlaces = Array.from({ length: 4 }, (_, index) => allowedPlaces[index % allowedPlaces.length]);
    if (allowedPlaces.length >= 4) {
        const shuffledPlaces = shuffle(allowedPlaces, random);
        selectedPlaces.splice(0, selectedPlaces.length, ...shuffledPlaces.slice(0, 4));
    }

    const subquestions = selectedPlaces.map((placeKey, index) => {
        const place = PLACE_VALUES[placeKey];
        const number = numberWithPositiveRoundedValue(minimum, maximum, place.value, random);
        const roundedNumber = roundedValue(number, place.value);
        return {
            label: String.fromCharCode(97 + index),
            prompt: `Làm tròn số ${formatNumber(number)} đến ${place.label} được số nào?`,
            roundingPlace: placeKey,
            number,
            roundedNumber,
            options: numericChoices(roundedNumber, place.value, random),
            answer: formatNumber(roundedNumber),
            explanation: `Xét chữ số ngay bên phải ${place.label} để quyết định làm tròn số ${formatNumber(number)}.`
        };
    });
    const prompt = 'Hãy làm tròn số theo yêu cầu.';
    return createFourPartMultipleChoiceQuestion(
        'number.round_number',
        prompt,
        subquestions,
        'Xét chữ số ngay bên phải hàng cần làm tròn: từ 5 đến 9 thì tăng hàng đó một đơn vị, nhỏ hơn 5 thì giữ nguyên.',
        { question: prompt, allowedPlaces: allowedPlaces.join(', ') }
    );
}

return generateRoundNumber;
}));
