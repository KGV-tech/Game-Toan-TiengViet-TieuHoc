const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test('Bảng thi đua nhóm không giữ nút Quay về ẩn trong vòng focus', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'demo-admin', fullname: 'Giáo viên Minh họa', role: 'admin' };
    app.data.exams = [{ id: 'demo-exam', name: 'Đề minh họa', questions: [{ q: '1 + 1 = ?', type: 'Trắc nghiệm', options: ['2', '3'], ans: '2' }] }];
    const match = app.teamCompetition.normalizeCompetition({
      id: 'demo-board', name: 'Thi đua minh họa', classlevel: '4', teamCount: 2,
      commonExamId: 'demo-exam', questionMode: 'same', status: app.teamCompetition.STATUS.PREPARED,
      teams: [{ id: 'demo-team-1', name: 'Nhóm 1' }, { id: 'demo-team-2', name: 'Nhóm 2' }]
    });
    app.teamCompetition.store.upsert(match);
    app.admin.openAdmin('quests');
    app.admin.openTeamCompetitionBoard(match.id);
  });
  await expect(page.locator('.team-competition-board')).toBeVisible();
  const buttons = page.locator('#treasure-modal button:visible:not([disabled])');
  await buttons.last().focus();
  await page.keyboard.press('Tab');
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(buttons.last()).toBeFocused();
});

test('Danh sách và chờ duyệt vẫn tự cập nhật khi nhận sự kiện hồ sơ', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(async () => {
    const callbacks = {};
    supabaseClient.channel = () => {
      const channel = {
        on(type, filter, callback) { callbacks[filter.table] = callback; return channel; },
        subscribe() { return channel; },
        unsubscribe() {}
      };
      return channel;
    };
    await app.data.init();
    window.emitStudentChange = payload => callbacks.game_users(payload);
    app.data.currentUser = { id: 'demo-admin', username: 'demo-admin', fullname: 'Giáo viên Minh họa', role: 'admin' };
    app.admin.openAdmin('players');
  });
  await page.evaluate(() => window.emitStudentChange({ eventType: 'INSERT', new: { id: 'demo-1', username: 'demo-1', fullname: 'Học sinh mới', role: 'student', approved: true, classlevel: '4' } }));
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('#admin-subcontent-area')).toContainText('Học sinh mới');
  await page.locator('#btn-sub-pending').click();
  await page.evaluate(() => window.emitStudentChange({ eventType: 'UPDATE', new: { id: 'demo-1', username: 'demo-1', fullname: 'Học sinh chờ duyệt', role: 'student', approved: false, classlevel: '4' } }));
  await expect(page.locator('#btn-sub-pending')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('#admin-subcontent-area')).toContainText('Học sinh chờ duyệt');
  await page.evaluate(() => window.emitStudentChange({ eventType: 'DELETE', old: { id: 'demo-1' } }));
  await expect(page.locator('.admin-student-card')).toHaveCount(0);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`Admin mở quản lý riêng từ map ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('.supabase.co')) requests.push(request.url()); });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = { username: 'demo-admin', fullname: 'Giáo viên Minh họa', role: 'admin' };
      app.data.users = [{ username: 'demo-student', fullname: 'Học sinh Minh họa', role: 'student', approved: true, classlevel: '4' }];
      app.data.quests = [];
      app.auth.updateHeader();
      app.router.open('map-screen');
    });
    const students = page.getByRole('button', { name: 'Quản lý học sinh', exact: true });
    const quests = page.getByRole('button', { name: 'Quản lý Thi đua & Nhiệm vụ', exact: true });
    await expect(students).toBeVisible();
    await expect(quests).toBeVisible();
    await expect(students).toHaveCSS('background-image', /linear-gradient/);
    await expect(quests).toHaveCSS('background-image', /linear-gradient/);
    const profileRect = await page.locator('#player-info').boundingBox();
    const studentRect = await students.boundingBox();
    const questRect = await quests.boundingBox();
    expect(studentRect.y).toBeGreaterThanOrEqual(profileRect.y + profileRect.height);
    expect(questRect.y).toBeGreaterThanOrEqual(studentRect.y + studentRect.height);
    expect(questRect.x + questRect.width).toBeLessThanOrEqual(viewport.width);
    expect(questRect.y + questRect.height).toBeLessThanOrEqual(viewport.height);
    fs.mkdirSync('test-results/ui-review', { recursive: true });
    await page.screenshot({ path: `test-results/ui-review/admin-map-${viewport.width}.png` });
    await page.evaluate(() => document.documentElement.dataset.theme = 'light');
    await expect(students).toHaveCSS('background-color', 'rgb(224, 242, 254)');
    await page.screenshot({ path: `test-results/ui-review/admin-map-light-${viewport.width}.png` });
    await students.focus();
    await students.press('Enter');
    await expect(page.locator('#treasure-title')).toHaveText('Quản lý học sinh');
    await expect(page.locator('#treasure-close-button')).toBeHidden();
    await expect(page.locator('#admin-management-back')).toBeVisible();
    await expect(page.locator('#admin-management-icon')).toBeVisible();
    const heading = await page.locator('#treasure-title').boundingBox();
    const icon = await page.locator('#admin-management-icon').boundingBox();
    expect(icon.x).toBeLessThan(viewport.width / 3);
    const back = await page.locator('#admin-management-back').boundingBox();
    expect(back.y).toBeGreaterThanOrEqual(heading.y + heading.height);
    await page.screenshot({ path: `test-results/ui-review/admin-students-header-${viewport.width}.png` });
    await expect(page.locator('#admin-tabs')).toBeHidden();
    await expect(page.locator('.admin-student-card')).toHaveCount(1);
    await page.locator('#btn-sub-pending').click();
    await expect(page.locator('#admin-subcontent-area')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(students).toBeFocused();
    await quests.click();
    await expect(page.locator('#treasure-title')).toHaveText('Quản lý Thi đua & Nhiệm vụ');
    await expect(page.locator('#treasure-close-button')).toBeHidden();
    await expect(page.locator('#admin-management-back')).toBeFocused();
    await expect(page.locator('.quest-management-hub')).toBeVisible();
    await expect(page.locator('[data-quest-launch]')).toHaveCount(3);
    await expect(page.locator('#admin-tabs')).toBeHidden();
    await page.screenshot({ path: `test-results/ui-review/admin-quests-header-${viewport.width}.png` });
    await page.locator('#admin-management-back').click();
    await expect(quests).toBeFocused();
    await page.evaluate(() => app.admin.openAdmin());
    await expect(page.locator('.settings-workspace')).toBeVisible();
    await expect(page.locator('#treasure-close-button')).toBeVisible();
    await expect(page.locator('#admin-management-back')).toBeHidden();
    await expect(page.locator('#admin-tabs .tab-btn')).toHaveText(['Điều chỉnh']);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.evaluate(() => {
      app.data.currentUser = { username: 'demo-student', fullname: 'Học sinh Minh họa', role: 'student' };
      app.auth.updateHeader();
      app.admin.openAdmin('players');
      app.admin.switchTab('quests');
    });
    await expect(page.locator('#admin-map-actions')).toBeHidden();
    await expect(page.locator('#treasure-modal')).toBeHidden();
    expect(errors).toEqual([]);
    expect(requests).toEqual([]);
  });
}
