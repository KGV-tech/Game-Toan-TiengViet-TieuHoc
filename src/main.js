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
    console.warn("Supabase SDK not loaded. Cháº¡y á»Ÿ cháº¿ Ä‘á»™ Offline (Local) hoÃ n toÃ n.");
}
const defaultUsers = [];
const defaultLibraryQuestions = [];
const defaultExams = [];

const app = {
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
  data: {
    users: [],
    libraryQuestions: [],
    exams: [],
    currentUser: null,
    
    async init() {
      try {
        // 1. Fetch Users
        const { data: usersData, error: usersErr } = await supabaseClient.from('game_users').select('*');
        if (usersErr) {
          console.error('Error fetching users:', usersErr);
          this.users = [];
        } else {
          this.users = usersData || []; this.users.forEach(u => { if (!Array.isArray(u.history)) u.history = []; });
        }
        
        // Ensure Admin exists
        if (!this.users.find(u => u.username === 'admin')) {
          const adminUser = { username: 'admin', password: '123', role: 'admin', fullname: 'Admin', history: [], totalscore: 0, lollipops: 0, classlevel: '5', approved: true };
          this.users.push(adminUser);
          await supabaseClient.from('game_users').insert([adminUser]);
        }
        
        // 2. Fetch Questions
        const { data: qData, error: qErr } = await supabaseClient.from('game_questions').select('*');
        if (qErr) {
          console.error('Error fetching questions:', qErr);
          this.libraryQuestions = [];
        } else {
          this.libraryQuestions = qData || [];
        }
        
        // 3. Fetch Exams
        const { data: eData, error: eErr } = await supabaseClient.from('game_exams').select('*');
        if (eErr) {
          console.error('Error fetching exams:', eErr);
          this.exams = [];
        } else {
          this.exams = eData || [];
        }
        
        // Realtime subscription
        supabaseClient.channel('custom-all-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_users' }, async (payload) => {
              console.log('Realtime DB Change received!', payload);
              if (payload.eventType === 'INSERT') { if (!Array.isArray(payload.new.history)) payload.new.history = [];
                  if (!this.users.find(u => u.id === payload.new.id)) this.users.push(payload.new);
              } else if (payload.eventType === 'UPDATE') { if (!Array.isArray(payload.new.history)) payload.new.history = [];
                  const idx = this.users.findIndex(u => u.id === payload.new.id);
                  if (idx > -1) this.users[idx] = payload.new;
                  
                  // If it's the current user, update their header (e.g. admin approved them, or points changed from another device)
                  if (this.currentUser && this.currentUser.id === payload.new.id) {
                      this.currentUser = payload.new;
                      app.auth.updateHeader();
                  }
              } else if (payload.eventType === 'DELETE') {
                  this.users = this.users.filter(u => u.id !== payload.old.id);
              }
              // Auto-refresh admin panel if open
              if (app.admin && document.getElementById('admin-station').style.display === 'flex') {
                  if (document.querySelector('.tab-btn.active').textContent.includes('Há»c Sinh')) {
                      app.admin.renderPlayersList(document.getElementById('admin-subcontent-area').innerHTML.includes('chá» duyá»‡t'));
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

      // Inject Mock Data if empty
      if (this.libraryQuestions.length === 0) {
          const mockQ = [
              { type: 'Tráº¯c nghiá»‡m', subject: 'ToÃ¡n', classlevel: 'Lá»›p 5', topic: 'Sá»‘ tháº­p phÃ¢n', q: 'Káº¿t quáº£ cá»§a 2.5 + 3.7 lÃ ?', ans: '6.2', options: ['5.2', '6.2', '6.5', '7.2'] },
              { type: 'Äiá»n khuyáº¿t', subject: 'Tiáº¿ng Viá»‡t', classlevel: 'Lá»›p 5', topic: 'Tá»« vá»±ng', q: 'Tá»« trÃ¡i nghÄ©a vá»›i "Rá»™ng lá»›n" lÃ  cháº­t ...', ans: 'háº¹p', options: [] },
              { type: 'ÄÃºng/Sai', subject: 'ToÃ¡n', classlevel: 'Lá»›p 5', topic: 'PhÃ¢n sá»‘', q: 'PhÃ¢n sá»‘ 1/2 báº±ng phÃ¢n sá»‘ 2/4. ÄÃºng hay Sai?', ans: 'ÄÃºng', options: ['ÄÃºng', 'Sai'] },
              { type: 'So sÃ¡nh', subject: 'ToÃ¡n', classlevel: 'Lá»›p 5', topic: 'Sá»‘ tháº­p phÃ¢n', q: 'So sÃ¡nh: 5.09 ... 5.1', ans: '<', options: ['<', '>', '='] },
              { type: 'Chuá»—i Quy luáº­t', subject: 'ToÃ¡n', classlevel: 'Lá»›p 5', topic: 'DÃ£y sá»‘', q: 'Äiá»n sá»‘ tiáº¿p theo: 2, 4, 6, 8, ...', ans: '10', options: [] },
              { type: 'KÃ©o tháº£', subject: 'Tiáº¿ng Viá»‡t', classlevel: 'Lá»›p 5', topic: 'Cáº¥u táº¡o tá»«', q: 'Chá»n tá»« ghÃ©p thÃ­ch há»£p: [xanh biáº¿c, xanh xao, xanh tÆ°Æ¡i]', ans: 'xanh tÆ°Æ¡i', options: ['xanh biáº¿c', 'xanh xao', 'xanh tÆ°Æ¡i'] }
          ];
          this.libraryQuestions = mockQ;
          await this.saveLibrary();
      }
      if (this.exams.length === 0) {
          this.exams.push({
              name: 'Äá» máº«u ToÃ¡n & TV',
              subject: 'ToÃ¡n',
              classlevel: 'Lá»›p 5',
              period: 'Giá»¯a ká»³ 1',
              questions: JSON.parse(JSON.stringify(this.libraryQuestions))
          });
          await this.saveExams();
      }
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
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(screenId).classList.add('active');
    },
    openGameView(viewId) {
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
    async login() {
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value.trim();
      
      try {
          // Pull fresh data from DB on login just to be sure we have the latest approved status
          const { data: freshUsers, error: fetchErr } = await supabaseClient.from('game_users').select('*');
          if (fetchErr) {
              console.error("Login fetch error:", fetchErr);
          }
          if (freshUsers) {
              freshUsers.forEach(u => { if (!Array.isArray(u.history)) u.history = []; }); app.data.users = freshUsers;
          }
      } catch (err) {
          console.error("Supabase failed during login:", err);
      }
      
      // Ensure admin exists in case of DB sync issues
      if (!app.data.users.find(u => u.username === 'admin')) {
          const adminUser = { username: 'admin', password: '123', role: 'admin', fullname: 'Admin', history: [], totalscore: 0, lollipops: 0, classlevel: '5', approved: true };
          app.data.users.push(adminUser);
          // Try to insert again just in case
          supabaseClient.from('game_users').insert([adminUser]).then(({error}) => {
              if (error) console.error("Admin insert error:", error);
          });
      }
      
      const user = app.data.users.find(x => (x.username === u || x.fullname === u) && x.password === p);
      
      if (user) {
        if (user.role?.toLowerCase() !== 'admin' && user.approved === false) {
           alert('TÃ i khoáº£n cá»§a báº¡n Ä‘ang chá» phÃª duyá»‡t tá»« GiÃ¡o viÃªn!');
           return;
        }
        app.data.currentUser = user;
        await app.data.updateUserScore();
        this.updateHeader();
        
        if (user.role?.toLowerCase() === 'admin') {
          document.getElementById('admin-station').style.display = 'flex';
        } else {
          document.getElementById('admin-station').style.display = 'none';
        }
        app.router.open('map-screen');
      } else {
        alert('Sai tÃªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u!');
      }
    },
    async register() {
      const fn = document.getElementById('reg-fullname').value.trim();
      const un = document.getElementById('reg-username').value.trim();
      const pw = document.getElementById('reg-password').value.trim();
      const cl = document.getElementById('reg-class').value;
      
      if (!fn || !un || !pw) {
        alert('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin!');
        return;
      }
      
      // Check in DB to be absolutely sure
      const { data: existingUser } = await supabaseClient.from('game_users').select('username').eq('username', un).single();
      if (existingUser || app.data.users.find(x => x.username === un)) {
        alert('TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ tá»“n táº¡i!');
        return;
      }
      
      const newUser = {
        fullname: fn,
        username: un,
        password: pw,
        classlevel: cl,
        role: 'student',
        approved: false,
        history: [],
        totalscore: 0,
        lollipops: 0
      };
      
      const { data, error } = await supabaseClient.from('game_users').insert([newUser]).select();
      if (error) {
          alert('CÃ³ lá»—i xáº£y ra khi káº¿t ná»‘i mÃ¡y chá»§!');
          console.error(error);
          return;
      }
      
      if (data && data[0]) {
          newUser.id = data[0].id;
      }
      
      app.data.users.push(newUser);
      alert('ÄÄƒng kÃ½ thÃ nh cÃ´ng!');
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
        <strong>${app.data.currentUser.fullname}</strong> (${app.data.currentUser.role?.toLowerCase() === 'admin' ? 'Admin' : 'Lá»›p ' + app.data.currentUser.classlevel})<br>
        ${app.data.currentUser.role?.toLowerCase() !== 'admin' ? `Äiá»ƒm: ${app.data.currentUser.totalscore} | Káº¹o: ${app.data.currentUser.lollipops} ðŸ­` : ''}
      `;
      document.getElementById('player-info').innerHTML = html;
    }
  },

  constants: {
    topics: {
      "1": {
        math: [
          'CÃ¡c sá»‘ Ä‘áº¿n 10', 'CÃ¡c sá»‘ Ä‘áº¿n 100', 'LÃ m quen vá»›i hÃ¬nh khá»‘i', 'LÃ m quen vá»›i má»™t sá»‘ hÃ¬nh pháº³ng',
          'PhÃ©p cá»™ng trá»« khÃ´ng nhá»› pháº¡m vi 100', 'PhÃ©p cá»™ng trá»« pháº¡m vi 10', 'Thá»i gian vÃ  lá»‹ch',
          'Ã”n táº­p ToÃ¡n Lá»›p 1', 'Äá»™ dÃ i vÃ  Äo Ä‘á»™ dÃ i'
        ],
        vietnamese: [
          'MÃ¡i trÆ°á»ng máº¿n yÃªu', 'MÃ¡i áº¥m gia Ä‘Ã¬nh', 'Nhá»¯ng bÃ i há»c nhá»', 'TÃ´i vÃ  cÃ¡c báº¡n', 'Äiá»u kÃ¬ diá»‡u quanh ta'
        ]
      },
      "2": {
        math: [
          'CÃ¡c sá»‘ Ä‘áº¿n 1000', 'Cá»™ng trá»« cÃ³ nhá»› pháº¡m vi 100', 'Cá»™ng trá»« cÃ³ nhá»› pháº¡m vi 1000',
          'Cá»™ng trá»« khÃ´ng nhá»› pháº¡m vi 1000', 'HÃ¬nh pháº³ng, hÃ¬nh khá»‘i Lá»›p 2', 'Khá»‘i lÆ°á»£ng, dung tÃ­ch',
          'NgÃ y - ThÃ¡ng - Giá» - PhÃºt', 'PhÃ©p nhÃ¢n, phÃ©p chia', 'Thá»‘ng kÃª, xÃ¡c suáº¥t Lá»›p 2', 'Ã”n táº­p ToÃ¡n Lá»›p 2'
        ],
        vietnamese: [
          'Em lá»›n lÃªn tá»«ng ngÃ y', 'Giao tiáº¿p vÃ  káº¿t ná»‘i', 'HÃ nh tinh cá»§a chÃºng mÃ¬nh', 'MÃ¡i áº¥m gia Ä‘Ã¬nh Lá»›p 2',
          'Niá»m vui tuá»•i thÆ¡', 'Viá»‡t Nam quÃª hÆ°Æ¡ng em', 'Váº» Ä‘áº¹p quanh em', 'Äi há»c vui sao'
        ]
      },
      "3": {
        math: [
          'Báº£ng nhÃ¢n, báº£ng chia', 'Chu vi, diá»‡n tÃ­ch hÃ¬nh pháº³ng', 'CÃ¡c sá»‘ Ä‘áº¿n 10 000', 'CÃ¡c sá»‘ Ä‘áº¿n 100 000',
          'Cá»™ng trá»« pháº¡m vi 10 000', 'NhÃ¢n chia pháº¡m vi 10 000', 'PhÃ©p nhÃ¢n, chia pháº¡m vi 1000',
          'Thá»‘ng kÃª vÃ  XÃ¡c suáº¥t Lá»›p 3', 'Ã”n táº­p ToÃ¡n Lá»›p 3', 'Äiá»ƒm, Ä‘oáº¡n tháº³ng, gÃ³c', 'ÄÆ¡n vá»‹ Ä‘o Ä‘á»™ dÃ i, khá»‘i lÆ°á»£ng, nhiá»‡t Ä‘á»™'
        ],
        vietnamese: [
          'BÃ i há»c tá»« cuá»™c sá»‘ng', 'Cá»•ng trÆ°á»ng rá»™ng má»Ÿ', 'Cá»™ng Ä‘á»“ng gáº¯n bÃ³', 'MÃ¡i áº¥m gia Ä‘Ã¬nh Lá»›p 3',
          'Nhá»¯ng sáº¯c mÃ u thiÃªn nhiÃªn', 'Nhá»¯ng tráº£i nghiá»‡m thÃº vá»‹', 'TrÃ¡i Äáº¥t cá»§a chÃºng mÃ¬nh', 'Äáº¥t nÆ°á»›c ngÃ n nÄƒm'
        ]
      },
      "4": {
        math: [
          'Bá»‘n phÃ©p tÃ­nh vá»›i PhÃ¢n sá»‘', 'DÃ£y sá»‘ liá»‡u, biá»ƒu Ä‘á»“ cá»™t', 'GÃ³c vÃ  Ä‘Æ¡n vá»‹ Ä‘o gÃ³c', 'HÃ¬nh bÃ¬nh hÃ nh, HÃ¬nh thoi',
          'PhÃ¢n sá»‘', 'PhÃ©p cá»™ng, trá»« sá»‘ tá»± nhiÃªn', 'PhÃ©p nhÃ¢n, chia sá»‘ tá»± nhiÃªn', 'Sá»‘ cÃ³ nhiá»u chá»¯ sá»‘',
          'TÃ¬m hai sá»‘ khi biáº¿t Tá»•ng vÃ  Hiá»‡u', 'Ã”n táº­p ToÃ¡n Lá»›p 4', 'Äáº¡i lÆ°á»£ng (Yáº¿n, táº¡, táº¥n, tháº¿ ká»‰)'
        ],
        vietnamese: [
          'Cháº¯p cÃ¡nh Æ°á»›c mÆ¡', 'Má»—i ngÆ°á»i má»™t váº»', 'Niá»m vui sÃ¡ng táº¡o', 'Sá»‘ng Ä‘á»ƒ yÃªu thÆ°Æ¡ng',
          'Tháº¿ giá»›i quanh ta', 'Tráº£i nghiá»‡m vÃ  khÃ¡m phÃ¡', 'TÃ¬nh yÃªu cuá»™c sá»‘ng', 'Uá»‘ng nÆ°á»›c nhá»› nguá»“n'
        ]
      },
      "5": {
        math: [
          'Bá»‘n phÃ©p tÃ­nh sá»‘ tháº­p phÃ¢n', 'Chu vi & Diá»‡n tÃ­ch hÃ¬nh trÃ²n', 'HÃ¬nh láº­p phÆ°Æ¡ng, Há»™p CN',
          'HÃ¬nh tam giÃ¡c, HÃ¬nh thang', 'Sá»‘ tháº­p phÃ¢n', 'Thá»‘ng kÃª & Biá»ƒu Ä‘á»“', 'ToÃ¡n chuyá»ƒn Ä‘á»™ng Ä‘á»u',
          'Tá»‰ sá»‘ pháº§n trÄƒm', 'Ã”n táº­p ToÃ¡n Lá»›p 5', 'Ã”n táº­p sá»‘ tá»± nhiÃªn vÃ  phÃ¢n sá»‘', 'Äo lÆ°á»ng & Äáº¡i lÆ°á»£ng'
        ],
        vietnamese: [
          'HÆ°Æ¡ng sáº¯c trÄƒm miá»n', 'Nghá»‡ thuáº­t muÃ´n mÃ u', 'ThiÃªn nhiÃªn kÃ¬ thÃº', 'Tháº¿ giá»›i cá»§a chÃºng ta',
          'Tháº¿ giá»›i tuá»•i thÆ¡', 'Tiáº¿p bÆ°á»›c cha Ã´ng', 'TrÃªn con Ä‘Æ°á»ng há»c táº­p', 'Váº» Ä‘áº¹p cuá»™c sá»‘ng'
        ]
      }
    }
  },

  game: {
    state: { subject: '', topicMode: 'single', selectedTopics: [], difficulty: 'medium', count: 10, questions: [], currentIdx: 0, score: 0, selectedAns: null, historyDetails: [] },
    
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
    },
    openConfig(subject) {
      this.state.subject = subject;
      this.state.selectedTopics = [];
      this.state.topicMode = 'single';
      
      document.getElementById('game-config-title').textContent = subject === 'math' ? 'VUI Há»ŒC TOÃN' : 'VUI Há»ŒC TIáº¾NG VIá»†T';
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
      // Set 'medium' active
      const difficultyBtns = document.querySelectorAll('.config-section .diff-options:not(#admin-class-btns) .btn-opt');
      if (difficultyBtns.length > 1) difficultyBtns[1].classList.add('active');
      
      const countOpts = document.querySelectorAll('.count-options .btn-opt');
      if (countOpts.length) countOpts[0].classList.add('active');
      
      this.state.difficulty = 'medium';
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
      clLevel = String(clLevel).replace('Lá»›p ', '').trim();
      
      const topicDict = app.constants.topics[clLevel] || { math: [], vietnamese: [] };
      const topics = this.state.subject === 'math' ? topicDict.math : topicDict.vietnamese;
      
      const container = document.getElementById('topics-list');
      container.innerHTML = '';
      topics.forEach(t => {
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
        alert('Vui lÃ²ng chá»n Ã­t nháº¥t 1 chá»§ Ä‘á»!');
        return;
      }
      
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
      clLevel = String(clLevel).replace('Lá»›p ', '').trim();

      const mappedSubject = this.state.subject === 'math' ? 'ToÃ¡n' : 'Tiáº¿ng Viá»‡t';
      const mappedDiff = this.state.difficulty === 'easy' ? 'Dá»…' : (this.state.difficulty === 'medium' ? 'Vá»«a' : 'KhÃ³');
      
      let pool = app.data.libraryQuestions.filter(q => {
        const qSub = String(q.subject || '').trim().toLowerCase();
        const mSub = mappedSubject.toLowerCase();
        
        const qClass = String(q.classlevel || '').trim().toLowerCase();
        const clLvl = String(clLevel).toLowerCase();
        
        const qDiff = String(q.difficulty || '').trim().toLowerCase();
        const mDiff = mappedDiff.toLowerCase();
        
        const qTopic = String(q.topic || '').trim().toLowerCase();
        
        const matchSub = (qSub === mSub || qSub === this.state.subject.toLowerCase() || qSub.includes(mSub) || mSub.includes(qSub));
        const matchClass = (!qClass || qClass === clLvl || qClass === ('lá»›p ' + clLvl) || qClass === ('lop ' + clLvl) || qClass.includes(clLvl));
        const matchDiff = (!qDiff || this.state.difficulty === 'shuffle' || qDiff === mDiff || qDiff === this.state.difficulty.toLowerCase());
        const matchTopic = (!qTopic || this.state.selectedTopics.some(t => {
            const tNorm = String(t).toLowerCase();
            return tNorm.includes(qTopic) || qTopic.includes(tNorm);
        }));
        
        return matchSub && matchClass && matchDiff && matchTopic;
      });
      
      if (pool.length < this.state.count) {
        alert('NgÃ¢n hÃ ng khÃ´ng Ä‘á»§ ' + this.state.count + ' cÃ¢u há»i, sáº½ láº¥y táº¥t cáº£ cÃ¢u hiá»‡n cÃ³!');
      }
      
      if (pool.length > this.state.count) {
          const byType = {};
          pool.forEach(q => {
              const t = (q.type || 'Tráº¯c nghiá»‡m').trim();
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
        alert('KhÃ´ng cÃ³ cÃ¢u há»i phÃ¹ há»£p! Vui lÃ²ng nháº­p thÃªm dá»¯ liá»‡u vÃ o thÆ° viá»‡n.');
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
      if (confirm('Báº¡n chÆ°a hoÃ n thÃ nh, thoÃ¡t giá»¯a chá»«ng sáº½ khÃ´ng Ä‘Æ°á»£c ghi nháº­n Ä‘iá»ƒm!')) {
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
      document.getElementById('play-cat-img').src = './public/cat_normal.png';
      
      let qHtml = q.q;
      if (q.imageUrl) qHtml += `<br><img src="${q.imageUrl}" style="max-height:200px; margin-top:10px;">`;
      document.getElementById('game-question-container').innerHTML = qHtml;
      
      const optContainer = document.getElementById('game-options-container');
      optContainer.innerHTML = '';
      this.state.selectedAns = null;
      
      const btnCheck = document.getElementById('submit-ans-btn');
      btnCheck.disabled = true;
      document.getElementById('submit-ans-text').textContent = 'Kiá»ƒm Tra';
      btnCheck.onclick = () => this.submitAnswer();
      
      let qType = (q.type || 'Tráº¯c nghiá»‡m').trim();
      let opts = q.options || [];
      
      if (opts.length === 0) {
          if (qType === 'ÄÃºng/Sai') opts = ['ÄÃºng', 'Sai'];
          else if (qType === 'So sÃ¡nh') opts = ['>', '<', '='];
          else if (qType === 'Tráº¯c nghiá»‡m') opts = [q.ans];
          else qType = 'Äiá»n khuyáº¿t';
      }
      
      if (qType === 'Tráº¯c nghiá»‡m') {
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
      } else if (qType === 'ÄÃºng/Sai') {
        optContainer.className = 'options-grid true_false';
        opts.forEach((opt) => {
          const btn = document.createElement('div');
          const isTrue = opt.toLowerCase() === 'Ä‘Ãºng';
          btn.className = `tf-card ${isTrue ? 'tf-true' : 'tf-false'}`;
          btn.innerHTML = `<div>${isTrue ? 'âœ”ï¸' : 'âŒ'}</div><div class="ans-text">${opt}</div>`;
          btn.onclick = () => {
            optContainer.querySelectorAll('.tf-card').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            this.state.selectedAns = opt;
            btnCheck.disabled = false;
          };
          optContainer.appendChild(btn);
        });
      } else if (qType === 'So sÃ¡nh') {
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
      } else if (qType === 'KÃ©o tháº£') {
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
                  // Text might have colon like "Ná»‘i má»—i phÃ©p tÃ­nh: 18.3 + 8.2". We want to keep the text, just add a slot.
                  let label = parts[i].trim();
                  if (i === 0 && label.includes(':')) {
                      // e.g. "Ná»‘i má»—i phÃ©p tÃ­nh: 18.3 + 8.2"
                      const spl = label.split(':');
                      html += `<span>${spl[0]}:</span>`;
                      label = spl.slice(1).join(':').trim();
                  }
                  html += `<div style="display:flex; align-items:center; gap:10px; font-size:1.5rem; justify-content:center;">
                             <span>${label}</span>
                             <span style="color:#fde047;">âž”</span>
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
      } else if (qType === 'Chuá»—i quy luáº­t') {
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
                  if (text) html += `<div class="train-arrow">âž”</div>`;
                  html += `<div class="train-node train-slot seq-slot" data-index="${i}">?</div>`;
                  if (i < parts.length - 2) html += `<div class="train-arrow">âž”</div>`;
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
          const buttons = ['7','8','9','4','5','6','1','2','3','XÃ³a','0'];
          buttons.forEach(btnText => {
              const btn = document.createElement('button');
              btn.className = 'num-btn';
              if (btnText === '0') btn.classList.add('zero');
              if (btnText === 'XÃ³a') btn.classList.add('del');
              btn.textContent = btnText;
              btn.onclick = () => {
                  const idx = this.state.focusedSeqSlot;
                  if (idx < 0 || idx >= numSlots) return;
                  
                  let currentVal = this.state.seqAnswers[idx];
                  if (btnText === 'XÃ³a') {
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
      } else if (qType === 'Äiá»n khuyáº¿t') {
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
    },
    submitAnswer() {
      const q = this.state.questions[this.state.currentIdx];
      let isCorrect = false;
      let qType = q.type || 'Tráº¯c nghiá»‡m';
      let opts = q.options || [];
      
      if (opts.length === 0) {
          if (qType !== 'ÄÃºng/Sai' && qType !== 'So sÃ¡nh' && qType !== 'Tráº¯c nghiá»‡m') {
              qType = 'Äiá»n khuyáº¿t';
          }
      }
      
      if (qType === 'Äiá»n khuyáº¿t') {
         const ansArr = this.getAnsArr(q.ans);
         const selectedArr = this.getAnsArr(this.state.selectedAns);
         isCorrect = selectedArr.every((val, i) => val.toLowerCase() === (ansArr[i] || '').toString().toLowerCase());
         const parts = (q.q || '').split(/\.\.\.|___/);
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
             corr.innerHTML = `âœ… ÄÃ¡p Ã¡n Ä‘Ãºng: <b>${q.ans}</b>`;
             optContainer.appendChild(corr);
         }
      } else if (qType === 'Tráº¯c nghiá»‡m') {
         isCorrect = this.state.selectedAns === q.ans;
         const optContainer = document.getElementById('game-options-container');
         optContainer.querySelectorAll('.ans-btn').forEach(btn => {
             const text = btn.querySelector('.ans-text').textContent;
             if (text === q.ans) {
                 btn.classList.add('correct');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = 'âœ”ï¸';
                 btn.appendChild(icon);
             } else if (btn.classList.contains('selected')) {
                 btn.classList.add('wrong');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = 'âŒ';
                 btn.appendChild(icon);
             }
         });
      } else if (qType === 'ÄÃºng/Sai') {
         isCorrect = this.state.selectedAns === q.ans;
         const optContainer = document.getElementById('game-options-container');
         optContainer.querySelectorAll('.tf-card').forEach(btn => {
             const text = btn.querySelector('.ans-text').textContent;
             if (text === q.ans) {
                 btn.classList.add('correct-fill');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = 'âœ”ï¸';
                 btn.appendChild(icon);
             } else if (btn.classList.contains('selected')) {
                 btn.classList.add('wrong-fill');
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = 'âŒ';
                 btn.appendChild(icon);
             }
         });
      } else if (qType === 'So sÃ¡nh') {
         isCorrect = this.state.selectedAns === q.ans;
         const slot = document.querySelector('.compare-slot');
         if (slot) {
             slot.style.position = 'relative';
             if (isCorrect) {
                 slot.style.background = 'linear-gradient(180deg, #4ade80, #16a34a)';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-v';
                 icon.textContent = 'âœ”ï¸';
                 slot.appendChild(icon);
             } else {
                 slot.style.background = 'linear-gradient(180deg, #f87171, #dc2626)';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = 'âŒ';
                 slot.appendChild(icon);
                 const btns = document.querySelectorAll('.cmp-btn');
                 btns.forEach(b => {
                     if (b.childNodes[0].textContent.trim() === q.ans) {
                         b.style.background = 'linear-gradient(180deg, #4ade80, #16a34a)';
                         b.style.color = 'white';
                         b.style.borderColor = '#22c55e';
                         const correctIcon = document.createElement('div');
                         correctIcon.className = 'result-icon icon-v';
                         correctIcon.textContent = 'âœ”ï¸';
                         b.style.position = 'relative';
                         b.appendChild(correctIcon);
                     }
                 });
             }
         }
      } else if (qType === 'KÃ©o tháº£') {
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
                 icon.textContent = 'âœ”ï¸';
                 slot.appendChild(icon);
             } else {
                 slot.style.borderColor = '#f87171';
                 slot.style.backgroundColor = '#fee2e2';
                 slot.style.color = '#dc2626';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = 'âŒ';
                 slot.appendChild(icon);
             }
         });
      } else if (qType === 'Chuá»—i quy luáº­t') {
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
                 icon.textContent = 'âœ”ï¸';
                 slot.appendChild(icon);
             } else {
                 slot.style.borderColor = '#f87171';
                 slot.style.background = '#fee2e2';
                 slot.style.color = '#dc2626';
                 slot.style.textShadow = 'none';
                 const icon = document.createElement('div');
                 icon.className = 'result-icon icon-x';
                 icon.textContent = 'âŒ';
                 slot.appendChild(icon);
             }
         });
      }
      
      const bubble = document.getElementById('cat-speech-bubble');
      bubble.style.display = 'flex';
      if (isCorrect) {
        this.state.score += 10 / this.state.questions.length;
        document.getElementById('play-cat-img').src = './public/cat_happy.png';
        bubble.innerHTML = `<span style="color:#16a34a;">Hoan hÃ´!<br>Báº¡n giá»i quÃ¡!</span>`;
      } else {
        document.getElementById('play-cat-img').src = './public/cat_sad.png';
        bubble.innerHTML = `<span style="color:#dc2626;">Tiáº¿c quÃ¡!<br>Báº¡n sai rá»“i!</span>`;
      }
      
      const explanation = q.explanation || q.hint;
      const explBox = document.getElementById('explanation-box');
      if (explanation) {
          explBox.style.display = 'block';
          explBox.innerHTML = `ðŸŒŸ <b>Lá»i giáº£i:</b><br>${explanation}`;
      } else {
          explBox.style.display = 'none';
      }
      
      this.state.historyDetails.push({ q: q.q, selected: this.state.selectedAns, correct: q.ans, isCorrect });
      
      document.getElementById('game-score').textContent = Math.round(this.state.score * 10) / 10;
      
      const btnCheck = document.getElementById('submit-ans-btn');
      
      const isLast = this.state.currentIdx === this.state.questions.length - 1;
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      document.getElementById('submit-ans-text').textContent = isLast ? (isAdmin ? 'Káº¿t thÃºc' : 'Káº¿t quáº£') : 'Tiáº¿p tá»¥c';
      
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
        msg = 'Báº¡n xá»©ng Ä‘Ã¡ng nháº­n Ä‘Æ°á»£c pháº§n thÆ°á»Ÿng nÃ y';
        giveLollipop = true;
      } else {
        msg = 'Cá»‘ gáº¯ng thÃªm ná»¯a báº¡n nhÃ©';
      }
      
      this.recordHistory(this.state.subject === 'math' ? 'ToÃ¡n' : 'Tiáº¿ng Viá»‡t', finalScore, giveLollipop);
      
      document.getElementById('result-score').textContent = finalScore;
      document.getElementById('result-msg').textContent = msg;
      
      const chest = document.getElementById('bonus-chest-img');
      chest.style.display = giveLollipop ? 'block' : 'none';
      chest.src = './public/lollipop.png';
      chest.onclick = () => this.claimBonus();
      
      const detailsBox = document.getElementById('result-details');
      detailsBox.innerHTML = '';
      this.state.historyDetails.forEach((d, i) => {
        const div = document.createElement('div');
        div.style.padding = '10px'; div.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
        div.innerHTML = `<b>${i+1}.</b> ${d.q} <br>
                         Báº¡n chá»n: <span style="color:${d.isCorrect ? '#4ade80' : '#f87171'}">${d.isCorrect ? 'âœ”' : 'âœ˜'} ${d.selected || 'Bá» trá»‘ng'}</span> <br>
                         ${!d.isCorrect ? `<span style="color:#4ade80">ÄÃ¡p Ã¡n: ${d.correct}</span>` : ''}`;
        detailsBox.appendChild(div);
      });
      
      document.getElementById('result-modal').classList.add('active');
    },
    async recordHistory(title, score, lollipop) {
      if (!app.data.currentUser || app.data.currentUser.role?.toLowerCase() === 'admin') return;
      if (!Array.isArray(app.data.currentUser.history)) app.data.currentUser.history = []; app.data.currentUser.history.push({
        date: new Date().toISOString().split('T')[0],
        module: title,
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
      alert('Nháº­n Káº¹o MÃºt ThÃ nh CÃ´ng! Káº¹o Ä‘Ã£ Ä‘Æ°á»£c lÆ°u vÃ o Kho BÃ¡u.');
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
        return alert('Vui lÃ²ng chá»n mÃ´n há»c vÃ  thá»i gian!');
      }
      
      const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
      let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
      clLevel = String(clLevel).replace('Lá»›p ', '').trim();
      
      const mappedSubject = this.filters.subject === 'math' ? 'ToÃ¡n' : 'Tiáº¿ng Viá»‡t';

      const filtered = app.data.exams.filter(e => {
          const eSub = String(e.subject||'').trim().toLowerCase();
          const eClass = String(e.classlevel||'').trim().toLowerCase().replace('lá»›p ', '');
          const ePer = String(e.period||'').trim().toLowerCase();
          return (eSub === mappedSubject.toLowerCase() || eSub.includes(mappedSubject.toLowerCase())) &&
                 eClass === clLevel &&
                 ePer === this.filters.period.toLowerCase();
      });
      if (filtered.length === 0) return alert('KhÃ´ng tÃ¬m tháº¥y Ä‘á» kiá»ƒm tra phÃ¹ há»£p trong Kho Äá» Kiá»ƒm tra.');
      
      const exam = filtered[0];
      this.state.questions = exam.questions || [];
      this.state.name = exam.name;
      this.state.historyDetails = [];
      this.state.score = 0;
      
      document.getElementById('exam-title').textContent = exam.name;
      document.getElementById('exam-student-name').textContent = app.data.currentUser ? app.data.currentUser.fullname : 'KhÃ¡ch';
      
      const container = document.getElementById('exam-questions-container');
      container.innerHTML = '';
      
      this.state.questions.forEach((q, idx) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'exam-q-block';
        qBlock.innerHTML = `<div class="exam-q-text">CÃ¢u ${idx + 1} (${q.type||'Tráº¯c nghiá»‡m'}): ${q.q}</div>`;
        if (q.imageUrl) qBlock.innerHTML += `<img src="${q.imageUrl}" style="max-height:150px; margin-bottom:10px;"><br>`;
        
        const optsContainer = document.createElement('div');
        optsContainer.className = 'exam-options';
        
        if (q.type === 'Tráº¯c nghiá»‡m' || q.type === 'ÄÃºng/Sai' || q.type === 'So sÃ¡nh' || q.type === 'KÃ©o tháº£' || !q.type) {
          const opts = q.options || [];
          opts.forEach(opt => {
            const lbl = document.createElement('label');
            lbl.className = 'exam-opt-label';
            lbl.innerHTML = `<input type="radio" name="exam_q_${idx}" value="${opt}"> ${opt}`;
            optsContainer.appendChild(lbl);
          });
        } else if (q.type === 'Äiá»n khuyáº¿t' || q.type === 'Chuá»—i Quy luáº­t') {
          optsContainer.innerHTML = `<input type="text" class="fill-input" name="exam_q_${idx}" style="width:100%; max-width:400px;" placeholder="Nháº­p cÃ¢u tráº£ lá»i...">`;
        }
        
        qBlock.appendChild(optsContainer);
        container.appendChild(qBlock);
      });
      
      app.router.open('exam-play-screen');
    },
    
    confirmExit() {
      if (confirm('Báº¡n chÆ°a ná»™p bÃ i, thoÃ¡t giá»¯a chá»«ng sáº½ máº¥t káº¿t quáº£!')) {
        app.router.open('map-screen');
      }
    },

    submit() {
      if (!confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n ná»™p bÃ i?')) return;
      
      let totalPts = 0;
      const ptsPerQ = 10 / (this.state.questions.length || 1);
      
      this.state.questions.forEach((q, idx) => {
        let isCorrect = false;
        let selected = '';
        
        if (q.type === 'Tráº¯c nghiá»‡m' || q.type === 'ÄÃºng/Sai' || q.type === 'So sÃ¡nh' || q.type === 'KÃ©o tháº£' || !q.type) {
           const checked = document.querySelector(`input[name="exam_q_${idx}"]:checked`);
           if (checked) {
              selected = checked.value;
              isCorrect = (selected === q.ans);
           }
        } else if (q.type === 'Äiá»n khuyáº¿t' || q.type === 'Chuá»—i Quy luáº­t') {
           const inp = document.querySelector(`input[name="exam_q_${idx}"]`);
           if (inp) {
              selected = inp.value.trim();
              isCorrect = (selected.toLowerCase() === (q.ans||'').toString().toLowerCase());
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
    renderTable(cols, data, rowRenderer, emptyMsg = "KhÃ´ng cÃ³ dá»¯ liá»‡u") {
      if (!data || data.length === 0) return `<p style="text-align:center; padding: 20px;">${emptyMsg}</p>`;
      
      let html = `<table class="data-table"><thead><tr>`;
      cols.forEach(c => {
         html += `<th>${c.label}</th>`;
      });
      html += `</tr><tr>`;
      cols.forEach((c, idx) => {
         if (c.filterable) {
            html += `<th><input type="text" class="filter-input" data-col="${idx}" placeholder="TÃ¬m kiáº¿m..." onkeyup="app.ui.filterTable(this)"></th>`;
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
                if (filters.length === 0) ind.textContent = `Tá»•ng: ${rows.length} cÃ¢u`;
                else ind.textContent = `Lá»c: ${visibleCount}/${rows.length} cÃ¢u`;
            }
        } else if (table.closest('#admin-e-subarea')) {
            const ind = document.getElementById('e-count-indicator');
            if (ind) {
                if (filters.length === 0) ind.textContent = `Tá»•ng: ${rows.length} Ä‘á»`;
                else ind.textContent = `Lá»c: ${visibleCount}/${rows.length} Ä‘á»`;
            }
        }
    },
    showHistoryDetails(btn) {
      const recordStr = decodeURIComponent(btn.getAttribute('data-record'));
      const record = JSON.parse(recordStr);
      let html = `<div style="text-align:left;">
        <h3 style="margin-bottom: 15px;">Chi tiáº¿t: ${record.title}</h3>
        <p><strong>NgÃ y lÃ m:</strong> ${record.date} | <strong>Äiá»ƒm:</strong> ${record.score}</p>
        <hr style="border-color: rgba(255,255,255,0.2); margin: 15px 0;">
        <div class="scroll-box" style="max-height: 400px; padding-right: 10px;">
      `;
      if (record.details && record.details.length > 0) {
        record.details.forEach((d, i) => {
           const isOk = d.isCorrect;
           const color = isOk ? '#4ade80' : '#f87171';
           html += `<div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; border-left: 5px solid ${color};">
              <p style="margin-bottom: 5px;"><strong>CÃ¢u ${i+1}:</strong> ${d.q}</p>
              <p style="margin-bottom: 5px; color: #ccc;">ÄÃ£ chá»n: <span style="color:${color}">${d.userAns}</span></p>
              ${!isOk ? `<p style="margin-bottom: 0; color: #4ade80;">ÄÃ¡p Ã¡n Ä‘Ãºng: ${d.correctAns}</p>` : ''}
           </div>`;
        });
      } else {
        html += `<p>KhÃ´ng cÃ³ dá»¯ liá»‡u chi tiáº¿t cho bÃ i lÃ m nÃ y.</p>`;
      }
      html += `</div></div>`;
      
      const box = document.getElementById('treasure-content-area');
      box.innerHTML = html + `<br><button class="btn-primary" onclick="app.treasure.switchTab('history')">Quay láº¡i</button>`;
    },
    exportToExcel(dataArray, filename) {
        if (!window.XLSX) return alert("ThÆ° viá»‡n Excel chÆ°a Ä‘Æ°á»£c táº£i! Kiá»ƒm tra láº¡i káº¿t ná»‘i máº¡ng.");
        const ws = XLSX.utils.json_to_sheet(dataArray);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, filename);
    },
    importFromExcel(file, callback) {
        if (!window.XLSX) return alert("ThÆ° viá»‡n Excel chÆ°a Ä‘Æ°á»£c táº£i!");
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, {type: 'array'});
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(ws);
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
       const clsNum = clsEl ? clsEl.value.replace('Lá»›p ', '').trim() : '5';
       
       const topicEl = document.getElementById('add-q-topic');
       const topicDict = app.constants.topics[clsNum] || { math: [], vietnamese: [] };
       const topics = sub === 'ToÃ¡n' ? topicDict.math : (sub === 'Tiáº¿ng Viá»‡t' ? topicDict.vietnamese : []);
       
       const selected = topicEl.getAttribute('data-selected');
       topicEl.innerHTML = topics.map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`).join('');
    },
    updateExamTopics() {
       const subEl = document.getElementById('add-e-sub');
       const clsEl = document.getElementById('add-e-class');
       if (!subEl) return;
       const sub = subEl.value;
       const clsNum = clsEl ? clsEl.value.replace('Lá»›p ', '').trim() : '5';
       
       const topicDict = app.constants.topics[clsNum] || { math: [], vietnamese: [] };
       const topics = sub === 'ToÃ¡n' ? topicDict.math : (sub === 'Tiáº¿ng Viá»‡t' ? topicDict.vietnamese : []);
       
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
            wrapper.style.display = (val === 'Tráº¯c nghiá»‡m' || val === 'KÃ©o tháº£') ? 'block' : 'none';
        }
    },
    openAdmin() {
      const modal = document.getElementById('treasure-modal');
      modal.style.display = 'flex';
      modal.classList.add('active');
      document.getElementById('treasure-title').textContent = 'CÃ i Äáº·t Há»‡ Thá»‘ng';
      this.switchTab('players');
    },
    switchTab(tab) {
      const tabs = [
        { id: 'players', label: 'Quáº£n LÃ½ Há»c Sinh' },
        { id: 'questions', label: 'Kho CÃ¢u Há»i' },
        { id: 'exams', label: 'Kho Äá» Kiá»ƒm tra' }
      ];
      app.ui.renderTabs(tabs, tab, 'app.admin.switchTab');
      
      const box = document.getElementById('treasure-content-area');
      if (tab === 'questions') this.renderQuestions(box);
      else if (tab === 'exams') this.renderExams(box);
      else if (tab === 'players') this.renderPlayers(box);
    },
    renderQuestions(box) {
        box.innerHTML = `
          <div style="margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; display:flex; gap:10px; flex-wrap:wrap;">
             <div style="display:flex; width:100%; gap: 10px;">
                 <button class="btn-primary" id="btn-q-lib" style="flex:1; margin:0;" onclick="app.admin.renderQSubTab('lib')" >ThÆ° viá»‡n</button>
                 <div id="q-count-indicator" style="flex:1; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius: 4px; font-weight: bold; color: #ffeb3b; font-size: 1rem;"></div>
             </div>
             <button class="btn-opt" id="btn-q-add" onclick="app.admin.renderQSubTab('add')">Soáº¡n cÃ¢u há»i</button>
             <button class="btn-opt" id="btn-q-tpl" onclick="app.admin.renderQSubTab('tpl')">Xuáº¥t file máº«u (*.xlsx)</button>
             <button class="btn-opt" id="btn-q-exp" onclick="app.admin.renderQSubTab('exp')">Xuáº¥t dá»¯ liá»‡u (*.xlsx)</button>
             <button class="btn-opt" id="btn-q-imp" onclick="app.admin.renderQSubTab('imp')">Nháº­p tá»« file (*.xlsx)</button>
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
            { label: 'Cáº¥p lá»›p', filterable: true },
            { label: 'MÃ´n', filterable: true },
            { label: 'Chá»§ Ä‘á»', filterable: true },
            { label: 'Má»©c Ä‘á»™ khÃ³', filterable: true },
            { label: 'Loáº¡i cÃ¢u há»i', filterable: true },
            { label: 'CÃ¢u há»i', filterable: true },
            { label: 'ÄÃ¡p Ã¡n', filterable: false },
            { label: 'Lá»i giáº£i', filterable: false },
            { label: 'HÃ nh Ä‘á»™ng', filterable: false }
          ];
          let html = app.ui.renderTable(cols, app.data.libraryQuestions, (q, i) => {
            return `<tr>
              <td>${q.classlevel||'Lá»›p 5'}</td><td>${q.subject}</td><td>${q.topic}</td>
              <td>${q.difficulty||'Dá»…'}</td><td>${q.type||'Tráº¯c nghiá»‡m'}</td>
              <td>${q.q}</td><td>${q.ans}</td><td>${q.explanation||''}</td>
              <td>
                <button class="btn-success action-btn" onclick="app.admin.addToExamPrompt(${i})">ThÃªm vÃ o Ä‘á»</button>
                <button class="btn-opt action-btn" onclick="app.admin.editQuestion(${i})">Sá»­a</button>
                <button class="btn-danger action-btn" onclick="app.admin.deleteQuestion(${i})">XÃ³a</button>
              </td>
            </tr>`;
          });
          subBox.innerHTML = html;
          const ind = document.getElementById('q-count-indicator');
          if (ind) ind.textContent = `Tá»•ng: ${app.data.libraryQuestions.length} cÃ¢u`;
      } 
      else if (tab === 'add') {
          let q = editIdx !== undefined ? app.data.libraryQuestions[editIdx] : null;
          subBox.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; text-align:left;">
               <h3>${q ? 'Sá»­a thÃ´ng tin cÃ¢u há»i' : 'ThÃªm cÃ¢u há»i má»›i'}</h3>
               
               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Cáº¥p lá»›p</label>
                  <select id="add-q-class" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateTopicDropdown()">
                     <option value="Lá»›p 1" ${q && q.classlevel === 'Lá»›p 1' ? 'selected' : ''}>Lá»›p 1</option>
                     <option value="Lá»›p 2" ${q && q.classlevel === 'Lá»›p 2' ? 'selected' : ''}>Lá»›p 2</option>
                     <option value="Lá»›p 3" ${q && q.classlevel === 'Lá»›p 3' ? 'selected' : ''}>Lá»›p 3</option>
                     <option value="Lá»›p 4" ${q && q.classlevel === 'Lá»›p 4' ? 'selected' : ''}>Lá»›p 4</option>
                     <option value="Lá»›p 5" ${q && q.classlevel === 'Lá»›p 5' ? 'selected' : (!q ? 'selected' : '')}>Lá»›p 5</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">MÃ´n há»c</label>
                  <select id="add-q-sub" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateTopicDropdown()">
                     <option value="ToÃ¡n" ${q && q.subject === 'ToÃ¡n' ? 'selected' : (!q ? 'selected' : '')}>ToÃ¡n</option>
                     <option value="Tiáº¿ng Viá»‡t" ${q && q.subject === 'Tiáº¿ng Viá»‡t' ? 'selected' : ''}>Tiáº¿ng Viá»‡t</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Chá»§ Ä‘á»</label>
                  <select id="add-q-topic" class="form-input" style="flex:1; padding:8px;" data-selected="${q ? q.topic : ''}">
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Má»©c Ä‘á»™ khÃ³</label>
                  <select id="add-q-diff" class="form-input" style="flex:1; padding:8px;">
                     <option value="Dá»…" ${q && q.difficulty === 'Dá»…' ? 'selected' : (!q ? 'selected' : '')}>Dá»…</option>
                     <option value="Vá»«a" ${q && q.difficulty === 'Vá»«a' ? 'selected' : ''}>Vá»«a</option>
                     <option value="KhÃ³" ${q && q.difficulty === 'KhÃ³' ? 'selected' : ''}>KhÃ³</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Loáº¡i cÃ¢u há»i</label>
                  <select id="add-q-type" class="form-input" style="flex:1; padding:8px;" onchange="document.getElementById('add-q-opts-wrapper').style.display = (this.value === 'Tráº¯c nghiá»‡m' || this.value === 'KÃ©o tháº£') ? 'block' : 'none';">
                     <option value="Tráº¯c nghiá»‡m" ${q && q.type === 'Tráº¯c nghiá»‡m' ? 'selected' : (!q ? 'selected' : '')}>Tráº¯c nghiá»‡m</option>
                     <option value="Äiá»n khuyáº¿t" ${q && q.type === 'Äiá»n khuyáº¿t' ? 'selected' : ''}>Äiá»n khuyáº¿t</option>
                     <option value="ÄÃºng/Sai" ${q && q.type === 'ÄÃºng/Sai' ? 'selected' : ''}>ÄÃºng/Sai</option>
                     <option value="So sÃ¡nh" ${q && q.type === 'So sÃ¡nh' ? 'selected' : ''}>So sÃ¡nh</option>
                     <option value="Chuá»—i Quy luáº­t" ${q && q.type === 'Chuá»—i Quy luáº­t' ? 'selected' : ''}>Chuá»—i Quy luáº­t</option>
                     <option value="KÃ©o tháº£" ${q && q.type === 'KÃ©o tháº£' ? 'selected' : ''}>KÃ©o tháº£</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Ná»™i dung cÃ¢u há»i</label>
                  <textarea id="add-q-q" placeholder="Ná»™i dung cÃ¢u há»i" class="form-input" style="flex:1; padding:8px; height:60px;">${q ? q.q : ''}</textarea>
               </div>

               <div id="add-q-opts-wrapper" style="display: ${q && q.type && q.type !== 'Tráº¯c nghiá»‡m' && q.type !== 'KÃ©o tháº£' ? 'none' : 'block'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lá»±a chá»n 1</label>
                     <input type="text" id="add-q-opt1" placeholder="Tráº£ lá»i 1" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[0] ? q.options[0] : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lá»±a chá»n 2</label>
                     <input type="text" id="add-q-opt2" placeholder="Tráº£ lá»i 2" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[1] ? q.options[1] : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lá»±a chá»n 3</label>
                     <input type="text" id="add-q-opt3" placeholder="Tráº£ lá»i 3" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[2] ? q.options[2] : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lá»±a chá»n 4</label>
                     <input type="text" id="add-q-opt4" placeholder="Tráº£ lá»i 4" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[3] ? q.options[3] : ''}">
                  </div>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">ÄÃ¡p Ã¡n Ä‘Ãºng</label>
                  <input type="text" id="add-q-ans" placeholder="ÄÃ¡p Ã¡n Ä‘Ãºng (náº¿u tráº¯c nghiá»‡m pháº£i ghi Ä‘Ãºng 1 trong 4 lá»±a chá»n á»Ÿ trÃªn)" class="form-input" style="flex:1; padding:8px;" value="${q ? q.ans : ''}">
               </div>

               <div style="display:flex; align-items:center; margin-bottom:15px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Lá»i giáº£i chi tiáº¿t</label>
                  <textarea id="add-q-exp" placeholder="Lá»i giáº£i (tÃ¹y chá»n)" class="form-input" style="flex:1; padding:8px; height:60px;">${q ? q.explanation || '' : ''}</textarea>
               </div>

               <button class="btn-success" onclick="app.admin.submitAddQuestion(${editIdx !== undefined ? editIdx : 'null'})" style="width:100%; padding:10px;">${q ? 'LÆ°u chá»‰nh sá»­a' : 'LÆ°u cÃ¢u há»i'}</button>
            </div>
          `;
          setTimeout(() => app.admin.updateTopicDropdown(), 0);
      }
      else if (tab === 'tpl') {
          subBox.innerHTML = `<p>Äang chuáº©n bá»‹ file máº«u...</p>`;
          app.admin.downloadQTemplate();
          setTimeout(() => app.admin.renderQSubTab('lib'), 1000);
      }
      else if (tab === 'exp') {
          subBox.innerHTML = `<p>Äang xuáº¥t dá»¯ liá»‡u...</p>`;
          app.admin.exportQuestions();
          setTimeout(() => app.admin.renderQSubTab('lib'), 1000);
      }
      else if (tab === 'imp') {
          subBox.innerHTML = `
            <div style="max-width: 400px; margin: 0 auto; text-align:center;">
               <h3>Nháº­p dá»¯ liá»‡u tá»« Excel (.xlsx)</h3>
               <div style="text-align: left; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                  <label style="display:block; margin-bottom:10px; cursor:pointer;"><input type="radio" name="q-import-mode" value="append" checked style="transform:scale(1.2); margin-right:8px;"> <strong>ThÃªm má»›i</strong> (Giá»¯ nguyÃªn dá»¯ liá»‡u cÅ©, thÃªm dá»¯ liá»‡u má»›i)</label>
                  <label style="display:block; cursor:pointer;"><input type="radio" name="q-import-mode" value="overwrite" style="transform:scale(1.2); margin-right:8px;"> <strong style="color:#f87171;">Ghi Ä‘Ã¨</strong> (XÃ³a toÃ n bá»™ dá»¯ liá»‡u cÅ©, thay báº±ng má»›i)</label>
               </div>
               <input type="file" id="q-file-upload" accept=".xlsx, .csv" style="margin: 10px 0 20px 0;">
               <button class="btn-success" onclick="app.admin.submitImportQuestions()" style="width:100%;">Táº£i lÃªn</button>
            </div>
          `;
      }
    },
    downloadQTemplate() {
        const data = [
            {
                "Cáº¥p lá»›p": "Lá»›p 1",
                "MÃ´n há»c": "ToÃ¡n",
                "Chá»§ Ä‘á»": "PhÃ©p cá»™ng trá»« khÃ´ng nhá»› pháº¡m vi 100",
                "Má»©c Ä‘á»™ khÃ³": "Dá»…",
                "Loáº¡i cÃ¢u há»i": "Tráº¯c nghiá»‡m",
                "CÃ¢u há»i": "1 + 1 = ?",
                "Lá»±a chá»n": "1, 2, 3, 4",
                "ÄÃ¡p Ã¡n Ä‘Ãºng": "2",
                "Lá»i giáº£i chi tiáº¿t": "1 cá»™ng 1 báº±ng 2"
            },
            {
                "Cáº¥p lá»›p": "Lá»›p 1",
                "MÃ´n há»c": "Tiáº¿ng Viá»‡t",
                "Chá»§ Ä‘á»": "MÃ¡i trÆ°á»ng máº¿n yÃªu",
                "Má»©c Ä‘á»™ khÃ³": "Vá»«a",
                "Loáº¡i cÃ¢u há»i": "KÃ©o tháº£",
                "CÃ¢u há»i": "Con chÃ³ sá»§a gÃ¢u ___, con mÃ¨o kÃªu meo ___.",
                "Lá»±a chá»n": "gÃ¢u, meo, quÃ¡c, chiáº¿p",
                "ÄÃ¡p Ã¡n Ä‘Ãºng": "gÃ¢u, meo",
                "Lá»i giáº£i chi tiáº¿t": "KÃ©o tháº£ 'gÃ¢u' vÃ o chá»— trá»‘ng thá»© nháº¥t, 'meo' vÃ o thá»© 2"
            },
            {
                "Cáº¥p lá»›p": "Lá»›p 2",
                "MÃ´n há»c": "ToÃ¡n",
                "Chá»§ Ä‘á»": "PhÃ©p nhÃ¢n, phÃ©p chia",
                "Má»©c Ä‘á»™ khÃ³": "Dá»…",
                "Loáº¡i cÃ¢u há»i": "ÄÃºng/Sai",
                "CÃ¢u há»i": "5 - 3 = 2, Ä‘Ãºng hay sai?",
                "Lá»±a chá»n": "",
                "ÄÃ¡p Ã¡n Ä‘Ãºng": "ÄÃºng",
                "Lá»i giáº£i chi tiáº¿t": "PhÃ©p trá»« chÃ­nh xÃ¡c"
            },
            {
                "Cáº¥p lá»›p": "Lá»›p 3",
                "MÃ´n há»c": "Tiáº¿ng Viá»‡t",
                "Chá»§ Ä‘á»": "Cá»™ng Ä‘á»“ng gáº¯n bÃ³",
                "Má»©c Ä‘á»™ khÃ³": "KhÃ³",
                "Loáº¡i cÃ¢u há»i": "Äiá»n khuyáº¿t",
                "CÃ¢u há»i": "Gáº§n má»±c thÃ¬ Ä‘en, gáº§n ___ thÃ¬ sÃ¡ng.",
                "Lá»±a chá»n": "",
                "ÄÃ¡p Ã¡n Ä‘Ãºng": "Ä‘Ã¨n",
                "Lá»i giáº£i chi tiáº¿t": "Tá»¥c ngá»¯"
            },
            {
                "Cáº¥p lá»›p": "Lá»›p 4",
                "MÃ´n há»c": "ToÃ¡n",
                "Chá»§ Ä‘á»": "PhÃ¢n sá»‘",
                "Má»©c Ä‘á»™ khÃ³": "Vá»«a",
                "Loáº¡i cÃ¢u há»i": "So sÃ¡nh",
                "CÃ¢u há»i": "Äiá»n dáº¥u thÃ­ch há»£p: 1/2 ___ 1/3",
                "Lá»±a chá»n": "",
                "ÄÃ¡p Ã¡n Ä‘Ãºng": ">",
                "Lá»i giáº£i chi tiáº¿t": "1/2 > 1/3"
            },
            {
                "Cáº¥p lá»›p": "Lá»›p 5",
                "MÃ´n há»c": "ToÃ¡n",
                "Chá»§ Ä‘á»": "Sá»‘ tháº­p phÃ¢n",
                "Má»©c Ä‘á»™ khÃ³": "KhÃ³",
                "Loáº¡i cÃ¢u há»i": "Chuá»—i quy luáº­t",
                "CÃ¢u há»i": "2, ___, 6, ___, 10",
                "Lá»±a chá»n": "",
                "ÄÃ¡p Ã¡n Ä‘Ãºng": "4, 8",
                "Lá»i giáº£i chi tiáº¿t": "Äiá»n 2 sá»‘ cÃ²n thiáº¿u"
            },
            {
                "Cáº¥p lá»›p": "=> HÆ¯á»šNG DáºªN CÃCH NHáº¬P:",
                "MÃ´n há»c": "(1) Cáº¥p lá»›p, MÃ´n há»c",
                "Chá»§ Ä‘á»": "(2) Copy chÃ­nh xÃ¡c Chá»§ Ä‘á» bÃªn dÆ°á»›i",
                "Má»©c Ä‘á»™ khÃ³": "(3) Dá»…, Vá»«a, KhÃ³",
                "Loáº¡i cÃ¢u há»i": "(4) Ghi chÃ­nh xÃ¡c: Tráº¯c nghiá»‡m, Äiá»n khuyáº¿t, ÄÃºng/Sai, So sÃ¡nh, Chuá»—i quy luáº­t, KÃ©o tháº£",
                "CÃ¢u há»i": "(5) KÃ©o tháº£, So sÃ¡nh, Äiá»n khuyáº¿t, Chuá»—i quy luáº­t: Báº¯t buá»™c dÃ¹ng ___ hoáº·c ... Ä‘á»ƒ lÃ m chá»— trá»‘ng.",
                "Lá»±a chá»n": "(6) Tráº¯c nghiá»‡m / KÃ©o tháº£: CÃ¡c lá»±a chá»n & Ä‘Ã¡p Ã¡n nhiá»…u (ngÄƒn cÃ¡ch bá»Ÿi dáº¥u pháº©y).",
                "ÄÃ¡p Ã¡n Ä‘Ãºng": "(7) KÃ©o tháº£, Chuá»—i quy luáº­t: Cho phÃ©p 1->4 Ä‘Ã¡p Ã¡n (ngÄƒn cÃ¡ch bá»Ÿi dáº¥u pháº©y). So sÃ¡nh: <,>,=",
                "Lá»i giáº£i chi tiáº¿t": "(8) CÃ³ thá»ƒ Ä‘á»ƒ trá»‘ng"
            }
        ];
        
        for (let i = 1; i <= 5; i++) {
            const t = app.constants.topics[String(i)];
            if (t) {
                data.push({
                    "Cáº¥p lá»›p": "=> COPY CHá»¦ Äá»€ Lá»šP " + i + ":",
                    "MÃ´n há»c": "MÃ´n ToÃ¡n Lá»›p " + i + ":",
                    "Chá»§ Ä‘á»": t.math.join(", "),
                    "Má»©c Ä‘á»™ khÃ³": "MÃ´n Tiáº¿ng Viá»‡t Lá»›p " + i + ":",
                    "Loáº¡i cÃ¢u há»i": t.vietnamese.join(", "),
                    "CÃ¢u há»i": "",
                    "Lá»±a chá»n": "",
                    "ÄÃ¡p Ã¡n Ä‘Ãºng": "",
                    "Lá»i giáº£i chi tiáº¿t": ""
                });
            }
        }
        
        app.ui.exportToExcel(data, "Mau_Nhap_Cau_Hoi.xlsx");
    },
    exportQuestions() {
        const data = app.data.libraryQuestions.map(q => ({
            "Cáº¥p lá»›p": q.classlevel,
            "MÃ´n há»c": q.subject,
            "Chá»§ Ä‘á»": q.topic,
            "Má»©c Ä‘á»™ khÃ³": q.difficulty,
            "Loáº¡i cÃ¢u há»i": q.type,
            "CÃ¢u há»i": q.q,
            "Lá»±a chá»n": (q.options || []).join(', '),
            "ÄÃ¡p Ã¡n Ä‘Ãºng": q.ans,
            "Lá»i giáº£i chi tiáº¿t": q.explanation || ''
        }));
        app.ui.exportToExcel(data, "Du_Lieu_Cau_Hoi.xlsx");
    },
    downloadETemplate() {
        const data = [{
            "Cáº¥p lá»›p": "Lá»›p 5",
            "MÃ´n": "ToÃ¡n",
            "Ká»³ kiá»ƒm tra": "Giá»¯a ká»³ 1",
            "TÃªn Ä‘á»": "Äá» kiá»ƒm tra giá»¯a ká»³ 1 MÃ´n ToÃ¡n Lá»›p 5"
        }];
        app.ui.exportToExcel(data, "Mau_Nhap_De_Kiem_Tra.xlsx");
    },
    exportExams() {
        const data = app.data.exams.map(e => ({
            "Cáº¥p lá»›p": e.classlevel,
            "MÃ´n": e.subject,
            "Ká»³ kiá»ƒm tra": e.period,
            "TÃªn Ä‘á»": e.name,
            "Sá»‘ cÃ¢u há»i": (e.questions || []).length
        }));
        app.ui.exportToExcel(data, "Du_Lieu_De_Kiem_Tra.xlsx");
    },
    submitAddQuestion(editIdx) {
        const qObj = {
            type: document.getElementById('add-q-type').value,
            difficulty: document.getElementById('add-q-diff').value,
            subject: document.getElementById('add-q-sub').value,
            classlevel: document.getElementById('add-q-class').value,
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
        if(!qObj.subject || !qObj.q || !qObj.ans) return alert('Vui lÃ²ng Ä‘iá»n Ä‘á»§ MÃ´n, CÃ¢u há»i vÃ  ÄÃ¡p Ã¡n');
        
        if (editIdx !== null && editIdx !== undefined) {
             app.data.libraryQuestions[editIdx] = qObj;
             alert('ÄÃ£ cáº­p nháº­t cÃ¢u há»i!');
        } else {
             app.data.libraryQuestions.push(qObj);
             alert('ÄÃ£ thÃªm cÃ¢u há»i!');
        }
        app.data.saveLibrary();
        this.renderQSubTab('lib');
    },
    addToExamPrompt(qIdx) {
        if (!app.data.exams || app.data.exams.length === 0) return alert('ChÆ°a cÃ³ Ä‘á» kiá»ƒm tra nÃ o. Vui lÃ²ng táº¡o Ä‘á» kiá»ƒm tra trÆ°á»›c trong Kho Äá» Kiá»ƒm tra!');
        app.admin.switchTab('exams');
        setTimeout(() => {
            app.admin.renderESubTab('select_for_q', qIdx);
        }, 50);
    },
    submitImportQuestions() {
        const fileInput = document.getElementById('q-file-upload');
        if (!fileInput.files.length) return alert('Vui lÃ²ng chá»n file!');
        
        const modeInput = document.querySelector('input[name="q-import-mode"]:checked');
        const mode = modeInput ? modeInput.value : 'append';
        if (mode === 'overwrite') {
            if (!confirm("Cáº¢NH BÃO: Báº¡n Ä‘Ã£ chá»n GHI ÄÃˆ. ToÃ n bá»™ cÃ¢u há»i hiá»‡n cÃ³ sáº½ bá»‹ xÃ³a sáº¡ch vÃ  thay báº±ng dá»¯ liá»‡u má»›i! Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n tiáº¿p tá»¥c? (Báº¥m OK Ä‘á»ƒ Ghi Ä‘Ã¨, Cancel Ä‘á»ƒ Há»§y)")) {
                return;
            }
        }

        const btn = document.querySelector('button[onclick="app.admin.submitImportQuestions()"]');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Äang xá»­ lÃ½ vÃ  táº£i lÃªn... Vui lÃ²ng chá»';
        }

        app.ui.importFromExcel(fileInput.files[0], async (data) => {
            if (mode === 'overwrite') {
                app.data.libraryQuestions = []; if (window.supabase) await supabaseClient.from('game_questions').delete().neq('id', 0);
            }
            let count = 0;
            data.forEach(row => {
                const ansStr = row["ÄÃ¡p Ã¡n Ä‘Ãºng"] || row["ÄÃ¡p Ã¡n"];
                if (row["CÃ¢u há»i"] && ansStr !== undefined && ansStr !== null && String(ansStr).trim() !== '') {
                    app.data.libraryQuestions.push({
                        type: row["Loáº¡i cÃ¢u há»i"] || row["Loáº¡i"] || 'Tráº¯c nghiá»‡m',
                        subject: row["MÃ´n há»c"] || row["MÃ´n"] || 'ToÃ¡n',
                        classlevel: row["Cáº¥p lá»›p"] || row["Lá»›p"] || 'Lá»›p 5',
                        topic: row["Chá»§ Ä‘á»"] || 'KhÃ¡c',
                        difficulty: row["Má»©c Ä‘á»™ khÃ³"] || 'Vá»«a',
                        q: row["CÃ¢u há»i"],
                        ans: String(ansStr),
                        options: row["Lá»±a chá»n"] ? String(row["Lá»±a chá»n"]).split(',').map(s=>s.trim()) : [],
                        explanation: row["Lá»i giáº£i chi tiáº¿t"] || ''
                    });
                    count++;
                }
            });
            await app.data.saveLibrary();
            alert(`ÄÃ£ nháº­p thÃ nh cÃ´ng ${count} cÃ¢u há»i!`);
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Táº£i lÃªn';
            }
            this.renderQSubTab('lib');
        });
    },
    renderExams(box) {
      box.innerHTML = `
        <div style="margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; display:flex; gap:10px; flex-wrap:wrap;">
           <div style="display:flex; width:100%; gap: 10px;"><button class="btn-primary" id="btn-e-lib" style="flex:1; margin:0;" onclick="app.admin.renderESubTab('lib')">ThÆ° viá»‡n</button><div id="e-count-indicator" style="flex:1; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius: 4px; font-weight: bold; color: #ffeb3b; font-size: 1rem;"></div></div>
           <button class="btn-opt" id="btn-e-add" onclick="app.admin.renderESubTab('add')">Soáº¡n Ä‘á»</button>
           <button class="btn-opt" id="btn-e-tpl" onclick="app.admin.renderESubTab('tpl')">Xuáº¥t file máº«u (*.xlsx)</button>
           <button class="btn-opt" id="btn-e-exp" onclick="app.admin.renderESubTab('exp')">Xuáº¥t dá»¯ liá»‡u (*.xlsx)</button>
           <button class="btn-opt" id="btn-e-imp" onclick="app.admin.renderESubTab('imp')">Nháº­p tá»« file (*.xlsx)</button>
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
            { label: 'Cáº¥p lá»›p', filterable: true },
            { label: 'MÃ´n', filterable: true },
            { label: 'Ká»³ kiá»ƒm tra', filterable: true },
            { label: 'TÃªn Ä‘á»', filterable: true },
            { label: 'Sá»‘ cÃ¢u', filterable: false },
            { label: 'HÃ nh Ä‘á»™ng', filterable: false }
          ];
          let html = app.ui.renderTable(cols, app.data.exams, (e, i) => {
            return `<tr>
              <td>${e.classlevel||'Lá»›p 5'}</td><td>${e.subject}</td>
              <td>${e.period}</td><td>${e.name}</td><td>${(e.questions||[]).length}</td>
              <td>
                <button class="btn-primary action-btn" onclick="app.admin.viewExam(${i})">Xem</button>
                <button class="btn-opt action-btn" onclick="app.admin.editExam(${i})">Sá»­a</button>
                <button class="btn-danger action-btn" onclick="app.admin.deleteExam(${i})">XÃ³a</button>
              </td>
            </tr>`;
          });
          subBox.innerHTML = html;
          const ind = document.getElementById('e-count-indicator');
          if (ind) ind.textContent = `Tá»•ng: ${app.data.exams.length} Ä‘á»`;
      }
      else if (tab === 'add') {
          let e = editIdx !== undefined ? app.data.exams[editIdx] : null;
          subBox.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; text-align:left;">
               <h3>${e ? 'Sá»­a Ä‘á» kiá»ƒm tra' : 'ThÃªm Ä‘á» kiá»ƒm tra má»›i'}</h3>
               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Cáº¥p lá»›p</label>
                  <select id="add-e-class" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateExamTopics()">
                     <option value="Lá»›p 1" ${e && e.classlevel === 'Lá»›p 1' ? 'selected' : ''}>Lá»›p 1</option>
                     <option value="Lá»›p 2" ${e && e.classlevel === 'Lá»›p 2' ? 'selected' : ''}>Lá»›p 2</option>
                     <option value="Lá»›p 3" ${e && e.classlevel === 'Lá»›p 3' ? 'selected' : ''}>Lá»›p 3</option>
                     <option value="Lá»›p 4" ${e && e.classlevel === 'Lá»›p 4' ? 'selected' : ''}>Lá»›p 4</option>
                     <option value="Lá»›p 5" ${e && e.classlevel === 'Lá»›p 5' ? 'selected' : (!e ? 'selected' : '')}>Lá»›p 5</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">MÃ´n há»c</label>
                  <select id="add-e-sub" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateExamTopics()">
                     <option value="ToÃ¡n" ${e && e.subject === 'ToÃ¡n' ? 'selected' : (!e ? 'selected' : '')}>ToÃ¡n</option>
                     <option value="Tiáº¿ng Viá»‡t" ${e && e.subject === 'Tiáº¿ng Viá»‡t' ? 'selected' : ''}>Tiáº¿ng Viá»‡t</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Ká»³ kiá»ƒm tra</label>
                  <select id="add-e-period" class="form-input" style="flex:1; padding:8px;">
                     <option value="Giá»¯a ká»³ 1" ${e && e.period === 'Giá»¯a ká»³ 1' ? 'selected' : ''}>Giá»¯a ká»³ 1</option>
                     <option value="Cuá»‘i ká»³ 1" ${e && e.period === 'Cuá»‘i ká»³ 1' ? 'selected' : ''}>Cuá»‘i ká»³ 1</option>
                     <option value="Giá»¯a ká»³ 2" ${e && e.period === 'Giá»¯a ká»³ 2' ? 'selected' : ''}>Giá»¯a ká»³ 2</option>
                     <option value="Cuá»‘i ká»³ 2" ${e && e.period === 'Cuá»‘i ká»³ 2' ? 'selected' : ''}>Cuá»‘i ká»³ 2</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:15px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">TÃªn Ä‘á» kiá»ƒm tra</label>
                  <input type="text" id="add-e-name" placeholder="TÃªn Äá» (VD: Äá» kiá»ƒm tra há»c kÃ¬ 1 ToÃ¡n)" class="form-input" style="flex:1; padding:8px;" value="${e ? e.name : ''}">
               </div>

               ${e && e.questions && e.questions.length > 0 ? `
               <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px;">
                  <h4 style="margin-bottom: 10px; color:#4ade80;">Danh sÃ¡ch cÃ¢u há»i hiá»‡n cÃ³ trong Ä‘á»:</h4>
                  <table style="width:100%; border-collapse: collapse; text-align: left;">
                     ${e.questions.map((q, i) => `
                     <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 10px 5px;"><strong>CÃ¢u ${i+1}:</strong> ${q.q}</td>
                        <td style="padding: 10px 5px; text-align:right; white-space:nowrap;">
                            ${i > 0 ? `<button class="btn-opt action-btn" style="padding:4px 8px;" onclick="app.admin.moveQuestion(${editIdx}, ${i}, 'up')">LÃªn</button>` : ''}
                            ${i < e.questions.length - 1 ? `<button class="btn-opt action-btn" style="padding:4px 8px;" onclick="app.admin.moveQuestion(${editIdx}, ${i}, 'down')">Xuá»‘ng</button>` : ''}
                            <button class="btn-danger action-btn" style="padding:4px 8px;" onclick="app.admin.removeQuestionFromExam(${editIdx}, ${i})">XÃ³a</button>
                        </td>
                     </tr>
                     `).join('')}
                  </table>
               </div>
               ` : ''}

               <div style="margin-top: 20px; border-top: 2px solid rgba(255,255,255,0.3); padding-top: 15px;">
                  <h4 style="margin-bottom: 15px; color:#ffcc00;">Soáº¡n cÃ¢u há»i cho Ä‘á» kiá»ƒm tra nÃ y</h4>
                  ${Array(Math.max(10, e && e.questions ? e.questions.length : 10)).fill(0).map((_, i) => {
                     let q = e && e.questions && e.questions[i] ? e.questions[i] : null;
                     return `
                    <div style="background: rgba(0,0,0,0.2); padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #ffcc00;">
                       <h5 style="margin-top:0; margin-bottom: 10px;">CÃ¢u há»i ${i + 1}</h5>
                       
                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Chá»§ Ä‘á»</label>
                          <select id="add-e-q-topic-${i}" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;" data-selected="${q ? q.topic : ''}">
                          </select>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Má»©c Ä‘á»™ khÃ³</label>
                          <select id="add-e-q-diff-${i}" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;">
                             <option value="Dá»…" ${q && q.difficulty === 'Dá»…' ? 'selected' : (!q ? 'selected' : '')}>Dá»…</option>
                             <option value="Vá»«a" ${q && q.difficulty === 'Vá»«a' ? 'selected' : ''}>Vá»«a</option>
                             <option value="KhÃ³" ${q && q.difficulty === 'KhÃ³' ? 'selected' : ''}>KhÃ³</option>
                          </select>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Loáº¡i cÃ¢u há»i</label>
                          <select id="add-e-q-type-${i}" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;" onchange="app.admin.toggleExamOptionsWrapper(${i})">
                             <option value="Tráº¯c nghiá»‡m" ${q && q.type === 'Tráº¯c nghiá»‡m' ? 'selected' : (!q ? 'selected' : '')}>Tráº¯c nghiá»‡m</option>
                             <option value="Äiá»n khuyáº¿t" ${q && q.type === 'Äiá»n khuyáº¿t' ? 'selected' : ''}>Äiá»n khuyáº¿t</option>
                             <option value="ÄÃºng/Sai" ${q && q.type === 'ÄÃºng/Sai' ? 'selected' : ''}>ÄÃºng/Sai</option>
                             <option value="So sÃ¡nh" ${q && q.type === 'So sÃ¡nh' ? 'selected' : ''}>So sÃ¡nh</option>
                             <option value="Chuá»—i Quy luáº­t" ${q && q.type === 'Chuá»—i Quy luáº­t' ? 'selected' : ''}>Chuá»—i Quy luáº­t</option>
                             <option value="KÃ©o tháº£" ${q && q.type === 'KÃ©o tháº£' ? 'selected' : ''}>KÃ©o tháº£</option>
                          </select>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Ná»™i dung cÃ¢u</label>
                          <textarea id="add-e-q-q-${i}" placeholder="Nháº­p ná»™i dung cÃ¢u há»i (Ä‘á»ƒ trá»‘ng náº¿u khÃ´ng muá»‘n táº¡o cÃ¢u nÃ y)" class="form-input" style="flex:1; padding:6px; height:50px; font-size:0.9rem;">${q ? q.q : ''}</textarea>
                       </div>

                       <div id="add-e-q-opts-wrapper-${i}" style="display: ${q && q.type && q.type !== 'Tráº¯c nghiá»‡m' && q.type !== 'KÃ©o tháº£' ? 'none' : 'block'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                          <div style="display:flex; align-items:center; margin-bottom:5px;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lá»±a chá»n 1</label>
                             <input type="text" id="add-e-q-opt1-${i}" placeholder="Lá»±a chá»n 1" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[0] ? q.options[0] : ''}">
                          </div>
                          <div style="display:flex; align-items:center; margin-bottom:5px;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lá»±a chá»n 2</label>
                             <input type="text" id="add-e-q-opt2-${i}" placeholder="Lá»±a chá»n 2" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[1] ? q.options[1] : ''}">
                          </div>
                          <div style="display:flex; align-items:center; margin-bottom:5px;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lá»±a chá»n 3</label>
                             <input type="text" id="add-e-q-opt3-${i}" placeholder="Lá»±a chá»n 3" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[2] ? q.options[2] : ''}">
                          </div>
                          <div style="display:flex; align-items:center; margin-bottom:0;">
                             <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.85rem;">Lá»±a chá»n 4</label>
                             <input type="text" id="add-e-q-opt4-${i}" placeholder="Lá»±a chá»n 4" class="form-input" style="flex:1; padding:6px; font-size:0.85rem;" value="${q && q.options && q.options[3] ? q.options[3] : ''}">
                          </div>
                       </div>

                       <div style="display:flex; align-items:center; margin-bottom:10px;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">ÄÃ¡p Ã¡n Ä‘Ãºng</label>
                          <input type="text" id="add-e-q-ans-${i}" placeholder="ÄÃ¡p Ã¡n Ä‘Ãºng" class="form-input" style="flex:1; padding:6px; font-size:0.9rem;" value="${q ? q.ans : ''}">
                       </div>
                       
                       <div style="display:flex; align-items:center; margin-bottom:0;">
                          <label style="width:120px; font-weight:bold; flex-shrink:0; font-size:0.9rem;">Lá»i giáº£i chi tiáº¿t</label>
                          <textarea id="add-e-q-exp-${i}" placeholder="Lá»i giáº£i (tÃ¹y chá»n)" class="form-input" style="flex:1; padding:6px; height:40px; font-size:0.9rem;">${q ? q.explanation || '' : ''}</textarea>
                       </div>
                    </div>
                  `;
                  }).join('')}
               </div>

               <button class="btn-success" onclick="app.admin.submitAddExam(${editIdx !== undefined ? editIdx : 'null'})" style="width:100%; padding:10px;">${e ? 'LÆ°u chá»‰nh sá»­a Ä‘á» kiá»ƒm tra' : 'Táº¡o Ä‘á» kiá»ƒm tra má»›i'}</button>
            </div>
          `;
          setTimeout(() => app.admin.updateExamTopics(), 0);
      }
      else if (tab === 'tpl') {
          subBox.innerHTML = `<p>Äang chuáº©n bá»‹ file máº«u...</p>`;
          app.admin.downloadETemplate();
          setTimeout(() => this.renderESubTab('lib'), 1000);
      }
      else if (tab === 'exp') {
          subBox.innerHTML = `<p>Äang xuáº¥t dá»¯ liá»‡u...</p>`;
          app.admin.exportExams();
          setTimeout(() => this.renderESubTab('lib'), 1000);
      }
      else if (tab === 'select_for_q') {
          let qIdx = editIdx;
          let q = app.data.libraryQuestions[qIdx];
          let matchingExams = app.data.exams.map((e, i) => ({e, i})).filter(x => x.e.classlevel === q.classlevel && x.e.subject === q.subject);
          
          let html = `<div style="margin-bottom:15px;"><button class="btn-opt" onclick="app.admin.switchTab('questions'); setTimeout(()=>app.admin.renderQSubTab('lib'), 50);">Quay láº¡i Kho CÃ¢u há»i</button></div>`;
          html += `<h3>Chá»n Ä‘á» kiá»ƒm tra Ä‘á»ƒ thÃªm cÃ¢u há»i</h3>`;
          html += `<p>Äang lá»c Ä‘á» kiá»ƒm tra: <strong>${q.classlevel} - ${q.subject}</strong></p>`;
          
          if (matchingExams.length === 0) {
              html += `<p style="color:#aaa;">KhÃ´ng cÃ³ Ä‘á» kiá»ƒm tra nÃ o phÃ¹ há»£p vá»›i Cáº¥p lá»›p vÃ  MÃ´n cá»§a cÃ¢u há»i nÃ y.</p>`;
          } else {
              const cols = [
                  { label: 'Ká»³ kiá»ƒm tra', filterable: true },
                  { label: 'TÃªn Ä‘á»', filterable: true },
                  { label: 'Sá»‘ cÃ¢u', filterable: false },
                  { label: 'HÃ nh Ä‘á»™ng', filterable: false }
              ];
              html += app.ui.renderTable(cols, matchingExams, (item, idx) => {
                  return `<tr>
                      <td>${item.e.period}</td>
                      <td>${item.e.name}</td>
                      <td>${(item.e.questions||[]).length}</td>
                      <td>
                          <button class="btn-success action-btn" onclick="app.admin.renderESubTab('inject_q', {qIdx: ${qIdx}, eIdx: ${item.i}})">Chá»n Ä‘á» nÃ y</button>
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
          
          let existingOpts = (e.questions||[]).map((eq, i) => `<option value="${i}">Ghi Ä‘Ã¨ CÃ¢u ${i+1}: ${eq.q.substring(0, 30)}...</option>`).join('');
          
          subBox.innerHTML = `
             <div style="max-width: 600px; margin: 0 auto; text-align:left;">
                <div style="margin-bottom:15px;"><button class="btn-opt" onclick="app.admin.renderESubTab('select_for_q', ${qIdx})">Quay láº¡i chá»n Ä‘á»</button></div>
                <h3>ThÃªm cÃ¢u há»i vÃ o Ä‘á»: ${e.name}</h3>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>Ná»™i dung cÃ¢u há»i sáº½ thÃªm:</strong></p>
                    <p><i>${q.q}</i></p>
                    <p><strong>ÄÃ¡p Ã¡n:</strong> ${q.ans}</p>
                </div>
                
                <div style="display:flex; align-items:center; margin-bottom:15px;">
                   <label style="width:150px; font-weight:bold; flex-shrink:0;">HÃ nh Ä‘á»™ng</label>
                   <select id="inject-mode" class="form-input" style="flex:1; padding:8px;" onchange="document.getElementById('inject-target-wrap').style.display = this.value === 'overwrite' ? 'flex' : 'none'">
                      <option value="append">ThÃªm má»›i vÃ o cuá»‘i Ä‘á»</option>
                      ${existingOpts ? `<option value="overwrite">Ghi Ä‘Ã¨ lÃªn cÃ¢u há»i hiá»‡n cÃ³</option>` : ''}
                   </select>
                </div>
                
                <div id="inject-target-wrap" style="display:none; align-items:center; margin-bottom:20px;">
                   <label style="width:150px; font-weight:bold; flex-shrink:0;">Chá»n cÃ¢u Ä‘á»ƒ ghi Ä‘Ã¨</label>
                   <select id="inject-target" class="form-input" style="flex:1; padding:8px;">
                      ${existingOpts}
                   </select>
                </div>
                
                <button class="btn-success" onclick="app.admin.submitInjectQ(${qIdx}, ${eIdx})" style="width:100%; padding:10px;">XÃ¡c nháº­n thÃªm vÃ o Ä‘á»</button>
             </div>
          `;
      }
      else if (tab === 'imp') {
          subBox.innerHTML = `
            <div style="max-width: 400px; margin: 0 auto; text-align:center;">
               <h3>Nháº­p Ä‘á» kiá»ƒm tra tá»« Excel (.xlsx)</h3>
               <p style="color:#aaa; font-size:0.9rem;">Chá»‰ nháº­p thÃ´ng tin vá» Ä‘á» kiá»ƒm tra (chÆ°a cÃ³ cÃ¢u há»i).</p>
               <div style="text-align: left; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                  <label style="display:block; margin-bottom:10px; cursor:pointer;"><input type="radio" name="e-import-mode" value="append" checked style="transform:scale(1.2); margin-right:8px;"> <strong>ThÃªm má»›i</strong> (Giá»¯ nguyÃªn Ä‘á» cÅ©, thÃªm Ä‘á» má»›i)</label>
                  <label style="display:block; cursor:pointer;"><input type="radio" name="e-import-mode" value="overwrite" style="transform:scale(1.2); margin-right:8px;"> <strong style="color:#f87171;">Ghi Ä‘Ã¨</strong> (XÃ³a toÃ n bá»™ Ä‘á» cÅ©, thay báº±ng má»›i)</label>
               </div>
               <input type="file" id="e-file-upload" accept=".xlsx, .csv" style="margin: 10px 0 20px 0;">
               <button class="btn-success" onclick="app.admin.submitImportExams()" style="width:100%;">Táº£i lÃªn</button>
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
        if(!eObj.name || !eObj.subject) return alert('Vui lÃ²ng Ä‘iá»n Ä‘á»§ TÃªn Äá» vÃ  MÃ´n');
        
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
                if (typeVal === 'Tráº¯c nghiá»‡m' || typeVal === 'KÃ©o tháº£') {
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
             alert('ÄÃ£ cáº­p nháº­t Ä‘á» kiá»ƒm tra!');
        } else {
             app.data.exams.push(eObj);
             alert('ÄÃ£ táº¡o Ä‘á» kiá»ƒm tra má»›i!');
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
            alert(`ÄÃ£ ghi Ä‘Ã¨ lÃªn cÃ¢u há»i ${targetIdx + 1} thÃ nh cÃ´ng!`);
        } else {
            e.questions.push(qClone);
            alert(`ÄÃ£ thÃªm má»›i cÃ¢u há»i vÃ o cuá»‘i Ä‘á» kiá»ƒm tra!`);
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
        if (!fileInput.files.length) return alert('Vui lÃ²ng chá»n file!');
        
        const modeInput = document.querySelector('input[name="e-import-mode"]:checked');
        const mode = modeInput ? modeInput.value : 'append';
        if (mode === 'overwrite') {
            if (!confirm("Cáº¢NH BÃO: Báº¡n Ä‘Ã£ chá»n GHI ÄÃˆ. ToÃ n bá»™ Ä‘á» kiá»ƒm tra hiá»‡n cÃ³ sáº½ bá»‹ xÃ³a sáº¡ch vÃ  thay báº±ng dá»¯ liá»‡u má»›i! Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n tiáº¿p tá»¥c? (Báº¥m OK Ä‘á»ƒ Ghi Ä‘Ã¨, Cancel Ä‘á»ƒ Há»§y)")) {
                return;
            }
        }

        app.ui.importFromExcel(fileInput.files[0], async (data) => {
            if (mode === 'overwrite') {
                app.data.exams = []; if (window.supabase) await supabaseClient.from('game_exams').delete().neq('id', 0);
            }
            let count = 0;
            data.forEach(row => {
                if (row["TÃªn Ä‘á»"] && row["MÃ´n"]) {
                    app.data.exams.push({
                        name: row["TÃªn Ä‘á»"],
                        subject: row["MÃ´n"],
                        classlevel: row["Cáº¥p lá»›p"] || 'Lá»›p 5',
                        period: row["Ká»³ kiá»ƒm tra"] || 'Giá»¯a ká»³ 1',
                        questions: []
                    });
                    count++;
                }
            });
            app.data.saveExams();
            alert(`ÄÃ£ nháº­p thÃ nh cÃ´ng ${count} Ä‘á» kiá»ƒm tra (vá»)!`);
            this.renderESubTab('lib');
        });
    },
    viewExam(idx) {
       const exam = app.data.exams[idx];
       let html = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
             <h3>Chi tiáº¿t Ä‘á»: ${exam.name}</h3>
             <div>
                <button class="btn-primary" onclick="window.print()">In PDF / A4</button>
                <button class="btn-opt" onclick="app.admin.renderESubTab('lib')">Quay láº¡i</button>
             </div>
          </div>
          <div id="print-area" style="background:#fff; color:#000; padding:20px; text-align:left; margin-top:20px; min-height:400px;">
             <h2 style="text-align:center;">BÃ€I KIá»‚M TRA ${exam.period.toUpperCase()}</h2>
             <p style="text-align:center;"><strong>MÃ´n:</strong> ${exam.subject} - <strong>Lá»›p:</strong> ${exam.classlevel}</p>
             <hr style="margin:20px 0;">
       `;
       if (!exam.questions || exam.questions.length === 0) {
           html += `<p style="text-align:center;">Äá» kiá»ƒm tra nÃ y chÆ°a cÃ³ cÃ¢u há»i nÃ o.</p>`;
       } else {
           exam.questions.forEach((q, i) => {
               html += `
                  <div style="margin-bottom: 20px;">
                     <p><strong>CÃ¢u ${i+1} (${q.type}):</strong> ${q.q}</p>
                     ${q.options && q.options.length > 0 ? `<ul style="list-style-type:none; padding-left:20px;">${q.options.map(o => `<li>- [  ] ${o}</li>`).join('')}</ul>` : ''}
                     ${q.type === 'Äiá»n khuyáº¿t' ? `<p>....................................................................</p>` : ''}
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
           <button class="btn-primary" id="btn-sub-players" style="flex:1;" onclick="app.admin.renderPlayersList(false)">Danh sÃ¡ch há»c sinh</button>
           <button class="btn-opt" id="btn-sub-pending" style="flex:1;" onclick="app.admin.renderPlayersList(true)">PhÃª duyá»‡t</button>
           <button class="btn-success" id="btn-sub-add" style="flex:1;" onclick="app.admin.showAddPlayerForm()">+ ThÃªm má»›i</button>
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
        { label: 'Cáº¥p lá»›p', filterable: true },
        { label: 'Há» tÃªn', filterable: true },
        { label: 'TÃªn Ä‘Äƒng nháº­p', filterable: true },
        { label: 'Máº­t kháº©u', filterable: false },
        { label: 'HÃ nh Ä‘á»™ng', filterable: false }
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
            actionBtns = `<button class="btn-success action-btn" onclick="app.admin.approveUser('${u.username}')">Duyá»‡t</button>
                          <button class="btn-danger action-btn" onclick="app.admin.deleteUser('${u.username}')">XÃ³a</button>`;
        } else {
            actionBtns = `<button class="btn-opt action-btn" onclick="app.admin.showAddPlayerForm('${u.username}')">Sá»­a</button>
                          <button class="btn-danger action-btn" onclick="app.admin.deleteUser('${u.username}')">XÃ³a</button>`;
        }
        return `<tr>
          <td>${u.classlevel||''}</td><td>${u.fullname||''}</td>
          <td>${u.username}</td><td>${u.password||''}</td>
          <td>${actionBtns}</td>
        </tr>`;
      }, isPending ? "KhÃ´ng cÃ³ há»c sinh nÃ o chá» duyá»‡t" : "ChÆ°a cÃ³ há»c sinh nÃ o");
      subBox.innerHTML = html;
    },
    async approveUser(username) {
        let user = app.data.users.find(u => u.username === username);
        if (user) {
            user.approved = true;
            if (user.id) {
                await supabaseClient.from('game_users').update({ approved: true }).eq('id', user.id);
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
          <h3>${u ? 'Sá»­a thÃ´ng tin há»c sinh' : 'ThÃªm há»c sinh má»›i'}</h3>
          <div style="max-width: 500px; margin: 0 auto; text-align:left;">
             <div style="display:flex; align-items:center; margin-bottom:10px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">Há» vÃ  tÃªn</label>
                <input type="text" id="add-fullname" placeholder="Há» vÃ  tÃªn" class="form-input" style="flex:1; padding:8px;" value="${u ? u.fullname : ''}">
             </div>
             
             <div style="display:flex; align-items:center; margin-bottom:10px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">TÃªn Ä‘Äƒng nháº­p</label>
                <input type="text" id="add-username" placeholder="TÃªn Ä‘Äƒng nháº­p" class="form-input" style="flex:1; padding:8px;" value="${u ? u.username : ''}">
             </div>
             
             <div style="display:flex; align-items:center; margin-bottom:10px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">Máº­t kháº©u</label>
                <input type="text" id="add-password" placeholder="Máº­t kháº©u" class="form-input" style="flex:1; padding:8px;" value="${u ? u.password : ''}">
             </div>
             
             <div style="display:flex; align-items:center; margin-bottom:15px;">
                <label style="width:130px; font-weight:bold; flex-shrink:0;">Cáº¥p lá»›p</label>
                <select id="add-class" class="form-input" style="flex:1; padding:8px;">
                   <option value="1" ${u && u.classlevel === '1' ? 'selected' : ''}>Lá»›p 1</option>
                   <option value="2" ${u && u.classlevel === '2' ? 'selected' : ''}>Lá»›p 2</option>
                   <option value="3" ${u && u.classlevel === '3' ? 'selected' : ''}>Lá»›p 3</option>
                   <option value="4" ${u && u.classlevel === '4' ? 'selected' : ''}>Lá»›p 4</option>
                   <option value="5" ${u && u.classlevel === '5' ? 'selected' : (!u ? 'selected' : '')}>Lá»›p 5</option>
                </select>
             </div>
             
             <button class="btn-success" onclick="app.admin.addPlayerSubmit('${typeof editUsername === 'string' ? editUsername : ''}')" style="width:100%; padding:10px;">${u ? 'LÆ°u chá»‰nh sá»­a' : 'Táº¡o tÃ i khoáº£n'}</button>
          </div>
        `;
    },
    addPlayerSubmit(editUsername) {
        const fn = document.getElementById('add-fullname').value.trim();
        const un = document.getElementById('add-username').value.trim();
        const pw = document.getElementById('add-password').value.trim();
        const cl = document.getElementById('add-class').value;
        if (!fn || !un || !pw) return alert('Äiá»n Ä‘á»§ thÃ´ng tin!');
        
        if (editUsername) {
            let user = app.data.users.find(x => x.username === editUsername);
            if (user) {
                if (un !== editUsername && app.data.users.find(x => x.username === un)) {
                    return alert('TÃªn Ä‘Äƒng nháº­p má»›i Ä‘Ã£ tá»“n táº¡i!');
                }
                user.fullname = fn;
                user.username = un;
                user.password = pw;
                user.classlevel = cl;
                alert('ÄÃ£ cáº­p nháº­t thÃ´ng tin há»c sinh!');
            }
        } else {
            if (app.data.users.find(x => x.username === un)) return alert('TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ tá»“n táº¡i!');
            app.data.users.push({ fullname: fn, username: un, password: pw, classlevel: cl, role: 'student', approved: true, history: [], totalscore: 0, lollipops: 0 });
            alert('ÄÃ£ táº¡o tÃ i khoáº£n há»c sinh!');
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
    async deleteQuestion(idx) { if(confirm('Xác nhận xóa?')) { const q = app.data.libraryQuestions[idx]; app.data.libraryQuestions.splice(idx, 1); if (q && q.id && window.supabase) { await supabaseClient.from('game_questions').delete().eq('id', q.id); } app.data.saveLibrary(); this.renderQSubTab('lib'); } },
    editExam(idx) {
        this.renderESubTab('add', idx);
    },
    removeQuestionFromExam(examIdx, qIdx) {
        if(confirm('XÃ³a cÃ¢u há»i nÃ y khá»i Ä‘á» kiá»ƒm tra?')) {
            app.data.exams[examIdx].questions.splice(qIdx, 1);
            app.data.saveExams();
            this.renderESubTab('add', examIdx);
        }
    },
    async deleteExam(idx) { if(confirm('Xác nhận xóa?')) { const e = app.data.exams[idx]; app.data.exams.splice(idx, 1); if (e && e.id && window.supabase) { await supabaseClient.from('game_exams').delete().eq('id', e.id); } app.data.saveExams(); this.renderESubTab('lib'); } },
    async deleteUser(username) {
      if(confirm('XÃ³a há»c sinh nÃ y?')) { 
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
      document.getElementById('treasure-title').textContent = 'Kho BÃ¡u';
      
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
            { id: 'leaderboard', label: 'Báº£ng thÃ nh tÃ­ch' },
            { id: 'history', label: 'Lá»‹ch sá»­ lÃ m bÃ i' }
         ];
         app.ui.renderTabs(tabs, tab, 'app.treasure.switchTab');
         
         if (tab === 'leaderboard') this.renderAdminLeaderboard(box);
         else if (tab === 'history') this.renderAdminHistory(box);
      } else {
         const tabs = [
            { id: 'my_treasure', label: 'ThÃ nh tÃ­ch' },
            { id: 'history', label: 'Lá»‹ch sá»­ lÃ m bÃ i' }
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
    executePrint() {
        const mode = document.querySelector('input[name="print_mode"]:checked').value;
        this.exportToImage(mode);
    },
    renderAdminLeaderboard(box, classFilter = 'Táº¥t cáº£', limitFilter = 'Táº¥t cáº£ theo cáº¥p lá»›p', fromDate = '', toDate = '', updateTableOnly = false) {
      const cols = [
         { label: 'Háº¡ng', filterable: false },
         { label: 'Há»c sinh', filterable: false },
         { label: 'Sá»‘ bÃ i Ä‘Ã£ lÃ m', filterable: false },
         { label: 'Äiá»ƒm', filterable: false },
         { label: 'Káº¹o', filterable: false }
      ];
      let students = app.data.users.filter(u => u.role?.toLowerCase() !== 'admin');
      
      if (classFilter !== 'Táº¥t cáº£') {
          const cls = classFilter.replace('Lá»›p ', '');
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
             <button class="acp-btn" onclick="app.treasure.renderAdminLeaderboard(document.getElementById('treasure-content-area'))">Táº¥t cáº£</button>
             <div class="acp-center">
                 <div class="acp-row">
                     <input type="hidden" id="admin-lb-class" value="${classFilter}">
                     ${['Lá»›p 1','Lá»›p 2','Lá»›p 3','Lá»›p 4','Lá»›p 5'].map(c => `<button class="${c===classFilter?'btn-primary':'btn-opt'}" onclick="document.getElementById('admin-lb-class').value='${c}'; app.treasure.applyFilters('leaderboard', false)">${c}</button>`).join('')}
                 </div>
                 <div class="acp-row">
                     <input type="hidden" id="admin-lb-limit" value="${limitFilter}">
                     ${['Top 10','Top 20','Táº¥t cáº£ theo cáº¥p lá»›p'].map(l => `<button class="${l===limitFilter?'btn-primary':'btn-opt'}" onclick="document.getElementById('admin-lb-limit').value='${l}'; app.treasure.applyFilters('leaderboard', false)">${l}</button>`).join('')}
                 </div>
                 <div class="acp-row" style="margin-top:5px;">
                     <label>Tá»« ngÃ y:</label><input type="date" id="admin-lb-from" value="${fromDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('leaderboard', true)">
                     <label>Äáº¿n ngÃ y:</label><input type="date" id="admin-lb-to" value="${toDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('leaderboard', true)">
                 </div>
             </div>
             <button class="acp-btn btn-success" onclick="app.treasure.showPrintModal('leaderboard')">In danh sÃ¡ch</button>
          </div>
          <div id="admin-lb-table-container"></div>`;
          box.innerHTML = html;
      }
      
      const tableHtml = app.ui.renderTable(cols, lbData, (s, i) => {
         const totalExams = s.filteredHistory.length;
         const maxScore = totalExams * 10;
         const scoreDisplay = `${s.filteredScore}/${maxScore}`;
         return `<tr><td>${i+1}</td><td>${s.fullname}</td><td>${totalExams}</td><td>${scoreDisplay}</td><td>${s.lollipops||0}</td></tr>`;
      });
      
      const container = document.getElementById('admin-lb-table-container');
      if (container) container.innerHTML = tableHtml;
    },
    renderAdminHistory(box, classFilter = 'Táº¥t cáº£', studentFilter = '', fromDate = '', toDate = '', updateTableOnly = false) {
      const cols = [
         { label: 'Cáº¥p lá»›p', filterable: false },
         { label: 'Há»c sinh', filterable: false },
         { label: 'BÃ i lÃ m', filterable: false },
         { label: 'Äiá»ƒm', filterable: false },
         { label: 'NgÃ y', filterable: false },
         { label: 'Chi tiáº¿t', filterable: false }
      ];
      let allHist = [];
      app.data.users.filter(u => u.role?.toLowerCase() !== 'admin').forEach(u => {
         (u.history || []).forEach(h => {
             allHist.push({ ...h, studentName: u.fullname, username: u.username, classlevel: u.classlevel || '' });
         });
      });
      // Sort by latest
      allHist.sort((a,b) => new Date(b.date) - new Date(a.date));
      
      let classFilteredUsers = app.data.users.filter(u => u.role?.toLowerCase() !== 'admin');
      
      if (classFilter !== 'Táº¥t cáº£') {
          const cls = classFilter.replace('Lá»›p ', '');
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
             <button class="acp-btn" onclick="app.treasure.renderAdminHistory(document.getElementById('treasure-content-area'))">Táº¥t cáº£</button>
             <div class="acp-center">
                 <div class="acp-row">
                     <input type="hidden" id="admin-hist-class" value="${classFilter}">
                     ${['Lá»›p 1','Lá»›p 2','Lá»›p 3','Lá»›p 4','Lá»›p 5'].map(c => `<button class="${c===classFilter?'btn-primary':'btn-opt'}" onclick="document.getElementById('admin-hist-class').value='${c}'; document.getElementById('admin-hist-student').value=''; app.treasure.applyFilters('history', false)">${c}</button>`).join('')}
                 </div>
                 <div class="acp-row">
                     <input list="admin-hist-student-list" id="admin-hist-student" class="form-input" placeholder="ðŸ” Nháº­p tÃ¬m kiáº¿m há»c sinh..." value="${studentFilter}" style="width:100%; max-width:300px; padding:5px;" oninput="app.treasure.applyFilters('history', true)">
                     <datalist id="admin-hist-student-list">
                         ${studentOptions}
                     </datalist>
                 </div>
                 <div class="acp-row" style="margin-top:5px;">
                     <label>Tá»« ngÃ y:</label><input type="date" id="admin-hist-from" value="${fromDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('history', true)">
                     <label>Äáº¿n ngÃ y:</label><input type="date" id="admin-hist-to" value="${toDate}" class="form-input" style="padding:5px;" onchange="app.treasure.applyFilters('history', true)">
                 </div>
             </div>
             <button class="acp-btn btn-success" onclick="app.treasure.showPrintModal('history')">In danh sÃ¡ch</button>
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
             star = ' ðŸ­';
         }
         
         const scoreHtml = `<span style="color: ${scoreColor}; ${scoreStyle}">${s}/10${star}</span>`;
         const clsDisplay = h.classlevel ? (String(h.classlevel).includes('Lá»›p') ? h.classlevel : 'Lá»›p ' + h.classlevel) : '';
         
         return `<tr><td>${clsDisplay}</td><td>${h.studentName}</td><td>${h.title}</td><td>${scoreHtml}</td><td>${h.date}</td>
         <td><button class="btn-success action-btn" data-record="${encoded}" onclick="app.ui.showHistoryDetails(this)">Xem</button></td></tr>`;
      });
      
      const container = document.getElementById('admin-hist-table-container');
      if (container) container.innerHTML = tableHtml;
    },
    renderStudentTreasure(box, u) {
      let html = `<div style="text-align:center; padding: 30px 0;">
         <h3 style="font-size: 1.5rem;">Kho bÃ¡u cá»§a ${u.fullname}</h3>
         <p style="color: #ccc; margin-top: 10px;">Tá»•ng Ä‘iá»ƒm: <span style="color:#fde047; font-weight:bold; font-size:1.2rem;">${u.totalscore||0}</span></p>
         <div style="font-size:2rem; margin:20px 0; display:flex; flex-wrap:wrap; justify-content:center; gap:5px;">`;
      const lolli = u.lollipops || 0;
      if (lolli === 0) html += `<p style="font-size: 1rem; color: #888;">Báº¡n chÆ°a cÃ³ káº¹o nÃ o. HÃ£y hoÃ n thÃ nh bÃ i Ä‘á»ƒ nháº­n káº¹o nhÃ©!</p>`;
      for(let i=0; i<lolli; i++) html += '<img src="./public/lollipop.png" style="width:50px; margin:2px;" class="bounce">';
      html += '</div></div>';
      box.innerHTML = html;
    },
    renderStudentHistory(box, u) {
      const cols = [
         { label: 'BÃ i lÃ m', filterable: true },
         { label: 'Äiá»ƒm', filterable: false },
         { label: 'NgÃ y', filterable: true },
         { label: 'Chi tiáº¿t', filterable: false }
      ];
      let myHist = [...(u.history || [])];
      myHist.sort((a,b) => new Date(b.date) - new Date(a.date));
      box.innerHTML = app.ui.renderTable(cols, myHist, (h, i) => {
         const encoded = encodeURIComponent(JSON.stringify(h));
         return `<tr><td>${h.title}</td><td>${h.score}</td><td>${h.date}</td>
         <td><button class="btn-success action-btn" data-record="${encoded}" onclick="app.ui.showHistoryDetails(this)">Xem</button></td></tr>`;
      }, "ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch sá»­");
    },
    exportToImage(mode) {
        document.getElementById('print-modal').style.display = 'none';
        const type = window.printContext; // 'leaderboard' or 'history'
        
        let fromDate = '', toDate = '', classFilter = 'Táº¥t cáº£';
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
        
        const dateStr = (fromDate || toDate) ? `Tá»« ngÃ y ${fromDate || '...'} Ä‘áº¿n ngÃ y ${toDate || '...'}` : 'Táº¥t cáº£ thá»i gian';
        const classStr = classFilter !== 'Táº¥t cáº£' ? `Cáº¥p ${classFilter}` : 'Táº¥t cáº£ cáº¥p lá»›p';
        
        // Setup simple print vs graphic print
        if (mode === 'simple') {
            const tableHTML = document.querySelector('#treasure-content-area .data-table').outerHTML;
            const printWin = window.open('', '_blank');
            printWin.document.write(`
                <html><head><title>In danh sÃ¡ch</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h2, h3 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                </style>
                </head><body>
                <h2>${type === 'leaderboard' ? 'Báº¢NG THÃ€NH TÃCH' : 'Lá»ŠCH Sá»¬ LÃ€M BÃ€I'}</h2>
                <h3>${dateStr}</h3>
                <h3>${classStr}</h3>
                ${studentNameStr ? `<h3>Há» tÃªn: ${studentNameStr}</h3>` : ''}
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
            studentEl.textContent = `Há» tÃªn: ${studentNameStr}`;
        } else {
            studentEl.style.display = 'none';
        }
        
        // Clone table and apply huge font styling for 2K
        const sourceTable = document.querySelector('#treasure-content-area .data-table');
        if (!sourceTable) return alert("KhÃ´ng cÃ³ dá»¯ liá»‡u Ä‘á»ƒ in.");
        
        const clonedTable = sourceTable.cloneNode(true);
        clonedTable.style.width = '100%';
        clonedTable.style.background = 'transparent';
        clonedTable.style.color = '#fff';
        clonedTable.style.fontSize = '2rem';
        clonedTable.style.borderCollapse = 'collapse';
        
        // Remove Action column (Chi tiáº¿t / Xem) if exists
        const headerRow = clonedTable.querySelector('thead tr');
        if (headerRow && headerRow.children.length > 0) {
           const lastHeader = headerRow.children[headerRow.children.length - 1];
           if (lastHeader.textContent.includes('Chi tiáº¿t') || lastHeader.textContent.includes('HÃ nh Ä‘á»™ng')) {
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
            return alert("Lá»—i: KhÃ´ng tÃ¬m tháº¥y thÆ° viá»‡n html2canvas. HÃ£y kiá»ƒm tra káº¿t ná»‘i máº¡ng.");
        }
        
        alert("Há»‡ thá»‘ng Ä‘ang trÃ­ch xuáº¥t áº£nh 2K, vui lÃ²ng chá» trong giÃ¢y lÃ¡t...");
        
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
            console.error("Lá»—i xuáº¥t áº£nh:", err);
            alert("ÄÃ£ xáº£y ra lá»—i khi táº¡o áº£nh.");
        });
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
};





