const { test, expect } = require('@playwright/test');
async function setup(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  await page.evaluate(async () => {
    app.data.currentUser = { username: 'polish-teacher', role: 'admin' };
    app.data.users = Array.from({ length: 9 }, (_, i) => ({ username: `s${i}`, fullname: `Học sinh ${i}`, role: 'student', approved: true, classlevel: '4', class_name: '4/4' }));
    app.classroom.activate();
    await app.classroom.createWeek({ id: 'polish-week', name: 'Tuần Sao', classlevel: '4', className: '4/4', startDate: '2026-10-05', endDate: '2026-10-10', mode: 'groups', participants: app.data.users.map(s => ({ username: s.username, fullname: s.fullname })), teams: [{ id: 'g1', name: 'Nhóm Sao', members: app.data.users.map(s => s.username) }], scores: { s0: 7 }, absences: [], version: 1 });
    app.admin.openAdmin('quests'); app.admin.switchQuestMode('weekly');
  });
}

test('Light mode: trạng thái tải dùng nền pastel và chữ tương phản', async ({page}) => {
  await setup(page);
  await page.evaluate(() => {
    document.documentElement.dataset.theme='light';
    window.supabase={}; app.data.adminDataLoaded=false;
    app.data.ensureAdminDataLoaded=()=>new Promise(()=>{});
    app.admin.openAdmin('quests');
  });
  await expect(page.locator('.admin-loading-state')).toBeVisible();
  const colors=await page.locator('.admin-loading-state').evaluate(e=>({background:getComputedStyle(e).backgroundImage,title:getComputedStyle(e.querySelector('strong')).color,text:getComputedStyle(e.querySelector('p')).color}));
  expect(colors.background).toContain('200, 235, 246');
  expect(colors.title).toBe('rgb(24, 42, 66)');
  expect(colors.text).toBe('rgb(70, 93, 118)');
  await page.screenshot({path:'test-results/ui-review/loading-pastel.png'});
});

test('Kết quả random dùng lời chúc riêng cho Tổ, Nhóm và học sinh', async ({page}) => {
  await setup(page); await page.locator('[data-weekly-tab=random]').click();
  for (const [mode,label] of [['section','Tổ'],['group','Nhóm'],['all','Bạn'],['section-member','Bạn'],['group-member','Bạn']]) {
    await page.evaluate(mode=>{const ui=app.admin.weeklyState();ui.randomMode=mode;ui.result='Kết quả';ui.lastCandidate={score:0};app.admin.showWeeklyDrawWinner(ui);},mode);
    await expect(page.locator('.weekly-winner-content p')).toHaveText(`${label} may mắn được chọn`);
    await page.locator('#weekly-result-close').click();
    await expect(page.locator('#weekly-result-dialog')).toHaveCount(0);
  }
});

for (const [width,height] of [[1280,720],[1440,900],[1024,768]]) test(`Trình chiếu cân giữa các hàng từ 1 đến 10 ô ${width}`, async ({page}) => {
  await page.setViewportSize({width,height}); await setup(page);
  await page.locator('[data-weekly-tab=random]').click();
  await page.evaluate(width=>{if(width===1440)document.documentElement.dataset.theme='light';app.admin.showWeeklyDrawStage();},width);
  for (let count=1;count<=10;count++) {
    await page.evaluate(count=>app.admin.renderWeeklyCandidateGrid(app.admin.weeklyState(),Array.from({length:count},(_,i)=>({id:`x${i}`,name:`Tổ ${i+1}`,score:i}))),count);
    await page.locator('#weekly-candidate-heading').evaluate((e,count)=>e.textContent=`Danh sách tham gia · ${count}`,count);
    const rows=await page.locator('#weekly-draw-dialog [data-candidate-id]').evaluateAll(cards=>{
      const rows=[]; for(const card of cards){const r=card.getBoundingClientRect();let row=rows.find(row=>Math.abs(row.top-r.top)<2);if(!row){row={top:r.top,left:r.left,right:r.right,count:0};rows.push(row);}row.right=r.right;row.count++;if(r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth)throw Error('Card outside viewport');}return rows;
    });
    const columns=count<=3?count:Math.ceil(count/2);
    expect(rows.map(row=>row.count)).toEqual(count<=3?[count]:[columns,count-columns]);
    for(const row of rows) expect(Math.abs((row.left+row.right)/2-width/2)).toBeLessThan(2);
    if(count===5) await page.screenshot({path:`test-results/ui-review/balanced-five-${width}.png`});
  }
});

