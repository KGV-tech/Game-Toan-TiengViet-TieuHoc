;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.safe_password_by_place_value'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, randomNumberMatching, createFourPartMultipleChoiceQuestion }) {

const PLACE_CHOICES = [
    ['ones', 1, 'hàng đơn vị'], ['tens', 10, 'hàng chục'], ['hundreds', 100, 'hàng trăm'],
    ['thousands', 1000, 'hàng nghìn'], ['tenThousands', 10000, 'hàng chục nghìn'], ['hundredThousands', 100000, 'hàng trăm nghìn'],
    ['millions', 1000000, 'hàng triệu'], ['tenMillions', 10000000, 'hàng chục triệu'], ['hundredMillions', 100000000, 'hàng trăm triệu'],
    ['billions', 1000000000, 'hàng tỷ'], ['tenBillions', 10000000000, 'hàng chục tỷ'], ['hundredBillions', 100000000000, 'hàng trăm tỷ']
];
const CLASS_CHOICES = [
    ['unitsClass', 'lớp đơn vị', [1, 10, 100]],
    ['thousandsClass', 'lớp nghìn', [1000, 10000, 100000]],
    ['millionsClass', 'lớp triệu', [1000000, 10000000, 100000000]],
    ['billionsClass', 'lớp tỷ', [1000000000, 10000000000, 100000000000]]
];
const SAFE_ILLUSTRATIONS = [
    './src/assets/safe-password-3d-v3.png',
    './src/assets/safe-password-classic-red-v1.png',
    './src/assets/safe-password-future-violet-v1.png',
    './src/assets/safe-password-mini-teal-v1.png'
];
const OPEN_SAFE_ILLUSTRATIONS = [
    './src/assets/safe-password-open-v1.png',
    './src/assets/safe-password-classic-red-open-v1.png',
    './src/assets/safe-password-future-violet-open-v1.png',
    './src/assets/safe-password-mini-teal-open-v1.png'
];

function digitAt(value, place) {
    return Math.floor(value / place) % 10;
}

function clampCodeLength(value) {
    return Math.max(2, Math.min(12, Number.isInteger(Number(value)) ? Number(value) : 9));
}

function validPlaces(codeLength) {
    const greatestPlace = 10 ** (codeLength - 1);
    return PLACE_CHOICES.filter(([, value]) => value <= greatestPlace);
}

function configuredValues(values, fallback) {
    const normalized = Array.isArray(values) ? values.map(Number).filter(value => Number.isInteger(value) && value >= 0 && value <= 9) : [];
    return normalized.length ? [...new Set(normalized)] : fallback;
}

function configuredPlaces(keys, available) {
    const normalized = Array.isArray(keys) ? keys.filter(key => available.some(([availableKey]) => availableKey === key)) : [];
    return normalized.length ? available.filter(([key]) => normalized.includes(key)) : available;
}

function configuredClasses(keys, available) {
    const normalized = Array.isArray(keys) ? keys.filter(key => available.some(([availableKey]) => availableKey === key)) : [];
    return normalized.length ? available.filter(([key]) => normalized.includes(key)) : available;
}

function choosePlaceCondition(config, index, available, random, previous) {
    const places = configuredPlaces(config[`condition${index}Places`], available);
    const digits = configuredValues(config[`condition${index}Digits`], index === 1 ? [0] : [3]);
    const alternativePlaces = places.filter(([key]) => key !== previous?.key);
    const [key, place, label] = alternativePlaces.length ? alternativePlaces[randomInt(0, alternativePlaces.length - 1, random)] : places[randomInt(0, places.length - 1, random)];
    const alternativeDigits = key === previous?.key ? digits.filter(digit => digit !== previous.digit) : digits;
    const digit = (alternativeDigits.length ? alternativeDigits : digits)[randomInt(0, (alternativeDigits.length ? alternativeDigits : digits).length - 1, random)];
    return { scope: 'place', key, places: [place], label, digit, text: `Chữ số ở ${label} khác ${digit}` };
}

