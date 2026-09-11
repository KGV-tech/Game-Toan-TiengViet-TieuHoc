;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const available = typeof module !== 'undefined' && module.exports
        ? require('./geometry-phase7')
        : (root.Grade4MathTemplateGenerators || {});
    const generators = factory(shared, available);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, readNumber, numericOptions, digitOptions, createFourPartMultipleChoiceQuestion }, available) {

const TOPIC = '7. Ôn tập Học kì 1';
const labels = ['a', 'b', 'c', 'd'];
const B33_SKILLS = ['b10', 'b11', 'b12', 'b13'];
const B34_SKILLS = ['b22', 'b23', 'b24', 'b25'];
const B35_SKILLS = ['b27', 'b28', 'b29', 'b30'];
const B36_SKILLS = ['b17', 'b18', 'b19', 'b20'];
const REVIEW_GROUPS = ['numbers', 'addSub', 'geometry', 'measurement'];
const LESSONS = {
    b10: 'g4-math-hk1-b10', b11: 'g4-math-hk1-b11', b12: 'g4-math-hk1-b12', b13: 'g4-math-hk1-b13',
    b17: 'g4-math-hk1-b17', b18: 'g4-math-hk1-b18', b19: 'g4-math-hk1-b19', b20: 'g4-math-hk1-b20',
    b22: 'g4-math-hk1-b22', b23: 'g4-math-hk1-b23', b24: 'g4-math-hk1-b24', b25: 'g4-math-hk1-b25',
    b27: 'g4-math-hk1-b27', b28: 'g4-math-hk1-b28', b29: 'g4-math-hk1-b29', b30: 'g4-math-hk1-b30'
};
const SKILL_LABELS = {
    b10: 'Bài 10 · Lập và đọc số sáu chữ số', b11: 'Bài 11 · Hàng và lớp',
    b12: 'Bài 12 · Lớp triệu', b13: 'Bài 13 · Làm tròn',
    b17: 'Bài 17 · Khối lượng', b18: 'Bài 18 · Diện tích',
    b19: 'Bài 19 · Giây và thế kỉ', b20: 'Bài 20 · Thực hành',
    b22: 'Bài 22 · Phép cộng', b23: 'Bài 23 · Phép trừ',
    b24: 'Bài 24 · Tính chất phép cộng', b25: 'Bài 25 · Tổng và hiệu',
    b27: 'Bài 27 · Hai đường thẳng vuông góc', b28: 'Bài 28 · Thực hành đường thẳng vuông góc',
    b29: 'Bài 29 · Hai đường thẳng song song', b30: 'Bài 30 · Thực hành đường thẳng song song'
};
const GROUP_LABELS = {
    numbers: 'Bài 33 · Ôn tập các số đến lớp triệu',
    addSub: 'Bài 34 · Ôn tập phép cộng, phép trừ',
    geometry: 'Bài 35 · Ôn tập hình học',
    measurement: 'Bài 36 · Ôn tập đo lường'
};
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

function configuredList(config, key, defaults, allowed, message) {
    const source = hasOwn(config, key) ? config[key] : defaults;
    if (!Array.isArray(source) || source.length !== 4 || new Set(source).size !== 4 || source.some(value => !allowed.includes(value))) {
        throw new Error(message);
    }
    return [...source];
}

function row(kind, prompt, answer, options, explanation, extra = {}) {
    return { kind, prompt, answer, options, explanation, ...extra };
}

function makeNumberPart(skill, random) {
    if (skill === 'b10') {
        const number = randomInt(100000, 999999, random);
        const digits = String(number).split('');
        return row(
            'number-compose',
            `Số gồm các chữ số ${digits.join(', ')} từ hàng trăm nghìn đến hàng đơn vị được viết là số nào?`,
            formatNumber(number),
            numericOptions(number, 100000, 999999, random),
            `Ghép đúng giá trị sáu chữ số để được ${formatNumber(number)}.`,
            { number }
        );
    }
    if (skill === 'b11') {
        const number = randomInt(100000, 999999, random);
        const placeChoices = [[100000, 'trăm nghìn'], [10000, 'chục nghìn'], [1000, 'nghìn'], [100, 'trăm'], [10, 'chục'], [1, 'đơn vị']];
        const [placeValue, place] = placeChoices[randomInt(0, placeChoices.length - 1, random)];
        const digit = Math.floor(number / placeValue) % 10;
        return row(
            'place-value',
            `Trong số ${formatNumber(number)}, chữ số hàng ${place} là chữ số nào?`,
            String(digit),
            digitOptions(digit, random),
            `Chữ số ở hàng ${place} của ${formatNumber(number)} là ${digit}.`,
            { number, place, digit }
        );
    }
    if (skill === 'b12') {
        const number = randomInt(1000000, 999999999, random);
        const values = numericOptions(number, 1000000, 999999999, random).map(value => Number(value.replace(/\s/g, '')));
        const answer = readNumber(number);
        return row(
            'million-class',
            `Cách đọc đúng của số ${formatNumber(number)} là gì?`,
            answer,
            shuffle(values.map(readNumber), random),
            `Đọc số theo từng lớp triệu, nghìn và đơn vị: ${answer}.`,
            { number }
        );
    }

    const number = randomInt(100000, 999999999, random);
    const answerNumber = Math.floor((number + 50000) / 100000) * 100000;
    return row(
        'round-hundred-thousands',
        `Làm tròn số ${formatNumber(number)} đến hàng trăm nghìn được số nào?`,
        formatNumber(answerNumber),
        numericOptions(answerNumber, 0, 1000000000, random, [100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000]),
        `Chữ số hàng chục nghìn là ${Math.floor(number / 10000) % 10}; kết quả làm tròn là ${formatNumber(answerNumber)}.`,
        { number, answerNumber }
    );
}

function makeAddition(random) {
    const first = randomInt(10000, 499999, random);
    const second = randomInt(10000, 499999, random);
    const result = first + second;
    return row('addition', `Tính: ${formatNumber(first)} + ${formatNumber(second)} = ?`, formatNumber(result), numericOptions(result, 20000, 999999, random, [1, 10, 100, 1000, 10000]), `${formatNumber(first)} + ${formatNumber(second)} = ${formatNumber(result)}.`, { first, second, result });
}

function makeSubtraction(random) {
    const first = randomInt(100000, 999999, random);
    const second = randomInt(10000, first - 1, random);
    const result = first - second;
    return row('subtraction', `Tính: ${formatNumber(first)} − ${formatNumber(second)} = ?`, formatNumber(result), numericOptions(result, 1, 999999, random, [1, 10, 100, 1000, 10000]), `${formatNumber(first)} − ${formatNumber(second)} = ${formatNumber(result)}.`, { first, second, result });
}

function makeProperty(random) {
    if (random() < 0.5) {
        const first = randomInt(10, 9999, random);
        const second = randomInt(10, 9999, random);
        return row('property', `${formatNumber(first)} + ${formatNumber(second)} = ${formatNumber(second)} + ?`, formatNumber(first), numericOptions(first, 1, 9999, random, [1, 10, 100, 1000]), 'Tính chất giao hoán cho phép đổi chỗ hai số hạng mà tổng không thay đổi.', { property: 'commutative', first, second });
    }
    const first = randomInt(10, 999, random);
    const second = randomInt(10, 999, random);
    const third = randomInt(10, 999, random);
    return row('property', `(${formatNumber(first)} + ${formatNumber(second)}) + ${formatNumber(third)} = ${formatNumber(first)} + (? + ${formatNumber(third)})`, formatNumber(second), numericOptions(second, 1, 9999, random, [1, 10, 100, 1000]), 'Tính chất kết hợp cho phép nhóm các số hạng mà tổng không thay đổi.', { property: 'associative', first, second, third });
}

function makeSumDifference(random) {
    const small = randomInt(20, 499, random);
    const large = randomInt(small + 1, 999, random);
    const sum = small + large;
    const difference = large - small;
    const target = random() < 0.5 ? 'small' : 'large';
    const answer = target === 'small' ? small : large;
    return row(
        'sum-difference',
        `Tổng của hai số là ${formatNumber(sum)}, hiệu của hai số là ${formatNumber(difference)}. Số ${target === 'small' ? 'bé' : 'lớn'} là bao nhiêu?`,
        formatNumber(answer),
        numericOptions(answer, 1, 999, random, [1, 2, 5, 10, 20, 50]),
        target === 'small' ? 'Số bé = (Tổng − Hiệu) : 2.' : 'Số lớn = (Tổng + Hiệu) : 2.',
        { target, small, large, sum, difference }
    );
}

const addSubBuilders = { b22: makeAddition, b23: makeSubtraction, b24: makeProperty, b25: makeSumDifference };

function makeMeasurementPart(skill, random) {
    if (skill === 'b17') {
        const tons = randomInt(1, 4, random);
        const ta = randomInt(1, 9, random);
        const answerNumber = tons * 1000 + ta * 100;
        return row('mass', `${tons} tấn ${ta} tạ bằng bao nhiêu ki-lô-gam?`, formatNumber(answerNumber), numericOptions(answerNumber, 100, 10000, random, [10, 100, 500, 1000, 2000]), `1 tấn = 1 000 kg và 1 tạ = 100 kg nên được ${formatNumber(answerNumber)} kg.`, { tons, ta, answerNumber });
    }
    if (skill === 'b18') {
        const squareMeters = randomInt(2, 9, random);
        const answerNumber = squareMeters * 100;
        return row('area', `${squareMeters} m² bằng bao nhiêu dm²?`, formatNumber(answerNumber), numericOptions(answerNumber, 100, 3000, random, [100, 200, 300, 500, 1000]), `1 m² = 100 dm² nên ${squareMeters} m² = ${formatNumber(answerNumber)} dm².`, { squareMeters, answerNumber });
    }
    if (skill === 'b19') {
        const minutes = randomInt(1, 4, random);
        const seconds = randomInt(5, 50, random);
        const answerNumber = minutes * 60 + seconds;
        return row('time', `${minutes} phút ${seconds} giây bằng bao nhiêu giây?`, formatNumber(answerNumber), numericOptions(answerNumber, 5, 1000, random, [1, 5, 10, 30, 60, 120]), `${minutes} phút = ${minutes * 60} giây; cộng ${seconds} giây được ${answerNumber} giây.`, { minutes, seconds, answerNumber });
    }
    const century = randomInt(18, 21, random);
    const year = randomInt(century * 100 - 99, century * 100, random);
    const roman = value => ['XVIII', 'XIX', 'XX', 'XXI'][value - 18];
    const answer = roman(century);
    const options = shuffle([answer, ...[18, 19, 20, 21].map(roman).filter(value => value !== answer)], random);
    return row('century', `Năm ${year} thuộc thế kỉ nào?`, answer, options, `Năm ${year} nằm trong khoảng của thế kỉ ${answer}.`, { century, year });
}

const geometryKeys = {
    b27: 'g4-m-perpendicular-identify',
    b28: 'g4-m-perpendicular-grid-practice',
    b29: 'g4-m-parallel-identify',
    b30: 'g4-m-parallel-grid-practice'
};

function makeGeometryPart(skill, random) {
    const generator = available[geometryKeys[skill]];
    if (typeof generator !== 'function') throw new Error(`Thiếu generator hình học cho ${skill}.`);
    const source = generator({}, random)?.subquestions?.[0];
    if (!source) throw new Error(`Không thể sinh câu hình học cho ${skill}.`);
    return {
        ...source,
        skill,
        skillLabel: SKILL_LABELS[skill],
        lesson: LESSONS[skill],
        prompt: `${SKILL_LABELS[skill]} · ${source.prompt}`
    };
}

function reviewQuestion(templateId, prompt, values, explanation, templateVariables) {
    const question = createFourPartMultipleChoiceQuestion(templateId, prompt, values.map((part, index) => ({ ...part, label: labels[index] })), explanation, templateVariables);
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

function generateNumbersReview(config = {}, random = Math.random) {
    const skills = configuredList(config, 'skills', B33_SKILLS, B33_SKILLS, 'Bài 33 cần đúng bốn kỹ năng số học hợp lệ.');
    const parts = skills.map(skill => {
        const source = makeNumberPart(skill, random);
        return { ...source, skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], prompt: `${SKILL_LABELS[skill]} · ${source.prompt}` };
    });
    return reviewQuestion('number.hk1_review_b33_numbers', 'Luyện tập chung Bài 33:', parts, 'Ôn lập và đọc số, hàng và lớp, lớp triệu và làm tròn số theo nhãn Bài học.', { question: 'Luyện tập chung Bài 33:', skills: skills.join(', ') });
}

function generateAddSubReview(config = {}, random = Math.random) {
    const skills = configuredList(config, 'skills', B34_SKILLS, B34_SKILLS, 'Bài 34 cần đúng bốn kỹ năng cộng và trừ hợp lệ.');
    const parts = skills.map(skill => {
        const source = addSubBuilders[skill](random);
        return { ...source, skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], prompt: `${SKILL_LABELS[skill]} · ${source.prompt}` };
    });
    return reviewQuestion('number.hk1_review_b34_add_sub', 'Luyện tập chung Bài 34:', parts, 'Ôn phép cộng, phép trừ, tính chất phép cộng và cách tìm hai số biết tổng và hiệu theo nhãn Bài học.', { question: 'Luyện tập chung Bài 34:', skills: skills.join(', ') });
}

