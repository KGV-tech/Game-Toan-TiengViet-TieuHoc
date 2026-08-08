const { readdirSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

const tests = readdirSync('.').filter(name => /^test_.*\.cjs$/.test(name)).sort();

for (const file of tests) {
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
