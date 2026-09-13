const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

test('four-part comparison uses coloured a) labels and distinct full-row tones', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.compare_number_forms', {
      minimum: 10000,
      maximum: 99999
    }, (() => { let seed = 84; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  const labels = await page.locator('.comparison-drag-label').allTextContents();
  expect(labels).toEqual(['a)', 'b)', 'c)', 'd)']);

  const toneStyles = await page.locator('.comparison-drag-row').evaluateAll(rows => rows.map(row => {
    const style = getComputedStyle(row);
    return { background: style.backgroundImage, border: style.borderTopColor };
  }));
  expect(new Set(toneStyles.map(style => style.background)).size).toBe(4);
  expect(new Set(toneStyles.map(style => style.border)).size).toBe(4);

  await page.screenshot({ path: testInfo.outputPath('four-part-comparison-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 1024, height: 768 });
  const tabletRowsFit = await page.locator('.comparison-drag-row').evaluateAll(rows =>
    rows.every(row => row.scrollWidth <= row.clientWidth)
  );
  expect(tabletRowsFit).toBe(true);
});

test('four-part fill-in rounds colour the a) through d) labels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.four_arithmetic_blanks', {
      minimumDigits: 2,
      maximumDigits: 2,
      operations: ['+'],
      layouts: ['expressionLeft'],
      blankPositions: ['third']
    }, (() => { let seed = 81; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.four-part-label')).toHaveText(['a)', 'b)', 'c)', 'd)']);
  const labelColours = await page.locator('.four-part-label').evaluateAll(labels =>
    labels.map(label => getComputedStyle(label).color)
  );
  expect(new Set(labelColours).size).toBe(4);
});

test('neighbor rows keep four distinct tones even with two blanks per row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.neighbor_numbers', {
      minimum: 10000,
      maximum: 99999
    }, (() => { let seed = 802; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  const rows = page.locator('.question-box--four-part-fill .template-fill-row:not(:first-child)');
  await expect(rows).toHaveCount(4);
  await expect(page.locator('.template-fill-row--tone-0')).toHaveCount(1);
  await expect(page.locator('.template-fill-row--tone-1')).toHaveCount(1);
  await expect(page.locator('.template-fill-row--tone-2')).toHaveCount(1);
  await expect(page.locator('.template-fill-row--tone-3')).toHaveCount(1);
  const rowStyles = await rows.evaluateAll(rows => rows.map(row => {
    const style = getComputedStyle(row);
    return { background: style.backgroundImage, border: style.borderTopColor };
  }));
  expect(new Set(rowStyles.map(style => style.background)).size).toBe(4);
  expect(new Set(rowStyles.map(style => style.border)).size).toBe(4);
});

test('comparison template has a visible instruction heading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.compare_number_forms', {
      minimum: 10000,
      maximum: 99999
    }, Math.random);
    question.q = '';
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });

  await expect(page.locator('.comparison-drag-title')).toHaveText('Điền dấu thích hợp:');
  await expect(page.locator('.comparison-drag-title')).toBeVisible();
});

test('sequence template renders all four rounds even when saved type is stale', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const summary = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.natural_sequence', {
      minimum: 1000,
      maximum: 99999,
      allowedSteps: [1000],
      sequenceLengthMin: 6,
      sequenceLengthMax: 6,
      blankCountMin: 2,
      blankCountMax: 2
    }, (() => { let seed = 1205; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    question.type = 'Điền khuyết';
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return {
      rounds: document.querySelectorAll('.template-sequence-title + .train-container, .template-sequence-title ~ .train-container').length,
      slots: document.querySelectorAll('.seq-slot').length,
      inputs: document.querySelectorAll('input.seq-slot').length,
      expectedSlots: question.sequenceRounds.reduce((total, round) => total + round.blankIndexes.length, 0),
      numpad: document.querySelectorAll('.numpad .num-btn').length,
      inputMode: document.querySelector('input.seq-slot')?.inputMode || '',
      questionType: app.game.state.questions[0].type
    };
  });

  expect(summary.rounds).toBe(4);
  expect(summary.slots).toBe(summary.expectedSlots);
  expect(summary.inputs).toBe(summary.expectedSlots);
  expect(summary.numpad).toBe(0);
  expect(summary.inputMode).toBe('numeric');
  expect(summary.questionType).toBe('Điền khuyết');
});

