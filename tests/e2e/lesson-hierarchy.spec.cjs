const { test, expect } = require('@playwright/test');

async function openAdmin(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin', classlevel: '4' };
    app.data.libraryQuestions = [];
    app.data.questionTemplates = [];
    app.data.exams = [];
    app.data.quests = [];
    app.admin.openAdmin();
  });
}

test('Admin soạn câu hỏi thấy Bài học đúng điều kiện, học sinh vẫn chỉ thấy Chủ đề', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAdmin(page);
  await page.evaluate(() => app.admin.switchTab('questions'));
  await page.evaluate(() => app.admin.renderQSubTab('add'));

  await expect(page.locator('#add-q-lesson-field')).toBeHidden();
  await page.locator('#add-q-class').selectOption('Lớp 4');
  await expect(page.locator('#add-q-lesson-field')).toBeVisible();
  await expect(page.locator('#add-q-lesson option')).toHaveCount(7);
  await expect(page.locator('#add-q-lesson option').nth(1)).toHaveText('Bài 1. Ôn tập các số đến 100 000');
  await page.locator('#add-q-lesson').selectOption('g4-math-hk1-b02');
  await page.locator('#add-q-q').fill('Câu hỏi thuộc Bài 2');
  await page.locator('#add-q-ans').fill('Đúng');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Lưu câu hỏi' }).click();
  await expect.poll(() => page.evaluate(() => app.data.libraryQuestions[0]?.lesson)).toBe('g4-math-hk1-b02');

  await page.evaluate(() => app.admin.renderQSubTab('add', 0));
  await page.locator('#add-q-sub').selectOption('Tiếng Việt');
  await expect(page.locator('#add-q-lesson-field')).toBeHidden();
  await expect.poll(() => page.locator('#add-q-lesson').evaluate(select => select.dataset.selected || '')).toBe('');

  await page.evaluate(() => {
    document.getElementById('treasure-modal').style.display = 'none';
    app.data.currentUser = { username: 'student', role: 'student', classlevel: '4' };
    app.game.openConfig('math');
  });
  await expect(page.locator('#game-config-view')).toBeVisible();
  await expect(page.locator('#game-config-view #topics-list')).toBeVisible();
  await expect(page.locator('#game-config-view [id*="lesson"]')).toHaveCount(0);
  await expect(page.locator('#game-config-view')).not.toContainText('Bài học');
});

test('Soạn đề Toán lớp 4 có bộ lọc Bài học và tự động chỉ bốc đúng bài đã chọn', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAdmin(page);
  await page.evaluate(() => {
    app.admin.switchTab('exams');
    app.admin.renderESubTab('add');
  });
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await expect(page.locator('#add-e-lessons-field')).toBeVisible();
  await expect(page.locator('#add-e-lessons input')).toHaveCount(37);
  await page.locator('#add-e-topics input').first().check();

  await page.evaluate(() => {
    const lessonInputs = Array.from(document.querySelectorAll('#add-e-lessons input'));
    lessonInputs.forEach(input => { input.checked = input.value === 'g4-math-hk1-b02'; });
    app.admin.updateExamTopics();
    const topic = app.constants.topics['4'].math.hk1[0];
    app.data.questionTemplates = [];
    app.data.libraryQuestions = Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic, lesson: 'g4-math-hk1-b02',
      type: 'Điền khuyết', q: `Câu Bài 2 ${index + 1}<br>a) Ý a<br>b) Ý b<br>c) Ý c<br>d) Ý d`, options: [], ans: '1, 2, 3, 4', explanation: '',
      practiceRows: ['a', 'b', 'c', 'd'].map((label, partIndex) => ({ label, display: `Ý ${label}`, answer: String(partIndex + 1) })),
      partAnswerCounts: [1, 1, 1, 1]
    }));
    app.admin.autoGenerateExam();
  });

  await expect(page.locator('select[id^="add-e-q-lesson-"]')).toHaveCount(10);
  await expect(page.locator('select[id^="add-e-q-lesson-"]').first()).toHaveValue('g4-math-hk1-b02');
  const selectedLessons = await page.locator('select[id^="add-e-q-lesson-"]').evaluateAll(selects => selects.map(select => select.value));
  expect(new Set(selectedLessons)).toEqual(new Set(['g4-math-hk1-b02']));

  await page.locator('#add-e-sub').selectOption('Tiếng Việt');
  await expect.poll(() => page.locator('#add-e-q-lesson-0').evaluate(select => select.dataset.selected || '')).toBe('');
});

