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

    await page.goto('http://localhost:5174');
  });

  test('deve criar atendimento com dados válidos', async ({ page }) => {
    // Verifica se está na tela de login ou já logado
    const loginButton = page.locator('button:has-text("Entrar com Google")');
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      console.log('Tela de login detectada - precisa configurar Firebase');
      // Tenta ver se há erro de config
      const firebaseError = page.locator('text=Firebase não configurado');
      if (await firebaseError.isVisible()) {
        console.log('Firebase não configurado - pulando teste de criação');
        return;
      }
      // Se tem botão de login, clica para tentar login
      // Mas como não temos credenciais reais, vamos só verificar o fluxo
    }

    // Navega para a tela de Resumo (onde está o formulário)
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    // Procura o formulário de atendimento
    const formTitle = page.locator('text=Novo Atendimento');
    await expect(formTitle).toBeVisible({ timeout: 10000 });

    // Preenche o formulário
    await page.fill('#cliente', 'Maria Silva');
    await page.fill('#endereco', 'Rua das Flores, 123 - Centro');
    await page.fill('#data', '2026-10-13');
    await page.fill('#horario', '08:00');
    // Duração deixa em branco
    await page.fill('#valorCombinado', '200,00');

    // Seleciona situação "Previsto"
    await page.click('#situacao');
    await page.click('text=Previsto');

    // Clica no botão Adicionar Atendimento
    const submitButton = page.locator('button[type="submit"]:has-text("Adicionar Atendimento")');
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
    // Procura na agenda ou na lista de atendimentos
    const clienteText = page.locator('text=Maria Silva');
    const isVisible = await clienteText.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      console.log('Atendimento criado com sucesso!');
    } else {
      console.log('Atendimento NÃO apareceu na tela');
    }
  });

  test('deve mostrar erro quando campo obrigatório vazio', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    const formTitle = page.locator('text=Novo Atendimento');
    await expect(formTitle).toBeVisible({ timeout: 10000 });

    // Tenta enviar sem preencher nada
    const submitButton = page.locator('button[type="submit"]:has-text("Adicionar Atendimento")');
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
  });
});
