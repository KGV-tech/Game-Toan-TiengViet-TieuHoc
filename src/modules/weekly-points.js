/* Compact student selection and a scoped point editor for the selected week. */
Object.assign(app.admin, {
    renderWeeklyPoints(box, week) {
        const ui = this.weeklyState(), esc = value => app.data.sanitizeHTML(String(value ?? ''));
        box.innerHTML = `<header class="weekly-points-heading"><h3>Cộng điểm</h3><label class="admin-roster-filter-field"><span>Tìm học sinh trong trận</span><input id="weekly-search" type="search" value="${esc(ui.search)}" placeholder="Họ tên hoặc tên đăng nhập"></label></header><div class="weekly-student-grid">${week.participants.map((student, index) => `<button type="button" class="weekly-student-card classroom-team-card" data-tone="${index % 6}" data-weekly-student="${esc(student.username)}" aria-label="${esc(student.fullname || student.username)} · ${Number(week.scores[student.username] || 0)} điểm"><span class="weekly-student-name">${esc(student.fullname || student.username)}</span><strong class="weekly-point-value">${Number(week.scores[student.username] || 0)}</strong></button>`).join('')}</div><p id="weekly-search-empty" class="classroom-empty" hidden>Không có học sinh khớp tìm kiếm.</p>`;
        const applySearch = () => {
            const norm = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');
            let visible = 0;
            for (const card of box.querySelectorAll('[data-weekly-student]')) {
                const student = week.participants.find(item => item.username === card.dataset.weeklyStudent);
                card.hidden = !norm(`${student.fullname} ${student.username}`).includes(norm(ui.search));
                if (!card.hidden) visible++;
            }
            document.getElementById('weekly-search-empty').hidden = visible > 0;
        };
        document.getElementById('weekly-search').oninput = event => { ui.search = event.target.value; applySearch(); };
        applySearch();
        for (const card of box.querySelectorAll('[data-weekly-student]')) card.onclick = () => this.openWeeklyPointPanel(week.id, card.dataset.weeklyStudent);
    },
    openWeeklyPointPanel(weekId, username) {
        if (!this.isAdminUser() || this.weeklyState().busy || this.selectedWeek()?.id !== weekId) return;
        const week = this.selectedWeek();
        if (!week.participants.some(student => student.username === username)) return;
        this.weeklyState().pointStudent = { weekId, username };
        this.renderWeeklyCompetition();
        document.getElementById('weekly-point-add')?.focus();
    },
    closeWeeklyPointPanel() {
        const ui = this.weeklyState();
        if (ui.busy) return;
        const username = ui.pointStudent?.username;
        ui.pointStudent = null; ui.error = '';
        this.renderWeeklyCompetition();
        if (ui.tab === 'random') document.getElementById('weekly-random-add')?.focus();
        else [...document.querySelectorAll('[data-weekly-student]')].find(card => card.dataset.weeklyStudent === username)?.focus();
    },
    renderWeeklyPointPanel(box, week) {
        const ui = this.weeklyState(), selected = ui.pointStudent;
        const student = week.participants.find(item => item.username === selected?.username);
        if (!student) { ui.pointStudent = null; this.renderWeeklyPoints(box, week); return; }
        const esc = value => app.data.sanitizeHTML(String(value ?? ''));
        const points = Number(week.scores[student.username] || 0), absent = (week.absences || []).includes(student.username);
        box.innerHTML = `<section id="weekly-point-panel" class="weekly-point-panel" aria-labelledby="weekly-selected-name"><span class="weekly-selection-mark" aria-hidden="true">✦</span><p>Học sinh được chọn:</p><h3 id="weekly-selected-name">${esc(student.fullname || student.username)}</h3><p>Điểm hiện tại</p><strong class="weekly-selected-score">${points}</strong><p class="weekly-point-error" role="alert">${esc(ui.error)}</p><div class="weekly-point-actions"><button type="button" id="weekly-point-add" class="classroom-button classroom-button--save">＋ Cộng 1 điểm</button><button type="button" id="weekly-point-cancel" class="classroom-button classroom-button--quiet">Hủy</button></div><details class="weekly-point-adjust"><summary>Điều chỉnh &amp; điểm danh</summary><div><button type="button" class="classroom-button classroom-button--quiet" data-point="-1" ${!points ? 'disabled' : ''}>− Trừ 1 điểm</button><button type="button" class="classroom-button classroom-button--quiet" data-absence>${absent ? 'Có mặt' : 'Nghỉ học'}</button></div></details></section>`;
        document.getElementById('weekly-point-add').onclick = () => void this.addWeeklyPoint(week.id, student.username, 1);
        document.getElementById('weekly-point-cancel').onclick = () => this.closeWeeklyPointPanel();
        box.querySelector('[data-point]').onclick = () => void this.addWeeklyPoint(week.id, student.username, -1);
        box.querySelector('[data-absence]').onclick = async () => {
            if (ui.busy) return;
            ui.busy = true;
            for (const button of box.querySelectorAll('button')) button.disabled = true;
            try {
                const current = app.classroom.weeks.find(item => item.id === week.id);
                const absences = new Set(current.absences || []);
                absences.has(student.username) ? absences.delete(student.username) : absences.add(student.username);
                await app.classroom.setAbsences(week.id, [...absences]); ui.error = '';
            } catch (error) { ui.error = error.message; }
            finally {
                ui.busy = false;
                if (this.isAdminUser() && this.weeklyUI === ui) {
                    this.refreshWeeklyAfterAsync();
                    if (ui.pointStudent === selected) {
                        const details = document.querySelector('.weekly-point-adjust');
                        if (details) details.open = true;
                        document.querySelector('#weekly-point-panel [data-absence]')?.focus();
                    }
                }
            }
        };
    }
});
