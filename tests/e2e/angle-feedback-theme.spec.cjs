const { test, expect } = require('@playwright/test');
async function start(page, generator, compactPrompt = false) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({contentType:'application/javascript', body:''}));
  await page.goto('/');
  await page.evaluate(({generator, compactPrompt}) => {
    app.data.currentUser = {username:'student',role:'student',classlevel:'4'};
    const q = app.data.generateTemplateQuestion({generator_key:generator,config:{},prompt_template:'{question}'});
    if (compactPrompt) { q.q = q.instruction; q.ans = '3, 2, 1, 2'; }
    app.game.state.questions = [q]; app.game.state.currentIdx = 0; app.game.state.score = 0;
    app.router.open('game-screen'); app.router.openGameView('game-play-view'); app.game.loadQuestion();
  }, {generator, compactPrompt});
}
for (const answers of [['6','7','43','8'],['6','7','43','2']]) {
  test(`Sửa đủ các ô đếm góc với đáp án ${answers.join('-')}`, async ({page}, info) => {
    await start(page,'g4-m-angle-count-eight-angles',true);
    await page.evaluate(() => document.documentElement.dataset.theme = 'light');
    await expect(page.locator('.angle-count-title')).toHaveCSS('color','rgb(2, 96, 132)');
    await expect(page.locator('.angle-count-row__text').first()).toHaveCSS('color','rgb(15, 23, 42)');
    await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
    await expect(page.locator('.angle-count-title')).toHaveCSS('color','rgb(240, 249, 255)');
    for (let i=0;i<4;i++) await page.locator(`#fill-input-${i}`).fill(answers[i]);
    await page.evaluate(() => app.game.submitAnswer());
    for (let i=0;i<4;i++) {
      const input = page.locator(`#fill-input-${i}`);
      if (i === 3 && answers[i] === '2') {
        await expect(input).toHaveClass(/correct/);
      } else {
        await expect(input).toHaveClass(/wrong/);
        await expect(input.locator('..').locator('.answer-correction')).toHaveText(['3','2','1','2'][i]);
      }
    }
    expect(await page.evaluate(() => app.game.state.score)).toBe(answers[3] === '2' ? 0.25 : 0);
    await page.screenshot({path:info.outputPath('count-graded.png')});
  });
}
for (const viewport of [{width:1280,height:720},{width:1440,height:900},{width:1024,height:768}]) {
  test(`Góc kéo thả đổi theme và ẩn khay trống ${viewport.width}`, async ({page}, info) => {
    await page.setViewportSize(viewport);
    await start(page,'g4-m-angle-drag-classify');
    for (const theme of ['light','dark','light']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      await expect(page.locator('.template-question-copy')).toHaveCSS('color',theme === 'dark' ? 'rgb(240, 249, 255)' : 'rgb(2, 96, 132)');
      await expect(page.locator('.angle-drag-row .drag-slot').first()).toHaveCSS('background-color',theme === 'dark' ? 'rgb(11, 36, 56)' : 'rgb(255, 255, 255)');
      await expect(page.locator('.angle-drag-row--tone-0')).toHaveCSS('background-image',theme === 'light' ? 'none' : /linear-gradient/);
      await page.screenshot({path:info.outputPath(`angle-${theme}.png`)});
    }
    const items = page.locator('.drag-inventory .drag-item');
    for (let i=0;i<4;i++) await items.nth(i).click();
    await expect(page.locator('.drag-inventory')).toBeHidden();
    await page.locator('#slot-0').click();
    await expect(page.locator('.drag-inventory')).toBeVisible();
    await expect(items.first()).toBeVisible();
    await items.first().dragTo(page.locator('#slot-0'));
    await expect(page.locator('.drag-inventory')).toBeHidden();
    await page.evaluate(() => app.game.submitAnswer());
    await expect(page.locator('.drag-inventory')).toBeHidden();
    await page.screenshot({path:info.outputPath('angle-graded.png')});
  });
}
