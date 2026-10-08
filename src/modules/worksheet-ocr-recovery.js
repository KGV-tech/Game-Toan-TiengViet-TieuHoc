// Coordinate-based recovery: groups are sections, not source pages.
;(function(root) {
  const fold=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  function lines(words) {
    const result=[];
    for(const word of [...words].sort((a,b)=>a.y-b.y||a.x-b.x)) {
      let row=result.find(row=>Math.abs(row.y-word.y)<Math.max(8,word.height*.5));
      if(!row){row={y:word.y,words:[]};result.push(row);}row.words.push(word);
    }
    return result.sort((a,b)=>a.y-b.y).flatMap(row=>{
      // Paddle may return several choices on one line. Preserve their boundaries.
      const sorted=row.words.sort((a,b)=>a.x-b.x),pieces=[];let piece=[];
      for(const word of sorted){if(/^[A-Z][.)]\s/.test(word.text)&&piece.length){pieces.push(piece);piece=[];}piece.push(word);}if(piece.length)pieces.push(piece);
      return pieces.map(items=>({text:items.map(w=>w.text).join(' '),y:row.y,confidence:Math.min(...items.map(w=>w.confidence)),height:Math.max(...items.map(w=>w.height))}));
    });
  }
  function tableFromGrid(grid,words) {
    const rows=[];
    for(let r=0;r<grid.ys.length-1;r++){
      const row=[];
      for(let c=0;c<grid.xs.length-1;c++){
        const selected=words.filter(w=>{const x=w.x+w.width/2,y=w.y+w.height/2;return x>grid.xs[c]&&x<grid.xs[c+1]&&y>grid.ys[r]&&y<grid.ys[r+1];});
        row.push(lines(selected).map(l=>l.text).join(' ')||'___');
      }rows.push(row);
    }
    const uncertain=words.filter(w=>w.confidence<80).map(w=>w.text);
    return {kind:'table',text:'',columns:rows.shift()||[],rows,lines:0,parts:[],options:[],answer:'',review:uncertain.length?'Cần kiểm tra ô bảng: '+uncertain.join(' · '):''};
  }
  function recover(words,grid,name,pageNumber=1,writingLines=[]) {
    const pages=[],warnings=[];let page=null,current=null,part=null,title='';
    const group=label=>{page={title:label,startNewPage:pages.length===0,blocks:[]};pages.push(page);current=null;part=null;};
    const newBlock=text=>{if(!page)group('');current={kind:'question',text,answer:'',lines:0,parts:[],options:[],columns:[],rows:[],review:''};page.blocks.push(current);part=null;};
    const outside=grid?words.filter(w=>w.y+w.height/2<grid.ys[0]||w.y+w.height/2>grid.ys.at(-1)):words;
    const events=lines(outside).map(l=>({...l,type:'line'}));
    for(const y of writingLines)if(!events.some(e=>Math.abs(e.y-y)<10&&/^[.…_\s]{4,}$/.test(e.text)))events.push({type:'line',text:'....................',y,confidence:100});
    if(grid)events.push({type:'table',y:grid.ys[0],block:tableFromGrid(grid,words.filter(w=>w.y+w.height/2>grid.ys[0]&&w.y+w.height/2<grid.ys.at(-1)))});
    for(const event of events.sort((a,b)=>a.y-b.y)) {
      if(event.type==='table'){if(!page)group('');if(current&&/^HOAN THANH B[A]?NG/.test(fold(current.text))){event.block.text=current.text;page.blocks.pop();}page.blocks.push(event.block);current=null;part=null;continue;}
      const text=event.text.trim(),heading=fold(text);if(!text)continue;
      if(/^(BAIHOC(?:STEM)?|PHI[EU]*H[O]?CT[A]?P)$/.test(heading.replace(/ /g,''))&&!pages.some(p=>p.title))continue;
      if(/^(?:Họ\s+(?:và\s+)?tên|Tên|Lớp)(?:\s*[:.…_]|\s*$)/i.test(text))continue;
      if(/^(BO CHU|CHU DE)\b/.test(heading)&&!pages.length){title=text;continue;}
      if(/^(?:PHI[EU]*H[O]?CT[A]?P(?:S[O]?)?\d+|LUYENTAP(?:S[O]?)?\d*)$/.test(heading.replace(/ /g,''))){if(pages.length===1&&!pages[0].title&&pages[0].blocks.length===1&&!/^(?:\d+[.)]|Nêu|Tính|Viết|Điền|Hoàn thành)/i.test(pages[0].blocks[0].text)){title=pages[0].blocks[0].text;pages.pop();}group(text);continue;}
      if(/^[.…_\s]{4,}$/.test(text)){if(part)part.lines++;else if(current)current.lines++;continue;}
      const option=text.match(/^([A-Z][.)])\s*(.+)/),child=text.match(/^([a-z][.)])\s*(.+)/);
      if(option&&current){const target=part||current;target.options.push(text);target.kind='multipleChoice';}
      else if(child&&current){part={kind:'question',label:child[1],text:child[2],answer:'',options:[],lines:0};current.parts.push(part);}
      else if(/^(?:Bài\s*\d+|Câu\s*\d+|\d+[.)])\s*/i.test(text)||!current||(!part&&/^(NEU|TINH|DAT TINH|VIET|DIEN|SO SANH|HOAN THANH|SAP XEP|NOI)\b/.test(heading))){newBlock(text);}
      else{const target=part||current;target.text+='\n'+text;}
      if(event.confidence<80&&current){const note=`Cần kiểm tra: ${text} (${Math.round(event.confidence)}%).`;current.review=[current.review,note].filter(Boolean).join('\n');}
    }
    const nonempty=pages.filter(p=>p.blocks.length);
    if(!nonempty.length)throw new Error('Không đọc được nội dung. Hãy chụp rõ hơn hoặc khoanh vùng chữ.');
    nonempty.forEach((p,i)=>p.startNewPage=i===0);
    warnings.push(`Trang nguồn ${pageNumber}: kiểm tra chữ/số, ô từng có nét bút và cấu trúc nhóm; không tự suy ra đáp án.`);
    return {title:title||nonempty.find(p=>p.title)?.title||name.replace(/\.[^.]+$/,''),pages:nonempty,warnings};
  }
  root.WorksheetOCRRecovery={recover,lines,tableFromGrid};
})(globalThis);
