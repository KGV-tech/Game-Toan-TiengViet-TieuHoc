// Danh mục phân cấp Chủ đề → Bài học, tách khỏi main.js để dùng được ở
// contract test và để các màn hình Admin dùng chung một luật tra cứu.
;(function (root) {
    if (!root.app) root.app = {};

    const classNumberOf = value => {
        const match = String(value ?? '').trim().match(/^(?:Lớp\s*)?([1-5])$/i);
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
    const normalizeText = value => String(value ?? '').trim().normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN');
    const templateTopicAliases = Object.freeze({
        '1. số tự nhiên': '1. Ôn tập và bổ sung'
    });
    const canonicalTemplateTopicOf = value => {
        const topic = String(value ?? '').trim().normalize('NFC').replace(/\s+/g, ' ');
        return templateTopicAliases[normalizeText(topic)] || topic;
    };

    // Các template đã tồn tại trước khi metadata Bài học được bổ sung không có
    // config.lesson. Suy luận các generator có nội dung rõ ràng và các nhóm
    // luyện tập chung; dữ liệu không xác định vẫn để trống (= Toàn chủ đề).
    const templateLessonRules = Object.freeze({
        hk1: Object.freeze({
            '1. Ôn tập và bổ sung': Object.freeze({
                'number.match_number_words': 'g4-math-hk1-b01',
                'number.digit_at_place': 'g4-math-hk1-b01',
                'number.smallest_of_four': 'g4-math-hk1-b01',
                'number.largest_of_four': 'g4-math-hk1-b01',
                'number.compose_from_places': 'g4-math-hk1-b01',
                'number.missing_expanded_addend': 'g4-math-hk1-b01',
                'number.neighbor_numbers': 'g4-math-hk1-b01',
                'number.compare_number_forms': 'g4-math-hk1-b01',
                'number.four_operations_fill_blanks': 'g4-math-hk1-b02',
                'number.four_operations_expressions': 'g4-math-hk1-b02',
                'number.four_arithmetic_blanks': 'g4-math-hk1-b02',
                'number.four_arithmetic_comparisons': 'g4-math-hk1-b02'
            }),
            '2. Góc và đơn vị đo góc': Object.freeze({
                'g4-m-angle-count-in-polygon': 'g4-math-hk1-b08',
                'g4-m-angle-drag-classify': 'g4-math-hk1-b08',
                'g4-m-angle-clock-classify': 'g4-math-hk1-b08',
                'g4-m-angle-count-eight-angles': 'g4-math-hk1-b08',
                'g4-m-angle-measure-read': 'g4-math-hk1-b07',
                'g4-m-angle-review': 'g4-math-hk1-b09'
            }),
            '3. Số có nhiều chữ số': Object.freeze({
                'number.six_digit_numbers': 'g4-math-hk1-b10',
                'number.digit_at_place': 'g4-math-hk1-b11',
                'number.safe_password_by_place_value': 'g4-math-hk1-b11',
                'number.compose_from_places': 'g4-math-hk1-b11',
                'number.missing_expanded_addend': 'g4-math-hk1-b11',
                'number.million_class': 'g4-math-hk1-b12',
                'number.round_hundred_thousands': 'g4-math-hk1-b13',
                'number.smallest_of_four': 'g4-math-hk1-b14',
                'number.largest_of_four': 'g4-math-hk1-b14',
                'number.compare_number_forms': 'g4-math-hk1-b14',
                'number.neighbor_numbers': 'g4-math-hk1-b15',
                'number.natural_sequence': 'g4-math-hk1-b15',
                'number.hk1_review_b10_b15': 'g4-math-hk1-b16',
                'number.place_value_true_false': 'g4-math-hk1-b11',
                'number.four_arithmetic_blanks': 'g4-math-hk1-b16',
                'number.four_arithmetic_comparisons': 'g4-math-hk1-b16'
            }),
            '4. Một số đơn vị đo Đại lượng': Object.freeze({
                'measurement.mass_unit_convert': 'g4-math-hk1-b17',
                'measurement.area_unit_convert': 'g4-math-hk1-b18',
                'measurement.time_unit_convert': 'g4-math-hk1-b19',
                'measurement.century_identification': 'g4-math-hk1-b19',
                'measurement.practice_cards': 'g4-math-hk1-b20',
                'measurement.hk1_review_b17_b20': 'g4-math-hk1-b21',
                'measurement.compare_units': 'g4-math-hk1-b21',
                'measurement.match_equivalences': 'g4-math-hk1-b21',
                'measurement.unit_true_false': 'g4-math-hk1-b21',
                'measurement.word_problem_units': 'g4-math-hk1-b21'
            }),
            '5. Phép cộng và phép trừ': Object.freeze({
                'g4-m-addition-property-fill': 'g4-math-hk1-b24',
                'g4-m-sum-difference-direct': 'g4-math-hk1-b25',
                'g4-m-sum-difference-context': 'g4-math-hk1-b25',
                'g4-m-add-sub-multi-digit': 'g4-math-hk1-b26',
                'g4-m-add-sub-word-problem': 'g4-math-hk1-b26',
                'g4-m-add-sub-missing-term': 'g4-math-hk1-b26',
                'g4-m-add-sub-missing-digit': 'g4-math-hk1-b26',
                'g4-m-add-sub-expression': 'g4-math-hk1-b26',
                'g4-m-add-sub-true-false': 'g4-math-hk1-b26',
                'number.hk1_review_b22_b25': 'g4-math-hk1-b26'
            })
        }),
        hk2: Object.freeze({})
    });

    const findLessonByValue = value => {
        const target = String(value ?? '').trim();
        if (!target) return null;
        const direct = findLessonById(target);
        if (direct) return direct;
        const normalizedTarget = normalizeText(target);
        for (const semester of ['hk1', 'hk2']) {
            const entries = getCatalog()['4']?.math?.[semester] || [];
            for (const entry of entries) {
                const lesson = entry.lessons.find(item => normalizeText(item.label) === normalizedTarget);
                if (lesson) return lesson;
            }
        }
        return null;
    };

    const findLessonById = id => {
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
    };

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
            return findLessonById(id);
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
        getTemplateLesson(template = {}) {
            const explicit = template?.lesson || template?.config?.lesson || '';
            if (explicit) return findLessonByValue(explicit)?.id || String(explicit).trim();
            if (!this.supportsLessons(template.classlevel, template.subject)) return '';

            const semester = semesterKeyOf(template.semester);
            const topic = canonicalTemplateTopicOf(template.topic);
            if (!semester || !this.getTopicEntry({ classlevel: template.classlevel, subject: template.subject, semester, topic })) return '';
            return templateLessonRules[semester]?.[topic]?.[String(template.generator_key || '').trim()] || '';
        },
        isLessonValid({ classlevel, subject, semester, topic, lesson } = {}) {
            if (!lesson) return true;
            return this.getLessons({ classlevel, subject, semester, topic }).some(item => item.id === lesson);
        }
    };

    root.app.curriculum = curriculum;
})(typeof globalThis !== 'undefined' ? globalThis : this);
