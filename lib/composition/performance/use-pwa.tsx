"use client";

import { useState, useEffect } from "react";

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    updateAvailable: false,
    registration: null,
  });

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;

    setPwaState((prev) => ({
      ...prev,
      isInstalled: isStandalone || isInWebAppiOS,
    }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPwaState((prev) => ({ ...prev, isInstallable: true }));
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setPwaState((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
      }));
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () =>
      setPwaState((prev) => ({ ...prev, isOffline: false }));
    const handleOffline = () =>
      setPwaState((prev) => ({ ...prev, isOffline: true }));

    // Listen for service worker updates
    const handleUpdateAvailable = () => {
      setPwaState((prev) => ({ ...prev, updateAvailable: true }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("sw-update-available", handleUpdateAvailable);

    // Check service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setPwaState((prev) => ({ ...prev, registration }));
        }
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("sw-update-available", handleUpdateAvailable);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setPwaState((prev) => ({ ...prev, isInstallable: false }));
        setDeferredPrompt(null);
        return true;
      }
    } catch (error) {
      console.error("Error installing PWA:", error);
    }

    return false;
  };

  const updateServiceWorker = async () => {
    if (!pwaState.registration) return false;

    try {
      // Skip waiting for the new service worker
      await pwaState.registration.update();
      window.location.reload();
      return true;
    } catch (error) {
      console.error("Error updating service worker:", error);
      return false;
    }
  };

  const sendMessageToSW = (message: unknown) => {
    if (pwaState.registration?.active) {
      pwaState.registration.active.postMessage(message);
    }
  };

  return {
    ...pwaState,
    installPWA,
    updateServiceWorker,
    sendMessageToSW,
    canInstall: pwaState.isInstallable && !pwaState.isInstalled,
    needsUpdate: pwaState.updateAvailable,
  };
}

// Hook for managing offline/online state
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default to online for SSR safety

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType:
      (navigator as any).connection?.effectiveType || "unknown",
  };
}

// Hook for managing cache operations
export function useCacheManager() {
  const clearCache = async (cacheName?: string) => {
    try {
      if (cacheName) {
        await caches.delete(cacheName);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      return true;
    } catch (error) {
      console.error("Error clearing cache:", error);
      return false;
    }
  };

  const getCacheSize = async () => {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              const contentLength = response.headers.get("content-length");
              if (contentLength) {
                totalSize += parseInt(contentLength, 10);
              }
            }
          } catch (error) {
            // Ignore errors for individual cache entries
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error("Error calculating cache size:", error);
      return 0;
    }
  };

  return {
    clearCache,
    getCacheSize,
  };
}
