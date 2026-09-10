;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./angle-shared') : root.Grade4MathAngleShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-review'] = generate;
    root.Grade4MathTemplateGenerators['angle.review'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ ANGLE_TYPE_KEYS, angleTypeOf, classificationOptions, degreeForType, measureOptions, pickDistinctDegrees, renderAngleSVG, renderProtractorSVG, validateDegreePool, shuffle }) {

function generateAngleReview(config = {}, random = Math.random) {
    const degreePool = validateDegreePool(config.allowedDegrees);
    const measureDegrees = pickDistinctDegrees(degreePool, 2, random);
    const classifyDegrees = shuffle(ANGLE_TYPE_KEYS, random)
        .slice(0, 2)
        .map(key => degreeForType(key, random));
    const subquestions = [
        {
            label: 'a',
            mode: 'measure',
            degrees: measureDegrees[0],
            visual: renderProtractorSVG(measureDegrees[0]),
            prompt: 'Đọc số đo góc trên thước đo góc và chọn đáp án đúng (độ).',
            options: measureOptions(measureDegrees[0], random),
            answer: `${measureDegrees[0]}°`
        },
        {
            label: 'b',
            mode: 'classify',
            degrees: classifyDegrees[0],
            visual: renderAngleSVG(classifyDegrees[0]),
            prompt: 'Quan sát hình và chọn tên loại góc đúng.',
            options: classificationOptions(random),
            answer: angleTypeOf(classifyDegrees[0])
        },
        {
            label: 'c',
            mode: 'measure',
            degrees: measureDegrees[1],
            visual: renderProtractorSVG(measureDegrees[1]),
            prompt: 'Đọc số đo góc trên thước đo góc và chọn đáp án đúng (độ).',
            options: measureOptions(measureDegrees[1], random),
            answer: `${measureDegrees[1]}°`
        },
        {
            label: 'd',
            mode: 'classify',
            degrees: classifyDegrees[1],
            visual: renderAngleSVG(classifyDegrees[1]),
            prompt: 'Quan sát hình và chọn tên loại góc đúng.',
            options: classificationOptions(random),
            answer: angleTypeOf(classifyDegrees[1])
        }
    ];
    const prompt = 'Ôn tập góc: đọc số đo và nhận biết loại góc.';
    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc',
        type: 'Trắc nghiệm',
        templateId: 'g4-m-angle-review',
        q: prompt,
        instruction: prompt,
        options: [],
        subquestions,
        partAnswerCounts: [1, 1, 1, 1],
        ans: subquestions.map(item => item.answer).join(', '),
        explanation: 'Góc nhọn bé hơn 90°, góc vuông bằng 90°, góc tù lớn hơn 90° và bé hơn 180°, còn góc bẹt bằng 180°.',
        templateVariables: {
            question: prompt,
            skills: 'đo góc, phân loại góc'
        }
    };
}

return generateAngleReview;
}));
