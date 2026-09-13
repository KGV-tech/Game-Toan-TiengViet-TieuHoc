const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  const consoleErrors = [];
  const supabaseRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.url().includes('.supabase.co')) supabaseRequests.push(request.url());
  });
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
  return { consoleErrors, supabaseRequests };
}

test('học sinh vào môn Toán thấy bài tiếp theo và không vượt mốc giáo viên', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = {
      id: 'learning-path-student', username: 'minh-hoa', fullname: 'Học sinh Minh họa',
      role: 'student', classlevel: '4', history: [], stars: 7
    };
    app.data.settings = {
      topicLocks: {},
      lessonReleaseByClass: { '4': { math: 'g4-math-hk1-b03' } }
    };
    app.game.openConfig('math');
  });

  await expect(page.locator('#topics-list.student-learning-home')).toBeVisible();
  await expect(page.locator('.student-learning-shell')).toHaveClass(/student-learning-shell--cosmic/);
  await expect(page.locator('.student-learning-shell')).toHaveClass(/student-learning-shell--mockup/);
  await expect(page.locator('.student-learning-hud')).toBeVisible();
  await expect(page.locator('.student-learning-screen--daily')).toBeVisible();
  await expect(page.locator('.student-learning-mascot-bubble')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hôm nay mình học gì?' })).toBeVisible();
  await expect(page.locator('.student-learning-mission')).toContainText('Bài 1. Ôn tập các số đến 100 000');
  await expect(page.locator('.student-learning-mission')).toHaveAttribute('data-learning-focus', 'next');
  await expect(page.locator('.student-learning-continue')).toContainText('Tiếp tục');
  await expect(page.locator('[data-learning-entry="g4-math-hk1-b04"]')).toBeDisabled();
  await expect(page.locator('[data-learning-entry="g4-math-hk1-b03"]')).toContainText('Có thể luyện');
  await expect(page.locator('.topic-mode-toggle')).toBeHidden();
  await expect(page.locator('#game-start-btn')).toBeHidden();

  const guardrail = await page.evaluate(async () => {
    const alerts = [];
    window.alert = message => alerts.push(message);
    const overBoundary = app.learningPath.getEntries({ classlevel: '4', subject: 'math' }).find(entry => entry.id === 'g4-math-hk1-b04');
    app.game.state.selectedTopics = [overBoundary.topic];
    app.game.state.selectedLessons = [overBoundary.id];
    await app.game.startPlay();
    return { alerts, selectedLessons: app.game.state.selectedLessons };
  });
  expect(guardrail.alerts).toEqual(['Bài này chưa được mở theo tiến độ của lớp. Hãy chọn bài đang học nhé.']);
  expect(guardrail.selectedLessons).toEqual([]);

  const state = await page.evaluate(() => ({
    recommended: app.game.getLearningPlan().recommended?.id,
    release: app.game.getLearningPlan().release?.id,
    visibleWidth: document.querySelector('#game-config-view .station-shell').getBoundingClientRect().right <= window.innerWidth,
    overflowX: document.documentElement.scrollWidth > window.innerWidth
  }));
  expect(state).toEqual({
    recommended: 'g4-math-hk1-b01',
    release: 'g4-math-hk1-b03',
    visibleWidth: true,
    overflowX: false
  });
  await page.screenshot({ path: testInfo.outputPath('learning-path-desktop.png') });

  await page.getByRole('button', { name: 'Xem lộ trình đầy đủ' }).click();
  await expect(page.locator('.student-learning-screen--route')).toBeVisible();
  await expect(page.locator('.student-learning-screen--daily')).toHaveCount(0);
  await expect(page.locator('.student-learning-path--full')).toBeVisible();
  await expect(page.locator('.student-learning-topic-nav')).toBeVisible();
  await expect(page.locator('.student-learning-route-board')).toBeVisible();
  await expect(page.locator('.student-learning-release-badge')).toContainText('Đã mở đến Bài 3');
  await expect(page.locator('[data-learning-group-jump]').first()).toBeVisible();
  await expect(page.locator('.student-learning-route-board [data-learning-entry="g4-math-hk1-b04"]')).toBeDisabled();
  const secondTopic = page.locator('[data-learning-group-jump]').nth(1);
  await secondTopic.click();
  await expect(secondTopic).toHaveClass(/is-active/);
  await expect(secondTopic).toHaveAttribute('aria-current', 'true');
  await page.locator('[data-learning-group-jump]').first().click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const shell = document.querySelector('#game-config-view .station-shell');
    if (shell) shell.scrollTop = 0;
  });
  await page.screenshot({ path: testInfo.outputPath('learning-path-full-desktop.png') });

  await page.setViewportSize({ width: 1024, height: 768 });
  const fullTabletState = await page.locator('#game-config-view .station-shell').evaluate(shell => ({
    right: shell.getBoundingClientRect().right,
    viewport: window.innerWidth,
    rootOverflow: document.documentElement.scrollWidth > window.innerWidth
  }));
  expect(fullTabletState.right).toBeLessThanOrEqual(fullTabletState.viewport);
  expect(fullTabletState.rootOverflow).toBe(false);
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('khối chưa có danh mục Bài học chính thức không bị suy đoán thành Bài', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'student-grade-5', role: 'student', classlevel: '5', history: [] };
    app.data.settings = { topicLocks: {} };
    app.game.openConfig('vietnamese');
  });

  await expect(page.locator('.student-learning-notice')).toBeVisible();
  await expect(page.locator('.student-learning-step--current')).toContainText('Luyện tập theo Chủ đề');
  await expect(page.locator('.student-learning-shell')).toHaveAttribute('data-classlevel', '5');

  const tabletState = await page.locator('#game-config-view .station-shell').evaluate(shell => ({
    right: shell.getBoundingClientRect().right,
    width: shell.getBoundingClientRect().width,
    viewport: window.innerWidth,
    rootOverflow: document.documentElement.scrollWidth > window.innerWidth
  }));
  expect(tabletState.right).toBeLessThanOrEqual(tabletState.viewport);
  expect(tabletState.rootOverflow).toBe(false);
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('giáo viên đặt mốc Bài học trong màn hình Điều chỉnh', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '4' };
    app.data.settings = { hardTimeLimit: 10, examTimeLimit: 30 };
    app.treasure.open();
    app.admin.switchTab('settings');
  });

  await expect(page.locator('#treasure-modal')).toHaveAttribute('data-ui-context', 'admin');
  await expect(page.getByRole('heading', { name: 'Mở bài cho lớp học' })).toBeVisible();
  await expect(page.locator('.learning-release-dashboard')).toBeVisible();
  await expect(page.locator('.learning-release-class-card')).toBeVisible();
  await expect(page.locator('#learning-release-lesson option')).toHaveCount(74);
  await page.locator('#learning-release-lesson').selectOption('g4-math-hk1-b25');
  await expect(page.locator('#learning-release-summary')).toContainText('Bài 25');
  await expect(page.locator('.learning-release-row.is-boundary')).toContainText('Bài 25');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#learning-release-save-button').click();
  await expect.poll(() => page.evaluate(() => app.data.settings.lessonReleaseByClass['4'].math)).toBe('g4-math-hk1-b25');
  await page.screenshot({ path: testInfo.outputPath('learning-release-admin-desktop.png') });

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('#treasure-modal .learning-release-workspace')).toBeVisible();
  const tabletState = await page.locator('#treasure-modal .station-shell').evaluate(shell => ({
    right: shell.getBoundingClientRect().right,
    viewport: window.innerWidth,
    rootOverflow: document.documentElement.scrollWidth > window.innerWidth
  }));
  expect(tabletState.right).toBeLessThanOrEqual(tabletState.viewport);
  expect(tabletState.rootOverflow).toBe(false);
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
