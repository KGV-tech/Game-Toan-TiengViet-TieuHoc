;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, createFourPartMultipleChoiceQuestion }) {
const TOPIC = '4. Một số đơn vị đo Đại lượng';
const labels = ['a', 'b', 'c', 'd'];
const KIND_LABELS = { mass: 'khối lượng', area: 'diện tích', time: 'thời gian', century: 'thế kỉ' };
const sign = (left, right) => left === right ? '=' : (left > right ? '>' : '<');
const choose = (items, random) => items[randomInt(0, items.length - 1, random)];
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const configuredKinds = (config, key, defaults, allowed, message) => {
    const source = hasOwn(config, key) ? config[key] : defaults;
    if (!Array.isArray(source) || !source.length || new Set(source).size !== source.length || source.some(kind => !allowed.includes(kind))) {
        throw new Error(message);
    }
    return [...source];
};
const question = (templateId, type, prompt, extra = {}) => ({
    classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC,
    type, templateId, q: prompt, options: [], partAnswerCounts: [1, 1, 1, 1], ...extra
});
const fillQuestion = (templateId, title, rows, explanation, extra = {}) => question(templateId, 'Điền khuyết', `${title}<br>${rows.map((row, index) => `${labels[index]}) ${row.display}`).join('<br>')}`, {
    ans: rows.map(row => String(row.answer)).join(', '), practiceRows: rows, explanation, ...extra
});

function massRows(config = {}, random) {
    const rowFactories = {
        yenToKg: () => { const n = randomInt(2, 9, random); return { kind: 'yenToKg', display: `${n} yến = ___ kg`, answer: n * 10 }; },
        taToKg: () => { const n = randomInt(2, 9, random); return { kind: 'taToKg', display: `${n} tạ = ___ kg`, answer: n * 100 }; },
        tonToKg: () => { const n = randomInt(2, 8, random); return { kind: 'tonToKg', display: `${n} tấn = ___ kg`, answer: n * 1000 }; },
        yenAndKgToKg: () => { const y = randomInt(2, 8, random), kg = randomInt(1, 9, random); return { kind: 'yenAndKgToKg', display: `${y} yến ${kg} kg = ___ kg`, answer: y * 10 + kg }; },
        tonAndYenToKg: () => { const t = randomInt(1, 4, random), y = randomInt(1, 9, random); return { kind: 'tonAndYenToKg', display: `${t} tấn ${y} yến = ___ kg`, answer: t * 1000 + y * 10 }; }
    };
    const kinds = configuredKinds(config, 'allowedKinds', Object.keys(rowFactories), Object.keys(rowFactories), 'Dạng đổi đơn vị khối lượng không hợp lệ.');
    const selectedKind = choose(kinds, random);
    return labels.map(() => rowFactories[selectedKind]());
}
function areaRows(config = {}, random) {
    const rowFactories = {
        m2ToDm2: () => { const n = randomInt(2, 9, random); return { kind: 'm2ToDm2', display: `${n} m² = ___ dm²`, answer: n * 100 }; },
        dm2ToCm2: () => { const n = randomInt(2, 9, random); return { kind: 'dm2ToCm2', display: `${n} dm² = ___ cm²`, answer: n * 100 }; },
        dm2ToMm2: () => { const n = randomInt(2, 9, random); return { kind: 'dm2ToMm2', display: `${n} dm² = ___ mm²`, answer: n * 10000 }; },
        cm2ToDm2: () => { const n = randomInt(2, 9, random); return { kind: 'cm2ToDm2', display: `${n * 100} cm² = ___ dm²`, answer: n }; }
    };
    const kinds = configuredKinds(config, 'allowedKinds', Object.keys(rowFactories), Object.keys(rowFactories), 'Dạng đổi đơn vị diện tích không hợp lệ.');
    const selectedKind = choose(kinds, random);
    return labels.map(() => rowFactories[selectedKind]());
}
function timeRows(config = {}, random) {
    const rowFactories = {
        minuteToSeconds: () => { const n = randomInt(2, 9, random); return { kind: 'minuteToSeconds', display: `${n} phút = ___ giây`, answer: n * 60 }; },
        hourToMinutes: () => { const h = randomInt(2, 6, random); return { kind: 'hourToMinutes', display: `${h} giờ = ___ phút`, answer: h * 60 }; },
        minutesAndSecondsToSeconds: () => { const m = randomInt(1, 4, random), s = randomInt(5, 50, random); return { kind: 'minutesAndSecondsToSeconds', display: `${m} phút ${s} giây = ___ giây`, answer: m * 60 + s }; },
        weekAndDaysToDays: () => { const w = randomInt(1, 3, random), d = randomInt(1, 6, random); return { kind: 'weekAndDaysToDays', display: `${w} tuần ${d} ngày = ___ ngày`, answer: w * 7 + d }; }
    };
    const kinds = configuredKinds(config, 'allowedKinds', Object.keys(rowFactories), Object.keys(rowFactories), 'Dạng đổi đơn vị thời gian không hợp lệ.');
    const selectedKind = choose(kinds, random);
    return labels.map(() => rowFactories[selectedKind]());
}
const comparisonBanks = {
    mass: [
        { left: '7 yến', lv: 70, right: '68 kg', rv: 68 },
        { left: '3 tạ 5 kg', lv: 305, right: '305 kg', rv: 305 },
        { left: '4 tấn', lv: 4000, right: '39 tạ', rv: 3900 },
        { left: '2 yến 5 kg', lv: 25, right: '250 hg', rv: 25 }
    ],
    area: [
        { left: '2 m²', lv: 200, right: '199 dm²', rv: 199 },
        { left: '3 m²', lv: 300, right: '300 dm²', rv: 300 },
        { left: '4 dm²', lv: 400, right: '399 cm²', rv: 399 },
        { left: '5 m²', lv: 50000, right: '50 000 cm²', rv: 50000 }
    ],
    time: [
        { left: '3 phút 20 giây', lv: 200, right: '200 giây', rv: 200 },
        { left: '2 giờ', lv: 120, right: '119 phút', rv: 119 },
        { left: '1 tuần', lv: 7, right: '6 ngày', rv: 6 },
        { left: '5 phút', lv: 300, right: '299 giây', rv: 299 }
    ]
};
const comparisonKinds = ['mass', 'area', 'time'];

