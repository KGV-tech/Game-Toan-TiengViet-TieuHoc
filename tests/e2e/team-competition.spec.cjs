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
  await expect(page.locator('#team-comp-common-exam')).toHaveCSS('background-color', 'rgb(5, 28, 48)');
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
  await expect(page.locator('.team-board-summary')).not.toBeVisible();
  await expect(page.locator('.team-board-card')).toHaveCount(2);
  await expect(page.locator('.team-board-members__leader').first()).toContainText('Trưởng nhóm');
  await expect(page.locator('.team-board-members__leader').first()).toContainText('Học sinh 1');
  await expect(page.locator('.team-board-members__list').first()).toContainText('Học sinh 1');
  expect(await page.locator('.team-race-stadium--speed-race').evaluate(node => getComputedStyle(node, '::before').display)).toBe('none');
  expect(await page.locator('.team-board-members__leader').first().evaluate(node => Number.parseFloat(getComputedStyle(node.querySelector('strong')).fontSize))).toBeGreaterThanOrEqual(16);
  await expect(page.getByRole('button', { name: 'Bắt đầu thi đua' })).toBeVisible();
  const preparedLayout = await page.locator('.team-competition-board').evaluate(board => {
    const hero = board.querySelector('.team-board-hero').getBoundingClientRect();
    const cards = [...board.querySelectorAll('.team-board-card')].map(card => card.getBoundingClientRect());
    return cards.every(card => hero.bottom <= card.top || hero.top >= card.bottom);
  });
  expect(preparedLayout).toBe(true);
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
  await expect(page.locator('.team-stadium-canvas')).toBeVisible();
  await expect(page.locator('.team-stadium-lane')).toHaveCount(2);
  await expect(page.locator('.team-stadium-lane__vehicle')).toHaveCount(2);
  await expect(page.locator('.team-stadium-lane__vehicle').first()).toHaveAttribute('src', /vehicle-\d+\.png$/);
  expect(await page.locator('.team-stadium-lane').evaluateAll(nodes => nodes.map(node => node.dataset.stadiumLane))).toEqual(['3', '6']);
  await expect(page.locator('.team-stadium-lane').first()).toContainText('0 điểm');
  await expect(page.locator('.team-stadium-canvas')).toHaveCSS('background-image', /stadium-8-lanes-v2\.png/);
  await expect(page.locator('.team-stadium-start-grid')).toHaveCount(0);
  await expect(page.locator('.team-race-lane__finish')).toHaveCount(0);
});

