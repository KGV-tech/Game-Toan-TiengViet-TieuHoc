/* Classroom administration has its own records; no game scores or rewards. */
(function () {
    const copy = value => JSON.parse(JSON.stringify(value));
    const api = {
        owner: '', sections: [], weeks: [], deletedWeekIds: new Set(), status: 'local', error: '', client: null, pending: null, loaded: false,
        configure(client) { this.client = client; this.loaded = false; },
        activate() {
            if (!app.admin.isAdminUser()) throw new Error('Chỉ Admin được quản lý lớp.');
            const owner = app.data.currentUser.id || app.data.currentUser.username;
            if (!owner) throw new Error('Chưa xác định tài khoản Admin.');
            if (this.owner !== owner) {
                this.owner = owner; this.loaded = false; this.pending = null; this.error = ''; this.status = 'local';
                this.sections = []; this.weeks = []; this.deletedWeekIds = new Set();
                try {
                    const local = JSON.parse(localStorage.getItem(`classroom:v1:${owner}`) || 'null');
                    if (local) {
                        this.sections = Array.isArray(local.sections) ? local.sections : [];
                        this.weeks = Array.isArray(local.weeks) ? local.weeks : [];
                    } else {
                        const legacy = JSON.parse(localStorage.getItem(`student-roster-drafts:v1:${owner}`) || '[]');
                        this.sections = Array.isArray(legacy) ? legacy.filter(record => record?.type === 'sections' && typeof record.name === 'string' && Array.isArray(record.members)).map(record => ({ ...record, version: 0 })) : [];
                    }
                } catch (_) { this.error = 'Không đọc được dữ liệu lưu trên máy. Chưa cho phép ghi đè.'; }
            }
            return this;
        },
        getClient() { return this.client || (supabaseClient !== dummySupabase ? supabaseClient : null); },
        localCommit(sections, weeks) {
            if (this.error && this.status === 'local') throw new Error(this.error);
            try { localStorage.setItem(`classroom:v1:${this.owner}`, JSON.stringify({ sections, weeks })); }
            catch (_) { throw new Error('Trình duyệt không cho lưu. Nội dung chưa được lưu.'); }
            this.sections = sections; this.weeks = weeks;
        },
        cacheServerState() {
            // Server acknowledgement remains authoritative when a browser blocks its cache.
            try { localStorage.setItem(`classroom:v1:${this.owner}`, JSON.stringify({ sections: this.sections, weeks: this.weeks })); } catch (_) { /* Non-fatal cache failure. */ }
        },
        message(error) {
            if (['42P01', 'PGRST202', 'PGRST205'].includes(error?.code)) return 'Chưa có cấu trúc lưu Tổ/Thi đua tuần trên máy chủ. Cần áp dụng migration đã duyệt.';
            const known = { week_conflict: 'Tuần đã được thay đổi trên thiết bị khác. Tải lại trước khi lưu hoặc xóa.', section_conflict: 'Tổ đã được thay đổi trên thiết bị khác. Tải lại trước khi lưu.', member_conflict: 'Học sinh đã thuộc tổ khác trong lớp.', invalid_members: 'Danh sách học sinh đã thay đổi hoặc không thuộc lớp đã chọn.', duplicate_section: 'Tên tổ đã tồn tại trong lớp.', forbidden: 'Bạn không có quyền quản lý.', invalid_week: 'Thông tin tuần hoặc danh sách thành viên không hợp lệ.', point_conflict: 'Lượt điểm đã thay đổi. Tải lại bảng điểm.' };
            return known[error?.message] || 'Chưa thể đồng bộ. Kiểm tra kết nối rồi thử lại; nội dung đang soạn được giữ nguyên.';
        },
        async rows(table, fields) {
            const result = [];
            for (let offset = 0; ; offset += 500) {
                const { data, error } = await this.getClient().from(table).select(fields).order('id').range(offset, offset + 499);
                if (error) throw error;
                if (!Array.isArray(data)) throw new Error('invalid_response');
                result.push(...data);
                if (data.length < 500) return result;
            }
        },
        section(row) { return { id: row.id, type: 'sections', name: row.name, classlevel: row.classlevel, className: row.class_name || '', members: row.members || [], version: row.version }; },
        week(row) { return { id: row.id, name: row.name, classlevel: row.classlevel, className: row.class_name || '', startDate: row.start_date, endDate: row.end_date, mode: row.mode, participants: row.participants || [], teams: row.teams || [], scores: row.scores || {}, absences: row.absences || [], version: row.version }; },
        async ensure(force = false) {
            this.activate();
            if (!this.getClient()) { this.loaded = true; return this; }
            if (this.loaded && !force) return this;
            if (this.pending) return this.pending;
            const owner = this.owner;
            this.status = 'loading';
            this.pending = (async () => {
                try {
                    const [sections, weeks] = await Promise.all([
                        this.rows('classroom_sections', 'id,name,classlevel,class_name,members,version'),
                        this.rows('classroom_weeks', 'id,name,classlevel,class_name,start_date,end_date,mode,participants,teams,scores,absences,version')
                    ]);
                    if (this.owner !== owner || !app.admin.isAdminUser() || (app.data.currentUser.id || app.data.currentUser.username) !== owner) return this;
                    const savedSections = sections.map(row => this.section(row));
                    const drafts = this.sections.filter(record => !record.version && !savedSections.some(saved => saved.id === record.id));
                    const savedWeeks = weeks.filter(row => !this.deletedWeekIds.has(row.id)).map(row => { const saved = this.week(row), current = this.weeks.find(week => week.id === saved.id); return current && !current.localOnly && current.version > saved.version ? current : saved; });
                    const localWeeks = this.weeks.filter(week => week.localOnly && !savedWeeks.some(saved => saved.id === week.id));
                    this.sections = [...savedSections, ...drafts]; this.weeks = [...savedWeeks, ...localWeeks];
                    this.loaded = true; this.status = 'synced'; this.error = '';
                    this.cacheServerState();
                } catch (error) { if (this.owner === owner) { this.status = 'error'; this.error = this.message(error); } }
                finally { if (this.owner === owner) this.pending = null; }
                return this;
            })();
            return this.pending;
        },
        async rpc(name, args) {
            this.activate();
            const owner = this.owner;
            const { data, error } = await this.getClient().rpc(name, args);
            if (error) throw new Error(this.message(error));
            if (!app.admin.isAdminUser() || (app.data.currentUser.id || app.data.currentUser.username) !== owner) throw new Error('Tài khoản đã thay đổi.');
            const row = Array.isArray(data) ? data[0] : data;
            if (!row || typeof row !== 'object') throw new Error('Máy chủ chưa xác nhận lưu dữ liệu.');
            return row;
        },
        async saveSection(record) {
            this.activate();
            if (!this.getClient() && record.version) throw new Error('Tổ này đã lưu trên máy chủ. Kết nối lại để chỉnh sửa.');
            if (!this.getClient()) { this.localCommit([...this.sections.filter(item => item.id !== record.id), copy(record)], this.weeks); return record; }
            const row = await this.rpc('classroom_save_section', { p_id: record.id, p_name: record.name, p_classlevel: record.classlevel, p_class_name: record.className, p_members: record.members, p_version: record.version || 0 });
            const saved = this.section(row);
            this.sections = [...this.sections.filter(item => item.id !== saved.id), saved];
            this.cacheServerState();
            return saved;
        },
        async removeSection(record) {
            this.activate();
            if (!this.getClient() && record.version) throw new Error('Tổ này đã lưu trên máy chủ. Kết nối lại để xóa.');
            if (this.getClient() && record.version) await this.rpc('classroom_delete_section', { p_id: record.id, p_version: record.version });
            else this.localCommit(this.sections.filter(item => item.id !== record.id), this.weeks);
            this.sections = this.sections.filter(item => item.id !== record.id);
            if (this.getClient()) this.cacheServerState();
        },
        async createWeek(record) {
            this.activate();
            let saved = copy(record);
            if (this.getClient()) saved = this.week(await this.rpc('classroom_create_week', { p_week: record }));
            else { saved.localOnly = true; this.localCommit(this.sections, [...this.weeks, saved]); }
            this.weeks = [...this.weeks.filter(item => item.id !== saved.id), saved];
            if (this.getClient()) this.cacheServerState();
            return saved;
        },
        async setWeekTeams(record, kind, teams) {
            this.activate();
            const week = this.weeks.find(item => item.id === record.id);
            if (!week || !['sections', 'groups'].includes(kind) || !Array.isArray(teams)) throw new Error('Thông tin tổ/nhóm không hợp lệ.');
            if (!week.localOnly && !this.getClient()) throw new Error('Kết nối lại để cập nhật tuần đã đồng bộ.');
            if (week.localOnly && this.getClient()) throw new Error('Lưu tuần lên máy chủ trước khi chỉnh sửa tổ/nhóm.');
            if (week.version !== record.version) throw new Error(this.message({ message: 'week_conflict' }));
            const participants = new Set(week.participants.map(student => student.username)), assigned = new Set(), ids = new Set();
            const other = week.teams.filter(team => (team.kind || week.mode) !== kind);
            for (const team of other) ids.add(team.id);
            for (const team of teams) {
                if (typeof team.id !== 'string' || !team.id || ids.has(team.id) || typeof team.name !== 'string' || !team.name.trim() || team.name.trim().length > 160 || !Array.isArray(team.members)) throw new Error('Thông tin tổ/nhóm không hợp lệ.');
                ids.add(team.id);
                for (const member of team.members) { if (!participants.has(member) || assigned.has(member)) throw new Error('Thành viên không hợp lệ hoặc thuộc nhiều tổ/nhóm.'); assigned.add(member); }
            }
            if (kind === week.mode && [...participants].some(member => !assigned.has(member))) throw new Error('Cần phân đủ học sinh của tuần.');
            const normalized = teams.map(team => ({ id: team.id, name: team.name.trim(), kind, members: [...team.members] }));
            let saved;
            if (this.getClient()) {
                saved = this.week(await this.rpc('classroom_set_week_teams', { p_id: week.id, p_kind: kind, p_teams: normalized, p_version: record.version }));
                const current = this.weeks.find(item => item.id === week.id);
                if (this.deletedWeekIds.has(week.id)) throw new Error('Tuần đã bị xóa.');
                if (current && current.version > saved.version) saved = current;
            }
            else { saved = { ...copy(week), teams: [...other, ...normalized], version: week.version + 1 }; this.localCommit(this.sections, this.weeks.map(item => item.id === week.id ? saved : item)); }
            this.weeks = this.weeks.map(item => item.id === week.id ? saved : item);
            if (this.getClient()) this.cacheServerState();
            return saved;
        },
        async deleteWeek(record) {
            this.activate();
            const week = this.weeks.find(item => item.id === record.id);
            if (!week) throw new Error('Không tìm thấy tuần thi đua.');
            if (!week.localOnly && !this.getClient()) throw new Error('Kết nối lại máy chủ để xóa tuần đã đồng bộ.');
            if (!week.localOnly) await this.rpc('classroom_delete_week', { p_id: week.id, p_version: record.version });
            else this.localCommit(this.sections, this.weeks.filter(item => item.id !== week.id));
            // An earlier in-flight read must not resurrect this confirmed deletion.
            this.deletedWeekIds.add(week.id);
            this.weeks = this.weeks.filter(item => item.id !== week.id);
            if (this.getClient()) this.cacheServerState();
        },
        async syncWeek(record) {
            this.activate();
            if (!this.getClient() || !record.localOnly) throw new Error('Không có trận cần đồng bộ.');
            return this.createWeek(record);
        },
        async point(weekId, username, delta = 1, eventId = crypto.randomUUID()) {
            this.activate();
            const week = this.weeks.find(item => item.id === weekId);
            if (week && !week.localOnly && !this.getClient()) throw new Error('Trận này đã lưu trên máy chủ. Kết nối lại để cập nhật điểm.');
            if (week?.localOnly && this.getClient()) throw new Error('Trận này chỉ lưu trên máy. Lưu trận lên máy chủ trước khi cộng điểm.');
            if (!week || !week.participants.some(item => item.username === username) || ![1, -1].includes(delta)) throw new Error('Học sinh không thuộc trận đã chọn.');
            let saved;
            if (this.getClient()) saved = this.week(await this.rpc('classroom_add_point', { p_week_id: weekId, p_username: username, p_delta: delta, p_event_id: eventId }));
            else {
                saved = copy(week);
                const value = Number(saved.scores[username] || 0) + delta;
                if (value < 0) throw new Error('Điểm không thể nhỏ hơn 0.');
                saved.scores[username] = value;
                this.localCommit(this.sections, this.weeks.map(item => item.id === weekId ? saved : item));
            }
            this.weeks = this.weeks.map(item => item.id === weekId ? saved : item);
            if (this.getClient()) this.cacheServerState();
            return saved;
        },
        async setAbsences(weekId, absences) {
            this.activate();
            const week = this.weeks.find(item => item.id === weekId);
            if (week && !week.localOnly && !this.getClient()) throw new Error('Trận này đã lưu trên máy chủ. Kết nối lại để cập nhật vắng mặt.');
            if (week?.localOnly && this.getClient()) throw new Error('Trận này chỉ lưu trên máy. Lưu trận lên máy chủ trước khi cập nhật vắng mặt.');
            if (!week) throw new Error('Không tìm thấy trận.');
            const members = new Set(week.participants.map(item => item.username));
            const next = [...new Set(absences)].filter(username => members.has(username));
            let saved;
            if (this.getClient()) saved = this.week(await this.rpc('classroom_set_absences', { p_week_id: weekId, p_absences: next, p_version: week.version }));
            else { saved = { ...copy(week), absences: next }; this.localCommit(this.sections, this.weeks.map(item => item.id === weekId ? saved : item)); }
            this.weeks = this.weeks.map(item => item.id === weekId ? saved : item);
            if (this.getClient()) this.cacheServerState();
            return saved;
        }
    };
    app.classroom = api;
})();
