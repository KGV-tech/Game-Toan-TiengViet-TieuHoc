;(function(root){
  const app=root.app,D=root.WorksheetDocument,studio=app.worksheetStudio,local=app.worksheetLocalImport;
  const tools={selection:null,canvas:null,source:null,
    async open(fileIndex){
      const item=studio.files[fileIndex];if(!item||!/\.(png|jpe?g|webp)$/i.test(item.file.name))return;
      const canvas=await local.imageCanvas(item.file);
      this.source={original:canvas,masks:item.file.wsMasks||[],file:item.file,removeColor:item.file.wsRemoveColor};this.show();
    },
    show(source=this.source){
      if(!source)return;
      this.source=source;this.selection=null;
      let dialog=document.getElementById('ws-source-dialog');
      if(!dialog){dialog=document.createElement('dialog');dialog.id='ws-source-dialog';dialog.className='ws-source-dialog ws-studio';document.body.append(dialog);}
      dialog.innerHTML=`<h3>Làm sạch và giữ hình từ bản gốc</h3><p>Kéo để chọn vùng có nét bút. Nếu cần giữ hình của bài, khoanh hình rồi bấm Giữ làm hình minh họa. Không xóa số/chữ in sẵn.</p><label><input id="ws-source-remove-color" type="checkbox" ${document.getElementById('ws-remove-color')?.checked!==false?'checked':''}> Bỏ nét màu (tắt khi chữ/hình in sẵn có màu)</label><canvas id="ws-source-canvas" aria-label="Chọn vùng ảnh gốc để xóa nét bút hoặc cắt hình minh họa"></canvas><div class="ws-region-fields">${[['x','Trái'],['y','Trên'],['width','Rộng'],['height','Cao']].map(([id,label])=>`<label>${label} (%)<input id="ws-region-${id}" type="number" min="0" max="100" value="${id==='width'||id==='height'?10:0}"></label>`).join('')}</div><div id="ws-source-status" role="status"></div><div class="ws-actions"><button type="button" id="ws-erase-region">Xóa nét bút vùng chọn</button><button type="button" id="ws-reset-region">Khôi phục ảnh</button><button type="button" id="ws-keep-visual">Giữ làm hình minh họa</button><button type="button" id="ws-source-close">Xong</button></div>`;
      this.canvas=document.getElementById('ws-source-canvas');this.canvas.width=source.original.width;this.canvas.height=source.original.height;
      if(typeof source.removeColor==='boolean')document.getElementById('ws-source-remove-color').checked=source.removeColor;
      const refresh=()=>{source.removeColor=document.getElementById('ws-source-remove-color').checked;if(source.file)source.file.wsRemoveColor=source.removeColor;source.cleaned=local.cleanCanvas(source.original,source.removeColor,source.masks||[]);this.canvas.getContext('2d').drawImage(source.cleaned,0,0);};refresh();
      let start=null;
      const point=event=>{const r=this.canvas.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(event.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(event.clientY-r.top)/r.height))};};
      const update=(a,b)=>{this.selection={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)};Object.keys(this.selection).forEach(key=>document.getElementById(`ws-region-${key}`).value=(this.selection[key]*100).toFixed(1));refresh();const ctx=this.canvas.getContext('2d');ctx.strokeStyle='#147dff';ctx.lineWidth=4;const s=this.selection;ctx.strokeRect(s.x*this.canvas.width,s.y*this.canvas.height,s.width*this.canvas.width,s.height*this.canvas.height);};
      this.canvas.onpointerdown=event=>{this.canvas.setPointerCapture(event.pointerId);start=point(event);};
      this.canvas.onpointermove=event=>{if(start)update(start,point(event));};
      this.canvas.onpointerup=event=>{if(start)update(start,point(event));start=null;};this.canvas.onpointercancel=()=>start=null;
      const region=()=>{const s={};for(const key of ['x','y','width','height'])s[key]=Math.max(0,Math.min(1,Number(document.getElementById(`ws-region-${key}`).value)/100));s.width=Math.min(s.width,1-s.x);s.height=Math.min(s.height,1-s.y);if(s.width<.005||s.height<.005)throw new Error('Chọn vùng có chiều rộng và cao lớn hơn 0.5%.');return s;};
      const run=fn=>{try{fn();document.getElementById('ws-source-status').textContent='Đã cập nhật trên thiết bị.';}catch(error){document.getElementById('ws-source-status').textContent=error.message;}};
      document.getElementById('ws-source-remove-color').onchange=refresh;
      document.getElementById('ws-erase-region').onclick=()=>run(()=>{source.masks ||= [];source.masks.push(region());if(source.file)source.file.wsMasks=source.masks;refresh();});
      document.getElementById('ws-reset-region').onclick=()=>run(()=>{source.masks=[];if(source.file)source.file.wsMasks=[];refresh();});
      document.getElementById('ws-keep-visual').disabled=!studio.doc;
      document.getElementById('ws-keep-visual').onclick=()=>run(()=>{studio.capture();const s=region(),crop=document.createElement('canvas');const scale=Math.min(1,1000/(s.width*source.cleaned.width));crop.width=Math.max(1,Math.round(s.width*source.cleaned.width*scale));crop.height=Math.max(1,Math.round(s.height*source.cleaned.height*scale));crop.getContext('2d').drawImage(source.cleaned,s.x*source.cleaned.width,s.y*source.cleaned.height,s.width*source.cleaned.width,s.height*source.cleaned.height,0,0,crop.width,crop.height);const visual=crop.toDataURL('image/webp',.88);if(visual.length>1400000)throw new Error('Vùng hình quá lớn. Hãy chọn vùng nhỏ hơn.');studio.doc.pages[studio.doc.pages.length-1].blocks.push({kind:'diagram',text:'Hình của bài (hãy đổi câu dẫn và vị trí cho đúng)',visual,lines:2,parts:[],options:[],columns:[],rows:[],diagram:{type:'nodes',nodes:[],edges:[]}});dialog.close();studio.renderEditor();});
      document.getElementById('ws-source-close').onclick=()=>dialog.close();
      if(!dialog.open)dialog.showModal();
    }
  };app.worksheetSourceTools=tools;
})(globalThis);
