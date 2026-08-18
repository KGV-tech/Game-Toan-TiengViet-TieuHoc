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
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
