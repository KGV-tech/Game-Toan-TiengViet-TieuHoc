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
    // Expansion e60: six new records per skill, reviewed against the cited pages.
    const nounMusic = 'Dế bước ra khoẻ khoắn và trang nhã trong chiếc áo nâu óng.';
    add('word_type', 'e60-word_type-1', 2, [13], nounMusic, nounRule,
        'Trong “Dế bước ra khoẻ khoắn và trang nhã trong chiếc áo nâu óng.”, từ nào là danh từ?', 'áo',
        [['bước', 'Nêu hoạt động của dế, không gọi tên vật.'], ['khoẻ khoắn', 'Nêu đặc điểm của dế, không gọi tên vật.']],
        '“Áo” gọi tên một vật trong câu, nên là danh từ.');
    const nounMusic2 = 'Trong tà áo dài thướt tha, hoạ mi trông thật dịu dàng, uyển chuyển.';
    add('word_type', 'e60-word_type-2', 2, [13], nounMusic2, nounRule,
        'Trong “Trong tà áo dài thướt tha, hoạ mi trông thật dịu dàng, uyển chuyển.”, từ ngữ nào là danh từ chỉ con vật?', 'hoạ mi',
        [['dịu dàng', 'Chỉ đặc điểm của hoạ mi, không gọi tên con vật.'], ['uyển chuyển', 'Chỉ đặc điểm, không gọi tên con vật.']],
        '“Hoạ mi” gọi tên con vật; hai phương án còn lại chỉ đặc điểm.');
    const verbGarden = 'Thấy khóm hoa hồng bạch có vẻ chật chỗ, cô bé liền bứng một cây nhỏ nhất trồng vào chỗ đất trống dưới cửa sổ.';
    add('word_type_verb', 'e60-word_type-3', 10, [41, 44, 45], verbGarden, 'Động từ chỉ hoạt động, trạng thái; xét trong câu nguồn.',
        'Trong “cô bé liền bứng một cây nhỏ nhất”, lựa chọn nào là động từ?', 'bứng',
        [['cô bé', 'Gọi tên người thực hiện hoạt động.'], ['cây', 'Gọi tên sự vật chịu tác động.']],
        '“Bứng” chỉ hoạt động chuyển cây cùng bầu đất, theo ngữ cảnh và chú giải trang 45.');
    add('word_type_verb', 'e60-word_type-4', 10, [41, 44, 45], verbGarden, 'Động từ chỉ hoạt động, trạng thái; xét trong câu nguồn.',
        'Trong “trồng vào chỗ đất trống dưới cửa sổ”, lựa chọn nào là động từ?', 'trồng',
        [['đất', 'Danh từ gọi tên vật chất trong chỗ trồng cây.'], ['cửa sổ', 'Danh từ gọi tên một bộ phận của nhà.']],
        '“Trồng” chỉ hoạt động đặt cây vào đất để cây sinh trưởng.');
    const adjectiveGarden = 'Ánh nắng lướt đi rất nhanh, đổi màu thoăn thoắt: vàng ruộm trên cánh đồng, thơm nồng mùa gặt, nâu sẫm trên luống đất vừa gieo hạt, đỏ rực trên mái ngói, xanh mướt trên những vườn cây um tùm,…';
    add('word_type_adjective', 'e60-word_type-5', 21, [95], adjectiveGarden, 'Tính từ chỉ đặc điểm của sự vật, hoạt động, trạng thái.',
        'Trong “vàng ruộm trên cánh đồng”, từ ngữ nào chỉ màu sắc?', 'vàng ruộm',
        [['cánh đồng', 'Gọi tên sự vật, không nêu màu sắc.'], ['trên', 'Nêu quan hệ vị trí, không nêu màu sắc.']],
        '“Vàng ruộm” chỉ đặc điểm màu sắc, nên là tính từ trong ngữ cảnh này.');
    add('word_type_adjective', 'e60-word_type-6', 21, [95], adjectiveGarden, 'Tính từ chỉ đặc điểm của sự vật, hoạt động, trạng thái.',
        'Trong “nâu sẫm trên luống đất vừa gieo hạt”, từ ngữ nào là tính từ?', 'nâu sẫm',
        [['gieo', 'Nêu hoạt động gieo hạt, không nêu đặc điểm.'], ['hạt', 'Gọi tên sự vật, không nêu đặc điểm.']],
        '“Nâu sẫm” nêu đặc điểm màu sắc trong đoạn nguồn trang 95.');

    const properGroups = ['Tên người', 'Tên sông', 'Tên thành phố'];
    [['Hà Nội', 2], ['Chu Văn An', 0], ['Trần Thị Lý', 0], ['Bạch Đằng', 1], ['Cửu Long', 1], ['Cần Thơ', 2]].forEach(([word, group], i) =>
        add('word_groups', 'e60-word_groups-' + (i + 1), 3, [18],
            'Bài tập 1: Hà Nội; Chu Văn An; Trần Thị Lý; Bạch Đằng; Cửu Long; Cần Thơ. Các nhóm: người; sông; thành phố.',
            'Phân nhóm danh từ riêng theo bài tập 1 trang 18.', 'Trong bài tập trang 18, đưa “' + word + '” vào nhóm phù hợp.', properGroups[group],
            properGroups.filter((_, j) => j !== group).map(text => [text, 'Không đúng loại tên riêng của “' + word + '” trong bài tập trang 18.']),
            'Trong bài tập này, “' + word + '” thuộc nhóm ' + properGroups[group].toLocaleLowerCase('vi-VN') + '.'));
    const extraNames = [
        ['Bạch Đằng', ['Bạch đằng', 'bạch Đằng'], 3, 18, 'Hà Nội; Chu Văn An; Trần Thị Lý; Bạch Đằng; Cửu Long; Cần Thơ.'],
        ['Cửu Long', ['Cửu long', 'cửu Long'], 3, 18, 'Hà Nội; Chu Văn An; Trần Thị Lý; Bạch Đằng; Cửu Long; Cần Thơ.'],
        ['Việt Nam', ['Việt nam', 'việt Nam'], 3, 18, 'Kim Đồng là người anh hùng nhỏ tuổi của Việt Nam.'],
        ['Cao Bằng', ['Cao bằng', 'cao Bằng'], 3, 18, 'Anh tên thật là Nông Văn Dền (có nơi viết là Nông Văn Dèn), quê ở thôn Nà Mạ, xã Trường Hà, tỉnh Cao Bằng.'],
        ['Đài Truyền hình Việt Nam', ['Đài truyền hình Việt Nam', 'Đài Truyền hình Việt nam'], 7, 32, 'Đài Truyền hình Việt Nam; Bộ Văn hoá, Thể thao và Du lịch; Sở Nông nghiệp và Môi trường; Trường Tiểu học Ba Đình.'],
        ['Trường Tiểu học Quang Trung', ['Trường tiểu học Quang Trung', 'Trường Tiểu học Quang trung'], 7, 32, 'Trường Tiểu học Quang Trung; Nhà máy Thuỷ điện Hoà Bình.']
    ];
    extraNames.forEach(([correct, wrong, lesson, page, excerpt], i) => add('capitalization', 'e60-capitalization-' + (i + 1), lesson, [page], excerpt,
        lesson === 7 ? 'Viết hoa chữ cái đầu từng bộ phận tạo thành tên cơ quan, tổ chức.' : 'Viết hoa danh từ riêng theo mẫu trong SGK.',
        'Chọn cách viết đúng tên riêng “' + correct.toLocaleLowerCase('vi-VN') + '”.', correct,
        wrong.map(text => [text, 'Viết thường sai chữ cái đầu; không khớp mẫu tên riêng ở trang ' + page + '.']),
        'Mẫu viết trong SGK trang ' + page + ' là “' + correct + '”.'));

    const extraMeanings = [
        ['xen-lô', 'Một loại nhạc cụ', ['Một loài côn trùng', 'Một loại áo'], 2, 13, 'Vi-ô-lông, cla-ri-nét, xen-lô: tên các nhạc cụ.', 'bài Thi nhạc'],
        ['đăm chiêu', 'Có vẻ đang phải băn khoăn, suy nghĩ', ['Cười vui thành tiếng', 'Chạy nhảy liên tục'], 8, 35, 'Đăm chiêu: có vẻ đang phải băn khoăn, suy nghĩ.', 'bài Đò ngang'],
        ['bứng', 'Đào cây cùng bầu đất quanh rễ để chuyển đi trồng ở nơi khác', ['Chỉ hái hoa trên cành', 'Chỉ tưới nước vào gốc cây'], 10, 45, 'Bứng (cây): đào cây cùng bầu đất xung quanh rễ để chuyển đi trồng ở nơi khác.', 'chuyển cây trong bài Tiếng nói của cỏ cây'],
        ['mơ hồ', 'Không rõ ràng, không xác thực', ['Rõ ràng và chắc chắn', 'Ồn ào và náo nhiệt'], 10, 45, 'Mơ hồ: không rõ ràng, không xác thực.', 'bài Tiếng nói của cỏ cây'],
        ['xào xạc', 'Từ mô phỏng tiếng lá cây lay động, va chạm nhẹ vào nhau', ['Tiếng sấm nổ vang', 'Ánh sáng của mặt trời'], 11, 49, 'Xào xạc: từ mô phỏng tiếng như tiếng lá cây lay động, va chạm nhẹ vào nhau.', 'bài Tập làm văn'],
        ['lả chả', 'Nhỏ xuống thành giọt, nối tiếp nhau không dứt', ['Bay lên thành từng đám', 'Đọng yên thành một vũng'], 11, 49, 'Ý văn cũng như sương lả chả: / Lả chả (nước mắt, mồ hôi): nhỏ xuống thành giọt, nối tiếp nhau không dứt.', 'cách ví ý văn với sương trong bài Tập làm văn']
    ];
    extraMeanings.forEach(([word, answer, wrong, lesson, page, excerpt, context], i) => add('word_meaning', 'e60-word_meaning-' + (i + 1), lesson, word === 'lả chả' ? [48, page] : [page], excerpt,
        'Chú giải mục từ ' + word, 'Trong ngữ cảnh ' + context + ', ghép “' + word + '” với nghĩa phù hợp.', answer,
        wrong.map(text => [text, 'Không diễn đạt nghĩa của “' + word + '” trong chú giải SGK trang ' + page + '.']),
        'Theo chú giải trang ' + page + ', nghĩa phù hợp là: ' + answer + '.', '', 'textbook-glossary'));

    const princess = 'Sau bữa ăn trưa, cô giáo thông báo Giét-xi được chọn đóng vai công chúa trong vở kịch sắp tới. Cảm nhận được ánh mắt ngưỡng mộ của bạn bè, Giét-xi vui lắm.';
    const garden = 'Những ngày hè ở nhà ông bà, Ta-nhi-a được thoả thích chạy nhảy trong vườn. Thấy khóm hoa hồng bạch có vẻ chật chỗ, cô bé liền bứng một cây nhỏ nhất trồng vào chỗ đất trống dưới cửa sổ. Ngắm nghía một hồi, cảm thấy chưa hài lòng, cô đến bên khóm huệ, chọn một cây đem trồng cạnh cây hoa hồng.';
    const rabbit = 'Sắp đến sinh nhật Hoa, Hà quyết định làm tặng bạn một con thỏ bằng giấy. Hà đã chuẩn bị dụng cụ, vật liệu và làm theo cách sau:';
    const extraFills = [
        [4, 20, princess, 'Theo đoạn đọc, điền vai diễn vào câu: “Giét-xi được chọn đóng vai ___.”', 'công chúa', [['thầy giáo', 'Không phải vai được cô giáo thông báo trong đoạn.'], ['nhạc sĩ', 'Không phải vai được cô giáo thông báo trong đoạn.']], 'Đoạn đầu nêu Giét-xi được chọn đóng vai công chúa.'],
        [4, 20, princess, 'Theo đoạn đọc, điền cảm xúc vào câu: “Giét-xi ___.”', 'vui lắm', [['buồn lắm', 'Không khớp cảm xúc khi được chọn vai công chúa.'], ['lo lắng', 'Đoạn hiển thị nêu vui, không nêu lo lắng.']], 'Câu thứ hai nêu trực tiếp “Giét-xi vui lắm”.'],
        [10, 44, garden, 'Theo đoạn đọc, điền tên cây: “Ta-nhi-a trồng một cây ___ dưới cửa sổ.”', 'hoa hồng bạch', [['huệ', 'Cây huệ được trồng cạnh cây hoa hồng sau đó.'], ['me', 'Không có cây me trong đoạn hiển thị.']], 'Cô bé bứng một cây trong khóm hoa hồng bạch để trồng dưới cửa sổ.'],
        [10, 44, garden, 'Theo đoạn đọc, điền tên cây: “Ta-nhi-a đem một cây ___ trồng cạnh cây hoa hồng.”', 'huệ', [['mít', 'Không có cây mít trong đoạn hiển thị.'], ['me', 'Không có cây me trong đoạn hiển thị.']], 'Câu cuối nêu cô bé chọn một cây từ khóm huệ.'],
        [21, 93, rabbit, 'Theo đoạn đọc, điền vật liệu: “Hà làm một con thỏ bằng ___.”', 'giấy', [['gỗ', 'Không khớp vật liệu được nêu trong câu đầu.'], ['đất', 'Không khớp vật liệu được nêu trong câu đầu.']], 'Câu đầu nêu rõ con thỏ bằng giấy.'],
        [21, 93, rabbit, 'Theo đoạn đọc, điền tên người: “Sắp đến sinh nhật ___.”', 'Hoa', [['Hà', 'Hà là người làm quà, không phải người sắp đến sinh nhật.'], ['Ta-nhi-a', 'Tên này không xuất hiện trong đoạn hiển thị.']], 'Câu đầu viết “Sắp đến sinh nhật Hoa”.']
    ];
    extraFills.forEach(([lesson, page, passage, prompt, answer, wrong, explanation], i) => add('context_fill', 'e60-context_fill-' + (i + 1), lesson, [page], passage,
        'Điền đúng chi tiết được nêu trực tiếp trong đoạn hiển thị; chỉ chọn trong các phương án.', prompt, answer, wrong, explanation, passage));

    const extraPersonification = [
        [17, 79, 'Mầm cây tỉnh giấc, vườn đầy tiếng chim', 'Trong “Mầm cây tỉnh giấc”, hoạt động “tỉnh giấc” góp phần nhân hoá mầm cây.', 'Đúng', '“Tỉnh giấc” là hoạt động vốn dùng tả người, ở đây dùng tả mầm cây.'],
        [17, 79, 'Hạt mưa mải miết trốn tìm', 'Trong “Hạt mưa mải miết trốn tìm”, hạt mưa chưa được nhân hoá.', 'Sai', '“Trốn tìm” là hoạt động chơi của người, được dùng tả hạt mưa.'],
        [17, 79, 'Cây đào trước cửa lim dim mắt cười', 'Trong “Cây đào trước cửa lim dim mắt cười”, “lim dim mắt cười” góp phần nhân hoá cây đào.', 'Đúng', 'Hoạt động và bộ phận của người được dùng để tả cây đào.'],
        [19, 87, 'Hạt níu hạt trĩu bông / Đung đưa nhờ chị gió / Mách tin mùa chín rộ / Đến từng ngõ, từng nhà.', 'Trong “Đung đưa nhờ chị gió”, từ “chị” được dùng để gọi hạt lúa.', 'Sai', '“Chị” dùng để gọi gió, không phải hạt lúa.'],
        [19, 87, '– Chào cây! – Cậu bé nói. / Nhưng cây chỉ im lặng nhìn em, hai lá của nó vẫy vẫy. / – Tên cậu là gì? – Cậu bé lại hỏi.', 'Cậu bé chào cây và hỏi “Tên cậu là gì?” là trò chuyện với cây như với người.', 'Đúng', 'Cậu bé chào và xưng hô với cây bằng “cậu”, một cách nhân hoá.'],
        [19, 87, 'Những thím chích choè nhanh nhảu.', 'Trong “Những thím chích choè nhanh nhảu.”, từ “thím” không góp phần nhân hoá chim.', 'Sai', '“Thím” vốn dùng gọi người, ở đây dùng gọi chim chích choè.']
    ];
    extraPersonification.forEach(([lesson, page, excerpt, prompt, answer, explanation], i) => add('personification', 'e60-personification-' + (i + 1), lesson, [78, 79, page], excerpt,
        'Gọi, tả hoặc trò chuyện với sự vật bằng từ ngữ vốn dùng cho người là nhân hoá.', prompt, answer,
        [[answer === 'Đúng' ? 'Sai' : 'Đúng', 'Trái với dấu hiệu được chỉ rõ trong đoạn nguồn: ' + explanation]], explanation));

    const extraDashes = [
        [27, 120, 'Để trồng cây trong chậu, em hãy làm theo các bước sau:\n– Chuẩn bị đất, cho một phần đất vào chậu\n– Dùng xẻng nhỏ xới đất cho đất tơi xốp', 1, 'Các dòng nêu từng bước trong danh sách hướng dẫn trồng cây.'],
        [27, 120, 'Chương trình học bổng Vì mái trường xanh đã đến với các em học sinh khắp ba miền Bắc – Trung – Nam.', 2, 'Các dấu gạch ngang nối Bắc, Trung, Nam trong một liên danh.'],
        [29, 127, 'Bà đã giành được nhiều danh hiệu và giải thưởng:\n– Giải thưởng Nô-ben Vật lí, Giải thưởng Nô-ben Hoá học\n– Tiến sĩ khoa học Vật lí xuất sắc', 1, 'Các dòng nêu những danh hiệu, giải thưởng trong danh sách.'],
        [29, 127, 'Hội hữu nghị và hợp tác Việt – Pháp được thành lập ngày 02 tháng 7 năm 1955.', 2, 'Dấu gạch ngang nối Việt và Pháp trong tên liên danh.'],
        [27, 35, 'Đò ngang reo to:\n– Chào anh thuyền mành! Đã lâu anh mới ghé lại!', 0, 'Dòng sau lời dẫn “Đò ngang reo to” là lời nói của đò ngang.'],
        [27, 20, 'Thấy Giét-xi buồn, mẹ thủ thỉ:\n– Hôm nay, mẹ con mình cùng nhau nhổ cỏ vườn nhé.', 0, 'Dòng sau lời dẫn “mẹ thủ thỉ” là lời mẹ nói.']
    ];
    extraDashes.forEach(([lesson, page, excerpt, use, explanation], i) => add('dash_usage', 'e60-dash_usage-' + (i + 1), lesson, [119, page], excerpt,
        'Phân biệt lời nói trực tiếp, liệt kê và liên danh theo bài Dấu gạch ngang.', 'Dấu gạch ngang trong đoạn sau có công dụng gì?\n' + excerpt, dashUses[use],
        dashUses.filter((_, j) => j !== use).map(text => [text, 'Không khớp cấu trúc của đoạn: ' + explanation]), explanation));

    const extraReading = [
        [4, 20, princess, 'Giét-xi được chọn đóng vai gì?', 'Công chúa', [['Người dẫn chuyện', 'Chưa phải vai được thông báo trong đoạn hiển thị.'], ['Nhạc sĩ', 'Không có vai nhạc sĩ trong đoạn hiển thị.']], 'Câu đầu nêu rõ vai công chúa.'],
        [4, 20, princess, 'Khi cảm nhận ánh mắt ngưỡng mộ của bạn bè, Giét-xi có cảm xúc gì?', 'Vui lắm', [['Buồn lắm', 'Không khớp “Giét-xi vui lắm” trong đoạn.'], ['Sợ hãi', 'Đoạn hiển thị không nêu sợ hãi.']], 'Câu thứ hai nêu trực tiếp “Giét-xi vui lắm”.'],
        [10, 44, garden, 'Ta-nhi-a trồng cây hoa hồng bạch ở đâu?', 'Dưới cửa sổ', [['Ngoài cánh đồng', 'Không phải chỗ đất được nêu trong đoạn.'], ['Trên mái nhà', 'Không phải chỗ đất được nêu trong đoạn.']], 'Đoạn nêu “trồng vào chỗ đất trống dưới cửa sổ”.'],
        [10, 44, garden, 'Ta-nhi-a chọn cây nào trồng cạnh cây hoa hồng?', 'Một cây huệ', [['Một cây me', 'Không có việc chọn cây me trong đoạn.'], ['Một cây mít', 'Không có việc chọn cây mít trong đoạn.']], 'Cô bé đến bên khóm huệ, chọn một cây đem trồng cạnh cây hoa hồng.'],
        [21, 93, rabbit, 'Ai quyết định làm con thỏ bằng giấy?', 'Hà', [['Hoa', 'Hoa là người nhận quà, không phải người quyết định làm quà.'], ['Ta-nhi-a', 'Không có tên Ta-nhi-a trong đoạn.']], 'Câu đầu nêu Hà quyết định làm con thỏ bằng giấy.'],
        [21, 93, rabbit, 'Hà làm con thỏ để tặng ai?', 'Hoa', [['Giét-xi', 'Không có tên Giét-xi trong đoạn.'], ['Ta-nhi-a', 'Không có tên Ta-nhi-a trong đoạn.']], 'Sắp đến sinh nhật Hoa nên Hà quyết định làm quà tặng bạn.']
    ];
    extraReading.forEach(([lesson, page, passage, prompt, answer, wrong, explanation], i) => add('reading_detail', 'e60-reading_detail-' + (i + 1), lesson, [page], passage,
        'Tìm thông tin nêu trực tiếp trong đoạn hiển thị.', prompt, answer, wrong, explanation, passage));

    const cicada = 'Ve sầu được thầy mời trình bày tác phẩm trước tiên. Mặc áo măng tô trong suốt, đôi mắt nâu lấp lánh, đầy vẻ tự tin, ve sầu biểu diễn bản nhạc “Mùa hè”.';
    const rooster = 'Sau ve sầu, gà trống đĩnh đạc bước lên, kiêu hãnh ngẩng đầu với cái mũ đỏ chói. Gà mở đầu khúc nhạc “Bình minh” bằng tiết tấu nhanh, khoẻ, đầy hứng khởi:';
    const cricket = 'Đến lượt dế mèn. Dế bước ra khoẻ khoắn và trang nhã trong chiếc áo nâu óng. Bản nhạc “Mùa thu” gợi hình ảnh những chiếc lá khô xoay tròn, rơi trong nắng.';
    const extraCharacters = [
        [cicada, 'Ghép ve sầu với bản nhạc được biểu diễn.', 'Mùa hè', [['Mùa thu', 'Không phải bản nhạc của ve sầu trong đoạn.'], ['Bình minh', 'Không phải bản nhạc của ve sầu trong đoạn.']], 'Đoạn nêu ve sầu biểu diễn bản nhạc “Mùa hè”.'],
        [cicada, 'Ghép ve sầu với trang phục được nêu trong đoạn.', 'Áo măng tô trong suốt', [['Áo nâu óng', 'Không phải trang phục của ve sầu trong đoạn.'], ['Tà áo dài thướt tha', 'Không phải trang phục của ve sầu trong đoạn.']], 'Đoạn nêu ve sầu mặc áo măng tô trong suốt.'],
        [rooster, 'Ghép gà trống với khúc nhạc được mở đầu.', 'Bình minh', [['Mùa hè', 'Không phải khúc nhạc của gà trống trong đoạn.'], ['Mùa thu', 'Không phải khúc nhạc của gà trống trong đoạn.']], 'Đoạn nêu gà mở đầu khúc nhạc “Bình minh”.'],
        [rooster, 'Ghép gà trống với tư thế được nêu trong đoạn.', 'Kiêu hãnh ngẩng đầu', [['Im lặng cúi đầu', 'Trái với tư thế ngẩng đầu trong đoạn.'], ['Nằm ngủ dưới gốc cây', 'Không có chi tiết này trong đoạn.']], 'Câu đầu nêu gà trống kiêu hãnh ngẩng đầu.'],
        [cricket, 'Ghép dế mèn với bản nhạc được nêu trong đoạn.', 'Mùa thu', [['Mùa hè', 'Không phải bản nhạc ở đoạn về dế mèn.'], ['Bình minh', 'Không phải bản nhạc ở đoạn về dế mèn.']], 'Đoạn về dế mèn nêu bản nhạc “Mùa thu”.'],
        [cricket, 'Ghép dế mèn với trang phục được nêu trong đoạn.', 'Chiếc áo nâu óng', [['Áo măng tô trong suốt', 'Không phải trang phục của dế mèn trong đoạn.'], ['Tà áo dài thướt tha', 'Không phải trang phục của dế mèn trong đoạn.']], 'Câu thứ hai nêu dế mèn trong chiếc áo nâu óng.']
    ];
    extraCharacters.forEach(([passage, prompt, answer, wrong, explanation], i) => add('character_detail', 'e60-character_detail-' + (i + 1), 2, [12], passage,
        'Ghép nhân vật với chi tiết nêu trực tiếp trong bài Thi nhạc.', prompt, answer, wrong, explanation, passage));

    const pests = 'Những bác ong vàng cần cù tìm bắt từng con sâu trong ngách lá. Kia nữa là họ hàng nhà ruồi trâu có đuôi dài như đuôi chuồn chuồn, đó chính là những “hiệp sĩ” diệt sâu róm. Lại còn những cô cậu chim sâu ít nói, chăm chỉ. Những bác cóc già lặng lẽ, siêng năng. Tất cả đều lo diệt trừ sâu bọ để giữ gìn hoa lá.';
    const sea = 'Biển động. Gió thét trên những rừng dương. Sóng đập dữ dội vào mạn thuyền. Cây cột buồm rít lên, lá cờ đuôi nheo bay phần phật. Mưa cắt ngang mặt những tia nước lạnh. Bãi cát vật vã với nước, với sóng.';
    const dragonflies = 'Chuồn chuồn ngô mặc áo kẻ ca-rô đen vàng thích phơi mình ngoài nắng, trên ngọn chuối hoặc bên bờ ao. Chuồn chuồn ớt với bộ cánh đỏ rực hoặc vàng tươi, suốt ngày la cà hết chỗ này sang chỗ khác. Chuồn chuồn nước thích soi gương, ưa đứng im trên cọng khoai ngứa bên bờ ao ngắm bóng mình in dưới nước,… Xinh xắn hơn cả là các bé chuồn chuồn kim, cả thân hình chỉ nhỉnh hơn chiếc kim khâu… Ngần ấy loại chuồn chuồn cũng đủ cho chúng tôi mê tơi trong suốt mùa hè.';
    const extraTopics = [
        [1, 11, pests, 'Câu nào là câu chủ đề của đoạn về các con vật?', 'Tất cả đều lo diệt trừ sâu bọ để giữ gìn hoa lá.', [['Những bác cóc già lặng lẽ, siêng năng.', 'Chỉ nói về cóc, chưa bao quát các con vật khác.']], 'Câu cuối bao quát việc diệt sâu bọ của tất cả các con vật.'],
        [1, 11, pests, 'Ý nào nêu nội dung chính của đoạn về các con vật?', 'Các con vật diệt sâu bọ để giữ gìn hoa lá', [['Chỉ có cóc chăm chỉ làm việc', 'Đoạn nêu nhiều con vật cùng diệt sâu bọ, không chỉ có cóc.']], 'Các chi tiết đều hướng tới việc diệt sâu bọ, giữ gìn hoa lá.'],
        [17, 71, sea, 'Câu nào là câu chủ đề của đoạn về biển?', 'Biển động.', [['Gió thét trên những rừng dương.', 'Chỉ nêu một biểu hiện của cảnh biển động.']], 'Câu đầu nêu ý chung; gió, sóng và mưa là các chi tiết triển khai.'],
        [17, 71, sea, 'Ý nào bao quát đoạn về biển?', 'Cảnh biển động', [['Chỉ tả lá cờ đuôi nheo', 'Lá cờ chỉ là một chi tiết, không bao quát gió, sóng, mưa và bãi cát.']], 'Cả đoạn tả các biểu hiện của biển động.'],
        [17, 71, dragonflies, 'Câu nào là câu chủ đề của đoạn về chuồn chuồn?', 'Ngần ấy loại chuồn chuồn cũng đủ cho chúng tôi mê tơi trong suốt mùa hè.', [['Chuồn chuồn ngô mặc áo kẻ ca-rô đen vàng thích phơi mình ngoài nắng, trên ngọn chuối hoặc bên bờ ao.', 'Chỉ nói về chuồn chuồn ngô, chưa bao quát các loại còn lại.']], 'Câu cuối bao quát các loại chuồn chuồn và sự say mê của người kể.'],
        [17, 71, dragonflies, 'Câu chủ đề của đoạn về chuồn chuồn nằm ở đâu?', 'Cuối đoạn', [['Đầu đoạn', 'Câu đầu chỉ giới thiệu chuồn chuồn ngô, không bao quát cả đoạn.']], 'Câu cuối bắt đầu bằng “Ngần ấy loại chuồn chuồn” và nêu ý bao quát.']
    ];
    extraTopics.forEach(([lesson, page, passage, prompt, answer, wrong, explanation], i) => add('topic_sentence', 'e60-topic_sentence-' + (i + 1), lesson, [10, 11, page], passage,
        'Câu chủ đề nêu ý chính, thường nằm ở đầu hoặc cuối đoạn; xét toàn bộ đoạn.', prompt, answer, wrong, explanation, passage));
    function getItems(key, n) {
        const selected = key === 'word_type' ? (n >= 21 ? 'word_type_adjective' : n >= 9 ? 'word_type_verb' : key) : key;
        const items = (groups[selected] || []).filter(entry => entry.introducedAt <= n);
        return { items, passage: items[0]?.passage || '' };
    }
    root.VietnamesePracticeContent = Object.freeze({ getItems, allItems: () => [...records] });
})(typeof globalThis !== 'undefined' ? globalThis : this);
