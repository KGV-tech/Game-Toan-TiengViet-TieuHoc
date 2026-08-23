const { test, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

const reviewDirectory = join('test-results', 'ui-review');

async function captureUiReview(page, testInfo, fileName) {
  mkdirSync(reviewDirectory, { recursive: true });
  const filePath = join(reviewDirectory, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  await testInfo.attach(fileName, { path: filePath, contentType: 'image/png' });
}

async function openOfflineHomepage(page) {
  const consoleErrors = [];
  const supabaseRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('request', request => {
    if (request.url().includes('.supabase.co')) {
      supabaseRequests.push(request.url());
    }
  });

  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  await page.goto('/');

  return { consoleErrors, supabaseRequests };
}

async function expectSafeLoginScreen(page, consoleErrors, supabaseRequests) {
  await expect(page).toHaveTitle('Hành Trình Tri Thức Lớp 5');
  await expect(page.locator('#login-screen')).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: /Đăng nhập để bắt đầu/ })).toBeVisible();
  await expect(page.locator('#login-btn')).toBeVisible();
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

test('desktop: trang chủ hiển thị màn hình đăng nhập mà không gọi Supabase thật', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await expectSafeLoginScreen(page, consoleErrors, supabaseRequests);
  await captureUiReview(page, testInfo, 'login-desktop.png');
});

test('mobile dọc: nhắc học sinh xoay màn hình', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await expect(page.getByText('Vui lòng xoay ngang màn hình')).toBeVisible();
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await captureUiReview(page, testInfo, 'login-mobile-portrait-rotate.png');
});

test('mobile ngang: trang chủ hiển thị màn hình đăng nhập mà không gọi Supabase thật', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await expectSafeLoginScreen(page, consoleErrors, supabaseRequests);
  await captureUiReview(page, testInfo, 'login-mobile-landscape.png');
});

test('bảng hướng dẫn đầy đủ có mục lục và chỉ hiện phần Giáo viên cho Admin', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'minh-hoa', role: 'student' };
    app.showGuide();
  });

  await expect(page.locator('#guide-modal')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hướng Dẫn Hành Trình' })).toBeVisible();
  await expect(page.locator('.guide-intro span')).toHaveText([
    'Chào mừng bạn đến với hành trình cùng Robot Mèo thám hiểm!',
    'Hãy xoay thiết bị ngang để bắt đầu cuộc phiêu lưu.'
  ]);
  await expect(page.getByRole('navigation', { name: 'Mục lục hướng dẫn' })).toBeVisible();
  await expect(page.getByText('Đạt được 10điểm/lượt luyện tập')).toBeVisible();
  await expect(page.locator('#guide-map')).toContainText('Khám phá bản đồ');
  await expect(page.locator('#guide-exams')).toContainText('Bắt đầu làm bài');
  await expect(page.locator('#guide-history h3')).toHaveText('8. Kho Báu');
  await expect(page.getByRole('link', { name: 'Kho Báu' })).toBeVisible();
  await expect(page.locator('#guide-rewards .guide-reward-table')).toContainText('Làm đủ 5 ngày liên tiếp');
  await expect(page.getByRole('link', { name: 'May mắn' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nhiệm vụ' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dành cho Giáo viên' })).toHaveCount(0);
  await expect(page.locator('#guide-teacher')).toBeHidden();

  await page.getByRole('link', { name: 'Mở khóa chủ đề' }).click();
  await expect.poll(() => page.locator('#guide-content').evaluate(element => element.scrollTop)).toBeGreaterThan(0);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'co-giao', role: 'admin' };
    app.showGuide();
  });

  await expect(page.getByRole('link', { name: 'Dành cho Giáo viên' })).toBeVisible();
  await expect(page.locator('#guide-teacher')).toBeVisible();
  await expect(page.locator('#guide-teacher')).toContainText('Giao diện Mở/Khóa');
});

test('khung Hướng dẫn nằm trọn trong màn hình và chỉ cuộn phần nội dung', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openOfflineHomepage(page);
  await page.evaluate(() => {
    app.data.currentUser = { username: 'minh-hoa', role: 'student' };
    app.showGuide();
  });

  const panel = await page.locator('#guide-modal .sci-fi-panel').boundingBox();
  const closeButton = await page.locator('#guide-modal button[aria-label="Đóng Hướng dẫn"]').boundingBox();
  expect(panel.y).toBeGreaterThanOrEqual(16);
  expect(panel.y + panel.height).toBeLessThanOrEqual(752);
  expect(closeButton.y).toBeGreaterThanOrEqual(16);
  expect(closeButton.y + closeButton.height).toBeLessThanOrEqual(752);
  await expect.poll(() => page.locator('#guide-content').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
});

test('thang điểm chỉ chấp nhận 1, 2 hoặc 4 đáp án và giữ điểm phần tư', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const scores = await page.evaluate(() => ({
    single: app.game.calculateQuestionScore({ type: 'Điền khuyết', ans: '42' }, '42'),
    twoParts: app.game.calculateQuestionScore({ type: 'Điền khuyết', ans: 'đỏ, xanh' }, 'đỏ, vàng'),
    fourParts: app.game.calculateQuestionScore({
      type: 'Đúng/Sai',
      statements: [
        { answer: 'Đúng' }, { answer: 'Sai' }, { answer: 'Đúng' }, { answer: 'Sai' }
      ]
    }, ['Đúng', 'Sai', 'Sai', 'Sai']),
    invalidThree: app.data.validateQuestionScoring({ type: 'Điền khuyết', ans: 'a, b, c' }),
    invalidFive: app.data.validateQuestionScoring({ type: 'Điền khuyết', ans: 'a, b, c, d, e' })
  }));

  expect(scores.single).toMatchObject({ answerCount: 1, correctCount: 1, points: 1, isCorrect: true });
  expect(scores.twoParts).toMatchObject({ answerCount: 2, correctCount: 1, points: 0.5, isCorrect: false });
  expect(scores.fourParts).toMatchObject({ answerCount: 4, correctCount: 3, points: 0.75, isCorrect: false });
  expect(scores.invalidThree).toContain('1, 2 hoặc 4');
  expect(scores.invalidFive).toContain('1, 2 hoặc 4');
});

test('luyện đề hiển thị bốn lựa chọn Đúng/Sai để chấm từng phần', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const markup = await page.evaluate(() => app.exam.renderQuestionInput({
    type: 'Đúng/Sai',
    statements: [
      { label: 'A', text: 'Nhận định A', answer: 'Đúng' },
      { label: 'B', text: 'Nhận định B', answer: 'Sai' },
      { label: 'C', text: 'Nhận định C', answer: 'Đúng' },
      { label: 'D', text: 'Nhận định D', answer: 'Sai' }
    ]
  }, 0));

  expect(markup.match(/exam_q_tf_0_/g)).toHaveLength(8);
  expect(markup).toContain('Nhận định D');
});

test('template trắc nghiệm bốn phần hiển thị 16 lựa chọn và chấm 0,25 điểm mỗi phần', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const summary = await page.evaluate(() => {
    let seed = 37;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const question = window.Grade4MathTemplates.generateQuestion('number.smallest_of_four', { minimum: 10000, maximum: 99999 }, random);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return { answers: question.subquestions.map(item => item.answer), score: app.game.calculateQuestionScore(question, question.subquestions.map((item, index) => index === 3 ? item.options.find(option => option !== item.answer) : item.answer)) };
  });

  await expect(page.locator('.multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('.multi-choice-subquestion__option')).toHaveCount(16);
  await expect(page.locator('#game-play-view .play-center')).toHaveClass(/play-center--four-part-mc/);
  for (let index = 0; index < 4; index++) {
    await expect(page.locator(`.multi-choice-subquestion[data-index="${index}"]`)).toHaveClass(new RegExp(`multi-choice-subquestion--tone-${index}`));
  }
  await expect(page.locator('.multi-choice-subquestion--label-only')).toHaveCount(4);
  await expect.poll(() => page.locator('.multi-choice-subquestion--label-only').first().evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(2);
  const layout = await page.locator('#game-play-view .play-center').evaluate(element => ({
    hasVerticalOverflow: element.scrollHeight > element.clientHeight,
    topInset: Math.round(element.querySelector('.game-header').getBoundingClientRect().top - element.getBoundingClientRect().top)
  }));
  expect(layout.hasVerticalOverflow).toBe(false);
  expect(layout.topInset).toBeLessThanOrEqual(16);
  await expect(page.locator('.multi-choice-subquestion__heading h3')).toHaveCount(0);
  await expect(page.locator('.multi-choice-subquestion__label-only')).toHaveCount(4);
  await captureUiReview(page, testInfo, 'four-part-multiple-choice-desktop.png');
  expect(summary.score).toMatchObject({ answerCount: 4, correctCount: 3, points: 0.75, isCorrect: false });
  for (let index = 0; index < summary.answers.length; index++) {
    await page.locator(`.multi-choice-subquestion[data-index="${index}"] .multi-choice-subquestion__option`, { hasText: summary.answers[index] }).click();
  }
  await expect(page.locator('#submit-ans-btn')).toBeEnabled();
});

test('kết quả không để trống phần chi tiết khi không có câu trả lời', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.game.state = { ...app.game.state, score: 0, subject: 'math', questions: [], historyDetails: [] };
    app.game.finishPlay();
  });

  await expect(page.locator('#result-modal')).toBeVisible();
  await expect(page.locator('#result-msg')).not.toHaveText(/rất tốt/i);
  await expect(page.locator('#result-details')).toContainText(/chưa có chi tiết/i);
});

