const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

for (const width of [1024, 1280, 1440]) {
  test(`Admin đổi sáng tối, giữ nội dung và ghi nhớ lựa chọn ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1024 ? 768 : width === 1280 ? 720 : 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
      app.data.users = [{ username: 'an', fullname: 'Nguyễn Minh An', role: 'student', approved: true, classlevel: '4' }];
      app.admin.openAdmin('players');
    });
    const toggle = page.locator('#treasure-modal [data-theme-toggle]:visible');
    await expect(toggle).toHaveCount(1);
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.admin-student-card')).toHaveCSS('color', 'rgb(24, 42, 66)');
    await page.evaluate(() => { app.admin.openAdmin('quests'); app.admin.switchQuestMode('personal'); });
    await expect(page.locator('.quest-management-sidebar [data-theme-toggle]')).toHaveAttribute('aria-pressed', 'true');
    const sidebar = await page.locator('.quest-management-sidebar').boundingBox();
    expect(sidebar.y + sidebar.height).toBeLessThanOrEqual(page.viewportSize().height);
    expect(await page.locator('.quest-management-sidebar').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    await page.locator('.quest-management-sidebar [data-theme-toggle]').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
    await page.evaluate(() => app.admin.openAdmin('settings'));
    await page.locator('#treasure-modal [data-theme-toggle]:visible').click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(errors).toEqual([]);
  });
}

test('Bảng màu sáng phủ các màn quản lý và đổi mode không xóa form', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = [{ username: 'an', fullname: 'Nguyễn Minh An', role: 'student', approved: true, classlevel: '4', class_name: '4/1' }];
    app.ui.setTheme('light');
  });
  fs.mkdirSync('test-results/ui-review', { recursive: true });
  for (const screen of ['settings', 'players', 'sections', 'personal', 'team', 'weekly', 'composer', 'learning']) {
    await page.evaluate(screen => {
      if (screen === 'composer') app.admin.openComposer();
      else if (screen === 'learning') app.admin.openLearningPath();
      else if (['personal', 'team', 'weekly'].includes(screen)) { app.admin.openAdmin('quests'); app.admin.switchQuestMode(screen); }
      else { app.admin.openAdmin(screen === 'sections' ? 'players' : screen); if (screen === 'sections') app.admin.switchStudentRosterTab('sections'); }
    }, screen);
    await expect(page.locator('[data-theme-toggle]:visible').first()).toBeVisible();
    await page.screenshot({ path: `test-results/ui-review/admin-light-${screen}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(async () => { await app.classroom.ensure(); app.admin.openAdmin('players'); });
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await page.evaluate(() => app.admin.showAddPlayerForm());
  const input = page.locator('#add-fullname');
  await input.fill('Tên đang nhập');
  await page.locator('#treasure-modal [data-theme-toggle]:visible').click();
  await expect(input).toHaveValue('Tên đang nhập');
});

test('Soạn đề sáng có thẻ và form dễ đọc; bảng thi đua giữ chữ HUD rõ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.questionTemplates = [{ id: 't', name: 'Nhận biết chữ số', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01', question_type: 'Trắc nghiệm', generator_key: 'number.digit_at_place', prompt_template: 'Chữ số hàng {place} là {digit}', config: { minimum: 10000, maximum: 99999 }, is_active: true }];
    app.data.libraryQuestions = [{ id: 'q', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1', topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01', type: 'Trắc nghiệm', q: '1 + 1 = ?', options: ['2', '3'], ans: '2', explanation: 'Một cộng một bằng hai.' }];
    app.data.exams = [{ id: 'e', name: 'Đề kiểm tra', questions: app.data.libraryQuestions }];
    app.ui.setTheme('light');
  });
  for (const [module, selector] of [['templates', '.template-library-card'], ['questions', '.question-library-card'], ['exams', '.exam-library-card']]) {
    await page.evaluate(module => app.admin.openComposer(module), module);
    await expect(page.locator(selector).first()).toBeVisible();
    const palette = await page.locator(selector).first().evaluate(el => {
      const style = getComputedStyle(el);
      return { bg: style.backgroundImage, color: style.color };
    });
    const channels = palette.bg.match(/rgb\((\d+), (\d+), (\d+)\)/);
    expect(channels, palette.bg).not.toBeNull();
    expect(channels.slice(1).map(Number).reduce((a, b) => a + b) / 3).toBeGreaterThan(180);
    const luminance = channels => channels.map(channel => {
      const value = Number(channel) / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const text = palette.color.match(/rgb\((\d+), (\d+), (\d+)\)/);
    expect((luminance(channels.slice(1)) + .05) / (luminance(text.slice(1)) + .05)).toBeGreaterThanOrEqual(4.5);
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/ui-review/admin-light-${module}-library.png` });
  }
  await page.evaluate(() => { app.admin.openComposer('templates'); app.admin.renderTemplateForm(0); });
  await expect(page.locator('.template-editor__section').first()).toHaveCSS('color', 'rgb(24, 42, 66)');
  await page.locator('.template-editor__section').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/ui-review/admin-light-template-editor.png' });
  await page.locator('#template-preview-open').click();
  await expect(page.locator('.template-preview__question')).toHaveCSS('color', 'rgb(24, 42, 66)');
  await page.locator('#template-preview-back').click();
  await page.evaluate(() => { app.admin.openComposer('exams'); app.admin.renderESubTab('add'); });
  await expect(page.locator('.exam-composer__header h3')).toHaveCSS('color', 'rgb(24, 42, 66)');
  await page.locator('.exam-composer__header').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/ui-review/admin-light-exam-editor.png' });
  await page.evaluate(() => {
    app.admin.openAdmin('quests');
    const match = app.teamCompetition.normalizeCompetition({ id: 'board', name: 'Thi đua minh họa', classlevel: '4', commonExamId: 'e', questionMode: 'same', status: app.teamCompetition.STATUS.PREPARED, teams: [{ id: 'a', name: 'Đội Một' }, { id: 'b', name: 'Đội Hai' }] });
    app.teamCompetition.store.upsert(match);
    app.admin.openTeamCompetitionBoard(match.id);
  });
  await expect(page.locator('.team-race-clock')).toHaveCSS('background-color', 'rgb(245, 250, 255)');
  await expect(page.locator('.team-race-clock strong')).toHaveCSS('color', 'rgb(24, 42, 66)');
  await expect(page.locator('.team-board-toolbar [data-theme-toggle]')).toBeVisible();
});
