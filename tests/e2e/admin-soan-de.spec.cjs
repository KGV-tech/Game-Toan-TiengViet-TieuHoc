const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  const consoleErrors = [];
  const supabaseRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.url().includes('.supabase.co')) supabaseRequests.push(request.url());
  });
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
  return { consoleErrors, supabaseRequests };
}

test('Admin mở Soạn Đề với quick start, thẻ thống kê và bộ lọc Thời gian', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = Array.from({ length: 36 }, () => ({}));
    app.data.libraryQuestions = Array.from({ length: 142 }, () => ({}));
    app.data.exams = Array.from({ length: 18 }, () => ({}));
    app.admin.openComposer();
  });

  await page.evaluate(() => {
    app.router.open('map-screen');
    document.querySelector('#exam-station')?.click();
  });
  await expect.poll(() => page.locator('#admin-compose-screen').evaluate(element => element.classList.contains('active'))).toBe(true);
  await expect(page.locator('#exam-station-label')).toHaveText('Soạn Đề');
  await expect(page.locator('#exam-station-image')).toHaveAttribute('src', /soan-de\.png$/);
  await page.evaluate(() => app.admin.openComposer());

  await expect(page.locator('#admin-compose-screen')).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: 'Soạn Đề' }).first()).toBeVisible();
  await expect(page.locator('#admin-compose-quickstart')).toContainText('Hôm nay cô muốn làm gì?');
  await expect(page.locator('#admin-compose-steps')).toContainText('CÁC BƯỚC SOẠN ĐỀ');
  await expect(page.locator('#admin-compose-quickstart')).toHaveCount(1);
  await expect(page.locator('#admin-compose-class')).toHaveValue('Lớp 4');
  await expect(page.locator('#admin-compose-continue')).toHaveCount(0);
  await expect(page.locator('.admin-compose-quickstart-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /Soạn template/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Soạn câu hỏi/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Soạn Đề/ }).first()).toBeVisible();
  await expect(page.locator('#admin-compose-period')).toHaveValue('Học Kỳ 1');
  await expect(page.locator('#admin-compose-period option')).toHaveText(['Học Kỳ 1', 'Học Kỳ 2', 'Cả Năm']);
  await expect(page.locator('.admin-compose-card')).toHaveCount(3);
  await expect(page.locator('.admin-compose-card__metrics')).toHaveCount(3);
  await expect(page.locator('#admin-compose-screen')).toContainText('Học sinh vẫn dùng trạm Luyện Đề');

  await page.locator('#admin-compose-period').selectOption('Cả Năm');
  await expect(page.locator('#admin-compose-context')).toContainText('Cả Năm');

  await page.getByRole('button', { name: /Câu Hỏi/ }).first().click();
  await expect(page.locator('.admin-compose-card--questions')).toHaveClass(/is-selected/);
  await expect(page.locator('#admin-compose-module-panel')).toHaveAttribute('data-module', 'questions');
  await expect(page.locator('#admin-compose-module-panel')).toContainText('Câu Hỏi');

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Kho template dùng thẻ trực quan, có tạo mới và Preview khung câu hỏi', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = [{
      id: 'template-preview-demo', name: 'Nhận biết chữ số theo hàng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01', question_type: 'Trắc nghiệm',
      generator_key: 'number.digit_at_place', prompt_template: 'Số nào dưới đây có chữ số hàng {place} là {digit}?',
      config: { minimum: 10000, maximum: 99999, allowedPlaces: ['tens'], allowedDigits: [4] }, is_active: true
    }];
    app.admin.openComposer('templates');
  });

  await expect(page.locator('.template-library')).toBeVisible();
  await expect(page.locator('.template-library-card')).toHaveCount(1);
  await expect(page.locator('#btn-template-create')).toBeVisible();
  await expect(page.locator('.template-library-card h4')).toHaveText('Nhận biết chữ số theo hàng');

  await page.locator('#btn-template-create').click();
  await expect(page.locator('#template-editor-title')).toHaveText('Tạo template mới');
  await expect(page.locator('#template-example')).not.toContainText('Giao diện khi học sinh làm bài');
  await expect(page.locator('.template-editor__preview-image')).toHaveCount(0);
  await expect(page.locator('#template-preview-open')).toBeVisible();

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('.template-preview-dialog__close')).toBeFocused();
  await expect(page.locator('#template-preview-dialog .template-preview__canvas')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__choices').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '1. Đề mới' })).toBeVisible();
  await expect(page.getByRole('button', { name: '2. Đề có sẵn' })).toBeVisible();
  await expect(page.locator('#template-preview-back')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#template-preview-dialog')).toBeHidden();
});

test('Soạn Đề chỉ mở cho Admin và trạm đề vẫn là Luyện Đề với học sinh', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  const studentResult = await page.evaluate(() => {
    app.data.currentUser = { username: 'student', fullname: 'Học sinh', role: 'student' };
    const result = app.admin.openComposer();
    return { result, active: document.querySelector('#admin-compose-screen')?.classList.contains('active') };
  });
  expect(studentResult).toEqual({ result: false, active: false });

  await page.evaluate(() => {
    app.data.currentUser = { username: 'student', fullname: 'Học sinh', role: 'student' };
    app.router.open('map-screen');
    document.querySelector('.station-practice')?.click();
  });
  await expect.poll(() => page.locator('#exam-select-screen').evaluate(element => element.classList.contains('active'))).toBe(true);
  await expect(page.locator('#exam-station-label')).toHaveText('Luyện Đề');
  await expect(page.locator('#exam-station-image')).toHaveAttribute('src', /luyen-de\.png$/);

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