test('chi tiết kết quả của câu Đúng/Sai hiển thị đủ bốn nhận định', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.game.state = {
      ...app.game.state,
      score: 10,
      subject: 'math',
      questions: [],
      historyDetails: [{
        q: 'Số 674 809 231',
        type: 'Đúng/Sai',
        statements: [
          { label: 'A', text: 'Chữ số 6 thuộc lớp trăm triệu.', answer: 'Đúng' },
          { label: 'B', text: 'Chữ số 8 ở hàng trăm nghìn.', answer: 'Sai' },
          { label: 'C', text: 'Chữ số 9 thuộc lớp nghìn.', answer: 'Đúng' },
          { label: 'D', text: 'Chữ số 1 ở hàng đơn vị.', answer: 'Đúng' }
        ],
        selected: 'Đúng, Sai, Đúng, Đúng',
        correct: 'Đúng, Sai, Đúng, Đúng',
        isCorrect: true
      }]
    };
    app.game.finishPlay();
  });

  const details = page.locator('#result-details');
  await expect(details).toContainText('Số 674 809 231');
  await expect(details).toContainText('A. Chữ số 6 thuộc lớp trăm triệu.');
  await expect(details).toContainText('B. Chữ số 8 ở hàng trăm nghìn.');
  await expect(details).toContainText('C. Chữ số 9 thuộc lớp nghìn.');
  await expect(details).toContainText('D. Chữ số 1 ở hàng đơn vị.');
  await expect(details).not.toContainText('<br>');
});

test('chi tiết điền khuyết bốn phép tính không lặp nhãn phụ rỗng', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const historyQuestion = await page.evaluate(() => app.game.formatHistoryQuestion({
    q: 'Hãy điền số thích hợp vào chỗ trống:<br>a. ___ + 10 713 = 11 133<br>b. 13 102 = 91 714 ÷ ___',
    type: 'Điền khuyết',
    subquestions: [{ label: 'a' }, { label: 'b' }]
  }));

  expect(historyQuestion).toContain('Hãy điền số thích hợp vào chỗ trống:');
  expect(historyQuestion).not.toContain('undefined');
  expect(historyQuestion.match(/a\./g)).toHaveLength(1);
  expect(historyQuestion.match(/b\./g)).toHaveLength(1);
});

test('bài kiểm tra đặt nội dung trên nền giấy dễ đọc', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await expect(page.locator('.exam-paper')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('luyện tập tận dụng chiều cao, nền trong suốt và điều khiển không bị cắt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    document.getElementById('game-screen').className = 'screen active theme-math';
    document.getElementById('game-config-view').classList.add('active');
  });
  const configPanel = await page.locator('#game-config-view .glass-container-xl').boundingBox();
  const mascotColumn = await page.locator('#game-config-view .config-left').boundingBox();
  const topicPanel = await page.locator('#game-config-view .config-section').boundingBox();
  expect(configPanel.height).toBeGreaterThanOrEqual(860);
  const mascotCenter = mascotColumn.y + mascotColumn.height / 2;
  const topicCenter = topicPanel.y + topicPanel.height / 2;
  expect(mascotCenter).toBeGreaterThanOrEqual(topicCenter - 36);
  expect(mascotCenter).toBeLessThanOrEqual(topicCenter + 115);
  await expect(page.locator('#game-config-view .screen-title-row')).toHaveCSS('backdrop-filter', 'blur(8px)');
  await expect(page.locator('#game-config-title')).toHaveCSS('color', 'rgb(255, 234, 167)');
  await expect(page.locator('#game-config-title')).toHaveCSS('-webkit-text-stroke-width', '2px');

  await page.evaluate(() => {
    document.getElementById('game-config-view').classList.remove('active');
    document.getElementById('game-play-view').classList.add('active');
    const bubble = document.getElementById('cat-speech-bubble');
    bubble.textContent = 'Cố lên!';
    bubble.style.display = 'flex';
  });
  const playPanel = await page.locator('#game-play-view .glass-container-xl').boundingBox();
  const bubble = await page.locator('#cat-speech-bubble').boundingBox();
  const playLeft = await page.locator('#game-play-view .play-left').boundingBox();
  const playCenter = await page.locator('#game-play-view .play-center').boundingBox();
  const submitButton = await page.locator('#submit-ans-btn').boundingBox();
  expect(bubble.y).toBeGreaterThanOrEqual(playPanel.y + 35);
  expect(submitButton.width / playLeft.width).toBeLessThanOrEqual(.91);
  expect(playCenter.y + playCenter.height).toBeLessThanOrEqual(playPanel.y + playPanel.height - 16);
  await expect(page.locator('#game-play-view .glass-container-xl')).toHaveCSS('backdrop-filter', 'blur(2px)');
  await expect(page.locator('#game-play-view .play-center')).toHaveCSS('backdrop-filter', 'blur(2px)');
  await expect(page.locator('#topics-list')).toHaveCSS('overflow-y', 'visible');

  await page.evaluate(() => {
    document.getElementById('game-play-view').classList.remove('active');
    document.getElementById('game-screen').className = 'screen active theme-vietnamese';
    document.getElementById('game-config-view').classList.add('active');
  });
  await expect(page.locator('#game-config-title')).toHaveCSS('color', 'rgb(167, 243, 208)');
  await expect(page.locator('#game-config-title')).toHaveCSS('-webkit-text-stroke-width', '2px');

  await page.evaluate(() => {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('exam-select-screen').classList.add('active');
  });
  await expect(page.locator('#exam-select-screen .title-glow')).toHaveCSS('color', 'rgb(186, 230, 253)');
  await expect(page.locator('#exam-select-screen .title-glow')).toHaveCSS('-webkit-text-stroke-width', '2px');
  await expect(page.locator('#exam-select-screen .glass-container-xl')).toHaveCSS('backdrop-filter', 'blur(2px)');
  await expect(page.locator('#exam-select-screen .screen-title-row')).toHaveCSS('backdrop-filter', 'blur(8px)');
});

test('template két sắt: hiện minh hoạ và bốn câu con trên desktop', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const question = window.Grade4MathTemplates.generateQuestion('number.safe_password_by_place_value', {}, random);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.question-box--safe-password')).toBeVisible();
  await expect(page.locator('.safe-password-illustration')).toHaveCount(4);
  await expect(page.locator('.safe-password-illustration').nth(0)).toHaveAttribute('src', './src/assets/safe-password-3d-v3.png');
  await expect(page.locator('.safe-password-illustration').nth(1)).toHaveAttribute('src', './src/assets/safe-password-classic-red-v1.png');
  await expect(page.locator('.safe-password-illustration').nth(2)).toHaveAttribute('src', './src/assets/safe-password-future-violet-v1.png');
  await expect(page.locator('.safe-password-illustration').nth(3)).toHaveAttribute('src', './src/assets/safe-password-mini-teal-v1.png');
  expect((await page.locator('.multi-choice-subquestion').allTextContents()).join(' ')).not.toContain('Số nào dưới đây là mật khẩu mở khóa két sắt');
  await expect(page.locator('.safe-password-code')).toHaveCount(0);
  await expect(page.locator('#game-question-container')).not.toContainText(/mật khẩu có \d+ chữ số/);
  await expect(page.locator('.multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('.multi-choice-subquestion__option')).toHaveCount(16);
  await captureUiReview(page, testInfo, 'safe-password-desktop.png');
  const correctAnswers = await page.evaluate(() => app.game.state.questions[0].subquestions.map(item => item.answer));
  for (let index = 0; index < correctAnswers.length; index++) {
    await page.locator(`.multi-choice-subquestion[data-index="${index}"] .multi-choice-subquestion__option`, { hasText: correctAnswers[index] }).click();
  }
  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('.safe-password-illustration')).toHaveCount(4);
  await expect(page.locator('.safe-password-illustration').nth(0)).toHaveAttribute('src', './src/assets/safe-password-open-v1.png');
  await expect(page.locator('.safe-password-illustration').nth(1)).toHaveAttribute('src', './src/assets/safe-password-classic-red-open-v1.png');
  await expect(page.locator('.safe-password-illustration').nth(2)).toHaveAttribute('src', './src/assets/safe-password-future-violet-open-v1.png');
  await expect(page.locator('.safe-password-illustration').nth(3)).toHaveAttribute('src', './src/assets/safe-password-mini-teal-open-v1.png');
  await expect(page.locator('.safe-password-illustration').nth(0)).toHaveAttribute('alt', 'Két sắt đã mở');
  await captureUiReview(page, testInfo, 'safe-password-opened-desktop.png');
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('template két sắt bốn câu con không tràn ngang trên tablet', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openOfflineHomepage(page);

  const layout = await page.evaluate(() => {
    let seed = 74;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const question = window.Grade4MathTemplates.generateQuestion('number.safe_password_by_place_value', {}, random);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    const optionsFit = [...document.querySelectorAll('.multi-choice-subquestion__option')].every(option => option.scrollWidth <= option.clientWidth);
    return { optionsFit, overflowsHorizontally: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });

  await expect(page.locator('.multi-choice-subquestion')).toHaveCount(4);
  await expect(page.locator('.safe-password-illustration')).toHaveCount(4);
  expect(layout).toEqual({ optionsFit: true, overflowsHorizontally: false });
});

test('lượt luyện Toán lớp 4 đưa template phù hợp lên đầu lượt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const questionSources = await page.evaluate(() => {
    const topic = '3. Số có nhiều chữ số';
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '4' };
    app.data.settings = { hardTimeLimit: 10, examTimeLimit: 30 };
    app.data.libraryQuestions = Array.from({ length: 6 }, (_, index) => ({
      id: `static-${index}`,
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'Trắc nghiệm', q: `Câu hỏi kho ${index + 1}`, options: ['Đúng', 'Sai'], ans: 'Đúng'
    }));
    app.data.questionTemplates = [{
      id: 'template-smallest', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      question_type: 'Trắc nghiệm', generator_key: 'number.smallest_of_four',
      prompt_template: 'Hãy tìm số bé nhất trong các số sau.', config: { minimum: 10000, maximum: 99999 }, is_active: true
    }];
    app.game.openConfig('math');
    app.game.state.adminclasslevel = '4';
    app.game.state.selectedTopics = [topic];
    app.game.startPlay();
    return app.game.state.questions.map(question => question.templateId || 'static');
  });

  expect(questionSources).toHaveLength(10);
  expect(questionSources[0]).toBe('number.smallest_of_four');
  expect(questionSources.filter(source => source === 'number.smallest_of_four')).toHaveLength(5);
});

