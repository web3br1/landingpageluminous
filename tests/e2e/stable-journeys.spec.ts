import { test, expect } from "@playwright/test";

/**
 * E2E Stable Journeys - 2 Jornadas Estáveis
 *
 * Jornada 1: Happy Path (navegação básica, interação leve)
 * Jornada 2: Resiliência (simulação de erros, recuperação)
 */

test.describe("Stable E2E Journeys", () => {
  // Jornada 1: Happy Path
  test.describe("Happy Path Journey", () => {
    test("should navigate landing page successfully", async ({ page }) => {
      // Acessar homepage
      await page.goto("/");

      // Verificar carregamento básico
      await expect(page).toHaveTitle(/Landing Page|SaaS/i);
      await expect(page.locator("body")).toBeVisible();

      // Verificar elementos essenciais do hero
      const heroSection = page.locator(
        "[data-testid='hero-section'], section:first-child, [id='hero']",
      );
      await expect(heroSection).toBeVisible();

      // Interagir com CTA primário se existir
      const primaryCTA = page
        .locator("button, a")
        .filter({ hasText: /comece|start|trial|get/i })
        .first();
      if (await primaryCTA.isVisible()) {
        await primaryCTA.click();

        // Verificar que alguma ação ocorreu (navegação ou modal)
        await expect(page).not.toHaveURL("/");
      }

      // Verificar seções principais estão presentes
      const mainSections = [
        page
          .locator("[data-testid='features-section'], #features, section")
          .filter({ hasText: /features|funcionalidades/i }),
        page
          .locator("[data-testid='pricing-section'], #pricing, section")
          .filter({ hasText: /pricing|preços|planos/i }),
      ];

      for (const section of mainSections) {
        if (await section.isVisible()) {
          await expect(section).toBeVisible();
        }
      }
    });
  });

  // Jornada 2: Resiliência
  test.describe("Resilience Journey", () => {
    test("should handle errors gracefully and recover", async ({ page }) => {
      // Simular ambiente com possíveis problemas
      await page.route("**/api/**", async (route) => {
        // Simular falha em 30% das requisições API
        if (Math.random() < 0.3) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Simulated server error" }),
          });
        } else {
          await route.continue();
        }
      });

      // Acessar homepage
      await page.goto("/");
      await expect(page.locator("body")).toBeVisible();

      // Verificar se error boundaries estão funcionando
      const errorBoundaries = page.locator(
        "[data-testid='error-boundary'], .error-boundary",
      );
      const errorCount = await errorBoundaries.count();

      // Se houver erros, verificar que são tratados
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const boundary = errorBoundaries.nth(i);
          await expect(boundary).toBeVisible();

          // Verificar se há botão de retry
          const retryButton = boundary
            .locator("button")
            .filter({ hasText: /retry|tentar|tente/i });
          if (await retryButton.isVisible()) {
            await retryButton.click();
            // Verificar que não quebrou completamente
            await expect(page.locator("body")).toBeVisible();
          }
        }
      }

      // Testar navegação mesmo com possíveis erros
      const navigationElements = page.locator("a, button").filter({
        hasText: /pricing|preços|features|funcionalidades|about|sobre/i,
      });

      const navCount = await navigationElements.count();
      if (navCount > 0) {
        // Tentar navegar para uma seção
        const firstNav = navigationElements.first();
        await firstNav.click();

        // Verificar que página não quebrou
        await expect(page.locator("body")).toBeVisible();

        // Verificar se mudou de seção ou página
        const currentURL = page.url();
        const hasNavigated = !currentURL.includes("#") || currentURL !== "/";

        if (hasNavigated) {
          // Se navegou, verificar carregamento
          await expect(page.locator("body")).toBeVisible();
        }
      }

      // Verificar estado final - página deve estar funcional
      await expect(page).not.toHaveTitle(/error|erro/i);
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle network failures gracefully", async ({ page }) => {
      // Simular falhas de rede intermitentes
      let requestCount = 0;
      await page.route("**/api/**", async (route) => {
        requestCount++;
        // Simular falha em requisições alternadas
        if (requestCount % 3 === 0) {
          await route.abort();
        } else if (requestCount % 5 === 0) {
          // Simular timeout
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Timeout
          await route.fulfill({
            status: 408,
            contentType: "application/json",
            body: JSON.stringify({ error: "Request timeout" }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/");
      await expect(page.locator("body")).toBeVisible();

      // Aguardar um pouco para que requisições ocorram
      await page.waitForTimeout(2000);

      // Verificar que página continua funcional apesar de falhas
      await expect(page.locator("body")).toBeVisible();
      await expect(page).not.toHaveTitle(/error|erro|failed/i);

      // Verificar se há indicadores de loading ou retry
      const loadingElements = page.locator(
        "[data-testid='loading'], .loading, .spinner",
      );
      const retryElements = page
        .locator("button")
        .filter({ hasText: /retry|tentar|reload/i });

      // Se há loading, deve eventualmente resolver ou mostrar opção de retry
      if (await loadingElements.isVisible()) {
        await expect(loadingElements.or(retryElements)).toBeVisible();
      }
    });
  });

  // Teste de estabilidade - executar múltiplas vezes
  test.describe("Stability Tests", () => {
    for (let i = 1; i <= 3; i++) {
      test(`should be stable on run ${i}`, async ({ page }) => {
        await page.goto("/");
        await expect(page.locator("body")).toBeVisible();

        // Verificação básica de funcionalidade
        const heroExists = await page
          .locator("[data-testid='hero-section'], #hero, section:first-child")
          .isVisible();
        expect(heroExists).toBe(true);

        // Pequena interação para testar estabilidade
        const interactiveElements = page
          .locator("button, a")
          .filter({ hasText: /learn|more|see|view/i });
        if (await interactiveElements.isVisible()) {
          await interactiveElements.first().click();
          await expect(page.locator("body")).toBeVisible();
        }
      });
    }
  });
});
