const { test, expect } = require('@playwright/test');
const path = require('node:path');

const demoUsers = () => Array.from({ length: 8 }, (_, i) => ({
    username: `hs${i + 1}`,
    fullname: `Học sinh ${i + 1}`,
    classlevel: '5',
    role: 'student',
    approved: true
}));

const demoExam = (id = 'exam-balloon-test') => ({
    id,
    name: 'Đề thi Khinh Khí Cầu',
    classlevel: '5',
    subject: 'Toán',
    period: 'Học kỳ 1',
    questions: Array.from({ length: 10 }, (_, i) => ({
        id: `q${i + 1}`,
        q: `Câu hỏi số ${i + 1}: 2 + ${i} = ?`,
        type: 'Trắc nghiệm',
        options: ['1', '2', '3', `${2 + i}`],
        ans: `${2 + i}`
    }))
});

async function openOfflineHomepage(page) {
    const consoleErrors = [];
    page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
}

test('giao diện Lễ hội khinh khí cầu hiển thị chuẩn 3 khung bên trái và 8 khinh khí cầu bay dọc', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openOfflineHomepage(page);

    // Seed mock competition in browser
    await page.evaluate(({ users, exam }) => {
        window.app.data.users = users;
        window.app.data.currentUser = { username: 'admin', role: 'admin' };
        window.app.data.exams = [exam];

        const match = {
            id: 'match-balloon-live-test',
            name: 'Hội Thi Khinh Khí Cầu Lớp 5A',
            classlevel: '5',
            className: '5A',
            participantMode: 'manual',
            questionMode: 'same',
            commonExamId: exam.id,
            timeLimitMinutes: 15,
            presentationTheme: 'balloon-festival',
            presentationTeamIdentity: {},
            status: 'active',
            startedAt: Date.now() - 60000,
            teams: [
                { id: 't1', name: 'Đội Cá Heo', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 7, submittedCount: 7, status: 'active' },
                { id: 't2', name: 'Đội Sư Tử', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 8.5, submittedCount: 9, status: 'active' },
                { id: 't3', name: 'Đội Gấu Trúc', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 10, submittedCount: 10, status: 'completed' },
                { id: 't4', name: 'Đội Mèo Con', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 5, submittedCount: 5, status: 'active' },
                { id: 't5', name: 'Đội Rùa Con', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 6, submittedCount: 6, status: 'active' },
                { id: 't6', name: 'Đội Thỏ Con', memberUsernames: ['hs6'], leaderUsername: 'hs6', score: 4, submittedCount: 4, status: 'active' },
                { id: 't7', name: 'Đội Voi Con', memberUsernames: ['hs7'], leaderUsername: 'hs7', score: 7.5, submittedCount: 8, status: 'active' },
                { id: 't8', name: 'Đội Cáo Con', memberUsernames: ['hs8'], leaderUsername: 'hs8', score: 9, submittedCount: 9, status: 'active' }
            ]
        };

        window.app.teamCompetition.store.upsert(match);
        window.app.admin.openAdmin();
        const modal = document.getElementById('treasure-modal');
        modal.classList.add('active');
        modal.classList.add('team-board-fullscreen');
        modal.classList.add('team-board-fullscreen-mode');

        const box = document.getElementById('treasure-content-area');
        window.app.admin.renderTeamCompetitionBoard(box, match.id);
    }, { users: demoUsers(), exam: demoExam() });

    // Assert board elements
    const board = page.locator('.team-competition-board--balloon-festival');
    await expect(board).toBeVisible();

    const stadium = page.locator('.team-race-stadium--balloon-festival');
    await expect(stadium).toBeVisible();

    // Verify 3 panels on the left hero
    const hero = page.locator('.team-board-hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('.team-stadium-title-card')).toContainText('Hội Thi Khinh Khí Cầu Lớp 5A');
    await expect(hero.locator('.team-race-clock strong')).toBeVisible();
    await expect(hero.locator('.team-race-scoreboard')).toBeVisible();

    // Verify all 8 scoreboard entries
    const scoreboardEntries = hero.locator('.team-race-scoreboard__entry');
    await expect(scoreboardEntries).toHaveCount(8);

    // Check hero board width is compacted by 20% (around 15.6vw, <= 250px at 1440px)
    const heroBox = await hero.boundingBox();
    expect(heroBox.width).toBeLessThanOrEqual(250);
    expect(heroBox.x).toBeLessThanOrEqual(15);

    // Verify 8 balloons in canvas and their distributed positions
    const canvas = page.locator('.team-stadium-canvas');
    await expect(canvas).toBeVisible();
    const lanes = canvas.locator('.team-stadium-lane');
    await expect(lanes).toHaveCount(8);

    // Verify rightmost balloon has center-x at 93.50%
    const rightmostLane = lanes.nth(7);
    await expect(rightmostLane).toHaveAttribute('style', /--balloon-center-x:\s*93\.50%/);
    const leftmostLane = lanes.nth(0);
    await expect(leftmostLane).toHaveAttribute('style', /--balloon-center-x:\s*6\.50%/);

    // Check balloon vehicle assets
    const vehicles = canvas.locator('.team-stadium-lane__vehicle');
    await expect(vehicles).toHaveCount(8);
    for (let i = 0; i < 8; i++) {
        await expect(vehicles.nth(i)).toHaveAttribute('src', new RegExp(`balloon-${i + 1}\\.png$`));
    }

    // Take screenshot of live match (8 teams)
    const brainDir = 'C:/Users/htleh/.gemini/antigravity-ide/brain/9133abc4-a491-4658-9a45-482da714db3a';
    await page.screenshot({ path: path.join(brainDir, 'live_balloon_festival_match.png') });
    console.log('Saved live balloon festival match screenshot (8 teams)!');

    // Also test and capture start line state (all scores 0)
    await page.evaluate(() => {
        const match = window.app.teamCompetition.store.get('match-balloon-live-test');
        if (match) {
            match.teams.forEach(team => { team.score = 0; team.submittedCount = 0; });
            window.app.teamCompetition.store.upsert(match);
            const box = document.getElementById('treasure-content-area');
            window.app.admin.renderTeamCompetitionBoard(box, match.id);
        }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(brainDir, 'start_balloon_festival_match.png') });
    console.log('Saved start line balloon festival match screenshot!');
});

