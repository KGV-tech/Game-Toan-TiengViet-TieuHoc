Created At: 2026-07-11T15:58:11Z
Completed At: 2026-07-11T15:58:11Z
File Path: `file:///d:/NTT/AI/Web/Game%20lop5/src/main.js`
Total Lines: 2815
Total Bytes: 123211
Showing lines 1800 to 2599
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
      div.className = 'math-ans-btn';
      div.innerHTML = opt;
      div.onclick = () => {
        if(mathState.isChecked) return;
        document.querySelectorAll('.math-ans-btn').forEach(b => b.classList.remove('selected'));
        div.classList.add('selected');
        mathState.selectedAnswer = { div, value: opt, isCorrect: (opt == q.ans) };
        enableActionBtn();
      };
      grid.appendChild(div);
    });
  } 
  else if (qType === 'true_false') {
    ['Đúng', 'Sai'].forEach(opt => {
      const div = document.createElement('div');
      div.className = 'math-ans-btn';
      div.innerHTML = opt;
      div.onclick = () => {
        if(mathState.isChecked) return;
        document.querySelectorAll('.math-ans-btn').forEach(b => b.classList.remove('selected'));
        div.classList.add('selected');
        // Đối chiếu text (Đúng/Sai) với đáp án (có thể lưu là Đúng/Sai hoặc True/False)
        let isCorrect = (opt.toLowerCase() === String(q.ans).toLowerCase());
        mathState.selectedAnswer = { div, value: opt, isCorrect };
        enableActionBtn();
      };
      grid.appendChild(div);
    });
  }
  else if (qType === 'comparison') {
    ['>', '<', '='].forEach(opt => {
      const div = document.createElement('div');
      div.className = 'math-ans-btn';
      div.innerHTML = opt;
      div.style.fontSize = '2rem'; // To hơn xíu cho dấu
      div.onclick = () => {
        if(mathState.isChecked) return;
        document.querySelectorAll('.math-ans-btn').forEach(b => b.classList.remove('selected'));
        div.classList.add('selected');
        let isCorrect = (opt === String(q.ans).trim());
        mathState.selectedAnswer = { div, value: opt, isCorrect };
        enableActionBtn();
      };
      grid.appendChild(div);
    });
  }
  else if (qType === 'fill_blank' || qType === 'sequence') {
    grid.style.display = 'flex';
    grid.style.justifyContent = 'center';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'math-input-box';
    input.placeholder = qType === 'sequence' ? 'VD: 2-4-6-8' : 'Nhập đáp án...';
    input.style.cssText = 'padding:15px; font-size:1.5rem; border-radius:10px; border:2px solid #cbd5e1; width:80%; max-width:400px; text-align:center; box-shadow:inset 0 2px 4px rgba(0,0,0,0.1); outline:none;';
    
    input.oninput = () => {
      if(mathState.isChecked) return;
      let val = input.value.trim();
      let isCorrect = (val.toLowerCase() === String(q.ans).trim().toLowerCase());
      mathState.selectedAnswer = { div: input, value: val, isCorrect };
      if(val !== '') enableActionBtn();
      else {
        if(actionBtn) {
          actionBtn.disabled = true;
          actionBtn.style.opacity = '0.5';
          actionBtn.style.pointerEvents = 'none';
        }
      }
    };
    grid.appendChild(input);
  }
}

function checkMathAnswer() {
  if(!mathState.selectedAnswer) return;
  mathState.isChecked = true;
  
  const { div, value, isCorrect } = mathState.selectedAnswer;
  const catAvatar = document.getElementById('math-cat-avatar');
  const q = mathState.questions[mathState.currentQIndex];
  const qType = q.qType || 'multiple_choice';
  
  // Disable inputs/buttons
  if (qType === 'fill_blank' || qType === 'sequence') {
    div.disabled = true;
  } else {
    document.querySelectorAll('.math-ans-btn').forEach(b => b.style.pointerEvents = 'none');
  }
  
  // Hiện lời giải
  const explEl = document.getElementById('math-explanation');
  const explText = document.getElementById('math-explanation-text');
  if(explEl && explText) {
    explText.textContent = q.explanation || 'Hãy cố gắng tính toán cẩn thận nhé!';
    explEl.style.display = 'block';
  }
  
  const chosen = (value !== undefined ? value : div.textContent).replace('✅ ', '').replace('❌ ', '');
  mathState.historyDetails.push({
    q: q.q,
    chosen: chosen,
    isCorrect: isCorrect,
    correctAnswer: q.ans
  });
  
  if(isCorrect) {
    if (qType === 'fill_blank' || qType === 'sequence') {
      div.style.backgroundColor = '#dcfce7'; // green-100
      div.style.borderColor = '#22c55e';
      div.style.color = '#15803d';
    } else {
      div.classList.remove('selected');
      div.classList.add('correct');
      div.textContent = '✅ ' + div.textContent;
    }
    mathState.correctCount = (mathState.correctCount || 0) + 1;
    let currentScore = (mathState.correctCount / mathState.totalCount) * 10;
    mathState.score = Math.round(currentScore * 10) / 10;
    document.getElementById('math-score').textContent = mathState.score;
    triggerConfetti();
    if (catAvatar) catAvatar.src = './public/cat_happy.png';
  } else {
    if (qType === 'fill_blank' || qType === 'sequence') {
      div.style.backgroundColor = '#fee2e2'; // red-100
      div.style.borderColor = '#ef4444';
      div.style.color = '#b91c1c';
      // Hiển thị đáp án đúng bên dưới input
      const correctMsg = document.createElement('div');
      correctMsg.style.cssText = 'color:#ef4444; font-weight:bold; margin-top:10px; text-align:center; width:100%;';
      correctMsg.textContent = '❌ Sai rồi! Đáp án đúng: ' + q.ans;
      document.getElementById('math-answers-grid').appendChild(correctMsg);
    } else {
      div.classList.remove('selected');
      div.classList.add('wrong');
      div.textContent = '❌ ' + div.textContent;
      // Find and highlight correct one
      document.querySelectorAll('.math-ans-btn').forEach(b => {
        if(b.textContent.replace('✅ ', '') == q.ans || b.textContent.replace('✅ ', '').toLowerCase() == String(q.ans).toLowerCase()) {
          b.classList.add('correct');
          b.textContent = '✅ ' + b.textContent;
        }
      });
    }
    if (catAvatar) catAvatar.src = './public/cat_sad.png';
  }
  
  // Chuyển nút sang trạng thái Tiếp tục
  const actionBtn = document.getElementById('math-action-btn');
  if(actionBtn) {
    document.getElementById('math-action-icon').textContent = '➡️';
    document.getElementById('math-action-text').innerHTML = 'Tiếp<br>Tục';
    actionBtn.style.filter = 'drop-shadow(0 0 40px #f97316) brightness(1.3)';
  }
}

