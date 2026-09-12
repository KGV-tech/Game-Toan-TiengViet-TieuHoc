const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

async function openQuestion(page, question) {
  await page.evaluate(questionData => {
    app.data.currentUser = { username: 'template-surface-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [questionData], answerSubmitted: false };
    app.game.loadQuestion();
  }, question);
}

test('đáp án dài tự xuống dòng trong khối tối và ô nhập giữ font giao diện', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Hãy điền số liền trước và số liền sau vào mỗi dòng:<br>a) ___ ; 58 465 ; ___<br>b) ___ ; 58 864 ; ___<br>c) ___ ; 67 654 ; ___<br>d) ___ ; 82 390 ; ___',
    type: 'Điền khuyết',
    ans: '58 464, 58 466, 58 863, 58 865, 67 653, 67 655, 82 389, 82 391'
  });

  for (let index = 0; index < 8; index++) {
    await page.locator(`#fill-input-${index}`).fill('0');
  }
  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('.game-answer-reveal')).toBeVisible();

  const layout = await page.locator('.game-answer-reveal').evaluate(panel => {
    const input = document.querySelector('.magic-input');
    const panelStyle = getComputedStyle(panel);
    const inputStyle = getComputedStyle(input);
    const panelRect = panel.getBoundingClientRect();
    const hostRect = document.getElementById('game-question-container').getBoundingClientRect();
    return {
      fitsWidth: panel.scrollWidth <= panel.clientWidth,
      fitsHost: panelRect.right <= hostRect.right + 1,
      panelBackground: panelStyle.backgroundColor,
      inputFont: inputStyle.fontFamily,
      inputColor: inputStyle.color
    };
  });

  expect(layout.fitsWidth).toBe(true);
  expect(layout.fitsHost).toBe(true);
  expect(layout.panelBackground).not.toBe('rgb(255, 255, 255)');
  expect(layout.inputFont.toLowerCase()).toContain('quicksand');
  expect(layout.inputColor).not.toBe('rgb(126, 34, 206)');
  await page.screenshot({ path: testInfo.outputPath('long-answer-reveal.png'), fullPage: true });

  await page.setViewportSize({ width: 1024, height: 768 });
  const tabletLayout = await page.locator('.game-answer-reveal').evaluate(panel => {
    const rect = panel.getBoundingClientRect();
    const host = document.getElementById('game-question-container').getBoundingClientRect();
    return { fitsWidth: panel.scrollWidth <= panel.clientWidth, fitsHost: rect.right <= host.right + 1 };
  });
  expect(tabletLayout).toEqual({ fitsWidth: true, fitsHost: true });
});

test('ô dấu dùng dạng vuông tối và vẫn giữ bề mặt tối khi chấm sai', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Điền dấu thích hợp:',
    type: 'Kéo thả',
    ans: '<, <, <, <',
    comparisonRows: [
      { label: 'a', leftText: '35 306', rightText: '40 000' },
      { label: 'b', leftText: '67 641', rightText: '80 000' },
      { label: 'c', leftText: '54 441', rightText: '60 000' },
      { label: 'd', leftText: '79 063', rightText: '90 000' }
    ]
  });

  const initialCell = await page.locator('.comparison-drag-slot').first().evaluate(cell => ({
    borderRadius: getComputedStyle(cell).borderTopLeftRadius,
    background: getComputedStyle(cell).backgroundColor
  }));
  expect(initialCell.borderRadius).toBe('10px');
  expect(initialCell.background).not.toBe('rgb(255, 255, 255)');

  await page.locator('.comparison-drag-sign[data-sign=">"]').click();
  for (const slot of await page.locator('.comparison-drag-slot').all()) await slot.click();
  await page.locator('#submit-ans-btn').click();

  const checkedCell = await page.locator('.comparison-drag-slot').first().evaluate(cell => ({
    state: cell.className,
    background: getComputedStyle(cell).backgroundColor,
    color: getComputedStyle(cell).color
  }));
  expect(checkedCell.state).toContain('answer-state-wrong');
  expect(checkedCell.background).not.toBe('rgb(254, 226, 226)');
  expect(checkedCell.color).not.toBe('rgb(220, 38, 38)');
});

test('mọi nhóm template tạo sẵn đều giữ bề mặt tối và font giao diện', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const audit = await page.evaluate(() => {
    const sampleIds = [
      'number.place_value_true_false',
      'number.natural_sequence',
      'number.four_operations_expressions',
      'g4-m-angle-drag-classify',
      'g4-m-angle-count-in-polygon',
      'number.match_number_words'
    ];
    return sampleIds.map(templateId => {
      const question = window.Grade4MathTemplates.generateQuestion(templateId, {}, (() => { let seed = 42; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
      app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [question], answerSubmitted: false };
      app.game.loadQuestion();
      const controls = [...document.querySelectorAll('#game-play-view :is(.ans-btn, .tf-statement, .drag-slot, .magic-input, .matching-item)')];
      return {
        templateId,
        hasControls: controls.length > 0,
        whiteControl: controls.some(element => getComputedStyle(element).backgroundColor === 'rgb(255, 255, 255)'),
        courierInput: controls.some(element => element.matches('input') && getComputedStyle(element).fontFamily.toLowerCase().includes('courier')),
        horizontalOverflow: document.getElementById('game-question-container').scrollWidth > document.getElementById('game-question-container').clientWidth
      };
    });
  });

  expect(audit.every(result => result.hasControls)).toBe(true);
  expect(audit.every(result => !result.whiteControl)).toBe(true);
  expect(audit.every(result => !result.courierInput)).toBe(true);
  expect(audit.every(result => !result.horizontalOverflow)).toBe(true);
});
