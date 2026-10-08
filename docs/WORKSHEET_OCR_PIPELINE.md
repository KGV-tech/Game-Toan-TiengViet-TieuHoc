# OCR phiếu học tập trên thiết bị

## Phạm vi và tiêu chí

Nhập ảnh/PDF trong Phiếu học tập; độc lập với Đề. Không gửi ảnh lên API OCR,
không dùng token hay API key. Asset được commit cùng repo và phục vụ cùng origin.
OpenCV chỉnh nghiêng, phối cảnh theo khung bảng có đường kẻ nội bộ, giữ mọi góc
trang bằng mở rộng canvas; cân bằng nền và lọc mực màu khi được bật.
Paddle dò chữ/số/tọa độ; đường bảng giữ ô rỗng. Tọa độ, tiêu đề và số thứ tự
phục hồi Nhóm → Bài → Câu con; vùng không chắc ghi review cho giáo viên.
Hai ảnh riêng mẫu: 2 trang nguồn, 3 nhóm, 6 bài; bảng 8 cột × 8 hàng;
nhóm thứ hai trên cùng ảnh không ép sang trang mới. Giữ dòng chấm bằng dò pixel.

## Quyết định model dựa trên thực nghiệm

SDK @paddleocr/paddleocr-js 0.4.2, OpenCV 4.10, ONNX Runtime WASM một luồng
trong dedicated worker; không cần COOP/COEP và không chặn tương tác main thread.
Detection: PP-OCRv6_small_det. Recognition nền: latin_PP-OCRv5_mobile_rec.
Đối chiếu tiếng Việt: Tesseract 7 với vie.traineddata đã có trong repo, cùng origin.
Tesseract đọc ảnh đã làm sạch; các từ được ghép vào vùng tọa độ Paddle nếu đủ
confidence và độ phủ. Vùng còn lại giới hạn confidence để yêu cầu rà soát.

Lý do không dùng recognition v6 mặc định: model tar chính thức được tải trong
lần này thiếu các ký tự ố/ộ/ữ/ị trong character_dict. Model Latin-v5 tải được
cũng thiếu các ký tự đó. Không tự thêm dictionary: làm sai mapping output model.
Tham chiếu báo cáo upstream: https://github.com/PaddlePaddle/PaddleOCR/issues/18254
Đây là cấu hình kết hợp có chủ đích, không tuyên bố PP-OCRv6 nhận tiếng Việt đầy đủ.

Các asset model giữ nguyên từ thư mục official_inference_model/paddle3.0.0 tại
https://paddle-model-ecology.bj.bcebos.com/paddlex/ . SHA256/size nằm trong
public/worksheet-vendor/paddle/manifest.json. Asset thêm khoảng 43 MB;
lần đầu cần tải bằng mạng, máy khác chỉ mở website, không cài phần mềm riêng.
Không có bảo đảm offline lần đầu hay OCR tuyệt đối chính xác. Dấu toán, chữ mờ,
bút đen/nét đè lên chữ in và hình/sơ đồ vẫn cần giáo viên đối chiếu.

## Build và kiểm thử

npm ci
node scripts/build-worksheet-ocr.cjs
node scripts/build-worksheet-bundle.cjs
npm test

Asset tar đã được commit; build không tải model từ mạng. Giữ notice/license và
manifest cùng asset. Build dùng esbuild khóa trong package-lock.json.
Test Node kiểm tra cấu trúc qua tọa độ; Playwright chạy OCR thật, GET asset cùng
origin, kiểm tra ảnh riêng chỉ bằng WORKSHEET_QA_IMAGE và WORKSHEET_QA_IMAGE_2.
Ảnh mẫu và kết quả QA nằm trong test-results bị Git bỏ qua, không commit ảnh học sinh.
Chọn Tesseract dự phòng khi worker/WASM không hoạt động; lỗi không tự đổi engine.

## Đồng bộ mốc luyện tập học sinh

Cài đặt học sinh có thể cũ khi realtime không tới. Refresh read-only khi mở môn,
focus/visibility/online và mỗi 15 giây lúc đang xem lộ trình. Chỉ lấy hàng id=1,
không apply nếu đã đổi tài khoản; lỗi mạng giữ cài đặt cuối. Không refresh admin
để tránh ghi đè bản đang sửa. Lưu settings thành công cập nhật cache cục bộ.
Bỏ yêu cầu điểm cho phép mọi bài tới mốc giáo viên, không vượt mốc; không đổi RLS,
schema hay dữ liệu Supabase trong quá trình triển khai. Regression mock remote
settings nhưng không phát realtime xác nhận bài 5/8 mở và bài 9 vẫn khóa.
