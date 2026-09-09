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
const dummyChannel = {
    on() { return this; },
    subscribe() { return this; }
};
const dummySupabase = {
    from: () => dummyQuery,
    auth: {
        signInWithPassword: async () => ({ data: null, error: { message: 'Offline' } }),
        signUp: async () => ({ data: null, error: { message: 'Offline' } }),
        updateUser: async () => ({ data: null, error: { message: 'Offline' } }),
        signOut: async () => ({ error: null })
    },
    functions: { invoke: async () => ({ data: null, error: { message: 'Offline' } }) },
    channel: () => dummyChannel
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

// Bảng danh hiệu 20 bậc (5 nhóm × 4 cấp), sắp xếp GIẢM DẦN theo số Sao cần đạt.
// Người chơi đạt danh hiệu tương ứng tổng Sao tích lũy (total_stars_earned) vượt qua ngưỡng.
const PLAYER_TITLES = [
    { stars: 2463, name: 'Nhà Khoa Học Vĩ Đại' },
    { stars: 2063, name: 'Nhà Khoa Học Thiên Tài' },
    { stars: 1713, name: 'Nhà Khoa Học' },
    { stars: 1413, name: 'Nhà Khoa Học Nhí' },
    { stars: 1153, name: 'Nhà Phát Minh Uyên Bác' },
    { stars: 933, name: 'Nhà Phát Minh Tài Năng' },
    { stars: 743, name: 'Nhà Phát Minh' },
    { stars: 583, name: 'Nhà Phát Minh Nhí' },
    { stars: 448, name: 'Nhà Nghiên Cứu Đại Tài' },
    { stars: 338, name: 'Nhà Nghiên Cứu Tài Ba' },
    { stars: 248, name: 'Nhà Nghiên Cứu' },
    { stars: 178, name: 'Nhà Nghiên Cứu Nhí' },
    { stars: 123, name: 'Đội Trưởng Bậc Thầy' },
    { stars: 83, name: 'Đội Trưởng Siêu Việt' },
    { stars: 53, name: 'Đội Trưởng Thiên Tài' },
    { stars: 33, name: 'Đội Trưởng Sáng Tạo' },
    { stars: 18, name: 'Học Trò Xuất Sắc' },
    { stars: 8, name: 'Học Trò Gương Mẫu' },
    { stars: 3, name: 'Học Trò Chăm Chỉ' },
    { stars: 0, name: 'Học Trò Tò Mò' }
];

// D2: bộ nhớ đệm getElementById để giảm truy vấn DOM lặp lại ở các hàm hot.
const _domCache = new Map();
function $id(id) {
    if (!_domCache.has(id)) _domCache.set(id, document.getElementById(id));
    return _domCache.get(id);
}

const app = {
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

    showGuide() {
        const modal = document.getElementById('guide-modal');
        if (modal) {
            modal.style.display = 'flex';
            const isAdmin = app.data.currentUser?.role?.toLowerCase() === 'admin';
            modal.querySelectorAll('.guide-admin-only').forEach(element => {
                element.hidden = !isAdmin;
            });
            const content = document.getElementById('guide-content');
            if (content) content.scrollTop = 0;
            const arrow = document.getElementById('guide-arrow');
            if (arrow) arrow.style.display = 'none';
            if (app.data.currentUser) {
                app.safeStorage.setItem('guide_seen_' + app.data.currentUser.username, 'true');
            }
        }
    },
    hideGuide() {
        const modal = document.getElementById('guide-modal');
        if (modal) modal.style.display = 'none';
    },
    goToGuide(sectionId) {
        const content = document.getElementById('guide-content');
        const section = document.getElementById(sectionId);
        if (!content || !section || section.hidden) return false;
        content.scrollTo({ top: Math.max(0, section.offsetTop - content.offsetTop - 8), behavior: 'smooth' });
        section.focus({ preventScroll: true });
        return false;
    },
    getEquippedPet(user) {
        // Giáo viên không sở hữu/trang bị thú cưng; chú mèo robot vẫn là linh vật mặc định khi test bài.
        if (user?.role?.toLowerCase() === 'admin') return 'robot_cat_normal.webp';
        const savedPet = user ? app.safeStorage.getItem('equipped_pet_' + user.username) : null;
        // Keep existing pupils' default selection working while moving the mascot to its new art set.
        return (!savedPet || savedPet === 'cat_normal.png') ? 'robot_cat_normal.webp' : savedPet;
    },

    data: {
        sanitizeHTML(str) {
            if (!str) return '';
            return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        },
        genderLabel(value) {
            return ({ male: 'Nam', female: 'Nữ', other: 'Khác / không muốn nêu' })[String(value || '')] || '—';
        },
        formatMathNumber(value) {
            const digits = String(value ?? '').replace(/\s/g, '');
            if (!/^\d+$/.test(digits)) return String(value ?? '');
            return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
        },
        formatMathText(value) {
            return String(value ?? '').replace(/(\bnăm\s+)(\d{1,4})\b|\b\d{1,3}(?:[ \u00a0]\d{3})+\b|\b\d{4,}\b/giu, (match, yearPrefix, year) => {
                return yearPrefix ? `${yearPrefix}${year}` : this.formatMathNumber(match);
            });
        },
        formatMathHTML(value) {
            // Câu hỏi động có thể chứa SVG. Chỉ định dạng số trong phần văn bản,
            // tuyệt đối không đổi khoảng trắng trong thuộc tính như viewBox hoặc points.
            return String(value ?? '')
                .split(/(<span\b[^>]*\bdata-year\b[^>]*>[\s\S]*?<\/span>|<\/?[a-z][^>]*>)/gi)
                .map(part => /^<span\b[^>]*\bdata-year\b/i.test(part) || /^<\/?[a-z]/i.test(part) ? part : this.formatMathText(part))
                .join('');
        },
        formatQuestionDetailHTML(value) {
            return String(value ?? '')
                .split(/<br\s*\/?\s*>/i)
                .map(part => this.sanitizeHTML(this.formatMathText(part.trim())))
                .filter(Boolean)
                .join('<br>');
        },
        parseMathNumber(value) {
            const digits = String(value ?? '').replace(/\s/g, '');
            return /^\d+$/.test(digits) ? Number(digits) : NaN;
        },
        users: [],
        libraryQuestions: [],
        questionTemplates: [],
        exams: [],
        petInventory: {},
        seenQuestionKeys: new Set(),
        settings: { hardTimeLimit: 10, examTimeLimit: 30, lessonMetadata: { questions: {}, quests: {} } },
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
        normalizeQuestionPart(value) {
            return String(value || '')
                .trim()
                .normalize('NFC')
                .replace(/\s+/g, ' ')
                .toLocaleLowerCase('vi-VN');
        },
        ensureLessonMetadata() {
            if (!this.settings || typeof this.settings !== 'object') this.settings = {};
            if (!this.settings.lessonMetadata || typeof this.settings.lessonMetadata !== 'object') this.settings.lessonMetadata = {};
            if (!this.settings.lessonMetadata.questions || typeof this.settings.lessonMetadata.questions !== 'object') this.settings.lessonMetadata.questions = {};
            if (!this.settings.lessonMetadata.quests || typeof this.settings.lessonMetadata.quests !== 'object') this.settings.lessonMetadata.quests = {};
            return this.settings.lessonMetadata;
        },
        getQuestionBaseKey(question) {
            return [
                question?.classlevel,
                question?.subject,
                question?.semester,
                question?.topic,
                question?.q
            ].map(value => this.normalizeQuestionPart(value)).join('|');
        },
        getQuestionLessonMetadataKey(question) {
            return question?.id ? `id:${question.id}` : `key:${this.getQuestionBaseKey(question)}`;
        },
        getQuestLessonMetadataKey(quest) {
            return quest?.id ? `id:${quest.id}` : `key:${this.normalizeQuestionPart(quest?.title)}`;
        },
        hydrateQuestionLessons(questions) {
            const metadata = this.ensureLessonMetadata().questions;
            (questions || []).forEach(question => {
                if (!question || question.lesson) return;
                const stored = metadata[this.getQuestionLessonMetadataKey(question)];
                if (stored?.lesson) question.lesson = stored.lesson;
            });
            return questions;
        },
        syncQuestionLessonMetadata(questions = this.libraryQuestions) {
            const metadata = this.ensureLessonMetadata().questions;
            (questions || []).forEach(question => {
                if (!question) return;
                const key = this.getQuestionLessonMetadataKey(question);
                const lesson = String(question.lesson || '').trim();
                if (lesson) metadata[key] = { lesson };
                else if (metadata[key]) delete metadata[key];
            });
            return metadata;
        },
        hydrateQuestCurriculum(quests) {
            const metadata = this.ensureLessonMetadata().quests;
            (quests || []).forEach(quest => {
                if (!quest || quest.curriculum) return;
                const stored = metadata[this.getQuestLessonMetadataKey(quest)];
                if (stored?.curriculum) quest.curriculum = stored.curriculum;
            });
            return quests;
        },
        syncQuestCurriculumMetadata(quests = this.quests) {
            const metadata = this.ensureLessonMetadata().quests;
            (quests || []).forEach(quest => {
                if (!quest) return;
                const curriculum = quest.curriculum && typeof quest.curriculum === 'object' ? quest.curriculum : null;
                const key = this.getQuestLessonMetadataKey(quest);
                if (curriculum && Object.values(curriculum).some(Boolean)) metadata[key] = { curriculum };
                else if (metadata[key]) delete metadata[key];
            });
            return metadata;
        },
        async saveLessonMetadata() {
            this.ensureLessonMetadata();
            if (!window.supabase) {
                app.safeStorage.setItem('game_settings', JSON.stringify(this.settings));
                return null;
            }
            const { error } = await supabaseClient.from('game_settings').update({ data: this.settings }).eq('id', 1);
            if (error) {
                console.error('Không thể đồng bộ metadata Bài học:', error);
                app.safeStorage.setItem('game_settings', JSON.stringify(this.settings));
            }
            return error;
        },
        getQuestionKey(question) {
            const parts = [
                question?.classlevel,
                question?.subject,
                question?.semester,
                question?.topic
            ];
            if (question?.lesson) parts.push(question.lesson);
            parts.push(question?.q);
            return parts.map(value => this.normalizeQuestionPart(value)).join('|');
        },
        getQuestionContentKey(question) {
            const normalize = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi-VN');
            const serializedParts = [
                question?.templateId || question?.generator_key,
                question?.q,
                question?.ans,
                question?.options,
                question?.subquestions,
                question?.practiceRows,
                question?.comparisonRows,
                question?.statements,
                question?.sequenceRounds,
                question?.lesson
            ];
            return JSON.stringify(serializedParts).replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN') || normalize(question?.q);
        },
        generateTemplateQuestion(template) {
            const registry = window.Grade4MathTemplates;
            if (!registry?.templateIds?.includes(template?.generator_key)) return null;
            try {
                const generated = registry.generateQuestion(template.generator_key, template.config || {});
                const variables = { question: generated.q, ...(generated.templateVariables || {}) };
                const legacySafePrompt = 'Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng mật khẩu có {codeLength} chữ số, {condition1} và {condition2}.';
                const safePrompt = 'Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng {condition1} và {condition2}.';
                const legacySingleQuestionPrompts = {
                    'number.digit_at_place': ['Số nào dưới đây có chữ số hàng {place} là {digit}?'],
                    'number.smallest_of_four': ['Hãy tìm số bé nhất trong các số sau.'],
                    'number.largest_of_four': ['Hãy tìm số lớn nhất trong các số sau.'],
                    'number.compose_from_places': ['Viết số rồi đọc số, biết số đó gồm {place_values}. Số đó là {blank}'],
                    'number.missing_expanded_addend': ['Điền số còn thiếu:<br>{number} = {expression}'],
                    'number.neighbor_numbers': ['Hãy nhập số liền trước và số liền sau của {number}:<br>{neighbor_line}'],
                    'number.compare_number_forms': ['Điền dấu thích hợp:<br>{comparison}'],
                    'number.safe_password_by_place_value': [legacySafePrompt, safePrompt]
                };
                const savedPrompt = String(template.prompt_template || '{question}').trim();
                const structuralMeasurementTemplate = String(template.generator_key || '').startsWith('measurement.');
                const promptTemplate = structuralMeasurementTemplate && !savedPrompt.includes('{question}')
                    ? '{question}'
                    : legacySingleQuestionPrompts[template.generator_key]?.includes(savedPrompt)
                    ? '{question}'
                    : savedPrompt;
                const prompt = promptTemplate.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, key) => variables[key] ?? token);
                return {
                    ...generated,
                    q: this.formatMathHTML(prompt),
                    classlevel: template.classlevel,
                    subject: template.subject,
                    semester: template.semester,
                    topic: template.topic,
                    lesson: app.curriculum?.getTemplateLesson(template) || template.lesson || template.config?.lesson || '',
                    type: template.question_type || generated.type,
                    templateId: template.generator_key
                };
            } catch (error) {
                console.error(`Không thể sinh câu hỏi từ template ${template?.generator_key}:`, error);
                return null;
            }
        },
        validateQuestionMetadata(question) {
            const classlevel = String(question.classlevel || '').trim();
            const subject = String(question.subject || '').trim().normalize('NFC');
            const semester = String(question.semester || '').trim().normalize('NFC');
            const topic = String(question.topic || '').trim().normalize('NFC');
            const lesson = String(question.lesson || question.config?.lesson || '').trim();
            const classMatch = classlevel.match(/^Lớp\s+([1-5])$/i);
            const classNumber = classMatch ? classMatch[1] : '';
            const validSubjects = ['Toán', 'Tiếng Việt'];
            const subjectKey = subject === 'Toán' ? 'math' : (subject === 'Tiếng Việt' ? 'vietnamese' : '');
            const semesterKey = semester === 'Học kỳ 1' ? 'hk1' : (semester === 'Học kỳ 2' ? 'hk2' : '');

            if (!classNumber) return 'Cấp lớp phải là từ Lớp 1 đến Lớp 5.';
            if (!validSubjects.includes(subject)) return 'Môn học chỉ được là Toán hoặc Tiếng Việt.';
            if (!semesterKey) return 'Học kỳ phải là Học kỳ 1 hoặc Học kỳ 2.';

            const validTopics = app.constants.topics[classNumber]?.[subjectKey]?.[semesterKey] || [];
            if (!validTopics.includes(topic)) return `Chủ đề "${topic || '(trống)'}" không thuộc ${classlevel} – ${subject} – ${semester}.`;
            if (lesson && (!app.curriculum?.supportsLessons(classlevel, subject) || !app.curriculum.isLessonValid({ classlevel, subject, semester, topic, lesson }))) {
                return `Bài học "${lesson}" không thuộc ${classlevel} – ${subject} – ${semester} – ${topic}.`;
            }
            return '';
        },
        getQuestionAnswerCount(question) {
            if (Array.isArray(question?.statements)) return question.statements.length;
            const answer = String(question?.ans || '').trim();
            if (!answer) return 0;
            return answer.split(/[|,]/).map(part => part.trim()).filter(Boolean).length;
        },
        validateQuestionScoring(question) {
            const count = this.getQuestionAnswerCount(question);
            const partAnswerCounts = Array.isArray(question?.partAnswerCounts)
                ? question.partAnswerCounts.map(Number)
                : [];
            const hasGroupedParts = partAnswerCounts.length === 4
                && partAnswerCounts.every(partCount => Number.isInteger(partCount) && partCount > 0)
                && partAnswerCounts.reduce((total, partCount) => total + partCount, 0) === count;
            if (hasGroupedParts) return '';
            if (![1, 2, 4].includes(count)) {
                return 'Mỗi câu hỏi chỉ được có 1, 2 hoặc 4 câu trả lời đúng để chấm theo thang điểm 1; 0,5; 0,25.';
            }
            return '';
        },
        async loadSeenQuestions(username) {
            this.seenQuestionKeys = new Set();
            if (!username) return;
            if (!window.supabase) {
                const stored = app.safeStorage.getItem(`seen_questions_${username}`);
                try { this.seenQuestionKeys = new Set(JSON.parse(stored || '[]')); } catch (_) { /* empty */ }
                return;
            }
            const { data, error } = await supabaseClient.from('user_question_history')
                .select('question_key')
                .eq('user_username', username);
            if (error) {
                console.error('Không thể tải lịch sử câu hỏi đã gặp:', error);
                return;
            }
            this.seenQuestionKeys = new Set((data || []).map(item => item.question_key));
        },
        async markQuestionsSeen(questions) {
            const user = this.currentUser;
            if (!user || user.role?.toLowerCase() === 'admin' || !questions.length) return;
            const now = new Date().toISOString();
            const records = questions.map(question => ({
                user_username: user.username,
                question_key: this.getQuestionKey(question),
                last_seen_at: now
            }));
            records.forEach(record => this.seenQuestionKeys.add(record.question_key));

            if (!window.supabase) {
                app.safeStorage.setItem(`seen_questions_${user.username}`, JSON.stringify([...this.seenQuestionKeys]));
                return;
            }
            const { error } = await supabaseClient.from('user_question_history')
                .upsert(records, { onConflict: 'user_username,question_key' });
            if (error) console.error('Không thể lưu lịch sử câu hỏi đã gặp:', error);
        },
        getPetStock(petId, fallbackStock) {
            const stock = this.petInventory[petId];
            return Number.isInteger(stock) && stock >= 0 ? stock : fallbackStock;
        },
        async refreshPetInventory() {
            const inventory = await this.fetchAllFromSupabase('pet_inventory');
            this.petInventory = {};
            inventory.forEach(item => {
                this.petInventory[item.pet_id] = Number(item.remaining);
            });
        },
        async setPetStock(petId, remaining) {
            if (!window.supabase) {
                this.petInventory[petId] = remaining;
                return true;
            }

            const { data, error } = await supabaseClient.from('pet_inventory')
                .upsert({ pet_id: petId, remaining })
                .select();
            if (error || !data || data.length === 0) return false;
            this.petInventory[petId] = Number(data[0].remaining);
            return true;
        },
        async changePetStock(petId, delta, fallbackStock) {
            const current = this.getPetStock(petId, fallbackStock);
            const next = current + delta;
            if (next < 0) return false;

            if (!window.supabase) {
                this.petInventory[petId] = next;
                return true;
            }

            const { data, error } = await supabaseClient.from('pet_inventory')
                .update({ remaining: next })
                .eq('pet_id', petId)
                .eq('remaining', current)
                .select();
            if (error || !data || data.length === 0) {
                await this.refreshPetInventory();
                return false;
            }
            this.petInventory[petId] = Number(data[0].remaining);
            return true;
        },

        async init() {
            try {
                // 1. Fetch Users (Deferred to login to save memory/bandwidth)
                this.users = [];

                // 2. Fetch Questions (Deferred to login to save memory/bandwidth for students)
                this.libraryQuestions = [];
                this.quests = [];
                this.userQuests = [];
                this.userPets = [];

                // Protected game data is loaded after successful login. Loading it here
                // would delay the login screen and make unauthenticated RLS requests.
                this.exams = [];
                const localSettings = app.safeStorage.getItem('game_settings');
                if (localSettings) this.settings = JSON.parse(localSettings);
                this.ensureLessonMetadata();

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
                            this.hydrateQuestionLessons(this.libraryQuestions);
                        } else if (payload.eventType === 'UPDATE') {
                            const idx = this.libraryQuestions.findIndex(q => q.id === payload.new.id);
                            if (idx > -1) this.libraryQuestions[idx] = payload.new;
                            this.hydrateQuestionLessons(this.libraryQuestions);
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
                            if (document.getElementById('game-config-view')?.classList.contains('active')) {
                                app.game.renderTopics();
                            }
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
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'pet_inventory' }, async () => {
                        await this.refreshPetInventory();
                    })
                    .subscribe();

            } catch (err) {
                console.error("Critical DB error during init:", err);
                // Fallback to avoid breaking UI completely
                this.users = this.users || [];
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
            this.ensureLessonMetadata();
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
            this.ensureLessonMetadata();
            this.syncQuestionLessonMetadata();
            if (!window.supabase) {
                localStorage.setItem('game_libraryQuestions', JSON.stringify(this.libraryQuestions));
                return;
            }

            const toUpdate = [];
            const toServerQuestion = question => {
                const { lesson, ...serverQuestion } = question;
                return serverQuestion;
            };

            for (const q of this.libraryQuestions) {
                if (q.id) toUpdate.push(toServerQuestion(q));
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
                    const batch = originalBatch.map(q => {
                        const { id, lesson, ...rest } = q;
                        return rest;
                    });

                    const { data, error } = await supabaseClient.from('game_questions').insert(batch).select();
                    if (!error && data && data.length === originalBatch.length) {
                        for (let j = 0; j < data.length; j++) originalBatch[j].id = data[j].id;
                    }
                }
            }
            this.syncQuestionLessonMetadata();
            await this.saveLessonMetadata();
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

    auth: {
        avatarChoices: {
            'boy-short': { label: 'Bé trai phi công khăn đỏ' },
            'boy-side': { label: 'Bé trai tóc lệch đeo kính' },
            'boy-curly': { label: 'Bé trai tóc xoăn khoa học' },
            'boy-bowl': { label: 'Bé trai đội nón vàng' },
            'boy-spiky': { label: 'Bé trai tóc nhọn đeo tai nghe' },
            'girl-long': { label: 'Bé gái tóc dài nơ hồng' },
            'girl-bob': { label: 'Bé gái tóc ngắn đeo kính sao' },
            'girl-twins': { label: 'Bé gái tóc buộc hai bên' },
            'girl-braid': { label: 'Bé gái tóc tết nơ vàng' },
            'girl-doll': { label: 'Bé gái tóc búp bê đội mũ nồi' },
            'boy-reader': { label: 'Bé trai mọt sách đeo kính' },
            'boy-athlete': { label: 'Bé trai thể thao băng đô đỏ' },
            'boy-artist': { label: 'Bé trai họa sĩ áo màu' },
            'boy-explorer': { label: 'Bé trai thám hiểm đội mũ cam' },
            'boy-visor': { label: 'Bé trai công nghệ kính visor' },
            'girl-captain': { label: 'Bé gái đội trưởng mũ captain' },
            'girl-artist': { label: 'Bé gái nghệ sĩ mũ nồi tím' },
            'girl-reader': { label: 'Bé gái đọc sách đeo kính tròn' },
            'girl-athlete': { label: 'Bé gái vận động tóc tết' },
            'girl-inventor': { label: 'Bé gái nhà phát minh tóc bất đối xứng' },
            'teacher-female': { label: 'Giáo viên nữ', image: './public/avatar-teacher-female.png' },
            'cartoon-robot-cat': { label: 'Mèo robot phi hành gia' },
            'cartoon-lightning-squirrel': { label: 'Sóc điện' },
            'cartoon-rescue-pup': { label: 'Cún cứu hộ' },
            'cartoon-dragon': { label: 'Rồng phép thuật' },
            'cartoon-garden-alien': { label: 'Bạn cây xanh' },
            'cartoon-mini-robot': { label: 'Robot mini' },
            'cartoon-cloud-fox': { label: 'Cáo mây pháp sư' },
            'cartoon-otter': { label: 'Rái cá thám hiểm' },
            'cartoon-red-panda': { label: 'Gấu trúc đỏ phát minh' },
            'cartoon-pilot-bird': { label: 'Chim phi công' }
        },
        getAvatar(avatarKey) {
            return { key: this.avatarChoices[avatarKey] ? avatarKey : 'boy-short', ...(this.avatarChoices[avatarKey] || this.avatarChoices['boy-short']) };
        },
        init() {
            document.getElementById('login-btn').onclick = () => this.login();
            document.getElementById('toggle-password').onclick = () => {
                const password = document.getElementById('password');
                const visible = password.type === 'text';
                password.type = visible ? 'password' : 'text';
                const toggle = document.getElementById('toggle-password');
                toggle.setAttribute('aria-pressed', String(!visible));
                toggle.setAttribute('aria-label', visible ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
            };
            document.getElementById('register-btn').onclick = () => this.register();
            document.getElementById('link-to-register').onclick = (event) => { event.preventDefault(); app.router.open('register-screen'); };
            document.getElementById('link-to-login').onclick = (event) => { event.preventDefault(); app.router.open('login-screen'); };
            document.getElementById('link-to-change-password').onclick = () => this.openChangePasswordDialog();
            document.getElementById('change-password-cancel').onclick = () => this.closeChangePasswordDialog();
            document.getElementById('change-password-form').onsubmit = (event) => {
                event.preventDefault();
                this.changePassword();
            };
            document.getElementById('change-password-modal').onclick = (event) => {
                if (event.target.id === 'change-password-modal') this.closeChangePasswordDialog();
            };
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && document.getElementById('change-password-modal').classList.contains('active')) {
                    this.closeChangePasswordDialog();
                }
            });
        },
        setAvatarGroup(group, button) {
            document.querySelectorAll('[data-avatar-group]').forEach(element => { element.hidden = element.dataset.avatarGroup !== group; });
            document.querySelectorAll('.avatar-picker__tabs [role="tab"]').forEach(tab => {
                const active = tab === button;
                tab.classList.toggle('active', active);
                tab.setAttribute('aria-selected', String(active));
            });
        },
        toAuthEmail(usernameOrEmail) {
            const value = String(usernameOrEmail || '').trim().toLowerCase();
            // The teacher may keep the short in-game login name instead of typing the Auth email.
            if (value === 'admin') return 'tuanjw@gmail.com';
            if (value.includes('@')) return value;
            if (!/^[a-z0-9._-]{3,32}$/.test(value)) return '';
            return `${value}@game.local`;
        },
        openChangePasswordDialog() {
            const modal = document.getElementById('change-password-modal');
            const usernameInput = document.getElementById('change-password-username');
            const loginUsername = document.getElementById('username').value.trim();
            if (loginUsername) usernameInput.value = loginUsername;
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            setTimeout(() => (usernameInput.value ? document.getElementById('change-password-old') : usernameInput).focus(), 0);
        },
        closeChangePasswordDialog(force = false) {
            const modal = document.getElementById('change-password-modal');
            if (this.changePasswordPending && !force) return;
            document.getElementById('change-password-form').reset();
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.getElementById('link-to-change-password').focus();
        },
        async changePassword() {
            const username = document.getElementById('change-password-username').value.trim();
            const oldPassword = document.getElementById('change-password-old').value;
            const newPassword = document.getElementById('change-password-new').value;
            const confirmation = document.getElementById('change-password-confirm').value;
            const email = this.toAuthEmail(username);

            if (!email || !oldPassword || !newPassword || !confirmation) {
                return alert('Vui lòng nhập đầy đủ tên đăng nhập và các mật khẩu.');
            }
            if (newPassword.length < 8) return alert('Mật khẩu mới cần có ít nhất 8 ký tự.');
            if (newPassword !== confirmation) return alert('Hai lần nhập mật khẩu mới chưa giống nhau.');
            if (newPassword === oldPassword) return alert('Mật khẩu mới cần khác mật khẩu cũ.');
            if (this.changePasswordPending) return;

            this.changePasswordPending = true;
            app.ui.setButtonLoading('change-password-submit', true, 'Đang cập nhật…');
            try {
                const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password: oldPassword });
                if (signInError || !authData?.user) {
                    return alert('Tên đăng nhập/email hoặc mật khẩu cũ không đúng.');
                }

                const { error: updateError } = await supabaseClient.auth.updateUser({ password: newPassword });
                if (updateError) return alert('Chưa thể đổi mật khẩu. Vui lòng thử lại sau.');

                document.getElementById('username').value = username;
                document.getElementById('password').value = '';
                this.closeChangePasswordDialog(true);
                alert('Đổi mật khẩu thành công. Hãy đăng nhập lại bằng mật khẩu mới.');
            } catch (_) {
                alert('Chưa thể đổi mật khẩu. Vui lòng thử lại sau.');
            } finally {
                await supabaseClient.auth.signOut();
                this.changePasswordPending = false;
                app.ui.setButtonLoading('change-password-submit', false);
            }
        },
        async login() {
            if (app.teamCompetition?.hasActiveLeaderAttempt?.()) {
                const confirmed = await app.teamCompetition.confirmLeaderExit('account_switch');
                if (!confirmed) return;
            }
            const u = document.getElementById('username').value.trim();
            const p = document.getElementById('password').value.trim();
            const email = this.toAuthEmail(u);
            if (!email || !p) return alert('Vui lòng nhập tên đăng nhập/email và mật khẩu.');
            if (this.loginPending) return;

            this.loginPending = true;
            app.ui.setButtonLoading('login-btn', true, 'Đang đăng nhập…');
            try {

            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({ email, password: p });
            if (authError || !authData?.user) return alert('Sai tên đăng nhập hoặc mật khẩu!');

            const { data: user, error: profileError } = await supabaseClient.from('game_users')
                .select('*').eq('auth_user_id', authData.user.id).single();
            if (profileError || !user) {
                await supabaseClient.auth.signOut();
                return alert('Tài khoản chưa được Giáo viên cấp quyền sử dụng game.');
            }

            if (user) {
                if (user.role?.toLowerCase() !== 'admin' && user.approved === false) {
                    alert('Tài khoản của bạn đang chờ phê duyệt từ Giáo viên!');
                    return;
                }
                app.data.currentUser = user;

                // These reads are protected by RLS, so they must happen after Supabase Auth succeeds.
                const [exams, settingsData] = await Promise.all([
                    app.data.fetchAllFromSupabase('game_exams'),
                    app.data.fetchAllFromSupabase('game_settings'),
                    app.data.refreshPetInventory()
                ]);
                app.data.exams = exams;
                if (settingsData?.[0]) app.data.settings = settingsData[0].data || settingsData[0];
                app.data.ensureLessonMetadata();

                // Lazy load based on role
                if (user.role?.toLowerCase() === 'admin') {
                    const [users, questions, templates, quests] = await Promise.all([
                        app.data.fetchAllFromSupabase('game_users'),
                        app.data.fetchAllFromSupabase('game_questions'),
                        app.data.fetchAllFromSupabase('question_templates'),
                        app.data.fetchAllFromSupabase('game_quests')
                    ]);
                    app.data.users = users;
                    app.data.users.forEach(usr => { if (!Array.isArray(usr.history)) usr.history = []; });
                    app.data.libraryQuestions = questions;
                    app.data.hydrateQuestionLessons(app.data.libraryQuestions);
                    app.data.questionTemplates = templates;
                    app.data.quests = quests;
                    app.data.hydrateQuestCurriculum(app.data.quests);
                    document.getElementById('admin-station').style.display = 'flex';
                    if (document.getElementById('quest-station')) document.getElementById('quest-station').style.display = 'none';
                } else {
                    const clLvl = String(user.classlevel || '5').replace('Lớp ', '').trim();
                    const [questions, templates, , quests, userQuests, userPets] = await Promise.all([
                        app.data.fetchAllFromSupabase('game_questions', 'classlevel', clLvl),
                        app.data.fetchAllFromSupabase('question_templates'),
                        app.data.loadSeenQuestions(user.username),
                        app.data.fetchAllFromSupabase('game_quests'),
                        app.data.fetchAllFromSupabase('user_quests', 'user_username', user.username),
                        app.data.fetchAllFromSupabase('user_pets', 'user_username', user.username)
                    ]);
                    app.data.libraryQuestions = questions;
                    app.data.hydrateQuestionLessons(app.data.libraryQuestions);
                    app.data.questionTemplates = templates;
                    app.data.quests = quests;
                    app.data.hydrateQuestCurriculum(app.data.quests);
                    app.data.userQuests = userQuests;
                    app.data.userPets = userPets;
                    document.getElementById('admin-station').style.display = 'none';
                    if (document.getElementById('quest-station')) document.getElementById('quest-station').style.display = 'flex';
                }

                // Team competitions are persisted separately from personal
                // quests. Load the server snapshot only after Auth succeeds so
                // RLS can scope the result to the teacher/leader account.
                if (app.teamCompetition?.syncRemote) {
                    await app.teamCompetition.syncRemote();
                }

                await app.data.updateUserScore();
                this.updateHeader();

                app.router.open('map-screen');
                app.daily.onMapEnter();

                // Hiển thị mũi tên hướng dẫn nếu là lần đầu login
                setTimeout(() => {
                    if (app.data.currentUser && app.data.currentUser.role !== 'admin') {
                        const hasSeenGuide = app.safeStorage.getItem('guide_seen_' + app.data.currentUser.username);
                        const guideArrow = document.getElementById('guide-arrow');
                        if (!hasSeenGuide && guideArrow) {
                            guideArrow.style.display = 'block';
                        }
                    }
                }, 500);
            } else {
                alert('Sai tên đăng nhập hoặc mật khẩu!');
            }
            } finally {
                this.loginPending = false;
                app.ui.setButtonLoading('login-btn', false);
            }
        },
        async register() {
            const fn = document.getElementById('reg-fullname').value.trim();
            const un = document.getElementById('reg-username').value.trim();
            const pw = document.getElementById('reg-password').value.trim();
            const cl = document.getElementById('reg-class').value;
            const className = document.getElementById('reg-class-name')?.value.trim() || '';
            const gender = document.getElementById('reg-gender')?.value || null;
            const selectedAvatar = document.querySelector('input[name="reg-avatar"]:checked')?.value || 'boy-short';

            if (!fn || !un || !pw || !cl) {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }

            const email = this.toAuthEmail(un);
            if (!email) return alert('Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang (3–32 ký tự).');
            if (this.registerPending) return;
            this.registerPending = true;
            app.ui.setButtonLoading('register-btn', true, 'Vui lòng chờ…');
            try {
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email, password: pw, options: { data: { username: un } }
            });
            if (authError || !authData?.user) {
                return alert('Không thể đăng ký. Tên đăng nhập có thể đã tồn tại.');
            }

            const newUser = {
                fullname: fn,
                username: un,
                password: null,
                auth_user_id: authData.user.id,
                classlevel: cl,
                class_name: className || null,
                gender,
                role: 'student',
                avatar_key: Object.prototype.hasOwnProperty.call(this.avatarChoices, selectedAvatar) ? selectedAvatar : 'boy-short',
                approved: false,
                history: [],
                totalscore: 0,
                stars: 0
            };

            const { data, error } = await supabaseClient.from('game_users').insert([newUser]).select();
            if (error) {
                await supabaseClient.auth.signOut();
                alert('Có lỗi xảy ra khi kết nối máy chủ!');
                console.error(error);
                return;
            }

            if (data && data[0]) {
                newUser.id = data[0].id;
            }

            app.data.users.push(newUser);
            await supabaseClient.auth.signOut();
            alert('Đăng ký thành công! Hãy chờ Giáo viên phê duyệt.');
            app.router.open('login-screen');
            } finally {
                this.registerPending = false;
                app.ui.setButtonLoading('register-btn', false);
            }
        },
        async logout() {
            if (app.teamCompetition?.hasActiveLeaderAttempt?.()) {
                const confirmed = await app.teamCompetition.confirmLeaderExit('logout');
                if (!confirmed) return;
                if (app.router) app.router.open('map-screen');
            }
            await supabaseClient.auth.signOut();
            app.data.currentUser = null;
            app.admin?.syncRoleAwareLabels();
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            app.router.open('login-screen');
        },
        async manageStudentAccount(payload) {
            const { data, error } = await supabaseClient.functions.invoke('admin-users', { body: payload });
            let errorCode = data?.error;
            if (error && !errorCode) {
                try { errorCode = (await error.context?.json())?.error; } catch (_) { /* Use the safe fallback below. */ }
            }
            if (error || errorCode) throw new Error(errorCode || 'admin_function_failed');
            return data;
        },
        updateHeader() {
            if (!app.data.currentUser) return;
            const user = app.data.currentUser;
            const avatar = this.getAvatar(user.avatar_key);
            const isAdmin = user.role?.toLowerCase() === 'admin';
            app.admin?.syncRoleAwareLabels();
            const starCount = Number(user.stars || 0).toLocaleString('vi-VN');
            const titleLine = isAdmin
                ? ''
                : `<span class="player-info-card__stats"><i aria-hidden="true">🏅</i> Danh hiệu: <b>${app.auth.getPlayerTitle(user)}</b></span>`;
            const progress = app.auth.getPlayerProgress(user);
            const progressLine = isAdmin
                ? ''
                : `<div class="player-progress-bar" title="${progress.nextTitle ? 'Tiến tới: ' + progress.nextTitle : 'Đã đạt cấp cao nhất'}" aria-label="Tiến độ ${Math.round(progress.percent)}%"><div class="player-progress-fill" style="width:${progress.percent}%"></div></div>`;
            const avatarMarkup = avatar.image
                ? `<img class="player-info-card__avatar player-info-card__avatar--teacher" src="${avatar.image}" alt="Avatar ${app.data.sanitizeHTML(avatar.label)}">`
                : `<span class="player-info-card__avatar avatar-art avatar-art--${avatar.key}" role="img" aria-label="Avatar ${app.data.sanitizeHTML(avatar.label)}"></span>`;
            const html = `
                ${avatarMarkup}
                <span class="player-info-card__content">
                  <strong>${app.data.sanitizeHTML(user.fullname)}</strong>
                  <small>${isAdmin ? 'Admin' : `Học sinh · Lớp ${app.data.sanitizeHTML(user.classlevel)}${user.class_name ? ` · ${app.data.sanitizeHTML(user.class_name)}` : ''}`}</small>
                  ${titleLine}
                  ${progressLine}
                  <span class="player-info-card__stats"><i aria-hidden="true">⭐</i> <b>${starCount}</b> Sao</span>
                </span>`;
            $id('player-info').innerHTML = html;

            const adminNotif = $id('admin-notification');
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
        },
        getPlayerStars(user) {
            // Tổng Sao tích lũy suốt đời; fallback sang số Sao hiện có cho tài khoản cũ.
            return Math.max(Number(user?.total_stars_earned || 0), Number(user?.stars || 0));
        },
        getPlayerTitle(user) {
            const earned = this.getPlayerStars(user);
            const match = PLAYER_TITLES.find(t => earned >= t.stars);
            return (match || PLAYER_TITLES[PLAYER_TITLES.length - 1]).name;
        },
        getPlayerProgress(user) {
            const earned = this.getPlayerStars(user);
            const idx = PLAYER_TITLES.findIndex(t => earned >= t.stars);
            const current = PLAYER_TITLES[Math.max(0, idx)] || PLAYER_TITLES[PLAYER_TITLES.length - 1];
            const next = idx > 0 ? PLAYER_TITLES[idx - 1] : null;
            let percent = 100;
            if (next) {
                percent = Math.min(100, Math.max(0, ((earned - current.stars) / (next.stars - current.stars)) * 100));
            }
            return { currentTitle: current.name, percent, nextTitle: next ? next.name : null };
        }
    },

    game: {
        questionsPerRound: 10,
        templateGeneratorsByTopic: {
            '2. Góc và đơn vị đo góc': new Set([
                'g4-m-angle-count-in-polygon', 'angle.count_in_polygon',
                'g4-m-angle-drag-classify', 'angle.drag_classify',
                'g4-m-angle-clock-classify', 'angle.clock_classify',
                'g4-m-angle-count-eight-angles', 'angle.count_eight_angles'
            ])
        },
        state: { subject: '', topicMode: 'single', adminTopicMode: 'test', selectedTopics: [], difficulty: 'easy', questions: [], currentIdx: 0, score: 0, selectedAns: null, historyDetails: [] },
        isTemplateAllowedForTopic(generatorKey, topic) {
            const allowedGenerators = this.templateGeneratorsByTopic[topic];
            return !generatorKey || !allowedGenerators || allowedGenerators.has(generatorKey);
        },
        
        skills: {
            state: {
                skillUsed: false,
                shieldActive: false
            },
            getCooldown(username, skillId) {
                return parseInt(localStorage.getItem('cooldown_' + username + '_' + skillId) || '0', 10);
            },
            setCooldown(username, skillId, value) {
                localStorage.setItem('cooldown_' + username + '_' + skillId, value);
            },
            decreaseCooldowns(username) {
                ['freeze_time', 'fifty_fifty', 'show_hint', 'show_answer', 'shield', 'swap_question'].forEach(skillId => {
                    let cd = this.getCooldown(username, skillId);
                    if (cd > 0) this.setCooldown(username, skillId, cd - 1);
                });
            },
            renderSkillBar(petId, petImage) {
                const container = document.getElementById('skill-bar-container');
                if (!container) return;
                const user = app.data.currentUser;
                if (!user) return;
                
                let shopInfo = app.shop.shopData.find(x => x.id === petId);
                if (!shopInfo || !shopInfo.skills) {
                    container.innerHTML = '';
                    container.style.display = 'none';
                    return;
                }
                
                let html = '';
                shopInfo.skills.forEach(skill => {
                    let cd = this.getCooldown(user.username, skill.id);
                    let disabled = cd > 0 || this.state.skillUsed;
                    if (disabled) return;
                    
                    let text = skill.name;
                    html += `<button class="btn-action" style="background: linear-gradient(90deg, #8b5cf6, #3b82f6); border:none; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4); width:100%; max-width: 200px; display:flex; justify-content:flex-start; align-items:center; gap: 15px; padding: 12px; margin-bottom: 5px; border-radius: 12px;" 
                        onclick="app.game.skills.useSkill('${skill.id}')">
                        <img src="./public/${petImage}" style="width: 32px; height: 32px; border-radius: 50%; box-shadow: 0 0 5px rgba(255,255,255,0.5);"> 
                        <span style="color: white; font-weight: bold; font-size: 1rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${text}</span>
                    </button>`;
                });
                container.innerHTML = html;
                container.style.display = html.trim() ? 'flex' : 'none';
            },
            useSkill(skillId) {
                if (this.state.skillUsed) return;
                const user = app.data.currentUser;
                if (!user) return;
                if (app.game.state.examName || document.getElementById('exam-play-screen')?.classList.contains('active')) {
                    return alert('Không thể dùng kỹ năng thú cưng khi làm Đề kiểm tra.');
                }
                
                this.state.skillUsed = true;
                this.setCooldown(user.username, skillId, 3);
                
                // Cập nhật lại UI
                let currentlyEquipped = localStorage.getItem('equipped_pet_' + user.username);
                if (currentlyEquipped) {
                    let petId = app.shop.shopData.find(x => x.image === currentlyEquipped)?.id;
                    this.renderSkillBar(petId, currentlyEquipped);
                }

                // Kích hoạt Hiệu ứng
                if (skillId === 'freeze_time') {
                    if (app.game.hardTimer) {
                        clearInterval(app.game.hardTimer);
                        app.game.hardTimer = null;
                        let timerDisplay = document.getElementById('hard-timer-display');
                        if(timerDisplay) {
                            timerDisplay.style.color = '#3b82f6';
                            timerDisplay.style.textShadow = '0 0 10px #3b82f6';
                        }
                        app.playSound('success'); 
                    } else {
                        alert('Kỹ năng bạn chọn không có tác dụng gì trong trường hợp này.');
                    }
                } else if (skillId === 'fifty_fifty') {
                    const q = app.game.state.questions[app.game.state.currentIdx];
                    const wrongOpts = (q.options || []).filter(o => o !== q.ans);
                    if (wrongOpts.length > 0 && document.querySelectorAll('.option-btn').length > 0) {
                        wrongOpts.sort(() => Math.random() - 0.5);
                        let toRemove = wrongOpts.slice(0, Math.ceil(wrongOpts.length / 2));
                        
                        document.querySelectorAll('.option-btn').forEach(btn => {
                            let text = btn.textContent.trim().replace(/^[A-D]\.\s*/, '');
                            if (toRemove.includes(text)) {
                                btn.style.visibility = 'hidden';
                            }
                        });
                        app.playSound('success');
                    } else {
                        alert('Kỹ năng bạn chọn không có tác dụng gì trong trường hợp này.');
                    }
                } else if (skillId === 'show_hint') {
                    const q = app.game.state.questions[app.game.state.currentIdx];
                    const explBox = document.getElementById('explanation-box');
                    if (q.explanation || q.hint) {
                        explBox.style.display = 'block';
                        explBox.innerHTML = `🌟 <b style="color:#fbbf24;">Tầm Nhìn Đa Chiều:</b><br>${q.explanation || q.hint}`;
                        app.playSound('success');
                    } else {
                        alert('Kỹ năng bạn chọn không có tác dụng gì trong trường hợp này.');
                    }
                } else if (skillId === 'show_answer') {
                    const q = app.game.state.questions[app.game.state.currentIdx];
                    if (q.options && document.querySelectorAll('.option-btn').length > 0) {
                        document.querySelectorAll('.option-btn').forEach(btn => {
                            let text = btn.textContent.trim().replace(/^[A-D]\.\s*/, '');
                            if (text === q.ans) {
                                btn.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
                                btn.style.color = 'black';
                                btn.style.boxShadow = '0 0 20px #4ade80';
                                btn.style.transform = 'scale(1.02)';
                            }
                        });
                    } else if (q.type === 'Điền khuyết' && document.querySelectorAll('.fill-blank-input').length > 0) {
                         document.querySelectorAll('.fill-blank-input').forEach((input, i) => {
                             input.value = q.ans.split('|')[i] || q.ans;
                         });
                         app.game.selectAnswer(); // Enable Check button
                        app.playSound('success');
                    } else {
                        alert('Kỹ năng bạn chọn không có tác dụng gì trong trường hợp này.');
                    }
                } else if (skillId === 'shield') {
                    this.state.shieldActive = true;
                    app.playSound('success');
                } else if (skillId === 'swap_question') {
                    const mappedSubject = app.game.state.subject === 'math' ? 'Toán' : 'Tiếng Việt';
                    const clLevel = String(app.data.currentUser?.classlevel || '').replace('Lớp ', '').trim();
                    const currentQuestion = app.game.state.questions[app.game.state.currentIdx];
                    const allQs = app.data.libraryQuestions.filter(question =>
                        app.data.normalizeQuestionPart(question.subject) === app.data.normalizeQuestionPart(mappedSubject) &&
                        app.data.normalizeQuestionPart(String(question.classlevel || '').replace(/^Lớp\s*/i, '')) === app.data.normalizeQuestionPart(clLevel) &&
                        app.data.normalizeQuestionPart(question.semester) === app.data.normalizeQuestionPart(currentQuestion.semester) &&
                        app.data.normalizeQuestionPart(question.topic) === app.data.normalizeQuestionPart(currentQuestion.topic)
                    );
                    let pool = allQs.filter(x => !app.game.state.questions.some(q => q.q === x.q));
                    if (pool.length > 0) {
                        let newQ = pool[Math.floor(Math.random() * pool.length)];
                        app.game.state.questions[app.game.state.currentIdx] = newQ;
                        app.game.loadQuestion();
                        app.playSound('success');
                        
                        // Tắt skill vì đã xài
                        this.state.skillUsed = true; 
                    } else {
                        alert('Kỹ năng bạn chọn không có tác dụng gì trong trường hợp này.');
                    }
                }
            }
        },

        init() {
            document.querySelectorAll('.station[data-subject]').forEach(el => {
                el.onclick = () => {
                    app.router.animateCatTo(el, () => {
                        if (el.dataset.subject === 'exam') {
                            const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
                            if (isAdmin) {
                                app.admin.openComposer('exams');
                                return;
                            }
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
            this.state.adminTopicMode = 'test';
            this.state.examName = null;
            this.state.examId = null;
            this.state.questId = null;

            document.getElementById('game-config-title').textContent = subject === 'math' ? 'VUI HỌC TOÁN' : 'VUI HỌC TIẾNG VIỆT';

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
            this.syncTopicControls();
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

            this.state.difficulty = 'easy';
        },
        isAdmin() {
            return app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
        },
        isTopicLocked(classlevel, subject, topic) {
            const locks = app.data.settings?.topicLocks;
            return Boolean(locks?.[String(classlevel)]?.[subject]?.[topic]);
        },
        getOrderedTopics(classlevel, subject) {
            const topicGroups = app.constants.topics?.[String(classlevel)]?.[subject] || {};
            return [...(topicGroups.hk1 || []), ...(topicGroups.hk2 || [])];
        },
        hasPerfectTopicRound(topic, subject, classlevel) {
            const user = app.data.currentUser;
            const subjectTitle = subject === 'math' ? 'Toán' : 'Tiếng Việt';
            return (Array.isArray(user?.history) ? user.history : []).some(round => (
                round?.topic === topic
                && Number(round.score) === 10
                && Number(round.questionCount) === this.questionsPerRound
                && (round.subject ? round.subject === subject : round.title === subjectTitle)
                && (!round.classlevel || String(round.classlevel).replace(/^Lớp\s*/i, '') === String(classlevel))
            ));
        },
        isStudentProgressionLocked(classlevel, subject, topic) {
            if (this.isAdmin()) return false;
            const overrides = app.data.settings?.topicUnlockOverrides;
            if (overrides?.[String(classlevel)]?.[subject]?.[topic]) return false;
            const orderedTopics = this.getOrderedTopics(classlevel, subject);
            const topicIndex = orderedTopics.indexOf(topic);
            if (topicIndex <= 0) return false;

            return orderedTopics.slice(0, topicIndex).some(previousTopic => (
                !this.hasPerfectTopicRound(previousTopic, subject, classlevel)
            ));
        },
        getNewlyUnlockedTopic(classlevel, subject, completedTopic) {
            if (this.isAdmin() || this.state.examName || this.state.selectedTopics.length !== 1) return null;
            const orderedTopics = this.getOrderedTopics(classlevel, subject);
            const completedIndex = orderedTopics.indexOf(completedTopic);
            const nextTopic = orderedTopics[completedIndex + 1];
            if (!nextTopic || this.isTopicLocked(classlevel, subject, nextTopic)) return null;
            return nextTopic;
        },
        syncTopicControls() {
            const isAdmin = this.isAdmin();
            const isManaging = isAdmin && this.state.adminTopicMode === 'manage';
            const modeControls = document.getElementById('admin-topic-mode-controls');
            const topicMode = document.querySelector('.topic-mode-toggle');
            const difficulty = document.querySelector('.config-difficulty-options');
            const lockActions = document.getElementById('topic-lock-actions');
            const startButton = document.getElementById('game-start-btn');

            if (modeControls) {
                modeControls.style.display = isAdmin ? 'flex' : 'none';
                modeControls.querySelectorAll('.btn-opt').forEach(button => {
                    button.classList.toggle('active', button.dataset.topicAdminMode === (isManaging ? 'manage' : 'test'));
                });
            }
            if (topicMode) topicMode.style.display = isManaging ? 'none' : '';
            if (difficulty) difficulty.style.display = isManaging ? 'none' : '';
            if (lockActions) lockActions.style.display = isManaging ? 'inline-flex' : 'none';
            if (startButton) startButton.style.display = isManaging ? 'none' : '';
        },
        setAdminTopicMode(mode) {
            if (!this.isAdmin()) return;
            this.state.adminTopicMode = mode === 'manage' ? 'manage' : 'test';
            this.state.selectedTopics = [];
            this.syncTopicControls();
            this.renderTopics();
        },
        async setSelectedTopicsLock(locked) {
            if (!this.isAdmin() || this.state.adminTopicMode !== 'manage') return;
            if (this.state.selectedTopics.length === 0) {
                alert('Vui lòng chọn ít nhất một chủ đề để cập nhật.');
                return;
            }

            const classlevel = String(this.state.adminclasslevel || '5').replace('Lớp ', '').trim();
            const subject = this.state.subject;
            const previousLocks = app.data.settings?.topicLocks || {};
            const topicLocks = JSON.parse(JSON.stringify(previousLocks));
            const previousOverrides = app.data.settings?.topicUnlockOverrides || {};
            const topicUnlockOverrides = JSON.parse(JSON.stringify(previousOverrides));
            topicLocks[classlevel] ||= {};
            topicLocks[classlevel][subject] ||= {};
            topicUnlockOverrides[classlevel] ||= {};
            topicUnlockOverrides[classlevel][subject] ||= {};
            this.state.selectedTopics.forEach(topic => {
                if (locked) {
                    topicLocks[classlevel][subject][topic] = true;
                    delete topicUnlockOverrides[classlevel][subject][topic];
                } else {
                    delete topicLocks[classlevel][subject][topic];
                    topicUnlockOverrides[classlevel][subject][topic] = true;
                }
            });

            app.data.settings = { ...app.data.settings, topicLocks, topicUnlockOverrides };
            const error = await app.data.saveSettings();
            if (error) {
                app.data.settings = { ...app.data.settings, topicLocks: previousLocks, topicUnlockOverrides: previousOverrides };
                this.renderTopics();
                return;
            }

            const updatedCount = this.state.selectedTopics.length;
            this.state.selectedTopics = [];
            this.renderTopics();
            alert(`${locked ? 'Đã khóa' : 'Đã mở'} ${updatedCount} chủ đề cho học sinh.`);
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
            const isAdmin = this.isAdmin();
            const isManaging = isAdmin && this.state.adminTopicMode === 'manage';
            let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
            clLevel = String(clLevel).replace('Lớp ', '').trim();

            const topicDict = app.constants.topics[clLevel] || { math: { hk1: [], hk2: [] }, vietnamese: { hk1: [], hk2: [] } };
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
                    const isTeacherLocked = this.isTopicLocked(clLevel, this.state.subject, t);
                    const isProgressionLocked = this.isStudentProgressionLocked(clLevel, this.state.subject, t);
                    const isLocked = isTeacherLocked || isProgressionLocked;
                    const showLockedStatus = isLocked && (isManaging || !isAdmin);
                    lbl.className = `topic-card${showLockedStatus ? ' topic-card--locked' : ''}`;
                    const inp = document.createElement('input');
                    inp.type = isManaging || this.state.topicMode === 'multi' ? 'checkbox' : 'radio';
                    inp.name = 'topic-selection';
                    inp.value = t;
                    inp.disabled = !isAdmin && isLocked;
                    if (inp.disabled) lbl.setAttribute('aria-disabled', 'true');
                    inp.onchange = (e) => {
                        if (!isManaging && this.state.topicMode === 'single') {
                            this.state.selectedTopics = [t];
                        } else {
                            if (e.target.checked) this.state.selectedTopics.push(t);
                            else this.state.selectedTopics = this.state.selectedTopics.filter(x => x !== t);
                        }
                    };
                    lbl.appendChild(inp);
                    lbl.appendChild(document.createTextNode(' ' + t));
                    if (showLockedStatus) {
                        const lockStatus = document.createElement('span');
                        lockStatus.className = 'topic-lock-status';
                        lockStatus.textContent = isTeacherLocked ? 'Đã khóa' : 'Chưa mở';
                        lbl.appendChild(lockStatus);
                    }
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
        startPlay() {
            if (this.state.selectedTopics.length === 0) {
                alert('Vui lòng chọn ít nhất 1 chủ đề!');
                return;
            }

            const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';

            // C2: Giới hạn 5 lượt chơi/ngày bằng năng lượng (chỉ áp dụng học sinh, không áp dụng admin).
            if (!isAdmin && app.daily.getEnergy(app.data.currentUser) <= 0) {
                alert('Bạn đã dùng hết 5 lượt chơi hôm nay. Hãy quay lại vào ngày mai nhé!');
                app.router.open('map-screen');
                return;
            }

            let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
            clLevel = String(clLevel).replace('Lớp ', '').trim();

            if (!isAdmin && this.state.selectedTopics.some(topic => (
                this.isTopicLocked(clLevel, this.state.subject, topic)
                || this.isStudentProgressionLocked(clLevel, this.state.subject, topic)
            ))) {
                this.state.selectedTopics = [];
                this.renderTopics();
                alert('Chủ đề này chưa được mở. Hãy đạt 10 điểm ở chủ đề trước để tiếp tục.');
                return;
            }

            const mappedSubject = this.state.subject === 'math' ? 'Toán' : 'Tiếng Việt';

            let pool = app.data.libraryQuestions.filter(q => {
                const same = (left, right) => app.data.normalizeQuestionPart(left) === app.data.normalizeQuestionPart(right);
                const matchSubject = same(q.subject, mappedSubject);
                const matchClass = same(String(q.classlevel || '').replace(/^Lớp\s*/i, ''), clLevel);
                const selectedTopic = this.state.selectedTopics.find(topic => same(q.topic, topic));
                const matchTopic = Boolean(selectedTopic);
                const selectedSemester = selectedTopic && (() => {
                    const topicData = app.constants.topics[clLevel]?.[this.state.subject] || {};
                    const semesterTopics = Object.entries(topicData).find(([, topics]) => topics.includes(selectedTopic));
                    return semesterTopics && same(q.semester, semesterTopics[0] === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2');
                })();

                return matchSubject && matchClass && matchTopic && selectedSemester
                    && this.isTemplateAllowedForTopic(q.templateId || q.generator_key, selectedTopic)
                    && !app.data.validateQuestionScoring(q);
            });

            const dynamicTemplates = (app.data.questionTemplates || []).filter(template => {
                if (template.is_active === false) return false;
                const same = (left, right) => app.data.normalizeQuestionPart(left) === app.data.normalizeQuestionPart(right);
                const matchSubject = same(template.subject, mappedSubject);
                const matchClass = same(String(template.classlevel || '').replace(/^Lớp\s*/i, ''), clLevel);
                const selectedTopic = this.state.selectedTopics.find(topic => same(template.topic, topic));
                const matchTopic = Boolean(selectedTopic);
                const topicData = app.constants.topics[clLevel]?.[this.state.subject] || {};
                const semesterTopics = selectedTopic && Object.entries(topicData).find(([, topics]) => topics.includes(selectedTopic));
                const matchSemester = semesterTopics && same(template.semester, semesterTopics[0] === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2');
                return matchSubject && matchClass && matchTopic && matchSemester
                    && this.isTemplateAllowedForTopic(template.generator_key, selectedTopic);
            });

            if (pool.length === 0 && dynamicTemplates.length === 0) {
                alert('Không có câu hỏi phù hợp! Vui lòng nhập thêm dữ liệu vào thư viện.');
                return;
            }

            // Ưu tiên câu chưa gặp; khi đã gặp hết thì quay vòng mà không báo hết câu hỏi.
            let unseenPool = [];
            let seenPool = [];
            pool.forEach(q => {
                const qKey = app.data.getQuestionKey(q);
                if (app.data.seenQuestionKeys.has(qKey)) {
                    seenPool.push(q);
                } else {
                    unseenPool.push(q);
                }
            });

            const targetCount = this.questionsPerRound;

            // 3. Hàm bốc câu hỏi đa dạng loại (Round-robin)
            const pickDiverse = (sourcePool, countNeeded) => {
                if (countNeeded <= 0) return [];
                const byType = {};
                sourcePool.forEach(q => {
                    const t = (q.type || 'Trắc nghiệm').trim().normalize('NFC');
                    if (!byType[t]) byType[t] = [];
                    byType[t].push(q);
                });
                Object.values(byType).forEach(arr => arr.sort(() => 0.5 - Math.random()));

                let picked = [];
                const types = Object.keys(byType).sort(() => 0.5 - Math.random());
                let typeIdx = 0;
                while (picked.length < countNeeded && types.length > 0) {
                    const currentType = types[typeIdx];
                    if (byType[currentType].length > 0) {
                        picked.push(byType[currentType].pop());
                        typeIdx = (typeIdx + 1) % types.length;
                    } else {
                        types.splice(typeIdx, 1);
                        if (types.length > 0) typeIdx = typeIdx % types.length;
                    }
                }
                return picked;
            };

            const usedQuestionContentKeys = new Set();
            const uniqueQuestions = questions => questions.filter(question => {
                const contentKey = app.data.getQuestionContentKey(question);
                if (usedQuestionContentKeys.has(contentKey)) return false;
                usedQuestionContentKeys.add(contentKey);
                return true;
            });
            const staticTarget = dynamicTemplates.length ? Math.min(pool.length, Math.floor(targetCount / 2)) : targetCount;
            let selected = uniqueQuestions(pickDiverse(unseenPool, staticTarget));
            if (selected.length < staticTarget) {
                let needed = staticTarget - selected.length;
                let extra = uniqueQuestions(pickDiverse(seenPool, needed));
                selected = selected.concat(extra);
            }

            const staticQuestions = selected;
            const templateQuestions = [];
            const shuffledTemplates = [...dynamicTemplates].sort(() => Math.random() - 0.5);
            let attempts = 0;
            while (templateQuestions.length < targetCount - staticQuestions.length && shuffledTemplates.length && attempts < targetCount * 4) {
                const template = shuffledTemplates[attempts % shuffledTemplates.length];
                const generated = app.data.generateTemplateQuestion(template);
                if (generated && !app.data.validateQuestionScoring(generated)) {
                    const contentKey = app.data.getQuestionContentKey(generated);
                    if (!usedQuestionContentKeys.has(contentKey)) {
                        usedQuestionContentKeys.add(contentKey);
                        templateQuestions.push(generated);
                    }
                }
                attempts++;
            }

            // Đưa template lên đầu lượt để học sinh thấy ngay câu hỏi động đang được áp dụng,
            // thay vì luôn phải làm hết nhóm câu hỏi kho trước đó.
            selected = [...templateQuestions, ...staticQuestions];

            if (selected.length < targetCount) {
                selected = selected.concat(uniqueQuestions(pickDiverse([...unseenPool, ...seenPool], targetCount - selected.length)));
            }

            if (selected.length < targetCount) {
                this.state.questions = [];
                alert('Chủ đề này chưa đủ câu hỏi khác nhau để tạo 10 câu. Hãy thêm câu hỏi hoặc template có biến thể.');
                return;
            }

            pool = selected;

            app.data.markQuestionsSeen(pool);

            this.state.questions = pool;
            this.state.currentIdx = 0;
            this.state.score = 0;
            this.state.historyDetails = [];
            this.state.historyDetails = [];

            // Ẩn nút Trở về
            const btnBack = document.getElementById('game-btn-back');
            if (btnBack) btnBack.style.display = 'none';

            // Reset skill state
            if (this.skills) {
                this.skills.state.skillUsed = false;
                this.skills.state.shieldActive = false;
                
                // Render skill bar
                const user = app.data.currentUser;
                if (user) {
                    let eq = localStorage.getItem('equipped_pet_' + user.username);
                    if (eq) {
                        let petId = app.shop.shopData.find(x => x.image === eq)?.id;
                        this.skills.renderSkillBar(petId, eq);
                    } else {
                        const container = document.getElementById('skill-bar-container');
                        if (container) container.style.display = 'none';
                    }
                }
            }

            if (!isAdmin) app.daily.spendEnergy(app.data.currentUser);
            app.router.openGameView('game-play-view');
            this.loadQuestion();
        },
        confirmExit() {
            if (confirm('Bạn chưa hoàn thành, thoát giữa chừng sẽ không được ghi nhận điểm!')) {
                app.router.open('map-screen');
            }
        },
        getAnsArr(ansString) {
            if (!ansString) return [];
            if (ansString.includes(',')) return ansString.split(',').map(s => s.trim());
            if (ansString.includes('|')) return ansString.split('|').map(s => s.trim());
            return [ansString.trim()];
        },
        calculateQuestionScore(q, selected) {
            const expected = Array.isArray(q?.statements)
                ? q.statements.map(statement => String(statement.answer || '').trim())
                : this.getAnsArr(String(q?.ans || ''));
            const selectedAnswers = Array.isArray(selected) ? selected : this.getAnsArr(String(selected || ''));
            const answerCount = expected.length;
            const questionType = String(q?.type || '').normalize('NFC');
            const isMatching = questionType.includes('Đối chiếu');
            const isFill = questionType.includes('Điền');
            const normalize = value => isMatching
                ? String(value || '').trim().normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN')
                : (isFill ? this.normalizeFillAnswer(value) : String(value || '').trim());
            const expectedAnswers = expected.map(normalize);
            const chosenAnswers = selectedAnswers.map(normalize);
            const partAnswerCounts = Array.isArray(q?.partAnswerCounts) ? q.partAnswerCounts.map(Number) : [];
            const hasGroupedParts = partAnswerCounts.length === 4
                && partAnswerCounts.every(count => Number.isInteger(count) && count > 0)
                && partAnswerCounts.reduce((total, count) => total + count, 0) === expectedAnswers.length;
            if (hasGroupedParts) {
                let offset = 0;
                const correctCount = partAnswerCounts.reduce((total, count) => {
                    const isPartCorrect = expectedAnswers.slice(offset, offset + count)
                        .every((answer, index) => chosenAnswers[offset + index] === answer);
                    offset += count;
                    return total + (isPartCorrect ? 1 : 0);
                }, 0);
                return { answerCount: partAnswerCounts.length, correctCount, points: correctCount / partAnswerCounts.length, isCorrect: correctCount === partAnswerCounts.length };
            }
            const correctCount = isMatching
                ? Math.min(answerCount, new Set(chosenAnswers.filter(answer => expectedAnswers.includes(answer))).size)
                : expectedAnswers.reduce((total, answer, index) => total + (chosenAnswers[index] === answer ? 1 : 0), 0);
            const isSupported = [1, 2, 4].includes(answerCount);
            const points = isSupported ? correctCount / answerCount : 0;
            return { answerCount, correctCount, points, isCorrect: isSupported && correctCount === answerCount };
        },
        createHistoryDetail(q, selected, isCorrect, extra = {}) {
            const detail = { q: q.q, selected, correct: q.ans, isCorrect, type: q.type, ...extra };
            if (q.type === 'Đúng/Sai' && Array.isArray(q.statements)) {
                detail.statements = q.statements.map(({ label, text }) => ({ label, text }));
            }
            if (q.type === 'Trắc nghiệm' && Array.isArray(q.subquestions)) {
                detail.subquestions = q.subquestions.map(({ label, prompt, options }) => ({ label, prompt, options }));
            }
            return detail;
        },
        formatHistoryQuestion(detail) {
            const lines = [detail.q];
            if (detail.type === 'Đúng/Sai' && Array.isArray(detail.statements)) {
                lines.push(...detail.statements.map(statement => `${statement.label}. ${statement.text}`));
            }
            if (detail.type === 'Trắc nghiệm' && Array.isArray(detail.subquestions)) {
                lines.push(...detail.subquestions.map(item => `${item.label}) ${item.prompt}<br>${(item.options || []).map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join(' · ')}`));
            }
            return app.data.formatQuestionDetailHTML(lines.join('<br>'));
        },
        normalizeFillAnswer(value) {
            const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
            const compactNumber = normalized.replace(/\s/g, '');
            return /^\d+$/.test(compactNumber) ? compactNumber : normalized.toLocaleLowerCase('vi-VN');
        },
        loadQuestion() {
            if (this.skills) this.skills.state.shieldActive = false;
            
            const q = this.state.questions[this.state.currentIdx];
            document.getElementById('current-q-index').textContent = this.state.currentIdx + 1;
            document.getElementById('total-q-count').textContent = this.state.questions.length;
            document.getElementById('game-score').textContent = this.state.score;

            document.getElementById('cat-speech-bubble').style.display = 'none';
            document.getElementById('explanation-box').style.display = 'none';

            const user = app.data.currentUser;
            let equipped = app.getEquippedPet(user);
            document.getElementById('play-cat-img').src = './public/' + equipped;

            let qHtml = app.data.formatMathHTML(q.q);
            const questionContainer = document.getElementById('game-question-container');
            const playCenter = document.querySelector('#game-play-view .play-center');
            playCenter?.classList.remove('play-center--four-part-mc', 'play-center--four-expressions', 'play-center--four-comparisons', 'play-center--angle-drag', 'play-center--angle-count');
            questionContainer.classList.remove('question-box--template', 'question-box--fill', 'question-box--comparison', 'question-box--safe-password', 'question-box--four-operations-expressions', 'question-box--four-part-fill', 'question-box--angle-drag', 'question-box--angle-count');
            if (q.templateId === 'number.safe_password_by_place_value') {
                questionContainer.classList.add('question-box--template', 'question-box--safe-password');
                questionContainer.innerHTML = `<div class="safe-password-copy">${qHtml}</div>`;
            } else {
                if (q.imageUrl) qHtml += `<br><img src="${q.imageUrl}" style="max-height:200px; margin-top:10px;">`;
                questionContainer.innerHTML = qHtml;
            }

            const optContainer = document.getElementById('game-options-container');
            optContainer.innerHTML = '';
            this.state.selectedAns = null;
            this.state.multipleChoiceSelections = null;

            const btnCheck = document.getElementById('submit-ans-btn');
            btnCheck.disabled = true;
            document.getElementById('submit-ans-text').textContent = 'Kiểm Tra';
            document.getElementById('submit-ans-img').src = './public/ui/buttons/group1/check.png';
            btnCheck.setAttribute('aria-label', 'Kiểm tra');
            btnCheck.onclick = () => this.submitAnswer();

            let rawType = (q.type || 'Trắc nghiệm').trim().normalize('NFC');
            let qType = 'Điền khuyết';
            if (rawType.includes('Trắc nghiệm')) qType = 'Trắc nghiệm';
            else if (rawType.includes('Đúng/Sai')) qType = 'Đúng/Sai';
            else if (rawType.includes('So sánh')) qType = 'So sánh';
            else if (rawType.includes('Chuỗi')) qType = 'Chuỗi quy luật';
            else if (rawType.includes('Kéo thả')) qType = 'Kéo thả';
            else if (rawType.includes('Đối chiếu')) qType = 'Đối chiếu trùng khớp';
            else qType = 'Điền khuyết';
            if (Array.isArray(q.comparisonRows)) qType = 'Kéo thả';

            let opts = q.options || [];

            if (opts.length === 0) {
                if (qType === 'Đúng/Sai') opts = ['Đúng', 'Sai'];
                else if (qType === 'So sánh') opts = ['>', '<', '='];
                else if (qType === 'Kéo thả' && Array.isArray(q.comparisonRows)) opts = ['>', '<', '='];
                else if (qType === 'Trắc nghiệm') opts = [q.ans];
                else qType = 'Điền khuyết';
            }

            if (qType === 'Trắc nghiệm' && Array.isArray(q.subquestions)) {
                optContainer.className = 'multi-choice-subquestions';
                if (q.subquestions.length === 4) playCenter?.classList.add('play-center--four-part-mc');
                const labels = ['A', 'B', 'C', 'D'];
                this.state.multipleChoiceSelections = new Array(q.subquestions.length).fill('');
                q.subquestions.forEach((subquestion, index) => {
                    const row = document.createElement('section');
                    const isSafePassword = q.templateId === 'number.safe_password_by_place_value';
                    row.dataset.index = index;
                    const illustration = isSafePassword && subquestion.imageUrl
                        ? `<img class="safe-password-illustration" src="${app.data.sanitizeHTML(subquestion.imageUrl)}" data-open-src="${app.data.sanitizeHTML(subquestion.openedImageUrl || './src/assets/safe-password-open-v1.png')}" alt="Két sắt cho câu ${index + 1}">`
                        : '';
                    const partLabel = app.data.sanitizeHTML(String(subquestion.label || String.fromCharCode(97 + index)));
                    const partPrompt = String(subquestion.prompt || '').trim();
                    row.className = `multi-choice-subquestion multi-choice-subquestion--tone-${index % 4}${isSafePassword ? ' multi-choice-subquestion--safe-password' : ''}${partPrompt ? '' : ' multi-choice-subquestion--label-only'}`;
                    const heading = partPrompt
                        ? `<h3><span>${partLabel})</span> ${app.data.formatMathHTML(partPrompt)}</h3>`
                        : `<span class="multi-choice-subquestion__label-only">${partLabel})</span>`;
                    row.innerHTML = `<div class="multi-choice-subquestion__heading">${illustration}${heading}</div><div class="multi-choice-subquestion__options"></div>`;
                    const choices = row.querySelector('.multi-choice-subquestion__options');
                    (subquestion.options || []).forEach((option, optionIndex) => {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'multi-choice-subquestion__option';
                        button.innerHTML = `<span class="ans-badge">${labels[optionIndex] || ''}</span><span class="ans-text">${app.data.formatMathText(option)}</span>`;
                        button.onclick = () => {
                            choices.querySelectorAll('button').forEach(item => item.classList.remove('selected'));
                            button.classList.add('selected');
                            this.state.multipleChoiceSelections[index] = option;
                            this.state.selectedAns = this.state.multipleChoiceSelections.join(', ');
                            btnCheck.disabled = this.state.multipleChoiceSelections.some(answer => !answer);
                        };
                        choices.appendChild(button);
                    });
                    optContainer.appendChild(row);
                });
            } else if (qType === 'Trắc nghiệm') {
                optContainer.className = 'options-grid multiple_choice';
                const labels = ['A', 'B', 'C', 'D'];
                opts.forEach((opt, idx) => {
                    const btn = document.createElement('div');
                    btn.className = 'ans-btn';
                    btn.innerHTML = `<span class="ans-badge">${labels[idx] || ''}</span><span class="ans-text">${app.data.formatMathText(opt)}</span>`;
                    btn.onclick = () => {
                        optContainer.querySelectorAll('.ans-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        this.state.selectedAns = opt;
                        btnCheck.disabled = false;
                    };
                    optContainer.appendChild(btn);
                });
            } else if (qType === 'Đúng/Sai' && Array.isArray(q.statements)) {
                questionContainer.classList.add('question-box--template', 'question-box--true-false');
                questionContainer.innerHTML = '<div class="tf-template-number">Chọn Đúng/Sai?</div>';
                optContainer.className = 'tf-statements';
                this.state.trueFalseSelections = new Array(q.statements.length).fill('');
                q.statements.forEach((statement, index) => {
                    const row = document.createElement('div');
                    row.className = 'tf-statement';
                    row.innerHTML = `<span class="tf-statement__label">${statement.label}.</span><span class="tf-statement__text">${app.data.formatMathText(statement.text)}</span><span class="tf-statement__choices"><button type="button" data-choice="Đúng">ĐÚNG</button><button type="button" data-choice="Sai">SAI</button></span>`;
                    row.querySelectorAll('button').forEach(button => {
                        button.onclick = () => {
                            row.querySelectorAll('button').forEach(item => item.classList.remove('selected'));
                            button.classList.add('selected');
                            this.state.trueFalseSelections[index] = button.dataset.choice;
                            this.state.selectedAns = this.state.trueFalseSelections.join(', ');
                            btnCheck.disabled = this.state.trueFalseSelections.some(choice => !choice);
                        };
                    });
                    optContainer.appendChild(row);
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
                let slot;
                if (q.q.includes('___')) {
                    let [instruction, expression = ''] = app.data.formatMathHTML(q.q).split(/<br\s*\/?\s*>/i);
                    if (!expression) {
                        const instructionMatch = instruction.match(/^(.+?:)\s*(.+___.+)$/);
                        if (instructionMatch) [, instruction, expression] = instructionMatch;
                    }
                    const [left, right = ''] = (expression || instruction).split('___');
                    questionContainer.classList.add('question-box--template', 'question-box--comparison');
                    questionContainer.innerHTML = `<div class="template-question-copy">${expression ? instruction : ''}</div><div class="comparison-expression"><span class="comparison-expression__side">${left}</span><span class="compare-slot">?</span><span class="comparison-expression__side">${right}</span></div>`;
                    slot = questionContainer.querySelector('.compare-slot');
                } else {
                    const slotWrapper = document.createElement('div');
                    slotWrapper.style.display = 'flex';
                    slotWrapper.style.justifyContent = 'center';
                    slot = document.createElement('div');
                    slot.className = 'compare-slot';
                    slot.textContent = '?';
                    slotWrapper.appendChild(slot);
                    optContainer.appendChild(slotWrapper);
                }

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
            } else if (qType === 'Kéo thả' && Array.isArray(q.comparisonRows)) {
                optContainer.className = '';
                playCenter?.classList.add('play-center--four-comparisons');
                questionContainer.classList.add('question-box--template', 'question-box--four-comparisons');
                questionContainer.innerHTML = `<div class="template-question-copy">Điền dấu thích hợp:</div><div class="comparison-drag-controls" aria-label="Dấu so sánh">${['>', '<', '='].map(sign => `<button type="button" class="comparison-drag-sign" draggable="true" data-sign="${sign}" aria-label="Dấu ${sign}">${sign}</button>`).join('')}</div><div class="comparison-drag-rows">${q.comparisonRows.map((row, index) => `<div class="comparison-drag-row comparison-drag-row--tone-${index % 4}"><span class="comparison-drag-label">${row.label}.</span><span class="comparison-drag-side">${app.data.formatMathText(row.leftText)}</span><button type="button" class="comparison-drag-slot drag-slot" data-index="${index}" aria-label="Ô điền dấu câu ${row.label}">?</button><span class="comparison-drag-side">${app.data.formatMathText(row.rightText)}</span></div>`).join('')}</div>`;
                const answers = new Array(q.comparisonRows.length).fill('');
                let selectedSign = '';
                const signButtons = [...questionContainer.querySelectorAll('.comparison-drag-sign')];
                const slots = [...questionContainer.querySelectorAll('.comparison-drag-slot')];
                const chooseSign = sign => {
                    selectedSign = sign;
                    signButtons.forEach(button => button.classList.toggle('selected', button.dataset.sign === sign));
                };
                const fillSlot = (slot, sign) => {
                    if (!sign) return;
                    const index = Number(slot.dataset.index);
                    slot.textContent = sign;
                    slot.dataset.choice = sign;
                    slot.classList.add('filled');
                    answers[index] = sign;
                    this.state.selectedAns = answers.join(', ');
                    btnCheck.disabled = answers.some(answer => !answer);
                };
                signButtons.forEach(button => {
                    button.onclick = () => chooseSign(button.dataset.sign);
                    button.ondragstart = event => event.dataTransfer.setData('text/plain', button.dataset.sign);
                });
                slots.forEach(slot => {
                    slot.onclick = () => {
                        if (selectedSign) fillSlot(slot, selectedSign);
                        else if (slot.classList.contains('filled')) {
                            answers[Number(slot.dataset.index)] = '';
                            slot.textContent = '?';
                            slot.classList.remove('filled');
                            delete slot.dataset.choice;
                            this.state.selectedAns = answers.join(', ');
                            btnCheck.disabled = true;
                        }
                    };
                    slot.ondragover = event => { event.preventDefault(); slot.classList.add('drag-over'); };
                    slot.ondragleave = () => slot.classList.remove('drag-over');
                    slot.ondrop = event => {
                        event.preventDefault();
                        slot.classList.remove('drag-over');
                        fillSlot(slot, event.dataTransfer.getData('text/plain'));
                    };
                });
            } else if (qType === 'Kéo thả') {
                optContainer.className = '';
                let html = '';
                let numSlots = 0;

                if (Array.isArray(q.angleItems)) {
                    playCenter?.classList.add('play-center--angle-drag');
                    questionContainer.classList.add('question-box--template', 'question-box--angle-drag');
                    const instruction = app.data.formatMathText(q.instruction || 'Kéo thả tên loại góc thích hợp vào ô trống.');
                    html += `<div class="template-question-copy">${instruction}</div><div class="angle-drag-rows">`;
                    q.angleItems.forEach((item, index) => {
                        html += `<div class="angle-drag-row angle-drag-row--tone-${index % 4}"><b>${app.data.sanitizeHTML(item.label)}.</b><span class="angle-drag-figure">${item.svg}</span><div class="drag-slot" id="slot-${numSlots}" data-index="${numSlots}" aria-label="Ô thả đáp án câu ${app.data.sanitizeHTML(item.label)}"></div></div>`;
                        numSlots++;
                    });
                    html += '</div>';
                } else if (q.q && (q.q.includes('___') || q.q.includes('...'))) {
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
                    html += app.data.formatMathHTML(q.q || '') + '<br><br>';
                    const ansArr = this.getAnsArr(q.ans);
                    html += `<div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">`;
                    for (let i = 0; i < ansArr.length; i++) {
                        html += `<div class="drag-slot" id="slot-${numSlots}" data-index="${numSlots}"></div>`;
                        numSlots++;
                    }
                    html += `</div>`;
                }

                if (q.imageUrl) html += `<br><img src="${q.imageUrl}" style="max-height:200px; margin-top:10px;">`;
                document.getElementById('game-question-container').innerHTML = html;

                const inventory = document.createElement('div');
                inventory.className = Array.isArray(q.angleItems) ? 'drag-inventory drag-inventory--angle' : 'drag-inventory';
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

                if (q.templateId === 'number.natural_sequence' && Array.isArray(q.sequenceRounds)) {
                    let slotIndex = 0;
                    html = '<div class="template-sequence-title">Điền số thích hợp vào mỗi dãy:</div>';
                    q.sequenceRounds.forEach(round => {
                        html += `<div class="train-container ${randomShape}"><b>${round.label})</b>`;
                        const displayTerms = String(round.display || '').split(',').map(term => term.trim()).filter(Boolean);
                        if (displayTerms.length) {
                            displayTerms.forEach((term, index) => {
                                const isBlank = term.replace(/\s/g, '') === '___';
                                html += isBlank ? `<div class="train-node train-slot seq-slot" data-index="${slotIndex++}">?</div>` : `<div class="train-node">${app.data.formatMathText(term)}</div>`;
                                if (index < displayTerms.length - 1) html += '<div class="train-arrow">➔</div>';
                            });
                        } else {
                            const sequence = Array.isArray(round.sequence) ? round.sequence : [];
                            const blankIndexes = Array.isArray(round.blankIndexes) ? round.blankIndexes : [];
                            sequence.forEach((value, index) => {
                                html += blankIndexes.includes(index) ? `<div class="train-node train-slot seq-slot" data-index="${slotIndex++}">?</div>` : `<div class="train-node">${app.data.formatMathNumber(value)}</div>`;
                                if (index < sequence.length - 1) html += '<div class="train-arrow">➔</div>';
                            });
                        }
                        html += '</div>';
                    });
                } else if (q.templateId === 'number.natural_sequence') {
                    let slotIndex = 0;
                    q.q.split(',').map(item => item.trim()).filter(Boolean).forEach((term, index, terms) => {
                        html += term === '___' ? `<div class="train-node train-slot seq-slot" data-index="${slotIndex++}">?</div>` : `<div class="train-node">${app.data.sanitizeHTML(term)}</div>`;
                        if (index < terms.length - 1) html += `<div class="train-arrow">➔</div>`;
                    });
                } else {
                    for (let i = 0; i < parts.length; i++) {
                        const text = parts[i].trim();
                        if (text) html += `<div class="train-node">${text}</div>`;
                        if (i < parts.length - 1) {
                            if (text) html += `<div class="train-arrow">➔</div>`;
                            html += `<div class="train-node train-slot seq-slot" data-index="${i}">?</div>`;
                            if (i < parts.length - 2) html += `<div class="train-arrow">➔</div>`;
                        }
                    }
                }
                html += '</div>';
                document.getElementById('game-question-container').innerHTML = q.q.includes('___') || q.q.includes('...') ? html : (app.data.formatMathHTML(q.q) + html);

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
                const buttons = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'Xóa', '0'];
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
                        } else if (currentVal.length < 7) {
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
            } else if (qType === 'Điền khuyết' && q.templateId === 'number.four_operations_expressions' && Array.isArray(q.practiceRows)) {
                optContainer.className = '';
                playCenter?.classList.add('play-center--four-expressions');
                const inputs = [];
                const instruction = String(q.q || '').split(/<br\s*\/?\s*>/i)[0] || 'Tính giá trị của biểu thức:';
                const renderExpression = (row, index) => {
                    const [beforeBlank = '', afterBlank = ''] = String(row.expression || '').split('___');
                    const tone = ['sky', 'rose', 'mint', 'lavender'][index];
                    return `<div class="four-operations-expression-row"><div class="four-operations-expression-row__label">${app.data.sanitizeHTML(row.label)}.</div><div class="four-operations-expression-row__content"><div class="four-operations-practice__expression four-operations-practice__expression--${tone}">${app.data.formatMathText(beforeBlank)}<input type="text" inputmode="numeric" class="magic-input" id="fill-input-${index}" autocomplete="off">${app.data.formatMathText(afterBlank)}</div></div></div>`;
                };
                questionContainer.classList.add('question-box--template', 'question-box--fill', 'question-box--four-operations-expressions');
                questionContainer.innerHTML = `<div class="four-operations-expression-title">${app.data.formatMathText(instruction)}</div><div class="four-operations-expression-list">${q.practiceRows.map(renderExpression).join('')}</div>`;
                q.practiceRows.forEach((_, index) => {
                    const input = document.getElementById(`fill-input-${index}`);
                    inputs.push(input);
                    input.oninput = () => {
                        input.value = app.data.formatMathNumber(input.value);
                        const allFilled = inputs.every(item => item.value.trim() !== '');
                        this.state.selectedAns = inputs.map(item => item.value.trim()).join(', ');
                        btnCheck.disabled = !allFilled;
                    };
                });
            } else if (qType === 'Điền khuyết' && Array.isArray(q.angleCountRows) && q.angleCountRows.length === 4) {
                optContainer.className = '';
                playCenter?.classList.add('play-center--angle-count');
                questionContainer.classList.add('question-box--template', 'question-box--fill', 'question-box--angle-count');
                const inputs = [];
                const instruction = app.data.formatMathText(q.instruction || 'Quan sát hình vẽ và điền số lượng từng loại góc.');
                const rows = q.angleCountRows.map((row, index) => {
                    const label = app.data.sanitizeHTML(row.label || String.fromCharCode(97 + index));
                    const text = app.data.sanitizeHTML(row.text || 'góc');
                    return `<label class="angle-count-row angle-count-row--tone-${index % 4}"><span class="angle-count-row__label">${label}.</span><span class="angle-count-row__text">${text}</span><input type="text" inputmode="numeric" class="magic-input" id="fill-input-${index}" autocomplete="off" aria-label="Số ${text}"></label>`;
                }).join('');
                questionContainer.innerHTML = `<div class="angle-count-title">${instruction}</div><div class="angle-count-visual">${q.angleVisual || ''}</div><div class="angle-count-rows">${rows}</div>`;
                q.angleCountRows.forEach((_, index) => {
                    const input = document.getElementById(`fill-input-${index}`);
                    inputs.push(input);
                    input.oninput = () => {
                        input.value = input.value.replace(/\D/g, '').slice(0, 2);
                        this.state.selectedAns = inputs.map(item => item.value.trim()).join(', ');
                        btnCheck.disabled = !inputs.every(item => item.value.trim() !== '');
                    };
                });
            } else if (qType === 'Điền khuyết' && q.templateId === 'measurement.word_problem_units' && Array.isArray(q.practiceRows) && q.practiceRows.length === 4) {
                optContainer.className = '';
                questionContainer.classList.add('question-box--template', 'question-box--fill', 'question-box--four-part-fill', 'question-box--measurement-word-problems');
                const inputs = [];
                const title = String(q.q || '').split(/<br\s*\/?\s*>/i)[0] || 'Điền đáp số thích hợp.';
                const rows = q.practiceRows.map((row, index) => {
                    const [before = '', after = ''] = String(row.display || '').split('___');
                    const label = String.fromCharCode(97 + index);
                    const lead = String(row.lead || before).trim();
                    const answerPrefix = String(row.answerPrefix || '').trim();
                    const answerSuffix = String(row.answerSuffix || after).trim();
                    return `<label class="measurement-word-problem-row measurement-word-problem-row--tone-${index}"><span class="measurement-word-problem-row__label">${label})</span><span class="measurement-word-problem-row__lead">${app.data.formatMathText(lead)}</span><span class="measurement-word-problem-answer"><span>${app.data.formatMathText(answerPrefix)}</span><input type="text" inputmode="numeric" class="magic-input" id="fill-input-${index}" autocomplete="off" aria-label="Đáp số câu ${label}"><span>${app.data.formatMathText(answerSuffix)}</span></span></label>`;
                }).join('');
                questionContainer.innerHTML = `<div class="measurement-word-problems-title">${app.data.formatMathText(title)}</div><div class="measurement-word-problems-list">${rows}</div>`;
                q.practiceRows.forEach((_, index) => {
                    const input = document.getElementById(`fill-input-${index}`);
                    inputs.push(input);
                    input.oninput = () => {
                        input.value = app.data.formatMathNumber(input.value);
                        this.state.selectedAns = inputs.map(item => item.value.trim()).join(', ');
                        btnCheck.disabled = !inputs.every(item => item.value.trim() !== '');
                    };
                });
            } else if (qType === 'Điền khuyết') {
                optContainer.className = '';
                const parts = (q.q || '').split(/\.\.\.|___/);
                let inputs = [];

                if (parts.length > 1) {
                    const isComposeFromPlaces = q.templateId === 'number.compose_from_places';
                    if (isComposeFromPlaces) {
                        const rows = String(q.q || '').split(/<br\s*\/?\s*>/i).filter(Boolean);
                        const [heading = '', ...subquestions] = rows;
                        let inputIndex = 0;
                        const renderSubquestion = row => {
                            const input = `<input type="text" inputmode="numeric" class="magic-input" id="fill-input-${inputIndex++}" autocomplete="off">`;
                            const formattedRow = app.data.formatMathText(row);
                            const withAnswer = formattedRow.replace(/(Số đó là)\s*___/i, `<span class="template-compose-answer">$1 ${input}</span>`);
                            return `<div class="template-compose-row template-compose-row--tone-${inputIndex - 1}">${withAnswer === formattedRow ? formattedRow.replace(/___/, input) : withAnswer}</div>`;
                        };
                        const html = `<div class="template-compose-layout"><div class="template-compose-heading">${app.data.formatMathText(heading)}</div>${subquestions.map(renderSubquestion).join('')}</div>`;
                        questionContainer.classList.add('question-box--template', 'question-box--fill', 'question-box--compose', 'question-box--four-part-fill');
                        questionContainer.innerHTML = html;
                    } else {
                        const toRows = text => String(text).replace(/<br\s*\/?\s*>/gi, '</div><div class="template-fill-row">');
                        let html = '<div class="template-fill-layout"><div class="template-fill-row">';
                        for (let i = 0; i < parts.length; i++) {
                            html += toRows(parts[i]);
                            if (i < parts.length - 1) {
                                html += `<input type="text" inputmode="numeric" class="magic-input" id="fill-input-${i}" autocomplete="off">`;
                            }
                        }
                        html += '</div></div>';
                        if (q.imageUrl) html += `<br><img src="${q.imageUrl}" style="max-height:200px; margin-top:10px;">`;
                        const hasFourSubquestions = parts.length === 5;
                        questionContainer.classList.add('question-box--template', 'question-box--fill');
                        if (hasFourSubquestions) questionContainer.classList.add('question-box--four-part-fill');
                        questionContainer.innerHTML = html;
                        if (hasFourSubquestions) {
                            questionContainer.querySelectorAll('.template-fill-row').forEach((row, index) => {
                                if (index > 0) row.classList.add(`template-fill-row--tone-${index - 1}`);
                            });
                        }
                    }

                    for (let i = 0; i < parts.length - 1; i++) {
                        const input = document.getElementById(`fill-input-${i}`);
                        inputs.push(input);
                        input.oninput = () => {
                            if (q.templateId?.startsWith('number.')) input.value = app.data.formatMathNumber(input.value);
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
                    optContainer.appendChild(inp);
                }
            } else if (qType === 'Đối chiếu trùng khớp') {
                optContainer.className = 'matching-container';
                optContainer.innerHTML = '';
                
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.id = "matching-lines";
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.style.pointerEvents = 'none';
                svg.style.zIndex = '0';
                optContainer.appendChild(svg);
                optContainer.style.position = 'relative';

                let leftItems = [];
                let rightItems = [];
                
                if (q.options && q.options.length >= 2) {
                    leftItems = q.options[0].split(',').map(s => s.trim()).filter(s => s);
                    rightItems = q.options[1].split(',').map(s => s.trim()).filter(s => s);
                } else if (q.q && q.q.includes('|')) {
                    let parts = q.q.split('|');
                    leftItems = parts[0].split(',').map(s => s.trim());
                    rightItems = parts[1].split(',').map(s => s.trim());
                }

                // Randomize right items slightly
                rightItems.sort(() => Math.random() - 0.5);

                const colsWrapper = document.createElement('div');
                colsWrapper.className = 'matching-columns';

                const leftCol = document.createElement('div');
                leftCol.className = 'matching-col left-col';
                const rightCol = document.createElement('div');
                rightCol.className = 'matching-col right-col';

                this.state.matchingPairs = [];
                let selectedLeft = null;
                let selectedRight = null;

                // blue, yellow, cyan, pink, brown, orange
                const neonColors = ['#3b82f6', '#eab308', '#06b6d4', '#ec4899', '#a16207', '#f97316'];

                const drawLine = (leftEl, rightEl, color) => {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    const svgRect = svg.getBoundingClientRect();
                    const leftRect = leftEl.getBoundingClientRect();
                    const rightRect = rightEl.getBoundingClientRect();

                    const x1 = leftRect.right - svgRect.left;
                    const y1 = leftRect.top + leftRect.height / 2 - svgRect.top;
                    const x2 = rightRect.left - svgRect.left;
                    const y2 = rightRect.top + rightRect.height / 2 - svgRect.top;

                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', color);
                    line.setAttribute('stroke-width', '4');
                    line.style.filter = `drop-shadow(0 0 5px ${color})`;
                    
                    return line;
                };

                const updateLines = () => {
                    svg.innerHTML = ''; 
                    this.state.matchingPairs.forEach(pair => {
                        const line = drawLine(pair.leftEl, pair.rightEl, pair.color);
                        pair.line = line;
                        svg.appendChild(line);
                    });
                };
                
                window.addEventListener('resize', updateLines);
                
                const handleSelection = () => {
                    if (selectedLeft && selectedRight) {
                        this.state.matchingPairs = this.state.matchingPairs.filter(p => {
                            if (p.leftEl === selectedLeft || p.rightEl === selectedRight) {
                                p.leftEl.style.boxShadow = 'none';
                                p.leftEl.style.borderColor = 'rgba(255,255,255,0.2)';
                                p.rightEl.style.boxShadow = 'none';
                                p.rightEl.style.borderColor = 'rgba(255,255,255,0.2)';
                                return false;
                            }
                            return true;
                        });

                        const usedColors = this.state.matchingPairs.map(p => p.color);
                        const available = neonColors.filter(c => !usedColors.includes(c));
                        const color = available.length > 0 ? available[0] : neonColors[Math.floor(Math.random() * neonColors.length)];

                        selectedLeft.style.boxShadow = `0 0 15px ${color}`;
                        selectedLeft.style.borderColor = color;
                        selectedRight.style.boxShadow = `0 0 15px ${color}`;
                        selectedRight.style.borderColor = color;

                        this.state.matchingPairs.push({
                            leftEl: selectedLeft,
                            rightEl: selectedRight,
                            leftText: selectedLeft.dataset.text,
                            rightText: selectedRight.dataset.text,
                            color: color
                        });

                        selectedLeft.classList.remove('matching-selected');
                        selectedRight.classList.remove('matching-selected');
                        selectedLeft = null;
                        selectedRight = null;

                        updateLines();

                        const ansStr = this.state.matchingPairs.map(p => `${p.leftText}:${p.rightText}`).join(', ');
                        this.state.selectedAns = ansStr;
                        btnCheck.disabled = this.state.matchingPairs.length === 0;
                    }
                };

                leftItems.forEach(text => {
                    const item = document.createElement('div');
                    item.className = 'matching-item left-item';
                    item.textContent = text;
                    item.dataset.text = text;
                    item.onclick = () => {
                        if (selectedLeft === item) {
                            item.classList.remove('matching-selected');
                            selectedLeft = null;
                        } else {
                            if (selectedLeft) selectedLeft.classList.remove('matching-selected');
                            item.classList.add('matching-selected');
                            selectedLeft = item;
                        }
                        handleSelection();
                    };
                    leftCol.appendChild(item);
                });

                rightItems.forEach(text => {
                    const item = document.createElement('div');
                    item.className = 'matching-item right-item';
                    item.textContent = text;
                    item.dataset.text = text;
                    item.onclick = () => {
                        if (selectedRight === item) {
                            item.classList.remove('matching-selected');
                            selectedRight = null;
                        } else {
                            if (selectedRight) selectedRight.classList.remove('matching-selected');
                            item.classList.add('matching-selected');
                            selectedRight = item;
                        }
                        handleSelection();
                    };
                    rightCol.appendChild(item);
                });

                colsWrapper.appendChild(leftCol);
                colsWrapper.appendChild(rightCol);
                optContainer.appendChild(colsWrapper);

                setTimeout(updateLines, 50);
            }


            const timerDisplay = document.getElementById('hard-timer-display');
            if (this.state.difficulty === 'hard') {
                timerDisplay.style.display = 'inline';
                let timeLeft = app.data.settings.hardTimeLimit || 10;
                timerDisplay.textContent = `(00:${timeLeft.toString().padStart(2, '0')})`;

                if (this.hardTimer) clearInterval(this.hardTimer);
                // D6: dùng deadline theo Date.now() để đồng hồ không lệch khi tab bị ẩn/throttle.
                const hardDeadline = Date.now() + timeLeft * 1000;
                this.hardTimer = setInterval(() => {
                    const remaining = Math.max(0, Math.ceil((hardDeadline - Date.now()) / 1000));
                    timerDisplay.textContent = `(00:${remaining.toString().padStart(2, '0')})`;

                    if (remaining <= 3 && remaining > 0) {
                        app.playSound('tick');
                    }

                    if (remaining <= 0) {
                        clearInterval(this.hardTimer);
                        this.submitAnswer(true);
                    }
                }, 250);
            } else {
                timerDisplay.style.display = 'none';
                if (this.hardTimer) clearInterval(this.hardTimer);
            }
        },
        submitAnswer(isTimeout = false) {
            if (this.hardTimer) clearInterval(this.hardTimer);
            const q = this.state.questions[this.state.currentIdx];
            let isCorrect = false;
            let scoreResult = null;
            let rawType = (q.type || 'Trắc nghiệm').trim().normalize('NFC');
            let qType = 'Điền khuyết';
            if (rawType.includes('Trắc nghiệm')) qType = 'Trắc nghiệm';
            else if (rawType.includes('Đúng/Sai')) qType = 'Đúng/Sai';
            else if (rawType.includes('So sánh')) qType = 'So sánh';
            else if (rawType.includes('Chuỗi')) qType = 'Chuỗi quy luật';
            else if (rawType.includes('Kéo thả')) qType = 'Kéo thả';
            else if (rawType.includes('Đối chiếu')) qType = 'Đối chiếu trùng khớp';
            else qType = 'Điền khuyết';
            if (Array.isArray(q.comparisonRows)) qType = 'Kéo thả';

            let opts = q.options || [];

            if (opts.length === 0) {
                if (qType !== 'Đúng/Sai' && qType !== 'So sánh' && qType !== 'Trắc nghiệm' && qType !== 'Kéo thả') {
                    qType = 'Điền khuyết';
                }
            }

            if (qType === 'Điền khuyết') {
                const ansArr = this.getAnsArr(q.ans);
                const selectedArr = this.getAnsArr(this.state.selectedAns);
                isCorrect = selectedArr.length === ansArr.length && selectedArr.every((val, i) => this.normalizeFillAnswer(val) === this.normalizeFillAnswer(ansArr[i]));
                const parts = (q.q || '').split(/\.\.\.|___/);
                if (parts.length > 1) {
                    for (let i = 0; i < parts.length - 1; i++) {
                        const inp = document.getElementById(`fill-input-${i}`);
                        if (inp) {
                            if (this.normalizeFillAnswer(inp.value) === this.normalizeFillAnswer(ansArr[i])) {
                                inp.classList.add('correct');
                            } else {
                                inp.classList.add('wrong');
                            }
                        }
                    }
                } else {
                    const inp = document.querySelector('.fill-input');
                    if (inp) {
                        if (isCorrect) inp.classList.add('correct');
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
                    corr.innerHTML = `✅ Đáp án đúng: <b>${app.data.formatMathText(q.ans)}</b>`;
                    optContainer.appendChild(corr);
                }
            } else if (qType === 'Trắc nghiệm' && Array.isArray(q.subquestions)) {
                const expectedAnswers = q.subquestions.map(subquestion => String(subquestion.answer || '').trim());
                const selectedAnswers = this.state.multipleChoiceSelections || this.getAnsArr(this.state.selectedAns);
                isCorrect = selectedAnswers.length === expectedAnswers.length && selectedAnswers.every((answer, index) => answer === expectedAnswers[index]);
                document.querySelectorAll('.multi-choice-subquestion').forEach((row, index) => {
                    const correctAnswer = expectedAnswers[index];
                    row.querySelectorAll('.multi-choice-subquestion__option').forEach(button => {
                        const answer = button.querySelector('.ans-text').textContent;
                        if (answer === correctAnswer) button.classList.add('correct');
                        else if (button.classList.contains('selected')) button.classList.add('wrong');
                    });
                });
            } else if (qType === 'Trắc nghiệm') {
                isCorrect = this.state.selectedAns === q.ans;
                const optContainer = document.getElementById('game-options-container');
                optContainer.querySelectorAll('.ans-btn').forEach(btn => {
                    const text = btn.querySelector('.ans-text').textContent;
                    if (text === app.data.formatMathText(q.ans)) {
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
            } else if (qType === 'Đúng/Sai' && Array.isArray(q.statements)) {
                const expectedAnswers = q.statements.map(statement => statement.answer);
                const selectedAnswers = this.state.trueFalseSelections || this.getAnsArr(this.state.selectedAns);
                isCorrect = selectedAnswers.length === expectedAnswers.length && selectedAnswers.every((answer, index) => answer === expectedAnswers[index]);
                document.querySelectorAll('.tf-statement').forEach((row, index) => {
                    const correctAnswer = expectedAnswers[index];
                    row.querySelectorAll('button').forEach(button => {
                        if (button.dataset.choice === correctAnswer) button.classList.add('correct-fill');
                        else if (button.classList.contains('selected')) button.classList.add('wrong-fill');
                    });
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
                isCorrect = selectedArr.length === ansArr.length && selectedArr.every((val, i) => val === ansArr[i]);
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
            } else if (qType === 'Đối chiếu trùng khớp') {
                const pairs = this.state.matchingPairs || [];
                const correctPairsStr = q.ans.split(',').map(s => s.trim());
                
                let numCorrect = 0;
                let numTotal = correctPairsStr.length;

                pairs.forEach(p => {
                    const str = `${p.leftText}:${p.rightText}`;
                    if (correctPairsStr.includes(str)) {
                        p.line.setAttribute('stroke', '#4ade80');
                        p.line.style.filter = `drop-shadow(0 0 5px #4ade80)`;
                        numCorrect++;
                    } else {
                        p.line.setAttribute('stroke', '#f87171');
                        p.line.style.filter = `drop-shadow(0 0 5px #f87171)`;
                    }
                });

                isCorrect = (numCorrect === numTotal && pairs.length === numTotal);
                
                if (!isCorrect) {
                    setTimeout(() => {
                        const svg = document.getElementById('matching-lines');
                        if (svg) {
                            // Không xóa svg để giữ lại các đường sai
                            
                            // Vẽ dấu X (gạch chéo) ở giữa các đường sai
                            pairs.forEach(p => {
                                const str = `${p.leftText}:${p.rightText}`;
                                if (!correctPairsStr.includes(str)) {
                                    const x1 = parseFloat(p.line.getAttribute('x1'));
                                    const y1 = parseFloat(p.line.getAttribute('y1'));
                                    const x2 = parseFloat(p.line.getAttribute('x2'));
                                    const y2 = parseFloat(p.line.getAttribute('y2'));
                                    // Gạch chéo ở 1/3 hoặc 2/3 line để tránh bị chồng nhau ở giữa khi có nhiều line cắt nhau
                                    const fraction = (pairs.indexOf(p) % 2 === 0) ? 0.3 : 0.7;
                                    const mx = x1 + (x2 - x1) * fraction;
                                    const my = y1 + (y2 - y1) * fraction;
                                    
                                    const cross1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                                    cross1.setAttribute('x1', mx - 10);
                                    cross1.setAttribute('y1', my - 10);
                                    cross1.setAttribute('x2', mx + 10);
                                    cross1.setAttribute('y2', my + 10);
                                    cross1.setAttribute('stroke', '#f87171');
                                    cross1.setAttribute('stroke-width', '4');
                                    
                                    const cross2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                                    cross2.setAttribute('x1', mx + 10);
                                    cross2.setAttribute('y1', my - 10);
                                    cross2.setAttribute('x2', mx - 10);
                                    cross2.setAttribute('y2', my + 10);
                                    cross2.setAttribute('stroke', '#f87171');
                                    cross2.setAttribute('stroke-width', '4');
                                    
                                    svg.appendChild(cross1);
                                    svg.appendChild(cross2);
                                }
                            });
                            
                            const drawLineRaw = (lRect, rRect, color) => {
                                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                                const svgRect = svg.getBoundingClientRect();
                                const x1 = lRect.right - svgRect.left;
                                const y1 = lRect.top + lRect.height / 2 - svgRect.top;
                                const x2 = rRect.left - svgRect.left;
                                const y2 = rRect.top + rRect.height / 2 - svgRect.top;
                                line.setAttribute('x1', x1);
                                line.setAttribute('y1', y1);
                                line.setAttribute('x2', x2);
                                line.setAttribute('y2', y2);
                                line.setAttribute('stroke', color);
                                line.setAttribute('stroke-width', '4');
                                line.style.filter = `drop-shadow(0 0 5px ${color})`;
                                return line;
                            };

                            correctPairsStr.forEach(pairStr => {
                                // Nếu cặp này HS đã nối đúng rồi thì không vẽ đè nữa
                                const alreadyCorrect = pairs.some(p => `${p.leftText}:${p.rightText}` === pairStr);
                                if (alreadyCorrect) return;

                                const [l, r] = pairStr.split(':');
                                if (!l || !r) return;
                                const leftItems = Array.from(document.querySelectorAll('.left-item'));
                                const rightItems = Array.from(document.querySelectorAll('.right-item'));
                                
                                const leftEl = leftItems.find(el => el.dataset.text === l);
                                const rightEl = rightItems.find(el => el.dataset.text === r);
                                
                                if (leftEl && rightEl) {
                                    const line = drawLineRaw(leftEl.getBoundingClientRect(), rightEl.getBoundingClientRect(), '#4ade80');
                                    // Thêm stroke-dasharray để phân biệt đường hệ thống tự vẽ lại
                                    line.setAttribute('stroke-dasharray', '5,5');
                                    svg.appendChild(line);
                                }
                            });
                        }
                    }, 1000);
                }
            }

            const selectedForScore = qType === 'Đúng/Sai' && Array.isArray(q.statements)
                ? (this.state.trueFalseSelections || [])
                : (qType === 'Trắc nghiệm' && Array.isArray(q.subquestions)
                    ? (this.state.multipleChoiceSelections || [])
                    : this.state.selectedAns);
            scoreResult = this.calculateQuestionScore(q, selectedForScore);
            isCorrect = scoreResult.isCorrect;
            this.state.score += scoreResult.points;

            if (isCorrect && q.templateId === 'number.safe_password_by_place_value') {
                document.querySelectorAll('.safe-password-illustration').forEach(safeImage => {
                    safeImage.src = safeImage.dataset.openSrc || './src/assets/safe-password-open-v1.png';
                    safeImage.alt = 'Két sắt đã mở';
                    safeImage.classList.add('safe-password-illustration--opened');
                });
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
                this.animateScoreGain(scoreResult.points);
                const user = app.data.currentUser;
                let basePet = 'robot_cat';
                if (user) {
                    let equipped = app.getEquippedPet(user);
                    basePet = equipped.split('.')[0];
                    if (basePet === 'cat_normal' || basePet === 'robot_cat_normal_transparent' || basePet === 'robot_cat_normal') basePet = 'robot_cat';
                }
                const happyImage = basePet === 'robot_cat' ? 'robot_cat_happy.webp' : `${basePet}_happy.png`;
                document.getElementById('play-cat-img').src = `./public/${happyImage}`;
                bubble.innerHTML = `<span style="color:#16a34a;">Hoan hô!<br>Bạn giỏi quá!</span>`;
            } else {
                app.playSound('wrong');

                const user = app.data.currentUser;
                let basePet = 'robot_cat';
                if (user) {
                    let equipped = app.getEquippedPet(user);
                    basePet = equipped.split('.')[0];
                    if (basePet === 'cat_normal' || basePet === 'robot_cat_normal_transparent' || basePet === 'robot_cat_normal') basePet = 'robot_cat';
                }
                const sadImage = basePet === 'robot_cat' ? 'robot_cat_sad.webp' : `${basePet}_sad.png`;
                document.getElementById('play-cat-img').src = `./public/${sadImage}`;
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

            if (!isCorrect && this.skills && this.skills.state.shieldActive) {
                // Hấp thụ sát thương, vẫn tính điểm cho câu này
                this.state.score += 1 - scoreResult.points;
                this.state.historyDetails.push(this.createHistoryDetail(q, this.state.selectedAns, false, { shieldUsed: true, ...scoreResult }));
                bubble.innerHTML = `<span style="color:#3b82f6;">Lá Chắn kích hoạt!<br>Không bị trừ điểm!</span>`;
                document.getElementById('play-cat-img').src = `./public/${document.getElementById('play-cat-img').src.split('/').pop().replace('_sad.webp', '_happy.webp').replace('_sad.png', '_happy.png').replace('_normal_transparent.png', '_happy_transparent.png').replace('_normal.webp', '_happy.webp').replace('_normal.png', '_happy.png')}`;
            } else {
                this.state.historyDetails.push(this.createHistoryDetail(q, this.state.selectedAns, isCorrect, scoreResult));
            }

            document.getElementById('game-score').textContent = this.state.score;

            const btnCheck = document.getElementById('submit-ans-btn');

            const isLast = this.state.currentIdx === this.state.questions.length - 1;
            const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
            const nextActionLabel = isLast ? (isAdmin ? 'Kết thúc' : 'Kết quả') : 'Tiếp tục';
            document.getElementById('submit-ans-text').textContent = nextActionLabel;
            document.getElementById('submit-ans-img').src = './public/ui/buttons/group1/continue.png';
            btnCheck.setAttribute('aria-label', nextActionLabel);

            btnCheck.onclick = () => {
                this.state.currentIdx++;
                if (this.state.currentIdx >= this.state.questions.length) this.finishPlay();
                else this.loadQuestion();
            };
        },
        animateScoreGain(points) {
            const scoreEl = document.getElementById('game-score');
            if (!scoreEl || !points) return;
            const rect = scoreEl.getBoundingClientRect();
            const float = document.createElement('div');
            float.className = 'score-float';
            float.textContent = `+${points} điểm`;
            float.style.left = `${rect.left + rect.width / 2}px`;
            float.style.top = `${rect.top}px`;
            document.body.appendChild(float);
            setTimeout(() => float.remove(), 950);
        },
        async finishPlay() {
            if (this.skills && app.data.currentUser) {
                this.skills.decreaseCooldowns(app.data.currentUser.username);
            }
            
            const finalScore = this.state.score;
            let msg = '';
            let starsEarned = 0;

            if (finalScore === 10) {
                msg = 'Tuyệt vời! Bạn đạt điểm tuyệt đối!';
            } else if (finalScore >= 8) {
                msg = 'Khá lắm! Bạn làm rất tốt!';
            } else {
                msg = 'Cố gắng thêm nữa bạn nhé!';
            }

            // Thưởng hằng ngày: 1 sao/ngày khi làm ≥1 lượt luyện tập + 5 sao chuỗi 5 ngày.
            // Chỉ áp dụng lượt luyện tập (không áp dụng đề kiểm tra).
            if (!this.state.examName && app.data.currentUser) {
                const daily = app.daily.registerPracticeDay(app.data.currentUser);
                if (daily.daily) {
                    starsEarned += daily.stars;
                    msg += ` Bạn nhận ${daily.stars} Sao hôm nay!`;
                    if (daily.bonus > 0) msg += ` Thưởng chuỗi ${daily.streak} ngày: +${daily.bonus} Sao!`;
                }
            }

            let title = this.state.examName || (this.state.subject === 'math' ? 'Toán' : 'Tiếng Việt');
            const newlyUnlockedTopic = await this.recordHistory(title, finalScore, 0);
            if (newlyUnlockedTopic) {
                msg += ` Bạn đã mở khóa chủ đề mới: ${newlyUnlockedTopic}!`;
            }

            // Update quests progress
            if (app.quest && typeof app.quest.updateProgress === 'function') {
                const playedTopics = [...new Set((this.state.questions || []).map(question => question.topic).filter(Boolean))];
                const fallbackTopics = this.state.examName ? [] : (this.state.selectedTopics || []);
                const playedLessons = [...new Set((this.state.questions || []).map(question => question.lesson).filter(Boolean))];
                app.quest.updateProgress(this.state.subject, finalScore, this.state.examId, this.state.questId, {
                    topics: playedTopics.length ? playedTopics : fallbackTopics,
                    lessons: playedLessons
                });
            }

            const scoreEl = document.getElementById('result-score');
            const scoreCircle = scoreEl.parentElement;
            scoreEl.innerHTML = finalScore;
            
            // Apply colors and glowing based on score
            if (finalScore < 5) {
                scoreCircle.style.color = '#ef4444'; // Red
                scoreCircle.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
            } else if (finalScore < 8) {
                scoreCircle.style.color = '#eab308'; // Yellow
                scoreCircle.style.textShadow = '0 0 20px rgba(234, 179, 8, 0.6)';
            } else if (finalScore < 10) {
                scoreCircle.style.color = '#3b82f6'; // Blue
                scoreCircle.style.textShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
            } else {
                scoreCircle.style.color = '#22c55e'; // Green
                scoreCircle.style.textShadow = '0 0 20px rgba(34, 197, 94, 0.6)';
                scoreEl.innerHTML = finalScore + '<span style="color:#fde047; font-size:3rem; text-shadow:0 0 20px #fde047; position:absolute; top:-20px; right:-30px;">⭐</span>';
            }

            document.getElementById('result-msg').textContent = msg;

            const chestContainer = document.getElementById('bonus-candies-container');
            if (starsEarned > 0) {
                chestContainer.style.display = 'flex';
                chestContainer.style.justifyContent = 'center';
                chestContainer.style.gap = '10px';
                chestContainer.innerHTML = Array(starsEarned).fill('<img src="./public/star-gold-3d.svg" style="width:60px; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5)); transition: transform 0.2s;" onmouseover="this.style.transform=\\\'scale(1.1)\\\'" onmouseout="this.style.transform=\\\'scale(1)\\\'">').join('');
                chestContainer.onclick = () => this.claimBonus();
            } else {
                chestContainer.style.display = 'none';
                chestContainer.innerHTML = '';
            }

            const detailsBox = document.getElementById('result-details');
            const historyDetails = Array.isArray(this.state.historyDetails) ? this.state.historyDetails : [];
            const htmlString = historyDetails.map((d, i) => {
                            let ansHtml = '';
                            if (d.type === 'Đối chiếu trùng khớp' && d.selected) {
                                const selPairs = d.selected.split(', ');
                                const corPairs = d.correct ? d.correct.split(', ') : [];
                                ansHtml = selPairs.map(sp => {
                                    const isPairCorrect = corPairs.includes(sp);
                                    return `<span style="color:${isPairCorrect ? '#4ade80' : '#f87171'}">${isPairCorrect ? '✅' : '❌'} ${app.data.sanitizeHTML(sp)}</span>`;
                                }).join('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
                            } else {
                                ansHtml = `<span style="color:${d.isCorrect ? '#4ade80' : '#f87171'}">${d.isCorrect ? '✅' : '❌'} ${app.data.sanitizeHTML(d.selected || 'Bỏ trống')}</span>`;
                            }
                            return `
                    <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.2);">
                      <b>${i + 1}.</b> ${this.formatHistoryQuestion(d)} <br>
                      Bạn chọn: ${ansHtml} <br>
                      ${!d.isCorrect ? `<span style="color:#4ade80">Đáp án: ${app.data.sanitizeHTML(d.correct)}</span>` : ''}
                    </div>
                  `;
                        }).join('');
            detailsBox.innerHTML = htmlString || '<p class="result-empty-details" role="status">Chưa có chi tiết bài làm để hiển thị.</p>';
            document.querySelector('#result-modal .result-layout')?.classList.toggle('result-layout--single-column', historyDetails.length === 0);

            document.getElementById('result-modal').classList.add('active');
        },
        async recordHistory(title, score, starsEarned) {
            if (!app.data.currentUser || app.data.currentUser.role?.toLowerCase() === 'admin') return null;

            let diffMap = { 'easy': 'Dễ', 'hard': 'Khó' };
            let diff = this.state.examName ? 'Đề thi' : (diffMap[this.state.difficulty] || 'Dễ');
            let top = this.state.examName ? 'Tổng hợp' : ((this.state.selectedTopics && this.state.selectedTopics.length) ? this.state.selectedTopics.join(', ') : 'Tất cả');
            let qCount = this.state.questions ? this.state.questions.length : (this.state.historyDetails ? this.state.historyDetails.length : 10);

            let d = new Date();
            let dStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ' ' + d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();

            const classlevel = String(app.data.currentUser.classlevel || '5').replace(/^Lớp\s*/i, '');
            const completedTopic = this.state.selectedTopics.length === 1 ? this.state.selectedTopics[0] : null;
            const perfectPracticeRound = !this.state.examName
                && completedTopic
                && score === 10
                && qCount === this.questionsPerRound;
            const nextTopic = perfectPracticeRound
                ? this.getNewlyUnlockedTopic(classlevel, this.state.subject, completedTopic)
                : null;
            const newlyUnlockedTopic = nextTopic && this.isStudentProgressionLocked(classlevel, this.state.subject, nextTopic)
                ? nextTopic
                : null;

            if (!Array.isArray(app.data.currentUser.history)) app.data.currentUser.history = []; app.data.currentUser.history.push({
                date: dStr,
                title: title,
                topic: top,
                subject: this.state.subject,
                classlevel,
                difficulty: diff,
                questionCount: qCount,
                score: score,
                details: this.state.historyDetails
            });
            if (starsEarned > 0) app.daily.addStars(app.data.currentUser, starsEarned);
            await app.data.updateUserScore();
            app.auth.updateHeader();
            return newlyUnlockedTopic;
        },
        claimBonus() {
            const chest = document.getElementById('bonus-chest-img');
            chest.src = './public/star-gold-3d.svg';
            chest.style.width = '100px';
            chest.onclick = null;
            alert('Nhận Sao Thành Công! Sao đã được lưu vào Kho Báu.');
        },
        closeResult() {
            document.getElementById('result-modal').classList.remove('active');
            app.router.open('map-screen');
        }
    },

    exam: {
        filters: { subject: '', period: '' },
        state: { questions: [], name: '', historyDetails: [], score: 0, adminclasslevel: '5', examId: null, questId: null },

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
        periodMatches(examPeriod, selectedPeriod) {
            const normalize = value => String(value || '').trim().normalize('NFC').toLocaleLowerCase('vi-VN');
            const examValue = normalize(examPeriod);
            const selectedValue = normalize(selectedPeriod);
            if (examValue === selectedValue) return true;
            const newScopeAliases = {
                'học kỳ 1': new Set(['giữa kỳ 1', 'cuối kỳ 1']),
                'học kỳ 2': new Set(['giữa kỳ 2', 'cuối kỳ 2'])
            };
            return Boolean(newScopeAliases[examValue]?.has(selectedValue));
        },

        getQuestionType(question) {
            if (Array.isArray(question?.comparisonRows)) return 'Kéo thả';
            const type = String(question.type || 'Trắc nghiệm').trim().normalize('NFC');
            if (type.includes('Đúng/Sai')) return 'Đúng/Sai';
            if (type.includes('So sánh')) return 'So sánh';
            if (type.includes('Chuỗi')) return 'Chuỗi Quy luật';
            if (type.includes('Kéo thả')) return 'Kéo thả';
            if (type.includes('Đối chiếu')) return 'Đối chiếu trùng khớp';
            if (type.includes('Điền')) return 'Điền khuyết';
            return 'Trắc nghiệm';
        },
        normalizeAnswer(value) {
            return String(value || '').trim().normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN');
        },
        renderSimpleChoices(index, choices) {
            return choices.map(choice => `<label class="exam-opt-label"><input type="radio" name="exam_q_${index}" value="${app.data.sanitizeHTML(choice)}"> ${app.data.sanitizeHTML(choice)}</label>`).join('');
        },
        renderQuestionInput(question, index) {
            const type = this.getQuestionType(question);
            const options = question.options || [];
            if (type === 'Trắc nghiệm' && Array.isArray(question.subquestions)) {
                return question.subquestions.map((subquestion, part) => `
                    <fieldset class="exam-true-false-row">
                        <legend>${app.data.sanitizeHTML(`${subquestion.label || String.fromCharCode(97 + part)}) ${subquestion.prompt || ''}`)}</legend>
                        ${this.renderSimpleChoices(`mc_${index}_${part}`, subquestion.options || [])}
                    </fieldset>
                `).join('');
            }
            if (type === 'Trắc nghiệm') return this.renderSimpleChoices(index, options);
            if (type === 'Đúng/Sai' && Array.isArray(question.statements)) {
                return question.statements.map((statement, part) => `
                    <fieldset class="exam-true-false-row">
                        <legend>${app.data.sanitizeHTML(`${statement.label || String.fromCharCode(65 + part)}. ${statement.text || ''}`)}</legend>
                        ${this.renderSimpleChoices(`tf_${index}_${part}`, ['Đúng', 'Sai'])}
                    </fieldset>
                `).join('');
            }
            if (type === 'Đúng/Sai') return this.renderSimpleChoices(index, ['Đúng', 'Sai']);
            if (type === 'So sánh') return this.renderSimpleChoices(index, ['<', '>', '=']);
            if (type === 'Đối chiếu trùng khớp') {
                const leftItems = String(options[0] || '').split(',').map(item => item.trim()).filter(Boolean);
                const rightItems = String(options[1] || '').split(',').map(item => item.trim()).filter(Boolean);
                if (!leftItems.length || !rightItems.length) return '<p style="color:#dc2626;">Câu đối chiếu thiếu dữ liệu hai cột.</p>';
                const choices = rightItems.map(item => `<option value="${app.data.sanitizeHTML(item)}">${app.data.sanitizeHTML(item)}</option>`).join('');
                return leftItems.map((left, part) => `<label style="display:flex; gap:10px; align-items:center; margin:8px 0;"><span style="min-width:130px;">${app.data.sanitizeHTML(left)}</span><select class="form-input" data-exam-match="${index}" data-left="${app.data.sanitizeHTML(left)}"><option value="">-- Chọn --</option>${choices}</select></label>`).join('');
            }

            const blanks = (String(question.q || '').match(/___|\.\.\./g) || []).length;
            const inputCount = Math.max(1, blanks);
            if (type === 'Kéo thả') {
                if (Array.isArray(question.comparisonRows)) {
                    return question.comparisonRows.map((row, part) => `<label style="display:flex; gap:10px; align-items:center; margin:8px 0;"><span>${app.data.sanitizeHTML(`${row.label || String.fromCharCode(97 + part)}) ${row.leftText} ___ ${row.rightText}`)}</span><select class="form-input" data-exam-part="${index}" data-part="${part}" style="max-width:180px;"><option value="">-- Chọn dấu --</option><option value=">">&gt;</option><option value="<">&lt;</option><option value="=">=</option></select></label>`).join('');
                }
                if (!options.length) return '<p style="color:#dc2626;">Câu kéo thả chưa có lựa chọn.</p>';
                const choices = options.map(item => `<option value="${app.data.sanitizeHTML(item)}">${app.data.sanitizeHTML(item)}</option>`).join('');
                return Array.from({ length: inputCount }, (_, part) => `<select class="form-input" data-exam-part="${index}" data-part="${part}" style="margin:5px; max-width:220px;"><option value="">-- Chọn đáp án ${part + 1} --</option>${choices}</select>`).join('');
            }
            return Array.from({ length: inputCount }, (_, part) => `<input type="text" class="fill-input" data-exam-part="${index}" data-part="${part}" style="max-width:400px; margin:5px;" placeholder="Nhập đáp án ${inputCount > 1 ? part + 1 : ''}">`).join('');
        },
        readQuestionAnswer(question, index) {
            const type = this.getQuestionType(question);
            if (type === 'Đúng/Sai' && Array.isArray(question.statements)) {
                return question.statements.map((_, part) =>
                    document.querySelector(`input[name="exam_q_tf_${index}_${part}"]:checked`)?.value || ''
                ).join(', ');
            }
            if (type === 'Trắc nghiệm' && Array.isArray(question.subquestions)) {
                return question.subquestions.map((_, part) => document.querySelector(`input[name="exam_q_mc_${index}_${part}"]:checked`)?.value || '').join(', ');
            }
            if (['Trắc nghiệm', 'Đúng/Sai', 'So sánh'].includes(type)) {
                return document.querySelector(`input[name="exam_q_${index}"]:checked`)?.value || '';
            }
            if (type === 'Đối chiếu trùng khớp') {
                return Array.from(document.querySelectorAll(`[data-exam-match="${index}"]`))
                    .map(select => `${select.dataset.left}:${select.value}`)
                    .join(', ');
            }
            return Array.from(document.querySelectorAll(`[data-exam-part="${index}"]`))
                .map(input => input.value.trim())
                .join(', ');
        },
        isAnswerCorrect(question, selected) {
            const type = this.getQuestionType(question);
            if (type === 'Đối chiếu trùng khớp') {
                const normalizePairs = value => String(value || '').split(',').map(pair => this.normalizeAnswer(pair)).filter(Boolean).sort();
                const chosen = normalizePairs(selected);
                const expected = normalizePairs(question.ans);
                return chosen.length === expected.length && chosen.every((pair, index) => pair === expected[index]);
            }
            if (['Điền khuyết', 'Chuỗi Quy luật', 'Kéo thả'].includes(type)) {
                const chosen = String(selected || '').split(',').map(value => this.normalizeAnswer(value));
                const expected = String(question.ans || '').split(',').map(value => this.normalizeAnswer(value));
                return chosen.length === expected.length && chosen.every((value, index) => value === expected[index]);
            }
            return this.normalizeAnswer(selected) === this.normalizeAnswer(question.ans);
        },
        start(forcedExamId = null, questId = null) {
            if (!this.filters.subject || !this.filters.period) {
                return alert('Vui lòng chọn môn học và thời gian!');
            }

            const isAdmin = app.data.currentUser && app.data.currentUser.role?.toLowerCase() === 'admin';
            let clLevel = isAdmin ? (this.state.adminclasslevel || '5') : (app.data.currentUser ? app.data.currentUser.classlevel : '5');
            clLevel = String(clLevel).replace('Lớp ', '').trim();

            const mappedSubject = this.filters.subject === 'math' ? 'Toán' : 'Tiếng Việt';

            const filtered = app.data.exams.filter(e => {
                const eSub = String(e.subject || '').trim().toLowerCase();
                const eClass = String(e.classlevel || '').trim().toLowerCase().replace('lớp ', '');
                return (eSub === mappedSubject.toLowerCase() || eSub.includes(mappedSubject.toLowerCase())) &&
                    eClass === clLevel &&
                    this.periodMatches(e.period, this.filters.period);
            });
            if (filtered.length === 0) return alert('Không tìm thấy đề kiểm tra phù hợp trong Kho Đề Kiểm tra.');

            const exam = forcedExamId
                ? filtered.find(item => item.id === forcedExamId)
                : filtered[Math.floor(Math.random() * filtered.length)];
            if (!exam) return alert('Đề kiểm tra được giao không còn phù hợp hoặc đã bị xóa.');
            if (!Array.isArray(exam.questions) || exam.questions.length === 0) return alert('Đề kiểm tra này chưa có câu hỏi.');
            if (exam.questions.length !== app.game.questionsPerRound) return alert('Đề kiểm tra phải có đúng 10 câu để chấm theo thang điểm 10.');
            const invalidQuestionIndex = exam.questions.findIndex(question => app.data.validateQuestionScoring(question));
            if (invalidQuestionIndex !== -1) return alert(`Câu ${invalidQuestionIndex + 1} của đề chưa đúng cấu trúc chấm điểm. Mỗi câu chỉ được có 1, 2 hoặc 4 câu trả lời đúng.`);

            const timeLimitMinutes = app.data.settings.examTimeLimit || 30;
            if (!confirm(`Bạn có thời gian ${timeLimitMinutes} phút để làm bài kiểm tra này.\n\nBấm OK để bắt đầu tính giờ, hoặc Cancel để hủy bỏ.`)) {
                return;
            }

            this.state.questions = exam.questions || [];
            this.state.name = exam.name;
            this.state.examId = exam.id || null;
            this.state.questId = questId;
            this.state.historyDetails = [];
            this.state.score = 0;

            document.getElementById('exam-title').textContent = exam.name;
            document.getElementById('exam-student-name').textContent = app.data.currentUser ? app.data.currentUser.fullname : 'Khách';

            const container = document.getElementById('exam-questions-container');
            container.innerHTML = '';

            this.state.questions.forEach((q, idx) => {
                const qBlock = document.createElement('div');
                qBlock.className = 'exam-q-block';
                qBlock.innerHTML = `<div class="exam-q-text">Câu ${idx + 1} (${q.type || 'Trắc nghiệm'}): ${app.data.formatMathHTML(q.q)}</div>`;
                if (q.imageUrl) qBlock.innerHTML += `<img src="${q.imageUrl}" style="max-height:150px; margin-bottom:10px;"><br>`;

                const optsContainer = document.createElement('div');
                optsContainer.className = 'exam-options';

                optsContainer.innerHTML = this.renderQuestionInput(q, idx);

                qBlock.appendChild(optsContainer);
                container.appendChild(qBlock);
            });

            app.router.open('exam-play-screen');
            
            // Ẩn nút Trở về
            const btnBackExam = document.getElementById('exam-btn-back');
            if (btnBackExam) btnBackExam.style.display = 'none';

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

            // D6: dùng deadline theo Date.now() để đồng hồ không lệch khi tab bị ẩn/throttle.
            const examDeadline = Date.now() + timeLeft * 1000;
            this.examTimer = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((examDeadline - Date.now()) / 1000));
                timerDisplay.textContent = formatTime(remaining);
                if (remaining <= 0) {
                    clearInterval(this.examTimer);
                    alert('Hết giờ! Hệ thống sẽ tự động nộp bài.');
                    this.submit(true);
                }
            }, 250);
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

            this.state.questions.forEach((q, idx) => {
                const selected = this.readQuestionAnswer(q, idx);
                const scoreResult = app.game.calculateQuestionScore(q, selected);
                const isCorrect = scoreResult.isCorrect;

                totalPts += scoreResult.points;
                this.state.historyDetails.push(app.game.createHistoryDetail(q, selected, isCorrect, scoreResult));
            });

            this.state.score = totalPts;
            app.game.state.score = this.state.score;
            app.game.state.historyDetails = this.state.historyDetails;
            app.game.state.questions = this.state.questions;
            app.game.state.subject = this.filters.subject;
            app.game.state.examName = this.state.name;
            app.game.state.examId = this.state.examId;
            app.game.state.questId = this.state.questId;

            app.game.finishPlay();
        }
    },

    admin: {
        questMode: 'personal',
        teamCompetitionDraft: null,
        teamCompetitionBoardTimer: null,
        composerState: {
            module: 'exams',
            classlevel: 'Lớp 5',
            subject: 'Toán',
            period: 'Học Kỳ 1',
            search: ''
        },
        isAdminUser() {
            return app.data.currentUser?.role?.toLowerCase() === 'admin';
        },
        syncRoleAwareLabels() {
            const stationLabel = document.getElementById('exam-station-label');
            const stationImage = document.getElementById('exam-station-image');
            const admin = this.isAdminUser();
            if (stationLabel) stationLabel.textContent = admin ? 'Soạn Đề' : 'Luyện Đề';
            if (stationImage) stationImage.alt = admin ? 'Soạn Đề' : 'Luyện Đề';
        },
        getComposerContentBox() {
            const composeScreen = document.getElementById('admin-compose-screen');
            return composeScreen?.classList.contains('active')
                ? document.getElementById('admin-compose-module-content')
                : document.getElementById('treasure-content-area');
        },
        getComposerModuleMeta(module) {
            return {
                templates: {
                    eyebrow: '01 · MẪU SINH CÂU',
                    title: 'Template',
                    description: 'Quản lý cấu trúc để hệ thống sinh câu hỏi đúng ý cô.',
                    countLabel: 'mẫu đang dùng',
                    openLabel: 'Mở kho Template',
                    actionLabel: 'Tạo template'
                },
                questions: {
                    eyebrow: '02 · NGÂN HÀNG NỘI DUNG',
                    title: 'Câu Hỏi',
                    description: 'Tạo, tìm, lọc và đưa câu hỏi vào đề bằng các thẻ nội dung dễ quét.',
                    countLabel: 'câu trong kho',
                    openLabel: 'Mở kho Câu Hỏi',
                    actionLabel: 'Tạo câu hỏi'
                },
                exams: {
                    eyebrow: '03 · BỘ ĐỀ HOÀN CHỈNH',
                    title: 'Đề Kiểm Tra',
                    description: 'Soạn, chỉnh sửa, xem trước và chuẩn bị đề để giao cho học sinh làm bài.',
                    countLabel: 'đề đã soạn',
                    openLabel: 'Mở kho Đề Kiểm Tra',
                    actionLabel: 'Tạo đề mới'
                }
            }[module] || this.getComposerModuleMeta('exams');
        },
        getComposerPeriodOptions() {
            return [
                { value: 'Học Kỳ 1', label: 'Học Kỳ 1' },
                { value: 'Học Kỳ 2', label: 'Học Kỳ 2' },
                { value: 'Cả Năm', label: 'Cả Năm' }
            ];
        },
        normalizeComposerPeriod(period = '') {
            const value = String(period ?? '').trim().normalize('NFC').toLocaleLowerCase('vi-VN');
            if (value === 'cả năm') return 'Cả Năm';
            if (value.includes('kỳ 2')) return 'Học Kỳ 2';
            return 'Học Kỳ 1';
        },
        getComposerTopicColor(index = 0) {
            return ['#c2a1ff', '#53def0', '#ffbf69', '#85e5bd', '#f7a8d8', '#f5da73'][index % 6];
        },
        getComposerStats() {
            const templates = Array.isArray(app.data.questionTemplates) ? app.data.questionTemplates : [];
            const questions = Array.isArray(app.data.libraryQuestions) ? app.data.libraryQuestions : [];
            const exams = Array.isArray(app.data.exams) ? app.data.exams : [];
            const countType = (items, type) => items.filter(item => item.question_type === type || item.type === type).length;
            const explanationCount = questions.filter(question => String(question.explanation || '').trim()).length;
            const exactExams = exams.filter(exam => (exam.questions || []).length === app.game.questionsPerRound).length;
            return {
                templates: {
                    count: templates.length,
                    metrics: [
                        ['Trắc nghiệm', countType(templates, 'Trắc nghiệm')],
                        ['Điền khuyết', countType(templates, 'Điền khuyết')],
                        ['Kéo thả', countType(templates, 'Kéo thả')]
                    ],
                    countLabel: 'mẫu đang dùng'
                },
                questions: {
                    count: questions.length,
                    metrics: [
                        ['Chủ đề đã chọn', new Set(questions.map(question => question.topic).filter(Boolean)).size],
                        ['Câu có lời giải', questions.length ? `${Math.round((explanationCount / questions.length) * 100)}%` : '0%'],
                        ['Câu cần rà soát', questions.filter(question => !String(question.explanation || '').trim()).length]
                    ],
                    countLabel: 'câu trong kho'
                },
                exams: {
                    count: exams.length,
                    metrics: [
                        ['Đề đang soạn', exams.filter(exam => (exam.questions || []).length < app.game.questionsPerRound).length],
                        [`Đủ ${app.game.questionsPerRound} câu`, exactExams],
                        [`Vượt ${app.game.questionsPerRound} câu`, exams.filter(exam => (exam.questions || []).length > app.game.questionsPerRound).length]
                    ],
                    countLabel: 'đề đã soạn'
                }
            };
        },
        renderComposerProfile() {
            const profile = document.getElementById('admin-compose-profile');
            if (!profile) return;
            const user = app.data.currentUser || {};
            const fullname = app.data.sanitizeHTML(user.fullname || 'Cô giáo Minh');
            const avatar = app.auth.getAvatar(user.avatar_key || 'teacher-female');
            const avatarLabel = app.data.sanitizeHTML(avatar.label || 'Quản trị viên');
            const avatarMarkup = avatar.image
                ? `<img class="admin-compose-profile__avatar admin-compose-profile__avatar--image" src="${avatar.image}" alt="Avatar ${avatarLabel}">`
                : `<span class="admin-compose-profile__avatar" aria-hidden="true">CM</span>`;
            profile.innerHTML = `${avatarMarkup}<span><strong>${fullname}</strong><small>Quản trị viên</small></span>`;
        },
        renderComposerCards() {
            const container = document.getElementById('admin-compose-cards');
            if (!container) return;
            const stats = this.getComposerStats();
            const modules = [
                { id: 'templates', className: 'template', icon: 'T' },
                { id: 'questions', className: 'questions', icon: 'Q' },
                { id: 'exams', className: 'exams', icon: 'Đ' }
            ];
            const esc = value => app.data.sanitizeHTML(value ?? '');
            container.innerHTML = modules.map(item => {
                const meta = this.getComposerModuleMeta(item.id);
                const moduleStats = stats[item.id];
                const selected = this.composerState.module === item.id;
                return `<button type="button" class="admin-compose-card admin-compose-card--${item.className}${selected ? ' is-selected' : ''}" data-admin-compose-module="${item.id}" aria-pressed="${selected}" onclick="app.admin.openComposerModule('${item.id}')">
                    <span class="admin-compose-card__top"><span class="admin-compose-card__eyebrow">${esc(meta.eyebrow)}</span><span class="admin-compose-card__selected" aria-hidden="true">✓</span></span>
                    <span class="admin-compose-card__icon" aria-hidden="true">${item.icon}</span>
                    <h3>${esc(meta.title)}</h3>
                    <p>${esc(meta.description)}</p>
                    <span class="admin-compose-card__metrics">${moduleStats.metrics.map(([label, value]) => `<span class="admin-compose-card__metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></span>`).join('')}</span>
                    <span class="admin-compose-card__footer"><span class="admin-compose-card__count"><strong>${esc(moduleStats.count)}</strong><span>${esc(moduleStats.countLabel)}</span></span><span class="admin-compose-card__open">Mở kho →</span></span>
                </button>`;
            }).join('');
        },
        syncComposerContextUI() {
            const state = this.composerState;
            const ids = {
                classlevel: 'admin-compose-class',
                subject: 'admin-compose-subject',
                period: 'admin-compose-period',
                search: 'admin-compose-search'
            };
            Object.entries(ids).forEach(([key, id]) => {
                const field = document.getElementById(id);
                if (field && field.value !== state[key]) field.value = state[key] || '';
            });
            const context = document.getElementById('admin-compose-context');
            if (context) context.dataset.context = `${state.classlevel} · ${state.subject} · ${state.period}`;
            const moduleSummary = document.getElementById('admin-compose-module-summary');
            if (moduleSummary) moduleSummary.innerHTML = `<span>${app.data.sanitizeHTML(state.classlevel)}</span><span>${app.data.sanitizeHTML(state.subject)}</span><span>${app.data.sanitizeHTML(state.period)}</span>`;
        },
        updateComposerContext() {
            const read = id => document.getElementById(id)?.value || '';
            this.composerState.classlevel = read('admin-compose-class') || 'Lớp 5';
            this.composerState.subject = read('admin-compose-subject') || 'Toán';
            this.composerState.period = read('admin-compose-period') || 'Học Kỳ 1';
            this.composerState.search = read('admin-compose-search');
            this.syncComposerContextUI();
        },
        renderComposerModule(module = 'exams') {
            const allowed = ['templates', 'questions', 'exams'];
            const selectedModule = allowed.includes(module) ? module : 'exams';
            this.composerState.module = selectedModule;
            const meta = this.getComposerModuleMeta(selectedModule);
            const title = document.getElementById('admin-compose-module-title');
            const kicker = document.getElementById('admin-compose-module-kicker');
            const description = document.getElementById('admin-compose-module-description');
            const panel = document.getElementById('admin-compose-module-panel');
            const box = document.getElementById('admin-compose-module-content');
            if (title) title.textContent = meta.title;
            if (kicker) kicker.textContent = `ĐANG CHỌN · ${meta.eyebrow.replace(/^\d+\s*·\s*/, '')}`;
            if (description) description.textContent = meta.description;
            if (panel) panel.dataset.module = selectedModule;
            if (box) {
                box.innerHTML = '';
                if (selectedModule === 'templates') this.renderTemplates(box);
                else if (selectedModule === 'questions') this.renderQuestions(box);
                else this.renderExams(box);
            }
            this.renderComposerCards();
            this.syncComposerContextUI();
            this.syncComposerQuestionNav();
        },
        renderComposer() {
            if (!this.isAdminUser()) return false;
            this.syncRoleAwareLabels();
            this.renderComposerProfile();
            this.syncComposerContextUI();
            this.renderComposerModule(this.composerState.module || 'exams');
            this.setComposerStep('workspace');
            return true;
        },
        openComposer(module = 'exams') {
            if (!this.isAdminUser()) return false;
            const allowed = ['templates', 'questions', 'exams'];
            this.composerState.module = allowed.includes(module) ? module : 'exams';
            const treasureModal = document.getElementById('treasure-modal');
            if (treasureModal) {
                treasureModal.style.display = 'none';
                treasureModal.classList.remove('active');
            }
            app.router.open('admin-compose-screen');
            this.renderComposer();
            return true;
        },
        openComposerModule(module) {
            if (!this.isAdminUser()) return false;
            if (!document.getElementById('admin-compose-screen')?.classList.contains('active')) return this.openComposer(module);
            this.renderComposerModule(module);
            this.setComposerStep('content');
            this.focusComposerSection('admin-compose-module-panel');
            return true;
        },
        continueComposer() {
            return this.openComposerModule(this.composerState.module || 'exams');
        },
        setComposerStep(step = 'workspace') {
            const activeStep = ['workspace', 'content', 'review'].includes(step) ? step : 'workspace';
            document.querySelectorAll('.admin-compose-step').forEach(stepEl => {
                const selected = stepEl.dataset.composeStep === activeStep;
                stepEl.classList.toggle('is-active', selected);
                if (selected) stepEl.setAttribute('aria-current', 'step');
                else stepEl.removeAttribute('aria-current');
            });
        },
        getComposerScrollBehavior() {
            const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
            return media?.matches ? 'auto' : 'smooth';
        },
        focusComposerSection(sectionId, button) {
            const section = document.getElementById(sectionId);
            if (section) section.scrollIntoView({ behavior: this.getComposerScrollBehavior(), block: 'start' });
            const requestedStep = button?.dataset.composeStep || (sectionId === 'admin-compose-workspaces' ? 'workspace' : 'content');
            this.setComposerStep(requestedStep);
        },
        syncComposerQuestionNav() {
            const nav = document.getElementById('admin-compose-question-nav');
            const list = document.getElementById('admin-compose-question-nav-list');
            if (!nav || !list) return;
            const cards = Array.from(document.querySelectorAll('#admin-e-subarea .exam-question-card'));
            const shouldShow = this.composerState.module === 'exams' && cards.length > 0;
            nav.hidden = !shouldShow;
            if (!shouldShow) {
                list.innerHTML = '';
                return;
            }
            const currentIndex = list.querySelector('[aria-current="true"]')?.dataset.questionNavIndex || '';
            if (list.children.length !== cards.length) {
                list.innerHTML = cards.map((card, index) => `<button type="button" class="admin-compose-question-nav__item" data-question-nav-index="${index}" aria-label="Đi tới Câu ${index + 1}" onclick="app.admin.focusComposerQuestion(${index}, this)"><span>${String(index + 1).padStart(2, '0')}</span><i aria-hidden="true"></i></button>`).join('');
            }
            const filledCount = cards.filter(card => card.classList.contains('is-filled')).length;
            const count = document.getElementById('admin-compose-question-nav-count');
            if (count) count.textContent = `${filledCount}/${cards.length}`;
            list.querySelectorAll('[data-question-nav-index]').forEach(button => {
                const index = Number(button.dataset.questionNavIndex);
                const filled = cards[index]?.classList.contains('is-filled');
                button.classList.toggle('is-filled', filled);
                button.setAttribute('aria-label', `Đi tới Câu ${index + 1}${filled ? ', đã điền' : ', chưa điền'}`);
                if (String(index) === currentIndex) button.setAttribute('aria-current', 'true');
                else button.removeAttribute('aria-current');
            });
        },
        focusComposerQuestion(index, button) {
            const card = document.querySelector(`#admin-e-subarea .exam-question-card[data-question-index="${index}"]`);
            if (!card) return;
            this.setComposerStep('content');
            document.querySelectorAll('#admin-compose-question-nav [data-question-nav-index]').forEach(navButton => {
                if (navButton === button || navButton.dataset.questionNavIndex === String(index)) navButton.setAttribute('aria-current', 'true');
                else navButton.removeAttribute('aria-current');
            });
            card.scrollIntoView({ behavior: this.getComposerScrollBehavior(), block: 'start' });
        },
        reviewComposer(button) {
            this.openComposerModule('exams');
            this.setComposerStep(button?.dataset.composeStep || 'review');
            setTimeout(() => {
                this.renderESubTab('add');
                this.setComposerStep('review');
            }, 0);
        },
        closeComposer() {
            if (!this.isAdminUser()) return false;
            app.router.open('map-screen');
            return true;
        },
        supportsAdminLessons(classlevel, subject) {
            return Boolean(app.curriculum?.supportsLessons(classlevel, subject));
        },
        normalizeAdminLesson(value) {
            const raw = String(value ?? '').trim();
            if (!raw || !app.curriculum) return '';
            const direct = app.curriculum.findLesson(raw);
            if (direct) return direct.id;
            const byLabel = app.curriculum.getAllLessons({ classlevel: 'Lớp 4', subject: 'Toán' })
                .find(lesson => app.data.normalizeQuestionPart(lesson.label) === app.data.normalizeQuestionPart(raw));
            return byLabel?.id || '';
        },
        lessonLabel(value) {
            return app.curriculum?.getLessonLabel(value) || String(value || '');
        },
        getLessonOptions(lessons, selected = '', emptyLabel = 'Không gắn Bài học') {
            const selectedId = this.normalizeAdminLesson(selected);
            return [`<option value="">${app.data.sanitizeHTML(emptyLabel)}</option>`, ...(lessons || []).map(lesson => `<option value="${app.data.sanitizeHTML(lesson.id)}" ${lesson.id === selectedId ? 'selected' : ''}>${app.data.sanitizeHTML(lesson.label)}</option>`)].join('');
        },
        updateQuestionLessonDropdown(selectedLesson = '') {
            const field = document.getElementById('add-q-lesson-field');
            const lessonEl = document.getElementById('add-q-lesson');
            if (!field || !lessonEl) return;
            const classlevel = document.getElementById('add-q-class')?.value || '';
            const subject = document.getElementById('add-q-sub')?.value || '';
            const semester = document.getElementById('add-q-sem')?.value || '';
            const topic = document.getElementById('add-q-topic')?.value || '';
            const supported = this.supportsAdminLessons(classlevel, subject);
            const selected = selectedLesson || lessonEl.value || lessonEl.dataset.selected || '';
            field.hidden = !supported;
            lessonEl.disabled = !supported;
            const lessons = supported ? app.curriculum.getLessons({ classlevel, subject, semester, topic }) : [];
            lessonEl.innerHTML = this.getLessonOptions(lessons, selected);
            if (supported) {
                lessonEl.value = this.normalizeAdminLesson(selected) || '';
                if (lessonEl.value) lessonEl.dataset.selected = lessonEl.value;
                else delete lessonEl.dataset.selected;
            } else {
                delete lessonEl.dataset.selected;
                lessonEl.value = '';
            }
        },
        getExamLessons(classlevel, subject, topics = []) {
            if (!this.supportsAdminLessons(classlevel, subject)) return [];
            const topicSet = new Set(topics || []);
            return app.curriculum.getTopicEntries({ classlevel, subject })
                .filter(entry => !topicSet.size || topicSet.has(entry.topic))
                .flatMap(entry => entry.lessons);
        },
        getExamLessonSelectionState() {
            const wrap = document.getElementById('add-e-lessons');
            if (!wrap || wrap.hidden) return { selectedLessons: [], unrestricted: true };
            const inputs = Array.from(wrap.querySelectorAll('input[type="checkbox"]'));
            const selectedLessons = inputs.filter(input => input.checked).map(input => input.value);
            const unrestricted = selectedLessons.length === 0 || selectedLessons.length === inputs.length;
            return { selectedLessons: unrestricted ? [] : selectedLessons, unrestricted };
        },
        getSelectedExamLessons() {
            return this.getExamLessonSelectionState().selectedLessons;
        },
        renderExamLessonFilters(classlevel, subject, topics, selectedLessons = [], unrestricted = !selectedLessons.length) {
            const wrap = document.getElementById('add-e-lessons');
            const field = document.getElementById('add-e-lessons-field');
            if (!wrap || !field) return;
            const supported = this.supportsAdminLessons(classlevel, subject);
            field.hidden = !supported;
            wrap.hidden = !supported;
            if (!supported) {
                wrap.dataset.selectionMode = 'all';
                wrap.innerHTML = '';
                return;
            }
            const selected = new Set((selectedLessons || []).map(value => this.normalizeAdminLesson(value)).filter(Boolean));
            const unrestrictedScope = unrestricted || !selected.size;
            wrap.dataset.selectionMode = unrestrictedScope ? 'all' : 'selected';
            const entries = app.curriculum.getTopicEntries({ classlevel, subject })
                .filter(entry => !(topics || []).length || topics.includes(entry.topic));
            const totalLessons = entries.reduce((total, entry) => total + entry.lessons.length, 0);
            const selectedCount = unrestrictedScope
                ? totalLessons
                : entries.flatMap(entry => entry.lessons).filter(lesson => selected.has(lesson.id)).length;
            const summary = entries.length
                ? (unrestrictedScope ? `Đang áp dụng toàn bộ ${totalLessons} Bài học trong Chủ đề đã chọn` : `Đang chọn ${selectedCount}/${totalLessons} Bài học`)
                : 'Chọn Chủ đề để hiện các Bài học tương ứng';
            wrap.innerHTML = `<div id="add-e-lessons-summary" class="exam-composer__lessons-summary" role="status">${app.data.sanitizeHTML(summary)}</div>${entries.length
                ? entries.map((entry, topicIndex) => `<fieldset class="exam-composer__lesson-group" style="--topic-color:${this.getComposerTopicColor(topicIndex)}"><legend>${app.data.sanitizeHTML(entry.topic)}</legend><div class="exam-composer__lessons">${entry.lessons.map(lesson => `<label class="exam-composer__lesson-option"><input type="checkbox" value="${app.data.sanitizeHTML(lesson.id)}" ${unrestrictedScope || selected.has(lesson.id) ? 'checked' : ''} onchange="app.admin.updateExamTopics()"><span>${app.data.sanitizeHTML(lesson.label)}</span></label>`).join('')}</div></fieldset>`).join('')
                : '<span class="exam-composer__topics-empty">Chưa có Bài học cho lựa chọn này.</span>'}`;
        },
        updateExamQuestionLesson(index, selectedLesson = '') {
            const lessonEl = document.getElementById(`add-e-q-lesson-${index}`);
            const topicEl = document.getElementById(`add-e-q-topic-${index}`);
            if (!lessonEl || !topicEl) return;
            const classlevel = document.getElementById('add-e-class')?.value || '';
            const subject = document.getElementById('add-e-sub')?.value || '';
            const topic = topicEl.value || topicEl.getAttribute('data-selected') || '';
            const supported = this.supportsAdminLessons(classlevel, subject);
            const selected = selectedLesson || lessonEl.value || lessonEl.dataset.selected || '';
            lessonEl.disabled = !supported;
            const lessons = supported ? app.curriculum.getLessons({ classlevel, subject, topic }) : [];
            lessonEl.innerHTML = this.getLessonOptions(lessons, selected);
            if (supported) {
                lessonEl.value = this.normalizeAdminLesson(selected) || '';
                if (lessonEl.value) lessonEl.dataset.selected = lessonEl.value;
                else delete lessonEl.dataset.selected;
            } else {
                delete lessonEl.dataset.selected;
                lessonEl.value = '';
            }
            lessonEl.closest('.exam-form-field')?.toggleAttribute('hidden', !supported);
        },
        updateTopicDropdown() {
            const subEl = document.getElementById('add-q-sub');
            if (!subEl) return;
            const sub = subEl.value;

            const clsEl = document.getElementById('add-q-class');
            const clsNum = clsEl ? clsEl.value.replace('Lớp ', '').trim() : '5';
            const semesterEl = document.getElementById('add-q-sem');
            const semester = semesterEl ? semesterEl.value : 'Học kỳ 1';
            const semesterKey = semester === 'Học kỳ 2' ? 'hk2' : 'hk1';

            const topicEl = document.getElementById('add-q-topic');
            const topicDict = app.constants.topics[clsNum] || { math: { hk1: [], hk2: [] }, vietnamese: { hk1: [], hk2: [] } };
            const topicsObj = sub === 'Toán' ? topicDict.math : (sub === 'Tiếng Việt' ? topicDict.vietnamese : { hk1: [], hk2: [] });
            const topics = topicsObj[semesterKey] || [];

            const selected = topicEl.getAttribute('data-selected');
            topicEl.innerHTML = topics.map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`).join('');
            this.updateQuestionLessonDropdown();
        },
        updateExamTopics() {
            const subEl = document.getElementById('add-e-sub');
            const clsEl = document.getElementById('add-e-class');
            if (!subEl) return;
            const sub = subEl.value;
            const clsNum = clsEl ? clsEl.value.replace('Lớp ', '').trim() : '5';
            const topicDict = app.constants.topics[clsNum] || { math: { hk1: [], hk2: [] }, vietnamese: { hk1: [], hk2: [] } };
            const topicsObj = sub === 'Toán' ? topicDict.math : (sub === 'Tiếng Việt' ? topicDict.vietnamese : { hk1: [], hk2: [] });
            const period = this.normalizeComposerPeriod(document.getElementById('add-e-period')?.value || 'Học Kỳ 1');
            const topics = period === 'Cả Năm'
                ? [...(topicsObj.hk1 || []), ...(topicsObj.hk2 || [])]
                : [...((period === 'Học Kỳ 2' ? topicsObj.hk2 : topicsObj.hk1) || [])];
            const topicWrap = document.getElementById('add-e-topics');
            let selectedTopics = [];
            if (topicWrap) {
                try { selectedTopics = JSON.parse(topicWrap.dataset.selected || '[]'); } catch (_) { selectedTopics = []; }
                if (!selectedTopics.length) selectedTopics = Array.from(topicWrap.querySelectorAll('input:checked')).map(input => input.value);
                selectedTopics = selectedTopics.filter(topic => topics.includes(topic));
                delete topicWrap.dataset.selected;
                topicWrap.innerHTML = topics.length
                    ? topics.map((topic, topicIndex) => `<label class="exam-composer__topic-option${selectedTopics.includes(topic) ? ' is-selected' : ''}" data-topic-index="${topicIndex}" style="--topic-color:${this.getComposerTopicColor(topicIndex)}"><input type="checkbox" value="${app.data.sanitizeHTML(topic)}" ${selectedTopics.includes(topic) ? 'checked' : ''} onchange="app.admin.updateExamTopics()"><span>${app.data.sanitizeHTML(topic)}</span></label>`).join('')
                    : '<span class="exam-composer__topics-empty">Chưa có chủ đề cho lựa chọn này.</span>';
            }
            const questionTopics = selectedTopics.length ? selectedTopics : topics;
            const lessonWrap = document.getElementById('add-e-lessons');
            let selectedLessons = [];
            let unrestrictedLessons = true;
            if (lessonWrap) {
                const hasDraftSelection = Object.prototype.hasOwnProperty.call(lessonWrap.dataset, 'selected');
                if (hasDraftSelection) {
                    try { selectedLessons = JSON.parse(lessonWrap.dataset.selected || '[]'); } catch (_) { selectedLessons = []; }
                    unrestrictedLessons = lessonWrap.dataset.selectionMode !== 'selected';
                } else {
                    const selection = this.getExamLessonSelectionState();
                    selectedLessons = selection.selectedLessons;
                    unrestrictedLessons = selection.unrestricted;
                }
                const allowedLessonIds = new Set(this.getExamLessons(clsEl?.value || '', sub, questionTopics).map(lesson => lesson.id));
                selectedLessons = unrestrictedLessons
                    ? []
                    : selectedLessons.map(value => this.normalizeAdminLesson(value)).filter(value => allowedLessonIds.has(value));
                if (!selectedLessons.length) unrestrictedLessons = true;
                delete lessonWrap.dataset.selected;
            }
            this.renderExamLessonFilters(clsEl?.value || '', sub, questionTopics, selectedLessons, unrestrictedLessons);

            let i = 0;
            while (true) {
                const topicEl = document.getElementById(`add-e-q-topic-${i}`);
                if (!topicEl) break;
                const selected = topicEl.getAttribute('data-selected') || topicEl.value;
                topicEl.innerHTML = questionTopics.map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`).join('');
                if (selected && questionTopics.includes(selected)) topicEl.value = selected;
                this.updateExamQuestionLesson(i);
                i++;
            }
            this.syncExamComposerTopicStates();
        },
        syncExamComposerTopicStates() {
            document.querySelectorAll('#add-e-topics .exam-composer__topic-option').forEach(option => {
                const input = option.querySelector('input[type="checkbox"]');
                const selected = Boolean(input?.checked);
                option.classList.toggle('is-selected', selected);
                option.dataset.selected = String(selected);
            });
        },
        updateExamQuestionCard(index) {
            const card = document.querySelector(`.exam-question-card[data-question-index="${index}"]`);
            if (!card) return;
            const questionText = document.getElementById(`add-e-q-q-${index}`)?.value.trim() || '';
            const answerText = [
                document.getElementById(`add-e-q-ans-${index}`)?.value,
                ...Array.from(card.querySelectorAll('input[id*="-opt"], input[id*="-match-"]')).map(input => input.value),
                ...Array.from(card.querySelectorAll('input[id*="structured"], textarea[id*="structured"]')).map(input => input.value)
            ].some(value => String(value || '').trim());
            const filled = Boolean(questionText || answerText);
            const status = card.querySelector('.exam-question-card__status');
            const subtitle = card.querySelector('.exam-question-card__title-wrap p');
            card.classList.toggle('is-filled', filled);
            card.classList.toggle('is-empty', !filled);
            status?.classList.toggle('exam-question-card__status--filled', filled);
            if (status) status.textContent = filled ? 'Đã điền' : 'Chưa điền';
            if (subtitle) subtitle.textContent = filled ? 'Nội dung đã nhập, tiếp tục hoàn thiện.' : 'Bắt đầu từ nội dung câu hỏi.';
            this.updateExamComposerProgress();
            this.syncComposerQuestionNav();
        },
        updateExamComposerProgress() {
            const composer = document.querySelector('.exam-composer');
            if (!composer) return;
            const total = app.game.questionsPerRound;
            const count = composer.querySelectorAll('.exam-question-card.is-filled').length;
            const progress = composer.querySelector('.exam-composer__progress');
            const progressStrong = progress?.querySelector('.exam-composer__progress-heading strong');
            const progressTrack = progress?.querySelector('.exam-composer__progress-track i');
            const progressHint = progress?.querySelector('small');
            const sectionCount = composer.querySelector('.exam-composer__question-bank .exam-composer__section-count');
            if (progressStrong) progressStrong.textContent = count;
            if (progressTrack) progressTrack.style.width = `${Math.min(100, count / total * 100)}%`;
            if (progressHint) progressHint.textContent = count === total ? 'Đã đủ câu để rà soát' : `Còn ${Math.max(0, total - count)} câu cần hoàn thiện`;
            if (sectionCount) sectionCount.innerHTML = `<strong>${count}</strong> / ${total} câu đã có`;
        },
        clearExamComposerError() {
            const error = document.getElementById('add-e-form-error');
            if (error) {
                error.hidden = true;
                error.textContent = '';
            }
            document.querySelectorAll('.exam-composer [aria-invalid="true"]').forEach(field => {
                field.removeAttribute('aria-invalid');
                if (field.id !== 'add-e-name' && field.getAttribute('aria-describedby') === 'add-e-form-error') field.removeAttribute('aria-describedby');
            });
        },
        showExamComposerError(message, fieldId = '') {
            const error = document.getElementById('add-e-form-error');
            if (!error) return alert(message);
            this.clearExamComposerError();
            error.textContent = message;
            error.hidden = false;
            const field = fieldId ? document.getElementById(fieldId) : null;
            if (field) {
                field.setAttribute('aria-invalid', 'true');
                if (!field.getAttribute('aria-describedby')) field.setAttribute('aria-describedby', error.id);
                field.focus({ preventScroll: true });
            }
            error.scrollIntoView({ behavior: this.getComposerScrollBehavior(), block: 'center' });
            return false;
        },
        bindExamComposerInteractions() {
            const composer = document.querySelector('.exam-composer');
            if (!composer || composer.dataset.interactionsBound === 'true') return;
            composer.dataset.interactionsBound = 'true';
            const update = event => {
                const card = event.target.closest?.('.exam-question-card');
                if (!card) return;
                this.updateExamQuestionCard(card.dataset.questionIndex);
            };
            composer.addEventListener('input', event => {
                this.clearExamComposerError();
                update(event);
            });
            composer.addEventListener('change', event => {
                this.clearExamComposerError();
                update(event);
            });
            composer.querySelectorAll('.exam-question-card').forEach(card => this.updateExamQuestionCard(card.dataset.questionIndex));
            this.syncComposerQuestionNav();
        },
        toggleQuestionType(prefix, idx = '') {
            const suffix = idx !== '' ? `-${idx}` : '';
            const typeEl = document.getElementById(`${prefix}-type${suffix}`);
            const optsWrapper = document.getElementById(`${prefix}-opts-wrapper${suffix}`);
            const matchWrapper = document.getElementById(`${prefix}-match-wrapper${suffix}`);
            if (typeEl) {
                const val = typeEl.value;
                if (optsWrapper) {
                    optsWrapper.style.display = (val === 'Trắc nghiệm' || val === 'Kéo thả') ? 'block' : 'none';
                }
                if (matchWrapper) {
                    matchWrapper.style.display = (val === 'Đối chiếu trùng khớp') ? 'block' : 'none';
                }
            }
        },
        getExamQuestionStructureKind(question) {
            if (Array.isArray(question?.statements) && question.statements.length) return 'statements';
            if (Array.isArray(question?.subquestions) && question.subquestions.length) {
                const hasChoiceFields = question.subquestions.some(part => Array.isArray(part?.options) && part.options.length)
                    || question.subquestions.some(part => Object.prototype.hasOwnProperty.call(part || {}, 'prompt'));
                return hasChoiceFields ? 'subquestions' : 'practiceRows';
            }
            if (Array.isArray(question?.angleItems) && question.angleItems.length) return 'angleItems';
            if (Array.isArray(question?.angleCountRows) && question.angleCountRows.length) return 'angleCountRows';
            if (Array.isArray(question?.sequenceRounds) && question.sequenceRounds.length) return 'sequenceRounds';
            if (Array.isArray(question?.practiceRows) && question.practiceRows.length) return 'practiceRows';
            if (Array.isArray(question?.comparisonRows) && question.comparisonRows.length) return 'comparisonRows';
            const partAnswerCounts = Array.isArray(question?.partAnswerCounts)
                ? question.partAnswerCounts.map(Number)
                : [];
            const answerCount = app.data.getQuestionAnswerCount(question);
            const isFourPartAnswerGroup = partAnswerCounts.length === 4
                && partAnswerCounts.every(partCount => Number.isInteger(partCount) && partCount > 0)
                && partAnswerCounts.reduce((total, partCount) => total + partCount, 0) === answerCount;
            const type = String(question?.type || '').trim().normalize('NFC');
            const supportsGenericAnswerParts = ['Điền khuyết', 'Kéo thả'].includes(type);
            if ((isFourPartAnswerGroup || answerCount === 4) && supportsGenericAnswerParts) return 'answerParts';
            return '';
        },
        isFourPartExamQuestion(question) {
            const kind = this.getExamQuestionStructureKind(question);
            if (!kind) return false;
            const parts = kind === 'answerParts'
                ? null
                : question?.[kind] || (kind === 'practiceRows' ? question?.subquestions : null);
            if (parts && (!Array.isArray(parts) || parts.length !== 4)) return false;
            const answerCount = app.data.getQuestionAnswerCount(question);
            const partAnswerCounts = Array.isArray(question?.partAnswerCounts)
                ? question.partAnswerCounts.map(Number)
                : [];
            const hasFourScoringParts = partAnswerCounts.length === 4
                && partAnswerCounts.every(partCount => Number.isInteger(partCount) && partCount > 0)
                && partAnswerCounts.reduce((total, partCount) => total + partCount, 0) === answerCount;
            if (!hasFourScoringParts && answerCount !== 4) return false;
            return !app.data.validateQuestionScoring(question);
        },
        renderExamQuestionStructure(question, index) {
            const kind = this.getExamQuestionStructureKind(question);
            if (!kind) return '';
            const esc = value => app.data.sanitizeHTML(value ?? '');
            const safeSvgPreview = value => {
                const raw = String(value || '').trim();
                if (!/^<svg\b/i.test(raw)) return '';
                return raw
                    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
                    .replace(/\s(?:href|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
            };
            const defaultLabel = (partIndex, uppercase = false) => String.fromCharCode((uppercase ? 65 : 97) + partIndex);
            const heading = {
                statements: 'Bốn nhận định Đúng/Sai',
                subquestions: 'Bốn câu hỏi con và các lựa chọn',
                angleItems: 'Bốn hình góc và đáp án',
                angleCountRows: 'Bốn ý đếm góc',
                sequenceRounds: 'Bốn dãy số theo quy luật',
                practiceRows: 'Các ý nhỏ trong bài',
                comparisonRows: 'Bốn ý cần so sánh',
                answerParts: 'Bốn ý và đáp án'
            }[kind];
            const description = {
                statements: 'Chỉnh nội dung và đáp án riêng cho từng nhận định; hệ thống tự ghép dữ liệu chấm khi lưu.',
                subquestions: 'Mỗi ý có nội dung, 4 lựa chọn và đáp án riêng để giáo viên tự biên soạn.',
                angleItems: 'Chỉnh nhãn và đáp án riêng cho từng hình góc; hình minh họa được giữ nguyên theo template.',
                angleCountRows: 'Chỉnh nhãn, loại góc và số lượng đúng cho từng ý; hình minh họa được giữ nguyên theo template.',
                sequenceRounds: 'Mỗi dãy là một ý 0,25 điểm. Có thể sửa nội dung dãy và nhập các đáp án, cách nhau bằng dấu phẩy.',
                practiceRows: 'Chỉnh nội dung hiển thị và đáp án của từng ý; dữ liệu phụ của template vẫn được giữ lại.',
                comparisonRows: 'Chỉnh hai vế và dấu đúng cho từng ý; hệ thống tự cập nhật phần hiển thị.',
                answerParts: 'Chỉnh nội dung và đáp án riêng cho từng ý; hệ thống tự ghép dữ liệu chấm khi lưu.'
            }[kind];
            const splitPromptParts = value => {
                const lines = String(value || '').split(/<br\s*\/?\s*>/i).map(line => line.trim()).filter(Boolean);
                const labeledLines = lines.filter(line => /^[a-dA-D][.)]\s*/.test(line));
                const source = (labeledLines.length === 4 ? labeledLines : lines.slice(-4)).slice(0, 4);
                while (source.length < 4) source.push('');
                return source.map((line, partIndex) => ({
                    label: defaultLabel(partIndex),
                    display: line.replace(/^[a-dA-D][.)]\s*/, '').trim()
                }));
            };
            const parts = kind === 'answerParts'
                ? splitPromptParts(question.q)
                : question[kind] || (kind === 'practiceRows' ? question.subquestions : []);

            if (kind === 'statements') {
                return `<fieldset class="exam-structured-editor exam-structured-editor--statements" data-structured-kind="statements">
                    <legend>${heading}</legend>
                    <p class="exam-structured-editor__description">${description}</p>
                    <div class="exam-structured-editor__parts">
                        ${parts.map((part, partIndex) => {
                            const label = part?.label || defaultLabel(partIndex, true);
                            const currentAnswer = String(part?.answer ?? '').trim().toLocaleLowerCase('vi-VN');
                            return `<article class="exam-structured-part" data-structured-part="${partIndex}">
                                <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Nhãn ý</span>
                                    <input type="text" id="add-e-q-structured-label-${index}-${partIndex}" class="form-input" value="${esc(label)}">
                                </label>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Nội dung ý ${esc(label)}</span>
                                    <textarea id="add-e-q-structured-text-${index}-${partIndex}" class="form-input" placeholder="Nhập nhận định">${esc(part?.text || '')}</textarea>
                                </label>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Đáp án ý ${esc(label)}</span>
                                    <select id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input">
                                        <option value="Đúng" ${currentAnswer === 'đúng' ? 'selected' : ''}>Đúng</option>
                                        <option value="Sai" ${currentAnswer === 'sai' ? 'selected' : ''}>Sai</option>
                                    </select>
                                </label>
                            </article>`;
                        }).join('')}
                    </div>
                </fieldset>`;
            }

            if (kind === 'subquestions') {
                return `<fieldset class="exam-structured-editor exam-structured-editor--subquestions" data-structured-kind="subquestions">
                    <legend>${heading}</legend>
                    <p class="exam-structured-editor__description">${description}</p>
                    <div class="exam-structured-editor__parts">
                        ${parts.map((part, partIndex) => {
                            const label = part?.label || defaultLabel(partIndex);
                            const options = Array.isArray(part?.options) ? part.options : [];
                            const optionCount = Math.max(4, options.length);
                            return `<article class="exam-structured-part" data-structured-part="${partIndex}">
                                <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Nhãn ý</span>
                                    <input type="text" id="add-e-q-structured-label-${index}-${partIndex}" class="form-input" value="${esc(label)}">
                                </label>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Nội dung câu con</span>
                                    <textarea id="add-e-q-structured-prompt-${index}-${partIndex}" class="form-input" placeholder="Nhập nội dung câu con">${esc(part?.prompt ?? part?.text ?? '')}</textarea>
                                </label>
                                <div class="exam-structured-options">
                                    <span class="exam-structured-options__title">Các lựa chọn của ý này</span>
                                    <div class="exam-structured-options__grid">
                                        ${Array.from({ length: optionCount }, (_, optionIndex) => `<label class="exam-structured-option-field"><span>Lựa chọn ${optionIndex + 1}</span><input type="text" id="add-e-q-structured-option-${index}-${partIndex}-${optionIndex}" class="form-input exam-structured-option" value="${esc(options[optionIndex] ?? '')}" placeholder="Lựa chọn ${optionIndex + 1}"></label>`).join('')}
                                    </div>
                                </div>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Đáp án đúng của ý</span>
                                    <input type="text" id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input" value="${esc(part?.answer ?? part?.ans ?? '')}" placeholder="Nhập đáp án đúng">
                                </label>
                            </article>`;
                        }).join('')}
                    </div>
                </fieldset>`;
            }

            if (kind === 'angleItems') {
                const defaultOptions = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'];
                return `<fieldset class="exam-structured-editor exam-structured-editor--angle-items" data-structured-kind="angleItems">
                    <legend>${heading}</legend>
                    <p class="exam-structured-editor__description">${description}</p>
                    <div class="exam-structured-editor__parts">
                        ${parts.map((part, partIndex) => {
                            const label = part?.label || defaultLabel(partIndex);
                            const currentAnswer = String(part?.type ?? part?.answer ?? '').trim();
                            const options = [...new Set([
                                ...(Array.isArray(question.options) ? question.options : []),
                                ...defaultOptions,
                                currentAnswer
                            ].filter(Boolean))];
                            const visual = safeSvgPreview(part?.svg);
                            return `<article class="exam-structured-part exam-structured-part--angle-item" data-structured-part="${partIndex}">
                                <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                                <div class="exam-structured-visual" aria-label="Hình minh họa ý ${esc(label)}">${visual || '<span class="exam-structured-visual__empty">Chưa có hình minh họa</span>'}</div>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Nhãn ý</span>
                                    <input type="text" id="add-e-q-structured-label-${index}-${partIndex}" class="form-input" value="${esc(label)}">
                                </label>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Đáp án ý ${esc(label)}</span>
                                    <select id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input">
                                        ${options.map(option => `<option value="${esc(option)}" ${option === currentAnswer ? 'selected' : ''}>${esc(option)}</option>`).join('')}
                                    </select>
                                </label>
                            </article>`;
                        }).join('')}
                    </div>
                </fieldset>`;
            }

            if (kind === 'angleCountRows') {
                const answers = String(question.ans || '').split(/[|,]/).map(value => value.trim());
                const visual = safeSvgPreview(question.angleVisual);
                return `<fieldset class="exam-structured-editor exam-structured-editor--angle-count" data-structured-kind="angleCountRows">
                    <legend>${heading}</legend>
                    <p class="exam-structured-editor__description">${description}</p>
                    ${visual ? `<div class="exam-structured-visual exam-structured-visual--shared" aria-label="Hình minh họa đếm góc">${visual}</div>` : ''}
                    <div class="exam-structured-editor__parts">
                        ${parts.map((part, partIndex) => {
                            const label = part?.label || defaultLabel(partIndex);
                            return `<article class="exam-structured-part" data-structured-part="${partIndex}">
                                <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Nhãn ý</span>
                                    <input type="text" id="add-e-q-structured-label-${index}-${partIndex}" class="form-input" value="${esc(label)}">
                                </label>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Loại góc</span>
                                    <input type="text" id="add-e-q-structured-text-${index}-${partIndex}" class="form-input" value="${esc(part?.text || '')}" placeholder="Ví dụ: góc nhọn">
                                </label>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Số lượng đúng của ý ${esc(label)}</span>
                                    <input type="text" inputmode="numeric" id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input" value="${esc(answers[partIndex] || '')}" placeholder="Nhập số lượng">
                                </label>
                            </article>`;
                        }).join('')}
                    </div>
                </fieldset>`;
            }

            if (kind === 'sequenceRounds') {
                const answers = String(question.ans || '').split(/[|,]/).map(value => value.trim()).filter(Boolean);
                let answerOffset = 0;
                return `<fieldset class="exam-structured-editor exam-structured-editor--sequence-rounds" data-structured-kind="sequenceRounds">
                    <legend>${heading}</legend>
                    <p class="exam-structured-editor__description">${description}</p>
                    <div class="exam-structured-editor__parts">
                        ${parts.slice(0, 4).map((part, partIndex) => {
                            const label = part?.label || defaultLabel(partIndex);
                            const answerCount = Number(question.partAnswerCounts?.[partIndex]) || part?.blankIndexes?.length || 1;
                            const roundAnswers = Array.isArray(part?.answers) && part.answers.length
                                ? part.answers
                                : answers.slice(answerOffset, answerOffset + answerCount);
                            answerOffset += answerCount;
                            const display = part?.display || (Array.isArray(part?.sequence)
                                ? part.sequence.map((value, termIndex) => part.blankIndexes?.includes(termIndex) ? '___' : app.data.formatMathNumber(value)).join(', ')
                                : '');
                            return `<article class="exam-structured-part" data-structured-part="${partIndex}">
                                <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Nội dung dãy ${esc(label)}</span>
                                    <textarea id="add-e-q-structured-display-${index}-${partIndex}" class="form-input" placeholder="Ví dụ: 12, ___, 22, ___, 32">${esc(display)}</textarea>
                                </label>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Đáp án của ý ${esc(label)}</span>
                                    <input type="text" id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input" value="${esc(roundAnswers.join(', '))}" placeholder="Nhập đáp án; nhiều ô cách nhau bằng dấu phẩy">
                                </label>
                            </article>`;
                        }).join('')}
                    </div>
                </fieldset>`;
            }

            if (kind === 'answerParts') {
                const answers = String(question.ans || '').split(/[|,]/).map(value => value.trim());
                return `<fieldset class="exam-structured-editor exam-structured-editor--answer-parts" data-structured-kind="answerParts">
                    <legend>${heading}</legend>
                    <p class="exam-structured-editor__description">${description}</p>
                    <div class="exam-structured-editor__parts">
                        ${parts.slice(0, 4).map((part, partIndex) => {
                            const label = part?.label || defaultLabel(partIndex);
                            return `<article class="exam-structured-part" data-structured-part="${partIndex}">
                                <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Nội dung ý ${esc(label)}</span>
                                    <textarea id="add-e-q-structured-display-${index}-${partIndex}" class="form-input" placeholder="Nhập nội dung ý">${esc(part?.display || '')}</textarea>
                                </label>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Đáp án ý ${esc(label)}</span>
                                    <input type="text" id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input" value="${esc(answers[partIndex] || '')}" placeholder="Nhập đáp án đúng">
                                </label>
                            </article>`;
                        }).join('')}
                    </div>
                </fieldset>`;
            }

            if (kind === 'practiceRows') {
                return `<fieldset class="exam-structured-editor exam-structured-editor--practice-rows" data-structured-kind="practiceRows">
                    <legend>${heading}</legend>
                    <p class="exam-structured-editor__description">${description}</p>
                    <div class="exam-structured-editor__parts">
                        ${parts.map((part, partIndex) => {
                            const label = part?.label || defaultLabel(partIndex);
                            const display = part?.expression ?? part?.display ?? part?.text ?? part?.prompt ?? '';
                            const answerCount = Number(question.partAnswerCounts?.[partIndex]) || 1;
                            const answerValue = Array.isArray(part?.answers)
                                ? part.answers.join(', ')
                                : String(part?.answer ?? '');
                            return `<article class="exam-structured-part" data-structured-part="${partIndex}">
                                <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                                <label class="exam-form-field exam-structured-part__field exam-structured-part__field--full">
                                    <span>Nội dung ý ${esc(label)}</span>
                                    <textarea id="add-e-q-structured-display-${index}-${partIndex}" class="form-input" placeholder="Nhập phép tính hoặc nội dung ý">${esc(display)}</textarea>
                                </label>
                                <label class="exam-form-field exam-structured-part__field">
                                    <span>Đáp án ý ${esc(label)}${answerCount > 1 ? ' (cách nhau bằng dấu phẩy)' : ''}</span>
                                    <input type="text" id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input" value="${esc(answerValue)}" placeholder="${answerCount > 1 ? 'Nhập các đáp án theo thứ tự' : 'Nhập đáp án đúng'}">
                                </label>
                            </article>`;
                        }).join('')}
                    </div>
                </fieldset>`;
            }

            return `<fieldset class="exam-structured-editor exam-structured-editor--comparison-rows" data-structured-kind="comparisonRows">
                <legend>${heading}</legend>
                <p class="exam-structured-editor__description">${description}</p>
                <div class="exam-structured-editor__parts">
                    ${parts.map((part, partIndex) => {
                        const label = part?.label || defaultLabel(partIndex);
                        const answer = String(part?.answer ?? '').trim();
                        return `<article class="exam-structured-part" data-structured-part="${partIndex}">
                            <div class="exam-structured-part__heading"><span class="exam-structured-part__number">${partIndex + 1}</span><strong>Ý ${esc(label)}</strong></div>
                            <label class="exam-form-field exam-structured-part__field">
                                <span>Vế trái</span>
                                <input type="text" id="add-e-q-structured-left-${index}-${partIndex}" class="form-input" value="${esc(part?.leftText ?? '')}">
                            </label>
                            <label class="exam-form-field exam-structured-part__field">
                                <span>Vế phải</span>
                                <input type="text" id="add-e-q-structured-right-${index}-${partIndex}" class="form-input" value="${esc(part?.rightText ?? '')}">
                            </label>
                            <label class="exam-form-field exam-structured-part__field">
                                <span>Dấu đúng</span>
                                <select id="add-e-q-structured-answer-${index}-${partIndex}" class="form-input">
                                    <option value=">" ${answer === '>' ? 'selected' : ''}>&gt;</option>
                                    <option value="&lt;" ${answer === '<' ? 'selected' : ''}>&lt;</option>
                                    <option value="=" ${answer === '=' ? 'selected' : ''}>=</option>
                                </select>
                            </label>
                        </article>`;
                    }).join('')}
                </div>
            </fieldset>`;
        },
        readExamQuestionStructure(question, index) {
            const kind = this.getExamQuestionStructureKind(question);
            if (!kind) return {};
            const valueOf = id => document.getElementById(id)?.value.trim() ?? '';
            const defaultLabel = (partIndex, uppercase = false) => String.fromCharCode((uppercase ? 65 : 97) + partIndex);
            const splitAnswers = value => String(value || '').split(/[|,]/).map(item => item.trim()).filter(Boolean);

            if (kind === 'statements') {
                const statements = question.statements.map((part, partIndex) => ({
                    ...part,
                    label: valueOf(`add-e-q-structured-label-${index}-${partIndex}`) || part.label || defaultLabel(partIndex, true),
                    text: valueOf(`add-e-q-structured-text-${index}-${partIndex}`),
                    answer: valueOf(`add-e-q-structured-answer-${index}-${partIndex}`)
                }));
                return { statements, ans: statements.map(part => part.answer).filter(Boolean).join(', ') };
            }

            if (kind === 'subquestions') {
                const subquestions = question.subquestions.map((part, partIndex) => {
                    const options = Array.from({ length: Math.max(4, Array.isArray(part?.options) ? part.options.length : 0) }, (_, optionIndex) => valueOf(`add-e-q-structured-option-${index}-${partIndex}-${optionIndex}`)).filter(Boolean);
                    return {
                        ...part,
                        label: valueOf(`add-e-q-structured-label-${index}-${partIndex}`) || part.label || defaultLabel(partIndex),
                        prompt: valueOf(`add-e-q-structured-prompt-${index}-${partIndex}`),
                        options,
                        answer: valueOf(`add-e-q-structured-answer-${index}-${partIndex}`)
                    };
                });
                return { subquestions, ans: subquestions.map(part => part.answer).filter(Boolean).join(', ') };
            }

            if (kind === 'sequenceRounds') {
                const originalAnswers = splitAnswers(question.ans);
                let answerOffset = 0;
                const sequenceRounds = question.sequenceRounds.slice(0, 4).map((part, partIndex) => {
                    const answerCount = Number(question.partAnswerCounts?.[partIndex]) || part?.blankIndexes?.length || 1;
                    const answerText = valueOf(`add-e-q-structured-answer-${index}-${partIndex}`);
                    const answers = splitAnswers(answerText || originalAnswers.slice(answerOffset, answerOffset + answerCount).join(', '));
                    answerOffset += answerCount;
                    return {
                        ...part,
                        label: valueOf(`add-e-q-structured-label-${index}-${partIndex}`) || part.label || defaultLabel(partIndex),
                        display: valueOf(`add-e-q-structured-display-${index}-${partIndex}`) || part.display || '',
                        answers
                    };
                });
                const partAnswerCounts = sequenceRounds.map((part, partIndex) => part.answers.length || Number(question.partAnswerCounts?.[partIndex]) || 1);
                const promptPrefix = valueOf(`add-e-q-q-${index}`).split(/<br\s*\/?\s*>/i)[0].trim();
                const q = [promptPrefix, sequenceRounds.map((part, partIndex) => `${part.label || defaultLabel(partIndex)}) ${part.display}`).join('<br>')]
                    .filter(Boolean)
                    .join('<br>');
                return { sequenceRounds, partAnswerCounts, ans: sequenceRounds.flatMap(part => part.answers).join(', '), q };
            }

            if (kind === 'answerParts') {
                const parts = Array.from({ length: 4 }, (_, partIndex) => ({
                    label: valueOf(`add-e-q-structured-label-${index}-${partIndex}`) || defaultLabel(partIndex),
                    display: valueOf(`add-e-q-structured-display-${index}-${partIndex}`),
                    answer: valueOf(`add-e-q-structured-answer-${index}-${partIndex}`)
                }));
                const promptPrefix = valueOf(`add-e-q-q-${index}`).split(/<br\s*\/?\s*>/i)[0].trim();
                const q = [promptPrefix, parts.map(part => `${part.label}) ${part.display}`).join('<br>')]
                    .filter(Boolean)
                    .join('<br>');
                return { partAnswerCounts: [1, 1, 1, 1], ans: parts.map(part => part.answer).filter(Boolean).join(', '), q };
            }

            if (kind === 'angleItems') {
                const angleItems = question.angleItems.map((part, partIndex) => {
                    const answer = valueOf(`add-e-q-structured-answer-${index}-${partIndex}`) || part.type || part.answer || '';
                    const nextPart = {
                        ...part,
                        label: valueOf(`add-e-q-structured-label-${index}-${partIndex}`) || part.label || defaultLabel(partIndex),
                        type: answer
                    };
                    if (Object.prototype.hasOwnProperty.call(part, 'answer')) nextPart.answer = answer;
                    return nextPart;
                });
                return { angleItems, ans: angleItems.map(part => part.type).filter(Boolean).join(', ') };
            }

            if (kind === 'angleCountRows') {
                const originalAnswers = String(question.ans || '').split(/[|,]/).map(value => value.trim());
                const angleCountRows = question.angleCountRows.map((part, partIndex) => ({
                    ...part,
                    label: valueOf(`add-e-q-structured-label-${index}-${partIndex}`) || part.label || defaultLabel(partIndex),
                    text: valueOf(`add-e-q-structured-text-${index}-${partIndex}`) || part.text || ''
                }));
                const answers = question.angleCountRows.map((_, partIndex) => valueOf(`add-e-q-structured-answer-${index}-${partIndex}`) || originalAnswers[partIndex] || '');
                return { angleCountRows, ans: answers.filter(Boolean).join(', ') };
            }

            if (kind === 'practiceRows') {
                const sourceRows = question.practiceRows || question.subquestions || [];
                const practiceRows = sourceRows.map((part, partIndex) => {
                    const display = valueOf(`add-e-q-structured-display-${index}-${partIndex}`);
                    const answerText = valueOf(`add-e-q-structured-answer-${index}-${partIndex}`);
                    const nextPart = {
                        ...part,
                        label: part.label || defaultLabel(partIndex),
                        answer: answerText
                    };
                    if (Number(question.partAnswerCounts?.[partIndex]) > 1) nextPart.answers = splitAnswers(answerText);
                    if (Object.prototype.hasOwnProperty.call(part, 'expression')) nextPart.expression = display;
                    if (Object.prototype.hasOwnProperty.call(part, 'display')) nextPart.display = display;
                    if (Object.prototype.hasOwnProperty.call(part, 'text')) nextPart.text = display;
                    if (Object.prototype.hasOwnProperty.call(part, 'prompt')) nextPart.prompt = display;
                    if (!['expression', 'display', 'text', 'prompt'].some(key => Object.prototype.hasOwnProperty.call(part, key))) nextPart.display = display;
                    return nextPart;
                });
                const ans = practiceRows.flatMap((part, partIndex) => Number(question.partAnswerCounts?.[partIndex]) > 1 ? splitAnswers(part.answer) : [part.answer]).filter(Boolean).join(', ');
                const promptPrefix = valueOf(`add-e-q-q-${index}`).split(/<br\s*\/?\s*>/i)[0].trim();
                const q = [promptPrefix, practiceRows.map((part, partIndex) => `${part.label || defaultLabel(partIndex)}) ${part.expression ?? part.display ?? part.text ?? part.prompt ?? ''}`).join('<br>')]
                    .filter(Boolean)
                    .join('<br>');
                return { practiceRows, ans, q };
            }

            const comparisonRows = question.comparisonRows.map((part, partIndex) => {
                const leftText = valueOf(`add-e-q-structured-left-${index}-${partIndex}`);
                const rightText = valueOf(`add-e-q-structured-right-${index}-${partIndex}`);
                const answer = valueOf(`add-e-q-structured-answer-${index}-${partIndex}`);
                return { ...part, label: part.label || defaultLabel(partIndex), leftText, rightText, display: `${leftText} ___ ${rightText}`, answer };
            });
            const promptPrefix = valueOf(`add-e-q-q-${index}`).split(/<br\s*\/?\s*>/i)[0].trim();
            const q = [promptPrefix, comparisonRows.map((part, partIndex) => `${part.label || defaultLabel(partIndex)}) ${part.display}`).join('<br>')]
                .filter(Boolean)
                .join('<br>');
            return { comparisonRows, ans: comparisonRows.map(part => part.answer).filter(Boolean).join(', '), q };
        },
        openAdmin() {
            if (app.data.currentUser?.role?.toLowerCase() !== 'admin') return;
            document.getElementById('admin-compose-screen')?.classList.remove('active');
            const modal = document.getElementById('treasure-modal');
            modal.style.display = 'flex';
            modal.classList.add('active');
            document.getElementById('treasure-title').textContent = 'Cài Đặt Hệ Thống';
            this.switchTab('players');
        },
        switchTab(tab) {
            const module = tab;
            const composerModules = module === 'templates' || module === 'questions' || module === 'exams';
            if (composerModules && this.isAdminUser()) {
                return this.openComposerModule(module);
            }
            document.getElementById('treasure-modal')?.classList.remove('team-board-fullscreen');
            const tabs = [
                { id: 'players', label: 'Quản Lý Học Sinh' },
                { id: 'settings', label: 'Điều chỉnh' },
                { id: 'quests', label: 'Quản lý Nhiệm vụ' }
            ];
            app.ui.renderTabs(tabs, tab, 'app.admin.switchTab');

            const box = document.getElementById('treasure-content-area');
            if (tab === 'templates') this.renderTemplates(box);
            else if (tab === 'questions') this.renderQuestions(box);
            else if (tab === 'exams') this.renderExams(box);
            else if (tab === 'players') this.renderPlayers(box);
            else if (tab === 'settings') this.renderSettings(box);
            else if (tab === 'quests') this.renderQuests(box);
        },
        switchQuestMode(mode) {
            this.questMode = mode === 'team' ? 'team' : 'personal';
            this.renderQuests(document.getElementById('treasure-content-area'));
        },
        renderQuests(box) {
            if (!box) return;
            const mode = this.questMode === 'team' ? 'team' : 'personal';
            box.innerHTML = `
                <section class="quest-workspace" aria-label="Quản lý nhiệm vụ">
                    <div class="quest-workspace-tabs" role="tablist" aria-label="Loại nhiệm vụ">
                        <button type="button" class="quest-workspace-tab ${mode === 'personal' ? 'active' : ''}" role="tab" aria-selected="${mode === 'personal'}" onclick="app.admin.switchQuestMode('personal')">Cá nhân</button>
                        <button type="button" class="quest-workspace-tab ${mode === 'team' ? 'active' : ''}" role="tab" aria-selected="${mode === 'team'}" onclick="app.admin.switchQuestMode('team')">Nhóm</button>
                    </div>
                    <div id="admin-quest-subarea" class="quest-workspace-content"></div>
                </section>`;
            const subarea = document.getElementById('admin-quest-subarea');
            if (mode === 'team') this.renderTeamCompetitions(subarea);
            else this.renderPersonalQuests(subarea);
        },
        renderPersonalQuests(box) {
            const quests = app.data.quests || [];
            if (quests.length === 0) {
                box.innerHTML = `<div class="quest-empty-state">
                    ${app.ui.compactAction('+ Tạo mới', 'app.admin.showAddQuestForm()', 'compact-admin-action--create')}
                    <p>Chưa có nhiệm vụ nào được tạo.</p>
                </div>`;
                return;
            }
            let html = `<div class="utility-actions utility-actions--center">
          ${app.ui.compactAction('+ Tạo mới', 'app.admin.showAddQuestForm()', 'compact-admin-action--create')}
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

            html += app.ui.renderTable(cols, quests, (q, i) => {
                const status = q.is_active ? '<span style="color:#16a34a; font-weight:bold;">Đang chạy</span>' : '<span style="color:#dc2626; font-weight:bold;">Tạm dừng</span>';
                let target = q.target_subject === 'any' ? 'Bất kỳ' : (q.target_subject === 'math' ? 'Toán' : 'Tiếng Việt');
                target += ` (>= ${q.target_score}đ)`;
                if (q.exam_id) {
                    const exam = app.data.exams.find(item => item.id === q.exam_id);
                    target = `Đề: ${app.data.sanitizeHTML(exam?.name || 'Đã xóa')}`;
                }
                const curriculumLabel = this.getQuestCurriculumLabel(q);
                if (curriculumLabel) target += `<br><small>Phạm vi: ${app.data.sanitizeHTML(curriculumLabel)}</small>`;

                let assign = 'Toàn trường';
                if (q.assign_type === 'class') assign = `Lớp ${q.assign_target}`;
                if (q.assign_type === 'user') assign = `HS: ${q.assign_target}`;

                return `<tr>
              <td>${app.data.sanitizeHTML(q.title)}</td>
              <td>${target}</td>
              <td>${q.target_count}</td>
              <td>${q.reward_stars} ⭐</td>
              <td>${assign}</td>
              <td>${status}</td>
              <td>
                  <button class="action-btn btn-danger" onclick="app.admin.toggleQuest(${i})">${q.is_active ? 'Dừng' : 'Bật'}</button>
                  ${app.ui.compactAction('Xóa', `app.admin.deleteQuest(${i})`, 'compact-admin-action--delete')}
              </td>
          </tr>`;
            }, "Chưa có nhiệm vụ nào được tạo.");

            box.innerHTML = html;
        },
        getTeamCompetitionStudents(classlevel, className = '') {
            const cls = String(classlevel || '').replace(/^Lớp\s*/i, '').trim();
            const section = String(className || '').trim();
            return (app.data.users || []).filter(user => {
                if (String(user.role || '').toLowerCase() === 'admin' || user.approved === false) return false;
                if (cls && String(user.classlevel || '').replace(/^Lớp\s*/i, '').trim() !== cls) return false;
                return !section || String(user.class_name || '').trim() === section;
            });
        },
        getTeamCompetitionClassNames(classlevel) {
            return Array.from(new Set(this.getTeamCompetitionStudents(classlevel)
                .map(user => String(user.class_name || '').trim()).filter(Boolean)))
                .sort((left, right) => left.localeCompare(right, 'vi'));
        },
        getTeamCompetitionExams(classlevel) {
            const cls = String(classlevel || '').replace(/^Lớp\s*/i, '').trim();
            return (app.data.exams || []).filter(exam => {
                if (cls && String(exam.classlevel || '').replace(/^Lớp\s*/i, '').trim() !== cls) return false;
                return Array.isArray(exam.questions) && exam.questions.length > 0;
            });
        },
        switchTeamCompetitionMode() {
            this.syncTeamCompetitionDraftFromDom();
            const draft = this.teamCompetitionDraft || {};
            const mode = document.getElementById('team-comp-mode')?.value || draft.participantMode || 'manual';
            const count = Number(document.getElementById('team-comp-team-count')?.value || draft.teamCount || 2);
            const students = this.getTeamCompetitionStudents(document.getElementById('team-comp-class')?.value || draft.classlevel || '5', document.getElementById('team-comp-class-name')?.value || draft.className || '');
            draft.participantMode = mode;
            draft.teamCount = Number.isInteger(count) && count > 1 ? count : 2;
            if (mode === 'random') {
                try {
                    draft.teams = app.teamCompetition.buildTeams({ students, teamCount: draft.teamCount, participantMode: 'random' });
                } catch (_) {
                    draft.teams = Array.from({ length: draft.teamCount }, (_, index) => ({ id: `team-${index + 1}`, name: `Nhóm ${index + 1}`, memberUsernames: [], leaderUsername: '', examId: null }));
                }
            } else {
                const previous = Array.isArray(draft.teams) ? draft.teams : [];
                const validStudents = new Set(students.map(student => String(student.username)));
                draft.teams = Array.from({ length: draft.teamCount }, (_, index) => {
                    const source = previous[index] || ({ id: `team-${index + 1}`, name: `Nhóm ${index + 1}`, memberUsernames: [], leaderUsername: '', examId: null });
                    const members = (source.memberUsernames || []).filter(username => validStudents.has(String(username)));
                    return { ...source, memberUsernames: members, leaderUsername: members.includes(source.leaderUsername) ? source.leaderUsername : '' };
                });
            }
            draft.selectedStudentUsernames = draft.teams.flatMap(team => team.memberUsernames || []);
            this.teamCompetitionDraft = draft;
            this.renderTeamCompetitionForm();
        },
        randomizeTeamCompetition() {
            this.syncTeamCompetitionDraftFromDom();
            const draft = this.teamCompetitionDraft || {};
            const students = this.getTeamCompetitionStudents(draft.classlevel || '5', draft.className || '');
            try {
                draft.participantMode = 'random';
                const teamCount = Number(draft.teamCount || 2);
                const requestedQuotas = (draft.teams || []).map(team => Number(team.targetMemberCount)).filter(Number.isInteger);
                const quotas = requestedQuotas.length === teamCount && requestedQuotas.every(size => size > 0) && requestedQuotas.reduce((sum, size) => sum + size, 0) === students.length ? requestedQuotas : undefined;
                draft.teams = app.teamCompetition.buildTeams({ students, teamCount, participantMode: 'random', quotas, teams: draft.teams });
                draft.selectedStudentUsernames = draft.teams.flatMap(team => team.memberUsernames || []);
                this.teamCompetitionDraft = draft;
                this.renderTeamCompetitionForm();
            } catch (exception) {
                alert(exception.message || 'Không thể chọn ngẫu nhiên học sinh.');
            }
        },
        getReservedTeamMemberUsernames(teams, activeIndex) {
            const reserved = new Set();
            (teams || []).forEach((team, index) => {
                if (index === activeIndex) return;
                const snapshot = team?.memberSelectionSnapshot?.memberUsernames;
                const hasSnapshot = Array.isArray(snapshot) && snapshot.length > 0;
                const members = team?.memberSelectionState === 'saved'
                    ? (hasSnapshot ? snapshot : (team?.memberUsernames || []))
                    : (hasSnapshot ? snapshot : []);
                members.forEach(username => reserved.add(String(username)));
            });
            return reserved;
        },
        updateTeamMemberSlots(index) {
            const draft = this.collectTeamCompetitionForm();
            const team = draft.teams[index];
            if (!team) return;
            const count = Number(team.targetMemberCount);
            if (Number.isInteger(count) && count > 0) {
                team.memberUsernames = team.memberUsernames.slice(0, count);
                if (!team.memberUsernames.includes(team.leaderUsername)) team.leaderUsername = '';
            } else {
                team.memberUsernames = [];
                team.leaderUsername = '';
            }
            this.teamCompetitionDraft = draft;
            this.renderTeamCompetitionForm();
        },
        changeTeamMemberSlot(index) {
            const draft = this.collectTeamCompetitionForm();
            const team = draft.teams[index];
            if (!team) return;
            if (!team.memberUsernames.includes(team.leaderUsername)) team.leaderUsername = '';
            this.teamCompetitionDraft = draft;
            this.renderTeamCompetitionForm();
        },
        saveTeamMembers(index) {
            const draft = this.collectTeamCompetitionForm();
            const team = draft.teams[index];
            if (!team) return;
            const targetCount = Number(team.targetMemberCount);
            if (!Number.isInteger(targetCount) || targetCount < 1) return alert('Hãy nhập số thành viên trong nhóm.');
            if (team.memberUsernames.length !== targetCount) return alert(`Nhóm ${index + 1} cần chọn đủ ${targetCount} thành viên trước khi lưu.`);
            if (new Set(team.memberUsernames).size !== team.memberUsernames.length) return alert('Một học sinh chỉ được chọn một lần trong nhóm.');
            if (!team.memberUsernames.includes(team.leaderUsername)) return alert('Hãy chọn trưởng nhóm từ danh sách thành viên của nhóm.');
            const reserved = this.getReservedTeamMemberUsernames(draft.teams, index);
            if (team.memberUsernames.some(username => reserved.has(String(username)))) return alert('Có học sinh đã thuộc một nhóm đã lưu. Hãy chọn học sinh khác.');
            team.memberSelectionState = 'saved';
            team.memberSelectionSnapshot = { memberUsernames: [...team.memberUsernames], leaderUsername: team.leaderUsername };
            this.teamCompetitionDraft = draft;
            this.renderTeamCompetitionForm();
        },
        editTeamMembers(index) {
            const draft = this.collectTeamCompetitionForm();
            const team = draft.teams[index];
            if (!team) return;
            team.memberSelectionState = 'editing';
            team.memberSelectionSnapshot = team.memberSelectionSnapshot?.memberUsernames?.length
                ? team.memberSelectionSnapshot
                : { memberUsernames: [...team.memberUsernames], leaderUsername: team.leaderUsername };
            this.teamCompetitionDraft = draft;
            this.renderTeamCompetitionForm();
        },
        cancelTeamMemberEdit(index) {
            const draft = this.collectTeamCompetitionForm();
            const team = draft.teams[index];
            const snapshot = team?.memberSelectionSnapshot;
            if (!team || !snapshot?.memberUsernames?.length) return;
            team.memberUsernames = [...snapshot.memberUsernames];
            team.leaderUsername = snapshot.leaderUsername || '';
            team.memberSelectionState = 'saved';
            this.teamCompetitionDraft = draft;
            this.renderTeamCompetitionForm();
        },
        syncTeamCompetitionDraftFromDom() {
            if (!this.teamCompetitionDraft || !document.getElementById('team-comp-name')) return;
            try { this.teamCompetitionDraft = this.collectTeamCompetitionForm(); } catch (_) { /* form may be mid-render */ }
        },
        collectTeamCompetitionForm() {
            const draft = this.teamCompetitionDraft || {};
            const classlevel = document.getElementById('team-comp-class')?.value || draft.classlevel || '5';
            const className = document.getElementById('team-comp-class-name')?.value || draft.className || '';
            const teamCount = Number(document.getElementById('team-comp-team-count')?.value || draft.teamCount || 2);
            const mode = document.getElementById('team-comp-mode')?.value || draft.participantMode || 'manual';
            const teamCards = Array.from(document.querySelectorAll('#team-comp-teams .team-config-card'));
            const teams = teamCards.map((card, index) => {
                const memberSlots = Array.from(card.querySelectorAll('.team-member-slot-select'));
                const members = memberSlots.length
                    ? memberSlots.map(select => select.value).filter(Boolean)
                    : (draft.teams?.[index]?.memberUsernames || []);
                return {
                    id: card.dataset.teamId || draft.teams?.[index]?.id || `team-${index + 1}`,
                    name: card.querySelector('.team-name-input')?.value.trim() || `Nhóm ${index + 1}`,
                    memberUsernames: Array.from(new Set(members.filter(Boolean))),
                    leaderUsername: card.querySelector('.team-leader-select')?.value || '',
                    examId: card.querySelector('.team-exam-select')?.value || draft.teams?.[index]?.examId || null,
                    targetMemberCount: card.querySelector('.team-target-count')?.value ? Number(card.querySelector('.team-target-count').value) : null,
                    memberSelectionState: card.dataset.memberSelectionState || draft.teams?.[index]?.memberSelectionState || 'editing',
                    memberSelectionSnapshot: draft.teams?.[index]?.memberSelectionSnapshot || { memberUsernames: [], leaderUsername: '' }
                };
            });
            const hasTimer = Boolean(document.getElementById('team-comp-has-timer')?.checked);
            const minutes = Number(document.getElementById('team-comp-time')?.value || 0);
            const questionMode = document.getElementById('team-comp-question-mode')?.value || draft.questionMode || 'same';
            return app.teamCompetition.normalizeCompetition({
                ...draft,
                name: document.getElementById('team-comp-name')?.value.trim() || '',
                classlevel,
                className,
                participantMode: mode,
                teamCount: Number.isInteger(teamCount) ? teamCount : 2,
                teams,
                selectedStudentUsernames: teams.flatMap(team => team.memberUsernames),
                questionMode,
                commonExamId: document.getElementById('team-comp-common-exam')?.value || draft.commonExamId || null,
                timeLimitMinutes: hasTimer && Number.isInteger(minutes) && minutes > 0 ? minutes : null,
                status: draft.status || app.teamCompetition.STATUS.DRAFT
            });
        },
        renderTeamCompetitionForm(editId = null) {
            if (!app.teamCompetition) return;
            if (editId) this.teamCompetitionDraft = app.teamCompetition.store.get(editId);
            if (!this.teamCompetitionDraft) {
                this.teamCompetitionDraft = app.teamCompetition.normalizeCompetition({
                    name: '', classlevel: '5', participantMode: 'manual', teamCount: 2,
                    teams: [
                        { id: 'team-1', name: 'Nhóm 1', memberUsernames: [], leaderUsername: '' },
                        { id: 'team-2', name: 'Nhóm 2', memberUsernames: [], leaderUsername: '' }
                    ], questionMode: 'same', timeLimitMinutes: null, status: app.teamCompetition.STATUS.DRAFT
                });
            }
            const draft = this.teamCompetitionDraft;
            const box = document.getElementById('treasure-content-area');
            if (!box) return;
            const classlevel = draft.classlevel || '5';
            const classNames = this.getTeamCompetitionClassNames(classlevel);
            const className = draft.className || '';
            const students = this.getTeamCompetitionStudents(classlevel, className);
            const exams = this.getTeamCompetitionExams(classlevel);
            const teamCount = Math.max(2, Number(draft.teamCount || draft.teams?.length || 2));
            const teams = Array.from({ length: teamCount }, (_, index) => draft.teams?.[index] || ({ id: `team-${index + 1}`, name: `Nhóm ${index + 1}`, memberUsernames: [], leaderUsername: '', examId: null }));
            draft.teamCount = teamCount;
            draft.teams = teams;
            const esc = value => app.data.sanitizeHTML(value ?? '');
            const classOptions = [1, 2, 3, 4, 5].map(level => `<option value="${level}" ${String(level) === String(classlevel) ? 'selected' : ''}>Lớp ${level}</option>`).join('');
            const classNameOptions = [`<option value="">Tất cả học sinh Lớp ${esc(classlevel)}</option>`, ...classNames.map(name => `<option value="${esc(name)}" ${name === className ? 'selected' : ''}>Lớp ${esc(name)}</option>`)].join('');
            const examOptions = exams.map(exam => `<option value="${app.data.sanitizeHTML(exam.id)}">${esc(`${exam.subject || ''} · ${exam.period || ''} · ${exam.name || 'Đề'} (${exam.questions.length} câu)` )}</option>`).join('');
            const teamCards = teams.map((team, index) => {
                const targetCount = Number.isInteger(Number(team.targetMemberCount)) && Number(team.targetMemberCount) > 0
                    ? Number(team.targetMemberCount)
                    : ((team.memberUsernames || []).length || null);
                const selectedMembers = (team.memberUsernames || []).slice(0, targetCount || 0);
                const selectionState = team.memberSelectionState === 'saved' ? 'saved' : 'editing';
                const isSaved = selectionState === 'saved';
                const reservedMembers = this.getReservedTeamMemberUsernames(teams, index);
                const studentLabel = student => `${student.fullname || student.username}${student.class_name ? ` · ${student.class_name}` : ''} (${student.username})`;
                const memberSlots = targetCount
                    ? Array.from({ length: targetCount }, (_, slotIndex) => {
                        const selectedUsername = String(selectedMembers[slotIndex] || '');
                        const selectedInOtherSlots = new Set(selectedMembers.filter((username, selectedIndex) => selectedIndex !== slotIndex).map(String));
                        const options = students.filter(student => {
                            const username = String(student.username);
                            return username === selectedUsername || (!reservedMembers.has(username) && !selectedInOtherSlots.has(username));
                        }).map(student => `<option value="${esc(student.username)}" ${selectedUsername === String(student.username) ? 'selected' : ''}>${esc(studentLabel(student))}</option>`).join('');
                        return `<label class="team-member-slot-label">Thành viên ${slotIndex + 1}<select class="form-input team-member-slot-select" ${isSaved || draft.participantMode === 'random' ? 'disabled' : ''} onchange="app.admin.changeTeamMemberSlot(${index})"><option value="">-- Chọn học sinh --</option>${options}</select></label>`;
                    }).join('')
                    : '<p class="team-member-selection-hint">Nhập số thành viên trong nhóm để hiện các ô chọn học sinh.</p>';
                const leaderOptions = students.filter(student => selectedMembers.includes(String(student.username))).map(student => `<option value="${esc(student.username)}" ${String(team.leaderUsername) === String(student.username) ? 'selected' : ''}>${esc(studentLabel(student))}</option>`).join('');
                const perTeamExamOptions = exams.map(exam => `<option value="${esc(exam.id)}" ${String(team.examId) === String(exam.id) ? 'selected' : ''}>${esc(`${exam.subject || ''} · ${exam.period || ''} · ${exam.name || 'Đề'} (${exam.questions.length} câu)` )}</option>`).join('');
                const memberNames = selectedMembers.map(username => students.find(student => String(student.username) === String(username))?.fullname || username);
                const actionButtons = isSaved
                    ? `<button type="button" class="btn-opt" onclick="app.admin.editTeamMembers(${index})">Sửa</button>`
                    : `<button type="button" class="btn-primary" onclick="app.admin.saveTeamMembers(${index})">${team.memberSelectionSnapshot?.memberUsernames?.length ? 'Cập nhật' : 'Lưu'}</button>${team.memberSelectionSnapshot?.memberUsernames?.length ? `<button type="button" class="btn-opt" onclick="app.admin.cancelTeamMemberEdit(${index})">Hủy</button>` : ''}`;
                return `<article class="team-config-card ${isSaved ? 'team-config-card--saved' : ''}" data-team-id="${esc(team.id)}" data-member-selection-state="${selectionState}">
                    <div class="team-config-card__heading"><span class="team-card-number">${index + 1}</span><input class="form-input team-name-input" value="${esc(team.name)}" aria-label="Tên nhóm ${index + 1}" placeholder="Tên nhóm" ${isSaved ? 'readonly' : ''}></div>
                    <div class="team-config-card__status" aria-live="polite">${isSaved ? `Đã lưu · ${memberNames.length}/${targetCount} thành viên` : 'Chưa lưu danh sách thành viên'}</div>
                    <label class="team-field-label">Số thành viên trong nhóm<input class="form-input team-target-count" type="number" min="1" max="${Math.max(1, students.length)}" value="${targetCount ?? ''}" placeholder="Nhập số lượng" ${isSaved ? 'disabled' : ''} onchange="app.admin.updateTeamMemberSlots(${index})"></label>
                    <div class="team-field-label">Chọn thành viên từ danh sách
                      <div class="team-member-slots">${memberSlots}</div>
                    </div>
                    <label class="team-field-label">Trưởng nhóm
                      <select class="form-input team-leader-select" ${isSaved ? 'disabled' : ''}><option value="">-- Chọn trưởng nhóm --</option>${leaderOptions}</select>
                    </label>
                    ${draft.questionMode === 'different' ? `<label class="team-field-label">Bài làm của nhóm<select class="form-input team-exam-select"><option value="">-- Chọn bộ đề --</option>${perTeamExamOptions}</select></label>` : ''}
                    <div class="team-config-card__actions">${actionButtons}</div>
                </article>`;
            }).join('');
            const memberSummary = teams.map((team, index) => {
                const members = team.memberSelectionState === 'saved' ? (team.memberUsernames || []) : [];
                const names = members.map(username => students.find(student => String(student.username) === String(username))?.fullname || username);
                return `<article class="team-membership-summary__group ${members.length ? 'team-membership-summary__group--saved' : ''}"><strong><span>${index + 1}</span>${esc(team.name || `Nhóm ${index + 1}`)}</strong><p>${members.length ? esc(names.join(' · ')) : 'Chưa lưu thành viên'}</p></article>`;
            }).join('');
            const sameExam = draft.commonExamId || exams[0]?.id || '';
            const statusLabel = app.teamCompetition.STATUS_LABELS[draft.status] || 'Nháp';
            box.innerHTML = `<section class="team-competition-form" aria-label="Soạn trận thi đua nhóm">
                <div class="team-form-toolbar"><button type="button" class="btn-opt" onclick="app.admin.switchQuestMode('team')">← Danh sách trận</button><span class="team-form-status">${statusLabel}</span></div>
                <h3>Tạo trận thi đua nhóm</h3>
                <p class="team-form-intro">Mỗi nhóm dùng chung một tablet; chỉ trưởng nhóm đăng nhập và nộp bài. Các nhóm được phép khác số lượng thành viên.</p>
                <div class="team-form-grid">
                  <label class="team-field-label">Tên trận<input id="team-comp-name" class="form-input" value="${esc(draft.name)}" placeholder="VD: Thử thách Toán nhanh"></label>
                  <label class="team-field-label">Cấp lớp<select id="team-comp-class" class="form-input" onchange="app.admin.switchTeamCompetitionMode()">${classOptions}</select></label>
                  <label class="team-field-label">Lớp<select id="team-comp-class-name" class="form-input" onchange="app.admin.switchTeamCompetitionMode()">${classNameOptions}</select></label>
                  <label class="team-field-label">Số lượng nhóm<input id="team-comp-team-count" class="form-input" type="number" min="2" max="20" value="${teamCount}" onchange="app.admin.switchTeamCompetitionMode()"></label>
                  <label class="team-field-label">Cách chọn học sinh<select id="team-comp-mode" class="form-input" onchange="app.admin.switchTeamCompetitionMode()"><option value="manual" ${draft.participantMode === 'manual' ? 'selected' : ''}>Giáo viên chỉ định (manual)</option><option value="random" ${draft.participantMode === 'random' ? 'selected' : ''}>Game chọn ngẫu nhiên (random)</option></select></label>
                </div>
                <div class="team-form-section"><div class="team-section-heading"><h4>Chọn nhóm</h4><button type="button" class="btn-opt" onclick="app.admin.randomizeTeamCompetition()">Chọn ngẫu nhiên</button></div><p class="team-form-hint">Lưu từng nhóm để thành viên của nhóm đó không còn xuất hiện trong các nhóm khác.</p><div id="team-comp-teams" class="team-config-grid">${teamCards}</div></div>
                <section class="team-membership-summary" aria-live="polite"><h4>Danh sách thành viên theo nhóm</h4><div class="team-membership-summary__grid">${memberSummary}</div></section>
                <div class="team-form-section"><h4>Bài làm</h4><div class="team-form-grid team-form-grid--compact">
                  <label class="team-field-label">Cách giao bài<select id="team-comp-question-mode" class="form-input" onchange="app.admin.syncTeamCompetitionDraftFromDom(); app.admin.renderTeamCompetitionForm()"><option value="same" ${draft.questionMode !== 'different' ? 'selected' : ''}>Một bài giống nhau cho các nhóm</option><option value="different" ${draft.questionMode === 'different' ? 'selected' : ''}>Mỗi nhóm một bài khác nhau</option></select></label>
                  ${draft.questionMode !== 'different' ? `<label class="team-field-label">Bộ đề chung<select id="team-comp-common-exam" class="form-input"><option value="">-- Chọn bộ đề --</option>${exams.map(exam => `<option value="${esc(exam.id)}" ${String(sameExam) === String(exam.id) ? 'selected' : ''}>${esc(`${exam.subject || ''} · ${exam.period || ''} · ${exam.name || 'Đề'} (${exam.questions.length} câu)` )}</option>`).join('')}</select></label>` : '<p class="team-form-hint">Chọn bộ đề riêng trong từng ô nhóm. Tất cả bộ đề phải có cùng số câu.</p>'}
                </div></div>
                <div class="team-form-section"><h4>Thời gian làm bài</h4><div class="team-timer-fields"><label><input id="team-comp-has-timer" type="checkbox" ${draft.timeLimitMinutes !== null ? 'checked' : ''} onchange="document.getElementById('team-comp-time').disabled = !this.checked"> Có thời gian</label><input id="team-comp-time" class="form-input" type="number" min="1" max="180" value="${draft.timeLimitMinutes || 15}" ${draft.timeLimitMinutes === null ? 'disabled' : ''} aria-label="Số phút làm bài"><span>phút</span><span class="team-form-hint">Bỏ chọn để không giới hạn.</span></div></div>
                <div class="team-form-actions"><button type="button" class="btn-opt" onclick="app.admin.switchQuestMode('team')">Hủy</button><button type="button" class="btn-primary" onclick="app.admin.saveTeamCompetitionDraft(false)">Lưu Nháp</button><button type="button" class="btn-success" onclick="app.admin.saveTeamCompetitionDraft(true)">Đã chuẩn bị</button></div>
            </section>`;
        },
        showAddTeamCompetitionForm(editId = null) {
            this.questMode = 'team';
            this.teamCompetitionDraft = editId ? app.teamCompetition?.store.get(editId) : null;
            this.renderTeamCompetitionForm();
        },
        async saveTeamCompetitionDraft(asPrepared = false) {
            if (!app.teamCompetition) return;
            let candidate;
            try { candidate = this.collectTeamCompetitionForm(); } catch (_) { return alert('Không đọc được biểu mẫu trận thi đua.'); }
            if (candidate.status === app.teamCompetition.STATUS.ACTIVE || candidate.status === app.teamCompetition.STATUS.ENDED) return alert('Trận đã bắt đầu hoặc kết thúc, không thể sửa cấu hình.');
            if (asPrepared) {
                try {
                    candidate = app.teamCompetition.prepareCompetition(candidate, { students: app.data.users || [], exams: app.data.exams || [], validateQuestionScoring: question => app.data.validateQuestionScoring(question) });
                } catch (exception) {
                    const messages = exception.validation?.errors?.map(item => item.message) || [exception.message];
                    return alert(`Chưa thể chuẩn bị trận:\n- ${messages.join('\n- ')}`);
                }
            } else {
                candidate.status = app.teamCompetition.STATUS.DRAFT;
            }
            const saved = app.teamCompetition.store.upsert(candidate);
            if (app.teamCompetition.remote?.flush) await app.teamCompetition.remote.flush();
            if (app.teamCompetition.remote?.getStatus?.() === 'error') {
                return alert('Không thể lưu trận thi đua lên Supabase. Bản nháp local vẫn được giữ; hãy kiểm tra kết nối/migration rồi thử lại.');
            }
            this.teamCompetitionDraft = null;
            if (asPrepared) this.openTeamCompetitionBoard(saved.id);
            else { this.questMode = 'team'; this.renderQuests(document.getElementById('treasure-content-area')); }
        },
        async deleteTeamCompetition(id) {
            if (!app.teamCompetition || !confirm('Xóa bản ghi trận thi đua này?')) return;
            app.teamCompetition.store.remove(id);
            if (app.teamCompetition.remote?.flush) await app.teamCompetition.remote.flush();
            this.renderQuests(document.getElementById('treasure-content-area'));
        },
        async prepareTeamCompetition(id) {
            const match = app.teamCompetition?.store.get(id);
            if (!match) return;
            try {
                const prepared = app.teamCompetition.prepareCompetition(match, { students: app.data.users || [], exams: app.data.exams || [], validateQuestionScoring: question => app.data.validateQuestionScoring(question) });
                app.teamCompetition.store.upsert(prepared);
                if (app.teamCompetition.remote?.flush) await app.teamCompetition.remote.flush();
                if (app.teamCompetition.remote?.getStatus?.() === 'error') throw new Error('Không thể chuẩn bị trận trên Supabase.');
                this.openTeamCompetitionBoard(prepared.id);
            } catch (exception) {
                const messages = exception.validation?.errors?.map(item => item.message) || [exception.message];
                alert(`Chưa thể chuẩn bị trận:\n- ${messages.join('\n- ')}`);
            }
        },
        renderTeamCompetitions(box) {
            if (!box || !app.teamCompetition) return;
            const competitions = app.teamCompetition.store.list();
            const remote = app.teamCompetition.remote;
            const adapterNotice = !remote?.enabled
                ? '<div class="team-local-adapter-notice">Đang chạy chế độ local/demo vì Supabase chưa được nạp. Khi đăng nhập thật, dữ liệu sẽ được đồng bộ qua migration thi đua nhóm.</div>'
                : (remote.isReady?.()
                    ? '<div class="team-remote-status-notice team-remote-status-notice--ready">Đã kết nối dữ liệu thi đua nhóm và realtime Supabase.</div>'
                    : '<div class="team-remote-status-notice team-remote-status-notice--warning">Chưa đồng bộ được backend thi đua nhóm. Kiểm tra migration/RLS và kết nối trước khi bắt đầu trận.</div>');
            let html = `<div class="team-competition-list-header"><div><h3>Thi đua theo nhóm</h3><p>Tạo trận trong lớp, chuẩn bị trước rồi trình chiếu bảng điểm cho cả lớp.</p></div><button type="button" class="btn-success" onclick="app.admin.showAddTeamCompetitionForm()">+ Tạo trận mới</button></div>${adapterNotice}`;
            if (!competitions.length) {
                box.innerHTML = html + '<div class="team-empty-state"><span aria-hidden="true">🏆</span><p>Chưa có trận thi đua nhóm nào. Bạn có thể soạn nhiều bản Nháp trước khi vào lớp.</p></div>';
                return;
            }
            html += '<div class="team-competition-list">';
            competitions.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0)).forEach(match => {
                const token = encodeURIComponent(String(match.id));
                const status = app.teamCompetition.STATUS_LABELS[match.status] || 'Nháp';
                const teamSummary = match.teams.map(team => `${app.data.sanitizeHTML(team.name)} (${team.memberUsernames.length})`).join(' · ');
                const action = match.status === app.teamCompetition.STATUS.DRAFT
                    ? `<button type="button" class="btn-opt" onclick="app.admin.showAddTeamCompetitionForm(decodeURIComponent('${token}'))">Sửa</button><button type="button" class="btn-success" onclick="app.admin.prepareTeamCompetition(decodeURIComponent('${token}'))">Đã chuẩn bị</button>`
                    : `<button type="button" class="btn-primary" onclick="app.admin.openTeamCompetitionBoard(decodeURIComponent('${token}'))">Mở bảng</button>${match.status === app.teamCompetition.STATUS.PREPARED ? `<button type="button" class="btn-opt" onclick="app.admin.showAddTeamCompetitionForm(decodeURIComponent('${token}'))">Sửa</button>` : ''}`;
                html += `<article class="team-competition-list-item"><div><h4>${app.data.sanitizeHTML(match.name || 'Trận chưa đặt tên')}</h4><p>Lớp ${app.data.sanitizeHTML(match.classlevel)}${match.className ? ` · ${app.data.sanitizeHTML(match.className)}` : ''} · ${match.teamCount} nhóm · ${match.questionMode === 'different' ? 'Bài riêng' : 'Bài chung'}</p><p class="team-competition-list-teams">${teamSummary}</p></div><div class="team-competition-list-meta"><span class="team-status-pill team-status-pill--${match.status}">${status}</span><div class="team-list-actions">${action}<button type="button" class="btn-danger" onclick="app.admin.deleteTeamCompetition(decodeURIComponent('${token}'))">Xóa</button></div></div></article>`;
            });
            box.innerHTML = html + '</div>';
        },
        openTeamCompetitionBoard(id) {
            this.questMode = 'team';
            if (this.teamCompetitionBoardTimer) { clearInterval(this.teamCompetitionBoardTimer); this.teamCompetitionBoardTimer = null; }
            const box = document.getElementById('treasure-content-area');
            const match = app.teamCompetition?.store.get(id);
            if (!box || !match) return;
            document.getElementById('treasure-modal')?.classList.add('team-board-fullscreen');
            this.renderTeamCompetitionBoard(box, match.id);
        },
        renderTeamCompetitionBoard(box, id) {
            if (this.teamCompetitionBoardTimer) { clearInterval(this.teamCompetitionBoardTimer); this.teamCompetitionBoardTimer = null; }
            const match = app.teamCompetition?.store.get(id);
            if (!box || !match) return;
            const status = app.teamCompetition.STATUS_LABELS[match.status] || 'Nháp';
            const usersByName = new Map((app.data.users || []).map(user => [String(user.username), user]));
            const token = encodeURIComponent(String(match.id));
            const isLive = match.status === app.teamCompetition.STATUS.ACTIVE;
            const cards = match.teams.map((team, index) => {
                const memberNames = team.memberUsernames.map(username => app.data.sanitizeHTML(usersByName.get(String(username))?.fullname || username));
                const score = Number(team.score || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
                const progress = Number(team.submittedCount || 0);
                const total = (() => { const exam = app.teamCompetition.getExamForTeam(match, team); return exam?.questions?.length || 0; })();
                const editAction = !isLive && match.status !== app.teamCompetition.STATUS.ENDED ? `<button type="button" class="btn-opt" onclick="app.admin.showAddTeamCompetitionForm(decodeURIComponent('${encodeURIComponent(String(match.id))}'))">Thay đổi</button>` : '';
                const rank = app.teamCompetition.getTeamRank(match, team.id);
                const elapsedSeconds = team.durationSeconds !== null
                    ? Number(team.durationSeconds)
                    : (isLive && (team.startedAt || match.startedAt) ? Math.max(0, Math.floor((Date.now() - Number(team.startedAt || match.startedAt)) / 1000)) : null);
                const elapsedLabel = elapsedSeconds === null ? '' : ` · ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
                const metaRight = isLive ? `${team.status === 'locked' ? 'Đã khóa' : (team.status === 'completed' ? 'Đã nộp' : 'Đang làm')}${elapsedLabel}` : (match.status === app.teamCompetition.STATUS.ENDED ? 'Đã kết thúc' : '');
                return `<article class="team-board-card team-board-card--${team.status || 'pending'}"><div class="team-board-card__top"><span class="team-card-number">${index + 1}</span><div><h3>${app.data.sanitizeHTML(team.name)}</h3><p>${isLive ? `${progress}/${total || '?'} câu đã nộp` : `${team.memberUsernames.length} thành viên`}</p></div><span class="team-board-score">${score}<small>/10</small></span></div><div class="team-board-card__progress"><span style="width:${total ? Math.min(100, progress / total * 100) : 0}%"></span></div><div class="team-board-card__meta"><span>${isLive || match.status === app.teamCompetition.STATUS.ENDED ? `Hạng ${rank}` : (team.status === 'locked' ? 'Đã khóa' : (team.status === 'completed' ? 'Đã nộp' : 'Sẵn sàng'))}</span><span>${metaRight}</span></div>${!isLive && match.status !== app.teamCompetition.STATUS.ENDED ? `<details class="team-board-members"><summary>Thành viên (${team.memberUsernames.length})</summary><p>${memberNames.join(', ') || 'Chưa phân công'}</p><p>Trưởng nhóm: ${app.data.sanitizeHTML(usersByName.get(String(team.leaderUsername))?.fullname || team.leaderUsername || 'Chưa chọn')}</p></details>` : ''}<div class="team-board-card__actions">${editAction}</div></article>`;
            }).join('');
            const globalAction = match.status === app.teamCompetition.STATUS.PREPARED
                ? `<button type="button" class="btn-start-massive team-board-start" onclick="app.admin.startTeamCompetition(decodeURIComponent('${token}'))">Bắt đầu thi đua</button>`
                : (isLive ? `<button type="button" class="btn-danger team-board-end" onclick="app.admin.endTeamCompetition(decodeURIComponent('${token}'))">Kết thúc trận</button>` : '');
            box.innerHTML = `<section class="team-competition-board" aria-label="Bảng thi đua nhóm"><div class="team-board-toolbar"><button type="button" class="btn-opt" onclick="app.admin.switchQuestMode('team')">← Danh sách trận</button><button type="button" class="btn-opt" onclick="app.admin.enterTeamBoardFullscreen()">⛶ Mở toàn màn hình</button><span class="team-status-pill team-status-pill--${match.status}">${status}</span></div><header class="team-board-heading"><div><p class="team-board-kicker">Thi đua theo nhóm · Lớp ${app.data.sanitizeHTML(match.classlevel)}${match.className ? ` · ${app.data.sanitizeHTML(match.className)}` : ''}</p><h2>${app.data.sanitizeHTML(match.name || 'Trận thi đua')}</h2><p>${match.teams.length} nhóm · ${match.timeLimitMinutes === null ? 'Không giới hạn thời gian' : `${match.timeLimitMinutes} phút`} · ${match.questionMode === 'different' ? 'Bài riêng theo nhóm' : 'Một bài giống nhau'}</p></div>${globalAction}</header><div class="team-board-grid">${cards}</div>${match.status === app.teamCompetition.STATUS.ENDED ? `<div class="team-board-ended-note">Trận đã kết thúc. Điểm nhóm được gán giống nhau cho từng thành viên trong bản ghi kết quả riêng.</div>` : ''}</section>`;
            if (isLive) this.teamCompetitionBoardTimer = setInterval(() => {
                const current = app.teamCompetition.store.get(match.id);
                if (!current || current.status !== app.teamCompetition.STATUS.ACTIVE || !document.getElementById('treasure-content-area')?.contains(box)) { clearInterval(this.teamCompetitionBoardTimer); this.teamCompetitionBoardTimer = null; return; }
                if (current.timeLimitMinutes !== null && current.startedAt && Date.now() >= Number(current.startedAt) + Number(current.timeLimitMinutes) * 60 * 1000) {
                    this.endTeamCompetition(current.id, true);
                    return;
                }
                this.renderTeamCompetitionBoard(box, match.id);
            }, 1000);
        },
        enterTeamBoardFullscreen() {
            const board = document.querySelector('.team-competition-board');
            if (board?.requestFullscreen) board.requestFullscreen().catch(() => {});
        },
        async startTeamCompetition(id) {
            const match = app.teamCompetition?.store.get(id);
            if (!match || match.status !== app.teamCompetition.STATUS.PREPARED) return;
            if (!confirm('Bắt đầu thi đua? Sau khi bắt đầu không thể sửa danh sách nhóm hoặc bộ đề.')) return;
            const started = app.teamCompetition.startCompetition(match, Date.now());
            app.teamCompetition.store.upsert(started);
            if (app.teamCompetition.remote?.flush) await app.teamCompetition.remote.flush();
            if (app.teamCompetition.remote?.getStatus?.() === 'error') return alert('Không thể bắt đầu trận trên Supabase. Vui lòng kiểm tra kết nối.');
            this.openTeamCompetitionBoard(started.id);
        },
        async endTeamCompetition(id, automatic = false) {
            const match = app.teamCompetition?.store.get(id);
            if (!match || match.status !== app.teamCompetition.STATUS.ACTIVE) return;
            if (!automatic && !confirm('Kết thúc trận ngay? Câu chưa nộp của các nhóm sẽ tính 0 điểm.')) return;
            const attempts = app.teamCompetition.attemptStore.list().filter(attempt => String(attempt.competitionId) === String(id));
            const scoreByTeam = {};
            let updated = { ...match, teams: match.teams.map(team => ({ ...team })) };
            attempts.forEach(attempt => {
                let finalAttempt = attempt;
                if (attempt.status === app.teamCompetition.ATTEMPT_STATUS.ACTIVE) finalAttempt = app.teamCompetition.lockAttempt(attempt, 'admin_end');
                scoreByTeam[attempt.teamId] = Number(finalAttempt.score || 0);
                updated.teams = updated.teams.map(team => String(team.id) === String(attempt.teamId) ? { ...team, score: Number(finalAttempt.score || 0), submittedCount: finalAttempt.submittedCount || 0, status: finalAttempt.status, completedAt: finalAttempt.completedAt, lockedAt: finalAttempt.lockedAt, durationSeconds: finalAttempt.durationSeconds } : team);
            });
            const ended = app.teamCompetition.endCompetition(updated, Date.now());
            ended.results = app.teamCompetition.buildMemberResults(ended, scoreByTeam);
            app.teamCompetition.store.upsert(ended);
            if (app.teamCompetition.remote?.flush) await app.teamCompetition.remote.flush();
            if (app.teamCompetition.remote?.getStatus?.() === 'error') return alert('Không thể kết thúc trận trên Supabase. Vui lòng kiểm tra kết nối.');
            this.openTeamCompetitionBoard(ended.id);
        },
        getQuestCurriculumLabel(quest) {
            const curriculum = quest?.curriculum || {};
            const parts = [];
            if (curriculum.classlevel) parts.push(curriculum.classlevel);
            if (curriculum.semester) parts.push(curriculum.semester);
            if (curriculum.topic) parts.push(curriculum.topic);
            if (curriculum.lesson) parts.push(this.lessonLabel(curriculum.lesson) || curriculum.lesson);
            return parts.join(' · ');
        },
        updateQuestCurriculumFields() {
            const subject = document.getElementById('quest-subject')?.value || '';
            const field = document.getElementById('quest-curriculum-fields');
            const classlevel = document.getElementById('quest-classlevel')?.value || '';
            const semester = document.getElementById('quest-semester')?.value || '';
            const topicEl = document.getElementById('quest-topic');
            const lessonField = document.getElementById('quest-lesson-field');
            const lessonEl = document.getElementById('quest-lesson');
            if (!field || !topicEl || !lessonEl) return;
            const isMath = subject === 'math';
            field.hidden = !isMath;
            if (!isMath) {
                lessonField.hidden = true;
                lessonEl.disabled = true;
                return;
            }
            const classNumber = app.curriculum?.normalizeClassNumber(classlevel) || '';
            const topics = classNumber
                ? (app.constants.topics[classNumber]?.math?.[app.curriculum.normalizeSemesterKey(semester) || 'hk1'] || [])
                : [];
            const selectedTopic = topicEl.value;
            topicEl.innerHTML = `<option value="">Không giới hạn Chủ đề</option>${topics.map(topic => `<option value="${app.data.sanitizeHTML(topic)}" ${topic === selectedTopic ? 'selected' : ''}>${app.data.sanitizeHTML(topic)}</option>`).join('')}`;
            const topic = topicEl.value;
            const supportsLessons = this.supportsAdminLessons(classlevel, subject) && Boolean(topic);
            lessonField.hidden = !supportsLessons;
            lessonEl.disabled = !supportsLessons;
            const selectedLesson = lessonEl.value || lessonEl.dataset.selected || '';
            const lessons = supportsLessons ? app.curriculum.getLessons({ classlevel, subject: 'Toán', semester, topic }) : [];
            lessonEl.innerHTML = this.getLessonOptions(lessons, selectedLesson);
            lessonEl.value = supportsLessons ? (this.normalizeAdminLesson(selectedLesson) || '') : '';
        },
        getQuestCurriculumSelection() {
            if (document.getElementById('quest-subject')?.value !== 'math') return {};
            const classlevel = document.getElementById('quest-classlevel')?.value || '';
            const semester = document.getElementById('quest-semester')?.value || '';
            const topic = document.getElementById('quest-topic')?.value || '';
            const lesson = this.normalizeAdminLesson(document.getElementById('quest-lesson')?.value || '');
            const curriculum = {};
            if (classlevel) curriculum.classlevel = classlevel;
            if (semester && classlevel) curriculum.semester = semester;
            if (topic && classlevel) curriculum.topic = topic;
            if (lesson && classlevel === 'Lớp 4' && topic) curriculum.lesson = lesson;
            return curriculum;
        },
        showAddQuestForm() {
            this.questMode = 'personal';
            const box = document.getElementById('treasure-content-area');
            let classOpts = [1, 2, 3, 4, 5].map(c => `<option value="${c}">Lớp ${c}</option>`).join('');
            const examOptions = (app.data.exams || []).map(exam => `<option value="${exam.id}">${app.data.sanitizeHTML(`${exam.classlevel} – ${exam.subject} – ${exam.period}: ${exam.name}`)}</option>`).join('');
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
                 <select id="quest-subject" class="form-input" style="width:100%;" onchange="app.admin.updateQuestCurriculumFields()">
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
           <section id="quest-curriculum-fields" class="admin-curriculum-panel" hidden aria-label="Phạm vi chương trình Toán">
              <p class="admin-curriculum-panel__title">Phạm vi chương trình <small>(chỉ dành cho nhiệm vụ Toán)</small></p>
              <div class="admin-curriculum-panel__grid">
                 <label><span>Cấp lớp</span><select id="quest-classlevel" class="form-input" onchange="app.admin.updateQuestCurriculumFields()"><option value="">Tất cả cấp lớp</option><option value="Lớp 1">Lớp 1</option><option value="Lớp 2">Lớp 2</option><option value="Lớp 3">Lớp 3</option><option value="Lớp 4">Lớp 4</option><option value="Lớp 5">Lớp 5</option></select></label>
                 <label><span>Học kỳ</span><select id="quest-semester" class="form-input" onchange="app.admin.updateQuestCurriculumFields()"><option value="Học kỳ 1">Học kỳ 1</option><option value="Học kỳ 2">Học kỳ 2</option></select></label>
                 <label><span>Chủ đề</span><select id="quest-topic" class="form-input" onchange="app.admin.updateQuestCurriculumFields()"><option value="">Không giới hạn Chủ đề</option></select></label>
                 <label id="quest-lesson-field" hidden><span>Bài học</span><select id="quest-lesson" class="form-input" data-selected=""></select><small>Không chọn để giao theo toàn bộ Chủ đề.</small></label>
              </div>
           </section>
           <div style="display:flex; gap:15px; margin-bottom:15px;">
              <div class="form-group" style="flex:1;">
                 <label style="display:block; font-weight:bold; margin-bottom:5px;">Số lượt yêu cầu:</label>
                 <input type="number" id="quest-count" class="form-input" style="width:100%;" value="3" min="1">
              </div>
              <div class="form-group" style="flex:1;">
                 <label style="display:block; font-weight:bold; margin-bottom:5px;">Phần thưởng (Sao):</label>
                 <input type="number" id="quest-reward" class="form-input" style="width:100%;" value="20" min="1">
              </div>
            </div>
            <div class="form-group" style="margin-bottom:15px;">
               <label style="display:block; font-weight:bold; margin-bottom:5px;">Đề kiểm tra giao kèm (tùy chọn):</label>
               <select id="quest-exam" class="form-input" style="width:100%;">
                  <option value="">Không gắn đề — nhiệm vụ luyện tập thông thường</option>
                  ${examOptions}
               </select>
               <small style="display:block; margin-top:5px; color:#cbd5e1;">Nếu chọn đề, học sinh chỉ được tính tiến độ khi làm đúng đề này từ nút “Làm đề”.</small>
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
              ${app.ui.compactAction('Hủy', "app.admin.switchTab('quests')", 'compact-admin-action--cancel')}
              ${app.ui.compactAction('Lưu', 'app.admin.submitQuest()', 'compact-admin-action--save')}
           </div>
        </div>
      `;
            this.updateQuestCurriculumFields();
        },
        async submitQuest() {
            const title = document.getElementById('quest-title').value.trim();
            const subject = document.getElementById('quest-subject').value;
            const score = parseInt(document.getElementById('quest-score').value) || 80;
            const count = parseInt(document.getElementById('quest-count').value) || 1;
            const reward = parseInt(document.getElementById('quest-reward').value) || 10;
            const assignType = document.getElementById('quest-assign-type').value;
            const assignTarget = document.getElementById('quest-assign-target').value.trim();
            const examId = document.getElementById('quest-exam').value || null;
            const curriculum = this.getQuestCurriculumSelection();

            if (!title) return alert("Vui lòng nhập tên nhiệm vụ!");
            if (assignType !== 'all' && !assignTarget) return alert("Vui lòng nhập đích danh (Lớp/Username)!");

            const selectedExam = examId ? app.data.exams.find(exam => exam.id === examId) : null;
            if (examId && !selectedExam) return alert('Không tìm thấy đề kiểm tra đã chọn.');
            if (curriculum.classlevel && curriculum.topic) {
                const curriculumError = app.data.validateQuestionMetadata({
                    classlevel: curriculum.classlevel,
                    subject: 'Toán',
                    semester: curriculum.semester || 'Học kỳ 1',
                    topic: curriculum.topic,
                    lesson: curriculum.lesson
                });
                if (curriculumError) return alert(curriculumError);
            }
            const newQuest = {
                title, target_subject: subject, target_score: score, target_count: count,
                reward_stars: reward, assign_type: assignType, assign_target: assignTarget, exam_id: examId, is_active: true,
                ...(Object.keys(curriculum).length ? { curriculum } : {})
            };
            if (selectedExam) {
                newQuest.target_subject = selectedExam.subject === 'Toán' ? 'math' : 'vietnamese';
                newQuest.target_count = 1;
            }

            if (window.supabase) {
                const { curriculum: _, ...serverQuest } = newQuest;
                const { data, error } = await supabaseClient.from('game_quests').insert([serverQuest]).select();
                if (error) {
                    console.error("Lỗi tạo nhiệm vụ:", error);
                    alert("Có lỗi khi tạo nhiệm vụ trên server!");
                } else if (data && data.length > 0) {
                    const savedQuest = { ...data[0], ...(Object.keys(curriculum).length ? { curriculum } : {}) };
                    app.data.quests.push(savedQuest);
                    app.data.syncQuestCurriculumMetadata();
                    await app.data.saveLessonMetadata();
                    this.switchTab('quests');
                }
            } else {
                newQuest.id = 'temp_' + new Date().getTime();
                app.data.quests.push(newQuest);
                app.data.syncQuestCurriculumMetadata();
                await app.data.saveLessonMetadata();
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
              ${app.ui.compactAction('Lưu thay đổi', 'app.admin.saveSettings()', 'compact-admin-action--save')}
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
            const oldText = btn.innerHTML;
            btn.textContent = 'Đang lưu...';
            btn.disabled = true;

            const error = await app.data.saveSettings();

            btn.innerHTML = oldText;
            btn.disabled = false;
            if (!error) {
                alert('Đã lưu cài đặt thành công!');
            }
        },
        templateFilters: { classlevel: '', subject: '', topic: '', lesson: '', questionType: '', generatorKey: '' },
        setTemplateFilter(key, value) {
            this.templateFilters[key] = value;
            this.renderTemplates(this.getComposerContentBox());
        },
        selectAllTemplateOptions(group) {
            document.querySelectorAll(`.template-checkbox[data-template-group="${group}"]`).forEach(input => { input.checked = true; });
        },
        formatTemplateNumberInput(input) {
            const digits = input.value.replace(/\D/g, '');
            input.value = digits ? app.data.formatMathNumber(digits) : '';
        },
        formatQuestionNumberText(input) {
            input.value = app.data.formatMathText(input.value);
        },
        getTemplateLesson(template) {
            const value = app.curriculum?.getTemplateLesson(template) || template?.lesson || template?.config?.lesson || '';
            return this.normalizeAdminLesson(value) || value;
        },
        getTemplateLessonDisplay(template) {
            const lesson = this.getTemplateLesson(template);
            return this.lessonLabel(lesson) || (lesson ? lesson : 'Toàn chủ đề');
        },
        renderTemplates(box) {
            const templates = app.data.questionTemplates || [];
            const unique = key => [...new Set(templates.map(item => item[key]).filter(Boolean))].sort();
            const optionList = (values, selected, label) => `<option value="">${label}</option>${values.map(value => `<option value="${app.data.sanitizeHTML(value)}" ${value === selected ? 'selected' : ''}>${app.data.sanitizeHTML(value)}</option>`).join('')}`;
            const filters = this.templateFilters;
            const templateLessonIds = [...new Set(templates.map(item => this.getTemplateLesson(item)).filter(Boolean))].sort();
            const lessonFilterOptions = `<option value="">Bài học: tất cả</option>${templateLessonIds.map(id => `<option value="${app.data.sanitizeHTML(id)}" ${id === filters.lesson ? 'selected' : ''}>${app.data.sanitizeHTML(this.lessonLabel(id) || id)}</option>`).join('')}`;
            const visible = templates.map((item, index) => ({ item, index })).filter(({ item }) =>
                (!filters.classlevel || item.classlevel === filters.classlevel) &&
                (!filters.subject || item.subject === filters.subject) &&
                (!filters.topic || item.topic === filters.topic) &&
                (!filters.lesson || this.getTemplateLesson(item) === filters.lesson) &&
                (!filters.questionType || item.question_type === filters.questionType) &&
                (!filters.generatorKey || item.generator_key === filters.generatorKey)
            );

            box.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:16px;">
                <div><h3 style="margin:0; color:#ffeb3b;">Kho Template</h3><small>Generator được tạo trong code; tại đây chỉ sửa hoặc nhân bản cấu hình áp dụng của generator đó.</small></div>
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin-bottom:12px;">
                <select class="filter-input" aria-label="Lọc cấp lớp" onchange="app.admin.setTemplateFilter('classlevel', this.value)">${optionList(['Lớp 1','Lớp 2','Lớp 3','Lớp 4','Lớp 5'], filters.classlevel, 'Cấp lớp: tất cả')}</select>
                <select class="filter-input" aria-label="Lọc môn học" onchange="app.admin.setTemplateFilter('subject', this.value)">${optionList(['Toán','Tiếng Việt'], filters.subject, 'Môn học: tất cả')}</select>
                <select class="filter-input" aria-label="Lọc chủ đề" onchange="app.admin.setTemplateFilter('topic', this.value)">${optionList(unique('topic'), filters.topic, 'Chủ đề: tất cả')}</select>
                <select class="filter-input" aria-label="Lọc Bài học" onchange="app.admin.setTemplateFilter('lesson', this.value)">${lessonFilterOptions}</select>
                <select class="filter-input" aria-label="Lọc loại câu hỏi" onchange="app.admin.setTemplateFilter('questionType', this.value)">${optionList(unique('question_type'), filters.questionType, 'Loại câu hỏi: tất cả')}</select>
                <select class="filter-input" aria-label="Lọc template" onchange="app.admin.setTemplateFilter('generatorKey', this.value)">${optionList(unique('generator_key'), filters.generatorKey, 'Template: tất cả')}</select>
              </div>
              <div style="margin-bottom:8px; color:#ffeb3b; font-weight:bold;">Hiển thị ${visible.length}/${templates.length} template</div>
              ${app.ui.renderTable([
                { label: 'Cấp lớp' }, { label: 'Môn' }, { label: 'Chủ đề' }, { label: 'Loại câu hỏi' }, { label: 'Template' }, { label: 'Bài học' }, { label: 'Câu hỏi mẫu' }, { label: 'Hành động' }
              ], visible, ({ item, index }) => `<tr>
                <td>${app.data.sanitizeHTML(item.classlevel)}</td><td>${app.data.sanitizeHTML(item.subject)}</td><td>${app.data.sanitizeHTML(item.topic)}</td>
                <td>${app.data.sanitizeHTML(item.question_type)}</td><td>${app.data.sanitizeHTML(item.name || item.generator_key)}</td><td>${app.data.sanitizeHTML(this.getTemplateLessonDisplay(item))}</td><td>${app.data.sanitizeHTML(item.prompt_template)}</td>
                <td><button class="btn-opt action-btn" onclick="app.admin.renderTemplateForm(${index})">Sửa</button><button class="btn-danger action-btn" onclick="app.admin.deleteTemplate(${index})">Xóa</button></td>
              </tr>`, 'Chưa có cấu hình template. Hãy thêm generator và cấu hình mẫu từ code hoặc chạy migration Supabase.')}
            `;
        },
        getTemplateTopics(classlevel, subject, semester) {
            const classNumber = String(classlevel || '').replace('Lớp ', '');
            const subjectKey = subject === 'Toán' ? 'math' : 'vietnamese';
            const semesterKey = semester === 'Học kỳ 2' ? 'hk2' : 'hk1';
            return app.constants.topics[classNumber]?.[subjectKey]?.[semesterKey] || [];
        },
        refreshTemplateTopics(selectedTopic = '', selectedLesson = '') {
            const classlevel = document.getElementById('template-class').value;
            const subject = document.getElementById('template-subject').value;
            const semester = document.getElementById('template-semester').value;
            const topic = document.getElementById('template-topic');
            const topics = this.getTemplateTopics(classlevel, subject, semester);
            const preservedTopic = selectedTopic || topic.value;
            topic.innerHTML = topics.map(value => `<option value="${app.data.sanitizeHTML(value)}" ${value === preservedTopic ? 'selected' : ''}>${app.data.sanitizeHTML(value)}</option>`).join('');
            this.refreshTemplateLessons(selectedLesson);
        },
        refreshTemplateLessons(selectedLesson = '') {
            const field = document.getElementById('template-lesson-field');
            const lesson = document.getElementById('template-lesson');
            if (!field || !lesson) return;
            const classlevel = document.getElementById('template-class')?.value || '';
            const subject = document.getElementById('template-subject')?.value || '';
            const semester = document.getElementById('template-semester')?.value || '';
            const topic = document.getElementById('template-topic')?.value || '';
            const supported = this.supportsAdminLessons(classlevel, subject);
            const selected = selectedLesson || lesson.value || lesson.dataset.selected || '';
            field.hidden = !supported;
            lesson.disabled = !supported;
            const lessons = supported ? app.curriculum.getLessons({ classlevel, subject, semester, topic }) : [];
            lesson.innerHTML = this.getLessonOptions(lessons, selected);
            if (supported) {
                lesson.value = this.normalizeAdminLesson(selected) || '';
                if (lesson.value) lesson.dataset.selected = lesson.value;
                else delete lesson.dataset.selected;
            } else {
                delete lesson.dataset.selected;
                lesson.value = '';
            }
        },
        renderTemplateForm(editIndex) {
            const existing = app.data.questionTemplates[editIndex];
            if (!existing) {
                alert('Hãy chọn một template có sẵn để sửa hoặc lưu thành bản mới.');
                this.switchTab('templates');
                return;
            }
            document.getElementById('treasure-title').textContent = 'Cài Đặt Hệ Thống';
            const config = existing?.config || {};
            const selectedTemplateLesson = this.getTemplateLesson(existing);
            const isMatching = existing?.generator_key === 'number.match_number_words' || /đối chiếu số/i.test(existing?.name || '');
            const selectedQuestionType = isMatching ? 'Đối chiếu trùng khớp' : (existing?.question_type || 'Trắc nghiệm');
            const templateQuestionTypes = ['Trắc nghiệm', 'Điền khuyết', 'Đúng/Sai', 'So sánh', 'Chuỗi Quy luật', 'Kéo thả', 'Đối chiếu trùng khớp'];
            const matchingShapes = (config.shapes || ['5:4', '4:5']).join(', ');
            const matchingDigits = (config.digits || [7, 8, 9]).join(', ');
            const matchingWeights = config.digitWeights ? Object.entries(config.digitWeights).map(([digit, weight]) => `${digit}:${weight}`).join(', ') : '';
            const naturalSteps = (config.allowedSteps || [1000,2000,3000,4000,5000,6000,7000,8000,9000,-1000,-2000,-3000,-4000,-5000,-6000,-7000,-8000,-9000]).join(', ');
            const naturalLengthMin = Number(config.sequenceLengthMin ?? 5);
            const naturalLengthMax = Number(config.sequenceLengthMax ?? 7);
            const naturalBlankMin = Number(config.blankCountMin ?? 2);
            const naturalBlankMax = Number(config.blankCountMax ?? 3);
            const trueFalseKinds = config.statementKinds || ['class', 'place'];
            const digitCount = number => String(Math.max(0, Math.trunc(Number(number) || 0))).length;
            const rangeMinimumDigits = Math.max(1, Math.min(12, Number(config.minimumDigits ?? digitCount(config.minimum ?? 10000))));
            const rangeMaximumDigits = Math.max(rangeMinimumDigits, Math.min(12, Number(config.maximumDigits ?? digitCount(config.maximum ?? 100000))));
            const arithmeticMinimumDigits = Math.max(2, Math.min(9, Number(config.minimumDigits ?? 2)));
            const arithmeticMaximumDigits = Math.max(arithmeticMinimumDigits, Math.min(9, Number(config.maximumDigits ?? 9)));
            const arithmeticOperations = config.operations || ['+', '-', '*', '/'];
            const arithmeticLayouts = config.layouts || ['expressionLeft', 'expressionRight', 'twoExpressions'];
            const arithmeticBlankPositions = config.blankPositions || ['first', 'second', 'third', 'fourth'];
            const safePasswordMinLength = Math.max(2, Math.min(12, Number(config.minimumCodeLength ?? config.codeLength ?? 9)));
            const safePasswordMaxLength = Math.max(safePasswordMinLength, Math.min(12, Number(config.maximumCodeLength ?? config.codeLength ?? 9)));
            const selectedPlaces = config.allowedPlaces || ['tens', 'hundreds', 'thousands', 'tenThousands'];
            const selectedDigits = config.allowedDigits || [1,2,3,4,5,6,7,8,9];
            const checkbox = (value, label, selected, group) => `<label class="template-editor__check"><input class="template-checkbox" data-template-group="${group}" type="checkbox" value="${value}" ${selected.includes(value) ? 'checked' : ''}><span>${label}</span></label>`;
            const placeChoices = [['ones','Đơn vị'],['tens','Chục'],['hundreds','Trăm'],['thousands','Nghìn'],['tenThousands','Chục nghìn'],['hundredThousands','Trăm nghìn'],['millions','Triệu'],['tenMillions','Chục triệu'],['hundredMillions','Trăm triệu'],['billions','Tỷ'],['tenBillions','Chục tỷ'],['hundredBillions','Trăm tỷ']];
            const safePlaces = placeChoices;
            const safeClasses = [['unitsClass', 'Lớp đơn vị (trăm, chục, đơn vị)'], ['thousandsClass', 'Lớp nghìn (trăm nghìn, chục nghìn, nghìn)'], ['millionsClass', 'Lớp triệu (trăm triệu, chục triệu, triệu)'], ['billionsClass', 'Lớp tỷ (trăm tỷ, chục tỷ, tỷ)']];
            const safeCondition1Scope = 'random';
            const safeCondition2Scope = 'place';
            const safeCondition1Places = config.condition1Places || safePlaces.map(([value]) => value);
            const safeCondition2Places = config.condition2Places || safePlaces.map(([value]) => value);
            const safeCondition1Classes = config.condition1Classes || safeClasses.map(([value]) => value);
            const safeCondition2Classes = config.condition2Classes || safeClasses.map(([value]) => value);
            const safeCondition1Digits = (config.condition1Digits || [0]).map(String);
            const safeCondition2Digits = (config.condition2Digits || [3]).map(String);
            const presetPrompt = this.templatePresets[existing?.generator_key]?.defaultPrompt;
            const legacySafePrompt = 'Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng mật khẩu có {codeLength} chữ số, {condition1} và {condition2}.';
            const existingPrompt = String(existing?.prompt_template || '').trim();
            const legacyFourPartPrompt = {
                'number.digit_at_place': 'Số nào dưới đây có chữ số hàng {place} là {digit}?',
                'number.smallest_of_four': 'Hãy tìm số bé nhất trong các số sau.',
                'number.largest_of_four': 'Hãy tìm số lớn nhất trong các số sau.',
                'number.compose_from_places': 'Viết số rồi đọc số, biết số đó gồm {place_values}. Số đó là {blank}',
                'number.missing_expanded_addend': 'Điền số còn thiếu:<br>{number} = {expression}',
                'number.neighbor_numbers': 'Hãy nhập số liền trước và số liền sau của {number}:<br>{neighbor_line}',
                'number.compare_number_forms': 'Điền dấu thích hợp:<br>{comparison}'
            }[existing?.generator_key];
            const safePrompt = 'Số nào dưới đây là mật khẩu mở khóa két sắt?<br>Biết rằng {condition1} và {condition2}.';
            const displayedPrompt = (existingPrompt === '{question}' || existingPrompt === legacyFourPartPrompt || (existing?.generator_key === 'number.safe_password_by_place_value' && [legacySafePrompt, safePrompt].includes(existingPrompt))) && presetPrompt
                ? presetPrompt
                : (existing?.prompt_template || 'Số nào dưới đây có chữ số hàng {place} là {digit}?');
            const box = this.getComposerContentBox();
            box.innerHTML = `<section class="template-editor" aria-labelledby="template-editor-title">
              <header class="template-editor__header"><div><p class="template-editor__eyebrow">KHO TEMPLATE</p><h3 id="template-editor-title">Sửa template</h3><p>Chỉnh cấu hình hiện có, hoặc lưu thành bản mới để áp dụng cho lớp/chủ đề khác.</p></div><span class="template-editor__badge">Câu hỏi động</span></header>
              <aside class="template-editor__guide" role="status"><span aria-hidden="true">💡</span><div><b>Diễn giải</b><p id="template-guide-copy"></p></div></aside>
              <div class="template-editor__section"><h4>1. Thông tin áp dụng</h4><div class="template-editor__fields">
                <label class="template-editor__field template-editor__field--wide"><span>Tên template</span><input id="template-name" class="form-input" maxlength="120" value="${app.data.sanitizeHTML(existing?.name || 'Nhận biết chữ số theo hàng')}"></label>
                <label class="template-editor__field"><span>Cấp lớp</span><select id="template-class" class="form-input" onchange="app.admin.refreshTemplateTopics()">${[1,2,3,4,5].map(n => `<option value="Lớp ${n}" ${(existing?.classlevel || 'Lớp 4') === `Lớp ${n}` ? 'selected' : ''}>Lớp ${n}</option>`).join('')}</select></label>
                <label class="template-editor__field"><span>Môn học</span><select id="template-subject" class="form-input" onchange="app.admin.refreshTemplateTopics()"><option value="Toán" ${(existing?.subject || 'Toán') === 'Toán' ? 'selected' : ''}>Toán</option><option value="Tiếng Việt" ${existing?.subject === 'Tiếng Việt' ? 'selected' : ''}>Tiếng Việt</option></select></label>
                <label class="template-editor__field"><span>Học kỳ</span><select id="template-semester" class="form-input" onchange="app.admin.refreshTemplateTopics()"><option value="Học kỳ 1" ${(existing?.semester || 'Học kỳ 1') === 'Học kỳ 1' ? 'selected' : ''}>Học kỳ 1</option><option value="Học kỳ 2" ${existing?.semester === 'Học kỳ 2' ? 'selected' : ''}>Học kỳ 2</option></select></label>
                <label class="template-editor__field template-editor__field--wide"><span>Chủ đề</span><select id="template-topic" class="form-input" onchange="app.admin.refreshTemplateLessons()"></select></label>
                <label id="template-lesson-field" class="template-editor__field template-editor__field--wide" hidden><span>Bài học</span><select id="template-lesson" class="form-input" data-selected="${app.data.sanitizeHTML(selectedTemplateLesson)}"></select><small>Chỉ dùng cho Lớp 4 – Toán; để trống nếu template áp dụng cho cả Chủ đề.</small></label>
                <label class="template-editor__field"><span>Loại câu hỏi</span><select id="template-question-type" class="form-input">${templateQuestionTypes.map(type => `<option value="${type}" ${selectedQuestionType === type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>
                <label class="template-editor__field"><span>Template</span><select id="template-generator" class="form-input" onchange="app.admin.showTemplateExample()"><option value="number.digit_at_place" ${!isMatching && (existing?.generator_key || 'number.digit_at_place') === 'number.digit_at_place' ? 'selected' : ''}>Nhận biết chữ số theo hàng</option><option value="number.smallest_of_four" ${existing?.generator_key === 'number.smallest_of_four' ? 'selected' : ''}>Tìm số bé nhất trong 4 số</option><option value="number.largest_of_four" ${existing?.generator_key === 'number.largest_of_four' ? 'selected' : ''}>Tìm số lớn nhất trong 4 số</option><option value="number.compose_from_places" ${existing?.generator_key === 'number.compose_from_places' ? 'selected' : ''}>Lập số từ các hàng</option><option value="number.missing_expanded_addend" ${existing?.generator_key === 'number.missing_expanded_addend' ? 'selected' : ''}>Điền thành phần còn thiếu</option><option value="number.four_operations_practice" ${existing?.generator_key === 'number.four_operations_practice' ? 'selected' : ''}>Bốn phép tính: điền khuyết và tính biểu thức</option><option value="number.four_arithmetic_blanks" ${existing?.generator_key === 'number.four_arithmetic_blanks' ? 'selected' : ''}>Bốn phép tính điền khuyết</option><option value="number.four_arithmetic_comparisons" ${existing?.generator_key === 'number.four_arithmetic_comparisons' ? 'selected' : ''}>Bốn phép tính so sánh kéo thả</option><option value="number.neighbor_numbers" ${existing?.generator_key === 'number.neighbor_numbers' ? 'selected' : ''}>Số liền trước, liền sau</option><option value="number.compare_number_forms" ${existing?.generator_key === 'number.compare_number_forms' ? 'selected' : ''}>So sánh số và dạng tổng</option><option value="number.place_value_true_false" ${existing?.generator_key === 'number.place_value_true_false' ? 'selected' : ''}>Đúng/Sai về lớp của chữ số</option><option value="number.safe_password_by_place_value" ${existing?.generator_key === 'number.safe_password_by_place_value' ? 'selected' : ''}>Mật khẩu két sắt theo hàng</option><option value="number.match_number_words" ${isMatching ? 'selected' : ''}>Đối chiếu số với cách đọc</option></select></label>
              </div></div>
              <div class="template-editor__section"><h4>2. Câu hỏi hiển thị</h4><label class="template-editor__field"><span id="template-prompt-hint">Dùng biến <code>{place}</code> cho hàng X và <code>{digit}</code> cho chữ số Y</span><textarea id="template-prompt" class="form-input">${app.data.sanitizeHTML(displayedPrompt)}</textarea></label><div id="template-variables" class="template-editor__variables" aria-live="polite"></div><div id="template-example" class="template-editor__preview"></div></div>
              <div class="template-editor__section"><h4>3. Quy tắc sinh số</h4><div class="template-editor__rules">
                <div class="template-editor__rule template-editor__rule--range-controls" aria-label="Số lượng chữ số"><div class="template-editor__fields template-editor__fields--digit-count"><label class="template-editor__field"><span>Số lượng chữ số ít nhất</span><input id="template-minimum-digits" class="form-input" type="number" min="1" max="12" value="${rangeMinimumDigits}"></label><label class="template-editor__field"><span>Số lượng chữ số nhiều nhất</span><input id="template-maximum-digits" class="form-input" type="number" min="1" max="12" value="${rangeMaximumDigits}"></label></div></div>
                <div class="template-editor__rule template-editor__rule--digit-controls"><div class="template-editor__rule-heading"><h5>Chữ số hàng X</h5><button type="button" class="template-select-all" onclick="app.admin.selectAllTemplateOptions('places')">Tất cả</button></div><p>Game chọn ngẫu nhiên một hàng đã tick.</p><div class="template-editor__checks template-editor__checks--places">${placeChoices.map(([value,label]) => checkbox(value, label, selectedPlaces, 'places')).join('')}</div></div>
                <div class="template-editor__rule template-editor__rule--digit-controls"><div class="template-editor__rule-heading"><h5>Chữ số Y</h5><button type="button" class="template-select-all" onclick="app.admin.selectAllTemplateOptions('digits')">Tất cả</button></div><p>Game chọn ngẫu nhiên một chữ số đã tick.</p><div class="template-editor__checks template-editor__checks--digits">${[0,1,2,3,4,5,6,7,8,9].map(value => checkbox(String(value), String(value), selectedDigits.map(String), 'digits')).join('')}</div></div>
                <div class="template-editor__rule template-editor__rule--matching-controls"><h5>Cấu hình đối chiếu số – chữ</h5><div class="template-editor__fields"><label class="template-editor__field"><span>Dạng ghép</span><input id="template-match-shapes" class="form-input" value="${app.data.sanitizeHTML(matchingShapes)}" placeholder="5:4, 4:5"></label><label class="template-editor__field"><span>Độ dài số</span><input id="template-match-digits" class="form-input" value="${app.data.sanitizeHTML(matchingDigits)}" placeholder="7, 8, 9"></label><label class="template-editor__field"><span>Phân bố</span><select id="template-match-strategy" class="form-input">${['balanced','random','cycle'].map(item => `<option value="${item}" ${(config.digitStrategy || 'balanced') === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label class="template-editor__field"><span>Tỷ lệ sinh số (tùy chọn)</span><input id="template-match-weights" class="form-input" value="${app.data.sanitizeHTML(matchingWeights)}" placeholder="7:20, 8:30, 9:50"></label><label class="template-editor__field"><span>Từ tiền tố chung</span><input id="template-match-prefix" class="form-input" type="number" min="0" value="${Number(config.prefixWords || 0)}"></label><label class="template-editor__field"><span>Seed (tùy chọn)</span><input id="template-match-seed" class="form-input" type="number" value="${config.seed ?? ''}"></label></div></div>
                <div class="template-editor__rule template-editor__rule--true-false-controls"><h5>Nhận định Đúng/Sai</h5><p>Chọn nội dung bạn muốn xuất hiện trong bốn nhận định A–D. Game chỉ hỏi chữ số có trong số đã sinh, không lặp chữ số và tự tạo cả nhận định Đúng lẫn Sai.</p><div id="template-true-false-kinds" class="template-editor__checks template-editor__checks--true-false" aria-label="Loại nhận định">${checkbox('class', 'Nhận định về lớp · Ví dụ: Chữ số 8 thuộc lớp nghìn.', trueFalseKinds, 'true-false-kinds')}${checkbox('place', 'Nhận định về hàng · Ví dụ: Chữ số 9 ở hàng nghìn.', trueFalseKinds, 'true-false-kinds')}</div><p class="template-editor__rule-note">Có thể chọn cả hai để câu hỏi đa dạng; hoặc chỉ tick một loại nếu muốn luyện riêng.</p></div>
                <div class="template-editor__rule template-editor__rule--four-arithmetic-controls"><div class="template-editor__arithmetic-settings"><div class="template-editor__fields template-editor__fields--digit-count"><label class="template-editor__field"><span>Số lượng chữ số ít nhất</span><input id="template-arithmetic-min-digits" class="form-input" type="number" min="2" max="9" value="${arithmeticMinimumDigits}"></label><label class="template-editor__field"><span>Số lượng chữ số nhiều nhất</span><input id="template-arithmetic-max-digits" class="form-input" type="number" min="2" max="9" value="${arithmeticMaximumDigits}"></label></div><fieldset><legend>Phép tính có thể bốc</legend><div id="template-arithmetic-operations" class="template-editor__checks">${checkbox('+', 'Phép cộng (+)', arithmeticOperations, 'arithmetic-operations')}${checkbox('-', 'Phép trừ (−)', arithmeticOperations, 'arithmetic-operations')}${checkbox('*', 'Phép nhân (×)', arithmeticOperations, 'arithmetic-operations')}${checkbox('/', 'Phép chia (÷)', arithmeticOperations, 'arithmetic-operations')}</div></fieldset><fieldset class="template-editor__rule--four-arithmetic-layouts"><legend>Dạng hiển thị hai vế</legend><div id="template-arithmetic-layouts" class="template-editor__checks">${checkbox('expressionLeft', 'Phép tính bên trái = kết quả', arithmeticLayouts, 'arithmetic-layouts')}${checkbox('expressionRight', 'Kết quả = phép tính bên phải', arithmeticLayouts, 'arithmetic-layouts')}${checkbox('twoExpressions', 'Hai vế đều là phép tính', arithmeticLayouts, 'arithmetic-layouts')}</div></fieldset><fieldset class="template-editor__rule--four-arithmetic-blank-positions"><legend>Vị trí ô trống có thể bốc</legend><div id="template-arithmetic-blank-positions" class="template-editor__checks">${checkbox('first', 'Số thứ nhất', arithmeticBlankPositions, 'arithmetic-blank-positions')}${checkbox('second', 'Số thứ hai', arithmeticBlankPositions, 'arithmetic-blank-positions')}${checkbox('third', 'Số thứ ba', arithmeticBlankPositions, 'arithmetic-blank-positions')}${checkbox('fourth', 'Số thứ tư', arithmeticBlankPositions, 'arithmetic-blank-positions')}</div></fieldset></div></div>
                <div class="template-editor__rule template-editor__rule--safe-password-range-controls" aria-label="Khoảng giá trị mật khẩu"><div class="template-editor__range"><label><span>Số nhỏ nhất</span><input id="template-minimum" class="form-input" type="text" inputmode="numeric" oninput="app.admin.formatTemplateNumberInput(this)" value="${app.data.formatMathNumber(config.minimum ?? 0)}"></label><span>đến</span><label><span>Số lớn nhất</span><input id="template-maximum" class="form-input" type="text" inputmode="numeric" oninput="app.admin.formatTemplateNumberInput(this)" value="${app.data.formatMathNumber(config.maximum ?? (10 ** safePasswordMaxLength - 1))}"></label></div></div>
                <div class="template-editor__rule template-editor__rule--safe-password-controls"><h5>Độ dài mật khẩu</h5><p>Game nêu số chữ số ngay trong câu hỏi; két sắt chỉ là ảnh minh họa. Mỗi lượt, độ dài được bốc trong khoảng khai báo.</p><div class="template-editor__fields"><label class="template-editor__field"><span>Số chữ số ít nhất</span><input id="template-safe-password-min-length" class="form-input" type="number" min="2" max="9" value="${safePasswordMinLength}"></label><label class="template-editor__field"><span>Số chữ số nhiều nhất</span><input id="template-safe-password-max-length" class="form-input" type="number" min="2" max="9" value="${safePasswordMaxLength}"></label></div><div class="template-editor__safe-conditions"><fieldset><legend>Điều kiện 1</legend><p>Chữ số ở một hàng được chọn phải khác một chữ số được chọn.</p><div class="template-editor__rule-heading"><b>Hàng có thể bốc</b><button type="button" class="template-select-all" onclick="app.admin.selectAllTemplateOptions('safe-condition1-places')">Tất cả</button></div><div id="template-safe-password-condition1-places" class="template-editor__checks template-editor__checks--places">${safePlaces.map(([value,label]) => checkbox(value, label, safeCondition1Places, 'safe-condition1-places')).join('')}</div><div class="template-editor__rule-heading"><b>Chữ số phải khác</b><button type="button" class="template-select-all" onclick="app.admin.selectAllTemplateOptions('safe-condition1-digits')">Tất cả</button></div><div id="template-safe-password-condition1-digits" class="template-editor__checks template-editor__checks--digits">${[0,1,2,3,4,5,6,7,8,9].map(value => checkbox(String(value), String(value), safeCondition1Digits, 'safe-condition1-digits')).join('')}</div></fieldset><fieldset><legend>Điều kiện 2</legend><p>Game tự bốc một hàng khác nếu còn hàng phù hợp với độ dài mật khẩu.</p><div class="template-editor__rule-heading"><b>Hàng có thể bốc</b><button type="button" class="template-select-all" onclick="app.admin.selectAllTemplateOptions('safe-condition2-places')">Tất cả</button></div><div id="template-safe-password-condition2-places" class="template-editor__checks template-editor__checks--places">${safePlaces.map(([value,label]) => checkbox(value, label, safeCondition2Places, 'safe-condition2-places')).join('')}</div><div class="template-editor__rule-heading"><b>Chữ số phải khác</b><button type="button" class="template-select-all" onclick="app.admin.selectAllTemplateOptions('safe-condition2-digits')">Tất cả</button></div><div id="template-safe-password-condition2-digits" class="template-editor__checks template-editor__checks--digits">${[0,1,2,3,4,5,6,7,8,9].map(value => checkbox(String(value), String(value), safeCondition2Digits, 'safe-condition2-digits')).join('')}</div></fieldset></div></div>
                <div class="template-editor__rule template-editor__rule--safe-password-class-controls"><h5>Phân biệt “lớp” và “hàng”</h5><p><b>Lớp</b> luôn gồm ba hàng; <b>hàng</b> chỉ là một vị trí. Ở mỗi điều kiện, chọn một kiểu rồi cấu hình danh sách tương ứng bên dưới.</p><div class="template-editor__fields"><label class="template-editor__field"><span>Điều kiện 1 áp dụng theo</span><select id="template-safe-password-condition1-scope" class="form-input"><option value="place" ${safeCondition1Scope === 'place' ? 'selected' : ''}>Một hàng</option><option value="class" ${safeCondition1Scope === 'class' ? 'selected' : ''}>Một lớp (3 hàng)</option></select></label><label class="template-editor__field"><span>Điều kiện 2 áp dụng theo</span><select id="template-safe-password-condition2-scope" class="form-input"><option value="place" ${safeCondition2Scope === 'place' ? 'selected' : ''}>Một hàng</option><option value="class" ${safeCondition2Scope === 'class' ? 'selected' : ''}>Một lớp (3 hàng)</option></select></label></div><div class="template-editor__safe-conditions"><fieldset><legend>Lớp có thể bốc cho Điều kiện 1</legend><div id="template-safe-password-condition1-classes" class="template-editor__checks">${safeClasses.map(([value,label]) => checkbox(value, label, safeCondition1Classes, 'safe-condition1-classes')).join('')}</div></fieldset><fieldset><legend>Lớp có thể bốc cho Điều kiện 2</legend><div id="template-safe-password-condition2-classes" class="template-editor__checks">${safeClasses.map(([value,label]) => checkbox(value, label, safeCondition2Classes, 'safe-condition2-classes')).join('')}</div></fieldset></div></div>
              </div></div>
              <footer class="template-editor__actions"><button class="btn-opt" onclick="app.admin.switchTab('templates')">Hủy</button><button class="btn-success" onclick="app.admin.saveTemplate(${editIndex}, true)">Lưu thành bản mới</button><button class="btn-primary" onclick="app.admin.saveTemplate(${editIndex})">Cập nhật</button></footer>
            </section>`;
            if (existing?.generator_key === 'number.safe_password_by_place_value') {
                document.getElementById('template-minimum').value = app.data.formatMathNumber(config.minimum ?? 0);
                document.getElementById('template-maximum').value = app.data.formatMathNumber(config.maximum ?? (10 ** safePasswordMaxLength - 1));
                const condition1Scope = document.getElementById('template-safe-password-condition1-scope');
                const condition2Scope = document.getElementById('template-safe-password-condition2-scope');
                condition1Scope.innerHTML = '<option value="random">Lớp hoặc hàng ngẫu nhiên</option>';
                condition1Scope.value = 'random';
                condition1Scope.disabled = true;
                condition1Scope.closest('label').querySelector('span').textContent = 'Điều kiện 1';
                condition2Scope.innerHTML = '<option value="place">Hàng ngẫu nhiên</option>';
                condition2Scope.value = 'place';
                condition2Scope.disabled = true;
                condition2Scope.closest('label').querySelector('span').textContent = 'Điều kiện 2';
                document.querySelector('#template-safe-password-condition2-classes')?.closest('fieldset')?.remove();
                const classHeading = document.querySelector('.template-editor__rule--safe-password-class-controls h5');
                if (classHeading) classHeading.textContent = '1a. Lớp ngẫu nhiên cho Điều kiện 1';
                const safeHeading = document.querySelector('.template-editor__rule--safe-password-controls h5');
                if (safeHeading) safeHeading.textContent = '1b. Hàng ngẫu nhiên cho Điều kiện 1 · 2. Hàng ngẫu nhiên cho Điều kiện 2';
            }
            this.refreshTemplateTopics(existing?.topic || '', selectedTemplateLesson);
            const generatorControl = document.getElementById('template-generator');
            generatorControl?.querySelector('option[value="number.four_operations_practice"]')?.remove();
            const angleTemplateOptions = [
                ['g4-m-angle-count-in-polygon', 'Đếm các loại góc trong hình'],
                ['g4-m-angle-drag-classify', 'Kéo thả phân loại góc'],
                ['g4-m-angle-clock-classify', 'Kéo thả phân loại góc qua đồng hồ'],
                ['g4-m-angle-count-eight-angles', 'Đếm 8 góc theo loại']
            ];
            angleTemplateOptions.forEach(([value, label]) => {
                if (generatorControl && !generatorControl.querySelector(`option[value="${value}"]`)) generatorControl.insertAdjacentHTML('beforeend', `<option value="${value}">${label}</option>`);
            });
            const topic5TemplateOptions = [
                ['g4-m-add-sub-multi-digit', 'Bốn phép cộng và trừ số nhiều chữ số'],
                ['g4-m-add-sub-word-problem', 'Bài toán thực tế: cộng và trừ'],
                ['g4-m-add-sub-missing-term', 'Tìm số hạng, số bị trừ, số trừ hoặc hiệu'],
                ['g4-m-add-sub-missing-digit', 'Tìm chữ số còn thiếu trong phép tính'],
                ['g4-m-addition-property-fill', 'Điền số theo tính chất của phép cộng'],
                ['g4-m-add-sub-expression', 'Tính giá trị biểu thức cộng, trừ'],
                ['g4-m-sum-difference-direct', 'Tìm hai số biết tổng và hiệu'],
                ['g4-m-sum-difference-context', 'Tìm hai số biết tổng và hiệu qua ngữ cảnh'],
                ['g4-m-add-sub-true-false', 'Đúng/Sai về phép cộng và phép trừ']
            ];
            topic5TemplateOptions.forEach(([value, label]) => {
                if (generatorControl && !generatorControl.querySelector(`option[value="${value}"]`)) generatorControl.insertAdjacentHTML('beforeend', `<option value="${value}">${label}</option>`);
            });
            const angleRule = document.createElement('div');
            angleRule.className = 'template-editor__rule template-editor__rule--angle-info';
            angleRule.hidden = true;
            angleRule.innerHTML = '<h5>Hình và đáp án</h5><p>Game tự bốc hình góc hợp lệ, luôn có đủ bốn ý a–d và kiểm tra theo hình. Nhóm template này không dùng phạm vi số.</p>';
            box.querySelector('.template-editor__rules')?.appendChild(angleRule);
            const arithmeticTemplateOptions = [
                ['number.four_operations_fill_blanks', 'Bốn phép tính: điền số còn thiếu'],
                ['number.four_operations_expressions', 'Bốn phép tính: tính giá trị biểu thức']
            ];
            arithmeticTemplateOptions.forEach(([value, label]) => {
                if (generatorControl && !generatorControl.querySelector(`option[value="${value}"]`)) generatorControl.insertAdjacentHTML('beforeend', `<option value="${value}">${label}</option>`);
            });
            const measurementTemplateOptions = [
                ['measurement.mass_unit_convert', 'Đổi đơn vị khối lượng'], ['measurement.area_unit_convert', 'Đổi đơn vị diện tích'],
                ['measurement.time_unit_convert', 'Đổi đơn vị thời gian'],
                ['measurement.compare_units', 'So sánh đại lượng cùng loại'], ['measurement.match_equivalences', 'Nối số đo tương đương'],
                ['measurement.unit_true_false', 'Đúng/Sai về đơn vị đo'], ['measurement.century_identification', 'Xác định thế kỉ'],
                ['measurement.word_problem_units', 'Bài toán thực tế đơn vị đo']
            ];
            measurementTemplateOptions.forEach(([value, label]) => {
                if (generatorControl && !generatorControl.querySelector(`option[value="${value}"]`)) generatorControl.insertAdjacentHTML('beforeend', `<option value="${value}">${label}</option>`);
            });
            if (generatorControl && !generatorControl.querySelector('option[value="number.natural_sequence"]')) generatorControl.insertAdjacentHTML('beforeend', '<option value="number.natural_sequence">Dãy số theo quy luật</option>');
            if (generatorControl && arithmeticTemplateOptions.some(([value]) => value === existing?.generator_key)) generatorControl.value = existing.generator_key;
            if (generatorControl && existing?.generator_key === 'number.natural_sequence') generatorControl.value = existing.generator_key;
            if (generatorControl && measurementTemplateOptions.some(([value]) => value === existing?.generator_key)) generatorControl.value = existing.generator_key;
            if (generatorControl && topic5TemplateOptions.some(([value]) => value === existing?.generator_key)) generatorControl.value = existing.generator_key;
            const naturalSequenceRule = `<div class="template-editor__rule template-editor__rule--natural-sequence-controls"><h5>Dãy số theo quy luật</h5><p>Đổi phạm vi và bước nhảy để dùng lại template cho cấp lớp hoặc chủ đề khác.</p><div class="template-editor__fields"><label class="template-editor__field"><span>Số nhỏ nhất</span><input id="template-natural-sequence-minimum" class="form-input" type="number" min="0" value="${Number(config.minimum ?? 10000)}"></label><label class="template-editor__field"><span>Số lớn nhất</span><input id="template-natural-sequence-maximum" class="form-input" type="number" min="1" value="${Number(config.maximum ?? 9999999)}"></label><label class="template-editor__field template-editor__field--wide"><span>Bước nhảy được phép</span><input id="template-natural-sequence-steps" class="form-input" value="${app.data.sanitizeHTML(naturalSteps)}" placeholder="5, 6, -1000"></label><label class="template-editor__field"><span>Số hạng ít nhất</span><input id="template-natural-sequence-length-min" class="form-input" type="number" min="5" value="${naturalLengthMin}"></label><label class="template-editor__field"><span>Số hạng nhiều nhất</span><input id="template-natural-sequence-length-max" class="form-input" type="number" min="5" value="${naturalLengthMax}"></label><label class="template-editor__field"><span>Ô trống ít nhất</span><input id="template-natural-sequence-blank-min" class="form-input" type="number" min="1" value="${naturalBlankMin}"></label><label class="template-editor__field"><span>Ô trống nhiều nhất</span><input id="template-natural-sequence-blank-max" class="form-input" type="number" min="1" value="${naturalBlankMax}"></label></div></div>`;
            box.querySelector('.template-editor__rule--matching-controls')?.insertAdjacentHTML('beforebegin', naturalSequenceRule);
            if (generatorControl && [...arithmeticTemplateOptions, ...angleTemplateOptions, ...topic5TemplateOptions].some(([value]) => value === existing?.generator_key)) generatorControl.value = existing.generator_key;
            this.showTemplateExample();
            const configurableGenerator = ['number.safe_password_by_place_value', 'number.place_value_true_false', 'number.four_operations_fill_blanks', 'number.four_operations_expressions', 'number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'].includes(existing?.generator_key);
            if (configurableGenerator) {
                if (existing?.generator_key === 'number.safe_password_by_place_value') {
                    document.querySelectorAll('.template-editor__rule--safe-password-controls, .template-editor__rule--safe-password-class-controls').forEach(rule => { rule.hidden = false; });
                }
                const adminContent = box.closest('.admin-content');
                const rulesSection = box.querySelector('.template-editor__section:last-of-type');
                if (adminContent && rulesSection) requestAnimationFrame(() => { adminContent.scrollTop = Math.max(0, rulesSection.offsetTop - 12); });
            }
        },
        templatePresets: {
                'number.digit_at_place': {
                    defaultPrompt: 'Số nào dưới đây có chữ số hàng {place} là {digit}?',
                    guide: 'Tạo câu trắc nghiệm nhận biết chữ số ở một hàng xác định. Mỗi lượt game bốc ngẫu nhiên hàng, chữ số và bốn phương án, trong đó chỉ có một đáp án đúng.',
                    hint: 'Dùng biến <code>{place}</code> cho hàng X và <code>{digit}</code> cho chữ số Y',
                    previewImage: 'digit-at-place.jpg',
                    type: 'Trắc nghiệm',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)'], ['{place}', 'tên hàng được bốc'], ['{digit}', 'chữ số được bốc']]
                },
                'number.smallest_of_four': {
                    defaultPrompt: 'Hãy tìm số bé nhất trong các số sau.',
                    guide: 'Tạo câu trắc nghiệm gồm bốn số khác nhau trong phạm vi đã chọn; học sinh tìm số bé nhất.',
                    hint: 'Không cần biến. Game tự sinh 4 phương án khác nhau.',
                    previewImage: 'smallest-of-four.jpg',
                    type: 'Trắc nghiệm',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)']]
                },
                'number.largest_of_four': {
                    defaultPrompt: 'Hãy tìm số lớn nhất trong các số sau.',
                    guide: 'Tạo câu trắc nghiệm gồm bốn số khác nhau trong phạm vi đã chọn; học sinh tìm số lớn nhất.',
                    hint: 'Không cần biến. Game tự sinh 4 phương án khác nhau.',
                    previewImage: 'largest-of-four.jpg',
                    type: 'Trắc nghiệm',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)']]
                },
                'number.compose_from_places': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo 4 câu con a–d lập số từ các hàng. Mỗi dòng có một ô điền; mỗi câu con đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên nội dung động do game sinh.',
                    previewImage: 'compose-from-places.jpg',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)'], ['{place_values}', 'các hàng, ví dụ: 4 chục nghìn, 2 nghìn và 5 trăm'], ['{blank}', 'ô nhập đáp án (___)']]
                },
                'number.missing_expanded_addend': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo 4 câu con a–d về cấu tạo thập phân. Mỗi dòng ẩn một thành phần của dạng tổng; mỗi câu con đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên phép tính động do game sinh.',
                    previewImage: 'missing-expanded-addend.jpg',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)'], ['{number}', 'số cần phân tích'], ['{expression}', 'dạng tổng có một ô trống'], ['{blank}', 'ô nhập đáp án (___)']]
                },
                'number.four_operations_fill_blanks': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo 4 ý a–d điền số còn thiếu. Ô trống được bốc ở số thứ nhất, số thứ hai hoặc kết quả; mỗi lượt có đủ cộng, trừ, nhân, chia và mỗi ý đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên câu dẫn cùng 4 ý; hoặc chèn <code>{exercises}</code> để tự soạn câu dẫn riêng.',
                    example: 'Mẫu gồm 4 phép tính a–d với một ô trống ở số thứ nhất, số thứ hai hoặc kết quả.',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ câu hỏi gồm câu dẫn và 4 ý'], ['{exercises}', 'bốn ý a–d đã sinh'], ['{practice_rows}', 'bốn ý a–d đã sinh'], ['{blank}', 'ô nhập đáp án (___)']]
                },
                'number.four_operations_expressions': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo 4 ý a–d tính giá trị biểu thức nhiều bước, có ngoặc khi cần. Mỗi lượt có đủ cộng, trừ, nhân, chia và mỗi ý đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên câu dẫn cùng 4 ý; hoặc chèn <code>{exercises}</code> để tự soạn câu dẫn riêng.',
                    example: 'Mẫu gồm 4 biểu thức như 57 670 − (29 653 − 2 653) hoặc 6 000 × 5 : 3.',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ câu hỏi gồm câu dẫn và 4 ý'], ['{exercises}', 'bốn ý a–d đã sinh'], ['{practice_rows}', 'bốn ý a–d đã sinh'], ['{blank}', 'ô nhập đáp án (___)']]
                },
                'number.four_arithmetic_blanks': {
                    defaultPrompt: 'Hãy điền số thích hợp vào chỗ trống:<br>{exercises}',
                    guide: 'Tạo bốn phép tính a–d, mỗi dòng có một số bị khuyết. Có thể chọn cộng, trừ, nhân, chia và cách đặt phép tính ở một hoặc hai vế; phép chia luôn cho kết quả nguyên.',
                    hint: 'Dùng <code>{exercises}</code> để chèn trọn 4 dòng, hoặc <code>{question}</code> để giữ nguyên toàn bộ câu hỏi mặc định.',
                    previewImage: 'four-arithmetic-blanks.jpg',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ câu hỏi gồm câu dẫn và 4 dòng'], ['{exercises}', 'bốn phép tính a–d có một ô trống mỗi dòng'], ['{blank}', 'ô nhập đáp án (___)']]
                },
                'number.four_arithmetic_comparisons': {
                    defaultPrompt: 'Điền dấu thích hợp:<br>{exercises}',
                    guide: 'Tạo bốn phép tính a–d để kéo dấu so sánh vào chỗ trống. Mỗi lượt luôn có đủ các dấu >, <, = và có thể dùng cộng, trừ, nhân hoặc chia.',
                    hint: 'Dùng <code>{exercises}</code> để chèn trọn 4 dòng, hoặc <code>{question}</code> để giữ nguyên toàn bộ câu hỏi mặc định.',
                    previewImage: 'four-arithmetic-comparisons.jpg',
                    type: 'Kéo thả',
                    variables: [['{question}', 'toàn bộ câu hỏi gồm câu dẫn và 4 dòng'], ['{exercises}', 'bốn phép so sánh a–d'], ['{comparison_rows}', 'bốn phép so sánh a–d']]
                },
                'number.neighbor_numbers': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo 4 câu con a–d về số liền trước và số liền sau. Mỗi dòng có 2 ô nhưng chỉ đúng cả cặp mới nhận 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên nội dung động do game sinh.',
                    previewImage: 'neighbor-numbers.jpg',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)'], ['{number}', 'số đã cho'], ['{neighbor_line}', 'dòng ___ ; số đã cho ; ___'], ['{blank}', 'ô nhập đáp án (___)']]
                },
                'number.compare_number_forms': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo 4 câu con a–d để so sánh số tự nhiên với dạng tổng theo các hàng; mỗi câu con đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên nội dung động do game sinh.',
                    previewImage: 'compare-number-forms.jpg',
                    type: 'So sánh',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)'], ['{left}', 'số ở vế trái'], ['{right_expanded}', 'vế phải ở dạng tổng'], ['{comparison}', 'biểu thức có ô chọn dấu'], ['{blank}', 'ô chọn dấu (___)']]
                },
                'number.place_value_true_false': {
                    defaultPrompt: 'Chọn Đúng/Sai?',
                    guide: 'Tạo một số nhiều chữ số và bốn nhận định Đúng/Sai về lớp hoặc hàng của chữ số. Mỗi chữ số được hỏi xuất hiện đúng một lần trong số đã cho.',
                    hint: 'Tiêu đề dùng chung là <code>Chọn Đúng/Sai?</code>. Mỗi nhận định tự nêu <code>{number}</code>; có thể chèn <code>{statements}</code> nếu cần xem danh sách nhận định.',
                    previewImage: 'place-value-true-false.jpg',
                    type: 'Đúng/Sai',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)'], ['{number}', 'số nhiều chữ số đã sinh'], ['{statements}', 'bốn nhận định A–D đã sinh về lớp hoặc hàng']]
                },
                'number.safe_password_by_place_value': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo 4 câu con a–d tìm mật khẩu két sắt. Mỗi câu có 2 điều kiện riêng và 4 số; mỗi câu con đúng được 0,25 điểm.',
                    hint: 'Ô bên dưới đã ghi đầy đủ câu hỏi mặc định. Hãy sửa trực tiếp, hoặc chèn <code>{condition1}</code> và <code>{condition2}</code> vào vị trí mong muốn.',
                    previewImage: 'safe-password-by-place-value.jpg',
                    type: 'Trắc nghiệm',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)'], ['{codeLength}', 'số chữ số mật khẩu đã bốc'], ['{condition1}', 'quy tắc thứ nhất đã bốc'], ['{condition2}', 'quy tắc thứ hai đã bốc']]
                },
                'g4-m-add-sub-multi-digit': {
                    defaultPrompt: '{question}', guide: 'Tạo 4 phép tính đặt tính rồi tính, luôn gồm 2 phép cộng và 2 phép trừ số nhiều chữ số.', hint: 'Dùng <code>{question}</code> để giữ nguyên 4 ý a–d và các ô điền đáp án.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ 4 phép tính a–d do game sinh']]
                },
                'g4-m-add-sub-word-problem': {
                    defaultPrompt: '{question}', guide: 'Tạo bài toán thực tế về phép cộng hoặc phép trừ từ 30 ngữ cảnh đã duyệt; mỗi lượt có một ô trả lời.', hint: 'Dùng <code>{question}</code> để giữ nguyên đề bài và ô trả lời.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'đề bài thực tế và ô trả lời do game sinh']]
                },
                'g4-m-add-sub-missing-term': {
                    defaultPrompt: '{question}', guide: 'Tạo 4 ý tìm số hạng, số bị trừ, số trừ hoặc hiệu còn thiếu.', hint: 'Dùng <code>{question}</code> để giữ nguyên 4 ý a–d.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ 4 phép tính a–d do game sinh']]
                },
                'g4-m-add-sub-missing-digit': {
                    defaultPrompt: '{question}', guide: 'Tạo 4 phép cộng hoặc trừ với một chữ số bị khuyết; học sinh điền chữ số thích hợp.', hint: 'Dùng <code>{question}</code> để giữ nguyên 4 ý a–d.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ 4 phép tính a–d do game sinh']]
                },
                'g4-m-addition-property-fill': {
                    defaultPrompt: '{question}', guide: 'Tạo 4 ý điền số vận dụng tính chất giao hoán và kết hợp của phép cộng.', hint: 'Dùng <code>{question}</code> để giữ nguyên 4 ý a–d.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ 4 ý a–d do game sinh']]
                },
                'g4-m-add-sub-expression': {
                    defaultPrompt: '{question}', guide: 'Tạo 4 biểu thức chỉ dùng cộng và trừ; mỗi ý có một ô điền kết quả.', hint: 'Dùng <code>{question}</code> để giữ nguyên 4 ý a–d.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ 4 biểu thức a–d do game sinh']]
                },
                'g4-m-sum-difference-direct': {
                    defaultPrompt: '{question}', guide: 'Cho tổng và hiệu, học sinh điền lần lượt số lớn và số bé.', hint: 'Dùng <code>{question}</code> để giữ nguyên đề bài cùng 2 ô trả lời.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'đề bài và 2 ô trả lời do game sinh']]
                },
                'g4-m-sum-difference-context': {
                    defaultPrompt: '{question}', guide: 'Tạo bài toán tìm hai số biết tổng và hiệu từ 30 ngữ cảnh; học sinh điền cả hai đáp số.', hint: 'Dùng <code>{question}</code> để giữ nguyên đề bài cùng 2 ô trả lời.', preview: 'live', type: 'Điền khuyết',
                    variables: [['{question}', 'đề bài ngữ cảnh và 2 ô trả lời do game sinh']]
                },
                'g4-m-add-sub-true-false': {
                    defaultPrompt: '{question}', guide: 'Tạo 4 nhận định Đúng/Sai về phép cộng và phép trừ.', hint: 'Dùng <code>{question}</code> để giữ nguyên 4 nhận định.', preview: 'live', type: 'Đúng/Sai',
                    variables: [['{question}', 'toàn bộ 4 nhận định do game sinh']]
                },
                'g4-m-angle-count-in-polygon': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo một hình học có đánh dấu góc và bốn ý a–d để đếm góc nhọn, góc vuông, góc tù, góc bẹt. Mỗi ý đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên hình vẽ cùng bốn ô điền mà game sinh.',
                    previewImage: 'angle-count-in-polygon.jpg',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ hình vẽ và bốn ý a–d do game sinh']]
                },
                'g4-m-angle-drag-classify': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo bốn hình góc a–d, gồm đủ góc nhọn, vuông, tù và bẹt. Học sinh kéo tên loại góc vào đúng ô; mỗi ý đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên bốn hình góc và các ô kéo thả.',
                    previewImage: 'angle-drag-classify.jpg',
                    type: 'Kéo thả',
                    variables: [['{question}', 'toàn bộ bốn hình góc và các ô kéo thả do game sinh']]
                },
                'g4-m-angle-clock-classify': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo bốn mặt đồng hồ a–d với góc do kim giờ và kim phút tạo thành. Học sinh kéo đúng loại góc vào mỗi ô; mỗi ý đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên bốn mặt đồng hồ và các ô kéo thả.',
                    previewImage: 'angle-clock-classify.jpg',
                    type: 'Kéo thả',
                    variables: [['{question}', 'toàn bộ bốn mặt đồng hồ và các ô kéo thả do game sinh']]
                },
                'g4-m-angle-count-eight-angles': {
                    defaultPrompt: '{question}',
                    guide: 'Tạo một bảng gồm 8 góc và bốn ý a–d để đếm từng loại góc. Tổng bốn đáp án luôn bằng 8; mỗi ý đúng được 0,25 điểm.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên bảng 8 góc cùng bốn ô điền.',
                    previewImage: 'angle-count-eight-angles.jpg',
                    type: 'Điền khuyết',
                    variables: [['{question}', 'toàn bộ bảng 8 góc và bốn ý a–d do game sinh']]
                },
                'number.match_number_words': {
                    defaultPrompt: 'Hãy nối mỗi số với cách đọc đúng.',
                    guide: 'Tạo bài đối chiếu số với cách đọc tương ứng. Hai cột có số lượng mục lệch nhau một để tạo một lựa chọn nhiễu.',
                    hint: 'Dùng <code>{question}</code> để giữ nguyên yêu cầu nối số với cách đọc.',
                    previewImage: 'match-number-words.jpg',
                    type: 'Đối chiếu trùng khớp',
                    variables: [['{question}', 'câu mặc định đầy đủ (xem trong ô Câu hỏi)']]
                }
        },
        renderTemplatePreview(generator) {
            const preview = (title, content, variant = '', score = '4 câu con · 0,25 điểm/câu') => `<section class="template-preview__canvas ${variant}" aria-label="Minh họa giao diện khi học sinh làm bài"><div class="template-preview__topbar"><span>Minh họa giao diện học sinh</span><span>${score}</span></div><div class="template-preview__question">${title}</div>${content}</section>`;
            const fillRows = rows => `<div class="template-preview__rows">${rows.map((row, index) => `<div class="template-preview__line"><b>${'abcd'[index]})</b><span>${row}</span></div>`).join('')}</div>`;
            const blank = '<i class="template-preview__blank" aria-label="Ô điền đáp án"></i>';
            const choices = values => `<div class="template-preview__choices">${values.map((value, index) => `<span><b>${'ABCD'[index]}</b>${value}</span>`).join('')}</div>`;
            const arithmeticRows = ['125 + ___ = 368', '720 − ___ = 415', '24 × 3 = ___', '144 : 12 = ___'];
            if (generator === 'g4-m-add-sub-multi-digit') return preview('Đặt tính rồi tính:', fillRows([`45 728 + 13 564 = ${blank}`, `80 934 − 27 658 = ${blank}`, `62 417 + 25 306 = ${blank}`, `91 205 − 48 739 = ${blank}`]), 'template-preview--fill');
            if (generator === 'g4-m-add-sub-word-problem') return preview('Thư viện có 3 825 quyển sách, đã cho mượn 1 468 quyển. Thư viện còn lại bao nhiêu quyển sách?', `<p class="template-preview__answer-line">Trả lời: ${blank} quyển sách</p>`, 'template-preview--fill', '1 câu · 1 điểm');
            if (generator === 'g4-m-add-sub-missing-term') return preview('Điền số thích hợp vào chỗ trống:', fillRows([`${blank} + 27 584 = 63 902`, `82 460 − ${blank} = 31 725`, `${blank} − 18 946 = 42 381`, `36 508 + 14 295 = ${blank}`]), 'template-preview--fill');
            if (generator === 'g4-m-add-sub-missing-digit') return preview('Điền chữ số thích hợp vào ô trống:', fillRows([`4${blank}7 + 238 = 695`, `8${blank}2 − 346 = 506`, `2 5${blank} + 1 430 = 3 970`, `7 0${blank} − 285 = 422`]), 'template-preview--fill');
            if (generator === 'g4-m-addition-property-fill') return preview('Điền số thích hợp vào chỗ trống:', fillRows([`37 + 58 = 58 + ${blank}`, `(125 + 75) + 40 = 125 + (${blank} + 40)`, `6 230 + 0 = ${blank}`, `4 809 + 191 = ${blank} + 4 809`]), 'template-preview--fill');
            if (generator === 'g4-m-add-sub-expression') return preview('Tính giá trị của biểu thức:', fillRows([`12 580 + 3 420 − 2 165 = ${blank}`, `48 000 − 17 258 + 9 421 = ${blank}`, `6 735 + 8 265 − 4 500 = ${blank}`, `90 000 − 32 458 − 7 542 = ${blank}`]), 'template-preview--fill');
            if (generator === 'g4-m-sum-difference-direct') return preview('Hai số có tổng là 84 và hiệu là 18. Tìm hai số đó.', `<div class="template-preview__rows"><div class="template-preview__line"><span>Số lớn: ${blank}</span></div><div class="template-preview__line"><span>Số bé: ${blank}</span></div></div>`, 'template-preview--fill', '2 đáp án · 0,5 điểm/đáp án');
            if (generator === 'g4-m-sum-difference-context') return preview('Hai lớp trồng được 156 cây. Lớp 4A trồng nhiều hơn lớp 4B 24 cây. Hỏi mỗi lớp trồng được bao nhiêu cây?', `<div class="template-preview__rows"><div class="template-preview__line"><span>Lớp 4A: ${blank} cây</span></div><div class="template-preview__line"><span>Lớp 4B: ${blank} cây</span></div></div>`, 'template-preview--fill', '2 đáp án · 0,5 điểm/đáp án');
            if (generator === 'g4-m-add-sub-true-false') return preview('Chọn Đúng hoặc Sai cho mỗi nhận định:', `<div class="template-preview__true-false">${['48 279 + 21 721 = 70 000.', '90 000 − 36 425 = 53 575.', '15 820 + 4 180 = 21 000.', '72 300 − 18 900 = 54 400.'].map((row, index) => `<div><b>${'ABCD'[index]}.</b><span>${row}</span><em>ĐÚNG</em><i>SAI</i></div>`).join('')}</div>`, 'template-preview--true-false');
            if (generator === 'number.compose_from_places') return preview('Hãy điền số thích hợp vào chỗ trống:', fillRows([
                `Số gồm 4 chục nghìn, 2 nghìn, 5 trăm và 3 chục là ${blank}`,
                `Số gồm 8 nghìn, 6 trăm và 4 đơn vị là ${blank}`,
                `Số gồm 7 chục nghìn, 1 trăm và 9 đơn vị là ${blank}`,
                `Số gồm 5 nghìn, 3 chục và 2 đơn vị là ${blank}`
            ]), 'template-preview--fill');
            if (generator === 'number.missing_expanded_addend') return preview('Hãy điền số thích hợp vào chỗ trống:', fillRows([
                `33 471 = 30 000 + 3 000 + ${blank} + 70 + 1`,
                `75 850 = 70 000 + 5 000 + 800 + ${blank}`,
                `86 209 = 80 000 + 6 000 + ${blank} + 9`,
                `42 135 = 40 000 + ${blank} + 100 + 30 + 5`
            ]), 'template-preview--fill');
            if (generator === 'number.neighbor_numbers') return preview('Điền số liền trước và số liền sau:', fillRows([
                `${blank} ; 42 135 ; ${blank}`,
                `${blank} ; 80 000 ; ${blank}`,
                `${blank} ; 99 999 ; ${blank}`,
                `${blank} ; 7 208 ; ${blank}`
            ]), 'template-preview--fill');
            if (generator === 'number.four_operations_fill_blanks' || generator === 'number.four_arithmetic_blanks') return preview('Hãy điền số thích hợp vào chỗ trống:', fillRows(arithmeticRows.map(row => row.replace('___', blank))), 'template-preview--fill');
            if (generator === 'number.four_operations_expressions') return preview('Tính giá trị của biểu thức:', `<div class="template-preview__expression-grid">${['172 + 234 + 171', '128 : 8 + 5', '829 − (886 − 447)', '28 × 18 : 9'].map((row, index) => `<div class="template-preview__expression template-preview__expression--${index + 1}"><b>${'abcd'[index]})</b>${row} = ${blank}</div>`).join('')}</div>`, 'template-preview--expression');
            if (generator === 'number.compare_number_forms' || generator === 'number.four_arithmetic_comparisons') return preview('Điền dấu thích hợp:', fillRows([
                '8 563 <i class="template-preview__drop">?</i> 8 000 + 500 + 60 + 3',
                '34 000 <i class="template-preview__drop">?</i> 33 979',
                '17 784 − 4 884 <i class="template-preview__drop">?</i> 16 033 + 18 927',
                '60 000 + 700 <i class="template-preview__drop">?</i> 60 700'
            ]), 'template-preview--comparison');
            if (generator === 'number.place_value_true_false') return preview('Chọn Đúng/Sai?', `<div class="template-preview__true-false">${['Trong số 14 021 983, chữ số 4 thuộc lớp triệu.', 'Trong số 14 021 983, chữ số 1 ở hàng chục.', 'Trong số 14 021 983, chữ số 9 thuộc lớp đơn vị.', 'Trong số 14 021 983, chữ số 0 ở hàng trăm nghìn.'].map((row, index) => `<div><b>${'ABCD'[index]}.</b><span>${row}</span><em>ĐÚNG</em><i>SAI</i></div>`).join('')}</div>`, 'template-preview--true-false');
            if (generator === 'number.match_number_words') return preview('Hãy nối mỗi số với cách đọc đúng.', `<div class="template-preview__matching"><div><span>12 405</span><span>87 160</span><span>305 908</span><span>61 024</span></div><div><span>Mười hai nghìn bốn trăm linh năm</span><span>Tám mươi bảy nghìn một trăm sáu mươi</span><span>Ba trăm linh năm nghìn chín trăm linh tám</span><span>Sáu mươi mốt nghìn không trăm hai mươi tư</span></div></div>`, 'template-preview--matching');
            if (generator === 'number.safe_password_by_place_value') return preview('Hãy chọn mật khẩu mở khóa két sắt đúng cho mỗi yêu cầu.', `<div class="template-preview__safe"><div class="template-preview__safe-icon">🔒</div><div><p>a) Chữ số hàng chục khác 0 và hàng trăm khác 3.</p>${choices(['123 097', '181 675', '627 091', '154 634'])}</div></div>`, 'template-preview--safe');
            if (generator === 'number.natural_sequence') return preview('Điền số thích hợp vào mỗi dãy:', fillRows(['12 000, ___, 16 000, ___, 20 000', '84 000, 78 000, ___, ___, 60 000', '1 250, ___, 1 650, ___, 2 050', '7 000 000, ___, ___, 6 979 000, 6 972 000'].map(row => row.replaceAll('___', blank))), 'template-preview--fill');
            const question = generator === 'number.smallest_of_four' ? 'Hãy tìm số bé nhất trong các số sau.' : generator === 'number.largest_of_four' ? 'Hãy tìm số lớn nhất trong các số sau.' : 'Số nào dưới đây có chữ số hàng trăm là 8?';
            return preview(question, `<div class="template-preview__mc">${['15 870|90 435|12 345|9 403', '24 680|18 405|32 901|27 150', '57 281|63 405|81 720|40 913', '18 563|72 108|35 842|96 321'].map((row, index) => `<div><b>${'abcd'[index]})</b>${choices(row.split('|'))}</div>`).join('')}</div>`, 'template-preview--multiple-choice');
        },
        showTemplateExample() {
            const generator = document.getElementById('template-generator')?.value;
            const preset = this.templatePresets[generator] || this.templatePresets['number.digit_at_place'];
            const target = document.getElementById('template-example');
            const guide = document.getElementById('template-guide-copy');
            const hint = document.getElementById('template-prompt-hint');
            const variables = document.getElementById('template-variables');
            if (target) {
                const previewImage = preset.previewImage || 'digit-at-place.jpg';
                const previewLabel = document.querySelector('#template-generator option:checked')?.textContent || preset.type || 'câu hỏi';
                const previewContent = preset.preview === 'live'
                    ? this.renderTemplatePreview(generator)
                    : `<img class="template-editor__preview-image" src="./src/assets/template-previews/${app.data.sanitizeHTML(previewImage)}" alt="Giao diện thực tế của template ${app.data.sanitizeHTML(previewLabel)}" loading="lazy" decoding="async">`;
                target.innerHTML = `<div class="template-editor__preview-heading"><span aria-hidden="true">🖼️</span><b>Giao diện khi học sinh làm bài</b></div>${previewContent}`;
            }
            if (guide) guide.textContent = preset.guide;
            if (hint) hint.innerHTML = preset.hint;
            if (variables) variables.innerHTML = `<b>Biến có thể chèn</b><div>${preset.variables.map(([token, description]) => `<button type="button" class="template-variable" title="${app.data.sanitizeHTML(description)}" onclick="app.admin.insertTemplateVariable('${token}')"><code>${token}</code><span>${app.data.sanitizeHTML(description)}</span></button>`).join('')}</div>`;
            const questionType = document.getElementById('template-question-type');
            if (questionType && preset.type) questionType.value = preset.type;
            document.querySelectorAll('.template-editor__rule--digit-controls').forEach(rule => { rule.hidden = generator !== 'number.digit_at_place'; });
            const isFourArithmetic = ['number.four_operations_fill_blanks', 'number.four_operations_expressions', 'number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'].includes(generator);
            const isAngleTemplate = ['g4-m-angle-count-in-polygon', 'g4-m-angle-drag-classify', 'g4-m-angle-clock-classify', 'g4-m-angle-count-eight-angles'].includes(generator);
            const topic5DigitRange = ['g4-m-add-sub-multi-digit', 'g4-m-add-sub-missing-term', 'g4-m-add-sub-missing-digit', 'g4-m-add-sub-expression'].includes(generator);
            const isTopic5Template = ['g4-m-add-sub-multi-digit', 'g4-m-add-sub-word-problem', 'g4-m-add-sub-missing-term', 'g4-m-add-sub-missing-digit', 'g4-m-addition-property-fill', 'g4-m-add-sub-expression', 'g4-m-sum-difference-direct', 'g4-m-sum-difference-context', 'g4-m-add-sub-true-false'].includes(generator);
            document.querySelectorAll('.template-editor__rule--range-controls').forEach(rule => { rule.hidden = generator === 'number.match_number_words' || isFourArithmetic || generator === 'number.safe_password_by_place_value' || isAngleTemplate || (isTopic5Template && !topic5DigitRange); });
            document.querySelectorAll('.template-editor__rule--safe-password-range-controls').forEach(rule => { rule.hidden = generator !== 'number.safe_password_by_place_value'; });
            document.querySelectorAll('.template-editor__rule--matching-controls').forEach(rule => { rule.hidden = generator !== 'number.match_number_words'; });
            document.querySelectorAll('.template-editor__rule--true-false-controls').forEach(rule => { rule.hidden = generator !== 'number.place_value_true_false'; });
            document.querySelectorAll('.template-editor__rule--natural-sequence-controls').forEach(rule => { rule.hidden = generator !== 'number.natural_sequence'; });
            document.querySelectorAll('.template-editor__rule--four-arithmetic-controls').forEach(rule => { rule.hidden = !isFourArithmetic; });
            document.querySelectorAll('.template-editor__rule--four-arithmetic-layouts').forEach(rule => { rule.hidden = !['number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'].includes(generator); });
            document.querySelectorAll('.template-editor__rule--four-arithmetic-blank-positions').forEach(rule => { rule.hidden = generator !== 'number.four_arithmetic_blanks'; });
            const usesAllFourOperations = ['number.four_operations_fill_blanks', 'number.four_operations_expressions'].includes(generator);
            document.querySelectorAll('#template-arithmetic-operations input').forEach(input => {
                if (usesAllFourOperations) input.checked = true;
                input.disabled = usesAllFourOperations;
            });
            const arithmeticLegend = document.querySelector('#template-arithmetic-operations')?.closest('fieldset')?.querySelector('legend');
            if (arithmeticLegend) arithmeticLegend.textContent = usesAllFourOperations ? 'Bốn phép tính dùng trong mỗi lượt' : 'Phép tính có thể bốc';
            document.querySelectorAll('.template-editor__rule--safe-password-controls').forEach(rule => { rule.hidden = generator !== 'number.safe_password_by_place_value'; });
            document.querySelectorAll('.template-editor__rule--safe-password-class-controls').forEach(rule => { rule.hidden = generator !== 'number.safe_password_by_place_value'; });
            document.querySelectorAll('.template-editor__rule--angle-info').forEach(rule => { rule.hidden = !isAngleTemplate; });
        },
        insertTemplateVariable(token) {
            const input = document.getElementById('template-prompt');
            if (!input) return;
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? start;
            input.value = `${input.value.slice(0, start)}${token}${input.value.slice(end)}`;
            input.focus();
            input.setSelectionRange(start + token.length, start + token.length);
        },
        collectTemplateForm() {
            const value = id => document.getElementById(id).value.trim();
            const allowedPlaces = [...document.querySelectorAll('.template-checkbox')].filter(input => input.checked && ['ones','tens','hundreds','thousands','tenThousands','hundredThousands','millions','tenMillions','hundredMillions','billions','tenBillions','hundredBillions'].includes(input.value)).map(input => input.value);
            const allowedDigits = [...document.querySelectorAll('.template-checkbox')].filter(input => input.checked && /^\d$/.test(input.value)).map(input => Number(input.value));
            const generatorKey = value('template-generator');
            const topic5TemplateKeys = ['g4-m-add-sub-multi-digit', 'g4-m-add-sub-word-problem', 'g4-m-add-sub-missing-term', 'g4-m-add-sub-missing-digit', 'g4-m-addition-property-fill', 'g4-m-add-sub-expression', 'g4-m-sum-difference-direct', 'g4-m-sum-difference-context', 'g4-m-add-sub-true-false'];
            const isTopic5Template = topic5TemplateKeys.includes(generatorKey);
            const topic5DigitRange = ['g4-m-add-sub-multi-digit', 'g4-m-add-sub-missing-term', 'g4-m-add-sub-missing-digit', 'g4-m-add-sub-expression'].includes(generatorKey);
            const safePasswordMinLength = Math.max(2, Math.min(12, Number(document.getElementById('template-safe-password-min-length')?.value || 9)));
            const safePasswordMaxLength = Math.max(2, Math.min(12, Number(document.getElementById('template-safe-password-max-length')?.value || 9)));
            const selectedSafeValues = group => [...document.querySelectorAll(`.template-checkbox[data-template-group="${group}"]`)].filter(input => input.checked).map(input => input.value);
            const condition1Places = selectedSafeValues('safe-condition1-places');
            const condition2Places = selectedSafeValues('safe-condition2-places');
            const condition1Digits = selectedSafeValues('safe-condition1-digits').map(Number);
            const condition2Digits = selectedSafeValues('safe-condition2-digits').map(Number);
            const condition1Classes = selectedSafeValues('safe-condition1-classes');
            const condition2Classes = selectedSafeValues('safe-condition2-classes');
            const condition1Scope = generatorKey === 'number.safe_password_by_place_value' ? 'random' : (value('template-safe-password-condition1-scope') || 'place');
            const condition2Scope = 'place';
            const statementKinds = selectedSafeValues('true-false-kinds');
            const arithmeticMinimumDigits = Number(document.getElementById('template-arithmetic-min-digits')?.value || 2);
            const arithmeticMaximumDigits = Number(document.getElementById('template-arithmetic-max-digits')?.value || 9);
            const arithmeticOperations = selectedSafeValues('arithmetic-operations');
            const arithmeticLayouts = selectedSafeValues('arithmetic-layouts');
            const arithmeticBlankPositions = selectedSafeValues('arithmetic-blank-positions');
            const minimumDigits = Number(document.getElementById('template-minimum-digits')?.value || 1);
            const maximumDigits = Number(document.getElementById('template-maximum-digits')?.value || 1);
            if (generatorKey === 'number.safe_password_by_place_value' && safePasswordMinLength > safePasswordMaxLength) throw new Error('Số chữ số ít nhất không được lớn hơn số chữ số nhiều nhất.');
            const isSafePassword = generatorKey === 'number.safe_password_by_place_value';
            const isAngleTemplate = ['g4-m-angle-count-in-polygon', 'g4-m-angle-drag-classify', 'g4-m-angle-clock-classify', 'g4-m-angle-count-eight-angles'].includes(generatorKey);
            const enteredMinimum = isSafePassword ? app.data.parseMathNumber(value('template-minimum')) : 10 ** (minimumDigits - 1);
            const enteredMaximum = isSafePassword ? app.data.parseMathNumber(value('template-maximum')) : 10 ** maximumDigits - 1;
            const usesDigitCount = !isSafePassword && !isAngleTemplate && generatorKey !== 'number.match_number_words' && !['number.four_operations_fill_blanks', 'number.four_operations_expressions', 'number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'].includes(generatorKey) && (!isTopic5Template || topic5DigitRange);
            const genericConfig = { minimum: enteredMinimum, maximum: enteredMaximum, ...(usesDigitCount ? { minimumDigits, maximumDigits } : {}), allowedPlaces, allowedDigits, statementKinds, minimumCodeLength: safePasswordMinLength, maximumCodeLength: safePasswordMaxLength, condition1Scope, condition1Places, condition1Classes, condition1Digits, condition2Scope, condition2Places, condition2Classes, condition2Digits };
            const topic5Config = topic5DigitRange ? { minimumDigits, maximumDigits } : {};
            const templateConfig = isAngleTemplate ? {} : (isTopic5Template ? topic5Config : genericConfig);
            const selectedLesson = this.normalizeAdminLesson(document.getElementById('template-lesson')?.value || '');
            const template = { name: value('template-name'), classlevel: value('template-class'), subject: value('template-subject'), semester: value('template-semester'), topic: value('template-topic'), question_type: value('template-question-type'), generator_key: generatorKey, prompt_template: value('template-prompt'), config: templateConfig, is_active: true };
            if (!template.name || !template.prompt_template) throw new Error('Hãy nhập tên và câu hỏi.');
            const knownVariables = new Set((this.templatePresets[template.generator_key]?.variables || (generatorKey === 'number.natural_sequence' ? [['{question}'], ['{sequence}'], ['{step}'], ['{direction}'], ['{blank}']] : [])).map(([token]) => token.slice(1, -1)));
            const unknownVariables = [...template.prompt_template.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(([, variable]) => variable).filter(variable => !knownVariables.has(variable));
            if (unknownVariables.length) throw new Error(`Biến chưa được hỗ trợ: ${[...new Set(unknownVariables)].map(variable => `{${variable}}`).join(', ')}.`);
            if (template.generator_key === 'number.digit_at_place' && (!allowedPlaces.length || !allowedDigits.length)) throw new Error('Hãy chọn ít nhất một hàng cùng một chữ số.');
            if (template.generator_key === 'number.place_value_true_false' && !statementKinds.length) throw new Error('Hãy chọn ít nhất một loại nhận định: lớp hoặc hàng.');
            if (template.generator_key === 'number.natural_sequence') {
                const sequenceMinimum = Number(value('template-natural-sequence-minimum'));
                const sequenceMaximum = Number(value('template-natural-sequence-maximum'));
                const allowedSteps = value('template-natural-sequence-steps').split(',').map(item => Number(item.trim())).filter(Number.isSafeInteger);
                const sequenceLengthMin = Number(value('template-natural-sequence-length-min'));
                const sequenceLengthMax = Number(value('template-natural-sequence-length-max'));
                const blankCountMin = Number(value('template-natural-sequence-blank-min'));
                const blankCountMax = Number(value('template-natural-sequence-blank-max'));
                if (!Number.isSafeInteger(sequenceMinimum) || !Number.isSafeInteger(sequenceMaximum) || sequenceMinimum < 0 || sequenceMinimum >= sequenceMaximum) throw new Error('Phạm vi dãy số không hợp lệ.');
                if (!allowedSteps.length || allowedSteps.some(step => step === 0)) throw new Error('Bước nhảy phải là các số nguyên khác 0, ngăn cách bằng dấu phẩy.');
                if (!Number.isInteger(sequenceLengthMin) || !Number.isInteger(sequenceLengthMax) || sequenceLengthMin < 5 || sequenceLengthMax < sequenceLengthMin) throw new Error('Dãy số phải có ít nhất 5 số.');
                if (!Number.isInteger(blankCountMin) || !Number.isInteger(blankCountMax) || blankCountMin < 1 || blankCountMax < blankCountMin || blankCountMax > sequenceLengthMin - 2) throw new Error('Số ô trống phải để lại ít nhất hai số đã biết.');
                template.config = { minimum: sequenceMinimum, maximum: sequenceMaximum, allowedSteps, sequenceLengthMin, sequenceLengthMax, blankCountMin, blankCountMax };
            }
            if (usesDigitCount && (!Number.isInteger(minimumDigits) || !Number.isInteger(maximumDigits) || minimumDigits < 1 || maximumDigits > 12 || minimumDigits > maximumDigits)) throw new Error('Số lượng chữ số phải là số nguyên từ 1 đến 12 và số ít nhất không được lớn hơn số nhiều nhất.');
            if (['number.four_operations_fill_blanks', 'number.four_operations_expressions', 'number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'].includes(template.generator_key)) {
                if (!Number.isInteger(arithmeticMinimumDigits) || !Number.isInteger(arithmeticMaximumDigits) || arithmeticMinimumDigits < 2 || arithmeticMaximumDigits > 9 || arithmeticMinimumDigits > arithmeticMaximumDigits) throw new Error('Số chữ số phải từ 2 đến 9 và số ít nhất không lớn hơn số nhiều nhất.');
                const requiresLayouts = ['number.four_arithmetic_blanks', 'number.four_arithmetic_comparisons'].includes(template.generator_key);
                if (!arithmeticOperations.length || (requiresLayouts && !arithmeticLayouts.length)) throw new Error(requiresLayouts ? 'Hãy chọn ít nhất một phép tính và một dạng hiển thị hai vế.' : 'Hãy chọn đủ bốn phép tính cộng, trừ, nhân, chia.');
                if (['number.four_operations_fill_blanks', 'number.four_operations_expressions'].includes(template.generator_key) && (arithmeticOperations.length !== 4 || new Set(arithmeticOperations).size !== 4)) throw new Error('Template này cần đủ bốn phép cộng, trừ, nhân, chia cho 4 ý a–d.');
                if (template.generator_key === 'number.four_arithmetic_blanks' && !arithmeticBlankPositions.length) throw new Error('Hãy chọn ít nhất một vị trí ô trống.');
                if (template.generator_key === 'number.four_arithmetic_blanks' && arithmeticBlankPositions.every(position => position === 'fourth') && !arithmeticLayouts.includes('twoExpressions')) throw new Error('Vị trí “Số thứ tư” chỉ dùng khi chọn dạng “Hai vế đều là phép tính”.');
                template.config = { minimum: 10 ** (arithmeticMinimumDigits - 1), maximum: 10 ** arithmeticMaximumDigits - 1, minimumDigits: arithmeticMinimumDigits, maximumDigits: arithmeticMaximumDigits, operations: arithmeticOperations, ...(requiresLayouts ? { layouts: arithmeticLayouts } : {}), ...(template.generator_key === 'number.four_arithmetic_blanks' ? { blankPositions: arithmeticBlankPositions } : {}) };
            }
            if (template.generator_key === 'number.safe_password_by_place_value') {
                const target1 = condition1Scope === 'random' ? [...condition1Classes, ...condition1Places] : (condition1Scope === 'class' ? condition1Classes : condition1Places);
                const target2 = condition2Places;
                if (!target1.length || !condition1Digits.length || !target2.length || !condition2Digits.length) throw new Error('Mỗi điều kiện mở két cần chọn ít nhất một lớp hoặc một hàng, cùng một chữ số.');
                if (!Number.isInteger(enteredMinimum) || !Number.isInteger(enteredMaximum) || enteredMinimum < 0 || enteredMaximum < enteredMinimum || enteredMaximum > 10 ** safePasswordMaxLength - 1) throw new Error(`Phạm vi mật khẩu phải là số nguyên từ 0 đến ${app.data.formatMathNumber(10 ** safePasswordMaxLength - 1)}.`);
                const classMinimumLength = { unitsClass: 3, thousandsClass: 6, millionsClass: 9 };
                for (const [index, scope, classes] of [[1, condition1Scope, condition1Classes], [2, condition2Scope, condition2Classes]]) {
                    if (scope === 'class' && Math.min(...classes.map(key => classMinimumLength[key] || Infinity)) > safePasswordMinLength) {
                        throw new Error(`Điều kiện ${index} theo lớp cần mật khẩu ít nhất ${Math.min(...classes.map(key => classMinimumLength[key] || Infinity))} chữ số để có đủ ba hàng của lớp.`);
                    }
                }
            }
            if (template.generator_key === 'number.match_number_words') {
                const shapes = value('template-match-shapes').split(',').map(item => item.trim()).filter(Boolean);
                const digits = value('template-match-digits').split(',').map(item => Number(item.trim())).filter(Number.isInteger);
                const weightText = value('template-match-weights');
                if (!shapes.length || shapes.some(shape => !/^\d+:\d+$/.test(shape) || Math.abs(Number(shape.split(':')[0]) - Number(shape.split(':')[1])) !== 1)) throw new Error('Dạng ghép phải như 5:4 hoặc 4:5 và lệch đúng một mục.');
                if (!digits.length || digits.some(digit => digit < 1 || digit > 9)) throw new Error('Độ dài số chỉ nhận các số nguyên từ 1 đến 9.');
                if (weightText && !/^\d+\s*:\s*\d+(\s*,\s*\d+\s*:\s*\d+)*$/.test(weightText)) throw new Error('Tỷ lệ sinh số dùng dạng 7:20, 8:30, 9:50.');
                const seedText = value('template-match-seed');
                const prefixWords = Number(value('template-match-prefix'));
                if (!Number.isInteger(prefixWords) || prefixWords < 0 || (seedText && !Number.isInteger(Number(seedText)))) throw new Error('Từ tiền tố chung và seed phải là số nguyên hợp lệ.');
                template.config = { shapes, digits: [...new Set(digits)], digitStrategy: value('template-match-strategy'), digitWeights: weightText ? Object.fromEntries(weightText.split(',').map(item => item.split(':').map(part => Number(part.trim())))) : null, prefixWords, seed: seedText === '' ? null : Number(seedText) };
            }
            if (selectedLesson) template.config.lesson = selectedLesson;
            if (!window.Grade4MathTemplates?.templateIds?.includes(template.generator_key)) throw new Error('Template này chưa được cài trong mã nguồn game.');
            if (!isAngleTemplate && !isTopic5Template && template.generator_key !== 'number.match_number_words' && (!Number.isInteger(template.config.minimum) || !Number.isInteger(template.config.maximum) || template.config.minimum < 0 || template.config.minimum >= template.config.maximum)) throw new Error('Số nhỏ nhất phải nhỏ hơn số lớn nhất.');
            const metadataError = app.data.validateQuestionMetadata(template);
            if (metadataError) throw new Error(metadataError);
            return template;
        },
        async saveTemplate(editIndex, asCopy = false) {
            let template;
            try { template = this.collectTemplateForm(); } catch (error) { alert(error.message); return; }
            if (!app.data.questionTemplates[editIndex]) return alert('Không tìm thấy template gốc.');
            const isUpdate = !asCopy;
            if (window.supabase && (!isUpdate || !app.data.questionTemplates[editIndex].id.startsWith('temp_'))) {
                const query = isUpdate ? supabaseClient.from('question_templates').update(template).eq('id', app.data.questionTemplates[editIndex].id) : supabaseClient.from('question_templates').insert([template]);
                const { data, error } = await query.select();
                if (error || !data?.[0]) { alert('Không thể lưu template trên server. Hãy chạy file SQL tạo bảng trước.'); return; }
                if (isUpdate) app.data.questionTemplates[editIndex] = data[0]; else app.data.questionTemplates.push(data[0]);
            } else {
                if (isUpdate) template.id = app.data.questionTemplates[editIndex].id; else template.id = `temp_${Date.now()}`;
                if (isUpdate) app.data.questionTemplates[editIndex] = template; else app.data.questionTemplates.push(template);
            }
            this.switchTab('templates');
        },
        async deleteTemplate(index) {
            const template = app.data.questionTemplates[index];
            if (!template || !confirm(`Xóa template “${template.name}”?`)) return;
            if (window.supabase && !template.id.startsWith('temp_')) {
                const { error } = await supabaseClient.from('question_templates').delete().eq('id', template.id);
                if (error) { alert('Không thể xóa template trên server.'); return; }
            }
            app.data.questionTemplates.splice(index, 1);
            this.renderTemplates(this.getComposerContentBox());
        },
        renderQuestions(box) {
            box.innerHTML = `
          <div style="margin-bottom:15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; display:flex; gap:10px; flex-wrap:wrap;">
             <div style="display:flex; width:100%; gap: 10px;">
                 <button class="btn-primary" id="btn-q-lib" style="flex:1; margin:0;" onclick="app.admin.renderQSubTab('lib')">Thư viện</button>
                 <div id="q-count-indicator" style="flex:1; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius: 4px; font-weight: bold; color: #ffeb3b; font-size: 1rem;"></div>
             </div>
             <button class="btn-danger" id="btn-q-bulk-del" style="display:none;" onclick="app.admin.bulkDeleteQuestions()">Xóa các câu đã chọn (0)</button>
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
            ['lib', 'add', 'tpl', 'exp', 'imp'].forEach(t => {
                const el = document.getElementById('btn-q-' + t);
                if (el) el.className = (t === tab) ? 'btn-primary' : 'btn-opt';
            });
            const subBox = document.getElementById('admin-q-subarea');

            if (tab === 'lib') {
                const cols = [
                    { label: '<input type="checkbox" id="q-select-all" onclick="app.admin.toggleAllQSelect(this)">', filterable: false },
                    { label: 'Cấp lớp', filterable: true },
                    { label: 'Môn', filterable: true },
                    { label: 'Học kỳ', filterable: true },
                    { label: 'Chủ đề', filterable: true },
                    { label: 'Bài học', filterable: true },
                    { label: 'Loại câu hỏi', filterable: true },
                    { label: 'Câu hỏi', filterable: true },
                    { label: 'Đáp án', filterable: false },
                    { label: 'Lời giải', filterable: false },
                    { label: 'Hành động', filterable: false }
                ];
                let html = app.ui.renderTable(cols, app.data.libraryQuestions, (q, i) => {
                    return `<tr>
              <td><input type="checkbox" class="q-select-cb" value="${i}" onchange="app.admin.updateBulkDeleteLabel()"></td>
              <td>${q.classlevel || 'Lớp 5'}</td><td>${q.subject}</td><td>${q.semester || ''}</td><td>${q.topic}</td><td>${app.data.sanitizeHTML(this.lessonLabel(q.lesson) || '—')}</td>
              <td>${q.type || 'Trắc nghiệm'}</td>
                <td>${app.data.formatMathHTML(q.q)}</td><td>${app.data.formatMathText(q.ans)}</td><td>${app.data.formatMathText(q.explanation || '')}</td>
              <td>
                ${app.ui.compactAction('Thêm vào đề', `app.admin.addToExamPrompt(${i})`, 'compact-admin-action--add')}
                ${app.ui.compactAction('Sửa', `app.admin.editQuestion(${i})`, 'compact-admin-action--edit')}
                ${app.ui.compactAction('Xóa', `app.admin.deleteQuestion(${i})`, 'compact-admin-action--delete')}
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
                   <select id="add-q-sem" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.updateTopicDropdown()">
                     <option value="Học kỳ 1" ${q && q.semester === 'Học kỳ 1' ? 'selected' : (!q ? 'selected' : '')}>Học kỳ 1</option>
                     <option value="Học kỳ 2" ${q && q.semester === 'Học kỳ 2' ? 'selected' : ''}>Học kỳ 2</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Chủ đề</label>
                  <select id="add-q-topic" class="form-input" style="flex:1; padding:8px;" data-selected="${q ? q.topic : ''}" onchange="app.admin.updateQuestionLessonDropdown()">
                  </select>
               </div>

               <div id="add-q-lesson-field" class="admin-curriculum-field" hidden>
                  <label for="add-q-lesson">Bài học</label>
                  <select id="add-q-lesson" class="form-input" data-selected="${app.data.sanitizeHTML(q?.lesson || '')}"></select>
                  <small>Chỉ dùng cho Lớp 4 – Toán; để trống nếu câu hỏi áp dụng cho cả Chủ đề.</small>
               </div>

               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Loại câu hỏi</label>
                  <select id="add-q-type" class="form-input" style="flex:1; padding:8px;" onchange="app.admin.toggleQuestionType('add-q')">
                     <option value="Trắc nghiệm" ${q && q.type === 'Trắc nghiệm' ? 'selected' : (!q ? 'selected' : '')}>Trắc nghiệm</option>
                     <option value="Điền khuyết" ${q && q.type === 'Điền khuyết' ? 'selected' : ''}>Điền khuyết</option>
                     <option value="Đúng/Sai" ${q && q.type === 'Đúng/Sai' ? 'selected' : ''}>Đúng/Sai</option>
                     <option value="So sánh" ${q && q.type === 'So sánh' ? 'selected' : ''}>So sánh</option>
                     <option value="Chuỗi Quy luật" ${q && q.type === 'Chuỗi Quy luật' ? 'selected' : ''}>Chuỗi Quy luật</option>
                     <option value="Kéo thả" ${q && q.type === 'Kéo thả' ? 'selected' : ''}>Kéo thả</option>
                     <option value="Đối chiếu trùng khớp" ${q && q.type === 'Đối chiếu trùng khớp' ? 'selected' : ''}>Đối chiếu trùng khớp</option>
                  </select>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Nội dung câu hỏi</label>
                  <textarea id="add-q-q" oninput="app.admin.formatQuestionNumberText(this)" placeholder="Nội dung câu hỏi" class="form-input" style="flex:1; padding:8px; height:60px;">${q ? app.data.formatMathHTML(q.q) : ''}</textarea>
               </div>

               <div id="add-q-opts-wrapper" style="display: ${q && q.type && q.type !== 'Trắc nghiệm' && q.type !== 'Kéo thả' ? 'none' : 'block'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 1</label>
                     <input type="text" id="add-q-opt1" oninput="app.admin.formatQuestionNumberText(this)" placeholder="Trả lời 1" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[0] && q.type !== 'Đối chiếu trùng khớp' ? app.data.formatMathText(q.options[0]) : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 2</label>
                     <input type="text" id="add-q-opt2" oninput="app.admin.formatQuestionNumberText(this)" placeholder="Trả lời 2" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[1] && q.type !== 'Đối chiếu trùng khớp' ? app.data.formatMathText(q.options[1]) : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 3</label>
                     <input type="text" id="add-q-opt3" oninput="app.admin.formatQuestionNumberText(this)" placeholder="Trả lời 3" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[2] && q.type !== 'Đối chiếu trùng khớp' ? app.data.formatMathText(q.options[2]) : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0;">Lựa chọn 4</label>
                     <input type="text" id="add-q-opt4" oninput="app.admin.formatQuestionNumberText(this)" placeholder="Trả lời 4" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[3] && q.type !== 'Đối chiếu trùng khớp' ? app.data.formatMathText(q.options[3]) : ''}">
                  </div>
               </div>
               
               <div id="add-q-match-wrapper" style="display: ${q && q.type === 'Đối chiếu trùng khớp' ? 'block' : 'none'}; margin-bottom:10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                  <p style="font-size:0.85rem; color:#aaa; margin-bottom:10px;">Ngăn cách các ô bằng dấu phẩy (Tối đa 5 ô mỗi bên). VD: Mèo, Chó, Gà</p>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0; color:#4ade80;">Cột Trái</label>
                     <input type="text" id="add-q-match-left" placeholder="Mèo, Chó, Gà" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[0] && q.type === 'Đối chiếu trùng khớp' ? q.options[0] : ''}">
                  </div>
                  <div style="display:flex; align-items:center; margin-bottom:5px;">
                     <label style="width:150px; font-weight:bold; flex-shrink:0; color:#60a5fa;">Cột Phải</label>
                     <input type="text" id="add-q-match-right" placeholder="Meo meo, Gâu gâu, Ò ó o, Cục tác" class="form-input" style="flex:1; padding:8px;" value="${q && q.options && q.options[1] && q.type === 'Đối chiếu trùng khớp' ? q.options[1] : ''}">
                  </div>
                  <p style="font-size:0.85rem; color:#f87171; margin-top:10px;">Lưu ý: Ô Đáp án Đúng phải nhập theo cặp, ngăn bằng dấu phẩy. VD: Mèo:Meo meo, Chó:Gâu gâu</p>
               </div>

               <div style="display:flex; align-items:center; margin-bottom:10px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Đáp án đúng</label>
                  <input type="text" id="add-q-ans" oninput="app.admin.formatQuestionNumberText(this)" placeholder="Đáp án đúng (nếu trắc nghiệm phải ghi đúng 1 trong 4 lựa chọn ở trên)" class="form-input" style="flex:1; padding:8px;" value="${q ? app.data.formatMathText(q.ans) : ''}">
               </div>

               <div style="display:flex; align-items:center; margin-bottom:15px;">
                  <label style="width:150px; font-weight:bold; flex-shrink:0;">Lời giải chi tiết</label>
                  <textarea id="add-q-exp" oninput="app.admin.formatQuestionNumberText(this)" placeholder="Lời giải (tùy chọn)" class="form-input" style="flex:1; padding:8px; height:60px;">${q ? app.data.formatMathText(q.explanation || '') : ''}</textarea>
               </div>

               ${app.ui.compactAction(q ? 'Lưu chỉnh sửa' : 'Lưu câu hỏi', `app.admin.submitAddQuestion(${editIdx !== undefined ? editIdx : 'null'})`, 'compact-admin-action--save')}
            </div>
          `;
                setTimeout(() => app.admin.updateTopicDropdown(), 0);
            }
            else if (tab === 'tpl') {
                subBox.innerHTML = `
                <div style="max-width: 500px; margin: 0 auto; text-align:center;">
                   <h3>Chọn loại câu hỏi muốn xuất file mẫu</h3>
                   <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px;">
                      <button class="btn-opt" onclick="app.admin.downloadQTemplate('Trắc nghiệm')">Trắc nghiệm</button>
                      <button class="btn-opt" onclick="app.admin.downloadQTemplate('Điền khuyết')">Điền khuyết</button>
                      <button class="btn-opt" onclick="app.admin.downloadQTemplate('Đúng/Sai')">Đúng/Sai</button>
                      <button class="btn-opt" onclick="app.admin.downloadQTemplate('So sánh')">So sánh</button>
                      <button class="btn-opt" onclick="app.admin.downloadQTemplate('Chuỗi Quy luật')">Chuỗi Quy luật</button>
                      <button class="btn-opt" onclick="app.admin.downloadQTemplate('Kéo thả')">Kéo thả</button>
                      <button class="btn-opt" onclick="app.admin.downloadQTemplate('Đối chiếu trùng khớp')" style="grid-column: span 2;">Đối chiếu trùng khớp</button>
                   </div>
                </div>`;
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
               ${app.ui.compactAction('Tải lên', 'app.admin.submitImportQuestions()', 'compact-admin-action--save')}
            </div>
          `;
            }
        },
        downloadQTemplate(type) {
            let data = [];
            
            const divider = (text) => ({ "Cấp lớp": text, "Môn học": "", "Học kỳ": "", "Chủ đề": "", "Bài học": "", "Loại câu hỏi": "", "Câu hỏi": "", "Lựa chọn": "", "Đáp án đúng": "", "Lời giải chi tiết": "" });

            if (type) {
                data.push(divider("--- HƯỚNG DẪN CÁCH ĐIỀN CÁC CỘT ---"));
                let guide = {
                    "Cấp lớp": "Nhập chính xác: Lớp 1, Lớp 2, Lớp 3, Lớp 4 hoặc Lớp 5",
                    "Môn học": "Nhập chính xác: Toán hoặc Tiếng Việt",
                    "Học kỳ": "Nhập chính xác: Học kỳ 1 hoặc Học kỳ 2",
                    "Chủ đề": "Phải thuộc danh sách các chủ đề hợp lệ (xem phần dưới cùng của file)",
                    "Bài học": "Tùy chọn; chỉ dành cho Lớp 4 – Toán, nhập tên Bài học hoặc mã Bài học",
                    "Loại câu hỏi": type,
                    "Câu hỏi": "",
                    "Lựa chọn": "",
                    "Đáp án đúng": "",
                    "Lời giải chi tiết": "Không bắt buộc (có thể bỏ trống)"
                };
                
                let sample1 = {}, sample2 = {};

                switch (type) {
                    case 'Trắc nghiệm':
                        guide["Câu hỏi"] = "Nội dung câu hỏi trắc nghiệm";
                        guide["Lựa chọn"] = "Nhập các đáp án ngăn cách nhau bằng dấu phẩy (VD: 1, 2, 3, 4)";
                        guide["Đáp án đúng"] = "Nhập chính xác 1 lựa chọn đúng trong số các lựa chọn đã ghi";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Các số đến 10", "Loại câu hỏi": type, "Câu hỏi": "Số nào lớn nhất trong các số sau?", "Lựa chọn": "1, 5, 9, 3",
                            "Đáp án đúng": "9", "Lời giải chi tiết": "Vì 9 > 5 > 3 > 1"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Chữ cái", "Loại câu hỏi": type, "Câu hỏi": "Từ nào sau đây có chứa chữ a?", "Lựa chọn": "con cò, con cá, con ong",
                            "Đáp án đúng": "con cá", "Lời giải chi tiết": "Từ con cá có chữ cá chứa chữ a"
                        };
                        break;
                    case 'Điền khuyết':
                        guide["Câu hỏi"] = "Câu hỏi cần điền, bắt buộc phải có ___ (3 dấu gạch dưới) để làm chỗ trống";
                        guide["Lựa chọn"] = "BỎ TRỐNG (Không cần điền)";
                        guide["Đáp án đúng"] = "Nhập chính xác từ cần điền vào chỗ trống";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Chữ cái", "Loại câu hỏi": type, "Câu hỏi": "Con bò kêu rống ___ ___", "Lựa chọn": "",
                            "Đáp án đúng": "ò ó", "Lời giải chi tiết": ""
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Loại câu hỏi": type, "Câu hỏi": "Kết quả của 5 + ___ = 10", "Lựa chọn": "",
                            "Đáp án đúng": "5", "Lời giải chi tiết": "10 - 5 = 5"
                        };
                        break;
                    case 'Đúng/Sai':
                        guide["Câu hỏi"] = "Đưa ra một nhận định để học sinh phán đoán Đúng hay Sai";
                        guide["Lựa chọn"] = "BỎ TRỐNG";
                        guide["Đáp án đúng"] = "Ghi chính xác: Đúng hoặc Sai";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 3", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Bảng nhân", "Loại câu hỏi": type, "Câu hỏi": "5 x 3 = 15", "Lựa chọn": "",
                            "Đáp án đúng": "Đúng", "Lời giải chi tiết": "Vì 5 x 3 = 15 là phép tính chính xác"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Từ ngữ", "Loại câu hỏi": type, "Câu hỏi": "Từ 'mặt trời' viết sai chính tả.", "Lựa chọn": "",
                            "Đáp án đúng": "Sai", "Lời giải chi tiết": "Từ 'mặt trời' viết đúng chính tả."
                        };
                        break;
                    case 'So sánh':
                        guide["Câu hỏi"] = "Đưa ra 2 vế cần so sánh. Bắt buộc có ___ (3 gạch dưới) ở giữa (VD: 5 ___ 3)";
                        guide["Lựa chọn"] = "BỎ TRỐNG";
                        guide["Đáp án đúng"] = "Ghi 1 trong 3 dấu: <, > hoặc =";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Các số đến 10", "Loại câu hỏi": type, "Câu hỏi": "5 ___ 3", "Lựa chọn": "",
                            "Đáp án đúng": ">", "Lời giải chi tiết": "Vì 5 lớn hơn 3"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Loại câu hỏi": type, "Câu hỏi": "10 + 5 ___ 15", "Lựa chọn": "",
                            "Đáp án đúng": "=", "Lời giải chi tiết": "Vì 10 + 5 = 15"
                        };
                        break;
                    case 'Chuỗi Quy luật':
                        guide["Câu hỏi"] = "Ghi chuỗi quy luật, dùng ___ (3 gạch dưới) cho vị trí cần điền (VD: 2, 4, ___, 8)";
                        guide["Lựa chọn"] = "BỎ TRỐNG";
                        guide["Đáp án đúng"] = "Nhập giá trị cần điền. Nếu có nhiều chỗ trống thì ngăn cách bằng dấu phẩy";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Dãy số", "Loại câu hỏi": type, "Câu hỏi": "2, 4, ___, 8, 10", "Lựa chọn": "",
                            "Đáp án đúng": "6", "Lời giải chi tiết": "Mỗi số cách nhau 2 đơn vị"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 3", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Dãy số", "Loại câu hỏi": type, "Câu hỏi": "1, 2, 4, 7, ___", "Lựa chọn": "",
                            "Đáp án đúng": "11", "Lời giải chi tiết": "Khoảng cách tăng dần: +1, +2, +3, +4"
                        };
                        break;
                    case 'Kéo thả':
                        guide["Câu hỏi"] = "Ghi câu hỏi, dùng ___ (3 gạch dưới) cho những chỗ cần kéo thả từ vào";
                        guide["Lựa chọn"] = "Nhập tất cả các từ khóa cần dùng (ngăn cách bằng phẩy). Có thể nhập từ khóa dư thừa để gây nhiễu";
                        guide["Đáp án đúng"] = "Nhập các từ ĐÚNG, theo đúng thứ tự các chỗ trống, ngăn cách bằng dấu phẩy";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Từ ngữ", "Loại câu hỏi": type, "Câu hỏi": "Con chó sủa ___ ___, con mèo kêu ___ ___.", "Lựa chọn": "gâu, meo, quác, chiếp",
                            "Đáp án đúng": "gâu, gâu, meo, meo", "Lời giải chi tiết": ""
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Loại câu hỏi": type, "Câu hỏi": "2 + 3 = ___. 4 + 1 = ___.", "Lựa chọn": "5, 6, 7",
                            "Đáp án đúng": "5, 5", "Lời giải chi tiết": ""
                        };
                        break;
                    case 'Đối chiếu trùng khớp':
                        guide["Câu hỏi"] = "Nội dung yêu cầu (VD: Hãy nối các từ có nghĩa giống nhau)";
                        guide["Lựa chọn"] = "Phân tách Cột Trái và Cột Phải bằng ký tự |. Các ô mỗi bên ngăn cách bằng dấu phẩy (Tối đa 5 ô mỗi bên). VD: Mèo, Chó | Gâu gâu, Meo meo";
                        guide["Đáp án đúng"] = "Ghi các cặp đáp án, mỗi cặp nối với nhau bằng dấu : (hai chấm). Các cặp ngăn cách bằng dấu phẩy. VD: Mèo:Meo meo, Chó:Gâu gâu";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Từ ngữ", "Loại câu hỏi": type, "Câu hỏi": "Nối con vật với tiếng kêu của nó", "Lựa chọn": "Mèo, Chó, Bò | Rống, Gâu gâu, Meo meo",
                            "Đáp án đúng": "Mèo:Meo meo, Chó:Gâu gâu, Bò:Rống", "Lời giải chi tiết": ""
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Loại câu hỏi": type, "Câu hỏi": "Nối phép tính với kết quả đúng", "Lựa chọn": "2+3, 4+5, 1+1 | 9, 2, 5",
                            "Đáp án đúng": "2+3:5, 4+5:9, 1+1:2", "Lời giải chi tiết": ""
                        };
                        break;
                }
                
                data.push(guide);
                data.push(divider("--- CÁC VÍ DỤ MẪU (BẠN CÓ THỂ XÓA/SỬA CÁC DÒNG NÀY ĐỂ NHẬP CÂU HỎI MỚI) ---"));
                data.push(sample1);
                data.push(sample2);
            }
            
            data.push(divider("--- DANH SÁCH CÁC CHỦ ĐỀ HỢP LỆ THEO TỪNG MÔN/LỚP (DÙNG ĐỂ THAM KHẢO) ---"));

            for (let i = 1; i <= 5; i++) {
                const t = app.constants.topics[String(i)];
                if (t) {
                    const mathTopics = [...(t.math.hk1 || []), ...(t.math.hk2 || [])].join(", ");
                    const vietTopics = [...(t.vietnamese.hk1 || []), ...(t.vietnamese.hk2 || [])].join(", ");
                    data.push({
                        "Cấp lớp": "LỚP " + i,
                        "Môn học": "TOÁN",
                        "Học kỳ": "",
                        "Chủ đề": mathTopics,
                        "Bài học": "",
                        "Loại câu hỏi": "", "Câu hỏi": "", "Lựa chọn": "", "Đáp án đúng": "", "Lời giải chi tiết": ""
                    });
                    data.push({
                        "Cấp lớp": "LỚP " + i,
                        "Môn học": "TIẾNG VIỆT",
                        "Học kỳ": "",
                        "Chủ đề": vietTopics,
                        "Bài học": "",
                        "Loại câu hỏi": "", "Câu hỏi": "", "Lựa chọn": "", "Đáp án đúng": "", "Lời giải chi tiết": ""
                    });
                }
            }

            const fileName = type ? `Mau_Nhap_${type.replace(/[\/\s]/g, '_')}.xlsx` : "Mau_Nhap_Cau_Hoi.xlsx";
            app.ui.exportToExcel(data, fileName);
        },
        exportQuestions() {
            const data = app.data.libraryQuestions.map(q => ({
                "Cấp lớp": q.classlevel,
                "Môn học": q.subject,
                "Học kỳ": q.semester || '',
                "Chủ đề": q.topic,
                "Bài học": this.lessonLabel(q.lesson),
                "Loại câu hỏi": q.type,
                "Câu hỏi": q.q,
                "Lựa chọn": q.type === 'Đối chiếu trùng khớp' ? (q.options || []).join(' | ') : (q.options || []).join(', '),
                "Đáp án đúng": q.ans,
                "Lời giải chi tiết": q.explanation || ''
            }));
            app.ui.exportToExcel(data, "Du_Lieu_Cau_Hoi.xlsx");
        },
        downloadETemplate() {
            const data = [
                {
                    "Cấp lớp": "--- HƯỚNG DẪN CÁCH ĐIỀN ---",
                    "Môn": "",
                    "Thời gian": "",
                    "Tên đề": ""
                },
                {
                    "Cấp lớp": "Nhập: Lớp 1, Lớp 2, Lớp 3, Lớp 4 hoặc Lớp 5",
                    "Môn": "Nhập: Toán hoặc Tiếng Việt",
                    "Thời gian": "Nhập: Học Kỳ 1, Học Kỳ 2 hoặc Cả Năm",
                    "Tên đề": "Tên đề (ví dụ: Đề thi thử Học Kỳ 1 Toán 5)"
                },
                {
                    "Cấp lớp": "--- CÁC VÍ DỤ (VUI LÒNG XÓA ĐỂ NHẬP MỚI) ---",
                    "Môn": "",
                    "Thời gian": "",
                    "Tên đề": ""
                },
                {
                    "Cấp lớp": "Lớp 5",
                    "Môn": "Toán",
                    "Thời gian": "Học Kỳ 1",
                    "Tên đề": "Đề thi Học Kỳ 1 Môn Toán Lớp 5"
                },
                {
                    "Cấp lớp": "Lớp 3",
                    "Môn": "Tiếng Việt",
                    "Thời gian": "Cả Năm",
                    "Tên đề": "Đề ôn tập Cả Năm Tiếng Việt 3"
                }
            ];
            app.ui.exportToExcel(data, "Mau_Nhap_De_Kiem_Tra.xlsx");
        },
        exportExams() {
            const data = app.data.exams.map(e => ({
                "Cấp lớp": e.classlevel,
                "Môn": e.subject,
                "Thời gian": this.normalizeComposerPeriod(e.period),
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
                options: document.getElementById('add-q-type').value === 'Đối chiếu trùng khớp' 
                    ? [
                        document.getElementById('add-q-match-left') ? document.getElementById('add-q-match-left').value.trim() : '',
                        document.getElementById('add-q-match-right') ? document.getElementById('add-q-match-right').value.trim() : ''
                    ]
                    : [
                        document.getElementById('add-q-opt1') ? document.getElementById('add-q-opt1').value.trim() : '',
                        document.getElementById('add-q-opt2') ? document.getElementById('add-q-opt2').value.trim() : '',
                        document.getElementById('add-q-opt3') ? document.getElementById('add-q-opt3').value.trim() : '',
                        document.getElementById('add-q-opt4') ? document.getElementById('add-q-opt4').value.trim() : ''
                    ].filter(o => o !== ''),
                explanation: document.getElementById('add-q-exp').value
            };
            const selectedLesson = document.getElementById('add-q-lesson')?.value || '';
            if (selectedLesson) qObj.lesson = selectedLesson;
            if (!qObj.subject || !qObj.q || !qObj.ans) return alert('Vui lòng điền đủ Môn, Câu hỏi và Đáp án');
            const metadataError = app.data.validateQuestionMetadata(qObj);
            if (metadataError) return alert(metadataError);
            const scoringError = app.data.validateQuestionScoring(qObj);
            if (scoringError) return alert(scoringError);

            const duplicateIndex = app.data.libraryQuestions.findIndex((item, index) =>
                index !== editIdx && app.data.getQuestionKey(item) === app.data.getQuestionKey(qObj)
            );
            if (duplicateIndex !== -1) {
                return alert('Câu hỏi này đã tồn tại trong đúng Lớp – Môn – Học kỳ – Chủ đề – Bài học. Hệ thống không thêm câu trùng.');
            }

            if (editIdx !== null && editIdx !== undefined) {
                const oldId = app.data.libraryQuestions[editIdx]?.id;
                if (oldId) qObj.id = oldId;
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
        async submitImportQuestions() {
            const fileInput = document.getElementById('q-file-upload');
            if (!fileInput.files.length) return alert('Vui lòng chọn file!');

            const modeInput = document.querySelector('input[name="q-import-mode"]:checked');
            const mode = modeInput ? modeInput.value : 'append';
            const btn = document.querySelector('button[onclick="app.admin.submitImportQuestions()"]');
            if (btn) {
                btn.disabled = true;
                btn.dataset.originalHtml = btn.innerHTML;
                btn.textContent = 'Đang xử lý...';
            }

            try {
                const files = Array.from(fileInput.files);
                const readFile = file => new Promise(resolve => app.ui.importFromExcel(file, resolve));
                const fileRows = await Promise.all(files.map(readFile));
                const acceptedTypes = ['Trắc nghiệm', 'Điền khuyết', 'Đúng/Sai', 'So sánh', 'Chuỗi Quy luật', 'Kéo thả', 'Đối chiếu trùng khớp'];
                const errors = [];
                const importedQuestions = [];

                fileRows.forEach((rows, fileIndex) => {
                    rows.forEach((row, rowIndex) => {
                        const questionText = String(row['Câu hỏi'] || '').trim();
                        const answer = row['Đáp án đúng'] ?? row['Đáp án'];
                        const hasData = questionText || answer !== undefined || row['Cấp lớp'] || row['Lớp'] || row['Môn học'] || row['Môn'] || row['Học kỳ'] || row['Chủ đề'] || row['Bài học'];
                        if (!hasData || (!questionText && answer === undefined)) return;

                        const type = String(row['Loại câu hỏi'] || row['Loại'] || 'Trắc nghiệm').trim().normalize('NFC');
                        const question = {
                            type,
                            subject: String(row['Môn học'] || row['Môn'] || '').trim().normalize('NFC'),
                            classlevel: String(row['Cấp lớp'] || row['Lớp'] || '').trim().normalize('NFC'),
                            semester: String(row['Học kỳ'] || '').trim().normalize('NFC'),
                            topic: String(row['Chủ đề'] || '').trim().normalize('NFC'),
                            q: questionText,
                            ans: answer === undefined || answer === null ? '' : String(answer).trim(),
                            options: row['Lựa chọn'] ? (
                                type === 'Đối chiếu trùng khớp'
                                    ? String(row['Lựa chọn']).split('|').map(s => s.trim()).filter(Boolean)
                                    : String(row['Lựa chọn']).split(/[,;\|]/).map(s => s.trim()).filter(Boolean)
                            ) : [],
                            explanation: row['Lời giải chi tiết'] || ''
                        };
                        const lessonInput = String(row['Bài học'] ?? '').trim();
                        if (lessonInput) question.lesson = this.normalizeAdminLesson(lessonInput) || lessonInput;
                        const location = `${files[fileIndex].name}, dòng ${rowIndex + 2}`;
                        const metadataError = app.data.validateQuestionMetadata(question);
                        const scoringError = app.data.validateQuestionScoring(question);
                        if (!question.q) errors.push(`${location}: thiếu Câu hỏi.`);
                        else if (!question.ans) errors.push(`${location}: thiếu Đáp án đúng.`);
                        else if (!acceptedTypes.includes(type)) errors.push(`${location}: Loại câu hỏi "${type}" không hợp lệ.`);
                        else if (metadataError) errors.push(`${location}: ${metadataError}`);
                        else if (scoringError) errors.push(`${location}: ${scoringError}`);
                        else importedQuestions.push(question);
                    });
                });

                if (errors.length > 0) {
                    const preview = errors.slice(0, 20).join('\n');
                    alert(`Không nhập dữ liệu vì có ${errors.length} dòng sai. Hãy sửa toàn bộ rồi tải lại:\n\n${preview}${errors.length > 20 ? '\n… và các lỗi khác.' : ''}`);
                    return;
                }
                if (importedQuestions.length === 0) return alert('Không tìm thấy câu hỏi hợp lệ để nhập.');

                if (mode === 'overwrite' && !confirm('CẢNH BÁO: Dữ liệu đã hợp lệ. Ghi đè sẽ xóa toàn bộ kho câu hỏi hiện có. Bạn có chắc chắn muốn tiếp tục?')) return;

                const existingKeys = new Set(mode === 'overwrite' ? [] : app.data.libraryQuestions.map(q => app.data.getQuestionKey(q)));
                const uniqueQuestions = [];
                let duplicateCount = 0;
                importedQuestions.forEach(question => {
                    const key = app.data.getQuestionKey(question);
                    if (existingKeys.has(key)) duplicateCount++;
                    else {
                        existingKeys.add(key);
                        uniqueQuestions.push(question);
                    }
                });

                if (mode === 'overwrite') {
                    if (window.supabase) {
                        const { error } = await supabaseClient.from('game_questions').delete().not('id', 'is', null);
                        if (error) throw error;
                    }
                    app.data.libraryQuestions = [];
                }
                app.data.libraryQuestions.push(...uniqueQuestions);
                await app.data.saveLibrary();
                alert(`Đã nhập ${uniqueQuestions.length} câu hỏi.${duplicateCount ? ` Đã tự bỏ ${duplicateCount} câu trùng.` : ''}`);
                this.renderQSubTab('lib');
            } catch (error) {
                console.error('Lỗi nhập kho câu hỏi:', error);
                alert(`Không thể nhập dữ liệu: ${error.message || 'Lỗi không xác định.'}`);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
                    delete btn.dataset.originalHtml;
                }
            }
        },
        renderExamLibrary(box) {
            const escape = value => app.data.sanitizeHTML(String(value || ''));
            const exams = app.data.exams;
            const target = app.game.questionsPerRound;
            const counts = exams.map(exam => (exam.questions || []).length);
            const stats = [
                ['all', exams.length, 'Tổng số đề', 'Trong toàn bộ thư viện'],
                ['exact', counts.filter(count => count === target).length, `Đủ ${target} câu`, 'Có thể mở để rà soát'],
                ['under', counts.filter(count => count < target).length, `Chưa đủ ${target} câu`, 'Tiếp tục bổ sung nội dung'],
                ['over', counts.filter(count => count > target).length, `Vượt ${target} câu`, 'Cần chọn lại số câu']
            ];
            const statsBox = document.getElementById('exam-library-stats');
            if (statsBox) statsBox.innerHTML = stats.map(([key, count, label, hint]) => `<div class="exam-library-stat exam-library-stat--${key}"><span>${label}</span><strong>${count}</strong><small>${hint}</small></div>`).join('');
            const indicator = document.getElementById('e-count-indicator');
            if (indicator) indicator.textContent = `${exams.length} đề trong kho`;
            const options = field => [...new Set(exams.map(exam => exam[field] || (field === 'classlevel' ? 'Lớp 5' : '')).filter(Boolean))]
                .sort().map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('');
            box.innerHTML = `<section class="exam-library" aria-label="Thư viện đề">
              <div class="exam-library-filters">
                <label class="exam-library-search">Tìm trong thư viện đề<input id="exam-library-search" type="search" placeholder="Tên đề, chủ đề, nội dung phân loại…" oninput="app.admin.filterExamLibrary()"></label>
                <label>Cấp lớp<select id="exam-library-class" onchange="app.admin.filterExamLibrary()"><option value="">Tất cả lớp</option>${options('classlevel')}</select></label>
                <label>Môn học<select id="exam-library-subject" onchange="app.admin.filterExamLibrary()"><option value="">Tất cả môn</option>${options('subject')}</select></label>
                <label>Số câu trong đề<select id="exam-library-status" onchange="app.admin.filterExamLibrary()"><option value="">Tất cả đề</option><option value="exact">Đủ ${target} câu</option><option value="under">Chưa đủ ${target} câu</option><option value="over">Vượt ${target} câu</option></select></label>
              </div>
              <div class="exam-library-result-heading"><p id="exam-library-result-count" role="status"></p><button type="button" class="exam-library-reset" onclick="app.admin.renderESubTab('lib')">Xóa bộ lọc</button></div>
              <div id="exam-library-results"></div>
            </section>`;
            this.filterExamLibrary();
            this.renderComposerCards();
        },
        filterExamLibrary(limit = 12) {
            const results = document.getElementById('exam-library-results');
            if (!results) return;
            const escape = value => app.data.sanitizeHTML(String(value || ''));
            const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
            const query = normalize(document.getElementById('exam-library-search').value.trim());
            const classlevel = document.getElementById('exam-library-class').value;
            const subject = document.getElementById('exam-library-subject').value;
            const status = document.getElementById('exam-library-status').value;
            const target = app.game.questionsPerRound;
            // Keep the source index: filtering must never retarget edit, preview or delete.
            const matches = app.data.exams.map((exam, index) => ({ exam, index })).filter(({ exam }) => {
                const count = (exam.questions || []).length;
                const searchText = [exam.name, exam.classlevel || 'Lớp 5', exam.subject, exam.period, ...(exam.questions || []).map(question => question.topic)].join(' ');
                return (!query || normalize(searchText).includes(query))
                    && (!classlevel || (exam.classlevel || 'Lớp 5') === classlevel)
                    && (!subject || exam.subject === subject)
                    && (!status || (status === 'exact' ? count === target : status === 'under' ? count < target : count > target));
            });
            document.getElementById('exam-library-result-count').textContent = `Hiển thị ${Math.min(limit, matches.length)} / ${matches.length} đề${matches.length !== app.data.exams.length ? ` · Kho có ${app.data.exams.length} đề` : ''}`;
            if (!matches.length) {
                const empty = app.data.exams.length === 0;
                results.innerHTML = `<div class="exam-library-empty"><span aria-hidden="true">▤</span><h4>${empty ? 'Thư viện đang chờ đề đầu tiên' : 'Không tìm thấy đề'}</h4><p>${empty ? 'Bắt đầu một đề mới, hoặc nhập các đề đã có bằng công cụ Excel.' : 'Thử tên đề, chủ đề khác hoặc xóa bộ lọc để xem toàn bộ kho.'}</p>${empty ? '<button type="button" class="exam-library-button exam-library-button--primary" onclick="document.getElementById(\'btn-e-add\').click()">＋ Soạn đề đầu tiên</button>' : ''}</div>`;
                return;
            }
            results.innerHTML = `<div class="exam-library-grid">${matches.slice(0, limit).map(({ exam, index }) => {
                const count = (exam.questions || []).length;
                const state = count === target ? 'exact' : count < target ? 'under' : 'over';
                const label = count === target ? `Đủ ${target} câu` : count < target ? `Còn thiếu ${target - count} câu` : `Vượt ${target} câu`;
                const topics = [...new Set((exam.questions || []).map(question => question.topic).filter(Boolean))];
                return `<article class="exam-library-card exam-library-card--${state}">
                  <div class="exam-library-card__top"><span class="exam-library-card__icon" aria-hidden="true">▤</span><span class="exam-library-card__status">${label}</span></div>
                  <div class="exam-library-card__meta"><span>${escape(exam.classlevel || 'Lớp 5')}</span><span>${escape(exam.subject || 'Chưa chọn môn')}</span><span>${escape(exam.period ? this.normalizeComposerPeriod(exam.period) : 'Chưa chọn thời gian')}</span></div>
                  <h4>${escape(exam.name || 'Đề chưa đặt tên')}</h4>
                  <div class="exam-library-card__topics">${topics.slice(0, 3).map(topic => `<span>${escape(topic)}</span>`).join('') || '<span>Chưa gắn chủ đề</span>'}${topics.length > 3 ? `<span>+${topics.length - 3} chủ đề</span>` : ''}</div>
                  <div class="exam-library-card__progress"><div><strong>${count}</strong><span> / ${target} câu hỏi</span><small>${count > target ? 'Rà soát số lượng' : count === target ? 'Mở đề để kiểm tra nội dung' : 'Đang hoàn thiện'}</small></div><div class="exam-library-card__track" aria-hidden="true"><i style="width:${Math.min(100, count / target * 100)}%"></i></div></div>
                  <footer><button type="button" class="exam-library-button" onclick="app.admin.viewExam(${index})">Xem đề</button><button type="button" class="exam-library-button exam-library-button--primary" onclick="app.admin.examComposerDraft = null; app.admin.editExam(${index})">Chỉnh sửa</button><button type="button" class="exam-library-delete" onclick="app.admin.deleteExam(${index})">Xóa đề</button></footer>
                </article>`;
            }).join('')}</div>${matches.length > limit ? `<button type="button" class="exam-library-button exam-library-more" onclick="app.admin.filterExamLibrary(${limit + 12})">Xem thêm đề (${matches.length - limit} còn lại)</button>` : ''}`;
        },
        renderExams(box) {
            box.innerHTML = `
        <section class="exam-workspace" aria-label="Kho đề kiểm tra">
          <header class="exam-workspace__header">
            <div>
              <p class="exam-workspace__eyebrow">THƯ VIỆN CỦA BẠN</p>
              <h3>Mỗi đề bài, một hành trình mới</h3>
              <p class="exam-workspace__description">Toàn bộ kho đề · Tìm nội dung, tiếp tục biên soạn hoặc bắt đầu một đề mới.</p>
            </div>
            <div id="e-count-indicator" class="exam-workspace__count" aria-live="polite"></div>
          </header>
          <div id="exam-library-stats" class="exam-library-stats" aria-label="Thống kê toàn bộ kho đề"></div>
          <div class="exam-library-toolbar" aria-label="Tác vụ kho đề">
            <button type="button" class="exam-library-button" id="btn-e-lib" aria-pressed="true" onclick="app.admin.renderESubTab('lib')">▦ Thư viện đề</button>
            <button type="button" class="exam-library-button exam-library-button--primary" id="btn-e-add" onclick="app.admin.examComposerDraft = null; app.admin.renderESubTab('add')">＋ Soạn đề mới</button>
            <details class="exam-library-tools">
              <summary>Công cụ Excel</summary>
              <div class="exam-library-tools__items">
                <button type="button" class="exam-library-button" id="btn-e-tpl" onclick="app.admin.renderESubTab('tpl')">↓ Tải file mẫu .xlsx</button>
                <button type="button" class="exam-library-button" id="btn-e-exp" onclick="app.admin.renderESubTab('exp')">↗ Xuất kho đề .xlsx</button>
                <button type="button" class="exam-library-button" id="btn-e-imp" onclick="app.admin.renderESubTab('imp')">↙ Nhập đề từ .xlsx</button>
              </div>
            </details>
          </div>
          <div id="admin-e-subarea"></div>
        </section>
      `;
            this.renderESubTab('lib');
        },
        renderESubTab(tab, editIdx) {
            ['lib', 'add', 'tpl', 'exp', 'imp'].forEach(t => {
                const el = document.getElementById('btn-e-' + t);
                if (el) {
                    el.classList.toggle('is-active', t === tab);
                    el.setAttribute('aria-pressed', String(t === tab));
                }
            });
            const subBox = document.getElementById('admin-e-subarea');

            if (tab === 'lib') {
                this.renderExamLibrary(subBox);
            }
            else if (tab === 'add') {
                let e = this.examComposerDraft || (editIdx !== undefined ? app.data.exams[editIdx] : null);
                const existingQuestionCount = e && Array.isArray(e.questions) ? e.questions.length : 0;
                const initialLessonFilters = e?.lessonFilters || [...new Set((e?.questions || []).map(question => question.lesson).filter(Boolean))];
                const selectedPeriod = this.normalizeComposerPeriod(e?.period || 'Học Kỳ 1');
                subBox.innerHTML = `
            <section class="exam-composer" aria-label="${e ? 'Sửa đề kiểm tra' : 'Soạn đề kiểm tra'}">
               <header class="exam-composer__header">
                  <div class="exam-composer__header-copy">
                     <p class="exam-composer__eyebrow">${e ? 'CHỈNH SỬA ĐỀ' : 'TẠO ĐỀ MỚI'}</p>
                     <h3>${e ? 'Sửa đề kiểm tra' : 'Soạn đề kiểm tra'}</h3>
                     <p class="exam-composer__description">Điền thông tin chung, chọn chủ đề và hoàn thiện từng câu hỏi trong một không gian rõ ràng.</p>
                  </div>
                  <div class="exam-composer__progress" aria-label="Tiến độ số câu đã có" aria-live="polite">
                     <div class="exam-composer__progress-heading"><span>TIẾN ĐỘ SOẠN</span><span><strong>${existingQuestionCount}</strong> / ${app.game.questionsPerRound} câu</span></div>
                     <div class="exam-composer__progress-track" aria-hidden="true"><i style="width:${Math.min(100, existingQuestionCount / app.game.questionsPerRound * 100)}%"></i></div>
                     <small>${existingQuestionCount === app.game.questionsPerRound ? 'Đã đủ câu để rà soát' : `Còn ${Math.max(0, app.game.questionsPerRound - existingQuestionCount)} câu cần hoàn thiện`}</small>
                  </div>
               </header>

               <section class="exam-composer__section exam-composer__meta" data-composer-section="meta" aria-labelledby="exam-composer-meta-title">
                  <div class="exam-composer__section-heading">
                     <div><span class="exam-composer__section-kicker">BƯỚC 01 · KHỞI TẠO</span><h4 id="exam-composer-meta-title">1. Thông tin chung của đề</h4></div>
                     <p>Dùng các trường này để phân loại và tìm lại đề trong thư viện.</p>
                  </div>
                  <label class="exam-form-field">
                     <span>Cấp lớp</span>
                     <select id="add-e-class" class="form-input" onchange="app.admin.updateExamTopics()">
                     <option value="Lớp 1" ${e && e.classlevel === 'Lớp 1' ? 'selected' : ''}>Lớp 1</option>
                     <option value="Lớp 2" ${e && e.classlevel === 'Lớp 2' ? 'selected' : ''}>Lớp 2</option>
                     <option value="Lớp 3" ${e && e.classlevel === 'Lớp 3' ? 'selected' : ''}>Lớp 3</option>
                     <option value="Lớp 4" ${e && e.classlevel === 'Lớp 4' ? 'selected' : ''}>Lớp 4</option>
                     <option value="Lớp 5" ${e && e.classlevel === 'Lớp 5' ? 'selected' : (!e ? 'selected' : '')}>Lớp 5</option>
                     </select>
                  </label>
                  <label class="exam-form-field">
                     <span>Môn học</span>
                     <select id="add-e-sub" class="form-input" onchange="app.admin.updateExamTopics()">
                     <option value="Toán" ${e && e.subject === 'Toán' ? 'selected' : (!e ? 'selected' : '')}>Toán</option>
                     <option value="Tiếng Việt" ${e && e.subject === 'Tiếng Việt' ? 'selected' : ''}>Tiếng Việt</option>
                     </select>
                  </label>
                   <label class="exam-form-field">
                      <span>Thời gian</span>
                      <select id="add-e-period" class="form-input" onchange="app.admin.updateExamTopics()">
                      ${this.getComposerPeriodOptions().map(option => `<option value="${option.value}" ${selectedPeriod === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
                      </select>
                   </label>
                   <label class="exam-form-field exam-form-field--wide">
                      <span>Tên đề kiểm tra <em aria-hidden="true">*</em></span>
                      <input type="text" id="add-e-name" placeholder="Tên Đề (VD: Đề kiểm tra học kì 1 Toán)" class="form-input" value="${e ? app.data.sanitizeHTML(e.name) : ''}" required aria-describedby="add-e-form-error">
                   </label>
                   <div id="add-e-form-error" class="exam-composer__form-error" role="alert" aria-live="assertive" hidden></div>
                  <div class="exam-form-field exam-form-field--full exam-composer__topics-field">
                     <span>Chủ đề áp dụng</span>
                     <div id="add-e-topics" class="exam-composer__topics" data-selected='${app.data.sanitizeHTML(JSON.stringify(e?.topics || []))}'></div>
                     <small>Chọn một hoặc nhiều chủ đề để lọc câu hỏi và hỗ trợ tạo đề tự động.</small>
                  </div>
                   <div id="add-e-lessons-field" class="exam-form-field exam-form-field--full exam-composer__topics-field" hidden>
                      <span>Bài học áp dụng</span>
                      <div id="add-e-lessons" class="exam-composer__lessons-panel" data-selected='${app.data.sanitizeHTML(JSON.stringify(initialLessonFilters))}' data-selection-mode="${initialLessonFilters.length ? 'selected' : 'all'}"></div>
                      <small>Chỉ dành cho Lớp 4 – Toán. Sau khi chọn Chủ đề, bỏ chọn các Bài học chưa học để thu hẹp nguồn câu hỏi.</small>
                   </div>
                  <div class="exam-composer__meta-action">
                     <p>Đã có ngân hàng câu hỏi hoặc template phù hợp? Hãy chọn chủ đề rồi để hệ thống điền đủ 10 câu cho bạn chỉnh sửa.</p>
                     <button type="button" class="btn-success exam-composer__generate-action" onclick="app.admin.autoGenerateExam()">Tạo đề tự động</button>
                  </div>
               </section>

               ${e && e.questions && e.questions.length > 0 ? `
               <section class="exam-composer__section exam-composer__saved" aria-labelledby="exam-composer-saved-title">
                  <div class="exam-composer__section-heading">
                     <div>
                        <h4 id="exam-composer-saved-title">2. Câu hỏi đã có trong đề</h4>
                        <p>Kéo thứ tự bằng các nút Lên/Xuống hoặc xóa câu không cần dùng.</p>
                     </div>
                     <span class="exam-composer__section-count">${e.questions.length}/${app.game.questionsPerRound}</span>
                  </div>
                  <ol class="exam-composer__saved-list">
                     ${e.questions.map((q, i) => `
                     <li class="exam-composer__saved-item">
                        <div class="exam-composer__saved-copy"><strong>Câu ${i + 1}</strong><span>${app.data.formatMathHTML(q.q)}</span></div>
                        <div class="exam-composer__saved-actions">
                           ${i > 0 ? `<button type="button" class="btn-opt action-btn exam-composer__reorder-action" onclick="app.admin.moveQuestion(${editIdx}, ${i}, 'up')">Lên</button>` : ''}
                           ${i < e.questions.length - 1 ? `<button type="button" class="btn-opt action-btn exam-composer__reorder-action" onclick="app.admin.moveQuestion(${editIdx}, ${i}, 'down')">Xuống</button>` : ''}
                           ${app.ui.compactAction('Xóa', `app.admin.removeQuestionFromExam(${editIdx}, ${i})`, 'compact-admin-action--delete')}
                        </div>
                     </li>
                     `).join('')}
                  </ol>
               </section>
               ` : ''}

               <section class="exam-composer__section exam-composer__question-bank" data-composer-section="questions" aria-labelledby="exam-composer-questions-title">
                  <div class="exam-composer__section-heading">
                     <div>
                        <span class="exam-composer__section-kicker">BƯỚC ${e && e.questions && e.questions.length > 0 ? '03' : '02'} · BIÊN TẬP</span><h4 id="exam-composer-questions-title">Soạn câu hỏi cho đề</h4>
                        <p>Mỗi thẻ là một câu hoàn chỉnh. Chọn loại câu để mở đúng nhóm trường cần biên tập.</p>
                     </div>
                     <span class="exam-composer__section-count"><strong>${existingQuestionCount}</strong> / ${app.game.questionsPerRound} câu đã có</span>
                  </div>
                  <div class="exam-question-list">
                  ${Array(Math.max(10, e && e.questions ? e.questions.length : 10)).fill(0).map((_, i) => {
                    const q = e && e.questions && e.questions[i] ? e.questions[i] : null;
                    const structureKind = this.getExamQuestionStructureKind(q);
                    const hasStructuredOptions = structureKind === 'subquestions' || structureKind === 'comparisonRows';
                    const optionsDisplay = hasStructuredOptions || (q && q.type && q.type !== 'Trắc nghiệm' && q.type !== 'Kéo thả') ? 'none' : 'block';
                    return `
                    <article class="exam-question-card${q ? ' is-filled' : ' is-empty'}" data-question-index="${i}">
                       <header class="exam-question-card__header">
                          <div class="exam-question-card__title-wrap">
                             <span class="exam-question-card__number">${i + 1}</span>
                             <div><h5>Câu hỏi ${i + 1}</h5><p>${q ? 'Đã có dữ liệu, có thể chỉnh sửa.' : 'Bắt đầu từ nội dung câu hỏi.'}</p></div>
                          </div>
                          <span class="exam-question-card__status ${q ? 'exam-question-card__status--filled' : ''}">${q ? 'Đã điền' : 'Chưa điền'}</span>
                       </header>
                       <div class="exam-question-card__fields">
                          <label class="exam-form-field">
                             <span>Chủ đề</span>
                             <select id="add-e-q-topic-${i}" class="form-input" data-selected="${q ? q.topic : ''}" onchange="app.admin.updateExamQuestionLesson(${i})">
                             </select>
                          </label>
                          <label class="exam-form-field" hidden>
                             <span>Bài học</span>
                             <select id="add-e-q-lesson-${i}" class="form-input" data-selected="${app.data.sanitizeHTML(q?.lesson || '')}"></select>
                          </label>
                          <label class="exam-form-field">
                             <span>Loại câu hỏi</span>
                             <select id="add-e-q-type-${i}" class="form-input" onchange="app.admin.toggleQuestionType('add-e-q', ${i})">
                             <option value="Trắc nghiệm" ${q && q.type === 'Trắc nghiệm' ? 'selected' : (!q ? 'selected' : '')}>Trắc nghiệm</option>
                             <option value="Điền khuyết" ${q && q.type === 'Điền khuyết' ? 'selected' : ''}>Điền khuyết</option>
                             <option value="Đúng/Sai" ${q && q.type === 'Đúng/Sai' ? 'selected' : ''}>Đúng/Sai</option>
                             <option value="So sánh" ${q && q.type === 'So sánh' ? 'selected' : ''}>So sánh</option>
                             <option value="Chuỗi Quy luật" ${q && q.type === 'Chuỗi Quy luật' ? 'selected' : ''}>Chuỗi Quy luật</option>
                             <option value="Kéo thả" ${q && q.type === 'Kéo thả' ? 'selected' : ''}>Kéo thả</option>
                             <option value="Đối chiếu trùng khớp" ${q && q.type === 'Đối chiếu trùng khớp' ? 'selected' : ''}>Đối chiếu trùng khớp</option>
                             </select>
                          </label>
                          <label class="exam-form-field exam-form-field--full">
                             <span>Nội dung câu</span>
                             <textarea id="add-e-q-q-${i}" placeholder="Nội dung câu hỏi" class="form-input">${q ? q.q : ''}</textarea>
                          </label>

                          ${this.renderExamQuestionStructure(q, i)}

                          <fieldset id="add-e-q-opts-wrapper-${i}" class="exam-question-card__conditional exam-question-card__options" style="display: ${optionsDisplay}"${hasStructuredOptions ? ' aria-hidden="true"' : ''}>
                             <legend>Các lựa chọn</legend>
                             <div class="exam-question-card__option-grid">
                                <label class="exam-question-card__option-field"><span>Lựa chọn 1</span><input type="text" id="add-e-q-opt1-${i}" placeholder="Lựa chọn 1" class="form-input" value="${q && q.options && q.options[0] && q.type !== 'Đối chiếu trùng khớp' ? q.options[0] : ''}"></label>
                                <label class="exam-question-card__option-field"><span>Lựa chọn 2</span><input type="text" id="add-e-q-opt2-${i}" placeholder="Lựa chọn 2" class="form-input" value="${q && q.options && q.options[1] && q.type !== 'Đối chiếu trùng khớp' ? q.options[1] : ''}"></label>
                                <label class="exam-question-card__option-field"><span>Lựa chọn 3</span><input type="text" id="add-e-q-opt3-${i}" placeholder="Lựa chọn 3" class="form-input" value="${q && q.options && q.options[2] && q.type !== 'Đối chiếu trùng khớp' ? q.options[2] : ''}"></label>
                                <label class="exam-question-card__option-field"><span>Lựa chọn 4</span><input type="text" id="add-e-q-opt4-${i}" placeholder="Lựa chọn 4" class="form-input" value="${q && q.options && q.options[3] && q.type !== 'Đối chiếu trùng khớp' ? q.options[3] : ''}"></label>
                             </div>
                          </fieldset>

                          <fieldset id="add-e-q-match-wrapper-${i}" class="exam-question-card__conditional exam-question-card__match" style="display: ${q && q.type === 'Đối chiếu trùng khớp' ? 'block' : 'none'}">
                             <legend>Nội dung hai cột đối chiếu</legend>
                             <div class="exam-question-card__option-grid">
                                <label class="exam-question-card__option-field exam-question-card__option-field--left"><span>Cột trái</span><input type="text" id="add-e-q-match-left-${i}" placeholder="Mèo, Chó..." class="form-input" value="${q && q.options && q.options[0] && q.type === 'Đối chiếu trùng khớp' ? q.options[0] : ''}"></label>
                                <label class="exam-question-card__option-field exam-question-card__option-field--right"><span>Cột phải</span><input type="text" id="add-e-q-match-right-${i}" placeholder="Meo, Gâu..." class="form-input" value="${q && q.options && q.options[1] && q.type === 'Đối chiếu trùng khớp' ? q.options[1] : ''}"></label>
                             </div>
                          </fieldset>

                          <div class="exam-question-card__answer-grid${structureKind ? ' exam-question-card__answer-grid--explanation-only' : ''}">
                             ${structureKind ? '' : '<label class="exam-form-field"><span>Đáp án đúng</span><input type="text" id="add-e-q-ans-' + i + '" placeholder="Đáp án đúng" class="form-input" value="' + (q ? app.data.sanitizeHTML(q.ans) : '') + '"></label>'}
                             <label class="exam-form-field"><span>Lời giải chi tiết <em>(tùy chọn)</em></span><textarea id="add-e-q-exp-${i}" placeholder="Giải thích ngắn gọn cho học sinh" class="form-input">${q ? q.explanation || '' : ''}</textarea></label>
                          </div>
                       </div>
                    </article>
                  `;
                }).join('')}
                  </div>
               </section>

               <footer class="exam-composer__actions">
                  <p>Đề cần đủ ${app.game.questionsPerRound} câu có nội dung và đáp án để lưu.</p>
                  ${app.ui.compactAction(e ? 'Lưu chỉnh sửa' : 'Tạo đề kiểm tra', `app.admin.submitAddExam(${editIdx !== undefined ? editIdx : 'null'})`, 'compact-admin-action--save')}
               </footer>
             </section>
           `;
                this.setComposerStep('content');
                this.syncComposerQuestionNav();
                setTimeout(() => {
                    app.admin.updateExamTopics();
                    app.admin.bindExamComposerInteractions();
                    app.admin.updateExamComposerProgress();
                    app.admin.syncComposerQuestionNav();
                }, 0);
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
                let matchingExams = app.data.exams.map((e, i) => ({ e, i })).filter(x => x.e.classlevel === q.classlevel && x.e.subject === q.subject);

                let html = `<div style="margin-bottom:15px;"><button class="btn-opt" onclick="app.admin.switchTab('questions'); setTimeout(()=>app.admin.renderQSubTab('lib'), 50);">Quay lại Kho Câu hỏi</button></div>`;
                html += `<h3>Chọn đề kiểm tra để thêm câu hỏi</h3>`;
                html += `<p>Đang lọc đề kiểm tra: <strong>${q.classlevel} - ${q.subject}</strong></p>`;

                if (matchingExams.length === 0) {
                    html += `<p style="color:#aaa;">Không có đề kiểm tra nào phù hợp với Cấp lớp và Môn của câu hỏi này.</p>`;
                } else {
                    const cols = [
                        { label: 'Thời gian', filterable: true },
                        { label: 'Tên đề', filterable: true },
                        { label: 'Số câu', filterable: false },
                        { label: 'Hành động', filterable: false }
                    ];
                    html += app.ui.renderTable(cols, matchingExams, (item, idx) => {
                        return `<tr>
                      <td>${app.data.sanitizeHTML(this.normalizeComposerPeriod(item.e.period))}</td>
                      <td>${app.data.sanitizeHTML(item.e.name)}</td>
                      <td>${(item.e.questions || []).length}</td>
                      <td>
                          <button class="btn-success action-btn" onclick="app.admin.renderESubTab('inject_q', {qIdx: ${qIdx}, eIdx: ${item.i}})">Chọn đề này</button>
                      </td>
                  </tr>`;
                    });
                }
                subBox.innerHTML = html;
            }
            else if (tab === 'inject_q') {
                let { qIdx, eIdx } = editIdx;
                let q = app.data.libraryQuestions[qIdx];
                let e = app.data.exams[eIdx];

                let existingOpts = (e.questions || []).map((eq, i) => `<option value="${i}">Ghi đè Câu ${i + 1}: ${eq.q.substring(0, 30)}...</option>`).join('');

                subBox.innerHTML = `
             <div style="max-width: 600px; margin: 0 auto; text-align:left;">
                <div style="margin-bottom:15px;"><button class="btn-opt" onclick="app.admin.renderESubTab('select_for_q', ${qIdx})">Quay lại chọn đề</button></div>
                <h3>Thêm câu hỏi vào đề: ${e.name}</h3>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>Nội dung câu hỏi sẽ thêm:</strong></p>
                    <p><i>${app.data.formatMathHTML(q.q)}</i></p>
                    <p><strong>Đáp án:</strong> ${app.data.formatMathText(q.ans)}</p>
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
               ${app.ui.compactAction('Tải lên', 'app.admin.submitImportExams()', 'compact-admin-action--save')}
            </div>
          `;
            }
        },
        autoGenerateExam() {
            const classlevel = document.getElementById('add-e-class').value;
            const subject = document.getElementById('add-e-sub').value;
            const period = this.normalizeComposerPeriod(document.getElementById('add-e-period').value);
            const topics = Array.from(document.querySelectorAll('#add-e-topics input:checked')).map(input => input.value);
            if (!topics.length) return alert('Hãy chọn ít nhất một chủ đề trước khi tạo đề tự động.');
            const lessonFilters = this.getSelectedExamLessons();
            const same = (left, right) => app.data.normalizeQuestionPart(left) === app.data.normalizeQuestionPart(right);
            const requiresFourPartStructure = same(classlevel, 'Lớp 4') && same(subject, 'Toán');
            const eligible = item => {
                if (!item || !same(item.classlevel, classlevel) || !same(item.subject, subject)) return false;
                if (!topics.some(topic => same(item.topic, topic))) return false;
                if (!lessonFilters.length) return true;
                const itemLesson = item.generator_key
                    ? this.getTemplateLesson(item)
                    : item.lesson || item.config?.lesson || '';
                if (!itemLesson) return Boolean(item.generator_key);
                return lessonFilters.some(lesson => same(itemLesson, lesson));
            };
            const used = new Set();
            let skippedSinglePartQuestions = false;
            const addUnique = question => {
                if (!question || typeof question !== 'object') return false;
                const copy = JSON.parse(JSON.stringify(question));
                // Đề Toán lớp 4 phải giữ đúng mô hình 4 ý để giáo viên chỉnh sửa từng ý.
                if (requiresFourPartStructure && !this.isFourPartExamQuestion(copy)) {
                    skippedSinglePartQuestions = true;
                    return false;
                }
                if (app.data.validateQuestionScoring(copy)) return false;
                const key = app.data.getQuestionContentKey(copy);
                if (used.has(key)) return false;
                used.add(key);
                questions.push(copy);
                return true;
            };
            const questions = [];
            const topicPools = topics.map(topic => ({
                library: [...(app.data.libraryQuestions || [])]
                    .filter(question => eligible(question) && same(question.topic, topic))
                    .sort(() => Math.random() - 0.5),
                templates: (app.data.questionTemplates || [])
                    .filter(template => template.is_active !== false && eligible(template) && same(template.topic, topic))
                    .sort(() => Math.random() - 0.5),
                libraryIndex: 0,
                templateIndex: 0,
                templateAttempts: 0
            }));
            const maxTemplateAttemptsPerTopic = Math.max(100, app.game.questionsPerRound * 20);
            const takeNextFromPool = pool => {
                while (pool.libraryIndex < pool.library.length) {
                    if (addUnique(pool.library[pool.libraryIndex++])) return true;
                }
                while (pool.templates.length && pool.templateAttempts < maxTemplateAttemptsPerTopic) {
                    const template = pool.templates[pool.templateIndex++ % pool.templates.length];
                    pool.templateAttempts++;
                    const generated = app.data.generateTemplateQuestion(template);
                    if (addUnique(generated)) return true;
                }
                return false;
            };
            // Luân phiên từng pool để đề không bị hút hết câu từ một chủ đề đầu tiên.
            let madeProgress = true;
            while (questions.length < app.game.questionsPerRound && madeProgress) {
                madeProgress = false;
                for (const pool of topicPools) {
                    if (questions.length >= app.game.questionsPerRound) break;
                    if (takeNextFromPool(pool)) madeProgress = true;
                }
            }
            const missingTopics = requiresFourPartStructure
                ? topics.filter(topic => !questions.some(question => same(question.topic, topic)))
                : [];
            if (missingTopics.length) {
                return alert(`Chưa thể tạo đề: các chủ đề sau chưa có nguồn có cấu trúc bốn ý phù hợp: ${missingTopics.join(', ')}. Hãy bổ sung câu hỏi/template có đủ 4 ý a–d hoặc bỏ chọn chủ đề đó.`);
            }
            if (questions.length < app.game.questionsPerRound) {
                const structureHint = skippedSinglePartQuestions
                    ? ' Các câu chỉ có một ý đã được bỏ qua; hãy bổ sung câu hỏi/template có đủ 4 ý a–d.'
                    : '';
                return alert(`Chưa đủ 10 câu có cấu trúc bốn ý phù hợp với các chủ đề/Bài học đã chọn (hiện có ${questions.length} câu).${structureHint}`);
            }
            this.examComposerDraft = {
                classlevel, subject, period,
                name: document.getElementById('add-e-name').value,
                topics, lessonFilters, questions
            };
            this.renderESubTab('add');
        },
        submitAddExam(editIdx) {
            const eObj = {
                name: document.getElementById('add-e-name').value,
                subject: document.getElementById('add-e-sub').value,
                classlevel: document.getElementById('add-e-class').value,
                period: this.normalizeComposerPeriod(document.getElementById('add-e-period').value),
                topics: Array.from(document.querySelectorAll('#add-e-topics input:checked')).map(input => input.value),
                questions: []
            };
            if (!eObj.name || !eObj.subject) return this.showExamComposerError('Vui lòng điền đủ Tên đề và Môn.', !eObj.name ? 'add-e-name' : 'add-e-sub');

            let i = 0;
            let newQuestionsCount = 0;
            let firstIncompleteQuestion = null;
            while (document.getElementById(`add-e-q-q-${i}`)) {
                const qTextEl = document.getElementById(`add-e-q-q-${i}`);
                const qText = qTextEl.value.trim();
                const typeVal = document.getElementById(`add-e-q-type-${i}`).value;
                const originalQuestion = editIdx !== null && editIdx !== undefined
                    ? app.data.exams[editIdx]?.questions?.[i]
                    : this.examComposerDraft?.questions?.[i];
                const structureKind = this.getExamQuestionStructureKind(originalQuestion);
                const structurePatch = structureKind ? this.readExamQuestionStructure(originalQuestion, i) : {};
                const ansText = structureKind
                    ? String(structurePatch.ans || '').trim()
                    : document.getElementById(`add-e-q-ans-${i}`).value.trim();

                if (qText && ansText) {
                    const newQ = {
                        ...(originalQuestion ? JSON.parse(JSON.stringify(originalQuestion)) : {}),
                        classlevel: eObj.classlevel,
                        subject: eObj.subject,
                        topic: document.getElementById(`add-e-q-topic-${i}`).value,
                        type: typeVal,
                        q: qText,
                        ans: ansText,
                        explanation: document.getElementById(`add-e-q-exp-${i}`).value.trim(),
                        options: []
                    };
                    const selectedLesson = this.normalizeAdminLesson(document.getElementById(`add-e-q-lesson-${i}`)?.value || '');
                    if (selectedLesson) {
                        newQ.lesson = selectedLesson;
                        const lessonContext = app.curriculum?.getLessonContext(selectedLesson);
                        if (!newQ.semester && lessonContext) newQ.semester = lessonContext.semester === 'hk2' ? 'Học kỳ 2' : 'Học kỳ 1';
                    } else {
                        delete newQ.lesson;
                    }
                    if ((typeVal === 'Trắc nghiệm' || typeVal === 'Kéo thả') && (!structureKind || structureKind === 'angleItems' || structureKind === 'answerParts')) {
                        newQ.options = [
                            document.getElementById(`add-e-q-opt1-${i}`).value.trim(),
                            document.getElementById(`add-e-q-opt2-${i}`).value.trim(),
                            document.getElementById(`add-e-q-opt3-${i}`).value.trim(),
                            document.getElementById(`add-e-q-opt4-${i}`).value.trim()
                        ];
                    }
                    if (structureKind) Object.assign(newQ, structurePatch);
                    if (structureKind && !this.isFourPartExamQuestion(newQ)) return this.showExamComposerError(`Câu ${i + 1}: cần đủ 4 ý và đáp án riêng cho từng ý trước khi lưu.`, `add-e-q-q-${i}`);
                    if (newQ.lesson) {
                        const metadataError = app.data.validateQuestionMetadata(newQ);
                        if (metadataError) return this.showExamComposerError(`Câu ${i + 1}: ${metadataError}`, `add-e-q-q-${i}`);
                    }
                    const scoringError = app.data.validateQuestionScoring(newQ);
                    if (scoringError) return this.showExamComposerError(`Câu ${i + 1}: ${scoringError}`, `add-e-q-q-${i}`);
                    eObj.questions.push(newQ);
                    const exists = app.data.libraryQuestions.some(libQ => libQ.q === newQ.q);
                    if (!exists) {
                        app.data.libraryQuestions.push(JSON.parse(JSON.stringify(newQ))); // add a copy to global bank
                    }
                    newQuestionsCount++;
                } else if (firstIncompleteQuestion === null) firstIncompleteQuestion = i;
                i++;
            }

            if (eObj.questions.length !== app.game.questionsPerRound) {
                return this.showExamComposerError('Đề kiểm tra phải có đúng 10 câu có đủ nội dung và đáp án để chấm theo thang điểm 10.', firstIncompleteQuestion === null ? '' : `add-e-q-q-${firstIncompleteQuestion}`);
            }

            if (newQuestionsCount > 0) {
                app.data.saveLibrary();
            }

            if (editIdx !== null && editIdx !== undefined) {
                const oldId = app.data.exams[editIdx]?.id;
                if (oldId) eObj.id = oldId;
                app.data.exams[editIdx] = eObj;
                alert('Đã cập nhật đề kiểm tra!');
            } else {
                app.data.exams.push(eObj);
                alert('Đã tạo đề kiểm tra mới!');
            }
            app.data.saveExams();
            this.examComposerDraft = null;
            this.renderESubTab('lib');
        },
        submitInjectQ(qIdx, eIdx) {
            let e = app.data.exams[eIdx];
            if (!e.questions) e.questions = [];

            let mode = document.getElementById('inject-mode').value;
            let targetIdx = parseInt(document.getElementById('inject-target').value);
            let qClone = JSON.parse(JSON.stringify(app.data.libraryQuestions[qIdx]));
            const scoringError = app.data.validateQuestionScoring(qClone);
            if (scoringError) return alert(scoringError);

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
                            period: this.normalizeComposerPeriod(row["Thời gian"] || row["Kỳ kiểm tra"] || 'Học Kỳ 1'),
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
                ${app.ui.compactAction('In PDF / A4', 'window.print()', 'compact-admin-action--view')}
                <button class="utility-close-button utility-close-button--inline" onclick="app.admin.renderESubTab('lib')" aria-label="Đóng chi tiết đề">×</button>
             </div>
          </div>
          <div id="print-area" style="background:#fff; color:#000; padding:20px; text-align:left; margin-top:20px; min-height:400px;">
             <h2 style="text-align:center;">BÀI KIỂM TRA ${this.normalizeComposerPeriod(exam.period).toUpperCase()}</h2>
             <p style="text-align:center;"><strong>Môn:</strong> ${exam.subject} - <strong>Lớp:</strong> ${exam.classlevel}</p>
             <hr style="margin:20px 0;">
       `;
            if (!exam.questions || exam.questions.length === 0) {
                html += `<p style="text-align:center;">Đề kiểm tra này chưa có câu hỏi nào.</p>`;
            } else {
                exam.questions.forEach((q, i) => {
                    html += `
                  <div style="margin-bottom: 20px;">
                     <p><strong>Câu ${i + 1} (${q.type}):</strong> ${app.data.formatMathHTML(q.q)}</p>
                     ${q.options && q.options.length > 0 ? `<ul style="list-style-type:none; padding-left:20px;">${q.options.map(o => `<li>- [  ] ${app.data.formatMathText(o)}</li>`).join('')}</ul>` : ''}
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
                { label: 'Lớp', filterable: true },
                { label: 'Giới tính', filterable: true },
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
                    actionBtns = `${app.ui.compactAction('Duyệt', `app.admin.approveUser('${u.username}')`, 'compact-admin-action--approve')}
                          ${app.ui.compactAction('Xóa', `app.admin.deleteUser('${u.username}')`, 'compact-admin-action--delete')}`;
                } else {
                    actionBtns = `${app.ui.compactAction('Sửa', `app.admin.showAddPlayerForm('${u.username}')`, 'compact-admin-action--edit')}
                          ${app.ui.compactAction('Xóa', `app.admin.deleteUser('${u.username}')`, 'compact-admin-action--delete')}`;
                }
                return `<tr>
          <td>${app.data.sanitizeHTML(u.classlevel || '')}</td><td>${app.data.sanitizeHTML(u.class_name || '—')}</td><td>${app.data.sanitizeHTML(app.data.genderLabel?.(u.gender) || '—')}</td><td>${app.data.sanitizeHTML(u.fullname || '')}</td>
          <td>${app.data.sanitizeHTML(u.username)}</td><td>Không hiển thị (có thể đặt lại)</td>
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
                user.stars = 0;
                if (user.id) {
                    await supabaseClient.from('game_users').update({ approved: true, history: [], totalscore: 0, stars: 0 }).eq('id', user.id);
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
                <label style="width:130px; font-weight:bold; flex-shrink:0;">${u ? 'Mật khẩu mới' : 'Mật khẩu'}</label>
                <input type="password" id="add-password" placeholder="${u ? 'Để trống nếu không đổi mật khẩu' : 'Ít nhất 8 ký tự'}" class="form-input" style="flex:1; padding:8px;" value="">
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

             <div style="display:flex; align-items:center; margin-bottom:15px;">
                <label for="add-class-name" style="width:130px; font-weight:bold; flex-shrink:0;">Lớp</label>
                <input type="text" id="add-class-name" placeholder="Ví dụ: 4/4" maxlength="64" class="form-input" style="flex:1; padding:8px;" value="${u ? app.data.sanitizeHTML(u.class_name || '') : ''}">
             </div>

             <div style="display:flex; align-items:center; margin-bottom:15px;">
                <label for="add-gender" style="width:130px; font-weight:bold; flex-shrink:0;">Giới tính</label>
                <select id="add-gender" class="form-input" style="flex:1; padding:8px;">
                   <option value="" ${!u?.gender ? 'selected' : ''}>Không khai báo</option>
                   <option value="male" ${u?.gender === 'male' ? 'selected' : ''}>Nam</option>
                   <option value="female" ${u?.gender === 'female' ? 'selected' : ''}>Nữ</option>
                   <option value="other" ${u?.gender === 'other' ? 'selected' : ''}>Khác / không muốn nêu</option>
                </select>
             </div>
             
             ${app.ui.compactAction(u ? 'Lưu chỉnh sửa' : 'Tạo tài khoản', `app.admin.addPlayerSubmit('${typeof editUsername === 'string' ? editUsername : ''}')`, u ? 'compact-admin-action--save' : 'compact-admin-action--create')}
          </div>
        `;
        },
        async addPlayerSubmit(editUsername) {
            const fn = document.getElementById('add-fullname').value.trim();
            const un = document.getElementById('add-username').value.trim();
            const pw = document.getElementById('add-password').value.trim();
            const cl = document.getElementById('add-class').value;
            const className = document.getElementById('add-class-name')?.value.trim() || '';
            const gender = document.getElementById('add-gender')?.value || null;
            if (!fn || !un || (!editUsername && !pw)) return alert('Điền đủ thông tin!');

            if (editUsername) {
                let user = app.data.users.find(x => x.username === editUsername);
                if (user) {
                    if (un !== editUsername) return alert('Vì bảo mật, không đổi tên đăng nhập sau khi tạo. Hãy tạo tài khoản mới nếu cần.');
                    user.fullname = fn;
                    user.classlevel = cl;
                    user.class_name = className || null;
                    user.gender = gender;
                    const { error } = await supabaseClient.from('game_users').update({ fullname: fn, classlevel: cl, class_name: className || null, gender }).eq('id', user.id);
                    if (error) return alert('Không thể cập nhật thông tin học sinh.');
                    if (pw) {
                        try {
                            await app.auth.manageStudentAccount({ action: 'reset_password', username: un, password: pw });
                        } catch (error) {
                            const messages = {
                                invalid_password: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
                                student_not_found: 'Không tìm thấy tài khoản học sinh để đặt lại mật khẩu.',
                                auth_lookup_failed: 'Chưa thể kiểm tra tài khoản đăng nhập. Vui lòng thử lại.',
                                profile_link_failed: 'Đã tạo tài khoản đăng nhập nhưng chưa liên kết được hồ sơ. Vui lòng thử lại.',
                                reset_failed: 'Supabase chưa đặt lại được mật khẩu. Vui lòng thử lại.',
                            };
                            return alert(`Đã lưu thông tin, nhưng ${messages[error.message] || 'chưa đặt lại được mật khẩu. Vui lòng thử lại.'}`);
                        }
                    }
                    alert('Đã cập nhật thông tin học sinh. Mật khẩu cũ không được hiển thị vì đã bảo mật.');
                }
            } else {
                if (app.data.users.find(x => x.username === un)) return alert('Tên đăng nhập đã tồn tại!');
                try {
                    const data = await app.auth.manageStudentAccount({ action: 'create', username: un, fullname: fn, classlevel: cl, class_name: className || null, gender, password: pw });
                    // Realtime can insert this profile before the function response arrives.
                    if (!app.data.users.find(x => x.id === data.profile.id)) app.data.users.push(data.profile);
                } catch (error) {
                    const messages = {
                        invalid_username: 'Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang; dài 3–32 ký tự.',
                        invalid_student_data: 'Hãy nhập đầy đủ họ tên, lớp và mật khẩu từ 8 ký tự.',
                        auth_account_exists: 'Tên đăng nhập này đã được dùng cho một tài khoản đăng nhập khác.',
                        profile_failed: 'Đã tạo tài khoản đăng nhập nhưng chưa lưu được hồ sơ học sinh. Vui lòng thử lại.',
                    };
                    return alert(messages[error.message] || 'Không thể tạo tài khoản do lỗi máy chủ. Vui lòng thử lại.');
                }
                alert('Đã tạo tài khoản học sinh!');
            }
            this.renderPlayersList(false);
        },
        editUser(username) {
            this.showAddPlayerForm(username);
        },
        editQuestion(idx) {
            this.renderQSubTab('add', idx);
        },
        
        
        updateBulkDeleteLabel() {
            const checkboxes = document.querySelectorAll('.q-select-cb:checked');
            const btn = document.getElementById('btn-q-bulk-del');
            if (btn) {
                if (checkboxes.length > 0) {
                    btn.style.display = 'inline-block';
                    btn.textContent = `Xóa các câu đã chọn (${checkboxes.length})`;
                } else {
                    btn.style.display = 'none';
                }
            }
        },

        toggleAllQSelect(masterCb) {
            const table = masterCb.closest('table');
            const tbody = table.querySelector('tbody');
            const visibleRows = Array.from(tbody.querySelectorAll('tr')).filter(r => r.style.display !== 'none');
            visibleRows.forEach(r => {
                const cb = r.querySelector('.q-select-cb');
                if (cb) cb.checked = masterCb.checked;
            });
            this.updateBulkDeleteLabel();
        },
        async bulkDeleteQuestions() {
            const checkboxes = document.querySelectorAll('.q-select-cb:checked');
            if (checkboxes.length === 0) return alert('Vui lòng chọn ít nhất 1 câu hỏi để xóa!');
            if (!confirm(`Bạn có chắc chắn muốn xóa ${checkboxes.length} câu hỏi đã chọn?`)) return;

            // Get indices sorted descending to safely splice
            const indices = Array.from(checkboxes).map(cb => parseInt(cb.value)).sort((a, b) => b - a);
            
            // For Supabase
            let deletedCount = 0;
            if (window.supabase) {
                const idsToDelete = [];
                for (let idx of indices) {
                    const q = app.data.libraryQuestions[idx];
                    if (q.id) idsToDelete.push(q.id);
                }
                if (idsToDelete.length > 0) {
                    const { error } = await supabaseClient.from('game_questions').delete().in('id', idsToDelete);
                    if (error) console.error('Bulk delete error:', error);
                }
            }

            for (let idx of indices) {
                app.data.libraryQuestions.splice(idx, 1);
                deletedCount++;
            }

            await app.data.saveLibrary();
            alert(`Đã xóa thành công ${deletedCount} câu hỏi!`);
            this.renderQSubTab('lib');
        },

        async deleteQuestion(idx) {
            if (confirm('Xác nhận xóa câu hỏi này?')) {
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
            if (confirm('Xóa câu hỏi này khỏi đề kiểm tra?')) {
                app.data.exams[examIdx].questions.splice(qIdx, 1);
                app.data.saveExams();
                this.renderESubTab('add', examIdx);
            }
        },
        async deleteExam(idx) {
            if (confirm('Xác nhận xóa đề kiểm tra này?')) {
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
            if (confirm('Xóa học sinh này?')) {
                const user = app.data.users.find(u => u.username === username);
                try {
                    await app.auth.manageStudentAccount({ action: 'delete', username });
                } catch (_) {
                    return alert('Không thể xóa tài khoản học sinh. Vui lòng thử lại.');
                }
                app.data.users = app.data.users.filter(u => u.username !== username);
                this.switchTab('players');
            }
        }
    },

    treasure: {
        studentProfileDetails: {},
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
                    { id: 'history', label: 'Lịch sử làm bài' },
                    { id: 'student-profile', label: 'Hồ sơ học sinh' }
                ];
                app.ui.renderTabs(tabs, tab, 'app.treasure.switchTab');

                if (tab === 'leaderboard') this.renderAdminLeaderboard(box);
                else if (tab === 'history') this.renderAdminHistory(box);
                else if (tab === 'student-profile') this.renderStudentProfile(box);
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
                { label: 'Sao', filterable: false }
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

            lbData.sort((a, b) => b.filteredScore - a.filteredScore);

            if (limitFilter === 'Top 10') lbData = lbData.slice(0, 10);
            else if (limitFilter === 'Top 20') lbData = lbData.slice(0, 20);

            if (!updateTableOnly) {
                let html = `<div class="admin-control-panel">
             <button class="acp-btn" onclick="app.treasure.renderAdminLeaderboard(document.getElementById('treasure-content-area'))">Tất cả</button>
             <div class="acp-center">
                 <div class="acp-row">
                     <input type="hidden" id="admin-lb-class" value="${classFilter}">
                     ${['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'].map(c => `<button class="${c === classFilter ? 'btn-primary' : 'btn-opt'}" onclick="document.getElementById('admin-lb-class').value='${c}'; app.treasure.applyFilters('leaderboard', false)">${c}</button>`).join('')}
                 </div>
                 <div class="acp-row">
                     <input type="hidden" id="admin-lb-limit" value="${limitFilter}">
                     ${['Top 10', 'Top 20', 'Tất cả theo cấp lớp'].map(l => `<button class="${l === limitFilter ? 'btn-primary' : 'btn-opt'}" onclick="document.getElementById('admin-lb-limit').value='${l}'; app.treasure.applyFilters('leaderboard', false)">${l}</button>`).join('')}
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
                return `<tr><td>${i + 1}</td><td>${app.data.sanitizeHTML(s.fullname)}</td><td>${totalExams}</td><td>${scoreDisplay}</td><td>${s.stars || 0}</td></tr>`;
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
            allHist.sort((a, b) => new Date(b.date) - new Date(a.date));

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
                     ${['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'].map(c => `<button class="${c === classFilter ? 'btn-primary' : 'btn-opt'}" onclick="document.getElementById('admin-hist-class').value='${c}'; document.getElementById('admin-hist-student').value=''; app.treasure.applyFilters('history', false)">${c}</button>`).join('')}
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
                    star = ' ⭐';
                }

                const scoreHtml = `<span style="color: ${scoreColor}; ${scoreStyle}">${s}/10${star}</span>`;
                const clsDisplay = h.classlevel ? (String(h.classlevel).includes('Lớp') ? h.classlevel : 'Lớp ' + h.classlevel) : '';

                return `<tr><td>${clsDisplay}</td><td>${h.studentName}</td><td>${h.title || h.module || 'Bài tập'}</td><td>${h.topic || '---'}</td><td>${h.difficulty || '---'}</td><td>${h.questionCount || h.details?.length || 10}</td><td>${scoreHtml}</td><td>${h.date}</td>
         <td><button class="btn-success action-btn" data-record="${encoded}" onclick="app.ui.showHistoryDetails(this)">Xem</button></td></tr>`;
            });

            const container = document.getElementById('admin-hist-table-container');
            if (container) container.innerHTML = tableHtml;
        },
        renderStudentProfile(box) {
            const students = app.data.users
                .filter(user => user.role?.toLowerCase() !== 'admin')
                .sort((left, right) => String(left.fullname || '').localeCompare(String(right.fullname || ''), 'vi'));
            const options = students.map(user => `<option value="${app.data.sanitizeHTML(user.username)}">${app.data.sanitizeHTML(`${user.fullname} — Lớp ${user.classlevel || ''}${user.class_name ? ` · ${user.class_name}` : ''} (${user.username})`)}</option>`).join('');
            box.innerHTML = `
                <div class="admin-control-panel" style="align-items:center;">
                    <div class="acp-center" style="max-width:620px; width:100%;">
                        <label for="student-profile-select" style="font-weight:bold;">Chọn học sinh:</label>
                        <select id="student-profile-select" class="form-input" style="width:100%; margin-top:8px;" onchange="app.treasure.loadStudentProfile(this.value)">
                            <option value="">-- Chọn học sinh để xem hồ sơ --</option>
                            ${options}
                        </select>
                    </div>
                </div>
                <div id="student-profile-detail" style="margin-top:15px;"><p style="text-align:center; padding:25px;">Chọn một học sinh để xem toàn bộ hồ sơ và xuất Excel riêng.</p></div>`;
        },
        async getStudentProfileData(username) {
            const student = app.data.users.find(user => user.username === username && user.role?.toLowerCase() !== 'admin');
            if (!student) return null;
            if (!window.supabase) {
                return {
                    student,
                    pets: (app.data.userPets || []).filter(item => item.user_username === username),
                    quests: (app.data.userQuests || []).filter(item => item.user_username === username),
                    seenQuestions: []
                };
            }
            const [petsResult, questsResult, seenResult] = await Promise.all([
                supabaseClient.from('user_pets').select('*').eq('user_username', username),
                supabaseClient.from('user_quests').select('*').eq('user_username', username),
                supabaseClient.from('user_question_history').select('question_key,last_seen_at').eq('user_username', username)
            ]);
            const failures = [petsResult, questsResult, seenResult].filter(result => result.error);
            if (failures.length) console.error('Không thể tải đủ dữ liệu hồ sơ học sinh:', failures.map(result => result.error));
            return {
                student,
                pets: petsResult.data || [],
                quests: questsResult.data || [],
                seenQuestions: seenResult.data || []
            };
        },
        getStudentLearningSummary(history) {
            const attempts = history || [];
            const totalScore = attempts.reduce((sum, item) => sum + Number(item.score || 0), 0);
            const weakTopics = {};
            attempts.forEach(item => {
                if (Number(item.score || 0) < 8) {
                    const topic = item.topic || 'Đề kiểm tra/Tổng hợp';
                    weakTopics[topic] = (weakTopics[topic] || 0) + 1;
                }
            });
            return {
                attempts: attempts.length,
                average: attempts.length ? (totalScore / attempts.length).toFixed(1) : '0',
                lastAttempt: attempts[0]?.date || 'Chưa có',
                weakTopics: Object.entries(weakTopics).sort((left, right) => right[1] - left[1]).slice(0, 5)
            };
        },
        async loadStudentProfile(username) {
            const detail = document.getElementById('student-profile-detail');
            if (!username) {
                if (detail) detail.innerHTML = '<p style="text-align:center; padding:25px;">Chọn một học sinh để xem hồ sơ.</p>';
                return;
            }
            if (detail) detail.innerHTML = '<p style="text-align:center; padding:25px;">Đang tải hồ sơ học sinh...</p>';
            const profile = await this.getStudentProfileData(username);
            if (!profile || !detail) return;
            this.studentProfileDetails[username] = profile;
            const { student, pets, quests, seenQuestions } = profile;
            const history = [...(student.history || [])].sort((left, right) => new Date(right.date) - new Date(left.date));
            const summary = this.getStudentLearningSummary(history);
            const questRows = quests.map(progress => {
                const quest = (app.data.quests || []).find(item => item.id === progress.quest_id);
                return `<li>${app.data.sanitizeHTML(quest?.title || 'Nhiệm vụ đã xóa')}: ${progress.progress || 0}/${quest?.target_count || '?'}${progress.is_completed ? ' — Đã nhận thưởng' : ''}</li>`;
            }).join('') || '<li>Chưa có tiến độ nhiệm vụ.</li>';
            const petRows = pets.map(pet => app.data.sanitizeHTML(pet.pet_name || pet.name || 'Thú cưng')).join(', ') || 'Chưa có';
            const historyRows = history.map((item, index) => `<tr><td>${index + 1}</td><td>${app.data.sanitizeHTML(item.title || item.module || 'Bài tập')}</td><td>${app.data.sanitizeHTML(item.topic || '---')}</td><td>${item.questionCount || item.details?.length || 0}</td><td>${item.score || 0}/10</td><td>${app.data.sanitizeHTML(item.date || '')}</td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;">Chưa có lịch sử làm bài.</td></tr>';
            const encodedUsername = encodeURIComponent(student.username);
            detail.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:15px; flex-wrap:wrap; margin-bottom:15px;">
                    <h3 style="margin:0;">Hồ sơ: ${app.data.sanitizeHTML(student.fullname)}</h3>
                    ${app.ui.compactAction('Xuất Excel hồ sơ này', `app.treasure.exportStudentProfile(decodeURIComponent('${encodedUsername}'))`, 'compact-admin-action--save')}
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:12px;">
                    <div class="glass-container" style="padding:14px;"><h4>Thông tin tài khoản</h4><p>Username: <b>${app.data.sanitizeHTML(student.username)}</b><br>Mật khẩu: <b>Không hiển thị (có thể đặt lại)</b><br>Cấp lớp: <b>${app.data.sanitizeHTML(student.classlevel || '')}</b><br>Lớp: <b>${app.data.sanitizeHTML(student.class_name || '—')}</b><br>Giới tính: <b>${app.data.sanitizeHTML(app.data.genderLabel(student.gender))}</b><br>Trạng thái: <b>${student.approved ? 'Đã duyệt' : 'Chờ duyệt'}</b></p></div>
                    <div class="glass-container" style="padding:14px;"><h4>Học tập</h4><p>Số bài: <b>${summary.attempts}</b><br>Điểm trung bình: <b>${summary.average}/10</b><br>Lần gần nhất: <b>${app.data.sanitizeHTML(summary.lastAttempt)}</b><br>Câu đã gặp: <b>${seenQuestions.length}</b></p></div>
                    <div class="glass-container" style="padding:14px;"><h4>Phần thưởng</h4><p>Sao hiện có: <b>${student.stars || 0}</b><br>Thú cưng: ${petRows}</p></div>
                    <div class="glass-container" style="padding:14px;"><h4>Nội dung cần bồi dưỡng</h4><p>${summary.weakTopics.length ? summary.weakTopics.map(([topic, count]) => `${app.data.sanitizeHTML(topic)} (${count} lượt dưới 8 điểm)`).join('<br>') : 'Chưa có dữ liệu cần bồi dưỡng.'}</p></div>
                </div>
                <div class="glass-container" style="padding:14px; margin-top:15px;"><h4>Tiến độ nhiệm vụ</h4><ul style="margin:0; padding-left:20px;">${questRows}</ul></div>
                <div style="overflow:auto; margin-top:15px;"><table class="data-table"><thead><tr><th>#</th><th>Bài làm</th><th>Chủ đề</th><th>Số câu</th><th>Điểm</th><th>Ngày</th></tr></thead><tbody>${historyRows}</tbody></table></div>`;
        },
        async exportStudentProfile(username) {
            const profile = this.studentProfileDetails[username] || await this.getStudentProfileData(username);
            if (!profile) return alert('Không tìm thấy hồ sơ học sinh.');
            this.studentProfileDetails[username] = profile;
            const { student, pets, quests, seenQuestions } = profile;
            const rows = [
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Họ tên', 'Giá trị': student.fullname || '' },
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Username', 'Giá trị': student.username || '' },
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Mật khẩu', 'Giá trị': 'Không xuất vì mật khẩu được bảo mật' },
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Lớp', 'Giá trị': student.classlevel || '' },
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Lớp con', 'Giá trị': student.class_name || '' },
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Giới tính', 'Giá trị': app.data.genderLabel(student.gender) },
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Sao hiện có', 'Giá trị': student.stars || 0 },
                { 'Nhóm dữ liệu': 'Thông tin', 'Nội dung': 'Câu đã gặp', 'Giá trị': seenQuestions.length }
            ];
            (student.history || []).forEach(item => {
                rows.push({ 'Nhóm dữ liệu': 'Lịch sử làm bài', 'Nội dung': item.title || item.module || 'Bài tập', 'Chủ đề': item.topic || '', 'Điểm': item.score || 0, 'Số câu': item.questionCount || item.details?.length || 0, 'Ngày': item.date || '' });
                (item.details || []).filter(detail => !detail.isCorrect).forEach(detail => rows.push({ 'Nhóm dữ liệu': 'Câu cần bồi dưỡng', 'Nội dung': detail.q || '', 'Đã chọn': detail.selected ?? detail.userAns ?? '', 'Đáp án đúng': detail.correct ?? detail.correctAns ?? '', 'Ngày': item.date || '' }));
            });
            pets.forEach(pet => rows.push({ 'Nhóm dữ liệu': 'Thú cưng', 'Nội dung': pet.pet_name || pet.name || '', 'Ngày': pet.obtained_at || '' }));
            quests.forEach(progress => {
                const quest = (app.data.quests || []).find(item => item.id === progress.quest_id);
                rows.push({ 'Nhóm dữ liệu': 'Nhiệm vụ', 'Nội dung': quest?.title || 'Nhiệm vụ đã xóa', 'Tiến độ': `${progress.progress || 0}/${quest?.target_count || '?'}`, 'Trạng thái': progress.is_completed ? 'Đã nhận thưởng' : 'Đang thực hiện' });
            });
            const safeName = String(student.fullname || student.username || 'hoc_sinh').replace(/[\\/:*?"<>|]/g, '_');
            await app.ui.exportToExcel(rows, `Ho_so_${safeName}.xlsx`);
        },
        renderStudentTreasure(box, u) {
            let html = `<div style="text-align:center; padding: 30px 0;">
         <h3 style="font-size: 1.5rem;">Kho báu của ${app.data.sanitizeHTML(u.fullname)}</h3>
         <p style="color: #ccc; margin-top: 10px;">Tổng điểm: <span style="color:#fde047; font-weight:bold; font-size:1.2rem;">${u.totalscore || 0}</span></p>
         <div style="font-size:2rem; margin:20px 0; display:flex; flex-wrap:wrap; justify-content:center; gap:5px;">`;
            const stars = u.stars || 0;
            if (stars === 0) html += `<p style="font-size: 1rem; color: #888;">Bạn chưa có sao nào. Hãy hoàn thành bài để nhận sao nhé!</p>`;
            for (let i = 0; i < stars; i++) html += '<img src="./public/star-gold-3d.svg" style="width:50px; margin:2px;" class="bounce">';
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
            myHist.sort((a, b) => new Date(b.date) - new Date(a.date));
            box.innerHTML = app.ui.renderTable(cols, myHist, (h, i) => {
                const encoded = encodeURIComponent(JSON.stringify(h));
                const s = parseFloat(h.score || 0);
                let scoreColor = '#fff';
                let scoreStyle = '';
                let star = '';
                if (s < 5) scoreColor = '#ef4444';
                else if (s >= 5 && s < 8) scoreColor = '#facc15';
                else if (s >= 8 && s < 10) scoreColor = '#4ade80';
                else if (s === 10) { scoreColor = '#22c55e'; scoreStyle = 'font-weight:bold; font-size:1.1em;'; star = ' ⭐'; }
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
                container.style.background = 'url("./public/leaderboard_bg.webp") no-repeat center center';
                content.style.paddingTop = '600px';
            } else {
                container.style.background = 'url("./public/history_bg.webp") no-repeat center center';
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
                        if (row.children.length > 0) row.children[row.children.length - 1].remove();
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
        init() { },
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

            const activeTeamMatches = app.teamCompetition?.getActiveForUser?.(user.username) || [];
            let teamCompetitionHtml = '';
            activeTeamMatches.forEach(match => {
                const team = app.teamCompetition.getTeamsForUser(match, user.username)[0];
                if (!team) return;
                const attempt = app.teamCompetition.attemptStore.get(match.id, team.id);
                const isLeader = String(team.leaderUsername) === String(user.username);
                let action = '<span class="team-student-status">Theo dõi kết quả nhóm</span>';
                if (isLeader && !attempt) action = `<button type="button" class="btn-success" onclick="app.teamCompetition.openLeaderAttempt(decodeURIComponent('${encodeURIComponent(String(match.id))}'))">Vào lượt trưởng nhóm</button>`;
                else if (isLeader && attempt?.status === app.teamCompetition.ATTEMPT_STATUS.ACTIVE) action = `<button type="button" class="btn-primary" onclick="app.teamCompetition.openLeaderAttempt(decodeURIComponent('${encodeURIComponent(String(match.id))}'))">Tiếp tục lượt nhóm</button>`;
                else if (isLeader && attempt) action = `<span class="team-student-status">${attempt.status === app.teamCompetition.ATTEMPT_STATUS.LOCKED ? 'Lượt đã khóa' : 'Đã hoàn thành'}</span>`;
                const rank = app.teamCompetition.getTeamRank(match, team.id);
                const score = Number(team.score || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
                teamCompetitionHtml += `<article class="student-team-competition-card"><div><p class="student-team-competition-kicker">Thi đua theo nhóm · ${app.teamCompetition.STATUS_LABELS[match.status]}</p><h4>${app.data.sanitizeHTML(match.name)}</h4><p>Nhóm của bạn: <strong>${app.data.sanitizeHTML(team.name)}</strong> · ${team.memberUsernames.length} thành viên · ${isLeader ? 'Bạn là trưởng nhóm' : 'Bạn tham gia cùng nhóm'}</p><p class="student-team-competition-score">Điểm nhóm: <strong>${score}/10</strong> · Hạng: <strong>${rank}</strong></p></div><div>${action}</div></article>`;
            });

            // Hộp quà hằng ngày hiển thị trong trạm Nhiệm vụ
            let giftBoxHtml = '';
            if (!app.daily.giftClaimedToday(user)) {
                giftBoxHtml = `
                    <div class="quest-gift-box">
                        <img src="./public/star-gold-3d.svg" alt="Sao vàng" class="quest-gift-star">
                        <div class="quest-gift-info">
                            <h4>Hộp Quà Hằng Ngày 🎁</h4>
                            <p>Vào và làm ít nhất 1 lượt luyện tập hôm nay để nhận 1 Sao. Mở hộp quà để nhận phần quà hôm nay!</p>
                        </div>
                        <button class="btn-claim-star" onclick="app.daily.claimDailyGift()">Nhận Quà 🎁</button>
                    </div>`;
            }

            if (activeQuests.length === 0) {
                container.innerHTML = giftBoxHtml + teamCompetitionHtml + (teamCompetitionHtml ? '' : '<p style="text-align:center; padding: 20px;">Hiện tại chưa có nhiệm vụ nào.</p>');
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
                    btnHtml = `<button class="btn-claim-star" onclick="app.quest.claimReward('${q.id}')" aria-label="Nhận ${q.reward_stars} sao">Nhận ${q.reward_stars} Sao ⭐</button>`;
                } else {
                    btnHtml = q.exam_id
                        ? `<button class="asset-button asset-button--pet" onclick="app.quest.startExam('${q.id}')" aria-label="Làm đề, tiến độ ${progress}/${q.target_count}">
                            <img src="./public/ui/buttons/group2/start-mission-exam.png" alt="" aria-hidden="true">
                        </button>`
                        : `<button class="btn-primary" style="opacity:0.5; cursor:not-allowed;" disabled>${progress}/${q.target_count}</button>`;
                }

                const questExam = q.exam_id ? app.data.exams.find(exam => exam.id === q.exam_id) : null;
                const requirement = questExam
                    ? `Làm đề: ${app.data.sanitizeHTML(questExam?.name || 'Đề đã bị xóa')} đạt >= ${q.target_score} điểm`
                    : `Yêu cầu: ${q.target_subject === 'any' ? 'Môn bất kỳ' : (q.target_subject === 'math' ? 'Môn Toán' : 'Môn Tiếng Việt')} đạt >= ${q.target_score} điểm`;

                html += `<div style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0 0 5px 0; color:#b45309; font-size: 1.2rem;">${app.data.sanitizeHTML(q.title)}</h4>
                    <p style="margin:0; font-size:0.9rem; color:#666;">${requirement}</p>
                </div>
                <div>
                    ${btnHtml}
                </div>
            </div>`;
            });
            container.innerHTML = giftBoxHtml + teamCompetitionHtml + html;
        },
        startExam(questId) {
            const quest = app.data.quests.find(item => item.id === questId);
            const exam = quest?.exam_id && app.data.exams.find(item => item.id === quest.exam_id);
            if (!quest || !exam) return alert('Không tìm thấy đề kiểm tra của nhiệm vụ này.');
            document.getElementById('quest-modal').style.display = 'none';
            app.exam.filters.subject = exam.subject === 'Toán' ? 'math' : 'vietnamese';
            app.exam.filters.period = exam.period;
            app.exam.start(exam.id, quest.id);
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
            app.daily.addStars(user, q.reward_stars);
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
                // D5: chạy song song 2 lệnh cập nhật độc lập để giảm round-trip.
                await Promise.all([
                    supabaseClient.from('user_quests').update({ is_completed: true }).eq('id', uq.id),
                    supabaseClient.from('game_users').update({ stars: user.stars, total_stars_earned: user.total_stars_earned || 0 }).eq('id', user.id)
                ]);
            } else {
                app.data.saveUsers();
            }
        },
        async updateProgress(subject, score, examId = null, questId = null, context = {}) {
            const user = app.data.currentUser;
            if (!user || user.role === 'admin') return;

            const clLvl = String(user.classlevel || '5').replace('Lớp ', '').trim();
            const same = (left, right) => app.data.normalizeQuestionPart(left) === app.data.normalizeQuestionPart(right);
            const playedTopics = Array.isArray(context.topics) ? context.topics : [];
            const playedLessons = Array.isArray(context.lessons) ? context.lessons : [];
            const activeQuests = (app.data.quests || []).filter(q => {
                if (!q.is_active) return false;
                if (q.assign_type === 'all' || (q.assign_type === 'class' && q.assign_target === clLvl) || (q.assign_type === 'user' && q.assign_target === user.username)) {
                    if (q.exam_id && (q.id !== questId || q.exam_id !== examId)) return false;
                    if (!q.exam_id && questId) return false;
                    if (q.target_subject === 'any' || q.target_subject === subject) {
                        const curriculum = q.curriculum || {};
                        if (curriculum.classlevel && app.curriculum?.normalizeClassNumber(curriculum.classlevel) !== clLvl) return false;
                        if (curriculum.topic && !playedTopics.some(topic => same(topic, curriculum.topic))) return false;
                        if (curriculum.lesson && !playedLessons.some(lesson => same(lesson, curriculum.lesson))) return false;
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
        init() { },
        open() {
            const modal = document.getElementById('shop-modal');
            modal.style.display = 'flex';
            modal.classList.add('active');
            this.switchTab('pets', document.querySelector('#shop-modal .notebook-tab.active') || document.querySelector('#shop-modal .notebook-tab'));
        },
        switchTab(tab, btnEl) {
            const activeButton = btnEl || document.querySelector(`#shop-modal .notebook-tab[data-shop-tab="${tab}"]`);
            if (activeButton) {
                document.querySelectorAll('#shop-modal .notebook-tab').forEach(b => b.classList.remove('active'));
                activeButton.classList.add('active');
            }
            const box = document.getElementById('shop-content-area');
            box.classList.toggle('shop-content--lucky', tab === 'lucky');
            const user = app.data.currentUser;
            if (!user) return;

            if (tab === 'lucky') {
                this.renderLuckyStation(box, user);
            } else if (tab === 'pets') {
                this.renderPetStation(box, user);
            } else if (tab === 'mypets') {
                this.renderMyPets(box, user);
            }
        },
        getLuckySpinDay() {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date()).split('/').reverse().join('-');
        },
        getLuckySpinsToday(user) {
            return user.lucky_spin_date === this.getLuckySpinDay() ? Number(user.lucky_spin_count || 0) : 0;
        },
        renderLuckyStation(box, user) {
            let isSpinning = this.isSpinning || false;
            const spinsToday = this.getLuckySpinsToday(user);
            const remainingSpins = Math.max(0, 3 - spinsToday);
            const cannotSpin = isSpinning || remainingSpins === 0;

            let html = `
        <div class="lucky-station-layout">
            <div class="lucky-wheel-pane">
                <div class="lucky-wheel-wrap">
                    <!-- Vùng chứa tỉ lệ chuẩn, khóa chặt 3 ảnh lại với nhau -->
                    <div class="lucky-wheel-stage">
                        <div style="position:relative; width: 100%;">
                            <!-- Wheel Stand (Giữ khung tỉ lệ) -->
                            <img src="./public/wheel_stand.webp" style="width:100%; height:auto; display:block; z-index:1; pointer-events:none; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.6));">
                            
                            <!-- The Wheel -->
                            <div id="lucky-wheel-circle" style="position:absolute; width: 70%; aspect-ratio: 1 / 1; top: 30%; left: 50%; z-index:2; 
                                        transform: translate(-50%, -50%) rotate(${this.currentRotation || 0}deg); 
                                        transform-origin: center center;">
                                <img src="./public/wheel_circle.webp" style="width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 0px 20px rgba(147,51,234,0.6));">
                            </div>
                            
                            <!-- Side Pointer/Pin -->
                            <img src="./public/wheel_pointer.webp" style="position:absolute; top: 30%; right: 7%; transform: translateY(-50%); z-index:3; width: 22%; height: auto; object-fit:contain; filter: drop-shadow(-5px 0 10px rgba(0,0,0,0.6));">
                        </div>
                    </div>
                </div>
            </div>

            <div class="lucky-info-pane">
                <div class="lucky-info-card">
                    <h2 class="lucky-station-title">Trạm May Mắn</h2>
                    
                    <div class="lucky-star-row">
                        <div class="lucky-star-count">
                            Bạn đang có: <span id="lucky-star-balance" style="font-size:2rem; color:#f59e0b;">${user.stars || 0}</span> ⭐
                        </div>
                    </div>
                    <p class="lucky-spin-count" style="color:${remainingSpins ? '#475569' : '#dc2626'};">Lượt quay hôm nay: ${remainingSpins}/3</p>
                    
                    <div class="lucky-rules">
                        <h3 style="margin-top:0; color: #475569;">Thể lệ Vòng Quay:</h3>
                        <ul style="padding-left: 20px; margin-bottom:0;">
                            <li><b style="color:#ef4444;">May mắn lần sau</b></li>
                            <li><b style="color:#22c55e;">Tặng 5 sao</b></li>
                            <li><b style="color:#3b82f6;">Tặng 2 sao</b></li>
                            <li><b style="color:#a855f7;">Tặng 1 sao</b></li>
                            <li><b style="color:#eab308;">Tặng 1 thú cưng</b> (không gồm Rồng, tùy tồn kho chung)</li>
                            <li><b style="color:#0ea5e9;">Quay lại</b> (Miễn phí 1 lần quay tới)</li>
                            <li>Tối đa <b>3 lượt/ngày</b>; lượt chưa dùng sẽ không cộng dồn.</li>
                        </ul>
                    </div>
                    
                    <button id="btn-spin-lucky" class="asset-button asset-button--wide lucky-spin-button"
                        onclick="app.shop.spinWheel()"
                        ${cannotSpin ? 'disabled' : ''} aria-label="${remainingSpins === 0 ? 'Đã hết lượt quay hôm nay' : 'Quay may mắn, giá 2 sao'}">
                        <img src="./public/ui/buttons/group2/spin-lucky.png" alt="" aria-hidden="true">
                    </button>
                </div>
            </div>
        </div>`;
            box.innerHTML = html;
        },

        async spinWheel() {
            if (this.isSpinning) return;

            const user = app.data.currentUser;
            if (!user) return;
            let starsBeforeSpin = user.stars || 0;
            let totalStarsBeforeSpin = user.total_stars_earned || 0;

            const today = this.getLuckySpinDay();
            let spinsToday = this.getLuckySpinsToday(user);
            if (window.supabase && user.id) {
                const { data, error } = await supabaseClient.from('game_users')
                    .select('stars,lucky_spin_date,lucky_spin_count').eq('id', user.id).single();
                if (error || !data) return alert('Không thể kiểm tra lượt quay hôm nay. Vui lòng thử lại.');
                user.stars = data.stars || 0;
                user.lucky_spin_date = data.lucky_spin_date;
                user.lucky_spin_count = data.lucky_spin_count || 0;
                starsBeforeSpin = user.stars;
                spinsToday = this.getLuckySpinsToday(user);
            }
            if (spinsToday >= 3) {
                return alert('Bạn đã dùng hết 3 lượt quay hôm nay. Hãy quay lại vào ngày mai nhé!');
            }
            const nextSpinCount = spinsToday + 1;

            let freeSpin = this.freeSpin || false;
            if (!freeSpin && (user.stars || 0) < 2) {
                return alert("Bạn không đủ Sao để quay!");
            }

            if (!freeSpin) {
                user.stars -= 2;
                app.auth.updateHeader();
            }
            this.freeSpin = false;
            this.isSpinning = true;

            const starSpan = document.getElementById('lucky-star-balance');
            if (starSpan) starSpan.innerText = user.stars || 0;

            const spinBtn = document.getElementById('btn-spin-lucky');
            if (spinBtn) {
                spinBtn.disabled = true;
                spinBtn.style.opacity = '0.5';
                spinBtn.style.cursor = 'not-allowed';
            }

            let segment = 0;
            let rewardText = "";
            let wonPet = null;
            let wonPetId = null;

            // Thú cưng chỉ có xác suất 0,001 = 0,1% (1/1000 lượt quay).
            // Rồng chỉ đổi trong cửa hàng bằng sao, không nằm trong phần thưởng vòng quay.
            if (Math.random() < 0.001) {
                segment = 2;
                const myPets = (app.data.userPets || []).filter(x => x.user_username === user.username);
                if (myPets.length >= 3) {
                    rewardText = 'Bạn đã có đủ 3 thú cưng nên không thể nhận thêm từ vòng quay.';
                } else {
                    const ownedImages = myPets.map(pet => pet.pet_image);
                    const eligiblePets = this.shopData.filter(pet =>
                        pet.id !== 'pet_dragon' &&
                        !ownedImages.includes(pet.image) &&
                        app.data.getPetStock(pet.id, 8) > 0
                    );
                    if (eligiblePets.length === 0) {
                        rewardText = 'Kho thú cưng dùng chung đã hết hoặc bạn đã sở hữu các bé có thể nhận. May mắn lần sau nhé!';
                    } else {
                        const randomPet = eligiblePets[Math.floor(Math.random() * eligiblePets.length)];
                        const reserved = await app.data.changePetStock(randomPet.id, -1, 8);
                        if (reserved) {
                            wonPetId = randomPet.id;
                            wonPet = {
                                user_username: user.username,
                                pet_name: randomPet.name,
                                pet_image: randomPet.image,
                                rarity: 'common'
                            };
                            rewardText = `Tuyệt vời! Bạn nhận được Thú cưng: ${randomPet.name}!`;
                        } else {
                            rewardText = 'Thú cưng vừa hết trong kho dùng chung. May mắn lần sau nhé!';
                        }
                    }
                }
            } else {
                // Phân bố các phần thưởng còn lại, giữ nguyên tỉ lệ tương đối cũ.
                const rand = Math.random() * 97;
                if (rand < 12) {
                segment = 0;
                rewardText = "Hoan hô! Bạn nhận được 1 sao ⭐.";
                app.daily.addStars(user, 1);
            } else if (rand < 20) {
                segment = 1;
                rewardText = "Chúc mừng! Bạn nhận được 2 sao ⭐.";
                app.daily.addStars(user, 2);
            } else if (rand < 33.33) {
                segment = 3;
                rewardText = "Rất tiếc! May mắn lần sau nhé.";
            } else if (rand < 43.33) {
                segment = 4;
                rewardText = "Hay quá! Bạn được thưởng 1 lượt Quay lại Miễn phí.";
                this.freeSpin = true;
            } else if (rand < 48.33) {
                segment = 5;
                rewardText = "Chúc mừng! Bạn nhận được 5 sao ⭐.";
                app.daily.addStars(user, 5);
            } else if (rand < 61.66) {
                segment = 6;
                rewardText = "Rất tiếc! May mắn lần sau nhé.";
            } else if (rand < 73.66) {
                segment = 7;
                rewardText = "Hoan hô! Bạn nhận được 1 sao ⭐.";
                app.daily.addStars(user, 1);
            } else if (rand < 87) {
                segment = 8;
                rewardText = "Rất tiếc! May mắn lần sau nhé.";
            } else {
                segment = 9;
                rewardText = "Hay quá! Bạn được thưởng 1 lượt Quay lại Miễn phí.";
                this.freeSpin = true;
            }
            }

            // Pointer is at 3 o'clock (90 degrees).
            // Text is drawn at i*36 + 18 + OFFSET_DEG (offset is 17) -> i*36 + 35 degrees clockwise from top.
            // Rotation needed to place this text at 90 degrees: 90 - (i*36 + 35) = 55 - i*36
            const segmentTextAngle = segment * 36 + 35;
            const currentTotalRotation = this.currentRotation || 0;
            const currentBase = currentTotalRotation % 360;

            const extraDegreesToTarget = (90 - segmentTextAngle) - currentBase;
            // Add full spins + align to target
            const targetRotation = currentTotalRotation + (360 * 6) + extraDegreesToTarget;

            this.currentRotation = targetRotation;

            const wheelEl = document.getElementById('lucky-wheel-circle');
            if (wheelEl) {
                wheelEl.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)';
                wheelEl.style.transform = `translate(-50%, -50%) rotate(${targetRotation}deg)`;
            }

            setTimeout(async () => {
                if (window.supabase) {
                    const { error: starError } = await supabaseClient.from('game_users').update({
                        stars: user.stars || 0, total_stars_earned: user.total_stars_earned || 0, lucky_spin_date: today, lucky_spin_count: nextSpinCount
                    }).eq('id', user.id);
                    if (starError) {
                        if (wonPetId) await app.data.changePetStock(wonPetId, 1, 8);
                        user.stars = starsBeforeSpin;
                        user.total_stars_earned = totalStarsBeforeSpin;
                        rewardText = 'Không thể lưu kết quả vòng quay. Vui lòng thử lại.';
                    } else if (wonPet) {
                        user.lucky_spin_date = today;
                        user.lucky_spin_count = nextSpinCount;
                        const { data, error: petError } = await supabaseClient.from('user_pets').insert([wonPet]).select();
                        if (petError || !data?.length) {
                            await app.data.changePetStock(wonPetId, 1, 8);
                            rewardText = 'Không thể nhận thú cưng. Kho đã được hoàn lại, vui lòng thử lại.';
                        } else {
                            app.data.userPets.push(data[0]);
                        }
                    } else {
                        user.lucky_spin_date = today;
                        user.lucky_spin_count = nextSpinCount;
                    }
                } else {
                    user.lucky_spin_date = today;
                    user.lucky_spin_count = nextSpinCount;
                    app.data.saveUsers();
                    if (wonPet) {
                        wonPet.id = 'temp_' + new Date().getTime();
                        app.data.userPets.push(wonPet);
                    }
                }
                app.auth.updateHeader();
                if (starSpan) starSpan.innerText = user.stars || 0;
                alert(rewardText);
                this.isSpinning = false;

                if (spinBtn) {
                    spinBtn.disabled = false;
                    spinBtn.style.opacity = '1';
                    spinBtn.style.cursor = 'pointer';
                }
            }, 5100);
        },
        shopData: [
            { id: 'pet_1', name: 'Thỏ Hồng Không Gian', image: 'pet_1.png', description: 'Thỏ Hồng Không Gian là phi thuyền mini luôn mang năng lượng tích cực! Sở hữu tốc độ cực nhanh, cậu ấy sẵn sàng giúp bạn vượt qua mọi thử thách. Kỹ năng "Ngưng Đọng Thời Không" sẽ đóng băng toàn bộ hệ thống đếm ngược, giúp bạn có thêm thời gian để phân tích và chốt đáp án!', skills: [{id: 'freeze_time', name: 'Ngưng Đọng Thời Không'}] },
            { id: 'pet_2', name: 'Gấu Trúc Siêu Chip', image: 'pet_2.png', description: 'Trông có vẻ hiền lành, nhưng Gấu Trúc Siêu Chip sở hữu hệ điều hành thiên tài và cực kỳ bình tĩnh. Cậu ấy luôn tính toán kỹ lưỡng trước mọi câu hỏi. Kỹ năng "Tia Laser Thanh Trừng" sẽ phát ra một luồng sáng cường độ cao, quét sạch một nửa số đáp án nhiễu để bạn dễ dàng lựa chọn!', skills: [{id: 'fifty_fifty', name: 'Tia Laser Thanh Trừng'}] },
            { id: 'pet_3', name: 'Ong Vệ Tinh Nhí', image: 'pet_3.png', description: 'Hoạt động bền bỉ như một vệ tinh vi mô, Ong Vệ Tinh Nhí không ngừng bay khắp vũ trụ để thu thập dữ liệu học thuật. Cậu ấy là nguồn động lực tuyệt vời. Kỹ năng "Tầm Nhìn Đa Chiều" sẽ kích hoạt con mắt sinh cơ học, hé lộ ngay lập tức lời giải chi tiết ẩn giấu đằng sau câu hỏi!', skills: [{id: 'show_hint', name: 'Tầm Nhìn Đa Chiều'}] },
            { id: 'pet_4', name: 'Cú Radar Tinh Anh', image: 'pet_4.png', description: 'Bậc thầy phân tích dữ liệu với đôi mắt hồng ngoại và lõi phép thuật lượng tử! Cú Radar Tinh Anh luôn nhìn thấu mọi bí ẩn của trò chơi. Khi gặp bế tắc, kỹ năng "Lõi Phân Tích AI" sẽ kích hoạt siêu máy tính, giải mã thẳng vào hệ thống để cung cấp ngay đáp án đúng cho bạn!', skills: [{id: 'show_answer', name: 'Lõi Phân Tích AI'}] },
            { id: 'pet_5', name: 'Chuột Capybara Từ Tính', image: 'pet_5.png', description: 'Dù không mang vũ khí tối tân, Chuột Capybara Từ Tính lại là chuyên gia tâm lý học, biến mọi giờ học thành cuộc phiêu lưu xả stress! Kỹ năng "Lá Chắn Năng Lượng" sẽ tạo ra một trường lực bảo vệ. Nếu bạn lỡ chọn sai, lá chắn sẽ hấp thụ sát thương, giúp bạn bảo toàn nguyên vẹn điểm số!', skills: [{id: 'shield', name: 'Lá Chắn Năng Lượng'}] },
            { id: 'pet_6', name: 'Cún Nâu Ngân Hà', image: 'pet_6.png', description: 'Người bạn đồng hành trung thành được trang bị trí tuệ nhân tạo cực đỉnh! Cún Nâu Ngân Hà không bao giờ chùn bước trước mọi thử thách. Kỹ năng "Bước Nhảy Lượng Tử" sẽ mở ra cổng không gian, hô biến câu hỏi khó nhằn hiện tại thành một câu hỏi hoàn toàn mới cùng chủ đề!', skills: [{id: 'swap_question', name: 'Bước Nhảy Lượng Tử'}] },
            { id: 'pet_7', name: 'Gà Vàng Lõi Quang', image: 'pet_7.png', description: 'Thiết bị báo thức sinh học lanh lợi nhất đội hình! Gà Vàng Lõi Quang luôn sạc đầy năng lượng để cùng bạn vượt qua các nhiệm vụ. Kỹ năng "Tia Laser Thanh Trừng" sẽ khởi động vũ khí quang học, bắn bay phân nửa số đáp án sai lừa tình, thu hẹp phạm vi để bạn tự tin chốt hạ!', skills: [{id: 'fifty_fifty', name: 'Tia Laser Thanh Trừng'}] },
            { id: 'pet_8', name: 'Chúa Tể Plasma', image: 'pet_8.png', description: 'Vị vua dũng mãnh của dải ngân hà, luôn tiên phong trong mọi cuộc chinh phục tri thức! Chúa Tể Plasma sẽ truyền cho bạn nguồn sức mạnh vô song. Kỹ năng "Lõi Phân Tích AI" sẽ truy cập vào máy chủ tối cao, bẻ khóa toàn bộ hàng rào bảo mật để đem về đáp án chính xác tuyệt đối!', skills: [{id: 'show_answer', name: 'Lõi Phân Tích AI'}] },
            { id: 'pet_9', name: 'Voi Siêu Bộ Nhớ', image: 'pet_9.png', description: 'Sở hữu ổ cứng siêu dung lượng cùng chiếc vòi đa cảm biến, Voi Siêu Bộ Nhớ lưu trữ mọi chiến thuật học tập hiệu quả. Cậu ấy luôn khuyên bạn giữ cái đầu lạnh. Kỹ năng "Tia Laser Thanh Trừng" sẽ dùng sóng âm quét sạch 50% các đáp án sai, dọn đường cho chiến thắng của bạn!', skills: [{id: 'fifty_fifty', name: 'Tia Laser Thanh Trừng'}] },
            { id: 'pet_10', name: 'Trâu Giáp Titan', image: 'pet_10.png', description: 'Cỗ xe tăng bọc thép không bao giờ lùi bước! Trâu Giáp Titan sở hữu động cơ bền bỉ, liên tục động viên bạn từng bước phá đảo trò chơi. Khi đối mặt với áp lực, kỹ năng "Ngưng Đọng Thời Không" sẽ can thiệp vào dòng chảy thời gian, cho bạn khoảng lặng hoàn hảo để suy nghĩ thấu đáo!', skills: [{id: 'freeze_time', name: 'Ngưng Đọng Thời Không'}] },
            { id: 'pet_dragon', name: 'Rồng Plasma Viễn Cổ', image: 'Pet_Dragon.png', description: 'Thần thú tối thượng của vũ trụ ảo, lao đi với tốc độ siêu thanh! Mang trong mình nguồn sức mạnh vô tận có thể thiêu rụi mọi chướng ngại. Sở hữu 2 kỹ năng độc quyền: "Hơi Thở Plasma" đốt cháy câu hỏi khó để đổi sang câu hỏi dễ hơn; và "Hào Quang Chân Lý" hiển thị tức thời đáp án đúng!', skills: [{id: 'swap_question', name: 'Hơi Thở Plasma'}, {id: 'show_answer', name: 'Hào Quang Chân Lý'}] }
        ],
        currentTrainIndex: 0,
        trainAnimationDir: 0,
        nextTrainCar(dir) {
            this.trainAnimationDir = dir;
            this.currentTrainIndex += dir;
            if (this.currentTrainIndex < 0) this.currentTrainIndex = this.shopData.length - 1;
            if (this.currentTrainIndex >= this.shopData.length) this.currentTrainIndex = 0;
            this.switchTab('pets');
        },
        renderPetStation(box, user) {
            let isAdmin = (user.role === 'admin');
            let myPets = (app.data.userPets || []).filter(x => x.user_username === user.username);

            let currentPet = this.shopData[this.currentTrainIndex];
            if (!currentPet) {
                this.currentTrainIndex = 0;
                currentPet = this.shopData[0];
            }

            const defaultStock = currentPet.id === 'pet_dragon' ? 5 : 8;
            const remaining = app.data.getPetStock(currentPet.id, defaultStock);
            const hasPet = myPets.some(p => p.pet_image === currentPet.image);
            const description = currentPet.description || "Chưa có dữ liệu.";

            let html = `
        <div style="height: 75vh; min-height: 500px; max-height: 800px; display:flex; flex-direction:row; gap: 20px;">
            <!-- Left Side: Machine (60%) -->
            <div style="flex: 1.5; min-width: 0; display:flex; flex-direction:column; justify-content:center; align-items:center; position:relative;">
                ${isAdmin ? `
                <div style="position:absolute; top: 0; left: 50%; transform: translateX(-50%); z-index:10;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #ef4444; background: #fee2e2; padding: 10px 20px; border-radius: 20px;">
                        Chế độ Admin
                    </div>
                </div>
                ` : ''}
                
                <div style="display:flex; justify-content:center; align-items:center; position:relative; width:100%; height: 100%;">
                    <style>
                        @keyframes wipeDown { 
                            0% { clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); opacity: 0; transform: translate(-50%, -60%); }
                            100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; transform: translate(-50%, -50%); }
                        }
                    </style>
                    <button class="btn-primary" onclick="app.shop.nextTrainCar(-1)" style="position:absolute; left:0; z-index:10; border-radius:50%; width:70px; height:70px; font-size:2rem; display:flex; justify-content:center; align-items:center; padding:0; box-shadow:0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s;">◀</button>
                    
                    <!-- Vùng chứa tỉ lệ chuẩn khóa cứng máy biến hình và pet -->
                    <div style="position:relative; width: 100%; max-width: 550px; margin: 0 auto; display: flex; justify-content: center; align-items: center;">
                        <div style="position:relative; width: 100%;">
                            <!-- Sci-Fi Machine Background -->
                            <img src="./public/scifi_machine.webp" style="width:100%; height:auto; display:block; z-index:2; pointer-events:none; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.6));">
                            
                            <!-- Pet Inside Window -->
                            <div style="position:absolute; width: 35%; height: 45%; top: 55%; left: 50%; transform: translate(-50%, -50%); z-index:3; display:flex; justify-content:center; align-items:center; animation: wipeDown 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;">
                                <img src="./public/${currentPet.image}" style="max-width:100%; max-height:100%; object-fit:contain; filter:drop-shadow(0 0px 15px rgba(56,189,248,0.9)); animation: heartbeat 2s infinite;">
                            </div>
                            
                            ${hasPet && !isAdmin ? `<div style="position:absolute; top:15%; right:20%; background:#22c55e; color:white; font-size:1.2rem; font-weight:bold; padding:8px 15px; border-radius:15px; z-index:4; box-shadow:0 4px 8px rgba(0,0,0,0.3); transform: rotate(15deg);">Đã sở hữu</div>` : ''}
                        </div>
                    </div>
                    
                    <button class="btn-primary" onclick="app.shop.nextTrainCar(1)" style="position:absolute; right:0; z-index:10; border-radius:50%; width:70px; height:70px; font-size:2rem; display:flex; justify-content:center; align-items:center; padding:0; box-shadow:0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s;">▶</button>
                </div>
            </div>

            <!-- Right Side: Details (40%) -->
            <div style="flex: 1; min-width: 0; display:flex; flex-direction:column; justify-content:center; padding: 20px;">
                <div style="background: rgba(255,255,255,0.85); padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 2px solid rgba(147, 51, 234, 0.3); backdrop-filter: blur(10px);">
                    <h2 class="pet-station-title" title="${currentPet.name}">${currentPet.name}</h2>
                    
                    <div style="font-size: 1rem; color: #1e293b; font-weight: bold; line-height: 1.6; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px dashed #cbd5e1;">
                        <strong style="color: #64748b; font-size: 1.1rem;">Mô tả:</strong><br/>
                        ${description}
                    </div>
                    
                    ${isAdmin ? `
                        <div style="display:flex; flex-direction:column; gap:15px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:1.2rem; font-weight:bold; color: #475569;">Còn tồn:</span>
                                <input type="number" id="admin_edit_${currentPet.id}" value="${remaining}" style="width:100px; text-align:center; padding:10px; font-size:1.2rem; border:2px solid #94a3b8; border-radius:10px;">
                            </div>
                            <button class="btn-primary" style="padding:12px 30px; font-size:1.2rem; border-radius: 15px;" onclick="app.shop.adminSavePet('${currentPet.id}')">Lưu Thay Đổi</button>
                        </div>
                    ` : `
                        <div style="display:flex; flex-direction:column; gap:8px; align-items:center; width: 100%; text-align:center;">
                            <div style="font-size: 1rem; color: #64748b; font-weight:bold; background: #f1f5f9; padding: 12px 15px; border-radius: 12px; border: 2px dashed #94a3b8;">
                                Chức năng đổi thú cưng sẽ sớm ra mắt!
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>`;
            box.innerHTML = html;
        },
        renderMyPets(box, user) {
            let isAdmin = (user.role === 'admin');
            let myPets = (app.data.userPets || []).filter(x => x.user_username === user.username);
            let equippedPet = app.getEquippedPet(user);

            let html = `
        <div style="height: 75vh; min-height: 500px; max-height: 800px; display:flex; flex-direction:column; justify-content:center;">
            

            <div style="display:flex; justify-content:space-around; align-items:center; gap: 15px; padding: 20px; flex-wrap: nowrap; overflow-x: auto;">
        `;

            if (isAdmin) {
                const previewPets = this.shopData.slice(0, 3);
                html += `<section class="admin-pet-preview" aria-label="Bộ sưu tập thú cưng minh hoạ">
                    <h3>Bộ sưu tập minh hoạ cho Giáo viên</h3>
                    <p>Giáo viên không trang bị thú cưng. Các mẫu dưới đây chỉ để kiểm tra giao diện.</p>
                    <div class="admin-pet-preview__grid">
                        ${previewPets.map(pet => `<article class="admin-pet-preview-card">
                            <img src="./public/${pet.image}" alt="${app.data.sanitizeHTML(pet.name)}">
                            <strong>${app.data.sanitizeHTML(pet.name)}</strong>
                            <span>Chỉ xem minh hoạ</span>
                        </article>`).join('')}
                    </div>
                </section>`;
            } else {
                for (let i = 0; i < 3; i++) {
                    const p = myPets[i];
                    if (p) {
                        const isEquipped = (equippedPet === p.pet_image);
                        const shopInfo = this.shopData.find(x => x.image === p.pet_image) || {};

                        html += `
                    <div style="flex: 0 0 280px; position:relative; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0;">
                        <!-- Khung tỉ lệ chuẩn cho Khoang và Pet -->
                        <div style="position:relative; width: 100%; filter: ${isEquipped ? 'drop-shadow(0 0 20px #10b981)' : 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'};">
                            <!-- Hình nền Khoang -->
                            <img src="./public/${isEquipped ? 'incubator_open.webp' : 'incubator_closed.webp'}" style="width:100%; height:auto; display:block; position:relative; z-index:1;">
                            
                            <!-- Thú cưng bên trong khoang -->
                            <div style="position:absolute; width:45%; height:45%; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2; display:flex; justify-content:center; align-items:center; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8)); opacity: ${isEquipped ? '1' : '0.7'}; transition: all 0.3s ease;">
                                <img src="./public/${p.pet_image}" style="max-width:100%; max-height:100%; object-fit:contain; ${isEquipped ? 'animation: heartbeat 2s infinite;' : 'filter: brightness(0.6);'}">
                            </div>
                            
                            <!-- Lớp đè thông tin và nút bấm -->
                            <div style="position:absolute; z-index:3; display:flex; flex-direction:column; justify-content:space-between; align-items:center; width:100%; height:100%; padding:25px 10px; top:0; left:0;">
                                <div style="font-weight:900; font-size:1.1rem; color:#fff; text-shadow: 0 0 10px #10b981; background: rgba(15, 23, 42, 0.8); padding: 5px 15px; border-radius: 15px; border: 1px solid #10b981; white-space:nowrap; text-align:center;">${p.pet_name}</div>
                                
                                <div style="display:flex; flex-direction:column; gap:10px; width: 100%; align-items:center;">
                                    <div style="display:flex; gap:10px; width: 100%; justify-content:center;">
                                        <button class="asset-button asset-button--pet" style="width:60%;" onclick="app.shop.equipPet('${p.pet_image}')" aria-label="${isEquipped ? 'Tắt khoang' : 'Kích hoạt'}">
                                            <img src="./public/ui/buttons/group2/${isEquipped ? 'deactivate-pet.png' : 'activate-pet.png'}" alt="" aria-hidden="true">
                                        </button>
                                    </div>
                                    ${(() => {
                                        if(!shopInfo.skills || shopInfo.skills.length === 0) return '';
                                        let cd = 0;
                                        if (app.game && app.game.skills) {
                                            cd = Math.max(...shopInfo.skills.map(s => app.game.skills.getCooldown(user.username, s.id)));
                                        }
                                        if (cd > 0) {
                                            return `<div style="font-size:0.8rem; font-weight:bold; color:#fca5a5; background:rgba(127,29,29,0.9); padding:5px 10px; border-radius:10px; box-shadow: 0 0 10px rgba(220,38,38,0.5); text-align:center;">Đang nạp<br>(${cd} lượt)</div>`;
                                        } else {
                                            return `<div style="font-size:0.8rem; font-weight:bold; color:#86efac; background:rgba(20,83,45,0.9); padding:5px 10px; border-radius:10px; box-shadow: 0 0 10px rgba(34,197,94,0.5);">Skill Sẵn sàng</div>`;
                                        }
                                    })()}
                                </div>
                            </div>
                            
                            ${isEquipped ? `<div style="position:absolute; top:-10px; right:-10px; font-size:2.5rem; z-index:4; text-shadow: 0 0 15px #10b981;" class="heartbeat">⭐</div>` : ''}
                        </div>
                    </div>
                    `;
                    } else {
                        html += `
                    <div style="flex: 0 0 280px; position:relative; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0;">
                        <div style="position:relative; width: 100%; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5)) grayscale(100%); opacity: 0.5;">
                            <img src="./public/incubator_closed.webp" style="width:100%; height:auto; display:block; position:relative; z-index:1;">
                            <div style="position:absolute; z-index:3; top:0; left:0; width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:#94a3b8; font-weight:bold; font-size:1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
                                Khoang Trống
                            </div>
                        </div>
                    </div>
                    `;
                    }
                }
            }

            html += `
            </div>
        </div>`;

            box.innerHTML = html;
        },
        equipPet(petImage) {
            const user = app.data.currentUser;
            if (!user) return;
            let currentlyEquipped = localStorage.getItem('equipped_pet_' + user.username);
            if (currentlyEquipped === petImage) {
                localStorage.removeItem('equipped_pet_' + user.username); // Unequip
            } else {
                localStorage.setItem('equipped_pet_' + user.username, petImage);
            }
            this.switchTab('mypets');
        },
        async adminSavePet(petId) {
            const val = Number.parseInt(document.getElementById('admin_edit_' + petId).value, 10);
            if (!Number.isInteger(val) || val < 0) {
                return alert('Số lượng tồn kho phải là số nguyên từ 0 trở lên.');
            }
            const saved = await app.data.setPetStock(petId, val);
            if (!saved) return alert('Không thể lưu số lượng tồn kho. Vui lòng thử lại.');
            alert('Đã cập nhật số lượng tồn kho dùng chung!');
            this.switchTab('pets');
        }

    },

};

// D1: phơi bày app ra toàn cục để các module (src/modules/*.js) gắn sub-module vào.
window.app = app;
// The team-competition adapter is loaded immediately after this file. Keep the
// already-created client injectable without exposing another copy of the key or
// creating a second Supabase connection.
app.data.supabaseClient = supabaseClient;

window.onload = async () => {
    try {
        await app.data.init();
    } catch (e) {
        console.error("Error during app init:", e);
    }
    try {
        app.auth.init();
        app.game.init();
    } catch (e) {
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

