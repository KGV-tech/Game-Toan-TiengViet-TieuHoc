# Đặc tả: Thi đua đội nhóm trong lớp

## Trạng thái tài liệu

**Đã chốt để làm nguồn yêu cầu duy nhất trước khi triển khai.**

## Trạng thái triển khai hiện tại

Vertical slice local/demo và lớp tích hợp production đã được thêm vào repo: domain validation/chia đội, workspace Admin, bảng thi đua, luồng trưởng nhóm, migration/RLS/RPC/realtime Supabase, adapter đồng bộ máy chủ và contract/browser tests. Project đích đã được người phụ trách xác nhận là `bjgbbrufnryrtimtzvhn` (`https://bjgbbrufnryrtimtzvhn.supabase.co`). File migration cần được chạy trong SQL Editor/CLI của đúng project trước khi bật luồng production; adapter vẫn tự rơi về local/demo khi SDK hoặc schema chưa sẵn sàng.

Phiên bản này cập nhật quyết định về điều kiện thiết bị và điều hành tại lớp: thi đua diễn ra trực tiếp trong lớp, mỗi đội dùng chung **một tablet**, chỉ **một tài khoản trưởng nhóm** đăng nhập để làm bài, còn Admin có một bảng thi đua toàn màn hình để trình chiếu lên TV. Không được quay lại các quy tắc cũ “mỗi thành viên làm một phần” hoặc “các đội phải bằng số người”.

Khi bắt đầu code, đọc toàn bộ tệp này cùng `docs/PROJECT_CONTEXT.md`, `docs/AI_WORKFLOW.md` và `docs/UX_DEVICE_POLICY.md`. Không hỏi lại các quyết định đã ghi là **Đã chốt**. Nếu triển khai sang một project Supabase khác, phải xin xác nhận project mới theo `AGENTS.md`.

## Mục tiêu và bối cảnh sử dụng

Tạo một hoạt động thi đua ngắn trong **một lớp học, trong giờ dạy**:

- Giáo viên có thể soạn trước nhiều trận ở nhà.
- Khi vào lớp, giáo viên mở bản nháp/đã chuẩn bị, kiểm tra hoặc chỉnh lại đội, trưởng nhóm, bài và thời gian rồi bắt đầu.
- Học sinh trong mỗi đội ngồi cùng nhau quanh một tablet, thảo luận đáp án; trưởng nhóm nhập và nộp đáp án bằng tài khoản được chỉ định.
- Kết thúc trận, điểm của đội được gán như nhau cho mọi thành viên trong đội.

Đây là kết quả của từng trận, không phải hệ thống xếp hạng tích lũy dài hạn.

## Vị trí giao diện quản trị

Vị trí: **Cài đặt (Admin) → Quản lý nhiệm vụ**.

Khu vực này có hai tab con:

- **Cá nhân:** giữ nguyên toàn bộ chức năng nhiệm vụ cá nhân hiện có; không hồi quy.
- **Đội nhóm:** danh sách, tạo, sửa, chuẩn bị, mở bảng thi đua toàn màn hình, bắt đầu, theo dõi thời gian thực và xem kết quả các trận thi đua đội.

Thiết kế ưu tiên laptop/desktop và tablet ngang theo `docs/UX_DEVICE_POLICY.md`. Tablet là thiết bị gameplay chính của trận; không thiết kế gameplay riêng cho điện thoại dọc.

## Thuật ngữ và nguyên tắc đã chốt

