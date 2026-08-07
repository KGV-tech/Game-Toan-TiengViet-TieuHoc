# Implementation Plan: Template đối chiếu số – chữ

## Overview

Expose a safe, reusable number-to-Vietnamese-text matching generator in the
existing Template Bank. It will produce the exact data contract already used by
the game’s matching renderer, so no gameplay renderer changes are required.

## Architecture decisions

- Keep executable generation code in `src/question-templates`; Supabase stores
  metadata and JSON configuration only.
- Use a stable, metadata-independent key: `number.match_number_words`.
- Derive answer-pair count from the configured shape to prevent contradictory
  admin settings.
- Add only a generator registry and Template Bank form support; do not change
  the current matching UI, import/export contract, or unrelated pending UI work.

## Tasks

### Task 1: Add a deterministic matching generator and unit contract

**Acceptance:** The generator produces valid `options` and `ans` for 5|4/4|5
and 4|3/3|4, has standard Vietnamese readings, and rejects invalid config.

**Verify:** Run a focused Node assertion test for deterministic generation,
shapes, answer pairs and validation failures.

**Files:** `src/question-templates/grade-4/math/*`, focused test file.

### Task 2: Register the stable generator key

**Acceptance:** The existing Grade 4 Math registry resolves
`number.match_number_words` without affecting current keys.

**Verify:** Run existing template-bank contract test and the focused test.

**Files:** `src/question-templates/grade-4/math/index.js`, focused test file.

### Task 3: Extend the Template Bank form and preview

**Acceptance:** Admin can select the matching type/generator, configure valid
shapes/digits/strategy/weights/seed/prefix rule, see a preview, and save JSON
configuration with existing grade/subject/topic metadata.

**Verify:** Existing Template Bank contract test, `node --check src/main.js`,
and focused form-contract assertions.

**Files:** `src/main.js`, `test_template_bank_contract.cjs`.

### Checkpoint

- Generator and existing Template Bank checks pass.
- `src/main.js` parses successfully.
- The renderer receives the unchanged matching question contract.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Admin config is malformed | Strict parse/validation before preview or save. |
| A future grade/topic needs a variant | Reuse generator key with a new metadata/config record. |
| Existing dirty UI changes are overwritten | Touch only the Template Bank functions and preserve surrounding code. |
