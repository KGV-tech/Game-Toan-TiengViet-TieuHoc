const {test,expect}=require('@playwright/test');
async function open(page,doc){
  await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
  await page.route('**/*.supabase.co/**',route=>route.abort());await page.goto('/');
  await page.evaluate(doc=>{app.data.currentUser={username:'teacher',role:'admin'};app.data.worksheets=[];app.admin.openComposer('worksheets');app.admin.renderWSubTab('add');app.worksheetStudio.openImport();app.worksheetStudio.doc=WorksheetDocument.normalize(doc);app.worksheetStudio.renderEditor();},doc);
}
test('các loại câu chính và câu con lưu lại đúng, lựa chọn phù hợp mỗi loại',async({page})=>{
 await open(page,{title:'Các dạng câu',pages:[{blocks:[{text:'Chọn đáp án',options:['Một','Hai'],parts:[{text:'Câu con'}]}]}]});
 const types=['question','multipleChoice','trueFalse','fill','compare','sequence','drag','matching'];
 for(const type of types){
  await page.locator('[data-ws-field="0:0:kind"]').focus();
  await page.locator('[data-ws-field="0:0:kind"]').selectOption(type);
  await expect(page.locator('[data-ws-field="0:0:kind"]')).toBeFocused();
  await page.locator('[data-ws-part-field="0:0:0:kind"]').selectOption(type);
  const hidden=['trueFalse','compare','fill','sequence'].includes(type);
  if(hidden) await expect(page.locator('[data-ws-field="0:0:options"]')).toBeHidden();
  else await expect(page.locator('[data-ws-field="0:0:options"]')).toBeVisible();
  await page.getByRole('button',{name:'Lưu phiếu học tập',exact:true}).click();
  await page.evaluate(()=>app.worksheetStudio.edit(app.data.worksheets[0],0));
  await expect(page.locator('[data-ws-field="0:0:kind"]')).toHaveValue(type);
  await expect(page.locator('[data-ws-part-field="0:0:0:kind"]')).toHaveValue(type);
 }
});
for(const width of [1024,1280,1440])test(`ô đã xóa giữ rỗng; bản in chỉ đóng khung nhóm và thống nhất font ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await open(page,{title:'Bộ chữ số',pages:[{title:'Phiếu số 1',blocks:[{kind:'table',text:'Bài 1. Hoàn thành bảng',columns:['Số','Đọc số'],rows:[['30','___'],['40','___']],lines:0},{kind:'multipleChoice',text:'Bài 2. Chọn số',options:['A. Một','B. Hai'],answer:'ĐÁP ÁN RIÊNG',lines:0,parts:[{label:'1)',kind:'trueFalse',text:'Số 2 là số chẵn.',lines:0},{label:'2)',kind:'compare',text:'2 ___ 3',lines:0}]}]}]});
 await page.getByLabel('Hàng 1, cột 2',{exact:true}).fill('');
 for(let i=0;i<2;i++){
  await page.getByRole('button',{name:'Xem bản in màu',exact:true}).click();
  await expect(page.locator('#ws-color-preview')).toHaveAttribute('data-paginated','true');
  await expect(page.locator('#ws-color-preview tbody tr').first().locator('td').nth(1)).toHaveText('');
  await expect(page.locator('#ws-color-preview tbody tr').nth(1).locator('td').nth(1)).not.toHaveText('');
 }
 // A group may continue on another A4 page beneath the selected header.
 expect(await page.locator('#ws-color-preview .ws-print-group').evaluateAll(groups=>[...new Set(groups.map(group=>group.dataset.wsGroup))])).toEqual(['0']);
 await expect(page.locator('#ws-color-preview .ws-block-number')).toHaveText(['1. ','2. ']);
 await expect(page.locator('#ws-color-preview .ws-part strong')).toHaveText(['a)','b)']);
 await expect(page.locator('#ws-color-preview')).not.toContainText('ĐÁP ÁN RIÊNG');
 await expect(page.locator('#ws-color-preview')).not.toContainText('Bài 1');
 const styles=await page.locator('#ws-color-preview').evaluate(root=>Array.from(root.querySelectorAll('h1,h2,h3,th,td,p,strong')).map(el=>({family:getComputedStyle(el).fontFamily,weight:getComputedStyle(el).fontWeight})));
 expect(styles.every(s=>s.family.startsWith('Arial')&&['400','700'].includes(s.weight))).toBe(true);
 await expect(page.locator('#ws-color-preview .ws-block').first()).toHaveCSS('border-left-width','0px');
 expect(await page.locator('#ws-color-preview .ws-print-group').evaluateAll(groups=>groups.every(group=>getComputedStyle(group).borderLeftWidth==='4px'))).toBe(true);
 await page.getByRole('button',{name:'Lưu phiếu học tập',exact:true}).click();await page.evaluate(()=>app.worksheetStudio.edit(app.data.worksheets[0],0));
 await expect(page.getByLabel('Hàng 1, cột 2',{exact:true})).toHaveValue('');
});
