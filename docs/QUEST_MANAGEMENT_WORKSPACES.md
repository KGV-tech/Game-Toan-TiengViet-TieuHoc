# Màn hình quản lý Thi đua & Nhiệm vụ

Yêu cầu ngày 02/10/2026, nền trước thay đổi: `22846ed`.

- Tăng ô đếm hồ sơ học sinh lên 2,5 lần bằng font, padding và viền trong layout.
- Quản lý Thi đua & Nhiệm vụ mở màn chọn ba chức năng bằng thẻ gradient.
- Chọn Nhiệm vụ Cá nhân, Thi đua Nhóm hoặc Thi đua tuần mở màn riêng; không hiện nút chuyển sang hai chức năng khác.
- Mỗi màn riêng có khung trái gồm tiêu đề, Quay về và điều khiển của chức năng đó; phần phải dành cho danh sách/form.
- Quay về trả về màn chọn và khôi phục focus tại chức năng vừa mở.
- Giữ chức năng hiện có, form tạo/chỉnh sửa và màn trình chiếu trận. Không thay đổi dữ liệu hay schema Supabase.

Navigation shell nằm tại `src/modules/quest-management.js`; renderer và logic chức năng hiện có giữ nguyên. Kiểm tra bằng fixture ngoại tuyến trên laptop 1280×720, 1440×900 và tablet ngang 1024×768, gồm không tràn canvas, keyboard/focus và giữ sidebar khi mở form.

Review Standards: không có lỗi bắt buộc. Review Spec: đã sửa trường hợp bảng trình chiếu → chỉnh sửa bị mất sidebar và nhãn dialog; không còn lỗi bắt buộc. Controls tuần được thay trước khi dựng lại để không trùng ID/giữ handler cũ.

59 kiểm thử hợp đồng Node đạt. Ảnh kiểm tra lưu tại `test-results/ui-review/quest-hub-*.png`, `quest-personal-*.png`, `quest-team-*.png`, `quest-weekly-*.png` và `roster-sidebar-*.png` (fixture minh họa, không dùng học sinh thật).

Toàn bộ 255 kiểm thử Playwright Chromium đạt với `npm run test:browser -- --workers=4`. Các kiểm thử điều hướng cũ đã cập nhật theo màn chọn mới; luồng bảng trận → form kiểm tra sidebar, Quay về và nhãn dialog hợp lệ.
