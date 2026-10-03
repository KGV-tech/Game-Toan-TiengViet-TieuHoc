const { test, expect } = require('@playwright/test');

for (const [width, height] of [[1280,720], [1440,900], [1024,768]]) {
  test(`Roster sát mép, sidebar không cuộn và nút theme chỉ icon ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = { username: 'teacher', role: 'admin' };
      app.data.users = Array.from({ length: 31 }, (_, i) => ({ username: `s${i}`, fullname: `Nguyễn Minh An ${i}`, role: 'student', approved: true, classlevel: '4', class_name: '4/4', gender: 'male' }));
      app.admin.openAdmin('players');
    });
    const toggle = page.locator('#treasure-modal [data-theme-toggle]:visible');
    const toggleBox = await toggle.boundingBox();
    expect(toggleBox.width).toBeLessThanOrEqual(44);
    expect(Math.abs(toggleBox.width - toggleBox.height)).toBeLessThan(1);
    await expect(toggle).not.toContainText(/Sáng|Tối/);
    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector('.admin-roster-sidebar');
      const panel = document.querySelector('#treasure-modal .admin-panel').getBoundingClientRect();
      const right = document.querySelector('.admin-roster-main').getBoundingClientRect();
      const filters = [...sidebar.querySelectorAll('input,select,button')].map(el => el.getBoundingClientRect().bottom);
      return { scroll: sidebar.scrollHeight - sidebar.clientHeight, bottom: sidebar.getBoundingClientRect().bottom, filters,
        x: panel.x, y: panel.y, width: panel.width, height: panel.height, rightGap: panel.right - right.right };
    });
    expect(metrics.scroll).toBeLessThanOrEqual(1);
    expect(Math.max(...metrics.filters)).toBeLessThanOrEqual(metrics.bottom);
    expect(metrics.x).toBeLessThanOrEqual(8); expect(metrics.y).toBeLessThanOrEqual(10);
    expect(metrics.rightGap).toBeLessThanOrEqual(14);
    await page.screenshot({ path: `test-results/ui-review/roster-compact-dark-${width}.png` });
    await toggle.click();
    await expect(page.locator('.admin-roster-main')).toHaveCSS('background-image', /rgb\(200, 235, 246\)/);
    await page.screenshot({ path: `test-results/ui-review/roster-compact-light-${width}.png` });
    await page.locator('#btn-sub-sections').click();
    expect(await page.locator('.admin-roster-sidebar').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    await page.locator('#btn-sub-pending').click();
    expect(await page.locator('.admin-roster-sidebar').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  });
}
