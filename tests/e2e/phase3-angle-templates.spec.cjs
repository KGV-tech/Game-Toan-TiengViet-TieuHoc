const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

function phase3Template(generatorKey, lesson, name) {
  return {
    id: `phase3-${generatorKey}`,
    name,
    classlevel: 'Lớp 4',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: '2. Góc và đơn vị đo góc',
    lesson,
    question_type: 'Trắc nghiệm',
    generator_key: generatorKey,
    prompt_template: '{question}',
    config: {},
    is_active: true
  };
}

test('Phase 3 B07 hiển thị thước đo trong Preview và khi học sinh làm bài', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const template = phase3Template('g4-m-angle-measure-read', 'g4-math-hk1-b07', 'Bài 7 · Đọc số đo góc');
  await page.evaluate(templateData => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = [templateData];
    app.admin.openComposer('templates');
    app.admin.renderTemplateForm(0);
  }, template);

  await expect(page.locator('#template-generator')).toHaveValue('g4-m-angle-measure-read');
  await expect(page.locator('#template-question-type')).toHaveValue('Trắc nghiệm');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b07');
  await expect(page.locator('#template-example')).toContainText('Đọc số đo góc');
  await expect(page.locator('#template-angle-degrees')).toBeVisible();
  await page.locator('#template-angle-degrees').fill('30, 60');
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.allowedDegrees)).toEqual([30, 60]);

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('.template-preview-dialog__close')).toBeFocused();
  await expect(page.locator('#template-preview-dialog .template-preview__subquestion-visual')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog svg[aria-label="Hình góc trên thước đo góc"]')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('#template-preview-dialog')).toBeHidden();

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    app.game.state.questions = [question];
    app.game.state.currentIdx = 0;
    app.game.state.score = 0;
    app.game.loadQuestion();
    return { subquestions: question.subquestions.length, answers: question.ans.split(', ').length };
  }, template);
  expect(gameplay).toEqual({ subquestions: 4, answers: 4 });
  await expect(page.locator('#game-options-container .multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('#game-options-container .multi-choice-subquestion__visual')).toHaveCount(4);
  await expect(page.locator('#game-options-container svg[aria-label="Hình góc trên thước đo góc"]')).toHaveCount(4);
  await expect(page.locator('#game-options-container button.multi-choice-subquestion__option')).toHaveCount(16);

  const visualWidth = await page.locator('#game-options-container .multi-choice-subquestion__visual').first().evaluate(element => ({
    visual: element.getBoundingClientRect().width,
    container: element.parentElement.getBoundingClientRect().width
  }));
  expect(visualWidth.visual).toBeLessThanOrEqual(visualWidth.container);
});

test('Phase 3 B09 giữ một dạng góc thống nhất trên tablet ngang và reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const template = phase3Template('g4-m-angle-review', 'g4-math-hk1-b09', 'Bài 9 · Ôn tập góc');
  await page.evaluate(templateData => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = [templateData];
    app.admin.openComposer('templates');
    app.admin.renderTemplateForm(0);
  }, template);

  await expect(page.locator('#template-generator')).toHaveValue('g4-m-angle-review');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b09');
  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  const measureVisuals = await page.locator('#template-preview-dialog svg[aria-label="Hình góc trên thước đo góc"]').count();
  const classifyVisuals = await page.locator('#template-preview-dialog svg[aria-label="Hình góc cần phân loại"]').count();
  expect([measureVisuals, classifyVisuals].sort((a, b) => a - b)).toEqual([0, 4]);
  await expect(page.locator('#template-preview-dialog .template-preview__choices')).toHaveCount(4);
});