function chooseClassCondition(config, index, codeLength, random, previous) {
    const greatestPlace = 10 ** (codeLength - 1);
    const available = CLASS_CHOICES.filter(([, , places]) => places.every(place => place <= greatestPlace));
    const classes = configuredClasses(config[`condition${index}Classes`], available);
    if (!classes.length) throw new Error('Độ dài mật khẩu chưa đủ để dùng điều kiện theo lớp đã chọn.');
    const alternativeClasses = classes.filter(([key]) => key !== previous?.key);
    const [key, label, places] = (alternativeClasses.length ? alternativeClasses : classes)[randomInt(0, (alternativeClasses.length ? alternativeClasses : classes).length - 1, random)];
    const digits = configuredValues(config[`condition${index}Digits`], index === 1 ? [0] : [3]);
    const digit = digits[randomInt(0, digits.length - 1, random)];
    return { scope: 'class', key, places, label, digit, text: `${label.charAt(0).toLocaleUpperCase('vi-VN') + label.slice(1)} không chứa chữ số ${digit}` };
}

function chooseCondition(config, index, codeLength, random, previous) {
    if (index === 2) return choosePlaceCondition(config, index, validPlaces(codeLength), random, previous);
    if (index === 1 && config.condition1Scope === 'random') {
        const availableClasses = CLASS_CHOICES.filter(([, , places]) => places.every(place => place <= 10 ** (codeLength - 1)));
        const classes = Array.isArray(config.condition1Classes)
            ? availableClasses.filter(([key]) => config.condition1Classes.includes(key))
            : availableClasses;
        const availablePlaces = validPlaces(codeLength);
        const places = Array.isArray(config.condition1Places)
            ? availablePlaces.filter(([key]) => config.condition1Places.includes(key))
            : availablePlaces;
        const choices = [
            ...classes.map(item => ({ type: 'class', item })),
            ...places.map(item => ({ type: 'place', item }))
        ];
        if (!choices.length) throw new Error('Điều kiện 1 cần chọn ít nhất một lớp hoặc một hàng phù hợp với phạm vi số.');
        const picked = choices[randomInt(0, choices.length - 1, random)];
        return picked.type === 'class'
            ? chooseClassCondition({ ...config, condition1Classes: [picked.item[0]] }, index, codeLength, random, previous)
            : choosePlaceCondition({ ...config, condition1Places: [picked.item[0]] }, index, validPlaces(codeLength), random, previous);
    }
    return config[`condition${index}Scope`] === 'class'
        ? chooseClassCondition(config, index, codeLength, random, previous)
        : choosePlaceCondition(config, index, validPlaces(codeLength), random, previous);
}

function rulesFor(config, codeLength, random) {
    const naturalMinimum = 10 ** (codeLength - 1);
    const naturalMaximum = 10 ** codeLength - 1;
    const hasCustomRange = Number.isFinite(Number(config.minimum)) && Number.isFinite(Number(config.maximum));
    const minimum = hasCustomRange ? Math.max(0, Number(config.minimum)) : naturalMinimum;
    const maximum = hasCustomRange ? Math.min(naturalMaximum, Number(config.maximum)) : naturalMaximum;
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum > maximum) throw new Error('Phạm vi mật khẩu không hợp lệ với số chữ số đã chọn.');
    const condition1 = chooseCondition(config, 1, codeLength, random);
    const condition2 = chooseCondition(config, 2, codeLength, random, condition1);
    return { minimum, maximum, condition1, condition2 };
}

function isSafePassword(value, rule) {
    return rule.condition1.places.every(place => digitAt(value, place) !== rule.condition1.digit)
        && rule.condition2.places.every(place => digitAt(value, place) !== rule.condition2.digit);
}

function formatPassword(value, codeLength) {
    return formatNumber(String(value).padStart(codeLength, '0'));
}