- **Trận:** một cấu hình thi đua của một lớp, có đội hình, bộ câu hỏi, thời gian và kết quả riêng.
- **Đội:** nhóm học sinh được giáo viên phân vào trận.
- **Trưởng nhóm:** chính xác một học sinh thuộc đội, được giáo viên chỉ định, dùng tài khoản của mình đăng nhập trên tablet và là người duy nhất được nộp bài.
- **Lượt làm đội:** một lượt làm bài duy nhất của một đội; không có lượt làm riêng cho từng thành viên.
- **Bảng thi đua nhóm:** màn hình điều hành toàn màn hình của Admin; trước khi bắt đầu dùng để kiểm tra/chỉnh từng đội, sau khi bắt đầu dùng để trình chiếu tiến độ, điểm và thời gian thực của tất cả đội.
- Một trận chỉ thuộc **một lớp**; không thi đua giữa nhiều lớp.
- Giáo viên chọn học sinh từ danh sách học sinh đã duyệt của lớp. Mỗi học sinh chỉ thuộc tối đa một đội trong một trận; giáo viên có thể chọn toàn bộ hoặc một phần học sinh của lớp.
- Mỗi đội phải có ít nhất một thành viên và đúng một trưởng nhóm. Các đội **được phép khác nhau về số lượng thành viên**.
- Không dùng tổng điểm tích lũy (`totalscore`) để xếp trận và không cộng điểm đội theo số thành viên.
- Sau khi chốt trận, mỗi thành viên nhận cùng một `điểm cá nhân của trận = điểm đội`. Điểm này phải được lưu trong bản ghi kết quả thi đua liên kết với từng thành viên để xem lại.
- Bản ghi điểm thi đua nhóm không tự động làm tăng `totalscore`, sao, tiến độ mở khóa chủ đề, lịch sử luyện tập/thi cá nhân hoặc nhiệm vụ cá nhân hiện có. Nếu muốn dùng điểm trận cho các hệ thống đó, phải có yêu cầu riêng.
- Không hiển thị bảng xếp hạng chi tiết từng thành viên cho học sinh. Học sinh thấy đội của mình, điểm đội, hạng đội và điểm cá nhân được gán từ đội.
- Dữ liệu trình chiếu cho cả lớp chỉ ở cấp đội (tên/nhãn đội, điểm, tiến độ, thời gian, trạng thái); danh sách tên học sinh và chi tiết cá nhân chỉ hiện trong vùng quản trị phù hợp, không mặc định chiếu lên TV.

## Vòng đời trận

Trận luôn có đúng bốn trạng thái:

`Nháp` → `Đã chuẩn bị` → `Đang diễn ra` → `Đã kết thúc`

| Trạng thái | Ý nghĩa | Quyền của giáo viên | Trải nghiệm học sinh |
| --- | --- | --- | --- |
| **Nháp** | Trận đang được soạn trước ở nhà; giáo viên có thể tạo và giữ nhiều trận nháp. | Sửa/xóa toàn bộ tên, lớp, số đội, đội hình, trưởng nhóm, bộ đề và thời gian. Chuyển sang Đã chuẩn bị khi hợp lệ. | Không thể vào làm. |
| **Đã chuẩn bị** | Trận đã vượt qua kiểm tra và sẵn sàng cho tiết học. Khi mở trạng thái này, Admin vào **Bảng thi đua nhóm** toàn màn hình. | Có thể mở lại để check/chỉnh sửa. Mỗi ô đội có nút Thay đổi; nếu chỉnh vẫn hợp lệ, giữ trạng thái; nếu cấu hình mất hợp lệ, chuyển về Nháp. Bảng có một nút chung lớn **Bắt đầu thi đua**. | Chưa thể nộp bài. |
| **Đang diễn ra** | Giáo viên đã bấm Bắt đầu trên Bảng thi đua; đồng hồ chung chạy nếu có. Các ô đội chuyển sang cập nhật thời gian thực. | Không sửa đội, trưởng nhóm, đề, số câu hoặc thời gian. Xem tiến độ/điểm/thời gian từng đội; được phép Kết thúc sớm để chốt điểm đang có. | Chỉ trưởng nhóm của từng đội đăng nhập trên tablet và làm lượt của đội. |
| **Đã kết thúc** | Điểm đội và điểm gán cho thành viên đã chốt. | Xem kết quả và chi tiết; không sửa điểm, không mở lại lượt, không đổi đội hình. | Không thể nộp hoặc làm tiếp; có thể xem kết quả được phép hiển thị. |

### Quy tắc chuyển trạng thái

