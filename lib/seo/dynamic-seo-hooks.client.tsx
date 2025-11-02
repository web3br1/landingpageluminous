// Client-side SEO hooks
// Must be imported in client components only

"use client";

import { useEffect } from "react";
import type { SEOConfig } from "./seo-optimizer";

export function useDynamicSEO(metadata: Partial<SEOConfig>) {
  useEffect(() => {
    // This would call the DynamicMetadataGenerator.updateClientMetadata
    // but we need to import it properly
    if (typeof document === "undefined") return;

    const { title, description } = metadata;

    if (title && typeof title === "string") {
      document.title = title;
    }

    if (description && typeof description === "string") {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      }
    }

    // Update Open Graph tags
    if (title && typeof title === "string") {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute("content", title);
      }
    }

    if (description && typeof description === "string") {
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute("content", description);
      }
    }
  }, [metadata]);
}

export function usePageTitle(title: string) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = title;
    }
  }, [title]);
}

export function useMetaDescription(description: string) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    }
  }, [description]);
}

export function useSEOPerformanceTracking(pageType: string) {
  useEffect(() => {
    if (typeof document === "undefined" || typeof performance === "undefined")
      return;

    // Track page load for SEO performance
    const trackLoadTime = () => {
      const navigationEntries = performance.getEntriesByType("navigation");
      const loadTime = navigationEntries[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (loadTime && "loadEventEnd" in loadTime && "fetchStart" in loadTime) {
        // This would be tracked in your analytics/metrics system
        console.log(
          `Page load time for ${pageType}:`,
          loadTime.loadEventEnd - loadTime.fetchStart,
        );
      }
    };

    if (document.readyState === "complete") {
      trackLoadTime();
    } else {
      window.addEventListener("load", trackLoadTime);
      return () => window.removeEventListener("load", trackLoadTime);
    }
  }, [pageType]);
}
