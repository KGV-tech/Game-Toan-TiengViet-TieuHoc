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

test('Form nhiệm vụ dùng danh sách chính xác cho cấp lớp, lớp và học sinh', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineAdmin(page);

  await page.evaluate(() => {
    app.data.users = [
      { username: 'an', fullname: 'Nguyễn Minh An', role: 'student', approved: true, classlevel: '4', class_name: '4/1' },
      { username: 'binh', fullname: 'Trần Gia Bình', role: 'student', approved: true, classlevel: '4', class_name: '4/2' },
      { username: 'vy', fullname: 'Bùi Cát Vy', role: 'student', approved: true, classlevel: '4', class_name: '4/2' },
      { username: 'nam5', fullname: 'Lê Minh Nam', role: 'student', approved: true, classlevel: '5', class_name: '5/1' },
      { username: 'pending', fullname: 'Học sinh Chờ duyệt', role: 'student', approved: false, classlevel: '4', class_name: '4/3' },
      { username: 'admin', fullname: 'Quản trị viên', role: 'admin', approved: true, classlevel: '4' }
    ];
    app.data.quests = [];
    app.data.settings = {};
    app.admin.showAddQuestForm();
  });

  await expect(page.locator('#quest-target-classlevel')).toBeVisible();
  await expect(page.locator('#quest-start-at')).toHaveAttribute('type', 'datetime-local');
  await expect(page.locator('#quest-end-at')).toHaveAttribute('type', 'datetime-local');

  const classLevelOptions = await page.locator('#quest-target-classlevel option').evaluateAll(options => options.map(option => ({ value: option.value, label: option.textContent.trim() })));
  expect(classLevelOptions).toEqual([
    { value: '', label: 'Tất cả cấp lớp' },
    { value: '1', label: 'Cấp lớp 1' },
    { value: '2', label: 'Cấp lớp 2' },
    { value: '3', label: 'Cấp lớp 3' },
    { value: '4', label: 'Cấp lớp 4' },
    { value: '5', label: 'Cấp lớp 5' }
  ]);

  await page.locator('#quest-target-classlevel').selectOption('2');
  await page.locator('#quest-assign-type').selectOption('class');
  await expect(page.locator('#quest-assign-target')).toBeDisabled();
  await expect(page.locator('#quest-assign-target option')).toHaveText('Chưa có lớp cụ thể để chọn');

  await page.locator('#quest-target-classlevel').selectOption('4');
  expect(await page.locator('#quest-assign-target').evaluate(element => element.tagName)).toBe('SELECT');
  await expect(page.locator('#quest-assign-target')).toBeEnabled();
  await page.locator('#quest-assign-type').selectOption('class');
  const classOptions = await page.locator('#quest-assign-target option').evaluateAll(options => options.map(option => ({ value: option.value, label: option.textContent.trim() })));
  expect(classOptions).toEqual([
    { value: '', label: 'Chọn lớp cụ thể' },
    { value: '4/1', label: 'Lớp 4/1 · 1 học sinh' },
    { value: '4/2', label: 'Lớp 4/2 · 2 học sinh' }
  ]);

  await page.locator('#quest-assign-type').selectOption('user');
  const studentOptions = await page.locator('#quest-assign-target option').evaluateAll(options => options.map(option => ({ value: option.value, label: option.textContent.trim() })));
  expect(studentOptions.map(option => option.value)).toEqual(['', 'an', 'binh', 'vy']);
  expect(studentOptions.map(option => option.label)).toEqual([
    'Chọn học sinh',
    'Nguyễn Minh An · @an · Lớp 4/1',
    'Trần Gia Bình · @binh · Lớp 4/2',
    'Bùi Cát Vy · @vy · Lớp 4/2'
  ]);

  await page.locator('#quest-title').fill('Hoàn thành tuần học');
  await page.locator('#quest-start-at').fill('2026-09-15T08:00');
  await page.locator('#quest-end-at').fill('2026-09-30T17:00');
  await page.locator('#quest-assign-target').selectOption('an');
  await page.evaluate(() => app.admin.submitQuest());
  await expect(page.locator('.personal-quest-card__schedule')).toContainText('Cấp lớp 4');
  await expect(page.locator('.personal-quest-card__schedule')).toContainText('→');

  await expect.poll(() => page.evaluate(() => {
    const quest = app.data.quests.at(-1);
    return quest ? {
      title: quest.title,
      target_classlevel: quest.target_classlevel,
      assign_type: quest.assign_type,
      assign_target: quest.assign_target,
      start_at: quest.start_at,
      end_at: quest.end_at
    } : null;
  })).toMatchObject({
    title: 'Hoàn thành tuần học',
    target_classlevel: '4',
    assign_type: 'user',
    assign_target: 'an'
  });
  const savedSchedule = await page.evaluate(() => {
    const quest = app.data.quests.at(-1);
    return { start: Date.parse(quest.start_at), end: Date.parse(quest.end_at) };
  });
  expect(Number.isFinite(savedSchedule.start)).toBe(true);
  expect(Number.isFinite(savedSchedule.end)).toBe(true);
  expect(savedSchedule.end).toBeGreaterThan(savedSchedule.start);
  const hydrated = await page.evaluate(() => {
    const saved = app.data.quests.at(-1);
    const copy = { id: saved.id };
    app.data.hydrateQuestCurriculum([copy]);
    return copy;
  });
  expect(hydrated).toMatchObject({ target_classlevel: '4' });
  expect(Date.parse(hydrated.start_at)).toBe(savedSchedule.start);
  expect(Date.parse(hydrated.end_at)).toBe(savedSchedule.end);

  const availability = await page.evaluate(() => {
    const now = Date.parse('2026-09-20T12:00:00Z');
    const base = { is_active: true, target_classlevel: '4', start_at: '2026-09-20T08:00:00Z', end_at: '2026-09-21T17:00:00Z' };
    const sameSectionStudent = { username: 'other', classlevel: '4', class_name: '4/2' };
    const differentSectionStudent = { username: 'another', classlevel: '4', class_name: '4/1' };
    return {
      exactClass: app.quest.isQuestAvailableForUser({ ...base, assign_type: 'class', assign_target: '4/2' }, sameSectionStudent, now),
      differentClass: app.quest.isQuestAvailableForUser({ ...base, assign_type: 'class', assign_target: '4/2' }, differentSectionStudent, now),
      future: app.quest.isQuestAvailableForUser({ ...base, start_at: '2026-09-21T08:00:00Z', assign_type: 'class', assign_target: '4/2' }, sameSectionStudent, now),
      expired: app.quest.isQuestAvailableForUser({ ...base, end_at: '2026-09-20T11:00:00Z', assign_type: 'class', assign_target: '4/2' }, sameSectionStudent, now),
      legacyGrade: app.quest.isQuestAvailableForUser({ ...base, assign_type: 'class', assign_target: '4' }, sameSectionStudent, now)
    };
  });
  expect(availability).toEqual({ exactClass: true, differentClass: false, future: false, expired: false, legacyGrade: true });

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
  const firstStudentCard = page.locator('.admin-student-card').first();
  await expect(firstStudentCard.locator('.admin-student-card__identity > span')).toHaveCount(0);
  await expect(firstStudentCard.locator('.admin-student-card__meta span')).toHaveText(['Giới tính', 'Tên đăng nhập']);
  await expect(firstStudentCard.locator('.admin-student-card__meta strong')).toHaveText(['Nữ', 'nguyen-alpha']);
  const desktopColumnCount = await page.locator('.admin-student-grid').evaluate(grid =>
    getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length
  );
  expect(desktopColumnCount).toBe(5);
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

test('Thẻ học sinh hiển thị họ tên đầy đủ và trạng thái không che tên', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineAdmin(page);
  const fullName = 'Lê Nguyễn Phương Anh Trần Minh';

  await page.evaluate(name => {
    app.data.users = [{
      username: 'phuonganh', fullname: name, role: 'student', approved: true,
      classlevel: '4', class_name: '4/4', gender: 'female', avatar_key: 'girl-long'
    }];
    app.admin.renderPlayersList(false);
  }, fullName);

  const card = page.locator('.admin-student-card').first();
  await expect(card.locator('.admin-student-card__identity h4')).toHaveText(fullName);
  await expect(card.locator('.admin-student-card__identity')).not.toContainText('Học sinh');
  await expect(card.locator('.admin-student-card__class-label')).toHaveText('Lớp 4/4');
  await expect(card.locator('.admin-student-card__status')).toHaveText('Đã duyệt');

  const layout = await card.evaluate(element => {
    const name = element.querySelector('.admin-student-card__identity h4');
    const status = element.querySelector('.admin-student-card__status');
    const avatar = element.querySelector('.admin-student-card__avatar-shell');
    const nameStyle = getComputedStyle(name);
    const nameRect = name.getBoundingClientRect();
    const statusRect = status.getBoundingClientRect();
    return {
      textOverflow: nameStyle.textOverflow,
      whiteSpace: nameStyle.whiteSpace,
      nameFits: name.scrollWidth <= name.clientWidth + 1,
      nameWidth: nameRect.width,
      avatarWidth: avatar.getBoundingClientRect().width,
      statusAboveName: statusRect.bottom <= nameRect.top + 1
    };
  });
  expect(layout.textOverflow).not.toBe('ellipsis');
  expect(layout.whiteSpace).toBe('normal');
  expect(layout.nameFits).toBe(true);
  expect(layout.nameWidth).toBeGreaterThan(layout.avatarWidth * 2);
  expect(layout.statusAboveName).toBe(true);
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Bộ lọc roster giữ empty state, chờ duyệt và tương tác accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { consoleErrors, supabaseRequests } = await openOfflineAdmin(page);

  await page.evaluate(() => {
    app.data.users = [
      { username: 'echo-student', fullname: 'Lê Ngọc Echo', role: 'student', approved: true, classlevel: '4', class_name: '', gender: 'female' },
      { username: 'delta-student', fullname: 'Võ Quang Delta', role: 'student', approved: true, classlevel: '4', class_name: '4/2', gender: 'male' },
      { username: 'pending-student', fullname: 'Trần Minh Pending', role: 'student', approved: false, classlevel: '5', class_name: '', gender: 'male' }
    ];
    app.admin.renderPlayersList(false);
  });

  const search = page.locator('#admin-roster-filter-search');
  await search.fill('LE NGOC');
  await expect(search).toBeFocused();
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('.admin-student-card h4')).toHaveText('Lê Ngọc Echo');

  await search.fill('khong-co-ho-so');
  await expect(page.locator('.admin-student-card')).toHaveCount(0);
  await expect(page.locator('.admin-roster-empty')).toContainText('Không có hồ sơ khớp bộ lọc');
  await page.locator('#admin-roster-filter-reset').click();
  await expect(page.locator('.admin-student-card')).toHaveCount(2);

  await page.locator('#admin-roster-filter-section').selectOption('__unassigned__');
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('.admin-student-card__class-label')).toHaveText('Cấp lớp 4');

  await page.locator('#btn-sub-pending').click();
  await page.locator('#admin-roster-filter-reset').click();
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await page.locator('#admin-roster-filter-gender').selectOption('male');
  await expect(page.locator('.admin-student-card')).toHaveCount(1);
  await expect(page.locator('.admin-student-card__actions button')).toHaveText(['Duyệt', 'Xóa']);

  const reducedMotion = await page.locator('.admin-student-card').evaluate(card => ({
    transitionDuration: getComputedStyle(card).transitionDuration,
    animationName: getComputedStyle(card).animationName
  }));
  expect(reducedMotion.transitionDuration).toBe('0s');
  expect(reducedMotion.animationName).toBe('none');
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
