// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Nút Thoát Chunky 3D, Theme Toggle và Quy tắc Stick Chấm Bài V/X', () => {
  test('Nút Thoát Chunky 3D và Theme Toggle nằm ở chân khung play-right', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:4173');
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

  test('Quy tắc stick V/X chuẩn chấm bài trên Đúng/Sai trong Dark Mode và Light Mode', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:4173');

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
});
