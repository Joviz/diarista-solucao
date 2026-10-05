import { test, expect } from '@playwright/test';

test.describe('Cancelamento e Pagamento - Persistência', () => {
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

  test('fluxo completo: cancelar, reativar, pagar, desfazer pagamento, excluir', async ({
    page,
  }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const loginButton = page.getByRole('button', { name: /entrar com google/i });
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    if (isLoginVisible) {
      // Check if Firebase is not configured
      const firebaseError = page.getByText(/firebase não configurado/i);
      if (await firebaseError.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Firebase não configurado - pulando teste E2E');
        test.skip();
        return;
      }

      console.log('Tela de login detectada - precisa de autenticação');
      // With emulators, we can try to sign in with a test account
      // For now, skip if we can't authenticate
      test.skip();
      return;
    }

    // If we're logged in, proceed with the test
    console.log('Usuário autenticado - iniciando testes de persistência');

    // 1. Create a test appointment
    console.log('Criando atendimento de teste...');
    await page.fill('#cliente', 'Maria Silva Teste');
    await page.fill('#endereco', 'Rua das Flores, 123 - Centro');
    await page.fill('#data', '2026-10-15');
    await page.fill('#horario', '08:00');
    await page.fill('#valorCombinado', '200,00');

    // Select "Previsto" situation
    await page.click('#situacao');
    await page.getByRole('option', { name: /previsto/i }).click();

    // Submit
    const submitButton = page.getByRole('button', { name: /adicionar atendimento/i });
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify appointment appears in the list
    await expect(page.getByText('Maria Silva Teste')).toBeVisible({ timeout: 5000 });
    console.log('Atendimento criado com sucesso');

    // Navigate to Fechamento
    await page.click('nav >> text=Fechamento');
    await page.waitForLoadState('networkidle');

    // 3. Cancel the appointment
    console.log('Cancelando atendimento...');
    const cancelButton = page.locator('button:has-text("Cancelar")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(2000);

      // Verify it shows as cancelled
      await expect(page.getByText('Cancelado').first()).toBeVisible({ timeout: 5000 });
      console.log('Atendimento cancelado com sucesso');
    }

    // 4. Reload page and verify cancellation persists
    console.log('Recarregando página para verificar persistência do cancelamento...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('nav >> text=Fechamento');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Cancelado').first()).toBeVisible({ timeout: 10000 });
    console.log('Cancelamento persistiu após recarregar');

    // 5. Reactivate (reativar)
    console.log('Reativando atendimento...');
    const reativarButton = page.getByRole('button', { name: /reativar/i }).first();
    if (await reativarButton.isVisible()) {
      await reativarButton.click();
      await page.waitForTimeout(2000);

      // Verify it's back to "Previsto" or "Realizado"
      await expect(page.getByText('Previsto').first()).toBeVisible({ timeout: 5000 });
      console.log('Atendimento reativado com sucesso');
    }

    // 6. Mark as Realizado
    console.log('Marcando como Realizado...');
    const realizadoButton = page.getByRole('button', { name: /realizado/i }).first();
    if (await realizadoButton.isVisible()) {
      await realizadoButton.click();
      await page.waitForTimeout(2000);
      await expect(page.getByText('Realizado').first()).toBeVisible({ timeout: 5000 });
      console.log('Atendimento marcado como Realizado');
    }

    // 7. Register payment
    console.log('Registrando pagamento...');
    const pagarButton = page.getByRole('button', { name: /marcar pago/i }).first();
    if (await pagarButton.isVisible()) {
      await pagarButton.click();
      await page.waitForTimeout(1000);

      // Fill payment form
      await page.fill('#valorRecebido', '200,00');
      await page.fill('#dataRecebimento', '2026-10-15');

      // Submit payment
      const confirmPaymentButton = page.getByRole('button', { name: /confirmar pagamento/i });
      await confirmPaymentButton.click();
      await page.waitForTimeout(2000);

      // Verify payment registered
      await expect(page.getByText('Pago').first()).toBeVisible({ timeout: 5000 });
      console.log('Pagamento registrado com sucesso');
    }

    // 8. Reload and verify payment persists
    console.log('Recarregando página para verificar persistência do pagamento...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('nav >> text=Fechamento');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Pago').first()).toBeVisible({ timeout: 10000 });
    console.log('Pagamento persistiu após recarregar');

    // 9. Undo payment (desfazer pagamento)
    console.log('Desfazendo pagamento...');
    const desfazerButton = page.getByRole('button', { name: /desfazer pagamento/i }).first();
    if (await desfazerButton.isVisible()) {
      await desfazerButton.click();
      await page.waitForTimeout(2000);

      // Should be back to "Realizado" without payment data
      await expect(page.getByText('Realizado').first()).toBeVisible({ timeout: 5000 });
      console.log('Pagamento desfeito com sucesso');
    }

    // 10. Reload and verify undo persists
    console.log('Recarregando página para verificar persistência do desfazer pagamento...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('nav >> text=Fechamento');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Realizado').first()).toBeVisible({ timeout: 10000 });
    // Payment data should not be shown
    await expect(page.getByText('Recebido:').first()).not.toBeVisible({ timeout: 5000 });
    console.log('Desfazer pagamento persistiu após recarregar');

    // 11. Delete the appointment
    console.log('Excluindo atendimento...');
    const deleteButton = page.getByRole('button', { name: /excluir/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Confirm deletion
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Maria Silva Teste');
        await dialog.accept();
      });
      await page.waitForTimeout(2000);

      // Verify it's gone
      await expect(page.getByText('Maria Silva Teste')).not.toBeVisible({ timeout: 5000 });
      console.log('Atendimento excluído com sucesso');
    }

    // 12. Reload and verify deletion persists
    console.log('Recarregando página para verificar persistência da exclusão...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('nav >> text=Fechamento');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Maria Silva Teste')).not.toBeVisible({ timeout: 5000 });
    console.log('Exclusão persistiu após recarregar');

    console.log('Todos os testes de persistência passaram!');
  });
});
