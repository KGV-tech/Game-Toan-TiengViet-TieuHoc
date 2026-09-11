const assert = require('node:assert/strict');
const fs = require('node:fs');

const adminFunction = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');
const starsMigration = fs.readFileSync('supabase_stars_migration.sql', 'utf8');

assert.match(starsMigration, /RENAME COLUMN lollipops TO stars/i,
    'The profile schema migrates the legacy lollipops balance to stars.');
assert.match(adminFunction, /action === ['"]create['"]/,
    'The admin function must keep a dedicated student-create path.');
assert.match(adminFunction, /stars:\s*0/,
    'New student profiles must initialize the current stars column.');
assert.match(adminFunction, /total_stars_earned:\s*0/,
    'New student profiles must initialize lifetime stars.');
assert.doesNotMatch(adminFunction, /lollipops\s*:/i,
    'The admin function must not insert the removed lollipops column.');

console.log('Admin student profile schema contract verified.');
