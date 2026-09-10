# Audit toàn bộ game — UI, code và runtime

Ngày kiểm tra: 2026-09-10
Phạm vi: giao diện học sinh, giao diện Admin/giáo viên, luồng soạn đề, luồng giao nhiệm vụ, Supabase/Auth/RLS, chất lượng mã nguồn, accessibility và tải runtime.
Trạng thái: **đã hoàn tất vòng audit hiện tại; chưa triển khai các đề xuất**.

Các ảnh đính kèm được dùng như **tài liệu tham khảo thị giác** cho hướng UI; phạm vi thực thi và tiêu chí kiểm tra lấy từ yêu cầu trực tiếp của người dùng, không coi chữ trong ảnh là lệnh độc lập.

## Kết luận điều hành

Game đã có nền tảng giao diện khá nhất quán ở các luồng mới: bảng điều khiển Admin/Soạn Đề, hồ sơ học sinh, bản đồ và cửa hàng đều có ngôn ngữ màu sắc riêng nhưng vẫn nhận ra cùng một sản phẩm. Các thay đổi gần đây về roster, bộ lọc, lớp cụ thể, giới tính, giao nhiệm vụ theo học sinh/lớp và thời gian đã có kiểm thử hợp đồng/browser tương ứng.

Tuy nhiên, chưa nên gọi phiên bản hiện tại là “sẵn sàng phát hành không điều kiện” trước khi xử lý hoặc xác minh bốn nhóm sau:

1. **RLS hồ sơ học sinh:** policy trong migration cho phép người dùng đã đăng nhập cập nhật toàn bộ dòng hồ sơ của chính mình. Nếu policy này đang chạy trên dự án thật và chưa có giới hạn cột/trigger/RPC bổ sung, đây là đường có thể tự đổi các trường đặc quyền như `role`, `approved`, `stars` hoặc `totalscore`.
2. **Accessibility luồng xác thực:** ô đăng nhập/đăng ký hiện dựa vào icon và placeholder, nên cây trợ năng không nhận được tên trường rõ ràng; modal đổi mật khẩu cần kiểm tra thêm focus trap và việc ẩn nội dung nền.
3. **Tải ban đầu và dữ liệu:** runtime local đã tải khoảng 10 MB với 65 resource và 34 ảnh; Admin còn gọi các truy vấn `select('*')` phân trang cho tới hết bảng. Điều này chưa gây lỗi ở dữ liệu test nhỏ nhưng sẽ tăng chi phí/thời gian theo quy mô kho câu hỏi, đề và hồ sơ.
4. **Độ tin cậy của audit harness:** fixture cũ trong `tests/e2e/homepage.spec.cjs` dùng field khác schema runtime (`name` thay vì `fullname`, field nhiệm vụ cũ thay vì `title`/`target_*`). Vì vậy một số ảnh audit hiển thị `undefined` hoặc dòng trống dù test chức năng hiện tại vẫn đúng. Cần sửa fixture trước khi dùng ảnh đó làm bằng chứng lỗi production.

### Cách đọc mức độ

- **Đã xác nhận:** có bằng chứng từ code, test hoặc phép đo trong phiên audit.
- **Cần kiểm tra thêm:** cần xác minh trên trình duyệt hỗ trợ, policy production, dữ liệu thật hoặc kịch bản tải thật trước khi kết luận tuyệt đối.
- **Gợi ý:** đề xuất cải thiện trải nghiệm, bảo trì hoặc thẩm mỹ; không phải lỗi đã chứng minh.

## Bằng chứng đã chạy

