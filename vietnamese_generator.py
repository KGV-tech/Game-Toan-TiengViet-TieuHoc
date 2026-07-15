import csv
import random
import os

topics = {
    "1": {
        "hk2": ['1. Tôi và các bạn', '2. Mái ấm gia đình', '3. Mái trường mến yêu', '4. Điều em cần biết', '5. Bài học từ cuộc sống', '6. Thiên nhiên kỳ thú', '7. Thế giới trong mắt em', '8. Đất nước và con người']
    },
    "2": {
        "hk1": ['1. Em lớn lên từng ngày', '2. Đi học vui sao', '3. Niềm vui tuổi thơ', '4. Mái ấm gia đình'],
        "hk2": ['5. Vẻ đẹp quanh em', '6. Hành tinh xanh của em', '7. Giao tiếp và kết nối', '8. Con người Việt Nam', '9. Việt Nam quê hương em']
    },
    "3": {
        "hk1": ['1. Những trải nghiệm thú vị', '2. Cổng trường rộng mở', '3. Mái nhà yêu thương', '4. Cộng đồng gắn bó'],
        "hk2": ['5. Những sắc màu thiên nhiên', '6. Bài học từ cuộc sống', '7. Đất nước ngàn năm', '8. Trái Đất của chúng mình']
    },
    "4": {
        "hk1": ['1. Mỗi người một vẻ', '2. Trải nghiệm và khám phá', '3. Niềm vui sáng tạo', '4. Chắp cánh ước mơ'],
        "hk2": ['5. Sống để yêu thương', '6. Uống nước nhớ nguồn', '7. Quê hương trong tôi', '8. Vì một thế giới bình yên']
    },
    "5": {
        "hk1": ['1. Thế giới tuổi thơ', '2. Thiên nhiên kì thú', '3. Trên con đường học tập', '4. Nghệ thuật muôn màu'],
        "hk2": ['5. Vẻ đẹp cuộc sống', '6. Hương sắc trăm miền', '7. Tiếp bước cha ông', '8. Thế giới của chúng ta']
    }
}

vocab = {
    "1": [("bạn bè", "những người cùng học, cùng chơi"), ("gia đình", "tổ ấm yêu thương"), ("trường học", "nơi em học tập"), ("thiên nhiên", "cây cối, chim chóc")],
    "2": [("chăm chỉ", "trái nghĩa với lười biếng"), ("dũng cảm", "không sợ nguy hiểm"), ("thật thà", "luôn nói đúng sự thật"), ("vui vẻ", "tâm trạng thoải mái")],
    "3": [("đoàn kết", "cùng chung sức làm việc"), ("cộng đồng", "tập thể những người cùng sống"), ("quê hương", "nơi ta sinh ra và lớn lên"), ("bảo vệ", "giữ gìn không để bị hỏng")],
    "4": [("sáng tạo", "tạo ra những cái mới"), ("ước mơ", "điều mong muốn đạt được"), ("khám phá", "tìm ra điều chưa biết"), ("bình yên", "không có chiến tranh")],
    "5": [("nhân đạo", "tình yêu thương con người"), ("phát triển", "ngày càng tiến bộ hơn"), ("hòa bình", "trạng thái không có chiến tranh"), ("tự hào", "hãnh diện về điều tốt đẹp")]
}

def write_csv(filename, data):
    headers = ["Cấp lớp", "Môn học", "Học kỳ", "Chủ đề", "Mức độ khó", "Loại câu hỏi", "Câu hỏi", "Lựa chọn", "Đáp án đúng", "Lời giải chi tiết"]
    with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in data:
            writer.writerow(row)

def gen_vietnamese(grade, diff, qtype, topic):
    pair = random.choice(vocab[grade])
    word, meaning = pair[0], pair[1]
    
    q, opts, ans, exp = "", "", "", ""
    
    # Generate variations
    if qtype == "Trắc nghiệm":
        if diff == "Dễ":
            q = f"Từ '{word}' có nghĩa là gì?"
            opts = f"{meaning}, từ chỉ màu sắc, từ chỉ âm thanh, từ chỉ con vật"
            ans = meaning
            exp = f"'{word}' mang ý nghĩa: {meaning}."
        else:
            q = f"Trong các từ sau, từ nào là từ ghép?"
            words = [word, "ầm ĩ", "lung linh", "lấp lánh"]
            random.shuffle(words)
            opts = ", ".join(words)
            ans = word
            exp = f"Từ ghép là từ tạo bởi các tiếng có nghĩa. Các từ còn lại là từ láy."
            
    elif qtype == "Điền khuyết":
        if diff == "Dễ":
            q = f"Điền từ thích hợp: Ngôi trường là nơi nuôi dưỡng ___ của em."
            ans = "ước mơ" if grade in ["4", "5"] else "tâm hồn"
            exp = "Ngữ cảnh phù hợp."
        else:
            q = f"Điền ch hay tr: Cô giáo kể chuyện cổ ___."
            ans = "tích" # Wait, ch/tr
            q = f"Điền ch hay tr: Mái ___ường mến yêu."
            ans = "tr"
            exp = "trường học dùng 'tr'."
            
    elif qtype == "Đúng/Sai":
        correct = random.choice([True, False])
        if correct:
            q = f"Câu 'Mùa xuân đến, trăm hoa đua nở.' là câu đơn, đúng hay sai?"
            ans = "Đúng" if diff=="Dễ" else "Sai" # It has 2 clauses? Mùa xuân đến (C-V), trăm hoa đua nở (C-V) -> Sai
            ans = "Sai"
            exp = "Đây là câu ghép."
        else:
            q = f"Từ 'sáng xủa' viết đúng chính tả, đúng hay sai?"
            ans = "Sai"
            exp = "Viết đúng là 'sáng sủa'."
            
    elif qtype == "Kéo thả":
        q = f"Kéo thả từ thích hợp: Lá lành đùm lá ___."
        ans = "rách"
        opts = "rách, nát, nguyên"
        exp = "Thành ngữ: Lá lành đùm lá rách."
        
    return [q, opts, ans, exp]


output_dir = "KhoCauHoi_Excel"
for grade in ["1", "2", "3", "4", "5"]:
    for diff in ["Dễ", "Khó"]:
        data = []
        filename = f"{output_dir}/Tiếng Việt_Lop{grade}_{diff}.csv"
        
        qtypes = ["Trắc nghiệm", "Điền khuyết", "Đúng/Sai", "Kéo thả"]
        
        for hk in ["hk1", "hk2"]:
            if hk in topics[grade]:
                for topic in topics[grade][hk]:
                    for qtype in qtypes:
                        for _ in range(5):
                            q_data = gen_vietnamese(grade, diff, qtype, topic)
                            row = [f"Lớp {grade}", "Tiếng Việt", "Học kỳ 1" if hk == "hk1" else "Học kỳ 2", topic, diff, qtype] + q_data
                            data.append(row)
        
        if data:
            write_csv(filename, data)
            print(f"Created {filename}")
