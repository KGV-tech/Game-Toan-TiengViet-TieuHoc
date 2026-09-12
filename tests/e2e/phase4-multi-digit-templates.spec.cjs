const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

function phase4Template(generatorKey, lesson, name, config = {}) {
  return {
    id: `phase4-${generatorKey}`,
    name,
    classlevel: 'Lớp 4',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: '3. Số có nhiều chữ số',
    lesson,
    question_type: 'Trắc nghiệm',
    generator_key: generatorKey,
    prompt_template: '{question}',
    config,
    is_active: true
  };
}

async function showTemplate(page, template) {
  await page.evaluate(templateData => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = [templateData];
    app.admin.openComposer('templates');
    app.admin.renderTemplateForm(0);
  }, template);
}

test('Phase 4 B10 hiển thị Preview và gameplay bốn câu lập/đọc số sáu chữ số', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const template = phase4Template(
    'number.six_digit_numbers',
    'g4-math-hk1-b10',
    'Bài 10 · Lập và đọc số sáu chữ số',
    { minimum: 100000, maximum: 999999, modes: ['compose', 'read', 'million', 'digit'] }
  );
  await showTemplate(page, template);

  await expect(page.locator('#template-generator')).toHaveValue('number.six_digit_numbers');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b10');
  await expect(page.locator('#template-example')).toContainText('Lập và đọc số sáu chữ số');

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog .template-preview__choices')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).not.toContainText('undefined');
  await page.keyboard.press('Escape');
  await expect(page.locator('#template-preview-dialog')).toBeHidden();

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    app.game.state.questions = [question];
    app.game.state.currentIdx = 0;
    app.game.state.score = 0;
    app.game.loadQuestion();
    return {
      subquestions: question.subquestions.length,
      answers: question.ans.split(', ').length,
      modes: question.subquestions.map(item => item.mode)
    };
  }, template);
  expect(gameplay).toMatchObject({ subquestions: 4, answers: 4 });
  expect(gameplay.modes).toHaveLength(4);
  expect(new Set(gameplay.modes).size).toBe(1);
  expect(['compose', 'read', 'million', 'digit']).toContain(gameplay.modes[0]);
  await expect(page.locator('#game-options-container .multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('#game-options-container .multi-choice-subquestion__option')).toHaveCount(16);
  await expect(page.locator('#game-options-container')).not.toContainText('undefined');
});

test('Phase 4 B13 và B16 giữ một dạng review, Preview và bố cục tablet ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const roundTemplate = phase4Template(
    'number.round_hundred_thousands',
    'g4-math-hk1-b13',
    'Bài 13 · Làm tròn đến hàng trăm nghìn',
    { minimum: 100000, maximum: 999999999, modes: ['round', 'round', 'round', 'rule'] }
  );
  await showTemplate(page, roundTemplate);
  await expect(page.locator('#template-generator')).toHaveValue('number.round_hundred_thousands');
  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog .template-preview__choices')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).not.toContainText('undefined');
  await page.locator('#template-preview-back').click();

  const reviewTemplate = phase4Template(
    'number.hk1_review_b10_b15',
    'g4-math-hk1-b16',
    'Bài 16 · Ôn tập số nhiều chữ số · Nền tảng',
    { skills: ['b10', 'b11', 'b12', 'b13'] }
  );
  await showTemplate(page, reviewTemplate);
  await expect(page.locator('.template-editor__rule--phase4-controls')).toBeVisible();
  await expect(page.locator('#template-phase4-skills input:checked')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.skills)).toEqual(['b10', 'b11', 'b12', 'b13']);
  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    app.game.state.questions = [question];
    app.game.state.currentIdx = 0;
    app.game.state.score = 0;
    app.game.loadQuestion();
    return question.subquestions.map(item => ({ skill: item.skill, lesson: item.lesson }));
  }, reviewTemplate);
  expect(gameplay).toHaveLength(4);
  expect(new Set(gameplay.map(item => item.skill)).size).toBe(1);
  expect(['b10', 'b11', 'b12', 'b13']).toContain(gameplay[0].skill);
  expect(gameplay.every(item => item.lesson === `g4-math-hk1-${gameplay[0].skill}`)).toBe(true);
  await expect(page.locator('#game-options-container .multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('#game-options-container .multi-choice-subquestion__option')).toHaveCount(16);
  await expect(page.locator('#game-options-container')).not.toContainText('undefined');
});
