const { test, expect } = require('@playwright/test');

for (const vp of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 }
]) {
  test(`Cài Đặt Hệ Thống không có thanh trượt cuộn và có nút Quay Về cùng theme toggle bên phải ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');

    await page.evaluate(() => {
      app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
      app.admin.openAdmin('settings');
    });

    const modal = page.locator('#treasure-modal');
    await expect(modal).toBeVisible();

    // 1. Kiểm tra không còn nút X thoát, mà dùng nút "<- Quay về"
    const backBtn = page.locator('#admin-management-back');
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toContainText('Quay về');
    await expect(page.locator('#treasure-close-button')).toBeHidden();

    // 2. Kiểm tra nút theme toggle nằm kế bên bên phải nút "Quay về"
    const themeToggle = page.locator('#admin-theme-toggle-modal');
    await expect(themeToggle).toBeVisible();

    const backBox = await backBtn.boundingBox();
    const toggleBox = await themeToggle.boundingBox();
    expect(backBox).toBeTruthy();
    expect(toggleBox).toBeTruthy();
    expect(toggleBox.x).toBeGreaterThan(backBox.x);
    expect(Math.abs(toggleBox.y - backBox.y)).toBeLessThan(15); // Cùng hàng ngang

    // 3. Kiểm tra bố cục không có thanh cuộn lên xuống
    const contentArea = page.locator('#treasure-content-area');
    const scrollInfo = await contentArea.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: getComputedStyle(el).overflowY
    }));

    // Area không bị tràn cuộn
    expect(scrollInfo.scrollHeight).toBeLessThanOrEqual(scrollInfo.clientHeight + 2);

    // Toàn bộ modal panel nằm gọn trong màn hình
    const panel = modal.locator('.admin-panel');
    const panelBox = await panel.boundingBox();
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(vp.height);

    await page.screenshot({ path: `test-results/ui-review/settings-no-scroll-${vp.width}x${vp.height}.png` });
  });
}

test('Soạn Đề có nút Quay Về và theme toggle kế bên bên phải', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.admin.openComposer();
  });

  const composeScreen = page.locator('#admin-compose-screen');
  await expect(composeScreen).toBeVisible();

  const backBtn = composeScreen.locator('.admin-compose-back');
  await expect(backBtn).toBeVisible();
  await expect(backBtn).toContainText('Về bản đồ');

  const themeToggle = composeScreen.locator('.admin-theme-toggle');
  await expect(themeToggle).toBeVisible();

  const backBox = await backBtn.boundingBox();
  const toggleBox = await themeToggle.boundingBox();
  expect(backBox).toBeTruthy();
  expect(toggleBox).toBeTruthy();
  expect(toggleBox.x).toBeGreaterThan(backBox.x);
  expect(Math.abs(toggleBox.y - backBox.y)).toBeLessThan(15); // Cùng hàng ngang

  await page.screenshot({ path: 'test-results/ui-review/composer-nav-actions.png' });
});
