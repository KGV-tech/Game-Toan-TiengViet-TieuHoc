const { test, expect } = require('@playwright/test');
async function open(page) {
  await page.route('https://cdn.jsdelivr.net/**', r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.goto('/');
  await page.evaluate(() => window.gameTemplatesReady);
}
test('practice clock excludes map time and aggregates finished rounds of the day', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const realNow = Date.now;
    let clock = realNow();
    Date.now = () => clock;
    try {
      app.data.currentUser = { id: 'timer-student', username: 'timer-student', role: 'student', classlevel: '4', history: [] };
      app.game.state = { subject: 'vietnamese', questions: Array(10).fill({}), finished: false, practiceElapsedMs: 0, practiceClockStartedAt: null };
      app.router.open('game-screen');
      app.router.openGameView('game-play-view');
      clock += 120000;
      app.router.open('map-screen');
      app.game.saveAttemptDraft();
      app.game.state.practiceElapsedMs = 0;
      clock += 600000;
      app.game.restoreAttemptDraft();
      app.router.open('game-screen');
      app.router.openGameView('game-play-view');
      clock += 60000;
      app.game.pausePracticeClock();
      const elapsed = app.game.getPracticeElapsedMs();
      const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      const round = { subject: 'vietnamese', classlevel: '4', date: `12:00 ${day}`, score: 0, questionCount: 10, difficulty: 'Dễ', details: Array.from({length: 10}, (_,i) => i ? {} : { practice: { durationSeconds: 180 } }) };
      return { elapsed, summary: app.learningPath.getDailyPracticeSummary({ subject: 'vietnamese', classlevel: '4', history: [{...round, attempt_id:'a'}, {...round, attempt_id:'b'}, {...round, attempt_id:'a'}] }) };
    } finally { Date.now = realNow; }
  });
  expect(result.elapsed).toBe(180000);
  expect(result.summary.completed).toBe(2);
  expect(result.summary.minutes).toBe(6);
});
test('Vietnamese completed attempt is saved, counted once and unlocks at eight without summing attempts', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    app.data.currentUser = { id: 'practice-test', username: 'practice-test', role: 'student', classlevel: '4', history: [], stars: 0 };
    app.data.settings = { lessonReleaseByClass: { '4': { vietnamese: 'g4-vietnamese-hk1-b03' } } };
    app.game.openConfig('vietnamese');
    await app.game.startPlay();
    const answers = app.game.state.questions;
    for (let i = 0; i < 10; i++) {
      app.game.state.currentIdx = i;
      app.game.state.historyDetails.push(app.game.createHistoryDetail(answers[i], answers[i].subquestions.map(p => p.answer), true));
    }
    app.game.state.score = 7;
    await app.game.finishPlay();
    await app.game.finishPlay();
    const history = app.data.currentUser.history;
    app.game.openConfig('vietnamese');
    return { length: history.length, lesson: history[0].details[0].lesson, states: app.game.getLearningPlan().states.slice(0, 3).map(x => x.state) };
  });
  expect(result.length).toBe(1);
  expect(result.lesson).toBe('g4-vietnamese-hk1-b01');
  expect(result.states).toEqual(['current', 'locked', 'locked']);
  await expect(page.locator('.student-learning-achievements')).toContainText('Hoàn thành bài làm');
  await expect(page.locator('[data-practice-completed]')).toHaveText('1');
  await expect(page.locator('[data-practice-eligible]')).toHaveText('Chưa đạt');
  await page.evaluate(() => {
    const first = app.data.currentUser.history[0];
    app.data.currentUser.history.push({ ...first, attempt_id: 'second', score: 1 });
    app.game.renderTopics();
  });
  await expect(page.locator('[data-practice-completed]')).toHaveText('2');
  await expect(page.locator('[data-practice-eligible]')).toHaveText('Chưa đạt');
  await page.evaluate(() => {
    const first = app.data.currentUser.history[0];
    app.data.currentUser.history.push({ ...first, attempt_id: 'third', score: 8 });
    app.game.renderTopics();
  });
  await expect(page.locator('[data-practice-eligible]')).toHaveText('Đạt');
  expect(await page.evaluate(() => app.game.getLearningPlan().states.slice(0, 4).map(x => x.state))).toEqual(['completed', 'current', 'locked', 'locked']);
});

