import { test, expect, type Page } from '@playwright/test';

/**
 * Mobile Safari (WebKit + iPhone 13) regression tests for the "white screen" bug.
 *
 * Root cause: on mobile / Safari / iOS user agents, Firebase Auth initialisation waits for the
 * Google auth iframe (apis.google.com + <authDomain>/__/auth/iframe) before firing
 * onAuthStateChanged. When that iframe stalls (ITP, content blockers, flaky mobile network),
 * the app used to stay in `loading` forever (and also awaited getRedirectResult first),
 * rendering only a tiny spinner on a white page with no "Entrar com Google" button.
 */

const GOOGLE_AUTH_HOSTS = /apis\.google\.com|firebaseapp\.com|googleapis\.com|gstatic\.com/;

function collectProblems(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    const type = res.request().resourceType();
    if (res.status() >= 400 && ['script', 'stylesheet', 'document'].includes(type)) {
      problems.push(`HTTP ${res.status()} ${type} ${new URL(res.url()).pathname}`);
    }
  });
  return problems;
}

test.describe('Mobile Safari - tela de login', () => {
  for (const route of ['/', '/login']) {
    test(`rota ${route} mostra a tela de login e o botão do Google`, async ({ page }) => {
      const problems = collectProblems(page);
      await page.goto(route);

      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: /agenda da diarista/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /entrar com google/i })).toBeVisible();
      await expect(page.locator('#root')).not.toBeEmpty();
      expect(problems).toEqual([]);
    });
  }

  test('login aparece mesmo se o iframe de autenticação do Google nunca responder', async ({
    page,
    context,
  }) => {
    // Simulate the iOS failure mode: Google/Firebase auth endpoints hang forever.
    await context.route(GOOGLE_AUTH_HOSTS, () => {
      /* never fulfil */
    });
    const problems = collectProblems(page);

    await page.goto('/login');

    // Must be visible quickly — NOT only after the 10s safety timeout.
    const button = page.getByRole('button', { name: /entrar com google/i });
    await expect(button).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/carregando autenticação/i)).toBeVisible();

    // After the safety timeout, loading ends with an understandable message and an enabled button.
    await expect(page.getByText(/não foi possível verificar sua sessão/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(button).toBeEnabled();
    expect(problems).toEqual([]);
  });

  test('rota protegida não fica em branco enquanto a autenticação carrega', async ({
    page,
    context,
  }) => {
    await context.route(GOOGLE_AUTH_HOSTS, () => {
      /* never fulfil */
    });
    await page.goto('/');
    // Either the loading screen (with text) or already the login page — never an empty page.
    await expect(page.getByText(/carregando|entrar com google/i).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('button', { name: /entrar com google/i })).toBeVisible({
      timeout: 15000,
    });
  });
});
