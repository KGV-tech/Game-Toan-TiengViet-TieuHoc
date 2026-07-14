import re

with open('src/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove old station styles
css = re.sub(r'\.station-icon \{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'\.station-icon img \{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'\.station-label \{.*?\}', '', css, flags=re.DOTALL)

# Add new styles
new_styles = '''
/* New Station Styles */
.station-img { width: 120px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.6)); transition: transform 0.3s; }
.station:hover .station-img { transform: scale(1.1); filter: drop-shadow(0 8px 20px rgba(255,255,255,0.5)); }

/* Glass Container XL */
.glass-container-xl { position: relative; z-index: 10; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(15px); padding: 40px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); border: 2px solid rgba(255, 255, 255, 0.2); width: 95%; max-width: 1200px; color: white; display: flex; flex-direction: column; align-items: center; }

/* Config Layout (3 columns) */
.config-layout { display: flex; width: 100%; justify-content: space-between; align-items: center; gap: 30px; }
.config-left, .config-right { flex: 1; display: flex; justify-content: center; align-items: center; }
.config-center { flex: 2; display: flex; flex-direction: column; gap: 20px; }
.cat-avatar { width: 250px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)); }
.cat-avatar-large { width: 300px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)); }

/* Config Sections */
.config-section { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 15px; border: 1px solid rgba(255,255,255,0.2); text-align: left; }
.topic-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.topic-mode-toggle { display: flex; gap: 10px; font-size: 0.9rem; background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 10px; }
.topics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.topic-item { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer; }
.scroll-box-small { max-height: 150px; overflow-y: auto; padding-right: 5px; }
.scroll-box-small::-webkit-scrollbar { width: 6px; }
.scroll-box-small::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 3px; }

.diff-options, .count-options { display: flex; gap: 10px; margin-top: 10px; }
.btn-opt { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 10px; flex: 1; cursor: pointer; transition: all 0.2s; }
.btn-opt.active { background: #4ade80; border-color: #22c55e; box-shadow: 0 0 15px rgba(74, 222, 128, 0.5); color: #000; font-weight: bold; }

/* Start Adventure Button */
.btn-start-adventure { background: transparent; border: none; color: white; font-size: 1.5rem; font-weight: bold; text-transform: uppercase; text-shadow: 0 0 10px #f59e0b; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: transform 0.3s; }
.btn-start-adventure:hover { transform: scale(1.1); }
#start-adv-icon { width: 120px; filter: drop-shadow(0 0 20px #f59e0b); }

/* Play Layout (3 columns) */
.play-layout { display: flex; width: 100%; justify-content: space-between; align-items: stretch; gap: 20px; }
.play-left, .play-right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
.play-center { flex: 2; display: flex; flex-direction: column; background: rgba(0,0,0,0.5); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); }

/* Speech Bubble */
.speech-bubble { position: absolute; top: -20%; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 15px 20px; border-radius: 20px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 5px 15px rgba(0,0,0,0.5); max-width: 250px; text-align: center; }
.speech-bubble::after { content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); border-width: 10px 10px 0; border-style: solid; border-color: white transparent transparent transparent; }

/* Check Button */
.btn-check { background: transparent; border: none; color: white; font-size: 1.5rem; font-weight: bold; text-transform: uppercase; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s; }
.btn-check:disabled { opacity: 0.5; filter: grayscale(100%); cursor: not-allowed; }
.btn-check:not(:disabled):hover { transform: scale(1.1); }
.action-icon { width: 150px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); }

/* Result Modal Layout */
.result-layout { display: flex; align-items: stretch; gap: 30px; text-align: left; }
.result-left { flex: 1; border-right: 2px solid rgba(255,255,255,0.2); padding-right: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.result-right { flex: 2; padding-left: 10px; display: flex; flex-direction: column; }
.max-score { font-size: 1.5rem; color: #ccc; }

/* Exam Layout */
.exam-bg { background-image: url('../public/castle_defense.png'); background-size: cover; background-position: center; }
.exam-select-layout { display: flex; justify-content: center; align-items: center; gap: 50px; margin: 40px 0; }
.subject-box { background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.3); padding: 20px; border-radius: 20px; cursor: pointer; transition: all 0.3s; width: 200px; text-align: center; }
.subject-box img { width: 100px; margin-bottom: 15px; }
.subject-box:hover, .subject-box.active { background: rgba(59,130,246,0.3); border-color: #3b82f6; transform: translateY(-10px); }
.period-select { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; display: flex; gap: 15px; align-items: center; justify-content: center; margin-bottom: 30px; }
.exam-scroll-area { height: 60vh; overflow-y: auto; padding-right: 15px; }
.exam-scroll-area::-webkit-scrollbar { width: 8px; }
.exam-scroll-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

/* Animations */
@keyframes heartbeat { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
.heartbeat { animation: heartbeat 2s infinite ease-in-out; }
'''

css += new_styles

with open('src/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
