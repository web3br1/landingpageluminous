"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production and if supported
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Register service worker with error handling
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Service worker registered:", registration.scope);

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available
                  console.log(
                    "[SW] New version available, dispatching update event",
                  );
                  window.dispatchEvent(new CustomEvent("sw-update-available"));
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data && event.data.type === "CACHE_UPDATED") {
              console.log("[SW] Cache updated:", event.data.payload);
            }
          });
        })
        .catch((error) => {
          console.warn(
            "[SW] Service worker registration failed:",
            error.message,
          );
          // Don't throw error - service worker is not critical for app functionality
        });

      // Handle controller change (when new SW takes control)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[SW] Service worker controller changed, reloading...");
        window.location.reload();
      });
    } else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // In development or non-production environments: ensure NO SW is active
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            console.log(
              "[SW] Unregistering service worker in development:",
              registration.scope,
            );
            registration.unregister();
          });
        })
        .catch((error) => {
          console.warn(
            "[SW] Failed to unregister service workers:",
            error.message,
          );
        });

      // Also clear any caches that might be left over
      if ("caches" in window) {
        caches
          .keys()
          .then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              if (
                cacheName.includes("static-") ||
                cacheName.includes("dynamic-")
              ) {
                console.log("[SW] Clearing cache in development:", cacheName);
                caches.delete(cacheName);
              }
            });
          })
          .catch((error) => {
            console.warn("[SW] Failed to clear caches:", error.message);
          });
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
