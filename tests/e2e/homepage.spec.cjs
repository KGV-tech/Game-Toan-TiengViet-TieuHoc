const { test, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

const reviewDirectory = join('test-results', 'ui-review');

async function captureUiReview(page, testInfo, fileName) {
  mkdirSync(reviewDirectory, { recursive: true });
  const filePath = join(reviewDirectory, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  await testInfo.attach(fileName, { path: filePath, contentType: 'image/png' });
}

async function openOfflineHomepage(page) {
  const consoleErrors = [];
  const supabaseRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('request', request => {
    if (request.url().includes('.supabase.co')) {
      supabaseRequests.push(request.url());
    }
  });

  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  await page.goto('/');

  return { consoleErrors, supabaseRequests };
}

async function expectSafeLoginScreen(page, consoleErrors, supabaseRequests) {
  await expect(page).toHaveTitle('Hành Trình Tri Thức Lớp 5');
  await expect(page.locator('#login-screen')).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: /Đăng nhập để bắt đầu/ })).toBeVisible();
  await expect(page.locator('#login-btn')).toBeVisible();
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

test('desktop: trang chủ hiển thị màn hình đăng nhập mà không gọi Supabase thật', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await expectSafeLoginScreen(page, consoleErrors, supabaseRequests);
  await captureUiReview(page, testInfo, 'login-desktop.png');
});

test('mobile dọc: nhắc học sinh xoay màn hình', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await expect(page.getByText('Vui lòng xoay ngang màn hình')).toBeVisible();
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  await captureUiReview(page, testInfo, 'login-mobile-portrait-rotate.png');
});

test('mobile ngang: trang chủ hiển thị màn hình đăng nhập mà không gọi Supabase thật', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await expectSafeLoginScreen(page, consoleErrors, supabaseRequests);
  await captureUiReview(page, testInfo, 'login-mobile-landscape.png');
});

const auditStates = [
  { name: 'register', screenId: 'register-screen' },
  { name: 'map', screenId: 'map-screen' },
  { name: 'game-config', screenId: 'game-screen', gameViewId: 'game-config-view' },
  { name: 'game-play', screenId: 'game-screen', gameViewId: 'game-play-view' },
  { name: 'exam-select', screenId: 'exam-select-screen' },
  { name: 'exam-play', screenId: 'exam-play-screen' },
  { name: 'guide-modal', screenId: 'map-screen', modalId: 'guide-modal' },
  { name: 'result-modal', screenId: 'game-screen', gameViewId: 'game-play-view', modalId: 'result-modal' },
  { name: 'treasure-modal', screenId: 'map-screen', modalId: 'treasure-modal' },
  { name: 'quest-modal', screenId: 'map-screen', modalId: 'quest-modal' },
  { name: 'shop-modal', screenId: 'map-screen', modalId: 'shop-modal' },
];

async function showAuditState(page, state) {
  await page.evaluate(({ screenId, gameViewId, modalId }) => {
    document.querySelectorAll('.screen').forEach(element => element.classList.remove('active'));
    document.querySelectorAll('.game-view').forEach(element => element.classList.remove('active'));
    document.querySelectorAll('.modal, .modal-overlay').forEach(element => element.classList.remove('active'));

    document.getElementById(screenId).classList.add('active');
    if (gameViewId) document.getElementById(gameViewId).classList.add('active');
    if (modalId === 'guide-modal') {
      document.getElementById(modalId).style.display = 'flex';
    } else if (modalId) {
      document.getElementById(modalId).classList.add('active');
    }

    document.getElementById('player-info').textContent = 'Minh Anh · Lớp 5 · 1.250 điểm';
    document.getElementById('game-config-title').textContent = 'Luyện tập Toán lớp 5';
    document.getElementById('topics-list').innerHTML = '<button class="topic-card active">Số tự nhiên</button><button class="topic-card">Phân số</button><button class="topic-card">Hình học</button>';
    document.getElementById('game-question-container').textContent = 'Số nào lớn nhất trong các số sau?';
    document.getElementById('game-options-container').innerHTML = '<button class="option-btn">12.345</button><button class="option-btn">12.354</button><button class="option-btn">12.435</button><button class="option-btn">12.453</button>';
    document.getElementById('exam-student-name').textContent = 'Minh Anh';
    document.getElementById('exam-questions-container').innerHTML = '<article class="exam-question">Câu 1. Viết số thích hợp vào chỗ trống.</article>';
    document.getElementById('result-msg').textContent = 'Con đã hoàn thành rất tốt!';
    document.getElementById('treasure-content-area').textContent = 'Kho báu minh họa cho phiên review UI.';
    document.getElementById('quest-list-container').innerHTML = '<article class="quest-card">Hoàn thành 5 câu Toán hôm nay</article>';
    document.getElementById('shop-content-area').textContent = 'Cửa hàng minh họa cho phiên review UI.';
  }, state);
}

test('audit UI desktop: chụp toàn bộ màn hình lõi và modal chính', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  for (const state of auditStates) {
    await showAuditState(page, state);
    await expect(page.locator(`#${state.modalId ?? state.screenId}`)).toBeVisible();
    await captureUiReview(page, testInfo, `audit-desktop-${state.name}.png`);
  }

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