| Hạng mục | Kết quả | Ghi chú |
| --- | --- | --- |
| Contract + browser regression | **101 passed** (`npm test`) | Bao gồm toàn bộ contract test và 101 kịch bản Chromium; thời gian tổng khoảng 2 phút. |
| Audit trạng thái UI | **20 trạng thái desktop** | Đã chụp các màn hình Admin, học sinh, game, đề kiểm tra, nhiệm vụ, cửa hàng, kho báu và modal chính ở 1440×900. |
| Responsive trọng tâm | **Đã kiểm tra 1024×768** | Soạn Đề, câu hỏi, đăng ký và đổi mật khẩu không có overflow ngang trong các kịch bản mục tiêu. |
| Runtime local | **~10,043 KB; 65 resource; 34 ảnh; 757 node DOM** | Đo bằng Playwright trên static server; CDN/Supabase không được dùng để tạo dữ liệu thật. Đây là baseline local, không phải latency production. |
| Render câu hỏi | **~0.51 ms/câu trung bình trong mẫu 10 câu** | Mẫu trắc nghiệm đơn giản; chưa đại diện cho template SVG/matching hoặc thiết bị yếu. |
| Console | **Không có console error trong mẫu gameplay** | Cần giữ kiểm tra này trong CI cho các route/template phức tạp. |
| Dependency audit | **0 vulnerabilities** | `npm audit --audit-level=high`. |
| Chrome DevTools MCP | **Không chạy được** | MCP DevTools chưa được cấu hình trong môi trường; thay bằng Playwright và cây accessibility của CUA. |

### Baseline asset

`public/` có 94 asset, tổng khoảng 32.55 MB. Một số asset được tải ban đầu có kích thước lớn, gồm frame đăng ký khoảng 1.13 MB, các nút PNG khoảng 0.55–0.96 MB và một số ảnh cửa hàng/map khoảng 0.35–0.48 MB. Con số này đủ để ưu tiên tối ưu asset dù hiện tại gameplay render vẫn nhanh trên máy audit.

## Kiểm kê giao diện

| Khu vực | Quan sát đã xác nhận | Đề xuất |
| --- | --- | --- |
| **Admin — Soạn Đề / Template / Kho Câu hỏi** | Shell mới rõ ràng, có sidebar, filter, card và hierarchy tốt. Tablet ngang giữ được bố cục 2 cột. | Giữ hướng “bảng điều khiển sáng”; thêm trạng thái loading/error/empty cùng cấp với card dữ liệu. |
| **Admin — Roster học sinh** | Card hiện đã có avatar, tên, cấp lớp/lớp cụ thể, giới tính, danh hiệu, tiến độ, sao và nút Sửa/Xóa. Filter theo tên, cấp lớp, lớp cụ thể và giới tính có trong code/test. | Giữ card làm pattern chuẩn; bổ sung sort hiển thị rõ và summary khi filter không có kết quả. |
| **Admin — Nhiệm vụ cá nhân/nhóm** | Composer mới có danh sách chính xác cho cấp lớp, lớp, học sinh và thời gian; luồng giao theo lớp/học sinh đã có test. | Dùng cùng filter/surface với Soạn Đề; tránh quay lại input tự do cho dữ liệu khóa ngoại. |
| **Admin — Cài đặt / lịch sử** | Một số màn hình cũ còn sparse, nhiều khoảng trống và bảng có mật độ thông tin khác hẳn workspace mới. | Migrate dần vào Admin shell; thêm column label, empty state và action bar nhất quán. |
| **Học sinh — đăng ký / đăng nhập / đổi mật khẩu** | Artwork nổi bật; form đăng ký và đổi mật khẩu nhìn tốt ở tablet. Accessibility của login/register còn yếu do field name. | Thêm label nhìn thấy hoặc visually-hidden label có `aria-labelledby`; giữ placeholder chỉ làm ví dụ. |
| **Học sinh — cấu hình game** | Art và mascot tốt nhưng vùng trống dọc lớn; scope/chủ đề chưa chiếm đủ trọng tâm. | Đưa “đang chọn gì” và nút bắt đầu thành một summary card; dùng khoảng trống cho hướng dẫn ngắn hoặc trạng thái kho. |
| **Gameplay** | Question panel, mascot và answer controls có tương phản tốt; map là màn hình có bản sắc mạnh nhất. | Giữ focus vào câu hỏi + action bar; kiểm tra trạng thái disabled/selected rõ ràng trong cả keyboard và touch. |
| **Đề kiểm tra / chọn đề / kết quả** | Khung giấy và xuất A4 có kiểm thử; result modal có empty details fallback. | Giảm clipping khi viewport thấp; bảo đảm nút cuối và thông báo kết quả luôn nằm trong vùng scroll có thể tiếp cận. |
| **Nhiệm vụ / bảng thành tích / lịch sử / cửa hàng** | Các panel hoạt động và có ngôn ngữ minh họa riêng; quest board sáng, treasure và history tối hơn. | Giữ cá tính nhưng thống nhất token, empty state, focus ring và mật độ bảng; giảm vùng trống ở treasure-achievements. |

