# Checklist Playwright cho game

> Trạng thái hiện tại: Playwright 1.62.1 và Chromium headless đã được cấu hình. Test đầu tiên nằm tại `tests/e2e/homepage.spec.cjs` và dùng server tĩnh cục bộ, không gọi Supabase thật.

Chạy test browser:

```powershell
npm run test:browser
```

## Trước khi chạy

1. Xác định URL ứng dụng đang chạy (local hoặc preview).
2. Chuẩn bị tài khoản thử nghiệm không chứa dữ liệu học sinh thật.
3. Ghi rõ thay đổi cần test và tiêu chí pass/fail.
4. Không chạy thao tác xóa hàng loạt, đổi RLS hoặc thay dữ liệu production trong test tự động.

## Luồng tối thiểu

- Mở trang: không có lỗi console nghiêm trọng và không bị trắng trang.
- Đăng ký/đăng nhập bằng dữ liệu thử nghiệm: hiển thị loading và thông báo lỗi rõ ràng.
- Chọn khối/lớp, môn học và làm một câu hỏi: điểm, phản hồi đúng/sai và điều hướng hoạt động.
- Kiểm tra một màn hình học sinh ở kích thước desktop và mobile.
- Nếu thay đổi liên quan quản trị: kiểm tra quyền giáo viên và xác nhận học sinh không thấy chức năng quản trị.

## Bằng chứng cần lưu

- URL, thời điểm, kích thước màn hình và dữ liệu thử nghiệm đã dùng.
- Ảnh chụp trước/sau khi thay đổi giao diện.
- Console errors và request lỗi (nếu có).
- Kết quả từng luồng: Pass / Fail / Blocked, kèm cách tái hiện khi Fail.

## Kết luận

Playwright chỉ kết luận **Pass** khi luồng đã chạy thật trong trình duyệt. Nếu chưa thiết lập, ghi **Blocked — Playwright chưa cấu hình**, không thay bằng suy đoán.
