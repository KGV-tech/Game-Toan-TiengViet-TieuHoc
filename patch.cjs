const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');
code = code.replace(/corr\.className = 'fill-input correct';/g, 'corr.className = correct-ans-display';); // I don't need to replace class name actually if I just override styles.
code = code.replace(/corr\.style\.fontSize = '1\.5rem';/g, 'corr.style.fontSize = \'1.5rem\'; corr.style.whiteSpace = \'nowrap\'; corr.style.padding = \'10px 20px\'; corr.style.backgroundColor = \'rgba(255,255,255,0.95)\'; corr.style.borderRadius = \'20px\'; corr.style.border = \'3px solid #4ade80\'; corr.style.color = \'#16a34a\'; corr.style.display = \'inline-block\'; corr.style.boxShadow = \'0 5px 15px rgba(0,0,0,0.2)\';');
fs.writeFileSync('src/main.js', code);

