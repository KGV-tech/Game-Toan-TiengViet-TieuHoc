-- =================================================================================
-- SCRIPT CẬP NHẬT DATABASE GAME LỚP 5 (VERSION 2.0 - NHIỆM VỤ & GACHA)
-- =================================================================================

-- 1. Bảng game_quests: Lưu các nhiệm vụ do Admin tạo
CREATE TABLE IF NOT EXISTS game_quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    target_subject TEXT NOT NULL, -- 'math', 'vietnamese', or 'any'
    target_score INT DEFAULT 80,
    target_count INT DEFAULT 1,
    reward_lollipops INT DEFAULT 10,
    assign_type TEXT DEFAULT 'all', -- 'all', 'class', 'user'
    assign_target TEXT DEFAULT '', -- Tên lớp hoặc Tên user nếu có
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Bật Realtime cho game_quests
ALTER PUBLICATION supabase_realtime ADD TABLE game_quests;

-- Policies cho game_quests
ALTER TABLE game_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc nhiệm vụ" ON game_quests FOR SELECT USING (true);
CREATE POLICY "Cho phép admin tạo nhiệm vụ" ON game_quests FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép admin sửa nhiệm vụ" ON game_quests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép admin xoá nhiệm vụ" ON game_quests FOR DELETE USING (true);


-- 2. Bảng user_quests: Lưu tiến trình làm nhiệm vụ của học sinh
CREATE TABLE IF NOT EXISTS user_quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_username TEXT NOT NULL,
    quest_id UUID REFERENCES game_quests(id) ON DELETE CASCADE,
    progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_username, quest_id)
);

ALTER PUBLICATION supabase_realtime ADD TABLE user_quests;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc tiến trình nhiệm vụ" ON user_quests FOR SELECT USING (true);
CREATE POLICY "Cho phép tạo tiến trình nhiệm vụ" ON user_quests FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép sửa tiến trình nhiệm vụ" ON user_quests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép xoá tiến trình nhiệm vụ" ON user_quests FOR DELETE USING (true);


-- 3. Bảng candy_requests: Lưu yêu cầu đổi kẹo thật của học sinh
CREATE TABLE IF NOT EXISTS candy_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_username TEXT NOT NULL,
    amount INT NOT NULL, -- Số lượng kẹo ảo muốn đổi (VD: 100)
    candy_count INT NOT NULL, -- Số lượng kẹo thật tương ứng (VD: 1)
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER PUBLICATION supabase_realtime ADD TABLE candy_requests;
ALTER TABLE candy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc yêu cầu đổi kẹo" ON candy_requests FOR SELECT USING (true);
CREATE POLICY "Cho phép tạo yêu cầu đổi kẹo" ON candy_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép sửa yêu cầu đổi kẹo" ON candy_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép xoá yêu cầu đổi kẹo" ON candy_requests FOR DELETE USING (true);


-- 4. Bảng user_pets: Lưu danh sách thú cưng học sinh đã quay trúng
CREATE TABLE IF NOT EXISTS user_pets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_username TEXT NOT NULL,
    pet_name TEXT NOT NULL,
    pet_image TEXT NOT NULL,
    rarity TEXT DEFAULT 'common',
    obtained_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER PUBLICATION supabase_realtime ADD TABLE user_pets;
ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc thú cưng" ON user_pets FOR SELECT USING (true);
CREATE POLICY "Cho phép thêm thú cưng" ON user_pets FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép sửa thú cưng" ON user_pets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép xoá thú cưng" ON user_pets FOR DELETE USING (true);
