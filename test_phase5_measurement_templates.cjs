const assert = require('node:assert/strict');
const { generateQuestion, templateIds } = require('./src/question-templates/grade-4/math');

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 0x100000000;
    };
}

function numericValue(value) {
    return Number(String(value).replace(/\s/g, ''));
}

function assertFourPartChoice(question, key) {
    assert.equal(question.templateId, key);
    assert.equal(question.topic, '4. Một số đơn vị đo Đại lượng');
    assert.equal(question.type, 'Trắc nghiệm');
    assert.equal(question.subquestions.length, 4);
    assert.deepEqual(question.partAnswerCounts, [1, 1, 1, 1]);
    assert.equal(question.ans.split(', ').length, 4);
    question.subquestions.forEach(part => {
        assert.equal(part.options.length, 4);
        assert.equal(new Set(part.options).size, 4);
        assert(part.options.includes(part.answer));
        assert(part.prompt);
    });
    assert(!JSON.stringify(question).includes('undefined'));
}

const requiredKeys = [
    'measurement.mass_unit_convert',
    'measurement.area_unit_convert',
    'measurement.time_unit_convert',
    'measurement.century_identification',
    'measurement.word_problem_units',
    'measurement.practice_cards',
    'measurement.hk1_review_b17_b20'
];
requiredKeys.forEach(key => assert(templateIds.includes(key), `Phase 5 phải đăng ký ${key}.`));

const massKinds = ['yenToKg', 'taToKg', 'tonToKg', 'yenAndKgToKg', 'tonAndYenToKg'];
for (let seed = 0; seed < 20; seed += 1) {
    const question = generateQuestion('measurement.mass_unit_convert', { allowedKinds: ['taToKg'] }, seededRandom(5100 + seed));
    assert.equal(question.practiceRows.length, 4);
    assert(question.practiceRows.every(row => row.kind === 'taToKg'));
    assert(question.practiceRows.every(row => row.answer >= 200 && row.answer <= 900));
}
assert.throws(
    () => generateQuestion('measurement.mass_unit_convert', { allowedKinds: [] }, seededRandom(5121)),
    /khối lượng không hợp lệ/i
);
assert.throws(
    () => generateQuestion('measurement.mass_unit_convert', { allowedKinds: ['unknown'] }, seededRandom(5122)),
    /khối lượng không hợp lệ/i
);
const massQuestion = generateQuestion('measurement.mass_unit_convert', { allowedKinds: massKinds }, seededRandom(5123));
assert(massQuestion.practiceRows.every(row => massKinds.includes(row.kind)));

const areaKinds = ['m2ToDm2', 'dm2ToCm2', 'dm2ToMm2', 'cm2ToDm2'];
const areaQuestion = generateQuestion('measurement.area_unit_convert', { allowedKinds: ['m2ToDm2'] }, seededRandom(5130));
assert(areaQuestion.practiceRows.every(row => row.kind === 'm2ToDm2'));
assert(areaQuestion.practiceRows.every(row => row.answer >= 200 && row.answer <= 900));
assert.throws(
    () => generateQuestion('measurement.area_unit_convert', { allowedKinds: ['m2ToCm2'] }, seededRandom(5131)),
    /diện tích không hợp lệ/i
);
assert(generateQuestion('measurement.area_unit_convert', { allowedKinds: areaKinds }, seededRandom(5132)).practiceRows.every(row => areaKinds.includes(row.kind)));

const secondsOnly = generateQuestion('measurement.time_unit_convert', {
    allowedKinds: ['minuteToSeconds', 'minutesAndSecondsToSeconds']
}, seededRandom(5140));
assert(secondsOnly.practiceRows.every(row => ['minuteToSeconds', 'minutesAndSecondsToSeconds'].includes(row.kind)));
assert(secondsOnly.practiceRows.every(row => /giây/.test(row.display)));
assert.throws(
    () => generateQuestion('measurement.time_unit_convert', { allowedKinds: [] }, seededRandom(5141)),
    /thời gian không hợp lệ/i
);

