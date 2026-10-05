import { test, expect } from '@playwright/test';

test.describe('Agenda da Diarista - Fluxo completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('deve mostrar tela de login quando não autenticado', async ({ page }) => {
    await expect(page.locator('text=Agenda da Diarista')).toBeVisible();
    await expect(page.locator('text=Configure o Firebase para continuar')).toBeVisible();
  });
});
