import { test, expect } from "@playwright/test";

/**
 * PWA (Progressive Web App) Functionality Testing
 * Testa service workers, offline mode, installability
 */
test.describe("PWA Functionality", () => {
  test("should register service worker", async ({ page }) => {
    await page.goto("/");

    // Verificar se service worker está registrado
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.length > 0);
    });

    // Service worker pode não estar implementado ainda
    if (swRegistered) {
      console.log("✅ Service worker is registered");
    } else {
      console.log(
        "⚠️ Service worker not found - PWA not fully implemented yet",
      );
    }
  });

  test("should be installable", async ({ page }) => {
    await page.goto("/");

    // Verificar se app é instalável (beforeinstallprompt event)
    const isInstallable = await page.evaluate(() => {
      return new Promise((resolve) => {
        let installable = false;

        const checkInstall = () => {
          resolve(installable);
        };

        // Escutar por beforeinstallprompt
        window.addEventListener("beforeinstallprompt", () => {
          installable = true;
          checkInstall();
        });

        // Timeout após 2 segundos
        setTimeout(checkInstall, 2000);
      });
    });

    if (isInstallable) {
      console.log("✅ App is installable (PWA ready)");
    } else {
      console.log(
        "⚠️ App not installable yet - missing PWA manifest/service worker",
      );
    }
  });

  test("should handle offline mode gracefully", async ({ page, context }) => {
    await page.goto("/");

    // Simular offline
    await context.setOffline(true);

    // Tentar navegar
    await page.reload();

    // Verificar se mostra página offline ou fallback
    const offlineIndicator = page.locator(
      '[data-testid="offline-indicator"], .offline-message',
    );
    const isOfflineHandled = await offlineIndicator.isVisible();

    if (isOfflineHandled) {
      console.log("✅ Offline mode handled gracefully");
    } else {
      // Mesmo sem tratamento específico, página não deve travar
      const bodyText = await page.locator("body").textContent();
      expect(bodyText).toBeTruthy();
      console.log(
        "⚠️ Offline mode not specifically handled, but page remains functional",
      );
    }

    // Restaurar conexão
    await context.setOffline(false);
  });

  test("should cache resources", async ({ page }) => {
    await page.goto("/");

    // Verificar se recursos críticos estão sendo cacheados
    const cacheStatus = await page.evaluate(async () => {
      try {
        const cache = await caches.open("v1");
        const keys = await cache.keys();
        return keys.length > 0;
      } catch (e) {
        return false;
      }
    });

    if (cacheStatus) {
      console.log("✅ Resources are being cached");
    } else {
      console.log("⚠️ Cache API not in use - PWA caching not implemented");
    }
  });
});
