;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, numericOptions, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '4. Một số đơn vị đo Đại lượng';
const labels = ['a', 'b', 'c', 'd'];
const PRACTICE_KINDS = ['mass', 'area', 'time', 'century'];
const REVIEW_SKILLS = ['b17', 'b18', 'b19', 'b20'];
const LESSONS = { b17: 'g4-math-hk1-b17', b18: 'g4-math-hk1-b18', b19: 'g4-math-hk1-b19', b20: 'g4-math-hk1-b20' };
const SKILL_LABELS = { b17: 'Bài 17 · Khối lượng', b18: 'Bài 18 · Diện tích', b19: 'Bài 19 · Giây và thế kỉ', b20: 'Bài 20 · Thực hành' };

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const choose = (items, random) => items[randomInt(0, items.length - 1, random)];
const configuredList = (config, key, defaults, allowed, message) => {
    const source = hasOwn(config, key) ? config[key] : defaults;
    if (!Array.isArray(source) || !source.length || new Set(source).size !== source.length || source.some(value => !allowed.includes(value))) {
        throw new Error(message);
    }
    return [...source];
};
const row = (kind, prompt, answer, options, explanation, extra = {}) => ({
    kind, prompt, answer, options, explanation, ...extra
});

function romanNumeral(value) {
    const numerals = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let remainder = value;
    return numerals.reduce((result, [unit, symbol]) => {
        const count = Math.floor(remainder / unit);
        remainder %= unit;
        return result + symbol.repeat(count);
    }, '');
}

function makeMass(random) {
    const tons = randomInt(1, 4, random);
    const ta = randomInt(1, 9, random);
    const answerNumber = tons * 1000 + ta * 100;
    return row(
        'mass',
        `Phiếu cân ghi ${tons} tấn ${ta} tạ. Đổi ra ki-lô-gam được bao nhiêu?`,
        formatNumber(answerNumber),
        numericOptions(answerNumber, 100, 10000, random, [10, 100, 500, 1000, 2000]),
        `1 tấn = 1 000 kg và 1 tạ = 100 kg nên khối lượng là ${formatNumber(answerNumber)} kg.`,
        { activity: 'mass-card', tons, ta, answerNumber }
    );
}

function makeArea(random) {
    const squareMeters = randomInt(2, 9, random);
    const answerNumber = squareMeters * 100;
    return row(
        'area',
        `Phiếu đo ghi ${squareMeters} m². Đổi ra đề-xi-mét vuông được bao nhiêu?`,
        formatNumber(answerNumber),
        numericOptions(answerNumber, 100, 3000, random, [100, 200, 300, 500, 1000]),
        `1 m² = 100 dm² nên ${squareMeters} m² = ${formatNumber(answerNumber)} dm².`,
        { activity: 'area-card', squareMeters, answerNumber }
    );
}

function makeTime(random) {
    const minutes = randomInt(1, 4, random);
    const seconds = randomInt(5, 50, random);
    const answerNumber = minutes * 60 + seconds;
    return row(
        'time',
        `Đồng hồ bấm giờ ghi ${minutes} phút ${seconds} giây. Thời gian đó là bao nhiêu giây?`,
        formatNumber(answerNumber),
        numericOptions(answerNumber, 5, 1000, random, [1, 5, 10, 30, 60, 120]),
        `${minutes} phút = ${minutes * 60} giây; cộng thêm ${seconds} giây được ${answerNumber} giây.`,
        { activity: 'time-card', minutes, seconds, answerNumber }
    );
}

function makeCentury(random) {
    const century = randomInt(18, 21, random);
    const year = randomInt(century * 100 - 99, century * 100, random);
    const answer = romanNumeral(century);
    const options = shuffle([answer, ...shuffle([18, 19, 20, 21].map(romanNumeral).filter(value => value !== answer), random).slice(0, 3)], random);
    return row(
        'century',
        `Lịch ghi năm ${year}. Năm đó thuộc thế kỉ nào?`,
        answer,
        options,
        `Năm ${year} nằm trong khoảng từ ${(century - 1) * 100 + 1} đến ${century * 100}, nên thuộc thế kỉ ${answer}.`,
        { activity: 'century-card', century, year }
    );
}

const practiceBuilders = { mass: makeMass, area: makeArea, time: makeTime, century: makeCentury };

function makePracticeQuestion(config = {}, random) {
    const kinds = configuredList(config, 'allowedKinds', PRACTICE_KINDS, PRACTICE_KINDS, 'Phạm vi thực hành cần có ít nhất một nhóm đơn vị hợp lệ.');
    const order = shuffle(kinds, random);
    const subquestions = labels.map((label, index) => ({ label, ...practiceBuilders[order[index % order.length]](random) }));
    const prompt = 'Thực hành đọc phiếu đo và đổi đơn vị:';
    const question = createFourPartMultipleChoiceQuestion(
        'measurement.practice_cards',
        prompt,
        subquestions,
        'Đọc đúng dữ liệu trên phiếu, đổi về đơn vị được hỏi rồi chọn đáp án tương ứng.',
        { question: prompt, kinds: kinds.join(', ') }
    );
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

function makeReviewPart(skill, random) {
    const source = skill === 'b17'
        ? makeMass(random)
        : skill === 'b18'
            ? makeArea(random)
            : skill === 'b19'
                ? (randomInt(0, 1, random) === 0 ? makeTime(random) : makeCentury(random))
                : choose(Object.values(practiceBuilders), random)(random);
    return {
        ...source,
        skill,
        skillLabel: SKILL_LABELS[skill],
        lesson: LESSONS[skill],
        prompt: `${SKILL_LABELS[skill]} · ${source.prompt}`
    };
}

function makeReviewQuestion(config = {}, random) {
    const skills = configuredList(config, 'skills', REVIEW_SKILLS, REVIEW_SKILLS, 'Bộ ôn tập Bài 17 đến Bài 20 cần đúng bốn kỹ năng hợp lệ.');
    if (skills.length !== 4) throw new Error('Bộ ôn tập Bài 17 đến Bài 20 cần đúng bốn kỹ năng hợp lệ.');
    const subquestions = skills.map((skill, index) => ({ label: labels[index], ...makeReviewPart(skill, random) }));
    const prompt = 'Luyện tập chung Bài 17 đến Bài 20:';
    const question = createFourPartMultipleChoiceQuestion(
        'measurement.hk1_review_b17_b20',
        prompt,
        subquestions,
        'Ôn lại khối lượng, diện tích, thời gian/thế kỉ và thực hành đọc dữ liệu đo theo nhãn Bài học.',
        { question: prompt, skills: skills.join(', ') }
    );
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

return {
    'measurement.practice_cards': makePracticeQuestion,
    'measurement.hk1_review_b17_b20': makeReviewQuestion
};
}));
