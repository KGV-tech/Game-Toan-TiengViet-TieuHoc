// D1: app.ui — tiện ích UI (nút, bảng, filter, xuất Excel) tách khỏi main.js.
;(function (root) {
    if (!root.app) root.app = {};
    const app = root.app;
    app.ui = {
        setButtonLoading(buttonId, isLoading, loadingLabel = 'Vui lòng chờ…') {
            const button = document.getElementById(buttonId);
            if (!button) return;
            if (isLoading) {
                if (!button.dataset.originalLabel) button.dataset.originalLabel = button.innerHTML;
                button.disabled = true;
                button.setAttribute('aria-busy', 'true');
                button.classList.add('button-loading');
                button.innerHTML = `<span class="button-loading__spinner" aria-hidden="true"></span><span>${app.data.sanitizeHTML(loadingLabel)}</span>`;
                return;
            }
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.classList.remove('button-loading');
            if (button.dataset.originalLabel) {
                button.innerHTML = button.dataset.originalLabel;
                delete button.dataset.originalLabel;
            }
        },
        assetButton(group, asset, label, onClick, className = '') {
            return `<button class="asset-button asset-button--utility ${className}" onclick="${onClick}" aria-label="${label}">
                <img src="./public/ui/buttons/${group}/${asset}.png" alt="" aria-hidden="true">
            </button>`;
        },
        compactAction(label, onClick, variant = '') {
            return `<button class="action-btn compact-admin-action ${variant}" onclick="${onClick}">${label}</button>`;
        },
        renderTabs(tabData, currentTabId, onClickFnString) {
            let html = '';
            tabData.forEach(t => {
                const activeCls = t.id === currentTabId ? 'active' : '';
                html += `<button class="tab-btn ${activeCls}" onclick="${onClickFnString}('${t.id}')">${t.label}</button>`;
            });
            document.getElementById('admin-tabs').innerHTML = html;
            document.getElementById('admin-tabs').style.display = 'flex';
        },
        renderTable(cols, data, rowRenderer, emptyMsg = "Không có dữ liệu") {
            if (!data || data.length === 0) return `<p style="text-align:center; padding: 20px;">${emptyMsg}</p>`;

            let html = `<table class="data-table"><thead><tr>`;
            cols.forEach(c => {
                html += `<th>${c.label}</th>`;
            });
            html += `</tr><tr>`;
            cols.forEach((c, idx) => {
                if (c.filterable) {
                    html += `<th><input type="text" class="filter-input" data-col="${idx}" placeholder="Tìm kiếm..." onkeyup="app.ui.filterTable(this)"></th>`;
                } else {
                    html += `<th></th>`;
                }
            });
            html += `</tr></thead><tbody>`;
            data.forEach((row, i) => {
                html += rowRenderer(row, i);
            });
            html += `</tbody></table>`;
            return html;
        },
        filterTable(inputEl) {
            const table = inputEl.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            // Calculate all filters
            const filterInputs = table.querySelectorAll('.filter-input');
            const filters = [];
            filterInputs.forEach(inp => {
                if (inp.value.trim() !== '') {
                    filters.push({ col: parseInt(inp.getAttribute('data-col')), val: inp.value.trim().toLowerCase() });
                }
            });

            let visibleCount = 0;
            rows.forEach(r => {
                let match = true;
                for (let f of filters) {
                    const cell = r.children[f.col];
                    if (!cell || !cell.textContent.toLowerCase().includes(f.val)) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    r.style.display = '';
                    visibleCount++;
                } else {
                    r.style.display = 'none';
                }
            });

            if (table.closest('#admin-q-subarea')) {
                const ind = document.getElementById('q-count-indicator');
                if (ind) {
                    if (filters.length === 0) ind.textContent = `Tổng: ${rows.length} câu`;
                    else ind.textContent = `Lọc: ${visibleCount}/${rows.length} câu`;
                }
            } else if (table.closest('#admin-e-subarea')) {
                const ind = document.getElementById('e-count-indicator');
                if (ind) {
                    if (filters.length === 0) ind.textContent = `Tổng: ${rows.length} đề`;
                    else ind.textContent = `Lọc: ${visibleCount}/${rows.length} đề`;
                }
            }
        },
        showHistoryDetails(btn) {
            const recordStr = decodeURIComponent(btn.getAttribute('data-record'));
            const record = JSON.parse(recordStr);
            let html = `<div style="text-align:left;">
        <h3 style="margin-bottom: 15px;">Chi tiết: ${record.title}</h3>
        <p><strong>Ngày làm:</strong> ${record.date} | <strong>Điểm:</strong> ${record.score}</p>
        <hr style="border-color: rgba(255,255,255,0.2); margin: 15px 0;">
        <div class="scroll-box" style="max-height: 400px; padding-right: 10px;">
      `;
            if (record.details && record.details.length > 0) {
                record.details.forEach((d, i) => {
                    const isOk = d.isCorrect;
                    const color = isOk ? '#4ade80' : '#f87171';
                    html += `<div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; border-left: 5px solid ${color};">
              <p style="margin-bottom: 5px;"><strong>Câu ${i + 1}:</strong> ${d.q}</p>
              <p style="margin-bottom: 5px; color: #ccc;">Đã chọn: <span style="color:${color}">${d.userAns}</span></p>
              ${!isOk ? `<p style="margin-bottom: 0; color: #4ade80;">Đáp án đúng: ${d.correctAns}</p>` : ''}
           </div>`;
                });
            } else {
                html += `<p>Không có dữ liệu chi tiết cho bài làm này.</p>`;
            }
            html += `</div></div>`;

            const box = document.getElementById('treasure-content-area');
            box.innerHTML = html + `<br><button class="btn-primary" onclick="app.treasure.switchTab('history')">Quay lại</button>`;
        },
        async exportToExcel(dataArray, filename) {
            if (!window.XLSX) {
                alert("Đang tải thư viện Excel, vui lòng chờ...");
                const loaded = await app.utils.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
                if (!loaded) return alert("Thư viện Excel chưa được tải! Kiểm tra lại kết nối mạng.");
            }
            const ws = XLSX.utils.json_to_sheet(dataArray);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, filename);
        },
        async importFromExcel(file, callback) {
            if (!window.XLSX) {
                alert("Đang tải thư viện Excel, vui lòng chờ...");
                const loaded = await app.utils.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
                if (!loaded) return alert("Thư viện Excel chưa được tải! Kiểm tra lại kết nối mạng.");
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws, { raw: false });
                callback(json);
            };
            reader.readAsArrayBuffer(file);
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
