const assert = require('node:assert/strict');
const { generateQuestion } = require('./src/question-templates/grade-4/math');
const factors = { 'kg': 1, 'yến': 10, 'tạ': 100, 'tấn': 1000, 'mm²': 1, 'cm²': 100, 'dm²': 10000, 'm²': 1000000, 'giây': 1, 'phút': 60, 'giờ': 3600, 'ngày': 86400, 'tuần': 604800 };
function amount(text) {
  let sum = 0;
  const rest = text.replace(/([\d\s]+)\s*(mm²|cm²|dm²|m²|kg|yến|tạ|tấn|giây|phút|giờ|ngày|tuần)/g, (_, value, unit) => {
    sum += Number(value.replace(/\s/g, '')) * factors[unit];
    return '';
  });
  assert.equal(rest.trim(), '', `Unknown quantity: ${text}`);
  return sum;
}
for (const kind of ['mass', 'area', 'time']) {
  for (let seed = 1; seed <= 100; seed++) {
    let state = seed;
    const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 0x100000000; };
    const q = generateQuestion('measurement.match_equivalences', { matchingKinds: [kind] }, random);
    const [left, right] = q.options.map(column => column.split(', ').map(amount));
    assert.equal(new Set(left).size, 5, 'All left cards must represent different amounts.');
    assert.equal(new Set(right).size, 4, 'All right cards must represent different amounts.');
    assert.equal(left.filter(value => right.includes(value)).length, 4, 'Exactly four cards match; the distractor must be unmatched.');
    for (const row of q.matchingRows) assert.equal(amount(row.left), amount(row.right));
  }
}
console.log('300 measurement matching variants: correct conversions, unique cards and one unmatched distractor.');
