import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
          NEXTAUTH_SECRET:
            process.env.NEXTAUTH_SECRET || 'playwright-test-secret-32-chars-min',
          ENCRYPTION_KEY:
            process.env.ENCRYPTION_KEY || 'playwright-encryption-key-32-chars',
          TEST_PHASE_ENABLED: 'true',
        },
      },
});
