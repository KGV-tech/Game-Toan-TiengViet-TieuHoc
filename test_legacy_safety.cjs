const assert = require('node:assert/strict');
const fs = require('node:fs');

const legacyRls = fs.readFileSync('supabase_rls.sql', 'utf8');
assert.match(legacyRls, /DEPRECATED/i, 'The legacy RLS file must be clearly marked as deprecated.');
assert.match(
  legacyRls,
  /supabase_auth_security\.sql/,
  'The legacy RLS file must direct operators to the Auth-enabled migration.'
);
assert.doesNotMatch(
  legacyRls,
  /\b(?:ALTER\s+TABLE|CREATE\s+POLICY)\b/i,
  'The deprecated RLS file must not retain executable policy or table statements.'
);

console.log('Deprecated database migration safety contract verified.');
