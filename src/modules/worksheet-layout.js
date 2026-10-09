;(function(root) {
  const WIDTH = 178;
  // Millimetres. Locked dimensions never participate in redistribution.
  function allocate(raw, count, total, equal = false) {
    if (!count) return [];
    const items = Array.from({length: count}, (_, i) => ({value: Math.max(1, Number(raw[i]?.value) || total/count), locked: raw[i]?.locked === true}));
    const fixed = items.reduce((sum, item) => sum + (item.locked ? item.value : 0), 0);
    const free = items.filter(item => !item.locked);
    if (fixed + free.length > total + .01) throw new Error('Kích thước cố định vượt khổ bảng. Giảm kích thước hoặc bỏ cố định một cột/dòng.');
    if (!free.length) {
      if (Math.abs(fixed-total) > .01) throw new Error('Bỏ cố định một cột/dòng để chia phần kích thước còn lại.');
      return items;
    }
    const weight = free.reduce((sum, item) => sum + (equal ? 1 : item.value), 0);
    free.forEach(item => { item.value = (total-fixed)*(equal ? 1 : item.value)/weight; });
    return items;
  }
  function resize(raw, index, value, total) {
    const items = raw.map(item => ({...item}));
    value = Number(value);
    if (!Number.isFinite(value) || value < 1) throw new Error('Kích thước phải từ 1 mm.');
    const others = items.filter((_, i) => i !== index);
    const fixed = others.reduce((sum, item) => sum + (item.locked ? item.value : 0), 0);
    const free = others.filter(item => !item.locked);
    if (value+fixed+free.length > total+.01 || (!free.length && Math.abs(value+fixed-total) > .01)) throw new Error('Kích thước vượt phần còn lại của khổ bảng; hãy giảm giá trị hoặc bỏ cố định.');
    items[index].value = value;
    free.forEach(item => { item.value = (total-fixed-value)/free.length; });
    return items;
  }
  function decoration(kind, imageURL) {
    const header = root.WorksheetDocument?.resolveHeader(kind);
    const src = imageURL || (header && root.location ? new URL(header.src, root.location.href).href : header?.src);
    return header ? `<img class="ws-decoration ws-header-image" src="${src}" width="${header.width}" height="${header.height}" alt="Phiếu học tập">` : '';
  }
  async function paginate(paper) {
    if (!paper || paper.dataset.paginated) return;
    const doc = paper.ownerDocument;
    await doc.fonts?.ready;
    await Promise.all(Array.from(paper.querySelectorAll('img')).map(img => img.decode?.().catch(()=>{})));
    const sources = Array.from(paper.children);
    const kind = paper.dataset.decoration || 'leaves';
    let imageURL;
    const header = root.WorksheetDocument?.resolveHeader(kind);
    paper.style.setProperty('--ws-header-height', `${header ? Math.min(60, 200 * header.height / header.width) / 2 : 0}mm`);
    if (header && doc !== root.document) {
      // Load through the opener: newly written print windows can defer image requests.
      const response = await root.fetch(new URL(header.src, root.location.href));
      if (!response.ok) throw new Error('Không tải được mẫu trang trí. Hãy thử in lại.');
      imageURL = root.URL.createObjectURL(await response.blob());
      doc.defaultView.addEventListener('unload', () => root.URL.revokeObjectURL(imageURL), { once: true });
    }
    paper.replaceChildren(); paper.classList.add('ws-a4');
    let page, content, group = null, groupId = null;
    const target = () => group || content;
    const startGroup = () => {
      if (groupId === null) { group = null; return; }
      group = doc.createElement('div'); group.className = 'ws-print-group'; group.dataset.wsGroup = groupId;
      content.append(group);
    };
    const newPage = (carryGroup = true) => {
      const previous = group || content;
      const heading = carryGroup && previous?.lastElementChild?.matches('.ws-group-title') ? previous.lastElementChild : null;
      heading?.remove();
      if (group && !group.children.length) group.remove();
      const firstPage = !paper.children.length;
      page = doc.createElement('div'); page.className='ws-page';
      if (!firstPage) page.style.setProperty('--ws-header-height', '0mm');
      page.innerHTML=`${firstPage && header ? `<div class="ws-page-top">${decoration(kind, imageURL)}</div>` : ''}<div class="ws-page-content"></div>`;
      paper.append(page); content=page.querySelector('.ws-page-content');
      startGroup();
      if(heading)target().append(heading);
    };
    const over = () => content.scrollHeight > content.clientHeight + 1;
    const empty = () => !content.querySelector('.ws-paper-header,.ws-group-title,.ws-block,.ws-part,table,h3,p');
    function place(node) {
      target().append(node);
      if(!over()) return;
      const tooTall = node.offsetHeight > content.clientHeight;
      const fitsNextPage = node.offsetHeight <= content.clientHeight + (page.querySelector('.ws-page-top')?.offsetHeight || 0);
      node.remove();
      if (!empty() && (!tooTall || fitsNextPage)) { newPage(); target().append(node); if(!over())return; node.remove(); }
      // Split a table by complete rows, retaining its column widths and headings.
      const table = node.querySelector?.('table');
      if(table && table.tBodies[0]?.rows.length) {
        const rows=Array.from(table.tBodies[0].rows); table.tBodies[0].replaceChildren();
        const tail=Array.from(node.children).filter(child => !child.matches('h3,.ws-table-wrap'));
        tail.forEach(child=>child.remove());
        let fragment=node;
        target().append(fragment);
        for(const row of rows) {
          let body=fragment.querySelector('tbody'); body.append(row);
          if(over()) {
            row.remove(); if(!body.rows.length)fragment.remove(); newPage(); fragment=node.cloneNode(true);
            fragment.querySelector('tbody').replaceChildren(row); target().append(fragment);
          }
          if(over()) throw new Error('Một dòng bảng cao hơn vùng in A4. Giảm chiều cao dòng hoặc rút ngắn nội dung ô.');
        }
        tail.forEach(place);
        return;
      }
      // Split long lessons at their children (subquestions/writing lines).
      if(node.matches?.('.ws-block,.ws-part') && node.children.length>1) {
        const children=Array.from(node.children); node.replaceChildren();
        let fragment=node; target().append(fragment);
        for(const child of children) {
          fragment.append(child);
          if(over()) {
            child.remove(); if(!fragment.children.length)fragment.remove();
            newPage(); fragment=node.cloneNode(false);target().append(fragment);fragment.append(child);
            if(over()) { child.remove(); if(!fragment.children.length)fragment.remove();place(child);fragment=node.cloneNode(false);target().append(fragment); }
          }
        }
        if(!fragment.children.length)fragment.remove();
        return;
      }
      if(node.matches?.('h3,p') && node.textContent.trim()) {
        const words=node.textContent.trim().split(/\s+/);let offset=0;
        while(offset<words.length) {
          const fragment=node.cloneNode(false);target().append(fragment);
          let low=0,high=words.length-offset;
          while(low<high) {
            const mid=Math.ceil((low+high)/2);fragment.textContent=words.slice(offset,offset+mid).join(' ');
            if(over())high=mid-1;else low=mid;
          }
          if(!low) { fragment.remove();if(empty())throw new Error('Cỡ chữ vượt vùng in A4.');newPage();continue; }
          fragment.textContent=words.slice(offset,offset+low).join(' ');offset+=low;
          if(offset<words.length)newPage();
        }
        return;
      }
      target().append(node);
      if(over()) throw new Error('Nội dung vượt vùng in A4. Chia bài hoặc giảm kích thước hình/bảng.');
    }
    try {
      newPage();
      sources.forEach((source,i)=> {
        if(!source.children.length)return;
        groupId=null; group=null;
        if(i && source.dataset.newPage==='true' && content.querySelector('.ws-block,.ws-part,table')) newPage(false);
        groupId=null; group=null;
        Array.from(source.cloneNode(true).children).forEach(node=>{
          if (!node.matches('.ws-print-group')) { place(node); return; }
          groupId=node.dataset.wsGroup; startGroup();
          Array.from(node.children).forEach(place);
          if (!group.children.length) group.remove();
          groupId=null; group=null;
        });
      });
      // Headers are inserted during pagination; wait for them before printing.
      await Promise.all(Array.from(paper.querySelectorAll('.ws-header-image')).map(img => img.decode()));
      paper.dataset.paginated='true';
    } catch(error) { if (imageURL) root.URL.revokeObjectURL(imageURL); paper.replaceChildren(...sources); paper.classList.remove('ws-a4');throw error; }
  }
  const api={WIDTH,allocate,resize,decoration,paginate};root.WorksheetLayout=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
