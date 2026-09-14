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
  await expect(page.locator('.student-learning-hud__brand strong')).toHaveText('VUI HỌC TOÁN');
  await expect(page.locator('.student-learning-hud__brand small')).toHaveCount(0);
  await expect(page.locator('.student-learning-hud').getByRole('button', { name: 'Về bản đồ' })).toBeVisible();
  await expect(page.locator('#game-config-view > .utility-close-button')).toHaveCount(0);
  await expect(page.locator('.student-learning-hud__profile')).toContainText('Học sinh Minh họa');
  await expect(page.locator('.student-learning-hud__profile')).toContainText('Học sinh · Cấp lớp 4');
  await expect(page.locator('.student-learning-hud__profile')).toContainText('Danh hiệu: Học Trò Chăm Chỉ');
  await expect(page.locator('.student-learning-hud__profile')).toContainText('7 Sao');
  await expect(page.locator('.student-learning-hud__profile .student-learning-hud__profile-progress')).toBeVisible();
  await expect(page.locator('.student-learning-hud__avatar')).toBeVisible();
  await expect(page.locator('.student-learning-hud__headline')).toHaveCount(0);
  await expect(page.locator('.student-learning-hud__reward')).toHaveCount(0);
  await expect(page.locator('.student-learning-screen--daily')).toBeVisible();
  await expect(page.locator('.student-learning-practice-robot')).toBeVisible();
  await expect(page.locator('.student-learning-practice-robot img')).toHaveAttribute('src', './public/student-practice-robot.png');
  await expect(page.locator('.student-learning-mascot-bubble')).toBeHidden();
  await expect(page.locator('#game-config-view .config-left')).toBeHidden();
  await expect(page.locator('.student-learning-mission-card__lesson')).toHaveText('Bài 1. Ôn tập các số đến 100 000');
  await expect(page.locator('.student-learning-mission-card__heading')).toHaveCount(0);
  await expect(page.locator('.student-learning-mission-card__check')).toHaveCount(0);
  await expect(page.locator('.student-learning-mission-card__count')).toHaveCount(0);
  await expect(page.locator('.student-learning-mission')).toHaveAttribute('data-learning-focus', 'next');
  await expect(page.locator('.student-learning-mission-card')).toHaveCSS('background-image', /student-learning-lesson-frame.png/);
  await expect(page.locator('#game-config-view')).toHaveCSS('overflow-x', 'hidden');
  await expect(page.locator('.student-learning-screen--daily')).toHaveCSS('overflow-y', 'hidden');
  await expect(page.locator('.student-learning-lesson-sign')).toBeHidden();
  await expect(page.locator('.student-learning-continue')).toContainText('Vào luyện tập nào!');
  await expect(page.locator('[data-learning-entry="g4-math-hk1-b04"]')).toBeDisabled();
  await expect(page.locator('[data-learning-entry="g4-math-hk1-b04"]')).toContainText('Chưa học');
  await expect(page.locator('[data-learning-entry="g4-math-hk1-b03"]')).toContainText('Có thể luyện');
  await expect(page.locator('.topic-mode-toggle')).toBeHidden();
  await expect(page.locator('#game-start-btn')).toBeHidden();
  await expect(page.locator('.student-learning-path')).toHaveClass(/student-learning-path--approved-frame/);

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('#game-config-view')).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({
    page: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    canvas: document.querySelector('#game-config-view').scrollWidth <= document.querySelector('#game-config-view').clientWidth
  }))).toEqual({ page: true, canvas: true });

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
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    configOverflowY: getComputedStyle(document.querySelector('#game-config-view')).overflowY,
    shellOverflowY: getComputedStyle(document.querySelector('#game-config-view .station-shell')).overflowY
  }));
  expect(state).toEqual({
    recommended: 'g4-math-hk1-b01',
    release: 'g4-math-hk1-b03',
    visibleWidth: true,
    overflowX: false,
    configOverflowY: 'hidden',
    shellOverflowY: 'hidden'
  });
  const practiceBackdrop = await page.locator('#game-config-view').evaluate(view => getComputedStyle(view).backgroundImage);
  expect(practiceBackdrop).toContain('student-practice-space.png');
  await page.screenshot({ path: testInfo.outputPath('learning-path-desktop.png') });

  await page.getByRole('button', { name: 'Xem lộ trình đầy đủ' }).click();
  await expect(page.locator('.student-learning-screen--route')).toBeVisible();
  await expect(page.locator('.student-learning-screen--daily')).toHaveCount(0);
  await expect(page.locator('.student-learning-path--full')).toBeVisible();
  await expect(page.locator('.student-learning-route-intro')).toHaveCount(0);
  await expect(page.locator('.student-learning-path--full .student-learning-path__header')).toHaveCount(0);
  await expect(page.locator('.student-learning-topic-nav')).toBeVisible();
  await expect(page.locator('.student-learning-route-board')).toBeVisible();
  await expect(page.locator('.student-learning-route-board__header')).toContainText('Cùng khám phá hành trình của bạn');
  await expect(page.locator('.student-learning-route-board__header')).toContainText('Các Bài được xếp đúng theo thứ tự trên lớp');
  await expect(page.getByRole('button', { name: 'Quay lại Luyện tập' })).toBeVisible();
  await expect(page.locator('.student-learning-release-badge')).toContainText('Đã mở đến Bài 3');
  const routeLayout = await page.locator('.student-learning-screen--route').evaluate(screen => {
    const topicList = screen.querySelector('.student-learning-topic-nav__list');
    const board = screen.querySelector('.student-learning-route-board');
    return {
      topicColumns: getComputedStyle(topicList).gridTemplateColumns.trim().split(/\s+/).length,
      topicOverflowY: getComputedStyle(topicList).overflowY,
      boardOverflowY: getComputedStyle(board).overflowY,
      screenOverflowY: getComputedStyle(screen).overflowY,
      topicNameWrap: getComputedStyle(topicList.querySelector('.student-learning-topic-link__copy strong')).whiteSpace,
      backButtonIsCompact: screen.querySelector('[data-learning-path-toggle]').getBoundingClientRect().width < board.getBoundingClientRect().width / 2
    };
  });
  expect(routeLayout).toEqual({ topicColumns: 1, topicOverflowY: 'auto', boardOverflowY: 'auto', screenOverflowY: 'hidden', topicNameWrap: 'normal', backButtonIsCompact: true });
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
  await expect.poll(() => page.evaluate(() => {
    const firstTopicName = document.querySelector('.student-learning-topic-link__copy strong');
    return {
      page: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      canvas: document.querySelector('#game-config-view').scrollWidth <= document.querySelector('#game-config-view').clientWidth,
      topicNameFits: firstTopicName.scrollWidth <= firstTopicName.clientWidth
    };
  })).toEqual({ page: true, canvas: true, topicNameFits: true });

  await page.getByRole('button', { name: 'Quay lại Luyện tập' }).click();
  await expect(page.locator('.student-learning-screen--daily')).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 768 });
  const dailyTabletState = await page.locator('#game-config-view .station-shell').evaluate(shell => ({
    right: shell.getBoundingClientRect().right,
    viewport: window.innerWidth,
    rootOverflow: document.documentElement.scrollWidth > window.innerWidth,
    overflowY: getComputedStyle(shell).overflowY,
    profileRight: document.querySelector('.student-learning-hud__profile').getBoundingClientRect().right
  }));
  expect(dailyTabletState.right).toBeLessThanOrEqual(dailyTabletState.viewport);
  expect(dailyTabletState.profileRight).toBeLessThanOrEqual(dailyTabletState.viewport);
  expect(dailyTabletState.rootOverflow).toBe(false);
  expect(dailyTabletState.overflowY).toBe('hidden');
  await page.screenshot({ path: testInfo.outputPath('learning-path-daily-tablet.png') });
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

