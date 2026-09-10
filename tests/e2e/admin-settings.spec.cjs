const { test, expect } = require('@playwright/test');

async function openOfflineAdmin(page) {
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
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin', classlevel: '4' };
    app.data.users = [
      { username: 'an', fullname: 'Nguyễn Minh An', role: 'student', approved: true, classlevel: '4', class_name: '4/1', gender: 'female' },
      { username: 'binh', fullname: 'Trần Gia Bình', role: 'student', approved: false, classlevel: '4', class_name: '4/2', gender: 'male' },
      { username: 'admin', fullname: 'Quản trị viên', role: 'admin', approved: true, classlevel: '4' }
    ];
    app.data.quests = [
      {
        id: 'quest-ui-1', title: 'Ôn tập Bài 1', target_subject: 'math', target_score: 80, target_count: 3,
        reward_stars: 20, assign_type: 'class', assign_target: '4/1', is_active: true,
        curriculum: { classlevel: 'Lớp 4', semester: 'Học kỳ 1', topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01' }
      },
      {
        id: 'quest-ui-2', title: 'Luyện tập cuối tuần', target_subject: 'any', target_score: 70, target_count: 1,
        reward_stars: 10, assign_type: 'all', assign_target: '', is_active: false
      }
    ];
    app.data.exams = [];
    app.data.settings = { hardTimeLimit: 12, examTimeLimit: 45 };
    app.admin.openAdmin();
  });
  return { consoleErrors, supabaseRequests };
}

