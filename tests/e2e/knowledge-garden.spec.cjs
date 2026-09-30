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
    test('toàn bộ ảnh giai đoạn và nền Garden tải được dưới dạng WebP đồng bộ kích thước', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        const stageAssets = Array.from({ length: 8 }, (_, teamIndex) =>
            Array.from({ length: 11 }, (_, stageIndex) =>
                `./src/assets/team-competition/Garden/stages/team-${teamIndex + 1}-stage-${stageIndex}.webp`
            )
        ).flat();
        const gardenAssets = [...stageAssets, './src/assets/team-competition/Garden/BG.webp'];
        const loadedAssets = await page.evaluate(async sources => {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 832;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            const loaded = await Promise.all(sources.map(source => new Promise(resolve => {
                const image = new Image();
                image.onload = () => resolve({ source, width: image.naturalWidth, height: image.naturalHeight, image });
                image.onerror = () => resolve({ source, error: true });
                image.src = source;
            })));

            return loaded.map(({ source, width, height, image, error }) => {
                if (error || !source.endsWith('.webp') || source.endsWith('/BG.webp')) {
                    return { source, width, height, error };
                }
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);
                const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                let rimWidth = 0;
                for (let y = 690; y <= 820; y++) {
                    let left = canvas.width;
                    let right = -1;
                    for (let x = 0; x < canvas.width; x++) {
                        if (pixels[(y * canvas.width + x) * 4 + 3] > 128) {
                            left = Math.min(left, x);
                            right = Math.max(right, x);
                        }
                    }
                    if (right >= left) rimWidth = Math.max(rimWidth, right - left + 1);
                }
                const [, team, stage] = source.match(/team-(\d+)-stage-(\d+)\.webp$/) || [];
                const scaleX = window.app.teamCompetition.getGardenPotScaleX(Number(team), Number(stage));
                return { source, width, height, rimWidth, scaleX, normalizedRimWidth: rimWidth * scaleX };
            });
        }, gardenAssets);

        expect(loadedAssets.filter(asset => asset.error)).toEqual([]);
        expect(loadedAssets.slice(0, 88).map(({ width, height }) => ({ width, height })))
            .toEqual(Array.from({ length: 88 }, () => ({ width: 640, height: 832 })));
        const normalizedRimWidths = loadedAssets.slice(0, 88).map(asset => asset.normalizedRimWidth);
        expect(Math.max(...normalizedRimWidths) - Math.min(...normalizedRimWidths)).toBeLessThanOrEqual(2);
        expect(loadedAssets[88]).toMatchObject({ width: 1664, height: 936 });
    });

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
        await expect(previewImg).toHaveAttribute('src', './src/assets/team-competition/Garden/BG.webp');
        await expect.poll(() => previewImg.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);

        const previewBadge = page.locator('#team-comp-presentation-preview-badge');
        await expect(previewBadge).toHaveText('Khu Vườn Tri Thức');
    });

    test('giao diện Khu Vườn Tri Thức 8 đội: HUD rõ ràng, 8 bồn cây xếp thành 2 hàng thoáng, cây phát triển theo điểm', async ({ page }, testInfo) => {
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

        await expect.poll(() => lanes.locator('.team-garden-pot__img').evaluateAll(images =>
            images.map(image => image.complete && image.naturalWidth > 0)
        )).toEqual(Array(8).fill(true));

        const gardenCanvas = stadium.locator('.team-stadium-canvas');
        const gardenBackground = await gardenCanvas.evaluate(element => getComputedStyle(element).backgroundImage);
        expect(gardenBackground).toContain('/src/assets/team-competition/Garden/BG.webp');

        const renderedPotScaleData = await lanes.locator('.team-garden-pot__img').evaluateAll(images =>
            images.map(image => ({
                declared: parseFloat(image.style.getPropertyValue('--garden-pot-scale-x')),
                applied: Number(getComputedStyle(image).transform.match(/^matrix\(([-\d.]+)/)?.[1])
            }))
        );
        const expectedPotScales = await page.evaluate(() =>
            Array.from({ length: 8 }, (_, index) =>
                window.app.teamCompetition.getGardenPotScaleX(index + 1, [0, 1, 5, 8, 10, 3, 2, 6][index])
            )
        );
        expect(renderedPotScaleData.map(value => value.declared)).toEqual(expectedPotScales);
        renderedPotScaleData.forEach((value, index) => expect(value.applied).toBeCloseTo(expectedPotScales[index], 4));

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
            expect(positions[i].top).toBe(52);
            expect(positions[i].scale).toBeCloseTo(1.0, 2);
            expect(positions[i].zIndex).toBe(12);
        }

        // Row 2 (last 4 teams)
        for (let i = 4; i < 8; i++) {
            expect(positions[i].top).toBe(86);
            expect(positions[i].scale).toBeCloseTo(1.0, 2);
            expect(positions[i].zIndex).toBe(22);
        }

        // Both rows use matching, evenly spaced columns; the vertical gap keeps the large plants apart.
        expect(positions.slice(4).map(position => position.left))
            .toEqual(positions.slice(0, 4).map(position => position.left));

        const accentByTeam = {
            'Mầm Xanh 1': '#25e1fc',
            'Hướng Dương 2': '#fd8d2f',
            'Cây Sồi 3': '#fe6b5e',
            'Cẩm Tú Cầu 4': '#a963fa',
            'Đại Thụ 5': '#fee732',
            'Hoa Sen 6': '#fc78bc',
            'Thạch Thảo 7': '#2494fd',
            'Phong Lan 8': '#35d063'
        };
        const renderedAccents = await scoreboard.locator('.team-race-scoreboard__entry').evaluateAll(entries =>
            entries.map(entry => ({
                name: entry.querySelector('strong')?.textContent?.trim(),
                accent: getComputedStyle(entry).getPropertyValue('--leaderboard-accent').trim()
            }))
        );
        for (const [teamName, expectedAccent] of Object.entries(accentByTeam)) {
            expect(renderedAccents.find(entry => entry.name === teamName)?.accent).toBe(expectedAccent);
        }

        // 3. Verify stage assets according to score
        // Team 1: score 0 -> stage-0 (bồn đất trống)
        const potImg1 = lanes.nth(0).locator('.team-garden-pot__img');
        await expect(potImg1).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-1-stage-0.webp');

        // Team 2: score 1 -> stage-1 (hạt trên đất)
        const potImg2 = lanes.nth(1).locator('.team-garden-pot__img');
        await expect(potImg2).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-2-stage-1.webp');

        // Team 3: score 5 -> stage-5
        const potImg3 = lanes.nth(2).locator('.team-garden-pot__img');
        await expect(potImg3).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-3-stage-5.webp');

        // Team 4: score 8 -> stage-8
        const potImg4 = lanes.nth(3).locator('.team-garden-pot__img');
        await expect(potImg4).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-4-stage-8.webp');

        // Team 5: score 10 -> stage-10 (cây trĩu quả) + finish badge
        const potImg5 = lanes.nth(4).locator('.team-garden-pot__img');
        await expect(potImg5).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-5-stage-10.webp');
        const finishBadge5 = lanes.nth(4).locator('.team-garden-finish-badge');
        await expect(finishBadge5).toBeVisible();
        await expect(finishBadge5).toContainText('Trĩu quả');

        // 4. Verify pot badge with team name and score
        const badge1 = lanes.nth(0).locator('.team-garden-pot__badge');
        await expect(badge1).toBeVisible();
        await expect(badge1.locator('.team-garden-pot__name')).toHaveText('Mầm Xanh 1');
        await expect(badge1.locator('.team-garden-pot__score b')).toHaveText('0');
        await expect(badge1.locator('.team-garden-pot__score small')).toHaveText('Điểm');

        // Verify badge colors match brick rim colors (Team 2: orange, Team 5: yellow, Team 8: green)
        await expect(lanes.nth(1).locator('.team-garden-pot__badge')).toHaveClass(/team-garden-pot__badge--orange/);
        await expect(lanes.nth(4).locator('.team-garden-pot__badge')).toHaveClass(/team-garden-pot__badge--yellow/);
        await expect(lanes.nth(6).locator('.team-garden-pot__badge')).toHaveClass(/team-garden-pot__badge--blue/);
        await expect(lanes.nth(7).locator('.team-garden-pot__badge')).toHaveClass(/team-garden-pot__badge--green/);
        await expect.poll(() => lanes.nth(6).locator('.team-garden-pot__badge').evaluate(element =>
            getComputedStyle(element).backgroundImage
        )).toContain('rgb(59, 130, 246)');

        // Verify scoreboard entries match brick colors
        await expect(stadium.locator('.team-race-scoreboard__entry', { hasText: 'Hướng Dương 2' })).toHaveClass(/team-race-scoreboard__entry--orange/);
        await expect(stadium.locator('.team-race-scoreboard__entry', { hasText: 'Đại Thụ 5' })).toHaveClass(/team-race-scoreboard__entry--yellow/);
        await expect(stadium.locator('.team-race-scoreboard__entry', { hasText: 'Phong Lan 8' })).toHaveClass(/team-race-scoreboard__entry--green/);

        // Verify no hover enlargement on garden lane
        const lane1BoxBefore = await lanes.nth(0).boundingBox();
        await lanes.nth(0).hover();
        const lane1BoxAfter = await lanes.nth(0).boundingBox();
        expect(lane1BoxAfter.width).toBeCloseTo(lane1BoxBefore.width, 1);
        expect(lane1BoxAfter.height).toBeCloseTo(lane1BoxBefore.height, 1);

        for (const viewport of [
            { width: 1280, height: 720 },
            { width: 1440, height: 900 },
            { width: 1024, height: 768 }
        ]) {
            await page.setViewportSize(viewport);
            const canvasBounds = await stadium.locator('.team-stadium-canvas').evaluate(element => {
                const { left, top, right, bottom } = element.getBoundingClientRect();
                return { left, top, right, bottom };
            });

            expect(canvasBounds.left).toBeGreaterThanOrEqual(0);
            expect(canvasBounds.top).toBeGreaterThanOrEqual(0);
            expect(canvasBounds.right).toBeLessThanOrEqual(viewport.width + 1);
            expect(canvasBounds.bottom).toBeLessThanOrEqual(viewport.height + 1);

            const laneBoxes = await lanes.evaluateAll(elements => elements.map(element => {
                const { left, top, right, bottom, width } = element.getBoundingClientRect();
                return { left, top, right, bottom, width };
            }));
            expect(laneBoxes.map(box => box.width)).toEqual(Array(8).fill(laneBoxes[0].width));
            for (let i = 0; i < laneBoxes.length; i++) {
                for (let j = i + 1; j < laneBoxes.length; j++) {
                    const overlaps = laneBoxes[i].left < laneBoxes[j].right
                        && laneBoxes[i].right > laneBoxes[j].left
                        && laneBoxes[i].top < laneBoxes[j].bottom
                        && laneBoxes[i].bottom > laneBoxes[j].top;
                    expect(overlaps, `teams ${i + 1} and ${j + 1} overlap at ${viewport.width}x${viewport.height}`).toBe(false);
                }
            }
            const plantBoxes = await lanes.locator('.team-garden-pot__img').evaluateAll(images => images.map(image => {
                const { left, top, right, bottom } = image.getBoundingClientRect();
                return { left, top, right, bottom };
            }));
            for (let i = 0; i < plantBoxes.length; i++) {
                for (let j = i + 1; j < plantBoxes.length; j++) {
                    const overlaps = plantBoxes[i].left < plantBoxes[j].right
                        && plantBoxes[i].right > plantBoxes[j].left
                        && plantBoxes[i].top < plantBoxes[j].bottom
                        && plantBoxes[i].bottom > plantBoxes[j].top;
                    expect(overlaps, `plants ${i + 1} and ${j + 1} overlap at ${viewport.width}x${viewport.height}`).toBe(false);
                }
            }
            await page.screenshot({
                path: testInfo.outputPath(`garden-${viewport.width}x${viewport.height}.png`),
                animations: 'disabled'
            });
        }
    });

    test('tự động sắp xếp vị trí đều và cùng kích thước khi có 1 đến 7 đội', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        // Check layout calculation via window.app.teamCompetition.getGardenTeamPosition
        const testConfigs = [
            { count: 1, expectedRow1: 1, expectedRow2: 0 },
            { count: 2, expectedRow1: 2, expectedRow2: 0 },
            { count: 3, expectedRow1: 3, expectedRow2: 0 },
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

            if (config.count <= 4) {
                // Single row
                expect(positions).toHaveLength(config.count);
                positions.forEach(p => {
                    expect(p.row).toBe(1);
                    expect(p.topPct).toBe(61);
                    expect(p.scale).toBe(1);
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
                    expect(p.topPct).toBe(52);
                    expect(p.scale).toBe(1);
                });
                row2.forEach(p => {
                    expect(p.row).toBe(2);
                    expect(p.topPct).toBe(86);
                    expect(p.scale).toBe(1);
                });

                // Ensure team positions remain ordered within both rows.
                for (let i = 1; i < row1.length; i++) {
                    expect(row1[i].leftPct).toBeGreaterThan(row1[i - 1].leftPct);
                }
                for (let j = 1; j < row2.length; j++) {
                    expect(row2[j].leftPct).toBeGreaterThan(row2[j - 1].leftPct);
                }
            }
        }
    });

    test('trận kết thúc (ended) khi các đội đạt 10/10 điểm vẫn giữ khung cảnh vườn và hiển thị cây trĩu quả stage-10', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await openOfflineHomepage(page);

        await page.evaluate(({ users, exam }) => {
            window.app.data.users = users;
            window.app.data.currentUser = { username: 'admin', role: 'admin' };
            window.app.data.exams = [exam];

            const match = {
                id: 'match-garden-ended-10',
                name: 'Khu Vườn Tri Thức - Chung Kết',
                classlevel: '5',
                className: '5A',
                participantMode: 'manual',
                questionMode: 'same',
                commonExamId: exam.id,
                timeLimitMinutes: 15,
                presentationTheme: 'knowledge-garden',
                status: 'ended',
                startedAt: Date.now() - 600000,
                endedAt: Date.now() - 60000,
                teams: [
                    { id: 't1', name: 'Đội 1', memberUsernames: ['hs1'], leaderUsername: 'hs1', score: 10, submittedCount: 10, status: 'completed' },
                    { id: 't2', name: 'Đội 2', memberUsernames: ['hs2'], leaderUsername: 'hs2', score: 10, submittedCount: 10, status: 'completed' }
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

        // Stadium canvas is preserved
        const stadium = page.locator('.team-race-stadium--knowledge-garden');
        await expect(stadium).toBeVisible();

        const canvas = stadium.locator('.team-stadium-canvas');
        await expect(canvas).toBeVisible();

        // Clock says "Đã kết thúc"
        const clock = stadium.locator('.team-race-clock strong');
        await expect(clock).toHaveText('Đã kết thúc');

        // Leaderboard says "Bảng xếp hạng chung cuộc"
        const scoreboard = stadium.locator('.team-race-scoreboard');
        await expect(scoreboard).toBeVisible();
        await expect(scoreboard.locator('p')).toHaveText('Bảng xếp hạng chung cuộc');

        // Verify stage-10 fruit-bearing tree is shown for 10/10 teams
        const potImg1 = stadium.locator('.team-stadium-lane--garden').nth(0).locator('.team-garden-pot__img');
        await expect(potImg1).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-1-stage-10.webp');

        const potImg2 = stadium.locator('.team-stadium-lane--garden').nth(1).locator('.team-garden-pot__img');
        await expect(potImg2).toHaveAttribute('src', './src/assets/team-competition/Garden/stages/team-2-stage-10.webp');

        // Both have Trĩu quả badge
        const badges = stadium.locator('.team-garden-finish-badge');
        await expect(badges).toHaveCount(2);
        await expect(badges.first()).toContainText('Trĩu quả');
    });
});
