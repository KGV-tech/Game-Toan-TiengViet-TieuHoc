# Đặc tả: Trình chiếu thi đua nhóm

## Trạng thái

Tài liệu này ghi nhận các quyết định đã chốt về màn hình trình chiếu trận thi đua nhóm cho Admin. Nó bổ sung và, trong phạm vi bảng trình chiếu/xếp hạng, thay thế các quy tắc cũ không còn phù hợp trong `docs/TEAM_COMPETITION_SPEC.md`.

Không triển khai thay đổi Supabase, migration hoặc dữ liệu thật chỉ dựa vào tài liệu này; việc triển khai production vẫn cần người phụ trách xác nhận theo `AGENTS.md`.

## Mục tiêu

Khi một lớp làm thi đua nhóm, Admin trình chiếu một màn hình sinh động để học sinh thấy vị trí hiện tại của các đội. Màn hình chỉ hiển thị dữ liệu cấp đội; không hiển thị đáp án, tên học sinh, thông tin tài khoản hay dữ liệu cá nhân.

Điểm số phải là yếu tố trực quan duy nhất quyết định vị trí trên đường đua, để học sinh không hiểu nhầm rằng một đội nộp bài nhanh hơn chắc chắn đang xếp hạng cao hơn.

## Phạm vi đội và bố cục

- Một trận cho phép từ **2 đến 8 đội**.
- Mỗi giao diện/chủ đề chỉ có **một bố cục cố định hỗ trợ 8 làn đua**. Không tạo phiên bản giao diện riêng cho 2, 4 hoặc 6 làn.
- Khi Admin tạo trận với `N` đội, màn hình chỉ hiển thị đúng `N` làn và `N` phương tiện/nhân vật tương ứng; các làn chưa dùng được ẩn, không để làn trống.
- Bố cục phải vẫn vừa hoàn toàn trong laptop/desktop và tablet ngang, ưu tiên các viewport 1920×1080, 1440×900, 1280×720 và 1024×768. Canvas chính không được có thanh cuộn.

## Thành phần của một giao diện/chủ đề

Mỗi chủ đề được đóng gói thành một bộ mỹ thuật riêng, gồm:

1. Một ảnh nền hoặc nền code-native có sẵn 8 làn đua.
2. Tám phương tiện/nhân vật khác nhau để đại diện cho tối đa tám đội.
3. Đồng hồ đếm ngược chung của trận, nếu trận có giới hạn thời gian.
4. Bảng xếp hạng tạm thời.
5. Nhãn đội, điểm hiện tại, trạng thái và vị trí/hạng.
6. Hiệu ứng di chuyển nhẹ và hiệu ứng tuyên dương.

Chủ đề chỉ thay cách thể hiện (ví dụ xe đua, tàu hỏa, tên lửa, khinh khí cầu). Các quy tắc điểm, xếp hạng, realtime và quyền truy cập phải dùng chung.

### Nhận diện đội

- Không cố định màu đội giữa các trận.
- Khi giáo viên chia đội ngẫu nhiên ở mỗi trận, giao diện có thể gán phương tiện/màu/biểu tượng khác cho đội của trận đó.
- Trong cùng một trận, nhận diện đã gán cho một đội phải ổn định trên bảng trình chiếu, bảng kết quả và ảnh PNG kết quả.
- Tên đội là nhận diện chính; màu và phương tiện chỉ hỗ trợ việc nhận biết nhanh trên màn hình lớn.

## Quy tắc đường đua theo điểm

- Mỗi làn có 10 mốc, tương ứng thang điểm từ `0` đến `10`.
- Không vẽ hoặc hiển thị một vạch/điểm “về đích”.
- Vị trí của phương tiện được tính trực tiếp từ điểm hiện tại, không dùng số câu đã nộp.
- Mỗi `0,25` điểm dịch chuyển phương tiện thêm `1/4` mốc.
- Dữ liệu bài hiện áp dụng các mức điểm `0,25`, `0,5` hoặc `1`; vì vậy vị trí luôn rơi đúng vào một phần tư mốc và không cần xử lý điểm lẻ kiểu `7,63`.
- Điểm được cập nhật theo dữ liệu realtime từ máy chủ sau mỗi lần nộp câu. Hoạt ảnh chỉ minh họa dữ liệu đã được máy chủ xác nhận; không tự suy đoán điểm ở trình duyệt Admin.

Ví dụ: đội hoàn thành 10 câu và đạt `7,25/10` dừng ở mốc 7¼. Đây là vị trí trực quan dùng để hiểu điểm và hạng của đội.

## Quy tắc xếp hạng

1. Điểm cao hơn xếp hạng cao hơn.
2. Nếu cùng điểm, đội có thời điểm hoàn thành sớm hơn xếp hạng cao hơn.
3. Nếu không thể phân biệt thời điểm hoàn thành, các đội được phép đồng hạng.
4. Khi đội chưa hoàn thành, bảng có thể hiển thị “hạng tạm thời”; hạng chính thức chỉ được chốt khi trận kết thúc.
5. Nếu trận hết giờ hoặc Admin kết thúc sớm, câu chưa nộp được tính 0 theo quy tắc trận hiện có. Đội giữ vị trí theo điểm đã ghi nhận.
6. Quy tắc thời gian phá hòa phải do máy chủ tính và lưu; không dựa vào đồng hồ/trình duyệt của Admin.

Quy tắc này thay thế quyết định MVP cũ “không dùng thời gian để tự động phá hòa” trong phạm vi thi đua nhóm.

## Đội đạt điểm tuyệt đối

Khi một đội nộp xong bài và đạt `10/10` trước khi trận kết thúc:

- Hiện hiệu ứng tuyên dương riêng cho đội đó trong khoảng **2–3 giây**.
- Hiện nhãn thành tích, lời chúc mừng và hạng của đội tại thời điểm đó.
- Hiệu ứng không che bảng của các đội khác, không khóa giao diện và không làm gián đoạn nhịp làm bài của đội còn lại.
- Đội đạt `10/10` đầu tiên được hạng 1; các đội đạt `10/10` sau đó xếp theo thời điểm hoàn thành. Nếu thời điểm không phân biệt được thì đồng hạng.
- Vì 10 là điểm tối đa, hạng tuyên dương của đội đạt 10 điểm có thể công bố ngay; các hạng của đội chưa đạt tuyệt đối vẫn là tạm thời cho tới khi chốt trận.

## Kết thúc trận và ảnh kết quả

Trận đi tới màn hình kết quả khi một trong hai điều kiện xảy ra:

- Hết thời gian chung; hoặc
- Tất cả đội đã hoàn thành bài thi đua.

Khi đó hệ thống phải:

1. Chốt điểm, trạng thái, thời điểm hoàn thành và hạng chính thức từ máy chủ.
2. Chuyển bảng trình chiếu sang trạng thái đứng yên, dừng các hoạt ảnh đang chạy.
3. Hiển thị rõ đây là **Kết quả chính thức**.
4. Cung cấp nút Admin **Lưu ảnh kết quả PNG**.

Ảnh PNG cần chứa tối thiểu tên trận, lớp, thời điểm chốt, các đội đang tham gia, vị trí theo điểm, điểm và hạng chính thức. Đây là minh chứng trực quan phục vụ lớp học; bản ghi kết quả phía máy chủ vẫn là nguồn dữ liệu chính thức.

## Luồng Admin

1. Trong tạo/sửa trận, Admin chọn số đội từ 2 đến 8 và hoàn tất đội hình/bộ đề như luồng hiện có.
2. Admin chọn **Giao diện trình chiếu lớp** từ danh sách các chủ đề có preview.
3. Hệ thống gán bộ nhận diện phương tiện/màu/biểu tượng cho các đội của riêng trận đó.
4. Trong trạng thái Nháp hoặc Đã chuẩn bị, Admin có thể đổi chủ đề và xem trước với dữ liệu mô phỏng.
5. Khi Admin bấm Bắt đầu thi đua, chủ đề và nhận diện đội bị khóa cùng đội hình/bộ đề.
6. Trong trận, bảng toàn màn hình nhận dữ liệu realtime từ máy chủ và cập nhật vị trí theo điểm.
7. Khi trận được chốt, Admin xuất PNG kết quả nếu cần.

## Kiến trúc triển khai đề xuất

### Dữ liệu bền vững

Cần lưu cùng bản ghi trận:

- `presentation_theme`: mã chủ đề trình chiếu đã chọn.
- `presentation_team_identity`: nhận diện đã gán cho từng đội trong trận (ví dụ mã phương tiện, màu hoặc biểu tượng), để refresh/realtime/ảnh kết quả luôn đồng nhất.

Hai giá trị này cần tồn tại ở máy chủ; không chỉ giữ trong `localStorage`, vì bảng có thể được mở lại trên thiết bị Admin khác. Việc thêm cột/migration Supabase chỉ được thực hiện khi được xác nhận rõ ràng.

### Mô hình hiển thị chung

Mọi chủ đề nhận một presentation model an toàn chỉ gồm dữ liệu cấp đội:

- `teamName`, nhận diện của đội;
- `score` và `score / 10`;
- `position = score / 10`;
- `status`;
- `completedAt`, `durationSeconds`;
- `temporaryRank` hoặc `finalRank`;
- đồng hồ chung và trạng thái kết nối.

Không đưa danh sách thành viên, trưởng nhóm, đáp án hay nội dung câu hỏi vào presentation model.

### Khả năng tiếp cận và vận hành

- Cung cấp nhãn văn bản/ARIA cho trạng thái đội và bảng xếp hạng.
- Tôn trọng `prefers-reduced-motion`: khi bật, bỏ/giảm hoạt ảnh nhưng vẫn cập nhật điểm, vị trí và hạng.
- Luôn có thông báo trạng thái kết nối/dồng bộ cho Admin; khi mất kết nối không suy đoán hay ghi đè điểm.
- Thanh điều khiển Admin được thu gọn khi trình chiếu toàn màn hình, nhưng vẫn có lối thoát toàn màn hình và hành động kết thúc trận theo quy tắc xác nhận hiện có.

## Tiêu chí kiểm thử

- Chỉ chấp nhận số đội trong khoảng 2–8.
- Một đội `7,25/10` đứng đúng tại mốc 7¼, bất kể đã nộp bao nhiêu câu.
- Một đội hoàn thành đủ câu nhưng điểm thấp không được hiển thị như đang dẫn đầu nếu điểm thấp hơn.
- Đồng điểm được xếp theo thời điểm hoàn thành; thời điểm không phân biệt được thì đồng hạng.
- Đội đạt 10 điểm kích hoạt hiệu ứng 2–3 giây mà không che/làm dừng các đội khác.
- Hết giờ hoặc mọi đội hoàn thành dẫn tới bảng kết quả đứng yên với hạng chính thức.
- Xuất PNG thể hiện đúng dữ liệu kết quả chính thức.
- Bảng 2, 4, 6 và 8 đội không có thanh cuộn trên các viewport laptop/desktop và tablet ngang đã quy định.
- Bảng trình chiếu không chứa đáp án, tên học sinh hoặc dữ liệu cá nhân.
