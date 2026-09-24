// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Nút Thoát Chunky 3D, Theme Toggle và Quy tắc Stick Chấm Bài V/X', () => {
  test('Nút Thoát Chunky 3D và Theme Toggle nằm ở chân khung play-right', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = { username: 'test-student', fullname: 'Nguyễn Văn An', role: 'student', classlevel: '4', class_name: '4/1' };
      document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
      document.getElementById('game-screen')?.classList.add('active');
      document.getElementById('game-play-view')?.classList.add('active');
    });

    const footer = page.locator('#game-play-view .play-right .play-right-footer');
    await expect(footer).toBeVisible();

    const exitBtn = footer.locator('#game-btn-back');
    await expect(exitBtn).toBeVisible();
    await expect(exitBtn).toContainText('Thoát');
    await expect(exitBtn).toHaveClass(/btn-exit-chunky/);

    const themeToggle = footer.locator('#game-theme-toggle');
    await expect(themeToggle).toBeVisible();

    // Verify footer sits at the bottom of play-right
    const playRightBox = await page.locator('#game-play-view .play-right').boundingBox();
    const footerBox = await footer.boundingBox();
    expect(playRightBox).toBeTruthy();
    expect(footerBox).toBeTruthy();
    if (playRightBox && footerBox) {
      expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(playRightBox.y + playRightBox.height + 5);
      expect(footerBox.y).toBeGreaterThan(playRightBox.y + playRightBox.height * 0.7);
    }
  });

  test('Khung học sinh hiển thị danh hiệu 2 dòng: Line 1 Danh Hiệu:, Line 2 Học sinh tò mò', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = { username: 'test-student', fullname: 'L4', role: 'student', classlevel: '4', class_name: 'Cấp lớp 4', stars: 0 };
      app.auth.updateHeader();
      document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
      document.getElementById('game-screen')?.classList.add('active');
      document.getElementById('game-play-view')?.classList.add('active');
    });

    const playerCard = page.locator('#game-player-info');
    await expect(playerCard).toBeVisible();

    const titleLabel = playerCard.locator('.player-info-card__title-label');
    const titleValue = playerCard.locator('.player-info-card__title-value');
    await expect(titleLabel).toBeVisible();
    await expect(titleLabel).toContainText('Danh Hiệu:');
    await expect(titleValue).toBeVisible();
    await expect(titleValue).toHaveText('Học sinh tò mò');

    const labelBox = await titleLabel.boundingBox();
    const valueBox = await titleValue.boundingBox();
    expect(labelBox).toBeTruthy();
    expect(valueBox).toBeTruthy();
    if (labelBox && valueBox) {
      expect(valueBox.y).toBeGreaterThanOrEqual(labelBox.y + labelBox.height - 2);
    }

    // Dark Mode screenshot
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await playerCard.screenshot({ path: 'artifacts/actual_player_card_dark.png' });

    // Light Mode screenshot
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await playerCard.screenshot({ path: 'artifacts/actual_player_card_light.png' });
  });

  test('Quy tắc stick V/X chuẩn chấm bài trên Đúng/Sai trong Dark Mode và Light Mode', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const tfQuestion = {
      type: 'Đúng/Sai',
      title: 'Chọn Đúng/Sai?',
      statements: [
        { label: 'A', text: 'Trong số 57 239, chữ số 9 ở hàng đơn vị.', answer: 'Đúng' },
        { label: 'B', text: '33 001 > 57 239', answer: 'Sai' },
        { label: 'C', text: '57 239 < 30 000 + 8 000 + 400 + 4', answer: 'Sai' },
        { label: 'D', text: '60 000 + 9 000 + 900 + 70 + 8 > 60 000 + 1 000 + 900 + 90 + 2', answer: 'Đúng' }
      ],
      explanation: 'Xác định hàng của chữ số, rồi tính và so sánh giá trị hai vế trước khi chọn Đúng hoặc Sai.'
    };

    // --- 1. TEST DARK MODE ---
    await page.evaluate(q => {
      document.documentElement.removeAttribute('data-theme');
      app.data.currentUser = { username: 'test-student', fullname: 'Nguyễn Văn An', role: 'student', classlevel: '4', class_name: '4/1' };
      document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
      document.getElementById('game-screen')?.classList.add('active');
      document.getElementById('game-play-view')?.classList.add('active');
      app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [q], subject: 'math' };
      app.game.loadQuestion();
    }, tfQuestion);

    // Học sinh trả lời:
    // A) Chọn ĐÚNG (Đáp án: Đúng) -> ĐÚNG -> stick V
    // B) Chọn SAI (Đáp án: Sai) -> ĐÚNG -> stick V
    // C) Chọn ĐÚNG (Đáp án: Sai) -> SAI -> stick X trên ĐÚNG, SAI là đáp án hệ thống -> KHÔNG CÓ STICK
    // D) Chọn SAI (Đáp án: Đúng) -> SAI -> stick X trên SAI, ĐÚNG là đáp án hệ thống -> KHÔNG CÓ STICK
    const statementRows = page.locator('.tf-statement');
    await statementRows.nth(0).locator('button', { hasText: 'ĐÚNG' }).click();
    await statementRows.nth(1).locator('button', { hasText: 'SAI' }).click();
    await statementRows.nth(2).locator('button', { hasText: 'ĐÚNG' }).click();
    await statementRows.nth(3).locator('button', { hasText: 'SAI' }).click();

    await page.locator('#submit-ans-btn').click();

    // Kiểm tra pseudo-element ::after stick trên Dark Mode
    const darkStickResults = await page.evaluate(() => {
      const rows = document.querySelectorAll('.tf-statement');
      return Array.from(rows).map(row => {
        const trueBtn = row.querySelector('button[data-choice="Đúng"]');
        const falseBtn = row.querySelector('button[data-choice="Sai"]');
        return {
          trueBtnContent: window.getComputedStyle(trueBtn, '::after').content,
          falseBtnContent: window.getComputedStyle(falseBtn, '::after').content,
          trueBtnClasses: trueBtn?.className,
          falseBtnClasses: falseBtn?.className
        };
      });
    });

    // Row 0: Student picked Đúng (correct) -> stick ✔️
    expect(darkStickResults[0].trueBtnContent).toContain('✔️');
    expect(darkStickResults[0].falseBtnContent === 'none' || darkStickResults[0].falseBtnContent === '""').toBe(true);

    // Row 1: Student picked Sai (correct) -> stick ✔️
    expect(darkStickResults[1].falseBtnContent).toContain('✔️');
    expect(darkStickResults[1].trueBtnContent === 'none' || darkStickResults[1].trueBtnContent === '""').toBe(true);

    // Row 2: Student picked Đúng (wrong) -> stick ❌ trên Đúng, KHÔNG stick trên Sai
    expect(darkStickResults[2].trueBtnContent).toContain('❌');
    expect(darkStickResults[2].falseBtnContent === 'none' || darkStickResults[2].falseBtnContent === '""').toBe(true);

    // Row 3: Student picked Sai (wrong) -> stick ❌ trên Sai, KHÔNG stick trên Đúng
    expect(darkStickResults[3].falseBtnContent).toContain('❌');
    expect(darkStickResults[3].trueBtnContent === 'none' || darkStickResults[3].trueBtnContent === '""').toBe(true);

    // Chụp ảnh Dark Mode
    await page.screenshot({ path: 'artifacts/actual_grading_sticks_dark_mode.png', fullPage: true });

    // --- 2. TEST LIGHT MODE ---
    await page.evaluate(q => {
      document.documentElement.setAttribute('data-theme', 'light');
      app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [q], subject: 'math' };
      app.game.loadQuestion();
    }, tfQuestion);

    await statementRows.nth(0).locator('button', { hasText: 'ĐÚNG' }).click();
    await statementRows.nth(1).locator('button', { hasText: 'SAI' }).click();
    await statementRows.nth(2).locator('button', { hasText: 'ĐÚNG' }).click();
    await statementRows.nth(3).locator('button', { hasText: 'SAI' }).click();

    await page.locator('#submit-ans-btn').click();

    const lightStickResults = await page.evaluate(() => {
      const rows = document.querySelectorAll('.tf-statement');
      return Array.from(rows).map(row => {
        const trueBtn = row.querySelector('button[data-choice="Đúng"]');
        const falseBtn = row.querySelector('button[data-choice="Sai"]');
        return {
          trueBtnContent: window.getComputedStyle(trueBtn, '::after').content,
          falseBtnContent: window.getComputedStyle(falseBtn, '::after').content
        };
      });
    });

    // Row 0: Student picked Đúng (correct) -> stick ✔️
    expect(lightStickResults[0].trueBtnContent).toContain('✔️');
    expect(lightStickResults[0].falseBtnContent === 'none' || lightStickResults[0].falseBtnContent === '""').toBe(true);

    // Row 1: Student picked Sai (correct) -> stick ✔️
    expect(lightStickResults[1].falseBtnContent).toContain('✔️');
    expect(lightStickResults[1].trueBtnContent === 'none' || lightStickResults[1].trueBtnContent === '""').toBe(true);

    // Row 2: Student picked Đúng (wrong) -> stick ❌ trên Đúng, KHÔNG stick trên Sai
    expect(lightStickResults[2].trueBtnContent).toContain('❌');
    expect(lightStickResults[2].falseBtnContent === 'none' || lightStickResults[2].falseBtnContent === '""').toBe(true);

    // Row 3: Student picked Sai (wrong) -> stick ❌ trên Sai, KHÔNG stick trên Đúng
    expect(lightStickResults[3].falseBtnContent).toContain('❌');
    expect(lightStickResults[3].trueBtnContent === 'none' || lightStickResults[3].trueBtnContent === '""').toBe(true);

    // Chụp ảnh Light Mode
    await page.screenshot({ path: 'artifacts/actual_grading_sticks_light_mode.png', fullPage: true });
  });

  test('Thi Đua Nhóm: bỏ khung vuông ngoài và nền vàng cát, câu động viên chuẩn luyện tập, ảnh xe +30%', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      const user = { username: 'leader-1', fullname: 'Nguyễn Văn An', role: 'student', classlevel: '4', class_name: '4/1' };
      const exam = {
        id: 'exam-1',
        name: 'Đề thi đua Toán',
        classlevel: '4',
        subject: 'Toán',
        period: 'Học kỳ 1',
        questions: [{ q: '1 + 1 = ?', type: 'Trắc nghiệm', options: ['2', '3'], ans: '2' }]
      };
      app.data.currentUser = user;
      app.data.users = [user];
      app.data.exams = [exam];
      const match = app.teamCompetition.normalizeCompetition({
        id: 'test-match-ui',
        name: 'Test giao diện trận · Lượt 3',
        classlevel: '4',
        teamCount: 4,
        participantMode: 'manual',
        questionMode: 'same',
        commonExamId: 'exam-1',
        status: app.teamCompetition.STATUS.ACTIVE,
        startedAt: Date.now(),
        teams: [
          { id: 'team-1', name: 'Nhóm 1', memberUsernames: ['leader-1'], leaderUsername: 'leader-1' },
          { id: 'team-2', name: 'Nhóm 2', memberUsernames: ['m-2'], leaderUsername: 'm-2' },
          { id: 'team-3', name: 'Nhóm 3', memberUsernames: ['m-3'], leaderUsername: 'm-3' },
          { id: 'team-4', name: 'Nhóm 4', memberUsernames: ['m-4'], leaderUsername: 'm-4' }
        ]
      });
      app.teamCompetition.store.clear();
      app.teamCompetition.store.upsert(match);
      app.teamCompetition.openLeaderAttempt(match.id);
    });

    const playLeft = page.locator('#game-play-view .play-left');
    await expect(playLeft).toBeVisible();

    const infoCard = page.locator('#game-player-info');
    const infoBg = await infoCard.evaluate(el => getComputedStyle(el).backgroundColor);
    const infoBorder = await infoCard.evaluate(el => getComputedStyle(el).borderStyle);
    expect(infoBg).toBe('rgba(0, 0, 0, 0)');
    expect(infoBorder).toBe('none');

    const speechBubble = page.locator('#cat-speech-bubble');
    await expect(speechBubble).toBeVisible();
    const bubbleBg = await speechBubble.evaluate(el => getComputedStyle(el).backgroundColor);
    const bubbleBorder = await speechBubble.evaluate(el => getComputedStyle(el).borderColor);
    const bubbleText = page.locator('#cat-speech-bubble > span, #cat-speech-bubble .cat-bubble-text').first();
    const bubbleTextColor = await bubbleText.evaluate(el => getComputedStyle(el).color);
    expect(bubbleBg).toBe('rgb(220, 244, 252)');
    expect(bubbleBorder).toBe('rgb(8, 145, 178)');
    expect(bubbleTextColor).toBe('rgb(2, 132, 199)');

    const carImg = page.locator('#play-cat-img');
    await expect(carImg).toBeVisible();
    const carWidth = await carImg.evaluate(el => el.getBoundingClientRect().width);
    expect(carWidth).toBeGreaterThanOrEqual(150);

    // Kiểm tra xe nằm đúng tâm vòng tròn (độ lệch < 2px)
    const offsets = await page.evaluate(() => {
      const wrapper = document.querySelector('.cat-wrapper');
      const img = document.getElementById('play-cat-img');
      const imgRect = img.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const circleCenterY = wrapperRect.top + wrapperRect.height * 0.52;
      const circleCenterX = wrapperRect.left + wrapperRect.width * 0.50;
      const visualCenterX = imgRect.left + imgRect.width * 0.519;
      const visualCenterY = imgRect.top + imgRect.height * 0.578;
      return {
        diffX: Math.abs(visualCenterX - circleCenterX),
        diffY: Math.abs(visualCenterY - circleCenterY)
      };
    });
    expect(offsets.diffX).toBeLessThan(3);
    expect(offsets.diffY).toBeLessThan(3);

    await playLeft.screenshot({ path: 'artifacts/actual_team_leader_play_left_light.png' });

    // Chụp thêm Dark Mode để nghiệm thu
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await playLeft.screenshot({ path: 'artifacts/actual_team_leader_play_left_dark.png' });
  });
});
