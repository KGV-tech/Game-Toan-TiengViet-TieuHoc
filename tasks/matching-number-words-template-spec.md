# Spec: Template “Đối chiếu trùng khớp” số – chữ

## Objective

Thêm một template tái sử dụng để sinh câu “Đối chiếu trùng khớp” cho số tự
nhiên. Bản ghi cấu hình đầu tiên dùng cho **Lớp 4 – Toán – Số tự nhiên**, nhưng
admin có thể tạo bản ghi mới cho Lớp 1–5 hoặc chủ đề khác mà không lưu/chạy mã
JavaScript trong cơ sở dữ liệu.

## Existing integration contract

Game đã hiển thị dạng đối chiếu khi câu hỏi có:

```js
{
  type: 'Đối chiếu trùng khớp',
  options: ['số 1, số 2, ...', 'chữ 1, chữ 2, ...'],
  ans: 'số 1:chữ 1, số 2:chữ 2, ...'
}
```

Generator mới phải trả đúng cấu trúc này. Cặp xuất hiện trong `ans` là các cặp
đúng duy nhất; một số hoặc một cách đọc dư là nhiễu.

## Public template contract

Stable generator key: `number.match_number_words`.

```js
{
  generator_key: 'number.match_number_words',
  question_type: 'Đối chiếu trùng khớp',
  config: {
    shapes: ['5:4', '4:5'],
    digits: [7, 8, 9],
    digitStrategy: 'balanced', // balanced | random | cycle
    digitWeights: { 7: 20, 8: 30, 9: 50 }, // optional
    prefixWords: 0,            // optional; 0 disables common-prefix rule
    seed: null                 // optional reproducible sequence
  }
}
```

The number of answer pairs is calculated from the shape (`min(left, right)`),
not stored independently. Therefore `5:4` always has four answers and `4:3`
always has three answers.

## Admin requirements

- Template form must offer the matching question type and this generator key.
- Admin can choose grade, subject, semester and topic using existing metadata
  controls; no grade/topic is hard-coded in the generator.
- Admin can configure shapes, digit lengths, strategy, optional weights,
  common-prefix rule and optional seed.
- Form validation rejects invalid shapes, unsupported digit lengths, malformed
  weights and a question type incompatible with this generator.
- Admin preview displays the generated left column, right column and answer;
  it never stores executable code.

## Generator requirements

- Vietnamese reading follows the existing standard: `linh`, `mốt`, `tư`,
  `lăm` and `không trăm` are reading rules only, never difficulty scores.
- Generate only unique values within one question.
- Shuffle both displayed columns and answer-pair order.
- A seed yields reproducible generated questions.
- Canonical duplicate checking treats the same content in another display
  order as identical.

## Boundaries

- Always: preserve the current matching renderer/answer syntax; validate config
  before generating; test generator and the admin form contract.
- Ask first: database-schema migration or a new runtime dependency.
- Never: save executable generator code in Supabase, alter unrelated question
  types, or modify the user’s existing uncommitted UI changes.

## Commands

```powershell
node test_template_bank_contract.cjs
node --check src/main.js
```

New generator tests will run with Node’s built-in test/assert support; no new
dependency is required.

## Success criteria

1. Admin can create/configure `number.match_number_words` with metadata for
   Lớp 4 – Toán – Số tự nhiên.
2. A saved template generates valid 5|4 / 4|5 questions with four answers.
3. A configuration with 4|3 / 3|4 generates three answers.
4. Existing template-bank contract and JavaScript syntax checks pass.
5. The architecture permits other grade/topic records using the same stable
   generator key and configuration contract.
