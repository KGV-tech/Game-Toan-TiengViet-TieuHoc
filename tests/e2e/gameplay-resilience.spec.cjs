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

test('màn làm bài dùng shell tối, gom hướng dẫn chung và không tạo scrollbar ngoài viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const layout = await page.evaluate(question => {
    app.data.currentUser = { username: 'resilient-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [question] };
    app.game.loadQuestion();
    const playCenter = document.querySelector('#game-play-view .play-center');
    const questionBox = document.getElementById('game-question-container');
    const rows = [...document.querySelectorAll('.multi-choice-subquestion h3')].map(element => element.textContent.trim());
    const commonPrompt = questionBox.querySelector('.question-shared-prompt');
    return {
      bodyOverflowY: getComputedStyle(document.documentElement).overflowY,
      pageOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      centerOverflow: playCenter.scrollHeight > playCenter.clientHeight,
      shellBackground: getComputedStyle(document.querySelector('#game-play-view .glass-container-xl')).backgroundColor,
      questionBackground: getComputedStyle(questionBox).backgroundColor,
      commonPromptText: commonPrompt?.textContent.trim() || '',
      commonPromptCount: questionBox.querySelectorAll('.question-shared-prompt').length,
      rows
    };
  }, makeSharedPromptQuestion());

  expect(layout.pageOverflow).toBe(false);
  expect(layout.centerOverflow).toBe(false);
  expect(layout.shellBackground).not.toBe('rgb(255, 255, 255)');
  expect(layout.questionBackground).not.toBe('rgb(255, 255, 255)');
  expect(layout.commonPromptCount).toBe(1);
  expect(layout.commonPromptText).toContain('Dãy số được lập theo quy luật');
  expect(layout.rows.every(text => !text.includes('Dãy số được lập theo quy luật'))).toBe(true);
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
