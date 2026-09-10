const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8');
const adminFunction = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');

const newBoys = [
  'boy-hoodie', 'boy-cap', 'boy-vest', 'boy-redhair', 'boy-goggles',
  'boy-wavy', 'boy-fade', 'boy-dino', 'boy-headphones', 'boy-wink'
];
const newGirls = [
  'girl-ponytail', 'girl-curly', 'girl-pink-glasses', 'girl-buns', 'girl-sunhat',
  'girl-flower', 'girl-bow', 'girl-star', 'girl-bunny', 'girl-streak'
];

for (const key of [...newBoys, ...newGirls]) {
  assert.match(source, new RegExp(`['"]${key}['"]\\s*:`), `${key} must be in the app avatar catalog.`);
  assert.match(html, new RegExp(`value=["']${key}["']`), `${key} must be selectable in the registration UI.`);
  assert.match(css, new RegExp(`\\.avatar-art--${key}\\b`), `${key} must have a sprite position.`);
  assert.match(adminFunction, new RegExp(`['"]${key}['"]`), `${key} must be accepted by the admin Edge Function.`);
}

assert.match(css, /avatars-students-sprite-v3\.webp/, 'The first new student sprite must be wired into CSS.');
assert.match(css, /avatars-students-sprite-v4\.webp/, 'The second new student sprite must be wired into CSS.');
assert.equal(new Set(newBoys).size, newBoys.length, 'New boy avatar keys must be unique.');
assert.equal(new Set(newGirls).size, newGirls.length, 'New girl avatar keys must be unique.');

console.log('Expanded student avatar catalog contract verified.');
