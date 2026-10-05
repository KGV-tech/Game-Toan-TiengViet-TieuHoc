;(function (root) {
    const corpus = root.VietnameseParameterCorpus;
    const unique = values => [...new Set(values)];
    const upper = word => word[0].toLocaleUpperCase('vi-VN') + word.slice(1);
    const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
    const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
    const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
    const rotate = (values, seed) => values.length ? [...values.slice(seed % values.length), ...values.slice(0, seed % values.length)] : [];
    const patterns = {
        word_type: ['lexeme-class', 'sentence-class', 'sentence-word'],
        word_groups: ['noun-group', 'name-group'], capitalization: ['name-case'],
        word_meaning: ['meaning-forward', 'meaning-reverse'], context_fill: ['source-fill'],
        personification: ['person-claim'], dash_usage: ['dash-function'],
        reading_detail: ['detail-value', 'detail-field'], character_detail: ['character-value', 'character-field'],
        topic_sentence: ['topic-value', 'topic-position']
    };
    function materialize(skill, params, lesson) {
        if (corpus.reviewStatus !== 'reviewed') throw new Error('Ngữ liệu tham số chưa hoàn tất review nguồn.');
        if (!Number.isInteger(lesson) || lesson < 1 || lesson > 32) throw new Error('Ngoài phạm vi học kì I.');
        if (!patterns[skill]?.includes(params?.pattern)) throw new Error('Khung không thuộc kỹ năng.');
        const composed = params.pattern.startsWith('sentence-');
        const fields = composed ? ['pattern', 'actorId', 'actionId', 'role'] : ['pattern', 'atomId', ...(params.pattern === 'person-claim' ? ['positive'] : [])];
        if (!same(Object.keys(params).sort(), fields.sort())) throw new Error('Tham số ngoài miền đã kiểm chứng.');
        let atom, context, word, answer, options, prompt, passage = '', introducedAt, pages, targets;
        if (composed) {
            const actor = corpus.actor(params.actorId), action = corpus.resolve(params.actionId);
            if (action.kind !== 'lexeme' || action.pos !== 'Động từ' || !actor.verbs.includes(action.word) || !['subject', 'action'].includes(params.role) || lesson < 9) throw new Error('Tổ hợp chủ thể–hoạt động chưa được duyệt.');
            const complement = action.word === 'vẫy' ? ' tay' : action.word === 'đậu' ? (actor.id === 'bird' ? ' trên cành cây' : ' trên lá') : '';
            context = `${upper(actor.word)} đang ${action.word}${complement}.`;
            word = params.role === 'subject' ? actor.word : action.word;
            answer = params.pattern === 'sentence-class' ? (params.role === 'subject' ? 'Danh từ' : 'Động từ') : word;
            options = params.pattern === 'sentence-class' ? ['Danh từ', 'Động từ', ...(lesson >= 21 ? ['Tính từ'] : [])] : [actor.word, action.word];
            prompt = params.pattern === 'sentence-class' ? `Trong câu biên soạn “${context}”, từ ngữ “${word}” thuộc từ loại nào?` : `Trong câu biên soạn “${context}”, từ ngữ nào là ${params.role === 'subject' ? 'danh từ' : 'động từ'}?`;
            introducedAt = 9; pages = unique([...actor.pages, ...action.pages]); targets = [actor.word, action.word];
        } else {
            atom = corpus.resolve(params.atomId);
            if (lesson < atom.lesson) throw new Error('Ngữ liệu chưa thuộc bài đang học.');
            context = atom.context; word = atom.word; introducedAt = atom.lesson; pages = atom.pages;
            targets = [word || atom.subject || atom.field || atom.id];
            const peers = corpus.atoms.filter(a => a.kind === atom.kind).map(a => corpus.resolve(a.id)).filter(a => a.lesson <= lesson && a.context === context);
            switch (params.pattern) {
                case 'lexeme-class':
                    if (atom.kind !== 'lexeme') throw new Error('Cần từ có nhãn từ loại.');
                    if (atom.id.startsWith('verb-')) throw new Error('Động từ từ nhãn tranh chỉ dùng trong khung câu có chủ thể.');
                    answer = lesson < 9 ? corpus.nounCategories[atom.category] : atom.pos;
                    options = lesson < 9 ? Object.values(corpus.nounCategories) : ['Danh từ', 'Động từ', ...(lesson >= 21 ? ['Tính từ'] : [])];
                    prompt = `Trong ngữ liệu “${context}”, từ ngữ “${word}” thuộc ${lesson < 9 ? 'nhóm nào' : 'từ loại nào'}?`; break;
                case 'noun-group': case 'name-group': {
                    const name = params.pattern === 'name-group';
                    if (atom.kind !== (name ? 'name' : 'lexeme') || !atom.category) throw new Error('Thiếu nhãn nhóm nghĩa.');
                    const categories = name ? corpus.nameCategories : corpus.nounCategories;
                    answer = categories[atom.category]; options = Object.values(categories).filter(value => !name || lesson >= 7 || value !== categories.organisation);
                    prompt = name ? `Tên riêng “${word}” thuộc nhóm nào?` : `Trong “${context}”, từ ngữ “${word}” thuộc nhóm nào?`; break;
                }
                case 'source-fill': {
                    if (atom.kind !== 'lexeme' || !context.toLocaleLowerCase('vi-VN').includes(word)) throw new Error('Không có từ mục tiêu trong câu nguồn.');
                    if (atom.id.startsWith('verb-')) throw new Error('Danh sách nhãn tranh không phải câu để điền khuyết.');
                    const start = context.toLocaleLowerCase('vi-VN').indexOf(word);
                    answer = context.slice(start, start + word.length);
                    // The hint and distinct labels make only one choice eligible;
                    // another person/action that also fits the blank is never offered.
                    const alternatives = corpus.atoms.filter(a => a.kind === 'lexeme' && a.id !== atom.id).map(a => corpus.resolve(a.id))
                        .filter(a => a.lesson <= lesson && a.word !== word && (atom.category ? a.category && a.category !== atom.category : a.pos !== atom.pos));
                    const sentenceInitial = answer[0] !== answer[0].toLocaleLowerCase('vi-VN');
                    options = [answer, ...rotate(alternatives, corpus.atoms.findIndex(a => a.id === atom.id)).slice(0, 2).map(a => sentenceInitial ? upper(a.word) : a.word)];
                    const blank = context.slice(0, start) + '___' + context.slice(start + word.length);
                    const hint = atom.category ? corpus.nounCategories[atom.category].toLocaleLowerCase('vi-VN') : `là ${atom.pos.toLocaleLowerCase('vi-VN')}`;
                    prompt = `Chọn từ ngữ ${hint} điền vào ngữ liệu: “${blank}”`; break;
                }
                case 'name-case': {
                    if (atom.kind !== 'name') throw new Error('Cần tên riêng đã kiểm chứng.');
                    answer = word;
                    options = [word, word.toLocaleLowerCase('vi-VN'), word.replace(/\p{Lu}/u, letter => letter.toLocaleLowerCase('vi-VN'))];
                    prompt = `Chọn cách viết đúng ${corpus.nameCategories[atom.category].toLocaleLowerCase('vi-VN')} “${word.toLocaleLowerCase('vi-VN')}”.`; break;
                }
                case 'meaning-forward': case 'meaning-reverse': {
                    if (atom.kind !== 'meaning') throw new Error('Cần quan hệ từ–nghĩa.');
                    if (params.pattern === 'meaning-forward') { answer = atom.value; options = [answer, ...atom.alternatives]; prompt = `Theo chú giải đã học, “${word}” có nghĩa nào?`; }
                    else {
                        answer = word;
                        const other = rotate(corpus.atoms.filter(a => a.kind === 'meaning').map(a => corpus.resolve(a.id)).filter(a => a.lesson <= lesson && a.value !== atom.value), corpus.atoms.findIndex(a => a.id === atom.id)).slice(0, 2);
                        options = [word, ...other.map(a => a.word)]; prompt = `Theo chú giải đã học, từ nào có nghĩa “${atom.value}”?`;
                    } break;
                }
                case 'person-claim':
                    if (atom.kind !== 'personification' || typeof params.positive !== 'boolean') throw new Error('Cần dấu hiệu nhân hoá được duyệt.');
                    answer = params.positive ? 'Đúng' : 'Sai'; options = ['Đúng', 'Sai'];
                    prompt = `Trong “${context}”, nhận định sau đúng hay sai: “${atom.subject} ${params.positive ? 'được' : 'không được'} nhân hoá qua dấu hiệu ‘${atom.signal}’.”`; break;
                case 'dash-function':
                    if (atom.kind !== 'dash') throw new Error('Cần ngữ liệu dấu gạch ngang.');
                    answer = atom.value; options = [answer, ...atom.alternatives]; prompt = `Trong ngữ liệu “${context}”, dấu gạch ngang có công dụng nào?`; break;
                case 'detail-value': case 'character-value': case 'detail-field': case 'character-field': {
                    const character = params.pattern.startsWith('character');
                    if (atom.kind !== (character ? 'character' : 'detail')) throw new Error('Cần quan hệ theo đoạn đọc.');
                    passage = context;
                    const field = a => character ? `${a.subject}: ${a.field}` : a.field;
                    if (params.pattern.endsWith('value')) { answer = atom.value; options = [answer, ...atom.alternatives]; prompt = `Theo đoạn đọc, chọn chi tiết về ${field(atom)}.`; }
                    else { answer = field(atom); options = peers.filter(a => a.value !== atom.value).map(field); options.unshift(answer); prompt = `Chi tiết “${atom.value}” cho biết điều gì trong đoạn đọc?`; }
                    break;
                }
                case 'topic-value': case 'topic-position':
                    if (atom.kind !== 'topic') throw new Error('Cần quan hệ câu chủ đề–đoạn.');
                    passage = context;
                    if (params.pattern === 'topic-value') { answer = atom.value; options = [answer, ...atom.alternatives]; prompt = 'Chọn câu chủ đề của đoạn đọc.'; }
                    else { answer = atom.position; options = ['Đầu đoạn', 'Cuối đoạn']; prompt = 'Câu chủ đề nằm ở vị trí nào trong đoạn đọc?'; } break;
            }
        }
        options = unique(options);
        if (!answer || options.length < 2 || !options.includes(answer)) throw new Error('Chưa đủ phương án có một đáp án duy nhất.');
        const explanation = composed ? `Câu biên soạn từ khung đã duyệt. “${word}” ${params.role === 'subject' ? 'chỉ chủ thể, là danh từ' : 'chỉ hoạt động, là động từ'}.` : `Đối chiếu ngữ liệu SGK trang ${pages.join(', ')}: đáp án là “${answer}”.`;
        const generation = { ...params };
        const semanticKey = JSON.stringify([skill, ...Object.entries(params).filter(([key]) => key !== 'positive').sort()]);
        return { id: `parameter:${semanticKey}`, introducedAt, prompt, answer, options, explanation, passage, generation, semanticKey, targets,
            evidence: { source: 'sgk-tv4-kntt-t1', pages, kind: composed ? 'reviewed-composition' : 'reviewed-parameter', excerpt: context,
                rule: 'Dựng lại từ tham số, nhãn và quan hệ theo ngữ cảnh đã review.', optionReasons: Object.fromEntries(options.map(value => [value, value === answer ? explanation : 'Không khớp yêu cầu theo nhãn hoặc quan hệ của ngữ liệu này.'])) } };
    }
    const cache = new Map();
    function candidates(skill, lesson) {
        if (corpus.reviewStatus !== 'reviewed') throw new Error('Ngữ liệu tham số chưa hoàn tất review nguồn.');
        const key = skill + ':' + lesson;
        if (cache.has(key)) return cache.get(key);
        const params = [];
        for (const [index, atom] of corpus.atoms.entries()) for (const pattern of patterns[skill] || []) {
            if (!pattern.startsWith('sentence-')) params.push({ pattern, atomId: atom.id, ...(pattern === 'person-claim' ? { positive: index % 2 === 0 } : {}) });
        }
        if (skill === 'word_type' && lesson >= 9) for (const actor of corpus.actors) for (const action of corpus.atoms.filter(a => a.id.startsWith('verb-'))) {
            if (actor.verbs.includes(action.word)) for (const pattern of ['sentence-class', 'sentence-word']) for (const role of ['subject', 'action']) params.push({ pattern, actorId: actor.id, actionId: action.id, role });
        }
        const parts = params.flatMap(p => { try { return [materialize(skill, p, lesson)]; } catch { return []; } });
        // Cache immutable descriptors; callers receive copies before shuffling or labelling.
        freeze(parts);
        cache.set(key, parts); return parts;
    }
    function pairs(skill, lesson) {
        const groups = new Map();
        for (const part of candidates(skill, lesson)) { const group = groups.get(part.passage) || []; group.push(part); groups.set(part.passage, group); }
        const result = [];
        for (const parts of groups.values()) for (let i = 0; i < parts.length; i++) {
            // A linear set covers all parameters without constructing a quadratic bank.
            const partner = [...parts.slice(i + 1), ...parts.slice(0, i)].find(part => independent(parts[i], part));
            if (partner) result.push([parts[i], partner]);
        }
        return result;
    }
    function independent(first, second) {
        if (first.passage !== second.passage || first.semanticKey === second.semanticKey) return false;
        const a = first.generation, b = second.generation;
        if (!a || !b) return false;
        if (a.atomId && a.atomId === b.atomId) {
            // The topic sentence and its position assess separate properties and do
            // not print each other's answer. Forward/reverse lookup does.
            return a.pattern.startsWith('topic-') && b.pattern.startsWith('topic-');
        }
        return !(a.actorId && a.actorId === b.actorId && a.actionId === b.actionId);
    }
    const pairKey = parts => parts.map(part => part.semanticKey).sort().join('|');
    function selectParts(skill, lesson, history, chosen, random) {
        const parts = candidates(skill, lesson);
        const cost = part => part.targets.filter(word => history.words.includes(word)).length / part.targets.length * 1000
            + (history.parts.includes(part.semanticKey) ? 100 + (history.parts.indexOf(part.semanticKey) + 1) / (history.parts.length + 1) * 10 : 0)
            + (history.contexts.includes(part.evidence.excerpt) ? 1 : 0);
        // Rank individual parameters before pairing. A fixed adjacent-pair list can
        // strand unseen vocabulary behind an already-seen partner.
        const ranked = parts.map(part => ({ part, cost: cost(part), tie: random() })).sort((a, b) => a.cost - b.cost || a.tie - b.tie);
        for (const { part } of ranked) {
            const partner = ranked.find(candidate => independent(part, candidate.part) && !chosen.has(pairKey([part, candidate.part])));
            if (partner) return [part, partner.part];
        }
        return null;
    }
    function check(part, skill, lesson) {
        try {
            const expected = materialize(skill, part.generation, lesson);
            const actual = { ...part }; delete actual.label;
            if (!same(Object.keys(actual).sort(), Object.keys(expected).sort())) return 'Câu con chứa trường ngoài hợp đồng template.';
            actual.options = [...actual.options].sort(); expected.options.sort();
            return same(actual, expected) ? '' : 'Câu sinh không khớp tham số và bằng chứng đã kiểm chứng.';
        } catch { return 'Tham số không thuộc khung hoặc chương trình đã kiểm chứng.'; }
    }
    root.VietnameseParameterEngine = Object.freeze({ materialize, candidates, pairs, selectParts, independent, pairKey, check });
})(typeof globalThis !== 'undefined' ? globalThis : this);
