const { test, expect } = require('@playwright/test');

async function openStudio(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', role: 'admin' };
    app.data.exams = [{ name: 'Đề độc lập', questions: [] }];
    app.data.worksheets = [];
    app.admin.openComposer('worksheets');
    app.admin.renderWSubTab('add');
  });
  await page.getByRole('button', { name: 'Tạo phiếu từ ảnh/file', exact: true }).click();
}

test('nhập nhiều file, sửa câu con, lưu phiếu không cần đáp án và không sửa kho Đề', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openStudio(page);
  await page.locator('#ws-source-files').setInputFiles([
    { name: 'bai1.txt', mimeType: 'text/plain', buffer: Buffer.from('PHIẾU HỌC TẬP SỐ 1\n1. Tính:\na) 6 000 × 5 : 3\nb) 13 206 × (36 : 9)\n..................') },
    { name: 'bai2.txt', mimeType: 'text/plain', buffer: Buffer.from('2. Điền số: 116, 118, ___, ___, 126') }
  ]);
  await page.getByRole('button', { name: 'Đọc và dựng phiếu', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Hiệu chỉnh phiếu từ tài liệu' })).toBeVisible();
  await expect(page.locator('.ws-editor-page')).toHaveCount(2);
  await expect(page.locator('[data-ws-part-field="0:0:1:text"]')).toHaveValue('13 206 × (36 : 9)');
  await page.locator('[data-ws-part-field="0:0:0:text"]').fill('6 000 × 5 : 3 = ___');
  await page.locator('[data-ws-field="0:0:answer"]').fill('ĐÁP ÁN BÍ MẬT');
  await page.getByRole('button', { name: 'Xem bản in màu' }).click();
  await expect(page.locator('#ws-color-preview')).toContainText('6 000 × 5 : 3');
  await expect(page.locator('#ws-color-preview')).not.toContainText('ĐÁP ÁN BÍ MẬT');
  await page.getByRole('button', { name: 'Lưu phiếu học tập', exact: true }).click();
  await expect.poll(() => page.evaluate(() => app.data.worksheets.length)).toBe(1);
  const result = await page.evaluate(() => ({
    count: app.data.worksheets[0].questions.length,
    local: JSON.parse(localStorage.getItem('game_worksheets'))[0].questions.length,
    exams: app.data.exams.map(e => e.name)
  }));
  expect(result).toEqual({ count: 2, local: 2, exams: ['Đề độc lập'] });
  expect(errors).toEqual([]);
});

test('OCR tiếng Việt chạy với tài nguyên cùng website và bỏ nét bút màu', async ({ page }) => {
  test.setTimeout(120000);
  await openStudio(page);
  const ocrRequests=[];
  page.on('request',request=>{if(/tesseract|traineddata|worksheet-vendor/.test(request.url()))ocrRequests.push({url:request.url(),method:request.method()});});
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 500;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1200, 500);
    ctx.fillStyle = 'black'; ctx.font = '42px Arial';
    ctx.fillText('PHIẾU HỌC TẬP', 60, 80);
    ctx.fillText('1. Tính: 6000 × 5 = .................', 60, 180);
    ctx.fillStyle = '#aa0088'; ctx.fillText('30000', 450, 250);
    const clean = app.worksheetLocalImport.cleanCanvas(canvas, true);
    const pixels = clean.getContext('2d').getImageData(440, 210, 250, 60).data;
    const colored = Array.from(pixels).some((_, i) => i % 4 === 0 && pixels[i + 1] < pixels[i] - 24);
    const doc = await app.worksheetLocalImport.readCanvas(canvas, 'bai.png');
    return { colored, text: doc.pages.flatMap(p => p.blocks.map(b => b.text)).join('\n'), answers: doc.pages.flatMap(p => p.blocks.map(b => b.answer)) };
  });
  expect(result.colored).toBe(false);
  expect(result.text).toMatch(/6000/);
  expect(result.text).not.toContain('30000');
  expect(result.answers.every(answer => answer === '')).toBe(true);
  expect(ocrRequests.length).toBeGreaterThan(0);
  expect(ocrRequests.every(request=>new URL(request.url).hostname==='127.0.0.1'&&request.method==='GET')).toBe(true);
});

