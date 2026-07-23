const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const migration = fs.readFileSync('supabase_auth_security.sql', 'utf8');
const adminFunction = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');

assert.match(source, /auth\.signInWithPassword/, 'Login must use Supabase Auth.');
assert.match(source, /auth_user_id/, 'Profiles must be linked to an Auth identity.');
assert.doesNotMatch(source, /u === 'admin' && p === '123'/, 'The default admin backdoor must be removed.');
assert.match(migration, /REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon/, 'Anonymous database access must be revoked.');
assert.match(migration, /private\.is_admin\(\)/, 'RLS must use a server-side admin check.');
assert.match(migration, /profiles_select_own_or_teacher/, 'Student profiles must be isolated by Auth identity.');
assert.match(adminFunction, /SUPABASE_SERVICE_ROLE_KEY/, 'Administrative account provisioning must keep the service key on the server.');
assert.doesNotMatch(adminFunction, /Access-Control-Allow-Origin': '\*'/, 'Admin function must not use a wildcard CORS origin.');
assert.match(adminFunction, /legacy_profile_linked/, 'Resetting a legacy student must link that profile to a new Auth account.');
assert.match(source, /student_not_found/, 'The teacher UI must explain why a password reset cannot be completed.');
assert.match(source, /auth_account_exists/, 'The teacher UI must explain when an Auth account already exists.');
assert.match(source, /!app\.data\.users\.find\(x => x\.id === data\.profile\.id\)/, 'Creating a student must not duplicate the realtime profile in the teacher list.');
assert.match(source, /setButtonLoading\(buttonId, isLoading, loadingLabel/, 'Slow actions must show a clear loading state and prevent repeated clicks.');
assert.match(source, /setButtonLoading\('login-btn', true, 'Vui lòng chờ…'\)/, 'Login must visibly acknowledge loading before fetching protected data.');
assert.match(source, /Promise\.all\(\[/, 'Independent post-login data loads must run in parallel.');

console.log('Supabase Auth and RLS security contract verified.');
