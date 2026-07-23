-- Giới hạn vòng quay: tối đa 3 lượt/ngày cho mỗi học sinh, không cộng dồn ngày cũ.
ALTER TABLE game_users
    ADD COLUMN IF NOT EXISTS lucky_spin_date DATE,
    ADD COLUMN IF NOT EXISTS lucky_spin_count INT NOT NULL DEFAULT 0;
