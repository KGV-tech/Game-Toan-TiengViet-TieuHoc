const supabaseUrl = 'https://bjgbbrufnryrtimtzvhn.supabase.co';
const supabaseKey = 'sb_publishable_ElY4p6z3HMpmD5NKsmXZEA_Hh7OsDTk';

// Safe wrapper for Supabase client to prevent crash when offline (no CDN)
const dummyQuery = {
    then(resolve) { resolve({ data: null, error: 'Offline' }); },
    eq() { return this; },
    single() { return this; },
    select() { return this; },
    insert() { return this; },
    update() { return this; },
    upsert() { return this; },
    delete() { return this; }
};
const dummySupabase = {
    from: () => dummyQuery,
    channel: () => ({
        on: () => ({ subscribe: () => {} })
    })
};

let supabaseClient = dummySupabase;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.warn("Supabase SDK not loaded. Chạy ở chế độ Offline (Local) hoàn toàn.");
}
const defaultUsers = [];
const defaultLibraryQuestions = [];
const defaultExams = [];

const app = {
  utils: {
    async loadScript(src, globalVar) {
      if (window[globalVar]) return true;
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => {
          console.error(`Failed to load ${src}`);
          resolve(false); // resolve false instead of reject to avoid unhandled promise crashes
        };
        document.head.appendChild(script);
      });
    }
  },
  safeStorage: {
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage is blocked:', e);
        return null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('localStorage is blocked:', e);
      }
    }
  },
  
  audioCtx: null,
  playSound(type) {
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      if (type === 'correct') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(1760, this.audioCtx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
          osc.connect(gainNode); gainNode.connect(this.audioCtx.destination);
          osc.start(); osc.stop(this.audioCtx.currentTime + 0.5);
      } else if (type === 'tick') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
          osc.connect(gainNode); gainNode.connect(this.audioCtx.destination);
          osc.start(); osc.stop(this.audioCtx.currentTime + 0.05);
      } else {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
          osc.connect(gainNode); gainNode.connect(this.audioCtx.destination);
          osc.start(); osc.stop(this.audioCtx.currentTime + 0.3);
      }
    } catch (e) { console.warn("Web Audio API not supported", e); }
  },

  data: {
    sanitizeHTML(str) {
      if (!str) return '';
      return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },
    users: [],
    libraryQuestions: [],
    exams: [],
    settings: { hardTimeLimit: 10, examTimeLimit: 30 },
    currentUser: null,
    async fetchAllFromSupabase(table, filterCol, filterVal) {
      if (!window.supabase) return [];
      let allData = [];
      let from = 0;
      const step = 1000;
      while (true) {
          let query = supabaseClient.from(table).select('*');
          if (filterCol && filterVal) {
              query = query.ilike(filterCol, `%${filterVal}%`);
          }
          const { data, error } = await query.range(from, from + step - 1);
          if (error) {
              console.error(`Error fetching ${table}:`, error);
              break;
          }
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < step) break;
          from += step;
      }
      return allData;
    },
    
    async init() {
      try {
        // 1. Fetch Users (Deferred to login to save memory/bandwidth)
        this.users = [];
        
        // 2. Fetch Questions (Deferred to login to save memory/bandwidth for students)
        this.libraryQuestions = [];
        this.quests = [];
        this.userQuests = [];
        this.candyRequests = [];
        this.userPets = [];
        
        // 3. Fetch Exams
        this.exams = await this.fetchAllFromSupabase('game_exams');

        // 4. Fetch Settings
        const settingsData = await this.fetchAllFromSupabase('game_settings');
        if (settingsData && settingsData.length > 0) {
            this.settings = settingsData[0].data || settingsData[0];
        } else {
            // Check localStorage fallback
            const localSettings = app.safeStorage.getItem('game_settings');
            if (localSettings) this.settings = JSON.parse(localSettings);
        }
        
        // Realtime subscription
        supabaseClient.channel('custom-all-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_users' }, async (payload) => {
              console.log('Realtime DB Change received!', payload);
              // Only process realtime updates if admin is logged in or for currentUser
              const isAdmin = this.currentUser && this.currentUser.role?.toLowerCase() === 'admin';
              
              if (payload.eventType === 'INSERT') { 
                  if (!Array.isArray(payload.new.history)) payload.new.history = [];
                  if (isAdmin && !this.users.find(u => u.id === payload.new.id)) this.users.push(payload.new);
              } else if (payload.eventType === 'UPDATE') { 
                  if (!Array.isArray(payload.new.history)) payload.new.history = [];
                  if (isAdmin) {
                      const idx = this.users.findIndex(u => u.id === payload.new.id);
                      if (idx > -1) this.users[idx] = payload.new;
                  }
                  
                  // If it's the current user, update their header (e.g. admin approved them, or points changed from another device)
                  if (this.currentUser && this.currentUser.id === payload.new.id) {
                      this.currentUser = payload.new;
                      app.auth.updateHeader();
                  }
              } else if (payload.eventType === 'DELETE') {
                  if (isAdmin) this.users = this.users.filter(u => u.id !== payload.old.id);
              }
              
              if (isAdmin) {
                  app.auth.updateHeader();
              }
              
              // Auto-refresh admin panel if open
              if (app.admin && document.getElementById('admin-station').style.display === 'flex') {
                  if (document.querySelector('.tab-btn.active').textContent.includes('Học Sinh')) {
                      app.admin.renderPlayersList(document.getElementById('admin-subcontent-area').innerHTML.includes('chờ duyệt'));
                  }
              }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_questions' }, async (payload) => {
              console.log('Realtime DB Change received (Questions)!', payload);
              if (payload.eventType === 'INSERT') {
                  if (!this.libraryQuestions.find(q => q.id === payload.new.id)) this.libraryQuestions.push(payload.new);
              } else if (payload.eventType === 'UPDATE') {
                  const idx = this.libraryQuestions.findIndex(q => q.id === payload.new.id);
                  if (idx > -1) this.libraryQuestions[idx] = payload.new;
              } else if (payload.eventType === 'DELETE') {
                  this.libraryQuestions = this.libraryQuestions.filter(q => q.id !== payload.old.id);
              }
              if (app.admin && document.getElementById('admin-station').style.display === 'flex') {
                  if (document.querySelector('.tab-btn.active').textContent.includes('Kho Câu hỏi')) {
                      app.admin.renderLibrary();
                  }
              }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_exams' }, async (payload) => {
              console.log('Realtime DB Change received (Exams)!', payload);
              if (payload.eventType === 'INSERT') {
                  if (!this.exams.find(e => e.id === payload.new.id)) this.exams.push(payload.new);
              } else if (payload.eventType === 'UPDATE') {
                  const idx = this.exams.findIndex(e => e.id === payload.new.id);
                  if (idx > -1) this.exams[idx] = payload.new;
              } else if (payload.eventType === 'DELETE') {
                  this.exams = this.exams.filter(e => e.id !== payload.old.id);
              }
              if (app.admin && document.getElementById('admin-station').style.display === 'flex') {
                  if (document.querySelector('.tab-btn.active').textContent.includes('Kho Đề')) {
                      app.admin.renderExams();
                  }
              }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_settings' }, async (payload) => {
              console.log('Realtime DB Change received (Settings)!', payload);
              if (payload.new && payload.new.data) {
                  this.settings = payload.new.data;
                  app.safeStorage.setItem('game_settings', JSON.stringify(this.settings));
                  // Auto-refresh settings UI if admin is viewing it
                  if (app.admin && document.getElementById('treasure-modal').classList.contains('active')) {
                      const activeTab = document.querySelector('.tab-btn.active');
                      if (activeTab && activeTab.textContent.includes('Điều chỉnh')) {
                          const timeHard = document.getElementById('setting-hard-time');
                          const timeExam = document.getElementById('setting-exam-time');
                          if (timeHard) timeHard.value = this.settings.hardTimeLimit || 10;
                          if (timeExam) timeExam.value = this.settings.examTimeLimit || 30;
                      }
                  }
              }
          })
          .subscribe();
          
      } catch (err) {
        console.error("Critical DB error during init:", err);
        // Fallback to avoid breaking UI completely
        this.users = this.users || [];
        if (!this.users.find(u => u.username === 'admin')) {
           this.users.push({ username: 'admin', password: '123', role: 'admin', fullname: 'Admin', history: [], totalscore: 0, lollipops: 0, classlevel: '5', approved: true });
        }
        this.libraryQuestions = this.libraryQuestions || [];
        this.exams = this.exams || [];
      }

      // Mock data injection has been removed to prevent overwriting production databases during network glitches.
    },
    
    // Instead of bulk saving everything, we now upsert the whole array (or in real-world we'd do precise updates). 
    // To keep it simple and compatible with existing logic:
    async saveUsers() {
       // Only save the changes, but since the old code mutated the array directly, we upsert the entire array.
       // Upsert requires primary key matching. If objects have `id`, it updates. Otherwise inserts.
       for (const u of this.users) {
           const { error } = await supabaseClient.from('game_users').upsert([u], { onConflict: 'username' });
           if (error) console.error("Error saving user:", error);
       }
    },
    async saveSettings() {
       if (!window.supabase) {
           app.safeStorage.setItem('game_settings', JSON.stringify(this.settings));
           return;
       }
       
       const settingsWithId = { data: this.settings };
       const { error } = await supabaseClient.from('game_settings').update(settingsWithId).eq('id', 1);
       if (error) {
           console.error("Error saving settings to supabase:", error);
           alert("Lỗi khi lưu lên Supabase: " + error.message);
           app.safeStorage.setItem('game_settings', JSON.stringify(this.settings)); // fallback
       }
       return error;
    },
    async saveLibrary() {
       if (!window.supabase) {
           localStorage.setItem('game_libraryQuestions', JSON.stringify(this.libraryQuestions));
           return;
       }
       
       const toUpdate = [];
       
       for (const q of this.libraryQuestions) {
           if (q.id) toUpdate.push(q);
       }
       
       if (toUpdate.length > 0) {
           const batchSize = 500;
           for (let i = 0; i < toUpdate.length; i += batchSize) {
               await supabaseClient.from('game_questions').upsert(toUpdate.slice(i, i + batchSize));
           }
       }
       
       const uninserted = this.libraryQuestions.filter(q => !q.id);
       if (uninserted.length > 0) {
           const batchSize = 500;
           for (let i = 0; i < uninserted.length; i += batchSize) {
               const originalBatch = uninserted.slice(i, i + batchSize);
               const batch = originalBatch.map(q => { const { id, ...rest } = q; return rest; });
               
               const { data, error } = await supabaseClient.from('game_questions').insert(batch).select();
               if (!error && data && data.length === originalBatch.length) {
                   for (let j = 0; j < data.length; j++) originalBatch[j].id = data[j].id;
               }
           }
       }
    },
    async saveExams() {
       if (!window.supabase) {
           localStorage.setItem('game_exams', JSON.stringify(this.exams));
           return;
       }
       
       const toUpdate = [];
       const toInsert = [];
       
       for (const e of this.exams) {
           if (e.id) toUpdate.push(e);
           else {
               const { id, ...rest } = e;
               toInsert.push(rest);
           }
       }
       
       if (toUpdate.length > 0) {
           await supabaseClient.from('game_exams').upsert(toUpdate);
       }
       
       if (toInsert.length > 0) {
           const originalBatch = this.exams.filter(e => !e.id);
           const { data, error } = await supabaseClient.from('game_exams').insert(toInsert).select();
           if (!error && data && data.length === originalBatch.length) {
               for (let j = 0; j < data.length; j++) originalBatch[j].id = data[j].id;
           }
       }
    },
    
    async updateUserScore() {
      if (!this.currentUser || this.currentUser.role?.toLowerCase() === 'admin') return;
      let total = 0;
      (Array.isArray(this.currentUser.history) ? this.currentUser.history : []).forEach(h => total += parseFloat(h.score || 0));
      this.currentUser.totalscore = Math.round(total * 10) / 10;
      
      const idx = this.users.findIndex(u => u.username === this.currentUser.username);
      if (idx > -1) {
        this.users[idx] = this.currentUser;
        // Direct DB update for this user to avoid concurrency issues
        if (this.currentUser.id) {
           const { error } = await supabaseClient.from('game_users').update(this.currentUser).eq('id', this.currentUser.id);
           if (error) console.error("Error updating score:", error);
        } else {
           await this.saveUsers(); // fallback
        }
      }
    }
  },

  router: {
    open(screenId) {
      if (app.game && app.game.hardTimer) clearInterval(app.game.hardTimer);
      if (app.exam && app.exam.examTimer) clearInterval(app.exam.examTimer);
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(screenId).classList.add('active');
    },
    openGameView(viewId) {
      if (app.game && app.game.hardTimer) clearInterval(app.game.hardTimer);
      if (app.exam && app.exam.examTimer) clearInterval(app.exam.examTimer);
      document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');
    },
    animateCatTo(el, callback) {
      const catWrapper = document.getElementById('map-cat-wrapper');
      if (!catWrapper) return callback();
      
      // Get target top and left from inline styles directly since they are percentage based
      // But they might be like top: 22%; left: 51%;
      catWrapper.style.top = el.style.top;
      catWrapper.style.left = el.style.left;
      
      setTimeout(() => {
         callback();
         // Reset cat to default position if user goes back
         setTimeout(() => {
            catWrapper.style.top = '75%';
            catWrapper.style.left = '50%';
         }, 500);
      }, 800);
    }
  },

  auth: {
    init() {
      document.getElementById('login-btn').onclick = () => this.login();
      document.getElementById('register-btn').onclick = () => this.register();
      document.getElementById('logout-btn').onclick = () => this.logout();
      document.getElementById('link-to-register').onclick = () => app.router.open('register-screen');
      document.getElementById('link-to-login').onclick = () => app.router.open('login-screen');
    },
    async hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },
    async login() {
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value.trim();
      
      let user = null;
      let hashedP = await this.hashPassword(p);
      
      try {
          // Fetch directly from DB
          const { data: dbUser } = await supabaseClient.from('game_users')
              .select('*')
              .or(`username.eq.${u},fullname.eq.${u}`);
              
          if (dbUser && dbUser.length > 0) {
              user = dbUser.find(x => x.password === p || x.password === hashedP);
          }
      } catch (err) {
          console.error("Supabase failed during login:", err);
      }
      
      // Ensure admin exists in DB just in case
      if (!user && u === 'admin' && p === '123') {
          user = { username: 'admin', password: '123', role: 'admin', fullname: 'Admin', history: [], totalscore: 0, lollipops: 0, classlevel: '5', approved: true };
          supabaseClient.from('game_users').insert([user]).then(({error}) => {
              if (error) console.error("Admin insert error:", error);
          });
      }
      
      if (user) {
        if (user.role?.toLowerCase() !== 'admin' && user.approved === false) {
           alert('Tài khoản của bạn đang chờ phê duyệt từ Giáo viên!');
           return;
        }
        app.data.currentUser = user;
        
        // Lazy load based on role
        if (user.role?.toLowerCase() === 'admin') {
            app.data.users = await app.data.fetchAllFromSupabase('game_users');
            app.data.users.forEach(usr => { if (!Array.isArray(usr.history)) usr.history = []; });
            app.data.libraryQuestions = await app.data.fetchAllFromSupabase('game_questions');
            app.data.quests = await app.data.fetchAllFromSupabase('game_quests');
            app.data.candyRequests = await app.data.fetchAllFromSupabase('candy_requests');
            document.getElementById('admin-station').style.display = 'flex';
            if (document.getElementById('quest-station')) document.getElementById('quest-station').style.display = 'none';
        } else {
            const clLvl = String(user.classlevel || '5').replace('Lớp ', '').trim();
            app.data.libraryQuestions = await app.data.fetchAllFromSupabase('game_questions', 'classlevel', clLvl);
            app.data.quests = await app.data.fetchAllFromSupabase('game_quests');
            app.data.userQuests = await app.data.fetchAllFromSupabase('user_quests', 'user_username', user.username);
            app.data.candyRequests = await app.data.fetchAllFromSupabase('candy_requests', 'user_username', user.username);
            app.data.userPets = await app.data.fetchAllFromSupabase('user_pets', 'user_username', user.username);
            document.getElementById('admin-station').style.display = 'none';
            if (document.getElementById('quest-station')) document.getElementById('quest-station').style.display = 'flex';
        }
        
        await app.data.updateUserScore();
        this.updateHeader();
        
        app.router.open('map-screen');
      } else {
        alert('Sai tên đăng nhập hoặc mật khẩu!');
      }
    },
    async register() {
      const fn = document.getElementById('reg-fullname').value.trim();
      const un = document.getElementById('reg-username').value.trim();
      const pw = document.getElementById('reg-password').value.trim();
      const cl = document.getElementById('reg-class').value;
      
      if (!fn || !un || !pw) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
      }
      
      // Check in DB to be absolutely sure
      const { data: existingUser } = await supabaseClient.from('game_users').select('username').eq('username', un).single();
      if (existingUser || app.data.users.find(x => x.username === un)) {
        alert('Tên đăng nhập đã tồn tại!');
        return;
      }
      
      const hashedPw = await this.hashPassword(pw);
      
      const newUser = {
        fullname: fn,
        username: un,
        password: hashedPw,
        classlevel: cl,
        role: 'student',
        approved: false,
        history: [],
        totalscore: 0,
        lollipops: 0
      };
      
      const { data, error } = await supabaseClient.from('game_users').insert([newUser]).select();
      if (error) {
          alert('Có lỗi xảy ra khi kết nối máy chủ!');
          console.error(error);
          return;
      }
      
      if (data && data[0]) {
          newUser.id = data[0].id;
      }
      
      app.data.users.push(newUser);
      alert('Đăng ký thành công!');
      app.router.open('login-screen');
    },
    logout() {
      app.data.currentUser = null;
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      app.router.open('login-screen');
    },
    updateHeader() {
      if (!app.data.currentUser) return;
      const html = `
        <strong>${app.data.sanitizeHTML(app.data.currentUser.fullname)}</strong> (${app.data.currentUser.role?.toLowerCase() === 'admin' ? 'Admin' : 'Lớp ' + app.data.currentUser.classlevel})<br>
        ${app.data.currentUser.role?.toLowerCase() !== 'admin' ? `Điểm: ${app.data.currentUser.totalscore} | Kẹo: ${app.data.currentUser.lollipops} 🍭` : ''}
      `;
      document.getElementById('player-info').innerHTML = html;
      
      const adminNotif = document.getElementById('admin-notification');
      if (adminNotif) {
          if (app.data.currentUser.role?.toLowerCase() === 'admin') {
              const pendingUsers = app.data.users ? app.data.users.filter(u => u.role?.toLowerCase() !== 'admin' && u.approved === false).length : 0;
              if (pendingUsers > 0) {
                  adminNotif.textContent = `Tin nhắn: có ${pendingUsers} hồ sơ mới cần duyệt`;
                  adminNotif.style.display = 'block';
              } else {
                  adminNotif.style.display = 'none';
              }
          } else {
              adminNotif.style.display = 'none';
          }
      }
    }
  },

  constants: {
    topics: {
      "1": {
        math: {
          hk1: ['1. Các số từ 0 đến 10', '2. Làm quen với một số hình phẳng', '3. Phép cộng, phép trừ trong phạm vi 10', '4. Làm quen với một số hình khối', '5. Ôn tập Học kì 1'],
          hk2: ['6. Các số đến 100', '7. Độ dài và Đo độ dài', '8. Phép cộng, phép trừ (không nhớ) trong phạm vi 100', '9. Thời gian. Giờ và lịch', '10. Ôn tập cuối năm']
        },
        vietnamese: {
          hk1: ['Lớp 1 tập trung hoàn toàn vào việc học Âm, Vần, Chữ Cái'],
          hk2: ['1. Tôi và các bạn', '2. Mái ấm gia đình', '3. Mái trường mến yêu', '4. Điều em cần biết', '5. Bài học từ cuộc sống', '6. Thiên nhiên kỳ thú', '7. Thế giới trong mắt em', '8. Đất nước và con người']
        }
      },
      "2": {
        math: {
          hk1: ['1. Ôn tập và bổ sung', '2. Phép cộng, phép trừ trong phạm vi 20', '3. Làm quen với khối lượng, dung tích', '4. Phép cộng, phép trừ (có nhớ) trong phạm vi 100', '5. Làm quen với hình phẳng', '6. Ngày - Giờ, Giờ - Phút, Ngày - Tháng', '7. Ôn tập Học kì 1'],
          hk2: ['8. Phép nhân, phép chia', '9. Làm quen với hình khối', '10. Các số trong phạm vi 1 000', '11. Độ dài và đơn vị đo độ dài, tiền Việt Nam', '12. Phép cộng, phép trừ trong phạm vi 1 000', '13. Làm quen với yếu tố thống kê, xác suất', '14. Ôn tập cuối năm']
        },
        vietnamese: {
          hk1: ['1. Em lớn lên từng ngày', '2. Đi học vui sao', '3. Niềm vui tuổi thơ', '4. Mái ấm gia đình'],
          hk2: ['5. Vẻ đẹp quanh em', '6. Hành tinh xanh của em', '7. Giao tiếp và kết nối', '8. Con người Việt Nam', '9. Việt Nam quê hương em']
        }
      },
      "3": {
        math: {
          hk1: ['1. Ôn tập và bổ sung', '2. Bảng nhân, bảng chia', '3. Làm quen với hình phẳng, hình khối', '4. Phép nhân, phép chia trong phạm vi 100', '5. Một số đơn vị đo độ dài, khối lượng, dung tích, nhiệt độ', '6. Phép nhân, phép chia trong phạm vi 1 000', '7. Ôn tập Học kì 1'],
          hk2: ['8. Các số đến 10 000', '9. Chu vi, diện tích một số hình phẳng', '10. Cộng, trừ, nhân, chia trong phạm vi 10 000', '11. Các số đến 100 000', '12. Cộng, trừ trong phạm vi 100 000', '13. Xem đồng hồ. Tháng - năm. Tiền Việt Nam', '14. Nhân, chia trong phạm vi 100 000', '15. Làm quen với yếu tố Thống kê, Xác suất', '16. Ôn tập cuối năm']
        },
        vietnamese: {
          hk1: ['1. Những trải nghiệm thú vị', '2. Cổng trường rộng mở', '3. Mái nhà yêu thương', '4. Cộng đồng gắn bó'],
          hk2: ['5. Những sắc màu thiên nhiên', '6. Bài học từ cuộc sống', '7. Đất nước ngàn năm', '8. Trái Đất của chúng mình']
        }
      },
      "4": {
        math: {
          hk1: ['1. Ôn tập và bổ sung', '2. Góc và đơn vị đo góc', '3. Số có nhiều chữ số', '4. Một số đơn vị đo Đại lượng', '5. Phép cộng và phép trừ', '6. Đường thẳng vuông góc. Đường thẳng song song', '7. Ôn tập Học kì 1'],
          hk2: ['8. Phép nhân và phép chia', '9. Làm quen với yếu tố Thống kê, Xác suất', '10. Phân số', '11. Phép cộng, phép trừ Phân số', '12. Phép nhân, phép chia Phân số', '13. Ôn tập cuối năm']
        },
        vietnamese: {
          hk1: ['1. Mỗi người một vẻ', '2. Trải nghiệm và khám phá', '3. Niềm vui sáng tạo', '4. Chắp cánh ước mơ'],
          hk2: ['5. Sống để yêu thương', '6. Uống nước nhớ nguồn', '7. Quê hương trong tôi', '8. Vì một thế giới bình yên']
        }
      },
      "5": {
        math: {
          hk1: ['1. Ôn tập và bổ sung', '2. Số thập phân', '3. Một số đơn vị đo diện tích', '4. Các phép tính với số thập phân', '5. Một số hình phẳng. Chu vi và Diện tích', '6. Ôn tập Học kỳ 1'],
          hk2: ['7. Tỉ số và các Bài toán liên quan', '8. Thể tích, đơn vị đo Thể tích', '9. Diện tích và Thể tích của một số hình khối', '10. Số đo Thời gian, Vận tốc. Các bài toán liên quan đến Chuyển động đều', '11. Một số yếu tố Thống kê và Xác suất', '12. Ôn tập cuối năm']
        },
        vietnamese: {
          hk1: ['1. Thế giới tuổi thơ', '2. Thiên nhiên kì thú', '3. Trên con đường học tập', '4. Nghệ thuật muôn màu'],
          hk2: ['5. Vẻ đẹp cuộc sống', '6. Hương sắc trăm miền', '7. Tiếp bước cha ông', '8. Thế giới của chúng ta']
        }
      }
    }
  },

  game: {
    state: { subject: '', topicMode: 'single', selectedTopics: [], difficulty: 'easy', count: 10, questions: [], currentIdx: 0, score: 0, selectedAns: null, historyDetails: [] },
    
    init() {
      document.querySelectorAll('.station[data-subject]').forEach(el => {
        el.onclick = () => {
          app.router.animateCatTo(el, () => {
            if (el.dataset.subject === 'exam') {
                const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
                const examAdminSelector = document.getElementById('exam-admin-class-selector');
                if (examAdminSelector) examAdminSelector.style.display = isAdmin ? 'block' : 'none';
                if (isAdmin && !app.exam.state.adminclasslevel) {
                    app.exam.state.adminclasslevel = '5';
                }
                if (isAdmin) {
                    document.querySelectorAll('#exam-admin-class-btns .btn-opt').forEach(b => {
                        b.classList.toggle('active', b.textContent.trim() === app.exam.state.adminclasslevel);
                    });
                }
                app.router.open('exam-select-screen');
            }
            else this.openConfig(el.dataset.subject);
          });
        };
      });

      // Binds for fixed stations
      const adminSt = document.getElementById('admin-station');
      if (adminSt) adminSt.onclick = () => app.router.animateCatTo(adminSt, () => app.admin.openAdmin());
      
      const treasureSt = document.getElementById('treasure-station');
      if (treasureSt) treasureSt.onclick = () => app.router.animateCatTo(treasureSt, () => app.treasure.open());
      
      const questSt = document.getElementById('quest-station');
      if (questSt) questSt.onclick = () => app.router.animateCatTo(questSt, () => app.quest.open()); // Will implement app.quest
      
      const shopSt = document.getElementById('shop-station');
      if (shopSt) shopSt.onclick = () => app.router.animateCatTo(shopSt, () => app.shop.open()); // Will implement app.shop
    },
    openConfig(subject) {
      this.state.subject = subject;
      this.state.selectedTopics = [];
      this.state.topicMode = 'single';
      
      document.getElementById('game-config-title').textContent = subject === 'math' ? 'VUI HỌC TOÁN' : 'VUI HỌC TIẾNG VIỆT';
      document.getElementById('start-adv-icon').src = subject === 'math' ? './public/torch_new.png' : './public/watering_can.png';
      
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      const adminSelector = document.getElementById('admin-class-selector');
      if (adminSelector) adminSelector.style.display = isAdmin ? 'block' : 'none';
      if (isAdmin && !this.state.adminclasslevel) {
          this.state.adminclasslevel = '5';
      }
      if (isAdmin) {
          document.querySelectorAll('#admin-class-btns .btn-opt').forEach(b => {
              b.classList.toggle('active', b.textContent.trim() === this.state.adminclasslevel);
          });
      }

      app.router.open('game-screen');
      const themeCls = subject === 'math' ? 'theme-math' : 'theme-vietnamese';
      document.getElementById('game-screen').className = 'screen active ' + themeCls;
      
      app.router.openGameView('game-config-view');
      
      document.querySelector('input[name="topicMode"][value="single"]').checked = true;
      this.renderTopics();
      
      const diffContainer = document.querySelectorAll('.config-section .diff-options')[isAdmin ? 1 : 0] || document.querySelectorAll('.diff-options')[0]; // To be safe, just select by ID if possible, but they don't have ID. Let's just use parent id if needed. Wait, let's select all and just reset the difficulty ones.
      document.querySelectorAll('.diff-options .btn-opt').forEach(b => {
          if (!b.parentElement.id.includes('admin')) {
              b.classList.remove('active');
          }
      });
      // Set 'easy' active
      const difficultyBtns = document.querySelectorAll('.config-section .diff-options:not(#admin-class-btns) .btn-opt');
      if (difficultyBtns.length > 0) difficultyBtns[0].classList.add('active');
      
      const countOpts = document.querySelectorAll('.count-options .btn-opt');
      countOpts.forEach(b => b.classList.remove('active'));
      if (countOpts.length) countOpts[0].classList.add('active');
      
      this.state.difficulty = 'easy';
      this.state.count = 10;
    },
    setAdminClass(level, btn) {
       this.state.adminclasslevel = level;
       const group = btn.parentElement;
       group.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
       btn.classList.add('active');
       this.state.selectedTopics = [];
       this.renderTopics();
    },
    toggleTopicMode() {
      this.state.topicMode = document.querySelector('input[name="topicMode"]:checked').value;
      if (this.state.topicMode === 'single') this.state.selectedTopics = [];
      this.renderTopics();
    },
    renderTopics() {
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
      clLevel = String(clLevel).replace('Lớp ', '').trim();
      
      const topicDict = app.constants.topics[clLevel] || { math: {hk1:[], hk2:[]}, vietnamese: {hk1:[], hk2:[]} };
      const topics = this.state.subject === 'math' ? topicDict.math : topicDict.vietnamese;
      
      const container = document.getElementById('topics-list');
      container.innerHTML = '';
      container.style.display = 'flex';
      container.style.gap = '20px';
      container.style.alignItems = 'flex-start';
      container.style.width = '100%';
      
      const createColumn = (title, topicList) => {
          const col = document.createElement('div');
          col.style.flex = '1';
          
          const header = document.createElement('h3');
          header.textContent = title;
          header.style.textAlign = 'center';
          header.style.color = '#fff';
          header.style.marginBottom = '15px';
          col.appendChild(header);
          
          const grid = document.createElement('div');
          grid.className = 'topics-grid';
          grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
          
          topicList.forEach(t => {
            const lbl = document.createElement('label');
            lbl.className = 'topic-card';
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
            lbl.appendChild(document.createTextNode(' ' + t));
            grid.appendChild(lbl);
          });
          
          col.appendChild(grid);
          return col;
      };
      
      container.appendChild(createColumn('Học kỳ 1', topics.hk1 || []));
      container.appendChild(createColumn('Học kỳ 2', topics.hk2 || []));
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
      
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
      clLevel = String(clLevel).replace('Lớp ', '').trim();

      const mappedSubject = this.state.subject === 'math' ? 'Toán' : 'Tiếng Việt';
      
      let pool = app.data.libraryQuestions.filter(q => {
        const qSub = String(q.subject || '').trim().toLowerCase();
        const mSub = mappedSubject.toLowerCase();
        
        const qClass = String(q.classlevel || '').trim().toLowerCase();
        const clLvl = String(clLevel).toLowerCase();
        
        const qTopic = String(q.topic || '').trim().toLowerCase();
        
        const matchSub = (qSub === mSub || qSub === this.state.subject.toLowerCase() || qSub.includes(mSub) || mSub.includes(qSub));
        const matchClass = (!qClass || qClass === clLvl || qClass === ('lớp ' + clLvl) || qClass === ('lop ' + clLvl) || qClass.includes(clLvl));
        const matchTopic = (!qTopic || this.state.selectedTopics.some(t => {
            const tNorm = String(t).toLowerCase();
            return tNorm.includes(qTopic) || qTopic.includes(tNorm);
        }));
        
        return matchSub && matchClass && matchTopic;
      });
      
      if (pool.length < this.state.count) {
        alert('Ngân hàng không đủ ' + this.state.count + ' câu hỏi, sẽ lấy tất cả câu hiện có!');
      }
      
      if (pool.length > this.state.count) {
          const byType = {};
          pool.forEach(q => {
              const t = (q.type || 'Trắc nghiệm').trim();
              if (!byType[t]) byType[t] = [];
              byType[t].push(q);
          });
          Object.values(byType).forEach(arr => arr.sort(() => 0.5 - Math.random()));
          
          let selected = [];
          const types = Object.keys(byType);
          let lastType = null;
          
          for (let i = 0; i < this.state.count; i++) {
              let availableTypes = types.filter(t => byType[t].length > 0 && t !== lastType);
              if (availableTypes.length === 0) {
                  availableTypes = types.filter(t => byType[t].length > 0);
              }
              if (availableTypes.length === 0) break;
              
              const chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
              selected.push(byType[chosenType].pop());
              lastType = chosenType;
          }
          pool = selected;
      } else {
          pool = pool.sort(() => 0.5 - Math.random());
      }
      
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
      document.getElementById('explanation-box').style.display = 'none';
      
      const user = app.data.currentUser;
      let equipped = user ? (localStorage.getItem('equipped_pet_' + user.username) || 'cat_normal.png') : 'cat_normal.png';
      document.getElementById('play-cat-img').src = './public/' + equipped;
      
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
      
      let qType = (q.type || 'Trắc nghiệm').trim();
      let opts = q.options || [];
      
      if (opts.length === 0) {
          if (qType === 'Đúng/Sai') opts = ['Đúng', 'Sai'];
          else if (qType === 'So sánh') opts = ['>', '<', '='];
          else if (qType === 'Trắc nghiệm') opts = [q.ans];
          else qType = 'Điền khuyết';
      }
      
      if (qType === 'Trắc nghiệm') {
        optContainer.className = 'options-grid multiple_choice';
        const labels = ['A', 'B', 'C', 'D'];
        opts.forEach((opt, idx) => {
          const btn = document.createElement('div');
          btn.className = 'ans-btn';
          btn.innerHTML = `<span class="ans-badge">${labels[idx] || ''}</span><span class="ans-text">${opt}</span>`;
          btn.onclick = () => {
            optContainer.querySelectorAll('.ans-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            this.state.selectedAns = opt;
            btnCheck.disabled = false;
          };
          optContainer.appendChild(btn);
        });
      } else if (qType === 'Đúng/Sai') {
        optContainer.className = 'options-grid true_false';
        opts.forEach((opt) => {
          const btn = document.createElement('div');
          const isTrue = opt.toLowerCase() === 'đúng';
          btn.className = `tf-card ${isTrue ? 'tf-true' : 'tf-false'}`;
          btn.innerHTML = `<div>${isTrue ? '✔️' : '❌'}</div><div class="ans-text">${opt}</div>`;
          btn.onclick = () => {
            optContainer.querySelectorAll('.tf-card').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            this.state.selectedAns = opt;
            btnCheck.disabled = false;
          };
          optContainer.appendChild(btn);
        });
      } else if (qType === 'So sánh') {
         optContainer.className = '';
         const slotWrapper = document.createElement('div');
         slotWrapper.style.display = 'flex';
         slotWrapper.style.justifyContent = 'center';
         const slot = document.createElement('div');
         slot.className = 'compare-slot';
         slot.textContent = '?';
         slotWrapper.appendChild(slot);
         optContainer.appendChild(slotWrapper);
         
         const controls = document.createElement('div');
         controls.className = 'compare-controls';
         ['>', '<', '='].forEach(sym => {
             const btn = document.createElement('div');
             btn.className = 'cmp-btn';
             btn.textContent = sym;
             btn.onclick = () => {
                 slot.textContent = sym;
                 slot.classList.add('filled');
                 this.state.selectedAns = sym;
                 btnCheck.disabled = false;
             };
             controls.appendChild(btn);
         });
         optContainer.appendChild(controls);
      } else if (qType === 'Kéo thả') {
          optContainer.className = '';
          let html = '';
          let numSlots = 0;
          
          if (q.q && (q.q.includes('___') || q.q.includes('...'))) {
              const parts = q.q.split(/\.\.\.|___/);
              for (let i = 0; i < parts.length; i++) {
                  html += parts[i];
                  if (i < parts.length - 1) {
                      html += `<div class="drag-slot" id="slot-${numSlots}" data-index="${numSlots}"></div>`;
                      numSlots++;
                  }
              }
          } else if (q.q && q.q.includes('|')) {
              const parts = q.q.split('|');
              html += `<div style="display:flex; flex-direction:column; gap: 15px; margin-top:10px;">`;
              for (let i = 0; i < parts.length; i++) {
                  // Text might have colon like "Nối mỗi phép tính: 18.3 + 8.2". We want to keep the text, just add a slot.
                  let label = parts[i].trim();
                  if (i === 0 && label.includes(':')) {
                      // e.g. "Nối mỗi phép tính: 18.3 + 8.2"
                      const spl = label.split(':');
                      html += `<span>${spl[0]}:</span>`;
                      label = spl.slice(1).join(':').trim();
                  }
                  html += `<div style="display:flex; align-items:center; gap:10px; font-size:1.5rem; justify-content:center;">
                             <span>${label}</span>
                             <span style="color:#fde047;">➔</span>
                             <div class="drag-slot" id="slot-${numSlots}" data-index="${numSlots}"></div>
                           </div>`;
                  numSlots++;
              }
              html += `</div>`;
          } else {
              html += (q.q || '') + '<br><br>';
              const ansArr = this.getAnsArr(q.ans);
              html += `<div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">`;
              for(let i=0; i<ansArr.length; i++) {
                  html += `<div class="drag-slot" id="slot-${numSlots}" data-index="${numSlots}"></div>`;
                  numSlots++;
              }
              html += `</div>`;
          }
          
          if (q.imageUrl) html += `<br><img src="${q.imageUrl}" style="max-height:200px; margin-top:10px;">`;
          document.getElementById('game-question-container').innerHTML = html;
          
          const inventory = document.createElement('div');
          inventory.className = 'drag-inventory';
          const filledAnswers = new Array(numSlots).fill(null);
          
          opts.forEach((opt, idx) => {
              const item = document.createElement('div');
              item.className = 'drag-item';
              item.draggable = true;
              item.textContent = opt;
              item.id = `drag-item-${idx}`;
              item.ondragstart = (e) => {
                  e.dataTransfer.setData('text/plain', opt);
                  e.dataTransfer.setData('source_id', item.id);
                  setTimeout(() => item.style.opacity = '0.5', 0);
              };
              item.ondragend = () => item.style.opacity = '1';
              
              item.onclick = () => {
                  if (item.style.visibility === 'hidden') return;
                  const firstEmptySlot = Array.from(document.querySelectorAll('.drag-slot')).find(s => !s.classList.contains('filled'));
                  if (firstEmptySlot) {
                      firstEmptySlot.textContent = opt;
                      firstEmptySlot.dataset.sourceId = item.id;
                      firstEmptySlot.classList.add('filled');
                      item.style.visibility = 'hidden';
                      filledAnswers[firstEmptySlot.dataset.index] = opt;
                      this.state.selectedAns = filledAnswers.join(', ');
                      if (filledAnswers.every(ans => ans !== null)) btnCheck.disabled = false;
                  }
              };
              inventory.appendChild(item);
          });
          optContainer.appendChild(inventory);
          
          document.querySelectorAll('.drag-slot').forEach((slot) => {
              slot.onclick = () => {
                  if (slot.classList.contains('filled')) {
                      const srcId = slot.dataset.sourceId;
                      if (srcId) {
                          const srcItem = document.getElementById(srcId);
                          if (srcItem) srcItem.style.visibility = 'visible';
                      }
                      slot.textContent = '';
                      slot.classList.remove('filled');
                      delete slot.dataset.sourceId;
                      filledAnswers[slot.dataset.index] = null;
                      btnCheck.disabled = true;
                  }
              };
              
              slot.ondragenter = (e) => { e.preventDefault(); };
              slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('drag-over'); };
              slot.ondragleave = () => slot.classList.remove('drag-over');
              slot.ondrop = (e) => {
                  e.preventDefault();
                  slot.classList.remove('drag-over');
                  
                  if (slot.classList.contains('filled') && slot.dataset.sourceId) {
                      const oldItem = document.getElementById(slot.dataset.sourceId);
                      if (oldItem) oldItem.style.visibility = 'visible';
                  }
                  
                  const text = e.dataTransfer.getData('text/plain');
                  const srcId = e.dataTransfer.getData('source_id');
                  slot.textContent = text;
                  slot.dataset.sourceId = srcId;
                  slot.classList.add('filled');
                  filledAnswers[slot.dataset.index] = text;
                  const srcItem = document.getElementById(srcId);
                  if (srcItem) srcItem.style.visibility = 'hidden';
                  this.state.selectedAns = filledAnswers.join(', ');
                  if (filledAnswers.every(ans => ans !== null)) btnCheck.disabled = false;
              };
          });
      } else if (qType === 'Chuỗi quy luật') {
          optContainer.className = '';
          const parts = (q.q || '').split(/\.\.\.|___/);
          
          const shapes = ['shape-train', 'shape-light', 'shape-book', 'shape-flower', 'shape-apple', 'shape-balloon', 'shape-square'];
          const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
          
          let html = `<div class="train-container ${randomShape}">`;
          const numSlots = parts.length - 1;
          this.state.seqAnswers = new Array(numSlots).fill('');
          this.state.focusedSeqSlot = 0;
          
          for (let i = 0; i < parts.length; i++) {
              const text = parts[i].trim();
              if (text) html += `<div class="train-node">${text}</div>`;
              if (i < parts.length - 1) {
                  if (text) html += `<div class="train-arrow">➔</div>`;
                  html += `<div class="train-node train-slot seq-slot" data-index="${i}">?</div>`;
                  if (i < parts.length - 2) html += `<div class="train-arrow">➔</div>`;
              }
          }
          html += '</div>';
          document.getElementById('game-question-container').innerHTML = q.q.includes('___') || q.q.includes('...') ? html : (q.q + html);
          
          const slots = document.querySelectorAll('.seq-slot');
          const updateFocus = () => {
              slots.forEach((s, idx) => {
                  if (idx === this.state.focusedSeqSlot) {
                      s.style.animation = 'pulse-border 2s infinite';
                      s.style.boxShadow = '0 0 15px rgba(253, 224, 71, 0.8)';
                  } else {
                      s.style.animation = 'none';
                      s.style.boxShadow = 'none';
                  }
              });
          };
          
          slots.forEach((slot, idx) => {
              slot.onclick = () => {
                  this.state.focusedSeqSlot = idx;
                  updateFocus();
              };
          });
          
          if (slots.length > 0) updateFocus();
          
          const numpad = document.createElement('div');
          numpad.className = 'numpad';
          const buttons = ['7','8','9','4','5','6','1','2','3','Xóa','0'];
          buttons.forEach(btnText => {
              const btn = document.createElement('button');
              btn.className = 'num-btn';
              if (btnText === '0') btn.classList.add('zero');
              if (btnText === 'Xóa') btn.classList.add('del');
              btn.textContent = btnText;
              btn.onclick = () => {
                  const idx = this.state.focusedSeqSlot;
                  if (idx < 0 || idx >= numSlots) return;
                  
                  let currentVal = this.state.seqAnswers[idx];
                  if (btnText === 'Xóa') {
                      currentVal = currentVal.slice(0, -1);
                  } else if (currentVal.length < 5) {
                      currentVal += btnText;
                  }
                  
                  this.state.seqAnswers[idx] = currentVal;
                  
                  const slot = slots[idx];
                  if (slot) {
                      slot.textContent = currentVal || '?';
                      if (currentVal) {
                          slot.style.borderColor = '#4ade80';
                          slot.style.color = '#4ade80';
                      } else {
                          slot.style.borderColor = '#fde047';
                          slot.style.color = '#fde047';
                      }
                  }
                  
                  this.state.selectedAns = this.state.seqAnswers.join(', ');
                  btnCheck.disabled = !this.state.seqAnswers.every(x => x.length > 0);
              };
              numpad.appendChild(btn);
          });
          optContainer.appendChild(numpad);
      } else if (qType === 'Điền khuyết') {
          optContainer.className = '';
          const parts = (q.q || '').split(/\.\.\.|___/);
          let inputs = [];
          
          if (parts.length > 1) {
            let html = '';
            for (let i = 0; i < parts.length; i++) {
               html += parts[i];
               if (i < parts.length - 1) {
                  html += `<input type="text" class="magic-input" id="fill-input-${i}" autocomplete="off">`;
               }
            }
            if (q.imageUrl) html += `<br><img src="${q.imageUrl}" style="max-height:200px; margin-top:10px;">`;
            document.getElementById('game-question-container').innerHTML = html;
            
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
            const inp = document.createElement('input');
            inp.className = 'magic-input';
            inp.style.width = '200px';
            inp.autocomplete = 'off';
            inp.oninput = () => { this.state.selectedAns = inp.value; btnCheck.disabled = !inp.value.trim(); };
            optContainer.appendChild(inp);
          }
      }
      
      const timerDisplay = document.getElementById('hard-timer-display');
      if (this.state.difficulty === 'hard') {
          timerDisplay.style.display = 'inline';
          let timeLeft = app.data.settings.hardTimeLimit || 10;
          timerDisplay.textContent = `(00:${timeLeft.toString().padStart(2, '0')})`;
          
          if (this.hardTimer) clearInterval(this.hardTimer);
          this.hardTimer = setInterval(() => {
              timeLeft--;
              timerDisplay.textContent = `(00:${timeLeft.toString().padStart(2, '0')})`;
              
              if (timeLeft <= 3 && timeLeft > 0) {
                  app.playSound('tick');
              }
              
              if (timeLeft <= 0) {
                  clearInterval(this.hardTimer);
                  this.submitAnswer(true);
              }
          }, 1000);
      } else {
          timerDisplay.style.display = 'none';
          if (this.hardTimer) clearInterval(this.hardTimer);
      }
    },
    submitAnswer(isTimeout = false) {
      if (this.hardTimer) clearInterval(this.hardTimer);
      const q = this.state.questions[this.state.currentIdx];
      let isCorrect = false;
      let qType = q.type || 'Trắc nghiệm';
      let opts = q.options || [];
      
      if (opts.length === 0) {
          if (qType !== 'Đúng/Sai' && qType !== 'So sánh' && qType !== 'Trắc nghiệm') {
              qType = 'Điền khuyết';
          }
      }
      
      if (qType === 'Điền khuyết') {
         const ansArr = this.getAnsArr(q.ans);
         const selectedArr = this.getAnsArr(this.state.selectedAns);
         isCorrect = selectedArr.every((val, i) => val.replace(/\s+/g, ' ').trim().toLowerCase() === (ansArr[i] || '').toString().replace(/\s+/g, ' ').trim().toLowerCase());
         const parts = (q.q || '').split(/\.\.\.|___/);
         if(parts.length > 1) {
            for(let i = 0; i < parts.length - 1; i++) {
               const inp = document.getElementById(`fill-input-${i}`);
               if(inp) {
                  if((inp.value.replace(/\s+/g, ' ').trim().toLowerCase()) === (ansArr[i] || '').toString().replace(/\s+/g, ' ').trim().toLowerCase()) {
                     inp.classList.add('correct');
                  } else {
                     inp.classList.add('wrong');
                  }
               }
            }
         } else {
            const inp = document.querySelector('.fill-input');
            if(inp) {
               if(isCorrect) inp.classList.add('correct');
               else inp.classList.add('wrong');
            }
         }
         
         if (!isCorrect) {
             const optContainer = document.getElementById('game-options-container');
             const corr = document.createElement('div');
             corr.className = 'fill-input correct';
             corr.style.marginTop = '20px';
             corr.style.pointerEvents = 'none';
             corr.style.width = 'auto';
             corr.style.display = 'inline-block';
             corr.style.fontSize = '1.5rem'; corr.style.whiteSpace = 'nowrap'; corr.style.padding = '5px 15px'; corr.style.backgroundColor = 'rgba(255,255,255,0.95)'; corr.style.borderRadius = '20px'; corr.style.border = '2px solid #4ade80'; corr.style.color = '#16a34a'; corr.style.display = 'inline-block'; corr.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
             corr.innerHTML = `✅ Đáp án đúng: <b>${q.ans}</b>`;
             optContainer.appendChild(corr);
         }
      } else if (qType === 'Trắc nghiệm') {
         isCorrect = this.state.selectedAns === q.ans;
         const optContainer = document.getElementById('game-options-container');
         optContainer.querySelectorAll('.ans-btn').forEach(btn => {
             const text = btn.querySelector('.ans-text').textContent;
             if (text === q.ans) {
                 btn.classList.add('correct');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = '✔️';
                 btn.appendChild(icon);
             } else if (btn.classList.contains('selected')) {
                 btn.classList.add('wrong');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = '❌';
                 btn.appendChild(icon);
             }
         });
      } else if (qType === 'Đúng/Sai') {
         isCorrect = this.state.selectedAns === q.ans;
         const optContainer = document.getElementById('game-options-container');
         optContainer.querySelectorAll('.tf-card').forEach(btn => {
             const text = btn.querySelector('.ans-text').textContent;
             if (text === q.ans) {
                 btn.classList.add('correct-fill');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = '✔️';
                 btn.appendChild(icon);
             } else if (btn.classList.contains('selected')) {
                 btn.classList.add('wrong-fill');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = '❌';
                 btn.appendChild(icon);
             }
         });
      } else if (qType === 'So sánh') {
         isCorrect = this.state.selectedAns === q.ans;
         const slot = document.querySelector('.compare-slot');
         if (slot) {
             slot.style.position = 'relative';
             if (isCorrect) {
                 slot.style.background = 'linear-gradient(180deg, #4ade80, #16a34a)';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = '✔️';
                 slot.appendChild(icon);
             } else {
                 slot.style.background = 'linear-gradient(180deg, #f87171, #dc2626)';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = '❌';
                 slot.appendChild(icon);
                 const btns = document.querySelectorAll('.cmp-btn');
                 btns.forEach(b => {
                     if (b.childNodes[0].textContent.trim() === q.ans) {
                         b.style.background = 'linear-gradient(180deg, #4ade80, #16a34a)';
                         b.style.color = 'white';
                         b.style.borderColor = '#22c55e';
                         const correctIcon = document.createElement('div');
                         correctIcon.className = 'result-icon icon-v';
                         correctIcon.textContent = '✔️';
                         b.style.position = 'relative';
                         b.appendChild(correctIcon);
                     }
                 });
             }
         }
      } else if (qType === 'Kéo thả') {
         const ansArr = this.getAnsArr(q.ans);
         const selectedArr = this.getAnsArr(this.state.selectedAns);
         isCorrect = selectedArr.every((val, i) => val === ansArr[i]);
         const slots = document.querySelectorAll('.drag-slot');
         slots.forEach((slot, i) => {
             slot.style.position = 'relative';
             if (slot.textContent === ansArr[i]) {
                 slot.style.borderColor = '#4ade80';
                 slot.style.backgroundColor = '#dcfce7';
                 slot.style.color = '#16a34a';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = '✔️';
                 slot.appendChild(icon);
             } else {
                 slot.style.borderColor = '#f87171';
                 slot.style.backgroundColor = '#fee2e2';
                 slot.style.color = '#dc2626';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = '❌';
                 slot.appendChild(icon);
             }
         });
         
         if (!isCorrect) {
             const optContainer = document.getElementById('game-options-container');
             const corr = document.createElement('div');
             corr.className = 'fill-input correct';
             corr.style.marginTop = '20px';
             corr.style.pointerEvents = 'none';
             corr.style.width = 'auto';
             corr.style.display = 'inline-block';
             corr.style.fontSize = '1.5rem'; corr.style.whiteSpace = 'nowrap'; corr.style.padding = '5px 15px'; corr.style.backgroundColor = 'rgba(255,255,255,0.95)'; corr.style.borderRadius = '20px'; corr.style.border = '2px solid #4ade80'; corr.style.color = '#16a34a'; corr.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
             corr.innerHTML = `✅ Đáp án đúng: <b>${q.ans}</b>`;
             optContainer.appendChild(corr);
         }
      } else if (qType === 'Chuỗi quy luật') {
         const ansArr = this.getAnsArr(q.ans);
         const selectedArr = this.getAnsArr(this.state.selectedAns);
         isCorrect = selectedArr.every((val, i) => val === ansArr[i]);
         
         const slots = document.querySelectorAll('.seq-slot');
         slots.forEach((slot, i) => {
             slot.style.position = 'relative';
             if (slot.textContent === ansArr[i]) {
                 slot.style.borderColor = '#4ade80';
                 slot.style.background = '#dcfce7';
                 slot.style.color = '#16a34a';
                 slot.style.textShadow = 'none';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = '✔️';
                 slot.appendChild(icon);
             } else {
                 slot.style.borderColor = '#f87171';
                 slot.style.background = '#fee2e2';
                 slot.style.color = '#dc2626';
                 slot.style.textShadow = 'none';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = '❌';
                 slot.appendChild(icon);
             }
         });
         
         if (!isCorrect) {
             const optContainer = document.getElementById('game-options-container');
             const corr = document.createElement('div');
             corr.className = 'fill-input correct';
             corr.style.marginTop = '20px';
             corr.style.pointerEvents = 'none';
             corr.style.width = 'auto';
             corr.style.display = 'inline-block';
             corr.style.fontSize = '1.5rem'; corr.style.whiteSpace = 'nowrap'; corr.style.padding = '5px 15px'; corr.style.backgroundColor = 'rgba(255,255,255,0.95)'; corr.style.borderRadius = '20px'; corr.style.border = '2px solid #4ade80'; corr.style.color = '#16a34a'; corr.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
             corr.innerHTML = `✅ Đáp án đúng: <b>${q.ans}</b>`;
             optContainer.appendChild(corr);
         }
      }
      
      const bubble = document.getElementById('cat-speech-bubble');
      bubble.style.display = 'flex';
      if (isCorrect) {
        if (!window.confetti) {
            app.utils.loadScript('https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js', 'confetti').then(() => {
                if (window.confetti) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            });
        } else {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
        app.playSound('correct');
        this.state.score += 10 / this.state.questions.length;
        
        const user = app.data.currentUser;
        let basePet = 'cat';
        if (user) {
            let equipped = localStorage.getItem('equipped_pet_' + user.username) || 'cat_normal.png';
            basePet = equipped.split('.')[0];
            if (basePet === 'cat_normal') basePet = 'cat';
        }
        document.getElementById('play-cat-img').src = `./public/${basePet}_happy.png`;
        bubble.innerHTML = `<span style="color:#16a34a;">Hoan hô!<br>Bạn giỏi quá!</span>`;
      } else {
        app.playSound('wrong');
        
        const user = app.data.currentUser;
        let basePet = 'cat';
        if (user) {
            let equipped = localStorage.getItem('equipped_pet_' + user.username) || 'cat_normal.png';
            basePet = equipped.split('.')[0];
            if (basePet === 'cat_normal') basePet = 'cat';
        }
        document.getElementById('play-cat-img').src = `./public/${basePet}_sad.png`;
        bubble.innerHTML = `<span style="color:#dc2626;">Tiếc quá!<br>Bạn sai rồi!</span>`;
      }
      
      const explanation = q.explanation || q.hint;
      const explBox = document.getElementById('explanation-box');
      if (explanation) {
          explBox.style.display = 'block';
          explBox.innerHTML = `🌟 <b>Lời giải:</b><br>${explanation}`;
      } else {
          explBox.style.display = 'none';
      }
      
      this.state.historyDetails.push({ q: q.q, selected: this.state.selectedAns, correct: q.ans, isCorrect });
      
      document.getElementById('game-score').textContent = Math.round(this.state.score * 10) / 10;
      
      const btnCheck = document.getElementById('submit-ans-btn');
      
      const isLast = this.state.currentIdx === this.state.questions.length - 1;
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      document.getElementById('submit-ans-text').textContent = isLast ? (isAdmin ? 'Kết thúc' : 'Kết quả') : 'Tiếp tục';
      
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
        msg = 'Bạn xứng đáng nhận được phần thưởng này';
        giveLollipop = true;
      } else {
        msg = 'Cố gắng thêm nữa bạn nhé';
      }
      
      let title = this.state.examName || (this.state.subject === 'math' ? 'Toán' : 'Tiếng Việt');
      this.recordHistory(title, finalScore, giveLollipop);
      
      // Update quests progress
      if (app.quest && typeof app.quest.updateProgress === 'function') {
          app.quest.updateProgress(this.state.subject, finalScore);
      }
      
      document.getElementById('result-score').textContent = finalScore;
      document.getElementById('result-msg').textContent = msg;
      
      const chest = document.getElementById('bonus-chest-img');
      chest.style.display = giveLollipop ? 'block' : 'none';
      chest.src = './public/lollipop.png';
      chest.onclick = () => this.claimBonus();
      
      const detailsBox = document.getElementById('result-details');
      const htmlString = this.state.historyDetails.map((d, i) => `
        <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.2);">
          <b>${i+1}.</b> ${app.data.sanitizeHTML(d.q)} <br>
          Bạn chọn: <span style="color:${d.isCorrect ? '#4ade80' : '#f87171'}">${d.isCorrect ? '✔' : '✘'} ${app.data.sanitizeHTML(d.selected || 'Bỏ trống')}</span> <br>
          ${!d.isCorrect ? `<span style="color:#4ade80">Đáp án: ${app.data.sanitizeHTML(d.correct)}</span>` : ''}
        </div>
      `).join('');
      detailsBox.innerHTML = htmlString;
      
      document.getElementById('result-modal').classList.add('active');
    },
    async recordHistory(title, score, lollipop) {
      if (!app.data.currentUser || app.data.currentUser.role?.toLowerCase() === 'admin') return;
      
      let diffMap = { 'easy': 'Dễ', 'hard': 'Khó' };
      let diff = this.state.examName ? 'Đề thi' : (diffMap[this.state.difficulty] || 'Dễ');
      let top = this.state.examName ? 'Tổng hợp' : ((this.state.selectedTopics && this.state.selectedTopics.length) ? this.state.selectedTopics.join(', ') : 'Tất cả');
      let qCount = this.state.questions ? this.state.questions.length : (this.state.historyDetails ? this.state.historyDetails.length : 10);
      
      let d = new Date();
      let dStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ' ' + d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth()+1).toString().padStart(2, '0') + '/' + d.getFullYear();

      if (!Array.isArray(app.data.currentUser.history)) app.data.currentUser.history = []; app.data.currentUser.history.push({
        date: dStr,
        title: title,
        topic: top,
        difficulty: diff,
        questionCount: qCount,
        score: score,
        details: this.state.historyDetails
      });
      if (lollipop) app.data.currentUser.lollipops = (app.data.currentUser.lollipops || 0) + 1;
      await app.data.updateUserScore();
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

  exam: {
    filters: { subject: '', period: '' },
    state: { questions: [], name: '', historyDetails: [], score: 0, adminclasslevel: '5' },
    
    setAdminClass(level, btn) {
       this.state.adminclasslevel = level;
       const group = btn.parentElement;
       group.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
       btn.classList.add('active');
    },
    
    setFilter(key, val, el) {
      this.filters[key] = val;
      const group = el.parentElement;
      if (group) {
        group.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
        group.querySelectorAll('.subject-box').forEach(b => b.classList.remove('active'));
      }
      el.classList.add('active');
    },
    
    start() {
      if (!this.filters.subject || !this.filters.period) {
        return alert('Vui lòng chọn môn học và thời gian!');
      }
      
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
      clLevel = String(clLevel).replace('Lớp ', '').trim();
      
      const mappedSubject = this.filters.subject === 'math' ? 'Toán' : 'Tiếng Việt';

      const filtered = app.data.exams.filter(e => {
          const eSub = String(e.subject||'').trim().toLowerCase();
          const eClass = String(e.classlevel||'').trim().toLowerCase().replace('lớp ', '');
          const ePer = String(e.period||'').trim().toLowerCase();
          return (eSub === mappedSubject.toLowerCase() || eSub.includes(mappedSubject.toLowerCase())) &&
                 eClass === clLevel &&
                 ePer === this.filters.period.toLowerCase();
      });
      if (filtered.length === 0) return alert('Không tìm thấy đề kiểm tra phù hợp trong Kho Đề Kiểm tra.');
      
      const exam = filtered[0];
      
      const timeLimitMinutes = app.data.settings.examTimeLimit || 30;
      if (!confirm(`Bạn có thời gian ${timeLimitMinutes} phút để làm bài kiểm tra này.\n\nBấm OK để bắt đầu tính giờ, hoặc Cancel để hủy bỏ.`)) {
          return;
      }
      
      this.state.questions = exam.questions || [];
      this.state.name = exam.name;
      this.state.historyDetails = [];
      this.state.score = 0;
      
      document.getElementById('exam-title').textContent = exam.name;
      document.getElementById('exam-student-name').textContent = app.data.currentUser ? app.data.currentUser.fullname : 'Khách';
      
      const container = document.getElementById('exam-questions-container');
      container.innerHTML = '';
      
      this.state.questions.forEach((q, idx) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'exam-q-block';
        qBlock.innerHTML = `<div class="exam-q-text">Câu ${idx + 1} (${q.type||'Trắc nghiệm'}): ${q.q}</div>`;
        if (q.imageUrl) qBlock.innerHTML += `<img src="${q.imageUrl}" style="max-height:150px; margin-bottom:10px;"><br>`;
        
        const optsContainer = document.createElement('div');
        optsContainer.className = 'exam-options';
        
        if (q.type === 'Trắc nghiệm' || q.type === 'Đúng/Sai' || q.type === 'So sánh' || q.type === 'Kéo thả' || !q.type) {
          const opts = q.options || [];
          opts.forEach(opt => {
            const lbl = document.createElement('label');
            lbl.className = 'exam-opt-label';
            lbl.innerHTML = `<input type="radio" name="exam_q_${idx}" value="${opt}"> ${opt}`;
            optsContainer.appendChild(lbl);
          });
        } else if (q.type === 'Điền khuyết' || q.type === 'Chuỗi Quy luật') {
          optsContainer.innerHTML = `<input type="text" class="fill-input" name="exam_q_${idx}" style="width:100%; max-width:400px;" placeholder="Nhập câu trả lời...">`;
        }
        
        qBlock.appendChild(optsContainer);
        container.appendChild(qBlock);
      });
      
      app.router.open('exam-play-screen');
      
      const timerDisplay = document.getElementById('exam-timer-display');
      timerDisplay.style.display = 'inline';
      let timeLeft = timeLimitMinutes * 60;
      
      const formatTime = (seconds) => {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return `(${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')})`;
      };
      
      timerDisplay.textContent = formatTime(timeLeft);
      if (this.examTimer) clearInterval(this.examTimer);
      
      this.examTimer = setInterval(() => {
          timeLeft--;
          timerDisplay.textContent = formatTime(timeLeft);
          if (timeLeft <= 0) {
              clearInterval(this.examTimer);
              alert('Hết giờ! Hệ thống sẽ tự động nộp bài.');
              this.submit(true);
          }
      }, 1000);
    },
    
    confirmExit() {
      if (confirm('Bạn chưa nộp bài, thoát giữa chừng sẽ mất kết quả!')) {
        if (this.examTimer) clearInterval(this.examTimer);
        app.router.open('map-screen');
      }
    },

    submit(isTimeout = false) {
      if (!isTimeout && !confirm('Bạn có chắc chắn muốn nộp bài?')) return;
      if (this.examTimer) clearInterval(this.examTimer);
      
      let totalPts = 0;
      const ptsPerQ = 10 / (this.state.questions.length || 1);
      
      this.state.questions.forEach((q, idx) => {
        let isCorrect = false;
        let selected = '';
        
        if (q.type === 'Trắc nghiệm' || q.type === 'Đúng/Sai' || q.type === 'So sánh' || q.type === 'Kéo thả' || !q.type) {
           const checked = document.querySelector(`input[name="exam_q_${idx}"]:checked`);
           if (checked) {
              selected = checked.value;
              isCorrect = (selected === q.ans);
           }
        } else if (q.type === 'Điền khuyết' || q.type === 'Chuỗi Quy luật') {
           const inp = document.querySelector(`input[name="exam_q_${idx}"]`);
           if (inp) {
              selected = inp.value.replace(/\s+/g, ' ').trim();
              isCorrect = (selected.toLowerCase() === (q.ans||'').toString().replace(/\s+/g, ' ').trim().toLowerCase());
           }
        }
        
        if (isCorrect) totalPts += ptsPerQ;
        this.state.historyDetails.push({ q: q.q, selected, correct: q.ans, isCorrect });
      });
      
      this.state.score = Math.round(totalPts * 10) / 10;
      app.game.state.score = this.state.score;
      app.game.state.historyDetails = this.state.historyDetails;
      app.game.state.questions = this.state.questions;
      app.game.state.subject = this.filters.subject;
      app.game.state.examName = this.state.name;
      
      app.game.finishPlay();
    }
  },

  ui: {
    renderTabs(tabData, currentTabId, onClickFnString) {
      let html = '';
      tabData.forEach(t => {
        const activeCls = t.id === currentTabId ? 'active' : '';
        html += `<button class="tab-btn ${activeCls}" onclick="${onClickFnString}('${t.id}')">${t.label}</button>`;
      });
      document.getElementById('admin-tabs').innerHTML = html;
      document.getElementById('admin-tabs').style.display = 'flex';
    },
    renderTable(cols, data, rowRenderer, emptyMsg = "Không có dữ liệu") {
      if (!data || data.length === 0) return `<p style="text-align:center; padding: 20px;">${emptyMsg}</p>`;
      
      let html = `<table class="data-table"><thead><tr>`;
      cols.forEach(c => {
         html += `<th>${c.label}</th>`;
      });
      html += `</tr><tr>`;
      cols.forEach((c, idx) => {
         if (c.filterable) {
            html += `<th><input type="text" class="filter-input" data-col="${idx}" placeholder="Tìm kiếm..." onkeyup="app.ui.filterTable(this)"></th>`;
         } else {
            html += `<th></th>`;
         }
      });
      html += `</tr></thead><tbody>`;
      data.forEach((row, i) => {
         html += rowRenderer(row, i);
      });
      html += `</tbody></table>`;
      return html;
    },
    filterTable(inputEl) {
        const table = inputEl.closest('table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        // Calculate all filters
        const filterInputs = table.querySelectorAll('.filter-input');
        const filters = [];
        filterInputs.forEach(inp => {
            if (inp.value.trim() !== '') {
                filters.push({ col: parseInt(inp.getAttribute('data-col')), val: inp.value.trim().toLowerCase() });
            }
        });
        
        let visibleCount = 0;
        rows.forEach(r => {
            let match = true;
            for (let f of filters) {
                const cell = r.children[f.col];
                if (!cell || !cell.textContent.toLowerCase().includes(f.val)) {
                    match = false;
                    break;
                }
            }
            if (match) {
               r.style.display = '';
               visibleCount++;
            } else {
               r.style.display = 'none';
            }
        });

        if (table.closest('#admin-q-subarea')) {
            const ind = document.getElementById('q-count-indicator');
            if (ind) {
                if (filters.length === 0) ind.textContent = `Tổng: ${rows.length} câu`;
                else ind.textContent = `Lọc: ${visibleCount}/${rows.length} câu`;
            }
        } else if (table.closest('#admin-e-subarea')) {
            const ind = document.getElementById('e-count-indicator');
            if (ind) {
                if (filters.length === 0) ind.textContent = `Tổng: ${rows.length} đề`;
                else ind.textContent = `Lọc: ${visibleCount}/${rows.length} đề`;
            }
        }
    },
    showHistoryDetails(btn) {
      const recordStr = decodeURIComponent(btn.getAttribute('data-record'));
      const record = JSON.parse(recordStr);
      let html = `<div style="text-align:left;">
        <h3 style="margin-bottom: 15px;">Chi tiết: ${record.title}</h3>
        <p><strong>Ngày làm:</strong> ${record.date} | <strong>Điểm:</strong> ${record.score}</p>
        <hr style="border-color: rgba(255,255,255,0.2); margin: 15px 0;">
        <div class="scroll-box" style="max-height: 400px; padding-right: 10px;">
      `;
      if (record.details && record.details.length > 0) {
        record.details.forEach((d, i) => {
           const isOk = d.isCorrect;
           const color = isOk ? '#4ade80' : '#f87171';
           html += `<div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; border-left: 5px solid ${color};">
              <p style="margin-bottom: 5px;"><strong>Câu ${i+1}:</strong> ${d.q}</p>
              <p style="margin-bottom: 5px; color: #ccc;">Đã chọn: <span style="color:${color}">${d.userAns}</span></p>
              ${!isOk ? `<p style="margin-bottom: 0; color: #4ade80;">Đáp án đúng: ${d.correctAns}</p>` : ''}
           </div>`;
        });
      } else {
        html += `<p>Không có dữ liệu chi tiết cho bài làm này.</p>`;
      }
      html += `</div></div>`;
      
      const box = document.getElementById('treasure-content-area');
      box.innerHTML = html + `<br><button class="btn-primary" onclick="app.treasure.switchTab('history')">Quay lại</button>`;
    },
    async exportToExcel(dataArray, filename) {
        if (!window.XLSX) {
            alert("Đang tải thư viện Excel, vui lòng chờ...");
            const loaded = await app.utils.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
            if (!loaded) return alert("Thư viện Excel chưa được tải! Kiểm tra lại kết nối mạng.");
        }
        const ws = XLSX.utils.json_to_sheet(dataArray);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, filename);
    },
    async importFromExcel(file, callback) {
        if (!window.XLSX) {
            alert("Đang tải thư viện Excel, vui lòng chờ...");
            const loaded = await app.utils.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
            if (!loaded) return alert("Thư viện Excel chưa được tải! Kiểm tra lại kết nối mạng.");
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, {type: 'array'});
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(ws, {raw: false});
            callback(json);
        };
        reader.readAsArrayBuffer(file);
    }
  },

  admin: {
    updateTopicDropdown() {
       const subEl = document.getElementById('add-q-sub');
       if (!subEl) return;
       const sub = subEl.value;
       
       const clsEl = document.getElementById('add-q-class');
       const clsNum = clsEl ? clsEl.value.replace('Lớp ', '').trim() : '5';
       
       const topicEl = document.getElementById('add-q-topic');
       const topicDict = app.constants.topics[clsNum] || { math: {hk1:[], hk2:[]}, vietnamese: {hk1:[], hk2:[]} };
       const topicsObj = sub === 'Toán' ? topicDict.math : (sub === 'Tiếng Việt' ? topicDict.vietnamese : {hk1:[], hk2:[]});
       const topics = [...(topicsObj.hk1 || []), ...(topicsObj.hk2 || [])];
       
       const selected = topicEl.getAttribute('data-selected');
       topicEl.innerHTML = topics.map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`).join('');
    },
    updateExamTopics() {
       const subEl = document.getElementById('add-e-sub');
       const clsEl = document.getElementById('add-e-class');
       if (!subEl) return;
       const sub = subEl.value;
       const clsNum = clsEl ? clsEl.value.replace('Lớp ', '').trim() : '5';
       
       const topicDict = app.constants.topics[clsNum] || { math: {hk1:[], hk2:[]}, vietnamese: {hk1:[], hk2:[]} };
       const topicsObj = sub === 'Toán' ? topicDict.math : (sub === 'Tiếng Việt' ? topicDict.vietnamese : {hk1:[], hk2:[]});
       const topics = [...(topicsObj.hk1 || []), ...(topicsObj.hk2 || [])];
       
       let i = 0;
       while (true) {
           const topicEl = document.getElementById(`add-e-q-topic-${i}`);
           if (!topicEl) break;
           const selected = topicEl.getAttribute('data-selected');
           topicEl.innerHTML = topics.map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`).join('');
           i++;
       }
    },
    toggleExamOptionsWrapper(idx) {
        const typeEl = document.getElementById(`add-e-q-type-${idx}`);
        const wrapper = document.getElementById(`add-e-q-opts-wrapper-${idx}`);
        if (typeEl && wrapper) {
            const val = typeEl.value;
            wrapper.style.display = (val === 'Trắc nghiệm' || val === 'Kéo thả') ? 'block' : 'none';
        }
    },
    openAdmin() {
      const modal = document.getElementById('treasure-modal');
      modal.style.display = 'flex';
      modal.classList.add('active');
      document.getElementById('treasure-title').textContent = 'Cài Đặt Hệ Thống';
      this.switchTab('players');
    },
    switchTab(tab) {
      const tabs = [
        { id: 'players', label: 'Quản Lý Học Sinh' },
        { id: 'settings', label: 'Điều chỉnh' },
        { id: 'questions', label: 'Kho Câu Hỏi' },
        { id: 'exams', label: 'Kho Đề Kiểm tra' },
        { id: 'quests', label: 'Quản lý Nhiệm vụ' }
      ];
      app.ui.renderTabs(tabs, tab, 'app.admin.switchTab');
      
      const box = document.getElementById('treasure-content-area');
      if (tab === 'questions') this.renderQuestions(box);
      else if (tab === 'exams') this.renderExams(box);
      else if (tab === 'players') this.renderPlayers(box);
      else if (tab === 'settings') this.renderSettings(box);
      else if (tab === 'quests') this.renderQuests(box);
    },
    renderQuests(box) {
      let html = `<div style="margin-bottom: 20px; text-align: right;">
          <button class="btn-success" onclick="app.admin.showAddQuestForm()">+ Tạo Nhiệm vụ Mới</button>
      </div>`;
      
      const cols = [
          { label: 'Tên NV' },
          { label: 'Môn/Điểm' },
          { label: 'Số lượt' },
          { label: 'Thưởng' },
          { label: 'Chỉ định' },
          { label: 'Trạng thái' },
          { label: 'Hành động' }
      ];
      
      const quests = app.data.quests || [];
      html += app.ui.renderTable(cols, quests, (q, i) => {
          const status = q.is_active ? '<span style="color:#16a34a; font-weight:bold;">Đang chạy</span>' : '<span style="color:#dc2626; font-weight:bold;">Tạm dừng</span>';
          let target = q.target_subject === 'any' ? 'Bất kỳ' : (q.target_subject === 'math' ? 'Toán' : 'Tiếng Việt');
          target += ` (>= ${q.target_score}đ)`;
          
          let assign = 'Toàn trường';
          if (q.assign_type === 'class') assign = `Lớp ${q.assign_target}`;
          if (q.assign_type === 'user') assign = `HS: ${q.assign_target}`;

          return `<tr>
              <td>${app.data.sanitizeHTML(q.title)}</td>
              <td>${target}</td>
              <td>${q.target_count}</td>
              <td>${q.reward_lollipops} 🍭</td>
              <td>${assign}</td>
              <td>${status}</td>
              <td>
                  <button class="action-btn btn-danger" onclick="app.admin.toggleQuest(${i})">${q.is_active ? 'Dừng' : 'Bật'}</button>
                  <button class="action-btn btn-danger" onclick="app.admin.deleteQuest(${i})">Xoá</button>
              </td>
          </tr>`;
      }, "Chưa có nhiệm vụ nào được tạo.");
      
      box.innerHTML = html;
    },
    showAddQuestForm() {
      const box = document.getElementById('treasure-content-area');
      let classOpts = [1,2,3,4,5].map(c => `<option value="${c}">Lớp ${c}</option>`).join('');
      box.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; text-align: left; padding: 20px;">
           <h3 style="margin-bottom: 20px; color: #ffeb3b; text-align:center;">Tạo Nhiệm Vụ Mới</h3>
           <div class="form-group" style="margin-bottom:15px;">
              <label style="display:block; font-weight:bold; margin-bottom:5px;">Tên nhiệm vụ:</label>
              <input type="text" id="quest-title" class="form-input" style="width:100%;" placeholder="VD: Hoàn thành 3 bài Toán xuất sắc">
           </div>
           <div style="display:flex; gap:15px; margin-bottom:15px;">
              <div class="form-group" style="flex:1;">
                 <label style="display:block; font-weight:bold; margin-bottom:5px;">Môn học:</label>
                 <select id="quest-subject" class="form-input" style="width:100%;">
                    <option value="any">Bất kỳ</option>
                    <option value="math">Toán</option>
                    <option value="vietnamese">Tiếng Việt</option>
                 </select>
              </div>
              <div class="form-group" style="flex:1;">
                 <label style="display:block; font-weight:bold; margin-bottom:5px;">Điểm tối thiểu:</label>
                 <input type="number" id="quest-score" class="form-input" style="width:100%;" value="80" min="0" max="100">
              </div>
           </div>
           <div style="display:flex; gap:15px; margin-bottom:15px;">
              <div class="form-group" style="flex:1;">
                 <label style="display:block; font-weight:bold; margin-bottom:5px;">Số lượt yêu cầu:</label>
                 <input type="number" id="quest-count" class="form-input" style="width:100%;" value="3" min="1">
              </div>
              <div class="form-group" style="flex:1;">
                 <label style="display:block; font-weight:bold; margin-bottom:5px;">Phần thưởng (Kẹo):</label>
                 <input type="number" id="quest-reward" class="form-input" style="width:100%;" value="20" min="1">
              </div>
           </div>
           <div class="form-group" style="margin-bottom:15px;">
              <label style="display:block; font-weight:bold; margin-bottom:5px;">Chỉ định cho:</label>
              <select id="quest-assign-type" class="form-input" style="width:100%;" onchange="document.getElementById('quest-assign-target').style.display = this.value === 'all' ? 'none' : 'block'">
                 <option value="all">Toàn trường</option>
                 <option value="class">Theo Lớp</option>
                 <option value="user">Đích danh Học sinh (Username)</option>
              </select>
              <input type="text" id="quest-assign-target" class="form-input" style="width:100%; margin-top:10px; display:none;" placeholder="Nhập tên lớp (VD: 5) hoặc Username">
           </div>
           
           <div style="text-align:center; margin-top: 20px;">
              <button class="btn-primary" style="width:45%; display:inline-block;" onclick="app.admin.switchTab('quests')">Hủy</button>
              <button class="btn-success" style="width:45%; display:inline-block;" onclick="app.admin.submitQuest()">Lưu Nhiệm Vụ</button>
           </div>
        </div>
      `;
    },
    async submitQuest() {
        const title = document.getElementById('quest-title').value.trim();
        const subject = document.getElementById('quest-subject').value;
        const score = parseInt(document.getElementById('quest-score').value) || 80;
        const count = parseInt(document.getElementById('quest-count').value) || 1;
        const reward = parseInt(document.getElementById('quest-reward').value) || 10;
        const assignType = document.getElementById('quest-assign-type').value;
        const assignTarget = document.getElementById('quest-assign-target').value.trim();
        
        if (!title) return alert("Vui lòng nhập tên nhiệm vụ!");
        if (assignType !== 'all' && !assignTarget) return alert("Vui lòng nhập đích danh (Lớp/Username)!");
        
        const newQuest = {
            title, target_subject: subject, target_score: score, target_count: count,
            reward_lollipops: reward, assign_type: assignType, assign_target: assignTarget, is_active: true
        };
        
        if (window.supabase) {
            const { data, error } = await supabaseClient.from('game_quests').insert([newQuest]).select();
            if (error) {
                console.error("Lỗi tạo nhiệm vụ:", error);
                alert("Có lỗi khi tạo nhiệm vụ trên server!");
            } else if (data && data.length > 0) {
                app.data.quests.push(data[0]);
                this.switchTab('quests');
            }
        } else {
            newQuest.id = 'temp_' + new Date().getTime();
            app.data.quests.push(newQuest);
            this.switchTab('quests');
        }
    },
    async toggleQuest(idx) {
        const q = app.data.quests[idx];
        if (!q) return;
        const newState = !q.is_active;
        if (window.supabase && !q.id.startsWith('temp_')) {
            const { error } = await supabaseClient.from('game_quests').update({ is_active: newState }).eq('id', q.id);
            if (!error) {
                q.is_active = newState;
                this.renderQuests(document.getElementById('treasure-content-area'));
            } else {
                console.error(error);
                alert("Lỗi server!");
            }
        } else {
            q.is_active = newState;
            this.renderQuests(document.getElementById('treasure-content-area'));
        }
    },
    async deleteQuest(idx) {
        if (!confirm("Bạn có chắc chắn muốn xoá nhiệm vụ này? Tiến trình của HS cho nhiệm vụ này cũng sẽ bị xoá.")) return;
        const q = app.data.quests[idx];
        if (!q) return;
        
        if (window.supabase && !q.id.startsWith('temp_')) {
            const { error } = await supabaseClient.from('game_quests').delete().eq('id', q.id);
            if (!error) {
                app.data.quests.splice(idx, 1);
                this.renderQuests(document.getElementById('treasure-content-area'));
            } else {
                console.error(error);
                alert("Lỗi server!");
            }
        } else {
            app.data.quests.splice(idx, 1);
            this.renderQuests(document.getElementById('treasure-content-area'));
        }
    },
    renderSettings(box) {
      box.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; text-align: left; padding: 20px;">
           <h3 style="margin-bottom: 20px; color: #ffeb3b;">Điều Chỉnh Hệ Thống</h3>
           
           <div style="display:flex; align-items:center; margin-bottom:15px;">
              <label style="flex:1; font-weight:bold; font-size: 1.1rem;">Thời gian đếm ngược mức độ Khó (giây):</label>
              <input type="number" id="setting-hard-time" class="form-input" min="5" max="30" value="${app.data.settings.hardTimeLimit || 10}" style="width: 100px; padding:8px; text-align:center;">
           </div>
           
           <div style="display:flex; align-items:center; margin-bottom:25px;">
              <label style="flex:1; font-weight:bold; font-size: 1.1rem;">Thời gian đếm ngược Giải đề Kiểm tra (phút):</label>
              <input type="number" id="setting-exam-time" class="form-input" min="1" max="99" value="${app.data.settings.examTimeLimit || 30}" style="width: 100px; padding:8px; text-align:center;">
           </div>
           
           <div style="text-align:center;">
              <button class="btn-success" onclick="app.admin.saveSettings()">Lưu thay đổi</button>
           </div>
        </div>
      `;
    },
    async saveSettings() {
       const hardTime = parseInt(document.getElementById('setting-hard-time').value, 10);
       const examTime = parseInt(document.getElementById('setting-exam-time').value, 10);
       
       if (isNaN(hardTime) || hardTime < 5 || hardTime > 30) return alert('Thời gian mức độ Khó phải từ 5 đến 30 giây!');
       if (isNaN(examTime) || examTime < 1 || examTime > 99) return alert('Thời gian Giải đề Kiểm tra phải từ 1 đến 99 phút!');
       
       app.data.settings.hardTimeLimit = hardTime;
       app.data.settings.examTimeLimit = examTime;
       
       const btn = document.querySelector('button[onclick="app.admin.saveSettings()"]');
       const oldText = btn.textContent;
       btn.textContent = 'Đang lưu...';
       btn.disabled = true;
       
       const error = await app.data.saveSettings();
       
       btn.textContent = oldText;
       btn.disabled = false;
       if (!error) {
           alert('Đã lưu cài đặt thành công!');
       }
    },
    renderQuestions(box) {
        box.innerHTML = `
          <div style="margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; display:flex; gap:10px; flex-wrap:wrap;">
             <div style="display:flex; width:100%; gap: 10px;">
                 <button class="btn-primary" id="btn-q-lib" style="flex:1; margin:0;" onclick="app.admin.renderQSubTab('lib')">Thư viện</button>
                 <div id="q-count-indicator" style="flex:1; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius: 4px; font-weight: bold; color: #ffeb3b; font-size: 1rem;"></div>
             </div>
             <button class="btn-opt" id="btn-q-add" onclick="app.admin.renderQSubTab('add')">Soạn câu hỏi</button>
             <button class="btn-opt" id="btn-q-tpl" onclick="app.admin.renderQSubTab('tpl')">Xuất file mẫu (*.xlsx)</button>
             <button class="btn-opt" id="btn-q-exp" onclick="app.admin.renderQSubTab('exp')">Xuất dữ liệu (*.xlsx)</button>
             <button class="btn-opt" id="btn-q-imp" onclick="app.admin.renderQSubTab('imp')">Nhập từ file (*.xlsx)</button>
          </div>
          <div id="admin-q-subarea"></div>
        `;
        this.renderQSubTab('lib');
      },
    renderQSubTab(tab, editIdx) {
      ['lib','add','tpl','exp','imp'].forEach(t => {
         const el = document.getElementById('btn-q-'+t);
         if(el) el.className = (t===tab) ? 'btn-primary' : 'btn-opt';
      });
      const subBox = document.getElementById('admin-q-subarea');
      
      if (tab === 'lib') {
          const cols = [
            { label: 'Cấp lớp', filterable: true },
            { label: 'Môn', filterable: true },
            { label: 'Học kỳ', filterable: true },
            { label: 'Chủ đề', filterable: true },
            { label: 'Loại câu hỏi', filterable: true },
            { label: 'Câu hỏi', filterable: true },
            { label: 'Đáp án', filterable: false },
            { label: 'Lời giải', filterable: false },
            { label: 'Hành động', filterable: false }
          ];
          let html = app.ui.renderTable(cols, app.data.libraryQuestions, (q, i) => {
            return `<tr>
              <td>${q.classlevel||'Lớp 5'}</td><td>${q.subject}</td><td>${q.semester||''}</td><td>${q.topic}</td>
              <td>${q.type||'Trắc nghiệm'}</td>
              <td>${q.q}</td><td>${q.ans}</td><td>${q.explanation||''}</td>
              <td>
                <button class="btn-success action-btn" onclick="app.admin.addToExamPrompt(${i})">Thêm vào đề</button>
                <button class="btn-opt action-btn" onclick="app.admin.editQuestion(${i})">Sửa</button>
                <button class="btn-danger action-btn" onclick="app.admin.deleteQuestion(${i})">Xóa</button>
              </td>
            </tr>`;
          });
          subBox.innerHTML = html;
          const ind = document.getElementById('q-count-indicator');
          if (ind) ind.textContent = `Tổng: ${app.data.libraryQuestions.length} câu`;
      } 
      else if (tab === 'add') {
          let q = editIdx !== undefined ? app.data.libraryQuestions[editIdx] : null;
          subBox.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; text-align:left;">
               <h3>${q ? 'Sửa thông tin câu hỏi' : 'Thêm câu hỏi mới'}</h3>
               
               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Cấp lớp</label>
                  <select id="add-q-class" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateTopicDropdown()">
                     <option value="Lớp 1" ${q && q.classlevel === 'Lớp 1' ? 'selected' : ''}>Lớp 1</option>
                     <option value="Lớp 2" ${q && q.classlevel === 'Lớp 2' ? 'selected' : ''}>Lớp 2</option>
                     <option value="Lớp 3" ${q && q.classlevel === 'Lớp 3' ? 'selected' : ''}>Lớp 3</option>
                     <option value="Lớp 4" ${q && q.classlevel === 'Lớp 4' ? 'selected' : ''}>Lớp 4</option>
                     <option value="Lớp 5" ${q && q.classlevel === 'Lớp 5' ? 'selected' : (!q ? 'selected' : '')}>Lớp 5</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Môn học</label>
                  <select id="add-q-sub" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateTopicDropdown()">
                     <option value="Toán" ${q && q.subject === 'Toán' ? 'selected' : (!q ? 'selected' : '')}>Toán</option>
                     <option value="Tiếng Việt" ${q && q.subject === 'Tiếng Việt' ? 'selected' : ''}>Tiếng Việt</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Học kỳ</label>
                  <select id="add-q-sem" class="form-input" style="flex:1; padding:8px;">
                     <option value="Học kỳ 1" ${q && q.semester === 'Học kỳ 1' ? 'selected' : (!q ? 'selected' : '')}>Học kỳ 1</option>
                     <option value="Học kỳ 2" ${q && q.semester === 'Học kỳ 2' ? 'selected' : ''}>Học kỳ 2</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Chủ đề</label>
                  <select id="add-q-topic" class="form-input" style="flex:1; padding:8px;" data-selected="${q ? q.topic : ''}">
                  </select>
               </div>

               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Loại câu hỏi</label>
                  <select id="add-q-type" class="form-input" style="flex:1; padding:8px;" onchange="document.getElementById('add-q-opts-wrapper').style.display = (this.value === 'Trắc nghiệm' || this.value === 'Kéo thả') ? 'block' : 'none';">
                     <option value="Trắc nghiệm" ${q && q.type === 'Trắc nghiệm' ? 'selected' : (!q ? 'selected' : '')}>Trắc nghiệm</option>
                     <option value="Điền khuyết" ${q && q.type === 'Điền khuyết' ? 'selected' : ''}>Điền khuyết</option>
                     <option value="Đúng/Sai" ${q && q.type === 'Đúng/Sai' ? 'selected' : ''}>Đúng/Sai</option>
                     <option value="So sánh" ${q && q.type === 'So sánh' ? 'selected' : ''}>So sánh</option>
                     <option value="Chuỗi Quy luật" ${q && q.type === 'Chuỗi Quy luật' ? 'selected' : ''}>Chuỗi Quy luật</option>
                     <option value="Kéo thả" ${q && q.type === 'Kéo thả' ? 'selected' : ''}>Kéo thả</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Nội dung câu hỏi</label>
                  <textarea id="add-q-q" placeholder="Nội dung câu hỏi" class="form-input" style="flex:1; padding:8px; height:60px;">${q ? q.q : ''}</textarea>
               </div>

               <div id="add-q-opts-wrapper" style="display: ${q && q.type && q.type !== 'Trắc nghiệm' && q.type !== 'Kéo thả' ? 'none' : 'block'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 1</label>
                     <input type="text" id="add-q-opt1" placeholder="Trả lời 1" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[0] ? q.options[0] : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 2</label>
                     <input type="text" id="add-q-opt2" placeholder="Trả lời 2" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[1] ? q.options[1] : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 3</label>
                     <input type="text" id="add-q-opt3" placeholder="Trả lời 3" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[2] ? q.options[2] : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 4</label>
                     <input type="text" id="add-q-opt4" placeholder="Trả lời 4" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[3] ? q.options[3] : ''}">
                  </div>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Đáp án đúng</label>
                  <input type="text" id="add-q-ans" placeholder="Đáp án đúng (nếu trắc nghiệm phải ghi đúng 1 trong 4 lựa chọn ở trên)" class="form-input" style="flex:1; padding:8px;" value="${q ? q.ans : ''}">
               </div>

               <div style="display:flex; align-items:center; margin-bottom:15px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Lời giải chi tiết</label>
                  <textarea id="add-q-exp" placeholder="Lời giải (tùy chọn)" class="form-input" style="flex:1; padding:8px; height:60px;">${q ? q.explanation || '' : ''}</textarea>
               </div>

               <button class="btn-success" onclick="app.admin.submitAddQuestion(${editIdx !== undefined ? editIdx : 'null'})" style="width:100%; padding:10px;">${q ? 'Lưu chỉnh sửa' : 'Lưu câu hỏi'}</button>
            </div>
          `;
          setTimeout(() => app.admin.updateTopicDropdown(), 0);
      }
      else if (tab === 'tpl') {
          subBox.innerHTML = `<p>Đang chuẩn bị file mẫu...</p>`;
          app.admin.downloadQTemplate();
          setTimeout(() => app.admin.renderQSubTab('lib'), 1000);
      }
      else if (tab === 'exp') {
          subBox.innerHTML = `<p>Đang xuất dữ liệu...</p>`;
          app.admin.exportQuestions();
          setTimeout(() => app.admin.renderQSubTab('lib'), 1000);
      }
      else if (tab === 'imp') {
          subBox.innerHTML = `
            <div style="max-width: 400px; margin: 0 auto; text-align:center;">
               <h3>Nhập dữ liệu từ Excel (.xlsx)</h3>
               <div style="text-align: left; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                  <label style="display:block; margin-bottom:10px; cursor:pointer;"><input type="radio" name="q-import-mode" value="append" checked style="transform:scale(1.2); margin-right:8px;"> <strong>Thêm mới</strong> (Giữ nguyên dữ liệu cũ, thêm dữ liệu mới)</label>
                  <label style="display:block; cursor:pointer;"><input type="radio" name="q-import-mode" value="overwrite" style="transform:scale(1.2); margin-right:8px;"> <strong style="color:#f87171;">Ghi đè</strong> (Xóa toàn bộ dữ liệu cũ, thay bằng mới)</label>
               </div>
               <input type="file" id="q-file-upload" accept=".xlsx, .csv" multiple style="margin: 10px 0 20px 0;">
               <button class="btn-success" onclick="app.admin.submitImportQuestions()" style="width:100%;">Tải lên</button>
            </div>
          `;
      }
    },
    downloadQTemplate() {
        const data = [
            {
                "Cấp lớp": "Lớp 1",
                "Môn học": "Toán",
                "Học kỳ": "Học kỳ 1",
                "Chủ đề": "Phép cộng trừ không nhớ phạm vi 100",
                "Mức độ khó": "Dễ",
                "Loại câu hỏi": "Trắc nghiệm",
                "Câu hỏi": "1 + 1 = ?",
                "Lựa chọn": "1, 2, 3, 4",
                "Đáp án đúng": "2",
                "Lời giải chi tiết": "1 cộng 1 bằng 2"
            },
            {
                "Cấp lớp": "Lớp 1",
                "Môn học": "Tiếng Việt",
                "Học kỳ": "Học kỳ 2",
                "Chủ đề": "Mái trường mến yêu",
                "Mức độ khó": "Khó",
                "Loại câu hỏi": "Kéo thả",
                "Câu hỏi": "Con chó sủa gâu ___, con mèo kêu meo ___.",
                "Lựa chọn": "gâu, meo, quác, chiếp",
                "Đáp án đúng": "gâu, meo",
                "Lời giải chi tiết": "Kéo thả 'gâu' vào chỗ trống thứ nhất, 'meo' vào thứ 2"
            },
            {
                "Cấp lớp": "Lớp 2",
                "Môn học": "Toán",
                "Học kỳ": "Học kỳ 1",
                "Chủ đề": "Phép nhân, phép chia",
                "Mức độ khó": "Dễ",
                "Loại câu hỏi": "Đúng/Sai",
                "Câu hỏi": "5 - 3 = 2, đúng hay sai?",
                "Lựa chọn": "",
                "Đáp án đúng": "Đúng",
                "Lời giải chi tiết": "Phép trừ chính xác"
            },
            {
                "Cấp lớp": "Lớp 3",
                "Môn học": "Tiếng Việt",
                "Học kỳ": "Học kỳ 1",
                "Chủ đề": "Cộng đồng gắn bó",
                "Mức độ khó": "Khó",
                "Loại câu hỏi": "Điền khuyết",
                "Câu hỏi": "Gần mực thì đen, gần ___ thì sáng.",
                "Lựa chọn": "",
                "Đáp án đúng": "đèn",
                "Lời giải chi tiết": "Tục ngữ"
            },
            {
                "Cấp lớp": "Lớp 4",
                "Môn học": "Toán",
                "Học kỳ": "Học kỳ 2",
                "Chủ đề": "Phân số",
                "Mức độ khó": "Dễ",
                "Loại câu hỏi": "So sánh",
                "Câu hỏi": "Điền dấu thích hợp: 1/2 ___ 1/3",
                "Lựa chọn": "",
                "Đáp án đúng": ">",
                "Lời giải chi tiết": "1/2 > 1/3"
            },
            {
                "Cấp lớp": "Lớp 5",
                "Môn học": "Toán",
                "Học kỳ": "Học kỳ 1",
                "Chủ đề": "Số thập phân",
                "Mức độ khó": "Khó",
                "Loại câu hỏi": "Chuỗi quy luật",
                "Câu hỏi": "2, ___, 6, ___, 10",
                "Lựa chọn": "",
                "Đáp án đúng": "4, 8",
                "Lời giải chi tiết": "Điền 2 số còn thiếu"
            },
            {
                "Cấp lớp": "=> HƯỚNG DẪN CÁCH NHẬP:",
                "Môn học": "(1) Cấp lớp, Môn học, Học kỳ (Học kỳ 1 hoặc Học kỳ 2)",
                "Học kỳ": "Học kỳ 1",
                "Chủ đề": "(2) Copy chính xác Chủ đề bên dưới",
                "Loại câu hỏi": "(3) Ghi chính xác: Trắc nghiệm, Điền khuyết, Đúng/Sai, So sánh, Chuỗi quy luật, Kéo thả",
                "Câu hỏi": "(4) Kéo thả, So sánh, Điền khuyết, Chuỗi quy luật: Bắt buộc dùng ___ hoặc ... để làm chỗ trống.",
                "Lựa chọn": "(5) Trắc nghiệm / Kéo thả: Các lựa chọn & đáp án nhiễu (ngăn cách bởi dấu phẩy).",
                "Đáp án đúng": "(6) Kéo thả, Chuỗi quy luật: Cho phép 1->4 đáp án (ngăn cách bởi dấu phẩy). So sánh: <,>,=",
                "Lời giải chi tiết": "(7) Có thể để trống"
            }
        ];
        
        for (let i = 1; i <= 5; i++) {
            const t = app.constants.topics[String(i)];
            if (t) {
                const mathTopics = [...(t.math.hk1 || []), ...(t.math.hk2 || [])].join(", ");
                const vietTopics = [...(t.vietnamese.hk1 || []), ...(t.vietnamese.hk2 || [])].join(", ");
                data.push({
                    "Cấp lớp": "=> COPY CHỦ ĐỀ LỚP " + i + ":",
                    "Môn học": "Môn Toán Lớp " + i + ":",
                    "Học kỳ": "",
                    "Chủ đề": mathTopics,
                    "Loại câu hỏi": "Môn Tiếng Việt Lớp " + i + ": " + vietTopics,
                    "Câu hỏi": "",
                    "Lựa chọn": "",
                    "Đáp án đúng": "",
                    "Lời giải chi tiết": ""
                });
            }
        }
        
        app.ui.exportToExcel(data, "Mau_Nhap_Cau_Hoi.xlsx");
    },
    exportQuestions() {
        const data = app.data.libraryQuestions.map(q => ({
            "Cấp lớp": q.classlevel,
            "Môn học": q.subject,
            "Học kỳ": q.semester || '',
            "Chủ đề": q.topic,
            "Loại câu hỏi": q.type,
            "Câu hỏi": q.q,
            "Lựa chọn": (q.options || []).join(', '),
            "Đáp án đúng": q.ans,
            "Lời giải chi tiết": q.explanation || ''
        }));
        app.ui.exportToExcel(data, "Du_Lieu_Cau_Hoi.xlsx");
    },
    downloadETemplate() {
        const data = [{
            "Cấp lớp": "Lớp 5",
            "Môn": "Toán",
            "Kỳ kiểm tra": "Giữa kỳ 1",
            "Tên đề": "Đề kiểm tra giữa kỳ 1 Môn Toán Lớp 5"
        }];
        app.ui.exportToExcel(data, "Mau_Nhap_De_Kiem_Tra.xlsx");
    },
    exportExams() {
        const data = app.data.exams.map(e => ({
            "Cấp lớp": e.classlevel,
            "Môn": e.subject,
            "Kỳ kiểm tra": e.period,
            "Tên đề": e.name,
            "Số câu hỏi": (e.questions || []).length
        }));
        app.ui.exportToExcel(data, "Du_Lieu_De_Kiem_Tra.xlsx");
    },
    submitAddQuestion(editIdx) {
        const qObj = {
            type: document.getElementById('add-q-type').value,
            subject: document.getElementById('add-q-sub').value,
            classlevel: document.getElementById('add-q-class').value,
            semester: document.getElementById('add-q-sem').value,
            topic: document.getElementById('add-q-topic').value,
            q: document.getElementById('add-q-q').value,
            ans: document.getElementById('add-q-ans').value,
            options: [
                document.getElementById('add-q-opt1') ? document.getElementById('add-q-opt1').value.trim() : '',
                document.getElementById('add-q-opt2') ? document.getElementById('add-q-opt2').value.trim() : '',
                document.getElementById('add-q-opt3') ? document.getElementById('add-q-opt3').value.trim() : '',
                document.getElementById('add-q-opt4') ? document.getElementById('add-q-opt4').value.trim() : ''
            ].filter(s => s),
            explanation: document.getElementById('add-q-exp').value
        };
        if(!qObj.subject || !qObj.q || !qObj.ans) return alert('Vui lòng điền đủ Môn, Câu hỏi và Đáp án');
        
        if (editIdx !== null && editIdx !== undefined) {
             app.data.libraryQuestions[editIdx] = qObj;
             alert('Đã cập nhật câu hỏi!');
        } else {
             app.data.libraryQuestions.push(qObj);
             alert('Đã thêm câu hỏi!');
        }
        app.data.saveLibrary();
        this.renderQSubTab('lib');
    },
    addToExamPrompt(qIdx) {
        if (!app.data.exams || app.data.exams.length === 0) return alert('Chưa có đề kiểm tra nào. Vui lòng tạo đề kiểm tra trước trong Kho Đề Kiểm tra!');
        app.admin.switchTab('exams');
        setTimeout(() => {
            app.admin.renderESubTab('select_for_q', qIdx);
        }, 50);
    },
    submitImportQuestions() {
        const fileInput = document.getElementById('q-file-upload');
        if (!fileInput.files.length) return alert('Vui lòng chọn file!');
        
        const modeInput = document.querySelector('input[name="q-import-mode"]:checked');
        const mode = modeInput ? modeInput.value : 'append';
        if (mode === 'overwrite') {
            if (!confirm("CẢNH BÁO: Bạn đã chọn GHI ĐÈ. Toàn bộ câu hỏi hiện có sẽ bị xóa sạch và thay bằng dữ liệu mới! Bạn có chắc chắn muốn tiếp tục? (Bấm OK để Ghi đè, Cancel để Hủy)")) {
                return;
            }
        }

        const btn = document.querySelector('button[onclick="app.admin.submitImportQuestions()"]');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Đang xử lý và tải lên... Vui lòng chờ';
        }

        const files = Array.from(fileInput.files);
        let totalCount = 0;
        let processedFiles = 0;

        const processNextFile = async (index) => {
            if (index >= files.length) {
                await app.data.saveLibrary();
                alert(`Đã nhập thành công ${totalCount} câu hỏi từ ${files.length} file!`);
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Tải lên';
                }
                this.renderQSubTab('lib');
                return;
            }
            app.ui.importFromExcel(files[index], (data) => {
                data.forEach(row => {
                    const ansStr = row["Đáp án đúng"] || row["Đáp án"];
                    if (row["Câu hỏi"] && ansStr !== undefined && ansStr !== null && String(ansStr).trim() !== '') {
                        app.data.libraryQuestions.push({
                            type: row["Loại câu hỏi"] || row["Loại"] || 'Trắc nghiệm',
                            subject: row["Môn học"] || row["Môn"] || 'Toán',
                            classlevel: row["Cấp lớp"] || row["Lớp"] || 'Lớp 5',
                            semester: row["Học kỳ"] || '',
                            topic: row["Chủ đề"] || 'Khác',
                            q: row["Câu hỏi"],
                            ans: String(ansStr),
                            options: row["Lựa chọn"] ? String(row["Lựa chọn"]).split(/[,;\|]/).map(s=>s.trim()).filter(Boolean) : [],
                            explanation: row["Lời giải chi tiết"] || ''
                        });
                        totalCount++;
                    }
                });
                processNextFile(index + 1);
            });
        };

        if (mode === 'overwrite') {
            app.data.libraryQuestions = [];
            if (window.supabase) {
                supabaseClient.from('game_questions').delete().not('id', 'is', null).then(({ error }) => {
                    if (error) console.error('Delete questions error:', error);
                    processNextFile(0);
                });
            } else {
                processNextFile(0);
            }
        } else {
            processNextFile(0);
        }
    },
    renderExams(box) {
      box.innerHTML = `
        <div style="margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; display:flex; gap:10px; flex-wrap:wrap;">
           <div style="display:flex; width:100%; gap: 10px;">
               <button class="btn-primary" id="btn-e-lib" style="flex:1; margin:0;" onclick="app.admin.renderESubTab('lib')">Thư viện</button>
               <div id="e-count-indicator" style="flex:1; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius: 4px; font-weight: bold; color: #ffeb3b; font-size: 1rem;"></div>
           </div>
           <button class="btn-opt" id="btn-e-add" onclick="app.admin.renderESubTab('add')">Soạn đề</button>
           <button class="btn-opt" id="btn-e-tpl" onclick="app.admin.renderESubTab('tpl')">Xuất file mẫu (*.xlsx)</button>
           <button class="btn-opt" id="btn-e-exp" onclick="app.admin.renderESubTab('exp')">Xuất dữ liệu (*.xlsx)</button>
           <button class="btn-opt" id="btn-e-imp" onclick="app.admin.renderESubTab('imp')">Nhập từ file (*.xlsx)</button>
        </div>
        <div id="admin-e-subarea"></div>
      `;
      this.renderESubTab('lib');
    },
    renderESubTab(tab, editIdx) {
      ['lib','add','tpl','exp','imp'].forEach(t => {
         const el = document.getElementById('btn-e-'+t);
         if(el) el.className = (t===tab) ? 'btn-primary' : 'btn-opt';
      });
      const subBox = document.getElementById('admin-e-subarea');
      
      if (tab === 'lib') {
          const cols = [
            { label: 'Cấp lớp', filterable: true },
            { label: 'Môn', filterable: true },
            { label: 'Kỳ kiểm tra', filterable: true },
            { label: 'Tên đề', filterable: true },
            { label: 'Số câu', filterable: false },
            { label: 'Hành động', filterable: false }
          ];
          let html = app.ui.renderTable(cols, app.data.exams, (e, i) => {
            return `<tr>
              <td>${e.classlevel||'Lớp 5'}</td><td>${e.subject}</td>
              <td>${e.period}</td><td>${e.name}</td><td>${(e.questions||[]).length}</td>
              <td>
                <button class="btn-primary action-btn" onclick="app.admin.viewExam(${i})">Xem</button>
                <button class="btn-opt action-btn" onclick="app.admin.editExam(${i})">Sửa</button>
                <button class="btn-danger action-btn" onclick="app.admin.deleteExam(${i})">Xóa</button>
              </td>
            </tr>`;
          });
          subBox.innerHTML = html;
          const ind = document.getElementById('e-count-indicator');
          if (ind) ind.textContent = `Tổng: ${app.data.exams.length} đề`;
      }
      else if (tab === 'add') {
          let e = editIdx !== undefined ? app.data.exams[editIdx] : null;
          subBox.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; text-align:left;">
               <h3>${e ? 'Sửa đề kiểm tra' : 'Thêm đề kiểm tra mới'}</h3>
               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Cấp lớp</label>
                  <select id="add-e-class" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateExamTopics()">
                     <option value="Lớp 1" ${e && e.classlevel === 'Lớp 1' ? 'selected' : ''}>Lớp 1</option>
                     <option value="Lớp 2" ${e && e.classlevel === 'Lớp 2' ? 'selected' : ''}>Lớp 2</option>
                     <option value="Lớp 3" ${e && e.classlevel === 'Lớp 3' ? 'selected' : ''}>Lớp 3</option>
                     <option value="Lớp 4" ${e && e.classlevel === 'Lớp 4' ? 'selected' : ''}>Lớp 4</option>
                     <option value="Lớp 5" ${e && e.classlevel === 'Lớp 5' ? 'selected' : (!e ? 'selected' : '')}>Lớp 5</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Môn học</label>
                  <select id="add-e-sub" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateExamTopics()">
                     <option value="Toán" ${e && e.subject === 'Toán' ? 'selected' : (!e ? 'selected' : '')}>Toán</option>
                     <option value="Tiếng Việt" ${e && e.subject === 'Tiếng Việt' ? 'selected' : ''}>Tiếng Việt</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Kỳ kiểm tra</label>
                  <select id="add-e-period" class="form-input" style="flex:1; padding:8px;">
                     <option value="Giữa kỳ 1" ${e && e.period === 'Giữa kỳ 1' ? 'selected' : ''}>Giữa kỳ 1</option>
                     <option value="Cuối kỳ 1" ${e && e.period === 'Cuối kỳ 1' ? 'selected' : ''}>Cuối kỳ 1</option>
                     <option value="Giữa kỳ 2" ${e && e.period === 'Giữa kỳ 2' ? 'selected' : ''}>Giữa kỳ 2</option>
                     <option value="Cuối kỳ 2" ${e && e.period === 'Cuối kỳ 2' ? 'selected' : ''}>Cuối kỳ 2</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:15px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Tên đề kiểm tra</label>
                  <input type="text" id="add-e-name" placeholder="Tên Đề (VD: Đề kiểm tra học kì 1 Toán)" class="form-input" style="flex:1; padding:8px;" value="${e ? e.name : ''}">
               </div>

               ${e && e.questions && e.questions.length > 0 ? `
               <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px;">
                  <h4 style="margin-bottom: 10px; color:#4ade80;">Danh sách câu hỏi hiện có trong đề:</h4>
                  <table style="width:100%; border-collapse: collapse; text-align: left;">
                     ${e.questions.map((q, i) => `
                     <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 10px 5px;"><strong>Câu ${i+1}:</strong> ${q.q}</td>
                        <td style="padding: 10px 5px; text-align:right; white-space:nowrap;">
                            ${i > 0 ? `<button class="btn-opt action-btn" style="padding:4px 8px;" onclick="app.admin.moveQuestion(${editIdx}, ${i}, 'up')">Lên</button>` : ''}
                            ${i < e.questions.length - 1 ? `<button class="btn-opt action-btn" style="padding:4px 8px;" onclick="app.admin.moveQuestion(${editIdx}, ${i}, 'down')">Xuống</button>` : ''}
                            <button class="btn-danger action-btn" style="padding:4px 8px;" onclick="app.admin.removeQuestionFromExam(${editIdx}, ${i})">Xóa</button>
                        </td>
                     </tr>
                     `).join('')}
                  </table>
               </div>
               ` : ''}

               <div style="margin-top: 20px; border-top: 2px solid rgba(255,255,255,0.3); padding-top: 15px;">
                  <h4 style="margin-bottom: 15px; color:#ffcc00;">Soạn câu hỏi cho đề kiểm tra này</h4>
                  ${Array(Math.max(10, e && e.questions ? e.questions.length : 10)).fill(0).map((_, i) => {
                     let q = e && e.questions && e.questions[i] ? e.questions[i] : null;
                     return `
                    <div style="background: rgba(0,0,0,0.2); padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #ffcc00;">
                       <h5 style="margin-top:0; margin-bottom: 10px;">Câu hỏi ${i + 1}</h5>
                       
                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Chủ đề</label>
                          <select id="add-e-q-topic-${i}" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;" data-selected="${q ? q.topic : ''}">
                          </select>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Mức độ khó</label>
                          <select id="add-e-q-diff-${i}" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;">
                             <option value="Dễ" ${q && q.difficulty === 'Dễ' ? 'selected' : (!q ? 'selected' : '')}>Dễ</option>
                             <option value="Khó" ${q && q.difficulty === 'Khó' ? 'selected' : ''}>Khó</option>
                          </select>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Loại câu hỏi</label>
                          <select id="add-e-q-type-${i}" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;" onchange="app.admin.toggleExamOptionsWrapper(${i})">
                             <option value="Trắc nghiệm" ${q && q.type === 'Trắc nghiệm' ? 'selected' : (!q ? 'selected' : '')}>Trắc nghiệm</option>
                             <option value="Điền khuyết" ${q && q.type === 'Điền khuyết' ? 'selected' : ''}>Điền khuyết</option>
                             <option value="Đúng/Sai" ${q && q.type === 'Đúng/Sai' ? 'selected' : ''}>Đúng/Sai</option>
                             <option value="So sánh" ${q && q.type === 'So sánh' ? 'selected' : ''}>So sánh</option>
                             <option value="Chuỗi Quy luật" ${q && q.type === 'Chuỗi Quy luật' ? 'selected' : ''}>Chuỗi Quy luật</option>
                             <option value="Kéo thả" ${q && q.type === 'Kéo thả' ? 'selected' : ''}>Kéo thả</option>
                          </select>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Nội dung câu</label>
                          <textarea id="add-e-q-q-${i}" placeholder="Nhập nội dung câu hỏi (để trống nếu không muốn tạo câu này)" class="form-input" style="flex:1; padding:6px; height:50px; font-size:0.9rem;">${q ? q.q : ''}</textarea>
                       </div>

                       <div id="add-e-q-opts-wrapper-${i}" style="display: ${q && q.type && q.type !== 'Trắc nghiệm' && q.type !== 'Kéo thả' ? 'none' : 'block'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                          <div style="display:flex; align-items:center; margin-bottom:5px;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lựa chọn 1</label>
                             <input type="text" id="add-e-q-opt1-${i}" placeholder="Lựa chọn 1" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[0] ? q.options[0] : ''}">
                          </div>
                          <div style="display:flex; align-items:center; margin-bottom:5px;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lựa chọn 2</label>
                             <input type="text" id="add-e-q-opt2-${i}" placeholder="Lựa chọn 2" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[1] ? q.options[1] : ''}">
                          </div>
                          <div style="display:flex; align-items:center; margin-bottom:5px;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lựa chọn 3</label>
                             <input type="text" id="add-e-q-opt3-${i}" placeholder="Lựa chọn 3" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[2] ? q.options[2] : ''}">
                          </div>
                          <div style="display:flex; align-items:center; margin-bottom:0;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lựa chọn 4</label>
                             <input type="text" id="add-e-q-opt4-${i}" placeholder="Lựa chọn 4" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[3] ? q.options[3] : ''}">
                          </div>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Đáp án đúng</label>
                          <input type="text" id="add-e-q-ans-${i}" placeholder="Đáp án đúng" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;" value="${q ? q.ans : ''}">
                       </div>
                       
                       <div style="display:flex; align-items:center; margin-bottom:0;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Lời giải chi tiết</label>
                          <textarea id="add-e-q-exp-${i}" placeholder="Lời giải (tùy chọn)" class="form-input" style="flex:1; padding:6px; height:40px; font-size:0.9rem;">${q ? q.explanation || '' : ''}</textarea>
                       </div>
                    </div>
                  `;
                  }).join('')}
               </div>

               <button class="btn-success" onclick="app.admin.submitAddExam(${editIdx !== undefined ? editIdx : 'null'})" style="width:100%; padding:10px;">${e ? 'Lưu chỉnh sửa đề kiểm tra' : 'Tạo đề kiểm tra mới'}</button>
            </div>
          `;
          setTimeout(() => app.admin.updateExamTopics(), 0);
      }
      else if (tab === 'tpl') {
          subBox.innerHTML = `<p>Đang chuẩn bị file mẫu...</p>`;
          app.admin.downloadETemplate();
          setTimeout(() => this.renderESubTab('lib'), 1000);
      }
      else if (tab === 'exp') {
          subBox.innerHTML = `<p>Đang xuất dữ liệu...</p>`;
          app.admin.exportExams();
          setTimeout(() => this.renderESubTab('lib'), 1000);
      }
      else if (tab === 'select_for_q') {
          let qIdx = editIdx;
          let q = app.data.libraryQuestions[qIdx];
          let matchingExams = app.data.exams.map((e, i) => ({e, i})).filter(x => x.e.classlevel === q.classlevel && x.e.subject === q.subject);
          
          let html = `<div style="margin-bottom:15px;"><button class="btn-opt" onclick="app.admin.switchTab('questions'); setTimeout(()=>app.admin.renderQSubTab('lib'), 50);">Quay lại Kho Câu hỏi</button></div>`;
          html += `<h3>Chọn đề kiểm tra để thêm câu hỏi</h3>`;
          html += `<p>Đang lọc đề kiểm tra: <strong>${q.classlevel} - ${q.subject}</strong></p>`;
          
          if (matchingExams.length === 0) {
              html += `<p style="color:#aaa;">Không có đề kiểm tra nào phù hợp với Cấp lớp và Môn của câu hỏi này.</p>`;
          } else {
              const cols = [
                  { label: 'Kỳ kiểm tra', filterable: true },
                  { label: 'Tên đề', filterable: true },
                  { label: 'Số câu', filterable: false },
                  { label: 'Hành động', filterable: false }
              ];
              html += app.ui.renderTable(cols, matchingExams, (item, idx) => {
                  return `<tr>
                      <td>${item.e.period}</td>
                      <td>${item.e.name}</td>
                      <td>${(item.e.questions||[]).length}</td>
                      <td>
                          <button class="btn-success action-btn" onclick="app.admin.renderESubTab('inject_q', {qIdx: ${qIdx}, eIdx: ${item.i}})">Chọn đề này</button>
                      </td>
                  </tr>`;
              });
          }
          subBox.innerHTML = html;
      }
      else if (tab === 'inject_q') {
          let {qIdx, eIdx} = editIdx;
          let q = app.data.libraryQuestions[qIdx];
          let e = app.data.exams[eIdx];
          
          let existingOpts = (e.questions||[]).map((eq, i) => `<option value="${i}">Ghi đè Câu ${i+1}: ${eq.q.substring(0, 30)}...</option>`).join('');
          
          subBox.innerHTML = `
             <div style="max-width: 600px; margin: 0 auto; text-align:left;">
                <div style="margin-bottom:15px;"><button class="btn-opt" onclick="app.admin.renderESubTab('select_for_q', ${qIdx})">Quay lại chọn đề</button></div>
                <h3>Thêm câu hỏi vào đề: ${e.name}</h3>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>Nội dung câu hỏi sẽ thêm:</strong></p>
                    <p><i>${q.q}</i></p>
                    <p><strong>Đáp án:</strong> ${q.ans}</p>
                </div>
                
                <div style="display:flex; align-items:center; margin-bottom:15px;">
                   <label style="width:150px; font-weight:bold; flex-shrink:0;">Hành động</label>
                   <select id="inject-mode" class="form-input" style="flex:1; padding:8px;" onchange="document.getElementById('inject-target-wrap').style.display = this.value === 'overwrite' ? 'flex' : 'none'">
                      <option value="append">Thêm mới vào cuối đề</option>
                      ${existingOpts ? `<option value="overwrite">Ghi đè lên câu hỏi hiện có</option>` : ''}
                   </select>
                </div>
                
                <div id="inject-target-wrap" style="display:none; align-items:center; margin-bottom:20px;">
                   <label style="width:150px; font-weight:bold; flex-shrink:0;">Chọn câu để ghi đè</label>
                   <select id="inject-target" class="form-input" style="flex:1; padding:8px;">
                      ${existingOpts}
                   </select>
                </div>
                
                <button class="btn-success" onclick="app.admin.submitInjectQ(${qIdx}, ${eIdx})" style="width:100%; padding:10px;">Xác nhận thêm vào đề</button>
             </div>
          `;
      }
      else if (tab === 'imp') {
          subBox.innerHTML = `
            <div style="max-width: 400px; margin: 0 auto; text-align:center;">
               <h3>Nhập đề kiểm tra từ Excel (.xlsx)</h3>
               <p style="color:#aaa; font-size:0.9rem;">Chỉ nhập thông tin vỏ đề kiểm tra (chưa có câu hỏi).</p>
               <div style="text-align: left; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                  <label style="display:block; margin-bottom:10px; cursor:pointer;"><input type="radio" name="e-import-mode" value="append" checked style="transform:scale(1.2); margin-right:8px;"> <strong>Thêm mới</strong> (Giữ nguyên đề cũ, thêm đề mới)</label>
                  <label style="display:block; cursor:pointer;"><input type="radio" name="e-import-mode" value="overwrite" style="transform:scale(1.2); margin-right:8px;"> <strong style="color:#f87171;">Ghi đè</strong> (Xóa toàn bộ đề cũ, thay bằng mới)</label>
               </div>
               <input type="file" id="e-file-upload" accept=".xlsx, .csv" style="margin: 10px 0 20px 0;">
               <button class="btn-success" onclick="app.admin.submitImportExams()" style="width:100%;">Tải lên</button>
            </div>
          `;
      }
    },
    submitAddExam(editIdx) {
        const eObj = {
            name: document.getElementById('add-e-name').value,
            subject: document.getElementById('add-e-sub').value,
            classlevel: document.getElementById('add-e-class').value,
            period: document.getElementById('add-e-period').value,
            questions: []
        };
        if(!eObj.name || !eObj.subject) return alert('Vui lòng điền đủ Tên Đề và Môn');
        
        let i = 0;
        let newQuestionsCount = 0;
        while (document.getElementById(`add-e-q-q-${i}`)) {
            const qTextEl = document.getElementById(`add-e-q-q-${i}`);
            const qText = qTextEl.value.trim();
            const ansText = document.getElementById(`add-e-q-ans-${i}`).value.trim();
            
            if (qText && ansText) {
                const typeVal = document.getElementById(`add-e-q-type-${i}`).value;
                const newQ = {
                    classlevel: eObj.classlevel,
                    subject: eObj.subject,
                    topic: document.getElementById(`add-e-q-topic-${i}`).value,
                    difficulty: document.getElementById(`add-e-q-diff-${i}`).value,
                    type: typeVal,
                    q: qText,
                    ans: ansText,
                    explanation: document.getElementById(`add-e-q-exp-${i}`).value.trim(),
                    options: []
                };
                if (typeVal === 'Trắc nghiệm' || typeVal === 'Kéo thả') {
                    newQ.options = [
                        document.getElementById(`add-e-q-opt1-${i}`).value.trim(),
                        document.getElementById(`add-e-q-opt2-${i}`).value.trim(),
                        document.getElementById(`add-e-q-opt3-${i}`).value.trim(),
                        document.getElementById(`add-e-q-opt4-${i}`).value.trim()
                    ];
                }
                eObj.questions.push(newQ);
                const exists = app.data.libraryQuestions.some(libQ => libQ.q === newQ.q);
                if (!exists) {
                    app.data.libraryQuestions.push(JSON.parse(JSON.stringify(newQ))); // add a copy to global bank
                }
                newQuestionsCount++;
            }
            i++;
        }
        
        if (newQuestionsCount > 0) {
            app.data.saveLibrary();
        }

        if (editIdx !== null && editIdx !== undefined) {
             app.data.exams[editIdx] = eObj;
             alert('Đã cập nhật đề kiểm tra!');
        } else {
             app.data.exams.push(eObj);
             alert('Đã tạo đề kiểm tra mới!');
        }
        app.data.saveExams();
        this.renderESubTab('lib');
    },
    submitInjectQ(qIdx, eIdx) {
        let e = app.data.exams[eIdx];
        if (!e.questions) e.questions = [];
        
        let mode = document.getElementById('inject-mode').value;
        let targetIdx = parseInt(document.getElementById('inject-target').value);
        let qClone = JSON.parse(JSON.stringify(app.data.libraryQuestions[qIdx]));
        
        if (mode === 'overwrite' && !isNaN(targetIdx) && targetIdx >= 0 && targetIdx < e.questions.length) {
            e.questions[targetIdx] = qClone;
            alert(`Đã ghi đè lên câu hỏi ${targetIdx + 1} thành công!`);
        } else {
            e.questions.push(qClone);
            alert(`Đã thêm mới câu hỏi vào cuối đề kiểm tra!`);
        }
        
        app.data.saveExams();
        this.renderESubTab('select_for_q', qIdx);
    },
    moveQuestion(editIdx, qIdx, direction) {
        let e = app.data.exams[editIdx];
        if (!e || !e.questions || e.questions.length < 2) return;
        
        if (direction === 'up' && qIdx > 0) {
            let temp = e.questions[qIdx];
            e.questions[qIdx] = e.questions[qIdx - 1];
            e.questions[qIdx - 1] = temp;
        } else if (direction === 'down' && qIdx < e.questions.length - 1) {
            let temp = e.questions[qIdx];
            e.questions[qIdx] = e.questions[qIdx + 1];
            e.questions[qIdx + 1] = temp;
        } else {
            return;
        }
        app.data.saveExams();
        this.renderESubTab('add', editIdx);
    },
    submitImportExams() {
        const fileInput = document.getElementById('e-file-upload');
        if (!fileInput.files.length) return alert('Vui lòng chọn file!');
        
        const modeInput = document.querySelector('input[name="e-import-mode"]:checked');
        const mode = modeInput ? modeInput.value : 'append';
        if (mode === 'overwrite') {
            if (!confirm("CẢNH BÁO: Bạn đã chọn GHI ĐÈ. Toàn bộ đề kiểm tra hiện có sẽ bị xóa sạch và thay bằng dữ liệu mới! Bạn có chắc chắn muốn tiếp tục? (Bấm OK để Ghi đè, Cancel để Hủy)")) {
                return;
            }
        }

        app.ui.importFromExcel(fileInput.files[0], async (data) => {
            if (mode === 'overwrite') {
                app.data.exams = [];
                if (window.supabase) {
                    const { error } = await supabaseClient.from('game_exams').delete().not('id', 'is', null);
                    if (error) console.error('Delete exams error:', error);
                }
            }
            let count = 0;
            data.forEach(row => {
                if (row["Tên đề"] && row["Môn"]) {
                    app.data.exams.push({
                        name: row["Tên đề"],
                        subject: row["Môn"],
                        classlevel: row["Cấp lớp"] || 'Lớp 5',
                        period: row["Kỳ kiểm tra"] || 'Giữa kỳ 1',
                        questions: []
                    });
                    count++;
                }
            });
            app.data.saveExams();
            alert(`Đã nhập thành công ${count} đề kiểm tra (vỏ)!`);
            this.renderESubTab('lib');
        });
    },
    viewExam(idx) {
       const exam = app.data.exams[idx];
       let html = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <h3>Chi tiết đề: ${exam.name}</h3>
             <div>
                <button class="btn-primary" onclick="window.print()">In PDF / A4</button>
                <button class="btn-opt" onclick="app.admin.renderESubTab('lib')">Quay lại</button>
             </div>
          </div>
          <div id="print-area" style="background:#fff; color:#000; padding:20px; text-align:left; margin-top:20px; min-height:400px;">
             <h2 style="text-align:center;">BÀI KIỂM TRA ${exam.period.toUpperCase()}</h2>
             <p style="text-align:center;"><strong>Môn:</strong> ${exam.subject} - <strong>Lớp:</strong> ${exam.classlevel}</p>
             <hr style="margin:20px 0;">
       `;
       if (!exam.questions || exam.questions.length === 0) {
           html += `<p style="text-align:center;">Đề kiểm tra này chưa có câu hỏi nào.</p>`;
       } else {
           exam.questions.forEach((q, i) => {
               html += `
                  <div style="margin-bottom: 20px;">
                     <p><strong>Câu ${i+1} (${q.type}):</strong> ${q.q}</p>
                     ${q.options && q.options.length > 0 ? `<ul style="list-style-type:none; padding-left:20px;">${q.options.map(o => `<li>- [  ] ${o}</li>`).join('')}</ul>` : ''}
                     ${q.type === 'Điền khuyết' ? `<p>....................................................................</p>` : ''}
                  </div>
               `;
           });
       }
       html += `</div>`;
       document.getElementById('admin-e-subarea').innerHTML = html;
    },
    renderPlayers(box) {
      box.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 15px;">
           <button class="btn-primary" id="btn-sub-players" style="flex:1;" onclick="app.admin.renderPlayersList(false)">Danh sách học sinh</button>
           <button class="btn-opt" id="btn-sub-pending" style="flex:1;" onclick="app.admin.renderPlayersList(true)">Phê duyệt</button>
           <button class="btn-success" id="btn-sub-add" style="flex:1;" onclick="app.admin.showAddPlayerForm()">+ Thêm mới</button>
        </div>
        <div id="admin-subcontent-area"></div>
      `;
      this.renderPlayersList(false);
    },
    renderPlayersList(isPending) {
      document.getElementById('btn-sub-players').className = isPending ? 'btn-opt' : 'btn-primary';
      document.getElementById('btn-sub-pending').className = isPending ? 'btn-primary' : 'btn-opt';
      
      const subBox = document.getElementById('admin-subcontent-area');
      const cols = [
        { label: 'Cấp lớp', filterable: true },
        { label: 'Họ tên', filterable: true },
        { label: 'Tên đăng nhập', filterable: true },
        { label: 'Mật khẩu', filterable: false },
        { label: 'Hành động', filterable: false }
      ];
      
      let users = app.data.users.filter(u => u.role?.toLowerCase() !== 'admin');
      if (isPending) {
         users = users.filter(u => u.approved === false);
      } else {
         users = users.filter(u => u.approved !== false); // true or undefined (legacy)
      }
      
      let html = app.ui.renderTable(cols, users, (u, i) => {
        let actionBtns = '';
        if (isPending) {
            actionBtns = `<button class="btn-success action-btn" onclick="app.admin.approveUser('${u.username}')">Duyệt</button>
                          <button class="btn-danger action-btn" onclick="app.admin.deleteUser('${u.username}')">Xóa</button>`;
        } else {
            actionBtns = `<button class="btn-opt action-btn" onclick="app.admin.showAddPlayerForm('${u.username}')">Sửa</button>
                          <button class="btn-danger action-btn" onclick="app.admin.deleteUser('${u.username}')">Xóa</button>`;
        }
        return `<tr>
          <td>${app.data.sanitizeHTML(u.classlevel||'')}</td><td>${app.data.sanitizeHTML(u.fullname||'')}</td>
          <td>${app.data.sanitizeHTML(u.username)}</td><td>${app.data.sanitizeHTML(u.password||'')}</td>
          <td>${actionBtns}</td>
        </tr>`;
      }, isPending ? "Không có học sinh nào chờ duyệt" : "Chưa có học sinh nào");
      subBox.innerHTML = html;
    },
    async approveUser(username) {
        let user = app.data.users.find(u => u.username === username);
        if (user) {
            user.approved = true;
            user.history = [];
            user.totalscore = 0;
            user.lollipops = 0;
            if (user.id) {
                await supabaseClient.from('game_users').update({ approved: true, history: [], totalscore: 0, lollipops: 0 }).eq('id', user.id);
            } else {
                await app.data.saveUsers();
            }
            this.renderPlayersList(true);
        }
    },
    showAddPlayerForm(editUsername) {
        const subBox = document.getElementById('admin-subcontent-area');
        let u = (editUsername && typeof editUsername === 'string') ? app.data.users.find(x => x.username === editUsername) : null;
        subBox.innerHTML = `
          <h3>${u ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}</h3>
          <div style="max-width: 500px; margin: 0 auto; text-align:left;">
             <div style="display:flex; align-items:center; margin-bottom:10px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">Họ và tên</label>
                <input type="text" id="add-fullname" placeholder="Họ và tên" class="form-input" style="flex:1; padding:8px;" value="${u ? app.data.sanitizeHTML(u.fullname) : ''}">
             </div>
             
             <div style="display:flex; align-items:center; margin-bottom:10px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">Tên đăng nhập</label>
                <input type="text" id="add-username" placeholder="Tên đăng nhập" class="form-input" style="flex:1; padding:8px;" value="${u ? app.data.sanitizeHTML(u.username) : ''}">
             </div>
             
             <div style="display:flex; align-items:center; margin-bottom:10px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">Mật khẩu</label>
                <input type="text" id="add-password" placeholder="Mật khẩu" class="form-input" style="flex:1; padding:8px;" value="${u ? app.data.sanitizeHTML(u.password) : ''}">
             </div>
             
             <div style="display:flex; align-items:center; margin-bottom:15px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">Cấp lớp</label>
                <select id="add-class" class="form-input" style="flex:1; padding:8px;">
                   <option value="1" ${u && u.classlevel === '1' ? 'selected' : ''}>Lớp 1</option>
                   <option value="2" ${u && u.classlevel === '2' ? 'selected' : ''}>Lớp 2</option>
                   <option value="3" ${u && u.classlevel === '3' ? 'selected' : ''}>Lớp 3</option>
                   <option value="4" ${u && u.classlevel === '4' ? 'selected' : ''}>Lớp 4</option>
                   <option value="5" ${u && u.classlevel === '5' ? 'selected' : (!u ? 'selected' : '')}>Lớp 5</option>
                </select>
             </div>
             
             <button class="btn-success" onclick="app.admin.addPlayerSubmit('${typeof editUsername === 'string' ? editUsername : ''}')" style="width:100%; padding:10px;">${u ? 'Lưu chỉnh sửa' : 'Tạo tài khoản'}</button>
          </div>
        `;
    },
    addPlayerSubmit(editUsername) {
        const fn = document.getElementById('add-fullname').value.trim();
        const un = document.getElementById('add-username').value.trim();
        const pw = document.getElementById('add-password').value.trim();
        const cl = document.getElementById('add-class').value;
        if (!fn || !un || !pw) return alert('Điền đủ thông tin!');
        
        if (editUsername) {
            let user = app.data.users.find(x => x.username === editUsername);
            if (user) {
                if (un !== editUsername && app.data.users.find(x => x.username === un)) {
                    return alert('Tên đăng nhập mới đã tồn tại!');
                }
                user.fullname = fn;
                user.username = un;
                user.password = pw;
                user.classlevel = cl;
                alert('Đã cập nhật thông tin học sinh!');
            }
        } else {
            if (app.data.users.find(x => x.username === un)) return alert('Tên đăng nhập đã tồn tại!');
            app.data.users.push({ fullname: fn, username: un, password: pw, classlevel: cl, role: 'student', approved: true, history: [], totalscore: 0, lollipops: 0 });
            alert('Đã tạo tài khoản học sinh!');
        }
        app.data.saveUsers();
        this.renderPlayersList(false);
    },
    editUser(username) {
        this.showAddPlayerForm(username);
    },
    editQuestion(idx) {
        this.renderQSubTab('add', idx);
    },
    async deleteQuestion(idx) {
      if(confirm('Xác nhận xóa câu hỏi này?')) {
          const q = app.data.libraryQuestions[idx];
          app.data.libraryQuestions.splice(idx, 1);
          if (q && q.id && window.supabase) {
              await supabaseClient.from('game_questions').delete().eq('id', q.id);
          }
          app.data.saveLibrary();
          this.renderQSubTab('lib');
      }
    },
    editExam(idx) {
        this.renderESubTab('add', idx);
    },
    removeQuestionFromExam(examIdx, qIdx) {
        if(confirm('Xóa câu hỏi này khỏi đề kiểm tra?')) {
            app.data.exams[examIdx].questions.splice(qIdx, 1);
            app.data.saveExams();
            this.renderESubTab('add', examIdx);
        }
    },
    async deleteExam(idx) {
      if(confirm('Xác nhận xóa đề kiểm tra này?')) {
          const e = app.data.exams[idx];
          app.data.exams.splice(idx, 1);
          if (e && e.id && window.supabase) {
              await supabaseClient.from('game_exams').delete().eq('id', e.id);
          }
          app.data.saveExams();
          this.renderESubTab('lib');
      }
    },
    async deleteUser(username) {
      if(confirm('Xóa học sinh này?')) { 
        const user = app.data.users.find(u => u.username === username);
        app.data.users = app.data.users.filter(u => u.username !== username);
        if (user && user.id) {
            await supabaseClient.from('game_users').delete().eq('id', user.id);
        } else {
            await app.data.saveUsers();
        }
        this.switchTab('players'); 
      }
    }
  },

  treasure: {
    open() {
      const modal = document.getElementById('treasure-modal');
      modal.style.display = 'flex';
      modal.classList.add('active');
      document.getElementById('treasure-title').textContent = 'Kho Báu';
      
      const u = app.data.currentUser;
      if (!u) return;
      
      if (u.role?.toLowerCase() === 'admin') {
         this.switchTab('leaderboard');
      } else {
         this.switchTab('my_treasure');
      }
    },
    switchTab(tab) {
      const u = app.data.currentUser;
      const box = document.getElementById('treasure-content-area');
      
      if (u.role?.toLowerCase() === 'admin') {
         const tabs = [
            { id: 'leaderboard', label: 'Bảng thành tích' },
            { id: 'history', label: 'Lịch sử làm bài' }
         ];
         app.ui.renderTabs(tabs, tab, 'app.treasure.switchTab');
         
         if (tab === 'leaderboard') this.renderAdminLeaderboard(box);
         else if (tab === 'history') this.renderAdminHistory(box);
      } else {
         const tabs = [
            { id: 'my_treasure', label: 'Thành tích' },
            { id: 'history', label: 'Lịch sử làm bài' }
         ];
         app.ui.renderTabs(tabs, tab, 'app.treasure.switchTab');
         
         if (tab === 'my_treasure') this.renderStudentTreasure(box, u);
         else if (tab === 'history') this.renderStudentHistory(box, u);
      }
    },
    applyFilters(type, updateTableOnly = false) {
        const box = document.getElementById('treasure-content-area');
        if (type === 'leaderboard') {
            const cls = document.getElementById('admin-lb-class').value;
            const lim = document.getElementById('admin-lb-limit').value;
            const from = document.getElementById('admin-lb-from').value;
            const to = document.getElementById('admin-lb-to').value;
            this.renderAdminLeaderboard(box, cls, lim, from, to, updateTableOnly);
        } else {
            const cls = document.getElementById('admin-hist-class').value;
            const stu = document.getElementById('admin-hist-student').value;
            const from = document.getElementById('admin-hist-from').value;
            const to = document.getElementById('admin-hist-to').value;
            this.renderAdminHistory(box, cls, stu, from, to, updateTableOnly);
        }
    },
    showPrintModal(type) {
        window.printContext = type; // Save context for the buttons
        const modal = document.getElementById('print-modal');
        modal.style.display = 'flex';
        modal.classList.add('active');
    },
    async executePrint() {
        const mode = document.querySelector('input[name="print_mode"]:checked').value;
        this.exportToImage(mode);
    },
    renderAdminLeaderboard(box, classFilter = 'Tất cả', limitFilter = 'Tất cả theo cấp lớp', fromDate = '', toDate = '', updateTableOnly = false) {
      const cols = [
         { label: 'Hạng', filterable: false },
         { label: 'Học sinh', filterable: false },
         { label: 'Số bài đã làm', filterable: false },
         { label: 'Điểm', filterable: false },
         { label: 'Kẹo', filterable: false }
      ];
      let students = app.data.users.filter(u => u.role?.toLowerCase() !== 'admin' && u.approved === true);
      
      if (classFilter !== 'Tất cả') {
          const cls = classFilter.replace('Lớp ', '');
          students = students.filter(u => String(u.classlevel) === cls);
      }
      
      let fromTime = fromDate ? new Date(fromDate).getTime() : 0;
      let toTime = toDate ? new Date(toDate).getTime() + 86400000 - 1 : Infinity;
      
      let lbData = students.map(s => {
          let hist = s.history || [];
          if (fromDate || toDate) {
              hist = hist.filter(h => {
                  let ht = new Date(h.date).getTime();
                  return ht >= fromTime && ht <= toTime;
              });
          }
          let totalscore = hist.reduce((sum, h) => sum + parseFloat(h.score || 0), 0);
          return { ...s, filteredHistory: hist, filteredScore: totalscore };
      });
      
      if (fromDate || toDate) {
          lbData = lbData.filter(s => s.filteredHistory.length > 0);
      }
      
      lbData.sort((a,b) => b.filteredScore - a.filteredScore);
      
      if (limitFilter === 'Top 10') lbData = lbData.slice(0, 10);
      else if (limitFilter === 'Top 20') lbData = lbData.slice(0, 20);
      
      if (!updateTableOnly) {
          let html = `<div class="admin-control-panel">
             <button class="acp-btn" onclick="app.treasure.renderAdminLeaderboard(document.getElementById('treasure-content-area'))">Tất cả</button>
             <div class="acp-center">
                 <div class="acp-row">
                     <input type="hidden" id="admin-lb-class" value="${classFilter}">
                     ${['Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5'].map(c => `<button class="${c===classFilter?'btn-primary':'btn-opt'}" onclick="document.getElementById('admin-lb-class').value='${c}'; app.treasure.applyFilters('leaderboard', false)">${c}</button>`).join('')}
                 </div>
                 <div class="acp-row">
                     <input type="hidden" id="admin-lb-limit" value="${limitFilter}">
                     ${['Top 10','Top 20','Tất cả theo cấp lớp'].map(l => `<button class="${l===limitFilter?'btn-primary':'btn-opt'}" onclick="document.getElementById('admin-lb-limit').value='${l}'; app.treasure.applyFilters('leaderboard', false)">${l}</button>`).join('')}
                 </div>
                 <div class="acp-row" style="margin-top:5px;">
                     <label>Từ ngày:</label><input type="date" id="admin-lb-from" value="${fromDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('leaderboard', true)">
                     <label>Đến ngày:</label><input type="date" id="admin-lb-to" value="${toDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('leaderboard', true)">
                 </div>
             </div>
             <button class="acp-btn btn-success" onclick="app.treasure.showPrintModal('leaderboard')">In danh sách</button>
          </div>
          <div id="admin-lb-table-container"></div>`;
          box.innerHTML = html;
      }
      
      const tableHtml = app.ui.renderTable(cols, lbData, (s, i) => {
         const totalExams = s.filteredHistory.length;
         const maxScore = totalExams * 10;
         const scoreDisplay = `${s.filteredScore}/${maxScore}`;
         return `<tr><td>${i+1}</td><td>${app.data.sanitizeHTML(s.fullname)}</td><td>${totalExams}</td><td>${scoreDisplay}</td><td>${s.lollipops||0}</td></tr>`;
      });
      
      const container = document.getElementById('admin-lb-table-container');
      if (container) container.innerHTML = tableHtml;
    },
    renderAdminHistory(box, classFilter = 'Tất cả', studentFilter = '', fromDate = '', toDate = '', updateTableOnly = false) {
      const cols = [
         { label: 'Cấp lớp', filterable: false },
         { label: 'Học sinh', filterable: false },
         { label: 'Bài làm', filterable: false },
         { label: 'Chủ đề', filterable: false },
         { label: 'Độ khó', filterable: false },
         { label: 'Số câu', filterable: false },
         { label: 'Điểm', filterable: false },
         { label: 'Ngày', filterable: false },
         { label: 'Chi tiết', filterable: false }
      ];
      let allHist = [];
      app.data.users.filter(u => u.role?.toLowerCase() !== 'admin' && u.approved === true).forEach(u => {
         (u.history || []).forEach(h => {
             allHist.push({ ...h, studentName: app.data.sanitizeHTML(u.fullname), username: u.username, classlevel: u.classlevel || '' });
         });
      });
      allHist.sort((a,b) => new Date(b.date) - new Date(a.date));
      
      let classFilteredUsers = app.data.users.filter(u => u.role?.toLowerCase() !== 'admin' && u.approved === true);
      
      if (classFilter !== 'Tất cả') {
          const cls = classFilter.replace('Lớp ', '');
          allHist = allHist.filter(h => String(h.classlevel) === cls);
          classFilteredUsers = classFilteredUsers.filter(u => String(u.classlevel) === cls);
      }
      
      let searchStr = studentFilter.trim().toLowerCase();
      if (searchStr) {
          allHist = allHist.filter(h => 
              h.studentName && h.studentName.toLowerCase().includes(searchStr)
          );
      }
      
      if (fromDate) {
         const fromTime = new Date(fromDate).getTime();
         allHist = allHist.filter(h => new Date(h.date).getTime() >= fromTime);
      }
      if (toDate) {
         const toTime = new Date(toDate).getTime() + 86400000 - 1; // End of the day
         allHist = allHist.filter(h => new Date(h.date).getTime() <= toTime);
      }
      
      const studentOptions = classFilteredUsers.map(u => 
          `<option value="${u.fullname}"></option>`
      ).join('');
      
      if (!updateTableOnly) {
          let html = `<div class="admin-control-panel">
             <button class="acp-btn" onclick="app.treasure.renderAdminHistory(document.getElementById('treasure-content-area'))">Tất cả</button>
             <div class="acp-center">
                 <div class="acp-row">
                     <input type="hidden" id="admin-hist-class" value="${classFilter}">
                     ${['Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5'].map(c => `<button class="${c===classFilter?'btn-primary':'btn-opt'}" onclick="document.getElementById('admin-hist-class').value='${c}'; document.getElementById('admin-hist-student').value=''; app.treasure.applyFilters('history', false)">${c}</button>`).join('')}
                 </div>
                 <div class="acp-row">
                     <input list="admin-hist-student-list" id="admin-hist-student" class="form-input" placeholder="🔍 Nhập tìm kiếm học sinh..." value="${studentFilter}" style="width:100%; max-width:300px; padding:5px;" oninput="app.treasure.applyFilters('history', true)">
                     <datalist id="admin-hist-student-list">
                         ${studentOptions}
                     </datalist>
                 </div>
                 <div class="acp-row" style="margin-top:5px;">
                     <label>Từ ngày:</label><input type="date" id="admin-hist-from" value="${fromDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('history', true)">
                     <label>Đến ngày:</label><input type="date" id="admin-hist-to" value="${toDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('history', true)">
                 </div>
             </div>
             <button class="acp-btn btn-success" onclick="app.treasure.showPrintModal('history')">In danh sách</button>
          </div>
          <div id="admin-hist-table-container"></div>`;
          box.innerHTML = html;
      }
      
      const tableHtml = app.ui.renderTable(cols, allHist, (h, i) => {
         const encoded = encodeURIComponent(JSON.stringify(h));
         const s = parseFloat(h.score || 0);
         let scoreColor = '#fff';
         let scoreStyle = '';
         let star = '';
         
         if (s < 5) scoreColor = '#ef4444'; // Red
         else if (s >= 5 && s < 8) scoreColor = '#facc15'; // Yellow
         else if (s >= 8 && s < 10) scoreColor = '#4ade80'; // Green
         else if (s === 10) {
             scoreColor = '#22c55e'; // Bold Green
             scoreStyle = 'font-weight:bold; font-size:1.1em;';
             star = ' 🍭';
         }
         
         const scoreHtml = `<span style="color: ${scoreColor}; ${scoreStyle}">${s}/10${star}</span>`;
         const clsDisplay = h.classlevel ? (String(h.classlevel).includes('Lớp') ? h.classlevel : 'Lớp ' + h.classlevel) : '';
         
         return `<tr><td>${clsDisplay}</td><td>${h.studentName}</td><td>${h.title || h.module || 'Bài tập'}</td><td>${h.topic || '---'}</td><td>${h.difficulty || '---'}</td><td>${h.questionCount || h.details?.length || 10}</td><td>${scoreHtml}</td><td>${h.date}</td>
         <td><button class="btn-success action-btn" data-record="${encoded}" onclick="app.ui.showHistoryDetails(this)">Xem</button></td></tr>`;
      });
      
      const container = document.getElementById('admin-hist-table-container');
      if (container) container.innerHTML = tableHtml;
    },
    renderStudentTreasure(box, u) {
      let html = `<div style="text-align:center; padding: 30px 0;">
         <h3 style="font-size: 1.5rem;">Kho báu của ${app.data.sanitizeHTML(u.fullname)}</h3>
         <p style="color: #ccc; margin-top: 10px;">Tổng điểm: <span style="color:#fde047; font-weight:bold; font-size:1.2rem;">${u.totalscore||0}</span></p>
         <div style="font-size:2rem; margin:20px 0; display:flex; flex-wrap:wrap; justify-content:center; gap:5px;">`;
      const lolli = u.lollipops || 0;
      if (lolli === 0) html += `<p style="font-size: 1rem; color: #888;">Bạn chưa có kẹo nào. Hãy hoàn thành bài để nhận kẹo nhé!</p>`;
      for(let i=0; i<lolli; i++) html += '<img src="./public/lollipop.png" style="width:50px; margin:2px;" class="bounce">';
      html += '</div></div>';
      box.innerHTML = html;
    },
    renderStudentHistory(box, u) {
      const cols = [
         { label: 'Bài làm', filterable: true },
         { label: 'Chủ đề', filterable: true },
         { label: 'Độ khó', filterable: true },
         { label: 'Số câu', filterable: false },
         { label: 'Điểm', filterable: false },
         { label: 'Ngày', filterable: true },
         { label: 'Chi tiết', filterable: false }
      ];
      let myHist = [...(u.history || [])];
      myHist.sort((a,b) => new Date(b.date) - new Date(a.date));
      box.innerHTML = app.ui.renderTable(cols, myHist, (h, i) => {
         const encoded = encodeURIComponent(JSON.stringify(h));
         const s = parseFloat(h.score || 0);
         let scoreColor = '#fff';
         let scoreStyle = '';
         let star = '';
         if (s < 5) scoreColor = '#ef4444';
         else if (s >= 5 && s < 8) scoreColor = '#facc15';
         else if (s >= 8 && s < 10) scoreColor = '#4ade80';
         else if (s === 10) { scoreColor = '#22c55e'; scoreStyle = 'font-weight:bold; font-size:1.1em;'; star = ' 🍭'; }
         const scoreHtml = `<span style="color: ${scoreColor}; ${scoreStyle}">${s}/10${star}</span>`;
         return `<tr><td>${h.title || h.module || 'Bài tập'}</td><td>${h.topic || '---'}</td><td>${h.difficulty || '---'}</td><td>${h.questionCount || h.details?.length || 10}</td><td>${scoreHtml}</td><td>${h.date}</td>
         <td><button class="btn-success action-btn" data-record="${encoded}" onclick="app.ui.showHistoryDetails(this)">Xem</button></td></tr>`;
      }, "Chưa có dữ liệu lịch sử");
    },
    async exportToImage(mode) {
        document.getElementById('print-modal').style.display = 'none';
        const type = window.printContext; // 'leaderboard' or 'history'
        
        let fromDate = '', toDate = '', classFilter = 'Tất cả';
        let studentNameStr = '';
        
        if (type === 'leaderboard') {
            classFilter = document.getElementById('admin-lb-class').value;
            fromDate = document.getElementById('admin-lb-from').value;
            toDate = document.getElementById('admin-lb-to').value;
        } else {
            classFilter = document.getElementById('admin-hist-class').value;
            fromDate = document.getElementById('admin-hist-from').value;
            toDate = document.getElementById('admin-hist-to').value;
            const stu = document.getElementById('admin-hist-student').value;
            if (stu) {
                studentNameStr = stu;
                if (stu.includes(' - ')) {
                    studentNameStr = stu.split(' - ')[0]; // Extract fullname
                }
            }
        }
        
        const dateStr = (fromDate || toDate) ? `Từ ngày ${fromDate || '...'} đến ngày ${toDate || '...'}` : 'Tất cả thời gian';
        const classStr = classFilter !== 'Tất cả' ? `Cấp ${classFilter}` : 'Tất cả cấp lớp';
        
        // Setup simple print vs graphic print
        if (mode === 'simple') {
            const tableHTML = document.querySelector('#treasure-content-area .data-table').outerHTML;
            const printWin = window.open('', '_blank');
            printWin.document.write(`
                <html><head><title>In danh sách</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h2, h3 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                </style>
                </head><body>
                <h2>${type === 'leaderboard' ? 'BẢNG THÀNH TÍCH' : 'LỊCH SỬ LÀM BÀI'}</h2>
                <h3>${dateStr}</h3>
                <h3>${classStr}</h3>
                ${studentNameStr ? `<h3>Họ tên: ${studentNameStr}</h3>` : ''}
                ${tableHTML}
                </body></html>
            `);
            printWin.document.close();
            setTimeout(() => { printWin.print(); }, 500);
            return;
        }
        
        // Graphic print (2K)
        const container = document.getElementById('print-2k-container');
        const content = document.getElementById('print-2k-content');
        const dateEl = document.getElementById('print-2k-date');
        const classEl = document.getElementById('print-2k-class');
        const studentEl = document.getElementById('print-2k-student');
        const tableArea = document.getElementById('print-2k-table-area');
        
        if (type === 'leaderboard') {
            container.style.background = 'url("./public/leaderboard_bg.png") no-repeat center center';
            content.style.paddingTop = '600px';
        } else {
            container.style.background = 'url("./public/history_bg.png") no-repeat center center';
            content.style.paddingTop = '400px';
        }
        container.style.backgroundSize = 'cover';
        
        dateEl.textContent = dateStr;
        classEl.textContent = classStr;
        if (studentNameStr) {
            studentEl.style.display = 'block';
            studentEl.textContent = `Họ tên: ${studentNameStr}`;
        } else {
            studentEl.style.display = 'none';
        }
        
        // Clone table and apply huge font styling for 2K
        const sourceTable = document.querySelector('#treasure-content-area .data-table');
        if (!sourceTable) return alert("Không có dữ liệu để in.");
        
        const clonedTable = sourceTable.cloneNode(true);
        clonedTable.style.width = '100%';
        clonedTable.style.background = 'transparent';
        clonedTable.style.color = '#fff';
        clonedTable.style.fontSize = '2rem';
        clonedTable.style.borderCollapse = 'collapse';
        
        // Remove Action column (Chi tiết / Xem) if exists
        const headerRow = clonedTable.querySelector('thead tr');
        if (headerRow && headerRow.children.length > 0) {
           const lastHeader = headerRow.children[headerRow.children.length - 1];
           if (lastHeader.textContent.includes('Chi tiết') || lastHeader.textContent.includes('Hành động')) {
               lastHeader.remove();
               clonedTable.querySelectorAll('tbody tr').forEach(row => {
                  if(row.children.length > 0) row.children[row.children.length - 1].remove();
               });
           }
        }
        
        // Style cells
        clonedTable.querySelectorAll('th, td').forEach(cell => {
            cell.style.padding = '15px';
            cell.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
            cell.style.textAlign = 'center';
            if (cell.tagName === 'TH') {
                cell.style.color = '#ffd700';
                cell.style.fontWeight = 'bold';
                cell.style.borderBottom = '3px solid rgba(255,215,0,0.5)';
            }
        });
        
        tableArea.innerHTML = '';
        tableArea.appendChild(clonedTable);
        
        // Render canvas
        if (!window.html2canvas) {
            alert("Đang tải thư viện xuất ảnh, vui lòng chờ...");
            const loaded = await app.utils.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas');
            if (!loaded) return alert("Lỗi: Không tìm thấy thư viện html2canvas. Hãy kiểm tra kết nối mạng.");
        }
        
        alert("Hệ thống đang trích xuất ảnh 2K, vui lòng chờ trong giây lát...");
        
        html2canvas(container, {
            scale: 1,
            useCORS: true,
            backgroundColor: null
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${type}_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error("Lỗi xuất ảnh:", err);
            alert("Đã xảy ra lỗi khi tạo ảnh.");
        });
    }
  },

  quest: {
    init() {},
    open() {
      const modal = document.getElementById('quest-modal');
      modal.style.display = 'flex';
      modal.classList.add('active');
      this.render();
    },
    render() {
        const container = document.getElementById('quest-list-container');
        const user = app.data.currentUser;
        if (!user || user.role === 'admin') return;
        
        const clLvl = String(user.classlevel || '5').replace('Lớp ', '').trim();
        const activeQuests = (app.data.quests || []).filter(q => {
            if (!q.is_active) return false;
            if (q.assign_type === 'all') return true;
            if (q.assign_type === 'class' && q.assign_target === clLvl) return true;
            if (q.assign_type === 'user' && q.assign_target === user.username) return true;
            return false;
        });
        
        if (activeQuests.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 20px;">Hiện tại chưa có nhiệm vụ nào.</p>';
            return;
        }
        
        let html = '';
        activeQuests.forEach(q => {
            let uq = (app.data.userQuests || []).find(x => x.quest_id === q.id);
            let progress = uq ? uq.progress : 0;
            let isCompleted = uq ? uq.is_completed : false;
            
            let btnHtml = '';
            if (isCompleted) {
                btnHtml = `<button class="btn-success" style="opacity:0.5; cursor:not-allowed;" disabled>Đã nhận</button>`;
            } else if (progress >= q.target_count) {
                btnHtml = `<button class="btn-success" style="box-shadow: 0 0 10px #4ade80;" onclick="app.quest.claimReward('${q.id}')">Nhận ${q.reward_lollipops} 🍭</button>`;
            } else {
                btnHtml = `<button class="btn-primary" style="opacity:0.5; cursor:not-allowed;" disabled>${progress}/${q.target_count}</button>`;
            }
            
            html += `<div style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0 0 5px 0; color:#b45309; font-size: 1.2rem;">${app.data.sanitizeHTML(q.title)}</h4>
                    <p style="margin:0; font-size:0.9rem; color:#666;">Yêu cầu: ${q.target_subject === 'any'?'Môn bất kỳ':(q.target_subject==='math'?'Môn Toán':'Môn Tiếng Việt')} đạt >= ${q.target_score} điểm</p>
                </div>
                <div>
                    ${btnHtml}
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },
    async claimReward(questId) {
        const user = app.data.currentUser;
        if (!user) return;
        
        const q = app.data.quests.find(x => x.id === questId);
        if (!q) return;
        
        let uq = app.data.userQuests.find(x => x.quest_id === questId);
        if (!uq || uq.is_completed || uq.progress < q.target_count) return;
        
        // Cập nhật local
        uq.is_completed = true;
        user.lollipops = (user.lollipops || 0) + q.reward_lollipops;
        app.auth.updateHeader();
        
        // Hiệu ứng pháo hoa
        if (!window.confetti) {
            app.utils.loadScript('https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js', 'confetti').then(() => {
                if (window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            });
        } else {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        this.render();
        
        // Cập nhật server
        if (window.supabase) {
            await supabaseClient.from('user_quests').update({ is_completed: true }).eq('id', uq.id);
            await supabaseClient.from('game_users').update({ lollipops: user.lollipops }).eq('id', user.id);
        } else {
            app.data.saveUsers();
        }
    },
    async updateProgress(subject, score) {
        const user = app.data.currentUser;
        if (!user || user.role === 'admin') return;
        
        const clLvl = String(user.classlevel || '5').replace('Lớp ', '').trim();
        const activeQuests = (app.data.quests || []).filter(q => {
            if (!q.is_active) return false;
            if (q.assign_type === 'all' || (q.assign_type === 'class' && q.assign_target === clLvl) || (q.assign_type === 'user' && q.assign_target === user.username)) {
                if (q.target_subject === 'any' || q.target_subject === subject) {
                    if (score >= q.target_score) return true;
                }
            }
            return false;
        });
        
        for (const q of activeQuests) {
            let uq = app.data.userQuests.find(x => x.quest_id === q.id);
            if (uq && uq.is_completed) continue;
            
            if (uq) {
                uq.progress += 1;
                if (window.supabase) {
                    await supabaseClient.from('user_quests').update({ progress: uq.progress }).eq('id', uq.id);
                }
            } else {
                uq = { user_username: user.username, quest_id: q.id, progress: 1, is_completed: false };
                if (window.supabase) {
                    const { data } = await supabaseClient.from('user_quests').insert([uq]).select();
                    if (data && data.length > 0) uq = data[0];
                } else {
                    uq.id = 'temp_' + new Date().getTime();
                }
                app.data.userQuests.push(uq);
            }
        }
    }
  },

  shop: {
    init() {},
    open() {
      const modal = document.getElementById('shop-modal');
      modal.style.display = 'flex';
      modal.classList.add('active');
      this.switchTab('kiosk', document.querySelector('#shop-modal .tab-btn.active') || document.querySelector('#shop-modal .tab-btn'));
    },
    switchTab(tab, btnEl) {
      if (btnEl) {
          document.querySelectorAll('#shop-modal .tab-btn').forEach(b => b.classList.remove('active'));
          btnEl.classList.add('active');
      }
      const box = document.getElementById('shop-content-area');
      const user = app.data.currentUser;
      if (!user) return;
      
      if (tab === 'kiosk') {
          this.renderKiosk(box, user);
      } else if (tab === 'pets') {
          if (user.role === 'admin') box.innerHTML = '<p style="text-align:center; padding: 20px;">Chức năng này dành cho Học sinh.</p>';
          else this.renderPets(box, user);
      }
    },
    renderKiosk(box, user) {
        if (user.role === 'admin') {
            // Admin View
            let html = `<h3 style="text-align:center; margin-bottom:15px; color:#9333ea;">Quản lý Yêu cầu Đổi Kẹo</h3>`;
            const cols = [{label:'Học sinh'}, {label:'Số kẹo (thật)'}, {label:'Đã trừ (🍭)'}, {label:'Trạng thái'}, {label:'Hành động'}];
            const reqs = app.data.candyRequests || [];
            
            html += app.ui.renderTable(cols, reqs, (r, i) => {
                let status = '';
                if (r.status === 'pending') status = '<span style="color:#eab308;font-weight:bold;">Chờ duyệt</span>';
                else if (r.status === 'approved') status = '<span style="color:#22c55e;font-weight:bold;">Đã duyệt</span>';
                else status = '<span style="color:#ef4444;font-weight:bold;">Từ chối</span>';
                
                let actions = '';
                if (r.status === 'pending') {
                    actions = `<button class="btn-success action-btn" onclick="app.shop.approveRequest('${r.id}')">Duyệt</button>
                               <button class="btn-danger action-btn" onclick="app.shop.rejectRequest('${r.id}')">Từ chối</button>`;
                }
                
                return `<tr>
                    <td>${app.data.sanitizeHTML(r.user_username)}</td>
                    <td>${r.candy_count}</td>
                    <td>${r.amount}</td>
                    <td>${status}</td>
                    <td>${actions}</td>
                </tr>`;
            }, "Chưa có yêu cầu nào.");
            box.innerHTML = html;
        } else {
            // Student View
            const rate = 10; // 1 real candy = 10 lollipops
            let myReqs = (app.data.candyRequests || []).filter(x => x.user_username === user.username);
            
            let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="font-size: 1.2rem; font-weight: bold; color: #b45309;">
                    Bạn đang có: <span style="font-size:1.5rem; color:#f59e0b;">${user.lollipops || 0}</span> 🍭
                </div>
                <div style="font-size: 1rem; color: #666;">
                    Tỷ lệ đổi: <b style="color:#9333ea;">${rate} 🍭 = 1 🍬 (Kẹo thật)</b>
                </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; display:flex; gap:20px; align-items:center;">
                <div style="font-size: 5rem; text-align:center; animation: bounce 2s infinite;">🎰</div>
                <div style="flex:1;">
                    <h4 style="margin-top:0; color:#9333ea; font-size:1.2rem;">Máy Đổi Kẹo</h4>
                    <p style="color:#666; font-size:0.9rem; margin-bottom:10px;">Nhập số lượng kẹo mút muốn đổi thành kẹo thật nhé!</p>
                    <div style="display:flex; gap: 10px; align-items:center;">
                        <input type="number" id="kiosk-candy-count" class="form-input" min="1" placeholder="Số lượng kẹo thật" style="flex:1;">
                        <button class="btn-success" onclick="app.shop.submitCandyRequest()">Đổi Ngay</button>
                    </div>
                </div>
            </div>
            
            <h4 style="color:#9333ea;">Lịch sử Đổi Kẹo</h4>
            `;
            
            const cols = [{label:'Số kẹo'}, {label:'Đã dùng (🍭)'}, {label:'Trạng thái'}];
            html += app.ui.renderTable(cols, myReqs, (r, i) => {
                let status = r.status === 'pending' ? '<span style="color:#eab308">Chờ Cô duyệt</span>' : 
                            (r.status === 'approved' ? '<span style="color:#22c55e">Thành công! Gặp Cô để nhận</span>' : 
                            '<span style="color:#ef4444">Bị từ chối (Đã hoàn lại 🍭)</span>');
                return `<tr>
                    <td>${r.candy_count} 🍬</td>
                    <td>${r.amount} 🍭</td>
                    <td>${status}</td>
                </tr>`;
            }, "Bạn chưa đổi kẹo lần nào.");
            
            box.innerHTML = html;
        }
    },
    async submitCandyRequest() {
        const user = app.data.currentUser;
        if (!user) return;
        
        const count = parseInt(document.getElementById('kiosk-candy-count').value);
        if (!count || count < 1) return alert("Vui lòng nhập số kẹo hợp lệ!");
        
        const cost = count * 10;
        if ((user.lollipops || 0) < cost) {
            return alert(`Bạn không đủ Kẹo mút! Cần ${cost} 🍭 để đổi ${count} kẹo thật.`);
        }
        
        // Deduct locally
        user.lollipops -= cost;
        app.auth.updateHeader();
        
        const req = {
            user_username: user.username,
            amount: cost,
            candy_count: count,
            status: 'pending'
        };
        
        if (window.supabase) {
            const { data, error } = await supabaseClient.from('candy_requests').insert([req]).select();
            if (error) {
                console.error(error);
                user.lollipops += cost; // revert
                app.auth.updateHeader();
                return alert("Lỗi gửi yêu cầu!");
            }
            if (data && data.length > 0) app.data.candyRequests.push(data[0]);
            
            await supabaseClient.from('game_users').update({ lollipops: user.lollipops }).eq('id', user.id);
        } else {
            req.id = 'temp_' + new Date().getTime();
            app.data.candyRequests.push(req);
            app.data.saveUsers();
        }
        
        this.switchTab('kiosk');
        alert("Gửi yêu cầu thành công! Vui lòng chờ Giáo viên duyệt.");
    },
    async approveRequest(reqId) {
        if (!confirm("Xác nhận duyệt yêu cầu đổi kẹo này?")) return;
        const req = app.data.candyRequests.find(x => x.id === reqId);
        if (!req) return;
        
        if (window.supabase && !req.id.startsWith('temp_')) {
            const { error } = await supabaseClient.from('candy_requests').update({ status: 'approved' }).eq('id', reqId);
            if (error) return alert("Lỗi server!");
            req.status = 'approved';
        } else {
            req.status = 'approved';
        }
        this.switchTab('kiosk');
    },
    async rejectRequest(reqId) {
        if (!confirm("Xác nhận từ chối? Số kẹo 🍭 sẽ được hoàn lại cho học sinh.")) return;
        const req = app.data.candyRequests.find(x => x.id === reqId);
        if (!req) return;
        
        const user = app.data.users.find(u => u.username === req.user_username);
        
        if (window.supabase && !req.id.startsWith('temp_')) {
            const { error } = await supabaseClient.from('candy_requests').update({ status: 'rejected' }).eq('id', reqId);
            if (error) return alert("Lỗi server!");
            
            if (user) {
                user.lollipops = (user.lollipops || 0) + req.amount;
                await supabaseClient.from('game_users').update({ lollipops: user.lollipops }).eq('id', user.id);
            }
            req.status = 'rejected';
        } else {
            req.status = 'rejected';
            if (user) {
                user.lollipops = (user.lollipops || 0) + req.amount;
                app.data.saveUsers();
            }
        }
        this.switchTab('kiosk');
    },
    shopData: [
        { id: 'pet_1', name: 'Pet 1', image: 'pet_1.png', cost: 50 },
        { id: 'pet_2', name: 'Pet 2', image: 'pet_2.png', cost: 50 },
        { id: 'pet_3', name: 'Pet 3', image: 'pet_3.jpg', cost: 50 },
        { id: 'pet_4', name: 'Pet 4', image: 'pet_4.jpg', cost: 50 },
        { id: 'pet_5', name: 'Pet 5', image: 'pet_5.jpg', cost: 50 },
        { id: 'pet_6', name: 'Pet 6', image: 'pet_6.jpg', cost: 50 },
        { id: 'pet_7', name: 'Pet 7', image: 'pet_7.jpg', cost: 50 },
        { id: 'pet_8', name: 'Pet 8', image: 'pet_8.jpg', cost: 50 },
        { id: 'pet_9', name: 'Pet 9', image: 'pet_9.jpg', cost: 50 },
        { id: 'pet_10', name: 'Pet 10', image: 'pet_10.jpg', cost: 50 },
        { id: 'pet_dragon', name: 'Dragon', image: 'Pet_Dragon.jpg', cost: 100 }
    ],
    renderPets(box, user) {
        let myPets = (app.data.userPets || []).filter(x => x.user_username === user.username);
        let equippedPet = localStorage.getItem('equipped_pet_' + user.username) || 'cat_normal.png';
        
        let html = `
        <div style="display: flex; gap: 20px; height: 100%; min-height: 450px;">
            <!-- Left: Supermarket -->
            <div style="flex: 3; background: rgba(255,255,255,0.5); border-radius: 15px; padding: 15px; border: 2px solid #e2e8f0; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="color:#b45309; margin:0;">Siêu Thị Thú Cưng</h3>
                    <div style="font-size: 1.1rem; font-weight: bold; color: #d97706; background: #fef3c7; padding: 5px 15px; border-radius: 20px;">
                        Kẹo của bạn: 🍭 ${user.lollipops || 0}
                    </div>
                </div>
                <div style="flex:1; overflow-y:auto; display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; padding: 5px;" class="scroll-box">
        `;
        
        this.shopData.forEach(pet => {
            // Fake remaining logic: store in localstorage so it doesn't change every refresh
            let remainingKey = 'pet_rem_' + pet.id;
            let remaining = localStorage.getItem(remainingKey);
            if (remaining === null) {
                remaining = Math.floor(Math.random() * 5) + 1; // 1 to 5
                localStorage.setItem(remainingKey, remaining);
            }
            
            const hasPet = myPets.some(p => p.pet_image === pet.image);
            
            html += `
            <div style="background: white; border: 2px solid #cbd5e1; border-radius: 12px; padding: 10px; text-align:center; position:relative; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                ${hasPet ? `<div style="position:absolute; top:5px; right:5px; background:#22c55e; color:white; font-size:0.7rem; padding:2px 5px; border-radius:5px;">Đã sở hữu</div>` : ''}
                <div style="height:80px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">
                    <img src="./public/${pet.image}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:10px;">
                </div>
                <div style="font-weight:bold; color: #333; font-size: 0.9rem;">${pet.name}</div>
                <div style="font-size: 0.8rem; color: #ef4444; margin-bottom: 5px;">Còn lại: ${remaining}</div>
                <button class="btn-primary" style="width:100%; padding:5px; font-size:0.85rem;" 
                    onclick="app.shop.buyPet('${pet.id}')"
                    ${(hasPet || remaining == 0) ? 'disabled style="opacity:0.5;"' : ''}>
                    Đổi: ${pet.cost} 🍭
                </button>
            </div>`;
        });
        
        html += `
                </div>
            </div>
            
            <!-- Right: Your Pets -->
            <div style="flex: 2; background: rgba(255,255,255,0.8); border-radius: 15px; padding: 15px; border: 2px dashed #9333ea;">
                <h3 style="color:#9333ea; margin-top:0; text-align:center;">Thú Cưng Của Bạn</h3>
                <p style="text-align:center; font-size:0.85rem; color:#666;">(Tối đa 3 Thú cưng)</p>
                <div style="display:flex; flex-direction:column; gap:15px; margin-top: 15px;">
        `;
        
        for (let i = 0; i < 3; i++) {
            const p = myPets[i];
            if (p) {
                const isEquipped = (equippedPet === p.pet_image);
                const shopInfo = this.shopData.find(x => x.image === p.pet_image) || {cost: 50};
                const refund = Math.floor(shopInfo.cost / 2);
                
                html += `
                <div style="background: ${isEquipped ? '#fefce8' : 'white'}; border: 2px solid ${isEquipped ? '#eab308' : '#e2e8f0'}; border-radius: 12px; padding: 10px; display:flex; gap:10px; align-items:center; position:relative;">
                    ${isEquipped ? `<div style="position:absolute; top:-10px; right:-10px; font-size:1.5rem;" class="heartbeat">⭐</div>` : ''}
                    <div style="width:60px; height:60px; flex-shrink:0;">
                        <img src="./public/${p.pet_image}" style="width:100%; height:100%; object-fit:contain; border-radius:8px;">
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:0.9rem;">${p.pet_name}</div>
                        <div style="display:flex; gap:5px; margin-top:5px;">
                            <button class="btn-success" style="padding:2px 8px; font-size:0.75rem; flex:1;" onclick="app.shop.equipPet('${p.pet_image}')">${isEquipped ? 'Đang dùng' : 'Sử dụng'}</button>
                            <button class="btn-danger" style="padding:2px 8px; font-size:0.75rem; flex:1;" onclick="app.shop.returnPet('${p.id}', '${p.pet_image}')">Trả lại (+${refund}🍭)</button>
                        </div>
                    </div>
                </div>
                `;
            } else {
                // Empty slot
                html += `
                <div style="background: rgba(0,0,0,0.02); border: 2px dashed #cbd5e1; border-radius: 12px; height: 85px; display:flex; justify-content:center; align-items:center; color:#94a3b8; font-size:1.2rem;">
                    Trống
                </div>
                `;
            }
        }
        
        html += `
                </div>
            </div>
        </div>`;
        
        box.innerHTML = html;
    },
    async buyPet(petId) {
        const user = app.data.currentUser;
        if (!user) return;
        
        let myPets = (app.data.userPets || []).filter(x => x.user_username === user.username);
        if (myPets.length >= 3) {
            return alert("Bạn đã sở hữu tối đa 3 thú cưng! Hãy trả lại một bé để đổi bé mới.");
        }
        
        const pet = this.shopData.find(x => x.id === petId);
        if (!pet) return;
        
        if ((user.lollipops || 0) < pet.cost) {
            return alert(`Bạn không đủ Kẹo! Cần ${pet.cost} 🍭.`);
        }
        
        // Deduct
        user.lollipops -= pet.cost;
        app.auth.updateHeader();
        
        // Update remaining count
        let remainingKey = 'pet_rem_' + pet.id;
        let remaining = parseInt(localStorage.getItem(remainingKey)) || 0;
        localStorage.setItem(remainingKey, remaining - 1);
        
        const newPet = {
            user_username: user.username, pet_name: pet.name, pet_image: pet.image, rarity: 'common'
        };
        
        if (window.supabase) {
            await supabaseClient.from('game_users').update({ lollipops: user.lollipops }).eq('id', user.id);
            const { data } = await supabaseClient.from('user_pets').insert([newPet]).select();
            if (data && data.length > 0) app.data.userPets.push(data[0]);
        } else {
            app.data.saveUsers();
            newPet.id = 'temp_' + new Date().getTime();
            app.data.userPets.push(newPet);
        }
        
        if (window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        this.switchTab('pets');
    },
    async returnPet(userPetId, petImage) {
        const user = app.data.currentUser;
        if (!user) return;
        
        if (!confirm("Bạn có chắc chắn muốn trả lại thú cưng này? Bạn sẽ nhận lại 50% số kẹo mút.")) return;
        
        const shopInfo = this.shopData.find(x => x.image === petImage) || {cost: 50, id: 'pet_1'};
        const refund = Math.floor(shopInfo.cost / 2);
        
        // Refund
        user.lollipops = (user.lollipops || 0) + refund;
        app.auth.updateHeader();
        
        // Increase remaining
        let remainingKey = 'pet_rem_' + shopInfo.id;
        let remaining = parseInt(localStorage.getItem(remainingKey)) || 0;
        localStorage.setItem(remainingKey, remaining + 1);
        
        // Remove pet
        app.data.userPets = app.data.userPets.filter(x => x.id !== userPetId);
        
        // Un-equip if equipped
        let equippedPet = localStorage.getItem('equipped_pet_' + user.username);
        if (equippedPet === petImage) {
            localStorage.removeItem('equipped_pet_' + user.username);
        }
        
        if (window.supabase && !userPetId.startsWith('temp_')) {
            await supabaseClient.from('game_users').update({ lollipops: user.lollipops }).eq('id', user.id);
            await supabaseClient.from('user_pets').delete().eq('id', userPetId);
        } else {
            app.data.saveUsers();
        }
        
        this.switchTab('pets');
    },
    equipPet(petImage) {
        const user = app.data.currentUser;
        if (!user) return;
        localStorage.setItem('equipped_pet_' + user.username, petImage);
        this.switchTab('pets');
    }

  }
};

window.onload = async () => {
  try {
    await app.data.init();
  } catch(e) {
    console.error("Error during app init:", e);
  }
  try {
    app.auth.init();
    app.game.init();
  } catch(e) {
    console.error("Error binding UI:", e);
  }
  
  const handleNetworkChange = () => {
      const isOnline = navigator.onLine;
      const noti = document.getElementById('admin-notification');
      if (noti) {
          if (!isOnline) {
              noti.style.display = 'block';
              noti.textContent = '⚠ Mất kết nối mạng! Trò chơi tạm ngưng để bảo toàn dữ liệu.';
              document.querySelectorAll('.station').forEach(el => el.style.pointerEvents = 'none');
          } else {
              noti.style.display = 'none';
              document.querySelectorAll('.station').forEach(el => el.style.pointerEvents = 'auto');
          }
      }
  };
  window.addEventListener('offline', handleNetworkChange);
  window.addEventListener('online', handleNetworkChange);
  handleNetworkChange();
};

