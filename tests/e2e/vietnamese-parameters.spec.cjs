const { test, expect } = require('@playwright/test');

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`parameter templates preserve bounds, answers and history ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/*.supabase.co/**', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => window.gameTemplatesReady);
    const questions = await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      app.data.currentUser = { id: 'parameter-browser', username: 'parameter-browser', role: 'student' };
      document.querySelectorAll('.screen, .game-view').forEach(e => e.classList.remove('active'));
      document.getElementById('game-screen').classList.add('active');
      document.getElementById('game-play-view').classList.add('active');
      const samples = Grade4VietnameseTemplates.definitions.map(definition => {
        const variants = Grade4VietnameseTemplates.getQuestionVariants(definition.id, { lesson: 'g4-vietnamese-hk1-b32' });
        const length = q => q.passage.length + q.subquestions.reduce((sum, p) => sum + p.prompt.length + p.options.join('').length, 0);
        return variants.reduce((longest, q) => length(q) > length(longest) ? q : longest);
      });
      samples.unshift(Grade4VietnameseTemplates.generateQuestion('vietnamese.word_type', {
        lesson: 'g4-vietnamese-hk1-b09', parameters: [
          { pattern: 'sentence-class', actorId: 'human-0', actionId: 'verb-5', role: 'action' },
          { pattern: 'sentence-word', actorId: 'fish', actionId: 'verb-2', role: 'subject' }
        ]
      }));
      return samples;
    }, viewport.width === 1440 ? 'light' : 'dark');
    for (const q of questions) {
      const result = await page.evaluate(question => {
        if (Grade4VietnameseTemplates.validateQuestion(question)) throw Error('Unverified generated question');
        app.game.state = { subject: 'vietnamese', score: 0, currentIdx: 0, questions: [question], historyDetails: [] };
        app.game.loadQuestion();
        const selected = [question.subquestions[0].answer, question.subquestions[1].options.find(option => option !== question.subquestions[1].answer)];
        app.game.state.multipleChoiceSelections = selected;
        VietnameseQuickPractice.reveal(question, document.getElementById('game-options-container'), selected);
        const center = document.querySelector('#game-play-view .play-center');
        return { points: app.game.calculateQuestionScore(question, selected).points,
          overflow: center.scrollHeight > center.clientHeight + 1 || center.scrollWidth > center.clientWidth + 1,
          words: VietnameseParameterHistory.load(app.data.currentUser).words.length,
          controls: document.querySelectorAll('.vietnamese-part select, .vietnamese-drop, .vietnamese-part [draggable="true"]').length };
      }, q);
      expect(result, q.templateId).toMatchObject({ points: 0.5, overflow: false, controls: 0 });
      expect(result.words).toBeGreaterThan(0);
    }
    await page.screenshot({ path: testInfo.outputPath('parameter-topic.png') });
    expect(errors).toEqual([]);
  });
}

test('real practice consumes parameters and keeps unseen questions unrecorded', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => window.gameTemplatesReady);
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  const result = await page.evaluate(async () => {
    app.data.currentUser = { id: 'real-parameter', username: 'real-parameter', role: 'student', classlevel: '4', history: [], stars: 0 };
    app.data.settings = { topicLocks: {}, lessonReleaseByClass: { '4': { vietnamese: 'g4-vietnamese-hk1-b09' } } };
    app.data.libraryQuestions = [];
    app.game.openConfig('vietnamese');
    const template = Grade4VietnameseTemplates.getDefaultTemplates().find(t => t.lesson === 'g4-vietnamese-hk1-b09');
    app.data.settings.topicUnlockOverrides = { '4': { vietnamese: { [template.topic]: true } } };
    app.game.state.selectedTopics = [template.topic]; app.game.state.selectedLessons = [template.lesson];
    await app.game.startPlay();
    return { generated: app.game.state.questions.every(q => q.subquestions.every(p => p.generation)), count: app.game.state.questions.length,
      remembered: VietnameseParameterHistory.load(app.data.currentUser).parts.length,
      other: VietnameseParameterHistory.load({ id: 'different-student' }).parts.length };
  });
  expect(dialogs).toEqual([]);
  expect(result).toEqual({ generated: true, count: 10, remembered: 2, other: 0 });
});
