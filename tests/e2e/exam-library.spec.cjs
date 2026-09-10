const { test, expect } = require('@playwright/test');

async function openLibrary(page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/*.supabase.co/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', role: 'admin' };
    app.data.exams = [
      { name: 'Ôn tập phân số', classlevel: 'Lớp 5', subject: 'Toán', period: 'Giữa kỳ 1', questions: Array.from({ length: 3 }, () => ({ topic: 'Phân số' })) },
      { name: 'Đọc hiểu mùa thu', classlevel: 'Lớp 4', subject: 'Tiếng Việt', period: 'Cuối kỳ 2', questions: Array.from({ length: 10 }, () => ({ topic: 'Đọc hiểu' })) },
      { name: 'Kho tổng hợp', classlevel: 'Lớp 5', subject: 'Toán', period: 'Cả năm', questions: Array.from({ length: 1000 }, () => ({})) }
    ];
    app.admin.openComposer();
    app.admin.renderComposerModule('exams');
  });
}

test('thống kê Soạn Đề chỉ tính đề đúng số câu và tách đề vượt giới hạn', async ({ page }) => {
  await openLibrary(page);
  const overview = page.locator('.admin-compose-card--exams');
  await expect(overview.locator('.admin-compose-card__metric').filter({ hasText: /^Đủ 10 câu/ }).locator('strong')).toHaveText('1');
  await expect(overview.locator('.admin-compose-card__metric').filter({ hasText: /^Vượt 10 câu/ }).locator('strong')).toHaveText('1');
  await expect(page.locator('.exam-library-stat--exact strong')).toHaveText('1');
  await expect(page.locator('.exam-library-stat--under strong')).toHaveText('1');
  await expect(page.locator('.exam-library-stat--over strong')).toHaveText('1');
});

test('kho đề dạng thẻ: thống kê thật, tìm lọc và hành động đúng đề', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openLibrary(page);
  await expect(page.locator('.exam-library-card')).toHaveCount(3);
  await expect(page.locator('#admin-e-subarea table')).toHaveCount(0);
  await expect(page.locator('.exam-library-stats')).toContainText('Vượt 10 câu');
  await expect(page.locator('.exam-library-card').last()).toContainText('1000');
  await page.getByLabel('Tìm trong thư viện đề').fill('DOC HIEU');
  await expect(page.locator('.exam-library-card')).toHaveCount(1);
  await expect(page.getByLabel('Tìm trong thư viện đề')).toBeFocused();
  await page.evaluate(() => { app.admin.editExam = index => { window.editedExam = index; }; });
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  expect(await page.evaluate(() => window.editedExam)).toBe(1);
  await page.getByLabel('Tìm trong thư viện đề').fill('không có đề này');
  await expect(page.locator('#exam-library-results')).toContainText('Không tìm thấy đề');
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await expect(page.locator('.exam-library-card')).toHaveCount(3);
  await page.getByLabel('Số câu trong đề').selectOption('over');
  await expect(page.locator('.exam-library-card')).toHaveCount(1);
  await page.evaluate(() => { app.data.saveExams = () => {}; });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Xóa đề' }).click();
  expect(await page.evaluate(() => app.data.exams.map(exam => exam.name))).toEqual(['Ôn tập phân số', 'Đọc hiểu mùa thu']);
  await expect(page.locator('.admin-compose-card--exams .admin-compose-card__count strong')).toHaveText('2');
  await expect(page.locator('.exam-library-stat--all strong')).toHaveText('2');
  await expect(page.locator('.exam-library-stat--over strong')).toHaveText('0');
  expect(errors).toEqual([]);
});

for (const [width, height] of [[1280, 720], [1440, 900], [1920, 1080], [1024, 768]]) {
  test(`kho đề rộng thoáng không tràn tại ${width}px`, async ({ page }) => {
    await openLibrary(page, width, height);
    const panel = page.locator('#admin-compose-module-panel');
    await panel.scrollIntoViewIfNeeded();
    await expect(page.locator('.exam-library-card')).toHaveCount(3);
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.locator('.exam-workspace__header').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.screenshot({ path: `test-results/ui-review/exam-library-${width}.png` });
    const cardActions = page.locator('.exam-library-card').first().locator('footer');
    await cardActions.scrollIntoViewIfNeeded();
    expect(await cardActions.locator('button').evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 44))).toBe(true);
    if (width === 1024) await page.screenshot({ path: 'test-results/ui-review/exam-library-1024-actions.png' });
    await page.getByText('Công cụ Excel', { exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#btn-e-imp')).toBeVisible();
    await page.locator('#btn-e-add').click();
    await expect(page.locator('.exam-composer')).toBeVisible();
  });
}

test('kho đề trống và tên đề chứa HTML được hiển thị an toàn', async ({ page }) => {
  await openLibrary(page);
  await page.evaluate(() => {
    app.data.exams = [{ name: '<img src=x onerror=alert(1)>', questions: [] }];
    app.admin.renderESubTab('lib');
  });
  await expect(page.locator('.exam-library-card h4')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.exam-library-card img')).toHaveCount(0);
  await page.evaluate(() => { app.data.exams = []; app.admin.renderESubTab('lib'); });
  await expect(page.locator('#exam-library-results')).toContainText('Thư viện đang chờ đề đầu tiên');
});


test('bộ lọc lớp, môn và phân trang giữ đúng tập đề', async ({ page }) => {
  await openLibrary(page);
  await page.getByRole('region', { name: 'Thư viện đề', exact: true }).getByRole('combobox', { name: 'Cấp lớp', exact: true }).selectOption('Lớp 4');
  await page.getByRole('region', { name: 'Thư viện đề', exact: true }).getByRole('combobox', { name: 'Môn học', exact: true }).selectOption('Tiếng Việt');
  await expect(page.locator('.exam-library-card h4')).toHaveText('Đọc hiểu mùa thu');
  await page.getByRole('region', { name: 'Thư viện đề', exact: true }).getByRole('combobox', { name: 'Môn học', exact: true }).selectOption('Toán');
  await expect(page.locator('#exam-library-results')).toContainText('Không tìm thấy đề');
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await expect(page.locator('.exam-library-card')).toHaveCount(3);
  await page.evaluate(() => {
    const original = app.data.exams[0];
    app.data.exams.push(...Array.from({ length: 14 }, (_, index) => ({ ...original, name: 'Phân số bổ sung ' + (index + 1) })));
    app.admin.renderESubTab('lib');
  });
  await page.getByLabel('Tìm trong thư viện đề').fill('PHAN SO');
  await expect(page.locator('.exam-library-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Xem thêm đề (3 còn lại)' }).click();
  await expect(page.locator('.exam-library-card')).toHaveCount(15);
  await expect(page.getByLabel('Tìm trong thư viện đề')).toHaveValue('PHAN SO');
  await expect(page.locator('#exam-library-result-count')).toHaveText('Hiển thị 15 / 15 đề · Kho có 17 đề');
  await page.getByLabel('Số câu trong đề').selectOption('exact');
  await expect(page.locator('#exam-library-results')).toContainText('Không tìm thấy đề');
});

test('xem và chỉnh sửa từ thẻ mở đúng đề, bỏ bản nháp cũ và lưu về thư viện', async ({ page }) => {
  await openLibrary(page);
  await page.evaluate(() => {
    app.data.exams[1].questions = Array.from({ length: 10 }, (_, index) => ({
      type: 'Điền khuyết', q: 'Điền bốn từ còn thiếu ' + (index + 1), ans: 'mùa, thu, lá, vàng',
      partAnswerCounts: [1, 1, 1, 1], options: [], topic: 'Đọc hiểu', explanation: ''
    }));
    app.data.saveExams = async () => {};
    app.data.saveLibrary = async () => {};
    app.data.libraryQuestions = [];
    app.admin.examComposerDraft = { name: 'Bản nháp khác', questions: [] };
  });
  await page.getByLabel('Tìm trong thư viện đề').fill('doc hieu');
  await page.getByRole('button', { name: 'Xem đề', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chi tiết đề: Đọc hiểu mùa thu' })).toBeVisible();
  await expect(page.locator('#print-area')).toContainText('Điền bốn từ còn thiếu 1');
  await page.getByRole('button', { name: 'Đóng chi tiết đề' }).click();
  await page.getByLabel('Tìm trong thư viện đề').fill('doc hieu');
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await expect(page.locator('#add-e-name')).toHaveValue('Đọc hiểu mùa thu');
  await expect(page.locator('.exam-question-card')).toHaveCount(10);
  await page.locator('#add-e-name').fill('Đọc hiểu mùa thu đã sửa');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Lưu chỉnh sửa' }).click();
  await expect(page.locator('.exam-library-card h4')).toHaveText(['Ôn tập phân số', 'Đọc hiểu mùa thu đã sửa', 'Kho tổng hợp']);
  await expect(page.locator('.admin-compose-card--exams .admin-compose-card__count strong')).toHaveText('3');
  await page.locator('#btn-e-add').click();
  await expect(page.locator('#add-e-name')).toHaveValue('');
});

test('xem đề hiển thị đủ câu con, dùng tên đề và in riêng nội dung A4', async ({ page }, testInfo) => {
  await openLibrary(page);
  await page.evaluate(() => {
    const parts = ['a', 'b', 'c', 'd'];
    app.data.exams = [{
      id: 'exam-print-grade-4', name: 'Toán lớp 4 · Ôn tập cuối kỳ', classlevel: 'Lớp 4', subject: 'Toán', period: 'Học Kỳ 1',
      questions: [
        {
          type: 'Trắc nghiệm', q: 'Chọn đáp án đúng cho mỗi ý sau.',
          subquestions: parts.map((label, index) => ({ label, prompt: `Câu con ${label} về số tự nhiên`, options: ['10', '20', '30', '40'], answer: String((index + 1) * 10) })),
          ans: '10, 20, 30, 40', partAnswerCounts: [1, 1, 1, 1]
        },
        {
          type: 'Đúng/Sai', q: 'Đọc các nhận định sau và chọn Đúng hoặc Sai.',
          statements: parts.map((label, index) => ({ label: label.toUpperCase(), text: `Nhận định ${index + 1}`, answer: index % 2 ? 'Sai' : 'Đúng' })),
          ans: 'Đúng, Sai, Đúng, Sai', partAnswerCounts: [1, 1, 1, 1]
        },
        {
          type: 'So sánh', q: 'Điền dấu thích hợp.',
          comparisonRows: parts.map((label, index) => ({ label, leftText: `${index + 1} 000`, rightText: `${index + 1} 001`, display: `${index + 1} 000 ___ ${index + 1} 001`, answer: '<' })),
          ans: '<, <, <, <', partAnswerCounts: [1, 1, 1, 1]
        },
        {
          type: 'Điền khuyết', q: 'Hoàn thành các phép tính.',
          practiceRows: parts.map((label, index) => ({ label, display: `${index + 1} + 1 = ___`, answer: String(index + 2) })),
          ans: '2, 3, 4, 5', partAnswerCounts: [1, 1, 1, 1]
        },
        {
          type: 'Kéo thả', instruction: 'Phân loại các góc sau.', q: 'Phân loại các góc sau.',
          angleItems: parts.map(label => ({ label, svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" /></svg>', type: 'Góc nhọn' })),
          options: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'], ans: 'Góc nhọn, Góc nhọn, Góc nhọn, Góc nhọn', partAnswerCounts: [1, 1, 1, 1]
        },
        {
          type: 'Điền khuyết', instruction: 'Đếm các loại góc trong hình.', q: 'Đếm các loại góc trong hình.',
          angleVisual: '<svg viewBox="0 0 10 10"><path d="M1 9 L5 1 L9 9" /></svg>',
          angleCountRows: parts.map((label, index) => ({ label, text: `góc loại ${index + 1}` })),
          ans: '1, 2, 3, 4', partAnswerCounts: [1, 1, 1, 1]
        },
        {
          type: 'Chuỗi Quy luật', instruction: 'Điền số thích hợp vào mỗi dãy.', q: 'Điền số thích hợp vào mỗi dãy.',
          sequenceRounds: parts.map((label, index) => ({ label, display: `${index + 1}, ___, ${index + 3}`, blankIndexes: [1] })),
          ans: '2, 3, 4, 5', partAnswerCounts: [1, 1, 1, 1]
        },
        {
          type: 'Điền khuyết', q: 'Hoàn thành từng dòng:<br>a) 10 + ___<br>b) 20 + ___<br>c) 30 + ___<br>d) 40 + ___',
          ans: '1, 2, 3, 4', partAnswerCounts: [1, 1, 1, 1]
        },
        { type: 'Trắc nghiệm', q: 'Chọn một đáp án đúng.', options: ['10', '20', '30', '40'], ans: '10' },
        { type: 'Đúng/Sai', q: 'Chọn Đúng hoặc Sai cho nhận định sau.', options: [], ans: 'Đúng' }
      ]
    }];
    app.admin.renderESubTab('lib');
  });

  await page.getByLabel('Tìm trong thư viện đề').fill('ôn tập cuối kỳ');
  await page.getByRole('button', { name: 'Xem đề', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chi tiết đề: Toán lớp 4 · Ôn tập cuối kỳ' })).toBeVisible();
  await expect(page.locator('#print-area .exam-print__title')).toHaveText('Toán lớp 4 · Ôn tập cuối kỳ');
  const previewTitleStyle = await page.locator('#print-area .exam-print__title').evaluate(element => {
    const style = getComputedStyle(element);
    return { fontFamily: style.fontFamily, borderRadius: style.borderRadius };
  });
  expect(previewTitleStyle.fontFamily).toContain('Times New Roman');
  expect(previewTitleStyle.borderRadius).toBe('12px');
  await expect(page.locator('#print-area .exam-print__exam-heading')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__kicker')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__student-field')).toHaveCount(2);
  await expect(page.locator('#print-area .exam-print__student-field').first()).toContainText('Họ và tên học sinh:');
  await expect(page.locator('#print-area .exam-print__student-field').nth(1)).toContainText('Ngày làm bài:');
  await expect(page.locator('#print-area .exam-print__meta')).toContainText('Cấp lớp 4');
  await expect(page.locator('#print-area .exam-print__meta')).not.toContainText('Lớp: Lớp 4');
  await expect(page.getByRole('button', { name: 'Xuất PDF / A4', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xuất PNG / A4', exact: true })).toBeVisible();
  await expect(page.locator('#print-area .exam-print__question')).toHaveCount(10);
  await expect(page.locator('#print-area .exam-print__subquestion')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__subquestion-option')).toHaveCount(16);
  await expect(page.locator('#print-area .exam-print__statement')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__comparison-row')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__practice-row')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__angle-item')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__angle-count-row')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__sequence-round')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__answer-part')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__question-number')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__question-heading').first()).toContainText('Câu 1:');
  await expect(page.locator('#print-area .exam-print__question-lead').first()).toHaveText('Chọn đáp án đúng cho mỗi ý sau.');
  await expect(page.locator('#print-area .exam-print__question-heading small')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__subquestion-options--4')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__generic-options--4')).toHaveCount(1);
  await expect(page.locator('#print-area .exam-print__parts--two-columns')).toHaveCount(2);
  await expect(page.locator('#print-area .exam-print__comparison-slot')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__comparison-choices')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__comparison-row .exam-print__answer-line')).toHaveCount(0);

  const spacing = await page.locator('#print-area .exam-print__question').evaluateAll(elements => elements.slice(0, 2).map(element => {
    const style = getComputedStyle(element);
    return { lineHeight: parseFloat(style.lineHeight), fontSize: parseFloat(style.fontSize), marginTop: parseFloat(style.marginTop), paddingTop: parseFloat(style.paddingTop) };
  }));
  expect(spacing[0].lineHeight / spacing[0].fontSize).toBeLessThanOrEqual(1.35);
  expect(spacing[0].paddingTop).toBeLessThanOrEqual(10);
  expect(spacing[1].marginTop).toBeLessThanOrEqual(10);

  const comparisonColumns = await page.locator('#print-area .exam-print__comparison-row').first().evaluate(element => {
    return element.children[1].getBoundingClientRect().width;
  });
  expect(comparisonColumns).toBeLessThanOrEqual(220);

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Xuất PDF / A4', exact: true }).click();
  const printPage = await popupPromise;
  await printPage.waitForLoadState('domcontentloaded');
  await expect(printPage.locator('body > #print-document')).toHaveCount(1);
  await expect(printPage.locator('#exam-print-styles')).toHaveCount(1);
  await expect(printPage.locator('#print-document .exam-print__title')).toHaveText('Toán lớp 4 · Ôn tập cuối kỳ');
  await expect(printPage.locator('#print-document .exam-print__exam-heading')).toHaveCount(0);
  await expect(printPage.locator('#print-document .exam-print__kicker')).toHaveCount(0);
  await expect(printPage.locator('#print-document .exam-print__question-number')).toHaveCount(0);
  await expect(printPage.locator('#print-document .exam-print__question')).toHaveCount(10);
  await expect(printPage.locator('#print-document .exam-print__subquestion')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__statement')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__question-heading small')).toHaveCount(0);
  await expect(printPage.locator('#print-document .exam-print__comparison-slot')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__comparison-choices')).toHaveCount(0);
  await expect(printPage.locator('#print-document .exam-print__comparison-row .exam-print__answer-line')).toHaveCount(0);
  await expect(printPage.locator('#print-document .exam-print__angle-item')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__angle-count-row')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__sequence-round')).toHaveCount(4);
  await expect(printPage.locator('.admin-panel, #treasure-modal, .admin-compose-shell')).toHaveCount(0);
  await printPage.waitForLoadState('load');
  await printPage.emulateMedia({ media: 'print' });
  await expect(printPage.locator('body > #print-document')).toBeVisible();
  const printChrome = await printPage.locator('#print-document').evaluate(element => {
    const title = element.querySelector('.exam-print__title');
    const titleStyle = getComputedStyle(title);
    const rootStyle = getComputedStyle(element);
    return {
      fontFamily: titleStyle.fontFamily,
      borderRadius: titleStyle.borderRadius,
      controls: element.querySelectorAll('input,select,textarea,button').length,
      scrollbarWidth: rootStyle.scrollbarWidth,
      webkitScrollbarDisplay: getComputedStyle(element, '::-webkit-scrollbar').display
    };
  });
  expect(printChrome.fontFamily).toContain('Times New Roman');
  expect(printChrome.borderRadius).toBe('12px');
  expect(printChrome.controls).toBe(0);
  expect(printChrome.scrollbarWidth).toBe('none');
  expect(printChrome.webkitScrollbarDisplay).toBe('none');
  const printLayout = await printPage.locator('#print-document').evaluate(element => ({
    studentDirection: getComputedStyle(element.querySelector('.exam-print__student-fields')).flexDirection,
    shortOptionColumns: getComputedStyle(element.querySelector('.exam-print__subquestion-options--4')).gridTemplateColumns.split(/\s+/).length,
    twoColumnParts: getComputedStyle(element.querySelector('.exam-print__parts--two-columns')).gridTemplateColumns.split(/\s+/).length,
    questionBreakInside: getComputedStyle(element.querySelector('.exam-print__question')).breakInside,
    statementChoicesShareRow: (() => {
      const statement = element.querySelector('.exam-print__statement');
      const text = statement.querySelector('.exam-print__statement-text').getBoundingClientRect();
      const choices = statement.querySelector('.exam-print__statement-choices').getBoundingClientRect();
      return Math.abs(text.top - choices.top) < 8;
    })()
  }));
  expect(printLayout).toEqual({ studentDirection: 'row', shortOptionColumns: 4, twoColumnParts: 2, questionBreakInside: 'avoid', statementChoicesShareRow: true });
  const printSpacing = await printPage.locator('#print-document .exam-print__question').evaluateAll(elements => elements.slice(0, 2).map(element => {
    const style = getComputedStyle(element);
    return { lineHeight: parseFloat(style.lineHeight), fontSize: parseFloat(style.fontSize), marginTop: parseFloat(style.marginTop), paddingTop: parseFloat(style.paddingTop) };
  }));
  expect(printSpacing[0].lineHeight / printSpacing[0].fontSize).toBeLessThanOrEqual(1.35);
  expect(printSpacing[0].paddingTop).toBeLessThanOrEqual(8);
  expect(printSpacing[1].marginTop).toBeLessThanOrEqual(10);
  const optionColumns = await page.evaluate(() => ({
    four: app.admin.getExamPrintOptionColumns(['10', '20', '30', '40']),
    two: app.admin.getExamPrintOptionColumns(['Phương án một', 'Phương án hai', 'Phương án ba']),
    one: app.admin.getExamPrintOptionColumns(['Một đáp án rất dài cần giữ riêng một cột để không bị chật', 'Đáp án thứ hai cũng có nội dung dài hơn bình thường', 'Đáp án thứ ba có nhiều chữ cần đủ rộng', 'Đáp án thứ tư cũng cần giữ nguyên một cột'])
  }));
  expect(optionColumns).toEqual({ four: 4, two: 2, one: 1 });
  const pdfBytes = await printPage.pdf({
    path: testInfo.outputPath('exam-print-a4.pdf'),
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true
  });
  expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdfBytes.length).toBeGreaterThan(20_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  expect(await page.locator('#print-area').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});

test('bản in làm nổi bật câu dẫn, thu gọn câu chung và không thêm ô dư cho so sánh cũ', async ({ page }) => {
  await openLibrary(page);
  await page.evaluate(() => {
    app.data.exams = [{
      name: 'Bài kiểm tra trình bày', classlevel: 'Lớp 4', subject: 'Toán', period: 'Học kỳ 1',
      questions: [
        {
          type: 'So sánh', q: 'Điền dấu thích hợp:<br>a) 9 897 ___ 10 000<br>b) 45 031 ___ 40 000 + 5 000 + 30',
          comparisonRows: [
            { label: 'a', display: 'a) 9 897 ___ 10 000', answer: '<' },
            { label: 'b', display: 'b) 45 031 ___ 40 000 + 5 000 + 30', answer: '<' }
          ], ans: '<, <'
        },
        {
          type: 'Trắc nghiệm', q: 'Hãy tìm số bé nhất trong các số sau.', sharedPrompt: true,
          subquestions: ['a', 'b', 'c', 'd'].map((label, index) => ({
            label, prompt: '', options: ['13 023', '74 861', '10 613', '67 315'], answer: String(index)
          })), ans: '0, 1, 2, 3'
        }
      ]
    }];
    app.admin.renderESubTab('lib');
  });

  await page.getByLabel('Tìm trong thư viện đề').fill('trình bày');
  await page.getByRole('button', { name: 'Xem đề', exact: true }).click();
  const firstHeading = page.locator('#print-area .exam-print__question-heading').first();
  await expect(firstHeading.locator('.exam-print__question-lead')).toHaveText('Điền dấu thích hợp:');
  await expect(firstHeading.locator('.exam-print__question-lead')).toHaveCSS('font-weight', /^(7|8|9)/);
  await expect(page.locator('#print-area .exam-print__comparison-choices')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__comparison-fallback')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__comparison-row').first().locator('.exam-print__comparison-side').nth(1)).toHaveText('10 000');
  await expect(page.locator('#print-area .exam-print__parts--shared-subquestions')).toHaveCount(1);
  await expect(page.locator('#print-area .exam-print__subquestion--shared')).toHaveCount(4);
  await expect(page.locator('#print-area .exam-print__subquestion--shared .exam-print__subquestion-prompt--shared').first().locator('.exam-print__subquestion-options')).toHaveCount(1);
});

test('bản in dùng nhãn lớp cụ thể và PNG được chia thành các trang A4', async ({ page }) => {
  await openLibrary(page);
  await page.evaluate(() => {
    app.data.exams = [{
      id: 'exam-png-a4',
      name: 'Ôn tập phép tính',
      classlevel: 'Lớp 4',
      class_name: '4/4',
      subject: 'Toán',
      period: 'Học Kỳ 1',
      questions: [{
        type: 'Trắc nghiệm',
        q: 'Chọn câu trả lời đúng.',
        options: ['12', '24', '36', '48'],
        ans: '12'
      }]
    }];
    app.admin.viewExam(0);
    window.html2canvas = async stage => {
      window.__pngStageLayout = {
        width: stage.getBoundingClientRect().width,
        studentDirection: getComputedStyle(stage.querySelector('.exam-print__student-fields')).flexDirection,
        shortOptionColumns: getComputedStyle(stage.querySelector('.exam-print__generic-options--4')).gridTemplateColumns.split(/\s+/).length
      };
      const canvas = document.createElement('canvas');
      canvas.width = 794;
      canvas.height = 2246;
      return canvas;
    };
  });

  await expect(page.locator('#print-area .exam-print__meta')).toContainText('Lớp: 4/4');
  await expect(page.locator('#print-area .exam-print__meta')).not.toContainText('Cấp lớp 4');
  await expect(page.locator('#print-area .exam-print__exam-heading')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__kicker')).toHaveCount(0);
  await expect(page.locator('#print-area .exam-print__student-field').first()).toContainText('Họ và tên học sinh:');
  await expect(page.locator('#print-area .exam-print__student-field').nth(1)).toContainText('Ngày làm bài:');

  const pngPopupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Xuất PNG / A4', exact: true }).click();
  const pngPage = await pngPopupPromise;
  await pngPage.waitForLoadState('domcontentloaded');
  await expect(pngPage.locator('body')).toContainText('Xuất PNG A4');
  await expect(pngPage.locator('.exam-png-preview__sheet')).toHaveCount(2);
  await expect(pngPage.locator('a[download]')).toHaveCount(2);
  await expect(pngPage.locator('img')).toHaveCount(2);
  await expect(pngPage.locator('img').first()).toHaveAttribute('width', '2480');
  await expect(pngPage.locator('img').first()).toHaveAttribute('height', '3508');
  const pngStageLayout = await page.evaluate(() => window.__pngStageLayout);
  expect(pngStageLayout).toEqual({ width: 794, studentDirection: 'row', shortOptionColumns: 4 });
  await pngPage.close();
});

test('loader PNG không chờ vô hạn khi script CDN bị treo', async ({ page }) => {
  await openLibrary(page);
  const result = await page.evaluate(async () => {
    const originalAppendChild = document.head.appendChild;
    document.head.appendChild = () => undefined;
    try {
      return await Promise.race([
        app.utils.loadScript('https://example.invalid/html2canvas-never-finishes.js', '__missingHtml2CanvasForTest', 150),
        new Promise(resolve => window.setTimeout(() => resolve('timeout'), 500))
      ]);
    } finally {
      document.head.appendChild = originalAppendChild;
    }
  });
  expect(result).toBe(false);
});
