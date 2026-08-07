const assert = require('assert');
const fs = require('fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const page = fs.readFileSync('index.html', 'utf8');
const migration = fs.readFileSync('supabase_question_templates.sql', 'utf8');

assert(source.includes("{ id: 'templates', label: 'Kho Template' }"), 'Admin must show a Template Bank tab before Question Bank.');
assert(source.includes('renderTemplates(box)'), 'Admin must render the Template Bank.');
assert(source.includes("setTemplateFilter('classlevel'"), 'Template Bank must offer grade filtering.');
assert(source.includes('template-prompt'), 'Template editor must offer an editable prompt.');
assert(source.includes('allowedPlaces'), 'Template editor must support multiple place-value selections.');
assert(source.includes('allowedDigits'), 'Template editor must support multiple digit selections.');
assert(source.includes('number.match_number_words'), 'Template editor must expose number-word matching.');
assert(source.includes('template-match-shapes'), 'Template editor must configure asymmetric matching shapes.');
assert(source.includes('template-match-digits'), 'Template editor must configure number lengths for matching.');
assert(source.includes('validateMatchingTemplateConfig'), 'Template editor must validate matching configuration.');
assert(source.includes('/đối chiếu số/i'), 'Legacy number-word template records must open as matching templates.');
assert(migration.includes('CREATE TABLE IF NOT EXISTS public.question_templates'), 'Migration must create template storage.');
assert(migration.includes("'number.match_number_words'"), 'Migration must seed the Grade 4 number-word matching template.');
assert(migration.includes('templates_write_teacher'), 'Only teachers may modify templates in Supabase.');
assert(page.includes('./src/main.js?v=number-match-template-v1'), 'The page must load the current Template Bank script version.');

console.log('Template Bank contract verified.');
