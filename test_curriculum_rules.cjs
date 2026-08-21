const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('src/main.js', 'utf8');
const migration = fs.readFileSync('supabase_question_history.sql', 'utf8');

assert(source.includes('validateQuestionMetadata(question)'), 'Question metadata must be validated.');
assert(source.includes("question.semester"), 'Question identity must include semester.');
assert(source.includes("user_question_history"), 'Seen-question history must use Supabase.');
assert(source.includes("const topics = topicsObj[semesterKey] || []"), 'Admin topic dropdown must be scoped to semester.');
assert(source.includes('matchSubject && matchClass && matchTopic && selectedSemester'), 'Practice selection must require semester filtering.');
assert(source.includes('this.isTemplateAllowedForTopic(q.templateId || q.generator_key, selectedTopic)'), 'Practice selection must reject a template assigned to the wrong topic.');
assert(source.includes('!app.data.validateQuestionScoring(q)'), 'Practice selection must require a valid scoring structure.');
assert(source.includes("Không nhập dữ liệu vì có ${errors.length} dòng sai"), 'Excel import must reject invalid rows before importing.');
assert(source.includes('duplicateCount'), 'Excel import must skip duplicate questions.');
assert(migration.includes('CREATE TABLE IF NOT EXISTS user_question_history'), 'Migration must create shared seen-question history.');

console.log('Curriculum and question-bank contract verified.');
