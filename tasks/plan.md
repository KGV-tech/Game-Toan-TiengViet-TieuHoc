# Kế hoạch triển khai thi đua đội nhóm

> Cập nhật quy trình 09/09/2026 cho mọi kế hoạch trong tệp này: mặc định bỏ qua Kimi review; chỉ thực hiện khi người dùng yêu cầu rõ ràng. Codex tự review và kiểm thử theo `docs/AI_WORKFLOW.md`.

## Mục tiêu

Triển khai vertical slice an toàn cho thi đua đội nhóm trong một lớp học: giáo viên tạo trận, chia đội, chọn trưởng nhóm/bộ đề/thời gian, chuẩn bị và trình chiếu bảng thi đua; trưởng nhóm làm bài trên một tablet và bị khóa lượt khi rời giữa chừng. Điểm đội được gán giống nhau cho từng thành viên nhưng không làm thay đổi hệ thống điểm cá nhân hiện có.

## Phạm vi và giới hạn

- Giữ nguyên chức năng tab con **Cá nhân**.
- Thêm tab con **Đội nhóm** trong Admin → Quản lý nhiệm vụ.
- Dùng module domain riêng và local/demo adapter để không refactor lớn `src/main.js`.
- Không thêm dữ liệu/seed hoặc thay đổi API key. Schema/RLS/RPC chỉ triển khai sau khi project đích được xác nhận; project `bjgbbrufnryrtimtzvhn` hiện đã được xác nhận.
- UI ưu tiên laptop/desktop và tablet ngang.

## Các pha thực hiện

### Pha 0 — Hợp đồng và kiểm thử nền

1. Tạo module `src/modules/team-competition.js` với hằng số trạng thái, kiểu dữ liệu, validation, chia đội, tính điểm, chuyển trạng thái và adapter lưu trữ.
2. Viết contract test Node trước khi triển khai hành vi: chia manual/random, đội lệch thành viên, trưởng nhóm duy nhất, bộ đề cùng số câu, điểm 0–10, lock không resume.
3. Cập nhật test browser cho tab Đội nhóm và bảng chuẩn bị.

**Checkpoint:** test contract mô tả được quy tắc đã chốt và fail trước khi có implementation.

### Pha 1 — Quản trị trận

1. Nạp module vào `index.html`.
2. Tách render nhiệm vụ cá nhân hiện tại khỏi workspace hai tab.
3. Thêm form tạo/sửa Nháp: tên trận, lớp, số đội, manual/random, thành viên, trưởng nhóm, bài chung/bài riêng, thời gian.
4. Thêm validation và lưu local/demo; hiển thị bốn trạng thái đúng thứ tự.
5. Thêm màn hình Bảng thi đua nhóm với một card mỗi đội, nút **Thay đổi**, nút **Bắt đầu thi đua** và nút kết thúc.

**Checkpoint:** giáo viên tạo được nhiều bản Nháp, chuẩn bị một trận hợp lệ và mở được bảng trình chiếu.

### Pha 2 — Luồng trưởng nhóm trên tablet

1. Thêm màn hình làm bài đội nhóm dùng renderer câu hỏi hiện có.
2. Chỉ tài khoản trưởng nhóm của đúng đội mới được vào lượt; mỗi câu nộp một lần và lưu điểm cục bộ ngay.
3. Hiển thị đồng hồ chung hoặc không giới hạn; hết giờ tự khóa lượt.
4. Thoát, đăng xuất, refresh, chuyển tài khoản hoặc đóng tab: hộp xác nhận có **OK** và **Hủy**; OK khóa, Hủy ở lại. Refresh/đóng tab dùng `beforeunload` của trình duyệt.
5. Lượt đã khóa chỉ xem kết quả, không resume/đổi trưởng nhóm.

**Checkpoint:** điểm câu đã nộp được giữ sau lock; câu chưa nộp là 0; không submit trùng.

### Pha 3 — Kết quả và bảng theo dõi

