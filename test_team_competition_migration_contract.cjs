const assert = require('node:assert/strict');
const fs = require('node:fs');

const file = 'supabase/migrations/20260906_team_competitions.sql';
const sql = fs.readFileSync(file, 'utf8');
const lower = sql.toLowerCase();

for (const table of [
  'team_competitions',
  'team_competition_teams',
  'team_competition_members',
  'team_competition_questions',
  'team_competition_attempts',
  'team_competition_answers',
  'team_competition_results'
]) {
  assert.match(lower, new RegExp(`create table if not exists public\\.${table}`), `${table} table is missing`);
}

for (const fn of [
  'team_competition_save_questions',
  'team_competition_prepare',
  'team_competition_start',
  'team_competition_start_attempt',
  'team_competition_lock_attempt',
  'team_competition_submit_answer',
  'team_competition_end'
]) {
  assert.match(lower, new RegExp(`create or replace function public\\.${fn}`), `${fn} RPC is missing`);
}

assert.match(lower, /private\.team_competition_answer_keys/);
assert.match(lower, /team_competition_sanitize_question/);
assert.match(lower, /team_competition_score_question/);
assert.match(lower, /team_competition_guard_team_update/);
assert.match(lower, /alter table public\.team_competitions enable row level security/);
assert.match(lower, /alter table public\.team_competition_attempts enable row level security/);
assert.match(lower, /revoke all on private\.team_competition_answer_keys from public, anon, authenticated/);
assert.match(lower, /alter publication supabase_realtime add table public\.%i/);
assert.match(lower, /private\.is_admin\(\)/);
assert.match(lower, /private\.current_username\(\)/);
assert.match(lower, /team_competition_is_member/);
assert.match(lower, /team_competition_is_leader/);
assert.match(lower, /leader_only/);
assert.match(lower, /attempt_session_mismatch/);
assert.match(lower, /question already submitted|unique \(attempt_id, question_index\)/i);

// The feature migration must not mutate legacy game data or grant answer keys to students.
assert.doesNotMatch(lower, /drop table\s+public\.game_/);
assert.doesNotMatch(lower, /delete\s+from\s+public\.game_users/);
assert.doesNotMatch(lower, /grant\s+.*team_competition_answer_keys\s+to\s+(public|anon|authenticated)/);
assert.doesNotMatch(lower, /supabase_rls\.sql\s*\n\s*run/);

console.log('team competition migration contract tests passed');
