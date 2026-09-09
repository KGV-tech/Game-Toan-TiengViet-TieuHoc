const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');

const phase2Scripts = [
  'even-odd.js',
  'variable-expressions.js',
  'review-b01-b04.js'
];
for (const script of phase2Scripts) {
  assert.match(html, new RegExp(`src="\\./src/question-templates/grade-4/math/${script}"`),
    `index.html must load ${script} before the registry.`);
}

const phase2Keys = [
  'number.even_odd_classify',
  'number.even_odd_count',
  'number.even_odd_sequence',
  'number.even_odd_form',
  'number.variable_expression_value',
  'number.variable_expression_choice',
  'number.hk1_review_b01_b04'
];
for (const key of phase2Keys) {
  assert.match(main, new RegExp(key.replaceAll('.', '\\.'), 'g'),
    `Admin editor must expose ${key}.`);
}
assert.match(main, /template-editor__rule--phase2-controls/,
  'Admin editor needs a dedicated Phase 2 configuration panel.');
assert.match(main, /template-phase2-list-length-min/,
  'B03 list-count settings must be editable without falling back to generic digit settings.');
assert.match(main, /template-phase2-variable-minimum/,
  'B04 variable-expression settings must be editable.');
assert.match(main, /isPhase2Template/,
  'Template collection must preserve Phase 2 config instead of generic config.');
assert.match(main, /number\.hk1_review_b01_b04[\s\S]*?Bài 1–4/,
  'B06 editor copy must identify its exact review scope.');

assert.doesNotMatch(main, /number\.even_odd_.*b05|variable_expression.*b05|hk1_review_b01_b05/i,
  'Phase 2 UI must not expose a deferred B05 generator.');

console.log('Phase 2 Admin editor contract verified.');
