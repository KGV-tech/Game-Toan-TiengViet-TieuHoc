const { test, expect } = require('@playwright/test');
async function open(page) {
  await page.route('https://cdn.jsdelivr.net/**', r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.goto('/');
  await page.evaluate(() => window.gameTemplatesReady);
}
async function show(page, key, lesson = 31) {
  return page.evaluate(({ key, lesson }) => {
    const q = Grade4VietnameseTemplates.generateQuestion(`vietnamese.${key}`, { lesson: `g4-vietnamese-hk1-b${String(lesson).padStart(2, '0')}` });
    app.data.currentUser = { username: 'offline-student', role: 'student' };
    app.game.state = { subject: 'vietnamese', score: 0, currentIdx: 0, questions: [q], historyDetails: [] };
    document.querySelectorAll('.screen, .game-view').forEach(e => e.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return q;
  }, { key, lesson });
}
test('Vietnamese score preserves punctuation, accents and capitalization', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const q = { quickPractice: true, type: 'Trắc nghiệm', subquestions: [{ answer: 'Hà Nội' }, { answer: 'Đọc sách, viết bài' }] };
    return [VietnameseQuickPractice.score(q, ['Hà Nội', 'Đọc sách, viết bài']), VietnameseQuickPractice.score(q, ['hà Nội', 'Đọc sách, viết bài']), VietnameseQuickPractice.score(q, ['Ha Noi', '']), VietnameseQuickPractice.score(q, ['Hà Nội'.normalize('NFD'), ''])];
  });
  expect(result.map(r => r.points)).toEqual([1, 0.5, 0, 0.5]);
});

test('verified answers survive exams and history; edited wording cannot score', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const q = Grade4VietnameseTemplates.generateQuestion('vietnamese.character_detail', { lesson: 'g4-vietnamese-hk1-b02' });
    const selected = q.subquestions.map(p => p.answer);
    const full = app.game.calculateQuestionScore(q, selected).points;
    const history = app.game.formatHistoryQuestion(app.game.createHistoryDetail(q, selected, true));
    const host = document.createElement('div');
    host.innerHTML = app.exam.renderQuestionInput(q, 0);
    document.body.append(host);
    app.exam.state.questions = [q];
    app.exam.applySavedAnswers([selected]);
    const restored = app.exam.readQuestionAnswer(q, 0);
    host.remove();
    q.subquestions[0].prompt += ' Nội dung bị sửa';
    return { full, restored, selected, history, passage: q.passage, rejected: app.game.calculateQuestionScore(q, selected).points, html: app.exam.renderQuestionInput(q, 0) };
  });
  expect(result.full).toBe(1);
  expect(result.restored).toEqual(result.selected);
  expect(result.passage).not.toBe('');
  expect(result.history).toContain(result.passage);
  expect(result.rejected).toBe(0);
  expect(result.html).not.toContain('<select');
});

test('first lesson starts ten distinct verified questions without random retry dependence', async ({ page }) => {
  await open(page);
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  const result = await page.evaluate(async () => {
    app.data.currentUser = { id: 'offline-vietnamese', username: 'offline-vietnamese', role: 'student', classlevel: '4', history: [], stars: 0 };
    app.data.settings = { topicLocks: {}, lessonReleaseByClass: { '4': { vietnamese: 'g4-vietnamese-hk1-b01' } } };
    app.data.libraryQuestions = [{ subject: 'Tiếng Việt', classlevel: 'Lớp 4', q: 'Câu chưa kiểm chứng', ans: 'Sai' }];
    app.game.openConfig('vietnamese');
    const template = Grade4VietnameseTemplates.getDefaultTemplates()[0];
    app.game.state.selectedTopics = [template.topic];
    app.game.state.selectedLessons = [template.lesson];
    const random = Math.random;
    Math.random = () => 0.5;
    try { await app.game.startPlay(); } finally { Math.random = random; }
    return app.game.state.questions.map(q => ({ valid: Grade4VietnameseTemplates.validateQuestion(q), ids: q.subquestions?.map(p => p.id).sort().join('|') }));
  });
  expect(dialogs).toEqual([]);
  expect(result).toHaveLength(10);
  expect(result.every(q => q.valid === '')).toBe(true);
  expect(new Set(result.map(q => q.ids)).size).toBe(10);
});

test('matching results render safely and shield cannot add Vietnamese answer points', async ({ page }) => {
  await open(page);
  await show(page, 'word_meaning');
  await page.evaluate(() => {
    const q = app.game.state.questions[0];
    app.game.state.multipleChoiceSelections = [q.subquestions[0].answer, ''];
    app.game.state.selectedAns = [...app.game.state.multipleChoiceSelections];
    app.game.skills.state.shieldActive = true;
    app.game.submitAnswer(true);
    app.data.currentUser.role = 'admin';
  });
  expect(await page.evaluate(() => app.game.state.score)).toBe(0.5);
  await page.evaluate(() => app.game.finishPlay());
  await expect(page.locator('#result-modal')).toHaveClass(/active/);
  await expect(page.locator('#result-details')).toContainText('0,5 điểm');
  await expect(page.locator('#result-details')).toContainText('Bỏ trống');
});

