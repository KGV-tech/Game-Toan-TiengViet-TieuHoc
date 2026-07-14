const fs = require('fs');
const path = require('path');

const backupPath = 'd:/NTT/AI/Web/Game lop5/scratch/data_backup.js';
let defaultData = '';
if (fs.existsSync(backupPath)) {
  defaultData = fs.readFileSync(backupPath, 'utf8');
}

const mainCode = fs.readFileSync('d:/NTT/AI/Web/Game lop5/scratch/new_main.js', 'utf8');
const finalCode = defaultData + '\n' + mainCode;

fs.writeFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', finalCode, 'utf8');
fs.copyFileSync('d:/NTT/AI/Web/Game lop5/scratch/new_index.html', 'd:/NTT/AI/Web/Game lop5/index.html');
fs.copyFileSync('d:/NTT/AI/Web/Game lop5/scratch/new_style.css', 'd:/NTT/AI/Web/Game lop5/src/style.css');

console.log("Refactoring applied.");
