;(function (root, factory) {
    const shared = typeof module !== 'undefined' && module.exports ? require('./shared') : root.Grade4MathTemplateShared;
    const generators = factory(shared);
    if (typeof module !== 'undefined' && module.exports) module.exports = generators;
    root.Grade4MathTemplateGenerators = root.Grade4MathTemplateGenerators || {};
    Object.assign(root.Grade4MathTemplateGenerators, generators);
    root.Grade4MathTopic5Contexts = generators.contextBanks;
}(typeof globalThis !== 'undefined' ? globalThis : this, function ({ randomInt, shuffle, formatNumber }) {

const TOPIC = '5. Phép cộng và phép trừ';
const labels = ['a', 'b', 'c', 'd'];
const choose = (items, random) => items[randomInt(0, items.length - 1, random)];
const symbolFor = operation => operation === '+' ? '+' : '−';
const ADD_SUB_OPERATIONS = ['+', '-'];

function configuredOperations(config = {}, fallback = ADD_SUB_OPERATIONS) {
    const hasSingleOperation = Object.prototype.hasOwnProperty.call(config, 'operation');
    const raw = hasSingleOperation
        ? [config.operation]
        : (Array.isArray(config.operations) && config.operations.length ? config.operations : fallback);
    const operations = [...new Set(raw)];
    if (!operations.length || operations.some(operation => !ADD_SUB_OPERATIONS.includes(operation))) {
        throw new Error('Phép tính phải là phép cộng (+) hoặc phép trừ (−).');
    }
    return operations;
}

function fourRowOperations(config, random, fallback = ['+', '+', '-', '-']) {
    const hasOperationConfig = Object.prototype.hasOwnProperty.call(config, 'operation') || Array.isArray(config.operations);
    const operations = hasOperationConfig
        ? configuredOperations(config)
        : fallback;
    const rows = hasOperationConfig
        ? Array.from({ length: 4 }, (_, index) => operations[index % operations.length])
        : [...operations];
    return shuffle(rows, random);
}

function numberRange(config = {}, defaultMinimumDigits = 5, defaultMaximumDigits = 6) {
    const minimumDigits = Number(config.minimumDigits ?? defaultMinimumDigits);
    const maximumDigits = Number(config.maximumDigits ?? defaultMaximumDigits);
    if (!Number.isInteger(minimumDigits) || !Number.isInteger(maximumDigits) || minimumDigits < 1 || maximumDigits > 9 || minimumDigits > maximumDigits) {
        throw new Error('Độ dài số phải là số nguyên từ 1 đến 9 chữ số.');
    }
    const minimum = Math.max(Number(config.minimum ?? 10 ** (minimumDigits - 1)), 10 ** (minimumDigits - 1));
    const maximum = Math.min(Number(config.maximum ?? (10 ** maximumDigits - 1)), 10 ** maximumDigits - 1);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 0 || maximum < minimum) {
        throw new Error('Phạm vi số không hợp lệ.');
    }
    return { minimum, maximum };
}

function question(templateId, type, prompt, answers, explanation, extra = {}) {
    const { templateVariables = {}, ...rest } = extra;
    return {
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: TOPIC,
        type, templateId, q: prompt, options: [], ans: answers.map(formatNumber).join(', '), explanation,
        ...rest,
        templateVariables: { question: prompt, ...templateVariables }
    };
}

function fourPartFill(templateId, title, rows, explanation, extra = {}) {
    const exercises = rows.map((row, index) => `${labels[index]}) ${row.display}`).join('<br>');
    const prompt = `${title}<br>${exercises}`;
    return question(templateId, 'Điền khuyết', prompt, rows.map(row => row.answer), explanation, {
        practiceRows: rows,
        partAnswerCounts: [1, 1, 1, 1],
        templateVariables: { exercises, ...(extra.templateVariables || {}) }
    });
}

function arithmeticValues(operation, minimum, maximum, random) {
    if (operation === '+') {
        if (maximum < minimum * 2) throw new Error('Phạm vi phép cộng phải đủ lớn để tạo hai số hạng.');
        const result = randomInt(minimum * 2, maximum, random);
        const first = randomInt(minimum, result - minimum, random);
        return [first, result - first, result];
    }
    if (maximum <= minimum) throw new Error('Phạm vi phép trừ phải có số bị trừ lớn hơn số trừ.');
    const difference = randomInt(1, Math.max(1, maximum - minimum), random);
    const second = randomInt(minimum, maximum - difference, random);
    return [second + difference, second, difference];
}

function displayArithmetic(values, operation, blankIndex = -1) {
    const value = (item, index) => index === blankIndex ? '___' : formatNumber(item);
    return `${value(values[0], 0)} ${symbolFor(operation)} ${value(values[1], 1)} = ${value(values[2], 2)}`;
}

function generateAddSubMultiDigit(config = {}, random = Math.random) {
    const { minimum, maximum } = numberRange(config, 5, 6);
    const operations = fourRowOperations(config, random);
    const rows = operations.map((operation, index) => {
        const values = arithmeticValues(operation, minimum, maximum, random);
        return {
            label: labels[index], kind: 'arithmetic', operation, values,
            answer: values[2], display: displayArithmetic(values, operation, 2)
        };
    });
    return fourPartFill(
        'g4-m-add-sub-multi-digit',
        'Đặt tính rồi tính:',
        rows,
        'Mỗi lượt gồm đúng hai phép cộng và hai phép trừ với các số có nhiều chữ số.'
    );
}

function generateMissingTerm(config = {}, random = Math.random) {
    const { minimum, maximum } = numberRange(config, 5, 6);
    const operations = configuredOperations(config);
    const rows = labels.map((label, index) => {
        const operation = choose(operations, random);
        const values = arithmeticValues(operation, minimum, maximum, random);
        const blankIndex = randomInt(0, 2, random);
        return {
            label, kind: 'missing-term', operation, values, blankIndex,
            answer: values[blankIndex], display: displayArithmetic(values, operation, blankIndex)
        };
    });
    return fourPartFill(
        'g4-m-add-sub-missing-term',
        'Điền số thích hợp vào chỗ trống:',
        rows,
        'Dùng mối quan hệ giữa số hạng và tổng, hoặc giữa số bị trừ, số trừ và hiệu.'
    );
}

function maskFormattedDigit(value, digitIndex) {
    let seen = 0;
    return formatNumber(value).replace(/\d/g, digit => seen++ === digitIndex ? '___' : digit);
}

function generateMissingDigit(config = {}, random = Math.random) {
    const { minimum, maximum } = numberRange(config, 5, 6);
    const operations = configuredOperations(config);
    const rows = labels.map((label, index) => {
        const operation = choose(operations, random);
        const values = arithmeticValues(operation, minimum, maximum, random);
        const targetIndex = randomInt(0, 2, random);
        const digitCount = String(values[targetIndex]).length;
        const digitIndex = digitCount > 1 ? randomInt(1, digitCount - 1, random) : 0;
        const displayedValues = values.map((value, valueIndex) => valueIndex === targetIndex
            ? maskFormattedDigit(value, digitIndex)
            : formatNumber(value));
        return {
            label, kind: 'missing-digit', operation, values, targetIndex, digitIndex,
            answer: Number(String(values[targetIndex])[digitIndex]),
            expression: `${displayedValues[0]} ${symbolFor(operation)} ${displayedValues[1]} = ${displayedValues[2]}`,
            display: `${displayedValues[0]} ${symbolFor(operation)} ${displayedValues[1]} = ${displayedValues[2]}`
        };
    });
    return fourPartFill(
        'g4-m-add-sub-missing-digit',
        'Tìm chữ số thích hợp:',
        rows,
        'Khôi phục chữ số còn thiếu trong phép cộng hoặc phép trừ rồi kiểm tra lại kết quả.'
    );
}

function propertyRow(property, random) {
    if (property === 'commutative') {
        const first = randomInt(10, 9999, random);
        const second = randomInt(10, 9999, random);
        return {
            property, answer: first,
            display: `${formatNumber(first)} + ${formatNumber(second)} = ${formatNumber(second)} + ___`
        };
    }
    const first = randomInt(10, 999, random);
    const second = randomInt(10, 999, random);
    const third = randomInt(10, 999, random);
    return {
        property, answer: second,
        display: `(${formatNumber(first)} + ${formatNumber(second)}) + ${formatNumber(third)} = ${formatNumber(first)} + (___ + ${formatNumber(third)})`
    };
}

function generateAdditionPropertyFill(config = {}, random = Math.random) {
    const allowed = Array.isArray(config.properties) && config.properties.length
        ? config.properties.filter(item => item === 'commutative' || item === 'associative')
        : ['commutative', 'associative'];
    if (!allowed.length) throw new Error('Hãy chọn ít nhất một tính chất của phép cộng.');
    const rows = labels.map(label => ({ label, ...propertyRow(choose(allowed, random), random) }));
    return fourPartFill(
        'g4-m-addition-property-fill',
        'Viết số thích hợp vào chỗ chấm:',
        rows,
        'Đổi chỗ các số hạng hoặc nhóm các số hạng mà không làm thay đổi tổng.'
    );
}

function expressionRow(kind, minimum, maximum, random) {
    const n = () => randomInt(minimum, maximum, random);
    if (kind === 'add-difference') {
        const first = n();
        const second = n();
        const third = randomInt(0, second, random);
        return { expression: `${formatNumber(first)} + (${formatNumber(second)} − ${formatNumber(third)}) = ___`, answer: first + second - third, kind };
    }
    if (kind === 'subtract-difference') {
        const second = n();
        const third = randomInt(0, second, random);
        const first = randomInt(second - third, maximum, random);
        return { expression: `${formatNumber(first)} − (${formatNumber(second)} − ${formatNumber(third)}) = ___`, answer: first - second + third, kind };
    }
    if (kind === 'subtract-add') {
        const second = n();
        const first = randomInt(second, maximum, random);
        const third = n();
        return { expression: `${formatNumber(first)} − ${formatNumber(second)} + ${formatNumber(third)} = ___`, answer: first - second + third, kind };
    }
    const first = n();
    const second = n();
    const third = randomInt(0, first + second, random);
    return { expression: `${formatNumber(first)} + ${formatNumber(second)} − ${formatNumber(third)} = ___`, answer: first + second - third, kind: 'add-subtract' };
}

function generateAddSubExpression(config = {}, random = Math.random) {
    const { minimum, maximum } = numberRange(config, 3, 6);
    const kinds = shuffle(['add-difference', 'subtract-difference', 'subtract-add', 'add-subtract'], random);
    const rows = kinds.map((kind, index) => {
        const row = expressionRow(kind, minimum, maximum, random);
        return { label: labels[index], ...row, display: row.expression };
    });
    return fourPartFill(
        'g4-m-add-sub-expression',
        'Tính giá trị của biểu thức:',
        rows,
        'Thực hiện phép tính trong ngoặc trước, sau đó cộng hoặc trừ theo thứ tự từ trái sang phải.'
    );
}

function sumDifferenceValues(config = {}, random = Math.random) {
    const minimum = Number(config.minimumValue ?? 10);
    const maximum = Number(config.maximumValue ?? 999);
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 1 || maximum <= minimum) {
        throw new Error('Phạm vi hai số không hợp lệ.');
    }
    const small = randomInt(minimum, maximum - 1, random);
    const large = randomInt(small + 1, maximum, random);
    return { small, large, sum: small + large, difference: large - small };
}

function generateSumDifferenceDirect(config = {}, random = Math.random) {
    const values = sumDifferenceValues(config, random);
    const prompt = `Biết tổng của hai số là ${formatNumber(values.sum)}, hiệu của hai số là ${formatNumber(values.difference)}.<br>a) Số bé là ___<br>b) Số lớn là ___`;
    return question(
        'g4-m-sum-difference-direct',
        'Điền khuyết',
        prompt,
        [values.small, values.large],
        'Số bé = (Tổng − Hiệu) : 2; số lớn = (Tổng + Hiệu) : 2.',
        { values, partAnswerCounts: [1, 1] }
    );
}

function arithmeticStatement(operation, random) {
    const [first, second, result] = arithmeticValues(operation, 10000, 999999, random);
    const isTrue = random() >= 0.5;
    const shownResult = isTrue ? result : result + choose([1, 10, 100, 1000], random);
    return {
        text: `${formatNumber(first)} ${symbolFor(operation)} ${formatNumber(second)} = ${formatNumber(shownResult)}`,
        answer: isTrue ? 'Đúng' : 'Sai', operation, values: [first, second, result], shownResult
    };
}

function generateAddSubTrueFalse(config = {}, random = Math.random) {
    const rows = fourRowOperations(config, random).map((operation, index) => ({
        label: labels[index], ...arithmeticStatement(operation, random)
    }));
    return question(
        'g4-m-add-sub-true-false',
        'Đúng/Sai',
        'Chọn Đúng/Sai?',
        rows.map(row => row.answer),
        'Tính lại từng phép cộng hoặc phép trừ rồi đối chiếu với kết quả đã cho.',
        { statements: rows, partAnswerCounts: [1, 1, 1, 1] }
    );
}

function addPair(random, firstMinimum, firstMaximum, secondMinimum, secondMaximum) {
    return {
        first: randomInt(firstMinimum, firstMaximum, random),
        second: randomInt(secondMinimum, secondMaximum, random)
    };
}

function subtractPair(random, totalMinimum, totalMaximum, partMinimum, partMaximum) {
    const first = randomInt(totalMinimum, totalMaximum, random);
    const maximumPart = Math.min(partMaximum, first - 1);
    if (maximumPart < partMinimum) throw new Error('Không thể tạo số bị trừ lớn hơn số trừ.');
    return { first, second: randomInt(partMinimum, maximumPart, random) };
}

function makeWordContext(id, title, operation, createValues, statement, answerPrefix, answerSuffix) {
    const normalizedOperation = operation === '−' ? '-' : operation;
    return {
        id,
        title,
        operation: normalizedOperation,
        create(random) {
            const values = createValues(random);
            const answer = normalizedOperation === '+' ? values.first + values.second : values.first - values.second;
            const render = value => typeof value === 'function' ? value(values) : value;
            if (!Number.isSafeInteger(answer) || answer <= 0) throw new Error(`Ngữ cảnh ${id} tạo đáp án không hợp lệ.`);
            return {
                contextId: id,
                operation: normalizedOperation,
                values: { ...values, result: answer },
                answer,
                statement: render(statement),
                answerPrefix: render(answerPrefix),
                answerSuffix: render(answerSuffix),
                display: `${render(statement)} ${render(answerPrefix)} ___ ${render(answerSuffix)}`
            };
        }
    };
}

const wordProblemContexts = [
    makeWordContext('school-library-receives', 'Thư viện nhận sách', '+', random => addPair(random, 12000, 28000, 2500, 8500),
        values => `Thư viện trường có ${formatNumber(values.first)} quyển sách, nhà trường mua thêm ${formatNumber(values.second)} quyển.`,
        'Thư viện có tất cả', 'quyển sách.'),
    makeWordContext('bookstore-delivery', 'Nhà sách nhập hàng', '+', random => addPair(random, 15000, 35000, 4000, 12000),
        values => `Nhà sách có ${formatNumber(values.first)} quyển truyện, vừa nhập thêm ${formatNumber(values.second)} quyển.`,
        'Nhà sách có tất cả', 'quyển truyện.'),
    makeWordContext('rice-harvest', 'Cánh đồng thu hoạch lúa', '+', random => addPair(random, 24000, 58000, 8000, 16000),
        values => `Hợp tác xã thu hoạch ${formatNumber(values.first)} kg lúa buổi sáng và ${formatNumber(values.second)} kg lúa buổi chiều.`,
        'Cả ngày thu hoạch được', 'kg lúa.'),
    makeWordContext('factory-products', 'Nhà máy sản xuất sản phẩm', '+', random => addPair(random, 12500, 28500, 3500, 9500),
        values => `Một nhà máy sản xuất ${formatNumber(values.first)} sản phẩm trong tháng trước và ${formatNumber(values.second)} sản phẩm trong tháng này.`,
        'Hai tháng nhà máy sản xuất được', 'sản phẩm.'),
    makeWordContext('trees-planted', 'Trồng cây trong khu phố', '+', random => addPair(random, 12000, 25000, 5000, 9000),
        values => `Khu phố trồng ${formatNumber(values.first)} cây ở công viên và ${formatNumber(values.second)} cây dọc các con đường.`,
        'Khu phố đã trồng tất cả', 'cây.'),
    makeWordContext('fund-donation', 'Quỹ khuyến học', '+', random => addPair(random, 18000, 42000, 6000, 15000),
        values => `Quỹ khuyến học nhận được ${formatNumber(values.first)} đồng từ phụ huynh và ${formatNumber(values.second)} đồng từ các nhà hảo tâm.`,
        'Quỹ nhận được tất cả', 'đồng.'),
    makeWordContext('museum-visitors', 'Khách tham quan bảo tàng', '+', random => addPair(random, 10000, 32000, 2500, 8000),
        values => `Bảo tàng đón ${formatNumber(values.first)} lượt khách trong buổi sáng và ${formatNumber(values.second)} lượt khách trong buổi chiều.`,
        'Cả ngày bảo tàng đón', 'lượt khách.'),
    makeWordContext('supermarket-stock', 'Siêu thị nhập hàng', '+', random => addPair(random, 20000, 48000, 5000, 15000),
        values => `Siêu thị đang có ${formatNumber(values.first)} sản phẩm, sau đó nhập thêm ${formatNumber(values.second)} sản phẩm.`,
        'Siêu thị có', 'sản phẩm.'),
    makeWordContext('school-notebooks', 'Trường nhận vở', '+', random => addPair(random, 12000, 27000, 3000, 9000),
        values => `Nhà trường nhận ${formatNumber(values.first)} quyển vở từ kho và ${formatNumber(values.second)} quyển vở do phụ huynh tặng.`,
        'Nhà trường nhận được tất cả', 'quyển vở.'),
    makeWordContext('water-reservoir', 'Hồ chứa được bổ sung nước', '+', random => addPair(random, 35000, 75000, 8000, 22000),
        values => `Một hồ chứa có ${formatNumber(values.first)} lít nước, sau cơn mưa được bổ sung thêm ${formatNumber(values.second)} lít.`,
        'Hồ có', 'lít nước.'),
    makeWordContext('reading-station-books', 'Trạm đọc cộng đồng', '+', random => addPair(random, 14000, 30000, 4500, 11000),
        values => `Trạm đọc cộng đồng có ${formatNumber(values.first)} quyển sách thiếu nhi và được tặng thêm ${formatNumber(values.second)} quyển.`,
        'Trạm đọc có', 'quyển sách thiếu nhi.'),
    makeWordContext('fruit-cooperative', 'Hợp tác xã thu mua trái cây', '+', random => addPair(random, 28000, 65000, 7000, 18000),
        values => `Hợp tác xã thu mua ${formatNumber(values.first)} kg cam ở vườn thứ nhất và ${formatNumber(values.second)} kg cam ở vườn thứ hai.`,
        'Hợp tác xã thu mua', 'kg cam.'),
    makeWordContext('tickets-sold', 'Bán vé hội chợ', '+', random => addPair(random, 15000, 36000, 4000, 12000),
        values => `Buổi sáng hội chợ bán được ${formatNumber(values.first)} vé, buổi chiều bán thêm ${formatNumber(values.second)} vé.`,
        'Cả ngày hội chợ bán được', 'vé.'),
    makeWordContext('warehouse-toys', 'Kho đồ chơi nhập thêm', '+', random => addPair(random, 17000, 39000, 6000, 14000),
        values => `Kho có ${formatNumber(values.first)} món đồ chơi, sau đợt nhập hàng mới có thêm ${formatNumber(values.second)} món.`,
        'Kho có', 'món đồ chơi.'),
    makeWordContext('farm-eggs', 'Trang trại thu gom trứng', '+', random => addPair(random, 18000, 45000, 5000, 14000),
        values => `Trang trại thu gom ${formatNumber(values.first)} quả trứng từ đàn gà và ${formatNumber(values.second)} quả từ đàn vịt.`,
        'Trang trại thu gom', 'quả trứng.'),
    makeWordContext('library-loans', 'Thư viện cho mượn sách', '−', random => subtractPair(random, 45000, 75000, 8000, 20000),
        values => `Thư viện có ${formatNumber(values.first)} quyển sách, trong tuần đã cho học sinh mượn ${formatNumber(values.second)} quyển.`,
        'Thư viện còn', 'quyển sách.'),
    makeWordContext('warehouse-shipped', 'Kho hàng xuất kho', '−', random => subtractPair(random, 35000, 68000, 7000, 18000),
        values => `Kho hàng có ${formatNumber(values.first)} thùng sản phẩm, đã chuyển đi ${formatNumber(values.second)} thùng.`,
        'Kho còn', 'thùng sản phẩm.'),
    makeWordContext('factory-sold', 'Nhà máy bán sản phẩm', '−', random => subtractPair(random, 40000, 85000, 12000, 25000),
        values => `Nhà máy sản xuất ${formatNumber(values.first)} sản phẩm, đã bán ${formatNumber(values.second)} sản phẩm.`,
        'Nhà máy còn', 'sản phẩm.'),
    makeWordContext('rice-remaining', 'Kho gạo sau khi xuất hàng', '−', random => subtractPair(random, 50000, 90000, 15000, 35000),
        values => `Kho có ${formatNumber(values.first)} kg gạo, đã xuất đi ${formatNumber(values.second)} kg.`,
        'Kho còn', 'kg gạo.'),
    makeWordContext('orchard-picked', 'Vườn cây còn quả', '−', random => subtractPair(random, 28000, 62000, 6000, 18000),
        values => `Vườn có ${formatNumber(values.first)} quả xoài, gia đình đã hái ${formatNumber(values.second)} quả.`,
        'Vườn còn', 'quả xoài.'),
    makeWordContext('supermarket-sold', 'Siêu thị sau ngày bán hàng', '−', random => subtractPair(random, 42000, 78000, 9000, 22000),
        values => `Siêu thị có ${formatNumber(values.first)} sản phẩm, trong ngày đã bán ${formatNumber(values.second)} sản phẩm.`,
        'Siêu thị còn', 'sản phẩm.'),
    makeWordContext('stadium-tickets-left', 'Số vé còn lại ở sân vận động', '−', random => subtractPair(random, 35000, 80000, 12000, 28000),
        values => `Sân vận động có ${formatNumber(values.first)} chỗ ngồi, đã bán vé cho ${formatNumber(values.second)} chỗ.`,
        'Còn trống', 'chỗ ngồi.'),
    makeWordContext('water-used', 'Bồn chứa sau khi sử dụng', '−', random => subtractPair(random, 45000, 95000, 8000, 26000),
        values => `Bồn chứa có ${formatNumber(values.first)} lít nước, gia đình đã dùng ${formatNumber(values.second)} lít.`,
        'Bồn còn', 'lít nước.'),
    makeWordContext('school-fund-spent', 'Quỹ lớp sau khi mua đồ dùng', '−', random => subtractPair(random, 30000, 70000, 7000, 19000),
        values => `Quỹ lớp có ${formatNumber(values.first)} đồng, lớp đã chi ${formatNumber(values.second)} đồng để mua đồ dùng.`,
        'Quỹ lớp còn', 'đồng.'),
    makeWordContext('book-warehouse-distributed', 'Kho sách phân phối', '−', random => subtractPair(random, 50000, 100000, 20000, 40000),
        values => `Kho sách có ${formatNumber(values.first)} quyển, đã chuyển đến các trường ${formatNumber(values.second)} quyển.`,
        'Kho còn', 'quyển sách.'),
    makeWordContext('train-cargo-unloaded', 'Đoàn tàu dỡ hàng', '−', random => subtractPair(random, 35000, 75000, 5000, 18000),
        values => `Đoàn tàu chở ${formatNumber(values.first)} kg hàng, đã dỡ xuống ga ${formatNumber(values.second)} kg.`,
        'Đoàn tàu còn chở', 'kg hàng.'),
    makeWordContext('fish-market-sold', 'Cửa hàng cá bán hàng', '−', random => subtractPair(random, 40000, 88000, 9000, 30000),
        values => `Cửa hàng có ${formatNumber(values.first)} kg cá, đã bán ${formatNumber(values.second)} kg.`,
        'Cửa hàng còn', 'kg cá.'),
    makeWordContext('trees-remaining', 'Khu bảo tồn còn cây', '−', random => subtractPair(random, 30000, 65000, 8000, 21000),
        values => `Khu bảo tồn có ${formatNumber(values.first)} cây non, đã chuyển đến các trường ${formatNumber(values.second)} cây.`,
        'Khu bảo tồn còn', 'cây non.'),
    makeWordContext('factory-defects', 'Sản phẩm đạt chuẩn', '−', random => subtractPair(random, 45000, 90000, 2000, 9000),
        values => `Nhà máy làm ra ${formatNumber(values.first)} sản phẩm, trong đó có ${formatNumber(values.second)} sản phẩm chưa đạt chuẩn.`,
        'Nhà máy có', 'sản phẩm đạt chuẩn.'),
    makeWordContext('charity-money-given', 'Quỹ từ thiện sau hỗ trợ', '−', random => subtractPair(random, 50000, 95000, 15000, 35000),
        values => `Quỹ từ thiện có ${formatNumber(values.first)} đồng, đã hỗ trợ các gia đình khó khăn ${formatNumber(values.second)} đồng.`,
        'Quỹ còn', 'đồng.')
];

function makeSumDifferenceContext(id, title, createStatement, minimumValue, maximumValue) {
    return {
        id,
        title,
        create(random) {
            const values = sumDifferenceValues({ minimumValue, maximumValue }, random);
            return { contextId: id, values, statement: createStatement(values) };
        }
    };
}

const sumDifferenceContexts = [
    makeSumDifferenceContext('class-students', 'Hai lớp học',
        values => `Hai lớp 4A và 4B có tất cả ${formatNumber(values.sum)} học sinh. Lớp 4A nhiều hơn lớp 4B ${formatNumber(values.difference)} học sinh.`, 80, 999),
    makeSumDifferenceContext('library-shelves', 'Hai ngăn sách',
        values => `Hai ngăn sách có tất cả ${formatNumber(values.sum)} quyển sách. Ngăn thứ nhất nhiều hơn ngăn thứ hai ${formatNumber(values.difference)} quyển.`, 100, 1499),
    makeSumDifferenceContext('farms-rice', 'Hai thửa ruộng',
        values => `Hai thửa ruộng thu hoạch được tất cả ${formatNumber(values.sum)} kg lúa. Thửa thứ nhất thu hoạch nhiều hơn thửa thứ hai ${formatNumber(values.difference)} kg.`, 500, 4999),
    makeSumDifferenceContext('truck-loads', 'Hai xe chở hàng',
        values => `Hai xe chở tất cả ${formatNumber(values.sum)} kg hàng. Xe thứ nhất chở nhiều hơn xe thứ hai ${formatNumber(values.difference)} kg.`, 600, 5999),
    makeSumDifferenceContext('garden-plots', 'Hai khu vườn',
        values => `Hai khu vườn có tổng diện tích ${formatNumber(values.sum)} m². Khu vườn lớn hơn rộng hơn khu kia ${formatNumber(values.difference)} m².`, 100, 1999),
    makeSumDifferenceContext('school-funds', 'Hai quỹ lớp',
        values => `Hai quỹ lớp có tất cả ${formatNumber(values.sum)} đồng. Quỹ lớp 4A nhiều hơn quỹ lớp 4B ${formatNumber(values.difference)} đồng.`, 1000, 9999),
    makeSumDifferenceContext('shop-inventories', 'Hai cửa hàng',
        values => `Hai cửa hàng có tất cả ${formatNumber(values.sum)} sản phẩm. Cửa hàng thứ nhất có nhiều hơn cửa hàng thứ hai ${formatNumber(values.difference)} sản phẩm.`, 200, 3999),
    makeSumDifferenceContext('warehouse-boxes', 'Hai kho hàng',
        values => `Hai kho có tất cả ${formatNumber(values.sum)} thùng hàng. Kho A có nhiều hơn kho B ${formatNumber(values.difference)} thùng.`, 300, 4999),
    makeSumDifferenceContext('teams-score', 'Điểm của hai đội',
        values => `Hai đội ghi được tất cả ${formatNumber(values.sum)} điểm trong một cuộc thi. Đội X nhiều hơn đội Y ${formatNumber(values.difference)} điểm.`, 20, 499),
    makeSumDifferenceContext('village-trees', 'Cây xanh của hai thôn',
        values => `Hai thôn trồng được tất cả ${formatNumber(values.sum)} cây. Thôn Một trồng nhiều hơn thôn Hai ${formatNumber(values.difference)} cây.`, 200, 4999),
    makeSumDifferenceContext('orchards-fruit', 'Sản lượng hai vườn cây',
        values => `Hai vườn cây thu hoạch tất cả ${formatNumber(values.sum)} kg trái cây. Vườn thứ nhất thu hoạch nhiều hơn vườn thứ hai ${formatNumber(values.difference)} kg.`, 500, 6999),
    makeSumDifferenceContext('book-collections', 'Hai tủ sách',
        values => `Hai tủ sách có tất cả ${formatNumber(values.sum)} quyển. Tủ sách của lớp 4A nhiều hơn tủ của lớp 4B ${formatNumber(values.difference)} quyển.`, 120, 2499),
    makeSumDifferenceContext('water-tanks', 'Hai bồn nước',
        values => `Hai bồn chứa tất cả ${formatNumber(values.sum)} lít nước. Bồn lớn hơn chứa nhiều hơn bồn kia ${formatNumber(values.difference)} lít.`, 200, 4999),
    makeSumDifferenceContext('factory-lines', 'Hai dây chuyền sản xuất',
        values => `Hai dây chuyền làm được tất cả ${formatNumber(values.sum)} sản phẩm. Dây chuyền A làm nhiều hơn dây chuyền B ${formatNumber(values.difference)} sản phẩm.`, 500, 8999),
    makeSumDifferenceContext('bus-passengers', 'Hai tuyến xe buýt',
        values => `Hai tuyến xe buýt chở tất cả ${formatNumber(values.sum)} lượt hành khách. Tuyến thứ nhất chở nhiều hơn tuyến thứ hai ${formatNumber(values.difference)} lượt.`, 100, 1999),
    makeSumDifferenceContext('museum-days', 'Khách tham quan hai ngày',
        values => `Trong hai ngày, bảo tàng đón tất cả ${formatNumber(values.sum)} lượt khách. Ngày thứ nhất có nhiều hơn ngày thứ hai ${formatNumber(values.difference)} lượt khách.`, 300, 3999),
    makeSumDifferenceContext('class-notebooks', 'Vở của hai lớp',
        values => `Hai lớp nhận tất cả ${formatNumber(values.sum)} quyển vở. Lớp 4C nhận nhiều hơn lớp 4D ${formatNumber(values.difference)} quyển.`, 100, 2499),
    makeSumDifferenceContext('stadium-tickets', 'Vé ở hai cổng sân vận động',
        values => `Hai cổng sân vận động đã bán tất cả ${formatNumber(values.sum)} vé. Cổng phía Đông bán nhiều hơn cổng phía Tây ${formatNumber(values.difference)} vé.`, 300, 5999),
    makeSumDifferenceContext('farms-eggs', 'Trứng của hai trang trại',
        values => `Hai trang trại thu gom tất cả ${formatNumber(values.sum)} quả trứng. Trang trại A thu gom nhiều hơn trang trại B ${formatNumber(values.difference)} quả.`, 500, 6999),
    makeSumDifferenceContext('pools-water', 'Nước ở hai hồ bơi',
        values => `Hai hồ bơi có tất cả ${formatNumber(values.sum)} lít nước. Hồ lớn hơn có nhiều hơn hồ kia ${formatNumber(values.difference)} lít.`, 1000, 9999),
    makeSumDifferenceContext('shop-sales', 'Doanh thu hai cửa hàng',
        values => `Hai cửa hàng thu được tất cả ${formatNumber(values.sum)} đồng. Cửa hàng A thu nhiều hơn cửa hàng B ${formatNumber(values.difference)} đồng.`, 2000, 9999),
    makeSumDifferenceContext('clubs-cards', 'Thẻ của hai câu lạc bộ',
        values => `Hai câu lạc bộ có tất cả ${formatNumber(values.sum)} tấm thẻ. Câu lạc bộ M có nhiều hơn câu lạc bộ N ${formatNumber(values.difference)} tấm.`, 100, 1999),
    makeSumDifferenceContext('rooms-books', 'Sách ở hai phòng đọc',
        values => `Hai phòng đọc có tất cả ${formatNumber(values.sum)} quyển sách. Phòng lớn có nhiều hơn phòng nhỏ ${formatNumber(values.difference)} quyển.`, 200, 2999),
    makeSumDifferenceContext('ship-cargoes', 'Hàng của hai tàu',
        values => `Hai tàu chở tất cả ${formatNumber(values.sum)} kg hàng. Tàu lớn chở nhiều hơn tàu nhỏ ${formatNumber(values.difference)} kg.`, 1000, 9999),
    makeSumDifferenceContext('harvest-days', 'Lúa thu hoạch trong hai ngày',
        values => `Trong hai ngày, cánh đồng thu hoạch tất cả ${formatNumber(values.sum)} kg lúa. Ngày thứ nhất thu hoạch nhiều hơn ngày thứ hai ${formatNumber(values.difference)} kg.`, 500, 7999),
    makeSumDifferenceContext('rice-sacks', 'Hai kho thóc',
        values => `Hai kho thóc có tất cả ${formatNumber(values.sum)} kg thóc. Kho thứ nhất có nhiều hơn kho thứ hai ${formatNumber(values.difference)} kg.`, 1000, 9999),
    makeSumDifferenceContext('charity-funds', 'Hai nguồn quỹ từ thiện',
        values => `Hai nguồn quỹ từ thiện quyên góp được tất cả ${formatNumber(values.sum)} đồng. Nguồn thứ nhất nhiều hơn nguồn thứ hai ${formatNumber(values.difference)} đồng.`, 1000, 9999),
    makeSumDifferenceContext('community-trees', 'Cây xanh của hai tổ dân phố',
        values => `Hai tổ dân phố trồng được tất cả ${formatNumber(values.sum)} cây. Tổ Một trồng nhiều hơn tổ Hai ${formatNumber(values.difference)} cây.`, 300, 5999),
    makeSumDifferenceContext('library-branches', 'Sách của hai thư viện',
        values => `Hai thư viện có tất cả ${formatNumber(values.sum)} quyển sách. Thư viện trung tâm có nhiều hơn thư viện chi nhánh ${formatNumber(values.difference)} quyển.`, 500, 9999),
    makeSumDifferenceContext('market-stalls-fruit', 'Trái cây ở hai quầy hàng',
        values => `Hai quầy hàng có tất cả ${formatNumber(values.sum)} kg trái cây. Quầy A có nhiều hơn quầy B ${formatNumber(values.difference)} kg.`, 200, 4999)
];

function contextFrom(bank, contextId, random, allowedOperations = null) {
    const candidates = Array.isArray(allowedOperations) && allowedOperations.length
        ? bank.filter(item => allowedOperations.includes(item.operation))
        : bank;
    const context = contextId ? candidates.find(item => item.id === contextId) : choose(candidates, random);
    if (!context) throw new Error(`Không tìm thấy ngữ cảnh phù hợp: ${contextId || 'ngẫu nhiên'}`);
    return context;
}

function generateAddSubWordProblem(config = {}, random = Math.random) {
    const allowedOperations = Object.prototype.hasOwnProperty.call(config, 'operation') || Array.isArray(config.operations)
        ? configuredOperations(config)
        : null;
    const context = contextFrom(wordProblemContexts, config.contextId, random, allowedOperations);
    const row = context.create(random);
    const prompt = `${row.statement}<br>${row.answerPrefix} ___ ${row.answerSuffix}`;
    return question(
        'g4-m-add-sub-word-problem',
        'Điền khuyết',
        prompt,
        [row.answer],
        'Xác định đại lượng đã biết, chọn phép cộng hoặc phép trừ phù hợp rồi tính đáp số.',
        { templateVariables: { contextId: context.id, contextTitle: context.title, operation: context.operation, values: row.values } }
    );
}

function generateSumDifferenceContext(config = {}, random = Math.random) {
    const context = contextFrom(sumDifferenceContexts, config.contextId, random);
    const row = context.create(random);
    const prompt = `${row.statement}<br>a) Số bé là ___<br>b) Số lớn là ___`;
    return question(
        'g4-m-sum-difference-context',
        'Điền khuyết',
        prompt,
        [row.values.small, row.values.large],
        'Số bé = (Tổng − Hiệu) : 2; số lớn = (Tổng + Hiệu) : 2.',
        { values: row.values, partAnswerCounts: [1, 1], templateVariables: { contextId: context.id, contextTitle: context.title } }
    );
}

const contextBanks = Object.freeze({
    wordProblem: Object.freeze(wordProblemContexts),
    sumDifference: Object.freeze(sumDifferenceContexts)
});

const generators = {
    'g4-m-add-sub-multi-digit': generateAddSubMultiDigit,
    'g4-m-add-sub-word-problem': generateAddSubWordProblem,
    'g4-m-add-sub-missing-term': generateMissingTerm,
    'g4-m-add-sub-missing-digit': generateMissingDigit,
    'g4-m-addition-property-fill': generateAdditionPropertyFill,
    'g4-m-add-sub-expression': generateAddSubExpression,
    'g4-m-sum-difference-direct': generateSumDifferenceDirect,
    'g4-m-sum-difference-context': generateSumDifferenceContext,
    'g4-m-add-sub-true-false': generateAddSubTrueFalse
};

Object.defineProperty(generators, 'contextBanks', { value: contextBanks, enumerable: false });
return generators;
}));
