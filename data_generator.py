import csv
import random
import re
import os

# Definition of topics
topics = {
    "1": {
        "math": {
            "hk1": ['1. Các số từ 0 đến 10', '2. Làm quen với một số hình phẳng', '3. Phép cộng, phép trừ trong phạm vi 10', '4. Làm quen với một số hình khối', '5. Ôn tập Học kì 1'],
            "hk2": ['6. Các số đến 100', '7. Độ dài và Đo độ dài', '8. Phép cộng, phép trừ (không nhớ) trong phạm vi 100', '9. Thời gian. Giờ và lịch', '10. Ôn tập cuối năm']
        },
        "vietnamese": {
            "hk1": [], # Skip hk1
            "hk2": ['1. Tôi và các bạn', '2. Mái ấm gia đình', '3. Mái trường mến yêu', '4. Điều em cần biết', '5. Bài học từ cuộc sống', '6. Thiên nhiên kỳ thú', '7. Thế giới trong mắt em', '8. Đất nước và con người']
        }
    },
    "2": {
        "math": {
            "hk1": ['1. Ôn tập và bổ sung', '2. Phép cộng, phép trừ trong phạm vi 20', '3. Làm quen với khối lượng, dung tích', '4. Phép cộng, phép trừ (có nhớ) trong phạm vi 100', '5. Làm quen với hình phẳng', '6. Ngày - Giờ, Giờ - Phút, Ngày - Tháng', '7. Ôn tập Học kì 1'],
            "hk2": ['8. Phép nhân, phép chia', '9. Làm quen với hình khối', '10. Các số trong phạm vi 1 000', '11. Độ dài và đơn vị đo độ dài, tiền Việt Nam', '12. Phép cộng, phép trừ trong phạm vi 1 000', '13. Làm quen với yếu tố thống kê, xác suất', '14. Ôn tập cuối năm']
        },
        "vietnamese": {
            "hk1": ['1. Em lớn lên từng ngày', '2. Đi học vui sao', '3. Niềm vui tuổi thơ', '4. Mái ấm gia đình'],
            "hk2": ['5. Vẻ đẹp quanh em', '6. Hành tinh xanh của em', '7. Giao tiếp và kết nối', '8. Con người Việt Nam', '9. Việt Nam quê hương em']
        }
    },
    "3": {
        "math": {
            "hk1": ['1. Ôn tập và bổ sung', '2. Bảng nhân, bảng chia', '3. Làm quen với hình phẳng, hình khối', '4. Phép nhân, phép chia trong phạm vi 100', '5. Một số đơn vị đo độ dài, khối lượng, dung tích, nhiệt độ', '6. Phép nhân, phép chia trong phạm vi 1 000', '7. Ôn tập Học kì 1'],
            "hk2": ['8. Các số đến 10 000', '9. Chu vi, diện tích một số hình phẳng', '10. Cộng, trừ, nhân, chia trong phạm vi 10 000', '11. Các số đến 100 000', '12. Cộng, trừ trong phạm vi 100 000', '13. Xem đồng hồ. Tháng - năm. Tiền Việt Nam', '14. Nhân, chia trong phạm vi 100 000', '15. Làm quen với yếu tố Thống kê, Xác suất', '16. Ôn tập cuối năm']
        },
        "vietnamese": {
            "hk1": ['1. Những trải nghiệm thú vị', '2. Cổng trường rộng mở', '3. Mái nhà yêu thương', '4. Cộng đồng gắn bó'],
            "hk2": ['5. Những sắc màu thiên nhiên', '6. Bài học từ cuộc sống', '7. Đất nước ngàn năm', '8. Trái Đất của chúng mình']
        }
    },
    "4": {
        "math": {
            "hk1": ['1. Ôn tập và bổ sung', '2. Góc và đơn vị đo góc', '3. Số có nhiều chữ số', '4. Một số đơn vị đo Đại lượng', '5. Phép cộng và phép trừ', '6. Đường thẳng vuông góc. Đường thẳng song song', '7. Ôn tập Học kì 1'],
            "hk2": ['8. Phép nhân và phép chia', '9. Làm quen với yếu tố Thống kê, Xác suất', '10. Phân số', '11. Phép cộng, phép trừ Phân số', '12. Phép nhân, phép chia Phân số', '13. Ôn tập cuối năm']
        },
        "vietnamese": {
            "hk1": ['1. Mỗi người một vẻ', '2. Trải nghiệm và khám phá', '3. Niềm vui sáng tạo', '4. Chắp cánh ước mơ'],
            "hk2": ['5. Sống để yêu thương', '6. Uống nước nhớ nguồn', '7. Quê hương trong tôi', '8. Vì một thế giới bình yên']
        }
    },
    "5": {
        "math": {
            "hk1": ['1. Ôn tập và bổ sung', '2. Số thập phân', '3. Một số đơn vị đo diện tích', '4. Các phép tính với số thập phân', '5. Một số hình phẳng. Chu vi và Diện tích', '6. Ôn tập Học kỳ 1'],
            "hk2": ['7. Tỉ số và các Bài toán liên quan', '8. Thể tích, đơn vị đo Thể tích', '9. Diện tích và Thể tích của một số hình khối', '10. Số đo Thời gian, Vận tốc. Các bài toán liên quan đến Chuyển động đều', '11. Một số yếu tố Thống kê và Xác suất', '12. Ôn tập cuối năm']
        },
        "vietnamese": {
            "hk1": ['1. Thế giới tuổi thơ', '2. Thiên nhiên kì thú', '3. Trên con đường học tập', '4. Nghệ thuật muôn màu'],
            "hk2": ['5. Vẻ đẹp cuộc sống', '6. Hương sắc trăm miền', '7. Tiếp bước cha ông', '8. Thế giới của chúng ta']
        }
    }
}

