;(function (root) {
    const freeze = value => {
        if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
        return value;
    };
    const atoms = [];
    const add = (kind, id, fields) => atoms.push({ kind, id, ...fields });
    const schoolContexts = {
        weather: 'Nắng thu đã toả vàng khắp nơi thay cho những tia nắng hè gay gắt. Gió thổi mát rượi, đuổi những chiếc lá rụng chạy lao xao.',
        pupils: 'Lá như cũng biết nô đùa, cứ quấn theo chân các bạn học sinh đang đi vội vã.',
        family: 'Bạn thì đi với bố, bạn thì đi với mẹ, có bạn lại đi một mình.',
        school: 'Ai cũng vội đến trường để gặp lại thầy giáo, cô giáo, bạn bè, gặp lại bàn, ghế thân quen.',
        time: 'Hôm nay bắt đầu năm học mới.',
        holiday: 'Thế là kì nghỉ hè kết thúc.'
    };
    const nouns = [
        ['học sinh', 'person', 'pupils'], ['bố', 'person', 'family'], ['mẹ', 'person', 'family'],
        ['thầy giáo', 'person', 'school'], ['cô giáo', 'person', 'school'], ['bạn bè', 'person', 'school'],
        ['lá', 'object', 'weather'], ['bàn', 'object', 'school'], ['ghế', 'object', 'school'],
        ['nắng', 'phenomenon', 'weather'], ['gió', 'phenomenon', 'weather'],
        ['hôm nay', 'time', 'time'], ['năm học', 'time', 'time'], ['thu', 'time', 'weather']
    ];
    nouns.forEach(([word, category, context], i) => add('lexeme', `noun-${i}`, {
        word, category, pos: 'Danh từ', context: schoolContexts[context], lesson: 1, pages: [9, 10], sourceRecord: 'noun-1'
    }));
    ['chạy', 'bay', 'bơi', 'hót', 'đậu', 'đi', 'vẫy', 'cười', 'nói'].forEach((word, i) => add('lexeme', `verb-${i}`, {
        word, pos: 'Động từ', lesson: 9, pages: [41], sourceRecord: 'verb-1',
        context: 'chạy; bay; bơi; hót; đậu; đi; vẫy; cười; nói'
    }));
    const adjectiveContext = 'Ánh nắng lướt đi rất nhanh, đổi màu thoăn thoắt: vàng ruộm trên cánh đồng, thơm nồng mùa gặt, nâu sẫm trên luống đất vừa gieo hạt, đỏ rực trên mái ngói, xanh mướt trên những vườn cây um tùm,…';
    ['vàng ruộm', 'thơm nồng', 'nâu sẫm', 'đỏ rực', 'xanh mướt', 'um tùm'].forEach((word, i) => add('lexeme', `adjective-${i}`, {
        word, pos: 'Tính từ', context: adjectiveContext, lesson: 21, pages: [95], sourceRecord: 'e60-word_type-5'
    }));
    for (const [id, sourceRecord, word] of [
        ['light', 'adjective-1', 'nhẹ'], ['slow', 'adjective-2', 'chậm rãi'],
        ['plant', 'e60-word_type-4', 'trồng'], ['uproot', 'e60-word_type-3', 'bứng']
    ]) add('lexeme', id, { word, sourceRecord, lesson: id === 'plant' || id === 'uproot' ? 10 : 21 });
    const names = ['Hà Nội', 'Cần Thơ', 'Chu Văn An', 'Trần Thị Lý', 'Bạch Đằng', 'Cửu Long', 'Việt Nam', 'Cao Bằng', 'Đài Truyền hình Việt Nam', 'Trường Tiểu học Quang Trung'];
    names.forEach((word, i) => add('name', `name-${i}`, {
        word, lesson: i < 8 ? 3 : 7, sourceRecord: i < 4 ? `capital-${i + 1}` : `e60-capitalization-${i - 3}`,
        category: ['city', 'city', 'person', 'person', 'river', 'river', 'country', 'province', 'organisation', 'organisation'][i]
    }));
    const terms = ['tiết tấu', 'vi-ô-lông', 'cla-ri-nét', 'gia tộc', 'thung', 'đế', 'xen-lô', 'đăm chiêu', 'bứng', 'mơ hồ', 'xào xạc', 'lả chả'];
    terms.forEach((word, i) => add('meaning', `meaning-${i}`, { word, sourceRecord: i < 6 ? `meaning-${i + 1}` : `e60-word_meaning-${i - 5}` }));
    const personifications = [
        ['personification-1', 'chuồn ớt', 'anh', 'gọi'], ['personification-2', 'cây dừa', 'sải tay, bơi', 'tả'],
        ['e60-personification-1', 'mầm cây', 'tỉnh giấc', 'tả'], ['e60-personification-2', 'hạt mưa', 'trốn tìm', 'tả'],
        ['e60-personification-3', 'cây đào', 'lim dim mắt cười', 'tả'], ['e60-personification-4', 'gió', 'chị', 'gọi'],
        ['e60-personification-5', 'cây', 'cậu', 'trò chuyện'], ['e60-personification-6', 'chích choè', 'thím', 'gọi']
    ];
    personifications.forEach(([sourceRecord, subject, signal, method], i) => add('personification', `person-${i}`, { sourceRecord, subject, signal, method }));
    const dashRecords = ['dash-1', 'dash-2', 'dash-3', ...Array.from({ length: 6 }, (_, i) => `e60-dash_usage-${i + 1}`)];
    dashRecords.forEach((sourceRecord, i) => add('dash', `dash-${i}`, { sourceRecord }));
    const relations = [
        ['reading-1', 'địa điểm mọi người vội đến'], ['reading-2', 'thời điểm bắt đầu năm học mới'],
        ['e60-reading_detail-1', 'vai diễn được giao cho Giét-xi'], ['e60-reading_detail-2', 'cảm xúc của Giét-xi khi được chọn vai'],
        ['e60-reading_detail-3', 'vị trí Ta-nhi-a trồng cây hoa hồng bạch'], ['e60-reading_detail-4', 'cây Ta-nhi-a trồng cạnh cây hoa hồng'],
        ['e60-reading_detail-5', 'người quyết định làm con thỏ bằng giấy'], ['e60-reading_detail-6', 'người được Hà tặng con thỏ']
    ];
    relations.forEach(([sourceRecord, field], i) => add('detail', `detail-${i}`, { sourceRecord, field }));
    const characters = [
        ['character-1', 'thầy vàng anh', 'cử chỉ và vẻ ngoài'], ['character-2', 'các học trò', 'trạng thái'],
        ['e60-character_detail-1', 've sầu', 'bản nhạc'], ['e60-character_detail-2', 've sầu', 'trang phục'],
        ['e60-character_detail-3', 'gà trống', 'khúc nhạc'], ['e60-character_detail-4', 'gà trống', 'tư thế'],
        ['e60-character_detail-5', 'dế mèn', 'bản nhạc'], ['e60-character_detail-6', 'dế mèn', 'trang phục']
    ];
    characters.forEach(([sourceRecord, subject, field], i) => add('character', `character-${i}`, { sourceRecord, subject, field }));
    ['topic-1', 'e60-topic_sentence-1', 'e60-topic_sentence-3', 'e60-topic_sentence-5'].forEach((sourceRecord, i) => add('topic', `topic-${i}`, {
        sourceRecord, summaryRecord: ['topic-2', 'e60-topic_sentence-2', 'e60-topic_sentence-4', null][i]
    }));
    const actors = [
        ...nouns.filter(([, category]) => category === 'person').map(([word], i) => ({ id: `human-${i}`, word, sourceRecord: 'noun-1', pages: [9, 41], verbs: ['đi', 'chạy', 'cười', 'nói', 'vẫy'] })),
        { id: 'bird', word: 'chim', sourceRecord: 'verb-1', pages: [41], verbs: ['bay', 'hót', 'đậu'] },
        { id: 'fish', word: 'cá', sourceRecord: 'verb-1', pages: [41], verbs: ['bơi'] },
        { id: 'dragonfly', word: 'chuồn chuồn', sourceRecord: 'verb-1', pages: [41], verbs: ['bay', 'đậu'] }
    ];
    const sourceEntry = id => {
        const entry = root.VietnamesePracticeContent.allItems().find(item => item.id === id);
        if (!entry || root.VietnameseContentVerification.check(entry, 32)) throw new Error('Nguồn của nội dung tham số chưa được kiểm chứng: ' + id);
        return entry;
    };
    function resolve(id) {
        const atom = atoms.find(value => value.id === id);
        if (!atom) throw new Error('Tham số nội dung không hợp lệ.');
        const source = sourceEntry(atom.sourceRecord);
        const result = { ...atom, lesson: atom.lesson || source.introducedAt, context: atom.context || source.passage || source.evidence.excerpt, pages: atom.pages || source.evidence.pages };
        if (atom.kind === 'lexeme' && !atom.pos) result.pos = atom.id === 'plant' || atom.id === 'uproot' ? 'Động từ' : 'Tính từ';
        if (['meaning', 'dash', 'detail', 'character', 'topic'].includes(atom.kind)) {
            result.value = source.answer;
            result.alternatives = source.options.filter(option => option !== source.answer);
        }
        if (atom.kind === 'topic') {
            result.position = result.context.startsWith(result.value) ? 'Đầu đoạn' : 'Cuối đoạn';
            result.summary = atom.summaryRecord ? sourceEntry(atom.summaryRecord).answer : null;
        }
        return freeze(result);
    }
    function actor(id) {
        const value = actors.find(item => item.id === id);
        if (!value) throw new Error('Chủ thể không thuộc khung câu đã kiểm chứng.');
        sourceEntry(value.sourceRecord);
        return value;
    }
    freeze(atoms); freeze(actors);
    root.VietnameseParameterCorpus = freeze({
        version: 1, reviewStatus: 'reviewed', atoms, actors,
        nounCategories: { person: 'Chỉ người', object: 'Chỉ vật', phenomenon: 'Chỉ hiện tượng tự nhiên', time: 'Chỉ thời gian' },
        nameCategories: { city: 'Tên thành phố', person: 'Tên người', river: 'Tên sông', country: 'Tên nước', province: 'Tên tỉnh', organisation: 'Tên cơ quan, tổ chức' },
        resolve, actor
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
