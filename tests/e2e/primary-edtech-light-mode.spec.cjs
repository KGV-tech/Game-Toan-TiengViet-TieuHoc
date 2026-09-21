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

    // 6. Nhãn nút nộp bài hiển thị "Kiểm Tra" (hoặc "Kiểm tra") thay vì "Nộp câu trả lời"
    const submitLabel = await page.locator('#submit-ans-text').evaluate(el => el.textContent.trim());
    expect(submitLabel).toMatch(/Kiểm [tT]ra/);

    // 7. Kiểm tra font chữ khung giữa và ô nhập số dùng font Nunito/Quicksand
    const centerFont = await page.locator('#game-play-view .play-center').evaluate(el => window.getComputedStyle(el).fontFamily);
    expect(centerFont).toMatch(/Nunito|Quicksand/i);

    // 8. Chụp ảnh màn hình và kiểm tra phản hồi đúng/sai trên câu điền số
    await page.evaluate(() => {
      app.game.state = {
        ...app.game.state,
        currentIdx: 0,
        questions: [{
          type: 'Điền khuyết',
          q: 'Hãy điền số thích hợp vào chỗ trống:<br>a) 74 524 = ___ + 4 000 + 500 + 20 + 4<br>b) 51 720 = ___ + 1 000 + 700 + 20<br>c) 11 987 = 10 000 + 1 000 + 900 + 80 + ___<br>d) 52 921 = 50 000 + 2 000 + 900 + ___ + 1',
          ans: '70 000, 50 000, 4, 3'
        }],
        answerSubmitted: false
      };
      app.game.loadQuestion();
    });

    // Chụp ảnh giao diện câu hỏi trước khi nộp
    await page.screenshot({ path: 'C:/Users/htleh/.gemini/antigravity-ide/brain/43a79f58-4379-46df-8c70-c82f62eb373e/actual_edtech_play_screen_font_check.png' });

    // Điền câu a, b đúng, câu c, d sai
    await page.fill('#fill-input-0', '70 000');
    await page.fill('#fill-input-1', '50 000');
    await page.fill('#fill-input-2', '99');
    await page.fill('#fill-input-3', '88');
    await page.click('#submit-ans-btn');

    // Chụp ảnh phản hồi đúng/sai sau khi nộp
    await page.screenshot({ path: 'C:/Users/htleh/.gemini/antigravity-ide/brain/43a79f58-4379-46df-8c70-c82f62eb373e/actual_edtech_play_screen_feedback_ticks.png' });

    // 9. Kiểm tra nét gạch đỏ gấp đôi size (2.5px) trên ô sai
    const strikeThickness = await page.locator('#fill-input-2').evaluate(el => window.getComputedStyle(el).textDecorationThickness);
    expect(['2.5px', '3px']).toContain(strikeThickness);

    // 10. Kiểm tra ô đúng có dấu tick SVG (background-image chứa SVG checkmark)
    const correctBgImage = await page.locator('#fill-input-0').evaluate(el => window.getComputedStyle(el).backgroundImage);
    expect(correctBgImage).toContain('svg');

    // 11. Yêu cầu mới: Khung thông tin học sinh GIỮ LẠI THEO MÀU CŨ (nền xanh navy gradient, viền cyan sáng, không bị đổi thành trắng)
    const playerCardBg = await page.locator('#game-player-info').evaluate(el => window.getComputedStyle(el).backgroundImage);
    expect(playerCardBg).toContain('gradient');
    const playerCardColor = await page.locator('#game-player-info').evaluate(el => window.getComputedStyle(el).color);
    expect(playerCardColor).toBe('rgb(231, 249, 255)');

    // 12. Kiểm tra câu Đúng/Sai: font chữ tiêu đề hài hòa, không nhảy to khổng lồ
    await page.evaluate(() => {
      app.game.state = {
        ...app.game.state,
        currentIdx: 0,
        questions: [{
          type: 'Đúng/Sai',
          q: '<div class="tf-template-number">Chọn Đúng/Sai?</div><div class="tf-statements"><div class="tf-statement tf-statement--tone-0"><span class="tf-statement__label">A)</span><span class="tf-statement__text">Trong số 57 239, chữ số 9 ở hàng đơn vị.</span><div class="tf-statement__choices"><button class="btn-tf-true">ĐÚNG</button><button class="btn-tf-false">SAI</button></div></div></div>',
          ans: 'Đ'
        }],
        answerSubmitted: false
      };
      app.game.loadQuestion();
    });

    const tfTitleFontSize = await page.locator('#game-play-view .tf-template-number').evaluate(el => parseFloat(window.getComputedStyle(el).fontSize));
    // Trước đây font-size vọt lên 43.2px (2.7rem), bây giờ được chuẩn hóa về mức hài hòa ~19-24px
    expect(tfTitleFontSize).toBeLessThan(28);

    // Chụp ảnh màn hình câu Đúng/Sai
    await page.screenshot({ path: 'C:/Users/htleh/.gemini/antigravity-ide/brain/43a79f58-4379-46df-8c70-c82f62eb373e/actual_edtech_play_screen_tf_harmonized.png' });
  });
});
