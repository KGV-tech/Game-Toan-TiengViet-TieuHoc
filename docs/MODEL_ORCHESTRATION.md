# Quy trình phối hợp Sol-High và Luna-Max

## Mặc định áp dụng

Mọi yêu cầu thay đổi, sửa lỗi, xây dựng UI hoặc logic cho game này chạy theo chu trình:

`Sol-High (plan) → Luna-Max (implement) → Sol-High (review) → Luna-Max (fix) → Sol-High (verify)`

Lặp lại các vòng review/fix cho đến khi không còn finding bắt buộc và Definition of Done trong `docs/AI_WORKFLOW.md` đạt. Với việc chỉ hỏi thông tin hoặc chỉ đọc/review không cần sửa, bỏ qua lượt Luna.

## Vai trò từng model

### Sol-High — architect/reviewer

- Đọc context và yêu cầu, xác định mục tiêu, phạm vi file, giả định, rủi ro và tiêu chí hoàn thành.
- Lập plan theo lát nhỏ, chỉ rõ test cần thêm/chạy và checkpoint UI cần kiểm tra.
- Sau mỗi lượt Luna, review diff và bằng chứng test theo các trục: correctness, logic/edge case, UI/UX laptop-tablet, accessibility, runtime browser, security, performance, scope và maintainability.
- Mỗi finding phải có mức độ, file/đoạn liên quan, bằng chứng, cách tái hiện và đề xuất sửa.
- Nếu không còn lỗi bắt buộc, xác nhận `READY` và nêu các rủi ro còn lại; không tự sửa code trong vai trò review.

### Luna-Max — implementer

- Thực hiện đúng plan và chỉ trong phạm vi được giao.
- Viết/cập nhật test trước hoặc cùng thay đổi behavior; sửa code/UI theo lát nhỏ.
- Chạy test liên quan, rồi test đầy đủ phù hợp; với UI phải kiểm tra desktop và tablet ngang.
- Xử lý từng finding Sol có bằng chứng, cập nhật kết quả và không tự mở rộng phạm vi.

## Giao thức chuyển lượt

Mỗi lượt phải truyền cho model kế tiếp: mục tiêu, plan/finding hiện tại, file đã chạm, diff hoặc trạng thái git, test đã chạy và kết quả, giới hạn Supabase/production, cùng việc còn lại. Sol không được đánh giá dựa trên mô tả; phải đọc diff và bằng chứng. Luna không được coi plan là đã hoàn thành nếu chưa chạy verify.

## Cổng dừng

- Dừng và hỏi người dùng nếu thiếu quyết định làm thay đổi đáng kể phạm vi, cần thao tác Supabase/production, thiếu quyền, test thất bại do môi trường, hoặc có xung đột.
- Không chạy Kimi trừ khi người dùng yêu cầu rõ ràng.
- Không merge `main` chỉ vì Sol báo `READY`; vẫn tuân thủ quyền merge và quy trình Git hiện hành.

## Áp dụng trong Codex

Khi môi trường hỗ trợ tạo subagent, dùng custom agent `sol_high` từ `.codex/agents/sol-high.toml` (model `gpt-5.6-sol`, reasoning `high`) cho các lượt Sol và custom agent `luna_max` từ `.codex/agents/luna-max.toml` (model `gpt-5.6-luna`, reasoning `max`) cho các lượt Luna. Nếu không thể tạo/đổi model trong cùng task, giữ nguyên giao thức bằng các lượt độc lập theo đúng thứ tự và ghi rõ model thực tế đã chạy; không giả vờ đã dùng model chưa được cấp.
