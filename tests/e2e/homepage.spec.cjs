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
