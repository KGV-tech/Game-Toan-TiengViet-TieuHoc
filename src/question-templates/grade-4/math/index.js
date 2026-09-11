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
        'number.six_digit_numbers': require('./six-digit-numbers'),
        'number.million_class': require('./million-class'),
        'number.round_hundred_thousands': require('./round-hundred-thousands'),
        'number.hk1_review_b10_b15': require('./review-b10-b15'),
        'number.place_value_true_false': require('./place-value-true-false'),
        'number.safe_password_by_place_value': require('./safe-password-by-place-value'),
        ...require('./even-odd'),
        ...require('./variable-expressions'),
        ...require('./review-b01-b04'),
        ...require('./measurement-units'),
        ...require('./measurement-phase5'),
        ...require('./topic-5'),
        'number.hk1_review_b22_b25': require('./review-b22-b25'),
        'g4-m-angle-count-in-polygon': require('./angle-count-in-polygon'),
        'angle.count_in_polygon': require('./angle-count-in-polygon'),
        'g4-m-angle-drag-classify': require('./angle-drag-classify'),
        'angle.drag_classify': require('./angle-drag-classify'),
        'g4-m-angle-clock-classify': require('./angle-clock-classify'),
        'angle.clock_classify': require('./angle-clock-classify'),
        'g4-m-angle-count-eight-angles': require('./angle-count-eight-angles'),
        'angle.count_eight_angles': require('./angle-count-eight-angles'),
        'g4-m-angle-measure-read': require('./angle-measure'),
        'angle.measure_read': require('./angle-measure'),
        'g4-m-angle-review': require('./angle-review'),
        'angle.review': require('./angle-review')
    } : root.Grade4MathTemplateGenerators;
    const api = factory(generators);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.Grade4MathTemplates = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (generators) {

const SUPPORTED_PART_COUNTS = [1, 2, 4];
const STRUCTURED_PART_KEYS = ['subquestions', 'practiceRows', 'comparisonRows', 'statements', 'angleItems', 'angleCountRows', 'sequenceRounds'];

function allPartIndexes(partCount) {
    return Array.from({ length: partCount }, (_, index) => index);
}

function normalizePartIndexes(rawIndexes, partCount) {
    const all = allPartIndexes(partCount);
    if (!Array.isArray(rawIndexes)) return all;
    const selected = [...new Set(rawIndexes.map(Number).filter(index => Number.isInteger(index) && index >= 0 && index < partCount))].sort((left, right) => left - right);
    return selected.length && SUPPORTED_PART_COUNTS.includes(selected.length) && selected.length <= partCount ? selected : all;
}

function splitAnswerTokens(value) {
    return String(value || '').split(/[|,]/).map(item => item.trim()).filter(Boolean);
}

function filterLabeledLines(value, selectedIndexes) {
    const raw = String(value || '');
    const lines = raw.split(/<br\s*\/?\s*>/i);
    const labeledIndexes = lines.reduce((indexes, line, index) => {
        if (/^[a-dA-D][.)]\s*/.test(line.trim())) indexes.push(index);
        return indexes;
    }, []);
    if (labeledIndexes.length !== 4) return value;
    const selected = new Set(selectedIndexes);
    return lines.filter((_, index) => {
        const partIndex = labeledIndexes.indexOf(index);
        return partIndex < 0 || selected.has(partIndex);
    }).join('<br>');
}

function filterGeneratedParts(question, config) {
    const rawSelection = config?.selectedParts;
    if (!Array.isArray(rawSelection)) return question;

    const partKey = STRUCTURED_PART_KEYS.find(key => Array.isArray(question?.[key]) && question[key].length === 4);
    if (partKey) {
        const sourceParts = question[partKey];
        const selectedIndexes = normalizePartIndexes(rawSelection, sourceParts.length);
        const sourceCounts = Array.isArray(question.partAnswerCounts) && question.partAnswerCounts.length === sourceParts.length
            ? question.partAnswerCounts.map(Number)
            : sourceParts.map(() => 1);
        const sourceAnswers = splitAnswerTokens(question.ans);
        let answerOffset = 0;
        const answerGroups = sourceCounts.map(count => {
            const group = sourceAnswers.slice(answerOffset, answerOffset + (Number.isInteger(count) && count > 0 ? count : 1));
            answerOffset += Number.isInteger(count) && count > 0 ? count : 1;
            return group;
        });

        question[partKey] = selectedIndexes.map(index => sourceParts[index]);
        if (partKey === 'subquestions' && Array.isArray(question.practiceRows) && question.practiceRows.length === 4) {
            question.practiceRows = selectedIndexes.map(index => question.practiceRows[index]);
        }
        question.partAnswerCounts = selectedIndexes.map(index => sourceCounts[index] || 1);
        question.ans = selectedIndexes.flatMap(index => answerGroups[index] || []).join(', ');
        question.q = filterLabeledLines(question.q, selectedIndexes);
        if (question.templateVariables && typeof question.templateVariables === 'object') {
            Object.keys(question.templateVariables).forEach(key => {
                if (typeof question.templateVariables[key] === 'string') {
                    question.templateVariables[key] = filterLabeledLines(question.templateVariables[key], selectedIndexes);
                }
            });
        }
        question.selectedParts = selectedIndexes.length === 4
            ? undefined
            : selectedIndexes.map((_, index) => index);
        return question;
    }

    const sourceAnswers = splitAnswerTokens(question.ans);
    if (sourceAnswers.length === 4) {
        const selectedIndexes = normalizePartIndexes(rawSelection, sourceAnswers.length);
        question.ans = selectedIndexes.map(index => sourceAnswers[index]).join(', ');
        question.partAnswerCounts = selectedIndexes.map(() => 1);
        question.q = filterLabeledLines(question.q, selectedIndexes);
        if (question.templateVariables && typeof question.templateVariables === 'object') {
            Object.keys(question.templateVariables).forEach(key => {
                if (typeof question.templateVariables[key] === 'string') {
                    question.templateVariables[key] = filterLabeledLines(question.templateVariables[key], selectedIndexes);
                }
            });
        }
        question.selectedParts = selectedIndexes.length === 4
            ? undefined
            : selectedIndexes.map((_, index) => index);
    }
    return question;
}

function generateQuestion(templateId, config = {}, random = Math.random) {
    const generator = generators[templateId];
    if (!generator) throw new Error(`Unknown Grade 4 Math template: ${templateId}`);
    const question = generator(config, random);
    if (!Array.isArray(question.partAnswerCounts)) {
        const fourParts = [question.subquestions, question.practiceRows, question.comparisonRows, question.statements].some(items => Array.isArray(items) && items.length === 4)
            || (question.type === 'Đối chiếu trùng khớp' && String(question.ans || '').split(', ').filter(Boolean).length === 4)
            || ['g4-m-angle-count-in-polygon', 'angle.count_in_polygon', 'g4-m-angle-drag-classify', 'angle.drag_classify', 'g4-m-angle-clock-classify', 'angle.clock_classify', 'g4-m-angle-count-eight-angles', 'angle.count_eight_angles', 'g4-m-angle-measure-read', 'angle.measure_read', 'g4-m-angle-review', 'angle.review'].includes(templateId);
        if (fourParts) question.partAnswerCounts = [1, 1, 1, 1];
    }
    return filterGeneratedParts(question, config);
}

return { generateQuestion, templateIds: Object.keys(generators) };
}));
