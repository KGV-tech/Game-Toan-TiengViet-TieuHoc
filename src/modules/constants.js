// D1: app.constants — dữ liệu chương trình học theo cấp lớp.
// Được tách khỏi main.js để giảm kích thước tệp monolith.
;(function (root) {
    if (!root.app) root.app = {};
    root.app.constants = {
        topics: {
            "1": {
                math: {
                    hk1: ['1. Các số từ 0 đến 10', '2. Làm quen với một số hình phẳng', '3. Phép cộng, phép trừ trong phạm vi 10', '4. Làm quen với một số hình khối', '5. Ôn tập Học kì 1'],
                    hk2: ['6. Các số đến 100', '7. Độ dài và Đo độ dài', '8. Phép cộng, phép trừ (không nhớ) trong phạm vi 100', '9. Thời gian. Giờ và lịch', '10. Ôn tập cuối năm']
                },
                vietnamese: {
                    hk1: ['Lớp 1 tập trung hoàn toàn vào việc học Âm, Vần, Chữ Cái'],
                    hk2: ['1. Tôi và các bạn', '2. Mái ấm gia đình', '3. Mái trường mến yêu', '4. Điều em cần biết', '5. Bài học từ cuộc sống', '6. Thiên nhiên kỳ thú', '7. Thế giới trong mắt em', '8. Đất nước và con người']
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
                }
            }
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
