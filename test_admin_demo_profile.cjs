const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const migration = fs.readFileSync('supabase_admin_demo_profile.sql', 'utf8');

assert.match(source, /'teacher-female': \{ label: 'Giáo viên nữ', image: '\.\/public\/avatar-teacher-female\.png' \}/, 'The teacher avatar must be an explicit valid avatar choice.');
assert.match(source, /lollipopCount = Number\(user\.lollipops \|\| 0\)\.toLocaleString\('vi-VN'\)/, 'The admin header must display a Vietnamese-formatted candy balance.');
assert.match(source, /Bộ sưu tập minh hoạ cho Giáo viên/, 'The teacher pet tab must remain populated for UI review.');
assert.match(source, /Giáo viên không trang bị thú cưng/, 'The preview must not imply that an admin owns or equips pets.');
assert.match(migration, /avatar_key = 'teacher-female'/, 'The admin demo migration must assign the teacher avatar.');
assert.match(migration, /GREATEST\(COALESCE\(lollipops, 0\), 1000\)/, 'The admin demo migration must guarantee at least 1,000 candies.');
assert.match(migration, /WHERE lower\(trim\(COALESCE\(role, ''\)\)\) = 'admin'/, 'The admin demo migration must target only admin profiles.');

console.log('Admin demo profile contract verified.');
