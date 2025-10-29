import { Page } from "@playwright/test";

export async function hardStabilize(page: Page) {
  await page.addInitScript(() => {
    // relógio fixo e Math.random determinístico
    // @ts-ignore
    window.__TEST_FIXED_DATE__ = new Date("2025-01-01T12:00:00Z");
    const _Date = Date;
    // @ts-ignore
    (globalThis as any).Date = class extends _Date {
      constructor(...a: any[]) {
        super(a.length ? a[0] : (globalThis as any).__TEST_FIXED_DATE__);
      }
      static now() {
        return new _Date((globalThis as any).__TEST_FIXED_DATE__).getTime();
      }
    };
    let x = 42;
    Math.random = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  });

  // desliga animação/transição/caret e força fonte estável
  await page.addStyleTag({
    content: `
    * {
      transition:none !important;
      animation:none !important;
      caret-color:transparent !important;
    }
    html {
      scroll-behavior:auto !important;
    }
    @font-face {
      font-family:'__e2e';
      src: local('Arial');
      font-display: swap;
    }
    html,body,*{
      font-family:'__e2e', system-ui, sans-serif !important;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
    }
  `,
  });

  await page.waitForLoadState("networkidle");
  await page.evaluate(
    () =>
      new Promise((r) => {
        // Fallback for browsers that don't support requestIdleCallback (like WebKit)
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => r(null));
        } else {
          setTimeout(() => r(null), 16); // ~1 frame at 60fps
        }
      }),
  );
}
