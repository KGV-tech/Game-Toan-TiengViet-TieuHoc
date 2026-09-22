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

test('Kho Template tự gắn Bài học cho template cũ và phân biệt phạm vi toàn chủ đề', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAdmin(page);

  const topics = await page.evaluate(() => ({
    topic3: app.constants.topics['4'].math.hk1[2],
    topic5: app.constants.topics['4'].math.hk1[4]
  }));
  await page.evaluate(({ topic3, topic5 }) => {
    app.data.questionTemplates = [
      {
        id: 'legacy-place-value', name: 'Legacy lớp và hàng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: topic3,
        question_type: 'Đúng/Sai', generator_key: 'number.place_value_true_false', prompt_template: 'Chọn Đúng/Sai?', config: {}, is_active: true
      },
      {
        id: 'legacy-addition-property', name: 'Legacy tính chất phép cộng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: topic5,
        question_type: 'Điền khuyết', generator_key: 'g4-m-addition-property-fill', prompt_template: '{question}', config: {}, is_active: true
      },
      {
        id: 'legacy-topic-wide', name: 'Legacy template chưa định danh Bài học', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: topic5,
        question_type: 'Điền khuyết', generator_key: 'future.multi-lesson-template', prompt_template: '{question}', config: {}, is_active: true
      }
    ];
    app.admin.templateFilters = { classlevel: '', subject: '', topic: '', lesson: '', questionType: '', generatorKey: '' };
    app.admin.switchTab('templates');
  }, topics);

  await expect(page.locator('.template-library')).toBeVisible();
  const library = page.locator('.template-library');
  await expect(library).toContainText('Bài 11. Hàng và lớp');
  await expect(library).toContainText('Bài 24. Tính chất giao hoán và kết hợp của phép cộng');
  await expect(library).toContainText('Toàn chủ đề');

  const lessonFilterValues = await page.getByLabel('Lọc Bài học').locator('option').evaluateAll(options => options.map(option => option.value));
  expect(lessonFilterValues).toEqual(expect.arrayContaining(['g4-math-hk1-b11', 'g4-math-hk1-b24']));
  expect(lessonFilterValues.slice(1)).not.toContain('');

  const propertyCard = page.locator('.template-library-card').filter({ hasText: 'Legacy tính chất phép cộng' });
  await propertyCard.getByRole('button', { name: 'Sửa cấu hình câu hỏi' }).click();
  await expect(page.locator('#template-lesson-field')).toBeVisible();
  await expect(page.locator('#template-lesson')).toHaveValue('g4-math-hk1-b24');
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config.lesson)).toBe('g4-math-hk1-b24');
});

test('bộ lọc Chủ đề chỉ hiện chủ đề thuộc môn học đã chọn', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAdmin(page);

  const topics = await page.evaluate(() => ({
    math: app.constants.topics['4'].math.hk1[0],
    vietnamese: app.constants.topics['4'].vietnamese.hk1[0]
  }));
  await page.evaluate(({ math, vietnamese }) => {
    app.data.questionTemplates = [
      { id: 'math-template', name: 'Mẫu Toán', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: math, question_type: 'Trắc nghiệm', generator_key: 'math.example', prompt_template: '{question}', config: {}, is_active: true },
      { id: 'vietnamese-template', name: 'Mẫu Tiếng Việt', classlevel: 'Lớp 4', subject: 'Tiếng Việt', semester: 'Học kỳ 1', topic: vietnamese, question_type: 'Trắc nghiệm', generator_key: 'vietnamese.example', prompt_template: '{question}', config: {}, is_active: true }
    ];
    app.admin.templateFilters = { classlevel: 'Lớp 4', subject: 'Toán', topic: '', lesson: '', questionType: '', generatorKey: '' };
    app.admin.switchTab('templates');
  }, topics);

  const topicValues = await page.getByLabel('Lọc chủ đề').locator('option').evaluateAll(options => options.map(option => option.value));
  expect(topicValues).toEqual(['', topics.math]);
  await page.getByLabel('Lọc chủ đề').selectOption(topics.math);
  await page.getByLabel('Lọc môn học').selectOption('Tiếng Việt');
  await expect(page.getByLabel('Lọc chủ đề')).toHaveValue('');
  expect(await page.getByLabel('Lọc chủ đề').locator('option').evaluateAll(options => options.map(option => option.value))).toEqual(['', topics.vietnamese]);
  await expect(page.locator('.template-library-card')).toHaveCount(1);
  await expect(page.locator('.template-library-card')).toContainText('Mẫu Tiếng Việt');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByLabel('Lọc môn học').selectOption('');
  expect(await page.getByLabel('Lọc chủ đề').locator('option').evaluateAll(options => options.map(option => option.value))).toEqual(expect.arrayContaining(['', topics.math, topics.vietnamese]));
  await page.getByLabel('Lọc cấp lớp').selectOption('Lớp 5');
  await expect(page.getByLabel('Lọc chủ đề').locator('option')).toHaveCount(1);
  await expect(page.locator('.template-library__empty')).toBeVisible();
});

test('Soạn đề Toán lớp 4 lọc và sinh template cũ theo Bài học đã chọn', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAdmin(page);
  await page.evaluate(() => {
    app.admin.switchTab('exams');
    app.admin.renderESubTab('add');
  });

  const topic5 = await page.evaluate(() => app.constants.topics['4'].math.hk1[4]);
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await page.locator('#add-e-topics input').nth(4).check();
  await page.evaluate(topic => {
    app.data.libraryQuestions = [];
    app.data.questionTemplates = [{
      id: 'legacy-addition-property-auto', name: 'Legacy tính chất phép cộng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      question_type: 'Điền khuyết', generator_key: 'g4-m-addition-property-fill', prompt_template: '{question}', config: {}, is_active: true
    }];
    const lessonInputs = Array.from(document.querySelectorAll('#add-e-lessons input'));
    lessonInputs.forEach(input => { input.checked = input.value === 'g4-math-hk1-b24'; });
    app.admin.updateExamTopics();
  }, topic5);

  await expect(page.locator('#add-e-lessons-field')).toBeVisible();
  await expect(page.locator('#add-e-lessons input:checked')).toHaveCount(1);
  await expect(page.locator('#add-e-lessons input:checked')).toHaveValue('g4-math-hk1-b24');
  await page.getByRole('button', { name: 'Tạo đề tự động' }).click();

  await expect(page.locator('select[id^="add-e-q-lesson-"]')).toHaveCount(10);
  const generatedLessons = await page.locator('select[id^="add-e-q-lesson-"]').evaluateAll(selects => selects.map(select => select.value));
  expect(new Set(generatedLessons)).toEqual(new Set(['g4-math-hk1-b24']));
});
