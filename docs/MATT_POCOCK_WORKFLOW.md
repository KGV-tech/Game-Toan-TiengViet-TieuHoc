# Quy trình Matt Pocock trước commit và Pull Request

## Mục đích

Repo này dùng bộ skill từ `mattpocock/skills` như một quy trình chất lượng trước khi
đưa thay đổi lên GitHub. Bộ skill là hướng dẫn cho agent; nó không tự thay thế việc
chạy test, review diff hoặc quyết định của người dùng.

Phiên bản skill được khóa trong `skills-lock.json`. Khi làm việc, chỉ kích hoạt skill
phù hợp với rủi ro và phạm vi của task, không chạy cả 37 skill cho mọi thay đổi.

## Bản đồ kích hoạt

| Giai đoạn | Skill chính | Kết quả cần có |
| --- | --- | --- |
| Hiểu yêu cầu | `to-spec`, `wayfinder`, `grill-with-docs` | Mục tiêu, phạm vi và tiêu chí hoàn thành rõ ràng |
| Hiểu codebase | `wayfinder`, `codebase-design`, `domain-modeling`, `research` | Biết file/module/domain liên quan và quyết định hiện có |
| Triển khai | `implement` hoặc `implement-spec` | Một lát thay đổi nhỏ, có thể kiểm thử và rollback |
| Test trước/sau code | `tdd` | Test bao phủ hành vi mới hoặc lỗi đã sửa |
| Debug | `diagnosing-bugs`, `triage` | Nguyên nhân có bằng chứng, không sửa theo phỏng đoán |
| UI/UX | `frontend-design`, `frontend-ui-engineering`, browser testing | Giao diện đúng mockup, responsive, focus và trạng thái tương tác |
| Review | `code-review`, `code-review-and-quality` | Finding có mức độ, file, bằng chứng và trạng thái xử lý |
| Bảo mật | `security-and-hardening` | Kiểm tra auth, Supabase, input, secret và quyền truy cập |
| Git | `git-workflow-and-versioning` | Commit nguyên tử, message rõ, staged diff đúng phạm vi |

`frontend-design`, `frontend-ui-engineering`, `code-review-and-quality` và một số
skill kiểm thử là skill bổ sung của môi trường Codex; chúng được dùng cùng bộ Matt
Pocock khi task cần, không phải bản sao của nhau.

## Quality gate bắt buộc trước commit

### 1. Chốt phạm vi

- Nêu mục tiêu, file dự kiến sửa, hành vi giữ nguyên và tiêu chí hoàn thành.
- Với task lớn hoặc mơ hồ, dùng `to-spec`/`wayfinder` trước khi viết code.
- Đọc `docs/PROJECT_CONTEXT.md`, `docs/AI_WORKFLOW.md` và thêm tài liệu domain liên
  quan trong `docs/agents/` trước khi khám phá sâu.
- Với UI, đọc `docs/UX_DEVICE_POLICY.md` và xác định laptop/tablet cần kiểm tra.

### 2. Làm theo lát nhỏ

- Dùng `implement` hoặc `implement-spec` cho lát đang làm.
- Mỗi lát chỉ giải quyết một mục tiêu; không trộn refactor không liên quan.
- Sau mỗi lát: test → verify → review nhanh → commit hoặc lưu save point.
- Giữ dữ liệu Supabase, schema, RLS và quyền truy cập nguyên trạng nếu task không
  được người dùng cho phép thay đổi rõ ràng.

### 3. Kiểm thử theo phạm vi

Chọn test liên quan trước, sau đó chạy cổng chung khi thay đổi đủ rộng:

```powershell
# Contract Node
npm run test:contracts

# Browser, thay đường dẫn bằng spec bị ảnh hưởng
npm run test:browser -- tests/e2e/<spec-bi-anh-huong>.spec.cjs

# Cổng đầy đủ trước PR/merge
npm test
```

Repo hiện chưa có `lint`, `build` hoặc TypeScript script riêng; không báo cáo các
cổng đó là đã chạy. Với UI phải kiểm tra thêm desktop/tablet, keyboard focus,
empty/error state, console và `prefers-reduced-motion` theo checklist browser.

### 4. Review diff trước khi stage/commit

Dùng `code-review` và `code-review-and-quality` để xem lần lượt:

- Đúng yêu cầu, edge case, error path và test có bắt được hồi quy không.
- Code có dễ đọc, đơn giản, đúng module boundary và không phình file không.
- Không có secret, dữ liệu học sinh, answer key hoặc thay đổi quyền ngoài phạm vi.
- Với Supabase/auth: kích hoạt thêm `security-and-hardening`.
- Với giao diện: đối chiếu screenshot/DOM ở kích thước được yêu cầu.
- Finding bắt buộc phải được sửa hoặc ghi rõ là rủi ro được người dùng chấp nhận.

### 5. Staged diff và commit

Trước commit:

```powershell
git status --short
git diff --staged --check
git diff --staged --name-status
git diff --staged
```

Kiểm tra thủ công staged diff không chứa secret như `password`, `secret`, `api_key`,
`service_role`, `access_token` hoặc file build/test artifact ngoài quy ước repo.

- Stage đúng file thuộc task; giữ nguyên thay đổi chưa được ủy quyền.
- Commit một mục tiêu logic, message theo dạng `<type>: <mô tả lý do ngắn>`.
- Không tự đưa thay đổi lên `main`; push branch ngắn hạn và tạo Pull Request.
- Chỉ merge khi test, review và trạng thái deploy đạt; Kimi chỉ chạy khi người dùng
  yêu cầu rõ ràng.

## Báo cáo trước khi bàn giao

Mỗi commit/PR phải báo cáo ngắn:

```text
CHANGES MADE:
- file: thay đổi và lý do

THINGS I DIDN'T TOUCH:
- file/phạm vi liên quan nhưng nằm ngoài yêu cầu

VERIFICATION:
- test đã chạy và kết quả
- review/browser check đã thực hiện

POTENTIAL CONCERNS:
- rủi ro, migration chưa apply hoặc việc cần người dùng xác nhận
```

## Khi không áp dụng một skill

Không cần gọi skill không liên quan. Ví dụ: task chỉ sửa typo tài liệu không cần
`tdd`; task chỉ review không được tự sửa code; task Supabase phải dừng ở checkpoint
nếu thiếu xác nhận project/quyền. Nếu bỏ qua một skill mà task rõ ràng có rủi ro của
skill đó, phải nêu lý do trong báo cáo.

## Definition of Done

- Phạm vi và tiêu chí hoàn thành được xác định.
- Test liên quan và test đầy đủ phù hợp đã đạt.
- Diff đã được review theo correctness, readability, architecture, security và
  performance.
- Không có secret hoặc artifact ngoài phạm vi trong staged diff.
- Commit nguyên tử, dễ rollback, và branch/PR có mô tả đủ để review.
