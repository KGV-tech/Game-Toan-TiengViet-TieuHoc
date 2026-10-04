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
        ui.drawn = []; ui.lastCandidate = null; ui.animationCandidates = null; ui.meteorId = ''; ui.result = ''; ui.resultTeam = ''; ui.randomStudent = ''; ui.pointStudent = null; ui.teamId = ''; ui.search = ''; ui.error = '';
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
        const own = week.teams.filter(team => (team.kind || week.mode) === kind);
        const records = week.id && (own.length || week.mode === kind) ? own : kind === 'sections' ? this.getStudentDraftStore().filter(record => this.studentClassKey(this.sectionClass(record)) === this.weeklyState().classKey) : [];
        return records.map(team => ({ ...team, members: team.members.filter(username => participants.has(username)) }));
    },
    renderWeeklyCompetition(box = document.getElementById('admin-quest-subarea')) {
        if (!this.isAdminUser() || !box || this.questMode !== 'weekly') return;
        const restoreWinner = document.getElementById('weekly-result-dialog')?.open;
        const restoreTeamStage = !!document.getElementById('weekly-selected-team-heading');
        for (const dialog of document.querySelectorAll('#weekly-draw-dialog, #weekly-result-dialog')) { app.modal?.close(dialog, { restoreFocus: false }); dialog.close(); }
        const ui = this.weeklyState(), repo = app.classroom, esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const classes = this.weeklyClasses();
        if (!classes.some(item => item[0] === ui.classKey)) ui.classKey = classes[0]?.[0] || '';
        const weeks = this.weeklyClassWeeks();
        if (!weeks.some(week => week.id === ui.selected)) ui.selected = weeks.at(-1)?.id || '';
        const week = this.selectedWeek();
        document.getElementById('quest-management-tools')?.replaceChildren();
        box.innerHTML = `<section class="weekly-workspace" aria-label="Thi đua tuần"><div class="weekly-sidebar-controls"><label class="admin-roster-filter-field weekly-class-picker"><span>Lớp phụ trách</span><select id="weekly-class-filter" aria-label="Lớp phụ trách" ${ui.busy ? 'disabled' : ''}>${classes.map(([key, label]) => `<option value="${esc(key)}" ${key === ui.classKey ? 'selected' : ''}>${esc(label)}</option>`).join('') || '<option value="">Chưa có lớp</option>'}</select></label><nav class="weekly-roster-tabs" aria-label="Danh sách lớp">${[['students','Học sinh'],['sections','Tổ'],['groups','Nhóm']].map(([id,label]) => `<button type="button" class="classroom-button classroom-button--quiet" data-weekly-view="${id}" aria-pressed="${ui.view === id && ['roster','points'].includes(ui.tab)}">${label}</button>`).join('')}</nav><nav class="weekly-tabs" role="tablist" aria-label="Chức năng thi đua tuần">${[['points','⭐ Cộng điểm'],['random','🎲 Chọn ngẫu nhiên'],['standings','⚑ Thi đua']].map(([id,label]) => `<button type="button" class="classroom-button" role="tab" data-weekly-tab="${id}" aria-selected="${ui.tab === id}" aria-controls="weekly-body">${label}</button>`).join('')}</nav><div class="weekly-toolbar"><label class="weekly-select"><span>Trận thi đua tuần</span><select id="weekly-select" aria-label="Trận thi đua tuần" ${ui.busy ? 'disabled' : ''}>${weeks.map(item => `<option value="${esc(item.id)}" ${item.id === ui.selected ? 'selected' : ''}>${esc(item.name)}</option>`).join('') || '<option value="">Chưa có tuần</option>'}</select></label>${week?.localOnly && repo.getClient() && !repo.offlineMode ? '<button type="button" class="classroom-button classroom-button--save" id="weekly-sync">↑ Lưu tuần lên máy chủ</button>' : ''}${app.weeklyOffline?.markup(ui.busy) || ''}</div></div><p class="weekly-status" role="status">${esc(ui.error || app.weeklyOffline?.status() || this.classroomStatus())}</p><div id="weekly-body" class="weekly-body" role="tabpanel"></div></section>`;
        document.getElementById('weekly-class-filter').onchange = event => this.selectWeeklyClass(event.target.value);
        document.getElementById('weekly-select').onchange = event => this.selectWeeklyWeek(event.target.value);
        app.weeklyOffline?.bind();
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
        if (ui.tab === 'random' && ui.drawing) this.showWeeklyDrawStage();
        else if (restoreTeamStage && ui.tab === 'random' && ui.teamId && !ui.lastCandidate) this.showWeeklyTeamMembers(ui, activity);
        else if (restoreWinner && ui.tab === 'random' && ui.lastCandidate) this.showWeeklyDrawWinner(ui);
        if (ui.tab === 'random' && ui.meteorId && !matchMedia('(prefers-reduced-motion: reduce)').matches) this.placeWeeklyMeteor(ui.meteorId, 0, !ui.drawing);
        if (!repo.loaded && !repo.pending && repo.status !== 'error') void repo.ensure().then(() => {
            if (this.isAdminUser() && this.questMode === 'weekly' && this.weeklyUI === ui) this.refreshWeeklyAfterAsync();
        });
    },
    renderWeeklyTeams(box, week, kind) {
        const esc = value => app.data.sanitizeHTML(String(value ?? '')), teams = this.weeklyTeams(week, kind);
        box.innerHTML = `<header class="weekly-section-heading weekly-team-heading"><div><h3>${kind === 'sections' ? 'Tổ của lớp' : 'Nhóm của tuần'}</h3><p>Số lượng ${kind === 'sections' ? 'Tổ' : 'Nhóm'}: ${teams.filter(team => !['Chưa phân tổ','Chưa phân nhóm'].includes(team.name)).length}</p></div><div class="weekly-team-actions">${week.id ? `<button type="button" class="classroom-button classroom-button--quiet" id="weekly-team-arrange">Phân ${kind === 'sections' ? 'Tổ' : 'Nhóm'}</button>` : ''}<button type="button" class="classroom-button classroom-button--save" id="weekly-team-create">＋ Thêm ${kind === 'sections' ? 'Tổ' : 'Nhóm'} mới</button></div></header><div class="admin-student-draft-grid weekly-roster-team-grid" style="--roster-team-columns:${teams.length <= 4 ? 2 : 3}">${teams.map((team,index) => `<article class="classroom-team-card weekly-roster-team-card" data-tone="${index % 6}"><header><span class="classroom-team-mark" aria-hidden="true">${kind === 'sections' ? '▤' : '⚑'}</span><h3>${esc(team.name)}</h3><span class="classroom-pill">${team.members.length} thành viên</span></header><footer class="weekly-team-actions">${week.id ? `<button type="button" class="classroom-button classroom-button--quiet" data-weekly-team-edit="${esc(team.id)}" aria-label="Sửa ${esc(team.name)}">Sửa</button>${team.name === 'Chưa phân tổ' || team.name === 'Chưa phân nhóm' ? '' : `<button type="button" class="classroom-button classroom-button--quiet" data-weekly-team-delete="${esc(team.id)}" aria-label="Xóa ${esc(team.name)}">Xóa</button>`}` : ''}</footer><ul class="classroom-member-chips">${team.members.map(username => `<li>${esc(week.participants.find(student => student.username === username)?.fullname || username)}</li>`).join('')}</ul></article>`).join('')}</div>${!teams.length ? `<div class="classroom-empty">${week.id ? `Chưa có ${kind === 'sections' ? 'Tổ' : 'Nhóm'} trong tuần này. Chọn nút Thêm để phân thành viên.` : 'Tạo tuần mới để lưu tổ/nhóm và bắt đầu ghi điểm.'}</div>` : ''}`;
        const arrange = document.getElementById('weekly-team-arrange');
        if (arrange) arrange.onclick = () => this.showWeeklyTeamArrangement(kind);
        document.getElementById('weekly-team-create').onclick = () => week.id ? this.showWeeklyTeamForm(kind) : this.showWeeklyForm(kind);
        for (const button of box.querySelectorAll('[data-weekly-team-edit]')) button.onclick = () => this.showWeeklyTeamForm(kind, button.dataset.weeklyTeamEdit);
        for (const button of box.querySelectorAll('[data-weekly-team-delete]')) button.onclick = () => void this.deleteWeeklyTeam(kind, button.dataset.weeklyTeamDelete);
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
        document.getElementById('weekly-ranking-list').innerHTML = rows.map((row,index) => `<li class="weekly-ranking-row" data-rank="${index + 1}"><span class="weekly-rank-medal" aria-label="Hạng ${index + 1}">${index < 3 ? '<span class="weekly-rank-laurel" aria-hidden="true"></span>' : ''}<small>${index + 1}</small></span><strong>${esc(row.name)}</strong><span>${row.score} điểm</span></li>`).join('') || '<li class="classroom-empty">Chưa có dữ liệu trong bảng này.</li>';
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
        box.innerHTML = `<header class="weekly-section-heading"><h3>Chế độ chọn ngẫu nhiên</h3></header><nav class="weekly-random-modes" aria-label="Chế độ chọn ngẫu nhiên">${[['all','Tất cả học sinh','users-group'],['section','Tổ','building-community'],['section-member','Tổ → học sinh','user-search'],['group','Nhóm','users'],['group-member','Nhóm → học sinh','user-check']].map(([id,label,icon],index) => `<button type="button" class="weekly-random-mode classroom-team-card" data-tone="${index}" data-weekly-random-mode="${id}" aria-pressed="${ui.randomMode === id}"><span class="classroom-team-mark" aria-hidden="true">${this.icon(icon)}</span><strong>${label}</strong></button>`).join('')}</nav><section class="weekly-random-controls">${ui.randomMode.endsWith('-member') ? `<p id="weekly-random-step" role="status">${ui.teamId ? `Bước 2 · ${esc(teams.find(team => team.id === ui.teamId)?.name || '')}: chọn học sinh` : `Bước 1 · Chọn ${kind === 'groups' ? 'Nhóm' : 'Tổ'}`}</p>${ui.teamId ? '<button type="button" id="weekly-team-stage-back" class="classroom-button classroom-button--quiet">Chọn đội khác</button>' : ''}` : ''}<label class="weekly-check"><input type="checkbox" id="weekly-no-repeat" ${ui.noRepeat ? 'checked' : ''}>Không lặp trong vòng</label><button type="button" class="classroom-button classroom-button--quiet" id="weekly-draw-reset">Đặt lại vòng</button></section><section class="weekly-random-result classroom-team-card ${ui.drawing ? 'is-drawing' : ''}" data-tone="2"><span class="classroom-team-mark" aria-hidden="true">${this.icon('dice-5')}</span><p id="weekly-random-team-result">${esc(ui.resultTeam || '')}</p><h4 id="weekly-random-result" role="status" aria-live="polite">${esc(ui.drawing ? ui.drawingText || 'Đang chọn ngẫu nhiên…' : ui.result || 'Sẵn sàng chọn ngẫu nhiên')}</h4><div class="weekly-draw-stage" ${ui.drawing ? '' : 'hidden'}><strong id="weekly-draw-preview" aria-hidden="true">${esc(ui.previewName || '')}</strong><progress id="weekly-draw-progress" max="100" value="${ui.drawProgress || 0}" aria-label="Tiến trình chọn ngẫu nhiên"></progress></div>${!ui.drawing && ui.randomStudent && week.id ? `<p>Điểm hiện tại</p><strong id="weekly-random-score" class="weekly-selected-score">${Number(week.scores[ui.randomStudent] || 0)}</strong><button type="button" class="classroom-button classroom-button--save" id="weekly-random-add">＋ Cộng điểm cho học sinh</button>` : ''}<div><button type="button" class="classroom-button classroom-button--save" id="weekly-draw" ${ui.drawing ? 'disabled' : ''}>${ui.randomMode.endsWith('-member') ? ui.teamId ? '🎲 Chọn ngẫu nhiên học sinh' : `🎲 Chọn ngẫu nhiên ${kind === 'groups' ? 'Nhóm' : 'Tổ'}` : '🎲 Chọn ngẫu nhiên'}</button></div></section><section class="weekly-candidate-panel"><h4 id="weekly-candidate-heading">Danh sách tham gia</h4><div id="weekly-random-candidates" class="weekly-candidate-grid"></div></section>`;
        for (const button of box.querySelectorAll('[data-weekly-random-mode]')) button.onclick = () => {
            this.resetWeeklySelection(); ui.randomMode = button.dataset.weeklyRandomMode; this.renderWeeklyCompetition();
            document.querySelector(`[data-weekly-random-mode="${ui.randomMode}"]`)?.focus();
        };
        const back = document.getElementById('weekly-team-stage-back');
        if (back) back.onclick = () => {
            const drawn = [...ui.drawn]; this.resetWeeklySelection(); ui.drawn = drawn;
            this.renderWeeklyCompetition(); document.getElementById('weekly-draw')?.focus();
        };
        document.getElementById('weekly-no-repeat').onchange = event => { ui.noRepeat = event.target.checked; ui.drawn = []; this.resetWeeklySelection(); this.renderWeeklyCompetition(); document.getElementById('weekly-no-repeat')?.focus(); };
        document.getElementById('weekly-draw-reset').onclick = () => { this.resetWeeklySelection(); this.renderWeeklyCompetition(); document.getElementById('weekly-draw-reset')?.focus(); };
        document.getElementById('weekly-draw').onclick = () => void this.drawWeeklyRandom();
        const add = document.getElementById('weekly-random-add');
        if (add) add.onclick = () => { const dialog = document.getElementById('weekly-result-dialog'); if (dialog) { app.modal?.close(dialog, { restoreFocus: false }); dialog.close(); } this.openWeeklyPointPanel(week.id, ui.randomStudent); };
        const candidates = this.weeklyRandomCandidates(week, { ...ui, noRepeat: false });
        if (ui.lastCandidate) {
            ui.lastCandidate = candidates.find(item => item.id === ui.lastCandidate.id) || ui.lastCandidate;
        }
        document.getElementById('weekly-candidate-heading').textContent = `Danh sách tham gia · ${candidates.length}`;
        this.renderWeeklyCandidateGrid(ui, candidates);
    },
    showWeeklyDrawStage() {
        if (document.getElementById('weekly-draw-dialog')) return;
        const body = document.getElementById('weekly-body');
        const dialog = document.createElement('dialog');
        dialog.id = 'weekly-draw-dialog'; dialog.className = 'weekly-presentation-dialog';
        dialog.setAttribute('aria-label', 'Sao băng truy tìm');
        body.append(dialog);
        dialog.append(body.querySelector('.weekly-candidate-panel'), body.querySelector('.weekly-random-result'));
        const cancel = () => {
            const ui = this.weeklyState(), drawn = [...ui.drawn], teamId = ui.teamId, resultTeam = ui.resultTeam;
            dialog.querySelector('#weekly-selected-team-heading')?.remove();
            this.resetWeeklySelection(); Object.assign(ui, { drawn, teamId, resultTeam });
            this.renderWeeklyCompetition(); document.getElementById('weekly-draw')?.focus();
        };
        dialog.addEventListener('cancel', event => { event.preventDefault(); cancel(); });
        dialog.showModal(); app.modal?.open(dialog, { initialFocus: dialog, onEscape: cancel });
        dialog.setAttribute('tabindex','-1'); dialog.focus();
    },
    showWeeklyTeamMembers(ui, week) {
        this.showWeeklyDrawStage();
        const dialog = document.getElementById('weekly-draw-dialog');
        const heading = document.createElement('header');
        heading.id = 'weekly-selected-team-heading'; heading.setAttribute('role', 'status');
        const notice = document.createElement('p'), name = document.createElement('h3');
        notice.textContent = `${ui.randomMode.startsWith('group') ? 'Nhóm' : 'Tổ'} may mắn được chọn`;
        name.textContent = ui.resultTeam; heading.append(notice, name); dialog.prepend(heading);
        dialog.setAttribute('aria-label', `Chọn học sinh của ${ui.resultTeam}`);
        const members = this.weeklyRandomCandidates(week, { ...ui, noRepeat: false });
        document.getElementById('weekly-candidate-heading').textContent = `Danh sách học sinh · ${members.length}`;
        this.renderWeeklyCandidateGrid(ui, members);
        document.getElementById('weekly-meteor').hidden = true;
        document.querySelector('.weekly-draw-stage').hidden = true;
        document.querySelector('.weekly-random-result')?.classList.remove('is-drawing');
        const button = document.getElementById('weekly-draw');
        button.disabled = false; button.textContent = '🎲 Chọn ngẫu nhiên học sinh'; button.focus();
    },
    showWeeklyDrawWinner(ui) {
        const body = document.getElementById('weekly-body'), esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const dialog = document.createElement('dialog');
        dialog.id = 'weekly-result-dialog'; dialog.className = 'weekly-winner-dialog';
        dialog.setAttribute('aria-labelledby', 'weekly-winner-name');
        dialog.innerHTML = `<div class="weekly-winner-content"><span class="weekly-winner-star" aria-hidden="true">✦</span><p>${ui.randomMode === 'section' ? 'Tổ' : ui.randomMode === 'group' ? 'Nhóm' : 'Bạn'} may mắn được chọn</p><h2 id="weekly-winner-name">${esc(ui.result)}</h2><strong class="weekly-winner-score">${Number(ui.lastCandidate?.score || 0)}<small>điểm</small></strong><footer><button type="button" id="weekly-result-close" class="classroom-button classroom-button--quiet">Quay về danh sách</button></footer></div>`;
        body.append(dialog);
        const add = document.getElementById('weekly-random-add');
        if (add) dialog.querySelector('footer').prepend(add);
        dialog.querySelector('#weekly-result-close').onclick = () => dialog.close();
        dialog.addEventListener('close', () => {
            app.modal?.close(dialog, { restoreFocus: false });
            if (add?.isConnected) body.querySelector('.weekly-random-result')?.append(add);
            dialog.remove(); document.getElementById('weekly-draw')?.focus();
        }, { once: true });
        dialog.showModal(); app.modal?.open(dialog, { initialFocus: '#weekly-result-close', onEscape: () => dialog.close() });
        dialog.querySelector('#weekly-result-close').focus();
    },
    weeklyRandomCandidates(week, ui) {
        const students = week.participants.filter(student => !(week.absences || []).includes(student.username) && !(ui.noRepeat && ui.drawn.includes(student.username)));
        if (ui.randomMode === 'all') return students.map(student => ({ id: student.username, name: student.fullname, score: Number(week.scores[student.username] || 0) }));
        const kind = ui.randomMode.startsWith('group') ? 'groups' : 'sections';
        const teams = this.weeklyTeams(week, kind).filter(team => team.members.some(username => students.some(student => student.username === username)));
        if (!ui.randomMode.endsWith('-member') || !ui.teamId) return teams.filter(team => ui.randomMode.endsWith('-member') || !ui.noRepeat || !ui.drawn.includes(team.id)).map(team => ({ id: team.id, name: team.name, score: team.members.reduce((sum, username) => sum + Number(week.scores[username] || 0), 0) }));
        return students.filter(student => teams.some(team => (!ui.teamId || team.id === ui.teamId) && team.members.includes(student.username))).map(student => ({ id: student.username, name: student.fullname, score: Number(week.scores[student.username] || 0) }));
    },
    renderWeeklyCandidateGrid(ui, candidates) {
        const grid = document.getElementById('weekly-random-candidates');
        if (!grid) return;
        const esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const displayed = [...(ui.drawing ? ui.animationCandidates || candidates : candidates)];
        grid.classList.toggle('is-small-roster', displayed.length <= 10);
        grid.style.setProperty('--presentation-columns', Math.max(1, displayed.length <= 3 ? displayed.length : Math.ceil(displayed.length / 2)));
        grid.style.setProperty('--candidate-columns', Math.max(1, Math.min(displayed.length, ui.randomMode === 'all' || ui.teamId ? 4 : 3)));
        grid.innerHTML = displayed.map((candidate,index) => `<div class="weekly-random-candidate classroom-team-card" data-candidate-id="${esc(candidate.id)}" data-tone="${index % 6}"><span>${esc(candidate.name)}</span><strong class="weekly-candidate-score">${candidate.score}<small>điểm</small></strong></div>`).join('') || '<p>Chưa có lựa chọn phù hợp. Kiểm tra danh sách hoặc đặt lại vòng.</p>';
        const panel = grid.closest('.weekly-candidate-panel');
        if (!document.getElementById('weekly-meteor')) panel.insertAdjacentHTML('beforeend', '<span id="weekly-meteor" class="weekly-meteor" aria-hidden="true" hidden>✦</span>');
        if (ui.meteorId && !matchMedia('(prefers-reduced-motion: reduce)').matches) this.placeWeeklyMeteor(ui.meteorId, 0, !ui.drawing);
    },
    placeWeeklyMeteor(id, duration, landed = false) {
        const star = document.getElementById('weekly-meteor');
        const card = [...document.querySelectorAll('[data-candidate-id]')].find(item => item.dataset.candidateId === id);
        if (!star || !card) return;
        const origin = star.parentElement.getBoundingClientRect(), target = card.getBoundingClientRect();
        star.hidden = false;
        star.style.transitionDuration = `${duration}ms`;
        star.style.transform = `translate(${target.left - origin.left + (landed ? 4 : target.width / 2 - 20)}px,${target.top - origin.top + target.height / 2 - 20}px)`;
    },
    animateWeeklyDraw(ui, token, candidates, winner, duration = 6000) {
        const start = performance.now(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        ui.animationCandidates = candidates;
        this.renderWeeklyCandidateGrid(ui, candidates);
        let index = Math.floor(Math.random() * candidates.length), nextTick = 0;
        return new Promise(resolve => {
            const tick = () => {
                if (ui.drawToken !== token || this.weeklyUI !== ui || !this.isAdminUser() || this.questMode !== 'weekly' || ui.tab !== 'random' || !document.getElementById('weekly-draw')) { resolve(); return; }
                const elapsed = performance.now() - start, landing = elapsed >= duration * .82;
                ui.drawProgress = Math.min(100, elapsed / duration * 100);
                const progress = document.getElementById('weekly-draw-progress');
                if (progress) progress.value = ui.drawProgress;
                if (elapsed >= nextTick || landing && ui.meteorId !== winner.id) {
                    if (landing) index = candidates.findIndex(candidate => candidate.id === winner.id);
                    else if (candidates.length > 1) index = (index + 1 + Math.floor(Math.random() * (candidates.length - 1))) % candidates.length;
                    const candidate = candidates[index], travel = landing ? duration * .12 : 80 + 280 * Math.pow(elapsed / duration, 2);
                    ui.previewName = reduced ? 'Đang chọn…' : candidate.name;
                    const preview = document.getElementById('weekly-draw-preview');
                    if (preview) preview.textContent = ui.previewName;
                    if (!reduced) {
                        ui.meteorId = candidate.id;
                        for (const card of document.querySelectorAll('[data-candidate-id]')) card.classList.toggle('is-preview', card.dataset.candidateId === candidate.id);
                        this.placeWeeklyMeteor(candidate.id, travel);
                    }
                    nextTick = landing ? Infinity : elapsed + travel;
                }
                if (elapsed >= duration) { resolve(); return; }
                setTimeout(tick, 30);
            };
            tick();
        });
    },
    async drawWeeklyRandom() {
        if (!this.isAdminUser()) return;
        const ui = this.weeklyState(), week = this.weeklyActivityWeek();
        if (ui.drawing) return;
        const selectingTeam = ui.randomMode.endsWith('-member') && !ui.teamId;
        const candidates = this.weeklyRandomCandidates(week, ui);
        const displayCandidates = this.weeklyRandomCandidates(week, { ...ui, noRepeat: false });
        if (!candidates.length) { ui.error = ui.result = 'Không còn lựa chọn phù hợp. Kiểm tra danh sách hoặc đặt lại vòng.'; ui.randomStudent = ''; this.renderWeeklyCompetition(); return; }
        const result = candidates[Math.floor(Math.random() * candidates.length)], token = ui.drawToken = (ui.drawToken || 0) + 1;
        const classKey = ui.classKey, weekId = week.id;
        ui.drawing = true; ui.lastCandidate = null; ui.meteorId = ''; ui.previewName = '';
        document.getElementById('weekly-draw').disabled = true;
        document.querySelector('.weekly-draw-stage').hidden = false;
        const panel = document.querySelector('.weekly-random-result');
        panel?.classList.add('is-drawing');
        this.showWeeklyDrawStage();
        ui.drawingText = selectingTeam ? 'Bước 1 · Đang chọn đội ngẫu nhiên…' : ui.teamId ? `Bước 2 · ${ui.resultTeam}: đang chọn học sinh…` : 'Đang chọn ngẫu nhiên…';
        document.getElementById('weekly-random-result').textContent = ui.drawingText;
        await this.animateWeeklyDraw(ui, token, displayCandidates, result, 6000);
        if (ui.drawToken !== token) return;
        ui.previewName = ''; ui.drawProgress = 0;
        ui.drawing = false;
        if (!this.isAdminUser() || this.weeklyUI !== ui || ui.classKey !== classKey || this.weeklyActivityWeek().id !== weekId || this.questMode !== 'weekly' || ui.tab !== 'random' || !document.getElementById('weekly-draw')) return;
        ui.animationCandidates = null;
        if (selectingTeam) {
            ui.teamId = result.id; ui.resultTeam = result.name; ui.result = ''; ui.lastCandidate = null; ui.meteorId = '';
            this.showWeeklyTeamMembers(ui, week);
            return;
        }
        ui.lastCandidate = result;
        ui.drawn.push(result.id); ui.result = result.name;
        if (!ui.randomMode.endsWith('-member')) ui.resultTeam = '';
        ui.randomStudent = ui.randomMode === 'all' || ui.randomMode.endsWith('-member') ? result.id : '';
        this.renderWeeklyCompetition(); this.showWeeklyDrawWinner(ui);
    }
});