test('lỗi Realtime không chặn REST và được báo đúng trên dashboard', async ({ page }) => {
  await openOfflineHomepage(page);
  await page.evaluate(() => {
    window.supabase = {};
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.teamCompetition.remote.configure({
      from() {
        const result = { data: [], error: null };
        return {
          select() { return this; },
          range() { return this; },
          eq() { return this; },
          then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); }
        };
      },
      rpc() { return Promise.resolve({ data: null, error: null }); },
      channel() {
        return {
          on() { return this; },
          subscribe(callback) { callback('CHANNEL_ERROR'); return this; }
        };
      }
    });
    return app.teamCompetition.remote.syncRemote({ silent: true }).then(() => {
      app.admin.renderTeamCompetitions(document.getElementById('treasure-content-area'));
    });
  });

  await expect(page.locator('.team-remote-status-notice')).toContainText('realtime đang tạm thời không khả dụng');
  await expect(page.locator('.team-remote-status-notice')).toContainText('Lưu bản nháp vẫn dùng đường REST');
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

    await expect(page.locator('.team-stadium-canvas')).toBeVisible();
    await expect(page.locator('.team-stadium-lane')).toHaveCount(2);
    expect(await page.locator('.team-stadium-lane').evaluateAll(nodes => nodes.map(node => node.dataset.stadiumLane))).toEqual(['3', '6']);
    expect(await page.locator('.team-stadium-lane__vehicle').first().evaluate(node => Number.parseFloat(getComputedStyle(node).width))).toBeGreaterThanOrEqual(72);
    const vehiclePosition = await page.locator('.team-stadium-canvas').evaluate(canvas => {
      const vehicle = canvas.querySelector('.team-stadium-lane__vehicle');
      const lane = vehicle.closest('.team-stadium-lane');
      const canvasRect = canvas.getBoundingClientRect();
      const vehicleRect = vehicle.getBoundingClientRect();
      const laneRect = lane.getBoundingClientRect();
      const progress = Number.parseFloat(getComputedStyle(vehicle).getPropertyValue('--race-progress')) || 0;
      return {
        startLineOffset: Math.abs(vehicleRect.right - (canvasRect.left + canvasRect.width * (.25 + progress / 100))),
        verticalOffset: (vehicleRect.top + vehicleRect.height / 2) - (laneRect.top + laneRect.height / 2),
        laneHeight: laneRect.height
      };
    });
    expect(vehiclePosition.startLineOffset).toBeLessThanOrEqual(2);
    // Sprite artwork sits in the lower portion of its transparent cell. Anchor
    // the cell one lane higher so the visible car is centered on its colour.
    expect(vehiclePosition.verticalOffset).toBeLessThanOrEqual(-vehiclePosition.laneHeight * .9);
    expect(vehiclePosition.verticalOffset).toBeGreaterThanOrEqual(-vehiclePosition.laneHeight * 1.1);
    const dimensions = await page.locator('.team-competition-board').evaluate(node => ({
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight
    }));
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 2);
  });
}

