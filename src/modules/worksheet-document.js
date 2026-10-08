// Cấu trúc phiếu tự do: không dùng template hoặc quy tắc chấm điểm của Đề.
;(function (root) {
  const text = (value, max = 20000) => String(value ?? '').slice(0, max);
  const escape = value => text(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const list = (value, max = 100) => Array.isArray(value) ? value.slice(0, max) : [];
  function normalize(raw) {
    if (!raw || !Array.isArray(raw.pages)) throw new Error('Dữ liệu nhận diện chưa có trang hợp lệ. Hãy đọc lại file.');
    if (raw.pages.length > 40 || raw.pages.some(page => Array.isArray(page.blocks) && page.blocks.length > 100)) throw new Error('Phiếu quá dài (tối đa 40 trang, 100 khối/trang). Hãy chia thành nhiều phiếu để giữ đầy đủ nội dung.');
    const pages = list(raw.pages, 40).map((page, p) => ({
      title: text(page.title, 500), hideTitle: page.hideTitle === true, startNewPage: page.startNewPage !== false, source: text(page.source, 255),
      blocks: list(page.blocks, 100).map((block, b) => ({
        id: `p${p}-b${b}`, kind: ['text', 'question', 'table', 'diagram'].includes(block.kind) ? block.kind : 'question',
        text: text(block.text), answer: text(block.answer, 5000),
        lines: Math.min(20, Math.max(0, Number(block.lines) || 0)),
        options: list(block.options, 12).map(item => text(item, 2000)),
        parts: list(block.parts, 50).map(part => ({ label: text(part.label, 30), text: text(part.text), answer: text(part.answer, 5000), lines: Math.min(20, Math.max(0, Number(part.lines) || 0)), options: list(part.options, 12).map(item => text(item, 2000)) })),
        tableLayout: { height: Math.min(200, Math.max(20, Number(block.tableLayout?.height) || 120)), equalColumns: block.tableLayout?.equalColumns !== false, equalRows: block.tableLayout?.equalRows !== false,
          columns: list(block.tableLayout?.columns, 16).map(size => ({ value: Math.min(178, Math.max(0, Number(size.value) || 0)), locked: size.locked === true })),
          rows: list(block.tableLayout?.rows, 101).map(size => ({ value: Math.min(200, Math.max(0, Number(size.value) || 0)), locked: size.locked === true })) },
        columns: list(block.columns, 16).map(item => text(item, 500)),
        rows: list(block.rows, 100).map(row => list(row, 16).map(cell => text(cell, 2000))),
        diagram: { type: ['numberline', 'nodes'].includes(block.diagram?.type) ? block.diagram.type : 'nodes',
          nodes: list(block.diagram?.nodes, 50).map(node => ({ label: text(node.label, 200), x: Math.min(95, Math.max(5, Number(node.x) || 5)), y: Math.min(90, Math.max(10, Number(node.y) || 10)) })),
          edges: list(block.diagram?.edges, 80).map(edge => ({ from: Math.max(0, Number(edge.from) || 0), to: Math.max(0, Number(edge.to) || 0), label: text(edge.label, 100) })) },
        review: text(block.review, 1000)
        ,visual: /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(String(block.visual || '')) && String(block.visual).length < 1500000 ? String(block.visual) : ''
      }))
    }));
    if (!pages.length || !pages.some(page => page.blocks.length)) throw new Error('Không tìm thấy nội dung bài học trong file.');
    return { version: 1, title: text(raw.title || 'Phiếu học tập từ tài liệu', 500), topic: text(raw.topic, 500), lesson: text(raw.lesson, 500), decoration: ['none','leaves','stars','rainbow','pencils','geometry'].includes(raw.decoration) ? raw.decoration : 'leaves', theme: ['mint', 'sky', 'sun'].includes(raw.theme) ? raw.theme : 'mint', pages, warnings: list(raw.warnings, 100).map(item => text(item, 1000)) };
  }
  function isFreeform(record) { return Boolean(record?.questions?.some(question => question?.worksheetBlock)); }
  function fromRecord(record) {
    const meta = record.questions?.find(question => question.worksheetMeta)?.worksheetMeta || {};
    const pages = list(meta.pageTitles, 40).map((title, p) => ({ title, hideTitle: meta.pageHiddenTitles?.[p] === true, startNewPage: meta.groupPageBreaks?.[p] !== false, blocks: [] }));
    for (const question of record.questions || []) {
      if (!question.worksheetBlock) continue;
      const index = Number(question.worksheetPage) || 0;
      if (!Number.isInteger(index) || index < 0 || index >= 40) throw new Error('Số trang của phiếu không hợp lệ.');
      while (pages.length <= index) pages.push({ title: meta.pageTitles?.[pages.length] || '', hideTitle: meta.pageHiddenTitles?.[pages.length] === true, startNewPage: meta.groupPageBreaks?.[pages.length] !== false, blocks: [] });
      pages[index].blocks.push(question.worksheetBlock);
    }
    return normalize({ ...meta, title: record.name, pages });
  }
  function toRecord(doc, metadata = {}) {
    doc = normalize(doc);
    const questions = doc.pages.flatMap((page, p) => page.blocks.map(block => ({ q: block.text, type: 'Phiếu tự do', ans: '', worksheetPage: p, worksheetBlock: block })));
    questions[0].worksheetMeta = { version: 1, theme: doc.theme, decoration: doc.decoration, groupPageBreaks: doc.pages.map(page => page.startNewPage), topic: doc.topic, lesson: doc.lesson, pageTitles: doc.pages.map(page => page.title), pageHiddenTitles: doc.pages.map(page => page.hideTitle), warnings: doc.warnings };
    return { ...metadata, name: doc.title, questions };
  }
  function publicDocument(doc) {
    const copy = normalize(doc);
    copy.warnings = [];
    copy.pages.forEach(page => { page.source = ''; page.blocks.forEach(block => { block.answer = ''; block.review = ''; block.parts.forEach(part => { part.answer = ''; }); }); });
    return copy;
  }
  function inline(value, interactive = false, key = '', answers = {}) {
    let n = 0;
    return escape(value).replace(/_{3,}|\.{5,}|…{2,}/g, () => {
      const id = `${key}-blank-${n++}`;
      return interactive ? `<input class="ws-inline-answer" data-ws-answer="${id}" aria-label="Chỗ trống ${escape(key)} ${n}" value="${escape(answers[id] || '')}">` : '<span class="ws-dotted">........................</span>';
    }).replace(/\n/g, '<br>');
  }
  function diagramHTML(diagram) {
    const nodes = diagram.nodes || [];
    if (!nodes.length) return '';
    const line = diagram.type === 'numberline' ? '<path d="M20 65H720l-12 -7m12 7l-12 7" fill="none" stroke="currentColor" stroke-width="2"/>' : '';
    const edges = (diagram.edges || []).map(edge => {
      const from = nodes[edge.from], to = nodes[edge.to];
      return from && to ? `<path d="M${from.x * 7.4} ${from.y * 2.2}L${to.x * 7.4} ${to.y * 2.2}" stroke="currentColor" fill="none"/><text x="${(from.x + to.x) * 3.7}" y="${(from.y + to.y) * 1.1 - 8}">${escape(edge.label)}</text>` : '';
    }).join('');
    return `<svg class="ws-diagram" viewBox="0 0 740 220" role="img" aria-label="${escape(nodes.map(node => node.label).join(', '))}">${line}${edges}${nodes.map(node => `<g><rect x="${node.x * 7.4 - 38}" y="${node.y * 2.2 - 17}" width="76" height="34" rx="12" fill="#e1f5f0" stroke="#167b67"/><text x="${node.x * 7.4}" y="${node.y * 2.2 + 5}" text-anchor="middle">${escape(node.label)}</text></g>`).join('')}</svg>`;
  }
  function render(doc, { rootId = 'print-area', interactive = false, answers = {}, showAnswers = false } = {}) {
    doc = normalize(doc);
    const response = (item, key) => {
      const choices = item.options.length ? `<div class="ws-choices">${item.options.map((option, i) => interactive ? `<label><input type="radio" name="${key}-choice" data-ws-answer="${key}-choice" value="${i}" ${answers[`${key}-choice`] === String(i) ? 'checked' : ''}> ${escape(option)}</label>` : `<span>□ ${escape(option)}</span>`).join('')}</div>` : '';
      const lines = interactive ? `<label class="ws-answer-label">Bài làm<textarea data-ws-answer="${key}-written" rows="${Math.max(2, item.lines || 2)}">${escape(answers[`${key}-written`] || '')}</textarea></label><canvas class="ws-drawing" width="1000" height="260" data-ws-drawing="${key}-drawing" aria-label="Viết hoặc vẽ bài làm bằng bút cho ${escape(key)}"></canvas><button type="button" class="ws-clear-drawing" data-clear-drawing="${key}-drawing">Xóa nét bút của bài này</button>` : Array.from({ length: item.lines }, () => '<div class="ws-writing-line"></div>').join('');
      return choices + lines + (showAnswers && item.answer ? `<p class="ws-teacher-answer">Đáp án giáo viên: ${escape(item.answer)}</p>` : '');
    };
    return `<section id="${escape(rootId)}" class="exam-print ws-paper ws-theme-${doc.theme}" data-decoration="${doc.decoration}" aria-label="Nội dung phiếu học tập">${doc.pages.map((page, p) => `<div class="ws-page ws-source-group" data-new-page="${page.startNewPage}">${p === 0 ? `<header class="ws-paper-header"><h1>${escape(doc.title)}</h1>${doc.topic || doc.lesson ? `<p class="ws-paper-context">${[doc.topic, doc.lesson].filter(Boolean).map(escape).join(' · ')}</p>` : ''}<div class="ws-student-info"><span>Họ và tên: ........................................</span><span>Lớp: ........</span><span>Ngày: ........................</span></div></header>` : ''}${!page.hideTitle && page.title ? `<h2 class="ws-group-title">${escape(page.title)}</h2>` : ''}${page.blocks.map((block, b) => {
      const key = `p${p}-b${b}`;
      const layout = block.tableLayout;
      const cols = root.WorksheetLayout ? root.WorksheetLayout.allocate(layout.columns, block.columns.length, 178, layout.equalColumns) : block.columns.map(() => ({value:178/block.columns.length}));
      const heights = root.WorksheetLayout ? root.WorksheetLayout.allocate(layout.rows, block.rows.length+1, layout.height, layout.equalRows) : [];
      const table = block.kind === 'table' ? `<div class="ws-table-wrap"><table><colgroup>${cols.map(size => `<col style="width:${size.value/178*100}%">`).join('')}</colgroup><thead><tr style="height:${heights[0]?.value || 0}mm">${block.columns.map(col => `<th>${escape(col)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row, r) => `<tr style="height:${heights[r+1]?.value || 0}mm">${block.columns.map((_, c) => `<td>${interactive && !String(row[c] || '').trim() ? inline('___', true, `${key}-r${r}c${c}`, answers) : inline(row[c] || '___', interactive, `${key}-r${r}c${c}`, answers)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
      return `<article class="ws-block ws-block-${block.kind}" data-ws-block="${key}"><h3>${inline(block.text, interactive, key, answers)}</h3>${table}${block.visual ? `<img class="ws-visual" src="${block.visual}" alt="${escape(block.text || 'Hình minh họa của bài')}">` : block.kind === 'diagram' ? diagramHTML(block.diagram) : ''}${block.parts.map((part, i) => `<section class="ws-part"><p><strong>${escape(part.label)}</strong> ${inline(part.text, interactive, `${key}-part${i}`, answers)}</p>${response(part, `${key}-part${i}`)}</section>`).join('')}${block.kind !== 'text' ? response(block, key) : ''}</article>`;
    }).join('')}</div>`).join('')}</section>`;
  }
  const api = { normalize, escape, isFreeform, fromRecord, toRecord, publicDocument, render };
  root.WorksheetDocument = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
