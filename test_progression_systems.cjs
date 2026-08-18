const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const dailySource = fs.readFileSync('src/modules/daily.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

// ---- Danh hiệu: bảng 20 bậc (5 nhóm x 4 cấp) ----
const titlesMatch = source.match(/PLAYER_TITLES = \[([\s\S]*?)\];/);
assert.ok(titlesMatch, 'PLAYER_TITLES array must be defined in main.js.');
const titleCount = (titlesMatch[1].match(/name:/g) || []).length;
assert.equal(titleCount, 20, `PLAYER_TITLES must have 20 ranks, found ${titleCount}.`);

const expectedTitles = [
  'Học Trò Tò Mò', 'Học Trò Chăm Chỉ', 'Học Trò Gương Mẫu', 'Học Trò Xuất Sắc',
  'Đội Trưởng Sáng Tạo', 'Đội Trưởng Thiên Tài', 'Đội Trưởng Siêu Việt', 'Đội Trưởng Bậc Thầy',
  'Nhà Nghiên Cứu Nhí', 'Nhà Nghiên Cứu', 'Nhà Nghiên Cứu Tài Ba', 'Nhà Nghiên Cứu Đại Tài',
  'Nhà Phát Minh Nhí', 'Nhà Phát Minh', 'Nhà Phát Minh Tài Năng', 'Nhà Phát Minh Uyên Bác',
  'Nhà Khoa Học Nhí', 'Nhà Khoa Học', 'Nhà Khoa Học Thiên Tài', 'Nhà Khoa Học Vĩ Đại'
];
for (const title of expectedTitles) {
  assert.match(source, new RegExp(`name: '${title.replace(/'/g, "\\'")}'`),
    `PLAYER_TITLES must include "${title}".`);
}

// ---- Danh hiệu dựa trên tổng Sao tích lũy suốt đời ----
assert.match(dailySource, /total_stars_earned/,
  'The client must track total stars earned over a lifetime.');
assert.match(dailySource, /addStars\(user, amount\)/,
  'addStars helper must exist to credit stars.');
assert.match(dailySource, /user\.total_stars_earned = \(user\.total_stars_earned \|\| 0\) \+ amount/,
  'addStars must increment lifetime stars together with the spendable balance.');
assert.match(source, /getPlayerTitle\(user\)/,
  'getPlayerTitle must resolve the current title.');
assert.match(source, /PLAYER_TITLES\.find\(t => earned >= t\.stars\)/,
  'getPlayerTitle must pick the highest qualifying rank by lifetime stars.');

// ---- Năng lượng (5 trái tim/ngày) ----
assert.match(dailySource, /energy_date !== today/,
  'Energy must be reset when the stored date is not today.');
assert.match(dailySource, /user\.energy = 5/,
  'Energy must reset to 5 per day.');
assert.match(dailySource, /spendEnergy\(user\)/,
  'spendEnergy helper must exist to consume a heart.');
assert.match(source, /Bạn đã dùng hết 5 lượt chơi hôm nay/,
  'Starting a round must be blocked when energy is exhausted.');

// ---- Hộp quà hằng ngày ----
assert.match(dailySource, /daily_gift_date/,
  'The daily gift claim date must be stored per user.');
assert.match(dailySource, /daily_gift_streak/,
  'The daily gift streak must be tracked.');
assert.match(dailySource, /claimDailyGift\(\)/,
  'claimDailyGift must exist to credit the daily reward.');

// ---- Thẻ người chơi hiển thị Danh hiệu + Sao ----
assert.match(source, /Danh hiệu:/,
  'The player card must display the current title.');
assert.match(source, /⭐.*\$\{starCount\}.*Sao/,
  'The player card must display the star balance.');

// ---- Hướng dẫn: mục Danh hiệu + đánh số theo vai trò ----
assert.match(html, /id="guide-titles"/,
  'The guide must include the title-system section.');
assert.match(html, /9\. Hệ thống Danh hiệu/,
  'The student guide must number the title section 9.');
assert.match(html, /10\. Dành cho Giáo viên/,
  'The admin guide must number the teacher section 10 (last).');

console.log('Progression systems (titles / energy / daily gift / stars) contract verified.');
