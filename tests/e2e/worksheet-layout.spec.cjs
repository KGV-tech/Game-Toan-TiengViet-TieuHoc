const {test,expect}=require('@playwright/test');
async function open(page,doc) {
  await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
  await page.route('**/*.supabase.co/**',route=>route.abort());
  await page.goto('/');
  await page.evaluate(doc=>{
    app.data.currentUser={username:'teacher',role:'admin'};app.data.worksheets=[];
    app.admin.openComposer('worksheets');app.admin.renderWSubTab('add');
    app.worksheetStudio.openImport();app.worksheetStudio.doc=WorksheetDocument.normalize(doc);
    app.worksheetStudio.renderEditor();
  },doc);
}
const base=()=>({title:'Phiếu luyện số',pages:[{title:'Nhóm số tự nhiên',blocks:[{text:'Bài 1. Điền số',parts:[{label:'a)',text:'Giữ nội dung gốc',lines:2}],lines:2}]}]});
test('thêm nhóm thủ công giữ nội dung, không còn khung khai báo hoặc nút dư',async({page})=>{
  await open(page,base());
  await expect(page.locator('.ws-structure')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Thêm trang',exact:true})).toHaveCount(0);
  await expect(page.locator('#ws-export-json')).toHaveCount(0);
  await page.getByRole('button',{name:'Thêm Nhóm',exact:true}).click();
  await page.getByRole('button',{name:'Thêm Nhóm',exact:true}).click();
  await expect(page.locator('.ws-editor-page')).toHaveCount(3);
  await expect(page.locator('[data-ws-part-field="0:0:0:text"]')).toHaveValue('Giữ nội dung gốc');
  await expect(page.locator('[data-group-break="2"]')).not.toBeChecked();
});
test('cột/dòng cố định giữ kích thước và lưu lại cùng phiếu',async({page})=>{
  await open(page,{title:'Bảng',pages:[{blocks:[{kind:'table',text:'Điền bảng',columns:['Số','Đọc số','Hàng','Giá trị'],rows:[['1','___','___','___'],['2','___','___','___']]}]}]});
  await page.locator('.ws-table-sizing').evaluate(e=>e.open=true);
  await page.locator('[data-size-axis="columns"][data-size-index="0"]').fill('58');await page.locator('[data-size-axis="columns"][data-size-index="0"]').blur();
  await page.locator('[data-size-lock="columns:0"]').check();
  await page.locator('[data-size-axis="columns"][data-size-index="1"]').fill('60');await page.locator('[data-size-axis="columns"][data-size-index="1"]').blur();
  await expect(page.locator('[data-size-axis="columns"][data-size-index="0"]')).toHaveValue('58');
  await expect(page.locator('[data-size-axis="columns"][data-size-index="2"]')).toHaveValue('30');
  await page.locator('[data-size-axis="rows"][data-size-index="1"]').fill('50');await page.locator('[data-size-axis="rows"][data-size-index="1"]').blur();
  await page.locator('[data-size-lock="rows:1"]').check();
  await page.locator('[data-size-equal="equalRows"]').check();
  await expect(page.locator('[data-size-axis="rows"][data-size-index="1"]')).toHaveValue('50');
  await page.getByRole('button',{name:'Lưu phiếu học tập',exact:true}).click();
  await page.evaluate(()=>app.worksheetStudio.edit(app.data.worksheets[0],0));
  await expect(page.locator('[data-size-axis="columns"][data-size-index="0"]')).toHaveValue('58');
  await expect(page.locator('[data-size-lock="columns:0"]')).toBeChecked();
});
for(const width of [1280,1024])test(`preview A4 và PDF giữ tiêu đề trang đầu, nhóm và trang trí ${width}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:900});
  const doc={...base(),decoration:'rainbow',pages:[...base().pages,{title:'Nhóm thứ hai',startNewPage:true,blocks:[{kind:'table',text:'Hoàn thành bảng dài',columns:['Số','Đọc số'],rows:Array.from({length:45},(_,i)=>[String(i+1),'___'])}]}]};
  await open(page,doc);
  await page.getByRole('button',{name:'Xem bản in màu',exact:true}).click();
  await expect(page.locator('#ws-color-preview')).toHaveAttribute('data-paginated','true');
  const pages=page.locator('#ws-color-preview > .ws-page');expect(await pages.count()).toBeGreaterThan(2);
  await expect(page.locator('#ws-color-preview h1')).toHaveCount(1);
  await expect(page.locator('#ws-color-preview .ws-student-info')).toHaveCount(1);
  await expect(page.locator('#ws-color-preview')).not.toContainText('CÙNG LUYỆN TẬP');
  await expect(page.locator('#ws-color-preview')).not.toContainText('Kiên trì');
  await expect(page.locator('#ws-color-preview h1')).toHaveCSS('text-align','center');
  await expect(page.locator('#ws-color-preview .ws-group-title').first()).toHaveCSS('text-transform','uppercase');
  expect(await page.locator('#ws-color-preview tbody tr').count()).toBe(45);
  expect(await pages.evaluateAll(items=>items.every(page=>{const body=page.querySelector('.ws-page-content');return body.scrollHeight<=body.clientHeight+1&&body.scrollWidth<=body.clientWidth+1;}))).toBe(true);
  const count=await pages.count();
  await page.evaluate(()=>{app.worksheetStudio.capture();app.data.worksheets=[WorksheetDocument.toRecord(app.worksheetStudio.doc)];app.admin.viewWorksheet(0);});
  const promise=page.waitForEvent('popup');await page.getByRole('button',{name:'Xuất PDF / A4',exact:true}).click();const popup=await promise;
  await expect(popup.locator('#print-document')).toHaveAttribute('data-paginated','true');
  await expect(popup.locator('#print-document > .ws-page')).toHaveCount(count);
  const pdf=await popup.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
  const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');const parsed=await getDocument({data:new Uint8Array(pdf),useSystemFonts:true}).promise;
  expect(parsed.numPages).toBe(count);
  const firstText=(await (await parsed.getPage(1)).getTextContent()).items.map(item=>item.str).join(' ');
  expect(firstText).toContain('Phiếu luyện số');
  expect(firstText).toContain('Giữ nội dung gốc');
  require('node:fs').writeFileSync(testInfo.outputPath('a4-output.pdf'),pdf);
  await testInfo.attach('a4-output',{body:pdf,contentType:'application/pdf'});
  await popup.emulateMedia({media:'screen'});await popup.locator('.ws-page').first().screenshot({path:testInfo.outputPath('a4-first.png')});
});


test('bảng dài không lặp câu con; đoạn dài giữ đầy đủ chữ khi chia A4',async({page})=>{
  const passage=Array.from({length:800},(_,i)=>`Từ${i}`).join(' ');
  await open(page,{title:'Phiếu dài',pages:[{title:'Nhóm dài',blocks:[{kind:'table',text:'Bảng dài',columns:['Số','Đọc'],rows:Array.from({length:50},(_,i)=>[String(i),'___']),parts:[{label:'a)',text:'CÂU CON DUY NHẤT',lines:2}]},{kind:'question',text:passage,lines:2}]}]});
  await page.getByRole('button',{name:'Xem bản in màu',exact:true}).click();
  await expect(page.locator('#ws-color-preview')).toHaveAttribute('data-paginated','true');
  expect(await page.locator('#ws-color-preview tbody tr').count()).toBe(50);
  expect(await page.locator('#ws-color-preview').innerText()).toContain('Từ799');
  const text=await page.locator('#ws-color-preview').innerText();
  expect(text.match(/CÂU CON DUY NHẤT/g)).toHaveLength(1);
  expect(text.match(/Từ\d+/g)).toHaveLength(800);
});

test('đổi mẫu trang trí và không cắt một dòng bảng quá cao',async({page})=>{
  await open(page,base());
  for(const decoration of ['leaves','stars','rainbow','pencils','geometry','none']){
    await page.locator('#ws-decoration').selectOption(decoration);
    await page.getByRole('button',{name:'Xem bản in màu',exact:true}).click();
    await expect(page.locator('#ws-color-preview')).toHaveAttribute('data-decoration',decoration);
    await expect(page.locator('#ws-color-preview .ws-decoration')).toHaveCount(decoration==='none'?0:2);
  }
  await page.evaluate(()=>{app.worksheetStudio.doc=WorksheetDocument.normalize({title:'Dòng lớn',pages:[{blocks:[{kind:'table',text:'Bảng',columns:Array.from({length:16},(_,i)=>`Cột ${i+1}`),rows:[Array.from({length:16},()=> 'Chữ dài '.repeat(250))]}]}]});app.worksheetStudio.renderEditor();});
  await page.getByRole('button',{name:'Xem bản in màu',exact:true}).click();
  await expect(page.locator('#ws-feedback')).toContainText('Một dòng bảng cao hơn vùng in A4');
  await expect(page.locator('#ws-preview-area')).toBeEmpty();
});


test('nhóm trống được giữ khi mở lại, không mang dữ liệu từ phiếu khác',async({page})=>{
  await open(page,base());
  await page.evaluate(()=>{const record=WorksheetDocument.toRecord({title:'Phiếu B',pages:[{title:'Nhóm B1',blocks:[{kind:'question',text:'Nội dung B',lines:2}]},{title:'Nhóm B2 trống',blocks:[]},{title:'Nhóm B3 trống',blocks:[]}]});app.data.worksheets=[record];app.worksheetStudio.edit(record,0);});
  await expect(page.locator('.ws-editor-page')).toHaveCount(3);
  await expect(page.locator('#ws-page-title-2')).toHaveValue('Nhóm B3 trống');
  await page.getByRole('button',{name:'Lưu phiếu học tập',exact:true}).click();
  await page.evaluate(()=>app.worksheetStudio.edit(app.data.worksheets[0],0));
  await expect(page.locator('#ws-title')).toHaveValue('Phiếu B');
  await expect(page.locator('.ws-editor-page')).toHaveCount(3);
});
