;(function (root) {
    // Câu luyện viết lại theo chi tiết SGK. Số đầu mỗi mục là trang in, tập hai.
    // Mỗi dòng đọc gồm câu chứa {đáp án}, hai phương án nhiễu và câu hỏi.
    const reading = {
        4: [
            'Nam học {lớp 1}.|lớp 2|lớp 3|Nam học lớp mấy?',
            'Ngày đầu đến trường, Nam mặc {đồng phục}.|áo mưa|áo ngủ|Ngày đầu đi học, Nam mặc gì?',
            'Bây giờ Nam đã biết đọc {truyện tranh}.|bản đồ|thời khóa biểu|Bây giờ Nam đọc được gì?'
        ],
        8: [
            'Thỏ có hai tai {dài}.|ngắn|bé xíu|Tai thỏ có đặc điểm gì?',
            'Khi các bạn đi lạc, {thỏ} nghe được tiếng bố gọi.|sóc|nai|Ai nghe được tiếng bố gọi?',
            'Các bạn đi theo tiếng gọi và tìm được đường {về nhà}.|xuống hồ|lên đồi|Các bạn tìm được đường đi đâu?'
        ],
        12: [
            'Gió làm chiếc {chong chóng} quay.|quyển sách|cái bàn|Đồ chơi nào quay nhờ gió?',
            'Khi gió vắng, lá cây nằm {im}.|cao|xa|Lá cây ra sao khi vắng gió?',
            'Gió đẩy {sóng} lên cao.|cát|đá|Gió đẩy gì lên cao?'
        ],
        14: [
            'Nai và hoẵng cùng thi {chạy}.|bơi|nhảy dây|Nai và hoẵng thi môn gì?',
            'Hoẵng vấp phải một {hòn đá}.|gốc cây|bậc thềm|Hoẵng vấp phải vật gì?',
            'Thấy hoẵng ngã, nai dừng lại để {đỡ bạn}.|nghỉ trưa|uống nước|Nai dừng lại để làm gì?'
        ],
        18: [
            'Hôm nay là sinh nhật của {voi con}.|sóc nâu|gấu đen|Hôm nay là sinh nhật của ai?',
            'Voi con bị {ốm} vào ngày sinh nhật.|lạc|ngã|Chuyện gì xảy ra với voi con?',
            'Các bạn tới nhà để {chúc mừng} voi con.|rủ đi bơi|rủ đua xe|Các bạn tới nhà voi con làm gì?'
        ],
        24: [
            'Nam hồi hộp vì hôm ấy là ngày {đầu đi học}.|đi chơi núi|về quê|Vì sao Nam hồi hộp?',
            'Mẹ hôn nhẹ lên {bàn tay} của Nam.|mái tóc|bờ vai|Mẹ đặt nụ hôn ở đâu?',
            'Nghe lời mẹ, Nam thấy {ấm áp}.|đói bụng|buồn ngủ|Nam thấy thế nào khi được mẹ động viên?'
        ],
        28: [
            'Khi em khóc, anh phải {dỗ dành} em.|giành đồ với|quát mắng|Khi em khóc, anh làm gì?',
            'Có bánh ngon, anh chia cho em phần {hơn}.|nhỏ nhất|ít nhất|Anh chia cho em phần bánh thế nào?',
            'Có đồ chơi đẹp, anh {nhường} em chơi.|cấm|không cho|Anh làm gì khi có đồ chơi đẹp?'
        ],
        30: [
            'Bố mẹ cho Nam và Đức đi chơi {núi}.|biển|hồ|Gia đình đi chơi ở đâu?',
            'Mẹ chuẩn bị đồ cho cả nhà từ {hôm trước}.|tuần sau|hôm sau|Mẹ chuẩn bị đồ từ khi nào?',
            'Mẹ đem theo thuốc chống {côn trùng}.|đau răng|ho|Mẹ đem theo thuốc chống gì?'
        ],
        34: [
            'Bà bị {ốm}, bé ngồi bên bà.|lạc|ngã|Vì sao bà cần nghỉ?',
            'Bé dùng {quạt} để bà được mát.|đèn|chăn|Bé dùng gì để làm mát cho bà?',
            'Bé muốn bà {ngủ ngon}.|dậy sớm|đọc sách|Bé muốn bà thế nào?'
        ],
        36: [
            'Thấy mẹ mua nhiều đồ ăn, {Chi} hỏi mẹ.|Lan|Hà|Ai hỏi mẹ vì sao mua nhiều đồ ăn?',
            'Chi xem {lịch} để biết hôm nay là ngày gì.|bảng|tranh|Chi xem gì để biết ngày?',
            'Hôm ấy cả nhà liên hoan mừng ngày {Gia đình Việt Nam}.|Khai giảng|Trung thu|Cả nhà mừng ngày gì?'
        ],
        40: [
            'Trước ngõ nhà em có hàng {xoan}.|bàng|dừa|Cây gì mọc trước ngõ?',
            'Bên nhà, chim hót {lảnh lót}.|im ắng|nhỏ dần|Tiếng chim hót thế nào?',
            'Ngoài sân có {rạ} được phơi.|quần áo|ngô|Sân nhà phơi gì?'
        ],
        44: [
            'Trong ngày đầu đến trường, bạn nhỏ thấy cảnh vật {khác lạ}.|vắng vẻ|tối om|Cảnh vật có vẻ thế nào với bạn nhỏ?',
            'Bạn nhỏ đi học cùng {mẹ}.|anh|chị|Ai đi cùng bạn nhỏ?',
            'Ngày đầu tiên ấy là ngày bạn nhỏ tới {trường}.|chợ|bến xe|Bạn nhỏ đi đâu trong ngày đáng nhớ?'
        ],
        48: [
            'Hôm qua, {mẹ} dẫn bạn nhỏ đến lớp.|bố|bà|Hôm qua ai dẫn bạn nhỏ đi học?',
            'Hôm nay, bạn nhỏ đến lớp {một mình}.|cùng chị|cùng bố|Hôm nay bạn nhỏ đến lớp thế nào?',
            'Trường nhỏ nằm giữa {rừng cây}.|phố lớn|đồng muối|Trường nằm giữa đâu?'
        ],
        50: [
            'Cô giáo cho cả lớp {vẽ} điều mình thích.|hát|đọc thơ|Cô giáo cho lớp làm gì?',
            'Gia Huy thích vẽ {mèo máy}.|cây dừa|bông hoa|Gia Huy thích vẽ gì?',
            'Hà vẽ bông hoa có {bốn cánh}.|hai cánh|sáu cánh|Bông hoa của Hà có mấy cánh?'
        ],
        54: [
            'Bên lớp học có cây {bàng} đã lâu năm.|xoan|dừa|Cây gì mọc bên lớp học?',
            'Tán lá bàng giống một chiếc {ô} xanh.|áo|ghế|Tán lá bàng giống vật gì?',
            'Đến {cuối tuần}, lớp học vắng tiếng các bạn.|thứ Hai|giờ học|Lớp học vắng các bạn vào lúc nào?'
        ],
        56: [
            'Các bạn học sinh gọi trống trường là {bác trống}.|chú chuông|cô loa|Các bạn gọi trống trường là gì?',
            'Mặt trống có màu {nâu}.|tím|xanh|Mặt trống có màu gì?',
            'Học sinh đã thấy trống ở trường từ {lâu}.|hôm qua|sáng nay|Trống đã ở trường từ bao giờ?'
        ],
        60: [
            'Tiếng {trống} báo giờ ra chơi.|kèn|đàn|Âm thanh gì báo giờ ra chơi?',
            'Một nhóm bạn gái chơi {nhảy dây}.|cờ vua|thả diều|Các bạn gái chơi trò gì?',
            'Một nhóm bạn trai chơi {đá cầu}.|đá bóng|bắn bi|Các bạn trai chơi trò gì?'
        ],
        64: [
            'Mắt thường không nhìn thấy {vi trùng}.|ngón tay|xà phòng|Vật gì mắt thường không nhìn thấy?',
            'Khi chạm đồ vật, vi trùng có thể bám vào {tay}.|tóc|tai|Vi trùng có thể bám vào đâu khi em cầm đồ?',
            'Trước khi ăn, em nên {rửa tay}.|chơi bóng|xếp sách|Em nên làm gì trước bữa ăn?'
        ],
        68: [
            'Khi gặp người quen, em nên chủ động {chào}.|lảng đi|im lặng|Gặp người quen, em nên làm gì?',
            'Một lời chào có thể giúp em {kết bạn}.|mất bạn|giấu đồ|Lời chào giúp em làm gì?',
            'Bạn nhỏ chào bà bằng giọng {lễ phép}.|gắt gỏng|cáu kỉnh|Bạn nhỏ chào bà thế nào?'
        ],
        70: [
            'Các con vật ở nhà là đàn {dê con}.|thỏ con|vịt con|Đàn con vật nào ở nhà?',
            'Dê mẹ ra ngoài để {kiếm cỏ}.|hái táo|bắt cá|Dê mẹ đi đâu để làm gì?',
            'Con {sói} giả giọng mẹ để gọi đàn dê.|gà|nai|Con vật nào giả giọng dê mẹ?'
        ],
        74: [
            'Bố dẫn Nam và em tới {công viên}.|thư viện|bể bơi|Bố dẫn hai bạn nhỏ đi đâu?',
            'Công viên có rất {đông} người.|ít|vắng|Hôm đó công viên đông hay vắng?',
            'Bố dặn nếu lạc thì nhớ ra chỗ {cổng có lá cờ to}.|gốc cây|hồ nước|Bố dặn đến chỗ nào nếu bị lạc?'
        ],
        78: [
            'Đèn giao thông có {ba} màu.|hai|bốn|Đèn giao thông có mấy màu?',
            'Khi đèn đỏ, người đi đường phải {dừng lại}.|đi tiếp|đi nhanh|Đèn đỏ báo hiệu điều gì?',
            'Đèn {xanh} báo hiệu được đi.|đỏ|vàng|Đèn màu nào báo hiệu được đi?'
        ],
        84: [
            'Kiến không may rơi xuống {nước}.|cát|hố đất|Kiến rơi xuống đâu?',
            '{Bồ câu} nghe tiếng kêu cứu của kiến.|Chim sẻ|Chim sâu|Con chim nào nghe kiến kêu cứu?',
            'Kiến bám vào {chiếc lá} để lên bờ.|viên đá|bông hoa|Kiến bám vào vật gì?'
        ],
        88: [
            'Rễ cây nằm dưới {đất}.|mây|lá|Rễ cây nằm ở đâu?',
            'Trên cành, {hoa} khoe màu sắc.|rễ|đất|Cái gì khoe sắc trên cành?',
            'Rễ giúp cho cành có hoa và {lá}.|đá|cát|Ngoài hoa, cành còn có gì?'
        ],
        90: [
            'Sóc đang chuyền trên {cành cây}.|mặt hồ|bãi cát|Sóc chuyền ở đâu?',
            'Sóc trượt chân và rơi trúng đầu {sói}.|nai|gà|Sóc rơi trúng đầu con gì?',
            'Khi sóc rơi xuống, sói đang {ngủ}.|ăn|chạy|Lúc ấy sói đang làm gì?'
        ],
        94: [
            'Chú bé thường chăn cừu ở gần {núi}.|biển|phố|Chú bé thường chăn cừu ở gần đâu?',
            'Lúc đầu chú kêu có sói để {đùa}.|báo tin thật|gọi cừu về|Lúc đầu, vì sao chú kêu có sói?',
            'Khi nghe chú kêu, dân làng tưởng có {sói}.|hổ|voi|Dân làng tưởng con gì xuất hiện?'
        ],
        98: [
            'Gấu con đứng gần vách {núi}.|tường lớp|sân nhà|Gấu con đứng gần đâu?',
            'Khi gấu gọi, âm thanh {vang lại}.|mất hẳn|biến thành nhạc|Tiếng gọi của gấu ra sao?',
            'Âm thanh nghe lặp lại gọi là {tiếng vọng}.|tiếng hát|tiếng trống|Âm thanh nghe lặp lại gọi là gì?'
        ],
        104: [
            '{Hải âu} là loài chim thường sống ở biển.|Chim sẻ|Gà trống|Loài chim nào được nhắc đến?',
            'Cánh hải âu {lớn} nên nó có thể bay xa.|bé xíu|rất ngắn|Cánh hải âu thế nào?',
            'Chân hải âu có màng giúp nó {bơi}.|leo cây|đào đất|Màng ở chân giúp hải âu làm gì?'
        ],
        108: [
            'Sau cơn mưa, nắng lên và {cầu vồng} hiện ra.|trăng tròn|ngôi sao|Sau mưa, nắng lên thì có gì hiện ra?',
            'Cầu vồng trong bài có {bảy} màu.|ba|năm|Cầu vồng có mấy màu?',
            'Bài thơ ví màu lục với màu {lá}.|mây|cát|Bài thơ ví màu lục với màu gì?'
        ],
        110: [
            'Hổ thường sống trong {rừng}.|ao|vườn rau|Hổ sống ở đâu?',
            'Trên lông hổ có những {vằn đen}.|đốm xanh|sọc trắng|Lông hổ có dấu gì?',
            'Móng vuốt hổ rất {sắc}.|mềm|cùn|Móng vuốt hổ thế nào?'
        ],
        114: [
            'Các con vật trong rừng tham gia một {cuộc thi}.|buổi học|chuyến đi biển|Các con vật tham gia việc gì?',
            'Cuộc thi để các con vật khoe {tài năng}.|quần áo|sách vở|Các con vật khoe điều gì?',
            'Nơi tổ chức cuộc thi là {rừng xanh}.|sân trường|bãi biển|Cuộc thi diễn ra ở đâu?'
        ],
        118: [
            'Trời nổi gió to làm cây {liễu} lắc lư.|dừa|xoan|Cây nào lắc lư trong gió?',
            'Nam lo cây sẽ bị {gãy}.|khô|rụng hết lá|Nam lo điều gì sẽ xảy ra?',
            'Mẹ bảo Nam cứ {yên tâm}.|chạy trốn|khóc to|Mẹ bảo Nam thế nào?'
        ],
        124: [
            'Bé bắt gặp tia nắng vào {buổi sáng}.|buổi tối|nửa đêm|Bé bắt gặp tia nắng lúc nào?',
            'Tia nắng hiện trên {bàn học}.|mái ngói|bàn ăn|Tia nắng hiện trên chiếc bàn nào?',
            'Bé nhìn thấy tia nắng trong {lòng tay}.|túi áo|chiếc cặp|Bé nhìn thấy nắng ở đâu trên bàn tay?'
        ],
        126: [
            'Bé gặp ông mặt trời trong {giấc mơ}.|lớp học|nhà bếp|Bé gặp ông mặt trời ở đâu?',
            'Mặt trời mang túi đầy {hoa nắng}.|kẹo|sao giấy|Túi của mặt trời đầy gì?',
            'Bé đi qua một thảo nguyên {xanh}.|trắng|tím|Thảo nguyên có màu gì?'
        ],
        128: [
            'Ngày mới bắt đầu vào {buổi sáng}.|buổi tối|nửa đêm|Ngày mới bắt đầu vào lúc nào?',
            'Trên trời, mặt trời chiếu {nắng}.|mưa|tuyết|Mặt trời chiếu gì?',
            'Những tia nắng lan {khắp nơi}.|chỉ trong nhà|chỉ ở cổng|Tia nắng lan đến đâu?'
        ],
        132: [
            'Bạn nhỏ đem những điều thắc mắc hỏi {mẹ}.|bố|bà|Bạn nhỏ hỏi ai?',
            'Bạn nhỏ hỏi vì sao bầu trời lại {xanh}.|đỏ|vàng|Bạn nhỏ thắc mắc bầu trời có màu gì?',
            'Bạn nhỏ tưởng tượng chú Cuội ở trên {trăng}.|núi|mây|Bạn nhỏ nghĩ chú Cuội ở đâu?'
        ],
        134: [
            'Ông kể ngày xưa ở quê có nhiều {cò}.|gà|vịt|Ngày xưa ở quê có nhiều con gì?',
            'Từng đàn cò có màu {trắng}.|đen|nâu|Đàn cò có màu gì?',
            'Cò mò tôm, bắt cá ở {ao hồ}.|sân nhà|đường phố|Cò tìm tôm, cá ở đâu?'
        ],
        138: [
            'Cảnh vật yên ả vào buổi {trưa hè}.|sáng đông|chiều thu|Bài thơ tả cảnh vào lúc nào?',
            'Sau buổi cày, bò có thể {nghỉ ngơi}.|bơi lội|chạy thi|Sau khi cày, bò làm gì?',
            'Con bướm bay bên đôi cánh {nắng}.|mưa|tuyết|Bài thơ gợi hình ảnh đôi cánh gì bên bướm?'
        ],
        140: [
            'Khi mới hé, hoa phượng còn {lấm tấm}.|rơi hết|khô héo|Khi mới hé, hoa phượng thế nào?',
            'Hoa phượng nở rực màu {đỏ}.|trắng|tím|Hoa phượng trong bài có màu gì?',
            'Bạn nhỏ ngạc nhiên vì hoa nở rất {nhanh}.|muộn|ít|Bạn nhỏ ngạc nhiên vì điều gì?'
        ],
        144: [
            'Vinh dùng quả {bưởi} để làm bóng chơi.|cam|xoài|Vinh dùng quả gì làm bóng?',
            'Đang chơi thì quả bóng lăn xuống {hố}.|ao|giếng|Quả bóng lăn xuống đâu?',
            'Cái hố hẹp và {sâu} nên các bạn khó lấy bóng.|nông|rộng|Cái hố có đặc điểm gì khiến các bạn khó lấy bóng?'
        ],
        148: [
            'Nghe chuông báo cháy, lính cứu hoả nhanh chóng mặc {quần áo chữa cháy}.|áo mưa|đồ bơi|Lính cứu hoả mặc gì?',
            'Các xe cứu hoả trong bài có màu {đỏ}.|trắng|xanh|Xe cứu hoả trong bài màu gì?',
            'Lính cứu hoả dùng vòi phun {nước} để dập lửa.|cát|dầu|Vòi phun phun gì để dập lửa?'
        ],
        152: [
            'Người lái tàu qua biển làm nghề {thuỷ thủ}.|đầu bếp|thợ may|Nghề nào gắn với việc lái tàu trên biển?',
            'Người làm bánh ngon là {đầu bếp}.|thợ xây|thuỷ thủ|Ai làm bánh ngon?',
            'Bạn nhỏ nhắc đến việc gieo {hạt}.|đá|lá|Bạn nhỏ nhắc đến việc gieo gì?'
        ],
        154: [
            'Những ruộng bậc thang trong bài nằm ở {Sa Pa}.|Đà Nẵng|Cà Mau|Ruộng bậc thang trong bài ở đâu?',
            'Từ xa, ruộng giống các {bậc thang}.|mái nhà|cánh buồm|Ruộng nhìn từ xa giống gì?',
            'Mùa lúa chín, ruộng phủ màu {vàng}.|xám|tím|Mùa lúa chín ruộng có màu gì?'
        ],
        156: [
            'Ăn cơm, ta nhớ người {cày ruộng}.|lái tàu|xây cầu|Ăn cơm, ta nhớ đến ai?',
            'Qua sông bằng đò, ta nhớ người {chèo đò}.|quét lớp|bán bánh|Sang đò, ta nhớ đến ai?',
            'Đứng mát dưới cây, ta nhớ người {trồng cây}.|may áo|dệt chiếu|Đứng mát dưới cây, ta nhớ ai?'
        ],
        158: [
            'Ra biển chơi, các bạn có thể nhặt {vỏ sò}.|lá bàng|hạt ngô|Ở biển, các bạn có thể nhặt gì?',
            'Các bạn có thể xây lâu đài bằng {cát}.|giấy|gỗ|Các bạn xây lâu đài bằng gì?',
            'Ở Mũi Né, khách có thể ngắm các {đồi cát}.|rừng thông|ruộng bậc thang|Mũi Né có cảnh gì được nhắc đến?'
        ],
        168: [
            'Bạn nhỏ thấy mình đã {tiến bộ} trong năm học.|đi xa|lớn nhanh|Bạn nhỏ nhận thấy điều gì về việc học?',
            'Bạn muốn cảm ơn {cô giáo} vì đã dạy dỗ mình.|bác bảo vệ|chú lái xe|Bạn cảm ơn ai vì đã dạy mình?',
            'Bạn cảm ơn {bố mẹ} vì luôn yêu thương và lắng nghe mình.|các bạn|hàng xóm|Ai yêu thương và lắng nghe bạn ở nhà?'
        ],
        170: [
            'Bài thơ gửi lời chào đến {lớp Một}.|lớp Hai|lớp Ba|Bạn nhỏ chào lớp mấy?',
            'Bạn nhỏ chào bảng và {cửa sổ}.|cây bàng|cầu trượt|Ngoài bảng, bạn nhỏ chào gì trong lớp?',
            'Bạn nhỏ hứa làm theo lời {cô dạy}.|bạn kể|bà hát|Bạn nhỏ hứa làm theo lời ai?'
        ]
    };

    // Cụm từ giữ ngữ cảnh để phương án đúng có thể xác định ngay trong câu.
    const spelling = {
        4: ['học □inh|s|x', 'đồng p□ục|h|x'],
        8: ['□ú thỏ|ch|tr', 'đôi t□i|a|ă'],
        12: ['chong □óng quay|ch|tr', 'cánh c□im|h|x'],
        14: ['□ải thưởng|gi|d', 'tình b□n|ạ|ặ'],
        18: ['□inh nhật|s|x', '□úc mừng|ch|tr'],
        24: ['nụ h□n|ô|ơ', 'bàn t□y|a|â'],
        28: ['□ỗ dành|d|gi', '□ường đồ chơi|nh|ng'],
        30: ['đi □ơi núi|ch|tr', '□uẩn bị đồ|ch|tr'],
        34: ['bà □ủ ngon|ng|nh', 'chiếc q□ạt|u|o'],
        36: ['xem □ịch|l|n', '□ia đình|gi|d'],
        40: ['cây □oan trước ngõ|x|s', 'tiếng chim lảnh □ót|l|n'],
        44: ['đến □ường học|tr|ch', 'ngày đ□u đi học|ầ|à'],
        48: ['rừng c□y|â|a', 'cô □áo|gi|d'],
        50: ['yêu □ương|th|tr', 'bông hoa bốn c□nh|á|ấ'],
        54: ['cây b□ng|à|ằ', 'tán lá □anh|x|s'],
        56: ['bác □ống trường|tr|ch', 'mặt trống màu n□u|â|a'],
        60: ['giờ □a chơi|r|d', '□ảy dây|nh|ng'],
        64: ['□ửa tay sạch|r|d', 'vi □ùng|tr|ch'],
        68: ['lời □ào|ch|tr', '□ễ phép|l|n'],
        70: ['con □ê ăn cỏ|d|gi', 'con □ói|s|x'],
        74: ['□ông viên|c|k', '□á cờ ở cổng|l|n'],
        78: ['đèn □ao thông|gi|d', 'đèn □anh|x|s'],
        84: ['chim bồ c□u|â|a', 'con □iến nhỏ|k|c'],
        88: ['□ễ cây|r|d', 'bông h□a|o|u'],
        90: ['con □óc chuyền cành|s|x', '□ành cây|c|k'],
        94: ['□ăn cừu|ch|tr', '□ân làng|d|gi'],
        98: ['tiếng v□ng lại|ọ|ô', 'vách n□i|ú|ũ'],
        104: ['chim hải □u|â|a', 'b□ển cả|i|y'],
        108: ['cầu v□ng|ồ|ò', 'bảy □ắc màu|s|x'],
        110: ['□úa tể rừng xanh|ch|tr', 'vằn đ□n|e|ê'],
        114: ['cuộc □i tài năng|th|tr', '□ừng xanh|r|d'],
        118: ['cây li□u|ễ|ể', '□ẻo dai|d|gi'],
        124: ['tia n□ng|ắ|á', 'b□n học|à|ằ'],
        126: ['□ấc mơ|gi|d', 'thảo ng□yên|u|o'],
        128: ['ngày m□i|ớ|ó', 'tia □ắng|n|l'],
        132: ['chú □uội|C|K', 'bầu □ời|tr|ch'],
        134: ['đàn cò □ắng|tr|ch', '□ánh cò|c|k'],
        138: ['buổi □ưa hè|tr|ch', 'yên □ả|ả|ã'],
        140: ['hoa ph□ợng|ư|u', 'nở □ực đỏ|r|d'],
        144: ['quả b□ởi|ư|u', 'thông □inh|m|n'],
        148: ['xe □ứu hoả|c|k', 'phun n□ớc|ư|u'],
        152: ['thuỷ □ủ|th|tr', '□ieo hạt|g|ng'],
        154: ['bậc □ang|th|tr', 'mùa lúa □ín|ch|tr'],
        156: ['□ớ ơn|nh|ng', '□èo đò|ch|tr'],
        158: ['vỏ □ò|s|x', 'lâu đài c□t|á|ắ'],
        168: ['□ảm ơn|c|k', 'tiến b□|ộ|ọ'],
        170: ['gửi lời □ào|ch|tr', 'cửa □ổ|s|x']
    };
    const { choice } = root.Grade1MathPractice;
    function readingQuestions(page) {
        const details = reading[page].map(row => {
            const [pattern, firstWrong, secondWrong, prompt] = row.split('|');
            const answer = pattern.match(/\{([^}]+)\}/)[1];
            return { pattern, answer, sentence: pattern.replace(/[{}]/g, ''), wrong: [firstWrong, secondWrong], prompt };
        });
        const passage = details.map(item => item.sentence).join(' ');
        return [
            ...details.map(({ answer, sentence, wrong, prompt }) => ({
                skill: 'read',
                ...choice(`${passage}<br><b>${prompt}</b>`, answer, wrong, sentence)
            })),
            ...details.map(({ answer, pattern, wrong, sentence }) => ({
                skill: 'words',
                ...choice(`Chọn từ ngữ còn thiếu.<br>${pattern.replace(/\{[^}]+\}/, '□')}`, answer, wrong, sentence)
            })),
            ...details.map(({ sentence }) => ({
                skill: 'capital',
                ...choice(`Chọn chữ viết hoa để bắt đầu câu.<br>□${sentence.slice(1)}`, sentence[0],
                    [sentence[0].toLocaleLowerCase('vi-VN')], `Đầu câu viết hoa: ${sentence}`)
            })),
            ...spelling[page].map(row => {
                const [phrase, answer, wrong] = row.split('|');
                return {
                    skill: 'spelling',
                    ...choice(`Chọn phần còn thiếu để viết đúng.<br>${phrase}`, answer, [wrong], `Viết đúng: ${phrase.replace('□', answer)}.`)
                };
            })
        ].map(question => ({ ...question, contentPage: page }));
    }

    function variants(lesson, chapterLessons) {
        if (!lesson.review) return readingQuestions(lesson.page);
        const sources = chapterLessons.filter(item => item.page < lesson.page && !item.review);
        const skills = ['read', 'words', 'spelling', 'capital'];
        return sources.flatMap((item, index) => {
            const practiced = skills.filter((_, skillIndex) => skillIndex !== index % skills.length);
            return readingQuestions(item.page).filter(question => practiced.includes(question.skill));
        });
    }
    root.Grade1VietnamesePractice = { variants };
})(typeof globalThis !== 'undefined' ? globalThis : this);
