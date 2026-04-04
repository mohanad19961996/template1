import { defineConfig } from '@playwright/test';

/**
 * Responsive + smoke E2E. All projects use **Chromium** (Windows-friendly; no WebKit install).
 *
 * Run: npx playwright test
 * Full rebuild + test: npm run test:responsive
 * Against existing server: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test
 */
const port = 3333;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    browserName: 'chromium',
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'Mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Tablet',
      use: {
        viewport: { width: 834, height: 1112 },
      },
    },
    {
      name: 'Desktop',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
