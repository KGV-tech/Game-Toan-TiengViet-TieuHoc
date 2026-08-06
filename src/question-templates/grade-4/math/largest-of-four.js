const { randomInt, shuffle, formatNumber, createQuestion } = require('./shared');

function generateLargestOfFour(config = {}, random = Math.random) {
    const minimum = config.minimum ?? 1000;
    const maximum = config.maximum ?? 99999;
    const values = new Set();
    while (values.size < 4) values.add(randomInt(minimum, maximum, random));
    const options = [...values];
    const answer = Math.max(...options);

    return createQuestion(
        'number.largest_of_four',
        'Hãy tìm số lớn nhất trong các số sau.',
        shuffle(options, random),
        answer,
        `So sánh bốn số theo hàng chục nghìn, rồi đến hàng nghìn để chọn số lớn nhất là ${formatNumber(answer)}.`
    );
}

module.exports = generateLargestOfFour;
