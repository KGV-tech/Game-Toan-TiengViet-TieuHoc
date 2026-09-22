const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

test('Bài 5 có đủ 14 generator và trình soạn hiển thị dạng một bài toán ba bước', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const registrySummary = await page.evaluate(() => {
    const keys = window.Grade4MathTemplates.templateIds.filter(key => key.startsWith('word.three_steps_'));
    const generated = keys.map(key => window.Grade4MathTemplates.generateQuestion(key, {}));
    return {
      keys,
      types: [...new Set(generated.map(question => question.type))],
      lessons: [...new Set(generated.map(question => question.lesson))],
      answerCounts: [...new Set(generated.map(question => question.partAnswerCounts.join(',')))]
    };
  });
  expect(registrySummary.keys).toHaveLength(14);
  expect(registrySummary.types).toHaveLength(2);
  expect(registrySummary.types).toEqual(expect.arrayContaining(['Điền khuyết', 'Trắc nghiệm']));
  expect(registrySummary.lessons).toEqual(['g4-math-hk1-b05']);
  expect(registrySummary.answerCounts).toEqual(['1']);

  const fillPreviews = await page.evaluate(() =>
    window.Grade4MathTemplates.templateIds
      .filter(key => key.startsWith('word.three_steps_') && key.endsWith('_fill'))
      .map(key => {
        const question = window.Grade4MathTemplates.generateQuestion(key, {});
        const preview = document.createElement('div');
        preview.innerHTML = app.admin.renderGeneratedTemplatePreview(question);
        return {
          answerLine: preview.querySelector('.template-preview__answer-line').textContent,
          expected: question.q.split('<br>')[1].split('___').map(part => part.trim()).join(''),
          blanks: preview.querySelectorAll('.template-preview__blank').length,
          hasPrompt: preview.textContent.replace(/\s/g, '').includes(question.q.split('<br>')[0].replace(/\s/g, ''))
        };
      })
  );
  expect(fillPreviews).toHaveLength(7);
  for (const preview of fillPreviews) {
    expect(preview.answerLine).toBe(preview.expected);
    expect(preview.answerLine).toMatch(/^Điền đáp số:/);
    expect(preview.blanks).toBe(1);
    expect(preview.hasPrompt).toBe(true);
  }

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.questionTemplates = [{
      id: 'b05-relation-fill',
      name: 'Bài 5 · Quan hệ hơn/kém rồi tính tổng — Điền khuyết',
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b05',
      question_type: 'Điền khuyết', generator_key: 'word.three_steps_relation_total_fill',
      prompt_template: '{question}', config: { difficulty: 'core', minimum: 1, maximum: 10000 }, is_active: true
    }];
    app.admin.renderTemplateForm(0);
    document.getElementById('treasure-modal').style.display = 'block';
  });

  await expect(page.locator('#template-generator')).toHaveValue('word.three_steps_relation_total_fill');
  await expect(page.locator('#template-question-type')).toHaveValue('Điền khuyết');
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b05');
  await expect(page.locator('.template-editor__rule--b05-controls')).toBeVisible();
  await expect(page.locator('.template-editor__part-selection')).toBeHidden();
  await expect(page.locator('.template-content-builder')).toBeHidden();
  await expect(page.locator('.template-editor__section-intro')).toContainText('một đáp án cuối cùng');

  const config = await page.evaluate(() => app.admin.collectTemplateForm().config);
  expect(config).toMatchObject({ difficulty: 'core', minimum: 1, maximum: 10000 });

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-content .template-preview__answer-line')).toHaveText(/^Điền đáp số:.+/);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('#template-preview-content .template-preview__blank')).toBeVisible();
    await page.screenshot({ path: `test-results/ui-review/b05-fill-${viewport.width}.png` });
  }
  await page.locator('.template-preview-dialog__close').click();

  await page.locator('#template-generator').selectOption('word.three_steps_relation_total_mcq');
  await expect(page.locator('#template-question-type')).toHaveValue('Trắc nghiệm');
  await expect(page.locator('#template-example')).toContainText('Mẫu đầu ra');
  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-content .template-preview__choices')).toHaveCount(1);
  await expect(page.locator('#template-preview-content .template-preview__blank')).toHaveCount(0);
});
