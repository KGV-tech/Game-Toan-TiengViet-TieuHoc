const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('./index.html', 'utf8');
const script = fs.readFileSync('./src/main.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });

// Mock localstorage
let store = {};
dom.window.localStorage.getItem = function(key) { return store[key] || null; };
dom.window.localStorage.setItem = function(key, value) { store[key] = value.toString(); };
dom.window.localStorage.clear = function() { store = {}; };

// Polyfills
dom.window.requestAnimationFrame = () => {};
dom.window.alert = console.log;
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  beginPath: () => {},
  arc: () => {},
  fill: () => {}
});

// Run script
try {
  dom.window.eval(script);
  console.log("No errors during script initialization!");
} catch (e) {
  console.error("Error message:", e.message);
  console.error("Stack trace:", e.stack);
}
