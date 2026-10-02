# Dark / light cho Admin

Lựa chọn sáng/tối dùng chung `game_theme` hiện có, lưu qua safeStorage. Nút đổi
chế độ nằm trong map Admin, sidebar Soạn đề, header quản lý/cài đặt/lộ trình,
sidebar từng chức năng thi đua và toolbar bảng thi đua nhóm. Nút dùng tên truy cập
chỉ rõ chế độ sẽ chuyển sang và aria-pressed biểu thị chế độ sáng đang bật.

CSS Admin được cô lập trong admin-theme.css, tải sau các stylesheet hiện có.
Chế độ sáng dùng nền trắng xanh và chữ xanh đậm; giữ gradient hồng, tím, xanh,
vàng để phân biệt khu vực. Phạm vi chỉ gồm Soạn đề và modal có ui-context admin;
không đổi dữ liệu, quyền truy cập, Supabase hay hình nền sân thi đua.

Đổi chế độ chỉ đổi thuộc tính theme và nhãn nút, không render lại form. Dark giữ
giao diện hiện có; light được kiểm tra trên laptop/tablet ngang. Bộ kiểm thử
admin-theme bao phủ ghi nhớ khi tải lại, chuyển qua các màn và giữ nội dung nhập.
