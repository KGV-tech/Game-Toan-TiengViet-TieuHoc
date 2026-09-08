# Kế hoạch triển khai thi đua đội nhóm

## Mục tiêu

Triển khai vertical slice an toàn cho thi đua đội nhóm trong một lớp học: giáo viên tạo trận, chia đội, chọn trưởng nhóm/bộ đề/thời gian, chuẩn bị và trình chiếu bảng thi đua; trưởng nhóm làm bài trên một tablet và bị khóa lượt khi rời giữa chừng. Điểm đội được gán giống nhau cho từng thành viên nhưng không làm thay đổi hệ thống điểm cá nhân hiện có.

## Phạm vi và giới hạn

- Giữ nguyên chức năng tab con **Cá nhân**.
- Thêm tab con **Đội nhóm** trong Admin → Quản lý nhiệm vụ.
- Dùng module domain riêng và local/demo adapter để không refactor lớn `src/main.js`.
- Không thêm dữ liệu/seed hoặc thay đổi API key. Schema/RLS/RPC chỉ triển khai sau khi project đích được xác nhận; project `bjgbbrufnryrtimtzvhn` hiện đã được xác nhận.
- UI ưu tiên laptop/desktop và tablet ngang.

## Các pha thực hiện

### Pha 0 — Hợp đồng và kiểm thử nền

1. Tạo module `src/modules/team-competition.js` với hằng số trạng thái, kiểu dữ liệu, validation, chia đội, tính điểm, chuyển trạng thái và adapter lưu trữ.
2. Viết contract test Node trước khi triển khai hành vi: chia manual/random, đội lệch thành viên, trưởng nhóm duy nhất, bộ đề cùng số câu, điểm 0–10, lock không resume.
3. Cập nhật test browser cho tab Đội nhóm và bảng chuẩn bị.

**Checkpoint:** test contract mô tả được quy tắc đã chốt và fail trước khi có implementation.

### Pha 1 — Quản trị trận

1. Nạp module vào `index.html`.
2. Tách render nhiệm vụ cá nhân hiện tại khỏi workspace hai tab.
3. Thêm form tạo/sửa Nháp: tên trận, lớp, số đội, manual/random, thành viên, trưởng nhóm, bài chung/bài riêng, thời gian.
4. Thêm validation và lưu local/demo; hiển thị bốn trạng thái đúng thứ tự.
5. Thêm màn hình Bảng thi đua nhóm với một card mỗi đội, nút **Thay đổi**, nút **Bắt đầu thi đua** và nút kết thúc.

**Checkpoint:** giáo viên tạo được nhiều bản Nháp, chuẩn bị một trận hợp lệ và mở được bảng trình chiếu.

### Pha 2 — Luồng trưởng nhóm trên tablet

1. Thêm màn hình làm bài đội nhóm dùng renderer câu hỏi hiện có.
2. Chỉ tài khoản trưởng nhóm của đúng đội mới được vào lượt; mỗi câu nộp một lần và lưu điểm cục bộ ngay.
3. Hiển thị đồng hồ chung hoặc không giới hạn; hết giờ tự khóa lượt.
4. Thoát, đăng xuất, refresh, chuyển tài khoản hoặc đóng tab: hộp xác nhận có **OK** và **Hủy**; OK khóa, Hủy ở lại. Refresh/đóng tab dùng `beforeunload` của trình duyệt.
5. Lượt đã khóa chỉ xem kết quả, không resume/đổi trưởng nhóm.

**Checkpoint:** điểm câu đã nộp được giữ sau lock; câu chưa nộp là 0; không submit trùng.

### Pha 3 — Kết quả và bảng theo dõi

1. Cập nhật card theo tiến độ câu, điểm đội, trạng thái, thời gian bắt đầu/kết thúc.
2. Khi kết thúc, tạo bản ghi kết quả riêng cho từng thành viên với `individual_score = team_score`.
3. Không gọi `updateUserScore`, không ghi `history`, sao, progression hoặc nhiệm vụ cá nhân.
4. Chỉ hiển thị dữ liệu cấp đội trên vùng trình chiếu; dữ liệu học sinh chỉ ở vùng quản trị.

