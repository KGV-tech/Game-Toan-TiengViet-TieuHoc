-- Chạy một lần trên Supabase SQL Editor cho database đang sử dụng.
-- Cho phép Giáo viên giao một đề kiểm tra cụ thể qua Nhiệm vụ.
ALTER TABLE game_quests
    ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES game_exams(id) ON DELETE SET NULL;
