const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');

const groupOneAssets = [
  'login-start.png', 'register.png', 'logout.png', 'back.png', 'check.png',
  'continue.png', 'score.png', 'exit.png', 'start-adventure.png', 'start-exam.png',
];
const groupTwoAssets = [
  'claim-candy.png', 'start-mission-exam.png', 'activate-pet.png',
  'deactivate-pet.png', 'return-pet.png', 'exchange-pet.png',
  'shop-pets-tab.png', 'shop-my-pets-tab.png', 'shop-lucky-tab.png', 'spin-lucky.png',
];
const groupFourAssets = ['create.png', 'save.png', 'edit.png', 'delete.png', 'approve.png', 'export-excel.png'];
const groupFiveAssets = ['view.png', 'print.png', 'cancel.png', 'close.png', 'back.png', 'upload.png', 'add-to-exam.png'];

for (const asset of groupOneAssets) {
  assert.ok(fs.existsSync(`public/ui/buttons/group1/${asset}`), `Missing group 1 button asset: ${asset}`);
}
for (const asset of groupTwoAssets) {
  assert.ok(fs.existsSync(`public/ui/buttons/group2/${asset}`), `Missing group 2 button asset: ${asset}`);
}
for (const asset of groupFourAssets) {
  assert.ok(fs.existsSync(`public/ui/buttons/group4/${asset}`), `Missing group 4 button asset: ${asset}`);
}
for (const asset of groupFiveAssets) {
  assert.ok(fs.existsSync(`public/ui/buttons/group5/${asset}`), `Missing group 5 button asset: ${asset}`);
}
assert.ok(fs.existsSync('public/ui/frames/admin-control-panel.png'), 'Missing approved admin control-panel artwork.');

assert.match(css, /\.asset-button/, 'Group 1 must use an image-button layout class.');
assert.doesNotMatch(css, /\.sci-fi-button\s*\{/, 'The CSS-drawn sci-fi button frame must be removed.');
assert.match(html, /id="logout-btn"[^>]*class="[^"]*asset-button/, 'Map logout must use the image-button class.');
assert.match(html, /id="game-start-btn"[^>]*asset-button--wide/, 'Exploration must use the wide image-button variant.');
assert.match(html, /id="submit-ans-btn"[^>]*class="[^"]*asset-button/, 'Check and continue must use image buttons.');
assert.match(html, /id="submit-ans-img"[^>]*src="\.\/public\/ui\/buttons\/group1\/check\.png"/, 'Check must start with the approved check asset.');
assert.match(main, /submit-ans-img'\)\.src = '\.\/public\/ui\/buttons\/group1\/continue\.png'/, 'The next-question action must swap to the approved continue asset.');
assert.doesNotMatch(html, /sci-fi-button/, 'Group 1 markup must no longer use CSS-drawn sci-fi buttons.');
assert.doesNotMatch(main, /getElementById\('start-adv-icon'\)/, 'Subject selection must not reference the removed torch icon from the old button.');
assert.match(main, /group2\/claim-candy\.png/, 'Quest reward must use the approved claim-candy asset.');
assert.match(main, /group2\/start-mission-exam\.png/, 'Quest exam must use the approved mission-exam asset.');
assert.match(main, /group2\/exchange-pet\.png/, 'Pet exchange must use the approved exchange asset.');
assert.match(main, /isEquipped \? 'deactivate-pet\.png' : 'activate-pet\.png'/, 'Pet state must choose the approved activation artwork.');
assert.match(main, /group2\/return-pet\.png/, 'Pet return must use the approved return asset.');
assert.match(html, /group2\/shop-pets-tab\.png/, 'Shop pet tab must use its approved image asset.');
assert.match(html, /group2\/shop-my-pets-tab\.png/, 'My-pets tab must use its approved image asset.');
assert.match(html, /group2\/shop-lucky-tab\.png/, 'Lucky-shop tab must use its approved image asset.');
assert.match(html, /asset-button--close/, 'Treasure, quest, and shop panels must use image close buttons.');
assert.match(main, /group2\/spin-lucky\.png/, 'Lucky spin must use the approved image asset.');
assert.match(main, /assetButton\(group, asset, label, onClick/, 'Admin utilities must render image buttons from their approved assets.');
assert.match(main, /group4', 'create'/, 'Create actions must use Group 4 artwork.');
assert.match(main, /group5', 'upload'/, 'Import actions must use Group 5 artwork.');
assert.match(main, /control-panel-art/, 'Admin opening must enable the raster control-panel frame.');
assert.match(css, /admin-control-panel\.png/, 'The large admin frame must be a raster asset, not a CSS-drawn frame.');
assert.match(html, /group5\/close\.png/, 'Utility panels must use the approved close artwork.');

console.log('Image-button contract verified for groups 1, 2, 4 and 5.');
