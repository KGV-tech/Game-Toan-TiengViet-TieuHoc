import math
import os
from PIL import Image, ImageDraw, ImageFont

# ========================================================
# 1. CÁC THÔNG SỐ BẠN CÓ THỂ TỰ ĐIỀU CHỈNH Ở ĐÂY
# ========================================================

# ĐỘ XOAY (TÍNH BẰNG ĐỘ): 
# - Nếu chữ bị lệch so với ô màu, hãy tăng hoặc giảm số này.
# - Ví dụ: 10, 5, -5, -10...
OFFSET_DEG = 17 

# KHOẢNG CÁCH TỪ TÂM RA CHỮ (Tỷ lệ so với chiều rộng ảnh):
# - 0.28 nghĩa là 28%. Tăng lên 0.30 chữ sẽ lùi ra rìa, giảm xuống 0.25 chữ sẽ thụt vào tâm.
DISTANCE_FROM_CENTER_RATIO = 0.28 

# KÍCH THƯỚC CHỮ (Tỷ lệ so với chiều rộng ảnh):
# - 0.035 nghĩa là 3.5%. Tăng lên 0.04 chữ sẽ to ra.
FONT_SIZE_RATIO = 0.035 

# DANH SÁCH NỘI DUNG 10 Ô (Bắt đầu từ ô ở vị trí 12h, theo chiều kim đồng hồ):
# - Mỗi ô có 2 dòng (Dòng trên, Dòng dưới).
TEXTS_FOR_SLICE = [
    ("Tặng", "1 kẹo"),        # Ô số 0 (Khoảng 12 giờ)
    ("Tặng", "2 kẹo"),        # Ô số 1 
    ("Tặng", "Thú Cưng"),     # Ô số 2 
    ("May mắn", "lần sau"),   # Ô số 3 
    ("Quay", "lại"),          # Ô số 4 
    ("Tặng", "5 kẹo"),        # Ô số 5 
    ("May mắn", "lần sau"),   # Ô số 6 
    ("Tặng", "1 kẹo"),          # Ô số 7 
    ("May mắn", "lần sau"),   # Ô số 8 
    ("Quay", "lại")         # Ô số 9 
]

# ========================================================
# 2. PHẦN CODE XỬ LÝ ĐỒ HỌA (KHÔNG CẦN CHỈNH SỬA)
# ========================================================

def add_text():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    img_path = os.path.join(current_dir, 'base_wheel.png')
    out_path = os.path.join(current_dir, 'output_wheel.png')
    
    if not os.path.exists(img_path):
        print("LỖI: Không tìm thấy file base_wheel.png")
        return

    print("Đang xử lý ảnh...")
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    cx, cy = width / 2, height / 2
    
    try:
        font = ImageFont.truetype("arialbd.ttf", int(width * FONT_SIZE_RATIO))
    except:
        print("Không tìm thấy Font Arial Bold. Sử dụng font mặc định.")
        font = ImageFont.load_default()
        
    text_overlay = Image.new('RGBA', img.size, (0,0,0,0))
    
    for i in range(10):
        line1, line2 = TEXTS_FOR_SLICE[i]
        angle_deg = i * 36 + 18 + OFFSET_DEG
        
        full_txt = Image.new('RGBA', img.size, (0,0,0,0))
        d_full = ImageDraw.Draw(full_txt)
        
        dist_from_center = width * DISTANCE_FROM_CENTER_RATIO
        draw_x = cx + dist_from_center
        
        def get_text_size(txt):
            return d_full.textsize(txt, font=font) if hasattr(d_full, 'textsize') else (font.getlength(txt), font.size)
        
        w1, h1 = get_text_size(line1)
        w2, h2 = get_text_size(line2)
        
        line_spacing = h1 * 0.1
        total_h = h1 + h2 + line_spacing
        
        draw_y1 = cy - total_h/2
        draw_y2 = draw_y1 + h1 + line_spacing
        
        x1 = draw_x - w1/2
        x2 = draw_x - w2/2
        
        shadow_color = (0, 0, 0, 255)
        text_color = (255, 255, 255, 255)
        
        # Shadow
        offset = 2
        d_full.text((x1+offset, draw_y1+offset), line1, font=font, fill=shadow_color)
        d_full.text((x2+offset, draw_y2+offset), line2, font=font, fill=shadow_color)
        
        # Outline
        outline = (0, 0, 0, 255)
        d_full.text((x1-1, draw_y1-1), line1, font=font, fill=outline)
        d_full.text((x1+1, draw_y1-1), line1, font=font, fill=outline)
        d_full.text((x1-1, draw_y1+1), line1, font=font, fill=outline)
        d_full.text((x1+1, draw_y1+1), line1, font=font, fill=outline)
        d_full.text((x2-1, draw_y2-1), line2, font=font, fill=outline)
        d_full.text((x2+1, draw_y2-1), line2, font=font, fill=outline)
        d_full.text((x2-1, draw_y2+1), line2, font=font, fill=outline)
        d_full.text((x2+1, draw_y2+1), line2, font=font, fill=outline)
        
        # Main text
        d_full.text((x1, draw_y1), line1, font=font, fill=text_color)
        d_full.text((x2, draw_y2), line2, font=font, fill=text_color)
        
        rotated_full = full_txt.rotate(90 - angle_deg, resample=Image.BICUBIC, center=(cx, cy))
        text_overlay = Image.alpha_composite(text_overlay, rotated_full)

    final_img = Image.alpha_composite(img, text_overlay)
    final_img.save(out_path)
    print(f"XONG! Đã lưu ảnh mới tại: {out_path}")

if __name__ == '__main__':
    add_text()
