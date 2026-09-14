const { test, expect } = require('@playwright/test');

test('khôi phục bài luyện tập dang dở mở màn hình game thay vì giữ màn hình đăng nhập', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');

  const result = await page.evaluate(() => {
    window.app.game.restoreAttemptDraft = () => true;
    window.app.game.restoredAttemptKind = 'practice';
    window.app.game.loadQuestion = () => {};
    window.app.game.resumeSavedAttempt({ username: 'vyanh' });
    return {
      loginActive: document.getElementById('login-screen').classList.contains('active'),
      gameActive: document.getElementById('game-screen').classList.contains('active'),
      playViewActive: document.getElementById('game-play-view').classList.contains('active')
    };
  });

  expect(result).toEqual({ loginActive: false, gameActive: true, playViewActive: true });
});

test('học sinh vẫn vào map nếu lỗi xảy ra sau khi Auth và profile đã thành công', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.route('https://cdn.jsdelivr.net/**', route => {
    if (!route.request().url().includes('@supabase/supabase-js')) {
      return route.fulfill({ contentType: 'application/javascript', body: '' });
    }
    return route.fulfill({
      contentType: 'application/javascript',
      body: `window.supabase = {
        createClient() {
          const student = {
            id: 'student-vyanh', auth_user_id: 'auth-vyanh', username: 'vyanh',
            fullname: 'Vỹ Anh', role: 'student', approved: true, classlevel: '4',
            history: [], stars: 0
          };
          const rowsByTable = {
            game_users: [student], game_questions: [], question_templates: [],
            game_exams: [], game_settings: [], game_quests: [], user_quests: [],
            user_pets: [], pet_inventory: [], user_question_history: [],
            team_competitions: [], team_competition_teams: [], team_competition_members: [],
            team_competition_questions: [], team_competition_attempts: [],
            team_competition_answers: [], team_competition_results: []
          };
          const makeQuery = table => {
            const rows = rowsByTable[table] || [];
            return {
              select() { return this; },
              eq() { return this; },
              ilike() { return this; },
              range() { return Promise.resolve({ data: rows, error: null }); },
              single() { return Promise.resolve({ data: rows[0] || null, error: null }); },
              then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject); }
            };
          };
          const channel = { on() { return this; }, subscribe() { return this; } };
          return {
            from: table => makeQuery(table),
            channel: () => channel,
            auth: {
              signInWithPassword: async () => ({ data: { user: { id: 'auth-vyanh' } }, error: null }),
              signOut: async () => ({ error: null })
            }
          };
        }
      };`
    });
  });

  await page.goto('/');
  await expect(page.locator('#login-btn')).toBeVisible();
  const result = await page.evaluate(async () => {
    app.data.hydrateQuestionLessons = () => { throw new Error('forced post-auth failure'); };
    document.getElementById('username').value = 'vyanh';
    document.getElementById('password').value = 'test-password';
    await app.auth.login();
    return {
      currentUser: app.data.currentUser?.username,
      mapActive: document.getElementById('map-screen')?.classList.contains('active'),
      loginActive: document.getElementById('login-screen')?.classList.contains('active')
    };
  });

  expect(result).toEqual({ currentUser: 'vyanh', mapActive: true, loginActive: false });
  expect(consoleErrors.some(message => message.includes('Đăng nhập lỗi tại bước load-student-data'))).toBe(true);
});
