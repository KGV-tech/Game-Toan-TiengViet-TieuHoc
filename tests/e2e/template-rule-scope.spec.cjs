const {test,expect}=require('@playwright/test');
async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.route('**/*.supabase.co/**',r=>r.abort());await page.goto('/');
 await page.evaluate(()=>{app.data.currentUser={role:'admin',username:'teacher'};app.admin.openComposer();});
}
async function form(page,template){await page.evaluate(t=>{app.data.questionTemplates=[t];app.admin.renderTemplateForm(0);},template);}
test('Tiếng Việt chọn nhiều chỉ hiện nhóm từ đã học, không có quy tắc số',async({page})=>{
 await open(page);
 const t=await page.evaluate(()=>MultiSelectTemplates.getDefaultTemplates().find(t=>t.generator_key==='selection.vietnamese'&&t.lesson==='g4-vietnamese-hk1-b01'));
 await form(page,t);
 await expect(page.locator('.template-editor__rule--range-controls')).toBeHidden();
 await expect(page.locator('#template-selection-word-group option[value="adjective"]')).toHaveAttribute('disabled','');
 await page.locator('#template-selection-word-group').selectOption('person');
 const saved=await page.evaluate(()=>app.admin.collectTemplateForm());
 expect(Object.keys(saved.config).sort()).toEqual(['lesson','selectionTarget','wordGroup']);
 await expect(page.locator('#template-generator option[value="number.digit_at_place"]')).toHaveAttribute('disabled','');
});
test('mọi kỹ năng Tiếng Việt giữ quy tắc ngữ liệu và hai câu con khi lưu',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>Grade4VietnameseTemplates.definitions.map(def=>{
  const t=Grade4VietnameseTemplates.getDefaultTemplates().find(t=>t.generator_key===def.id);
  app.data.questionTemplates=[t];app.admin.renderTemplateForm(0);
  document.getElementById('template-minimum-digits').value='12';document.getElementById('template-maximum-digits').value='1';
  try {const saved=app.admin.collectTemplateForm();return {id:def.id,key:saved.generator_key,keys:Object.keys(saved.config).sort(),count:Grade4VietnameseTemplates.generateQuestion(saved.generator_key,saved.config).subquestions.length,rangeVisible:!document.querySelector('.template-editor__rule--range-controls').hidden};}
  catch(error){return {id:def.id,error:error.message};}
 }));
 expect(result).toHaveLength(10);
 for(const item of result){expect(item.error).toBeUndefined();expect(item.key).toBe(item.id);expect(item.keys).toEqual(['lesson','subquestionCount']);expect(item.count).toBe(2);expect(item.rangeVisible).toBe(false);}
});
test('Toán chỉ hiện và lưu tham số của dạng hiện tại',async({page})=>{
 await open(page);
 const results=await page.evaluate(()=>{
 const keys=['number.digit_at_place','number.smallest_of_four','number.natural_sequence','number.even_odd_classify','number.even_odd_count','number.even_odd_sequence','number.even_odd_form','number.variable_expression_value','measurement.compare_units','selection.math','number.complete_place_table'];
 return keys.map(key=>{
  const base=app.admin.getNewTemplateDraft();base.generator_key=key;
  if(key==='selection.math')Object.assign(base,MultiSelectTemplates.getDefaultTemplates().find(t=>t.generator_key===key));
  if(key==='number.complete_place_table')Object.assign(base,CompleteTableTemplates.getDefaultTemplates()[0]);
  app.data.questionTemplates=[base];app.admin.renderTemplateForm(0);
  try {const t=app.admin.collectTemplateForm();return {key,config:t.config,range:!document.querySelector('.template-editor__rule--range-controls').hidden};}catch(error){return {key,error:error.message};}
 });});
 for(const r of results){expect(r.error,r.key).toBeUndefined();expect(r.config.condition1Digits,r.key).toBeUndefined();
  if(!['number.digit_at_place','number.smallest_of_four'].includes(r.key))expect(r.range,r.key).toBe(false);
  if(r.key!=='number.digit_at_place')expect(r.config.allowedDigits,r.key).toBeUndefined();
  if(r.key==='selection.math')expect(r.config.wordGroup).toBeUndefined();
 }
});

