/* Tổ UI, class selectors and shared roster predicates. */
Object.assign(app.admin, {
    studentClassKey(user) { return JSON.stringify([app.data.normalizeClassLevel(user.classlevel), app.data.normalizeClassName(user.className ?? user.class_name)]); },
    studentClassChoices() {
        const classes = new Map();
        for (const user of app.data.users || []) {
            if (user.role?.toLowerCase() === 'admin' || user.approved === false) continue;
            const classlevel = app.data.normalizeClassLevel(user.classlevel);
            if (/^[1-5]$/.test(classlevel)) classes.set(this.studentClassKey(user), { classlevel, className: app.data.normalizeClassName(user.className ?? user.class_name) });
        }
        return [...classes].sort((a, b) => a[0].localeCompare(b[0], 'vi', { numeric: true }));
    },
    classroomClassOptions(selected = '') {
        return this.studentClassChoices().map(([key, cls]) => `<option value="${app.data.sanitizeHTML(key)}" ${key === selected ? 'selected' : ''}>${app.data.sanitizeHTML(cls.className ? `Lớp ${cls.className}` : `Cấp lớp ${cls.classlevel} · chưa phân lớp`)}</option>`).join('');
    },
    getStudentDraftStore() { return this.isAdminUser() ? app.classroom.activate().sections : []; },
    sectionClass(record) {
        if (record.classlevel) return { classlevel: record.classlevel, className: record.className || '' };
        const users = (app.data.users || []).filter(user => record.members?.includes(user.username));
        const keys = [...new Set(users.map(user => this.studentClassKey(user)))];
        if (keys.length !== 1) return { classlevel: '', className: '' };
        const [classlevel, className] = JSON.parse(keys[0]);
        return { classlevel, className };
    },
    matchesStudentDraftFilters(user) {
        const id = this.studentRosterFilters?.section;
        return !id || this.getStudentDraftStore().some(record => record.id === id && record.members.includes(user.username));
    },
    matchesStudentRosterFilters(user, filters = this.studentRosterFilters || {}) {
        const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi').trim();
        const level = app.data.normalizeClassLevel(user.classlevel), name = app.data.normalizeClassName(user.class_name);
        if (filters.classlevel && level !== filters.classlevel) return false;
        if (filters.className === '__unassigned__' && name) return false;
        if (filters.className && filters.className !== '__unassigned__' && name !== filters.className) return false;
        if (filters.gender && user.gender !== filters.gender) return false;
        if (!this.matchesStudentDraftFilters(user)) return false;
        return !filters.search || normalize([user.fullname, user.username, level, name, app.data.genderLabel?.(user.gender)].join(' ')).includes(normalize(filters.search));
    },
    populateStudentDraftFilters() {
        const select = document.getElementById('admin-roster-filter-team');
        if (!select) return;
        const filters = this.studentRosterFilters || {};
        const records = this.getStudentDraftStore().filter(record => {
            const cls = this.sectionClass(record);
            return (!filters.classlevel || cls.classlevel === filters.classlevel) && (!filters.className || cls.className === filters.className || (filters.className === '__unassigned__' && !cls.className));
        });
        select.replaceChildren(new Option('Tất cả tổ', ''), ...records.map(record => new Option(record.name, record.id)));
        select.value = records.some(record => record.id === filters.section) ? filters.section : '';
    },
    syncStudentRosterNavigation() {
        const tab = this.studentRosterTab || 'players';
        for (const key of ['players', 'sections', 'pending']) {
            const button = document.getElementById(`btn-sub-${key}`);
            if (button) { button.setAttribute('aria-selected', String(tab === key)); button.className = `roster-mode-button ${tab === key ? 'btn-primary' : 'btn-opt'}`; }
        }
        const add = document.getElementById('btn-sub-add');
        if (add) { add.hidden = tab === 'pending'; add.textContent = `＋ ${tab === 'sections' ? 'Thêm tổ mới' : 'Thêm học sinh'}`; add.onclick = () => tab === 'sections' ? this.showStudentDraftForm() : this.showAddPlayerForm(); }
    },
    refreshStudentRosterView() {
        if (document.querySelector('#admin-subcontent-area .admin-student-draft-form')) {
            const filters = this.studentRosterFilters || {};
            for (const [id, key] of [['admin-roster-filter-section', 'className'], ['admin-roster-filter-team', 'section']]) {
                const select = document.getElementById(id); if (select) select.value = filters[key] || '';
            }
            this.populateStudentDraftFilters(); this.filterStudentDraftMembers(); return;
        }
        if (this.studentRosterTab === 'sections') this.switchStudentRosterTab('sections');
        else this.renderPlayersList(this.studentRosterModePending);
    },
    classroomStatus() {
        const repo = app.classroom.activate();
        return repo.error || (repo.status === 'synced' ? 'Đã đồng bộ dữ liệu' : repo.status === 'loading' ? 'Đang đồng bộ…' : 'Ngoại tuyến · chỉ lưu trên máy này');
    },
    switchStudentRosterTab(type) {
        if (!this.isAdminUser() || type !== 'sections') return;
        this.renderPlayersList(false); this.studentRosterTab = 'sections'; this.studentRosterModePending = false; this.syncStudentRosterNavigation();
        const esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const filters = this.studentRosterFilters || {};
        const students = (app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false);
        const records = this.getStudentDraftStore().filter(record => {
            const cls = this.sectionClass(record);
            if (filters.section && record.id !== filters.section) return false;
            if (filters.classlevel && cls.classlevel !== filters.classlevel) return false;
            if (filters.className && (filters.className === '__unassigned__' ? !!cls.className : cls.className !== filters.className)) return false;
            return !(filters.search || filters.gender) || students.some(user => record.members.includes(user.username) && this.matchesStudentRosterFilters(user));
        });
        const cards = records.map(record => {
            const index = this.getStudentDraftStore().findIndex(item => item.id === record.id);
            const members = students.filter(user => record.members.includes(user.username) && this.matchesStudentRosterFilters(user));
            const id = encodeURIComponent(record.id).replace(/'/g, '%27'), cls = this.sectionClass(record);
            return `<article class="admin-student-draft-card classroom-team-card" data-tone="${index % 6}"><header><span class="classroom-team-mark" aria-hidden="true">▤</span><span class="classroom-pill">${esc(cls.className ? `Lớp ${cls.className}` : cls.classlevel ? `Cấp lớp ${cls.classlevel}` : 'Cần chọn lớp')}</span></header><h3>${esc(record.name)}</h3><p>${members.length} thành viên${filters.search || filters.gender ? ' khớp bộ lọc' : ''}${app.classroom.getClient() && !record.version ? ' · Chưa đồng bộ, chọn Sửa để lưu' : ''}</p><ul class="classroom-member-chips">${members.map(user => `<li>${esc(user.fullname || user.username)}</li>`).join('') || '<li>Chưa có thành viên</li>'}</ul><footer><button type="button" class="classroom-button" onclick="app.admin.showStudentDraftForm(decodeURIComponent('${id}'))">✎ Sửa</button><button type="button" class="classroom-button classroom-button--quiet" onclick="app.admin.deleteStudentDraft(decodeURIComponent('${id}'))">Xóa</button></footer></article>`;
        }).join('');
        document.getElementById('admin-subcontent-area').innerHTML = `<section class="admin-student-drafts"><div class="classroom-section-status"><p class="admin-student-draft-note" role="status">${esc(this.classroomStatus())}</p><button type="button" class="classroom-button classroom-button--quiet" id="classroom-section-refresh">↻ Tải lại</button></div><div class="admin-student-draft-grid">${cards || '<div class="classroom-empty">Chưa có tổ khớp bộ lọc. Chọn “Thêm tổ mới” để bắt đầu.</div>'}</div></section>`;
        const owner = app.classroom.owner;
        document.getElementById('classroom-section-refresh').onclick = async () => { await app.classroom.ensure(true); if (this.isAdminUser() && (app.data.currentUser.id || app.data.currentUser.username) === owner && this.currentTab === 'players' && this.studentRosterTab === 'sections' && !this.studentSectionForm) this.switchStudentRosterTab('sections'); };
    },
    filterStudentDraftMembers() {
        const draft = this.studentSectionForm;
        if (!draft) return;
        for (const label of document.querySelectorAll('.admin-student-draft-members label')) {
            const user = (app.data.users || []).find(item => item.username === label.dataset.username);
            label.hidden = !user || user.approved === false || !this.matchesStudentRosterFilters(user);
        }
        const status = document.getElementById('student-draft-selection');
        if (status) status.textContent = `${draft.members.size} học sinh đã chọn · ${document.querySelectorAll('.admin-student-draft-members label:not([hidden])').length} hồ sơ hiển thị`;
    },
    showStudentDraftForm(id = '') {
        if (!this.isAdminUser() || this.studentRosterTab !== 'sections') return;
        const record = this.getStudentDraftStore().find(item => item.id === id);
        if (id && !record) return;
        const cls = record ? this.sectionClass(record) : null, choices = this.studentClassChoices(), filters = this.studentRosterFilters || {};
        const preferred = choices.find(([, item]) => (!filters.classlevel || item.classlevel === filters.classlevel) && (!filters.className || item.className === filters.className));
        this.studentSectionForm = { owner: app.classroom.owner, id: record?.id || crypto.randomUUID(), record, name: record?.name || '', classKey: cls?.classlevel ? this.studentClassKey(cls) : preferred?.[0] || choices[0]?.[0] || '', members: new Set(record?.members || []) };
        this.renderStudentSectionForm(); document.getElementById('student-draft-name')?.focus();
    },
    renderStudentSectionForm() {
        const draft = this.studentSectionForm, esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const students = app.data.sortUsersByVietnameseName((app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false && this.studentClassKey(user) === draft.classKey));
        const reserved = new Set(this.getStudentDraftStore().filter(item => item.id !== draft.record?.id).flatMap(item => item.members));
        document.getElementById('admin-subcontent-area').innerHTML = `<form class="admin-student-draft-form classroom-form"><header class="classroom-form-hero"><span class="classroom-team-mark" aria-hidden="true">▤</span><div><h3>${draft.record ? 'Chỉnh sửa tổ' : 'Thêm tổ mới'}</h3><p>Chọn lớp, đặt tên và chọn thành viên.</p></div></header><div class="classroom-form-fields"><label class="admin-roster-filter-field"><span>Tên tổ</span><input id="student-draft-name" required maxlength="80" value="${esc(draft.name)}"></label><label class="admin-roster-filter-field"><span>Lớp lập tổ</span><select id="student-draft-class" aria-label="Lớp lập tổ" required>${this.classroomClassOptions(draft.classKey)}</select></label></div><fieldset class="classroom-member-panel"><legend>Chọn thành viên</legend><p id="student-draft-selection" role="status"></p><div class="admin-student-draft-members">${students.map(user => `<label data-username="${esc(user.username)}"><input type="checkbox" name="draft-member" value="${esc(user.username)}" ${draft.members.has(user.username) ? 'checked' : ''} ${reserved.has(user.username) ? 'disabled' : ''}><span>${esc(user.fullname || user.username)}<small>${esc(app.data.getStudentClassLabel(user))}${reserved.has(user.username) ? ' · Đã thuộc tổ khác' : ''}</small></span></label>`).join('') || '<p>Chưa có học sinh đã duyệt trong lớp này.</p>'}</div></fieldset><p id="student-draft-error" role="alert"></p><footer class="classroom-form-actions"><span>${esc(this.classroomStatus())}</span><button type="button" class="classroom-button classroom-button--quiet" id="student-draft-cancel">Hủy</button><button type="submit" class="classroom-button classroom-button--save">✓ Lưu tổ</button></footer></form>`;
        document.getElementById('student-draft-name').oninput = event => { draft.name = event.target.value; };
        document.getElementById('student-draft-class').onchange = event => {
            draft.classKey = event.target.value; draft.members.clear();
            const [classlevel, className] = JSON.parse(draft.classKey);
            this.studentRosterFilters = { ...this.studentRosterFilters, classlevel, className: className || '__unassigned__', section: '' };
            this.renderPlayersList(false); this.studentRosterTab = 'sections'; this.syncStudentRosterNavigation();
            this.renderStudentSectionForm(); document.getElementById('student-draft-class').focus();
        };
        document.querySelector('.admin-student-draft-members').onchange = event => { if (event.target.name === 'draft-member') { event.target.checked ? draft.members.add(event.target.value) : draft.members.delete(event.target.value); this.filterStudentDraftMembers(); } };
        document.getElementById('student-draft-cancel').onclick = () => { this.studentSectionForm = null; this.switchStudentRosterTab('sections'); document.getElementById('btn-sub-add')?.focus(); };
        document.querySelector('.admin-student-draft-form').onsubmit = event => { event.preventDefault(); void this.submitStudentSectionForm(); };
        this.filterStudentDraftMembers();
    },
    async submitStudentSectionForm() {
        const draft = this.studentSectionForm;
        if (!this.isAdminUser() || !draft || draft.owner !== (app.data.currentUser.id || app.data.currentUser.username) || draft.saving) return;
        const error = document.getElementById('student-draft-error'), submit = document.querySelector('.admin-student-draft-form [type="submit"]');
        try {
            draft.saving = true; submit.disabled = true;
            const name = draft.name.trim();
            if (!name || name.length > 80 || !draft.classKey) throw new Error('Nhập tên tổ và chọn lớp.');
            const [classlevel, className] = JSON.parse(draft.classKey);
            const eligible = new Set((app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false && this.studentClassKey(user) === draft.classKey).map(user => user.username));
            if ([...draft.members].some(member => !eligible.has(member))) throw new Error('Danh sách học sinh đã thay đổi. Hãy chọn lại lớp và thành viên.');
            const records = this.getStudentDraftStore().filter(item => item.id !== draft.record?.id);
            if (records.some(item => this.studentClassKey(this.sectionClass(item)) === draft.classKey && item.name.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) throw new Error('Tên tổ đã tồn tại trong lớp.');
            if (records.some(item => item.members.some(member => draft.members.has(member)))) throw new Error('Học sinh đã thuộc tổ khác.');
            await app.classroom.saveSection({ id: draft.id, type: 'sections', name, classlevel, className, members: [...draft.members], version: draft.record?.version || 0 });
            if (!this.isAdminUser() || this.studentSectionForm !== draft) return;
            this.studentSectionForm = null; this.switchStudentRosterTab('sections'); document.getElementById('btn-sub-add')?.focus();
        } catch (cause) { if (error?.isConnected) error.textContent = cause.message; }
        finally { draft.saving = false; if (submit?.isConnected) submit.disabled = false; }
    },
    async deleteStudentDraft(id) {
        if (!this.isAdminUser()) return;
        const record = this.getStudentDraftStore().find(item => item.id === id);
        if (!record || !confirm(`Xóa tổ “${record.name}”? Hồ sơ và các tuần thi đua vẫn được giữ nguyên.`)) return;
        try { await app.classroom.removeSection(record); this.studentRosterFilters.section = ''; this.switchStudentRosterTab('sections'); document.getElementById('btn-sub-add')?.focus(); }
        catch (error) { alert(error.message); }
    }
});
