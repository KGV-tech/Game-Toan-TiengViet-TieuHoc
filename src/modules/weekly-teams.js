/* Membership belongs to the selected week's snapshot, never game groups. */
Object.assign(app.admin, {
    showWeeklyTeamForm(kind, teamId = '') {
        const ui = this.weeklyState(), week = this.selectedWeek();
        if (!this.isAdminUser() || !week || ui.busy || !['sections', 'groups'].includes(kind)) return;
        this.resetWeeklySelection();
        const esc = value => app.data.sanitizeHTML(String(value ?? '')), label = kind === 'sections' ? 'Tổ' : 'Nhóm';
        const teams = this.weeklyTeams(week, kind), editing = teams.find(team => team.id === teamId), formId = editing?.id || crypto.randomUUID();
        if (teamId && !editing) return;
        document.getElementById('weekly-body').innerHTML = `<form id="weekly-team-form" class="classroom-form"><header class="classroom-form-hero"><span class="classroom-team-mark">${this.icon(kind === 'sections' ? 'building-community' : 'users')}</span><div><h3>${editing ? 'Sửa' : 'Thêm'} ${label}${editing ? '' : ' mới'}</h3><p>${esc(week.name)} · Lớp ${esc(week.className || week.classlevel)}</p></div></header><label class="admin-roster-filter-field"><span>Tên ${label}</span><input id="weekly-team-name" maxlength="160" value="${esc(editing?.name || '')}" required></label><fieldset class="classroom-member-panel"><legend>Chọn thành viên</legend><div class="weekly-team-members">${week.participants.map(student => `<label><input type="checkbox" data-weekly-team-member="${esc(student.username)}" ${editing?.members.includes(student.username) ? 'checked' : ''}><span>${esc(student.fullname)}<small>${esc(teams.find(team => team.members.includes(student.username))?.name || 'Chưa phân thành viên')}</small></span></label>`).join('')}</div></fieldset><p class="weekly-membership-note">Thành viên được chọn sẽ chuyển từ ${label.toLowerCase()} cũ sang ${label.toLowerCase()} mới trong tuần này.</p><p id="weekly-team-error" role="alert"></p><footer class="classroom-form-actions"><button type="button" class="classroom-button classroom-button--quiet" id="weekly-team-cancel">Hủy</button><button type="submit" class="classroom-button classroom-button--save">✓ Lưu ${label}</button></footer></form>`;
        const form = document.getElementById('weekly-team-form');
        document.getElementById('weekly-team-cancel').onclick = () => this.renderWeeklyCompetition();
        form.onsubmit = async event => {
            event.preventDefault(); if (ui.busy) return;
            const members = [...form.querySelectorAll('[data-weekly-team-member]:checked')].map(input => input.dataset.weeklyTeamMember);
            const name = document.getElementById('weekly-team-name').value.trim();
            if (!members.length || !name) { document.getElementById('weekly-team-error').textContent = 'Nhập tên và chọn ít nhất một thành viên.'; return; }
            if (['Chưa phân tổ','Chưa phân nhóm'].includes(name) && editing?.name !== name) { document.getElementById('weekly-team-error').textContent = 'Tên này dành cho danh sách chưa phân. Hãy chọn tên khác.'; return; }
            const selected = new Set(members);
            const next = teams.filter(team => team.id !== formId).map(team => ({ ...team, members: team.members.filter(username => !selected.has(username)) }));
            next.push({ id: formId, name, members, kind });
            await this.saveWeeklyTeamChanges(week, kind, this.completeWeeklyTeamMembership(week, kind, next), form);
        };
        document.getElementById('weekly-team-name').focus();
    },
    showWeeklyTeamArrangement(kind) {
        const ui = this.weeklyState(), week = this.selectedWeek();
        if (!this.isAdminUser() || !week || ui.busy || !['sections','groups'].includes(kind)) return;
        this.resetWeeklySelection();
        const esc = value => app.data.sanitizeHTML(String(value ?? '')), label = kind === 'sections' ? 'Tổ' : 'Nhóm';
        const existing = this.weeklyTeams(week, kind).filter(team => !['Chưa phân tổ','Chưa phân nhóm'].includes(team.name));
        const max = week.participants.length;
        if (!max) return;
        const draft = { count: Math.min(max, existing.length || 4), teams: [], assignments: new Map(), automatic: false, capacities: [] };
        const balanceCapacities = () => { draft.capacities = Array.from({length: draft.count}, (_, index) => Math.floor(max / draft.count) + (index < max % draft.count ? 1 : 0)); };
        balanceCapacities();
        document.getElementById('weekly-body').innerHTML = `<form id="weekly-team-form" class="classroom-form weekly-arrangement-form"><header class="classroom-form-hero"><span class="classroom-team-mark" aria-hidden="true">${this.icon('users')}</span><div><h3>Phân ${label} cho học sinh</h3><p>${esc(week.name)} · Lớp ${esc(week.className || week.classlevel)}</p></div></header><div class="weekly-arrangement-controls"><label class="admin-roster-filter-field"><span>Số lượng ${label}</span><input type="number" id="weekly-team-count" min="1" max="${max}" value="${draft.count}" required></label><fieldset><legend>Cách phân học sinh</legend><label><input type="radio" name="weekly-team-method" value="auto"> Tự chia ngẫu nhiên, cân bằng</label><label><input type="radio" name="weekly-team-method" value="manual" checked> Admin chọn học sinh</label></fieldset><button type="button" id="weekly-team-shuffle" class="classroom-button classroom-button--quiet" hidden>Chia lại ngẫu nhiên</button></div><p class="weekly-membership-note">Xem và điều chỉnh trước khi lưu. Danh sách ${label.toLowerCase()} mới sẽ thay danh sách ${label.toLowerCase()} của tuần đang chọn; điểm cá nhân giữ nguyên.</p><div class="weekly-arrangement-preview"><div id="weekly-team-counts" class="weekly-team-counts"></div><div id="weekly-team-assignments" class="weekly-team-members"></div></div><p id="weekly-team-error" role="alert"></p><footer class="classroom-form-actions"><button type="button" class="classroom-button classroom-button--quiet" id="weekly-team-cancel">Hủy</button><button type="submit" class="classroom-button classroom-button--save">✓ Lưu ${label}</button></footer></form>`;
        const form = document.getElementById('weekly-team-form');
        const prepare = (shuffle = false) => {
            while (draft.teams.length < draft.count) {
                const index = draft.teams.length;
                draft.teams.push({ id: existing[index]?.id || crypto.randomUUID(), name: existing[index]?.name || `${label} ${index + 1}`, kind });
            }
            const students = [...week.participants];
            if (shuffle) for (let i=students.length-1;i>0;i--) { const j = Math.floor(Math.random()*(i+1)); [students[i],students[j]] = [students[j],students[i]]; }
            let teamIndex = 0, assignedToTeam = 0;
            students.forEach((student,index) => {
                const previous = draft.assignments.get(student.username);
                if (shuffle) {
                    while (assignedToTeam >= draft.capacities[teamIndex]) { teamIndex++; assignedToTeam = 0; }
                    draft.assignments.set(student.username, teamIndex); assignedToTeam++; return;
                }
                if (shuffle || previous === undefined || previous >= draft.count) {
                    const existingIndex = existing.findIndex(team => team.members.includes(student.username));
                    draft.assignments.set(student.username, !shuffle && existingIndex >= 0 && existingIndex < draft.count ? existingIndex : index % draft.count);
                }
            });
        };
        const render = () => {
            form.querySelector('#weekly-team-counts').innerHTML = draft.teams.slice(0,draft.count).map((team,index) => {
                const count = [...draft.assignments.values()].filter(value=>value===index).length;
                return `<div class="weekly-team-target" data-weekly-team-total="${count}"><label class="admin-roster-filter-field"><span>${label} ${index+1} · ${count} học sinh</span><input maxlength="160" required data-weekly-team-draft-name="${index}" value="${esc(team.name)}" aria-label="Tên ${label} ${index+1}"></label><label class="admin-roster-filter-field"><span>Số học sinh muốn chia</span><input type="number" min="0" max="${max}" step="1" required data-weekly-team-capacity="${index}" value="${esc(draft.capacities[index])}" aria-label="Số học sinh ${label} ${index+1}"></label></div>`;
            }).join('');
            form.querySelector('#weekly-team-assignments').innerHTML = week.participants.map(student => `<label><span>${esc(student.fullname)}</span><select aria-label="${label} của ${esc(student.fullname)}" data-weekly-team-assignment="${esc(student.username)}" ${draft.automatic ? 'disabled' : ''}>${draft.teams.slice(0,draft.count).map((team,index)=>`<option value="${index}" ${draft.assignments.get(student.username)===index ? 'selected' : ''}>${esc(team.name)}</option>`).join('')}</select></label>`).join('');
            for (const input of form.querySelectorAll('[data-weekly-team-draft-name]')) input.onchange = () => {
                const index = Number(input.dataset.weeklyTeamDraftName);
                draft.teams[index].name = input.value;
                for (const select of form.querySelectorAll('[data-weekly-team-assignment]')) select.options[index].textContent = input.value;
            };
            for (const input of form.querySelectorAll('[data-weekly-team-capacity]')) input.oninput = () => { draft.capacities[Number(input.dataset.weeklyTeamCapacity)] = input.value === '' ? NaN : Number(input.value); };
            for (const select of form.querySelectorAll('[data-weekly-team-assignment]')) select.onchange = () => { const username = select.dataset.weeklyTeamAssignment; draft.assignments.set(username, Number(select.value)); render(); form.querySelector(`[data-weekly-team-assignment="${CSS.escape(username)}"]`)?.focus(); };
            form.querySelector('#weekly-team-shuffle').hidden = !draft.automatic;
        };
        form.querySelector('#weekly-team-count').onchange = event => {
            const count = Number(event.target.value);
            if (!Number.isInteger(count) || count < 1 || count > max) { form.querySelector('#weekly-team-error').textContent = `Số lượng phải từ 1 đến ${max}.`; return; }
            draft.count = count; balanceCapacities(); form.querySelector('#weekly-team-error').textContent = ''; prepare(draft.automatic); render();
        };
        const validateCapacities = () => {
            const error = form.querySelector('#weekly-team-error');
            if (draft.capacities.some(value => !Number.isInteger(value) || value < 0 || value > max)) { error.textContent = `Số học sinh mỗi tổ/nhóm phải là số nguyên từ 0 đến ${max}.`; return false; }
            if (draft.capacities.reduce((sum,value) => sum + value, 0) !== max) { error.textContent = `Tổng số học sinh phải bằng ${max}. Hãy điều chỉnh số lượng từng tổ/nhóm.`; return false; }
            error.textContent = ''; return true;
        };
        for (const input of form.querySelectorAll('[name="weekly-team-method"]')) input.onchange = () => { draft.automatic = input.value === 'auto'; if (!draft.automatic || validateCapacities()) prepare(draft.automatic); render(); };
        form.querySelector('#weekly-team-shuffle').onclick = () => { if (!validateCapacities()) return; prepare(true); render(); };
        form.querySelector('#weekly-team-cancel').onclick = () => this.renderWeeklyCompetition();
        form.onsubmit = async event => {
            event.preventDefault();
            if (draft.automatic) {
                if (!validateCapacities()) return;
                if (draft.capacities.some((value,index) => value !== [...draft.assignments.values()].filter(team => team === index).length)) { form.querySelector('#weekly-team-error').textContent = 'Bấm Chia lại ngẫu nhiên để áp dụng số lượng đã nhập trước khi lưu.'; return; }
            }
            const teams = draft.teams.slice(0,draft.count).map((team,index)=>({ ...team, name: team.name.trim(), members: week.participants.filter(student=>draft.assignments.get(student.username)===index).map(student=>student.username) }));
            if (teams.some(team=>!team.name)) { form.querySelector('#weekly-team-error').textContent = 'Nhập tên cho từng tổ/nhóm.'; return; }
            if (teams.some(team=>['Chưa phân tổ','Chưa phân nhóm'].includes(team.name))) { form.querySelector('#weekly-team-error').textContent = 'Tên này dành cho danh sách chưa phân. Hãy chọn tên khác.'; return; }
            await this.saveWeeklyTeamChanges(week, kind, teams, form);
        };
        prepare(); render(); form.querySelector('#weekly-team-count').focus();
    },
    completeWeeklyTeamMembership(week, kind, teams) {
        const assigned = new Set(teams.flatMap(team => team.members));
        const missing = week.participants.filter(student => !assigned.has(student.username)).map(student => student.username);
        if (!missing.length) return teams;
        const name = kind === 'sections' ? 'Chưa phân tổ' : 'Chưa phân nhóm';
        const existing = teams.find(team => team.name === name);
        if (existing) return teams.map(team => team === existing ? { ...team, members: [...team.members, ...missing] } : team);
        const ids = new Set(week.teams.map(team => team.id).concat(teams.map(team => team.id)));
        const base = `${week.id}-unassigned-${kind}`;
        let id = base, suffix = 1;
        while (ids.has(id)) id = `${base}-${suffix++}`;
        return [...teams, { id, name, kind, members: missing }];
    },
    async saveWeeklyTeamChanges(week, kind, teams, form = null) {
        const ui = this.weeklyState();
        if (!this.isAdminUser() || ui.busy || this.selectedWeek()?.id !== week.id) return;
        ui.busy = true;
        const controls = form ? [...form.querySelectorAll('button,input,select')] : [...document.querySelectorAll('[data-weekly-team-edit],[data-weekly-team-delete],#weekly-team-create,#weekly-team-arrange')];
        const disabledBeforeSave = controls.map(control => control.disabled);
        for (const control of controls) control.disabled = true;
        try {
            await app.classroom.setWeekTeams(week, kind, teams);
            if (this.isAdminUser() && this.weeklyUI === ui && this.selectedWeek()?.id === week.id && (!form || form.isConnected)) {
                ui.busy = false; this.resetWeeklySelection(); this.renderWeeklyCompetition(); document.getElementById('weekly-team-create')?.focus();
            }
        } catch (error) {
            if (form?.isConnected) form.querySelector('#weekly-team-error').textContent = error.message;
            else if (!form && this.isAdminUser() && this.weeklyUI === ui && this.selectedWeek()?.id === week.id) { ui.error = error.message; this.renderWeeklyCompetition(); }
        } finally { ui.busy = false; controls.forEach((control,index) => { if (control.isConnected) control.disabled = disabledBeforeSave[index]; }); }
    },
    async deleteWeeklyTeam(kind, id) {
        const ui = this.weeklyState(), week = this.selectedWeek();
        if (!this.isAdminUser() || !week || ui.busy) return;
        const teams = this.weeklyTeams(week, kind), team = teams.find(item => item.id === id);
        if (!team || !confirm(`Xóa “${team.name}”? Học sinh vẫn có trong danh sách lớp; điểm cá nhân được giữ nguyên.`)) return;
        const next = teams.filter(item => item.id !== id);
        await this.saveWeeklyTeamChanges(week, kind, this.completeWeeklyTeamMembership(week, kind, next));
    }
});
