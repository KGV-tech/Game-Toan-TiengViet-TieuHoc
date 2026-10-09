# Chọn nhiều Đúng/Sai — 09/10/2026

Mỗi câu có 10 ô khác nhau. Mỗi template cố định một chế độ `correct` (Chọn Đúng) hoặc `incorrect` (Chọn Sai); không hỗ trợ chế độ trộn. Có 1–9 ô cần chọn, ưu tiên 4–6 nếu nguồn từ cho phép. Học sinh bấm lại để bỏ chọn; chấm 1 điểm khi chọn đúng toàn bộ tập đáp án, không phụ thuộc thứ tự.

Catalog lớp 4 có 270 template cho 135 bài: Toán 73 bài và Tiếng Việt 62 bài. Các nhóm nội dung Toán bám bài học; Tiếng Việt chỉ dùng từ/ngữ cảnh đã kiểm chứng trong VietnameseParameterCorpus, giới hạn theo bài đã học. HK2 sử dụng nguồn đã học ở HK1 để ôn tập. Nguồn nhóm từ nhỏ có thể giới hạn số ô đúng dưới 4.

Dạng mới dùng được trong luyện tập, xem trước, soạn đề, làm đề, lịch sử và bản in. Template đã lưu có ưu tiên so với mẫu mặc định cục bộ. Câu dẫn giống nhau ở các câu con được hiển thị một lần ở câu hỏi chính; dữ liệu riêng vẫn giữ nguyên. Metadata nguồn gốc của câu con được bảo toàn để kiểm chứng.

## Supabase

Migration: `supabase/migrations/20261009_question_templates_multi_select.sql`. Script chỉ thêm các mẫu còn thiếu theo môn/học kỳ/bài/generator/chế độ; có thể chạy lại, không sửa schema, RLS hoặc mẫu hiện có. Dự án đích: `bjgbbrufnryrtimtzvhn`.

Người dùng chạy SQL trong SQL Editor và cung cấp ảnh kết quả 8 nhóm. Các dòng hiển thị khớp: Tiếng Việt HK1 32 mỗi chế độ, HK2 30 mỗi chế độ; Toán HK1 37 mỗi chế độ. Hai dòng Toán HK2 nằm ngoài ảnh; số lượng dự kiến là 36 mỗi chế độ. Agent không có kết nối ghi trực tiếp và không trực tiếp thực thi migration.

## Kiểm chứng

Kiểm thử Node kiểm tra 10 ô, giới hạn 1–9, phân bố ưu tiên, chấm tập đáp án và dữ liệu migration. Playwright kiểm tra toàn catalog, nguồn Tiếng Việt, chọn/bỏ chọn, chế độ Sai, xem trước, đề thi/lịch sử/bản in, gộp câu dẫn và khôi phục tiến độ. Kiểm tra giao diện ở 1280×720, 1440×900 và 1024×768. DevTools MCP không có trong phiên; dùng Playwright và ảnh chụp giao diện.

## Standards review

Không còn lỗi correctness đã xác nhận hoặc vi phạm tiêu chuẩn dự án trong diff cuối. Migration giữ mẫu hiện có và không đổi schema, RLS, quyền.

## Spec review

Không còn finding đã xác nhận. Hai chế độ tách riêng; giới hạn toán B41/B43/B44 và preview dự phòng đã kiểm chứng sau sửa.

Kết quả review: Standards 0 finding; Spec 0 finding còn mở.

Cổng cuối: 71 bộ contract Node đạt; Chromium 493 passed, 3 skipped (QA tùy chọn), 0 failed.
