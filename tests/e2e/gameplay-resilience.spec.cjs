const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

function makeSharedPromptQuestion() {
  return {
    q: 'Tìm số thích hợp điền vào dãy:',
    type: 'Trắc nghiệm',
    ans: '10, 20, 30, 40',
    sharedPrompt: 'Dãy số được lập theo quy luật. Số thích hợp điền vào chỗ trống là số nào?',
    subquestions: ['a', 'b', 'c', 'd'].map((label, index) => ({
      label,
      prompt: `Dãy số được lập theo quy luật. Số thích hợp điền vào chỗ trống là số nào?<br>${index + 1}, ${index + 3}, ${index + 5}, ___`,
      options: [String((index + 1) * 10), String((index + 1) * 10 + 1), String((index + 1) * 10 + 2), String((index + 1) * 10 + 3)],
      answer: String((index + 1) * 10)
    }))
  };
}

test('màn làm bài dùng shell tối, gom hướng dẫn chung và không tạo scrollbar ngoài viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const layout = await page.evaluate(question => {
    app.data.currentUser = { username: 'resilient-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: Array.from({ length: 10 }, () => question) };
    app.game.loadQuestion();
    const playCenter = document.querySelector('#game-play-view .play-center');
    const questionBox = document.getElementById('game-question-container');
    const practiceStatus = document.getElementById('game-practice-status');
    const gamePlayerInfo = document.getElementById('game-player-info');
    const scoreDisplay = document.querySelector('#game-play-view .score-display');
    const progressTrack = document.getElementById('game-question-progress');
    const leftPanel = document.querySelector('#game-play-view .play-left');
    const rightPanel = document.querySelector('#game-play-view .play-right');
    const rows = [...document.querySelectorAll('.multi-choice-subquestion h3')].map(element => element.textContent.trim());
    const commonPrompt = questionBox.querySelector('.question-shared-prompt');
    return {
      bodyOverflowY: getComputedStyle(document.documentElement).overflowY,
      pageOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      centerOverflow: playCenter.scrollHeight > playCenter.clientHeight,
      shellBackground: getComputedStyle(document.querySelector('#game-play-view .glass-container-xl')).backgroundColor,
      questionBackground: getComputedStyle(questionBox).backgroundColor,
      questionGradient: getComputedStyle(questionBox).backgroundImage,
      practiceStatus: practiceStatus?.textContent.replace(/\s+/g, ' ').trim() || '',
      studentInfoVisible: Boolean(gamePlayerInfo) && getComputedStyle(gamePlayerInfo).display !== 'none',
      scoreDisplayVisible: scoreDisplay ? getComputedStyle(scoreDisplay).display !== 'none' : false,
      questionText: questionBox.textContent.trim(),
      progressVisible: getComputedStyle(progressTrack).display !== 'none',
      progressSegmentCount: progressTrack.children.length,
      currentSegmentCount: progressTrack.querySelectorAll('.is-current').length,
      leftGradient: getComputedStyle(leftPanel).backgroundImage,
      rightGradient: getComputedStyle(rightPanel).backgroundImage,
      commonPromptText: commonPrompt?.textContent.trim() || '',
      commonPromptCount: questionBox.querySelectorAll('.question-shared-prompt').length,
      rows
    };
  }, makeSharedPromptQuestion());

  expect(layout.pageOverflow).toBe(false);
  expect(layout.centerOverflow).toBe(false);
  expect(layout.shellBackground).not.toBe('rgb(255, 255, 255)');
  expect(layout.questionBackground).not.toBe('rgb(255, 255, 255)');
  expect(layout.questionGradient).toContain('linear-gradient');
  expect(layout.practiceStatus).toBe('Bài đang làmTìm số thích hợp điền vào dãy:');
  expect(layout.studentInfoVisible).toBe(false);
  expect(layout.scoreDisplayVisible).toBe(false);
  expect(layout.questionText).toBe('Dãy số được lập theo quy luật. Số thích hợp điền vào chỗ trống là số nào?');
  expect(layout.progressVisible).toBe(true);
  expect(layout.progressSegmentCount).toBe(10);
  expect(layout.currentSegmentCount).toBe(1);
  expect(layout.leftGradient).toContain('linear-gradient');
  expect(layout.rightGradient).toContain('linear-gradient');
  expect(layout.leftGradient).not.toBe(layout.rightGradient);
  expect(layout.commonPromptCount).toBe(1);
  expect(layout.commonPromptText).toContain('Dãy số được lập theo quy luật');
  expect(layout.rows.every(text => !text.includes('Dãy số được lập theo quy luật'))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('gameplay-shell-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 1024, height: 768 });
  const tabletLayout = await page.evaluate(() => {
    const shell = document.querySelector('#game-play-view .glass-container-xl');
    const left = document.querySelector('#game-play-view .play-left');
    const right = document.querySelector('#game-play-view .play-right');
    return {
      pageOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      leftFits: left.scrollHeight <= left.clientHeight,
      rightFits: right.scrollHeight <= right.clientHeight,
      shellFits: shell.scrollHeight <= shell.clientHeight
    };
  });
  expect(tabletLayout).toEqual({ pageOverflow: false, horizontalOverflow: false, leftFits: true, rightFits: true, shellFits: true });
});

