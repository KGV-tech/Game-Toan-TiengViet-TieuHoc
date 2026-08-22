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
const fillQuestion = (templateId, title, rows, explanation) => question(templateId, 'Điền khuyết', `${title}<br>${rows.map((row, index) => `${labels[index]}) ${row.display}`).join('<br>')}`, {
    ans: rows.map(row => String(row.answer)).join(', '), practiceRows: rows, explanation
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
function unitChoice(random) {
    const data = [
        ['Khối lượng một con voi thường đo bằng đơn vị nào?', ['kg', 'yến', 'tấn', 'dm²'], 'tấn'],
        ['Khối lượng một bao gạo lớn thường đo bằng đơn vị nào?', ['kg', 'yến', 'tấn', 'mm²'], 'yến'],
        ['Diện tích tấm bìa hình vuông cạnh 3 dm nên đo bằng đơn vị nào?', ['mm²', 'cm²', 'dm²', 'm²'], 'dm²'],
        ['Thời gian chạy 100 m nên đo bằng đơn vị nào?', ['giây', 'phút', 'giờ', 'thế kỉ'], 'giây']
    ];
    return createFourPartMultipleChoiceQuestion('measurement.choose_appropriate_unit', 'Chọn đơn vị đo thích hợp nhất.', shuffle(data, random).map((item, index) => ({ label: labels[index], prompt: item[0], options: shuffle(item[1], random), answer: item[2] })), 'Chọn đơn vị phù hợp với đại lượng và tình huống thực tế.');
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
    return question('measurement.match_equivalences', 'Đối chiếu trùng khớp', 'Nối mỗi số đo với giá trị tương đương.', { options: [pairs.map(pair => pair[0]).join(', '), shuffle(pairs.map(pair => pair[1]), random).join(', ')], ans: pairs.map(pair => `${pair[0]}:${pair[1]}`).join(', '), explanation: 'Đổi đơn vị để tìm các cặp bằng nhau.' });
}
function trueFalse(random) {
    const statements = shuffle([
        ['6 tạ = 600 kg.', 'Đúng'], ['9 m² = 900 cm².', 'Sai'], ['1 phút 40 giây = 100 giây.', 'Đúng'], ['5 thế kỉ = 50 năm.', 'Sai']
    ], random).map((item, index) => ({ label: labels[index], text: item[0], answer: item[1] }));
    return question('measurement.unit_true_false', 'Đúng/Sai', 'Chọn Đúng hoặc Sai cho mỗi nhận định.', { ans: statements.map(item => item.answer).join(', '), statements, explanation: 'Kiểm tra từng phép đổi đơn vị.' });
}
function century(random) {
    const years = shuffle([[1789, 'XVIII'], [1900, 'XIX'], [1945, 'XX'], [2026, 'XXI']], random);
    return createFourPartMultipleChoiceQuestion('measurement.century_identification', 'Mỗi năm sau thuộc thế kỉ nào?', years.map(([year, answer], index) => ({ label: labels[index], prompt: `Năm <span class="year-value" data-year="true">${year}</span> thuộc thế kỉ nào?`, options: shuffle(['XVIII', 'XIX', 'XX', 'XXI'], random), answer })), 'Năm 1–100 thuộc thế kỉ I; mỗi thế kỉ tiếp theo gồm 100 năm.');
}
function wordProblems(random) {
    const rows = [
        { display: 'Một xe chở 3 tấn hàng, đã dỡ 8 tạ. Xe còn chở ___ kg hàng.', answer: 2200 },
        { display: 'Thửa ruộng 4 000 m² chia đều 4 phần. Mỗi phần rộng ___ m².', answer: 1000 },
        { display: 'Cuộc thi dài 5 phút. Nam làm xong sau 240 giây. Nam xong sớm hơn ___ giây.', answer: 60 },
        { display: 'Kho có 2 tấn 5 tạ gạo, đã xuất 750 kg. Kho còn ___ kg gạo.', answer: 1750 }
    ];
    return fillQuestion('measurement.word_problem_units', 'Điền đáp số thích hợp.', shuffle(rows, random), 'Đổi đơn vị về cùng đơn vị trước khi tính.');
}
const generators = {
    'measurement.mass_unit_convert': (config, random) => fillQuestion('measurement.mass_unit_convert', 'Điền số thích hợp.', massRows(random), 'Dùng 1 yến = 10 kg, 1 tạ = 100 kg, 1 tấn = 1 000 kg.'),
    'measurement.area_unit_convert': (config, random) => fillQuestion('measurement.area_unit_convert', 'Điền số thích hợp.', areaRows(random), 'Dùng các quan hệ giữa m², dm², cm² và mm².'),
    'measurement.time_unit_convert': (config, random) => fillQuestion('measurement.time_unit_convert', 'Điền số thích hợp.', timeRows(random), 'Dùng các quan hệ giữa tuần, ngày, giờ, phút và giây.'),
    'measurement.choose_appropriate_unit': (config, random) => unitChoice(random),
    'measurement.compare_units': (config, random) => comparisons(random),
    'measurement.match_equivalences': (config, random) => matching(random),
    'measurement.unit_true_false': (config, random) => trueFalse(random),
    'measurement.century_identification': (config, random) => century(random),
    'measurement.word_problem_units': (config, random) => wordProblems(random)
};
return Object.fromEntries(Object.entries(generators).map(([id, generate]) => [id, (config = {}, random = Math.random) => ({ ...generate(config, random), topic: TOPIC })]));
}));
