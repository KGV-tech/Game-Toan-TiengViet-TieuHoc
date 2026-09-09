const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');

assert.match(html, /id="admin-compose-screen"/, 'Admin needs a dedicated Soạn Đề screen.');
assert.match(html, /id="admin-compose-quickstart"/, 'Soạn Đề must expose the quick-start panel.');
assert.match(html, /Các bước soạn đề/, 'The admin workflow label must be Các bước soạn đề.');
assert.match(html, /id="admin-compose-period"/, 'Soạn Đề needs a time filter.');
assert.match(html, /<option value="Học Kỳ 1">Học Kỳ 1<\/option>/, 'The time filter must offer Học Kỳ 1.');
assert.match(html, /<option value="Học Kỳ 2">Học Kỳ 2<\/option>/, 'The time filter must offer Học Kỳ 2.');
assert.match(html, /<option value="Cả Năm">Cả Năm<\/option>/, 'The time filter must offer Cả Năm.');
assert.match(html, /id="admin-compose-question-nav"/, 'The detail composer must expose question navigation.');
assert.doesNotMatch(html, /id="admin-compose-period"[\s\S]*?Kỳ kiểm tra/, 'The Soạn Đề filter must not be labelled Kỳ kiểm tra.');
assert.match(html, /id="exam-station-label"/, 'The student/admin exam station needs a role-aware label.');

assert.match(main, /openComposer\(module = 'exams'\)/, 'Admin needs a dedicated Soạn Đề entry point.');
assert.match(main, /openComposerModule\(module\)/, 'Admin dashboard cards must open their corresponding workspace.');
assert.match(main, /module === 'templates' \|\| module === 'questions' \|\| module === 'exams'/, 'The three content workspaces must be routed into Soạn Đề.');
assert.match(main, /role\?\.toLowerCase\(\) === 'admin'[\s\S]*?Soạn Đề/, 'The exam station must be renamed only for Admin.');
assert.match(main, /periodMatches\(examPeriod, selectedPeriod\)/, 'Student exam filters must remain compatible with Admin time scopes.');
assert.match(main, /period: 'Học Kỳ 1'/, 'Composer state must start in Học Kỳ 1.');
assert.match(main, /getComposerPeriodOptions\(\)[\s\S]*?value: 'Học Kỳ 1'[\s\S]*?value: 'Học Kỳ 2'[\s\S]*?value: 'Cả Năm'/, 'The detail composer must use the three approved time scopes.');
assert.match(main, /id="add-e-lessons-summary"/, 'The detail composer must summarize the selected lesson scope.');

assert.match(css, /\.admin-compose-screen/, 'The Soạn Đề screen must have its own visual system.');
assert.match(css, /\.admin-compose-card--template/, 'Template needs a distinct visual accent.');
assert.match(css, /\.admin-compose-card--questions/, 'Question bank needs a distinct visual accent.');
assert.match(css, /\.admin-compose-card--exams/, 'Exam workspace needs a distinct visual accent.');
assert.match(css, /\.admin-compose-card\.is-selected/, 'Selected workspace cards need an explicit visual state.');

console.log('Admin Soạn Đề contract verified.');
