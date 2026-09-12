# Rà soát và hoàn tất các Bước 1–8

Ngày rà soát: 2026-09-12
Phạm vi: các **Bước 1–8** trong `tasks/todo.md` và `tasks/plan.md`.

> Các Bước 1–8 là roadmap về chất lượng, hiệu năng, vòng đời và release. Chúng
> khác với các **Phase nội dung template** trong `docs/templates/`; tài liệu này
> không thay đổi thứ tự hay trạng thái các Phase nội dung.

## Kết quả audit

| Bước | Trạng thái sau đợt rà soát | Bằng chứng chính |
| --- | --- | --- |
| 1 | Đã hoàn tất từ trước | RLS hardening và contract production đã có trong lịch sử repo; đợt này không chạy lại migration. |
| 2 | Đã hoàn tất từ trước | Đường ghi tiến độ/điểm server-authoritative và contract tương ứng đã có; không đụng dữ liệu Supabase. |
| 3 | Đã hoàn tất từ trước | Auth/modal có label, keyboard, focus trap và trạng thái nền inert. |
| 4 | Đã hoàn tất từ trước | Chuẩn hóa dữ liệu lớp/học sinh/giới tính và fixture audit không còn `undefined`. |
| 5 | Hoàn tất trong đợt này | Projection theo màn, pagination helper, lazy-load dữ liệu Admin, preload có chủ đích; `test_step5_performance_contract.cjs`. |
| 6 | Hoàn tất trong đợt này | Registry listener/timer, cleanup timer màn chơi/đề/đội, realtime teardown và epoch guard chống stale sync; `test_step6_lifecycle_contract.cjs`. |
| 7 | Hoàn tất trong đợt này | Design token dùng chung cho Admin, surface theo ngữ cảnh, loading/error/empty, focus-visible, disabled, reduced-motion và viewport không khóa zoom; `test_step7_design_system_contract.cjs`. |
| 8 | Hoàn tất trong đợt này | Release gate kiểm tra file bắt buộc, trạng thái roadmap, fixture, asset local; full contract/browser regression và self-review diff. |

## Những thay đổi đã thực hiện

### Bước 5 — tải và truy vấn

- Khai báo projection tập trung trong `src/main.js` và adapter thi đua nhóm để
  list screen không mặc định lấy `*`.
- Dùng helper phân trang cho các truy vấn Supabase dạng danh sách.
- Chỉ tải kho câu hỏi/template/nhiệm vụ Admin khi màn soạn đề cần; dữ liệu chi
  tiết vẫn được giữ nguyên khi mở màn tương ứng.
- Giữ preload có chủ đích cho màn đăng nhập và không tải thêm asset ngoài phạm
  vi.

### Bước 6 — lifecycle

- Dùng `src/modules/lifecycle.js` làm registry chung cho listener, timeout và
  interval có vòng đời rõ ràng.
- Dọn matching resize, timer đề thi, timer thi đua, router và các callback app
  shell khi rời màn.
- Team adapter hủy channel/sync timer khi shutdown; epoch guard khiến request
  cũ không được áp dụng sau logout/login hoặc disable.

### Bước 7 — UI/state

- Thêm token màu, border, radius, shadow và spacing trong `src/style.css`.
- Scope lớp token vào Admin authoring/config/result để không làm mất bản sắc
  gameplay của học sinh, Map hoặc Shop.
- Chuẩn hóa hook cho loading, error, empty, focus-visible và disabled; Admin
  content báo `aria-busy` trong lúc tải.
- Bỏ khóa zoom trên viewport để người dùng có thể phóng to khi cần; vẫn ưu tiên
  layout laptop/desktop và tablet ngang theo chính sách UX của repo.

## Release gate và giới hạn an toàn

- `test_step8_release_gate.cjs` là gate tĩnh cuối cùng: xác nhận các file/contract
  cần thiết (bao gồm chính gate và tài liệu audit), Bước 1–8 đã được ghi nhận,
  không có `undefined` trong fixture và không có tham chiếu asset nội bộ bị gãy.
- Toàn bộ test contract và Playwright phải được chạy trước khi coi gate xanh.
  Browser test dùng static server/fixture, không gọi Supabase thật.
- Không chạy migration, không sửa schema/RLS, không seed hoặc xóa dữ liệu
  Supabase trong đợt hoàn tất roadmap này.
- Không tự merge/push `main`; nhánh triển khai chỉ sẵn sàng để review/merge khi
  người dùng yêu cầu riêng.

## Kiểm tra sau cùng

Các lệnh kiểm tra được dùng trong đợt này:

```powershell
npm run test:contracts
npm test
git diff --check
```

Kết quả đợt này: `npm run test:contracts` đạt; `npm test` đạt **128/128** test
Playwright/contract; `git diff --check` không có lỗi whitespace. Browser smoke
đã đối chiếu các màn Admin/Soạn Đề ở 1440×900 và 1024×768, đồng thời có kiểm tra
reduced-motion/keyboard trong bộ e2e. Test browser dùng fixture/static server,
không gọi Supabase thật.
