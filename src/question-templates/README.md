# Question templates

Each generator is isolated by grade and subject, so changes for one area cannot alter another one.

```text
question-templates/
└── grade-4/
    └── math/
        ├── smallest-of-four.js
        ├── largest-of-four.js
        ├── digit-at-place.js
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