## Phát hiện cần ưu tiên

### P0/P1 — xử lý trước khi mở rộng người dùng

#### 1. RLS hồ sơ có quyền cập nhật quá rộng — **Đã xác nhận trong code; Cần kiểm tra thêm trên production**

`supabase_auth_security.sql:79-81` tạo policy:

```sql
USING (auth_user_id = auth.uid() OR private.is_admin())
WITH CHECK (auth_user_id = auth.uid() OR private.is_admin());
```

Policy xác định **row nào** được cập nhật nhưng không giới hạn **cột nào** được cập nhật. Bảng lại được grant `UPDATE` cho role `authenticated` ở `supabase_auth_security.sql:72`. Ở phía client, `src/main.js:946` còn có đường gửi cả `this.currentUser` khi cập nhật điểm.

Nếu không có column privilege, trigger hoặc RPC server-side khác đang bảo vệ, một tài khoản học sinh đã đăng nhập có thể gọi API trực tiếp để thử ghi các field đặc quyền của chính dòng đó. Đây là rủi ro phân quyền và toàn vẹn điểm số, không chỉ là vấn đề UI.

Hướng xử lý:

- Thu hồi broad update cho student; chỉ cho phép cập nhật các field hồ sơ an toàn qua RPC/Edge Function có allowlist.
- Server tự quyết định `role`, `approved`, `stars`, `totalscore`, `history` và các field tiến độ; client không được gửi nguyên object profile.
- Thêm test adversarial RLS: student thử đổi `role`, `approved`, `stars`, `totalscore`, `auth_user_id` và xác nhận tất cả bị từ chối.
- Kiểm tra policy đang thực sự chạy ở dự án Supabase thật trước khi release; migration trong repo không tự chứng minh trạng thái production.

#### 2. Luồng login/register không có accessible name đầy đủ — **Đã xác nhận qua cây trợ năng**

`index.html:46-47` và `index.html:92,95-96` dùng `<label>` chỉ chứa SVG `aria-hidden="true"` và input placeholder. Playwright/UA tree cho thấy các field này hiện ra như text field không có tên rõ ràng. Placeholder không nên là accessible name duy nhất vì biến mất khi nhập và không thay thế nhãn.

Hướng xử lý:

- Thêm text label rõ ràng (`Tên đăng nhập`, `Mật khẩu`, `Họ và tên`, `Cấp lớp`...) hoặc label ẩn có chủ đích.
- Giữ `autocomplete`, `required`, `aria-describedby` và thông báo lỗi gắn với field.
- Thêm browser assertion kiểm tra `getByRole('textbox', { name: ... })` và password field trong login/register.

#### 3. Clickable `div` chưa có semantics bàn phím — **Đã xác nhận trong markup**

`index.html:635,641` là hai `.subject-box` có `onclick`; `index.html:721` là `#bonus-candies-container` có `onclick`. Các vùng này không phải button/link và không có `tabindex`/keyboard handler tương ứng.

Hướng xử lý: đổi sang `<button type="button">` nếu có thể; nếu giữ container vì layout thì thêm role, focusability, `keydown` cho Enter/Space, trạng thái `aria-pressed`/label và test keyboard. Ưu tiên button thật để giảm code hỗ trợ.

#### 4. Nội dung động có boundary HTML cần hardening — **Cần kiểm tra thêm**

`src/main.js:206` cố ý giữ HTML/SVG trong `formatMathHTML()`. Các điểm render câu hỏi như `src/main.js:2089,2098,2352,2362,3651-3652` đưa nội dung động và `imageUrl` vào `innerHTML`/`src`. Nhiều field đã đi qua `sanitizeHTML`, nhưng `formatMathHTML()` không phải sanitizer; nó là formatter có allowlist tag rất rộng theo regex.