function endMathGame() {
  document.getElementById('math-play-view').style.display = 'none';
  
  const correctCount = mathState.correctCount || 0;
  const maxScore = 10;
  let finalScore = (correctCount / mathState.totalCount) * 10;
  // Round to 1 decimal
  finalScore = Math.round(finalScore * 10) / 10;
  
  finishGame('math', finalScore, maxScore, mathState.historyDetails);
}

document.getElementById('math-finish-btn').addEventListener('click', () => {
  document.getElementById('math-result-view').style.display = 'none';
  document.getElementById('math-config-view').style.display = 'flex';
  openScreen('map-screen');
});

document.getElementById('math-bonus-img').addEventListener('click', () => {
  document.getElementById('math-result-view').style.display = 'none';
  document.getElementById('math-config-view').style.display = 'flex';
  openScreen('map-screen');
});

// --- Vietnamese Game Logic ---


// --- Exam Logic ---
let currentExamSubject = null;
let currentExamPeriod = null;

window.selectExamPeriod = function(periodName) {
  const nameToIdMap = {
    'Giữa kỳ 1': 'mid1',
    'Cuối kỳ 1': 'end1',
    'Giữa kỳ 2': 'mid2',
    'Cuối kỳ 2': 'end2'
  };
  currentExamPeriod = nameToIdMap[periodName] || periodName;
  
  const periods = [
    {id: 'gk1', name: 'Giữa kỳ 1'},
    {id: 'ck1', name: 'Cuối kỳ 1'},
    {id: 'gk2', name: 'Giữa kỳ 2'},
    {id: 'ck2', name: 'Cuối kỳ 2'}
  ];
  
  periods.forEach(p => {
    const el = document.getElementById(`period-${p.id}`);
    if (el) {
      if (p.name === periodName) {
        el.style.background = 'rgba(252,211,77,0.3)';
        el.style.borderColor = '#f59e0b';
        el.style.boxShadow = '0 0 15px rgba(245,158,11,0.5)';
      } else {
        el.style.background = 'transparent';
        el.style.borderColor = 'transparent';
        el.style.boxShadow = 'none';
      }
    }
  });
  
  checkExamStart();
}

window.selectExamSubject = function(subject) {
  currentExamSubject = subject;
  
  // Reset styles
  document.getElementById('exam-subject-math').style.borderColor = '#ccc';
  document.getElementById('exam-subject-math').style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
  document.getElementById('exam-subject-vietnamese').style.borderColor = '#ccc';
  document.getElementById('exam-subject-vietnamese').style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
  
  // Highlight selected
  const selectedEl = document.getElementById(`exam-subject-${subject}`);
  selectedEl.style.borderColor = subject === 'math' ? '#ea580c' : '#0ea5e9';
  selectedEl.style.boxShadow = `0 0 30px ${subject === 'math' ? '#ea580c' : '#0ea5e9'}`;
  
  checkExamStart();
}

function checkExamStart() {
  const startBtn = document.getElementById('start-exam-btn');
  if (!startBtn) return;
  if (currentExamSubject && currentExamPeriod) {
    startBtn.style.opacity = '1';
    startBtn.style.pointerEvents = 'auto';
    startBtn.style.transform = 'scale(1.1)';
    setTimeout(() => startBtn.style.transform = 'scale(1)', 200);
  } else {
    startBtn.style.opacity = '0.5';
    startBtn.style.pointerEvents = 'none';
  }
}

