const { test, expect } = require('@playwright/test');

test('binding đăng nhập không chờ bộ sinh câu hỏi Toán', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/question-templates/grade-4/math/smallest-of-four.js', async route => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 2500 });
    await page.locator('#link-to-register').click({ timeout: 1500 });
    await expect(page.locator('#register-screen')).toHaveClass(/active/);
    expect(await page.evaluate(() => window.waitForGameAssets(50))).toBe(false);
  } finally {
    release();
  }
  await page.waitForLoadState('load');
  expect(await page.evaluate(() => typeof Grade4MathTemplates.generateQuestion)).toBe('function');
  expect(await page.evaluate(() => window.waitForGameAssets(50))).toBe(true);
});

test('màn đăng nhập dùng được dù dịch vụ font chưa phản hồi', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  let release;
  const fontGate = new Promise(resolve => { release = resolve; });
  await page.route('https://fonts.googleapis.com/**', async route => {
    await fontGate;
    await route.fulfill({ contentType: 'text/css', body: '' });
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 2500 });
    await page.locator('#link-to-register').click({ timeout: 1500 });
    await expect(page.locator('#register-screen')).toHaveClass(/active/);
  } finally {
    release();
  }
});

test('đo ngân sách khởi động bằng Chromium trên mạng và CPU giới hạn', async ({ page }) => {
  test.setTimeout(90000);
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 200000, uploadThroughput: 100000 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/', { waitUntil: 'load' });
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      domReadyMs: Math.round(nav.domContentLoadedEventEnd),
      loadMs: Math.round(nav.loadEventEnd),
      resources: resources.length,
      bytes: resources.reduce((sum, r) => sum + r.encodedBodySize, 0),
      scripts: resources.filter(r => r.initiatorType === 'script').length,
      scriptBytes: resources.filter(r => r.initiatorType === 'script').reduce((sum, r) => sum + r.encodedBodySize, 0),
      criticalScripts: resources.filter(r => r.initiatorType === 'script' && r.startTime < nav.domContentLoadedEventStart).length,
      paints: performance.getEntriesByType('paint').map(p => ({ name: p.name, ms: Math.round(p.startTime) }))
    };
  });
  console.log('STARTUP_METRICS', JSON.stringify(metrics));
  expect(metrics.criticalScripts).toBeLessThanOrEqual(30);
  await expect(page.locator('#login-btn')).toBeVisible();
});

async function installLoginFixture(page, role) {
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.addInitScript(userRole => {
      const user = { id: 'perf-user', auth_user_id: 'perf-auth', username: 'perf-user', fullname: 'Học sinh thử nghiệm', role: userRole, approved: true, classlevel: '4', history: [], stars: 0 };
      window.__perfReads = [];
      const sharedGate = new Promise(resolve => { window.__releaseShared = resolve; });
      const client = {
        auth: { signInWithPassword: async () => ({ data: { user: { id: 'perf-auth' } }, error: null }) },
        channel() { return { on() { return this; }, subscribe() { return this; } }; },
        from(table) {
          return {
            select() { return this; }, eq() { return this; }, ilike() { return this; },
            single() { return Promise.resolve({ data: user, error: null }); },
            async range() {
              window.__perfReads.push(table);
              if (table === 'game_settings') await sharedGate;
              return { data: table === 'game_users' ? [user] : [], error: null };
            },
            then(resolve, reject) { return this.range().then(resolve, reject); }
          };
        }
      };
      window.supabase = { createClient: () => client };
    }, role);
}

for (const role of ['student', 'admin']) {
  test(`đọc dữ liệu ${role} không chờ lượt tải dữ liệu chung`, async ({ page }) => {
    await installLoginFixture(page, role);
    await page.goto('/');
    await page.evaluate(() => {
      app.teamCompetition.syncRemote = async () => [];
      app.game.flushPendingResults = async () => {};
      app.daily.onMapEnter = () => {};
    });
    await page.locator('#username').fill('perf-user');
    await page.locator('#password').fill('fixture-only');
    await page.locator('#login-btn').click();
    try {
      await expect.poll(() => page.evaluate(() => window.__perfReads), { timeout: 1500 }).toContain(role === 'admin' ? 'game_users' : 'user_pets');
      await expect(page.locator('#map-screen')).not.toHaveClass(/active/);
    } finally {
      await page.evaluate(() => window.__releaseShared());
    }
    await expect(page.locator('#map-screen')).toHaveClass(/active/);
    expect(await page.evaluate(() => app.data.currentUser.username)).toBe('perf-user');
  });
}

for (const asset of ['question-templates/grade-4/vietnamese/index.js', 'map-layout.css', 'modules/startup-assets.js']) {
test(`lỗi tải ${asset} được báo rõ, không mở gameplay thiếu tài nguyên`, async ({ page }) => {
  await installLoginFixture(page, 'student');
  await page.route(`**/${asset}`, route => route.abort());
  await page.goto('/');
  await page.evaluate(() => window.__releaseShared());
  await page.locator('#username').fill('perf-user');
  await page.locator('#password').fill('fixture-only');
  await page.locator('#login-btn').click();
  await expect(page.locator('#login-error')).toContainText('tải');
  await expect(page.locator('#map-screen')).not.toHaveClass(/active/);
  await expect(page.locator('#login-btn')).toBeEnabled();
});
}

for (const failOptionalRead of [false, true]) {
test(`đăng nhập chờ giao diện bản đồ kể cả khi dữ liệu phụ lỗi: ${failOptionalRead}`, async ({ page }) => {
  await installLoginFixture(page, 'student');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/map-layout.css', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#link-to-register').click();
    await expect(page.locator('#register-screen')).toHaveClass(/active/);
    await page.locator('#link-to-login').click();
    await page.evaluate((failOptionalRead) => {
      window.__releaseShared();
      app.teamCompetition.syncRemote = async () => [];
      app.game.flushPendingResults = async () => {};
      app.daily.onMapEnter = () => {};
      if (failOptionalRead) app.data.loadSeenQuestions = async () => { throw new Error('fixture read failure'); };
    }, failOptionalRead);
    await page.evaluate(() => window.gameTemplatesReady);
    await page.locator('#username').fill('perf-user');
    await page.locator('#password').fill('fixture-only');
    await page.locator('#login-btn').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#map-screen')).not.toHaveClass(/active/);
  } finally {
    release();
  }
  await expect(page.locator('#map-screen')).toHaveClass(/active/);
  expect(await page.locator('link[href="./src/map-layout.css"]').getAttribute('media')).toBe('all');
});
}