test('điền khuyết bốn phép tính hiện bốn dòng và cấu hình sinh câu hỏi', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    let seed = 58;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const question = window.Grade4MathTemplates.generateQuestion('number.four_arithmetic_blanks', {
      minimumDigits: 2, maximumDigits: 3, operations: ['+', '-'],
      layouts: ['expressionLeft', 'expressionRight', 'twoExpressions'], blankPositions: ['first', 'second', 'third', 'fourth']
    }, random);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.question-box--fill .template-fill-row')).toHaveCount(5);
  await expect(page.locator('.question-box--fill .magic-input')).toHaveCount(4);
  await expect(page.locator('.question-box--fill')).toContainText('a.');
  await expect(page.locator('.question-box--fill')).toContainText('d.');
  await expect.poll(() => page.locator('.question-box--fill .template-fill-row').nth(1).evaluate(element => getComputedStyle(element).justifyContent)).toBe('flex-start');
  await captureUiReview(page, testInfo, 'four-arithmetic-blanks-desktop.png');

  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'four-arithmetic-demo', name: 'Điền số trong bốn phép tính', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '3. Số có nhiều chữ số', question_type: 'Điền khuyết', generator_key: 'number.four_arithmetic_blanks',
      prompt_template: 'Hãy điền số thích hợp vào chỗ trống:<br>{exercises}',
      config: { minimum: 10, maximum: 999999999, minimumDigits: 2, maximumDigits: 9, operations: ['+', '-'], layouts: ['expressionLeft', 'expressionRight', 'twoExpressions'], blankPositions: ['first', 'second', 'third', 'fourth'] }
    }];
    app.admin.renderTemplateForm(0);
    document.getElementById('treasure-modal').style.display = 'block';
  });

  await expect(page.locator('.template-editor__rule--four-arithmetic-controls')).toBeVisible();
  await expect(page.locator('#template-example .template-editor__preview-image')).toBeVisible();
  await expect(page.locator('#template-example .template-editor__preview-image')).toHaveAttribute('src', /four-arithmetic-blanks\.jpg$/);
  await expect.poll(() => page.locator('#template-example .template-editor__preview-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.template-editor__guide b')).toHaveText('Diễn giải');
  await expect(page.locator('.template-editor__rule--four-arithmetic-controls h5')).toHaveCount(0);
  await expect.poll(() => page.locator('.template-editor__rules').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(2);
  await expect.poll(() => page.locator('.template-editor__arithmetic-settings').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(2);
  await expect.poll(() => page.locator('.template-editor__arithmetic-settings > .template-editor__fields--digit-count').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(1);
  await expect(page.locator('#template-arithmetic-min-digits')).toHaveValue('2');
  await expect(page.locator('#template-arithmetic-max-digits')).toHaveValue('9');
  await expect(page.locator('label:has(#template-arithmetic-min-digits)')).toContainText('Số lượng chữ số ít nhất');
  await expect(page.locator('label:has(#template-arithmetic-max-digits)')).toContainText('Số lượng chữ số nhiều nhất');
  await expect(page.locator('#template-arithmetic-operations')).toContainText('+');
  await expect(page.locator('#template-arithmetic-operations')).toContainText('Phép nhân (×)');
  await expect(page.locator('#template-arithmetic-operations')).toContainText('Phép chia (÷)');
  await expect(page.locator('#template-arithmetic-layouts')).toContainText('Hai vế đều là phép tính');
  await expect(page.locator('#template-arithmetic-blank-positions')).toContainText('Số thứ ba');
  await expect(page.locator('#template-arithmetic-blank-positions')).toContainText('Số thứ tư');
  await expect(page.locator('#template-variables')).toContainText('{exercises}');
  await expect(page.locator('#template-example .template-editor__preview-image')).toBeVisible();
  await expect(page.locator('#template-example')).not.toContainText('Ví dụ kết quả');
  await captureUiReview(page, testInfo, 'four-arithmetic-template-config.png');
  await page.locator('#template-generator').selectOption('number.safe_password_by_place_value');
  await expect(page.locator('#template-example .template-editor__preview-image')).toHaveAttribute('src', /safe-password-by-place-value\.jpg$/);

  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'digit-count-demo', name: 'Nhận biết chữ số theo hàng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '3. Số có nhiều chữ số', question_type: 'Trắc nghiệm', generator_key: 'number.digit_at_place',
      prompt_template: 'Số nào dưới đây có chữ số hàng {place} là {digit}?',
      config: { minimum: 10000, maximum: 999999, allowedPlaces: ['tens'], allowedDigits: [4] }
    }];
    app.admin.renderTemplateForm(0);
  });

  await expect(page.locator('#template-minimum-digits')).toHaveValue('5');
  await expect(page.locator('#template-maximum-digits')).toHaveValue('6');
  await expect(page.locator('#template-minimum')).toBeHidden();
  await expect.poll(() => page.locator('.template-editor__rule--range-controls').evaluate(element => Math.round(element.getBoundingClientRect().width))).toBeGreaterThan(1000);
  await expect(page.locator('label:has(#template-minimum-digits)')).toContainText('Số lượng chữ số ít nhất');
  await expect(page.locator('label:has(#template-maximum-digits)')).toContainText('Số lượng chữ số nhiều nhất');
  await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config)).toMatchObject({
    minimum: 10000, maximum: 999999, minimumDigits: 5, maximumDigits: 6
  });
  await captureUiReview(page, testInfo, 'generic-digit-count-template-config.png');
});

test('lập số theo hàng căn trái bốn câu và giữ ô đáp án cạnh “Số đó là”', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.compose_from_places', {
      minimum: 10000, maximum: 99999
    }, () => 0.42);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.question-box--compose .template-compose-row')).toHaveCount(4);
  await expect(page.locator('.question-box--compose .template-compose-answer')).toHaveCount(4);
  await expect(page.locator('.question-box--four-part-fill')).toBeVisible();
  await expect(page.locator('.template-compose-row--tone-0')).toHaveCount(1);
  await expect(page.locator('.template-compose-row--tone-1')).toHaveCount(1);
  await expect(page.locator('.template-compose-row--tone-2')).toHaveCount(1);
  await expect(page.locator('.template-compose-row--tone-3')).toHaveCount(1);
  await expect.poll(() => page.locator('.question-box--compose .template-compose-row').first().evaluate(element => getComputedStyle(element).textAlign)).toBe('left');
  await expect.poll(() => page.locator('.question-box--compose .template-compose-answer').first().evaluate(element => getComputedStyle(element).whiteSpace)).toBe('nowrap');
  await captureUiReview(page, testInfo, 'compose-from-places-desktop.png');
});

test('tổng phân tích bốn câu dùng bốn thẻ màu cân đối', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.missing_expanded_addend', {
      minimum: 1000, maximum: 99999
    }, () => 0.42);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.question-box--four-part-fill')).toBeVisible();
  await expect(page.locator('.template-fill-row--tone-0')).toHaveCount(1);
  await expect(page.locator('.template-fill-row--tone-1')).toHaveCount(1);
  await expect(page.locator('.template-fill-row--tone-2')).toHaveCount(1);
  await expect(page.locator('.template-fill-row--tone-3')).toHaveCount(1);
  await expect(page.locator('.question-box--fill .template-fill-row')).toHaveCount(5);
  await captureUiReview(page, testInfo, 'missing-expanded-addend-desktop.png');
});

