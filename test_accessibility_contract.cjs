const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const modal = fs.readFileSync('src/modules/modal.js', 'utf8');
const css = fs.readFileSync('src/style.css', 'utf8') + fs.readFileSync('src/login-layout.css', 'utf8');

assert.match(html, /id="login-form"[^>]*novalidate/, 'Login must be a real form so Enter submits it.');
assert.match(html, /id="register-form"[^>]*novalidate/, 'Registration must be a real form so Enter submits it.');
assert.match(html, /id="login-error"[^>]*role="alert"/, 'Login validation must have a live, addressable error region.');
assert.match(html, /id="register-error"[^>]*role="alert"/, 'Registration validation must have a live, addressable error region.');
assert.match(html, /id="change-password-error"[^>]*role="alert"/, 'Password-change validation must have a live error region.');
assert.match(html, /id="change-password-modal"[^>]*aria-hidden="true"/, 'Auth modal must start hidden to assistive technology.');
assert.match(main, /showAuthFeedback\(id, message/, 'Auth errors must be rendered inline instead of only through alert().');
assert.match(main, /app\.modal\?\.open\(modal/, 'Auth modal must use the shared modal manager.');
assert.match(modal, /focusableSelector/, 'Modal manager must define a keyboard-focusable control set.');
assert.match(modal, /element\.inert = value/, 'Modal manager must inert the background.');
assert.match(modal, /event\.key === 'Escape'/, 'Modal manager must support Escape to close.');
assert.match(modal, /event\.key !== 'Tab'/, 'Modal manager must trap Tab navigation.');
assert.match(html, /<button type="button" class="subject-box"[^>]*aria-pressed="false"/, 'Subject choices must be native buttons with state.');
assert.match(html, /id="bonus-candies-container" type="button"[^>]*aria-label="Nhận sao thưởng"/, 'Rewards must be keyboard-operable native buttons.');
assert.match(css, /\.bonus-reward-button:focus-visible/, 'Reward button must have a visible keyboard focus treatment.');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'Auth and modal affordances must respect reduced motion.');

console.log('Accessibility auth, modal and action semantics contract verified.');
