const assert=require('node:assert/strict');
require('./src/question-templates/grade-4/math/shared');
const table=require('./src/question-templates/complete-table');
let seed=31;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(const placeColumns of [4,5,6,7,8,9]) for(let i=0;i<100;i++) {
 const q=table.generateQuestion(table.templateIds[0],{placeColumns},random);
 assert.equal(table.validate(q),'');assert.equal(q.tableRows.length,4);assert.equal(new Set(q.tableRows.map(r=>r.value)).size,4);
 assert(q.tableRows.every(r=>r.places.length===placeColumns));assert.equal(new Set(q.tableRows.map(r=>r.given)).size,3);
 assert.equal(table.score(q,q.ans).points,1);assert.equal(table.score(q,'').points,0);
 const answers=JSON.parse(q.ans);answers[0]={write:'wrong',read:'wrong',places:Array(placeColumns).fill('x')};
 assert.equal(table.score(q,answers).points,.75);
 const answers2=JSON.parse(q.ans);const row=q.tableRows[1];const group=row.given==='places'?'write':'places';
 if(group==='places')answers2[1].places[0]='x';else answers2[1].write='x';
 assert.equal(table.score(q,answers2).points,.75);
 const tampered=structuredClone(q);tampered.tableRows[0].read='Sai';assert(table.validate(tampered));assert.equal(table.score(tampered,q.ans).points,0);
}
for(const placeColumns of [0,3,10,6.5,'x'])assert.throws(()=>table.generateQuestion(table.templateIds[0],{placeColumns}));
const q=table.generateQuestion(table.templateIds[0],{},()=>0);assert.equal(q.placeColumns,6);assert.equal(table.validate(q),'');
console.log('Complete table: four rows, column bounds, varied givens and quarter-point row scoring pass.');

const short=table.generateQuestion(table.templateIds[0],{},()=>0);
assert(short.tableRows.every(row=>row.value<100000&&row.places[0]===''));
const shortAnswers=JSON.parse(short.ans);assert.equal(table.score(short,shortAnswers).points,1);
for(const row of shortAnswers)row.places[0]=null;assert.equal(table.score(short,shortAnswers).points,1);