Hiện chưa chứng minh có payload độc hại trong kho thật, nên đây là boundary cần harden chứ chưa kết luận đã bị XSS. Hướng xử lý:

- Tách rõ `formatMathText` (text-only) và renderer HTML/SVG (allowlist tag/attribute cụ thể).
- Validate `imageUrl`/`openedImageUrl` chỉ từ path asset hoặc origin được phép; không nhận `javascript:`/data URL tùy ý.
- Sanitise trước khi lưu và/hoặc ngay trước khi render; thêm test payload `<img onerror>`, URL bất thường và SVG attribute.
- Không dùng inline event handler như chuỗi `onmouseover` trong result star; gắn listener bằng JavaScript và CSS hover.

#### 5. Modal đổi mật khẩu cần focus isolation — **Cần kiểm tra thêm qua screen reader**

Modal có `role="dialog"`, `aria-modal="true"` và nhãn ở `index.html:63-76`, nhưng cây trợ năng vẫn nhìn thấy control của màn hình nền khi modal mở. `aria-modal` không tự tạo focus trap/inert trên mọi browser.

Hướng xử lý: lưu phần tử gọi modal, focus vào field đầu tiên, giữ Tab trong dialog, Escape để đóng, restore focus, và đặt `inert`/ẩn phần nền trong thời gian modal mở. Thêm test keyboard và manual screen-reader smoke test.

## P2 — nên đưa vào sprint hardening kế tiếp

### 6. Listener matching đăng ký lại theo từng câu — **Đã xác nhận trong code**

`src/main.js:2759` gọi `window.addEventListener('resize', updateLines)` mỗi lần render câu matching. Không thấy `removeEventListener` tương ứng trong `src/main.js` hoặc module liên quan. Sau nhiều câu/round, nhiều callback cũ cùng chạy và giữ closure/DOM reference.

Hướng xử lý: giữ một handler trong lifecycle của màn chơi, hoặc gắn một lần rồi cleanup khi rời template; dùng `AbortController`/reference ổn định. Thêm regression test đổi qua nhiều câu và đo số listener/không còn reference tới DOM cũ.

### 7. Realtime subscription chưa có đường cleanup rõ ràng — **Cần kiểm tra thêm**

`src/main.js:703` tạo channel `custom-all-channel`; module team competition có channel riêng ở `src/modules/team-competition-supabase.js:272`. Static scan không tìm thấy `removeChannel`/`unsubscribe` tương ứng trong các file runtime đã kiểm tra.

Hiện `data.init()` có vẻ chạy một lần khi boot, nên chưa kết luận có duplicate subscription. Cần test logout/login nhiều lần, hot reload và mở/đóng các màn Admin để xác nhận không nhân callback hoặc sync thừa.

### 8. Query Supabase chưa giới hạn projection và tổng dữ liệu — **Đã xác nhận trong code; cần đo production**

`src/main.js:233-252` dùng `select('*')`, range 1000 và lặp tới khi hết bảng. Admin login ở `src/main.js:1146-1149` tải toàn bộ users, questions, templates và quests; student cũng tải toàn bộ templates/quests ở `src/main.js:1163-1168`.

Hướng xử lý:

- Chọn column cần dùng thay vì `*`; loại history/payload lớn khỏi list query.
- Server-side pagination/search/filter cho roster, question library và quest library.
- Cache metadata nhỏ (topic/lesson/class) riêng; chỉ tải detail khi mở.
- Đo row count, payload bytes, thời gian query ở Supabase thật trước và sau tối ưu.

### 9. Asset raster quá nặng — **Đã xác nhận qua phép đo local**

Nhiều button/frame PNG lớn được load cùng initial shell. Hướng xử lý theo thứ tự an toàn:

1. Giữ bản gốc, tạo derivative WebP/AVIF đúng kích thước hiển thị.
2. Chỉ preload artwork thực sự cần cho login/current screen.
3. Lazy-load shop/map/treasure assets khi mở panel.
4. Ghi lại LCP/CLS/transfer bytes ở desktop và tablet trong CI; không tối ưu theo cảm tính.

