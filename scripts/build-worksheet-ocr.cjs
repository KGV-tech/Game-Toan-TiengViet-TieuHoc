const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public/worksheet-vendor/paddle');
fs.mkdirSync(out,{recursive:true});
require('esbuild').buildSync({entryPoints:[path.join(root,'src/workers/worksheet-ocr-worker.js')],outfile:path.join(out,'ocr-worker.js'),bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,alias:{'@techstark/opencv-js':path.join(root,'scripts/worksheet-cv-shim.js'),'onnxruntime-web':'onnxruntime-web/wasm'},logLevel:'warning'});
fs.copyFileSync(path.join(root,'node_modules/@techstark/opencv-js/dist/opencv.js'),path.join(out,'opencv.js'));
for(const name of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])fs.copyFileSync(path.join(root,'node_modules/onnxruntime-web/dist',name),path.join(out,name));
const manifest={sdk:'0.4.2',models:{}};
for(const name of ['PP-OCRv6_small_det.tar','latin_PP-OCRv5_mobile_rec.tar']){const file=path.join(out,name);if(!fs.existsSync(file))throw Error(`Missing official model: ${name}`);manifest.models[name]={bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Same-origin PaddleOCR worker, OpenCV and WASM built.');
