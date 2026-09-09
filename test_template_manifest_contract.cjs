const assert = require('node:assert/strict');
const fs = require('node:fs');

globalThis.app = {};
require('./src/modules/constants.js');
require('./src/modules/curriculum.js');
const manifest = require('./src/modules/template-manifest.js');

const expectedLessonByTemplateId = {
  '981d1ac3-06f5-438e-8b7a-3410cc63d469': 'g4-math-hk1-b02',
  '2e12c19b-efc3-4ab8-ae6e-7d5ad120a4bb': 'g4-math-hk1-b02',
  '2f653ca5-893c-4cdb-9efe-f0995f450fed': 'g4-math-hk1-b02',
  '5fa3511a-2cb6-4f96-a7ea-7d2173edafe7': 'g4-math-hk1-b01',
  '675644ba-d1ae-40c8-ad36-42a7bf1e9b51': 'g4-math-hk1-b01',
  'a7b8d959-c1c9-4a1a-9bc3-b32cd1b61768': 'g4-math-hk1-b01',
  'c5d1d03c-d539-433d-97b6-fee5074722aa': 'g4-math-hk1-b01',
  '2a9f2d2b-eea0-44bd-a8e4-c34819bd58c5': 'g4-math-hk1-b01',
  '5eebc531-e3c0-4b6e-97e5-0c983d2a9f75': 'g4-math-hk1-b02',
  'c2d25199-ddd2-4e0e-84fe-f5d856d71633': 'g4-math-hk1-b01',
  '0cb830c2-3de6-4805-a2e6-19bcd9f1b744': 'g4-math-hk1-b01',
  '93fb31c9-2ef5-421e-a875-8aae79142e4e': 'g4-math-hk1-b01',
  '992f7665-69bd-483e-a993-129e9b26e6da': 'g4-math-hk1-b08',
  '1345aec4-4ad7-47a9-b918-39f8041375cc': 'g4-math-hk1-b08',
  'e9e4f81c-f720-4896-b3f3-eb904dc24397': 'g4-math-hk1-b08',
  '73ec2ba0-1c79-4ba1-b09d-7f31d038f483': 'g4-math-hk1-b08',
  '0a40ee0c-0533-4096-bedd-bdfdba450d31': 'g4-math-hk1-b15',
  'e58c943b-0262-4244-b87f-2cc9ff29213b': 'g4-math-hk1-b21',
  'b01bea2a-f00d-427a-887a-95ae0cc3e7ba': 'g4-math-hk1-b18',
  'c57e591c-f22d-485f-b7a3-696f987527cd': 'g4-math-hk1-b17',
  'a393807c-04d0-4660-b613-8faa6159e5ac': 'g4-math-hk1-b21',
  'cf3883b2-84a1-4f92-80ac-770986c03ba6': 'g4-math-hk1-b21',
  '7ed9036c-0cb2-4996-bad7-3329fa96de4b': 'g4-math-hk1-b21',
  '33b98f95-d635-4be8-9d31-9553ece2302c': 'g4-math-hk1-b19',
  'f3c1e507-ea8c-40a0-9b71-2657155e0996': 'g4-math-hk1-b24',
  '0f50b5cd-9cdf-4cb3-932d-6be5c0e4ae78': 'g4-math-hk1-b25',
  'dd1fcecf-bd83-41f0-8e24-ede5167d1542': 'g4-math-hk1-b25',
  '8fc628b5-ee24-4db2-928d-a6b536495362': 'g4-math-hk1-b26'
};

const actualLessonByTemplateId = Object.fromEntries(
  Object.entries(manifest.PHASE1_DIRECT_LESSON_MAPPING)
    .map(([id, entry]) => [id, entry.lesson])
);

assert.deepEqual(actualLessonByTemplateId, expectedLessonByTemplateId,
  'Phase 1 direct mapping must match the approved UUID-to-lesson table.');
assert.equal(Object.keys(actualLessonByTemplateId).length, 28,
  'Only the 28 directly assignable records belong in Phase 1.');
assert.ok(Object.values(actualLessonByTemplateId).every(id => id !== 'g4-math-hk1-b05'),
  'The deferred Bài 5 family must not be assigned in Phase 1.');

const valid = manifest.validateTemplateMetadata({
  id: '5fa3511a-2cb6-4f96-a7ea-7d2173edafe7',
  classlevel: 'Lớp 4',
  subject: 'Toán',
  semester: 'Học kỳ 1',
  topic: '1. Ôn tập và bổ sung',
  lesson: 'g4-math-hk1-b01',
  generator_key: 'number.missing_expanded_addend'
});
assert.equal(valid.valid, true, 'A mapped Template with matching metadata must validate.');

