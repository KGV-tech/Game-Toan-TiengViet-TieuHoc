'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  createAuditAdminDataset,
  createStudentFixture,
  createQuestFixture
} = require('./tests/e2e/audit-fixtures.cjs');

const dataset = createAuditAdminDataset();
const adminFunction = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');

assert.equal(dataset.currentUser.role, 'admin');
assert.equal(dataset.currentUser.fullname, 'Giáo viên Demo');
assert.equal(dataset.currentUser.name, undefined);
assert.ok(Array.isArray(dataset.users) && dataset.users.length >= 2);
assert.ok(Array.isArray(dataset.libraryQuestions) && dataset.libraryQuestions.length > 0);
assert.ok(Array.isArray(dataset.questionTemplates) && dataset.questionTemplates.length > 0);
assert.ok(Array.isArray(dataset.exams) && dataset.exams.length > 0);
assert.ok(Array.isArray(dataset.quests) && dataset.quests.length > 0);

for (const student of dataset.users) {
  for (const field of ['username', 'fullname', 'role', 'classlevel', 'class_name', 'gender', 'avatar_key', 'approved']) {
    assert.notEqual(student[field], undefined, `fixture học sinh thiếu ${field}`);
  }
}

for (const question of dataset.libraryQuestions) {
  for (const field of ['classlevel', 'subject', 'semester', 'topic', 'type', 'q', 'options', 'ans']) {
    assert.notEqual(question[field], undefined, `fixture câu hỏi thiếu ${field}`);
  }
}

for (const quest of dataset.quests) {
  for (const field of ['title', 'target_subject', 'target_score', 'target_count', 'reward_stars', 'assign_type', 'assign_target', 'target_classlevel', 'start_at', 'end_at', 'is_active']) {
    assert.notEqual(quest[field], undefined, `fixture nhiệm vụ thiếu ${field}`);
  }
}

assert.equal(createStudentFixture({ class_name: '' }).class_name, '');
assert.deepEqual(createQuestFixture({ target_classlevel: '4' }).target_classlevel, '4');
assert.match(adminFunction, /classNameForLevelExists/, 'Admin profile writes must validate class names against the roster.');
assert.match(adminFunction, /class_lookup_failed/, 'Admin profile writes must report roster lookup failures instead of bypassing validation.');

console.log('Step 4 data fixture contract: OK');
