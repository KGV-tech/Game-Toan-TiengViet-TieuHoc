const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('src/main.js', 'utf8');
const migration = fs.readFileSync('supabase_exam_quests.sql', 'utf8');

assert(source.includes('renderQuestionInput(question, index)'), 'Exam UI must render controls by question type.');
assert(source.includes("type === 'Đối chiếu trùng khớp'"), 'Exam UI must support matching questions.');
assert(source.includes("type === 'Kéo thả'"), 'Exam UI must support drag/drop questions with simple controls.');
assert(source.includes('filtered[Math.floor(Math.random() * filtered.length)]'), 'Students must receive a random matching exam.');
assert(source.includes('startExam(questId)'), 'Quest UI must be able to launch an assigned exam.');
assert(source.includes('q.exam_id && (q.id !== questId || q.exam_id !== examId)'), 'Only the assigned exam may advance an exam quest.');
assert(migration.includes('ADD COLUMN IF NOT EXISTS exam_id'), 'Migration must link quests to exams.');

console.log('Exam and quest workflow contract verified.');
