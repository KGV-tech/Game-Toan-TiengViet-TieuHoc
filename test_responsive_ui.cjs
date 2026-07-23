const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('src/style.css', 'utf8');

assert.match(css, /@media screen and \(orientation: portrait\)\s*\{\s*#app\s*\{\s*display: none !important;/, 'Portrait mode must lock the game and request landscape orientation.');
assert.match(css, /@media \(max-width: 1024px\)/, 'Tablet-specific responsive rules must exist.');
assert.match(css, /\.station\s*\{[^}]*min-width:/s, 'Map stations must have predictable touch targets.');
assert.match(css, /prefers-reduced-motion/, 'Motion effects must respect reduced-motion preferences.');

console.log('Responsive UI contract verified.');
