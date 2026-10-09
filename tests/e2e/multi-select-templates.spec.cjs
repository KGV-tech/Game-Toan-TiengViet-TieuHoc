const { test, expect } = require('@playwright/test');
async function open(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({contentType:'application/javascript',body:''}));
  await page.goto('/');
}
async function play(page, templateId='selection.math', lesson='g4-math-hk1-b03', selectionTarget='correct') {
  return page.evaluate(({templateId,lesson,selectionTarget}) => {
    const q = MultiSelectTemplates.generateQuestion(templateId,{lesson,selectionTarget});
    app.data.currentUser = {username:'selection-local',role:'student',classlevel:'4'};
    app.game.state = {subject:templateId.endsWith('math')?'math':'vietnamese',score:0,currentIdx:0,questions:[q],historyDetails:[]};
    document.querySelectorAll('.screen, .game-view').forEach(e => e.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.loadQuestion();
    return q;
  },{templateId,lesson,selectionTarget});
}
test('all built-in lessons generate ten unique tiles with reviewed Vietnamese evidence', async ({page}) => {
  await open(page);
  const results = await page.evaluate(() => MultiSelectTemplates.getDefaultTemplates().map(template => {
    const errors=[];
    for(let i=0;i<20;i++) {
      const q=app.data.generateTemplateQuestion(template);
      if(!q) {errors.push('generation failed');continue;}
      if(app.data.validateQuestionScoring(q)) errors.push(app.data.validateQuestionScoring(q));
      if(q.subject==='Tiếng Việt' && q.selectionItems.some(item => !item.evidence?.recordId || !item.evidence.excerpt)) errors.push('missing source');
      if(!app.game.calculateQuestionScore(q,[...q.correctIds].reverse()).isCorrect) errors.push('scoring');
    }
    return {lesson:template.lesson,errors};
  }));
  expect(results.length).toBeGreaterThan(100);
  expect(results.filter(item=>item.errors.length)).toEqual([]);
});
for(const width of [1280,1440,1024]) test(`ten tiles remain visible and reversible at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:width===1440?900:width===1280?720:768}); await open(page);
  const q=await play(page);
  const tiles=page.locator('#game-options-container .selection-tile');
  await expect(tiles).toHaveCount(10);
  for(const tile of await tiles.all()) await expect(tile).toBeInViewport();
  await tiles.first().click(); await expect(tiles.first()).toHaveAttribute('aria-pressed','true');
  await tiles.first().click(); await expect(tiles.first()).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#submit-ans-btn')).toBeDisabled();
  for(const id of q.correctIds) await page.locator(`[data-selection-id="${id}"]`).click();
  if(width===1280) await page.screenshot({path:'.tmp/multi-select-1280.png'});
  await page.evaluate(()=>app.game.submitAnswer());
  expect(await page.evaluate(()=>app.game.state.score)).toBe(1);
  await expect(page.locator('.selection-tile--correct')).toHaveCount(q.correctIds.length);
});
test('choose incorrect comparisons and Vietnamese non-adjectives; exam set order, restore, history and print',async({page})=>{
  await open(page);
  const result=await page.evaluate(()=>{
    const math=MultiSelectTemplates.generateQuestion('selection.math',{lesson:'g4-math-hk1-b14',selectionTarget:'incorrect'});
    const viet=MultiSelectTemplates.generateQuestion('selection.vietnamese',{lesson:'g4-vietnamese-hk1-b21',selectionTarget:'incorrect',wordGroup:'adjective'});
    const validMath=math.selectionItems.every(item=>{const [a,sign,b]=item.text.replace(/ /g,'').match(/^(\d+)([<>])(\d+)$/).slice(1);return math.correctIds.includes(item.id) === !(sign==='<'?+a<+b:+a>+b);});
    document.getElementById('exam-questions-container').innerHTML=app.exam.renderQuestionInput(viet,0);
    app.exam.state.questions=[viet]; app.exam.applySavedAnswers([viet.correctIds.join(';')]);
    const answer=app.exam.readQuestionAnswer(viet,0);
    const detail=app.game.createHistoryDetail(viet,answer,true);
    return {validMath,prompt:math.q,examScore:app.game.calculateQuestionScore(viet,answer),history:detail,print:app.admin.renderExamPrintQuestion(viet,0)};
  });
  expect(result.validMath).toBe(true); expect(result.prompt).toContain('sai'); expect(result.examScore.points).toBe(1);
  expect(result.history.correct).not.toMatch(/^s\d(;s\d)*$/); expect(result.print).toContain('exam-print__choice-box');
});
test('common child prompts appear once; distinct data survives gameplay, exam, print and history',async({page})=>{
  await open(page);
  const result=await page.evaluate(()=>{
    const q={q:'Tiêu đề cũ',type:'Trắc nghiệm',ans:'2, 4',options:[],partAnswerCounts:[1,1],subquestions:[{label:'a',prompt:'Chọn số chẵn.<br>Dãy thứ nhất',answer:'2',options:['2','3']},{label:'b',prompt:'Chọn số chẵn.<br>Dãy thứ hai',answer:'4',options:['4','5']}]};
    MultiSelectTemplates.normalizePrompts(q);
    return {q:q.q,children:q.subquestions.map(part=>app.game.getSubquestionPrompt(q,part)),exam:app.exam.renderQuestionInput(q,0),print:app.admin.renderExamPrintQuestion(q,0),history:app.game.formatHistoryQuestion(app.game.createHistoryDetail(q,'2, 4',true))};
  });
  expect(result.q).toBe('Chọn số chẵn.'); expect(result.children).toEqual(['Dãy thứ nhất','Dãy thứ hai']);
  expect(result.exam).not.toContain('Chọn số chẵn.');
  expect((result.print.match(/Chọn số chẵn\./g)||[]).length).toBe(1);
  expect(result.print).toContain('Dãy thứ hai'); expect((result.history.match(/Chọn số chẵn\./g)||[]).length).toBe(1);
});

test('administrator opens built-in selection, configures incorrect adjectives and previews ten tiles',async({page})=>{
  await open(page);
  const result=await page.evaluate(()=>{
    const errors=[];window.alert=message=>errors.push(message);
    app.data.currentUser={username:'local-admin',role:'admin'};
    app.admin.openSelectionTemplate('built-in-selection-g4-vietnamese-hk1-b21');
    document.getElementById('template-selection-target').value='incorrect';
    document.getElementById('template-selection-word-group').value='adjective';
    const record=app.admin.getTemplatePreviewRecord();
    return {errors,fields:{subject:document.getElementById('template-subject').value,lesson:document.getElementById('template-lesson').value},template:record?.template,q:record?.question,preview:record ? app.admin.renderGeneratedTemplatePreview(record.question) : ''};
  });
  expect(result.errors).toEqual([]);
  expect(result.template.question_type).toBe('Chọn nhiều Đúng/Sai');
  expect(result.q.q).toContain('tính từ');expect(result.q.q).toContain('KHÔNG');
  expect((result.preview.match(/type="checkbox"/g)||[]).length).toBe(10);
});

test('saved active Vietnamese selection configuration is used and tampered prompt cannot score',async({page})=>{
  await open(page);
  const result=await page.evaluate(async()=>{
    const template=MultiSelectTemplates.getDefaultTemplates().find(item=>item.lesson==='g4-vietnamese-hk1-b21');
    const saved={...template,id:'local-saved',config:{lesson:template.lesson,selectionTarget:'incorrect',wordGroup:'adjective'}};
    app.data.questionTemplates=[saved];
    app.data.currentUser={username:'selection-teacher',role:'student',classlevel:'4'};
    app.data.markQuestionsSeen=()=>{};app.daily.getEnergy=()=>5;app.daily.spendEnergy=async()=>true;
    app.game.openConfig('vietnamese');app.game.getSelectedLearningLessonId=()=>template.lesson;app.game.isTopicLocked=()=>false;app.game.isStudentProgressionLocked=()=>false;
    app.game.state.selectedTopics=[template.topic];app.game.state.selectedLessons=[template.lesson];
    await app.game.startPlay();
    const q=app.game.state.questions.find(item=>item.selectionItems);
    if(!q) return {missing:true};
    const mutated={...q,q:q.q.replace('tính từ','động từ')};
    return {target:q.selectionTarget,criterion:q.selectionCriterion.target,issue:MultiSelectTemplates.validate(mutated),score:MultiSelectTemplates.score(mutated,mutated.correctIds).points};
  });
  expect(result.target).toBe('incorrect');expect(result.criterion).toBe('Tính từ');expect(result.issue).not.toBe('');expect(result.score).toBe(0);
});

test('saved selections resume on the same question and stay empty when advancing after submission',async({page})=>{
  await open(page);await play(page);
  const result=await page.evaluate(()=>{
    const first=app.game.state.questions[0];
    const second=MultiSelectTemplates.generateQuestion('selection.math',{lesson:'g4-math-hk1-b14'});
    app.game.state.questions=[first,second];
    document.querySelector(`[data-selection-id="${first.correctIds[0]}"]`).click();
    app.game.saveAttemptDraft();
    const key=app.game.getAttemptStorageKey('practice',app.data.currentUser);
    const same=JSON.parse(app.safeStorage.getItem(key));
    app.game.state.answerSubmitted=true;app.game.saveAttemptDraft();
    const next=JSON.parse(app.safeStorage.getItem(key));
    app.game.state.answerSubmitted=false;
    app.game.resumeSavedAttempt();
    return {same:same.selectedAns,next:next.selectedAns,index:next.currentIdx,pressed:document.querySelectorAll('.selection-tile[aria-pressed="true"]').length};
  });
  expect(result.same).toMatch(/^s\d$/);expect(result.next).toBeNull();expect(result.index).toBe(1);expect(result.pressed).toBe(0);
});

 test("static template preview remains available without a generated question", async ({page}) => {
  await open(page);
  const html=await page.evaluate(()=>app.admin.renderTemplatePreview("number.min_max_of_four"));
  expect(html).toContain("Khung câu hỏi");
  expect(html).toContain("Tìm số bé nhất?");
});
