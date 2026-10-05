# Template Tiếng Việt có tham số

Yêu cầu được người dùng xác nhận ngày 05/10/2026: xây lại bộ sinh từ template có tham số, thay cơ chế chọn cặp câu cố định. Giữ lớp 4 HKI, nguồn SGK đã kiểm chứng, hai ý × 0,5 điểm và cách chọn/chữa bài hiện tại.

## Mục tiêu và tiêu chí

- Dữ liệu ngôn ngữ lưu từ/nghĩa/thuộc tính/quan hệ/đoạn nguồn; không lưu câu dẫn hoàn chỉnh làm đầu vào bộ sinh mới.
- Template có các phép tạo nhiệm vụ: phân loại, tìm từ theo loại, điền từ trong câu, viết hoa, ghép nghĩa hai chiều, nhận diện nhân hoá, công dụng dấu, truy xuất chi tiết và câu chủ đề.
- Câu văn mới chỉ được dựng từ khung ngữ pháp và các cặp chủ thể–hoạt động tương thích đã review. Ghi rõ câu luyện tập được tạo, không gọi là trích SGK. Câu đọc hiểu giữ văn bản nguồn.
- Đáp án và phương án nhiễu được tính từ thuộc tính dữ liệu. Chặn nhóm có nhiều đáp án đúng, từ chưa học và tham số không hợp lệ.
- Có dấu vết pattern/atom/tham số. Validator dựng lại câu từ dấu vết và so toàn bộ nội dung; sửa câu/đáp án/lựa chọn/nguồn đều bị chặn.
- Chống lặp theo từ mục tiêu, dữ kiện, ngữ cảnh và nhiệm vụ, giữa các lượt và riêng từng tài khoản. Đảo lựa chọn không tính là nội dung mới. Khi hết từ/ngữ liệu hợp lệ mới quay vòng; không hứa sinh vô hạn.
- Mười kỹ năng dùng bộ sinh mới trong luyện tập và catalog/đề kiểm tra. Câu cũ vẫn đọc/chấm được qua kiểm chứng cũ, không dùng làm pool luyện mới.

## Tệp và hợp đồng

`parameter-corpus.js`: ngữ liệu nguyên tử và nguồn, tách khỏi 93 câu cũ.
`parameter-engine.js`: khung sinh, dấu vết và kiểm chứng dựng lại.
`parameter-history.js`: chọn lượt đa dạng, nhớ nội dung đã hiển thị trên máy; không gửi dữ liệu lên server.
`index.js`: giữ API catalog, chuyển sinh mặc định sang engine; validator hỗ trợ câu cũ.
`main.js`: gọi chọn lượt mới và ghi nhận câu thực sự được hiển thị, không refactor luồng môn Toán.

JavaScript thuần theo IIFE và API đóng băng hiện có. Ví dụ tham số `{ pattern: 'sentence-class', actorId: 'human-0', actionId: 'verb-5', role: 'action' }` dựng “Học sinh đang đi.” và tính đáp án “Động từ”; đổi chủ thể, hoạt động hoặc vai trò tạo nhiệm vụ mới. Đáp án tra nhãn ngôn ngữ hoặc quan hệ của atom, không lấy câu dẫn của bản ghi câu hỏi có sẵn.

API nhận tham số tường minh qua `generateQuestion(templateId, { lesson, parameters: [thamSoA, thamSoB] })`. Khi không truyền, game chọn tham số tự động; lượt luyện dùng `generateForHistory` để ưu tiên nội dung mới. Tham số ngoài miền, sai bài hoặc hai ý tiết lộ đáp án cho nhau bị từ chối.

## Miền sinh và giới hạn đã triển khai

