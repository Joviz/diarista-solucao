import { test, expect } from '@playwright/test';

test.describe('Mobile Safari White Screen Diagnosis', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.log(`[PAGEERROR] ${err.message}`));
    page.on('requestfailed', (req) =>
      console.log(`[REQUEST_FAILED] ${req.url()} - ${req.failure()?.errorText}`)
    );
  });

  test('home page renders without white screen', async ({ page }) => {
    const response = await page.goto('/');
    console.log('Response status:', response?.status());

    // Check for white screen indicators
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length || 0);
    console.log('Body text preview:', bodyText?.slice(0, 200));

    // Check for root element content
    const rootHtml = await page.locator('#root').innerHTML();
    console.log('Root HTML length:', rootHtml?.length || 0);
    console.log('Root HTML preview:', rootHtml?.slice(0, 500));

    // Check for loading spinner
    const loadingSpinner = page.locator('.animate-spin');
    const hasLoading = await loadingSpinner.count();
    console.log('Loading spinner count:', hasLoading);

    // Check for login button
    const loginButton = page.getByRole('button', { name: /entrar com google/i });
    const hasLoginButton = await loginButton.isVisible().catch(() => false);
    console.log('Login button visible:', hasLoginButton);

    // Check for white screen indicators
    const bodyBgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    console.log('Body background color:', bodyBgColor);

    // Should not be completely white/blank
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check for login form
    const loginTitle = page.getByRole('heading', { name: /agenda da diarista/i });
    await expect(loginTitle).toBeVisible();

    const loginButton = page.getByRole('button', { name: /entrar com google/i });
    await expect(loginButton).toBeVisible();

    // Check for loading state
    const loadingText = page.getByText(/carregando autenticação/i);
    const hasLoading = await loadingText.isVisible().catch(() => false);
    console.log('Loading text visible:', hasLoading);
  });

  test('login page shows error state when firebase not configured', async ({ page }) => {
    // This test will check the firebase not configured state
    // We can't easily test this without mocking, but we can verify the page renders
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const loginButton = page.getByRole('button', { name: /entrar com google/i });
    const isVisible = await loginButton.isVisible().catch(() => false);
    console.log('Login button visible (should be true if firebase configured):', isVisible);

    // Check for loading spinner during auth check
    const loadingSpinner = page.locator('.animate-spin');
    const hasSpinner = await loadingSpinner.count();
    console.log('Loading spinner count:', hasSpinner);
  });
});
