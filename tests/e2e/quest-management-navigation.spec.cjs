const { test, expect } = require('@playwright/test');

async function setup(page, target = 'quests') {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(target => {
    app.data.currentUser = { username: 'demo-admin', role: 'admin' };
    app.data.users = Array.from({ length: 31 }, (_, index) => ({ username: `demo-${index}`, fullname: `Học sinh ${index + 1}`, classlevel: '4', class_name: '4/4', approved: true, role: 'student' }));
    app.admin.openAdmin(target);
  }, target);
}

for (const [width, height] of [[1280, 720], [1440, 900], [1024, 768]]) {
  test(`Chọn chức năng → màn hình riêng có sidebar → Quay về ở ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await setup(page);
    await expect(page.locator('[data-quest-launch]')).toHaveCount(3);
    await page.screenshot({ path: `test-results/ui-review/quest-hub-${width}.png` });
    for (const mode of ['personal', 'team', 'weekly']) {
      await page.locator(`[data-quest-launch="${mode}"]`).click();
      await expect(page.locator('.quest-management-sidebar')).toBeVisible();
      await expect(page.locator('[data-quest-launch]')).toHaveCount(0);
      await expect(page.locator('#admin-management-tabs')).toBeHidden();
      const left = await page.locator('.quest-management-sidebar').boundingBox();
      const right = await page.locator('#admin-quest-subarea').boundingBox();
      expect(left.x + left.width).toBeLessThanOrEqual(right.x);
      await page.screenshot({ path: `test-results/ui-review/quest-${mode}-${width}.png` });
      for (const selector of ['.admin-panel', '#treasure-content-area', '.quest-management-detail']) {
        expect(await page.locator(selector).evaluate(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      }
      await page.locator('#quest-management-back').click();
      await expect(page.locator('[data-quest-launch]')).toHaveCount(3);
      await expect(page.locator(`[data-quest-launch="${mode}"]`)).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

test('Form cá nhân/nhóm giữ khung trái và chỉ có điều khiển của chức năng hiện tại', async ({ page }) => {
  await setup(page);
  await page.locator('[data-quest-launch=personal]').click();
  await page.locator('#btn-personal-quest-create').click();
  await expect(page.locator('.quest-form-workspace')).toBeVisible();
  await expect(page.locator('#quest-management-back')).toBeVisible();
  await expect(page.locator('.quest-management-sidebar')).toContainText('Nhiệm vụ Cá nhân');
  await page.locator('#quest-management-back').click();
  await page.locator('[data-quest-launch=team]').click();
  await page.getByRole('button', { name: '+ Tạo trận mới', exact: true }).click();
  await expect(page.locator('.team-competition-form')).toBeVisible();
  await expect(page.locator('.quest-management-sidebar')).toContainText('Thi đua Nhóm');
  await expect(page.locator('[data-quest-launch]')).toHaveCount(0);
});

test('Ô đếm hồ sơ tăng kích thước 2,5 lần', async ({ page }) => {
  await setup(page, 'players');
  await expect(page.locator('.admin-roster-list-heading__count')).toHaveText('31 hồ sơ');
  const dimensions = await page.locator('.admin-roster-list-heading__count').evaluate(el => {
    const style = getComputedStyle(el); return { font: parseFloat(style.fontSize), padX: parseFloat(style.paddingLeft), padY: parseFloat(style.paddingTop) };
  });
  const rootSize = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(dimensions.font).toBeCloseTo(.69 * 2.5 * rootSize, 1);
  expect(dimensions.padX).toBe(25);
  expect(dimensions.padY).toBe(17.5);
});
