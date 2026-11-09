// D1: app.constants — dữ liệu chương trình học theo cấp lớp.
// Được tách khỏi main.js để giảm kích thước tệp monolith.
;(function (root) {
    if (!root.app) root.app = {};
    const vietnameseLesson = (semester, number, title, ...activities) => ({
        id: `g4-vietnamese-${semester}-b${String(number).padStart(2, '0')}`,
        label: `Bài ${number}. ${title}`,
        activities
    });
    root.app.constants = {
        topics: {
            "1": {
                math: {
                    hk1: ['1. Các số từ 0 đến 10', '2. Làm quen với một số hình phẳng', '3. Phép cộng, phép trừ trong phạm vi 10', '4. Làm quen với một số hình khối', '5. Ôn tập Học kì 1'],
                    hk2: ['6. Các số đến 100', '7. Độ dài và Đo độ dài', '8. Phép cộng, phép trừ (không nhớ) trong phạm vi 100', '9. Thời gian. Giờ và lịch', '10. Ôn tập cuối năm']
                },
                vietnamese: {
                    hk1: ['Lớp 1 tập trung hoàn toàn vào việc học Âm, Vần, Chữ Cái'],
                    hk2: root.Grade1PracticeCatalog?.vietnameseTopics || ['1. Tôi và các bạn', '2. Mái ấm gia đình', '3. Mái trường mến yêu', '4. Điều em cần biết', '5. Bài học từ cuộc sống', '6. Thiên nhiên kỳ thú', '7. Thế giới trong mắt em', '8. Đất nước và con người']
                }
            },
            "2": {
                math: {
                    hk1: ['1. Ôn tập và bổ sung', '2. Phép cộng, phép trừ trong phạm vi 20', '3. Làm quen với khối lượng, dung tích', '4. Phép cộng, phép trừ (có nhớ) trong phạm vi 100', '5. Làm quen với hình phẳng', '6. Ngày - Giờ, Giờ - Phút, Ngày - Tháng', '7. Ôn tập Học kì 1'],
                    hk2: ['8. Phép nhân, phép chia', '9. Làm quen với hình khối', '10. Các số trong phạm vi 1 000', '11. Độ dài và đơn vị đo độ dài, tiền Việt Nam', '12. Phép cộng, phép trừ trong phạm vi 1 000', '13. Làm quen với yếu tố thống kê, xác suất', '14. Ôn tập cuối năm']
                },
                vietnamese: {
                    hk1: ['1. Em lớn lên từng ngày', '2. Đi học vui sao', '3. Niềm vui tuổi thơ', '4. Mái ấm gia đình'],
                    hk2: ['5. Vẻ đẹp quanh em', '6. Hành tinh xanh của em', '7. Giao tiếp và kết nối', '8. Con người Việt Nam', '9. Việt Nam quê hương em']
                }
            },
            "3": {
                math: {
                    hk1: ['1. Ôn tập và bổ sung', '2. Bảng nhân, bảng chia', '3. Làm quen với hình phẳng, hình khối', '4. Phép nhân, phép chia trong phạm vi 100', '5. Một số đơn vị đo độ dài, khối lượng, dung tích, nhiệt độ', '6. Phép nhân, phép chia trong phạm vi 1 000', '7. Ôn tập Học kì 1'],
                    hk2: ['8. Các số đến 10 000', '9. Chu vi, diện tích một số hình phẳng', '10. Cộng, trừ, nhân, chia trong phạm vi 10 000', '11. Các số đến 100 000', '12. Cộng, trừ trong phạm vi 100 000', '13. Xem đồng hồ. Tháng - năm. Tiền Việt Nam', '14. Nhân, chia trong phạm vi 100 000', '15. Làm quen với yếu tố Thống kê, Xác suất', '16. Ôn tập cuối năm']
                },
                vietnamese: {
                    hk1: ['1. Những trải nghiệm thú vị', '2. Cổng trường rộng mở', '3. Mái nhà yêu thương', '4. Cộng đồng gắn bó'],
                    hk2: ['5. Những sắc màu thiên nhiên', '6. Bài học từ cuộc sống', '7. Đất nước ngàn năm', '8. Trái Đất của chúng mình']
                }
            },
            "4": {
                math: {
                    hk1: ['1. Ôn tập và bổ sung', '2. Góc và đơn vị đo góc', '3. Số có nhiều chữ số', '4. Một số đơn vị đo Đại lượng', '5. Phép cộng và phép trừ', '6. Đường thẳng vuông góc. Đường thẳng song song', '7. Ôn tập Học kì 1'],
                    hk2: ['8. Phép nhân và phép chia', '9. Làm quen với yếu tố Thống kê, Xác suất', '10. Phân số', '11. Phép cộng, phép trừ Phân số', '12. Phép nhân, phép chia Phân số', '13. Ôn tập cuối năm']
                },
                vietnamese: {
                    hk1: ['1. Mỗi người một vẻ', '2. Trải nghiệm và khám phá', '3. Niềm vui sáng tạo', '4. Chắp cánh ước mơ'],
                    hk2: ['5. Sống để yêu thương', '6. Uống nước nhớ nguồn', '7. Quê hương trong tôi', '8. Vì một thế giới bình yên']
                }
            },
            "5": {
                math: {
                    hk1: ['1. Ôn tập và bổ sung', '2. Số thập phân', '3. Một số đơn vị đo diện tích', '4. Các phép tính với số thập phân', '5. Một số hình phẳng. Chu vi và Diện tích', '6. Ôn tập Học kỳ 1'],
                    hk2: ['7. Tỉ số và các Bài toán liên quan', '8. Thể tích, đơn vị đo Thể tích', '9. Diện tích và Thể tích của một số hình khối', '10. Số đo Thời gian, Vận tốc. Các bài toán liên quan đến Chuyển động đều', '11. Một số yếu tố Thống kê và Xác suất', '12. Ôn tập cuối năm']
                },
                vietnamese: {
                    hk1: ['1. Thế giới tuổi thơ', '2. Thiên nhiên kì thú', '3. Trên con đường học tập', '4. Nghệ thuật muôn màu'],
                    hk2: ['5. Vẻ đẹp cuộc sống', '6. Hương sắc trăm miền', '7. Tiếp bước cha ông', '8. Thế giới của chúng ta']
                }
            }
        },
        lessonCatalog: {
            "4": {
                math: {
                    hk1: [
                        {
                            topic: '1. Ôn tập và bổ sung',
                            lessons: [
                                { id: 'g4-math-hk1-b01', label: 'Bài 1. Ôn tập các số đến 100 000', page: 6 },
                                { id: 'g4-math-hk1-b02', label: 'Bài 2. Ôn tập các phép tính trong phạm vi 100 000', page: 9 },
                                { id: 'g4-math-hk1-b03', label: 'Bài 3. Số chẵn, số lẻ', page: 12 },
                                { id: 'g4-math-hk1-b04', label: 'Bài 4. Biểu thức chứa chữ', page: 14 },
                                { id: 'g4-math-hk1-b05', label: 'Bài 5. Giải bài toán có ba bước tính', page: 19 },
                                { id: 'g4-math-hk1-b06', label: 'Bài 6. Luyện tập chung', page: 21 }
                            ]
                        },
                        {
                            topic: '2. Góc và đơn vị đo góc',
                            lessons: [
                                { id: 'g4-math-hk1-b07', label: 'Bài 7. Đo góc, đơn vị đo góc', page: 23 },
                                { id: 'g4-math-hk1-b08', label: 'Bài 8. Góc nhọn, góc tù, góc bẹt', page: 26 },
                                { id: 'g4-math-hk1-b09', label: 'Bài 9. Luyện tập chung', page: 31 }
                            ]
                        },
                        {
                            topic: '3. Số có nhiều chữ số',
                            lessons: [
                                { id: 'g4-math-hk1-b10', label: 'Bài 10. Số có sáu chữ số. Số 1 000 000', page: 33 },
                                { id: 'g4-math-hk1-b11', label: 'Bài 11. Hàng và lớp', page: 37 },
                                { id: 'g4-math-hk1-b12', label: 'Bài 12. Các số trong phạm vi lớp triệu', page: 41 },
                                { id: 'g4-math-hk1-b13', label: 'Bài 13. Làm tròn số đến hàng trăm nghìn', page: 45 },
                                { id: 'g4-math-hk1-b14', label: 'Bài 14. So sánh các số có nhiều chữ số', page: 47 },
                                { id: 'g4-math-hk1-b15', label: 'Bài 15. Làm quen với dãy số tự nhiên', page: 50 },
                                { id: 'g4-math-hk1-b16', label: 'Bài 16. Luyện tập chung', page: 52 }
                            ]
                        },
                        {
                            topic: '4. Một số đơn vị đo Đại lượng',
                            lessons: [
                                { id: 'g4-math-hk1-b17', label: 'Bài 17. Yến, tạ, tấn', page: 56 },
                                { id: 'g4-math-hk1-b18', label: 'Bài 18. Đề-xi-mét vuông, mét vuông, mi-li-mét vuông', page: 60 },
                                { id: 'g4-math-hk1-b19', label: 'Bài 19. Giây, thế kỉ', page: 66 },
                                { id: 'g4-math-hk1-b20', label: 'Bài 20. Thực hành và trải nghiệm sử dụng một số đơn vị đo đại lượng', page: 69 },
                                { id: 'g4-math-hk1-b21', label: 'Bài 21. Luyện tập chung', page: 73 }
                            ]
                        },
                        {
                            topic: '5. Phép cộng và phép trừ',
                            lessons: [
                                { id: 'g4-math-hk1-b22', label: 'Bài 22. Phép cộng các số có nhiều chữ số', page: 76 },
                                { id: 'g4-math-hk1-b23', label: 'Bài 23. Phép trừ các số có nhiều chữ số', page: 79 },
                                { id: 'g4-math-hk1-b24', label: 'Bài 24. Tính chất giao hoán và kết hợp của phép cộng', page: 82 },
                                { id: 'g4-math-hk1-b25', label: 'Bài 25. Tìm hai số biết tổng và hiệu của hai số đó', page: 86 },
                                { id: 'g4-math-hk1-b26', label: 'Bài 26. Luyện tập chung', page: 88 }
                            ]
                        },
                        {
                            topic: '6. Đường thẳng vuông góc. Đường thẳng song song',
                            lessons: [
                                { id: 'g4-math-hk1-b27', label: 'Bài 27. Hai đường thẳng vuông góc', page: 91 },
                                { id: 'g4-math-hk1-b28', label: 'Bài 28. Thực hành và trải nghiệm về hai đường thẳng vuông góc', page: 94 },
                                { id: 'g4-math-hk1-b29', label: 'Bài 29. Hai đường thẳng song song', page: 98 },
                                { id: 'g4-math-hk1-b30', label: 'Bài 30. Thực hành và trải nghiệm về hai đường thẳng song song', page: 101 },
                                { id: 'g4-math-hk1-b31', label: 'Bài 31. Hình bình hành, hình thoi', page: 105 },
                                { id: 'g4-math-hk1-b32', label: 'Bài 32. Luyện tập chung', page: 110 }
                            ]
                        },
                        {
                            topic: '7. Ôn tập Học kì 1',
                            lessons: [
                                { id: 'g4-math-hk1-b33', label: 'Bài 33. Ôn tập các số đến lớp triệu', page: 114 },
                                { id: 'g4-math-hk1-b34', label: 'Bài 34. Ôn tập phép cộng, phép trừ', page: 118 },
                                { id: 'g4-math-hk1-b35', label: 'Bài 35. Ôn tập hình học', page: 121 },
                                { id: 'g4-math-hk1-b36', label: 'Bài 36. Ôn tập đo lường', page: 125 },
                                { id: 'g4-math-hk1-b37', label: 'Bài 37. Ôn tập chung', page: 127 }
                            ]
                        }
                    ],
                    hk2: [
                        {
                            topic: '8. Phép nhân và phép chia',
                            lessons: [
                                { id: 'g4-math-hk2-b38', label: 'Bài 38. Nhân với số có một chữ số', page: 4 },
                                { id: 'g4-math-hk2-b39', label: 'Bài 39. Chia cho số có một chữ số', page: 6 },
                                { id: 'g4-math-hk2-b40', label: 'Bài 40. Tính chất giao hoán và kết hợp của phép nhân', page: 9 },
                                { id: 'g4-math-hk2-b41', label: 'Bài 41. Nhân, chia với 10, 100, 1 000,...', page: 14 },
                                { id: 'g4-math-hk2-b42', label: 'Bài 42. Tính chất phân phối của phép nhân đối với phép cộng', page: 17 },
                                { id: 'g4-math-hk2-b43', label: 'Bài 43. Nhân với số có hai chữ số', page: 20 },
                                { id: 'g4-math-hk2-b44', label: 'Bài 44. Chia cho số có hai chữ số', page: 23 },
                                { id: 'g4-math-hk2-b45', label: 'Bài 45. Thực hành và trải nghiệm ước lượng trong tính toán', page: 27 },
                                { id: 'g4-math-hk2-b46', label: 'Bài 46. Tìm số trung bình cộng', page: 29 },
                                { id: 'g4-math-hk2-b47', label: 'Bài 47. Bài toán liên quan đến rút về đơn vị', page: 31 },
                                { id: 'g4-math-hk2-b48', label: 'Bài 48. Luyện tập chung', page: 33 }
                            ]
                        },
                        {
                            topic: '9. Làm quen với yếu tố Thống kê, Xác suất',
                            lessons: [
                                { id: 'g4-math-hk2-b49', label: 'Bài 49. Dãy số liệu thống kê', page: 36 },
                                { id: 'g4-math-hk2-b50', label: 'Bài 50. Biểu đồ cột', page: 39 },
                                { id: 'g4-math-hk2-b51', label: 'Bài 51. Số lần xuất hiện của một sự kiện', page: 43 },
                                { id: 'g4-math-hk2-b52', label: 'Bài 52. Luyện tập chung', page: 47 }
                            ]
                        },
                        {
                            topic: '10. Phân số',
                            lessons: [
                                { id: 'g4-math-hk2-b53', label: 'Bài 53. Khái niệm phân số', page: 49 },
                                { id: 'g4-math-hk2-b54', label: 'Bài 54. Phân số và phép chia số tự nhiên', page: 52 },
                                { id: 'g4-math-hk2-b55', label: 'Bài 55. Tính chất cơ bản của phân số', page: 56 },
                                { id: 'g4-math-hk2-b56', label: 'Bài 56. Rút gọn phân số', page: 59 },
                                { id: 'g4-math-hk2-b57', label: 'Bài 57. Quy đồng mẫu số các phân số', page: 62 },
                                { id: 'g4-math-hk2-b58', label: 'Bài 58. So sánh phân số', page: 64 },
                                { id: 'g4-math-hk2-b59', label: 'Bài 59. Luyện tập chung', page: 69 }
                            ]
                        },
                        {
                            topic: '11. Phép cộng, phép trừ Phân số',
                            lessons: [
                                { id: 'g4-math-hk2-b60', label: 'Bài 60. Phép cộng phân số', page: 74 },
                                { id: 'g4-math-hk2-b61', label: 'Bài 61. Phép trừ phân số', page: 80 },
                                { id: 'g4-math-hk2-b62', label: 'Bài 62. Luyện tập chung', page: 83 }
                            ]
                        },
                        {
                            topic: '12. Phép nhân, phép chia Phân số',
                            lessons: [
                                { id: 'g4-math-hk2-b63', label: 'Bài 63. Phép nhân phân số', page: 86 },
                                { id: 'g4-math-hk2-b64', label: 'Bài 64. Phép chia phân số', page: 91 },
                                { id: 'g4-math-hk2-b65', label: 'Bài 65. Tìm phân số của một số', page: 95 },
                                { id: 'g4-math-hk2-b66', label: 'Bài 66. Luyện tập chung', page: 98 }
                            ]
                        },
                        {
                            topic: '13. Ôn tập cuối năm',
                            lessons: [
                                { id: 'g4-math-hk2-b67', label: 'Bài 67. Ôn tập số tự nhiên', page: 102 },
                                { id: 'g4-math-hk2-b68', label: 'Bài 68. Ôn tập phép tính với số tự nhiên', page: 105 },
                                { id: 'g4-math-hk2-b69', label: 'Bài 69. Ôn tập phân số', page: 107 },
                                { id: 'g4-math-hk2-b70', label: 'Bài 70. Ôn tập phép tính với phân số', page: 110 },
                                { id: 'g4-math-hk2-b71', label: 'Bài 71. Ôn tập hình học và đo lường', page: 112 },
                                { id: 'g4-math-hk2-b72', label: 'Bài 72. Ôn tập một số yếu tố thống kê và xác suất', page: 114 },
                                { id: 'g4-math-hk2-b73', label: 'Bài 73. Ôn tập chung', page: 116 }
                            ]
                        }
                    ]
                },
                vietnamese: {
                    hk1: [
                        { topic: '1. Mỗi người một vẻ', lessons: [
                            vietnameseLesson('hk1', 1, 'Điều kì diệu', 'Đọc: Điều kì diệu', 'Luyện từ và câu: Danh từ', 'Viết: Tìm hiểu đoạn văn và câu chủ đề'),
                            vietnameseLesson('hk1', 2, 'Thi nhạc', 'Đọc: Thi nhạc', 'Viết: Tìm hiểu cách viết đoạn văn nêu ý kiến', 'Nói và nghe: Tôi và bạn'),
                            vietnameseLesson('hk1', 3, 'Anh em sinh đôi', 'Đọc: Anh em sinh đôi', 'Luyện từ và câu: Danh từ chung, danh từ riêng', 'Viết: Tìm ý cho đoạn văn nêu ý kiến'),
                            vietnameseLesson('hk1', 4, 'Công chúa và người dẫn chuyện', 'Đọc: Công chúa và người dẫn chuyện', 'Viết: Viết đoạn văn nêu ý kiến', 'Đọc mở rộng'),
                            vietnameseLesson('hk1', 5, 'Thần lằn xanh và tắc kè', 'Đọc: Thần lằn xanh và tắc kè', 'Luyện từ và câu: Luyện tập về danh từ', 'Viết: Trả bài viết đoạn văn nêu ý kiến'),
                            vietnameseLesson('hk1', 6, 'Nghệ sĩ trống', 'Đọc: Nghệ sĩ trống', 'Viết: Tìm hiểu cách viết báo cáo thảo luận nhóm', 'Nói và nghe: Kể chuyện Bốn anh tài'),
                            vietnameseLesson('hk1', 7, 'Những bức chân dung', 'Đọc: Những bức chân dung', 'Luyện từ và câu: Quy tắc viết tên cơ quan, tổ chức', 'Viết: Lập dàn ý cho báo cáo thảo luận nhóm'),
                            vietnameseLesson('hk1', 8, 'Đò ngang', 'Đọc: Đò ngang', 'Viết: Viết báo cáo thảo luận nhóm', 'Đọc mở rộng')
                        ] },
                        { topic: '2. Trải nghiệm và khám phá', lessons: [
                            vietnameseLesson('hk1', 9, 'Bầu trời trong quả trứng', 'Đọc: Bầu trời trong quả trứng', 'Luyện từ và câu: Động từ', 'Viết: Tìm hiểu cách viết bài văn thuật lại một sự việc'),
                            vietnameseLesson('hk1', 10, 'Tiếng nói của cỏ cây', 'Đọc: Tiếng nói của cỏ cây', 'Viết: Lập dàn ý cho bài văn thuật lại một sự việc', 'Nói và nghe: Trải nghiệm đáng nhớ'),
                            vietnameseLesson('hk1', 11, 'Tập làm văn', 'Đọc: Tập làm văn', 'Luyện từ và câu: Luyện tập về động từ', 'Viết: Viết bài văn thuật lại một sự việc'),
                            vietnameseLesson('hk1', 12, 'Nhà phát minh 6 tuổi', 'Đọc: Nhà phát minh 6 tuổi', 'Viết: Tìm hiểu cách viết bài văn kể lại một câu chuyện', 'Đọc mở rộng'),
                            vietnameseLesson('hk1', 13, 'Con vẹt xanh', 'Đọc: Con vẹt xanh', 'Luyện từ và câu: Luyện tập về động từ', 'Viết: Luyện viết mở bài, kết bài cho bài văn kể lại một câu chuyện'),
                            vietnameseLesson('hk1', 14, 'Chân trời cuối phố', 'Đọc: Chân trời cuối phố', 'Viết: Lập dàn ý cho bài văn kể lại một câu chuyện', 'Nói và nghe: Việc làm có ích'),
                            vietnameseLesson('hk1', 15, 'Gặt chữ trên non', 'Đọc: Gặt chữ trên non', 'Luyện từ và câu: Cách dùng và công dụng của từ điển', 'Viết: Viết bài văn kể lại một câu chuyện'),
                            vietnameseLesson('hk1', 16, 'Trước ngày xa quê', 'Đọc: Trước ngày xa quê', 'Viết: Trả bài văn kể lại một câu chuyện', 'Đọc mở rộng')
                        ] },
                        { topic: '3. Niềm vui sáng tạo', lessons: [
                            vietnameseLesson('hk1', 17, 'Vẽ màu', 'Đọc: Vẽ màu', 'Luyện từ và câu: Biện pháp nhân hoá', 'Viết: Tìm hiểu cách viết đoạn văn tưởng tượng'),
                            vietnameseLesson('hk1', 18, 'Đồng cỏ nở hoa', 'Đọc: Đồng cỏ nở hoa', 'Viết: Tìm ý cho đoạn văn tưởng tượng', 'Nói và nghe: Chúng em sáng tạo'),
                            vietnameseLesson('hk1', 19, 'Thanh âm của núi', 'Đọc: Thanh âm của núi', 'Luyện từ và câu: Luyện tập về biện pháp nhân hoá', 'Viết: Viết đoạn văn tưởng tượng'),
                            vietnameseLesson('hk1', 20, 'Bầu trời mùa thu', 'Đọc: Bầu trời mùa thu', 'Viết: Trả bài viết đoạn văn tưởng tượng', 'Đọc mở rộng'),
                            vietnameseLesson('hk1', 21, 'Làm thỏ con bằng giấy', 'Đọc: Làm thỏ con bằng giấy', 'Luyện từ và câu: Tính từ', 'Viết: Tìm hiểu cách viết hướng dẫn thực hiện một công việc'),
                            vietnameseLesson('hk1', 22, 'Bức tường có nhiều phép lạ', 'Đọc: Bức tường có nhiều phép lạ', 'Viết: Viết hướng dẫn thực hiện một công việc', 'Nói và nghe: Kể chuyện Nhà phát minh và bà cụ'),
                            vietnameseLesson('hk1', 23, 'Bét-tô-ven và bản xô-nát Ánh trăng', 'Đọc: Bét-tô-ven và bản xô-nát Ánh trăng', 'Luyện từ và câu: Luyện tập về tính từ', 'Viết: Tìm hiểu cách viết đơn'),
                            vietnameseLesson('hk1', 24, 'Người tìm đường lên các vì sao', 'Đọc: Người tìm đường lên các vì sao', 'Viết: Viết đơn', 'Đọc mở rộng')
                        ] },
                        { topic: '4. Chắp cánh ước mơ', lessons: [
                            vietnameseLesson('hk1', 25, 'Bay cùng ước mơ', 'Đọc: Bay cùng ước mơ', 'Luyện từ và câu: Luyện tập về tính từ', 'Viết: Tìm hiểu cách viết bài văn miêu tả con vật'),
                            vietnameseLesson('hk1', 26, 'Con trai người làm vườn', 'Đọc: Con trai người làm vườn', 'Viết: Quan sát con vật', 'Nói và nghe: Ước mơ của em'),
                            vietnameseLesson('hk1', 27, 'Nếu em có một khu vườn', 'Đọc: Nếu em có một khu vườn', 'Luyện từ và câu: Dấu gạch ngang', 'Viết: Luyện viết đoạn văn miêu tả con vật'),
                            vietnameseLesson('hk1', 28, 'Bốn mùa mơ ước', 'Đọc: Bốn mùa mơ ước', 'Viết: Lập dàn ý cho bài văn miêu tả con vật', 'Đọc mở rộng'),
                            vietnameseLesson('hk1', 29, 'Ở Vương quốc Tương Lai', 'Đọc: Ở Vương quốc Tương Lai', 'Luyện từ và câu: Luyện tập về dấu gạch ngang', 'Viết: Viết bài văn miêu tả con vật'),
                            vietnameseLesson('hk1', 30, 'Cánh chim nhỏ', 'Đọc: Cánh chim nhỏ', 'Viết: Trả bài văn miêu tả con vật', 'Nói và nghe: Kể chuyện Đôi cánh của ngựa trắng'),
                            vietnameseLesson('hk1', 31, 'Nếu chúng mình có phép lạ', 'Đọc: Nếu chúng mình có phép lạ', 'Luyện từ và câu: Luyện tập về danh từ, động từ, tính từ', 'Viết: Tìm hiểu cách viết thư'),
                            vietnameseLesson('hk1', 32, 'Anh Ba', 'Đọc: Anh Ba', 'Viết: Viết thư', 'Đọc mở rộng')
                        ] }
                    ],
                    hk2: [
                        { topic: '5. Sống để yêu thương', lessons: [
                            vietnameseLesson('hk2', 1, 'Hải Thượng Lãn Ông', 'Đọc: Hải Thượng Lãn Ông', 'Luyện từ và câu: Câu', 'Viết: Tìm hiểu cách viết đoạn văn nêu tình cảm, cảm xúc'),
                            vietnameseLesson('hk2', 2, 'Vệt phấn trên mặt bàn', 'Đọc: Vệt phấn trên mặt bàn', 'Viết: Tìm ý cho đoạn văn nêu tình cảm, cảm xúc về một người gần gũi, thân thiết', 'Nói và nghe: Giúp bạn'),
                            vietnameseLesson('hk2', 3, 'Ông Bụt đã đến', 'Đọc: Ông Bụt đã đến', 'Luyện từ và câu: Hai thành phần chính của câu', 'Viết: Viết đoạn văn nêu tình cảm, cảm xúc về một người gần gũi, thân thiết'),
                            vietnameseLesson('hk2', 4, 'Quả ngọt cuối mùa', 'Đọc: Quả ngọt cuối mùa', 'Viết: Tìm ý cho đoạn văn nêu tình cảm, cảm xúc về một nhân vật trong văn học', 'Đọc mở rộng'),
                            vietnameseLesson('hk2', 5, 'Tờ báo tường của tôi', 'Đọc: Tờ báo tường của tôi', 'Luyện từ và câu: Luyện tập về chủ ngữ', 'Viết: Viết đoạn văn nêu tình cảm, cảm xúc về một nhân vật trong văn học'),
                            vietnameseLesson('hk2', 6, 'Tiếng ru', 'Đọc: Tiếng ru', 'Viết: Trả bài viết đoạn văn nêu tình cảm, cảm xúc về một nhân vật trong văn học', 'Nói và nghe: Kể chuyện Bài học quý'),
                            vietnameseLesson('hk2', 7, 'Con muốn làm một cái cây', 'Đọc: Con muốn làm một cái cây', 'Luyện từ và câu: Luyện tập về vị ngữ', 'Viết: Tìm hiểu cách viết hướng dẫn sử dụng một sản phẩm'),
                            vietnameseLesson('hk2', 8, 'Trên khóm tre đầu ngõ', 'Đọc: Trên khóm tre đầu ngõ', 'Viết: Viết hướng dẫn sử dụng một sản phẩm', 'Đọc mở rộng')
                        ] },
                        { topic: '6. Uống nước nhớ nguồn', lessons: [
                            vietnameseLesson('hk2', 9, 'Sự tích con Rồng cháu Tiên', 'Đọc: Sự tích con Rồng cháu Tiên', 'Luyện từ và câu: Luyện tập về hai thành phần chính của câu', 'Viết: Lập dàn ý cho bài văn kể lại một câu chuyện'),
                            vietnameseLesson('hk2', 10, 'Cảm xúc Trường Sa', 'Đọc: Cảm xúc Trường Sa', 'Viết: Viết bài văn kể lại một câu chuyện', 'Nói và nghe: Những tấm gương sáng'),
                            vietnameseLesson('hk2', 11, 'Sáng tháng Năm', 'Đọc: Sáng tháng Năm', 'Luyện từ và câu: Trạng ngữ', 'Viết: Trả bài văn kể lại một câu chuyện'),
                            vietnameseLesson('hk2', 12, 'Chàng trai làng Phù Ủng', 'Đọc: Chàng trai làng Phù Ủng', 'Viết: Viết đoạn văn nêu ý kiến', 'Đọc mở rộng'),
                            vietnameseLesson('hk2', 13, 'Vườn của ông tôi', 'Đọc: Vườn của ông tôi', 'Luyện từ và câu: Trạng ngữ chỉ thời gian, nơi chốn', 'Viết: Trả bài viết đoạn văn nêu ý kiến'),
                            vietnameseLesson('hk2', 14, 'Trong lời mẹ hát', 'Đọc: Trong lời mẹ hát', 'Viết: Lập dàn ý cho bài văn thuật lại một sự việc', 'Nói và nghe: Truyền thống Uống nước nhớ nguồn'),
                            vietnameseLesson('hk2', 15, 'Người thầy đầu tiên của bố tôi', 'Đọc: Người thầy đầu tiên của bố tôi', 'Luyện từ và câu: Trạng ngữ chỉ nguyên nhân, mục đích', 'Viết: Viết bài văn thuật lại một sự việc'),
                            vietnameseLesson('hk2', 16, 'Ngựa biên phòng', 'Đọc: Ngựa biên phòng', 'Viết: Trả bài văn thuật lại một sự việc', 'Đọc mở rộng')
                        ] },
                        { topic: '7. Quê hương trong tôi', lessons: [
                            vietnameseLesson('hk2', 17, 'Cây đa quê hương', 'Đọc: Cây đa quê hương', 'Luyện từ và câu: Trạng ngữ chỉ phương tiện', 'Viết: Tìm hiểu cách viết bài văn miêu tả cây cối'),
                            vietnameseLesson('hk2', 18, 'Bước mùa xuân', 'Đọc: Bước mùa xuân', 'Viết: Tìm hiểu cách viết bài văn miêu tả cây cối (tiếp theo)', 'Nói và nghe: Những miền quê yêu dấu'),
                            vietnameseLesson('hk2', 19, 'Đi hội chùa Hương', 'Đọc: Đi hội chùa Hương', 'Luyện từ và câu: Dấu ngoặc kép', 'Viết: Quan sát cây cối'),
                            vietnameseLesson('hk2', 20, 'Chiều ngoại ô', 'Đọc: Chiều ngoại ô', 'Viết: Luyện viết đoạn văn miêu tả cây cối', 'Đọc mở rộng'),
                            vietnameseLesson('hk2', 21, 'Những cánh buồm', 'Đọc: Những cánh buồm', 'Luyện từ và câu: Dấu ngoặc đơn', 'Viết: Luyện viết mở bài, kết bài cho bài văn miêu tả cây cối'),
                            vietnameseLesson('hk2', 22, 'Cái cầu', 'Đọc: Cái cầu', 'Viết: Lập dàn ý cho bài văn miêu tả cây cối', 'Nói và nghe: Kể chuyện Về quê ngoại'),
                            vietnameseLesson('hk2', 23, 'Đường đi Sa Pa', 'Đọc: Đường đi Sa Pa', 'Luyện từ và câu: Luyện tập viết tên cơ quan, tổ chức', 'Viết: Viết bài văn miêu tả cây cối'),
                            vietnameseLesson('hk2', 24, 'Quê ngoại', 'Đọc: Quê ngoại', 'Viết: Trả bài văn miêu tả cây cối', 'Đọc mở rộng')
                        ] },
                        { topic: '8. Vì một thế giới bình yên', lessons: [
                            vietnameseLesson('hk2', 25, 'Khu bảo tồn động vật hoang dã Ngô-rông-gô-rô', 'Đọc: Khu bảo tồn động vật hoang dã Ngô-rông-gô-rô', 'Luyện từ và câu: Lựa chọn từ ngữ', 'Viết: Viết đoạn văn tưởng tượng'),
                            vietnameseLesson('hk2', 26, 'Ngôi nhà của yêu thương', 'Đọc: Ngôi nhà của yêu thương', 'Viết: Trả bài viết đoạn văn tưởng tượng', 'Nói và nghe: Chung tay bảo vệ động vật'),
                            vietnameseLesson('hk2', 27, 'Băng tan', 'Đọc: Băng tan', 'Luyện từ và câu: Luyện tập lựa chọn từ ngữ', 'Viết: Viết đoạn văn tưởng tượng'),
                            vietnameseLesson('hk2', 28, 'Chuyến du lịch thú vị', 'Đọc: Chuyến du lịch thú vị', 'Viết: Hướng dẫn cách viết thư', 'Đọc mở rộng'),
                            vietnameseLesson('hk2', 29, 'Lễ hội ở Nhật Bản', 'Đọc: Lễ hội ở Nhật Bản', 'Luyện từ và câu: Luyện tập về dấu câu', 'Viết: Viết thư'),
                            vietnameseLesson('hk2', 30, 'Ngày hội', 'Đọc: Ngày hội', 'Viết: Viết giấy mời', 'Nói và nghe: Cuộc sống xanh')
                        ] }
                    ]
                }
            }
        }
    };
    const grade5Lessons = {
        math: {
            hk1: [
                [
                    [1, "Ôn tập số tự nhiên", 6, "natural,roundNatural"],
                    [2, "Ôn tập các phép tính với số tự nhiên", 9, "naturalOps"],
                    [3, "Ôn tập phân số", 11, "fraction,equivalent"],
                    [4, "Phân số thập phân", 14, "decimalFraction"],
                    [5, "Ôn tập các phép tính với phân số", 16, "fractionReview"],
                    [6, "Cộng, trừ hai phân số khác mẫu số", 20, "fractionAdd,fractionSubtract"],
                    [7, "Hỗn số", 23, "mixed"],
                    [8, "Ôn tập hình học và đo lường", 26, "angle,massReview,timeConvert"],
                    [9, "Luyện tập chung", 29, "naturalOps,equivalent,fractionAdd,mixed,rectangle"]
                ],
                [
                    [10, "Khái niệm số thập phân", 32, "decimalPlace,decimalRepresentation"],
                    [11, "So sánh các số thập phân", 38, "compareDecimal"],
                    [12, "Viết số đo đại lượng dưới dạng số thập phân", 42, "measure"],
                    [13, "Làm tròn số thập phân", 47, "roundDecimal"],
                    [14, "Luyện tập chung", 51, "decimalPlace,compareDecimal,measure,roundDecimal"]
                ],
                [
                    [15, "Ki-lô-mét vuông. Héc-ta", 53, "hectare"],
                    [16, "Các đơn vị đo diện tích", 56, "areaConvert"],
                    [17, "Thực hành và trải nghiệm với một số đơn vị đo đại lượng", 60, "measure,rectangle,areaConvert"],
                    [18, "Luyện tập chung", 62, "hectare,areaConvert"]
                ],
                [
                    [19, "Phép cộng số thập phân", 65, "decimalAdd"],
                    [20, "Phép trừ số thập phân", 68, "decimalSubtract"],
                    [21, "Phép nhân số thập phân", 71, "decimalMultiply"],
                    [22, "Phép chia số thập phân", 76, "decimalDivide"],
                    [23, "Nhân, chia số thập phân với 10; 100; 1 000;... hoặc với 0,1; 0,01; 0,001;...", 83, "decimalShift"],
                    [24, "Luyện tập chung", 88, "decimalAdd,decimalSubtract,decimalMultiply,decimalDivide,decimalShift"]
                ],
                [
                    [25, "Hình tam giác. Diện tích hình tam giác", 91, "triangleKind,triangleArea"],
                    [26, "Hình thang. Diện tích hình thang", 98, "trapezoid"],
                    [27, "Đường tròn. Chu vi và diện tích hình tròn", 105, "circleMeasure,circleArea"],
                    [28, "Thực hành và trải nghiệm đo, vẽ, lắp ghép, tạo hình", 113, "circleMeasure,composeShape"],
                    [29, "Luyện tập chung", 116, "triangleArea,trapezoid,circleArea"]
                ],
                [
                    [30, "Ôn tập số thập phân", 120, "decimalPlace,compareDecimal,roundDecimal"],
                    [31, "Ôn tập các phép tính với số thập phân", 123, "decimalAdd,decimalSubtract,decimalMultiply,decimalDivide"],
                    [32, "Ôn tập một số hình phẳng", 127, "triangleKind,circleRadius"],
                    [33, "Ôn tập diện tích, chu vi một số hình phẳng", 130, "triangleArea,trapezoid,circleArea,circleMeasure"],
                    [34, "Ôn tập đo lường", 133, "measure,hectare,areaConvert"],
                    [35, "Ôn tập chung", 135, "roundDecimal,decimalDivide,triangleArea,circleArea,areaConvert"]
                ]
            ],
            hk2: [
                [
                    [36, "Tỉ số. Tỉ số phần trăm", 4, "ratio,percentFraction"],
                    [37, "Tỉ lệ bản đồ và ứng dụng", 8, "scale"],
                    [38, "Tìm hai số khi biết tổng và tỉ số của hai số đó", 12, "sumRatio"],
                    [39, "Tìm hai số khi biết hiệu và tỉ số của hai số đó", 15, "differenceRatio"],
                    [40, "Tìm tỉ số phần trăm của hai số", 18, "percentRatio"],
                    [41, "Tìm giá trị phần trăm của một số", 21, "percentValue"],
                    [42, "Máy tính cầm tay", 23, "calculator"],
                    [43, "Thực hành và trải nghiệm sử dụng máy tính cầm tay", 27, "calculatorContext"],
                    [44, "Luyện tập chung", 28, "scale,sumRatio,differenceRatio,percentRatio,percentValue"]
                ],
                [
                    [45, "Thể tích của một hình", 30, "cubeCount"],
                    [46, "Xăng-ti-mét khối. Đề-xi-mét khối", 33, "volumeSmall"],
                    [47, "Mét khối", 35, "volumeLarge"],
                    [48, "Luyện tập chung", 38, "cubeCount,volumeSmall,volumeLarge"]
                ],
                [
                    [49, "Hình khai triển của hình lập phương, hình hộp chữ nhật và hình trụ", 40, "net"],
                    [50, "Diện tích xung quanh và diện tích toàn phần của hình hộp chữ nhật", 44, "boxArea"],
                    [51, "Diện tích xung quanh và diện tích toàn phần của hình lập phương", 48, "cubeArea"],
                    [52, "Thể tích của hình hộp chữ nhật", 51, "boxVolume"],
                    [53, "Thể tích của hình lập phương", 54, "cubeVolume"],
                    [54, "Thực hành tính toán và ước lượng thể tích một số hình khối", 58, "estimateVolume"],
                    [55, "Luyện tập chung", 60, "boxArea,cubeArea,boxVolume,cubeVolume"]
                ],
                [
                    [56, "Các đơn vị đo thời gian", 64, "timeConvert"],
                    [57, "Cộng, trừ số đo thời gian", 67, "timeAddSubtract"],
                    [58, "Nhân, chia số đo thời gian với một số", 71, "timeMultiplyDivide"],
                    [59, "Vận tốc của một chuyển động đều", 76, "speed"],
                    [60, "Quãng đường, thời gian của một chuyển động đều", 78, "distance,duration"],
                    [61, "Thực hành tính toán và ước lượng về vận tốc, quãng đường, thời gian trong chuyển động đều", 82, "motionPractice"],
                    [62, "Luyện tập chung", 84, "timeConvert,timeAddSubtract,speed,distance,duration"]
                ],
                [
                    [63, "Thu thập, phân loại, sắp xếp các số liệu", 87, "survey"],
                    [64, "Biểu đồ hình quạt tròn", 90, "pie"],
                    [65, "Tỉ số của số lần lặp lại một sự kiện so với tổng số lần thực hiện", 94, "frequency"],
                    [66, "Thực hành và trải nghiệm thu thập, phân tích, biểu diễn các số liệu thống kê", 96, "survey,pie"],
                    [67, "Luyện tập chung", 100, "survey,pie,frequency"]
                ],
                [
                    [68, "Ôn tập số tự nhiên, phân số, số thập phân", 103, "natural,equivalent,decimalPlace,compareDecimal"],
                    [69, "Ôn tập các phép tính với số tự nhiên, phân số, số thập phân", 107, "naturalOps,fractionOps,decimalDivide"],
                    [70, "Ôn tập tỉ số, tỉ số phần trăm", 111, "ratio,percentRatio,percentValue"],
                    [71, "Ôn tập hình học", 113, "triangleArea,trapezoid,circleArea,boxArea,cubeVolume"],
                    [72, "Ôn tập đo lường", 119, "measure,areaConvert,volumeLarge,timeConvert"],
                    [73, "Ôn tập toán chuyển động đều", 121, "speed,distance,duration"],
                    [74, "Ôn tập một số yếu tố thống kê và xác suất", 123, "survey,pie,frequency"],
                    [75, "Ôn tập chung", 128, "fractionOps,decimalMultiply,percentValue,boxVolume,motionPractice,pie"]
                ]
            ]
        },
        vietnamese: {
            hk1: [
                [
                    [1, "Thanh âm của gió", 8, "10:wordClass,8:windReading"],
                    [2, "Cánh đồng hoa", 13, "15:story"],
                    [3, "Tuổi Ngựa", 18, "20:pronoun"],
                    [4, "Bến sông tuổi thơ", 23, "25:story"],
                    [5, "Tiếng hạt nảy mầm", 28, "29:pronoun"],
                    [6, "Ngôi sao sân cỏ", 31, "33:report"],
                    [7, "Bộ sưu tập độc đáo", 36, "38:pronoun"],
                    [8, "Hành tinh kì lạ", 41, "43:report"]
                ],
                [
                    [9, "Trước cổng trời", 46, "47:synonym,46:skyReading"],
                    [10, "Kì diệu rừng xanh", 51, "53:landscape"],
                    [11, "Hang Sơn Đoòng – những điều kì thú", 56, "58:synonym"],
                    [12, "Những hòn đảo trên vịnh Hạ Long", 60, "61:landscape"],
                    [13, "Mầm non", 64, "65:polysemy"],
                    [14, "Những ngọn núi nóng rẫy", 68, "70:landscape"],
                    [15, "Bài ca về mặt trời", 72, "74:polysemy"],
                    [16, "Xin chào, Xa-ha-ra", 76, "78:landscape"],
                    ["mid", "Ôn tập giữa học kì I", 80, "80:wordClass,80:pronoun,80:synonym,80:polysemy"]
                ],
                [
                    [17, "Thư gửi các học sinh", 89, "90:dictionary"],
                    [18, "Tấm gương tự học", 94, "96:bookCharacter,94:studyReading"],
                    [19, "Trải nghiệm để sáng tạo", 98, "100:dictionary"],
                    [20, "Khổ luyện thành tài", 102, "104:bookCharacter"],
                    [21, "Thế giới trong trang sách", 105, "106:dash"],
                    [22, "Từ những câu chuyện ấu thơ", 110, "112:storyResponse"],
                    [23, "Giới thiệu sách Dế Mèn phiêu lưu kí", 114, "115:dash"],
                    [24, "Tinh thần học tập của nhà Phi-lít", 117, "119:storyResponse"]
                ],
                [
                    [25, "Tiếng đàn ba-la-lai-ca trên sông Đà", 122, "123:repetition"],
                    [26, "Trí tưởng tượng phong phú", 127, "129:poemResponse"],
                    [27, "Tranh làng Hồ", 132, "134:repetition,132:paintingReading"],
                    [28, "Tập hát quan họ", 136, "138:poemResponse"],
                    [29, "Phim hoạt hình Chú ốc sên bay", 140, "141:connector"],
                    [30, "Nghệ thuật múa ba lê", 145, "147:filmCharacter"],
                    [31, "Một ngôi chùa độc đáo", 149, "151:connector"],
                    [32, "Sự tích chú Tễu", 153, "156:filmCharacter"],
                    ["end", "Ôn tập cuối học kì I", 158, "158:dictionary,158:dash,158:repetition,158:connector"]
                ]
            ],
            hk2: [
                [
                    [1, "Tiếng hát của người đá", 8, "10:sentence,8:stoneReading"],
                    [2, "Khúc hát ru những em bé lớn trên lưng mẹ", 13, "15:person"],
                    [3, "Hạt gạo làng ta", 17, "19:clauseLink"],
                    [4, "Hộp quà màu thiên thanh", 22, "24:person"],
                    [5, "Giỏ hoa tháng Năm", 26, "27:pairedLink"],
                    [6, "Thư của bố", 30, "32:person"],
                    [7, "Đoàn thuyền đánh cá", 34, "36:sentence,36:pairedLink"],
                    [8, "Khu rừng của Mát", 38, "40:person"]
                ],
                [
                    [9, "Hội thổi cơm thi ở Đồng Vân", 43, "45:cohesionRepeat,43:festivalReading"],
                    [10, "Những búp chè trên cây cổ thụ", 48, "51:eventResponse"],
                    [11, "Hương cốm mùa thu", 53, "54:cohesionConnect"],
                    [12, "Vũ điệu trên nền thổ cẩm", 57, "59:eventResponse"],
                    [13, "Đàn t'rưng – tiếng ca đại ngàn", 61, "62:cohesionReplace"],
                    [14, "Đường quê Đồng Tháp Mười", 66, "68:program"],
                    [15, "Xuồng ba lá quê tôi", 70, "71:cohesionRepeat,71:cohesionConnect,71:cohesionReplace"],
                    [16, "Về thăm Đất Mũi", 73, "75:program"],
                    ["mid", "Ôn tập giữa học kì II", 77, "77:sentence,77:pairedLink,77:cohesionConnect,77:cohesionReplace"]
                ],
                [
                    [17, "Nghìn năm văn hiến", 88, "90:pronoun,90:connector"],
                    [18, "Người thầy của muôn đời", 93, "95:agree"],
                    [19, "Danh y Tuệ Tĩnh", 97, "99:synonym,99:polysemy,97:tueTinhReading"],
                    [20, "Cụ Đồ Chiểu", 101, "103:agree"],
                    [21, "Anh hùng Lao động Trần Đại Nghĩa", 106, "107:sentence,107:pairedLink"],
                    [22, "Bộ đội về làng", 109, "111:eventResponse"],
                    [23, "Về ngôi nhà đang xây", 113, "114:respect"],
                    [24, "Việt Nam quê hương ta", 117, "118:landscape"]
                ],
                [
                    [25, "Bài ca trái đất", 122, "123:foreign"],
                    [26, "Những con hạc giấy", 126, "128:person"],
                    [27, "Một người hùng thầm lặng", 130, "132:dash"],
                    [28, "Giờ Trái Đất", 135, "137:disagree,135:earthReading"],
                    [29, "Điện thoại di động", 140, "142:cohesionRepeat,142:cohesionConnect,142:cohesionReplace"],
                    [30, "Thành phố thông minh Mát-xda", 144, "146:disagree"],
                    ["end", "Ôn tập cuối năm học", 148, "148:sentence,148:dash,148:polysemy,148:cohesionReplace"]
                ]
            ]
        }
    };

    const grade5 = {};
    for (const [subject, semesters] of Object.entries(grade5Lessons)) {
        grade5[subject] = {};
        for (const [semester, groups] of Object.entries(semesters)) {
            grade5[subject][semester] = groups.map((lessons, index) => ({
                topic: root.app.constants.topics['5'][subject][semester][index],
                lessons: lessons.map(([number, title, page, skills]) => ({
                    id: `g5-${subject}-${semester}-${typeof number === 'number' ? `b${String(number).padStart(2, '0')}` : number}`,
                    label: typeof number === 'number' ? `Bài ${number}. ${title}` : title,
                    page,
                    skills: skills.split(',').map(value => {
                        const [skillPage, key] = value.includes(':') ? value.split(':') : [page, value];
                        return { key, page: Number(skillPage) };
                    })
                }))
            }));
        }
    }
    root.app.constants.lessonCatalog['5'] = grade5;
    if (root.Grade1PracticeCatalog) {
        root.app.constants.lessonCatalog['1'] = root.Grade1PracticeCatalog.buildCatalog(root.app.constants.topics['1']);
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
