/* Durable weekly-only outbox. Server permissions remain enforced by existing RPCs. */
(function () {
    const repo = app.classroom, copy = value => JSON.parse(JSON.stringify(value));
    const original = Object.fromEntries(['activate', 'ensure', 'point', 'createWeek', 'setAbsences', 'setWeekTeams', 'deleteWeek'].map(name => [name, repo[name]]));
    const key = owner => `weekly-offline:v1:${owner}`;
    repo.activate = function () {
        const previous = this.offlineOwner;
        original.activate.call(this);
        if (previous !== this.owner) {
            this.offlineOwner = this.owner; this.offlineMode = false; this.offlineQueue = []; this.offlineRevision = 0; this.offlineFault = ''; this.offlineAuthUserId = null;
            try {
                const saved = JSON.parse(localStorage.getItem(key(this.owner)) || 'null');
                if (saved) {
                    if (saved.owner !== this.owner || !Array.isArray(saved.queue) || !Array.isArray(saved.weeks) || !Array.isArray(saved.roster) || !Number.isInteger(saved.revision)) throw new Error('invalid_cache');
                    this.offlineMode = !!saved.offline || saved.queue.length > 0; this.offlineQueue = saved.queue; this.offlineRevision = saved.revision;
                    this.offlineRoster = saved.roster;
                    this.offlineAuthUserId = saved.authUserId || null;
                    if (saved.offline || saved.queue.length) this.weeks = saved.weeks;
                }
            } catch (_) { this.offlineFault = 'Không đọc được bản Offline. Dữ liệu được giữ nguyên, chưa cho phép ghi đè.'; }
        }
        return this;
    };
    repo.saveOfflineState = function (weeks, queue, offline = this.offlineMode) {
        this.activate();
        if (this.offlineFault) throw new Error(this.offlineFault);
        const existing = JSON.parse(localStorage.getItem(key(this.owner)) || 'null');
        if ((existing?.revision || 0) !== this.offlineRevision) throw new Error('Thi đua tuần đang được sửa ở cửa sổ khác. Tải lại trang trước khi tiếp tục.');
        const state = { owner: this.owner, authUserId: this.offlineAuthUserId, revision: this.offlineRevision + 1, offline, weeks, queue, roster: this.offlineRoster || [], savedAt: new Date().toISOString() };
        try { localStorage.setItem(key(this.owner), JSON.stringify(state)); }
        catch (_) { throw new Error('Không lưu được trên thiết bị. Thao tác chưa được ghi nhận.'); }
        this.weeks = weeks; this.offlineQueue = queue; this.offlineRevision = state.revision; this.offlineMode = offline;
    };
    repo.setOffline = async function (enabled) {
        this.activate();
        if (this.offlineSyncing) throw new Error('Đang đồng bộ. Hãy chờ hoàn tất.');
        if (enabled && typeof window !== 'undefined' && !navigator.locks) throw new Error('Trình duyệt chưa hỗ trợ khóa lưu Offline an toàn. Hãy dùng Chrome hoặc Edge trên thiết bị này.');
        if (this.pending) await this.pending;
        this.activate();
        if (!enabled && this.offlineQueue.length) throw new Error('Còn thay đổi chưa đồng bộ. Bấm Đồng bộ trước khi trở lại Online.');
        this.offlineAuthUserId = app.data.currentUser.auth_user_id || this.offlineAuthUserId;
        this.offlineRoster = (app.data.users || []).filter(user => user.role?.toLowerCase() !== 'admin' && user.approved !== false).map(user => ({ username: user.username, fullname: user.fullname || user.username, classlevel: user.classlevel, class_name: user.class_name || '', role: 'student', approved: true }));
        const weeks = copy(this.weeks), queue = copy(this.offlineQueue);
        if (enabled) for (const week of weeks.filter(item => item.localOnly && !queue.some(op => op.weekId === item.id))) {
            week.version = 1;
            queue.push({ id: crypto.randomUUID(), type: 'create', weekId: week.id, record: copy(week) });
        }
        this.saveOfflineState(weeks, queue, enabled);
        this.loaded = true;
    };
    repo.ensure = async function (force) {
        this.activate();
        if (this.offlineMode || this.offlineQueue.length || this.offlineFault) { this.loaded = true; return this; }
        return original.ensure.call(this, force);
    };
    repo.point = async function (weekId, username, delta = 1, eventId = crypto.randomUUID()) {
        this.activate();
        if (this.offlineSyncing) throw new Error('Đang đồng bộ. Hãy chờ hoàn tất.');
        if (!this.offlineMode) return original.point.call(this, weekId, username, delta, eventId);
        const week = this.weeks.find(item => item.id === weekId);
        if (!week || !week.participants.some(item => item.username === username) || ![1, -1].includes(delta)) throw new Error('Học sinh không thuộc trận đã chọn.');
        if (this.offlineQueue.some(op => op.eventId === eventId)) return week;
        const saved = copy(week), value = Number(saved.scores[username] || 0) + delta;
        if (value < 0) throw new Error('Điểm không thể nhỏ hơn 0.');
        saved.scores[username] = value; saved.version = (week.version || 1) + 1;
        const op = { id: crypto.randomUUID(), type: 'point', weekId, username, delta, eventId };
        this.saveOfflineState(this.weeks.map(item => item.id === weekId ? saved : item), [...this.offlineQueue, op]);
        return saved;
    };
    repo.queueWeeklyChange = function (saved, op) {
        if (this.offlineSyncing) throw new Error('Đang đồng bộ. Hãy chờ hoàn tất.');
        const queue = [...this.offlineQueue, { ...op, id: crypto.randomUUID() }];
        const weeks = this.weeks.filter(item => item.id !== op.weekId);
        if (saved) weeks.push(saved);
        this.saveOfflineState(weeks, queue);
        return saved;
    };
    repo.createWeek = async function (record) {
        this.activate();
        if (!this.offlineMode) return original.createWeek.call(this, record);
        if (this.weeks.some(item => item.id === record.id)) throw new Error('Tuần này đã tồn tại.');
        const saved = { ...copy(record), version: 1, localOnly: true };
        return this.queueWeeklyChange(saved, { type: 'create', weekId: saved.id, record: copy(saved) });
    };
    repo.setAbsences = async function (weekId, absences) {
        this.activate();
        if (!this.offlineMode) return original.setAbsences.call(this, weekId, absences);
        const week = this.weeks.find(item => item.id === weekId);
        if (!week || !Array.isArray(absences)) throw new Error('Không tìm thấy trận.');
        const members = new Set(week.participants.map(item => item.username));
        const next = [...new Set(absences)].filter(username => members.has(username));
        return this.queueWeeklyChange({ ...copy(week), absences: next, version: week.version + 1 }, { type: 'absences', weekId, value: next, version: week.version });
    };
    repo.setWeekTeams = async function (record, kind, teams) {
        this.activate();
        if (!this.offlineMode) return original.setWeekTeams.call(this, record, kind, teams);
        const week = this.weeks.find(item => item.id === record.id);
        if (!week || !['sections', 'groups'].includes(kind) || !Array.isArray(teams) || week.version !== record.version) throw new Error('Thông tin tổ/nhóm đã thay đổi.');
        const members = new Set(week.participants.map(item => item.username)), assigned = new Set(), other = week.teams.filter(team => (team.kind || week.mode) !== kind), ids = new Set(other.map(team => team.id));
        for (const team of teams) {
            if (!team.id || ids.has(team.id) || typeof team.name !== 'string' || !team.name.trim() || team.name.trim().length > 160 || !Array.isArray(team.members)) throw new Error('Thông tin tổ/nhóm không hợp lệ.');
            ids.add(team.id);
            for (const member of team.members) { if (!members.has(member) || assigned.has(member)) throw new Error('Thành viên không hợp lệ hoặc thuộc nhiều tổ/nhóm.'); assigned.add(member); }
        }
        if (kind === week.mode && [...members].some(member => !assigned.has(member))) throw new Error('Cần phân đủ học sinh của tuần.');
        const normalized = teams.map(team => ({ id: team.id, name: team.name.trim(), kind, members: [...team.members] }));
        return this.queueWeeklyChange({ ...copy(week), teams: [...other, ...normalized], version: week.version + 1 }, { type: 'teams', weekId: week.id, kind, value: normalized, version: week.version });
    };
    repo.deleteWeek = async function (record) {
        this.activate();
        if (!this.offlineMode) return original.deleteWeek.call(this, record);
        const week = this.weeks.find(item => item.id === record.id);
        if (!week || week.version !== record.version) throw new Error('Tuần đã thay đổi.');
        const create = this.offlineQueue.find(op => op.weekId === week.id && op.type === 'create');
        if (create && !create.sent) {
            this.saveOfflineState(this.weeks.filter(item => item.id !== week.id), this.offlineQueue.filter(op => op.weekId !== week.id));
            return;
        }
        this.queueWeeklyChange(null, { type: 'delete', weekId: week.id, version: week.version });
    };
    const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
    const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
    repo.sendOfflineOperation = async function (op) {
        if (op.type === 'create') return this.week(await this.rpc('classroom_create_week', { p_week: op.record }));
        if (op.type === 'point') return this.week(await this.rpc('classroom_add_point', { p_week_id: op.weekId, p_username: op.username, p_delta: op.delta, p_event_id: op.eventId }));
        const rows = await this.rows('classroom_weeks', 'id,name,classlevel,class_name,start_date,end_date,mode,participants,teams,scores,absences,version');
        const remote = rows.find(item => item.id === op.weekId);
        if (op.type === 'delete' && !remote) return null;
        if (!remote) throw new Error('Tuần trên máy chủ đã bị xóa. Bản Offline vẫn được giữ để kiểm tra.');
        if (remote.version !== op.version) {
            // A previous send may have committed but lost its response. Accept
            // only that exact next version with the identical intended content.
            const actual = op.type === 'absences' ? remote.absences : (remote.teams || []).filter(team => (team.kind || remote.mode) === op.kind);
            if (op.wasSent && remote.version === op.version + 1 && ['teams', 'absences'].includes(op.type) && same(actual, op.value)) return this.week(remote);
            throw new Error('Tuần đã được sửa trên thiết bị khác. Bản Offline còn nguyên; cần kiểm tra xung đột trước khi đồng bộ tiếp.');
        }
        if (op.type === 'teams') return this.week(await this.rpc('classroom_set_week_teams', { p_id: op.weekId, p_kind: op.kind, p_teams: op.value, p_version: op.version }));
        if (op.type === 'absences') return this.week(await this.rpc('classroom_set_absences', { p_week_id: op.weekId, p_absences: op.value, p_version: op.version }));
        if (op.type === 'delete') { await this.rpc('classroom_delete_week', { p_id: op.weekId, p_version: op.version }); return null; }
        throw new Error('Thao tác Offline không hợp lệ.');
    };
    repo.projectOfflineOperation = function (week, op) {
        if (op.type === 'delete') return null;
        if (!week) throw new Error('Tuần không còn tồn tại để khôi phục thao tác.');
        if (op.type === 'point') {
            week.scores[op.username] = Number(week.scores[op.username] || 0) + op.delta;
            if (week.scores[op.username] < 0) throw new Error('Điểm máy chủ đã thay đổi; bản Offline được giữ để kiểm tra.');
        } else if (op.type === 'absences') week.absences = copy(op.value);
        else if (op.type === 'teams') week.teams = [...week.teams.filter(team => (team.kind || week.mode) !== op.kind), ...copy(op.value)];
        else throw new Error('Thao tác Offline không hợp lệ.');
        week.version++;
        return week;
    };
    repo.syncOffline = async function () {
        this.activate();
        if (this.offlineSyncing) throw new Error('Đang đồng bộ. Hãy chờ hoàn tất.');
        const owner = this.owner, client = this.getClient();
        if (!client?.auth?.getUser) throw new Error('Đăng nhập lại đúng tài khoản khi có mạng để đồng bộ.');
        this.offlineAuthUserId = app.data.currentUser.auth_user_id || this.offlineAuthUserId;
        this.offlineSyncing = true;
        try {
            const { data, error } = await client.auth.getUser();
            if (error || !this.offlineAuthUserId || data?.user?.id !== this.offlineAuthUserId) throw new Error('Đăng nhập lại đúng tài khoản khi có mạng để đồng bộ.');
            while (this.offlineQueue.length) {
                this.activate();
                if (this.owner !== owner) throw new Error('Tài khoản đã thay đổi.');
                const op = copy(this.offlineQueue[0]); op.wasSent = !!op.sent;
                this.saveOfflineState(this.weeks, this.offlineQueue.map((item, index) => index === 0 ? { ...item, sent: true } : item));
                let saved = await this.sendOfflineOperation(op);
                this.activate();
                if (this.owner !== owner) throw new Error('Tài khoản đã thay đổi.');
                const remaining = this.offlineQueue.slice(1);
                for (const pending of remaining.filter(item => item.weekId === op.weekId)) {
                    saved = this.projectOfflineOperation(saved, pending);
                }
                const weeks = this.weeks.filter(item => item.id !== op.weekId);
                if (saved) weeks.push(saved);
                this.saveOfflineState(weeks, remaining);
                if (op.type === 'delete') this.deletedWeekIds.add(op.weekId);
            }
            this.saveOfflineState(this.weeks, [], false);
            this.cacheServerState(); this.loaded = false;
            await this.ensure(true);
        } finally { this.offlineSyncing = false; }
        return this;
    };
    // Hold the same browser lock for an entire sync and every local mutation.
    // A second tab then detects its stale revision instead of losing an outbox.
    for (const name of ['setOffline', 'point', 'createWeek', 'setAbsences', 'setWeekTeams', 'deleteWeek', 'syncOffline']) {
        const method = repo[name];
        repo[name] = async function (...args) {
            this.activate();
            if (this.offlineFault) throw new Error(this.offlineFault);
            const owner = this.owner;
            if (!navigator.locks) return method.apply(this, args);
            return navigator.locks.request(`weekly-offline:${owner}`, async () => {
                this.activate();
                if (this.owner !== owner) throw new Error('Tài khoản đã thay đổi.');
                return method.apply(this, args);
            });
        };
    }
})();
