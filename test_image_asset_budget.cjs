const assert = require('node:assert/strict');
const { readFileSync, statSync } = require('node:fs');

function pngDimensions(path) {
    const buffer = readFileSync(path);
    assert.equal(buffer.toString('ascii', 1, 4), 'PNG', `${path} must remain a PNG image.`);
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: statSync(path).size };
}

function webpBytes(path) {
    const buffer = readFileSync(path);
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', `${path} must remain a WebP image.`);
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP', `${path} must remain a WebP image.`);
    return statSync(path).size;
}

const assets = {
    teacher: pngDimensions('public/avatar-teacher-female.png'),
    castleDefense: pngDimensions('public/castle_defense.png'),
    robotCatNormal: pngDimensions('public/robot_cat_normal_transparent.png'),
    robotCatHappy: pngDimensions('public/robot_cat_happy_transparent.png'),
    robotCatSad: pngDimensions('public/robot_cat_sad_transparent.png'),
    robotCatSubjectSelect: pngDimensions('public/robot_cat_subject_select.png'),
    mathExplorer: webpBytes('public/subject_math_explorer.webp'),
    vietnameseExplorer: webpBytes('public/subject_vietnamese_explorer.webp'),
    shopAdventure: webpBytes('public/shop_adventure_bg.webp'),
    vietnameseAdventure: webpBytes('public/vietnamese_adventure_bg.webp'),
    practiceExamTitanium: webpBytes('public/practice_exam_titanium_bg.webp')
};

assert(assets.teacher.width <= 256 && assets.teacher.height <= 256, 'Teacher avatar must not exceed its 256px delivery size.');
assert(assets.castleDefense.width <= 640 && assets.castleDefense.height <= 640, 'Castle background must not exceed its 640px delivery size.');
assert(assets.robotCatNormal.width <= 512 && assets.robotCatNormal.height <= 768, 'Normal robot cat must stay at its in-game display resolution.');
assert(assets.robotCatHappy.width <= 512 && assets.robotCatHappy.height <= 768, 'Happy robot cat must stay at its in-game display resolution.');
assert(assets.robotCatSad.width <= 512 && assets.robotCatSad.height <= 768, 'Sad robot cat must stay at its in-game display resolution.');
assert(assets.robotCatSubjectSelect.width <= 678 && assets.robotCatSubjectSelect.height <= 768, 'Subject-select robot cat must stay at its in-game display resolution.');
assert(assets.teacher.bytes < 400_000, 'Teacher avatar must stay below 400KB.');
assert(assets.castleDefense.bytes < 900_000, 'Castle background must stay below 900KB.');
assert(assets.robotCatNormal.bytes < 350_000, 'Normal robot cat must stay below 350KB.');
assert(assets.robotCatHappy.bytes < 350_000, 'Happy robot cat must stay below 350KB.');
assert(assets.robotCatSad.bytes < 350_000, 'Sad robot cat must stay below 350KB.');
assert(assets.robotCatSubjectSelect.bytes < 350_000, 'Subject-select robot cat must stay below 350KB.');
assert(assets.mathExplorer < 200_000, 'Math subject artwork must stay below 200KB.');
assert(assets.vietnameseExplorer < 200_000, 'Vietnamese subject artwork must stay below 200KB.');
assert(assets.shopAdventure < 500_000, 'Shop background must stay below 500KB.');
assert(assets.vietnameseAdventure < 500_000, 'Vietnamese world background must stay below 500KB.');
assert(assets.practiceExamTitanium < 500_000, 'Practice-exam background must stay below 500KB.');

console.log('Image asset delivery budget verified.');
