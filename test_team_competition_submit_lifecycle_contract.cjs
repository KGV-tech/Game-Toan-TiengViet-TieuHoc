const assert = require('node:assert/strict');

global.window = global;
global.supabase = {};
let lastAlert = null;
global.alert = (msg) => { lastAlert = msg; };

global.app = {
  data: {
    currentUser: { username: 'leader1', role: 'student' },
    exams: [],
    users: [
      { username: 'leader1', fullname: 'Đội Trưởng 1', role: 'student', approved: true, classlevel: '5', class_name: '5A' }
    ]
  }
};

const api = require('./src/modules/team-competition.js');
const adapterPath = require.resolve('./src/modules/team-competition-supabase.js');
delete require.cache[adapterPath];
require(adapterPath);

(async () => {
  // Setup data
  const compId = '11111111-1111-4111-8111-111111111111';
  const teamId = '22222222-2222-4222-8222-222222222222';
  const attemptId = '44444444-4444-4444-8444-444444444444';

  const comp = api.store.upsert({
    id: compId,
    name: 'Trận test lifecycle',
    classlevel: '5',
    status: 'active',
    teams: [{ id: teamId, name: 'Đội 1', leaderUsername: 'leader1', status: 'active', score: 0, submittedCount: 0 }]
  });

  const question = { q: '1 + 1 = ?', type: 'Trắc nghiệm', options: ['2', '3'] };
  api.getQuestionsForTeam = () => [question];
  api.readLeaderAnswer = () => '2';

  let renderedLockedMessage = null;
  api.renderLeaderLocked = (msg) => { renderedLockedMessage = msg; };
  api.renderLeaderPracticeFeedback = () => {};

  const rows = {
    team_competitions: [{
      id: compId, name: 'Trận test lifecycle', classlevel: '5', class_name: '5A',
      participant_mode: 'manual', question_mode: 'same', common_exam_id: null,
      time_limit_minutes: null, status: 'active', version: 1,
      created_at: '2026-09-06T00:00:00.000Z', updated_at: '2026-09-06T00:00:00.000Z',
      started_at: '2026-09-06T00:00:00.000Z', ended_at: null
    }],
    team_competition_teams: [{
      id: teamId, competition_id: compId,
      name: 'Đội 1', position: 1, target_member_count: 1, leader_username: 'leader1', exam_id: null,
      status: 'active', score: 0, submitted_count: 0, correct_count: 0,
      started_at: '2026-09-06T00:00:00.000Z', completed_at: null, locked_at: null, duration_seconds: null
    }],
    team_competition_members: [
      { competition_id: compId, team_id: teamId, username: 'leader1', position: 1 }
    ],
    team_competition_questions: [{
      id: '33333333-3333-4333-8333-333333333333', competition_id: compId,
      team_id: teamId, question_index: 0,
      question_payload: { q: '1 + 1 = ?', type: 'Trắc nghiệm', options: ['2', '3'] },
      question_type: 'Trắc nghiệm', answer_count: 1, part_answer_counts: []
    }],
    team_competition_attempts: [{
      id: attemptId, competition_id: compId, team_id: teamId,
      session_id: 'sess-1', current_index: 0, score: 0,
      submitted_count: 0, correct_count: 0, question_count: 1,
      status: 'active', started_at: '2026-09-06T00:00:00.000Z',
      completed_at: null, locked_at: null, lock_reason: null
    }],
    team_competition_answers: [],
    team_competition_results: []
  };

  // Mock invoke
  let nextSubmitError = null;
  let submitCalls = 0;

  const mockClient = {
    rpc: async (fn, args) => {
      if (fn === 'team_competition_submit_answer') {
        submitCalls++;
        if (nextSubmitError) {
          const err = new Error(nextSubmitError.message || nextSubmitError.code);
          err.code = nextSubmitError.code;
          throw err;
        }
        const updatedAttempt = {
          id: attemptId,
          competition_id: compId,
          team_id: teamId,
          session_id: args.p_session_id,
          status: 'active',
          current_index: 1,
          score: 1,
          submitted_count: 1,
          correct_count: 1,
          question_count: 1
        };
        rows.team_competition_attempts = [updatedAttempt];
        return {
          data: [updatedAttempt],
          error: null
        };
      }
      if (fn === 'team_competition_get_answer_feedback') {
        return { data: [{ answerKey: '2', points: 1, isCorrect: true }], error: null };
      }
      return { data: [], error: null };
    },
    from: (table) => ({
      select: () => Promise.resolve({ data: rows[table] || [], error: null })
    })
  };

  api.remote.configure(mockClient);

  // 1. TEST TIMEOUT (Hết giờ)
  api.state.activeAttempt = api.attemptStore.upsert({
    id: attemptId,
    competitionId: compId,
    teamId: teamId,
    sessionId: 'sess-1',
    status: api.ATTEMPT_STATUS.ACTIVE,
    currentIndex: 0,
    score: 0,
    submittedCount: 0
  });

  nextSubmitError = { code: 'team_competition_timeout', message: 'team_competition_timeout' };
  renderedLockedMessage = null;
  lastAlert = null;

  await api.remote.submitCurrentQuestion();

  assert.equal(api.state.activeAttempt.status, api.ATTEMPT_STATUS.LOCKED);
  assert.equal(api.state.activeAttempt.lockReason, 'timeout');
  assert.match(renderedLockedMessage, /Hết giờ làm bài! Hệ thống đã ghi nhận đầy đủ điểm các câu nhóm đã hoàn thành/);
  assert.match(lastAlert, /Hết giờ làm bài! Hệ thống đã ghi nhận đầy đủ điểm các câu nhóm đã hoàn thành/);

  // 2. TEST COMPETITION IS NOT ACTIVE (Admin/Giáo viên kết thúc trận)
  api.state.activeAttempt = api.attemptStore.upsert({
    id: attemptId,
    competitionId: compId,
    teamId: teamId,
    sessionId: 'sess-1',
    status: api.ATTEMPT_STATUS.ACTIVE,
    currentIndex: 0,
    score: 0,
    submittedCount: 0
  });

  nextSubmitError = { code: 'competition_is_not_active', message: 'competition_is_not_active' };
  renderedLockedMessage = null;
  lastAlert = null;

  await api.remote.submitCurrentQuestion();

  assert.equal(api.state.activeAttempt.status, api.ATTEMPT_STATUS.LOCKED);
  assert.equal(api.state.activeAttempt.lockReason, 'competition_closed');
  assert.match(renderedLockedMessage, /Trận thi đua đã kết thúc bởi Giáo viên/);
  assert.match(lastAlert, /Trận thi đua đã kết thúc bởi Giáo viên/);

  // 3. TEST SESSION MISMATCH AUTO-RETRY (Lệch phiên -> tự động đồng bộ session mới và nộp lại 1 lần)
  api.state.activeAttempt = api.attemptStore.upsert({
    id: attemptId,
    competitionId: compId,
    teamId: teamId,
    sessionId: 'old-session',
    status: api.ATTEMPT_STATUS.ACTIVE,
    currentIndex: 0,
    score: 0,
    submittedCount: 0
  });

  submitCalls = 0;
  // Lần 1 ném session_mismatch, nhưng sau đó sync cập nhật sessionId mới 'new-session-2'
  let callCount = 0;
  nextSubmitError = null;
  mockClient.rpc = async (fn, args) => {
    if (fn === 'team_competition_submit_answer') {
      submitCalls++;
      callCount++;
      if (callCount === 1) {
        // Giả lập sau lỗi mismatch, server cập nhật attempt có session mới
        const newSessAttempt = {
          id: attemptId,
          competition_id: compId,
          team_id: teamId,
          session_id: 'new-session-2',
          status: 'active',
          current_index: 0,
          score: 0,
          submitted_count: 0,
          correct_count: 0,
          question_count: 1
        };
        rows.team_competition_attempts = [newSessAttempt];
        api.attemptStore.upsert({
          id: attemptId,
          competitionId: compId,
          teamId: teamId,
          sessionId: 'new-session-2',
          status: api.ATTEMPT_STATUS.ACTIVE,
          currentIndex: 0,
          score: 0,
          submittedCount: 0
        });
        const err = new Error('attempt_session_mismatch');
        err.code = 'attempt_session_mismatch';
        throw err;
      }
      // Lần retry: thành công với session mới!
      assert.equal(args.p_session_id, 'new-session-2', 'Lần retry phải dùng session mới được đồng bộ');
      const updatedRow = {
        id: attemptId,
        competition_id: compId,
        team_id: teamId,
        session_id: 'new-session-2',
        status: 'active',
        current_index: 1,
        score: 1,
        submitted_count: 1,
        correct_count: 1,
        question_count: 1
      };
      rows.team_competition_attempts = [updatedRow];
      return {
        data: [updatedRow],
        error: null
      };
    }
    if (fn === 'team_competition_get_answer_feedback') {
      return { data: [{ answerKey: '2', points: 1, isCorrect: true }], error: null };
    }
    return { data: [], error: null };
  };

  renderedLockedMessage = null;
  lastAlert = null;

  await api.remote.submitCurrentQuestion();

  assert.equal(submitCalls, 2, 'Khi lệch phiên, phải tự động retry 1 lần');
  assert.equal(api.state.activeAttempt.sessionId, 'new-session-2');
  assert.equal(api.state.activeAttempt.currentIndex, 1);
  assert.equal(lastAlert, null, 'Retry thành công thì không hiển thị alert lỗi');

  console.log('team competition submit lifecycle contract tests passed');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
