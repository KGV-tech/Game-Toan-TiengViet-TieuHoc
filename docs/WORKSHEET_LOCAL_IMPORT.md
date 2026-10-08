# Phiếu học tập từ ảnh/file

Trong **Soạn Phiếu học tập → Soạn phiếu mới**, chọn **Tạo phiếu từ ảnh/file**
bên cạnh nút tạo tự động. Chọn nhiều ảnh JPG/PNG/WebP hoặc PDF/DOCX/TXT.
JSON là định dạng xuất/nhập dự phòng của phiếu tự do.

File nguồn được xử lý trong trình duyệt, không gửi OpenAI hoặc dịch vụ OCR.
OpenCV.js, PaddleOCR.js, Tesseract.js tiếng Việt, PDF.js và Mammoth được phục vụ từ
website của ứng dụng. Lần đọc đầu tiên cần mạng để tải các thư viện.
Lưu/giao phiếu gửi nội dung phiếu đã hiệu chỉnh đến Supabase của ứng dụng;
ảnh gốc không được tải lên. Hình minh họa đã cắt được lưu cùng phiếu khi chọn giữ.

## Làm sạch và hiệu chỉnh

- Mực tím, đỏ, xanh được lọc khi bật bỏ nét màu. Với chữ/hình in có màu,
  tắt lọc; dùng **Làm sạch ảnh** để khoanh vùng cần xóa. Bút đen cần khoanh thủ công.
- Nền giấy tối được cân bằng trước OCR. Bảng thẳng/ít nghiêng được dò đường
  kẻ và đọc từng ô. Bảng méo, nét đè lên chữ in, dấu toán và số cần đối chiếu.
- Câu con, lựa chọn, bảng và dòng chấm đều sửa được, không cần template,
  không ép 10 câu và không bắt buộc có đáp án. Có thể thêm/xóa bài, thêm nhóm,
  hàng/cột, câu con và nhãn sơ đồ. Ảnh/sơ đồ cần giữ: chọn bản gốc rồi cắt vùng.
- `[CẦN KIỂM TRA]` là vùng nhận diện chưa rõ. Có thể lưu nháp phiếu này;
  cần sửa hoặc thay bằng `___` trước khi giao học sinh. Không có bảo đảm OCR
  chính xác tuyệt đối hoặc tự nhận ra mọi nét viết tay.
- Chọn Vườn xanh/Bầu trời/Nắng ấm, xem bản in màu; lưu rồi mở **Xem phiếu →
  Xuất PDF / A4**. Bật in nền/màu trong hộp thoại in khi trình duyệt yêu cầu.
- File nguồn chỉ còn trên thiết bị trong phiên làm việc. Nội dung hiệu chỉnh
  và hình cắt được giữ khi lưu phiếu.

## Trang nguồn và thông tin tùy chọn

Mỗi ảnh và mỗi trang PDF giữ một trang nguồn. Tiêu đề nhóm như “Phiếu học tập
số 2”, “Phiếu học tập số 3” trên cùng ảnh tạo các nhóm độc lập; chỉ nhóm đầu
của ảnh bắt đầu trang mới. Chúng không tạo thêm trang nguồn. TXT vẫn giữ
cách nhập văn bản trước đó, không tự chia trang theo tiêu đề.
Chủ đề và Bài học là ô tùy chọn, lưu cùng phiếu và hiện trên bản in.
**Xóa tiêu đề** bỏ tiêu đề trang khỏi bản in, giữ các bài; **Thêm tiêu đề**
cho phép đặt lại. **Xóa bài** xóa riêng khối nội dung đang chọn.
Hai chế độ sáng/tối áp dụng cho trình soạn; giấy xem trước và PDF vẫn nền trắng.
Bảng căn giữa các ô, tên cột in đậm và xuống dòng để đọc đầy đủ.
Số trang giấy thực tế khi in còn phụ thuộc lượng nội dung và cỡ giấy.
Phiếu đã nhập theo cách cũ cần đọc lại file nguồn để sửa việc tách trang sai.

