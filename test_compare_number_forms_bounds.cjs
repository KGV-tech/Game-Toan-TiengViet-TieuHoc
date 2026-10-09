const assert=require('node:assert/strict');
const generate=require('./src/question-templates/grade-4/math/compare-number-forms');
function verify(q,min,max){
 for(const row of q.comparisonRows){const left=Number(row.leftText.replace(/\s/g,''));const right=row.rightText.split('+').reduce((sum,v)=>sum+Number(v.replace(/\s/g,'')),0);
 assert.ok(left>=min&&left<=max&&right>=min&&right<=max);assert.equal(row.answer,left===right?'=':left>right?'>':'<');}
}
// At the upper boundary a larger number does not exist; at the lower boundary a smaller number does not exist.
for(const values of [[0.999999,0.5],[0,0.99]]){let i=0;const q=generate({minimum:10001,maximum:10002},()=>values[i++%values.length]);verify(q,10001,10002);}
verify(generate({},()=>0.999999),10000,99999);
for(let seed=1;seed<=100;seed++){let state=seed;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};verify(generate({},random),10000,99999);}
console.log('Compare-number forms: bounded pairs always exist and preserve correct comparison answers.');
