const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('src/main.js', 'utf8');

assert(source.includes("{ id: 'student-profile', label: 'Hồ sơ học sinh' }"), 'Admin treasure must expose the student profile tab.');
assert(source.includes('async loadStudentProfile(username)'), 'Profile must load a selected student.');
assert(source.includes("from('user_pets').select('*').eq('user_username', username)"), 'Profile must load student pets.');
assert(source.includes("from('user_quests').select('*').eq('user_username', username)"), 'Profile must load student quest progress.');
assert(source.includes("from('user_question_history').select('question_key,last_seen_at').eq('user_username', username)"), 'Profile must load shared seen-question data.');
assert(source.includes('async exportStudentProfile(username)'), 'Profile must export only the selected student.');
assert(source.includes('Xuất Excel hồ sơ này'), 'Profile UI must require an explicit export action.');

console.log('Student profile contract verified.');
