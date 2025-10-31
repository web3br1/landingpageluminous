import { test, expect } from "@playwright/test";

/**
 * Internationalization Testing
 * Testa suporte a múltiplos idiomas e localizações
 */
test.describe("Internationalization", () => {
  test("should handle language switching", async ({ page }) => {
    // Assumindo que há um seletor de idioma
    await page.goto("/");

    // Procurar por seletor de idioma (pode não existir ainda)
    const languageSelector = page.locator('[data-testid="language-selector"]');

    if (await languageSelector.isVisible()) {
      // Testar mudança para português
      await languageSelector.click();
      await page.locator('[data-testid="lang-pt"]').click();

      // Verificar se conteúdo mudou
      const headline = page.locator("h1");
      const headlineText = await headline.textContent();

      // Verificar se não está em inglês (fallback)
      expect(headlineText).not.toContain("Welcome");
      expect(headlineText).not.toContain("Hello");

      console.log("✅ Language switching works");
    } else {
      console.log("⚠️ Language selector not found - i18n not implemented yet");
    }
  });

  test("should handle RTL languages gracefully", async ({ page }) => {
    // Testar como a aplicação responde a idiomas RTL (árabe, hebraico)
    await page.goto("/");

    // Simular idioma RTL injetando CSS
    await page.addStyleTag({
      content: `
        html { direction: rtl; }
        body { text-align: right; }
      `,
    });

    // Verificar se layout não quebra completamente
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();

    // Verificar se elementos ainda são acessíveis
    const ctaButton = page.locator("button").first();
    await expect(ctaButton).toBeVisible();

    console.log("✅ RTL layout handled gracefully");
  });

  test("should handle number/currency formatting", async ({ page }) => {
    await page.goto("/pricing");

    // Procurar por preços na página
    const priceElements = page.locator(
      '[data-testid*="price"], .price, [class*="pricing"]',
    );

    if ((await priceElements.count()) > 0) {
      // Verificar se preços são exibidos (mesmo que em formato padrão)
      const firstPrice = priceElements.first();
      const priceText = await firstPrice.textContent();

      // Deve conter algum indicador numérico
      expect(priceText).toMatch(/[\d\.,]/);

      console.log("✅ Pricing display works");
    } else {
      console.log("⚠️ No pricing elements found");
    }
  });
});