test('panel phải giữ vòng tiến độ, nút hành động và lời giải theo đúng thứ tự', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const initial = await page.evaluate(question => {
    app.data.currentUser = { username: 'progress-panel-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    const questions = [0, 1].map(() => ({ ...question, explanation: 'Số chẵn có chữ số tận cùng là 0, 2, 4, 6 hoặc 8.' }));
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions };
    app.game.loadQuestion();
    const right = document.querySelector('#game-play-view .play-right');
    const ring = document.getElementById('game-progress-ring');
    const action = document.getElementById('submit-ans-btn');
    const solutionSlot = document.getElementById('game-progress-content');
    const rightRect = right.getBoundingClientRect();
    const centerRatio = element => {
      const rect = element.getBoundingClientRect();
      return ((rect.top + rect.height / 2) - rightRect.top) / rightRect.height;
    };
    return {
      order: [...right.children].map(element => element.id || element.className.split(' ')[0]),
      ringVisible: getComputedStyle(ring).display !== 'none',
      ringLabel: ring.getAttribute('aria-label'),
      progressText: document.getElementById('game-progress-copy').textContent.trim(),
      progressCopyWidth: document.getElementById('game-progress-copy').getBoundingClientRect().width,
      verticalCenters: [ring, action, solutionSlot].map(centerRatio),
      speechBubbleVisible: getComputedStyle(document.getElementById('cat-speech-bubble')).display !== 'none',
      actionLabel: document.getElementById('submit-ans-btn').getAttribute('aria-label')
    };
  }, makeSharedPromptQuestion());

  expect(initial.order).toEqual(['game-progress-panel', 'submit-ans-btn', 'game-progress-content']);
  expect(initial.ringVisible).toBe(true);
  expect(initial.ringLabel).toContain('hoàn thành 0 trên 4 ý');
  expect(initial.progressText).toContain('Hoàn thành 0/4 ý');
  expect(initial.progressCopyWidth).toBeLessThanOrEqual(2);
  expect(initial.verticalCenters[0]).toBeCloseTo(.3, 1);
  expect(initial.verticalCenters[1]).toBeCloseTo(.5, 1);
  expect(initial.verticalCenters[2]).toBeCloseTo(.7, 1);
  expect(initial.speechBubbleVisible).toBe(true);
  expect(initial.actionLabel).toBe('Kiểm tra');

  for (let index = 0; index < 4; index++) {
    await page.locator('.multi-choice-subquestion__option').nth(index * 4).click();
  }
  await expect(page.locator('#game-progress-copy')).toContainText('Hoàn thành 4/4 ý');

  const beforeCheck = await page.evaluate(() => ({
    ringVisible: getComputedStyle(document.getElementById('game-progress-ring')).display !== 'none',
    ringProgress: getComputedStyle(document.getElementById('game-progress-ring')).getPropertyValue('--ring-progress').trim(),
    solutionVisible: getComputedStyle(document.getElementById('explanation-box')).display !== 'none'
  }));
  expect(beforeCheck.ringVisible).toBe(true);
  expect(beforeCheck.ringProgress).toBe('100%');
  expect(beforeCheck.solutionVisible).toBe(false);

  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('#explanation-box')).toBeVisible();
  const afterCheck = await page.evaluate(() => ({
    order: [...document.querySelector('#game-play-view .play-right').children].map(element => element.id || element.className.split(' ')[0]),
    ringVisible: getComputedStyle(document.getElementById('game-progress-ring')).display !== 'none',
    ringProgress: getComputedStyle(document.getElementById('game-progress-ring')).getPropertyValue('--ring-progress').trim(),
    actionLabel: document.getElementById('submit-ans-btn').getAttribute('aria-label'),
    solutionText: document.getElementById('explanation-box').textContent
  }));
  expect(afterCheck.order).toEqual(['game-progress-panel', 'submit-ans-btn', 'game-progress-content']);
  expect(afterCheck.ringVisible).toBe(true);
  expect(afterCheck.ringProgress).toBe('100%');
  expect(afterCheck.actionLabel).toBe('Tiếp tục');
  expect(afterCheck.solutionText).toContain('Lời giải');

  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('#current-q-index')).toHaveText('2');
  const nextQuestion = await page.evaluate(() => ({
    ringVisible: getComputedStyle(document.getElementById('game-progress-ring')).display !== 'none',
    ringProgress: getComputedStyle(document.getElementById('game-progress-ring')).getPropertyValue('--ring-progress').trim(),
    progressText: document.getElementById('game-progress-copy').textContent,
    solutionVisible: getComputedStyle(document.getElementById('explanation-box')).display !== 'none'
  }));
  expect(nextQuestion.ringVisible).toBe(true);
  expect(nextQuestion.ringProgress).toBe('0%');
  expect(nextQuestion.progressText).toContain('Hoàn thành 0/4 ý');
  expect(nextQuestion.solutionVisible).toBe(false);
});

