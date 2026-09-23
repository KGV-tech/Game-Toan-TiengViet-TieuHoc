;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const available = typeof module !== 'undefined' && module.exports
        ? require('./geometry-phase7')
        : (root.Grade4MathTemplateGenerators || {});
    const generators = factory(shared, available);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, readNumber, numericOptions, digitOptions, configuredReviewSequence, createFourPartMultipleChoiceQuestion }, available) {

const TOPIC = '7. Ôn tập Học kì 1';
const labels = ['a', 'b', 'c', 'd'];
const B33_SKILLS = ['b10', 'b11', 'b12', 'b13', 'b14', 'b15'];
const B34_SKILLS = ['b22', 'b23', 'b24', 'b25'];
const B35_SKILLS = ['b07', 'b08', 'b09', 'b27', 'b28', 'b29', 'b30', 'b31'];
const B36_SKILLS = ['b17', 'b18', 'b19', 'b20'];
const REVIEW_GROUPS = ['numbers', 'addSub', 'multiplicationDivision', 'geometry', 'measurement', 'statistics', 'probability', 'wordProblem'];
const LESSONS = {
    b10: 'g4-math-hk1-b10', b11: 'g4-math-hk1-b11', b12: 'g4-math-hk1-b12', b13: 'g4-math-hk1-b13', b14: 'g4-math-hk1-b14', b15: 'g4-math-hk1-b15',
    b17: 'g4-math-hk1-b17', b18: 'g4-math-hk1-b18', b19: 'g4-math-hk1-b19', b20: 'g4-math-hk1-b20',
    b22: 'g4-math-hk1-b22', b23: 'g4-math-hk1-b23', b24: 'g4-math-hk1-b24', b25: 'g4-math-hk1-b25',
    b27: 'g4-math-hk1-b27', b28: 'g4-math-hk1-b28', b29: 'g4-math-hk1-b29', b30: 'g4-math-hk1-b30',
    b07: 'g4-math-hk1-b07', b08: 'g4-math-hk1-b08', b09: 'g4-math-hk1-b09', b31: 'g4-math-hk1-b31'
};
const SKILL_LABELS = {
    b10: 'Bài 10 · Lập và đọc số sáu chữ số', b11: 'Bài 11 · Hàng và lớp',
    b12: 'Bài 12 · Lớp triệu', b13: 'Bài 13 · Làm tròn', b14: 'Bài 14 · So sánh số', b15: 'Bài 15 · Dãy số',
    b17: 'Bài 17 · Khối lượng', b18: 'Bài 18 · Diện tích',
    b19: 'Bài 19 · Giây và thế kỉ', b20: 'Bài 20 · Thực hành',
    b22: 'Bài 22 · Phép cộng', b23: 'Bài 23 · Phép trừ',
    b24: 'Bài 24 · Tính chất phép cộng', b25: 'Bài 25 · Tổng và hiệu',
    b27: 'Bài 27 · Hai đường thẳng vuông góc', b28: 'Bài 28 · Thực hành đường thẳng vuông góc',
    b29: 'Bài 29 · Hai đường thẳng song song', b30: 'Bài 30 · Thực hành đường thẳng song song',
    b07: 'Bài 7 · Góc và đơn vị đo góc', b08: 'Bài 8 · Nhận biết góc', b09: 'Bài 9 · Luyện tập góc', b31: 'Bài 31 · Hình bình hành, hình thoi'
};
const GROUP_LABELS = {
    numbers: 'Bài 33 · Ôn tập các số đến lớp triệu',
    addSub: 'Bài 34 · Ôn tập phép cộng, phép trừ',
    multiplicationDivision: 'Ôn lại phép nhân, phép chia',
    geometry: 'Bài 35 · Ôn tập hình học',
    measurement: 'Bài 36 · Ôn tập đo lường',
    statistics: 'Ôn tập đọc và phân tích số liệu',
    probability: 'Ôn tập khả năng xảy ra',
    wordProblem: 'Ôn tập bài toán có lời văn'
};
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

    if (skill === 'b14') {
        const left = randomInt(100000, 999999999, random);
        const right = randomInt(100000, 999999999, random);
        const answer = left > right ? '>' : left < right ? '<' : '=';
        return row('comparison', `Điền dấu thích hợp: ${formatNumber(left)} ? ${formatNumber(right)}`, answer, shuffle(['<', '>', '=', '≠'], random), `So sánh từ hàng lớn nhất: ${formatNumber(left)} ${answer} ${formatNumber(right)}.`, { left, right });
    }
    if (skill === 'b15') {
        const step = [1, 2, 5, 10, 100, 1000][randomInt(0, 5, random)];
        const start = randomInt(0, 999999 - step * 4, random);
        const sequence = Array.from({ length: 4 }, (_, index) => start + step * index);
        const answer = start + step * 4;
        return row('sequence', `Số tiếp theo của dãy ${sequence.map(formatNumber).join(', ')}, ... là số nào?`, formatNumber(answer), numericOptions(answer, 0, 999999, random), `Mỗi số hơn số đứng trước ${formatNumber(step)} đơn vị.`, { start, step, sequence });
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

function makeProperty(random, property = (random() < 0.5 ? 'commutative' : 'associative')) {
    if (property === 'commutative') {
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

function makeMeasurementPart(skill, random, index = 0) {
    if (skill === 'b17') {
        const tons = ((index + randomInt(1, 2, random)) % 4) + 1;
        const ta = ((index * 2 + randomInt(1, 3, random)) % 9) + 1;
        const answerNumber = tons * 1000 + ta * 100;
        return row('mass', `${tons} tấn ${ta} tạ bằng bao nhiêu ki-lô-gam?`, formatNumber(answerNumber), numericOptions(answerNumber, 100, 10000, random, [10, 100, 500, 1000, 2000]), `1 tấn = 1 000 kg và 1 tạ = 100 kg nên được ${formatNumber(answerNumber)} kg.`, { tons, ta, answerNumber });
    }
    if (skill === 'b18') {
        const squareMeters = ((index * 2 + randomInt(2, 4, random)) % 8) + 2;
        const answerNumber = squareMeters * 100;
        return row('area', `${squareMeters} m² bằng bao nhiêu dm²?`, formatNumber(answerNumber), numericOptions(answerNumber, 100, 3000, random, [100, 200, 300, 500, 1000]), `1 m² = 100 dm² nên ${squareMeters} m² = ${formatNumber(answerNumber)} dm².`, { squareMeters, answerNumber });
    }
    if (skill === 'b19') {
        const minutes = randomInt(1, 4, random);
        const seconds = randomInt(5, 50, random);
        const answerNumber = minutes * 60 + seconds;
        return row('time', `${minutes} phút ${seconds} giây bằng bao nhiêu giây?`, formatNumber(answerNumber), numericOptions(answerNumber, 5, 1000, random, [1, 5, 10, 30, 60, 120]), `${minutes} phút = ${minutes * 60} giây; cộng ${seconds} giây được ${answerNumber} giây.`, { minutes, seconds, answerNumber });
    }
    if (skill === 'b20') {
        const variant = index % 4;
        if (variant === 0) {
            const grams = randomInt(2, 9, random) * 100;
            const answerNumber = grams / 1000;
            return row('measurement-practice', `Phiếu cân ghi ${formatNumber(grams)} g. Khối lượng đó bằng bao nhiêu ki-lô-gam?`, String(answerNumber).replace('.', ','), ['0,1', '0,2', '0,5', '1'], 'Đổi từ gam sang ki-lô-gam bằng cách chia cho 1 000.', { activity: 'measurement-card', interaction: 'measurement-card', grams, answerNumber });
        }
        if (variant === 1) {
            const meters = randomInt(2, 8, random);
            const centimeters = meters * 100;
            return row('measurement-practice', `${centimeters} cm bằng bao nhiêu mét?`, String(meters), numericOptions(meters, 1, 20, random, [1, 2, 5]), 'Đổi từ xăng-ti-mét sang mét bằng cách chia cho 100.', { activity: 'bidirectional-conversion', interaction: 'measurement-card', centimeters, meters });
        }
        if (variant === 2) {
            const first = randomInt(2, 8, random);
            const second = randomInt(2, 8, random);
            const answer = first < second ? '<' : first > second ? '>' : '=';
            return row('measurement-practice', `So sánh ${first} m và ${second * 100} cm: điền dấu thích hợp.`, answer, ['<', '>', '='], 'Đổi về cùng một đơn vị trước khi so sánh.', { activity: 'measurement-compare', interaction: 'measurement-card', first, second });
        }
        const packs = randomInt(2, 5, random);
        const each = randomInt(2, 6, random) * 100;
        const answerNumber = packs * each;
        return row('measurement-practice', `${packs} hộp, mỗi hộp nặng ${each} g. Tất cả nặng bao nhiêu gam?`, formatNumber(answerNumber), numericOptions(answerNumber, 100, 20000, random, [100, 200, 500]), 'Tính khối lượng bằng phép nhân số hộp với khối lượng mỗi hộp.', { activity: 'measurement-word-problem', interaction: 'measurement-card', packs, each, answerNumber });
    }
    throw new Error(`Kỹ năng đo lường ${skill} không hợp lệ.`);
}

const geometryKeys = {
    b27: 'g4-m-perpendicular-identify',
    b28: 'g4-m-perpendicular-grid-practice',
    b29: 'g4-m-parallel-identify',
    b30: 'g4-m-parallel-grid-practice',
    b31: 'g4-m-quad-classify'
};

function makeAnglePart(skill, random, index = 0) {
    const degrees = skill === 'b07'
        ? [30, 45, 60, 90, 120][index % 5]
        : skill === 'b08'
            ? [45, 90, 120, 180][index % 4]
            : [60, 90, 120, 180][index % 4];
    const type = degrees < 90 ? 'góc nhọn' : degrees === 90 ? 'góc vuông' : degrees < 180 ? 'góc tù' : 'góc bẹt';
    if (skill === 'b07') {
        return row('angle-measure', `Góc trong hình có số đo ${degrees}°. Chọn số đo đúng.`, `${degrees}°`, shuffle([`${degrees}°`, `${Math.max(10, degrees - 15)}°`, `${Math.min(180, degrees + 15)}°`, '180°'], random), `Số đo góc được đọc theo đơn vị độ.`, { degrees, interaction: 'angle-measure' });
    }
    return row('angle-classify', `Góc có số đo ${degrees}° thuộc loại nào?`, type, shuffle(['góc nhọn', 'góc vuông', 'góc tù', 'góc bẹt'], random), `${degrees}° là ${type}.`, { degrees, interaction: 'angle-classify' });
}

function makeGeometryPart(skill, random, index = 0) {
    if (['b07', 'b08', 'b09'].includes(skill)) {
        const source = makeAnglePart(skill, random, index);
        return { ...source, skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], family: 'angle', prompt: `${SKILL_LABELS[skill]} · ${source.prompt}` };
    }
    const generator = available[geometryKeys[skill]];
    if (typeof generator !== 'function') throw new Error(`Thiếu generator hình học cho ${skill}.`);
    const generated = generator({}, random);
    const subquestions = Array.isArray(generated?.subquestions) ? generated.subquestions : [];
    const source = subquestions[index % Math.max(1, subquestions.length)] || subquestions[0];
    if (!source) throw new Error(`Không thể sinh câu hình học cho ${skill}.`);
    return {
        ...source,
        skill,
        skillLabel: SKILL_LABELS[skill],
        lesson: LESSONS[skill],
        family: skill === 'b31' ? 'quadrilateral' : 'line-relation',
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
    const review = configuredReviewSequence(config, 'skills', B33_SKILLS, B33_SKILLS, random, 'Bài 33 cần ít nhất một kỹ năng số học hợp lệ.');
    const parts = review.sequence.map(skill => {
        const source = makeNumberPart(skill, random);
        return { ...source, skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], family: 'numbers', prompt: `${SKILL_LABELS[skill]} · ${source.prompt}` };
    });
    const prompt = review.reviewMode === 'single' ? `Luyện tập ${SKILL_LABELS[review.sequence[0]]}:` : 'Ôn tập trộn Bài 10 đến Bài 15:';
    return reviewQuestion('number.hk1_review_b33_numbers', prompt, parts, 'Bốn ý trộn lập số, hàng và lớp, lớp triệu, làm tròn, so sánh và dãy số.', { question: prompt, skills: review.values.join(', '), reviewMode: review.reviewMode, selectedSkills: review.sequence.join(', '), ...(review.selected ? { selectedSkill: review.selected } : {}) });
}

function generateAddSubReview(config = {}, random = Math.random) {
    const review = configuredReviewSequence(config, 'skills', B34_SKILLS, B34_SKILLS, random, 'Bài 34 cần ít nhất một kỹ năng cộng/trừ hợp lệ.');
    const selectedProperty = review.reviewMode === 'single' && review.sequence[0] === 'b24'
        ? (random() < 0.5 ? 'commutative' : 'associative')
        : null;
    const parts = review.sequence.map(skill => {
        const source = skill === 'b24' ? makeProperty(random, selectedProperty || undefined) : addSubBuilders[skill](random);
        return { ...source, skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], family: 'add-sub', prompt: `${SKILL_LABELS[skill]} · ${source.prompt}` };
    });
    const prompt = review.reviewMode === 'single' ? `Luyện tập ${SKILL_LABELS[review.sequence[0]]}:` : 'Ôn tập trộn Bài 22 đến Bài 25:';
    return reviewQuestion('number.hk1_review_b34_add_sub', prompt, parts, 'Bốn ý trộn phép cộng, phép trừ, tính chất phép cộng và tổng - hiệu.', { question: prompt, skills: review.values.join(', '), reviewMode: review.reviewMode, selectedSkills: review.sequence.join(', '), ...(review.selected ? { selectedSkill: review.selected } : {}) });
}

function generateGeometryReview(config = {}, random = Math.random) {
    const review = configuredReviewSequence(config, 'skills', B35_SKILLS, B35_SKILLS, random, 'Bài 35 cần ít nhất một kỹ năng hình học hợp lệ.');
    const parts = review.sequence.map((skill, index) => makeGeometryPart(skill, random, index));
    const prompt = review.reviewMode === 'single' ? `Luyện tập ${SKILL_LABELS[review.sequence[0]]}:` : 'Ôn tập trộn góc, vuông góc, song song, hình bình hành và hình thoi:';
    return reviewQuestion('geometry.hk1_review_b35', prompt, parts, 'Bốn ý trộn các dạng góc, quan hệ đường thẳng và tứ giác trong HK1.', { question: prompt, skills: review.values.join(', '), reviewMode: review.reviewMode, selectedSkills: review.sequence.join(', '), ...(review.selected ? { selectedSkill: review.selected } : {}) });
}

function generateMeasurementReview(config = {}, random = Math.random) {
    const review = configuredReviewSequence(config, 'skills', B36_SKILLS, B36_SKILLS, random, 'Bài 36 cần ít nhất một kỹ năng đo lường hợp lệ.');
    const parts = review.sequence.map((skill, index) => {
        const source = makeMeasurementPart(skill, random, index);
        return { ...source, skill, skillLabel: SKILL_LABELS[skill], lesson: LESSONS[skill], family: 'measurement', prompt: `${SKILL_LABELS[skill]} · ${source.prompt}` };
    });
    const prompt = review.reviewMode === 'single' ? `Luyện tập ${SKILL_LABELS[review.sequence[0]]}:` : 'Ôn tập trộn Bài 17 đến Bài 20:';
    return reviewQuestion('measurement.hk1_review_b36', prompt, parts, 'Bốn ý trộn khối lượng, diện tích, thời gian và thực hành đo lường.', { question: prompt, skills: review.values.join(', '), reviewMode: review.reviewMode, selectedSkills: review.sequence.join(', '), ...(review.selected ? { selectedSkill: review.selected } : {}) });
}

function makeMultiplicationDivision(random, index = 0) {
    const divisor = randomInt(2, 9, random);
    const quotient = randomInt(20, 900, random);
    const dividend = quotient * divisor;
    const operation = index % 2 === 0 ? '×' : '÷';
    const answer = operation === '×' ? quotient * divisor : quotient;
    const prompt = operation === '×'
        ? `${formatNumber(quotient)} × ${divisor} = ?`
        : `${formatNumber(dividend)} : ${divisor} = ?`;
    return row('multiplication-division', prompt, formatNumber(answer), numericOptions(answer, 1, 999999, random, [1, 2, 5, 10, 100]), `${prompt.replace(' = ?', '')} = ${formatNumber(answer)}.`, { operation, dividend, divisor, quotient, family: 'multiplication-division' });
}

function makeStatistics(random, index = 0) {
    const values = [randomInt(3, 9, random), randomInt(3, 9, random), randomInt(3, 9, random)];
    const answer = index % 2 === 0 ? Math.max(...values) : values.reduce((sum, value) => sum + value, 0);
    const prompt = index % 2 === 0
        ? `Bảng ghi ba số ${values.join(', ')}. Số lớn nhất là bao nhiêu?`
        : `Bảng ghi ba số ${values.join(', ')}. Tổng các số là bao nhiêu?`;
    return row('statistics', prompt, formatNumber(answer), numericOptions(answer, 1, 100, random, [1, 2, 5, 10]), 'Đọc các giá trị trong bảng rồi chọn kết quả tương ứng.', { values, statistic: index % 2 === 0 ? 'maximum' : 'sum', family: 'statistics' });
}

function makeProbability(random, index = 0) {
    const scenarios = [
        ['Một túi chỉ có bi màu đỏ. Lấy một viên bi, khả năng lấy được bi đỏ là gì?', 'chắc chắn'],
        ['Một hộp có bi đỏ và bi xanh. Lấy một viên bi, khả năng lấy được bi đỏ là gì?', 'có thể'],
        ['Một hộp chỉ có bi xanh. Lấy một viên bi, khả năng lấy được bi đỏ là gì?', 'không thể']
    ];
    const [prompt, answer] = scenarios[index % scenarios.length];
    return row('probability', prompt, answer, shuffle(['chắc chắn', 'có thể', 'không thể'], random), 'Phân loại dựa vào các kết quả có thể xảy ra trong tình huống.', { scenario: index % scenarios.length, family: 'probability' });
}

function makeWordProblem(random, index = 0) {
    const second = randomInt(10, 40, random);
    const first = randomInt(second + 1, 80, random);
    const answer = index % 2 === 0 ? first + second : first - second;
    const prompt = index % 2 === 0
        ? `Thư viện có ${first} quyển truyện, mua thêm ${second} quyển. Thư viện có tất cả bao nhiêu quyển?`
        : `Một cửa hàng có ${first} kg gạo, bán ${second} kg. Cửa hàng còn lại bao nhiêu ki-lô-gam?`;
    return row('word-problem', prompt, formatNumber(answer), numericOptions(answer, 1, 200, random, [1, 2, 5, 10]), 'Xác định phép tính theo mối quan hệ thêm vào hoặc bớt đi.', { operation: index % 2 === 0 ? '+' : '−', family: 'word-problem' });
}

function generateFullReview(config = {}, random = Math.random) {
    const review = configuredReviewSequence(config, 'groups', REVIEW_GROUPS, REVIEW_GROUPS, random, 'Bài 37 cần ít nhất một nhóm review HK1 hợp lệ.');
    const builders = {
        numbers: index => { const source = makeNumberPart(B33_SKILLS[index % B33_SKILLS.length], random); return { ...source, skillGroup: 'numbers', sourceLesson: 'g4-math-hk1-b33', family: 'numbers', prompt: `${GROUP_LABELS.numbers} · ${source.prompt}` }; },
        addSub: index => { const source = addSubBuilders[B34_SKILLS[index % B34_SKILLS.length]](random); return { ...source, skillGroup: 'addSub', sourceLesson: 'g4-math-hk1-b34', family: 'add-sub', prompt: `${GROUP_LABELS.addSub} · ${source.prompt}` }; },
        multiplicationDivision: index => { const source = makeMultiplicationDivision(random, index); return { ...source, skillGroup: 'multiplicationDivision', sourceLesson: 'g4-math-hk1-b37', prompt: `${GROUP_LABELS.multiplicationDivision} · ${source.prompt}` }; },
        geometry: index => { const source = makeGeometryPart(B35_SKILLS[index % B35_SKILLS.length], random, index); return { ...source, skillGroup: 'geometry', sourceLesson: 'g4-math-hk1-b35', family: 'geometry', prompt: `${GROUP_LABELS.geometry} · ${source.prompt}` }; },
        measurement: index => { const source = makeMeasurementPart(B36_SKILLS[index % B36_SKILLS.length], random, index); return { ...source, skillGroup: 'measurement', sourceLesson: 'g4-math-hk1-b36', family: 'measurement', prompt: `${GROUP_LABELS.measurement} · ${source.prompt}` }; },
        statistics: index => { const source = makeStatistics(random, index); return { ...source, skillGroup: 'statistics', sourceLesson: 'g4-math-hk1-b37', prompt: `${GROUP_LABELS.statistics} · ${source.prompt}` }; },
        probability: index => { const source = makeProbability(random, index); return { ...source, skillGroup: 'probability', sourceLesson: 'g4-math-hk1-b37', prompt: `${GROUP_LABELS.probability} · ${source.prompt}` }; },
        wordProblem: index => { const source = makeWordProblem(random, index); return { ...source, skillGroup: 'wordProblem', sourceLesson: 'g4-math-hk1-b37', prompt: `${GROUP_LABELS.wordProblem} · ${source.prompt}` }; }
    };
    const parts = review.sequence.map((group, index) => {
        const source = builders[group](index);
        return {
            ...source,
            skill: source.skill || group,
            lesson: source.lesson || source.sourceLesson,
            family: source.family || group
        };
    });
    const prompt = review.reviewMode === 'single' ? `Luyện tập ${GROUP_LABELS[review.sequence[0]]}:` : 'Ôn tập tổng hợp Học kì 1:';
    return reviewQuestion('number.hk1_review_b37_full', prompt, parts, 'Bốn ý trộn số học, phép tính, hình học, đo lường, thống kê, xác suất và bài toán có lời văn.', { question: prompt, groups: review.values.join(', '), reviewMode: review.reviewMode, selectedGroups: review.sequence.join(', '), ...(review.selected ? { selectedGroup: review.selected } : {}) });
}

return {
    'number.hk1_review_b33_numbers': generateNumbersReview,
    'number.hk1_review_b34_add_sub': generateAddSubReview,
    'geometry.hk1_review_b35': generateGeometryReview,
    'measurement.hk1_review_b36': generateMeasurementReview,
    'number.hk1_review_b37_full': generateFullReview
};
}));
