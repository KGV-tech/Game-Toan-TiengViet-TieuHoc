// Thi đua đội nhóm: domain rules + local/demo adapter.
// Production persistence/realtime must be wired to an approved Supabase schema separately.
;(function (root) {
    const app = root.app || (root.app = {});

    const STATUS = Object.freeze({
        DRAFT: 'draft',
        PREPARED: 'prepared',
        ACTIVE: 'active',
        ENDED: 'ended'
    });
    const STATUS_LABELS = Object.freeze({
        [STATUS.DRAFT]: 'Nháp',
        [STATUS.PREPARED]: 'Đã chuẩn bị',
        [STATUS.ACTIVE]: 'Đang diễn ra',
        [STATUS.ENDED]: 'Đã kết thúc'
    });
    const STATUS_ORDER = Object.freeze([STATUS.DRAFT, STATUS.PREPARED, STATUS.ACTIVE, STATUS.ENDED]);
    const ATTEMPT_STATUS = Object.freeze({ ACTIVE: 'active', COMPLETED: 'completed', LOCKED: 'locked' });
    const STORAGE_KEY = 'team_competitions_v1';
    const ATTEMPT_STORAGE_KEY = 'team_competition_attempts_v1';
    const EVENT_NAME = 'team-competition-updated';

    const memory = {
        competitions: [],
        attempts: []
    };

    function nowValue(value) {
        const parsed = value instanceof Date ? value.getTime() : Number(value);
        return Number.isFinite(parsed) ? parsed : Date.now();
    }

    function makeId(prefix = 'team') {
        const random = Math.random().toString(36).slice(2, 8);
        return `${prefix}-${Date.now().toString(36)}-${random}`;
    }

    function normalizeClass(value) {
        return String(value ?? '').replace(/^Lớp\s*/i, '').trim();
    }

    function studentKey(student) {
        if (typeof student === 'string') return student.trim();
        return String(student?.username || student?.id || '').trim();
    }

    function isApprovedStudent(student) {
        if (!student || String(student.role || '').toLowerCase() === 'admin') return false;
        return student.approved !== false;
    }

    function fisherYates(items, rng = Math.random) {
        const output = items.slice();
        for (let index = output.length - 1; index > 0; index -= 1) {
            const raw = Number(rng());
            const normalized = Number.isFinite(raw) ? Math.min(0.999999999, Math.max(0, raw)) : Math.random();
            const swapIndex = Math.floor(normalized * (index + 1));
            [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
        }
        return output;
    }

    function distributeStudents(students, teamCount, options = {}) {
        const count = Number(teamCount);
        if (!Number.isInteger(count) || count < 1) throw new Error('teamCount must be a positive integer');
        const unique = [];
        const seen = new Set();
        (Array.isArray(students) ? students : []).forEach(student => {
            const key = studentKey(student);
            if (!key || seen.has(key)) return;
            seen.add(key);
            unique.push(student);
        });
        if (unique.length < count) throw new Error('Not enough students for the requested teams');

        const quotas = Array.isArray(options.quotas) && options.quotas.length
            ? options.quotas.map(Number)
            : null;
        if (quotas) {
            if (quotas.length !== count || quotas.some(size => !Number.isInteger(size) || size < 1)) {
                throw new Error('quotas must contain one positive integer per team');
            }
            if (quotas.reduce((sum, size) => sum + size, 0) !== unique.length) {
                throw new Error('quotas must add up to the selected student count');
            }
        }

        const shuffled = fisherYates(unique, options.rng || Math.random);
        const sizes = quotas || Array.from({ length: count }, (_, index) => {
            const base = Math.floor(unique.length / count);
            return base + (index < unique.length % count ? 1 : 0);
        });
        const groups = [];
        let offset = 0;
        sizes.forEach(size => {
            groups.push(shuffled.slice(offset, offset + size));
            offset += size;
        });
        return groups;
    }

    function buildTeams(options = {}) {
        const students = Array.isArray(options.students) ? options.students : [];
        const count = Number(options.teamCount);
        const mode = options.participantMode || options.mode || 'random';
        let groups;
        if (mode === 'manual') {
            const assignments = Array.isArray(options.assignments) ? options.assignments : [];
            groups = assignments.slice(0, count).map(group => {
                const usernames = Array.isArray(group) ? group : (group?.memberUsernames || []);
                const byKey = new Map(students.map(student => [studentKey(student), student]));
                return usernames.map(username => byKey.get(studentKey(username))).filter(Boolean);
            });
            while (groups.length < count) groups.push([]);
        } else {
            groups = distributeStudents(students, count, { quotas: options.quotas, rng: options.rng });
        }
        return groups.map((members, index) => {
            const source = Array.isArray(options.teams) ? options.teams[index] : null;
            const memberUsernames = members.map(studentKey).filter(Boolean);
            const requestedLeader = source?.leaderUsername || (Array.isArray(options.leaders) ? options.leaders[index] : '');
            return {
                id: source?.id || makeId(`team${index + 1}`),
                name: String(source?.name || options.names?.[index] || `Đội ${index + 1}`).trim() || `Đội ${index + 1}`,
                memberUsernames,
                leaderUsername: requestedLeader || memberUsernames[0] || '',
                examId: source?.examId || options.examIds?.[index] || null,
                targetMemberCount: Number.isInteger(Number(source?.targetMemberCount))
                    ? Number(source.targetMemberCount)
                    : (mode === 'random' ? memberUsernames.length : null)
            };
        });
    }

    function error(code, message, path = '') {
        return { code, message, ...(path ? { path } : {}) };
    }

    function examForId(exams, id) {
        if (!id) return null;
        return (Array.isArray(exams) ? exams : []).find(exam => String(exam.id) === String(id)) || null;
    }

    function examIdsForConfig(config) {
        const teams = Array.isArray(config?.teams) ? config.teams : [];
        const mode = config?.questionMode || config?.assignmentMode || 'same';
        if (mode === 'different' || mode === 'per-team') {
            return teams.map(team => team?.examId || null);
        }
        const commonId = config?.commonExamId || config?.examId || null;
        return teams.map(() => commonId);
    }

    function validateConfig(config = {}, context = {}) {
        const errors = [];
        const students = Array.isArray(context.students) ? context.students : [];
        const exams = Array.isArray(context.exams) ? context.exams : [];
        const classlevel = normalizeClass(config.classlevel || config.classLevel);
        if (!String(config.name || config.title || '').trim()) errors.push(error('name_required', 'Vui lòng nhập tên trận.'));
        if (!classlevel) errors.push(error('class_required', 'Vui lòng chọn lớp.'));

        const teams = Array.isArray(config.teams) ? config.teams : [];
        const teamCount = Number(config.teamCount || teams.length);
        if (!Number.isInteger(teamCount) || teamCount < 2) errors.push(error('team_count_invalid', 'Số đội phải là số nguyên từ 2 trở lên.'));
        if (teams.length !== teamCount) errors.push(error('team_count_mismatch', 'Số đội và danh sách đội chưa khớp.'));

        const rosterByKey = new Map();
        students.forEach(student => {
            const key = studentKey(student);
            if (key) rosterByKey.set(key, student);
        });
        const assigned = new Set();
        teams.forEach((team, index) => {
            const members = Array.isArray(team?.memberUsernames)
                ? team.memberUsernames.map(studentKey).filter(Boolean)
                : [];
            if (!members.length) errors.push(error('team_empty', `Đội ${index + 1} phải có ít nhất một thành viên.`, `teams.${index}`));
            const targetCount = team?.targetMemberCount === '' || team?.targetMemberCount === null || team?.targetMemberCount === undefined
                ? null
                : Number(team.targetMemberCount);
            if (targetCount !== null && (!Number.isInteger(targetCount) || targetCount < 1)) {
                errors.push(error('target_member_count_invalid', `Số thành viên mục tiêu của đội ${index + 1} không hợp lệ.`, `teams.${index}`));
            } else if (targetCount !== null && targetCount !== members.length) {
                errors.push(error('target_member_count_mismatch', `Đội ${index + 1} phải có đúng ${targetCount} thành viên theo mục tiêu đã nhập.`, `teams.${index}`));
            }
            const uniqueMembers = new Set();
            members.forEach(username => {
                if (uniqueMembers.has(username) || assigned.has(username)) {
                    errors.push(error('duplicate_student', `Học sinh ${username} chỉ được thuộc một đội.`, `teams.${index}`));
                }
                uniqueMembers.add(username);
                assigned.add(username);
                const student = rosterByKey.get(username);
                if (!student) errors.push(error('student_not_found', `Không tìm thấy học sinh ${username}.`, `teams.${index}`));
                else {
                    if (!isApprovedStudent(student)) errors.push(error('student_not_approved', `${username} chưa được duyệt hoặc không phải học sinh.`, `teams.${index}`));
                    if (classlevel && normalizeClass(student.classlevel) !== classlevel) errors.push(error('student_wrong_class', `${username} không thuộc lớp ${classlevel}.`, `teams.${index}`));
                }
            });
            const leader = studentKey(team?.leaderUsername);
            if (!leader) errors.push(error('leader_required', `Đội ${index + 1} phải có đúng một trưởng nhóm.`, `teams.${index}`));
            else if (!uniqueMembers.has(leader)) errors.push(error('leader_not_member', `Trưởng nhóm đội ${index + 1} phải là thành viên của đội.`, `teams.${index}`));
        });

        const mode = config.questionMode || config.assignmentMode || 'same';
        const examIds = examIdsForConfig(config);
        if (!examIds.length || examIds.some(id => !id)) errors.push(error('exam_required', 'Mỗi trận phải gắn bộ đề.'));
        const selectedExams = examIds.map(id => examForId(exams, id));
        selectedExams.forEach((exam, index) => {
            if (!exam) errors.push(error('exam_not_found', `Không tìm thấy bộ đề của đội ${index + 1}.`, `teams.${index}`));
            else if (!Array.isArray(exam.questions) || exam.questions.length < 1) errors.push(error('exam_empty', `Bộ đề của đội ${index + 1} chưa có câu hỏi.`, `teams.${index}`));
            else if (classlevel && normalizeClass(exam.classlevel) !== classlevel) errors.push(error('exam_wrong_class', `Bộ đề của đội ${index + 1} không thuộc lớp ${classlevel}.`, `teams.${index}`));
            else if (typeof context.validateQuestionScoring === 'function') {
                const invalidQuestion = exam.questions.findIndex(question => context.validateQuestionScoring(question));
                if (invalidQuestion !== -1) errors.push(error('question_scoring_invalid', `Câu ${invalidQuestion + 1} của bộ đề đội ${index + 1} chưa có cấu trúc chấm điểm hợp lệ.`, `teams.${index}`));
            }
        });
        const questionCounts = selectedExams.filter(Boolean).map(exam => Array.isArray(exam.questions) ? exam.questions.length : 0).filter(Boolean);
        if (questionCounts.length > 1 && questionCounts.some(count => count !== questionCounts[0])) errors.push(error('question_count_mismatch', 'Các bộ đề phải có cùng số câu.'));

        const hasTimer = config.hasTimer !== false && config.timeLimitMinutes !== null && config.timeLimitMinutes !== '';
        if (hasTimer) {
            const minutes = Number(config.timeLimitMinutes);
            if (!Number.isInteger(minutes) || minutes < 1) errors.push(error('time_invalid', 'Thời gian phải là số phút nguyên dương hoặc chọn không giới hạn.'));
        }
        if (!['same', 'different', 'per-team'].includes(mode)) errors.push(error('question_mode_invalid', 'Cách gắn bài làm không hợp lệ.'));
        return { valid: errors.length === 0, errors };
    }

    function normalizeTeam(team, index = 0) {
        const members = Array.isArray(team?.memberUsernames)
            ? team.memberUsernames.map(studentKey).filter(Boolean)
            : (Array.isArray(team?.members) ? team.members.map(studentKey).filter(Boolean) : []);
        return {
            id: String(team?.id || makeId(`team${index + 1}`)),
            name: String(team?.name || `Đội ${index + 1}`).trim() || `Đội ${index + 1}`,
            memberUsernames: Array.from(new Set(members)),
            leaderUsername: studentKey(team?.leaderUsername || team?.leader || members[0]),
            examId: team?.examId || null,
            targetMemberCount: team?.targetMemberCount === '' || team?.targetMemberCount === null || team?.targetMemberCount === undefined
                ? null
                : (Number.isInteger(Number(team.targetMemberCount)) ? Number(team.targetMemberCount) : null),
            status: team?.status || 'pending',
            score: Number.isFinite(Number(team?.score)) ? Number(team.score) : null,
            submittedCount: Number.isInteger(Number(team?.submittedCount)) ? Number(team.submittedCount) : 0,
            durationSeconds: Number.isFinite(Number(team?.durationSeconds)) ? Number(team.durationSeconds) : null,
            startedAt: team?.startedAt || null,
            completedAt: team?.completedAt || null,
            lockedAt: team?.lockedAt || null
        };
    }

    function normalizeCompetition(input = {}) {
        const questionMode = input.questionMode || input.assignmentMode || 'same';
        const teams = (Array.isArray(input.teams) ? input.teams : []).map(normalizeTeam);
        const teamCount = Number(input.teamCount || teams.length || 0);
        const timeLimitMinutes = input.hasTimer === false || input.timeLimitMinutes === null || input.timeLimitMinutes === ''
            ? null
            : (Number.isFinite(Number(input.timeLimitMinutes)) ? Number(input.timeLimitMinutes) : null);
        const status = STATUS_ORDER.includes(input.status) ? input.status : STATUS.DRAFT;
        return {
            id: String(input.id || makeId('match')),
            name: String(input.name || input.title || '').trim(),
            classlevel: normalizeClass(input.classlevel || input.classLevel),
            participantMode: input.participantMode || input.mode || 'manual',
            selectedStudentUsernames: Array.from(new Set((input.selectedStudentUsernames || input.studentUsernames || teams.flatMap(team => team.memberUsernames) || []).map(studentKey).filter(Boolean))),
            teamCount,
            teams,
            questionMode,
            commonExamId: input.commonExamId || (questionMode === 'same' ? input.examId || teams[0]?.examId || null : null),
            timeLimitMinutes,
            status,
            createdAt: input.createdAt || Date.now(),
            updatedAt: input.updatedAt || Date.now(),
            startedAt: input.startedAt || null,
            endedAt: input.endedAt || null,
            results: Array.isArray(input.results) ? input.results : [],
            attempts: input.attempts && typeof input.attempts === 'object' ? input.attempts : {},
            version: Number(input.version || 1)
        };
    }

    function storageApi() {
        if (app.safeStorage && typeof app.safeStorage.getItem === 'function') return app.safeStorage;
        if (typeof root.localStorage !== 'undefined') {
            return {
                getItem: key => root.localStorage.getItem(key),
                setItem: (key, value) => root.localStorage.setItem(key, value)
            };
        }
        return null;
    }

    function sessionStorageApi() {
        try {
            if (typeof root.sessionStorage !== 'undefined') return root.sessionStorage;
        } catch (_) { /* private mode */ }
        return null;
    }

    function attemptSessionKey(attempt) {
        return `team_attempt_session_${attempt?.id || ''}`;
    }

    function hasAttemptSessionMarker(attempt) {
        const session = sessionStorageApi();
        if (!session || !attempt?.id) return false;
        try { return session.getItem(attemptSessionKey(attempt)) === 'active'; } catch (_) { return false; }
    }

    function setAttemptSessionMarker(attempt, active = true) {
        const session = sessionStorageApi();
        if (!session || !attempt?.id) return;
        try {
            if (active) session.setItem(attemptSessionKey(attempt), 'active');
            else session.removeItem(attemptSessionKey(attempt));
        } catch (_) { /* private mode */ }
    }

    function navigationType() {
        try {
            const entry = root.performance?.getEntriesByType?.('navigation')?.[0];
            return entry?.type || '';
        } catch (_) { return ''; }
    }

    function shouldInvalidateAttemptOnReentry(attempt, navType = '', hasSessionMarker = false) {
        return attempt?.status === ATTEMPT_STATUS.ACTIVE && (navType === 'reload' || !hasSessionMarker);
    }

    function readCollection(key, fallback) {
        const storage = storageApi();
        if (!storage) return fallback.slice();
        try {
            const parsed = JSON.parse(storage.getItem(key) || 'null');
            return Array.isArray(parsed) ? parsed : fallback.slice();
        } catch (_) {
            return fallback.slice();
        }
    }

    function writeCollection(key, value) {
        const storage = storageApi();
        if (!storage) return;
        try { storage.setItem(key, JSON.stringify(value)); } catch (_) { /* offline/private mode */ }
    }

    function emitUpdate(detail) {
        if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
            root.dispatchEvent(new root.CustomEvent(EVENT_NAME, { detail }));
        }
    }

    function listCompetitions() {
        const stored = readCollection(STORAGE_KEY, memory.competitions);
        memory.competitions = stored.map(normalizeCompetition);
        return memory.competitions.map(item => ({ ...item, teams: item.teams.map(team => ({ ...team, memberUsernames: team.memberUsernames.slice() })) }));
    }

    function saveCompetitions(items) {
        memory.competitions = items.map(normalizeCompetition);
        writeCollection(STORAGE_KEY, memory.competitions);
        emitUpdate({ type: 'competitions', items: memory.competitions });
        return memory.competitions;
    }

    const store = {
        list: listCompetitions,
        get(id) { return listCompetitions().find(item => String(item.id) === String(id)) || null; },
        upsert(input) {
            const item = normalizeCompetition(input);
            const current = listCompetitions();
            const index = current.findIndex(existing => String(existing.id) === String(item.id));
            if (index === -1) current.push(item); else current[index] = item;
            saveCompetitions(current);
            return item;
        },
        remove(id) {
            saveCompetitions(listCompetitions().filter(item => String(item.id) !== String(id)));
        },
        clear() { saveCompetitions([]); }
    };

    function listAttempts() {
        const stored = readCollection(ATTEMPT_STORAGE_KEY, memory.attempts);
        memory.attempts = stored.slice();
        return memory.attempts.map(item => ({ ...item, answers: Array.isArray(item.answers) ? item.answers.slice() : [], details: Array.isArray(item.details) ? item.details.slice() : [] }));
    }

    function saveAttempts(items) {
        memory.attempts = items.slice();
        writeCollection(ATTEMPT_STORAGE_KEY, memory.attempts);
        emitUpdate({ type: 'attempts', items: memory.attempts });
        return memory.attempts;
    }

    const attemptStore = {
        list: listAttempts,
        get(competitionId, teamId) {
            return listAttempts().find(item => String(item.competitionId) === String(competitionId) && String(item.teamId) === String(teamId)) || null;
        },
        upsert(input) {
            const item = {
                ...input,
                answers: Array.isArray(input.answers) ? input.answers.slice() : [],
                details: Array.isArray(input.details) ? input.details.slice() : []
            };
            const current = listAttempts();
            const index = current.findIndex(existing => String(existing.id) === String(item.id));
            if (index === -1) current.push(item); else current[index] = item;
            saveAttempts(current);
            return item;
        }
    };

    function transitionStatus(input, nextStatus, at = Date.now()) {
        const current = normalizeCompetition(input);
        if (!STATUS_ORDER.includes(nextStatus)) throw new Error('Unknown team competition status');
        const currentIndex = STATUS_ORDER.indexOf(current.status);
        const nextIndex = STATUS_ORDER.indexOf(nextStatus);
        if (nextIndex !== currentIndex + 1 && nextIndex !== currentIndex) throw new Error('Invalid team competition transition');
        const changed = { ...current, updatedAt: nowValue(at) };
        if (nextStatus === STATUS.PREPARED) changed.status = STATUS.PREPARED;
        if (nextStatus === STATUS.ACTIVE) {
            changed.status = STATUS.ACTIVE;
            changed.startedAt = nowValue(at);
            changed.teams = changed.teams.map(team => ({ ...team, status: 'active', startedAt: changed.startedAt }));
        }
        if (nextStatus === STATUS.ENDED) {
            changed.status = STATUS.ENDED;
            changed.endedAt = nowValue(at);
            changed.teams = changed.teams.map(team => ({ ...team, status: 'ended', completedAt: team.completedAt || changed.endedAt }));
        }
        return changed;
    }

    function prepareCompetition(input, context = {}, at = Date.now()) {
        const candidate = normalizeCompetition(input);
        const validation = validateConfig(candidate, context);
        if (!validation.valid) {
            const exception = new Error('Team competition configuration is invalid');
            exception.validation = validation;
            throw exception;
        }
        return transitionStatus(candidate, STATUS.PREPARED, at);
    }

    function startCompetition(input, at = Date.now()) {
        return transitionStatus(input, STATUS.ACTIVE, at);
    }

    function endCompetition(input, at = Date.now()) {
        return transitionStatus(input, STATUS.ENDED, at);
    }

    function calculateTeamScore(details, totalQuestions) {
        const list = Array.isArray(details) ? details : [];
        const denominator = Number(totalQuestions) > 0 ? Number(totalQuestions) : list.length;
        if (!denominator) return 0;
        const points = list.reduce((sum, detail) => sum + Math.max(0, Math.min(1, Number(detail?.points) || 0)), 0);
        return Math.round(Math.max(0, Math.min(10, (points / denominator) * 10)) * 100) / 100;
    }

    function assignTeamScoreToMembers(team, score) {
        const teamId = String(team?.id || '');
        const individualScore = Math.round(Math.max(0, Math.min(10, Number(score) || 0)) * 100) / 100;
        return (Array.isArray(team?.memberUsernames) ? team.memberUsernames : []).map(username => ({
            teamId,
            username: studentKey(username),
            individualScore
        }));
    }

    function createAttempt(competition, team, leaderUsername, questions = [], at = Date.now()) {
        const competitionId = String(competition?.id || '');
        const teamId = String(team?.id || '');
        const existing = attemptStore.get(competitionId, teamId);
        if (existing) {
            if (existing.status === ATTEMPT_STATUS.LOCKED || existing.status === ATTEMPT_STATUS.COMPLETED) {
                throw new Error('This team attempt is locked');
            }
            return existing;
        }
        const startedAt = competition?.startedAt || nowValue(at);
        return attemptStore.upsert({
            id: makeId('attempt'),
            competitionId,
            teamId,
            leaderUsername: studentKey(leaderUsername),
            status: ATTEMPT_STATUS.ACTIVE,
            startedAt,
            completedAt: null,
            lockedAt: null,
            lockReason: null,
            questionCount: Array.isArray(questions) ? questions.length : 0,
            currentIndex: 0,
            answers: [],
            details: [],
            submittedCount: 0,
            score: 0,
            durationSeconds: null,
            updatedAt: nowValue(at)
        });
    }

    function recordAttemptAnswer(input, questionIndex, selected, scoreResult = {}, detail = {}, at = Date.now()) {
        const attempt = { ...input, answers: Array.isArray(input?.answers) ? input.answers.slice() : [], details: Array.isArray(input?.details) ? input.details.slice() : [] };
        if (attempt.status !== ATTEMPT_STATUS.ACTIVE) throw new Error('Cannot answer a locked team attempt');
        const index = Number(questionIndex);
        if (!Number.isInteger(index) || index < 0) throw new Error('Invalid question index');
        if (attempt.answers[index] !== undefined) throw new Error('Question already submitted');
        attempt.answers[index] = selected ?? '';
        attempt.details[index] = { ...detail, points: Number(scoreResult.points) || 0, isCorrect: Boolean(scoreResult.isCorrect) };
        attempt.submittedCount = attempt.details.filter(Boolean).length;
        attempt.currentIndex = Math.max(attempt.currentIndex || 0, index + 1);
        attempt.score = calculateTeamScore(attempt.details, attempt.questionCount);
        attempt.updatedAt = nowValue(at);
        return attemptStore.upsert(attempt);
    }

    function completeAttempt(input, at = Date.now()) {
        const attempt = { ...input };
        if (attempt.status !== ATTEMPT_STATUS.ACTIVE) throw new Error('Cannot complete a locked team attempt');
        attempt.status = ATTEMPT_STATUS.COMPLETED;
        attempt.completedAt = nowValue(at);
        attempt.durationSeconds = Math.max(0, Math.round((attempt.completedAt - Number(attempt.startedAt || attempt.completedAt)) / 1000));
        return attemptStore.upsert(attempt);
    }

    function lockAttempt(input, reason = 'leader_exit', at = Date.now()) {
        const attempt = { ...input };
        if ([ATTEMPT_STATUS.LOCKED].includes(attempt.status)) return attempt;
        if (![ATTEMPT_STATUS.ACTIVE, ATTEMPT_STATUS.COMPLETED].includes(attempt.status)) throw new Error('Cannot lock this team attempt');
        attempt.status = ATTEMPT_STATUS.LOCKED;
        attempt.lockReason = String(reason || 'leader_exit');
        attempt.lockedAt = nowValue(at);
        attempt.completedAt = attempt.completedAt || attempt.lockedAt;
        attempt.durationSeconds = Math.max(0, Math.round((attempt.completedAt - Number(attempt.startedAt || attempt.completedAt)) / 1000));
        return attemptStore.upsert(attempt);
    }

    function resumeAttempt(input) {
        if (!input || [ATTEMPT_STATUS.LOCKED, ATTEMPT_STATUS.COMPLETED].includes(input.status)) {
            throw new Error('Cannot resume a locked team attempt');
        }
        return input;
    }

    function buildMemberResults(competition, scoreByTeam = {}) {
        const results = [];
        (Array.isArray(competition?.teams) ? competition.teams : []).forEach(team => {
            const score = scoreByTeam[team.id] ?? team.score ?? 0;
            results.push(...assignTeamScoreToMembers(team, score).map(item => ({
                ...item,
                competitionId: competition.id,
                classlevel: competition.classlevel,
                recordedAt: Date.now()
            })));
        });
        return results;
    }

    function getTeamsForUser(competition, username) {
        const key = studentKey(username);
        return (Array.isArray(competition?.teams) ? competition.teams : []).filter(team => team.memberUsernames.includes(key));
    }

    function getTeamRank(competition, teamId) {
        const teams = Array.isArray(competition?.teams) ? competition.teams : [];
        const target = teams.find(team => String(team.id) === String(teamId));
        if (!target) return null;
        const targetScore = Number(target.score) || 0;
        return 1 + teams.reduce((count, team) => count + ((Number(team.score) || 0) > targetScore ? 1 : 0), 0);
    }

    function getExamForTeam(competition, team) {
        const examId = ['different', 'per-team'].includes(competition?.questionMode)
            ? team?.examId
            : (competition?.commonExamId || team?.examId);
        return (Array.isArray(app.data?.exams) ? app.data.exams : []).find(exam => String(exam.id) === String(examId)) || null;
    }

    function getQuestionsForTeam(competition, team) {
        const exam = getExamForTeam(competition, team);
        return Array.isArray(exam?.questions) ? exam.questions.slice() : [];
    }

    function updateCompetitionTeamFromAttempt(attempt) {
        const competition = store.get(attempt?.competitionId);
        if (!competition) return null;
        const teams = competition.teams.map(team => {
            if (String(team.id) !== String(attempt.teamId)) return team;
            return {
                ...team,
                score: Number(attempt.score) || 0,
                submittedCount: Number(attempt.submittedCount) || 0,
                status: attempt.status === ATTEMPT_STATUS.ACTIVE ? 'active' : attempt.status,
                startedAt: team.startedAt || attempt.startedAt || null,
                completedAt: attempt.completedAt || team.completedAt || null,
                lockedAt: attempt.lockedAt || team.lockedAt || null,
                durationSeconds: Number.isFinite(Number(attempt.durationSeconds)) ? Number(attempt.durationSeconds) : team.durationSeconds
            };
        });
        return store.upsert({ ...competition, teams, updatedAt: Date.now() });
    }

    function activeLeaderAttempt() {
        const attempt = api.state.activeAttempt;
        if (!attempt || attempt.status !== ATTEMPT_STATUS.ACTIVE) return null;
        const user = app.data?.currentUser;
        if (!user || String(user.username) !== String(attempt.leaderUsername)) return null;
        return attempt;
    }

    function removeBeforeUnload() {
        if (typeof root.removeEventListener === 'function' && api.state.beforeUnloadHandler) {
            root.removeEventListener('beforeunload', api.state.beforeUnloadHandler);
            api.state.beforeUnloadHandler = null;
        }
    }

    function installBeforeUnload() {
        removeBeforeUnload();
        if (typeof root.addEventListener !== 'function') return;
        api.state.beforeUnloadHandler = event => {
            if (!activeLeaderAttempt()) return;
            event.preventDefault();
            event.returnValue = '';
            return '';
        };
        root.addEventListener('beforeunload', api.state.beforeUnloadHandler);
    }

    function clearPlayTimer() {
        if (api.state.timerId) {
            clearInterval(api.state.timerId);
            api.state.timerId = null;
        }
    }

    function formatRemaining(seconds) {
        const safe = Math.max(0, Math.floor(Number(seconds) || 0));
        const minutes = Math.floor(safe / 60);
        const remainder = safe % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
    }

    function renderLeaderLocked(message) {
        const container = typeof document !== 'undefined' ? document.getElementById('team-play-question-container') : null;
        const notice = typeof document !== 'undefined' ? document.getElementById('team-play-lock-notice') : null;
        const submit = typeof document !== 'undefined' ? document.getElementById('team-play-submit') : null;
        const exit = typeof document !== 'undefined' ? document.getElementById('team-play-exit') : null;
        if (container) container.innerHTML = '<div class="team-play-locked-panel"><strong>Lượt đội đã khóa</strong><p>Các câu đã nộp vẫn được tính điểm; câu chưa nộp tính 0. Không thể làm tiếp.</p></div>';
        if (notice) { notice.hidden = false; notice.textContent = message || 'Lượt làm đã kết thúc.'; }
        if (submit) submit.disabled = true;
        if (exit) {
            exit.textContent = 'Về bản đồ';
            exit.onclick = () => { if (app.router) app.router.open('map-screen'); };
        }
    }

    function updatePlayHeader(competition, team, attempt, questionCount) {
        if (typeof document === 'undefined') return;
        const title = document.getElementById('team-play-title');
        const teamLabel = document.getElementById('team-play-team');
        const progress = document.getElementById('team-play-progress');
        const score = document.getElementById('team-play-score');
        const timer = document.getElementById('team-play-timer');
        if (title) title.textContent = competition.name || 'Trận thi đua';
        if (teamLabel) teamLabel.textContent = `${team.name} · Trưởng nhóm: ${app.data?.currentUser?.fullname || attempt.leaderUsername}`;
        if (progress) progress.textContent = `Câu ${Math.min((attempt.currentIndex || 0) + 1, questionCount)}/${questionCount}`;
        if (score) score.textContent = `Điểm đội: ${Number(attempt.score || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}`;
        if (timer && competition.timeLimitMinutes !== null) timer.hidden = false;
    }

    function startPlayTimer(competition) {
        clearPlayTimer();
        const timer = typeof document !== 'undefined' ? document.getElementById('team-play-timer') : null;
        if (!timer || competition.timeLimitMinutes === null) {
            if (timer) timer.hidden = true;
            return;
        }
        timer.hidden = false;
        const deadline = Number(competition.startedAt || Date.now()) + Number(competition.timeLimitMinutes) * 60 * 1000;
        const tick = () => {
            const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            timer.textContent = `Còn ${formatRemaining(seconds)}`;
            if (seconds <= 0) {
                clearPlayTimer();
                api.lockActiveAttempt('timeout');
            }
        };
        tick();
        api.state.timerId = setInterval(tick, 250);
    }

    function renderLeaderQuestion() {
        const attempt = api.state.activeAttempt;
        if (!attempt) return;
        const competition = store.get(attempt.competitionId);
        const team = competition?.teams.find(item => String(item.id) === String(attempt.teamId));
        const questions = getQuestionsForTeam(competition, team);
        if (!competition || !team || !questions.length) return renderLeaderLocked('Không tìm thấy bộ câu hỏi của đội.');
        if (attempt.status !== ATTEMPT_STATUS.ACTIVE || attempt.currentIndex >= questions.length) {
            renderLeaderLocked(attempt.status === ATTEMPT_STATUS.COMPLETED ? 'Đội đã nộp đủ bài.' : 'Lượt làm đã bị khóa.');
            return;
        }
        const index = attempt.currentIndex;
        const question = questions[index];
        const container = typeof document !== 'undefined' ? document.getElementById('team-play-question-container') : null;
        const notice = typeof document !== 'undefined' ? document.getElementById('team-play-lock-notice') : null;
        const submit = typeof document !== 'undefined' ? document.getElementById('team-play-submit') : null;
        if (notice) notice.hidden = true;
        updatePlayHeader(competition, team, attempt, questions.length);
        if (!container || typeof app.exam?.renderQuestionInput !== 'function') return;
        const qText = app.data?.formatMathHTML ? app.data.formatMathHTML(question.q || '') : String(question.q || '');
        const qType = app.data?.sanitizeHTML ? app.data.sanitizeHTML(question.type || 'Trắc nghiệm') : String(question.type || 'Trắc nghiệm');
        container.innerHTML = `<div class="team-play-question-card"><div class="team-play-question-text">Câu ${index + 1}: ${qText}</div><div class="team-play-question-type">${qType}</div><div id="team-play-answer-options" class="team-play-answer-options">${app.exam.renderQuestionInput(question, index)}</div></div>`;
        if (submit) submit.disabled = false;
        startPlayTimer(competition);
    }

    function openLeaderAttempt(competitionId) {
        const user = app.data?.currentUser;
        if (!user || String(user.role || '').toLowerCase() === 'admin') return alert('Chỉ tài khoản học sinh được chỉ định làm trưởng nhóm mới có thể vào lượt.');
        const competition = store.get(competitionId);
        if (!competition || competition.status !== STATUS.ACTIVE) return alert('Trận thi đua chưa bắt đầu hoặc đã kết thúc.');
        const team = competition.teams.find(item => String(item.leaderUsername) === String(user.username));
        if (!team) return alert('Tài khoản này không phải trưởng nhóm của trận.');
        const questions = getQuestionsForTeam(competition, team);
        if (!questions.length) return alert('Đội chưa có bộ câu hỏi hợp lệ.');
        try {
            const existing = attemptStore.get(competition.id, team.id);
            if (shouldInvalidateAttemptOnReentry(existing, navigationType(), hasAttemptSessionMarker(existing))) {
                const locked = lockAttempt(existing, 'refresh_or_close');
                updateCompetitionTeamFromAttempt(locked);
                setAttemptSessionMarker(existing, false);
                alert('Lượt trước đã bị khóa vì rời/refresh trình duyệt giữa chừng. Các câu đã nộp vẫn được tính điểm.');
                api.state.activeCompetitionId = competition.id;
                api.state.activeAttempt = locked;
                if (app.router) app.router.open('team-competition-play-screen');
                renderLeaderLocked('Lượt trước đã bị khóa do refresh/đóng tab. Không thể làm tiếp.');
                return locked;
            }
            const attempt = createAttempt(competition, team, user.username, questions);
            setAttemptSessionMarker(attempt, true);
            api.state.activeCompetitionId = competition.id;
            api.state.activeAttempt = attempt;
            installBeforeUnload();
            if (typeof document !== 'undefined') {
                const questModal = document.getElementById('quest-modal');
                if (questModal) { questModal.style.display = 'none'; questModal.classList.remove('active'); }
            }
            if (app.router) app.router.open('team-competition-play-screen');
            if (attempt.status === ATTEMPT_STATUS.ACTIVE) renderLeaderQuestion();
            else renderLeaderLocked('Lượt của đội đã được khóa trước đó.');
            return attempt;
        } catch (exception) {
            return alert(exception.message || 'Không thể mở lượt thi đua đội.');
        }
    }

    function lockActiveAttempt(reason = 'leader_exit') {
        const attempt = api.state.activeAttempt;
        if (!attempt || attempt.status !== ATTEMPT_STATUS.ACTIVE) return attempt;
        clearPlayTimer();
        const locked = lockAttempt(attempt, reason);
        api.state.activeAttempt = locked;
        updateCompetitionTeamFromAttempt(locked);
        setAttemptSessionMarker(locked, false);
        removeBeforeUnload();
        renderLeaderLocked(reason === 'timeout' ? 'Hết giờ — lượt đội đã tự động khóa.' : 'Lượt đội đã khóa và không thể làm tiếp.');
        return locked;
    }

    function confirmLeaderExit(reason = 'leader_exit') {
        if (!activeLeaderAttempt()) return Promise.resolve(true);
        const modal = typeof document !== 'undefined' ? document.getElementById('team-leave-confirm-modal') : null;
        if (!modal) {
            return Promise.resolve(typeof root.confirm === 'function' && root.confirm('Nếu rời bây giờ, lượt đội sẽ bị khóa. Các câu đã nộp vẫn được tính điểm.'));
        }
        const ok = document.getElementById('team-leave-confirm-ok');
        const cancel = document.getElementById('team-leave-confirm-cancel');
        const message = document.getElementById('team-leave-confirm-message');
        if (message) message.textContent = reason === 'timeout'
            ? 'Hết giờ, lượt đội sẽ bị khóa. Các câu đã nộp vẫn được tính điểm.'
            : 'Nếu rời bây giờ, lượt của đội sẽ bị khóa và không thể làm tiếp. Các câu đã nộp vẫn được tính điểm.';
        modal.style.display = 'flex';
        modal.classList.add('active');
        api.state.leaveConfirmationOpen = true;
        return new Promise(resolve => {
            const close = () => {
                modal.style.display = 'none';
                modal.classList.remove('active');
                api.state.leaveConfirmationOpen = false;
            };
            const onCancel = () => { cleanup(); close(); resolve(false); };
            const onOk = () => { cleanup(); close(); lockActiveAttempt(reason); resolve(true); };
            const cleanup = () => {
                if (ok) ok.removeEventListener('click', onOk);
                if (cancel) cancel.removeEventListener('click', onCancel);
            };
            if (ok) ok.addEventListener('click', onOk, { once: true });
            if (cancel) cancel.addEventListener('click', onCancel, { once: true });
        });
    }

    function requestLeaderExit(reason = 'leader_exit') {
        confirmLeaderExit(reason).then(confirmed => {
            if (confirmed && app.router) app.router.open('map-screen');
        });
    }

    function submitCurrentQuestion() {
        const attempt = api.state.activeAttempt;
        if (!attempt || attempt.status !== ATTEMPT_STATUS.ACTIVE) return;
        const competition = store.get(attempt.competitionId);
        const team = competition?.teams.find(item => String(item.id) === String(attempt.teamId));
        const questions = getQuestionsForTeam(competition, team);
        const index = attempt.currentIndex;
        const question = questions[index];
        if (!question || typeof app.exam?.readQuestionAnswer !== 'function') return;
        const selected = app.exam.readQuestionAnswer(question, index);
        const scoreResult = typeof app.game?.calculateQuestionScore === 'function'
            ? app.game.calculateQuestionScore(question, selected)
            : { points: app.exam.isAnswerCorrect(question, selected) ? 1 : 0, isCorrect: app.exam.isAnswerCorrect(question, selected) };
        const detail = typeof app.game?.createHistoryDetail === 'function'
            ? app.game.createHistoryDetail(question, selected, scoreResult.isCorrect, scoreResult)
            : { q: question.q, selected, correct: question.ans, isCorrect: scoreResult.isCorrect, ...scoreResult };
        try {
            const updated = recordAttemptAnswer(attempt, index, selected, scoreResult, detail);
            api.state.activeAttempt = updated;
            updateCompetitionTeamFromAttempt(updated);
            if (updated.currentIndex >= questions.length) {
                const completed = completeAttempt(updated);
                api.state.activeAttempt = completed;
                updateCompetitionTeamFromAttempt(completed);
                setAttemptSessionMarker(completed, false);
                removeBeforeUnload();
                clearPlayTimer();
                renderLeaderLocked(`Đã hoàn thành bài của ${team.name}. Điểm đội: ${Number(completed.score || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/10.`);
            } else {
                renderLeaderQuestion();
            }
        } catch (exception) {
            alert(exception.message || 'Không thể lưu câu trả lời.');
        }
    }

    function subscribe(callback) {
        if (typeof callback !== 'function') return () => {};
        const handler = event => callback(event.detail || event);
        if (typeof root.addEventListener === 'function') root.addEventListener(EVENT_NAME, handler);
        return () => { if (typeof root.removeEventListener === 'function') root.removeEventListener(EVENT_NAME, handler); };
    }

    const api = {
        STATUS,
        STATUS_LABELS,
        STATUS_ORDER,
        ATTEMPT_STATUS,
        STORAGE_KEY,
        ATTEMPT_STORAGE_KEY,
        normalizeClass,
        studentKey,
        distributeStudents,
        buildTeams,
        validateConfig,
        normalizeCompetition,
        transitionStatus,
        prepareCompetition,
        startCompetition,
        endCompetition,
        calculateTeamScore,
        assignTeamScoreToMembers,
        createAttempt,
        recordAttemptAnswer,
        completeAttempt,
        lockAttempt,
        resumeAttempt,
        buildMemberResults,
        getTeamsForUser,
        getTeamRank,
        store,
        attemptStore,
        subscribe,
        getExamForTeam,
        getQuestionsForTeam,
        shouldInvalidateAttemptOnReentry,
        getActiveForUser(username) {
            return listCompetitions().filter(item => item.status === STATUS.ACTIVE && getTeamsForUser(item, username).length > 0);
        },
        openLeaderAttempt,
        submitCurrentQuestion,
        requestLeaderExit,
        confirmLeaderExit,
        lockActiveAttempt,
        hasActiveLeaderAttempt() { return Boolean(activeLeaderAttempt()); },
        state: {
            activeCompetitionId: null,
            activeAttempt: null,
            leaveConfirmationOpen: false,
            timerId: null,
            beforeUnloadHandler: null
        }
    };

    app.teamCompetition = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
