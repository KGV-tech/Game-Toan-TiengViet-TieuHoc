const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

const regex = /downloadETemplate\(\)\s*\{\s*const data = \[\{\s*"Cấp lớp": "Lớp 5",[\s\S]*?\}\];\s*app\.ui\.exportToExcel\(data, "Mau_Nhap_De_Kiem_Tra\.xlsx"\);\s*\}/;
const match = code.match(regex);

if (match) {
    const newFunc = `downloadETemplate() {
            const data = [
                {
                    "Cấp lớp": "--- HƯỚNG DẪN CÁCH ĐIỀN ---",
                    "Môn": "",
                    "Kỳ kiểm tra": "",
                    "Tên đề": ""
                },
                {
                    "Cấp lớp": "Nhập: Lớp 1, Lớp 2, Lớp 3, Lớp 4 hoặc Lớp 5",
                    "Môn": "Nhập: Toán hoặc Tiếng Việt",
                    "Kỳ kiểm tra": "Nhập: Giữa kỳ 1, Cuối kỳ 1, Giữa kỳ 2, hoặc Cuối kỳ 2",
                    "Tên đề": "Tên đề (ví dụ: Đề thi thử Giữa kỳ 1 Toán 5)"
                },
                {
                    "Cấp lớp": "--- CÁC VÍ DỤ (VUI LÒNG XÓA ĐỂ NHẬP MỚI) ---",
                    "Môn": "",
                    "Kỳ kiểm tra": "",
                    "Tên đề": ""
                },
                {
                    "Cấp lớp": "Lớp 5",
                    "Môn": "Toán",
                    "Kỳ kiểm tra": "Giữa kỳ 1",
                    "Tên đề": "Đề thi Giữa kỳ 1 Môn Toán Lớp 5"
                },
                {
                    "Cấp lớp": "Lớp 3",
                    "Môn": "Tiếng Việt",
                    "Kỳ kiểm tra": "Cuối kỳ 2",
                    "Tên đề": "Đề ôn thi Cuối kỳ 2 Tiếng Việt 3"
                }
            ];
            app.ui.exportToExcel(data, "Mau_Nhap_De_Kiem_Tra.xlsx");
        }`;
        
    code = code.replace(regex, newFunc);
    fs.writeFileSync('src/main.js', code, 'utf8');
    console.log("Success replacing downloadETemplate");
} else {
    console.log("Regex did not match for ETemplate");
}
