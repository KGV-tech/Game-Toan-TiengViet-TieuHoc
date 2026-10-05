const assert = require('node:assert/strict');
globalThis.app = {};
require('./src/modules/constants.js');
require('./src/question-templates/grade-4/vietnamese/content.js');
require('./src/question-templates/grade-4/vietnamese/verification.js');
require('./src/question-templates/grade-4/vietnamese/reviewed-content.js');
require('./src/question-templates/grade-4/vietnamese/index.js');
const registry = globalThis.Grade4VietnameseTemplates;
const templates = registry.getDefaultTemplates();
assert.equal(registry.templateIds.length, 10, 'Ten skill templates replace the activity-name quiz.');
assert.equal(new Set(templates.map(t => t.lesson)).size, 32);
assert.ok(templates.every(t => t.semester === 'Học kỳ 1'));
assert.equal(new Set(templates.map(t => t.question_type)).size, 5);
for (const template of templates) {
  for (let i = 0; i < 8; i++) {
    const q = registry.generateQuestion(template.generator_key, { ...template.config, subquestionCount: 4 });
    assert.equal(q.subquestions.length, 2);
    assert.deepEqual(q.partAnswerCounts, [1, 1]);
    assert.equal(q.lesson, template.lesson);
    assert.equal(q.type, template.question_type);
    assert.equal(q.quickPractice, true);
    assert.equal(registry.validateQuestion(q), '');
    const changed = structuredClone(q);
    changed.subquestions[0].display = 'Ngữ cảnh chưa được duyệt';
    assert.notEqual(registry.validateQuestion(changed), '');
    assert.notEqual(q.subquestions[0].prompt, q.subquestions[1].prompt);
    for (const part of q.subquestions) {
      assert.equal(new Set(part.options).size, part.options.length);
      assert.equal(part.options.filter(o => o === part.answer).length, 1);
      assert.ok(part.explanation.length > 10);
    }
  }
}
for (const lesson of new Set(templates.map(t => t.lesson))) {
  const variants = templates.filter(t => t.lesson === lesson).flatMap(t => registry.getQuestionVariants(t.generator_key, t.config));
  assert.ok(variants.length >= 10, lesson);
  assert.equal(new Set(variants.map(q => q.subquestions.map(p => p.id).sort().join('|'))).size, variants.length);
  for (const q of variants) assert.equal(registry.validateQuestion(q), '');
}
assert.throws(() => registry.generateQuestion('vietnamese.personification', { lesson: 'g4-vietnamese-hk1-b01' }));
for (const field of ['sharedPrompt', 'imageUrl', 'hint', 'statements', 'instruction', 'title', 'svg']) {
  const changed = registry.generateQuestion('vietnamese.word_type', { lesson: 'g4-vietnamese-hk1-b01' });
  changed[field] = 'x" onerror="alert(1)';
  assert.notEqual(registry.validateQuestion(changed), '', `Unreviewed top-level field: ${field}`);
}
assert.throws(() => registry.generateQuestion('vietnamese.word_type', { lesson: 'g4-vietnamese-hk2-b01' }));
console.log('Vietnamese quick practice: ten skills, five interactions, HK1 coverage, exactly two parts verified.');
