const { test, expect } = require('@playwright/test');

async function openWorksheetLibrary(page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', role: 'admin' };
    app.data.exams = [{ name: 'Đề kiểm tra không được hiện ở đây', classlevel: 'Lớp 5', subject: 'Toán', questions: [] }];
    app.data.worksheets = [
      { name: 'Phiếu phân số', classlevel: 'Lớp 5', subject: 'Toán', period: 'Học Kỳ 1', questions: Array.from({ length: 3 }, () => ({ topic: 'Phân số' })) },
      { name: 'Phiếu đọc hiểu', classlevel: 'Lớp 4', subject: 'Tiếng Việt', period: 'Học Kỳ 2', questions: Array.from({ length: 10 }, () => ({ topic: 'Đọc hiểu' })) }
    ];
    app.admin.openComposer('worksheets');
  });
}

test('kho Phiếu học tập chỉ dùng dữ liệu phiếu và giữ các thao tác độc lập với kho Đề', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openWorksheetLibrary(page);

  await expect(page.getByRole('region', { name: 'Thư viện phiếu', exact: true })).toBeVisible();
  await expect(page.getByLabel('Tìm trong thư viện phiếu')).toBeVisible();
  await expect(page.locator('.exam-library-card')).toHaveCount(2);
  await expect(page.locator('#w-library-results')).not.toContainText('Đề kiểm tra không được hiện ở đây');
  await page.getByLabel('Tìm trong thư viện phiếu').fill('DOC HIEU');
  await expect(page.locator('.exam-library-card')).toHaveCount(1);

  await page.evaluate(() => { app.admin.editWorksheet = index => { window.editedWorksheet = index; }; });
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  expect(await page.evaluate(() => window.editedWorksheet)).toBe(1);

  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await page.evaluate(() => { app.data.saveWorksheets = () => {}; });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Xóa phiếu', exact: true }).nth(1).click();
  expect(await page.evaluate(() => app.data.worksheets.map(worksheet => worksheet.name))).toEqual(['Phiếu phân số']);
  expect(await page.evaluate(() => app.data.exams.map(exam => exam.name))).toEqual(['Đề kiểm tra không được hiện ở đây']);
  expect(errors).toEqual([]);
});

