;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber, createFourPartMultipleChoiceQuestion }) {
const TOPIC = '4. Một số đơn vị đo Đại lượng';
const labels = ['a', 'b', 'c', 'd'];
const sign = (left, right) => left === right ? '=' : (left > right ? '>' : '<');
const choose = (items, random) => items[randomInt(0, items.length - 1, random)];
const question = (templateId, type, prompt, extra = {}) => ({
    classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC,
    type, templateId, q: prompt, options: [], partAnswerCounts: [1, 1, 1, 1], ...extra
});
const fillQuestion = (templateId, title, rows, explanation, extra = {}) => question(templateId, 'Điền khuyết', `${title}<br>${rows.map((row, index) => `${labels[index]}) ${row.display}`).join('<br>')}`, {
    ans: rows.map(row => String(row.answer)).join(', '), practiceRows: rows, explanation, ...extra
});

function massRows(random) {
    const kinds = [
        () => { const n = randomInt(2, 9, random); return { display: `${n} yến = ___ kg`, answer: n * 10 }; },
        () => { const n = randomInt(2, 9, random); return { display: `${n} tạ = ___ kg`, answer: n * 100 }; },
        () => { const n = randomInt(2, 8, random); return { display: `${n} tấn = ___ kg`, answer: n * 1000 }; },
        () => { const y = randomInt(2, 8, random), kg = randomInt(1, 9, random); return { display: `${y} yến ${kg} kg = ___ kg`, answer: y * 10 + kg }; },
        () => { const t = randomInt(1, 4, random), y = randomInt(1, 9, random); return { display: `${t} tấn ${y} yến = ___ kg`, answer: t * 1000 + y * 10 }; }
    ];
    return labels.map(() => choose(kinds, random)());
}
function areaRows(random) {
    const kinds = [
        () => { const n = randomInt(2, 9, random); return { display: `${n} m² = ___ dm²`, answer: n * 100 }; },
        () => { const n = randomInt(2, 9, random); return { display: `${n} dm² = ___ cm²`, answer: n * 100 }; },
        () => { const n = randomInt(2, 9, random); return { display: `${n} dm² = ___ mm²`, answer: n * 10000 }; },
        () => { const n = randomInt(2, 9, random); return { display: `${n * 100} cm² = ___ dm²`, answer: n }; }
    ];
    return labels.map(() => choose(kinds, random)());
}
function timeRows(random) {
    const kinds = [
        () => { const n = randomInt(2, 9, random); return { display: `${n} phút = ___ giây`, answer: n * 60 }; },
        () => { const h = randomInt(2, 6, random); return { display: `${h} giờ = ___ phút`, answer: h * 60 }; },
        () => { const m = randomInt(1, 4, random), s = randomInt(5, 50, random); return { display: `${m} phút ${s} giây = ___ giây`, answer: m * 60 + s }; },
        () => { const w = randomInt(1, 3, random), d = randomInt(1, 6, random); return { display: `${w} tuần ${d} ngày = ___ ngày`, answer: w * 7 + d }; }
    ];
    return labels.map(() => choose(kinds, random)());
}
function comparisons(random) {
    const rows = [
        { left: '7 yến', lv: 70, right: '68 kg', rv: 68 },
        { left: '3 tạ 5 kg', lv: 305, right: '305 kg', rv: 305 },
        { left: '2 m²', lv: 200, right: '199 dm²', rv: 199 },
        { left: '3 phút 20 giây', lv: 200, right: '200 giây', rv: 200 }
    ];
    const chosen = shuffle(rows, random).map((row, index) => ({ label: labels[index], leftText: row.left, rightText: row.right, display: `${row.left} ___ ${row.right}`, answer: sign(row.lv, row.rv) }));
    return question('measurement.compare_units', 'Kéo thả', `Điền dấu thích hợp:<br>${chosen.map(row => `${row.label}) ${row.display}`).join('<br>')}`, { ans: chosen.map(row => row.answer).join(', '), comparisonRows: chosen, explanation: 'Đổi các số đo về cùng đơn vị rồi so sánh.' });
}
function matching(random) {
    const pairs = shuffle([['4 yến', '40 kg'], ['15 tạ', '1 500 kg'], ['4 m²', '400 dm²'], ['2 phút 30 giây', '150 giây']], random);
    const distractor = shuffle(['7 yến', '9 tạ', '6 m²', '3 phút 20 giây'], random)[0];
    const leftOptions = shuffle([...pairs.map(pair => pair[0]), distractor], random);
    return question('measurement.match_equivalences', 'Đối chiếu trùng khớp', 'Nối mỗi số đo với giá trị tương đương.', { options: [leftOptions.join(', '), shuffle(pairs.map(pair => pair[1]), random).join(', ')], ans: pairs.map(pair => `${pair[0]}:${pair[1]}`).join(', '), explanation: 'Có một số đo không có cặp tương đương. Đổi đơn vị để tìm các cặp bằng nhau.' });
}
function trueFalse(random) {
    const statements = shuffle([
        ['6 tạ = 600 kg.', 'Đúng'], ['9 m² = 900 cm².', 'Sai'], ['1 phút 40 giây = 100 giây.', 'Đúng'], ['5 thế kỉ = 50 năm.', 'Sai']
    ], random).map((item, index) => ({ label: labels[index], text: item[0], answer: item[1] }));
    return question('measurement.unit_true_false', 'Đúng/Sai', 'Chọn Đúng/Sai?', { ans: statements.map(item => item.answer).join(', '), statements, explanation: 'Kiểm tra từng phép đổi đơn vị.' });
}
function century(random) {
    const years = shuffle([
        [randomInt(1701, 1800, random), 'XVIII'],
        [randomInt(1801, 1900, random), 'XIX'],
        [randomInt(1901, 2000, random), 'XX'],
        [randomInt(2001, 2100, random), 'XXI']
    ], random);
    return createFourPartMultipleChoiceQuestion('measurement.century_identification', 'Mỗi năm sau thuộc thế kỉ nào?', years.map(([year, answer], index) => ({ label: labels[index], prompt: `Năm <span class="year-value" data-year="true">${year}</span> thuộc thế kỉ nào?`, options: shuffle(['XVIII', 'XIX', 'XX', 'XXI'], random), answer })), 'Năm 1–100 thuộc thế kỉ I; mỗi thế kỉ tiếp theo gồm 100 năm.');
}
const displayNumber = value => formatNumber(value);
const exactMultiple = (minimum, maximum, step, random) => randomInt(Math.ceil(minimum / step), Math.floor(maximum / step), random) * step;
const wordProblemRow = (scenarioId, lead, answerPrefix, answer, answerSuffix) => ({
    scenarioId, lead, answerPrefix, answer, answerSuffix,
    display: `${lead} ${answerPrefix} ___ ${answerSuffix}`
});
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
function wordProblems(random) {
    const rows = shuffle(wordProblemScenarios(random), random).slice(0, 4).map(createRow => createRow());
    return fillQuestion('measurement.word_problem_units', 'Điền đáp số thích hợp.', rows, 'Đổi đơn vị về cùng đơn vị trước khi tính.', {
        templateVariables: { scenarioIds: rows.map(row => row.scenarioId) }
    });
}
const generators = {
    'measurement.mass_unit_convert': (config, random) => fillQuestion('measurement.mass_unit_convert', 'Điền số thích hợp.', massRows(random), 'Dùng 1 yến = 10 kg, 1 tạ = 100 kg, 1 tấn = 1 000 kg.'),
    'measurement.area_unit_convert': (config, random) => fillQuestion('measurement.area_unit_convert', 'Điền số thích hợp.', areaRows(random), 'Dùng các quan hệ giữa m², dm², cm² và mm².'),
    'measurement.time_unit_convert': (config, random) => fillQuestion('measurement.time_unit_convert', 'Điền số thích hợp.', timeRows(random), 'Dùng các quan hệ giữa tuần, ngày, giờ, phút và giây.'),
    'measurement.compare_units': (config, random) => comparisons(random),
    'measurement.match_equivalences': (config, random) => matching(random),
    'measurement.unit_true_false': (config, random) => trueFalse(random),
    'measurement.century_identification': (config, random) => century(random),
    'measurement.word_problem_units': (config, random) => wordProblems(random)
};
return Object.fromEntries(Object.entries(generators).map(([id, generate]) => [id, (config = {}, random = Math.random) => ({ ...generate(config, random), topic: TOPIC })]));
}));
