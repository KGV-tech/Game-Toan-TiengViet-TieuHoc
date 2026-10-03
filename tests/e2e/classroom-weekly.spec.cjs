const { test, expect } = require('@playwright/test');

async function setup(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'demo-teacher', role: 'admin' };
    app.data.users = [
      { username: 'a', fullname: 'Nguyễn An', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
      { username: 'b', fullname: 'Trần Bình', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
      { username: 'c', fullname: 'Lê Chi', classlevel: '5', class_name: '5/1', role: 'student', approved: true }
    ];
    app.admin.openAdmin('players');
  });
}

test('Bỏ Nhóm, chọn lớp trong form Tổ và lọc thành viên giữ nội dung', async ({ page }) => {
  await setup(page);
  await expect(page.getByRole('tab', { name: 'Nhóm', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Tổ', exact: true }).click();
  await page.locator('#btn-sub-add').click();
  await page.getByLabel('Lớp lập tổ', { exact: true }).selectOption({ label: 'Lớp 4/4' });
  await expect(page.locator('.admin-student-draft-members label')).toHaveCount(2);
  await page.getByLabel('Tên tổ', { exact: true }).fill('Tổ Mặt trời');
  await page.getByLabel('Nguyễn An', { exact: false }).check();
  await page.locator('#admin-roster-filter-search').fill('Bình');
  await expect(page.locator('.admin-student-draft-members label:visible')).toHaveCount(1);
  await expect(page.getByLabel('Tên tổ', { exact: true })).toHaveValue('Tổ Mặt trời');
});

test('Đổi cấp lớp bỏ lựa chọn tổ cũ, lọc đúng danh sách và thẻ Tổ', async ({ page }) => {
  await setup(page);
  await page.evaluate(async () => {
    await app.classroom.saveSection({ id: crypto.randomUUID(), name: 'Tổ Sao', classlevel: '4', className: '4/4', members: ['a'], version: 0 });
    app.admin.refreshStudentRosterView();
  });
  await page.getByLabel('Tổ (tùy chọn)', { exact: true }).selectOption({ label: 'Tổ Sao' });
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Tổ', exact: true }).click();
  await expect(page.locator('.admin-student-draft-card')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Cấp lớp', exact: true }).selectOption('5');
  await expect(page.getByLabel('Tổ (tùy chọn)', { exact: true })).toHaveValue('');
  await expect(page.locator('.admin-student-draft-card')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Danh sách học sinh' }).click();
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('.admin-student-card')).toContainText('Lê Chi');
});

test('Chọn lớp lập tổ thay bộ lọc lớp cũ và xóa thành viên khác lớp', async ({ page }) => {
  await setup(page);
  await page.locator('#admin-roster-filter-class').selectOption('4');
  await page.locator('#admin-roster-filter-section').selectOption('4/4');
  await page.getByRole('tab', { name: 'Tổ', exact: true }).click();
  await page.locator('#btn-sub-add').click();
  await page.getByLabel('Nguyễn An', { exact: false }).check();
  await page.locator('#student-draft-class').selectOption({ label: 'Lớp 5/1' });
  await expect(page.locator('.admin-student-draft-members label:visible')).toHaveCount(1);
  await expect(page.locator('.admin-student-draft-members')).toContainText('Lê Chi');
  await expect(page.locator('#admin-roster-filter-class')).toHaveValue('5');
  await expect(page.locator('#student-draft-selection')).toContainText('0 học sinh đã chọn');
});

test('Tải Supabase chậm không xóa form tuần; gửi lại dùng một ID trận', async ({ page }) => {
  await setup(page);
  await page.evaluate(() => {
    let finish;
    const loading = new Promise(resolve => { finish = resolve; });
    window.finishClassroomLoading = finish;
    window.weekRequests = [];
    app.classroom.configure({
      from() { return { select() { return { order() { return { range: () => loading }; } }; } }; },
      async rpc(name, args) { window.weekRequests.push(args.p_week); return { error: { message: 'connection_lost' } }; }
    });
  });
  await weekly(page);
  await page.locator('[data-weekly-tab=standings]').click();
  await page.locator('#weekly-manager-create').click();
  await page.getByLabel('Tên thi đua tuần', { exact: true }).fill('Tuần đang soạn');
  await page.evaluate(() => window.finishClassroomLoading({ data: [] }));
  await expect(page.locator('#weekly-name')).toHaveValue('Tuần đang soạn');
  await page.getByLabel('Thi đua theo Nhóm', { exact: true }).check();
  await page.locator('#weekly-form [type=submit]').click();
  await expect(page.locator('#weekly-form-error')).toContainText('Chưa thể đồng bộ');
  await page.locator('#weekly-form [type=submit]').click();
  const requests = await page.evaluate(() => window.weekRequests);
  expect(requests).toHaveLength(2);
  expect(requests[0].id).toBe(requests[1].id);
  expect(requests[0].teams).toEqual(requests[1].teams);
});

async function weekly(page) {
  await page.evaluate(() => app.admin.openAdmin('quests'));
  await page.locator('[data-quest-launch=weekly]').click();
}
async function createWeek(page, name) {
  await page.locator('[data-weekly-tab=standings]').click();
  await page.locator('#weekly-manager-create').click();
  await page.getByLabel('Tên thi đua tuần', { exact: true }).fill(name);
  await page.getByLabel('Lớp thi đua', { exact: true }).selectOption({ label: 'Lớp 4/4' });
  await page.locator('#weekly-form [type=submit]').click();
  await expect(page.locator('#weekly-select')).toHaveText(new RegExp(name));
}

test('Ba tab tuần, điểm từng trận độc lập, giữ điểm game và loại học sinh vắng khi random', async ({ page }) => {
  await setup(page);
  const initial = await page.evaluate(() => JSON.stringify(app.data.users));
  await weekly(page);
  await createWeek(page, 'Tuần Mặt trời');
  const first = await page.locator('#weekly-select').inputValue();
  await page.locator('[data-weekly-tab=points]').click();
  await expect(page.locator('[data-weekly-student]')).toHaveCount(2);
  await page.locator('[data-weekly-student=a]').click();
  await page.locator('#weekly-point-add').click();
  await expect(page.locator('[data-weekly-student=a] .weekly-point-value')).toContainText('1');
  await page.locator('[data-weekly-student=b]').click();
  await page.locator('.weekly-point-adjust summary').click();
  await page.locator('[data-absence]').click();
  await page.locator('[data-weekly-tab=random]').click();
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-random-result')).toHaveText('Nguyễn An', {timeout:8000});
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-random-result')).toContainText('Không còn lựa chọn');
  await createWeek(page, 'Tuần Cầu vồng');
  await page.locator('[data-weekly-tab=points]').click();
  await expect(page.locator('[data-weekly-student=a] .weekly-point-value')).toContainText('0');
  await page.locator('#weekly-select').selectOption(first);
  await expect(page.locator('[data-weekly-student=a] .weekly-point-value')).toContainText('1');
  expect(await page.evaluate(() => JSON.stringify(app.data.users))).toBe(initial);
  await page.reload();
  await page.evaluate(() => { app.data.currentUser = { username: 'demo-teacher', role: 'admin' }; app.admin.openAdmin('quests'); });
  await page.locator('[data-quest-launch=weekly]').click();
  await page.locator('#weekly-select').selectOption(first);
  await expect(page.locator('[data-weekly-student=a] .weekly-point-value')).toContainText('1');
});

for (const [width, height] of [[1280, 720], [1440, 900], [1024, 768]]) {
  test(`Gradient, lưới chọn thành viên và khung tuần ở ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await setup(page);
    await page.evaluate(() => {
      app.data.users = Array.from({ length: 32 }, (_, index) => ({ username: `demo-${index}`, fullname: `Học sinh minh họa ${index + 1}`, classlevel: '4', class_name: '4/4', role: 'student', approved: true }));
      app.admin.renderPlayersList(false);
    });
    await page.getByRole('tab', { name: 'Tổ', exact: true }).click();
    await page.locator('#btn-sub-add').click();
    expect(await page.locator('.admin-student-draft-members').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(width > 1250 ? 4 : 3);
    await page.screenshot({ path: `test-results/ui-review/classroom-form-${width}.png` });
    await page.getByLabel('Tên tổ', { exact: true }).fill('Tổ Sao tím');
    await page.locator('[name=draft-member]').first().check();
    await page.locator('[name=draft-member]').nth(1).check();
    await page.locator('.admin-student-draft-form [type=submit]').click();
    expect(await page.locator('.classroom-team-card').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
    await page.screenshot({ path: `test-results/ui-review/classroom-cards-${width}.png` });
    await weekly(page);
    await createWeek(page, 'Tuần Sao tím');
    await page.screenshot({ path: `test-results/ui-review/weekly-standings-${width}.png` });
    await page.locator('[data-weekly-tab=points]').click();
    await page.screenshot({ path: `test-results/ui-review/weekly-points-${width}.png` });
    for (const selector of ['.admin-panel', '#treasure-content-area', '.weekly-workspace']) {
      expect(await page.locator(selector).evaluate(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    await page.locator('[data-weekly-tab=random]').click();
    await page.screenshot({ path: `test-results/ui-review/weekly-random-${width}.png` });
    expect(errors).toEqual([]);
  });
}