test('bảng xếp hạng đường đua hiển thị 8 cột và đổi hạng ngay khi điểm thay đổi', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    const match = app.teamCompetition.normalizeCompetition({
      id: 'scoreboard-match', name: 'Bảng xếp hạng trực tiếp', classlevel: '5', teamCount: 8,
      participantMode: 'manual', questionMode: 'same', commonExamId: exam.id, status: app.teamCompetition.STATUS.ACTIVE,
      timeLimitMinutes: 15, startedAt: Date.now(), teams: [
        { id: 'team-a', name: 'Đội A', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 4, status: 'active' },
        { id: 'team-b', name: 'Đội B', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 9, status: 'active' },
        { id: 'team-c', name: 'Đội C', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 7, status: 'active' },
        { id: 'team-d', name: 'Đội D', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 1, status: 'active' },
        { id: 'team-e', name: 'Đội E', memberUsernames: [], leaderUsername: '', score: 6, status: 'active' },
        { id: 'team-f', name: 'Đội F', memberUsernames: [], leaderUsername: '', score: 3, status: 'active' },
        { id: 'team-g', name: 'Đội G', memberUsernames: [], leaderUsername: '', score: 8, status: 'active' },
        { id: 'team-h', name: 'Đội H', memberUsernames: [], leaderUsername: '', score: 2, status: 'active' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    app.admin.openAdmin();
    app.admin.openTeamCompetitionBoard(match.id);
  }, { users: demoUsers(), exam: demoExam() });

  const entries = page.locator('.team-race-scoreboard__entry');
  await expect(entries).toHaveCount(8);
  await expect(page.locator('.team-stadium-title-card')).toHaveText('Bảng xếp hạng trực tiếp');
  await expect(page.locator('.team-race-clock strong')).toHaveText(/^\d{2}:\d{2}$/);
  expect(await entries.evaluateAll(nodes => nodes.map(node => node.querySelector('strong').textContent))).toEqual(['Đội B', 'Đội G', 'Đội C', 'Đội E', 'Đội A', 'Đội F', 'Đội H', 'Đội D']);
  expect(await entries.evaluateAll(nodes => nodes.map(node => node.dataset.rank))).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  expect(await entries.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).getPropertyValue('--leaderboard-accent').trim()))).toEqual(['#fee732', '#2494fd', '#fe6b5e', '#35d063', '#25e1fc', '#fc78bc', '#fd8d2f', '#a963fa']);
  expect(await entries.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundImage))).toEqual(Array(8).fill('none'));
  expect(await entries.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor))).toEqual(['rgb(254, 231, 50)', 'rgb(36, 148, 253)', 'rgb(254, 107, 94)', 'rgb(53, 208, 99)', 'rgb(37, 225, 252)', 'rgb(252, 120, 188)', 'rgb(253, 141, 47)', 'rgb(169, 99, 250)']);
  expect(await page.locator('.team-race-scoreboard ol').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(8);
  await expect(entries.nth(0)).toHaveClass(/team-race-scoreboard__entry--yellow/);

  await page.evaluate(() => {
    const match = app.teamCompetition.store.get('scoreboard-match');
    const updated = {
      ...match,
      teams: match.teams.map(team => team.id === 'team-d' ? { ...team, score: 10 } : team)
    };
    app.teamCompetition.store.upsert(updated);
    app.admin.renderTeamCompetitionBoard(document.querySelector('#treasure-content-area'), updated.id);
  });
  await expect(entries.first()).toContainText('Đội D');
  await expect(entries.first()).toHaveAttribute('data-rank', '1');
  await expect(entries.first()).toHaveClass(/team-race-scoreboard__entry--violet/);

  await page.evaluate(() => {
    const match = app.teamCompetition.store.get('scoreboard-match');
    const readyToStart = { ...match, teams: match.teams.map(team => ({ ...team, score: 0 })) };
    app.teamCompetition.store.upsert(readyToStart);
    app.admin.renderTeamCompetitionBoard(document.querySelector('#treasure-content-area'), readyToStart.id);
  });
  expect(await page.locator('.team-stadium-canvas').evaluate(canvas => {
    const canvasRect = canvas.getBoundingClientRect();
    const startX = canvasRect.left + canvasRect.width * .25;
    const labels = [...canvas.querySelectorAll('.team-stadium-lane__info')].map(node => node.getBoundingClientRect());
    return [...canvas.querySelectorAll('.team-stadium-lane__vehicle')].map((vehicle, index) => {
      const rect = vehicle.getBoundingClientRect();
      const label = labels[index];
      const intersectsLabel = rect.left < label.right && rect.right > label.left && rect.top < label.bottom && rect.bottom > label.top;
      return { startLineOffset: Math.abs(rect.right - startX), intersectsLabel };
    });
  })).toEqual(Array.from({ length: 8 }, () => ({ startLineOffset: expect.any(Number), intersectsLabel: false })));
  const startLinePositions = await page.locator('.team-stadium-canvas').evaluate(canvas => {
    const canvasRect = canvas.getBoundingClientRect();
    const startX = canvasRect.left + canvasRect.width * .25;
    return [...canvas.querySelectorAll('.team-stadium-lane__vehicle')].map(vehicle => Math.abs(vehicle.getBoundingClientRect().right - startX));
  });
  expect(startLinePositions.every(offset => offset <= 2)).toBe(true);
  await expect(page.locator('.team-stadium-start-grid')).toHaveCount(0);
});

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

