const { test, expect } = require('@playwright/test');

async function openExamComposer(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.exams = [];
    app.admin.openAdmin();
    app.admin.switchTab('exams');
    app.admin.renderESubTab('add');
  });
}

test('Soạn đề chỉ hiện chủ đề của học kỳ đã chọn và Cả năm gộp hai học kỳ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  const topics = await page.evaluate(() => app.constants.topics['5'].math);

  await expect(page.locator('#add-e-topics')).toBeVisible();
  const hk1Topics = await page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value));
  expect(hk1Topics).toEqual(topics.hk1);

  await page.locator('#add-e-period').selectOption('Cuối kỳ 2');
  await expect.poll(() => page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value))).toEqual(topics.hk2);

  await page.locator('#add-e-period').selectOption('Cả năm');
  await expect.poll(() => page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value))).toEqual([
    ...topics.hk1,
    ...topics.hk2
  ]);
});

test('Tạo đề tự động điền 10 câu theo các chủ đề đã chọn để giáo viên chỉnh sửa', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  await page.evaluate(() => {
    const topic = app.constants.topics['5'].math.hk1[0];
    app.data.libraryQuestions = Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 5', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'Trắc nghiệm', q: `Câu tự động ${index + 1}`, options: ['A', 'B'], ans: 'A', explanation: ''
    }));
  });
  await page.locator('#add-e-topics input').first().check();
  await page.getByRole('button', { name: 'Tạo đề tự động' }).click();
  await expect(page.locator('textarea[id^="add-e-q-q-"]')).toHaveCount(10);
  await expect.poll(() => page.locator('textarea[id^="add-e-q-q-"]').evaluateAll(items => items.map(item => item.value))).toEqual(expect.arrayContaining(['Câu tự động 1', 'Câu tự động 10']));
});

test('Tạo đề Toán lớp 4 phân bổ câu hỏi qua các chủ đề đã chọn', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);

  const selectedTopics = await page.evaluate(() => app.constants.topics['4'].math.hk1.slice(1, 4));
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await expect.poll(() => page.locator('#add-e-topics input').count()).toBeGreaterThan(2);

  await page.evaluate(topics => {
    const inputs = Array.from(document.querySelectorAll('#add-e-topics input'));
    inputs.forEach(input => { input.checked = topics.includes(input.value); });
    app.admin.updateExamTopics();
    app.data.questionTemplates = [];
    app.data.libraryQuestions = topics.flatMap((topic, topicIndex) => Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'Trắc nghiệm', q: `Câu chủ đề ${topicIndex + 1}.${index + 1}`, options: ['A', 'B'], ans: 'A', explanation: ''
    })));
    const originalRandom = Math.random;
    Math.random = () => 0.5;
    app.admin.autoGenerateExam();
    Math.random = originalRandom;
  }, selectedTopics);

  await expect(page.locator('select[id^="add-e-q-topic-"]')).toHaveCount(10);
  const generatedTopics = await page.locator('select[id^="add-e-q-topic-"]').evaluateAll(selects => selects.map(select => select.value));
  expect(new Set(generatedTopics)).toEqual(new Set(selectedTopics));
  selectedTopics.forEach(topic => {
    expect(generatedTopics.filter(item => item === topic).length).toBeGreaterThan(0);
  });
});

test('Soạn đề Toán lớp 4 hiện và lưu đủ bốn ý cùng đáp án của câu nhiều phần', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);

  await page.evaluate(() => {
    const topic = app.constants.topics['4'].math.hk1[2];
    const trueFalse = {
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic, type: 'Đúng/Sai',
      q: 'Chọn Đúng/Sai cho từng nhận định.', ans: 'Đúng, Sai, Đúng, Sai', options: [], explanation: '',
      statements: [
        { label: 'A', text: 'Nhận định A', answer: 'Đúng' },
        { label: 'B', text: 'Nhận định B', answer: 'Sai' },
        { label: 'C', text: 'Nhận định C', answer: 'Đúng' },
        { label: 'D', text: 'Nhận định D', answer: 'Sai' }
      ]
    };
    const multipleChoice = {
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic, type: 'Trắc nghiệm',
      q: 'Chọn đáp án đúng cho từng ý.', ans: 'A, B, C, D', options: [], explanation: '',
      subquestions: [
        { label: 'a', prompt: 'Ý trắc nghiệm a', options: ['A', 'B', 'C', 'D'], answer: 'A' },
        { label: 'b', prompt: 'Ý trắc nghiệm b', options: ['A', 'B', 'C', 'D'], answer: 'B' },
        { label: 'c', prompt: 'Ý trắc nghiệm c', options: ['A', 'B', 'C', 'D'], answer: 'C' },
        { label: 'd', prompt: 'Ý trắc nghiệm d', options: ['A', 'B', 'C', 'D'], answer: 'D' }
      ]
    };
    const simpleQuestions = Array.from({ length: 8 }, (_, index) => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic, type: 'Trắc nghiệm',
      q: `Câu đơn ${index + 1}`, ans: 'A', options: ['A', 'B'], explanation: ''
    }));
    app.data.exams = [{
      id: 'exam-grade-4-structured', name: 'Đề Toán lớp 4 nhiều phần', classlevel: 'Lớp 4', subject: 'Toán',
      period: 'Giữa kỳ 1', topics: [topic], questions: [trueFalse, multipleChoice, ...simpleQuestions]
    }];
    app.data.libraryQuestions = [];
    app.data.questionTemplates = [];
    app.admin.examComposerDraft = null;
    app.admin.renderESubTab('add', 0);
  });

  await expect(page.locator('[data-structured-kind="statements"]')).toBeVisible();
  await expect(page.locator('[data-structured-kind="statements"] .exam-structured-part')).toHaveCount(4);
  await expect(page.locator('textarea[id^="add-e-q-structured-text-0-"]')).toHaveCount(4);
  await expect(page.locator('select[id^="add-e-q-structured-answer-0-"]')).toHaveCount(4);
  await expect(page.locator('[data-structured-kind="subquestions"] .exam-structured-part')).toHaveCount(4);
  await expect(page.locator('[data-structured-kind="subquestions"] .exam-structured-option')).toHaveCount(16);

  await page.locator('#add-e-q-structured-text-0-1').fill('Nhận định B đã được chỉnh sửa');
  await page.locator('#add-e-q-structured-answer-0-1').selectOption('Đúng');
  await page.locator('#add-e-q-structured-prompt-1-2').fill('Ý trắc nghiệm c đã được chỉnh sửa');
  await page.locator('#add-e-q-structured-answer-1-2').fill('D');

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Lưu chỉnh sửa' }).click();
  const savedQuestions = await page.evaluate(() => app.data.exams[0].questions);
  expect(savedQuestions[0].statements).toHaveLength(4);
  expect(savedQuestions[0].statements[1]).toMatchObject({ text: 'Nhận định B đã được chỉnh sửa', answer: 'Đúng' });
  expect(savedQuestions[0].ans).toBe('Đúng, Đúng, Đúng, Sai');
  expect(savedQuestions[1].subquestions).toHaveLength(4);
  expect(savedQuestions[1].subquestions[2]).toMatchObject({ prompt: 'Ý trắc nghiệm c đã được chỉnh sửa', answer: 'D' });
  expect(savedQuestions[1].ans).toBe('A, B, D, D');
});
