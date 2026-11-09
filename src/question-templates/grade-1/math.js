;(function (root) {
    const range = (first, last) => Array.from({ length: last - first + 1 }, (_, i) => first + i);
    const choice = (q, ans, distractors, explanation) => ({
        q, ans: String(ans), options: [...new Set([ans, ...distractors].map(String))].slice(0, 3),
        type: 'Trắc nghiệm', explanation
    });
    const fill = (q, ans, explanation) => ({ q, ans: String(ans), options: [], type: 'Điền khuyết', explanation });
    const words = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
    const read = n => {
        if (n <= 10) return words[n];
        if (n === 100) return 'một trăm';
        const ten = Math.floor(n / 10), unit = n % 10;
        const prefix = ten === 1 ? 'mười' : words[ten] + ' mươi';
        return unit ? prefix + ' ' + (unit === 5 ? 'lăm' : unit === 1 && ten > 1 ? 'mốt' : words[unit]) : prefix;
    };
    const nOptions = (n, min, max) => [n + 1, n - 1, n + 2, n - 2].filter(v => v >= min && v <= max);
    const tokens = (symbol, count) => Array(count).fill(symbol).join('  ');
    const pictures = [['★', 'ngôi sao'], ['●', 'chấm tròn'], ['♥', 'trái tim']];
    const count = (min, max) => pictures.flatMap(([symbol, name]) => range(min, max).map(n =>
        choice(`Có mấy ${name}?<br>${n ? tokens(symbol, n) : '【　】'}`, n, nOptions(n, min, max),
            n ? `Đếm lần lượt được ${n} ${name}.` : 'Khung trống nên có 0 hình.')
    ));
    const reading = (min, max) => range(min, max).map(n =>
        choice(`Số đọc là “${read(n)}” viết thế nào?`, n, nOptions(n, min, max), `“${read(n)}” viết là ${n}.`)
    );
    const numbers = max => max === 10 ? range(0, 10) : [...range(10, 29), 30, 34, 39, 42, 47, 53, 58, 60, 66, 71, 77, 83, 89, 94, 98, 99];
    function compare(max) {
        const domain = numbers(max);
        return domain.flatMap((a, i) => [a, domain[(i + 1) % domain.length], domain[(i + domain.length - 1) % domain.length]].map(b => {
            const answer = a < b ? '<' : a > b ? '>' : '=';
            const relation = a < b ? 'bé hơn' : a > b ? 'lớn hơn' : 'bằng';
            return choice(`Chọn dấu thích hợp.<br>${a}　?　${b}`, answer, ['<', '>', '='], `${a} ${relation} ${b}.`);
        }));
    }
    function order(max) {
        const domain = numbers(max);
        return domain.slice(0, -2).flatMap((a, i) => {
            const b = domain[i + 1], c = domain[i + 2];
            return [
                choice(`Chọn số bé nhất.<br>${b}　${c}　${a}`, a, [b, c], `${a} bé hơn cả ${b} và ${c}.`),
                choice(`Chọn số lớn nhất.<br>${c}　${a}　${b}`, c, [a, b], `${c} lớn hơn cả ${a} và ${b}.`)
            ];
        });
    }
    const shapes = [['■', 'hình vuông'], ['●', 'hình tròn'], ['▲', 'hình tam giác'], ['▬', 'hình chữ nhật']];
    const shapeNames = shapes.map(([, name]) => name);
    const shape = () => shapes.flatMap(([symbol, name]) => [
        choice(`Đây là hình gì?<br>${symbol}`, name, shapeNames, `${symbol} là ${name}.`),
        choice('Chọn ' + name + '.', symbol, shapes.map(([item]) => item), symbol + ' là ' + name + '.')
    ]);
    const countShapes = () => shapes.flatMap(([symbol, name], i) => range(1, 4).map(n =>
        fill(`Có mấy ${name}?<br>${tokens(symbol, n)}　${shapes[(i + 1) % 4][0]}<br>Có ___ hình.`, n, `Có ${n} ${name}.`)
    ));
    const pattern = () => shapes.flatMap(([a], i) => [1, 2, 3].map(offset => {
        const b = shapes[(i + offset) % 4][0];
        return choice(`Chọn hình tiếp theo.<br>${a}　${b}　${a}　${b}　${a}　?`, b, shapes.map(([symbol]) => symbol),
            `Các hình lặp lại theo nhóm ${a}　${b}.`);
    }));
    const colors = ['#df544e', '#168668', '#3564d5'];
    function solidDrawing(index, width) {
        const color = colors[index], x = 8, y = 23, height = 30, depth = 12;
        return `<svg width="96" height="68" viewBox="0 0 96 68" role="img" aria-label="Khối ${['đỏ', 'xanh lá', 'xanh dương'][index]}"><g fill="${color}" stroke="#263249" stroke-width="2"><path d="M${x} ${y} l${depth} -${depth} h${width} l-${depth} ${depth} Z" fill-opacity=".55"/><path d="M${x + width} ${y} l${depth} -${depth} v${height} l-${depth} ${depth} Z" fill-opacity=".8"/><rect x="${x}" y="${y}" width="${width}" height="${height}"/></g></svg>`;
    }
    function solid() {
        const names = ['khối lập phương', 'khối hộp chữ nhật'];
        const figures = ['đỏ', 'xanh lá', 'xanh dương'];
        return colors.flatMap((_, i) => {
            const row = colors.map((_, j) => solidDrawing(j, i === j ? 30 : 55)).join(' ');
            return [
                choice(`Chọn khối lập phương.<br>${row}`, figures[i], figures, `Khối màu ${figures[i]} có dạng ${names[0]}.`),
                ...colors.filter((_, j) => j !== i).map(color => {
                    const j = colors.indexOf(color);
                    return choice(`Khối màu ${figures[j]} có dạng gì?<br>${row}`, names[1], names, `Khối màu ${figures[j]} có dạng ${names[1]}.`);
                }),
                choice(`Khối màu ${figures[i]} có dạng gì?<br>${row}`, names[0], names, `Khối màu ${figures[i]} có dạng ${names[0]}.`)
            ];
        });
    }
    function position() {
        return shapes.flatMap(([a], i) => {
            const b = shapes[(i + 1) % 4][0], c = shapes[(i + 2) % 4][0], options = [a, b, c];
            return [
                choice(`${a}　${b}　${c}<br>Hình nào ở bên trái hình ${b}?`, a, options, `${a} ở bên trái ${b}.`),
                choice(`${a}　${b}　${c}<br>Hình nào ở bên phải hình ${b}?`, c, options, `${c} ở bên phải ${b}.`),
                choice(`${a}<br>${b}<br>${c}<br>Hình nào ở ngay trên hình ${b}?`, a, options, `${a} ở ngay trên ${b}.`),
                choice(`${a}<br>${b}<br>${c}<br>Hình nào ở ngay dưới hình ${b}?`, c, options, `${c} ở ngay dưới ${b}.`)
            ];
        });
    }
    const operations10 = add => range(0, 10).flatMap(a => range(0, add ? 10 - a : a).map(b => [a, b]));
    function operations100(add, twoDigit) {
        return [10, 12, 19, 21, 24, 30, 35, 42, 56, 62, 74, 83, 90, 99].flatMap(a => {
            const tens = Math.floor(a / 10), units = a % 10;
            const bTens = twoDigit ? range(1, add ? 9 - tens : tens) : [0];
            return bTens.flatMap(t => range(twoDigit ? 0 : 1, add ? 9 - units : units).map(u => [a, t * 10 + u]));
        });
    }
    function arithmetic(pairs, add) {
        const op = add ? '+' : '−';
        return pairs.map(([a, b]) => {
            const ans = add ? a + b : a - b;
            return fill(`Tính.<br>${a} ${op} ${b} = ___`, ans, `${a} ${op} ${b} = ${ans}.`);
        });
    }
    function stories(pairs, add) {
        const contexts = [['Mai', 'quả táo'], ['Nam', 'viên bi'], ['An', 'bút chì'], ['Hà', 'bông hoa']];
        return pairs.filter(([a, b]) => a > 0 && b > 0).map(([a, b], index) => {
            const [name, item] = contexts[index % contexts.length];
            const ans = add ? a + b : a - b;
            const action = add ? 'được thêm' : 'cho bạn';
            const ask = add ? 'có tất cả' : 'còn';
            return fill(`${name} có ${a} ${item}, rồi ${action} ${b} ${item}.<br>${name} ${ask} mấy ${item}?<br>___ ${item}.`,
                ans, `${a} ${add ? '+' : '−'} ${b} = ${ans}. ${name} ${ask} ${ans} ${item}.`);
        });
    }
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
    function clockFace(hour) {
        const point = (tick, radius) => {
            const angle = tick * Math.PI / 6;
            return [64 + Math.round(radius * Math.sin(angle)), 64 - Math.round(radius * Math.cos(angle))];
        };
        const labels = range(1, 12).map(number => {
            const [x, y] = point(number, 45);
            return `<text x="${x}" y="${y}" dy=".34em">${number}</text>`;
        }).join('');
        const [x, y] = point(hour, 25);
        return `<svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="Mặt đồng hồ kim"><circle cx="64" cy="64" r="60" fill="#fff8e8" stroke="#365570" stroke-width="3"/><g text-anchor="middle" fill="#172842" font-size="13">${labels}</g><path d="M64 64 V31" stroke="#3564d5" stroke-width="3" stroke-linecap="round"/><path d="M64 64 L${x} ${y}" stroke="#a02b33" stroke-width="5" stroke-linecap="round"/><circle cx="64" cy="64" r="4" fill="#172842"/></svg>`;
    }
    const clock = () => range(1, 12).map(hour =>
        choice(`Đồng hồ chỉ mấy giờ?<br>${clockFace(hour)}`, `${hour} giờ`,
            [`${hour % 12 + 1} giờ`, `${(hour + 10) % 12 + 1} giờ`], `Kim dài chỉ số 12, kim ngắn chỉ số ${hour}.`)
    );
    const week = () => days.flatMap((day, i) => [-1, 1].map(step => {
        const ans = days[(i + step + 7) % 7], when = step === 1 ? 'Ngày mai' : 'Hôm qua';
        return choice(`Hôm nay là ${day.toLowerCase()}. ${when} là thứ mấy?`, ans, [day, days[(i - step + 7) % 7]],
            `Nếu hôm nay là ${day.toLowerCase()}, ${when.toLowerCase()} là ${ans.toLowerCase()}.`);
    }));
    const calendar = () => range(7, 26).flatMap(n => [-1, 1].map(step => {
        const month = 5;
        const day = days[n % 7]; // Tháng 5 của lịch mẫu: ngày 7 là thứ Hai.
        const when = step === 1 ? 'Ngày mai' : 'Hôm qua';
        return choice(`Lịch hôm nay: ${day}, ngày ${n} tháng ${month}.<br>${when} là ngày mấy?`, n + step, [n, n - step],
            `${when} là ngày ${n + step} tháng ${month}.`);
    }));
    function rulerDrawing(length) {
        const xAt = cm => 14 + cm * 23;
        const marks = range(0, 12).map(cm =>
            `<path d="M${xAt(cm)} 33 v8" stroke="#523737"/><text x="${xAt(cm)}" y="55" text-anchor="middle">${cm}</text>`
        ).join('');
        const end = xAt(length);
        return `<svg width="100%" height="68" viewBox="0 0 304 68" role="img" aria-label="Bút chì đặt dọc thước xăng-ti-mét"><path d="M14 13 H${end - 9} L${end} 20 L${end - 9} 27 H14 Z" fill="#fbd259" stroke="#815323" stroke-width="1.5"/><path d="M14 27 V33 M${end} 20 V33" stroke="#815323" stroke-dasharray="2 2"/><rect x="4" y="33" width="296" height="30" rx="3" fill="#f7c9cf" stroke="#9a4b56"/><g fill="#42262a" font-size="12">${marks}</g></svg>`;
    }
    const ruler = () => range(1, 12).map(n =>
        fill(`Đọc độ dài của bút chì.<br>${rulerDrawing(n)}<br>Bút dài ___ cm.`, n, `Từ vạch 0 đến vạch ${n} là ${n} cm.`)
    );
    const compareLength = () => range(2, 6).flatMap(n => [-1, 1].flatMap(delta => [true, false].map(longer => {
        const b = n + delta;
        const answer = (n > b) === longer ? 'Băng A' : 'Băng B';
        return choice(`Hai băng giấy đặt thẳng đầu bên trái.<br>A　${'■'.repeat(n)}<br>B　${'■'.repeat(b)}<br>Băng nào ${longer ? 'dài' : 'ngắn'} hơn?`,
            answer, ['Băng A', 'Băng B'], `${answer} ${longer ? 'dài' : 'ngắn'} hơn khi đặt thẳng một đầu.`);
    })));
    const skills = {
        count5: () => count(0, 5), count10: () => count(6, 10),
        read5: () => reading(0, 5), read10: () => reading(6, 10), read100: () => reading(10, 100),
        groups: () => range(2, 7).flatMap(a => [a - 1, a, a + 1].map(b => {
            const ans = a < b ? 'Ít hơn' : a > b ? 'Nhiều hơn' : 'Bằng nhau';
            return choice(`Nhóm sao so với nhóm tim thế nào?<br>${tokens('★', a)}<br>${tokens('♥', b)}`, ans,
                ['Ít hơn', 'Nhiều hơn', 'Bằng nhau'], `Ghép mỗi sao với một tim. Số sao ${ans.toLowerCase()} số tim.`);
        })),
        compare10: () => compare(10), compare100: () => compare(100),
        order10: () => order(10), order100: () => order(100),
        split10: () => range(3, 10).flatMap(n => range(1, n - 1).map(a =>
            fill(`Số ${n} gồm ${a} và mấy?<br>${a} và ___.`, n - a, `Tách ${n} thành ${a} và ${n - a}.`)
        )),
        shape, countShapes, pattern,
        pieces: () => [1, 2].flatMap(rows => range(2, 5).map(columns => {
            const tile = 23;
            const squares = range(0, rows * columns - 1).map(i => {
                const x = 2 + i % columns * tile, y = 2 + Math.floor(i / columns) * tile;
                return `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" fill="${colors[i % 3]}" stroke="#263249"/>`;
            }).join('');
            const svg = `<svg width="${columns * tile + 4}" height="${rows * tile + 4}" role="img" aria-label="Hình ghép bằng các mảnh vuông">${squares}</svg>`;
            const n = rows * columns;
            return choice(`Hình này ghép từ mấy mảnh hình vuông?<br>${svg}`, n, [n - 1, n + 1], `Đếm từng mảnh vuông được ${n} mảnh.`);
        })),
        solid, position,
        add10: () => arithmetic(operations10(true), true), sub10: () => arithmetic(operations10(false), false),
        addStory10: () => stories(operations10(true), true), subStory10: () => stories(operations10(false), false),
        add21: () => arithmetic(operations100(true, false), true), add22: () => arithmetic(operations100(true, true), true),
        sub21: () => arithmetic(operations100(false, false), false), sub22: () => arithmetic(operations100(false, true), false),
        addStory100: () => stories(operations100(true, true), true), subStory100: () => stories(operations100(false, true), false),
        place: () => numbers(100).map(n => fill(`Viết số gồm ${Math.floor(n / 10)} chục và ${n % 10} đơn vị.<br>Số đó là ___.`, n,
            `Chữ số hàng chục là ${Math.floor(n / 10)}, chữ số hàng đơn vị là ${n % 10}.`)),
        sequence100: () => range(2, 99).map(n => fill(`Điền số còn thiếu.<br>${n - 1}　___　${n + 1}`, n, `${n} đứng ngay sau ${n - 1} và ngay trước ${n + 1}.`)),
        compareLength, ruler,
        measureUnits: () => range(2, 8).map(n => fill(`Mỗi dấu ✋ là một gang tay.<br>${tokens('✋', n)}<br>Dải giấy dài ___ gang tay.`,
            n, `Có ${n} gang tay đặt liền nhau.`)),
        estimate: () => [
            ['cục tẩy', '4 cm', '40 cm', '4 gang tay'], ['bút chì', '16 cm', '1 cm', '6 gang tay'],
            ['thước kẻ của em', '20 cm', '2 cm', '8 gang tay'], ['chiếc kẹp giấy', '3 cm', '30 cm', '3 gang tay'],
            ['chiều dài hộp bút', '22 cm', '2 cm', '9 gang tay'], ['chiều dài quyển vở', '24 cm', '4 cm', '8 gang tay']
        ].map(([object, ans, ...wrong]) => choice(`Chọn độ dài gần đúng của ${object}.`, ans, wrong, `${ans} là độ dài hợp lý trong các lựa chọn.`)),
        clock, week, calendar
    };
    root.Grade1MathPractice = { choice, fill, skills };
})(typeof globalThis !== 'undefined' ? globalThis : this);
