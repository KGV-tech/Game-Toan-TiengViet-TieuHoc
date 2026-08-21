;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-count-eight-angles'] = generate;
    root.Grade4MathTemplateGenerators['angle.count_eight_angles'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle }) {

function createRandomAngleSpec(type, random) {
    let spanDeg;
    let baseRotationDeg;

    if (type === 'acute') {
        const spanChoices = [35, 45, 50, 60, 65];
        spanDeg = spanChoices[randomInt(0, spanChoices.length - 1, random)];
        const rotChoices = [0, 45, 90, 135, 180, 225, 270, 315];
        baseRotationDeg = rotChoices[randomInt(0, rotChoices.length - 1, random)];
    } else if (type === 'right') {
        spanDeg = 90;
        const rotChoices = [0, 90, 180, 270];
        baseRotationDeg = rotChoices[randomInt(0, rotChoices.length - 1, random)];
    } else if (type === 'obtuse') {
        const spanChoices = [115, 120, 130, 135, 145, 150];
        spanDeg = spanChoices[randomInt(0, spanChoices.length - 1, random)];
        const rotChoices = [0, 45, 90, 135, 180, 225, 270];
        baseRotationDeg = rotChoices[randomInt(0, rotChoices.length - 1, random)];
    } else {
        // straight
        spanDeg = 180;
        const rotChoices = [0, 30, 45, 90, 135];
        baseRotationDeg = rotChoices[randomInt(0, rotChoices.length - 1, random)];
    }

    return { type, spanDeg, baseRotationDeg };
}

function renderAngleInCellSVG(spec, cx, cy) {
    const { type, spanDeg, baseRotationDeg } = spec;
    const rad1 = (baseRotationDeg * Math.PI) / 180;
    const rad2 = ((baseRotationDeg - spanDeg) * Math.PI) / 180;
    const len = 36;

    const x1 = cx + len * Math.cos(rad1);
    const y1 = cy + len * Math.sin(rad1);
    const x2 = cx + len * Math.cos(rad2);
    const y2 = cy + len * Math.sin(rad2);

    let dot = '';
    if (type === 'straight') {
        dot = `<circle cx="${cx}" cy="${cy}" r="3" fill="#0284c7"/>`;
    }

    return `
        <line x1="${cx}" y1="${cy}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>
        ${dot}
    `;
}

function generateAngleCountEightAngles(config = {}, random = Math.random) {
    // Luôn đảm bảo tổng số lượng = 8 góc
    // Tạo cấu hình số lượng ngẫu nhiên hợp lý
    const distributions = [
        { acute: 3, right: 1, obtuse: 2, straight: 2 }, // Giống hệt mẫu SGK/VBT
        { acute: 4, right: 1, obtuse: 2, straight: 1 },
        { acute: 3, right: 2, obtuse: 2, straight: 1 },
        { acute: 2, right: 2, obtuse: 3, straight: 1 },
        { acute: 3, right: 2, obtuse: 1, straight: 2 }
    ];

    const dist = distributions[randomInt(0, distributions.length - 1, random)];
    const typesPool = [];
    for (let i = 0; i < dist.acute; i++) typesPool.push('acute');
    for (let i = 0; i < dist.right; i++) typesPool.push('right');
    for (let i = 0; i < dist.obtuse; i++) typesPool.push('obtuse');
    for (let i = 0; i < dist.straight; i++) typesPool.push('straight');

    const shuffledTypes = shuffle(typesPool, random);
    const specs = shuffledTypes.map(type => createRandomAngleSpec(type, random));

    // Vẽ lưới 8 góc (2 hàng x 4 cột)
    let cellsSvg = '';
    for (let index = 0; index < 8; index++) {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const cx = 70 + col * 135;
        const cy = 55 + row * 105;
        cellsSvg += renderAngleInCellSVG(specs[index], cx, cy);
    }

    const svg = `
    <svg viewBox="0 0 550 215" width="550" height="215" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:inline-block;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        ${cellsSvg}
    </svg>`;

    const prompt = `<div style="text-align:center;margin:8px 0 14px 0;">${svg}</div>Viết số thích hợp vào chỗ chấm.<br>Trong các góc trên có:<br>• ___ góc nhọn;<br>• ___ góc vuông;<br>• ___ góc tù;<br>• ___ góc bẹt.`;

    const answers = [String(dist.acute), String(dist.right), String(dist.obtuse), String(dist.straight)];
    const explanation = `Quan sát 8 góc trên hình vẽ: có ${dist.acute} góc nhọn (bé hơn góc vuông), ${dist.right} góc vuông (bằng 90°), ${dist.obtuse} góc tù (lớn hơn góc vuông và bé hơn góc bẹt), và ${dist.straight} góc bẹt (bằng 2 góc vuông).`;

    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc',
        type: 'Điền khuyết',
        templateId: 'g4-m-angle-count-eight-angles',
        q: prompt,
        instruction: 'Quan sát 8 góc dưới đây và điền số lượng mỗi loại góc.',
        angleVisual: svg,
        angleCountRows: [
            { label: 'a', text: 'góc nhọn' },
            { label: 'b', text: 'góc vuông' },
            { label: 'c', text: 'góc tù' },
            { label: 'd', text: 'góc bẹt' }
        ],
        options: [],
        ans: answers.join(', '),
        explanation,
        templateVariables: {
            acute: dist.acute,
            right: dist.right,
            obtuse: dist.obtuse,
            straight: dist.straight
        }
    };
}

return generateAngleCountEightAngles;
}));
