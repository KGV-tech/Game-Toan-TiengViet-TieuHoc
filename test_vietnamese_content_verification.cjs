const assert = require('node:assert/strict');
globalThis.app = {};
require('./src/modules/constants.js');
require('./src/question-templates/grade-4/vietnamese/content.js');
require('./src/question-templates/grade-4/vietnamese/verification.js');
require('./src/question-templates/grade-4/vietnamese/reviewed-content.js');
const verifier = globalThis.VietnameseContentVerification;
const entries = globalThis.VietnamesePracticeContent.allItems();
for (const entry of entries) {
  assert.ok(['textbook-context', 'textbook-glossary'].includes(entry.evidence.kind), `${entry.id}: rule-only evidence cannot publish`);
  assert.ok(entry.evidence.excerpt?.length > 10, `${entry.id}: missing contextual source`);
  assert.deepEqual(Object.keys(entry.evidence.optionReasons).sort(), [...entry.options].sort());
  assert.equal(verifier.check(entry, entry.introducedAt), '', entry.id);
  assert.notEqual(verifier.check({ ...entry, answer: 'đáp án bị sửa' }, 32), '');
  assert.notEqual(verifier.check({ ...entry, prompt: entry.prompt + ' sai' }, 32), '');
  assert.notEqual(verifier.check({ ...entry, options: [...entry.options, 'từ chưa kiểm chứng'] }, 32), '');
  assert.notEqual(verifier.check({ ...entry, explanation: 'Giải thích chưa kiểm chứng' }, 32), '');
  assert.notEqual(verifier.check({ ...entry, evidence: { ...entry.evidence, pages: [1] } }, 32), '');
  assert.notEqual(verifier.check({ ...entry, options: null }, 32), '');
  if (entry.introducedAt > 1) assert.notEqual(verifier.check(entry, entry.introducedAt - 1), '');
}
assert.notEqual(verifier.check({ ...entries[0], id: 'unknown' }, 32), '');
const savedReview = globalThis.VietnameseReviewedContent;
for (const review of [{ ...savedReview[entries[0].id], status: 'pending' }, { ...savedReview[entries[0].id], scopes: ['curriculum'] }]) {
  globalThis.VietnameseReviewedContent = { [entries[0].id]: review };
  assert.notEqual(verifier.check(entries[0], 32), '');
}
globalThis.VietnameseReviewedContent = savedReview;
const glossary = entries.filter(e => e.id.startsWith('meaning-'));
assert.equal(glossary.find(e => e.id === 'meaning-1').answer, 'Nhịp điệu của âm nhạc');
assert.equal(glossary.find(e => e.id === 'meaning-6').introducedAt, 21);
assert.equal(globalThis.VietnamesePracticeContent.getItems('word_meaning', 1).items.length, 0);
assert.equal(globalThis.VietnamesePracticeContent.getItems('word_meaning', 2).items.length, 4);
assert.ok(globalThis.VietnamesePracticeContent.getItems('word_type', 9).items.every(e => !['nhớ', 'yêu'].includes(e.answer)));
console.log(`Verified ${entries.length} contextual records: locked source evidence, wording, options, explanations and lesson gates.`);
