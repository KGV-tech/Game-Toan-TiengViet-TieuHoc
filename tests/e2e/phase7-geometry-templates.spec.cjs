const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

function template(generatorKey, lesson, name, config = {}) {
  return {
    id: `phase7-${generatorKey}`,
    name,
    classlevel: 'Lớp 4',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: '6. Đường thẳng vuông góc. Đường thẳng song song',
    lesson,
    question_type: 'Trắc nghiệm',
    generator_key: generatorKey,
    prompt_template: '{question}',
    config,
    is_active: true
  };
}

async function showTemplate(page, data) {
  await page.evaluate(templateData => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = [templateData];
    app.admin.openComposer('templates');
    app.admin.renderTemplateForm(0);
  }, data);
}

test('Phase 7 Bài 31 hiển thị cấu hình hình học, Preview SVG và gameplay', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const data = template('g4-m-quad-classify', 'g4-math-hk1-b31', 'Bài 31 · Hình thoi', { allowedShapes: ['rhombus'] });
  await showTemplate(page, data);

  await expect(page.locator('.template-editor__rule--phase7-controls')).toBeVisible();
  await expect(page.locator('#template-phase7-quad-kinds input:checked')).toHaveCount(1);
  await expect(page.locator('#template-phase7-quad-kinds input:checked')).toHaveValue('rhombus');
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config)).toEqual({
    allowedShapes: ['rhombus'],
    lesson: 'g4-math-hk1-b31'
  });

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__subquestion-visual .geometry-visual')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Bài 31');
  await page.keyboard.press('Escape');

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    app.game.state.questions = [question];
    app.game.state.currentIdx = 0;
    app.game.state.score = 0;
    app.game.loadQuestion();
    return {
      shapes: question.subquestions.map(item => item.geometry.shapeKind),
      visuals: question.subquestions.filter(item => /^<svg\b/i.test(item.visual)).length,
      options: question.subquestions.map(item => item.options.length)
    };
  }, data);
  expect(gameplay).toEqual({ shapes: ['rhombus', 'rhombus', 'rhombus', 'rhombus'], visuals: 4, options: [4, 4, 4, 4] });
  await expect(page.locator('#game-options-container .multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('#game-options-container .multi-choice-subquestion__visual .geometry-visual')).toHaveCount(4);
  await expect(page.locator('#game-options-container')).not.toContainText('undefined');
});

test('Phase 7 Bài 32 giữ một skill hình học trên tablet ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const skills = ['b27', 'b28', 'b29', 'b31'];
  const data = template('geometry.hk1_review_b27_b31', 'g4-math-hk1-b32', 'Bài 32 · Ôn tập hình học', { skills });
  await showTemplate(page, data);

  await expect(page.locator('#template-generator')).toHaveValue('geometry.hk1_review_b27_b31');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b32');
  await expect(page.locator('.template-editor__rule--phase7-controls')).toBeVisible();
  await expect(page.locator('#template-phase7-review-skills input:checked')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.skills)).toEqual(skills);

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__subquestion-visual .geometry-visual')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText(/Bài (27|28|29|30|31)/);
  await page.locator('#template-preview-back').click();

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    return question.subquestions.map(item => ({ skill: item.skill, lesson: item.lesson, geometry: item.geometry.mode || item.geometry.shapeKind }));
  }, data);
  expect(gameplay).toHaveLength(4);
  expect(new Set(gameplay.map(item => item.skill)).size).toBe(1);
  expect(skills).toContain(gameplay[0].skill);
  expect(gameplay.every(item => item.lesson === `g4-math-hk1-${gameplay[0].skill}`)).toBe(true);
});