test('kết thúc trận vẫn mở bảng kết quả và cho đồng bộ lại khi Supabase lỗi tạm thời', async ({ page }) => {
  await openOfflineHomepage(page);
  const dialogMessages = [];
  page.on('dialog', async dialog => {
    dialogMessages.push(dialog.message());
    await dialog.dismiss();
  });
  await page.evaluate(({ users, exam }) => {
    app.data.currentUser = { username: 'teacher', fullname: 'Giáo viên', role: 'admin' };
    app.data.users = users;
    app.data.exams = [exam];
    const match = app.teamCompetition.normalizeCompetition({
      id: 'retry-ended-match', name: 'Trận mất kết nối', classlevel: '5', teamCount: 2,
      participantMode: 'manual', questionMode: 'same', commonExamId: exam.id,
      status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
        { id: 'retry-team-a', name: 'Nhóm A', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 6, submittedCount: 2, status: 'active' },
        { id: 'retry-team-b', name: 'Nhóm B', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 4, submittedCount: 2, status: 'active' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    const originalUpsert = app.teamCompetition.store.upsert;
    window.teamCompetitionEndRetry = { status: 'error', writes: 0 };
    app.teamCompetition.store.upsert = input => {
      window.teamCompetitionEndRetry.writes += 1;
      return originalUpsert(input);
    };
    app.teamCompetition.remote = {
      flush: async () => {},
      getStatus: () => window.teamCompetitionEndRetry.status
    };
    app.admin.openAdmin();
    return app.admin.endTeamCompetition(match.id, true);
  }, { users: demoUsers(), exam: demoExam() });

  await expect(page.locator('.team-competition-board')).toBeVisible();
  await expect(page.locator('.team-board-ended-note')).toContainText('Kết quả đã được giữ trên thiết bị này');
  await expect(page.getByRole('button', { name: 'Thử đồng bộ lại' })).toBeVisible();
  expect(dialogMessages).toEqual([]);
  expect(await page.evaluate(() => app.teamCompetition.store.get('retry-ended-match').status)).toBe('ended');

  await page.evaluate(() => { window.teamCompetitionEndRetry.status = 'ready'; });
  await page.getByRole('button', { name: 'Thử đồng bộ lại' }).click();
  await expect(page.getByRole('button', { name: 'Thử đồng bộ lại' })).toHaveCount(0);
  await expect(page.locator('.team-board-ended-note')).toContainText('Trận đã kết thúc');
  expect(await page.evaluate(() => window.teamCompetitionEndRetry.writes)).toBe(2);
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

test('trưởng nhóm dùng khung luyện tập, lưu từng câu và OK khi rời sẽ khóa lượt', async ({ page }) => {
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

  await expect(page.locator('#game-screen')).toHaveClass(/active/);
  await expect(page.locator('#game-play-view')).toHaveClass(/active/);
  await expect(page.locator('#team-competition-play-screen')).not.toHaveClass(/active/);
  await expect(page.locator('#game-player-info')).toContainText('Trận tablet');
  await expect(page.locator('#game-player-info')).toContainText('Nhóm A');
  await expect(page.locator('#game-player-info .team-leader-match-card')).toContainText('Trận tablet');
  await expect(page.locator('.team-leader-match-card')).toHaveCSS('text-align', 'center');
  await expect(page.locator('#game-player-info .team-leader-team-card')).toContainText('Nhóm A');
  await expect(page.locator('#game-player-info .team-leader-team-vehicle')).toHaveCount(0);
  await expect(page.locator('#play-cat-img')).toHaveAttribute('src', /team-competition\/stadium-3d-v1\/vehicles\/vehicle-\d+\.png$/);
  await expect.poll(() => page.locator('#play-cat-img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  const avatarAlignment = await page.evaluate(() => {
    const avatar = document.getElementById('play-cat-img').getBoundingClientRect();
    const wrapper = document.querySelector('#game-play-view .cat-wrapper').getBoundingClientRect();
    return {
      horizontalDelta: Math.abs((avatar.left + avatar.width / 2) - (wrapper.left + wrapper.width / 2)),
      verticalDelta: Math.abs((avatar.top + avatar.height / 2) - (wrapper.top + wrapper.height * .52)),
      widthRatio: avatar.width / wrapper.width
    };
  });
  expect(avatarAlignment.horizontalDelta).toBeLessThanOrEqual(3);
  expect(avatarAlignment.verticalDelta).toBeLessThanOrEqual(3);
  expect(avatarAlignment.widthRatio).toBeGreaterThanOrEqual(.9);
  await expect(page.locator('#game-player-info .team-leader-team-card')).not.toContainText('Nhóm của bạn');
  const identityCards = await page.locator('#game-player-info').evaluate(node => {
    const cards = [...node.children].map(card => card.getBoundingClientRect());
    return {
      childCount: node.children.length,
      outerBackground: getComputedStyle(node).backgroundImage,
      stacked: cards.length === 2 && cards[0].bottom <= cards[1].top
    };
  });
  expect(identityCards.childCount).toBe(2);
  expect(identityCards.outerBackground).toBe('none');
  expect(identityCards.stacked).toBe(true);
  await expect(page.locator('#game-practice-status')).toContainText('Các bạn đang tham gia');
  await expect(page.locator('#game-practice-status')).toContainText('THI ĐUA NHÓM');
  await expect(page.locator('#game-practice-status')).toContainText('MÔN TOÁN LỚP 5');
  await page.locator('#game-options-container .ans-btn').filter({ hasText: '2' }).click();
  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('#current-q-index')).toHaveText('1');
  await expect(page.locator('#game-options-container .ans-btn.correct')).toContainText('2');
  await expect(page.locator('#team-leader-answer-feedback')).toHaveCount(0);
  await expect(page.locator('#game-score')).toHaveText('5');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.locator('#current-q-index')).toHaveText('2');
  await expect(page.locator('.game-answer-reveal')).toHaveCount(0);

  await page.getByRole('button', { name: 'Thoát lượt đội nhóm' }).click();
  await expect(page.locator('#team-leave-confirm-modal')).toBeVisible();
  await expect(page.locator('.team-leave-confirm-actions button')).toHaveText(['OK', 'Hủy']);
  await page.getByRole('button', { name: 'Hủy' }).click();
  await expect(page.locator('#game-play-view')).toHaveClass(/active/);

  await page.getByRole('button', { name: 'Thoát lượt đội nhóm' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect.poll(() => page.evaluate(id => app.teamCompetition.attemptStore.get(id, 'team-a'), matchId)).toMatchObject({ status: 'locked', submittedCount: 1, score: 5 });
  await expect(page.locator('#map-screen')).toHaveClass(/active/);

  await page.evaluate(exam => {
    app.game.state = { ...app.game.state, teamCompetition: false, subject: 'math', questions: exam.questions, currentIdx: 0, score: 0, finished: false };
    app.router.open('game-screen');
    app.router.openGameView('game-play-view');
    app.game.loadQuestion();
  }, demoExam('ordinary-practice'));
  await expect(page.locator('#game-play-view')).not.toHaveClass(/team-competition-leader-mode/);
  await expect(page.locator('#game-btn-back')).toHaveAttribute('aria-label', 'Thoát lượt làm bài');
});

test('trưởng nhóm dùng phản hồi Luyện tập: đánh dấu đúng sai, đáp án dưới bài và tiếp tục', async ({ page }) => {
  await openOfflineHomepage(page);
  await page.evaluate(({ users, exam }) => {
    app.data.users = users;
    app.data.exams = [exam];
    app.data.currentUser = { ...users[0] };
    const match = app.teamCompetition.normalizeCompetition({
      id: 'match-practice-feedback', name: 'Trận phản hồi', classlevel: '5', teamCount: 2,
      participantMode: 'manual', questionMode: 'same', commonExamId: exam.id, timeLimitMinutes: null,
      status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
        { id: 'feedback-a', name: 'Nhóm A', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1' },
        { id: 'feedback-b', name: 'Nhóm B', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    app.teamCompetition.openLeaderAttempt(match.id);
  }, { users: demoUsers(), exam: demoExam('feedback-exam') });

  await page.locator('#game-options-container .ans-btn').filter({ hasText: '3' }).click();
  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('#game-options-container .ans-btn.wrong')).toContainText('3');
  await expect(page.locator('#game-options-container .ans-btn.correct')).toContainText('2');
  await expect(page.locator('.game-answer-reveal')).toContainText('2');
  const positions = await page.evaluate(() => {
    const options = document.getElementById('game-options-container').getBoundingClientRect();
    const reveal = document.querySelector('.game-answer-reveal').getBoundingClientRect();
    return { optionsBottom: options.bottom, revealTop: reveal.top };
  });
  expect(positions.revealTop).toBeGreaterThanOrEqual(positions.optionsBottom);
  await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
  await expect(page.locator('#game-score')).toHaveText('0');
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.locator('#current-q-index')).toHaveText('2');
});

test('trưởng nhóm khôi phục lượt đang làm sau khi vào lại và chỉ khóa khi hủy tham gia', async ({ page }) => {
  await openOfflineHomepage(page);
  const matchId = await page.evaluate(({ users, exam }) => {
    app.data.users = users;
    app.data.exams = [exam];
    app.data.currentUser = { ...users[0] };
    const match = app.teamCompetition.normalizeCompetition({
      id: 'resume-match', name: 'Trận khôi phục', classlevel: '5', teamCount: 2,
      participantMode: 'manual', questionMode: 'same', commonExamId: exam.id, timeLimitMinutes: 10,
      status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
        { id: 'resume-team', name: 'Nhóm Xanh', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1' },
        { id: 'resume-other', name: 'Nhóm Vàng', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3' }
      ]
    });
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    const attempt = app.teamCompetition.createAttempt(match, match.teams[0], 'hs1', exam.questions);
    app.teamCompetition.recordAttemptAnswer(attempt, 0, '2', { points: 1, isCorrect: true });
    app.teamCompetition.state.activeAttempt = null;
    app.teamCompetition.openLeaderAttempt(match.id);
    return match.id;
  }, { users: demoUsers(), exam: demoExam('resume-exam') });

  await expect(page.locator('#team-leave-confirm-modal')).toBeVisible();
  await expect(page.locator('#team-leave-confirm-title')).toHaveText('Tiếp tục lượt thi đua?');
  await expect(page.locator('#team-leave-confirm-message')).toContainText('Câu 2/2');
  await expect(page.locator('#team-leave-confirm-message')).toContainText('5 điểm');
  await expect(page.locator('.team-leave-confirm-actions button')).toHaveText(['Tiếp tục', 'Hủy tham gia']);
  await page.keyboard.press('Escape');
  await expect(page.locator('#team-leave-confirm-modal')).toBeHidden();
  await expect.poll(() => page.evaluate(id => app.teamCompetition.attemptStore.get(id, 'resume-team')?.status, matchId)).toBe('active');
  await page.evaluate(id => { app.teamCompetition.openLeaderAttempt(id); }, matchId);
  await expect(page.locator('#team-leave-confirm-modal')).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.locator('#game-play-view')).toHaveClass(/active/);
  await expect(page.locator('#current-q-index')).toHaveText('2');
  await expect(page.locator('#game-score')).toHaveText('5');

  await page.evaluate(id => {
    app.teamCompetition.state.activeAttempt = null;
    app.teamCompetition.openLeaderAttempt(id);
  }, matchId);
  await expect(page.locator('#team-leave-confirm-modal')).toBeVisible();
  await page.getByRole('button', { name: 'Hủy tham gia' }).click();
  await expect.poll(() => page.evaluate(id => app.teamCompetition.attemptStore.get(id, 'resume-team')?.status, matchId)).toBe('locked');
  await expect(page.locator('#map-screen')).toHaveClass(/active/);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
  test(`khung luyện tập của trưởng nhóm vừa viewport ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openOfflineHomepage(page);
    await page.evaluate(({ users, exam }) => {
      app.data.users = users;
      app.data.exams = [exam];
      app.data.currentUser = { ...users[0] };
      const match = app.teamCompetition.normalizeCompetition({
        id: `leader-practice-${window.innerWidth}`, name: 'Trận khung luyện tập', classlevel: '5', teamCount: 2,
        participantMode: 'manual', questionMode: 'same', commonExamId: exam.id, timeLimitMinutes: null,
        status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
          { id: `leader-team-${window.innerWidth}`, name: 'Nhóm Xanh', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1' },
          { id: `leader-other-${window.innerWidth}`, name: 'Nhóm Vàng', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3' }
        ]
      });
      app.teamCompetition.store.clear();
      app.teamCompetition.store.upsert(match);
      app.teamCompetition.openLeaderAttempt(match.id);
    }, { users: demoUsers(), exam: demoExam(`exam-leader-practice-${viewport.width}`) });

    await expect(page.locator('#game-play-view')).toHaveClass(/team-competition-leader-mode/);
    await expect(page.locator('#game-practice-status')).toContainText('MÔN TOÁN LỚP 5');
    await expect(page.locator('.team-leader-team-vehicle')).toHaveCount(0);
    expect(await page.locator('.team-leader-team-name').evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    await expect(page.locator('#play-cat-img')).toHaveAttribute('src', /team-competition\/stadium-3d-v1\/vehicles\/vehicle-\d+\.png$/);
    await expect(page.locator('#play-cat-img')).toHaveAttribute('alt', /Xe đua của Nhóm Xanh/);
    const encouragementPosition = await page.evaluate(() => {
      const bubble = document.getElementById('cat-speech-bubble').getBoundingClientRect();
      const avatar = document.getElementById('play-cat-img').getBoundingClientRect();
      return { bubbleBottom: bubble.bottom, avatarTop: avatar.top, avatarHeight: avatar.height };
    });
    expect(encouragementPosition.bubbleBottom).toBeLessThanOrEqual(encouragementPosition.avatarTop + encouragementPosition.avatarHeight * .55);
    const spaceshipAvatar = await page.evaluate(() => app.teamCompetition.resolvePresentationTeamAvatar(
      app.teamCompetition.PRESENTATION_THEMES.SPACE_LAUNCH,
      app.teamCompetition.STADIUM_LANES[0]
    ));
    expect(spaceshipAvatar.src).toMatch(/^data:image\/svg\+xml,/);
    expect(spaceshipAvatar.label).toBe('Phi thuyền');
    const viewportFit = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight
    }));
    expect(viewportFit.scrollHeight).toBeLessThanOrEqual(viewportFit.clientHeight + 2);
  });
}

test('lỗi phiên khi nộp câu không khóa lượt nếu máy chủ vẫn xác nhận lượt đang mở', async ({ page }) => {
  await openOfflineHomepage(page);
  const dialogs = [];
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });

  await page.evaluate(({ users, exam }) => {
    const ids = {
      competition: '11111111-1111-4111-8111-111111111111',
      team: '22222222-2222-4222-8222-222222222222',
      attempt: '33333333-3333-4333-8333-333333333333'
    };
    const activeAttempt = {
      id: ids.attempt, competition_id: ids.competition, team_id: ids.team, leader_username: 'hs1',
      session_id: 'session-open', status: 'active', question_count: 2, current_index: 0,
      submitted_count: 0, correct_count: 0, score: 0, started_at: new Date().toISOString(),
      completed_at: null, locked_at: null, duration_seconds: null, updated_at: new Date().toISOString()
    };
    app.data.users = users;
    app.data.exams = [exam];
    app.data.currentUser = { ...users[0] };
    const match = app.teamCompetition.normalizeCompetition({
      id: ids.competition, name: 'Trận không khóa nhầm', classlevel: '5', teamCount: 2,
      participantMode: 'manual', questionMode: 'same', commonExamId: exam.id,
      status: app.teamCompetition.STATUS.ACTIVE, startedAt: Date.now(), teams: [
        { id: ids.team, name: 'Nhóm A', memberUsernames: ['hs1', 'hs2'], leaderUsername: 'hs1' },
        { id: '44444444-4444-4444-8444-444444444444', name: 'Nhóm B', memberUsernames: ['hs3', 'hs4'], leaderUsername: 'hs3' }
      ]
    });
    const rows = {
      team_competitions: [{ id: ids.competition, name: match.name, classlevel: '5', class_name: null, participant_mode: 'manual', question_mode: 'same', common_exam_id: exam.id, time_limit_minutes: null, presentation_theme: 'speed-race', presentation_team_identity: {}, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), started_at: new Date().toISOString(), ended_at: null, version: 1 }],
      team_competition_teams: [
        { id: ids.team, competition_id: ids.competition, name: 'Nhóm A', position: 1, target_member_count: 2, leader_username: 'hs1', exam_id: exam.id, status: 'active', score: 0, submitted_count: 0, correct_count: 0, started_at: activeAttempt.started_at, completed_at: null, locked_at: null, duration_seconds: null },
        { id: '44444444-4444-4444-8444-444444444444', competition_id: ids.competition, name: 'Nhóm B', position: 2, target_member_count: 2, leader_username: 'hs3', exam_id: exam.id, status: 'active', score: 0, submitted_count: 0, correct_count: 0, started_at: activeAttempt.started_at, completed_at: null, locked_at: null, duration_seconds: null }
      ],
      team_competition_members: [{ competition_id: ids.competition, team_id: ids.team, username: 'hs1', position: 1 }, { competition_id: ids.competition, team_id: ids.team, username: 'hs2', position: 2 }],
      team_competition_attempts: [activeAttempt], team_competition_answers: [], team_competition_results: [],
      team_competition_questions: exam.questions.map((question, questionIndex) => ({
        id: `question-${questionIndex}`, competition_id: ids.competition, team_id: ids.team,
        question_index: questionIndex, question_payload: question, question_type: question.type,
        answer_count: 1, part_answer_counts: null
      }))
    };
    window.supabase = {};
    app.teamCompetition.store.clear();
    app.teamCompetition.store.upsert(match);
    app.teamCompetition.remote.configure({
      from(table) {
        return {
          select() { return this; },
          then(resolve) { return Promise.resolve({ data: rows[table] || [], error: null }).then(resolve); }
        };
      },
      rpc(name) {
        if (name === 'team_competition_start_attempt') {
          rows.team_competition_attempts = [activeAttempt];
          return Promise.resolve({ data: activeAttempt, error: null });
        }
        if (name === 'team_competition_submit_answer') return Promise.resolve({ data: null, error: { code: 'P0001', message: 'attempt_session_mismatch' } });
        return Promise.resolve({ data: null, error: null });
      },
      channel() { return { on() { return this; }, subscribe() { return this; } }; }
    });
    return app.teamCompetition.remote.syncRemote({ silent: true })
      .then(() => { app.teamCompetition.remote.openLeaderAttempt(ids.competition); });
  }, { users: demoUsers(), exam: demoExam() });

  await expect(page.locator('#team-leave-confirm-modal')).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();

  await page.locator('#game-options-container .ans-btn').filter({ hasText: '2' }).click();
  await page.locator('#submit-ans-btn').click();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('Lượt của nhóm vẫn đang mở');
  await expect.poll(() => page.evaluate(() => app.teamCompetition.state.activeAttempt?.status)).toBe('active');
  await expect(page.locator('#game-question-container')).not.toContainText('Lượt nhóm đã khóa');
  await expect(page.locator('#submit-ans-btn')).toBeEnabled();
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
    await expect(page.locator('#team-comp-presentation-theme option')).toHaveCount(10);
    await expect(page.locator('#team-comp-presentation-theme')).toHaveValue('speed-race');
    await expect(page.locator('#team-comp-presentation-theme option:disabled')).toHaveCount(9);
    await page.getByRole('button', { name: 'Lưu Nháp', exact: true }).click();
    await expect.poll(() => dialogs.length).toBe(1);
    expect(dialogs[0]).toContain('20260915_team_competition_presentations.sql');
    await expect(page.locator('.team-form-hero')).toBeVisible();
    await expect(page.locator('#team-comp-name')).toHaveValue('Trận thử lưu lại');
    await expect.poll(() => page.evaluate(() => app.teamCompetition.store.list())).toMatchObject([
      { name: 'Trận thử lưu lại', presentationTheme: 'speed-race' }
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
    expect(saved.rows[1].presentation_theme).toBe('speed-race');
    expect(saved.matches).toHaveLength(1);
    expect(saved.matches[0].name).toBe('Trận thử lưu lại');
  });
}