test('Soạn đề giữ rõ trạng thái phạm vi Bài học khi đổi học kỳ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAdmin(page);
  await page.evaluate(() => {
    app.admin.switchTab('exams');
    app.admin.renderESubTab('add');
  });
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await page.locator('#add-e-topics input').first().check();
  await page.evaluate(() => {
    const lessonInputs = Array.from(document.querySelectorAll('#add-e-lessons input'));
    lessonInputs.forEach(input => { input.checked = input.value === 'g4-math-hk1-b02'; });
    app.admin.updateExamTopics();
  });
  await expect(page.locator('#add-e-lessons')).toHaveAttribute('data-selection-mode', 'selected');
  await expect(page.locator('#add-e-lessons input:checked')).toHaveCount(1);

  await page.locator('#add-e-period').selectOption('Giữa kỳ 2');
  await expect(page.locator('#add-e-lessons')).toHaveAttribute('data-selection-mode', 'all');
  await expect(page.locator('#add-e-lessons input:checked')).toHaveCount(36);
});

test('Kho template và nhiệm vụ Admin dùng cùng danh mục Bài học', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAdmin(page);
  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'template-lesson', name: 'Template Bài 2', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: app.constants.topics['4'].math.hk1[0], question_type: 'Trắc nghiệm', generator_key: 'number.digit_at_place',
      prompt_template: 'Nhập số', config: { lesson: 'g4-math-hk1-b02', minimum: 1000, maximum: 9999, allowedPlaces: ['tens'], allowedDigits: [1] }, is_active: true
    }];
    app.admin.switchTab('templates');
    app.admin.renderTemplateForm(0);
  });
  await expect(page.locator('#template-lesson-field')).toBeVisible();
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b02');

  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'template-arithmetic-lesson', name: 'Template phép tính Bài 2', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: app.constants.topics['4'].math.hk1[0], question_type: 'Điền khuyết', generator_key: 'number.four_arithmetic_blanks',
      prompt_template: '{question}', config: {
        lesson: 'g4-math-hk1-b02', minimum: 1000, maximum: 9999, minimumDigits: 4, maximumDigits: 4,
        operations: ['+'], layouts: ['expressionLeft'], blankPositions: ['first']
      }, is_active: true
    }];
    app.admin.renderTemplateForm(0);
  });
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.lesson)).toBe('g4-math-hk1-b02');

  await page.evaluate(() => app.admin.showAddQuestForm());
  await expect(page.locator('#quest-curriculum-fields')).toBeHidden();
  await page.locator('#quest-subject').selectOption('math');
  await page.locator('#quest-classlevel').selectOption('Lớp 4');
  await page.locator('#quest-topic').selectOption({ index: 1 });
  await expect(page.locator('#quest-lesson-field')).toBeVisible();
  await expect(page.locator('#quest-lesson option')).toHaveCount(7);
  await page.locator('#quest-lesson').selectOption('g4-math-hk1-b02');
  await page.locator('#quest-title').fill('Nhiệm vụ Bài 2');
  await page.evaluate(() => app.admin.submitQuest());
  await expect.poll(() => page.evaluate(() => app.data.quests[0]?.curriculum)).toEqual({
    classlevel: 'Lớp 4', semester: 'Học kỳ 1', topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b02'
  });
});
