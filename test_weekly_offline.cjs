const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto: crypto } = require('node:crypto');
function fixture(storage = new Map(), client = null) {
  const context = { crypto, console, navigator: {}, app: { admin: { isAdminUser: () => context.app.data.currentUser?.role === 'admin' }, data: { currentUser: { id: 'teacher-id', auth_user_id: 'auth-teacher', username: 'teacher', role: 'admin' }, users: [{ username: 'a', fullname: 'An', role: 'student', approved: true, classlevel: '4', class_name: '4/4' }] } }, dummySupabase: {}, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } };
  context.supabaseClient = context.dummySupabase;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('src/modules/classroom-repository.js', 'utf8'), context);
  if (fs.existsSync('src/modules/weekly-offline-store.js')) vm.runInContext(fs.readFileSync('src/modules/weekly-offline-store.js', 'utf8'), context);
  context.app.classroom.configure(client);
  return context;
}
const week = { id: crypto.randomUUID(), name: 'Tuần 1', classlevel: '4', className: '4/4', startDate: '2026-10-04', endDate: '2026-10-10', mode: 'groups', participants: [{ username: 'a', fullname: 'An' }], teams: [{ id: 'g1', name: 'Nhóm 1', members: ['a'] }], scores: {}, absences: [], version: 1 };
(async () => {
  const storage = new Map(); const c = fixture(storage), repo = c.app.classroom;
  repo.activate(); repo.weeks = [{ ...week, version: 3 }];
  await repo.setOffline(true);
  await repo.point(week.id, 'a', 1, 'event-one');
  assert.equal(repo.weeks[0].scores.a, 1);
  assert.equal(repo.offlineQueue.length, 1);
  const restored = fixture(storage).app.classroom; restored.activate();
  assert.equal(restored.offlineMode, true);
  assert.equal(restored.weeks[0].scores.a, 1);
  assert.equal(restored.offlineQueue[0].eventId, 'event-one');
  c.app.data.currentUser = { id: 'other', username: 'other', role: 'admin' }; repo.activate();
  assert.equal(repo.offlineQueue.length, 0);
  assert.equal(repo.weeks.length, 0);
  let server = { ...week, version: 3, scores: {} }, lost = true;
  const events = new Set(), calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'auth-teacher' } } }) },
    from: () => ({ select: () => ({ order: () => ({ range: async () => ({ data: [server] }) }) }) }),
    async rpc(name, args) {
      calls.push(args.p_event_id);
      if (!events.has(args.p_event_id)) { events.add(args.p_event_id); server = { ...server, version: server.version + 1, scores: { a: (server.scores.a || 0) + args.p_delta } }; }
      if (lost) { lost = false; throw new Error('response lost'); }
      return { data: server };
    }
  };
  const syncing = fixture(storage, client).app.classroom; syncing.activate();
  await assert.rejects(syncing.syncOffline());
  assert.equal(syncing.offlineQueue.length, 1);
  await syncing.syncOffline();
  assert.equal(syncing.weeks[0].scores.a, 1);
  assert.equal(syncing.offlineQueue.length, 0);
  assert.deepEqual(calls, ['event-one', 'event-one']);
  assert.equal(server.scores.a, 1, 'Retry must not double a committed point');
  assert.equal(syncing.offlineMode, false);
  const fresh = fixture().app.classroom; fresh.activate(); await fresh.setOffline(true);
  await fresh.createWeek(week);
  await fresh.setAbsences(week.id, ['a']);
  await fresh.setWeekTeams(fresh.weeks[0], 'groups', [{ id: 'g2', name: 'Nhóm mới', members: ['a'] }]);
  assert.deepEqual(JSON.parse(JSON.stringify(fresh.offlineQueue.map(op => op.type))), ['create', 'absences', 'teams']);
  assert.equal(fresh.weeks[0].version, 3);
  await fresh.deleteWeek(fresh.weeks[0]);
  assert.equal(fresh.weeks.length, 0);
  assert.equal(fresh.offlineQueue.length, 0, 'An unsent local week can be deleted without creating server work');
  let remote = { ...week, version: 4, scores: {}, absences: [] }, rpcCount = 0;
  const metaClient = { ...client,
    from: () => ({ select: () => ({ order: () => ({ range: async () => ({ data: remote ? [remote] : [] }) }) }) }),
    async rpc(name, args) {
      rpcCount++;
      if (name === 'classroom_set_absences') remote = { ...remote, absences: args.p_absences, version: remote.version + 1 };
      if (name === 'classroom_delete_week') { const row = remote; remote = null; return { data: row }; }
      return { data: remote };
    }
  };
  const conflictStore = new Map(), conflictContext = fixture(conflictStore, metaClient), conflict = conflictContext.app.classroom;
  conflict.activate(); conflict.weeks = [{ ...week, version: 3 }]; await conflict.setOffline(true);
  await conflict.setAbsences(week.id, ['a']);
  await assert.rejects(conflict.syncOffline(), /thiết bị khác/);
  assert.equal(rpcCount, 0); assert.equal(conflict.offlineQueue.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(conflict.weeks[0].absences)), ['a']);
  remote.version = 3;
  await conflict.syncOffline();
  assert.equal(rpcCount, 1); assert.equal(conflict.offlineQueue.length, 0);
  await conflict.setOffline(true); await conflict.deleteWeek(conflict.weeks[0]); await conflict.syncOffline();
  assert.equal(conflict.weeks.length, 0, 'Deleted weeks stay deleted after refresh');
  const stale = fixture(storage).app.classroom; stale.activate();
  const current = fixture(storage).app.classroom; current.activate(); await current.setOffline(true);
  await assert.rejects(stale.setOffline(true), /cửa sổ khác/);
  const blocked = fixture(); blocked.app.classroom.activate(); blocked.localStorage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(blocked.app.classroom.setOffline(true), /Không lưu được/);
  assert.equal(blocked.app.classroom.offlineMode, false);
  const wrong = fixture(storage, { ...client, auth: { getUser: async () => ({ data: { user: { id: 'wrong-account' } } }) } }).app.classroom;
  wrong.activate(); await assert.rejects(wrong.syncOffline(), /Đăng nhập lại/);
  let teamRemote = { ...week, version: 3, scores: {}, teams: [{ id: 'g1', name: 'Nhóm 1', kind: 'groups', members: ['a'] }] }, teamLost = true;
  const teamClient = { ...client,
    from: () => ({ select: () => ({ order: () => ({ range: async () => ({ data: [teamRemote] }) }) }) }),
    async rpc(name, args) {
      teamRemote = { ...teamRemote, version: 4, teams: args.p_teams.map(team => ({ members: team.members, kind: team.kind, name: team.name, id: team.id })) };
      if (teamLost) { teamLost = false; throw new Error('lost teams response'); }
      return { data: teamRemote };
    }
  };
  const teamRepo = fixture(new Map(), teamClient).app.classroom;
  teamRepo.activate(); teamRepo.weeks = [{ ...week, version: 3 }]; await teamRepo.setOffline(true);
  await teamRepo.setWeekTeams(teamRepo.weeks[0], 'groups', [{ id: 'new', name: 'Nhóm mới', members: ['a'] }]);
  await assert.rejects(teamRepo.syncOffline()); await teamRepo.syncOffline();
  assert.equal(teamRepo.offlineQueue.length, 0, 'JSONB property order does not cause a false conflict');
  console.log('Weekly offline durable, account-scoped point queue verified.');
})().catch(error => { console.error(error); process.exit(1); });
