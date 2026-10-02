const { test, expect } = require('@playwright/test');

async function setup(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(async () => {
    app.data.currentUser = { username: 'weekly-demo', role: 'admin' };
    app.data.users = Array.from({ length: 32 }, (_, i) => ({ username: `demo-${i}`, fullname: `Học sinh ${i + 1}`, role: 'student', approved: true, classlevel: '4', class_name: '4/4', score: 100, stars: 20 }));
    app.classroom.activate();
    for (const id of ['week-a', 'week-b']) await app.classroom.createWeek({ id, name: `Tuần ${id}`, classlevel: '4', className: '4/4', startDate: '2026-10-05', endDate: '2026-10-10', mode: 'groups', participants: app.data.users.map(s => ({ username: s.username, fullname: s.fullname })), teams: Array.from({ length: 4 }, (_, i) => ({ id: `team-${i}`, name: `Nhóm ${i + 1}`, members: app.data.users.filter((_, n) => n % 4 === i).map(s => s.username) })), scores: {}, absences: [], version: 1 });
    app.admin.openAdmin('quests');
  });
}

for (const [width, height] of [[1280, 720], [1440, 900], [1024, 768]]) {
  test(`Màu icon, khung sát mép và sidebar không cuộn ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await setup(page);
    await expect(page.locator('.quest-management-launch__open')).toHaveCount(0);
    const colors = await page.locator('.quest-management-launch .quest-management-mark').evaluateAll(els => els.map(el => getComputedStyle(el).backgroundImage));
    expect(new Set(colors).size).toBe(3);
    for (const mode of ['personal', 'team', 'weekly']) {
      await page.locator(`[data-quest-launch=${mode}]`).click();
      const sidebar = page.locator('.quest-management-sidebar');
      expect(await sidebar.evaluate(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      const left = await sidebar.boundingBox(), frame = await page.locator('.admin-panel').boundingBox();
      expect(frame.width).toBeGreaterThanOrEqual(width * .98);
      expect(frame.height).toBeGreaterThanOrEqual(height * .96);
      expect(left.x - frame.x).toBeLessThanOrEqual(14);
      await page.screenshot({ path: `test-results/ui-review/compact-${mode}-${width}.png` });
      await page.locator('#quest-management-back').click();
    }
  });
}

test('Thẻ chỉ có tên/điểm → bảng cộng điểm → ghi đúng trận, Hủy và keyboard focus', async ({ page }) => {
  await setup(page); await page.locator('[data-quest-launch=weekly]').click();
  await page.locator('#weekly-select').selectOption('week-a');
  const card = page.locator('[data-weekly-student="demo-0"]');
  await expect(card.locator('button, footer, .classroom-pill')).toHaveCount(0);
  await expect(card).toHaveText(/Học sinh 1.*0/s);
  await card.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#weekly-point-panel')).toBeVisible();
  await expect(page.locator('#weekly-point-add')).toBeFocused();
  await page.screenshot({ path: 'test-results/ui-review/weekly-point-panel.png' });
  await page.locator('#weekly-point-cancel').click();
  await expect(card).toBeFocused();
  await card.click(); await page.locator('#weekly-point-add').click();
  await expect(card.locator('.weekly-point-value')).toHaveText('1');
  await page.locator('#weekly-select').selectOption('week-b');
  await expect(card.locator('.weekly-point-value')).toHaveText('0');
  expect(await page.evaluate(() => app.data.users.every(s => s.score === 100 && s.stars === 20))).toBe(true);
  await page.locator('#weekly-search').fill('không tồn tại');
  await expect(page.locator('#weekly-search-empty')).toBeVisible();
});

test('Random có danh sách ứng viên, điểm hiện tại, cộng điểm tùy chọn và đổi trận không giữ kết quả cũ', async ({ page }) => {
  await setup(page); await page.locator('[data-quest-launch=weekly]').click();
  await page.locator('[data-weekly-tab=random]').click();
  await expect(page.locator('.weekly-random-candidate')).toHaveCount(32);
  await page.locator('#weekly-instant').check(); await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-random-score')).toHaveText('0');
  await page.screenshot({ path: 'test-results/ui-review/weekly-random-selection.png' });
  const selected = await page.evaluate(() => app.admin.weeklyState().randomStudent);
  await page.locator('#weekly-random-add').click();
  await expect(page.locator('#weekly-point-panel')).toBeVisible();
  await page.locator('#weekly-point-add').click();
  await expect(page.locator('#weekly-random-score')).toHaveText('1');
  expect(await page.evaluate(selected => app.admin.selectedWeek().scores[selected], selected)).toBe(1);
  await page.locator('#weekly-select').selectOption('week-a');
  await expect(page.locator('#weekly-random-add')).toHaveCount(0);
  await page.locator('#weekly-random-mode').selectOption('team');
  await expect(page.locator('.weekly-random-candidate')).toHaveCount(4);
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-random-add')).toHaveCount(0);
});

test('Cộng điểm lỗi giữ bảng, retry dùng cùng ID và bấm lặp không cộng hai lần', async ({ page }) => {
  await setup(page); await page.locator('[data-quest-launch=weekly]').click();
  await page.evaluate(() => {
    const original = app.classroom.point.bind(app.classroom);
    window.pointAttempts = [];
    app.classroom.point = async (...args) => {
      window.pointAttempts.push(args[3]);
      await new Promise(resolve => setTimeout(resolve, 100));
      if (window.pointAttempts.length === 1) throw new Error('Chưa thể đồng bộ');
      return original(...args);
    };
  });
  await page.locator('[data-weekly-student="demo-0"]').click();
  await page.locator('#weekly-point-add').click();
  await expect(page.locator('.weekly-point-error')).toContainText('Chưa thể đồng bộ');
  await expect(page.locator('#weekly-point-add')).toBeFocused();
  await page.evaluate(() => { document.getElementById('weekly-point-add').click(); document.getElementById('weekly-point-add').click(); });
  await expect(page.locator('[data-weekly-student="demo-0"] .weekly-point-value')).toHaveText('1');
  const attempts = await page.evaluate(() => window.pointAttempts);
  expect(attempts).toHaveLength(2); expect(attempts[0]).toBe(attempts[1]);
});

test('Đổi chế độ trong animation loại kết quả cũ và trạng thái đồng bộ không lộ tên backend', async ({ page }) => {
  await setup(page); await page.locator('[data-quest-launch=weekly]').click();
  await page.evaluate(() => { app.classroom.status = 'synced'; app.classroom.loaded = true; app.admin.renderWeeklyCompetition(); });
  await expect(page.locator('.weekly-status')).toHaveText('Đã đồng bộ dữ liệu');
  await page.locator('[data-weekly-tab=random]').click();
  await page.locator('#weekly-draw').click();
  await page.locator('#weekly-random-mode').selectOption('team');
  await page.waitForTimeout(750);
  await expect(page.locator('#weekly-random-result')).toHaveText('Sẵn sàng chọn ngẫu nhiên');
  await expect(page.locator('#weekly-random-add')).toHaveCount(0);
});

test('Điểm danh giữ mục Điều chỉnh mở và focus sau khi lưu', async ({ page }) => {
  await setup(page); await page.locator('[data-quest-launch=weekly]').click();
  await page.evaluate(() => {
    const original = app.classroom.setAbsences.bind(app.classroom); let attempts = 0;
    app.classroom.setAbsences = async (...args) => { if (!attempts++) throw new Error('Chưa thể đồng bộ'); return original(...args); };
  });
  await page.locator('[data-weekly-student="demo-0"]').click();
  await page.locator('.weekly-point-adjust summary').click();
  await page.locator('[data-absence]').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.weekly-point-error')).toContainText('Chưa thể đồng bộ');
  await expect(page.locator('[data-absence]')).toBeFocused();
  await expect(page.locator('.weekly-point-adjust')).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-absence]')).toHaveText('Có mặt');
  await expect(page.locator('[data-absence]')).toBeFocused();
  await expect(page.locator('.weekly-point-adjust')).toHaveAttribute('open', '');
});
