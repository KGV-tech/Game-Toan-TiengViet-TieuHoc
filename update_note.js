const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

// Replace 1: Add note in add-q
code = code.replace(
    'Ngăn cách các ô bằng dấu phẩy. VD: Mèo, Chó, Gà</p>',
    'Ngăn cách các ô bằng dấu phẩy (Tối đa 5 ô mỗi bên). VD: Mèo, Chó, Gà</p>'
);

// Replace 2: Add note in add-e-q
const searchStr = `                       <div id="add-e-q-match-wrapper-\${i}" style="display: \${q && q.type === 'Đối chiếu trùng khớp' ? 'block' : 'none'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                          <div style="display:flex; align-items:center; margin-bottom:5px;">`;
                          
const replStr = `                       <div id="add-e-q-match-wrapper-\${i}" style="display: \${q && q.type === 'Đối chiếu trùng khớp' ? 'block' : 'none'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                          <p style="font-size:0.85rem; color:#aaa; margin-bottom:10px;">Ngăn cách các ô bằng dấu phẩy (Tối đa 5 ô mỗi bên). VD: Mèo, Chó</p>
                          <div style="display:flex; align-items:center; margin-bottom:5px;">`;

code = code.replace(searchStr, replStr);

fs.writeFileSync('src/main.js', code, 'utf8');
console.log('Success');
