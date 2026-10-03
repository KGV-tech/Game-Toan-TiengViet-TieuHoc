/* Membership belongs to the selected week's snapshot, never game groups. */
Object.assign(app.admin, {
    showWeeklyTeamForm(kind) {
        const ui = this.weeklyState(), week = this.selectedWeek();
        if (!this.isAdminUser() || !week || ui.busy || !['sections', 'groups'].includes(kind)) return;
        this.resetWeeklySelection();
        const esc = value => app.data.sanitizeHTML(String(value ?? '')), label = kind === 'sections' ? 'Tổ' : 'Nhóm';
        const teams = this.weeklyTeams(week, kind), formId = crypto.randomUUID();
        document.getElementById('weekly-body').innerHTML = `<form id="weekly-team-form" class="classroom-form"><header class="classroom-form-hero"><span class="classroom-team-mark">${this.icon(kind === 'sections' ? 'building-community' : 'users')}</span><div><h3>Thêm ${label} mới</h3><p>${esc(week.name)} · Lớp ${esc(week.className || week.classlevel)}</p></div></header><label class="admin-roster-filter-field"><span>Tên ${label}</span><input id="weekly-team-name" maxlength="160" required></label><fieldset class="classroom-member-panel"><legend>Chọn thành viên</legend><div class="weekly-team-members">${week.participants.map(student => `<label><input type="checkbox" data-weekly-team-member="${esc(student.username)}"><span>${esc(student.fullname)}<small>${esc(teams.find(team => team.members.includes(student.username))?.name || 'Chưa phân thành viên')}</small></span></label>`).join('')}</div></fieldset><p class="weekly-membership-note">Thành viên được chọn sẽ chuyển từ ${label.toLowerCase()} cũ sang ${label.toLowerCase()} mới trong tuần này.</p><p id="weekly-team-error" role="alert"></p><footer class="classroom-form-actions"><button type="button" class="classroom-button classroom-button--quiet" id="weekly-team-cancel">Hủy</button><button type="submit" class="classroom-button classroom-button--save">✓ Lưu ${label}</button></footer></form>`;
        const form = document.getElementById('weekly-team-form');
        document.getElementById('weekly-team-cancel').onclick = () => this.renderWeeklyCompetition();
        form.onsubmit = async event => {
            event.preventDefault(); if (ui.busy) return;
            const members = [...form.querySelectorAll('[data-weekly-team-member]:checked')].map(input => input.dataset.weeklyTeamMember);
            const name = document.getElementById('weekly-team-name').value.trim();
            if (!members.length || !name) { document.getElementById('weekly-team-error').textContent = 'Nhập tên và chọn ít nhất một thành viên.'; return; }
            ui.busy = true;
            for (const control of form.querySelectorAll('button,input')) control.disabled = true;
            try {
                const selected = new Set(members);
                const next = teams.map(team => ({ ...team, members: team.members.filter(username => !selected.has(username)) }));
                next.push({ id: formId, name, members, kind });
                await app.classroom.setWeekTeams(week, kind, next);
                if (this.isAdminUser() && this.weeklyUI === ui && this.selectedWeek()?.id === week.id && form.isConnected) { ui.busy = false; ui.error = ''; this.renderWeeklyCompetition(); document.getElementById('weekly-team-create')?.focus(); }
            } catch (error) { if (form.isConnected) document.getElementById('weekly-team-error').textContent = error.message; }
            finally { ui.busy = false; if (form.isConnected) for (const control of form.querySelectorAll('button,input')) control.disabled = false; }
        };
        document.getElementById('weekly-team-name').focus();
    }
});
