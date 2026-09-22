;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {

const LESSON = 'g4-math-hk1-b05';
const TOPIC = '1. Ôn tập và bổ sung';
const MAX_VALUE = 100000;
const DIFFICULTY_CAPS = Object.freeze({ easy: 1000, core: 10000, challenge: MAX_VALUE });
const DIFFICULTIES = Object.keys(DIFFICULTY_CAPS);
const FAMILY_MINIMUM_CAPS = Object.freeze({
    relation_total: 33,
    purchase_total: 200,
    divide_compare: 4,
    remaining: 5,
    ratio_total: 10,
    legs_constraint: 4,
    animal_total: 50
});

const CONTEXTS = Object.freeze({
    relation_total: Object.freeze({
        trees: { subject: 'Đội Một trồng được', second: 'Đội Hai trồng nhiều hơn Đội Một', third: 'Đội Ba trồng ít hơn Đội Hai', unit: 'cây', total: 'cả ba đội trồng được tất cả' },
        notebooks: { subject: 'Tổ Một có', second: 'Tổ Hai có nhiều hơn Tổ Một', third: 'Tổ Ba có ít hơn Tổ Hai', unit: 'quyển vở', total: 'cả ba tổ có tất cả' },
        fruits: { subject: 'Buổi sáng cửa hàng bán được', second: 'Buổi trưa bán nhiều hơn buổi sáng', third: 'Buổi chiều bán ít hơn buổi trưa', unit: 'kg hoa quả', total: 'cả ba buổi bán được tất cả' },
        products: { subject: 'Phân xưởng Một làm được', second: 'Phân xưởng Hai làm nhiều hơn Phân xưởng Một', third: 'Phân xưởng Ba làm ít hơn Phân xưởng Hai', unit: 'sản phẩm', total: 'cả ba phân xưởng làm được tất cả' }
    }),
    purchase_total: Object.freeze({
        notebooks: { first: 'quyển vở', second: 'hộp bút màu', person: 'Mai' },
        books: { first: 'quyển truyện', second: 'chiếc thước', person: 'Nam' },
        toys: { first: 'ô tô đồ chơi', second: 'con quay', person: 'Lan' },
        fruit_baskets: { first: 'giỏ táo', second: 'giỏ cam', person: 'Minh' }
    }),
    divide_compare: Object.freeze({
        fruit_trays: { first: 'táo đỏ', second: 'táo xanh', container: 'khay' },
        flower_bundles: { first: 'hoa hồng', second: 'hoa cúc', container: 'bó' },
        pencil_boxes: { first: 'bút chì xanh', second: 'bút chì đỏ', container: 'hộp' },
        sticker_packs: { first: 'nhãn dán hình sao', second: 'nhãn dán hình tròn', container: 'tập' }
    }),
    remaining: Object.freeze({
        oranges: { subject: 'Một cửa hàng có', unit: 'kg cam', morning: 'Buổi sáng bán được', evening: 'Buổi tối bán được' },
        fish_sauce: { subject: 'Một kho hàng có', unit: 'l nước mắm', morning: 'Ngày thứ nhất xuất', evening: 'Ngày thứ ba xuất' },
        books: { subject: 'Thư viện có', unit: 'quyển sách', morning: 'Buổi sáng cho mượn', evening: 'Buổi tối cho mượn' },
        products: { subject: 'Một xưởng có', unit: 'sản phẩm', morning: 'Buổi sáng chuyển đi', evening: 'Buổi tối chuyển đi' }
    }),
    ratio_total: Object.freeze({
        polyline: { subject: 'Đường gấp khúc ABCD có đoạn AB dài', unit: 'cm', middle: 'BC', last: 'CD' },
        ribbons: { subject: 'Dải ruy-băng ABCD có đoạn AB dài', unit: 'cm', middle: 'BC', last: 'CD' },
        roads: { subject: 'Đường đi ABCD có đoạn AB dài', unit: 'm', middle: 'BC', last: 'CD' },
        ropes: { subject: 'Sợi dây ABCD có đoạn AB dài', unit: 'm', middle: 'BC', last: 'CD' }
    }),
    legs_constraint: Object.freeze({
        giraffes_peacocks: { first: 'hươu cao cổ', firstLegs: 4, second: 'công', secondLegs: 2, subject: 'Rô-bốt' },
        cows_chickens: { first: 'bò', firstLegs: 4, second: 'gà', secondLegs: 2, subject: 'Một bạn nhỏ' },
        dogs_birds: { first: 'chó', firstLegs: 4, second: 'chim', secondLegs: 2, subject: 'Rô-bốt' },
        horses_ducks: { first: 'ngựa', firstLegs: 4, second: 'vịt', secondLegs: 2, subject: 'Một bạn nhỏ' }
    }),
    animal_total: Object.freeze({
        farm: { first: 'bò', second: 'ngựa', third: 'dê', place: 'trang trại' },
        zoo: { first: 'hươu', second: 'ngựa vằn', third: 'dê núi', place: 'vườn thú' },
        garden: { first: 'gà', second: 'vịt', third: 'ngan', place: 'khu chăn nuôi' },
        meadow: { first: 'cừu', second: 'dê', third: 'bê', place: 'đồng cỏ' }
    })
});

function pick(items, random) {
    return items[randomInt(0, items.length - 1, random)];
}

function integer(value, fallback, label) {
    const result = Number(value ?? fallback);
    if (!Number.isSafeInteger(result)) throw new Error(`${label} phải là số nguyên.`);
    return result;
}

function resolveConfig(family, config = {}, random) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Cấu hình Bài 5 phải là một đối tượng.');
    const declaredFamily = config.family ?? config.scenarioFamily;
    if (declaredFamily !== undefined && declaredFamily !== family) throw new Error(`Cấu hình không phù hợp với dạng ${family}.`);
    const difficulty = config.difficulty ?? 'core';
    if (!DIFFICULTIES.includes(difficulty)) throw new Error('Độ khó Bài 5 chỉ nhận easy, core hoặc challenge.');

    const available = CONTEXTS[family];
    const rawContexts = config.contextPool ?? config.contexts ?? (config.context ? [config.context] : Object.keys(available));
    const contexts = Array.isArray(rawContexts) ? [...new Set(rawContexts)] : [rawContexts];
    if (!contexts.length || contexts.some(value => typeof value !== 'string' || !Object.hasOwn(available, value))) {
        throw new Error(`Ngữ cảnh Bài 5 không hợp lệ cho dạng ${family}.`);
    }

    const minimum = integer(config.minimum, 1, 'Giá trị nhỏ nhất');
    const maximum = integer(config.maximum ?? config.maxValue, MAX_VALUE, 'Giá trị lớn nhất');
    if (minimum < 1 || maximum > MAX_VALUE || minimum > maximum) {
        throw new Error('Phạm vi Bài 5 phải là số nguyên từ 1 đến 100 000 và số nhỏ nhất không vượt số lớn nhất.');
    }
    const cap = Math.min(maximum, DIFFICULTY_CAPS[difficulty]);
    if (minimum > cap) throw new Error('Phạm vi Bài 5 không phù hợp với độ khó đã chọn.');
    if (cap < FAMILY_MINIMUM_CAPS[family]) {
        throw new Error(`Giá trị lớn nhất của dạng ${family} phải từ ${formatNumber(FAMILY_MINIMUM_CAPS[family])} trở lên.`);
    }
    return { difficulty, contexts, minimum, maximum, cap, contextId: pick(contexts, random) };
}

