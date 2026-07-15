const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');
code = code.replace(/role === 'admin'/g, "role?.toLowerCase() === 'admin'");
code = code.replace(/role !== 'admin'/g, "role?.toLowerCase() !== 'admin'");
code = code.replace(/\(this\.currentUser\.history \|\| \[\]\)/g, "(Array.isArray(this.currentUser.history) ? this.currentUser.history : [])");
fs.writeFileSync('src/main.js', code);
console.log('Fixed main.js');
