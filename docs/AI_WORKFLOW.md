# Quy trình chung: Codex và kiểm thử

## Chính sách review — cập nhật 09/09/2026

Theo yêu cầu người dùng, **mặc định bỏ qua Kimi review cho mọi công việc tiếp theo**. Quy định này thay thế các yêu cầu trước đây về vòng Codex → Kimi → Codex → Playwright và việc chờ Kimi duyệt trước khi merge.

- Chỉ thực hiện Kimi review khi người dùng yêu cầu rõ ràng, trong đúng phạm vi được chỉ định. Một yêu cầu review không tự bật lại Kimi cho công việc sau.
- Không tự gửi code/ảnh, yêu cầu đăng nhập, chờ APPROVE hoặc hỏi lại có bỏ qua Kimi hay không khi người dùng chưa yêu cầu dùng Kimi.
- Codex tự review, kiểm thử và các giới hạn an toàn vẫn áp dụng. Mẫu `docs/KIMI_REVIEW_PROMPT.md` được giữ để dùng khi có yêu cầu.

## Vai trò

| Công cụ | Trách nhiệm |
| --- | --- |
| Codex | Phân tích, viết/sửa code, tự review diff, viết/chạy test, commit và chuẩn bị thay đổi. |
| Playwright | Tester trình duyệt: kiểm tra luồng người dùng, giao diện, console và lỗi runtime. |
| Kimi (khi người dùng yêu cầu) | Review độc lập đúng phạm vi/commit được chỉ định; chỉ ra lỗi có bằng chứng và không tự sửa repo. |
| Người dùng | Chọn phạm vi, xác nhận thao tác có ảnh hưởng Supabase/production, duyệt merge và yêu cầu Kimi review khi cần. |

## Vòng làm việc mặc định

1. **Mô tả việc cần làm**: nêu mục tiêu, tiêu chí hoàn thành và giới hạn.
   Với UI/UX, nêu rõ ưu tiên laptop/tablet theo `docs/UX_DEVICE_POLICY.md`; không tự mở rộng phạm vi sang tối ưu điện thoại.
2. **Codex sửa phạm vi nhỏ**: đọc tệp liên quan, thêm test khi thay đổi hành vi, chạy test.
3. **Codex tự review**: kiểm tra diff, tính đúng đắn, quyền truy cập, dữ liệu, hồi quy và phạm vi; chỉ sửa lỗi có bằng chứng.
4. **Kiểm thử**: chạy test liên quan rồi toàn bộ test; với luồng giao diện bị ảnh hưởng, dùng checklist tại `docs/PLAYWRIGHT_TESTING.md`.
5. **Codex push nhánh**: commit rõ mục đích; không tự merge nếu chưa có yêu cầu.
6. **Merge**: chỉ khi các lỗi bắt buộc đã xử lý, test xanh và người dùng đã đồng ý. Nếu đã có sự cho phép trong công việc hiện tại, không hỏi lại; không chờ Kimi khi người dùng chưa yêu cầu review.

## Khi người dùng yêu cầu Kimi review

1. Dùng mẫu tại `docs/KIMI_REVIEW_PROMPT.md`, cung cấp URL commit cố định và diff/tệp/ảnh liên quan trong phạm vi được yêu cầu.
2. Codex xác minh các finding, chỉ sửa lỗi có bằng chứng; chạy lại các kiểm thử phù hợp sau khi sửa.
3. Báo đúng kết quả và trạng thái review. Không coi Kimi đã review/APPROVE nếu chưa nhận được kết quả; việc không thực hiện Kimi trong các công việc khác không phải thiếu sót bàn giao.

## Quy tắc báo cáo

- Finding bắt buộc phải gồm: mức độ, tệp/đoạn liên quan, bằng chứng, cách tái hiện và đề xuất sửa.
- Phân biệt rõ `Đã xác nhận`, `Cần kiểm tra thêm` và `Gợi ý`.
- Không gọi kết quả là “đã test browser” khi mới chạy test Node.
- Khi một lượt Kimi review được yêu cầu đọc nhầm phiên bản, dùng URL dạng `.../tree/<commit-sha>` và các URL `raw` của tệp cần review.
- Finding chỉ liên quan điện thoại phải được ghi là ngoài phạm vi ưu tiên, không phải lỗi bắt buộc, trừ các ngoại lệ nêu trong `docs/UX_DEVICE_POLICY.md`.

## Tiêu chí hoàn thành

- Phạm vi thay đổi rõ ràng; không có thay đổi ngoài ý muốn.
- Kiểm thử liên quan và toàn bộ `test_*.cjs` đạt.
- Codex đã review; các lỗi bắt buộc đã được xử lý, hoặc người dùng chấp nhận rủi ro đã ghi rõ. Kimi chỉ tham gia khi được người dùng yêu cầu.
- Playwright/check thủ công hoàn thành cho luồng giao diện bị ảnh hưởng.
- Không có secrets hay dữ liệu học sinh trong commit, prompt hoặc báo cáo.
