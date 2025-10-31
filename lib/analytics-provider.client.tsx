"use client";

import React, { useEffect } from "react";
import { consent } from "./analytics-core";
import {
  safeWindowAccess,
  safeDocumentAccess,
  safeNavigatorAccess,
} from "@/lib/utils/browser-api-helpers";

// Componente Plausible Provider (client-only) - Compatible with Next.js 16
export const PlausibleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    // Only initialize on client side and with consent
    if (typeof window === "undefined" || !consent.hasAnalytics()) {
      return;
    }

    const initPlausible = async () => {
      try {
        // Dynamic import for better performance and compatibility
        const { default: Plausible } = await import("plausible-tracker");

        const plausibleDomain =
          process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "dataflow.com.br";

        // Initialize Plausible with configuration
        const plausible = Plausible({
          domain: plausibleDomain,
          // Disable automatic pageview tracking - we'll handle it manually
          trackLocalhost: process.env.NODE_ENV === "development",
          // Additional configuration for privacy
          apiHost: "https://plausible.io",
        });

        // Enable tracking
        plausible.enableAutoPageviews();
        plausible.enableAutoOutboundTracking();

        // Make plausible available globally for analytics-core.ts
        (window as any).plausible = plausible.trackEvent;

        console.log("Plausible analytics initialized", {
          domain: plausibleDomain,
        });
      } catch (error) {
        console.warn("Failed to initialize Plausible analytics:", error);
      }
    };

    initPlausible();
  }, []);

  return <>{children}</>;
};
