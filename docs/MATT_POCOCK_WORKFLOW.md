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

`frontend-design`, `frontend-ui-engineering`, `browser-testing-with-devtools`,
`test-driven-development`, `security-and-hardening`, `performance-optimization`,
`code-simplification`, `code-review-and-quality`, `documentation-and-adrs` và Git
workflow là các skill bổ sung của môi trường Codex; chúng được dùng cùng bộ Matt
Pocock khi task cần, không phải bản sao của nhau.

## Cổng bổ trợ của môi trường Codex

| Rủi ro/phạm vi | Skill bổ trợ | Khi nào bắt buộc | Bằng chứng cần lưu |
| --- | --- | --- | --- |
| UI/UX | `frontend-design` | Tạo hoặc đổi visual direction, palette, typography, layout | Token/plan, screenshot và lý do lựa chọn |
| UI production | `frontend-ui-engineering` | Đổi HTML/CSS/JS tương tác, responsive hoặc accessibility | Keyboard/focus, empty/error/loading và breakpoint check |
| Runtime browser | `browser-testing-with-devtools` | Mọi thay đổi render trong browser hoặc lỗi UI | DOM, console, network, accessibility tree và screenshot |
| Hành vi | `test-driven-development` | Thêm logic, sửa bug hoặc đổi behavior | Test hồi quy; bug fix phải có test tái hiện |
| Bảo mật | `security-and-hardening` | Auth, Admin, Supabase, input, file, external integration hoặc dependency | Threat boundary/abuse case và security checklist |
| Performance | `performance-optimization` | Có yêu cầu tốc độ, dữ liệu lớn hoặc evidence chậm | Baseline → bottleneck → đo lại; không tối ưu theo phỏng đoán |
| Đơn giản hóa | `code-simplification` | Refactor hoặc code mới đã chạy nhưng khó đọc | Diff nhỏ, behavior giữ nguyên, test xanh |
| Quyết định kỹ thuật | `documentation-and-adrs` | Đổi contract, schema, auth, kiến trúc hoặc quyết định khó đảo ngược | ADR/spec giải thích lý do và trade-off |

Các cổng này có điều kiện: task không chạm phạm vi nào thì không gọi skill tương ứng.
Riêng `frontend-ui-engineering` và `browser-testing-with-devtools` được áp dụng cho
mọi thay đổi UI; `security-and-hardening` được áp dụng cho mọi thay đổi có trust
boundary, không chờ đến lúc phát hiện lỗi.

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

`test-driven-development` dẫn dắt thay đổi behavior: viết test hồi quy trước, làm
test đỏ xác nhận, triển khai tối thiểu rồi refactor khi test xanh. Với thay đổi browser,
kết hợp `browser-testing-with-devtools` để kiểm tra runtime; test tự động không thay
thế screenshot, console và accessibility check.

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
cổng đó là đã chạy. Với UI, `frontend-design` phải được dùng để đối chiếu lại plan
visual; `frontend-ui-engineering` và browser skill phải kiểm tra desktop/tablet,
keyboard focus, empty/error/loading state, heading/accessible name, console và
`prefers-reduced-motion` theo checklist browser.

`browser-testing-with-devtools` ưu tiên Chrome DevTools MCP khi server đã được cấu
hình. Nếu môi trường chưa có MCP đó, dùng Playwright và
`docs/PLAYWRIGHT_TESTING.md` cho cùng checklist, đồng thời ghi rõ DevTools MCP chưa
được chạy thay vì báo cáo quá mức.

Nếu task có dấu hiệu chậm, kích hoạt `performance-optimization`: ghi baseline bằng
DevTools trước, xác định bottleneck, sửa đúng nguyên nhân rồi đo lại LCP/INP/CLS hoặc
chỉ số phù hợp. Không đưa một con số performance giả định vào tiêu chí nếu chưa đo.

### 4. Review diff trước khi stage/commit

Dùng `code-review`, `code-review-and-quality` và `code-simplification` để xem lần lượt:

- Đúng yêu cầu, edge case, error path và test có bắt được hồi quy không.
- Code có dễ đọc, đơn giản, đúng module boundary và không phình file không.
- Không có secret, dữ liệu học sinh, answer key hoặc thay đổi quyền ngoài phạm vi.
- Với Supabase/auth/input/external integration: kích hoạt `security-and-hardening`,
  lập trust boundary và kiểm tra abuse case/authorization.
- Với dependency hoặc lockfile: kiểm tra nguồn, audit và thay đổi transitive; không
  dùng `npm audit fix --force`.
- Với giao diện: đối chiếu screenshot/DOM ở kích thước được yêu cầu.
- Với quyết định kiến trúc/schema/contract: cập nhật ADR hoặc spec bằng
  `documentation-and-adrs` trước khi commit.
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

## Cổng riêng trước push GitHub

Trước khi push branch hoặc mở Pull Request, chạy lại các kiểm tra sau nếu code đã
thay đổi kể từ lần verify trước:

```powershell
git status --short
git log -1 --oneline
git diff --check
git diff origin/main...HEAD --check
git diff origin/main...HEAD --name-status
npm run test:contracts
# chạy spec browser liên quan, rồi npm test khi phạm vi đủ rộng
```

Sau đó xác nhận:

- Branch không chứa commit lẫn task khác; `git diff origin/main...HEAD --name-status`
  không đưa theo `mockups`, `test-results-*`, `.env`, token hoặc dữ liệu người dùng
  ngoài phạm vi.
- Nếu có thay đổi dependency: lockfile là authoritative, đã review diff và audit
  native phù hợp; nếu chỉ dùng skill/docs thì không cần audit lại.
- Nếu có migration/Supabase: đã có xác nhận đúng project/quyền và ghi rõ migration
  nào chưa apply; quality gate không tự triển khai production.
- PR mô tả đầy đủ thay đổi, test, screenshot nếu có UI, rủi ro và các file cố ý
  không chạm. `git-workflow-and-versioning` quyết định commit message/branch; không
  push trực tiếp `main`.

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
