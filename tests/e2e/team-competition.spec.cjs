const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  expect(consoleErrors).toEqual([]);
}

function demoUsers() {
  return [
    { username: 'hs1', fullname: 'Học sinh 1', classlevel: '5', class_name: '5A', role: 'student', approved: true },
    { username: 'hs2', fullname: 'Học sinh 2', classlevel: '5', class_name: '5A', role: 'student', approved: true },
    { username: 'hs3', fullname: 'Học sinh 3', classlevel: '5', class_name: '5B', role: 'student', approved: true },
    { username: 'hs4', fullname: 'Học sinh 4', classlevel: '5', class_name: '5B', role: 'student', approved: true }
  ];
}

function demoExam(id = 'exam-team') {
  return {
    id,
    name: 'Đề thi đua Toán',
    classlevel: '5',
    subject: 'Toán',
    period: 'Học kỳ 1',
    questions: [
      { q: '1 + 1 = ?', type: 'Trắc nghiệm', options: ['2', '3'], ans: '2' },
      { q: '2 + 2 = ?', type: 'Trắc nghiệm', options: ['4', '5'], ans: '4' }
    ]
  };
}

test('Admin tạo Nhóm, chuẩn bị và bắt đầu bảng thi đua', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openOfflineHomepage(page);
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    app.teamCompetition.store.clear();
    app.admin.openAdmin();
    app.admin.switchTab('quests');
    app.admin.switchQuestMode('team');
  }, { users: demoUsers(), exam: demoExam() });

  await expect(page.getByRole('tab', { name: 'Cá nhân' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Nhóm' })).toBeVisible();
  await page.getByRole('button', { name: '+ Tạo trận mới' }).click();
  await page.locator('#team-comp-name').fill('Trận Toán khởi động');
  await page.locator('#team-comp-common-exam').selectOption('exam-team');
  await page.locator('.team-target-count').nth(0).fill('3');
  await page.locator('.team-target-count').nth(0).press('Tab');
  await page.locator('.team-member-slot-select').nth(0).selectOption('hs1');
  await page.locator('.team-member-slot-select').nth(1).selectOption('hs2');
  await page.locator('.team-member-slot-select').nth(2).selectOption('hs3');
  await page.locator('.team-target-count').nth(1).fill('1');
  await page.locator('.team-target-count').nth(1).press('Tab');
  await page.locator('.team-config-card').nth(1).locator('.team-member-slot-select').selectOption('hs4');
  await page.locator('.team-leader-select').nth(0).selectOption('hs1');
  await page.locator('.team-leader-select').nth(1).selectOption('hs4');
  await page.locator('.team-config-card').nth(0).getByRole('button', { name: 'Lưu' }).click();
  await page.locator('.team-config-card').nth(1).getByRole('button', { name: 'Lưu' }).click();
  await page.getByRole('button', { name: 'Đã chuẩn bị' }).click();

  await expect(page.locator('.team-competition-board')).toBeVisible();
  await expect(page.locator('.team-board-card')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Bắt đầu thi đua' })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Bắt đầu thi đua' }).click();
  await expect(page.locator('.team-status-pill--active')).toBeVisible();
  await expect(page.locator('.team-board-card').first()).toContainText('0/2 câu đã nộp');
});

test('Admin có thể lọc danh sách nhóm thi đua theo lớp con trong cùng cấp lớp', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openOfflineHomepage(page);
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    app.teamCompetition.store.clear();
    app.admin.openAdmin();
    app.admin.switchTab('quests');
    app.admin.switchQuestMode('team');
    app.admin.showAddTeamCompetitionForm();
  }, { users: demoUsers(), exam: demoExam() });

  await page.locator('#team-comp-class-name').selectOption('5A');
  await page.locator('.team-target-count').first().fill('1');
  await page.locator('.team-target-count').first().press('Tab');
  await expect(page.locator('.team-member-slot-select').first()).toContainText('Học sinh 1 · 5A');
  await expect(page.locator('.team-member-slot-select').first()).toContainText('Học sinh 2 · 5A');
  await expect(page.locator('.team-member-slot-select').first()).not.toContainText('Học sinh 3 · 5B');
  await expect(page.locator('.team-member-slot-select').first()).not.toContainText('Học sinh 4 · 5B');
});

