const {test,expect}=require('@playwright/test');
async function open(page,isW=true){
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.goto('/');
 await page.evaluate(isW=>{
  app.data.currentUser={username:'teacher',role:'admin'};app.data.exams=[];app.data.worksheets=[];
  app.data.libraryQuestions=Array.from({length:60},(_,i)=>({classlevel:'Lớp 4',subject:'Toán',topic:'1. Ôn tập và bổ sung',type:'Trắc nghiệm',q:`Tính ${i}+1?`,options:[String(i+1),'sai'],ans:String(i+1)}));
  app.data.questionTemplates=[];app.data.saveWorksheets=async()=>null;app.data.saveExams=async()=>null;app.data.saveLibrary=async()=>null;
  app.admin.openComposer(isW?'worksheets':'exams');app.admin[isW?'renderWSubTab':'renderESubTab']('add');
 },isW);
 await page.locator(`#add-${isW?'w':'e'}-plan-custom`).check();
 await expect(page.locator(`#add-${isW?'w':'e'}-plan-count`)).toBeVisible();
}
async function change(page,selector,value){await page.locator(selector).fill(String(value));}
async function create(page,id){
 await change(page,`#add-${id}-plan-count`,3);
 await change(page,`#add-${id}-plan-parts-0`,3);
 await page.locator(`#add-${id}-plan-sub-1`).uncheck();
 await change(page,`#add-${id}-plan-parts-2`,2);
 await page.locator(`#add-${id}-name`).fill('Cơ cấu 3 câu');
 await page.locator(`#add-${id}-topics input`).first().check();
 await page.evaluate(id=>app.admin.autoGenerateExam(id==='w'),id);
 await expect(page.locator('.exam-question-card')).toHaveCount(3);
}
for(const isW of [true,false])test(`${isW?'Phiếu':'Đề'}: tạo, chỉnh, lưu, mở lại cơ cấu 3/1/2`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page,isW);const id=isW?'w':'e';await create(page,id);
 await expect(page.locator(`#add-${id}-plan .authoring-score--warning`).first()).toHaveText('3,333333333333… đ');
 await expect(page.locator('.authoring-part')).toHaveCount(5);
 await page.locator(`#ap-${id}-0-0-q`).fill('Nội dung đã chỉnh');
 page.on('dialog',d=>d.accept());await page.evaluate(isW=>app.admin.submitAddExam(null,isW),isW);
 const result=await page.evaluate(isW=>({data:app.data[isW?'worksheets':'exams'],other:app.data[isW?'exams':'worksheets'],bank:app.data.libraryQuestions.length}),isW);
 expect(result.data).toHaveLength(1);expect(result.other).toHaveLength(0);expect(result.bank).toBe(60);
 expect(result.data[0].questions.map(q=>q.authoringParts?.length||1)).toEqual([3,1,2]);expect(result.data[0].questions[0].authoringParts[0].q).toBe('Nội dung đã chỉnh');
 await page.evaluate(isW=>{app.admin[isW?'worksheetComposerDraft':'examComposerDraft']=null;app.admin[isW?'renderWSubTab':'renderESubTab']('add',0)},isW);
 await expect(page.locator(`#add-${id}-plan-count`)).toHaveValue('3');await expect(page.locator(`#add-${id}-plan-parts-0`)).toHaveValue('3');expect(errors).toEqual([]);
});
test('Điểm chính xác 2 số xanh; 3 số và vô hạn đỏ; chặn cơ cấu sai',async({page})=>{
 await open(page);await change(page,'#add-w-plan-count',8);await change(page,'#add-w-plan-parts-0',5);
 await expect(page.locator('#add-w-plan fieldset').first().locator('.authoring-score--good').last()).toHaveText('0,25 đ');
 await change(page,'#add-w-plan-count',16);await expect(page.locator('#add-w-plan fieldset').first().locator('legend .authoring-score--warning')).toHaveText('0,625 đ');
 await change(page,'#add-w-plan-parts-0',0);await page.evaluate(()=>app.admin.autoGenerateExam(true));
 await expect(page.locator('#add-w-form-error')).toContainText('không hợp lệ');await expect(page.locator('.exam-question-card')).toHaveCount(10);
});
test('Nút nhập ảnh ở thanh thư viện, cạnh soạn phiếu mới',async({page})=>{
 await open(page);await page.evaluate(()=>app.admin.renderWSubTab('lib'));
 const button=page.getByRole('button',{name:'Tạo phiếu từ ảnh/file',exact:true});await expect(button).toHaveCount(1);
 expect(await button.evaluate(el=>el.previousElementSibling?.id)).toBe('btn-w-add');await button.click();await expect(page.locator('#ws-source-files')).toBeVisible();
});
test('Chấm và khôi phục đáp án đề có số câu con tùy chọn',async({page})=>{
 await open(page,false);await create(page,'e');
 const result=await page.evaluate(()=>{
  const questions=app.admin.examComposerDraft.questions;
  const container=document.createElement('div');document.body.append(container);container.innerHTML=questions.map((q,i)=>app.exam.renderQuestionInput(q,i)).join('');
  app.exam.state.questions=questions;
  const answers=questions.map(q=>q.authoringParts?q.authoringParts.map(p=>p.ans):q.ans);app.exam.applySavedAnswers(answers);
  const read=questions.map((q,i)=>app.exam.readQuestionAnswer(q,i));
  const perfect=questions.reduce((sum,q,i)=>sum+app.game.calculateQuestionScore(q,read[i]).points*10/questions.length,0);
  const partial=app.game.calculateQuestionScore(questions[0],[questions[0].authoringParts[0].ans,'','']).points;
  const print=app.admin.renderExamPrintQuestion(questions[0],0);
  return {read,answers,perfect,partial,print,error:AuthoringPlan.validateRecord({questions})};
 });
 expect(result.read).toEqual(result.answers);expect(result.perfect).toBeCloseTo(10);expect(result.partial).toBeCloseTo(1/3);expect(result.error).toBe('');expect(result.print).toContain('Tính 0+1?');
});

