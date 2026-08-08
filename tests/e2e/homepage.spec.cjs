const { test, expect } = require('@playwright/test');

test('trang chủ hiển thị màn hình đăng nhập mà không gọi Supabase thật', async ({ page }) => {
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

  await expect(page).toHaveTitle('Hành Trình Tri Thức Lớp 5');
  await expect(page.locator('#login-screen')).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: /Đăng nhập để bắt đầu/ })).toBeVisible();
  await expect(page.locator('#login-btn')).toBeVisible();
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
