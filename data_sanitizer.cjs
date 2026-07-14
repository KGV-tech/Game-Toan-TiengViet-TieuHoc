const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const libDir = fs.readdirSync(__dirname).find(d => d.startsWith('Th') && d.includes('vi'));
const inputPath = path.join(__dirname, libDir, 'Quiz', 'Kho_Cau_Hoi_Game_5340_Cau_KNTT_2026_Clean.xlsx');
const outputPath = path.join(__dirname, libDir, 'Quiz', 'Kho_Cau_Hoi_Game_5340_Cau_Perfect.xlsx');

console.log('Loading:', inputPath);
const wb = xlsx.readFile(inputPath);
const wsName = wb.SheetNames[0];
const ws = wb.Sheets[wsName];
const data = xlsx.utils.sheet_to_json(ws);

let fixedTopicCount = 0;
let fixedOptionsCount = 0;

data.forEach((row, idx) => {
    // 1. Fix Decimal Topic Errors
    const topic = String(row['Chủ đề'] || '').toLowerCase();
    const qStr = String(row['Câu hỏi'] || '');
    if (topic.includes('số thập phân')) {
        if (!qStr.includes(',') && !qStr.toLowerCase().includes('thập phân') && !qStr.includes('/')) {
            row['Chủ đề'] = 'Ôn tập số tự nhiên'; 
            fixedTopicCount++;
        }
    }

    // 2. Fix missing options for Kéo thả & Chuỗi quy luật
    const qType = String(row['Loại câu hỏi'] || '');
    const ans = String(row['Đáp án đúng'] || '').trim();
    if ((qType === 'Kéo thả' || qType === 'Chuỗi quy luật') && !row['Lựa chọn']) {
        if (ans) {
            const num = parseFloat(ans.replace(',', '.'));
            if (!isNaN(num)) {
                const opts = [
                    ans,
                    String(num + 1).replace('.', ','),
                    String(num - 1).replace('.', ','),
                    String(num + 10).replace('.', ',')
                ];
                row['Lựa chọn'] = opts.sort(() => 0.5 - Math.random()).join(', ');
                fixedOptionsCount++;
            } else {
                row['Lựa chọn'] = [ans, ans + 'x', 'Không phải ' + ans, 'Khác'].sort(() => 0.5 - Math.random()).join(', ');
                fixedOptionsCount++;
            }
        }
    }
});

console.log('Fixed Topics:', fixedTopicCount);
console.log('Fixed Missing Options:', fixedOptionsCount);

const newWs = xlsx.utils.json_to_sheet(data);
const newWb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(newWb, newWs, wsName);
xlsx.writeFile(newWb, outputPath);
console.log('Done! Saved to', outputPath);