window.startExam = function() {
  if (!currentExamSubject || !currentExamPeriod) return;
  
  const userClass = (currentUser && currentUser.classLevel) ? currentUser.classLevel : 5;
  const matchingExams = libraryExams.filter(e => e.classLevel == userClass && e.timePeriod === currentExamPeriod);
  
  if (matchingExams.length === 0) {
    alert('Chưa có Đề thi nào trong Kho phù hợp với Lớp và Mốc thời gian này. Vui lòng báo Admin tạo Đề thi mới!');
    return;
  }
  
  const randomExam = matchingExams[Math.floor(Math.random() * matchingExams.length)];
  
  openScreen('exam-play-screen');
  renderExamPaper(randomExam);
}

window.renderExamPaper = function(exam) {
  window.currentExamData = exam;
  const title1 = document.getElementById('exam-title-1');
  const subjName = currentExamSubject === 'math' ? 'MÔN TOÁN' : 'MÔN TIẾNG VIỆT';
  const periodMap = { 'mid1': 'Giữa Kỳ 1', 'end1': 'Cuối Kỳ 1', 'mid2': 'Giữa Kỳ 2', 'end2': 'Cuối Kỳ 2' };
  const periodDisplay = periodMap[currentExamPeriod] || currentExamPeriod;
  const periodStr = periodDisplay ? ` - ${periodDisplay}` : '';
  
  title1.textContent = `${subjName}${periodStr}`;
  
  const q1 = document.getElementById('exam-questions-1');
  let content1 = '';
  
  if (!exam.questions || exam.questions.length === 0) {
    q1.innerHTML = '<p>Đề thi này chưa có câu hỏi nào.</p>';
    return;
  }
  
  exam.questions.forEach((q, idx) => {
    let i = idx + 1;
    let optsHtml = '';
    
    if (q.qType === 'fill_blank' || q.qType === 'sequence' || q.qType === 'comparison') {
      optsHtml = `<input type="text" id="exam-ans-${i}" placeholder="Nhập câu trả lời..." style="padding: 10px; width: 100%; border: 1px solid #ccc; border-radius: 5px; font-size: 1.1rem; margin-top: 10px;">`;
    } else if (q.qType === 'true_false') {
      optsHtml = `
        <div style="display: flex; gap: 20px; margin-top: 10px;">
          <label style="cursor:pointer; background: #fff; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;"><input type="radio" name="exam-q${i}" value="Đúng"> Đúng</label>
          <label style="cursor:pointer; background: #fff; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;"><input type="radio" name="exam-q${i}" value="Sai"> Sai</label>
        </div>`;
    } else {
      let allOpts = [...(q.wrong || []), q.ans];
      allOpts.sort(() => Math.random() - 0.5);
      
      optsHtml = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">`;
      allOpts.forEach(opt => {
        if(opt) {
          optsHtml += `<label style="cursor:pointer; background: #fff; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"><input type="radio" name="exam-q${i}" value="${opt.replace(/"/g, '&quot;')}"> ${opt}</label>`;
        }
      });
      optsHtml += `</div>`;
    }
    
    content1 += `
      <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 5px solid #3b82f6;">
        <strong style="font-size: 1.2rem; color: #1e293b; display: block; margin-bottom: 10px;">Câu ${i}: ${q.q}</strong>
        ${optsHtml}
      </div>
    `;
  });
  
  q1.innerHTML = content1;
}

window.selectClassLevel = function(level) {
  if(currentUser) {
    currentUser.classLevel = level;
    // Cập nhật lại UI thông tin người chơi có thêm tên lớp
    playerNameDisplay.innerHTML = `🎓 ${currentUser.fullname} - Lớp ${level} <br> <span style="color:#d97706; font-size:0.95rem;">⭐ Điểm: <strong>${currentUser.totalScore}</strong></span> <br> `;
    
    // Lưu vào localStorage
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if(userIndex !== -1) {
      users[userIndex].classLevel = level;
      localStorage.setItem('gameUsers', JSON.stringify(users));
    }
  }
  
  document.getElementById('class-select-modal').style.display = 'none';
  openScreen('map-screen');
}
// ==========================================
// THÊM CÁC TÍNH NĂNG QUẢN LÝ KHO ĐỀ THI
// ==========================================

