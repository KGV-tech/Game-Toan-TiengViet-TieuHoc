const assert = require('node:assert/strict');

globalThis.app = {};
require('./src/modules/constants.js');
require('./src/modules/curriculum.js');

const catalog = globalThis.app.constants.lessonCatalog?.['4']?.math;
assert.ok(catalog, 'Grade 4 Math lesson catalog must be available.');
assert.deepEqual(Object.keys(catalog), ['hk1', 'hk2'], 'Catalog must be split by semester.');

const topicEntries = [...catalog.hk1, ...catalog.hk2];
assert.equal(topicEntries.length, 13, 'Grade 4 Math must have 13 topics.');
assert.equal(topicEntries.reduce((sum, entry) => sum + entry.lessons.length, 0), 73,
  'Grade 4 Math must have 73 lessons.');

const topicNames = topicEntries.map(entry => entry.topic);
assert.deepEqual(topicNames, [
  ...globalThis.app.constants.topics['4'].math.hk1,
  ...globalThis.app.constants.topics['4'].math.hk2
], 'Lesson catalog topics must match the existing topic constants.');

const lessons = topicEntries.flatMap(entry => entry.lessons);
assert.equal(lessons[0].label, 'Bài 1. Ôn tập các số đến 100 000');
assert.equal(lessons.at(-1).label, 'Bài 73. Ôn tập chung');
assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length,
  'Lesson ids must be unique.');
assert.ok(lessons.every(lesson => /^g4-math-hk[12]-b\d{2}$/.test(lesson.id)),
  'Lesson ids must be stable and semester-scoped.');

assert.equal(globalThis.app.curriculum.supportsLessons('Lớp 4', 'Toán'), true);
assert.equal(globalThis.app.curriculum.supportsLessons('4', 'math'), true);
assert.equal(globalThis.app.curriculum.supportsLessons('Lớp 4', 'Tiếng Việt'), true);
assert.equal(globalThis.app.curriculum.supportsLessons('Lớp 5', 'Toán'), false);

const topic = globalThis.app.constants.topics['4'].math.hk1[0];
assert.deepEqual(
  globalThis.app.curriculum.getLessons({ classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic }),
  catalog.hk1[0].lessons,
  'getLessons must return only the selected topic children.'
);
assert.equal(globalThis.app.curriculum.getLessons({ classlevel: 'Lớp 4', subject: 'Tiếng Việt', semester: 'Học kỳ 1', topic }).length, 0);
assert.equal(globalThis.app.curriculum.findLesson('g4-math-hk2-b73')?.label, 'Bài 73. Ôn tập chung');
assert.equal(globalThis.app.curriculum.findLesson('missing-lesson'), null);

const vietnameseCatalog = globalThis.app.constants.lessonCatalog?.['4']?.vietnamese;
assert.ok(vietnameseCatalog, 'Grade 4 Vietnamese lesson catalog must be available.');
assert.deepEqual(Object.keys(vietnameseCatalog), ['hk1', 'hk2'], 'Vietnamese catalog must be split by semester.');
const vietnameseLessons = [...vietnameseCatalog.hk1, ...vietnameseCatalog.hk2].flatMap(entry => entry.lessons);
assert.equal(vietnameseLessons.length, 62, 'Grade 4 Vietnamese must include 62 non-review lessons.');
assert.equal(vietnameseLessons[0]?.label, 'Bài 1. Điều kì diệu');
assert.equal(vietnameseLessons.at(-1)?.label, 'Bài 30. Ngày hội');
assert.ok(vietnameseLessons.every(lesson => /^g4-vietnamese-hk[12]-b\d{2}$/.test(lesson.id)),
  'Vietnamese lesson ids must be stable and semester-scoped.');
assert.ok(vietnameseLessons.every(lesson => Array.isArray(lesson.activities) && lesson.activities.length > 0),
  'Each Vietnamese lesson must preserve its learning activities.');
assert.equal(globalThis.app.curriculum.supportsLessons('Lớp 4', 'Tiếng Việt'), true);
assert.equal(
  globalThis.app.curriculum.getLessons({
    classlevel: 'Lớp 4', subject: 'Tiếng Việt', semester: 'Học kỳ 1', topic: '1. Mỗi người một vẻ'
  })[0]?.id,
  'g4-vietnamese-hk1-b01'
);
assert.equal(globalThis.app.curriculum.findLesson('g4-vietnamese-hk2-b30')?.label, 'Bài 30. Ngày hội');

console.log('Grade 4 Math lesson hierarchy contract verified.');

