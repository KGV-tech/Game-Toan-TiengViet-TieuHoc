;(function (root) {
  const app = root.app;
  const D = root.WorksheetDocument;
  const esc = D.escape;
  const emptyBlock = () => ({ kind: 'question', text: 'Bài mới', lines: 4, answer: '', options: [], parts: [], columns: [], rows: [], diagram: { type: 'nodes', nodes: [], edges: [] }, review: '' });
  const studio = {
    doc: null, files: [], editIndex: undefined, metadata: {}, busy: false,
    client() { return supabaseClient; },
    teacher() { return app.data.currentUser?.role?.toLowerCase() === 'admin'; },
    container() { return document.getElementById('admin-w-subarea'); },
    feedback(message, isError = false) {
      const target = document.getElementById('ws-feedback');
      if (target) { target.textContent = message; target.setAttribute('role', isError ? 'alert' : 'status'); target.classList.toggle('ws-error', isError); }
    },
    openImport() {
      if (!this.teacher()) return;
      const field = id => document.getElementById(`add-w-${id}`)?.value;
      this.metadata = { classlevel: field('class') || 'Lớp 4', subject: field('sub') || 'Toán', period: field('period') || 'Học Kỳ 1' };
      this.doc = null; this.files = []; this.editIndex = undefined;
      if (app.worksheetLocalImport) app.worksheetLocalImport.sourcePages = [];
      this.container().innerHTML = `<section class="ws-studio" aria-label="Tạo phiếu từ ảnh hoặc file"><header><span class="ws-kicker">PHIẾU HỌC TẬP · TỪ TÀI LIỆU</span><h3>Biến bài đã làm thành một phiếu mới</h3><p>Giữ nội dung in sẵn, bỏ nét bút và tạo chỗ trống để học sinh luyện lại. Bạn sẽ kiểm tra từng bài trước khi lưu.</p></header><div class="ws-upload"><label for="ws-source-files">Chọn ảnh hoặc file (có thể chọn nhiều)</label><input id="ws-source-files" type="file" multiple accept="image/jpeg,image/png,image/webp,.pdf,.docx,.txt,.json"><p>JPG, PNG, WebP, PDF, DOCX, TXT hoặc JSON phiếu. Tối đa 12 file, 10 MB/file, tổng 30 MB. DOCX có sơ đồ: nên xuất PDF để giữ hình.</p><p>File được đọc ngay trên thiết bị, không gửi tới OpenAI hoặc dịch vụ OCR. Thư viện nhận diện tiếng Việt chỉ tải khi cần.</p><label>Bộ đọc chữ<select id="ws-ocr-engine"><option value="paddle">PaddleOCR v6 + bộ đọc tiếng Việt</option><option value="tesseract">Tesseract dự phòng</option></select></label><label><input id="ws-remove-color" type="checkbox" checked> Bỏ nét bút màu (tắt khi chữ/hình in sẵn có màu)</label><small>Với bút đen, chọn Làm sạch ảnh để khoanh vùng trước khi đọc. Ảnh nghiêng/chữ mờ cần đối chiếu lại.</small></div><ol id="ws-source-list" class="ws-source-list"></ol><div id="ws-feedback" role="status" aria-live="polite"></div><div class="ws-actions"><button type="button" id="ws-extract">Đọc và dựng phiếu</button><button type="button" id="ws-blank">Soạn phiếu tự do</button><button type="button" id="ws-back">Quay lại soạn phiếu</button></div></section>`;
      app.admin.syncComposerQuestionNav();
      document.getElementById('ws-source-files').addEventListener('change', event => this.selectFiles(event.target.files));
      document.getElementById('ws-extract').onclick = () => this.readFiles();
      document.getElementById('ws-blank').onclick = () => { this.doc = D.normalize({ title: 'Phiếu luyện tập', pages: [{ title: '', blocks: [emptyBlock()] }] }); this.renderEditor(); };
      document.getElementById('ws-back').onclick = () => app.admin.renderWSubTab('add');
    },
    selectFiles(files) {
      const incoming = Array.from(files || []);
      const extensions = /\.(jpe?g|png|webp|pdf|docx|txt|json)$/i;
      if (!incoming.length || incoming.length > 12 || incoming.some(file => !extensions.test(file.name) || file.size > 10 * 1024 * 1024) || incoming.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) {
        this.feedback('Chọn 1–12 file đúng định dạng, tối đa 10 MB/file và tổng 30 MB. File đã chọn trước đó vẫn được giữ.', true); return;
      }
      this.files = incoming.map(file => ({ file, status: 'Chờ đọc', result: null }));
      this.renderFiles(); this.feedback('File theo thứ tự bạn chọn. Có thể sửa thứ tự trang sau khi đọc.');
    },
    renderFiles() {
      const target = document.getElementById('ws-source-list');
      if (target) target.innerHTML = this.files.map(item => `<li><strong>${esc(item.file.name)}</strong><span>${esc(item.status)}</span></li>`).join('');
      if (target) this.files.forEach((item,i)=> {
        if (!/\.(jpe?g|png|webp)$/i.test(item.file.name)) return;
        const button=document.createElement('button');button.type='button';button.textContent='Làm sạch ảnh';
        button.disabled=this.busy;button.onclick=()=>app.worksheetSourceTools.open(i).catch(error=>this.feedback(error.message,true));
        target.children[i].append(button);
      });
    },
    async extract() { throw new Error('Chưa tải được bộ đọc file cục bộ. Hãy tải lại trang.'); },
    async readFiles() {
      if (this.busy || !this.teacher()) return;
      if (!this.files.length) return this.feedback('Hãy chọn ảnh hoặc file trước.', true);
      this.busy = true;
      document.getElementById('ws-extract').disabled = true;
      document.getElementById('ws-source-files').disabled = true;
      document.getElementById('ws-blank').disabled = true;
      document.getElementById('ws-back').disabled = true;
      try {
        for (let i = 0; i < this.files.length; i++) {
          const item = this.files[i];
          if (item.result) continue;
          item.status = 'Đang đọc…'; this.renderFiles(); this.feedback(`Đang đọc file ${i + 1}/${this.files.length}: ${item.file.name}`);
          try {
            const raw = /\.json$/i.test(item.file.name) ? JSON.parse(await item.file.text()) : await this.extract(item.file);
            item.result = D.normalize(raw); item.result.pages.forEach(page => { page.source = item.file.name; }); item.status = 'Đã đọc';
          } catch (error) { item.status = error.message || 'Không đọc được'; }
          this.renderFiles();
        }
        if (this.files.some(item => !item.result)) {
          this.feedback('Có file chưa đọc được. Bấm Đọc để thử lại riêng các file lỗi; các file đã đọc vẫn được giữ.', true);
          const target = document.getElementById('ws-source-list');
          this.files.forEach((item, i) => {
            if (item.result) return;
            const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Bỏ file lỗi';
            button.onclick = () => { const index=this.files.indexOf(item);if(index!==-1)this.files.splice(index, 1);this.renderFiles(); };
            target.children[i].append(button);
          });
          return;
        }
        this.doc = D.normalize({ title: this.files[0].result.title, pages: this.files.flatMap(item => item.result.pages), warnings: this.files.flatMap(item => item.result.warnings) });
        this.renderEditor();
      } catch(error) { this.feedback(error.message, true); } finally {
        this.busy = false;
        ['ws-extract', 'ws-source-files', 'ws-blank', 'ws-back'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = false; });
      }
    },
    edit(record, index) {
      if (!this.teacher()) return;
      this.doc = D.fromRecord(record); this.editIndex = index;
      this.metadata = { id: record.id, classlevel: record.classlevel, subject: record.subject, period: record.period };
      this.renderEditor();
    },
    capture() {
      if (!this.doc) return;
      const title = document.getElementById('ws-title');
      if (!title) return;
      this.doc.topic = document.getElementById('ws-topic').value.trim();
      this.doc.lesson = document.getElementById('ws-lesson').value.trim();
      this.doc.decoration = document.getElementById('ws-decoration').value;
      this.doc.title = title.value; this.doc.theme = document.getElementById('ws-theme').value;
      this.metadata.classlevel = document.getElementById('ws-class').value;
      this.metadata.subject = document.getElementById('ws-subject').value;
      this.metadata.period = document.getElementById('ws-period').value;
      for (const field of this.container().querySelectorAll('[data-ws-field]')) {
        const [p, b, name] = field.dataset.wsField.split(':');
        const block = this.doc.pages[p].blocks[b];
        if (name === 'parts' || name === 'diagram') {
          try {
            const parsed = JSON.parse(field.value || (name === 'parts' ? '[]' : '{}'));
            if (name === 'parts' && !Array.isArray(parsed)) throw new Error();
            if (name === 'diagram' && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) throw new Error();
            block[name] = parsed; field.removeAttribute('aria-invalid');
          } catch (_) { field.setAttribute('aria-invalid', 'true'); field.focus(); throw new Error('Cấu trúc câu con/sơ đồ chưa hợp lệ. Hãy kiểm tra JSON ở trường được đánh dấu.'); }
        } else if (name === 'rows') block.rows = field.value.split('\n').filter(row => row.trim()).map(row => row.split('\t'));
        else if (name === 'columns') block.columns = field.value.split('\t');
        else if (name === 'options') block.options = field.value.split('\n').filter(Boolean);
        else block[name] = name === 'lines' ? Number(field.value) : field.value;
      }
      for (const field of this.container().querySelectorAll('[data-ws-cell]')) {
        const [p,b,r,c]=field.dataset.wsCell.split(':').map(Number);const block=this.doc.pages[p].blocks[b];
        if(r===-1)block.columns[c]=field.value;else block.rows[r][c]=field.value;
      }
      for (const field of this.container().querySelectorAll('[data-ws-part-field]')) {
        const [p,b,i,name]=field.dataset.wsPartField.split(':');
        this.doc.pages[p].blocks[b].parts[i][name]=name==='lines'?Number(field.value):name==='options'?field.value.split('\n').filter(Boolean):field.value;
      }
      for (const field of this.container().querySelectorAll('[data-ws-node-field]')) {
        const [p,b,i,name]=field.dataset.wsNodeField.split(':');
        this.doc.pages[p].blocks[b].diagram.nodes[i][name]=name==='label'?field.value:Number(field.value);
      }
      this.doc.pages.forEach((page, p) => { page.title = document.getElementById(`ws-page-title-${p}`).value; page.startNewPage = this.container().querySelector(`[data-group-break="${p}"]`).checked; });
      this.doc = D.normalize(this.doc);
    },
    renderEditor() {
      const doc = this.doc;
      const field = (label, value, key, rows = 3) => `<label>${label}<textarea rows="${rows}" data-ws-field="${key}">${esc(value)}</textarea></label>`;
      this.container().innerHTML = `<section class="ws-studio" aria-label="Hiệu chỉnh phiếu từ tài liệu"><header><span class="ws-kicker">RÀ SOÁT NỘI DUNG</span><h3>Phiếu của bạn, từng bài một</h3><p>Không bắt buộc đáp án hoặc số câu. Đối chiếu bản gốc và kiểm tra các ô từng có nét bút trước khi giao học sinh.</p></header><div class="ws-meta"><label>Tên phiếu<input id="ws-title" value="${esc(doc.title)}" required></label><label>Cấp lớp<select id="ws-class">${[1,2,3,4,5].map(n => `<option ${this.metadata.classlevel === `Lớp ${n}` ? 'selected' : ''}>Lớp ${n}</option>`).join('')}</select></label><label>Môn<select id="ws-subject">${['Toán','Tiếng Việt'].map(s => `<option ${this.metadata.subject === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Thời gian<select id="ws-period">${['Học Kỳ 1','Học Kỳ 2','Cả Năm'].map(s => `<option ${this.metadata.period === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Chủ đề (tùy chọn)<input id="ws-topic" value="${esc(doc.topic)}" maxlength="500"></label><label>Bài học (tùy chọn)<input id="ws-lesson" value="${esc(doc.lesson)}" maxlength="500"></label><label>Mẫu header/footer<select id="ws-decoration">${[['none','Không trang trí'],['leaves','Vườn lá'],['stars','Ngôi sao'],['rainbow','Cầu vồng'],['pencils','Bút chì'],['geometry','Hình vui']].map(([id,name]) => `<option value="${id}" ${doc.decoration === id ? 'selected' : ''}>${name}</option>`).join('')}</select></label><label>Màu bản in<select id="ws-theme">${[['mint','Vườn xanh'],['sky','Bầu trời'],['sun','Nắng ấm']].map(([id,name]) => `<option value="${id}" ${doc.theme === id ? 'selected' : ''}>${name}</option>`).join('')}</select></label></div>${doc.warnings.length ? `<aside class="ws-review"><strong>Cần đối chiếu bản gốc</strong><ul>${doc.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></aside>` : ''}<div class="ws-editor-pages">${doc.pages.map((page,p) => `<section class="ws-editor-page"><div class="ws-page-heading"><label>Tiêu đề nhóm ${p+1} (tùy chọn)<input id="ws-page-title-${p}" value="${esc(page.title)}" ${page.hideTitle ? 'disabled' : ''}></label><button type="button" data-toggle-title="${p}">${page.hideTitle ? 'Thêm tiêu đề' : 'Xóa tiêu đề'}</button><button type="button" data-page-up="${p}" ${p ? '' : 'disabled'}>Nhóm lên</button><label class="ws-inline-check"><input type="checkbox" data-group-break="${p}" ${page.startNewPage ? 'checked' : ''}> Nhóm bắt đầu trang mới</label><button type="button" data-add-block="${p}">Thêm bài</button></div>${page.blocks.map((block,b) => `<article class="ws-editor-block"><div class="ws-block-heading"><strong>Bài ${b+1}</strong><select aria-label="Dạng nội dung bài ${b+1}" data-ws-field="${p}:${b}:kind">${D.contentKinds.map(([id,label]) => `<option value="${id}" ${block.kind === id ? 'selected' : ''}>${label}</option>`).join('')}</select><button type="button" data-up="${p}:${b}" ${b ? '' : 'disabled'}>Lên</button><button type="button" data-remove="${p}:${b}">Xóa bài</button></div>${block.review ? `<p class="ws-review">${esc(block.review)}</p>` : ''}${field('Nội dung in sẵn (___ là chỗ trống)', block.text, `${p}:${b}:text`)}<div class="ws-two-columns">${field('Lựa chọn (mỗi dòng một lựa chọn)', block.options.join('\n'), `${p}:${b}:options`)}${field('Đáp án dành riêng cho giáo viên (không bắt buộc)', block.answer, `${p}:${b}:answer`)}</div><label>Số dòng chấm để học sinh viết<input type="number" min="0" max="20" value="${block.lines}" data-ws-field="${p}:${b}:lines"></label><details ${block.kind === 'table' ? 'open' : ''}><summary>Bảng (ô có nét bút: thay bằng ___)</summary>${field('Tên cột, ngăn cách bằng Tab', block.columns.join('\t'), `${p}:${b}:columns`, 2)}${field('Mỗi dòng là một hàng; ô ngăn cách bằng Tab', block.rows.map(row => row.join('\t')).join('\n'), `${p}:${b}:rows`, 6)}</details><details ${block.parts.length ? 'open' : ''}><summary>Câu con / sơ đồ nâng cao</summary><p>Đổi text, label, lines, options hoặc answer của từng câu con. Có thể có bất kỳ số câu con nào.</p>${field('Câu con (JSON)', JSON.stringify(block.parts, null, 2), `${p}:${b}:parts`, 8)}${field('Sơ đồ (JSON: nodes, edges, type)', JSON.stringify(block.diagram, null, 2), `${p}:${b}:diagram`, 5)}</details></article>`).join('')}</section>`).join('')}</div><div id="ws-feedback" role="status" aria-live="polite"></div><div class="ws-actions"><button type="button" id="ws-save">Lưu phiếu học tập</button><button type="button" id="ws-preview">Xem bản in màu</button><button type="button" id="ws-add-group">Thêm Nhóm</button><button type="button" id="ws-library">Về Kho Phiếu</button></div><div id="ws-preview-area"></div></section>`;
      const mutate = callback => {
        const active=document.activeElement;
        const focusKey=active?.dataset.wsField ? ['data-ws-field',active.dataset.wsField] : active?.dataset.wsPartField ? ['data-ws-part-field',active.dataset.wsPartField] : null;
        let before;
        try { this.capture();before=JSON.parse(JSON.stringify(this.doc));callback();this.renderEditor(); }
        catch(error) { if(before){this.doc=before;this.renderEditor();}this.feedback(error.message,true); }
        if(focusKey) this.container().querySelector(`[${focusKey[0]}="${focusKey[1]}"]`)?.focus();
      };
      app.admin.syncComposerQuestionNav();
      this.friendlyStructureControls(mutate);
      this.questionTypeControls();
      this.container().querySelectorAll('select[data-ws-field],select[data-ws-part-field]').forEach(field=>field.onchange=()=>mutate(()=>{}));
      this.container().querySelectorAll('[data-group-break]').forEach(field => field.onchange = () => mutate(() => { this.doc.pages[Number(field.dataset.groupBreak)].startNewPage = field.checked; }));
      this.container().querySelectorAll('[data-toggle-title]').forEach(btn => btn.onclick = () => mutate(() => { const page = this.doc.pages[Number(btn.dataset.toggleTitle)]; page.hideTitle = !page.hideTitle; if (page.hideTitle) page.title = ''; }));
      if (app.worksheetLocalImport?.sourcePages.length) {
        const sourceBox=document.createElement('details');sourceBox.className='ws-source-review';sourceBox.innerHTML='<summary>Đối chiếu bản gốc / giữ hình minh họa</summary><p>File nguồn chỉ còn trên thiết bị trong phiên này. Chọn trang để xem, làm sạch và cắt vùng hình.</p>';
        app.worksheetLocalImport.sourcePages.forEach(source=>{const btn=document.createElement('button');btn.type='button';btn.textContent=source.name;btn.onclick=()=>app.worksheetSourceTools.show(source);sourceBox.append(btn);});
        this.container().querySelector('.ws-meta').after(sourceBox);
      }
      this.container().querySelectorAll('[data-add-block]').forEach(btn => btn.onclick = () => mutate(() => this.doc.pages[btn.dataset.addBlock].blocks.push(emptyBlock())));
      this.container().querySelectorAll('[data-remove]').forEach(btn => btn.onclick = () => mutate(() => { const [p,b] = btn.dataset.remove.split(':'); this.doc.pages[p].blocks.splice(Number(b),1); }));
      this.container().querySelectorAll('[data-up]').forEach(btn => btn.onclick = () => mutate(() => { const [p,b] = btn.dataset.up.split(':').map(Number); const blocks = this.doc.pages[p].blocks; [blocks[b-1],blocks[b]] = [blocks[b],blocks[b-1]]; }));
      this.container().querySelectorAll('[data-page-up]').forEach(btn => btn.onclick = () => mutate(() => { const p = Number(btn.dataset.pageUp); [this.doc.pages[p-1],this.doc.pages[p]] = [this.doc.pages[p],this.doc.pages[p-1]]; }));
      document.getElementById('ws-add-group').onclick = () => mutate(() => { if(this.doc.pages.length>=40)throw new Error('Phiếu tối đa 40 nhóm.');this.doc.pages.push({ title: '', hideTitle:false, startNewPage:false, blocks: [emptyBlock()] }); });
      document.getElementById('ws-preview').onclick = () => this.preview();
      document.getElementById('ws-save').onclick = () => this.save();
      document.getElementById('ws-library').onclick = () => { if (confirm('Về Kho Phiếu? Nội dung chưa lưu sẽ chỉ còn trong phiên này.')) app.admin.renderWSubTab('lib'); };

    },
    questionTypeControls() {
      const configure = (kind, options, answer) => {
        const hints = {trueFalse:'Chọn Đúng hoặc Sai. Đáp án giáo viên: Đúng hoặc Sai.',compare:'Chọn <, > hoặc =. Đáp án giáo viên: <, > hoặc =.',fill:'Dùng ___ tại mỗi vị trí cần điền.',sequence:'Dùng ___ tại số còn thiếu trong chuỗi.',drag:'Dùng ___ tại chỗ cần điền; mỗi dòng lựa chọn là một từ để chọn.',matching:'Dòng 1: các mục cột trái, ngăn bằng dấu phẩy. Dòng 2: các mục cột phải, ngăn bằng dấu phẩy.'};
        options.closest('label').hidden = ['trueFalse','compare','fill','sequence','text'].includes(kind);
        options.placeholder = kind === 'matching' ? 'Mèo, Chó\nMeo meo, Gâu gâu' : 'Mỗi dòng một lựa chọn';
        answer.placeholder = kind === 'trueFalse' ? 'Đúng hoặc Sai' : kind === 'compare' ? '<, > hoặc =' : 'Đáp án giáo viên (tùy chọn)';
        if(hints[kind]) { const hint=document.createElement('p');hint.className='ws-type-hint';hint.textContent=hints[kind];options.closest('label').parentElement.before(hint); }
      };
      this.doc.pages.forEach((page,p)=>page.blocks.forEach((block,b)=>{
        configure(block.kind,this.container().querySelector(`[data-ws-field="${p}:${b}:options"]`),this.container().querySelector(`[data-ws-field="${p}:${b}:answer"]`));
        block.parts.forEach((part,i)=>configure(part.kind,this.container().querySelector(`[data-ws-part-field="${p}:${b}:${i}:options"]`),this.container().querySelector(`[data-ws-part-field="${p}:${b}:${i}:answer"]`)));
      }));
    },
    friendlyStructureControls(mutate) {
      this.doc.pages.forEach((page,p)=>page.blocks.forEach((block,b)=> {
        const tableArea=this.container().querySelector(`[data-ws-field="${p}:${b}:columns"]`).closest('details');
        tableArea.innerHTML=`<summary>Bảng: sửa từng ô</summary><p>Dùng ___ cho ô cần học sinh điền. Đáp án viết tay ở bản gốc phải thay bằng chỗ trống.</p><div class="ws-table-wrap"><table class="ws-edit-table"><thead><tr>${block.columns.map((column,c)=>`<th><textarea rows="3" data-ws-cell="${p}:${b}:-1:${c}" aria-label="Tên cột ${c+1}">${esc(column)}</textarea></th>`).join('')}</tr></thead><tbody>${block.rows.map((row,r)=>`<tr>${block.columns.map((_,c)=>`<td><textarea rows="3" data-ws-cell="${p}:${b}:${r}:${c}" aria-label="Hàng ${r+1}, cột ${c+1}">${esc(row[c]||'')}</textarea></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="ws-actions"><button type="button" data-add-row>Thêm hàng</button><button type="button" data-add-col>Thêm cột</button><button type="button" data-remove-row ${block.rows.length?'':'disabled'}>Bỏ hàng cuối</button><button type="button" data-remove-col ${block.columns.length?'':'disabled'}>Bỏ cột cuối</button></div>`;
        tableArea.querySelector('[data-add-col]').onclick=()=>mutate(()=>{block=this.doc.pages[p].blocks[b];block.columns.push('Cột mới');block.rows.forEach(row=>row.push('___'));});
        tableArea.querySelector('[data-add-row]').onclick=()=>mutate(()=>{block=this.doc.pages[p].blocks[b];if(!block.columns.length)block.columns=['Cột 1','Cột 2'];block.rows.push(block.columns.map(()=>'___'));});
        tableArea.querySelector('[data-remove-row]').onclick=()=>mutate(()=>this.doc.pages[p].blocks[b].rows.pop());
        tableArea.querySelector('[data-remove-col]').onclick=()=>mutate(()=>{const block=this.doc.pages[p].blocks[b];block.columns.pop();block.rows.forEach(row=>row.pop());});
        this.tableSizing(tableArea, p, b, mutate);
        const partsArea=this.container().querySelector(`[data-ws-field="${p}:${b}:parts"]`).closest('details');
        partsArea.innerHTML=`<summary>Câu con và nhãn sơ đồ</summary>${block.parts.map((part,i)=>`<section class="ws-part-editor"><label>Loại câu con<select data-ws-part-field="${p}:${b}:${i}:kind">${D.questionKinds.map(([id,label])=>`<option value="${id}" ${part.kind===id?'selected':''}>${label}</option>`).join('')}</select></label><label>Nhãn câu con<input data-ws-part-field="${p}:${b}:${i}:label" value="${esc(part.label)}"></label><label>Nội dung câu con<textarea data-ws-part-field="${p}:${b}:${i}:text">${esc(part.text)}</textarea></label><label>Đáp án giáo viên (tùy chọn)<textarea data-ws-part-field="${p}:${b}:${i}:answer">${esc(part.answer)}</textarea></label><label>Lựa chọn, mỗi dòng một lựa chọn<textarea data-ws-part-field="${p}:${b}:${i}:options">${esc(part.options.join('\n'))}</textarea></label><label>Dòng chấm<input type="number" min="0" max="20" data-ws-part-field="${p}:${b}:${i}:lines" value="${part.lines}"></label><button type="button" data-remove-part="${i}">Bỏ câu con này</button></section>`).join('')}<button type="button" data-add-part>Thêm câu con</button><h4>Nhãn trong sơ đồ</h4>${block.diagram.nodes.map((node,i)=>`<div class="ws-node-editor"><label>Nhãn<input data-ws-node-field="${p}:${b}:${i}:label" value="${esc(node.label)}"></label><label>Vị trí ngang (%)<input type="number" min="5" max="95" data-ws-node-field="${p}:${b}:${i}:x" value="${node.x}"></label><label>Vị trí dọc (%)<input type="number" min="10" max="90" data-ws-node-field="${p}:${b}:${i}:y" value="${node.y}"></label></div>`).join('')}<button type="button" data-add-node>Thêm nhãn sơ đồ</button>`;
        partsArea.querySelector('[data-add-part]').onclick=()=>mutate(()=>this.doc.pages[p].blocks[b].parts.push({label:`${String.fromCharCode(97+this.doc.pages[p].blocks[b].parts.length)})`,text:'',answer:'',lines:2,options:[]}));
        partsArea.querySelectorAll('[data-remove-part]').forEach(btn=>btn.onclick=()=>mutate(()=>this.doc.pages[p].blocks[b].parts.splice(Number(btn.dataset.removePart),1)));
        partsArea.querySelector('[data-add-node]').onclick=()=>mutate(()=>this.doc.pages[p].blocks[b].diagram.nodes.push({label:'Nhãn mới',x:50,y:50}));
      }));
    },
    async preview() {
      const button=document.getElementById('ws-preview');
      button.disabled=true;
      try {
        this.capture();
        const area=document.getElementById('ws-preview-area');
        area.innerHTML=`<div class="ws-preview-toolbar"><strong>Xem trước A4 · 210 × 297 mm</strong><label>Thu phóng<select id="ws-preview-zoom"><option value=".5">50%</option><option value=".75" selected>75%</option><option value="1">100%</option></select></label></div><div class="ws-preview-shell">${D.render(this.doc,{rootId:'ws-color-preview'})}</div>`;
        const paper=document.getElementById('ws-color-preview');
        await root.WorksheetLayout.paginate(paper);
        document.getElementById('ws-preview-zoom').onchange=event=>paper.style.setProperty('--ws-preview-scale',event.target.value);
        this.feedback(`Đã dựng ${paper.children.length} trang A4. Bản PDF dùng cùng bố cục này.`);
      } catch(error) { document.getElementById('ws-preview-area').replaceChildren();this.feedback(error.message,true); }
      finally { if(button.isConnected)button.disabled=false; }
    },
    tableSizing(area,p,b,mutate) {
      const block=this.doc.pages[p].blocks[b];if(!block.columns.length)return;
      const L=root.WorksheetLayout, layout=block.tableLayout;
      layout.columns=L.allocate(layout.columns,block.columns.length,L.WIDTH,layout.equalColumns);
      layout.rows=L.allocate(layout.rows,block.rows.length+1,layout.height,layout.equalRows);
      const box=document.createElement('details');box.className='ws-table-sizing';box.open=true;box.innerHTML=`<summary>Kích thước bảng (mm)</summary><p>Cột vừa vùng in ${L.WIDTH} mm. Khi sửa một kích thước, phần còn lại chia cho cột/dòng chưa cố định. Chiều cao thực tế còn phụ thuộc chữ trong ô.</p><label>Chiều cao bảng (mm)<input type="number" data-table-height min="20" max="200" value="${layout.height}"></label>${[['columns','Cột','equalColumns'],['rows','Dòng','equalRows']].map(([axis,label,key])=>`<fieldset><legend>${label}</legend><label class="ws-inline-check"><input type="checkbox" data-size-equal="${key}" ${layout[key]?'checked':''}> Tự chia đều ${label.toLowerCase()}</label><div class="ws-size-grid">${layout[axis].map((size,i)=>`<div><label>${axis==='rows'&&i===0?'Dòng tiêu đề':`${label} ${axis==='rows'?i:i+1}`} (mm)<input type="number" min="1" step=".1" data-size-axis="${axis}" data-size-index="${i}" value="${Number(size.value.toFixed(2))}"></label><label class="ws-inline-check"><input type="checkbox" data-size-lock="${axis}:${i}" ${size.locked?'checked':''}> Cố định ${label.toLowerCase()} ${axis==='rows'?i:i+1}</label></div>`).join('')}</div></fieldset>`).join('')}`;
      area.append(box);
      box.querySelector('[data-table-height]').onchange=event=>mutate(()=>{const current=this.doc.pages[p].blocks[b].tableLayout;const height=Number(event.target.value);if(height<20||height>200)throw new Error('Chiều cao bảng từ 20 đến 200 mm.');current.rows=L.allocate(current.rows,current.rows.length,height,true);current.height=height;});
      box.querySelectorAll('[data-size-axis]').forEach(field=>field.onchange=()=>mutate(()=>{const current=this.doc.pages[p].blocks[b].tableLayout,axis=field.dataset.sizeAxis;current[axis]=L.resize(current[axis],Number(field.dataset.sizeIndex),field.value,axis==='columns'?L.WIDTH:current.height);current[axis==='columns'?'equalColumns':'equalRows']=false;}));
      box.querySelectorAll('[data-size-lock]').forEach(field=>field.onchange=()=>mutate(()=>{const [axis,i]=field.dataset.sizeLock.split(':');this.doc.pages[p].blocks[b].tableLayout[axis][i].locked=field.checked;}));
      box.querySelectorAll('[data-size-equal]').forEach(field=>field.onchange=()=>mutate(()=>{const current=this.doc.pages[p].blocks[b].tableLayout,key=field.dataset.sizeEqual,axis=key==='equalColumns'?'columns':'rows';current[key]=field.checked;current[axis]=L.allocate(current[axis],current[axis].length,axis==='columns'?L.WIDTH:current.height,field.checked);}));
    },
    async save() {
      if (this.busy || !this.teacher()) return;
      const btn = document.getElementById('ws-save');
      this.busy = true; btn.disabled = true;
      try {
        this.capture();
        if (!this.doc.title.trim()) throw new Error('Hãy đặt tên phiếu học tập.');
        const record = D.toRecord(this.doc, this.metadata);
        if (this.editIndex !== undefined) app.data.worksheets[this.editIndex] = record;
        else { this.editIndex = app.data.worksheets.length; app.data.worksheets.push(record); }
        const error = await app.data.saveWorksheets();
        this.metadata.id = record.id;
        const locallySaved=app.data.loadLocalWorksheets().some(item=>app.data.getExamContentKey(item)===app.data.getExamContentKey(record));
        if(!locallySaved&&(error||!window.supabase))throw new Error('Thiết bị chưa lưu được phiếu (có thể hết dung lượng). Nội dung vẫn ở đây; hãy giữ nguyên trang và thử lưu lại.');
        if (error) { this.feedback(app.admin.getExamSyncErrorMessage(error,true),true); return; }
        app.admin.renderWSubTab('lib');
      } catch(error) { this.feedback(error.message,true); }
      finally { this.busy = false; if(btn.isConnected) btn.disabled=false; }
    }
  };
  app.worksheetStudio = studio;
})(globalThis);
