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

test('chi tiết Soạn Đề đồng bộ với bố cục thẻ tối và trạng thái tương tác', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExamComposer(page);

  await expect(page.locator('.exam-composer__meta')).toBeVisible();
  await expect(page.locator('#exam-composer-meta-title')).toHaveText('1. Thông tin chung của đề');
  await expect(page.locator('.exam-composer__question-bank')).toContainText('Soạn câu hỏi cho đề');
  await expect(page.locator('.exam-question-card')).toHaveCount(10);
  await expect(page.locator('#add-e-period option')).toHaveText(['Học Kỳ 1', 'Học Kỳ 2', 'Cả Năm']);

  const detailLayout = await page.locator('.exam-composer__meta').evaluate(element => {
    const style = getComputedStyle(element);
    return { borderRadius: style.borderRadius, backgroundImage: style.backgroundImage };
  });
  expect(detailLayout.borderRadius).toBe('20px');
  expect(detailLayout.backgroundImage).toContain('linear-gradient');

  const topicLayout = await page.locator('.exam-composer__topic-option').first().evaluate(element => {
    const style = getComputedStyle(element);
    return { height: element.getBoundingClientRect().height, borderRadius: style.borderRadius };
  });
  expect(topicLayout.height).toBeGreaterThanOrEqual(56);
  expect(topicLayout.borderRadius).toBe('12px');

  const firstTopic = page.locator('.exam-composer__topic-option').first();
  await firstTopic.locator('input').check();
  await expect(firstTopic).toHaveClass(/is-selected/);
  const selectedTopicColor = await firstTopic.evaluate(element => getComputedStyle(element).color);
  expect(selectedTopicColor).not.toBe('rgb(219, 234, 254)');

  await page.locator('#add-e-q-q-0').fill('Câu hỏi thử nghiệm');
  await expect(page.locator('.exam-question-card').first()).toHaveClass(/is-filled/);
  await expect(page.locator('.exam-question-card__status--filled').first()).toContainText('Đã điền');
  await expect(page.getByRole('button', { name: 'Tạo đề tự động' })).toBeVisible();
});

test('chi tiết Soạn Đề giữ được ngữ cảnh khi rà soát nhiều câu hỏi', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openExamComposer(page);

  await expect(page.locator('#admin-compose-question-nav')).toBeVisible();
  await expect(page.locator('#admin-compose-question-nav [data-question-nav-index]')).toHaveCount(10);
  await expect(page.locator('.admin-compose-step[data-compose-step="content"]')).toHaveAttribute('aria-current', 'step');

  const shellBounds = await page.locator('.admin-compose-shell').evaluate(element => {
    const shell = element.getBoundingClientRect();
    const sidebar = element.querySelector('.admin-compose-sidebar').getBoundingClientRect();
    const main = element.querySelector('.admin-compose-main').getBoundingClientRect();
    return { shellBottom: shell.bottom, sidebarBottom: sidebar.bottom, mainBottom: main.bottom };
  });
  expect(shellBounds.sidebarBottom).toBeLessThanOrEqual(shellBounds.shellBottom + 1);
  expect(shellBounds.mainBottom).toBeLessThanOrEqual(shellBounds.shellBottom + 1);

  await page.locator('[data-question-nav-index="6"]').click();
  await expect(page.locator('.exam-question-card[data-question-index="6"]')).toBeInViewport();
  await expect(page.locator('[data-question-nav-index="6"]')).toHaveAttribute('aria-current', 'true');
});

test('chi tiết Soạn Đề báo lỗi ngay tại trường bắt buộc', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openExamComposer(page);

  await page.getByRole('button', { name: 'Tạo đề kiểm tra' }).click();
  await expect(page.locator('#add-e-form-error')).toBeVisible();
  await expect(page.locator('#add-e-form-error')).toContainText('Tên đề');
  await expect(page.locator('#add-e-name')).toHaveAttribute('aria-invalid', 'true');

  await page.locator('#add-e-name').fill('Đề kiểm tra thử');
  await expect(page.locator('#add-e-form-error')).toBeHidden();
  await expect(page.locator('#add-e-name')).not.toHaveAttribute('aria-invalid', 'true');
});

