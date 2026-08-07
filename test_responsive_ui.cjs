const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('src/style.css', 'utf8');

assert.match(css, /@media screen and \(orientation: portrait\)\s*\{\s*#app\s*\{\s*display: none !important;/, 'Portrait mode must lock the game and request landscape orientation.');
assert.match(css, /@media \(max-width: 1024px\)/, 'Tablet-specific responsive rules must exist.');
assert.match(css, /\.station\s*\{[^}]*min-width:/s, 'Map stations must have predictable touch targets.');
assert.match(css, /prefers-reduced-motion/, 'Motion effects must respect reduced-motion preferences.');
assert.match(css, /\.score-display\s*\{[^}]*flex:\s*0 0 auto/s, 'The gameplay score must remain inside the shared header layout.');
assert.match(css, /\.play-center\s*\{[^}]*height:\s*min\(82vh, 900px\)/s, 'The shared gameplay frame must allow more vertical content.');
assert.match(css, /\.matching-item\s*\{[^}]*overflow-wrap:\s*anywhere/s, 'Long matching answers must wrap instead of overflowing.');
assert.match(css, /\.matching-columns\s*\{[^}]*grid-template-columns:\s*minmax\(150px, 30%\) minmax\(0, 58%\)/s, 'Matching layout must reserve clear space between number and text columns.');

console.log('Responsive UI contract verified.');
