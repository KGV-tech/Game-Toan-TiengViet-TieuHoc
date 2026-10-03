const { test, expect } = require('@playwright/test');
for (const [width, height] of [[1280,720], [1440,900], [1024,768]]) test(`Random và form tuần giữ style sáng tối, lớp và bố cục ${width}`, async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height }); await setup(page);
  await page.locator('[data-weekly-tab=standings]').click();
  await page.locator('.quest-management-sidebar [data-theme-toggle]').click();
  await page.screenshot({ path: `test-results/ui-review/weekly-manager-light-${width}.png` });
  await page.locator('[data-weekly-tab=random]').click();
  await page.screenshot({ path: `test-results/ui-review/weekly-random-light-${width}.png` });
  await page.locator('.quest-management-sidebar [data-theme-toggle]').click();
  await page.screenshot({ path: `test-results/ui-review/weekly-random-dark-${width}.png` });
  await page.locator('[data-weekly-tab=standings]').click();
  await page.locator('#weekly-manager-create').click();
  await page.getByLabel('Thi đua theo Nhóm', { exact: true }).check();
  await expect(page.locator('#weekly-class option')).toHaveCount(1);
  await expect(page.locator('[data-weekly-assignment]')).toHaveCount(4);
  await expect(page.locator('#weekly-form-members')).not.toContainText('Học sinh 10');
  await page.screenshot({ path: `test-results/ui-review/weekly-form-dark-${width}.png` });
  expect(await page.locator('.quest-management-sidebar').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test('Tải lại giữa animation vẫn giữ nút chờ và thông báo đang chọn', async ({ page }) => {
  await setup(page); await page.locator('[data-weekly-tab=random]').click();
  await page.locator('#weekly-delay').selectOption('3000');
  await page.locator('#weekly-draw').click();
  await page.evaluate(() => app.admin.refreshWeeklyAfterAsync());
  await expect(page.locator('#weekly-draw')).toBeDisabled();
  await expect(page.locator('.weekly-random-result')).toHaveClass(/is-drawing/);
  await expect(page.locator('#weekly-random-result')).toContainText('Đang chọn');
  await expect(page.locator('#weekly-draw')).toBeEnabled({ timeout: 5000 });
});
async function setup(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(async () => {
    app.data.currentUser = { username: 'teacher', role: 'admin' };
    app.data.users = ['4/1', '4/2'].flatMap((className, n) => Array.from({ length: 4 }, (_, i) => ({ username: `s${n}${i}`, fullname: `Học sinh ${n}${i}`, role: 'student', approved: true, classlevel: '4', class_name: className })));
    app.classroom.activate();
    await app.classroom.saveSection({ id: 'section', name: 'Tổ Sao', classlevel: '4', className: '4/1', members: ['s00', 's01'], version: 0 });
    for (const [n, className] of ['4/1', '4/2'].entries()) await app.classroom.createWeek({ id: `w${n}`, name: `Tuần ${n}`, classlevel: '4', className, startDate: '2026-10-05', endDate: '2026-10-10', mode: 'groups', participants: app.data.users.filter(s => s.class_name === className).map(s => ({ username: s.username, fullname: s.fullname })), teams: [{ id: 'g1', name: 'Nhóm Mây', members: [`s${n}0`, `s${n}1`] }, { id: 'g2', name: 'Nhóm Nắng', members: [`s${n}2`, `s${n}3`] }], scores: {}, absences: [], version: 1 });
    app.admin.openAdmin('quests'); app.admin.switchQuestMode('weekly');
  });
}
for (const [width, height] of [[1280,720], [1440,900], [1024,768]]) test(`Chọn lớp, sáu nút sidebar và bảng Thi đua riêng ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height }); await setup(page);
  await page.getByLabel('Lớp phụ trách', { exact: true }).selectOption({ label: 'Lớp 4/1' });
  await expect(page.locator('[data-weekly-student]')).toHaveCount(4);
  await expect(page.locator('#weekly-select option')).toHaveCount(1);
  await page.locator('[data-weekly-view=sections]').click();
  await expect(page.locator('#weekly-body')).toContainText('Tổ Sao');
  await page.locator('[data-weekly-view=groups]').click();
  await expect(page.locator('#weekly-body')).toContainText('Nhóm Mây');
  await page.locator('[data-weekly-tab=standings]').click();
  await expect(page.locator('.weekly-week-manager')).toBeVisible();
  await expect(page.locator('[data-weekly-ranking]')).toHaveCount(3);
  await page.locator('[data-weekly-ranking=groups]').click();
  await expect(page.locator('.weekly-ranking-row')).toHaveCount(2);
  await page.screenshot({ path: `test-results/ui-review/weekly-manager-${width}.png` });
  expect(await page.locator('.quest-management-sidebar').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  await page.getByLabel('Lớp phụ trách', { exact: true }).selectOption({ label: 'Lớp 4/2' });
  await expect(page.locator('#weekly-body')).not.toContainText('Học sinh 00');
});
test('Năm ô random, bỏ instant, có delay và hủy kết quả khi đổi lớp', async ({ page }) => {
  await setup(page);
  await page.getByLabel('Lớp phụ trách', { exact: true }).selectOption({ label: 'Lớp 4/1' });
  await page.locator('[data-weekly-tab=random]').click();
  await expect(page.getByRole('heading', { name: 'Chế độ chọn ngẫu nhiên' })).toBeVisible();
  await expect(page.locator('[data-weekly-random-mode]')).toHaveCount(5);
  await expect(page.locator('#weekly-instant')).toHaveCount(0);
  await page.locator('[data-weekly-random-mode=section-member]').click();
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-draw')).toBeDisabled();
  await expect.poll(() => page.evaluate(() => app.admin.weeklyState().randomStudent)).toMatch(/^s0[01]$/);
  await page.locator('#weekly-draw-reset').click();
  await page.locator('#weekly-draw').click();
  await page.getByLabel('Lớp phụ trách', { exact: true }).selectOption({ label: 'Lớp 4/2' });
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => app.admin.weeklyState().randomStudent)).toBe('');
});

test('Xóa tuần cần xác nhận, lỗi giữ tuần và xóa thành công chỉ ảnh hưởng tuần đó', async ({ page }) => {
  await setup(page);
  await page.getByLabel('Lớp phụ trách', { exact: true }).selectOption({ label: 'Lớp 4/1' });
  await page.locator('[data-weekly-tab=standings]').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('[data-weekly-delete=w0]').click();
  await expect(page.locator('[data-weekly-select=w0]')).toHaveCount(1);
  await page.evaluate(() => {
    const original = app.classroom.deleteWeek.bind(app.classroom); let fail = true;
    app.classroom.deleteWeek = record => { if (fail) { fail = false; throw new Error('Chưa thể đồng bộ'); } return original(record); };
  });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-weekly-delete=w0]').click();
  await expect(page.locator('.weekly-status')).toContainText('Chưa thể đồng bộ');
  await expect(page.locator('[data-weekly-select=w0]')).toHaveCount(1);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-weekly-delete=w0]').click();
  await expect(page.locator('[data-weekly-select=w0]')).toHaveCount(0);
  expect(await page.evaluate(() => app.classroom.weeks.map(week => week.id))).toEqual(['w1']);
});
