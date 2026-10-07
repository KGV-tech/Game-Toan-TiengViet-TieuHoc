const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

// 1. Add worksheetComposerDraft
code = code.replace(/examComposerDraft: null,/, 'examComposerDraft: null,\n        worksheetComposerDraft: null,');

// 2. Modify renderExams to use meta
const renderExamsStart = code.indexOf('renderExams(box) {');
const renderESubTabStart = code.indexOf('renderESubTab(tab, editIdx) {');

let renderExamsBody = code.substring(renderExamsStart, renderESubTabStart);
renderExamsBody = renderExamsBody.replace(/renderExams\(box\) \{[\s\S]+?this\.renderESubTab\('lib'\);\n        \},/, 
        renderExams(box) {
            const isW = this.composerState.module === 'worksheets';
            const mLabel = isW ? 'phiếu học tập' : 'đề kiểm tra';
            const mLabel3 = isW ? 'kho phiếu' : 'kho đề';
            const mId = isW ? 'w' : 'e';
            const fnSubTab = isW ? 'renderWSubTab' : 'renderESubTab';

            box.innerHTML = \
        <section class="exam-workspace" aria-label="Kho \">
          <header class="exam-workspace__header">
            <div>
              <p class="exam-workspace__eyebrow">THƯ VIỆN CỦA BẠN</p>
              <h3>Mỗi \, một hành trình mới</h3>
              <p class="exam-workspace__description">Toàn bộ \ · Tìm nội dung, tiếp tục biên soạn hoặc bắt đầu một \ mới.</p>
            </div>
            <div id="\-count-indicator" class="exam-workspace__count" aria-live="polite"></div>
          </header>
          <div id="\-library-stats" class="exam-library-stats" aria-label="Thống kê toàn bộ \"></div>
          <div class="exam-library-toolbar" aria-label="Tác vụ \">
            <button type="button" class="exam-library-button" id="btn-\-lib" aria-pressed="true" onclick="app.admin.\('lib')">▦ Thư viện \</button>
            <button type="button" class="exam-library-button exam-library-button--primary" id="btn-\-add" onclick="app.admin.\ = null; app.admin.\('add')">＋ Soạn \ mới</button>
            <details class="exam-library-tools">
              <summary>Công cụ Excel</summary>
              <div class="exam-library-tools__items">
                <button type="button" class="exam-library-button" id="btn-\-tpl" onclick="app.admin.\('tpl')">↓ Tải file mẫu .xlsx</button>
                <button type="button" class="exam-library-button" id="btn-\-exp" onclick="app.admin.\('exp')">↗ Xuất \ .xlsx</button>
                <button type="button" class="exam-library-button" id="btn-\-imp" onclick="app.admin.\('imp')">↙ Nhập \ từ .xlsx</button>
              </div>
            </details>
          </div>
          <div id="admin-\-subarea"></div>
        </section>
      \;
            if (isW) this.renderWSubTab('lib');
            else this.renderESubTab('lib');
        },
);

code = code.substring(0, renderExamsStart) + renderExamsBody + code.substring(renderESubTabStart);
fs.writeFileSync('src/main.js', code, 'utf8');
console.log('Modified renderExams');
