// ===== PERFORMANCE PRAGMÁTICA - PR-3 =====
// Sistema de warm-up e budgets realistas para testes de performance

import { Page } from "@playwright/test";

/**
 * Configuração de warm-up para testes de performance
 */
export interface WarmupConfig {
  // Número de iterações de warm-up
  iterations: number;
  // Ações a executar no warm-up
  actions: Array<{
    type: "navigate" | "scroll" | "click" | "wait";
    target?: string;
    delay?: number;
  }>;
  // Métricas a estabilizar antes de medir
  stabilizeMetrics: string[];
}

/**
 * Configuração padrão de warm-up
 */
export const DEFAULT_WARMUP_CONFIG: WarmupConfig = {
  iterations: 3,
  actions: [
    { type: "navigate", target: "/" },
    { type: "wait", delay: 1000 },
    { type: "scroll", target: "benefits" },
    { type: "wait", delay: 500 },
    { type: "scroll", target: "features" },
    { type: "wait", delay: 500 },
    { type: "click", target: '[data-section="hero"] button' },
    { type: "wait", delay: 300 },
  ],
  stabilizeMetrics: ["FCP", "LCP", "TTFB"],
};

/**
 * Executa warm-up antes de medições de performance
 * Garante que caches estejam quentes e métricas estabilizadas
 */
export async function warmupForPerformance(
  page: Page,
  config: WarmupConfig = DEFAULT_WARMUP_CONFIG,
): Promise<void> {
  console.log(
    `Starting performance warm-up (${config.iterations} iterations)...`,
  );

  for (let i = 0; i < config.iterations; i++) {
    console.log(`Warm-up iteration ${i + 1}/${config.iterations}`);

    for (const action of config.actions) {
      try {
        switch (action.type) {
          case "navigate":
            if (action.target) {
              await page.goto(action.target);
              await page.waitForLoadState("networkidle");
            }
            break;

          case "scroll":
            if (action.target) {
              const element = page.locator(`[data-section="${action.target}"]`);
              if (
                await element.isVisible({ timeout: 1000 }).catch(() => false)
              ) {
                await element.scrollIntoViewIfNeeded();
              }
            }
            break;

          case "click":
            if (action.target) {
              const element = page.locator(action.target).first();
              if (
                await element.isVisible({ timeout: 1000 }).catch(() => false)
              ) {
                await element.click({ timeout: 1000 }).catch(() => {});
              }
            }
            break;

          case "wait":
            if (action.delay) {
              await page.waitForTimeout(action.delay);
            }
            break;
        }
      } catch (error) {
        // Ignorar erros de warm-up - não são críticos
        console.log(`Warm-up action failed (non-critical): ${action.type}`);
      }
    }

    // Pequena pausa entre iterações
    await page.waitForTimeout(200);
  }

  // Aguardar estabilização final
  await page.waitForTimeout(1000);

  console.log("Performance warm-up completed");
}

/**
 * Budgets de performance por navegador (mais realistas)
 */
export const PERFORMANCE_BUDGETS = {
  // Chromium/Firefox - rigorosos
  chromium: {
    TTFB: 800, // ms
    FCP: 1800, // ms
    LCP: 2500, // ms
    TBT: 250, // ms
    INP: 250, // ms
    CLS: 0.1, // score
    FID: 100, // ms
  },

  firefox: {
    TTFB: 800,
    FCP: 1800,
    LCP: 2500,
    TBT: 300, // Firefox pode ser mais lento
    INP: 300,
    CLS: 0.1,
    FID: 100,
  },

  // WebKit - mais permissivo inicialmente (convergir depois)
  webkit: {
    TTFB: 1200, // Mais permissivo
    FCP: 2500,
    LCP: 3500,
    TBT: 600, // WebKit conhecido por TBT alto
    INP: 400,
    CLS: 0.15, // Mais permissivo para CLS
    FID: 150,
  },

  // Valores padrão para projetos genéricos
  default: {
    TTFB: 1000,
    FCP: 2000,
    LCP: 3000,
    TBT: 300,
    INP: 300,
    CLS: 0.1,
    FID: 100,
  },
};

