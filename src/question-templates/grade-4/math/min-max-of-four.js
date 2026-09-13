;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.min_max_of_four'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, createFourPartMultipleChoiceQuestion }) {

const TASKS = ['smallest', 'smallest', 'largest', 'largest'];
const TASK_LABELS = { smallest: 'số bé nhất', largest: 'số lớn nhất' };
const TASK_PROMPTS = { smallest: 'Tìm số bé nhất?', largest: 'Tìm số lớn nhất?' };

function integerConfig(value, fallback, label) {
    const result = Number(value ?? fallback);
    if (!Number.isSafeInteger(result)) throw new Error(`${label} phải là số nguyên hợp lệ.`);
    return result;
}

function generateMinMaxOfFour(config = {}, random = Math.random) {
    const minimum = integerConfig(config.minimum, 10, 'Số nhỏ nhất');
    const maximum = integerConfig(config.maximum, 99999, 'Số lớn nhất');
    if (minimum < 0 || minimum >= maximum || maximum - minimum + 1 < 4) {
        throw new Error('Phạm vi tìm số bé nhất/lớn nhất phải có ít nhất bốn số nguyên khác nhau.');
    }

    const subquestions = TASKS.map((task, index) => {
        const values = new Set();
        while (values.size < 4) values.add(randomInt(minimum, maximum, random));
        const options = [...values];
        const answer = task === 'smallest' ? Math.min(...options) : Math.max(...options);
        return {
            label: String.fromCharCode(97 + index),
            prompt: TASK_PROMPTS[task],
            task,
            taskLabel: TASK_LABELS[task],
            options: shuffle(options, random).map(formatNumber),
            answer: formatNumber(answer)
        };
    });
    const prompt = 'Hãy chọn đáp án đúng';
    return createFourPartMultipleChoiceQuestion(
        'number.min_max_of_four',
        prompt,
        subquestions,
        'So sánh từng nhóm bốn số theo các hàng từ trái sang phải; hai nhóm đầu chọn số bé nhất, hai nhóm sau chọn số lớn nhất.',
        { question: prompt, taskSummary: 'a), b): số bé nhất; c), d): số lớn nhất' }
    );
}

return generateMinMaxOfFour;
}));
