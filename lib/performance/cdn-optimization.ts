/**
 * CDN Optimization System - Fase 3
 * Sistema avançado de otimização de CDN com preload/prefetch inteligente
 */

import {
  isFeatureEnabled,
  FeatureFlag,
} from "../environment/environment-manager";
import { getAdvancedMonitoringSystem } from "../monitoring/advanced-metrics";
import { safeNavigatorConnection } from "../utils/browser-api-helpers";
import { logger } from "../observability/logger";

/**
 * Resource Priority
 */
export enum ResourcePriority {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/**
 * Resource Type
 */
export enum ResourceType {
  SCRIPT = "script",
  STYLE = "style",
  FONT = "font",
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
}

/**
 * CDN Resource Configuration
 */
export interface CDNResource {
  url: string;
  type: ResourceType;
  priority: ResourcePriority;
  preload?: boolean;
  prefetch?: boolean;
  integrity?: string;
  crossOrigin?: string;
  as?: string;
  media?: string;
  sizes?: string;
  srcSet?: string;
}

/**
 * CDN Configuration
 */
export interface CDNConfig {
  baseUrl: string;
  regions: string[];
  cacheControl: {
    static: string;
    dynamic: string;
    fonts: string;
  };
  compression: {
    gzip: boolean;
    brotli: boolean;
    webp: boolean;
  };
  preloadStrategy: "aggressive" | "conservative" | "smart";
  connectionAware: boolean;
}

/**
 * CDN Optimizer Class
 */
export class CDNOptimizer {
  private config: CDNConfig;
  private resources = new Map<string, CDNResource>();
  private preloadedResources = new Set<string>();
  private prefetchedResources = new Set<string>();
  private monitoring = getAdvancedMonitoringSystem();

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_CDN_URL || "",
      regions: ["us-east-1", "eu-west-1", "ap-southeast-1"],
      cacheControl: {
        static: "public, max-age=31536000, immutable",
        dynamic: "public, max-age=300, s-maxage=600",
        fonts: "public, max-age=31536000, immutable",
      },
      compression: {
        gzip: true,
        brotli: true,
        webp: true,
      },
      preloadStrategy: "smart",
      connectionAware: true,
      ...config,
    };

    if (!isFeatureEnabled(FeatureFlag.CDN_OPTIMIZATION)) {
      logger.info("CDN optimization disabled by feature flag");
      return;
    }