test('chi tiết Phiếu học tập dùng nhãn in và trạng thái trống riêng', async ({ page }) => {
  await openWorksheetLibrary(page, 1024, 768);
  await page.evaluate(() => {
    app.data.worksheets = [{ name: 'Phiếu trống', classlevel: 'Lớp 4', subject: 'Toán', questions: [] }];
    app.admin.renderWSubTab('lib');
  });

  await page.getByRole('button', { name: 'Xem phiếu', exact: true }).click();
  await expect(page.locator('#print-area')).toHaveAttribute('aria-label', 'Nội dung phiếu học tập');
  await expect(page.locator('#print-area')).toContainText('Phiếu học tập này chưa có câu hỏi nào.');
  expect(await page.locator('#print-area').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test('công cụ Excel của Phiếu gọi riêng các hàm của Phiếu', async ({ page }) => {
  await openWorksheetLibrary(page);
  const calls = await page.evaluate(() => {
    const calls = [];
    app.admin.downloadWorksheetTemplate = () => calls.push('worksheet-template');
    app.admin.exportWorksheets = () => calls.push('worksheet-export');
    app.admin.downloadETemplate = () => calls.push('exam-template');
    app.admin.exportExams = () => calls.push('exam-export');
    app.admin.renderWSubTab('tpl');
    app.admin.renderWSubTab('exp');
    return calls;
  });
  expect(calls).toEqual(['worksheet-template', 'worksheet-export']);
  await page.evaluate(() => app.admin.renderWSubTab('imp'));
  await expect(page.getByRole('heading', { name: 'Nhập phiếu học tập từ Excel (.xlsx)' })).toBeVisible();
  await expect(page.locator('#w-file-upload')).toBeVisible();
});

test('Phiếu học tập được khôi phục và lưu độc lập với Đề kiểm tra', async ({ page }) => {
  await openWorksheetLibrary(page);

  const result = await page.evaluate(async () => {
    const worksheet = {
      name: 'Phiếu lưu độc lập', classlevel: 'Lớp 4', subject: 'Toán', period: 'Học Kỳ 1',
      topics: ['Phân số'], questions: [{ q: '1/2 + 1/2 =', ans: '1', type: 'Điền khuyết' }]
    };
    app.data.exams = [{ name: 'Đề không bị thay đổi', questions: [] }];
    app.data.worksheets = [worksheet];
    await app.data.saveWorksheets();
    return {
      worksheetLocal: JSON.parse(localStorage.getItem('game_worksheets')),
      exams: app.data.exams.map(exam => exam.name),
      restored: app.data.loadLocalWorksheets().map(item => item.name)
    };
  });

  expect(result.worksheetLocal[0].name).toBe('Phiếu lưu độc lập');
  expect(result.restored).toEqual(['Phiếu lưu độc lập']);
  expect(result.exams).toEqual(['Đề không bị thay đổi']);
});

test('form Phiếu học tập dùng thông báo lỗi riêng', async ({ page }) => {
  await openWorksheetLibrary(page);
  await page.evaluate(() => app.admin.renderWSubTab('add'));

  await page.getByRole('button', { name: 'Tạo phiếu học tập' }).click();
  await expect(page.locator('#add-w-form-error')).toContainText('Tên phiếu học tập');
  await expect(page.locator('#add-w-form-error')).not.toContainText('Tên đề');
  await expect(page.locator('#add-w-name')).toHaveAttribute('aria-invalid', 'true');
});

test('đồng bộ Phiếu thêm sửa xóa chỉ dùng game_worksheets và giữ ID đã lưu khi lỗi', async ({ page }) => {
  await openWorksheetLibrary(page);
  const result = await page.evaluate(async () => {
    const calls = [];
    let insertCount = 0;
    let failSecond = true;
    window.supabase = {};
    supabaseClient = {
      from(table) {
        const builder = {
          operation: '', row: null, id: null,
          insert(row) { this.operation = 'insert'; this.row = row; return this; },
          update(row) { this.operation = 'update'; this.row = row; return this; },
          delete() { this.operation = 'delete'; return this; },
          eq(column, id) { this.id = id; return this; },
          in(column, ids) { this.ids = ids; calls.push({ table, operation: this.operation, ids }); return this; },
          then(resolve, reject) { return Promise.resolve({ data: (this.ids || []).map(id => ({ id })), error: null }).then(resolve, reject); },
          select() { return this; },
          async single() {
            calls.push({ table, operation: this.operation, id: this.id, row: this.row });
            if (this.operation === 'insert') {
              insertCount++;
              if (insertCount === 2 && failSecond) return { error: { message: 'offline' } };
              return { data: { id: 100 + insertCount }, error: null };
            }
            return { data: { id: this.id }, error: null };
          }
        };
        return builder;
      }
    };
    const examsBefore = JSON.stringify(app.data.exams);
    app.data.worksheets = [
      { name: 'Phiếu A', classlevel: 'Lớp 4', subject: 'Toán', period: 'Học Kỳ 1', topics: ['Chủ đề'], questions: [] },
      { name: 'Phiếu B', classlevel: 'Lớp 4', subject: 'Toán', period: 'Học Kỳ 1', questions: [] }
    ];
    const firstError = await app.data.saveWorksheets();
    const pending = app.data.loadPendingWorksheetSnapshot();
    failSecond = false;
    const retryError = await app.data.saveWorksheets();
    app.data.queueWorksheetDeletion(app.data.worksheets[0]);
    app.data.worksheets.splice(0, 1);
    const deleteError = await app.data.saveWorksheets();
    return {
      calls, firstError: firstError?.message, pending, retryError, deleteError,
      pendingAfter: app.data.loadPendingWorksheetSnapshot(), deletedAfter: app.data.loadWorksheetDeletedIds(),
      examsUnchanged: JSON.stringify(app.data.exams) === examsBefore
    };
  });
  expect(result.firstError).toBe('offline');
  expect(result.pending[0].id).toBe(101);
  expect(result.retryError).toBeNull();
  expect(result.deleteError).toBeNull();
  expect(result.pendingAfter).toBeNull();
  expect(result.deletedAfter).toEqual([]);
  expect(result.examsUnchanged).toBe(true);
  expect(result.calls.every(call => call.table === 'game_worksheets')).toBe(true);
  expect(result.calls.filter(call => call.operation === 'insert' && call.row.name === 'Phiếu A')).toHaveLength(1);
  expect(result.calls.find(call => call.operation === 'delete').ids).toEqual([101]);
  expect(result.calls.filter(call => call.row).every(call => !('topics' in call.row))).toBe(true);
});

test('tạo Phiếu từ form không sửa Kho Đề hoặc bổ sung vào Kho Câu hỏi', async ({ page }) => {
  await openWorksheetLibrary(page);
  await page.evaluate(() => {
    window.worksheetBankBefore = JSON.stringify(app.data.libraryQuestions);
    app.admin.worksheetComposerDraft = {
      name: 'Phiếu soạn từ form', classlevel: 'Lớp 4', subject: 'Toán', period: 'Học Kỳ 1',
      topics: ['Số có nhiều chữ số'],
      questions: Array.from({ length: 10 }, (_, index) => ({
        q: `${index + 1} + 1 = ?`, ans: String(index + 2), type: 'Điền khuyết',
        answerMode: 'single', topic: 'Số có nhiều chữ số', options: []
      }))
    };
    app.admin.renderWSubTab('add');
  });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Lưu chỉnh sửa', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Thư viện phiếu', exact: true })).toBeVisible();
  const result = await page.evaluate(() => ({
    saved: app.data.worksheets.find(item => item.name === 'Phiếu soạn từ form'),
    exams: app.data.exams.map(item => item.name),
    bankUnchanged: window.worksheetBankBefore === JSON.stringify(app.data.libraryQuestions),
    pending: app.admin.worksheetSavePending
  }));
  expect(result.saved.questions).toHaveLength(10);
  expect(result.exams).toEqual(['Đề kiểm tra không được hiện ở đây']);
  expect(result.bankUnchanged).toBe(true);
  expect(result.pending).toBe(false);
});

