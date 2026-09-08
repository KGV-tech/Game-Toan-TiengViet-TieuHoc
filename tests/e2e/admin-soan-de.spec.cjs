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
  await page.evaluate(() => app.admin.openComposer());

  await expect(page.locator('#admin-compose-screen')).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: 'Soạn Đề' }).first()).toBeVisible();
  await expect(page.locator('#admin-compose-quickstart')).toContainText('Hôm nay cô muốn làm gì?');
  await expect(page.locator('#admin-compose-steps')).toContainText('CÁC BƯỚC SOẠN ĐỀ');
  await expect(page.locator('#admin-compose-quickstart')).toHaveCount(1);
  await expect(page.locator('#admin-compose-period')).toHaveValue('Học Kỳ 1');
  await expect(page.locator('#admin-compose-period option')).toHaveText(['Học Kỳ 1', 'Học Kỳ 2', 'Cả Năm']);
  await expect(page.locator('.admin-compose-card')).toHaveCount(3);
  await expect(page.locator('.admin-compose-card__metrics')).toHaveCount(3);
  await expect(page.locator('#admin-compose-screen')).toContainText('học sinh vẫn làm bài ở trạm Luyện Đề');

  await page.locator('#admin-compose-period').selectOption('Cả Năm');
  await expect(page.locator('#admin-compose-context')).toContainText('Cả Năm');

  await page.getByRole('button', { name: /Câu Hỏi/ }).first().click();
  await expect(page.locator('.admin-compose-card--questions')).toHaveClass(/is-selected/);
  await expect(page.locator('#admin-compose-module-panel')).toHaveAttribute('data-module', 'questions');
  await expect(page.locator('#admin-compose-module-panel')).toContainText('Câu Hỏi');

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
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

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
