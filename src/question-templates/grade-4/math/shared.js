function randomInt(min, max, random) {
    return Math.floor(random() * (max - min + 1)) + min;
}

function shuffle(items, random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
        const swapIndex = randomInt(0, index, random);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function createQuestion(templateId, prompt, values, correctValue, explanation) {
    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '1. Số tự nhiên',
        type: 'Trắc nghiệm',
        templateId,
        q: prompt,
        options: values.map(formatNumber),
        ans: formatNumber(correctValue),
        explanation
    };
}

module.exports = { randomInt, shuffle, formatNumber, createQuestion };
