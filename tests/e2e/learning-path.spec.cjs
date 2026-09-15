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
  await expect(page.locator('.student-learning-hud').evaluate(hud => getComputedStyle(hud, '::before').backgroundImage)).resolves.toBe('none');
  const titleLogo = page.locator('.student-learning-hud__brand-image');
  await expect(titleLogo).toHaveAttribute('src', './public/student-learning-title-math.png');
  await expect(titleLogo).toHaveAttribute('alt', 'Vui học Toán');
  await expect(page.locator('.student-learning-hud__brand-mark')).toHaveCount(0);
  const titleAlignment = await titleLogo.evaluate(title => {
    const box = title.getBoundingClientRect();
    return Math.round((box.left + box.right) / 2 - window.innerWidth / 2);
  });
  expect(Math.abs(titleAlignment)).toBe(0);
  const profileAlignment = await page.locator('.student-learning-hud__profile').evaluate(profile => {
    const box = profile.getBoundingClientRect();
    return Math.round(window.innerWidth - box.right);
  });
  expect(profileAlignment).toBeLessThanOrEqual(64);
  await expect(page.locator('.student-learning-hud__brand small')).toHaveCount(0);
  await expect(page.locator('.student-learning-hud').getByRole('button', { name: 'Về bản đồ' })).toBeVisible();
  const mapButtonPosition = await page.locator('[data-learning-back-map]').evaluate(button => {
    const box = button.getBoundingClientRect();
    const header = document.querySelector('.student-learning-hud').getBoundingClientRect();
    return {
      left: Math.round(box.left),
      top: Math.round(box.top),
      verticalOffset: Math.round((box.top + box.bottom) / 2 - (header.top + header.bottom) / 2)
    };
  });
  expect(mapButtonPosition.left).toBeLessThanOrEqual(48);
  expect(Math.abs(mapButtonPosition.verticalOffset)).toBeLessThanOrEqual(8);
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
  await expect(page.locator('.student-learning-mission-card')).toHaveCount(0);
  await expect(page.locator('.student-learning-mission-card__heading')).toHaveCount(0);
  await expect(page.locator('.student-learning-mission-card__check')).toHaveCount(0);
  await expect(page.locator('.student-learning-mission-card__count')).toHaveCount(0);
  await expect(page.locator('.student-learning-mission')).toHaveAttribute('data-learning-focus', 'next');
  await expect(page.locator('#game-config-view')).toHaveCSS('overflow-x', 'hidden');
  await expect(page.locator('.student-learning-screen--daily')).toHaveCSS('overflow-y', 'hidden');
  await expect(page.locator('.student-learning-lesson-sign')).toBeHidden();
  await expect(page.locator('.student-learning-continue')).toHaveAttribute('aria-label', 'Vào luyện tập nào!');
  await expect(page.locator('.student-learning-continue__art')).toHaveAttribute('src', './public/student-learning-practice-button.png');
  const achievements = page.locator('.student-learning-achievements');
  await expect(achievements).toContainText('THÀNH TÍCH HÔM NAY');
  await expect(achievements.locator('li').nth(0)).toContainText('Hoàn thành bài học');
  await expect(achievements.locator('li').nth(0).locator('strong')).toHaveText('0');
  await expect(achievements.locator('li').nth(1)).toContainText('Đạt sao');
  await expect(achievements.locator('li').nth(1).locator('strong')).toHaveText('0');
  await expect(achievements.locator('li').nth(2)).toContainText('Thời gian Luyện tập');
  await expect(achievements.locator('li').nth(2).locator('strong')).toHaveText('0 phút');
  await expect(achievements).toHaveCSS('position', 'fixed');
  const rightRail = await page.evaluate(() => {
    const bounds = selector => {
      const box = document.querySelector(selector).getBoundingClientRect();
      const style = getComputedStyle(document.querySelector(selector));
      return {
        left: Math.round(box.left), right: Math.round(box.right), top: Math.round(box.top), bottom: Math.round(box.bottom),
        borderRadius: style.borderRadius, backgroundImage: style.backgroundImage, fontSize: parseFloat(style.fontSize), boxShadow: style.boxShadow
      };
    };
    return {
      profile: bounds('.student-learning-hud__profile'),
      route: bounds('.student-learning-path-toggle--right-rail'),
      achievements: bounds('.student-learning-achievements')
    };
  });
  expect(rightRail.profile.left).toBe(rightRail.route.left);
  expect(rightRail.profile.left).toBe(rightRail.achievements.left);
  expect(rightRail.profile.right).toBe(rightRail.route.right);
  expect(rightRail.profile.right).toBe(rightRail.achievements.right);
  expect(rightRail.achievements.top).toBeGreaterThan(rightRail.profile.bottom);
  expect(rightRail.route.top).toBeGreaterThan(rightRail.achievements.bottom);
  expect(rightRail.route.borderRadius).toBe(rightRail.profile.borderRadius);
  expect(rightRail.achievements.borderRadius).toBe(rightRail.profile.borderRadius);
  expect(rightRail.route.backgroundImage).toContain('linear-gradient');
  expect(rightRail.achievements.backgroundImage).toContain('linear-gradient');
  expect(rightRail.route.bottom - rightRail.route.top).toBeGreaterThanOrEqual(100);
  expect(rightRail.route.fontSize).toBeGreaterThanOrEqual(24);
  expect(rightRail.route.boxShadow).toContain('rgba(89, 242, 255, 0.92)');
  expect(rightRail.profile.top).toBeGreaterThanOrEqual(0);
  expect(rightRail.route.bottom).toBeLessThanOrEqual(900);
  await expect(page.locator('.student-learning-path-toggle__icon')).toBeVisible();
  await expect(page.locator('.student-learning-path-toggle__icon img')).toHaveAttribute('src', './public/student-learning-route-icon.svg');
  await expect(page.locator('.student-learning-continue__art')).toHaveCSS('filter', /22px/);
  await expect(page.locator('.topic-mode-toggle')).toBeHidden();
  await expect(page.locator('#game-start-btn')).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 720 });
  const laptopRailFits = await page.evaluate(() => {
    const bounds = selector => document.querySelector(selector).getBoundingClientRect();
    const profile = bounds('.student-learning-hud__profile');
    const achievements = bounds('.student-learning-achievements');
    const route = bounds('.student-learning-path-toggle--right-rail');
    return {
      inViewport: profile.top >= 0 && route.bottom <= window.innerHeight,
      ordered: achievements.top > profile.bottom && route.top > achievements.bottom,
      noVerticalScroll: document.documentElement.scrollHeight <= document.documentElement.clientHeight
    };
  });
  expect(laptopRailFits).toEqual({ inViewport: true, ordered: true, noVerticalScroll: true });

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
  await expect(page.locator('.student-learning-shell')).toHaveAttribute('data-subject', 'Tiếng Việt');
  await expect(page.locator('.student-learning-hud__brand-image')).toHaveAttribute('src', './public/student-learning-title-vietnamese.png');
  await expect(page.locator('#game-config-view')).toHaveCSS('background-image', /student-learning-vietnamese-background.png/);
  await expect(page.locator('.student-learning-path-toggle--right-rail')).toHaveText('Xem lộ trình đầy đủ');
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

  const readAdminShell = () => page.locator('#treasure-modal').evaluate(modal => {
    const panel = modal.querySelector('.admin-panel');
    const title = modal.querySelector('#treasure-title');
    const tabs = modal.querySelector('#admin-tabs');
    const panelStyle = getComputedStyle(panel);
    const titleStyle = getComputedStyle(title);
    const tabsStyle = getComputedStyle(tabs);
    return {
      panelWidth: panel.getBoundingClientRect().width,
      panelHeight: panel.getBoundingClientRect().height,
      panelBorderRadius: panelStyle.borderRadius,
      panelBackground: panelStyle.backgroundImage,
      titleFontSize: titleStyle.fontSize,
      tabsMarginBottom: tabsStyle.marginBottom,
      tabsPaddingBottom: tabsStyle.paddingBottom
    };
  });

  await page.evaluate(() => app.admin.switchTab('settings'));
  const settingsShell = await readAdminShell();
  await page.evaluate(() => app.admin.switchTab('learning-path'));
  const learningPathShell = await readAdminShell();
  expect(learningPathShell).toEqual(settingsShell);

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
  const tabletLearningPathShell = await readAdminShell();
  await page.evaluate(() => app.admin.switchTab('settings'));
  const tabletSettingsShell = await readAdminShell();
  expect(tabletLearningPathShell).toEqual(tabletSettingsShell);
  await page.evaluate(() => app.admin.switchTab('learning-path'));
  const tabletState = await page.locator('#treasure-modal .station-shell').evaluate(shell => ({
    right: shell.getBoundingClientRect().right,
    viewport: window.innerWidth,
    rootOverflow: document.documentElement.scrollWidth > window.innerWidth
  }));
  expect(tabletState.right).toBeLessThanOrEqual(tabletState.viewport);
  expect(tabletState.rootOverflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('learning-release-admin-tablet.png') });
  await page.setViewportSize({ width: 900, height: 700 });
  const compactLearningPathShell = await readAdminShell();
  await page.evaluate(() => app.admin.switchTab('settings'));
  const compactSettingsShell = await readAdminShell();
  expect(compactLearningPathShell).toEqual(compactSettingsShell);
  await page.evaluate(() => app.admin.switchTab('learning-path'));
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