1. Cập nhật card theo tiến độ câu, điểm đội, trạng thái, thời gian bắt đầu/kết thúc.
2. Khi kết thúc, tạo bản ghi kết quả riêng cho từng thành viên với `individual_score = team_score`.
3. Không gọi `updateUserScore`, không ghi `history`, sao, progression hoặc nhiệm vụ cá nhân.
4. Chỉ hiển thị dữ liệu cấp đội trên vùng trình chiếu; dữ liệu học sinh chỉ ở vùng quản trị.

**Checkpoint:** đội 31 học sinh chia 4 đội lệch tối đa một người vẫn hợp lệ; điểm mỗi thành viên giống điểm đội.

### Pha 4 — Tích hợp máy chủ

1. Tạo `supabase/migrations/20260906_team_competitions.sql` cho trận, đội, lượt làm, đáp án câu, kết quả thành viên, RPC chấm điểm và Realtime.
2. Chốt RLS/authorization cho giáo viên, trưởng nhóm và thành viên; giữ answer key trong schema `private`.
3. Nối `src/modules/team-competition-supabase.js` để đồng bộ máy chủ, chống race condition, idempotency và realtime; local/demo vẫn là fallback khi schema chưa có.
4. Chạy migration trong project đã xác nhận rồi kiểm tra đa tablet trong cùng lớp.

**Việc còn lại:** apply migration trong SQL Editor/CLI của project và kiểm thử với tài khoản thật; repo không tự seed hay thay đổi dữ liệu học sinh.

### Pha 5 — Xác minh và bàn giao

1. Chạy test contract liên quan, sau đó toàn bộ `test_*.cjs` và `npm test`.
2. Chạy Playwright ở 1280×720 và 1024×768 ngang; kiểm tra console/runtime.
3. Codex tự review diff và tạo commit nhánh `codex/`. Chỉ gửi Kimi review commit cố định khi người dùng yêu cầu rõ ràng.
4. Chỉ merge sau khi finding bắt buộc đã xử lý và người dùng đồng ý.

## Tiêu chí hoàn thành lượt hiện tại

- Có module domain/testable và local adapter rõ ràng.
- Admin có workspace Cá nhân/Đội nhóm, form tạo trận và bảng card đội.
- Luồng trưởng nhóm và modal khóa lượt hoạt động ở chế độ local/demo.
- Không phá hồi quy nhiệm vụ cá nhân.
- Migration/RLS/RPC/adapter production đã có trong repo; chỉ coi là realtime production sau khi migration được apply và kiểm thử với tài khoản thật.

---

# Kế hoạch triển khai soạn đề theo chủ đề và tự động tạo câu

## Mục tiêu

Trong **Soạn đề**, giáo viên chọn kỳ kiểm tra, tích nhiều chủ đề phù hợp rồi vẫn có thể soạn thủ công như trước hoặc bấm **Tạo đề tự động** để điền sẵn đúng 10 câu từ kho câu hỏi/template và chỉnh sửa trước khi lưu.

## Quyết định triển khai

- `Giữa/Cuối kỳ 1` chỉ hiện chủ đề Học kỳ 1; `Giữa/Cuối kỳ 2` chỉ hiện chủ đề Học kỳ 2; `Cả năm` gộp hai học kỳ của đúng môn/lớp.
- Chủ đề được lưu cùng đề dưới dạng mảng `topics`; đề cũ không có trường này vẫn mở và soạn thủ công bình thường.
- Tạo tự động chỉ cập nhật bản nháp form, không ghi kho câu hỏi hay đề lên Supabase cho đến khi giáo viên bấm lưu.
- Bốc câu hợp lệ từ kho trước, bổ sung câu sinh từ template; bỏ câu trùng và báo rõ nếu không đủ 10 câu.

## Các lát triển khai

