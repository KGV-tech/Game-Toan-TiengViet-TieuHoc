-- Chạy một lần trên Supabase SQL Editor cho database đang sử dụng.
-- Lưu câu hỏi đã gặp theo từng học sinh, để đổi máy vẫn ưu tiên câu mới.
CREATE TABLE IF NOT EXISTS user_question_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_username TEXT NOT NULL,
    question_key TEXT NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_username, question_key)
);

ALTER PUBLICATION supabase_realtime ADD TABLE user_question_history;

ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc lịch sử câu hỏi đã gặp" ON user_question_history FOR SELECT USING (true);
CREATE POLICY "Cho phép tạo lịch sử câu hỏi đã gặp" ON user_question_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép cập nhật lịch sử câu hỏi đã gặp" ON user_question_history FOR UPDATE USING (true) WITH CHECK (true);
