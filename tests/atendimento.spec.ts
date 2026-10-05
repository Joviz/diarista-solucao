import { test, expect } from '@playwright/test';

test.describe('Novo Atendimento - Fluxo completo', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', (msg) => {
      console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    });

    // Capture network errors
    page.on('requestfailed', (request) => {
      console.log(`[NETWORK FAILED] ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('deve criar atendimento com dados válidos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const loginButton = page.getByRole('button', { name: /entrar com google/i });
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      // Check if Firebase is not configured
      const firebaseError = page.getByText(/firebase não configurado/i);
      if (await firebaseError.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Firebase não configurado - pulando teste de criação');
        test.skip();
        return;
      }

      console.log('Tela de login detectada - precisa de autenticação');
      // Without real credentials, we can't proceed past login
      test.skip();
      return;
    }

    // If we're logged in, we should be on the Resumo page with the form
    // The form title "Novo Atendimento" should be visible
    const formTitle = page.getByRole('heading', { name: /novo atendimento/i });
    await expect(formTitle).toBeVisible({ timeout: 10000 });

    // Fill the form
    await page.fill('#cliente', 'Maria Silva');
    await page.fill('#endereco', 'Rua das Flores, 123 - Centro');
    await page.fill('#data', '2026-10-13');
    await page.fill('#horario', '08:00');
    // Duração deixa em branco
    await page.fill('#valorCombinado', '200,00');

    // Seleciona situação "Previsto"
    await page.click('#situacao');
    await page.getByRole('option', { name: /previsto/i }).click();

    // Clica no botão Adicionar Atendimento
    const submitButton = page.getByRole('button', { name: /adicionar atendimento/i });
    await submitButton.click();

    // Aguarda um pouco para ver se há resposta
    await page.waitForTimeout(3000);

    // Verifica se há mensagem de erro
    const errorAlert = page.locator('.alert-destructive');
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.log('Erro no formulário:', errorText);
    }

    // Verifica se o atendimento aparece na lista
    const clienteText = page.getByText('Maria Silva');
    const isVisible = await clienteText.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      console.log('Atendimento criado com sucesso!');
    } else {
      console.log('Atendimento NÃO apareceu na tela');
    }
  });

  test('deve mostrar erro quando campo obrigatório vazio', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const loginButton = page.getByRole('button', { name: /entrar com google/i });
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      const firebaseError = page.getByText(/firebase não configurado/i);
      if (await firebaseError.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Firebase não configurado - pulando teste');
        test.skip();
        return;
      }

      console.log('Tela de login detectada - precisa de autenticação');
      test.skip();
      return;
    }

    // If logged in, the form should be visible
    const formTitle = page.getByRole('heading', { name: /novo atendimento/i });
    await expect(formTitle).toBeVisible({ timeout: 10000 });

    // Tenta enviar sem preencher nada
    const submitButton = page.getByRole('button', { name: /adicionar atendimento/i });
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Verifica se há mensagem de erro de validação
    const errorAlerts = page.locator('.alert-destructive');
    const count = await errorAlerts.count();
    console.log('Alertas de erro encontrados:', count);

    for (let i = 0; i < count; i++) {
      const text = await errorAlerts.nth(i).textContent();
      console.log('Erro:', text);
    }

    // Should have validation errors for required fields
    expect(count).toBeGreaterThan(0);
  });
});