test('Soạn Đề tôn trọng reduced-motion và giữ điều hướng bằng bàn phím', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await openExamComposer(page);

  await expect.poll(() => page.evaluate(() => app.admin.getComposerScrollBehavior())).toBe('auto');
  const questionNav = page.locator('[data-question-nav-index="3"]');
  await questionNav.focus();
  await expect(questionNav).toBeFocused();
  await expect(questionNav).toHaveAttribute('aria-label', 'Đi tới Câu 4, chưa điền');
});

test('Luyện Đề giữ lựa chọn cũ và vẫn nhận đề theo phạm vi học kỳ mới', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openExamComposer(page);

  const result = await page.evaluate(() => {
    const questions = Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 5', subject: 'Toán', topic: 'Phân số', type: 'Trắc nghiệm',
      q: `Câu hỏi tương thích ${index + 1}`, options: ['A', 'B', 'C', 'D'], ans: 'A'
    }));
    app.data.currentUser = { username: 'student', fullname: 'Học sinh', role: 'student', classlevel: '5' };
    app.data.exams = [{ id: 'exam-new-period', name: 'Đề Học Kỳ 1', classlevel: 'Lớp 5', subject: 'Toán', period: 'Học Kỳ 1', questions }];
    app.exam.filters = { subject: 'math', period: 'Giữa kỳ 1' };
    window.confirm = () => true;
    const periodLabels = Array.from(document.querySelectorAll('#exam-select-screen .period-select button')).map(button => button.textContent.trim());
    const keepsLegacyPeriodsSeparate = !app.exam.periodMatches('Cuối kỳ 1', 'Giữa kỳ 1');
    app.exam.start();
    return { periodLabels, examName: app.exam.state.name, questionCount: app.exam.state.questions.length, keepsLegacyPeriodsSeparate };
  });

  expect(result.periodLabels).toEqual(['Giữa kỳ 1', 'Cuối kỳ 1', 'Giữa kỳ 2', 'Cuối kỳ 2']);
  expect(result.keepsLegacyPeriodsSeparate).toBe(true);
  expect(result.examName).toBe('Đề Học Kỳ 1');
  expect(result.questionCount).toBe(10);
});

test('Soạn đề chỉ hiện chủ đề của học kỳ đã chọn và Cả năm gộp hai học kỳ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  const topics = await page.evaluate(() => app.constants.topics['5'].math);

  await expect(page.locator('#add-e-topics')).toBeVisible();
  const hk1Topics = await page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value));
  expect(hk1Topics).toEqual(topics.hk1);

  await page.locator('#add-e-period').selectOption('Học Kỳ 2');
  await expect.poll(() => page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value))).toEqual(topics.hk2);

  await page.locator('#add-e-period').selectOption('Cả Năm');
  await expect.poll(() => page.locator('#add-e-topics input').evaluateAll(inputs => inputs.map(input => input.value))).toEqual([
    ...topics.hk1,
    ...topics.hk2
  ]);
});

test('Tạo đề tự động chỉ chọn nguồn có bốn ý để giáo viên chỉnh sửa', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await expect.poll(() => page.locator('#add-e-topics input').count()).toBeGreaterThan(2);
  await page.evaluate(() => {
    const topic = app.constants.topics['4'].math.hk1[2];
    app.data.libraryQuestions = Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'So sánh', q: `Câu cũ một ý ${index + 1}`, options: [], ans: '<', explanation: ''
    }));
    app.data.questionTemplates = [{
      id: 'template-four-part-auto', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      question_type: 'Chuỗi Quy luật', generator_key: 'number.natural_sequence', prompt_template: '{question}',
      config: { minimum: 10000, maximum: 9999999, allowedSteps: [1000], sequenceLengthMin: 5, sequenceLengthMax: 5, blankCountMin: 2, blankCountMax: 2 }, is_active: true
    }];
  });
  await page.locator('#add-e-topics input').nth(2).check();
  await page.getByRole('button', { name: 'Tạo đề tự động' }).click();
  await expect(page.locator('textarea[id^="add-e-q-q-"]')).toHaveCount(10);
  await expect(page.locator('[data-structured-kind="sequenceRounds"]')).toHaveCount(10);
  await expect(page.locator('[data-structured-kind] .exam-structured-part')).toHaveCount(40);
  await expect(page.locator('input[id^="add-e-q-ans-"]')).toHaveCount(0);
  const answerCounts = await page.evaluate(() => app.admin.examComposerDraft.questions.map(question => app.data.getQuestionAnswerCount(question)));
  expect(answerCounts).toEqual(Array(10).fill(8));
});