for (const kind of ['groups','sections']) for (const [width,height] of [[1280,720],[1440,900],[1024,768]]) test(`Hai tầng ${kind} ${width}: giữ trình chiếu, bấm tiếp chọn đúng học sinh`, async ({page}) => {
  await page.setViewportSize({width,height});
  await setup(page);
  await page.evaluate(kind => {
    app.classroom.weeks[0].teams = [
      {id:'a',kind,name:'Đội A',members:['s0','s1','s4']},
      {id:'b',kind,name:'Đội B',members:['s2','s3']}
    ];
    app.classroom.weeks[0].absences=['s1'];
  },kind);
  await page.locator('[data-weekly-tab=random]').click();
  await page.locator(`[data-weekly-random-mode=${kind==='groups'?'group-member':'section-member'}]`).click();
  await expect(page.locator('[data-candidate-id]')).toHaveCount(2);
  const start=new Date('2026-10-03T08:00:00Z');
  await page.clock.install({time:new Date(start.getTime()-60000)}); await page.clock.pauseAt(start);
  await page.locator('#weekly-draw').click();
  await page.locator('#weekly-draw-dialog').evaluate(e=>{window.firstDrawDialog=e;window.drawDialogClosed=false;e.addEventListener('close',()=>window.drawDialogClosed=true);});
  await page.clock.runFor(6100);
  await expect(page.locator('#weekly-draw-dialog')).toBeVisible();
  expect(await page.evaluate(()=>window.firstDrawDialog===document.getElementById('weekly-draw-dialog') && !window.drawDialogClosed)).toBe(true);
  await expect(page.locator('#weekly-draw-dialog #weekly-draw')).toBeEnabled();
  await expect(page.locator('#weekly-draw-dialog #weekly-draw')).toContainText('Chọn ngẫu nhiên học sinh');
  await expect(page.locator('#weekly-meteor')).toBeHidden();
  await expect(page.locator('#weekly-result-dialog')).toHaveCount(0);
  const team=await page.evaluate(()=>app.admin.weeklyState().teamId);
  expect(['a','b']).toContain(team);
  await expect(page.locator('#weekly-selected-team-heading h3')).toHaveText(team==='a'?'Đội A':'Đội B');
  await expect(page.locator('#weekly-selected-team-heading p')).toHaveText(`${kind==='groups'?'Nhóm':'Tổ'} may mắn được chọn`);
  expect(await page.locator('#weekly-selected-team-heading').evaluate(e=>e.getBoundingClientRect().bottom<=document.getElementById('weekly-random-candidates').getBoundingClientRect().top)).toBe(true);
  await page.screenshot({path:`test-results/ui-review/continuous-${kind}-${width}.png`});
  const visible=team==='a'?['s0','s4']:['s2','s3'];
  expect(await page.locator('[data-candidate-id]').evaluateAll(cards=>cards.map(card=>card.dataset.candidateId))).toEqual(visible);
  expect(await page.evaluate(()=>app.admin.weeklyState().drawn)).toEqual([]);
  await page.clock.runFor(10000);
  await expect(page.locator('#weekly-result-dialog')).toHaveCount(0);
  await page.evaluate(()=>app.admin.renderWeeklyCompetition());
  await expect(page.locator('#weekly-draw-dialog')).toBeVisible();
  await expect(page.locator('#weekly-selected-team-heading h3')).toHaveText(team==='a'?'Đội A':'Đội B');
  await expect(page.locator('#weekly-draw-dialog #weekly-draw')).toBeFocused();
  await page.locator('#weekly-draw').click(); await page.clock.runFor(6100);
  await expect(page.locator('#weekly-result-dialog')).toBeVisible();
  const winner=await page.evaluate(()=>app.admin.weeklyState().randomStudent);
  expect(visible).toContain(winner);
  await page.locator('#weekly-result-close').click();
  expect(await page.locator('[data-candidate-id]').evaluateAll(cards=>cards.map(card=>card.dataset.candidateId))).toEqual(visible);
  await page.locator('#weekly-draw').click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>app.admin.weeklyState().teamId)).toBe(team);
  expect(await page.evaluate(()=>app.admin.weeklyState().drawn)).toEqual([winner]);
  await page.locator('#weekly-team-stage-back').click();
  await expect(page.locator('[data-candidate-id]')).toHaveCount(2);
  expect(await page.evaluate(()=>app.admin.weeklyState().drawn)).toEqual([winner]);
  await page.locator('#weekly-draw-reset').click();
  expect(await page.evaluate(()=>app.admin.weeklyState().drawn)).toEqual([]);
});