test('rà soát mọi generator Toán trong form và toàn bộ template chọn nhiều theo bài',async({page})=>{
 test.setTimeout(120000);await open(page);
 const audit=await page.evaluate(()=>{
  app.admin.renderTemplateForm(null);
  const keys=[...document.getElementById('template-generator').options].filter(o=>!o.disabled&&!o.value.startsWith('selection.')&&o.value!=='number.complete_place_table').map(o=>o.value);
  const math=keys.map(key=>{
   const t=app.admin.getNewTemplateDraft();t.generator_key=key;t.config={};
   app.data.questionTemplates=[t];app.admin.renderTemplateForm(0);
   try {const saved=app.admin.collectTemplateForm();Grade4MathTemplates.generateQuestion(key,saved.config);return {key,wrongDigits:!app.admin.templateUsesDigitRange(key)&&Object.hasOwn(saved.config,'minimumDigits')&&!key.includes('arithmetic')&&!key.includes('four_operations')};}
   catch(error){return {key,error:error.message};}
  });
  const selection=MultiSelectTemplates.getDefaultTemplates().map(t=>{
   app.data.questionTemplates=[t];app.admin.renderTemplateForm(0);
   try{const saved=app.admin.collectTemplateForm();return {key:t.id,changed:saved.lesson!==t.lesson||saved.generator_key!==t.generator_key||saved.config.selectionTarget!==t.config.selectionTarget,range:!document.querySelector('.template-editor__rule--range-controls').hidden};}
   catch(error){return {key:t.id,error:error.message};}
  });
  return {math,selection};
 });
 require('node:fs').writeFileSync('.tmp/template-rule-audit.json',JSON.stringify(audit,null,2));
 expect(audit.math.length).toBeGreaterThan(60);
 expect(audit.math.filter(r=>r.error||r.wrongDigits)).toEqual([]);
 expect(audit.selection).toHaveLength(270);
 expect(audit.selection.filter(r=>r.error||r.changed||r.range)).toEqual([]);
});

for(const width of [1280,1024])test(`quy tắc Tiếng Việt trực quan và đổi môn an toàn ở ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await open(page);
 const t=await page.evaluate(()=>MultiSelectTemplates.getDefaultTemplates().find(t=>t.generator_key==='selection.vietnamese'&&t.lesson==='g4-vietnamese-hk1-b21'));
 await form(page,t);
 await expect(page.locator('#template-selection-word-group option[value="adjective"]')).not.toHaveAttribute('disabled','');
 await expect(page.locator('.template-content-builder')).toBeHidden();
 await expect(page.locator('.template-editor__answer-mode')).toBeHidden();
 await page.locator('.template-editor__rule--selection').scrollIntoViewIfNeeded();
 await page.screenshot({path:`.tmp/template-language-rules-${width}.png`});
 await page.locator('#template-subject').selectOption('Toán');
 await expect(page.locator('#template-generator')).toHaveValue('number.digit_at_place');
 await expect(page.locator('.template-editor__rule--range-controls')).toBeVisible();
 await expect(page.locator('.template-content-builder')).toBeVisible();
 await page.locator('#template-generator').selectOption('number.even_odd_classify');
 await expect(page.locator('#template-phase2-variable-minimum').locator('..')).toBeHidden();
 await expect(page.locator('#template-phase2-list-length-min').locator('..')).toBeHidden();
 await expect(page.locator('#template-phase2-digit-count').locator('..')).toBeHidden();
 await page.locator('#template-generator').selectOption('number.even_odd_count');
 await expect(page.locator('#template-phase2-list-length-min')).toBeVisible();
 await page.locator('#template-generator').selectOption('number.variable_expression_value');
 await expect(page.locator('#template-phase2-variable-minimum')).toBeVisible();
 await expect(page.locator('#template-phase2-minimum').locator('..')).toBeHidden();
});
test('giữ phạm vi chữ số tùy chỉnh khi mở và xem preview lại',async({page})=>{
 await open(page);
 const t=await page.evaluate(()=>({...app.admin.getNewTemplateDraft(),generator_key:'number.million_class',config:{minimumDigits:8,maximumDigits:8}}));
 await form(page,t);
 await expect(page.locator('#template-minimum-digits')).toHaveValue('8');
 await expect(page.locator('#template-maximum-digits')).toHaveValue('8');
 await page.evaluate(()=>app.admin.showTemplateExample());
 await expect(page.locator('#template-minimum-digits')).toHaveValue('8');
});

test('Lập số từ thẻ không có phạm vi số; B20 và B21 chỉ có pool riêng',async({page})=>{
 await open(page);
 const t=await page.evaluate(()=>({...app.admin.getNewTemplateDraft(),generator_key:'number.even_odd_form',config:{}}));
 await form(page,t);
 await expect(page.locator('#template-phase2-minimum').locator('..')).toBeHidden();
 await page.evaluate(()=>{document.getElementById('template-phase2-minimum').value='100';document.getElementById('template-phase2-maximum').value='1';});
 const config=await page.evaluate(()=>app.admin.collectTemplateForm().config);
 expect(config.minimum).toBeUndefined();expect(config.maximum).toBeUndefined();expect(config.digitCount).toBe(4);
 await page.locator('#template-generator').selectOption('measurement.practice_cards');
 await expect(page.locator('#template-phase5-practice-kinds').locator('..')).toBeVisible();
 await expect(page.locator('#template-phase5-review-skills').locator('..')).toBeHidden();
 await page.locator('#template-generator').selectOption('measurement.hk1_review_b17_b20');
 await expect(page.locator('#template-phase5-practice-kinds').locator('..')).toBeHidden();
 await expect(page.locator('#template-phase5-review-skills').locator('..')).toBeVisible();
});
