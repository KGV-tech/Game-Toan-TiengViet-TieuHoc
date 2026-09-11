const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

function template(generatorKey, lesson, name, config = {}) {
  return {
    id: `phase8-${generatorKey}`,
    name,
    classlevel: 'Lớp 4',
    subject: 'Toán',
    semester: 'Học kỳ 1',
    topic: '7. Ôn tập Học kì 1',
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

test('Phase 8 Bài 37 chọn đủ bốn nhóm review và sinh đúng nguồn HK1', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const groups = ['numbers', 'addSub', 'geometry', 'measurement'];
  const data = template('number.hk1_review_b37_full', 'g4-math-hk1-b37', 'Bài 37 · Ôn tập chung', { groups });
  await showTemplate(page, data);

  await expect(page.locator('.template-editor__rule--phase8-controls')).toBeVisible();
  await expect(page.locator('#template-phase8-review-groups input:checked')).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config)).toEqual({ groups, lesson: 'g4-math-hk1-b37' });

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Bài 33');
  await page.keyboard.press('Escape');

  const gameplay = await page.evaluate(templateData => {
    const question = app.data.generateTemplateQuestion(templateData);
    return question.subquestions.map(item => ({ group: item.skillGroup, sourceLesson: item.sourceLesson, options: item.options.length }));
  }, data);
  expect(gameplay).toEqual([
    { group: 'numbers', sourceLesson: 'g4-math-hk1-b33', options: 4 },
    { group: 'addSub', sourceLesson: 'g4-math-hk1-b34', options: 4 },
    { group: 'geometry', sourceLesson: 'g4-math-hk1-b35', options: 2 },
    { group: 'measurement', sourceLesson: 'g4-math-hk1-b36', options: 4 }
  ]);
});

test('Phase 8 Bài 33 giữ preview và lesson trên tablet ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOfflineHomepage(page);

  const data = template('number.hk1_review_b33_numbers', 'g4-math-hk1-b33', 'Bài 33 · Ôn tập các số đến lớp triệu', { skills: ['b10', 'b11', 'b12', 'b13'] });
  await showTemplate(page, data);
  await expect(page.locator('#template-generator')).toHaveValue('number.hk1_review_b33_numbers');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b33');
  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Bài 33');
});
