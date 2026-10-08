const {test,expect}=require('@playwright/test');
test('mốc và bỏ yêu cầu đủ điểm cập nhật khi mở môn, quay lại tab, không cần realtime',async({page})=>{
await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.route('**/*.supabase.co/**',r=>r.abort());await page.goto('/');
const initial=await page.evaluate(()=>{app.data.currentUser={id:'student-1',username:'learner',role:'student',classlevel:'4',history:[]};app.data.settings={lessonReleaseByClass:{4:{math:'g4-math-hk1-b01'}},practicePass:{math:{enabled:true,score:8}}};window.supabase={};window.remoteSettings={lessonReleaseByClass:{4:{math:'g4-math-hk1-b05'}},practicePass:{math:{enabled:false,score:8}}};app.data.fetchAllFromSupabase=async()=>[{id:1,data:window.remoteSettings}];app.game.state.subject="math";const before=app.game.getLearningPlan();app.game.openConfig('math');return before.states.find(s=>s.id==='g4-math-hk1-b05')?.state;});expect(initial).toBe('locked');
await expect.poll(()=>page.evaluate(()=>app.game.getLearningPlan().states.find(s=>s.id==='g4-math-hk1-b05')?.state)).toBe('available');
await page.evaluate(()=>{window.remoteSettings={lessonReleaseByClass:{4:{math:'g4-math-hk1-b08'}},practicePass:{math:{enabled:false,score:8}}};window.dispatchEvent(new Event('focus'));});
await expect.poll(()=>page.evaluate(()=>app.game.getLearningPlan().states.find(s=>s.id==='g4-math-hk1-b08')?.state)).toBe('available');
expect(await page.evaluate(()=>app.game.getLearningPlan().states.find(s=>s.id==='g4-math-hk1-b09')?.state)).toBe('locked');
const cached=await page.evaluate(()=>JSON.parse(localStorage.getItem('game_settings')));expect(cached.lessonReleaseByClass[4].math).toBe('g4-math-hk1-b08');
});

test('refresh lỗi hoặc đổi tài khoản không ghi đè cài đặt cuối',async({page})=>{
await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');
const result=await page.evaluate(async()=>{window.supabase={};app.data.currentUser={id:'old',username:'old',role:'student'};app.data.settings={practicePass:{math:{enabled:true,score:8}}};const original=JSON.stringify(app.data.settings);app.data.fetchAllFromSupabase=async()=>{throw Error('offline');};const failed=await app.data.refreshLearningSettings();let finish;app.data.fetchAllFromSupabase=()=>new Promise(resolve=>finish=resolve);const pending=app.data.refreshLearningSettings();app.data.currentUser={id:'new',username:'new',role:'student'};finish([{id:1,data:{practicePass:{math:{enabled:false,score:8}}}}]);const changed=await pending;return{failed,changed,same:JSON.stringify(app.data.settings)===original};});expect(result).toEqual({failed:false,changed:false,same:true});
});

test('response GET cũ không ghi đè settings mới vừa nhận realtime',async({page})=>{
await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');
const result=await page.evaluate(async()=>{window.supabase={};app.data.currentUser={id:'s',username:'s',role:'student'};app.data.settings={practicePass:{math:{enabled:true,score:8}}};let finish;app.data.fetchAllFromSupabase=(table,field,value)=>{if(field!=='id'||value!==1)throw Error('wrong_scope');return new Promise(resolve=>finish=resolve);};const pending=app.data.refreshLearningSettings();const newer={practicePass:{math:{enabled:false,score:8}},lessonReleaseByClass:{4:{math:'g4-math-hk1-b08'}}};app.data.settings=newer;finish([{id:1,data:{practicePass:{math:{enabled:true,score:8}}}}]);return {applied:await pending,kept:app.data.settings===newer};});expect(result).toEqual({applied:false,kept:true});
});
