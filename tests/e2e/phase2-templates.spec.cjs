const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

test('Admin chỉnh được template Phase 2 với preview và cấu hình đúng Bài học', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.questionTemplates = [{
      id: 'phase2-b03-count',
      name: 'Bài 3 · Đếm số chẵn, số lẻ trong dãy',
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b03',
      question_type: 'Trắc nghiệm', generator_key: 'number.even_odd_count',
      prompt_template: '{question}',
      config: { minimum: 0, maximum: 9999, listLengthMin: 6, listLengthMax: 8, parities: ['even', 'odd'] },
      is_active: true
    }];
    app.admin.renderTemplateForm(0);
    document.getElementById('treasure-modal').style.display = 'block';
  });

  await expect(page.locator('#template-generator')).toHaveValue('number.even_odd_count');
  await expect(page.locator('#template-question-type')).toHaveValue('Trắc nghiệm');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b03');
  await expect(page.locator('.template-editor__rule--phase2-controls')).toBeVisible();
  await expect(page.locator('#template-example')).toContainText('Đếm số chẵn, số lẻ');
  await expect(page.locator('#template-variables')).toHaveCount(0);

  const config = await page.evaluate(() => app.admin.collectTemplateForm().config);
  expect(config).toMatchObject({
    minimum: 0,
    maximum: 9999,
    listLengthMin: 6,
    listLengthMax: 8,
    parities: ['even', 'odd']
  });

  await page.locator('#template-generator').selectOption('number.variable_expression_value');
  await expect(page.locator('#template-question-type')).toHaveValue('Điền khuyết');
  await expect(page.locator('#template-example')).toContainText('Tính giá trị biểu thức chứa chữ');
  await expect(page.locator('#template-variables')).toHaveCount(0);
  await expect(page.locator('#template-phase2-variable-minimum')).toBeEnabled();
  await expect(page.locator('#template-phase2-minimum')).toBeDisabled();
});
