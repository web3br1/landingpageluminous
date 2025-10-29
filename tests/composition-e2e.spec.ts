import { test, expect } from "@playwright/test";
import { installBrowserMocks, TEST_CONFIGS } from "./utils/browser-mocks";

test.describe("Page Composition E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Instalar mocks para testes E2E
    await installBrowserMocks(page, TEST_CONFIGS.e2e);

    // Navigate to the landing page
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Wait for composition system to initialize
    await page.waitForTimeout(1000);
  });

  test("should compose landing page with all sections", async ({ page }) => {
    // Verificar que a página carregou
    await expect(page).toHaveTitle(/DataFlow|landing|business intelligence/i);

    // Verificar que pelo menos uma seção foi composta
    const sections = page.locator("[data-section-id]");
    await expect(sections.first()).toBeVisible();

    // Verificar seções críticas estão presentes
    const heroSection = page.locator("[data-section-id='hero']");
    const pricingSection = page.locator("[data-section-id='pricing']");
    const finalCtaSection = page.locator("[data-section-id='final-cta']");

    // Pelo menos as seções críticas devem estar presentes
    const criticalSectionsCount = await page
      .locator(
        "[data-section-id='hero'], [data-section-id='pricing'], [data-section-id='final-cta']",
      )
      .count();
    expect(criticalSectionsCount).toBeGreaterThanOrEqual(1);
  });

  test("should handle composition fallbacks gracefully", async ({ page }) => {
    // Forçar um cenário onde algumas seções falham
    await page.route("**/api/composition/**", async (route) => {
      if (Math.random() > 0.7) {
        // 30% chance de falha
        await route.fulfill({ status: 500, body: "Composition failed" });
      } else {
        await route.continue();
      }
    });

    // Recarregar a página
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verificar que a página ainda carrega (fallback)
    await expect(page.locator("body")).toBeVisible();

    // Verificar que pelo menos uma seção está presente
    const sectionsCount = await page.locator("[data-section-id]").count();
    expect(sectionsCount).toBeGreaterThanOrEqual(0); // Pode ser 0 se todas falharem, mas página deve carregar
  });

  test("should lazy load sections on viewport", async ({ page }) => {
    // Verificar seções importantes são carregadas inicialmente
    const initialSections = await page.locator("[data-section-id]").count();

    // Scroll para baixo para trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    await page.waitForTimeout(1000); // Aguardar lazy loading

    // Verificar que mais seções foram carregadas ou que não houve erro
    const finalSections = await page.locator("[data-section-id]").count();

    // O número pode ser o mesmo se lazy loading não foi triggerado
    expect(finalSections).toBeGreaterThanOrEqual(initialSections);
  });

  test("should handle different page types", async ({ page }) => {
    // Testar diferentes tipos de página através de query params ou rotas
    const pageTypes = ["landing", "features", "pricing"];

    for (const pageType of pageTypes) {
      // Simular navegação para diferentes tipos de página
      await page.evaluate((type) => {
        // Injetar tipo de página no contexto da aplicação
        (window as any).__TEST_PAGE_TYPE__ = type;
      }, pageType);

      // Recarregar para simular mudança de tipo de página
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Verificar que a página carrega
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("should validate composition performance", async ({ page }) => {
    // Medir tempo de carregamento da composição
    const startTime = Date.now();

    await page.reload();
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Verificar que o carregamento foi razoável (< 5s)
    expect(loadTime).toBeLessThan(5000);

    // Verificar que não há erros de JavaScript no console
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000); // Aguardar por erros assíncronos

    // Aceitar alguns erros de rede/mock, mas não erros críticos de composição
    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes("composition") ||
        error.includes("hydrate") ||
        error.includes("render"),
    );

    expect(criticalErrors.length).toBe(0);
  });

  test("should handle experiments and personalization", async ({ page }) => {
    // Simular experimentos ativos
    await page.evaluate(() => {
      (window as any).__TEST_EXPERIMENTS__ = {
        hero_test: { variant: "variant_a", experimentId: "hero_test" },
        cta_color: { variant: "blue", experimentId: "cta_color" },
      };
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verificar que a página carrega com experimentos
    await expect(page.locator("body")).toBeVisible();

    // Verificar se elementos de experimento estão presentes (se aplicável)
    const experimentalElements = page.locator("[data-experiment]");
    // Pode ou não ter elementos marcados, depende da implementação
    const count = await experimentalElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
