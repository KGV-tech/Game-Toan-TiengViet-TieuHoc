const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'src', 'main.js');
const cleanLogicPath = path.join(__dirname, 'scratch', 'game_logic_clean.js');

try {
    const mainJsCode = fs.readFileSync(mainJsPath, 'utf8');
    const cleanLogicCode = fs.readFileSync(cleanLogicPath, 'utf8');
    
    const lines = mainJsCode.split('\n');
    const keepLines = lines.slice(0, 1236); // Keep lines 1-1236 (index 0-1235)
    
    const newMainJsCode = keepLines.join('\n') + '\n' + cleanLogicCode;
    
    fs.writeFileSync(mainJsPath, newMainJsCode, 'utf8');
    console.log('Successfully patched main.js');
} catch(err) {
    console.error('Error patching main.js:', err);
}
