;(function (root) {
    const subjects = { math: 'Toán', vietnamese: 'Tiếng Việt' };
    const banks = { math: root.Grade5MathPractice, vietnamese: root.Grade5VietnamesePractice };
    const classlevel = 'Lớp 5';
    const type = 'Trắc nghiệm';
    const entries = new Map();
    for (const [subject, terms] of Object.entries(root.app.constants.lessonCatalog['5'])) {
        for (const [term, topics] of Object.entries(terms)) {
            for (const { topic, lessons } of topics) {
                for (const lesson of lessons) {
                    for (const { key, page } of lesson.skills) {
                        const generatorKey = `g5.${subject}.${key}`;
                        const name = banks[subject].skills[key][0];
                        const fullName = `${lesson.label} · ${name}`;
                        const displayName = fullName.length <= 120 ? fullName : `${lesson.label.split('.')[0]} · ${name}`;
                        const template = {
                            id: `built-in-${lesson.id}-${key}`, classlevel, subject: subjects[subject],
                            semester: term === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2', topic, lesson: lesson.id,
                            name: displayName, question_type: type, generator_key: generatorKey,
                            prompt_template: '{question}', config: { lesson: lesson.id }, is_active: true
                        };
                        entries.set(`${generatorKey}:${lesson.id}`, { subject, key, term, page, template });
                    }
                }
            }
        }
    }

    const templateIds = [...new Set([...entries.values()].map(({ template }) => template.generator_key))];
    function lookup(templateId, config) {
        const entry = entries.get(`${templateId}:${config.lesson}`);
        if (!entry) throw new Error('Mẫu luyện tập lớp 5 không thuộc bài học đã chọn.');
        return entry;
    }
    function materialize(entry, row, random) {
        const { template, term, page, subject } = entry;
        const [q, ans, wrong, explanation] = row;
        const options = [ans, ...wrong];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return {
            q, ans, options, explanation, type, answerMode: 'single', partAnswerCounts: [1],
            classlevel, subject: template.subject, semester: template.semester, topic: template.topic,
            lesson: template.lesson, templateId: template.generator_key,
            source: { series: 'Kết nối tri thức với cuộc sống', book: subjects[subject] + ' 5', volume: term === 'hk1' ? 1 : 2, page },
            templateVariables: { question: q }
        };
    }
    function generateQuestion(templateId, config = {}, random = Math.random) {
        const entry = lookup(templateId, config);
        const bank = banks[entry.subject];
        const rows = bank.skills[entry.key][1];
        const row = entry.subject === 'math' ? bank.generate(entry.key, random) : rows[Math.floor(random() * rows.length)];
        return materialize(entry, row, random);
    }
    function getQuestionVariants(templateId, config = {}, random = Math.random) {
        const entry = lookup(templateId, config);
        const bank = banks[entry.subject];
        const rows = entry.subject === 'math' ? bank.variants(entry.key) : bank.skills[entry.key][1];
        return rows.map(row => materialize(entry, row, random));
    }
    const getDefaultTemplates = () => [...entries.values()].map(({ template }) => ({ ...template, config: { ...template.config } }));
    root.Grade5PracticeTemplates = Object.freeze({ templateIds, generateQuestion, getQuestionVariants, getDefaultTemplates });
})(typeof globalThis !== 'undefined' ? globalThis : this);
