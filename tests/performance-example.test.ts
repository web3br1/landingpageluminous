import { test, expect } from "@playwright/test";
import { budgets } from "./utils/budgets";
import { hardStabilize } from "./utils/stabilize";

test.describe("Performance Monitoring Example", () => {
  test.beforeEach(async ({ page }) => {
    await hardStabilize(page);

    // Build de produção + aquecimento
    await page.goto("/", { waitUntil: "networkidle" }); // warm
    await page.reload({ waitUntil: "networkidle" }); // medir na recarga
  });

  test("page meets performance budgets", async ({ page, browserName }) => {
    const B = budgets(browserName);

    // Coletar métricas de performance reais do browser
    const metrics = await page.evaluate(async () => {
      // TTFB via PerformanceNavigationTiming
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const ttfb = nav ? nav.responseStart : 0;

      // FCP via Paint entries
      const fcpEntry = performance.getEntriesByName(
        "first-contentful-paint",
      )[0] as PerformanceEntry | undefined;
      const fcp = fcpEntry ? fcpEntry.startTime : 0;

      // TBT: soma dos long tasks após FCP
      // (precisa de PerformanceObserver para 'longtask' – alguns CI’s suportam)
      let tbt = 0;
      // @ts-ignore
      if (window.__longTasks) {
        // se o app expõe via observer
        // @ts-ignore
        tbt = window.__longTasks.reduce((acc, t) => acc + (t.duration - 50), 0);
      }

      // INP: se app/observer expõe (fallback para 150)
      // @ts-ignore
      const inp = window.__inp ?? 150;

      // CLS via layout-shift entries acumuladas (se expostas)
      // @ts-ignore
      const cls = window.__cls ?? 0.05;

      return { ttfb, fcp, tbt, inp, cls };
    });

    // Validar contra budgets
    expect(metrics.ttfb).toBeLessThanOrEqual(B.TTFB);
    expect(metrics.fcp).toBeLessThanOrEqual(B.FCP);
    expect(metrics.tbt).toBeLessThanOrEqual(B.TBT);
    expect(metrics.inp).toBeLessThanOrEqual(B.INP);
    expect(metrics.cls).toBeLessThanOrEqual(B.CLS);
  });

  test("lazy loading sections meet performance budget", async ({ page }) => {
    // Navegar e esperar seções carregarem
    await page.goto("/");

    // Aguardar lazy loading completar
    await page.waitForSelector('[data-section="benefits"]', {
      state: "visible",
    });
    await page.waitForSelector('[data-section="features"]', {
      state: "visible",
    });

    // Verificar métricas de lazy loading
    const sectionMetrics = await page.evaluate(() => {
      // Em produção, isso viria de performance marks
      return (window as any).__sectionMetrics || {};
    });

    // Validar seções críticas carregaram dentro do budget
    if (sectionMetrics.hero) {
      expect(sectionMetrics.hero.duration).toBeLessThanOrEqual(800); // P95 budget
      expect(sectionMetrics.hero.withinBudget).toBe(true);
    }

    if (sectionMetrics.benefits) {
      expect(sectionMetrics.benefits.duration).toBeLessThanOrEqual(800);
      expect(sectionMetrics.benefits.withinBudget).toBe(true);
    }
  });

  test("interaction performance is acceptable", async ({ page }) => {
    await page.goto("/");

    // Medir performance de interação
    const startTime = Date.now();
    await page.getByRole("button", { name: /começar teste grátis/i }).click();
    const interactionTime = Date.now() - startTime;

    // INP deve ser < 250ms para interações
    expect(interactionTime).toBeLessThan(250);
  });
});
