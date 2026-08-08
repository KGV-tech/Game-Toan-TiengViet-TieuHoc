;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.safe_password_by_place_value'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ shuffle, formatNumber, randomNumberMatching }) {

const MILLION_CLASS_PLACES = [1000000, 10000000, 100000000];
const HUNDRED_THOUSANDS = 100000;

function digitAt(value, place) {
    return Math.floor(value / place) % 10;
}

function hasNoZeroInMillionClass(value) {
    return MILLION_CLASS_PLACES.every(place => digitAt(value, place) !== 0);
}

function isSafePassword(value) {
    return hasNoZeroInMillionClass(value) && digitAt(value, HUNDRED_THOUSANDS) !== 3;
}

function generateSafePassword(config = {}, random = Math.random) {
    const minimum = Math.max(config.minimum ?? 100000000, 100000000);
    const maximum = Math.min(config.maximum ?? 999999999, 999999999);
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum >= maximum) throw new Error('Safe-password template requires a range of nine-digit numbers.');

    const correct = randomNumberMatching(minimum, maximum, isSafePassword, random);
    const wrongZeroInMillionClass = randomNumberMatching(minimum, maximum, value => !hasNoZeroInMillionClass(value), random);
    const wrongHundredThousands = randomNumberMatching(minimum, maximum, value => hasNoZeroInMillionClass(value) && digitAt(value, HUNDRED_THOUSANDS) === 3, random);
    const wrongBoth = randomNumberMatching(minimum, maximum, value => !isSafePassword(value) && value !== wrongZeroInMillionClass && value !== wrongHundredThousands, random);
    const question = 'Chọn câu trả lời đúng.<br>Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng mật khẩu không chứa chữ số 0 ở lớp triệu và chữ số hàng trăm nghìn khác 3.';

    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '3. Số có nhiều chữ số',
        type: 'Trắc nghiệm', templateId: 'number.safe_password_by_place_value', q: question,
        imageUrl: './src/assets/safe-password.svg', options: shuffle([correct, wrongZeroInMillionClass, wrongHundredThousands, wrongBoth], random).map(formatNumber), ans: formatNumber(correct),
        explanation: `Mật khẩu ${formatNumber(correct)} không có chữ số 0 ở lớp triệu và chữ số hàng trăm nghìn là ${digitAt(correct, HUNDRED_THOUSANDS)}, khác 3.`,
        templateVariables: {
            question,
            condition1: 'Mật khẩu không chứa chữ số 0 ở lớp triệu.',
            condition2: 'Chữ số hàng trăm nghìn khác 3.'
        }
    };
}

return generateSafePassword;
}));
