;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, createFourPartMultipleChoiceQuestion }) {

const TOPIC = '6. Đường thẳng vuông góc. Đường thẳng song song';
const labels = ['a', 'b', 'c', 'd'];
const RELATIONS = ['perpendicular', 'parallel', 'intersecting', 'separate'];
const RELATION_LABELS = {
    perpendicular: 'vuông góc',
    parallel: 'song song',
    intersecting: 'cắt nhau nhưng không vuông góc',
    separate: 'không cắt nhau và không song song'
};
const SHAPES = ['parallelogram', 'rhombus', 'rectangle', 'trapezoid'];
const SHAPE_LABELS = {
    parallelogram: 'hình bình hành',
    rhombus: 'hình thoi',
    rectangle: 'hình chữ nhật',
    trapezoid: 'hình thang'
};
const QUAD_OPTIONS = ['Hình bình hành', 'Hình thoi', 'Cả hình bình hành và hình thoi', 'Không phải cả hai'];
const REVIEW_SKILLS = ['b27', 'b28', 'b29', 'b30', 'b31'];
const LESSONS = {
    b27: 'g4-math-hk1-b27',
    b28: 'g4-math-hk1-b28',
    b29: 'g4-math-hk1-b29',
    b30: 'g4-math-hk1-b30',
    b31: 'g4-math-hk1-b31'
};
const SKILL_LABELS = {
    b27: 'Bài 27 · Hai đường thẳng vuông góc',
    b28: 'Bài 28 · Thực hành đường thẳng vuông góc',
    b29: 'Bài 29 · Hai đường thẳng song song',
    b30: 'Bài 30 · Thực hành đường thẳng song song',
    b31: 'Bài 31 · Hình bình hành, hình thoi'
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
function configuredList(config, key, defaults, allowed, message) {
    const source = hasOwn(config, key) ? config[key] : defaults;
    if (!Array.isArray(source) || !source.length || new Set(source).size !== source.length || source.some(value => !allowed.includes(value))) {
        throw new Error(message);
    }
    return [...source];
}

function pick(items, random) {
    return items[randomInt(0, items.length - 1, random)];
}

function svgShell(className, ariaLabel, content) {
    return `<svg class="geometry-visual ${className}" viewBox="0 0 280 150" role="img" aria-label="${ariaLabel}" xmlns="http://www.w3.org/2000/svg"><title>${ariaLabel}</title>${content}</svg>`;
}

function lineDefinition(relation) {
    return {
        perpendicular: {
            first: [36, 90, 244, 90], second: [140, 22, 140, 124], angle: 90, intersects: true, parallel: false
        },
        parallel: {
            first: [38, 48, 242, 48], second: [38, 102, 242, 102], angle: 0, intersects: false, parallel: true
        },
        intersecting: {
            first: [42, 116, 238, 30], second: [42, 34, 238, 108], angle: 58, intersects: true, parallel: false
        },
        separate: {
            first: [36, 46, 145, 110], second: [164, 40, 246, 94], angle: 32, intersects: false, parallel: false
        }
    }[relation];
}

function linePath([x1, y1, x2, y2], className) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${className}"/>`;
}

function renderLinePairSVG(relation, variant = 0) {
    const definition = lineDefinition(relation);
    const rotation = variant % 2 ? -6 : 6;
    const rightAngle = relation === 'perpendicular'
        ? '<path d="M 140 90 L 158 90 L 158 72 L 140 72" class="geometry-visual__right-angle"/>'
        : '';
    const parallelMarks = relation === 'parallel'
        ? '<path d="M 104 42 l 10 12 M 170 42 l 10 12 M 104 96 l 10 12 M 170 96 l 10 12" class="geometry-visual__parallel-mark"/>'
        : '';
    return svgShell('geometry-visual--lines', 'Hai đường thẳng cần nhận biết mối quan hệ', `<g transform="rotate(${rotation} 140 75)">${linePath(definition.first, 'geometry-visual__line geometry-visual__line--primary')}${linePath(definition.second, 'geometry-visual__line geometry-visual__line--secondary')}${rightAngle}${parallelMarks}<circle cx="140" cy="90" r="4" class="geometry-visual__vertex"/></g><text x="28" y="136" class="geometry-visual__label">AB</text><text x="150" y="20" class="geometry-visual__label">CD</text>`);
}

function gridCoordinates(relation) {
    return {
        perpendicular: { first: [2, 4, 10, 4], second: [6, 1, 6, 7], angle: 90, intersects: true, parallel: false },
        parallel: { first: [1, 2, 11, 2], second: [1, 6, 11, 6], angle: 0, intersects: false, parallel: true },
        intersecting: { first: [1, 7, 10, 1], second: [1, 1, 10, 6], angle: 58, intersects: true, parallel: false },
        separate: { first: [1, 2, 5, 7], second: [7, 1, 11, 4], angle: 32, intersects: false, parallel: false }
    }[relation];
}

function gridLine([x1, y1, x2, y2], scale = 18, offsetX = 38, offsetY = 18) {
    return [x1, y1, x2, y2].map((value, index) => index % 2 === 0 ? offsetX + value * scale : offsetY + value * scale);
}

function renderGridSVG(relation, variant = 0) {
    const definition = gridCoordinates(relation);
    const grid = [0, 1, 2, 3, 4, 5, 6, 7].map(index => `<line x1="${38 + index * 18}" y1="18" x2="${38 + index * 18}" y2="144" class="geometry-visual__grid-line"/><line x1="38" y1="${18 + index * 18}" x2="236" y2="${18 + index * 18}" class="geometry-visual__grid-line"/>`).join('');
    const first = gridLine(definition.first);
    const second = gridLine(definition.second);
    const rightAngle = relation === 'perpendicular' ? '<path d="M 146 90 L 158 90 L 158 78 L 146 78" class="geometry-visual__right-angle"/>' : '';
    const parallelMarks = relation === 'parallel' ? '<path d="M 112 48 l 8 8 M 112 120 l 8 8" class="geometry-visual__parallel-mark"/>' : '';
    const marker = variant % 2 ? '<circle cx="140" cy="81" r="3" class="geometry-visual__point"/>' : '';
    return svgShell('geometry-visual--grid', 'Lưới ô vuông với hai đoạn thẳng AB và CD', `<g>${grid}</g><line x1="${first[0]}" y1="${first[1]}" x2="${first[2]}" y2="${first[3]}" class="geometry-visual__line geometry-visual__line--primary"/><line x1="${second[0]}" y1="${second[1]}" x2="${second[2]}" y2="${second[3]}" class="geometry-visual__line geometry-visual__line--secondary"/>${rightAngle}${parallelMarks}${marker}<text x="28" y="14" class="geometry-visual__label">A—B</text><text x="242" y="14" class="geometry-visual__label">C—D</text>`);
}

function relationPart(focus, relation, mode, random, variant = 0) {
    const asksPerpendicular = focus === 'perpendicular';
    const correct = asksPerpendicular ? relation === 'perpendicular' : relation === 'parallel';
    const options = asksPerpendicular ? ['Vuông góc', 'Không vuông góc'] : ['Song song', 'Không song song'];
    const answer = correct ? options[0] : options[1];
    const visual = mode === 'grid' ? renderGridSVG(relation, variant) : renderLinePairSVG(relation, variant);
    return {
        kind: mode === 'grid' ? 'grid-relation' : 'line-relation',
        prompt: asksPerpendicular ? 'Hai đường thẳng trong hình có vuông góc không?' : 'Hai đường thẳng trong hình có song song không?',
        answer,
        options: shuffle(options, random),
        explanation: correct
            ? `Hai đường thẳng ${RELATION_LABELS[relation]}; ${asksPerpendicular ? 'góc tạo thành là 90°' : 'chúng không gặp nhau và luôn cách đều nhau'}.`
            : `Hai đường thẳng ${RELATION_LABELS[relation]}, nên không thể kết luận là ${asksPerpendicular ? 'vuông góc' : 'song song'}.`,
        visual,
        geometry: {
            mode,
            relation,
            angle: lineDefinition(relation).angle,
            intersects: lineDefinition(relation).intersects,
            parallel: lineDefinition(relation).parallel,
            gridLines: mode === 'grid' ? [gridCoordinates(relation).first, gridCoordinates(relation).second] : undefined
        }
    };
}

function relationQuestion(templateId, focus, mode, random) {
    const relations = shuffle(RELATIONS, random);
    const subquestions = relations.map((relation, index) => ({ label: labels[index], ...relationPart(focus, relation, mode, random, index) }));
    const prompt = focus === 'perpendicular'
        ? 'Nhận biết hai đường thẳng vuông góc:'
        : 'Nhận biết hai đường thẳng song song:';
    const question = createFourPartMultipleChoiceQuestion(
        templateId,
        prompt,
        subquestions,
        'Quan sát giao điểm, góc vuông và hướng của hai đường thẳng; không chỉ dựa vào màu sắc của hình.',
        { question: prompt, focus, mode }
    );
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

const SHAPE_GEOMETRY = {
    parallelogram: { points: '42,112 92,34 232,34 182,112', parallelPairs: 2, equalSides: false, answer: 'Hình bình hành' },
    rhombus: { points: '137,20 222,75 137,130 52,75', parallelPairs: 2, equalSides: true, answer: 'Cả hình bình hành và hình thoi' },
    rectangle: { points: '48,36 224,36 224,114 48,114', parallelPairs: 2, equalSides: false, answer: 'Hình bình hành' },
    trapezoid: { points: '62,112 94,36 198,36 226,112', parallelPairs: 1, equalSides: false, answer: 'Không phải cả hai' }
};

function renderQuadrilateralSVG(shapeKind) {
    const shape = SHAPE_GEOMETRY[shapeKind];
    const rhombusMarks = shapeKind === 'rhombus'
        ? '<path d="M 91 46 l 10 14 M 181 46 l -10 14 M 181 104 l -10 -14 M 91 104 l 10 -14" class="geometry-visual__equal-mark"/>'
        : '';
    const parallelMarks = shape.parallelPairs === 2
        ? '<path d="M 100 32 l 10 12 M 178 32 l 10 12 M 100 118 l 10 -12 M 178 118 l 10 -12" class="geometry-visual__parallel-mark"/>'
        : '';
    return svgShell('geometry-visual--quadrilateral', 'Một tứ giác cần nhận biết', `<polygon points="${shape.points}" class="geometry-visual__polygon geometry-visual__polygon--${shapeKind}"/>${rhombusMarks}${parallelMarks}<text x="34" y="141" class="geometry-visual__label">${SHAPE_LABELS[shapeKind]}</text>`);
}

function shapePart(shapeKind, random, variant = 0) {
    const shape = SHAPE_GEOMETRY[shapeKind];
    return {
        kind: 'quadrilateral',
        prompt: 'Hình dưới đây thuộc nhóm hình nào?',
        answer: shape.answer,
        options: shuffle(QUAD_OPTIONS, random),
        explanation: shapeKind === 'rhombus'
            ? 'Hình thoi có bốn cạnh bằng nhau và cũng có hai cặp cạnh đối diện song song.'
            : shapeKind === 'trapezoid'
                ? 'Hình này chỉ có một cặp cạnh song song nên không thuộc hai nhóm đang ôn.'
                : 'Hình có hai cặp cạnh đối diện song song nên là hình bình hành.',
        visual: renderQuadrilateralSVG(shapeKind),
        geometry: {
            mode: 'quadrilateral',
            shapeKind,
            points: shape.points.split(' ').map(point => point.split(',').map(Number)),
            parallelPairs: shape.parallelPairs,
            equalSides: shape.equalSides,
            variant
        }
    };
}

function generateQuadrilateralQuestion(config = {}, random = Math.random) {
    const shapes = configuredList(config, 'allowedShapes', SHAPES, SHAPES, 'Bài 31 cần chọn ít nhất một loại hình hợp lệ.');
    const selected = Array.from({ length: 4 }, (_, index) => shapes[index % shapes.length]);
    const subquestions = selected.map((shape, index) => ({ label: labels[index], ...shapePart(shape, random, index) }));
    const prompt = 'Bài 31 · Nhận biết hình bình hành và hình thoi:';
    const question = createFourPartMultipleChoiceQuestion(
        'g4-m-quad-classify',
        prompt,
        subquestions,
        'Dựa vào số cặp cạnh đối diện song song và dấu hiệu bốn cạnh bằng nhau để nhận biết hình.',
        { question: prompt, allowedShapes: shapes.join(', ') }
    );
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

function reviewPart(skill, random) {
    const source = skill === 'b27'
        ? relationPart('perpendicular', pick(RELATIONS, random), 'line', random)
        : skill === 'b28'
            ? relationPart('perpendicular', pick(RELATIONS, random), 'grid', random)
            : skill === 'b29'
                ? relationPart('parallel', pick(RELATIONS, random), 'line', random)
                : skill === 'b30'
                    ? relationPart('parallel', pick(RELATIONS, random), 'grid', random)
                    : shapePart(pick(SHAPES, random), random);
    return {
        ...source,
        skill,
        skillLabel: SKILL_LABELS[skill],
        lesson: LESSONS[skill],
        prompt: `${SKILL_LABELS[skill]} · ${source.prompt}`
    };
}

function generateReview(config = {}, random = Math.random) {
    const skills = configuredList(config, 'skills', REVIEW_SKILLS.slice(0, 4), REVIEW_SKILLS, 'Bộ ôn tập Bài 27 đến Bài 31 cần đúng bốn kỹ năng hợp lệ.');
    if (skills.length !== 4) throw new Error('Bộ ôn tập Bài 27 đến Bài 31 cần đúng bốn kỹ năng hợp lệ.');
    const subquestions = skills.map((skill, index) => ({ label: labels[index], ...reviewPart(skill, random) }));
    const prompt = 'Luyện tập chung Bài 27 đến Bài 31:';
    const question = createFourPartMultipleChoiceQuestion(
        'geometry.hk1_review_b27_b31',
        prompt,
        subquestions,
        'Ôn nhận biết vuông góc, song song, thực hành trên lưới ô vuông và hình bình hành/hình thoi theo nhãn Bài học.',
        { question: prompt, skills: skills.join(', ') }
    );
    question.topic = TOPIC;
    question.partAnswerCounts = [1, 1, 1, 1];
    return question;
}

return {
    'g4-m-perpendicular-identify': (config = {}, random = Math.random) => relationQuestion('g4-m-perpendicular-identify', 'perpendicular', 'line', random),
    'g4-m-perpendicular-grid-practice': (config = {}, random = Math.random) => relationQuestion('g4-m-perpendicular-grid-practice', 'perpendicular', 'grid', random),
    'g4-m-parallel-identify': (config = {}, random = Math.random) => relationQuestion('g4-m-parallel-identify', 'parallel', 'line', random),
    'g4-m-parallel-grid-practice': (config = {}, random = Math.random) => relationQuestion('g4-m-parallel-grid-practice', 'parallel', 'grid', random),
    'g4-m-quad-classify': generateQuadrilateralQuestion,
    'geometry.hk1_review_b27_b31': generateReview
};
}));