test('Tạo đề tự động tương thích câu cũ có bốn đáp án nhưng thiếu metadata', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await expect.poll(() => page.locator('#add-e-topics input').count()).toBeGreaterThan(2);
  await page.evaluate(() => {
    const topic = app.constants.topics['4'].math.hk1[2];
    app.data.questionTemplates = [];
    app.data.libraryQuestions = Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'Điền khuyết', q: `Câu cũ ${index + 1}<br>a) Ý a<br>b) Ý b<br>c) Ý c<br>d) Ý d`,
      options: [], ans: '1, 2, 3, 4', explanation: ''
    }));
  });
  await page.locator('#add-e-topics input').nth(2).check();
  await page.getByRole('button', { name: 'Tạo đề tự động' }).click();

  await expect(page.locator('[data-structured-kind="answerParts"]')).toHaveCount(10);
  await expect(page.locator('[data-structured-kind="answerParts"] .exam-structured-part')).toHaveCount(40);
  await expect(page.locator('input[id^="add-e-q-ans-"]')).toHaveCount(0);

  await page.locator('#add-e-name').fill('Đề tương thích câu cũ');
  await page.locator('#add-e-q-structured-display-0-0').fill('Ý cũ đã chỉnh sửa');
  await page.locator('#add-e-q-structured-answer-0-0').fill('10');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Lưu chỉnh sửa' }).click();
  const savedQuestion = await page.evaluate(() => app.data.exams[0].questions[0]);
  expect(savedQuestion.partAnswerCounts).toEqual([1, 1, 1, 1]);
  expect(savedQuestion.ans).toBe('10, 2, 3, 4');
  expect(savedQuestion.q).toContain('a) Ý cũ đã chỉnh sửa');
});

test('Tạo đề tự động không đưa câu một ý vào đề', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await expect.poll(() => page.locator('#add-e-topics input').count()).toBeGreaterThan(2);
  await page.evaluate(() => {
    const topic = app.constants.topics['4'].math.hk1[2];
    app.data.questionTemplates = [];
    app.data.libraryQuestions = Array.from({ length: 10 }, (_, index) => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: index % 2 ? 'Chuỗi Quy luật' : 'So sánh', q: `Câu cũ một ý ${index + 1}`, options: [], ans: index % 2 ? '34' : '<', explanation: ''
    }));
  });
  await page.locator('#add-e-topics input').nth(2).check();
  const dialogPromise = page.waitForEvent('dialog').then(async dialog => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });
  await Promise.all([
    dialogPromise,
    page.getByRole('button', { name: 'Tạo đề tự động' }).click()
  ]);
  const dialogMessage = await dialogPromise;
  expect(dialogMessage).toContain('cấu trúc bốn ý');
  await expect(page.locator('[data-structured-kind]')).toHaveCount(0);
});

