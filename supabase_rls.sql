-- Bật Row Level Security cho các bảng
ALTER TABLE game_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Tạo Policy cho game_users
-- Bất kỳ ai cũng có thể thêm mới user (khi đăng ký)
CREATE POLICY "Cho phép đăng ký" ON game_users FOR INSERT WITH CHECK (true);
-- Mọi người có thể đọc dữ liệu user (để hiện danh sách đua top)
CREATE POLICY "Cho phép xem users" ON game_users FOR SELECT USING (true);
-- Users có thể cập nhật trạng thái (thông qua ứng dụng)
CREATE POLICY "Cho phép cập nhật user" ON game_users FOR UPDATE USING (true) WITH CHECK (true); 
-- Admin mới được xoá (Chặn hoàn toàn hành động xoá từ user thông thường bằng cách không cấp policy DELETE)
-- Để đơn giản trong kiến trúc hiện tại, chúng ta không dùng Policy Delete cho anon key.

-- Tạo Policy cho game_questions & game_exams
CREATE POLICY "Cho phép đọc câu hỏi" ON game_questions FOR SELECT USING (true);
CREATE POLICY "Cho phép cập nhật câu hỏi" ON game_questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép thêm câu hỏi" ON game_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép xoá câu hỏi" ON game_questions FOR DELETE USING (true);
-- (Lưu ý: Do dự án chưa dùng Supabase Auth, nên các thao tác Thêm/Sửa/Xoá vẫn mở cho anon key nhưng chỉ được truy cập qua giao diện đã ẩn đi với học sinh)

CREATE POLICY "Cho phép đọc đề thi" ON game_exams FOR SELECT USING (true);
CREATE POLICY "Cho phép cập nhật đề thi" ON game_exams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép thêm đề thi" ON game_exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép xoá đề thi" ON game_exams FOR DELETE USING (true);

-- Policy cho game_settings
CREATE POLICY "Cho phép đọc cài đặt" ON game_settings FOR SELECT USING (true);
CREATE POLICY "Cho phép cập nhật cài đặt" ON game_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Cho phép thêm cài đặt" ON game_settings FOR INSERT WITH CHECK (true);
