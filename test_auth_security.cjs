const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const migration = fs.readFileSync('supabase_auth_security.sql', 'utf8');
const adminFunction = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8') + fs.readFileSync('src/login-layout.css', 'utf8');

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
assert.match(source, /setButtonLoading\('login-btn', true, 'Đang đăng nhập…'\)/, 'Login must visibly say that sign-in is in progress before fetching protected data.');
assert.match(source, /Promise\.all\(\[/, 'Independent post-login data loads must run in parallel.');
assert.match(source, /avatar_key/, 'New student profiles must save their selected avatar.');
assert.match(migration, /avatar_key TEXT/, 'The user profile migration must persist an avatar key.');

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /name="reg-avatar"/, 'Registration must offer an avatar selection.');
assert.match(html, /id="player-info" class="player-info-card"/, 'The map must retain a dedicated player information card.');
assert.match(source, /player-info-card__avatar/, 'The player card must render the chosen avatar.');
assert.match(source, /Đang đăng nhập…/, 'The loading state must use the clear Vietnamese sign-in label.');
assert.match(source, /button-loading/, 'Image buttons must render a visible loading treatment instead of transparent text.');
assert.match(html, /value="boy-short"/, 'Registration must include boy avatars.');
assert.match(html, /value="girl-long"/, 'Registration must include girl avatars.');
assert.match(html, /value="girl-doll"/, 'Registration must include varied girl hairstyles.');
assert.match(html, /value="boy-reader"/, 'Registration must include the second set of boy avatars.');
assert.match(html, /value="girl-inventor"/, 'Registration must include the second set of girl avatars.');
assert.match(source, /setAvatarGroup\(group, button\)/, 'The avatar picker must let pupils switch between boy and girl avatar groups.');
assert.match(css, /overflow-x: auto/, 'Avatar choices must use a horizontal scroller instead of adding a second row.');
assert.match(css, /input:checked \+ span \{[^}]*background-color/, 'Selecting an avatar must not overwrite its sprite background image.');
assert.match(css, /label:hover span/, 'Hovering an avatar must enlarge its portrait for easier selection.');
assert.match(css, /min-inline-size: 0/, 'The avatar fieldset must be allowed to shrink inside the registration panel.');
assert.match(css, /max-width: 100%/, 'The avatar picker must never exceed its registration panel.');
assert.doesNotMatch(html, /<em>/, 'Avatar names must not be shown beneath the portraits.');
assert.match(css, /aspect-ratio: 1055 \/ 1789/, 'The registration frame must be extended by about twenty percent.');

console.log('Supabase Auth and RLS security contract verified.');