test('bốn phép tính điền khuyết chủ đề 1 có bốn ý và đủ bốn phép', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    let seed = 805;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const question = window.Grade4MathTemplates.generateQuestion('number.four_operations_fill_blanks', {
      minimumDigits: 2, maximumDigits: 3, operations: ['+', '-', '*', '/']
    }, random);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.question-box--fill .template-fill-row')).toHaveCount(5);
  await expect(page.locator('.question-box--fill .magic-input')).toHaveCount(4);
  await expect(page.locator('.question-box--fill')).toContainText('Hãy điền số thích hợp vào chỗ trống:');
  const generated = await page.evaluate(() => {
    const question = app.game.state.questions[0];
    return { operations: question.practiceRows.map(row => row.operation).sort(), score: app.game.calculateQuestionScore(question, question.ans) };
  });
  expect(generated.operations).toEqual(['*', '+', '-', '/']);
  expect(generated.score).toMatchObject({ correctCount: 4, answerCount: 4, points: 1, isCorrect: true });
  await captureUiReview(page, testInfo, 'four-operations-fill-blanks-desktop.png');

  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'four-operations-fill-demo', name: 'Bốn phép tính: điền số còn thiếu', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '1. Ôn tập và bổ sung', question_type: 'Điền khuyết', generator_key: 'number.four_operations_fill_blanks',
      prompt_template: '{question}',
      config: { minimum: 10, maximum: 99999, minimumDigits: 2, maximumDigits: 5, operations: ['+', '-', '*', '/'] }
    }];
    app.admin.renderTemplateForm(0);
    document.getElementById('treasure-modal').style.display = 'block';
  });

  await expect(page.locator('.template-editor__rule--four-arithmetic-controls')).toBeVisible();
  await expect(page.locator('.template-editor__rule--four-arithmetic-layouts')).toBeHidden();
  await expect(page.locator('.template-editor__rule--four-arithmetic-blank-positions')).toBeHidden();
  await expect(page.locator('#template-arithmetic-operations').locator('input')).toHaveCount(4);
  await expect(page.locator('#template-arithmetic-operations').locator('input').first()).toBeDisabled();
  await expect(page.locator('fieldset:has(#template-arithmetic-operations) legend')).toHaveText('Bốn phép tính dùng trong mỗi lượt');
  await expect(page.locator('#template-arithmetic-min-digits')).toHaveValue('2');
  await expect(page.locator('#template-arithmetic-max-digits')).toHaveValue('5');
  await expect(page.locator('#template-variables')).toContainText('{exercises}');
  const savedConfig = await page.evaluate(() => app.admin.collectTemplateForm().config);
  expect(savedConfig).toEqual(expect.objectContaining({
    minimumDigits: 2, maximumDigits: 5, operations: ['+', '-', '*', '/']
  }));
  expect(savedConfig.layouts).toBeUndefined();
  await captureUiReview(page, testInfo, 'four-operations-fill-blanks-template-config.png');

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('.template-editor__rule--four-arithmetic-controls')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('bốn phép tính tính giá trị biểu thức hiển thị dạng nhiều bước như sách', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await page.evaluate(() => {
    let seed = 806;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const question = window.Grade4MathTemplates.generateQuestion('number.four_operations_expressions', {
      minimumDigits: 2, maximumDigits: 3, operations: ['+', '-', '*', '/']
    }, random);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });
  await expect(page.locator('.four-operations-expression-row')).toHaveCount(4);
  await expect(page.locator('.four-operations-practice__expression')).toHaveCount(4);
  await expect(page.locator('.four-operations-practice__expression--sky')).toHaveCount(1);
  await expect(page.locator('.four-operations-practice__expression--rose')).toHaveCount(1);
  await expect(page.locator('.four-operations-practice__expression--mint')).toHaveCount(1);
  await expect(page.locator('.four-operations-practice__expression--lavender')).toHaveCount(1);
  await expect(page.locator('.four-operations-expression-row__prompt')).toHaveCount(0);
  await expect(page.locator('.question-box--fill .magic-input')).toHaveCount(4);
  await expect(page.locator('.four-operations-expression-title')).toHaveText('Tính giá trị của biểu thức:');
  await expect(page.locator('#game-play-view .play-center')).toHaveClass(/play-center--four-expressions/);
  await expect.poll(() => page.locator('.four-operations-expression-list').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(1);
  await expect.poll(() => page.locator('.four-operations-practice__expression').first().evaluate(element => getComputedStyle(element).flexWrap)).toBe('nowrap');
  const layout = await page.locator('#game-play-view .play-center').evaluate(element => ({
    hasVerticalOverflow: element.scrollHeight > element.clientHeight,
    topInset: Math.round(element.querySelector('.game-header').getBoundingClientRect().top - element.getBoundingClientRect().top)
  }));
  expect(layout.hasVerticalOverflow).toBe(false);
  expect(layout.topInset).toBeLessThanOrEqual(16);
  await captureUiReview(page, testInfo, 'four-operations-expressions-desktop.png');

  const longExpressionLayout = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.four_operations_expressions', {
      minimumDigits: 9, maximumDigits: 9, operations: ['+', '-', '*', '/']
    }, (() => { let seed = 807; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    app.game.loadQuestion();
    return [...document.querySelectorAll('.four-operations-practice__expression')].every(element => element.scrollWidth <= element.clientWidth);
  });
  expect(longExpressionLayout).toBe(true);
});

test('so sánh kéo thả bốn phép tính luôn hiện đủ ba dấu', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const random = (() => {
      let seed = 83;
      return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
      };
    })();
    const question = window.Grade4MathTemplates.generateQuestion('number.four_arithmetic_comparisons', {
      minimumDigits: 2, maximumDigits: 3, operations: ['+', '-'],
      layouts: ['expressionLeft', 'expressionRight', 'twoExpressions']
    }, random);
    // Supabase may label this template as “So sánh”; comparisonRows must still retain drag-and-drop.
    question.type = 'So sánh';
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.question-box--four-comparisons')).toBeVisible();
  await expect(page.locator('.comparison-drag-sign')).toHaveCount(3);
  await expect(page.locator('.comparison-drag-sign').first()).toHaveAttribute('draggable', 'true');
  await expect(page.locator('.comparison-drag-row')).toHaveCount(4);
  await expect(page.locator('.comparison-drag-slot')).toHaveCount(4);
  await expect(page.locator('.comparison-drag-row--tone-0')).toHaveCount(1);
  await expect(page.locator('.comparison-drag-row--tone-1')).toHaveCount(1);
  await expect(page.locator('.comparison-drag-row--tone-2')).toHaveCount(1);
  await expect(page.locator('.comparison-drag-row--tone-3')).toHaveCount(1);
  await expect(page.locator('#game-play-view .play-center')).toHaveClass(/play-center--four-comparisons/);
  const comparisonLayout = await page.locator('#game-play-view .play-center').evaluate(element => ({
    hasVerticalOverflow: element.scrollHeight > element.clientHeight,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    topInset: Math.round(element.querySelector('.game-header').getBoundingClientRect().top - element.getBoundingClientRect().top),
    titleBackground: getComputedStyle(element.querySelector('.template-question-copy')).backgroundImage
  }));
  expect(comparisonLayout).toMatchObject({ hasVerticalOverflow: false, horizontalOverflow: false });
  expect(comparisonLayout.topInset).toBeLessThanOrEqual(16);
  expect(comparisonLayout.titleBackground).not.toBe('none');
  await page.locator('.comparison-drag-sign', { hasText: '>' }).click();
  await page.locator('.comparison-drag-slot').first().click();
  await expect(page.locator('.comparison-drag-slot').first()).toHaveText('>');
  await captureUiReview(page, testInfo, 'four-arithmetic-comparisons-desktop.png');
  const correctSigns = await page.evaluate(() => app.game.state.questions[0].ans.split(', '));
  for (let index = 0; index < correctSigns.length; index++) {
    await page.locator(`.comparison-drag-sign[data-sign="${correctSigns[index]}"]`).click();
    await page.locator('.comparison-drag-slot').nth(index).click();
  }
  await expect(page.locator('#submit-ans-btn')).toBeEnabled();
  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('.comparison-drag-slot').first()).toHaveCSS('border-color', 'rgb(74, 222, 128)');
  await expect.poll(() => page.evaluate(() => app.game.state.score)).toBe(1);

  const expandedFormLayout = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.compare_number_forms', {
      minimum: 10000, maximum: 99999
    }, (() => { let seed = 84; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    app.game.loadQuestion();
    const center = document.querySelector('#game-play-view .play-center');
    return {
      rowsFit: [...document.querySelectorAll('.comparison-drag-row')].every(row => row.scrollWidth <= row.clientWidth),
      hasVerticalOverflow: center.scrollHeight > center.clientHeight
    };
  });
  expect(expandedFormLayout).toEqual({ rowsFit: true, hasVerticalOverflow: false });
  await captureUiReview(page, testInfo, 'compare-number-forms-desktop.png');

  const longExpandedFormLayout = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.compare_number_forms', {
      minimum: 100000000, maximum: 999999999
    }, (() => { let seed = 85; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    app.game.loadQuestion();
    const center = document.querySelector('#game-play-view .play-center');
    return {
      rowsFit: [...document.querySelectorAll('.comparison-drag-row')].every(row => row.scrollWidth <= row.clientWidth),
      hasVerticalOverflow: center.scrollHeight > center.clientHeight
    };
  });
  expect(longExpandedFormLayout).toEqual({ rowsFit: true, hasVerticalOverflow: false });

  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'four-arithmetic-comparison-demo', name: 'So sánh bốn phép tính kéo thả', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '3. Số có nhiều chữ số', question_type: 'Kéo thả', generator_key: 'number.four_arithmetic_comparisons',
      prompt_template: 'Điền dấu thích hợp:<br>{exercises}',
      config: { minimum: 10, maximum: 999999999, minimumDigits: 2, maximumDigits: 9, operations: ['+', '-'], layouts: ['expressionLeft', 'expressionRight', 'twoExpressions'] }
    }];
    app.admin.renderTemplateForm(0);
    document.getElementById('treasure-modal').style.display = 'block';
  });

  await expect(page.locator('.template-editor__rule--four-arithmetic-controls')).toBeVisible();
  await expect(page.locator('.template-editor__rule--four-arithmetic-blank-positions')).toBeHidden();
  await expect(page.locator('#template-arithmetic-comparisons')).toHaveCount(0);
  await expect(page.locator('#template-variables')).toContainText('{exercises}');
  const savedConfig = await page.evaluate(() => app.admin.collectTemplateForm().config);
  expect(savedConfig).toEqual(expect.objectContaining({
    minimumDigits: 2, maximumDigits: 9, operations: ['+', '-'],
    layouts: ['expressionLeft', 'expressionRight', 'twoExpressions']
  }));
  await captureUiReview(page, testInfo, 'four-arithmetic-comparisons-template-config.png');
});