function generateGeometryReview(config = {}, random = Math.random) {
    const skills = configuredList(config, 'skills', B35_SKILLS, B35_SKILLS, 'Bài 35 cần đúng bốn kỹ năng hình học hợp lệ.');
    const parts = skills.map(skill => makeGeometryPart(skill, random));
    return reviewQuestion('geometry.hk1_review_b35', 'Luyện tập chung Bài 35:', parts, 'Ôn nhận biết đường thẳng vuông góc và song song bằng hình vẽ, lưới ô vuông và dấu hiệu hình học.', { question: 'Luyện tập chung Bài 35:', skills: skills.join(', ') });
}

function generateMeasurementReview(config = {}, random = Math.random) {
    const skills = configuredList(config, 'skills', B36_SKILLS, B36_SKILLS, 'Bài 36 cần đúng bốn kỹ năng đo lường hợp lệ.');
    const parts = skills.map(skill => {
        const source = makeMeasurementPart(skill, random);
        return { ...source, skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], prompt: `${SKILL_LABELS[skill]} · ${source.prompt}` };
    });
    return reviewQuestion('measurement.hk1_review_b36', 'Luyện tập chung Bài 36:', parts, 'Ôn khối lượng, diện tích, thời gian và thế kỉ theo nhãn Bài học.', { question: 'Luyện tập chung Bài 36:', skills: skills.join(', ') });
}

