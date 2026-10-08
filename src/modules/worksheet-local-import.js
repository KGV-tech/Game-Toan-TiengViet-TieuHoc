;(function(root) {
  const app=root.app, D=root.WorksheetDocument, studio=app.worksheetStudio;
  const base=new URL('./public/worksheet-vendor/',document.baseURI).href;
  const loaders=new Map();
  function loadScript(name) {
    if(!loaders.has(name))loaders.set(name,new Promise((resolve,reject)=> {
      const script=document.createElement('script');script.src=base+name;
      script.onload=resolve;script.onerror=()=>{loaders.delete(name);script.remove();reject(new Error('Chưa tải được bộ đọc file cục bộ. Kiểm tra mạng để tải thư viện rồi thử lại.'));};document.head.append(script);
    }));return loaders.get(name);
  }
  function parseText(raw,title) {
    const pages=[],warnings=[];let page={title:'',blocks:[]},current=null;
    const add=()=>{if(page.blocks.length)pages.push(page);};
    String(raw).replace(/\r/g,'').split('\n').map(line=>line.trim()).filter(Boolean).forEach(line=> {
      if(/^PHIẾU HỌC TẬP|^LUYỆN TẬP|^BỘ CHỮ/i.test(line)){if(page.blocks.length)add();page={title:line,blocks:[]};current=null;return;}
      if(/^(Họ và tên|Tên\s*[:.]|Lớp\s*[:.])/i.test(line))return;
      const answer=line.match(/^(?:Đáp án|Đáp số)\s*:\s*(.*)$/i);
      if(answer&&current){current.answer=answer[1];return;}
      if(/^[.…_\s]{5,}$/.test(line)){if(current)current.lines++;return;}
      const part=line.match(/^([a-z][.)])\s*(.+)/);
      const option=line.match(/^([A-D][.)])\s*(.+)/);
      if(part&&current){current.parts.push({label:part[1],text:part[2],answer:'',lines:2,options:[]});return;}
      if(option&&current){current.options.push(line);return;}
      if(/^(?:Bài\s*\d+|Câu\s*\d+|\d+[.)])\s*/i.test(line)||!current){
        current={kind:'question',text:line,answer:'',lines:2,options:[],parts:[],columns:[],rows:[],review:'Kiểm tra chữ, số và nét bút theo bản gốc. OCR cục bộ không tự suy ra đáp án.'};page.blocks.push(current);
      }else current.text+='\n'+line;
    });add();
    if(!pages.length)throw new Error('Không đọc được chữ. Hãy chụp thẳng, đủ sáng hoặc dùng file gốc.');
    warnings.push('Đã đọc cục bộ. Đối chiếu số, dấu toán, thứ tự câu con và vùng có nét viết tay; không dùng nét bút làm đáp án.');
    return D.normalize({title:pages.find(page=>page.title)?.title||title.replace(/\.[^.]+$/,''),pages,warnings});
  }
  function wordsFromTsv(tsv) {
    return String(tsv||'').split('\n').slice(1).map(row=>row.split('\t')).filter(row=>row[0]==='5'&&row[11]?.trim()).map(row=>({text:row.slice(11).join('\t'),x:Number(row[6]),y:Number(row[7]),width:Number(row[8]),height:Number(row[9]),confidence:Number(row[10])}));
  }
  function wordsToText(words) {
    const lines=[];
    for(const word of [...words].sort((a,b)=>a.y-b.y)){
      let line=lines.find(item=>Math.abs(item.y-word.y)<Math.max(10,word.height*.6));
      if(!line){line={y:word.y,words:[]};lines.push(line);}line.words.push(word);
    }
    return lines.sort((a,b)=>a.y-b.y).map(line=>line.words.sort((a,b)=>a.x-b.x).map(word=>word.confidence<45?'[CẦN KIỂM TRA]':word.text).join(' ')).join('\n');
  }
  function cleanCanvas(original,removeInk=true,masks=[]) {
    const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(original,0,0);
    if(removeInk){const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);const data=pixels.data,mask=new Uint8Array(canvas.width*canvas.height);
      for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
        const ink=(r-g>16&&b-g>16)||(r-g>30&&r-b>30)||(b-r>45&&b-g>25);
        if(max-min>24&&ink)mask[i/4]=1;
      }ctx.putImageData(pixels,0,0);
      // Mở rộng nhẹ vùng mực để không OCR phần viền đen còn sót của nét màu.
      const spread=new Uint8Array(mask.length),w=canvas.width,h=canvas.height,radius=3;
      for(let y=0;y<h;y++){let count=0;for(let x=-radius;x<w;x++){if(x+radius<w)count+=mask[y*w+x+radius];if(x-radius-1>=0)count-=mask[y*w+x-radius-1];if(x>=0)spread[y*w+x]=count>0?1:0;}}
      for(let x=0;x<w;x++){let count=0;for(let y=-radius;y<h;y++){if(y+radius<h)count+=spread[(y+radius)*w+x];if(y-radius-1>=0)count-=spread[(y-radius-1)*w+x];if(y>=0&&count>0){const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=255;}}}
      ctx.putImageData(pixels,0,0);
    }
    ctx.fillStyle='white';masks.forEach(mask=>ctx.fillRect(mask.x*canvas.width,mask.y*canvas.height,mask.width*canvas.width,mask.height*canvas.height));
    return canvas;
  }
  function findGrid(canvas) {
    // Bảng thẳng: dò đường kẻ dài thay vì đoán ô từ khoảng cách giữa từ.
    const scale=Math.min(1,900/canvas.width),small=document.createElement('canvas');small.width=Math.round(canvas.width*scale);small.height=Math.round(canvas.height*scale);
    const ctx=small.getContext('2d',{willReadFrequently:true});ctx.drawImage(canvas,0,0,small.width,small.height);
    const pixels=ctx.getImageData(0,0,small.width,small.height).data,w=small.width,h=small.height;
    const dark=(x,y)=>{const i=(y*w+x)*4;return (pixels[i]+pixels[i+1]+pixels[i+2])/3<220;};
    const cluster=values=>values.reduce((out,value)=>{if(!out.length||value-out[out.length-1]>7)out.push(value);return out;},[]);
    const ys=[];for(let y=0;y<h;y++){let count=0;for(let x=0;x<w;x++)if(dark(x,y))count++;if(count>w*.6)ys.push(y);}
    const rows=cluster(ys);if(rows.length<3)return null;
    const xs=[];for(let x=0;x<w;x++){let count=0;for(let y=rows[0];y<=rows[rows.length-1];y++)if(dark(x,y))count++;if(count>(rows[rows.length-1]-rows[0])*.7)xs.push(x);}
    const cols=cluster(xs);if(cols.length<3||cols.length>17)return null;
    return {xs:cols.map(x=>x/scale),ys:rows.map(y=>y/scale)};
  }
  function prepareOCR(cleaned,original) {
    // Cân bằng nền giấy theo từng vùng; nét đã xóa vẫn trắng trên ảnh chụp tối.
    const canvas=document.createElement('canvas');canvas.width=cleaned.width;canvas.height=cleaned.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(cleaned,0,0);
    const image=ctx.getImageData(0,0,canvas.width,canvas.height),source=original.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height).data;
    const tile=128,w=canvas.width,h=canvas.height;
    for(let top=0;top<h;top+=tile)for(let left=0;left<w;left+=tile){
      const samples=[];
      for(let y=top;y<Math.min(h,top+tile);y+=8)for(let x=left;x<Math.min(w,left+tile);x+=8){const i=(y*w+x)*4;samples.push((source[i]+source[i+1]+source[i+2])/3);}
      samples.sort((a,b)=>a-b);const threshold=samples[Math.floor(samples.length*.75)]*.85;
      for(let y=top;y<Math.min(h,top+tile);y++)for(let x=left;x<Math.min(w,left+tile);x++){const i=(y*w+x)*4;const value=(image.data[i]+image.data[i+1]+image.data[i+2])/3<threshold?0:255;image.data[i]=image.data[i+1]=image.data[i+2]=value;}
    }
    ctx.putImageData(image,0,0);return canvas;
  }
  function findSlantedGrid(canvas,diagnostics={}) {
    const scale=Math.min(1,750/canvas.width),w=Math.round(canvas.width*scale),h=Math.round(canvas.height*scale);
    const small=document.createElement('canvas');small.width=w;small.height=h;const ctx=small.getContext('2d');ctx.drawImage(canvas,0,0,w,h);
    const data=ctx.getImageData(0,0,w,h).data;
    const dark=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&data[(Math.round(y)*w+Math.round(x))*4]<220;
    const lines=[];
    for(let y=0;y<h;y++){let best=0,slope=0;for(let s=-6;s<=6;s++){let count=0;for(let x=0;x<w;x++)if(dark(x,y+s*.01*(x-w/2)))count++;if(count>best){best=count;slope=s*.01;}}if(best>w*.4)lines.push({position:y,slope,count:best});}
    const cluster=hits=>{const out=[];for(const hit of hits){const last=out.at(-1);if(!last||hit.position-last.position>9)out.push(hit);else if(hit.count>last.count)out[out.length-1]=hit;}return out;};
    const candidates=cluster(lines),groups=[];let group=[];
    for(const line of candidates){const gap=group.length?line.position-group.at(-1).position:0;const previous=group.length>1?group.at(-1).position-group.at(-2).position:gap;
      if(group.length&&(gap>150||gap<previous*.7||gap>previous*1.5)){groups.push(group);group=[];}group.push(line);
    }if(group.length)groups.push(group);
    const rows=groups.sort((a,b)=>b.length-a.length)[0]||[];diagnostics.rows=rows;if(rows.length<3||rows.length>101)return null;
    const top=rows[0].position,bottom=rows.at(-1).position,vertical=[];
    for(let x=0;x<w;x++){let best=0,slope=0;for(let s=-6;s<=6;s++){let count=0;for(let y=top;y<=bottom;y++)if(dark(x+s*.01*(y-h/2),y))count++;if(count>best){best=count;slope=s*.01;}}if(best>(bottom-top)*.3)vertical.push({position:x,slope,count:best});}
    const cols=cluster(vertical);diagnostics.cols=cols;if(cols.length<3||cols.length>17)return null;
    return {xs:cols.map(line=>line.position/scale),ys:rows.map(line=>line.position/scale),rowSlopes:rows.map(line=>line.slope),colSlopes:cols.map(line=>line.slope),centerX:canvas.width/2,centerY:canvas.height/2};
  }
  function gridBlock(grid,words) {
    const rows=[];
    for(let r=0;r<grid.ys.length-1;r++) {
      const cells=[];for(let c=0;c<grid.xs.length-1;c++) {
        const selected=words.filter(word=>{const x=word.x+word.width/2,y=word.y+word.height/2;return x>grid.xs[c]+(grid.colSlopes?.[c]||0)*(y-(grid.centerY||0))&&x<grid.xs[c+1]+(grid.colSlopes?.[c+1]||0)*(y-(grid.centerY||0))&&y>grid.ys[r]+(grid.rowSlopes?.[r]||0)*(x-(grid.centerX||0))&&y<grid.ys[r+1]+(grid.rowSlopes?.[r+1]||0)*(x-(grid.centerX||0));});
        selected.sort((a,b)=>Math.abs(a.y-b.y)>Math.min(a.height,b.height)/2?a.y-b.y:a.x-b.x);
        cells.push(selected.map(word=>word.confidence<45?'[CẦN KIỂM TRA]':word.text).join(' ')||'___');
      }rows.push(cells);
    }
    return {kind:'table',text:'Hoàn thành bảng sau:',columns:rows.shift(),rows,lines:0,parts:[],options:[],answer:'',review:'Bảng được dò từ đường kẻ thẳng. Kiểm tra từng ô, đặc biệt số/chữ từng được viết tay.'};
  }
  async function readGridCells(worker,canvas,grid,block,original,removeColor) {
    const originalPixels=original.getContext('2d',{willReadFrequently:true}).getImageData(0,0,original.width,original.height).data;
    await worker.setParameters({tessedit_pageseg_mode:'6'});
    try {
      for(let r=0;r<grid.ys.length-1;r++)for(let c=0;c<grid.xs.length-1;c++){
        const middleX=(grid.xs[c]+grid.xs[c+1])/2,middleY=(grid.ys[r]+grid.ys[r+1])/2;
        const left=grid.xs[c]+(grid.colSlopes?.[c]||0)*(middleY-(grid.centerY||0))+6;
        const right=grid.xs[c+1]+(grid.colSlopes?.[c+1]||0)*(middleY-(grid.centerY||0))-6;
        const top=grid.ys[r]+(grid.rowSlopes?.[r]||0)*(middleX-(grid.centerX||0))+6;
        const bottom=grid.ys[r+1]+(grid.rowSlopes?.[r+1]||0)*(middleX-(grid.centerX||0))-6;
        if(right<=left||bottom<=top)continue;
        studio.feedback(`Đọc bảng trên thiết bị: hàng ${r+1}/${grid.ys.length-1}, cột ${c+1}/${grid.xs.length-1}`);
        const rectangle={left:Math.max(0,Math.floor(left)),top:Math.max(0,Math.floor(top)),width:Math.floor(Math.min(canvas.width,right)-Math.max(0,left)),height:Math.floor(Math.min(canvas.height,bottom)-Math.max(0,top))};
        if(removeColor&&r>0){
          const samples=[];
          for(let y=rectangle.top;y<rectangle.top+rectangle.height;y+=4)for(let x=rectangle.left;x<rectangle.left+rectangle.width;x+=4){const i=(y*original.width+x)*4;const red=originalPixels[i],green=originalPixels[i+1],blue=originalPixels[i+2];samples.push({light:(red+green+blue)/3,ink:(red-green>16&&blue-green>16)||(red-green>30&&red-blue>30)||(blue-red>45&&blue-green>25)});}
          const lights=samples.map(pixel=>pixel.light).sort((a,b)=>a-b),paper=lights[Math.floor(lights.length*.75)]||255;
          const ink=samples.filter(pixel=>pixel.ink).length,neutral=samples.filter(pixel=>!pixel.ink&&pixel.light<paper*.65).length;
          if(ink>samples.length*.002&&ink>neutral*2){block.rows[r-1][c]='___';continue;}
        }
        const cellCanvas=document.createElement('canvas');cellCanvas.width=rectangle.width;cellCanvas.height=rectangle.height;
        cellCanvas.getContext('2d').drawImage(canvas,rectangle.left,rectangle.top,rectangle.width,rectangle.height,0,0,rectangle.width,rectangle.height);
        const {data}=await worker.recognize(cellCanvas,{},{text:true});
        const value=data.text.trim().replace(/\s*\n\s*/g,' ');
        const cell=!value||/^[\s`~'"|⁄.,—\-]+$/.test(value)?'___':data.confidence<65?'[CẦN KIỂM TRA]':value;
        if(r===0)block.columns[c]=cell;else block.rows[r-1][c]=cell;
      }
    }finally{await worker.setParameters({tessedit_pageseg_mode:'3'});}
  }
  async function imageCanvas(file) {
    const bitmap=await createImageBitmap(file);const scale=Math.min(1,2600/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas;
  }
  const local={worker:null,sourcePages:[],
    async getWorker(){
      if(!this.worker){await loadScript('tesseract.min.js');this.worker=await root.Tesseract.createWorker('vie',1,{workerPath:base+'worker.min.js',corePath:base,langPath:base+'lang',gzip:false,logger:message=>{if(message.status==='recognizing text')studio.feedback(`Đang nhận diện trên thiết bị: ${Math.round(message.progress*100)}%`);}});await this.worker.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1'});}
      return this.worker;
    },
    async readCanvas(canvas,name,pageNumber=1,masks=[],removeColor=document.getElementById('ws-remove-color')?.checked!==false){
      const cleaned=cleanCanvas(canvas,removeColor,masks);
      const prepared=prepareOCR(cleaned,canvas);
      const worker=await this.getWorker();const {data}=await worker.recognize(prepared,{}, {text:true,tsv:true});
      const gridSource=prepareOCR(canvas,canvas),grid=findSlantedGrid(gridSource)||findGrid(gridSource),words=wordsFromTsv(data.tsv);
      let doc;
      if(grid){const outside=words.filter(word=>word.y+word.height/2<grid.ys[0]||word.y>grid.ys[grid.ys.length-1]);
        doc=outside.length?parseText(wordsToText(outside),name):D.normalize({title:name,pages:[{title:'',blocks:[gridBlock(grid,words)]}]});
        if(outside.length)doc.pages.at(-1).blocks.push(gridBlock(grid,words));
        await readGridCells(worker,prepared,grid,doc.pages.at(-1).blocks.at(-1),canvas,removeColor);
      }else doc=parseText(data.text,name);
      if(data.confidence<70)doc.warnings.push(`Trang ${pageNumber}: chữ nhận diện chưa rõ (${Math.round(data.confidence)}%). Cần đối chiếu toàn bộ.`);
      doc.warnings.push('Sơ đồ/minh họa có thông tin học tập cần dùng công cụ cắt vùng từ bản gốc, không chỉ dựa vào chữ OCR.');
      this.sourcePages.push({name:`${name} · Trang ${pageNumber}`,original:canvas,cleaned,prepared,masks,removeColor});
      return doc;
    },
    async extract(file){
      if(/\.txt$/i.test(file.name))return parseText(await file.text(),file.name);
      if(/\.docx$/i.test(file.name)){
        await loadScript('mammoth.browser.min.js');const result=await root.mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()},{includeDefaultStyleMap:true});
        const source=new DOMParser().parseFromString(result.value,'text/html');source.querySelectorAll('script,style').forEach(el=>el.remove());
        const pages=[{title:'',blocks:[]}];
        Array.from(source.body.children).forEach(el=>{if(el.tagName==='TABLE'){const rows=Array.from(el.querySelectorAll('tr')).map(row=>Array.from(row.children).map(cell=>cell.textContent.trim()||'___'));pages[0].blocks.push({kind:'table',text:'',columns:rows.shift()||[],rows,lines:0});}
          else {const value=el.textContent.trim();if(value)pages[0].blocks.push({kind:/^H[1-6]$/.test(el.tagName)?'text':'question',text:value,lines:2});}});
        return D.normalize({title:file.name.replace(/\.docx$/i,''),pages,warnings:['Word được đọc cục bộ. Với hình/sơ đồ, nên xuất Word thành PDF rồi nhập để cắt vùng hình; kiểm tra bảng và cách xuống dòng.']});
      }
      if(/\.pdf$/i.test(file.name)){
        const pdfjs=await import(base+'pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc=base+'pdf.worker.mjs';
        const loadingTask=pdfjs.getDocument({data:await file.arrayBuffer(),wasmUrl:base+'wasm/',standardFontDataUrl:base+'standard_fonts/',cMapUrl:base+'cmaps/',cMapPacked:true,isEvalSupported:false});
        const pdf=await loadingTask.promise;
        if(pdf.numPages>20){await loadingTask.destroy();throw new Error('PDF tối đa 20 trang mỗi file. Hãy chia thành các file nhỏ hơn.');}
        const pages=[],warnings=[];
        try {for(let n=1;n<=pdf.numPages;n++){studio.feedback(`Đọc PDF trên thiết bị: trang ${n}/${pdf.numPages}`);const page=await pdf.getPage(n);const unscaled=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(2.5,2600/Math.max(unscaled.width,unscaled.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const result=await this.readCanvas(canvas,file.name,n);pages.push(...result.pages);warnings.push(...result.warnings);page.cleanup();}}finally{await loadingTask.destroy();}
        return D.normalize({title:file.name.replace(/\.pdf$/i,''),pages,warnings});
      }
      const canvas=await imageCanvas(file);return this.readCanvas(canvas,file.name,1,file.wsMasks||[],typeof file.wsRemoveColor==='boolean'?file.wsRemoveColor:document.getElementById('ws-remove-color')?.checked!==false);
    },
    parseText,cleanCanvas,prepareOCR,findGrid,findSlantedGrid,gridBlock,wordsFromTsv,imageCanvas
  };
  app.worksheetLocalImport=local;
  studio.extract=file=>local.extract(file);
})(globalThis);
