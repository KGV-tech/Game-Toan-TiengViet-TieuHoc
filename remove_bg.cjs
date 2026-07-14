const {Jimp} = require('jimp');
const fs = require('fs');
const path = require('path');

const inputFiles = [
  'C:\\Users\\htleh\\.gemini\\antigravity-ide\\brain\\2f046f53-69bc-463b-bf45-ac6f706f933c\\book_frame_1784015859284.png',
  'C:\\Users\\htleh\\.gemini\\antigravity-ide\\brain\\2f046f53-69bc-463b-bf45-ac6f706f933c\\flower_frame_1784015870390.png',
  'C:\\Users\\htleh\\.gemini\\antigravity-ide\\brain\\2f046f53-69bc-463b-bf45-ac6f706f933c\\apple_frame_1784015879547.png',
  'C:\\Users\\htleh\\.gemini\\antigravity-ide\\brain\\2f046f53-69bc-463b-bf45-ac6f706f933c\\balloon_frame_1784015888965.png',
  'C:\\Users\\htleh\\.gemini\\antigravity-ide\\brain\\2f046f53-69bc-463b-bf45-ac6f706f933c\\square_frame_1784015898202.png',
  'C:\\Users\\htleh\\.gemini\\antigravity-ide\\brain\\2f046f53-69bc-463b-bf45-ac6f706f933c\\train_car_3d_1784004985217.png',
  'C:\\Users\\htleh\\.gemini\\antigravity-ide\\brain\\2f046f53-69bc-463b-bf45-ac6f706f933c\\light_bulb_3d_1784005009697.png'
];

const outputNames = [
  'seq-book.png',
  'seq-flower.png',
  'seq-apple.png',
  'seq-balloon.png',
  'seq-square.png',
  'seq-train.png',
  'seq-light.png'
];

const outDir = path.join(__dirname, 'public');

async function processImages() {
  for (let i = 0; i < inputFiles.length; i++) {
    const file = inputFiles[i];
    const outName = outputNames[i];
    try {
      console.log('Processing', file);
      const img = await Jimp.read(file);
      
      const width = img.bitmap.width;
      const height = img.bitmap.height;
      const tolerance = 30;

      const toVisit = [[0,0], [width-1, 0], [0, height-1], [width-1, height-1]];
      const visited = new Set();
      
      while(toVisit.length > 0) {
        const [x, y] = toVisit.pop();
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const idx = (width * y + x) << 2;
        const r = img.bitmap.data[idx];
        const g = img.bitmap.data[idx + 1];
        const b = img.bitmap.data[idx + 2];
        
        if (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance) {
          img.bitmap.data[idx + 3] = 0;
          toVisit.push([x-1, y]);
          toVisit.push([x+1, y]);
          toVisit.push([x, y-1]);
          toVisit.push([x, y+1]);
        }
      }

      toVisit.push([Math.floor(width/2), Math.floor(height/2)]);
      while(toVisit.length > 0) {
        const [x, y] = toVisit.pop();
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const idx = (width * y + x) << 2;
        const r = img.bitmap.data[idx];
        const g = img.bitmap.data[idx + 1];
        const b = img.bitmap.data[idx + 2];
        
        if (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance) {
          img.bitmap.data[idx + 3] = 0;
          toVisit.push([x-1, y]);
          toVisit.push([x+1, y]);
          toVisit.push([x, y-1]);
          toVisit.push([x, y+1]);
        }
      }

      await img.write(path.join(outDir, outName));
      console.log('Saved', outName);
    } catch(err) {
      console.error('Error processing', file, err);
    }
  }
}

processImages();
