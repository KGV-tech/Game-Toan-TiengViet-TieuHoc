;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-count-in-polygon'] = generate;
    root.Grade4MathTemplateGenerators['angle.count_in_polygon'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, createFillBlankQuestion }) {

function renderPolygonHouseSVG(variant, random) {
    // Ngũ giác hình ngôi nhà / mũi tên
    const isNarrow = variant === 0;
    const topY = isNarrow ? 20 : 30;
    const midY = isNarrow ? 70 : 80;
    const botY = 140;
    const leftX = 50;
    const rightX = 190;
    const midX = 120;

    const svg = `
    <svg viewBox="0 0 240 160" width="240" height="160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:inline-block;">
        <!-- Đa giác ABCDE -->
        <polygon points="${midX},${topY} ${rightX},${midY} ${rightX},${botY} ${leftX},${botY} ${leftX},${midY}" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" stroke-linejoin="round"/>
        
        <!-- Ký hiệu góc vuông tại C và D -->
        <path d="M ${rightX - 14},${botY} L ${rightX - 14},${botY - 14} L ${rightX},${botY - 14}" fill="none" stroke="#e11d48" stroke-width="2"/>
        <path d="M ${leftX + 14},${botY} L ${leftX + 14},${botY - 14} L ${leftX},${botY - 14}" fill="none" stroke="#e11d48" stroke-width="2"/>
        
        <!-- Cung góc nhọn tại đỉnh A -->
        <path d="M 112,42 A 18 18 0 0 0 128,42" fill="none" stroke="#f59e0b" stroke-width="2"/>
        
        <!-- Cung góc tù tại đỉnh B và E -->
        <path d="M ${rightX - 16},${midY} A 16 16 0 0 0 ${rightX - 6},${midY + 16}" fill="none" stroke="#8b5cf6" stroke-width="2"/>
        <path d="M ${leftX + 6},${midY + 16} A 16 16 0 0 0 ${leftX + 16},${midY}" fill="none" stroke="#8b5cf6" stroke-width="2"/>

        <!-- Tên các đỉnh -->
        <text x="${midX}" y="${topY - 6}" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">A</text>
        <text x="${rightX + 10}" y="${midY}" font-size="14" font-weight="bold" fill="#0f172a">B</text>
        <text x="${rightX + 10}" y="${botY + 6}" font-size="14" font-weight="bold" fill="#0f172a">C</text>
        <text x="${leftX - 14}" y="${botY + 6}" font-size="14" font-weight="bold" fill="#0f172a">D</text>
        <text x="${leftX - 14}" y="${midY}" font-size="14" font-weight="bold" fill="#0f172a">E</text>
    </svg>`;

    return {
        svg,
        counts: { acute: 1, right: 2, obtuse: 2, straight: 0 },
        explanation: 'Trong hình ngũ giác ABCDE: đỉnh A là góc nhọn (1 góc); đỉnh C và D là góc vuông (2 góc); đỉnh B và E là góc tù (2 góc); không có góc bẹt (0 góc).'
    };
}

function renderTrapezoidWithHeightSVG() {
    // Hình thang vuông ABCD có chiều cao AH
    const svg = `
    <svg viewBox="0 0 260 160" width="260" height="160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:inline-block;">
        <!-- Hình thang vuông ABCD -->
        <polygon points="50,30 150,30 220,130 50,130" fill="#fef3c7" stroke="#d97706" stroke-width="3" stroke-linejoin="round"/>
        <!-- Đường cao BH -->
        <line x1="150" y1="30" x2="150" y2="130" stroke="#d97706" stroke-width="2" stroke-dasharray="4,4"/>
        
        <!-- Ký hiệu góc vuông -->
        <path d="M 50,44 L 64,44 L 64,30" fill="none" stroke="#e11d48" stroke-width="2"/>
        <path d="M 50,116 L 64,116 L 64,130" fill="none" stroke="#e11d48" stroke-width="2"/>
        <path d="M 150,116 L 164,116 L 164,130" fill="none" stroke="#e11d48" stroke-width="2"/>
        <path d="M 136,130 L 136,116 L 150,116" fill="none" stroke="#e11d48" stroke-width="2"/>
        
        <!-- Tên các đỉnh -->
        <text x="40" y="28" font-size="14" font-weight="bold" fill="#0f172a">A</text>
        <text x="155" y="25" font-size="14" font-weight="bold" fill="#0f172a">B</text>
        <text x="230" y="138" font-size="14" font-weight="bold" fill="#0f172a">C</text>
        <text x="146" y="148" font-size="14" font-weight="bold" fill="#0f172a">H</text>
        <text x="36" y="138" font-size="14" font-weight="bold" fill="#0f172a">D</text>
    </svg>`;

    // Xét tất cả các tia đã vẽ, kể cả tại chân đường cao H:
    // A và D: 2 góc vuông; H: DHB, BHC là 2 góc vuông và DHC là 1 góc bẹt.
    // Đỉnh B: tù (1), đỉnh C: nhọn (1).
    return {
        svg,
        counts: { acute: 1, right: 4, obtuse: 1, straight: 1 },
        explanation: 'Trong hình: góc đỉnh C là góc nhọn (1 góc); góc đỉnh A, đỉnh D, góc DHB và góc BHC là góc vuông (4 góc); góc đỉnh B là góc tù (1 góc); góc DHC tại H là góc bẹt (1 góc).'
    };
}

function renderTriangleWithAltitudeSVG() {
    // Hình tam giác ABC có đường cao AH
    const svg = `
    <svg viewBox="0 0 260 160" width="260" height="160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:inline-block;">
        <polygon points="120,25 40,135 220,135" fill="#f0fdf4" stroke="#16a34a" stroke-width="3" stroke-linejoin="round"/>
        <line x1="120" y1="25" x2="120" y2="135" stroke="#16a34a" stroke-width="2.5"/>
        
        <!-- Ký hiệu góc vuông tại H -->
        <path d="M 120,122 L 108,122 L 108,135" fill="none" stroke="#e11d48" stroke-width="2"/>
        <path d="M 120,122 L 132,122 L 132,135" fill="none" stroke="#e11d48" stroke-width="2"/>
        
        <!-- Tên các đỉnh -->
        <text x="120" y="18" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">A</text>
        <text x="25" y="142" font-size="14" font-weight="bold" fill="#0f172a">B</text>
        <text x="120" y="152" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">H</text>
        <text x="230" y="142" font-size="14" font-weight="bold" fill="#0f172a">C</text>
    </svg>`;

    // Trong hình vẽ có:
    // Các góc nhọn: góc đỉnh B (ABH), góc đỉnh C (ACH), 2 góc đỉnh A (BAH, CAH), và góc lớn BAC (nhọn) -> 5 góc nhọn
    // Các góc vuông: 2 góc vuông tại H (AHB, AHC) -> 2 góc vuông
    // Các góc tù: 0 góc tù
    // Góc bẹt: góc đỉnh H cạnh HB, HC (BHC) -> 1 góc bẹt
    return {
        svg,
        counts: { acute: 5, right: 2, obtuse: 0, straight: 1 },
        explanation: 'Trong hình vẽ: có 5 góc nhọn (góc B, góc C, góc BAH, góc CAH và góc BAC); 2 góc vuông (góc AHB và góc AHC); 0 góc tù; 1 góc bẹt (góc BHC đỉnh H cạnh HB, HC).'
    };
}

function renderKiteShapeSVG() {
    // Tứ giác hình con diều MNPQ
    const svg = `
    <svg viewBox="0 0 240 160" width="240" height="160" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:inline-block;">
        <polygon points="120,20 190,85 120,145 50,85" fill="#fdf2f8" stroke="#db2777" stroke-width="3" stroke-linejoin="round"/>
        
        <!-- Cung góc nhọn đỉnh M và P -->
        <path d="M 112,38 A 16 16 0 0 0 128,38" fill="none" stroke="#f59e0b" stroke-width="2"/>
        <path d="M 112,128 A 16 16 0 0 1 128,128" fill="none" stroke="#f59e0b" stroke-width="2"/>
        
        <!-- Cung góc tù đỉnh N và Q -->
        <path d="M 175,76 A 18 18 0 0 1 175,94" fill="none" stroke="#8b5cf6" stroke-width="2"/>
        <path d="M 65,76 A 18 18 0 0 0 65,94" fill="none" stroke="#8b5cf6" stroke-width="2"/>
        
        <!-- Tên các đỉnh -->
        <text x="120" y="14" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">M</text>
        <text x="200" y="90" font-size="14" font-weight="bold" fill="#0f172a">N</text>
        <text x="120" y="158" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">P</text>
        <text x="35" y="90" font-size="14" font-weight="bold" fill="#0f172a">Q</text>
    </svg>`;

    return {
        svg,
        counts: { acute: 2, right: 0, obtuse: 2, straight: 0 },
        explanation: 'Trong tứ giác MNPQ: có 2 góc nhọn (tại đỉnh M và đỉnh P); 0 góc vuông; 2 góc tù (tại đỉnh N và đỉnh Q); 0 góc bẹt.'
    };
}

function generateAngleCountInPolygon(config = {}, random = Math.random) {
    const renderers = [
        () => renderPolygonHouseSVG(0, random),
        () => renderPolygonHouseSVG(1, random),
        () => renderTrapezoidWithHeightSVG(),
        () => renderTriangleWithAltitudeSVG(),
        () => renderKiteShapeSVG()
    ];

    const selectedShape = renderers[randomInt(0, renderers.length - 1, random)]();
    const { svg, counts, explanation } = selectedShape;

    const prompt = `<div style="text-align:center;margin:8px 0 14px 0;">${svg}</div>Quan sát hình vẽ trên và cho biết hình có bao nhiêu:<br>a) ___ góc nhọn<br>b) ___ góc vuông<br>c) ___ góc tù<br>d) ___ góc bẹt`;

    const answers = [String(counts.acute), String(counts.right), String(counts.obtuse), String(counts.straight)];

    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc',
        type: 'Điền khuyết',
        templateId: 'g4-m-angle-count-in-polygon',
        q: prompt,
        instruction: 'Quan sát hình vẽ và điền số lượng từng loại góc.',
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
            acute: counts.acute,
            right: counts.right,
            obtuse: counts.obtuse,
            straight: counts.straight
        }
    };
}

return generateAngleCountInPolygon;
}));
