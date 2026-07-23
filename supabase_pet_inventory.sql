-- Chạy một lần trên Supabase SQL Editor cho database đang sử dụng.
-- Tạo tồn kho thú cưng dùng chung cho toàn bộ học sinh.
CREATE TABLE IF NOT EXISTS pet_inventory (
    pet_id TEXT PRIMARY KEY,
    remaining INT NOT NULL CHECK (remaining >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

INSERT INTO pet_inventory (pet_id, remaining) VALUES
    ('pet_1', 8), ('pet_2', 8), ('pet_3', 8), ('pet_4', 8), ('pet_5', 8),
    ('pet_6', 8), ('pet_7', 8), ('pet_8', 8), ('pet_9', 8), ('pet_10', 8),
    ('pet_dragon', 5)
ON CONFLICT (pet_id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE pet_inventory;

ALTER TABLE pet_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc tồn kho thú cưng" ON pet_inventory FOR SELECT USING (true);
CREATE POLICY "Cho phép cập nhật tồn kho thú cưng" ON pet_inventory FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép tạo tồn kho thú cưng" ON pet_inventory FOR INSERT WITH CHECK (true);