test('Danh sách thành viên Nhóm được sắp theo tên, đệm từ phải sang trái rồi họ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openOfflineHomepage(page);
  const users = [
    { username: 'lephuc', fullname: 'Lê Minh Phúc', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
    { username: 'nguyenphuc', fullname: 'Nguyễn Hoàng Minh Phúc', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
    { username: 'an', fullname: 'Trần Bảo An', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
    { username: 'phamphuc', fullname: 'Phạm Anh Phúc', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
    { username: 'nguyenanphuc', fullname: 'Nguyễn An Minh Phúc', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
    { username: 'lehoangphuc', fullname: 'Lê Hoàng Minh Phúc', classlevel: '4', class_name: '4/4', role: 'student', approved: true },
    { username: 'binh', fullname: 'Võ Minh Bình', classlevel: '4', class_name: '4/4', role: 'student', approved: true }
  ];
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    app.teamCompetition.store.clear();
    app.admin.openAdmin();
    app.admin.switchTab('quests');
    app.admin.switchQuestMode('team');
    app.admin.showAddTeamCompetitionForm();
  }, { users, exam: demoExam() });

  await page.locator('#team-comp-class').selectOption('4');
  await page.locator('#team-comp-class-name').selectOption('4/4');
  await page.locator('.team-target-count').first().fill('1');
  await page.locator('.team-target-count').first().press('Tab');
  await expect.poll(() => page.locator('.team-member-slot-select').first().locator('option').allTextContents()).toEqual([
    '-- Chọn học sinh --',
    'Trần Bảo An · 4/4 (an)',
    'Võ Minh Bình · 4/4 (binh)',
    'Phạm Anh Phúc · 4/4 (phamphuc)',
    'Lê Minh Phúc · 4/4 (lephuc)',
    'Nguyễn An Minh Phúc · 4/4 (nguyenanphuc)',
    'Lê Hoàng Minh Phúc · 4/4 (lehoangphuc)',
    'Nguyễn Hoàng Minh Phúc · 4/4 (nguyenphuc)'
  ]);
});

test('trưởng nhóm lưu từng câu và OK khi rời sẽ khóa lượt, Hủy thì ở lại', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openOfflineHomepage(page);
  const matchId = await page.evaluate(({ users, exam }) => {
    app.data.users = users;
    app.data.exams = [exam];
    app.data.currentUser = { ...users[0] };
    const match = app.teamCompetition.normalizeCompetition({
      id: 'match-leader-test', name: 'Trận tablet', classlevel: '5', teamCount: 2,
      participantMode: 'manual', questionMode: 'same', commonExamId: exam.id, timeLimitMinutes: null,
      status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
        { id: 'team-a', name: 'Nhóm A', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1' },
        { id: 'team-b', name: 'Nhóm B', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    app.teamCompetition.openLeaderAttempt(match.id);
    return match.id;
  }, { users: demoUsers(), exam: demoExam() });

  await expect(page.locator('#team-competition-play-screen')).toHaveClass(/active/);
  await page.locator('input[name="exam_q_0"][value="2"]').check();
  await page.getByRole('button', { name: 'Nộp câu trả lời' }).click();
  await expect(page.locator('#team-play-progress')).toHaveText('Câu 2/2');

  await page.getByRole('button', { name: 'Thoát lượt' }).click();
  await expect(page.locator('#team-leave-confirm-modal')).toBeVisible();
  await expect(page.locator('.team-leave-confirm-actions button')).toHaveText(['OK', 'Hủy']);
  await page.getByRole('button', { name: 'Hủy' }).click();
  await expect(page.locator('#team-competition-play-screen')).toHaveClass(/active/);

  await page.getByRole('button', { name: 'Thoát lượt' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect.poll(() => page.evaluate(id => app.teamCompetition.attemptStore.get(id, 'team-a'), matchId)).toMatchObject({ status: 'locked', submittedCount: 1, score: 5 });
  await expect(page.locator('#map-screen')).toHaveClass(/active/);
});

test('Admin chọn ngẫu nhiên gần đều và hiển thị số thành viên từng nhóm', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openOfflineHomepage(page);
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    app.teamCompetition.store.clear();
    app.admin.openAdmin();
    app.admin.switchTab('quests');
    app.admin.switchQuestMode('team');
    app.admin.showAddTeamCompetitionForm();
  }, { users: demoUsers(), exam: demoExam() });

  await page.locator('#team-comp-mode').selectOption('random');
  await expect(page.locator('.team-member-slot-select').nth(0)).toBeDisabled();
  await expect.poll(() => page.locator('.team-member-slot-select').evaluateAll(selects => selects.map(select => select.value).filter(Boolean).length)).toEqual(4);
  await expect.poll(() => page.locator('.team-target-count').evaluateAll(inputs => inputs.map(input => input.value))).toEqual(['2', '2']);
  await expect(page.locator('.team-leader-select').nth(0)).not.toHaveValue('');
});

test('Admin lưu từng Nhóm, không trùng thành viên và chỉ chọn trưởng nhóm từ thành viên đã chọn', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openOfflineHomepage(page);
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    app.teamCompetition.store.clear();
    app.admin.openAdmin();
    app.admin.switchTab('quests');
    app.admin.switchQuestMode('team');
    app.admin.showAddTeamCompetitionForm();
  }, { users: demoUsers(), exam: demoExam() });

  const firstGroup = page.locator('.team-config-card').first();
  await firstGroup.locator('.team-target-count').fill('2');
  await firstGroup.locator('.team-target-count').press('Tab');
  await expect(firstGroup.locator('.team-member-slot-select')).toHaveCount(2);

  await firstGroup.locator('.team-member-slot-select').nth(0).selectOption('hs1');
  await firstGroup.locator('.team-member-slot-select').nth(1).selectOption('hs2');
  await expect(firstGroup.locator('.team-leader-select')).toContainText('Học sinh 1');
  await expect(firstGroup.locator('.team-leader-select')).not.toContainText('Học sinh 3');
  await firstGroup.locator('.team-leader-select').selectOption('hs2');
  await firstGroup.getByRole('button', { name: 'Lưu' }).click();

  await expect(firstGroup.getByRole('button', { name: 'Sửa' })).toBeVisible();
  await expect(page.locator('.team-membership-summary')).toContainText('Học sinh 1');
  await page.locator('.team-config-card').nth(1).locator('.team-target-count').fill('1');
  await page.locator('.team-config-card').nth(1).locator('.team-target-count').press('Tab');
  await expect(page.locator('.team-config-card').nth(1).locator('.team-member-slot-select').first()).not.toContainText('Học sinh 1');
  await expect(page.locator('.team-config-card').nth(1).locator('.team-member-slot-select').first()).not.toContainText('Học sinh 2');

  await firstGroup.getByRole('button', { name: 'Sửa' }).click();
  await expect(firstGroup.getByRole('button', { name: 'Cập nhật' })).toBeVisible();
  await expect(firstGroup.getByRole('button', { name: 'Hủy' })).toBeVisible();
});
