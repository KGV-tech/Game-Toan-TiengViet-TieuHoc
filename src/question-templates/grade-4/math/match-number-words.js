;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generate = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generate;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    root.Grade4MathTemplateGenerators['number.match_number_words'] = generate;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {
    const ones = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

    function seededRandom(seed) {
        let value = seed >>> 0;
        return () => {
            value = (value * 1664525 + 1013904223) >>> 0;
            return value / 0x100000000;
        };
    }

    function readTriplet(value, forceHundreds = false) {
        const hundreds = Math.floor(value / 100);
        const tens = Math.floor(value / 10) % 10;
        const units = value % 10;
        const words = [];
        if (hundreds) words.push(ones[hundreds], 'trăm');
        else if (forceHundreds && value) words.push('không', 'trăm');
        if (tens >= 2) {
            words.push(ones[tens], 'mươi');
            if (units === 1) words.push('mốt');
            else if (units === 4) words.push('tư');
            else if (units === 5) words.push('lăm');
            else if (units) words.push(ones[units]);
        } else if (tens === 1) {
            words.push('mười');
            if (units === 5) words.push('lăm');
            else if (units) words.push(ones[units]);
        } else if (units) {
            if (words.length) words.push('linh');
            words.push(ones[units]);
        }
        return words.join(' ') || 'không';
    }

    function readNumber(value) {
        if (!Number.isInteger(value) || value < 0 || value >= 1000000000) throw new Error('Số phải thuộc khoảng từ 0 đến 999 999 999.');
        if (value < 1000) return readTriplet(value).replace(/^./, char => char.toUpperCase());
        const millions = Math.floor(value / 1000000);
        const thousands = Math.floor(value / 1000) % 1000;
        const units = value % 1000;
        const parts = [];
        if (millions) parts.push(readTriplet(millions), 'triệu');
        if (thousands) parts.push(readTriplet(thousands, Boolean(millions)), 'nghìn');
        if (units) parts.push(readTriplet(units, Boolean(millions || thousands)));
        return parts.join(' ').replace(/^./, char => char.toUpperCase());
    }

    function parseShapes(raw) {
        const shapes = raw ?? ['5:4', '4:5'];
        if (!Array.isArray(shapes) || !shapes.length) throw new Error('Cần chọn ít nhất một dạng ghép.');
        return shapes.map(item => {
            const match = String(item).match(/^(\d+):(\d+)$/);
            if (!match) throw new Error('Dạng ghép phải có dạng 5:4.');
            const shape = [Number(match[1]), Number(match[2])];
            if (Math.min(...shape) < 1 || Math.abs(shape[0] - shape[1]) !== 1) throw new Error('Hai vế của dạng ghép phải lệch đúng một mục.');
            return shape;
        });
    }

    function pickDigit(digits, weights, random) {
        if (!weights) return digits[randomInt(0, digits.length - 1, random)];
        const total = digits.reduce((sum, digit) => sum + Number(weights[digit] || 0), 0);
        if (total <= 0) throw new Error('Tỷ lệ sinh số phải có tổng lớn hơn 0.');
        let point = random() * total;
        for (const digit of digits) {
            point -= Number(weights[digit] || 0);
            if (point < 0) return digit;
        }
        return digits[digits.length - 1];
    }

    function buildDigitPlan(digits, count, strategy, weights, random) {
        if (strategy === 'cycle') return Array.from({ length: count }, (_, index) => digits[index % digits.length]);
        if (strategy === 'random') return Array.from({ length: count }, () => pickDigit(digits, weights, random));
        const plan = shuffle(digits, random).slice(0, count);
        while (plan.length < count) plan.push(pickDigit(digits, weights, random));
        return shuffle(plan, random);
    }

    return function generateMatchNumberWords(config = {}, random = Math.random) {
        if (config.seed !== null && config.seed !== undefined) {
            if (!Number.isInteger(config.seed)) throw new Error('Seed phải là số nguyên.');
            random = seededRandom(config.seed);
        }
        const digits = [...new Set(config.digits ?? [7, 8, 9])];
        const strategy = config.digitStrategy ?? 'balanced';
        if (!digits.length || digits.some(digit => !Number.isInteger(digit) || digit < 1 || digit > 9) || !['balanced', 'random', 'cycle'].includes(strategy)) throw new Error('Cấu hình đối chiếu số – chữ không hợp lệ.');
        const shapes = parseShapes(config.shapes);
        const [leftCount, rightCount] = shapes[randomInt(0, shapes.length - 1, random)];
        const total = Math.max(leftCount, rightCount);
        const matchCount = Math.min(leftCount, rightCount);
        let values;
        let hasRequiredPrefix = false;
        for (let attempt = 0; attempt < 1000; attempt++) {
            const digitPlan = buildDigitPlan(digits, total, strategy, config.digitWeights, random);
            const numbers = new Set();
            while (numbers.size < total) numbers.add(randomInt(10 ** (digitPlan[numbers.size] - 1), 10 ** digitPlan[numbers.size] - 1, random));
            values = [...numbers];
            const prefixes = values.slice(0, matchCount).map(value => readNumber(value).toLowerCase().split(' ').slice(0, config.prefixWords || 0).join(' '));
            hasRequiredPrefix = !config.prefixWords || new Set(prefixes).size === 1;
            if (hasRequiredPrefix) break;
        }
        if (!values || !hasRequiredPrefix) throw new Error('Không thể tạo câu với cấu hình đã chọn.');
        const matched = values.slice(0, matchCount);
        const left = shuffle(values.slice(0, leftCount), random);
        const right = shuffle(values.slice(0, rightCount), random);
        return {
            classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '1. Số tự nhiên',
            type: 'Đối chiếu trùng khớp', templateId: 'number.match_number_words',
            q: config.prompt || 'Hãy nối mỗi số với cách đọc đúng.',
            options: [left.map(formatNumber).join(', '), right.map(readNumber).join(', ')],
            ans: shuffle(matched, random).map(value => `${formatNumber(value)}:${readNumber(value)}`).join(', '),
            explanation: 'Ghép mỗi số với cách đọc tương ứng của số đó.'
        };
    };
}));