for (let seed = 0; seed < 20; seed += 1) {
    const question = generateQuestion('measurement.century_identification', {
        centuryStart: 18,
        centuryEnd: 21
    }, seededRandom(5150 + seed));
    assertFourPartChoice(question, 'measurement.century_identification');
    question.subquestions.forEach(part => {
        const year = Number(part.prompt.match(/data-year="true">(\d{4})</)[1]);
        assert(year >= 1701 && year <= 2100);
        assert(!part.prompt.includes('\u00a0'));
        const century = Math.floor((year - 1) / 100) + 1;
        const roman = { 18: 'XVIII', 19: 'XIX', 20: 'XX', 21: 'XXI' }[century];
        assert.equal(part.answer, roman);
    });
}
assert.throws(
    () => generateQuestion('measurement.century_identification', { centuryStart: 20, centuryEnd: 21 }, seededRandom(5171)),
    /thế kỉ.*phạm vi/i
);
assert.throws(
    () => generateQuestion('measurement.century_identification', { centuryStart: 21, centuryEnd: 20 }, seededRandom(5172)),
    /thế kỉ.*phạm vi/i
);

for (let seed = 0; seed < 12; seed += 1) {
    const question = generateQuestion('measurement.word_problem_units', { scenarioKinds: ['mass'] }, seededRandom(5180 + seed));
    assert.equal(question.practiceRows.length, 4);
    assert(question.practiceRows.every(row => row.kind === 'mass'));
    assert.equal(new Set(question.practiceRows.map(row => row.scenarioId)).size, 4);
    assert(question.practiceRows.every(row => Number.isInteger(row.answer) && row.answer > 0));
}
assert.throws(
    () => generateQuestion('measurement.word_problem_units', { scenarioKinds: [] }, seededRandom(5193)),
    /ngữ cảnh.*không hợp lệ/i
);
assert.throws(
    () => generateQuestion('measurement.word_problem_units', { scenarioKinds: ['geometry'] }, seededRandom(5194)),
    /ngữ cảnh.*không hợp lệ/i
);

const practiceKinds = ['mass', 'area', 'time', 'century'];
for (let seed = 0; seed < 24; seed += 1) {
    const question = generateQuestion('measurement.practice_cards', { allowedKinds: practiceKinds }, seededRandom(5200 + seed));
    assertFourPartChoice(question, 'measurement.practice_cards');
    assert.deepEqual([...question.subquestions.map(part => part.kind)].sort(), [...practiceKinds].sort());
    assert.equal(question.templateVariables.kinds, practiceKinds.join(', '));
    assert(!/thích hợp nhất/i.test(JSON.stringify(question)));
}
const areaPractice = generateQuestion('measurement.practice_cards', { allowedKinds: ['area'] }, seededRandom(5230));
assert(areaPractice.subquestions.every(part => part.kind === 'area'));
assert.throws(
    () => generateQuestion('measurement.practice_cards', { allowedKinds: [] }, seededRandom(5231)),
    /thực hành.*nhóm đơn vị/i
);
assert.throws(
    () => generateQuestion('measurement.practice_cards', { allowedKinds: ['mass', 'mass'] }, seededRandom(5232)),
    /thực hành.*nhóm đơn vị/i
);

const reviewSkillSets = [
    ['b17', 'b18', 'b19', 'b20'],
    ['b20', 'b17', 'b18', 'b19']
];
reviewSkillSets.forEach((skills, index) => {
    const question = generateQuestion('measurement.hk1_review_b17_b20', { skills }, seededRandom(5240 + index));
    assertFourPartChoice(question, 'measurement.hk1_review_b17_b20');
    assert.deepEqual(question.subquestions.map(part => part.skill), skills);
    assert.deepEqual(question.subquestions.map(part => part.lesson), skills.map(skill => ({ b17: 'g4-math-hk1-b17', b18: 'g4-math-hk1-b18', b19: 'g4-math-hk1-b19', b20: 'g4-math-hk1-b20' }[skill])));
    assert.equal(question.templateVariables.skills, skills.join(', '));
});
assert.throws(
    () => generateQuestion('measurement.hk1_review_b17_b20', { skills: ['b17', 'b18', 'b19'] }, seededRandom(5250)),
    /Bài 17 đến Bài 20/i
);
assert.throws(
    () => generateQuestion('measurement.hk1_review_b17_b20', { skills: ['b17', 'b18', 'b19', 'b19'] }, seededRandom(5251)),
    /Bài 17 đến Bài 20/i
);

const defaultReview = generateQuestion('measurement.hk1_review_b17_b20', {}, seededRandom(5252));
assert.deepEqual(defaultReview.subquestions.map(part => part.skill), ['b17', 'b18', 'b19', 'b20']);
assert(defaultReview.subquestions.every(part => part.lesson && part.skillLabel));
assert(defaultReview.subquestions.flatMap(part => part.options).every(option => Number.isFinite(numericValue(option)) || /XVIII|XIX|XX|XXI/.test(option)));

console.log('Phase 5 B17–B21 measurement template contracts verified.');