for (const [width,height] of [[1280,720],[1440,900],[1024,768]]) test(`Tổ/Nhóm gọn và chữ cân đối ${width}`, async ({page}) => {
  await page.setViewportSize({width,height}); await setup(page);
  await page.evaluate(() => {
    const week=app.classroom.weeks[0];
    week.participants=Array.from({length:31},(_,i)=>({username:`p${i}`,fullname:`Nguyễn Hoàng Minh Phúc ${i}`}));
    week.teams=Array.from({length:6},(_,i)=>({id:`g${i}`,name:`Nhóm ${i+1}`,kind:'groups',members:week.participants.filter((s,j)=>j%6===i).map(s=>s.username)}));
    document.documentElement.dataset.theme='light';
  });
  await page.locator('[data-weekly-view=groups]').click();
  expect(await page.locator('#weekly-body').evaluate(e=>e.scrollHeight<=e.clientHeight+1 && e.scrollWidth<=e.clientWidth+1)).toBe(true);
  expect(await page.locator('.weekly-roster-team-card').evaluateAll(cards=>cards.every(card=>card.getBoundingClientRect().height<300))).toBe(true);
  await page.screenshot({path:`test-results/ui-review/compact-weekly-teams-${width}.png`});
  await page.locator('[data-weekly-tab=random]').click(); await page.locator('[data-weekly-random-mode=group]').click();
  expect(await page.locator('[data-candidate-id]').evaluateAll(cards=>cards.every(card=>card.getBoundingClientRect().height<=101))).toBe(true);
  await page.screenshot({path:`test-results/ui-review/compact-team-random-${width}.png`});
});

test('Sửa và xóa nhóm giữ điểm và danh sách học sinh', async ({page}) => {
  await setup(page); await page.locator('[data-weekly-view=groups]').click();
  await page.locator('[data-weekly-team-edit="g1"]').click();
  await expect(page.locator('#weekly-team-name')).toHaveValue('Nhóm Sao');
  await page.locator('#weekly-team-name').fill('Nhóm Mặt Trời');
  await page.locator('[data-weekly-team-member="s0"]').uncheck();
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-body')).toContainText('Nhóm Mặt Trời');
  let saved = await page.evaluate(() => app.classroom.weeks[0]);
  expect(saved.scores).toEqual({s0:7});
  expect(saved.teams.find(t=>t.id==='g1').members).toHaveLength(8);
  expect(saved.teams.some(t=>t.id!=='g1' && t.members.includes('s0'))).toBe(true);
  const pendingId = saved.teams.find(t=>t.id!=='g1').id;
  await page.locator(`[data-weekly-team-edit="${pendingId}"]`).click();
  await page.locator('#weekly-team-name').fill('Nhóm Cầu Vồng');
  await page.locator('[data-weekly-team-member="s1"]').check();
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-form')).toHaveCount(0);
  await page.locator(`[data-weekly-team-edit="${pendingId}"]`).click();
  await page.locator('[data-weekly-team-member="s0"]').uncheck();
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-form')).toHaveCount(0);
  page.once('dialog', dialog=>dialog.dismiss());
  await page.locator('[data-weekly-team-delete="g1"]').click();
  await expect(page.locator('[data-weekly-team-edit="g1"]')).toHaveCount(1);
  page.once('dialog', dialog=>dialog.accept());
  await page.locator('[data-weekly-team-delete="g1"]').click();
  await expect(page.locator('[data-weekly-team-edit="g1"]')).toHaveCount(0);
  saved = await page.evaluate(() => app.classroom.weeks[0]);
  expect(saved.scores).toEqual({s0:7});
  expect(new Set(saved.teams.filter(t=>(t.kind||saved.mode)==='groups').flatMap(t=>t.members)).size).toBe(9);
  await page.evaluate(() => { app.classroom.owner=''; app.classroom.activate(); app.admin.renderWeeklyCompetition(); });
  await expect(page.locator('[data-weekly-team-edit="g1"]')).toHaveCount(0);
});

