# Rà soát quy tắc template theo môn và bài — 09/10/2026

Phạm vi: form cấu hình template và cấu hình được lưu; không thay đổi dữ liệu Supabase.

- 79 generator Toán có trong form: mở form, thu cấu hình, sinh câu hỏi thành công.
- 10 kỹ năng Tiếng Việt: giữ đúng generator, ngữ liệu theo bài và hai câu con; cấu hình mới không chứa tham số số học. Bộ tham số ngữ liệu cố định đã có được giữ khi sửa cùng generator.
- 270 template chọn nhiều: kiểm tra từng bài, môn, chế độ Đúng/Sai; không hiển thị giới hạn chữ số, không lưu nhóm từ vào Toán.
- Hoàn thành Bảng: dùng số cột hàng riêng, giữ phạm vi Bài 10 Toán 4.

Các lỗi được sửa:

1. Quy tắc giới hạn chữ số từng được bật theo danh sách loại trừ, làm lọt Tiếng Việt, chọn nhiều và bảng. Hiện dùng danh sách generator thực sự đọc tham số này, chung cho hiển thị và lưu.
2. Cấu hình chung từng đưa các điều kiện mật khẩu, chữ số và loại nhận định vào nhiều dạng khác. Hiện chỉ ghi trường được generator sử dụng.
3. Các kỹ năng Tiếng Việt không có lựa chọn generator riêng và có thể rơi về form Toán. Hiện có lựa chọn đúng kỹ năng, ngữ liệu kiểm chứng theo bài; không hiển thị công thức câu con hoặc tham số sinh số mà engine không sử dụng.
4. Form Bài 3/Bài 4 từng hiện đồng thời phạm vi số, số thẻ, độ dài dãy, bước nhảy và hằng số. Hiện từng trường chỉ hiện với đúng dạng; lập số từ thẻ không hiện/lưu khoảng giá trị số.
5. Nhóm danh từ/động từ/tính từ trong chọn nhiều được giới hạn theo bài giống engine: Bài 9 và Bài 21; học kì II dùng phạm vi kiến thức đã học.
6. Ôn tập Bài 32 từng đưa thêm Bài 7–9 vào pool kỹ năng trong form dù generator chỉ nhận Bài 27–31. Loại bỏ lựa chọn không được hỗ trợ và kiểm tra cùng allowlist.
7. Làm mới preview từng ghi đè phạm vi chữ số tùy chỉnh ở các dạng sáu chữ số/lớp triệu/làm tròn. Hiện giữ phạm vi đang chỉnh; chỉ đặt mặc định khi đổi generator.
8. Bài 20/Bài 21 chỉ hiện nhóm đơn vị thực hành hoặc nhóm kỹ năng ôn tập mà generator tương ứng sử dụng.
9. Template so sánh số với dạng tổng từng chọn phép so sánh nghiêm ngặt không có ứng viên ở biên phạm vi. Hiện sinh trực tiếp trong khoảng hợp lệ; dùng dấu bằng khi phía được chọn không còn ứng viên. Kiểm thử tất định ở cả hai biên và 100 seed.
10. Nút Quay về dư thừa ở đầu hộp Preview được bỏ; nút phía dưới nhận focus và vẫn đóng được bằng Escape.

Kiểm chứng tự động: `tests/e2e/template-rule-scope.spec.cjs`, các test editor/preview hiện có và toàn bộ kiểm thử Node/Playwright. Ảnh QA laptop/tablet được tạo trong `.tmp/` (không đưa vào repository).
