/* Weekly classroom points are isolated from game totals, stars and matches. */
Object.assign(app.admin, {
    weeklyState() {
        const owner = app.classroom.activate().owner;
        if (this.weeklyUI?.owner !== owner) this.weeklyUI = { owner, tab: 'points', selected: '', search: '', randomMode: 'all', teamId: '', classKey: app.safeStorage?.getItem(`weekly_class_${owner}`) || '', view: 'students', ranking: 'students', delay: 1200, noRepeat: true, drawn: [], result: '', randomStudent: '', pointStudent: null, error: '', requests: new Map() };
        return this.weeklyUI;
    },
    selectedWeek() { const ui = this.weeklyState(); return app.classroom.weeks.find(week => week.id === ui.selected && (!ui.classKey || this.studentClassKey({ classlevel: week.classlevel, class_name: week.className }) === ui.classKey)) || null; },
    refreshWeeklyAfterAsync() {
        if (document.getElementById('weekly-form')) document.querySelector('.weekly-status').textContent = this.weeklyState().error || this.classroomStatus();
        else this.renderWeeklyCompetition();
    },
    async addWeeklyPoint(weekId, username, delta = 1) {
        if (!this.isAdminUser()) return;
        const ui = this.weeklyState();
        if (ui.busy) return;
        ui.busy = true;
        const panel = ui.pointStudent;
        for (const button of document.querySelectorAll('#weekly-point-panel button')) button.disabled = true;
        const key = `${weekId}:${username}:${delta}`;
        if (!ui.requests.has(key)) ui.requests.set(key, crypto.randomUUID());
        try { await app.classroom.point(weekId, username, delta, ui.requests.get(key)); ui.requests.delete(key); ui.error = ''; if (ui.pointStudent === panel) ui.pointStudent = null; }
        catch (error) { ui.error = error.message; }
        finally { ui.busy = false; if (this.isAdminUser() && this.weeklyUI === ui && this.questMode === 'weekly') { this.refreshWeeklyAfterAsync(); const card = [...document.querySelectorAll('[data-weekly-student]')].find(item => item.dataset.weeklyStudent === username); if (ui.pointStudent) document.getElementById('weekly-point-add')?.focus(); else if (ui.tab === 'random') document.getElementById('weekly-random-add')?.focus(); else card?.focus(); } }
    },
    showWeeklyForm() {
        if (!this.isAdminUser()) return;
        const ui = this.weeklyState(); ui.drawToken = (ui.drawToken || 0) + 1; ui.drawing = false; ui.pointStudent = null;
        const esc = value => app.data.sanitizeHTML(String(value ?? ''));
        this.weeklyFormId = crypto.randomUUID();
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        (document.getElementById('weekly-week-form-region') || document.getElementById('weekly-body')).innerHTML = `<form id="weekly-form" class="classroom-form"><header class="classroom-form-hero"><span class="classroom-team-mark">⚑</span><div><h3>Tạo trận thi đua tuần</h3><p>Mọi học sinh bắt đầu từ 0 điểm trong trận mới.</p></div></header><div class="classroom-form-fields"><label class="admin-roster-filter-field"><span>Tên tuần</span><input id="weekly-name" maxlength="160" required></label><label class="admin-roster-filter-field"><span>Lớp thi đua</span><select id="weekly-class" aria-label="Lớp thi đua" required>${this.weeklyClasses().filter(([key]) => key === ui.classKey).map(([key,label]) => `<option value="${esc(key)}">${esc(label)}</option>`).join('')}</select></label><label class="admin-roster-filter-field"><span>Ngày bắt đầu</span><input id="weekly-start" type="date" value="${esc(today)}" required></label><label class="admin-roster-filter-field"><span>Ngày kết thúc</span><input id="weekly-end" type="date" value="${esc(today)}" required></label><fieldset class="weekly-type-choices"><legend>Loại thi đua</legend><input id="weekly-type" type="hidden" value="sections"><label><input type="radio" name="weekly-type-choice" value="sections" checked>Thi đua theo Tổ</label><label><input type="radio" name="weekly-type-choice" value="groups">Thi đua theo Nhóm</label></fieldset><label class="admin-roster-filter-field" id="weekly-group-count-field" hidden><span>Số nhóm</span><input id="weekly-group-count" type="number" min="2" max="12" value="3"></label></div><div id="weekly-form-members"></div><p id="weekly-form-error" role="alert"></p><footer class="classroom-form-actions"><span>Giữ nguyên điểm và lịch sử các trận khác.</span><button type="button" id="weekly-form-cancel" class="classroom-button classroom-button--quiet">Hủy</button><button type="submit" class="classroom-button classroom-button--save">✓ Tạo tuần mới</button></footer></form>`;
        const preview = () => this.previewWeeklyMembers();
        for (const id of ['weekly-class', 'weekly-group-count']) document.getElementById(id).onchange = preview;
        document.getElementById('weekly-form-cancel').onclick = () => this.renderWeeklyCompetition();
        document.getElementById('weekly-form').onsubmit = event => { event.preventDefault(); void this.submitWeeklyForm(); };
        for (const input of document.querySelectorAll('[name="weekly-type-choice"]')) input.onchange = () => { document.getElementById('weekly-type').value = input.value; preview(); };
        preview(); document.getElementById('weekly-name').focus();
    },
    previewWeeklyMembers() {
        const key = document.getElementById('weekly-class').value, mode = document.getElementById('weekly-type').value;
        const students = app.data.sortUsersByVietnameseName((app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false && this.studentClassKey(user) === key));
        const esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const count = Math.max(2, Math.min(12, Number(document.getElementById('weekly-group-count').value) || 3));
        document.getElementById('weekly-group-count-field').hidden = mode !== 'groups';
        const sections = this.getStudentDraftStore().filter(record => this.studentClassKey(this.sectionClass(record)) === key);
        this.weeklyFormRoster = students;
        document.getElementById('weekly-form-members').innerHTML = `<fieldset class="classroom-member-panel"><legend>${students.length} học sinh trong trận</legend><div class="weekly-form-members">${students.map((student, index) => `<label class="weekly-member-assignment"><span>${esc(student.fullname)}</span>${mode === 'groups' ? `<select data-weekly-assignment="${esc(student.username)}" aria-label="Nhóm của ${esc(student.fullname)}">${Array.from({ length: count }, (_, team) => `<option value="${team}" ${team === index % count ? 'selected' : ''}>Nhóm ${team + 1}</option>`).join('')}</select>` : `<small>${esc(sections.find(section => section.members.includes(student.username))?.name || 'Chưa phân tổ')}</small>`}</label>`).join('')}</div></fieldset>`;
    },
    async submitWeeklyForm() {
        if (!this.isAdminUser() || this.weeklyFormSaving) return;
        const form = document.getElementById('weekly-form'), ui = this.weeklyState();
        try {
            this.weeklyFormSaving = true; form.querySelector('[type="submit"]').disabled = true;
            const name = document.getElementById('weekly-name').value.trim(), startDate = document.getElementById('weekly-start').value, endDate = document.getElementById('weekly-end').value;
            const key = document.getElementById('weekly-class').value, [classlevel, className] = JSON.parse(key), mode = document.getElementById('weekly-type').value;
            if (!name || startDate > endDate || !startDate || !endDate) throw new Error('Nhập tên tuần và ngày kết thúc không trước ngày bắt đầu.');
            const users = (app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false && this.studentClassKey(user) === key);
            if (!users.length) throw new Error('Lớp chưa có học sinh đã duyệt.');
            const teams = mode === 'groups' ? Array.from({ length: Math.max(2, Math.min(12, Number(document.getElementById('weekly-group-count').value) || 3)) }, (_, index) => ({ id: `group-${index}`, name: `Nhóm ${index + 1}`, members: users.filter(user => Number([...form.querySelectorAll('[data-weekly-assignment]')].find(select => select.dataset.weeklyAssignment === user.username)?.value) === index).map(user => user.username) })) : this.getStudentDraftStore().filter(record => this.studentClassKey(this.sectionClass(record)) === key).map(record => ({ id: record.id, name: record.name, members: record.members.filter(username => users.some(user => user.username === username)) }));
            const unassigned = users.filter(user => !teams.some(team => team.members.includes(user.username)));
            if (unassigned.length) teams.push({ id: 'unassigned', name: 'Chưa phân tổ', members: unassigned.map(user => user.username) });
            const week = await app.classroom.createWeek({ id: this.weeklyFormId, name, classlevel, className, startDate, endDate, mode, participants: users.map(user => ({ username: user.username, fullname: user.fullname || user.username })), teams, scores: {}, absences: [], version: 1 });
            if (!this.isAdminUser() || this.weeklyUI !== ui || ui.classKey !== key || !form.isConnected) return;
            ui.classKey = key; ui.selected = week.id; ui.drawn = []; ui.drawToken = (ui.drawToken || 0) + 1; ui.drawing = false; ui.result = ''; ui.randomStudent = ''; ui.pointStudent = null; ui.tab = 'standings'; this.renderWeeklyCompetition();
        } catch (error) { if (form?.isConnected) document.getElementById('weekly-form-error').textContent = error.message; }
        finally { this.weeklyFormSaving = false; if (form?.isConnected) form.querySelector('[type="submit"]').disabled = false; }
    }
});
