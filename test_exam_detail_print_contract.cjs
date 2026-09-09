const assert = require('node:assert/strict');
const fs = require('node:fs');

const main = fs.readFileSync('src/main.js', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');

assert.match(main, /renderExamPrintSubquestions\(question\)/, 'Exam detail must render nested multiple-choice parts.');
assert.match(main, /renderExamPrintQuestionParts\(question\)/, 'Exam detail must select a renderer for each structured question kind.');
assert.match(main, /window\.open\('', '_blank'\)/, 'A4 printing must use a standalone print window.');
assert.match(main, /renderExamPrintContent\(exam, 'print-document'\)/, 'The standalone print document needs a stable root id.');
assert.match(main, /class="exam-print__title"/, 'The printed exam must expose its custom title.');
assert.doesNotMatch(main, /compactAction\('In PDF \/ A4', 'window\.print\(\)'/, 'The detail view must not print the Admin page directly.');

assert.match(css, /\.exam-print__question\s*\{/, 'Exam print questions need a dedicated layout style.');
assert.match(css, /\.exam-print__subquestion\s*\{/, 'Nested subquestions need a dedicated layout style.');
assert.match(css, /@page\s*\{[\s\S]*?size:\s*A4\s+portrait;/, 'The print stylesheet must target A4 paper.');
assert.match(css, /body\s*>\s*#print-document\s*\{[\s\S]*?display:\s*block/, 'Print media must keep only the standalone document visible.');

console.log('Exam detail and A4 print contract verified.');