test('bốn câu con hiển thị thành lưới hai hàng hai cột như card lớn', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const grid = await page.evaluate(question => {
    app.data.currentUser = { username: 'square-card-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [question] };
    app.game.loadQuestion();
    const cards = [...document.querySelectorAll('.multi-choice-subquestion')].map(element => {
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), left: Math.round(rect.left), width: rect.width, height: rect.height };
    });
    const optionGrid = getComputedStyle(cards.length ? document.querySelector('.multi-choice-subquestion__options') : document.body);
    return { cards, optionColumns: optionGrid.gridTemplateColumns.split(' ').length };
  }, makeSharedPromptQuestion());

  const topRows = new Set(grid.cards.map(card => card.top));
  const firstRow = grid.cards.filter(card => card.top === grid.cards[0].top);
  expect(grid.cards).toHaveLength(4);
  expect(topRows.size).toBe(2);
  expect(firstRow).toHaveLength(2);
  expect(grid.cards.every(card => card.height / card.width >= .65)).toBe(true);
  expect(grid.optionColumns).toBe(2);
});

test('màn làm bài giữ nút hành động rõ ràng và không kéo giãn thẻ câu hỏi', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const layout = await page.evaluate(question => {
    app.data.currentUser = { username: 'balanced-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [question] };
    app.game.loadQuestion();

    const rect = selector => {
      const element = document.querySelector(selector);
      const box = element?.getBoundingClientRect();
      return box ? { top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
    };
    const actionImage = document.getElementById('submit-ans-img');
    const actionImageBox = actionImage.getBoundingClientRect();
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      shell: rect('#game-play-view > .glass-container-xl'),
      left: rect('#game-play-view .play-left'),
      center: rect('#game-play-view .play-center'),
      action: rect('#submit-ans-btn'),
      actionImage: { width: actionImageBox.width, height: actionImageBox.height },
      actionLabel: document.getElementById('submit-ans-btn').getAttribute('aria-label'),
      rows: [...document.querySelectorAll('.multi-choice-subquestion')].map(element => ({
        height: element.getBoundingClientRect().height,
        contentHeight: element.scrollHeight,
        bottom: element.getBoundingClientRect().bottom
      }))
    };
  }, makeSharedPromptQuestion());

  expect(layout.shell.bottom).toBeLessThanOrEqual(layout.viewport.height);
  expect(layout.shell.right).toBeLessThanOrEqual(layout.viewport.width);
  expect(layout.left.width).toBeGreaterThanOrEqual(220);
  expect(layout.action.width).toBeGreaterThanOrEqual(180);
  expect(layout.action.height).toBeGreaterThanOrEqual(42);
  expect(layout.actionImage.width).toBeGreaterThanOrEqual(layout.action.width * .9);
  expect(layout.actionImage.height).toBeGreaterThan(40);
  expect(layout.actionLabel).toBe('Kiểm tra');
  expect(layout.rows.every(row => row.height <= row.contentHeight + 28)).toBe(true);

  await page.setViewportSize({ width: 1024, height: 768 });
  const tabletLayout = await page.evaluate(question => {
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [question] };
    app.game.loadQuestion();
    const shell = document.querySelector('#game-play-view > .glass-container-xl').getBoundingClientRect();
    const left = document.querySelector('#game-play-view .play-left').getBoundingClientRect();
    const action = document.getElementById('submit-ans-btn').getBoundingClientRect();
    const actionImage = document.getElementById('submit-ans-img').getBoundingClientRect();
    return {
      shell: { right: shell.right, bottom: shell.bottom },
      leftWidth: left.width,
      action: { width: action.width, height: action.height },
      actionImage: { width: actionImage.width, height: actionImage.height },
      rows: [...document.querySelectorAll('.multi-choice-subquestion')].map(element => ({
        height: element.getBoundingClientRect().height,
        contentHeight: element.scrollHeight
      }))
    };
  }, makeSharedPromptQuestion());

  expect(tabletLayout.shell.right).toBeLessThanOrEqual(1024);
  expect(tabletLayout.shell.bottom).toBeLessThanOrEqual(768);
  expect(tabletLayout.leftWidth).toBeGreaterThanOrEqual(170);
  expect(tabletLayout.action.width).toBeGreaterThanOrEqual(145);
  expect(tabletLayout.action.height).toBeGreaterThanOrEqual(40);
  expect(tabletLayout.actionImage.width).toBeGreaterThanOrEqual(tabletLayout.action.width * .9);
  expect(tabletLayout.actionImage.height).toBeGreaterThan(35);
  expect(tabletLayout.rows.every(row => row.height <= row.contentHeight + 28)).toBe(true);
});

