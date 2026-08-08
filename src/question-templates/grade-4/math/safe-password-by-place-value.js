;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.safe_password_by_place_value'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, randomNumberMatching }) {

const PLACE_LABELS = { 1: 'hàng đơn vị', 10: 'hàng chục', 100: 'hàng trăm', 1000: 'hàng nghìn', 10000: 'hàng chục nghìn', 100000: 'hàng trăm nghìn' };

function digitAt(value, place) {
    return Math.floor(value / place) % 10;
}

function clampCodeLength(value) {
    return Math.max(2, Math.min(9, Number.isInteger(Number(value)) ? Number(value) : 9));
}

function rulesFor(codeLength) {
    const minimum = 10 ** (codeLength - 1);
    const maximum = 10 ** codeLength - 1;
    if (codeLength === 9) return {
        minimum, maximum, protectedPlaces: [1000000, 10000000, 100000000], restrictedPlace: 100000,
        condition1: 'Mật khẩu không chứa chữ số 0 ở lớp triệu.', condition2: 'Chữ số hàng trăm nghìn khác 3.'
    };
    const restrictedPlace = codeLength === 2 ? 10 : 10 ** Math.min(codeLength - 1, 2);
    return {
        minimum, maximum, protectedPlaces: Array.from({ length: codeLength }, (_, index) => 10 ** index), restrictedPlace,
        condition1: 'Mật khẩu không chứa chữ số 0.', condition2: `Chữ số ${PLACE_LABELS[restrictedPlace]} khác 3.`
    };
}

function isSafePassword(value, rule) {
    return rule.protectedPlaces.every(place => digitAt(value, place) !== 0) && digitAt(value, rule.restrictedPlace) !== 3;
}

function generateSafePassword(config = {}, random = Math.random) {
    const minimumCodeLength = clampCodeLength(config.minimumCodeLength ?? config.codeLength ?? 9);
    const maximumCodeLength = clampCodeLength(config.maximumCodeLength ?? config.codeLength ?? 9);
    if (minimumCodeLength > maximumCodeLength) throw new Error('Số chữ số ít nhất không được lớn hơn số chữ số nhiều nhất.');
    const codeLength = randomInt(minimumCodeLength, maximumCodeLength, random);
    const rule = rulesFor(codeLength);
    const correct = randomNumberMatching(rule.minimum, rule.maximum, value => isSafePassword(value, rule), random);
    const wrongZero = randomNumberMatching(rule.minimum, rule.maximum, value => rule.protectedPlaces.some(place => digitAt(value, place) === 0), random);
    const wrongRestrictedPlace = randomNumberMatching(rule.minimum, rule.maximum, value => rule.protectedPlaces.every(place => digitAt(value, place) !== 0) && digitAt(value, rule.restrictedPlace) === 3, random);
    const wrongBoth = randomNumberMatching(rule.minimum, rule.maximum, value => !isSafePassword(value, rule) && value !== wrongZero && value !== wrongRestrictedPlace, random);
    const firstCondition = rule.condition1.replace(/\.$/, '').charAt(0).toLocaleLowerCase('vi-VN') + rule.condition1.replace(/\.$/, '').slice(1);
    const secondCondition = rule.condition2.charAt(0).toLocaleLowerCase('vi-VN') + rule.condition2.slice(1);
    const question = `Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng mật khẩu có ${codeLength} chữ số, ${firstCondition} và ${secondCondition}`;

    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số',
        type: 'Trắc nghiệm', templateId: 'number.safe_password_by_place_value', q: question,
        imageUrl: './src/assets/safe-password-3d-v3.png', passwordCode: correct, codeLength,
        options: shuffle([correct, wrongZero, wrongRestrictedPlace, wrongBoth], random).map(formatNumber), ans: formatNumber(correct),
        explanation: `Mật khẩu ${formatNumber(correct)} thỏa cả hai điều kiện: ${rule.condition1} ${rule.condition2}`,
        templateVariables: { question, condition1: rule.condition1, condition2: rule.condition2, password_cells: codeLength }
    };
}

return generateSafePassword;
}));
