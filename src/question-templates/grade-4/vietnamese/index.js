;(function (root) {
    const definitions = [
        ['word_type', 'TV01 · Nhận biết từ loại', 'Trắc nghiệm', 1, 9],
        ['word_groups', 'TV02 · Phân nhóm từ', 'Kéo thả', 1, 9],
        ['capitalization', 'TV03 · Viết hoa đúng', 'Trắc nghiệm', 3, 18],
        ['word_meaning', 'TV04 · Ghép từ với nghĩa', 'Đối chiếu trùng khớp', 2, 13],
        ['context_fill', 'TV05 · Điền từ vào câu', 'Điền khuyết', 1, 9],
        ['personification', 'TV06 · Nhận diện nhân hoá', 'Đúng/Sai', 17, 78],
        ['dash_usage', 'TV07 · Công dụng dấu gạch ngang', 'Đối chiếu trùng khớp', 27, 119],
        ['reading_detail', 'TV08 · Tìm chi tiết đọc hiểu', 'Trắc nghiệm', 1, 9],
        ['character_detail', 'TV09 · Ghép nhân vật với chi tiết', 'Đối chiếu trùng khớp', 2, 13],
        ['topic_sentence', 'TV10 · Nhận biết câu chủ đề', 'Trắc nghiệm', 1, 10]
    ].map(([key, name, type, from, page]) => Object.freeze({ id: `vietnamese.${key}`, key, name, type, from, page }));
    const lessons = () => (root.app?.constants?.lessonCatalog?.['4']?.vietnamese?.hk1 || [])
        .flatMap(entry => entry.lessons.map(lesson => ({ ...lesson, topic: entry.topic })));
    const numberOf = lesson => Number(lesson.id.match(/b(\d+)$/)?.[1]);
    const shuffle = (values, random) => {
        const copy = [...values];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };
    function verifiedContext(templateId, config) {
        const definition = definitions.find(d => d.id === templateId);
        const lesson = lessons().find(l => l.id === config.lesson);
        if (!definition || !lesson || numberOf(lesson) < definition.from) throw new Error('Template không thuộc bài học Tiếng Việt học kì I đã chọn.');
        const { items, passage = '' } = root.VietnamesePracticeContent.getItems(definition.key, numberOf(lesson));
        const verified = items.filter(entry => root.VietnameseContentVerification.check(entry, numberOf(lesson)) === '');
        if (verified.length < 2) throw new Error('Chưa đủ hai câu con đã kiểm chứng cho bài học này.');
        return { definition, lesson, passage, verified };
    }
    function makeQuestion({ definition, lesson, passage }, parts, random) {
        const subquestions = shuffle(parts, random).map((part, index) => ({
            ...part, label: 'ab'[index], options: shuffle(part.options, random)
        }));
        const q = `${definition.name.replace(/^TV\d+ · /, '')}. Mỗi ý đúng được 0,5 điểm.`;
        return {
            classlevel: 'Lớp 4', subject: 'Tiếng Việt', semester: 'Học kỳ 1', topic: lesson.topic, lesson: lesson.id,
            templateId: definition.id, quickPractice: true, type: definition.type, q, passage, subquestions,
            partAnswerCounts: [1, 1], options: [], ans: subquestions.map(p => p.answer).join(' | '),
            explanation: subquestions.map(p => `${p.label}) ${p.explanation}`).join('\n'),
            source: { kind: 'reviewed-practice', curriculum: 'Tiếng Việt 4 tập một · Kết nối tri thức', recordIds: subquestions.map(p => p.id) },
            templateVariables: { question: q }
        };
    }
    function generateQuestion(templateId, config = {}, random = Math.random) {
        const context = verifiedContext(templateId, config);
        return makeQuestion(context, shuffle(context.verified, random).slice(0, 2), random);
    }
    function getQuestionVariants(templateId, config = {}, random = Math.random) {
        const context = verifiedContext(templateId, config);
        const variants = [];
        for (let i = 0; i < context.verified.length; i++) {
            for (let j = i + 1; j < context.verified.length; j++) {
                variants.push(makeQuestion(context, [context.verified[i], context.verified[j]], random));
            }
        }
        return variants;
    }
    function validateQuestion(question) {
        const definition = definitions.find(d => d.id === question?.templateId);
        const lesson = lessons().find(l => l.id === question?.lesson);
        if (!definition || !lesson || !question.quickPractice || question.type !== definition.type || !Array.isArray(question.subquestions) || question.subquestions.length !== 2 || question.subquestions.some(part => !part || typeof part !== 'object')) return 'Câu hỏi không thuộc bộ luyện tập đã kiểm chứng.';
        const allowedFields = ['classlevel', 'subject', 'semester', 'topic', 'lesson', 'templateId', 'quickPractice', 'type', 'q', 'passage', 'subquestions', 'partAnswerCounts', 'options', 'ans', 'explanation', 'source', 'templateVariables', 'id', 'created_at', 'difficulty'];
        if (Object.keys(question).some(key => !allowedFields.includes(key))) return 'Câu chính chứa trường hiển thị chưa được kiểm chứng.';
        if (question.subject !== 'Tiếng Việt' || question.classlevel !== 'Lớp 4' || question.semester !== 'Học kỳ 1' || question.topic !== lesson.topic) return 'Thông tin chương trình không khớp.';
        if (question.q !== `${definition.name.replace(/^TV\d+ · /, '')}. Mỗi ý đúng được 0,5 điểm.`) return 'Câu dẫn đã thay đổi sau kiểm chứng.';
        if (question.ans !== question.subquestions.map(p => p.answer).join(' | ') || question.explanation !== question.subquestions.map(p => `${p.label}) ${p.explanation}`).join('\n')) return 'Đáp án hoặc lời giải tổng hợp không khớp.';
        if (JSON.stringify(question.partAnswerCounts) !== '[1,1]') return 'Cần đúng hai ý độc lập.';
        const available = new Set(root.VietnamesePracticeContent.getItems(definition.key, numberOf(lesson), () => 0).items.map(p => p.id));
        root.VietnamesePracticeContent.getItems(definition.key, numberOf(lesson), () => 0.9).items.forEach(p => available.add(p.id));
        if (question.subquestions[0].id === question.subquestions[1].id) return 'Hai câu con bị trùng.';
        for (const [index, part] of question.subquestions.entries()) {
            if (part.label !== 'ab'[index] || Object.keys(part).some(key => !['id', 'introducedAt', 'prompt', 'answer', 'options', 'explanation', 'passage', 'evidence', 'label'].includes(key))) return 'Câu con chứa trường chưa được kiểm chứng.';
            if (!available.has(part.id) || (part.passage || '') !== (question.passage || '')) return 'Ngữ liệu không khớp bài học hoặc đoạn đọc.';
            const issue = root.VietnameseContentVerification.check(part, numberOf(lesson));
            if (issue) return issue;
        }
        return '';
    }
    const getDefaultTemplates = () => lessons().flatMap(lesson => definitions.filter(d => numberOf(lesson) >= d.from).map(d => ({
        id: `built-in-${d.id}-${lesson.id}`, name: `[${lesson.label}] ${d.name}`,
        classlevel: 'Lớp 4', subject: 'Tiếng Việt', semester: 'Học kỳ 1', topic: lesson.topic, lesson: lesson.id,
        question_type: d.type, generator_key: d.id, prompt_template: '{question}',
        config: { lesson: lesson.id, subquestionCount: 2 }, is_active: true
    })));
    root.Grade4VietnameseTemplates = Object.freeze({ templateIds: definitions.map(d => d.id), definitions, generateQuestion, getQuestionVariants, getDefaultTemplates, validateQuestion });
})(typeof globalThis !== 'undefined' ? globalThis : this);
