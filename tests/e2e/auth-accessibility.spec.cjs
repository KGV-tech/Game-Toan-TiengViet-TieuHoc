const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  const consoleProblems = [];
  const supabaseRequests = [];
  page.on('console', message => {
    if ((message.type() === 'error' || message.type() === 'warning')
      && !message.text().includes('Supabase SDK not loaded')) {
      consoleProblems.push(message.text());
    }
  });
  page.on('request', request => {
    if (request.url().includes('.supabase.co')) supabaseRequests.push(request.url());
  });
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
  return { consoleProblems, supabaseRequests };
}

test('auth có accessible name ổn định và Enter submit đúng form', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleProblems, supabaseRequests } = await openOfflineHomepage(page);

  const username = page.getByRole('textbox', { name: 'Tên đăng nhập' });
  const password = page.getByRole('textbox', { name: 'Mật khẩu' });
  await expect(username).toBeVisible();
  await expect(password).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu' })).toBeVisible();

  await page.evaluate(() => window.app.auth.login());
  await expect(page.locator('#login-error')).toBeVisible();
  await expect(page.locator('#username')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#username')).toHaveAttribute('aria-describedby', 'login-error');

  await page.evaluate(() => {
    window.__authSubmitCount = 0;
    window.app.auth.login = () => { window.__authSubmitCount += 1; };
  });
  await username.fill('hoc-sinh-01');
  await password.fill('mat-khau-thu');
  await password.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__authSubmitCount)).toBe(1);

  await page.getByRole('link', { name: 'Đăng ký tài khoản mới' }).click();
  await expect(page.getByRole('textbox', { name: 'Họ và tên học sinh' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tên đăng nhập' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Cấp lớp' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Giới tính' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Chọn Avatar' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Phi công' })).toBeVisible();

  await page.evaluate(() => {
    window.__registerSubmitCount = 0;
    window.app.auth.register = () => { window.__registerSubmitCount += 1; };
  });
  await page.getByRole('textbox', { name: 'Họ và tên học sinh' }).press('Enter');
  await expect.poll(() => page.evaluate(() => window.__registerSubmitCount)).toBe(1);

  expect(supabaseRequests).toEqual([]);
  expect(consoleProblems).toEqual([]);
});

test('dialog đổi mật khẩu trap focus, khóa nền, Escape và trả focus về nút mở', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const { consoleProblems, supabaseRequests } = await openOfflineHomepage(page);

  const opener = page.locator('#link-to-change-password');
  await page.locator('#username').fill('hoc-sinh-01');
  await opener.focus();
  await opener.click();

  const modal = page.locator('#change-password-modal');
  await expect(modal).toHaveClass(/active/);
  await expect(modal).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#change-password-old')).toBeFocused();
  await expect(page.locator('#login-screen')).toHaveJSProperty('inert', true);

  await page.locator('#change-password-submit').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#change-password-cancel')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#change-password-submit')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(modal).not.toHaveClass(/active/);
  await expect(modal).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#login-screen')).toHaveJSProperty('inert', false);
  await expect(opener).toBeFocused();
  expect(supabaseRequests).toEqual([]);
  expect(consoleProblems).toEqual([]);
});

test('môn học và phần thưởng dùng button semantics, hoạt động bằng bàn phím', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleProblems, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => window.app.router.open('exam-select-screen'));
  const math = page.getByRole('button', { name: 'Toán Học' });
  const vietnamese = page.getByRole('button', { name: 'Tiếng Việt' });
  await expect(math).toBeVisible();
  await expect(vietnamese).toBeVisible();
  await expect(math).toHaveAttribute('aria-pressed', 'false');
  await math.focus();
  await page.keyboard.press('Space');
  await expect(math).toHaveAttribute('aria-pressed', 'true');
  await expect(vietnamese).toHaveAttribute('aria-pressed', 'false');

  const reward = page.locator('#bonus-candies-container');
  await expect(reward).toHaveAttribute('type', 'button');
  await expect(reward).toHaveAttribute('aria-label', 'Nhận sao thưởng');
  await page.evaluate(() => {
    window.__rewardClaimed = 0;
    window.app.game.claimBonus = () => { window.__rewardClaimed += 1; };
    const resultModal = document.getElementById('result-modal');
    resultModal.classList.add('active');
    const rewardButton = document.getElementById('bonus-candies-container');
    rewardButton.style.display = 'flex';
    rewardButton.onclick = () => window.app.game.claimBonus();
    window.app.modal.open(resultModal, { initialFocus: rewardButton });
  });
  await reward.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__rewardClaimed)).toBe(1);

  expect(supabaseRequests).toEqual([]);
  expect(consoleProblems).toEqual([]);
});

test('hướng dẫn dùng dialog semantics và đóng bằng Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const { consoleProblems, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    window.app.data.currentUser = { username: 'accessibility-smoke', role: 'student' };
    window.app.router.open('map-screen');
    document.getElementById('btn-guide').focus();
    window.app.showGuide();
  });

  const guide = page.getByRole('dialog', { name: 'Hướng Dẫn Hành Trình' });
  await expect(guide).toBeVisible();
  await expect(page.locator('#map-screen')).toHaveJSProperty('inert', true);
  await expect(page.locator('#guide-modal button[aria-label="Đóng Hướng dẫn"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#guide-modal')).toBeHidden();
  await expect(page.locator('#map-screen')).toHaveJSProperty('inert', false);
  await expect(page.locator('#btn-guide')).toBeFocused();
  expect(supabaseRequests).toEqual([]);
  expect(consoleProblems).toEqual([]);
});
