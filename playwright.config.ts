import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run serially to avoid conflicts with emulator
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /mobile-safari\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
    {
      // Real WebKit engine with iPhone viewport/UA/touch (Mobile Safari emulation).
      name: 'mobile-safari',
      testMatch: /mobile-safari\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
        baseURL: 'http://localhost:4174',
        // Optional: custom WebKit launcher for hosts where `npx playwright install-deps webkit`
        // (sudo) is not possible. Leave unset to use Playwright's bundled WebKit.
        launchOptions: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE
          ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE }
          : {},
      },
    },
  ],
  webServer: [
    {
      command: 'VITE_USE_EMULATORS=true npm run dev -- --host 0.0.0.0 --port 5174',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        VITE_USE_EMULATORS: 'true',
      },
    },
    {
      // Production bundle (same build target / config as deploy) for the mobile-safari project.
      command: 'npx vite build && npx vite preview --port 4174 --strictPort',
      url: 'http://localhost:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        VITE_USE_EMULATORS: 'false',
      },
    },
  ],
});
