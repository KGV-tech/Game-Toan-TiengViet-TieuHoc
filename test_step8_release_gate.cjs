const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const requiredFiles = [
  'index.html',
  'src/main.js',
  'src/style.css',
  'src/modules/lifecycle.js',
  'src/question-templates/grade-4/math/index.js',
  'docs/templates/PHASE_6_B22_B23_B24_B25_B26.md',
  'docs/templates/PHASE_7_B27_B28_B29_B30_B31_B32.md',
  'docs/templates/PHASE_8_B33_B34_B35_B36_B37.md',
  'test_step5_performance_contract.cjs',
  'test_step6_lifecycle_contract.cjs',
  'test_step7_design_system_contract.cjs',
  'test_step8_release_gate.cjs',
  'docs/ROADMAP_STEPS_AUDIT_20260912.md'
];

for (const file of requiredFiles) {
  assert.ok(fs.existsSync(path.join(root, file)), `Release gate file is missing: ${file}`);
}

const todo = read('tasks/todo.md');
for (let step = 1; step <= 8; step += 1) {
  assert.ok(todo.includes(`- [x] **Bước ${step}:`), `Bước ${step} is not checked off`);
}

const index = read('index.html');
assert.match(index, /id="admin-compose-screen"/);
assert.match(index, /id="treasure-modal"[^>]*role="dialog"/);
assert.match(index, /id="exam-station-image"[^>]*luyen-de\.png/);
assert.match(index, /id="admin-station"/);

const fixtures = read('tests/e2e/audit-fixtures.cjs');
assert.doesNotMatch(fixtures, /\bundefined\b/, 'Audit fixture must not contain undefined data');

const sourceFiles = [
  'index.html',
  ...fs.readdirSync(path.join(root, 'src')).filter(file => file.endsWith('.css')).map(file => path.join('src', file))
];
const localRefs = [];
for (const file of sourceFiles) {
  const content = read(file);
  const pattern = file === 'index.html'
    ? /(?:src|href)\s*=\s*["']([^"']+)["']/g
    : /url\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = pattern.exec(content))) {
    const ref = match[1].split(/[?#]/, 1)[0];
    if (!ref || /^(https?:|data:|#|javascript:)/i.test(ref)) continue;
    if (!ref.includes('public/')) continue;
    localRefs.push({ file, ref });
  }
}
for (const { file, ref } of localRefs) {
  assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), ref)), `Broken local asset reference: ${file} -> ${ref}`);
}

console.log(`Bước 8 release gate contract passed (${localRefs.length} local asset refs checked)`);
