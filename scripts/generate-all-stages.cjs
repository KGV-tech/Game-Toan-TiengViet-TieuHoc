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
        { teamNum: 1, file: 'Blue.png', color: 'cyan', seedX: 195, seedY: 183, patchRadius: 30 },
        { teamNum: 2, file: 'Yellow.png', color: 'yellow', seedX: 173, seedY: 218, patchRadius: 30 },
        { teamNum: 3, file: 'Red1.png', color: 'coral', seedX: 180, seedY: 205, patchRadius: 30 },
        { teamNum: 4, file: 'Purple.png', color: 'violet', seedX: 162, seedY: 221, patchRadius: 30 },
        { teamNum: 5, file: 'Green.png', color: 'green', seedX: 220, seedY: 168, patchRadius: 32 },
        { teamNum: 6, file: 'Pink.png', color: 'pink', seedX: 163, seedY: 216, patchRadius: 30 },
        { teamNum: 7, file: 'Brown.png', color: 'blue', seedX: 147, seedY: 289, patchRadius: 35 },
        { teamNum: 8, file: 'Orange.png', color: 'orange', seedX: 167, seedY: 229, patchRadius: 30 }
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
            
            // Full source canvas
            const srcCanvas = document.createElement('canvas');
            srcCanvas.width = w;
            srcCanvas.height = h;
            const sCtx = srcCanvas.getContext('2d');
            sCtx.drawImage(img, 0, 0);
            
            // If Red1, wipe the circular number badge on bottom of both rows
            if (cfg.file === 'Red1.png') {
                const imgData = sCtx.getImageData(0, 0, w, h);
                const d = imgData.data;
                for (let r = 0; r < 2; r++) {
                    const rowMinY = r === 0 ? 0 : splitY;
                    const rowMaxY = r === 0 ? splitY : h;
                    const cellW = w / 5;
                    for (let c = 0; c < 5; c++) {
                        const cx = Math.round((c + 0.5) * cellW);
                        // Row 0 badge Y is around 410, Row 1 badge Y is around 850
                        const cy = r === 0 ? 418 : 862;
                        for (let y = Math.max(rowMinY, cy - 35); y <= Math.min(rowMaxY - 1, cy + 35); y++) {
                            for (let x = cx - 35; x <= cx + 35; x++) {
                                if (Math.hypot(x - cx, y - cy) < 28) {
                                    d[(y * w + x) * 4 + 3] = 0;
                                }
                            }
                        }
                    }
                }
                sCtx.putImageData(imgData, 0, 0);
            }
            
            // Column boundaries
            const cellW = w / 5;
            
            // Find max width and max height among all 10 stages for this team
            // Also find pot bottom Y for row 0 and row 1
            const cellBoxes = [];
            for (let i = 0; i < 10; i++) {
                const r = Math.floor(i / 5);
                const c = i % 5;
                const minX = Math.round(c * cellW);
                const maxX = Math.round((c + 1) * cellW);
                const minY = r === 0 ? 0 : splitY;
                const maxY = r === 0 ? splitY : h;
                
                // Get image data of this cell to find content bounding box & pot bottom
                const cellData = sCtx.getImageData(minX, minY, maxX - minX, maxY - minY).data;
                const cw = maxX - minX;
                const ch = maxY - minY;
                
                let bMinX = cw, bMaxX = 0, bMinY = ch, bMaxY = 0;
                for (let y = 0; y < ch; y++) {
                    for (let x = 0; x < cw; x++) {
                        const alpha = cellData[(y * cw + x) * 4 + 3];
                        if (alpha > 20) {
                            if (x < bMinX) bMinX = x;
                            if (x > bMaxX) bMaxX = x;
                            if (y < bMinY) bMinY = y;
                            if (y > bMaxY) bMaxY = y;
                        }
                    }
                }
                cellBoxes.push({ minX, maxX, minY, maxY, bMinX, bMaxX, bMinY, bMaxY, contentW: bMaxX - bMinX, contentH: bMaxY - bMinY });
            }
            
            // Find reference pot bottom in row 0 (from stage 1) and row 1 (from stage 10)
            const potBottomRow0 = cellBoxes[0].bMaxY;
            const potBottomRow1 = cellBoxes[9].bMaxY;
            
            // Max height needed above pot bottom
            let maxAbovePotBottom = 0;
            for (let i = 0; i < 10; i++) {
                const r = Math.floor(i / 5);
                const potBottom = r === 0 ? potBottomRow0 : potBottomRow1;
                const above = potBottom - cellBoxes[i].bMinY;
                if (above > maxAbovePotBottom) maxAbovePotBottom = above;
            }
            
            // Max width needed
            let maxContentW = 0;
            for (let i = 0; i < 10; i++) {
                if (cellBoxes[i].contentW > maxContentW) maxContentW = cellBoxes[i].contentW;
            }
            
            const targetW = Math.ceil(maxContentW + 20); // 10px padding each side
            const targetH = Math.ceil(maxAbovePotBottom + 20); // padding
            const potAnchorY = targetH - 10; // place pot bottom 10px above canvas bottom
            const potAnchorX = Math.round(targetW / 2);
            
            // Now generate each stage 1..10
            const teamImages = {};
            
            for (let i = 0; i < 10; i++) {
                const stageNum = i + 1;
                const r = Math.floor(i / 5);
                const c = i % 5;
                const box = cellBoxes[i];
                
                canvas.width = targetW;
                canvas.height = targetH;
                ctx.clearRect(0, 0, targetW, targetH);
                
                // Pot center X in source cell:
                // We use center of stone pot, which is box.minX + (box.bMinX + box.bMaxX) / 2
                // or roughly the cell center
                const srcPotCenterX = box.minX + Math.round((cellBoxes[0].bMinX + cellBoxes[0].bMaxX) / 2);
                const srcPotBottomY = (r === 0 ? potBottomRow0 : potBottomRow1) + box.minY;
                
                // Source rect to crop:
                const srcCropX = Math.round(srcPotCenterX - targetW / 2);
                const srcCropY = Math.round(srcPotBottomY - potAnchorY);
                
                ctx.drawImage(srcCanvas, srcCropX, srcCropY, targetW, targetH, 0, 0, targetW, targetH);
                teamImages[`stage-${stageNum}`] = canvas.toDataURL('image/png');
                
                // If stage 1, also create Stage 0 (Empty soil pot)
                if (stageNum === 1) {
                    const stage0Canvas = document.createElement('canvas');
                    stage0Canvas.width = targetW;
                    stage0Canvas.height = targetH;
                    const s0Ctx = stage0Canvas.getContext('2d');
                    s0Ctx.drawImage(canvas, 0, 0);
                    
                    // Inpaint seed on stage 0
                    // Seed coordinates on this canvas:
                    const targetSeedX = Math.round(cfg.seedX - (srcCropX - box.minX));
                    const targetSeedY = Math.round(cfg.seedY - (srcCropY - box.minY));
                    
                    // Patch from clean soil (sample from left of seed)
                    const rad = cfg.patchRadius;
                    const patchCanvas = document.createElement('canvas');
                    patchCanvas.width = rad * 2;
                    patchCanvas.height = rad * 2;
                    const pCtx = patchCanvas.getContext('2d');
                    
                    // Sample from left
                    pCtx.drawImage(stage0Canvas, targetSeedX - rad * 2.3, targetSeedY - rad, rad * 2, rad * 2, 0, 0, rad * 2, rad * 2);
                    
                    // Mask
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
    console.log('Successfully generated all 88 stage images!');
    
    await browser.close();
    fs.unlinkSync(tempHtml);
})();
