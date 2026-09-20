const { test, expect } = require('@playwright/test');

const INITIAL_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 }
];

const HIDDEN_INITIAL_IMAGES = [
  'register_frame_wide.png',
  'map_scifi_adventure_v2.webp',
  'subject_math_explorer.webp',
  'subject_vietnamese_explorer.webp',
  'wheel_stand.webp',
  'shop-pets-tab.png'
];

async function blockExternalScripts(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
}

function trackBrowserErrors(page) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

async function openMainRoute(page, routeName) {
  return page.evaluate(name => {
    if (name === 'map') return app.router.open('map-screen');
    if (name === 'game') {
      app.router.open('game-screen');
      return app.router.openGameView('game-config-view');
    }
    if (name === 'exam') return app.router.open('exam-select-screen');
    if (name === 'shop') return app.shop.open();
    throw new Error(`Unknown route: ${name}`);
  }, routeName);
}

async function measureInitialImages(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await blockExternalScripts(page);
  const finishedImages = [];
  page.on('requestfinished', request => {
    if (request.resourceType() === 'image') finishedImages.push(request);
  });

  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(100);
  const requests = await Promise.all(finishedImages.map(async request => ({
    url: request.url(),
    bytes: (await request.sizes()).responseBodySize
  })));
  await context.close();
  return requests;
}

test('DOMContentLoaded khởi động luồng auth trước khi ảnh trang trí hoàn tất', async ({ page }) => {
  const { consoleErrors, pageErrors } = trackBrowserErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await blockExternalScripts(page);

  let releaseDelayedImage;
  const delayedImageReleased = new Promise(resolve => { releaseDelayedImage = resolve; });
  let delayedImageRequested = false;
  await page.route('**/login_robot_transparent.webp', async route => {
    delayedImageRequested = true;
    await delayedImageReleased;
    await route.continue();
  });
  await page.addInitScript(() => {
    window.__playwrightLoadFinished = false;
    window.addEventListener('load', () => { window.__playwrightLoadFinished = true; }, { once: true });
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => delayedImageRequested).toBe(true);
  await expect(page.locator('#login-screen')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => window.__playwrightLoadFinished)).toBe(false);

  await page.locator('#link-to-register').click();
  await expect(page.locator('#register-screen')).toHaveClass(/active/);
  await page.locator('#link-to-login').click();
  await expect(page.locator('#login-screen')).toHaveClass(/active/);

  releaseDelayedImage();
  await page.waitForLoadState('load');
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test.describe('tablet landscape touch bootstrap', () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

  test('hasTouch vẫn thao tác được các luồng auth chính', async ({ page }) => {
    const { consoleErrors, pageErrors } = trackBrowserErrors(page);
    await blockExternalScripts(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);
    await page.locator('#link-to-register').tap();
    await expect(page.locator('#register-screen')).toHaveClass(/active/);
    await page.locator('#link-to-login').tap();
    await expect(page.locator('#login-screen')).toHaveClass(/active/);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});

test('CDN chậm không giữ DOMContentLoaded hoặc chặn binding auth', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  let releaseCdn;
  const cdnGate = new Promise(resolve => { releaseCdn = resolve; });
  const startedRequests = new Set();
  await page.route('https://cdn.jsdelivr.net/**', async route => {
    startedRequests.add(route.request().url());
    await cdnGate;
    await route.abort();
  });

  const navigationStartedAt = Date.now();
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 2500 });
  expect(Date.now() - navigationStartedAt).toBeLessThan(2500);
  await expect(page.locator('#login-screen')).toHaveClass(/active/);
  await page.locator('#link-to-register').click();
  await expect(page.locator('#register-screen')).toHaveClass(/active/);
  expect([...startedRequests].some(url => url.includes('supabase-js'))).toBe(true);

  releaseCdn();
  await expect.poll(() => page.evaluate(async () => {
    const result = await window.__gameDependencies?.supabase;
    return result?.available === false;
  })).toBe(true);
  await page.locator('#register-screen #link-to-login').click();
  await page.locator('#username').fill('sample-student');
  await page.locator('#password').fill('not-a-real-password');
  await page.locator('#login-btn').click();
  await expect(page.locator('#login-error')).toContainText('dịch vụ đăng nhập');
  await context.close();
});

