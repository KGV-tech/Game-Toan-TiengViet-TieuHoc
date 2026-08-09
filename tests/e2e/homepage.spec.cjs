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

test('template két sắt: hiện minh hoạ và bốn đáp án trên desktop', async ({ page }, testInfo) => {
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
  await expect(page.locator('.safe-password-illustration')).toHaveAttribute('src', './src/assets/safe-password-3d-v3.png');
  await expect(page.locator('.safe-password-code')).toHaveCount(0);
  await expect(page.locator('#game-question-container')).not.toContainText(/mật khẩu có \d+ chữ số/);
  await expect(page.locator('#game-options-container .ans-btn')).toHaveCount(4);
  await captureUiReview(page, testInfo, 'safe-password-desktop.png');
  const correctAnswer = await page.evaluate(() => app.game.state.questions[0].ans);
  await page.locator('#game-options-container .ans-btn', { hasText: correctAnswer }).click();
  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('.safe-password-illustration')).toHaveAttribute('src', './src/assets/safe-password-open-v1.png');
  await expect(page.locator('.safe-password-illustration')).toHaveAttribute('alt', 'Két sắt đã mở');
  await captureUiReview(page, testInfo, 'safe-password-opened-desktop.png');
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
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
  await expect(page.locator('#template-arithmetic-min-digits')).toHaveValue('2');
  await expect(page.locator('#template-arithmetic-max-digits')).toHaveValue('9');
  await expect(page.locator('#template-arithmetic-operations')).toContainText('+');
  await expect(page.locator('#template-arithmetic-layouts')).toContainText('Hai vế đều là phép tính');
  await expect(page.locator('#template-arithmetic-blank-positions')).toContainText('Số thứ ba');
  await expect(page.locator('#template-arithmetic-blank-positions')).toContainText('Số thứ tư');
  await expect(page.locator('#template-variables')).toContainText('{exercises}');
  await captureUiReview(page, testInfo, 'four-arithmetic-template-config.png');
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
  await expect.poll(() => page.evaluate(() => app.game.state.score)).toBe(10);

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
    app.data.currentUser = { id: 'demo-student', username: 'minh-hoa', fullname: 'Học sinh Minh họa', role: 'student', lollipops: 7 };
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

test('Admin có avatar giáo viên, 1.000 kẹo và xem được giao diện thú cưng minh hoạ', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = {
      id: 'demo-admin', username: 'admin', fullname: 'Giáo viên', role: 'admin',
      avatar_key: 'teacher-female', lollipops: 1000,
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
    document.getElementById('result-msg').textContent = 'Cố gắng thêm nữa bạn nhé (Cần ≥ 8 điểm để nhận kẹo).';
    document.getElementById('result-details').innerHTML = '<article><b>1. Số nào lớn nhất?</b><br>Con chọn: <span style="color:#f87171">Bỏ trống</span><br><span style="color:#4ade80">Đáp án: 12.453</span></article>';
    document.querySelector('#result-modal .result-layout').classList.remove('result-layout--single-column');
    document.getElementById('treasure-content-area').textContent = 'Kho báu minh họa cho phiên review UI.';
    document.getElementById('quest-list-container').innerHTML = '<article class="quest-card">Hoàn thành 5 câu Toán hôm nay</article>';
    document.getElementById('shop-content-area').textContent = 'Cửa hàng minh họa cho phiên review UI.';

    const demoStudent = {
      id: 'demo-student', username: 'minh-hoa', fullname: 'Học sinh Minh họa', role: 'student', classlevel: '5',
      totalscore: 1250, lollipops: 7,
      history: [{ title: 'Luyện tập Phân số', topic: 'Phân số', difficulty: 'Vừa', questionCount: 10, score: 9, date: '2026-08-08' }],
    };
    Object.assign(app.data, {
      currentUser: demoStudent,
      userPets: [{ id: 'pet-1', user_username: 'minh-hoa', pet_image: 'pet_1.png', pet_name: 'Thỏ Hồng Không Gian' }],
      userQuests: [{ id: 'progress-1', quest_id: 'quest-1', progress: 3, is_completed: false }],
      quests: [{ id: 'quest-1', title: 'Hoàn thành 5 câu Toán', target_count: 5, target_subject: 'math', target_score: 7, reward_lollipops: 2, assign_type: 'all', is_active: true }],
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
          { id: 'student-1', name: 'Học sinh Minh họa', classlevel: '5', totalscore: 1250, lollipops: 7, approved: true },
          { id: 'student-2', name: 'Hồ sơ chờ duyệt', classlevel: '4', totalscore: 0, lollipops: 0, approved: false },
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
