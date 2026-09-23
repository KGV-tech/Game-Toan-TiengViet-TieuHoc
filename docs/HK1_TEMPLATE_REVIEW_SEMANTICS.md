# Quy ước template review Toán 4 Học kỳ 1

## Phạm vi và nguồn đối chiếu

Quy ước này áp dụng cho template Toán lớp 4, Học kỳ 1. Nguồn đối chiếu là SGK và VBT
Toán 4 Tập 1 do người phụ trách dự án cung cấp. Học kỳ 2 không nằm trong thay đổi này.

- Hoạt động “mật khẩu mở khóa két sắt” thuộc Bài 12, phần các số trong phạm vi lớp
  triệu (SGK Tập 1, trang in 44). Generator `number.safe_password_by_place_value`
  vì vậy ánh xạ tới `g4-math-hk1-b12`.
- Bài review phải ôn lại nhiều mô hình bài đã học thay vì mặc định lặp một dạng duy
  nhất trong cả bốn câu con.

## Hợp đồng `reviewMode`

Các generator review HK1 dùng `reviewMode` trong `config`:

- Không khai báo hoặc đặt `"mixed"`: xáo trộn pool `skills`, `modes` hoặc `groups`
  đã cấu hình và phân bổ vào bốn câu con. Nếu pool có từ hai phần tử trở lên, một
  lượt phải có nhiều hơn một dạng.
- Đặt `"single"`: chọn một phần tử trong pool và dùng cho cả bốn câu con để luyện
  chuyên biệt.
- Pool một phần tử luôn hợp lệ và được lặp đủ bốn câu con ở cả hai chế độ.
- Giá trị khác `mixed` hoặc `single` phải bị từ chối.

Mỗi câu con review phải giữ metadata `skill`, `lesson` và `family`. Các tương tác
thực hành có thêm `interaction`; bài dựng hình trên lưới có thêm `construction`.

## Phạm vi các review HK1

| Review | Pool mặc định |
| --- | --- |
| Bài 6 | Bài 1–5 |
| Bài 9 | Đọc số đo góc; phân loại góc |
| Bài 16 / Bài 33 | Bài 10–15 |
| Bài 21 / Bài 36 | Bài 17–20 |
| Bài 26 / Bài 34 | Bài 22–25 |
| Bài 32 | Bài 27–31 |
| Bài 35 | Bài 7–9 và Bài 27–31 |
| Bài 37 | Số học; cộng-trừ; nhân-chia; hình học; đo lường; thống kê; xác suất; bài toán có lời văn |

Tên generator cũ như `number.hk1_review_b01_b04` được giữ để tương thích với dữ
liệu đã lưu; phạm vi thực tế được mở rộng bằng config và migration mới.

## Supabase

Migration `20260923_question_templates_hk1_semantic_review.sql` là bản hiệu chỉnh
idempotent cho các hàng template đang hoạt động của đúng Lớp 4 / Toán / Học kỳ 1.
Không sửa các migration lịch sử và không tự động chạy migration này. Việc triển
khai vào Supabase thật cần xác nhận riêng đúng dự án đích.
