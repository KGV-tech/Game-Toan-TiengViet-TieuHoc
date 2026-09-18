const assert = require('node:assert/strict');
const fs = require('node:fs');

const file = 'supabase/migrations/20260906_team_competitions.sql';
const sql = fs.readFileSync(file, 'utf8');
const lower = sql.toLowerCase();
const classNameMigration = fs.readFileSync('supabase/migrations/20260907_team_competitions_class_name.sql', 'utf8').toLowerCase();
const groupedAnswersMigration = fs.readFileSync('supabase/migrations/20260916_team_competition_grouped_answers.sql', 'utf8').toLowerCase();
const uuidDefaultsMigration = fs.readFileSync('supabase/migrations/20260916_team_competition_uuid_defaults.sql', 'utf8').toLowerCase();
const speedRaceMigration = fs.readFileSync('supabase/migrations/20260917_team_competition_speed_race.sql', 'utf8').toLowerCase();
const submitAnswerFixMigration = fs.readFileSync('supabase/migrations/20260918_team_competition_submit_answer_question_id_fix.sql', 'utf8').toLowerCase();
const groupedAnswersSql = groupedAnswersMigration.replace(/--.*$/gm, '');

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
assert.match(lower, /jsonb_array_length\(input->'partanswercounts'\)/,
  'Grouped answer counts must be recognized when saving questions.');
assert.match(lower, /jsonb_array_length\(input->'partanswercounts'\)\s+in\s*\(1,\s*2,\s*4\)/,
  'Only supported scoring-group counts may be stored for grouped questions.');
assert.match(lower, /array_length\(part_counts,\s*1\),\s*0\)\s+in\s*\(1,\s*2,\s*4\)/,
  'Server scoring must apply the same grouped-question limits as the client.');
assert.match(lower, /grouped_correct_count::numeric\s*\/\s*array_length\(part_counts,\s*1\)/,
  'Server scoring must normalize grouped questions by their number of scoring groups.');
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
assert.match(classNameMigration, /alter table public\.team_competitions\s+add column if not exists class_name text/);

for (const fn of [
  'private.team_competition_answer_count',
  'private.team_competition_score_question',
  'public.team_competition_save_questions'
]) {
  assert.match(groupedAnswersSql, new RegExp('create or replace function ' + fn.replaceAll('.', '\\.')), fn + ' grouped-answer patch is missing');
}
assert.doesNotMatch(groupedAnswersSql, /create table|alter table|create policy|drop policy|grant |revoke /,
  'Grouped-answer patch must not change schema, RLS, or permissions.');

for (const target of [
  'team_competitions alter column id set default gen_random_uuid\\(\\)',
  'team_competition_teams alter column id set default gen_random_uuid\\(\\)',
  'team_competition_questions alter column id set default gen_random_uuid\\(\\)',
  'team_competition_attempts alter column id set default gen_random_uuid\\(\\)',
  'team_competition_attempts alter column session_id set default gen_random_uuid\\(\\)',
  'team_competition_answers alter column id set default gen_random_uuid\\(\\)',
  'team_competition_results alter column id set default gen_random_uuid\\(\\)'
]) {
  assert.match(uuidDefaultsMigration.replace(/\s+/g, ' '), new RegExp(`alter table public\\.${target}`), `UUID default patch is missing: ${target}`);
}
assert.doesNotMatch(uuidDefaultsMigration, /uuid_generate_v4/, 'UUID patch must not require uuid-ossp.');
assert.match(uuidDefaultsMigration, /create or replace function public\.team_competition_start_attempt/,
  'UUID patch must replace the leader-attempt RPC that used the unavailable uuid-ossp function.');
assert.match(uuidDefaultsMigration, /coalesce\(p_session_id, gen_random_uuid\(\)\)/,
  'Leader attempts must generate their session UUID with the Supabase-supported generator.');
assert.match(speedRaceMigration, /drop constraint if exists team_competitions_presentation_theme_check/,
  'Speed-race migration must replace the accidental one-theme constraint.');
assert.match(speedRaceMigration, /check \(presentation_theme in \('speed-race'\)\)/,
  'Only the completed speed-race asset may be persisted until another asset is finished.');
assert.match(speedRaceMigration, /set presentation_theme = 'speed-race'\s+where presentation_theme = 'stadium-3d'/,
  'Existing temporary stadium records must become the completed speed-race theme.');
assert.match(submitAnswerFixMigration, /create or replace function public\.team_competition_submit_answer/,
  'Submit-answer repair must replace the deployed RPC.');
assert.match(submitAnswerFixMigration, /p_attempt_id,\s*question_row\.id,\s*p_question_index/,
  'Submit-answer repair must save the question UUID, never the complete question record.');
assert.doesNotMatch(submitAnswerFixMigration, /create table|alter table|create policy|drop policy|grant |revoke /,
  'Submit-answer repair must not change schema, RLS, or permissions.');

console.log('team competition migration contract tests passed');
