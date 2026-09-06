// Supabase persistence/realtime adapter for team competitions.
// The domain module remains usable offline; this adapter is enabled only when
// the authenticated Supabase client and the approved migration are available.
;(function (root) {
    const app = root.app;
    const api = app?.teamCompetition;
    if (!app || !api) return;

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const state = {
        client: null,
        enabled: false,
        status: 'offline',
        error: null,
        syncing: false,
        syncPromise: null,
        pendingWrite: Promise.resolve(),
        idMap: new Map(),
        channel: null,
        syncTimer: null,
        submitPending: false
    };

    const originalStore = {
        list: api.store.list.bind(api.store),
        get: api.store.get.bind(api.store),
        upsert: api.store.upsert.bind(api.store),
        remove: api.store.remove.bind(api.store),
        clear: api.store.clear.bind(api.store)
    };

    function isAdmin() {
        return String(app.data?.currentUser?.role || '').toLowerCase() === 'admin';
    }

    function isClient(value) {
        return value && typeof value.from === 'function' && typeof value.rpc === 'function';
    }

    function makeUuid() {
        try {
            if (root.crypto?.randomUUID) return root.crypto.randomUUID();
        } catch (_) { /* older browser */ }
        const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = bytes.map(value => value.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    function mapId(value, prefix) {
        const key = String(value || '');
        if (UUID_RE.test(key)) return key;
        if (!state.idMap.has(`${prefix}:${key}`)) state.idMap.set(`${prefix}:${key}`, makeUuid());
        return state.idMap.get(`${prefix}:${key}`);
    }

    function toDateValue(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        const parsed = Date.parse(String(value));
        return Number.isFinite(parsed) ? parsed : null;
    }

    function toNumber(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function firstRow(data) {
        return Array.isArray(data) ? data[0] || null : data || null;
    }

    function copy(value) {
        if (value === null || value === undefined) return value;
        try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
    }

    function normalizeForRemote(input) {
        const normalized = api.normalizeCompetition(input);
        return {
            ...normalized,
            id: mapId(normalized.id, 'competition'),
            teams: normalized.teams.map((team, index) => ({
                ...team,
                id: mapId(team.id || `team-${index + 1}`, 'team'),
                memberUsernames: Array.from(new Set(team.memberUsernames || []))
            }))
        };
    }

    function mapAttemptRow(row, answers = []) {
        if (!row) return null;
        return {
            id: String(row.id),
            competitionId: String(row.competition_id),
            teamId: String(row.team_id),
            leaderUsername: String(row.leader_username || ''),
            sessionId: row.session_id || null,
            status: row.status,
            lockReason: row.lock_reason || null,
            questionCount: toNumber(row.question_count),
            currentIndex: toNumber(row.current_index),
            submittedCount: toNumber(row.submitted_count),
            correctCount: toNumber(row.correct_count),
            score: toNumber(row.score),
            startedAt: toDateValue(row.started_at),
            completedAt: toDateValue(row.completed_at),
            lockedAt: toDateValue(row.locked_at),
            durationSeconds: row.duration_seconds === null ? null : toNumber(row.duration_seconds),
            updatedAt: toDateValue(row.updated_at),
            answers: answers.filter(answer => String(answer.attempt_id) === String(row.id)).sort((a, b) => toNumber(a.question_index) - toNumber(b.question_index)).map(answer => answer.selected_answer),
            details: answers.filter(answer => String(answer.attempt_id) === String(row.id)).sort((a, b) => toNumber(a.question_index) - toNumber(b.question_index)).map(answer => ({
                points: toNumber(answer.points),
                isCorrect: Boolean(answer.is_correct),
                questionIndex: toNumber(answer.question_index),
                submittedAt: toDateValue(answer.submitted_at)
            }))
        };
    }

    function mapCompetitionRows(compRows, teamRows, memberRows, attemptRows, answerRows, resultRows) {
        const teamsByCompetition = new Map();
        const membersByTeam = new Map();
        const attemptsByTeam = new Map();
        const resultsByCompetition = new Map();

        memberRows.forEach(member => {
            const key = String(member.team_id);
            if (!membersByTeam.has(key)) membersByTeam.set(key, []);
            membersByTeam.get(key).push(member);
        });
        attemptRows.forEach(attempt => attemptsByTeam.set(String(attempt.team_id), mapAttemptRow(attempt, answerRows)));
        resultRows.forEach(result => {
            const key = String(result.competition_id);
            if (!resultsByCompetition.has(key)) resultsByCompetition.set(key, []);
            resultsByCompetition.get(key).push({
                id: result.id,
                competitionId: result.competition_id,
                teamId: result.team_id,
                username: result.username,
                individualScore: toNumber(result.individual_score),
                teamRank: toNumber(result.team_rank),
                recordedAt: toDateValue(result.created_at)
            });
        });
        teamRows.forEach(row => {
            const key = String(row.competition_id);
            if (!teamsByCompetition.has(key)) teamsByCompetition.set(key, []);
            const members = (membersByTeam.get(String(row.id)) || []).sort((a, b) => toNumber(a.position) - toNumber(b.position));
            const attempt = attemptsByTeam.get(String(row.id));
            teamsByCompetition.get(key).push({
                id: String(row.id),
                name: row.name,
                memberUsernames: members.map(member => String(member.username)),
                leaderUsername: row.leader_username,
                examId: row.exam_id || null,
                targetMemberCount: row.target_member_count === null ? null : toNumber(row.target_member_count),
                status: row.status || 'pending',
                score: toNumber(row.score),
                submittedCount: toNumber(row.submitted_count),
                correctCount: toNumber(row.correct_count),
                startedAt: toDateValue(row.started_at),
                completedAt: toDateValue(row.completed_at),
                lockedAt: toDateValue(row.locked_at),
                durationSeconds: row.duration_seconds === null ? null : toNumber(row.duration_seconds),
                attempt: attempt || null
            });
        });

        return compRows.map(row => {
            const teams = (teamsByCompetition.get(String(row.id)) || []).sort((a, b) => {
                const left = teamRows.find(item => String(item.id) === String(a.id));
                const right = teamRows.find(item => String(item.id) === String(b.id));
                return toNumber(left?.position) - toNumber(right?.position);
            });
            const attempts = {};
            teams.forEach(team => { if (team.attempt) attempts[team.id] = team.attempt; });
            return api.normalizeCompetition({
                id: String(row.id),
                name: row.name,
                classlevel: row.classlevel,
                participantMode: row.participant_mode,
                questionMode: row.question_mode,
                commonExamId: row.common_exam_id || null,
                timeLimitMinutes: row.time_limit_minutes === null ? null : toNumber(row.time_limit_minutes),
                status: row.status,
                createdAt: toDateValue(row.created_at) || Date.now(),
                updatedAt: toDateValue(row.updated_at) || Date.now(),
                startedAt: toDateValue(row.started_at),
                endedAt: toDateValue(row.ended_at),
                version: toNumber(row.version, 1),
                teams,
                teamCount: teams.length,
                selectedStudentUsernames: teams.flatMap(team => team.memberUsernames),
                attempts,
                results: resultsByCompetition.get(String(row.id)) || []
            });
        });
    }

    function remoteError(error) {
        if (!error) return null;
        const text = `${error.code || ''} ${error.message || error.details || error.hint || error}`.trim();
        const result = new Error(text || 'Supabase request failed');
        result.code = error.code;
        result.details = error.details;
        result.cause = error;
        return result;
    }

    async function requireResult(result) {
        const response = await result;
        if (response?.error) throw remoteError(response.error);
        return response?.data;
    }

    async function fetchRows(table, columns = '*') {
        return requireResult(state.client.from(table).select(columns));
    }

    async function invoke(name, args) {
        return requireResult(state.client.rpc(name, args));
    }

    function sessionStorageApi() {
        try { return typeof root.sessionStorage === 'undefined' ? null : root.sessionStorage; } catch (_) { return null; }
    }

    function sessionKey(attempt) { return `team_attempt_session_${attempt?.id || ''}`; }
    function readSessionId(attempt) {
        const storage = sessionStorageApi();
        if (!storage || !attempt?.id) return null;
        try { return storage.getItem(sessionKey(attempt)) || null; } catch (_) { return null; }
    }
    function markSession(attempt, active) {
        const storage = sessionStorageApi();
        if (!storage || !attempt?.id) return;
        try {
            if (active && attempt.sessionId) storage.setItem(sessionKey(attempt), attempt.sessionId);
            else storage.removeItem(sessionKey(attempt));
        } catch (_) { /* private mode */ }
    }
    function hasSessionMarker(attempt) { return Boolean(readSessionId(attempt)); }
    function navType() {
        try { return root.performance?.getEntriesByType?.('navigation')?.[0]?.type || ''; } catch (_) { return ''; }
    }

    function scheduleSync() {
        if (!state.enabled || state.syncTimer) return;
        state.syncTimer = setTimeout(() => {
            state.syncTimer = null;
            remote.syncRemote({ silent: true });
        }, 120);
    }

    function installRealtime() {
        if (!state.client?.channel || state.channel) return;
        try {
            let channel = state.client.channel('team-competition-live');
            ['team_competitions', 'team_competition_teams', 'team_competition_members', 'team_competition_questions', 'team_competition_attempts', 'team_competition_answers', 'team_competition_results'].forEach(table => {
                channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleSync);
            });
            state.channel = channel.subscribe(status => {
                if (status === 'SUBSCRIBED') state.realtime = 'connected';
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') state.realtime = 'error';
            });
        } catch (error) {
            state.realtime = 'error';
            console.warn('Không thể đăng ký realtime thi đua nhóm:', error);
        }
    }

    async function loadRemoteQuestions() {
        const rows = await fetchRows('team_competition_questions', 'id,competition_id,team_id,question_index,question_payload,question_type,answer_count,part_answer_counts');
        api.clearRemoteQuestions();
        rows.forEach(row => {
            const key = `${row.competition_id}:${row.team_id}`;
            if (!loadRemoteQuestions.cache.has(key)) loadRemoteQuestions.cache.set(key, []);
            loadRemoteQuestions.cache.get(key).push({
                ...(row.question_payload || {}),
                type: row.question_payload?.type || row.question_type,
                partAnswerCounts: row.question_payload?.partAnswerCounts || row.part_answer_counts || undefined,
                remoteQuestionId: row.id,
                questionIndex: toNumber(row.question_index)
            });
        });
        loadRemoteQuestions.cache.forEach((questions, key) => {
            questions.sort((a, b) => a.questionIndex - b.questionIndex);
            const [competitionId, teamId] = key.split(':');
            api.setRemoteQuestions(competitionId, teamId, questions);
        });
        loadRemoteQuestions.cache.clear();
        return rows;
    }
    loadRemoteQuestions.cache = new Map();

    const remote = {
        // The domain module delegates leader actions here when this adapter is
        // enabled. Remote methods never call those public hooks recursively.
        _delegating: false,
        client: null,
        enabled: false,
        status: 'offline',
        realtime: 'disconnected',
        isReady() { return state.enabled && state.status === 'ready'; },
        getStatus() { return state.status; },
        getError() { return state.error; },
        configure(client) {
            if (state.client === client && state.enabled) return this;
            state.client = client;
            state.enabled = isClient(client) && Boolean(root.supabase);
            state.status = state.enabled ? 'pending' : 'offline';
            state.error = null;
            this.client = client;
            this.enabled = state.enabled;
            this.status = state.status;
            if (state.enabled) installRealtime();
            return this;
        },
        async syncRemote(options = {}) {
            if (!state.enabled || !app.data?.currentUser) return [];
            if (state.syncPromise) return state.syncPromise;
            state.syncPromise = (async () => {
                try {
                    const [compRows, teamRows, memberRows, attemptRows, answerRows, resultRows] = await Promise.all([
                        fetchRows('team_competitions'),
                        fetchRows('team_competition_teams'),
                        fetchRows('team_competition_members'),
                        fetchRows('team_competition_attempts'),
                        fetchRows('team_competition_answers'),
                        fetchRows('team_competition_results')
                    ]);
                    await loadRemoteQuestions();
                    const competitions = mapCompetitionRows(compRows || [], teamRows || [], memberRows || [], attemptRows || [], answerRows || [], resultRows || []);
                    state.syncing = true;
                    originalStore.clear();
                    api.attemptStore.clear?.();
                    competitions.forEach(item => originalStore.upsert(item));
                    competitions.forEach(item => Object.values(item.attempts || {}).forEach(attempt => api.attemptStore.upsert(attempt)));
                    state.syncing = false;
                    state.status = 'ready';
                    state.error = null;
                    remote.status = state.status;
                    if (!options.silent) {
                        if (isAdmin() && document.getElementById('treasure-modal')?.classList.contains('active') && app.admin?.questMode === 'team') {
                            app.admin.renderQuests(document.getElementById('treasure-content-area'));
                        }
                        if (!isAdmin() && document.getElementById('quest-modal')?.classList.contains('active')) app.quest?.render();
                    }
                    return competitions;
                } catch (error) {
                    state.syncing = false;
                    state.error = error;
                    state.status = 'schema_missing';
                    remote.status = state.status;
                    console.warn('Chưa đồng bộ được thi đua nhóm từ Supabase:', error.message || error);
                    return originalStore.list();
                } finally {
                    state.syncPromise = null;
                }
            })();
            return state.syncPromise;
        },
        flush() { return state.pendingWrite; },
        async persistCompetition(input) {
            if (!state.enabled || !isAdmin()) return input;
            const candidate = normalizeForRemote(input);
            if (candidate.status === api.STATUS.ACTIVE) return this.startCompetition(candidate.id);
            if (candidate.status === api.STATUS.ENDED) return this.endCompetition(candidate.id);

            const row = {
                id: candidate.id,
                name: candidate.name,
                classlevel: candidate.classlevel,
                participant_mode: candidate.participantMode,
                question_mode: candidate.questionMode,
                common_exam_id: candidate.questionMode === 'same' ? candidate.commonExamId : null,
                time_limit_minutes: candidate.timeLimitMinutes,
                status: 'draft',
                version: candidate.version || 1
            };
            await requireResult(state.client.from('team_competitions').upsert(row, { onConflict: 'id' }));
            // Draft/prepared edits have no attempts yet, so replacing the team
            // roster atomically keeps deleted members and stale snapshots out.
            await requireResult(state.client.from('team_competition_members').delete().eq('competition_id', candidate.id));
            await requireResult(state.client.from('team_competition_teams').delete().eq('competition_id', candidate.id));
            const teamRows = candidate.teams.map((team, index) => ({
                id: team.id,
                competition_id: candidate.id,
                name: team.name,
                position: index + 1,
                target_member_count: team.targetMemberCount,
                leader_username: team.leaderUsername,
                exam_id: candidate.questionMode === 'same' ? candidate.commonExamId : team.examId,
                status: 'pending'
            }));
            if (teamRows.length) await requireResult(state.client.from('team_competition_teams').insert(teamRows));
            const memberRows = candidate.teams.flatMap(team => team.memberUsernames.map((username, index) => ({
                competition_id: candidate.id,
                team_id: team.id,
                username,
                position: index + 1
            })));
            if (memberRows.length) await requireResult(state.client.from('team_competition_members').insert(memberRows));

            for (const team of candidate.teams) {
                const examId = candidate.questionMode === 'same' ? candidate.commonExamId : team.examId;
                const exam = (app.data.exams || []).find(item => String(item.id) === String(examId));
                if (exam?.questions?.length) {
                    await invoke('team_competition_save_questions', { p_team_id: team.id, p_questions: copy(exam.questions) });
                }
            }
            if (candidate.status === api.STATUS.PREPARED) await this.prepareCompetition(candidate.id);
            return candidate;
        },
        async prepareCompetition(id) {
            const data = await invoke('team_competition_prepare', { p_competition_id: id });
            return firstRow(data);
        },
        async startCompetition(id) {
            const data = await invoke('team_competition_start', { p_competition_id: id });
            await this.syncRemote({ silent: true });
            return firstRow(data);
        },
        async endCompetition(id) {
            const data = await invoke('team_competition_end', { p_competition_id: id });
            await this.syncRemote({ silent: true });
            return firstRow(data);
        },
        async deleteCompetition(id) {
            if (!state.enabled || !isAdmin()) return;
            await requireResult(state.client.from('team_competitions').delete().eq('id', id));
        },
        async openLeaderAttempt(competitionId) {
            const user = app.data?.currentUser;
            if (!user || String(user.role || '').toLowerCase() === 'admin') return alert('Chỉ tài khoản học sinh được chỉ định làm trưởng nhóm mới có thể vào lượt.');
            const competition = api.store.get(competitionId);
            if (!competition || competition.status !== api.STATUS.ACTIVE) return alert('Trận thi đua chưa bắt đầu hoặc đã kết thúc.');
            const team = competition.teams.find(item => String(item.leaderUsername) === String(user.username));
            if (!team) return alert('Tài khoản này không phải trưởng nhóm của trận.');
            let existing = api.attemptStore.get(competition.id, team.id);
            if (existing?.status === api.ATTEMPT_STATUS.ACTIVE && (navType() === 'reload' || !hasSessionMarker(existing))) {
                try {
                    const locked = await this.lockAttempt(existing, 'refresh_or_close');
                    api.state.activeAttempt = locked;
                    api.renderLeaderLocked('Lượt trước đã bị khóa do refresh/đóng tab. Không thể làm tiếp.');
                    alert('Lượt trước đã bị khóa vì rời/refresh trình duyệt giữa chừng. Các câu đã nộp vẫn được tính điểm.');
                    return locked;
                } catch (error) {
                    return alert(error.message || 'Không thể khóa lượt trước trên máy chủ.');
                }
            }
            if (!api.getQuestionsForTeam(competition, team).length) {
                try {
                    const rows = await fetchRows('team_competition_questions');
                    const questions = rows.filter(row => String(row.team_id) === String(team.id)).sort((a, b) => toNumber(a.question_index) - toNumber(b.question_index)).map(row => ({ ...(row.question_payload || {}), type: row.question_payload?.type || row.question_type, partAnswerCounts: row.question_payload?.partAnswerCounts || row.part_answer_counts || undefined, questionIndex: toNumber(row.question_index) }));
                    api.setRemoteQuestions(competition.id, team.id, questions);
                } catch (error) {
                    return alert(error.message || 'Không thể tải bộ câu hỏi của đội.');
                }
            }
            const sessionId = existing?.sessionId && hasSessionMarker(existing) ? readSessionId(existing) : null;
            try {
                const data = await invoke('team_competition_start_attempt', {
                    p_competition_id: competition.id,
                    p_team_id: team.id,
                    p_session_id: sessionId
                });
                const attempt = mapAttemptRow(firstRow(data));
                if (!attempt) throw new Error('Máy chủ không trả về lượt làm.');
                api.state.activeCompetitionId = competition.id;
                api.state.activeAttempt = api.attemptStore.upsert(attempt);
                api.updateCompetitionTeamFromAttempt(attempt);
                markSession(attempt, true);
                api.installBeforeUnload();
                const questModal = document.getElementById('quest-modal');
                if (questModal) { questModal.style.display = 'none'; questModal.classList.remove('active'); }
                app.router?.open('team-competition-play-screen');
                if (attempt.status === api.ATTEMPT_STATUS.ACTIVE) api.renderLeaderQuestion();
                else api.renderLeaderLocked('Lượt của đội đã được khóa trước đó.');
                return attempt;
            } catch (error) {
                return alert(error.message || 'Không thể mở lượt thi đua đội.');
            }
        },
        async submitCurrentQuestion() {
            if (state.submitPending) return;
            const attempt = api.state.activeAttempt;
            if (!attempt || attempt.status !== api.ATTEMPT_STATUS.ACTIVE) return;
            const competition = api.store.get(attempt.competitionId);
            const team = competition?.teams.find(item => String(item.id) === String(attempt.teamId));
            const questions = api.getQuestionsForTeam(competition, team);
            const index = Number(attempt.currentIndex || 0);
            const question = questions[index];
            if (!question || typeof app.exam?.readQuestionAnswer !== 'function') return;
            const selected = app.exam.readQuestionAnswer(question, index);
            state.submitPending = true;
            const button = document.getElementById('team-play-submit');
            if (button) button.disabled = true;
            try {
                const data = await invoke('team_competition_submit_answer', {
                    p_attempt_id: attempt.id,
                    p_question_index: index,
                    p_selected_answer: selected,
                    p_session_id: attempt.sessionId
                });
                const updated = mapAttemptRow(firstRow(data));
                if (!updated) throw new Error('Máy chủ không trả về kết quả câu trả lời.');
                api.state.activeAttempt = api.attemptStore.upsert(updated);
                api.updateCompetitionTeamFromAttempt(updated);
                if (updated.status === api.ATTEMPT_STATUS.COMPLETED) {
                    markSession(updated, false);
                    api.removeBeforeUnload();
                    api.clearPlayTimer();
                    api.renderLeaderLocked(`Đã hoàn thành bài của ${team.name}. Điểm đội: ${Number(updated.score || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/10.`);
                } else {
                    api.renderLeaderQuestion();
                }
                return updated;
            } catch (error) {
                if (error.code === 'team_competition_timeout' || /locked|timeout|session/i.test(error.message || '')) {
                    await this.syncRemote({ silent: true });
                    const locked = api.attemptStore.get(attempt.competitionId, attempt.teamId) || { ...attempt, status: api.ATTEMPT_STATUS.LOCKED };
                    api.state.activeAttempt = locked;
                    markSession(locked, false);
                    api.removeBeforeUnload();
                    api.clearPlayTimer();
                    api.renderLeaderLocked('Lượt đội đã bị khóa; các câu đã nộp vẫn được tính điểm.');
                } else {
                    alert(error.message || 'Không thể lưu câu trả lời trên máy chủ.');
                }
            } finally {
                state.submitPending = false;
                if (button && api.state.activeAttempt?.status === api.ATTEMPT_STATUS.ACTIVE) button.disabled = false;
            }
        },
        async lockAttempt(attempt, reason = 'leader_exit') {
            if (!attempt) return attempt;
            const data = await invoke('team_competition_lock_attempt', {
                p_attempt_id: attempt.id,
                p_session_id: attempt.sessionId,
                p_reason: reason
            });
            const locked = mapAttemptRow(firstRow(data)) || { ...attempt, status: api.ATTEMPT_STATUS.LOCKED, lockReason: reason };
            api.attemptStore.upsert(locked);
            api.updateCompetitionTeamFromAttempt(locked);
            return locked;
        },
        async lockActiveAttempt(reason = 'leader_exit') {
            const attempt = api.state.activeAttempt;
            if (!attempt || attempt.status !== api.ATTEMPT_STATUS.ACTIVE) return attempt;
            const locked = await this.lockAttempt(attempt, reason);
            api.state.activeAttempt = locked;
            markSession(locked, false);
            api.clearPlayTimer();
            api.removeBeforeUnload();
            api.renderLeaderLocked(reason === 'timeout' ? 'Hết giờ — lượt đội đã tự động khóa.' : 'Lượt đội đã khóa và không thể làm tiếp.');
            return locked;
        }
    };

    // Wrap local writes so existing UI handlers stay synchronous while the
    // authenticated admin's mutation is serialized to the server in order.
    api.store.upsert = function (input) {
        const candidate = state.enabled && isAdmin() && !state.syncing ? normalizeForRemote(input) : input;
        const result = originalStore.upsert(candidate);
        if (state.enabled && isAdmin() && !state.syncing) {
            state.pendingWrite = state.pendingWrite
                .catch(() => {})
                .then(() => remote.persistCompetition(result))
                .catch(error => {
                    state.error = error;
                    state.status = 'error';
                    remote.status = state.status;
                    console.error('Không thể lưu thi đua nhóm lên Supabase:', error);
                });
        }
        return result;
    };
    api.store.remove = function (id) {
        const result = originalStore.remove(id);
        if (state.enabled && isAdmin() && !state.syncing) {
            state.pendingWrite = state.pendingWrite.catch(() => {}).then(() => remote.deleteCompetition(mapId(id, 'competition'))).catch(error => console.error('Không thể xóa trận thi đua trên Supabase:', error));
        }
        return result;
    };
    api.store.clear = function () { return originalStore.clear(); };

    api.remote = remote;
    api.configureSupabase = client => remote.configure(client);
    api.syncRemote = options => remote.syncRemote(options);

    if (app.data?.supabaseClient) remote.configure(app.data.supabaseClient);
})(typeof globalThis !== 'undefined' ? globalThis : this);
