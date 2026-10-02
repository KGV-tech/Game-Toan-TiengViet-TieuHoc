/* Weekly classroom points are isolated from game totals, stars and matches. */
Object.assign(app.admin, {
    weeklyState() {
        const owner = app.classroom.activate().owner;
        if (this.weeklyUI?.owner !== owner) this.weeklyUI = { owner, tab: 'points', selected: '', search: '', randomMode: 'all', teamId: '', instant: false, noRepeat: true, drawn: [], result: '', error: '', requests: new Map() };
        return this.weeklyUI;
    },
    selectedWeek() { const ui = this.weeklyState(); return app.classroom.weeks.find(week => week.id === ui.selected) || null; },
    refreshWeeklyAfterAsync() {
        if (document.getElementById('weekly-form')) document.querySelector('.weekly-status').textContent = this.weeklyState().error || this.classroomStatus();
        else this.renderWeeklyCompetition();
    },
    renderWeeklyCompetition(box = document.getElementById('admin-quest-subarea')) {
        if (!this.isAdminUser() || !box || this.questMode !== 'weekly') return;
        document.getElementById('quest-management-tools')?.replaceChildren();
        const ui = this.weeklyState(), repo = app.classroom, esc = value => app.data.sanitizeHTML(String(value ?? ''));
        if (!ui.selected && repo.weeks.length) ui.selected = repo.weeks[repo.weeks.length - 1].id;
        const week = this.selectedWeek();
        box.innerHTML = `<section class="weekly-workspace" aria-label="Thi đua tuần"><header class="weekly-toolbar"><div><h3>Thi đua tuần</h3><p>${week ? `${esc(week.className ? `Lớp ${week.className}` : `Cấp lớp ${week.classlevel}`)} · ${esc(week.startDate)} → ${esc(week.endDate)}` : 'Tạo một trận tuần để bắt đầu từ 0 điểm.'}</p></div><label class="weekly-select"><span>Trận thi đua tuần</span><select id="weekly-select" aria-label="Trận thi đua tuần">${repo.weeks.map(item => `<option value="${esc(item.id)}" ${item.id === ui.selected ? 'selected' : ''}>${esc(item.name)}</option>`).join('') || '<option value="">Chưa có trận</option>'}</select></label><button type="button" class="classroom-button classroom-button--save" id="weekly-create">＋ Tạo tuần mới</button>${week?.localOnly && repo.getClient() ? '<button type="button" class="classroom-button classroom-button--save" id="weekly-sync">↑ Lưu trận lên máy chủ</button>' : ''}<button type="button" class="classroom-button classroom-button--quiet" id="weekly-refresh">↻ Tải lại</button></header><nav class="weekly-tabs" role="tablist" aria-label="Chức năng thi đua tuần">${[['points', '⭐ Cộng điểm'], ['random', '🎲 Chọn ngẫu nhiên'], ['standings', '⚑ Thi đua']].map(([id, label]) => `<button type="button" class="classroom-button" role="tab" data-weekly-tab="${id}" aria-selected="${ui.tab === id}" aria-controls="weekly-body">${label}</button>`).join('')}</nav><p class="weekly-status" role="status">${esc(ui.error || (week?.localOnly && repo.getClient() ? 'Trận chỉ lưu trên máy · chưa đồng bộ' : this.classroomStatus()))}</p><div id="weekly-body" class="weekly-body" role="tabpanel"></div></section>`;
        document.getElementById('weekly-select').onchange = event => { ui.selected = event.target.value; ui.drawn = []; ui.result = ''; ui.teamId = ''; ui.search = ''; ui.error = ''; this.renderWeeklyCompetition(); document.getElementById('weekly-select')?.focus(); };
        document.getElementById('weekly-create').onclick = () => this.showWeeklyForm();
        const sync = document.getElementById('weekly-sync');
        if (sync) sync.onclick = async () => {
            if (ui.busy) return; ui.busy = true; sync.disabled = true;
            try { await repo.syncWeek(week); ui.error = ''; } catch (error) { ui.error = error.message; }
            finally { ui.busy = false; if (this.isAdminUser() && this.weeklyUI === ui) this.refreshWeeklyAfterAsync(); }
        };
        document.getElementById('weekly-refresh').onclick = async () => { await repo.ensure(true); if (this.isAdminUser() && this.weeklyUI === ui) this.refreshWeeklyAfterAsync(); };
        for (const button of box.querySelectorAll('[data-weekly-tab]')) button.onclick = () => { ui.tab = button.dataset.weeklyTab; ui.error = ''; this.renderWeeklyCompetition(); document.querySelector(`[data-weekly-tab="${ui.tab}"]`)?.focus(); };
        const body = document.getElementById('weekly-body');
        if (!week) body.innerHTML = '<div class="classroom-empty"><span aria-hidden="true">⚑</span><h4>Một tuần, một bảng điểm mới</h4><p>Chọn lớp và tạo trận. Điểm học tập và Sao giữ nguyên.</p></div>';
        else if (ui.tab === 'random') this.renderWeeklyRandom(body, week);
        else if (ui.tab === 'standings') this.renderWeeklyStandings(body, week);
        else this.renderWeeklyPoints(body, week);
        this.arrangeQuestManagementTools();
        if (!repo.loaded && !repo.pending && repo.status !== 'error') void repo.ensure().then(() => { if (this.isAdminUser() && this.questMode === 'weekly' && this.weeklyUI === ui) {
            if (document.getElementById('weekly-form')) document.querySelector('.weekly-status').textContent = this.classroomStatus();
            else this.renderWeeklyCompetition();
        } });
    },
    renderWeeklyPoints(box, week) {
        const ui = this.weeklyState(), esc = value => app.data.sanitizeHTML(String(value ?? ''));
        box.innerHTML = `<div class="weekly-points-tools"><label class="admin-roster-filter-field"><span>Tìm học sinh trong trận</span><input id="weekly-search" type="search" value="${esc(ui.search)}" placeholder="Họ tên hoặc tên đăng nhập"></label><p>Điểm chỉ thuộc trận <strong>${esc(week.name)}</strong>.</p></div><div class="weekly-student-grid">${week.participants.map((student, index) => `<article class="weekly-student-card classroom-team-card" data-tone="${index % 6}" data-weekly-student="${esc(student.username)}"><span class="classroom-pill">${(week.absences || []).includes(student.username) ? 'Vắng trong tuần' : 'Có mặt'}</span><h4>${esc(student.fullname || student.username)}</h4><strong class="weekly-point-value">${Number(week.scores[student.username] || 0)}<small>điểm tuần</small></strong><footer><button type="button" class="classroom-button classroom-button--save" data-point="1">＋ 1 điểm</button><button type="button" class="classroom-button classroom-button--quiet" data-point="-1" ${!week.scores[student.username] ? 'disabled' : ''} aria-label="Trừ 1 điểm của ${esc(student.fullname)}">− 1</button><button type="button" class="classroom-button classroom-button--quiet" data-absence>${(week.absences || []).includes(student.username) ? 'Có mặt' : 'Nghỉ học'}</button></footer></article>`).join('')}</div>`;
        const applySearch = () => {
            const norm = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');
            for (const card of box.querySelectorAll('[data-weekly-student]')) {
                const student = week.participants.find(item => item.username === card.dataset.weeklyStudent);
                card.hidden = !norm(`${student.fullname} ${student.username}`).includes(norm(ui.search));
            }
        };
        document.getElementById('weekly-search').oninput = event => { ui.search = event.target.value; applySearch(); };
        applySearch();
        for (const card of box.querySelectorAll('[data-weekly-student]')) {
            for (const button of card.querySelectorAll('[data-point]')) button.onclick = () => void this.addWeeklyPoint(week.id, card.dataset.weeklyStudent, Number(button.dataset.point));
            card.querySelector('[data-absence]').onclick = async () => {
                if (ui.busy) return;
                ui.busy = true;
                try { const absences = new Set(this.selectedWeek().absences || []); absences.has(card.dataset.weeklyStudent) ? absences.delete(card.dataset.weeklyStudent) : absences.add(card.dataset.weeklyStudent); await app.classroom.setAbsences(week.id, [...absences]); }
                catch (error) { ui.error = error.message; }
                finally { ui.busy = false; if (this.isAdminUser() && this.weeklyUI === ui) { this.refreshWeeklyAfterAsync(); [...document.querySelectorAll('[data-weekly-student]')].find(item => item.dataset.weeklyStudent === card.dataset.weeklyStudent)?.querySelector('[data-absence]')?.focus(); } }
            };
        }
    },
    async addWeeklyPoint(weekId, username, delta = 1) {
        if (!this.isAdminUser()) return;
        const ui = this.weeklyState();
        if (ui.busy) return;
        ui.busy = true;
        const key = `${weekId}:${username}:${delta}`;
        if (!ui.requests.has(key)) ui.requests.set(key, crypto.randomUUID());
        try { await app.classroom.point(weekId, username, delta, ui.requests.get(key)); ui.requests.delete(key); ui.error = ''; }
        catch (error) { ui.error = error.message; }
        finally { ui.busy = false; if (this.isAdminUser() && this.weeklyUI === ui && this.questMode === 'weekly') { this.refreshWeeklyAfterAsync(); const card = [...document.querySelectorAll('[data-weekly-student]')].find(item => item.dataset.weeklyStudent === username); card?.querySelector(`[data-point="${delta}"]`)?.focus(); } }
    },
    renderWeeklyStandings(box, week) {
        const esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const score = username => Number(week.scores[username] || 0);
        const teams = week.teams.map((team, tone) => ({ ...team, tone, score: team.members.reduce((sum, username) => sum + score(username), 0) })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'vi'));
        const students = [...week.participants].sort((a, b) => score(b.username) - score(a.username) || a.fullname.localeCompare(b.fullname, 'vi'));
        box.innerHTML = `<header class="weekly-ranking-heading"><h4>${esc(week.name)}</h4><p>Bảng xếp hạng ${week.mode === 'groups' ? 'Nhóm' : 'Tổ'} · tổng điểm thành viên của riêng trận này</p></header><div class="admin-student-draft-grid">${teams.map((team, index) => `<article class="classroom-team-card" data-tone="${team.tone % 6}"><header><span class="classroom-team-mark">${index + 1}</span><span class="classroom-pill">${team.members.length} thành viên</span></header><h3>${esc(team.name)}</h3><strong class="weekly-point-value">${team.score}<small>điểm tuần</small></strong><ul class="classroom-member-chips">${team.members.map(username => { const student = week.participants.find(item => item.username === username); return `<li>${esc(student?.fullname || username)} <b>${score(username)}</b></li>`; }).join('')}</ul></article>`).join('')}</div><section class="weekly-individual-ranking"><h4>Xếp hạng học sinh</h4><ol>${students.map(student => `<li><span>${esc(student.fullname)}</span><strong>${score(student.username)} điểm</strong></li>`).join('')}</ol></section>`;
    },
    renderWeeklyRandom(box, week) {
        const ui = this.weeklyState(), esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const label = week.mode === 'groups' ? 'nhóm' : 'tổ';
        box.innerHTML = `<section class="weekly-random-controls classroom-form-hero"><label class="admin-roster-filter-field"><span>Chế độ chọn</span><select id="weekly-random-mode"><option value="all">Tất cả học sinh</option><option value="team">Random ${label}</option><option value="member">${label === 'tổ' ? 'Tổ' : 'Nhóm'} → thành viên</option></select></label><label class="admin-roster-filter-field"><span>Chọn ${label}</span><select id="weekly-random-team"><option value="">Chọn ngẫu nhiên ${label} trước</option>${week.teams.map(team => `<option value="${esc(team.id)}">${esc(team.name)}</option>`).join('')}</select></label><label class="weekly-check"><input type="checkbox" id="weekly-instant" ${ui.instant ? 'checked' : ''}>Instant · kết quả ngay</label><label class="weekly-check"><input type="checkbox" id="weekly-no-repeat" ${ui.noRepeat ? 'checked' : ''}>Không lặp trong vòng</label></section><section class="weekly-random-result classroom-team-card" data-tone="2"><span class="classroom-team-mark" aria-hidden="true">🎲</span><h4 id="weekly-random-result" role="status" aria-live="polite">${esc(ui.result || 'Sẵn sàng chọn ngẫu nhiên')}</h4><p>Chỉ chọn học sinh có mặt của trận này. Bốc thăm không cộng điểm.</p><div><button type="button" class="classroom-button classroom-button--save" id="weekly-draw">🎲 Chọn ngẫu nhiên</button><button type="button" class="classroom-button classroom-button--quiet" id="weekly-draw-reset">Đặt lại vòng</button></div></section>`;
        document.getElementById('weekly-random-mode').value = ui.randomMode;
        document.getElementById('weekly-random-team').value = ui.teamId;
        document.getElementById('weekly-random-mode').onchange = event => { ui.randomMode = event.target.value; ui.drawn = []; ui.result = ''; };
        document.getElementById('weekly-random-team').onchange = event => { ui.teamId = event.target.value; ui.drawn = []; };
        document.getElementById('weekly-instant').onchange = event => { ui.instant = event.target.checked; };
        document.getElementById('weekly-no-repeat').onchange = event => { ui.noRepeat = event.target.checked; ui.drawn = []; };
        document.getElementById('weekly-draw-reset').onclick = () => { ui.drawn = []; ui.result = 'Đã đặt lại vòng chọn'; this.renderWeeklyCompetition(); };
        document.getElementById('weekly-draw').onclick = () => void this.drawWeeklyRandom();
    },
    async drawWeeklyRandom() {
        if (!this.isAdminUser()) return;
        const ui = this.weeklyState(), week = this.selectedWeek();
        if (!week || ui.drawing) return;
        const present = week.participants.filter(student => !(week.absences || []).includes(student.username));
        const eligible = ui.noRepeat && ui.randomMode !== 'team' ? present.filter(student => !ui.drawn.includes(student.username)) : present;
        const teams = week.teams.filter(team => team.members.some(username => eligible.some(student => student.username === username)));
        let candidates;
        if (ui.randomMode === 'team') candidates = teams.map(team => ({ id: team.id, name: team.name }));
        else {
            let members = eligible;
            let chosen = ui.teamId ? teams.find(team => team.id === ui.teamId) : null;
            if (ui.randomMode === 'member') {
                chosen = ui.teamId ? chosen : teams[Math.floor(Math.random() * teams.length)];
                members = chosen ? eligible.filter(student => chosen.members.includes(student.username)) : [];
            }
            candidates = members.map(student => ({ id: student.username, name: `${student.fullname}${chosen ? ` · ${chosen.name}` : ''}` }));
        }
        if (ui.noRepeat) candidates = candidates.filter(item => !ui.drawn.includes(item.id));
        if (!candidates.length) { ui.result = 'Không còn lựa chọn phù hợp. Kiểm tra vắng mặt hoặc đặt lại vòng.'; this.renderWeeklyCompetition(); return; }
        ui.drawing = true;
        const result = candidates[Math.floor(Math.random() * candidates.length)];
        const button = document.getElementById('weekly-draw');
        if (button) button.disabled = true;
        if (!ui.instant && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelector('.weekly-random-result')?.classList.add('is-drawing');
            await new Promise(resolve => setTimeout(resolve, 650));
        }
        ui.drawing = false;
        if (!this.isAdminUser() || this.weeklyUI !== ui || this.selectedWeek()?.id !== week.id) return;
        ui.drawn.push(result.id); ui.result = result.name; this.refreshWeeklyAfterAsync(); document.getElementById('weekly-draw')?.focus();
    },
    showWeeklyForm() {
        if (!this.isAdminUser()) return;
        const esc = value => app.data.sanitizeHTML(String(value ?? ''));
        this.weeklyFormId = crypto.randomUUID();
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        document.getElementById('weekly-body').innerHTML = `<form id="weekly-form" class="classroom-form"><header class="classroom-form-hero"><span class="classroom-team-mark">⚑</span><div><h3>Tạo trận thi đua tuần</h3><p>Mọi học sinh bắt đầu từ 0 điểm trong trận mới.</p></div></header><div class="classroom-form-fields"><label class="admin-roster-filter-field"><span>Tên tuần</span><input id="weekly-name" maxlength="160" required></label><label class="admin-roster-filter-field"><span>Lớp thi đua</span><select id="weekly-class" aria-label="Lớp thi đua" required>${this.classroomClassOptions()}</select></label><label class="admin-roster-filter-field"><span>Ngày bắt đầu</span><input id="weekly-start" type="date" value="${esc(today)}" required></label><label class="admin-roster-filter-field"><span>Ngày kết thúc</span><input id="weekly-end" type="date" value="${esc(today)}" required></label><label class="admin-roster-filter-field"><span>Loại thi đua</span><select id="weekly-type"><option value="sections">Thi đua theo Tổ</option><option value="groups">Thi đua theo Nhóm riêng của tuần</option></select></label><label class="admin-roster-filter-field" id="weekly-group-count-field" hidden><span>Số nhóm</span><input id="weekly-group-count" type="number" min="2" max="12" value="3"></label></div><div id="weekly-form-members"></div><p id="weekly-form-error" role="alert"></p><footer class="classroom-form-actions"><span>Giữ nguyên điểm và lịch sử các trận khác.</span><button type="button" id="weekly-form-cancel" class="classroom-button classroom-button--quiet">Hủy</button><button type="submit" class="classroom-button classroom-button--save">✓ Tạo tuần mới</button></footer></form>`;
        const preview = () => this.previewWeeklyMembers();
        for (const id of ['weekly-class', 'weekly-type', 'weekly-group-count']) document.getElementById(id).onchange = preview;
        document.getElementById('weekly-form-cancel').onclick = () => this.renderWeeklyCompetition();
        document.getElementById('weekly-form').onsubmit = event => { event.preventDefault(); void this.submitWeeklyForm(); };
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
            if (!this.isAdminUser() || this.weeklyUI !== ui) return;
            ui.selected = week.id; ui.drawn = []; ui.result = ''; ui.tab = 'standings'; this.renderWeeklyCompetition();
        } catch (error) { if (form?.isConnected) document.getElementById('weekly-form-error').textContent = error.message; }
        finally { this.weeklyFormSaving = false; if (form?.isConnected) form.querySelector('[type="submit"]').disabled = false; }
    }
});
