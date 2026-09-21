const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

test.describe('Chuẩn Giao diện Tương tác Giáo dục Tiểu học & Điều hướng Admin', () => {
  test('Admin click trạm Toán học và Tiếng Việt mở đúng bảng Lộ trình học tương ứng', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openOfflineHomepage(page);

    // Giả lập tài khoản Admin và cập nhật UI
    await page.evaluate(() => {
      app.data.currentUser = { username: 'admin-tester', fullname: 'Cô Giáo Admin', role: 'admin' };
      document.getElementById('admin-station').style.display = 'flex';
      if (document.getElementById('quest-station')) document.getElementById('quest-station').style.display = 'none';
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('map-screen').classList.add('active');
    });

    // 1. Click trạm Toán học
    await page.locator('.station[data-subject="math"]').click();
    await expect(page.locator('#treasure-modal')).toHaveClass(/active/);
    await expect(page.locator('#treasure-title')).toContainText('Quản lý lộ trình học · Môn Toán');
    const mathVal = await page.locator('#learning-release-subject').inputValue();
    expect(mathVal).toBe('math');

    // Đóng modal
    await page.locator('#treasure-close-button').click();
    await expect(page.locator('#treasure-modal')).not.toHaveClass(/active/);

    // 2. Click trạm Tiếng Việt
    await page.locator('.station[data-subject="vietnamese"]').click();
    await expect(page.locator('#treasure-modal')).toHaveClass(/active/);
    await expect(page.locator('#treasure-title')).toContainText('Quản lý lộ trình học · Môn Tiếng Việt');
    const vietVal = await page.locator('#learning-release-subject').inputValue();
    expect(vietVal).toBe('vietnamese');

    // Đóng modal
    await page.locator('#treasure-close-button').click();
    await expect(page.locator('#treasure-modal')).not.toHaveClass(/active/);

    // 3. Click trạm Cài Đặt (admin-station)
    await page.locator('#admin-station').click();
    await expect(page.locator('#treasure-modal')).toHaveClass(/active/);
    await expect(page.locator('#treasure-title')).toHaveText('Cài Đặt Hệ Thống');
    
    // Kiểm tra danh sách tabs chỉ còn 3 tab, KHÔNG còn tab "Quản lý lộ trình học"
    const tabTexts = await page.locator('#admin-tabs .tab-btn').allTextContents();
    expect(tabTexts).toContain('Quản Lý Học Sinh');
    expect(tabTexts).toContain('Quản lý Nhiệm vụ');
    expect(tabTexts).toContain('Điều chỉnh');
    expect(tabTexts).not.toContain('Quản lý lộ trình học');
  });

  test('Màn hình làm bài Light mode chuẩn EdTech: không còn hố đen, nút Tiếp tục 3D và lõi điểm sáng rõ', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openOfflineHomepage(page);

    await page.evaluate(() => {
      app.data.currentUser = { username: 'hocsinh', fullname: 'Bé Học Sinh', role: 'student' };
      app.ui.setTheme('light');
      document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
      document.getElementById('game-screen').classList.add('active');
      document.getElementById('game-play-view').classList.add('active');
      app.game.state = {
        ...app.game.state,
        score: 2.75,
        currentIdx: 0,
        questions: [{ q: 'Dãy số tiếp theo là gì?', type: 'Trắc nghiệm', ans: '61708' }],
        answerSubmitted: false
      };
      app.game.loadQuestion();
    });

    // 1. Kiểm tra khung trung tâm (.play-center) không còn nền đen mà là nền trắng sáng
    const playCenterBg = await page.locator('#game-play-view .play-center').evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(playCenterBg).toBe('rgb(255, 255, 255)');

    // 2. Kiểm tra nút submit: ảnh PNG bị ẩn hoàn toàn, text to rõ ràng
    const imgDisplay = await page.locator('#submit-ans-img').evaluate(el => window.getComputedStyle(el).display);
    expect(imgDisplay).toBe('none');

    const textDisplay = await page.locator('#submit-ans-text').evaluate(el => window.getComputedStyle(el).display);
    expect(textDisplay).not.toBe('none');
    expect(['inline-flex', 'flex']).toContain(textDisplay);

    // 3. Nút submit có màu vàng ấm rực rỡ và gờ chân 3D
    const btnBg = await page.locator('#submit-ans-btn').evaluate(el => window.getComputedStyle(el).backgroundImage);
    expect(btnBg).toContain('gradient');

    // 4. Lõi vòng tròn tính điểm có nền trắng kem, không còn bị đen sì
    const ringInnerBg = await page.locator('#game-play-view .game-progress-ring').evaluate(el => {
      const beforeStyle = window.getComputedStyle(el, '::before');
      return beforeStyle.backgroundColor;
    });
    expect(ringInnerBg).toBe('rgb(255, 255, 255)');

    // 5. Điểm số hiển thị rõ nét màu Navy đậm (#0f172a)
    const scoreColor = await page.locator('#game-progress-ring strong').evaluate(el => window.getComputedStyle(el).color);
    expect(scoreColor).toBe('rgb(15, 23, 42)');
  });
});
