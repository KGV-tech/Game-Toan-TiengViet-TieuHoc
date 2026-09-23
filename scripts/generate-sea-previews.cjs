const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const seaDir = path.resolve(__dirname, '../src/assets/team-competition/Sea');
  const artDir = 'C:/Users/htleh/.gemini/antigravity-ide/brain/a140c77a-307d-4b01-98ad-bffeca5b05d9';

  function toBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }

  const seaBg = toBase64(path.join(seaDir, 'Sea.png'));
  const treasureImg = toBase64(path.join(seaDir, 'Treasure.png'));

  const boatSpecs = [
    { id: 1, color: '#25e1fc', name: 'Đội 1 (Sóc)', laneColor: 'cyan', score: 0 },
    { id: 2, color: '#fee732', name: 'Đội 2 (Koala)', laneColor: 'yellow', score: 0 },
    { id: 3, color: '#fe6b5e', name: 'Đội 3 (Khỉ)', laneColor: 'coral', score: 0 },
    { id: 4, color: '#a963fa', name: 'Đội 4 (Nhím)', laneColor: 'violet', score: 0 },
    { id: 5, color: '#35d063', name: 'Đội 5 (Gà)', laneColor: 'green', score: 0 },
    { id: 6, color: '#fc78bc', name: 'Đội 6 (Hươu)', laneColor: 'pink', score: 0 },
    { id: 7, color: '#2494fd', name: 'Đội 7 (Cánh Cụt)', laneColor: 'blue', score: 0 },
    { id: 8, color: '#fd8d2f', name: 'Đội 8 (Gấu Mèo)', laneColor: 'orange', score: 0 }
  ];

  function getBoatWidthForTeamCount(count) {
    if (count <= 4) return 156;
    if (count === 5) return 117;
    return 78;
  }

  function buildBoardHtml({
    title,
    time,
    teams,
    winnerTeamId = null,
    boatWidth = null,
    customNote = ''
  }) {
    const count = teams.length;
    const finalBoatWidth = boatWidth || getBoatWidthForTeamCount(count);

    const minY = 23;
    const maxY = 94;
    const step = (maxY - minY) / count;

    const startX = 15;
    const maxTravel = 72.5;

    const lanesHtml = teams.map((t, idx) => {
      const topPct = minY + (idx + 0.5) * step;
      const boatSrc = toBase64(path.join(seaDir, `vehicles/boat-${t.id}.png`));
      const progress = (t.score / 10) * maxTravel;
      const boatLeft = startX + progress;
      const zIndex = 10 + idx;

      return `
        <div style="position: absolute; left: 0; right: 0; top: ${topPct}%; height: 0; z-index: ${zIndex};">
          <!-- Dock Team Badge (Height doubled: 52px, jade & gold accents) -->
          <div style="position: absolute; left: 0.8%; top: 0; transform: translateY(-50%); width: 148px; min-height: 52px; padding: 6px 12px; background: linear-gradient(135deg, color-mix(in srgb, ${t.color} 75%, #032d4a), rgba(1, 28, 48, 0.95)); border: 2px solid ${t.color}; border-radius: 14px; box-shadow: 0 5px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4); display: flex; justify-content: space-between; align-items: center; color: #fff; font-family: system-ui, sans-serif; backdrop-filter: blur(4px);">
            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
              <span style="font-size: 10px; color: ${t.color}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">Làn ${t.id}</span>
              <strong style="font-size: 14px; text-shadow: 0 1px 2px #000; font-weight: 900; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 82px;">${t.name}</strong>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <b style="font-size: 20px; color: #fff4a4; font-weight: 900; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">${t.score}</b>
              <span style="font-size: 9px; color: #67e8f9; font-weight: 800; opacity: 0.95;">điểm</span>
            </div>
          </div>
          <!-- Boat Sprite -->
          <div style="position: absolute; left: ${boatLeft}%; top: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; transition: left 0.8s ease;">
            <img src="${boatSrc}" style="width: ${finalBoatWidth}px; height: auto; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.45));" />
          </div>
        </div>
      `;
    }).join('');

    // Treasure chest (small 50% = 76px) on sandy beach at 94.5%
    let treasureHtml = '';
    if (winnerTeamId) {
      const winnerIdx = teams.findIndex(t => t.id === winnerTeamId);
      if (winnerIdx !== -1) {
        const topPct = minY + (winnerIdx + 0.5) * step;
        treasureHtml = `
          <div style="position: absolute; left: 94.5%; top: ${topPct}%; transform: translate(-50%, -50%); z-index: 35; text-align: center;">
            <div style="position: absolute; inset: -12px; background: radial-gradient(circle, rgba(255,235,120,0.9) 0%, rgba(255,180,0,0) 72%); border-radius: 50%; pointer-events: none;"></div>
            <img src="${treasureImg}" style="position: relative; width: 76px; height: auto; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.6));" />
            <div style="position: relative; margin-top: -3px; background: linear-gradient(135deg, #ffd700, #ff8c00); color: #431c00; font-family: system-ui, sans-serif; font-weight: 900; font-size: 10px; padding: 2px 8px; border-radius: 999px; border: 1.5px solid #fff; box-shadow: 0 3px 8px rgba(0,0,0,0.35); text-transform: uppercase; white-space: nowrap;">Kho Báu!</div>
          </div>
        `;
      }
    }

    const noteHtml = customNote ? `
      <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(2, 18, 38, 0.9); border: 1.5px solid #f59e0b; color: #fde68a; font-family: system-ui, sans-serif; font-size: 12px; font-weight: 700; padding: 5px 20px; border-radius: 999px; z-index: 40; box-shadow: 0 4px 15px rgba(0,0,0,0.6);">
        ${customNote}
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { width: 1440px; height: 900px; overflow: hidden; background: #000; font-family: system-ui, -apple-system, sans-serif; }
          .arena {
            position: relative; width: 1440px; height: 900px;
            background: url('${seaBg}') center / 100% 100% no-repeat;
          }
          /* HUD phối màu biển ngọc và vàng kim */
          .hero-bar {
            position: absolute; top: 8px; left: 20px; right: 20px;
            display: grid; grid-template-columns: 280px 170px 1fr; gap: 12px;
            z-index: 25;
          }
          .card {
            border: 1.5px solid #f59e0b;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(6, 68, 102, 0.92) 0%, rgba(2, 38, 70, 0.95) 60%, rgba(3, 22, 48, 0.98) 100%);
            box-shadow: inset 0 1px 1px rgba(125, 237, 255, 0.4), 0 0 14px rgba(245, 158, 11, 0.22), 0 8px 20px rgba(0, 14, 38, 0.45);
            backdrop-filter: blur(8px);
            color: #fff;
            padding: 8px 14px;
            display: flex; flex-direction: column; justify-content: center;
          }
          .title-card h2 {
            font-size: 20px; font-weight: 900; text-align: center;
            color: #fffbeb; text-shadow: 0 2px 0 #78350f, 0 0 16px rgba(251, 191, 36, 0.55);
            letter-spacing: 0.03em;
          }
          .clock-card { text-align: center; }
          .clock-card span { font-size: 10px; text-transform: uppercase; letter-spacing: 0.09em; color: #67e8f9; font-weight: 900; }
          .clock-card strong { font-size: 26px; line-height: 1; color: #fef08a; text-shadow: 0 2px 0 #78350f, 0 0 12px rgba(251, 191, 36, 0.7); }
          .scoreboard { padding: 6px 12px; }
          .scoreboard p { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: #fde68a; margin-bottom: 4px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.6); }
          .scoreboard ol { display: grid; grid-template-columns: repeat(${teams.length}, 1fr); gap: 6px; list-style: none; }
          .sb-item {
            padding: 3px; border-radius: 8px; text-align: center; font-weight: 900;
            display: flex; flex-direction: column; align-items: center; gap: 1px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
          .sb-item span { width: 16px; height: 16px; border-radius: 50%; background: #fffbeb; color: #78350f; font-size: 9px; display: grid; place-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
          .sb-item strong { font-size: 9px; color: #03204e; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 100%; }
          .sb-item b { font-size: 12px; color: #03204e; }
        </style>
      </head>
      <body>
        <div class="arena">
          <header class="hero-bar">
            <div class="card title-card">
              <h2>${title}</h2>
            </div>
            <div class="card clock-card">
              <span>Thời gian còn lại</span>
              <strong>${time}</strong>
            </div>
            <div class="card scoreboard">
              <p>Bảng xếp hạng tạm thời</p>
              <ol>
                ${teams.map((t, i) => `
                  <li class="sb-item" style="background: ${t.color}; border: 1.5px solid rgba(255,255,255,0.85);">
                    <span>${i + 1}</span>
                    <strong>${t.name}</strong>
                    <b>${t.score}</b>
                  </li>
                `).join('')}
              </ol>
            </div>
          </header>
          ${lanesHtml}
          ${treasureHtml}
          ${noteHtml}
        </div>
      </body>
      </html>
    `;
  }

  // 1. preview-start.png
  const startHtml = buildBoardHtml({
    title: 'Đảo Kho Báu · Lớp 5A (8 Đội)',
    time: '15:00',
    teams: boatSpecs,
    winnerTeamId: null,
    customNote: 'HUD phối màu Biển Ngọc & Viền Vàng Kim hoàng tộc, bảng tên 52px, thuyền v2 78px'
  });
  await page.setContent(startHtml);
  const previewStartPath = path.join(seaDir, 'preview-start.png');
  await page.screenshot({ path: previewStartPath });
  fs.copyFileSync(previewStartPath, path.join(artDir, 'preview-start.png'));

  // 2. preview-finish-10pts.png
  const teamsWithWinner = [
    { ...boatSpecs[2], score: 10 },
    { ...boatSpecs[7], score: 9 },
    { ...boatSpecs[1], score: 8.5 },
    { ...boatSpecs[6], score: 7.5 },
    { ...boatSpecs[0], score: 7 },
    { ...boatSpecs[4], score: 6 },
    { ...boatSpecs[3], score: 5 },
    { ...boatSpecs[5], score: 4 }
  ];
  const winnerHtml = buildBoardHtml({
    title: 'Đảo Kho Báu · Đội 3 Cập Bến Đảo Kho Báu!',
    time: '04:22',
    teams: teamsWithWinner,
    winnerTeamId: 3,
    customNote: 'HUD Biển Ngọc & Vàng Kim hoàng tộc, thuyền 10 điểm sát cát, rương mở trước mũi thuyền'
  });
  await page.setContent(winnerHtml);
  const previewWinnerPath = path.join(seaDir, 'preview-finish-10pts.png');
  await page.screenshot({ path: previewWinnerPath });
  fs.copyFileSync(previewWinnerPath, path.join(artDir, 'preview-finish-10pts.png'));

  // 3. preview-5-teams.png
  const fiveTeams = [
    { ...boatSpecs[0], score: 0 },
    { ...boatSpecs[1], score: 0 },
    { ...boatSpecs[2], score: 0 },
    { ...boatSpecs[3], score: 0 },
    { ...boatSpecs[4], score: 0 }
  ];
  const fiveTeamsHtml = buildBoardHtml({
    title: 'Đảo Kho Báu · 5 Đội (Size Tăng 1.5 Lần: 117px)',
    time: '15:00',
    teams: fiveTeams,
    winnerTeamId: null,
    boatWidth: 117,
    customNote: 'HUD Biển Ngọc & Vàng Kim hoàng tộc, 5 đội thuyền v2 tăng 1.5 lần (117px)'
  });
  await page.setContent(fiveTeamsHtml);
  const preview5TeamsPath = path.join(seaDir, 'preview-5-teams.png');
  await page.screenshot({ path: preview5TeamsPath });
  fs.copyFileSync(preview5TeamsPath, path.join(artDir, 'preview-5-teams.png'));

  // 4. preview-3-teams.png
  const threeTeams = [
    { ...boatSpecs[1], name: 'Đội Vàng', score: 8 },
    { ...boatSpecs[0], name: 'Đội Xanh Ngọc', score: 6 },
    { ...boatSpecs[2], name: 'Đội Đỏ', score: 4 }
  ];
  const threeTeamsHtml = buildBoardHtml({
    title: 'Đảo Kho Báu · 3 Đội (Size Gấp Đôi: 156px)',
    time: '09:40',
    teams: threeTeams,
    winnerTeamId: null,
    boatWidth: 156,
    customNote: 'HUD Biển Ngọc & Vàng Kim hoàng tộc, 3 đội thuyền v2 tăng gấp đôi (156px)'
  });
  await page.setContent(threeTeamsHtml);
  const preview3TeamsPath = path.join(seaDir, 'preview-3-teams.png');
  await page.screenshot({ path: preview3TeamsPath });
  fs.copyFileSync(preview3TeamsPath, path.join(artDir, 'preview-3-teams.png'));

  await browser.close();
  console.log('All Jade Sea & Gold HUD previews successfully generated!');
})();