test('sequence legacy text still renders four rows without structured metadata', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const summary = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.natural_sequence', {
      minimum: 1000,
      maximum: 99999,
      allowedSteps: [1000],
      sequenceLengthMin: 6,
      sequenceLengthMax: 6,
      blankCountMin: 2,
      blankCountMax: 2
    }, (() => { let seed = 1207; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    delete question.sequenceRounds;
    question.type = 'Điền khuyết';
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return {
      rows: document.querySelectorAll('.template-sequence-row').length,
      slots: document.querySelectorAll('.seq-slot').length,
      title: document.querySelector('.template-sequence-title')?.textContent.trim() || ''
    };
  });

  expect(summary).toEqual({ rows: 4, slots: 8, title: 'Điền số thích hợp vào mỗi dãy:' });
});

test('sequence legacy text chấm sai theo đủ các ô và hiện đáp án theo từng dãy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const result = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.natural_sequence', {
      minimum: 1000,
      maximum: 99999,
      allowedSteps: [1000],
      sequenceLengthMin: 6,
      sequenceLengthMax: 6,
      blankCountMin: 2,
      blankCountMax: 2
    }, (() => { let seed = 1208; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    delete question.sequenceRounds;
    question.type = 'Điền khuyết';
    app.data.currentUser = { username: 'legacy-sequence-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question], historyDetails: [] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();

    const wrongAnswers = app.game.getAnsArr(question.ans).map(() => '0');
    app.game.state.seqAnswers = wrongAnswers;
    app.game.state.selectedAns = wrongAnswers.join(', ');
    document.querySelectorAll('.seq-slot').forEach(slot => { slot.value = '0'; });
    app.game.submitAnswer();

    return {
      wrongSlots: document.querySelectorAll('.seq-slot.answer-state-wrong').length,
      corrections: document.querySelectorAll('.seq-slot + .answer-correction').length,
      revealParts: document.querySelectorAll('.game-answer-reveal__part').length,
      revealText: document.querySelector('.game-answer-reveal')?.textContent || ''
    };
  });

  expect(result.wrongSlots).toBe(8);
  expect(result.corrections).toBe(8);
  expect(result.revealParts).toBe(4);
  expect(result.revealText).toContain('a)');
  expect(result.revealText).toContain('d)');
});

test('sequence answer reveal keeps each round in a readable row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const layout = await page.evaluate(() => {
    const question = window.Grade4MathTemplates.generateQuestion('number.natural_sequence', {
      minimum: 1000,
      maximum: 99999,
      allowedSteps: [1000],
      sequenceLengthMin: 6,
      sequenceLengthMax: 6,
      blankCountMin: 2,
      blankCountMax: 2
    }, (() => { let seed = 1206; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
    app.data.currentUser = { username: 'demo-student', role: 'student' };
    app.game.state = { score: 0, currentIdx: 0, questions: [question] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    app.game.showCorrectAnswerReveal(question);
    const reveal = document.querySelector('.game-answer-reveal');
    return {
      partCount: reveal?.querySelectorAll('.game-answer-reveal__part').length || 0,
      width: reveal?.getBoundingClientRect().width || 0,
      contentWidth: reveal?.scrollWidth || 0,
      text: reveal?.textContent || ''
    };
  });

  expect(layout.partCount).toBe(4);
  expect(layout.contentWidth).toBeLessThanOrEqual(layout.width + 1);
  expect(layout.text).toContain('a)');
  expect(layout.text).toContain('d)');
});
