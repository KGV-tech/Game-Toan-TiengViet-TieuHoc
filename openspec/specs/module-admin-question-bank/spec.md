# Module: Admin Question Bank

## Purpose
TBD (Qu?n lý ngân hàng câu h?i, t?o và ch?nh s?a câu h?i cho trò choi và d? ki?m tra).

## Requirements

### Requirement: Qu?n lý câu h?i (Admin)
- Các ch?c nang qu?n lý chung (TBD)
- **WHEN** Admin ch?n t?o/ch?nh s?a câu h?i
- **THEN** có thêm tùy ch?n lo?i câu h?i "Ð?i chi?u trùng kh?p"
- **AND** giao di?n cho phép nh?p C?t Trái và C?t Ph?i cho d?ng "Ð?i chi?u trùng kh?p"

### Requirement: H? th?ng Export Template
- **WHEN** Admin click nút "Xu?t file m?u"
- **THEN** hi?n ra 7 l?a ch?n tuong ?ng v?i 7 d?ng câu h?i (trong dó có "Ð?i chi?u trùng kh?p")
- **AND** file Excel t?i v? ch?a dòng hu?ng d?n (Guide) và d? li?u m?u (Sample) dúng theo d?ng dã ch?n

### Requirement: Tuong tác d?ng Ð?i chi?u trùng kh?p (Matching)
- H? th?ng c?n h? tr? giao di?n n?i 2 c?t dáp án cho h?c sinh v?i s? lu?ng ô b?t d?i x?ng.
- **WHEN** H?c sinh click vào ô bên trái, sau dó click ô bên ph?i
- **THEN** Hi?n th? du?ng line n?i 2 ô dó v?i hi?u ?ng màu s?c neon.
- **WHEN** H?c sinh b?m nút Ki?m tra (N?p bài)
- **THEN** H? th?ng d?i chi?u các c?p n?i c?a h?c sinh v?i dáp án dúng q.ans.
- **IF** H?c sinh n?i sai
- **THEN** H? th?ng d?i màu du?ng line thành d? và t? d?ng s?a thành các du?ng n?i dúng (màu xanh l?c) sau 1 giây.