## Giao, nộp và chấm

Phiếu tự do đã đồng bộ có nút **Giao phiếu cho học sinh**. Chọn học sinh;
bản giao được chốt và bỏ đáp án riêng của giáo viên.
Học sinh mở **Phiếu học tập · Bài được giao** trên bản đồ, gõ/chọn hoặc viết
trong khung bằng bút/tay. Nháp lưu theo tài khoản và phiếu trên thiết bị;
nộp lỗi vẫn giữ nháp. Sau khi nộp, bài được giữ nguyên để giáo viên chấm.
Điểm và nhận xét không cộng vào điểm game và không dùng luồng Đề kiểm tra.

## Triển khai

- Assets: `npm ci` và `node scripts/build-worksheet-vendor.cjs`.
  `public/worksheet-vendor/README.md` ghi nguồn, giấy phép và hash dữ liệu OCR.
- Giao/nộp/chấm cần migration
  `supabase/migrations/20261008_worksheet_assignments.sql` trên đúng dự án.
  Soạn/lưu/in dùng bảng `game_worksheets` và migration quyền đã có trước đó.
- Migration mới được kiểm tra bằng PostgreSQL cục bộ: RLS riêng từng học sinh,
  RPC chỉ giáo viên được giao/chấm, bỏ đáp án server, nộp lặp giữ bản đầu.
  Kiểm thử cục bộ không xác nhận migration đã được chạy production.

Kiểm thử: `npm run test:contracts`; Playwright
`tests/e2e/worksheet-import.spec.cjs` và `worksheet-library.spec.cjs`.
QA ảnh tùy chọn: đặt `WORKSHEET_QA_IMAGE` thành đường dẫn ảnh trên máy rồi chạy
spec nhập phiếu. Ảnh và kết quả chỉ nằm trong thư mục báo cáo được Git bỏ qua.

Mammoth kéo dependency CLI `argparse/sprintf-js` có cảnh báo npm audit ở thời
điểm triển khai. Hai thư viện đó không có trong bundle Mammoth của trình duyệt;
app không dùng CLI của Mammoth để đọc tài liệu.

## Bố cục A4, trang trí và khung nội dung

- Tên phiếu căn giữa, họ tên ở trái, lớp ở giữa và ngày ở phải; chỉ xuất hiện
  trên trang giấy đầu tiên. Tiêu đề nhóm tùy chọn nằm ngay trên nhóm, in hoa đậm.
- Chọn header/footer: Vườn lá, Ngôi sao, Cầu vồng, Bút chì, Hình vui hoặc
  Không trang trí. SVG sắc nét khi xuất PDF; không có khẩu hiệu trên giấy.
- **Thêm Nhóm** ở cuối trình soạn bổ sung nhóm khi OCR thiếu nội dung; dùng
  **Thêm bài**, **Thêm câu con** để sửa cấu trúc trực tiếp. Không còn khung
  khai báo số lượng, nút Thêm trang hoặc Lưu dự phòng.
- Câu chính và câu con hỗ trợ Tự luận, Trắc nghiệm, Đúng/Sai, Điền khuyết,
  So sánh, Chuỗi quy luật, Kéo thả/Chọn từ và Đối chiếu/Nối cặp. Đúng/Sai
  và So sánh có lựa chọn cố định; Nối cặp nhập hai dòng cột trái/phải.
- Ô bảng đã xóa in rỗng; chỉ dấu `___` được chuyển thành dấu chấm.
- Bản in dùng Arial, độ đậm thường/đậm thống nhất; chỉ nhóm có khung.
  Nhóm nhiều bài đánh số 1., 2. (không in chữ Bài), câu con là a), b), c).
- **Nhóm bắt đầu trang mới** giữ ranh giới ảnh/PDF đã nhập; có thể tắt để
  các nhóm tiếp nối trên cùng A4. Nhóm thêm thủ công không ép sang trang.