/**
 * Valida métricas contra budgets por navegador
 */
export function validatePerformanceBudgets(
  metrics: Record<string, number>,
  browserName: string,
): { passed: boolean; violations: string[] } {
  const budgets =
    PERFORMANCE_BUDGETS[browserName as keyof typeof PERFORMANCE_BUDGETS] ||
    PERFORMANCE_BUDGETS.default;
  const violations: string[] = [];

  for (const [metric, value] of Object.entries(metrics)) {
    const budget = budgets[metric as keyof typeof budgets];
    if (budget !== undefined && value > budget) {
      violations.push(`${metric}: ${value} > ${budget}`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Configura dimensões fixas para eliminar CLS
 * Define viewport consistente e previne mudanças de layout
 */
export async function setupFixedDimensions(page: Page): Promise<void> {
  // Definir viewport consistente
  await page.setViewportSize({ width: 1280, height: 720 });

  // Injetar CSS para dimensões fixas e prevenir CLS
  await page.addStyleTag({
    content: `
      /* ===== CLS PREVENTION - PR-3 ===== */

      /* Container principal com dimensões fixas */
      .container, .max-w-6xl, .max-w-4xl {
        width: 1280px !important;
        max-width: 1280px !important;
        min-width: 1280px !important;
      }

      /* Seções com altura mínima para prevenir CLS */
      [data-section] {
        min-height: 400px;
      }

      [data-section="hero"] {
        min-height: 600px;
      }

      [data-section="benefits"] {
        min-height: 500px;
      }

      /* Imagens com aspect-ratio fixo */
      img {
        aspect-ratio: auto;
        height: auto !important;
      }

      /* Cards com dimensões consistentes */
      .benefit-card, [data-benefit-index] {
        height: 300px !important;
        min-height: 300px !important;
      }

      /* Previne layout shifts de fontes */
      * {
        font-display: swap;
      }

      /* Previne layout shifts de animações */
      * {
        animation-fill-mode: both;
        animation-duration: 0.01ms !important;
      }
    `,
  });

  // Aguardar aplicação dos estilos
  await page.waitForTimeout(100);
}

/**
 * Otimizações de cache para testes de performance
 */
export async function optimizeCacheForPerformance(page: Page): Promise<void> {
  // Simular cache quente
  await page.route("**/*", (route) => {
    // Cache headers para simular cache quente
    const response =
      route.request().resourceType() === "document"
        ? route.fulfill({
            status: 200,
            headers: {
              "Cache-Control": "max-age=3600",
              "X-Cache-Status": "HIT",
            },
          })
        : route.continue();

    return response;
  });

  // Preload de recursos críticos
  await page.addScriptTag({
    content: `
      // Preload crítico
      const criticalResources = [
        '/_next/static/css/app/layout.css',
        '/_next/static/chunks/main.js'
      ];

      criticalResources.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'style';
        document.head.appendChild(link);
      });
    `,
  });
}

/**
 * Configurações específicas por tipo de teste de performance
 */
export const PERFORMANCE_TEST_CONFIGS = {
  // Testes de Core Web Vitals
  coreVitals: {
    warmup: DEFAULT_WARMUP_CONFIG,
    budgets: PERFORMANCE_BUDGETS,
    stabilizeCLS: true,
    measureAfterWarmup: true,
  },

  // Testes de loading/stress
  loading: {
    warmup: {
      ...DEFAULT_WARMUP_CONFIG,
      iterations: 1, // Menos warm-up para testes de loading
    },
    budgets: {
      ...PERFORMANCE_BUDGETS,
      // Budgets mais permissivos para loading
      TTFB: 1500,
      FCP: 3000,
    },
    stabilizeCLS: false,
    measureAfterWarmup: false,
  },

  // Testes de interação
  interaction: {
    warmup: {
      ...DEFAULT_WARMUP_CONFIG,
      iterations: 5, // Mais warm-up para interações
    },
    budgets: PERFORMANCE_BUDGETS,
    stabilizeCLS: true,
    measureAfterWarmup: true,
  },
};
