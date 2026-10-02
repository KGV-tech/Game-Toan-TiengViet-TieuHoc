/* Tổ/Nhóm are Admin-owned drafts on this browser, never Supabase records. */
Object.assign(app.admin, {
    getStudentDraftStore() {
        if (!this.isAdminUser()) return null;
        const owner = app.data.currentUser?.id || app.data.currentUser?.username;
        if (!owner) return null;
        if (this.studentDraftOwner !== owner) {
            this.studentDraftOwner = owner;
            this.studentDraftRecords = [];
            this.studentDraftLoadError = false;
            try {
                const records = JSON.parse(localStorage.getItem(`student-roster-drafts:v1:${owner}`) || '[]');
                if (!Array.isArray(records)) throw new Error('invalid_drafts');
                this.studentDraftRecords = records.filter(record => record && ['sections', 'groups'].includes(record.type)
                    && typeof record.id === 'string' && typeof record.name === 'string' && Array.isArray(record.members))
                    .map(record => ({ id: record.id, type: record.type, name: record.name.slice(0, 80), members: [...new Set(record.members.filter(member => typeof member === 'string'))] }));
            } catch (_) { this.studentDraftLoadError = true; }
        }
        return this.studentDraftRecords;
    },
    saveStudentDraftRecords(records) {
        if (!this.isAdminUser() || !this.getStudentDraftStore() || this.studentDraftLoadError) throw new Error('Không thể đọc bản nháp trên trình duyệt. Chưa lưu thay đổi.');
        try { localStorage.setItem(`student-roster-drafts:v1:${this.studentDraftOwner}`, JSON.stringify(records)); }
        catch (_) { throw new Error('Trình duyệt không cho lưu bản nháp. Hãy kiểm tra dung lượng hoặc quyền lưu trữ.'); }
        this.studentDraftRecords = records;
    },
    matchesStudentDraftFilters(user) {
        const records = this.getStudentDraftStore() || [];
        return [['section', 'sections'], ['group', 'groups']].every(([filter, type]) => {
            const id = this.studentRosterFilters?.[filter];
            return !id || records.some(record => record.id === id && record.type === type && record.members.includes(user.username));
        });
    },
    populateStudentDraftFilters() {
        const records = this.getStudentDraftStore() || [];
        for (const [id, type, filter, label] of [['admin-roster-filter-team', 'sections', 'section', 'tổ'], ['admin-roster-filter-group', 'groups', 'group', 'nhóm']]) {
            const select = document.getElementById(id);
            if (!select) continue;
            select.replaceChildren(new Option(`Tất cả ${label}`, ''), ...records.filter(record => record.type === type).map(record => new Option(record.name, record.id)));
            select.value = this.studentRosterFilters?.[filter] || '';
        }
    },
    syncStudentRosterNavigation() {
        const tab = this.studentRosterTab || 'players';
        for (const key of ['players', 'sections', 'groups', 'pending']) {
            const button = document.getElementById(`btn-sub-${key}`);
            if (button) {
                button.setAttribute('aria-selected', String(tab === key));
                button.className = `roster-mode-button ${tab === key ? 'btn-primary' : 'btn-opt'}`;
            }
        }
        const add = document.getElementById('btn-sub-add');
        if (add) {
            add.hidden = tab === 'pending';
            add.textContent = `＋ ${tab === 'sections' ? 'Thêm tổ mới' : tab === 'groups' ? 'Thêm nhóm mới' : 'Thêm học sinh'}`;
            add.onclick = () => tab === 'players' ? this.showAddPlayerForm() : this.showStudentDraftForm();
        }
    },
    refreshStudentRosterView() {
        // Background roster updates must not discard a form's unsaved selections.
        if (document.querySelector('#admin-subcontent-area .admin-student-draft-form')) return;
        if (['sections', 'groups'].includes(this.studentRosterTab)) this.switchStudentRosterTab(this.studentRosterTab);
        else this.renderPlayersList(this.studentRosterModePending);
    },
    switchStudentRosterTab(type) {
        if (!this.isAdminUser() || !['sections', 'groups'].includes(type)) return;
        // Reuse the roster's existing filter options and criteria in the sidebar.
        this.renderPlayersList(false);
        this.studentRosterTab = type;
        this.studentRosterModePending = false;
        this.syncStudentRosterNavigation();
        const label = type === 'sections' ? 'tổ' : 'nhóm';
        const esc = value => app.data.sanitizeHTML(String(value));
        const filteredUsernames = new Set([...document.querySelectorAll('.admin-student-card')].map(card => card.dataset.studentUsername));
        const filters = this.studentRosterFilters || {};
        const hasFilters = Object.values(filters).some(Boolean);
        const records = (this.getStudentDraftStore() || []).filter(record => record.type === type
            && (!hasFilters || record.members.some(member => filteredUsernames.has(member))));
        const students = (app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false);
        const cards = records.map(record => {
            const members = students.filter(user => record.members.includes(user.username));
            const id = encodeURIComponent(record.id).replace(/'/g, '%27');
            return `<article class="admin-student-draft-card"><h3>${esc(record.name)}</h3><p>${members.length} thành viên</p><ul>${members.map(user => `<li>${esc(user.fullname || user.username)}</li>`).join('')}</ul><footer><button type="button" class="compact-admin-action" onclick="app.admin.showStudentDraftForm(decodeURIComponent('${id}'))">Sửa</button><button type="button" class="compact-admin-action" onclick="app.admin.deleteStudentDraft(decodeURIComponent('${id}'))">Xóa</button></footer></article>`;
        }).join('');
        document.getElementById('admin-subcontent-area').innerHTML = `<section class="admin-student-drafts"><p class="admin-student-draft-note">Bản nháp trên trình duyệt này · chưa đồng bộ Supabase.</p>${this.studentDraftLoadError ? '<p role="alert">Không thể đọc bản nháp đã lưu. Chưa cho phép ghi đè dữ liệu.</p>' : ''}<div class="admin-student-draft-grid">${cards || `<div class="admin-empty-state">Chưa có ${label} phù hợp. Chọn “Thêm ${label} mới” để tạo bản nháp.</div>`}</div></section>`;
    },
    showStudentDraftForm(id = '') {
        if (!this.isAdminUser() || !['sections', 'groups'].includes(this.studentRosterTab)) return;
        const type = this.studentRosterTab;
        const owner = app.data.currentUser?.id || app.data.currentUser?.username;
        const record = (this.getStudentDraftStore() || []).find(item => item.id === id && item.type === type);
        if (id && !record) return;
        const label = type === 'sections' ? 'tổ' : 'nhóm';
        const esc = value => app.data.sanitizeHTML(String(value));
        const students = app.data.sortUsersByVietnameseName((app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false));
        const reserved = new Set((this.getStudentDraftStore() || []).filter(item => item.type === type && item.id !== id).flatMap(item => item.members));
        document.getElementById('admin-subcontent-area').innerHTML = `<form class="admin-student-draft-form"><h3>${id ? 'Sửa' : 'Thêm'} ${label} ${id ? '' : 'mới'}</h3><p class="admin-student-draft-note">Bản nháp chỉ lưu trên trình duyệt này, chưa đồng bộ Supabase.</p><label class="admin-roster-filter-field"><span>Tên ${label}</span><input id="student-draft-name" required maxlength="80" value="${esc(record?.name || '')}"></label><fieldset><legend>Chọn thành viên</legend><div class="admin-student-draft-members">${students.map((user, index) => `<label><input type="checkbox" name="draft-member" value="${index}" ${record?.members.includes(user.username) ? 'checked' : ''} ${reserved.has(user.username) ? 'disabled' : ''}><span>${esc(user.fullname || user.username)} <small>${esc(app.data.getStudentClassLabel(user))}${reserved.has(user.username) ? ` · Đã thuộc ${label} khác` : ''}</small></span></label>`).join('') || '<p>Chưa có học sinh đã duyệt.</p>'}</div></fieldset><p id="student-draft-error" role="alert"></p><footer><button type="button" class="btn-opt" id="student-draft-cancel">Hủy</button><button type="submit" class="btn-success">Lưu bản nháp</button></footer></form>`;
        document.getElementById('student-draft-cancel').onclick = () => { this.switchStudentRosterTab(type); document.getElementById('btn-sub-add')?.focus(); };
        document.querySelector('.admin-student-draft-form').onsubmit = event => {
            event.preventDefault();
            if (!this.isAdminUser() || this.studentRosterTab !== type || (app.data.currentUser?.id || app.data.currentUser?.username) !== owner) return;
            const name = document.getElementById('student-draft-name').value.trim();
            const members = [...document.querySelectorAll('input[name="draft-member"]:checked:not(:disabled)')].map(input => students[Number(input.value)]?.username).filter(Boolean);
            try {
                if (!name || name.length > 80) throw new Error('Nhập tên từ 1 đến 80 ký tự.');
                const current = this.getStudentDraftStore() || [];
                if (current.some(item => item.type === type && item.id !== id && item.name.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) throw new Error(`Tên ${label} đã tồn tại.`);
                if (current.some(item => item.type === type && item.id !== id && members.some(member => item.members.includes(member)))) throw new Error(`Học sinh đã thuộc ${label} khác. Hãy mở lại form để chọn thành viên.`);
                const approved = new Set((app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false).map(user => user.username));
                if (members.some(member => !approved.has(member))) throw new Error('Danh sách học sinh đã thay đổi. Hủy để mở lại form và chọn thành viên hiện tại.');
                const next = { id: id || crypto.randomUUID(), type, name, members };
                this.saveStudentDraftRecords([...current.filter(item => item.id !== id), next]);
                this.switchStudentRosterTab(type);
                document.getElementById('btn-sub-add')?.focus();
            } catch (error) { document.getElementById('student-draft-error').textContent = error.message; }
        };
        document.getElementById('student-draft-name').focus();
    },
    deleteStudentDraft(id) {
        if (!this.isAdminUser()) return;
        const records = this.getStudentDraftStore() || [];
        const record = records.find(item => item.id === id && item.type === this.studentRosterTab);
        if (!record || !confirm(`Xóa bản nháp “${record.name}”? Hồ sơ học sinh vẫn được giữ nguyên.`)) return;
        try {
            this.saveStudentDraftRecords(records.filter(item => item.id !== id));
            this.studentRosterFilters = { ...this.studentRosterFilters, section: '', group: '' };
            this.switchStudentRosterTab(this.studentRosterTab);
            document.getElementById('btn-sub-add')?.focus();
        } catch (error) { alert(error.message); }
    }
});
