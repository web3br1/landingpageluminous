import { Page, BrowserContext, test } from "@playwright/test";

/**
 * Test Hygiene Helpers - Garantir isolamento entre testes
 * Evita estado sujo que causa lentidão e flakiness
 */

// Limpeza completa de estado entre testes
export async function cleanTestState(page: Page, context?: BrowserContext) {
  try {
    // 1. Limpar localStorage/sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 2. Limpar cookies se context fornecido
    if (context) {
      await context.clearCookies();
    }

    // 3. Reset viewport (alguns testes podem alterar)
    await page.setViewportSize({ width: 1280, height: 720 });

    // 4. Aguardar rede idle para garantir limpeza completa
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
      // Ignorar timeout - rede pode já estar idle
    });
  } catch (error) {
    console.warn(
      "Warning during test state cleanup:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Helper para garantir que não há requisições pendentes
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch (error) {
    // Rede pode já estar idle ou ter requests long-running aceitáveis
    console.warn("Network not fully idle within timeout, proceeding...");
  }
}

// Helper para fechar contexto/browser adequadamente
export async function safeCloseContext(context: BrowserContext) {
  try {
    // Aguardar um pouco para requests pendentes
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Forçar fechamento de todas as páginas
    const pages = context.pages();
    await Promise.all(pages.map((page) => page.close().catch(() => {})));

    await context.close();
  } catch (error) {
    console.warn(
      "Warning during context cleanup:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Setup global para todos os testes - compatível com Playwright
export default async function globalSetup() {
  // Configurações globais se necessário
  console.log("🔧 Global test setup initialized");
}

// Teardown global - compatível com Playwright
export async function globalTeardown() {
  // Limpeza global se necessário
  console.log("🧹 Global test teardown completed");
}

// Hooks para uso em arquivos de teste individuais
export function setupTestIsolation() {
  // Hook beforeEach para limpeza
  test.beforeEach(async ({ page, context }) => {
    await cleanTestState(page, context);
  });

  // Hook afterEach para limpeza adicional
  test.afterEach(async ({ page, context }) => {
    try {
      // Aguardar rede idle antes de finalizar
      await waitForNetworkIdle(page, 3000);
    } catch (error) {
      // Ignorar erros de cleanup
    }
  });
}

// Hook específico para testes visuais - congela animações e força prefs
export async function freezeAnimationsForScreenshots(page: Page) {
  // Forçar prefers-reduced-motion no CSS
  await page.addStyleTag({
    content: `
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* Forçar reduced motion sempre para testes visuais */
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
        transform: none !important; /* Evitar transforms animados */
      }

      /* Padronizar fonte para consistência visual */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-variant-numeric: normal !important;
      }
    `,
  });

  // Congelar timers e random do browser
  await page.evaluate(() => {
    // Mock Date.now para screenshots consistentes
    const originalNow = Date.now;
    const frozenTime = originalNow();
    (window as any).originalDateNow = originalNow;
    Date.now = () => frozenTime;

    // Mock Math.random para consistência
    const originalRandom = Math.random;
    let randomSeed = 0.12345; // Seed consistente
    (window as any).originalRandom = originalRandom;
    Math.random = () => {
      randomSeed = (randomSeed * 9301 + 49297) % 233280;
      return randomSeed / 233280;
    };

    // Mock performance.now se disponível
    if (performance && performance.now) {
      const originalNow = performance.now;
      const perfTime = 1000; // Tempo consistente
      (window as any).originalPerfNow = originalNow;
      performance.now = () => perfTime;
    }
  });

  // Padronizar viewport e configurações
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
}

// Função para verificar determinismo visual
export async function checkVisualDeterminism(
  page: Page,
  selector: string,
  threshold = 0.3,
) {
  // Tira duas screenshots rápidas e compara
  const screenshot1 = await page.screenshot({ fullPage: true });
  await page.waitForTimeout(100); // Pequena pausa
  const screenshot2 = await page.screenshot({ fullPage: true });

  // Calcular diferença simples (em bytes diferentes)
  const diffBytes = screenshot1.reduce(
    (diff, byte, i) => diff + (byte !== screenshot2[i] ? 1 : 0),
    0,
  );

  const diffPercent = (diffBytes / screenshot1.length) * 100;

  console.log(`📊 Determinismo visual: ${diffPercent.toFixed(3)}% diferença`);

  return diffPercent <= threshold;
}
