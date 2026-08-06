# Question templates

Each generator is isolated by grade and subject, so changes for one area cannot alter another one.

```text
question-templates/
└── grade-4/
    └── math/
        ├── smallest-of-four.js
        ├── largest-of-four.js
        ├── digit-at-place.js
        ├── compose-from-places.js
        ├── missing-expanded-addend.js
        ├── neighbor-numbers.js
        ├── compare-number-forms.js
        └── index.js
```

## Adding a template

1. Create one file in the matching grade-and-subject folder.
2. Export a function that returns the existing question shape: `q`, `options`, `ans`, `type`, and `explanation`.
3. Register its stable key in that folder's `index.js`.
4. Add a configuration record through the admin interface (once enabled) rather than storing executable code in the database.

## Admin configuration example

`number.digit_at_place` is one reusable generator. A database configuration can make it choose a different permitted place and digit every time:

```json
{
  "generator_key": "number.digit_at_place",
  "minimum": 10000,
  "maximum": 99999,
  "allowedPlaces": ["tens", "hundreds", "thousands", "tenThousands"],
  "allowedDigits": [1, 2, 3, 4, 5, 6, 7, 8, 9]
}
```

The administrator edits these values; the application does not accept JavaScript from the database.

## Dynamic fill-in and comparison templates

The four Grade 4 Math templates below use `minimum` and `maximum` only. Their database
`prompt_template` must remain `{question}` so the dynamically generated content is retained:

- `number.compose_from_places` — compose a number from named place values.
- `number.missing_expanded_addend` — fill a missing addend in expanded form.
- `number.neighbor_numbers` — fill the preceding and following numbers.
- `number.compare_number_forms` — choose `>`, `<`, or `=` between a number and an expanded form.
