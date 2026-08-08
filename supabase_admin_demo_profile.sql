-- CẤU HÌNH TÀI KHOẢN ADMIN DÙNG ĐỂ KIỂM THỬ GIAO DIỆN
-- Có thể chạy cả khi migration bảo mật chưa tạo cột avatar_key.
-- Lệnh chỉ cập nhật các hồ sơ đã có role = admin; không tạo tài khoản Auth mới và không đụng đến học sinh.

ALTER TABLE public.game_users ADD COLUMN IF NOT EXISTS avatar_key TEXT;

UPDATE public.game_users
SET
  avatar_key = 'teacher-female',
  lollipops = GREATEST(COALESCE(lollipops, 0), 1000)
WHERE lower(trim(COALESCE(role, ''))) = 'admin';
