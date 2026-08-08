-- CẤU HÌNH TÀI KHOẢN ADMIN DÙNG ĐỂ KIỂM THỬ GIAO DIỆN
-- Chạy một lần trong Supabase SQL Editor của ĐÚNG dự án, sau supabase_auth_security.sql.
-- Lệnh chỉ cập nhật các hồ sơ đã có role = admin; không tạo tài khoản Auth mới và không đụng đến học sinh.

UPDATE public.game_users
SET
  avatar_key = 'teacher-female',
  lollipops = GREATEST(COALESCE(lollipops, 0), 1000)
WHERE lower(trim(COALESCE(role, ''))) = 'admin';
