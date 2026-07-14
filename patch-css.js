const fs = require('fs');
let css = fs.readFileSync('src/style.css', 'utf8');

css += \
/* T/F Selected Orange */
.tf-card.selected { background: linear-gradient(180deg, #fb923c, #f97316) !important; color: white !important; border-color: #fdba74 !important; }

/* Result Icons */
.ans-btn, .tf-card { position: relative; }
.result-icon { position: absolute; top: -10px; right: -10px; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 10; }
.result-icon.icon-v { background: #16a34a; border: 2px solid #fff; }
.result-icon.icon-x { background: #dc2626; border: 2px solid #fff; }

/* Highlight submitted T/F */
.tf-card.correct-fill { background: linear-gradient(180deg, #4ade80, #16a34a) !important; color: white !important; border-color: #86efac !important; }
.tf-card.wrong-fill { background: linear-gradient(180deg, #f87171, #dc2626) !important; color: white !important; border-color: #fca5a5 !important; }
\;
fs.writeFileSync('src/style.css', css);
console.log('CSS patched.');

