;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./angle-shared') : root.Grade4MathAngleShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-review'] = generate;
    root.Grade4MathTemplateGenerators['angle.review'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ ANGLE_TYPE_KEYS, angleTypeOf, classificationOptions, degreeForType, measureOptions, pickDistinctDegrees, renderAngleSVG, renderProtractorSVG, validateDegreePool, shuffle }) {

const MODE_KEYS = ['measure', 'classify'];
const MODE_LABELS = { measure: 'đọc số đo góc', classify: 'phân loại góc' };

function configuredModes(config) {
    const source = Array.isArray(config.modes)
        ? config.modes
        : config.mode !== undefined
            ? [config.mode]
            : MODE_KEYS;
    if (!source.length || new Set(source).size !== source.length || source.some(mode => !MODE_KEYS.includes(mode))) {
        throw new Error('Bộ ôn tập góc cần ít nhất một dạng hợp lệ: đọc số đo hoặc phân loại góc.');
    }
    return [...source];
}

function generateAngleReview(config = {}, random = Math.random) {
    const degreePool = validateDegreePool(config.allowedDegrees);
    const modes = configuredModes(config);
    const selectedMode = shuffle(modes, random)[0];
    const subquestions = selectedMode === 'measure'
        ? pickDistinctDegrees(degreePool, 4, random).map((degrees, index) => ({
            label: String.fromCharCode(97 + index),
            mode: selectedMode,
            degrees,
            visual: renderProtractorSVG(degrees),
            prompt: 'Đọc số đo góc trên thước đo góc và chọn đáp án đúng (độ).',
            options: measureOptions(degrees, random),
            answer: `${degrees}°`
        }))
        : shuffle(ANGLE_TYPE_KEYS, random).map((key, index) => {
            const degrees = degreeForType(key, random);
            return {
                label: String.fromCharCode(97 + index),
                mode: selectedMode,
                degrees,
                visual: renderAngleSVG(degrees),
                prompt: 'Quan sát hình và chọn tên loại góc đúng.',
                options: classificationOptions(random),
                answer: angleTypeOf(degrees)
            };
        });
    const prompt = `Ôn tập dạng ${MODE_LABELS[selectedMode]}:`;
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
        explanation: selectedMode === 'measure'
            ? 'Đọc hai tia của góc trên thước đo góc và xác định số đo theo đơn vị độ.'
            : 'Góc nhọn bé hơn 90°, góc vuông bằng 90°, góc tù lớn hơn 90° và bé hơn 180°, còn góc bẹt bằng 180°.',
        templateVariables: {
            question: prompt,
            skills: 'đo góc, phân loại góc',
            modes: modes.join(', '),
            selectedMode
        }
    };
}

return generateAngleReview;
}));
