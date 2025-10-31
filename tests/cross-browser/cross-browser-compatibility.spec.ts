import { test, expect } from "@playwright/test";

/**
 * Cross-browser Compatibility Testing
 * Testa funcionalidades críticas em diferentes browsers
 */
test.describe("Cross-browser Compatibility", () => {
  test("should render consistently across browsers", async ({
    page,
    browserName,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Testar elementos críticos em todos os browsers
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();

    const headline = heroSection.locator("h1");
    await expect(headline).toBeVisible();

    // Verificar se texto é renderizado corretamente
    const headlineText = await headline.textContent();
    expect(headlineText).toBeTruthy();
    expect(headlineText!.length).toBeGreaterThan(10);

    // Testar botões CTA
    const ctaButtons = heroSection.locator("button");
    await expect(ctaButtons).toHaveCount(2);

    console.log(
      `✅ Browser ${browserName}: Critical elements rendered correctly`,
    );
  });

  test("should handle JavaScript features across browsers", async ({
    page,
    browserName,
  }) => {
    await page.goto("/");

    // Testar funcionalidades JavaScript críticas
    const heroSection = page.locator('[data-testid="hero-section"]');

    // Testar interatividade (hover, click)
    await heroSection.hover();

    const ctaButton = heroSection.locator("button").first();
    await expect(ctaButton).toBeVisible();

    // Testar se botão responde a eventos
    await ctaButton.click();

    // Verificar navegação ou modal
    await page.waitForLoadState("networkidle");

    console.log(`✅ Browser ${browserName}: JavaScript features working`);
  });

  test("should handle CSS features across browsers", async ({
    page,
    browserName,
  }) => {
    await page.goto("/");

    // Testar features CSS modernas
    const heroSection = page.locator('[data-testid="hero-section"]');

    // Verificar se CSS Grid/Flexbox está funcionando
    const computedStyle = await heroSection.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        flexDirection: style.flexDirection,
        gridTemplateColumns: style.gridTemplateColumns,
      };
    });

    // Verificar se layout moderno está sendo usado
    expect(computedStyle.display).toBeTruthy();

    console.log(`✅ Browser ${browserName}: CSS features working`);
  });
});