test('Tạo đề tự động báo rõ chủ đề chưa có nguồn bốn ý', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);
  await page.locator('#add-e-class').selectOption('Lớp 4');
  await expect.poll(() => page.locator('#add-e-topics input').count()).toBeGreaterThan(3);
  const missingTopic = await page.evaluate(() => app.constants.topics['4'].math.hk1[3]);
  await page.evaluate(() => {
    const structuredTopic = app.constants.topics['4'].math.hk1[2];
    const missingTopic = app.constants.topics['4'].math.hk1[3];
    app.data.questionTemplates = [];
    app.data.libraryQuestions = [
      ...Array.from({ length: 10 }, (_, index) => ({
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: structuredTopic,
        type: 'Điền khuyết', q: `Câu bốn ý ${index + 1}<br>a) Ý a<br>b) Ý b<br>c) Ý c<br>d) Ý d`,
        options: [], ans: '1, 2, 3, 4', explanation: '',
        practiceRows: ['a', 'b', 'c', 'd'].map((label, partIndex) => ({ label, display: `Ý ${label}`, answer: String(partIndex + 1) })),
        partAnswerCounts: [1, 1, 1, 1]
      })),
      ...Array.from({ length: 10 }, (_, index) => ({
        classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: missingTopic,
        type: 'So sánh', q: `Câu một ý ${index + 1}`, options: [], ans: '<', explanation: ''
      }))
    ];
  });
  await page.locator('#add-e-topics input').nth(2).check();
  await page.locator('#add-e-topics input').nth(3).check();
  const dialogPromise = page.waitForEvent('dialog').then(async dialog => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });
  await Promise.all([
    dialogPromise,
    page.getByRole('button', { name: 'Tạo đề tự động' }).click()
  ]);
  const dialogMessage = await dialogPromise;
  expect(dialogMessage).toContain('cấu trúc bốn ý');
  expect(dialogMessage).toContain(missingTopic);
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
      type: 'Điền khuyết', q: `Câu chủ đề ${topicIndex + 1}.${index + 1}<br>a) Ý a<br>b) Ý b<br>c) Ý c<br>d) Ý d`,
      options: [], ans: '1, 2, 3, 4', explanation: '',
      practiceRows: ['a', 'b', 'c', 'd'].map((label, partIndex) => ({ label, display: `Ý ${label}`, answer: String(partIndex + 1) })),
      partAnswerCounts: [1, 1, 1, 1]
    })));
    const originalRandom = Math.random;
    Math.random = () => 0.5;
    app.admin.autoGenerateExam();
    Math.random = originalRandom;
  }, selectedTopics);

  await expect(page.locator('select[id^="add-e-q-topic-"]')).toHaveCount(10);
  await expect(page.locator('[data-structured-kind="practiceRows"]')).toHaveCount(10);
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