test('giao diện Lễ hội khinh khí cầu khi có 4 đội tự chia đều vị trí từ sát trái sang sát phải và gán khinh khí cầu 1-4', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openOfflineHomepage(page);

    await page.evaluate(({ users, exam }) => {
        window.app.data.users = users;
        window.app.data.currentUser = { username: 'admin', role: 'admin' };
        window.app.data.exams = [exam];

        const match = {
            id: 'match-balloon-4teams-test',
            name: 'Thi Đua 4 Đội Khinh Khí Cầu',
            classlevel: '5',
            className: '5B',
            participantMode: 'manual',
            questionMode: 'same',
            commonExamId: exam.id,
            timeLimitMinutes: 10,
            presentationTheme: 'balloon-festival',
            presentationTeamIdentity: {},
            status: 'active',
            startedAt: Date.now() - 30000,
            teams: [
                { id: 't1', name: 'Đội Đại Bàng', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 8, submittedCount: 8, status: 'active' },
                { id: 't2', name: 'Đội Chim Én', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 6.5, submittedCount: 7, status: 'active' },
                { id: 't3', name: 'Đội Hải Âu', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 10, submittedCount: 10, status: 'completed' },
                { id: 't4', name: 'Đội Họa Mi', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 5, submittedCount: 5, status: 'active' }
            ]
        };

        window.app.teamCompetition.store.upsert(match);
        window.app.admin.openAdmin();
        const modal = document.getElementById('treasure-modal');
        modal.classList.add('active');
        modal.classList.add('team-board-fullscreen');
        modal.classList.add('team-board-fullscreen-mode');

        const box = document.getElementById('treasure-content-area');
        window.app.admin.renderTeamCompetitionBoard(box, match.id);
    }, { users: demoUsers(), exam: demoExam() });

    const canvas = page.locator('.team-stadium-canvas');
    await expect(canvas).toBeVisible();
    const lanes = canvas.locator('.team-stadium-lane');
    await expect(lanes).toHaveCount(4);

    // Verify 4 teams use balloon 1..4 in order, not jumping by race track lane numbers
    const vehicles = canvas.locator('.team-stadium-lane__vehicle');
    await expect(vehicles).toHaveCount(4);
    await expect(vehicles.nth(0)).toHaveAttribute('src', /balloon-1\.png$/);
    await expect(vehicles.nth(1)).toHaveAttribute('src', /balloon-2\.png$/);
    await expect(vehicles.nth(2)).toHaveAttribute('src', /balloon-3\.png$/);
    await expect(vehicles.nth(3)).toHaveAttribute('src', /balloon-4\.png$/);

    // Verify positions are evenly distributed across the sky from left to right
    // 4 teams: index 0 -> 6.50%, index 1 -> 35.50%, index 2 -> 64.50%, index 3 -> 93.50%
    await expect(lanes.nth(0)).toHaveAttribute('style', /--balloon-center-x:\s*6\.50%/);
    await expect(lanes.nth(1)).toHaveAttribute('style', /--balloon-center-x:\s*35\.50%/);
    await expect(lanes.nth(2)).toHaveAttribute('style', /--balloon-center-x:\s*64\.50%/);
    await expect(lanes.nth(3)).toHaveAttribute('style', /--balloon-center-x:\s*93\.50%/);

    // Verify scoreboard has 4 entries with corresponding colors
    const hero = page.locator('.team-board-hero');
    const scoreboardEntries = hero.locator('.team-race-scoreboard__entry');
    await expect(scoreboardEntries).toHaveCount(4);
    await expect(scoreboardEntries.filter({ hasText: 'Đội Đại Bàng' })).toHaveClass(/team-race-scoreboard__entry--cyan/);
    await expect(scoreboardEntries.filter({ hasText: 'Đội Chim Én' })).toHaveClass(/team-race-scoreboard__entry--yellow/);
    await expect(scoreboardEntries.filter({ hasText: 'Đội Hải Âu' })).toHaveClass(/team-race-scoreboard__entry--coral/);
    await expect(scoreboardEntries.filter({ hasText: 'Đội Họa Mi' })).toHaveClass(/team-race-scoreboard__entry--violet/);

    // Screenshot 4 teams
    const brainDir = 'C:/Users/htleh/.gemini/antigravity-ide/brain/9133abc4-a491-4658-9a45-482da714db3a';
    await page.screenshot({ path: path.join(brainDir, 'live_balloon_festival_4teams.png') });
    console.log('Saved 4-teams balloon festival match screenshot!');
});

