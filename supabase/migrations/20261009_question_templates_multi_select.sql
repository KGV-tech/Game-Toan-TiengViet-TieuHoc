-- Project: bjgbbrufnryrtimtzvhn. User authorized this additive seed on 2026-10-09.
-- 73 Math + 62 Vietnamese lessons; one Correct and one Incorrect template each.
-- No schema, RLS, permission changes, deletes or updates. Preserve custom/inactive records.
BEGIN;
LOCK TABLE public.question_templates IN SHARE ROW EXCLUSIVE MODE;
WITH seed AS (
 SELECT * FROM jsonb_to_recordset($selection_seed$[
  {
    "name": "Bài 1. Ôn tập các số đến 100 000 · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b01",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b01",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 1. Ôn tập các số đến 100 000 · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b01",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b01",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 2. Ôn tập các phép tính trong phạm vi 100 000 · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b02",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b02",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 2. Ôn tập các phép tính trong phạm vi 100 000 · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b02",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b02",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 3. Số chẵn, số lẻ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b03",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b03",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 3. Số chẵn, số lẻ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b03",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b03",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 4. Biểu thức chứa chữ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b04",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b04",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 4. Biểu thức chứa chữ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b04",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b04",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 5. Giải bài toán có ba bước tính · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b05",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b05",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 5. Giải bài toán có ba bước tính · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b05",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b05",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 6. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b06",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b06",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 6. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "1. Ôn tập và bổ sung",
    "lesson": "g4-math-hk1-b06",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b06",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 7. Đo góc, đơn vị đo góc · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "2. Góc và đơn vị đo góc",
    "lesson": "g4-math-hk1-b07",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b07",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 7. Đo góc, đơn vị đo góc · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "2. Góc và đơn vị đo góc",
    "lesson": "g4-math-hk1-b07",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b07",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 8. Góc nhọn, góc tù, góc bẹt · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "2. Góc và đơn vị đo góc",
    "lesson": "g4-math-hk1-b08",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b08",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 8. Góc nhọn, góc tù, góc bẹt · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "2. Góc và đơn vị đo góc",
    "lesson": "g4-math-hk1-b08",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b08",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 9. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "2. Góc và đơn vị đo góc",
    "lesson": "g4-math-hk1-b09",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b09",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 9. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "2. Góc và đơn vị đo góc",
    "lesson": "g4-math-hk1-b09",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b09",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 10. Số có sáu chữ số. Số 1 000 000 · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b10",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b10",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 10. Số có sáu chữ số. Số 1 000 000 · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b10",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b10",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 11. Hàng và lớp · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b11",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b11",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 11. Hàng và lớp · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b11",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b11",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 12. Các số trong phạm vi lớp triệu · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b12",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b12",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 12. Các số trong phạm vi lớp triệu · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b12",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b12",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 13. Làm tròn số đến hàng trăm nghìn · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b13",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b13",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 13. Làm tròn số đến hàng trăm nghìn · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b13",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b13",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 14. So sánh các số có nhiều chữ số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b14",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b14",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 14. So sánh các số có nhiều chữ số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b14",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b14",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 15. Làm quen với dãy số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b15",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b15",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 15. Làm quen với dãy số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b15",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b15",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 16. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b16",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b16",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 16. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "3. Số có nhiều chữ số",
    "lesson": "g4-math-hk1-b16",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b16",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 17. Yến, tạ, tấn · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b17",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b17",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 17. Yến, tạ, tấn · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b17",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b17",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 18. Đề-xi-mét vuông, mét vuông, mi-li-mét vuông · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b18",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b18",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 18. Đề-xi-mét vuông, mét vuông, mi-li-mét vuông · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b18",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b18",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 19. Giây, thế kỉ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b19",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b19",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 19. Giây, thế kỉ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b19",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b19",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 20. Thực hành và trải nghiệm sử dụng một số đơn vị đo đại lượng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b20",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b20",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 20. Thực hành và trải nghiệm sử dụng một số đơn vị đo đại lượng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b20",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b20",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 21. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b21",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b21",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 21. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "4. Một số đơn vị đo Đại lượng",
    "lesson": "g4-math-hk1-b21",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b21",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 22. Phép cộng các số có nhiều chữ số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b22",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b22",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 22. Phép cộng các số có nhiều chữ số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b22",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b22",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 23. Phép trừ các số có nhiều chữ số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b23",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b23",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 23. Phép trừ các số có nhiều chữ số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b23",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b23",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 24. Tính chất giao hoán và kết hợp của phép cộng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b24",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b24",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 24. Tính chất giao hoán và kết hợp của phép cộng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b24",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b24",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 25. Tìm hai số biết tổng và hiệu của hai số đó · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b25",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b25",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 25. Tìm hai số biết tổng và hiệu của hai số đó · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b25",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b25",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 26. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b26",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b26",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 26. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "5. Phép cộng và phép trừ",
    "lesson": "g4-math-hk1-b26",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b26",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 27. Hai đường thẳng vuông góc · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b27",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b27",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 27. Hai đường thẳng vuông góc · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b27",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b27",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 28. Thực hành và trải nghiệm về hai đường thẳng vuông góc · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b28",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b28",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 28. Thực hành và trải nghiệm về hai đường thẳng vuông góc · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b28",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b28",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 29. Hai đường thẳng song song · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b29",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b29",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 29. Hai đường thẳng song song · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b29",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b29",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 30. Thực hành và trải nghiệm về hai đường thẳng song song · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b30",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b30",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 30. Thực hành và trải nghiệm về hai đường thẳng song song · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b30",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b30",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 31. Hình bình hành, hình thoi · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b31",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b31",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 31. Hình bình hành, hình thoi · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b31",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b31",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 32. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b32",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b32",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 32. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "6. Đường thẳng vuông góc. Đường thẳng song song",
    "lesson": "g4-math-hk1-b32",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b32",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 33. Ôn tập các số đến lớp triệu · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b33",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b33",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 33. Ôn tập các số đến lớp triệu · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b33",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b33",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 34. Ôn tập phép cộng, phép trừ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b34",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b34",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 34. Ôn tập phép cộng, phép trừ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b34",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b34",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 35. Ôn tập hình học · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b35",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b35",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 35. Ôn tập hình học · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b35",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b35",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 36. Ôn tập đo lường · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b36",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b36",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 36. Ôn tập đo lường · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b36",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b36",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 37. Ôn tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b37",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b37",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 37. Ôn tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 1",
    "topic": "7. Ôn tập Học kì 1",
    "lesson": "g4-math-hk1-b37",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk1-b37",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 38. Nhân với số có một chữ số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b38",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b38",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 38. Nhân với số có một chữ số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b38",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b38",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 39. Chia cho số có một chữ số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b39",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b39",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 39. Chia cho số có một chữ số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b39",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b39",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 40. Tính chất giao hoán và kết hợp của phép nhân · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b40",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b40",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 40. Tính chất giao hoán và kết hợp của phép nhân · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b40",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b40",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 41. Nhân, chia với 10, 100, 1 000,... · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b41",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b41",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 41. Nhân, chia với 10, 100, 1 000,... · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b41",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b41",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 42. Tính chất phân phối của phép nhân đối với phép cộng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b42",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b42",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 42. Tính chất phân phối của phép nhân đối với phép cộng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b42",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b42",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 43. Nhân với số có hai chữ số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b43",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b43",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 43. Nhân với số có hai chữ số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b43",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b43",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 44. Chia cho số có hai chữ số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b44",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b44",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 44. Chia cho số có hai chữ số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b44",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b44",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 45. Thực hành và trải nghiệm ước lượng trong tính toán · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b45",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b45",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 45. Thực hành và trải nghiệm ước lượng trong tính toán · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b45",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b45",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 46. Tìm số trung bình cộng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b46",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b46",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 46. Tìm số trung bình cộng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b46",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b46",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 47. Bài toán liên quan đến rút về đơn vị · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b47",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b47",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 47. Bài toán liên quan đến rút về đơn vị · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b47",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b47",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 48. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b48",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b48",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 48. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "8. Phép nhân và phép chia",
    "lesson": "g4-math-hk2-b48",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b48",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 49. Dãy số liệu thống kê · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b49",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b49",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 49. Dãy số liệu thống kê · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b49",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b49",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 50. Biểu đồ cột · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b50",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b50",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 50. Biểu đồ cột · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b50",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b50",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 51. Số lần xuất hiện của một sự kiện · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b51",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b51",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 51. Số lần xuất hiện của một sự kiện · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b51",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b51",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 52. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b52",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b52",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 52. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "9. Làm quen với yếu tố Thống kê, Xác suất",
    "lesson": "g4-math-hk2-b52",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b52",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 53. Khái niệm phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b53",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b53",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 53. Khái niệm phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b53",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b53",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 54. Phân số và phép chia số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b54",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b54",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 54. Phân số và phép chia số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b54",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b54",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 55. Tính chất cơ bản của phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b55",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b55",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 55. Tính chất cơ bản của phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b55",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b55",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 56. Rút gọn phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b56",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b56",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 56. Rút gọn phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b56",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b56",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 57. Quy đồng mẫu số các phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b57",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b57",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 57. Quy đồng mẫu số các phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b57",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b57",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 58. So sánh phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b58",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b58",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 58. So sánh phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b58",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b58",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 59. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b59",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b59",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 59. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "10. Phân số",
    "lesson": "g4-math-hk2-b59",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b59",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 60. Phép cộng phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "11. Phép cộng, phép trừ Phân số",
    "lesson": "g4-math-hk2-b60",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b60",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 60. Phép cộng phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "11. Phép cộng, phép trừ Phân số",
    "lesson": "g4-math-hk2-b60",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b60",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 61. Phép trừ phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "11. Phép cộng, phép trừ Phân số",
    "lesson": "g4-math-hk2-b61",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b61",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 61. Phép trừ phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "11. Phép cộng, phép trừ Phân số",
    "lesson": "g4-math-hk2-b61",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b61",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 62. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "11. Phép cộng, phép trừ Phân số",
    "lesson": "g4-math-hk2-b62",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b62",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 62. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "11. Phép cộng, phép trừ Phân số",
    "lesson": "g4-math-hk2-b62",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b62",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 63. Phép nhân phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b63",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b63",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 63. Phép nhân phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b63",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b63",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 64. Phép chia phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b64",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b64",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 64. Phép chia phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b64",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b64",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 65. Tìm phân số của một số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b65",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b65",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 65. Tìm phân số của một số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b65",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b65",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 66. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b66",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b66",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 66. Luyện tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "12. Phép nhân, phép chia Phân số",
    "lesson": "g4-math-hk2-b66",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b66",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 67. Ôn tập số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b67",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b67",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 67. Ôn tập số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b67",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b67",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 68. Ôn tập phép tính với số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b68",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b68",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 68. Ôn tập phép tính với số tự nhiên · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b68",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b68",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 69. Ôn tập phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b69",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b69",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 69. Ôn tập phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b69",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b69",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 70. Ôn tập phép tính với phân số · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b70",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b70",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 70. Ôn tập phép tính với phân số · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b70",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b70",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 71. Ôn tập hình học và đo lường · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b71",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b71",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 71. Ôn tập hình học và đo lường · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b71",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b71",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 72. Ôn tập một số yếu tố thống kê và xác suất · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b72",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b72",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 72. Ôn tập một số yếu tố thống kê và xác suất · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b72",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b72",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 73. Ôn tập chung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b73",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b73",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 73. Ôn tập chung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Toán",
    "semester": "Học kỳ 2",
    "topic": "13. Ôn tập cuối năm",
    "lesson": "g4-math-hk2-b73",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.math",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-math-hk2-b73",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 1. Điều kì diệu · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b01",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b01",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 1. Điều kì diệu · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b01",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b01",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 2. Thi nhạc · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b02",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b02",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 2. Thi nhạc · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b02",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b02",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 3. Anh em sinh đôi · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b03",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b03",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 3. Anh em sinh đôi · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b03",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b03",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 4. Công chúa và người dẫn chuyện · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b04",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b04",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 4. Công chúa và người dẫn chuyện · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b04",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b04",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 5. Thần lằn xanh và tắc kè · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b05",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b05",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 5. Thần lằn xanh và tắc kè · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b05",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b05",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 6. Nghệ sĩ trống · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b06",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b06",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 6. Nghệ sĩ trống · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b06",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b06",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 7. Những bức chân dung · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b07",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b07",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 7. Những bức chân dung · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b07",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b07",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 8. Đò ngang · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b08",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b08",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 8. Đò ngang · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "1. Mỗi người một vẻ",
    "lesson": "g4-vietnamese-hk1-b08",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b08",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 9. Bầu trời trong quả trứng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b09",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b09",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 9. Bầu trời trong quả trứng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b09",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b09",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 10. Tiếng nói của cỏ cây · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b10",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b10",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 10. Tiếng nói của cỏ cây · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b10",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b10",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 11. Tập làm văn · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b11",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b11",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 11. Tập làm văn · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b11",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b11",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 12. Nhà phát minh 6 tuổi · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b12",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b12",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 12. Nhà phát minh 6 tuổi · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b12",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b12",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 13. Con vẹt xanh · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b13",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b13",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 13. Con vẹt xanh · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b13",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b13",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 14. Chân trời cuối phố · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b14",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b14",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 14. Chân trời cuối phố · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b14",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b14",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 15. Gặt chữ trên non · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b15",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b15",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 15. Gặt chữ trên non · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b15",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b15",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 16. Trước ngày xa quê · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b16",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b16",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 16. Trước ngày xa quê · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "2. Trải nghiệm và khám phá",
    "lesson": "g4-vietnamese-hk1-b16",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b16",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 17. Vẽ màu · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b17",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b17",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 17. Vẽ màu · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b17",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b17",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 18. Đồng cỏ nở hoa · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b18",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b18",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 18. Đồng cỏ nở hoa · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b18",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b18",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 19. Thanh âm của núi · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b19",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b19",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 19. Thanh âm của núi · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b19",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b19",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 20. Bầu trời mùa thu · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b20",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b20",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 20. Bầu trời mùa thu · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b20",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b20",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 21. Làm thỏ con bằng giấy · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b21",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b21",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 21. Làm thỏ con bằng giấy · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b21",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b21",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 22. Bức tường có nhiều phép lạ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b22",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b22",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 22. Bức tường có nhiều phép lạ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b22",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b22",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 23. Bét-tô-ven và bản xô-nát Ánh trăng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b23",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b23",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 23. Bét-tô-ven và bản xô-nát Ánh trăng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b23",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b23",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 24. Người tìm đường lên các vì sao · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b24",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b24",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 24. Người tìm đường lên các vì sao · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "3. Niềm vui sáng tạo",
    "lesson": "g4-vietnamese-hk1-b24",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b24",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 25. Bay cùng ước mơ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b25",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b25",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 25. Bay cùng ước mơ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b25",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b25",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 26. Con trai người làm vườn · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b26",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b26",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 26. Con trai người làm vườn · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b26",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b26",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 27. Nếu em có một khu vườn · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b27",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b27",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 27. Nếu em có một khu vườn · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b27",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b27",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 28. Bốn mùa mơ ước · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b28",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b28",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 28. Bốn mùa mơ ước · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b28",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b28",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 29. Ở Vương quốc Tương Lai · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b29",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b29",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 29. Ở Vương quốc Tương Lai · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b29",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b29",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 30. Cánh chim nhỏ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b30",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b30",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 30. Cánh chim nhỏ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b30",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b30",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 31. Nếu chúng mình có phép lạ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b31",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b31",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 31. Nếu chúng mình có phép lạ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b31",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b31",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 32. Anh Ba · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b32",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b32",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 32. Anh Ba · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 1",
    "topic": "4. Chắp cánh ước mơ",
    "lesson": "g4-vietnamese-hk1-b32",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk1-b32",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 1. Hải Thượng Lãn Ông · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b01",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b01",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 1. Hải Thượng Lãn Ông · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b01",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b01",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 2. Vệt phấn trên mặt bàn · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b02",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b02",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 2. Vệt phấn trên mặt bàn · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b02",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b02",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 3. Ông Bụt đã đến · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b03",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b03",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 3. Ông Bụt đã đến · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b03",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b03",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 4. Quả ngọt cuối mùa · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b04",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b04",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 4. Quả ngọt cuối mùa · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b04",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b04",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 5. Tờ báo tường của tôi · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b05",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b05",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 5. Tờ báo tường của tôi · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b05",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b05",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 6. Tiếng ru · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b06",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b06",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 6. Tiếng ru · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b06",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b06",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 7. Con muốn làm một cái cây · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b07",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b07",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 7. Con muốn làm một cái cây · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b07",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b07",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 8. Trên khóm tre đầu ngõ · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b08",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b08",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 8. Trên khóm tre đầu ngõ · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "5. Sống để yêu thương",
    "lesson": "g4-vietnamese-hk2-b08",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b08",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 9. Sự tích con Rồng cháu Tiên · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b09",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b09",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 9. Sự tích con Rồng cháu Tiên · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b09",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b09",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 10. Cảm xúc Trường Sa · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b10",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b10",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 10. Cảm xúc Trường Sa · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b10",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b10",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 11. Sáng tháng Năm · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b11",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b11",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 11. Sáng tháng Năm · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b11",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b11",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 12. Chàng trai làng Phù Ủng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b12",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b12",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 12. Chàng trai làng Phù Ủng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b12",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b12",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 13. Vườn của ông tôi · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b13",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b13",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 13. Vườn của ông tôi · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b13",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b13",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 14. Trong lời mẹ hát · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b14",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b14",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 14. Trong lời mẹ hát · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b14",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b14",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 15. Người thầy đầu tiên của bố tôi · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b15",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b15",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 15. Người thầy đầu tiên của bố tôi · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b15",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b15",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 16. Ngựa biên phòng · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b16",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b16",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 16. Ngựa biên phòng · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "6. Uống nước nhớ nguồn",
    "lesson": "g4-vietnamese-hk2-b16",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b16",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 17. Cây đa quê hương · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b17",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b17",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 17. Cây đa quê hương · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b17",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b17",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 18. Bước mùa xuân · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b18",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b18",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 18. Bước mùa xuân · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b18",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b18",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 19. Đi hội chùa Hương · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b19",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b19",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 19. Đi hội chùa Hương · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b19",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b19",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 20. Chiều ngoại ô · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b20",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b20",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 20. Chiều ngoại ô · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b20",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b20",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 21. Những cánh buồm · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b21",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b21",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 21. Những cánh buồm · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b21",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b21",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 22. Cái cầu · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b22",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b22",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 22. Cái cầu · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b22",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b22",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 23. Đường đi Sa Pa · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b23",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b23",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 23. Đường đi Sa Pa · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b23",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b23",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 24. Quê ngoại · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b24",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b24",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 24. Quê ngoại · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "7. Quê hương trong tôi",
    "lesson": "g4-vietnamese-hk2-b24",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b24",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 25. Khu bảo tồn động vật hoang dã Ngô-rông-gô-rô · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b25",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b25",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 25. Khu bảo tồn động vật hoang dã Ngô-rông-gô-rô · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b25",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b25",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 26. Ngôi nhà của yêu thương · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b26",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b26",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 26. Ngôi nhà của yêu thương · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b26",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b26",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 27. Băng tan · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b27",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b27",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 27. Băng tan · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b27",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b27",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 28. Chuyến du lịch thú vị · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b28",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b28",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 28. Chuyến du lịch thú vị · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b28",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b28",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 29. Lễ hội ở Nhật Bản · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b29",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b29",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 29. Lễ hội ở Nhật Bản · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b29",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b29",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  },
  {
    "name": "Bài 30. Ngày hội · Chọn nhiều Đúng/Sai · Chọn Đúng",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b30",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b30",
      "selectionTarget": "correct"
    },
    "is_active": true
  },
  {
    "name": "Bài 30. Ngày hội · Chọn nhiều Đúng/Sai · Chọn Sai",
    "classlevel": "Lớp 4",
    "subject": "Tiếng Việt",
    "semester": "Học kỳ 2",
    "topic": "8. Vì một thế giới bình yên",
    "lesson": "g4-vietnamese-hk2-b30",
    "question_type": "Chọn nhiều Đúng/Sai",
    "generator_key": "selection.vietnamese",
    "prompt_template": "{question}",
    "config": {
      "lesson": "g4-vietnamese-hk2-b30",
      "selectionTarget": "incorrect"
    },
    "is_active": true
  }
]$selection_seed$::jsonb)
 AS records(name text,classlevel text,subject text,semester text,topic text,lesson text,
 question_type text,generator_key text,prompt_template text,config jsonb,is_active boolean)
), inserted AS (
 INSERT INTO public.question_templates (id,name,classlevel,subject,semester,topic,lesson,question_type,generator_key,prompt_template,config,is_active)
 SELECT gen_random_uuid(),seed.name,seed.classlevel,seed.subject,seed.semester,seed.topic,seed.lesson,seed.question_type,seed.generator_key,seed.prompt_template,seed.config,seed.is_active
 FROM seed WHERE NOT EXISTS (
 SELECT 1 FROM public.question_templates existing WHERE existing.classlevel=seed.classlevel
 AND existing.subject=seed.subject AND existing.semester=seed.semester
 AND COALESCE(existing.lesson,existing.config->>'lesson')=seed.lesson
 AND existing.generator_key=seed.generator_key
 AND COALESCE(existing.config->>'selectionTarget','correct')=seed.config->>'selectionTarget'
 ) RETURNING subject,semester,config->>'selectionTarget' AS selection_target
)
SELECT subject,semester,selection_target,count(*) AS inserted_count FROM inserted GROUP BY subject,semester,selection_target ORDER BY subject,semester,selection_target;
COMMIT;
SELECT subject,semester,config->>'selectionTarget' AS selection_target,count(*) AS template_count,
 count(*) FILTER(WHERE is_active) AS active_count FROM public.question_templates
WHERE generator_key IN ('selection.math','selection.vietnamese') AND classlevel='Lớp 4'
GROUP BY subject,semester,config->>'selectionTarget' ORDER BY subject,semester,selection_target;