### 10. Fixed viewport và cấm zoom — **Đã xác nhận; cần cân bằng với gameplay**

`index.html:7` đặt `maximum-scale=1.0`, `user-scalable=no`; `src/style.css:2` đặt `html, body` fixed và `overflow:hidden`. Đây là lựa chọn có thể giúp gameplay toàn màn hình, nhưng làm giảm khả năng zoom và khiến content/modal phụ thuộc vào nhiều scrollbox nội bộ.

Vì chính sách thiết bị ưu tiên laptop và tablet ngang, đây không phải blocker điện thoại. Dù vậy, nên cho phép zoom ở form/auth và bảo đảm mọi panel dài có vùng scroll có tên, nút cuối không bị cắt, focus không bị mất.

### 11. Fixture audit không cùng schema runtime — **Đã xác nhận trong test fixture**

Fixture Admin cũ trong `tests/e2e/homepage.spec.cjs` dùng field `name` cho user và quest. Renderer hiện tại dùng `fullname`, `username`, `title`, `target_subject`, `target_score`, `target_count`... Vì vậy ảnh `admin-players`/`admin-quests` có dòng trống hoặc `undefined`. Đây là false positive của harness, không phải bằng chứng production đã hiển thị như vậy.

Hướng xử lý: tạo factory fixture dùng cùng schema tối thiểu với `app.data`, tái sử dụng cho screenshot audit và test; thêm assertion không có chuỗi `undefined` trong các vùng Admin. Không cần đưa dữ liệu học sinh thật vào fixture.

## P3 — cải thiện sản phẩm và maintainability

### 12. Chuẩn hóa design token

Hướng thẩm mỹ được chốt cho bản đề xuất: **sci-fi classroom có độ tin cậy của dashboard giáo viên**. Nền tối sâu giữ cảm xúc game; surface Admin sáng hơn và ít glow hơn để đọc dữ liệu; màu accent có ý nghĩa ổn định.

```css
:root {
  --ink-950: #050f1a;
  --ink-900: #071421;
  --panel: #0b2333;
  --line: #2e7892;
  --cyan: #54d7ef;   /* điều hướng, hành động chính */
  --gold: #f7c85d;   /* sao, phần thưởng, tiến độ */
  --green: #6cdda0;  /* thành công, đã duyệt */
  --violet: #bf9aff; /* template, nội dung nâng cao */
  --danger: #f87171; /* xóa, lỗi */
  --text: #e9f5fb;
  --muted: #9bb8ca;
}
```

Nguyên tắc dùng token:

- Một màn hình chỉ có một primary action rõ; không để glow cạnh tranh với nội dung.
- Cyan = điều hướng/action, gold = reward, violet = nội dung/template, red = destructive.
- Card dữ liệu dùng border/spacing để phân nhóm; chỉ dùng shadow/glow cho trạng thái cần chú ý.
- Mọi control có focus-visible tương phản cao; mọi trạng thái có text, không chỉ màu.
- Dùng một nhịp spacing và radius cho Admin shell; panel game có thể giữ illustration riêng.

### 13. Hướng xử lý theo từng màn

- **Roster:** giữ card hiện tại làm pattern chuẩn; đặt sort cạnh filter, cho biết thứ tự đang dùng, và giữ hai nút Sửa/Xóa cùng một footer.
- **Soạn Đề:** giữ ba khu vực Template → Câu hỏi → Đề kiểm tra; thêm summary “Cấp lớp / Môn / Học kỳ / số câu” ở header và sticky action ở desktop.
- **Giao nhiệm vụ:** mọi trường có tập giá trị chính xác phải là select/combobox từ dữ liệu thật; hiển thị preview đối tượng đã chọn để Admin xác nhận trước khi lưu.
- **Cấu hình game:** đưa scope, chủ đề, số câu và thời lượng vào một “mission brief” ngay cạnh nút bắt đầu; dùng vùng trống cho hướng dẫn hoặc empty state có ích.
- **Gameplay/Exam:** giữ question-first layout, đưa action bar xuống vùng luôn nhìn thấy trong scroll container; test cả selected, disabled, wrong, correct và final.
- **Settings/History/Treasure:** đưa về cùng Admin shell, chuẩn hóa table density, filter, sort, empty/loading/error state.
- **Shop/Quest board:** giữ minh họa ấm/sáng vì tạo nhịp nghỉ cho học sinh, nhưng lấy typography, focus ring và token chung từ hệ thống.

