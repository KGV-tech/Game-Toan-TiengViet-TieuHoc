const { test, expect } = require('@playwright/test');

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`sixty new Vietnamese parts retain context, scoring and bounds ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/*.supabase.co/**', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => window.gameTemplatesReady);
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, viewport.width === 1440 ? 'light' : 'dark');
    const questions = await page.evaluate(() => {
      const bank = VietnamesePracticeContent.allItems().filter(item => item.id.startsWith('e60-'));
      if (bank.length !== 60) throw Error('Expected sixty additions');
      const unique = new Map();
      const add = q => unique.set(q.subquestions.map(part => part.id).sort().join('|'), q);
      for (const item of bank) {
        const definition = Grade4VietnameseTemplates.definitions.find(d => item.id.startsWith(`e60-${d.key}-`));
        const lesson = `g4-vietnamese-hk1-b${String(item.introducedAt).padStart(2, '0')}`;
        const q = Grade4VietnameseTemplates.getLegacyQuestionVariants(definition.id, { lesson }).find(q => q.subquestions.some(part => part.id === item.id));
        if (!q) throw Error(`Unplayable addition ${item.id}`);
        add(q);
      }
      // Include the longest compatible pair per skill, beyond the first partner.
      const length = q => q.passage.length + q.subquestions.reduce((sum, part) => sum + part.prompt.length + part.options.join('').length, 0);
      for (const definition of Grade4VietnameseTemplates.definitions) {
        const variants = Grade4VietnameseTemplates.getLegacyQuestionVariants(definition.id, { lesson: 'g4-vietnamese-hk1-b32' });
        add(variants.reduce((longest, q) => length(q) > length(longest) ? q : longest));
      }
      app.data.currentUser = { username: 'offline-expansion', role: 'student' };
      document.querySelectorAll('.screen, .game-view').forEach(e => e.classList.remove('active'));
      document.getElementById('game-screen').classList.add('active');
      document.getElementById('game-play-view').classList.add('active');
      return [...unique.values()];
    });
    const covered = new Set();
    for (const q of questions) {
      q.subquestions.filter(part => part.id.startsWith('e60-')).forEach(part => covered.add(part.id));
      const result = await page.evaluate(q => {
        const valid = Grade4VietnameseTemplates.validateQuestion(q);
        if (valid) throw Error(valid);
        app.game.state = { subject: 'vietnamese', score: 0, currentIdx: 0, questions: [q], historyDetails: [] };
        app.game.loadQuestion();
        const controls = [...document.querySelectorAll('.vietnamese-part button, .vietnamese-part select')];
        const before = controls.filter(e => {
          const r = e.getBoundingClientRect();
          return r.height < 44 || r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth;
        }).map(e => ({ tag: e.tagName, height: e.getBoundingClientRect().height, minHeight: getComputedStyle(e).minHeight }));
        app.game.state.multipleChoiceSelections = [q.subquestions[0].answer, ''];
        app.game.state.selectedAns = [...app.game.state.multipleChoiceSelections];
        app.game.submitAnswer(true);
        const center = document.querySelector('#game-play-view .play-center');
        return {
          points: app.game.state.score,
          context: q.subquestions.every(part => (part.passage || '') === q.passage),
          controls: before,
          overflow: center.scrollHeight > center.clientHeight + 1 || center.scrollWidth > center.clientWidth + 1,
          feedback: [...document.querySelectorAll('.vietnamese-feedback')].map(e => e.textContent)
        };
      }, q);
      expect(result, q.subquestions.map(part => part.id).join(', ')).toEqual({ points: 0.5, context: true, controls: [], overflow: false, feedback: ['Đúng · 0,5 điểm', `Chưa đúng · 0 điểm. Đáp án: ${q.subquestions[1].answer}`] });
    }
    expect(covered.size).toBe(60);
    const longestTopic = questions.filter(q => q.templateId === 'vietnamese.topic_sentence').sort((a, b) => b.passage.length - a.passage.length)[0];
    await page.evaluate(q => {
      app.game.state = { subject: 'vietnamese', score: 0, currentIdx: 0, questions: [q], historyDetails: [] };
      app.game.loadQuestion();
    }, longestTopic);
    if (viewport.width === 1440) {
      const contrast = await page.locator('.vietnamese-passage').evaluate(element => {
        const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = channels => channels.map(c => c / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
        let background = element;
        while (background.parentElement && getComputedStyle(background).backgroundColor === 'rgba(0, 0, 0, 0)') background = background.parentElement;
        const foregroundLuminance = luminance(rgb(getComputedStyle(element).color));
        const backgroundLuminance = luminance(rgb(getComputedStyle(background).backgroundColor));
        return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: testInfo.outputPath('expanded-topic.png') });
    expect(errors).toEqual([]);
  });
}
