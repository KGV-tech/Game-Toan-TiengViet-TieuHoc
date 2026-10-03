const { test, expect } = require('@playwright/test');
async function setup(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(async () => {
    app.data.currentUser = { username: 'polish-teacher', role: 'admin' };
    app.data.users = Array.from({ length: 9 }, (_, i) => ({ username: `s${i}`, fullname: `Học sinh ${i}`, role: 'student', approved: true, classlevel: '4', class_name: '4/4' }));
    app.classroom.activate();
    await app.classroom.createWeek({ id: 'polish-week', name: 'Tuần Sao', classlevel: '4', className: '4/4', startDate: '2026-10-05', endDate: '2026-10-10', mode: 'groups', participants: app.data.users.map(s => ({ username: s.username, fullname: s.fullname })), teams: [{ id: 'g1', name: 'Nhóm Sao', members: app.data.users.map(s => s.username) }], scores: { s0: 7 }, absences: [], version: 1 });
    app.admin.openAdmin('quests'); app.admin.switchQuestMode('weekly');
  });
}
test('Nhãn điểm, SVG riêng và animation có tên thay đổi trong thời gian chờ', async ({ page }) => {
  await setup(page);
  await expect(page.getByText('Tìm học sinh', { exact: true })).toBeVisible();
  await expect(page.locator('.weekly-score small').first()).toHaveText('điểm');
  await page.locator('[data-weekly-tab=random]').click();
  const icons = await page.locator('.weekly-random-mode svg').evaluateAll(els => els.map(el => el.innerHTML));
  expect(new Set(icons).size).toBe(5);
  await page.locator('#weekly-delay').selectOption('3000');
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-draw-preview')).toContainText('Học sinh');
  await expect(page.locator('#weekly-draw-preview')).toBeVisible();
  await expect(page.locator('#weekly-draw-progress')).toBeVisible();
  const before = await page.locator('#weekly-draw-preview').textContent();
  await expect.poll(() => page.locator('#weekly-draw-preview').textContent()).not.toBe(before);
  await expect(page.locator('#weekly-draw')).toBeEnabled({ timeout: 5000 });
  expect(await page.evaluate(() => app.admin.weeklyState().drawn.length)).toBe(1);
});
test('Chia nhóm ngẫu nhiên cân bằng và cập nhật bảng số lượng', async ({ page }) => {
  await setup(page); await page.locator('#weekly-create').click();
  await expect(page.getByText('Tên thi đua tuần', { exact: true })).toBeVisible();
  await page.getByLabel('Thi đua theo Nhóm', { exact: true }).check();
  await page.locator('[data-weekly-assignment]').first().selectOption('1');
  await expect(page.locator('[data-weekly-group-count="0"]')).toContainText('2 học sinh');
  await page.locator('#weekly-shuffle-groups').click();
  await expect(page.locator('[data-weekly-group-count]')).toHaveCount(3);
  for (const item of await page.locator('[data-weekly-group-count]').all()) await expect(item).toContainText('3 học sinh');
});
test('Thêm Nhóm khi chưa có tuần mở đúng loại Nhóm', async ({ page }) => {
  await setup(page);
  await page.evaluate(() => { app.classroom.weeks = []; app.admin.weeklyState().selected = ''; app.admin.renderWeeklyCompetition(); });
  await page.locator('[data-weekly-view=groups]').click(); await page.locator('#weekly-team-create').click();
  await expect(page.getByLabel('Thi đua theo Nhóm', { exact: true })).toBeChecked();
  await expect(page.locator('#weekly-shuffle-groups')).toBeVisible();
});
test('Thêm nhóm riêng giữ điểm, thành viên không trùng và lưu qua tải lại', async ({ page }) => {
  await setup(page); await page.locator('[data-weekly-view=groups]').click();
  await page.locator('#weekly-team-create').click();
  await page.locator('#weekly-team-name').fill('Nhóm Mây');
  await page.locator('[data-weekly-team-member="s0"]').check();
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-body')).toContainText('Nhóm Mây');
  const state = await page.evaluate(() => ({ teams: app.classroom.weeks[0].teams, scores: app.classroom.weeks[0].scores }));
  expect(state.scores.s0).toBe(7);
  expect(state.teams.filter(t => t.members.includes('s0'))).toHaveLength(1);
  await page.evaluate(() => { app.classroom.owner = ''; app.classroom.activate(); app.admin.renderWeeklyCompetition(); });
  await expect(page.locator('#weekly-body')).toContainText('Nhóm Mây');
});
test('Thêm tổ độc lập, lỗi giữ form, reduced motion và hủy vòng chọn', async ({ page }) => {
  await setup(page); await page.locator('[data-weekly-view=sections]').click();
  await page.locator('#weekly-team-create').click();
  await page.locator('#weekly-team-name').fill('Tổ Mặt Trời');
  await page.locator('[data-weekly-team-member="s0"]').check();
  await page.evaluate(() => { const original = app.classroom.setWeekTeams.bind(app.classroom); let fail = true; app.classroom.setWeekTeams = (...args) => { if (fail) { fail = false; throw new Error('Chưa thể đồng bộ'); } return original(...args); }; });
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-error')).toContainText('Chưa thể đồng bộ');
  await expect(page.locator('#weekly-team-name')).toHaveValue('Tổ Mặt Trời');
  await page.locator('#weekly-team-form [type=submit]').click();
  const state = await page.evaluate(() => app.classroom.weeks[0]);
  expect(state.teams.filter(t => t.kind === 'sections')).toHaveLength(1);
  expect(state.teams.find(t => t.id === 'g1').members).toHaveLength(9);
  expect(state.scores.s0).toBe(7);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-weekly-tab=random]').click(); await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-draw-preview')).toHaveText('Đang chọn…');
  expect(await page.locator('.weekly-random-result .classroom-team-mark').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('[data-weekly-tab=points]').click();
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => app.admin.weeklyState().drawn)).toEqual([]);
});
for (const [width, height] of [[1280,720],[1440,900],[1024,768]]) test(`Sidebar, icon và light contrast ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height }); await setup(page);
  await page.locator('.quest-management-sidebar [data-theme-toggle]').click();
  await page.locator('[data-weekly-tab=random]').click();
  await page.screenshot({ path: `test-results/ui-review/polish-random-light-${width}.png` });
  await page.locator('[data-weekly-tab=standings]').click();
  await expect(page.locator('.weekly-rank-medal svg')).toHaveCount(3);
  await page.screenshot({ path: `test-results/ui-review/polish-ranking-light-${width}.png` });
  await page.locator('#quest-management-back').click(); await page.locator('[data-quest-launch=team]').click();
  await expect(page.locator('.quest-management-sidebar .team-dashboard-notice')).toBeVisible();
  await expect(page.locator('.team-dashboard-notice')).not.toContainText('Supabase');
  expect(await page.locator('.quest-management-sidebar').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
});
