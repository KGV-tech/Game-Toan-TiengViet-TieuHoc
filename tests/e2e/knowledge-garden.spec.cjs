const path = require('path');
const { test, expect } = require('@playwright/test');

const demoUsers = () => Array.from({ length: 8 }, (_, i) => ({
    username: `hs${i + 1}`,
    fullname: `Học sinh làm vườn ${i + 1}`,
    classlevel: '5',
    role: 'student',
    approved: true
}));

const demoExam = (id = 'exam-garden-test') => ({
    id,
    name: 'Thử Thách Khu Vườn Tri Thức',
    classlevel: '5',
    subject: 'Toán',
    period: 'Học kỳ 1',
    questions: Array.from({ length: 10 }, (_, i) => ({
        id: `q${i + 1}`,
        q: `Bài toán gieo mầm ${i + 1}: 10 + ${i} = ?`,
        type: 'Trắc nghiệm',
        options: ['10', `${10 + i}`, '20', '30'],
        ans: `${10 + i}`
    }))
});

async function openOfflineHomepage(page) {
    page.on('console', message => {
        if (message.type() === 'error') console.error('Browser error:', message.text());
    });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('/');
}

test.describe('Khu Vườn Tri Thức - Thi Đua Nhóm', () => {
    test('form tạo trận có tùy chọn Khu Vườn Tri Thức và cập nhật preview chuẩn', async ({ page }) => {
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

        // Select knowledge-garden
        await select.selectOption('knowledge-garden');

        const previewImg = page.locator('#team-comp-presentation-preview-img');
        await expect(previewImg).toHaveAttribute('src', './src/assets/team-competition/Garden/preview-start.png');

        const previewBadge = page.locator('#team-comp-presentation-preview-badge');
        await expect(previewBadge).toHaveText('Khu Vườn Tri Thức');
    });

    test('giao diện Khu Vườn Tri Thức 8 đội: 3 HUD trên cùng, 8 bồn cây xếp 2 hàng xen kẽ, bồn đất stage 0 khi 0 điểm, cây lớn theo điểm, huy hiệu Trĩu quả khi 10 điểm', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        // Seed mock match with 8 teams, varying scores from 0 to 10
        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match = {
                id: 'match-garden-live-8teams',
                name: 'Vườn Tri Thức Lớp 5A',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'knowledge-garden',
                status: 'active',
                startedAt: Date.now() - 60000,
                teams: [
                    { id: 't1', name: 'Mầm Xanh 1', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 0, submittedCount: 0, status: 'active' },
                    { id: 't2', name: 'Hướng Dương 2', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 1, submittedCount: 1, status: 'active' },
                    { id: 't3', name: 'Cây Sồi 3', memberUsernames: ['hs3'], leaderUsername: 'hs3', score: 5, submittedCount: 5, status: 'active' },
                    { id: 't4', name: 'Cẩm Tú Cầu 4', memberUsernames: ['hs4'], leaderUsername: 'hs4', score: 8, submittedCount: 8, status: 'active' },
                    { id: 't5', name: 'Đại Thụ 5', memberUsernames: ['hs5'], leaderUsername: 'hs5', score: 10, submittedCount: 10, status: 'completed', completedAt: Date.now() - 10000 },
                    { id: 't6', name: 'Hoa Sen 6', memberUsernames: ['hs6'], leaderUsername: 'hs6', score: 3, submittedCount: 3, status: 'active' },
                    { id: 't7', name: 'Thạch Thảo 7', memberUsernames: ['hs7'], leaderUsername: 'hs7', score: 2, submittedCount: 2, status: 'active' },
                    { id: 't8', name: 'Phong Lan 8', memberUsernames: ['hs8'], leaderUsername: 'hs8', score: 6, submittedCount: 6, status: 'active' }
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

        const board = page.locator('.team-competition-board--knowledge-garden');
        await expect(board).toBeVisible();

        const stadium = page.locator('.team-race-stadium--knowledge-garden');
        await expect(stadium).toBeVisible();

        // 1. Verify 3 HUD cards at the top
        const titleCard = stadium.locator('.team-stadium-title-card');
        await expect(titleCard).toBeVisible();
        await expect(titleCard).toContainText('Vườn Tri Thức Lớp 5A');

        const clockCard = stadium.locator('.team-race-clock');
        await expect(clockCard).toBeVisible();

        const scoreboard = stadium.locator('.team-race-scoreboard');
        await expect(scoreboard).toBeVisible();
        await expect(scoreboard.locator('.team-race-scoreboard__entry')).toHaveCount(8);

        // Check leaderboard entry has score and unit "Điểm"
        const firstEntry = scoreboard.locator('.team-race-scoreboard__entry').first();
        await expect(firstEntry.locator('.team-race-scoreboard__score-unit')).toHaveText('Điểm');

        // 2. Verify 8 garden pots
        const lanes = stadium.locator('.team-stadium-lane--garden');
        await expect(lanes).toHaveCount(8);

        // Check positions: Row 1 (teams 0..3) vs Row 2 (teams 4..7)
        const positions = await lanes.evaluateAll(elements =>
            elements.map(el => ({
                left: parseFloat(el.style.getPropertyValue('--garden-left')),
                top: parseFloat(el.style.getPropertyValue('--garden-top')),
                scale: parseFloat(el.style.getPropertyValue('--garden-scale')),
                zIndex: parseInt(el.style.getPropertyValue('--garden-z'), 10)
            }))
        );

        // Row 1 (first 4 teams)
        for (let i = 0; i < 4; i++) {
            expect(positions[i].top).toBe(44);
            expect(positions[i].scale).toBeCloseTo(0.85, 2);
            expect(positions[i].zIndex).toBe(12);
        }

        // Row 2 (last 4 teams)
        for (let i = 4; i < 8; i++) {
            expect(positions[i].top).toBe(63);
            expect(positions[i].scale).toBeCloseTo(1.0, 2);
            expect(positions[i].zIndex).toBe(22);
        }

        // Verify interleaving and clear lawn spacing:
        // Team 4 (21.5%) is to the left of Team 0 (30%)
        expect(positions[4].left).toBeLessThan(positions[0].left);

        // Team 5 (38.5%) is between Team 0 (30%) and Team 1 (47%)
        expect(positions[5].left).toBeGreaterThan(positions[0].left);
        expect(positions[5].left).toBeLessThan(positions[1].left);

        // Team 6 (55.5%) is between Team 1 (47%) and Team 2 (64%)
        expect(positions[6].left).toBeGreaterThan(positions[1].left);
        expect(positions[6].left).toBeLessThan(positions[2].left);

        // Team 7 (72.5%) is between Team 2 (64%) and Team 3 (81%)
        expect(positions[7].left).toBeGreaterThan(positions[2].left);
        expect(positions[7].left).toBeLessThan(positions[3].left);

        // 3. Verify stage assets according to score
        // Team 1: score 0 -> stage-0 (bồn đất trống)
        const potImg1 = lanes.nth(0).locator('.team-garden-pot__img');
        await expect(potImg1).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-1-stage-0.png');

        // Team 2: score 1 -> stage-1 (hạt trên đất)
        const potImg2 = lanes.nth(1).locator('.team-garden-pot__img');
        await expect(potImg2).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-2-stage-1.png');

        // Team 3: score 5 -> stage-5
        const potImg3 = lanes.nth(2).locator('.team-garden-pot__img');
        await expect(potImg3).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-3-stage-5.png');

        // Team 4: score 8 -> stage-8
        const potImg4 = lanes.nth(3).locator('.team-garden-pot__img');
        await expect(potImg4).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-4-stage-8.png');

        // Team 5: score 10 -> stage-10 (cây trĩu quả) + finish badge
        const potImg5 = lanes.nth(4).locator('.team-garden-pot__img');
        await expect(potImg5).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-5-stage-10.png');
        const finishBadge5 = lanes.nth(4).locator('.team-garden-finish-badge');
        await expect(finishBadge5).toBeVisible();
        await expect(finishBadge5).toContainText('Trĩu quả');

        // 4. Verify pot badge with team name and score
        const badge1 = lanes.nth(0).locator('.team-garden-pot__badge');
        await expect(badge1).toBeVisible();
        await expect(badge1.locator('.team-garden-pot__name')).toHaveText('Mầm Xanh 1');
        await expect(badge1.locator('.team-garden-pot__score b')).toHaveText('0');
        await expect(badge1.locator('.team-garden-pot__score small')).toHaveText('Điểm');
    });

    test('tự động sắp xếp vị trí xen kẽ hợp lý khi có 7, 6, 5, 4 đội', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        // Check layout calculation via window.app.teamCompetition.getGardenTeamPosition
        const testConfigs = [
            { count: 7, expectedRow1: 4, expectedRow2: 3 },
            { count: 6, expectedRow1: 3, expectedRow2: 3 },
            { count: 5, expectedRow1: 3, expectedRow2: 2 },
            { count: 4, expectedRow1: 4, expectedRow2: 0 }
        ];

        for (const config of testConfigs) {
            const positions = await page.evaluate(({ count }) => {
                return Array.from({ length: count }, (_, i) =>
                    window.app.teamCompetition.getGardenTeamPosition(i, count)
                );
            }, { count: config.count });

            if (config.count === 4) {
                // Single row
                expect(positions).toHaveLength(4);
                positions.forEach(p => {
                    expect(p.row).toBe(1);
                    expect(p.topPct).toBe(53);
                });
                for (let i = 1; i < positions.length; i++) {
                    expect(positions[i].leftPct).toBeGreaterThan(positions[i - 1].leftPct);
                }
            } else {
                const row1 = positions.slice(0, config.expectedRow1);
                const row2 = positions.slice(config.expectedRow1);

                expect(row1).toHaveLength(config.expectedRow1);
                expect(row2).toHaveLength(config.expectedRow2);

                row1.forEach(p => {
                    expect(p.row).toBe(1);
                    expect(p.topPct).toBe(44);
                });
                row2.forEach(p => {
                    expect(p.row).toBe(2);
                    expect(p.topPct).toBe(63);
                });

                // Verify row 2 is interleaved with row 1
                for (let i = 1; i < row1.length; i++) {
                    expect(row1[i].leftPct).toBeGreaterThan(row1[i - 1].leftPct);
                }
                for (let j = 1; j < row2.length; j++) {
                    expect(row2[j].leftPct).toBeGreaterThan(row2[j - 1].leftPct);
                }
            }
        }
    });
});
