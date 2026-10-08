;(function(root) {
  const app = root.app, D = root.WorksheetDocument, esc = D.escape;
  const classroom = {
    assignments: [], submissions: [], current: null, answers: {}, pending: false,
    client() { return supabaseClient; },
    teacher() { return app.data.currentUser?.role?.toLowerCase() === 'admin'; },
    container() { return document.getElementById('worksheet-classroom-content'); },
    status(message, error = false) {
      const el = document.getElementById('worksheet-classroom-status');
      el.textContent = message; el.setAttribute('role',error?'alert':'status'); el.classList.toggle('ws-error',error);
    },
    async open() {
      if (!app.data.currentUser) return;
      app.router.open('worksheet-classroom-screen');
      this.container().innerHTML=''; this.status('Đang tải Phiếu học tập…');
      try {
        if (!window.supabase) throw new Error('Cần kết nối và đăng nhập để nhận/nộp Phiếu học tập. Bài làm nháp vẫn lưu trên thiết bị.');
        const [a,s] = await Promise.all([
          this.client().from('worksheet_assignments').select('id,worksheet_id,student_username,title,document,created_at').order('created_at',{ascending:false}).limit(300),
          this.client().from('worksheet_submissions').select('id,assignment_id,student_username,answers,score,feedback,submitted_at,graded_at').order('submitted_at',{ascending:false}).limit(300)
        ]);
        if(a.error || s.error) throw new Error('Chưa tải được giao/nộp phiếu. Kiểm tra kết nối hoặc triển khai migration worksheet_assignments.');
        this.assignments=a.data||[]; this.submissions=s.data||[];
        this.status(''); this.renderList();
      } catch(error) { this.status(error.message,true); }
    },
    renderList() {
      const heading = this.teacher() ? 'Phiếu đã giao và bài chờ chấm' : 'Phiếu học tập của em';
      this.container().innerHTML = `<h2>${heading}</h2><p>Phiếu tự do được giáo viên chấm sau khi nộp, không tự đối chiếu đáp án hoặc cộng điểm game.</p><div class="ws-assignment-list">${this.assignments.length ? this.assignments.map((assignment,i)=> {
        const submission=this.submissions.find(s=>s.assignment_id===assignment.id);
        const state=submission?.graded_at ? `Đã chấm · ${submission.score}/10` : submission ? 'Đã nộp · Chờ giáo viên chấm' : 'Chưa nộp';
        return `<article class="ws-editor-block"><h3>${esc(assignment.title)}</h3>${this.teacher()?`<p>Học sinh: ${esc(assignment.student_username)}</p>`:''}<p>${state}</p>${submission?.feedback?`<p>Nhận xét: ${esc(submission.feedback)}</p>`:''}<button type="button" data-open-assignment="${i}">${this.teacher() ? submission?'Xem và chấm bài':'Xem phiếu đã giao' : submission?'Xem bài đã nộp':'Làm phiếu'}</button></article>`;
      }).join('') : '<p>Chưa có Phiếu học tập được giao.</p>'}</div>`;
      this.container().querySelectorAll('[data-open-assignment]').forEach(btn=>btn.onclick=()=>this.openAssignment(Number(btn.dataset.openAssignment)));
    },
    async assign(index) {
      if (!this.teacher()) return;
      const worksheet=app.data.worksheets[index];
      if (!worksheet?.id || !D.isFreeform(worksheet)) return alert('Hãy lưu và đồng bộ phiếu tự do trước khi giao học sinh.');
      if(JSON.stringify(D.fromRecord(worksheet).pages).includes('[CẦN KIỂM TRA]'))return alert('Phiếu còn vùng OCR chưa rõ. Hãy chỉnh sửa các vùng [CẦN KIỂM TRA] hoặc thay bằng ___ trước khi giao.');
      await app.data.ensureAdminDataLoaded();
      app.router.open('worksheet-classroom-screen'); this.status('');
      const students=(app.data.users||[]).filter(user=>user.role?.toLowerCase()==='student' && user.approved!==false);
      this.container().innerHTML=`<h2>Giao phiếu: ${esc(worksheet.name)}</h2><p>Bản giao được chốt tại thời điểm này và không chứa đáp án của giáo viên.</p><label><input type="checkbox" id="ws-all-students"> Chọn tất cả học sinh bên dưới</label><div class="ws-student-grid">${students.map((student,i)=>`<label><input type="checkbox" value="${esc(student.username)}" name="ws-target"> ${esc(student.fullname||student.username)} · ${esc(student.class_name||student.classlevel||'')}</label>`).join('')}</div><div class="ws-actions"><button type="button" id="ws-assign-confirm">Giao phiếu đã chọn</button></div>`;
      document.getElementById('ws-all-students').onchange=event=>this.container().querySelectorAll('[name="ws-target"]').forEach(input=>input.checked=event.target.checked);
      document.getElementById('ws-assign-confirm').onclick=async event=> {
        if(this.pending) return;
        const targets=Array.from(this.container().querySelectorAll('[name="ws-target"]:checked')).map(input=>input.value);
        if(!targets.length) return this.status('Chọn ít nhất một học sinh.',true);
        this.pending=true; event.target.disabled=true;
        try {
          const {data,error}=await this.client().rpc('assign_freeform_worksheet',{p_worksheet_id:String(worksheet.id),p_students:targets,p_document:D.publicDocument(D.fromRecord(worksheet))});
          if(error) throw new Error('Chưa giao được phiếu. Kiểm tra kết nối và migration giao/nộp phiếu.');
          await this.open(); this.status(`Đã giao phiếu cho ${data} học sinh.`);
        } catch(error) {this.status(error.message,true);} finally {this.pending=false;if(event.target.isConnected)event.target.disabled=false;}
      };
    },
    draftKey(id) {return `worksheet-draft:${app.data.currentUser.username}:${id}`;},
    persistDraft() {
      if (!this.current || this.teacher() || this.current.submission) return;
      const key=this.draftKey(this.current.assignment.id), value=JSON.stringify(this.answers);
      app.safeStorage.setItem(key,value);
      if(app.safeStorage.getItem(key)!==value){this.status('Thiết bị chưa lưu được nháp. Hãy giữ trang này mở và nộp phiếu khi có mạng.',true);return;}
      this.status('Đã lưu nháp trên thiết bị. Bấm Nộp phiếu để gửi giáo viên.');
    },
    openAssignment(index) {
      const assignment=this.assignments[index]; if(!assignment)return;
      const submission=this.submissions.find(s=>s.assignment_id===assignment.id);
      this.current={assignment,submission}; this.answers=submission?.answers||{};
      if(!submission&&!this.teacher()) {
        try {this.answers=JSON.parse(app.safeStorage.getItem(this.draftKey(assignment.id))||'{}');} catch(_){this.answers={};}
      }
      if (!this.answers || typeof this.answers !== 'object' || Array.isArray(this.answers)) this.answers = {};
      const readOnly=this.teacher()||Boolean(submission);
      this.container().innerHTML=`<div class="ws-actions"><button type="button" id="ws-assignment-back">Về danh sách phiếu</button>${!readOnly?'<button type="button" id="ws-submit-work">Nộp phiếu cho giáo viên</button>':''}</div><p>${readOnly?'Bài đã nộp được giữ nguyên để giáo viên chấm.':'Em có thể gõ, chọn đáp án hoặc viết bằng bút/tay trong khung bên dưới từng bài. Nét bút được lưu nháp trên thiết bị.'}</p>${D.render(assignment.document,{rootId:'ws-student-paper',interactive:true,answers:this.answers})}${this.teacher()&&submission?`<section class="ws-grade"><h3>Chấm bài thủ công</h3><label>Điểm (0–10)<input type="number" id="ws-grade-score" min="0" max="10" step="0.25" value="${submission.score??''}"></label><label>Nhận xét<textarea id="ws-grade-feedback" rows="4">${esc(submission.feedback)}</textarea></label><button type="button" id="ws-save-grade">Lưu điểm và nhận xét</button></section>`:''}`;
      this.status(submission?.graded_at?`Điểm: ${submission.score}/10. ${submission.feedback}`:submission?'Đã nộp phiếu. Chờ giáo viên chấm.':'');
      document.getElementById('ws-assignment-back').onclick=()=> {this.current=null;this.renderList();this.status('');};
      this.container().querySelectorAll('[data-ws-answer]').forEach(input=> {
        input.disabled=readOnly;
        input.addEventListener('input',()=> {this.answers[input.dataset.wsAnswer]=input.value;this.persistDraft();});
      });
      this.bindDrawings(readOnly);
      if(document.getElementById('ws-submit-work'))document.getElementById('ws-submit-work').onclick=()=>this.submit();
      if(document.getElementById('ws-save-grade'))document.getElementById('ws-save-grade').onclick=()=>this.grade();
    },
    bindDrawings(readOnly) {
      this.container().querySelectorAll('canvas[data-ws-drawing]').forEach(canvas=> {
        const key=canvas.dataset.wsDrawing, ctx=canvas.getContext('2d');
        const redraw=()=> {
          ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#173c66';ctx.lineWidth=3;ctx.lineCap='round';
          const strokes=Array.isArray(this.answers[key])?this.answers[key].slice(0,500):[];
          for(const stroke of strokes){if(!Array.isArray(stroke))continue;ctx.beginPath();stroke.slice(0,5000).forEach((point,i)=>{if(!Array.isArray(point)||!point.every(Number.isFinite))return;const x=Math.min(canvas.width,Math.max(0,point[0])),y=Math.min(canvas.height,Math.max(0,point[1]));if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();}
        };
        redraw();
        const clear=Array.from(this.container().querySelectorAll('[data-clear-drawing]')).find(button=>button.dataset.clearDrawing===key);
        if(clear){clear.disabled=readOnly;clear.onclick=()=>{this.answers[key]=[];redraw();this.persistDraft();};}
        if(readOnly)return;
        let stroke=null;
        const point=event=>{const rect=canvas.getBoundingClientRect();return[(event.clientX-rect.left)*canvas.width/rect.width,(event.clientY-rect.top)*canvas.height/rect.height];};
        canvas.onpointerdown=event=> {if(!Array.isArray(this.answers[key]))this.answers[key]=[];if(this.answers[key].length>=100)return;canvas.setPointerCapture(event.pointerId);stroke=[point(event)];this.answers[key].push(stroke);redraw();};
        canvas.onpointermove=event=> {if(stroke&&stroke.length<1000){stroke.push(point(event));redraw();}};
        const finish=()=>{if(stroke){stroke=null;this.persistDraft();}};
        canvas.onpointerup=finish;canvas.onpointercancel=finish;canvas.onlostpointercapture=finish;
      });
    },
    async submit() {
      if(this.pending||this.teacher()||!this.current||this.current.submission)return;
      if(!confirm('Nộp phiếu cho giáo viên? Sau khi nộp em sẽ xem lại bài và chờ nhận xét.'))return;
      this.pending=true;const btn=document.getElementById('ws-submit-work');btn.disabled=true;
      const current = this.current, draftKey = this.draftKey(current.assignment.id);
      this.persistDraft();this.status('Đang nộp phiếu…');
      try {
        const {data,error}=await this.client().rpc('submit_freeform_worksheet',{p_assignment_id:current.assignment.id,p_answers:JSON.parse(JSON.stringify(this.answers))});
        if(error||!data)throw new Error('Chưa nộp được phiếu. Nháp vẫn còn trên thiết bị; hãy kiểm tra mạng và thử lại.');
        this.submissions.push(data);current.submission=data;
        app.safeStorage.setItem(draftKey,'');
        if(this.current===current)this.openAssignment(this.assignments.indexOf(current.assignment));
      } catch(error){this.status(error.message,true);}finally{this.pending=false;if(btn.isConnected)btn.disabled=false;}
    },
    async grade() {
      if(this.pending||!this.teacher()||!this.current?.submission)return;
      const scoreText=document.getElementById('ws-grade-score').value, score=Number(scoreText);
      if(!scoreText||!Number.isFinite(score)||score<0||score>10)return this.status('Nhập điểm từ 0 đến 10.',true);
      const feedback=document.getElementById('ws-grade-feedback').value;
      if(feedback.length>10000)return this.status('Nhận xét quá dài (tối đa 10.000 ký tự).',true);
      this.pending=true;const btn=document.getElementById('ws-save-grade');btn.disabled=true;
      const current = this.current;
      try {
        const {data,error}=await this.client().rpc('grade_freeform_worksheet',{p_submission_id:current.submission.id,p_score:score,p_feedback:feedback});
        if(error||!data)throw new Error('Chưa lưu được điểm. Kiểm tra kết nối rồi thử lại.');
        const i=this.submissions.findIndex(s=>s.id===data.id);this.submissions[i]=data;current.submission=data;
        this.status('Đã lưu điểm và nhận xét. Học sinh có thể xem lại trong Phiếu học tập.');
      }catch(error){this.status(error.message,true);}finally{this.pending=false;btn.disabled=false;}
    }
  };
  app.worksheetClassroom=classroom;
})(globalThis);
