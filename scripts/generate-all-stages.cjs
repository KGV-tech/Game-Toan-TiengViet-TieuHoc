const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ args: ['--disable-web-security'] });
    const page = await browser.newPage();
    const gardenDir = path.resolve('./src/assets/team-competition/Garden');
    const stagesDir = path.join(gardenDir, 'stages');
    if (!fs.existsSync(stagesDir)) fs.mkdirSync(stagesDir, { recursive: true });

    // Team to file mapping
    const teamConfigs = [
        { teamNum: 1, file: 'Blue.png', color: 'cyan', seedX: 195, seedY: 183, patchRadius: 28 },
        { teamNum: 2, file: 'Yellow.png', color: 'yellow', seedX: 173, seedY: 218, patchRadius: 28 },
        { teamNum: 3, file: 'Red1.png', color: 'coral', seedX: 180, seedY: 205, patchRadius: 28 },
        { teamNum: 4, file: 'Purple.png', color: 'violet', seedX: 162, seedY: 221, patchRadius: 28 },
        { teamNum: 5, file: 'Green.png', color: 'green', seedX: 220, seedY: 168, patchRadius: 30 },
        { teamNum: 6, file: 'Pink.png', color: 'pink', seedX: 163, seedY: 216, patchRadius: 28 },
        { teamNum: 7, file: 'Brown.png', color: 'blue', seedX: 147, seedY: 289, patchRadius: 32 },
        { teamNum: 8, file: 'Orange.png', color: 'orange', seedX: 167, seedY: 229, patchRadius: 28 }
    ];

    const base64Map = {};
    for (const cfg of teamConfigs) {
        base64Map[cfg.file] = 'data:image/png;base64,' + fs.readFileSync(path.join(gardenDir, cfg.file)).toString('base64');
    }

    const html = `<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`;
    const tempHtml = path.join(gardenDir, '_generate.html');
    fs.writeFileSync(tempHtml, html);
    await page.goto('file://' + tempHtml.replace(/\\/g, '/'));

    const outputImages = await page.evaluate(async ({ teamConfigs, base64Map }) => {
        const splitYs = {
            'Blue.png': 301,
            'Brown.png': 443,
            'Green.png': 293,
            'Orange.png': 398,
            'Pink.png': 388,
            'Purple.png': 409,
            'Red1.png': 398,
            'Yellow.png': 367
        };

        const TARGET_W = 420;
        const TARGET_H = 580;
        const TARGET_POT_W = 300;
        const POT_ANCHOR_X = 210;
        const POT_ANCHOR_Y = 556;

        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');
        const result = {};

        for (const cfg of teamConfigs) {
            const img = new Image();
            img.src = base64Map[cfg.file];
            await new Promise(r => { img.onload = r; });
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            const splitY = splitYs[cfg.file];

            const srcCanvas = document.createElement('canvas');
            srcCanvas.width = w;
            srcCanvas.height = h;
            const sCtx = srcCanvas.getContext('2d');
            sCtx.drawImage(img, 0, 0);

            // Wipe Red1 number badges if Red1
            if (cfg.file === 'Red1.png') {
                const imgData = sCtx.getImageData(0, 0, w, h);
                const d = imgData.data;
                const cellW = w / 5;
                for (let r = 0; r < 2; r++) {
                    const rowMinY = r === 0 ? 0 : splitY;
                    const rowMaxY = r === 0 ? splitY : h;
                    for (let c = 0; c < 5; c++) {
                        const cx = Math.round((c + 0.5) * cellW);
                        const cy = r === 0 ? 418 : 862;
                        for (let y = Math.max(rowMinY, cy - 50); y <= Math.min(rowMaxY - 1, cy + 50); y++) {
                            for (let x = cx - 50; x <= cx + 50; x++) {
                                if (Math.hypot(x - cx, y - cy) < 42) {
                                    d[(y * w + x) * 4 + 3] = 0;
                                }
                            }
                        }
                        // Also clear any rogue pixels below y=322 in row 0
                        if (r === 0) {
                            for (let y = 322; y < splitY; y++) {
                                for (let x = Math.round(c * cellW); x < Math.round((c + 1) * cellW); x++) {
                                    d[(y * w + x) * 4 + 3] = 0;
                                }
                            }
                        }
                    }
                }
                sCtx.putImageData(imgData, 0, 0);
            }

            const cellW = w / 5;

            // Measure cell 0 (Stage 1) to determine the pot width and center
            const c0W = Math.round(cellW);
            const c0Data = sCtx.getImageData(0, 0, c0W, splitY).data;
            let bMinX = c0W, bMaxX = 0, bMinY = splitY, bMaxY = 0;
            for (let y = 0; y < splitY; y++) {
                for (let x = 0; x < c0W; x++) {
                    if (c0Data[(y * c0W + x) * 4 + 3] > 20) {
                        if (x < bMinX) bMinX = x;
                        if (x > bMaxX) bMaxX = x;
                        if (y < bMinY) bMinY = y;
                        if (y > bMaxY) bMaxY = y;
                    }
                }
            }

            const rawPotW = bMaxX - bMinX + 1;
            const rawPotH = bMaxY - bMinY + 1;
            const scale = TARGET_POT_W / rawPotW;
            const potRelCenterXRow0 = (bMinX + bMaxX) / 2;
            const potRelBottomYRow0 = bMaxY;

            // Measure cell 9 (Stage 10) in row 1 for pot bottom in row 1
            const c9MinX = Math.round(4 * cellW);
            const c9MinY = splitY;
            const c9W = w - c9MinX;
            const c9H = h - c9MinY;
            const c9Data = sCtx.getImageData(c9MinX, c9MinY, c9W, c9H).data;
            let c9bMinX = c9W, c9bMaxX = 0, c9bMinY = c9H, c9bMaxY = 0;
            for (let y = 0; y < c9H; y++) {
                for (let x = 0; x < c9W; x++) {
                    if (c9Data[(y * c9W + x) * 4 + 3] > 20) {
                        if (x < c9bMinX) c9bMinX = x;
                        if (x > c9bMaxX) c9bMaxX = x;
                        if (y < c9bMinY) c9bMinY = y;
                        if (y > c9bMaxY) c9bMaxY = y;
                    }
                }
            }
            const potRelBottomYRow1 = c9bMaxY;
            const potRelCenterXRow1 = (c9bMinX + c9bMaxX) / 2;

            const teamImages = {};

            for (let i = 0; i < 10; i++) {
                const stageNum = i + 1;
                const r = Math.floor(i / 5);
                const c = i % 5;

                const srcX = Math.round(c * cellW);
                const srcY = r === 0 ? 0 : splitY;
                const srcW = Math.round((c + 1) * cellW) - srcX;
                const srcH = r === 0 ? splitY : (h - splitY);

                // Pot reference center X and bottom Y relative to cell
                const relPotCenterX = r === 0 ? potRelCenterXRow0 : potRelCenterXRow1;
                const relPotBottomY = r === 0 ? potRelBottomYRow0 : potRelBottomYRow1;

                canvas.width = TARGET_W;
                canvas.height = TARGET_H;
                ctx.clearRect(0, 0, TARGET_W, TARGET_H);

                const destW = srcW * scale;
                const destH = srcH * scale;
                const destX = Math.round(POT_ANCHOR_X - relPotCenterX * scale);
                const destY = Math.round(POT_ANCHOR_Y - relPotBottomY * scale);

                ctx.drawImage(srcCanvas, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
                teamImages[`stage-${stageNum}`] = canvas.toDataURL('image/png');

                // If stage 1, also create Stage 0 (Empty soil pot)
                if (stageNum === 1) {
                    const stage0Canvas = document.createElement('canvas');
                    stage0Canvas.width = TARGET_W;
                    stage0Canvas.height = TARGET_H;
                    const s0Ctx = stage0Canvas.getContext('2d');
                    s0Ctx.drawImage(canvas, 0, 0);

                    // Seed coordinates on the transformed canvas:
                    const targetSeedX = Math.round(POT_ANCHOR_X + (cfg.seedX - relPotCenterX) * scale);
                    const targetSeedY = Math.round(POT_ANCHOR_Y - (relPotBottomY - cfg.seedY) * scale);

                    // Patch from clean soil (sample from left of seed)
                    const rad = Math.round(cfg.patchRadius * scale);
                    const patchCanvas = document.createElement('canvas');
                    patchCanvas.width = rad * 2;
                    patchCanvas.height = rad * 2;
                    const pCtx = patchCanvas.getContext('2d');

                    pCtx.drawImage(stage0Canvas, targetSeedX - rad * 2.3, targetSeedY - rad, rad * 2, rad * 2, 0, 0, rad * 2, rad * 2);

                    const maskCanvas = document.createElement('canvas');
                    maskCanvas.width = rad * 2;
                    maskCanvas.height = rad * 2;
                    const mCtx = maskCanvas.getContext('2d');
                    const grad = mCtx.createRadialGradient(rad, rad, rad * 0.25, rad, rad, rad);
                    grad.addColorStop(0, 'rgba(0,0,0,1)');
                    grad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    mCtx.fillStyle = grad;
                    mCtx.fillRect(0, 0, rad * 2, rad * 2);

                    pCtx.globalCompositeOperation = 'destination-in';
                    pCtx.drawImage(maskCanvas, 0, 0);

                    s0Ctx.drawImage(patchCanvas, targetSeedX - rad, targetSeedY - rad);
                    teamImages['stage-0'] = stage0Canvas.toDataURL('image/png');
                }
            }

            result[cfg.teamNum] = teamImages;
        }

        return result;
    }, { teamConfigs, base64Map });

    // Write out all files
    for (const teamNum of Object.keys(outputImages)) {
        const stages = outputImages[teamNum];
        for (const [stageKey, dataUrl] of Object.entries(stages)) {
            const fileName = `team-${teamNum}-${stageKey}.png`;
            const filePath = path.join(stagesDir, fileName);
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        }
    }
    console.log('Successfully regenerated all 88 stage images at standard 420x580 canvas!');

    await browser.close();
    fs.unlinkSync(tempHtml);
})();
