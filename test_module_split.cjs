const assert = require('node:assert/strict');
const fs = require('node:fs');

// D1: module tách — constants.js phải gắn vào đối tượng `app` toàn cục khi load.
globalThis.app = {};
require('./src/modules/constants.js');

assert.ok(globalThis.app.constants,
  'src/modules/constants.js must attach app.constants to the global app.');
assert.ok(globalThis.app.constants.topics,
  'app.constants must expose the topics map.');
assert.ok(Array.isArray(globalThis.app.constants.topics['5'].math.hk2),
  'Grade 5 Math HK2 topics must be an array.');
assert.ok(globalThis.app.constants.topics['1'].vietnamese.hk2.length > 0,
  'Grade 1 Vietnamese HK2 topics must be non-empty.');

const source = fs.readFileSync('src/main.js', 'utf8');
assert.match(source, /window\.app = app;/,
  'main.js must expose the app object globally so modules can attach to it.');
assert.doesNotMatch(source, /constants: \{\s*\n\s*topics:/,
  'The topics data must no longer live inside the main.js app literal.');

console.log('D1 module split contract verified.');