const legacyLabel = manifest.validateTemplateMetadata({
  classlevel: 'Lớp 4',
  subject: 'Toán',
  semester: 'Học kỳ 1',
  topic: '1. Ôn tập và bổ sung',
  lesson: 'Bài 1. Ôn tập các số đến 100 000',
  generator_key: 'number.missing_expanded_addend'
});
assert.equal(legacyLabel.valid, true,
  'The validator must accept an existing lesson label and normalize it to its catalog id.');
assert.equal(legacyLabel.lesson, 'g4-math-hk1-b01');

const wrongTopic = manifest.validateTemplateMetadata({
  id: '5fa3511a-2cb6-4f96-a7ea-7d2173edafe7',
  classlevel: 'Lớp 4',
  subject: 'Toán',
  semester: 'Học kỳ 1',
  topic: '3. Số có nhiều chữ số',
  lesson: 'g4-math-hk1-b01',
  generator_key: 'number.missing_expanded_addend'
});
assert.equal(wrongTopic.valid, false, 'A lesson from another topic must fail validation.');
assert.ok(wrongTopic.issues.includes('topic_mismatch'));

const missingLesson = manifest.validateTemplateMetadata({
  id: 'new-template',
  classlevel: 'Lớp 4',
  subject: 'Toán',
  semester: 'Học kỳ 1',
  topic: '1. Ôn tập và bổ sung',
  generator_key: 'number.missing_expanded_addend'
});
assert.equal(missingLesson.valid, false, 'A Phase 1 Template without lesson metadata must fail validation.');
assert.ok(missingLesson.issues.includes('missing_lesson'));

const migration = fs.readFileSync(
  'supabase/migrations/20260909_question_templates_phase1_lesson_mapping.sql',
  'utf8'
);
assert.match(migration, /ADD COLUMN IF NOT EXISTS lesson TEXT/);
assert.match(migration, /question_templates_lesson_idx/);
assert.match(migration, /WITH phase1_mapping\s*\(id, lesson\)/);
for (const [id, lesson] of Object.entries(expectedLessonByTemplateId)) {
  assert.match(migration, new RegExp(`'${id}'::uuid,\\s*'${lesson}'`),
    `The migration must keep the approved lesson paired with ${id}.`);
}

const deferredIds = [
  '008efb59-f1e9-4fbf-bb2a-5eb3e6f4cc5e',
  '27345061-c036-42b3-9693-3196623dc95b',
  '3df20abd-182a-42be-975d-6a33bf451515',
  '475cb396-a04e-40a5-9221-632612ec558b',
  '5406d38e-85a8-415f-ad7c-c028aab968fa',
  '5617107c-9fa0-4ed0-86e2-6d9206732926',
  '602aa6d9-1a22-42a8-a3c3-fc0b55e30326',
  '6c3d55a1-d276-4f00-a4b2-578235162243',
  '7fd969fd-ddb1-4926-a5f9-94cc45e4f754',
  'a5f9b495-42b6-4d92-84b7-e66b347f7471',
  'd8203d07-f645-479e-8d20-0930ca087550',
  'e30cc858-22e8-42fe-b63d-5118d07ade0c',
  '2beec1a2-63fa-4caa-8c37-79b466490b35',
  '5a30dfbf-7cc9-4c35-9fc8-5bb64b7cd742',
  'c9de8f63-cdab-422a-a52e-7af1001f8ab5',
  '188eda5d-8495-4a34-87dc-62eb3544baaa',
  '98ef2899-fc44-41ef-a600-79fff0379d21',
  '0a62edfa-5d1a-48ef-8496-9715d6b289a0'
];
for (const id of deferredIds) {
  assert.doesNotMatch(migration, new RegExp(id),
    `A deferred harden/split/replace record must not be updated in Phase 1: ${id}.`);
}
assert.doesNotMatch(migration, /g4-math-hk1-b05/,
  'The Phase 1 SQL must not create or assign the deferred Bài 5 family.');
assert.doesNotMatch(migration, /\b(INSERT|DELETE)\s+INTO\b/i,
  'Phase 1 must only update approved existing records.');
assert.doesNotMatch(migration, /CREATE POLICY|DROP POLICY|GRANT |REVOKE /,
  'Phase 1 must not alter RLS or table permissions.');

const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.match(indexHtml, /src\/modules\/template-manifest\.js/,
  'The browser must expose the Phase 1 manifest for Admin authoring validation.');

console.log('Phase 1 template manifest and mapping contract verified.');
