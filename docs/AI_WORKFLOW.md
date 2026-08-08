# Quy trình chung: Codex, Kimi và Playwright

## Vai trò

| Công cụ | Trách nhiệm |
| --- | --- |
| Codex | Phân tích, viết/sửa code, viết test, chạy test, commit và chuẩn bị thay đổi. |
| Kimi | Review độc lập: chỉ ra lỗi có bằng chứng, đánh dấu mức độ và không tự sửa repo. |
| Playwright | Tester trình duyệt: kiểm tra luồng người dùng, giao diện, console và lỗi runtime. |
| Người dùng | Chọn phạm vi, xác nhận thao tác có ảnh hưởng Supabase/production, duyệt merge. |

## Vòng làm việc cho mỗi thay đổi

1. **Mô tả việc cần làm**: nêu mục tiêu, tiêu chí hoàn thành và giới hạn.
   Với UI/UX, nêu rõ ưu tiên laptop/tablet theo `docs/UX_DEVICE_POLICY.md`; không tự mở rộng phạm vi sang tối ưu điện thoại.
2. **Codex sửa phạm vi nhỏ**: đọc tệp liên quan, thêm test khi thay đổi hành vi, chạy test.
3. **Codex push nhánh**: commit rõ mục đích; không tự merge nếu chưa có yêu cầu.
4. **Kimi review**: dùng mẫu tại `docs/KIMI_REVIEW_PROMPT.md`, cung cấp URL commit cố định và diff/tệp liên quan.
5. **Codex xác minh review**: chỉ sửa finding có bằng chứng; không sửa theo suy đoán.
6. **Playwright kiểm thử**: chạy checklist tại `docs/PLAYWRIGHT_TESTING.md` khi Playwright đã được thiết lập.
7. **Merge**: chỉ khi các lỗi bắt buộc đã xử lý, test xanh và người dùng đồng ý.

## Quy tắc báo cáo

- Finding bắt buộc phải gồm: mức độ, tệp/đoạn liên quan, bằng chứng, cách tái hiện và đề xuất sửa.
- Phân biệt rõ `Đã xác nhận`, `Cần kiểm tra thêm` và `Gợi ý`.
- Không gọi kết quả là “đã test browser” khi mới chạy test Node.
- Khi Kimi review nhầm phiên bản, dùng URL dạng `.../tree/<commit-sha>` và các URL `raw` của tệp cần review.
- Finding chỉ liên quan điện thoại phải được ghi là ngoài phạm vi ưu tiên, không phải lỗi bắt buộc, trừ các ngoại lệ nêu trong `docs/UX_DEVICE_POLICY.md`.

## Tiêu chí hoàn thành

- Phạm vi thay đổi rõ ràng; không có thay đổi ngoài ý muốn.
- Kiểm thử liên quan và toàn bộ `test_*.cjs` đạt.
- Kimi không còn lỗi bắt buộc sửa, hoặc người dùng chấp nhận rủi ro đã ghi rõ.
- Playwright/check thủ công hoàn thành cho luồng giao diện bị ảnh hưởng.
- Không có secrets hay dữ liệu học sinh trong commit, prompt hoặc báo cáo.
