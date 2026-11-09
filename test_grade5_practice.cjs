const assert = require('node:assert/strict');
require('./src/modules/constants.js');
require('./src/modules/curriculum.js');
require('./src/modules/learning-path.js');
require('./src/question-templates/grade-5/math.js');
require('./src/question-templates/grade-5/vietnamese.js');
require('./src/question-templates/grade-5/index.js');

const { curriculum, learningPath } = globalThis.app;
const registry = globalThis.Grade5PracticeTemplates;
const math = learningPath.getEntries({ classlevel: '5', subject: 'math' });
const vietnamese = learningPath.getEntries({ classlevel: '5', subject: 'vietnamese' });
assert.equal(math.length, 75);
assert.equal(vietnamese.length, 66);
assert.equal(curriculum.getLessonContext('g5-math-hk2-b64').lesson.page, 90);
assert.equal(curriculum.getLessonContext('g5-vietnamese-hk2-b13').lesson.page, 61);

const templates = registry.getDefaultTemplates();
for (const lesson of [...math, ...vietnamese]) {
    const scoped = templates.filter(template => template.lesson === lesson.id);
    assert.ok(scoped.length, lesson.id);
    const prompts = new Set();
    for (const template of scoped) {
        assert.ok(curriculum.isLessonValid(template));
        const samples = registry.getQuestionVariants(template.generator_key, template.config);
        for (const question of samples) {
            assert.equal(question.lesson, lesson.id);
            assert.ok(question.q && question.explanation && question.source.page > 0);
            assert.ok(question.options.includes(question.ans), question.q);
            assert.equal(new Set(question.options).size, question.options.length, question.q);
            prompts.add(question.q);
        }
    }
    assert.ok(prompts.size >= 10, `${lesson.id}: ${prompts.size} câu khác nhau`);
}
assert.throws(() => registry.generateQuestion(templates[0].generator_key, { lesson: 'g5-math-hk2-b64' }));
console.log('Grade 5 lesson mapping and practice variants verified.');


const fs = require('node:fs');
const migration = fs.readFileSync(require('node:path').join(__dirname, 'supabase/migrations/20261109131049_question_templates_grade5.sql'), 'utf8');
const rows = JSON.parse(migration.split('$grade5$')[1]);
const ids = new Set(rows.map(row => row.id));
assert.equal(ids.size, 250);
assert.equal(rows.length, templates.length);
for (const [index, row] of rows.entries()) {
    const { id, is_active, ...expected } = templates[index];
    const { id: seedId, ...actual } = row;
    assert.match(seedId, /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.ok(actual.name.length <= 120, actual.name);
    assert.deepEqual(actual, expected);
}
console.log('Supabase seed metadata matches all 250 Grade 5 templates.');
