import { test, expect } from "@playwright/test";
import { hardStabilize } from "./utils/stabilize";
import { mockCoreRoutes } from "./utils/mock-routes";

test.describe("Visual Regression Example", () => {
  test.beforeEach(async ({ page }) => {
    await hardStabilize(page);
    await mockCoreRoutes(page);
  });

  test("hero section looks correct", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveScreenshot("hero.png", {
      fullPage: true,
      mask: [
        page.locator('[data-testid="hero-text-block"]'), // Mascara texto dinâmico
        page.locator('[data-testid="live-counter"]'),
        page.locator('[data-testid="sponsor-carousel"]'),
        page.locator('time,[data-testid="clock"]'),
        page.locator('[data-testid="ad-slot"]'),
      ],
    });
  });

  test("benefits section with content variations", async ({ page }) => {
    await page.goto("/");

    // Testar com dados diferentes (usando MSW)
    await page.route("**/api/benefits", (r) =>
      r.fulfill({
        json: [
          {
            id: "automation",
            title: "Automação Total",
            description: "Elimine tarefas repetitivas com IA",
          },
          {
            id: "ai",
            title: "IA Avançada",
            description: "Insights inteligentes em tempo real",
          },
          {
            id: "security",
            title: "Segurança Máxima",
            description: "Proteção de dados enterprise-grade",
          },
        ],
      }),
    );

    await expect(page.locator('[data-section="benefits"]')).toHaveScreenshot(
      "benefits-dynamic.png",
      {
        mask: [
          page.locator('[data-testid="benefit-counter"]'),
          page.locator('svg[data-testid*="icon"]'),
        ],
      },
    );
  });
});
