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

test('Tạo đề tự động điền 10 câu theo các chủ đề đã chọn để giáo viên chỉnh sửa', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  await page.evaluate(() => {
    const topic = app.constants.topics['5'].math.hk1[0];
    app.data.libraryQuestions = Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 5', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'Trắc nghiệm', q: `Câu tự động ${index + 1}`, options: ['A', 'B'], ans: 'A', explanation: ''
    }));
  });
  await page.locator('#add-e-topics input').first().check();
  await page.getByRole('button', { name: 'Tạo đề tự động' }).click();
  await expect(page.locator('textarea[id^="add-e-q-q-"]')).toHaveCount(10);
  await expect.poll(() => page.locator('textarea[id^="add-e-q-q-"]').evaluateAll(items => items.map(item => item.value))).toEqual(expect.arrayContaining(['Câu tự động 1', 'Câu tự động 10']));
});
