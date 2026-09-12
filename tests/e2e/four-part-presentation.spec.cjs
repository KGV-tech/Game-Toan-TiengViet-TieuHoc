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