**Checkpoint:** đội 31 học sinh chia 4 đội lệch tối đa một người vẫn hợp lệ; điểm mỗi thành viên giống điểm đội.

### Pha 4 — Tích hợp máy chủ

1. Tạo `supabase/migrations/20260906_team_competitions.sql` cho trận, đội, lượt làm, đáp án câu, kết quả thành viên, RPC chấm điểm và Realtime.
2. Chốt RLS/authorization cho giáo viên, trưởng nhóm và thành viên; giữ answer key trong schema `private`.
3. Nối `src/modules/team-competition-supabase.js` để đồng bộ máy chủ, chống race condition, idempotency và realtime; local/demo vẫn là fallback khi schema chưa có.
4. Chạy migration trong project đã xác nhận rồi kiểm tra đa tablet trong cùng lớp.

**Việc còn lại:** apply migration trong SQL Editor/CLI của project và kiểm thử với tài khoản thật; repo không tự seed hay thay đổi dữ liệu học sinh.

### Pha 5 — Xác minh và bàn giao

1. Chạy test contract liên quan, sau đó toàn bộ `test_*.cjs` và `npm test`.
2. Chạy Playwright ở 1280×720 và 1024×768 ngang; kiểm tra console/runtime.
3. Review diff, tạo commit nhánh `codex/`, gửi Kimi review theo commit cố định.
4. Chỉ merge sau khi finding bắt buộc đã xử lý và người dùng đồng ý.

## Tiêu chí hoàn thành lượt hiện tại

- Có module domain/testable và local adapter rõ ràng.
- Admin có workspace Cá nhân/Đội nhóm, form tạo trận và bảng card đội.
- Luồng trưởng nhóm và modal khóa lượt hoạt động ở chế độ local/demo.
- Không phá hồi quy nhiệm vụ cá nhân.
- Migration/RLS/RPC/adapter production đã có trong repo; chỉ coi là realtime production sau khi migration được apply và kiểm thử với tài khoản thật.

---

# Kế hoạch triển khai soạn đề theo chủ đề và tự động tạo câu

## Mục tiêu

Trong **Soạn đề**, giáo viên chọn kỳ kiểm tra, tích nhiều chủ đề phù hợp rồi vẫn có thể soạn thủ công như trước hoặc bấm **Tạo đề tự động** để điền sẵn đúng 10 câu từ kho câu hỏi/template và chỉnh sửa trước khi lưu.

## Quyết định triển khai

- `Giữa/Cuối kỳ 1` chỉ hiện chủ đề Học kỳ 1; `Giữa/Cuối kỳ 2` chỉ hiện chủ đề Học kỳ 2; `Cả năm` gộp hai học kỳ của đúng môn/lớp.
- Chủ đề được lưu cùng đề dưới dạng mảng `topics`; đề cũ không có trường này vẫn mở và soạn thủ công bình thường.
- Tạo tự động chỉ cập nhật bản nháp form, không ghi kho câu hỏi hay đề lên Supabase cho đến khi giáo viên bấm lưu.
- Bốc câu hợp lệ từ kho trước, bổ sung câu sinh từ template; bỏ câu trùng và báo rõ nếu không đủ 10 câu.

## Các lát triển khai

1. Thêm contract/UI test cho lọc chủ đề theo kỳ và chọn nhiều chủ đề.
2. Thêm state bản nháp đề, vùng chọn chủ đề và giữ nguyên luồng soạn thủ công.
3. Thêm tạo tự động 10 câu từ kho/template theo lớp, môn, học kỳ và chủ đề đã chọn.
4. Kiểm thử browser laptop 1280×800 và tablet ngang 1024×768, review diff, commit/PR.
