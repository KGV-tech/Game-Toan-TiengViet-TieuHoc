# Phiếu học tập từ ảnh/file

Trong **Soạn Phiếu học tập → Soạn phiếu mới**, chọn **Tạo phiếu từ ảnh/file**
bên cạnh nút tạo tự động. Chọn nhiều ảnh JPG/PNG/WebP hoặc PDF/DOCX/TXT.
JSON là định dạng xuất/nhập dự phòng của phiếu tự do.

File nguồn được xử lý trong trình duyệt, không gửi OpenAI hoặc dịch vụ OCR.
Tesseract.js tiếng Việt, PDF.js, Mammoth và dữ liệu ngôn ngữ được phục vụ từ
website của ứng dụng. Lần đọc đầu tiên cần mạng để tải các thư viện.
Lưu/giao phiếu gửi nội dung phiếu đã hiệu chỉnh đến Supabase của ứng dụng;
ảnh gốc không được tải lên. Hình minh họa đã cắt được lưu cùng phiếu khi chọn giữ.

## Làm sạch và hiệu chỉnh

- Mực tím, đỏ, xanh được lọc khi bật bỏ nét màu. Với chữ/hình in có màu,
  tắt lọc; dùng **Làm sạch ảnh** để khoanh vùng cần xóa. Bút đen cần khoanh thủ công.
- Nền giấy tối được cân bằng trước OCR. Bảng thẳng/ít nghiêng được dò đường
  kẻ và đọc từng ô. Bảng méo, nét đè lên chữ in, dấu toán và số cần đối chiếu.
- Câu con, lựa chọn, bảng và dòng chấm đều sửa được, không cần template,
  không ép 10 câu và không bắt buộc có đáp án. Có thể thêm/bỏ bài, trang,
  hàng/cột, câu con và nhãn sơ đồ. Ảnh/sơ đồ cần giữ: chọn bản gốc rồi cắt vùng.
- `[CẦN KIỂM TRA]` là vùng nhận diện chưa rõ. Có thể lưu nháp phiếu này;
  cần sửa hoặc thay bằng `___` trước khi giao học sinh. Không có bảo đảm OCR
  chính xác tuyệt đối hoặc tự nhận ra mọi nét viết tay.
- Chọn Vườn xanh/Bầu trời/Nắng ấm, xem bản in màu; lưu rồi mở **Xem phiếu →
  Xuất PDF / A4**. Bật in nền/màu trong hộp thoại in khi trình duyệt yêu cầu.
- **Tải bản phiếu để lưu dự phòng** giữ nội dung hiệu chỉnh và hình cắt.
  File nguồn chỉ còn trên thiết bị trong phiên làm việc.

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
