const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

const regex = /downloadQTemplate\s*\(\s*type\s*\)\s*\{[\s\S]*?const data =[\s\S]*?\[guide, sample\] : \[\];([\s\S]*?)app\.ui\.exportToExcel\(data,\s*fileName\);\s*\}/;
const match = code.match(regex);
if (match) {
    const newFunc = `downloadQTemplate(type) {
            let data = [];
            
            const divider = (text) => ({ "Cấp lớp": text, "Môn học": "", "Học kỳ": "", "Chủ đề": "", "Mức độ khó": "", "Loại câu hỏi": "", "Câu hỏi": "", "Lựa chọn": "", "Đáp án đúng": "", "Lời giải chi tiết": "" });

            if (type) {
                data.push(divider("--- HƯỚNG DẪN CÁCH ĐIỀN CÁC CỘT ---"));
                let guide = {
                    "Cấp lớp": "Nhập chính xác: Lớp 1, Lớp 2, Lớp 3, Lớp 4 hoặc Lớp 5",
                    "Môn học": "Nhập chính xác: Toán hoặc Tiếng Việt",
                    "Học kỳ": "Nhập chính xác: Học kỳ 1 hoặc Học kỳ 2",
                    "Chủ đề": "Phải thuộc danh sách các chủ đề hợp lệ (xem phần dưới cùng của file)",
                    "Mức độ khó": "Nhập: Dễ, Trung bình, Khó, hoặc Cực khó",
                    "Loại câu hỏi": type,
                    "Câu hỏi": "",
                    "Lựa chọn": "",
                    "Đáp án đúng": "",
                    "Lời giải chi tiết": "Không bắt buộc (có thể bỏ trống)"
                };
                
                let sample1 = {}, sample2 = {};

                switch (type) {
                    case 'Trắc nghiệm':
                        guide["Câu hỏi"] = "Nội dung câu hỏi trắc nghiệm";
                        guide["Lựa chọn"] = "Nhập các đáp án ngăn cách nhau bằng dấu phẩy (VD: 1, 2, 3, 4)";
                        guide["Đáp án đúng"] = "Nhập chính xác 1 lựa chọn đúng trong số các lựa chọn đã ghi";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Các số đến 10", "Mức độ khó": "Dễ",
                            "Loại câu hỏi": type, "Câu hỏi": "Số nào lớn nhất trong các số sau?", "Lựa chọn": "1, 5, 9, 3",
                            "Đáp án đúng": "9", "Lời giải chi tiết": "Vì 9 > 5 > 3 > 1"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Chữ cái", "Mức độ khó": "Trung bình",
                            "Loại câu hỏi": type, "Câu hỏi": "Từ nào sau đây có chứa chữ a?", "Lựa chọn": "con cò, con cá, con ong",
                            "Đáp án đúng": "con cá", "Lời giải chi tiết": "Từ con cá có chữ cá chứa chữ a"
                        };
                        break;
                    case 'Điền khuyết':
                        guide["Câu hỏi"] = "Câu hỏi cần điền, bắt buộc phải có ___ (3 dấu gạch dưới) để làm chỗ trống";
                        guide["Lựa chọn"] = "BỎ TRỐNG (Không cần điền)";
                        guide["Đáp án đúng"] = "Nhập chính xác từ cần điền vào chỗ trống";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Chữ cái", "Mức độ khó": "Dễ",
                            "Loại câu hỏi": type, "Câu hỏi": "Con bò kêu rống ___ ___", "Lựa chọn": "",
                            "Đáp án đúng": "ò ó", "Lời giải chi tiết": ""
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Mức độ khó": "Trung bình",
                            "Loại câu hỏi": type, "Câu hỏi": "Kết quả của 5 + ___ = 10", "Lựa chọn": "",
                            "Đáp án đúng": "5", "Lời giải chi tiết": "10 - 5 = 5"
                        };
                        break;
                    case 'Đúng/Sai':
                        guide["Câu hỏi"] = "Đưa ra một nhận định để học sinh phán đoán Đúng hay Sai";
                        guide["Lựa chọn"] = "BỎ TRỐNG";
                        guide["Đáp án đúng"] = "Ghi chính xác: Đúng hoặc Sai";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 3", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Bảng nhân", "Mức độ khó": "Dễ",
                            "Loại câu hỏi": type, "Câu hỏi": "5 x 3 = 15", "Lựa chọn": "",
                            "Đáp án đúng": "Đúng", "Lời giải chi tiết": "Vì 5 x 3 = 15 là phép tính chính xác"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Từ ngữ", "Mức độ khó": "Trung bình",
                            "Loại câu hỏi": type, "Câu hỏi": "Từ 'mặt trời' viết sai chính tả.", "Lựa chọn": "",
                            "Đáp án đúng": "Sai", "Lời giải chi tiết": "Từ 'mặt trời' viết đúng chính tả."
                        };
                        break;
                    case 'So sánh':
                        guide["Câu hỏi"] = "Đưa ra 2 vế cần so sánh. Bắt buộc có ___ (3 gạch dưới) ở giữa (VD: 5 ___ 3)";
                        guide["Lựa chọn"] = "BỎ TRỐNG";
                        guide["Đáp án đúng"] = "Ghi 1 trong 3 dấu: <, > hoặc =";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Các số đến 10", "Mức độ khó": "Dễ",
                            "Loại câu hỏi": type, "Câu hỏi": "5 ___ 3", "Lựa chọn": "",
                            "Đáp án đúng": ">", "Lời giải chi tiết": "Vì 5 lớn hơn 3"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Mức độ khó": "Trung bình",
                            "Loại câu hỏi": type, "Câu hỏi": "10 + 5 ___ 15", "Lựa chọn": "",
                            "Đáp án đúng": "=", "Lời giải chi tiết": "Vì 10 + 5 = 15"
                        };
                        break;
                    case 'Chuỗi Quy luật':
                        guide["Câu hỏi"] = "Ghi chuỗi quy luật, dùng ___ (3 gạch dưới) cho vị trí cần điền (VD: 2, 4, ___, 8)";
                        guide["Lựa chọn"] = "BỎ TRỐNG";
                        guide["Đáp án đúng"] = "Nhập giá trị cần điền. Nếu có nhiều chỗ trống thì ngăn cách bằng dấu phẩy";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Dãy số", "Mức độ khó": "Khó",
                            "Loại câu hỏi": type, "Câu hỏi": "2, 4, ___, 8, 10", "Lựa chọn": "",
                            "Đáp án đúng": "6", "Lời giải chi tiết": "Mỗi số cách nhau 2 đơn vị"
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 3", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Dãy số", "Mức độ khó": "Cực khó",
                            "Loại câu hỏi": type, "Câu hỏi": "1, 2, 4, 7, ___", "Lựa chọn": "",
                            "Đáp án đúng": "11", "Lời giải chi tiết": "Khoảng cách tăng dần: +1, +2, +3, +4"
                        };
                        break;
                    case 'Kéo thả':
                        guide["Câu hỏi"] = "Ghi câu hỏi, dùng ___ (3 gạch dưới) cho những chỗ cần kéo thả từ vào";
                        guide["Lựa chọn"] = "Nhập tất cả các từ khóa cần dùng (ngăn cách bằng phẩy). Có thể nhập từ khóa dư thừa để gây nhiễu";
                        guide["Đáp án đúng"] = "Nhập các từ ĐÚNG, theo đúng thứ tự các chỗ trống, ngăn cách bằng dấu phẩy";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Từ ngữ", "Mức độ khó": "Khó",
                            "Loại câu hỏi": type, "Câu hỏi": "Con chó sủa ___ ___, con mèo kêu ___ ___.", "Lựa chọn": "gâu, meo, quác, chiếp",
                            "Đáp án đúng": "gâu, gâu, meo, meo", "Lời giải chi tiết": ""
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Mức độ khó": "Trung bình",
                            "Loại câu hỏi": type, "Câu hỏi": "2 + 3 = ___. 4 + 1 = ___.", "Lựa chọn": "5, 6, 7",
                            "Đáp án đúng": "5, 5", "Lời giải chi tiết": ""
                        };
                        break;
                    case 'Đối chiếu trùng khớp':
                        guide["Câu hỏi"] = "Nội dung yêu cầu (VD: Hãy nối các từ có nghĩa giống nhau)";
                        guide["Lựa chọn"] = "Phân tách Cột Trái và Cột Phải bằng ký tự |. Các ô mỗi bên ngăn cách bằng dấu phẩy (Tối đa 5 ô mỗi bên). VD: Mèo, Chó | Gâu gâu, Meo meo";
                        guide["Đáp án đúng"] = "Ghi các cặp đáp án, mỗi cặp nối với nhau bằng dấu : (hai chấm). Các cặp ngăn cách bằng dấu phẩy. VD: Mèo:Meo meo, Chó:Gâu gâu";
                        
                        sample1 = {
                            "Cấp lớp": "Lớp 1", "Môn học": "Tiếng Việt", "Học kỳ": "Học kỳ 1", "Chủ đề": "Từ ngữ", "Mức độ khó": "Trung bình",
                            "Loại câu hỏi": type, "Câu hỏi": "Nối con vật với tiếng kêu của nó", "Lựa chọn": "Mèo, Chó, Bò | Rống, Gâu gâu, Meo meo",
                            "Đáp án đúng": "Mèo:Meo meo, Chó:Gâu gâu, Bò:Rống", "Lời giải chi tiết": ""
                        };
                        sample2 = {
                            "Cấp lớp": "Lớp 2", "Môn học": "Toán", "Học kỳ": "Học kỳ 1", "Chủ đề": "Phép cộng", "Mức độ khó": "Khó",
                            "Loại câu hỏi": type, "Câu hỏi": "Nối phép tính với kết quả đúng", "Lựa chọn": "2+3, 4+5, 1+1 | 9, 2, 5",
                            "Đáp án đúng": "2+3:5, 4+5:9, 1+1:2", "Lời giải chi tiết": ""
                        };
                        break;
                }
                
                data.push(guide);
                data.push(divider("--- CÁC VÍ DỤ MẪU (BẠN CÓ THỂ XÓA/SỬA CÁC DÒNG NÀY ĐỂ NHẬP CÂU HỎI MỚI) ---"));
                data.push(sample1);
                data.push(sample2);
            }
            
            data.push(divider("--- DANH SÁCH CÁC CHỦ ĐỀ HỢP LỆ THEO TỪNG MÔN/LỚP (DÙNG ĐỂ THAM KHẢO) ---"));

            for (let i = 1; i <= 5; i++) {
                const t = app.constants.topics[String(i)];
                if (t) {
                    const mathTopics = [...(t.math.hk1 || []), ...(t.math.hk2 || [])].join(", ");
                    const vietTopics = [...(t.vietnamese.hk1 || []), ...(t.vietnamese.hk2 || [])].join(", ");
                    data.push({
                        "Cấp lớp": "LỚP " + i,
                        "Môn học": "TOÁN",
                        "Học kỳ": "",
                        "Chủ đề": mathTopics,
                        "Mức độ khó": "", "Loại câu hỏi": "", "Câu hỏi": "", "Lựa chọn": "", "Đáp án đúng": "", "Lời giải chi tiết": ""
                    });
                    data.push({
                        "Cấp lớp": "LỚP " + i,
                        "Môn học": "TIẾNG VIỆT",
                        "Học kỳ": "",
                        "Chủ đề": vietTopics,
                        "Mức độ khó": "", "Loại câu hỏi": "", "Câu hỏi": "", "Lựa chọn": "", "Đáp án đúng": "", "Lời giải chi tiết": ""
                    });
                }
            }

            const fileName = type ? \`Mau_Nhap_\${type.replace(/[\\/\\s]/g, '_')}.xlsx\` : "Mau_Nhap_Cau_Hoi.xlsx";
            app.ui.exportToExcel(data, fileName);
        }`;
    
    code = code.replace(regex, newFunc);
    fs.writeFileSync('src/main.js', code, 'utf8');
    console.log("Success replacing downloadQTemplate");
} else {
    console.log("Regex did not match");
}