function generateSafePasswordRound(config, random) {
    const minimumCodeLength = clampCodeLength(config.minimumCodeLength ?? config.codeLength ?? 9);
    const maximumCodeLength = clampCodeLength(config.maximumCodeLength ?? config.codeLength ?? 9);
    if (minimumCodeLength > maximumCodeLength) throw new Error('Số chữ số ít nhất không được lớn hơn số chữ số nhiều nhất.');
    const codeLength = randomInt(minimumCodeLength, maximumCodeLength, random);
    const rule = rulesFor(config, codeLength, random);
    const correct = randomNumberMatching(rule.minimum, rule.maximum, value => isSafePassword(value, rule), random);
    const wrongCondition1 = randomNumberMatching(rule.minimum, rule.maximum, value => rule.condition1.places.some(place => digitAt(value, place) === rule.condition1.digit) && value !== correct, random);
    const wrongCondition2 = randomNumberMatching(rule.minimum, rule.maximum, value => rule.condition2.places.some(place => digitAt(value, place) === rule.condition2.digit) && value !== correct && value !== wrongCondition1, random);
    const wrongBoth = randomNumberMatching(rule.minimum, rule.maximum, value => !isSafePassword(value, rule) && value !== wrongCondition1 && value !== wrongCondition2 && value !== correct, random);
    const firstCondition = rule.condition1.text.charAt(0).toLocaleLowerCase('vi-VN') + rule.condition1.text.slice(1);
    const secondCondition = rule.condition2.text.charAt(0).toLocaleLowerCase('vi-VN') + rule.condition2.text.slice(1);
    const prompt = `Biết rằng ${firstCondition} và ${secondCondition}.`;
    return {
        prompt,
        passwordCode: correct,
        answer: formatPassword(correct, codeLength),
        options: shuffle([correct, wrongCondition1, wrongCondition2, wrongBoth], random).map(value => formatPassword(value, codeLength)),
        explanation: `Mật khẩu ${formatPassword(correct, codeLength)} thỏa cả hai điều kiện: ${rule.condition1.text}. ${rule.condition2.text}.`,
        codeLength,
        condition1: rule.condition1.text,
        condition2: rule.condition2.text,
        condition1Place: rule.condition1.scope === 'place' ? rule.condition1.key : null,
        condition2Place: rule.condition2.scope === 'place' ? rule.condition2.key : null,
        condition1Scope: rule.condition1.scope,
        condition2Scope: rule.condition2.scope
    };
}

function generateSafePassword(config = {}, random = Math.random) {
    const subquestions = ['a', 'b', 'c', 'd'].map((label, index) => {
        let lastError;
        for (let attempt = 0; attempt < 24; attempt++) {
            try {
                return { label, imageUrl: SAFE_ILLUSTRATIONS[index], openedImageUrl: OPEN_SAFE_ILLUSTRATIONS[index], ...generateSafePasswordRound(config, random) };
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError;
    });
    const prompt = 'Hãy chọn mật khẩu mở khóa két sắt đúng cho mỗi yêu cầu sau.';

    const question = createFourPartMultipleChoiceQuestion(
        'number.safe_password_by_place_value',
        prompt,
        subquestions,
        'Mỗi đáp án đúng phải thỏa đồng thời cả hai điều kiện của câu tương ứng.',
        { question: prompt, exercises: subquestions.map(item => `${item.label}) ${item.prompt}`).join('<br>'), condition1: subquestions[0].condition1, condition2: subquestions[0].condition2, codeLength: String(subquestions[0].codeLength), password_cells: String(subquestions[0].codeLength), condition1Place: subquestions[0].condition1Place, condition2Place: subquestions[0].condition2Place, condition1Scope: subquestions[0].condition1Scope, condition2Scope: subquestions[0].condition2Scope }
    );
    question.imageUrl = './src/assets/safe-password-3d-v3.png';
    question.codeLength = subquestions[0].codeLength;
    question.passwordCode = subquestions[0].passwordCode;
    return question;
}

return generateSafePassword;
}));
