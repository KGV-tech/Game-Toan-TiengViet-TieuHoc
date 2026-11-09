const { test, expect } = require('@playwright/test');

const samples = [
    ['math', 'g5-math-hk1-b19', 1280, 720],
    ['vietnamese', 'g5-vietnamese-hk2-b23', 1024, 768]
];

for (const [subject, lesson, width, height] of samples) {
    test(`lớp 5 có thể làm và chấm đủ câu theo bài ${lesson}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height });
        const errors = [];
        const alerts = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('dialog', async dialog => {
            alerts.push(dialog.message());
            await dialog.dismiss();
        });
        await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
        await page.route('https://*.supabase.co/**', route => route.abort());
        await page.goto('/');
        await page.evaluate(async ({ subject, lesson }) => {
            if (!await window.waitForGameAssets()) throw new Error('Thiếu tài nguyên luyện tập.');
            app.data.currentUser = { username: 'demo-g5', fullname: 'Học sinh minh hoạ', classlevel: '5', role: 'student', history: [] };
            app.data.settings = { lessonReleaseByClass: { '5': { [subject]: lesson } }, practicePass: { [subject]: { enabled: false } } };
            app.data.libraryQuestions = [];
            app.data.questionTemplates = [];
            app.daily.spendEnergy = async () => true;
            app.game.openConfig(subject);
            app.game.selectLearningEntry(lesson);
        }, { subject, lesson });

        const questionBox = page.locator('#game-question-container');
        await expect(questionBox).toBeVisible();
        const round = await page.evaluate(() => app.game.state.questions.map(({ lesson, q }) => ({ lesson, q })));
        expect(round).toHaveLength(10);
        expect(round.every(question => question.lesson === lesson)).toBe(true);
        expect(new Set(round.map(question => question.q)).size).toBe(10);
        const sample = await page.evaluate(subject => {
            const questions = app.game.state.questions;
            let question = questions[0];
            if (subject === 'vietnamese') {
                const index = questions.findIndex(item => item.options.some(option => option !== item.ans && option.toLocaleLowerCase('vi-VN') === item.ans.toLocaleLowerCase('vi-VN')));
                if (index < 0) throw new Error('Thiếu câu kiểm tra viết hoa.');
                app.game.state.currentIdx = index;
                app.game.loadQuestion();
                question = questions[index];
                const wrong = question.options.find(option => option !== question.ans);
                if (app.game.calculateQuestionScore(question, wrong).isCorrect) throw new Error('Phải phân biệt chữ hoa và chữ thường.');
            }
            const result = app.game.calculateQuestionScore(question, question.ans);
            return { answer: app.data.formatMathText(question.ans), result };
        }, subject);
        expect(sample.result).toEqual({ answerCount: 1, correctCount: 1, points: 1, isCorrect: true });
        if (subject === 'math') expect(sample.answer).toMatch(/\d,\d/);
        const answer = page.locator('#game-options-container .ans-btn').filter({
            has: page.getByText(sample.answer, { exact: true })
        });
        await answer.click();
        await page.locator('#submit-ans-btn').click();
        await expect(answer).toHaveClass(/correct/);
        expect(await page.evaluate(() => app.game.state.score)).toBe(1);
        expect(alerts).toEqual([]);
        expect(errors).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath(`${subject}-grade5.png`) });
    });
}
