const { test, expect } = require('@playwright/test');
async function setup(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.goto('/');
  await page.evaluate(async () => {
    app.data.currentUser = { id: 'offline-teacher', auth_user_id: 'auth-offline-teacher', username: 'teacher', role: 'admin' };
    app.data.users = [{ username: 'a', fullname: 'Nguyễn An', classlevel: '4', class_name: '4/4', role: 'student', approved: true }];
    await app.classroom.ensure();
    await app.classroom.createWeek({ id: crypto.randomUUID(), name: 'Tuần Offline', classlevel: '4', className: '4/4', startDate: '2026-10-04', endDate: '2026-10-10', mode: 'groups', participants: [{ username: 'a', fullname: 'Nguyễn An' }], teams: [{ id: 'g', name: 'Nhóm 1', members: ['a'] }], scores: {}, absences: [], version: 1 });
    app.admin.openAdmin('quests'); app.admin.switchQuestMode('weekly');
    app.classroom.configure({ auth: { getUser: async () => ({ data: { user: { id: 'auth-offline-teacher' } } }) } });
  });
}
test('giáo viên đã xác thực ghi điểm khi mất mạng; tải lại không tự mở quyền từ bản lưu', async ({ page, context }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await setup(page);
  await page.evaluate(async () => { const legacy = await caches.open('weekly-shell-v1'); await legacy.put('/index.html', new Response('legacy login')); });
  await page.locator('#weekly-offline').click();
  await expect(page.locator('#weekly-offline')).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });
  expect(await page.evaluate(() => caches.has('weekly-shell-v1'))).toBe(false);
  await page.locator('[data-weekly-student=a]').click();
  await page.locator('#weekly-point-add').click();
  await expect(page.locator('.weekly-status')).toContainText('2 thao tác');
  await context.setOffline(true);
  await expect(page.locator('#weekly-select')).toContainText('Tuần Offline');
  await expect(page.locator('[data-weekly-student=a]')).toContainText('1');
  await page.locator('[data-weekly-student=a]').click();
  await page.locator('#weekly-point-add').click();
  await expect(page.locator('[data-weekly-student=a]')).toContainText('2');
  await expect(page.locator('.quest-management-detail--weekly')).toBeVisible();
  expect(await page.evaluate(() => app.classroom.offlineQueue.length)).toBe(3);
  await page.screenshot({ path: 'test-results/weekly-offline-1280.png' });
  await context.setOffline(false);
  await page.evaluate(() => {
    let server = null; const events = new Set(); window.offlineRpcs = [];
    app.classroom.configure({
      auth: { getUser: async () => ({ data: { user: { id: 'auth-offline-teacher' } } }) },
      from: table => ({ select: () => ({ order: () => ({ range: async () => ({ data: table === 'classroom_weeks' && server ? [server] : [] }) }) }) }),
      async rpc(name, args) {
        window.offlineRpcs.push(name);
        if (name === 'classroom_create_week') { const w = args.p_week; server = { ...w, localOnly: undefined, class_name: w.className, start_date: w.startDate, end_date: w.endDate, version: 1 }; }
        if (name === 'classroom_add_point' && !events.has(args.p_event_id)) { events.add(args.p_event_id); server.scores[args.p_username] = (server.scores[args.p_username] || 0) + args.p_delta; server.version++; }
        return { data: structuredClone(server) };
      }
    });
  });
  await page.locator('#weekly-sync-all').click();
  await expect.poll(() => page.evaluate(() => app.classroom.offlineQueue.length)).toBe(0);
  await expect(page.locator('#weekly-sync-all')).toBeEnabled();
  await expect(page.locator('#weekly-offline')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-weekly-student=a]')).toContainText('2');
  expect(await page.evaluate(() => window.offlineRpcs)).toEqual(['classroom_create_week', 'classroom_add_point', 'classroom_add_point']);
  expect(await page.evaluate(() => app.classroom.offlineQueue.length)).toBe(0);
  await page.evaluate(() => { app.classroom.client.auth.getUser = async () => ({ data: { user: { id: 'other-auth-account' } } }); });
  await page.locator('#weekly-offline').click();
  await expect(page.locator('.weekly-status')).toContainText('đăng nhập lại');
  expect(await page.evaluate(() => window.offlineRpcs.length)).toBe(3);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#login-screen')).toHaveClass(/active/);
  await expect(page.locator('#weekly-open-offline, .weekly-offline-entry')).toHaveCount(0);
  expect(await page.evaluate(() => app.data.currentUser)).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('weekly-offline:v1:offline-teacher')).weeks.length)).toBe(1);
});
for (const [width, height] of [[1440,900],[1024,768]]) {
  test(`Offline controls fit light/dark workspace ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await setup(page);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      await expect(page.locator('#weekly-offline')).toBeVisible();
      const metrics = await page.evaluate(() => {
        const sidebar = document.querySelector('.quest-management-sidebar'), button = document.getElementById('weekly-export');
        return { overflow: sidebar.scrollHeight > sidebar.clientHeight + 1, bottom: button.getBoundingClientRect().bottom, height: innerHeight };
      });
      expect(metrics.overflow).toBe(false); expect(metrics.bottom).toBeLessThan(metrics.height);
    }
    await page.screenshot({ path: `test-results/weekly-offline-${width}.png` });
  });
}