    this.initializeCDNOptimization();
  }

  /**
   * Initialize CDN optimization
   */
  private initializeCDNOptimization(): void {
    if (typeof window === "undefined") return;

    // Register critical resources
    this.registerCriticalResources();

    // Set up connection-aware loading
    if (this.config.connectionAware) {
      this.setupConnectionAwareness();
    }

    // Apply preload strategy
    this.applyPreloadStrategy();

    logger.info("CDN optimization initialized", {
      baseUrl: this.config.baseUrl,
      strategy: this.config.preloadStrategy,
      connectionAware: this.config.connectionAware,
    });
  }

  /**
   * Register critical resources for immediate loading
   */
  private registerCriticalResources(): void {
    // Fonts handled by next/font - no manual resource registration needed

    // Critical images (hero, logos)
    this.registerResource({
      url: "/images/hero-background.webp",
      type: ResourceType.IMAGE,
      priority: ResourcePriority.CRITICAL,
      preload: true,
      as: "image",
    });

    // Critical scripts
    this.registerResource({
      url: "/js/core-analytics.js",
      type: ResourceType.SCRIPT,
      priority: ResourcePriority.HIGH,
      preload: true,
      as: "script",
    });
  }

  /**
   * Register a resource for CDN optimization
   */
  registerResource(resource: CDNResource): void {
    const fullUrl = resource.url.startsWith("http")
      ? resource.url
      : `${this.config.baseUrl}${resource.url}`;
    this.resources.set(fullUrl, { ...resource, url: fullUrl });

    // Apply optimizations immediately for critical resources
    if (resource.priority === ResourcePriority.CRITICAL) {
      this.optimizeResource(fullUrl, resource);
    }
  }

  /**
   * Optimize a specific resource
   */
  private optimizeResource(url: string, resource: CDNResource): void {
    if (typeof document === "undefined") return;

    // Create link element for preload/prefetch
    const link = document.createElement("link");
    link.rel = resource.preload
      ? "preload"
      : resource.prefetch
        ? "prefetch"
        : "dns-prefetch";
    link.href = url;

    // Set attributes based on resource type
    if (resource.as) link.as = resource.as;
    if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
    if (resource.integrity) link.integrity = resource.integrity;
    if (resource.media) link.media = resource.media;
    if (resource.sizes) link.sizes = resource.sizes;

    // Add to document head
    document.head.appendChild(link);

    // Track preloaded resources
    if (resource.preload) {
      this.preloadedResources.add(url);
    } else if (resource.prefetch) {
      this.prefetchedResources.add(url);
    }

    logger.debug(`Resource optimized: ${url}`, {
      type: resource.type,
      priority: resource.priority,
      method: resource.preload
        ? "preload"
        : resource.prefetch
          ? "prefetch"
          : "dns-prefetch",
    });
  }

  /**
   * Setup connection awareness
   */
  private setupConnectionAwareness(): void {
    const connection = safeNavigatorConnection();

    if (connection) {
      // Adjust strategy based on connection
      const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      const downlink = connection.downlink; // Mbps

      if (
        effectiveType === "slow-2g" ||
        effectiveType === "2g" ||
        downlink < 1
      ) {
        // Conservative loading for slow connections
        this.config.preloadStrategy = "conservative";
        logger.info(
          "Connection awareness: Conservative strategy for slow connection",
          {
            effectiveType,
            downlink,
          },
        );
      } else if (effectiveType === "3g" || downlink < 5) {
        // Moderate loading
        this.config.preloadStrategy = "smart";
      } else {
        // Aggressive loading for fast connections
        this.config.preloadStrategy = "aggressive";
      }

      // Listen for connection changes
      connection.addEventListener("change", () => {
        logger.info("Connection changed", {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
        });
      });
    }
  }

  /**
   * Apply preload strategy
   */
  private applyPreloadStrategy(): void {
    const strategy = this.config.preloadStrategy;

    switch (strategy) {
      case "aggressive":
        this.preloadAllHighPriority();
        this.prefetchOnIdle();
        break;

      case "smart":
        this.preloadCriticalOnly();
        this.prefetchOnInteraction();
        break;

      case "conservative":
        this.preloadCriticalOnly();
        // No prefetching
        break;
    }

    logger.info(`Applied preload strategy: ${strategy}`);
  }

  /**
   * Preload all high priority resources
   */
  private preloadAllHighPriority(): void {
    const highPriorityResources = Array.from(this.resources.values()).filter(
      (r) =>
        r.priority === ResourcePriority.CRITICAL ||
        r.priority === ResourcePriority.HIGH,
    );

    highPriorityResources.forEach((resource) => {
      this.optimizeResource(resource.url, { ...resource, preload: true });
    });
  }

  /**
   * Preload only critical resources
   */
  private preloadCriticalOnly(): void {
    const criticalResources = Array.from(this.resources.values()).filter(
      (r) => r.priority === ResourcePriority.CRITICAL,
    );

    criticalResources.forEach((resource) => {
      this.optimizeResource(resource.url, { ...resource, preload: true });
    });
  }

  /**
   * Prefetch resources on idle
   */
  private prefetchOnIdle(): void {
    if (typeof window === "undefined" || !("requestIdleCallback" in window))
      return;

    window.requestIdleCallback(() => {
      const mediumPriorityResources = Array.from(this.resources.values())
        .filter((r) => r.priority === ResourcePriority.MEDIUM)
        .slice(0, 5); // Limit to 5

      mediumPriorityResources.forEach((resource) => {
        this.optimizeResource(resource.url, { ...resource, prefetch: true });
      });
    });
  }

  /**
   * Prefetch resources on user interaction
   */
  private prefetchOnInteraction(): void {
    if (typeof document === "undefined") return;

    const handleInteraction = () => {
      const mediumPriorityResources = Array.from(this.resources.values())
        .filter((r) => r.priority === ResourcePriority.MEDIUM)
        .slice(0, 3); // Limit to 3

      mediumPriorityResources.forEach((resource) => {
        this.optimizeResource(resource.url, { ...resource, prefetch: true });
      });

      // Remove listeners after first interaction
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
  }

  /**
   * Get resource loading metrics
   */
  getResourceMetrics(): {
    totalResources: number;
    preloadedResources: number;
    prefetchedResources: number;
    loadingStrategy: string;
    connectionType?: string;
  } {
    let connectionType: string | undefined;

    const connection = safeNavigatorConnection();
    if (connection) {
      connectionType = connection.effectiveType;
    }

    return {
      totalResources: this.resources.size,
      preloadedResources: this.preloadedResources.size,
      prefetchedResources: this.prefetchedResources.size,
      loadingStrategy: this.config.preloadStrategy,
      connectionType,
    };
  }

  /**
   * Get CDN optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    resource: string;
    recommendation: string;
    priority: "high" | "medium" | "low";
    estimatedSavings: number; // ms
  }> {
    const recommendations: Array<{
      resource: string;
      recommendation: string;
      priority: "high" | "medium" | "low";
      estimatedSavings: number;
    }> = [];

    // Check for missing preloads
    const criticalWithoutPreload = Array.from(this.resources.values()).filter(
      (r) => r.priority === ResourcePriority.CRITICAL && !r.preload,
    );

    criticalWithoutPreload.forEach((resource) => {
      recommendations.push({
        resource: resource.url,
        recommendation: "Add preload for critical resource",
        priority: "high",
        estimatedSavings: 200, // Estimated savings in ms
      });
    });

    // Check for large resources that could benefit from CDN
    const largeResources = Array.from(this.resources.values()).filter(
      (r) => r.type === ResourceType.IMAGE || r.type === ResourceType.VIDEO,
    );

    largeResources.forEach((resource) => {
      if (!resource.url.includes(this.config.baseUrl)) {
        recommendations.push({
          resource: resource.url,
          recommendation: "Move to CDN for better performance",
          priority: "medium",
          estimatedSavings: 150,
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate resource hints HTML
   */
  generateResourceHints(): string {
    const hints = [];

    for (const resource of this.resources.values()) {
      if (resource.preload || resource.prefetch) {
        const rel = resource.preload ? "preload" : "prefetch";
        const attrs = [];

        if (resource.as) attrs.push(`as="${resource.as}"`);
        if (resource.crossOrigin)
          attrs.push(`crossorigin="${resource.crossOrigin}"`);
        if (resource.media) attrs.push(`media="${resource.media}"`);

        hints.push(
          `<link rel="${rel}" href="${resource.url}" ${attrs.join(" ")}>`,
        );
      }
    }

    return hints.join("\n");
  }

  /**
   * Warm up CDN connections
   */
  warmUpConnections(): void {
    if (typeof document === "undefined") return;

    // DNS prefetch for CDN domains
    const cdnDomains = new Set();

    for (const resource of this.resources.values()) {
      try {
        const url = new URL(resource.url);
        cdnDomains.add(url.hostname);
      } catch {
        // Invalid URL, skip
      }
    }

    cdnDomains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    logger.info("CDN connections warmed up", {
      domains: Array.from(cdnDomains),
    });
  }
}

