# Phase 1 — Mapping Template hiện có theo Bài học

> Trạng thái: **APPROVED / đã apply và audit live trong project Supabase**
> Nguồn kiểm kê: `C:\Users\htleh\Downloads\question_templates_rows.csv`
> Ngày kiểm kê: 09/09/2026; ngày audit live: 10/09/2026

> Quyết định bổ sung ngày 09/09/2026: chưa tạo hoặc gắn Template cho **Bài 5 — bài toán lời văn ba bước**. Family này được tạm hoãn để người dùng xem lại sau.

## 1. Kết quả kiểm kê

- Tổng số record trong CSV: **46**.
- Tất cả đều đang `is_active = true`.
- **45 record** chưa có `lesson` cấp cao nhất.
- **1 record** đã có `lesson = g4-math-hk1-b11` nhưng config của nó vẫn đang dùng phạm vi 8–9 chữ số, cần rà lại theo chương trình lớp 4.
- Dữ liệu hiện chỉ thuộc Học kỳ 1, Lớp 4, môn Toán.

Phân bố theo Chủ đề:

| Chủ đề hiện tại | Số record |
| --- | ---: |
| 1. Ôn tập và bổ sung | 12 |
| 2. Góc và đơn vị đo góc | 4 |
| 3. Số có nhiều chữ số | 13 |
| 4. Một số đơn vị đo Đại lượng | 8 |
| 5. Phép cộng và phép trừ | 9 |
| **Tổng** | **46** |

## 2. Quy ước đề xuất

Các mã dưới đây là mã trong `lessonCatalog`:

```text
B01 = g4-math-hk1-b01  Bài 1. Ôn tập các số đến 100 000
B02 = g4-math-hk1-b02  Bài 2. Ôn tập các phép tính trong phạm vi 100 000
B03 = g4-math-hk1-b03  Bài 3. Số chẵn, số lẻ
B04 = g4-math-hk1-b04  Bài 4. Biểu thức chứa chữ
B05 = g4-math-hk1-b05  Bài 5. Giải bài toán có ba bước tính
B06 = g4-math-hk1-b06  Bài 6. Luyện tập chung
B07 = g4-math-hk1-b07  Bài 7. Đo góc, đơn vị đo góc
B08 = g4-math-hk1-b08  Bài 8. Góc nhọn, góc tù, góc bẹt
B09 = g4-math-hk1-b09  Bài 9. Luyện tập chung
B10–B37              các Bài học tương ứng trong lessonCatalog HK1
```

| Nhãn | Ý nghĩa |
| --- | --- |
| **GẮN** | Được gắn đúng một Bài học trong gói Phase 1 đã duyệt. |
| **GẮN + HARDEN** | Ý tưởng thuộc một Bài học, nhưng cần sửa phạm vi config/generator trước khi bật như Template học thuật. |
| **TÁCH** | Generator hiện trộn hai hoặc nhiều kỹ năng/Bài học; cần tạo biến thể hẹp rồi archive record cũ. |
| **THAY** | Dạng hiện tại không bám phạm vi SGK; giữ lại code/ý tưởng nếu hữu ích nhưng không gắn làm Template học thuật. |
| `*` | Có thể thuộc một lesson review, nhưng phải có blueprint/skill tag để không dùng nhầm trong các bài học trước. |

## 3. Mapping các record hiện có

### 3.1. Chủ đề 1 — Ôn tập và bổ sung

