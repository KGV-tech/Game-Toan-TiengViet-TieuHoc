;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./angle-shared') : root.Grade4MathAngleShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-measure-read'] = generate;
    root.Grade4MathTemplateGenerators['angle.measure_read'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ measureOptions, pickDistinctDegrees, renderProtractorSVG, validateDegreePool }) {

function generateAngleMeasureRead(config = {}, random = Math.random) {
    const degreePool = validateDegreePool(config.allowedDegrees);
    const degrees = pickDistinctDegrees(degreePool, 4, random);
    const subquestions = degrees.map((value, index) => ({
        label: String.fromCharCode(97 + index),
        mode: 'measure',
        degrees: value,
        visual: renderProtractorSVG(value),
        prompt: 'Quan sát thước đo góc và chọn số đo đúng (độ).',
        options: measureOptions(value, random),
        answer: `${value}°`
    }));
    const prompt = 'Đọc số đo của từng góc trên thước đo góc và chọn đáp án đúng.';
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
        explanation: 'Mỗi góc được đọc theo vạch chia trên thước đo góc; số đo góc được viết kèm ký hiệu độ (°).',
        templateVariables: {
            question: prompt,
            measurements: degrees.map(value => `${value}°`).join(', ')
        }
    };
}

return generateAngleMeasureRead;
}));
