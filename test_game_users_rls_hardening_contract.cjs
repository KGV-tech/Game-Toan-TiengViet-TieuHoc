const assert = require('node:assert/strict');
const fs = require('node:fs');

const migrationPath = 'supabase/migrations/20260910_game_users_rls_hardening.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
const baseline = fs.readFileSync('supabase_auth_security.sql', 'utf8');
const source = fs.readFileSync('src/main.js', 'utf8');
const daily = fs.readFileSync('src/modules/daily.js', 'utf8');
const adminFunction = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');

assert.ok(migration, 'The game_users RLS hardening migration must exist.');

for (const sql of [baseline, migration]) {
    assert.match(sql, /REVOKE\s+UPDATE\s+ON\s+public\.game_users\s+FROM\s+authenticated/i,
        'Authenticated clients must not have direct UPDATE privilege on game_users.');
    assert.match(sql, /profiles_update_admin_only/i,
        'Direct game_users updates must be limited to the admin policy.');
    assert.doesNotMatch(sql, /CREATE POLICY\s+["']profiles_update_own_or_teacher["'][\s\S]{0,500}?FOR\s+UPDATE/i,
        'The old broad own-profile UPDATE policy must not remain active.');
    assert.match(sql, /save_student_progress/i,
        'Student progress must have a named RPC boundary.');
    assert.match(sql, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.save_student_progress/i,
        'The progress RPC must not be callable by PUBLIC by default.');
    assert.match(sql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.save_student_progress/i,
        'Authenticated students must be able to use the progress RPC.');
    assert.match(sql, /role|approved|stars|total_stars_earned|totalscore|history|auth_user_id/i,
        'The hardening contract must name protected profile/progress fields.');
    for (const field of ['stars', 'total_stars_earned', 'energy', 'practice_streak', 'daily_gift_streak', 'lucky_spin_count']) {
        assert.match(sql, new RegExp(`p_patch->>'${field}'\\)\\s*!~\\s*'\\^\\[0-9\\]\\+\\$'`, 'i'),
            `${field} must be an integer-shaped JSON number before it is cast to an integer.`);
    }
}

assert.match(baseline, /profiles_insert_own_student[\s\S]{0,450}approved/i,
    'Self-registration must not be able to insert an approved profile.');
assert.match(migration, /guard_game_users_insert/i,
    'A database guard must protect initial student profile values.');
assert.match(migration, /COALESCE\s*\(NEW\.stars\s*,\s*0\)\s*[<>!=]+\s*0/i,
    'A self-created profile must start without stars.');
assert.match(migration, /COALESCE\s*\(NEW\.totalscore\s*,\s*0\)\s*[<>!=]+\s*0/i,
    'A self-created profile must start without score.');

assert.match(source, /recordStudentRound\s*\(/,
    'The client must expose an explicit, narrow round-event persistence boundary.');
assert.match(source, /apply_student_progress_event/,
    'The client must call the server-authoritative event RPC.');
assert.doesNotMatch(source, /saveStudentProgress\s*\(/,
    'The client must not keep the legacy broad progress patch helper.');
assert.doesNotMatch(source, /from\(['"]game_users['"]\)\.update\(this\.currentUser\)/,
    'The client must not send the entire currentUser object to game_users.');
assert.doesNotMatch(source, /from\(['"]game_users['"]\)\.update\(\{\s*approved:/,
    'Admin approval must not use a direct browser table update.');
assert.doesNotMatch(source, /from\(['"]game_users['"]\)\.update\(\{\s*fullname:/,
    'Admin profile edits must not use a direct browser table update.');
assert.match(source, /async saveUsers\(\)\s*\{[\s\S]{0,180}if\s*\(window\.supabase\)\s*return/,
    'The legacy whole-profile save fallback must be disabled when Supabase is active.');
assert.match(daily, /app\.data\.consumeStudentEnergy\s*\(/,
    'Daily energy writes must use the explicit energy event boundary.');
assert.match(daily, /app\.data\.claimDailyGift\s*\(/,
    'Daily reward writes must use the explicit gift event boundary.');
assert.doesNotMatch(daily, /saveStudentProgress\s*\(/,
    'Daily progress callers must not use the legacy broad patch helper.');
assert.doesNotMatch(daily, /from\(['"]game_users['"]\)\.update\(/,
    'Daily module must not update game_users directly.');

assert.match(adminFunction, /action === ['"]update_profile['"]/,
    'The server admin function must own profile edits.');
assert.match(adminFunction, /action === ['"]approve['"]/,
    'The server admin function must own approval changes.');
assert.match(adminFunction, /fullname[\s\S]{0,160}(length|trim)/,
    'Admin profile names must have a bounded validation path.');

console.log('game_users RLS hardening contract verified.');
