// Manifest và validator cho đợt gắn Bài học Phase 1.
// Chỉ chứa các record hiện có đã được duyệt để gắn trực tiếp; không seed nội dung mới.
;(function (root) {
    if (!root.app) root.app = {};

    const TOPIC_1 = '1. Ôn tập và bổ sung';
    const TOPIC_2 = '2. Góc và đơn vị đo góc';
    const TOPIC_3 = '3. Số có nhiều chữ số';
    const TOPIC_4 = '4. Một số đơn vị đo Đại lượng';
    const TOPIC_5 = '5. Phép cộng và phép trừ';

    const entry = (lesson, topic) => Object.freeze({ lesson, topic, status: 'direct' });

    const PHASE1_DIRECT_LESSON_MAPPING = Object.freeze({
        '981d1ac3-06f5-438e-8b7a-3410cc63d469': entry('g4-math-hk1-b02', TOPIC_1),
        '2e12c19b-efc3-4ab8-ae6e-7d5ad120a4bb': entry('g4-math-hk1-b02', TOPIC_1),
        '2f653ca5-893c-4cdb-9efe-f0995f450fed': entry('g4-math-hk1-b02', TOPIC_1),
        '5fa3511a-2cb6-4f96-a7ea-7d2173edafe7': entry('g4-math-hk1-b01', TOPIC_1),
        '675644ba-d1ae-40c8-ad36-42a7bf1e9b51': entry('g4-math-hk1-b01', TOPIC_1),
        'a7b8d959-c1c9-4a1a-9bc3-b32cd1b61768': entry('g4-math-hk1-b01', TOPIC_1),
        'c5d1d03c-d539-433d-97b6-fee5074722aa': entry('g4-math-hk1-b01', TOPIC_1),
        '2a9f2d2b-eea0-44bd-a8e4-c34819bd58c5': entry('g4-math-hk1-b01', TOPIC_1),
        '5eebc531-e3c0-4b6e-97e5-0c983d2a9f75': entry('g4-math-hk1-b02', TOPIC_1),
        'c2d25199-ddd2-4e0e-84fe-f5d856d71633': entry('g4-math-hk1-b01', TOPIC_1),
        '0cb830c2-3de6-4805-a2e6-19bcd9f1b744': entry('g4-math-hk1-b01', TOPIC_1),
        '93fb31c9-2ef5-421e-a875-8aae79142e4e': entry('g4-math-hk1-b01', TOPIC_1),
        '992f7665-69bd-483e-a993-129e9b26e6da': entry('g4-math-hk1-b08', TOPIC_2),
        '1345aec4-4ad7-47a9-b918-39f8041375cc': entry('g4-math-hk1-b08', TOPIC_2),
        'e9e4f81c-f720-4896-b3f3-eb904dc24397': entry('g4-math-hk1-b08', TOPIC_2),
        '73ec2ba0-1c79-4ba1-b09d-7f31d038f483': entry('g4-math-hk1-b08', TOPIC_2),
        '0a40ee0c-0533-4096-bedd-bdfdba450d31': entry('g4-math-hk1-b15', TOPIC_3),
        'e58c943b-0262-4244-b87f-2cc9ff29213b': entry('g4-math-hk1-b21', TOPIC_4),
        'b01bea2a-f00d-427a-887a-95ae0cc3e7ba': entry('g4-math-hk1-b18', TOPIC_4),
        'c57e591c-f22d-485f-b7a3-696f987527cd': entry('g4-math-hk1-b17', TOPIC_4),
        'a393807c-04d0-4660-b613-8faa6159e5ac': entry('g4-math-hk1-b21', TOPIC_4),
        'cf3883b2-84a1-4f92-80ac-770986c03ba6': entry('g4-math-hk1-b21', TOPIC_4),
        '7ed9036c-0cb2-4996-bad7-3329fa96de4b': entry('g4-math-hk1-b21', TOPIC_4),
        '33b98f95-d635-4be8-9d31-9553ece2302c': entry('g4-math-hk1-b19', TOPIC_4),
        'f3c1e507-ea8c-40a0-9b71-2657155e0996': entry('g4-math-hk1-b24', TOPIC_5),
        '0f50b5cd-9cdf-4cb3-932d-6be5c0e4ae78': entry('g4-math-hk1-b25', TOPIC_5),
        'dd1fcecf-bd83-41f0-8e24-ede5167d1542': entry('g4-math-hk1-b25', TOPIC_5),
        '8fc628b5-ee24-4db2-928d-a6b536495362': entry('g4-math-hk1-b26', TOPIC_5)
    });

    const normalize = value => String(value ?? '').trim().normalize('NFC');
    const normalized = value => normalize(value).toLocaleLowerCase('vi-VN').replace(/\s+/g, ' ');
    const canonicalTopic = value => {
        const topic = normalize(value);
        if (normalized(topic) === '1. số tự nhiên') return TOPIC_1;
        return topic;
    };

    const lessonContextOf = lessonId => {
        const curriculum = root.app.curriculum;
        if (!curriculum || typeof curriculum.getLessonContext !== 'function') return null;
        return curriculum.getLessonContext(lessonId);
    };

    const lessonIdOf = (value, template) => {
        const rawLesson = normalize(value);
        if (!rawLesson) return '';
        const curriculum = root.app.curriculum;
        if (!curriculum || typeof curriculum.getTemplateLesson !== 'function') return rawLesson;
        return normalize(curriculum.getTemplateLesson({ ...template, lesson: rawLesson }) || rawLesson);
    };

    const validateTemplateMetadata = (template = {}) => {
        const issues = [];
        const classlevel = normalize(template.classlevel);
        const subject = normalized(template.subject);
        const semester = normalized(template.semester);
        const topic = canonicalTopic(template.topic);
        const lesson = lessonIdOf(template.lesson || template.config?.lesson, template);
        const mapping = PHASE1_DIRECT_LESSON_MAPPING[normalize(template.id)];

        if (classlevel !== 'Lớp 4') issues.push('unsupported_classlevel');
        if (subject !== 'toán') issues.push('unsupported_subject');
        if (semester !== 'học kỳ 1') issues.push('unsupported_semester');
        if (!topic) issues.push('missing_topic');
        if (!normalize(template.generator_key)) issues.push('missing_generator_key');
        if (!lesson) issues.push('missing_lesson');

        if (mapping) {
            if (lesson !== mapping.lesson) issues.push('phase1_mapping_mismatch');
            if (canonicalTopic(mapping.topic) !== topic && topic) issues.push('topic_mismatch');
        }

        if (lesson) {
            const context = lessonContextOf(lesson);
            if (!context) {
                issues.push('invalid_lesson');
            } else {
                if (context.semester !== 'hk1') issues.push('lesson_semester_mismatch');
                if (canonicalTopic(context.topic) !== topic && topic) issues.push('topic_mismatch');
            }
        }

        return {
            valid: issues.length === 0,
            issues: [...new Set(issues)],
            lesson,
            topic
        };
    };

    const api = Object.freeze({
        PHASE1_DIRECT_LESSON_MAPPING,
        validateTemplateMetadata,
        canonicalTopic
    });

    root.app.templateManifest = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
