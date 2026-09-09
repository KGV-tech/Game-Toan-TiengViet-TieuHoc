const assert = require('node:assert/strict');
const fs = require('node:fs');

const baseSchema = fs.readFileSync('supabase_question_templates.sql', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260909_question_templates_lesson.sql', 'utf8');

assert.match(baseSchema, /\n\s*lesson TEXT,\r?\n\s*question_type TEXT NOT NULL/,
  'The canonical question_templates schema must expose a nullable lesson column.');
assert.match(baseSchema, /question_templates_lesson_idx/,
  'The canonical schema must index lesson for lesson-scoped template queries.');
assert.match(migration, /ALTER TABLE public\.question_templates\s+ADD COLUMN IF NOT EXISTS lesson TEXT;/,
  'The migration must add lesson idempotently.');
assert.match(migration, /SET lesson = NULLIF\(BTRIM\(config ->> 'lesson'\), ''\)/,
  'The migration must preserve existing explicit config.lesson metadata.');
assert.doesNotMatch(migration, /CREATE POLICY|DROP POLICY|GRANT |REVOKE /,
  'The lesson migration must not alter RLS or table permissions.');

console.log('question_templates lesson schema contract verified.');
