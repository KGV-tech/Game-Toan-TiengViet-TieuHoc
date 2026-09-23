const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const targetDir = path.resolve(__dirname, '../src/assets/team-competition/Sea/vehicles');
  const artDir = 'C:/Users/htleh/.gemini/antigravity-ide/brain/a140c77a-307d-4b01-98ad-bffeca5b05d9';
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const boatsPngPath = path.resolve(__dirname, '../src/assets/team-competition/Sea/Boats v2.png');
  const fileUrl = 'file:///' + boatsPngPath.replace(/\\/g, '/');
  await page.goto(fileUrl);

  const boatSpecs = [
    { id: 1, name: 'cyan-squirrel', x1: 725, x2: 1083, y1: 543, y2: 1086, label: 'Thuyền Xanh Ngọc (Sóc Con)' },
    { id: 2, name: 'yellow-koala', x1: 725, x2: 1082, y1: 0, y2: 543, label: 'Thuyền Vàng (Gấu Koala)' },
    { id: 3, name: 'coral-monkey', x1: 0, x2: 353, y1: 0, y2: 543, label: 'Thuyền Đỏ (Khỉ Con)' },
    { id: 4, name: 'violet-hedgehog', x1: 1083, x2: 1448, y1: 0, y2: 543, label: 'Thuyền Tím (Nhím Tím)' },
    { id: 5, name: 'green-chick', x1: 0, x2: 352, y1: 543, y2: 1086, label: 'Thuyền Xanh Lá (Gà Con)' },
    { id: 6, name: 'pink-fawn', x1: 1084, x2: 1448, y1: 543, y2: 1086, label: 'Thuyền Hồng (Hươu Con)' },
    { id: 7, name: 'blue-penguin', x1: 354, x2: 724, y1: 0, y2: 543, label: 'Thuyền Xanh Dương (Chim Cánh Cụt)' },
    { id: 8, name: 'orange-raccoon', x1: 353, x2: 724, y1: 543, y2: 1086, label: 'Thuyền Cam (Gấu Mèo)' }
  ];

  for (const spec of boatSpecs) {
    const dataUrl = await page.evaluate(({ x1, x2, y1, y2 }) => {
      const img = document.querySelector('img');
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      const sCtx = srcCanvas.getContext('2d');
      sCtx.drawImage(img, 0, 0);

      const cellW = x2 - x1;
      const cellH = y2 - y1;

      // Find precise bounding box within this cell
      const imgData = sCtx.getImageData(x1, y1, cellW, cellH);
      let minX = cellW, maxX = 0, minY = cellH, maxY = 0;
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const a = imgData.data[(y * cellW + x) * 4 + 3];
          if (a > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;

      // Boats v2 has aspect ratio ~ 335 x 372
      // Standard target canvas: 360 x 400
      const targetW = 360;
      const targetH = 400;
      const outCanvas = document.createElement('canvas');
      outCanvas.width = targetW;
      outCanvas.height = targetH;
      const outCtx = outCanvas.getContext('2d');

      const scale = Math.min((targetW - 16) / cropW, (targetH - 16) / cropH);
      const drawW = cropW * scale;
      const drawH = cropH * scale;
      const drawX = (targetW - drawW) / 2;
      const drawY = (targetH - drawH) / 2;

      outCtx.drawImage(
        srcCanvas,
        x1 + minX, y1 + minY, cropW, cropH,
        drawX, drawY, drawW, drawH
      );

      return outCanvas.toDataURL('image/png');
    }, spec);

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const fileName = 'boat-' + spec.id + '.png';
    const outPath = path.join(targetDir, fileName);
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
    fs.copyFileSync(outPath, path.join(artDir, fileName));
    console.log(`Saved clean v2 ${fileName} (${spec.name}) -> ${outPath}`);
  }

  await browser.close();
  console.log('All 8 Boats v2 successfully extracted!');
})();
