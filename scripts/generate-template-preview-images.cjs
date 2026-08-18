const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const outputDirectory = join(process.cwd(), 'src', 'assets', 'template-previews');
const previews = [
  ['number.digit_at_place', 'digit-at-place.jpg', { minimum: 10000, maximum: 999999, allowedPlaces: ['hundreds'], allowedDigits: [8] }],
  ['number.smallest_of_four', 'smallest-of-four.jpg', { minimum: 10000, maximum: 999999 }],
  ['number.largest_of_four', 'largest-of-four.jpg', { minimum: 10000, maximum: 999999 }],
  ['number.compose_from_places', 'compose-from-places.jpg', { minimum: 10000, maximum: 999999 }],
  ['number.missing_expanded_addend', 'missing-expanded-addend.jpg', { minimum: 10000, maximum: 999999 }],
  ['number.four_arithmetic_blanks', 'four-arithmetic-blanks.jpg', { minimumDigits: 3, maximumDigits: 4, operations: ['+', '-'], layouts: ['expressionLeft', 'expressionRight', 'twoExpressions'], blankPositions: ['first', 'second', 'third', 'fourth'] }],
  ['number.four_arithmetic_comparisons', 'four-arithmetic-comparisons.jpg', { minimumDigits: 3, maximumDigits: 4, operations: ['+', '-'], layouts: ['expressionLeft', 'expressionRight', 'twoExpressions'] }],
  ['number.neighbor_numbers', 'neighbor-numbers.jpg', { minimum: 10000, maximum: 999999 }],
  ['number.compare_number_forms', 'compare-number-forms.jpg', { minimum: 10000, maximum: 999999 }],
  ['number.place_value_true_false', 'place-value-true-false.jpg', { minimum: 10000000, maximum: 999999999, statementKinds: ['class', 'place'] }],
  ['number.safe_password_by_place_value', 'safe-password-by-place-value.jpg', { minimum: 10000000, maximum: 999999999, minimumCodeLength: 8, maximumCodeLength: 9 }],
  ['number.match_number_words', 'match-number-words.jpg', { shapes: ['4:5'], digits: [6], digitStrategy: 'balanced' }]
];

async function wait(milliseconds) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function main() {
  mkdirSync(outputDirectory, { recursive: true });
  const server = spawn(process.execPath, ['tests/e2e/static-server.cjs'], { stdio: 'ignore' });
  const browser = await chromium.launch({ headless: true });
  try {
    await wait(500);
    const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    for (const [generator, fileName, config] of previews) {
      await page.evaluate(({ generator, config }) => {
        let seed = 314159;
        const random = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 0x100000000;
        };
        const question = window.Grade4MathTemplates.generateQuestion(generator, config, random);
        app.data.currentUser = { username: 'demo-student', role: 'student' };
        app.game.state = { score: 0, currentIdx: 0, questions: [question] };
        document.querySelectorAll('.screen, .game-view').forEach(element => element.classList.remove('active'));
        document.getElementById('game-screen').classList.add('active');
        document.getElementById('game-play-view').classList.add('active');
        app.game.loadQuestion();
      }, { generator, config });
      await page.screenshot({ path: join(outputDirectory, fileName), type: 'jpeg', quality: 68 });
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
