const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'public', 'worksheet-vendor');
fs.mkdirSync(destination, { recursive: true });
function copy(source, target) {
  fs.copyFileSync(path.join(root, 'node_modules', source), path.join(destination, target));
}
copy('tesseract.js/dist/tesseract.min.js', 'tesseract.min.js');
copy('tesseract.js/dist/worker.min.js', 'worker.min.js');
for (const name of fs.readdirSync(path.join(root, 'node_modules/tesseract.js-core'))) {
  if (/^tesseract-core.*\.wasm\.js$/.test(name)) copy(`tesseract.js-core/${name}`, name);
}
copy('pdfjs-dist/build/pdf.mjs', 'pdf.mjs');
copy('pdfjs-dist/build/pdf.worker.mjs', 'pdf.worker.mjs');
fs.cpSync(path.join(root, 'node_modules/pdfjs-dist/wasm'), path.join(destination, 'wasm'), { recursive: true });
for (const directory of ['standard_fonts', 'cmaps']) {
  fs.cpSync(path.join(root, 'node_modules/pdfjs-dist', directory), path.join(destination, directory), { recursive: true });
}
copy('mammoth/mammoth.browser.min.js', 'mammoth.browser.min.js');
for(const [source,target] of [['tesseract.js/LICENSE.md','TESSERACT-LICENSE.md'],['tesseract.js-core/LICENSE','TESSERACT-CORE-LICENSE'],['pdfjs-dist/LICENSE','PDFJS-LICENSE'],['mammoth/LICENSE','MAMMOTH-LICENSE']]) {
  if(fs.existsSync(path.join(root,'node_modules',source)))copy(source,target);
}
console.log('Worksheet OCR/PDF/Word assets copied for same-origin, on-device processing.');
