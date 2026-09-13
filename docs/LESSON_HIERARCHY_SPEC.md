# Đặc tả phân cấp Bài học và lộ trình luyện tập

## Mục tiêu

Bổ sung một cấp dữ liệu **Bài học** nằm dưới **Chủ đề** để Admin có thể gắn bài học khi soạn câu hỏi, template, đề kiểm tra và nhiệm vụ. Giai đoạn này chỉ nạp danh mục cho Toán lớp 4 theo mục lục SGK Toán 4 Tập 1 và Tập 2 do người dùng cung cấp.

Ở phía học sinh, danh mục này được dùng để tạo một lộ trình luyện tập theo đúng thứ tự bài. Học sinh không phải đi qua nhiều màn hình chọn Chủ đề → Bài; màn hình luyện tập có một hành động chính **Hôm nay mình học gì? → Tiếp tục** và tự mở đúng bài đang đến lượt.

## Ranh giới hành vi

- Admin nhìn thấy và sử dụng các trường lọc/chọn **Bài học** trong khu vực soạn nội dung, soạn đề, nhiệm vụ và Điều chỉnh.
- Học sinh vào màn hình luyện tập theo một lộ trình: hệ thống hiển thị bài đang học, tiến độ đã vững và các bài tiếp theo; không yêu cầu học sinh tự lọc qua từng Chủ đề/Bài.
- Admin có thể đặt mốc **Bài được mở đến** theo lớp/môn. Học sinh chỉ được vào các bài không vượt quá mốc này; các bài trước đó vẫn có thể mở lại để ôn.
- Nếu Admin chưa đặt mốc cho danh mục Bài học chính thức, hệ thống mặc định chỉ mở Bài 1 và nhắc giáo viên hoàn tất mốc tiến độ.
- Một bài được tính là **Đã vững** khi học sinh có một lượt 10/10 với đủ 10 câu. Nếu chưa đạt, hệ thống giữ bài đó làm bước tiếp theo.
- Khi chưa có danh mục Bài học chính thức cho một lớp/môn, giao diện không tự suy đoán tên Bài; học sinh được báo rõ và tiếp tục luyện theo Chủ đề hiện có.
- Không thay đổi dữ liệu, schema, RLS, API key hoặc quyền Supabase trong lượt này.
- Không đưa nội dung Tiếng Việt 4 hay các cấp lớp khác vào danh mục trước khi có tài liệu tương ứng.
- Các mục “Một số thuật ngữ dùng trong sách” không phải Bài học nên không được đưa vào danh mục.

## Danh mục và định danh

Danh mục nằm trong `app.constants.lessonCatalog['4'].math`, phân theo `hk1`/`hk2`, rồi theo Chủ đề. Mỗi bài có `id` ổn định, `label` hiển thị và `page` tham chiếu mục lục. `id` dùng dạng `g4-math-hk{n}-b{nn}` và không phụ thuộc vào vị trí hiển thị.

Metadata Bài học của câu hỏi và nhiệm vụ được lưu trong cấu trúc dữ liệu hiện có: câu hỏi lồng trong đề giữ metadata trực tiếp; template giữ trong `config.lesson`; metadata cần đồng bộ riêng của câu hỏi/nhiệm vụ dùng `game_settings.data.lessonMetadata`. Mốc mở lộ trình dùng `game_settings.data.lessonReleaseByClass`. Không thêm cột Supabase trong lượt này.

## Luật hợp lệ

- Bài học chỉ hợp lệ khi lớp là `Lớp 4`, môn là `Toán`, học kỳ và Chủ đề khớp danh mục.
- Một câu hỏi/template không có Bài học vẫn hợp lệ để giữ tương thích dữ liệu cũ.
- Cấp lớp/môn khác không được nhận giá trị Bài học của Toán 4.
- Khi Admin chọn một Chủ đề, các Bài học con tương ứng mới được hiển thị; đổi kỳ, lớp hoặc môn phải làm mới danh sách.
- Bộ lọc Bài học trống nghĩa là không giới hạn theo Bài học trong thao tác tạo đề/nhiệm vụ.
- Mốc mở Bài học trống nghĩa là chưa có cấu hình giáo viên; với danh mục chính thức hệ thống chỉ mở Bài 1, còn lộ trình theo Chủ đề vẫn chịu các khóa Chủ đề/quy tắc tiến độ cũ nếu có.

## Tích hợp Admin

- Kho câu hỏi, nhập/xuất mẫu và xuất dữ liệu có cột Bài học.
- Form soạn câu hỏi có trường Bài học điều kiện.
- Kho template lưu và lọc Bài học trong `config`.
- Soạn đề có bộ lọc Bài học theo Chủ đề và trường Bài học ở từng câu; tự động tạo đề chỉ bốc trong phạm vi đã chọn.
- Soạn nhiệm vụ có thể gắn lớp, kỳ, Chủ đề và Bài học.
- Điều chỉnh có khu vực **Mở bài cho lớp học** để chọn lớp, môn, học kỳ và Bài cuối cùng được mở.
- Giao diện học sinh hiển thị một thẻ nhiệm vụ tiếp theo, tóm tắt `đã vững/tổng số bài đã mở`, lộ trình thu gọn và nút xem đầy đủ.

## Tiêu chí chấp nhận

1. Danh mục có đúng 13 Chủ đề và 73 Bài học theo hai tập SGK Toán 4.
2. Admin chọn `Lớp 4 → Toán → Học kỳ → Chủ đề` thì thấy đúng các Bài học con.
3. Admin có thể lưu/lọc metadata Bài học trong câu hỏi, template, đề và nhiệm vụ mà không làm hỏng dữ liệu cũ.
4. Giao diện luyện tập của học sinh hiển thị bài tiếp theo bằng một thao tác, không bắt buộc chọn Chủ đề/Bài thủ công.
5. Học sinh không thể chọn bài vượt quá mốc Admin đã mở và không bị suy đoán Bài học ở lớp/môn chưa có danh mục.
6. Contract test, kiểm thử browser ở laptop/tablet ngang và toàn bộ hồi quy đều xanh.

## Kiểm thử và bàn giao

- Contract test kiểm tra danh mục, số lượng, quan hệ Chủ đề–Bài học và luật chỉ hỗ trợ Toán 4.
- Browser test kiểm tra hiển thị có điều kiện trong Admin, lộ trình một chạm của học sinh và giới hạn không vượt mốc giáo viên.
- Chạy toàn bộ `test_*.cjs`, sau đó `npm test`, kiểm tra diff và commit trên nhánh riêng.
- Chỉ merge khi Codex đã review, các lỗi bắt buộc đã xử lý, kiểm thử xanh và người dùng đã cho phép, theo `docs/AI_WORKFLOW.md`. Kimi review chỉ thực hiện khi người dùng yêu cầu rõ ràng.
- Không triển khai Supabase khi chưa có chấp thuận riêng của người dùng cho đúng dự án và phạm vi thay đổi.