for (const width of [1280, 1440, 1024]) test(`separate subject settings, saved gates and visible teacher boundary ${width}`, async ({ page }, testInfo) => {
  await page.setViewportSize({width, height: width === 1280 ? 720 : width === 1440 ? 900 : 768});
  await open(page);
  page.on('dialog', dialog => dialog.accept());
  await page.evaluate(() => {
    app.data.currentUser = { id:'admin-fixture', username:'admin-fixture', role:'admin' };
    app.admin.openAdmin('settings');
  });
  await expect(page.locator('#setting-pass-math-score')).toHaveValue('8');
  await expect(page.locator('#setting-pass-vietnamese-enabled')).toBeChecked();
  await page.locator('#setting-pass-math-score').fill('9');
  await page.locator('#setting-pass-vietnamese-enabled').uncheck();
  await page.locator('#setting-pass-vietnamese-enabled').focus();
  await expect(page.locator('#setting-pass-vietnamese-enabled')).toBeFocused();
  await page.locator('.settings-practice-pass').evaluate(element => element.scrollIntoView({block:'center'}));
  await page.screenshot({path:testInfo.outputPath(`practice-settings-${width}.png`)});
  await page.locator('#settings-save-button').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('game_settings')).practicePass)).toEqual({math:{enabled:true,score:9},vietnamese:{enabled:false,score:8}});
  await page.evaluate(() => {
    app.treasure.close();
    app.data.settings.lessonReleaseByClass = {'4':{vietnamese:'g4-vietnamese-hk1-b03'}};
    app.data.currentUser = {id:'student-settings', username:'student-settings',role:'student',classlevel:'4',history:[],stars:0};
    app.game.openConfig('vietnamese');
  });
  expect(await page.evaluate(() => app.game.getLearningPlan().states.slice(0,4).map(x => x.state))).toEqual(['current','available','available','locked']);
  await expect(page.locator('[data-practice-eligible]')).toHaveText('Đạt');
  await expect(page.locator('.student-learning-achievements')).toContainText('Giáo viên đã mở đến: Bài 3');
  const bounds = await page.evaluate(() => {
    const achievements=document.querySelector('.student-learning-achievements').getBoundingClientRect();
    const route=document.querySelector('.student-learning-path-toggle--right-rail').getBoundingClientRect();
    return { overlap:achievements.bottom > route.top, outside:route.bottom > innerHeight, overflow:document.documentElement.scrollWidth > innerWidth };
  });
  expect(bounds).toEqual({overlap:false,outside:false,overflow:false});
  await page.screenshot({path:testInfo.outputPath(`practice-summary-${width}.png`)});
  await page.getByRole('button',{name:'Xem lộ trình đầy đủ'}).click();
  await expect(page.locator('[data-learning-entry="g4-vietnamese-hk1-b03"]')).toContainText('Mốc giáo viên đã mở');
  await expect(page.locator('[data-learning-entry="g4-vietnamese-hk1-b04"]')).toBeDisabled();
});

