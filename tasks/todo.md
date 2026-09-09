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

---

## Soạn đề theo chủ đề và tự động tạo câu

- [ ] Lọc chủ đề theo kỳ kiểm tra, hỗ trợ Cả năm và chọn nhiều chủ đề.
- [ ] Giữ các chủ đề đã chọn trong bản nháp/lúc lưu đề.
- [ ] Tạo tự động đúng 10 câu từ kho câu hỏi và template.
- [ ] Kiểm thử thủ công, kiểm thử browser và tạo PR.

---

## Phân cấp Bài học — Toán lớp 4

### Đang làm

- [ ] Tạo catalog 13 Chủ đề và 73 Bài học theo SGK Toán 4 Tập 1–2.
- [ ] Thêm contract test cho catalog và luật chỉ hỗ trợ Lớp 4/Toán.
- [ ] Nối metadata Bài học tương thích dữ liệu cũ, không đổi schema Supabase.
- [ ] Thêm Bài học vào soạn câu hỏi, template, import/export, soạn đề và nhiệm vụ của Admin.
- [ ] Giữ giao diện làm bài Toán/Tiếng Việt của học sinh chỉ theo Chủ đề.
- [ ] Thêm browser test laptop/tablet ngang và chạy toàn bộ hồi quy.

### Ngoài phạm vi lượt này

- [ ] Danh mục Bài học Tiếng Việt.
- [ ] Danh mục Bài học các cấp lớp khác.
- [ ] Migration/RLS hoặc thay đổi dữ liệu Supabase production.

---

## Tái xây dựng hệ thống Template — theo lộ trình Bài học

Chi tiết tại [`docs/templates/TEMPLATE_SYSTEM.md`](../docs/templates/TEMPLATE_SYSTEM.md). Đây là kế hoạch có cổng duyệt; chưa rebuild dữ liệu hoặc tạo Template mới trước khi người dùng duyệt phase tương ứng.

### Phase 0 — Hồ sơ và đề xuất

- [x] Tạo folder `docs/templates/`.
- [x] Tạo tài liệu kiến trúc Template, generator, Supabase, contract, kiểm thử và rollback.
- [x] Ghi ma trận đề xuất Template Bài 1–37 HK1.
- [x] Ghi điều kiện chờ nguồn SGK/VBT Tập 2 cho HK2.

### Phase 1 — Kiểm kê trước khi rebuild (đã duyệt mapping trực tiếp)

- [x] Lấy danh sách Template thật bằng phiên Admin/export được phép.
- [x] Đối chiếu từng record với `lessonCatalog` và generator registry.
- [x] Phân loại giữ/gắn lesson/tách/sửa/archive.
- [ ] Xác nhận/apply migration cột `question_templates.lesson` và mapping Phase 1 ở đúng project.
- [x] Tạo manifest/validator và contract test lesson mapping.
- [x] Gửi mapping; người dùng đã duyệt nhóm gắn trực tiếp, không tạo B05.

### Các phase nội dung

- [x] Phase 2: Rebuild Bài 1–6 trong repo, gồm bốn family số chẵn/lẻ B03, hai family biểu thức chứa chữ B04 và review B06 B01–B04; bài toán ba bước B05 tạm hoãn. Chờ preview/apply migration.
- [ ] Phase 3: Rebuild Bài 7–9, gồm đo góc, phân loại góc và review góc.
- [ ] Phase 4: Rebuild Bài 10–16, gồm số nhiều chữ số, làm tròn, so sánh, dãy số và review.
- [ ] Phase 5: Rebuild Bài 17–21, gồm khối lượng, diện tích, thời gian/thế kỉ, thực hành và review.
- [ ] Phase 6: Rebuild Bài 22–26, gồm cộng, trừ, tính chất, tổng-hiệu và review.
- [ ] Phase 7: Rebuild Bài 27–32, gồm vuông góc, song song, hình bình hành/hình thoi và review.
- [ ] Phase 8: Rebuild Bài 33–37, gồm các bộ ôn tập HK1 có blueprint kỹ năng.
- [ ] Phase 9: Kiểm kê/rebuild HK2 sau khi có nguồn Tập 2 được xác nhận.
- [ ] Phase 10: Seed idempotent, archive có rollback, test đầy đủ và bàn giao.

### Rào chắn an toàn

- [ ] Không tạo Template mới trước checkpoint mapping Phase 1.
- [ ] Không xoá vật lý Template cũ trong rebuild đầu.
- [ ] Không đổi RLS/API key hoặc mở quyền `anon`.
- [ ] Không merge `main` trước khi người dùng yêu cầu và test/checkpoint đạt.