test('Soạn đề Toán lớp 4 hiển thị đồng nhất bốn ý cho các cấu trúc template', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExamComposer(page);

  await page.evaluate(() => {
    const topicAngles = app.constants.topics['4'].math.hk1[1];
    const topicNumbers = app.constants.topics['4'].math.hk1[2];
    const svg = '<svg viewBox="0 0 20 20" width="80" height="48"><circle cx="10" cy="10" r="7" fill="#0284c7"></circle></svg>';
    const angleItems = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'].map((type, index) => ({
      label: String.fromCharCode(97 + index), type, svg
    }));
    const angleCountRows = [
      { label: 'a', text: 'góc nhọn' },
      { label: 'b', text: 'góc vuông' },
      { label: 'c', text: 'góc tù' },
      { label: 'd', text: 'góc bẹt' }
    ];
    const subquestions = ['a', 'b', 'c', 'd'].map((label, index) => ({
      label, prompt: `Câu con ${label}`, options: ['A', 'B', 'C', 'D'], answer: ['A', 'B', 'C', 'D'][index]
    }));
    const practiceRows = ['a', 'b', 'c', 'd'].map((label, index) => ({
      label, expression: `${index + 1} + ${index + 1} = ___`, answer: String((index + 1) * 2)
    }));
    const comparisonRows = ['a', 'b', 'c', 'd'].map((label, index) => ({
      label, leftText: String(index + 1), rightText: String(index + 2), answer: '<'
    }));
    const sequenceRounds = ['a', 'b', 'c', 'd'].map((label, index) => ({
      label, sequence: [index + 1, index + 2, index + 3], blankIndexes: [1], display: `${index + 1}, ___, ${index + 3}`
    }));
    const statements = ['A', 'B', 'C', 'D'].map((label, index) => ({
      label, text: `Nhận định ${label}`, answer: index % 2 === 0 ? 'Đúng' : 'Sai'
    }));
    const makeQuestion = (index, structure, type, ans, topic = index % 2 ? topicNumbers : topicAngles) => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic, type,
      q: `Câu nhiều phần ${index + 1}`, ans, options: [], explanation: '', ...structure
    });
    const questions = [
      makeQuestion(0, { instruction: 'Phân loại các góc.', angleItems, options: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'] }, 'Kéo thả', 'Góc nhọn, Góc vuông, Góc tù, Góc bẹt'),
      makeQuestion(1, { subquestions }, 'Trắc nghiệm', 'A, B, C, D'),
      makeQuestion(2, { instruction: 'Đếm các góc.', angleVisual: svg, angleCountRows }, 'Điền khuyết', '1, 2, 2, 0'),
      makeQuestion(3, { templateId: 'number.four_operations_expressions', subquestions: practiceRows }, 'Điền khuyết', '2, 4, 6, 8'),
      makeQuestion(4, { comparisonRows }, 'Kéo thả', '<, <, <, <'),
      makeQuestion(5, { statements }, 'Đúng/Sai', 'Đúng, Sai, Đúng, Sai'),
      makeQuestion(6, { partAnswerCounts: [1, 1, 1, 1] }, 'Điền khuyết', '1, 2, 3, 4'),
      makeQuestion(7, { instruction: 'Đếm các góc.', angleVisual: svg, angleCountRows: angleCountRows.map(row => ({ ...row })) }, 'Điền khuyết', '1, 2, 2, 0'),
      makeQuestion(8, { subquestions: subquestions.map(item => ({ ...item })) }, 'Trắc nghiệm', 'A, B, C, D'),
      makeQuestion(9, { templateId: 'number.natural_sequence', sequenceRounds, partAnswerCounts: [1, 1, 1, 1] }, 'Chuỗi Quy luật', '2, 3, 4, 5')
    ];
    app.data.exams = [{
      id: 'exam-grade-4-all-structured', name: 'Đề Toán lớp 4 bốn ý', classlevel: 'Lớp 4', subject: 'Toán',
      period: 'Giữa kỳ 1', topics: [topicAngles, topicNumbers], questions
    }];
    app.data.libraryQuestions = [];
    app.data.questionTemplates = [];
    app.admin.examComposerDraft = null;
    app.admin.renderESubTab('add', 0);
  });

  await expect(page.locator('.exam-question-card')).toHaveCount(10);
  await expect(page.locator('[data-structured-kind]')).toHaveCount(10);
  for (const kind of ['angleItems', 'subquestions', 'angleCountRows', 'practiceRows', 'comparisonRows', 'statements', 'answerParts', 'sequenceRounds']) {
    await expect(page.locator(`[data-structured-kind="${kind}"]`).first().locator('.exam-structured-part')).toHaveCount(4);
  }
  await expect(page.locator('[data-structured-kind="angleItems"] .exam-structured-visual')).toHaveCount(4);
  await expect(page.locator('[data-structured-kind="angleCountRows"] .exam-structured-visual')).toHaveCount(2);
  await expect(page.locator('input[id^="add-e-q-ans-"]')).toHaveCount(0);
  await expect(page.locator('#add-e-q-opts-wrapper-0')).toBeVisible();

  await page.locator('#add-e-q-structured-answer-0-0').selectOption('Góc tù');
  await page.locator('#add-e-q-structured-answer-2-0').fill('9');

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Lưu chỉnh sửa' }).click();
  const savedQuestions = await page.evaluate(() => app.data.exams[0].questions);
  const answerCounts = await page.evaluate(() => app.data.exams[0].questions.map(question => app.data.getQuestionAnswerCount(question)));
  expect(savedQuestions).toHaveLength(10);
  expect(answerCounts).toEqual(Array(10).fill(4));
  expect(savedQuestions[0].angleItems[0]).toMatchObject({ type: 'Góc tù' });
  expect(savedQuestions[0].ans).toBe('Góc tù, Góc vuông, Góc tù, Góc bẹt');
  expect(savedQuestions[0].options).toEqual(['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt']);
  expect(savedQuestions[2].ans).toBe('9, 2, 2, 0');
  expect(savedQuestions[2].angleCountRows).toHaveLength(4);
});