test('so sánh số với dạng tổng vẫn là kéo thả khi kho lưu loại So sánh', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.compare_number_forms', {
      minimum: 10000, maximum: 99999
    }, Math.random);
    question.type = 'So sánh';
    question.options = [];
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.comparison-drag-sign')).toHaveCount(3);
  await expect(page.locator('.comparison-drag-row')).toHaveCount(4);
  await expect(page.locator('.magic-input')).toHaveCount(0);
});

test('Kho Template: két sắt hiện đủ khai báo lớp và hàng', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'safe-password-demo', name: 'Mật khẩu két sắt theo hàng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '3. Số có nhiều chữ số', question_type: 'Trắc nghiệm', generator_key: 'number.safe_password_by_place_value',
      prompt_template: 'Số nào dưới đây là mật khẩu mở khóa két sắt?<br>{condition1} và {condition2}.',
      config: { minimum: 0, maximum: 999999999, minimumCodeLength: 9, maximumCodeLength: 9, condition1Scope: 'random', condition1Classes: ['millionsClass'], condition1Places: ['millions'], condition1Digits: [0], condition2Places: ['hundredThousands'], condition2Digits: [3] }
    }];
    app.admin.renderTemplateForm(0);
    document.getElementById('treasure-modal').style.display = 'block';
  });

  await expect(page.locator('.template-editor__rule--safe-password-class-controls')).toBeVisible();
  await expect(page.locator('#treasure-title')).toHaveText('Cài Đặt Hệ Thống');
  await expect(page.locator('.template-editor__rule--safe-password-controls')).toBeVisible();
  await expect(page.locator('#template-safe-password-condition1-classes')).toContainText('Lớp tỷ');
  await expect(page.locator('#template-safe-password-condition1-places')).toContainText('Triệu');
  await expect(page.locator('#template-safe-password-condition2-places')).toContainText('Trăm nghìn');
  await expect(page.locator('#template-variables')).toContainText('{condition1}');
  await expect(page.locator('#template-variables')).toContainText('{condition2}');
  await captureUiReview(page, testInfo, 'safe-password-template-config.png');
});

test('Kho Template: Đúng/Sai hiện cấu hình lớp, hàng và biến nhận định', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.questionTemplates = [{
      id: 'true-false-demo', name: 'Đúng/Sai về lớp và hàng của chữ số', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '3. Số có nhiều chữ số', question_type: 'Đúng/Sai', generator_key: 'number.place_value_true_false',
      prompt_template: 'Số {number}<br>Hãy chọn ĐÚNG hay SAI cho các câu dưới đây:',
      config: { minimum: 10000000, maximum: 999999999, statementKinds: ['class', 'place'] }
    }];
    app.admin.renderTemplateForm(0);
    document.getElementById('treasure-modal').style.display = 'block';
  });

  await expect(page.locator('.template-editor__rule--true-false-controls')).toBeVisible();
  await expect(page.locator('#template-true-false-kinds')).toBeVisible();
  await expect(page.locator('#template-true-false-kinds')).toContainText('Nhận định về lớp');
  await expect(page.locator('#template-true-false-kinds')).toContainText('Nhận định về hàng');
  await expect(page.locator('#template-true-false-kinds input[value="class"]')).toBeChecked();
  await expect(page.locator('#template-true-false-kinds input[value="place"]')).toBeChecked();
  await expect(page.locator('#template-variables')).toContainText('{number}');
  await expect(page.locator('#template-variables')).toContainText('{statements}');
  await captureUiReview(page, testInfo, 'true-false-template-config.png');
});

test('đối chiếu số và cách đọc dàn đều cột số theo chiều dọc', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = {
      type: 'Đối chiếu trùng khớp', q: 'Hãy nối mỗi số với cách đọc đúng.',
      options: ['11 985 233, 300 675 904, 8 199 209, 76 597 957', 'Mười một triệu chín trăm tám mươi lăm nghìn hai trăm ba mươi ba, Ba trăm triệu sáu trăm bảy mươi lăm nghìn chín trăm linh bốn, Tám triệu một trăm chín mươi chín nghìn hai trăm linh chín, Bảy mươi sáu triệu năm trăm chín mươi bảy nghìn chín trăm năm mươi bảy'],
      ans: '', classlevel: 'Lớp 4', subject: 'Toán'
    };
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  const [left, right, leftFirst, rightFirst, leftLast, rightLast] = await Promise.all([
    page.locator('.matching-col.left-col').boundingBox(),
    page.locator('.matching-col.right-col').boundingBox(),
    page.locator('.matching-col.left-col .matching-item').first().boundingBox(),
    page.locator('.matching-col.right-col .matching-item').first().boundingBox(),
    page.locator('.matching-col.left-col .matching-item').last().boundingBox(),
    page.locator('.matching-col.right-col .matching-item').last().boundingBox()
  ]);
  expect(right.width).toBeGreaterThan(left.width);
  expect(Math.abs(leftFirst.y - rightFirst.y)).toBeLessThanOrEqual(2);
  expect(Math.abs((leftLast.y + leftLast.height) - (rightLast.y + rightLast.height))).toBeLessThanOrEqual(2);
  await captureUiReview(page, testInfo, 'matching-balanced-columns.png');
});

test('bản đồ thu hút chú ý và chế độ chọn chủ đề có trạng thái rõ ràng', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await expect(page.locator('.station-artwork .station-label').first()).toHaveCSS('animation-name', 'map-station-beacon');
  await expect(page.locator('.station-guide .station-img')).toHaveCSS('filter', 'none');
  await page.evaluate(() => {
    const multi = document.querySelector('input[name="topicMode"][value="multi"]');
    multi.checked = true;
    multi.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('.topic-mode-option:has(input[value="multi"]) span')).toHaveCSS('background-color', 'rgb(37, 99, 235)');
});

test('cửa hàng làm nổi trạm đang chọn và không lộ tỉ lệ thưởng nội bộ', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { id: 'demo-student', username: 'minh-hoa', fullname: 'Học sinh Minh họa', role: 'student', stars: 7 };
    app.data.userPets = [];
    app.shop.open();
    app.shop.switchTab('lucky');
  });

  await expect(page.locator('#shop-modal .notebook-tab.active')).toHaveAttribute('aria-label', 'Trạm May Mắn');
  await expect(page.locator('#shop-modal .notebook-tab.active')).toHaveCSS('outline-width', '3px');
  await expect(page.getByText(/0,1%/)).toHaveCount(0);
  await expect(page.locator('.lucky-wheel-stage')).toHaveCSS('width', '473px');
  await expect(page.locator('.lucky-spin-button')).toHaveCSS('width', '332px');

  await page.evaluate(() => app.shop.switchTab('pets', document.querySelector('#shop-modal .notebook-tab')));
  await expect(page.locator('.pet-station-title')).toHaveCSS('white-space', 'normal');
});

test('Admin có avatar giáo viên, 1.000 sao và xem được giao diện thú cưng minh hoạ', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = {
      id: 'demo-admin', username: 'admin', fullname: 'Giáo viên', role: 'admin',
      avatar_key: 'teacher-female', stars: 1000,
    };
    app.data.userPets = [];
    app.auth.updateHeader();
    app.shop.open();
    app.shop.switchTab('mypets');
  });

  await expect(page.locator('.player-info-card__avatar--teacher')).toHaveAttribute('src', './public/avatar-teacher-female.png');
  await expect(page.locator('#player-info')).toContainText('1.000');
  await expect(page.getByText('Bộ sưu tập minh hoạ cho Giáo viên')).toBeVisible();
  await expect(page.locator('.admin-pet-preview-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /Kích hoạt|Tắt khoang|Trả lại thú cưng/i })).toHaveCount(0);
  await captureUiReview(page, testInfo, 'admin-profile-desktop.png');

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('.admin-pet-preview')).toBeVisible();
  await captureUiReview(page, testInfo, 'admin-profile-tablet.png');
});

test('nút bắt đầu làm bài nằm trọn trong màn hình chọn đề', async ({ page }) => {
  await page.setViewportSize({ width: 2048, height: 1049 });
  await openOfflineHomepage(page);
  await page.evaluate(() => document.getElementById('exam-select-screen').classList.add('active'));

  const box = await page.locator('#exam-select-screen .btn-start-massive').boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(1020);
});

