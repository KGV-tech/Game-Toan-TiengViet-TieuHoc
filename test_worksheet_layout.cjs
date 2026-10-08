const assert = require('node:assert/strict');
const L = require('./src/modules/worksheet-layout.js');
const equal = L.allocate([], 4, 178);
assert.equal(equal.reduce((sum, item) => sum + item.value, 0), 178);
const first = L.resize(equal, 0, 58, 178);
assert.equal(first[0].value, 58);
assert.equal(first[1].value, 40);
first[0].locked = true;
const next = L.resize(first, 1, 60, 178);
assert.equal(next[0].value, 58);
assert.equal(next[1].value, 60);
assert.equal(next[2].value, 30);
assert.throws(() => L.resize(next, 1, 130, 178), /khổ|còn lại/);
const again = L.allocate(next, 4, 178, true);
assert.equal(again[0].value, 58);
assert.equal(again[1].value, 40);
const fs=require('node:fs');
const bundle=fs.readFileSync('./src/modules/worksheet-bundle.js','utf8').replace(/\r\n/g,'\n');
for(const name of ['authoring-plan','worksheet-layout','worksheet-document','worksheet-studio','worksheet-local-import','worksheet-source-tools','worksheet-classroom']) {
  assert(bundle.includes(fs.readFileSync(`./src/modules/${name}.js`,'utf8').replace(/\r\n/g,'\n')),`Rebuild worksheet bundle after editing ${name}`);
}
console.log('Worksheet table layout contracts passed');
