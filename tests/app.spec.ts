import { test, expect } from '@playwright/test';

test.describe('Agenda da Diarista - Fluxo completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve mostrar tela de login quando não autenticado', async ({ page }) => {
    await expect(page.locator('text=Agenda da Diarista')).toBeVisible();

    // Check for either Google login button OR Firebase not configured message
    const googleLoginButton = page.getByRole('button', { name: /entrar com google/i });
    const firebaseNotConfigured = page.getByText(/firebase não configurado/i);

    const hasGoogleLogin = await googleLoginButton.isVisible().catch(() => false);
    const hasFirebaseError = await firebaseNotConfigured.isVisible().catch(() => false);

    // Should have either Google login (Firebase configured) or error message (not configured)
    expect(hasGoogleLogin || hasFirebaseError).toBeTruthy();
  });
});
