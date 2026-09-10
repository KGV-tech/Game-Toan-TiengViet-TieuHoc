;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const api = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.Grade4MathAngleShared = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle }) {

const DEFAULT_MEASURE_DEGREES = Object.freeze([20, 30, 40, 45, 60, 75, 90, 105, 120, 135, 150, 160]);
const ANGLE_TYPES = Object.freeze(['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt']);
const ANGLE_TYPE_KEYS = Object.freeze(['acute', 'right', 'obtuse', 'straight']);

function degreeLabel(value) {
    return `${value}°`;
}

function validateDegreePool(value) {
    if (value === undefined) return [...DEFAULT_MEASURE_DEGREES];
    if (!Array.isArray(value) || !value.length) throw new Error('Phạm vi số đo góc phải có ít nhất một số đo hợp lệ.');
    const pool = [...new Set(value.map(Number))];
    if (pool.some(item => !Number.isInteger(item) || item < 10 || item > 170 || item % 5 !== 0)) {
        throw new Error('Số đo góc phải là số nguyên theo bội 5, từ 10 độ đến 170 độ.');
    }
    return pool;
}

function pickFrom(items, random) {
    return items[randomInt(0, items.length - 1, random)];
}

function pickDistinctDegrees(pool, count, random) {
    const selected = [];
    const remaining = [...pool];
    while (selected.length < count) {
        const source = remaining.length ? remaining : pool;
        const value = pickFrom(source, random);
        selected.push(value);
        const index = remaining.indexOf(value);
        if (index >= 0) remaining.splice(index, 1);
    }
    return selected;
}

function measureOptions(correct, random) {
    const offsets = [5, -5, 10, -10, 15, -15, 20, -20, 25, -25, 30, -30, 40, -40];
    const candidates = [...DEFAULT_MEASURE_DEGREES, ...offsets.map(offset => correct + offset)]
        .filter(value => Number.isInteger(value) && value >= 10 && value <= 170 && value !== correct && value % 5 === 0);
    const distractors = [...new Set(shuffle(candidates, random))].slice(0, 3);
    if (distractors.length < 3) {
        for (let value = 10; value <= 170 && distractors.length < 3; value += 5) {
            if (value !== correct && !distractors.includes(value)) distractors.push(value);
        }
    }
    return shuffle([correct, ...distractors], random).map(degreeLabel);
}

function classificationOptions(random) {
    return shuffle(ANGLE_TYPES, random);
}

function polarPoint(cx, cy, radius, degreesFromLeft) {
    const radians = Math.PI - (degreesFromLeft * Math.PI / 180);
    return {
        x: cx + radius * Math.cos(radians),
        y: cy - radius * Math.sin(radians)
    };
}

function pointString(point) {
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
}

function renderProtractorSVG(degrees) {
    const cx = 140;
    const cy = 148;
    const outerRadius = 104;
    const tickMarkup = Array.from({ length: 19 }, (_, index) => {
        const tickDegrees = index * 10;
        const outer = polarPoint(cx, cy, outerRadius, tickDegrees);
        const inner = polarPoint(cx, cy, outerRadius - (tickDegrees % 30 === 0 ? 14 : 8), tickDegrees);
        return `<line x1="${inner.x.toFixed(1)}" y1="${inner.y.toFixed(1)}" x2="${outer.x.toFixed(1)}" y2="${outer.y.toFixed(1)}" class="angle-protractor__tick"/>`;
    }).join('');
    const labelMarkup = [0, 30, 60, 90, 120, 150, 180].map(labelDegrees => {
        const point = polarPoint(cx, cy, outerRadius - 25, labelDegrees);
        return `<text x="${point.x.toFixed(1)}" y="${(point.y + 4).toFixed(1)}" class="angle-protractor__label">${labelDegrees}</text>`;
    }).join('');
    const rayEnd = polarPoint(cx, cy, 88, degrees);
    const arcPoints = Array.from({ length: degrees / 5 + 1 }, (_, index) => pointString(polarPoint(cx, cy, 67, index * 5))).join(' ');

    return `<svg class="angle-visual angle-visual--protractor" viewBox="0 0 280 178" role="img" aria-label="Hình góc trên thước đo góc" xmlns="http://www.w3.org/2000/svg">
        <title>Thước đo góc và một góc cần đọc số đo</title>
        <path d="M 36 148 A 104 104 0 0 0 244 148" class="angle-protractor__body"/>
        <line x1="28" y1="148" x2="252" y2="148" class="angle-protractor__baseline"/>
        ${tickMarkup}
        ${labelMarkup}
        <polyline points="${arcPoints}" class="angle-protractor__arc"/>
        <line x1="${cx}" y1="${cy}" x2="${rayEnd.x.toFixed(1)}" y2="${rayEnd.y.toFixed(1)}" class="angle-protractor__ray"/>
        <circle cx="${cx}" cy="${cy}" r="5" class="angle-protractor__vertex"/>
    </svg>`;
}

function renderAngleSVG(degrees) {
    const cx = 140;
    const cy = 88;
    const radius = 78;
    const firstRay = polarPoint(cx, cy, radius, 0);
    const secondRay = polarPoint(cx, cy, radius, degrees);
    const arcPointCount = Math.max(2, Math.floor(degrees / 5) + 1);
    const arcPoints = degrees === 180
        ? ''
        : Array.from({ length: arcPointCount }, (_, index) => {
            const current = degrees * index / (arcPointCount - 1);
            return pointString(polarPoint(cx, cy, 43, current));
        }).join(' ');

    return `<svg class="angle-visual angle-visual--classify" viewBox="0 0 280 126" role="img" aria-label="Hình góc cần phân loại" xmlns="http://www.w3.org/2000/svg">
        <title>Hình góc cần nhận biết loại góc</title>
        <line x1="${cx}" y1="${cy}" x2="${firstRay.x.toFixed(1)}" y2="${firstRay.y.toFixed(1)}" class="angle-classify__ray"/>
        <line x1="${cx}" y1="${cy}" x2="${secondRay.x.toFixed(1)}" y2="${secondRay.y.toFixed(1)}" class="angle-classify__ray angle-classify__ray--accent"/>
        ${arcPoints ? `<polyline points="${arcPoints}" class="angle-classify__arc"/>` : ''}
        <circle cx="${cx}" cy="${cy}" r="5" class="angle-classify__vertex"/>
    </svg>`;
}

function angleTypeOf(degrees) {
    if (degrees === 180) return 'Góc bẹt';
    if (degrees === 90) return 'Góc vuông';
    return degrees < 90 ? 'Góc nhọn' : 'Góc tù';
}

function degreeForType(type, random) {
    const pools = {
        acute: [30, 45, 60],
        right: [90],
        obtuse: [120, 135, 150],
        straight: [180]
    };
    return pickFrom(pools[type] || pools.acute, random);
}

return {
    ANGLE_TYPES,
    ANGLE_TYPE_KEYS,
    DEFAULT_MEASURE_DEGREES,
    angleTypeOf,
    classificationOptions,
    degreeForType,
    degreeLabel,
    measureOptions,
    pickDistinctDegrees,
    renderAngleSVG,
    renderProtractorSVG,
    validateDegreePool,
    shuffle
};
}));