test('sửa bảng từng ô và giữ nhiều câu con khi lưu lại', async ({ page }) => {
  await openStudio(page);
  const doc = { title: 'Bảng hàng số', pages: [{ blocks: [{ kind: 'table', text: 'Hoàn thành bảng', columns: ['Viết số', 'Đọc số'], rows: [['30 078', '___']], parts: Array.from({ length: 6 }, (_, i) => ({ label: `${i + 1})`, text: 'Điền ___', lines: 1 })) }] }] };
  await page.locator('#ws-source-files').setInputFiles({ name: 'phieu.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await page.getByRole('button', { name: 'Đọc và dựng phiếu', exact: true }).click();
  await page.getByLabel('Hàng 1, cột 2', { exact: true }).fill('___ nghìn ___');
  await page.getByRole('button', { name: 'Thêm hàng', exact: true }).click();
  expect(await page.getByLabel('Hàng 1, cột 2', { exact: true }).evaluate(element=>getComputedStyle(element).textAlign)).toBe('center');
  await expect(page.getByLabel('Hàng 2, cột 1', { exact: true })).toHaveValue('___');
  await page.getByRole('button', { name: 'Xem bản in màu' }).click();
  await expect(page.locator('#ws-color-preview .ws-part')).toHaveCount(6);
  expect(await page.evaluate(() => app.worksheetStudio.doc.pages[0].blocks[0].rows[0][1])).toBe('___ nghìn ___');
});

test('học sinh giữ nháp khi nộp lỗi và nộp lại phiếu độc lập với điểm game', async ({ page }) => {
  await openStudio(page);
  await page.evaluate(() => {
    app.data.currentUser = { username: 'student', role: 'student' };
    app.router.open('worksheet-classroom-screen');
    app.worksheetClassroom.assignments = [{ id: 'assignment1', title: 'Luyện lại', document: { title: 'Luyện lại', pages: [{ blocks: [{ text: 'Điền ___', kind: 'question', lines: 2 }] }] } }];
    app.worksheetClassroom.submissions = [];
    window.rpcCalls = [];
    app.worksheetClassroom.client = () => ({ rpc: async (name, args) => {
      window.rpcCalls.push({ name, args });
      if (window.rpcCalls.length === 1) return { error: { message: 'offline' } };
      return { data: { id: 'submission1', assignment_id: args.p_assignment_id, answers: args.p_answers } };
    } });
    app.worksheetClassroom.openAssignment(0);
  });
  const answer = page.locator('[data-ws-answer="p0-b0-written"]');
  await answer.fill('Bài làm của em');
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Nộp phiếu cho giáo viên' }).click();
  await expect(page.locator('#worksheet-classroom-status')).toContainText('Nháp vẫn còn');
  expect(await page.evaluate(() => JSON.parse(app.safeStorage.getItem('worksheet-draft:student:assignment1'))['p0-b0-written'])).toBe('Bài làm của em');
  await page.getByRole('button', { name: 'Nộp phiếu cho giáo viên' }).click();
  await expect(answer).toBeDisabled();
  const calls = await page.evaluate(() => window.rpcCalls);
  expect(calls.map(call => call.name)).toEqual(['submit_freeform_worksheet', 'submit_freeform_worksheet']);
  expect(calls[1].args.p_answers['p0-b0-written']).toBe('Bài làm của em');
});

test('đọc PDF và DOCX trên thiết bị', async ({ page }) => {
  test.setTimeout(90000);
  await openStudio(page);
  const JSZip = require('jszip');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>1. Tính 30 078 + 2 = ___</w:t></w:r></w:p></w:body></w:document>');
  const word = await zip.generateAsync({ type: 'nodebuffer' });
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length 63 >>\nstream\nBT /F1 24 Tf 50 300 Td (1. Tinh: 6000 x 5 = ..........) Tj ET\nendstream'
  ];
  let pdf = '%PDF-1.4\n', offsets = [0];
  objects.forEach((obj, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  await page.locator('#ws-source-files').setInputFiles([{ name: 'bai.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: word }, { name: 'bai.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf) }]);
  await page.getByRole('button', { name: 'Đọc và dựng phiếu', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Hiệu chỉnh phiếu từ tài liệu' })).toBeVisible({ timeout: 60000 });
  expect(await page.evaluate(() => app.worksheetStudio.doc.pages.flatMap(p => p.blocks.map(b => b.text)).join('\n'))).toMatch(/30 078[\s\S]*6000/);
});

test('ảnh chụp tham chiếu cục bộ (QA tùy chọn)', async ({ page }, testInfo) => {
  test.skip(!process.env.WORKSHEET_QA_IMAGE, 'Cần đường dẫn ảnh cục bộ cho QA');
  test.setTimeout(120000);
  await openStudio(page);
  await page.locator('#ws-source-files').setInputFiles(process.env.WORKSHEET_QA_IMAGE);
  await page.getByRole('button', { name: 'Đọc và dựng phiếu', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Hiệu chỉnh phiếu từ tài liệu' })).toBeVisible({ timeout: 90000 });
  const doc = await page.evaluate(() => app.worksheetStudio.doc);
  require('node:fs').writeFileSync(testInfo.outputPath('ocr.json'),JSON.stringify(doc,null,2));
  const grid=await page.evaluate(()=>{const debug={};app.worksheetLocalImport.findSlantedGrid(app.worksheetLocalImport.sourcePages[0].prepared,debug);return debug;});
  require('node:fs').writeFileSync(testInfo.outputPath('grid.json'),JSON.stringify(grid,null,2));
  const cleaned = await page.evaluate(() => app.worksheetLocalImport.sourcePages[0].cleaned.toDataURL('image/png'));
  await testInfo.attach('cleaned.png', { body: Buffer.from(cleaned.split(',')[1], 'base64'), contentType: 'image/png' });
  await testInfo.attach('ocr-local.json', { body: Buffer.from(JSON.stringify(doc, null, 2)), contentType: 'application/json' });
  await page.getByRole('button', { name: 'Xem bản in màu' }).click();
  const paper=await page.locator('#ws-color-preview').evaluate(element=>element.outerHTML);
  await page.setContent(`<link rel="stylesheet" href="http://127.0.0.1:${process.env.TEST_PORT || 4173}/src/style.css"><style>html,body{position:static;height:auto;overflow:visible;background:white}</style><main style="background:white;padding:20px">${paper}</main>`);
  await page.locator('#ws-color-preview').screenshot({ path: testInfo.outputPath('print.png') });
  expect(doc.pages.length).toBeGreaterThan(0);
});

test('phiếu tự do in màu A4 và giữ đáp án ngoài bản in', async ({ page }) => {
  await openStudio(page);
  await page.evaluate(() => {
    app.data.worksheets=[WorksheetDocument.toRecord({title:'Phiếu in riêng',theme:'sun',pages:[{blocks:[{kind:'question',text:'Tính 6 000 × 5 = ___',lines:3,answer:'SECRET'}]}]})];
    app.admin.viewWorksheet(0);
  });
  const popupPromise=page.waitForEvent('popup');
  await page.getByRole('button',{name:'Xuất PDF / A4',exact:true}).click();
  const printPage=await popupPromise;
  await printPage.waitForLoadState('load');
  await printPage.emulateMedia({media:'print'});
  await expect(printPage.locator('body > #print-document')).toBeVisible();
  await expect(printPage.locator('#print-document')).toContainText('Phiếu in riêng');
  await expect(printPage.locator('#print-document')).not.toContainText('SECRET');
  expect(await printPage.locator('.ws-paper-header').evaluate(element=>getComputedStyle(element).printColorAdjust)).toBe('exact');
  const pdf=await printPage.pdf({format:'A4',printBackground:true});
  expect(pdf.length).toBeGreaterThan(1000);
});


test('hai trang nguồn giữ hai trang dù có nhiều tiêu đề; metadata và xóa tiêu đề được lưu', async ({ page }) => {
  await openStudio(page);
  await page.locator('#ws-source-files').setInputFiles([
    { name: 'trang1.txt', mimeType: 'text/plain', buffer: Buffer.from('BỘ CHỮ SỐ BÍ ẨN\nPHIẾU HỌC TẬP SỐ 1\n1. Viết số 30078') },
    { name: 'trang2.txt', mimeType: 'text/plain', buffer: Buffer.from("PHIẾU: HỌC '©TẬP Số 2\n1. Nêu giá trị chữ số 234139\nPHIẾU HỌC TẬP SỐ 3\n1. Phát biểu nào đúng?\nA. Đúng\nB. Sai") }
  ]);
  await page.getByRole('button', { name: 'Đọc và dựng phiếu', exact: true }).click();
  await expect(page.locator('.ws-editor-page')).toHaveCount(2);
  expect(await page.evaluate(() => app.worksheetStudio.doc.pages[1].blocks.filter(b => b.kind === 'text').map(b => b.text))).toEqual(['PHIẾU HỌC TẬP SỐ 3']);
  await page.getByLabel('Chủ đề (tùy chọn)', { exact: true }).fill('Số tự nhiên');
  await page.getByLabel('Bài học (tùy chọn)', { exact: true }).fill('Hàng và lớp');
  await page.getByRole('button', { name: 'Xóa tiêu đề', exact: true }).first().click();
  await expect(page.locator('#ws-page-title-0')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Bỏ bài', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Xem bản in màu' }).click();
  await expect(page.locator('#ws-color-preview .ws-page')).toHaveCount(2);
  await expect(page.locator('#ws-color-preview .ws-page').first().locator('.ws-group-title')).toHaveCount(0);
  await expect(page.locator('#ws-color-preview .ws-paper-context').first()).toHaveText('Số tự nhiên · Hàng và lớp');
  await page.getByRole('button', { name: 'Lưu phiếu học tập', exact: true }).click();
  await expect.poll(() => page.evaluate(() => app.data.worksheets.length)).toBe(1);
  await page.evaluate(() => app.worksheetStudio.edit(app.data.worksheets[0], 0));
  await expect(page.getByLabel('Chủ đề (tùy chọn)', { exact: true })).toHaveValue('Số tự nhiên');
  await expect(page.getByLabel('Bài học (tùy chọn)', { exact: true })).toHaveValue('Hàng và lớp');
  await expect(page.locator('#ws-page-title-0')).toBeDisabled();
  await page.getByRole('button', { name: 'Thêm tiêu đề', exact: true }).click();
  await expect(page.locator('#ws-page-title-0')).toBeEnabled();
});

for (const theme of ['light', 'dark']) {
  test(`bảng và màu phiếu hiển thị rõ trong chế độ ${theme}`, async ({ page }, testInfo) => {
    await openStudio(page);
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      app.worksheetStudio.doc = WorksheetDocument.normalize({title:'Bảng giá trị', warnings:['Đối chiếu bản gốc'], pages:[{blocks:[{kind:'table',text:'Hoàn thành bảng',review:'Kiểm tra nét bút',columns:['Viết số','Hàng trăm nghìn'],rows:[['30 078','___']]}]}]});
      app.worksheetStudio.renderEditor();
    }, theme);
    await expect(page.getByLabel('Tên cột 2', { exact: true })).toHaveValue('Hàng trăm nghìn');
    await expect(page.getByLabel('Tên cột 2', { exact: true })).toHaveCSS('font-weight', '800');
    await expect(page.getByLabel('Hàng 1, cột 1', { exact: true })).toHaveCSS('text-align', 'center');
    await expect(page.locator('#admin-w-subarea .ws-studio')).toHaveCSS('background-color', theme === 'light' ? 'rgb(243, 250, 255)' : 'rgb(19, 34, 56)');
    await expect(page.locator('.ws-editor-block .ws-review')).toHaveCSS('color', theme === 'light' ? 'rgb(98, 64, 13)' : 'rgb(255, 230, 184)');
    await expect(page.getByLabel('Hàng 1, cột 1', { exact: true })).toHaveCSS('color', theme === 'light' ? 'rgb(24, 42, 66)' : 'rgb(230, 239, 255)');
    await page.getByRole('button', { name: 'Xem bản in màu' }).click();
    await expect(page.locator('#ws-color-preview th').first()).toHaveCSS('font-weight', '800');
    await expect(page.locator('#ws-color-preview td').first()).toHaveCSS('text-align', 'center');
    await expect(page.locator('#ws-color-preview > .ws-page').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await testInfo.attach(`worksheet-${theme}`, {body: await page.locator('#admin-w-subarea .ws-studio').screenshot(),contentType:'image/png'});
  });
}


test('hai ảnh chụp tham chiếu giữ đúng hai trang nguồn (QA tùy chọn)', async ({ page }, testInfo) => {
  test.skip(!process.env.WORKSHEET_QA_IMAGE || !process.env.WORKSHEET_QA_IMAGE_2, 'Cần hai ảnh cục bộ cho QA');
  test.setTimeout(180000);
  await openStudio(page);
  await page.locator('#ws-source-files').setInputFiles([process.env.WORKSHEET_QA_IMAGE, process.env.WORKSHEET_QA_IMAGE_2]);
  await page.getByRole('button', { name: 'Đọc và dựng phiếu', exact: true }).click();
  await expect(page.locator('.ws-editor-page')).toHaveCount(2, {timeout:150000});
  const doc = await page.evaluate(() => app.worksheetStudio.doc);
  expect(doc.pages[0].blocks.some(b => b.kind === 'table')).toBe(true);
  expect(doc.pages[1].blocks.some(b => /234\s*139/.test(b.text))).toBe(true);
  await testInfo.attach('two-source-pages', {body:Buffer.from(JSON.stringify(doc,null,2)),contentType:'application/json'});
});
