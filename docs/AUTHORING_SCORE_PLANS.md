# Cơ cấu điểm khi tạo Phiếu/Đề tự động

Nút **Tạo phiếu từ ảnh/file** nằm cạnh **Soạn phiếu mới** trong thư viện Phiếu.

Trong trình soạn Phiếu hoặc Đề, bật **Tùy chỉnh số câu và câu con**. Chọn 1–50 câu chính; từng câu có thể không có câu con hoặc có 1–20 câu con. Điểm cập nhật trực tiếp: mỗi câu chính được 10 / số câu chính, mỗi câu con được điểm câu chính / số câu con. Tổng thang điểm là 10. Màu xanh nghĩa là biểu diễn chính xác trong tối đa hai chữ số thập phân; đỏ đậm nghĩa là cần nhiều hơn hai chữ số, kể cả số vô hạn. Giá trị cảnh báo không bị làm tròn thành số đẹp.

Bấm **Tạo phiếu/đề tự động** để áp dụng cơ cấu. Hệ thống lấy các câu/ý khác nhau trong phạm vi lớp, môn, chủ đề và bài học; nếu thiếu nguồn sẽ báo lỗi và giữ bản đang soạn. Mặc định khi chưa bật tùy chỉnh vẫn dùng luồng 10 câu theo cấu trúc nguồn đã có. Bản từ ảnh/file tiếp tục là phiếu tự do độc lập.

Cơ cấu nằm trong JSON câu hỏi (`authoringPlan` và `authoringParts`), không thêm cột Supabase. Phiếu và Đề dùng kho/draft riêng. Câu tổng hợp không được đưa vào ngân hàng câu hỏi dùng chung. Chấm Đề nhân điểm câu chính với 10 / số câu; điểm từng phần trong câu con vẫn theo bộ chấm hiện có. Xóa câu cập nhật lại số câu và điểm; chèn trực tiếp từ kho vào đề có cơ cấu riêng bị chặn để tránh phá cấu trúc.

Kiểm thử: `test_authoring_plan.cjs`, `tests/e2e/authoring-plan.spec.cjs`, và toàn bộ `npm test`.