for (const kind of ['sections','groups']) test(`Phân ${kind}: số lượng, cân bằng, admin chọn và giữ điểm`, async ({page}) => {
  await setup(page); await page.locator(`[data-weekly-view=${kind}]`).click();
  await page.locator('#weekly-team-arrange').click();
  await page.locator('#weekly-team-count').fill('4');
  await page.locator('#weekly-team-count').dispatchEvent('change');
  await page.getByLabel('Tự chia ngẫu nhiên, cân bằng', {exact:true}).check();
  await expect(page.locator('[data-weekly-team-total]')).toHaveCount(4);
  expect(await page.locator('[data-weekly-team-total]').evaluateAll(cards=>cards.map(card=>Number(card.dataset.weeklyTeamTotal)).sort())).toEqual([2,2,2,3]);
  expect(await page.evaluate(()=>app.classroom.weeks[0].teams.length)).toBe(1);
  await page.getByLabel('Admin chọn học sinh', {exact:true}).check();
  await page.locator('[data-weekly-team-draft-name="0"]').fill('Chưa phân tổ');
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-error')).toContainText('Tên này dành cho danh sách chưa phân');
  await page.locator('[data-weekly-team-draft-name="0"]').fill('Đội Cầu Vồng');
  await page.locator('[data-weekly-team-draft-name="0"]').press('Tab');
  await expect(page.locator('[data-weekly-team-capacity="0"]')).toBeFocused();
  await page.locator('[data-weekly-team-assignment="s0"]').selectOption('0');
  await page.locator('[data-weekly-team-assignment="s1"]').selectOption('0');
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-form')).toHaveCount(0);
  const saved = await page.evaluate(()=>app.classroom.weeks[0]);
  const teams = saved.teams.filter(t=>(t.kind||saved.mode)===kind);
  expect(teams).toHaveLength(4);
  expect(teams[0].name).toBe('Đội Cầu Vồng');
  expect(teams[0].members).toEqual(expect.arrayContaining(['s0','s1']));
  expect(teams.flatMap(t=>t.members).sort()).toEqual(['s0','s1','s2','s3','s4','s5','s6','s7','s8']);
  expect(saved.scores).toEqual({s0:7});
  if (kind==='sections') expect(saved.teams.find(t=>t.id==='g1').members).toHaveLength(9);
});

for (const kind of ['sections','groups']) test(`Số lượng tùy chọn ${kind}: chia đúng và chặn tổng sai`, async ({page}) => {
  await setup(page); await page.locator(`[data-weekly-view=${kind}]`).click();
  await page.locator('#weekly-team-arrange').click();
  await page.locator('#weekly-team-count').fill('3');
  await page.locator('#weekly-team-count').dispatchEvent('change');
  await page.getByLabel('Tự chia ngẫu nhiên, cân bằng', {exact:true}).check();
  await expect(page.locator('[data-weekly-team-capacity]')).toHaveCount(3);
  const before=await page.locator('[data-weekly-team-assignment]').evaluateAll(items=>items.map(item=>item.value));
  await page.locator('[data-weekly-team-capacity="0"]').fill('5');
  await page.locator('#weekly-team-shuffle').click();
  await expect(page.locator('#weekly-team-error')).toContainText('Tổng số học sinh phải bằng 9');
  expect(await page.locator('[data-weekly-team-assignment]').evaluateAll(items=>items.map(item=>item.value))).toEqual(before);
  await page.locator('[data-weekly-team-capacity="1"]').fill('3');
  await page.locator('[data-weekly-team-capacity="2"]').fill('1');
  await page.locator('#weekly-team-shuffle').click();
  expect(await page.locator('[data-weekly-team-total]').evaluateAll(items=>items.map(item=>Number(item.dataset.weeklyTeamTotal)))).toEqual([5,3,1]);
  await page.locator('#weekly-team-shuffle').click();
  expect(await page.locator('[data-weekly-team-total]').evaluateAll(items=>items.map(item=>Number(item.dataset.weeklyTeamTotal)))).toEqual([5,3,1]);
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-form')).toHaveCount(0);
  const saved=await page.evaluate(kind=>app.classroom.weeks[0].teams.filter(t=>(t.kind||app.classroom.weeks[0].mode)===kind),kind);
  expect(saved.map(t=>t.members.length)).toEqual([5,3,1]);
  expect(new Set(saved.flatMap(t=>t.members)).size).toBe(9);
});

test('Dark mode: ô phân nhóm và option dùng nền tối, chữ sáng', async ({page}) => {
  await setup(page); await page.locator('[data-weekly-view=groups]').click(); await page.locator('#weekly-team-arrange').click();
  const colors=await page.locator('[data-weekly-team-assignment]').first().evaluate(e=>({bg:getComputedStyle(e).backgroundColor,scheme:getComputedStyle(e).colorScheme,option:getComputedStyle(e.options[0]).backgroundColor}));
  expect(colors.scheme).toBe('dark');
  expect(colors.bg).toBe('rgb(7, 25, 42)');
  expect(colors.option).toBe('rgb(7, 25, 42)');
  await page.screenshot({path:'test-results/ui-review/team-capacity-dark.png'});
});

