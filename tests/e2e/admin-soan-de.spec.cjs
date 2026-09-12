const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  const consoleErrors = [];
  const supabaseRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.url().includes('.supabase.co')) supabaseRequests.push(request.url());
  });
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
  return { consoleErrors, supabaseRequests };
}

test('Admin mở Soạn Đề với quick start, thẻ thống kê và ngữ cảnh mặc định', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = Array.from({ length: 36 }, () => ({}));
    app.data.libraryQuestions = Array.from({ length: 142 }, () => ({}));
    app.data.exams = Array.from({ length: 18 }, () => ({}));
    app.admin.openComposer();
  });

  await page.evaluate(() => {
    app.router.open('map-screen');
    document.querySelector('#exam-station')?.click();
  });
  await expect.poll(() => page.locator('#admin-compose-screen').evaluate(element => element.classList.contains('active'))).toBe(true);
  await expect(page.locator('#exam-station-label')).toHaveText('Soạn Đề');
  await expect(page.locator('#exam-station-image')).toHaveAttribute('src', /soan-de\.png$/);
  await page.evaluate(() => app.admin.openComposer());

  await expect(page.locator('#admin-compose-screen')).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: 'Soạn Đề' }).first()).toBeVisible();
  await expect(page.locator('#admin-compose-quickstart')).toContainText('Hôm nay cô muốn làm gì?');
  await expect(page.locator('#admin-compose-steps')).toContainText('CÁC BƯỚC SOẠN ĐỀ');
  await expect(page.locator('#admin-compose-quickstart')).toHaveCount(1);
  await expect(page.locator('#admin-compose-context')).toHaveCount(0);
  await expect(page.locator('#admin-compose-class')).toHaveCount(0);
  await expect(page.locator('#admin-compose-continue')).toHaveCount(0);
  await expect(page.locator('.admin-compose-quickstart-card')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /Soạn template/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Soạn câu hỏi/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Soạn Đề/ }).first()).toBeVisible();
  await expect(page.locator('.admin-compose-card')).toHaveCount(3);
  await expect(page.locator('.admin-compose-card__metrics')).toHaveCount(3);
  await expect(page.locator('#admin-compose-screen')).toContainText('Học sinh vẫn dùng trạm Luyện Đề');
  await expect(page.locator('#admin-compose-module-summary')).toContainText('Lớp 4');
  await expect(page.locator('#admin-compose-module-summary')).toContainText('Toán');
  await expect(page.locator('#admin-compose-module-summary')).toContainText('Học Kỳ 1');

  await page.getByRole('button', { name: /Câu Hỏi/ }).first().click();
  await expect(page.locator('.admin-compose-card--questions')).toHaveClass(/is-selected/);
  await expect(page.locator('#admin-compose-module-panel')).toHaveAttribute('data-module', 'questions');
  await expect(page.locator('#admin-compose-module-panel')).toContainText('Câu Hỏi');

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Kho câu hỏi dùng thẻ tương tác, bộ lọc và thao tác rõ ràng', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.libraryQuestions = [
      {
        id: 'question-card-1', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
        topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01', type: 'Trắc nghiệm',
        q: 'Tìm số lớn nhất trong các số sau.', options: ['12 345', '54 321', '23 456', '34 567'],
        ans: '54 321', explanation: 'So sánh các chữ số theo từng hàng.'
      },
      {
        id: 'question-card-2', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
        topic: '2. Góc và đơn vị đo góc', lesson: 'g4-math-hk1-b02', type: 'Điền khuyết',
        q: 'Một góc vuông có số đo là bao nhiêu độ?', options: [], ans: '90°', explanation: ''
      }
    ];
    app.admin.openComposer('questions');
  });

  await expect(page.locator('.question-library')).toBeVisible();
  await expect(page.locator('#admin-q-subarea table')).toHaveCount(0);
  await expect(page.locator('.question-library-card')).toHaveCount(2);
  await expect(page.getByLabel('Tìm trong kho câu hỏi')).toBeVisible();
  await expect(page.getByRole('button', { name: /Soạn câu hỏi/ }).first()).toBeVisible();
  await expect(page.locator('.question-library-card__answer')).toHaveCount(2);
  await expect(page.locator('.question-library-card__options')).toHaveCount(1);

  const search = page.getByLabel('Tìm trong kho câu hỏi');
  await search.fill('số lớn nhất');
  await expect(page.locator('.question-library-card')).toHaveCount(1);
  await expect(page.locator('.question-library-card h4')).toContainText('Tìm số lớn nhất');
  await expect(search).toBeFocused();

  await page.locator('.question-library-card .q-select-cb').check();
  await expect(page.getByRole('button', { name: /Xóa các câu đã chọn \(1\)/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm vào đề', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sửa', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xóa', exact: true })).toBeVisible();

  await search.fill('');
  await page.getByLabel('Chọn tất cả câu đang hiển thị').check();
  await expect(page.locator('.question-library-card .q-select-cb:checked')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /Xóa các câu đã chọn \(2\)/ })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('.question-library')).toBeVisible();
  await expect.poll(() => page.locator('.question-library__grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(1);

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Kho template dùng thẻ trực quan, có tạo mới và Preview khung câu hỏi', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = [{
      id: 'template-preview-demo', name: 'Nhận biết chữ số theo hàng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01', question_type: 'Trắc nghiệm',
      generator_key: 'number.digit_at_place', prompt_template: 'Số nào dưới đây có chữ số hàng {place} là {digit}?',
      config: { minimum: 10000, maximum: 99999, allowedPlaces: ['tens'], allowedDigits: [4] }, is_active: true
    }];
    app.admin.openComposer('templates');
  });

  await expect(page.locator('.template-library')).toBeVisible();
  await expect(page.locator('.template-library-card')).toHaveCount(1);
  await expect(page.locator('#btn-template-create')).toBeVisible();
  await expect(page.locator('.template-library-card h4')).toHaveText('Nhận biết chữ số theo hàng');

  await page.locator('#btn-template-create').click();
  await expect(page.locator('#template-editor-title')).toHaveText('Tạo template mới');
  await expect(page.locator('#template-example')).not.toContainText('Giao diện khi học sinh làm bài');
  await expect(page.locator('.template-editor__preview-image')).toHaveCount(0);
  await expect(page.locator('#template-preview-open')).toBeVisible();
  await expect(page.locator('.template-part-checkbox')).toHaveCount(4);
  await expect(page.locator('.template-part-checkbox:checked')).toHaveCount(4);
  await page.locator('#template-part-count').selectOption('2');
  await expect(page.locator('.template-part-checkbox:checked')).toHaveCount(2);
  const selectedTemplateConfig = await page.evaluate(() => app.admin.collectTemplateForm().config);
  expect(selectedTemplateConfig.selectedParts).toEqual([0, 1]);

  await page.locator('#template-preview-open').click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('.template-preview-dialog__close')).toBeFocused();
  await expect(page.locator('#template-preview-dialog .template-preview__canvas')).toBeVisible();
  await expect(page.locator('#template-preview-dialog .template-preview__choices').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '1. Đề mới' })).toBeVisible();
  await expect(page.getByRole('button', { name: '2. Đề có sẵn' })).toBeVisible();
  await expect(page.locator('#template-preview-back')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#template-preview-dialog')).toBeHidden();
});