test('Không đủ nguồn giữ bản đang soạn; đổi thứ tự và xóa vẫn có cơ cấu hợp lệ',async({page})=>{
 await open(page);await create(page,'w');
 await page.evaluate(()=>app.data.libraryQuestions=[]);
 await page.evaluate(()=>app.admin.autoGenerateExam(true));
 await expect(page.locator('#add-w-form-error')).toContainText('mới có 0');await expect(page.locator('.exam-question-card')).toHaveCount(3);
 page.on('dialog',d=>d.accept());await page.evaluate(()=>app.admin.submitAddExam(null,true));
 const result=await page.evaluate(()=>{
  app.admin.moveQuestion(0,0,'down',true);app.admin.removeQuestionFromExam(0,0,true);
  const record=app.data.worksheets[0];return {error:AuthoringPlan.validateRecord(record),count:record.questions.length};
 });expect(result).toEqual({error:'',count:2});
});
test('Nội dung câu con tham gia chống trùng; chặn chèn câu thường vào đề riêng',async({page})=>{
 await open(page,false);
 expect(await page.evaluate(()=>JSON.parse(app.data.getQuestionContentKey(app.data.libraryQuestions[0])).length)).toBe(10);
 await create(page,'e');page.on('dialog',d=>d.accept());await page.evaluate(()=>app.admin.submitAddExam(null,false));
 const result=await page.evaluate(()=>{
  const first=app.data.exams[0].questions[0],second=JSON.parse(JSON.stringify(first));second.authoringParts[0].q='Nội dung khác';
  const different=app.data.getQuestionContentKey(first)!==app.data.getQuestionContentKey(second);
  app.admin.submitInjectQ(0,0);return {different,error:AuthoringPlan.validateRecord(app.data.exams[0]),count:app.data.exams[0].questions.length};
 });expect(result).toEqual({different:true,error:'',count:3});
});
test('Đề tùy chỉnh nộp thực tế đạt đúng 10 điểm',async({page})=>{
 await open(page,false);await create(page,'e');
 const score=await page.evaluate(()=>{
  const questions=app.admin.examComposerDraft.questions;
  app.exam.state.questions=questions;app.exam.state.name='Đề tùy chỉnh';app.exam.state.finished=false;app.exam.state.historyDetails=[];
  app.exam.renderAttempt(60,questions.map(q=>q.authoringParts?q.authoringParts.map(p=>p.ans):q.ans));
  app.game.finishPlay=()=>{};app.exam.submit(true);return app.exam.state.score;
 });expect(score).toBe(10);
});
for(const width of [1024,1280,1440])test(`Cơ cấu điểm không tràn và giữ màu cảnh báo ở ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:768});await open(page);
 await change(page,'#add-w-plan-count',8);await change(page,'#add-w-plan-parts-0',5);
 for(const theme of ['light','dark']) {
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  const badge=page.locator('#add-w-plan fieldset').first().locator('.authoring-score--good').last();
  await badge.scrollIntoViewIfNeeded();expect(await badge.evaluate(el=>getComputedStyle(el).color)).toBe('rgb(20, 83, 45)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`authoring-${width}-${theme}.png`)});
 }
});