- Kích thước bảng dùng mm: cột chia vùng rộng 178 mm; dòng chia tổng chiều
  cao bảng (20–200 mm, mặc định 120 mm), gồm cả dòng tiêu đề. Tự chia đều
  mặc định bật; cột/dòng Cố định được loại khỏi phần chia lại. Sửa một thông
  số chia phần còn lại cho các mục chưa khóa. Không cho nhập vượt phần còn
  lại; bỏ một khóa nếu toàn bộ kích thước đã cố định. Chiều cao dòng là
  chiều cao tối thiểu: chữ nhiều có thể làm dòng cao hơn để giữ nội dung.
- **Xem bản in màu** dựng các tờ 210 × 297 mm, có thu phóng 50/75/100%.
  Bảng dài chia ở ranh giới hàng và lặp tên cột; bài dài chia theo câu con/
  đoạn/dòng viết. Nội dung dài hơn một trang nguồn có thể cần thêm tờ A4.
  Một hàng bảng không thể vừa A4 sẽ báo để sửa, không tự cắt mất nội dung.
- PDF dùng chính thuật toán và CSS của preview. Chọn A4, tỷ lệ 100%, không
  thêm header/footer của trình duyệt. Mẫu có lề nội bộ 12 mm và CSS trang in
  riêng, không thay bố cục Đề kiểm tra. Bật in màu/nền để giữ trang trí.

Dữ liệu mới (`decoration`, `tableLayout`, `groupPageBreaks`) ở JSON phiếu;
không cần đổi bảng/RLS Supabase. Phiếu cũ được bổ sung mặc định khi mở.

Phân phối JS: sáu module phiếu được ghép theo thứ tự bằng
`node scripts/build-worksheet-bundle.cjs` trước khi commit/deploy. HTML tải một
script phiếu để giữ ngân sách khởi động; không cần thư viện build mới.

### Biên soạn câu hỏi Phiếu học tập (tháng 10/2026)

- Bảy loại câu mở các trường phù hợp. So sánh dùng chọn dấu >, <, =;
  Đúng/Sai có lựa chọn trống, không tự gán đáp án. Đối chiếu dùng hai cột
  và các cặp đáp án; loại này không dùng bộ câu con của các loại còn lại.
- Chuyển loại giữ nội dung chung, Chủ đề/Bài học và lời giải. Đáp án,
  lựa chọn và câu con được giữ riêng cho từng loại trong phiên chỉnh sửa;
  quay lại loại trước phục hồi bản nháp, kể cả các ý tạm bỏ chọn.
- Lưu Phiếu đọc cấu trúc hiện đang hiển thị. Bản nháp của các loại khác
  không được lưu vào phiếu. Kho Đề và Kho Câu hỏi không bị thay đổi.
- Câu con cũ chỉ lưu trong văn bản được chuyển sang cấu trúc riêng khi
  chuyển loại, để giữ nội dung đã sửa. Focus bàn phím được phục hồi sau
  khi dựng lại thẻ. Không đổi schema hoặc dữ liệu production.

Các bước ở sidebar thay đổi theo khu vực đang chọn (Cấu hình, Câu hỏi,
Đề, Phiếu). Bước Biên soạn mở đúng form nếu chưa mở; Rà soát giữ nguyên
form/bản nháp đang nhập và dẫn tới nhóm thao tác lưu hiện tại. Phiếu từ
ảnh/file giữ file đã chọn và bản hiệu chỉnh. Dãy nút số câu áp dụng riêng
cho cả form Đề và Phiếu thường; ẩn khi mở studio Phiếu từ tài liệu.

## Bộ xử lý OCR mới

Xem `docs/WORKSHEET_OCR_PIPELINE.md` cho model, giới hạn tiếng Việt,
đóng gói cùng website và kiểm thử ảnh riêng. Tesseract dự phòng có thể chọn
ngay ở màn hình tải file.
