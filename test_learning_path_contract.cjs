const assert = require('node:assert/strict');

globalThis.app = {};
require('./src/modules/constants.js');
require('./src/modules/curriculum.js');
require('./src/modules/learning-path.js');

const learningPath = globalThis.app.learningPath;
assert.ok(learningPath, 'learningPath module must be available.');

const grade4Math = learningPath.getEntries({ classlevel: '4', subject: 'math' });
assert.equal(grade4Math.length, 73, 'Grade 4 Math must expose all catalog lessons in order.');
assert.equal(grade4Math[0].id, 'g4-math-hk1-b01');
assert.equal(grade4Math[0].kind, 'lesson');
assert.equal(grade4Math[0].topic, '1. Ôn tập và bổ sung');
assert.equal(grade4Math.at(-1).id, 'g4-math-hk2-b73');

const releaseSettings = {
  lessonReleaseByClass: {
    '4': { math: 'g4-math-hk1-b03' }
  }
};
const release = learningPath.getReleaseBoundary({
  settings: releaseSettings,
  classlevel: '4',
  subject: 'math'
});
assert.equal(release?.id, 'g4-math-hk1-b03');

const safeDefaultStates = learningPath.getProgressStates({
  entries: grade4Math.slice(0, 3),
  history: []
});
assert.deepEqual(safeDefaultStates.map(item => item.state), ['current', 'locked', 'locked']);

const states = learningPath.getProgressStates({
  entries: grade4Math.slice(0, 5),
  releaseId: 'g4-math-hk1-b03',
  history: [{
    subject: 'Toán', classlevel: '4', lesson: 'g4-math-hk1-b01', score: 10, questionCount: 10
  }]
});
assert.deepEqual(states.map(item => item.state), ['completed', 'current', 'available', 'locked', 'locked']);
assert.equal(learningPath.getRecommendedEntry(states)?.id, 'g4-math-hk1-b02');

const grade5Vietnamese = learningPath.getEntries({ classlevel: '5', subject: 'vietnamese' });
assert.equal(grade5Vietnamese[0].kind, 'topic', 'Unsupported curricula must fall back to topics, not invented lessons.');
assert.equal(grade5Vietnamese[0].synthetic, true);
const subjectSafeStates = learningPath.getProgressStates({
  entries: grade5Vietnamese.slice(0, 1),
  subject: 'vietnamese',
  classlevel: '5',
  history: [{ subject: 'Toán', classlevel: '5', topic: grade5Vietnamese[0].topic, score: 10, questionCount: 10 }]
});
assert.equal(subjectSafeStates[0].state, 'current', 'Progress from another subject must not complete this topic.');

console.log('Learning path contract verified.');
