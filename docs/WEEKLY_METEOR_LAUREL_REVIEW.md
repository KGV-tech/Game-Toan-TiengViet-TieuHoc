# Sao băng truy tìm và huy hiệu nguyệt quế

## Phạm vi được chọn

Người dùng chọn hiệu ứng Sao băng truy tìm và ảnh vòng nguyệt quế ôm số hạng.
Ba hạng đầu dùng vàng, bạc, đồng; màu tăng tương phản theo theme. SVG mask nội bộ
giữ vòng lá sắc nét, số hạng và nhãn truy cập ở DOM.

## Hành vi

- Kết quả vẫn được chọn trước phần trình diễn, giữ logic lớp/tuần, vắng và không lặp.
- Ngôi sao chuyển giữa các ô theo thứ tự ngẫu nhiên, giảm tốc và đáp đúng kết quả.
- Tổ/Nhóm → học sinh chạy hai giai đoạn nếu chưa chọn đội cụ thể.
- Snapshot danh sách trình diễn giữ thứ tự ô khi hiện kết quả; bộ chọn lượt tiếp
  theo vẫn loại học sinh đã chọn. Tải lại giao diện cập nhật điểm từ tuần hiện tại.
- Token hủy vòng khi đổi lớp/tuần/tab hoặc reset. Reduced motion giữ thời gian chờ,
  không hiện sao chuyển động. Tên đổi theo frame không vào live region.
- Khi chạy, thu gọn vùng trình diễn để 31 ô vừa laptop/tablet; tên đầy đủ xuất hiện
  trong dòng preview. Thời lượng cố định 6 giây, không có bộ chọn thời lượng;
  hai bước đội → thành viên chia 2,7 + 3,3 giây.

## Kiểm tra và review

Playwright dùng dữ liệu giả, không gọi Supabase thật. Kiểm tra dark/light,
1280×720, 1440×900 và 1024×768; kiểm tra di chuyển, chọn hai bước, không lặp,
giữ thứ tự cuối, hủy vòng, reduced motion, refresh và điểm độc lập.
Không chạy DevTools MCP. Không thêm dependency hay đổi schema/dữ liệu Supabase.

Review Spec phát hiện ô kết quả bị dồn cuối khi không lặp: đã sửa bằng snapshot.
Review Standards phát hiện khối CSS compact trùng: đã loại bỏ. Self-review giữ
escaping tên/ID và phạm vi thay đổi trong phần Thi đua tuần.

Kết quả cuối: `npm test` đạt toàn bộ 59 tệp kiểm thử Node và 292 ca Chromium.
Đồng hồ giả xác nhận lượt vẫn chạy ở 5,9 giây và hoàn tất sau mốc 6 giây.
