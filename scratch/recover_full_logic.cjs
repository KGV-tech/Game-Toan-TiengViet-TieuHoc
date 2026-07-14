const fs = require('fs');

const missingLogic = `

// --- Missing Game State ---
window.mathState = { questions: [], currentIndex: 0, correctCount: 0, totalCount: 0, selectedAnswer: null, isChecked: false, historyDetails: [] };
window.vietState = { questions: [], currentIndex: 0, correctCount: 0, totalCount: 0, selectedAnswer: null, isChecked: false, historyDetails: [] };

window.getGameQuestions = function(subject, topic, diff, count) {
  const topics = Array.isArray(topic) ? topic : [topic];
  let libQs = libraryQuestions.filter(q => topics.includes(q.topic) && q.subject === subject);
  const userClass = (currentUser && currentUser.classLevel) ? currentUser.classLevel : 5;
  libQs = libQs.filter(q => (q.classLevel || 5) == userClass);
  if (diff && diff !== 'mixed') libQs = libQs.filter(q => q.diff === diff);
  
  let result = [];
  if (libQs.length > 0) {
    const uniqueQsMap = new Map();
    libQs.forEach(q => {
      const qText = (q.q || '').trim().toLowerCase();
      if (!uniqueQsMap.has(qText)) uniqueQsMap.set(qText, q);
    });
    const uniqueQs = Array.from(uniqueQsMap.values());
    
    const grouped = {};
    uniqueQs.forEach(q => {
      const type = q.qType || 'multiple_choice';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(q);
    });
    
    Object.keys(grouped).forEach(type => grouped[type].sort(() => Math.random() - 0.5));
    
    const keys = Object.keys(grouped);
    let selected = [];
    let turn = 0;
    while (selected.length < count && keys.length > 0) {
      let activeKeys = keys.filter(k => grouped[k].length > 0);
      if (activeKeys.length === 0) break;
      let typeKey = activeKeys[turn % activeKeys.length];
      selected.push(grouped[typeKey].shift());
      turn++;
    }
    selected.sort(() => Math.random() - 0.5);
    selected.forEach(q => {
      let opts = [q.ans, ...q.wrong];
      if (q.qType === 'multiple_choice' || q.qType === 'drag_drop') opts.sort(() => Math.random() - 0.5);
      result.push({ qType: q.qType || 'multiple_choice', q: q.q, ans: q.ans, options: opts, explanation: q.explanation });
    });
    return result;
  }
  for(let i=0; i<count; i++) result.push({ qType: 'multiple_choice', q: 'Câu hỏi trống', ans: 'A', options: ['A', 'B', 'C', 'D'], explanation: 'Chưa có câu hỏi.' });
  return result;
};

// --- Math Game ---
window.startMathGame = function() {
  openScreen('math-play-view');
  mathState = { questions: getGameQuestions('math', ['Số học', 'Đại lượng', 'Hình học'], 'mixed', 10), currentIndex: 0, correctCount: 0, totalCount: 10, selectedAnswer: null, isChecked: false, historyDetails: [] };
  renderMathQuestion(0);
};

window.renderMathQuestion = function(index) {
  const q = mathState.questions[index];
  mathState.selectedAnswer = null;
  mathState.isChecked = false;
  document.getElementById('math-feedback').textContent = '';
  document.getElementById('math-feedback').className = 'feedback';
  document.getElementById('math-next-btn').disabled = true;
  document.getElementById('math-check-btn').style.display = 'inline-block';
  document.getElementById('math-next-btn').style.display = 'none';
  
  const qText = document.getElementById('math-question-text');
  qText.innerHTML = \`Câu \${index + 1}: \${q.q}\`;
  
  const qType = q.qType || 'multiple_choice';
  const grid = document.getElementById('math-options');
  grid.innerHTML = '';
  grid.className = 'options-grid ' + qType;
  
  q.options.forEach(opt => {
    let div = document.createElement('div');
    div.className = 'math-ans-btn ' + qType + '-btn';
    div.innerHTML = opt;
    div.onclick = () => {
      if (mathState.isChecked) return;
      Array.from(grid.children).forEach(c => c.classList.remove('selected'));
      div.classList.add('selected');
      mathState.selectedAnswer = { div, value: opt, isCorrect: opt === q.ans };
      document.getElementById('math-next-btn').disabled = false;
    };
    grid.appendChild(div);
  });
};

window.checkMathAnswer = function() {
  if (!mathState.selectedAnswer) return;
  mathState.isChecked = true;
  const isCorrect = mathState.selectedAnswer.isCorrect;
  const q = mathState.questions[mathState.currentIndex];
  
  if (isCorrect) {
    mathState.selectedAnswer.div.classList.add('correct');
    document.getElementById('math-feedback').textContent = 'Chính xác! 🎉';
    document.getElementById('math-feedback').className = 'feedback success';
    mathState.correctCount++;
    triggerConfetti();
  } else {
    mathState.selectedAnswer.div.classList.add('wrong');
    document.getElementById('math-feedback').innerHTML = \`Sai rồi! Đáp án đúng là: <b>\${q.ans}</b><br>Giải thích: \${q.explanation || ''}\`;
    document.getElementById('math-feedback').className = 'feedback error';
  }
  
  mathState.historyDetails.push({ q: q.q, selected: mathState.selectedAnswer.value, correct: q.ans, isCorrect });
  
  document.getElementById('math-check-btn').style.display = 'none';
  document.getElementById('math-next-btn').style.display = 'inline-block';
};

window.nextMathQuestion = function() {
  if (mathState.currentIndex < mathState.questions.length - 1) {
    mathState.currentIndex++;
    renderMathQuestion(mathState.currentIndex);
  } else {
    endMathGame();
  }
};

window.endMathGame = function() {
  document.getElementById('math-play-view').style.display = 'none';
  let finalScore = Math.round((mathState.correctCount / mathState.totalCount) * 100) / 10;
  finishGame('math', finalScore, 10, mathState.historyDetails, 'Luyện tập Toán');
};

// --- Vietnamese Game ---
window.startVietGame = function() {
  openScreen('viet-play-view');
  vietState = { questions: getGameQuestions('vietnamese', ['Luyện từ và câu', 'Tập đọc', 'Chính tả'], 'mixed', 10), currentIndex: 0, correctCount: 0, totalCount: 10, selectedAnswer: null, isChecked: false, historyDetails: [] };
  renderVietQuestion(0);
};

window.renderVietQuestion = function(index) {
  const q = vietState.questions[index];
  vietState.selectedAnswer = null;
  vietState.isChecked = false;
  document.getElementById('vietnamese-feedback').textContent = '';
  document.getElementById('vietnamese-feedback').className = 'feedback';
  document.getElementById('viet-next-btn').disabled = true;
  document.getElementById('viet-check-btn').style.display = 'inline-block';
  document.getElementById('viet-next-btn').style.display = 'none';
  
  const qText = document.getElementById('viet-question-text');
  qText.innerHTML = \`Câu \${index + 1}: \${q.q}\`;
  
  const qType = q.qType || 'multiple_choice';
  const grid = document.getElementById('vietnamese-options');
  grid.innerHTML = '';
  grid.className = 'options-grid ' + qType;
  
  q.options.forEach(opt => {
    let div = document.createElement('div');
    div.className = 'viet-ans-btn ' + qType + '-btn';
    div.innerHTML = opt;
    div.onclick = () => {
      if (vietState.isChecked) return;
      Array.from(grid.children).forEach(c => c.classList.remove('selected'));
      div.classList.add('selected');
      vietState.selectedAnswer = { div, value: opt, isCorrect: opt === q.ans };
      document.getElementById('viet-next-btn').disabled = false;
    };
    grid.appendChild(div);
  });
};

window.checkVietAnswer = function() {
  if (!vietState.selectedAnswer) return;
  vietState.isChecked = true;
  const isCorrect = vietState.selectedAnswer.isCorrect;
  const q = vietState.questions[vietState.currentIndex];
  
  if (isCorrect) {
    vietState.selectedAnswer.div.classList.add('correct');
    document.getElementById('vietnamese-feedback').textContent = 'Chính xác! 🎉';
    document.getElementById('vietnamese-feedback').className = 'feedback success';
    vietState.correctCount++;
    triggerConfetti();
  } else {
    vietState.selectedAnswer.div.classList.add('wrong');
    document.getElementById('vietnamese-feedback').innerHTML = \`Sai rồi! Đáp án đúng là: <b>\${q.ans}</b><br>Giải thích: \${q.explanation || ''}\`;
    document.getElementById('vietnamese-feedback').className = 'feedback error';
  }
  
  vietState.historyDetails.push({ q: q.q, selected: vietState.selectedAnswer.value, correct: q.ans, isCorrect });
  
  document.getElementById('viet-check-btn').style.display = 'none';
  document.getElementById('viet-next-btn').style.display = 'inline-block';
};

window.nextVietQuestion = function() {
  if (vietState.currentIndex < vietState.questions.length - 1) {
    vietState.currentIndex++;
    renderVietQuestion(vietState.currentIndex);
  } else {
    endVietGame();
  }
};

window.endVietGame = function() {
  document.getElementById('viet-play-view').style.display = 'none';
  let finalScore = Math.round((vietState.correctCount / vietState.totalCount) * 100) / 10;
  finishGame('vietnamese', finalScore, 10, vietState.historyDetails, 'Luyện tập Tiếng Việt');
};

// --- Finish Game & Results ---
window.finishGame = function(subject, score, maxScore, details, name) {
  let gotLollipop = score >= 5;
  if (currentUser && currentUser.role !== 'admin') {
    if (!currentUser.history) currentUser.history = [];
    currentUser.history.push({
      date: new Date().toLocaleString(),
      subject: subject,
      name: name,
      score: score,
      maxScore: maxScore,
      details: details
    });
    if (gotLollipop) {
      currentUser.lollipops = (currentUser.lollipops || 0) + 1;
    }
    
    let sum = 0;
    currentUser.history.forEach(h => sum += parseFloat(h.score || 0));
    currentUser.totalScore = Math.round(sum * 10) / 10;
    
    let uIndex = users.findIndex(u => u.username === currentUser.username);
    if (uIndex > -1) users[uIndex] = currentUser;
    saveUsers();
    updatePlayerDisplay();
  }
  showResultModal(score, maxScore, details, gotLollipop);
};

window.showResultModal = function(score, maxScore, details, gotLollipop) {
  const modal = document.getElementById('result-modal');
  if (modal) modal.style.display = 'flex';
  const scoreDisplay = document.getElementById('result-score-display');
  if (scoreDisplay) scoreDisplay.textContent = \`\${score} / \${maxScore}\`;
  
  const lollipop = document.getElementById('result-lollipop-reward');
  if (lollipop) {
    lollipop.style.display = gotLollipop ? 'block' : 'none';
  }
  
  const detailsHtml = details.map((d, i) => \`
    <div style="margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.2);">
      <div style="color:white; font-weight:bold; margin-bottom:5px;">Câu \${i+1}: \${d.q}</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:\${d.isCorrect ? '#4ade80' : '#f87171'}">Chọn: \${d.selected} \${d.isCorrect ? '✅' : '❌'}</span>
        \${!d.isCorrect ? \`<span style="color:#4ade80">Đúng: \${d.correct}</span>\` : ''}
      </div>
    </div>
  \`).join('');
  
  const detailsContainer = document.getElementById('result-details-list');
  if (detailsContainer) detailsContainer.innerHTML = detailsHtml;
};

window.closeResultModal = function() {
  const modal = document.getElementById('result-modal');
  if (modal) modal.style.display = 'none';
  openScreen('map-screen');
};

// --- Exam Select ---
let currentExamConfig = { classLevel: 5, period: 'Giữa kỳ 1', subject: 'math' };

window.selectClassLevel = function(level) {
  currentExamConfig.classLevel = level;
  document.querySelectorAll('#exam-select-screen button[onclick^="selectClassLevel"]').forEach(b => b.style.boxShadow = 'none');
  event.target.style.boxShadow = '0 0 15px #fde047';
};

window.selectExamPeriod = function(period) {
  currentExamConfig.period = period;
  document.querySelectorAll('#exam-select-screen button[onclick^="selectExamPeriod"]').forEach(b => b.style.boxShadow = 'none');
  event.target.style.boxShadow = '0 0 15px #fde047';
};

window.selectExamSubject = function(subject) {
  currentExamConfig.subject = subject;
  document.querySelectorAll('#exam-select-screen button[onclick^="selectExamSubject"]').forEach(b => b.style.boxShadow = 'none');
  event.target.style.boxShadow = '0 0 15px #fde047';
};

window.startExam = function() {
  openScreen('exam-play-screen');
  let filteredExams = exams.filter(e => e.subject === currentExamConfig.subject && e.classLevel == currentExamConfig.classLevel && e.period === currentExamConfig.period);
  
  if (filteredExams.length === 0) {
    alert('Không tìm thấy đề thi phù hợp. Vui lòng chọn lại.');
    openScreen('exam-select-screen');
    return;
  }
  
  let selectedExam = filteredExams[0]; // Chọn đề đầu tiên
  let examQs = selectedExam.questions || [];
  
  if (currentExamConfig.subject === 'math') {
    document.getElementById('math-exam-play-view').style.display = 'block';
    document.getElementById('viet-exam-play-view').style.display = 'none';
    mathState.questions = examQs;
    mathState.examName = selectedExam.name;
    renderMathExamQuestions();
  } else {
    document.getElementById('math-exam-play-view').style.display = 'none';
    document.getElementById('viet-exam-play-view').style.display = 'block';
    vietState.questions = examQs;
    vietState.examName = selectedExam.name;
    renderVietExamQuestions();
  }
};

window.switchTreasureTab = function(tab) {
  document.getElementById('treasure-history-tab').style.display = tab === 'history' ? 'block' : 'none';
  document.getElementById('treasure-leaderboard-tab').style.display = tab === 'leaderboard' ? 'block' : 'none';
  
  document.querySelectorAll('.treasure-tab-btn').forEach(b => b.style.opacity = '0.5');
  event.target.style.opacity = '1';
};

// Event Listeners for Game Start Buttons from Map
document.querySelectorAll('.station').forEach(station => {
  station.onclick = function() {
    const subject = this.dataset.subject;
    if (subject === 'math') startMathGame();
    if (subject === 'vietnamese') startVietGame();
  }
});
`;

fs.appendFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', missingLogic, 'utf8');
console.log("Appended missing logic successfully.");
