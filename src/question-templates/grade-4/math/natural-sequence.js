;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.natural_sequence'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, formatNumber }) {

const DEFAULT_STEPS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, -1000, -2000, -3000, -4000, -5000, -6000, -7000, -8000, -9000];

function choose(items, random) {
    return items[randomInt(0, items.length - 1, random)];
}

function integerConfig(value, fallback, label) {
    const result = Number(value ?? fallback);
    if (!Number.isSafeInteger(result)) throw new Error(`${label} phải là số nguyên hợp lệ.`);
    return result;
}

function ruleText(step) {
    const amount = formatNumber(Math.abs(step));
    return step > 0
        ? `Mỗi số hơn số đứng ngay trước ${amount} đơn vị.`
        : `Mỗi số kém số đứng ngay trước ${amount} đơn vị.`;
}

function chooseBlankIndexes(length, blankCount, random) {
    const candidates = Array.from({ length: length - 2 }, (_, index) => index + 1);
    const indexes = [];
    while (indexes.length < blankCount) {
        const choiceIndex = randomInt(0, candidates.length - 1, random);
        indexes.push(candidates.splice(choiceIndex, 1)[0]);
    }
    return indexes.sort((first, second) => first - second);
}

function generateNaturalSequence(config = {}, random = Math.random) {
    const minimum = integerConfig(config.minimum, 10000, 'Số nhỏ nhất');
    const maximum = integerConfig(config.maximum, 9999999, 'Số lớn nhất');
    const sequenceLengthMin = integerConfig(config.sequenceLengthMin, 5, 'Số lượng số ít nhất');
    const sequenceLengthMax = integerConfig(config.sequenceLengthMax, 7, 'Số lượng số nhiều nhất');
    const blankCountMin = integerConfig(config.blankCountMin, 2, 'Số ô trống ít nhất');
    const blankCountMax = integerConfig(config.blankCountMax, 3, 'Số ô trống nhiều nhất');
    const allowedSteps = (Array.isArray(config.allowedSteps) ? config.allowedSteps : DEFAULT_STEPS).map(Number);

    if (minimum < 0 || maximum <= minimum) throw new Error('Số nhỏ nhất phải nhỏ hơn số lớn nhất và không âm.');
    if (sequenceLengthMin < 5 || sequenceLengthMax < sequenceLengthMin) throw new Error('Dãy số phải có từ 5 số trở lên.');
    if (blankCountMin < 1 || blankCountMax < blankCountMin) throw new Error('Số ô trống không hợp lệ.');
    if (blankCountMax > sequenceLengthMin - 2) throw new Error('Dãy số phải còn ít nhất hai số đã biết.');
    if (!allowedSteps.length || allowedSteps.some(step => !Number.isSafeInteger(step) || step === 0)) throw new Error('Hãy khai báo ít nhất một bước nhảy nguyên khác 0.');

    const rounds = ['a', 'b', 'c', 'd'].map(label => {
        const length = randomInt(sequenceLengthMin, sequenceLengthMax, random);
        const blankCount = randomInt(blankCountMin, Math.min(blankCountMax, length - 2), random);
        const compatibleSteps = allowedSteps.filter(step => Math.abs(step) * (length - 1) <= maximum - minimum);
        if (!compatibleSteps.length) throw new Error('Phạm vi số không đủ để tạo dãy theo các bước nhảy đã chọn.');
        const step = choose(compatibleSteps, random);
        const startMinimum = step > 0 ? minimum : minimum - step * (length - 1);
        const startMaximum = step > 0 ? maximum - step * (length - 1) : maximum;
        const start = randomInt(startMinimum, startMaximum, random);
        const sequence = Array.from({ length }, (_, index) => start + step * index);
        const blankIndexes = chooseBlankIndexes(length, blankCount, random);
        const blankSet = new Set(blankIndexes);
        return { label, sequence, blankIndexes, step, display: sequence.map((value, index) => blankSet.has(index) ? '___' : formatNumber(value)).join(', ') };
    });
    const q = `Điền số thích hợp vào mỗi dãy:<br>${rounds.map(round => `${round.label}) ${round.display}`).join('<br>')}`;
    const answers = rounds.flatMap(round => round.blankIndexes.map(index => formatNumber(round.sequence[index])));
    const explanation = rounds.map(round => `${round.label}) ${ruleText(round.step)}`).join(' ');

    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '3. Số có nhiều chữ số',
        type: 'Chuỗi Quy luật',
        templateId: 'number.natural_sequence',
        q,
        options: [],
        ans: answers.join(', '),
        explanation,
        templateVariables: {
            question: q,
            sequence: rounds.map(round => `${round.label}) ${round.sequence.map(formatNumber).join(', ')}`).join('<br>'),
            blank: '___'
        },
        sequenceRounds: rounds,
        partAnswerCounts: rounds.map(round => round.blankIndexes.length)
    };
}

return generateNaturalSequence;
}));
