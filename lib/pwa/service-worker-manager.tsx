"use client";

import React, { useState, useEffect, createContext, useContext } from "react";

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  installPrompt: () => void;
  updateAvailable: boolean;
  updateServiceWorker: () => void;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  syncContent: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[PWA] Service Worker registered:", reg);

          // Check for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          setRegistration(reg);
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    }
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Install PWA
  const installPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("[PWA] Install outcome:", outcome);
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Update service worker
  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  // Send notification
  const sendNotification = (
    title: string,
    options: NotificationOptions = {},
  ) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const defaultOptions: NotificationOptions = {
        icon: "/images/logo.svg",
        badge: "/images/logo.svg",
        ...options,
      };

      if (registration) {
        registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
    }
  };

  // Request notification permission
  const requestNotificationPermission =
    async (): Promise<NotificationPermission> => {
      if (!("Notification" in window)) {
        return "denied";
      }

      const permission = await Notification.requestPermission();
      return permission;
    };

  // Sync content in background
  const syncContent = () => {
    if (
      "serviceWorker" in navigator &&
      registration &&
      "sync" in registration
    ) {
      (registration as any).sync
        .register("content-sync")
        .catch((error: any) => {
          console.log("[PWA] Background sync not supported or failed:", error);
        });
    }
  };

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    isOffline,
    installPrompt,
    updateAvailable,
    updateServiceWorker,
    sendNotification,
    requestNotificationPermission,
    syncContent,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

// PWA Install Button Component
interface PWAInstallButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function PWAInstallButton({
  children = "Instalar App",
  className,
  variant = "default",
  size = "default",
}: PWAInstallButtonProps) {
  const { isInstallable, installPrompt } = usePWA();

  if (!isInstallable) return null;

  return (
    <button
      onClick={installPrompt}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        variant === "default"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : variant === "outline"
            ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            : "hover:bg-accent hover:text-accent-foreground"
      } ${
        size === "sm"
          ? "h-9 px-3"
          : size === "lg"
            ? "h-11 px-8"
            : "h-10 px-4 py-2"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// PWA Status Indicator Component
interface PWAStatusIndicatorProps {
  showInstallButton?: boolean;
  showOfflineIndicator?: boolean;
  showUpdateIndicator?: boolean;
  className?: string;
}

export function PWAStatusIndicator({
  showInstallButton = true,
  showOfflineIndicator = true,
  showUpdateIndicator = true,
  className,
}: PWAStatusIndicatorProps) {
  const { isInstallable, isOffline, updateAvailable, updateServiceWorker } =
    usePWA();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Offline Indicator */}
      {showOfflineIndicator && isOffline && (
        <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          Offline
        </div>
      )}

      {/* Update Available */}
      {showUpdateIndicator && updateAvailable && (
        <button
          onClick={updateServiceWorker}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Update Available
        </button>
      )}

      {/* Install Button */}
      {showInstallButton && (
        <PWAInstallButton variant="outline" size="sm" className="text-xs">
          Install App
        </PWAInstallButton>
      )}
    </div>
  );
}

// Hook for background sync
export function useBackgroundSync() {
  const { syncContent } = usePWA();

  return {
    syncNow: syncContent,
    // Could add more sync management here
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const { sendNotification, requestNotificationPermission } = usePWA();
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const notify = (title: string, options?: NotificationOptions) => {
    sendNotification(title, options);
  };

  return {
    permission,
    requestPermission,
    notify,
    isSupported: "Notification" in window,
  };
}
