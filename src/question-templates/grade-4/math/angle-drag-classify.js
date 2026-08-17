;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-drag-classify'] = generate;
    root.Grade4MathTemplateGenerators['angle.drag_classify'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle }) {

const ANGLE_TYPES = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'];

function renderSingleAngleSVG(type, random) {
    let spanDeg;
    if (type === 'Góc nhọn') {
        const acuteAngles = [35, 45, 50, 60, 70];
        spanDeg = acuteAngles[randomInt(0, acuteAngles.length - 1, random)];
    } else if (type === 'Góc vuông') {
        spanDeg = 90;
    } else if (type === 'Góc tù') {
        const obtuseAngles = [110, 120, 130, 140, 150];
        spanDeg = obtuseAngles[randomInt(0, obtuseAngles.length - 1, random)];
    } else {
        spanDeg = 180;
    }

    // Góc xoay cơ bản ngẫu nhiên để hình phong phú
    const baseRotationDeg = randomInt(0, 7, random) * 45;
    const rad1 = (baseRotationDeg * Math.PI) / 180;
    const rad2 = ((baseRotationDeg - spanDeg) * Math.PI) / 180;

    const cx = 50;
    const cy = 40;
    const len = 34;

    const x1 = cx + len * Math.cos(rad1);
    const y1 = cy + len * Math.sin(rad1);
    const x2 = cx + len * Math.cos(rad2);
    const y2 = cy + len * Math.sin(rad2);

    let extraMark = '';
    if (type === 'Góc vuông') {
        const markLen = 9;
        const mx1 = cx + markLen * Math.cos(rad1);
        const my1 = cy + markLen * Math.sin(rad1);
        const mx2 = cx + markLen * Math.cos(rad2);
        const my2 = cy + markLen * Math.sin(rad2);
        const cornerX = mx1 + mx2 - cx;
        const cornerY = my1 + my2 - cy;
        extraMark = `<path d="M ${mx1.toFixed(1)},${my1.toFixed(1)} L ${cornerX.toFixed(1)},${cornerY.toFixed(1)} L ${mx2.toFixed(1)},${my2.toFixed(1)}" fill="none" stroke="#e11d48" stroke-width="1.8"/>`;
    }

    return `
    <svg viewBox="0 0 100 80" width="100" height="80" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:2px;">
        <line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
        ${extraMark}
        <circle cx="${cx}" cy="${cy}" r="3.5" fill="#0369a1"/>
    </svg>`;
}

function generateAngleDragClassify(config = {}, random = Math.random) {
    // 4 góc gồm đủ 4 loại nhọn, vuông, tù, bẹt
    const items = shuffle(ANGLE_TYPES, random).map((type, index) => {
        const label = String.fromCharCode(97 + index); // a, b, c, d
        const svg = renderSingleAngleSVG(type, random);
        return { label, type, svg };
    });

    const rows = items.map(item => `<div style="display:inline-flex;align-items:center;margin:6px 12px;gap:8px;"><b style="font-size:1.1rem;">${item.label})</b> ${item.svg} <span style="font-size:1.2rem;color:#eab308;font-weight:bold;">➔</span> ___</div>`).join('<br>');

    const prompt = `Kéo thả tên loại góc thích hợp vào ô trống bên cạnh mỗi hình vẽ:<br>${rows}`;

    const answers = items.map(item => item.type);
    const explanation = `Đáp án các góc lần lượt là: ${items.map(item => `${item.label}) ${item.type}`).join('; ')}.`;

    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc',
        type: 'Kéo thả',
        templateId: 'g4-m-angle-drag-classify',
        q: prompt,
        options: ANGLE_TYPES,
        ans: answers.join(', '),
        explanation,
        templateVariables: {
            answers: answers.join(', ')
        }
    };
}

return generateAngleDragClassify;
}));
