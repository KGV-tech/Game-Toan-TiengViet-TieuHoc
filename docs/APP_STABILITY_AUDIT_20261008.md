# Audit ổn định toàn ứng dụng — 08/10/2026

## Phạm vi và phương pháp

Rà luồng đăng nhập/quyền, dữ liệu/cài đặt, lộ trình/luyện tập, cấu hình/câu hỏi,
Đề kiểm tra, Phiếu/OCR/in, nhiệm vụ và thi đua. Giữ Phiếu và Đề độc lập; ưu tiên
laptop/tablet ngang. Không thay đổi schema, RLS hoặc dữ liệu production.

Skills áp dụng: diagnosing-bugs, tdd, implement, codebase-design, code-review,
ui-ux-pro-max, git-workflow-and-versioning. Test lỗi qua SDK và thao tác UI thật; không thay thế cả hàm lưu
bằng stub thành công. Review Spec và Standards độc lập, mỗi finding có vòng
kiểm tra lại. Tra cứu UX: error recovery, error feedback, accessible error.

## Khu vực đã kiểm tra

| Khu vực | Kiểm tra và bằng chứng |
|---|---|
| Auth/quyền | student-login, auth/security/progress contracts; đổi tài khoản, profile/Auth mapping, chặn trạm Admin và cửa hàng học sinh |
| Dữ liệu/cài đặt | settings-persistence/settings-row; 0 hàng, lỗi mạng, offline, đọc lại, JSONB, đúng id=1, realtime |
| Lộ trình/luyện tập | learning-path, learning-settings-sync, practice-completion; mốc lớp/môn, bỏ đủ điểm, nháp/history, retry điểm |
| Cấu hình/câu hỏi | template contracts và editor/gameplay specs; metadata/scoring, dạng câu/câu con, preview, lưu/xóa/import |
| Đề kiểm tra | exam-composer/library, authoring-plan; sinh câu, điểm, validation, form lỗi, retry, ghi đồng thời |
| Phiếu/OCR/in | worksheet-library/import/paddle/question-types/layout/source-print; PDF/DOCX, OCR cục bộ, ô trống, nhóm/câu con, A4, nộp/chấm |
| Nhiệm vụ/thi đua | quest-management, team-competition, weekly specs; giao phạm vi, trạng thái, điểm 0, staging/retry, tổ/nhóm/tuần, mất mạng |
| UI/lifecycle | homepage/composer-station/steps, startup-budget, tablet touch, light/dark, reduced motion, modal/focus, screenshot desktop/tablet |
| Tài nguyên | 151 tham chiếu HTML/CSS local: không thiếu file; node --check 34 tệp JS ứng dụng: không lỗi cú pháp |
| Production | Chỉ kiểm tra bản triển khai/asset sau merge; chưa xác minh phiên Auth Admin hoặc GRANT/RLS thực tế |

Đã xem ảnh render sáng/tối của trình biên soạn trên laptop/tablet và bản in phục hồi từ ảnh mẫu. Bản in giữ bố cục nhưng còn ký tự OCR đọc sai; kiểm tra cấu trúc 2 trang/3 nhóm không chứng minh mọi ký tự đúng. Admin vẫn cần đối chiếu và hiệu chỉnh trước khi giao/in.

Các kiểm tra trên là phạm vi đã thực hiện, không phải khẳng định mọi trạng thái
production hoặc mọi ảnh OCR đều chính xác. Các ca browser dùng SDK giả lập,
chặn Supabase thật. Không đưa ảnh hoặc dữ liệu học sinh thật vào fixture Git.

## Lỗi đã sửa

