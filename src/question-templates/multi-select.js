;(function (root, factory) {
    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MultiSelectTemplates = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    const TYPE = 'Chọn nhiều Đúng/Sai';
    const templateIds = ['selection.math', 'selection.vietnamese'];
    const weights = [1, 2, 3, 16, 20, 16, 3, 2, 1];
    const integer = (min, max, random) => min + Math.floor(random() * (max - min + 1));
    const shuffle = (values, random) => {
        const result = [...values];
        for (let i = result.length - 1; i > 0; i--) {
            const j = integer(0, i, random); [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };
    const number = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const normalized = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().normalize('NFC').toLocaleLowerCase('vi-VN');
    const previousPromptIsCommon = (prompt, common) => normalized(String(prompt || '').split(/<br\s*\/?\s*>/i)[0]) === normalized(common);
    function normalizePrompts(question) {
        const parts = question?.subquestions;
        if (!Array.isArray(parts) || parts.length < 2 || question.sharedPrompt === true) return question;
        const firstLines = parts.map(part => String(part.prompt || '').split(/<br\s*\/?\s*>/i));
        const common = firstLines[0][0].trim();
        if (typeof question.sharedPrompt === 'string' && previousPromptIsCommon(question.q, common)) return question;
        if (!common || !firstLines.every(lines => normalized(lines[0]) === normalized(common))) return question;
        // Remaining lines may contain distinct data or a diagram and must survive.
        const previous = String(question.q || '');
        const hasContext = !question.quickPractice && /<svg\b|<img\b|\d+|Dãy số:/i.test(previous) && normalized(previous) !== normalized(common);
        question.q = hasContext ? `${common}<br>${previous}` : common;
        question.sharedPrompt = hasContext ? common : true;
        if (question.templateVariables) question.templateVariables.question = question.q;
        return question;
    }
    function correctCount(maximum, minimum, random) {
        const available = weights.map((weight, i) => ({count: i + 1, weight})).filter(item => item.count >= minimum && item.count <= maximum);
        let value = random() * available.reduce((sum, item) => sum + item.weight, 0);
        for (const item of available) { value -= item.weight; if (value < 0) return item.count; }
        return available[available.length - 1].count;
    }
    function mathPool(lesson, random) {
        const n = Number(lesson.match(/b(\d+)$/)?.[1]);
        const choices = [], add = (text, correct, visual = '') => choices.push({text, correct, visual});
        let prompt = 'Trong các phép tính dưới đây, hãy chọn tất cả phép tính đúng.';
        if ([1,14,16,33].includes(n)) {
            prompt = 'Hãy chọn tất cả phép so sánh đúng.';
            for (let i = 1; i <= 24; i++) {
                const a = integer(10, n === 1 ? 99999 : 999999, random), b = a + integer(1, 999, random);
                add(`${number(a)} < ${number(b)}`, true); add(`${number(a)} > ${number(b)}`, false);
            }
        } else if ([3,6,15,67].includes(n)) {
            const even = random() < .5;
            prompt = `Trong các số dưới đây, hãy chọn tất cả số ${even ? 'chẵn' : 'lẻ'}.`;
            const start = integer(1, 350, random);
            for (let i = 0; i < 50; i++) { const value = start + i * 7; add(number(value), (value % 2 === 0) === even); }
        } else if ([10,11,12].includes(n)) {
            const sixDigit = n === 10;
            const boundary = integer(10, 70, random) * (n === 1 ? 1000 : 10000);
            prompt = sixDigit ? 'Trong các số dưới đây, hãy chọn tất cả số có sáu chữ số.' : `Trong các số dưới đây, hãy chọn tất cả số lớn hơn ${number(boundary)}.`;
            for (let i = 0; i < 50; i++) {
                const value = sixDigit ? (i % 2 === 0 ? integer(100000, 999950, random) + i : integer(1000, 99900, random) + i) : boundary + (i - 25) * 137;
                add(number(value), sixDigit ? value >= 100000 && value < 1000000 : value > boundary);
            }
        } else if ([7,8,9,35].includes(n)) {
            const acute = random() < .5;
            prompt = n === 7 ? 'Hãy chọn tất cả số đo góc nhỏ hơn 90°.' : `Hãy chọn tất cả số đo của góc ${acute ? 'nhọn' : 'tù'}.`;
            for (let degree = 5; degree <= 180; degree += 5) add(`${degree}°`, n === 7 || acute ? degree < 90 : degree > 90 && degree < 180);
        } else if (n === 13) {
            const target = integer(2, 8, random) * 100000;
            prompt = `Hãy chọn tất cả số làm tròn đến hàng trăm nghìn được ${number(target)}.`;
            for (let i = -25; i <= 25; i++) { const value = target + i * 5100; add(number(value), Math.round(value / 100000) * 100000 === target); }
        } else if ([17,18,19,20,21,36].includes(n)) {
            const units = n === 17 ? [['tấn','kg',1000],['tạ','kg',100],['yến','kg',10]] : n === 18 ? [['m²','dm²',100],['dm²','mm²',10000]] : n === 19 ? [['phút','giây',60],['giờ','phút',60],['thế kỉ','năm',100]] : [['tấn','kg',1000],['m²','dm²',100],['phút','giây',60]];
            prompt = 'Hãy chọn tất cả phép đổi đơn vị đúng.';
            const [from, to, factor] = units[integer(0, units.length - 1, random)];
            for (let i = 1; i <= 24; i++) { add(`${i} ${from} = ${number(i * factor)} ${to}`, true); add(`${i} ${from} = ${number(i * factor + factor)} ${to}`, false); }
        } else if (n === 31) {
            prompt = 'Quan sát các hình và chọn tất cả hình bình hành.';
            for (let i = 0; i < 40; i++) {
                const correct = i % 2 === 0, shift = 8 + (i % 8) * 3;
                const points = correct ? `${15+shift},15 105,15 ${105-shift},70 15,70` : `${15+shift},15 105,15 105,70 15,70`;
                add(`Hình ${i+1}`, correct, `<svg viewBox="0 0 120 88" role="img" aria-label="Hình ${i+1}"><polygon points="${points}" fill="#d3e9fa" stroke="#153b62" stroke-width="3"/></svg>`);
            }
        } else if ([27,28,29,30,32,71].includes(n)) {
            const parallel = [29,30,31,32].includes(n);
            prompt = `Quan sát các hình và chọn tất cả cặp đường thẳng ${parallel ? 'song song' : 'vuông góc'}.`;
            for (let i = 0; i < 40; i++) {
                const correct = i % 2 === 0, slope = (i % 5) * 4;
                const second = correct === parallel ? `<line x1="15" y1="${58-slope}" x2="105" y2="${58+slope}"/>` : `<line x1="${60 + (correct !== parallel ? 7*slope/9 : 12)}" y1="8" x2="${60 - (correct !== parallel ? 7*slope/9 : 12)}" y2="78"/>`;
                add(`Hình ${i+1}`, correct, `<svg viewBox="0 0 120 88" role="img" aria-label="Hình ${i+1}"><g stroke="#153b62" stroke-width="3"><line x1="15" y1="${30-slope}" x2="105" y2="${30+slope}"/>${second}</g></svg>`);
            }
        } else if ([49,50,51,52,72].includes(n)) {
            const values = Array.from({length: 30}, () => integer(1, 10, random));
            prompt = `Dãy số liệu: ${values.join(', ')}. Hãy chọn tất cả nhận xét đúng về số lần xuất hiện.`;
            for (let value = 1; value <= 10; value++) {
                const count = values.filter(item => item === value).length;
                add(`Số ${value} xuất hiện ${count} lần`, true); add(`Số ${value} xuất hiện ${count+1} lần`, false);
            }
        } else if (n >= 53 && n <= 66 && n !== 65 || [69,70].includes(n)) {
            if ([53,54].includes(n)) {
                prompt = 'Hãy chọn tất cả phân số có tử số nhỏ hơn mẫu số.';
                for (let i = 1; i <= 24; i++) {const d=integer(2,30,random)+i; add(`${d-1}/${d}`,true); add(`${d+1}/${d}`,false);}
            } else if ([60,61,62,63,64,65,66,70].includes(n)) {
                const operation = n === 61 ? '−' : n === 63 ? '×' : n === 64 ? ':' : '+';
                prompt = 'Hãy chọn tất cả phép tính phân số đúng.';
                for (let i = 1; i <= 24; i++) {
                    const a = integer(2, 12, random)+i, b = integer(1, a, random), d = integer(2, 9, random);
                    const numerator = operation === '−' ? a-b : operation === '×' ? a*b : operation === ':' ? a : a+b;
                    const denominator = operation === '×' ? d*d : operation === ':' ? b : d;
                    const expression = `${a}/${d} ${operation} ${b}/${d} = `;
                    add(`${expression}${numerator}/${denominator}`, true); add(`${expression}${numerator+1}/${denominator}`, false);
                }
            } else {
                const numerator = integer(1, 5, random), denominator = numerator + integer(1, 5, random);
                prompt = `Hãy chọn tất cả phân số bằng ${numerator}/${denominator}.`;
                for (let i = 1; i <= 24; i++) { add(`${numerator*i}/${denominator*i}`, true); add(`${numerator*i+1}/${denominator*i}`, false); }
            }
        } else if ([25,46,65].includes(n)) {
            prompt = n === 25 ? 'Hãy chọn tất cả nhận xét đúng về hai số biết tổng và hiệu.' : n === 46 ? 'Hãy chọn tất cả phép tính trung bình cộng đúng.' : 'Hãy chọn tất cả phép tính phân số của một số đúng.';
            for (let i = 1; i <= 24; i++) {
                const a=integer(12,100,random)+i, b=integer(2,10,random);
                const prefix=n===25 ? `Tổng ${a+b}, hiệu ${a-b}: số lớn là ` : n===46 ? `Trung bình cộng của ${2*a-b} và ${2*a+b} là ` : `1/${b} của ${a*b} là `;
                const result=n===46 ? 2*a : a;
                add(`${prefix}${result}`,true);add(`${prefix}${result+1}`,false);
            }
        } else {
            const operation = n === 23 ? '−' : [39,44,47].includes(n) || n === 41 && random() < .5 ? ':' : n >= 38 && n <= 48 ? '×' : '+';
            for (let i = 1; i <= 24; i++) {
                const a = integer(20, n < 7 ? 500 : 20000, random)+i;
                const b = n === 41 ? [10,100,1000][integer(0,2,random)] : [43,44].includes(n) ? integer(10,99,random) : integer(2,9,random);
                const left = operation === ':' ? a*b : a;
                const result = operation === '−' ? a-b : operation === '×' ? a*b : operation === ':' ? a : a+b;
                const expression = n === 4 ? `Với a = ${a}, a + ${b} = ` : n === 5 ? `(${a} + ${b}) × 2 − ${b} = ` : `${number(left)} ${operation} ${b} = `;
                const expected = n === 5 ? (a+b)*2-b : result;
                add(`${expression}${number(expected)}`, true); add(`${expression}${number(expected+1)}`, false);
            }
        }
        return {prompt, choices};
    }
    function vietnamesePrompt(target, incorrect = false) {
        const group = target === 'person' || target === 'object';
        const label = group ? `danh từ ${target === 'person' ? 'chỉ người' : 'chỉ vật'}` : target.toLocaleLowerCase('vi-VN');
        return `Trong các từ dưới đây, hãy chọn tất cả ${incorrect ? `từ KHÔNG phải là ${label}` : label}.`;
    }
    function vietnamesePool(lesson, random, config) {
        const corpus = root.VietnameseParameterCorpus;
        if (corpus?.reviewStatus !== 'reviewed') throw new Error('Thiếu nguồn từ đã kiểm chứng.');
        const maximumLesson = lesson.includes('-hk2-') ? 32 : Number(lesson.match(/b(\d+)$/)?.[1]);
        const atoms = corpus.atoms.filter(atom => atom.kind === 'lexeme').map(atom => corpus.resolve(atom.id)).filter(atom => atom.lesson <= maximumLesson);
        const categories = maximumLesson < 9 ? ['person','object'] : ['Danh từ','Động từ', ...(maximumLesson >= 21 ? ['Tính từ'] : [])];
        const requested = {noun:'Danh từ',verb:'Động từ',adjective:'Tính từ',person:'person',object:'object'}[config.wordGroup];
        if (config.wordGroup && config.wordGroup !== 'mixed' && !requested) throw new Error('Nhóm từ không hợp lệ.');
        if (requested && ![...categories,'person','object'].includes(requested)) throw new Error('Nhóm từ này chưa thuộc kiến thức đã học của bài đã chọn.');
        const frequentGroups = categories.filter(category => atoms.filter(atom => ['person','object'].includes(category) ? atom.category === category : atom.pos === category).length >= 6);
        const target = requested || frequentGroups[integer(0, frequentGroups.length - 1, random)];
        const group = target === 'person' || target === 'object';
        return {
            criterion: {kind:'word-group',target},
            prompt: vietnamesePrompt(target),
            choices: atoms.map(atom => ({text: atom.word, correct: group ? atom.category === target : atom.pos === target, sourceId: atom.id, evidence: {recordId: atom.sourceRecord, excerpt: atom.context, pages: atom.pages}}))
        };
    }
    function generateQuestion(templateId, config = {}, random = Math.random) {
        if (!templateIds.includes(templateId)) throw new Error('Template chọn nhiều không hợp lệ.');
        const subject = templateId.endsWith('math') ? 'math' : 'vietnamese';
        const lesson = config.lesson || (subject === 'math' ? 'g4-math-hk1-b03' : 'g4-vietnamese-hk1-b21');
        if (!new RegExp(`^g4-${subject}-hk[12]-b\\d{2}$`).test(lesson)) throw new Error('Hãy chọn bài học phù hợp.');
        const lessonNumber = Number(lesson.match(/b(\d+)$/)[1]);
        if (lessonNumber < 1 || lessonNumber > (subject === 'math' ? 73 : 32) || subject === 'math' && lesson.includes('-hk1-') !== (lessonNumber <= 37)) throw new Error('Bài học không thuộc chương trình hỗ trợ.');
        const pool = subject === 'math' ? mathPool(lesson, random) : vietnamesePool(lesson, random, config);
        const mode = config.selectionTarget || 'correct';
        if (!['correct','incorrect'].includes(mode)) throw new Error('Mỗi template chỉ chọn một chế độ: Đúng hoặc Sai.');
        const selectIncorrect = mode === 'incorrect';
        if (selectIncorrect) {
            pool.choices = pool.choices.map(item => ({...item, correct: !item.correct}));
            pool.prompt = subject === 'vietnamese' ? vietnamesePrompt(pool.criterion.target, true) : /đúng/.test(pool.prompt) ? pool.prompt.replace(/đúng/g, 'sai') : `${pool.prompt.replace(/hãy chọn tất cả/i, 'xét nhóm').replace(/[.]$/, '')}. Hãy chọn các ô KHÔNG thuộc nhóm này.`;
        }
        const unique = [...new Map(pool.choices.map(item => [item.text, item])).values()];
        const correct = unique.filter(item => item.correct), wrong = unique.filter(item => !item.correct);
        const minimum = Math.max(1, 10 - wrong.length), maximum = Math.min(9, correct.length);
        if (maximum < minimum) throw new Error('Nguồn chưa đủ 10 ô với cả đáp án đúng và sai.');
        const count = correctCount(maximum, minimum, random);
        const selectionItems = shuffle([...shuffle(correct, random).slice(0, count), ...shuffle(wrong, random).slice(0, 10-count)], random).map((item, index) => ({...item, id: `s${index}`}));
        const correctIds = selectionItems.filter(item => item.correct).map(item => item.id).sort();
        const groups = root.app?.constants?.lessonCatalog?.['4']?.[subject]?.[lesson.includes('-hk2-') ? 'hk2' : 'hk1'] || [];
        const topic = groups.find(group => group.lessons.some(item => item.id === lesson))?.topic || '1. Ôn tập và bổ sung';
        return {classlevel:'Lớp 4', subject:subject === 'math' ? 'Toán' : 'Tiếng Việt', semester: lesson.includes('-hk2-') ? 'Học kỳ 2' : 'Học kỳ 1', topic, lesson, templateId, type:TYPE, selectionCriterion:pool.criterion || null, selectionTarget:selectIncorrect ? 'incorrect' : 'correct', q:pool.prompt, selectionItems, correctIds, options: selectionItems.map(item => item.text), ans: correctIds.join(';'), partAnswerCounts:[1], explanation:`Các ô cần chọn: ${selectionItems.filter(item => item.correct).map(item => item.text).join(' · ')}.`, templateVariables:{question:pool.prompt}};
    }
    const decode = value => Array.isArray(value) ? value : String(value || '').split(';').filter(Boolean);
    const serialize = values => [...values].sort().join(';');
    function validate(question) {
        const items = question?.selectionItems, ids = question?.correctIds;
        if (question?.type !== TYPE || !Array.isArray(items) || items.length !== 10 || !Array.isArray(ids) || ids.length < 1 || ids.length > 9) return 'Chọn nhiều cần 10 ô và từ 1–9 đáp án đúng.';
        if (new Set(items.map(item => item.id)).size !== 10 || new Set(items.map(item => normalized(item.text))).size !== 10 || items.some(item => !/^s\d$/.test(item.id) || !String(item.text || '').trim()) || new Set(ids).size !== ids.length || ids.some(id => !items.some(item => item.id === id)) || question.ans !== serialize(ids)) return 'Ô lựa chọn hoặc đáp án chọn nhiều không hợp lệ.';
        if (question.subject === 'Tiếng Việt') {
            try {
                const criterion = question.selectionCriterion;
                if (criterion?.kind !== 'word-group' || !['person','object','Danh từ','Động từ','Tính từ'].includes(criterion.target)) return 'Thiếu nhóm từ đã kiểm chứng.';
                if (!['correct','incorrect'].includes(question.selectionTarget) || normalized(question.q) !== normalized(vietnamesePrompt(criterion.target, question.selectionTarget === 'incorrect'))) return 'Câu dẫn không khớp nhóm từ và chế độ chọn.';
                const lesson = question.lesson?.includes('-hk2-') ? 32 : Number(question.lesson?.match(/b(\d+)$/)?.[1]);
                for (const item of items) {
                    const atom = root.VietnameseParameterCorpus.resolve(item.sourceId);
                    const matches = ['person','object'].includes(criterion.target) ? atom.category === criterion.target : atom.pos === criterion.target;
                    const expected = question.selectionTarget === 'incorrect' ? !matches : matches;
                    if (atom.lesson > lesson || atom.word !== item.text || item.evidence?.recordId !== atom.sourceRecord || item.evidence?.excerpt !== atom.context || JSON.stringify(item.evidence?.pages) !== JSON.stringify(atom.pages) || ids.includes(item.id) !== expected) return 'Từ hoặc đáp án không khớp nguồn đã kiểm chứng.';
                }
            } catch { return 'Nguồn từ chưa được kiểm chứng.'; }
        }
        return '';
    }
    function score(question, selected) {
        const chosen = decode(selected);
        const isCorrect = !validate(question) && chosen.length === question.correctIds.length && new Set(chosen).size === chosen.length && chosen.every(id => question.correctIds.includes(id));
        return {answerCount:1, correctCount:isCorrect ? 1 : 0, points:isCorrect ? 1 : 0, isCorrect};
    }
    const labelAnswers = (question, value) => decode(value).map(id => question.selectionItems.find(item => item.id === id)?.text || '').filter(Boolean).join(' · ');
    function render(question, container, state, checkButton) {
        container.className = 'selection-board';
        const selected = new Set(); state.selectedAns = '';
        const instruction = document.createElement('p'); instruction.className = 'selection-help'; instruction.textContent = 'Bấm chọn các ô theo yêu cầu của câu hỏi. Bấm lại để bỏ chọn.'; container.append(instruction);
        const grid = document.createElement('div'); grid.className = 'selection-grid'; container.append(grid);
        for (const item of question.selectionItems) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'selection-tile'; button.dataset.selectionId = item.id; button.setAttribute('aria-pressed','false');
            if (item.visual) { const visual = document.createElement('span'); visual.innerHTML = root.app.data.formatMathHTML(item.visual); button.append(visual); }
            const label = document.createElement('span'); label.textContent = item.text; button.append(label);
            button.onclick = () => { if (state.answerSubmitted) return; if (selected.has(item.id)) selected.delete(item.id); else selected.add(item.id); button.setAttribute('aria-pressed', String(selected.has(item.id))); state.selectedAns = serialize(selected); checkButton.disabled = selected.size === 0; };
            grid.append(button);
        }
    }
    function reveal(question, container) {
        container.querySelectorAll('[data-selection-id]').forEach(button => { button.disabled = true; const correct = question.correctIds.includes(button.dataset.selectionId); button.classList.add(correct ? 'selection-tile--correct' : 'selection-tile--wrong'); const mark = document.createElement('small'); mark.textContent = correct ? '✓ Cần chọn' : 'Không chọn'; button.append(mark); });
    }
    function examMarkup(question, index) {
        const esc = value => root.app.data.sanitizeHTML(value);
        return `<div class="selection-grid">${question.selectionItems.map(item => `<label class="selection-tile selection-tile--exam"><input type="checkbox" name="exam_selection_${index}" value="${item.id}">${item.visual ? root.app.data.formatMathHTML(item.visual) : ''}<span>${esc(item.text)}</span></label>`).join('')}</div>`;
    }
    function generateRound(templates, count, random = Math.random) {
        if (!templates.length) return [];
        let seed = Math.floor(random() * 4294967296) >>> 0;
        const roundRandom = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
        const questions = [], seen = new Set(), orderedTemplates = shuffle(templates, roundRandom);
        for (let attempt=0; questions.length<count && attempt<count*30; attempt++) {
            const template=orderedTemplates[attempt % orderedTemplates.length];
            const q=generateQuestion(template.generator_key,template.config,roundRandom);
            const key=JSON.stringify([q.q,q.selectionItems.map(item=>item.text).sort()]);
            if (!seen.has(key)) {seen.add(key); questions.push(q);}
        }
        return questions;
    }
    function getDefaultTemplates() {
        return ['math','vietnamese'].flatMap(subject => {
            const semesters = root.app?.constants?.lessonCatalog?.['4']?.[subject] || {};
            return Object.entries(semesters).flatMap(([semester, groups]) => groups.flatMap(group =>
                group.lessons.flatMap(lesson => ['correct','incorrect'].map(selectionTarget => ({
                    id: `built-in-selection-${lesson.id}${selectionTarget === 'incorrect' ? '-incorrect' : ''}`,
                    name: `${lesson.label} · ${TYPE} · Chọn ${selectionTarget === 'correct' ? 'Đúng' : 'Sai'}`,
                    classlevel: 'Lớp 4', subject: subject === 'math' ? 'Toán' : 'Tiếng Việt',
                    semester: semester === 'hk1' ? 'Học kỳ 1' : 'Học kỳ 2', topic: group.topic, lesson: lesson.id,
                    question_type: TYPE, generator_key: `selection.${subject}`, prompt_template: '{question}',
                    config: {lesson: lesson.id, selectionTarget}, is_active: true
                })))
            ));
        });
    }
    return Object.freeze({TYPE,templateIds,generateQuestion,getDefaultTemplates,generateRound,normalizePrompts,validate,score,serialize,decode,labelAnswers,render,reveal,examMarkup});
});