1. Thêm contract/UI test cho lọc chủ đề theo kỳ và chọn nhiều chủ đề.
2. Thêm state bản nháp đề, vùng chọn chủ đề và giữ nguyên luồng soạn thủ công.
3. Thêm tạo tự động 10 câu từ kho/template theo lớp, môn, học kỳ và chủ đề đã chọn.
4. Kiểm thử browser laptop 1280×800 và tablet ngang 1024×768, review diff, commit/PR.

---

# Kế hoạch phân cấp Bài học — Toán lớp 4

## Phạm vi lượt này

- Tạo catalog 13 Chủ đề/73 Bài học từ SGK Toán 4 Tập 1 và Tập 2.
- Chỉ mở metadata và bộ lọc Bài học trong vùng Admin: câu hỏi, template, đề và nhiệm vụ.
- Giữ nguyên giao diện làm bài của học sinh theo Chủ đề.
- Không thay đổi schema/RLS/dữ liệu Supabase; tận dụng JSON hiện có và metadata trong `game_settings.data`.

## Các lát triển khai

1. Viết đặc tả và contract test catalog trước khi thêm hành vi.
2. Thêm module curriculum và hydrate/persist metadata tương thích dữ liệu cũ.
3. Tích hợp Bài học vào câu hỏi, import/export và template trong Admin.
4. Tích hợp bộ lọc/metadata Bài học vào soạn đề và nhiệm vụ; giữ luồng học sinh topic-only.
5. Thêm CSS scoped, browser test laptop/tablet ngang, chạy hồi quy, review diff và commit.

## Checkpoint

- **Catalog:** đúng 13 Chủ đề và 73 Bài học, quan hệ kỳ/chủ đề không lệch.
- **Authoring:** Admin lưu/lọc được Bài học, dữ liệu cũ không có Bài học vẫn dùng được.
- **Gameplay:** không có selector hoặc điều hướng Bài học ở màn hình học sinh.
- **Bàn giao:** test contract đã xanh; migration lesson/Phase 1 và seed Phase 2 đã audit live trong project Supabase đúng.

---

# Kế hoạch tái xây dựng hệ thống Template — Toán lớp 4

> Hồ sơ chi tiết: [`docs/templates/TEMPLATE_SYSTEM.md`](../docs/templates/TEMPLATE_SYSTEM.md).
> Quy trình: tài liệu/kiểm kê → từng phase nội dung → test/preview → người dùng duyệt → phase kế tiếp. Không rebuild hàng loạt; Phase 2 chỉ seed các record đã duyệt.

## Mục tiêu

- Biến `lesson` thành phạm vi authoring chuẩn cho mọi Template active.
- Tách Template quá rộng theo đúng một Bài học; giữ các bài “Luyện tập chung” như lesson review có blueprint kỹ năng.
- Bổ sung generator/family còn thiếu theo lộ trình SGK Toán 4, tham khảo dạng bài trong Vở bài tập Tập 1.
- Giữ nguyên logic gameplay học sinh, hợp đồng generator 4 ý và quyền/RLS hiện có.
- Rebuild có thể rollback bằng `is_active=false`, không xoá vật lý dữ liệu cũ trong đợt đầu.

## Phases và checkpoint

### Phase 0 — Hồ sơ hệ thống và đề xuất (đang hoàn tất)

- [x] Tạo `docs/templates/` và `TEMPLATE_SYSTEM.md`.
- [x] Ghi mô hình generator/record/đề, data flow, Supabase lifecycle và contract.
- [x] Ghi kiểm kê registry hiện có, gaps HK1 và ma trận family B01–B37.
- [x] Đề xuất phase HK2 sau khi có nguồn Tập 2.

**Checkpoint:** người dùng duyệt kiến trúc và chọn bắt đầu Phase 1.

### Phase 1 — Kiểm kê dữ liệu và manifest (đã apply và audit live)

