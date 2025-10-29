// Advanced Cache Manager for optimal resource loading
// Implements multiple caching strategies for different resource types

export interface CacheEntry {
  url: string;
  type: "image" | "font" | "script" | "style" | "document";
  priority: "critical" | "high" | "medium" | "low";
  maxAge?: number; // in milliseconds
  lastAccessed?: number;
  size?: number;
}

export interface CacheStrategy {
  name: string;
  shouldCache: (entry: CacheEntry) => boolean;
  getCacheKey: (entry: CacheEntry) => string;
  getTTL: (entry: CacheEntry) => number;
  preloadCondition?: (entry: CacheEntry) => boolean;
}

class CacheManager {
  private cache = new Map<
    string,
    CacheEntry & { data?: any; timestamp: number }
  >();
  private strategies: CacheStrategy[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeStrategies();
    this.initializeObservers();
  }

  private initializeStrategies() {
    // Critical resources strategy - cache everything above the fold
    this.strategies.push({
      name: "critical",
      shouldCache: (entry) => entry.priority === "critical",
      getCacheKey: (entry) => `critical-${entry.type}-${btoa(entry.url)}`,
      getTTL: () => 24 * 60 * 60 * 1000, // 24 hours
      preloadCondition: () => true,
    });

    // High priority strategy - cache for session
    this.strategies.push({
      name: "high-priority",
      shouldCache: (entry) => entry.priority === "high",
      getCacheKey: (entry) => `high-${entry.type}-${btoa(entry.url)}`,
      getTTL: () => 60 * 60 * 1000, // 1 hour
      preloadCondition: (entry) =>
        entry.type === "image" || entry.type === "font",
    });

    // Medium priority strategy - cache based on access patterns
    this.strategies.push({
      name: "medium-priority",
      shouldCache: (entry) => entry.priority === "medium",
      getCacheKey: (entry) =>
        `medium-${entry.type}-${Date.now()}-${btoa(entry.url)}`,
      getTTL: () => 30 * 60 * 1000, // 30 minutes
    });

    // Low priority strategy - minimal caching
    this.strategies.push({
      name: "low-priority",
      shouldCache: (entry) => entry.priority === "low",
      getCacheKey: (entry) => `low-${entry.type}-${btoa(entry.url)}`,
      getTTL: () => 10 * 60 * 1000, // 10 minutes
    });
  }

  private initializeObservers() {
    if (typeof window === "undefined" || !("PerformanceObserver" in window))
      return;

    try {
      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];

        entries.forEach((entry) => {
          if (
            entry.initiatorType &&
            ["img", "link", "script"].includes(entry.initiatorType)
          ) {
            const cacheEntry: CacheEntry = {
              url: entry.name,
              type: this.getResourceType(entry.initiatorType),
              priority: this.determinePriority(entry.name),
              lastAccessed: Date.now(),
              size: entry.transferSize,
            };

            this.addToCache(cacheEntry);
          }
        });
      });

      resourceObserver.observe({ entryTypes: ["resource"] });
      this.observers.push(resourceObserver);

      // Observe navigation timing for critical resources
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceNavigationTiming[];

        entries.forEach(() => {
          // Mark critical resources as accessed
          this.markCriticalResourcesAccessed();
        });
      });

      navigationObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn("Failed to initialize cache observers:", error);
    }
  }

  private getResourceType(initiatorType: string): CacheEntry["type"] {
    switch (initiatorType) {
      case "img":
        return "image";
      case "link":
        return "style";
      case "script":
        return "script";
      default:
        return "document";
    }
  }

  private determinePriority(url: string): CacheEntry["priority"] {
    // Critical resources
    if (url.includes("hero") || url.includes("logo") || url.includes("Inter")) {
      return "critical";
    }

    // High priority resources
    if (
      url.includes(".woff2") ||
      url.includes("benefits") ||
      url.includes("features")
    ) {
      return "high";
    }

    // Medium priority
    if (url.includes(".png") || url.includes(".jpg") || url.includes(".webp")) {
      return "medium";
    }

    return "low";
  }

  private addToCache(entry: CacheEntry) {
    const strategy = this.strategies.find((s) => s.shouldCache(entry));
    if (!strategy) return;

    const key = strategy.getCacheKey(entry);
    const ttl = strategy.getTTL(entry);

    this.cache.set(key, {
      ...entry,
      timestamp: Date.now(),
      maxAge: ttl,
    });

    // Clean up expired entries periodically
    this.cleanupExpired();
  }

  private markCriticalResourcesAccessed() {
    // Update last accessed time for critical resources
    this.cache.forEach((entry, key) => {
      if (entry.priority === "critical") {
        entry.lastAccessed = Date.now();
      }
    });
  }

  private cleanupExpired() {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.maxAge && now - entry.timestamp > entry.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  // Public API
  public preloadResource(entry: CacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const strategy = this.strategies.find((s) => s.shouldCache(entry));
      if (!strategy || !(strategy.preloadCondition?.(entry) ?? false)) {
        resolve();
        return;
      }

      switch (entry.type) {
        case "image":
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = entry.url;
          break;

        case "font":
          const font = new FontFace("temp-font", `url(${entry.url})`);
          font
            .load()
            .then(() => resolve())
            .catch(reject);
          break;

        default:
          // For other resources, just fetch
          fetch(entry.url, { method: "HEAD" })
            .then(() => resolve())
            .catch(reject);
      }
    });
  }

  public getCacheStats() {
    const stats = {
      total: this.cache.size,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    this.cache.forEach((entry) => {
      stats.byPriority[entry.priority] =
        (stats.byPriority[entry.priority] || 0) + 1;
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
    });

    return stats;
  }

  public clearCache() {
    this.cache.clear();
  }

  public destroy() {
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn("Failed to disconnect observer:", error);
      }
    });
    this.observers = [];
    this.clearCache();
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    cacheManager.destroy();
  });
}

// Hook for using cache manager in components
export function useCacheManager() {
  return {
    preloadResource: cacheManager.preloadResource.bind(cacheManager),
    getCacheStats: cacheManager.getCacheStats.bind(cacheManager),
    clearCache: cacheManager.clearCache.bind(cacheManager),
  };
}
