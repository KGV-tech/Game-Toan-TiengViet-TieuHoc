const assert = require('node:assert/strict');
const selection = require('./src/question-templates/multi-select');
let seed = 17;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
for (const lesson of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73]) {
  for (let sample = 0; sample < 30; sample++) {
    const q = selection.generateQuestion('selection.math', { lesson: `g4-math-hk${lesson < 38 ? 1 : 2}-b${String(lesson).padStart(2,'0')}` }, random);
    assert.equal(selection.validate(q), '');
    assert.equal(q.selectionItems.length, 10);
    assert.equal(new Set(q.selectionItems.map(item => item.text)).size, 10);
    assert(q.correctIds.length >= 1 && q.correctIds.length <= 9);
    assert.equal(selection.score(q, [...q.correctIds].reverse()).points, 1);
    assert.equal(selection.score(q, q.selectionItems.map(item => item.id)).points, 0);
    assert.equal(selection.score(q, []).points, 0);
    assert.equal(selection.score(q, [...q.correctIds, 'forged']).points, 0);
    assert.equal(selection.score(q, [...q.correctIds, q.correctIds[0]]).points, 0);
  }
}
const counts = Array(10).fill(0);
for (let i = 0; i < 2000; i++) counts[selection.generateQuestion('selection.math', {lesson:'g4-math-hk1-b03'}, random).correctIds.length]++;
assert(counts.slice(1).every(n => n > 0));
assert(counts[4]+counts[5]+counts[6] > 1400);
const q = { q:'Đề cũ', subquestions:[{prompt:'Chọn số chẵn.', options:['2','3']}, {prompt:'Chọn số chẵn.',options:['4','5']}] };
selection.normalizePrompts(q);
assert.equal(q.q,'Chọn số chẵn.');
assert.equal(q.sharedPrompt, true);
assert(q.subquestions.every(part => part.prompt === 'Chọn số chẵn.'));
const mixed = {q:'Đề',subquestions:[{prompt:'Chọn số chẵn.'},{prompt:'Chọn số lẻ.'}]};
selection.normalizePrompts(mixed);
assert.equal(mixed.q,'Đề');
console.log('Multi-select: 73 lesson generators, scoring, weighting and shared prompts pass.');

const contextual = {q:'Dãy số: 12, 35, 48',subquestions:[{prompt:'Chọn số chẵn.'},{prompt:'Chọn số chẵn.'}]};
selection.normalizePrompts(contextual);const preserved = contextual.q;selection.normalizePrompts(contextual);
assert.equal(contextual.q,preserved);assert(contextual.q.includes('12, 35, 48'));

assert.throws(()=>selection.generateQuestion('selection.math',{lesson:'g4-math-hk1-b03',selectionTarget:'mixed'}));
for(const lesson of [41,43,44]) {
  const q=selection.generateQuestion('selection.math',{lesson:`g4-math-hk2-b${lesson}`},random);
  for(const item of q.selectionItems) {
    const operand=Number(item.text.replaceAll(' ','').match(/(?:×|:)(\d+)=/)[1]);
    assert(lesson===41 ? [10,100,1000].includes(operand) : operand>=10&&operand<=99);
  }
}

const fs=require('node:fs');require('./src/modules/constants');
const sql=fs.readFileSync('supabase/migrations/20261009_question_templates_multi_select.sql','utf8');
const migrationRows=JSON.parse(sql.match(/\$selection_seed\$(\[[\s\S]*?\])\$selection_seed\$/)[1]);
assert.equal(migrationRows.length,270);assert(migrationRows.every(row=>row.name.length<=120));
assert.equal(new Set(migrationRows.map(row=>`${row.lesson}:${row.config.selectionTarget}`)).size,270);
assert(migrationRows.every(row=>['correct','incorrect'].includes(row.config.selectionTarget)));
assert.deepEqual(migrationRows.map(row=>[row.lesson,row.config.selectionTarget]),selection.getDefaultTemplates().map(row=>[row.lesson,row.config.selectionTarget]));
assert(/WHERE NOT EXISTS/.test(sql));
assert(!/\b(?:DELETE|UPDATE|ALTER|DROP|GRANT)\b/i.test(sql.replace(/^--.*$/gm,'')));
