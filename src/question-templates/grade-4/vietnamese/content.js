;(function (root) {
    // Closed, source-backed items. Sampling changes order only, never wording.
    const records = [];
    const groups = {};
    function add(key, id, lesson, pages, excerpt, rule, prompt, answer, wrong, explanation, passage = '', kind = 'textbook-context') {
        const optionReasons = { [answer]: explanation };
        for (const [text, reason] of wrong) optionReasons[text] = reason;
        const entry = {
            id, introducedAt: lesson, prompt, answer, options: [answer, ...wrong.map(pair => pair[0])], explanation, passage,
            evidence: { source: 'sgk-tv4-kntt-t1', pages, kind, excerpt, rule, optionReasons }
        };
        records.push(entry);
        (groups[key] ||= []).push(entry);
    }
    const nounText = 'Ai cũng vội đến trường để gặp lại thầy giáo, cô giáo, bạn bè, gặp lại bàn, ghế thân quen. Hôm nay bắt đầu năm học mới.';
    const nounRule = 'SGK tr.9–10: danh từ chỉ người, vật, hiện tượng tự nhiên, thời gian.';
    add('word_type', 'noun-1', 1, [9, 10], nounText, nounRule,
        'Trong đoạn trích, từ ngữ nào chỉ người?', 'thầy giáo',
        [['bàn', 'Chỉ vật, không chỉ người.'], ['năm học', 'Chỉ thời gian, không chỉ người.']],
        '“Thầy giáo” chỉ người; “bàn” chỉ vật; “năm học” chỉ thời gian.', nounText);
    add('word_type', 'noun-2', 1, [9, 10], nounText, nounRule,
        'Trong đoạn trích, từ nào chỉ vật?', 'ghế',
        [['cô giáo', 'Chỉ người, không chỉ vật.'], ['hôm nay', 'Chỉ thời gian, không chỉ vật.']],
        '“Ghế” chỉ vật; “cô giáo” chỉ người; “hôm nay” chỉ thời gian.', nounText);
    const nounGroups = [
        ['học sinh', 'Chỉ người', 'Lá như cũng biết nô đùa, cứ quấn theo chân các bạn học sinh đang đi vội vã.'],
        ['bàn', 'Chỉ vật', nounText],
        ['gió', 'Chỉ hiện tượng tự nhiên', 'Gió thổi mát rượi, đuổi những chiếc lá rụng chạy lao xao.'],
        ['năm học', 'Chỉ thời gian', nounText]
    ];
    const groupNames = ['Chỉ người', 'Chỉ vật', 'Chỉ hiện tượng tự nhiên', 'Chỉ thời gian'];
    nounGroups.forEach(([word, group, excerpt], i) => add('word_groups', 'noun-group-' + (i + 1), 1, [9, 10], excerpt, nounRule,
        'Đưa từ ngữ “' + word + '” vào nhóm phù hợp.', group,
        groupNames.filter(x => x !== group).map(x => [x, 'Không phù hợp với nghĩa của “' + word + '” trong đoạn trích trang 9.']),
        'Trong ngữ cảnh SGK trang 9, “' + word + '” thuộc nhóm ' + group.toLocaleLowerCase('vi-VN') + '.'));
    const names = [
        ['Hà Nội', 'Hà nội', 'hà Nội'], ['Cần Thơ', 'Cần thơ', 'cần Thơ'],
        ['Chu Văn An', 'Chu văn An', 'chu Văn An'], ['Trần Thị Lý', 'Trần thị Lý', 'trần Thị Lý']
    ];
    names.forEach(([correct, ...wrong], i) => add('capitalization', 'capital-' + (i + 1), 3, [18],
        'Hà Nội; Chu Văn An; Trần Thị Lý; Bạch Đằng; Cửu Long; Cần Thơ.',
        'Danh từ riêng được viết hoa; mẫu tên riêng trong bài Danh từ chung, danh từ riêng.',
        'Chọn cách viết đúng tên riêng “' + correct.toLocaleLowerCase('vi-VN') + '”.', correct,
        wrong.map(x => [x, 'Viết thường sai một chữ cái đầu trong tên riêng; đối chiếu mẫu trang 18.']),
        'SGK trang 18 viết tên riêng này là “' + correct + '”.'));
    const verbPassage = 'Tôi nấp ngay cánh mẹ…';
    add('word_type_verb', 'verb-1', 9, [41], verbPassage, 'Động từ chỉ hoạt động, trạng thái của sự vật.',
        'Trong dòng thơ, từ nào là động từ?', 'nấp', [['cánh', 'Danh từ, không chỉ hoạt động.'], ['mẹ', 'Danh từ chỉ người.']],
        '“Nấp” chỉ hoạt động trong dòng thơ; “cánh” và “mẹ” là danh từ.', verbPassage);
    add('word_type_verb', 'verb-2', 9, [41], 'Uống nước nhớ nguồn.', 'Động từ chỉ hoạt động, trạng thái của sự vật.',
        'Trong “Uống nước nhớ nguồn.”, lựa chọn nào là động từ?', 'uống',
        [['nước', 'Danh từ trong câu này.'], ['nguồn', 'Danh từ trong câu này.']],
        'Trong ba lựa chọn, “uống” chỉ hoạt động; “nước” và “nguồn” là danh từ.');
    // The two parts must share a passage; embed each short excerpt in its prompt instead.
    groups.word_type_verb[0].prompt = 'Trong “Tôi nấp ngay cánh mẹ…”, từ nào là động từ?';
    groups.word_type_verb[0].passage = '';
    const adjectiveText = 'Nắng đậu xuống nhẹ, chậm rãi.';
    add('word_type_adjective', 'adjective-1', 21, [95], adjectiveText, 'Tính từ chỉ đặc điểm của sự vật, hoạt động, trạng thái.',
        'Trong “Nắng đậu xuống nhẹ, chậm rãi.”, lựa chọn nào là tính từ?', 'nhẹ',
        [['nắng', 'Danh từ chỉ hiện tượng tự nhiên.'], ['đậu', 'Động từ trong ngữ cảnh nhân hoá này.']],
        '“Nhẹ” chỉ đặc điểm của hoạt động “đậu xuống”.');
    add('word_type_adjective', 'adjective-2', 21, [95], adjectiveText, 'Tính từ chỉ đặc điểm của sự vật, hoạt động, trạng thái.',
        'Trong “Nắng đậu xuống nhẹ, chậm rãi.”, từ ngữ nào chỉ đặc điểm của hoạt động?', 'chậm rãi',
        [['nắng', 'Gọi tên hiện tượng, không chỉ đặc điểm hoạt động.'], ['đậu xuống', 'Nêu hoạt động, không nêu đặc điểm của hoạt động.']],
        '“Chậm rãi” chỉ đặc điểm của hoạt động “đậu xuống”.');
    const meanings = [
        ['tiết tấu', 'Nhịp điệu của âm nhạc', ['Màu sắc của bức tranh', 'Hình dáng của nhạc cụ'], 2, 13, 'Tiết tấu: nhịp điệu của âm nhạc.', 'âm nhạc'],
        ['vi-ô-lông', 'Một loại nhạc cụ', ['Một loài chim', 'Một kiểu trang phục'], 2, 13, 'Vi-ô-lông, cla-ri-nét, xen-lô: tên các nhạc cụ.', 'bài Thi nhạc'],
        ['cla-ri-nét', 'Một loại nhạc cụ', ['Một loài hoa', 'Một đồ dùng để viết'], 2, 13, 'Vi-ô-lông, cla-ri-nét, xen-lô: tên các nhạc cụ.', 'bài Thi nhạc'],
        ['gia tộc', 'Nhiều gia đình có cùng huyết thống', ['Những người cùng lớp học', 'Những người cùng đi tàu'], 12, 52, 'Gia tộc: tập hợp gồm nhiều gia đình có cùng huyết thống.', 'quan hệ gia đình'],
        ['thung', 'Vùng đất trũng, thấp giữa các sườn núi', ['Đỉnh núi cao nhất', 'Mặt nước ngoài biển'], 15, 64, 'Thung (thung lũng): dải đất trũng, thấp giữa các sườn (dãy) núi.', 'bài Gặt chữ trên non'],
        ['đế', 'Bộ phận gắn dưới để đỡ vật đứng vững', ['Phần tai của con thỏ', 'Màu sắc của tờ giấy'], 21, 94, 'Đế: bộ phận gắn liền với phần dưới của vật, giữ cho vật đứng vững.', 'làm thỏ con bằng giấy']
    ];
    meanings.forEach(([word, answer, wrong, lesson, page, excerpt, context], i) => add('word_meaning', 'meaning-' + (i + 1), lesson, [page], excerpt, 'Chú giải mục từ ' + word,
        'Trong ngữ cảnh ' + context + ', ghép “' + word + '” với nghĩa phù hợp.', answer,
        wrong.map(x => [x, 'Không diễn đạt nghĩa trong chú giải “' + word + '” ở trang ' + page + '.']),
        'Theo chú giải trang ' + page + ', “' + word + '” trong ngữ cảnh này là ' + answer.toLocaleLowerCase('vi-VN') + '.', '', 'textbook-glossary'));
    add('context_fill', 'fill-1', 1, [9], nounText, nounRule,
        'Chọn danh từ chỉ người điền vào chỗ trống: “Ai cũng vội đến trường để gặp lại ___.”', 'thầy giáo',
        [['bàn', 'Là danh từ chỉ vật; không đáp ứng yêu cầu chỉ người.'], ['ghế', 'Là danh từ chỉ vật; không đáp ứng yêu cầu chỉ người.']],
        '“Thầy giáo” là danh từ chỉ người và xuất hiện sau “gặp lại” trong đoạn nguồn.');
    add('context_fill', 'fill-2', 1, [9], nounText, nounRule,
        'Chọn danh từ chỉ thời gian điền vào chỗ trống: “Hôm nay bắt đầu ___ mới.”', 'năm học',
        [['bàn', 'Danh từ chỉ vật; không đáp ứng yêu cầu chỉ thời gian.'], ['cô giáo', 'Danh từ chỉ người; không đáp ứng yêu cầu chỉ thời gian.']],
        '“Năm học” chỉ thời gian; câu hoàn chỉnh có trong SGK trang 9.');
    const personText = 'Những anh chuồn ớt đỏ thắm như ngọn lửa.';
    add('personification', 'personification-1', 17, [78, 79], personText, 'Dùng từ ngữ gọi người để gọi sự vật là nhân hoá.',
        'Trong “Những anh chuồn ớt đỏ thắm như ngọn lửa.”, từ “anh” góp phần nhân hoá con vật.', 'Đúng',
        [['Sai', '“Anh” vốn dùng để gọi người, ở đây dùng gọi chuồn ớt.']],
        'Từ “anh” dùng gọi người được dùng để gọi chuồn ớt.');
    add('personification', 'personification-2', 17, [79], 'Cây dừa / Sải tay / Bơi', 'Dùng hoạt động của người để tả cây cối là nhân hoá.',
        'Trong “Cây dừa / Sải tay / Bơi”, cây dừa không được nhân hoá.', 'Sai',
        [['Đúng', 'Trái với chi tiết “sải tay”, “bơi” được dùng để tả cây dừa.']],
        'Cây dừa được nhân hoá qua các hoạt động “sải tay”, “bơi”.');
    const dashUses = ['Đánh dấu lời nói trực tiếp', 'Đánh dấu các ý liệt kê', 'Nối các từ ngữ trong một liên danh'];
    [
        ['Đốm hỏi:\n– Sao lại gọi là hoa chiều tàn?', 0],
        ['Dưới đây là một số loài được cho là lớn nhất trong thế giới động vật:\n– Cá voi xanh\n– Voi châu Phi\n– Hươu cao cổ\n– Lạc đà một bướu.', 1],
        ['Năm 1976, thành phố Sài Gòn – Gia Định được đổi tên là Thành phố Hồ Chí Minh.', 2]
    ].forEach(([excerpt, use], i) => add('dash_usage', 'dash-' + (i + 1), 27, [119], excerpt, 'Ba công dụng dấu gạch ngang, bài tập 1 trang 119.',
        'Dấu gạch ngang trong đoạn sau có công dụng gì?\n' + excerpt, dashUses[use],
        dashUses.filter((_, j) => j !== use).map(x => [x, 'Không khớp cấu trúc ' + ['lời nhân vật sau “Đốm hỏi”', 'danh sách các loài vật', 'tên liên danh Sài Gòn – Gia Định'][use] + '.']),
        'Dấu gạch ngang dùng để ' + dashUses[use].toLocaleLowerCase('vi-VN') + '.'));
    const reading = nounText;
    add('reading_detail', 'reading-1', 1, [9], reading, 'Tìm thông tin được nêu trực tiếp trong đoạn.',
        'Mọi người vội đến đâu?', 'Trường',
        [['Bàn', 'Đoạn nói gặp lại bàn; không nói đến bàn như địa điểm.'], ['Ghế', 'Đoạn nói gặp lại ghế; không nói đến ghế như địa điểm.']],
        'Đoạn trích viết “Ai cũng vội đến trường”.', reading);
    add('reading_detail', 'reading-2', 1, [9], reading, 'Tìm thông tin được nêu trực tiếp trong đoạn.',
        'Năm học mới bắt đầu khi nào?', 'Hôm nay',
        [['Hôm qua', 'Không khớp mốc “Hôm nay” trong đoạn.'], ['Ngày mai', 'Không khớp mốc “Hôm nay” trong đoạn.']],
        'Câu cuối nêu “Hôm nay bắt đầu năm học mới”.', reading);
    const music = 'Thầy vàng anh đứng dậy, vẻ nghiêm trang. Các học trò im lặng, hồi hộp.';
    add('character_detail', 'character-1', 2, [13], music, 'Ghép nhân vật với chi tiết hiển ngôn trong bài Thi nhạc.',
        'Ghép thầy vàng anh với chi tiết trong đoạn.', 'Đứng dậy, vẻ nghiêm trang',
        [['Im lặng, hồi hộp', 'Chi tiết của các học trò, không phải thầy vàng anh.']],
        'Câu đầu nêu thầy vàng anh “đứng dậy, vẻ nghiêm trang”.', music);
    add('character_detail', 'character-2', 2, [13], music, 'Ghép nhân vật với chi tiết hiển ngôn trong bài Thi nhạc.',
        'Ghép các học trò với chi tiết trong đoạn.', 'Im lặng, hồi hộp',
        [['Đứng dậy, vẻ nghiêm trang', 'Chi tiết của thầy vàng anh, không phải các học trò.']],
        'Câu sau nêu các học trò “im lặng, hồi hộp”.', music);
    const topic = 'Mọi người bắt tay vào việc chuẩn bị cho cuộc khiêu vũ. Người thì xén bớt cỏ để làm sân nhảy, người thì kê ghế dài xung quanh bãi cỏ đã xén gọn. Bên này, hai bạn nhanh nhẹn nhất đang dựng một cái sân khấu để biểu diễn nhạc. Bên kia, mười tay đàn xuất sắc đã lập thành một dàn nhạc và chơi thử ngay tại chỗ.';
    add('topic_sentence', 'topic-1', 1, [10, 11], topic, 'Câu chủ đề nêu ý chính của đoạn.',
        'Câu nào là câu chủ đề của đoạn?', 'Mọi người bắt tay vào việc chuẩn bị cho cuộc khiêu vũ.',
        [['Bên này, hai bạn nhanh nhẹn nhất đang dựng một cái sân khấu để biểu diễn nhạc.', 'Chỉ nói một việc cụ thể; không bao quát cả đoạn.']],
        'Câu đầu bao quát việc chuẩn bị; các câu sau kể những việc cụ thể.', topic);
    add('topic_sentence', 'topic-2', 1, [10, 11], topic, 'Câu chủ đề thường nằm ở đầu hoặc cuối đoạn; phải xét nội dung.',
        'Ý nào nêu nội dung chính của đoạn?', 'Mọi người chuẩn bị cho cuộc khiêu vũ',
        [['Hai bạn dựng sân khấu', 'Chỉ là một chi tiết; chưa bao quát xén cỏ, kê ghế và lập dàn nhạc.']],
        'Cả đoạn nói về những việc mọi người làm để chuẩn bị cho cuộc khiêu vũ.', topic);
    function getItems(key, n) {
        const selected = key === 'word_type' ? (n >= 21 ? 'word_type_adjective' : n >= 9 ? 'word_type_verb' : key) : key;
        const items = (groups[selected] || []).filter(entry => entry.introducedAt <= n);
        return { items, passage: items[0]?.passage || '' };
    }
    root.VietnamesePracticeContent = Object.freeze({ getItems, allItems: () => [...records] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