function comparisons(config, random) {
    const kinds = configuredKinds(config, 'comparisonKinds', comparisonKinds, comparisonKinds, 'Nhóm so sánh đơn vị đo không hợp lệ.');
    const selectedKind = choose(kinds, random);
    const chosen = shuffle(comparisonBanks[selectedKind], random).map((row, index) => ({
        label: labels[index], kind: selectedKind, leftText: row.left, rightText: row.right,
        display: `${row.left} ___ ${row.right}`, answer: sign(row.lv, row.rv)
    }));
    const prompt = `Điền dấu thích hợp (${KIND_LABELS[selectedKind]}):<br>${chosen.map(row => `${row.label}) ${row.display}`).join('<br>')}`;
    return question('measurement.compare_units', 'Kéo thả', prompt, {
        ans: chosen.map(row => row.answer).join(', '), comparisonRows: chosen,
        explanation: 'Đổi các số đo về cùng đơn vị rồi so sánh.',
        templateVariables: { question: prompt, comparisonKinds: kinds.join(', '), selectedKind }
    });
}

const matchingBanks = {
    mass: [['4 yến', '40 kg'], ['15 tạ', '1 500 kg'], ['2 tấn', '2 000 kg'], ['8 yến 5 kg', '85 kg']],
    area: [['4 m²', '400 dm²'], ['3 dm²', '300 cm²'], ['2 m²', '20 000 cm²'], ['5 dm²', '50 000 mm²']],
    time: [['2 phút 30 giây', '150 giây'], ['2 giờ', '120 phút'], ['1 tuần', '7 ngày'], ['3 phút', '180 giây']]
};