test('chọn chủ đề giữ khung rộng cho nhiều chủ đề và mèo máy nằm trong khung', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    document.getElementById('game-screen').className = 'screen active theme-math';
    document.getElementById('game-config-view').classList.add('active');
  });

  const practicePanel = await page.locator('#game-config-view .glass-container-xl').boundingBox();
  const practiceMascot = await page.locator('#game-config-view .config-left').boundingBox();
  const practiceTopics = await page.locator('#game-config-view .config-center').boundingBox();
  expect(practicePanel.width).toBeGreaterThanOrEqual(1180);
  expect(practiceMascot.x).toBeGreaterThanOrEqual(practicePanel.x);
  expect(practiceMascot.x + practiceMascot.width).toBeLessThanOrEqual(practicePanel.x + practicePanel.width);
  expect(practiceTopics.width).toBeGreaterThan(practiceMascot.width * 2);
  expect(practiceTopics.x).toBeGreaterThan(practiceMascot.x);
  await expect(page.locator('.config-left #game-start-btn')).toHaveCount(1);
  await expect(page.locator('#game-config-view .glass-container-xl')).toHaveCSS('backdrop-filter', 'blur(2px)');
  await expect(page.getByRole('heading', { name: 'Chọn Chủ đề' })).toBeVisible();
  await expect(page.getByRole('button', { name: '20 Câu' })).toHaveCount(0);
  await expect(page.locator('#game-config-view .count-options')).toHaveCount(0);
  await expect(page.getByText('Số câu hỏi', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dễ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Khó' })).toBeVisible();
  expect(await page.evaluate(() => ({
    questionsPerRound: app.game.questionsPerRound,
    hasSelectableCount: 'count' in app.game.state,
    hasSetCount: typeof app.game.setCount === 'function'
  }))).toEqual({ questionsPerRound: 10, hasSelectableCount: false, hasSetCount: false });

  await page.evaluate(() => {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('exam-select-screen').classList.add('active');
  });

  const examPanel = await page.locator('#exam-select-screen .glass-container-xl').boundingBox();
  expect(examPanel.width).toBeLessThanOrEqual(1040);
});

test('admin khóa chủ đề nhưng vẫn test được, học sinh chỉ thấy chủ đề đã khóa', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '5' };
    app.data.settings = { hardTimeLimit: 10, examTimeLimit: 30 };
    app.game.openConfig('math');
  });

  const testModeButton = page.getByRole('button', { name: 'Giao diện Test', exact: true });
  const manageModeButton = page.getByRole('button', { name: 'Giao diện Mở/Khóa', exact: true });
  await expect(testModeButton).toBeVisible();
  await expect(manageModeButton).toBeVisible();
  await expect(page.locator('.config-center > #admin-topic-mode-controls')).toBeVisible();
  await expect(page.locator('.config-section #admin-topic-mode-controls')).toHaveCount(0);
  await expect(page.locator('#game-start-btn')).toBeVisible();
  await expect(page.locator('.topic-mode-toggle')).toBeVisible();
  await expect(page.locator('.config-difficulty-options')).toBeVisible();

  await manageModeButton.click();
  await expect(page.locator('#game-start-btn')).toBeHidden();
  await expect(page.locator('.topic-mode-toggle')).toBeHidden();
  await expect(page.locator('.config-difficulty-options')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Mở', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Khóa', exact: true })).toBeVisible();

  const lockedTopic = page.locator('#topics-list .topic-card').first();
  const secondLockedTopic = page.locator('#topics-list .topic-card').nth(1);
  const lockedTopicName = await lockedTopic.textContent();
  await lockedTopic.click();
  await secondLockedTopic.click();
  await expect.poll(() => page.evaluate(() => app.game.state.selectedTopics.length)).toBe(2);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Khóa', exact: true }).click();
  await expect(lockedTopic).toHaveClass(/topic-card--locked/);
  await expect(secondLockedTopic).toHaveClass(/topic-card--locked/);
  await expect(lockedTopic).toContainText('Đã khóa');

  await page.evaluate(() => {
    app.data.currentUser = { username: 'student', role: 'student', classlevel: '5' };
    app.game.openConfig('math');
  });
  const studentLockedTopic = page.locator('#topics-list .topic-card', { hasText: lockedTopicName.trim().replace('Đã khóa', '').trim() }).first();
  await expect(studentLockedTopic).toHaveClass(/topic-card--locked/);
  await expect(studentLockedTopic.locator('input')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Giao diện Test', exact: true })).toBeHidden();

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '5' };
    app.game.openConfig('math');
  });
  const adminTopic = page.locator('#topics-list .topic-card', { hasText: lockedTopicName.trim().replace('Đã khóa', '').trim() }).first();
  await expect(adminTopic.locator('input')).toBeEnabled();
  await expect(page.locator('#game-start-btn')).toBeVisible();
});

test('học sinh chỉ mở chủ đề kế tiếp sau một lượt luyện tập đạt 10 điểm', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const progression = await page.evaluate(() => {
    app.data.currentUser = { id: 'student-1', username: 'minh', role: 'student', classlevel: '5', history: [] };
    app.data.settings = { topicLocks: {} };
    app.game.openConfig('math');

    const topics = app.game.getOrderedTopics('5', 'math');
    const firstTopic = topics[0];
    const secondTopic = topics[1];
    const before = {
      firstLocked: app.game.isStudentProgressionLocked('5', 'math', firstTopic),
      secondLocked: app.game.isStudentProgressionLocked('5', 'math', secondTopic)
    };
    const firstCard = document.querySelector('#topics-list .topic-card');
    const secondCard = document.querySelectorAll('#topics-list .topic-card')[1];

    app.data.currentUser.history.push({
      title: 'Toán', topic: firstTopic, score: 9, questionCount: 10, details: Array(10).fill({})
    });
    const afterNine = app.game.isStudentProgressionLocked('5', 'math', secondTopic);

    app.data.currentUser.history.push({
      title: 'Toán', topic: firstTopic, score: 10, questionCount: 10, details: Array(10).fill({})
    });
    const afterPerfect = app.game.isStudentProgressionLocked('5', 'math', secondTopic);
    const nextTopic = topics[2];
    const nextLocked = app.game.isStudentProgressionLocked('5', 'math', nextTopic);
    app.data.settings.topicUnlockOverrides = { '5': { math: { [nextTopic]: true } } };

    return {
      before,
      initialCards: { first: firstCard.classList.contains('topic-card--locked'), second: secondCard.classList.contains('topic-card--locked') },
      afterNine,
      afterPerfect,
      nextLocked,
      teacherOpenedNext: app.game.isStudentProgressionLocked('5', 'math', nextTopic)
    };
  });

  expect(progression).toEqual({
    before: { firstLocked: false, secondLocked: true },
    initialCards: { first: false, second: true },
    afterNine: true,
    afterPerfect: false,
    nextLocked: true,
    teacherOpenedNext: false
  });
});

const auditStates = [
  { name: 'register', screenId: 'register-screen' },
  { name: 'map', screenId: 'map-screen' },
  { name: 'game-config', screenId: 'game-screen', gameViewId: 'game-config-view' },
  { name: 'game-play', screenId: 'game-screen', gameViewId: 'game-play-view' },
  { name: 'exam-select', screenId: 'exam-select-screen' },
  { name: 'exam-play', screenId: 'exam-play-screen' },
  { name: 'guide-modal', screenId: 'map-screen', modalId: 'guide-modal' },
  { name: 'result-modal', screenId: 'game-screen', gameViewId: 'game-play-view', modalId: 'result-modal' },
  { name: 'treasure-achievements', screenId: 'map-screen', studentTreasureTab: 'my_treasure' },
  { name: 'treasure-history', screenId: 'map-screen', studentTreasureTab: 'history' },
  { name: 'quest-board', screenId: 'map-screen', questBoard: true },
  { name: 'shop-pets', screenId: 'map-screen', shopTab: 'pets' },
  { name: 'shop-my-pets', screenId: 'map-screen', shopTab: 'mypets' },
  { name: 'shop-lucky', screenId: 'map-screen', shopTab: 'lucky' },
  { name: 'admin-players', screenId: 'map-screen', adminTab: 'players' },
  { name: 'admin-settings', screenId: 'map-screen', adminTab: 'settings' },
  { name: 'admin-templates', screenId: 'map-screen', adminTab: 'templates' },
  { name: 'admin-questions', screenId: 'map-screen', adminTab: 'questions' },
  { name: 'admin-exams', screenId: 'map-screen', adminTab: 'exams' },
  { name: 'admin-quests', screenId: 'map-screen', adminTab: 'quests' },
];

