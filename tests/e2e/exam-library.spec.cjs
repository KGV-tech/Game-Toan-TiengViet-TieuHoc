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

test('xem đề hiển thị đủ câu con, dùng tên đề và in riêng nội dung A4', async ({ page }) => {
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

  const spacing = await page.locator('#print-area .exam-print__question').evaluateAll(elements => elements.slice(0, 2).map(element => {
    const style = getComputedStyle(element);
    return { lineHeight: parseFloat(style.lineHeight), fontSize: parseFloat(style.fontSize), marginTop: parseFloat(style.marginTop), paddingTop: parseFloat(style.paddingTop) };
  }));
  expect(spacing[0].lineHeight / spacing[0].fontSize).toBeGreaterThan(1.5);
  expect(spacing[0].paddingTop).toBeGreaterThanOrEqual(20);
  expect(spacing[1].marginTop).toBeGreaterThanOrEqual(20);

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'In PDF / A4', exact: true }).click();
  const printPage = await popupPromise;
  await printPage.waitForLoadState('domcontentloaded');
  await expect(printPage.locator('body > #print-document')).toHaveCount(1);
  await expect(printPage.locator('#print-document .exam-print__title')).toHaveText('Toán lớp 4 · Ôn tập cuối kỳ');
  await expect(printPage.locator('#print-document .exam-print__question')).toHaveCount(10);
  await expect(printPage.locator('#print-document .exam-print__subquestion')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__statement')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__angle-item')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__angle-count-row')).toHaveCount(4);
  await expect(printPage.locator('#print-document .exam-print__sequence-round')).toHaveCount(4);
  await expect(printPage.locator('.admin-panel, #treasure-modal, .admin-compose-shell')).toHaveCount(0);
  await printPage.emulateMedia({ media: 'print' });
  await expect(printPage.locator('body > #print-document')).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 768 });
  expect(await page.locator('#print-area').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});
