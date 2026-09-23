;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./angle-shared') : root.Grade4MathAngleShared;
    const reviewShared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared, reviewShared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-review'] = generate;
    root.Grade4MathTemplateGenerators['angle.review'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ ANGLE_TYPE_KEYS, angleTypeOf, classificationOptions, degreeForType, measureOptions, pickDistinctDegrees, renderAngleSVG, renderProtractorSVG, validateDegreePool, shuffle }, { configuredReviewSequence }) {

const MODE_KEYS = ['measure', 'classify'];
const MODE_LABELS = { measure: 'đọc số đo góc', classify: 'phân loại góc' };

function generateAngleReview(config = {}, random = Math.random) {
    const degreePool = validateDegreePool(config.allowedDegrees);
    const modeConfig = { ...config, modes: Array.isArray(config.modes) ? config.modes : (config.mode !== undefined ? [config.mode] : MODE_KEYS) };
    const review = configuredReviewSequence(
        modeConfig,
        'modes',
        MODE_KEYS,
        MODE_KEYS,
        random,
        'Bộ ôn tập góc cần ít nhất một dạng hợp lệ: đọc số đo hoặc phân loại góc.'
    );
    const measureDegrees = pickDistinctDegrees(degreePool, 4, random);
    let measureIndex = 0;
    const subquestions = review.sequence.map((mode, index) => mode === 'measure'
        ? (() => {
            const degrees = measureDegrees[measureIndex++ % measureDegrees.length];
            return {
            label: String.fromCharCode(97 + index),
            mode,
            skill: 'b07',
            skillLabel: 'Bài 7 · Góc và đơn vị đo góc',
            lesson: 'g4-math-hk1-b07',
            family: 'angle-measure',
            degrees,
            visual: renderProtractorSVG(degrees),
            prompt: 'Đọc số đo góc trên thước đo góc và chọn đáp án đúng (độ).',
            options: measureOptions(degrees, random),
            answer: `${degrees}°`
            };
        })()
        : (() => {
            const key = ANGLE_TYPE_KEYS[index % ANGLE_TYPE_KEYS.length];
            const degrees = degreeForType(key, random);
            return {
                label: String.fromCharCode(97 + index),
                mode,
                skill: 'b08',
                skillLabel: 'Bài 8 · Nhận biết góc nhọn, góc tù, góc bẹt',
                lesson: 'g4-math-hk1-b08',
                family: 'angle-classify',
                degrees,
                visual: renderAngleSVG(degrees),
                prompt: 'Quan sát hình và chọn tên loại góc đúng.',
                options: classificationOptions(random),
                answer: angleTypeOf(degrees)
            };
        })());
    const prompt = review.reviewMode === 'single'
        ? `Ôn tập dạng ${MODE_LABELS[review.sequence[0]]}:`
        : 'Ôn tập trộn các dạng góc:';
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
        explanation: 'Kết hợp đọc số đo góc và phân loại góc theo số đo.',
        templateVariables: {
            question: prompt,
            skills: 'đo góc, phân loại góc',
            modes: review.values.join(', '),
            reviewMode: review.reviewMode,
            selectedModes: review.sequence.join(', '),
            ...(review.selected ? { selectedMode: review.selected } : {})
        }
    };
}

return generateAngleReview;
}));
