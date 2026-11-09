;(function (root) {
    const formatter = new Intl.NumberFormat('vi-VN', { useGrouping: false, maximumFractionDigits: 8 });
    const number = value => formatter.format(value);
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const fraction = (a, b) => `${a / gcd(a, b)}/${b / gcd(a, b)}`;
    const numeric = (q, value, calculation, unit = '', mistakes = []) => {
        const format = n => number(n) + unit;
        const candidates = [...new Set([value, ...mistakes, value + 1, value + 2, value + 10].filter(n => n >= 0).map(format))];
        return [q, candidates[0], candidates.slice(1, 4), `${calculation} Kết quả là ${format(value)}.`];
    };
    const choice = (q, answer, options, explanation) => [q, answer, options.filter(option => option !== answer), explanation];
    const pick = (items, index) => items[index % items.length];
    const calculate = (a, b, op) => ({ '+': () => a + b, '−': () => a - b, '×': () => a * b, ':': () => a / b })[op]();
    const expression = (a, b, op) => `${number(a)} ${op} ${number(b)}`;
    const decimalOperation = (op, { a, b, c }) => {
        const right = b / 10;
        const left = op === ':' ? (a * b) / 100 : op === '−' ? (a + b + 10) / 10 + c / 100 : a / 10 + c / 100;
        const problem = expression(left, right, op);
        return numeric(`Tính ${problem}.`, calculate(left, right, op), `Thực hiện phép tính ${problem}.`, '', [left + right, Math.abs(left - right), left * right]);
    };
    const fractionOperation = (op, { a, b, c }, simple = false) => {
        const m = b + 5, n = simple ? 2 * m : m + 1, x = a % 4 + 3, y = c % 2 + 1;
        const results = { '+': [x * n + y * m, m * n], '−': [x * n - y * m, m * n], '×': [x * y, m * n], ':': [x * n, m * y] };
        const [num, den] = results[op];
        const answer = fraction(num, den);
        const mistakes = [...new Set([fraction(x + y, m + n), fraction(num + 1, den), fraction(num + 2, den), fraction(num, den + 1), fraction(num + 3, den)])];
        const rule = op === ':' ? 'Nhân với phân số đảo ngược của số chia.' : op === '×' ? 'Nhân các tử số với nhau và nhân các mẫu số với nhau.' : 'Quy đồng mẫu số, rồi thực hiện phép tính ở tử số.';
        return choice(`Tính ${x}/${m} ${op} ${y}/${n} rồi viết kết quả dưới dạng phân số tối giản.`, answer, mistakes.slice(0, 4), `${rule} Rút gọn được ${answer}.`);
    };
    const timeText = minutes => `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
    const timeQuestion = (q, minutes, rule) => choice(q, timeText(minutes), [timeText(minutes + 1), timeText(minutes + 10), timeText(minutes + 60)], `${rule} Đổi ${minutes} phút được ${timeText(minutes)}.`);
    const boxQuestion = ({ a, b, c, i }, cube) => {
        const length = b + 8, width = b + 2;
        const total = i % 2;
        const side = cube ? 4 * a * a : 2 * (length + width) * c;
        const base = cube ? a * a : length * width;
        const shape = cube ? `hình lập phương cạnh ${a} cm` : `hình hộp chữ nhật dài ${length} cm, rộng ${width} cm, cao ${c} cm`;
        return numeric(`Tính diện tích ${total ? 'toàn phần' : 'xung quanh'} của ${shape}.`, side + (total ? 2 * base : 0),
            total ? `Diện tích xung quanh là ${side} cm². Cộng thêm diện tích hai đáy, mỗi đáy ${base} cm².` : cube ? 'Nhân diện tích một mặt với 4.' : 'Nhân chu vi đáy với chiều cao.', ' cm²', [base, 2 * base, side + (total ? 0 : 2 * base)]);
    };
    const pieChart = (left, right) => {
        const endpoint = percent => {
            const angle = 2 * Math.PI * percent / 100 - Math.PI / 2;
            return `${(64 + 52 * Math.cos(angle)).toFixed(2)},${(64 + 52 * Math.sin(angle)).toFixed(2)}`;
        };
        const segments = [[0, left, '#3d8de3'], [left, left + right, '#e5a833'], [left + right, 100, '#da7577']];
        return `<svg width="128" height="128" style="flex:none" viewBox="0 0 128 128" role="img" aria-label="Biểu đồ hình quạt tròn: đọc sách ${left}%, vẽ ${right}%, hát ${100 - left - right}%">${segments.map(([start, end, color]) => {
            const labelAngle = 2 * Math.PI * (start + end) / 200 - Math.PI / 2;
            const x = Math.round(64 + 33 * Math.cos(labelAngle));
            const y = Math.round(68 + 33 * Math.sin(labelAngle));
            return `<path d="M64,64 L${endpoint(start)} A52,52 0 ${end - start > 50 ? 1 : 0},1 ${endpoint(end)} Z" fill="${color}"/><text x="${x}" y="${y}" text-anchor="middle" font-size="13" fill="#142436">${end - start}%</text>`;
        }).join('')}</svg>`;
    };
    const skills = {
        natural: ['Giá trị chữ số', ({ a, b, c }) => {
            const value = a * 100000 + b * 1000 + c * 10;
            const digit = Math.floor(value / 1000) % 10;
            return numeric(`Chữ số ở hàng nghìn trong số ${value} có giá trị là bao nhiêu?`, digit * 1000, `Chữ số ở hàng nghìn là ${digit}.`, '', [digit, digit * 100, digit * 10000]);
        }],
        roundNatural: ['Làm tròn số tự nhiên', ({ a, b, c }) => {
            const value = a * 100000 + b * 1000 + c * 100;
            return numeric(`Làm tròn ${value} đến hàng chục nghìn.`, Math.round(value / 10000) * 10000, 'Xét chữ số hàng nghìn để làm tròn.', '', [Math.floor(value / 10000) * 10000, Math.ceil(value / 10000) * 10000, Math.round(value / 1000) * 1000]);
        }],
        naturalOps: ['Bốn phép tính với số tự nhiên', ({ a, b, c, i }) => {
            const op = pick(['+', '−', '×', ':'], i);
            const left = op === ':' ? a * b * c : a * c * 100;
            return numeric(`Tính ${left} ${op} ${b}.`, calculate(left, b, op), `Thực hiện phép tính ${left} ${op} ${b}.`);
        }],
        fraction: ['Rút gọn phân số', ({ a, b }) => {
            const answer = `${a}/${a + 1}`;
            return choice(`Rút gọn ${a * b}/${(a + 1) * b} đến phân số tối giản.`, answer, [`${a + 1}/${a}`, `${a}/${a + 2}`, `${a - 1}/${a}`], `Chia cả tử số và mẫu số cho ${b}.`);
        }],
        equivalent: ['Phân số bằng nhau', ({ a, b }) => numeric(`Điền tử số còn thiếu: ${a}/${a + 1} = ?/${(a + 1) * b}.`, a * b, `Mẫu số đã nhân với ${b} nên tử số cũng nhân với ${b}.`, '', [a, a + b, (a + 1) * b])],
        decimalFraction: ['Viết phân số thập phân', ({ a, b, i }) => {
            const [den, factor] = pick([[2, 5], [5, 2], [4, 25], [20, 5], [25, 4], [125, 8]], i);
            const num = a + b;
            const target = den * factor;
            const answer = `${num * factor}/${target}`;
            return choice(`Viết phân số ${num}/${den} thành phân số thập phân có mẫu số ${target}.`, answer,
                [`${num}/${target}`, `${num + factor}/${target}`, `${num * factor + 1}/${target}`],
                `Nhân cả tử và mẫu với ${factor}, ta được ${answer}.`);
        }],
        decimalRepresentation: ['Viết số thập phân từ phân số thập phân', ({ a, b, i }) => {
            const power = pick([10, 100, 1000], i);
            const numerator = a * 10 + b;
            return numeric(`Viết ${numerator}/${power} dưới dạng số thập phân.`, numerator / power, `Mẫu số ${power} cho biết số chữ số ở phần thập phân.`, '', [numerator / (power * 10), numerator * 10 / power, numerator]);
        }],
        fractionReview: ['Ôn bốn phép tính với phân số', args => fractionOperation(pick(['+', '−', '×', ':'], args.i), args, args.i % 4 < 2)],
        fractionOps: ['Tính với phân số', args => fractionOperation(pick(['+', '−', '×', ':'], args.i), args)],
        fractionAdd: ['Cộng phân số khác mẫu', args => fractionOperation('+', args)],
        fractionSubtract: ['Trừ phân số khác mẫu', args => fractionOperation('−', args)],
        mixed: ['Đổi hỗn số thành phân số', ({ a, b, c }) => {
            const den = c + 9, num = b % 8 + 1, answer = `${a * den + num}/${den}`;
            return choice(`Viết hỗn số ${a} và ${num}/${den} thành phân số có mẫu số ${den}.`, answer,
                [`${a + num}/${den}`, `${a * den}/${den}`, `${a * den + num + 1}/${den}`], `Tử số mới là ${a} × ${den} + ${num}.`);
        }],
        angle: ['Phân loại góc theo số đo', ({ a, b, i }) => {
            const angles = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'];
            const index = i % 8 < 3 ? 0 : i % 8 < 6 ? 2 : i % 8 === 6 ? 1 : 3;
            const degrees = [a + b, 90, 90 + a + b, 180][index];
            return choice(`Góc có số đo ${degrees}° thuộc loại nào?`, angles[index], angles,
                [`Vì ${degrees}° nhỏ hơn 90°.`, 'Góc vuông có số đo 90°.', `Vì ${degrees}° nằm giữa 90° và 180°.`, 'Góc bẹt có số đo 180°.'][index]);
        }],
        massReview: ['Đổi yến, tạ, tấn sang ki-lô-gam', ({ a, b, i }) => {
            const [unit, factor] = pick([['yến', 10], ['tạ', 100], ['tấn', 1000]], i);
            return numeric(`${a} ${unit} ${b % 10} kg bằng bao nhiêu ki-lô-gam?`, a * factor + b % 10,
                `Đổi ${a} ${unit} thành ${a * factor} kg rồi cộng phần ki-lô-gam còn lại.`, ' kg', [a * factor, a * factor * 10 + b % 10]);
        }],
        rectangle: ['Chu vi và diện tích hình chữ nhật', ({ a, b, i }) => {
            const length = a + b, area = i % 2;
            return numeric(`Sân hình chữ nhật dài ${length} m, rộng ${b} m. Tính ${area ? 'diện tích' : 'chu vi'} sân.`,
                area ? length * b : 2 * (length + b), area ? 'Lấy chiều dài nhân chiều rộng.' : 'Lấy tổng chiều dài và chiều rộng nhân với 2.', area ? ' m²' : ' m');
        }],
        measure: ['Đổi số đo về dạng thập phân', ({ a, b, c, i }) => {
            const [from, to, divisor] = pick([['cm', 'm', 100], ['g', 'kg', 1000], ['m', 'km', 1000]], i);
            const quantity = (b * 10 + c) % divisor;
            return numeric(`Viết số đo ${a} ${to} ${quantity} ${from} dưới dạng số thập phân theo đơn vị ${to}.`, a + quantity / divisor,
                `Đổi ${quantity} ${from} thành ${number(quantity / divisor)} ${to}, rồi cộng với ${a} ${to}.`, ` ${to}`, [a + quantity / (divisor * 10), a + quantity * 10 / divisor, quantity / divisor]);
        }],
        decimalPlace: ['Hàng của số thập phân', ({ a, b, c, i }) => {
            const digits = [b % 10, c, a % 10];
            const index = i % 3;
            return numeric(`Trong số ${a},${digits.join('')}, chữ số hàng ${['phần mười', 'phần trăm', 'phần nghìn'][index]} là chữ số nào?`, digits[index],
                `Đếm từ dấu phẩy sang phải đến chữ số thứ ${index + 1}.`, '', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        }],
        compareDecimal: ['So sánh số thập phân', ({ a, b, i }) => {
            const decimal = b % 8 + 1;
            const left = `${a},${decimal}`, right = `${a},${String(decimal * 10 + i % 3 - 1).padStart(2, '0')}`;
            const answer = pick(['>', '=', '<'], i);
            return choice(`Chọn dấu thích hợp: ${left} ? ${right}.`, answer, ['>', '=', '<'], `Viết ${left} thành ${left}0 rồi so sánh từ trái sang phải.`);
        }],
        roundDecimal: ['Làm tròn số thập phân', ({ a, b, c, i }) => {
            const divisor = pick([1, 10, 100], i);
            const value = a + b / 100 + c / 1000;
            const rounded = Math.round((a * 1000 + b * 10 + c) / (1000 / divisor)) / divisor;
            return numeric(`Làm tròn ${number(value)} đến hàng ${pick(['đơn vị', 'phần mười', 'phần trăm'], i)}.`, rounded, 'Xét chữ số ngay bên phải hàng cần làm tròn.', '', [rounded - 1 / divisor, rounded + 1 / divisor, value]);
        }],
        hectare: ['Đổi km² và ha', ({ a, b, i }) => i % 2
            ? numeric(`${a * 100 + b} ha bằng bao nhiêu ki-lô-mét vuông?`, a + b / 100, '1 km² = 100 ha. Chia số héc-ta cho 100.', ' km²', [a + b / 10, a + b / 1000, a])
            : numeric(`${number(a + b / 100)} km² bằng bao nhiêu héc-ta?`, a * 100 + b, '1 km² = 100 ha. Nhân số ki-lô-mét vuông với 100.', ' ha', [a * 10 + b, a * 100, a * 1000 + b])],
        areaConvert: ['Đổi đơn vị diện tích', ({ a, b, i }) => {
            const [from, to] = pick([['m²', 'dm²'], ['dm²', 'cm²'], ['cm²', 'mm²']], i);
            return numeric(`${a} ${from} ${b} ${to} bằng bao nhiêu ${to}?`, 100 * a + b, `1 ${from} = 100 ${to}.`, ` ${to}`, [a * 10 + b, a * 100, a * 1000 + b]);
        }],
        decimalAdd: ['Cộng số thập phân', args => decimalOperation('+', args)],
        decimalSubtract: ['Trừ số thập phân', args => decimalOperation('−', args)],
        decimalMultiply: ['Nhân số thập phân', args => decimalOperation('×', args)],
        decimalDivide: ['Chia số thập phân', args => decimalOperation(':', args)],
        decimalShift: ['Dịch dấu phẩy khi nhân, chia', ({ a, b, i }) => {
            const op = i % 2 ? ':' : '×', shift = 10 ** (1 + i % 3), value = (a * 10 + b) / 100;
            const right = Math.floor(i / 2) % 2 ? 1 / shift : shift;
            return numeric(`Tính ${expression(value, right, op)}.`, calculate(value, right, op), 'Dời dấu phẩy theo chiều và số hàng tương ứng.', '', [calculate(value, right, op === ':' ? '×' : ':'), value, value * 10]);
        }],
        triangleKind: ['Nhận dạng tam giác theo góc', ({ a, b, i }) => {
            const angle = a + 20;
            const largest = pick([80 + b % 9, 90, 100 + b % 16], i);
            const answer = pick(['Tam giác nhọn', 'Tam giác vuông', 'Tam giác tù'], i);
            return choice(`Tam giác có ba góc ${angle}°, ${180 - angle - largest}°, ${largest}° thuộc loại nào?`, answer,
                ['Tam giác nhọn', 'Tam giác vuông', 'Tam giác tù'], `Góc lớn nhất ${largest}° ${largest < 90 ? 'nhỏ hơn' : largest === 90 ? 'bằng' : 'lớn hơn'} 90°.`);
        }],
        triangleArea: ['Diện tích tam giác', ({ a, b }) => numeric(`Tam giác có đáy ${a} cm, chiều cao ${b} cm. Tính diện tích.`, a * b / 2, `Lấy ${a} × ${b} rồi chia cho 2.`, ' cm²', [a * b, (a + b) / 2, a + b])],
        trapezoid: ['Diện tích hình thang', ({ a, b, c }) => numeric(`Hình thang có hai đáy ${b} m và ${a + b} m, cao ${c} m. Tính diện tích.`, (a + 2 * b) * c / 2, `Cộng hai đáy, nhân với ${c}, rồi chia cho 2.`, ' m²', [(a + 2 * b) * c, b * c / 2, (a + b) * c])],
        circleRadius: ['Bán kính và đường kính', ({ a, b }) => numeric(`Đường kính hình tròn dài ${2 * a + b} cm. Bán kính dài bao nhiêu?`, (2 * a + b) / 2, 'Bán kính bằng nửa đường kính.', ' cm', [2 * a + b, (2 * a + b) * 2, a])],
        circleMeasure: ['Chu vi hình tròn', ({ a, b }) => numeric(`Tính chu vi hình tròn có bán kính ${number(a + b / 10)} cm. Dùng 3,14.`, (a * 10 + b) * 628 / 1000, 'Nhân bán kính với 2 rồi nhân với 3,14.', ' cm', [(a * 10 + b) * 314 / 1000, 2 * a, (a + b / 10) ** 2 * 3.14])],
        circleArea: ['Diện tích hình tròn', ({ a, b }) => {
            const radius = a * 10 + b;
            return numeric(`Tính diện tích hình tròn bán kính ${number(radius / 10)} cm. Dùng 3,14.`, radius ** 2 * 314 / 10000, 'Nhân bán kính với bán kính rồi nhân với 3,14.', ' cm²', [radius ** 2 / 100, radius * 628 / 1000, radius * 314 / 1000]);
        }],
        composeShape: ['Ghép hai tam giác thành hình chữ nhật', ({ a, b }) => numeric(`Cắt hình chữ nhật ${a + b} cm × ${b} cm theo đường chéo. Mỗi tam giác thu được có diện tích bao nhiêu?`, (a + b) * b / 2, 'Hai tam giác bằng nhau, mỗi hình chiếm một nửa diện tích hình chữ nhật.', ' cm²', [(a + b) * b, a + 2 * b])],
        ratio: ['Viết tỉ số', ({ a, b }) => choice(`Hộp có ${a} bút xanh và ${a + b} bút đỏ. Viết tỉ số số bút xanh so với số bút đỏ theo số lượng đã cho.`, `${a} : ${a + b}`,
            [`${a + b} : ${a}`, `${a} : ${2 * a + b}`, `${a + b} : ${2 * a + b}`], 'Số bút xanh đứng trước, số bút đỏ đứng sau.')],
        percentFraction: ['Viết tỉ số phần trăm', ({ a, b }) => numeric(`Trong 100 thẻ có ${a + b} thẻ màu cam. Thẻ màu cam chiếm bao nhiêu phần trăm?`, a + b, `Viết ${a + b}/100 dưới dạng phần trăm.`, '%', [100 - a - b, a, b])],
        scale: ['Tính độ dài thực theo tỉ lệ bản đồ', ({ a, b, i }) => {
            const denominator = pick([1000, 5000, 10000, 25000, 50000], i);
            const length = a + b / 10;
            return numeric(`Bản đồ tỉ lệ 1 : ${denominator}. Đo được ${number(length)} cm trên bản đồ. Độ dài thực bằng bao nhiêu mét?`, length * denominator / 100, 'Nhân độ dài trên bản đồ với mẫu số tỉ lệ để được số xăng-ti-mét thực, sau đó chia cho 100.', ' m', [length * denominator, length * denominator / 1000, length]);
        }],
        sumRatio: ['Tìm hai số theo tổng và tỉ số', ({ a, b, c }) => {
            const x = b % 4 + 1, y = x + c % 3 + 1;
            return numeric(`Hai lớp thu được ${a * (x + y)} kg giấy. Số giấy lớp A bằng ${x}/${y} số giấy lớp B. Lớp A thu được bao nhiêu?`, a * x,
                `Tổng gồm ${x + y} phần bằng nhau. Mỗi phần là ${a} kg và lớp A có ${x} phần.`, ' kg', [a * y, a * (x + y), a]);
        }],
        differenceRatio: ['Tìm hai số theo hiệu và tỉ số', ({ a, b, c }) => {
            const x = b % 4 + 1, y = x + c % 3 + 1;
            return numeric(`Chị có nhiều hơn em ${a * (y - x)} nhãn vở. Số nhãn của em bằng ${x}/${y} số nhãn của chị. Em có bao nhiêu nhãn?`, a * x,
                `Hiệu gồm ${y - x} phần bằng nhau. Mỗi phần là ${a} nhãn và em có ${x} phần.`, ' nhãn', [a * y, a * (y - x), a * (x + y)]);
        }],
        percentRatio: ['Tìm tỉ số phần trăm của hai số', ({ a, b, i }) => {
            const total = pick([20, 25, 40, 50], i), part = 1 + (a + b) % (total - 1);
            return numeric(`Trong ${total} cây có ${part} cây xoài. Cây xoài chiếm bao nhiêu phần trăm?`, part * 100 / total, `Lấy ${part} chia cho ${total}, rồi nhân thương với 100.`, '%', [100 - part * 100 / total, part, part / total]);
        }],
        percentValue: ['Tìm giá trị phần trăm', ({ a, b }) => {
            const price = (a + 4) * 10000;
            return numeric(`Một chiếc ba lô giá ${price} đồng, được giảm ${b}% giá niêm yết. Số tiền được giảm là bao nhiêu?`, price * b / 100, `Lấy ${price} chia cho 100 rồi nhân với ${b}.`, ' đồng', [price * (100 - b) / 100, price / 100, price]);
        }],
        calculator: ['Kiểm tra kết quả trên máy tính cầm tay', ({ a, b, c }) => numeric(`Bấm ${a * 100 + b} × ${c * 10 + 1} = trên máy tính cầm tay. Máy hiển thị số nào?`, (a * 100 + b) * (c * 10 + 1), 'Nhập số thứ nhất, phím nhân, số thứ hai rồi bấm dấu bằng.')],
        calculatorContext: ['Thực hành tính chi phí', ({ a, b, c }) => numeric(`Mỗi vé giá ${a * 1000 + 500} đồng. Dùng máy tính cầm tay để tính tiền mua ${b + c} vé.`, (a * 1000 + 500) * (b + c), 'Nhân đơn giá với số vé.', ' đồng')],
        cubeCount: ['So sánh thể tích qua số khối lập phương', ({ a, b }) => numeric(`Hình A ghép từ ${a + b} khối lập phương, hình B từ ${a} khối cùng cỡ. Hình A nhiều hơn hình B bao nhiêu khối?`, b, `Lấy ${a + b} trừ ${a}.`, ' khối', [a, a + b, 2 * a + b])],
        volumeSmall: ['Đổi dm³ và cm³', ({ a, b }) => numeric(`${a} dm³ ${b * 10} cm³ bằng bao nhiêu xăng-ti-mét khối?`, a * 1000 + b * 10, '1 dm³ = 1 000 cm³.', ' cm³', [a * 100 + b * 10, a * 1000 + b, b * 10])],
        volumeLarge: ['Đổi m³ và dm³', ({ a, b }) => numeric(`${a} m³ ${b * 10} dm³ bằng bao nhiêu mét khối?`, a + b / 100, '1 dm³ = 0,001 m³. Đổi phần đề-xi-mét khối rồi cộng.', ' m³', [a + b / 10, a + b / 1000, a * 1000 + b * 10])],
        net: ['Các mặt trong hình khai triển', ({ a, b, i }) => {
            const shape = pick(['hình lập phương', 'hình hộp chữ nhật', 'hình trụ'], i);
            const right = pick(['6 hình vuông bằng nhau', '6 hình chữ nhật', '2 hình tròn bằng nhau và 1 hình chữ nhật'], i);
            const detail = pick([` cạnh ${a} cm`, ` dài ${a + b} cm, rộng ${b} cm, cao ${a + b + 1} cm`, ` có bán kính đáy ${a} cm`], i);
            return choice(`Hình khai triển của ${shape}${detail} gồm những mặt nào?`, right, ['6 hình vuông bằng nhau', '6 hình chữ nhật', '2 hình tròn bằng nhau và 1 hình chữ nhật', '4 hình tam giác'],
                `Khi trải phẳng ${shape}, ta có ${right}.`);
        }],
        boxArea: ['Diện tích hình hộp chữ nhật', args => boxQuestion(args, false)],
        cubeArea: ['Diện tích hình lập phương', args => boxQuestion(args, true)],
        boxVolume: ['Thể tích hình hộp chữ nhật', ({ a, b, c }) => numeric(`Hộp chữ nhật dài ${a + b} cm, rộng ${b} cm, cao ${c} cm. Tính thể tích hộp.`, (a + b) * b * c, 'Nhân chiều dài, chiều rộng và chiều cao.', ' cm³', [(a + b) * b, 2 * (a + 2 * b) * c])],
        cubeVolume: ['Thể tích hình lập phương', ({ a, b }) => numeric(`Hình lập phương có cạnh ${a + b} cm. Tính thể tích.`, (a + b) ** 3, 'Lấy cạnh × cạnh × cạnh.', ' cm³', [(a + b) ** 2, (a + b) * 3, (a + b) ** 2 * 6])],
        estimateVolume: ['Ước lượng thể tích hộp', ({ a, b, c }) => numeric(`Hộp dài ${a},2 cm, rộng ${b},1 cm, cao ${c},3 cm. Làm tròn từng số đo đến xăng-ti-mét rồi ước lượng thể tích.`, a * b * c, `Ba số đo sau làm tròn là ${a} cm, ${b} cm và ${c} cm.`, ' cm³', [(a + 1) * b * c, a * (b + 1) * c, a * b * (c + 1)])],
        timeConvert: ['Đổi giờ và phút', ({ a, b }) => numeric(`${a % 6 + 1} giờ ${b + 11} phút bằng bao nhiêu phút?`, (a % 6 + 1) * 60 + b + 11, 'Đổi giờ sang phút theo 1 giờ = 60 phút rồi cộng.', ' phút', [(a % 6 + 1) * 100 + b + 11])],
        timeAddSubtract: ['Cộng và trừ số đo thời gian', ({ a, b, i }) => {
            const x = (a % 8 + 3) * 60 + b + 9, y = 100 + b, op = i % 2 ? '−' : '+';
            return timeQuestion(`Tính ${timeText(x)} ${op} ${timeText(y)}.`, calculate(x, y, op), `Đổi về phút rồi tính ${x} ${op} ${y}.`);
        }],
        timeMultiplyDivide: ['Nhân và chia số đo thời gian', ({ a, b, c, i }) => {
            const base = 60 + a + b, factor = c % 5 + 2;
            return i % 2 ? timeQuestion(`Tính (${timeText(base * factor)}) : ${factor}.`, base, `Đổi về phút rồi tính ${base * factor} : ${factor}.`)
                : timeQuestion(`Tính (${timeText(base)}) × ${factor}.`, base * factor, `Đổi về phút rồi tính ${base} × ${factor}.`);
        }],
        speed: ['Tính vận tốc', ({ a, b }) => {
            const hours = b % 4 + 2, speed = 25 + a;
            return numeric(`Xe đi đều được ${speed * hours} km trong ${hours} giờ. Vận tốc của xe là bao nhiêu?`, speed, 'Vận tốc bằng quãng đường chia cho thời gian.', ' km/h', [speed * hours, speed * hours ** 2, hours]);
        }],
        distance: ['Tính quãng đường', ({ a, b }) => numeric(`Xe chạy đều với vận tốc ${a + 30} km/h trong ${number(1 + b / 10)} giờ. Xe đi được bao nhiêu ki-lô-mét?`, (a + 30) * (10 + b) / 10, 'Quãng đường bằng vận tốc nhân với thời gian.', ' km', [a + 30, (a + 30) * (10 + b), (a + 30) * b / 10])],
        duration: ['Tính thời gian chuyển động đều', ({ a, b }) => {
            const hours = (b + 10) / 10, speed = (a % 6 + 3) * 10;
            return numeric(`Xe chạy đều ${(speed / 10) * (b + 10)} km với vận tốc ${speed} km/h. Xe đi hết bao nhiêu giờ?`, hours, 'Thời gian bằng quãng đường chia cho vận tốc.', ' giờ', [hours * 10, hours + 1, b / 10]);
        }],
        motionPractice: ['Vận dụng đổi phút để tính quãng đường', ({ a, b }) => {
            const speed = (a + 15) * 4, minutes = 15 * (b % 3 + 1);
            return numeric(`Xe đi đều với vận tốc ${speed} km/h trong ${minutes} phút. Tính quãng đường xe đi được.`, speed * minutes / 60,
                `Đổi ${minutes} phút thành ${number(minutes / 60)} giờ rồi nhân với vận tốc.`, ' km', [speed * minutes, speed, speed / 60]);
        }],
        survey: ['Phân loại và đếm số liệu', ({ a, b, c, i }) => {
            const quantities = [a % 5 + 2, b % 5 + 2, c % 5 + 2];
            const labels = ['Cam', 'Táo', 'Ổi'];
            const target = i % 3;
            const votes = Array.from({ length: Math.max(...quantities) }, (_, k) => labels.filter((_, index) => k < quantities[index])).flat();
            return numeric(`Các phiếu chọn trái cây ghi: ${votes.join(', ')}. Có bao nhiêu phiếu chọn ${labels[target].toLowerCase()}?`, quantities[target],
                `Đếm số lần xuất hiện của “${labels[target]}” trong danh sách.`, ' phiếu', [votes.length, ...quantities]);
        }],
        pie: ['Đọc biểu đồ hình quạt tròn', ({ a, b, i }) => {
            const first = 28 + a % 15, second = 20 + b % 12, total = 100 * (i % 4 + 1);
            const count = first * total / 100;
            return numeric(`Biểu đồ khảo sát ${total} bạn. Có bao nhiêu bạn chọn đọc sách (màu xanh)?<br>${pieChart(first, second)}`, count,
                `Phần đọc sách chiếm ${first}%. Lấy ${total} × ${first} : 100.`, ' bạn', [second * total / 100, (100 - first - second) * total / 100, total - count]);
        }],
        frequency: ['Tỉ số số lần xuất hiện', ({ a, b }) => {
            const total = a + b + 10, answer = fraction(a, total);
            const mistakes = [...new Set([fraction(total - a, total), fraction(total, a), fraction(a, total - 1), fraction(a + 1, total)])].filter(value => value !== answer);
            return choice(`Gieo xúc xắc ${total} lần, mặt 6 chấm xuất hiện ${a} lần. Viết tỉ số số lần xuất hiện mặt 6 chấm so với số lần gieo dưới dạng phân số tối giản.`, answer, mistakes.slice(0, 3),
                `Số lần xuất hiện là tử số, tổng số lần gieo là mẫu số. Rút gọn ${a}/${total} được ${answer}.`);
        }]
    };

    const params = (random, i) => ({
        a: 3 + Math.floor(random() * 39),
        b: 2 + Math.floor(random() * 18),
        c: 1 + Math.floor(random() * 9),
        i
    });
    const generate = (key, random) => skills[key][1](params(random, Math.floor(random() * 24)));
    function variants(key) {
        return Array.from({ length: 32 }, (_, i) => {
            const values = [(i * 11 % 39) / 39, (i * 7 % 18) / 18, (i * 5 % 9) / 9];
            return skills[key][1](params(() => values.shift(), i));
        });
    }

    root.Grade5MathPractice = { skills, generate, variants };
})(typeof globalThis !== 'undefined' ? globalThis : this);