- `Nháp → Đã chuẩn bị`: chỉ khi toàn bộ kiểm tra hợp lệ đạt.
- `Đã chuẩn bị → Nháp`: xảy ra khi giáo viên sửa làm cấu hình không hợp lệ; giáo viên được sửa tiếp rồi chuẩn bị lại.
- `Đã chuẩn bị → Đang diễn ra`: chỉ giáo viên/admin có quyền bấm Bắt đầu trận.
- `Đang diễn ra → Đã kết thúc`: tự động khi hết thời gian hoặc do giáo viên bấm Kết thúc trận; giáo viên được kết thúc sớm cả trận không giới hạn thời gian.
- Không có chuyển ngược từ `Đang diễn ra`/`Đã kết thúc`, không mở lại trận đã kết thúc trong MVP.

Khi trận ở `Đã chuẩn bị`, bảng thi đua phải mở được lại từ danh sách trận nếu Admin rời màn hình. Nút **Bắt đầu thi đua** cần xác nhận lần cuối trước khi chuyển trạng thái vì sau đó đội hình, đề và thời gian bị khóa. Sau khi bắt đầu, các nút Thay đổi trong ô đội biến mất hoặc bị vô hiệu hóa.

## Tạo và chuẩn bị trận

### 1. Tên trận

- Bắt buộc, không rỗng.
- Ví dụ: `Đua tiếp sức Toán – 5A`.

### 2. Lớp và số đội

- Chọn đúng một lớp.
- Nhập số lượng đội cần tạo, là số nguyên dương.
- Không còn ràng buộc tổng số học sinh phải chia hết cho số đội.

### 3. Số lượng thành viên từng đội

Trường “số lượng thành viên trong từng nhóm” được hiểu là **số lượng riêng của từng đội**, không phải một con số bắt buộc giống nhau cho mọi đội.

- Mỗi đội phải có ít nhất một học sinh.
- Ở chế độ thủ công, giáo viên có thể phân bố khác nhau, ví dụ `8 / 8 / 8 / 7` hoặc bất kỳ phân bố hợp lệ nào dựa trên danh sách đã chọn. Giao diện hiển thị số thực tế của từng đội.
- Giao diện tạo một ô “Số thành viên mục tiêu” riêng cho từng đội. Các ô được phép khác nhau; nếu điền thì tổng các mục tiêu phải bằng số học sinh tham gia và đội hình thực tế phải khớp trước khi chuẩn bị.
- Ở chế độ ngẫu nhiên, game có nút “Tự chia đều” (mặc định) để điền mục tiêu gần đều nhất; nếu giáo viên đã nhập mục tiêu riêng, game xáo danh sách và phân đúng theo các mục tiêu đó. Ví dụ 31 học sinh/4 đội → `8 / 8 / 8 / 7`.
- Chênh lệch số người không làm thay đổi cách tính điểm: mỗi đội chỉ có một lượt làm và điểm được chuẩn hóa trên cùng thang điểm.

### 4. Danh sách học sinh và chia đội

- Nguồn là danh sách học sinh đã duyệt của lớp đã chọn.
- Giáo viên chọn danh sách tham gia; không được có học sinh trùng đội, sai lớp hoặc ngoài danh sách đã duyệt.
- **Thủ công:** giáo viên xếp từng học sinh vào đội; mỗi đội phải có ít nhất một người và chính xác một trưởng nhóm.
- **Ngẫu nhiên:** game xáo danh sách học sinh giáo viên đã chọn và phân vào số đội theo mục tiêu đã nhập, hoặc tự cân bằng gần đều nếu không có mục tiêu. Sau khi xáo, giáo viên phải xem được kết quả, chọn trưởng nhóm cho từng đội và được chỉnh tay trước khi chuyển sang Đã chuẩn bị.
- Một học sinh không thể làm trưởng nhóm của hai đội trong cùng trận.
- Nếu trưởng nhóm vắng trước khi bắt đầu, giáo viên có thể đổi trưởng nhóm trong Nháp/Đã chuẩn bị. Sau khi trận bắt đầu thì không đổi trưởng nhóm.
- Không cho chuẩn bị nếu thiếu đội, đội rỗng, thiếu/trùng học sinh, sai lớp, thiếu trưởng nhóm hoặc tổng danh sách không hợp lệ.

