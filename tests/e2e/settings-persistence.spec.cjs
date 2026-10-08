const {test,expect}=require('@playwright/test');
async function setup(page,mode='empty') {
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
  await page.route('**/*.supabase.co/**',r=>r.abort());
  await page.goto('/');
  await page.evaluate(mode=>{
    app.data.currentUser={id:'teacher',username:'teacher',role:'admin'};
    app.data.settings={hardTimeLimit:15,examTimeLimit:30,lessonReleaseByClass:{4:{math:'g4-math-hk1-b01'}},practicePass:{math:{enabled:true,score:8},vietnamese:{enabled:true,score:8}}};
    localStorage.setItem('game_settings',JSON.stringify(app.data.settings));
    window.savedSettings=JSON.parse(JSON.stringify(app.data.settings));window.settingsCalls=[];window.supabase={};
    supabaseClient={from(table){const q={write:false,eq(field,value){window.settingsCalls.push({table,field,value,write:this.write});return this;},update(payload){this.write=true;this.payload=JSON.parse(JSON.stringify(payload));return this;},select(){return this;},single(){return this;},then(resolve,reject){
      if(this.write){if(mode==='reject')return Promise.reject(Error('Network failed')).then(resolve,reject);
        if(mode==='empty')return Promise.resolve(resolve({data:[],error:null}));
        window.savedSettings=this.payload.data;
        return Promise.resolve(resolve({data:{id:1,data:window.savedSettings},error:null}));}
      const data=mode==='stale'?{...window.savedSettings,lessonReleaseByClass:{4:{math:'g4-math-hk1-b01'}}}:window.savedSettings;
      return Promise.resolve(resolve({data:{id:1,data},error:null}));
    }};return q;}};
    app.admin.openLearningPath('math');
  },mode);
}

test('không báo đã lưu mốc 9 khi Supabase UPDATE không thay hàng nào',async({page})=>{
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.accept();});await setup(page);
  await page.locator('#learning-release-lesson').selectOption('g4-math-hk1-b09');await page.locator('#learning-release-save-button').click();
  await expect(page.locator('#learning-release-save-button')).toBeEnabled();
  expect(dialogs.some(message=>message.startsWith('Đã lưu'))).toBe(false);
  expect(dialogs.some(message=>message.includes('Chưa lưu'))).toBe(true);
  expect(await page.evaluate(()=>app.data.settings.lessonReleaseByClass[4].math)).toBe('g4-math-hk1-b01');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('game_settings')).lessonReleaseByClass[4].math)).toBe('g4-math-hk1-b01');
});

test('lưu mốc 9 chỉ báo thành công sau khi ghi và đọc lại hàng id=1',async({page})=>{
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.accept();});await setup(page,'success');
  await page.locator('#learning-release-lesson').selectOption('g4-math-hk1-b09');await page.locator('#learning-release-save-button').click();
  await expect.poll(()=>dialogs.some(message=>message.startsWith('Đã lưu'))).toBe(true);
  const result=await page.evaluate(()=>({saved:window.savedSettings.lessonReleaseByClass[4].math,cache:JSON.parse(localStorage.getItem('game_settings')).lessonReleaseByClass[4].math,calls:window.settingsCalls}));
  expect(result.saved).toBe('g4-math-hk1-b09');expect(result.cache).toBe(result.saved);
  expect(result.calls.filter(c=>c.table==='game_settings'&&c.field==='id'&&c.value===1).map(c=>c.write)).toEqual([true,false]);
});
for (const mode of ['stale','reject','offline']) test(`lưu mốc không báo thành công khi ${mode}`,async({page})=>{
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.accept();});await setup(page,mode);
  if(mode==='offline')await page.evaluate(()=>{delete window.supabase;});
  await page.locator('#learning-release-lesson').selectOption('g4-math-hk1-b09');await page.locator('#learning-release-save-button').click();
  await expect.poll(()=>dialogs.some(message=>message.includes('Chưa lưu'))).toBe(true);
  expect(dialogs.some(message=>message.startsWith('Đã lưu'))).toBe(false);
  await expect(page.locator('#learning-release-save-button')).toBeEnabled();
  expect(await page.evaluate(()=>app.data.settings.lessonReleaseByClass[4].math)).toBe('g4-math-hk1-b01');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('game_settings')).lessonReleaseByClass[4].math)).toBe('g4-math-hk1-b01');
});

test('nút lưu cài đặt điểm cũng không báo thành công khi Supabase không ghi',async({page})=>{
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.accept();});await setup(page);
  await page.evaluate(()=>app.admin.openAdmin('settings'));await page.locator('#setting-pass-math-enabled').uncheck();await page.locator('#settings-save-button').click();
  await expect.poll(()=>dialogs.some(message=>message.includes('Chưa lưu'))).toBe(true);expect(dialogs.some(message=>message.startsWith('Đã lưu'))).toBe(false);
  expect(await page.evaluate(()=>app.data.settings.practicePass.math.enabled)).toBe(true);
  await expect(page.locator('#settings-save-button')).toBeEnabled();
});

test('JSONB đổi thứ tự khóa vẫn được xác nhận là cùng giá trị',async({page})=>{
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.accept();});await setup(page,'success');
  await page.evaluate(()=>{const from=supabaseClient.from.bind(supabaseClient);supabaseClient.from=table=>{const q=from(table),then=q.then.bind(q);q.then=resolve=>then(result=>{if(result.data?.data)result.data.data=Object.fromEntries(Object.entries(result.data.data).reverse());return resolve(result);});return q;};});
  await page.locator('#learning-release-lesson').selectOption('g4-math-hk1-b09');await page.locator('#learning-release-save-button').click();
  await expect.poll(()=>dialogs.some(message=>message.startsWith('Đã lưu'))).toBe(true);
});