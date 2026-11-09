const assert = require('node:assert/strict');
require('./src/question-templates/grade-1/catalog');
require('./src/question-templates/grade-1/math');
require('./src/question-templates/grade-1/vietnamese');
require('./src/question-templates/grade-1/index');
require('./src/modules/constants');
require('./src/modules/curriculum');

const { curriculum } = globalThis.app;
const templates = globalThis.Grade1PracticeTemplates;
for (const [subject, semester, count] of [
    ['math', 'hk1', 20], ['math', 'hk2', 21],
    ['vietnamese', 'hk1', 0], ['vietnamese', 'hk2', 56]
]) {
    const lessons = curriculum.getAllLessons({ classlevel: '1', subject, semester });
    assert.equal(lessons.length, count);
    for (const lesson of lessons) {
        const context = curriculum.getLessonContext(lesson.id);
        assert.equal(context.topic, curriculum.getTopicEntries({ classlevel: 1, subject, semester }).find(entry => entry.lessons.includes(lesson)).topic);
        const questions = templates.getPracticeQuestions({ subject, topics: [context.topic], lesson: lesson.id });
        assert.ok(new Set(questions.map(q => q.q)).size >= 10, lesson.id);
        for (const q of questions) {
            assert.equal(q.lesson, lesson.id);
            assert.equal(q.classlevel, 'Lớp 1');
            assert.equal(q.topic, context.topic);
            assert.equal(q.semester, semester === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2');
            assert.ok(q.source.page > 0 && q.explanation);
            if (q.type === 'Trắc nghiệm') {
                assert.equal(new Set(q.options).size, q.options.length);
                assert.ok(q.options.includes(q.ans));
            } else {
                assert.equal(q.type, 'Điền khuyết');
                assert.ok(q.ans);
            }
        }
        assert.deepEqual(templates.getPracticeQuestions({ subject, topics: ['Khác'], lesson: lesson.id }), []);
    }
}
assert.equal(curriculum.getLessonLabel('g1-math-hk2-b34'), 'Bài 34. Xem giờ đúng trên đồng hồ');
assert.equal(curriculum.getLessonLabel('g1-vietnamese-hk2-c08-b04'), 'Bài 4. Ruộng bậc thang ở Sa Pa');


// Đáp án mẫu, phạm vi toán học và các phương án nhiễu.
function questionsFor(id, random) {
    const { subject, topic } = curriculum.getLessonContext(id);
    return templates.getPracticeQuestions({ subject, topics: [topic], lesson: id }, random);
}
const first = questionsFor('g1-math-hk1-b01');
assert.equal(first.find(q => q.q.includes('【　】')).ans, '0');
assert.ok(first.every(q => Number(q.ans) <= 5));
for (const number of [29, 30, 31, 32]) {
    const questions = questionsFor(`g1-math-hk2-b${number}`);
    for (const question of questions.filter(q => q.q.startsWith('Tính.'))) {
        const [, a, symbol, b] = question.q.match(/(\d+) ([+−]) (\d+) =/);
        assert.equal(a.length, 2);
        assert.equal(b.length, number % 2 ? 1 : 2);
        const sum = symbol === '+';
        assert.equal(sum, number < 31);
        assert.ok(sum ? (+a % 10) + (+b % 10) < 10 : (+a % 10) >= (+b % 10));
        assert.equal(Number(question.ans), sum ? +a + +b : +a - +b);
    }
}
const clock = questionsFor('g1-math-hk2-b34');
assert.equal(clock.find(q => q.q.includes('M64 64 L64 89')).ans, '6 giờ');
const reading = questionsFor('g1-vietnamese-hk2-c01-b01', () => 0);
assert.equal(reading.find(q => q.q.endsWith('<b>Nam học lớp mấy?</b>')).ans, 'lớp 1');
assert.notDeepEqual(reading[0].options, questionsFor('g1-vietnamese-hk2-c01-b01', () => 0.999)[0].options);
assert.ok(questionsFor('g1-vietnamese-hk2-c01-review').every(q => q.source.contentPage < q.source.page));


const { readFileSync } = require('node:fs');
const defaults = templates.getDefaultTemplates();
assert.equal(defaults.length, 337);
assert.equal(new Set(defaults.map(item => item.lesson)).size, 97);
assert.equal(new Set(defaults.map(item => item.lesson + ':' + item.generator_key)).size, defaults.length);
const sql = readFileSync(require('node:path').join(__dirname, 'supabase/migrations/20261109130956_grade1_practice_templates.sql'), 'utf8');
const quoted = value => "'" + value.replaceAll("'", "''") + "'";
const seedRows = sql.split('\n').filter(line => /^        \('g1-/.test(line)).map(line => line.trim().replace(/,$/, ''));
assert.deepEqual(seedRows, defaults.map(row => '(' + [
    row.lesson, row.generator_key, row.name, row.subject, row.semester, row.topic, row.question_type
].map(quoted).join(', ') + ')'));
for (const template of defaults) {
    const question = templates.generateTemplateQuestion(template, () => 0);
    assert.ok(question, template.generator_key + ' ' + template.lesson);
    assert.equal(question.templateId, template.generator_key);
    assert.equal(question.type, template.question_type);
    assert.equal(question.lesson, template.lesson);
}
const sample = defaults[0];
assert.equal(templates.generateTemplateQuestion({ ...sample, is_active: false }), null);
assert.equal(templates.generateTemplateQuestion({ ...sample, topic: 'Sai chủ đề' }), null);
assert.equal(templates.generateTemplateQuestion({ ...sample, classlevel: 'Lớp 4' }), null);
const scoped = { subject: 'math', topics: [sample.topic], lesson: sample.lesson };
const active = templates.getPracticeQuestions({ ...scoped, savedTemplates: [sample] });
assert.equal(active.length, templates.getPracticeQuestions(scoped).length);
const disabled = templates.getPracticeQuestions({ ...scoped, savedTemplates: [{ ...sample, is_active: false }] });
assert.ok(active.some(question => question.templateId === sample.generator_key));
assert.ok(disabled.length && disabled.every(question => question.templateId !== sample.generator_key));
console.log('Grade 1 practice catalog, question and Supabase seed contracts passed');
