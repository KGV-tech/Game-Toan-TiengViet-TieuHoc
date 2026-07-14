const fs = require('fs');
let mainJs = fs.readFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', 'utf8');

const target = `      } else {
        area.innerHTML = \`<p style="padding:20px;">Tab \${tab} đang được hoàn thiện UI, nhưng dữ liệu vẫn an toàn.</p>\`;
      }`;

const replacement = `      } else if (tab === 'library') {
        let html = \`
          <div style="margin-bottom:20px; display:flex; gap:10px;">
            <button class="btn-success" onclick="app.admin.addQuestion()">+ Thêm Câu Hỏi</button>
            <input type="file" id="import-excel" accept=".xlsx, .xls" style="display:none;" onchange="app.admin.importExcel(event)">
            <button class="btn-primary" onclick="document.getElementById('import-excel').click()">Nhập từ Excel</button>
          </div>
          <table><tr><th>Môn</th><th>Chủ đề</th><th>Câu hỏi</th><th>Loại</th><th>Hành động</th></tr>
        \`;
        app.data.libraryQuestions.forEach((q, i) => {
          html += \`<tr>
            <td>\${q.subject}</td><td>\${q.topic}</td><td>\${q.q}</td><td>\${q.qType}</td>
            <td>
              <button class="btn-danger" onclick="app.admin.deleteQuestion(\${i})">Xóa</button>
            </td>
          </tr>\`;
        });
        area.innerHTML = html + '</table>';
      } else if (tab === 'exams') {
        let html = \`
          <div style="margin-bottom:20px;">
            <button class="btn-success" onclick="app.admin.addExam()">+ Tạo Đề Thi</button>
          </div>
          <table><tr><th>Tên đề</th><th>Môn</th><th>Lớp</th><th>Kỳ</th><th>Hành động</th></tr>
        \`;
        app.data.exams.forEach((e, i) => {
          html += \`<tr>
            <td>\${e.name}</td><td>\${e.subject}</td><td>\${e.classLevel}</td><td>\${e.period}</td>
            <td>
              <button class="btn-primary" onclick="app.admin.exportPDF(\${i})">In PDF</button>
              <button class="btn-danger" onclick="app.admin.deleteExam(\${i})">Xóa</button>
            </td>
          </tr>\`;
        });
        area.innerHTML = html + '</table>';
      }
`;

const extraMethods = `
  // Admin Methods Extended
  app.admin.deleteQuestion = function(i) {
    if(confirm('Chắc chắn xóa?')) { app.data.libraryQuestions.splice(i, 1); app.data.saveLibrary(); app.admin.switchTab('library'); }
  };
  app.admin.deleteExam = function(i) {
    if(confirm('Chắc chắn xóa?')) { app.data.exams.splice(i, 1); app.data.saveExams(); app.admin.switchTab('exams'); }
  };
  app.admin.addQuestion = function() { alert('Chức năng thêm câu hỏi chi tiết qua giao diện đang được thiết kế. Vui lòng dùng tính năng Nhập từ Excel để thêm hàng loạt.'); };
  app.admin.addExam = function() { alert('Vui lòng tạo đề thi từ Excel hoặc chức năng mở rộng.'); };
  
  app.admin.importExcel = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const sheetName = workbook.SheetNames[0];
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      json.forEach(row => {
        app.data.libraryQuestions.push({
          subject: row['Môn'] || 'math',
          topic: row['Chủ đề'] || 'Chung',
          classLevel: row['Lớp'] || 5,
          diff: row['Độ khó'] || 'medium',
          qType: row['Loại'] || 'multiple_choice',
          q: row['Câu hỏi'],
          ans: row['Đáp án'],
          wrong: [row['Sai 1'], row['Sai 2'], row['Sai 3']].filter(Boolean),
          explanation: row['Giải thích'] || ''
        });
      });
      app.data.saveLibrary();
      alert('Đã nhập ' + json.length + ' câu hỏi thành công!');
      app.admin.switchTab('library');
    };
    reader.readAsArrayBuffer(file);
  };
  
  app.admin.exportPDF = function(index) {
    const exam = app.data.exams[index];
    const doc = new jspdf.jsPDF();
    doc.setFontSize(16);
    doc.text(exam.name, 20, 20);
    doc.setFontSize(12);
    let y = 30;
    (exam.questions || []).forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(\`Câu \${i+1}: \${q.q}\`, 20, y);
      y += 10;
    });
    doc.save(exam.name + '.pdf');
  };
`;

mainJs = mainJs.replace(target, replacement);
mainJs = mainJs.replace('window.app = app;', extraMethods + '\nwindow.app = app;');

fs.writeFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', mainJs, 'utf8');
console.log("Admin logic appended!");