test('giáo viên đặt mốc Bài học trong tab Quản lý lộ trình học', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', role: 'admin', classlevel: '4' };
    app.data.settings = { hardTimeLimit: 10, examTimeLimit: 30 };
    app.treasure.open();
    app.admin.switchTab('learning-path');
  });

  await expect(page.locator('#treasure-modal')).toHaveAttribute('data-ui-context', 'admin');
  await expect(page.locator('#treasure-modal .admin-learning-mascot')).toHaveCount(0);
  await expect(page.locator('#admin-tabs .tab-btn')).toHaveCount(4);
  await expect(page.locator('#admin-tabs .tab-btn', { hasText: 'Quản lý lộ trình học' })).toBeVisible();
  await expect(page.locator('#admin-tabs')).toHaveCSS('flex-direction', 'row');
  await expect(page.locator('#treasure-title')).toHaveText('Cài Đặt Hệ Thống');
  await expect(page.getByRole('heading', { name: 'Quản lý lộ trình học' })).toBeVisible();
  await expect(page.locator('.learning-release-dashboard')).toBeVisible();
  await expect(page.locator('.learning-release-control-rail')).toBeVisible();
  await expect(page.locator('.learning-release-main-panel')).toBeVisible();
  await expect(page.locator('.learning-release-class-card')).toHaveCount(0);
  await expect(page.locator('label[for="learning-release-semester"] > span')).toHaveText('Thời gian');
  await expect(page.locator('.learning-release-preview')).toHaveCSS('overflow-y', 'auto');
  await expect(page.locator('#treasure-modal .admin-content')).toHaveCSS('overflow-y', 'hidden');
  const scrollLayout = await page.locator('.learning-release-preview').evaluate(list => ({
    canScroll: list.scrollHeight > list.clientHeight,
    modalContentCanScroll: document.querySelector('#treasure-modal .admin-content').scrollHeight > document.querySelector('#treasure-modal .admin-content').clientHeight
  }));
  expect(scrollLayout).toEqual({ canScroll: true, modalContentCanScroll: false });
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
  await page.screenshot({ path: testInfo.outputPath('learning-release-admin-tablet.png') });
  await page.setViewportSize({ width: 900, height: 700 });
  await expect(page.locator('#treasure-modal .admin-content')).toHaveCSS('overflow-y', 'hidden');
  await expect(page.locator('.learning-release-preview')).toHaveCSS('overflow-y', 'auto');
  const compactState = await page.locator('#treasure-modal .station-shell').evaluate(shell => document.documentElement.scrollWidth <= window.innerWidth && shell.getBoundingClientRect().right <= window.innerWidth);
  expect(compactState).toBe(true);
  await page.locator('#admin-tabs .tab-btn', { hasText: 'Điều chỉnh' }).click();
  await expect(page.locator('.settings-workspace')).toBeVisible();
  await expect(page.locator('.learning-release-workspace')).toHaveCount(0);
  await expect(page.locator('#learning-release-lesson')).toHaveCount(0);
  await expect(page.locator('#treasure-title')).toHaveText('Cài Đặt Hệ Thống');
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