// 1. Xuất file mẫu cho Đề thi (Chứa sẵn 1 bộ đề Lớp 5 cực chuẩn với 10 câu đa dạng)
document.getElementById('btn-export-exam-template')?.addEventListener('click', () => {
  let csvContent = '\uFEFFTên Đề Thi,Cấp Lớp,Mốc Thời Gian,Loại Câu Hỏi,Nội dung câu hỏi,Đáp án 1,Đáp án 2,Đáp án 3,Đáp án 4,Đáp án đúng\n';
  
  const sampleData = [
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'multiple_choice', 'Đọc số sau: 47 812', 'Bốn bảy nghìn tám mười hai', 'Bốn mươi bảy nghìn tám trăm mười hai', 'Bốn bảy tám một hai', 'Bốn mươi bảy nghìn tám mười hai', 'Bốn mươi bảy nghìn tám trăm mười hai'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'multiple_choice', 'Viết số: Năm mươi tư nghìn một trăm chín mươi mốt', '54 191', '50 491', '54 119', '54 901', '54 191'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'fill_blank', 'Điền số thích hợp: 6 000 + ... + 30 + 1 = 6 731', '70', '700', '7', '7000', '700'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'multiple_choice', 'Số lớn nhất trong các số: 21 897; 12 789; 19 182; 28 911 là:', '21 897', '12 789', '19 182', '28 911', '28 911'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'true_false', 'Đúng hay Sai: Số liền sau của 9 999 là 10 000.', 'Đúng', 'Sai', '', '', 'Đúng'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'comparison', 'Điền dấu >, <, = vào chỗ chấm: 25 300 ... 25 400', '>', '<', '=', '', '<'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'sequence', 'Tìm số tiếp theo của dãy: 2, 4, 6, 8, ...', '9', '10', '11', '12', '10'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'drag_drop', 'Kéo các số vào đúng vị trí để tạo thành phép tính đúng: 5 + [ ] = 12', '5', '6', '7', '8', '7'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'multiple_choice', 'Số nào dưới đây có chữ số 6 ở hàng trăm?', '26 734', '72 643', '63 247', '73 462', '72 643'],
    ['Đề ôn luyện 1 (Mẫu)', 5, 'mid1', 'multiple_choice', 'Tính giá trị biểu thức: 75 834 - (34 173 - 18 046)', '59 707', '59 077', '57 907', '50 707', '59 707']
  ];

  sampleData.forEach(row => {
    csvContent += row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute("href", url);
  a.setAttribute("download", "mau_nhap_de_thi_Lop5.csv");
  document.body.appendChild(a); 
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// 2. Xuất kho đề thi hiện tại (Cấu trúc 1 dòng = 1 câu hỏi)
document.getElementById('btn-export-exam-data')?.addEventListener('click', () => {
  if(libraryExams.length === 0) {
    alert('Kho đề thi đang trống!');
    return;
  }
  let csvContent = '\uFEFFTên Đề Thi,Cấp Lớp,Mốc Thời Gian,Loại Câu Hỏi,Nội dung câu hỏi,Đáp án 1,Đáp án 2,Đáp án 3,Đáp án 4,Đáp án đúng\n';
  
  libraryExams.forEach(exam => {
    if (exam.questions && exam.questions.length > 0) {
      exam.questions.forEach(q => {
        let opts = [q.wrong[0] || '', q.wrong[1] || '', q.wrong[2] || '', q.ans];
        const row = [exam.name, exam.classLevel, exam.timePeriod, q.qType || 'multiple_choice', q.q, opts[0], opts[1], opts[2], opts[3], q.ans];
        csvContent += row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',') + '\n';
      });
    } else {
      // Đề thi rỗng
      const row = [exam.name, exam.classLevel, exam.timePeriod, '', '', '', '', '', '', ''];
      csvContent += row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',') + '\n';
    }
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute("href", url);
  a.setAttribute("download", "du_lieu_kho_de_thi.csv");
  document.body.appendChild(a); 
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// 3. Nhập từ file cho Đề thi (Gom nhóm theo Tên Đề Thi)
document.getElementById('import-exam-file-input')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const rows = parseCSV(event.target.result);
      if(rows.length <= 1) throw new Error("File rỗng hoặc sai định dạng");
      
      const examsMap = {};
      
      for(let i=1; i<rows.length; i++) {
        let r = rows[i];
        if(r.length < 5) continue; // Bỏ qua dòng thiếu dữ liệu
        
        let name = r[0].trim();
        if(!name) continue; // Phải có tên đề thi
        
        let classL = parseInt(r[1]) || 5;
        let period = r[2].trim() || 'mid1';
        let qType = r[3].trim() || 'multiple_choice';
        let qText = r[4].trim();
        
        if (!examsMap[name]) {
          examsMap[name] = { name, classLevel: classL, timePeriod: period, questions: [] };
        }
        
        // Nếu có nội dung câu hỏi thì parse
        if (qText) {
          let opt1 = (r[5] || '').trim();
          let opt2 = (r[6] || '').trim();
          let opt3 = (r[7] || '').trim();
          let opt4 = (r[8] || '').trim();
          let ans = (r[9] || '').trim();
          
          let opts = [opt1, opt2, opt3, opt4].filter(x => x !== '');
          let wrong = opts.filter(x => x !== ans);
          
          examsMap[name].questions.push({
            qType: qType,
            q: qText,
            ans: ans,
            wrong: wrong,
            explanation: ''
          });
        }
      }
      
      const newExams = Object.values(examsMap);
      
      // Giới hạn 10 câu hỏi cho mỗi đề
      newExams.forEach(ex => {
        if (ex.questions.length > 10) {
          ex.questions = ex.questions.slice(0, 10);
        }
      });
      
      if(newExams.length > 0) {
        const modal = document.getElementById('import-confirm-modal');
        document.getElementById('import-confirm-msg').textContent = `Phát hiện ${newExams.length} đề thi hợp lệ trong file.`;

        modal.style.display = 'flex';
        
        const finishImport = () => {
          modal.style.display = 'none';
          saveLibraryExams();
          renderExamList();
          alert('Đã nhập thành công ' + newExams.length + ' đề thi!');
        };

        document.getElementById('btn-import-overwrite').onclick = () => {
          libraryExams = newExams;
          finishImport();
        };

        document.getElementById('btn-import-append').onclick = () => {
          libraryExams = libraryExams.concat(newExams);
          finishImport();
        };

        document.getElementById('btn-import-cancel').onclick = () => {
          modal.style.display = 'none';
        };
      } else {
        alert('Không tìm thấy dòng dữ liệu hợp lệ nào.');
      }
    } catch (error) {
      alert("Lỗi khi đọc file CSV: " + error.message);
    }
    e.target.value = ''; // reset
  };
  reader.readAsText(file);
});


// 4. Mở Modal chọn Đề thi để in PNG
document.getElementById('btn-show-export-pdf')?.addEventListener('click', () => {
  if (libraryExams.length === 0) {
    alert("Không có đề thi nào trong kho để xuất!");
    return;
  }
  
  const listArea = document.getElementById('export-exam-list-area');
  let html = '';
  libraryExams.forEach((exam, index) => {
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
        <div>
          <strong>${exam.name}</strong> - Lớp ${exam.classLevel} (${exam.timePeriod})
          <div style="font-size:0.85rem; color:#64748b;">Số câu hỏi: ${(exam.questions || []).length} / 10</div>
        </div>
        <button onclick="previewExamPdf(${index})" class="option-btn" style="background:#3b82f6; color:white; padding:8px 15px; font-size:0.9rem;">👁️ Xem trước</button>
      </div>
    `;
  });
  listArea.innerHTML = html;
  
  document.getElementById('select-exam-export-modal').style.display = 'flex';
});

// 5. Render nội dung vào khung A4 và chụp lại bằng html2canvas
window.previewExamPdf = function(index) {
  const exam = libraryExams[index];
  const qList = exam.questions || [];
  
  document.getElementById('print-exam-title').innerText = exam.name.toUpperCase();
  
  // Tách câu hỏi cho trang 1 (tối đa 5 câu) và trang 2 (phần còn lại)
  let qHtml1 = '';
  let qHtml2 = '';
  
  qList.forEach((q, i) => {
    let html = `<div style="margin-bottom: 20px;">
      <strong>Câu ${i+1}:</strong> ${q.q}
    `;
    
    // Render đáp án tùy vào loại câu
    if (q.qType === 'multiple_choice' || q.qType === 'true_false' || !q.qType) {
      // 4 đáp án (gồm ans và wrong)
      let opts = [q.ans, ...(q.wrong || [])].sort(() => Math.random() - 0.5);
      html += `<div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:5px;">`;
      const labels = ['A', 'B', 'C', 'D'];
      opts.forEach((opt, idx) => {
        html += `<div style="min-width: 45%;"><strong>${labels[idx]}.</strong> ${opt}</div>`;
      });
      html += `</div>`;
    } else if (q.qType === 'fill_blank') {
      html += `<div style="margin-top: 10px; border-bottom: 1px dotted #333; width: 100%; height: 30px;"></div>`;
    } else if (q.qType === 'comparison') {
      html += `<div style="margin-top: 10px;">Điền dấu >, <, =: [ ___ ]</div>`;
    } else {
      // Các loại khác
      html += `<div style="margin-top: 10px; border-bottom: 1px dotted #333; width: 100%; height: 30px;"></div>`;
    }
    html += `</div>`;
    
    if (i < 5) qHtml1 += html;
    else qHtml2 += html;
  });
  
  document.getElementById('print-questions-1').innerHTML = qHtml1;
  document.getElementById('print-questions-2').innerHTML = qHtml2;
  
  // Hiển thị modal loading
  document.getElementById('select-exam-export-modal').style.display = 'none';
  const previewModal = document.getElementById('export-pdf-modal');
  const previewArea = document.getElementById('pdf-preview-area');
  previewArea.innerHTML = '<p>Đang tạo bản xem trước, vui lòng chờ...</p>';
  previewModal.style.display = 'flex';
  
  // Chụp html2canvas
  setTimeout(async () => {
    const page1 = document.getElementById('a4-page-1');
    const page2 = document.getElementById('a4-page-2');
    
    try {
      const canvas1 = await html2canvas(page1, { scale: 1.5, useCORS: true });
      const canvas2 = await html2canvas(page2, { scale: 1.5, useCORS: true });
      
      const img1 = document.createElement('img');
      img1.src = canvas1.toDataURL("image/png");
      img1.style.width = "100%";
      img1.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
      
      const img2 = document.createElement('img');
      img2.src = canvas2.toDataURL("image/png");
      img2.style.width = "100%";
      img2.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
      
      previewArea.innerHTML = '<h3 style="margin: 0; width: 100%; text-align: left;">Trang 1:</h3>';
      previewArea.appendChild(img1);
      
      const h3Page2 = document.createElement('h3');
      h3Page2.style.cssText = "margin: 0; width: 100%; text-align: left;";
      h3Page2.innerText = "Trang 2:";
      previewArea.appendChild(h3Page2);
      
      previewArea.appendChild(img2);
      
      // Gán sự kiện cho nút Download
      const btnDownload = document.getElementById('btn-download-pdf');
      // Xóa event listener cũ
      const newBtnDownload = btnDownload.cloneNode(true);
      btnDownload.parentNode.replaceChild(newBtnDownload, btnDownload);
      
      newBtnDownload.addEventListener('click', () => {
        const a1 = document.createElement('a');
        a1.href = img1.src;
        a1.download = `DeThi_${exam.name.replace(/\s+/g, '')}_Trang1.png`;
        a1.click();
        
        setTimeout(() => {
          const a2 = document.createElement('a');
          a2.href = img2.src;
          a2.download = `DeThi_${exam.name.replace(/\s+/g, '')}_Trang2.png`;
          a2.click();
        }, 500);
      });
      
    } catch (err) {
      previewArea.innerHTML = `<p style="color:red;">Lỗi khi tạo hình ảnh: ${err.message}</p>`;
    }
  }, 100); // Đợi DOM cập nhật
};

document.getElementById('btn-cancel-pdf')?.addEventListener('click', () => {
  document.getElementById('export-pdf-modal').style.display = 'none';
  document.getElementById('select-exam-export-modal').style.display = 'flex';
});


// ==========================================
// LOGIC LÀM BÀI THI CUỘN DỌC
// ==========================================

function renderMathExamQuestions() {
  const container = document.getElementById('math-exam-questions-list');
  let html = '';
  
  mathState.questions.forEach((q, i) => {
    html += `
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(10px); border: 2px solid rgba(255,215,0,0.4); border-radius: 20px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
        <h3 style="color: #fef08a; margin-top: 0; font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Câu ${i + 1}</h3>
        <p style="font-size: 1.3rem; color: white; margin-bottom: 20px;">${q.q}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
    `;
    
    q.options.forEach((opt, idx) => {
      html += `
        <label style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); padding: 15px; border-radius: 10px; color: white; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; transition: background 0.2s;">
          <input type="radio" name="math-exam-q${i}" value="${opt}" style="width: 20px; height: 20px;">
          ${opt}
        </label>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

window.submitMathExam = function() {
  let score = 0;
  let correctCount = 0;
  let totalCount = mathState.questions.length;
  
  mathState.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="math-exam-q${i}"]:checked`);
    if(selected && selected.value === q.ans) {
      score += 10;
      correctCount++;
    }
  });
  
  mathState.score = score;
  
  // Hiển thị kết quả
  document.getElementById('math-exam-play-view').style.display = 'none';
  document.getElementById('math-result-view').style.display = 'flex';
  
  document.getElementById('math-final-score').textContent = mathState.score;
  document.getElementById('math-final-total').textContent = totalCount * 10;
  document.getElementById('math-result-msg').textContent = `Chúc mừng bạn đã hoàn thành Đề Thi! Bạn trả lời đúng ${correctCount}/${totalCount} câu.`;
  
  if(currentUser) {
    currentUser.totalScore += mathState.score;
    currentUser.playCount += 1;
    updateUserScore();
  }
};

function renderVietExamQuestions() {
  const container = document.getElementById('viet-exam-questions-list');
  let html = '';
  
  vietState.questions.forEach((q, i) => {
    html += `
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(10px); border: 2px solid rgba(16,185,129,0.4); border-radius: 20px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
        <h3 style="color: #6ee7b7; margin-top: 0; font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Câu ${i + 1}</h3>
        <p style="font-size: 1.3rem; color: white; margin-bottom: 20px;">${q.q}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
    `;
    
    q.options.forEach((opt, idx) => {
      html += `
        <label style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); padding: 15px; border-radius: 10px; color: white; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; transition: background 0.2s;">
          <input type="radio" name="viet-exam-q${i}" value="${opt}" style="width: 20px; height: 20px;">
          ${opt}
        </label>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

window.submitVietExam = function() {
  let score = 0;
  let correctCount = 0;
  let totalCount = vietState.questions.length;
  
  vietState.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="viet-exam-q${i}"]:checked`);
    if(selected && selected.value === q.ans) {
      score += 10;
      correctCount++;
    }
  });
  
  vietState.score = score;
  
  // Hiển thị kết quả
  document.getElementById('viet-exam-play-view').style.display = 'none';
  document.getElementById('viet-result-view').style.display = 'flex';
  
  document.getElementById('viet-final-score').textContent = vietState.score;
  document.getElementById('viet-final-total').textContent = totalCount * 10;
  document.getElementById('viet-result-msg').textContent = `Chúc mừng bạn đã hoàn thành Đề Thi! Bạn trả lời đúng ${correctCount}/${totalCount} câu.`;
  
  if(currentUser) {
    currentUser.totalScore += vietState.score;
    currentUser.playCount += 1;
    updateUserScore();
  }
};


window.finishExam = function() {
  if (!window.currentExamData) return;
  const exam = window.currentExamData;
  let correctCount = 0;
  const totalCount = exam.questions.length;
  let historyDetails = [];
  
  for(let i=0; i<totalCount; i++) {
    const q = exam.questions[i];
    const qNum = i + 1;
    let chosen = '';
    
    if (q.qType === 'fill_blank' || q.qType === 'sequence' || q.qType === 'comparison') {
      const input = document.getElementById('exam-ans-' + qNum);
      if (input) chosen = input.value.trim();
    } else {
      const selected = document.querySelector(`input[name="exam-q${qNum}"]:checked`);
      if (selected) chosen = selected.value.trim();
    }
    
    let isCorrect = (String(chosen).toLowerCase() === String(q.ans).trim().toLowerCase());
    if (isCorrect) correctCount++;
    
    historyDetails.push({
      q: q.q,
      chosen: chosen,
      isCorrect: isCorrect,
      correctAnswer: q.ans
    });
  }
  
  let finalScore = (correctCount / totalCount) * 10;
  finalScore = Math.round(finalScore * 10) / 10;
  
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.

Created At: 2026-07-11T15:58:16Z
Completed At: 2026-07-11T15:58:16Z
File Path: `file:///d:/NTT/AI/Web/Game%20lop5/src/main.js`
Total Lines: 2815
Total Bytes: 123211
Showing lines 2600 to 2815
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
  document.getElementById('exam-play-screen').style.display = 'none';
  finishGame('exam', finalScore, 10, historyDetails, exam.name);
}

window.finishGame = function(type, score, maxScore, details, examName = '') {
  if (currentUser) {
    if(!currentUser.history) currentUser.history = [];
    
    let gameName = type === 'math' ? 'Toán Học' : (type === 'vietnamese' ? 'Tiếng Việt' : 'Đề Thi: ' + examName);
    
    // Save to history
    currentUser.history.push({
      date: new Date().toLocaleString(),
      type: type,
      name: gameName,
      score: score,
      maxScore: maxScore,
      details: details
    });
    
    // Award lollipop if score == 10
    let gotLollipop = false;
    if (score === 10) {
      currentUser.lollipops = (currentUser.lollipops || 0) + 1;
      gotLollipop = true;
    }
    currentUser.totalScore = Math.round((parseFloat(currentUser.totalScore || 0) + parseFloat(score)) * 10) / 10;
    if (typeof updatePlayerDisplay === 'function') updatePlayerDisplay();
    
    // Save to localStorage
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if(userIndex !== -1) {
      users[userIndex] = currentUser;
      localStorage.setItem('gameUsers', JSON.stringify(users));
    }
    
    showResultModal(score, maxScore, details, gotLollipop);
  }
}

window.showResultModal = function(score, maxScore, details, gotLollipop) {
  const modal = document.getElementById('result-modal');
  const scoreText = document.getElementById('result-score-text');
  const msgText = document.getElementById('result-msg-text');
  const lollipopArea = document.getElementById('result-lollipop-area');
  const detailsList = document.getElementById('result-details-list');
  
  scoreText.textContent = `${score}/${maxScore}`;
  
  if (score === 10) {
    msgText.textContent = 'Xuất Sắc! Bạn đã trả lời đúng tất cả!';
    msgText.style.color = '#4ade80';
    lollipopArea.style.display = 'flex';
  } else if (score >= 8) {
    msgText.textContent = 'Giỏi lắm! Bạn làm rất tốt!';
    msgText.style.color = '#60a5fa';
    lollipopArea.style.display = 'none';
  } else if (score >= 5) {
    msgText.textContent = 'Cố gắng lên nhé! Bạn đã qua bài.';
    msgText.style.color = '#facc15';
    lollipopArea.style.display = 'none';
  } else {
    msgText.textContent = 'Tiếc quá! Hãy xem lại chi tiết bài làm bên phải để ôn tập nhé.';
    msgText.style.color = '#f87171';
    lollipopArea.style.display = 'none';
  }
  
  let detailsHtml = '';
  (details || []).forEach((d, idx) => {
    const isCorrect = d.isCorrect;
    const color = isCorrect ? '#22c55e' : '#ef4444';
    const icon = isCorrect ? '✅' : '❌';
    detailsHtml += `
      <div style="background: white; border: 1px solid #cbd5e1; border-left: 5px solid ${color}; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <h4 style="margin-top:0; color:#334155;">Câu ${idx + 1}: ${d.q}</h4>
        <div style="margin-bottom: 5px;">Bạn chọn: <strong style="color:${color};">${d.chosen || '(Bỏ trống)'}</strong> ${icon}</div>
        ${!isCorrect ? `<div>Đáp án đúng: <strong style="color:#22c55e;">${d.correctAnswer}</strong></div>` : ''}
      </div>
    `;
  });
  
  detailsList.innerHTML = detailsHtml;
  modal.style.display = 'flex';
}

window.closeResultModal = function() {
  document.getElementById('result-modal').style.display = 'none';
  openScreen('map-screen');
}

// Treasure Modal Logic
document.getElementById('treasure-btn')?.addEventListener('click', () => {
  openTreasureModal();
});

window.openTreasureModal = function() {
  const modal = document.getElementById('treasure-modal');
  modal.style.display = 'flex';
  
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('treasure-tabs').style.display = 'flex';
    document.getElementById('treasure-lollipop-container').style.display = 'none';
    switchTreasureTab('leaderboard');
  } else if (currentUser) {
    document.getElementById('treasure-tabs').style.display = 'none';
    
    // Render lollipops
    const lolContainer = document.getElementById('treasure-lollipop-container');
    lolContainer.style.display = 'flex';
    const lollipops = currentUser.lollipops || 0;
    if (lollipops === 0) {
      lolContainer.innerHTML = '<span style="color:#64748b; font-style:italic;">Chưa có viên kẹo mút nào. Cố gắng đạt 10/10 nhé!</span>';
    } else {
      let lolHtml = '';
      for(let i=0; i<lollipops; i++) {
        lolHtml += `<img src="./public/lollipop.png" style="width:40px; height:40px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" title="Kẹo mút thứ ${i+1}">`;
      }
      lolContainer.innerHTML = lolHtml;
    }
    
    // Render player history
    renderHistoryTable(currentUser.history || []);
  }
}

window.switchTreasureTab = function(tab) {
  document.getElementById('tab-leaderboard-btn').style.background = tab === 'leaderboard' ? '#3b82f6' : '#64748b';
  document.getElementById('tab-history-btn').style.background = tab === 'history' ? '#3b82f6' : '#64748b';
  
  if (tab === 'leaderboard') {
    renderAdminLeaderboard();
  } else {
    // Collect all histories
    let allHistory = [];
    users.forEach(u => {
      if (u.role !== 'admin' && u.history) {
        u.history.forEach(h => {
          allHistory.push({ user: u.username, fullname: u.fullname, ...h });
        });
      }
    });
    renderHistoryTable(allHistory, true);
  }
}

window.renderHistoryTable = function(historyArr, isAdmin = false) {
  const area = document.getElementById('treasure-content-area');
  if (historyArr.length === 0) {
    area.innerHTML = '<p style="text-align:center; padding:20px;">Chưa có lịch sử làm bài.</p>';
    return;
  }
  
  // Sắp xếp lịch sử mới nhất lên đầu (đảo ngược mảng)
  const sorted = [...historyArr].reverse();
  
  let html = `<table style="width:100%; border-collapse:collapse; text-align:left;">
    <tr style="background:#e2e8f0;">
      <th style="padding:10px;">Thời Gian</th>
      ${isAdmin ? '<th style="padding:10px;">Người Chơi</th>' : ''}
      <th style="padding:10px;">Loại Bài</th>
      <th style="padding:10px;">Điểm</th>
      <th style="padding:10px;">Chi Tiết</th>
    </tr>`;
    
  sorted.forEach((h, i) => {
    // Lưu tạm details vào window.tempHistory để nút Chi tiết có thể lấy
    if(!window.tempHistory) window.tempHistory = [];
    window.tempHistory[i] = h.details || [];
    
    html += `<tr style="border-bottom:1px solid #eee;">
      <td style="padding:10px;">${h.date}</td>
      ${isAdmin ? `<td style="padding:10px;">${h.fullname} (${h.user})</td>` : ''}
      <td style="padding:10px;">${h.name}</td>
      <td style="padding:10px; font-weight:bold; color:${h.score >= 5 ? '#22c55e' : '#ef4444'}">${h.score}/${h.maxScore}</td>
      <td style="padding:10px;">
        <button onclick="showResultModal(${h.score}, ${h.maxScore}, window.tempHistory[${i}], false)" style="padding:5px 10px; background:#8b5cf6; color:white; border:none; border-radius:5px; cursor:pointer;">Xem</button>
      </td>
    </tr>`;
  });
  html += '</table>';
  area.innerHTML = html;
}

window.renderAdminLeaderboard = function() {
  const area = document.getElementById('treasure-content-area');
  const players = users.filter(u => u.role !== 'admin');
  
  // Sort by lollipops desc, then score desc
  players.sort((a,b) => {
    const lA = a.lollipops || 0;
    const lB = b.lollipops || 0;
    if (lB !== lA) return lB - lA;
    return (b.totalScore || 0) - (a.totalScore || 0);
  });
  
  let html = `<table style="width:100%; border-collapse:collapse; text-align:left;">
    <tr style="background:#e2e8f0;">
      <th style="padding:10px;">Hạng</th>
      <th style="padding:10px;">Học Sinh</th>
      <th style="padding:10px;">Số Kẹo Mút</th>
      <th style="padding:10px;">Tổng Điểm</th>
    </tr>`;
    
  players.forEach((p, idx) => {
    html += `<tr style="border-bottom:1px solid #eee;">
      <td style="padding:10px; font-weight:bold;">${idx + 1}</td>
      <td style="padding:10px;">${p.fullname} (Lớp ${p.classLevel || 5})</td>
      <td style="padding:10px; font-size:1.2rem;">${p.lollipops || 0} 🍭</td>
      <td style="padding:10px;">${p.totalScore || 0}</td>
    </tr>`;
  });
  html += '</table>';
  area.innerHTML = html;
}


The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.