for (const [width,height] of [[1280,720],[1440,900],[1024,768]]) test(`Phân nhóm 31 học sinh: bounds, light và lỗi lưu ${width}`, async ({page}) => {
  await page.setViewportSize({width,height}); await setup(page);
  await page.evaluate(() => {
    app.classroom.weeks[0].participants = Array.from({length:31},(_,i)=>({username:`p${i}`,fullname:`Nguyễn Hoàng Minh Phúc ${i}`}));
    document.documentElement.dataset.theme='light';
  });
  await page.locator('[data-weekly-view=groups]').click(); await page.locator('#weekly-team-arrange').click();
  await expect(page.locator('[data-weekly-team-assignment]')).toHaveCount(31);
  expect(await page.locator('#weekly-body').evaluate(body => body.scrollHeight<=body.clientHeight+1 && body.scrollWidth<=body.clientWidth+1)).toBe(true);
  await expect(page.locator('#weekly-team-form [type=submit]')).toBeVisible();
  await page.screenshot({path:`test-results/ui-review/weekly-team-arrange-light-${width}.png`});
  await page.getByLabel('Tự chia ngẫu nhiên, cân bằng', {exact:true}).check();
  await page.evaluate(() => { const original=app.classroom.setWeekTeams.bind(app.classroom); let fail=true; app.classroom.setWeekTeams=(...args)=> { if(fail) { fail=false; throw new Error('Chưa thể lưu'); } return original(...args); }; });
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-error')).toHaveText('Chưa thể lưu');
  await expect(page.locator('[data-weekly-team-assignment]').first()).toBeDisabled();
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-form')).toHaveCount(0);
});

test('Danh sách đủ sau mỗi lượt, ghi nhớ ngầm đến khi đặt lại vòng', async ({page}) => {
  await setup(page);
  await page.evaluate(() => { app.classroom.weeks[0].participants.splice(3); });
  await page.locator('[data-weekly-tab=random]').click();
  const start = new Date('2026-10-03T08:00:00Z');
  await page.clock.install({time:new Date(start.getTime()-60000)}); await page.clock.pauseAt(start);
  const order = await page.locator('[data-candidate-id]').evaluateAll(cards => cards.map(card => card.dataset.candidateId));
  const winners = [];
  for (let i=0;i<3;i++) {
    await page.locator('#weekly-draw').click();
    await expect(page.locator('[data-candidate-id]')).toHaveCount(3);
    await page.clock.runFor(6100);
    await expect(page.locator('#weekly-result-dialog p')).toHaveText('Bạn may mắn được chọn');
    if (i===0) {
      await page.evaluate(() => document.documentElement.dataset.theme='light');
      await expect(page.locator('.weekly-winner-star')).toHaveCSS('color','rgb(220, 38, 38)');
      await page.evaluate(() => document.documentElement.dataset.theme='dark');
      await expect(page.locator('.weekly-winner-star')).toHaveCSS('color','rgb(255, 224, 138)');
    }
    winners.push(await page.evaluate(() => app.admin.weeklyState().randomStudent));
    await page.locator('#weekly-result-close').click();
    expect(await page.locator('[data-candidate-id]').evaluateAll(cards => cards.map(card => card.dataset.candidateId))).toEqual(order);
    await expect(page.locator('.weekly-random-candidate.is-selected')).toHaveCount(0);
  }
  expect(new Set(winners).size).toBe(3);
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-result-dialog')).toHaveCount(0);
  await expect(page.locator('.weekly-status')).toBeVisible();
  await expect(page.locator('.weekly-status')).toContainText('đặt lại vòng');
  expect(await page.evaluate(() => app.admin.weeklyState().drawn.length)).toBe(3);
  await expect(page.locator('[data-candidate-id]')).toHaveCount(3);
  await page.locator('#weekly-draw-reset').click();
  await expect(page.locator('.weekly-status')).not.toContainText('đặt lại vòng');
  await page.locator('#weekly-draw').click(); await page.clock.runFor(6100);
  expect(await page.evaluate(() => app.admin.weeklyState().drawn.length)).toBe(1);
});