async function showAuditState(page, state) {
  await page.evaluate(({ screenId, gameViewId, modalId, adminTab, studentTreasureTab, questBoard, shopTab }) => {
    document.querySelectorAll('.screen').forEach(element => element.classList.remove('active'));
    document.querySelectorAll('.game-view').forEach(element => element.classList.remove('active'));
    document.querySelectorAll('.modal, .modal-overlay').forEach(element => element.classList.remove('active'));
    // Các modal này dùng inline style, nên cần tắt rõ ràng trước mỗi ảnh audit.
    const guideModal = document.getElementById('guide-modal');
    guideModal.style.display = 'none';
    ['treasure-modal', 'quest-modal', 'shop-modal'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });

    document.getElementById(screenId).classList.add('active');
    if (gameViewId) document.getElementById(gameViewId).classList.add('active');
    if (modalId === 'guide-modal') {
      guideModal.style.display = 'flex';
    } else if (modalId) {
      document.getElementById(modalId).classList.add('active');
    }

    document.getElementById('player-info').textContent = 'Minh Anh · Lớp 5 · 1.250 điểm';
    document.getElementById('game-config-title').textContent = 'Luyện tập Toán lớp 5';
    document.getElementById('topics-list').innerHTML = '<button class="topic-card active">Số tự nhiên</button><button class="topic-card">Phân số</button><button class="topic-card">Hình học</button>';
    document.getElementById('game-question-container').textContent = 'Số nào lớn nhất trong các số sau?';
    document.getElementById('game-options-container').innerHTML = '<button class="option-btn">12.345</button><button class="option-btn">12.354</button><button class="option-btn">12.435</button><button class="option-btn">12.453</button>';
    document.getElementById('exam-student-name').textContent = 'Minh Anh';
    document.getElementById('exam-questions-container').innerHTML = '<section class="exam-q-block"><div class="exam-q-text">Câu 1. Viết số thích hợp vào chỗ trống.</div><label class="exam-opt-label" for="audit-exam-answer">Đáp án <input id="audit-exam-answer" class="fill-input" inputmode="numeric" aria-label="Đáp án câu 1"></label></section>';
    document.getElementById('result-score').textContent = '0';
    document.getElementById('result-msg').textContent = 'Cố gắng thêm nữa bạn nhé (Cần ≥ 8 điểm để nhận sao).';
    document.getElementById('result-details').innerHTML = '<article><b>1. Số nào lớn nhất?</b><br>Con chọn: <span style="color:#f87171">Bỏ trống</span><br><span style="color:#4ade80">Đáp án: 12.453</span></article>';
    document.querySelector('#result-modal .result-layout').classList.remove('result-layout--single-column');
    document.getElementById('treasure-content-area').textContent = 'Kho báu minh họa cho phiên review UI.';
    document.getElementById('quest-list-container').innerHTML = '<article class="quest-card">Hoàn thành 5 câu Toán hôm nay</article>';
    document.getElementById('shop-content-area').textContent = 'Cửa hàng minh họa cho phiên review UI.';

    const demoStudent = {
      id: 'demo-student', username: 'minh-hoa', fullname: 'Học sinh Minh họa', role: 'student', classlevel: '5',
      totalscore: 1250, stars: 7,
      history: [{ title: 'Luyện tập Phân số', topic: 'Phân số', difficulty: 'Vừa', questionCount: 10, score: 9, date: '2026-08-08' }],
    };
    Object.assign(app.data, {
      currentUser: demoStudent,
      userPets: [{ id: 'pet-1', user_username: 'minh-hoa', pet_image: 'pet_1.png', pet_name: 'Thỏ Hồng Không Gian' }],
      userQuests: [{ id: 'progress-1', quest_id: 'quest-1', progress: 3, is_completed: false }],
      quests: [{ id: 'quest-1', title: 'Hoàn thành 5 câu Toán', target_count: 5, target_subject: 'math', target_score: 7, reward_stars: 2, assign_type: 'all', is_active: true }],
    });

    if (studentTreasureTab) {
      app.treasure.open();
      app.treasure.switchTab(studentTreasureTab);
    }
    if (questBoard) app.quest.open();
    if (shopTab) {
      app.shop.open();
      app.shop.switchTab(shopTab);
    }

    if (adminTab) {
      // Dữ liệu minh họa cục bộ: chỉ để nhìn đủ giao diện quản trị, không gọi mạng.
      Object.assign(app.data, {
        currentUser: { id: 'demo-admin', name: 'Giáo viên Demo', role: 'admin', classlevel: '5' },
        users: [
          { id: 'student-1', name: 'Học sinh Minh họa', classlevel: '5', totalscore: 1250, stars: 7, approved: true },
          { id: 'student-2', name: 'Hồ sơ chờ duyệt', classlevel: '4', totalscore: 0, stars: 0, approved: false },
        ],
        questions: [{ id: 'question-1', classlevel: 'Lớp 5', subject: 'Toán', topic: 'Phân số', type: 'Trắc nghiệm', q: 'Phân số nào lớn hơn?', options: ['1/2', '1/3'], ans: '1/2' }],
        exams: [{ id: 'exam-1', name: 'Kiểm tra Toán tuần 1', classlevel: 'Lớp 5', subject: 'Toán', questions: ['question-1'] }],
        quests: [{ id: 'quest-1', name: 'Hoàn thành 5 câu Toán', subject: 'Toán', target: 5, is_active: true }],
        questionTemplates: [{ id: 'template-1', classlevel: 'Lớp 5', subject: 'Toán', semester: 'Học kỳ 1', topic: 'Số tự nhiên', question_type: 'Trắc nghiệm', generator_key: 'number.largest_of_four' }],
      });
      app.admin.openAdmin();
      app.admin.switchTab(adminTab);
    }
  }, state);
}

test('bốn template Góc chủ đề 2 có giao diện thật, bốn ý và preview trong Kho Template', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const templates = [
    ['g4-m-angle-count-in-polygon', 'Điền khuyết', 'angle-count-in-polygon.jpg', '.magic-input', '.angle-count-rows'],
    ['g4-m-angle-drag-classify', 'Kéo thả', 'angle-drag-classify.jpg', '.drag-slot', '.drag-inventory--angle'],
    ['g4-m-angle-clock-classify', 'Kéo thả', 'angle-clock-classify.jpg', '.drag-slot', '.drag-inventory--angle'],
    ['g4-m-angle-count-eight-angles', 'Điền khuyết', 'angle-count-eight-angles.jpg', '.magic-input', '.angle-count-rows'],
  ];

  for (const [generator, questionType, previewImage, responseSelector, layoutSelector] of templates) {
    await page.evaluate(({ generator, questionType }) => {
      let seed = 20260820;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 0x100000000;
      };
      const question = window.Grade4MathTemplates.generateQuestion(generator, {}, random);
      app.data.currentUser = { username: 'demo-student', role: 'student' };
      app.game.state = { score: 0, currentIdx: 0, questions: [question] };
      document.getElementById('treasure-modal').style.display = 'none';
      document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
      document.getElementById('game-screen').classList.add('active');
      document.getElementById('game-play-view').classList.add('active');
      app.game.loadQuestion();
    }, { generator, questionType });

    await expect.poll(() => page.locator('#game-question-container svg').count()).toBeGreaterThan(0);
    await expect(page.locator(`#game-question-container ${responseSelector}`)).toHaveCount(4);
    const layoutRoot = questionType === 'Kéo thả' ? '#game-options-container' : '#game-question-container';
    await expect(page.locator(`${layoutRoot} ${layoutSelector}`)).toHaveCount(1);
    if (questionType === 'Kéo thả') {
      await expect(page.locator('#game-options-container .drag-inventory--angle .drag-item')).toHaveCount(4);
      await expect(page.locator('#game-question-container .angle-drag-arrow')).toHaveCount(0);
      expect(await page.locator('#game-options-container .drag-inventory--angle .drag-item').evaluateAll(items => {
        const tops = items.map(item => Math.round(item.getBoundingClientRect().top));
        return new Set(tops).size;
      })).toBe(1);
      await page.locator('#game-options-container .drag-inventory--angle .drag-item').first().click();
      const firstSlot = page.locator('#game-question-container .angle-drag-row .drag-slot').first();
      await expect(firstSlot).toHaveText(/Góc /);
      expect(await firstSlot.evaluate(slot => {
        const style = getComputedStyle(slot);
        return style.whiteSpace === 'nowrap' && slot.scrollHeight <= slot.clientHeight;
      })).toBe(true);
      expect(await page.locator('#game-question-container .angle-drag-row').evaluateAll(rows => rows.every(row => {
        const rowBox = row.getBoundingClientRect();
        const slotBox = row.querySelector('.drag-slot').getBoundingClientRect();
        return slotBox.left >= rowBox.left && slotBox.right <= rowBox.right;
      }))).toBe(true);
    }
    await captureUiReview(page, testInfo, `topic2-gameplay-${previewImage.replace('.jpg', '.png')}`);

    await page.evaluate(({ generator, questionType }) => {
      app.data.questionTemplates = [{
        id: `${generator}-demo`, name: generator, classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc', question_type: questionType, generator_key: generator,
        prompt_template: '{question}', config: {}
      }];
      app.admin.renderTemplateForm(0);
      document.getElementById('treasure-modal').style.display = 'block';
    }, { generator, questionType });
    await expect(page.locator('#template-topic')).toHaveValue('2. Góc và đơn vị đo góc');
    await expect(page.locator('#template-question-type')).toHaveValue(questionType);
    await expect(page.locator('#template-example .template-editor__preview-image')).toHaveAttribute('src', new RegExp(`${previewImage}$`));
    await expect.poll(() => page.locator('#template-example .template-editor__preview-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.template-editor__rule--angle-info')).toBeVisible();
    await expect.poll(() => page.evaluate(() => app.admin.collectTemplateForm().config)).toEqual({});
  }
});

