const {test,expect}=require('@playwright/test');
async function setup(page, mode) {
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.route('**/*.supabase.co/**',r=>r.abort());
 if(process.env.AUDIT_BASELINE_CODE) await page.route('**/src/main.js*',r=>r.fulfill({contentType:'application/javascript',body:require('node:fs').readFileSync(process.env.AUDIT_BASELINE_CODE,'utf8')}));
 await page.goto('/');
 await page.evaluate(mode=>{
  window.alerts=[];window.alert=m=>alerts.push(m);window.confirm=()=>true;
  app.data.currentUser={id:'teacher',username:'teacher',role:'admin'};app.data.adminDataLoaded=true;window.supabase={};
  app.data.libraryQuestions=[{id:11,type:'Điền khuyết',q:'1 + 1 = ___',ans:'2',subject:'Toán',classlevel:'Lớp 4',semester:'Học Kỳ 1',topic:'1. Ôn tập và bổ sung',options:[]}];
  app.data.exams=[{id:22,name:'Đề',subject:'Toán',classlevel:'Lớp 4',questions:[]}];
  window.requests=[];window.auditMode=mode;
  supabaseClient={from(table){const q={table,action:'select',ids:[],select(){return this;},single(){this.one=true;return this;},eq(k,v){this.ids=[v];return this;},in(k,v){this.ids=v;return this;},upsert(rows){this.action='upsert';this.rows=rows;return this;},insert(rows){this.action='insert';this.rows=rows;return this;},update(row){this.action='update';this.rows=row;return this;},delete(){this.action='delete';return this;},then(resolve,reject){mode=window.auditMode;requests.push({table,action:this.action});
   const error=mode==='denied'?{code:'42501',message:'Permission denied'}:null;
   const data=mode==='empty'?[]:this.action==='delete'?this.ids.map(id=>({id})):table==='game_settings'?{id:1,data:this.rows?.data||app.data.settings}:this.one?{...(Array.isArray(this.rows)?this.rows[0]:this.rows),id:this.ids[0]||100}:(Array.isArray(this.rows)?this.rows:this.rows?[this.rows]:[]).map((r,i)=>({...r,id:r.id||this.ids[0]||100+i}));
   return Promise.resolve({data,error}).then(resolve,reject);}};return q;}};
 },mode);
}
for(const mode of ['denied','empty']) {
 test(`Kho câu hỏi trả lỗi thay vì thành công khi ${mode}`,async({page})=>{await setup(page,mode);expect(await page.evaluate(async()=>Boolean(await app.data.saveLibrary()))).toBe(true);});
 for(const kind of ['Question','Exam'])test(`xóa ${kind} giữ dữ liệu khi ${mode}`,async({page})=>{await setup(page,mode);const result=await page.evaluate(async kind=>{await app.admin['delete'+kind](0);return {count:app.data[kind==='Question'?'libraryQuestions':'exams'].length,alerts};},kind);expect(result.count).toBe(1);expect(result.alerts.some(m=>m.includes('Chưa')||m.includes('Không thể'))).toBe(true);});
 test(`metadata không xác nhận lưu khi ${mode}`,async({page})=>{await setup(page,mode);expect(await page.evaluate(async()=>Boolean(await app.data.saveLessonMetadata()))).toBe(true);});
}
test('lỗi lưu câu hỏi giữ form chỉnh sửa và không thông báo đã cập nhật',async({page})=>{
 await setup(page,'denied');await page.evaluate(()=>{app.admin.openComposer();app.admin.renderComposerModule('questions');app.admin.renderQSubTab('add',0);});
 await page.locator('#add-q-q').fill('1 + 2 = ___');await page.evaluate(async()=>{await app.admin.submitAddQuestion(0);});
 expect(await page.evaluate(()=>alerts.some(m=>m.startsWith('Đã cập nhật')))).toBe(false);
 await expect(page.locator('#add-q-q')).toHaveValue('1 + 2 = ___');
});

