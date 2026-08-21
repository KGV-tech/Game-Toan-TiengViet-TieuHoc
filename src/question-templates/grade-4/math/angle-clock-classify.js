;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['g4-m-angle-clock-classify'] = generate;
    root.Grade4MathTemplateGenerators['angle.clock_classify'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle }) {

const ANGLE_TYPES = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'];

const CLOCK_HOUR_POOLS = {
    'Góc nhọn': [1, 2, 10, 11],
    'Góc vuông': [3, 9],
    'Góc tù': [4, 5, 7, 8],
    'Góc bẹt': [6]
};

function renderClockSVG(hour) {
    const cx = 50;
    const cy = 50;
    const r = 40;

    // Kim phút chỉ số 12 (thẳng đứng hướng lên)
    const minX = cx;
    const minY = cy - 30;

    // Kim giờ chỉ số hour (mỗi giờ = 30 độ)
    const hourRad = ((hour * 30 - 90) * Math.PI) / 180;
    const hourLen = 22;
    const hourX = cx + hourLen * Math.cos(hourRad);
    const hourY = cy + hourLen * Math.sin(hourRad);

    // 12 chữ số trên mặt đồng hồ
    let numbersSvg = '';
    for (let h = 1; h <= 12; h++) {
        const numRad = ((h * 30 - 90) * Math.PI) / 180;
        const numDist = 32;
        const nx = cx + numDist * Math.cos(numRad);
        const ny = cy + numDist * Math.sin(numRad) + 3.5;
        numbersSvg += `<text x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" font-size="8" font-weight="bold" fill="#475569" text-anchor="middle">${h}</text>`;
    }

    return `
    <svg viewBox="0 0 100 100" width="90" height="90" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;display:inline-block;background:#ffffff;border:2px solid #cbd5e1;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.08);margin:2px;">
        <!-- Vòng viền đồng hồ -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#3b82f6" stroke-width="3"/>
        ${numbersSvg}
        <!-- Kim phút (màu xanh dương) -->
        <line x1="${cx}" y1="${cy}" x2="${minX}" y2="${minY}" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Kim giờ (màu đỏ cam) -->
        <line x1="${cx}" y1="${cy}" x2="${hourX.toFixed(1)}" y2="${hourY.toFixed(1)}" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Tâm kim -->
        <circle cx="${cx}" cy="${cy}" r="3" fill="#1e293b"/>
    </svg>`;
}

function generateAngleClockClassify(config = {}, random = Math.random) {
    const selectedAngleTypes = shuffle(ANGLE_TYPES, random);

    const items = selectedAngleTypes.map((type, index) => {
        const label = String.fromCharCode(97 + index);
        const pool = CLOCK_HOUR_POOLS[type];
        const hour = pool[randomInt(0, pool.length - 1, random)];
        const svg = renderClockSVG(hour);
        return { label, type, hour, svg };
    });

    const rows = items.map(item => `<div style="display:inline-flex;align-items:center;margin:6px 12px;gap:8px;"><b style="font-size:1.1rem;">${item.label})</b> ${item.svg} <span style="font-size:0.95rem;color:#334155;">(${item.hour} giờ)</span> <span style="font-size:1.2rem;color:#eab308;font-weight:bold;">➔</span> ___</div>`).join('<br>');

    const prompt = `Quan sát các mặt đồng hồ dưới đây rồi kéo thả tên loại góc thích hợp (tạo bởi kim giờ và kim phút) vào ô trống tương ứng:<br>${rows}`;

    const answers = items.map(item => item.type);
    const explanation = `Tại các mốc giờ đúng: ${items.map(item => `${item.label}) Lúc ${item.hour} giờ hai kim tạo thành ${item.type.toLowerCase()}`).join('; ')}.`;

    return {
        classlevel: 'Lớp 4',
        subject: 'Toán',
        semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc',
        type: 'Kéo thả',
        templateId: 'g4-m-angle-clock-classify',
        q: prompt,
        instruction: 'Quan sát các mặt đồng hồ rồi kéo thả tên loại góc thích hợp vào ô trống tương ứng:',
        angleItems: items,
        options: ANGLE_TYPES,
        ans: answers.join(', '),
        explanation,
        templateVariables: {
            answers: answers.join(', ')
        }
    };
}

return generateAngleClockClassify;
}));