| UUID | Tên | Đề xuất | Ghi chú |
| --- | --- | --- | --- |
| `981d1ac3-06f5-438e-8b7a-3410cc63d469` | Bốn phép tính điền khuyết | **GẮN B02** | Config trong phạm vi 10–99 999; đúng nhóm ôn phép tính. |
| `2e12c19b-efc3-4ab8-ae6e-7d5ad120a4bb` | Bốn phép tính: điền số còn thiếu | **GẮN B02** | Dạng điền thành phần của phép tính. |
| `2f653ca5-893c-4cdb-9efe-f0995f450fed` | Bốn phép tính: tính giá trị biểu thức | **GẮN B02** | Không nên để record này đại diện cho Bài 1. |
| `5fa3511a-2cb6-4f96-a7ea-7d2173edafe7` | Điền thành phần còn thiếu khi phân tích số | **GẮN B01** | Dạng khai triển/phân tích số đến 100 000. |
| `675644ba-d1ae-40c8-ad36-42a7bf1e9b51` | Đối chiếu số với cách đọc | **GẮN B01** | Cần sửa metadata topic hardcode trong generator về topic chuẩn hiện tại. |
| `a7b8d959-c1c9-4a1a-9bc3-b32cd1b61768` | Lập số từ các hàng | **GẮN B01** | Phù hợp ôn cấu tạo số. |
| `c5d1d03c-d539-433d-97b6-fee5074722aa` | Nhận biết chữ số theo hàng | **GẮN B01** | Phạm vi 2–5 chữ số phù hợp Bài 1. |
| `2a9f2d2b-eea0-44bd-a8e4-c34819bd58c5` | Số liền trước và số liền sau | **GẮN B01** | Phù hợp số tự nhiên đến 100 000. |
| `5eebc531-e3c0-4b6e-97e5-0c983d2a9f75` | So sánh bốn phép tính kéo thả | **GẮN B02** | Nội dung là so sánh kết quả phép tính, không phải so sánh số của Bài 1. |
| `c2d25199-ddd2-4e0e-84fe-f5d856d71633` | So sánh số với dạng tổng | **GẮN B01** | Đối chiếu số với dạng khai triển. |
| `0cb830c2-3de6-4805-a2e6-19bcd9f1b744` | Tìm số bé nhất trong bốn số | **GẮN B01** | Dạng so sánh số trong phạm vi ôn tập. |
| `93fb31c9-2ef5-421e-a875-8aae79142e4e` | Tìm số lớn nhất trong bốn số | **GẮN B01** | Dạng so sánh số trong phạm vi ôn tập. |

**Kết luận Chủ đề 1:** có thể gắn 12 record vào B01/B02 sau khi duyệt. Không có record cho B03, B04, B05, B06; các Bài học này cần family mới ở Phase 2.

### 3.2. Chủ đề 2 — Góc và đơn vị đo góc

| UUID | Tên | Đề xuất | Ghi chú |
| --- | --- | --- | --- |
| `992f7665-69bd-483e-a993-129e9b26e6da` | Đếm số lượng góc trong hình đa giác | **GẮN B08** | Đang phân loại góc nhọn/vuông/tù/bẹt, không phải đọc số đo bằng thước. |
| `1345aec4-4ad7-47a9-b918-39f8041375cc` | Đếm số lượng trong 8 góc | **GẮN B08** | Nội dung đúng nhóm nhận biết loại góc. |
| `e9e4f81c-f720-4896-b3f3-eb904dc24397` | Nhận biết loại góc tạo bởi kim giờ và kim phút | **GẮN B08** | Dạng phân loại góc trên đồng hồ. |
| `73ec2ba0-1c79-4ba1-b09d-7f31d038f483` | Phân loại các loại góc | **GẮN B08** | Dạng kéo thả phân loại góc. |

**Kết luận Chủ đề 2:** 4 record đều quy về B08. Chưa có Template B07 (đo góc/đơn vị độ) và B09 (luyện tập chung); hai nhóm này cần bổ sung mới.

### 3.3. Chủ đề 3 — Số có nhiều chữ số

