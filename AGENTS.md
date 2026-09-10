# Hướng dẫn làm việc cho AI trong repo này

## Đọc trước khi làm việc

1. Đọc `docs/PROJECT_CONTEXT.md` để hiểu cấu trúc game và các giới hạn an toàn.
2. Đọc `docs/AI_WORKFLOW.md` để theo quy trình Codex tự review → kiểm thử → bàn giao; Kimi chỉ dùng khi người dùng yêu cầu.
3. Đọc `docs/UX_DEVICE_POLICY.md` trước mọi thay đổi/review UI để ưu tiên đúng thiết bị.
4. Chỉ mở các tệp liên quan trực tiếp đến yêu cầu hiện tại; không đoán khi chưa có bằng chứng.

## Công nghệ và tệp chính

- Game chạy bằng HTML, CSS và JavaScript thuần; `package.json` chỉ phục vụ các script kiểm thử Playwright/Node, không có framework build riêng.
- Điểm vào giao diện: `index.html`; logic chính: `src/main.js`; giao diện: `src/style.css`.
- Câu hỏi lớp 4: `src/question-templates/grade-4/`.
- Dữ liệu và xác thực dùng Supabase qua trình duyệt.

## Quy tắc an toàn bắt buộc

- Không chạy `supabase_rls.sql`: đây là tệp đã ngưng dùng và chỉ còn hướng dẫn.
- Chỉ dùng `supabase_auth_security.sql` khi người dùng xác nhận triển khai vào đúng dự án Supabase.
- Các script vá một lần đã được xóa khỏi repo; không thêm lại chúng vào quy trình phát triển.
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

Chạy toàn bộ kiểm thử (hợp đồng Node và Playwright Chromium):

```powershell
npm test
```

Playwright dùng Chromium headless và server tĩnh cục bộ tại `127.0.0.1:4173`. Test browser không được gọi Supabase thật.

Mọi thay đổi UI ưu tiên laptop và tablet ngang theo `docs/UX_DEVICE_POLICY.md`; điện thoại không phải nền tảng gameplay mục tiêu.

## Cách làm việc

1. Xác nhận phạm vi, tệp sẽ sửa và tiêu chí hoàn thành.
2. Viết hoặc cập nhật kiểm thử phù hợp trước thay đổi hành vi.
3. Sửa một phạm vi nhỏ, chạy các kiểm thử liên quan rồi chạy toàn bộ kiểm thử.
4. Codex tự review diff và xử lý các lỗi có bằng chứng, sau đó gửi commit lên nhánh riêng.
5. Chỉ merge vào `main` khi các lỗi bắt buộc đã xử lý, kiểm thử xanh và người dùng đã cho phép.

## Quy trình skill trước commit

Trước khi triển khai, review hoặc commit bất kỳ thay đổi nào, đọc và làm theo
[`docs/MATT_POCOCK_WORKFLOW.md`](docs/MATT_POCOCK_WORKFLOW.md). Bộ skill Matt Pocock
được khóa trong `skills-lock.json` và cài tại `.agents/skills/`; chỉ dùng những skill
phù hợp với phạm vi thay đổi, không gọi toàn bộ bộ skill theo thói quen.

- Đặc tả/khám phá: `to-spec`, `wayfinder`, `codebase-design`, `research` khi cần.
- Triển khai: `implement` hoặc `implement-spec`, theo lát nhỏ và có test.
- Lỗi/test: `tdd`, `diagnosing-bugs`, `triage` khi phù hợp.
- Review trước commit: `code-review`, `code-review-and-quality`, `code-simplification`,
  cùng review bảo mật/UI/performance nếu thay đổi chạm các phạm vi đó.
- Skill bổ trợ của môi trường Codex: `frontend-design`, `frontend-ui-engineering`,
  `browser-testing-with-devtools`, `security-and-hardening`, `performance-optimization`
  và `documentation-and-adrs`; xem cách kết hợp trong workflow.
- Git: `git-workflow-and-versioning`; chỉ stage đúng tệp thuộc phạm vi và không tự merge
  `main` nếu chưa có yêu cầu rõ ràng.

Các quy ước GitHub issue tracker, triage label và tài liệu domain nằm trong
`docs/agents/`.

## Chính sách Kimi review — cập nhật 09/09/2026

- Mặc định bỏ qua Kimi review cho mọi công việc tiếp theo. Chỉ thực hiện khi người dùng yêu cầu rõ ràng; một yêu cầu review chỉ áp dụng cho phạm vi được chỉ định, không tự bật lại cho các công việc sau.
- Không tự gửi code/ảnh sang Kimi, không yêu cầu đăng nhập và không chờ Kimi APPROVE để bàn giao hoặc merge. Không hỏi lại người dùng có muốn bỏ qua Kimi hay không.
- Codex tự review, kiểm thử Node/Playwright và các giới hạn an toàn vẫn áp dụng theo `docs/AI_WORKFLOW.md`.

Xem checklist browser tại `docs/PLAYWRIGHT_TESTING.md`. Mẫu `docs/KIMI_REVIEW_PROMPT.md` được giữ để dùng khi người dùng yêu cầu Kimi review.
