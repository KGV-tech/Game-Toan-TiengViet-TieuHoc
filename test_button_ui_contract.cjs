const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');

const groupOneAssets = [
  'login-start.png', 'register.png', 'logout.png', 'back.png', 'check.png',
  'continue.png', 'score.png', 'exit.png', 'start-adventure.png', 'start-exam.png',
];

for (const asset of groupOneAssets) {
  assert.ok(fs.existsSync(`public/ui/buttons/group1/${asset}`), `Missing group 1 button asset: ${asset}`);
}

assert.match(css, /\.asset-button/, 'Group 1 must use an image-button layout class.');
assert.doesNotMatch(css, /\.sci-fi-button\s*\{/, 'The CSS-drawn sci-fi button frame must be removed.');
assert.match(html, /id="logout-btn"[^>]*class="[^"]*asset-button/, 'Map logout must use the image-button class.');
assert.match(html, /id="game-start-btn"[^>]*asset-button--wide/, 'Exploration must use the wide image-button variant.');
assert.match(html, /id="submit-ans-btn"[^>]*class="[^"]*asset-button/, 'Check and continue must use image buttons.');
assert.match(html, /id="submit-ans-img"[^>]*src="\.\/public\/ui\/buttons\/group1\/check\.png"/, 'Check must start with the approved check asset.');
assert.match(main, /submit-ans-img'\)\.src = '\.\/public\/ui\/buttons\/group1\/continue\.png'/, 'The next-question action must swap to the approved continue asset.');
assert.doesNotMatch(html, /sci-fi-button/, 'Group 1 markup must no longer use CSS-drawn sci-fi buttons.');
assert.doesNotMatch(main, /getElementById\('start-adv-icon'\)/, 'Subject selection must not reference the removed torch icon from the old button.');

console.log('Group 1 image-button contract verified.');