def write_csv(filename, data):
    headers = ["Cấp lớp", "Môn học", "Học kỳ", "Chủ đề", "Loại câu hỏi", "Câu hỏi", "Lựa chọn", "Đáp án đúng", "Lời giải chi tiết"]
    with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in data:
            writer.writerow(row)

def get_math_question(grade, diff, qtype, topic):
    max_val = 10 ** int(grade)
    if diff == 'Khó': max_val *= 2
    
    a = random.randint(1, max_val)
    b = random.randint(1, max_val)
    op = random.choice(['+', '-'])
    if op == '-' and a < b: a, b = b, a
    ans = a + b if op == '+' else a - b
    
    q = ""
    options = ""
    correct_ans = ""
    explanation = ""
    
    if qtype == "Trắc nghiệm":
        q = f"Kết quả của phép tính {a} {op} {b} là bao nhiêu?"
        opts = [ans, ans + random.randint(1, 5), ans - random.randint(1, 5), ans + 10]
        random.shuffle(opts)
        options = " | ".join(map(str, list(set(opts))[:4]))
        if str(ans) not in options: options = f"{ans} | " + " | ".join(map(str, list(set(opts))[:3]))
        correct_ans = str(ans)
        explanation = f"Ta có: {a} {op} {b} = {ans}."
    elif qtype == "Điền khuyết":
        q = f"{a} {op} ___ = {ans}"
        correct_ans = str(b)
        explanation = f"Số cần điền là {b} vì {a} {op} {b} = {ans}."
    elif qtype == "Đúng/Sai":
        is_correct = random.choice([True, False])
        fake_ans = ans if is_correct else ans + random.randint(1, 5)
        q = f"Phép tính {a} {op} {b} = {fake_ans}, đúng hay sai?"
        correct_ans = "Đúng" if is_correct else "Sai"
        explanation = f"Phép tính chính xác là {a} {op} {b} = {ans}."
    elif qtype == "So sánh":
        c = random.randint(1, max_val)
        d = random.randint(1, max_val)
        ans2 = c + d
        q = f"Điền dấu thích hợp (<, >, =): {a} {op} {b} ___ {c} + {d}"
        if ans < ans2: correct_ans = "<"
        elif ans > ans2: correct_ans = ">"
        else: correct_ans = "="
        explanation = f"{a} {op} {b} = {ans}; {c} + {d} = {ans2}. Nên dấu là {correct_ans}."
    elif qtype == "Chuỗi Quy luật":
        step = random.randint(2, 5)
        start = random.randint(1, 20)
        q = f"{start}, {start+step}, {start+2*step}, ___, {start+4*step}"
        correct_ans = str(start+3*step)
        explanation = f"Quy luật: cộng thêm {step} vào số liền trước."
    elif qtype == "Kéo thả":
        q = f"{a} {op} {b} = ___"
        correct_ans = str(ans)
        options = f"{ans} | {ans+1} | {ans-1}"
        explanation = f"Kéo số {ans} vào chỗ trống."
        
    return [q, options, correct_ans, explanation]

