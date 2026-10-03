/* Only trusted, selected Tabler SVGs ship to browsers; no icon CDN/runtime package. */
const fs = require('node:fs');
const names = ['users-group', 'building-community', 'user-search', 'users', 'user-check', 'trophy', 'medal', 'dice-5', 'arrows-shuffle'];
const icons = Object.fromEntries(names.map(name => [name, fs.readFileSync(`node_modules/@tabler/icons/icons/outline/${name}.svg`, 'utf8').replace(/<svg\s/, '<svg aria-hidden="true" focusable="false" ')]));
fs.writeFileSync('src/modules/admin-icons.js', `/* Generated from @tabler/icons 3.48.0 (MIT). See docs/ADMIN_ICON_LICENSE.txt. */\n(() => {\n    const icons = ${JSON.stringify(icons, null, 4)};\n    app.admin.icon = name => Object.hasOwn(icons, name) ? icons[name] : '';\n})();\n`);
// The upstream MIT notice is committed alongside the generated icons.
