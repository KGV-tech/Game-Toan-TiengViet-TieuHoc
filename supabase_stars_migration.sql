-- =====================================================================
-- MIGRATION: Đổi cơ chế "kẹo" (lollipops) thành "Sao" (stars)
--            + Năng lượng (tim) + Quà hằng ngày
-- ---------------------------------------------------------------------
-- CHỈ CHẠY MỘT LẦN trên Supabase SQL Editor cho ĐÚNG database đang dùng.
-- Chỉ chạy khi người phụ trách xác nhận đúng dự án đích.
-- Các câu lệnh dùng DO $$ để "idempotent": chạy lại không lỗi, không mất dữ liệu.
-- =====================================================================

-- 1. Đổi cột game_users.lollipops -> stars (giữ nguyên giá trị hiện có)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'game_users'
          AND column_name = 'lollipops'
    ) THEN
        ALTER TABLE public.game_users RENAME COLUMN lollipops TO stars;
    END IF;
END $$;

-- 2. Đổi cột game_quests.reward_lollipops -> reward_stars (giữ nguyên giá trị)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'game_quests'
          AND column_name = 'reward_lollipops'
    ) THEN
        ALTER TABLE public.game_quests RENAME COLUMN reward_lollipops TO reward_stars;
    END IF;
END $$;

-- 3. Thêm cột năng lượng (5 tim/ngày) + quà hằng ngày + chuỗi ngày liên tiếp
ALTER TABLE public.game_users
    ADD COLUMN IF NOT EXISTS energy INT NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS energy_date DATE,
    ADD COLUMN IF NOT EXISTS daily_gift_date DATE,
    ADD COLUMN IF NOT EXISTS daily_gift_streak INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_stars_earned INT NOT NULL DEFAULT 0;

-- 4. Bỏ tính năng "đổi kẹo thật" (candy_requests): xóa bảng.
--    Cảnh báo: thao tác xóa dữ liệu; chỉ chạy khi chắc chắn không cần giữ.
DROP TABLE IF EXISTS public.candy_requests;

-- LƯU Ý:
-- - Sau khi chạy migration, script cũ supabase_admin_demo_profile.sql
--   (dùng cột lollipops) không còn đúng; cập nhật thành stars nếu cần chạy lại.
