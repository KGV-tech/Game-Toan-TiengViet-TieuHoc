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

test('các trạm học sinh dùng chung shell, token và trạng thái tương tác', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = {
      id: 'student-ui', username: 'minh-hoa', fullname: 'Học sinh Minh họa',
      role: 'student', classlevel: '5', history: [], stars: 7
    };
    app.data.settings = {
      topicLocks: { '5': { math: { [app.constants.topics['5'].math.hk1[1]]: true } } }
    };
    app.data.userPets = [];
    app.data.quests = [];
    app.game.openConfig('math');
  });

  await expect(page.locator('#game-config-view')).toBeVisible();
  await expect(page.locator('#game-config-view .station-shell')).toBeVisible();
  await expect(page.locator('#game-config-view .student-learning-hud')).toBeVisible();
  await expect(page.locator('#game-config-view .screen-title-row')).toBeHidden();

  const configState = await page.locator('#game-config-view .station-shell').evaluate(shell => {
    const style = getComputedStyle(shell);
    const title = getComputedStyle(shell.querySelector('.screen-title-row'));
    const topic = shell.querySelector('.topic-card--locked');
    const topicStyle = topic ? getComputedStyle(topic) : null;
    return {
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      borderTopWidth: style.borderTopWidth,
      titleRadius: title.borderRadius,
      titleBackdrop: title.backdropFilter,
      mockupShell: Boolean(shell.querySelector('.student-learning-shell--mockup')),
      dailyScreen: Boolean(shell.querySelector('.student-learning-screen--daily')),
      titleDisplay: title.display,
      lockedDecoration: topicStyle?.textDecorationLine || 'none',
      lockedStrikeLayer: topic ? getComputedStyle(topic, '::after').backgroundImage : 'none'
    };
  });
  expect(configState.backgroundColor).not.toBe('rgb(255, 255, 255)');
  expect(configState.borderRadius).toBe('22px');
  expect(configState.borderTopWidth).toBe('1px');
  expect(configState.titleRadius).toBe('14px');
  expect(configState.titleBackdrop).toContain('blur');
  expect(configState.mockupShell).toBe(true);
  expect(configState.dailyScreen).toBe(true);
  expect(configState.titleDisplay).toBe('none');
  expect(configState.lockedDecoration).toBe('none');
  expect(configState.lockedStrikeLayer).toBe('none');

  await expect(page.locator('#student-learning-title')).toHaveText('Hôm nay mình học gì?');
  await expect(page.locator('#student-learning-mission-title')).toBeVisible();
  await expect(page.locator('#topics-list .student-learning-step--locked').first()).toBeDisabled();
  await expect(page.locator('#topics-list .topic-card')).toHaveCount(0);
  await expect(page.locator('#game-start-btn')).toBeHidden();

  await page.evaluate(() => app.router.open('exam-select-screen'));
  await expect(page.locator('#exam-select-screen')).toBeVisible();
  await expect(page.locator('#exam-select-screen .station-shell')).toBeVisible();
  await expect(page.locator('#exam-select-screen .subject-box')).toHaveCount(2);
  await page.locator('#exam-select-screen .subject-box').first().click();
  await expect(page.locator('#exam-select-screen .subject-box').first()).toHaveAttribute('aria-pressed', 'true');

  const screenShells = await page.locator('.station-shell').evaluateAll(shells => shells.map(shell => {
    const style = getComputedStyle(shell);
    return { radius: style.borderRadius, border: style.borderTopWidth };
  }));
  expect(screenShells.every(shell => shell.radius === '22px' && shell.border === '1px')).toBe(true);

  await page.evaluate(() => {
    app.treasure.open();
  });
  await expect(page.locator('#treasure-modal')).toBeVisible();
  await expect(page.locator('#treasure-modal')).toHaveAttribute('data-ui-context', 'student');
  await expect(page.locator('#treasure-modal .station-shell')).toBeVisible();

  await page.evaluate(() => {
    app.treasure.close();
    app.quest.open();
  });
  await expect(page.locator('#quest-modal')).toBeVisible();
  await expect(page.locator('#quest-modal')).toHaveAttribute('data-ui-context', 'student');
  await expect(page.locator('#quest-modal .station-shell')).toBeVisible();

  await page.evaluate(() => {
    app.quest.close();
    app.shop.open();
  });
  await expect(page.locator('#shop-modal')).toBeVisible();
  await expect(page.locator('#shop-modal')).toHaveAttribute('data-ui-context', 'student');
  await expect(page.locator('#shop-modal .station-shell')).toBeVisible();
  await expect(page.locator('#shop-modal .notebook-tab.active')).toHaveCSS('outline-width', '3px');

  const modalState = await page.locator('#shop-modal .station-shell').evaluate(shell => {
    const content = shell.querySelector('#shop-content-area');
    return {
      shellBackground: getComputedStyle(shell).backgroundColor,
      contentBackground: getComputedStyle(content).backgroundColor,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    };
  });
  expect(modalState.shellBackground).not.toBe('rgb(255, 255, 255)');
  expect(modalState.contentBackground).not.toBe('rgb(255, 255, 255)');
  expect(modalState.horizontalOverflow).toBe(false);

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('shell học sinh vẫn gọn và cuộn nội bộ trên tablet ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'student-ui', fullname: 'Học sinh', role: 'student', classlevel: '5', history: [] };
    app.game.openConfig('vietnamese');
  });

  const state = await page.locator('#game-config-view .station-shell').evaluate(shell => ({
    bounds: shell.getBoundingClientRect().toJSON(),
    overflowX: getComputedStyle(shell).overflowX,
    rootOverflow: document.documentElement.scrollWidth > window.innerWidth
  }));
  expect(state.bounds.x).toBeGreaterThanOrEqual(12);
  expect(state.bounds.right).toBeLessThanOrEqual(1012);
  expect(state.overflowX).toBe('auto');
  expect(state.rootOverflow).toBe(false);

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