- [x] Dùng phiên Admin/export được phép để lấy toàn bộ `question_templates` hiện có.
- [x] Đối chiếu `classlevel/subject/semester/topic/lesson/generator_key/config` với `lessonCatalog`.
- [x] Phân loại từng record: giữ/gắn lesson, tạo record hẹp, sửa generator, archive.
- [x] Apply các migration `20260909_question_templates_lesson.sql` và `20260909_question_templates_phase1_lesson_mapping.sql` vào đúng project; audit live ngày 10/09/2026 xác nhận 28 mapping Phase 1.
- [x] Tạo manifest + validator + contract test; chưa seed Template nội dung mới.

**Checkpoint:** người dùng đã duyệt mapping Phase 1; migration đã apply và audit
live. Migration remediation đã xử lý nhóm 17 HARDEN/TÁCH/THAY; audit sau chạy
xác nhận 57 active, 0 active thiếu `lesson`, không tạo B05.

### Phase 2 — Bài 1–6

- [x] Giữ mapping trực tiếp B01/B02 của Phase 1 và chưa archive record tổng quát khi chưa có dependency check.
- [x] Thêm family số chẵn/lẻ B03 và biểu thức chứa chữ B04; bài toán ba bước B05 tạm hoãn.
- [x] Tạo blueprint review B06 chỉ bao phủ B01–B04.
- [x] Thêm migration seed idempotent, preview Admin và test nhiều seed; kiểm tra không vượt phạm vi bài.

**Checkpoint:** migration seed đã apply; audit live xác nhận đủ 7 record active
cho B03/B04/B06 và không có B05. Nhóm deferred 17 record đã được harden/tách/
thay trong remediation riêng sau dependency check.

### Phase 3 — Bài 7–9

- [x] Bổ sung đo góc/đơn vị độ cho B07.
- [x] Tách phân loại góc cho B08 và review B09.
- [x] Kiểm thử SVG, keyboard fallback, focus và reduced motion.

**Checkpoint:** code và migration seed B07/B09 đã có trong branch Phase 3;
B08 tiếp tục dùng bốn generator góc hiện hữu đã mapping đúng lesson. Chưa apply
seed Phase 3 vào Supabase live.

### Phase 4 — Bài 10–16

- [ ] Bổ sung số sáu chữ số/1 000 000, lớp triệu, làm tròn trăm nghìn.
- [ ] Tách so sánh, dãy số và review theo lesson.

### Phase 5 — Bài 17–21

- [ ] Tách khối lượng, diện tích, thời gian/thế kỉ, thực hành và review.
- [ ] Rà lại bài toán lời văn/đơn vị và config biên.

### Phase 6 — Bài 22–26

- [ ] Tách cộng, trừ, tính chất, tổng-hiệu và review.
- [ ] Không dùng một generator cộng/trừ tổng quát đại diện cho toàn Chủ đề.

### Phase 7 — Bài 27–32

- [ ] Xây family vuông góc, song song, thực hành và hình bình hành/hình thoi.
- [ ] Tạo review B32 và test geometry theo dữ liệu, không chỉ snapshot pixel.

### Phase 8 — Bài 33–37

- [ ] Tạo blueprint ôn số, cộng/trừ, hình học, đo lường và toàn HK1.
- [ ] Kiểm tra tỷ trọng kỹ năng khi tạo Đề tự động.

### Phase 9 — HK2

- [ ] Chỉ bắt đầu sau khi có SGK/VBT Tập 2 hoặc nguồn được xác nhận.
- [ ] Lập mapping B38–B73 và triển khai theo lát nhỏ như HK1.

### Phase 10 — Seed, archive và bàn giao

- [x] Seed idempotent các record đã duyệt cho Phase 2: 7 record B03/B04/B06; không tạo B05.
- [x] Archive/tách các record cũ thuộc remediation 17 template sau dependency check; không xoá vật lý.
- [ ] Chạy contract Node + `npm test` + visual/accessibility review.
- [ ] Tự review diff, commit/push nhánh riêng.
- [ ] Chỉ merge `main` sau khi người dùng yêu cầu và các checkpoint bắt buộc đạt.

