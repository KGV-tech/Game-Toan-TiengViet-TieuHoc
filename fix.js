const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

// The file contains literal backslashes from when we did string replace with escaped backslashes.
// We need to replace "\`" with "`" and "\${" with "${"
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\${/g, '${');

fs.writeFileSync('src/main.js', code, 'utf8');
console.log('Fixed syntax in main.js');
