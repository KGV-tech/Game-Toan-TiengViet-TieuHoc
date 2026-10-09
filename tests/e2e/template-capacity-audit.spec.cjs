const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test('mọi cấu hình template sinh câu hợp lệ và giữ đúng sức chứa', async ({ page }) => {
  test.setTimeout(120000);
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  const results = await page.evaluate(() => {
    const results = [];
    for (const [subject, registry] of [['Toán', window.Grade4MathTemplates], ['Tiếng Việt', window.Grade4VietnameseTemplates]]) {
      const seen = new Set();
      const templates = subject === 'Tiếng Việt' ? registry.getDefaultTemplates() : registry.templateIds.map(key => ({ generator_key: key, config: {} }));
      for (const template of templates) {
        const key = template.generator_key;
        const config = template.config;
        let seed = 81431;
        const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
        let sample;
        try { sample = registry.generateQuestion(key, config, random); } catch (error) { results.push({ subject, key, exception: error.message }); continue; }
        if (seen.has(sample.templateId + (config.lesson || ''))) continue;
        seen.add(sample.templateId + (config.lesson || ''));
        const semanticKeys = new Set();
        const errors = new Set();
        for (let attempt = 0; attempt < 40; attempt++) {
          try {
            const q = registry.generateQuestion(key, config, random);
            const error = app.data.validateQuestionScoring(q);
            if (Array.isArray(q.subquestions) && q.subquestions.some(part => part.answer !== undefined && Array.isArray(part.options) && !part.options.includes(part.answer))) errors.add('Correct answer missing from choices');
            if (error) errors.add(error);
            else semanticKeys.add(app.data.getQuestionSemanticKey(q));
          } catch (error) { errors.add(error.message); }
        }
        results.push({ subject, key, templateId: sample.templateId, lesson: config.lesson, unique: semanticKeys.size, errors: [...errors] });
      }
    }
    return results;
  });
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/template-capacity-audit.json', JSON.stringify(results, null, 2));
  console.log('AUDIT', results.length, 'template/lesson configurations checked');
  expect(results.filter(r => r.exception || r.unique < (r.subject === 'Tiếng Việt' ? 1 : r.templateId === 'g4-m-angle-count-in-polygon' ? 5 : 10) || r.errors.length)).toEqual([]);
});


test('mỗi bài Toán và Tiếng Việt tạo được lượt 10 câu qua luồng học sinh', async ({ page }) => {
  test.setTimeout(120000);
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  const results = await page.evaluate(() => {
    app.data.currentUser = { username: 'audit-local', role: 'student', classlevel: '4' };
    app.data.libraryQuestions = [];
    app.data.questionTemplates = [];
    app.data.markQuestionsSeen = () => {};
    app.daily.getEnergy = () => 5;
    app.daily.consumeEnergy = () => {};
    const results = [];
    for (const subject of ['math', 'vietnamese']) {
      app.game.openConfig(subject);
      const groups = app.constants.lessonCatalog['4'][subject].hk1;
      for (const group of groups) for (const lesson of group.lessons) {
        if (subject === 'math') {
          const seen = new Set();
          app.data.questionTemplates = window.Grade4MathTemplates.templateIds.flatMap(generator_key => {
            const sample = window.Grade4MathTemplates.generateQuestion(generator_key, {});
            if (seen.has(sample.templateId)) return [];
            const number = Number(lesson.id.match(/b(\d+)$/)[1]);
            const config = number === 22 || number === 23 ? { operation: number === 22 ? '+' : '-' } : {};
            const explicit = number === 3 && generator_key.startsWith('number.even_odd_')
              || number === 4 && generator_key.startsWith('number.variable_expression_')
              || number === 6 && generator_key === 'number.hk1_review_b01_b04'
              || (number === 22 || number === 23) && ['g4-m-add-sub-multi-digit', 'g4-m-add-sub-word-problem', 'g4-m-add-sub-missing-term', 'g4-m-add-sub-missing-digit', 'g4-m-add-sub-true-false'].includes(generator_key);
            const mapping = explicit ? lesson.id : app.curriculum.getTemplateLesson({ ...sample, topic: group.topic, generator_key });
            if (mapping !== lesson.id) return [];
            seen.add(sample.templateId);
            return [{ id: generator_key, generator_key, classlevel: sample.classlevel, subject: sample.subject, semester: sample.semester, topic: group.topic, lesson: mapping, question_type: sample.type, config, prompt_template: '{question}', is_active: true }];
          });
        }
        const alerts = [];
        window.alert = message => alerts.push(message);
        app.game.getSelectedLearningLessonId = () => lesson.id;
        app.game.state.selectedLessons = [lesson.id];
        app.game.state.selectedTopics = [group.topic];
        app.game.state.questions = [];
        app.game.startPlay();
        const questions = app.game.state.questions;
        results.push({ lesson: lesson.id, count: questions.length, distinct: new Set(questions.map(q => app.data.getQuestionSemanticKey(q))).size, alerts });
        app.game.stopTimers();
      }
    }
    return results;
  });
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/lesson-capacity-audit.json', JSON.stringify(results, null, 2));
  console.log('LESSON AUDIT', results.length, 'lessons; failures:', JSON.stringify(results.filter(r => r.count !== 10 || r.distinct !== 10 || r.alerts.length)));
  expect(results.filter(r => r.count !== 10 || r.distinct !== 10 || r.alerts.length)).toEqual([]);
});


for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`mọi template có hình hiển thị đủ nút chọn tại ${size.width}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize(size);
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
    await page.evaluate(() => { app.data.currentUser = { username: 'audit-local', role: 'admin', classlevel: '4' }; app.router.open('game-screen'); app.router.openGameView('game-play-view'); });
    const failures = await page.evaluate(() => {
      let seed = 456712;
      Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
      const seen = new Set();
      const failures = [];
      for (let variant = 0; variant < 5; variant++) for (const generator_key of window.Grade4MathTemplates.templateIds) {
        const q = app.data.generateTemplateQuestion({ generator_key, config: {}, prompt_template: '{question}' });
        if (!q || seen.has(`${q.templateId}:${variant}`)) continue;
        seen.add(`${q.templateId}:${variant}`);
        app.game.state.questions = [q]; app.game.state.currentIdx = 0; app.game.state.score = 0;
        app.game.loadQuestion();
        for (const button of document.querySelectorAll('#game-options-container .multi-choice-subquestion--visual button')) {
          const r = button.getBoundingClientRect();
          let parent = button.parentElement;
          while (parent && parent.id !== 'game-play-view') {
            const p = parent.getBoundingClientRect();
            const style = getComputedStyle(parent);
            if (['hidden', 'clip'].includes(style.overflowY) && (r.top < p.top - 1 || r.bottom > p.bottom + 1)
              || ['hidden', 'clip'].includes(style.overflowX) && (r.left < p.left - 1 || r.right > p.right + 1)) {
              if (!window.templateAuditFailure) window.templateAuditFailure = q;
              failures.push({ templateId: q.templateId, button: button.textContent, clippedBy: parent.className, prompt: q.q, rowHeight: button.closest('section').getBoundingClientRect().height, bottom: r.bottom, limit: p.bottom });
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
      return failures;
    });
    if (failures.length) {
      await page.evaluate(() => { app.game.state.questions = [window.templateAuditFailure]; app.game.state.currentIdx = 0; app.game.loadQuestion(); });
      await page.screenshot({ path: `test-results/ui-review/template-audit-${size.width}.png` });
    }
    expect(failures).toEqual([]);
  });
}
