;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, { 'number.hk1_review_b22_b25': generate });
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, formatNumber, numericOptions, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '5. Phép cộng và phép trừ';
const SKILLS = ['b22', 'b23', 'b24', 'b25'];
const LESSONS = {
    b22: 'g4-math-hk1-b22',
    b23: 'g4-math-hk1-b23',
    b24: 'g4-math-hk1-b24',
    b25: 'g4-math-hk1-b25'
};
const SKILL_LABELS = {
    b22: 'Bài 22 · Phép cộng',
    b23: 'Bài 23 · Phép trừ',
    b24: 'Bài 24 · Tính chất phép cộng',
    b25: 'Bài 25 · Tổng và hiệu'
};
const labels = ['a', 'b', 'c', 'd'];

function makeAddition(random) {
    const first = randomInt(10000, 499999, random);
    const second = randomInt(10000, 499999, random);
    const result = first + second;
    return {
        kind: 'addition',
        prompt: `Tính: ${formatNumber(first)} + ${formatNumber(second)} = ?`,
        answer: formatNumber(result),
        options: numericOptions(result, 20000, 999999, random, [1, 10, 100, 1000, 10000]),
        explanation: `${formatNumber(first)} + ${formatNumber(second)} = ${formatNumber(result)}.`,
        values: { first, second, result }
    };
}

function makeSubtraction(random) {
    const first = randomInt(100000, 999999, random);
    const second = randomInt(10000, first - 1, random);
    const result = first - second;
    return {
        kind: 'subtraction',
        prompt: `Tính: ${formatNumber(first)} − ${formatNumber(second)} = ?`,
        answer: formatNumber(result),
        options: numericOptions(result, 1, 999999, random, [1, 10, 100, 1000, 10000]),
        explanation: `${formatNumber(first)} − ${formatNumber(second)} = ${formatNumber(result)}.`,
        values: { first, second, result }
    };
}

function makeProperty(random) {
    if (random() < 0.5) {
        const first = randomInt(10, 9999, random);
        const second = randomInt(10, 9999, random);
        return {
            kind: 'property', property: 'commutative',
            prompt: `${formatNumber(first)} + ${formatNumber(second)} = ${formatNumber(second)} + ?`,
            answer: formatNumber(first),
            options: numericOptions(first, 1, 9999, random, [1, 10, 100, 1000]),
            explanation: 'Tính chất giao hoán: đổi chỗ các số hạng thì tổng không thay đổi.',
            values: { first, second }
        };
    }
    const first = randomInt(10, 999, random);
    const second = randomInt(10, 999, random);
    const third = randomInt(10, 999, random);
    return {
        kind: 'property', property: 'associative',
        prompt: `(${formatNumber(first)} + ${formatNumber(second)}) + ${formatNumber(third)} = ${formatNumber(first)} + (? + ${formatNumber(third)})`,
        answer: formatNumber(second),
        options: numericOptions(second, 1, 9999, random, [1, 10, 100, 1000]),
        explanation: 'Tính chất kết hợp: có thể nhóm các số hạng mà tổng không thay đổi.',
        values: { first, second, third }
    };
}

function makeSumDifference(random) {
    const small = randomInt(20, 499, random);
    const large = randomInt(small + 1, 999, random);
    const sum = small + large;
    const difference = large - small;
    const target = random() < 0.5 ? 'small' : 'large';
    const answer = target === 'small' ? small : large;
    return {
        kind: 'sum-difference', target,
        prompt: `Tổng của hai số là ${formatNumber(sum)}, hiệu của hai số là ${formatNumber(difference)}. Số ${target === 'small' ? 'bé' : 'lớn'} là bao nhiêu?`,
        answer: formatNumber(answer),
        options: numericOptions(answer, 1, 999, random, [1, 2, 5, 10, 20, 50]),
        explanation: target === 'small'
            ? 'Số bé = (Tổng − Hiệu) : 2.'
            : 'Số lớn = (Tổng + Hiệu) : 2.',
        values: { small, large, sum, difference }
    };
}

function generateReview(config = {}, random = Math.random) {
    const skills = Array.isArray(config.skills) && config.skills.length ? [...config.skills] : [...SKILLS];
    if (skills.length !== 4 || new Set(skills).size !== 4 || skills.some(skill => !SKILLS.includes(skill))) {
        throw new Error('Bộ ôn tập Bài 22 đến Bài 25 cần đúng bốn kỹ năng hợp lệ.');
    }
    const builders = { b22: makeAddition, b23: makeSubtraction, b24: makeProperty, b25: makeSumDifference };
    const subquestions = skills.map((skill, index) => {
        const part = builders[skill](random);
        return {
            label: labels[index],
            skill,
            skillLabel: SKILL_LABELS[skill],
            lesson: LESSONS[skill],
            ...part,
            prompt: `${SKILL_LABELS[skill]} · ${part.prompt}`
        };
    });
    const prompt = 'Luyện tập chung Bài 22 đến Bài 25:';
    const question = createFourPartMultipleChoiceQuestion(
        'number.hk1_review_b22_b25',
        prompt,
        subquestions,
        'Ôn lại phép cộng, phép trừ, tính chất phép cộng và cách tìm hai số biết tổng và hiệu theo nhãn Bài học.',
        { question: prompt, skills: skills.join(', ') }
    );
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

return generateReview;
}));
