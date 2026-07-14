const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');
code = code.replace(/\\\$/g, '$');
code = code.replace(/\\\`/g, '\`');
fs.writeFileSync('src/main.js', code, 'utf8');
console.log("Syntax fixed!");
