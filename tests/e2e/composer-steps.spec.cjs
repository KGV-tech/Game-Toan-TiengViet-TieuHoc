const {test,expect}=require('@playwright/test');
for(const width of [1024,1280]) test(`Các bước theo đúng khu vực và không chuyển sang Đề ${width}`,async({page})=>{
  await page.setViewportSize({width,height:width===1024?768:720});
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.route('**/*.supabase.co/**',r=>r.abort());
  await page.goto('/');
  await page.evaluate(()=>{app.data.currentUser={username:'teacher',role:'admin'};app.admin.openComposer();});
  for(const [module,title,field] of [['questions','CÁC BƯỚC TẠO CÂU HỎI','#add-q-q'],['worksheets','CÁC BƯỚC TẠO PHIẾU','#add-w-name'],['templates','CÁC BƯỚC TẠO CẤU HÌNH','#template-name'],['exams','CÁC BƯỚC SOẠN ĐỀ','#add-e-name']]) {
    await page.locator(`[data-quickstart-module="${module}"]`).click();
    await expect(page.locator('#admin-compose-steps')).toContainText(title);
    await page.locator('[data-compose-step="content"]').click();
    await expect(page.locator(field)).toBeVisible();
    await page.locator(field).fill('Nội dung giữ lại');
    await page.locator('[data-compose-step="review"]').click();
    await expect(page.locator('#admin-compose-module-panel')).toHaveAttribute('data-module',module);
    await expect(page.locator(field)).toHaveValue('Nội dung giữ lại');
    await expect(page.locator('[data-compose-step="review"]')).toHaveAttribute('aria-current','step');
    await page.locator('[data-compose-step="workspace"]').click();
    await expect(page.locator(field)).toHaveValue('Nội dung giữ lại');
    if(module==='worksheets') {
      await expect(page.locator('#admin-compose-question-nav-title')).toHaveText('CÂU HỎI TRONG PHIẾU');
      await page.locator('[data-question-nav-index="5"]').click();
      await expect(page.locator('#add-w-q-type-5')).toBeVisible();
    }
  }
});

test('Các bước của Phiếu tự do giữ upload và nội dung, đưa tới Xem bản in/Lưu',async({page})=>{
  await page.setViewportSize({width:1024,height:768});
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.route('**/*.supabase.co/**',r=>r.abort());
  await page.goto('/');
  await page.evaluate(()=>{app.data.currentUser={username:'teacher',role:'admin'};app.admin.openComposer('worksheets');app.admin.renderWSubTab('add');});
  await page.getByRole('button',{name:'Tạo phiếu từ ảnh/file',exact:true}).click();
  await expect(page.locator('#admin-compose-question-nav')).toBeHidden();
  await page.locator('#ws-source-files').setInputFiles({name:'bai.txt',mimeType:'text/plain',buffer:Buffer.from('Bài 1: 5 + ___ = 9')});
  await page.locator('[data-compose-step="review"]').click();
  expect(await page.locator('#ws-source-files').evaluate(el=>el.files[0]?.name)).toBe('bai.txt');
  await page.locator('#ws-blank').click();
  await page.locator('#ws-title').fill('Phiếu tự do đang sửa');
  await page.locator('[data-compose-step="content"]').click();
  await page.locator('[data-compose-step="review"]').click();
  await expect(page.locator('#ws-title')).toHaveValue('Phiếu tự do đang sửa');
  await expect(page.locator('#ws-save')).toBeInViewport();
  await expect(page.locator('#admin-compose-module-panel')).toHaveAttribute('data-module','worksheets');
});