test('drag choices reject another row and support keyboard selection', async ({ page }) => {
  await open(page);
  const q = await show(page, 'word_groups', 1);
  const rows = page.locator('.vietnamese-part');
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  const wrongRowChoice = rows.nth(1).getByRole('button', { name: q.subquestions[1].answer, exact: true });
  await wrongRowChoice.dispatchEvent('dragstart', { dataTransfer: transfer });
  await rows.nth(0).locator('.vietnamese-drop').dispatchEvent('drop', { dataTransfer: transfer });
  expect(await page.evaluate(() => app.game.state.multipleChoiceSelections)).toEqual(['', '']);
  const firstChoice = rows.nth(0).getByRole('button', { name: q.subquestions[0].answer, exact: true });
  await firstChoice.focus();
  await page.keyboard.press('Space');
  await rows.nth(1).locator('.vietnamese-drop').dispatchEvent('drop', { dataTransfer: transfer });
  await expect(page.locator('#submit-ans-btn')).toBeEnabled();
  expect(await page.evaluate(() => app.game.state.multipleChoiceSelections)).toEqual(q.subquestions.map(p => p.answer));
});
test('teacher can inspect the excerpt and each option reason without writing data', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    app.data.currentUser = { username: 'offline-teacher', role: 'admin' };
    app.admin.openComposer('templates');
  });
  const catalog = page.getByRole('region', { name: 'Template Tiếng Việt đã kiểm chứng' });
  await expect(catalog).toBeVisible();
  await catalog.getByLabel('Bài Tiếng Việt').selectOption('g4-vietnamese-hk1-b02');
  await catalog.getByLabel('Kỹ năng Tiếng Việt').selectOption('vietnamese.word_meaning');
  await catalog.locator('summary').first().click();
  await expect(catalog.locator('details').first()).toContainText('Ngữ cảnh nguồn:');
  await expect(catalog.locator('details').first()).toContainText('SGK tr. 13');
  await expect(catalog.locator('.template-preview__rows, .template-preview__mc')).toBeVisible();
});

test('unreviewed top-level image cannot reach the gameplay renderer', async ({ page }) => {
  await open(page);
  await show(page, 'word_type');
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  await page.evaluate(() => {
    const q = structuredClone(app.game.state.questions[0]);
    q.imageUrl = 'x" onerror="window.unsafeVietnameseImage=1';
    app.game.state.questions = [q];
    app.game.loadQuestion();
  });
  expect(dialogs).toHaveLength(1);
  expect(dialogs[0]).toContain('chưa đủ căn cứ kiểm chứng');
  expect(await page.evaluate(() => window.unsafeVietnameseImage)).toBeUndefined();
  await expect(page.locator('#game-play-view img[src="x"]')).toHaveCount(0);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`Vietnamese five interactions and half-point scoring ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page);
    for (const key of ['word_type', 'personification', 'word_groups', 'context_fill', 'word_meaning', 'reading_detail', 'topic_sentence']) {
      const q = await show(page, key);
      const rows = page.locator('.vietnamese-part');
      await expect(rows).toHaveCount(2);
      const smallButtons = await rows.locator('.multi-choice-subquestion__option').evaluateAll(buttons => buttons
        .filter(button => button.getBoundingClientRect().height < 44)
        .map(button => ({ height: button.getBoundingClientRect().height, minHeight: getComputedStyle(button).minHeight, font: getComputedStyle(button).fontSize, style: button.getAttribute('style') })));
      expect(smallButtons).toEqual([]);
      await expect(page.locator('#submit-ans-btn')).toBeDisabled();
      for (let i = 0; i < 2; i++) {
        const chosen = i === 0 ? q.subquestions[i].answer : q.subquestions[i].options.find(o => o !== q.subquestions[i].answer);
        const row = rows.nth(i);
        if (q.type === 'Điền khuyết') await row.locator('select').selectOption({ label: chosen });
        else {
          if (q.type === 'Đối chiếu trùng khớp') await row.locator('.vietnamese-match-source').click();
          await row.getByRole('button', { name: chosen, exact: true }).click();
        }
      }
      await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
      await expect.poll(() => page.evaluate(() => app.game.state.score)).toBe(0.5);
      await page.evaluate(() => app.game.submitAnswer());
      expect(await page.evaluate(() => app.game.state.score)).toBe(0.5);
      await expect(rows.nth(0)).toContainText('0,5 điểm');
      await expect(rows.nth(1)).toContainText('0 điểm');
      const bounds = await page.locator('#game-play-view .play-center').evaluate(e => ({ x: e.scrollWidth <= e.clientWidth + 1, y: e.scrollHeight <= e.clientHeight + 1 }));
      expect(bounds).toEqual({ x: true, y: true });
      await page.screenshot({ path: testInfo.outputPath(`${key}.png`) });
    }
    expect(errors).toEqual([]);
  });
}
