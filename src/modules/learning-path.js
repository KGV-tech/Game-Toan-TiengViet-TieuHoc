// Lộ trình học sinh: dữ liệu thuần, không tự suy đoán Bài học khi danh mục
// chính thức chưa tồn tại cho khối/môn đó.
;(function (root) {
    if (!root.app) root.app = {};

    const normalizeClass = value => String(value ?? '').trim().replace(/^Lớp\s*/i, '').trim();
    const normalizeSubject = value => {
        const normalized = String(value ?? '').trim().normalize('NFC').toLocaleLowerCase('vi-VN');
        if (normalized === 'toán' || normalized === 'math' || normalized.includes('toán')) return 'math';
        if (normalized === 'tiếng việt' || normalized === 'vietnamese' || normalized.includes('tiếng việt')) return 'vietnamese';
        return '';
    };
    const semesterLabel = key => key === 'hk2' ? 'Học kỳ 2' : 'Học kỳ 1';
    const same = (left, right) => String(left ?? '').trim().normalize('NFC').toLocaleLowerCase('vi-VN')
        === String(right ?? '').trim().normalize('NFC').toLocaleLowerCase('vi-VN');
    const getTopics = (classlevel, subject) => root.app.constants?.topics?.[classlevel]?.[subject] || { hk1: [], hk2: [] };

    const getEntries = ({ classlevel, subject } = {}) => {
        const classNumber = normalizeClass(classlevel);
        const subjectKey = normalizeSubject(subject);
        if (!classNumber || !subjectKey) return [];

        if (root.app.curriculum?.supportsLessons(classNumber, subjectKey)) {
            let order = 0;
            return ['hk1', 'hk2'].flatMap(semester => (root.app.curriculum.getTopicEntries({
                classlevel: classNumber,
                subject: subjectKey,
                semester
            }) || []).flatMap(topicEntry => (topicEntry.lessons || []).map(lesson => ({
                ...lesson,
                kind: 'lesson',
                synthetic: false,
                topic: topicEntry.topic,
                semester,
                semesterLabel: semesterLabel(semester),
                order: order++
            }))));
        }

        let order = 0;
        const topics = getTopics(classNumber, subjectKey);
        return ['hk1', 'hk2'].flatMap(semester => (topics[semester] || []).map(topic => ({
            id: `topic-${classNumber}-${subjectKey}-${semester}-${order + 1}`,
            label: topic,
            topic,
            semester,
            semesterLabel: semesterLabel(semester),
            kind: 'topic',
            synthetic: true,
            order: order++
        })));
    };

    const getReleaseBoundary = ({ settings, classlevel, subject } = {}) => {
        const classNumber = normalizeClass(classlevel);
        const subjectKey = normalizeSubject(subject);
        const id = settings?.lessonReleaseByClass?.[classNumber]?.[subjectKey];
        if (!id) return null;
        return getEntries({ classlevel: classNumber, subject: subjectKey }).find(entry => entry.id === id) || null;
    };

    const roundMatchesEntry = (round, entry, context = {}) => {
        if (!round || !entry) return false;
        const expectedSubject = normalizeSubject(context.subject);
        const roundSubject = normalizeSubject(round.subject || round.title);
        if (expectedSubject && roundSubject && expectedSubject !== roundSubject) return false;
        const expectedClass = normalizeClass(context.classlevel);
        const roundClass = normalizeClass(round.classlevel);
        if (expectedClass && roundClass && expectedClass !== roundClass) return false;
        if (entry.kind === 'lesson') {
            const lessonIds = [round.lesson, ...(Array.isArray(round.lessons) ? round.lessons : [])].filter(Boolean);
            return lessonIds.some(id => same(id, entry.id));
        }
        return same(round.topic, entry.topic);
    };

    const isPerfectRound = round => {
        const questionCount = Number(round?.questionCount || round?.details?.length || 0);
        return Number(round?.score) === 10 && questionCount === 10;
    };

    const getProgressStates = ({ entries = [], releaseId = '', history = [], subject = '', classlevel = '' } = {}) => {
        const safeEntries = Array.isArray(entries) ? entries : [];
        const configuredReleaseIndex = releaseId ? safeEntries.findIndex(entry => entry.id === releaseId) : -1;
        const releaseIndex = configuredReleaseIndex >= 0
            ? configuredReleaseIndex
            : (safeEntries[0]?.kind === 'lesson' ? 0 : safeEntries.length - 1);
        const completed = new Set(safeEntries
            .filter(entry => (Array.isArray(history) ? history : []).some(round => roundMatchesEntry(round, entry, { subject, classlevel }) && isPerfectRound(round)))
            .map(entry => entry.id));
        const currentIndex = safeEntries.findIndex((entry, index) => index <= releaseIndex && !completed.has(entry.id));

        return safeEntries.map((entry, index) => {
            let state = 'available';
            if (index > releaseIndex) state = 'locked';
            else if (completed.has(entry.id)) state = 'completed';
            else if (index === currentIndex) state = 'current';
            return { ...entry, state };
        });
    };

    const getRecommendedEntry = states => {
        const safeStates = Array.isArray(states) ? states : [];
        return safeStates.find(entry => entry.state === 'current')
            || safeStates.find(entry => entry.state === 'available')
            || safeStates.filter(entry => entry.state === 'completed').at(-1)
            || null;
    };

    const getSummary = states => {
        const safeStates = Array.isArray(states) ? states : [];
        const released = safeStates.filter(entry => entry.state !== 'locked');
        return {
            total: safeStates.length,
            released: released.length,
            completed: released.filter(entry => entry.state === 'completed').length,
            current: getRecommendedEntry(safeStates)
        };
    };

    root.app.learningPath = {
        normalizeClass,
        normalizeSubject,
        getEntries,
        getReleaseBoundary,
        getProgressStates,
        getRecommendedEntry,
        getSummary,
        roundMatchesEntry,
        isPerfectRound
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
