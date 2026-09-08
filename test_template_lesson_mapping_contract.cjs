const assert = require('node:assert/strict');

globalThis.app = {};
require('./src/modules/constants.js');
require('./src/modules/curriculum.js');

const { constants, curriculum } = globalThis.app;
const topic = (semester, index) => constants.topics['4'].math[semester][index];
const template = (topicName, generatorKey, extra = {}) => ({
  classlevel: 'Lớp 4',
  subject: 'Toán',
  semester: 'Học kỳ 1',
  topic: topicName,
  generator_key: generatorKey,
  ...extra
});
const lessonOf = item => curriculum.getTemplateLesson(item);

assert.equal(lessonOf(template(topic('hk1', 0), 'number.match_number_words')), 'g4-math-hk1-b01');
assert.equal(lessonOf(template('1. Số tự nhiên', 'number.match_number_words')), 'g4-math-hk1-b01',
  'Legacy Topic 1 names must resolve to the current Topic 1 lesson catalog.');
assert.equal(lessonOf(template(topic('hk1', 0), 'number.four_operations_fill_blanks')), 'g4-math-hk1-b02');
assert.equal(lessonOf(template(topic('hk1', 0), 'number.four_operations_expressions')), 'g4-math-hk1-b02');

assert.equal(lessonOf(template(topic('hk1', 2), 'number.digit_at_place')), 'g4-math-hk1-b11');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.place_value_true_false')), 'g4-math-hk1-b11');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.safe_password_by_place_value')), 'g4-math-hk1-b11');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.compose_from_places')), 'g4-math-hk1-b11');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.missing_expanded_addend')), 'g4-math-hk1-b11');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.smallest_of_four')), 'g4-math-hk1-b14');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.largest_of_four')), 'g4-math-hk1-b14');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.compare_number_forms')), 'g4-math-hk1-b14');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.neighbor_numbers')), 'g4-math-hk1-b15');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.natural_sequence')), 'g4-math-hk1-b15');

assert.equal(lessonOf(template(topic('hk1', 1), 'g4-m-angle-count-in-polygon')), 'g4-math-hk1-b08');
assert.equal(lessonOf(template(topic('hk1', 1), 'g4-m-angle-drag-classify')), 'g4-math-hk1-b08');
assert.equal(lessonOf(template(topic('hk1', 1), 'g4-m-angle-clock-classify')), 'g4-math-hk1-b08');
assert.equal(lessonOf(template(topic('hk1', 1), 'g4-m-angle-count-eight-angles')), 'g4-math-hk1-b08');

assert.equal(lessonOf(template(topic('hk1', 3), 'measurement.mass_unit_convert')), 'g4-math-hk1-b17');
assert.equal(lessonOf(template(topic('hk1', 3), 'measurement.area_unit_convert')), 'g4-math-hk1-b18');
assert.equal(lessonOf(template(topic('hk1', 3), 'measurement.time_unit_convert')), 'g4-math-hk1-b19');
assert.equal(lessonOf(template(topic('hk1', 3), 'measurement.century_identification')), 'g4-math-hk1-b19');
assert.equal(lessonOf(template(topic('hk1', 3), 'measurement.compare_units')), 'g4-math-hk1-b21');
assert.equal(lessonOf(template(topic('hk1', 3), 'measurement.word_problem_units')), 'g4-math-hk1-b21');

assert.equal(lessonOf(template(topic('hk1', 4), 'g4-m-addition-property-fill')), 'g4-math-hk1-b24');
assert.equal(lessonOf(template(topic('hk1', 4), 'g4-m-sum-difference-direct')), 'g4-math-hk1-b25');
assert.equal(lessonOf(template(topic('hk1', 4), 'g4-m-sum-difference-context')), 'g4-math-hk1-b25');
assert.equal(lessonOf(template(topic('hk1', 4), 'g4-m-add-sub-multi-digit')), 'g4-math-hk1-b26');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.four_arithmetic_blanks')), 'g4-math-hk1-b16');

assert.equal(lessonOf(template(topic('hk1', 2), 'number.digit_at_place', { config: { lesson: 'g4-math-hk1-b10' } })), 'g4-math-hk1-b10',
  'An explicit lesson must override legacy inference.');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.digit_at_place', { config: { lesson: 'Bài 11. Hàng và lớp' } })), 'g4-math-hk1-b11');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.digit_at_place', { classlevel: 'Lớp 5' })), '');
assert.equal(lessonOf(template(topic('hk1', 2), 'number.digit_at_place', { subject: 'Tiếng Việt' })), '');

console.log('Grade 4 Math template lesson mapping contract verified.');
