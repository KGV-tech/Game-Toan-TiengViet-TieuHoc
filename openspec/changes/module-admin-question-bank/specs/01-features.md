# Tính năng hiện tại của module-admin-question-bank

## MODIFIED Requirements

### Requirement: Quản lý câu hỏi (Admin)
- **WHEN** Admin chọn tạo/chỉnh sửa câu hỏi
- **THEN** có thêm tùy chọn loại câu hỏi "Đối chiếu trùng khớp"
- **AND** giao diện cho phép nhập Cột Trái và Cột Phải cho dạng "Đối chiếu trùng khớp"

### Requirement: Hệ thống Export Template
- **WHEN** Admin click nút "Xuất file mẫu"
- **THEN** hiện ra 7 lựa chọn tương ứng với 7 dạng câu hỏi (trong đó có "Đối chiếu trùng khớp")
- **AND** file Excel tải về chứa dòng hướng dẫn (Guide) và dữ liệu mẫu (Sample) đúng theo dạng đã chọn

## ADDED Requirements

### Requirement: Tương tác dạng Đối chiếu trùng khớp (Matching)
- Hệ thống cần hỗ trợ giao diện nối 2 cột đáp án cho học sinh với số lượng ô bất đối xứng.
- **WHEN** Học sinh click vào ô bên trái, sau đó click ô bên phải
- **THEN** Hiển thị đường line nối 2 ô đó với hiệu ứng màu sắc neon.
- **WHEN** Học sinh bấm nút Kiểm tra (Nộp bài)
- **THEN** Hệ thống đối chiếu các cặp nối của học sinh với đáp án đúng `q.ans`.
- **IF** Học sinh nối sai
- **THEN** Hệ thống đổi màu đường line thành đỏ và tự động sửa thành các đường nối đúng (màu xanh lục) sau 1 giây.
