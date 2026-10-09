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
  await expect(page.locator('#template-preview-back')).toBeFocused();
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

test('Phase 3 B09 trộn hai dạng góc trên tablet ngang và reduced motion', async ({ page }) => {
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
  expect(measureVisuals).toBeGreaterThan(0);
  expect(classifyVisuals).toBeGreaterThan(0);
  expect(measureVisuals + classifyVisuals).toBe(4);
  await expect(page.locator('#template-preview-dialog .template-preview__choices')).toHaveCount(4);
});


for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`B07 hình và đáp án cùng hàng, chọn đủ bốn ý tại ${size.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await openOfflineHomepage(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluate(() => {
      app.data.currentUser = { username: 'hs-test', fullname: 'Học sinh thử', role: 'student', classlevel: '4' };
      const question = app.data.generateTemplateQuestion({ generator_key: 'g4-m-angle-measure-read', config: { allowedDegrees: [45, 75, 105, 135] }, prompt_template: '{question}' });
      app.game.state.questions = [question];
      app.game.state.currentIdx = 0;
      app.game.state.score = 0;
      app.router.open('game-screen');
      app.router.openGameView('game-play-view');
      app.game.loadQuestion();
    });
    await expect(page.locator('#game-play-view')).toBeVisible();
    const rows = page.locator('#game-options-container .multi-choice-subquestion');
    await expect(rows).toHaveCount(4);
    const bounds = await rows.evaluateAll(rows => rows.map(row => {
      const r = row.getBoundingClientRect();
      const v = row.querySelector('svg').getBoundingClientRect();
      const o = row.querySelector('.multi-choice-subquestion__options').getBoundingClientRect();
      const container = document.querySelector('#game-options-container').getBoundingClientRect();
      return { sameRow: v.right <= o.left && Math.min(v.bottom, o.bottom) > Math.max(v.top, o.top), fits: o.bottom <= r.bottom + 1 && r.bottom <= container.bottom + 1 && o.right <= r.right + 1 };
    }));
    expect(bounds).toEqual(bounds.map(() => ({ sameRow: true, fits: true })));
    await expect(page.locator('.angle-protractor__target-label')).toHaveCount(4);
    const answers = await page.evaluate(() => app.game.state.questions[0].subquestions.map(part => part.answer));
    for (let index = 0; index < 4; index++) {
      await rows.nth(index).getByRole('button').filter({ hasText: answers[index] }).first().click();
    }
    await expect(page.locator('#submit-ans-btn')).toBeEnabled();
    await page.screenshot({ path: `test-results/ui-review/b07-${size.width}.png` });
    await page.locator('#submit-ans-btn').click();
    await expect.poll(() => page.evaluate(() => app.game.state.score)).toBe(1);
    expect(errors).toEqual([]);
  });
}

test('B08 đủ 10 câu khác nhau khi chỉ có template kéo thả hình góc', async ({ page }) => {
  await openOfflineHomepage(page);
  const outcome = await page.evaluate(() => {
    let seed = 9182;
    Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
    const alerts = [];
    window.alert = message => alerts.push(message);
    app.data.currentUser = { username: 'teacher-test', role: 'admin', classlevel: '4' };
    app.data.libraryQuestions = [];
    app.data.questionTemplates = [{ id: 'b08-test', generator_key: 'g4-m-angle-drag-classify', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '2. Góc và đơn vị đo góc', lesson: 'g4-math-hk1-b08', question_type: 'Kéo thả', config: {}, prompt_template: '{question}', is_active: true }];
    app.game.openConfig('math');
    app.game.state.adminclasslevel = '4';
    app.game.state.selectedTopics = ['2. Góc và đơn vị đo góc'];
    app.game.startPlay();
    const questions = app.game.state.questions;
    return { alerts, count: questions.length, distinct: new Set(questions.map(q => app.data.getQuestionSemanticKey(q))).size };
  });
  expect(outcome).toEqual({ alerts: [], count: 10, distinct: 10 });
});
