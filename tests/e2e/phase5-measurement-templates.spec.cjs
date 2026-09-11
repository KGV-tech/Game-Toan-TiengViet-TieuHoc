const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

function phase5Template(generatorKey, lesson, name, config = {}) {
  return {
    id: `phase5-${generatorKey}`,
    name,
    classlevel: 'Lớp 4',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: '4. Một số đơn vị đo Đại lượng',
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

test('Phase 5 Bài 17 cho phép khóa dạng đổi khối lượng trong editor', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const template = phase5Template(
    'measurement.mass_unit_convert',
    'g4-math-hk1-b17',
    'Bài 17 · Đổi đơn vị khối lượng',
    { allowedKinds: ['taToKg'] }
  );
  template.question_type = 'Điền khuyết';
  await showTemplate(page, template);

  await expect(page.locator('.template-editor__rule--measurement-controls')).toBeVisible();
  await expect(page.locator('#template-measurement-mass-kinds input:checked')).toHaveCount(1);
  await expect(page.locator('#template-measurement-mass-kinds input:checked')).toHaveValue('taToKg');
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.allowedKinds)).toEqual(['taToKg']);

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    return question.practiceRows.map(row => row.kind);
  }, template);
  expect(gameplay).toEqual(['taToKg', 'taToKg', 'taToKg', 'taToKg']);
});

test('Phase 5 Bài 20 hiển thị phạm vi thực hành, Preview và gameplay trên laptop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const template = phase5Template(
    'measurement.practice_cards',
    'g4-math-hk1-b20',
    'Bài 20 · Thực hành đọc phiếu đo',
    { allowedKinds: ['mass', 'area', 'time', 'century'] }
  );
  await showTemplate(page, template);

  await expect(page.locator('#template-generator')).toHaveValue('measurement.practice_cards');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b20');
  await expect(page.locator('.template-editor__rule--phase5-controls')).toBeVisible();
  await expect(page.locator('#template-phase5-practice-kinds input:checked')).toHaveCount(4);
  await expect(page.locator('#template-phase5-review-skills input:checked')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.allowedKinds)).toEqual(['mass', 'area', 'time', 'century']);

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog .template-preview__choices')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Thực hành');
  await page.keyboard.press('Escape');

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    app.game.state.questions = [question];
    app.game.state.currentIdx = 0;
    app.game.state.score = 0;
    app.game.loadQuestion();
    return {
      kinds: question.subquestions.map(item => item.kind).sort(),
      answers: question.ans.split(', ').length,
      partAnswerCounts: question.partAnswerCounts
    };
  }, template);
  expect(gameplay).toEqual({
    kinds: ['area', 'century', 'mass', 'time'],
    answers: 4,
    partAnswerCounts: [1, 1, 1, 1]
  });
  await expect(page.locator('#game-options-container .multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('#game-options-container .multi-choice-subquestion__option')).toHaveCount(16);
  await expect(page.locator('#game-options-container')).not.toContainText('undefined');
});

test('Phase 5 Bài 21 giữ đủ nhãn kỹ năng và bố cục tablet ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const template = phase5Template(
    'measurement.hk1_review_b17_b20',
    'g4-math-hk1-b21',
    'Bài 21 · Ôn tập đo lường',
    { skills: ['b17', 'b18', 'b19', 'b20'] }
  );
  await showTemplate(page, template);

  await expect(page.locator('#template-generator')).toHaveValue('measurement.hk1_review_b17_b20');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b21');
  await expect(page.locator('.template-editor__rule--phase5-controls')).toBeVisible();
  await expect(page.locator('#template-phase5-practice-kinds input:checked')).toHaveCount(4);
  await expect(page.locator('#template-phase5-review-skills input:checked')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.skills)).toEqual(['b17', 'b18', 'b19', 'b20']);

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Bài 17');
  await page.locator('#template-preview-back').click();

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    app.game.state.questions = [question];
    app.game.state.currentIdx = 0;
    app.game.state.score = 0;
    app.game.loadQuestion();
    return question.subquestions.map(item => ({ skill: item.skill, lesson: item.lesson }));
  }, template);
  expect(gameplay).toEqual([
    { skill: 'b17', lesson: 'g4-math-hk1-b17' },
    { skill: 'b18', lesson: 'g4-math-hk1-b18' },
    { skill: 'b19', lesson: 'g4-math-hk1-b19' },
    { skill: 'b20', lesson: 'g4-math-hk1-b20' }
  ]);
  await expect(page.locator('#game-options-container .multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('#game-options-container .multi-choice-subquestion__option')).toHaveCount(16);
  await expect(page.locator('#game-options-container')).not.toContainText('undefined');
});