test('Light mode: sao đỏ, điều chỉnh rõ, chọn tuần không có mảng vàng; icon có ánh sáng', async ({page}) => {
  await setup(page);
  await page.evaluate(() => document.documentElement.dataset.theme='light');
  await page.locator('.weekly-student-card').first().click();
  await expect(page.locator('.weekly-point-adjust summary')).toHaveCSS('color','rgb(40, 69, 93)');
  await page.locator('#weekly-point-cancel').click();
  await expect(page.locator('.weekly-sidebar-controls .weekly-toolbar')).toHaveCSS('background-image','none');
  await page.locator('[data-weekly-tab=standings]').click();
  await expect(page.locator('.weekly-rank-medal').first()).toHaveCSS('animation-name','weekly-rank-glow');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.weekly-rank-medal').first()).toHaveCSS('animation-name','none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-weekly-tab=random]').click(); await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-meteor')).toHaveCSS('color','rgb(220, 38, 38)');
  await page.evaluate(() => document.documentElement.dataset.theme='dark');
  await expect(page.locator('#weekly-meteor')).toHaveCSS('color','rgb(255, 231, 147)');
});
test('Nhãn điểm, SVG riêng và animation có tên thay đổi trong thời gian chờ', async ({ page }) => {
  await setup(page);
  await expect(page.getByText('Tìm học sinh', { exact: true })).toBeVisible();
  await expect(page.locator('.weekly-score small').first()).toHaveText('điểm');
  await page.locator('[data-weekly-tab=random]').click();
  const icons = await page.locator('.weekly-random-mode svg').evaluateAll(els => els.map(el => el.innerHTML));
  expect(new Set(icons).size).toBe(5);
  await expect(page.locator('#weekly-delay')).toHaveCount(0);
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-meteor')).toBeVisible();
  const meteorBefore = await page.locator('#weekly-meteor').evaluate(el => el.style.transform);
  await expect.poll(() => page.locator('#weekly-meteor').evaluate(el => el.style.transform)).not.toBe(meteorBefore);
  await expect(page.locator('#weekly-draw-preview')).toContainText('Học sinh');
  await expect(page.locator('#weekly-draw-preview')).toBeAttached();
  await expect(page.locator('#weekly-draw-progress')).toBeAttached();
  const before = await page.locator('#weekly-draw-preview').textContent();
  const originalOrder = await page.locator('[data-candidate-id]').evaluateAll(cards => cards.map(card => card.dataset.candidateId));
  await expect.poll(() => page.locator('#weekly-draw-preview').textContent()).not.toBe(before);
  await expect(page.locator('#weekly-draw')).toBeEnabled({ timeout: 8000 });
  expect(await page.evaluate(() => app.admin.weeklyState().drawn.length)).toBe(1);
  await expect(page.locator('.weekly-random-candidate.is-selected')).toHaveCount(0);
  expect(await page.locator('[data-candidate-id]').evaluateAll(cards => cards.map(card => card.dataset.candidateId))).toEqual(originalOrder);
  await expect(page.locator('#weekly-result-dialog')).toBeVisible();
});
test('Sao băng cố định sáu giây, không có bộ chọn thời lượng', async ({page}) => {
  await setup(page); await page.locator('[data-weekly-tab=random]').click();
  const start = new Date('2026-10-03T08:00:00Z');
  await page.clock.install({time:new Date(start.getTime()-60000)}); await page.clock.pauseAt(start);
  await expect(page.locator('#weekly-delay')).toHaveCount(0);
  await page.locator('#weekly-draw').click(); await page.clock.runFor(5900);
  await expect(page.locator('#weekly-draw')).toBeDisabled();
  expect(await page.evaluate(()=>app.admin.weeklyState().drawn.length)).toBe(0);
  await page.clock.runFor(200); await expect(page.locator('#weekly-draw')).toBeEnabled();
  expect(await page.evaluate(()=>app.admin.weeklyState().drawn.length)).toBe(1);
});
test('Sao băng chọn Nhóm rồi thành viên, giữ kết quả cuối và điểm độc lập', async ({ page }) => {
  await setup(page);
  await page.locator('[data-weekly-tab=random]').click();
  await page.locator('[data-weekly-random-mode=group-member]').click();
  await expect(page.locator('#weekly-delay')).toHaveCount(0);
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-draw-preview')).toContainText('Nhóm Sao');
  await expect(page.locator('#weekly-draw')).toBeEnabled({timeout:8000});
  await expect(page.locator('#weekly-result-dialog')).toHaveCount(0);
  await expect(page.locator('#weekly-selected-team-heading h3')).toHaveText('Nhóm Sao');
  await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-draw-preview')).toContainText('Học sinh');
  await expect(page.locator('#weekly-draw')).toBeEnabled({timeout:8000});
  const state = await page.evaluate(() => ({ ui: app.admin.weeklyState(), scores: app.classroom.weeks[0].scores }));
  await expect(page.locator('#weekly-winner-name')).toHaveText(state.ui.result);
  expect(state.scores).toEqual({s0:7});
  await expect(page.locator('#weekly-random-team-result')).toHaveText('Nhóm Sao');
});
for (const [width,height] of [[1280,720],[1440,900],[1024,768]]) test(`Sao băng hiện rõ khi có 31 học sinh ${width}`, async ({page}) => {
  await page.setViewportSize({width,height}); await setup(page);
  expect(await page.locator('.weekly-student-card').first().evaluate(el => getComputedStyle(el,'::after').content)).toBe('none');
  await page.evaluate(() => {
    app.classroom.weeks[0].participants = Array.from({length:31},(_,i)=>({username:`p${i}`,fullname:`Nguyễn Hoàng Minh Phúc ${i}`}));
    app.admin.weeklyState().tab='random'; app.admin.renderWeeklyCompetition();
  });
  expect(await page.locator('#weekly-body').evaluate(body => body.scrollHeight <= body.clientHeight + 1 && body.querySelector('.weekly-candidate-grid').getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom)).toBe(true);
  expect(await page.locator('.weekly-candidate-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(5);
  await expect(page.locator('.weekly-random-controls #weekly-draw-reset')).toBeVisible();
  expect(await page.locator('.weekly-random-result').evaluate(el => getComputedStyle(el).borderTopWidth)).toBe('0px');
  expect(await page.locator('[data-candidate-id]').evaluateAll(cards => cards.every(card => [...card.children].every(child => {
    const parent = card.getBoundingClientRect(), box = child.getBoundingClientRect();
    return box.top >= parent.top && box.bottom <= parent.bottom && box.right <= parent.right;
  })))).toBe(true);
  expect(await page.locator('#weekly-body').evaluate(body => body.querySelector('#weekly-draw').getBoundingClientRect().top >= body.querySelector('.weekly-candidate-panel').getBoundingClientRect().bottom)).toBe(true);
  expect(await page.locator('[data-candidate-id]').first().evaluate(el => getComputedStyle(el,'::after').content)).toBe('none');
  await page.screenshot({path:`test-results/ui-review/meteor-ready-${width}.png`});
  await expect(page.locator('#weekly-delay')).toHaveCount(0); await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-meteor')).toBeVisible();
  await page.screenshot({path:`test-results/ui-review/meteor-active-${width}.png`});
  expect(await page.locator('#weekly-draw-dialog').evaluate(body => body.scrollHeight <= body.clientHeight + 1 && [...body.querySelectorAll('[data-candidate-id]')].every(card => card.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom))).toBe(true);
  await expect(page.locator('#weekly-draw')).toBeEnabled({timeout:8000});
  await expect(page.locator('#weekly-result-dialog')).toBeVisible();
  if (width === 1280) {
    const winner = await page.locator('#weekly-winner-name').textContent();
    await page.evaluate(() => app.admin.refreshWeeklyAfterAsync());
    await expect(page.locator('#weekly-result-dialog')).toBeVisible();
    await expect(page.locator('#weekly-winner-name')).toHaveText(winner);
  }
  expect(await page.locator('#weekly-result-dialog').evaluate(body => {
    const box = body.getBoundingClientRect(); return box.width === innerWidth && box.height === innerHeight;
  })).toBe(true);
  await page.screenshot({path:`test-results/ui-review/meteor-finished-${width}.png`});
  await page.evaluate(() => document.documentElement.dataset.theme = 'light');
  await expect(page.locator('#weekly-result-close')).toHaveCSS('color','rgb(24, 42, 66)');
  await page.screenshot({path:`test-results/ui-review/meteor-light-${width}.png`});
  if (width === 1280) await page.keyboard.press('Escape');
  else await page.locator('#weekly-result-close').click();
  await expect(page.locator('#weekly-result-dialog')).toHaveCount(0);
  await expect(page.locator('#weekly-draw')).toBeFocused();
  await page.locator('#weekly-draw-reset').click();
  expect(await page.locator('#weekly-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});

test('Light mode quản lý thi đua đổi cả canvas và header', async ({page}) => {
  await page.setViewportSize({width:1280,height:720}); await setup(page);
  await page.locator('#quest-management-back').click();
  await page.evaluate(() => document.documentElement.dataset.theme = 'light');
  const canvas = page.locator('#treasure-modal .station-shell');
  expect(await canvas.evaluate(el => getComputedStyle(el,'::before').backgroundImage)).toContain('rgb(200, 235, 246)');
  await expect(page.locator('#admin-management-back')).toHaveCSS('color','rgb(24, 42, 66)');
  await page.screenshot({path:'test-results/ui-review/quest-hub-light-complete.png'});
});
test('Chia nhóm ngẫu nhiên cân bằng và cập nhật bảng số lượng', async ({ page }) => {
  await setup(page); await page.locator('[data-weekly-tab=standings]').click(); await page.locator('#weekly-manager-create').click();
  await expect(page.getByText('Tên thi đua tuần', { exact: true })).toBeVisible();
  await page.getByLabel('Thi đua theo Nhóm', { exact: true }).check();
  await page.locator('[data-weekly-assignment]').first().selectOption('1');
  await expect(page.locator('[data-weekly-group-count="0"]')).toContainText('2 học sinh');
  await page.locator('#weekly-shuffle-groups').click();
  await expect(page.locator('[data-weekly-group-count]')).toHaveCount(3);
  for (const item of await page.locator('[data-weekly-group-count]').all()) await expect(item).toContainText('3 học sinh');
});
test('Thêm Nhóm khi chưa có tuần mở đúng loại Nhóm', async ({ page }) => {
  await setup(page);
  await page.evaluate(() => { app.classroom.weeks = []; app.admin.weeklyState().selected = ''; app.admin.renderWeeklyCompetition(); });
  await page.locator('[data-weekly-view=groups]').click(); await page.locator('#weekly-team-create').click();
  await expect(page.getByLabel('Thi đua theo Nhóm', { exact: true })).toBeChecked();
  await expect(page.locator('#weekly-shuffle-groups')).toBeVisible();
});
test('Thêm nhóm riêng giữ điểm, thành viên không trùng và lưu qua tải lại', async ({ page }) => {
  await setup(page); await page.locator('[data-weekly-view=groups]').click();
  await page.locator('#weekly-team-create').click();
  await page.locator('#weekly-team-name').fill('Nhóm Mây');
  await page.locator('[data-weekly-team-member="s0"]').check();
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-body')).toContainText('Nhóm Mây');
  const state = await page.evaluate(() => ({ teams: app.classroom.weeks[0].teams, scores: app.classroom.weeks[0].scores }));
  expect(state.scores.s0).toBe(7);
  expect(state.teams.filter(t => t.members.includes('s0'))).toHaveLength(1);
  await page.evaluate(() => { app.classroom.owner = ''; app.classroom.activate(); app.admin.renderWeeklyCompetition(); });
  await expect(page.locator('#weekly-body')).toContainText('Nhóm Mây');
});
test('Thêm tổ độc lập, lỗi giữ form, reduced motion và hủy vòng chọn', async ({ page }) => {
  await setup(page); await page.locator('[data-weekly-view=sections]').click();
  await page.locator('#weekly-team-create').click();
  await page.locator('#weekly-team-name').fill('Tổ Mặt Trời');
  await page.locator('[data-weekly-team-member="s0"]').check();
  await page.evaluate(() => { const original = app.classroom.setWeekTeams.bind(app.classroom); let fail = true; app.classroom.setWeekTeams = (...args) => { if (fail) { fail = false; throw new Error('Chưa thể đồng bộ'); } return original(...args); }; });
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-error')).toContainText('Chưa thể đồng bộ');
  await expect(page.locator('#weekly-team-name')).toHaveValue('Tổ Mặt Trời');
  await page.locator('#weekly-team-form [type=submit]').click();
  await expect(page.locator('#weekly-team-form')).toHaveCount(0);
  const state = await page.evaluate(() => app.classroom.weeks[0]);
  expect(state.teams.find(t => t.name === 'Tổ Mặt Trời').members).toEqual(['s0']);
  expect(state.teams.find(t => t.name === 'Chưa phân tổ').members).toHaveLength(8);
  expect(state.teams.find(t => t.id === 'g1').members).toHaveLength(9);
  expect(state.scores.s0).toBe(7);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-weekly-tab=random]').click(); await page.locator('#weekly-draw').click();
  await expect(page.locator('#weekly-draw-preview')).toHaveText('Đang chọn…');
  expect(await page.locator('.weekly-random-result .classroom-team-mark').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.keyboard.press('Escape');
  await page.locator('[data-weekly-tab=points]').click();
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => app.admin.weeklyState().drawn)).toEqual([]);
});
for (const [width, height] of [[1280,720],[1440,900],[1024,768]]) test(`Sidebar, icon và light contrast ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height }); await setup(page);
  await page.locator('.quest-management-sidebar [data-theme-toggle]').click();
  await page.locator('[data-weekly-tab=random]').click();
  await page.screenshot({ path: `test-results/ui-review/polish-random-light-${width}.png` });
  await page.locator('[data-weekly-tab=standings]').click();
  await expect(page.locator('.weekly-rank-laurel')).toHaveCount(3);
  await expect(page.locator('.weekly-rank-medal').first()).toHaveAttribute('aria-label', 'Hạng 1');
  await expect(page.locator('.quest-management-sidebar #weekly-create, .quest-management-sidebar #weekly-refresh')).toHaveCount(0);
  await expect(page.locator('#weekly-manager-create')).toBeVisible();
  await page.screenshot({ path: `test-results/ui-review/polish-ranking-light-${width}.png` });
  await page.locator('.quest-management-sidebar [data-theme-toggle]').click();
  await expect(page.locator('.weekly-rank-medal').first()).toHaveCSS('color', 'rgb(255, 211, 106)');
  await page.screenshot({ path: `test-results/ui-review/polish-ranking-dark-${width}.png` });
  await page.locator('#quest-management-back').click(); await page.locator('[data-quest-launch=team]').click();
  await expect(page.locator('.quest-management-sidebar .team-dashboard-notice')).toBeVisible();
  await expect(page.locator('.team-dashboard-notice')).not.toContainText('Supabase');
  expect(await page.locator('.quest-management-sidebar').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
});
