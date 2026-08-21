;(function (root, factory) {
    const generators = typeof module !== 'undefined' && module.exports ? {
        'number.smallest_of_four': require('./smallest-of-four'),
        'number.largest_of_four': require('./largest-of-four'),
        'number.digit_at_place': require('./digit-at-place'),
        'number.compose_from_places': require('./compose-from-places'),
        'number.missing_expanded_addend': require('./missing-expanded-addend'),
        'number.four_arithmetic_blanks': require('./four-arithmetic-blanks'),
        'number.four_arithmetic_comparisons': require('./four-arithmetic-comparisons'),
        'number.four_operations_fill_blanks': require('./four-operations-fill-blanks'),
        'number.four_operations_expressions': require('./four-operations-expressions'),
        'number.neighbor_numbers': require('./neighbor-numbers'),
        'number.natural_sequence': require('./natural-sequence'),
        'number.compare_number_forms': require('./compare-number-forms'),
        'number.match_number_words': require('./match-number-words'),
        'number.place_value_true_false': require('./place-value-true-false'),
        'number.safe_password_by_place_value': require('./safe-password-by-place-value'),
        ...require('./measurement-units'),
        'g4-m-angle-count-in-polygon': require('./angle-count-in-polygon'),
        'angle.count_in_polygon': require('./angle-count-in-polygon'),
        'g4-m-angle-drag-classify': require('./angle-drag-classify'),
        'angle.drag_classify': require('./angle-drag-classify'),
        'g4-m-angle-clock-classify': require('./angle-clock-classify'),
        'angle.clock_classify': require('./angle-clock-classify'),
        'g4-m-angle-count-eight-angles': require('./angle-count-eight-angles'),
        'angle.count_eight_angles': require('./angle-count-eight-angles')
    } : root.Grade4MathTemplateGenerators;
    const api = factory(generators);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.Grade4MathTemplates = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (generators) {

function generateQuestion(templateId, config = {}, random = Math.random) {
    const generator = generators[templateId];
    if (!generator) throw new Error(`Unknown Grade 4 Math template: ${templateId}`);
    const question = generator(config, random);
    if (!Array.isArray(question.partAnswerCounts)) {
        const fourParts = [question.subquestions, question.practiceRows, question.comparisonRows, question.statements].some(items => Array.isArray(items) && items.length === 4)
            || (question.type === 'Đối chiếu trùng khớp' && String(question.ans || '').split(', ').filter(Boolean).length === 4)
            || ['g4-m-angle-count-in-polygon', 'angle.count_in_polygon', 'g4-m-angle-drag-classify', 'angle.drag_classify', 'g4-m-angle-clock-classify', 'angle.clock_classify', 'g4-m-angle-count-eight-angles', 'angle.count_eight_angles'].includes(templateId);
        if (fourParts) question.partAnswerCounts = [1, 1, 1, 1];
    }
    return question;
}

return { generateQuestion, templateIds: Object.keys(generators) };
}));