function boundedInt(minimum, maximum, random) {
    if (maximum < minimum) throw new Error('Không thể sinh số trong phạm vi đã chọn.');
    return randomInt(minimum, maximum, random);
}

function chooseAtMost(maximum, minimum, random) {
    return boundedInt(Math.max(1, minimum), Math.max(1, maximum), random);
}

function makeOptions(correct, random, cap) {
    const values = [correct];
    const steps = [1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    const candidates = shuffle(steps.flatMap(step => [correct - step, correct + step]), random);
    for (const value of candidates) {
        if (value >= 1 && value <= cap && !values.includes(value)) values.push(value);
        if (values.length === 4) break;
    }
    for (let delta = 1; values.length < 4 && delta <= cap; delta += 1) {
        const value = correct - delta >= 1 ? correct - delta : correct + delta;
        if (value <= cap && !values.includes(value)) values.push(value);
    }
    if (values.length < 4) throw new Error('Cần ít nhất bốn đáp án khác nhau trong phạm vi Bài 5.');
    return shuffle(values, random).map(formatNumber);
}

function relationTotal(context, cap, random) {
    const base = boundedInt(10, Math.max(10, Math.floor((cap - 3) / 3)), random);
    const firstDifference = boundedInt(2, Math.max(2, Math.floor((cap - 3 * base + 1) / 2)), random);
    const secondDifference = boundedInt(1, firstDifference, random);
    const second = base + firstDifference;
    const third = second - secondDifference;
    const answer = base + second + third;
    return {
        contextId: null,
        values: { base, firstDifference, secondDifference, second, third },
        stepResults: [second, third, answer], answer, answerUnit: context.unit,
        prompt: `${context.subject} ${formatNumber(base)} ${context.unit}. ${context.second} ${formatNumber(firstDifference)} ${context.unit}. ${context.third} ${formatNumber(secondDifference)} ${context.unit}. Hỏi ${context.total} bao nhiêu ${context.unit}?`,
        explanation: `Bước 1: ${context.second.toLowerCase()} = ${formatNumber(base)} + ${formatNumber(firstDifference)} = ${formatNumber(second)} ${context.unit}.<br>Bước 2: ${context.third.toLowerCase()} = ${formatNumber(second)} − ${formatNumber(secondDifference)} = ${formatNumber(third)} ${context.unit}.<br>Bước 3: ${context.total} = ${formatNumber(base)} + ${formatNumber(second)} + ${formatNumber(third)} = ${formatNumber(answer)} ${context.unit}.`
    };
}

function purchaseTotal(context, cap, random) {
    const currencyStep = cap < 4000 ? 100 : 1000;
    const maximumQuantity = Math.max(1, Math.min(5, Math.floor(cap / (currencyStep * 2))));
    const quantity1 = boundedInt(1, maximumQuantity, random);
    const quantity2 = boundedInt(1, maximumQuantity, random);
    const priceUnitCap = Math.max(1, Math.floor(cap / (currencyStep * (quantity1 + quantity2))));
    const price1 = boundedInt(1, priceUnitCap, random) * currencyStep;
    const price2 = boundedInt(1, priceUnitCap, random) * currencyStep;
    const firstTotal = quantity1 * price1;
    const secondTotal = quantity2 * price2;
    const answer = firstTotal + secondTotal;
    return {
        values: { quantity1, price1, quantity2, price2, firstTotal, secondTotal },
        stepResults: [firstTotal, secondTotal, answer], answer, answerUnit: 'đồng',
        prompt: `${context.person} mua ${formatNumber(quantity1)} ${context.first}, mỗi ${context.first} giá ${formatNumber(price1)} đồng, và mua ${formatNumber(quantity2)} ${context.second}, mỗi ${context.second} giá ${formatNumber(price2)} đồng. Hỏi ${context.person} phải trả tất cả bao nhiêu tiền?`,
        explanation: `Bước 1: tiền mua ${context.first} = ${formatNumber(quantity1)} × ${formatNumber(price1)} = ${formatNumber(firstTotal)} đồng.<br>Bước 2: tiền mua ${context.second} = ${formatNumber(quantity2)} × ${formatNumber(price2)} = ${formatNumber(secondTotal)} đồng.<br>Bước 3: số tiền phải trả tất cả = ${formatNumber(firstTotal)} + ${formatNumber(secondTotal)} = ${formatNumber(answer)} đồng.`
    };
}

function gcd(a, b) {
    let x = a;
    let y = b;
    while (y) [x, y] = [y, x % y];
    return x;
}

function divideCompare(context, cap, random) {
    const firstDivisor = boundedInt(2, 5, random);
    const secondDivisor = boundedInt(firstDivisor + 1, 9, random);
    const lcm = (firstDivisor * secondDivisor) / gcd(firstDivisor, secondDivisor);
    const multiplier = boundedInt(1, Math.max(1, Math.floor(cap / Math.max(1, lcm))), random);
    const total = lcm * multiplier;
    const firstGroups = total / firstDivisor;
    const secondGroups = total / secondDivisor;
    const answer = Math.abs(firstGroups - secondGroups);
    return {
        values: { total, firstDivisor, secondDivisor, firstGroups, secondGroups },
        stepResults: [firstGroups, secondGroups, answer], answer, answerUnit: context.container,
        prompt: `Có ${formatNumber(total)} ${context.first}, xếp mỗi ${formatNumber(firstDivisor)} ${context.first} vào một ${context.container}. Có ${formatNumber(total)} ${context.second}, xếp mỗi ${formatNumber(secondDivisor)} ${context.second} vào một ${context.container}. Hỏi số ${context.container} ${context.first} nhiều hơn số ${context.container} ${context.second} bao nhiêu?`,
        explanation: `Bước 1: số ${context.container} ${context.first} = ${formatNumber(total)} : ${formatNumber(firstDivisor)} = ${formatNumber(firstGroups)} ${context.container}.<br>Bước 2: số ${context.container} ${context.second} = ${formatNumber(total)} : ${formatNumber(secondDivisor)} = ${formatNumber(secondGroups)} ${context.container}.<br>Bước 3: số ${context.container} nhiều hơn = ${formatNumber(firstGroups)} − ${formatNumber(secondGroups)} = ${formatNumber(answer)} ${context.container}.`
    };
}

function remaining(context, cap, random) {
    const multiplier = boundedInt(2, 3, random);
    const morning = boundedInt(1, Math.max(1, Math.floor(cap / 16)), random);
    const evening = boundedInt(1, Math.max(1, Math.floor(cap / 16)), random);
    const sold = morning + morning * multiplier + evening;
    const initial = boundedInt(Math.max(sold + 1, Math.floor(cap / 2)), cap, random);
    const afternoon = morning * multiplier;
    const remainingValue = initial - sold;
    return {
        values: { initial, morning, multiplier, afternoon, evening, sold },
        stepResults: [afternoon, sold, remainingValue], answer: remainingValue, answerUnit: context.unit,
        prompt: `${context.subject} ${formatNumber(initial)} ${context.unit}. ${context.morning} ${formatNumber(morning)} ${context.unit}. Buổi tiếp theo bán được số ${context.unit} gấp ${formatNumber(multiplier)} lần buổi sáng. ${context.evening} ${formatNumber(evening)} ${context.unit}. Hỏi còn lại bao nhiêu ${context.unit}?`,
        explanation: `Bước 1: số ${context.unit} bán ở buổi tiếp theo = ${formatNumber(morning)} × ${formatNumber(multiplier)} = ${formatNumber(afternoon)} ${context.unit}.<br>Bước 2: tổng số ${context.unit} đã bán = ${formatNumber(morning)} + ${formatNumber(afternoon)} + ${formatNumber(evening)} = ${formatNumber(sold)} ${context.unit}.<br>Bước 3: số ${context.unit} còn lại = ${formatNumber(initial)} − ${formatNumber(sold)} = ${formatNumber(remainingValue)} ${context.unit}.`
    };
}

function ratioTotal(context, cap, random) {
    const parameterPairs = [];
    for (let divisor = 2; divisor <= 4; divisor += 1) {
        for (let factor = 2; factor <= 3; factor += 1) {
            if (divisor + divisor * factor + factor <= cap) parameterPairs.push({ divisor, factor });
        }
    }
    const { divisor, factor } = pick(parameterPairs, random);
    const unitSum = divisor + divisor * factor + factor;
    const multiplier = boundedInt(1, Math.max(1, Math.floor(cap / unitSum)), random);
    const base = divisor * multiplier;
    const middle = base * factor;
    const last = middle / divisor;
    const answer = base + middle + last;
    return {
        values: { base, factor, divisor, middle, last },
        stepResults: [middle, last, answer], answer, answerUnit: context.unit,
        prompt: `${context.subject} ${formatNumber(base)} ${context.unit}. Đoạn ${context.middle} dài gấp ${formatNumber(factor)} lần đoạn AB và dài gấp ${formatNumber(divisor)} lần đoạn ${context.last}. Hỏi đường gấp khúc ABCD dài bao nhiêu ${context.unit}?`,
        explanation: `Bước 1: đoạn ${context.middle} = ${formatNumber(base)} × ${formatNumber(factor)} = ${formatNumber(middle)} ${context.unit}.<br>Bước 2: đoạn ${context.last} = ${formatNumber(middle)} : ${formatNumber(divisor)} = ${formatNumber(last)} ${context.unit}.<br>Bước 3: độ dài đường gấp khúc = ${formatNumber(base)} + ${formatNumber(middle)} + ${formatNumber(last)} = ${formatNumber(answer)} ${context.unit}.`
    };
}

function legsConstraint(context, cap, random) {
    const firstCount = boundedInt(1, 6, random);
    const secondCount = boundedInt(1, Math.max(1, Math.floor(cap / 4)), random);
    const firstLegTotal = firstCount * context.firstLegs;
    const secondLegTotal = secondCount * context.secondLegs;
    const totalLegs = firstLegTotal + secondLegTotal;
    const remainingLegs = totalLegs - firstLegTotal;
    const answer = remainingLegs / context.secondLegs;
    return {
        values: { firstCount, firstLegs: context.firstLegs, totalLegs, firstLegTotal, remainingLegs, secondLegs: context.secondLegs },
        stepResults: [firstLegTotal, remainingLegs, answer], answer, answerUnit: 'con',
        prompt: `${context.subject} đếm được tất cả ${formatNumber(totalLegs)} cái chân. Trong đó có ${formatNumber(firstCount)} con ${context.first}, mỗi con có ${formatNumber(context.firstLegs)} chân. Số chân còn lại là của các con ${context.second}, mỗi con có ${formatNumber(context.secondLegs)} chân. Hỏi có bao nhiêu con ${context.second}?`,
        explanation: `Bước 1: số chân của ${formatNumber(firstCount)} con ${context.first} = ${formatNumber(firstCount)} × ${formatNumber(context.firstLegs)} = ${formatNumber(firstLegTotal)} chân.<br>Bước 2: số chân còn lại = ${formatNumber(totalLegs)} − ${formatNumber(firstLegTotal)} = ${formatNumber(remainingLegs)} chân.<br>Bước 3: số con ${context.second} = ${formatNumber(remainingLegs)} : ${formatNumber(context.secondLegs)} = ${formatNumber(answer)} con.`
    };
}

function animalTotal(context, cap, random) {
    const candidates = [];
    for (let factor = 2; factor <= 3; factor += 1) {
        for (let first = 20; first <= Math.floor(cap / 2); first += 1) {
            const maximumDifference = Math.floor(first / 2);
            const minimumDifference = Math.max(2, Math.ceil((first * (factor + 2) - cap) / (factor + 1)));
            if (minimumDifference <= maximumDifference) candidates.push({ factor, first, minimumDifference, maximumDifference });
        }
    }
    const selected = pick(candidates, random);
    const { first, factor } = selected;
    const difference = boundedInt(selected.minimumDifference, selected.maximumDifference, random);
    const second = first - difference;
    const third = second * factor;
    const answer = first + second + third;
    return {
        values: { first, difference, second, factor, third },
        stepResults: [second, third, answer], answer, answerUnit: 'con vật',
        prompt: `${context.place[0].toUpperCase()}${context.place.slice(1)} có ${formatNumber(first)} con ${context.first}. Số ${context.second} ít hơn số ${context.first} ${formatNumber(difference)} con. Số ${context.third} nhiều gấp ${formatNumber(factor)} lần số ${context.second}. Hỏi ${context.place} có tất cả bao nhiêu con vật?`,
        explanation: `Bước 1: số ${context.second} = ${formatNumber(first)} − ${formatNumber(difference)} = ${formatNumber(second)} con.<br>Bước 2: số ${context.third} = ${formatNumber(second)} × ${formatNumber(factor)} = ${formatNumber(third)} con.<br>Bước 3: tổng số con vật = ${formatNumber(first)} + ${formatNumber(second)} + ${formatNumber(third)} = ${formatNumber(answer)} con.`
    };
}

const BUILDERS = { relation_total: relationTotal, purchase_total: purchaseTotal, divide_compare: divideCompare, remaining, ratio_total: ratioTotal, legs_constraint: legsConstraint, animal_total: animalTotal };

function createQuestion(key, family, interaction, config = {}, random = Math.random) {
    const resolved = resolveConfig(family, config, random);
    const contextId = resolved.contextId;
    const context = CONTEXTS[family][contextId];
    let problem = null;
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = BUILDERS[family](context, resolved.cap, random);
        if (candidate.answer >= resolved.minimum && candidate.answer <= resolved.maximum && candidate.answer <= resolved.cap && candidate.answer <= MAX_VALUE && candidate.stepResults.every(value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_VALUE)) {
            problem = candidate;
            break;
        }
    }
    if (!problem) throw new Error(`Không thể sinh dạng Bài 5 ${family} trong phạm vi đã chọn.`);

    const answer = formatNumber(problem.answer);
    const q = interaction === 'mcq' ? problem.prompt : `${problem.prompt}<br>Điền đáp số: ___${problem.answerUnit ? ` ${problem.answerUnit}` : ''}`;
    const threeStepData = {
        family,
        contextId,
        difficulty: resolved.difficulty,
        operands: problem.values,
        stepResults: problem.stepResults,
        answer: problem.answer
    };
    const question = {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC, lesson: LESSON,
        type: interaction === 'mcq' ? 'Trắc nghiệm' : 'Điền khuyết', templateId: key,
        q, options: interaction === 'mcq' ? makeOptions(problem.answer, random, resolved.cap) : [], ans: answer,
        explanation: problem.explanation, partAnswerCounts: [1], answerMode: 'single', threeStepData,
        templateVariables: {
            question: q,
            family,
            contextId,
            difficulty: resolved.difficulty,
            answer,
            step1: formatNumber(problem.stepResults[0]),
            step2: formatNumber(problem.stepResults[1]),
            step3: formatNumber(problem.stepResults[2]),
            threeStepData
        }
    };
    return question;
}

const generators = {};
Object.keys(BUILDERS).forEach(family => {
    generators[`word.three_steps_${family}_mcq`] = (config, random) => createQuestion(`word.three_steps_${family}_mcq`, family, 'mcq', config, random);
    generators[`word.three_steps_${family}_fill`] = (config, random) => createQuestion(`word.three_steps_${family}_fill`, family, 'fill', config, random);
});

return generators;
}));
