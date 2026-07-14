const fs = require('fs');
let mainJs = fs.readFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', 'utf8');

const target = `      let classText = currentUser.classLevel ? \` - Lớp \${currentUser.classLevel}\` : '';
      playerNameDisplay.innerHTML = \`🧑‍🎓 \${currentUser.fullname}\${classText} <br> <span style="color:#d97706; font-size:0.95rem;">🏆 Tổng điểm: <strong>\${currentUser.totalScore}</strong></span>\`;`;

const replacement = `      let classText = currentUser.classLevel ? \` - Lớp \${currentUser.classLevel}\` : '';
      playerNameDisplay.innerHTML = \`🧑‍🎓 \${currentUser.fullname}\${classText} <br> <span style="color:#d97706; font-size:0.95rem;">🏆 Tổng điểm: <strong>\${currentUser.totalScore}</strong></span>\`;
      
      // Fix requested by user: Update top right score display to show TOTAL score instead of current score
      if (typeof scoreElement !== 'undefined' && scoreElement) {
        scoreElement.textContent = currentUser.totalScore;
      }`;

mainJs = mainJs.replace(target, replacement);
fs.writeFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', mainJs, 'utf8');
console.log("Updated scoreElement correctly.");