// ===== SINGLETON INSTANCE =====

let cdnOptimizerInstance: CDNOptimizer | null = null;

export function getCDNOptimizer(config?: Partial<CDNConfig>): CDNOptimizer {
  if (!cdnOptimizerInstance) {
    cdnOptimizerInstance = new CDNOptimizer(config);
  }
  return cdnOptimizerInstance;
}

export function destroyCDNOptimizer(): void {
  cdnOptimizerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Preload critical resource
 */
export function preloadCriticalResource(
  url: string,
  as: string = "fetch",
): void {
  const optimizer = getCDNOptimizer();
  optimizer.registerResource({
    url,
    type: ResourceType.DOCUMENT,
    priority: ResourcePriority.CRITICAL,
    preload: true,
    as,
  });
}

/**
 * Prefetch resource on idle
 */
export function prefetchOnIdle(url: string, as: string = "fetch"): void {
  const optimizer = getCDNOptimizer();
  optimizer.registerResource({
    url,
    type: ResourceType.DOCUMENT,
    priority: ResourcePriority.MEDIUM,
    prefetch: true,
    as,
  });
}

/**
 * Hook for CDN optimization
 */
export function useCDNOptimization(): {
  warmUpConnections: () => void;
  getResourceMetrics: () => unknown;
  getRecommendations: () => unknown[];
} {
  const optimizer = getCDNOptimizer();

  return {
    warmUpConnections: () => optimizer.warmUpConnections(),
    getResourceMetrics: () => optimizer.getResourceMetrics(),
    getRecommendations: () => optimizer.getOptimizationRecommendations(),
  };
}
