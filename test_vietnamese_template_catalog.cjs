const assert = require('node:assert/strict');

globalThis.app = {};
require('./src/modules/constants.js');
require('./src/question-templates/grade-4/vietnamese/index.js');

const templates = globalThis.Grade4VietnameseTemplates.getDefaultTemplates();
assert.equal(templates.length, 62, 'Every Grade 4 Vietnamese lesson must have a built-in template record.');
assert.ok(templates.every(template => template.lesson && template.generator_key === 'vietnamese.lesson_activity_quiz'));

const sample = globalThis.Grade4VietnameseTemplates.generateQuestion(
  'vietnamese.lesson_activity_quiz', { lesson: 'g4-vietnamese-hk1-b01' }
);
assert.equal(sample.lesson, 'g4-vietnamese-hk1-b01');
assert.equal(sample.topic, '1. Mỗi người một vẻ');
assert.equal(sample.ans, 'Luyện từ và câu: Danh từ');
assert.equal(sample.options.length, 4);

console.log('Grade 4 Vietnamese template catalog verified.');
