;(function(root){
  const TYPES=['Trắc nghiệm','Điền khuyết','Đúng/Sai','So sánh','Chuỗi Quy luật','Kéo thả','Đối chiếu trùng khớp'];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain=v=>String(v??'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'');
  const integer=(n,max)=>Number.isInteger(Number(n))&&Number(n)>=1&&Number(n)<=max;
  function normalize(raw){
    if(!integer(raw?.count,50)) throw Error('Số câu chính phải là số nguyên từ 1 đến 50.');
    const count=Number(raw.count);
    return {count,custom:raw.custom===true,rows:Array.from({length:count},(_,i)=>{
      const row=raw.rows?.[i]||{hasSub:true,parts:4};
      if(row.hasSub&&!integer(row.parts,20)) throw Error(`Câu ${i+1}: số câu con phải từ 1 đến 20.`);
      return {hasSub:row.hasSub===true,parts:row.hasSub?Number(row.parts):1};
    })};
  }
  function amount(main,parts=1){
    const denominator=Number(main)*Number(parts);
    if(!integer(main,50)||!integer(parts,20)) throw Error('Cơ cấu điểm không hợp lệ.');
    let remainder=10%denominator, digits='';
    for(let n=0;remainder&&n<12;n++){remainder*=10;digits+=Math.floor(remainder/denominator);remainder%=denominator;}
    return {value:10/denominator,label:`${Math.floor(10/denominator)}${digits?','+digits:''}${remainder?'…':''} đ`,warning:1000%denominator!==0};
  }
  const badge=(main,parts=1)=>{const a=amount(main,parts);return `<strong class="authoring-score ${a.warning?'authoring-score--warning':'authoring-score--good'}" title="${a.warning?'Điểm có hơn 2 chữ số thập phân; điều chỉnh số câu hoặc câu con':'Điểm biểu diễn chính xác với tối đa 2 chữ số thập phân'}">${a.label}</strong>`;};
  function assemble(plan,source){
    plan=normalize(plan);
    const required=plan.rows.reduce((sum,row)=>sum+row.parts,0);
    if(source.length<required) throw Error(`Cần ${required} câu/ý khác nhau theo cơ cấu đã chọn; mới có ${source.length} nguồn phù hợp. Hãy đổi phạm vi hoặc giảm số câu/câu con.`);
    let offset=0;
    return plan.rows.map((row,index)=>{
      const parts=clone(source.slice(offset,offset+row.parts));offset+=row.parts;
      const first=parts[0];
      const question=row.hasSub?{classlevel:first.classlevel,subject:first.subject,semester:first.semester,topic:first.topic,lesson:first.lesson,type:'Câu tổng hợp',q:'Thực hiện các câu sau:',options:[],ans:parts.map(p=>p.ans).join(' | '),authoringParts:parts}:first;
      question.authoringPlan={version:1,mainCount:plan.count,index,hasSub:row.hasSub,partCount:row.parts};
      return question;
    });
  }
  function isPlanned(record){return record?.questions?.some(q=>q?.authoringPlan?.version===1)===true;}
  function target(record,fallback=10){const n=record?.questions?.[0]?.authoringPlan?.mainCount;return integer(n,50)?Number(n):fallback;}
  function validateLeaf(q){
    if(!TYPES.includes(q?.type)||!String(q.q||'').trim()||!String(q.ans||'').trim()) return 'Câu cần đủ nội dung, loại câu và đáp án.';
    const choices=(q.options||[]).map(String).filter(v=>v.trim());
    if(q.type==='Trắc nghiệm'&&(choices.length<2||!choices.includes(String(q.ans)))) return 'Câu trắc nghiệm cần các lựa chọn và đáp án khớp một lựa chọn.';
    if(q.type==='Đúng/Sai'&&!['Đúng','Sai'].includes(q.ans)) return 'Chọn đáp án Đúng hoặc Sai.';
    if(q.type==='So sánh'&&!['<','>','='].includes(q.ans)) return 'Chọn dấu so sánh hợp lệ.';
    if(q.type==='Kéo thả'&&!choices.length) return 'Câu kéo thả cần các lựa chọn.';
    if(q.type==='Đối chiếu trùng khớp'&&(choices.length!==2||choices.some(v=>!v.split(',').some(item=>item.trim())))) return 'Câu đối chiếu cần đầy đủ hai cột.';
    const base=clone(q);delete base.authoringPlan;
    return root.app?.data.validateQuestionScoring(base)||'';
  }
  function validateQuestion(q){
    const p=q?.authoringPlan;
    if(!p||p.version!==1||!integer(p.mainCount,50)||!integer(p.partCount,20)||typeof p.hasSub!=='boolean'||!Number.isInteger(p.index)||p.index<0||p.index>=p.mainCount) return 'Cơ cấu điểm của câu không hợp lệ.';
    if(p.hasSub){
      if(!Array.isArray(q.authoringParts)||q.authoringParts.length!==p.partCount) return 'Số câu con chưa đúng cơ cấu đã chọn.';
      for(const child of q.authoringParts){
        if(child.authoringPlan||child.authoringParts||!TYPES.includes(child.type)||!String(child.q||'').trim()||!String(child.ans||'').trim()) return 'Mỗi câu con cần đủ nội dung, loại câu và đáp án.';
        const error=validateLeaf(child);if(error)return error;
      }
    }else {
      if(p.partCount!==1||q.authoringParts) return 'Câu không có câu con phải có đúng một phần trả lời.';
      const error=validateLeaf(q);if(error)return error;
    }
    return '';
  }
  function validateRecord(record){
    if(!isPlanned(record))return '';
    const count=target(record);
    if(record.questions.length!==count)return `Cần đúng ${count} câu theo cơ cấu đã chọn.`;
    for(let i=0;i<count;i++){
      const q=record.questions[i];
      if(q.authoringPlan?.index!==i||q.authoringPlan?.mainCount!==count)return 'Cơ cấu điểm không đồng nhất giữa các câu.';
      const error=validateQuestion(q);if(error)return `Câu ${i+1}: ${error}`;
    }
    return '';
  }
  function flatten(question){
    if(!question||question.authoringPlan||question.worksheetBlock||question.imageUrl||/<(?:svg|img)\b/i.test(String(question.q||'')))return [];
    const app=root.app;
    const q=app.admin.normalizeExamQuestionStructure(clone(question));
    const answers=app.game.getAnsArr(String(q.ans||''));
    const common={classlevel:q.classlevel,subject:q.subject,semester:q.semester,topic:q.topic,lesson:q.lesson,explanation:q.explanation||''};
    let parts;
    if(q.subquestions&&app.admin.getExamQuestionStructureKind(q)==='subquestions') parts=q.subquestions.map(p=>({...common,type:'Trắc nghiệm',q:[q.passage||q.sharedPrompt||q.q,app.game.getSubquestionPrompt(q,p)].filter(Boolean).join('\n'),options:p.options||[],ans:p.answer??p.ans??''}));
    else if(q.statements)parts=q.statements.map(p=>({...common,type:'Đúng/Sai',q:[q.sharedPrompt||q.q,p.text].filter(Boolean).join('\n'),options:['Đúng','Sai'],ans:p.answer}));
    else if(q.comparisonRows)parts=q.comparisonRows.map((p,i)=>({...common,type:'So sánh',q:`${p.leftText} ___ ${p.rightText}`,options:[],ans:p.answer||answers[i]}));
    else if(q.sequenceRounds)parts=q.sequenceRounds.map(p=>({...common,type:'Chuỗi Quy luật',q:p.display||p.sequence?.map((v,i)=>p.blankIndexes?.includes(i)?'___':v).join(', '),options:[],ans:p.answers?.join(', ')}));
    else if(q.practiceRows||q.subquestions)parts=(q.practiceRows||q.subquestions).map(p=>({...common,type:q.type,q:p.expression??p.display??p.text,options:q.options||[],ans:p.answers?.join(', ')||p.answer}));
    else if(q.angleItems||q.angleCountRows||app.admin.getExamQuestionStructureKind(q)) return [];
    else parts=[q];
    return parts.map(p=>({...p,q:plain(p.q)})).filter(p=>TYPES.includes(p.type)&&p.q?.trim()&&String(p.ans||'').trim()&&!validateLeaf(p));
  }
  const plans={},invalid={};
  function mount(record,isW){
    const id=isW?'w':'e';invalid[id]='';
    plans[id]=isPlanned(record)?normalize({custom:true,count:target(record),rows:record.questions.map(q=>({hasSub:q.authoringPlan.hasSub,parts:q.authoringPlan.partCount}))}):normalize({count:10,custom:false});
    draw(id);
  }
  function draw(id,focusId){
    const box=document.getElementById(`add-${id}-plan`);if(!box)return;
    const plan=plans[id];
    box.innerHTML=`<h4>Cơ cấu câu hỏi & điểm · Thang 10</h4><label><input type="checkbox" id="add-${id}-plan-custom" ${plan.custom?'checked':''}> Tùy chỉnh số câu và câu con</label><p>${plan.custom?'':'Mặc định: 10 câu, giữ các ý có sẵn trong nguồn. Bật tùy chỉnh để khai báo cơ cấu riêng.'}</p><div ${plan.custom?'':'hidden'}><label>Số câu chính<input class="form-input" type="number" id="add-${id}-plan-count" min="1" max="50" value="${plan.count}"></label><p>Điểm chia đều cho câu chính, rồi chia đều cho câu con. Màu đỏ: hơn 2 chữ số thập phân. Cơ cấu áp dụng khi bấm Tạo tự động.</p><div class="authoring-plan__rows">${plan.rows.map((row,i)=>`<fieldset><legend>Câu ${i+1} · ${badge(plan.count)}</legend><label><input type="checkbox" id="add-${id}-plan-sub-${i}" ${row.hasSub?'checked':''}> Có câu con</label><label>Số câu con<input class="form-input" type="number" id="add-${id}-plan-parts-${i}" min="1" max="20" value="${row.parts}" ${row.hasSub?'':'disabled'}></label><span>${row.hasSub?'Mỗi câu con:':'Câu chính:'} ${badge(plan.count,row.parts)}</span></fieldset>`).join('')}</div><p id="add-${id}-plan-error" role="status"></p></div>`;
    box.querySelectorAll('input').forEach(input=>input.addEventListener(input.type==='checkbox'?'change':'input',()=>{
      const candidate=clone(plan);candidate.custom=true;
      if(input.id===`add-${id}-plan-custom`)candidate.custom=input.checked;
      else if(input.id===`add-${id}-plan-count`)candidate.count=Number(input.value);
      else{const i=Number(input.id.split('-').pop());if(input.type==='checkbox')candidate.rows[i].hasSub=input.checked;else candidate.rows[i].parts=Number(input.value);}
      try{plans[id]=normalize(candidate);invalid[id]='';draw(id,input.id);}catch(error){invalid[id]=error.message;box.querySelector('[role=status]').textContent=error.message;input.setAttribute('aria-invalid','true');}
    }));
    if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
  }
  function generate(isW){
    const app=root.app,id=isW?'w':'e',plan=normalize(plans[id]);
    const value=name=>document.getElementById(`add-${id}-${name}`)?.value;
    const classlevel=value('class'),subject=value('sub'),period=value('period');
    const topics=[...document.querySelectorAll(`#add-${id}-topics input:checked`)].map(e=>e.value);
    if(!topics.length)return app.admin.showExamComposerError('Chọn ít nhất một Chủ đề để tạo tự động.');
    const selection=app.admin.getExamLessonSelectionState();
    if(!selection.unrestricted&&!selection.selectedLessons.length)return app.admin.showExamComposerError('Chọn ít nhất một Bài học hoặc áp dụng toàn bộ Bài học.');
    const eligible=item=>item&&item.classlevel===classlevel&&item.subject===subject&&topics.includes(item.topic)&&(!selection.selectedLessons.length||selection.selectedLessons.includes(item.generator_key?app.admin.getTemplateLesson(item):item.lesson));
    const pool=[],seen=new Set(),required=plan.rows.reduce((s,r)=>s+r.parts,0);
    const add=q=>flatten(q).forEach(p=>{const key=app.data.getQuestionContentKey(p);if(!seen.has(key)){seen.add(key);pool.push(p);}});
    (app.data.libraryQuestions||[]).filter(eligible).forEach(add);
    const templates=(app.data.questionTemplates||[]).filter(t=>eligible(t)&&t.is_active!==false);
    for(let n=0;pool.length<required&&templates.length&&n<Math.max(200,required*30);n++)add(app.data.generateTemplateQuestion(templates[n%templates.length]));
    try{
      const queues=topics.map(topic=>pool.filter(q=>q.topic===topic));
      const ordered=[];
      for(let row=0;queues.some(queue=>row<queue.length);row++) queues.forEach(queue=>{if(queue[row])ordered.push(queue[row]);});
      const questions=assemble(plan,ordered);
      app.admin[isW?'worksheetComposerDraft':'examComposerDraft']={classlevel,subject,period,name:value('name'),topics,lessonFilters:selection.selectedLessons,questions};
      app.admin[isW?'renderWSubTab':'renderESubTab']('add');
    }catch(error){app.admin.showExamComposerError(error.message);}
  }
  function editor(q,index,isW){
    const id=isW?'w':'e',count=q.authoringPlan.mainCount;
    return `<fieldset class="authoring-parts" data-structured-kind="authoringParts"><legend>Câu con · ${badge(count,q.authoringParts.length)} / câu con</legend>${q.authoringParts.map((p,n)=>`<article class="authoring-part"><h6>Câu ${index+1}.${n+1} · ${badge(count,q.authoringParts.length)}</h6><label>Loại câu con<select class="form-input" id="ap-${id}-${index}-${n}-type" onchange="AuthoringPlan.changePartType(${index},${n},${isW})">${TYPES.map(t=>`<option ${p.type===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>Nội dung câu con<textarea class="form-input" id="ap-${id}-${index}-${n}-q">${esc(p.q)}</textarea></label>${['Trắc nghiệm','Kéo thả','Đối chiếu trùng khớp'].includes(p.type)?`<label>${p.type==='Đối chiếu trùng khớp'?'Hai cột: mỗi dòng một cột, các mục cách nhau bằng dấu phẩy':'Các lựa chọn: mỗi dòng một lựa chọn'}<textarea class="form-input" id="ap-${id}-${index}-${n}-options">${esc((p.options||[]).filter(Boolean).join('\n'))}</textarea></label>`:''}<label>Đáp án câu con${['Đúng/Sai','So sánh'].includes(p.type)?`<select class="form-input" id="ap-${id}-${index}-${n}-ans"><option value="">-- Chọn --</option>${(p.type==='Đúng/Sai'?['Đúng','Sai']:['<','>','=']).map(a=>`<option value="${esc(a)}" ${a===p.ans?'selected':''}>${esc(a)}</option>`).join('')}</select>`:`<input class="form-input" id="ap-${id}-${index}-${n}-ans" value="${esc(p.ans)}" placeholder="${p.type==='Đối chiếu trùng khớp'?'Trái:Phải, Trái:Phải':'Nhiều ô trống: cách nhau bằng dấu phẩy'}">`}</label></article>`).join('')}</fieldset>`;
  }
  function read(q,index,isW){
    const id=isW?'w':'e',value=(n,key)=>document.getElementById(`ap-${id}-${index}-${n}-${key}`)?.value.trim()||'';
    const parts=q.authoringParts.map((p,n)=>({...p,q:value(n,'q'),type:value(n,'type'),ans:value(n,'ans'),options:document.getElementById(`ap-${id}-${index}-${n}-options`)?value(n,'options').split('\n').map(s=>s.trim()).filter(Boolean):[]}));
    return {authoringParts:parts,ans:parts.map(p=>p.ans).join(' | ')};
  }
  function changePartType(index,part,isW){
    const id=isW?'w':'e',card=document.querySelector(`.exam-question-card[data-question-index="${index}"]`),q=JSON.parse(card.dataset.authoringQuestion);
    const previous=q.authoringParts[part].type;Object.assign(q,read(q,index,isW));
    if(q.authoringParts[part].type!==previous){q.authoringParts[part].ans='';q.authoringParts[part].options=[];}
    q.q=document.getElementById(`add-${id}-q-q-${index}`).value;q.explanation=document.getElementById(`add-${id}-q-exp-${index}`).value;
    q.topic=document.getElementById(`add-${id}-q-topic-${index}`).value;q.lesson=document.getElementById(`add-${id}-q-lesson-${index}`).value;
    card.outerHTML=root.app.admin.getExamComposerQuestionHTML(q,q,index);root.app.admin.updateExamTopics();root.app.admin.bindExamComposerInteractions();root.app.admin.updateExamComposerProgress();
    document.getElementById(`ap-${id}-${index}-${part}-type`)?.focus({preventScroll:true});
  }
  function restore(q,index,answer){
    (q.authoringParts||[]).forEach((p,n)=>{
      const value=String(answer?.[n]||''),scope=document.querySelector(`[data-authoring-part="${index}:${n}"]`);if(!scope)return;
      const chosen=value.split(',').map(v=>v.trim());
      scope.querySelectorAll('input[type=radio]').forEach(el=>el.checked=el.value===value);
      if(p.type==='Đối chiếu trùng khớp')scope.querySelectorAll('select[data-exam-match]').forEach(el=>{el.value=chosen.find(v=>v.startsWith(el.dataset.left+':'))?.slice(el.dataset.left.length+1)||'';});
      else scope.querySelectorAll('[data-exam-part]').forEach((el,i)=>el.value=chosen[i]||'');
    });
  }
  root.AuthoringPlan={normalize,amount,badge,assemble,isPlanned,target,validateQuestion,validateRecord,flatten,plans,invalid,mount,generate,editor,read,changePartType,restore,plain};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.AuthoringPlan;
})(typeof globalThis!=='undefined'?globalThis:this);
