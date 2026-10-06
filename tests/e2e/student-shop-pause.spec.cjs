const { test, expect } = require('@playwright/test');

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`student shop pause and guide replacement ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.route('**/*.supabase.co/**', route => route.abort());
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = { username: 'paused-shop', role: 'student', fullname: 'Học sinh thử', stars: 20, classlevel: '4' };
      app.safeStorage.setItem('equipped_pet_paused-shop', 'pet_1.png');
      app.auth.updateHeader();
      app.router.open('map-screen');
    });
    await expect(page.locator('#shop-station')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(await page.locator('.station-guide').evaluate(el => [el.style.top, el.style.left])).toEqual(['46%', '67%']);
    const blocked = await page.evaluate(async () => {
      const before = app.safeStorage.getItem('equipped_pet_paused-shop');
      let calls = 0;
      app.data.applyStudentProgressEvent = async () => { calls++; return { data: {} }; };
      app.shop.open();
      app.shop.switchTab('lucky');
      await app.shop.spinWheel();
      await app.shop.spinWheelOnline(app.data.currentUser);
      await app.data.spinLuckyWheel();
      app.shop.equipPet('pet_2.png');
      app.game.skills.state.skillUsed = false;
      app.game.skills.renderSkillBar('pet_1', 'pet_1.png');
      app.game.skills.useSkill('freeze_time');
      return { calls, stars: app.data.currentUser.stars, before, after: app.safeStorage.getItem('equipped_pet_paused-shop'), mascot: app.getEquippedPet(app.data.currentUser), skillUsed: app.game.skills.state.skillUsed };
    });
    expect(blocked).toEqual({ calls: 0, stars: 20, before: 'pet_1.png', after: 'pet_1.png', mascot: 'robot_cat_normal.webp', skillUsed: false });
    await expect(page.locator('#shop-modal')).toBeHidden();
    await expect(page.locator('#skill-bar-container')).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath(`student-map-${viewport.width}.png`) });
    await page.locator('#btn-guide').click();
    await expect(page.locator('#guide-map')).toContainText('tạm khóa');
    await expect(page.locator('#guide-pets')).toBeHidden();
    await expect(page.locator('#guide-lucky')).toBeHidden();
    await expect(page.locator('#guide-titles')).toContainText('Sao đang có được giữ trong tài khoản');
    await expect(page.locator('.guide-toc a[href="#guide-pets"]')).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath(`student-guide-${viewport.width}.png`) });
    await page.keyboard.press('Escape');
    await expect(page.locator('#btn-guide')).toBeFocused();
    await page.evaluate(() => { app.data.currentUser.role = 'admin'; app.auth.updateHeader(); app.shop.open(); });
    await expect(page.locator('#shop-station')).toBeVisible();
    await expect(page.locator('#shop-modal')).toBeVisible();
    await page.evaluate(() => { app.shop.close(); app.data.currentUser.role = 'student'; app.auth.updateHeader(); });
    await expect(page.locator('#shop-station')).toBeHidden();
    expect(errors).toEqual([]);
  });
}