test('Các tab quản trị còn lại dùng workspace trực quan và không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineAdmin(page);

  await expect(page.locator('.admin-roster-workspace')).toBeVisible();
  await expect(page.locator('.admin-roster-stat')).toHaveCount(3);
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('#admin-subcontent-area')).toContainText('Nguyễn Minh An');

  await page.locator('#btn-sub-pending').click();
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('#admin-subcontent-area')).toContainText('Trần Gia Bình');
  await page.locator('#btn-sub-add').click();
  await expect(page.locator('.admin-student-form')).toBeVisible();
  await expect(page.locator('#add-fullname')).toBeVisible();
  await expect(page.locator('#add-class')).toHaveValue('5');

  await page.evaluate(() => app.admin.switchTab('settings'));
  await expect(page.locator('.settings-workspace')).toBeVisible();
  await expect(page.locator('#setting-hard-time')).toHaveValue('12');
  await expect(page.locator('#setting-exam-time')).toHaveValue('45');
  await expect(page.locator('#settings-save-button')).toBeVisible();

  await page.evaluate(() => app.admin.switchTab('quests'));
  await page.evaluate(() => app.admin.switchQuestMode('personal'));
  await expect(page.locator('.personal-quest-workspace')).toBeVisible();
  await expect(page.locator('.personal-quest-card')).toHaveCount(2);
  await expect(page.locator('.personal-quest-card--paused')).toHaveCount(1);
  await page.locator('#btn-personal-quest-create').click();
  await expect(page.locator('.quest-form-workspace')).toBeVisible();
  await expect(page.locator('#quest-title')).toBeVisible();
  await expect(page.locator('#quest-curriculum-fields')).toBeHidden();
  await page.locator('#quest-assign-type').selectOption('class');
  await expect(page.locator('#quest-assign-target-field')).toBeVisible();
  await expect(page.locator('#quest-assign-target')).toBeVisible();
  await page.locator('#quest-assign-type').selectOption('all');
  await expect(page.locator('#quest-assign-target-field')).toBeHidden();

  await page.setViewportSize({ width: 1024, height: 768 });
  const responsiveState = await page.locator('#treasure-modal').evaluate(modal => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    formColumns: getComputedStyle(modal.querySelector('.quest-form-grid')).gridTemplateColumns.split(' ').length
  }));
  expect(responsiveState.overflow).toBe(false);
  expect(responsiveState.formColumns).toBe(2);

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Workspace học sinh và Điều chỉnh có trạng thái keyboard focus rõ ràng trên tablet ngang', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const { consoleErrors, supabaseRequests } = await openOfflineAdmin(page);

  await page.locator('#btn-sub-add').focus();
  await expect(page.locator('#btn-sub-add')).toBeFocused();
  const rosterState = await page.locator('.admin-roster-workspace').evaluate(workspace => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    cards: workspace.querySelectorAll('.admin-student-card').length
  }));
  expect(rosterState.overflow).toBe(false);
  expect(rosterState.cards).toBe(1);

  await page.evaluate(() => app.admin.switchTab('settings'));
  await page.locator('#setting-hard-time').focus();
  await expect(page.locator('#setting-hard-time')).toBeFocused();
  const settingsState = await page.locator('.settings-workspace').evaluate(workspace => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    fieldCount: workspace.querySelectorAll('.settings-field').length
  }));
  expect(settingsState.overflow).toBe(false);
  expect(settingsState.fieldCount).toBe(2);

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Danh sách học sinh khôi phục bộ lọc, thẻ hồ sơ và thứ tự tên tiếng Việt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineAdmin(page);

  await page.evaluate(() => {
    app.data.users = [
      { username: 'nguyen-alpha', fullname: 'Nguyễn Minh Alpha', role: 'student', approved: true, classlevel: '4', class_name: '', gender: 'female', stars: 0, avatar_key: 'girl-long' },
      { username: 'tran-alpha', fullname: 'Trần Quang Alpha', role: 'student', approved: true, classlevel: '4', class_name: '', gender: 'male', stars: 8, avatar_key: 'boy-reader' },
      { username: 'bui-alpha', fullname: 'Bùi Cát Vy Alpha', role: 'student', approved: true, classlevel: '4', class_name: '4/4', gender: 'female', stars: 18, avatar_key: 'girl-inventor' },
      { username: 'pham-beta', fullname: 'Phạm Ngọc Minh Beta', role: 'student', approved: true, classlevel: '5', class_name: '5/1', gender: 'female', stars: 33, avatar_key: 'girl-artist' }
    ];
    app.admin.renderPlayersList(false);
  });

  await expect(page.locator('.admin-roster-filter-panel')).toBeVisible();
  await expect(page.locator('.admin-student-card')).toHaveCount(4);
  await expect(page.locator('.admin-student-card h4')).toHaveText([
    'Nguyễn Minh Alpha',
    'Trần Quang Alpha',
    'Bùi Cát Vy Alpha',
    'Phạm Ngọc Minh Beta'
  ]);
  await expect(page.locator('.admin-student-card').nth(0).locator('.admin-student-card__class-label')).toHaveText('Cấp lớp 4');
  await expect(page.locator('.admin-student-card').nth(2).locator('.admin-student-card__class-label')).toHaveText('Lớp 4/4');
  await expect(page.locator('.admin-student-card').nth(2)).toContainText('Danh hiệu: Học Trò Xuất Sắc');
  await expect(page.locator('.admin-student-card').nth(2).locator('.admin-student-card__avatar')).toHaveAttribute('role', 'img');
  await expect(page.locator('.admin-student-card').nth(2).locator('.admin-student-card__actions button')).toHaveText(['Sửa', 'Xóa']);

  await page.locator('#admin-roster-filter-class').selectOption('4');
  await expect(page.locator('.admin-student-card')).toHaveCount(3);
  await page.locator('#admin-roster-filter-section').selectOption('4/4');
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('.admin-student-card__class-label')).toHaveText('Lớp 4/4');
  await page.locator('#admin-roster-filter-reset').click();
  await expect(page.locator('.admin-student-card')).toHaveCount(4);
  await page.locator('#admin-roster-filter-gender').selectOption('female');
  await expect(page.locator('.admin-student-card')).toHaveCount(3);
  await page.locator('#admin-roster-filter-reset').click();
  await expect(page.locator('.admin-student-card')).toHaveCount(4);
  await page.locator('#admin-roster-filter-search').fill('Beta');
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('.admin-student-card h4')).toHaveText('Phạm Ngọc Minh Beta');

  const teamOrder = await page.evaluate(() => {
    app.data.users = app.data.users.filter(user => user.classlevel === '4');
    return app.admin.getTeamCompetitionStudents('4').map(user => user.fullname);
  });
  expect(teamOrder).toEqual(['Nguyễn Minh Alpha', 'Trần Quang Alpha', 'Bùi Cát Vy Alpha']);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'student', fullname: 'Học sinh', role: 'student', classlevel: '4', class_name: '4/4' };
    app.auth.updateHeader();
  });
  await expect(page.locator('#player-info')).toContainText('Lớp 4/4');
  await expect(page.locator('#player-info')).not.toContainText('Cấp lớp 4');

  await page.evaluate(() => {
    app.data.currentUser.class_name = '';
    app.auth.updateHeader();
  });
  await expect(page.locator('#player-info')).toContainText('Cấp lớp 4');
  await expect(page.locator('#player-info')).not.toContainText('Lớp 4 ·');

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
