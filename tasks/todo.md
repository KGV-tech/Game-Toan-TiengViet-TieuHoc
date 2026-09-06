# Todo — thi đua đội nhóm

## Đang làm

- [x] Viết contract test cho domain đội nhóm.
- [x] Thêm module domain + local/demo persistence adapter.
- [x] Tích hợp module vào index và Admin → Quản lý nhiệm vụ.
- [x] Tạo form Nháp/Đã chuẩn bị và bảng thi đua cấp đội.
- [x] Tạo luồng trưởng nhóm trên tablet, lưu từng câu và khóa khi rời.
- [x] Thêm modal xác nhận OK/Hủy và cảnh báo `beforeunload`.
- [x] Thêm kết quả gán cùng điểm cho từng thành viên, không đụng điểm cá nhân.
- [x] Thêm CSS scoped và kiểm tra laptop/tablet ngang.
- [x] Bổ sung test Playwright, chạy toàn bộ test và kiểm tra diff.
- [x] Tạo migration Supabase cho schema, RPC, RLS và Realtime.
- [x] Thêm adapter Supabase đồng bộ snapshot, câu trả lời một lần và realtime; giữ fallback local/demo.

## Chờ apply/kiểm thử production

- [x] Xác nhận đúng dự án Supabase đích: `bjgbbrufnryrtimtzvhn`.
- [x] Phê duyệt migration/schema, RLS, API và realtime cho thi đua đội nhóm.
- [ ] Chạy `supabase/migrations/20260906_team_competitions.sql` trong project đã xác nhận.
- [ ] Đăng nhập bằng tài khoản Admin/trưởng nhóm thật và kiểm thử nhiều tablet; không coi production-ready trước bước này.

## Ngoài phạm vi MVP

- [ ] Thi đua liên lớp, bảng tích lũy tuần/tháng.
- [ ] Mỗi thành viên một thiết bị hoặc tự lập/đổi đội.
- [ ] Resume/đổi trưởng nhóm sau khi lượt đã khóa.
- [ ] Tự động dùng thời gian để phá hòa.
