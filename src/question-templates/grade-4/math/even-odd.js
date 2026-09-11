;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {

const TOPIC = '1. Ôn tập và bổ sung';
const LABELS = ['a', 'b', 'c', 'd'];
const PARITIES = ['even', 'odd'];
const parityLabel = parity => parity === 'even' ? 'chẵn' : 'lẻ';
const parityOf = value => value % 2 === 0 ? 'even' : 'odd';

function numberRange(config = {}) {
    const minimum = Number(config.minimum ?? 0);
    const maximum = Number(config.maximum ?? 9999);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 0 || minimum > maximum) {
        throw new Error('Phạm vi số của Bài 3 không hợp lệ.');
    }
    if (maximum - minimum < 7) throw new Error('Phạm vi số của Bài 3 phải có ít nhất 8 giá trị.');
    return { minimum, maximum };
}

function allowedParities(config = {}) {
    const values = Array.isArray(config.parities) && config.parities.length
        ? [...new Set(config.parities)]
        : [...PARITIES];
    if (!values.length || values.some(value => !PARITIES.includes(value))) {
        throw new Error('Danh sách chẵn/lẻ chỉ nhận “even” hoặc “odd”.');
    }
    return values;
}

function hasParity(minimum, maximum, parity) {
    return minimum <= maximum && (minimum % 2 === (parity === 'even' ? 0 : 1) || minimum + 1 <= maximum);
}

function randomParityNumber(minimum, maximum, parity, random, excluded = new Set()) {
    if (!hasParity(minimum, maximum, parity)) throw new Error(`Không có đủ số ${parityLabel(parity)} trong phạm vi đã chọn.`);
    const first = minimum % 2 === (parity === 'even' ? 0 : 1) ? minimum : minimum + 1;
    const count = Math.floor((maximum - first) / 2) + 1;
    for (let attempt = 0; attempt < 100; attempt++) {
        const value = first + randomInt(0, count - 1, random) * 2;
        if (!excluded.has(value)) return value;
    }
    for (let value = first; value <= maximum; value += 2) {
        if (!excluded.has(value)) return value;
    }
    throw new Error(`Không thể tạo số ${parityLabel(parity)} không trùng nhau.`);
}

function chooseParity(parities, random) {
    return parities[randomInt(0, parities.length - 1, random)];
}

function multipleChoice(templateId, title, subquestions, explanation, templateVariables = {}) {
    if (subquestions.length !== 4) throw new Error('Bài 3 cần đúng bốn câu con.');
    const normalizePrompt = value => String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase('vi-VN');
    const promptLines = subquestions.map(item => String(item.prompt || '').split(/<br\s*\/?\s*>/i)[0].trim());
    const sharedPrompt = promptLines.length && promptLines.every(line => normalizePrompt(line) === normalizePrompt(promptLines[0]))
        ? promptLines[0]
        : '';
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC,
        type: 'Trắc nghiệm', templateId, q: title, options: [],
        ans: subquestions.map(item => item.answer).join(', '), explanation,
        subquestions, partAnswerCounts: [1, 1, 1, 1],
        templateVariables: { question: title, ...templateVariables },
        sharedPrompt
    };
}

function makeChoiceOptions(correct, createDistractor, random) {
    const values = [correct];
    for (let attempt = 0; attempt < 100; attempt++) {
        const candidate = createDistractor();
        if (!values.includes(candidate)) values.push(candidate);
        if (values.length === 4) return shuffle(values.map(formatNumber), random);
    }
    throw new Error('Không thể tạo đủ bốn phương án khác nhau.');
}