| ID | Mức | Tái hiện và bản sửa |
|---|---|---|
| DATA-01 | P1 | Settings UPDATE 0 hàng/error null báo thành công. Nay UPDATE trả đúng row + SELECT lại đúng snapshot mới báo lưu/cache |
| DATA-02 | P1 | Helper settings/id dùng ILIKE cho ID số. Nay EQ đúng id=1 |
| DATA-03 | P2 | Login/realtime có thể lấy hàng cài đặt khác. Nay lọc và kiểm tra id=1 |
| DATA-04 | P1 | saveLibrary bỏ qua lỗi upsert/insert. Nay trả lỗi, xác nhận ID, caller chờ lưu |
| DATA-05 | P1 | Metadata UPDATE chưa xác nhận, cache payload lỗi. Nay dùng đường xác nhận settings |
| DATA-06 | P1 | Xóa câu hỏi/Đề/Phiếu không xác nhận row. Nay không bỏ dữ liệu/xóa queue khi server chưa xác nhận |
| DATA-07 | P2 | Tombstone Phiếu kẹt sau DELETE thành công nhưng mất response. Retry đối chiếu vắng mặt chỉ sau Auth + profile Admin từ server |
| DATA-08 | P1 | Hai đề lưu đồng thời: phản hồi cũ ghi đè thay đổi mới. Queue ghi tại owner Kho Đề/Kho Phiếu, độc lập từng kho |
| EDIT-01 | P1 | Form câu hỏi báo thành công trước lưu. Nay giữ form, khôi phục mục local khi lỗi và giữ ID đã cấp để retry |
| EDIT-02 | P1 | Retry preview bỏ qua lưu lỗi vì câu đã ở local. Nay retry luôn đi qua saveLibrary |
| EDIT-03 | P1 | Import ghi đè Đề/file không hợp lệ làm mất kho; DELETE lỗi vẫn tiếp tục. Nay validate trước, xác nhận xóa rồi mới thay kho |
| EDIT-04 | P1 | Import ghi đè câu hỏi DELETE 0 hàng vẫn tiếp tục. Nay xác nhận IDs trước khi thay kho |
| EDIT-05 | P2 | Lưu Đề/Phiếu lỗi đóng form; đổi tên trước retry tạo hai bản không ID. Nay giữ form và nhận diện pending draft bằng reference/ID |
| EDIT-06 | P1 | Bấm cùng nút xóa câu hai lần lúc lưu chậm xóa thêm câu kế tiếp. Khóa mutation theo record tới khi lưu xong |
| EDIT-07 | P2 | Validation đề chưa xong đã bổ sung câu vào Kho Câu hỏi. Nay gom buffer sau toàn bộ validation và chống trùng cả trong buffer |
| FILE-01 | P2 | Parse Excel lỗi hoặc thư viện không tải làm nút nhập bị kẹt. Nay await đọc/parse/callback, chuyển lỗi về caller và mở lại nút |
| QUEST-01 | P2 | Điểm tối thiểu 0 bị đổi thành 80; điểm ngoài 0–100 vẫn lưu. Nay giữ 0, kiểm tra điểm/lượt/phần thưởng |
| QUEST-02 | P1 | UPDATE/DELETE nhiệm vụ 0 hàng vẫn đổi trạng thái local. Nay xác nhận row/trạng thái trước đổi |
| QUEST-03 | P1 | Metadata phạm vi lỗi nhưng nhiệm vụ vẫn mở, reload mất phạm vi. Nay staging đóng với dấu title lưu server; chỉ mở sau metadata xác nhận; retry giữ ID, reload bản chưa hoàn tất không cho bật |

Các triệu chứng chính có test đỏ trước sửa. Finding từ review được bổ sung ca
retry, slow response, đảo thứ tự phản hồi và reload; review lại không còn blocker.
Các fixture cũ giả định error=null là thành công đã đổi để trả row xác nhận đúng
contract, không nới assertion của các test bảo vệ dữ liệu.

## Cổng kiểm tra

- 69 file contract Node; toàn bộ chạy trong npm test.
- 50 ca targeted (audit mới, authoring-plan và Garden): đạt. 11 ca ảnh riêng/đồng hồ: đạt; gồm cả 3 ca OCR với hai ảnh người dùng cung cấp.
- Cổng phát hành cuối: 69 tệp contract Node đạt; 477 ca Chromium đạt (8,3 phút), 0 lỗi/0 bỏ qua. Chạy test:contracts rồi test:browser --workers=4 với WORKSHEET_QA_IMAGE và WORKSHEET_QA_IMAGE_2. npm audit: 0 vulnerabilities.
- Có ca touch/Garden không ổn định khi chạy song song nhiều cổng; chạy riêng đạt.
  Đồng hồ giả weekly-admin-polish install/pause cùng mốc có thể báo quay về quá khứ: lùi mốc install 60 giây, giữ nguyên assertions 5,9/6,1 giây; 8 ca liên quan đạt. Space Launch có race đo row trong lúc bảng thay DOM mỗi giây: lượt trước 473 đạt/1 lỗi, chạy riêng 5 đạt. Đổi phép đo thành expect.poll, giữ yêu cầu ≥44 px. Garden cũng đo boundingBox giữa hai lần thay DOM và nhận null: đo lại row hiện hành, giữ nguyên assertion hover và bounds; 10 ca Garden/Space Launch đạt. Cổng cuối không chạy cạnh tranh với cổng nặng khác.
- git diff --check và kiểm tra cú pháp đạt.

## Dependency và giới hạn production

npm audit phát hiện nhánh Mammoth CLI → argparse 1 → sprintf-js có 3 cảnh báo
moderate cùng một advisory: [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).
Bộ browser Mammoth dùng trong game không chứa argparse/sprintf; chỉ CLI có require.
Đã override argparse 2.0.1 riêng cho Mammoth, loại sprintf-js; npm audit: 0 vulnerabilities. CLI --help và chuyển DOCX tiếng Việt đạt (API cũ chỉ báo deprecated); giữ nguyên Mammoth 1.13.0 và browser bundle.
Không chạy npm audit fix --force vì nó đề xuất hạ Mammoth về bản cũ không tương thích.

Chưa kết luận nguyên nhân riêng của lần Admin lưu bài 9 trên production là RLS,
phiên Auth, hàng thiếu hay thao tác khác ghi đè. SQL kèm chỉ đọc:
settings-diagnosis-readonly.sql. Không chạy SQL production trong đợt audit này.
DevTools MCP/Computer Use không khả dụng; dùng Playwright cho runtime/DOM/network/
screenshot. Chưa tuyên bố kiểm chứng Safari/iPad thật hoặc tài khoản Admin thật.

## Review cuối

- Spec: không còn finding bắt buộc sau các vòng tái hiện và sửa.
- Standards: không còn blocker; dependency/đo HUD cũng đã review riêng.
- Giữ helper xác nhận xóa và queue ở owner dữ liệu, tránh nhân bản các nhánh xác nhận ở caller. Không refactor lớn main.js trong đợt sửa hành vi này.
