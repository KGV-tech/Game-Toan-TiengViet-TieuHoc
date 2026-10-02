const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

async function openAdmin(page, workspace = 'players') {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(workspace => {
    app.data.currentUser = { username: 'teacher-demo', fullname: 'Giáo viên minh họa', role: 'admin' };
    app.data.users = Array.from({ length: 12 }, (_, index) => ({ username: `student-${index}`, fullname: `Học sinh ${index + 1}`, role: 'student', approved: index !== 11, classlevel: '4', class_name: '4/1', gender: index % 2 ? 'female' : 'male' }));
    app.admin.openAdmin(workspace);
  }, workspace);
}

test('Bản nháp sửa/xóa, không trùng thành viên và báo lỗi lưu', async ({ page }) => {
  await openAdmin(page);
  await page.getByRole('tab', { name: 'Tổ', exact: true }).click();
  await page.locator('#btn-sub-add').click();
  await page.getByLabel('Tên tổ', { exact: true }).fill('<img src=x onerror=alert(1)>');
  await page.locator('input[name="draft-member"]').first().check();
  await page.getByRole('button', { name: '✓ Lưu tổ' }).click();
  await expect(page.locator('.admin-student-draft-card h3')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.admin-student-draft-card img')).toHaveCount(0);
  await page.locator('#btn-sub-add').click();
  await expect(page.locator('input[name="draft-member"]').first()).toBeDisabled();
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.locator('.admin-student-draft-card').getByRole('button', { name: '✎ Sửa' }).click();
  await page.getByLabel('Tên tổ', { exact: true }).fill('Tổ đã sửa');
  await page.locator('input[name="draft-member"]').nth(1).check();
  await page.getByRole('button', { name: '✓ Lưu tổ' }).click();
  await expect(page.locator('.admin-student-draft-card')).toContainText('2 thành viên');
  await page.locator('#btn-sub-add').click();
  await page.getByLabel('Tên tổ', { exact: true }).fill('Tổ đã sửa');
  await page.getByRole('button', { name: '✓ Lưu tổ' }).click();
  await expect(page.locator('#student-draft-error')).toContainText('đã tồn tại');
  await page.getByLabel('Tên tổ', { exact: true }).fill('Tổ mới');
  await page.evaluate(() => {
    window.restoreDraftStorage = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota'); };
  });
  await page.getByRole('button', { name: '✓ Lưu tổ' }).click();
  await expect(page.locator('#student-draft-error')).toContainText('không cho lưu');
  await page.evaluate(() => Storage.prototype.setItem = window.restoreDraftStorage);
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.locator('.admin-student-draft-card')).toHaveCount(1);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('.admin-student-draft-card').getByRole('button', { name: 'Xóa' }).click();
  await expect(page.locator('.admin-student-draft-card')).toHaveCount(0);
  await expect(page.locator('#btn-sub-add')).toBeFocused();
});

