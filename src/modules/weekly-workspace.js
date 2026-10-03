/* Class-scoped navigation, weekly history and animated classroom selection. */
Object.assign(app.admin, {
    weeklyClasses() {
        const classes = new Map();
        for (const student of app.data.users || []) {
            if (student.role?.toLowerCase() === 'admin' || student.approved === false) continue;
            const key = this.studentClassKey(student), [level, name] = JSON.parse(key);
            if (level) classes.set(key, name ? `Lớp ${name}` : `Cấp lớp ${level}`);
        }
        for (const week of app.classroom.weeks) {
            const key = this.studentClassKey({ classlevel: week.classlevel, class_name: week.className });
            if (!classes.has(key)) classes.set(key, week.className ? `Lớp ${week.className}` : `Cấp lớp ${week.classlevel}`);
        }
        return [...classes].sort((a, b) => a[1].localeCompare(b[1], 'vi', { numeric: true }));
    },
    weeklyClassStudents() {
        return app.data.sortUsersByVietnameseName((app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false && this.studentClassKey(user) === this.weeklyState().classKey));
    },
    weeklyClassWeeks() {
        return app.classroom.weeks.filter(week => this.studentClassKey({ classlevel: week.classlevel, class_name: week.className }) === this.weeklyState().classKey);
    },
    resetWeeklySelection() {
        const ui = this.weeklyState();
        ui.drawToken = (ui.drawToken || 0) + 1; ui.drawing = false;
        ui.drawn = []; ui.result = ''; ui.resultTeam = ''; ui.randomStudent = ''; ui.pointStudent = null; ui.teamId = ''; ui.search = ''; ui.error = '';
    },
    selectWeeklyClass(key) {
        const ui = this.weeklyState();
        if (ui.busy || !this.weeklyClasses().some(item => item[0] === key)) return;
        ui.classKey = key; ui.selected = ''; this.resetWeeklySelection();
        app.safeStorage?.setItem(`weekly_class_${ui.owner}`, key);
        this.renderWeeklyCompetition(); document.getElementById('weekly-class-filter')?.focus();
    },
    selectWeeklyWeek(id) {
        const ui = this.weeklyState();
        if (ui.busy || !this.weeklyClassWeeks().some(week => week.id === id)) return;
        ui.selected = id; this.resetWeeklySelection(); this.renderWeeklyCompetition();
        document.getElementById('weekly-select')?.focus();
    },
    weeklyActivityWeek() {
        const week = this.selectedWeek();
        if (week) return week;
        const [classlevel = '', className = ''] = JSON.parse(this.weeklyState().classKey || '["",""]');
        return { id: '', name: '', classlevel, className, mode: 'sections', participants: this.weeklyClassStudents().map(student => ({ username: student.username, fullname: student.fullname || student.username })), teams: [], scores: {}, absences: [] };
    },
    weeklyTeams(week, kind) {
        const participants = new Set(week.participants.map(student => student.username));
        const records = week.id && week.mode === kind ? week.teams : kind === 'sections' ? this.getStudentDraftStore().filter(record => this.studentClassKey(this.sectionClass(record)) === this.weeklyState().classKey) : [];
        return records.map(team => ({ ...team, members: team.members.filter(username => participants.has(username)) }));
    },
    renderWeeklyCompetition(box = document.getElementById('admin-quest-subarea')) {
        if (!this.isAdminUser() || !box || this.questMode !== 'weekly') return;
        const ui = this.weeklyState(), repo = app.classroom, esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const classes = this.weeklyClasses();
        if (!classes.some(item => item[0] === ui.classKey)) ui.classKey = classes[0]?.[0] || '';
        const weeks = this.weeklyClassWeeks();
        if (!weeks.some(week => week.id === ui.selected)) ui.selected = weeks.at(-1)?.id || '';
        const week = this.selectedWeek();
        document.getElementById('quest-management-tools')?.replaceChildren();
        box.innerHTML = `<section class="weekly-workspace" aria-label="Thi đua tuần"><div class="weekly-sidebar-controls"><label class="admin-roster-filter-field weekly-class-picker"><span>Lớp phụ trách</span><select id="weekly-class-filter" aria-label="Lớp phụ trách" ${ui.busy ? 'disabled' : ''}>${classes.map(([key, label]) => `<option value="${esc(key)}" ${key === ui.classKey ? 'selected' : ''}>${esc(label)}</option>`).join('') || '<option value="">Chưa có lớp</option>'}</select></label><nav class="weekly-roster-tabs" aria-label="Danh sách lớp">${[['students','Học sinh'],['sections','Tổ'],['groups','Nhóm']].map(([id,label]) => `<button type="button" class="classroom-button classroom-button--quiet" data-weekly-view="${id}" aria-pressed="${ui.view === id && ['roster','points'].includes(ui.tab)}">${label}</button>`).join('')}</nav><nav class="weekly-tabs" role="tablist" aria-label="Chức năng thi đua tuần">${[['points','⭐ Cộng điểm'],['random','🎲 Chọn ngẫu nhiên'],['standings','⚑ Thi đua']].map(([id,label]) => `<button type="button" class="classroom-button" role="tab" data-weekly-tab="${id}" aria-selected="${ui.tab === id}" aria-controls="weekly-body">${label}</button>`).join('')}</nav><div class="weekly-toolbar"><label class="weekly-select"><span>Trận thi đua tuần</span><select id="weekly-select" aria-label="Trận thi đua tuần" ${ui.busy ? 'disabled' : ''}>${weeks.map(item => `<option value="${esc(item.id)}" ${item.id === ui.selected ? 'selected' : ''}>${esc(item.name)}</option>`).join('') || '<option value="">Chưa có tuần</option>'}</select></label><div class="weekly-sidebar-actions"><button type="button" class="classroom-button classroom-button--save" id="weekly-create" ${!ui.classKey ? 'disabled' : ''}>＋ Tạo tuần mới</button><button type="button" class="classroom-button classroom-button--quiet" id="weekly-refresh" aria-label="Tải lại dữ liệu">↻</button></div>${week?.localOnly && repo.getClient() ? '<button type="button" class="classroom-button classroom-button--save" id="weekly-sync">↑ Lưu tuần lên máy chủ</button>' : ''}</div></div><p class="weekly-status" role="status">${esc(ui.error || this.classroomStatus())}</p><div id="weekly-body" class="weekly-body" role="tabpanel"></div></section>`;
        document.getElementById('weekly-class-filter').onchange = event => this.selectWeeklyClass(event.target.value);
        document.getElementById('weekly-select').onchange = event => this.selectWeeklyWeek(event.target.value);
        document.getElementById('weekly-create').onclick = () => this.showWeeklyForm();
        document.getElementById('weekly-refresh').onclick = async () => {
            try { await repo.ensure(true); } catch (error) { ui.error = error.message; }
            if (this.isAdminUser() && this.weeklyUI === ui) this.refreshWeeklyAfterAsync();
        };
        const sync = document.getElementById('weekly-sync');
        if (sync) sync.onclick = async () => {
            if (ui.busy) return; ui.busy = true; sync.disabled = true;
            try { await repo.syncWeek(week); ui.error = ''; } catch (error) { ui.error = error.message; }
            finally { ui.busy = false; if (this.isAdminUser() && this.weeklyUI === ui) this.refreshWeeklyAfterAsync(); }
        };
        for (const button of document.querySelectorAll('[data-weekly-view], [data-weekly-tab]')) button.onclick = () => {
            this.resetWeeklySelection();
            if (button.dataset.weeklyView) { ui.view = button.dataset.weeklyView; ui.tab = 'roster'; }
            else { ui.tab = button.dataset.weeklyTab; if (ui.tab === 'points') ui.view = 'students'; }
            this.renderWeeklyCompetition();
            document.querySelector(button.dataset.weeklyView ? `[data-weekly-view="${ui.view}"]` : `[data-weekly-tab="${ui.tab}"]`)?.focus();
        };
        const body = document.getElementById('weekly-body'), activity = this.weeklyActivityWeek();
        if (ui.tab === 'standings') this.renderWeeklyStandings(body, week);
        else if (ui.pointStudent?.weekId === week?.id && week) this.renderWeeklyPointPanel(body, week);
        else if (ui.tab === 'random') this.renderWeeklyRandom(body, activity);
        else if (ui.tab === 'roster' && ui.view !== 'students') this.renderWeeklyTeams(body, activity, ui.view);
        else this.renderWeeklyPoints(body, activity);
        this.arrangeQuestManagementTools();
        if (!repo.loaded && !repo.pending && repo.status !== 'error') void repo.ensure().then(() => {
            if (this.isAdminUser() && this.questMode === 'weekly' && this.weeklyUI === ui) this.refreshWeeklyAfterAsync();
        });
    },
    renderWeeklyTeams(box, week, kind) {
        const esc = value => app.data.sanitizeHTML(String(value ?? '')), teams = this.weeklyTeams(week, kind);
        box.innerHTML = `<header class="weekly-section-heading"><h3>${kind === 'sections' ? 'Tổ của lớp' : 'Nhóm của tuần'}</h3></header><div class="admin-student-draft-grid">${teams.map((team,index) => `<article class="classroom-team-card" data-tone="${index % 6}"><header><span class="classroom-team-mark" aria-hidden="true">${kind === 'sections' ? '▤' : '⚑'}</span><span class="classroom-pill">${team.members.length} thành viên</span></header><h3>${esc(team.name)}</h3><ul class="classroom-member-chips">${team.members.map(username => `<li>${esc(week.participants.find(student => student.username === username)?.fullname || username)}</li>`).join('')}</ul></article>`).join('')}</div>${!teams.length ? `<div class="classroom-empty">${kind === 'sections' ? 'Lớp này chưa có Tổ. Tạo Tổ trong Quản lý học sinh.' : 'Chưa có Nhóm trong tuần đang chọn. Tạo tuần với loại Thi đua theo Nhóm để phân thành viên.'}</div>` : ''}`;
    },
    renderWeeklyStandings(box, week) {
        const ui = this.weeklyState(), esc = value => app.data.sanitizeHTML(String(value ?? ''));
        box.innerHTML = `<header class="weekly-section-heading"><h3>Thi đua</h3><p>Quản lý tuần thi đua và bảng xếp hạng</p></header><section class="weekly-week-manager"><header><div><h4>Quản lý tuần thi đua</h4><p>Tuần hiện tại: ${esc(week?.name || 'Chưa chọn tuần')}</p></div><button type="button" class="classroom-button classroom-button--save" id="weekly-manager-create" ${!ui.classKey ? 'disabled' : ''}>＋ Tạo tuần mới</button></header><div id="weekly-week-form-region"></div><h4>Các tuần đã tạo</h4><div class="weekly-week-grid">${this.weeklyClassWeeks().map(item => `<article class="weekly-week-card ${item.id === ui.selected ? 'is-selected' : ''}"><button type="button" data-weekly-select="${esc(item.id)}"><strong>${esc(item.name)}</strong>${item.id === ui.selected ? '<span class="classroom-pill">Đang chọn</span>' : ''}<small>${esc(item.startDate)} → ${esc(item.endDate)}</small></button><button type="button" class="classroom-button classroom-button--quiet" data-weekly-delete="${esc(item.id)}" aria-label="Xóa ${esc(item.name)}">Xóa</button></article>`).join('') || '<p>Chưa có tuần thi đua cho lớp này.</p>'}</div></section><section class="weekly-ranking-panel"><header><h4>Bảng xếp hạng${week ? ` · ${esc(week.name)}` : ''}</h4><p>${week ? `Thi đua theo ${week.mode === 'groups' ? 'Nhóm' : 'Tổ'}` : 'Tạo tuần mới để bắt đầu từ 0 điểm.'}</p></header><nav class="weekly-ranking-tabs" aria-label="Bảng xếp hạng" role="tablist">${[['students','Cá nhân'],['sections','Tổ'],['groups','Nhóm']].map(([id,label]) => `<button type="button" class="classroom-button classroom-button--quiet" role="tab" data-weekly-ranking="${id}" aria-selected="${ui.ranking === id}" aria-controls="weekly-ranking-list">${label}${week && week.mode === id ? ' ★' : ''}</button>`).join('')}</nav><ol id="weekly-ranking-list" class="weekly-ranking-list" role="tabpanel"></ol></section>`;
        document.getElementById('weekly-manager-create').onclick = () => this.showWeeklyForm();
        for (const button of box.querySelectorAll('[data-weekly-delete]')) button.onclick = () => void this.deleteWeeklyWeek(button.dataset.weeklyDelete);
        for (const button of box.querySelectorAll('[data-weekly-select]')) button.onclick = () => this.selectWeeklyWeek(button.dataset.weeklySelect);
        for (const button of box.querySelectorAll('[data-weekly-ranking]')) button.onclick = () => {
            ui.ranking = button.dataset.weeklyRanking; this.renderWeeklyCompetition();
            document.querySelector(`[data-weekly-ranking="${ui.ranking}"]`)?.focus();
        };
        const score = username => Number(week?.scores[username] || 0);
        const rows = !week ? [] : ui.ranking === 'students' ? week.participants.map(student => ({ name: student.fullname, score: score(student.username) })) : this.weeklyTeams(week, ui.ranking).map(team => ({ name: team.name, score: team.members.reduce((sum, username) => sum + score(username), 0) }));
        rows.sort((a,b) => b.score - a.score || a.name.localeCompare(b.name, 'vi'));
        document.getElementById('weekly-ranking-list').innerHTML = rows.map((row,index) => `<li class="weekly-ranking-row" data-rank="${index + 1}"><span class="weekly-rank-medal" aria-label="Hạng ${index + 1}">${['🥇','🥈','🥉'][index] || index + 1}</span><strong>${esc(row.name)}</strong><span>${row.score} điểm</span></li>`).join('') || '<li class="classroom-empty">Chưa có dữ liệu trong bảng này.</li>';
    },
    async deleteWeeklyWeek(id) {
        const ui = this.weeklyState(), week = this.weeklyClassWeeks().find(item => item.id === id);
        if (!this.isAdminUser() || !week || ui.busy || !confirm(`Xóa tuần “${week.name}” và điểm của riêng tuần này?`)) return;
        ui.busy = true;
        for (const button of document.querySelectorAll('[data-weekly-delete]')) button.disabled = true;
        try { await app.classroom.deleteWeek(week); if (ui.selected === id) ui.selected = ''; this.resetWeeklySelection(); }
        catch (error) { ui.error = error.message; }
        finally { ui.busy = false; if (this.isAdminUser() && this.weeklyUI === ui) this.renderWeeklyCompetition(); }
    },
    renderWeeklyRandom(box, week) {
        const ui = this.weeklyState(), esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const kind = ui.randomMode.startsWith('group') ? 'groups' : 'sections', teams = this.weeklyTeams(week, kind);
        box.innerHTML = `<header class="weekly-section-heading"><h3>Chế độ chọn ngẫu nhiên</h3></header><nav class="weekly-random-modes" aria-label="Chế độ chọn ngẫu nhiên">${[['all','Tất cả học sinh','✦'],['section','Tổ','▤'],['section-member','Tổ → học sinh','▤'],['group','Nhóm','⚑'],['group-member','Nhóm → học sinh','⚑']].map(([id,label,icon],index) => `<button type="button" class="weekly-random-mode classroom-team-card" data-tone="${index}" data-weekly-random-mode="${id}" aria-pressed="${ui.randomMode === id}"><span class="classroom-team-mark" aria-hidden="true">${icon}</span><strong>${label}</strong></button>`).join('')}</nav><section class="weekly-random-controls"><label class="admin-roster-filter-field"><span>Chọn ${kind === 'groups' ? 'Nhóm' : 'Tổ'}</span><select id="weekly-random-team" ${!ui.randomMode.endsWith('-member') ? 'disabled' : ''}><option value="">Chọn ngẫu nhiên trước</option>${teams.map(team => `<option value="${esc(team.id)}" ${team.id === ui.teamId ? 'selected' : ''}>${esc(team.name)}</option>`).join('')}</select></label><label class="admin-roster-filter-field"><span>Độ trễ</span><select id="weekly-delay"><option value="1200">1,2 giây</option><option value="2000">2 giây</option><option value="3000">3 giây</option></select></label><label class="weekly-check"><input type="checkbox" id="weekly-no-repeat" ${ui.noRepeat ? 'checked' : ''}>Không lặp trong vòng</label></section><section class="weekly-random-result classroom-team-card ${ui.drawing && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'is-drawing' : ''}" data-tone="2"><span class="classroom-team-mark" aria-hidden="true">🎲</span><p id="weekly-random-team-result">${esc(ui.resultTeam || '')}</p><h4 id="weekly-random-result" role="status" aria-live="polite">${esc(ui.drawing ? ui.drawingText || 'Đang chọn ngẫu nhiên…' : ui.result || 'Sẵn sàng chọn ngẫu nhiên')}</h4>${!ui.drawing && ui.randomStudent && week.id ? `<p>Điểm hiện tại</p><strong id="weekly-random-score" class="weekly-selected-score">${Number(week.scores[ui.randomStudent] || 0)}</strong><button type="button" class="classroom-button classroom-button--save" id="weekly-random-add">＋ Cộng điểm cho học sinh</button>` : ''}<div><button type="button" class="classroom-button classroom-button--save" id="weekly-draw" ${ui.drawing ? 'disabled' : ''}>🎲 Chọn ngẫu nhiên</button><button type="button" class="classroom-button classroom-button--quiet" id="weekly-draw-reset">Đặt lại vòng</button></div></section><section class="weekly-candidate-panel"><h4 id="weekly-candidate-heading">Danh sách tham gia</h4><div id="weekly-random-candidates" class="weekly-candidate-grid"></div></section>`;
        for (const button of box.querySelectorAll('[data-weekly-random-mode]')) button.onclick = () => {
            this.resetWeeklySelection(); ui.randomMode = button.dataset.weeklyRandomMode; this.renderWeeklyCompetition();
            document.querySelector(`[data-weekly-random-mode="${ui.randomMode}"]`)?.focus();
        };
        document.getElementById('weekly-random-team').onchange = event => { this.resetWeeklySelection(); ui.teamId = event.target.value; this.renderWeeklyCompetition(); document.getElementById('weekly-random-team')?.focus(); };
        document.getElementById('weekly-delay').value = String(ui.delay);
        document.getElementById('weekly-delay').onchange = event => { ui.delay = Number(event.target.value); };
        document.getElementById('weekly-no-repeat').onchange = event => { ui.noRepeat = event.target.checked; ui.drawn = []; this.resetWeeklySelection(); this.renderWeeklyCompetition(); document.getElementById('weekly-no-repeat')?.focus(); };
        document.getElementById('weekly-draw-reset').onclick = () => { this.resetWeeklySelection(); this.renderWeeklyCompetition(); document.getElementById('weekly-draw-reset')?.focus(); };
        document.getElementById('weekly-draw').onclick = () => void this.drawWeeklyRandom();
        const add = document.getElementById('weekly-random-add');
        if (add) add.onclick = () => this.openWeeklyPointPanel(week.id, ui.randomStudent);
        const candidates = this.weeklyRandomCandidates(week, ui);
        document.getElementById('weekly-candidate-heading').textContent = `Danh sách tham gia · ${candidates.length}`;
        document.getElementById('weekly-random-candidates').innerHTML = candidates.map((candidate,index) => `<div class="weekly-random-candidate classroom-team-card" data-tone="${index % 6}"><span>${esc(candidate.name)}</span><strong>${candidate.score}</strong></div>`).join('') || '<p>Chưa có lựa chọn phù hợp. Kiểm tra danh sách hoặc đặt lại vòng.</p>';
    },
    weeklyRandomCandidates(week, ui) {
        const students = week.participants.filter(student => !(week.absences || []).includes(student.username) && !(ui.noRepeat && ui.drawn.includes(student.username)));
        if (ui.randomMode === 'all') return students.map(student => ({ id: student.username, name: student.fullname, score: Number(week.scores[student.username] || 0) }));
        const kind = ui.randomMode.startsWith('group') ? 'groups' : 'sections';
        const teams = this.weeklyTeams(week, kind).filter(team => team.members.some(username => students.some(student => student.username === username)));
        if (!ui.randomMode.endsWith('-member')) return teams.filter(team => !ui.noRepeat || !ui.drawn.includes(team.id)).map(team => ({ id: team.id, name: team.name, score: team.members.reduce((sum, username) => sum + Number(week.scores[username] || 0), 0) }));
        return students.filter(student => teams.some(team => (!ui.teamId || team.id === ui.teamId) && team.members.includes(student.username))).map(student => ({ id: student.username, name: student.fullname, score: Number(week.scores[student.username] || 0) }));
    },
    async drawWeeklyRandom() {
        if (!this.isAdminUser()) return;
        const ui = this.weeklyState(), week = this.weeklyActivityWeek();
        if (ui.drawing) return;
        let candidates = this.weeklyRandomCandidates(week, ui), team = null;
        if (ui.randomMode.endsWith('-member')) {
            const kind = ui.randomMode.startsWith('group') ? 'groups' : 'sections';
            const teams = this.weeklyTeams(week, kind).filter(item => (!ui.teamId || item.id === ui.teamId) && item.members.some(username => candidates.some(student => student.id === username)));
            team = teams[Math.floor(Math.random() * teams.length)];
            candidates = team ? candidates.filter(student => team.members.includes(student.id)) : [];
        }
        if (!candidates.length) { ui.result = 'Không còn lựa chọn phù hợp. Kiểm tra danh sách hoặc đặt lại vòng.'; ui.randomStudent = ''; this.renderWeeklyCompetition(); return; }
        const result = candidates[Math.floor(Math.random() * candidates.length)], token = ui.drawToken = (ui.drawToken || 0) + 1;
        const classKey = ui.classKey, weekId = week.id;
        ui.drawing = true;
        document.getElementById('weekly-draw').disabled = true;
        const panel = document.querySelector('.weekly-random-result');
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) panel?.classList.add('is-drawing');
        ui.drawingText = team ? `Đang chọn ${team.name} → học sinh…` : 'Đang chọn ngẫu nhiên…';
        document.getElementById('weekly-random-result').textContent = ui.drawingText;
        await new Promise(resolve => setTimeout(resolve, ui.delay));
        if (ui.drawToken !== token) return;
        ui.drawing = false;
        if (!this.isAdminUser() || this.weeklyUI !== ui || ui.classKey !== classKey || this.weeklyActivityWeek().id !== weekId || this.questMode !== 'weekly' || ui.tab !== 'random' || !document.getElementById('weekly-draw')) return;
        ui.drawn.push(result.id); ui.result = result.name; ui.resultTeam = team?.name || '';
        ui.randomStudent = ui.randomMode === 'all' || ui.randomMode.endsWith('-member') ? result.id : '';
        this.renderWeeklyCompetition(); document.getElementById('weekly-draw')?.focus();
    }
});
