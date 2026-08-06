const assert = require('assert');
const fs = require('fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const migration = fs.readFileSync('supabase_question_templates.sql', 'utf8');

assert(source.includes("{ id: 'templates', label: 'Kho Template' }"), 'Admin must show a Template Bank tab before Question Bank.');
assert(source.includes('renderTemplates(box)'), 'Admin must render the Template Bank.');
assert(source.includes("setTemplateFilter('classlevel'"), 'Template Bank must offer grade filtering.');
assert(source.includes('template-prompt'), 'Template editor must offer an editable prompt.');
assert(source.includes('template-editor'), 'Template editor must use the full modal width through its dedicated layout.');
assert(!source.includes('onclick="app.admin.renderTemplateForm()"'), 'Template Bank must not offer a blank template creation flow.');
assert(source.includes('Lưu thành bản mới'), 'Template editor must allow copying an existing configuration.');
assert(source.includes('template-select-all'), 'Template editor must provide quick select-all controls.');
assert(source.includes('hundredBillions'), 'Template editor must support place values through hundreds of billions.');
assert(source.includes('formatMathText'), 'Math content must format long numbers with textbook-style spaces.');
assert(source.includes('formatTemplateNumberInput'), 'Template range inputs must format numbers while editing.');
assert(source.includes('template-editor__checks--places'), 'Place values must use a dedicated grouped grid layout.');
assert(source.includes('allowedPlaces'), 'Template editor must support multiple place-value selections.');
assert(source.includes('allowedDigits'), 'Template editor must support multiple digit selections.');
assert(source.includes('number.smallest_of_four'), 'The Template Bank must expose the smallest-of-four generator.');
assert(source.includes('number.largest_of_four'), 'The Template Bank must expose the largest-of-four generator.');
assert(source.includes('generateTemplateQuestion'), 'Gameplay must generate questions from active template configurations.');
assert(migration.includes("'number.smallest_of_four'"), 'Migration must seed the smallest-of-four template.');
assert(migration.includes("'number.largest_of_four'"), 'Migration must seed the largest-of-four template.');
assert(migration.includes('CREATE TABLE IF NOT EXISTS public.question_templates'), 'Migration must create template storage.');
assert(migration.includes('templates_write_teacher'), 'Only teachers may modify templates in Supabase.');

console.log('Template Bank contract verified.');
