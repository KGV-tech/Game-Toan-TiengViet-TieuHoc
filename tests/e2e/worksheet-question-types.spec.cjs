const { test, expect } = require('@playwright/test');
async function open(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({contentType:'application/javascript',body:''}));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser={username:'teacher',role:'admin'};
    app.data.worksheets=[]; app.data.exams=[{name:'Đề giữ nguyên',questions:[]}];
    app.admin.openComposer('worksheets'); app.admin.renderWSubTab('add');
  });
}
test('Phiếu: chuyển đủ 7 loại không mang đáp án hay lựa chọn của loại cũ', async ({page}) => {
  await open(page);
  const type=page.locator('#add-w-q-type-0');
  await page.locator('#add-w-q-has-sub-0').uncheck();
  await type.selectOption('Đúng/Sai');
  await page.locator('#add-w-q-ans-0').selectOption('Sai');
  for(const name of ['So sánh','Chuỗi Quy luật','Kéo thả','Đối chiếu trùng khớp','Điền khuyết','Trắc nghiệm']) {
    await type.selectOption(name);
    await expect(page.locator('#add-w-q-ans-0')).toHaveValue('');
    for(let n=1;n<=4;n++) await expect(page.locator(`#add-w-q-opt${n}-0`)).toHaveValue('');
    await expect(page.locator('#add-w-q-opts-wrapper-0')).toBeVisible({visible:['Trắc nghiệm','Kéo thả'].includes(name)});
    await expect(page.locator('#add-w-q-match-wrapper-0')).toBeVisible({visible:name==='Đối chiếu trùng khớp'});
  }
  await type.selectOption('Đúng/Sai');
  await expect(page.locator('#add-w-q-ans-0')).toHaveValue('Sai');
  await type.selectOption('So sánh');
  await page.locator('#add-w-q-ans-0').selectOption('>');
  await type.selectOption('Kéo thả');
  await page.locator('#add-w-q-opt1-0').fill('thẻ riêng');
  await type.selectOption('So sánh');
  await expect(page.locator('#add-w-q-ans-0')).toHaveValue('>');
  await type.selectOption('Kéo thả');
  await expect(page.locator('#add-w-q-opt1-0')).toHaveValue('thẻ riêng');
});
test('Phiếu: lưu cấu trúc đang hiển thị thay vì cấu trúc câu con cũ',async({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await open(page);
  await page.locator('#add-w-name').fill('Phiếu chuyển loại');
  for(let i=0;i<10;i++) {
    await page.locator(`#add-w-q-has-sub-${i}`).uncheck();
    await page.locator(`#add-w-q-type-${i}`).selectOption('So sánh');
    await page.locator(`#add-w-q-q-${i}`).fill('5 ___ 3');
    await page.locator(`#add-w-q-ans-${i}`).selectOption('>');
  }
  await page.evaluate(()=>{app.data.saveWorksheets=async()=>null;});
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Tạo phiếu học tập',exact:true}).click();
  const data=await page.evaluate(()=>({w:app.data.worksheets,e:app.data.exams}));
  expect(data.w).toHaveLength(1);
  expect(data.w[0].questions.every(q=>q.type==='So sánh'&&q.ans==='>'&&!q.subquestions)).toBe(true);
  expect(data.e).toEqual([{name:'Đề giữ nguyên',questions:[]}]);
  expect(errors).toEqual([]);
});
test('Phiếu: câu con giữ dữ liệu khi đổi loại rồi quay lại',async({page})=>{
  await open(page);
  await page.locator('#add-w-q-structured-prompt-0-0').fill('Câu con đã biên tập');
  await page.locator('#add-w-q-type-0').selectOption('So sánh');
  await expect(page.locator('#add-w-q-opts-wrapper-0')).toBeHidden();
  await page.locator('#add-w-q-structured-left-0-0').fill('12');
  await page.locator('#add-w-q-type-0').selectOption('Đối chiếu trùng khớp');
  await expect(page.locator('#add-w-q-has-sub-0')).toBeDisabled();
  await page.locator('#add-w-q-type-0').selectOption('Trắc nghiệm');
  await page.locator('#add-w-q-has-sub-0').check();
  await expect(page.locator('#add-w-q-structured-prompt-0-0')).toHaveValue('Câu con đã biên tập');
});

test('Phiếu: các loại có câu con đều mở đúng trường nhập, không tự chọn đáp án',async({page})=>{
  await open(page);
  for(const [type,kind] of [['Điền khuyết','practiceRows'],['Kéo thả','practiceRows'],['Đúng/Sai','statements'],['So sánh','comparisonRows'],['Chuỗi Quy luật','sequenceRounds'],['Trắc nghiệm','subquestions']]) {
    await page.locator('#add-w-q-type-0').selectOption(type);
    await page.locator('#add-w-q-has-sub-0').check();
    await expect(page.locator('.exam-question-card').first().locator(`[data-structured-kind="${kind}"]`)).toBeVisible();
    await expect(page.locator('#add-w-q-structured-answer-0-0')).toHaveValue('');
    await expect(page.locator('#add-w-q-ans-0')).toHaveCount(0);
    await page.locator('#add-w-q-structured-answer-0-0').evaluate(el=>{el.tagName==='SELECT' ? el.value=el.options[1].value : el.value='42'; el.dispatchEvent(new Event('input',{bubbles:true}));});
  }
});

test('Phiếu: bỏ chọn ý a/b vẫn giữ ý c/d và phục hồi nội dung sau đổi loại',async({page})=>{
  await open(page);
  await page.evaluate(()=>{
    app.data.worksheets=[{name:'Phiếu chọn c/d',classlevel:'Lớp 4',subject:'Toán',period:'Học Kỳ 1',questions:[{type:'Trắc nghiệm',q:'Câu chung',ans:'',selectedParts:[2,3],subquestions:Array.from({length:4},(_,n)=>({label:String.fromCharCode(97+n),prompt:`Nội dung ${n}`,options:['1','2','3','4'],answer:''}))}]}];
    app.admin.editWorksheet(0);
  });
  const toggles=page.locator('.exam-question-card').first().locator('.exam-structured-part__checkbox');
  await page.locator('#add-w-q-type-0').selectOption('So sánh');
  await page.locator('#add-w-q-type-0').selectOption('Trắc nghiệm');
  await expect(toggles.nth(0)).not.toBeChecked(); await expect(toggles.nth(2)).toBeChecked();
  await expect(page.locator('#add-w-q-structured-prompt-0-2')).toHaveValue('Nội dung 2');
  await page.locator('#add-w-q-structured-part-count-0').selectOption('4');
  await expect(page.locator('#add-w-q-structured-prompt-0-0')).toHaveValue('Nội dung 0');
});

test('Phiếu: câu điền khuyết cũ lưu ý trong văn bản không mất chỉnh sửa',async({page})=>{
  await open(page);
  await page.evaluate(()=>{
    app.data.worksheets=[{name:'Phiếu cũ',classlevel:'Lớp 4',subject:'Toán',period:'Học Kỳ 1',questions:[{type:'Điền khuyết',q:'Điền số<br>a) 1 + ___<br>b) 2 + ___<br>c) 3 + ___<br>d) 4 + ___',ans:'1, 2, 3, 4',partAnswerCounts:[1,1,1,1]}]}];
    app.admin.editWorksheet(0);
  });
  await page.locator('#add-w-q-structured-display-0-0').fill('Ý đã sửa ___');
  await page.locator('#add-w-q-type-0').selectOption('So sánh');
  await page.locator('#add-w-q-type-0').selectOption('Điền khuyết');
  await expect(page.locator('#add-w-q-structured-display-0-0')).toHaveValue('Ý đã sửa ___');
});


test('Phiếu: chuyển loại bằng bàn phím giữ focus ở điều khiển mới',async({page})=>{
  await open(page);
  const type=page.locator('#add-w-q-type-0');
  await type.focus();
  await page.keyboard.press('ArrowDown');
  await expect(type).toBeFocused();
  const sub=page.locator('#add-w-q-has-sub-0');
  await sub.focus(); await page.keyboard.press('Space');
  await expect(sub).toBeFocused();
});

test('Phiếu: lưu, mở lại và bản in của cả bảy loại câu dùng dữ liệu riêng',async({page})=>{
  await open(page);
  await page.locator('#add-w-name').fill('Phiếu đủ loại');
  const types=['Trắc nghiệm','Điền khuyết','Đúng/Sai','So sánh','Chuỗi Quy luật','Kéo thả','Đối chiếu trùng khớp'];
  const prompts=['Chọn số lớn nhất','2 + ___ = 4','2 là số chẵn','5 ___ 3','2, 4, ___, 8','Con mèo kêu ___','Nối con vật với tiếng kêu'];
  const answers=['4','2','Đúng','>','6','meo','Mèo:meo, Chó:gâu'];
  for(let i=0;i<10;i++) {
    const n=i%7;
    await page.locator(`#add-w-q-has-sub-${i}`).uncheck();
    await page.locator(`#add-w-q-type-${i}`).selectOption(types[n]);
    await page.locator(`#add-w-q-q-${i}`).fill(prompts[n]);
    const answer=page.locator(`#add-w-q-ans-${i}`);
    if(n===2||n===3) await answer.selectOption(answers[n]); else await answer.fill(answers[n]);
    if(n===0||n===5) for(let k=1;k<=4;k++) await page.locator(`#add-w-q-opt${k}-${i}`).fill(n===0?String(k):['meo','gâu','ò ó o','chíp'][k-1]);
    if(n===6) {await page.locator(`#add-w-q-match-left-${i}`).fill('Mèo, Chó');await page.locator(`#add-w-q-match-right-${i}`).fill('meo, gâu');}
  }
  await page.evaluate(()=>{app.data.saveWorksheets=async()=>null;});
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Tạo phiếu học tập',exact:true}).click();
  const saved=await page.evaluate(()=>app.data.worksheets[0]);
  expect(saved.questions.slice(0,7).map(q=>q.type)).toEqual(types);
  expect(saved.questions.slice(0,7).map(q=>q.ans)).toEqual(answers);
  await page.evaluate(()=>app.admin.editWorksheet(0));
  for(let i=0;i<7;i++) await expect(page.locator(`#add-w-q-ans-${i}`)).toHaveValue(answers[i]);
  await page.evaluate(()=>app.admin.viewExam(0,true));
  await expect(page.locator('#print-area .exam-print__question')).toHaveCount(10);
  await expect(page.locator('#print-area')).toContainText('Nối con vật với tiếng kêu');
  await expect(page.locator('#print-area')).not.toContainText('Mèo:meo');
});
