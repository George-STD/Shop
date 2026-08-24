const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ar-EG',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'node e2e/mock-api.js',
      url: 'http://localhost:4010/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run dev -- --hostname 127.0.0.1',
      url: 'http://127.0.0.1:3000',
      env: {
        API_URL: 'http://localhost:4010/api',
        NEXT_PUBLIC_API_URL: 'http://localhost:4010/api',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