test('canonical server history keeps lesson and duration in details; pending copy is not counted twice', async ({page}) => {
  await open(page);
  const result = await page.evaluate(async () => {
    app.data.currentUser = {id:'canonical-fixture',username:'canonical-fixture',role:'student',classlevel:'4',history:[]};
    app.data.settings = {lessonReleaseByClass:{'4':{vietnamese:'g4-vietnamese-hk1-b03'}}};
    app.game.openConfig('vietnamese');
    await app.game.startPlay();
    app.game.pausePracticeClock();
    app.game.state.practiceElapsedMs = 180000;
    app.game.state.historyDetails = app.game.state.questions.map(q => app.game.createHistoryDetail(q, q.subquestions.map(p=>p.answer),true));
    const original = app.data.applyStudentProgressEvent;
    window.supabase = {};
    let sent;
    app.data.applyStudentProgressEvent = async event => {
      sent = event;
      const round = event.round;
      const day = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
      const canonical = {attempt_id:event.event_id,date:`12:00 ${day}`,subject:round.subject,title:round.title,classlevel:'4',questionCount:round.question_count,score:round.score,difficulty:round.difficulty,details:round.details};
      app.data.mergeStudentProgressResult({user:{id:app.data.currentUser.id,history:[canonical]}});
      return {data:{daily_reward:1},error:null};
    };
    try {
      await app.game.recordHistory('Tiếng Việt',8,0);
      app.game.savePendingResult({entry:app.game.buildHistoryEntry('Tiếng Việt',8).entry});
      const history=app.game.getPracticeHistory();
      return {duration:sent.round.details[0].practice.durationSeconds, lesson:sent.round.details[0].lesson, count:history.length, states:app.game.getLearningPlan().states.slice(0,3).map(x=>x.state), summary:app.learningPath.getDailyPracticeSummary({history,subject:'vietnamese',classlevel:'4'})};
    } finally { app.data.applyStudentProgressEvent=original; delete window.supabase; }
  });
  expect(result.duration).toBe(180);
  expect(result.lesson).toBe('g4-vietnamese-hk1-b01');
  expect(result.count).toBe(1);
  expect(result.states).toEqual(['completed','current','locked']);
  expect(result.summary.minutes).toBe(3);
});

test('failed settings save rolls back and fractional thresholds are rejected', async ({page}) => {
  await open(page);
  page.on('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>{
    app.data.currentUser={id:'settings-error',username:'settings-error',role:'admin'};
    app.data.settings={hardTimeLimit:15,examTimeLimit:30,practicePass:{math:{enabled:true,score:8},vietnamese:{enabled:true,score:8}}};
    app.data.saveSettings=async()=>new Error('mock save failure');
    app.admin.openAdmin('settings');
  });
  await page.locator('#setting-pass-math-score').fill('9');
  await page.locator('#settings-save-button').click();
  expect(await page.evaluate(()=>app.data.settings.practicePass.math.score)).toBe(8);
  await expect(page.locator('#settings-save-button')).toBeEnabled();
  await page.locator('#setting-pass-math-score').fill('8.5');
  await page.locator('#settings-save-button').click();
  expect(await page.evaluate(()=>app.data.settings.practicePass.math.score)).toBe(8);
});

test('pending passing round unlocks topic paths; catalog practice cannot start a whole topic without a permitted lesson', async ({page}) => {
  await open(page);
  const dialogs=[];
  page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.accept();});
  const result=await page.evaluate(async()=>{
    app.data.currentUser={id:'pending-topic',username:'pending-topic',role:'student',classlevel:'5',history:[]};
    app.data.settings={};
    app.game.openConfig('math');
    const first=app.game.getLearningPlan().entries[0];
    app.game.savePendingResult({entry:{attempt_id:'pending-eight',subject:'math',classlevel:'5',topic:first.topic,score:8,questionCount:10,details:Array(10).fill({}),difficulty:'Dễ'}});
    const next=app.game.getLearningPlan().states[1].state;
    app.data.currentUser={id:'missing-lesson',username:'missing-lesson',role:'student',classlevel:'4',history:[]};
    app.data.settings={lessonReleaseByClass:{'4':{vietnamese:'g4-vietnamese-hk1-b01'}}};
    app.game.openConfig('vietnamese');
    app.game.state.questions=[];
    app.game.state.selectedTopics=[app.game.getLearningPlan().entries[0].topic];
    app.game.state.selectedLessons=[];
    await app.game.startPlay();
    return {next,count:app.game.state.questions.length};
  });
  expect(result).toEqual({next:'current',count:0});
  expect(dialogs).toEqual(['Hãy chọn một bài đã mở trong lộ trình để luyện tập.']);
});
