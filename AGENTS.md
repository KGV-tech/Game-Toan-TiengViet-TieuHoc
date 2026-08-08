# Hướng dẫn làm việc cho AI trong repo này

## Đọc trước khi làm việc

1. Đọc `docs/PROJECT_CONTEXT.md` để hiểu cấu trúc game và các giới hạn an toàn.
2. Đọc `docs/AI_WORKFLOW.md` để theo đúng vòng Codex → Kimi → Codex → Playwright.
3. Chỉ mở các tệp liên quan trực tiếp đến yêu cầu hiện tại; không đoán khi chưa có bằng chứng.

## Công nghệ và tệp chính

- Game chạy bằng HTML, CSS và JavaScript thuần; không có `package.json` ở thư mục gốc.
- Điểm vào giao diện: `index.html`; logic chính: `src/main.js`; giao diện: `src/style.css`.
- Câu hỏi lớp 4: `src/question-templates/grade-4/`.
- Dữ liệu và xác thực dùng Supabase qua trình duyệt.

## Quy tắc an toàn bắt buộc

- Không chạy `supabase_rls.sql`: đây là tệp đã ngưng dùng và chỉ còn hướng dẫn.
- Chỉ dùng `supabase_auth_security.sql` khi người dùng xác nhận triển khai vào đúng dự án Supabase.
- Không chạy `fix.js`, `fix2.js`, `patch.js`, `patch_main.cjs`, `update.js` hoặc `update_note.js` nếu chưa xem nội dung và chủ động thêm `--allow-legacy-patch`.
- Không thêm, xóa, hoặc thay đổi dữ liệu Supabase; không đổi schema, RLS, API key hay quyền truy cập nếu chưa được người dùng chấp thuận rõ ràng.
- Không thêm dependency hay cài công cụ khi chưa kiểm tra dự án cần gì và báo cho người dùng.
- Không refactor lớn `src/main.js` cùng lúc với việc sửa lỗi/chức năng nhỏ.

## Kiểm thử hiện có

Chạy toàn bộ kiểm thử Node bằng PowerShell:

```powershell
$tests = Get-ChildItem -File -Filter 'test_*.cjs'
foreach ($test in $tests) {
  node $test.Name
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Các kiểm thử này là kiểm thử hợp đồng/tĩnh. Chúng không thay thế kiểm thử trong trình duyệt.

## Cách làm việc

1. Xác nhận phạm vi, tệp sẽ sửa và tiêu chí hoàn thành.
2. Viết hoặc cập nhật kiểm thử phù hợp trước thay đổi hành vi.
3. Sửa một phạm vi nhỏ, chạy các kiểm thử liên quan rồi chạy toàn bộ kiểm thử.
4. Gửi commit lên nhánh riêng; Kimi review đúng link commit không thay đổi.
5. Chỉ merge vào `main` khi review bắt buộc đã đạt và kiểm thử xanh.

Xem mẫu prompt Kimi tại `docs/KIMI_REVIEW_PROMPT.md` và checklist browser tại `docs/PLAYWRIGHT_TESTING.md`.
