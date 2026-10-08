const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');
const context={};context.globalThis=context;vm.runInNewContext(fs.readFileSync('src/modules/worksheet-ocr-recovery.js','utf8'),context);
const recover=context.WorksheetOCRRecovery.recover;
const line=(text,y,score=.99,x=60)=>({text,x,y,width:600,height:25,confidence:score*100});
const doc=recover([line('PHIẾU HỌC TẬP SỐ 2',10),line('Nêu giá trị của từng chữ số trong số 234 139.',50),line('Mẫu: Chữ số 2 có giá trị 200 000.',90),line('....................',120),line('Nêu giá trị của từng chữ số trong số 12 388.',160),line('PHIẾU HỌC TẬP SỐ 3',220),line('1. Phát biểu nào sau đây đúng:',260),line('A. Số 942367 có chữ số 9 ở hàng trăm nghìn.',300),line('B. Số 942367 có chữ số 4 ở hàng trăm.',340),line('2. Bạn Hà nói:',380),line('Bạn Linh bảo:',420),line('Theo em bạn nào nói đúng?',460),line('3. Từ các số 3, 8, 5, 4, 7, 6',500),line('A. 4.',540, .99,60),line('B. 5.',540,.99,250),line('C. 6.',540,.99,440)],null,'trang2.jpg',2);
assert.equal(doc.pages.length,2);assert.equal(doc.pages[0].blocks.length,2);assert.equal(doc.pages[1].blocks.length,3);assert.equal(doc.pages[1].startNewPage,false);assert.equal(doc.pages[1].blocks[0].kind,'multipleChoice');assert.equal(doc.pages[1].blocks[2].options.length,3);assert.ok(doc.pages.every(p=>p.blocks.every(b=>b.answer==='')));
const grid={xs:[0,100,200],ys:[100,150,200]};const table=recover([line('PHIẾU HỌC TẬP SỐ 1',20),{text:'Viết số',x:5,y:110,width:80,height:20,confidence:99},{text:'Đọc số',x:105,y:110,width:80,height:20,confidence:99},{text:'30 078',x:5,y:160,width:80,height:20,confidence:99}],grid,'bai.jpg',1);
assert.equal(table.pages.length,1);assert.equal(table.pages[0].blocks[0].kind,'table');assert.equal(table.pages[0].blocks[0].rows[0][1],'___');
const uncertain=recover([line('1. Tính 8000',20,.4),line('a) 2 × 3',60),line('b) 3 × 4',100)],null,'bai.jpg',1);
assert.match(uncertain.pages[0].blocks[0].review,/8000/);assert.equal(uncertain.pages[0].blocks[0].parts.length,2);
console.log('worksheet OCR coordinate recovery passed');

const writing=recover([line('1. Tính 2 × 3',20)],null,'bai.jpg',1,[60,90,120]);assert.equal(writing.pages[0].blocks[0].lines,3);

const classroom=recover([line('PHIẾU HỌC TẬP SỐ 1',10),line('Lớp học có 32 học sinh, trong đó 18 học sinh nữ.',50),line('Hỏi lớp học có bao nhiêu học sinh nam?',90)],null,'bai.jpg');assert.match(classroom.pages[0].blocks[0].text,/32 học sinh/);
