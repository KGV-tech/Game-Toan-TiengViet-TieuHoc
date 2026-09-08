// Danh mục phân cấp Chủ đề → Bài học, tách khỏi main.js để dùng được ở
// contract test và để các màn hình Admin dùng chung một luật tra cứu.
;(function (root) {
    if (!root.app) root.app = {};

    const classNumberOf = value => {
        const match = String(value ?? '').trim().match(/(?:Lớp\s*)?([1-5])$/i);
        return match ? match[1] : '';
    };

    const subjectKeyOf = value => {
        const normalized = String(value ?? '').trim().normalize('NFC').toLocaleLowerCase('vi-VN');
        if (normalized === 'toán' || normalized === 'math') return 'math';
        if (normalized === 'tiếng việt' || normalized === 'vietnamese') return 'vietnamese';
        return '';
    };

    const semesterKeyOf = value => {
        const normalized = String(value ?? '').trim().normalize('NFC').toLocaleLowerCase('vi-VN');
        if (normalized === 'hk1' || normalized === '1' || normalized === 'học kỳ 1') return 'hk1';
        if (normalized === 'hk2' || normalized === '2' || normalized === 'học kỳ 2') return 'hk2';
        return '';
    };

    const getCatalog = () => root.app.constants?.lessonCatalog || {};

    const curriculum = {
        normalizeClassNumber: classNumberOf,
        normalizeSubjectKey: subjectKeyOf,
        normalizeSemesterKey: semesterKeyOf,
        supportsLessons(classlevel, subject) {
            return classNumberOf(classlevel) === '4' && subjectKeyOf(subject) === 'math';
        },
        getTopicEntries({ classlevel, subject, semester } = {}) {
            if (!this.supportsLessons(classlevel, subject)) return [];
            const semesterKey = semesterKeyOf(semester);
            if (semesterKey) return getCatalog()['4']?.math?.[semesterKey] || [];
            return ['hk1', 'hk2'].flatMap(key => getCatalog()['4']?.math?.[key] || []);
        },
        getTopicEntry({ classlevel, subject, semester, topic } = {}) {
            const normalizedTopic = String(topic ?? '').trim().normalize('NFC');
            return this.getTopicEntries({ classlevel, subject, semester })
                .find(entry => entry.topic === normalizedTopic) || null;
        },
        getLessons({ classlevel, subject, semester, topic } = {}) {
            return this.getTopicEntry({ classlevel, subject, semester, topic })?.lessons || [];
        },
        getAllLessons({ classlevel, subject, semester, topics } = {}) {
            const topicSet = Array.isArray(topics) && topics.length ? new Set(topics) : null;
            return this.getTopicEntries({ classlevel, subject, semester })
                .filter(entry => !topicSet || topicSet.has(entry.topic))
                .flatMap(entry => entry.lessons);
        },
        findLesson(id) {
            const target = String(id ?? '').trim();
            if (!target) return null;
            for (const semester of ['hk1', 'hk2']) {
                const entries = getCatalog()['4']?.math?.[semester] || [];
                for (const entry of entries) {
                    const lesson = entry.lessons.find(item => item.id === target);
                    if (lesson) return lesson;
                }
            }
            return null;
        },
        getLessonContext(id) {
            const target = String(id ?? '').trim();
            if (!target) return null;
            for (const semester of ['hk1', 'hk2']) {
                const entries = getCatalog()['4']?.math?.[semester] || [];
                for (const entry of entries) {
                    const lesson = entry.lessons.find(item => item.id === target);
                    if (lesson) return { semester, topic: entry.topic, lesson };
                }
            }
            return null;
        },
        getLessonLabel(id) {
            return this.findLesson(id)?.label || '';
        },
        isLessonValid({ classlevel, subject, semester, topic, lesson } = {}) {
            if (!lesson) return true;
            return this.getLessons({ classlevel, subject, semester, topic }).some(item => item.id === lesson);
        }
    };

    root.app.curriculum = curriculum;
})(typeof globalThis !== 'undefined' ? globalThis : this);
