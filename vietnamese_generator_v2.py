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

# Rich vocabulary mapped roughly to themes
vocab_theme = {
    "family": [("gia đình", "tổ ấm", "ngôi nhà chung"), ("yêu thương", "chăm sóc", "đùm bọc"), ("ông bà", "cha mẹ", "anh chị em")],
    "school": [("thầy cô", "bạn bè", "sách vở"), ("ngôi trường", "lớp học", "sân chơi"), ("chăm chỉ", "học tập", "tiến bộ")],
    "nature": [("cây xanh", "chim chóc", "bầu trời"), ("mặt trời", "biển cả", "núi non"), ("trong lành", "mát mẻ", "rực rỡ")],
    "country": [("quê hương", "đất nước", "lịch sử"), ("tự hào", "bảo vệ", "phát triển"), ("truyền thống", "văn hóa", "con người")]
}

proverbs = [
    ("Lá lành đùm lá rách", "Yêu thương, giúp đỡ lẫn nhau"),
    ("Uống nước nhớ nguồn", "Biết ơn người đi trước"),
    ("Có công mài sắt có ngày nên kim", "Kiên trì, nhẫn nại"),
    ("Tôn sư trọng đạo", "Kính trọng thầy cô"),
    ("Gần mực thì đen, gần đèn thì rạng", "Ảnh hưởng của môi trường sống")
]

def write_csv(filename, data):
    headers = ["Cấp lớp", "Môn học", "Học kỳ", "Chủ đề", "Loại câu hỏi", "Câu hỏi", "Lựa chọn", "Đáp án đúng", "Lời giải chi tiết"]
    with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in data:
            writer.writerow(row)

def get_theme(topic):
    topic = topic.lower()
    if "gia đình" in topic or "nhà" in topic or "bạn" in topic: return "family"
    if "trường" in topic or "học" in topic: return "school"
    if "thiên nhiên" in topic or "xanh" in topic or "màu" in topic: return "nature"
    if "quê" in topic or "nước" in topic or "việt nam" in topic: return "country"
    return random.choice(["family", "school", "nature", "country"])

def gen_vietnamese(grade, diff, qtype, topic):
    theme = get_theme(topic)
    words = random.choice(vocab_theme[theme])
    word = random.choice(words)
    prov = random.choice(proverbs)
    
    q, opts, ans, exp = "", "", "", ""
    
    # 1. Trắc nghiệm
    if qtype == "Trắc nghiệm":
        if diff == "Dễ":
            if int(grade) <= 2:
                q = f"Từ nào sau đây viết đúng chính tả?"
                correct = word
                wrong_words = [word.replace("tr", "ch").replace("s", "x"), word.replace("l", "n").replace("r", "d"), word + " x"]
                opts = f"{correct} | {wrong_words[0]} | {wrong_words[1]} | {wrong_words[2]}"
                ans = correct
                exp = f"'{correct}' là cách viết đúng chính tả."
            else:
                q = f"Từ nào đồng nghĩa với từ '{word}'?"
                correct = words[(words.index(word) + 1) % len(words)]
                opts = f"{correct} | lười biếng | độc ác | phá hoại"
                ans = correct
                exp = f"'{correct}' và '{word}' có nghĩa gần giống nhau."
        else:
            if int(grade) <= 3:
                q = f"Trong câu: 'Mùa xuân, {word} thật đẹp.', từ '{word}' thuộc từ loại gì?"
                ans = "Danh từ"
                opts = "Danh từ | Động từ | Tính từ | Đại từ"
                exp = f"'{word}' chỉ sự vật/hiện tượng nên là danh từ."
            else:
                q = f"Câu tục ngữ '{prov[0]}' khuyên chúng ta điều gì?"
                ans = prov[1]
                opts = f"{prov[1]} | Lười biếng | Ích kỷ | Vô ơn"
                exp = f"Ý nghĩa: {prov[1]}."
                
    # 2. Điền khuyết
    elif qtype == "Điền khuyết":
        if diff == "Dễ":
            q = f"Điền từ thích hợp: Mỗi ngày đến trường là một ngày ___."
            ans = "vui"
            exp = "Thành ngữ quen thuộc về mái trường."
        else:
            q = f"Điền từ còn thiếu vào câu tục ngữ: {prov[0].replace(prov[0].split()[-1], '___')}"
            ans = prov[0].split()[-1]
            exp = f"Câu hoàn chỉnh: {prov[0]}"

    # 3. Đúng/Sai
    elif qtype == "Đúng/Sai":
        correct = random.choice([True, False])
        if int(grade) <= 3:
            check_sentence = f"Mọi người trong {word} luôn yêu thương nhau." if correct else f"Mọi người trong {word} luôn ghét bỏ nhau."
            q = f"Câu văn sau có ý nghĩa phù hợp: '{check_sentence}', đúng hay sai?"
            ans = "Đúng" if correct else "Sai"
            exp = "Ý nghĩa câu phải logic và tích cực."
        else:
            if correct:
                q = f"Từ '{word}' là một từ ghép, đúng hay sai?"
                ans = "Đúng" if len(word.split()) > 1 else "Sai"
                exp = "Từ ghép gồm các tiếng có nghĩa."
            else:
                q = f"Thành phần chủ ngữ trong câu 'Hôm nay, {word} rất đẹp' là 'Hôm nay', đúng hay sai?"
                ans = "Sai"
                exp = "Chủ ngữ là '{word}', 'Hôm nay' là trạng ngữ."

    # 4. Kéo thả
    elif qtype == "Kéo thả":
        if diff == "Dễ":
            q = f"Kéo từ '{word}' vào ô thích hợp: Em rất yêu ___ của mình."
            ans = word
            opts = f"{word} | cục đá | bão táp"
            exp = "Phù hợp ngữ cảnh."
        else:
            part1 = prov[0].split()[:len(prov[0].split())//2]
            part2 = prov[0].split()[len(prov[0].split())//2:]
            q = f"Kéo thả để ghép đúng câu: {' '.join(part1)} ___."
            ans = ' '.join(part2)
            opts = f"{' '.join(part2)} | thì sẽ thất bại | không cần ai"
            exp = f"Câu hoàn chỉnh: {prov[0]}"
            
    # Clean up empty opts for Điền khuyết / Đúng sai if needed
    if qtype in ["Điền khuyết", "Đúng/Sai"]: opts = ""
        
    return [q, opts, ans, exp]


output_dir = "KhoCauHoi_Excel"
for grade in ["1", "2", "3", "4", "5"]:
    data = []
    filename = f"{output_dir}/Tiếng Việt_Lop{grade}.csv"
    
    qtypes = ["Trắc nghiệm", "Điền khuyết", "Đúng/Sai", "Kéo thả"]
    
    for hk in ["hk1", "hk2"]:
        if hk in topics[grade]:
            for topic in topics[grade][hk]:
                for qtype in qtypes:
                    for _ in range(5):
                        q_data_ez = gen_vietnamese(grade, "Dễ", qtype, topic)
                        q_data_hd = gen_vietnamese(grade, "Khó", qtype, topic)
                        
                        row_ez = [f"Lớp {grade}", "Tiếng Việt", "Học kỳ 1" if hk == "hk1" else "Học kỳ 2", topic, qtype] + q_data_ez
                        row_hd = [f"Lớp {grade}", "Tiếng Việt", "Học kỳ 1" if hk == "hk1" else "Học kỳ 2", topic, qtype] + q_data_hd
                        data.append(row_ez)
                        data.append(row_hd)
    
    if data:
        random.shuffle(data)
        write_csv(filename, data)
        print(f"Created {filename}")