function generateFullReview(config = {}, random = Math.random) {
    const groups = configuredList(config, 'groups', REVIEW_GROUPS, REVIEW_GROUPS, 'Bài 37 cần đúng bốn nhóm review HK1 hợp lệ.');
    const builders = {
        numbers: () => { const source = makeNumberPart('b10', random); return { ...source, skillGroup: 'numbers', sourceLesson: 'g4-math-hk1-b33', prompt: `${GROUP_LABELS.numbers} · ${source.prompt}` }; },
        addSub: () => { const source = makeAddition(random); return { ...source, skillGroup: 'addSub', sourceLesson: 'g4-math-hk1-b34', prompt: `${GROUP_LABELS.addSub} · ${source.prompt}` }; },
        geometry: () => { const source = makeGeometryPart('b27', random); return { ...source, skillGroup: 'geometry', sourceLesson: 'g4-math-hk1-b35', lesson: 'g4-math-hk1-b35', prompt: `${GROUP_LABELS.geometry} · ${source.prompt}` }; },
        measurement: () => { const source = makeMeasurementPart('b17', random); return { ...source, skillGroup: 'measurement', sourceLesson: 'g4-math-hk1-b36', prompt: `${GROUP_LABELS.measurement} · ${source.prompt}` }; }
    };
    const parts = groups.map(group => builders[group]());
    return reviewQuestion('number.hk1_review_b37_full', 'Luyện tập chung Học kỳ 1:', parts, 'Mỗi nhóm số học, cộng/trừ, hình học và đo lường đóng góp một câu con để giữ cân đối phạm vi ôn tập HK1.', { question: 'Luyện tập chung Học kỳ 1:', groups: groups.join(', ') });
}

return {
    'number.hk1_review_b33_numbers': generateNumbersReview,
    'number.hk1_review_b34_add_sub': generateAddSubReview,
    'geometry.hk1_review_b35': generateGeometryReview,
    'measurement.hk1_review_b36': generateMeasurementReview,
    'number.hk1_review_b37_full': generateFullReview
};
}));
