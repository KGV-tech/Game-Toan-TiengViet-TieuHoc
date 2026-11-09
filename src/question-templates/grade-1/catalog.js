;(function (root) {
    const math = [
        [1, 8, 'Các số 0, 1, 2, 3, 4, 5', 'count5 read5'],
        [1, 14, 'Các số 6, 7, 8, 9, 10', 'count10 read10'],
        [1, 20, 'Nhiều hơn, ít hơn, bằng nhau', 'groups'],
        [1, 24, 'So sánh số', 'compare10 order10'],
        [1, 32, 'Mấy và mấy', 'split10'],
        [1, 38, 'Luyện tập chung', 'count5 count10 compare10 order10 split10'],
        [2, 46, 'Hình vuông, hình tròn, hình tam giác, hình chữ nhật', 'shape countShapes'],
        [2, 50, 'Thực hành lắp ghép, xếp hình', 'pattern pieces'],
        [2, 54, 'Luyện tập chung', 'shape countShapes pattern pieces'],
        [3, 56, 'Phép cộng trong phạm vi 10', 'add10 addStory10'],
        [3, 68, 'Phép trừ trong phạm vi 10', 'sub10 subStory10'],
        [3, 80, 'Bảng cộng, bảng trừ trong phạm vi 10', 'add10 sub10'],
        [3, 86, 'Luyện tập chung', 'add10 sub10 addStory10 subStory10'],
        [4, 92, 'Khối lập phương, khối hộp chữ nhật', 'solid'],
        [4, 96, 'Vị trí, định hướng trong không gian', 'position'],
        [4, 100, 'Luyện tập chung', 'solid position'],
        [5, 102, 'Ôn tập các số trong phạm vi 10', 'count5 count10 order10 split10'],
        [5, 106, 'Ôn tập phép cộng, phép trừ trong phạm vi 10', 'add10 sub10 addStory10 subStory10'],
        [5, 110, 'Ôn tập hình học', 'shape countShapes solid pattern'],
        [5, 112, 'Ôn tập chung', 'count10 order10 add10 sub10 pattern'],
        [6, 4, 'Số có hai chữ số', 'place read100'],
        [6, 16, 'So sánh số có hai chữ số', 'compare100 order100'],
        [6, 22, 'Bảng các số từ 1 đến 100', 'sequence100'],
        [6, 24, 'Luyện tập chung', 'place compare100 sequence100 read100'],
        [7, 28, 'Dài hơn, ngắn hơn', 'compareLength'],
        [7, 32, 'Đơn vị đo độ dài', 'measureUnits ruler'],
        [7, 36, 'Thực hành ước lượng và đo độ dài', 'estimate ruler'],
        [7, 40, 'Luyện tập chung', 'compareLength ruler estimate'],
        [8, 44, 'Phép cộng số có hai chữ số với số có một chữ số', 'add21'],
        [8, 48, 'Phép cộng số có hai chữ số với số có hai chữ số', 'add22 addStory100'],
        [8, 52, 'Phép trừ số có hai chữ số cho số có một chữ số', 'sub21'],
        [8, 58, 'Phép trừ số có hai chữ số cho số có hai chữ số', 'sub22 subStory100'],
        [8, 64, 'Luyện tập chung', 'add21 add22 sub21 sub22 addStory100 subStory100'],
        [9, 72, 'Xem giờ đúng trên đồng hồ', 'clock'],
        [9, 76, 'Các ngày trong tuần', 'week'],
        [9, 80, 'Thực hành xem lịch và giờ', 'calendar clock'],
        [9, 84, 'Luyện tập chung', 'calendar clock week'],
        [10, 88, 'Ôn tập các số và phép tính trong phạm vi 10', 'count10 order10 add10 sub10'],
        [10, 94, 'Ôn tập các số và phép tính trong phạm vi 100', 'place compare100 add22 sub22'],
        [10, 100, 'Ôn tập hình học và đo lường', 'shape solid ruler compareLength estimate clock calendar'],
        [10, 104, 'Ôn tập chung', 'read100 order100 add22 sub22 addStory100 subStory100 clock calendar ruler countShapes']
    ];
    const vietnameseTopics = [
        '1. Tôi và các bạn', '2. Mái ấm gia đình', '3. Mái trường mến yêu',
        '4. Điều em cần biết', '5. Bài học từ cuộc sống', '6. Thiên nhiên kỳ thú',
        '7. Thế giới trong mắt em', '8. Đất nước và con người', 'Ôn tập và đánh giá'
    ];
    const vietnamese = [
        [[4, 'Tôi là học sinh lớp 1'], [8, 'Đôi tai xấu xí'], [12, 'Bạn của gió'], [14, 'Giải thưởng tình bạn'], [18, 'Sinh nhật của voi con'], [22]],
        [[24, 'Nụ hôn trên bàn tay'], [28, 'Làm anh'], [30, 'Cả nhà đi chơi núi'], [34, 'Quạt cho bà ngủ'], [36, 'Bữa cơm gia đình'], [40, 'Ngôi nhà'], [42]],
        [[44, 'Tôi đi học'], [48, 'Đi học'], [50, 'Hoa yêu thương'], [54, 'Cây bàng và lớp học'], [56, 'Bác trống trường'], [60, 'Giờ ra chơi'], [62]],
        [[64, 'Rửa tay trước khi ăn'], [68, 'Lời chào đi trước'], [70, 'Khi mẹ vắng nhà'], [74, 'Nếu không may bị lạc'], [78, 'Đèn giao thông'], [82]],
        [[84, 'Kiến và chim bồ câu'], [88, 'Câu chuyện của rễ'], [90, 'Câu hỏi của sói'], [94, 'Chú bé chăn cừu'], [98, 'Tiếng vọng của núi'], [102]],
        [[104, 'Loài chim của biển cả'], [108, 'Bảy sắc cầu vồng'], [110, 'Chúa tể rừng xanh'], [114, 'Cuộc thi tài năng rừng xanh'], [118, 'Cây liễu dẻo dai'], [122]],
        [[124, 'Tia nắng đi đâu?'], [126, 'Trong giấc mơ buổi sáng'], [128, 'Ngày mới bắt đầu'], [132, 'Hỏi mẹ'], [134, 'Những cánh cò'], [138, 'Buổi trưa hè'], [140, 'Hoa phượng'], [142]],
        [[144, 'Cậu bé thông minh'], [148, 'Lính cứu hoả'], [152, 'Lớn lên bạn làm gì?'], [154, 'Ruộng bậc thang ở Sa Pa'], [156, 'Nhớ ơn'], [158, 'Du lịch biển Việt Nam'], [162]],
        [[164, 'Ôn tập'], [168, 'Cảm ơn'], [170, 'Gửi lời chào lớp Một']]
    ];
    const pad = number => String(number).padStart(2, '0');
    function buildCatalog(topics) {
        const mathEntries = semester => topics.math[semester].map(topic => ({
            topic,
            lessons: math.flatMap(([chapter, page, title, skills], index) => Number.parseInt(topic, 10) === chapter
                ? [{ id: `g1-math-${semester}-b${pad(index + 1)}`, label: `Bài ${index + 1}. ${title}`, page, skills: skills.split(' ') }]
                : [])
        }));
        return {
            math: { hk1: mathEntries('hk1'), hk2: mathEntries('hk2') },
            vietnamese: {
                hk1: [],
                hk2: vietnamese.map((rows, chapterIndex) => ({
                    topic: vietnameseTopics[chapterIndex],
                    lessons: rows.map(([page, title], index) => ({
                        id: `g1-vietnamese-hk2-c${pad(chapterIndex + 1)}-${title ? `b${pad(index + 1)}` : 'review'}`,
                        label: title ? `Bài ${index + 1}. ${title}` : 'Ôn tập',
                        page,
                        review: !title || page === 164
                    }))
                }))
            }
        };
    }

    root.Grade1PracticeCatalog = { buildCatalog, vietnameseTopics };
})(typeof globalThis !== 'undefined' ? globalThis : this);