| UUID | Tên | Đề xuất | Ghi chú |
| --- | --- | --- | --- |
| `008efb59-f1e9-4fbf-bb2a-5eb3e6f4cc5e` | Lập số từ các hàng | **GẮN + HARDEN B11** | Record nằm ở Chủ đề 3 nhưng config chỉ 10 000–100 000; cần nâng/giới hạn đúng phạm vi B11 trước khi bật. |
| `0a40ee0c-0533-4096-bedd-bdfdba450d31` | Số liền trước và số liền sau | **GẮN B15** | Khớp nhóm số tự nhiên/dãy số; có thể mở rộng phạm vi sau khi test. |
| `27345061-c036-42b3-9693-3196623dc95b` | Tìm số bé nhất trong bốn số | **GẮN + HARDEN B14** | Ý tưởng đúng B14, nhưng config 5 chữ số nên cần chuẩn hóa phạm vi số nhiều chữ số. |
| `3df20abd-182a-42be-975d-6a33bf451515` | Bốn phép tính điền khuyết | **TÁCH / B16*** | Config 2–9 chữ số và 4 phép tính quá rộng, có thể vượt lớp triệu; không gắn thẳng. |
| `475cb396-a04e-40a5-9221-632612ec558b` | Tìm số lớn nhất trong bốn số | **GẮN + HARDEN B14** | Cần chuẩn hóa phạm vi số nhiều chữ số. |
| `5406d38e-85a8-415f-ad7c-c028aab968fa` | So sánh bốn phép tính kéo thả | **TÁCH / B16*** | Đang so sánh kết quả bốn phép tính, không phải một kỹ năng riêng của B10–B15; config tới 9 chữ số. |
| `5617107c-9fa0-4ed0-86e2-6d9206732926` | Điền thành phần còn thiếu khi phân tích số | **GẮN + HARDEN B11** | Cần xác nhận phạm vi số của B11, không giữ mặc định 10 000–100 000 nếu muốn bao phủ lớp triệu. |
| `602aa6d9-1a22-42a8-a3c3-fc0b55e30326` | Nhận biết chữ số theo hàng | **GẮN + HARDEN B11** | Cần thêm hàng trăm nghìn/triệu theo phạm vi bài; hiện chỉ tới chục nghìn. |
| `6c3d55a1-d276-4f00-a4b2-578235162243` | Đúng/Sai về lớp của chữ số | **GẮN + HARDEN B11** | Đã có `g4-math-hk1-b11`, nhưng config 10 000 000–999 999 999 là quá rộng so với lớp triệu. |
| `7fd969fd-ddb1-4926-a5f9-94cc45e4f754` | Đối chiếu số với cách đọc | **THAY / B10–B12** | Config tạo 7–9 chữ số; 8–9 chữ số không thuộc phạm vi đã xác minh. Cần generator đọc số theo phạm vi B10/B12. |
| `a5f9b495-42b6-4d92-84b7-e66b347f7471` | Mật khẩu két sắt theo hàng | **THAY / archive học thuật** | Dạng game challenge 9 chữ số, không phải nội dung cốt lõi SGK hiện đã đối chiếu. Có thể giữ riêng cho mini-game nếu cần. |
| `d8203d07-f645-479e-8d20-0930ca087550` | So sánh số với dạng tổng | **GẮN + HARDEN B14** | Phù hợp so sánh dạng số/dạng khai triển; cần chuẩn hóa phạm vi nhiều chữ số. |
| `e30cc858-22e8-42fe-b63d-5118d07ade0c` | Dãy số theo quy luật | **GẮN + HARDEN B15** | Đúng nhóm dãy số tự nhiên, nhưng config tới 9 999 999 cần giới hạn theo phạm vi đã học. |

**Kết luận Chủ đề 3:** chỉ các dạng B14/B15/B11 có thể giữ ý tưởng. Các record 4 phép tính phải đưa về review có blueprint hoặc tách khỏi Chủ đề 3; `Mật khẩu két sắt` không nên nằm trong kho Template học thuật; dạng đọc số cần thay generator để không sinh 8–9 chữ số.

### 3.4. Chủ đề 4 — Một số đơn vị đo Đại lượng

| UUID | Tên | Đề xuất | Ghi chú |
| --- | --- | --- | --- |
| `e58c943b-0262-4244-b87f-2cc9ff29213b` | Bài toán thực tế đơn vị đo | **GẮN B21*** | Generator đang có nhiều ngữ cảnh khối lượng/diện tích/thời gian; chỉ dùng như review B21 với blueprint, không dùng cho B17–B20. |
| `b01bea2a-f00d-427a-887a-95ae0cc3e7ba` | Đổi đơn vị diện tích | **GẮN B18** | Đúng family dm², m², mm²; cần rà lại đơn vị cm² nếu không thuộc mục tiêu bài. |
| `c57e591c-f22d-485f-b7a3-696f987527cd` | Đổi đơn vị khối lượng | **GẮN B17** | Đúng yến, tạ, tấn. |
| `2beec1a2-63fa-4caa-8c37-79b466490b35` | Đổi đơn vị thời gian | **GẮN + HARDEN B19** | Cần giới hạn về giây/thế kỉ và rà lại các dạng tuần/ngày/giờ theo nội dung Bài 19. |
| `a393807c-04d0-4660-b613-8faa6159e5ac` | Đúng/Sai về đơn vị đo | **GẮN B21*** | Đang trộn khối lượng, diện tích, thời gian, thế kỉ; chỉ phù hợp review có skill tag. |
| `cf3883b2-84a1-4f92-80ac-770986c03ba6` | Nối số đo tương đương | **GẮN B21*** | Dạng matching tổng hợp; không đưa vào pool riêng của B17/B18/B19. |
| `7ed9036c-0cb2-4996-bad7-3329fa96de4b` | So sánh đại lượng cùng loại | **GẮN B21*** | Cần chọn cùng một loại đơn vị trong từng ý và gắn skill tag. |
| `33b98f95-d635-4be8-9d31-9553ece2302c` | Xác định thế kỉ | **GẮN B19** | Dạng nhận biết thế kỉ theo năm. |