## Điều kiện không được tự quyết

- Không tạo hàng loạt Template trước khi mapping Phase 1 được duyệt.
- Không apply migration/seed vào Supabase production nếu chưa xác nhận đúng project và quyền.
- Không xoá vật lý record cũ trong rebuild đầu.
- Không suy diễn nội dung HK2 từ HK1 hoặc chỉ từ tên bài trong `constants.js`.

---

# Lộ trình hoàn thiện game — mã bước cố định

Đây là lộ trình tiếp nối audit UI/code ngày 10/09/2026. Khi người dùng nói
**“bước N”**, thực hiện đúng bước N dưới đây, không tự mở rộng sang bước khác.
Mỗi bước phải giữ hồi quy xanh trước khi chuyển bước tiếp theo. Kimi mặc định
bỏ qua theo `docs/AI_WORKFLOW.md` và chỉ dùng khi người dùng yêu cầu rõ ràng.

## Ưu tiên tổng quát

1. An toàn quyền và toàn vẹn điểm/hồ sơ.
2. Form chính xác, accessibility và modal keyboard.
3. Tải nhanh hơn, query có giới hạn và cleanup lifecycle.
4. Đồng nhất các màn cũ với design system mới.
5. QA nội dung/template và release gate.

## Bước 1 — Hardening RLS hồ sơ

**Mục tiêu:** chặn học sinh tự sửa field đặc quyền qua Supabase API.

**Phạm vi:** policy `game_users`, quyền cột/RPC cần thiết, test adversarial cho
`role`, `approved`, `stars`, `totalscore`, `history`, `auth_user_id`.

**Hoàn tất khi:** student chỉ đọc/sửa được field được allowlist; admin vẫn sửa
được hồ sơ; test từ chối mọi trường đặc quyền; không có migration destructive.

**Kiểm thử:** contract/RLS test, review migration, `npm test`. Apply vào
Supabase thật chỉ sau khi xác minh đúng project và quyền triển khai.

**Phụ thuộc:** không có. **Scope:** M, ưu tiên cao nhất.

## Bước 2 — Tách đường ghi điểm và hồ sơ

**Mục tiêu:** client không gửi nguyên object `currentUser` hoặc tự quyết định
điểm, sao, tiến độ.

**Phạm vi:** payload update tối thiểu, RPC/Edge Function hoặc server rule,
validation input và test concurrency/idempotency phù hợp.

**Hoàn tất khi:** update điểm chỉ nhận dữ liệu hợp lệ từ server-authoritative
flow; sửa tên/lớp/giới tính không làm thay đổi field đặc quyền; lỗi mạng không
tạo bản ghi nửa chừng.

**Kiểm thử:** contract test update profile/score, retry/error path, `npm test`.

**Phụ thuộc:** Bước 1. **Scope:** M.

## Bước 3 — Accessibility auth và modal

**Mục tiêu:** login/register/đổi mật khẩu dùng được hoàn toàn bằng keyboard và
screen reader.

**Phạm vi:** accessible name cho field, validation/error association, button
semantics cho subject/reward, focus trap, Escape, restore focus và inert nền.

**Hoàn tất khi:** mọi field có name/label ổn định; Tab không thoát khỏi dialog;
Enter/Space hoạt động; focus quay về nút mở modal; reduced-motion vẫn đúng.

**Kiểm thử:** Playwright role/name + keyboard, CUA accessibility smoke test,
desktop 1440×900 và tablet ngang 1024×768.

**Phụ thuộc:** không có. **Scope:** M.

## Bước 4 — Chuẩn hóa dữ liệu nhập và fixture

**Mục tiêu:** các khai báo chính xác không còn ô tự nhập gây sai dữ liệu.

**Phạm vi:** select/combobox cấp lớp, lớp cụ thể, học sinh, giới tính, thời gian
và task target; giữ sort tên tiếng Việt; thay fixture audit cũ bằng schema factory.