test('nhập Phiếu bỏ dòng hướng dẫn và không xóa kho khi file ghi đè không hợp lệ', async ({ page }) => {
  await openWorksheetLibrary(page);
  const result = await page.evaluate(async () => {
    const examBefore = JSON.stringify(app.data.exams);
    const worksheetBefore = JSON.stringify(app.data.worksheets);
    const alerts = [];
    window.confirm = () => true;
    window.alert = message => alerts.push(message);
    app.admin.renderWSubTab('imp');
    const input = document.getElementById('w-file-upload');
    const files = new DataTransfer();
    files.items.add(new File(['test'], 'phieu.xlsx'));
    input.files = files.files;
    document.querySelector('input[name="w-import-mode"][value="overwrite"]').checked = true;
    let rows = [{ 'Tên phiếu': 'Tên phiếu hướng dẫn', 'Môn': 'Nhập: Toán hoặc Tiếng Việt', 'Cấp lớp': 'Nhập: Lớp 1–5' }];
    app.ui.importFromExcel = (file, callback) => { window.importDone = callback(rows); };
    app.admin.submitImportWorksheets();
    await window.importDone;
    const invalidKeptStore = worksheetBefore === JSON.stringify(app.data.worksheets);
    rows.push({ 'Tên phiếu': 'Phiếu nhập hợp lệ', 'Môn': 'Toán', 'Cấp lớp': 'Lớp 4' });
    app.admin.submitImportWorksheets();
    await window.importDone;
    return { alerts, invalidKeptStore, names: app.data.worksheets.map(item => item.name), examsUnchanged: examBefore === JSON.stringify(app.data.exams) };
  });
  expect(result.invalidKeptStore).toBe(true);
  expect(result.names).toEqual(['Phiếu nhập hợp lệ']);
  expect(result.examsUnchanged).toBe(true);
  expect(result.alerts[0]).toContain('không có phiếu hợp lệ');
});
