;(function (root) {
    const skills = {};
    const context = (sentence, question) => `“${sentence}”<br>${question}`;
    const add = (key, name, rows) => { skills[key] = [name, rows]; };
    const parse = data => data.trim().split('\n').map(row => row.split('|'));
    const wordChoice = (key, name, question, reason, data) => add(key, name, parse(data).map(([sentence, answer, ...wrong]) =>
        [context(sentence, question), answer, wrong, reason(answer)]));
    const classify = (key, name, question, labels, data) => add(key, name, parse(data).map(([sentence, index, explanation]) =>
        [context(sentence, question), labels[Number(index)], labels.filter((_, n) => n !== Number(index)), explanation]));

    wordChoice('wordClass', 'Nhận biết danh từ, động từ, tính từ', 'Từ nào thuộc từ loại được yêu cầu?', answer => `“${answer}” thuộc từ loại được nêu trong đề.`, `
Tìm danh từ trong “Gió thổi nhẹ.”|Gió|thổi|nhẹ
Tìm động từ trong “Gió thổi mạnh.”|thổi|Gió|mạnh
Tìm tính từ trong “Bông hoa nhỏ nở sớm.”|nhỏ|hoa|nở
Tìm động từ trong “Đàn chim bay qua đồi.”|bay|chim|đồi
Tìm danh từ trong “Bé nhặt sỏi.”|sỏi|nhặt
Tìm động từ trong “Mai cắt giấy đỏ.”|cắt|giấy|đỏ
Tìm tính từ trong “Cánh diều đỏ bay lên.”|đỏ|diều|bay
Tìm danh từ trong “Những lá xanh rung rinh.”|lá|xanh|rung rinh
Tìm động từ trong “Nắng chiếu xuống sông.”|chiếu|Nắng|sông
Tìm tính từ trong “Dòng suối trong veo uốn quanh bản.”|trong veo|suối|uốn
Tìm danh từ trong “Mây trắng trôi.”|Mây|trắng|trôi
Tìm tính từ trong “Bàn gỗ rộng kê gần cửa.”|rộng|bàn|kê
    `);
    classify('pronoun', 'Phân loại đại từ', 'Từ ngữ trong ngoặc vuông thuộc loại đại từ nào?', ['Đại từ xưng hô', 'Đại từ nghi vấn', 'Đại từ thay thế'], `
[Tôi] sẽ trồng thêm một cây ở góc sân.|0|“Tôi” chỉ người đang nói.
[Chúng em] xin phép cô xuống thư viện.|0|“Chúng em” chỉ nhóm học sinh đang nói.
[Tớ] đã đọc xong truyện này.|0|“Tớ” dùng để người nói tự xưng.
[Ai] đã để quên chiếc mũ trên ghế?|1|“Ai” dùng để hỏi về người.
Em muốn làm [gì] vào cuối tuần?|1|“Gì” dùng để hỏi về việc chưa xác định.
Nhóm mình sẽ họp ở [đâu]?|1|“Đâu” dùng để hỏi về nơi chốn.
Sân hôm qua ướt. Hôm nay sân cũng [vậy].|2|“Vậy” thay cho đặc điểm ướt.
Lan thích vẽ, còn Mai cũng [thế].|2|“Thế” thay cho việc thích vẽ.
Bảo xếp sách rất ngay ngắn. Hãy xếp như [vậy].|2|“Vậy” thay cho cách xếp sách ngay ngắn.
[Bao nhiêu] bạn sẽ dự buổi đọc sách?|1|“Bao nhiêu” dùng để hỏi về số lượng.
[Chúng tôi] đang chăm sóc vườn cây.|0|“Chúng tôi” chỉ nhóm người đang nói.
Khôi đã xin lỗi. Làm [thế] là đúng.|2|“Thế” thay cho việc Khôi xin lỗi.
    `);
    wordChoice('synonym', 'Chọn từ đồng nghĩa theo ngữ cảnh', 'Chọn từ ngữ có thể thay phần trong ngoặc vuông mà vẫn giữ nghĩa.', answer => `“${answer}” có nghĩa giống hoặc gần với từ ngữ cần thay trong câu này.`, `
Các bạn [chăm chỉ] tập luyện mỗi chiều.|siêng năng|chậm chạp|vội vàng|rụt rè
Dòng suối [trong vắt] giữa rừng.|trong veo|đục ngầu|xanh thẳm|mênh mông
Mai [dũng cảm] đứng ra bảo vệ bạn.|gan dạ|nóng nảy|nhút nhát|lặng lẽ
Chiếc thuyền [bé nhỏ] nằm bên bến.|nhỏ bé|to lớn|dài dằng dặc|cao vút
Tán cây che bóng cho con đường [rộng].|rộng rãi|chật hẹp|thấp|quanh co
Bà căn dặn em phải thật [cẩn thận].|thận trọng|bất cẩn|nhanh nhẹn|thản nhiên
Mặt hồ [yên tĩnh] lúc sớm mai.|tĩnh lặng|náo nhiệt|lấp lánh|rộng lớn
Chiếc áo đã [cũ] nhưng vẫn sạch sẽ.|không còn mới|mới tinh|sặc sỡ|ngắn
Bạn ấy rất [vui] khi gặp lại cô giáo.|vui mừng|buồn rầu|lo lắng|thờ ơ
Con đường [quanh co] men theo sườn núi.|uốn khúc|thẳng tắp|gập ghềnh|trơn trượt
Bà kể bằng giọng nói [hiền hậu].|hiền từ|lạnh lùng|hung dữ|hốt hoảng
Cả lớp [hăng hái] tham gia trồng cây.|nhiệt tình|miễn cưỡng|chậm chạp|phân vân
    `);
    classify('polysemy', 'Nghĩa gốc và nghĩa chuyển', 'Từ trong ngoặc vuông dùng theo nghĩa nào?', ['Nghĩa gốc', 'Nghĩa chuyển'], `
Em bé chạy [chân] trần trên cát.|0|“Chân” chỉ bộ phận cơ thể dùng để đứng, đi.
Chiếc bàn bị gãy một [chân].|1|“Chân” chỉ bộ phận đỡ mặt bàn.
Lá cờ bay dưới [chân] núi.|1|“Chân” chỉ phần thấp nhất của ngọn núi.
Bạn ấy nhắm [mắt] để nghe nhạc.|0|“Mắt” chỉ cơ quan dùng để nhìn.
Mẹ xem từng [mắt] lưới.|1|“Mắt” chỉ ô nhỏ của tấm lưới.
Bé súc [miệng] bằng nước sạch.|0|“Miệng” chỉ bộ phận dùng để ăn, nói.
Chiếc bình có [miệng] tròn.|1|“Miệng” chỉ phần mở ở trên của chiếc bình.
Tóc em bé còn ướt trên [đầu].|0|“Đầu” chỉ phần cơ thể ở trên cổ.
Ở [đầu] ngõ có một cây khế.|1|“Đầu” chỉ phần bắt đầu của ngõ.
[Tay] mẹ đặt trên vai em.|0|“Tay” chỉ bộ phận cơ thể dùng để cầm, nắm.
Chiếc ghế có [tay] vịn bằng gỗ.|1|“Tay” chỉ bộ phận để đặt cánh tay.
[Lưng] em thẳng khi ngồi học.|0|“Lưng” chỉ phần sau của thân người.
    `);
    wordChoice('dictionary', 'Sử dụng từ điển', 'Em nên chọn cách tra cứu nào?', answer => `“${answer}” phù hợp với thông tin cần tra cứu.`, `
Cần tra nghĩa của “hải âu”.|Dùng từ điển tiếng Việt|Mở tập bản đồ|Xem lịch để bàn
Cần biết “giành” và “dành” viết thế nào.|Dùng từ điển chính tả|Dùng từ điển địa danh|Xem bảng thời khoá biểu
Cần biết cách nói “thư viện” bằng tiếng Anh.|Dùng từ điển Việt – Anh|Dùng từ điển địa danh|Mở tập bản đồ
Muốn tìm nghĩa của “sơ suất”.|Tra mục từ “sơ suất”|Tra mục từ “thành công”|Tra mục từ “suôn sẻ”
Muốn biết “yên ắng” được dùng như thế nào trong câu.|Đọc ví dụ ở mục từ “yên ắng”|Đọc mục từ kế trước|Đếm số chữ cái trong mục từ
Tra từ “bình minh” theo chữ cái đầu.|Tìm phần chữ B|Tìm phần chữ M|Tìm phần chữ P
Tra từ “tự học” theo chữ cái đầu.|Tìm phần chữ T|Tìm phần chữ H|Tìm phần chữ C
Muốn biết “chăm chỉ” thuộc từ loại nào.|Đọc nhãn từ loại ở mục từ “chăm chỉ”|Đọc tên người biên soạn|Đọc số trang ghi ở cuối sách
Tra “đường” trong câu “Bé pha nước đường.”|Chọn nghĩa chỉ chất có vị ngọt|Chọn nghĩa chỉ lối đi|Chọn nghĩa chỉ đường kẻ
Tra “chín” trong câu “Quả xoài đã chín.”|Chọn nghĩa chỉ quả đã đến độ ăn được|Chọn nghĩa chỉ số đứng sau số tám|Chọn nghĩa chỉ cách suy nghĩ kĩ
Tra “sáng” trong câu “Đèn sáng suốt đêm.”|Chọn nghĩa chỉ có ánh sáng|Chọn nghĩa chỉ buổi đầu ngày|Chọn nghĩa chỉ sự nhanh trí
Không thấy “trong veo” khi mở phần chữ V.|Quay lại tra ở phần chữ T|Chuyển sang tra phần chữ E|Tra ở cuối phần chữ V
    `);
    classify('dash', 'Công dụng của dấu gạch ngang', 'Dấu gạch ngang được dùng để làm gì?', ['Đánh dấu lời đối thoại', 'Đánh dấu bộ phận chú thích', 'Đánh dấu các ý liệt kê', 'Nối từ ngữ trong một liên danh'], `
– Ngày mai cậu có đi hội sách không?|0|Dấu gạch ngang đầu dòng mở lời nói trực tiếp.
– Cháu cảm ơn bác ạ!|0|Dấu gạch ngang đầu dòng mở lời nói trực tiếp.
– Mẹ chờ con với!|0|Dấu gạch ngang đầu dòng mở lời nói trực tiếp.
Hội đọc sách – hoạt động được mong đợi nhất – sẽ mở cửa sáng mai.|1|Phần giữa hai dấu bổ sung lời chú thích.
Bác Tư – người trồng nhiều hoa nhất xóm – đang tưới cây.|1|Phần giữa hai dấu bổ sung lời chú thích.
Hoa phượng – loài hoa quen thuộc của tuổi học trò – đã nở.|1|Phần giữa hai dấu bổ sung lời chú thích.
Các việc cần làm:<br>– Nhặt rác.<br>– Tưới cây.|2|Mỗi dấu đầu dòng mở một mục trong danh sách.
Dụng cụ cần chuẩn bị:<br>– Kéo.<br>– Giấy màu.|2|Mỗi dấu đầu dòng mở một mục trong danh sách.
Sách có hai phần:<br>– Truyện ngắn.<br>– Thơ.|2|Mỗi dấu đầu dòng mở một mục trong danh sách.
Đội Việt Nam – Lào cùng tham gia buổi giao lưu.|3|Dấu gạch ngang nối các tên trong một liên danh.
Chuyến tàu Hà Nội – Hải Phòng sắp khởi hành.|3|Dấu gạch ngang nối hai địa danh để gọi tên tuyến đường.
Đoàn đi theo tuyến Huế – Đà Nẵng.|3|Dấu gạch ngang nối hai địa danh để gọi tên tuyến đường.
    `);
    add('repetition', 'Điệp từ, điệp ngữ', parse(`
Sân trường xanh, hàng cây xanh, cả bầu trời cũng xanh.|xanh|màu xanh bao trùm cảnh vật|hàng cây|sân trường
Em nhớ mái nhà, nhớ bến nước, nhớ hàng cau trước ngõ.|nhớ|nỗi nhớ quê|mái nhà|hàng cau
Bạn hãy đọc, hãy nghĩ, hãy kể lại điều mình hiểu.|hãy|lời nhắc thực hiện từng việc|đọc|kể lại
Bà vẫn chờ, vẫn đợi, vẫn nhìn ra cửa.|vẫn|sự chờ đợi kéo dài|nhìn|cửa
Bước tiếp, bước tiếp, con đường đã gần tới đích.|bước tiếp|lời động viên tiếp tục|con đường|tới đích
Con yêu hàng tre, con yêu tiếng sáo, con yêu con đường làng.|con yêu|tình yêu quê hương|tiếng sáo|hàng tre
Gió thổi qua sân, thổi qua vườn, thổi qua cánh đồng.|thổi qua|làn gió đi qua nhiều nơi|cánh đồng|sân
Mỗi ngày một trang sách, mỗi ngày một điều hay.|mỗi ngày|việc lặp lại hằng ngày|trang sách|điều hay
Vui sao ngày hội, vui sao tiếng hát sân trường!|vui sao|niềm vui trong ngày hội|ngày hội|sân trường
Ở đó có suối, có rừng, có những đồi hoa.|có|sự phong phú của cảnh vật|suối|đồi hoa
Mưa rơi trên mái, rơi bên thềm, rơi ngoài sân.|rơi|mưa hiện diện khắp nơi|mái|ngoài sân
Đọc đi em, đọc đi em, câu chuyện còn nhiều điều thú vị.|đọc đi em|lời khuyến khích đọc|câu chuyện|thú vị
    `).map(([sentence, answer, emphasis, ...wrong]) => [context(sentence, 'Từ hoặc cụm từ nào được lặp lại để tạo biện pháp điệp?'), answer, wrong, `Lặp “${answer}” để nhấn mạnh ${emphasis}.`]));
    wordChoice('connector', 'Chọn kết từ', 'Chọn kết từ điền vào chỗ trống.', answer => `“${answer}” thể hiện đúng quan hệ giữa các từ ngữ hoặc vế câu.`, `
Bức thư này là … Mai.|của|nhưng|vì|tuy
Lan đọc sách … Nam vẽ tranh.|còn|của|bằng|để
Hà chuẩn bị giấy … bút.|và|vì|tuy|nếu
Em lau bàn … khăn ẩm.|bằng|và|nếu|nhưng
Cả nhóm đến thư viện … tìm tài liệu.|để|nhưng|tuy|của
Bé muốn chạy ra sân … sân còn trơn.|nhưng|bằng|của|cùng
Cành cây bị gãy … gió thổi mạnh.|vì|của|bằng|tuy
Mai cắt giấy … kéo.|bằng|nhưng|vì|tuy
Trang vở … em đã kín chữ.|của|nếu|tuy|nhưng
Bạn muốn đọc truyện … đọc thơ?|hay|của|bằng|tuy
Đường còn xa … cả nhóm vẫn đi đều.|nhưng|của|bằng|để
Em mang hộp … đựng bút màu.|để|của|bằng|tuy
    `);
    const clauses = parse(`
Trời sáng|đàn chim cất tiếng hót|,
Mưa tạnh|sân trường khô dần| và
Gió nổi lên|mặt hồ gợn sóng|,
Mai đọc sách|Nam vẽ tranh| còn
Bố tưới cây|mẹ nhặt lá|,
Trống vang lên|học sinh xếp hàng| và
Suối chảy xiết|nước bắn trắng xoá|,
Cô kể chuyện|các bạn lắng nghe| còn
Mây tan|trăng hiện ra|,
Chim hót|hoa nở| và
Cánh cửa mở|ánh sáng tràn vào|,
Hà lau bảng|Tú xếp bàn| còn
    `);
    const compound = (first, second, link) => `${first}${link.trim() === ',' ? ',' : ' ' + link.trim()} ${second}.`;
    add('sentence', 'Phân biệt câu đơn và câu ghép', clauses.flatMap(([first, second, link]) => [
        [context(compound(first, second, link), 'Đây là câu đơn hay câu ghép?'), 'Câu ghép', ['Câu đơn'], `Có hai vế: “${first}” và “${second}”.`],
        [context(first + '.', 'Đây là câu đơn hay câu ghép?'), 'Câu đơn', ['Câu ghép'], 'Câu chỉ có một cụm chủ ngữ – vị ngữ.']
    ]));
    add('clauseLink', 'Nhận biết cách nối các vế câu', clauses.map(([first, second, link]) => {
        const direct = link.trim() === ',';
        const labels = ['Nối trực tiếp bằng dấu phẩy', 'Nối bằng kết từ'];
        return [context(compound(first, second, link), 'Hai vế câu được nối bằng cách nào?'), labels[direct ? 0 : 1], [labels[direct ? 1 : 0]],
            direct ? 'Hai vế được nối trực tiếp bằng dấu phẩy.' : `Giữa hai vế có kết từ “${link.trim()}”.`];
    }));
    classify('pairedLink', 'Dùng cặp kết từ nối vế câu', 'Chọn cặp kết từ thích hợp để điền vào hai chỗ trống.', ['Vì … nên …', 'Nếu … thì …', 'Tuy … nhưng …', 'Không những … mà …'], `
… trời mưa to … đường làng đã ngập nước.|0|Mưa là nguyên nhân, đường ngập là kết quả.
… tập đều đặn suốt tháng qua … đội bóng đã tiến bộ.|0|Việc tập luyện dẫn đến sự tiến bộ.
… sương đã xuống dày … các tàu phải đi chậm lại.|0|Sương dày khiến tàu phải đi chậm.
… xe đến đúng giờ … chúng ta sẽ kịp buổi diễn.|1|Xe đến đúng giờ là điều kiện để kịp buổi diễn.
… trời quang … lớp sẽ quan sát trăng.|1|Trời quang là điều kiện để quan sát trăng.
… em trả sách hôm nay … bạn có thể mượn vào ngày mai.|1|Trả sách hôm nay là điều kiện để bạn mượn sách.
… đường dốc … các bạn vẫn đi đều bước.|2|Đường dốc là trở ngại nhưng các bạn vẫn đi đều.
… trời rét … vườn cải vẫn xanh tốt.|2|Trời rét là trở ngại nhưng cải vẫn xanh tốt.
… trời đã muộn … bé vẫn chờ mẹ về.|2|Trời đã muộn nhưng bé vẫn tiếp tục chờ.
… nhóm em thu gom giấy … nhóm em còn phân loại giấy.|3|Vế sau bổ sung thêm một việc làm.
… bà kể chuyện hay … bà còn hát rất hay.|3|Vế sau bổ sung thêm một khả năng.
… cây cho bóng mát … cây còn làm đẹp sân trường.|3|Vế sau bổ sung thêm một ích lợi.
    `);

    wordChoice('cohesionRepeat', 'Liên kết câu bằng lặp từ ngữ', 'Từ ngữ nào được lặp lại ở cả hai câu?', answer => `“${answer}” lặp lại để duy trì đối tượng được nói đến.`, `
Mây trắng lững lờ trên núi. Mây trắng trôi qua mái nhà.|Mây trắng|trên núi|mái nhà
Chiếc trống đã cũ. Chiếc trống vẫn vang rền mỗi buổi sáng.|Chiếc trống|vang rền|buổi sáng
Dòng suối uốn quanh bản. Dòng suối mang nước về ruộng.|Dòng suối|quanh bản|về ruộng
Giàn mướp trổ hoa. Giàn mướp đã phủ kín mái tre.|Giàn mướp|trổ hoa|mái tre
Chiếc xuồng vừa cập bến. Chiếc xuồng chở đầy trái cây.|Chiếc xuồng|cập bến|trái cây
Bến nước rộn ràng từ sớm. Bến nước đón nhiều chuyến đò.|Bến nước|rộn ràng|chuyến đò
Con đường nhỏ dẫn vào làng. Con đường nhỏ rợp bóng tre.|Con đường nhỏ|vào làng|bóng tre
Lễ hội kéo dài hai ngày. Lễ hội thu hút đông người xem.|Lễ hội|hai ngày|người xem
Cánh đồng đã ngả vàng. Cánh đồng thơm mùi lúa chín.|Cánh đồng|ngả vàng|lúa chín
Vườn chè nằm trên đồi. Vườn chè xanh mướt sau mưa.|Vườn chè|xanh mướt|trên đồi
Nếp nhà sàn hiện ra trong sương. Nếp nhà sàn nằm sát bìa rừng.|Nếp nhà sàn|trong sương|bìa rừng
Tấm thổ cẩm có nhiều màu sắc. Tấm thổ cẩm do bà dệt.|Tấm thổ cẩm|màu sắc|bà dệt
    `);
    wordChoice('cohesionConnect', 'Liên kết câu bằng từ ngữ nối', 'Chọn từ ngữ nối phù hợp với quan hệ giữa hai câu.', answer => `“${answer}” làm rõ quan hệ giữa câu sau với câu trước.`, `
Trời đổ mưa. …, đội bóng vẫn đến sân tập.|Tuy vậy|Trước hết|Chẳng hạn|Vì thế
Đường trơn vì mưa. …, cả nhóm đi chậm lại.|Vì thế|Tuy vậy|Trái lại|Chẳng hạn
Mẹ vo gạo. …, mẹ cho gạo vào nồi.|Tiếp theo|Tuy vậy|Trái lại|Chẳng hạn
Nhiều đồ cũ có thể dùng lại. …, lọ thuỷ tinh có thể làm bình hoa.|Chẳng hạn|Cuối cùng|Trái lại|Tuy vậy
Bố thích nghe nhạc sôi động. …, mẹ thích những bản nhạc êm dịu.|Trái lại|Vì thế|Trước hết|Chẳng hạn
Lan đã đọc hết sách. …, em trả sách cho thư viện.|Sau đó|Trái lại|Tuy vậy|Chẳng hạn
Chiếc giỏ khá nhỏ. …, nó vẫn đựng vừa sáu quả cam.|Tuy vậy|Vì thế|Chẳng hạn|Tiếp theo
Trời trở lạnh. …, các bạn mặc thêm áo khoác.|Vì thế|Trái lại|Tuy vậy|Chẳng hạn
Chúng em làm nhiều việc để giữ lớp sạch. …, mỗi tổ thay nhau lau bảng.|Chẳng hạn|Tuy vậy|Trái lại|Cuối cùng
Đội văn nghệ đã diễn xong mọi tiết mục. …, cả đội chào khán giả rồi rời sân khấu.|Cuối cùng|Chẳng hạn|Trái lại|Tuy vậy
An thích đọc thơ. …, Bình chỉ thích đọc truyện tranh.|Trái lại|Vì thế|Chẳng hạn|Tiếp theo
Em đã vẽ xong phác thảo. …, em tô màu cho bức tranh.|Sau đó|Tuy vậy|Trái lại|Chẳng hạn
    `);
    wordChoice('cohesionReplace', 'Liên kết câu bằng từ ngữ thay thế', 'Từ ngữ trong ngoặc vuông thay cho từ ngữ nào ở câu trước?', answer => `Hai từ ngữ đều chỉ cùng đối tượng là “${answer}”.`, `
Lan dựng lại chậu cây bị đổ. [Cô bé] vun thêm đất vào gốc.|Lan|chậu cây|đất
Nam nhặt chiếc ví ở cổng trường. [Cậu bé] mang ví đến phòng bảo vệ.|Nam|chiếc ví|cổng trường
Con mèo nằm trên thềm. [Nó] lim dim mắt.|Con mèo|thềm|mắt
Mấy chú vịt bơi sát bờ. [Chúng] tìm thức ăn dưới nước.|Mấy chú vịt|bờ|thức ăn
Ông nội em từng là thợ mộc. [Ông] vẫn giữ bộ đồ nghề.|Ông nội em|bộ đồ nghề|em
Đội văn nghệ đang tập ở sân. [Các bạn ấy] chuẩn bị cho buổi diễn.|Đội văn nghệ|sân|buổi diễn
Cây đa cổ thụ che mát cả sân đình. [Cây ấy] đã có từ lâu.|Cây đa cổ thụ|sân đình|bóng mát
Đàn chim sẻ đậu bên cửa. [Chúng] hót lích chích.|Đàn chim sẻ|cửa|tiếng hót
Bác Tư đan chiếc giỏ. [Bác] tặng giỏ cho em.|Bác Tư|chiếc giỏ|em
Mai và Hương đi nhặt vỏ chai. [Hai bạn] đem vỏ chai đến điểm thu gom.|Mai và Hương|vỏ chai|điểm thu gom
Nhà hát mới vừa mở cửa. [Công trình ấy] nằm bên bờ sông.|Nhà hát mới|bờ sông|cửa
Chiếc bè trôi qua bãi cát. [Nó] tiến về phía cầu.|Chiếc bè|bãi cát|cầu
    `);
    add('respect', 'Viết hoa để thể hiện sự tôn trọng đặc biệt', parse(`
Trong lời bày tỏ lòng kính yêu với Chủ tịch Hồ Chí Minh: “Chúng em luôn nhớ lời … dạy.”|Bác|bác
Nhắc đến Chủ tịch Hồ Chí Minh bằng danh từ “người” để bày tỏ sự tôn kính.|Người|người
Chọn danh xưng tôn kính để gọi những người dựng nước thời Văn Lang.|các Vua Hùng|các vua Hùng
Trong lời nhắc nhớ công ơn các Vua Hùng: “Con cháu biết ơn các … Hùng.”|Vua|vua
“Mỗi sáng, … hàng xóm tưới cây.”|bác|Bác
“Bé vẫy tay chào … bán hàng.”|cô|Cô
“Lan giúp … cụ sang đường.”|bà|Bà
“Mẹ mời … thợ vào nhà.”|chú|Chú
“Bạn gặp một … đi xe đạp.”|người|Người
“Mọi … cùng xếp hàng.”|người|Người
“Hai … kể chuyện ngày xưa.”|ông|Ông
“Em chào … giáo trước cổng trường.”|cô|Cô
    `).map(([q, answer, wrong], index) => [q + '<br>Chọn cách viết phù hợp.', answer, [wrong],
        index < 4 ? 'Cách viết hoa thể hiện sự tôn kính trong ngữ cảnh này.' : 'Đây là cách gọi thông thường ở giữa câu nên dùng chữ thường.']));
    add('foreign', 'Viết tên riêng nước ngoài', [
        'Pa-ri', 'Xít-ni', 'Hi-ma-lay-a', 'Hi-rô-si-ma', 'Mát-xda', 'Na-ga-xa-ki',
        'Ngô-rông-gô-rô', 'Vôn-ga', 'Xa-ha-ra', 'Bét-tô-ven', 'Ép-phen', 'Nê-pan'
    ].map(answer => {
        const lower = answer.toLocaleLowerCase('vi-VN');
        const upperParts = lower.split('-').map(part => part[0].toLocaleUpperCase('vi-VN') + part.slice(1)).join('-');
        return [`Chọn cách viết đúng của tên phiên âm “${lower}”.`, answer, [upperParts, answer.replaceAll('-', ' '), lower],
            'Với tên phiên âm này, viết hoa chữ cái đầu bộ phận và dùng gạch nối giữa các tiếng trong bộ phận.'];
    }));

    const writing = (key, name, goal, data) => add(key, name, parse(data).flatMap(([topic, first, second, wrong1, wrong2]) => [
        [`Đề tài “${topic}”. Khi ${goal}, em nên dùng ý nào?`, first, [wrong1, wrong2], `Ý “${first}” phục vụ trực tiếp đề tài và yêu cầu viết.`],
        [`Khi ${goal} về “${topic}”, ý nào giúp bài viết rõ và cụ thể hơn?`, second, [wrong2, wrong1], `Ý “${second}” bổ sung chi tiết đúng trọng tâm.`]
    ]));
    writing('story', 'Kể chuyện sáng tạo', 'chọn chi tiết sáng tạo mà vẫn giữ mạch truyện', `
Chiếc diều mắc trên cây|Thêm lời đối thoại khi hai bạn tìm cách gỡ diều|Kể lại cảnh ấy qua lời của người bạn đứng dưới gốc cây|Chuyển sang kể trận bóng không có chiếc diều|Chỉ giải thích cách làm một chiếc diều mới
Em bé giúp chim non về tổ|Thêm chi tiết em nhờ người lớn giúp đưa chim về tổ|Kể lại cuộc gặp bằng lời của chim non|Kể về buổi diễn ở trường và bỏ chuyện chim non|Chỉ liệt kê tên các loài chim
Người bạn mới ở thư viện|Thêm cuộc trò chuyện giúp hai bạn làm quen|Tả suy nghĩ của nhân vật trước khi mở lời|Chỉ chép nội quy thư viện|Kể về người bán hàng ở ngoài chợ
Chú mèo tìm đường về nhà|Thêm cảnh chú mèo nhận ra tiếng gọi quen|Kể đoạn cuối từ góc nhìn của chú mèo|Đổi nhân vật thành chú chó chưa từng đi lạc|Chỉ ghi hướng dẫn làm chuồng
Hạt giống trong chiếc cốc giấy|Thêm lời hứa chăm hạt giống mỗi sáng|Tưởng tượng hạt giống kể lúc nó nhú mầm|Kể chuyện thi kéo co ở sân|Chép tên các loại cốc trong cửa hàng
Lời xin lỗi bên bờ sông|Thêm chi tiết nhân vật chủ động nhận lỗi|Viết lời đối thoại cho cảnh hai bạn làm hoà|Bỏ cuộc gặp bên bờ sông để kể buổi đi chợ|Chỉ nêu đặc điểm địa lí của dòng sông
    `);
    writing('report', 'Báo cáo công việc', 'viết báo cáo về công việc đã thực hiện', `
Vệ sinh sân trường|Thời gian và thành viên tham gia|Số bao rác đã thu gom|Một đoạn tưởng tượng về sân trường năm sau|Danh sách những món quà sinh nhật
Chăm sóc vườn lớp|Các công việc đã làm trong tuần|Số chậu cây đã được thay đất|Những món ăn yêu thích của tổ|Hướng dẫn đan một chiếc khăn
Quyên góp sách|Thời gian nhận sách và số bạn tham gia|Số sách đã tiếp nhận theo từng loại|Tả bìa của một cuốn sách em đang đọc|Kể một giấc mơ về thư viện
Chuẩn bị góc trưng bày|Những nhóm đã thực hiện từng phần việc|Các sản phẩm đã trưng bày và việc còn lại|Địa chỉ những nơi em muốn đi du lịch|Tóm tắt một bộ phim không có trong buổi trưng bày
Tập luyện văn nghệ|Số buổi tập đã hoàn thành|Tiết mục đã thuộc và phần cần tập thêm|Chỉ kể về trang phục ở một buổi diễn khác|Tả con đường em đi học hằng ngày
Thu gom giấy tái chế|Nơi thu gom và người phụ trách|Khối lượng giấy của từng tổ|Một bài thơ về mùa xuân|Hướng dẫn trồng một cây hoa
    `);
    writing('landscape', 'Tả phong cảnh', 'chọn chi tiết để tả phong cảnh', `
Bến sông buổi sớm|Mặt sông phủ làn sương mỏng|Bóng thuyền thấp thoáng bên kia bờ|Lịch sửa thuyền của bác thợ|Số trang của quyển sổ ghi chép
Rừng sau cơn mưa|Lá non đọng những giọt nước|Mùi đất ẩm lan giữa các gốc cây|Danh sách đồ dùng học tập|Cách chọn giày để đi bộ
Cánh đồng lúa chín|Lúa vàng nghiêng theo gió|Hương lúa theo gió về tận lối làng|Cách tính giá một bao gạo|Lịch họp của tổ dân phố
Vịnh lúc hoàng hôn|Những hòn đảo in bóng trên mặt nước|Mặt biển chuyển dần sang màu tím|Giờ tàu rời bến vào sáng mai|Tóm tắt một truyện cổ tích
Đồi chè lúc bình minh|Các luống chè nối nhau lên đỉnh đồi|Ánh nắng đầu ngày viền vàng những búp chè|Giá một cân chè khô|Cách pha một ấm chè
Bãi biển sáng sớm|Những con sóng nhỏ xô bờ cát|Mấy chiếc thuyền cá xa dần ở đường chân trời|Lịch kiểm tra của lớp|Hướng dẫn thay ruột bút bi
    `);
    const characters = `
Hà trong “Mầm xanh”|Giới thiệu Hà và tên tác phẩm “Mầm xanh”|Nêu việc Hà chia cây giống để làm rõ sự sẻ chia|Chỉ tả khu vườn mà bỏ qua Hà|Kể về một nhân vật không có trong tác phẩm
An trong “Bến nhỏ”|Giới thiệu An và tên tác phẩm “Bến nhỏ”|Kể chi tiết An buộc lại thuyền giúp ông để làm rõ sự chu đáo|Giải thích cách mua vé qua sông|Chỉ liệt kê tên những con sông
Linh trong “Chiếc đèn giấy”|Giới thiệu Linh và tên tác phẩm “Chiếc đèn giấy”|Nêu cảnh Linh thử lại nhiều lần để làm rõ sự kiên trì|Giới thiệu cửa hàng bán đèn gần nhà|Chỉ nêu giá những chiếc đèn
Sóc Nâu trong “Hạt dẻ cuối cùng”|Giới thiệu Sóc Nâu và tên tác phẩm “Hạt dẻ cuối cùng”|Nêu việc Sóc Nâu chia đôi hạt dẻ để làm rõ lòng tốt|Chỉ hướng dẫn cách rang hạt dẻ|Kể về một nhân vật ở truyện khác
Vy trong “Ngày mưa”|Giới thiệu Vy và tên tác phẩm “Ngày mưa”|Nêu việc Vy che ô cho bạn để làm rõ sự quan tâm|Chỉ dự báo mưa ngày mai|Liệt kê các kiểu ô ở cửa hàng
Kiến Đỏ trong “Qua vũng nước”|Giới thiệu Kiến Đỏ và tên tác phẩm “Qua vũng nước”|Nêu cảnh Kiến Đỏ nhờ bạn cùng kê lá để làm rõ khả năng hợp tác|Kể tên các loại lá ngoài vườn|Chỉ tả màu của vũng nước
    `;
    writing('bookCharacter', 'Giới thiệu nhân vật trong sách', 'giới thiệu nhân vật trong một cuốn sách', characters.replaceAll('tác phẩm', 'cuốn sách'));
    writing('filmCharacter', 'Giới thiệu nhân vật phim hoạt hình', 'giới thiệu nhân vật trong phim hoạt hình', characters.replaceAll('tác phẩm', 'bộ phim'));
    const responses = `
Nhặt được ví rồi trả lại|Nêu sự khâm phục trước việc tìm người đánh mất|Giải thích vì sao hành động trả ví làm em cảm động|Liệt kê các loại ví trong cửa hàng|Tả chiếc ví của một người không liên quan
Lớp quyên góp sách cho điểm trường xa|Nêu niềm vui khi thấy bạn bè cùng góp sách|Kể ngắn việc từng bạn chọn cuốn sách mình yêu thích để tặng|Liệt kê tất cả sách trong nhà|Chỉ kể tên các con đường đến trường
Cả xóm dọn đường sau mưa|Nói lên niềm cảm phục trước sự đoàn kết|Chọn chi tiết mọi người cùng dọn bùn từ sáng sớm|Chỉ ghi dự báo thời tiết tuần tới|Kể lịch chiếu của một bộ phim
Cô giáo đón một bạn mới|Bộc lộ sự ấm áp khi thấy bạn được cả lớp chào đón|Nêu chi tiết cô mời bạn mới cùng tham gia trò chơi|Chỉ mô tả cặp sách của em|Kể tên các trò chơi em từng chơi ở nhà
Đội bóng động viên bạn bị chấn thương|Nêu sự xúc động trước tình đồng đội|Nêu chi tiết các bạn mang sổ tay đến thăm bạn|Chỉ nêu luật của một môn thể thao khác|Liệt kê giá các loại bóng
Các bạn cứu cây non bị gãy cọc|Nói rõ vì sao em vui khi cây được chăm sóc|Nêu chi tiết các bạn thay cọc rồi cùng tưới nước|Liệt kê mọi dụng cụ trong kho|Chỉ nêu tên các loài cây ở nơi khác
    `;
    writing('storyResponse', 'Bộc lộ cảm xúc về câu chuyện', 'viết đoạn nêu cảm xúc về câu chuyện', responses);
    writing('eventResponse', 'Bộc lộ cảm xúc về sự việc', 'viết đoạn nêu cảm xúc về sự việc đã chứng kiến', responses);
    writing('poemResponse', 'Bộc lộ cảm xúc về bài thơ', 'viết đoạn nêu cảm xúc về bài thơ', `
Một bài thơ về mẹ|Bộc lộ lòng biết ơn khi đọc hình ảnh bàn tay mẹ|Nêu hình ảnh bàn tay mẹ và giải thích vì sao em xúc động|Chỉ liệt kê việc cần làm trong ngày|Kể về một người không xuất hiện trong thơ
Một bài thơ về mưa|Nói cảm giác thích thú trước âm thanh mưa trong bài|Chọn hình ảnh giọt mưa trên mái làm dẫn chứng|Chép dự báo thời tiết ngày mai|Tả các loại ô ngoài cửa hàng
Một bài thơ về quê|Bộc lộ nỗi nhớ quê khi đọc hình ảnh cây đa|Liên hệ hình ảnh cây đa trong bài với kỉ niệm của em|Liệt kê tên các nhà sách|Tả một đồ vật không có trong bài
Một bài thơ về bạn bè|Nêu cảm xúc ấm áp trước việc các bạn giúp nhau|Chọn hình ảnh sẻ chia để giải thích cảm xúc|Chỉ kể tên các lớp trong trường|Nêu luật một trò chơi không có trong bài
Một bài thơ về mùa xuân|Nêu niềm vui trước hình ảnh chồi non|Giải thích vì sao màu xanh của chồi làm em háo hức|Liệt kê các món ăn trong tuần|Chỉ nêu một phép tính về số cây
Một bài thơ về biển|Nêu cảm giác bình yên trước nhịp sóng|Dẫn hình ảnh gợi cảm giác bình yên trong bài|Kể lại lịch chiếu phim|Ghi giá vé của chuyến xe
    `);
    writing('person', 'Tả người', 'chọn chi tiết để tả người', `
Bà đang đan giỏ|Đôi tay gầy tách từng nan tre|Bà cúi nhìn và khéo léo luồn từng sợi nan|Giá bán của các loại giỏ|Độ sâu của lòng hồ
Người mẹ đang ru con|Mẹ nghiêng đầu về phía em bé|Giọng mẹ chậm và êm, bàn tay vỗ nhẹ|Màu sơn của bức tường ngoài sân|Lịch chiếu phim cuối tuần
Bạn lớp trưởng trong buổi trực nhật|Bạn xắn tay áo và lau từng ô cửa|Bạn nhắc các tổ chia việc bằng giọng nhẹ nhàng|Giá một hộp phấn|Tả cánh đồng ở xa trường
Bố chăm sóc vườn rau|Bố lom khom buộc lại giàn đậu|Mồ hôi lấm tấm trên trán bố|Cách tính diện tích vườn|Lịch chạy của xe buýt
Cô giáo trong giờ kể chuyện|Cô đọc lời nhân vật bằng giọng tha thiết|Ánh mắt cô dừng lại ở từng nhóm học sinh|Số trang của cuốn từ điển|Chỉ tóm tắt nội dung câu chuyện
Người bạn hay giúp đỡ|Bạn chia cho em chiếc bút khi em quên mang|Bạn kiên nhẫn chỉ lại từng bước của bài toán|Màu ngói của mái nhà đối diện|Bảng giá vé xem phim
    `);
    writing('program', 'Chương trình hoạt động', 'lập chương trình cho hoạt động sắp diễn ra', `
Đọc sách cùng bạn|Nêu mục đích và đối tượng tham gia|Phân công người chuẩn bị sách và dẫn chương trình|Tả màu chiếc cặp của em|Tóm tắt trận bóng hôm qua
Chăm sóc bồn hoa|Ghi ngày, giờ và địa điểm tập trung|Sắp xếp thứ tự nhổ cỏ, xới đất, tưới cây|Kể lại chuyện đi ngủ tối qua|Nêu điểm bài kiểm tra Toán
Tham quan làng nghề|Ghi điểm hẹn và thời gian xuất phát|Phân công nhóm ghi chép và nhóm chuẩn bị câu hỏi|Chỉ tả quần áo của người không tham gia|Kể các món ăn em thích
Đổi giấy lấy cây|Nêu mục đích giảm rác thải giấy|Ghi lịch nhận giấy, cân giấy và phát cây|Kể kỉ niệm sinh nhật|Chỉ tả một bức tranh
Giới thiệu sản vật quê em|Xác định nơi trưng bày và khách mời|Ghi thứ tự các nhóm giới thiệu sản vật|Liệt kê tên những bài hát em thích|Kể về chiếc áo mới
Giao lưu văn nghệ|Chốt thời gian và các nhóm tham gia|Sắp xếp thứ tự tiết mục và người phụ trách âm thanh|Tả khu vườn sau mưa|Kể lại một tiết học Toán
    `);
    writing('agree', 'Nêu ý kiến tán thành', 'chọn lí lẽ để tán thành việc làm', `
Mang bình nước dùng lại|Giảm số chai nhựa dùng một lần|Bình cá nhân có thể rửa và dùng nhiều lần|Màu của thùng đựng giấy|Tên một món ăn
Đọc sách 15 phút mỗi ngày|Giúp hình thành thói quen đọc đều đặn|Mỗi ngày đọc một ít giúp hiểu thêm về tác phẩm|Nhà em cách trường ba ngã rẽ|Giá một chiếc thước kẻ
Trồng cây quanh sân trường|Tạo thêm bóng mát cho học sinh|Cây giúp sân trường dịu hơn vào ngày nóng|Màu bìa của quyển vở|Giờ phát một bộ phim
Đổi sách đã đọc với bạn|Giúp nhiều bạn đọc được thêm sách|Cuốn sách được dùng lại thay vì nằm lâu trên giá|Số lượng ghế trong phòng họp|Tên đội bóng của trường bạn
Phân loại rác tại lớp|Giúp tách giấy có thể tái chế|Các tổ có thể đặt hộp riêng để thu giấy sạch|Tên nhân vật chính trong truyện em đọc|Kích thước một chiếc bàn
Đi bộ tới trường khi nhà ở gần|Tạo cơ hội vận động hằng ngày|Giảm số chuyến xe ngắn trước cổng trường|Số trang trong một cuốn truyện|Chiều dài của chiếc thước
    `);
    writing('disagree', 'Nêu ý kiến phản đối', 'chọn lí lẽ để phản đối việc làm', `
Vứt rác xuống kênh|Rác làm ô nhiễm nước|Túi nhựa có thể làm tắc dòng chảy|Màu sắc của một chiếc áo|Tên một món ăn
Bẻ cành trong công viên|Cây bị tổn thương và mất vẻ đẹp|Cành gãy có thể rơi vào lối đi|Lịch chiếu phim ngày mai|Tên các bạn trong lớp
Mở nhạc to trong thư viện|Tiếng nhạc làm người đọc mất tập trung|Người cần nghe âm thanh có thể đeo tai nghe|Giá của một hộp màu|Tên các môn thi đấu
Lãng phí nước khi rửa tay|Để vòi chảy liên tục làm phí nước sạch|Có thể khoá vòi khi đang xoa xà phòng|Chiều dài một cây bút|Tên vài câu chuyện đã đọc
Viết lên bàn học|Nét viết làm hỏng tài sản chung|Có thể ghi ý tưởng lên giấy nháp|Màu lá vào mùa thu|Cách chọn đội bóng
Để đèn sáng trong phòng trống|Điện bị tiêu thụ khi không ai cần dùng|Tắt đèn khi ra khỏi phòng giúp tiết kiệm điện|Cách gấp một con hạc|Số chậu hoa ở vườn
    `);

    add('windReading', 'Đọc hiểu · Thanh âm của gió', [
        [context('Nhóm bạn dắt trâu qua suối. Trâu dừng ăn cỏ dọc bờ trước khi lên đồi. Khi chiều xuống, các bạn tìm đá đẹp bên dòng nước.', 'Trâu ăn cỏ trước ở đâu?'),
            'Dọc bờ suối', ['Trên đỉnh đồi', 'Ngoài bãi cát'], 'Chi tiết nằm ở câu thứ hai.'],
        [context('Khi chiều xuống, nhóm bạn chăn trâu tìm những viên đá đẹp bên dòng suối.', 'Các bạn tìm gì vào buổi chiều?'),
            'Những viên đá đẹp', ['Lá thuốc', 'Cành khô'], 'Đoạn đọc cho biết các bạn tìm đá bên dòng suối.']
    ]);
    add('stoneReading', 'Đọc hiểu · Tiếng hát của người đá', [
        [context('Chú bé người đá gắn bó với mọi người và với thiên nhiên. Những việc làm của chú khiến cuộc sống quanh mình thêm tươi đẹp.', 'Đoạn tóm tắt nhấn mạnh tình cảm nào của chú bé?'),
            'Tình yêu cuộc sống và con người', ['Sự ham muốn nổi tiếng', 'Nỗi sợ thiên nhiên'], 'Hai câu cho thấy chú gắn bó và làm đẹp cuộc sống.'],
        [context('Những việc làm của chú bé người đá khiến cuộc sống quanh mình thêm tươi đẹp.', 'Cụm từ nào nói về kết quả việc làm của chú?'),
            'Cuộc sống thêm tươi đẹp', ['Mọi người rời đi', 'Thiên nhiên biến mất'], 'Câu văn nêu trực tiếp kết quả.']
    ]);

    const reading = (key, title, passage, items) => add(key, 'Đọc hiểu · ' + title, parse(items).map(([question, answer, wrong1, wrong2, explanation]) =>
        [context(passage, question), answer, [wrong1, wrong2], explanation]));
    reading('skyReading', 'Trước cổng trời',
        'Giữa hai vách đá hiện ra một khoảng trời. Xa hơn là thác nước, hoa cỏ và ruộng lúa chín trong thung lũng. Trong cảnh ấy còn nghe được tiếng nhạc ngựa.',
        `Khoảng trời hiện ra ở đâu?|Giữa hai vách đá|Sau một cánh cổng gỗ|Bên ngoài một ngôi nhà|Câu đầu nêu vị trí khoảng trời.
Chi tiết nào gợi âm thanh của đàn ngựa?|Tiếng nhạc ngựa|Ruộng lúa chín|Hoa cỏ trong thung lũng|Tiếng nhạc ngựa là chi tiết gợi âm thanh.`);
    reading('studyReading', 'Tấm gương tự học',
        'Tạ Quang Bửu thường tranh thủ đọc sách trong nhiều hoàn cảnh. Ông kiên trì học từ khi còn trẻ đến cuối đời và tự học thêm nhiều ngoại ngữ.',
        `Thói quen nào giúp ông học được ở nhiều nơi?|Tranh thủ đọc sách|Chỉ học khi có người nhắc|Chỉ đọc lúc ở trường|Câu đầu cho biết ông tận dụng nhiều dịp để đọc.
Ý nào khái quát đoạn văn?|Tạ Quang Bửu say mê và kiên trì tự học|Tạ Quang Bửu chỉ học một ngoại ngữ|Tạ Quang Bửu chỉ học khi còn trẻ|Cả hai câu cho thấy việc tự học bền bỉ của ông.`);
    reading('paintingReading', 'Tranh làng Hồ',
        'Người kể thích tranh dân gian làng Hồ từ thuở nhỏ. Mỗi dịp Tết nhìn những bức tranh, người kể thấy biết ơn các nghệ nhân đã đưa hình ảnh gần gũi của làng quê vào tranh.',
        `Nhìn tranh vào dịp Tết, người kể nghĩ đến ai?|Các nghệ nhân làm tranh|Người đánh cá ngoài khơi|Các bạn cùng lớp|Câu thứ hai nêu lòng biết ơn với nghệ nhân.
Đặc điểm nào của tranh được nêu?|Đề tài gần gũi với làng quê|Chỉ vẽ các toà nhà cao tầng|Chủ yếu vẽ máy móc|Câu cuối cho biết hình ảnh làng quê được đưa vào tranh.`);
    reading('festivalReading', 'Hội thổi cơm thi ở Đồng Vân',
        'Sau tiếng trống, người được giao nhiệm vụ leo lên cây chuối để lấy nén hương. Các thành viên khác chuẩn bị gạo và nước để thổi cơm.',
        `Người leo lên cây chuối để làm gì?|Lấy nén hương|Hái một nải chuối|Treo cờ hội|Câu đầu nêu mục đích leo cây.
Đoạn văn cho thấy các thành viên phối hợp như thế nào?|Mỗi người đảm nhận một phần việc|Mọi người đều leo lên cùng một cây|Cả đội chỉ đứng xem|Các việc lấy lửa và chuẩn bị nguyên liệu được chia cho các thành viên.`);
    reading('tueTinhReading', 'Danh y Tuệ Tĩnh',
        'Khi nguồn thuốc từ bên ngoài bị ngăn, các thầy thuốc đi nhiều nơi để học cách chữa bệnh bằng cây cỏ trong dân gian. Các vườn thuốc dần xuất hiện ở nhiều vùng.',
        `Các thầy thuốc học thêm điều gì?|Cách chữa bệnh bằng cây cỏ|Cách chế tạo vũ khí|Cách vận chuyển hàng bằng thuyền|Câu đầu nêu điều họ học từ dân gian.
Việc đi nhiều nơi diễn ra trong hoàn cảnh nào?|Nguồn thuốc từ bên ngoài bị ngăn|Các vườn thuốc đã ngừng hoạt động|Mọi người không còn cần thuốc|Phần đầu đoạn cho biết nguyên nhân họ phải tìm hiểu thêm.`);
    reading('earthReading', 'Giờ Trái Đất',
        'Trong Giờ Trái Đất, nhiều nơi tắt đèn trong một giờ vào tối thứ Bảy cuối cùng của tháng Ba. Việc làm này nhắc mọi người quan tâm đến biến đổi khí hậu và hành động để bảo vệ Trái Đất.',
        `Hoạt động được nêu trong câu đầu kéo dài bao lâu?|Một giờ|Cả đêm|Hai ngày|Câu đầu ghi rõ thời gian tắt đèn.
Hoạt động hướng mọi người tới mục đích gì?|Quan tâm đến biến đổi khí hậu và bảo vệ Trái Đất|Tập luyện để thi đấu thể thao|Trang trí đường phố cho lễ hội|Câu cuối nêu mục đích của hoạt động.`);

    root.Grade5VietnamesePractice = { skills };
})(typeof globalThis !== 'undefined' ? globalThis : this);