### 5. Bài làm của trận

- Dùng đúng trải nghiệm, format soạn đề và các loại câu hỏi hiện có ở phần quản lý đề; không tạo format câu hỏi riêng cho thi đua nhóm.
- **Một bài làm giống nhau cho các đội:** mọi đội nhận cùng một bộ câu hỏi, cùng thứ tự/cấu trúc theo cấu hình trận.
- **Mỗi đội một bài làm khác nhau:** giáo viên soạn/chọn một bộ câu hỏi riêng cho từng đội.
- Mọi bộ đề trong cùng trận phải có **cùng số câu**. Không chia câu theo số thành viên.
- Với đề khác nhau, giáo viên chịu trách nhiệm chọn đề tương đương về nội dung/độ khó; MVP không tự đánh giá độ khó hay tuyên bố công bằng.
- Khi trận bắt đầu, nên chụp/lưu snapshot bộ câu hỏi gắn với trận để việc sửa thư viện đề sau đó không thay đổi kết quả đang diễn ra hoặc đã chốt.

### 6. Thời gian làm bài nhóm

- **Có thời gian:** nhập số phút là số nguyên dương. Đây là một đồng hồ chung cho toàn trận, bắt đầu chính xác khi giáo viên bấm Bắt đầu trận.
- **Không có thời gian:** không áp dụng đồng hồ; giáo viên chủ động bấm Kết thúc trận.
- Hết giờ tự động chuyển sang Đã kết thúc và khóa tất cả lượt. Kết thúc sớm cũng chốt các đáp án/điểm đã được ghi nhận tại thời điểm đó.
- Mỗi đội phải lưu các mốc `started_at`, `completed_at` hoặc `locked_at` và thời lượng thực tế của lượt đội. Thời lượng tính từ lúc trưởng nhóm mở lượt đến lúc nộp xong hoặc bị khóa; nếu chưa mở lượt thì ghi nhận trạng thái chưa bắt đầu và không tự bịa thời gian.

## Cách chơi trên tablet

- Mỗi đội dùng một tablet trong lớp.
- Chỉ tài khoản trưởng nhóm đăng nhập trên tablet của đội và mở lượt làm đội.
- Các thành viên còn lại không cần đăng nhập, không có màn hình trả lời riêng và không được mở thêm lượt trên thiết bị khác; các em thảo luận trực tiếp rồi thống nhất đáp án để trưởng nhóm nhập.
- Trưởng nhóm nhìn thấy **toàn bộ bộ câu hỏi của đội mình**, không phải một phần câu hỏi. Không có cơ chế tự chia câu cho từng thành viên.
- Với bài chung, các đội cùng làm cùng bộ câu hỏi. Với bài riêng, mỗi đội làm bộ câu hỏi được gắn cho đội đó.

## Tính điểm và gán điểm cá nhân

- Một đội có đúng một lượt làm bài và một điểm cuối trận.
- Điểm từng câu được chấm bằng đúng quy tắc hiện có cho loại câu hỏi đó. Đáp án do trưởng nhóm nộp là đáp án chung của đội.
- `điểm đội` là điểm cuối của toàn bộ lượt làm đội trên thang điểm hiện có (thông thường 0–10, có thể có số thập phân như 8,25).
- Điểm đội **không** phải tổng điểm của các thành viên, vì thành viên không có lượt làm riêng.
- Câu chưa nộp được tính 0. Nếu đội chưa nộp câu nào hoặc trưởng nhóm chưa mở lượt, điểm đội là 0.
- Sau khi trận Đã kết thúc, mọi thành viên thuộc đội nhận cùng một kết quả: `điểm cá nhân của trận = điểm đội`. Ví dụ đội đạt 8,25 thì trưởng nhóm và tất cả thành viên còn lại đều được ghi nhận 8,25.
- Không nhân/chia điểm theo số lượng thành viên; đội 7 người và đội 8 người vẫn có cùng thang điểm và cùng cách xếp hạng.
- Bảng thi đua hiển thị thời gian đã dùng/thời điểm hoàn thành của từng đội để tạo động lực thi đua tốc độ.
- Xếp hạng hiện tại theo điểm đội giảm dần. Nếu bằng điểm thì cùng hạng; thời gian được lưu làm dữ liệu căn cứ cho các kết quả/quy tắc sau này nhưng **không tự động phá hòa trong MVP** nếu chưa có yêu cầu mới.

