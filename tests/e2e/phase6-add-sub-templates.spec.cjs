const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

function phase6Template(generatorKey, lesson, name, config = {}, questionType = 'Điền khuyết') {
  return {
    id: `phase6-${generatorKey}`,
    name,
    classlevel: 'Lớp 4',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: '5. Phép cộng và phép trừ',
    lesson,
    question_type: questionType,
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

test('Phase 6 Bài 22 giữ riêng phạm vi phép cộng trong editor và gameplay', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const template = phase6Template(
    'g4-m-add-sub-multi-digit',
    'g4-math-hk1-b22',
    'Bài 22 · Đặt tính cộng số nhiều chữ số',
    { minimumDigits: 5, maximumDigits: 6, operation: '+' }
  );
  await showTemplate(page, template);

  await expect(page.locator('#template-topic5-operation')).toBeVisible();
  await expect(page.locator('#template-topic5-operation')).toHaveValue('+');
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config)).toEqual({
    minimumDigits: 5,
    maximumDigits: 6,
    operation: '+',
    lesson: 'g4-math-hk1-b22'
  });

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog')).toContainText('Đặt tính');
  await page.keyboard.press('Escape');

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    return question.practiceRows.map(row => ({ operation: row.operation, valid: row.values[0] + row.values[1] === row.values[2] }));
  }, template);
  expect(gameplay).toEqual([
    { operation: '+', valid: true }, { operation: '+', valid: true },
    { operation: '+', valid: true }, { operation: '+', valid: true }
  ]);
});

test('Phase 6 Bài 24 và Bài 26 có cấu hình chuyên biệt, Preview và gameplay', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const propertyTemplate = phase6Template(
    'g4-m-addition-property-fill',
    'g4-math-hk1-b24',
    'Bài 24 · Tính chất phép cộng',
    { properties: ['commutative'] }
  );
  await showTemplate(page, propertyTemplate);
  await expect(page.locator('.template-editor__rule--phase6-controls')).toBeVisible();
  await expect(page.locator('#template-phase6-properties input:checked')).toHaveCount(1);
  await expect(page.locator('#template-phase6-properties input:checked')).toHaveValue('commutative');
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.properties)).toEqual(['commutative']);

  const reviewTemplate = phase6Template(
    'number.hk1_review_b22_b25',
    'g4-math-hk1-b26',
    'Bài 26 · Ôn tập cộng và trừ',
    { skills: ['b22', 'b23', 'b24', 'b25'] },
    'Trắc nghiệm'
  );
  await showTemplate(page, reviewTemplate);
  await expect(page.locator('#template-generator')).toHaveValue('number.hk1_review_b22_b25');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b26');
  await expect(page.locator('.template-editor__rule--phase6-controls')).toBeVisible();
  await expect(page.locator('#template-phase6-review-skills input:checked')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.skills)).toEqual(['b22', 'b23', 'b24', 'b25']);

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Bài 22');
  await page.locator('#template-preview-back').click();

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    app.game.state.questions = [question];
    app.game.state.currentIdx = 0;
    app.game.state.score = 0;
    app.game.loadQuestion();
    return question.subquestions.map(item => ({ skill: item.skill, lesson: item.lesson, options: item.options.length }));
  }, reviewTemplate);
  expect(gameplay).toEqual([
    { skill: 'b22', lesson: 'g4-math-hk1-b22', options: 4 },
    { skill: 'b23', lesson: 'g4-math-hk1-b23', options: 4 },
    { skill: 'b24', lesson: 'g4-math-hk1-b24', options: 4 },
    { skill: 'b25', lesson: 'g4-math-hk1-b25', options: 4 }
  ]);
  await expect(page.locator('#game-options-container .multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('#game-options-container .multi-choice-subquestion__option')).toHaveCount(16);
  await expect(page.locator('#game-options-container')).not.toContainText('undefined');
});
