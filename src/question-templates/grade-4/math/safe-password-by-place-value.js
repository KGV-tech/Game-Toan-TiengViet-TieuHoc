;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.safe_password_by_place_value'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, randomNumberMatching }) {

const PLACE_CHOICES = [
    ['ones', 1, 'hàng đơn vị'], ['tens', 10, 'hàng chục'], ['hundreds', 100, 'hàng trăm'],
    ['thousands', 1000, 'hàng nghìn'], ['tenThousands', 10000, 'hàng chục nghìn'], ['hundredThousands', 100000, 'hàng trăm nghìn'],
    ['millions', 1000000, 'hàng triệu'], ['tenMillions', 10000000, 'hàng chục triệu'], ['hundredMillions', 100000000, 'hàng trăm triệu']
];

function digitAt(value, place) {
    return Math.floor(value / place) % 10;
}

function clampCodeLength(value) {
    return Math.max(2, Math.min(9, Number.isInteger(Number(value)) ? Number(value) : 9));
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

function chooseCondition(config, index, available, random, previous) {
    const places = configuredPlaces(config[`condition${index}Places`], available);
    const digits = configuredValues(config[`condition${index}Digits`], index === 1 ? [0] : [3]);
    const alternativePlaces = places.filter(([key]) => key !== previous?.key);
    const [key, place, label] = alternativePlaces.length ? alternativePlaces[randomInt(0, alternativePlaces.length - 1, random)] : places[randomInt(0, places.length - 1, random)];
    const alternativeDigits = key === previous?.key ? digits.filter(digit => digit !== previous.digit) : digits;
    const digit = (alternativeDigits.length ? alternativeDigits : digits)[randomInt(0, (alternativeDigits.length ? alternativeDigits : digits).length - 1, random)];
    return { key, place, label, digit, text: `Chữ số ở ${label} khác ${digit}` };
}

function rulesFor(config, codeLength, random) {
    const minimum = 10 ** (codeLength - 1);
    const maximum = 10 ** codeLength - 1;
    const available = validPlaces(codeLength);
    const condition1 = chooseCondition(config, 1, available, random);
    const condition2 = chooseCondition(config, 2, available, random, condition1);
    return { minimum, maximum, condition1, condition2 };
}

function isSafePassword(value, rule) {
    return digitAt(value, rule.condition1.place) !== rule.condition1.digit && digitAt(value, rule.condition2.place) !== rule.condition2.digit;
}

function generateSafePassword(config = {}, random = Math.random) {
    const minimumCodeLength = clampCodeLength(config.minimumCodeLength ?? config.codeLength ?? 9);
    const maximumCodeLength = clampCodeLength(config.maximumCodeLength ?? config.codeLength ?? 9);
    if (minimumCodeLength > maximumCodeLength) throw new Error('Số chữ số ít nhất không được lớn hơn số chữ số nhiều nhất.');
    const codeLength = randomInt(minimumCodeLength, maximumCodeLength, random);
    const rule = rulesFor(config, codeLength, random);
    const correct = randomNumberMatching(rule.minimum, rule.maximum, value => isSafePassword(value, rule), random);
    const wrongCondition1 = randomNumberMatching(rule.minimum, rule.maximum, value => digitAt(value, rule.condition1.place) === rule.condition1.digit && value !== correct, random);
    const wrongCondition2 = randomNumberMatching(rule.minimum, rule.maximum, value => digitAt(value, rule.condition2.place) === rule.condition2.digit && value !== correct && value !== wrongCondition1, random);
    const wrongBoth = randomNumberMatching(rule.minimum, rule.maximum, value => !isSafePassword(value, rule) && value !== wrongCondition1 && value !== wrongCondition2 && value !== correct, random);
    const firstCondition = rule.condition1.text.charAt(0).toLocaleLowerCase('vi-VN') + rule.condition1.text.slice(1);
    const secondCondition = rule.condition2.text.charAt(0).toLocaleLowerCase('vi-VN') + rule.condition2.text.slice(1);
    const question = `Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng mật khẩu có ${codeLength} chữ số, ${firstCondition} và ${secondCondition}.`;

    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số',
        type: 'Trắc nghiệm', templateId: 'number.safe_password_by_place_value', q: question,
        imageUrl: './src/assets/safe-password-3d-v3.png', passwordCode: correct, codeLength,
        options: shuffle([correct, wrongCondition1, wrongCondition2, wrongBoth], random).map(formatNumber), ans: formatNumber(correct),
        explanation: `Mật khẩu ${formatNumber(correct)} thỏa cả hai điều kiện: ${rule.condition1.text}. ${rule.condition2.text}.`,
        templateVariables: { question, condition1: rule.condition1.text, condition2: rule.condition2.text, codeLength: String(codeLength), password_cells: codeLength, condition1Place: rule.condition1.key, condition2Place: rule.condition2.key }
    };
}

return generateSafePassword;
}));
