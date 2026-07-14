const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\htleh\\.gemini\\antigravity\\brain';
const dirs = fs.readdirSync(brainDir).filter(d => fs.statSync(path.join(brainDir, d)).isDirectory() && d !== 'tempmediaStorage');

let allMessages = [];

dirs.forEach(dir => {
  const logFile = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    lines.forEach(line => {
      try {
        const step = JSON.parse(line);
        if (!step.created_at) return;
        
        let role = '';
        let text = '';
        
        if (step.type === 'USER_INPUT') {
          role = 'USER';
          text = step.content;
        } else if (step.type === 'PLANNER_RESPONSE' && step.content) {
          role = 'AI';
          text = step.content;
        } else if (step.type === 'PLANNER_RESPONSE' && step.thinking) {
          // If the model responded directly without a content field, sometimes it's just in thinking or tool calls
          // But usually we only want explicit text provided to the user.
          // Wait, if it's PLANNER_RESPONSE, text is usually in content. If empty, maybe it's just a tool call.
        } else if (step.source === 'MODEL' && step.content && !step.type) {
           // Fallback
        }
        
        if (role && text) {
          allMessages.push({
            date: new Date(step.created_at),
            role: role,
            text: text
          });
        }
      } catch (e) {
        // ignore parsing errors
      }
    });
  }
});

// Sort messages chronologically
allMessages.sort((a, b) => a.date - b.date);

// Remove EXACT duplicates (sometimes same messages appear across checkpoints)
let uniqueMessages = [];
let lastSig = '';
allMessages.forEach(m => {
  let sig = m.role + '|' + m.text;
  if (sig !== lastSig) {
    uniqueMessages.push(m);
    lastSig = sig;
  }
});

let outputText = '================ CHAT HISTORY ================\n\n';
uniqueMessages.forEach(m => {
  outputText += `[${m.date.toISOString()}] ${m.role}:\n${m.text}\n\n--------------------------------------------\n\n`;
});

fs.writeFileSync('d:\\NTT\\AI\\Web\\Game lop5\\chat_history.txt', outputText, 'utf8');
console.log('Chat history extracted successfully.');
