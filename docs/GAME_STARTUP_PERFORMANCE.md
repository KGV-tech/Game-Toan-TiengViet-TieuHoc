# Tối ưu khởi động game — 04/10/2026

## Phạm vi và tiêu chí

Yêu cầu: rà luồng vào game và tinh chỉnh để đăng nhập, vào bản đồ và sử dụng
các trạm nhanh hơn; giữ nguyên chức năng và dữ liệu. Dùng các seam UI đăng nhập
và điều hướng hiện có trong Playwright, SDK giả lập không gọi Supabase thật.
Không thêm dependency, đổi schema/RLS, giảm chất lượng artwork hay refactor lớn
`main.js`. Không triển khai offline trong đợt này.

## Bằng chứng và quyết định

- Font Google là stylesheet chặn render: giữ request font khiến navigation đến
  DOMContentLoaded thất bại sau 2,5 giây và chưa gắn được nút đăng ký.
- Giữ một bộ sinh câu hỏi Toán cũng chặn binding đăng nhập. Bộ này chưa cần
  cho auth; chuyển sang tải sau DOMContentLoaded, tải song song nhưng thực thi
  theo đúng thứ tự gốc bằng script `async=false`. Đăng nhập chờ bộ sinh sẵn sàng
  trước khi mở game. Lỗi tải hoặc quá 15 giây hiển thị phản hồi ngay ở đăng nhập,
  không dùng fallback mở bản đồ với bộ câu hỏi thiếu. Timeout chỉ áp dụng cho
  mỗi lần chờ; khi tệp đến muộn, lần đăng nhập tiếp theo vẫn có thể thành công.
- CSS các trạm/giáo viên và font chuyển sang tải không chặn màn đăng nhập bằng
  `media=print`, đổi sang `all` khi tải xong. Giữ CSS nền chung và login là critical;
  thứ tự cascade và stylesheet in không đổi. `startup-assets.js` kiểm tra cả CSS
  bắt buộc trước khi mở bản đồ; auth vẫn hoạt động trong thời gian chờ CSS.
- Lượt đọc dữ liệu theo vai trò đang chờ tải xong dữ liệu chung. Hai nhóm chỉ
  đọc độc lập được bắt đầu song song sau khi Auth và profile đã được duyệt.
  Vẫn áp dụng settings trước hydrate metadata và chờ đủ trước mở bản đồ.
- Không tải toàn bộ ngân hàng câu hỏi giáo viên khi vào game: lazy loading cũ
  vẫn giữ. Không thay đổi logic chấm điểm, đồng bộ bài làm hoặc snapshot thi đua.

Nguồn kỹ thuật: [CSS không chặn render](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS),
[script và thứ tự thực thi](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script).

## Đo trước/sau và giới hạn

Chromium localhost, cold context, CPU 4×, latency 100 ms, download 200.000 B/s;
font/CDN SDK được giả lập. Server test không nén, nên đây là so sánh có kiểm soát,
không phải thời gian tải thực tế trên Vercel hay chứng nhận Core Web Vitals.

| Chỉ số | Trước | Sau bước tối ưu |
|---|---:|---:|
| DOMContentLoaded | 19.438 ms | 17.525 ms |
| First Contentful Paint | 8.824 ms | 7.192 ms |
| Full load | 19.438 ms | 19.739 ms |
| Script tải trước DOMContentLoaded | 66 | 26 |

Full load vẫn tải đủ các tài nguyên: cải thiện nằm ở màn đăng nhập hiện sớm và
không bị font/bộ câu hỏi giữ binding. Không tuyên bố giảm tổng payload của game.
Hai test giữ dữ liệu chung đã đỏ cho học sinh và Admin trước sửa, xanh sau sửa.
Việc tải song song loại bỏ một tầng chờ mạng, không đo độ trễ Supabase production.

Review Standards và Spec không còn finding bắt buộc. Đã tái hiện đỏ rồi sửa xanh
các trường hợp bootstrap thiếu, CSS/template thiếu, CSS đến chậm và dữ liệu phụ
lỗi trong luồng phục hồi. Cả đường đăng nhập bình thường lẫn phục hồi đều kiểm
tra tài nguyên bắt buộc. Màn đăng nhập vẫn thao tác được khi font hoặc template
chậm; một lần timeout không khóa vĩnh viễn các tài nguyên đến muộn.

Quality gate cuối: `npm test` đạt toàn bộ 59 tệp hợp đồng Node và 329 kiểm thử
Chromium. Kiểm tra ảnh đăng nhập desktop và light mode tablet không thấy hồi
quy; bộ kiểm thử có audit các trạm ở 1280×720, 1440×900 và 1024×768.
