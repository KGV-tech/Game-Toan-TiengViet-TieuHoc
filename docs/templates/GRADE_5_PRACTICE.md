# Mẫu luyện tập Toán và Tiếng Việt lớp 5

Bộ **Kết nối tri thức với cuộc sống**, cả hai tập. Danh mục giữ cách tổ chức của lớp 4 theo cấp lớp, môn, học kì, chủ đề và bài học. Mỗi mẫu có mã ổn định, đáp án, lời giải và trang đối chiếu trong sách giáo khoa. Một lượt học gồm 10 câu khác nhau.

| Môn | Phạm vi | Mẫu gắn với bài |
| --- | --- | --- |
| Toán | 75 bài, 12 chủ đề | 156 |
| Tiếng Việt | 62 bài chính, 4 đợt ôn tập, 8 chủ điểm | 94 |

## Dùng trong game

- **Học sinh** vào Vui học Toán hoặc Vui học Tiếng Việt bằng tài khoản lớp 5, rồi chọn bài đang mở trong lộ trình.
- **Giáo viên** đặt mốc trong Cài đặt → Lộ trình học sinh → Lớp 5. Nếu lớp chưa có mốc, lộ trình mở bài đầu theo quy tắc hiện hành. Mốc lưu theo chủ đề từ trước được đọc thành bài cuối của chủ đề tương ứng.
- **Giáo viên** vào Kho Cấu hình Câu hỏi → Lớp 5 · Mẫu luyện tập theo bài học để chọn bài và xem một câu, đáp án, lời giải và trang đối chiếu.

## Nội dung và căn cứ

- **Toán tập một** theo mục lục trang 4–5, từ ôn số tự nhiên và phân số đến số thập phân, đo diện tích và hình phẳng. Bài 4 luyện đổi mẫu số thành 10, 100 hoặc 1 000. Viết số thập phân bắt đầu từ Bài 10. Các số liệu bài tập được sinh theo kỹ năng của bài.
- **Toán tập hai** theo mục lục trang 2–3, gồm tỉ số, phần trăm, thể tích, hình khối, thời gian, chuyển động đều, thống kê và xác suất. Bài 64 sinh biểu đồ hình quạt tròn với ba phần có tổng 100%.
- **Tiếng Việt tập một** theo mục lục trang 4–6. Các mạch Luyện từ và câu gồm từ loại, đại từ, từ đồng nghĩa, từ đa nghĩa, từ điển, dấu gạch ngang, điệp từ và kết từ.
- **Tiếng Việt tập hai** theo mục lục trang 3–6. Các mạch trọng tâm gồm câu đơn, câu ghép, cách nối vế, ba cách liên kết câu, viết hoa thể hiện sự tôn trọng và viết tên riêng nước ngoài.
- Tám bài đọc có câu hỏi riêng dựa trên đoạn tóm tắt biên soạn từ bài đọc trong sách. Phần Viết luyện nhận biết yêu cầu, chọn chi tiết, ý hoặc lí lẽ cho đúng thể loại. Bài viết hoàn chỉnh và Nói và nghe cần giáo viên đánh giá.
- Các mẫu dùng câu trắc nghiệm một đáp án để chấm tự động. Một số bài thực hành trực tiếp có câu củng cố bằng tình huống hoặc hình minh họa. Ví dụ, Bài 42 hướng dẫn thao tác máy tính cầm tay và hỏi kết quả, còn Bài 49 kiểm tra các mặt của hình khai triển.

Đối chiếu danh mục và các trang bài tập trong bốn tập SGK từ thư mục `D:\LỆ HOA\SGK SGV 2026 Full\LOP 05`. Tham khảo SGV ở phần hướng dẫn và một số bài đại diện. Mỗi bản ghi Tiếng Việt lưu trang của hoạt động tương ứng. Với Toán, trường trang là trang bắt đầu bài học.

## Kiểm tra

Chạy `node test_grade5_practice.cjs` để kiểm tra ánh xạ bài, đáp án, nguồn và số câu khác nhau. Chạy `npm run test:browser -- tests/e2e/grade5-practice.spec.cjs` để kiểm tra lượt chơi và chấm điểm trên trình duyệt.


## Đồng bộ với Supabase

Migration `20261109131049_question_templates_grade5.sql` lưu cấu hình của 250 mẫu vào `public.question_templates`. Mỗi cấu hình được đối chiếu theo cấp lớp, mã sinh câu và mã bài. Khi chạy lại, bản ghi khớp giữ mã và trạng thái bật/tắt. Nếu có hai bản ghi cùng định danh hoặc trùng UUID với mẫu khác, giao dịch dừng trước khi ghi.

Game tạo câu hỏi bằng bộ mẫu trong mã nguồn. Cấu hình Supabase cho phép lưu và đọc trạng thái kích hoạt. Giáo viên xem câu mẫu từ danh mục lớp 5, kể cả khi game chưa tải được cấu hình từ máy chủ.
