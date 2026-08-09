;(function (root, factory) {
    const generators = typeof module !== 'undefined' && module.exports ? {
        'number.smallest_of_four': require('./smallest-of-four'),
        'number.largest_of_four': require('./largest-of-four'),
        'number.digit_at_place': require('./digit-at-place'),
        'number.compose_from_places': require('./compose-from-places'),
        'number.missing_expanded_addend': require('./missing-expanded-addend'),
        'number.four_arithmetic_blanks': require('./four-arithmetic-blanks'),
        'number.four_arithmetic_comparisons': require('./four-arithmetic-comparisons'),
        'number.neighbor_numbers': require('./neighbor-numbers'),
        'number.compare_number_forms': require('./compare-number-forms'),
        'number.match_number_words': require('./match-number-words'),
        'number.place_value_true_false': require('./place-value-true-false'),
        'number.safe_password_by_place_value': require('./safe-password-by-place-value')
    } : root.Grade4MathTemplateGenerators;
    const api = factory(generators);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.Grade4MathTemplates = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (generators) {

function generateQuestion(templateId, config = {}, random = Math.random) {
    const generator = generators[templateId];
    if (!generator) throw new Error(`Unknown Grade 4 Math template: ${templateId}`);
    return generator(config, random);
}

return { generateQuestion, templateIds: Object.keys(generators) };
}));