test('Template lập số dùng câu hỏi chung và công thức câu con trực quan', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  await page.evaluate(() => {
    app.data.currentUser = { username: 'teacher', fullname: 'Cô giáo Minh', role: 'admin' };
    app.data.questionTemplates = [{
      id: 'compose-presentation', name: 'Lập số từ các hàng', classlevel: 'Lớp 4', subject: 'Toán', semester: 'Học kỳ 1',
      topic: '1. Ôn tập và bổ sung', lesson: 'g4-math-hk1-b01', question_type: 'Điền khuyết',
      generator_key: 'number.compose_from_places', prompt_template: '{question}',
      config: { minimum: 10000, maximum: 99999 }, is_active: true
    }];
    app.admin.openComposer('templates');
    app.admin.renderTemplateForm(0);
  });

  await expect(page.getByLabel('Nội dung chữ 2')).toHaveValue('. Số đó là: ');
  await expect(page.locator('.template-content-block')).toHaveCount(3);
  await expect(page.locator('#template-prompt')).toHaveCount(0);
  await page.locator('#template-common-question').fill('Hãy viết số vào ô trống, biết số đó gồm:');
  await page.getByRole('button', { name: /Preview/ }).click();
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  await expect(page.locator('#template-preview-dialog')).toContainText('Hãy viết số vào ô trống, biết số đó gồm:');
  await expect(page.locator('#template-preview-dialog [aria-label="Ô điền đáp án"]')).toHaveCount(4);
  await expect(page.locator('#template-preview-dialog')).not.toContainText('a) a)');

  const saved = await page.evaluate(() => app.admin.collectTemplateForm());
  expect(saved.prompt_template).toBe('{question}');
  expect(saved.config.presentation).toEqual({
    version: 1,
    common: 'Hãy viết số vào ô trống, biết số đó gồm:',
    parts: [
      { type: 'variable', key: 'place_values', value: '' },
      { type: 'text', key: 'answer', value: '. Số đó là: ' },
      { type: 'cell', key: 'answer', value: '' }
    ]
  });

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('#template-preview-dialog')).toBeVisible();
  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Soạn Đề chỉ mở cho Admin và trạm đề vẫn là Luyện Đề với học sinh', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const { consoleErrors, supabaseRequests } = await openOfflineHomepage(page);

  const studentResult = await page.evaluate(() => {
    app.data.currentUser = { username: 'student', fullname: 'Học sinh', role: 'student' };
    const result = app.admin.openComposer();
    return { result, active: document.querySelector('#admin-compose-screen')?.classList.contains('active') };
  });
  expect(studentResult).toEqual({ result: false, active: false });

  await page.evaluate(() => {
    app.data.currentUser = { username: 'student', fullname: 'Học sinh', role: 'student' };
    app.router.open('map-screen');
    document.querySelector('.station-practice')?.click();
  });
  await expect.poll(() => page.locator('#exam-select-screen').evaluate(element => element.classList.contains('active'))).toBe(true);
  await expect(page.locator('#exam-station-label')).toHaveText('Luyện Đề');
  await expect(page.locator('#exam-station-image')).toHaveAttribute('src', /luyen-de\.png$/);

  expect(supabaseRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
