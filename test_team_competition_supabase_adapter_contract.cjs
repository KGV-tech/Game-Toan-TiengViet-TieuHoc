const assert = require('node:assert/strict');

global.window = global;
global.supabase = {};
global.app = {
  data: {
    currentUser: { username: 'teacher', role: 'admin' },
    exams: [],
    users: [
      { username: 'hs1', fullname: 'Học sinh 1', role: 'student', approved: true, classlevel: '5', class_name: '5A' },
      { username: 'hs2', fullname: 'Học sinh 2', role: 'student', approved: true, classlevel: '5', class_name: '5A' },
      { username: 'hs3', fullname: 'Học sinh 3', role: 'student', approved: true, classlevel: '5', class_name: '5A' }
    ]
  }
};

const api = require('./src/modules/team-competition.js');
const adapterPath = require.resolve('./src/modules/team-competition-supabase.js');
delete require.cache[adapterPath];
require(adapterPath);

const rows = {
  team_competitions: [{
    id: '11111111-1111-4111-8111-111111111111', name: 'Trận server', classlevel: '5', class_name: '5A',
    participant_mode: 'manual', question_mode: 'same', common_exam_id: null,
    time_limit_minutes: null, status: 'active', version: 1,
    created_at: '2026-09-06T00:00:00.000Z', updated_at: '2026-09-06T00:00:00.000Z',
    started_at: '2026-09-06T00:00:00.000Z', ended_at: null
  }],
  team_competition_teams: [{
    id: '22222222-2222-4222-8222-222222222222', competition_id: '11111111-1111-4111-8111-111111111111',
    name: 'Đội A', position: 1, target_member_count: 2, leader_username: 'hs1', exam_id: null,
    status: 'active', score: 5, submitted_count: 1, correct_count: 1,
    started_at: '2026-09-06T00:00:00.000Z', completed_at: null, locked_at: null, duration_seconds: null
  }],
  team_competition_members: [
    { competition_id: '11111111-1111-4111-8111-111111111111', team_id: '22222222-2222-4222-8222-222222222222', username: 'hs1', position: 1 },
    { competition_id: '11111111-1111-4111-8111-111111111111', team_id: '22222222-2222-4222-8222-222222222222', username: 'hs2', position: 2 }
  ],
  team_competition_questions: [{
    id: '33333333-3333-4333-8333-333333333333', competition_id: '11111111-1111-4111-8111-111111111111',
    team_id: '22222222-2222-4222-8222-222222222222', question_index: 0,
    question_payload: { q: '1 + 1 = ?', type: 'Trắc nghiệm', options: ['2', '3'] },
    question_type: 'Trắc nghiệm', answer_count: 1, part_answer_counts: []
  }],
  team_competition_attempts: [],
  team_competition_answers: [],
  team_competition_results: []
};

let writeError = null;
let prepareError = null;
const savedRows = [];

function builder(table) {
  const result = { data: rows[table] || [], error: null };
  return {
    select() { return this; },
    range() { return this; },
    eq() { return this; },
    upsert(row) {
      if (table === 'team_competitions') {
        savedRows.push(row);
        result.error = writeError;
      }
      return this;
    },
    insert() { return this; },
    delete() { return this; },
    single() { return this; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); }
  };
}

const client = {
  from(table) { return builder(table); },
  rpc(name) {
    if (name === 'team_competition_prepare') return Promise.resolve({ data: null, error: prepareError });
    if (name === 'team_competition_start_attempt') return Promise.resolve({ data: null, error: null });
    return Promise.resolve({ data: null, error: null });
  },
  channel() { return { on() { return this; }, subscribe() { return this; } }; }
};

api.remote.configure(client);
assert.equal(api.remote.enabled, true);
assert.equal(api.remote._delegating, false);
assert.equal(api.remote.getStatus(), 'pending');

(async () => {
  await api.remote.syncRemote({ silent: true });
  assert.equal(api.remote.getStatus(), 'ready');
  const competition = api.store.get('11111111-1111-4111-8111-111111111111');
  assert.equal(competition.name, 'Trận server');
  assert.equal(competition.className, '5A');
  assert.deepEqual(competition.teams[0].memberUsernames, ['hs1', 'hs2']);
  assert.deepEqual(competition.excludedStudentUsernames, ['hs3']);
  assert.equal(competition.teams[0].score, 5);
  assert.equal(api.getQuestionsForTeam(competition, competition.teams[0])[0].q, '1 + 1 = ?');
  const draft = { ...competition, status: api.STATUS.DRAFT, presentationTheme: 'space-launch' };
  writeError = { code: '42703', message: 'column presentation_theme does not exist' };
  api.store.upsert(draft);
  await api.remote.flush();
  assert.equal(api.remote.getStatus(), 'error');
  assert.equal(api.store.get(draft.id).presentationTheme, 'space-launch', 'failed save must retain local draft');

  writeError = null;
  api.store.upsert(draft);
  await api.remote.flush();
  assert.equal(api.remote.getStatus(), 'ready', 'successful retry must clear stale write failure');
  assert.equal(api.remote.getError(), null);
  assert.equal(savedRows.at(-1).presentation_theme, 'space-launch');
  assert.deepEqual(savedRows.at(-1).presentation_team_identity, api.store.get(draft.id).presentationTeamIdentity);

  prepareError = { code: 'P0001', message: 'Cannot prepare competition' };
  api.store.upsert({ ...draft, status: api.STATUS.PREPARED });
  await api.remote.flush();
  assert.equal(api.remote.getStatus(), 'error', 'a final prepare RPC failure must not be reported as saved');
  prepareError = null;
  api.store.upsert({ ...draft, status: api.STATUS.PREPARED });
  await api.remote.flush();
  assert.equal(api.remote.getStatus(), 'ready');
  assert.equal(api.remote.getError(), null);

  for (const column of ['presentation_theme', 'presentation_team_identity']) {
    for (const code of ['42703', 'PGRST204']) {
      writeError = { code, message: 'Missing column ' + column };
      api.store.upsert(draft);
      await api.remote.flush();
      assert.match(api.remote.getSaveErrorMessage(), /20260915_team_competition_presentations\.sql/);
      assert.match(api.remote.getSaveErrorMessage(), /Bản nháp/);
    }
  }
  for (const error of [
    { code: '42501', message: 'permission denied presentation_theme' },
    { code: '42703', message: 'column unrelated_field does not exist' },
    { message: 'Failed to fetch' }
  ]) {
    writeError = error;
    api.store.upsert(draft);
    await api.remote.flush();
    assert.doesNotMatch(api.remote.getSaveErrorMessage(), /20260915/);
    assert.match(api.remote.getSaveErrorMessage(), /Bản nháp/);
  }
  console.log('team competition Supabase adapter contract tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