test('Viền LED hồng tôn trọng giảm chuyển động và Quay về giữ vòng focus', async ({ page }) => {
  await openAdmin(page);
  const mapButton = page.locator('.admin-map-action--students');
  expect(await mapButton.evaluate(el => getComputedStyle(el).backgroundImage)).toContain('190, 24, 93');
  expect(await mapButton.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('roster-led');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await mapButton.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
  const buttons = page.locator('#treasure-modal :is(button, input, select):visible:not([disabled])');
  await buttons.last().focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#admin-management-back')).toBeFocused();
});

test('Cập nhật roster giữ nội dung Tổ đang soạn và kiểm tra lại thành viên khi lưu', async ({ page }) => {
  await openAdmin(page);
  await page.getByRole('tab', { name: 'Tổ', exact: true }).click();
  await page.locator('#btn-sub-add').click();
  await page.getByLabel('Tên tổ', { exact: true }).fill('Tổ đang soạn');
  await page.locator('input[name="draft-member"]').first().check();
  await page.evaluate(() => {
    app.data.users[0].approved = false;
    app.admin.refreshStudentRosterView();
  });
  await expect(page.getByLabel('Tên tổ', { exact: true })).toHaveValue('Tổ đang soạn');
  await expect(page.locator('input[name="draft-member"]').first()).toBeChecked();
  await page.getByRole('button', { name: '✓ Lưu tổ' }).click();
  await expect(page.locator('#student-draft-error')).toContainText('Danh sách học sinh đã thay đổi');
});

test('Mở thi đua bằng bàn phím và Quay về giữ focus đúng chức năng', async ({ page }) => {
  await openAdmin(page, 'quests');
  const weekly = page.locator('[data-quest-launch=weekly]');
  await weekly.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#quest-management-back')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(weekly).toBeFocused();
});

test('Tổ lưu ngoại tuyến, lọc thành viên và tách theo Admin', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (request.url().includes('.supabase.co')) requests.push(request.url()); });
  await openAdmin(page);
  const initialUsers = await page.evaluate(() => JSON.stringify(app.data.users));
  await page.getByRole('tab', { name: 'Tổ', exact: true }).click();
  await expect(page.locator('#btn-sub-add')).toHaveText('＋ Thêm tổ mới');
  await page.locator('#btn-sub-add').click();
  await page.getByLabel('Tên tổ', { exact: true }).fill('Tổ Hồng');
  await page.locator('input[name="draft-member"]').first().check();
  await page.getByRole('button', { name: '✓ Lưu tổ' }).click();
  await expect(page.locator('.admin-student-draft-card')).toContainText('Tổ Hồng');
  await page.getByRole('tab', { name: 'Danh sách học sinh' }).click();
  await page.getByLabel('Tổ (tùy chọn)', { exact: true }).selectOption({ label: 'Tổ Hồng' });
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  expect(await page.evaluate(() => JSON.stringify(app.data.users))).toBe(initialUsers);
  await page.reload();
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher-demo', role: 'admin' };
    app.admin.openAdmin('players');
    app.admin.switchStudentRosterTab('sections');
  });
  await expect(page.locator('.admin-student-draft-card')).toContainText('Tổ Hồng');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'other-teacher', role: 'admin' };
    app.admin.openAdmin('players');
    app.admin.switchStudentRosterTab('sections');
  });
  await expect(page.locator('.admin-student-draft-card')).toHaveCount(0);
  await page.evaluate(() => {
    app.data.currentUser = { username: 'student-0', role: 'student' };
    app.admin.showStudentDraftForm();
  });
  await expect(page.locator('.admin-student-draft-form')).toHaveCount(0);
  expect(requests).toEqual([]);
});

for (const width of [1280, 1440, 1024]) {
  test(`Chọn chức năng thi đua và mở màn riêng ở ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 768 });
    await openAdmin(page, 'quests');
    await expect(page.locator('[data-quest-launch]')).toHaveCount(3);
    await expect(page.locator('#admin-management-tabs')).toBeHidden();
    await expect(page.locator('.quest-workspace__header')).toHaveCount(0);
    await page.locator('[data-quest-launch=weekly]').click();
    await expect(page.locator('.weekly-tabs [role=tab]')).toHaveText(['⭐ Cộng điểm', '🎲 Chọn ngẫu nhiên', '⚑ Thi đua']);
    await page.screenshot({ path: `test-results/ui-review/quest-tabs-${width}.png` });
    await page.locator('#quest-management-back').click();
    await page.locator('[data-quest-launch=team]').click();
    await expect(page.locator('.team-competition-dashboard')).toBeVisible();
    await page.locator('#quest-management-back').click();
    await page.locator('[data-quest-launch=personal]').click();
    await expect(page.locator('.personal-quest-workspace')).toBeVisible();
  });
}

for (const width of [1280, 1440, 1024]) {
  test(`Sidebar học sinh và lưới bốn cột ở ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 720 : width === 1440 ? 900 : 768 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await openAdmin(page);
    const sidebar = page.locator('.admin-roster-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole('tab')).toHaveText(['▦ Danh sách học sinh', '▤ Tổ', '◷ Chờ phê duyệt']);
    await expect(sidebar.locator('#admin-roster-filter-search')).toBeVisible();
    await expect(sidebar.getByLabel('Tổ (tùy chọn)', { exact: true })).toBeVisible();
    await expect(sidebar.getByLabel('Nhóm (tùy chọn)', { exact: true })).toHaveCount(0);
    await expect(page.locator('.admin-roster-workspace__hero')).toHaveCount(0);
    expect(await page.locator('.admin-student-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(4);
    const left = await sidebar.boundingBox();
    const right = await page.locator('#admin-subcontent-area').boundingBox();
    expect(left.x + left.width).toBeLessThanOrEqual(right.x);
    await sidebar.getByRole('tab', { name: 'Chờ phê duyệt' }).click();
    await expect(page.locator('#btn-sub-add')).toBeHidden();
    await expect(page.locator('.admin-student-card')).toHaveCount(1);
    await sidebar.getByRole('tab', { name: 'Danh sách học sinh' }).click();
    await expect(page.locator('#btn-sub-add')).toHaveText('＋ Thêm học sinh');
    fs.mkdirSync('test-results/ui-review', { recursive: true });
    await page.screenshot({ path: `test-results/ui-review/roster-sidebar-${width}.png` });
    for (const selector of ['.admin-panel', '#treasure-content-area', '.admin-roster-workspace']) {
      expect(await page.locator(selector).evaluate(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