test('tiến độ lượt làm được lưu cục bộ và khôi phục đúng câu đang làm', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const restored = await page.evaluate(() => {
    app.data.currentUser = { username: 'resilient-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    const questions = Array.from({ length: 10 }, (_, index) => ({
      q: `Câu ${index + 1}`,
      type: 'Trắc nghiệm',
      options: ['A', 'B', 'C', 'D'],
      ans: 'A'
    }));
    app.game.state = {
      ...app.game.state,
      subject: 'math',
      selectedTopics: ['1. Ôn tập và bổ sung'],
      questions,
      currentIdx: 3,
      answerSubmitted: true,
      score: 2.25,
      historyDetails: [{ q: 'Câu 1', selected: 'A', correct: 'A', isCorrect: true, type: 'Trắc nghiệm' }],
      attemptId: 'round:resume-test'
    };
    app.game.saveAttemptDraft();
    const saved = JSON.parse(app.safeStorage.getItem(app.game.getAttemptStorageKey()));
    app.game.state = { ...app.game.state, currentIdx: 0, questions: [], historyDetails: [], score: 0 };
    const wasRestored = app.game.restoreAttemptDraft();
    return {
      wasRestored,
      currentIdx: app.game.state.currentIdx,
      questionCount: app.game.state.questions.length,
      score: app.game.state.score,
      savedQuestionIndex: saved.currentIdx
    };
  });

  expect(restored).toEqual({
    wasRestored: true,
    currentIdx: 4,
    questionCount: 10,
    score: 2.25,
    savedQuestionIndex: 4
  });
});

