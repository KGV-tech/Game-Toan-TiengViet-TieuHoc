const fs = require('fs');
const main = fs.readFileSync('d:/NTT/AI/Web/Game lop5/src/main.js', 'utf8');

function extractArray(name) {
    const regex = new RegExp(`let ${name} = JSON\\.parse\\([^)]+\\)\\s*\\|\\|\\s*(\\[[\\s\\S]*?\\]);`, 'm');
    const match = main.match(regex);
    if (match) {
        return match[1];
    }
    return '[]';
}

const users = extractArray('users');
const libraryQuestions = extractArray('libraryQuestions');
const exams = extractArray('exams');

fs.writeFileSync('d:/NTT/AI/Web/Game lop5/scratch/data_backup.js', 
`const defaultUsers = ${users};
const defaultLibraryQuestions = ${libraryQuestions};
const defaultExams = ${exams};

module.exports = { defaultUsers, defaultLibraryQuestions, defaultExams };
`, 'utf8');

console.log("Data extracted!");
