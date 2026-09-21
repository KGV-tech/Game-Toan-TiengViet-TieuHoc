const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

async function openQuestion(page, question) {
  await page.evaluate(questionData => {
    app.data.currentUser = { username: 'light-mode-student', fullname: 'Học sinh kiểm tra', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [questionData], answerSubmitted: false };
    app.game.loadQuestion();
  }, question);
}

test('chế độ ban ngày có độ tương phản cao, chữ câu con rõ nét và không bị khối trắng ở panel tiến độ', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Hãy làm tròn số theo yêu cầu.',
    type: 'Trắc nghiệm',
    ans: '20 000, 26 300, 21 080, 11 000',
    subquestions: [
      { label: 'a', prompt: 'Làm tròn số 22 504 đến hàng chục nghìn được số nào?', options: ['30 000', '20 000', '70 000', '40 000'], answer: '20 000' },
      { label: 'b', prompt: 'Làm tròn số 26 343 đến hàng trăm được số nào?', options: ['26 500', '26 300', '25 800', '26 100'], answer: '26 300' },
      { label: 'c', prompt: 'Làm tròn số 21 077 đến hàng chục được số nào?', options: ['21 180', '21 080', '21 060', '21 100'], answer: '21 080' },
      { label: 'd', prompt: 'Làm tròn số 10 703 đến hàng nghìn được số nào?', options: ['11 000', '6 000', '10 000', '12 000'], answer: '11 000' }
    ],
    partAnswerCounts: [1, 1, 1, 1]
  });

  // Bật chế độ ban ngày
  await page.evaluate(() => {
    app.ui.setTheme('light');
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // Kiểm tra màu chữ câu con trong chế độ sáng: phải là chữ tối màu (gần đen/chàm), không được là màu trắng
  const headingColor = await page.locator('.multi-choice-subquestion h3').first().evaluate(el => window.getComputedStyle(el).color);
  expect(headingColor).toBe('rgb(15, 23, 42)');

  // Kiểm tra background của panel tiến độ: trong suốt, không còn là khối trắng thô
  const progressPanelBg = await page.locator('#game-progress-panel').evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(progressPanelBg).toBe('rgba(0, 0, 0, 0)');

  const buttonColor = await page.locator('.multi-choice-subquestion__option').first().evaluate(el => window.getComputedStyle(el).color);
  const textNodeColor = await page.locator('.multi-choice-subquestion__option .ans-text').first().evaluate(el => window.getComputedStyle(el).color);
  expect(buttonColor).not.toBe('rgb(255, 255, 255)');
  expect(textNodeColor).not.toBe('rgb(255, 255, 255)');
});

test('câu trắc nghiệm và đúng sai không hiện thanh đáp án đáy khi đã hiện xanh đỏ trên câu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Chọn Đúng/Sai?',
    type: 'Đúng/Sai',
    ans: 'Sai, Đúng, Sai, Đúng',
    statements: [
      { label: 'a', text: 'Trong số 25 803, chữ số 8 ở hàng chục nghìn.', answer: 'Sai' },
      { label: 'b', text: '65 741 - 25 308 > 25 803', answer: 'Đúng' },
      { label: 'c', text: '25 803 > 80 000 + 8 000 + 20 + 5', answer: 'Sai' },
      { label: 'd', text: '70 000 + 3 000 + 200 + 4 > 50 000 + 1 000 + 600 + 40 + 9', answer: 'Đúng' }
    ],
    partAnswerCounts: [1, 1, 1, 1]
  });

  // Chọn sai cả 4 câu (chọn Đúng cho a & c, chọn Sai cho b & d)
  const rows = await page.locator('.tf-statement').all();
  await rows[0].locator('button[data-choice="Đúng"]').click();
  await rows[1].locator('button[data-choice="Sai"]').click();
  await rows[2].locator('button[data-choice="Đúng"]').click();
  await rows[3].locator('button[data-choice="Sai"]').click();

  await page.locator('#submit-ans-btn').click();

  // Đã hiện đỏ trên các lựa chọn sai và xanh trên đáp án đúng
  await expect(page.locator('.tf-statement__choices button.wrong-fill')).toHaveCount(4);
  await expect(page.locator('.tf-statement__choices button.correct-fill')).toHaveCount(4);

  // Không xuất hiện thanh đáp án đúng dưới cùng
  await expect(page.locator('.game-answer-reveal')).toHaveCount(0);
});

test('nét gạch đỏ trên câu sai có độ dày 2.5px rõ ràng để nhìn rõ đáp án sai', async ({ page }) => {
  await openOfflineHomepage(page);
  await openQuestion(page, { q: 'Số liền sau của 80 836 là', type: 'Điền khuyết', ans: '80 837' });
  await page.locator('.magic-input').fill('898 248');
  await page.locator('#submit-ans-btn').click();

  await expect(page.locator('.magic-input.wrong')).toHaveCount(1);
  const thickness = await page.locator('.magic-input.wrong').evaluate(el => window.getComputedStyle(el).textDecorationThickness);
  expect(['2px', '2.5px', '3px']).toContain(thickness);
});

test('hiệu ứng cộng điểm kích hoạt số điểm nảy lên và badge bay rõ ràng', async ({ page }) => {
  await openOfflineHomepage(page);
  await openQuestion(page, { q: 'Số liền sau của 10 là', type: 'Điền khuyết', ans: '11' });

  // Kiểm tra animateScorePoints tạo badge bay và bump animation
  const result = await page.evaluate(() => {
    app.game.animateScorePoints(0.75);
    const badge = document.querySelector('.score-float-badge');
    const valueEl = document.getElementById('game-progress-value');
    return {
      hasBadge: Boolean(badge),
      badgeText: badge?.textContent || '',
      hasBumpClass: valueEl?.classList.contains('score-value-bump') || false
    };
  });

  expect(result.hasBadge).toBe(true);
  expect(result.badgeText).toContain('+0,75 điểm');
  expect(result.hasBumpClass).toBe(true);
});
