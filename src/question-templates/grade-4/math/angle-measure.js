;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./angle-shared') : root.Grade4MathAngleShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-measure-read'] = generate;
    root.Grade4MathTemplateGenerators['angle.measure_read'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ measureOptions, pickDistinctDegrees, renderProtractorSVG, validateDegreePool, shuffle }) {

function generateAngleMeasureRead(config = {}, random = Math.random) {
    const degreePool = validateDegreePool(config.allowedDegrees);
    const degrees = pickDistinctDegrees(degreePool, 4, random);
    const kinds = shuffle(['read', 'compare', 'unit', 'notation'], random);
    const subquestions = degrees.map((value, index) => {
        const exerciseKind = kinds[index];
        let prompt = 'Đọc số đo góc trên thước (độ).';
        let answer = `${value}°`;
        let options = measureOptions(value, random);
        if (exerciseKind === 'compare') {
            prompt = 'So sánh số đo góc với 90 độ.';
            answer = value < 90 ? 'Bé hơn 90°' : value > 90 ? 'Lớn hơn 90°' : 'Bằng 90°';
            options = shuffle(['Bé hơn 90°', 'Bằng 90°', 'Lớn hơn 90°', 'Bằng 180°'], random);
        } else if (exerciseKind === 'unit') {
            prompt = 'Đơn vị đo góc (°) là gì?';
            answer = 'Độ';
            options = shuffle(['Độ', 'Xăng-ti-mét', 'Ki-lô-gam', 'Lít'], random);
        } else if (exerciseKind === 'notation') {
            prompt = 'Viết đúng số đo góc (độ).';
            options = shuffle([`${value}°`, `${value} cm`, `${value} kg`, `${value} l`], random);
        }
        return {
            label: String.fromCharCode(97 + index),
            mode: 'measure',
            exerciseKind,
            degrees: value,
            visual: renderProtractorSVG(value),
            prompt,
            options,
            answer
        };
    });
    const prompt = 'Quan sát thước: đọc, so sánh số đo và nhận biết đơn vị đo góc.';
    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc',
        type: 'Trắc nghiệm',
        templateId: 'g4-m-angle-measure-read',
        q: prompt,
        instruction: prompt,
        options: [],
        subquestions,
        partAnswerCounts: [1, 1, 1, 1],
        ans: subquestions.map(item => item.answer).join(', '),
        explanation: 'Đọc từ vạch 0 ở cạnh nằm ngang đến tia đỏ. Đơn vị đo góc là độ (°); so sánh số đo ghi trên thước với 90°.',
        templateVariables: {
            question: prompt,
            measurements: degrees.map(value => `${value}°`).join(', ')
        }
    };
}

return generateAngleMeasureRead;
}));