function generateEvenOddClassify(config = {}, random = Math.random) {
    const { minimum, maximum } = numberRange(config);
    const parities = allowedParities(config);
    if (!hasParity(minimum, maximum, 'even') || !hasParity(minimum, maximum, 'odd')) {
        throw new Error('Phạm vi Bài 3 phải có cả số chẵn và số lẻ để tạo phương án nhiễu.');
    }
    const used = new Set();
    const rows = LABELS.map(label => {
        const targetParity = chooseParity(parities, random);
        const target = randomParityNumber(minimum, maximum, targetParity, random, used);
        used.add(target);
        const distractors = new Set();
        while (distractors.size < 3) {
            distractors.add(randomParityNumber(minimum, maximum, targetParity === 'even' ? 'odd' : 'even', random));
        }
        const answer = formatNumber(target);
        return {
            label, targetParity, target, answer,
            prompt: `Số nào sau đây là số ${parityLabel(targetParity)}?`,
            options: makeChoiceOptions(answer, () => formatNumber([...distractors][randomInt(0, distractors.size - 1, random)]), random),
            explanation: `${formatNumber(target)} có chữ số tận cùng là ${target % 10}, nên là số ${parityLabel(targetParity)}.`
        };
    });
    return multipleChoice(
        'number.even_odd_classify',
        'Nhận biết số chẵn, số lẻ:',
        rows,
        'Số chẵn có chữ số tận cùng là 0, 2, 4, 6 hoặc 8; các số còn lại là số lẻ.'
    );
}

function integerOptions(correct, minimum, maximum, random) {
    const candidates = [];
    for (let value = minimum; value <= maximum; value++) candidates.push(value);
    if (candidates.length < 4) throw new Error('Khoảng số lượng phải có ít nhất bốn phương án.');
    return shuffle([correct, ...shuffle(candidates.filter(value => value !== correct), random).slice(0, 3)].map(formatNumber), random);
}

function generateEvenOddCount(config = {}, random = Math.random) {
    const { minimum, maximum } = numberRange(config);
    const parities = allowedParities(config);
    const listLengthMin = Number(config.listLengthMin ?? 6);
    const listLengthMax = Number(config.listLengthMax ?? 8);
    if (!Number.isInteger(listLengthMin) || !Number.isInteger(listLengthMax) || listLengthMin < 5 || listLengthMax < listLengthMin || listLengthMax > 12) {
        throw new Error('Số lượng phần tử trong dãy Bài 3 phải từ 5 đến 12.');
    }
    if (maximum - minimum + 1 < listLengthMax) throw new Error('Phạm vi số không đủ để tạo dãy không lặp phần tử.');
    const rows = LABELS.map(label => {
        const length = randomInt(listLengthMin, listLengthMax, random);
        const values = [];
        while (values.length < length) {
            const value = randomInt(minimum, maximum, random);
            if (!values.includes(value)) values.push(value);
        }
        const targetParity = chooseParity(parities, random);
        const count = values.filter(value => parityOf(value) === targetParity).length;
        const formattedValues = values.map(formatNumber).join(', ');
        return {
            label, values, targetParity, count, answer: formatNumber(count),
            prompt: `Trong dãy số ${formattedValues}, có bao nhiêu số ${parityLabel(targetParity)}?`,
            options: integerOptions(count, 0, length, random),
            explanation: `Có ${count} số ${parityLabel(targetParity)} trong dãy đã cho.`
        };
    });
    return multipleChoice(
        'number.even_odd_count',
        'Đếm số chẵn, số lẻ trong một dãy:',
        rows,
        'Đọc lần lượt từng số trong dãy, xác định chẵn hoặc lẻ rồi đếm đúng nhóm được hỏi.'
    );
}

