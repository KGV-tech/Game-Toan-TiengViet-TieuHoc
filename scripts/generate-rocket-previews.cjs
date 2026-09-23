const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const rocketDir = path.resolve(__dirname, '../src/assets/team-competition/Rockets');
  const artDir = 'C:/Users/htleh/.gemini/antigravity-ide/brain/a140c77a-307d-4b01-98ad-bffeca5b05d9';

  function toBase64(filePath) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }

  const bgImg = toBase64(path.join(rocketDir, 'BG.png'));

  const rocketSpecs = [
    { id: 1, color: '#d97706', name: 'Đội Gấu Nâu', animal: 'Gấu con', score: 0 },
    { id: 2, color: '#2563eb', name: 'Đội Cú Xanh', animal: 'Cú mèo', score: 0 },
    { id: 3, color: '#eab308', name: 'Đội Hổ Vàng', animal: 'Hổ con', score: 0 },
    { id: 4, color: '#16a34a', name: 'Đội Ếch Xanh', animal: 'Ếch con', score: 0 },
    { id: 5, color: '#ea580c', name: 'Đội Corgi Cam', animal: 'Chó Corgi', score: 0 },
    { id: 6, color: '#9333ea', name: 'Đội Bạch Tuộc', animal: 'Bạch tuộc', score: 0 },
    { id: 7, color: '#06b6d4', name: 'Đội Khủng Long', animal: 'Khủng long', score: 0 },
    { id: 8, color: '#ec4899', name: 'Đội Thỏ Hồng', animal: 'Thỏ con', score: 0 }
  ];

  // Helper to build mockup HTML
  function buildBoardHtml({
    title = 'Chuyến Bay Vào Không Gian Lớp 5A',
    timer = '14:25',
    teams,
    customNote = ''
  }) {
    const count = teams.length;
    const maxScore = Math.max(0, ...teams.map(t => t.score));
    const maxProgress = maxScore / 10;
    // Camera scroll from 100% (launch pad) down to 0% (space citadel)
    const bgYPos = (100 - maxProgress * 100).toFixed(1);

    // Sorted teams for leaderboard
    const rankedTeams = [...teams].sort((a, b) => b.score - a.score);

    // Lane positioning
    const minCenterPct = 5.5;
    const maxCenterPct = 94.5;

    const lanesHtml = teams.map((t, idx) => {
      const rocketSrc = toBase64(path.join(rocketDir, `vehicles/rocket-${t.id}.png`));
      const centerPct = count <= 1
        ? 50
        : minCenterPct + (idx / (count - 1)) * (maxCenterPct - minCenterPct);

      // Rocket altitude from bottom: 3% (start on pad) up to 48% (space destination)
      const altitudePct = 3 + (t.score / 10) * 44;
      const rank = rankedTeams.findIndex(rt => rt.id === t.id) + 1;

      return `
        <div style="position: absolute; left: ${centerPct.toFixed(2)}%; bottom: 0; width: 0; height: 100%; z-index: 5;">
          <!-- Rocket Vehicle -->
          <div style="position: absolute; left: 0; bottom: ${altitudePct.toFixed(2)}%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; transition: bottom 0.8s ease;">
            
            <!-- Floating Team Info Badge above rocket -->
            <div style="margin-bottom: 8px; padding: 4px 10px; background: linear-gradient(135deg, rgba(6, 24, 60, 0.92), rgba(2, 10, 30, 0.96)); border: 1.5px solid ${t.color}; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 10px ${t.color}66; display: flex; align-items: center; gap: 6px; white-space: nowrap; backdrop-filter: blur(6px);">
              <span style="font-size: 11px; font-weight: 900; color: #fff; text-shadow: 0 1px 2px #000;">${t.name}</span>
              <span style="background: ${t.color}; color: #020b1e; font-size: 11px; font-weight: 900; padding: 1px 6px; border-radius: 999px;">${t.score}đ</span>
            </div>

            <!-- Rocket Sprite -->
            <img src="${rocketSrc}" style="width: clamp(100px, 9vw, 132px); height: auto; filter: drop-shadow(0 10px 16px rgba(0,0,0,0.55)); transform-origin: 50% 30%;" />

            ${t.score === 10 ? `
              <div style="margin-top: 4px; background: linear-gradient(135deg, #ffd700, #ff8c00); color: #051329; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 999px; border: 1.5px solid #fff; box-shadow: 0 0 12px #ffd700; text-transform: uppercase;">
                ⭐ ĐẾN TRẠM!
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Leaderboard entries
    const leaderboardEntriesHtml = rankedTeams.map((t, idx) => {
      const rank = idx + 1;
      const isTop1 = rank === 1 && t.score > 0;
      const rankBadgeBg = rank === 1 ? '#ffd700' : (rank === 2 ? '#e2e8f0' : (rank === 3 ? '#f97316' : 'rgba(255,255,255,0.15)'));
      const rankBadgeColor = rank <= 3 ? '#0f172a' : '#94a3b8';

      return `
        <li style="display: grid; grid-template-columns: 22px 1fr auto; align-items: center; gap: 7px; padding: 5px 8px; border-radius: 9px; background: ${isTop1 ? 'linear-gradient(90deg, rgba(255,215,0,0.18), rgba(2,16,42,0.6))' : 'rgba(2, 18, 48, 0.55)'}; border: 1px solid ${isTop1 ? 'rgba(255,215,0,0.45)' : 'rgba(100, 200, 255, 0.12)'};">
          <span style="display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: ${rankBadgeBg}; color: ${rankBadgeColor}; font-weight: 900; font-size: 11px;">${rank}</span>
          <strong style="color: #fff; font-size: 12px; font-weight: 800; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${t.name}</strong>
          <b style="color: #67e8f9; font-size: 13px; font-weight: 900;">${t.score} <small style="font-size: 9px; opacity: 0.8;">đ</small></b>
        </li>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 1440px;
            height: 900px;
            overflow: hidden;
            background: #020b1e;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            user-select: none;
          }
          .arena {
            position: relative;
            width: 1440px;
            height: 900px;
            background: #020b1e url('${bgImg}') center ${bgYPos}% / 100% auto no-repeat;
            transition: background-position 1.2s cubic-bezier(0.25, 1, 0.5, 1);
          }
          .vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(2, 11, 30, 0.45) 100%);
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="arena">
          <div class="vignette"></div>

          <!-- TOP-RIGHT FULLSCREEN EXIT BUTTON -->
          <button style="position: absolute; top: 16px; right: 18px; width: 38px; height: 38px; border-radius: 50%; border: 1.5px solid rgba(100, 220, 255, 0.4); background: rgba(3, 21, 61, 0.75); color: #fff; font-size: 1.15rem; font-weight: 700; cursor: pointer; display: grid; place-items: center; backdrop-filter: blur(8px); z-index: 50;">✕</button>

          <!-- LEFT VERTICAL HUD COLUMN (Sci-Fi Deep Space Theme) -->
          <aside style="position: absolute; top: 14px; bottom: 14px; left: 14px; width: 220px; z-index: 20; display: flex; flex-direction: column; gap: 10px;">
            
            <!-- HUD 1: Title Card -->
            <div style="padding: 12px 14px; border-radius: 16px; background: linear-gradient(135deg, rgba(6, 26, 68, 0.92) 0%, rgba(2, 14, 42, 0.96) 100%); border: 1.5px solid #00f0ff; box-shadow: 0 6px 20px rgba(0, 240, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.3); text-align: center; backdrop-filter: blur(10px);">
              <span style="font-size: 10px; font-weight: 900; letter-spacing: 0.1em; color: #00f0ff; text-transform: uppercase;">✦ SÂN PHÓNG VŨ TRỤ ✦</span>
              <h2 style="margin: 4px 0 0; font-size: 15px; font-weight: 900; color: #fff; text-shadow: 0 0 12px rgba(0,240,255,0.6); line-height: 1.25;">${title}</h2>
            </div>

            <!-- HUD 2: Space Clock -->
            <div style="padding: 8px 12px; border-radius: 14px; background: linear-gradient(135deg, rgba(6, 26, 68, 0.92) 0%, rgba(2, 14, 42, 0.96) 100%); border: 1.5px solid #ffd700; box-shadow: 0 6px 18px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.3); text-align: center; backdrop-filter: blur(10px);">
              <span style="font-size: 9px; font-weight: 800; color: #ffe57f; text-transform: uppercase; letter-spacing: 0.08em;">THỜI GIAN LÀM BÀI</span>
              <strong style="display: block; font-size: 22px; font-weight: 900; color: #fff; text-shadow: 0 0 10px #ffe57f; line-height: 1.1; margin-top: 2px;">${timer}</strong>
            </div>

            <!-- HUD 3: Scoreboard -->
            <div style="flex: 1; min-height: 0; padding: 10px 12px; border-radius: 16px; background: linear-gradient(135deg, rgba(6, 26, 68, 0.92) 0%, rgba(2, 14, 42, 0.96) 100%); border: 1.5px solid rgba(100, 220, 255, 0.45); box-shadow: 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25); display: flex; flex-direction: column; backdrop-filter: blur(10px);">
              <p style="margin-bottom: 8px; font-size: 10px; font-weight: 900; color: #67e8f9; text-transform: uppercase; letter-spacing: 0.06em; text-align: center;">BẢNG XẾP HẠNG TẠM THỜI</p>
              <ol style="list-style: none; display: flex; flex-direction: column; gap: 5px; overflow-y: auto;">
                ${leaderboardEntriesHtml}
              </ol>
            </div>

          </aside>

          <!-- LANES CONTAINER -->
          <div style="position: absolute; top: 0; bottom: 0; left: 245px; right: 20px;">
            ${lanesHtml}
          </div>

          <!-- OPTIONAL NOTE -->
          ${customNote ? `
            <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); background: rgba(3, 18, 48, 0.92); border: 1.5px solid #00f0ff; color: #67e8f9; font-size: 12px; font-weight: 800; padding: 6px 24px; border-radius: 999px; z-index: 40; box-shadow: 0 4px 18px rgba(0, 240, 255, 0.35); backdrop-filter: blur(8px);">
              ${customNote}
            </div>
          ` : ''}

        </div>
      </body>
      </html>
    `;
  }

  // 1. GENERATE PREVIEW: START (0 PTS)
  console.log('Generating preview-start.png...');
  const startTeams = rocketSpecs.map(t => ({ ...t, score: 0 }));
  const htmlStart = buildBoardHtml({
    title: 'Bay Lên Không Gian · Lượt 1',
    timer: '15:00',
    teams: startTeams,
    customNote: '🚀 VẠCH XUẤT PHÁT: 8 phi thuyền xếp hàng trên Bệ Phóng Tên Lửa công nghệ cao'
  });
  await page.setContent(htmlStart);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(rocketDir, 'preview-start.png') });
  await page.screenshot({ path: path.join(artDir, 'preview-start.png') });

  // 2. GENERATE PREVIEW: MID-GAME (CAMERA ASCENDS TO CLOUDS / CITADEL)
  console.log('Generating preview-mid-game.png...');
  const midTeams = [
    { ...rocketSpecs[0], score: 4 },
    { ...rocketSpecs[1], score: 7 }, // leader
    { ...rocketSpecs[2], score: 5 },
    { ...rocketSpecs[3], score: 2 },
    { ...rocketSpecs[4], score: 6 },
    { ...rocketSpecs[5], score: 3 },
    { ...rocketSpecs[6], score: 7 }, // co-leader
    { ...rocketSpecs[7], score: 4 }
  ];
  const htmlMid = buildBoardHtml({
    title: 'Thử Thách Chinh Phục Không Gian',
    timer: '08:42',
    teams: midTeams,
    customNote: '🌌 GIỮA TRẬN: Camera cuộn lên tầng mây thành phố tương lai theo tiến độ điểm các đội'
  });
  await page.setContent(htmlMid);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artDir, 'preview-mid-game.png') });

  // 3. GENERATE PREVIEW: FINISH 10 PTS (REACHES SPACE CITADEL)
  console.log('Generating preview-finish-10pts.png...');
  const finishTeams = [
    { ...rocketSpecs[0], score: 6 },
    { ...rocketSpecs[1], score: 10 }, // Winner reaches Space Citadel
    { ...rocketSpecs[2], score: 8 },
    { ...rocketSpecs[3], score: 5 },
    { ...rocketSpecs[4], score: 7 },
    { ...rocketSpecs[5], score: 4 },
    { ...rocketSpecs[6], score: 9 },
    { ...rocketSpecs[7], score: 6 }
  ];
  const htmlFinish = buildBoardHtml({
    title: 'Chung Kết Bay Vào Không Gian',
    timer: '03:15',
    teams: finishTeams,
    customNote: '⭐ VỀ ĐÍCH: Camera cuộn lên đỉnh Trạm Không Gian Vũ Trụ lộng lẫy giữa dải ngân hà'
  });
  await page.setContent(htmlFinish);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artDir, 'preview-finish-10pts.png') });

  // 4. GENERATE SHOWCASE: 8 ROCKETS SHOWCASE
  console.log('Generating rockets-showcase.png...');
  const showcaseHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1440px;
          height: 900px;
          background: radial-gradient(circle at 50% 20%, #061d4a 0%, #020b1e 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px;
        }
        h1 {
          font-size: 32px;
          font-weight: 900;
          color: #00f0ff;
          text-shadow: 0 0 20px rgba(0,240,255,0.7);
          margin-bottom: 6px;
        }
        p {
          font-size: 15px;
          color: #94a3b8;
          margin-bottom: 28px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 1280px;
        }
        .card {
          background: linear-gradient(135deg, rgba(6, 26, 68, 0.85) 0%, rgba(2, 14, 42, 0.95) 100%);
          border: 2px solid var(--accent);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 16px var(--accent)33;
        }
        .card img {
          width: 110px;
          height: auto;
          filter: drop-shadow(0 8px 14px rgba(0,0,0,0.6));
          margin: 6px 0 12px;
        }
        .card strong {
          font-size: 16px;
          font-weight: 900;
          color: #fff;
        }
        .card span {
          font-size: 12px;
          color: var(--accent);
          font-weight: 800;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <h1>BỘ 8 PHI THUYỀN TÊN LỬA 3D (ĐỘI 1 ĐẾN ĐỘI 8)</h1>
      <p>Trích xuất chuẩn xác với nền trong suốt (Alpha Transparent) từ Rockets.png cho chủ đề "Bay Lên Không Gian"</p>
      <div class="grid">
        ${rocketSpecs.map(r => `
          <div class="card" style="--accent: ${r.color}">
            <span>ĐỘI ${r.id}</span>
            <img src="${toBase64(path.join(rocketDir, `vehicles/rocket-${r.id}.png`))}" />
            <strong>${r.name}</strong>
            <span style="opacity: 0.85;">Phi hành gia: ${r.animal}</span>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
  await page.setContent(showcaseHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artDir, 'rockets-showcase.png') });

  await browser.close();
  console.log('All previews generated successfully!');
})();
