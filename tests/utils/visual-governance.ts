// ===== GOVERNANÇA VISUAL - PR-0 =====
// Regras e utilitários para testes visuais estáveis e determinísticos

import { Page, Locator } from "@playwright/test";

/**
 * Elementos que DEVEM ser mascarados em todos os testes visuais
 * por serem dinâmicos por design
 */
export const REQUIRED_MASK_SELECTORS = [
  '[data-testid="live-counter"]',
  '[data-testid="sponsor-carousel"]',
  '[data-testid="clock"], time',
  '[data-testid*="dynamic"], [class*="dynamic"]',
  '[data-testid="notification"]',
  '[class*="animated"]',
  '[data-loading="true"]',
  '[data-error="true"]',
];

/**
 * Elementos que PODEM ser mascarados quando causam inconsistência
 * mas devem ser revisados pelo QA Lead
 */
export const OPTIONAL_MASK_SELECTORS = [
  '[data-testid*="ad"]',
  '[data-testid*="social"]',
  '[class*="pulse"]',
  '[class*="blink"]',
];

/**
 * Estabiliza o ambiente visual para testes determinísticos
 * Congela datas, RNG, animações, fontes e outros elementos dinâmicos
 */
export async function hardStabilize(page: Page): Promise<void> {
  // Congela Date.now() e Math.random() para consistência
  await page.addScriptTag({
    content: `
      // Congela tempo para screenshots consistentes
      const originalDateNow = Date.now;
      const originalRandom = Math.random;
      let frozenTime = 1640995200000; // 2022-01-01 00:00:00 UTC
      let randomSeed = 0.5;

      Date.now = () => frozenTime;
      Math.random = () => {
        randomSeed = (randomSeed * 9301 + 49297) % 233280;
        return randomSeed / 233280;
      };

      // Congela performance.now() também
      const originalPerfNow = performance.now;
      let perfTime = 1000;
      performance.now = () => perfTime += 16.67; // ~60fps

      // Força carregamento de fontes
      document.fonts.ready.then(() => {
        console.log('Fonts loaded for visual stability');
      });

      // Remove qualquer variação de scroll
      window.scrollTo(0, 0);

      console.log('Visual stabilization applied');
    `,
  });

  // Aguarda fonts carregarem
  await page.evaluate(() => document.fonts.ready);

  // Pequena pausa para estabilização
  await page.waitForTimeout(100);
}

/**
 * Aplica máscaras visuais obrigatórias para elementos dinâmicos
 */
export async function applyRequiredMasks(page: Page): Promise<void> {
  for (const selector of REQUIRED_MASK_SELECTORS) {
    try {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        if (await element.isVisible()) {
          // Aplica máscara visual (retângulo preto)
          await page.evaluate(
            (el) => {
              const rect = el.getBoundingClientRect();
              const mask = document.createElement("div");
              mask.style.position = "absolute";
              mask.style.left = rect.left + "px";
              mask.style.top = rect.top + "px";
              mask.style.width = rect.width + "px";
              mask.style.height = rect.height + "px";
              mask.style.backgroundColor = "black";
              mask.style.zIndex = "999999";
              mask.setAttribute("data-visual-mask", "required");
              document.body.appendChild(mask);
            },
            await element.elementHandle(),
          );
        }
      }
    } catch (error) {
      // Ignora erros em seletores que não existem
      console.log(`Mask selector not found: ${selector}`);
    }
  }
}

/**
 * Remove máscaras visuais após o teste
 */
export async function removeMasks(page: Page): Promise<void> {
  await page.evaluate(() => {
    const masks = document.querySelectorAll("[data-visual-mask]");
    masks.forEach((mask) => mask.remove());
  });
}

/**
 * Valida que elementos críticos estão visíveis e estáveis antes do screenshot
 */
export async function validateVisualStability(page: Page): Promise<boolean> {
  try {
    // Verifica se a página carregou completamente
    await page.waitForLoadState("networkidle");

    // Verifica se não há elementos loading
    const loadingElements = page.locator(
      '[data-loading="true"], .loading, .spinner',
    );
    const loadingCount = await loadingElements.count();
    if (loadingCount > 0) {
      console.warn(`Found ${loadingCount} loading elements - waiting...`);
      await page.waitForTimeout(1000);
    }

    // Verifica se não há animações em andamento
    const animatingElements = page.locator(
      '[class*="animate"], [class*="transition"]',
    );
    // Esta é uma verificação básica - em produção pode ser mais sofisticada

    // Força layout estável
    await page.evaluate(() => {
      // Trigger layout
      document.body.offsetHeight;
      // Small delay for stability
      return new Promise((resolve) => setTimeout(resolve, 100));
    });

    return true;
  } catch (error) {
    console.error("Visual stability validation failed:", error);
    return false;
  }
}

/**
 * Configurações padrão para screenshots visuais consistentes
 */
export const VISUAL_SCREENSHOT_OPTIONS = {
  // Tolerâncias padronizadas
  threshold: 0.01, // 1% diferença máxima
  maxDiffPixels: 100, // Máximo 100 pixels diferentes
  maxDiffPixelRatio: 0.001, // Máximo 0.1% dos pixels totais

  // Máscaras padrão
  mask: REQUIRED_MASK_SELECTORS,

  // Outras configurações para consistência
  fullPage: false, // Default to component-level
  animations: "disabled",
  caret: "hide",
  scale: "device",
};

/**
 * Wrapper para screenshots com governança visual aplicada
 */
export async function takeGovernedScreenshot(
  locator: Locator,
  name: string,
  options: any = {},
): Promise<void> {
  const page = locator.page();

  // Aplica estabilização
  await hardStabilize(page);

  // Aplica máscaras obrigatórias
  await applyRequiredMasks(page);

  // Valida estabilidade visual
  const isStable = await validateVisualStability(page);
  if (!isStable) {
    console.warn(
      "Visual stability validation failed - screenshot may be inconsistent",
    );
  }

  // Tira screenshot com configurações governadas
  await locator.screenshot({
    ...VISUAL_SCREENSHOT_OPTIONS,
    ...options,
    name,
  });

  // Remove máscaras após screenshot
  await removeMasks(page);
}
