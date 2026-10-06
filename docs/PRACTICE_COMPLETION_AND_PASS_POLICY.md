# Lượt làm bài và điều kiện qua bài luyện tập

Yêu cầu ngày 06/10/2026: thay chữ “ngữ liệu” trong câu hỏi/lời giải bằng câu văn, đoạn văn hoặc tên nội dung phù hợp; sửa thống kê và điều kiện mở bài của hai môn.

## Quy tắc

- Một lượt làm đủ 10 câu chính được tính một lần “Hoàn thành bài làm”, kể cả 0 điểm. Mã lượt ngăn đếm trùng khi đồng bộ hoặc gọi kết thúc lại; đề kiểm tra và lượt bỏ dở không tính.
- Ngày thống kê theo Asia/Ho_Chi_Minh, lọc đúng môn và cấp lớp. Kết quả đã lưu trên thiết bị nhưng chờ mạng vẫn xuất hiện; đối chiếu mã lượt với lịch sử máy chủ tránh đếm hai lần.
- Điều kiện điểm mặc định bật, 8/10. Admin có checkbox và điểm nguyên 0–10, bước 1, riêng Toán/Tiếng Việt. Bỏ chọn cho phép chọn bất kỳ bài đã được giáo viên mở. Bật yêu cầu mỗi bài trước có ít nhất một lượt hoàn chỉnh đạt mức điểm, không cộng dồn điểm các lượt. Cấu hình mới áp dụng khi vào lượt tiếp theo và tính lại lộ trình từ lịch sử.
- Mốc giáo viên luôn là giới hạn trên. Bài bị khóa theo điểm và bài chưa được giáo viên mở có nhãn khác nhau; cờ vàng chỉ rõ bài tại mốc đã mở.
- “Đủ điều kiện làm bài kế tiếp” trên bảng hôm nay là Đạt khi có ít nhất một lượt hôm nay đạt mức của môn, hoặc điều kiện điểm đang tắt. Trạng thái này không vượt mốc giáo viên; lộ trình vẫn kiểm tra lịch sử của từng bài.
- Thời gian bắt đầu khi hiện màn làm bài, dừng khi kết thúc, rời màn hoặc tab ở nền. Bản nháp giữ tổng thời gian đã làm, lần trở lại chỉ cộng thời gian làm tiếp; không cộng thời gian dạo trạm, đăng nhập hay thời gian chờ đồng bộ. Cộng số giây các lượt hoàn chỉnh trước khi đổi sang phút.

## Dữ liệu tương thích

RPC hiện có giữ chi tiết câu nhưng không giữ mã bài ở cấp lượt. Mã bài được ghi vào mỗi chi tiết; thời gian của lượt nằm trong `details[0].practice.durationSeconds`. Cách này dùng JSON hiện có, không thay schema/RLS, không chạy migration hoặc ghi dữ liệu production bằng công cụ. Lượt cũ không có thời gian/mã bài không được suy đoán để bổ sung.

Câu sinh đã lưu từ bản trước chỉ được nhận nếu toàn bộ nội dung khớp chính xác phiên bản cũ dựng lại từ tham số đã kiểm chứng. Khi hiển thị lại, cập nhật sang cách gọi câu văn/đoạn văn, giữ đáp án và thứ tự lựa chọn. Câu đã sửa tùy ý vẫn bị từ chối; không nới lỏng kiểm chứng nguồn. Fixture từ commit `1da0339` khóa tương thích này.

Sao hôm nay dựa vào lượt luyện tập đầu tiên đã ghi trong lịch sử và trạng thái thưởng ngày hiện có: 1 sao, hoặc 6 sao khi chuỗi 5 ngày đã reset. Thưởng ngày chỉ thuộc môn của lượt đầu tiên, không nhân đôi giữa hai môn. Cài đặt dùng `game_settings.data.practicePass`; lỗi lưu trả lại cấu hình trước.

## Kiểm chứng

Kiểm thử ở giao diện kết thúc lượt/ghi lịch sử, thống kê hôm nay, điều hướng và cài đặt Admin. Bao phủ lượt điểm thấp, nhiều lượt không cộng dồn, đạt 8/10, checkbox từng môn, mốc giáo viên, dữ liệu chờ mạng, thời gian rời bài và laptop/tablet 1280×720, 1440×900, 1024×768. Không gọi Supabase thật.

Toàn bộ hợp đồng Node và 364 kiểm thử Playwright Chromium đạt. Review yêu cầu và tiêu chuẩn không còn lỗi bắt buộc; dữ liệu câu hỏi sai cấu trúc cũng có kiểm thử từ chối an toàn trước bước cập nhật cách gọi.
