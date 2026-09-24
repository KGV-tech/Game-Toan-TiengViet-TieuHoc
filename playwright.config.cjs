const { defineConfig } = require('@playwright/test');

const port = Number(process.env.TEST_PORT || 4173);

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalTeardown: require.resolve('./tests/e2e/stop-static-server.cjs'),
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'node tests/e2e/static-server.cjs',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
