const { test, expect } = require('@playwright/test');

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`guide role switching and section navigation ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.route('**/*.supabase.co/**', route => route.abort());
    await page.goto('/');
    for (const role of ['student', 'admin', 'student']) {
      await page.evaluate(role => {
        app.data.currentUser = { username: `guide-${role}`, role };
        app.showGuide();
      }, role);
      await expect(page.locator('#guide-title')).toHaveText(role === 'admin' ? 'Hướng dẫn Giáo viên' : 'Hướng dẫn Học sinh');
      if (role === 'admin') await expect(page.locator('#guide-teacher')).toBeVisible();
      else await expect(page.locator('#guide-teacher')).toBeHidden();
      const visibleText = await page.locator('#guide-content').innerText();
      if (role === 'student') {
        expect(visibleText).not.toMatch(/Admin|template|0,5|0\.5|mỗi ý|8\/10|bỏ yêu cầu|tiêu Sao|tổng Sao đã/i);
        await expect(page.locator('#guide-map')).toBeVisible();
        await expect(page.locator('#guide-admin-content')).toBeHidden();
      } else {
        await expect(page.locator('#guide-map')).toBeHidden();
        await expect(page.locator('#guide-admin-content')).toBeVisible();
        expect(visibleText).toContain('template');
        expect(visibleText).toContain('Quản lý học sinh');
      }
      const links = page.locator('.guide-toc a:visible');
      for (let i = 0; i < await links.count(); i++) {
        const link = links.nth(i);
        const target = await link.getAttribute('href');
        await link.click();
        await expect(page.locator(target)).toBeFocused();
        await expect(page.locator(target)).not.toHaveAttribute('hidden');
      }
      const bounds = await page.locator('#guide-modal .sci-fi-panel').boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(16);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 16);
      expect(await page.locator('#guide-content').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (role === 'admin') {
        await page.locator('.guide-toc a[href="#guide-teacher"]').click();
        await expect.poll(async () => {
          const heading = await page.locator('#guide-teacher h3').boundingBox();
          const content = await page.locator('#guide-content').boundingBox();
          return Math.abs(heading.y - content.y);
        }).toBeLessThan(30);
        await page.screenshot({ path: testInfo.outputPath(`guide-admin-${viewport.width}.png`) });
      }
      if (role === 'student') {
        await page.locator('.guide-toc a[href="#guide-map"]').click();
        await expect.poll(() => page.locator('#guide-content').evaluate(el => el.scrollTop)).toBeLessThan(20);
        await page.screenshot({ path: testInfo.outputPath(`guide-student-${viewport.width}.png`) });
      }
      await page.keyboard.press('Escape');
      await expect(page.locator('#guide-modal')).toBeHidden();
    }
    expect(errors).toEqual([]);
  });
}