test('map, game, exam và shop hiện trạng thái tải khi ảnh route bị chậm', async ({ browser }) => {
  const routeCases = [
    { name: 'map', image: 'map_scifi_adventure_v2.webp', target: '#map-screen' },
    { name: 'game', image: 'start-adventure.png', target: '#game-config-view' },
    { name: 'exam', image: 'subject_math_explorer.webp', target: '#exam-select-screen' },
    { name: 'shop', image: 'shop-pets-tab.png', target: '#shop-modal' }
  ];

  for (const routeCase of routeCases) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await blockExternalScripts(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    let releaseImage;
    let signalImageRequest;
    const imageGate = new Promise(resolve => { releaseImage = resolve; });
    const imageRequested = new Promise(resolve => { signalImageRequest = resolve; });
    await page.route(`**/${routeCase.image}`, async route => {
      signalImageRequest();
      await imageGate;
      await route.continue();
    });

    await openMainRoute(page, routeCase.name);
    await imageRequested;
    await expect(page.locator(`${routeCase.target} .route-asset-status`)).toBeVisible();
    await expect(page.locator(routeCase.target)).toHaveAttribute('aria-busy', 'true');
    releaseImage();
    await expect(page.locator(`${routeCase.target} .route-asset-status`)).toBeHidden();
    await expect(page.locator(routeCase.target)).toHaveAttribute('aria-busy', 'false');
    await context.close();
  }
});

test('kéo thả câu trả lời bằng touch trên tablet ngang', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  await blockExternalScripts(page);
  await page.addInitScript(() => {
    const nativeAddEventListener = window.addEventListener.bind(window);
    window.__touchMoveListenerOptions = [];
    window.addEventListener = (type, listener, options) => {
      if (type === 'touchmove') window.__touchMoveListenerOptions.push(options);
      return nativeAddEventListener(type, listener, options);
    };

    window.MobileDragDrop = {
      polyfill() {
        const createTransfer = () => new DataTransfer();
        let drag = null;
        document.addEventListener('touchstart', event => {
          const source = event.target.closest('[draggable="true"]');
          if (source) drag = { source, transfer: createTransfer(), target: null };
        }, { passive: true });
        document.addEventListener('touchmove', event => {
          if (!drag) return;
          if (!drag.started) {
            drag.started = true;
            drag.source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: drag.transfer }));
          }
          const touch = event.touches[0];
          const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.comparison-drag-slot');
          if (target) {
            drag.target = target;
            target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: drag.transfer }));
          }
          event.preventDefault();
        }, { passive: false });
        document.addEventListener('touchend', () => {
          if (!drag) return;
          if (drag.started && drag.target) {
            drag.target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: drag.transfer }));
            drag.source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: drag.transfer }));
          }
          drag = null;
        }, { passive: true });
        window.__touchDragPolyfillApplied = true;
        return true;
      }
    };
  });

  const { consoleErrors, pageErrors } = trackBrowserErrors(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => window.__touchDragPolyfillApplied === true)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__touchMoveListenerOptions.some(options => options?.passive === false))).toBe(true);

  await page.evaluate(question => {
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    app.router.open('game-screen');
    app.router.openGameView('game-play-view');
    app.game.state = {
      ...app.game.state,
      score: 0,
      currentIdx: 0,
      subject: 'math',
      questions: [question]
    };
    app.game.loadQuestion();
  }, {
    q: 'Điền dấu thích hợp:',
    type: 'Kéo thả',
    ans: '>',
    comparisonRows: [{ label: 'a', leftText: '8', rightText: '3', answer: '>' }]
  });

  const source = await page.locator('.comparison-drag-sign[data-sign=">"]');
  const target = await page.locator('.comparison-drag-slot').first();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 }]
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ id: 1, x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 }]
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect(target).toHaveText('>');
  await expect(page.locator('#submit-ans-btn')).toBeEnabled();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  await context.close();
});

test('ảnh màn hình ẩn không nằm trong initial image budget và tải khi mở đăng ký', async ({ browser }) => {
  const measurements = [];
  for (const viewport of INITIAL_VIEWPORTS) {
    const requests = await measureInitialImages(browser, viewport);
    const totalBytes = requests.reduce((sum, request) => sum + request.bytes, 0);
    measurements.push({ viewport: `${viewport.width}x${viewport.height}`, requests: requests.length, totalBytes });
    expect(totalBytes, `${viewport.width}x${viewport.height} initial image budget`).toBeLessThan(2_000_000);
    const requestedUrls = requests.map(request => request.url);
    for (const imageName of HIDDEN_INITIAL_IMAGES) {
      expect(requestedUrls.some(url => url.endsWith(`/${imageName}`)), `${imageName} should wait for its screen`).toBe(false);
    }
  }
  console.log('Initial image budget:', measurements);

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await blockExternalScripts(page);
  await page.goto('/', { waitUntil: 'load' });
  const registerImage = page.waitForResponse(response => response.url().endsWith('/register_frame_wide.png') && response.ok());
  await page.locator('#link-to-register').click();
  await expect(page.locator('#register-screen')).toHaveClass(/active/);
  await registerImage;
  await expect(page.locator('.register-panel-frame')).toHaveAttribute('src', /register_frame_wide\.png$/);
  await context.close();
});