## Lượt làm, lưu điểm và chống làm lại

Đây là luật bắt buộc để phù hợp hoạt động thi trực tiếp; không dùng cơ chế chỉ lưu sau khi hoàn thành bài như bài luyện tập hiện có.

1. Khi trưởng nhóm mở bài, hệ thống tạo một `lượt làm đội` duy nhất, gắn với trận, đội và tài khoản trưởng nhóm.
2. Mỗi câu trưởng nhóm nộp được chấm và lưu bền vững trên máy chủ ngay lập tức; không chờ nộp toàn bộ bài.
3. Mỗi câu chỉ được nộp một lần; không sửa đáp án, không nộp lại, không làm lại để cải thiện điểm.
4. Trước khi thực hiện thao tác có chủ đích như Đăng xuất, Thoát bài, chuyển tài khoản hoặc điều hướng khỏi lượt, game phải hiện hộp cảnh báo với đúng hai nút **OK** và **Hủy**. Nội dung phải nói rõ: nếu chọn OK, lượt đội sẽ bị khóa và không thể làm tiếp; các câu đã nộp vẫn được giữ điểm. Nút mặc định/focus an toàn là Hủy.
5. Chỉ khi trưởng nhóm chọn **OK**, game mới đánh dấu lượt làm đội **vi phạm/rời bài và khóa**, sau đó mới cho đăng xuất/thoát/chuyển tài khoản.
6. Với refresh hoặc đóng tab/cửa sổ, trình duyệt có thể không cho hiển thị hộp thoại HTML tùy biến. Game phải dùng cơ chế cảnh báo rời trang của trình duyệt làm fallback; hành vi chấp nhận rời trang tương đương OK, hủy rời trang tương đương Hủy. Phải dùng ghi nhận bền vững/best-effort beacon và kiểm tra phiên trên máy chủ để không cho lượt đã rời quay lại.
7. Sau khi bị khóa, trưởng nhóm và đội **không được làm tiếp**, kể cả trên cùng tablet hay thiết bị khác; không có đổi trưởng nhóm để tiếp tục trong MVP.
8. Các câu đã nộp trước lúc rời vẫn được giữ điểm và tính vào điểm đội. Câu chưa nộp nhận 0 điểm.
9. Nếu trưởng nhóm rời trước khi nộp câu nào, điểm đội là 0; trạng thái khóa vẫn được lưu để giáo viên biết.
10. Khi hết giờ hoặc giáo viên kết thúc sớm, mọi lượt chưa hoàn tất bị khóa; câu chưa nộp nhận 0. Không ai được tiếp tục nộp sau thời điểm chốt.
11. Hệ thống phải chống double-click, retry mạng hoặc gửi lặp làm ghi một câu/điểm nhiều lần.
12. Giáo viên không sửa điểm, mở lại lượt hoặc bỏ trạng thái vi phạm trong MVP; chỉ xem chi tiết để điều hành lớp.

## Màn hình cần có

### Admin: tab Đội nhóm

- Danh sách trận theo lớp, tên, trạng thái, số đội, số học sinh tham gia, thời gian và thời điểm tạo/cập nhật.
- Lọc theo lớp và trạng thái là đủ cho MVP.
- Hành động theo trạng thái: tạo mới, mở/sửa Nháp hoặc Đã chuẩn bị, chuyển sang Đã chuẩn bị, mở Bảng thi đua, bắt đầu, theo dõi, kết thúc sớm và xem kết quả.

### Admin: tạo/sửa trận

