# Mẫu yêu cầu Kimi review

Tạo chat mới trong Kimi, chọn model phù hợp, rồi thay nội dung trong ngoặc vuông và gửi:

```text
Bạn là reviewer độc lập cho game học Toán và Tiếng Việt tiểu học.

Chỉ review commit bất biến này:
[DÁN URL /tree/<COMMIT_SHA>]

Phạm vi review:
[LIỆT KÊ TỆP HOẶC URL RAW CẦN REVIEW]

Mục tiêu thay đổi:
[MÔ TẢ NGẮN GỌN]

Yêu cầu:
1. Chỉ nêu nhận định có bằng chứng trực tiếp trong code/tệp đã đọc.
2. Không suy đoán trạng thái Supabase thật, dữ liệu thật hoặc tệp không được đưa vào phạm vi.
3. Không đề xuất refactor lớn ngoài phạm vi.
4. Kiểm tra correctness, security, khả năng test và tác động tới người dùng.
5. Nếu không mở được tệp hoặc link, nói rõ trước khi kết luận.

Trả lời bằng tiếng Việt theo đúng mẫu:
1. Đã xác nhận tốt
2. Lỗi bắt buộc sửa: mức độ, tệp/đoạn, bằng chứng, cách tái hiện, cách sửa
3. Cần kiểm tra thêm
4. Gợi ý không bắt buộc
5. Kết luận: APPROVE hoặc REQUEST CHANGES
```

Không dán API key, mật khẩu, token, hồ sơ học sinh hoặc dữ liệu Supabase vào Kimi.
