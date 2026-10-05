const assert = require('node:assert/strict');
globalThis.app = {};
require('./src/modules/constants.js');
require('./src/question-templates/grade-4/vietnamese/content.js');
require('./src/question-templates/grade-4/vietnamese/verification.js');
require('./src/question-templates/grade-4/vietnamese/reviewed-content.js');
require('./src/question-templates/grade-4/vietnamese/index.js');
const bank = globalThis.VietnamesePracticeContent;
const registry = globalThis.Grade4VietnameseTemplates;

// Two real reviewed passages must produce two pairs, never a mixed-context pair.
const sample = bank.allItems().filter(item => ['noun-1', 'noun-2', 'character-1', 'character-2'].includes(item.id));
globalThis.VietnamesePracticeContent = { ...bank, getItems: () => ({ items: sample, passage: sample[0].passage }) };
const config = { lesson: 'g4-vietnamese-hk1-b02' };
const sampleVariants = registry.getQuestionVariants('vietnamese.reading_detail', config);
assert.equal(sampleVariants.length, 2, 'Only pairs sharing an identical reviewed passage may be combined.');
for (const q of sampleVariants) {
  assert.equal(registry.validateQuestion(q), '');
  assert.ok(q.subquestions.every(part => part.passage === q.passage));
}
for (const random of [() => 0, () => 0.5, () => 0.99]) {
  const q = registry.generateQuestion('vietnamese.reading_detail', config, random);
  assert.equal(registry.validateQuestion(q), '');
}
globalThis.VietnamesePracticeContent = { ...bank, getItems: () => ({ items: [sample[0], sample[2]] }) };
assert.throws(() => registry.generateQuestion('vietnamese.reading_detail', config), /Chưa đủ/);
globalThis.VietnamesePracticeContent = bank;

const entries = bank.allItems();
const additions = entries.filter(item => item.id.startsWith('e60-'));
assert.equal(entries.length, 93);
assert.equal(additions.length, 60, 'Add sixty content records, not shuffled combinations.');
assert.equal(new Set(entries.map(item => item.id)).size, entries.length);
for (const key of registry.definitions.map(definition => definition.key)) {
  assert.equal(additions.filter(item => item.id.startsWith(`e60-${key}-`)).length, 6, key);
}
for (const item of additions) {
  assert.equal(VietnameseContentVerification.check(item, item.introducedAt), '', item.id);
  if (item.introducedAt > 1) assert.notEqual(VietnameseContentVerification.check(item, item.introducedAt - 1), '');
}
// Every new item must actually be playable with a compatible partner at release.
for (const item of additions) {
  const key = registry.definitions.find(definition => item.id.startsWith(`e60-${definition.key}-`)).key;
  const qConfig = { lesson: `g4-vietnamese-hk1-b${String(item.introducedAt).padStart(2, '0')}` };
  const variants = registry.getQuestionVariants(`vietnamese.${key}`, qConfig);
  assert.ok(variants.some(q => q.subquestions.some(part => part.id === item.id)), item.id);
  for (const q of variants) assert.equal(registry.validateQuestion(q), '', item.id);
}
const contextualSkills = ['reading_detail', 'character_detail', 'topic_sentence'];
for (const key of contextualSkills) {
  const items = bank.getItems(key, 32).items;
  assert.ok(new Set(items.map(item => item.passage)).size >= 4, `${key}: need new texts, not only more permutations`);
}
console.log('Vietnamese expansion: sixty additions, ten skills, source gates and compatible passages.');