for (const mode of ['denied','empty']) test(`Phiếu giữ hàng đợi xóa khi ${mode}`,async({page})=>{
 await setup(page,mode); const result=await page.evaluate(async()=>{
 app.data.worksheets=[];app.safeStorage.setItem('game_worksheets_deleted_ids',JSON.stringify([44]));
 const error=await app.data.saveWorksheets();return {failed:Boolean(error),queue:app.data.loadWorksheetDeletedIds()};
 });expect(result.failed).toBe(true);expect(result.queue).toEqual([44]);
});
test('xóa thành công chỉ bỏ đúng bản ghi đã được máy chủ xác nhận',async({page})=>{
 await setup(page,'success');await page.evaluate(async()=>{app.admin.openComposer();app.admin.renderComposerModule('questions');await app.admin.deleteQuestion(0);app.admin.renderComposerModule('exams');await app.admin.deleteExam(0);});
 expect(await page.evaluate(()=>[app.data.libraryQuestions.length,app.data.exams.length])).toEqual([0,0]);
});

test('UPDATE đề 0 hàng được báo lỗi và giữ bản chờ đồng bộ',async({page})=>{await setup(page,'empty');expect(await page.evaluate(async()=>Boolean(await app.data.saveExams()))).toBe(true);});
for(const mode of ['denied','empty','invalid'])test(`import ghi đè đề giữ kho trước đó khi ${mode}`,async({page})=>{
 await setup(page,mode);await page.evaluate(mode=>{
 app.admin.openComposer();app.admin.renderComposerModule('exams');app.admin.renderESubTab('imp');
 document.querySelector('input[name="e-import-mode"][value="overwrite"]').checked=true;
 app.ui.importFromExcel=(file,callback)=>callback(mode==='invalid'?[{'Tên đề':'','Môn':'Sai'}]:[{'Tên đề':'Đề mới','Môn':'Toán','Cấp lớp':'Lớp 4'}]);
 },mode);
 await page.locator('#e-file-upload').setInputFiles({name:'fixture.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('fixture')});
 await page.evaluate(()=>app.admin.submitImportExams());
 await expect.poll(()=>page.evaluate(()=>alerts.length)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>app.data.exams.map(e=>e.name))).toEqual(['Đề']);
 expect(await page.evaluate(()=>alerts.some(m=>m.includes('thành công')))).toBe(false);
});

test('thử lại preview vẫn phải lưu câu hỏi sau lần lỗi',async({page})=>{
 await setup(page,'denied');const result=await page.evaluate(async()=>{
 const question={...app.data.libraryQuestions[0],id:undefined,q:'2 + 2 = ___',ans:'4'};
 app.admin.getTemplatePreviewRecord=()=>({question,template:{}});window.closedPreview=0;app.admin.closeTemplatePreview=()=>closedPreview++;
 await app.admin.savePreviewToExistingExam();const before=requests.length;await app.admin.savePreviewToExistingExam();return {before,after:requests.length,closedPreview};
 });expect(result.after).toBeGreaterThan(result.before);expect(result.closedPreview).toBe(0);
});
test('form đề vẫn mở khi máy chủ từ chối lưu',async({page})=>{
 await setup(page,'denied');await page.evaluate(()=>{
 app.data.exams[0].questions=Array.from({length:10},(_,i)=>({...app.data.libraryQuestions[0],q:`${i} + 1 = ___`,ans:String(i+1)}));
 app.admin.openComposer();app.admin.renderComposerModule('exams');app.admin.renderESubTab('add',0);
 });await page.evaluate(()=>app.admin.submitAddExam(0,false));await expect(page.locator('#add-e-name')).toHaveValue('Đề');
});

test('bấm xóa hai lần lúc server chậm chỉ xóa một câu',async({page})=>{
 await setup(page,'success');const result=await page.evaluate(async()=>{
 app.data.exams[0].questions=['A','B','C'].map(q=>({...app.data.libraryQuestions[0],q}));
 app.admin.openComposer();app.admin.renderComposerModule('exams');
 const from=supabaseClient.from.bind(supabaseClient);supabaseClient.from=table=>{const q=from(table),then=q.then.bind(q);q.then=(resolve,reject)=>new Promise(r=>setTimeout(r,150)).then(()=>then(resolve,reject));return q;};
 await Promise.all([app.admin.removeQuestionFromExam(0,0),app.admin.removeQuestionFromExam(0,0)]);return app.data.exams[0].questions.map(q=>q.q);
 });expect(result).toEqual(['B','C']);
});
for (const role of ['admin','student']) test('retry xóa Phiếu mất phản hồi xác minh profile '+role,async({page})=>{
 await setup(page,'empty');const result=await page.evaluate(async role=>{
 app.data.worksheets=[];app.safeStorage.setItem('game_worksheets_deleted_ids','[44]');
 supabaseClient.auth={getUser:async()=>({data:{user:{id:'auth-teacher'}},error:null})};
 const from=supabaseClient.from.bind(supabaseClient);supabaseClient.from=table=>{
 if(table==='game_users')return {select(){return this;},eq(){return this;},single:async()=>({data:{role},error:null})};
 return from(table);
 };
 const failed=Boolean(await app.data.saveWorksheets());return {failed,queue:app.data.loadWorksheetDeletedIds()};
 },role);expect(result.failed).toBe(role!=='admin');expect(result.queue).toEqual(role==='admin'?[]:[44]);
});

for (const score of ['0','-1','101']) test('nhiệm vụ giữ điểm 0 và chặn ngoài phạm vi: '+score,async({page})=>{
 await setup(page,'success');await page.evaluate(()=>{delete window.supabase;app.data.quests=[];app.admin.openAdmin('quests');});
 await page.locator('[data-quest-launch=personal]').click();await page.locator('#btn-personal-quest-create').click();
 await page.locator('#quest-title').fill('Nhiệm vụ thử');await page.locator('#quest-score').fill(score);
 await page.evaluate(()=>app.admin.submitQuest());const result=await page.evaluate(()=>({count:app.data.quests.length,score:app.data.quests[0]?.target_score,alerts}));
 if(score==='0'){expect(result.count).toBe(1);expect(result.score).toBe(0);}else {expect(result.count).toBe(0);expect(result.alerts.length).toBeGreaterThan(0);}
});

for(const mode of ['parse-error','load-error'])test('file Excel lỗi mở lại nút nhập: '+mode,async({page})=>{
 await setup(page,'success');await page.evaluate(mode=>{
 app.admin.openComposer();app.admin.renderComposerModule('questions');app.admin.renderQSubTab('imp');
 if(mode==='parse-error')window.XLSX={read(){throw Error('Workbook không hợp lệ');}};
 else {delete window.XLSX;app.utils.loadScript=async()=>false;}
 },mode);
 await page.locator('#q-file-upload').setInputFiles({name:'fixture.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('invalid')});
 await page.locator('button[onclick="app.admin.submitImportQuestions()"]').click();
 await expect(page.locator('button[onclick="app.admin.submitImportQuestions()"]')).toBeEnabled({timeout:2500});
 expect(await page.evaluate(()=>app.data.libraryQuestions[0].id)).toBe(11);
});

for(const action of ['toggleQuest','deleteQuest'])test('nhiệm vụ '+action+' không nhận DELETE/UPDATE 0 hàng',async({page})=>{
 await setup(page,'empty');const result=await page.evaluate(async action=>{
 app.data.quests=[{id:'quest-test',title:'Nhiệm vụ',is_active:true}];app.admin.openAdmin('quests');
 await app.admin[action](0);return {count:app.data.quests.length,active:app.data.quests[0]?.is_active,alerts};
 },action);expect(result.count).toBe(1);expect(result.active).toBe(true);expect(result.alerts.length).toBeGreaterThan(0);
});

test('nhiệm vụ chưa lưu phạm vi không được mở cho học sinh',async({page})=>{
 await setup(page,'success');await page.evaluate(()=>{
 app.data.quests=[];app.admin.openAdmin('quests');
 const from=supabaseClient.from.bind(supabaseClient);supabaseClient.from=table=>{const q=from(table);if(table==='game_settings')q.then=(resolve,reject)=>Promise.resolve({data:null,error:{message:'Metadata denied'}}).then(resolve,reject);return q;};
 });await page.locator('[data-quest-launch=personal]').click();await page.locator('#btn-personal-quest-create').click();await page.locator('#quest-title').fill('Giới hạn phạm vi');await page.evaluate(()=>app.admin.submitQuest());
 expect(await page.evaluate(()=>app.data.quests[0]?.is_active)).toBe(false);await expect(page.locator('#quest-title')).toHaveValue('Giới hạn phạm vi');
});

for(const isW of [false,true])test('retry bản chưa có ID thay bản nháp '+(isW?'Phiếu':'Đề'),async({page})=>{
 await setup(page,'denied');const m=isW?'w':'e';await page.evaluate(isW=>{
 const draft={name:'Bản đầu',subject:'Toán',classlevel:'Lớp 4',period:'Học Kỳ 1',questions:Array.from({length:10},(_,i)=>({...app.data.libraryQuestions[0],id:undefined,q:`${i}+1=___`,ans:String(i+1)}))};
 app.data[isW?'worksheets':'exams']=[];app.admin[isW?'worksheetComposerDraft':'examComposerDraft']=draft;
 app.admin.openComposer();app.admin.renderComposerModule(isW?'worksheets':'exams');app.admin[isW?'renderWSubTab':'renderESubTab']('add');
 },isW);
 await page.evaluate(isW=>app.admin.submitAddExam(null,isW),isW);await page.locator('#add-'+m+'-name').fill('Bản đã sửa');
 await page.evaluate(isW=>{window.auditMode='success';return app.admin.submitAddExam(null,isW);},isW);
 expect(await page.evaluate(isW=>app.data[isW?'worksheets':'exams'].map(e=>e.name),isW)).toEqual(['Bản đã sửa']);
});
test('hai đề lưu đồng thời không ghi đè trạng thái mới bằng response cũ',async({page})=>{
 await setup(page,'success');const result=await page.evaluate(async()=>{
 app.data.exams=[{id:22,name:'Một',questions:['A','B'].map(q=>({q}))},{id:23,name:'Hai',questions:['C','D'].map(q=>({q}))}];
 let sequence=0;window.remoteRows=[];
 supabaseClient={from(){return {upsert(rows){this.rows=JSON.parse(JSON.stringify(rows));return this;},select(){return this;},then(resolve,reject){const rows=this.rows,delay=++sequence===1?100:10;return new Promise(r=>setTimeout(()=>{remoteRows=rows;r({data:rows.map(e=>({id:e.id})),error:null});},delay)).then(resolve,reject);}};}};
 const first=app.admin.applyComposerMutation(app.data.exams[0],false,()=>app.data.exams[0].questions.reverse());
 await new Promise(r=>setTimeout(r,25));const second=app.admin.applyComposerMutation(app.data.exams[1],false,()=>app.data.exams[1].questions.reverse());
 await Promise.all([first,second]);return {local:app.data.exams.map(e=>e.questions.map(q=>q.q)),remote:remoteRows.map(e=>e.questions.map(q=>q.q))};
 });expect(result.remote).toEqual(result.local);
});
test('nhiệm vụ nháp sau reload không được bật khi thiếu phạm vi',async({page})=>{
 await setup(page,'success');const result=await page.evaluate(async()=>{
 app.data.quests=[{id:'quest-draft',title:'[Chưa hoàn tất] Giới hạn phạm vi',is_active:false}];app.admin.openAdmin('quests');
 await app.admin.toggleQuest(0);return {active:app.data.quests[0].is_active,requests,alerts};
 });expect(result.active).toBe(false);expect(result.requests.filter(r=>r.table==='game_quests')).toHaveLength(0);
});

test('retry nhiệm vụ lưu phạm vi xong mới mở, không tạo nhiệm vụ trùng',async({page})=>{
 await setup(page,'success');await page.evaluate(()=>{app.data.quests=[];app.admin.openAdmin('quests');});
 await page.locator('[data-quest-launch=personal]').click();await page.locator('#btn-personal-quest-create').click();
 await page.evaluate(()=>{window.metadataDenied=true;const from=supabaseClient.from.bind(supabaseClient);supabaseClient.from=table=>{const q=from(table),then=q.then.bind(q);q.then=(resolve,reject)=>table==='game_settings'&&metadataDenied?Promise.resolve({data:null,error:{message:'Metadata denied'}}).then(resolve,reject):then(resolve,reject);return q;};});
 await page.locator('#quest-title').fill('Phạm vi đã sửa');await page.evaluate(()=>app.admin.submitQuest());
 expect(await page.evaluate(()=>app.data.quests[0].is_active)).toBe(false);
 await page.evaluate(()=>{window.metadataDenied=false;return app.admin.submitQuest();});
 const result=await page.evaluate(()=>({quests:app.data.quests,insertCount:requests.filter(r=>r.table==='game_quests'&&r.action==='insert').length}));
 expect(result.quests).toHaveLength(1);expect(result.quests[0].is_active).toBe(true);expect(result.quests[0].title).toBe('Phạm vi đã sửa');expect(result.insertCount).toBe(1);
});
