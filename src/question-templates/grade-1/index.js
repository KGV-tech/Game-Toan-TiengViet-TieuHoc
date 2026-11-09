;(function (root) {
    const math = root.Grade1MathPractice;
    const vietnamese = root.Grade1VietnamesePractice;
    const skillNames = {
        count5: 'Đếm hình từ 0 đến 5', count10: 'Đếm hình từ 6 đến 10',
        read5: 'Đọc số từ 0 đến 5', read10: 'Đọc số từ 6 đến 10', read100: 'Đọc số đến 100',
        groups: 'Nhiều hơn, ít hơn, bằng nhau', compare10: 'So sánh số đến 10',
        compare100: 'So sánh số có hai chữ số', order10: 'Tìm số lớn nhất, bé nhất',
        order100: 'Tìm số có hai chữ số lớn nhất, bé nhất', split10: 'Tách số',
        shape: 'Nhận biết hình phẳng', countShapes: 'Đếm hình phẳng', pattern: 'Xếp hình theo mẫu',
        pieces: 'Đếm mảnh ghép', solid: 'Nhận biết hình khối', position: 'Xác định vị trí',
        add10: 'Cộng trong phạm vi 10', sub10: 'Trừ trong phạm vi 10',
        addStory10: 'Bài toán thêm trong phạm vi 10', subStory10: 'Bài toán bớt trong phạm vi 10',
        add21: 'Cộng số có hai chữ số với số có một chữ số', add22: 'Cộng hai số có hai chữ số',
        sub21: 'Trừ số có hai chữ số cho số có một chữ số', sub22: 'Trừ hai số có hai chữ số',
        addStory100: 'Bài toán thêm trong phạm vi 100', subStory100: 'Bài toán bớt trong phạm vi 100',
        place: 'Chục và đơn vị', sequence100: 'Điền số còn thiếu', compareLength: 'So sánh độ dài',
        ruler: 'Đo bằng thước xăng-ti-mét', measureUnits: 'Đo bằng gang tay',
        estimate: 'Ước lượng độ dài', clock: 'Đọc giờ đúng', week: 'Ngày trong tuần', calendar: 'Xem lịch',
        read: 'Đọc hiểu', words: 'Điền từ', capital: 'Viết hoa đầu câu', spelling: 'Chính tả'
    };
    const fillSkills = new Set([
        'countShapes', 'split10', 'add10', 'sub10', 'addStory10', 'subStory10', 'add21', 'add22',
        'sub21', 'sub22', 'addStory100', 'subStory100', 'place', 'sequence100', 'ruler', 'measureUnits'
    ]);
    const classlevel = 'Lớp 1';
    const subjectLabels = { math: 'Toán', vietnamese: 'Tiếng Việt' };

    function shuffleOptions(options, random) {
        const shuffled = [...options];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function templateFor(subject, topic, lesson, skill) {
        const volume = lesson.id.includes('-hk1-') ? 1 : 2;
        return {
            name: `${lesson.label.split('. ')[0]} · ${skillNames[skill]}`,
            classlevel, subject: subjectLabels[subject], semester: `Học kỳ ${volume}`, topic, lesson: lesson.id,
            generator_key: `g1.${subject}.${skill}`,
            question_type: fillSkills.has(skill) ? 'Điền khuyết' : 'Trắc nghiệm',
            prompt_template: '{question}', config: { lesson: lesson.id }, is_active: true
        };
    }

    function getDefaultTemplates() {
        return Object.keys(subjectLabels).flatMap(subject => root.app.curriculum.getTopicEntries({ classlevel, subject })
            .flatMap(({ topic, lessons }) => lessons.flatMap(lesson =>
                (lesson.skills || ['read', 'words', 'capital', 'spelling'])
                    .map(skill => templateFor(subject, topic, lesson, skill)))));
    }

    const isTemplate = template => template?.classlevel === classlevel && /^g1\.(math|vietnamese)\./.test(template.generator_key);
    const templateKey = template => JSON.stringify([
        template.subject, template.semester, template.topic, template.lesson || template.config?.lesson, template.generator_key
    ]);

    function getPracticeQuestions({ subject, topics = [], lesson, savedTemplates = [] } = {}, random = Math.random) {
        const entries = root.app.curriculum.getTopicEntries({ classlevel, subject });
        const disabled = new Set(savedTemplates.filter(template => isTemplate(template) && template.is_active === false).map(templateKey));
        return entries.filter(entry => topics.includes(entry.topic)).flatMap(entry =>
            entry.lessons.filter(item => !lesson || item.id === lesson).flatMap(item => {
                const volume = item.id.includes('-hk1-') ? 1 : 2;
                const questions = subject === 'math'
                    ? item.skills.flatMap(skill => math.skills[skill]().map(q => ({ ...q, skill })))
                    : vietnamese.variants(item, item.page === 164
                        ? entries.slice(0, -1).flatMap(topic => topic.lessons)
                        : entry.lessons);
                return questions.flatMap(({ skill, contentPage, ...question }) => {
                    const template = templateFor(subject, entry.topic, item, skill);
                    if (disabled.has(templateKey(template))) return [];
                    return [{
                        ...question,
                        options: shuffleOptions(question.options, random),
                        templateId: template.generator_key,
                        classlevel, subject: template.subject, semester: template.semester, topic: template.topic, lesson: template.lesson,
                        source: {
                            curriculum: `${template.subject} 1 · Kết nối tri thức với cuộc sống`,
                            volume,
                            page: item.page,
                            ...(contentPage && contentPage !== item.page ? { contentPage } : {})
                        }
                    }];
                });
            })
        );
    }

    function generateTemplateQuestion(template, random = Math.random) {
        if (!isTemplate(template) || template.is_active === false) return null;
        const lesson = template.lesson || template.config?.lesson;
        if (!lesson) return null;
        const context = root.app.curriculum.getLessonContext(lesson);
        if (!context || template.subject !== subjectLabels[context.subject] || template.topic !== context.topic ||
            template.semester !== (context.semester === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2')) return null;
        const questions = getPracticeQuestions({ subject: context.subject, topics: [context.topic], lesson }, random)
            .filter(question => question.templateId === template.generator_key && question.type === template.question_type);
        return questions[Math.floor(random() * questions.length)] || null;
    }

    root.Grade1PracticeTemplates = { getPracticeQuestions, getDefaultTemplates, isTemplate, generateTemplateQuestion };
})(typeof globalThis !== 'undefined' ? globalThis : this);
