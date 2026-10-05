const { test, expect } = require('@playwright/test');
for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
  test(`cached teacher cannot enter weekly workspace from login ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/*.supabase.co/**', route => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('weekly-offline:accounts:v1', JSON.stringify([{ id: 'cached-teacher', username: 'teacher', name: 'Giáo viên' }]));
      localStorage.setItem('weekly-offline:v1:cached-teacher', JSON.stringify({ owner: 'cached-teacher', authUserId: 'auth-cached', roster: [], weeks: [], queue: [], revision: 1, offline: true }));
    });
    await page.goto('/');
    await page.evaluate(() => window.gameTemplatesReady);
    await expect(page.locator('#login-form .weekly-offline-entry, #weekly-open-offline')).toHaveCount(0);
    const result = await page.evaluate(async () => {
      let rejected = false;
      try { await app.weeklyOffline.prepare(); } catch { rejected = true; }
      app.data.currentUser = { id: 'cached-teacher', auth_user_id: 'auth-cached', role: 'admin' };
      app.classroom.configure({ auth: { getUser: async () => ({ data: { user: { id: 'another-account' } } }) } });
      let mismatched = false;
      try { await app.weeklyOffline.prepare(); } catch { mismatched = true; }
      app.data.currentUser = null;
      app.classroom.configure(null);
      app.admin.openAdmin('quests');
      return { rejected, mismatched, user: app.data.currentUser, resume: typeof app.weeklyOffline.resume, registry: JSON.parse(localStorage.getItem('weekly-offline:v1:cached-teacher')).revision };
    });
    expect(result).toEqual({ rejected: true, mismatched: true, user: null, resume: 'undefined', registry: 1 });
    await expect(page.locator('#login-screen')).toHaveClass(/active/);
    await page.screenshot({ path: testInfo.outputPath('login-no-offline-entry.png') });
  });
}
