;(function(root,factory){const api=factory(root);if(typeof module!=='undefined'&&module.exports)module.exports=api;root.CompleteTableTemplates=api;})(globalThis,function(root){
    const TYPE='Hoàn thành Bảng', KEY='number.complete_place_table';
    const places=['đơn vị','chục','trăm','nghìn','chục nghìn','trăm nghìn','triệu','chục triệu','trăm triệu'];
    const shared=()=>root.Grade4MathTemplateShared;
    const decode=value=>{try{const data=typeof value==='string'?JSON.parse(value):value;return Array.isArray(data)?data:[];}catch{return [];}};
    const text=value=>String(value??'').normalize('NFC').toLocaleLowerCase('vi-VN').replace(/[.,]/g,'').replace(/\s+/g,' ').trim();
    const words=value=>text(value).replace(/(^| )lẻ(?= |$)/g,'$1linh').replace(/(^| )tư(?= |$)/g,'$1bốn');
    function expected(value,columns){return {write:String(value),read:shared().readNumber(value),places:String(value).padStart(columns,' ').split('').map(digit=>digit.trim())};}
    function generateQuestion(key,config={},random=Math.random){
        if(key!==KEY)throw new Error('Cấu hình bảng không hợp lệ.');
        const columns=Number(config.placeColumns??6);
        if(!Number.isInteger(columns)||columns<4||columns>9)throw new Error('Số cột hàng phải từ 4 đến 9.');
        const givens=shared().shuffle(['write','read','places',['write','read','places'][Math.floor(random()*3)]],random);
        const used=new Set(),rows=givens.map((given,i)=>{
            let value=shared().randomInt(10**(columns-2),10**columns-1,random);
            while(used.has(value))value=value<10**columns-1?value+1:10**(columns-2);
            used.add(value);return {value,given,...expected(value,columns)};
        });
        return {type:TYPE,templateId:KEY,classlevel:'Lớp 4',subject:'Toán',semester:'Học kỳ 1',topic:'3. Số có nhiều chữ số',lesson:'g4-math-hk1-b10',q:'Hoàn thành bảng sau.',placeColumns:columns,tableRows:rows,partAnswerCounts:[1,1,1,1],ans:JSON.stringify(rows.map(({write,read,places})=>({write,read,places})))};
    }
    function validate(q){
        if(q?.type!==TYPE||q.lesson!=='g4-math-hk1-b10'||!Number.isInteger(q.placeColumns)||q.placeColumns<4||q.placeColumns>9||q.tableRows?.length!==4)return 'Bảng cần 4 dòng và từ 4–9 cột hàng.';
        if(new Set(q.tableRows.map(r=>r.value)).size!==4)return 'Các dòng phải có số khác nhau.';
        for(const row of q.tableRows){
            if(!Number.isInteger(row.value)||row.value<0||row.value>=10**q.placeColumns||!['write','read','places'].includes(row.given))return 'Dữ liệu dòng không hợp lệ.';
            const exp=expected(row.value,q.placeColumns);
            if(row.write!==exp.write||row.read!==exp.read||JSON.stringify(row.places)!==JSON.stringify(exp.places))return 'Dữ liệu bảng không khớp số đã sinh.';
        }
        return q.ans===JSON.stringify(q.tableRows.map(({write,read,places})=>({write,read,places})))?'':'Đáp án bảng không hợp lệ.';
    }
    function score(q,answer){
        const rows=decode(answer),valid=!validate(q);
        const partScores=q.tableRows.map((row,i)=>{
            const selected=rows[i]||{};
            return valid&&['write','read','places'].every(group=>group===row.given|| (group==='places'?Array.isArray(selected.places)&&selected.places.length===q.placeColumns&&selected.places.every((v,j)=>(row.places[j]==='' ? !String(v??'').trim() || String(v).trim()==='0' : String(v).trim()===row.places[j])):group==='write'?String(selected.write??'').replace(/\s/g,'')===row.write:words(selected.read)===words(row.read)))?1:0;
        });
        const correctCount=partScores.reduce((a,b)=>a+b,0);
        return {points:correctCount/4,answerCount:4,correctCount,isCorrect:correctCount===4,partScores};
    }
    function markup(q,prefix='practice',print=false){
        const esc=value=>root.app.data.sanitizeHTML(String(value));
        const titles=['Viết số','Đọc số',...places.slice(0,q.placeColumns).reverse().map(p=>`Hàng ${p}`)];
        const cell=(row,i,group,j)=>{
            const value=group==='places'?row.places[j]:row[group];
            if(group==='places'&&value==='')return '<span class="complete-table__unused" aria-label="Hàng chưa có chữ số"></span>';
            if(row.given===group)return `<span class="complete-table__given">${esc(group==='write'?shared().formatNumber(row.value):value)}</span>`;
            if(print)return '<span class="complete-table__blank"></span>';
            const label=`Dòng ${i+1} · ${group==='places'?titles[j+2]:group==='write'?'Viết số':'Đọc số'}`;
            const attrs=`data-table-prefix="${esc(prefix)}" data-table-row="${i}" data-table-group="${group}" ${group==='places'?`data-table-place="${j}"`:''} aria-label="${esc(label)}" autocomplete="off"`;
            return group==='read'?`<textarea ${attrs} rows="3" spellcheck="false"></textarea>`:`<input ${attrs} type="text" inputmode="numeric" maxlength="${group==='places'?1:14}">`;
        };
        return `<div class="complete-table-wrap"><table class="complete-table"><caption class="sr-only">Hoàn thành bảng: viết số, đọc số và các hàng</caption><colgroup><col class="complete-table__number-col"><col class="complete-table__read-col">${Array(q.placeColumns).fill('<col>').join('')}</colgroup><thead><tr>${titles.map(t=>`<th scope="col">${esc(t)}</th>`).join('')}</tr></thead><tbody>${q.tableRows.map((r,i)=>`<tr data-table-result-row="${i}"><td>${cell(r,i,'write')}</td><td>${cell(r,i,'read')}</td>${r.places.map((_,j)=>`<td>${cell(r,i,'places',j)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    function read(container,prefix){
        const rows=Array.from({length:4},()=>({write:'',read:'',places:[]}));
        container.querySelectorAll('[data-table-row]').forEach(input=>{if(input.dataset.tablePrefix!==String(prefix))return;const row=rows[Number(input.dataset.tableRow)],group=input.dataset.tableGroup;if(group==='places')row.places[Number(input.dataset.tablePlace)]=input.value;else row[group]=input.value;});
        return JSON.stringify(rows);
    }
    function restore(container,prefix,answer){const rows=decode(answer);container.querySelectorAll('[data-table-row]').forEach(input=>{if(input.dataset.tablePrefix!==String(prefix))return;const row=rows[Number(input.dataset.tableRow)]||{};input.value=input.dataset.tableGroup==='places'?row.places?.[Number(input.dataset.tablePlace)]||'':row[input.dataset.tableGroup]||'';});}
    function completed(q,answer){const answers=decode(answer);return q.tableRows.filter((row,i)=>['write','read','places'].every(group=>group===row.given||(group==='places'?answers[i]?.places?.length===q.placeColumns&&row.places.every((digit,j)=>digit===''||String(answers[i].places[j]??'').trim()):String(answers[i]?.[group]??'').trim()))).length;}
    function render(q,container,state,button){
        container.className='complete-table-board';container.innerHTML=markup(q);
        container.oninput=()=>{if(state.answerSubmitted)return;state.selectedAns=read(container,'practice');button.disabled=!Array.from(container.querySelectorAll('input,textarea')).some(input=>input.value.trim());};
    }
    function reveal(q,container,answer){const result=score(q,answer);container.querySelectorAll('input,textarea').forEach(input=>{input.disabled=true;const row=q.tableRows[Number(input.dataset.tableRow)];input.title=`Đáp án: ${input.dataset.tableGroup==='places'?row.places[Number(input.dataset.tablePlace)]:row[input.dataset.tableGroup]}`;});container.querySelectorAll('[data-table-result-row]').forEach((row,i)=>{row.classList.add(result.partScores[i]?'complete-table__correct':'complete-table__wrong');if(!result.partScores[i]){const note=document.createElement('small');note.className='answer-correction';note.textContent=`Đáp án: ${q.tableRows[i].write} · ${q.tableRows[i].read} · ${q.tableRows[i].places.join(' | ')}`;row.cells[1].append(note);}});}
    function history(q,answer){const rows=decode(answer);return q.tableRows.map((row,i)=>`Dòng ${i+1}: ${['write','read','places'].map(group=>{const value=group===row.given?row[group]:rows[i]?.[group];return Array.isArray(value)?value.join(' | '):value||'Chưa điền';}).join(' · ')}`).join('\n');}
    function getDefaultTemplates(){return [{id:'built-in-complete-place-table',name:'Bài 10 · Hoàn thành Bảng',classlevel:'Lớp 4',subject:'Toán',semester:'Học kỳ 1',topic:'3. Số có nhiều chữ số',lesson:'g4-math-hk1-b10',question_type:TYPE,generator_key:KEY,prompt_template:'{question}',config:{placeColumns:6},is_active:true}];}
    return {TYPE,completed,templateIds:[KEY],generateQuestion,validate,score,markup,read,restore,render,reveal,history,getDefaultTemplates};
});