vietnamese_words = {
    "1": ["cái bàn", "ngôi trường", "bạn bè", "gia đình", "yêu thương", "chim hót", "cây xanh", "mặt trời", "biển cả", "dòng sông"],
    "2": ["xanh biếc", "chăm chỉ", "vui vẻ", "hạnh phúc", "thầy cô", "bầu trời", "gió thổi", "mưa rơi", "cánh đồng", "ngọn núi"],
    "3": ["đoàn kết", "cộng đồng", "thông minh", "dũng cảm", "quê hương", "đất nước", "lịch sử", "truyền thống", "tự hào", "niềm vui"],
    "4": ["ước mơ", "sáng tạo", "khám phá", "bình yên", "chia sẻ", "khoa học", "thiên văn", "nghệ sĩ", "bức tranh", "bài thơ"],
    "5": ["tự hào", "thiên nhiên", "nghệ thuật", "thế giới", "phát triển", "văn hóa", "nhân loại", "bảo vệ", "môi trường", "tương lai"]
}

def get_vietnamese_question(grade, diff, qtype, topic):
    word = random.choice(vietnamese_words[grade])
    word2 = random.choice(vietnamese_words[grade])
    while word == word2: word2 = random.choice(vietnamese_words[grade])
    
    q = ""
    options = ""
    correct_ans = ""
    explanation = ""
    
    if qtype == "Trắc nghiệm":
        q = f"Từ '{word}' đồng nghĩa với từ nào sau đây?"
        correct_ans = "Một từ đồng nghĩa hợp lý"
        options = f"{correct_ans} | {word2} | Từ khác 1 | Từ khác 2"
        explanation = f"Từ '{word}' mang ý nghĩa tương đồng với '{correct_ans}'."
    elif qtype == "Điền khuyết":
        q = f"Điền từ thích hợp vào chỗ trống: Quê hương em rất ___."
        correct_ans = word
        explanation = f"Từ '{word}' phù hợp ngữ cảnh."
    elif qtype == "Đúng/Sai":
        is_correct = random.choice([True, False])
        check_word = word if is_correct else word + "x"
        q = f"Từ '{check_word}' viết đúng chính tả, đúng hay sai?"
        correct_ans = "Đúng" if is_correct else "Sai"
        explanation = f"Từ viết đúng là '{word}'."
    elif qtype == "Kéo thả":
        q = f"Kéo từ '{word}' vào nhóm từ chỉ ___."
        correct_ans = "Đặc điểm"
        options = "Đặc điểm, Hoạt động, Sự vật"
        explanation = f"'{word}' là từ chỉ đặc điểm."
        
    return [q, options, correct_ans, explanation]

output_dir = "KhoCauHoi_Excel"
os.makedirs(output_dir, exist_ok=True)

for grade in ["1", "2", "3", "4", "5"]:
    for subject in ["math", "vietnamese"]:
        data = []
        subj_name = "Toán" if subject == "math" else "Tiếng Việt"
        filename = f"{output_dir}/{subj_name}_Lop{grade}.csv"
        
        # types
        qtypes = ["Trắc nghiệm", "Điền khuyết", "Đúng/Sai", "So sánh", "Chuỗi Quy luật", "Kéo thả"] if subject == "math" else ["Trắc nghiệm", "Điền khuyết", "Đúng/Sai", "Kéo thả"]
        
        for hk in ["hk1", "hk2"]:
            for topic in topics[grade][subject][hk]:
                for qtype in qtypes:
                    for _ in range(5):
                        if subject == "math":
                            q_data_ez = get_math_question(grade, "Dễ", qtype, topic)
                            q_data_hd = get_math_question(grade, "Khó", qtype, topic)
                        else:
                            q_data_ez = get_vietnamese_question(grade, "Dễ", qtype, topic)
                            q_data_hd = get_vietnamese_question(grade, "Khó", qtype, topic)
                        
                        row_ez = [f"Lớp {grade}", subj_name, "Học kỳ 1" if hk == "hk1" else "Học kỳ 2", topic, qtype] + q_data_ez
                        row_hd = [f"Lớp {grade}", subj_name, "Học kỳ 1" if hk == "hk1" else "Học kỳ 2", topic, qtype] + q_data_hd
                        data.append(row_ez)
                        data.append(row_hd)
        
        if data:
            random.shuffle(data)
            write_csv(filename, data)
            print(f"Created {filename} with {len(data)} questions.")

print("All files generated successfully.")
