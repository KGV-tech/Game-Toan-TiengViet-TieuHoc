# Luyện nhanh Tiếng Việt 4 học kì I

## Phạm vi

- 10 template kỹ năng, 3 tương tác hiện tại: trắc nghiệm, đúng/sai và đối chiếu. Phân nhóm một ô và điền từ dùng nút trắc nghiệm; không dùng ô xổ xuống. Kéo thả chỉ phù hợp khi có nhiều ô đích để phân dữ liệu, chưa áp dụng cho bộ hiện tại.
- Mỗi câu chính có đúng 2 câu con độc lập, mỗi câu con đúng được 0,5 điểm.
- Không sinh tự luận, viết đoạn, nghe–nói, so sánh hoặc chuỗi quy luật.
- Chỉ học kì I, đúng bộ Kết nối tri thức với cuộc sống. Bài sau có thể ôn ngữ liệu đã học; đây không phải ngân hàng riêng đầy đủ cho từng bài.
- Ngân hàng có **93 câu con**: giữ 33 câu đã duyệt và bổ sung 60 câu, 6 câu cho mỗi kỹ năng. Không ghép từ ngẫu nhiên, không gọi AI/Internet khi học sinh đang chơi.

## Nguồn và cách kiểm chứng

Nguồn nội dung: PDF *Tiếng Việt 4 tập một*, Nhà xuất bản Giáo dục Việt Nam, người dùng cung cấp; 150 trang PDF, số trang PDF = trang in + 1. SHA-256: `feb7517458e487865c262da2ab1b58e82306a2d2d8a3771b9302c8a729e3df71`.
[Trang nhận diện sách của NXB](https://taphuan.nxbgd.vn/tap-huan/chi-tiet-sach/tieng-viet-4-tap-mot-939811319.939811319).
Đối chiếu bằng ảnh trang PDF, không lấy kết quả tìm kiếm hoặc trang giải bài làm đáp án.

VBT tập một dùng đối chiếu dạng bài, không coi là từ điển hay đáp án chính thức. SHA-256: `60108f2dc916a5b52087701faf67d11a9c2a83b7875ab2246d08dfd4f8699c46`. File có trang đảo/lặp; dùng số trang in khi đối chiếu.

Chưa tra được các mục từ ở Vietlex: không gắn nhãn “đã kiểm chứng Vietlex”, không dùng website pháp luật vietlex.vn. Các nghĩa từ hiện phát hành có chú giải trực tiếp trong SGK. Không dùng trang hướng dẫn tra từ điển làm bằng chứng cho một nghĩa từ cụ thể.

| Template | Mở từ bài | Nguồn trang in | Cách xác định đáp án |
| --- | --- | --- | --- |
| TV01 Từ loại | 1; động từ 9; tính từ 21 | 9–10, 41, 95 | Xét từ trong câu; tuân theo định nghĩa và ngữ cảnh của SGK |
| TV02 Phân nhóm | 1 | 9–10 | Học sinh / bàn / gió / năm học theo bốn nhóm danh từ |
| TV03 Viết hoa | 3 | 18 | Hà Nội, Cần Thơ, Chu Văn An, Trần Thị Lý theo mẫu trong sách |
| TV04 Ghép nghĩa | 2; bổ sung 12, 15, 21 | 13, 52, 64, 94 | Chú giải tiết tấu, vi-ô-lông, cla-ri-nét, gia tộc, thung, đế |
| TV05 Điền từ | 1 | 9–10 | Lựa chọn đóng; nêu rõ nhóm danh từ để loại khả năng điền nhiều đáp án |
| TV06 Nhân hoá | 17 | 78–79 | “anh” gọi chuồn ớt; cây dừa “sải tay”, “bơi” |
| TV07 Dấu gạch ngang | 27 | 119 | Lời Đốm hỏi; danh sách loài vật; liên danh Sài Gòn – Gia Định |
| TV08 Chi tiết đọc | 1 | 9 | Thông tin nêu trực tiếp trong đoạn hiển thị |
| TV09 Nhân vật–chi tiết | 2 | 13 | Thầy vàng anh / các học trò trong Thi nhạc |
| TV10 Câu chủ đề | 1 | 10–11 | Đoạn chuẩn bị khiêu vũ: câu chủ đề và ý chính |

## Bốn phạm vi bắt buộc trước phát hành

1. **Chương trình:** đúng sách, đúng kỹ năng, đúng bài bắt đầu.
2. **Từ ngữ:** đọc toàn bộ câu dẫn, ngữ liệu, mọi lựa chọn và lời giải; kiểm tra dấu, viết hoa, cách dùng từ/cụm từ. Từ đa nghĩa phải gắn nghĩa cụ thể; không phân loại chỉ dựa vào từ đứng riêng.
3. **Ngữ cảnh:** lưu đoạn nguồn `evidence.excerpt`, trang và quy tắc áp dụng. Câu hỏi chuyển thành tương tác đóng phải giữ đúng nghĩa. Không diễn giải câu mới thành “trích nguyên văn”.
4. **Đáp án và phương án nhiễu:** mỗi lựa chọn có `optionReasons` giải thích vì sao phù hợp hoặc không phù hợp. Với bài viết hoa, dạng viết sai là phương án nhiễu có chủ đích.

`textbook-context` nghĩa là nội dung được đối chiếu ngữ cảnh trong sách; câu dẫn/lời giải có thể do biên soạn. `textbook-glossary` nghĩa là nghĩa từ có chú giải trực tiếp. Dẫn quy tắc đơn thuần không đạt điều kiện phát hành.

Review hiện tại do Codex đọc ảnh trang nguồn và rà soát toàn bộ cách diễn đạt. **Không phải chứng nhận của giáo viên/NXB, cũng không phải bằng chứng đã tra riêng từng tiếng trong từ điển.** Tách từng tiếng tiếng Việt rồi tra độc lập không chứng minh được nghĩa của từ ghép/cụm từ trong câu. Khi một từ/cách hiểu chưa có căn cứ đủ rõ, giữ câu chưa duyệt thay vì suy đoán để cho đủ số lượng.

## Cơ chế kiểm tra trong ứng dụng

- `content.js`: bản ghi đóng gồm câu hỏi, đáp án, lựa chọn, giải thích, đoạn đọc, bài bắt đầu, trang/đoạn nguồn và lý do từng lựa chọn.
- `reviewed-content.js`: bản chụp nội dung sau review và bốn phạm vi đã kiểm tra. Không có cơ chế tự duyệt câu mới hoặc tự cập nhật snapshot.
- `verification.js`: từ chối bản ghi chưa duyệt, thiếu phạm vi, chỉ có dẫn quy tắc, sai nguồn/trang, thiếu lý do lựa chọn, chưa đến bài học hoặc bị đổi nội dung sau duyệt.
- Snapshot khóa toàn bộ cách diễn đạt, ngữ cảnh và căn cứ; chỉ được đảo thứ tự lựa chọn/nhãn a–b. **So khớp snapshot bảo vệ kết quả review, không tự chứng minh ngữ nghĩa đúng.**
- Generator cần ít nhất hai mục hợp lệ có cùng đoạn đọc; các mục không có đoạn đọc phải tự đủ ngữ cảnh trong câu dẫn. Không ghép hai câu từ hai đoạn khác nhau. Nếu thiếu thì báo chưa đủ nội dung; không dùng câu nháp bù vào.
- Registry kiểm tra môn/lớp/học kì/chủ điểm, template, hai ID khác nhau, đoạn đọc và đáp án tổng hợp.
- Câu từ server chưa đạt kiểm chứng không được dùng trong lượt luyện nhanh Tiếng Việt lớp 4; không sửa hoặc xoá dữ liệu server.
- Trang quản trị hiển thị nguồn, trích đoạn và lý do từng lựa chọn để kiểm tra lại.

Điểm tính bằng mảng hai đáp án, không tách theo dấu phẩy. Chuẩn hoá Unicode NFC/khoảng trắng nhưng giữ dấu và hoa/thường. Không dùng so khớp gần đúng. Mỗi câu chỉ ghi điểm một lần. Lựa chọn hỗ trợ bấm/chạm/bàn phím; matching cho phép tái sử dụng loại nghĩa nếu hợp lệ. Đáp án chọn sai có một gạch đỏ, lựa chọn đúng và nhãn chữa bài dùng màu xanh như Toán. Đề kiểm tra Tiếng Việt dùng radio theo từng ý; lưu/khôi phục đáp án vẫn là mảng hai giá trị.

Các câu phân nhóm/điền từ đã lưu có thể giữ nhãn loại cũ; chỉ chấp nhận hai nhãn cũ đúng template tương ứng, vẫn kiểm chứng toàn bộ nội dung và hiển thị bằng lựa chọn trực tiếp. Không sửa dữ liệu server.

## Mở rộng ngân hàng

1. Xác định bài/kỹ năng và mục từ/nghĩa cần dùng.
2. Mở SGK/SGV chính thức hoặc từ điển uy tín đúng ấn bản; lưu trang/mục từ, đoạn nguồn và ngữ cảnh.
3. Review mọi từ/cụm từ trong toàn bộ câu, không chỉ đáp án đúng; ghi lý do từng lựa chọn. Chặn trường hợp có nhiều cách hiểu hợp lý.
4. Review độc lập trước khi thêm snapshot và đủ bốn phạm vi. Không sửa snapshot chỉ để làm test xanh.
5. Chạy kiểm thử nội dung, catalog, browser và toàn bộ `npm test`.

Bộ đầu tiên còn ít ngữ liệu nên có thể lặp trong nhiều lượt chơi. Trong một lượt, các cặp câu con được liệt kê trước khi chọn; đảo a/b không được tính là câu mới. Bài 1 có đủ 10 cặp khác nhau. Mở rộng phải theo quy trình trên, không sinh tự do rồi coi AI tự chấm là nguồn xác thực.

## Ghi nhận tự review ngày 05/10/2026

### Đợt mở rộng 60 câu con

- Mỗi kỹ năng có thêm 6 bản ghi mới; đảo lựa chọn hoặc nhãn a/b không tính là câu mới. Khóa cả 60 bản ghi sau review độc lập đủ bốn phạm vi.
- [Khảo sát nguồn](VIETNAMESE_EXPANSION_SOURCES.md) ghi rõ nguồn chính thức, nguồn cộng đồng và giới hạn truy cập. Tài liệu Violet chỉ giúp tìm đầu mối; đáp án dựa trên trang SGK đã đọc. Chưa đọc toàn bộ SGV hoặc tra được từng mục từ Vietlex.
- [Biên bản review](VIETNAMESE_EXPANSION_REVIEW.md) đối chiếu từng ID với nguồn. Đã sửa hai lỗi: trích đúng “có vẻ chật chỗ”, và đặt “lả chả” trong ngữ cảnh ví ý văn với sương. Review lại không còn lỗi bắt buộc; giáo viên duyệt ở bước sau.
- Bổ sung kiểm thử đủ 60 bản ghi, bài bắt đầu, ghép cùng ngữ cảnh, chấm 0,5 điểm, ngữ liệu dài nhất và giới hạn khung chơi ở 1280×720, 1440×900, 1024×768. Ô chọn từ có vùng chạm tối thiểu 44 px; đoạn đọc chế độ sáng được kiểm tra tương phản.
- Bảng nguồn bên trên mô tả 33 câu khởi đầu; bảng đầy đủ của 60 câu bổ sung nằm trong biên bản review.
- Test lịch sử/đề thi kiểm tra chính đoạn nguồn của câu được chọn, thay vì giả định mọi câu nhân vật đều có “Thầy vàng anh”; vẫn giữ kiểm tra lưu đáp án, điểm và từ chối nội dung bị sửa.
- Cổng cuối `npm test` đạt toàn bộ hợp đồng Node và 345/345 ca Chromium. Lần đầu có hai lỗi không ổn định ở test ảnh nền thi đua; cả hai đạt khi chạy riêng và trong cổng cuối, không sửa mã thi đua.

### Ngân hàng khởi đầu và cơ chế bảo vệ

- Đã thay ngân hàng nháp chỉ dẫn quy tắc bằng 33 mục có đoạn nguồn; khóa cả phương án nhiễu và ngữ cảnh sau review.
- Sửa trường hợp bốc ngẫu nhiên báo thiếu câu dù có đủ tổ hợp; kiểm thử bắt đầu lượt bài 1 với nguồn ngẫu nhiên cố định.
- Lưu đáp án ghép dưới dạng mảng, tránh tách nhầm dấu phẩy; giữ điểm từng ý khi hiển thị kết quả và lịch sử.
- Lá Chắn không cộng điểm cho ý sai trong bộ luyện Tiếng Việt; chặn nộp hai lần.
- Chặn trường diễn đạt chưa kiểm chứng, nhãn câu con sai, ngữ liệu bị đổi khi chấm/hiển thị đề và preview.
- Review độc lập Standards tìm được một lỗi P1: trường cấp câu hỏi như `sharedPrompt`/`imageUrl` có thể thêm nội dung ngoài snapshot. Đã khóa danh sách trường cấp câu hỏi; kiểm thử hồi quy đỏ trước sửa, xanh sau sửa. Review lại xác nhận không còn finding bắt buộc.
- Review độc lập Spec đối chiếu toàn bộ 33 mục với ảnh trang in 9, 10, 13, 18, 41, 52, 64, 78, 79, 94, 95 và 119; kiểm tra SHA-256 và bài bắt đầu. Kết quả: 0 finding đã xác nhận. Đây là review Codex, chưa có Kimi hay chứng nhận của giáo viên/NXB.
- Kiểm thử thi đua tuần cũ đọc số request trước khi browser lock hoàn thành; tái hiện với `main.js` ở commit nền. Chỉ sửa test chờ đủ hai RPC, giữ kiểm tra ID và dữ liệu; không sửa hành vi thi đua.
- Kiểm thử lưu tổ chờ form đóng sau khi lưu bất đồng bộ hoàn tất rồi mới đọc thành viên; giữ nguyên các kiểm tra dữ liệu và hành vi thi đua.
