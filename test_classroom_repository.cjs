const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync('src/modules/classroom-repository.js', 'utf8');

function fixture(client = null, local = new Map()) {
  const context = { app: { admin: { isAdminUser() { return context.app.data.currentUser?.role === 'admin'; } }, data: { currentUser: { username: 'teacher', role: 'admin' } } }, crypto: webcrypto, dummySupabase: {}, supabaseClient: null,
    localStorage: { getItem: key => local.get(key) || null, setItem: (key, value) => local.set(key, value) } };
  context.supabaseClient = context.dummySupabase;
  vm.createContext(context); vm.runInContext(source, context);
  context.app.classroom.configure(client);
  return context;
}
const plain = value => JSON.parse(JSON.stringify(value));

(async () => {
  const calls = [], server = { classroom_sections: [], classroom_weeks: [] };
  let failure = false;
  const client = {
    from(table) { assert.ok(table.startsWith('classroom_')); return { select(fields) { assert.ok(!fields.includes('*')); return { order() { return { range(start, end) { return Promise.resolve({ data: server[table].slice(start, end + 1) }); } }; } }; } }; },
    async rpc(name, args) {
      calls.push({ name, args });
      if (failure) return { error: { code: '42P01' } };
      if (name === 'classroom_save_section') {
        const row = { id: args.p_id, name: args.p_name, classlevel: args.p_classlevel, class_name: args.p_class_name, members: args.p_members, version: 1 };
        server.classroom_sections = [row]; return { data: row };
      }
      return { data: { id: args.p_id } };
    }
  };
  const c = fixture(client), repo = c.app.classroom;
  await repo.ensure(); assert.equal(repo.status, 'synced');
  const record = { id: webcrypto.randomUUID(), name: 'Tổ Demo', classlevel: '4', className: '4/4', members: ['demo'], version: 0 };
  await repo.saveSection(record);
  assert.equal(calls[0].name, 'classroom_save_section');
  assert.equal(calls[0].args.p_class_name, '4/4');
  assert.equal(repo.sections[0].version, 1);
  const other = fixture(client); await other.app.classroom.ensure();
  assert.deepEqual(plain(other.app.classroom.sections), plain(repo.sections), 'Another browser loads confirmed Supabase records');
  failure = true;
  await assert.rejects(repo.saveSection({ ...record, name: 'Unsaved' }), /migration/);
  assert.equal(repo.sections[0].name, 'Tổ Demo');
  failure = false;
  let release;
  repo.configure({ rpc: () => new Promise(resolve => { release = resolve; }) });
  const saving = repo.saveSection(record);
  c.app.data.currentUser = { username: 'other', role: 'admin' };
  release({ data: server.classroom_sections[0] });
  await assert.rejects(saving, /Tài khoản/);
  c.app.data.currentUser = { username: 'student', role: 'student' };
  await assert.rejects(repo.saveSection(record), /Admin/);

  const local = new Map([['student-roster-drafts:v1:teacher', JSON.stringify([{ ...record, type: 'sections' }])]]);
  const legacy = fixture(client, local); server.classroom_sections = [];
  await legacy.app.classroom.ensure();
  assert.equal(legacy.app.classroom.sections.length, 1, 'Loading empty server does not discard old draft');
  await legacy.app.classroom.removeSection(legacy.app.classroom.sections[0]);
  const reload = fixture(client, local); await reload.app.classroom.ensure();
  assert.equal(reload.app.classroom.sections.length, 0, 'Deleted draft does not reappear from legacy backup');

  const offline = fixture(); offline.app.classroom.activate();
  const week = { id: 'week-one', participants: [{ username: 'demo' }], scores: {}, absences: [], teams: [] };
  await offline.app.classroom.createWeek(week);
  await offline.app.classroom.createWeek({ ...week, id: 'week-two' });
  await offline.app.classroom.point('week-one', 'demo', 1);
  assert.equal(offline.app.classroom.weeks[0].scores.demo, 1);
  assert.equal(offline.app.classroom.weeks[1].scores.demo, undefined);
  await assert.rejects(offline.app.classroom.point('week-one', 'outsider', 1), /không thuộc/);
  await assert.rejects(offline.app.classroom.point('week-two', 'demo', -1), /nhỏ hơn 0/);
  offline.app.classroom.configure(client);
  await offline.app.classroom.ensure();
  assert.equal(offline.app.classroom.weeks.length, 2, 'Reconnect keeps offline weekly history');
  assert.equal(offline.app.classroom.weeks[0].scores.demo, 1);
  await assert.rejects(offline.app.classroom.point('week-one', 'demo', 1), /Lưu trận lên máy chủ/);
  const syncedCache = new Map([['classroom:v1:teacher', JSON.stringify({ sections: [{ ...record, version: 1 }], weeks: [{ ...week, localOnly: false, version: 1 }] })]]);
  const disconnected = fixture(null, syncedCache), synced = disconnected.app.classroom;
  synced.activate();
  await assert.rejects(synced.saveSection({ ...record, version: 1 }), /Kết nối lại/);
  await assert.rejects(synced.removeSection(synced.sections[0]), /Kết nối lại/);
  await assert.rejects(synced.point('week-one', 'demo', 1), /Kết nối lại/);
  await assert.rejects(synced.setAbsences('week-one', ['demo']), /Kết nối lại/);
  assert.deepEqual(plain(synced.weeks[0].scores), {});

  const sql = fs.readFileSync('supabase/migrations/20261002_classroom_sections_weekly.sql', 'utf8');
  assert.doesNotMatch(sql, /(?:UPDATE|INSERT INTO|DELETE FROM|ALTER TABLE)\s+public\.(?:game_users|team_competitions|user_quests|game_quests)\b/i);
  const functions = sql.split(/CREATE OR REPLACE FUNCTION public\./).slice(1);
  assert.equal(functions.length, 5);
  for (const fn of functions) {
    assert.match(fn, /SECURITY DEFINER SET search_path = ''/);
    assert.match(fn, /IF NOT coalesce\(private\.is_admin\(\), false\)/);
  }
  for (const table of ['classroom_sections', 'classroom_weeks', 'classroom_point_events']) assert.ok(sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
  assert.match(sql, /p_event_id[\s\S]+FOR UPDATE[\s\S]+RETURN to_jsonb\(v_week\)/);
  console.log('Classroom repository: confirmed saves, reload, failure, owner boundary, legacy drafts, per-week isolation and migration security passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