- Trường tên trận, lớp, số đội, danh sách học sinh, chế độ thủ công/ngẫu nhiên, số lượng mục tiêu (nếu dùng), đội hình, trưởng nhóm, chế độ bài chung/bài riêng, bộ đề, số câu và thời gian.
- Hiển thị kiểm tra hợp lệ theo thời gian thực: đội không rỗng, số học sinh, trùng/sai lớp, trưởng nhóm, số câu giữa các đề và thời gian.
- Với chia ngẫu nhiên, hiển thị đội hình và trưởng nhóm để giáo viên duyệt/chỉnh trước khi chuẩn bị.
- Khi đã bắt đầu, các trường cấu hình bị khóa.

### Admin: Bảng thi đua nhóm toàn màn hình

Đây là màn hình chung để Admin điều hành và trình chiếu lên TV. Với `N` đội, màn hình có `N` ô/thẻ đội trong cùng một bố cục; bố cục phải tự điều chỉnh để vẫn đọc được ở laptop/desktop và tablet ngang.

**Trước khi bắt đầu (trạng thái Đã chuẩn bị):**

- Hiển thị rõ tên trận, lớp, số đội, chế độ bài chung/bài riêng, số câu mỗi bộ đề và thời lượng.
- Mỗi ô đội hiển thị tên/nhãn đội, số thành viên, trưởng nhóm và danh sách thành viên trong vùng quản trị; có nút **Thay đổi** riêng cho ô đó.
- Nút Thay đổi mở phần chỉnh đội hình/trưởng nhóm/bộ đề của đúng đội. Lưu xong phải chạy lại kiểm tra hợp lệ.
- Có một nút chung, lớn và nổi bật **Bắt đầu thi đua**. Nút chỉ bật khi toàn bộ trận hợp lệ và phải có xác nhận lần cuối.

**Sau khi bấm Bắt đầu (trạng thái Đang diễn ra):**

- Các ô đội chuyển từ thông tin cấu hình sang bảng cập nhật thời gian thực; nút Thay đổi bị ẩn/vô hiệu hóa.
- Mỗi ô hiển thị tối thiểu: tên/nhãn đội, trạng thái (chưa mở/đang làm/đã hoàn thành/bị khóa/đã chốt), điểm tạm tính hoặc điểm hiện tại, số câu đã nộp trên tổng số câu, số câu đúng nếu có, thời gian đã dùng hoặc thời điểm hoàn thành, và lý do khóa nếu có.
- Hiển thị đồng hồ chung còn lại ở vị trí nổi bật nếu trận có giới hạn thời gian.
- Khi một đội nộp xong, ô đội phải ghi nhận thời điểm hoàn thành và thời lượng làm bài; thông tin này không được mất khi refresh bảng.
- Có nút **Kết thúc trận** cho giáo viên; phải xác nhận vì thao tác không thể hoàn tác.
- Màn hình trình chiếu chỉ hiển thị dữ liệu cấp đội và tổng hợp; không chiếu mật khẩu, đáp án đúng, dữ liệu cá nhân nhạy cảm hoặc chi tiết riêng của từng học sinh.

**Cập nhật thời gian thực:**

- Trạng thái/điểm/tiến độ trên bảng lấy từ dữ liệu máy chủ và cập nhật qua kênh realtime; không chỉ dựa vào state của một trình duyệt Admin.
- Khi mất kết nối, bảng phải báo trạng thái kết nối và đồng bộ lại từ máy chủ khi kết nối trở lại; không tự suy đoán hoặc ghi đè điểm.

### Admin: theo dõi trận đang diễn ra

- Thấy đồng hồ chung nếu có, trạng thái từng đội: chưa mở, đang làm, đã hoàn thành, bị khóa do rời bài hoặc đã chốt.
- Thấy số câu đã nộp, điểm tạm tính, thời lượng đã dùng và điểm cuối dự kiến của từng đội; các thông tin này đồng nhất với Bảng thi đua nhóm.
- Có nút Kết thúc trận; thao tác này phải có xác nhận vì không thể hoàn tác.

### Học sinh/trưởng nhóm: trận đang diễn ra

