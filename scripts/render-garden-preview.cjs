const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-web-security', '--no-sandbox']
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    // Create preview start HTML
    const bgPath = path.resolve('./src/assets/team-competition/Garden/BG.webp').replace(/\\/g, '/');
    const stylePath = path.resolve('./src/style.css').replace(/\\/g, '/');
    
    const teamCompetitionModule = require(path.resolve('./src/modules/team-competition.js'));
    const lanes = teamCompetitionModule.STADIUM_LANES;
    
    const teamCards = Array.from({ length: 8 }, (_, index) => {
        const lane = lanes[index];
        const gardenPos = teamCompetitionModule.getGardenTeamPosition(index, 8);
        const potAsset = `./stages/team-${lane.number}-stage-0.webp`;
        const teamName = `Nhóm ${index + 1}`;
        const score = 0;
        const rank = 1;
        
        return `<article class="team-stadium-lane team-stadium-lane--garden team-stadium-lane--${lane.color} team-stadium-lane--active" data-stadium-lane="${lane.number}" style="--garden-left:${gardenPos.leftPct.toFixed(2)}%; --garden-top:${gardenPos.topPct.toFixed(2)}%; --garden-scale:${gardenPos.scale}; --garden-z:${gardenPos.zIndex}" aria-label="${teamName}"><div class="team-garden-pot"><div class="team-garden-pot__plant"><div class="team-garden-pot__shadow"></div><img class="team-stadium-lane__vehicle team-garden-pot__img" src="${potAsset}" alt="Bồn cây ${teamName}" /></div><div class="team-garden-pot__badge team-garden-pot__badge--${lane.color}"><span class="team-garden-pot__rank">${rank}</span><div class="team-garden-pot__info"><strong class="team-garden-pot__name">${teamName}</strong><div class="team-garden-pot__score"><b>${score}</b><small>Điểm</small></div></div></div></div></article>`;
    }).join('');
    
    const scoreboardEntries = Array.from({ length: 8 }, (_, index) => {
        const lane = lanes[index];
        return `<li class="team-race-scoreboard__entry team-race-scoreboard__entry--garden team-race-scoreboard__entry--${lane.color}" data-rank="1"><span>1</span><strong>Nhóm ${index + 1}</strong><div class="team-race-scoreboard__score"><b>0</b><small class="team-race-scoreboard__score-unit">Điểm</small></div></li>`;
    }).join('');
    
    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="file:///${stylePath}">
        <style>
            html, body {
                margin: 0;
                padding: 0;
                width: 1440px;
                height: 900px;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #treasure-modal.team-board-fullscreen {
                width: 1440px;
                height: 900px;
                display: block;
                position: relative;
            }
            .team-competition-board--live, .team-race-stadium--knowledge-garden {
                width: 100%;
                height: 100%;
            }
            .team-stadium-canvas {
                width: 100%;
                height: 100%;
                background: url('file:///${bgPath}') center bottom / cover no-repeat !important;
            }
        </style>
    </head>
    <body>
        <div id="treasure-modal" class="team-board-fullscreen team-board-fullscreen-mode">
            <section class="team-competition-board team-competition-board--live team-competition-board--knowledge-garden">
                <div class="team-race-stadium team-race-stadium--knowledge-garden">
                    <header class="team-board-hero">
                        <div class="team-stadium-title-card"><h2>Thử thách Khu Vườn Tri Thức</h2></div>
                        <div class="team-race-clock"><span>Thời gian còn lại</span><strong>15:00</strong></div>
                        <aside class="team-race-scoreboard" aria-label="Bảng xếp hạng tạm thời">
                            <p>Bảng xếp hạng tạm thời</p>
                            <ol>${scoreboardEntries}</ol>
                        </aside>
                    </header>
                    <div class="team-stadium-canvas" aria-label="Khu Vườn Tri Thức">
                        <div class="team-stadium-canvas__lanes">${teamCards}</div>
                    </div>
                </div>
            </section>
        </div>
    </body>
    </html>
    `;
    
    const gardenDir = path.resolve('./src/assets/team-competition/Garden');
    const previewHtmlPath = path.join(gardenDir, '_render_preview.html');
    fs.writeFileSync(previewHtmlPath, html);
    
    await page.goto('file:///' + previewHtmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    
    const previewOutPath = path.join(gardenDir, 'preview-start.webp');
    const previewPng = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
    const previewWebpBase64 = await page.evaluate(async (pngDataUrl) => {
        const image = new Image();
        image.src = pngDataUrl;
        await image.decode();

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.92));
        if (!blob || blob.type !== 'image/webp') throw new Error('Browser cannot encode preview as WebP.');

        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 32768) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
        }
        return btoa(binary);
    }, `data:image/png;base64,${previewPng.toString('base64')}`);
    fs.writeFileSync(previewOutPath, Buffer.from(previewWebpBase64, 'base64'));
    console.log('Saved preview-start.webp:', previewOutPath);
    
    await browser.close();
    fs.unlinkSync(previewHtmlPath);
})();
