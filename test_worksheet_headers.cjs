const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('./src/modules/worksheet-document.js');
const L = require('./src/modules/worksheet-layout.js');
const base = {title:'Header',pages:[{blocks:[{text:'Nội dung'}]}]};
assert.equal(D.headerTemplates.length,12);
assert.equal(new Set(D.headerTemplates.map(item=>item.id)).size,12);
let total = 0;
for (const header of D.headerTemplates) {
  const bytes = fs.readFileSync(path.join(__dirname,header.src));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert(header.width<=1600&&header.height<=700);
  assert(bytes.length<350000,`${header.id} exceeds image budget`);
  total+=bytes.length;
  assert.equal(D.fromRecord(D.toRecord({...base,decoration:header.id})).decoration,header.id);
  assert(L.decoration(header.id).includes(header.src));
  assert(!L.decoration(header.id).includes('<svg'));
}
assert(total<3000000,'Header collection exceeds 3 MB');
assert.equal(D.normalize({...base,decoration:'rainbow'}).decoration,'pastel');
assert.equal(D.normalize({...base,decoration:'<img src=x>'}).decoration,'school');
assert.equal(L.decoration('none'),'');
console.log('12 WebP worksheet headers: roundtrip, format and size budget passed');
