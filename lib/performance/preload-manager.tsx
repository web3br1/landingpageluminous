// Preload Manager for Critical Resources
// Dynamically manages preload hints for better performance

"use client";

import React, { useEffect } from "react";

export interface PreloadResource {
  href: string;
  as: "script" | "style" | "font" | "image" | "fetch" | "document";
  type?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  media?: string;
  priority?: "high" | "low" | "auto";
}

export interface PreloadConfig {
  critical: PreloadResource[];
  high: PreloadResource[];
  medium: PreloadResource[];
  low: PreloadResource[];
}

class PreloadManager {
  private loadedResources = new Set<string>();
  private preloadQueue: PreloadResource[] = [];

  /**
   * Add a resource to the preload queue
   */
  preload(
    resource: PreloadResource,
    priority: "critical" | "high" | "medium" | "low" = "medium",
  ): void {
    if (this.loadedResources.has(resource.href)) {
      return; // Already loaded
    }

    this.loadedResources.add(resource.href);

    const link = document.createElement("link");
    link.rel = "preload";
    link.href = resource.href;
    link.as = resource.as;

    if (resource.type) {
      link.type = resource.type;
    }

    if (resource.crossOrigin) {
      link.crossOrigin = resource.crossOrigin;
    }

    if (resource.media) {
      link.media = resource.media;
    }

    // Add priority hint for browsers that support it
    if ("fetchPriority" in link && resource.priority) {
      (link as any).fetchPriority = resource.priority;
    }

    // Add importance hint (deprecated but still supported)
    if (resource.priority === "high") {
      link.setAttribute("importance", "high");
    }

    document.head.appendChild(link);

    // Track for cleanup
    this.preloadQueue.push(resource);
  }

  /**
   * Preload critical resources immediately
   */
  preloadCritical(config: PreloadConfig): void {
    // Critical resources - load immediately
    config.critical.forEach((resource) => this.preload(resource, "critical"));

    // High priority - load after critical
    setTimeout(() => {
      config.high.forEach((resource) => this.preload(resource, "high"));
    }, 100);

    // Medium priority - load after high
    setTimeout(() => {
      config.medium.forEach((resource) => this.preload(resource, "medium"));
    }, 500);

    // Low priority - load last
    setTimeout(() => {
      config.low.forEach((resource) => this.preload(resource, "low"));
    }, 1000);
  }

  /**
   * Preload fonts with font-display optimization
   */
  preloadFont(
    href: string,
    display: "auto" | "block" | "swap" | "fallback" | "optional" = "swap",
  ): void {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";

    // Add font-display CSS
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: '${href.split("/").pop()?.split(".")[0] || "CustomFont"}';
        src: url('${href}') format('woff2');
        font-display: ${display};
        font-weight: 400;
        font-style: normal;
      }
    `;

    document.head.appendChild(link);
    document.head.appendChild(style);
  }

  /**
   * Preload images with responsive hints
   */
  preloadImage(href: string, sizes?: string, media?: string): void {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = "image";

    if (sizes) {
      link.setAttribute("imagesizes", sizes);
    }

    if (media) {
      link.media = media;
    }

    document.head.appendChild(link);
  }

  /**
   * Clear all preload links (useful for testing)
   */
  clear(): void {
    this.preloadQueue.forEach((resource) => {
      const links = document.querySelectorAll(`link[href="${resource.href}"]`);
      links.forEach((link) => link.remove());
    });

    this.loadedResources.clear();
    this.preloadQueue = [];
  }
}

// Singleton instance
export const preloadManager = new PreloadManager();

// Default preload configuration for the landing page
export const defaultPreloadConfig: PreloadConfig = {
  critical: [
    // Critical images (fonts handled by next/font)
    // Critical images (hero, logos)
    {
      href: "/images/logo.svg",
      as: "image",
      priority: "high",
    },
  ],
  high: [
    // High priority scripts (analytics, etc.)
    {
      href: "/api/analytics",
      as: "fetch",
      priority: "high",
    },
  ],
  medium: [
    // Medium priority resources
    {
      href: "/images/hero-bg.webp",
      as: "image",
      priority: "auto",
    },
  ],
  low: [
    // Low priority resources - load last
    {
      href: "/images/social-proof-logos.webp",
      as: "image",
      priority: "low",
    },
  ],
};

// React component to manage preloading
interface PreloadHintsProps {
  config?: Partial<PreloadConfig>;
  enableFontPreloading?: boolean;
  enableImagePreloading?: boolean;
}

export function PreloadHints({
  config = defaultPreloadConfig,
  enableFontPreloading = true,
  enableImagePreloading = true,
}: PreloadHintsProps) {
  useEffect(() => {
    // Merge with default config
    const fullConfig: PreloadConfig = {
      critical: [...defaultPreloadConfig.critical, ...(config.critical || [])],
      high: [...defaultPreloadConfig.high, ...(config.high || [])],
      medium: [...defaultPreloadConfig.medium, ...(config.medium || [])],
      low: [...defaultPreloadConfig.low, ...(config.low || [])],
    };

    // Start preloading
    preloadManager.preloadCritical(fullConfig);

    // Fonts handled by next/font - no manual preloading needed

    // Preload images if enabled
    if (enableImagePreloading) {
      preloadManager.preloadImage("/images/hero-illustration.webp", "100vw");
    }

    // Cleanup on unmount (useful for testing)
    return () => {
      // Don't actually clear in production, just for development
      if (process.env.NODE_ENV === "development") {
        preloadManager.clear();
      }
    };
  }, [config, enableFontPreloading, enableImagePreloading]);

  return null; // This component doesn't render anything
}

// Hook for dynamic preloading
export function usePreload(
  resources: PreloadResource[],
  priority: "critical" | "high" | "medium" | "low" = "medium",
) {
  useEffect(() => {
    resources.forEach((resource) => {
      preloadManager.preload(resource, priority);
    });
  }, [resources, priority]);
}

// Utility function to preload based on user interaction prediction
export function preloadOnInteraction(
  selector: string,
  resources: PreloadResource[],
) {
  const element = document.querySelector(selector);
  if (!element) return;

  const handleInteraction = () => {
    resources.forEach((resource) => {
      preloadManager.preload(resource, "high");
    });
    element.removeEventListener("mouseenter", handleInteraction);
    element.removeEventListener("focus", handleInteraction);
  };

  element.addEventListener("mouseenter", handleInteraction, { passive: true });
  element.addEventListener("focus", handleInteraction, { passive: true });
}
