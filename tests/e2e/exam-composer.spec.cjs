const { test, expect } = require('@playwright/test');

async function openExamComposer(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.exams = [];
    app.admin.openAdmin();
    app.admin.switchTab('exams');
    app.admin.renderESubTab('add');
  });
}

test('Soạn đề chỉ hiện chủ đề của học kỳ đã chọn và Cả năm gộp hai học kỳ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  const topics = await page.evaluate(() => app.constants.topics['5'].math);

  await expect(page.locator('#add-e-topics')).toBeVisible();
  const hk1Topics = await page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value));
  expect(hk1Topics).toEqual(topics.hk1);

  await page.locator('#add-e-period').selectOption('Cuối kỳ 2');
  await expect.poll(() => page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value))).toEqual(topics.hk2);

  await page.locator('#add-e-period').selectOption('Cả năm');
  await expect.poll(() => page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value))).toEqual([
    ...topics.hk1,
    ...topics.hk2
  ]);
});