**Hoàn tất khi:** không lưu được giá trị ngoài danh sách; học sinh/lớp hiển thị
đúng label; không còn `undefined` trong Admin screenshot; dữ liệu cũ vẫn mở được.

**Kiểm thử:** contract + browser cho create/edit/filter/sort/task; screenshot
desktop/tablet.

**Phụ thuộc:** Bước 1 nếu có thay đổi API/profile. **Scope:** M.

## Bước 5 — Tối ưu tải và truy vấn

**Mục tiêu:** giảm initial transfer và tránh tải toàn bộ kho dữ liệu.

**Phạm vi:** query projection thay `select('*')`, pagination/search server-side,
lazy-load theo màn, derivative WebP/AVIF, preload có chủ đích.

**Hoàn tất khi:** list không tải payload detail thừa; kho lớn vẫn phản hồi ổn;
initial asset transfer giảm so với baseline ~10 MB; số đo trước/sau được lưu.

**Kiểm thử:** Playwright performance smoke ở 1440×900/1024×768, đo payload và
Core Web Vitals nếu môi trường cho phép; không kết luận theo cảm tính.

**Phụ thuộc:** Bước 4 giúp chốt field/list model. **Scope:** L, sẽ tách thành
nhánh nhỏ khi bắt đầu triển khai.

## Bước 6 — Cleanup lifecycle game/realtime

**Mục tiêu:** không tích lũy listener, timer hoặc subscription sau nhiều lượt.

**Phạm vi:** matching `resize`, timer gameplay/team/exam, realtime channel,
logout/login, mở/đóng Admin và chuyển route.

**Hoàn tất khi:** đổi nhiều câu không tăng callback; channel được cleanup đúng
lifecycle; timer cũ không cập nhật DOM mới; không có console error.

**Kiểm thử:** regression đổi câu/logout-login nhiều lần, listener/channel smoke
test, console capture và `npm test`.

**Phụ thuộc:** không có. **Scope:** S–M.

## Bước 7 — Đồng nhất UI và design system

**Mục tiêu:** các màn cũ đạt cùng độ rõ ràng với Soạn Đề/Roster mới.

**Phạm vi:** token màu/spacing/radius/focus, Settings, History, Treasure,
Game Config, Result, empty/loading/error/disabled state; giữ bản sắc Map/Shop.

**Hoàn tất khi:** mỗi màn có hierarchy và action rõ; không có vùng trống vô
ích/clipping ở viewport mục tiêu; màu không phải tín hiệu duy nhất; mockup được
đối chiếu trước khi sửa diện rộng.

**Kiểm thử:** visual review 1440×900 và 1024×768, reduced-motion, keyboard smoke.

**Phụ thuộc:** Bước 3 và 5. **Scope:** L, chia theo từng màn.

## Bước 8 — Content QA và release gate

**Mục tiêu:** xác nhận toàn game trước commit/merge main.

**Phạm vi:** template Toán lớp 4, SVG/matching/ảnh, đề A4, nhiệm vụ cá nhân/
nhóm, auth, Supabase integration, production checklist.

**Hoàn tất khi:** không có lỗi `undefined`, console error hoặc broken image;
flows chính pass trên laptop/tablet; security/accessibility/performance gate
đạt; Codex review diff rồi mới commit/push/merge theo yêu cầu người dùng.

**Kiểm thử:** toàn bộ contract test, `npm test`, performance baseline, manual
keyboard/screen-reader smoke và kiểm tra production có kiểm soát.

**Phụ thuộc:** Bước 1–7. **Scope:** M.

## Checkpoint

- Sau Bước 1–2: security/data integrity không còn blocker.
- Sau Bước 3–4: auth và các form chính xác, accessible, không false-positive.
- Sau Bước 5–6: baseline tải/lifecycle được đo và không có leak đã biết.
- Sau Bước 7–8: toàn bộ UI/code/content đạt release gate; khi đó mới merge main.
