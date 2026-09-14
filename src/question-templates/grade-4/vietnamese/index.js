;(function (root) {
    const normalize = value => String(value ?? '').trim().normalize('NFC');
    const allLessons = () => ['hk1', 'hk2'].flatMap(semester =>
        (root.app?.constants?.lessonCatalog?.['4']?.vietnamese?.[semester] || [])
            .flatMap(entry => entry.lessons.map(lesson => ({ ...lesson, semester, topic: entry.topic })))
    );

    const contextOf = lessonId => allLessons().find(lesson => lesson.id === lessonId) || null;

    function generateQuestion(config = {}) {
        const context = contextOf(config.lesson);
        if (!context) throw new Error('Vietnamese lesson template requires a valid lesson id.');
        const activity = context.activities.find(item => !item.startsWith('Đọc:')) || context.activities[0];
        const distractors = allLessons()
            .filter(item => item.id !== context.id)
            .flatMap(item => item.activities)
            .filter(item => item !== activity && !item.startsWith('Đọc:'))
            .filter((item, index, items) => items.indexOf(item) === index)
            .slice(0, 3);
        return {
            classlevel: 'Lớp 4',
            subject: 'Tiếng Việt',
            semester: context.semester === 'hk2' ? 'Học kỳ 2' : 'Học kỳ 1',
            topic: context.topic,
            lesson: context.id,
            templateId: 'vietnamese.lesson_activity_quiz',
            type: 'Trắc nghiệm',
            q: `Hoạt động học nào có trong ${context.label}?`,
            options: [activity, ...distractors],
            ans: activity,
            explanation: `${context.label} có nội dung: ${context.activities.join('; ')}.`,
            templateVariables: { question: `Hoạt động học nào có trong ${context.label}?` }
        };
    }

    const getDefaultTemplates = () => allLessons().map(lesson => ({
        id: `built-in-vietnamese-${lesson.id}`,
        name: `[${lesson.label}] Nhận biết hoạt động học`,
        classlevel: 'Lớp 4', subject: 'Tiếng Việt',
        semester: lesson.semester === 'hk2' ? 'Học kỳ 2' : 'Học kỳ 1',
        topic: lesson.topic, lesson: lesson.id,
        question_type: 'Trắc nghiệm', generator_key: 'vietnamese.lesson_activity_quiz',
        prompt_template: '{question}', config: { lesson: lesson.id }, is_active: true
    }));

    root.Grade4VietnameseTemplates = Object.freeze({
        templateIds: ['vietnamese.lesson_activity_quiz'],
        generateQuestion: (templateId, config) => {
            if (normalize(templateId) !== 'vietnamese.lesson_activity_quiz') throw new Error(`Unknown Grade 4 Vietnamese template: ${templateId}`);
            return generateQuestion(config);
        },
        getDefaultTemplates
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
