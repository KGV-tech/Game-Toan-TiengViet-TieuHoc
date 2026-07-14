import re

with open("src/main.js", "r", encoding="utf-8") as f:
    content = f.read()

new_game_code = """
  constants: {
    mathTopics: [
      '1. Ôn tập và bổ sung về phân số', '2. Số thập phân', '3. Các phép tính với số thập phân',
      '4. Tỉ số phần trăm', '5. Độ dài, khối lượng, diện tích, thể tích', '6. Thời gian, vận tốc',
      '7. Hình tam giác, hình thang', '8. Chu vi, diện tích hình tròn', '9. Hình hộp chữ nhật, hình lập phương',
      '10. Biểu đồ', '11. Một số yếu tố thống kê và xác suất', '12. Ôn tập cuối năm'
    ],
    vietnameseTopics: [
      '1. Thế giới tuổi thơ', '2. Thiên nhiên kỳ thú', '3. Trên con đường học tập',
      '4. Nghệ thuật muôn màu', '5. Vẻ đẹp cuộc sống', '6. Hương sắc trăm miền',
      '7. Tiếp bước cha ông', '8. Thế giới của chúng ta'
    ]
  },

  game: {
    state: { subject: '', topicMode: 'single', selectedTopics: [], difficulty: 'medium', count: 10, questions: [], currentIdx: 0, score: 0, selectedAns: null, historyDetails: [] },
    
    init() {
      document.querySelectorAll('.station[data-subject]').forEach(el => {
        el.onclick = () => {
          if (el.dataset.subject === 'exam') app.router.open('exam-select-screen');
          else this.openConfig(el.dataset.subject);
        };
      });
    },
    openConfig(subject) {
      this.state.subject = subject;
      this.state.selectedTopics = [];
      this.state.topicMode = 'single';
      
      document.getElementById('game-config-title').textContent = subject === 'math' ? 'VUI HỌC TOÁN' : 'VUI HỌC TIẾNG VIỆT';
      document.getElementById('start-adv-icon').src = subject === 'math' ? './public/torch_new.png' : './public/watering_can.png';
      
      const themeCls = subject === 'math' ? 'theme-math' : 'theme-vietnamese';
      document.getElementById('game-screen').className = 'screen active ' + themeCls;
      app.router.openGameView('game-config-view');
      
      document.querySelector('input[name="topicMode"][value="single"]').checked = true;
      this.renderTopics();
      
      document.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.diff-options .btn-opt')[1].classList.add('active'); // medium
      document.querySelectorAll('.count-options .btn-opt')[0].classList.add('active'); // 10
      this.state.difficulty = 'medium';
      this.state.count = 10;
    },
    toggleTopicMode() {
      this.state.topicMode = document.querySelector('input[name="topicMode"]:checked').value;
      if (this.state.topicMode === 'single') this.state.selectedTopics = [];
      this.renderTopics();
    },
    renderTopics() {
      const topics = this.state.subject === 'math' ? app.constants.mathTopics : app.constants.vietnameseTopics;
      const container = document.getElementById('topics-list');
      container.innerHTML = '';
      topics.forEach(t => {
        const lbl = document.createElement('label');
        lbl.className = 'topic-item';
        const inp = document.createElement('input');
        inp.type = this.state.topicMode === 'single' ? 'radio' : 'checkbox';
        inp.name = 'topic-selection';
        inp.value = t;
        inp.onchange = (e) => {
          if (this.state.topicMode === 'single') {
            this.state.selectedTopics = [t];
          } else {
            if (e.target.checked) this.state.selectedTopics.push(t);
            else this.state.selectedTopics = this.state.selectedTopics.filter(x => x !== t);
          }
        };
        lbl.appendChild(inp);
        lbl.appendChild(document.createTextNode(t));
        container.appendChild(lbl);
      });
    },
    setDifficulty(val, btn) {
      this.state.difficulty = val;
      btn.parentElement.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    },
    setCount(val, btn) {
      this.state.count = val;
      btn.parentElement.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    },
    startPlay() {
      if (this.state.selectedTopics.length === 0) {
        alert('Vui lòng chọn ít nhất 1 chủ đề!');
        return;
      }
      
      const clLevel = app.data.currentUser ? app.data.currentUser.classLevel : '5';
      let pool = app.data.libraryQuestions.filter(q => 
        q.subject === this.state.subject && 
        q.classLevel === clLevel &&
        q.difficulty === this.state.difficulty &&
        this.state.selectedTopics.some(t => t.includes(q.topic))
      );
      
      if (pool.length < this.state.count) {
        alert('Ngân hàng không đủ ' + this.state.count + ' câu hỏi, sẽ lấy tất cả câu hiện có!');
      }
      
      // shuffle and slice
      pool = pool.sort(() => 0.5 - Math.random()).slice(0, this.state.count);
      
      if (pool.length === 0) {
        alert('Không có câu hỏi phù hợp! Vui lòng nhập thêm dữ liệu vào thư viện.');
        return;
      }
      
      this.state.questions = pool;
      this.state.currentIdx = 0;
      this.state.score = 0;
      this.state.historyDetails = [];
      
      app.router.openGameView('game-play-view');
      this.loadQuestion();
    },
    confirmExit() {
      if (confirm('Bạn chưa hoàn thành, thoát giữa chừng sẽ không được ghi nhận điểm!')) {
        app.router.open('map-screen');
      }
    },
    getAnsArr(ansString) {
      if(!ansString) return [];
      if(ansString.includes(',')) return ansString.split(',').map(s=>s.trim());
      if(ansString.includes('|')) return ansString.split('|').map(s=>s.trim());
      return [ansString.trim()];
    },
    loadQuestion() {
      const q = this.state.questions[this.state.currentIdx];
      document.getElementById('current-q-index').textContent = this.state.currentIdx + 1;
      document.getElementById('total-q-count').textContent = this.state.questions.length;
      document.getElementById('game-score').textContent = Math.round(this.state.score * 10) / 10;
      
      document.getElementById('cat-speech-bubble').style.display = 'none';
      document.getElementById('play-cat-img').src = './public/cat.png';
      
      let qHtml = q.q;
      if (q.imageUrl) qHtml += `<br><img src="${q.imageUrl}" style="max-height:200px; margin-top:10px;">`;
      document.getElementById('game-question-container').innerHTML = qHtml;
      
      const optContainer = document.getElementById('game-options-container');
      optContainer.innerHTML = '';
      this.state.selectedAns = null;
      
      const btnCheck = document.getElementById('submit-ans-btn');
      btnCheck.disabled = true;
      document.getElementById('submit-ans-text').textContent = 'Kiểm Tra';
      btnCheck.onclick = () => this.submitAnswer();
      
      if (q.qType === 'multiple_choice' || !q.qType) {
        optContainer.className = 'options-grid multiple_choice';
        const opts = [q.opt1, q.opt2, q.opt3, q.opt4].filter(Boolean);
        opts.forEach(opt => {
          const btn = document.createElement('div');
          btn.className = 'ans-btn';
          btn.textContent = opt;
          btn.onclick = () => {
            optContainer.querySelectorAll('.ans-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            this.state.selectedAns = opt;
            btnCheck.disabled = false;
          };
          optContainer.appendChild(btn);
        });
      } else if (q.qType === 'fill_blank') {
        optContainer.className = 'options-grid';
        const parts = (q.q || '').split('___');
        const ansArr = this.getAnsArr(q.ans);
        let inputs = [];
        
        if (parts.length > 1) {
          const div = document.createElement('div');
          div.className = 'fill-blank-container';
          let html = '<div class="fill-blank-text">';
          for (let i = 0; i < parts.length; i++) {
             html += parts[i];
             if (i < parts.length - 1) {
                html += `<input type="text" class="fill-input" id="fill-input-${i}">`;
             }
          }
          html += '</div>';
          div.innerHTML = html;
          optContainer.appendChild(div);
          
          for (let i = 0; i < parts.length - 1; i++) {
            const input = document.getElementById(`fill-input-${i}`);
            inputs.push(input);
            input.oninput = () => {
               const allFilled = inputs.every(inp => inp.value.trim() !== '');
               this.state.selectedAns = inputs.map(inp => inp.value.trim()).join(', ');
               btnCheck.disabled = !allFilled;
            };
          }
        } else {
          // Fallback if no ___ found
          const inp = document.createElement('input');
          inp.className = 'fill-input';
          inp.style.width = '200px';
          inp.oninput = () => { this.state.selectedAns = inp.value; btnCheck.disabled = !inp.value.trim(); };
          optContainer.appendChild(inp);
        }
      }
    },
    submitAnswer() {
      const q = this.state.questions[this.state.currentIdx];
      let isCorrect = false;
      
      if (q.qType === 'fill_blank') {
         const ansArr = this.getAnsArr(q.ans);
         const selectedArr = this.getAnsArr(this.state.selectedAns);
         isCorrect = selectedArr.every((val, i) => val.toLowerCase() === (ansArr[i] || '').toString().toLowerCase());
         // mark inputs correct/wrong visually
         const parts = (q.q || '').split('___');
         if(parts.length > 1) {
            for(let i = 0; i < parts.length - 1; i++) {
               const inp = document.getElementById(`fill-input-${i}`);
               if(inp) {
                  if((inp.value.trim().toLowerCase()) === (ansArr[i] || '').toString().toLowerCase()) {
                     inp.classList.add('correct');
                  } else {
                     inp.classList.add('wrong');
                  }
               }
            }
         }
      } else {
         isCorrect = this.state.selectedAns === q.ans;
      }
      
      const bubble = document.getElementById('cat-speech-bubble');
      bubble.style.display = 'block';
      if (isCorrect) {
        this.state.score += 10 / this.state.questions.length;
        document.getElementById('play-cat-img').src = './public/cat_happy.png';
        bubble.innerHTML = `<span style="color:green;font-size:1.5rem;">Đúng rồi!</span>`;
      } else {
        document.getElementById('play-cat-img').src = './public/cat_sad.png';
        bubble.innerHTML = `<span style="color:red;font-size:1.5rem;">Sai thêm chút nữa!</span>`;
      }
      
      if (q.hint) bubble.innerHTML += `<hr>Lời giải:<br>${q.hint}`;
      
      this.state.historyDetails.push({ q: q.q, selected: this.state.selectedAns, correct: q.ans, isCorrect });
      
      document.getElementById('game-score').textContent = Math.round(this.state.score * 10) / 10;
      
      const btnCheck = document.getElementById('submit-ans-btn');
      document.getElementById('submit-ans-text').textContent = 'Tiếp tục';
      btnCheck.onclick = () => {
        this.state.currentIdx++;
        if (this.state.currentIdx >= this.state.questions.length) this.finishPlay();
        else this.loadQuestion();
      };
    },
    finishPlay() {
      const finalScore = Math.round(this.state.score * 10) / 10;
      let msg = '';
      let giveLollipop = false;
      
      if (finalScore === 10) {
        msg = 'Xuất sắc! Bạn đã giải mã được bí mật của vòng này! Chúc mừng bạn!';
        giveLollipop = true;
      } else if (finalScore >= 5) {
        msg = 'Oh! Bạn vẫn chưa giải mã hết các bí mật của hành trình này.';
      } else {
        msg = 'Tiếc quá! Bạn nên rèn luyện lại cho cuộc phiêu lưu sau.';
      }
      
      this.recordHistory(this.state.subject === 'math' ? 'Toán' : 'Tiếng Việt', finalScore, giveLollipop);
      
      document.getElementById('result-score').textContent = finalScore;
      document.getElementById('result-msg').textContent = msg;
      
      const chest = document.getElementById('bonus-chest-img');
      chest.style.display = giveLollipop ? 'block' : 'none';
      chest.src = './public/bonus_chest.png';
      chest.onclick = () => this.claimBonus();
      
      const detailsBox = document.getElementById('result-details');
      detailsBox.innerHTML = '';
      this.state.historyDetails.forEach((d, i) => {
        const div = document.createElement('div');
        div.style.padding = '10px'; div.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
        div.innerHTML = `<b>${i+1}.</b> ${d.q} <br>
                         Bạn chọn: <span style="color:${d.isCorrect ? '#4ade80' : '#f87171'}">${d.isCorrect ? '✔' : '✘'} ${d.selected || 'Bỏ trống'}</span> <br>
                         ${!d.isCorrect ? `<span style="color:#4ade80">Đáp án: ${d.correct}</span>` : ''}`;
        detailsBox.appendChild(div);
      });
      
      document.getElementById('result-modal').classList.add('active');
    },
    recordHistory(title, score, lollipop) {
      if (!app.data.currentUser || app.data.currentUser.role === 'admin') return;
      app.data.currentUser.history.push({
        date: new Date().toLocaleDateString(),
        title: title,
        score: score,
        details: this.state.historyDetails
      });
      if (lollipop) app.data.currentUser.lollipops = (app.data.currentUser.lollipops || 0) + 1;
      app.data.updateUserScore();
      app.auth.updateHeader();
    },
    claimBonus() {
      const chest = document.getElementById('bonus-chest-img');
      chest.src = './public/lollipop.png';
      chest.style.width = '100px';
      chest.onclick = null;
      alert('Nhận Kẹo Mút Thành Công! Kẹo đã được lưu vào Kho Báu.');
    },
    closeResult() {
      document.getElementById('result-modal').classList.remove('active');
      app.router.open('map-screen');
    }
  },
"""

new_content = re.sub(r'  game: \{.*?^  exam: \{', new_game_code + '\n  exam: {', content, flags=re.DOTALL | re.MULTILINE)

with open("src/main.js", "w", encoding="utf-8") as f:
    f.write(new_content)