test('kết quả vẫn hiện và có bản local khi đồng bộ máy chủ thất bại', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const result = await page.evaluate(async () => {
    app.data.currentUser = { username: 'resilient-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    app.quest.updateProgress = async () => {};
    app.game.recordHistory = async () => ({
      error: new Error('network down'),
      entry: {
        attempt_id: 'round:offline-result-test',
        title: 'Toán',
        topic: 'Tất cả',
        subject: 'math',
        classlevel: '5',
        difficulty: 'Dễ',
        questionCount: 1,
        score: 0,
        details: []
      }
    });
    app.game.state = {
      ...app.game.state,
      subject: 'math',
      questions: [{ q: 'Câu kiểm tra', type: 'Trắc nghiệm', ans: 'A', options: ['A', 'B', 'C', 'D'] }],
      historyDetails: [{ q: 'Câu kiểm tra', selected: 'B', correct: 'A', isCorrect: false, type: 'Trắc nghiệm' }],
      score: 0,
      attemptId: 'round:offline-result-test',
      examName: ''
    };
    await app.game.finishPlay();
    const pending = JSON.parse(app.safeStorage.getItem(app.game.getPendingResultsStorageKey()));
    const resultLayout = document.querySelector('#result-modal .result-layout');
    return {
      pendingCount: pending.length,
      message: document.getElementById('result-msg').textContent,
      modalActive: document.getElementById('result-modal').classList.contains('active'),
      resultBackground: getComputedStyle(resultLayout).backgroundColor
    };
  });

  expect(result.pendingCount).toBe(1);
  expect(result.message).toContain('đã lưu trên thiết bị');
  expect(result.message).not.toContain('Kết quả chưa được lưu');
  expect(result.modalActive).toBe(true);
  expect(result.resultBackground).not.toBe('rgb(0, 0, 0)');
});

test('mất mạng khi nộp bài vẫn mở kết quả ngay và không chờ máy chủ', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    app.data.currentUser = { username: 'offline-student', fullname: 'Học sinh offline', role: 'student' };
    app.quest.updateProgress = async () => {};
    let recordHistoryCalls = 0;
    app.game.recordHistory = async () => {
      recordHistoryCalls += 1;
      throw new Error('Không được gọi máy chủ khi đang offline');
    };
    app.game.state = {
      ...app.game.state,
      subject: 'math',
      questions: [{ q: 'Câu offline', type: 'Trắc nghiệm', ans: 'A', options: ['A', 'B', 'C', 'D'] }],
      historyDetails: [{ q: 'Câu offline', selected: 'A', correct: 'A', isCorrect: true, type: 'Trắc nghiệm' }],
      score: 1,
      attemptId: 'round:offline-immediate-test',
      examName: ''
    };
    await app.game.finishPlay();
    return {
      recordHistoryCalls,
      modalActive: document.getElementById('result-modal').classList.contains('active'),
      pendingCount: JSON.parse(app.safeStorage.getItem(app.game.getPendingResultsStorageKey())).length
    };
  });

  expect(result).toEqual({ recordHistoryCalls: 0, modalActive: true, pendingCount: 1 });
});
