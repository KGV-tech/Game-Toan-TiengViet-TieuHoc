const path = require('path');
const { test, expect } = require('@playwright/test');

const demoUsers = () => Array.from({ length: 8 }, (_, i) => ({
    username: `hs${i + 1}`,
    fullname: `Phi hành gia ${i + 1}`,
    classlevel: '5',
    role: 'student',
    approved: true
}));

const demoExam = (id = 'exam-space-test') => ({
    id,
    name: 'Thử Thách Khám Phá Vũ Trụ',
    classlevel: '5',
    subject: 'Toán',
    period: 'Học kỳ 1',
    questions: Array.from({ length: 10 }, (_, i) => ({
        id: `q${i + 1}`,
        q: `Tính toán quỹ đạo ${i + 1}: 5 + ${i} = ?`,
        type: 'Trắc nghiệm',
        options: ['2', '4', `${5 + i}`, '10'],
        ans: `${5 + i}`
    }))
});

async function openOfflineHomepage(page) {
    page.on('console', message => {
        if (message.type() === 'error') console.error('Browser error:', message.text());
    });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
}

test.describe('Bay Lên Không Gian - Thi Đua Nhóm', () => {
    test('form tạo trận có tùy chọn Bay Lên Không Gian và cập nhật preview chuẩn', async ({ page }) => {
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

        // Select space-launch
        await select.selectOption('space-launch');

        const previewImg = page.locator('#team-comp-presentation-preview-img');
        await expect(previewImg).toHaveAttribute('src', './src/assets/team-competition/Rockets/preview-start.png');

        const previewBadge = page.locator('#team-comp-presentation-preview-badge');
        await expect(previewBadge).toHaveText('Bay Lên Không Gian');
    });

    test('giao diện Bay Lên Không Gian 8 đội: 3 HUD Sci-Fi Deep Space, 8 phi thuyền và huy hiệu ĐẾN TRẠM', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        // Seed mock match with 8 teams, Team 3 reaching 10 points
        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match = {
                id: 'match-space-live-8teams',
                name: 'Bay Vào Không Gian Lớp 5A',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'space-launch',
                status: 'active',
                startedAt: Date.now() - 60000,
                teams: [
                    { id: 't1', name: 'Apollo 1', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 3, submittedCount: 3, status: 'active' },
                    { id: 't2', name: 'Sputnik 2', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 5, submittedCount: 5, status: 'active' },
                    { id: 't3', name: 'Starship 3', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 10, submittedCount: 10, status: 'completed', completedAt: Date.now() - 20000 },
                    { id: 't4', name: 'Voyager 4', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 2, submittedCount: 2, status: 'active' },
                    { id: 't5', name: 'Falcon 5', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 8, submittedCount: 8, status: 'active' },
                    { id: 't6', name: 'Orion 6', memberUsernames: ['hs6'], leaderUsername: 'hs6', score: 4, submittedCount: 4, status: 'active' },
                    { id: 't7', name: 'Discovery 7', memberUsernames: ['hs7'], leaderUsername: 'hs7', score: 7, submittedCount: 7, status: 'active' },
                    { id: 't8', name: 'Galactic 8', memberUsernames: ['hs8'], leaderUsername: 'hs8', score: 6, submittedCount: 6, status: 'active' }
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

        const board = page.locator('.team-competition-board--space-launch');
        await expect(board).toBeVisible();

        const stadium = page.locator('.team-race-stadium--space-launch');
        await expect(stadium).toBeVisible();

        // Verify 3 HUD cards: Title, Clock, Scoreboard
        const titleCard = stadium.locator('.team-stadium-title-card');
        await expect(titleCard).toBeVisible();
        await expect(titleCard).toContainText('Bay Vào Không Gian Lớp 5A');

        // Check title card has doubled height (>= 95px)
        const titleHeight = await titleCard.evaluate(el => el.getBoundingClientRect().height);
        expect(titleHeight).toBeGreaterThanOrEqual(95);

        const clockCard = stadium.locator('.team-race-clock');
        await expect(clockCard).toBeVisible();

        const scoreboard = stadium.locator('.team-race-scoreboard');
        await expect(scoreboard).toBeVisible();
        await expect(scoreboard.locator('.team-race-scoreboard__entry')).toHaveCount(8);

        // Check scoreboard entries have doubled height (>= 44px) and rocket color binding
        const firstEntry = scoreboard.locator('.team-race-scoreboard__entry').first();
        const entryHeight = await firstEntry.evaluate(el => el.getBoundingClientRect().height);
        expect(entryHeight).toBeGreaterThanOrEqual(44);
        const entryRocketColor = await firstEntry.evaluate(el => el.style.getPropertyValue('--rocket-color') || window.getComputedStyle(el).getPropertyValue('--rocket-color'));
        expect(entryRocketColor).toBeTruthy();
        await expect(firstEntry.locator('.team-race-scoreboard__score')).toBeVisible();
        await expect(firstEntry.locator('.team-race-scoreboard__score-unit')).toHaveText('Điểm');

        // Verify 8 stadium lanes
        const lanes = stadium.locator('.team-stadium-lane');
        await expect(lanes).toHaveCount(8);

        // Floating team info badge above rockets is removed
        const floatingInfo = stadium.locator('.team-stadium-lane__info');
        await expect(floatingInfo).toHaveCount(0);

        // Verify rocket vehicle images are loaded with rocket-*.png and NO pulsing scale animation
        const firstRocket = lanes.first().locator('.team-stadium-lane__vehicle');
        await expect(firstRocket).toBeVisible();
        const rocketSrc = await firstRocket.getAttribute('src');
        expect(rocketSrc).toMatch(/rocket-1\.png$/);
        const animName = await firstRocket.evaluate(el => window.getComputedStyle(el).animationName);
        expect(animName === 'none' || animName === '').toBeTruthy();

        // Team 3 has reached 10 points and completed: check finish badge
        const team3Lane = lanes.nth(2);
        const finishBadge = team3Lane.locator('.team-rocket-finish-badge');
        await expect(finishBadge).toBeVisible();
        await expect(finishBadge).toContainText('ĐẾN TRẠM!');

        // Check background position progress reflects highest score (10 pts -> 1.0)
        const canvas = stadium.locator('.team-stadium-canvas');
        const bgProgress = await canvas.evaluate(el => el.style.getPropertyValue('--max-score-progress'));
        expect(parseFloat(bgProgress)).toBeCloseTo(1.0, 2);
    });

    test('co giãn vị trí cân đối cho 3 đội và 5 đội', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        // Test 3 teams layout
        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match3 = {
                id: 'match-space-3teams',
                name: 'Bay Vào Không Gian - 3 Đội',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 10,
                presentationTheme: 'space-launch',
                status: 'active',
                startedAt: Date.now() - 30000,
                teams: [
                    { id: 't1', name: 'Đội Sao Hỏa', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 3, submittedCount: 3, status: 'active' },
                    { id: 't2', name: 'Đội Sao Kim', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 7, submittedCount: 7, status: 'active' },
                    { id: 't3', name: 'Đội Sao Mộc', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 5, submittedCount: 5, status: 'active' }
                ]
            };

            window.app.teamCompetition.store.upsert(match3);
            window.app.admin.openAdmin();
            const modal = document.getElementById('treasure-modal');
            modal.classList.add('active');
            const box = document.getElementById('treasure-content-area');
            window.app.admin.renderTeamCompetitionBoard(box, match3.id);
        }, { users: demoUsers(), exam: demoExam() });

        const stadium3 = page.locator('.team-race-stadium--space-launch');
        await expect(stadium3).toBeVisible();
        const lanes3 = stadium3.locator('.team-stadium-lane');
        await expect(lanes3).toHaveCount(3);

        // Ensure 3 lanes have different X positions and no overlap
        const xPositions3 = await lanes3.evaluateAll(elements =>
            elements.map(el => parseFloat(el.style.getPropertyValue('--rocket-center-x')))
        );
        expect(xPositions3[0]).toBeLessThan(xPositions3[1]);
        expect(xPositions3[1]).toBeLessThan(xPositions3[2]);

        // Test 5 teams layout
        await page.evaluate(({ users, exam }) => {
            const match5 = {
                id: 'match-space-5teams',
                name: 'Bay Vào Không Gian - 5 Đội',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 10,
                presentationTheme: 'space-launch',
                status: 'active',
                startedAt: Date.now() - 30000,
                teams: [
                    { id: 't1', name: 'Đội 1', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 2, submittedCount: 2, status: 'active' },
                    { id: 't2', name: 'Đội 2', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 4, submittedCount: 4, status: 'active' },
                    { id: 't3', name: 'Đội 3', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 6, submittedCount: 6, status: 'active' },
                    { id: 't4', name: 'Đội 4', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 8, submittedCount: 8, status: 'active' },
                    { id: 't5', name: 'Đội 5', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 5, submittedCount: 5, status: 'active' }
                ]
            };

            window.app.teamCompetition.store.upsert(match5);
            const box = document.getElementById('treasure-content-area');
            window.app.admin.renderTeamCompetitionBoard(box, match5.id);
        }, { users: demoUsers(), exam: demoExam() });

        const lanes5 = stadium3.locator('.team-stadium-lane');
        await expect(lanes5).toHaveCount(5);
        const xPositions5 = await lanes5.evaluateAll(elements =>
            elements.map(el => parseFloat(el.style.getPropertyValue('--rocket-center-x')))
        );
        for (let i = 0; i < 4; i++) {
            expect(xPositions5[i]).toBeLessThan(xPositions5[i + 1]);
        }
    });

    test('trạng thái prepared hiển thị nút Bắt đầu trên header và bắt đầu thi đấu thành công', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const preparedMatch = {
                id: 'match-space-prepared',
                name: 'Sẵn Sàng Phóng Tên Lửa',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 10,
                presentationTheme: 'space-launch',
                status: 'prepared',
                teams: [
                    { id: 't1', name: 'Đội Alpha', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 0, submittedCount: 0, status: 'active' },
                    { id: 't2', name: 'Đội Beta', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 0, submittedCount: 0, status: 'active' }
                ]
            };

            window.app.teamCompetition.store.upsert(preparedMatch);
            window.app.admin.openAdmin();
            const modal = document.getElementById('treasure-modal');
            modal.classList.add('active');
            modal.classList.add('team-board-fullscreen');
            modal.classList.add('team-board-fullscreen-mode');

            const box = document.getElementById('treasure-content-area');
            window.app.admin.renderTeamCompetitionBoard(box, preparedMatch.id);
        }, { users: demoUsers(), exam: demoExam() });

        const startBtn = page.locator('.team-board-start');
        await expect(startBtn).toBeVisible();
        await expect(startBtn).toContainText('Bắt đầu');

        // Click start
        await startBtn.click();

        // Verify status transitioned to active
        const stadium = page.locator('.team-race-stadium--space-launch');
        await expect(stadium).toBeVisible();
        const activeMatch = await page.evaluate(() => window.app.teamCompetition.store.get('match-space-prepared'));
        expect(activeMatch.status).toBe('active');
    });

    test('chụp ảnh giao diện thực tế Bay Lên Không Gian trong trận đấu', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match = {
                id: 'match-space-snapshot',
                name: 'Chinh Phục Vũ Trụ - Lớp 5B',
                classlevel: '5',
                className: '5B',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'space-launch',
                status: 'active',
                startedAt: Date.now() - 90000,
                teams: [
                    { id: 't1', name: 'Đội Apollo', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 4.5, submittedCount: 5, status: 'active' },
                    { id: 't2', name: 'Đội Sao Kim', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 7, submittedCount: 7, status: 'active' },
                    { id: 't3', name: 'Đội Ngân Hà', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 10, submittedCount: 10, status: 'completed', completedAt: Date.now() - 30000 },
                    { id: 't4', name: 'Đội Voyager', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 3, submittedCount: 3, status: 'active' },
                    { id: 't5', name: 'Đội Falcon', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 8.5, submittedCount: 9, status: 'active' },
                    { id: 't6', name: 'Đội Orion', memberUsernames: ['hs6'], leaderUsername: 'hs6', score: 2, submittedCount: 2, status: 'active' },
                    { id: 't7', name: 'Đội Discovery', memberUsernames: ['hs7'], leaderUsername: 'hs7', score: 6, submittedCount: 6, status: 'active' },
                    { id: 't8', name: 'Đội Tinh Cầu', memberUsernames: ['hs8'], leaderUsername: 'hs8', score: 5.5, submittedCount: 6, status: 'active' }
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
        const brainDir = 'C:/Users/htleh/.gemini/antigravity-ide/brain/a140c77a-307d-4b01-98ad-bffeca5b05d9';
        await page.screenshot({ path: path.join(brainDir, 'live-game-space-launch.png') });

        // Also capture updated preview-start.png with 8 teams at score 0
        await page.evaluate(({ users, exam }) => {
            const startMatch = {
                id: 'match-space-preview-start',
                name: 'Chuyến Bay Vào Không Gian',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'space-launch',
                status: 'active',
                startedAt: Date.now() - 1000,
                teams: Array.from({ length: 8 }, (_, i) => ({
                    id: `t${i + 1}`,
                    name: `Nhóm ${i + 1}`,
                    memberUsernames: [`hs${i + 1}`],
                    leaderUsername: `hs${i + 1}`,
                    score: 0,
                    submittedCount: 0,
                    status: 'active'
                }))
            };
            window.app.teamCompetition.store.upsert(startMatch);
            const box = document.getElementById('treasure-content-area');
            window.app.admin.renderTeamCompetitionBoard(box, startMatch.id);
        }, { users: demoUsers(), exam: demoExam() });

        await page.waitForTimeout(1000);
        const rocketPreviewPath = path.join(__dirname, '..', '..', 'src', 'assets', 'team-competition', 'Rockets', 'preview-start.png');
        await page.screenshot({ path: rocketPreviewPath });
        await page.screenshot({ path: path.join(brainDir, 'preview-start.png') });
    });
});

