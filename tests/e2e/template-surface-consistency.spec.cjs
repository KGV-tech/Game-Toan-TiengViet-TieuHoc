const { test, expect } = require('@playwright/test');

async function openOfflineHomepage(page) {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');
}

async function openQuestion(page, question) {
  await page.evaluate(questionData => {
    app.data.currentUser = { username: 'template-surface-student', fullname: 'Học sinh thử nghiệm', role: 'student' };
    document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('game-play-view').classList.add('active');
    app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [questionData], answerSubmitted: false };
    app.game.loadQuestion();
  }, question);
}

test('đáp án dài hiện ngay dưới từng ô sai và ô nhập giữ font giao diện', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Hãy điền số liền trước và số liền sau vào mỗi dòng:<br>a) ___ ; 58 465 ; ___<br>b) ___ ; 58 864 ; ___<br>c) ___ ; 67 654 ; ___<br>d) ___ ; 82 390 ; ___',
    type: 'Điền khuyết',
    ans: '58 464, 58 466, 58 863, 58 865, 67 653, 67 655, 82 389, 82 391'
  });

  for (let index = 0; index < 8; index++) {
    await page.locator(`#fill-input-${index}`).fill('0');
  }
  await page.locator('#submit-ans-btn').click();
  await expect(page.locator('.answer-correction')).toHaveCount(8);
  await expect(page.locator('.game-answer-reveal')).toHaveCount(0);

  const layout = await page.locator('.answer-correction').first().evaluate(correction => {
    const input = correction.previousElementSibling;
    const inputRect = input.getBoundingClientRect();
    const correctionRect = correction.getBoundingClientRect();
    const question = document.getElementById('game-question-container');
    const inputStyle = getComputedStyle(input);
    return {
      belowInput: correctionRect.top >= inputRect.bottom - 1,
      centered: Math.abs((correctionRect.left + correctionRect.width / 2) - (inputRect.left + inputRect.width / 2)) <= 1,
      fitsQuestion: question.scrollWidth <= question.clientWidth,
      inputFont: inputStyle.fontFamily,
      inputColor: inputStyle.color
    };
  });

  expect(layout.belowInput).toBe(true);
  expect(layout.centered).toBe(true);
  expect(layout.fitsQuestion).toBe(true);
  expect(layout.inputFont.toLowerCase()).toContain('quicksand');
  expect(layout.inputColor).not.toBe('rgb(126, 34, 206)');
  await page.screenshot({ path: testInfo.outputPath('long-answer-reveal.png'), fullPage: true });

  await page.setViewportSize({ width: 1024, height: 768 });
  const tabletLayout = await page.locator('.answer-correction').first().evaluate(correction => {
    const input = correction.previousElementSibling;
    const correctionRect = correction.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const question = document.getElementById('game-question-container');
    return {
      belowInput: correctionRect.top >= inputRect.bottom - 1,
      questionFits: question.scrollWidth <= question.clientWidth
    };
  });
  expect(tabletLayout).toEqual({ belowInput: true, questionFits: true });
});

test('chấm sai ô điền bằng gạch đỏ, hiện đáp án kế bên và gắn nhãn từng ý', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Tính giá trị của biểu thức:<br>a) 91 + 6 = ___<br>b) 74 + 9 = ___<br>c) 90 + 6 = ___<br>d) 84 + 2 = ___',
    type: 'Điền khuyết',
    ans: '97, 83, 96, 86'
  });

  for (let index = 0; index < 4; index++) {
    await page.locator(`#fill-input-${index}`).fill('0');
  }
  await page.locator('#submit-ans-btn').click();

  await expect(page.locator('.magic-input.wrong')).toHaveCount(4);
  await expect(page.locator('.answer-correction')).toHaveCount(4);
  await expect(page.locator('.answer-correction')).toHaveText(['97', '83', '96', '86']);
  await expect(page.locator('.game-answer-reveal')).toHaveCount(0);

  const correctionLayout = await page.locator('.answer-correction').first().evaluate(correction => {
    const input = correction.previousElementSibling;
    const inputRect = input.getBoundingClientRect();
    const correctionRect = correction.getBoundingClientRect();
    return {
      wrapper: correction.parentElement.className,
      belowInput: correctionRect.top >= inputRect.bottom - 1,
      centered: Math.abs((correctionRect.left + correctionRect.width / 2) - (inputRect.left + inputRect.width / 2)) <= 1
    };
  });
  expect(correctionLayout.wrapper).toContain('answer-field-wrap');
  expect(correctionLayout.belowInput).toBe(true);
  expect(correctionLayout.centered).toBe(true);

  const wrongInputStyle = await page.locator('.magic-input.wrong').first().evaluate(input => ({
    decoration: getComputedStyle(input).textDecorationLine,
    color: getComputedStyle(input).color
  }));
  expect(wrongInputStyle.decoration).toContain('line-through');
  expect(wrongInputStyle.color).not.toBe('rgb(30, 41, 59)');
});

