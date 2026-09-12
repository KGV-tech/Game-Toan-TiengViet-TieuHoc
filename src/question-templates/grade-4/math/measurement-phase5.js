;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, numericOptions, configuredValues, chooseConfiguredValue, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '4. Một số đơn vị đo Đại lượng';
const labels = ['a', 'b', 'c', 'd'];
const PRACTICE_KINDS = ['mass', 'area', 'time', 'century'];
const REVIEW_SKILLS = ['b17', 'b18', 'b19', 'b20'];
const LESSONS = { b17: 'g4-math-hk1-b17', b18: 'g4-math-hk1-b18', b19: 'g4-math-hk1-b19', b20: 'g4-math-hk1-b20' };
const SKILL_LABELS = { b17: 'Bài 17 · Khối lượng', b18: 'Bài 18 · Diện tích', b19: 'Bài 19 · Giây và thế kỉ', b20: 'Bài 20 · Thực hành' };
const PRACTICE_KIND_LABELS = { mass: 'đổi đơn vị khối lượng', area: 'đổi đơn vị diện tích', time: 'đổi thời gian', century: 'xác định thế kỉ' };
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
    const kinds = configuredValues(config, 'allowedKinds', PRACTICE_KINDS, PRACTICE_KINDS, 'Phạm vi thực hành cần có ít nhất một nhóm đơn vị hợp lệ.');
    const selectedKind = chooseConfiguredValue(config, 'allowedKinds', PRACTICE_KINDS, PRACTICE_KINDS, random, 'Phạm vi thực hành cần có ít nhất một nhóm đơn vị hợp lệ.');
    const subquestions = labels.map(label => ({ label, ...practiceBuilders[selectedKind](random) }));
    const prompt = `Thực hành ${PRACTICE_KIND_LABELS[selectedKind]}:`;
    const question = createFourPartMultipleChoiceQuestion(
        'measurement.practice_cards',
        prompt,
        subquestions,
        `Bốn ý cùng luyện ${PRACTICE_KIND_LABELS[selectedKind]}.`,
        { question: prompt, kinds: kinds.join(', '), selectedKind }
    );
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

function makeReviewPart(skill, random, selectedKind) {
    const source = skill === 'b17'
        ? makeMass(random)
        : skill === 'b18'
            ? makeArea(random)
            : skill === 'b19'
                ? (selectedKind === 'century' ? makeCentury(random) : makeTime(random))
                : practiceBuilders[selectedKind](random);
    return {
        ...source,
        skill,
        skillLabel: SKILL_LABELS[skill],
        lesson: LESSONS[skill],
        prompt: `${SKILL_LABELS[skill]} · ${source.prompt}`
    };
}

function makeReviewQuestion(config = {}, random) {
    const skills = configuredValues(config, 'skills', REVIEW_SKILLS, REVIEW_SKILLS, 'Bộ ôn tập Bài 17 đến Bài 20 cần ít nhất một kỹ năng hợp lệ.');
    const selectedSkill = chooseConfiguredValue(config, 'skills', REVIEW_SKILLS, REVIEW_SKILLS, random, 'Bộ ôn tập Bài 17 đến Bài 20 cần ít nhất một kỹ năng hợp lệ.');
    const selectedKind = selectedSkill === 'b17'
        ? 'mass'
        : selectedSkill === 'b18'
            ? 'area'
            : selectedSkill === 'b19'
                ? (randomInt(0, 1, random) === 0 ? 'time' : 'century')
                : chooseConfiguredValue({}, 'allowedKinds', PRACTICE_KINDS, PRACTICE_KINDS, random, 'Bài 20 cần một nhóm thực hành hợp lệ.');
    const subquestions = labels.map(label => ({ label, ...makeReviewPart(selectedSkill, random, selectedKind) }));
    const prompt = `Luyện tập ${SKILL_LABELS[selectedSkill]} · ${PRACTICE_KIND_LABELS[selectedKind]}:`;
    const question = createFourPartMultipleChoiceQuestion(
        'measurement.hk1_review_b17_b20',
        prompt,
        subquestions,
        `Bốn ý cùng luyện ${PRACTICE_KIND_LABELS[selectedKind]}.`,
        { question: prompt, skills: skills.join(', '), selectedSkill, selectedKind }
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