**Kết luận Chủ đề 4:** B17, B18, B19 và B21 đã có nền tảng. B20 (thực hành/trải nghiệm sử dụng đơn vị) chưa có Template; cần bổ sung mới.

### 3.5. Chủ đề 5 — Phép cộng và phép trừ

| UUID | Tên | Đề xuất | Ghi chú |
| --- | --- | --- | --- |
| `5a30dfbf-7cc9-4c35-9fc8-5bb64b7cd742` | Bài toán thực tế: cộng và trừ | **TÁCH B22/B23** | Generator chọn cả `+` và `−`; cần hai biến thể cộng/trừ riêng. |
| `c9de8f63-cdab-422a-a52e-7af1001f8ab5` | Bốn phép cộng và trừ số nhiều chữ số | **TÁCH B22/B23** | Một thẻ đang trộn hai lesson; tách thành 2 record/generator variant. |
| `f3c1e507-ea8c-40a0-9b71-2657155e0996` | Điền số theo tính chất của phép cộng | **GẮN B24** | Đúng giao hoán/kết hợp. |
| `188eda5d-8495-4a34-87dc-62eb3544baaa` | Đúng/Sai về phép cộng và phép trừ | **TÁCH B22/B23** | Cần tách statement chỉ cộng và chỉ trừ; review cả hai chỉ để B26. |
| `98ef2899-fc44-41ef-a600-79fff0379d21` | Tìm chữ số còn thiếu trong phép tính | **TÁCH B22/B23** | Generator chọn cả cộng và trừ; cần lọc theo operation. |
| `0f50b5cd-9cdf-4cb3-932d-6be5c0e4ae78` | Tìm hai số biết tổng và hiệu | **GẮN B25** | Dạng trực tiếp tìm số bé/số lớn. |
| `dd1fcecf-bd83-41f0-8e24-ede5167d1542` | Tìm hai số biết tổng và hiệu qua ngữ cảnh | **GẮN B25** | Dạng bài toán có lời văn cùng kỹ năng. |
| `0a62edfa-5d1a-48ef-8496-9715d6b289a0` | Tìm số hạng, số bị trừ, số trừ hoặc hiệu | **TÁCH B22/B23** | Đang trộn thành phần của phép cộng và phép trừ. |
| `8fc628b5-ee24-4db2-928d-a6b536495362` | Tính giá trị biểu thức cộng, trừ | **GẮN B26*** | Có thể là review B22–B25; không nên dùng như Template riêng của B22 hoặc B23. |

**Kết luận Chủ đề 5:** B24 và B25 có thể gắn ngay; các dạng trộn cộng/trừ phải tách. B26 sẽ là nơi chứa review có blueprint, không phải nơi gom mọi generator chưa phân loại.

## 4. Template mới cần duyệt trước khi tạo

Các family dưới đây là đề xuất cho các khoảng trống, chưa tạo record Supabase:

| Bài học | Family mới đề xuất | Dạng tương tác |
| --- | --- | --- |
| B03 | Phân loại chẵn/lẻ; đếm chẵn/lẻ; dãy chẵn/lẻ; lập số chẵn/lẻ từ thẻ số | Card lựa chọn, lưới, kéo thả |
| B04 | Thay giá trị chữ; tính giá trị biểu thức; chọn biểu thức đúng | Điền khuyết, trắc nghiệm |
| B05 | **Tạm hoãn theo duyệt 09/09/2026** | Chưa tạo; chờ người dùng xem lại phần bài toán lời văn |
| B06 | Review B01–B04; chỉ mở rộng sau khi B05 được duyệt | Bộ review có skill tag |
| B07 | Đọc số đo góc; nhận biết đơn vị độ; đối chiếu số đo | Hình thước đo góc + keyboard fallback |
| B09 | Review đo góc và phân loại góc | Hình + trắc nghiệm |
| B10 | Số sáu chữ số và 1 000 000: đọc, viết, lập số | Điền/đối chiếu |
| B12 | Số trong phạm vi lớp triệu: đọc, viết, hàng/lớp | Điền/Đúng-Sai |
| B13 | Làm tròn đến hàng trăm nghìn | Trắc nghiệm/Đúng-Sai |
| B20 | Chọn đơn vị và ước lượng trong tình huống thực tế | Card chọn, kéo thả |
| B27–B31 | Vuông góc, song song, thực hành, hình bình hành/hình thoi | SVG tương tác + keyboard fallback |
| B33–B37 | Review số, cộng/trừ, hình học, đo lường và toàn HK1 | Blueprint theo kỹ năng |

## 5. Cách triển khai Phase 1 đã duyệt

### Nhóm A — Gắn metadata rõ ràng

Gói triển khai đã tạo SQL `UPDATE` riêng cho 28 record **GẮN**. Lệnh chỉ cập nhật:

```text
lesson = mã lesson chuẩn
```

Không đổi `generator_key`, không đổi config và không xoá record trong nhóm này.

### 5.1. Phạm vi đã thực thi trong repo

- `src/modules/template-manifest.js` chứa manifest 28 UUID → lesson và validator metadata.
- `supabase/migrations/20260909_question_templates_phase1_lesson_mapping.sql` đã map nhóm trực tiếp.
- `supabase/migrations/20260910_question_templates_harden_split_replace.sql` đã xử lý nốt 17 record active: harden B11/B12/B14/B15/B16/B19, archive mềm challenge không học thuật, và seed/tách B22/B23.
- Live audit sau migration: 57 active, 0 active thiếu `lesson`, 0 B05; 10 variant Topic 5 active chia đúng 5 cộng và 5 trừ.
- Migration không xoá vật lý Template, không tạo family B05 và không đổi RLS/quyền.

### Nhóm B — Sửa generator/config rồi mới gắn

Các record **GẮN + HARDEN** cần:

1. Chốt giới hạn số liệu theo SGK.
2. Sửa generator/config.
3. Chạy contract test và preview nhiều seed.
4. Sau đó mới cập nhật `lesson`.

### Nhóm C — Tách/thay/archive

Các record **TÁCH** hoặc **THAY** không được gắn lesson giả để làm cho báo cáo hết dòng trống. Quy trình là:

1. Tạo variant/generator hẹp.
2. Tạo Template record mới sau khi người dùng duyệt preview.
3. Kiểm tra đề/câu hỏi đang dùng record cũ.
4. Chuyển record cũ `is_active=false` để rollback được.

## 6. Trạng thái duyệt và việc còn lại

Đã chốt cho Phase 1:

1. Mapping **GẮN** trong các bảng trên được duyệt, đưa vào manifest/migration và
   đã audit live: đủ 28 record thuộc nhóm lesson Phase 1.
2. Audit trước remediation ghi nhận 17 record active thiếu `lesson`; chúng đã
   được xử lý theo mapping HARDEN/TÁCH/THAY, không gán đoán.
3. Dependency check trước archive trả về 0 bản ghi tham chiếu trực tiếp;
   5 record Topic 5 cũ và 1 challenge mật khẩu được archive mềm sau khi có
   variant/đường thay thế.
4. `Bài 5 — bài toán lời văn` chưa tạo; family mới sẽ quay lại sau khi người dùng duyệt riêng.
5. Audit sau remediation xác nhận `active_missing_lesson = 0`; Phase 1 cleanup
   đã hoàn tất.

Chi tiết số liệu và truy vấn đối soát nằm trong
[`PHASE_1_2_LIVE_AUDIT.md`](./PHASE_1_2_LIVE_AUDIT.md).

Phase 2 đã triển khai các family B03/B04/B06 và đã được audit live. Nhóm
HARDEN/TÁCH/THAY của 17 record đã hoàn tất trong migration remediation; các
phase tiếp theo chỉ tập trung bổ sung family mới còn thiếu, trong đó B05 vẫn
được giữ ngoài phạm vi cho tới khi có duyệt riêng.
