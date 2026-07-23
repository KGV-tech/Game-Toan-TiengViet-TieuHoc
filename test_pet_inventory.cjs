const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/main.js', 'utf8');
const schema = fs.readFileSync('supabase_v2.sql', 'utf8');
const migration = fs.readFileSync('supabase_pet_inventory.sql', 'utf8');

assert.match(schema, /CREATE TABLE IF NOT EXISTS pet_inventory/,
  'Shared pet inventory must have its own Supabase table.');
assert.match(schema, /INSERT INTO pet_inventory[\s\S]*pet_dragon/,
  'The shared inventory must seed every pet, including the dragon.');
assert.match(migration, /CREATE TABLE IF NOT EXISTS pet_inventory/,
  'Existing databases must have a standalone pet inventory migration.');
assert.match(source, /petInventory:/,
  'The client must load shared pet inventory instead of deriving it from localStorage.');
assert.match(source, /from\('pet_inventory'\)/,
  'Pet purchases and returns must update the shared Supabase inventory.');
assert.doesNotMatch(source, /pet_rem_/,
  'Pet stock must no longer be stored per browser in localStorage.');

console.log('Shared pet inventory contract verified.');