function matching(config, random) {
    const kinds = configuredKinds(config, 'matchingKinds', comparisonKinds, comparisonKinds, 'Nhóm nối tương đương đơn vị đo không hợp lệ.');
    const selectedKind = choose(kinds, random);
    const pairs = shuffle(matchingBanks[selectedKind], random);
    const distractors = {
        mass: '7 yến',
        area: '6 m²',
        time: '4 phút 10 giây'
    };
    const leftOptions = shuffle([...pairs.map(pair => pair[0]), distractors[selectedKind]], random);
    const matchingRows = pairs.map(pair => ({ kind: selectedKind, left: pair[0], right: pair[1] }));
    const prompt = `Nối các số đo ${KIND_LABELS[selectedKind]} với giá trị tương đương.`;
    return question('measurement.match_equivalences', 'Đối chiếu trùng khớp', prompt, {
        options: [leftOptions.join(', '), shuffle(pairs.map(pair => pair[1]), random).join(', ')],
        ans: pairs.map(pair => `${pair[0]}:${pair[1]}`).join(', '), explanation: 'Đổi đơn vị để tìm các cặp bằng nhau.', matchingRows,
        templateVariables: { question: prompt, matchingKinds: kinds.join(', '), selectedKind }
    });
}

const trueFalseBanks = {
    mass: [
        ['6 tạ = 600 kg.', 'Đúng'], ['3 tấn = 300 kg.', 'Sai'], ['8 yến = 80 kg.', 'Đúng'], ['5 tạ 2 kg = 502 kg.', 'Đúng']
    ],
    area: [
        ['9 m² = 900 cm².', 'Sai'], ['4 m² = 400 dm².', 'Đúng'], ['7 dm² = 700 cm².', 'Đúng'], ['3 m² = 3000 dm².', 'Sai']
    ],
    time: [
        ['1 phút 40 giây = 100 giây.', 'Đúng'], ['2 giờ = 120 phút.', 'Đúng'], ['3 tuần = 21 ngày.', 'Đúng'], ['5 phút = 500 giây.', 'Sai']
    ],
    century: [
        ['1 thế kỉ = 100 năm.', 'Đúng'], ['Năm 1900 thuộc thế kỉ XX.', 'Sai'], ['Năm 2001 thuộc thế kỉ XXI.', 'Đúng'], ['5 thế kỉ = 50 năm.', 'Sai']
    ]
};

function trueFalse(config, random) {
    const statementKinds = ['mass', 'area', 'time', 'century'];
    const kinds = configuredKinds(config, 'statementKinds', statementKinds, statementKinds, 'Nhóm nhận định đơn vị đo không hợp lệ.');
    const selectedKind = choose(kinds, random);
    const statements = shuffle(trueFalseBanks[selectedKind], random).map((item, index) => ({ label: labels[index], text: item[0], answer: item[1], kind: selectedKind }));
    const prompt = `Chọn Đúng/Sai (${KIND_LABELS[selectedKind]}):`;
    return question('measurement.unit_true_false', 'Đúng/Sai', prompt, {
        ans: statements.map(item => item.answer).join(', '), statements, explanation: 'Kiểm tra từng phép đổi đơn vị.',
        templateVariables: { question: prompt, statementKinds: kinds.join(', '), selectedKind }
    });
}
const romanNumeral = value => {
    const numerals = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let remainder = value;
    return numerals.reduce((result, [unit, symbol]) => {
        const count = Math.floor(remainder / unit);
        remainder %= unit;
        return result + symbol.repeat(count);
    }, '');
};
function century(config = {}, random) {
    const centuryStart = Number(config.centuryStart ?? 18);
    const centuryEnd = Number(config.centuryEnd ?? 21);
    if (!Number.isSafeInteger(centuryStart) || !Number.isSafeInteger(centuryEnd) || centuryStart < 1 || centuryEnd > 99 || centuryStart > centuryEnd || centuryEnd - centuryStart + 1 < 4) {
        throw new Error('Dạng xác định thế kỉ cần phạm vi ít nhất bốn thế kỉ hợp lệ.');
    }
    const centuries = Array.from({ length: centuryEnd - centuryStart + 1 }, (_, index) => centuryStart + index);
    const years = shuffle(centuries, random).slice(0, 4).map(centuryNumber => ({
        century: centuryNumber,
        year: randomInt(centuryNumber * 100 - 99, centuryNumber * 100, random),
        answer: romanNumeral(centuryNumber)
    }));
    const optionsFor = answer => shuffle([answer, ...shuffle(centuries.map(romanNumeral).filter(value => value !== answer), random).slice(0, 3)], random);
    const prompt = 'Mỗi năm sau thuộc thế kỉ nào?';
    return createFourPartMultipleChoiceQuestion('measurement.century_identification', prompt, years.map((item, index) => ({
        label: labels[index],
        prompt: `Năm <span class="year-value" data-year="true">${item.year}</span> thuộc thế kỉ nào?`,
        options: optionsFor(item.answer),
        answer: item.answer,
        century: item.century,
        year: item.year
    })), 'Năm 1–100 thuộc thế kỉ I; mỗi thế kỉ tiếp theo gồm 100 năm.', { question: prompt, centuryStart, centuryEnd });
}
const displayNumber = value => formatNumber(value);
const exactMultiple = (minimum, maximum, step, random) => randomInt(Math.ceil(minimum / step), Math.floor(maximum / step), random) * step;
const wordProblemRow = (scenarioId, lead, answerPrefix, answer, answerSuffix) => ({
    scenarioId, kind: scenarioKind(scenarioId), lead, answerPrefix, answer, answerSuffix,
    display: `${lead} ${answerPrefix} ___ ${answerSuffix}`
});
const MASS_SCENARIO_IDS = new Set(['truck-unload', 'boat-fish-sale', 'cargo-ship-transfer', 'train-unload', 'rice-warehouse-export', 'shop-rice-sale', 'farm-vegetable-sale', 'factory-delivery']);
const AREA_SCENARIO_IDS = new Set(['field-division', 'football-field-zones', 'garden-beds', 'cardboard-pieces', 'floor-tiles', 'house-rooms']);
const TIME_SCENARIO_IDS = new Set(['competition-early', 'football-match-remaining', 'train-travel-time', 'film-duration', 'lesson-duration', 'relay-time-remaining']);
function scenarioKind(scenarioId) {
    if (MASS_SCENARIO_IDS.has(scenarioId)) return 'mass';
    if (AREA_SCENARIO_IDS.has(scenarioId)) return 'area';
    if (TIME_SCENARIO_IDS.has(scenarioId)) return 'time';
    throw new Error(`Ngữ cảnh đơn vị đo không có nhóm hợp lệ: ${scenarioId}.`);
}
const clockText = totalMinutes => {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return minute === 0 ? `${hour} giờ` : `${hour} giờ ${minute} phút`;
};