function generateEvenOddSequence(config = {}, random = Math.random) {
    const { minimum, maximum } = numberRange(config);
    const parities = allowedParities(config);
    const configuredSteps = Array.isArray(config.sequenceSteps) && config.sequenceSteps.length
        ? [...new Set(config.sequenceSteps.map(Number))]
        : [2, 4, 6];
    if (configuredSteps.some(step => !Number.isSafeInteger(step) || step <= 0 || step % 2 !== 0)) {
        throw new Error('Bước nhảy dãy chẵn/lẻ phải là số nguyên dương, chẵn.');
    }
    const unsupportedSteps = configuredSteps.filter(step => parities.some(parity => !hasParity(minimum, maximum - step * 4, parity)));
    if (unsupportedSteps.length) {
        throw new Error('Bước nhảy dãy chẵn/lẻ không phù hợp với phạm vi số và dạng chẵn/lẻ đã chọn.');
    }
    const rows = LABELS.map(label => {
        const targetParity = chooseParity(parities, random);
        const step = configuredSteps[randomInt(0, configuredSteps.length - 1, random)];
        const start = randomParityNumber(minimum, maximum - step * 4, targetParity, random);
        const sequence = [0, 1, 2, 3].map(index => start + index * step);
        const correct = start + step * 4;
        const excluded = new Set(sequence.concat(correct));
        const answer = formatNumber(correct);
        return {
            label, targetParity, step, sequence, answer,
            prompt: `Dãy số được lập theo quy luật. Số thích hợp điền vào chỗ trống là số nào?<br>${sequence.map(formatNumber).join(', ')}, ___`,
            options: makeChoiceOptions(answer, () => formatNumber(randomParityNumber(minimum, maximum, targetParity, random, excluded)), random),
            explanation: `Mỗi số sau hơn số trước ${formatNumber(step)}, nên số tiếp theo là ${formatNumber(correct)}.`
        };
    });
    return multipleChoice(
        'number.even_odd_sequence',
        'Tìm số thích hợp điền vào dãy:',
        rows,
        'Dãy số chẵn hoặc dãy số lẻ có thể tăng đều theo một bước nhảy chẵn; vì vậy tính số tiếp theo bằng cách cộng bước nhảy.'
    );
}

function permutations(items) {
    if (items.length <= 1) return [items];
    return items.flatMap((item, index) => permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(rest => [item, ...rest]));
}

function randomCards(count, random) {
    for (let attempt = 0; attempt < 100; attempt++) {
        const cards = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random).slice(0, count);
        if (cards.some(value => value % 2 === 0) && cards.some(value => value % 2 === 1)) return cards;
    }
    throw new Error('Không thể tạo bộ thẻ có cả chữ số chẵn và lẻ.');
}

function generateEvenOddForm(config = {}, random = Math.random) {
    const digitCount = Number(config.digitCount ?? 4);
    if (!Number.isInteger(digitCount) || digitCount < 3 || digitCount > 4) throw new Error('Số thẻ của Bài 3 phải là 3 hoặc 4.');
    const parities = allowedParities(config);
    const rows = LABELS.map(label => {
        const cards = randomCards(digitCount, random);
        const allNumbers = permutations(cards).map(items => Number(items.join('')));
        const targetParity = chooseParity(parities, random);
        const targetNumbers = allNumbers.filter(value => parityOf(value) === targetParity);
        const distractorNumbers = allNumbers.filter(value => parityOf(value) !== targetParity);
        if (!targetNumbers.length || distractorNumbers.length < 3) throw new Error('Bộ thẻ phải tạo được cả số chẵn và số lẻ.');
        const target = targetNumbers[randomInt(0, targetNumbers.length - 1, random)];
        const answer = formatNumber(target);
        const distractors = shuffle(distractorNumbers, random).slice(0, 3);
        return {
            label, cards, targetParity, target, answer,
            prompt: `Từ các thẻ số ${cards.join(', ')}, số nào sau đây là số ${parityLabel(targetParity)}?`,
            options: shuffle([answer, ...distractors.map(formatNumber)], random),
            explanation: `Số ${formatNumber(target)} có chữ số tận cùng là ${target % 10}, nên là số ${parityLabel(targetParity)}.`
        };
    });
    return multipleChoice(
        'number.even_odd_form',
        'Lập số chẵn, số lẻ từ các thẻ số:',
        rows,
        'Khi lập số, xét chữ số ở hàng đơn vị: 0, 2, 4, 6, 8 tạo số chẵn; chữ số 1, 3, 5, 7, 9 tạo số lẻ.'
    );
}

return {
    'number.even_odd_classify': generateEvenOddClassify,
    'number.even_odd_count': generateEvenOddCount,
    'number.even_odd_sequence': generateEvenOddSequence,
    'number.even_odd_form': generateEvenOddForm
};
}));
