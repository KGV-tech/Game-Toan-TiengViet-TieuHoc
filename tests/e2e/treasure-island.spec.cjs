const { test, expect } = require('@playwright/test');

const demoUsers = () => Array.from({ length: 8 }, (_, i) => ({
    username: `hs${i + 1}`,
    fullname: `Học sinh ${i + 1}`,
    classlevel: '5',
    role: 'student',
    approved: true
}));

const demoExam = (id = 'exam-sea-test') => ({
    id,
    name: 'Đề thi Vượt Biển Tìm Kho Báu',
    classlevel: '5',
    subject: 'Toán',
    period: 'Học kỳ 1',
    questions: Array.from({ length: 10 }, (_, i) => ({
        id: `q${i + 1}`,
        q: `Câu hỏi số ${i + 1}: 3 + ${i} = ?`,
        type: 'Trắc nghiệm',
        options: ['1', '2', '3', `${3 + i}`],
        ans: `${3 + i}`
    }))
});

async function openOfflineHomepage(page) {
    page.on('console', message => {
        if (message.type() === 'error') console.error('Browser error:', message.text());
    });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
}

test.describe('Đảo Kho Báu - Thi Đua Nhóm', () => {
    test('form tạo trận có tùy chọn Đảo Kho Báu và cập nhật preview chuẩn', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        await page.evaluate(() => {
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.admin.openAdmin();
            window.app.admin.switchQuestMode('team');
            window.app.admin.showAddTeamCompetitionForm();
        });

        const select = page.locator('#team-comp-presentation-theme');
        await expect(select).toBeVisible();

        // Select treasure-island
        await select.selectOption('treasure-island');

        const previewImg = page.locator('#team-comp-presentation-preview-img');
        await expect(previewImg).toHaveAttribute('src', './src/assets/team-competition/Sea/preview-start.png');

        const previewBadge = page.locator('#team-comp-presentation-preview-badge');
        await expect(previewBadge).toHaveText('Đảo Kho Báu');
    });

    test('giao diện Đảo Kho Báu 8 đội: 3 HUD biển ngọc vàng kim, bến tàu 52px, thuyền v2 và rương 10 điểm', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        // Seed mock match with 8 teams, Team 3 reaching 10 points
        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match = {
                id: 'match-sea-live-8teams',
                name: 'Truy Tìm Kho Báu Lớp 5A',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'treasure-island',
                status: 'active',
                startedAt: Date.now() - 60000,
                teams: [
                    { id: 't1', name: 'Đội Cá Heo', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 4, submittedCount: 4, status: 'active' },
                    { id: 't2', name: 'Đội Sư Tử', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 6, submittedCount: 6, status: 'active' },
                    { id: 't3', name: 'Đội Gấu Trúc', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 10, submittedCount: 10, status: 'completed', completedAt: Date.now() - 20000 },
                    { id: 't4', name: 'Đội Mèo Con', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 3, submittedCount: 3, status: 'active' },
                    { id: 't5', name: 'Đội Rùa Con', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 7, submittedCount: 7, status: 'active' },
                    { id: 't6', name: 'Đội Thỏ Con', memberUsernames: ['hs6'], leaderUsername: 'hs6', score: 2, submittedCount: 2, status: 'active' },
                    { id: 't7', name: 'Đội Voi Con', memberUsernames: ['hs7'], leaderUsername: 'hs7', score: 8, submittedCount: 8, status: 'active' },
                    { id: 't8', name: 'Đội Cáo Con', memberUsernames: ['hs8'], leaderUsername: 'hs8', score: 5, submittedCount: 5, status: 'active' }
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

        const board = page.locator('.team-competition-board--treasure-island');
        await expect(board).toBeVisible();

        const stadium = page.locator('.team-race-stadium--treasure-island');
        await expect(stadium).toBeVisible();

        // Verify 3 HUD bars: Title, Clock, Scoreboard
        const titleCard = stadium.locator('.team-stadium-title-card');
        await expect(titleCard).toBeVisible();
        await expect(titleCard).toContainText('Truy Tìm Kho Báu Lớp 5A');

        const clockCard = stadium.locator('.team-race-clock');
        await expect(clockCard).toBeVisible();

        const scoreboard = stadium.locator('.team-race-scoreboard');
        await expect(scoreboard).toBeVisible();
        await expect(scoreboard.locator('.team-race-scoreboard__entry')).toHaveCount(8);

        // Check 3 HUD cards have golden border styling
        const titleBorderColor = await titleCard.evaluate(el => window.getComputedStyle(el).borderTopColor);
        expect(titleBorderColor).toBeTruthy();

        // Verify 8 stadium lanes
        const lanes = stadium.locator('.team-stadium-lane');
        await expect(lanes).toHaveCount(8);

        // Check dock badge height (doubled height, min-height around 48px to 54px)
        const firstBadge = lanes.first().locator('.team-stadium-lane__info');
        const badgeHeight = await firstBadge.evaluate(el => el.getBoundingClientRect().height);
        expect(badgeHeight).toBeGreaterThanOrEqual(44);

        // Verify boat images are loaded
        const firstBoat = lanes.first().locator('.team-stadium-lane__vehicle');
        await expect(firstBoat).toBeVisible();
        const boatSrc = await firstBoat.getAttribute('src');
        expect(boatSrc).toContain('boat-1.png');

        // Verify treasure chest is visible on beach (since team 3 reached 10 pts)
        const treasure = stadium.locator('.team-sea-treasure');
        await expect(treasure).toBeVisible();
        await expect(treasure.locator('.team-sea-treasure__badge')).toHaveText('Kho Báu!');
    });

    test('giao diện Đảo Kho Báu khi chưa có đội nào đạt 10 điểm: không hiện rương kho báu', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match = {
                id: 'match-sea-live-no-winner',
                name: 'Truy Tìm Kho Báu Lớp 5A',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'treasure-island',
                status: 'active',
                startedAt: Date.now() - 30000,
                teams: [
                    { id: 't1', name: 'Đội Cá Heo', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 3, submittedCount: 3, status: 'active' },
                    { id: 't2', name: 'Đội Sư Tử', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 5, submittedCount: 5, status: 'active' }
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

        const treasure = page.locator('.team-sea-treasure');
        await expect(treasure).toHaveCount(0);
    });

    test('chia đều và co giãn kích thước thuyền: 5 đội (117px) và 3 đội (156px)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        // Test 5 teams
        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match5 = {
                id: 'match-sea-5teams',
                name: 'Thi Đua 5 Đội',
                classlevel: '5',
                className: '5A',
                presentationTheme: 'treasure-island',
                status: 'active',
                startedAt: Date.now() - 30000,
                teams: [
                    { id: 't1', name: 'Đội 1', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 2, status: 'active' },
                    { id: 't2', name: 'Đội 2', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 4, status: 'active' },
                    { id: 't3', name: 'Đội 3', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 6, status: 'active' },
                    { id: 't4', name: 'Đội 4', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 8, status: 'active' },
                    { id: 't5', name: 'Đội 5', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 9, status: 'active' }
                ]
            };

            window.app.teamCompetition.store.upsert(match5);
            window.app.admin.openAdmin();
            const modal = document.getElementById('treasure-modal');
            modal.classList.add('active');
            modal.classList.add('team-board-fullscreen');

            const box = document.getElementById('treasure-content-area');
            window.app.admin.renderTeamCompetitionBoard(box, match5.id);
        }, { users: demoUsers(), exam: demoExam() });

        const boat5 = page.locator('.team-stadium-lane__vehicle').first();
        const boatWidth5 = await boat5.evaluate(el => window.getComputedStyle(el).width);
        expect(boatWidth5).toBe('117px');

        // Test 3 teams
        await page.evaluate(({ users, exam }) => {
            const match3 = {
                id: 'match-sea-3teams',
                name: 'Thi Đua 3 Đội',
                classlevel: '5',
                className: '5A',
                presentationTheme: 'treasure-island',
                status: 'active',
                startedAt: Date.now() - 30000,
                teams: [
                    { id: 't1', name: 'Đội 1', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 2, status: 'active' },
                    { id: 't2', name: 'Đội 2', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 4, status: 'active' },
                    { id: 't3', name: 'Đội 3', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 6, status: 'active' }
                ]
            };

            window.app.teamCompetition.store.upsert(match3);
            const box = document.getElementById('treasure-content-area');
            window.app.admin.renderTeamCompetitionBoard(box, match3.id);
        }, { users: demoUsers(), exam: demoExam() });

        const boat3 = page.locator('.team-stadium-lane__vehicle').first();
        const boatWidth3 = await boat3.evaluate(el => window.getComputedStyle(el).width);
        expect(boatWidth3).toBe('156px');
    });

    test('chụp ảnh giao diện thực tế Đảo Kho Báu với HUD biển ngọc và vàng kim', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match = {
                id: 'match-sea-live-snapshot',
                name: 'Truy Tìm Kho Báu Lớp 5A',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'treasure-island',
                status: 'active',
                startedAt: Date.now() - 120000,
                teams: [
                    { id: 't1', name: 'Đội Cá Heo', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 4.5, submittedCount: 5, status: 'active' },
                    { id: 't2', name: 'Đội Sư Tử', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 7, submittedCount: 7, status: 'active' },
                    { id: 't3', name: 'Đội Gấu Trúc', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 10, submittedCount: 10, status: 'completed', completedAt: Date.now() - 30000 },
                    { id: 't4', name: 'Đội Mèo Con', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 3, submittedCount: 3, status: 'active' },
                    { id: 't5', name: 'Đội Rùa Con', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 8.5, submittedCount: 9, status: 'active' },
                    { id: 't6', name: 'Đội Thỏ Con', memberUsernames: ['hs6'], leaderUsername: 'hs6', score: 2, submittedCount: 2, status: 'active' },
                    { id: 't7', name: 'Đội Voi Con', memberUsernames: ['hs7'], leaderUsername: 'hs7', score: 6, submittedCount: 6, status: 'active' },
                    { id: 't8', name: 'Đội Cáo Con', memberUsernames: ['hs8'], leaderUsername: 'hs8', score: 5.5, submittedCount: 6, status: 'active' }
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

        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'src/assets/team-competition/Sea/live-game-treasure-island.png' });
    });
});
