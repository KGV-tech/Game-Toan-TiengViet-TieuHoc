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
  function decoration(kind) {
    let marks = '';
    for(let i=0;i<10;i++) {
      const x = 30+i*100;
      if(kind==='leaves') marks += `<path d="M${x} 45q-24-40 5-34q28 8-5 34m0 0l18-29" fill="#a9dec2" stroke="#398661" stroke-width="2"/>`;
      if(kind==='stars') marks += `<path d="M${x} 6l7 13 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2z" fill="${i%2?'#a8d7f0':'#ffd775'}" stroke="#659cb9"/>`;
      if(kind==='rainbow') marks += `<path d="M${x-25} 43a25 25 0 0 1 50 0" fill="none" stroke="#f7b4bb" stroke-width="8"/><path d="M${x-17} 43a17 17 0 0 1 34 0" fill="none" stroke="#fbd783" stroke-width="7"/><path d="M${x-10} 43a10 10 0 0 1 20 0" fill="none" stroke="#99d8cb" stroke-width="6"/>`;
      if(kind==='pencils') marks += `<g transform="translate(${x},6) rotate(12)"><rect width="12" height="32" rx="2" fill="${i%2?'#8dcfda':'#ffd272'}"/><path d="M0 32l6 10 6-10" fill="#dec8a7"/><path d="M4 39l2 3 2-3" fill="#314154"/></g>`;
      if(kind==='geometry') marks += i%2 ? `<circle cx="${x}" cy="25" r="15" fill="#c4b8f5"/>` : `<path d="M${x} 7l19 33h-38z" fill="#b6e4d2"/>`;
    }
    return kind==='none' ? '' : `<svg class="ws-decoration" viewBox="0 0 1000 55" aria-hidden="true">${marks}</svg>`;
  }
  async function paginate(paper) {
    if (!paper || paper.dataset.paginated) return;
    const doc = paper.ownerDocument;
    await doc.fonts?.ready;
    await Promise.all(Array.from(paper.querySelectorAll('img')).map(img => img.decode?.().catch(()=>{})));
    const sources = Array.from(paper.children);
    const kind = paper.dataset.decoration || 'leaves';
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
      page = doc.createElement('div'); page.className='ws-page';
      page.innerHTML=`<div class="ws-page-top">${decoration(kind)}</div><div class="ws-page-content"></div><footer class="ws-paper-footer">${decoration(kind)}<span class="ws-page-number"></span></footer>`;
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
      node.remove();
      if (!empty() && !tooTall) { newPage(); target().append(node); if(!over())return; node.remove(); }
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
      const pages=Array.from(paper.children);
      pages.forEach((page,i)=>page.querySelector('.ws-page-number').textContent=`Trang ${i+1}/${pages.length}`);
      paper.dataset.paginated='true';
    } catch(error) { paper.replaceChildren(...sources); paper.classList.remove('ws-a4');throw error; }
  }
  const api={WIDTH,allocate,resize,decoration,paginate};root.WorksheetLayout=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
