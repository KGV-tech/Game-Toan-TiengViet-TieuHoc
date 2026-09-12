const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const style = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');

const tokens = [
  '--ui-bg-0', '--ui-bg-1', '--ui-surface', '--ui-surface-raised',
  '--ui-text', '--ui-text-muted', '--ui-accent-cyan', '--ui-accent-amber',
  '--ui-accent-violet', '--ui-accent-success', '--ui-accent-danger',
  '--ui-border', '--ui-radius-sm', '--ui-radius-md', '--ui-radius-lg',
  '--ui-space-1', '--ui-space-2', '--ui-space-3', '--ui-space-4', '--ui-space-5'
];

for (const token of tokens) {
  assert.match(style, new RegExp(`${token}:`), `Missing design token ${token}`);
}

for (const selector of [
  '.admin-surface',
  '.admin-loading-state',
  '.admin-error-state',
  '.admin-empty-state',
  ':focus-visible',
  ':disabled',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.ok(style.includes(selector), `Missing UI state/accessibility selector ${selector}`);
}

assert.ok((style.match(/var\(--ui-/g) || []).length >= 12, 'Shared UI tokens are not consumed by the UI layer');
assert.match(style, /#treasure-modal\[data-ui-context="admin"\]/, 'Admin token layer must be scoped to the Admin context');
assert.match(style, /#result-modal[^\{]*\.result-layout|#result-modal\s+\.result-layout/, 'Result screen should consume the shared UI layer');
assert.match(style, /#game-config-view[^\{]*\.glass-container-xl|#game-config-view\s+\.glass-container-xl/, 'Game config should have a shared surface treatment');

assert.doesNotMatch(index, /maximum-scale\s*=|minimum-scale\s*=|user-scalable\s*=\s*no/i, 'Viewport must not disable zoom');
assert.match(index, /id="treasure-content-area"[^>]*class="[^"]*admin-surface/, 'Admin content needs the common surface hook');
assert.match(index, /id="treasure-modal"[^>]*role="dialog"[^>]*aria-modal="true"/, 'Admin modal must remain an accessible dialog');
assert.match(main, /aria-busy/, 'Admin loading state should expose busy status to assistive technology');

console.log('Bước 7 design-system contract passed');