- Trên tablet của trưởng nhóm: tên trận, tên đội, bộ câu hỏi đầy đủ, tiến độ số câu, đồng hồ chung nếu có và nút nộp từng câu/nộp bài theo trải nghiệm game hiện có.
- Thành viên không phải trưởng nhóm nếu đăng nhập ở nơi khác chỉ được xem thông tin được phép; không có quyền mở hoặc ghi lượt làm đội.
- Sau mỗi lần nộp câu, hiển thị phản hồi chấm điểm theo trải nghiệm hiện có và ghi điểm máy chủ.
- Khi hoàn tất: hiển thị đã nộp và chờ giáo viên kết thúc/chốt trận.
- Khi bị khóa do thoát/refresh: thông báo rõ “Lượt thi đua của đội đã bị khóa vì rời bài; không thể làm tiếp”, kèm số điểm đã ghi nhận.

### Kết quả sau trận

- Hiển thị tên trận, lớp, các đội, số thành viên, điểm đội và thứ hạng.
- Học sinh xem đội của mình, điểm đội/hạng đội và điểm cá nhân được gán bằng điểm đội; không xem điểm chi tiết của bạn khác nếu không được phép.
- Giáo viên xem thêm trưởng nhóm, danh sách thành viên, trạng thái lượt làm, số câu đúng/chưa nộp, điểm đội và điểm được gán cho từng thành viên; không sửa kết quả.

## Mô hình dữ liệu và an toàn triển khai

Cần các bản ghi bền vững riêng cho:

- cấu hình trận và trạng thái vòng đời;
- đội thuộc trận, tên/nhãn đội nếu có, thành viên và trưởng nhóm;
- snapshot bộ đề/câu hỏi của trận và liên kết bộ đề theo đội;
- một lượt làm cho mỗi đội, trạng thái khóa/lý do khóa, phiên trưởng nhóm và các mốc `started_at`, `completed_at` hoặc `locked_at`;
- đáp án và điểm từng câu của lượt làm đội;
- điểm cuối đội, thời lượng thực tế và bản ghi kết quả gán cho từng thành viên (`individual_score = team_score`).

Không lưu đội hình, khóa lượt hoặc điểm trận chỉ trong `localStorage`, vì giáo viên và nhiều tablet phải thấy cùng trạng thái.

Kiểm tra quyền ở máy chủ/RLS:

- Giáo viên/admin tạo, sửa, chuẩn bị, bắt đầu, kết thúc và xem chi tiết trận của lớp được phép.
- Trưởng nhóm chỉ đọc bộ câu hỏi của đội mình và ghi đáp án một lần cho lượt của đội mình; phiên đã rời/khóa không được mở lại.
- Thành viên chỉ đọc thông tin đội/kết quả được phép, không ghi đáp án và không mở lượt.
- Không cho truy cập đáp án đúng hoặc dữ liệu câu hỏi của đội khác ngoài phạm vi cần thiết.
- Chuyển trạng thái, ghi đáp án/điểm và phát sự kiện realtime phải có điều kiện trạng thái, chống race condition và gửi lặp; máy chủ là nguồn dữ liệu chuẩn cho Bảng thi đua.

Việc thêm bảng, migration, RLS, API hoặc thay đổi quyền Supabase cho project đã xác nhận đã được thực hiện trong `supabase/migrations/20260906_team_competitions.sql`. Không chạy `supabase_rls.sql`; migration này yêu cầu `supabase_auth_security.sql` đã được triển khai trước đó và phải chạy trong đúng project `bjgbbrufnryrtimtzvhn`.

## Ngoài phạm vi MVP