test('lượt luyện Chủ đề 2 tạo và chuyển đủ mười câu mà không làm treo giao diện', async ({ page }) => {
  test.setTimeout(15_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors } = await openOfflineHomepage(page);

  const outcome = await page.evaluate(() => {
    const topic = '2. Góc và đơn vị đo góc';
    const definitions = [
      ['g4-m-angle-count-in-polygon', 'Điền khuyết'],
      ['g4-m-angle-drag-classify', 'Kéo thả'],
      ['g4-m-angle-clock-classify', 'Kéo thả'],
      ['g4-m-angle-count-eight-angles', 'Điền khuyết']
    ];
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '4' };
    app.data.libraryQuestions = [];
    app.data.questionTemplates = definitions.map(([generator_key, question_type]) => ({
      id: generator_key,
      classlevel: 'Lớp 4',
      subject: 'Toán',
      semester: 'Học kỳ 1',
      topic,
      question_type,
      generator_key,
      prompt_template: '{question}',
      config: {},
      is_active: true
    }));
    app.game.openConfig('math');
    app.game.state.adminclasslevel = '4';
    app.game.state.selectedTopics = [topic];
    const startedAt = performance.now();
    app.game.startPlay();
    const rendered = [];
    for (let index = 0; index < app.game.state.questions.length; index += 1) {
      app.game.state.currentIdx = index;
      app.game.loadQuestion();
      rendered.push({
        templateId: app.game.state.questions[index].templateId,
        svgCount: document.querySelectorAll('#game-question-container svg').length,
        responseCount: document.querySelectorAll('#game-question-container .magic-input, #game-question-container .drag-slot').length
      });
    }
    return { elapsed: performance.now() - startedAt, rendered };
  });

  expect(outcome.rendered).toHaveLength(10);
  expect(outcome.rendered.every(item => item.svgCount > 0 && item.responseCount === 4)).toBe(true);
  expect(outcome.elapsed).toBeLessThan(1_000);
  expect(consoleErrors).toEqual([]);
});

test('lượt luyện Chủ đề 2 chỉ dùng template về góc khi kho có template gán nhầm chủ đề', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const templateIds = await page.evaluate(() => {
    const topic = '2. Góc và đơn vị đo góc';
    const angleTemplates = [
      ['g4-m-angle-count-in-polygon', 'Điền khuyết'],
      ['g4-m-angle-drag-classify', 'Kéo thả'],
      ['g4-m-angle-clock-classify', 'Kéo thả'],
      ['g4-m-angle-count-eight-angles', 'Điền khuyết']
    ];
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '4' };
    app.data.libraryQuestions = [];
    app.data.questionTemplates = [
      ...angleTemplates.map(([generator_key, question_type]) => ({
        id: generator_key, classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
        question_type, generator_key, prompt_template: '{question}', config: {}, is_active: true
      })),
      {
        id: 'misfiled-matching', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
        question_type: 'Đối chiếu trùng khớp', generator_key: 'number.match_number_words',
        prompt_template: 'Hãy nối mỗi số với cách đọc đúng.', config: {}, is_active: true
      }
    ];
    app.game.openConfig('math');
    app.game.state.adminclasslevel = '4';
    app.game.state.selectedTopics = [topic];
    app.game.startPlay();
    return app.game.state.questions.map(question => question.templateId);
  });

  expect(templateIds).toHaveLength(10);
  expect(templateIds.every(templateId => templateId.startsWith('g4-m-angle-'))).toBe(true);
});

test('lượt luyện không lặp nguyên câu khi template không sinh được biến thể mới', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const outcome = await page.evaluate(() => {
    const topic = '3. Số có nhiều chữ số';
    const alerts = [];
    window.alert = message => alerts.push(message);
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '4' };
    app.data.libraryQuestions = [{
      id: 'only-static', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'Trắc nghiệm', q: 'Câu hỏi kho duy nhất', options: ['Đúng', 'Sai'], ans: 'Đúng'
    }];
    app.data.questionTemplates = [{
      id: 'fixed-template', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      question_type: 'Trắc nghiệm', generator_key: 'number.smallest_of_four', prompt_template: '{question}', config: {}, is_active: true
    }];
    app.data.generateTemplateQuestion = () => ({
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      type: 'Trắc nghiệm', templateId: 'number.smallest_of_four',
      q: 'Câu hỏi động không đổi', options: ['1', '2'], ans: '1'
    });
    app.game.openConfig('math');
    app.game.state.adminclasslevel = '4';
    app.game.state.selectedTopics = [topic];
    app.game.startPlay();
    return { alerts, questionCount: app.game.state.questions.length };
  });

  expect(outcome.questionCount).toBe(0);
  expect(outcome.alerts).toEqual(['Chủ đề này chưa đủ câu hỏi khác nhau để tạo 10 câu. Hãy thêm câu hỏi hoặc template có biến thể.']);
});

test('lượt luyện Chủ đề 4 nạp generator đơn vị đo và tạo đủ mười câu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const outcome = await page.evaluate(() => {
    const topic = '4. Một số đơn vị đo Đại lượng';
    const generatorKeys = [
      'measurement.mass_unit_convert', 'measurement.area_unit_convert', 'measurement.time_unit_convert',
      'measurement.compare_units', 'measurement.match_equivalences',
      'measurement.unit_true_false', 'measurement.century_identification', 'measurement.word_problem_units'
    ];
    const alerts = [];
    window.alert = message => alerts.push(message);
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '4' };
    app.data.libraryQuestions = [];
    app.data.questionTemplates = generatorKeys.map(generator_key => ({
      id: generator_key, classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic,
      question_type: 'Điền khuyết', generator_key, prompt_template: '{question}', config: {}, is_active: true
    }));
    app.game.openConfig('math');
    app.game.state.adminclasslevel = '4';
    app.game.state.selectedTopics = [topic];
    app.game.startPlay();
    return { alerts, ids: app.game.state.questions.map(question => question.templateId) };
  });

  expect(outcome.alerts).toEqual([]);
  expect(outcome.ids).toHaveLength(10);
  expect(outcome.ids.every(id => id.startsWith('measurement.'))).toBe(true);
});

test('template Chủ đề 4 luôn giữ bốn phần khi Supabase còn prompt cũ', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const outcome = await page.evaluate(() => {
    const template = {
      classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '4. Một số đơn vị đo Đại lượng',
      question_type: 'Điền khuyết', generator_key: 'measurement.time_unit_convert',
      prompt_template: 'Điền số thích hợp.', config: {}
    };
    const question = app.data.generateTemplateQuestion(template);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return { question: question.q, blanks: document.querySelectorAll('.magic-input').length };
  });

  expect(outcome.question).toContain('a)');
  expect(outcome.question).toContain('d)');
  expect(outcome.blanks).toBe(4);
});

test('bài toán đơn vị đo giữ ô đáp số liền với phần câu còn thiếu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('measurement.word_problem_units', {}, () => 0.5);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.measurement-word-problem-row')).toHaveCount(4);
  await expect(page.locator('.measurement-word-problem-row .magic-input')).toHaveCount(4);
  await expect(page.locator('.measurement-word-problem-row .magic-input').first()).toHaveCSS('display', 'inline-block');
  await expect(page.locator('.measurement-word-problem-row', { hasText: 'giây' }).first()).toContainText('giây');
});

test('mọi câu Đúng/Sai dùng một tiêu đề ngắn, không lặp hướng dẫn', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.place_value_true_false');
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.tf-template-number')).toHaveText('Chọn Đúng/Sai?');
  await expect(page.locator('.tf-template-instruction')).toHaveCount(0);
  await expect(page.locator('.tf-statement').first()).toContainText('Trong số');
});

test('câu hỏi về thế kỉ hiển thị năm liền nhau, không có khoảng cách hàng nghìn', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const yearText = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('measurement.century_identification', {}, () => 0);
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return document.querySelector('.multi-choice-subquestion h3')?.textContent;
  });

  expect(yearText).toMatch(/Năm \d{4} thuộc thế kỉ nào/);
  expect(yearText).not.toMatch(/Năm \d{1,3} \d{3}/);
});

test('audit UI desktop: chụp toàn bộ màn hình lõi và modal chính', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  for (const state of auditStates) {
    await showAuditState(page, state);
    const visibleId = (state.adminTab || state.studentTreasureTab) ? 'treasure-modal'
      : state.questBoard ? 'quest-modal'
        : state.shopTab ? 'shop-modal'
          : (state.modalId ?? state.screenId);
    await expect(page.locator(`#${visibleId}`)).toBeVisible();
    if (state.modalId !== 'guide-modal') {
      await expect(page.locator('#guide-modal')).toBeHidden();
    }
    if (state.adminTab) {
      await expect(page.locator('#admin-tabs')).toBeVisible();
      await expect(page.locator('#treasure-content-area')).not.toBeEmpty();
      await expect(page.locator('#shop-modal')).toBeHidden();
    }
    await captureUiReview(page, testInfo, `audit-desktop-${state.name}.png`);
  }

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('audit UI mobile ngang: chụp toàn bộ màn hình lõi và modal chính', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  for (const state of auditStates) {
    await showAuditState(page, state);
    const visibleId = (state.adminTab || state.studentTreasureTab) ? 'treasure-modal'
      : state.questBoard ? 'quest-modal'
        : state.shopTab ? 'shop-modal'
          : (state.modalId ?? state.screenId);
    await expect(page.locator(`#${visibleId}`)).toBeVisible();
    if (state.modalId !== 'guide-modal') {
      await expect(page.locator('#guide-modal')).toBeHidden();
    }
    if (state.adminTab) {
      await expect(page.locator('#admin-tabs')).toBeVisible();
      await expect(page.locator('#treasure-content-area')).not.toBeEmpty();
      await expect(page.locator('#shop-modal')).toBeHidden();
    }
    await captureUiReview(page, testInfo, `audit-mobile-${state.name}.png`);
  }

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
