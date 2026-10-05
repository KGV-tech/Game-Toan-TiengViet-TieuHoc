const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test('Vietnamese light passage remains readable when the previous CSS URL is cached', async ({ page }) => {
  // Model a browser retaining the stylesheet served before the passage fix.
  const previousCss = fs.readFileSync(path.join(__dirname, '../../src/style.css'), 'utf8')
    .replace(/^html\[data-theme="light"\] \.vietnamese-passage .*\r?\n/m, '');
  await page.route('**/src/style.css?v=garden-hud-pots-v2', route => route.fulfill({ contentType: 'text/css', body: previousCss }));
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => window.gameTemplatesReady);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    const question = Grade4VietnameseTemplates.generateQuestion('vietnamese.reading_detail', { lesson: 'g4-vietnamese-hk1-b01' });
    app.data.currentUser = { username: 'offline-light-test', role: 'student' };
    app.game.state = { subject: 'vietnamese', score: 0, currentIdx: 0, questions: [question], historyDetails: [] };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
  });
  const passage = page.locator('.vietnamese-passage');
  await expect(passage).toBeVisible();
  await expect(passage).toHaveCSS('color', 'rgb(15, 23, 42)');
  await expect(passage).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});
