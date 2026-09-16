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
  await expect(page.locator('.team-dashboard-hero')).toBeVisible();
  await expect(page.locator('.team-dashboard-stat')).toHaveCount(4);
  await expect(page.locator('.team-competition-list-heading')).toContainText('Các trận thi đua');
  await page.getByRole('button', { name: '+ Tạo trận mới' }).click();
  await expect(page.locator('.team-form-hero')).toBeVisible();
  await expect(page.locator('.team-form-step')).toHaveCount(3);
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
  await expect(page.locator('#treasure-modal')).toHaveClass(/team-board-fullscreen/);
  await expect(page.locator('.team-status-pill--prepared')).toBeVisible();
  await expect(page.locator('.team-board-hero')).toBeVisible();
  await expect(page.locator('.team-board-summary')).toBeVisible();
  await expect(page.locator('.team-board-card')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Bắt đầu thi đua' })).toBeVisible();
  const startDialogs = [];
  page.on('dialog', async dialog => {
    startDialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Bắt đầu thi đua' }).click();
  await expect(page.locator('.team-status-pill--active')).toBeVisible();
  await expect(page.locator('#treasure-modal')).toHaveClass(/team-board-fullscreen/);
  expect(startDialogs).toEqual([]);
  await expect(page.locator('.team-race-stadium')).toBeVisible();
  await expect(page.locator('.team-race-scoreboard')).toBeVisible();
  await expect(page.locator('.team-race-lane')).toHaveCount(2);
  await expect(page.locator('.team-race-lane__vehicle')).toHaveCount(2);
  await expect(page.locator('.team-race-lane__track-tick')).toHaveCount(20);
  await expect(page.locator('.team-race-lane').first()).toContainText('0/10 điểm');
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
  test(`bảng trình chiếu đường đua vừa khung ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openOfflineHomepage(page);
    await page.evaluate(({ users, exam }) => {
      app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
      app.data.users = users;
      app.data.exams = [exam];
      const match = app.teamCompetition.normalizeCompetition({
        id: `presentation-${window.innerWidth}`, name: 'Đấu trường tri thức', classlevel: '5', teamCount: 2,
        participantMode: 'manual', questionMode: 'same', commonExamId: exam.id, status: app.teamCompetition.STATUS.ACTIVE,
        startedAt: Date.now(), teams: [
          { id: 'team-a', name: 'Đội Biển Xanh', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1', score: 7.5, submittedCount: 2, status: 'active' },
          { id: 'team-b', name: 'Đội Ánh Dương', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3', score: 9, submittedCount: 2, status: 'completed' }
        ]
      });
      app.teamCompetition.store.clear();
      app.teamCompetition.store.upsert(match);
      app.admin.openAdmin();
      app.admin.openTeamCompetitionBoard(match.id);
    }, { users: demoUsers(), exam: demoExam() });

    await expect(page.locator('.team-race-stadium')).toBeVisible();
    await expect(page.locator('.team-race-lane')).toHaveCount(2);
    expect(await page.locator('.team-race-lane__vehicle').first().evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(48);
    const dimensions = await page.locator('.team-competition-board').evaluate(node => ({
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight
    }));
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 2);
  });
}

test('mở form sau bảng trình chiếu vẫn cuộn được trong cửa sổ quản trị', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openOfflineHomepage(page);
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    const match = app.teamCompetition.normalizeCompetition({
      id: 'form-scroll-match', name: 'Trận cần soạn', classlevel: '5', teamCount: 2, participantMode: 'manual', questionMode: 'same', commonExamId: exam.id,
      status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
        { id: 'scroll-team-a', name: 'Nhóm A', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1' },
        { id: 'scroll-team-b', name: 'Nhóm B', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    app.admin.openAdmin();
    app.admin.openTeamCompetitionBoard(match.id);
    app.admin.showAddTeamCompetitionForm();
  }, { users: demoUsers(), exam: demoExam() });

  await expect(page.locator('.team-competition-form')).toBeVisible();
  await expect(page.locator('#treasure-modal')).not.toHaveClass(/team-board-fullscreen/);
  const scrollBox = page.locator('#treasure-content-area');
  expect(await scrollBox.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  await scrollBox.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await expect(page.getByRole('button', { name: 'Đã chuẩn bị' })).toBeVisible();
});

test('trận đã kết thúc có thể chơi lại bằng một bản nháp mới mà không mất kết quả cũ', async ({ page }) => {
  await openOfflineHomepage(page);
  const snapshot = await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    const ended = app.teamCompetition.normalizeCompetition({
      id: 'ended-replay-match', name: 'Trận đã xong', classlevel: '5', teamCount: 2, participantMode: 'manual', questionMode: 'same', commonExamId: exam.id,
      status: app.teamCompetition.STATUS.ENDED, endedAt: Date.now(), results: [{ username: 'hs1', teamId: 'replay-team-a', individualScore: 8, teamRank: 1 }], teams: [
        { id: 'replay-team-a', name: 'Nhóm A', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1', score: 8, submittedCount: 2, status: 'completed' },
        { id: 'replay-team-b', name: 'Nhóm B', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3', score: 5, submittedCount: 2, status: 'completed' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(ended);
    app.admin.openAdmin();
    app.admin.switchTab('quests');
    app.admin.switchQuestMode('team');
    return ended;
  }, { users: demoUsers(), exam: demoExam() });

  await page.getByRole('button', { name: 'Chơi lại' }).click();
  await expect(page.locator('.team-competition-form')).toBeVisible();
  const replayed = await page.evaluate(() => app.admin.teamCompetitionDraft);
  expect(replayed).toMatchObject({ status: 'draft', name: 'Trận đã xong · Lượt 2', results: [] });
  expect(replayed.id).not.toBe(snapshot.id);
  expect(replayed.teams.map(team => team.id)).not.toEqual(snapshot.teams.map(team => team.id));
  expect(replayed.teams.map(team => team.score)).toEqual([0, 0]);
  expect(replayed.teams.map(team => team.submittedCount)).toEqual([0, 0]);
  expect(await page.evaluate(id => app.teamCompetition.store.get(id), snapshot.id)).toMatchObject({ status: 'ended', results: snapshot.results });
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

  await expect(page.getByLabel('Danh sách học sinh không tham gia')).toBeVisible();
  await page.locator('#team-comp-mode').selectOption('random');
  await expect(page.locator('.team-member-slot-select').nth(0)).not.toBeDisabled();
  await expect.poll(() => page.locator('.team-member-slot-select').evaluateAll(selects => selects.map(select => select.value).filter(Boolean).length)).toEqual(4);
  await expect.poll(() => page.locator('.team-target-count').evaluateAll(inputs => inputs.map(input => input.value))).toEqual(['2', '2']);
  await expect(page.locator('.team-leader-select').nth(0)).not.toHaveValue('');

  const beforeSwap = await page.evaluate(() => app.admin.teamCompetitionDraft.teams.map(team => team.memberUsernames.slice()));
  const firstTeamStudent = beforeSwap[0][0];
  const secondTeamStudent = beforeSwap[1][0];
  await page.locator('.team-member-slot-select').nth(0).selectOption(secondTeamStudent);
  const expectedAfterSwap = [
    [secondTeamStudent, beforeSwap[0][1]],
    [firstTeamStudent, beforeSwap[1][1]]
  ];
  await expect.poll(() => page.evaluate(() => app.admin.teamCompetitionDraft.teams.map(team => team.memberUsernames))).toEqual(expectedAfterSwap);

  await page.locator('#team-comp-excluded-students').selectOption('hs4');
  await expect.poll(() => page.evaluate(() => app.admin.teamCompetitionDraft.excludedStudentUsernames)).toEqual(['hs4']);
  await expect.poll(() => page.evaluate(() => app.admin.teamCompetitionDraft.teams.flatMap(team => team.memberUsernames))).not.toContain('hs4');
  await expect(page.locator('.team-member-slot-select option[value="hs4"]')).toHaveCount(0);
});

test('trưởng nhóm nhận hướng dẫn triển khai khi máy chủ thiếu UUID thay vì lỗi PostgreSQL thô', async ({ page }) => {
  await openOfflineHomepage(page);
  const dialogs = [];
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });
  await page.evaluate(({ users, exam }) => {
    app.data.users = users;
    app.data.exams = [exam];
    app.data.currentUser = { ...users[0] };
    const match = app.teamCompetition.normalizeCompetition({
      id: 'uuid-error-match', name: 'Trận UUID', classlevel: '5', teamCount: 2, participantMode: 'manual', questionMode: 'same', commonExamId: exam.id,
      status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
        { id: 'uuid-team-a', name: 'Nhóm A', memberUsernames: ['hs1'], leaderUsername: 'hs1' },
        { id: 'uuid-team-b', name: 'Nhóm B', memberUsernames: ['hs2'], leaderUsername: 'hs2' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    app.teamCompetition.remote.configure({
      from() { return { select() { return this; }, then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve); } }; },
      rpc() { return Promise.resolve({ data: null, error: { code: '42883', message: 'function uuid_generate_v4() does not exist' } }); },
      channel() { return { on() { return this; }, subscribe() { return this; } }; }
    });
    app.teamCompetition.remote.openLeaderAttempt(match.id);
  }, { users: demoUsers(), exam: demoExam() });

  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('20260916_team_competition_uuid_defaults.sql');
  expect(dialogs[0]).not.toContain('uuid_generate_v4');
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
  const secondGroup = page.locator('.team-config-card').nth(1);
  await secondGroup.locator('.team-target-count').fill('1');
  await secondGroup.locator('.team-target-count').press('Tab');
  await expect(secondGroup.locator('.team-member-slot-select').first()).toContainText('Học sinh 1');
  await expect(secondGroup.locator('.team-member-slot-select').first()).toContainText('Học sinh 2');
  await secondGroup.locator('.team-member-slot-select').first().selectOption('hs3');
  await secondGroup.locator('.team-leader-select').selectOption('hs3');
  await secondGroup.getByRole('button', { name: 'Lưu' }).click();

  await firstGroup.getByRole('button', { name: 'Sửa' }).click();
  await expect(firstGroup.getByRole('button', { name: 'Cập nhật' })).toBeVisible();
  await expect(firstGroup.getByRole('button', { name: 'Hủy' })).toBeVisible();
  await expect(firstGroup.locator('.team-member-slot-select').first()).not.toBeDisabled();
  await firstGroup.locator('.team-member-slot-select').first().selectOption('hs3');
  await expect.poll(() => page.evaluate(() => app.admin.teamCompetitionDraft.teams.map(team => team.memberUsernames))).toEqual([['hs3', 'hs2'], ['hs1']]);
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 1024, height: 768 }]) {
  test('lưu trận giữ bản nháp khi thiếu migration và phục hồi khi thử lại ' + viewport.width, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openOfflineHomepage(page);
    await page.route('**/*.supabase.co/**', route => route.abort());
    await page.evaluate(({ users, exam }) => {
      app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
      app.data.users = users;
      app.data.exams = [exam];
      app.teamCompetition.store.clear();
      app.admin.openAdmin();
      app.admin.switchTab('quests');
      app.admin.switchQuestMode('team');
      window.saveTest = {
        error: { code: 'PGRST204', message: "Could not find the 'presentation_theme' column of 'team_competitions' in the schema cache" },
        rows: []
      };
      window.supabase = {};
      app.teamCompetition.remote.configure({
        from(table) {
          const result = { data: [], error: null };
          return {
            select() { return this; }, range() { return this; }, eq() { return this; },
            upsert(row) {
              if (table === 'team_competitions') {
                window.saveTest.rows.push(row);
                result.error = window.saveTest.error;
              }
              return this;
            },
            insert() { return this; }, delete() { return this; },
            then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); }
          };
        },
        rpc() { return Promise.resolve({ data: null, error: null }); },
        channel() { return { on() { return this; }, subscribe() { return this; } }; }
      });
    }, { users: demoUsers(), exam: demoExam() });
    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });
    await page.getByRole('button', { name: '+ Tạo trận mới' }).click();
    await page.locator('#team-comp-name').fill('Trận thử lưu lại');
    await page.locator('#team-comp-common-exam').selectOption('exam-team');
    await page.locator('#team-comp-presentation-theme').selectOption('space-launch');
    await page.getByRole('button', { name: 'Lưu Nháp', exact: true }).click();
    await expect.poll(() => dialogs.length).toBe(1);
    expect(dialogs[0]).toContain('20260915_team_competition_presentations.sql');
    await expect(page.locator('.team-form-hero')).toBeVisible();
    await expect(page.locator('#team-comp-name')).toHaveValue('Trận thử lưu lại');
    await expect.poll(() => page.evaluate(() => app.teamCompetition.store.list())).toMatchObject([
      { name: 'Trận thử lưu lại', presentationTheme: 'space-launch' }
    ]);
    await page.evaluate(() => { window.saveTest.error = null; });
    await page.getByRole('button', { name: 'Lưu Nháp', exact: true }).click();
    await expect(page.locator('.team-dashboard-hero')).toBeVisible();
    await expect(page.locator('.team-form-hero')).toHaveCount(0);
    expect(dialogs).toHaveLength(1);
    const saved = await page.evaluate(() => ({
      rows: window.saveTest.rows,
      status: app.teamCompetition.remote.getStatus(),
      matches: app.teamCompetition.store.list()
    }));
    expect(saved.status).toBe('ready');
    expect(saved.rows).toHaveLength(2);
    expect(saved.rows[1].id).toBe(saved.rows[0].id);
    expect(saved.rows[1].presentation_theme).toBe('space-launch');
    expect(saved.matches).toHaveLength(1);
    expect(saved.matches[0].name).toBe('Trận thử lưu lại');
  });
}