- 92 atom ngữ liệu và 36 cặp chủ thể–hoạt động hợp lệ. Bài 32 có 307 cấu hình câu con ở mười kỹ năng, chưa tính đảo lựa chọn. Đây là miền hữu hạn; không phải 307 từ khác nhau hoặc cam kết sinh vô hạn.
- Ghép nghĩa có hai chiều; chi tiết đọc và nhân vật có truy xuất giá trị hoặc trường thông tin. Không ghép xuôi–ngược cùng một dữ kiện thành hai câu con, vì chúng tiết lộ đáp án cho nhau. Câu chủ đề/vị trí hỏi hai thuộc tính riêng trong cùng đoạn.
- Lượt chơi chọn từng tham số theo độ mới của từ, nhiệm vụ và ngữ cảnh rồi mới ghép hai ý tương thích; không chọn cặp cố định trong ngân hàng. Các kỹ năng luân phiên. Trong từng kỹ năng, ưu tiên từ chưa gặp, tiếp đó nhiệm vụ mới; khi hết miền mới, ưu tiên nội dung lâu chưa gặp.
- Lịch sử tối đa 512 mục mỗi loại, theo tài khoản trên trình duyệt hiện tại; chỉ ghi câu đã hiển thị. Không đồng bộ sang máy khác. Xoá dữ liệu trình duyệt sẽ mất lịch sử này; lỗi lưu trữ dùng bộ nhớ phiên.
- Các quan hệ đọc/nhân vật/nghĩa lấy giá trị và ngữ cảnh từ dữ kiện nguồn đã review; không viết thêm câu hỏi cố định. Các khung biên soạn được đánh dấu rõ. Mở rộng từ mới cần thêm atom hoặc ma trận đã review, không cần chép thêm câu hỏi/đáp án hoàn chỉnh.
- Review nguồn là đối chiếu SGK và phân tích khung; chưa phải chứng nhận từ điển từng mục hay duyệt giáo viên. Không suy diễn mọi tổ hợp từ đều đúng. `reviewStatus` chặn corpus chưa duyệt; các cấu trúc cache đóng băng và validator dựng lại toàn bộ câu sinh.
- Động từ lấy từ nhãn tranh được dùng trong câu biên soạn có chủ thể, không dùng danh sách từ rời để phân loại từ đa nghĩa hoặc điền khuyết. Điền khuyết có gợi ý nhóm nghĩa/từ loại và phương án nhiễu khác nhãn, tránh hai từ cùng hợp ngữ cảnh; không in sẵn từ cần điền trong câu dẫn.

## Thực hiện và kiểm thử

1. Nghiên cứu/review ngữ liệu và các phép kết hợp; thêm corpus.
2. Viết test đỏ cho sinh với tham số, đổi từ/ngữ cảnh/nhiệm vụ, đáp án duy nhất và chặn sửa dấu vết; triển khai engine.
3. Thêm lịch sử từ/ngữ cảnh theo tài khoản và test nhiều lượt với nguồn ngẫu nhiên cố định.
4. Tích hợp catalog, gameplay và đề kiểm tra; kiểm tra sáng/tối, laptop/tablet, lưu/khôi phục và câu cũ.
5. Review độc lập Spec/Standards, chạy `node test_vietnamese_parameter_generation.cjs`, các Playwright liên quan và `npm test`, push PR và merge theo quyền bàn giao của repo.

Không thay Supabase, không thêm dependency, không mở thêm luồng login. Không dùng từ điển/AI thời gian thực để tự chứng nhận đáp án. Mở rộng ngữ liệu mới vẫn cần review nguồn và khung sinh, nhưng không viết thêm ngân hàng câu hỏi hoàn chỉnh.

Kiểm chứng bàn giao 05/10/2026: `npm test` đạt toàn bộ hợp đồng Node và 350 Playwright Chromium; sau chỉnh nhãn nguồn cho câu biên soạn, chạy lại 14 kiểm thử Tiếng Việt liên quan, đều đạt. Đã xem ảnh 1280×720 và 1024×768; test cũng kiểm tra 1440×900 sáng/tối, biên khung, điểm, lưu/khôi phục và tài khoản riêng. Chrome DevTools MCP không cấu hình; dùng Playwright. `npm audit --package-lock-only --ignore-scripts --json` trả 0 lỗ hổng, không thay dependency.
