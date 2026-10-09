;(function (root) {
    const normalize = value => String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
    function score(question, selected) {
        const parts = question.subquestions || [];
        if (parts.length !== 2) throw new Error('Luyện tập Tiếng Việt cần đúng hai câu con.');
        // Stored choices are an array: commas and pipes in prose are never delimiters.
        const answers = Array.isArray(selected) ? selected : [];
        const partScores = parts.map((p, i) => normalize(answers[i]) === normalize(p.answer) ? 0.5 : 0);
        const correctCount = partScores.filter(points => points > 0).length;
        return { answerCount: 2, correctCount, points: correctCount * 0.5, isCorrect: correctCount === 2, partScores };
    }
    function render(question, container, state, checkButton) {
        container.className = 'multi-choice-subquestions vietnamese-practice';
        state.multipleChoiceSelections = ['', ''];
        const node = (tag, className, text) => {
            const el = document.createElement(tag);
            el.className = className;
            if (text !== undefined) el.textContent = text;
            return el;
        };
        if (question.passage) {
            const passage = node('aside', 'vietnamese-passage', question.passage);
            passage.setAttribute('aria-label', 'Đoạn đọc luyện tập');
            container.append(passage);
        }
        question.subquestions.forEach((part, index) => {
            const row = node('section', `multi-choice-subquestion vietnamese-part multi-choice-subquestion--tone-${index}`);
            row.dataset.index = index;
            const heading = node('h3', '', `${part.label}) ${root.app.game.getSubquestionPrompt(question, part)}`);
            heading.id = `vietnamese-part-${index}`;
            row.setAttribute('aria-labelledby', heading.id);
            const choices = node('div', 'multi-choice-subquestion__options');
            const feedback = node('p', 'vietnamese-feedback');
            feedback.setAttribute('role', 'status');
            row.append(heading, choices, feedback);
            const choose = choiceId => {
                if (state.answerSubmitted) return;
                // Resolve only this row's known IDs.
                const optionIndex = part.options.findIndex((_, i) => `${index}:${i}` === choiceId);
                if (optionIndex < 0) return;
                state.multipleChoiceSelections[index] = part.options[optionIndex];
                state.selectedAns = [...state.multipleChoiceSelections];
                choices.querySelectorAll('button').forEach(button => {
                    const active = button.dataset.choiceId === choiceId;
                    button.classList.toggle('selected', active);
                    button.setAttribute('aria-pressed', String(active));
                });
                checkButton.disabled = state.multipleChoiceSelections.some(value => !value);
            };
            const matching = question.type === 'Đối chiếu trùng khớp';
            if (matching) {
                const source = node('button', 'vietnamese-match-source', 'Chọn vế này để ghép');
                source.type = 'button';
                source.setAttribute('aria-pressed', 'false');
                source.onclick = () => {
                    if (state.answerSubmitted) return;
                    source.setAttribute('aria-pressed', 'true');
                    choices.querySelectorAll('button').forEach(b => { b.disabled = false; });
                };
                row.insertBefore(source, choices);
            }
            part.options.forEach((option, i) => {
                const button = node('button', 'multi-choice-subquestion__option', option);
                button.type = 'button';
                button.dataset.choiceId = `${index}:${i}`;
                button.setAttribute('aria-pressed', 'false');
                button.disabled = matching;
                button.onclick = () => choose(button.dataset.choiceId);
                choices.append(button);
            });
            container.append(row);
        });
    }
    function reveal(question, container, selected) {
        container.querySelectorAll('.vietnamese-part').forEach((row, i) => {
            const part = question.subquestions[i];
            const correct = normalize(selected?.[i]) === normalize(part.answer);
            row.classList.add(correct ? 'vietnamese-part--correct' : 'vietnamese-part--wrong');
            row.querySelector('.vietnamese-feedback').textContent = correct
                ? 'Đúng · 0,5 điểm' : `Chưa đúng · 0 điểm. Đáp án: ${part.answer}`;
            row.querySelectorAll('.multi-choice-subquestion__option').forEach(button => {
                const option = part.options[Number(button.dataset.choiceId.split(':')[1])];
                button.classList.toggle('correct', option === part.answer);
                button.classList.toggle('wrong', option !== part.answer && normalize(option) === normalize(selected?.[i]));
            });
            if (!correct) {
                const feedback = row.querySelector('.vietnamese-feedback');
                feedback.textContent = 'Chưa đúng · 0 điểm. Đáp án: ';
                const correction = document.createElement('span');
                correction.className = 'answer-correction';
                correction.setAttribute('aria-label', `Đáp án đúng: ${part.answer}`);
                correction.textContent = part.answer;
                feedback.append(correction);
            }
            row.querySelectorAll('button, select').forEach(el => { el.disabled = true; el.draggable = false; });
        });
    }
    function appendCatalog(host) {
        const templates = root.Grade4VietnameseTemplates.getDefaultTemplates();
        const section = document.createElement('section');
        section.className = 'vietnamese-catalog';
        section.setAttribute('aria-label', 'Template Tiếng Việt đã kiểm chứng');
        section.innerHTML = '<h3>Luyện nhanh Tiếng Việt · Học kì I</h3><p>2 câu con × 0,5 điểm. Nội dung chỉ đọc; sửa từ ngữ cần kiểm chứng lại nguồn và ngữ cảnh.</p><label>Bài đang học <select class="form-input" aria-label="Bài Tiếng Việt"></select></label><label>Kỹ năng <select class="form-input" aria-label="Kỹ năng Tiếng Việt"></select></label><button type="button" class="btn-primary">Sinh mẫu khác</button><div class="vietnamese-catalog-preview"></div><p class="vietnamese-catalog-evidence"></p>';
        const [lessonSelect, skillSelect] = section.querySelectorAll('select');
        const lessonIds = [...new Set(templates.map(t => t.lesson))];
        lessonIds.forEach(id => lessonSelect.add(new Option(root.app.admin.lessonLabel(id) || id, id)));
        const preview = () => {
            const template = templates.find(t => t.lesson === lessonSelect.value && t.generator_key === skillSelect.value);
            if (!template) return;
            let question;
            try { question = root.Grade4VietnameseTemplates.generateQuestion(template.generator_key, template.config); }
            catch (error) {
                section.querySelector('.vietnamese-catalog-preview').textContent = error.message;
                section.querySelector('.vietnamese-catalog-evidence').replaceChildren();
                return;
            }
            section.querySelector('.vietnamese-catalog-preview').innerHTML = root.app.admin.renderGeneratedTemplatePreview(question);
            const evidence = section.querySelector('.vietnamese-catalog-evidence');
            evidence.replaceChildren();
            question.subquestions.forEach(part => {
                const details = document.createElement('details');
                const summary = document.createElement('summary');
                summary.textContent = `${part.label}) ${part.id}: SGK tr. ${part.evidence.pages.join(', ')}; học từ bài ${part.introducedAt}`;
                const source = document.createElement('p');
                source.textContent = `${part.evidence.kind === 'reviewed-composition' ? 'Câu biên soạn từ khung đã đối chiếu SGK' : 'Ngữ cảnh nguồn'}: ${part.evidence.excerpt}`;
                details.append(summary, source);
                part.options.forEach(option => {
                    const reason = document.createElement('p');
                    reason.textContent = `${option}: ${part.evidence.optionReasons[option]}`;
                    details.append(reason);
                });
                evidence.append(details);
            });
        };
        lessonSelect.onchange = () => {
            skillSelect.replaceChildren();
            templates.filter(t => t.lesson === lessonSelect.value).forEach(t => skillSelect.add(new Option(t.name.replace(/^\[.*?\] /, ''), t.generator_key)));
            preview();
        };
        skillSelect.onchange = preview;
        section.querySelector('button').onclick = preview;
        host.append(section);
        lessonSelect.onchange();
    }
    root.VietnameseQuickPractice = Object.freeze({ score, render, reveal, appendCatalog });
})(typeof globalThis !== 'undefined' ? globalThis : this);
