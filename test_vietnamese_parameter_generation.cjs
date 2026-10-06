const assert = require('node:assert/strict');
globalThis.app = {};
require('./src/modules/constants.js');
for (const file of ['content', 'verification', 'reviewed-content', 'parameter-corpus', 'parameter-engine', 'parameter-history', 'index']) require(`./src/question-templates/grade-4/vietnamese/${file}.js`);
const engine = globalThis.VietnameseParameterEngine;
const atoms = VietnameseParameterCorpus.atoms;
const history = VietnameseParameterHistory;
const previousQuestion = structuredClone(require('./tests/fixtures/vietnamese-parameter-wording-v1.json'));
assert.equal(Grade4VietnameseTemplates.validateQuestion(previousQuestion), '', 'Exact generated wording from the previous release remains valid.');
const previousAnswers = previousQuestion.subquestions.map(part => part.answer);
for (const subquestions of [{}, [null, null]]) {
    const malformed = { ...previousQuestion, subquestions };
    assert.doesNotThrow(() => Grade4VietnameseTemplates.updateQuestionWording(malformed));
    assert.equal(Grade4VietnameseTemplates.updateQuestionWording(malformed), malformed);
}
Grade4VietnameseTemplates.updateQuestionWording(previousQuestion);
assert.equal(Grade4VietnameseTemplates.validateQuestion(previousQuestion), '');
assert.deepEqual(previousQuestion.subquestions.map(part => part.answer), previousAnswers);
assert.doesNotMatch(JSON.stringify(previousQuestion), /ngữ liệu/i);
const editedPrevious = structuredClone(require('./tests/fixtures/vietnamese-parameter-wording-v1.json'));
editedPrevious.subquestions[0].prompt += ' Nội dung bị sửa';
assert.notEqual(Grade4VietnameseTemplates.validateQuestion(editedPrevious), '');
assert.ok(engine, 'Use parameter generation, not the fixed question bank.');
const config = { lesson: 'g4-vietnamese-hk1-b09' };
const first = engine.materialize('word_type', { pattern: 'sentence-class', actorId: 'human-0', actionId: 'verb-5', role: 'action' }, 9);
const next = engine.materialize('word_type', { pattern: 'sentence-class', actorId: 'human-1', actionId: 'verb-0', role: 'subject' }, 9);
assert.notEqual(first.prompt, next.prompt);
assert.equal(first.answer, 'Động từ');
assert.equal(next.answer, 'Danh từ');
assert.match(first.prompt, /Học sinh đang đi/);
assert.match(next.prompt, /Bố đang chạy/);
const explicit = Grade4VietnameseTemplates.generateQuestion('vietnamese.word_type', { ...config, parameters: [first.generation, next.generation] }, () => 0);
assert.equal(Grade4VietnameseTemplates.validateQuestion(explicit), '');
assert.deepEqual(new Set(explicit.subquestions.map(part => part.answer)), new Set(['Danh từ', 'Động từ']));
assert.throws(() => Grade4VietnameseTemplates.generateQuestion('vietnamese.word_type', { ...config, parameters: [first.generation, first.generation] }));
assert.throws(() => engine.materialize('word_type', { pattern: 'sentence-class', actorId: 'fish', actionId: 'verb-3', role: 'action' }, 9));
assert.throws(() => engine.materialize('word_type', { pattern: 'sentence-class', actorId: 'human-0', actionId: 'verb-5', role: 'action' }, 1));
assert.throws(() => engine.materialize('word_type', { pattern: 'lexeme-class', atomId: 'verb-4' }, 9), 'Do not classify the ambiguous isolated word đậu outside an activity sentence.');
assert.throws(() => engine.materialize('word_type', { pattern: 'lexeme-class', atomId: 'noun-0' }, 99));
const fill = engine.materialize('context_fill', { pattern: 'source-fill', atomId: 'noun-11' }, 1);
assert.equal(fill.answer, 'Hôm nay');
assert.ok(fill.options.every(option => option[0] === option[0].toLocaleUpperCase('vi-VN')));
assert.ok(!fill.prompt.includes('Hôm nay'), 'The fill prompt must not print the missing answer.');
assert.ok(!engine.materialize('word_groups', { pattern: 'name-group', atomId: 'name-0' }, 3).options.includes('Tên cơ quan, tổ chức'));
for (const definition of Grade4VietnameseTemplates.definitions) {
  const variants = Grade4VietnameseTemplates.getQuestionVariants(definition.id, { lesson: 'g4-vietnamese-hk1-b32' });
  assert.ok(variants.length > 0, definition.key);
  for (const question of variants) {
    assert.equal(Grade4VietnameseTemplates.validateQuestion(question), '', definition.key);
    assert.equal(question.subquestions.length, 2);
    for (const part of question.subquestions) {
      assert.ok(part.generation);
      assert.equal(part.options.filter(option => option === part.answer).length, 1);
    }
  }
}
const q = Grade4VietnameseTemplates.generateQuestion('vietnamese.word_type', config, () => 0);
const reordered = value => Array.isArray(value) ? value.map(reordered) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reordered(item)])) : value;
assert.equal(Grade4VietnameseTemplates.validateQuestion(reordered(q)), '', 'Saved JSON objects may reorder keys without changing linguistic content.');
for (const mutate of [
  value => { value.subquestions[0].answer = 'Sai'; },
  value => { value.subquestions[0].generation.actorId = 'fish'; },
  value => { value.subquestions[0].prompt += ' câu mới'; },
  value => { value.subquestions[0].evidence.excerpt = 'Nguồn giả'; },
  value => { value.subquestions[0].options.push('lựa chọn ngoài nguồn'); },
  value => { value.subquestions[0].generation.extra = 'không được phép'; },
  value => { delete value.subquestions[1].generation; }
]) {
  const changed = structuredClone(q); mutate(changed);
  assert.notEqual(Grade4VietnameseTemplates.validateQuestion(changed), '');
}
const meaning = Grade4VietnameseTemplates.generateQuestion('vietnamese.word_meaning', { lesson: 'g4-vietnamese-hk1-b02' }, () => 0);
assert.notEqual(meaning.subquestions[0].generation.atomId, meaning.subquestions[1].generation.atomId, 'Do not reveal answers by pairing forward/reverse of one glossary fact.');
const singleSkill = Grade4VietnameseTemplates.getDefaultTemplates().filter(t => t.lesson === 'g4-vietnamese-hk1-b32' && t.generator_key === 'vietnamese.word_type');
const vocabularyHistory = history.empty();
for (let round = 0; round < 2; round++) history.createRound(singleSkill, 10, vocabularyHistory, () => 0).forEach(question => history.record(vocabularyHistory, question));
for (const atom of atoms.filter(atom => atom.kind === 'lexeme')) assert.ok(vocabularyHistory.words.includes(atom.word), `Prioritize unseen vocabulary before cycling: ${atom.word}`);
assert.ok(atoms.filter(atom => atom.kind === 'lexeme').length >= 30);
const templates = Grade4VietnameseTemplates.getDefaultTemplates().filter(template => template.lesson === config.lesson);
const state = history.empty();
const roundA = history.createRound(templates, 10, state, () => 0);
assert.equal(roundA.length, 10);
roundA.forEach(question => history.record(state, question));
const roundB = history.createRound(templates, 10, state, () => 0);
const keysA = new Set(roundA.flatMap(question => question.subquestions.map(part => part.semanticKey)));
assert.ok(roundB.flatMap(question => question.subquestions).filter(part => !keysA.has(part.semanticKey)).length >= 10, 'Prefer genuinely unseen targets/tasks across rounds.');
assert.equal(history.empty().parts.length, 0, 'History is not global across students.');
history.remember(roundA[0], { id: 'alice' });
assert.equal(history.load({ id: 'alice' }).parts.length, 2);
assert.equal(history.load({ id: 'bob' }).parts.length, 0);
// Repeat a render without growing history; quota failure must retain the session fallback.
globalThis.localStorage = { getItem: () => JSON.stringify(history.empty()), setItem: () => { throw Error('quota'); } };
history.remember(roundA[1], { id: 'quota-user' }); history.remember(roundA[1], { id: 'quota-user' });
assert.equal(history.load({ id: 'quota-user' }).parts.length, 2);
const vm = require('node:vm'), fs = require('node:fs');
const pending = { VietnameseParameterCorpus: { ...VietnameseParameterCorpus, reviewStatus: 'pending' } };
vm.runInNewContext(fs.readFileSync('./src/question-templates/grade-4/vietnamese/parameter-engine.js', 'utf8'), pending);
assert.throws(() => pending.VietnameseParameterEngine.materialize('word_type', { pattern: 'lexeme-class', atomId: 'noun-0' }, 1));
assert.throws(() => pending.VietnameseParameterEngine.candidates('word_type', 1));
for (let lesson = 1; lesson <= 32; lesson++) {
  const available = Grade4VietnameseTemplates.getDefaultTemplates().filter(t => t.lesson.endsWith(`b${String(lesson).padStart(2, '0')}`));
  const round = history.createRound(available, 10, history.empty(), () => 0);
  assert.equal(round.length, 10, `lesson ${lesson}`);
  round.forEach(question => assert.equal(Grade4VietnameseTemplates.validateQuestion(question), ''));
}
console.log('Parameterized Vietnamese generation: computed answers, constrained frames, replay verification and content diversity.');