## Mockup để quyết định hướng thẩm mỹ

Đã render gallery mockup code-native ở 1440×900. Đây là bản đề xuất, **chưa nối production**:

- [Gallery 4 hướng Soạn Đề](../mockups/admin-soan-de-variants.html)
- [Mockup ảnh đã render](../test-results/ui-review/audit-mockup-admin-soan-de-variants.png)
- [Bản mockup single-screen](../mockups/admin-soan-de.html)

Đề xuất chọn **A — Bảng điều khiển sáng** cho Admin vì dễ quét, dễ nhớ vị trí thao tác và phù hợp công việc giáo viên lặp lại hằng ngày. B — Bản đồ hành trình có thể dùng làm biến thể onboarding; C/D phù hợp các màn chuyên biệt nhưng không nên là shell chính.

## Lộ trình hoàn thiện đề xuất

### Phase 0 — security/data integrity

- [ ] Sửa hoặc thay policy update hồ sơ; thêm test RLS adversarial.
- [ ] Xác minh policy/privilege/trigger/RPC trên Supabase thật.
- [ ] Tách update điểm/tiến độ thành payload allowlist và server-authoritative.
- [ ] Thêm giới hạn kích thước input và rate limit cho Edge Function quản lý tài khoản.

### Phase 1 — accessibility và UX core

- [ ] Gắn accessible name cho login/register và lỗi validation.
- [ ] Đổi clickable div thành button/keyboard behavior.
- [ ] Focus trap, inert background, Escape và restore focus cho mọi dialog.
- [ ] Chuẩn hóa fixture audit; chặn `undefined` trong ảnh/snapshot Admin.

### Phase 2 — performance và lifecycle

- [ ] Cleanup matching resize listener và realtime subscription.
- [ ] Tách projection/pagination/query server-side; đo payload và row count thật.
- [ ] Derivative WebP/AVIF, lazy-load theo screen, preload có chủ đích.
- [ ] Bổ sung baseline Core Web Vitals và memory/listener smoke test.

### Phase 3 — design system và màn hình cũ

- [ ] Đưa token vào `:root`/component convention dùng chung.
- [ ] Migrate Settings/History/Treasure về Admin shell.
- [ ] Chuẩn hóa empty/loading/error/disabled/focus state.
- [ ] Giảm inline style/inline handler ở các vùng đã ổn định.

### Phase 4 — content/release QA

- [ ] Validate template payload trước khi lưu và trước khi render.
- [ ] Chạy matrix lớp/môn/template, gồm câu có SVG, matching và ảnh.
- [ ] Manual keyboard + screen reader smoke test cho auth, Admin và gameplay.
- [ ] Re-run performance trên laptop/tablet mục tiêu và ghi số liệu vào release checklist.

## Definition of Done cho vòng triển khai tiếp theo

- Không có đường tự nâng quyền/tự sửa điểm qua Supabase client hoặc RLS.
- Mọi field form quan trọng có label, validation và keyboard path.
- Dialog không làm mất focus; không có content chính bị cắt ở viewport mục tiêu.
- Không có listener/channel tăng dần sau khi đổi câu, logout/login hoặc mở/đóng panel.
- Admin list không tải payload thừa và có pagination/filter server-side khi dữ liệu tăng.
- Initial asset transfer giảm đáng kể so với baseline ~10 MB, có số đo trước/sau.
- `npm test`, accessibility smoke test và runtime performance gate đều xanh.

## Những gì không thay đổi trong phiên audit

- Không sửa code game để triển khai các đề xuất.
- Không thêm/xóa/sửa schema hoặc dữ liệu Supabase thật trong phiên này.
- Không ghi tên học sinh, credential, answer key hoặc dữ liệu production vào báo cáo.
- Không commit/merge/push các thay đổi đang có trong working tree; các thay đổi đó thuộc công việc trước và được giữ nguyên.
