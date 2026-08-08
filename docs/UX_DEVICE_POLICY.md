# Chính sách thiết bị và ưu tiên UI/UX

## Quyết định

Game ưu tiên trải nghiệm học tập trên **laptop** và **tablet**. Điện thoại không phải nền tảng mục tiêu vì học sinh tiểu học không được khuyến khích dùng điện thoại để chơi game.

Quyết định này áp dụng cho mọi đề xuất thiết kế, sửa lỗi giao diện, review Kimi và kiểm thử Playwright.

## Thứ tự ưu tiên

| Mức ưu tiên | Thiết bị | Kích thước kiểm thử tham chiếu | Yêu cầu |
| --- | --- | --- | --- |
| 1 | Laptop/desktop | 1280×720, 1440×900, 1920×1080 | Giao diện phải rõ, thao tác thuận tiện và không bị cắt nội dung. |
| 2 | Tablet ngang | 1024×768 hoặc kích thước ngang tương đương | Các luồng học sinh và giáo viên chính phải dùng được, nút đủ lớn, không che nội dung. |
| 3 | Điện thoại ngang | Chỉ kiểm tra không vỡ nghiêm trọng khi cần | Không phải mục tiêu tối ưu hoá; không yêu cầu thiết kế riêng. |
| Không hỗ trợ làm gameplay | Điện thoại dọc | Bất kỳ | Hiển thị hướng dẫn xoay ngang là hành vi dự kiến. |

## Cách xử lý đề xuất liên quan điện thoại

- Không coi một đề xuất **chỉ cải thiện điện thoại** là lỗi P0/P1 hoặc điều kiện chặn merge.
- Không thêm tính năng, breakpoint, layout hay màn hình riêng chỉ để tối ưu điện thoại nếu không có yêu cầu mới từ người phụ trách dự án.
- Vẫn sửa nếu lỗi trên điện thoại gây ảnh hưởng đến laptop/tablet, liên quan an toàn/khả năng truy cập, hoặc làm ứng dụng trắng trang/không dùng được ngoài ý định hiển thị hướng dẫn xoay ngang.
- Khi Kimi nêu vấn đề chỉ trên điện thoại, ghi nhãn: `Ngoài phạm vi ưu tiên — điện thoại không phải nền tảng mục tiêu`; chỉ chuyển thành việc cần làm khi người phụ trách xác nhận.

## Quy tắc thiết kế và kiểm thử

1. Thiết kế mới bắt đầu từ laptop, sau đó kiểm tra tablet ngang.
2. Ảnh review và tiêu chí pass/fail tập trung laptop/tablet; ảnh điện thoại chỉ là bằng chứng phụ trợ.
3. Không giảm chất lượng laptop/tablet để ép mọi nội dung vừa với màn hình điện thoại.
4. Nếu không thể thỏa hiệp, ưu tiên khả năng đọc chữ, vùng chạm/bấm và luồng học tập trên laptop/tablet.
5. Playwright phải luôn kiểm tra ít nhất một kích thước laptop/desktop và một kích thước tablet ngang khi thay đổi UI có tác động rộng.

## Lý do

Nền tảng chính phù hợp với môi trường học tập có giáo viên hoặc phụ huynh hỗ trợ, màn hình lớn hơn và thao tác ổn định hơn. Giới hạn ưu tiên giúp tránh đầu tư sai hướng vào trải nghiệm điện thoại, trong khi vẫn giữ ứng dụng an toàn và không bị vỡ ở các kích thước khác.
