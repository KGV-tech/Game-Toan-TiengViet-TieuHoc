const fs = require('fs');

const missingLogic = `
// --- Event Listeners and Fixes ---

// Add listener for Math Start Button
const mathStartBtn = document.getElementById('math-start-btn');
if (mathStartBtn) {
  mathStartBtn.addEventListener('click', function() {
    document.getElementById('math-config-view').style.display = 'none';
    document.getElementById('math-play-view').style.display = 'flex';
    mathState = { questions: getGameQuestions('math', ['Số học', 'Đại lượng', 'Hình học'], 'mixed', 10), currentIndex: 0, correctCount: 0, totalCount: 10, selectedAnswer: null, isChecked: false, historyDetails: [] };
    renderMathQuestion(0);
  });
}

// Add listener for Viet Start Button
const vietStartBtn = document.getElementById('viet-start-btn');
if (vietStartBtn) {
  vietStartBtn.addEventListener('click', function() {
    document.getElementById('viet-config-view').style.display = 'none';
    document.getElementById('viet-play-view').style.display = 'flex';
    vietState = { questions: getGameQuestions('vietnamese', ['Luyện từ và câu', 'Tập đọc', 'Chính tả'], 'mixed', 10), currentIndex: 0, correctCount: 0, totalCount: 10, selectedAnswer: null, isChecked: false, historyDetails: [] };
    renderVietQuestion(0);
  });
}

// Add listeners for Check and Next buttons
const mathCheckBtn = document.getElementById('math-check-btn');
if (mathCheckBtn) mathCheckBtn.addEventListener('click', checkMathAnswer);

const mathNextBtn = document.getElementById('math-next-btn');
if (mathNextBtn) mathNextBtn.addEventListener('click', nextMathQuestion);

const vietCheckBtn = document.getElementById('viet-check-btn');
if (vietCheckBtn) vietCheckBtn.addEventListener('click', checkVietAnswer);

const vietNextBtn = document.getElementById('viet-next-btn');
if (vietNextBtn) vietNextBtn.addEventListener('click', nextVietQuestion);

// Make sure exam-play-screen properly shows the exam container
window.startExam = function() {
  openScreen('exam-play-screen');
  let filteredExams = exams.filter(e => e.subject === currentExamConfig.subject && e.classLevel == currentExamConfig.classLevel && e.period === currentExamConfig.period);
  
  if (filteredExams.length === 0) {
    alert('Không tìm thấy đề thi phù hợp. Vui lòng chọn lại.');
    openScreen('exam-select-screen');
    return;
  }
  
  let selectedExam = filteredExams[0];
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
`;

fs.appendFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', missingLogic, 'utf8');
console.log("Appended listeners successfully.");