test('các dạng nhiều ý khác cũng hiện bảng đáp án có nhãn sau khi chấm sai', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Chọn đáp án đúng cho mỗi ý.',
    type: 'Trắc nghiệm',
    ans: '2, 4, 6, 8',
    subquestions: [
      { label: 'a', prompt: 'Một cộng một bằng?', options: ['1', '2'], answer: '2' },
      { label: 'b', prompt: 'Hai cộng hai bằng?', options: ['3', '4'], answer: '4' },
      { label: 'c', prompt: 'Ba cộng ba bằng?', options: ['5', '6'], answer: '6' },
      { label: 'd', prompt: 'Bốn cộng bốn bằng?', options: ['7', '8'], answer: '8' }
    ],
    partAnswerCounts: [1, 1, 1, 1]
  });

  for (const row of await page.locator('.multi-choice-subquestion').all()) {
    await row.locator('.multi-choice-subquestion__option').first().click();
  }
  await page.locator('#submit-ans-btn').click();

  await expect(page.locator('.multi-choice-subquestion__option.wrong')).toHaveCount(4);
  await expect(page.locator('.multi-choice-subquestion__option.wrong').first()).toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.locator('.game-answer-reveal__part')).toHaveText(['a) 2', 'b) 4', 'c) 6', 'd) 8']);
});

test('dạng điền một ô cũng ghi đáp án đúng cạnh câu trả lời sai', async ({ page }) => {
  await openOfflineHomepage(page);
  await openQuestion(page, { q: 'Số liền sau của 8 là', type: 'Điền khuyết', ans: '9' });
  await page.locator('.magic-input').fill('7');
  await page.locator('#submit-ans-btn').click();

  await expect(page.locator('.magic-input.wrong')).toHaveCount(1);
  await expect(page.locator('.answer-correction')).toHaveText('9');
  await expect(page.locator('.game-answer-reveal')).toHaveCount(0);
  await expect(page.locator('#explanation-box')).toBeHidden();
  await expect(page.locator('#explanation-box')).toHaveText('');
});

test('ô dấu dùng dạng vuông tối và vẫn giữ bề mặt tối khi chấm sai', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Điền dấu thích hợp:',
    type: 'Kéo thả',
    ans: '<, <, <, <',
    comparisonRows: [
      { label: 'a', leftText: '35 306', rightText: '40 000' },
      { label: 'b', leftText: '67 641', rightText: '80 000' },
      { label: 'c', leftText: '54 441', rightText: '60 000' },
      { label: 'd', leftText: '79 063', rightText: '90 000' }
    ]
  });

  const initialCell = await page.locator('.comparison-drag-slot').first().evaluate(cell => ({
    borderRadius: getComputedStyle(cell).borderTopLeftRadius,
    background: getComputedStyle(cell).backgroundColor
  }));
  expect(initialCell.borderRadius).toBe('10px');
  expect(initialCell.background).not.toBe('rgb(255, 255, 255)');

  await page.locator('.comparison-drag-sign[data-sign=">"]').click();
  for (const slot of await page.locator('.comparison-drag-slot').all()) await slot.click();
  await page.locator('#submit-ans-btn').click();

  await expect(page.locator('.answer-correction')).toHaveText(['<', '<', '<', '<']);
  await expect(page.locator('.game-answer-reveal')).toHaveCount(0);
  const checkedCell = await page.locator('.comparison-drag-slot').first().evaluate(cell => ({
    state: cell.className,
    background: getComputedStyle(cell).backgroundColor,
    color: getComputedStyle(cell).color
  }));
  expect(checkedCell.state).toContain('answer-state-wrong');
  expect(checkedCell.background).not.toBe('rgb(254, 226, 226)');
  expect(checkedCell.color).not.toBe('rgb(220, 38, 38)');

  const comparisonLayout = await page.locator('.comparison-drag-row').evaluateAll(rows => rows.map(row => {
    const rect = row.getBoundingClientRect();
    const host = document.getElementById('game-question-container').getBoundingClientRect();
    return rect.right <= host.right + 1;
  }));
  expect(comparisonLayout.every(Boolean)).toBe(true);
});

