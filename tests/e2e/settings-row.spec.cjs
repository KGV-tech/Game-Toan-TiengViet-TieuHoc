const {test,expect}=require('@playwright/test');
async function loginFixture(page){
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.route('**/*.supabase.co/**',r=>r.abort());
  await page.addInitScript(()=>{
    const user={id:'teacher',auth_user_id:'teacher-auth',username:'teacher',role:'admin',classlevel:'4',approved:true,history:[],stars:0};
    const rows=[{id:2,data:{lessonReleaseByClass:{4:{math:'g4-math-hk1-b01'}}}},{id:1,data:{lessonReleaseByClass:{4:{math:'g4-math-hk1-b09'}}}}];
    window.settingsReads=[];window.settingsCallbacks={};
    const client={auth:{signInWithPassword:async()=>({data:{user:{id:'teacher-auth'}},error:null})},
      channel(){return{on(type,filter,callback){window.settingsCallbacks[filter.table]=callback;return this;},subscribe(){return this;},unsubscribe(){}};},
      from(table){return{filters:[],select(){return this;},eq(field,value){this.filters.push({field,value});return this;},ilike(field){if(table==='game_settings'&&field==='id')throw Error('Cannot use ILIKE on numeric settings id');return this;},single(){return Promise.resolve({data:user,error:null});},
        async range(){if(table==='game_settings'){window.settingsReads.push(this.filters);return {data:rows.filter(r=>this.filters.every(f=>r[f.field]===f.value)),error:null};}return {data:table==='game_users'?[user]:[],error:null};},then(resolve,reject){return this.range().then(resolve,reject);}
      };}
    };window.supabase={createClient:()=>client};
  });
  await page.goto('/');
  await page.evaluate(()=>{app.teamCompetition.syncRemote=async()=>[];app.game.flushPendingResults=async()=>{};app.daily.onMapEnter=()=>{};});
  await page.locator('#username').fill('teacher');await page.locator('#password').fill('fixture-only');await page.locator('#login-btn').click();
  await expect(page.locator('#map-screen')).toHaveClass(/active/);
}

test('đăng nhập lại đọc hàng id=1 đã lưu bài9, không lấy hàng đầu bất kỳ',async({page})=>{
  await loginFixture(page);
  expect(await page.evaluate(()=>app.data.settings.lessonReleaseByClass[4].math)).toBe('g4-math-hk1-b09');
  expect(await page.evaluate(()=>window.settingsReads[0])).toContainEqual({field:'id',value:1});
});

test('realtime hàng cài đặt khác không ghi đè hàng id=1',async({page})=>{
  await loginFixture(page);
  await page.evaluate(()=>{app.data.settings={lessonReleaseByClass:{4:{math:'g4-math-hk1-b09'}}};window.settingsCallbacks.game_settings({new:{id:2,data:{lessonReleaseByClass:{4:{math:'g4-math-hk1-b01'}}}}});});
  expect(await page.evaluate(()=>app.data.settings.lessonReleaseByClass[4].math)).toBe('g4-math-hk1-b09');
  await page.evaluate(()=>window.settingsCallbacks.game_settings({new:{id:1,data:{lessonReleaseByClass:{4:{math:'g4-math-hk1-b05'}}}}}));
  expect(await page.evaluate(()=>app.data.settings.lessonReleaseByClass[4].math)).toBe('g4-math-hk1-b05');
});
test('học sinh refresh dùng EQ trên ID, không dùng ILIKE cho cột số',async({page})=>{
  await loginFixture(page);
  const result=await page.evaluate(async()=>{app.data.currentUser={id:'student',username:'student',role:'student',classlevel:'4'};app.data.settings={lessonReleaseByClass:{4:{math:'g4-math-hk1-b01'}}};return {ok:await app.data.refreshLearningSettings(),lesson:app.data.settings.lessonReleaseByClass[4].math,filter:window.settingsReads.at(-1)};});
  expect(result.ok).toBe(true);expect(result.lesson).toBe('g4-math-hk1-b09');expect(result.filter).toEqual([{field:'id',value:1}]);
});