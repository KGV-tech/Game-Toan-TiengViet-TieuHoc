/* Navigation shell: each management function owns a separate workspace. */
Object.assign(app.admin, {
    questWorkspaceOpen: false,
    questManagementModes: {
        personal: { name: 'Nhiệm vụ Cá nhân', icon: '✦', description: 'Giao nhiệm vụ và theo dõi tiến độ học sinh.' },
        team: { name: 'Thi đua Nhóm', icon: '⚑', description: 'Tạo trận và điều phối các đội thi đua.' },
        weekly: { name: 'Thi đua tuần', icon: '★', description: 'Cộng điểm, chọn ngẫu nhiên và xem bảng thi đua.' }
    },
    getQuestContentArea() {
        if (!document.querySelector(`.quest-management-detail--${this.questMode}`) || !this.questWorkspaceOpen) {
            this.questWorkspaceOpen = true;
            this.switchTab('quests');
        }
        return document.getElementById('admin-quest-subarea');
    },
    returnToQuestManagement() {
        const mode = this.questMode;
        this.exitTeamCompetitionPresentation();
        this.questWorkspaceOpen = false;
        this.renderQuests(document.getElementById('treasure-content-area'));
        document.querySelector(`[data-quest-launch="${mode}"]`)?.focus();
    },
    renderQuestManagement(box) {
        if (!box) return;
        if (this.weeklyUI?.drawing) { this.weeklyUI.drawToken = (this.weeklyUI.drawToken || 0) + 1; this.weeklyUI.drawing = false; }
        const modal = document.getElementById('treasure-modal');
        const mode = this.questManagementModes[this.questMode] ? this.questMode : 'personal';
        const item = this.questManagementModes[mode];
        modal.toggleAttribute('data-quest-detail', this.questWorkspaceOpen);
        modal.setAttribute('aria-labelledby', this.questWorkspaceOpen ? 'quest-management-title' : 'treasure-title');
        if (!this.questWorkspaceOpen) {
            box.innerHTML = `<section class="quest-management-hub" aria-label="Chọn chức năng quản lý">${Object.entries(this.questManagementModes).map(([key, entry], index) => `<button type="button" class="quest-management-launch quest-management-launch--${key}" data-quest-launch="${key}"><span class="quest-management-launch__number">0${index + 1} · KHU VỰC ADMIN</span><span class="quest-management-mark" aria-hidden="true">${entry.icon}</span><strong>${entry.name}</strong><span>${entry.description}</span></button>`).join('')}</section>`;
            for (const button of box.querySelectorAll('[data-quest-launch]')) button.onclick = () => this.switchQuestMode(button.dataset.questLaunch);
            return;
        }
        box.innerHTML = `<section class="quest-management-detail quest-management-detail--${mode}" aria-label="${item.name}"><aside class="quest-management-sidebar"><header><span class="quest-management-mark" aria-hidden="true">${item.icon}</span><div><h2 id="quest-management-title">${item.name}</h2><p>Khu vực Admin</p></div></header><div class="admin-theme-nav"><button type="button" class="quest-management-back" id="quest-management-back">← Quay về</button>${app.ui.themeToggleMarkup()}</div><div id="quest-management-tools" class="quest-management-tools"></div></aside><div id="admin-quest-subarea" class="quest-workspace-content" aria-label="${item.name}"></div></section>`;
        document.getElementById('quest-management-back').onclick = () => this.returnToQuestManagement();
        const subarea = document.getElementById('admin-quest-subarea');
        if (mode === 'team') this.renderTeamCompetitions(subarea);
        else if (mode === 'weekly') this.renderWeeklyCompetition(subarea);
        else this.renderPersonalQuests(subarea);
        this.arrangeQuestManagementTools();
    },
    arrangeQuestManagementTools() {
        const tools = document.getElementById('quest-management-tools');
        const content = document.getElementById('admin-quest-subarea');
        if (!tools || !content) return;
        const selectors = this.questMode === 'weekly' ? ['.weekly-sidebar-controls', '.weekly-status'] : this.questMode === 'team' ? ['.team-dashboard-create', '.team-dashboard-overview', '.team-dashboard-notice'] : ['#btn-personal-quest-create', '.personal-quest-overview'];
        const elements = selectors.map(selector => content.querySelector(selector)).filter(Boolean);
        if (!elements.length) return;
        tools.replaceChildren(...elements);
        content.querySelector(this.questMode === 'team' ? '.team-dashboard-hero' : '.personal-quest-workspace__hero')?.remove();
    }
});