test('dạng kéo thả góc vẫn đặt đáp án sửa bài cạnh ô mà không tràn dòng', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);
  await openQuestion(page, {
    q: 'Kéo thả tên loại góc thích hợp vào ô trống bên cạnh mỗi hình vẽ:',
    type: 'Kéo thả',
    ans: 'Góc vuông, Góc tù, Góc bẹt, Góc nhọn',
    options: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'],
    angleItems: [
      { label: 'a', type: 'Góc vuông', svg: '<svg viewBox="0 0 10 10"></svg>' },
      { label: 'b', type: 'Góc tù', svg: '<svg viewBox="0 0 10 10"></svg>' },
      { label: 'c', type: 'Góc bẹt', svg: '<svg viewBox="0 0 10 10"></svg>' },
      { label: 'd', type: 'Góc nhọn', svg: '<svg viewBox="0 0 10 10"></svg>' }
    ]
  });

  await page.evaluate(() => {
    const slots = [...document.querySelectorAll('.drag-slot')];
    slots.forEach(slot => {
      slot.textContent = 'Góc nhọn';
      slot.classList.add('filled');
    });
    app.game.state.selectedAns = slots.map(() => 'Góc nhọn').join(', ');
    app.game.submitAnswer();
  });

  await expect(page.locator('.answer-correction')).toHaveCount(3);
  await expect(page.locator('.game-answer-reveal')).toHaveCount(0);
  await expect(page.locator('.answer-correction')).toHaveText(['Góc vuông', 'Góc tù', 'Góc bẹt']);
  const rowsFit = await page.locator('.angle-drag-row').evaluateAll(rows => rows.map(row => {
    const rect = row.getBoundingClientRect();
    const host = document.getElementById('game-question-container').getBoundingClientRect();
    return rect.right <= host.right + 1;
  }));
  expect(rowsFit.every(Boolean)).toBe(true);
});

test('mọi nhóm template tạo sẵn đều giữ bề mặt tối và font giao diện', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openOfflineHomepage(page);

  const audit = await page.evaluate(() => {
    const sampleIds = [
      'number.place_value_true_false',
      'number.natural_sequence',
      'number.four_operations_expressions',
      'g4-m-angle-drag-classify',
      'g4-m-angle-count-in-polygon',
      'number.match_number_words'
    ];
    return sampleIds.map(templateId => {
      const question = window.Grade4MathTemplates.generateQuestion(templateId, {}, (() => { let seed = 42; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000); })());
      app.game.state = { ...app.game.state, score: 0, currentIdx: 0, questions: [question], answerSubmitted: false };
      app.game.loadQuestion();
      const controls = [...document.querySelectorAll('#game-play-view :is(.ans-btn, .tf-statement, .drag-slot, .magic-input, .seq-slot, .matching-item)')];
      return {
        templateId,
        hasControls: controls.length > 0,
        whiteControl: controls.some(element => getComputedStyle(element).backgroundColor === 'rgb(255, 255, 255)'),
        courierInput: controls.some(element => element.matches('input') && getComputedStyle(element).fontFamily.toLowerCase().includes('courier')),
        horizontalOverflow: document.getElementById('game-question-container').scrollWidth > document.getElementById('game-question-container').clientWidth
      };
    });
  });

  expect(audit.every(result => result.hasControls)).toBe(true);
  expect(audit.every(result => !result.whiteControl)).toBe(true);
  expect(audit.every(result => !result.courierInput)).toBe(true);
  expect(audit.every(result => !result.horizontalOverflow)).toBe(true);
});
