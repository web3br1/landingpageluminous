import { test, expect } from "@playwright/test";

/**
 * Network Conditions Testing
 * Testa comportamento em diferentes condições de rede
 */
test.describe("Network Conditions", () => {
  test("should handle slow 3G connection", async ({ page }) => {
    // Simular conexão 3G lenta
    await page.route("**/*", async (route) => {
      // Adicionar delay de 500ms para simular latência
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;

    // Em 3G lento, deve ainda carregar (mesmo que devagar)
    expect(loadTime).toBeGreaterThan(1000); // Pelo menos 1 segundo devido ao delay

    // Verificar se elementos críticos ainda carregam
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();

    console.log(`✅ Slow 3G simulation: ${loadTime}ms load time`);
  });

  test("should handle intermittent connection", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Simular conexão instável - alternar online/offline rapidamente
    for (let i = 0; i < 3; i++) {
      await context.setOffline(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      await context.setOffline(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Página deve se recuperar
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();

    console.log("✅ Intermittent connection handled");
  });

  test("should handle large payload downloads", async ({ page }) => {
    // Simular download lento de recursos grandes
    await page.route("**/*.{png,jpg,jpeg,gif,webp,mp4,webm}", async (route) => {
      // Simular download lento para imagens/vídeos
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;

    // Deve carregar mesmo com recursos lentos
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();

    console.log(`✅ Large payload simulation: ${loadTime}ms with slow assets`);
  });

  test("should handle DNS failures gracefully", async ({ page }) => {
    // Simular falha de DNS para recursos externos
    await page.route("https://fonts.googleapis.com/**", (route) =>
      route.abort(),
    );
    await page.route("https://fonts.gstatic.com/**", (route) => route.abort());

    await page.goto("/");

    // Página deve carregar mesmo sem fonts externas
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();

    // Texto deve estar legível (fallback fonts)
    const headline = page.locator("h1");
    await expect(headline).toBeVisible();

    console.log("✅ DNS failures handled (external fonts blocked)");
  });
});