- Thi đua giữa lớp/khối/trường.
- Học sinh tự lập đội, tự đổi đội hoặc tự chọn trưởng nhóm.
- Mỗi thành viên dùng thiết bị riêng hoặc mỗi thành viên làm một phần câu hỏi.
- Nhiều trưởng nhóm/thiết bị cùng ghi vào một lượt đội.
- Cộng điểm theo tổng điểm thành viên, nhân/chia theo số người hoặc yêu cầu đội bằng số người.
- Bảng xếp hạng tích lũy theo tuần/tháng; thay đổi `totalscore`, sao, thú cưng, tiến độ chủ đề hoặc nhiệm vụ cá nhân.
- Chat, nhắn tin, chia sẻ đáp án qua hệ thống hoặc làm lại sau khi nộp.
- Tự động đánh giá độ khó/công bằng giữa các đề khác nhau.
- Dùng thời gian để tự động phá hòa hoặc thay đổi điểm/xếp hạng trong MVP; thời gian chỉ được lưu và hiển thị làm dữ liệu cho quyết định sau.
- Khôi phục lượt trưởng nhóm đã thoát/refresh, đổi trưởng nhóm sau khi bắt đầu, mở lại lượt hoặc sửa điểm thủ công.

## Tiêu chí nghiệm thu

1. Giáo viên tạo và lưu được nhiều trận Nháp trước ở nhà; có thể mở lại chỉnh sửa rồi chuẩn bị.
2. Trận vẫn giữ đủ bốn trạng thái: `Nháp → Đã chuẩn bị → Đang diễn ra → Đã kết thúc`.
3. Chỉ cấu hình hợp lệ mới chuyển sang Đã chuẩn bị/bắt đầu; đội có thể khác số thành viên và không bị chặn vì không chia đều.
4. Chia thủ công và ngẫu nhiên tạo đội không trùng học sinh; random phân bố gần đều khi không có mục tiêu; mỗi đội có đúng một trưởng nhóm.
5. Khi ở Đã chuẩn bị, Admin thấy Bảng thi đua nhóm toàn màn hình với một ô cho mỗi đội, nút Thay đổi trong từng ô và nút lớn Bắt đầu thi đua.
6. Bài chung dùng cùng bộ câu hỏi; bài riêng gắn đúng bộ đề cho từng đội; mọi bộ đề có cùng số câu.
7. Sau khi bắt đầu, các ô đội cập nhật realtime điểm, số câu đã nộp, trạng thái và thời gian; có thể trình chiếu lên TV mà không lộ dữ liệu nhạy cảm.
8. Đồng hồ chung bắt đầu lúc giáo viên bấm Bắt đầu, tự kết thúc khi hết giờ; giáo viên kết thúc sớm được.
9. Hệ thống lưu `started_at` và thời điểm hoàn thành/khóa cùng thời lượng thực tế của từng đội để xem lại và dùng làm căn cứ sau này.
10. Khi trưởng nhóm chủ động thoát/đăng xuất/chuyển tài khoản, hộp cảnh báo có đúng hai lựa chọn OK/Hủy; Hủy giữ lượt, OK khóa lượt. Refresh/đóng tab dùng cảnh báo rời trang của trình duyệt khi cần.
11. Điểm từng câu được lưu ngay; sau khi lượt bị khóa do thoát/refresh/đăng xuất/chuyển tài khoản, không cho làm tiếp nhưng giữ điểm các câu đã nộp.
12. Câu chưa nộp khi khóa/hết giờ/kết thúc sớm tính 0; không thể nộp lại hoặc cộng điểm hai lần.
13. Điểm đội là điểm cuối của lượt đội, không phải tổng theo số thành viên; sau khi kết thúc, mọi thành viên nhận cùng điểm đội, kể cả trưởng nhóm.
14. Kết quả thi đua được lưu riêng, không tự thay đổi `totalscore`, sao, progression, lịch sử bài cá nhân hoặc nhiệm vụ cá nhân.
15. Quyền đọc/ghi đúng vai trò; học sinh không thể mở lượt đội khác hay ghi đáp án thay trưởng nhóm.
16. Luồng UI được kiểm thử tối thiểu trên laptop/desktop và tablet ngang; các kiểm thử Node và Playwright liên quan đều xanh.

## Khi triển khai

Tuân thủ vòng trong `docs/AI_WORKFLOW.md`: viết/cập nhật test trước thay đổi hành vi, phát triển từng phạm vi nhỏ, chạy test liên quan rồi toàn bộ test, commit nhánh riêng, Kimi review commit cố định, sau đó Playwright kiểm thử UI. Không refactor lớn `src/main.js` đồng thời với tính năng này.
