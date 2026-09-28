const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ args: ['--disable-web-security'] });
    const page = await browser.newPage();
    const gardenDir = path.resolve('./src/assets/team-competition/Garden');
    const stagesDir = path.join(gardenDir, 'stages');
    if (!fs.existsSync(stagesDir)) fs.mkdirSync(stagesDir, { recursive: true });

    // Team to sprite sheet mapping (Cyan = Blueberries, Brown = Coconuts)
    const teamConfigs = [
        { teamNum: 1, file: 'Blue.webp', color: 'cyan', seedX: 189, seedY: 198, patchRadius: 32 },
        { teamNum: 2, file: 'Yellow.webp', color: 'yellow', seedX: 180, seedY: 242, patchRadius: 32 },
        { teamNum: 3, file: 'Red1.webp', color: 'coral', seedX: 184, seedY: 220, patchRadius: 32 },
        { teamNum: 4, file: 'Purple.webp', color: 'violet', seedX: 164, seedY: 236, patchRadius: 32 },
        { teamNum: 5, file: 'Green.webp', color: 'green', seedX: 206, seedY: 182, patchRadius: 34 },
        { teamNum: 6, file: 'Pink.webp', color: 'pink', seedX: 168, seedY: 232, patchRadius: 32 },
        { teamNum: 7, file: 'Brown.webp', color: 'blue', seedX: 150, seedY: 308, patchRadius: 36 },
        { teamNum: 8, file: 'Orange.webp', color: 'orange', seedX: 168, seedY: 242, patchRadius: 32 }
    ];

    const base64Map = {};
    for (const cfg of teamConfigs) {
        base64Map[cfg.file] = 'data:image/webp;base64,' + fs.readFileSync(path.join(gardenDir, cfg.file)).toString('base64');
    }

    const html = `<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`;
    const tempHtml = path.join(gardenDir, '_generate.html');
    fs.writeFileSync(tempHtml, html);
    await page.goto('file://' + tempHtml.replace(/\\/g, '/'));

    const outputImages = await page.evaluate(async ({ teamConfigs, base64Map }) => {
        const splitYs = {
            'Blue.webp': 301,
            'Brown.webp': 443,
            'Green.webp': 293,
            'Orange.webp': 398,
            'Pink.webp': 388,
            'Purple.webp': 409,
            'Red1.webp': 398,
            'Yellow.webp': 367
        };

        const TARGET_W = 500;
        const TARGET_H = 650;
        const TARGET_POT_W = 390;
        const POT_ANCHOR_X = 250;
        const POT_ANCHOR_Y = 635;

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

            const cellW = w / 5;

            // Wipe Red1 number badges if Red1
            if (cfg.file === 'Red1.webp') {
                const imgData = sCtx.getImageData(0, 0, w, h);
                const d = imgData.data;
                for (let c = 0; c < 5; c++) {
                    const cx = Math.round((c + 0.5) * cellW);
                    // Row 0 badges & hanging ring
                    for (let y = 328; y <= 420; y++) {
                        for (let x = cx - 38; x <= cx + 38; x++) {
                            d[(y * w + x) * 4 + 3] = 0;
                        }
                    }
                    // Row 1 badges & hanging ring
                    for (let y = 785; y <= 880; y++) {
                        for (let x = cx - 38; x <= cx + 38; x++) {
                            d[(y * w + x) * 4 + 3] = 0;
                        }
                    }
                }
                sCtx.putImageData(imgData, 0, 0);
            }

            // Measure cell 0 (Stage 1) to determine exact pot width and center
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
            const scale = TARGET_POT_W / rawPotW;
            const potRelCenterXRow0 = (bMinX + bMaxX) / 2;
            const potRelBottomYRow0 = bMaxY;

            // Measure cell 5 (Stage 6) pot bottom in row 1
            const c5H = h - splitY;
            const c5Data = sCtx.getImageData(0, splitY, c0W, c5H).data;
            let c5MaxY = 0;
            for (let y = 0; y < c5H; y++) {
                for (let x = 0; x < c0W; x++) {
                    if (c5Data[(y * c0W + x) * 4 + 3] > 20) {
                        if (y > c5MaxY) c5MaxY = y;
                    }
                }
            }

            const potRelCenterXRow1 = potRelCenterXRow0;
            const potRelBottomYRow1 = c5MaxY;

            const teamImages = {};

            for (let i = 0; i < 10; i++) {
                const stageNum = i + 1;
                const r = Math.floor(i / 5);
                const c = i % 5;

                const srcX = Math.round(c * cellW);
                const srcY = r === 0 ? 0 : splitY;
                const srcW = Math.round((c + 1) * cellW) - srcX;
                const srcH = r === 0 ? splitY : (h - splitY);

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
                teamImages[`stage-${stageNum}`] = canvas.toDataURL('image/webp', 0.92);

                // If stage 1, also create Stage 0 (Empty soil pot)
                if (stageNum === 1) {
                    const stage0Canvas = document.createElement('canvas');
                    stage0Canvas.width = TARGET_W;
                    stage0Canvas.height = TARGET_H;
                    const s0Ctx = stage0Canvas.getContext('2d');
                    s0Ctx.drawImage(canvas, 0, 0);

                    // Seed coordinates on transformed canvas
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
                    teamImages['stage-0'] = stage0Canvas.toDataURL('image/webp', 0.92);
                }
            }

            result[cfg.teamNum] = teamImages;
        }

        return result;
    }, { teamConfigs, base64Map });

    // Protect the user-provided stage WebP files unless overwrite is explicitly requested.
    const overwriteExistingStages = process.argv.includes('--overwrite-existing-stages');

    // Write out all 88 stage files
    for (const teamNum of Object.keys(outputImages)) {
        const stages = outputImages[teamNum];
        for (const [stageKey, dataUrl] of Object.entries(stages)) {
            const fileName = `team-${teamNum}-${stageKey}.webp`;
            const filePath = path.join(stagesDir, fileName);
            if (fs.existsSync(filePath) && !overwriteExistingStages) {
                throw new Error(`Refusing to overwrite ${fileName}; pass --overwrite-existing-stages to replace existing stage images.`);
            }
            const base64Data = dataUrl.replace(/^data:image\/webp;base64,/, '');
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        }
    }
    console.log('Successfully regenerated all 88 stage images at standard 500x650 canvas with normalized pot width 390px!');

    await browser.close();
    fs.unlinkSync(tempHtml);
})();
