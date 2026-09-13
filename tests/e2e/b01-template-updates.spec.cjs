const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

test('Kho template Bài 1 có dạng gộp, làm tròn và cấu hình đúng', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.questionTemplates = [{
      id: 'b01-rounding',
      name: 'Làm tròn số đến hàng chục, trăm, nghìn, chục nghìn',
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01',
      question_type: 'Trắc nghiệm', generator_key: 'number.round_number',
      prompt_template: '{question}',
      config: { minimum: 10, maximum: 99999, allowedPlaces: ['tens', 'hundreds', 'thousands', 'tenThousands'] },
      is_active: true
    }];
    app.admin.openComposer('templates');
    app.admin.renderTemplateForm(0);
  });

  await expect(page.locator('#template-generator')).toHaveValue('number.round_number');
  await expect(page.locator('#template-generator option[value="number.min_max_of_four"]')).toHaveCount(1);
  await expect(page.locator('#template-generator option[value="number.natural_sequence"]')).toHaveCount(1);
  await expect(page.locator('#template-generator option[value="number.round_number"]')).toHaveCount(1);
  await expect(page.locator('.template-editor__rule--rounding-controls')).toBeVisible();
  await expect(page.locator('.template-checkbox[data-template-group="rounding-places"]:checked')).toHaveCount(4);

  const rounding = await page.evaluate(() => app.admin.collectTemplateForm());
  expect(rounding.question_type).toBe('Trắc nghiệm');
  expect(rounding.prompt_template).toBe('{question}');
  expect(rounding.config).toMatchObject({
    minimum: 10,
    maximum: 99999,
    allowedPlaces: ['tens', 'hundreds', 'thousands', 'tenThousands']
  });

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Hãy làm tròn số theo yêu cầu.');
  await expect(page.locator('#template-preview-dialog')).toContainText('hàng chục');
  await expect(page.locator('#template-preview-dialog')).toContainText('hàng chục nghìn');
  await page.keyboard.press('Escape');

  await page.locator('#template-generator').selectOption('number.min_max_of_four');
  await expect(page.locator('#template-question-type')).toHaveValue('Trắc nghiệm');
  const minMax = await page.evaluate(() => app.admin.collectTemplateForm());
  expect(minMax.generator_key).toBe('number.min_max_of_four');
  expect(minMax.config).toMatchObject({ minimum: 10, maximum: 99999 });

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog .template-preview__mc > div')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).toContainText('Hãy chọn đáp án đúng');
  await expect(page.locator('#template-preview-dialog')).toContainText('Tìm số bé nhất?');
  await expect(page.locator('#template-preview-dialog')).toContainText('Tìm số lớn nhất?');
  await expect(page.locator('#template-preview-dialog')).toContainText('số bé nhất');
  await expect(page.locator('#template-preview-dialog')).toContainText('số lớn nhất');
  await expect(page.locator('#template-preview-dialog')).not.toContainText('Câu hỏi con');

  await page.keyboard.press('Escape');
  await page.locator('#template-generator').selectOption('number.place_value_true_false');
  await expect(page.locator('.template-editor__rule--true-false-controls')).toBeVisible();
  await expect(page.locator('.template-checkbox[data-template-group="true-false-kinds"][value="class"]')).toHaveCount(0);
  await expect(page.locator('.template-checkbox[data-template-group="true-false-kinds"][value="place"]')).toBeChecked();
  await expect(page.locator('.template-checkbox[data-template-group="true-false-kinds"][value="comparison"]')).toBeChecked();
  await expect(page.locator('.template-checkbox[data-template-group="true-false-kinds"][value="place"]')).toBeDisabled();
  await expect(page.locator('.template-checkbox[data-template-group="true-false-kinds"][value="comparison"]')).toBeDisabled();
  const trueFalse = await page.evaluate(() => app.admin.collectTemplateForm());
  expect(trueFalse.config).toMatchObject({ minimum: 1001, maximum: 99999, statementKinds: ['place', 'comparison'], statementLayout: 'b01-four-types' });

  await page.locator('#template-preview-open').click();
  const trueFalsePreview = page.locator('#template-preview-dialog .template-preview__true-false');
  await expect(trueFalsePreview).toHaveCount(1);
  await expect(trueFalsePreview.locator('> div')).toHaveCount(4);
  await expect(trueFalsePreview).toContainText('Trong số');
  await expect(trueFalsePreview).toContainText(/[<>]/);
  await expect(trueFalsePreview).toContainText(' + ');
  await expect(trueFalsePreview).not.toContainText(/lớp/i);
});

test('Đúng/Sai Bài 1 hiển thị đủ bốn kiểu nhận định cố định', async ({ page }) => {
  await openOfflineHomepage(page);
  const generated = await page.evaluate(() => {
    let seed = 1205;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const question = window.Grade4MathTemplates.generateQuestion('number.place_value_true_false', {
      minimum: 1001,
      maximum: 99999,
      statementKinds: ['place', 'comparison'],
      statementLayout: 'b01-four-types'
    }, random);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return {
      layoutKinds: question.statements.map(item => item.layoutKind),
      statementTexts: question.statements.map(item => item.text)
    };
  });
  expect(generated.layoutKinds).toEqual(['place', 'number-number', 'number-expression', 'expression-expression']);
  expect(generated.statementTexts[1]).toMatch(/[<>]/);
  await expect(page.locator('.tf-statement')).toHaveCount(4);
  await expect(page.locator('.tf-statement__text').nth(0)).toContainText('Trong số');
  await expect(page.locator('.tf-statement__text').nth(1)).toContainText(/[<>]/);
  await expect(page.locator('.tf-statement__text').nth(2)).toContainText(' + ');
  await expect(page.locator('.tf-statement__text').nth(3)).toContainText(' + ');
  const statementTexts = await page.locator('.tf-statement__text').allTextContents();
  expect(statementTexts[1]).not.toContain('=');
  expect(statementTexts[2]).toMatch(/\+|=/);
  expect(statementTexts[3]).toMatch(/\+/);
  expect(statementTexts[0]).toMatch(/hàng/i);
  expect(statementTexts.every(text => !/lớp/i.test(text))).toBe(true);
});
