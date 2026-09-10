const assert = require('node:assert/strict');
const fs = require('node:fs');

const migrationPath = 'supabase/migrations/20260910_student_progress_write_path.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
const source = fs.readFileSync('src/main.js', 'utf8');
const daily = fs.readFileSync('src/modules/daily.js', 'utf8');

assert.ok(migration, 'The student progress write-path migration must exist.');
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.student_progress_events/i,
    'Progress writes need a private idempotency ledger.');
assert.match(migration, /CREATE OR REPLACE FUNCTION public\.apply_student_progress_event\s*\(p_event jsonb\)/i,
    'Student progress must have one explicit event RPC boundary.');
assert.match(migration, /FOR UPDATE/i,
    'The event RPC must lock the student row before calculating new state.');
assert.match(migration, /ON CONFLICT\s*\([^)]*auth_user_id[^)]*event_key/i,
    'The event ledger must make retries idempotent per authenticated student.');
assert.match(migration, /consumed_at\s+TIMESTAMPTZ/i,
    'One-time rewards must have server-side consumption state.');
assert.match(migration, /free_spin_not_available/i,
    'The server must reject forged free-spin requests.');
for (const eventType of ['practice_round', 'spend_energy', 'daily_gift', 'quest_reward', 'lucky_spin']) {
    assert.match(migration, new RegExp(`['"]${eventType}['"]`, 'i'),
        `The event RPC must explicitly handle ${eventType}.`);
}
assert.match(migration, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.apply_student_progress_event\s*\(jsonb\)\s+FROM\s+PUBLIC/i,
    'The event RPC must not be callable by PUBLIC by default.');
assert.match(migration, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.apply_student_progress_event\s*\(jsonb\)\s+TO\s+authenticated/i,
    'Authenticated students must be able to use the event RPC.');
assert.match(migration, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.save_student_progress\s*\(jsonb\)\s+FROM\s+authenticated/i,
    'The client must no longer use the broad patch RPC.');

for (const method of ['recordStudentRound', 'consumeStudentEnergy', 'claimDailyGift', 'claimQuestReward', 'spinLuckyWheel']) {
    assert.match(source, new RegExp(`(?:async\\s+)?${method}\\s*\\(`),
        `The client must expose an explicit ${method} boundary.`);
}
assert.doesNotMatch(source, /history:\s*this\.currentUser\.history/,
    'The client must not send the complete currentUser history as a patch.');
assert.doesNotMatch(source, /saveStudentProgress\s*\(/,
    'Student progress callers must not use the legacy broad patch helper.');
assert.doesNotMatch(daily, /saveStudentProgress\s*\(/,
    'Daily progress callers must use explicit event methods.');
assert.match(source, /recordStudentRound\s*\(/,
    'Finishing a round must use the explicit round event.');
assert.match(source, /attempt_id|attemptId/i,
    'Round events must carry an idempotency key.');
assert.match(source, /getPendingStudentEvent\s*\(/,
    'Retryable one-time actions must reuse a pending idempotency key.');
assert.match(source, /clearPendingStudentEvent\s*\(/,
    'Successful one-time actions must clear their retry key.');
assert.match(source, /if\s*\(!error\s*&&\s*data\)\s*this\.mergeStudentProgressResult/i,
    'A failed RPC must not merge partial server state into the client.');

console.log('student progress write-path contract verified.');
