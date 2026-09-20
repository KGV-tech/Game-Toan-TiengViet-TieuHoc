const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const removedAssets = [
  'src/assets/student-learning/winter-hub/math-pyramid.png',
  'src/assets/student-learning/winter-hub/snow-house.png',
  'src/assets/team-competition/stadium-3d-v1/hud-panel-frame.png',
  'src/assets/team-competition/stadium-3d-v1/stadium-8-lanes.png',
  'public/student-learning-achievements-frame-transparent.png',
  'public/ui/buttons/group1/back.png',
  'public/ui/buttons/group1/logout.png',
  'public/ui/buttons/group2/claim-candy.png',
  'public/ui/buttons/group2/exchange-pet.png',
  'public/ui/buttons/group2/return-pet.png'
];
const sourceRoots = ['index.html', 'src', 'tests', 'docs'];
const ignoredDirectories = new Set(['.git', 'node_modules', 'playwright-report', 'test-results', '.tmp', 'tmp']);
const searchableExtensions = new Set(['.cjs', '.css', '.html', '.js', '.json', '.md', '.sql']);

function collectFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  if (fs.statSync(absolutePath).isFile()) {
    return searchableExtensions.has(path.extname(absolutePath).toLowerCase()) ? [absolutePath] : [];
  }
  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    return collectFiles(path.join(relativePath, entry.name));
  });
}

const sourceFiles = sourceRoots.flatMap(collectFiles);
for (const asset of removedAssets) {
  assert.equal(fs.existsSync(path.join(root, asset)), false, `${asset} must be deleted`);
  const references = sourceFiles.filter(file => fs.readFileSync(file, 'utf8').includes(asset));
  assert.deepEqual(references, [], `${asset} must not have source references`);
}

const learningCss = fs.readFileSync(path.join(root, 'src', 'student-learning.css'), 'utf8');
assert.match(learningCss, /student-learning-frame-transparent\.png/);
assert.match(learningCss, /student-learning-achievements-frame-square\.png/);
assert.doesNotMatch(learningCss, /student-learning-achievements-frame-transparent\.png/);

console.log('Asset cleanup contract verified.');