function wordProblemScenarios(random) {
    return [
        () => { const tons = randomInt(3, 12, random), unloadedTạ = randomInt(1, tons * 10 - 1, random); return wordProblemRow('truck-unload', `Xe tải chở ${tons} tấn hàng, đã dỡ ${unloadedTạ} tạ.`, 'Xe còn chở', tons * 1000 - unloadedTạ * 100, 'kg hàng.'); },
        () => { const totalTạ = randomInt(20, 80, random), soldKg = exactMultiple(50, totalTạ * 100 - 50, 50, random); return wordProblemRow('boat-fish-sale', `Một chiếc ghe chở ${totalTạ} tạ cá, đã bán ${displayNumber(soldKg)} kg.`, 'Trên ghe còn', totalTạ * 100 - soldKg, 'kg cá.'); },
        () => { const tons = randomInt(4, 15, random), transferredTạ = randomInt(2, tons * 10 - 1, random); return wordProblemRow('cargo-ship-transfer', `Tàu chở ${tons} tấn hàng, đã chuyển ${transferredTạ} tạ xuống cảng.`, 'Trên tàu còn', tons * 1000 - transferredTạ * 100, 'kg hàng.'); },
        () => { const tons = randomInt(3, 12, random), unloadedKg = exactMultiple(100, tons * 1000 - 100, 100, random); return wordProblemRow('train-unload', `Xe lửa chở ${tons} tấn hàng, đã bốc dỡ ${displayNumber(unloadedKg)} kg ở ga.`, 'Xe lửa còn chở', tons * 1000 - unloadedKg, 'kg hàng.'); },
        () => { const tons = randomInt(2, 8, random), tạ = randomInt(1, 9, random), totalKg = tons * 1000 + tạ * 100, exportedKg = exactMultiple(50, totalKg - 50, 50, random); return wordProblemRow('rice-warehouse-export', `Kho có ${tons} tấn ${tạ} tạ gạo, đã xuất ${displayNumber(exportedKg)} kg.`, 'Kho còn', totalKg - exportedKg, 'kg gạo.'); },
        () => { const totalTạ = randomInt(15, 60, random), soldKg = exactMultiple(50, totalTạ * 100 - 50, 50, random); return wordProblemRow('shop-rice-sale', `Cửa hàng nhập ${totalTạ} tạ gạo, đã bán ${displayNumber(soldKg)} kg.`, 'Cửa hàng còn', totalTạ * 100 - soldKg, 'kg gạo.'); },
        () => { const totalTạ = randomInt(18, 70, random), soldKg = exactMultiple(50, totalTạ * 100 - 50, 50, random); return wordProblemRow('farm-vegetable-sale', `Trang trại thu hoạch ${totalTạ} tạ rau, đã bán ${displayNumber(soldKg)} kg.`, 'Trang trại còn', totalTạ * 100 - soldKg, 'kg rau.'); },
        () => { const tons = randomInt(2, 8, random), extraKg = exactMultiple(100, 900, 100, random), totalKg = tons * 1000 + extraKg, deliveredKg = exactMultiple(50, totalKg - 50, 50, random); return wordProblemRow('factory-delivery', `Nhà máy đóng gói ${tons} tấn ${displayNumber(extraKg)} kg hàng, đã giao ${displayNumber(deliveredKg)} kg.`, 'Nhà máy còn', totalKg - deliveredKg, 'kg hàng.'); },
        () => { const parts = randomInt(2, 8, random), each = exactMultiple(100, 800, 50, random), total = parts * each; return wordProblemRow('field-division', `Thửa ruộng rộng ${displayNumber(total)} m² chia đều ${parts} phần.`, 'Mỗi phần rộng', each, 'm².'); },
        () => { const zones = randomInt(2, 6, random), each = exactMultiple(80, 260, 20, random), total = zones * each; return wordProblemRow('football-field-zones', `Sân bóng rộng ${displayNumber(total)} m² được chia đều thành ${zones} khu tập luyện.`, 'Mỗi khu rộng', each, 'm².'); },
        () => { const beds = randomInt(3, 10, random), each = exactMultiple(30, 180, 10, random), total = beds * each; return wordProblemRow('garden-beds', `Khu vườn rộng ${displayNumber(total)} m² được chia đều thành ${beds} luống.`, 'Mỗi luống rộng', each, 'm².'); },
        () => { const pieces = randomInt(3, 10, random), each = randomInt(4, 30, random), total = pieces * each; return wordProblemRow('cardboard-pieces', `Tấm bìa có diện tích ${displayNumber(total)} dm² được cắt thành ${pieces} phần bằng nhau.`, 'Mỗi phần có diện tích', each, 'dm².'); },
        () => { const tiles = randomInt(20, 80, random), each = randomInt(2, 9, random), total = tiles * each; return wordProblemRow('floor-tiles', `Sàn nhà có diện tích ${displayNumber(total)} dm² được lát bằng ${tiles} viên gạch như nhau.`, 'Diện tích mỗi viên gạch là', each, 'dm².'); },
        () => { const rooms = randomInt(2, 6, random), each = randomInt(12, 35, random), total = rooms * each; return wordProblemRow('house-rooms', `Một căn nhà có ${rooms} phòng, tổng diện tích ${displayNumber(total)} m² và các phòng rộng bằng nhau.`, 'Mỗi phòng rộng', each, 'm².'); },
        () => { const durationMinutes = randomInt(4, 12, random), totalSeconds = durationMinutes * 60, earlySeconds = exactMultiple(20, Math.min(180, totalSeconds - 20), 10, random), finishedSeconds = totalSeconds - earlySeconds; return wordProblemRow('competition-early', `Cuộc thi dài ${durationMinutes} phút. Bạn An làm xong sau ${displayNumber(finishedSeconds)} giây.`, 'Bạn An xong sớm hơn', earlySeconds, 'giây.'); },
        () => { const durationMinutes = randomInt(40, 90, random), elapsedSeconds = exactMultiple(60, durationMinutes * 60 - 30, 30, random); return wordProblemRow('football-match-remaining', `Trận bóng diễn ra trong ${durationMinutes} phút. Đã thi đấu ${Math.floor(elapsedSeconds / 60)} phút${elapsedSeconds % 60 ? ` ${elapsedSeconds % 60} giây` : ''}.`, 'Trận bóng còn', durationMinutes * 60 - elapsedSeconds, 'giây.'); },
        () => { const start = randomInt(6, 16, random) * 60 + choose([0, 15, 30, 45], random), duration = exactMultiple(45, 180, 15, random), end = start + duration; return wordProblemRow('train-travel-time', `Chuyến tàu rời ga lúc ${clockText(start)} và đến ga lúc ${clockText(end)}.`, 'Thời gian tàu đi là', duration, 'phút.'); },
        () => { const start = randomInt(13, 18, random) * 60 + choose([0, 15, 30], random), duration = exactMultiple(60, 150, 10, random), end = start + duration; return wordProblemRow('film-duration', `Bộ phim bắt đầu lúc ${clockText(start)} và kết thúc lúc ${clockText(end)}.`, 'Bộ phim kéo dài', duration, 'phút.'); },
        () => { const start = randomInt(7, 10, random) * 60 + choose([0, 15, 30], random), duration = exactMultiple(45, 135, 15, random), end = start + duration; return wordProblemRow('lesson-duration', `Buổi học bắt đầu lúc ${clockText(start)} và kết thúc lúc ${clockText(end)}.`, 'Buổi học kéo dài', duration, 'phút.'); },
        () => { const totalMinutes = randomInt(10, 20, random), totalSeconds = totalMinutes * 60, elapsedSeconds = exactMultiple(60, totalSeconds - 30, 30, random); return wordProblemRow('relay-time-remaining', `Đội chạy tiếp sức phải hoàn thành trong ${totalMinutes} phút. Đội đã chạy ${Math.floor(elapsedSeconds / 60)} phút${elapsedSeconds % 60 ? ` ${elapsedSeconds % 60} giây` : ''}.`, 'Đội còn', totalSeconds - elapsedSeconds, 'giây.'); }
    ];
}
function wordProblems(config = {}, random) {
    const scenarioKinds = configuredKinds(config, 'scenarioKinds', ['mass', 'area', 'time'], ['mass', 'area', 'time'], 'Nhóm ngữ cảnh bài toán đơn vị đo không hợp lệ.');
    const selectedKind = choose(scenarioKinds, random);
    const rows = shuffle(wordProblemScenarios(random).map(createRow => createRow()).filter(row => row.kind === selectedKind), random).slice(0, 4);
    if (rows.length < 4) throw new Error('Nhóm ngữ cảnh bài toán đơn vị đo phải có ít nhất bốn tình huống.');
    const kindLabel = KIND_LABELS[selectedKind];
    return fillQuestion('measurement.word_problem_units', `Điền đáp số thích hợp cho bài toán ${kindLabel}.`, rows, `Đổi các số đo ${kindLabel} về cùng đơn vị trước khi tính.`, {
        templateVariables: { scenarioIds: rows.map(row => row.scenarioId), scenarioKinds: scenarioKinds.join(', '), selectedKind }
    });
}
const generators = {
    'measurement.mass_unit_convert': (config, random) => {
        const rows = massRows(config, random);
        return fillQuestion('measurement.mass_unit_convert', 'Điền số thích hợp.', rows, 'Dùng 1 yến = 10 kg, 1 tạ = 100 kg, 1 tấn = 1 000 kg.', { templateVariables: { selectedKind: rows[0].kind } });
    },
    'measurement.area_unit_convert': (config, random) => {
        const rows = areaRows(config, random);
        return fillQuestion('measurement.area_unit_convert', 'Điền số thích hợp.', rows, 'Dùng các quan hệ giữa m², dm², cm² và mm².', { templateVariables: { selectedKind: rows[0].kind } });
    },
    'measurement.time_unit_convert': (config, random) => {
        const rows = timeRows(config, random);
        return fillQuestion('measurement.time_unit_convert', 'Điền số thích hợp.', rows, 'Dùng các quan hệ giữa giờ, phút, giây và tuần.', { templateVariables: { selectedKind: rows[0].kind } });
    },
    'measurement.compare_units': (config, random) => comparisons(config, random),
    'measurement.match_equivalences': (config, random) => matching(config, random),
    'measurement.unit_true_false': (config, random) => trueFalse(config, random),
    'measurement.century_identification': (config, random) => century(config, random),
    'measurement.word_problem_units': (config, random) => wordProblems(config, random)
};
return Object.fromEntries(Object.entries(generators).map(([id, generate]) => [id, (config = {}, random = Math.random) => ({ ...generate(config, random), topic: TOPIC })]));
}));
