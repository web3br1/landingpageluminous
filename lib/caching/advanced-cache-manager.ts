// ===== ADVANCED CACHE MANAGER =====
// HTTP/CDN Cache Strategies with Service Worker Integration

import { SWCacheManager } from "../sw/sw-cache-manager";

// ===== TYPES & INTERFACES =====

interface CacheStrategy {
  name: string;
  maxAge: number; // seconds
  staleWhileRevalidate?: number; // seconds
  cacheControl?: string[];
  vary?: string[];
  etag?: boolean;
  lastModified?: boolean;
}

interface CacheConfig {
  strategy: CacheStrategy;
  cdn: {
    enabled: boolean;
    provider?: "cloudflare" | "fastly" | "akamai" | "cloudfront";
    regions?: string[];
    edgeLocations?: number;
  };
  invalidation: {
    enabled: boolean;
    method: "purge" | "ban" | "refresh";
    patterns?: string[];
    tags?: string[];
  };
  warming: {
    enabled: boolean;
    urls: string[];
    schedule?: string; // cron expression
    priority?: "low" | "normal" | "high";
  };
  monitoring: {
    enabled: boolean;
    metrics: string[];
    alerts: {
      hitRateThreshold?: number;
      latencyThreshold?: number;
      errorRateThreshold?: number;
    };
  };
}

interface CacheEntry {
  url: string;
  response: Response;
  timestamp: number;
  expiresAt?: number;
  etag?: string;
  lastModified?: string;
  strategy: CacheStrategy;
  metadata: {
    size: number;
    contentType: string;
    status: number;
    cacheControl: string;
  };
}

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  latency: {
    avg: number;
    p95: number;
    p99: number;
  };
  size: {
    total: number;
    byType: Record<string, number>;
  };
  hitRate: number;
  efficiency: number;
}

// ===== CACHE STRATEGIES =====

export const CACHE_STRATEGIES = {
  STATIC: {
    name: "static",
    maxAge: 31536000, // 1 year
    cacheControl: ["public", "immutable"],
    etag: true,
    lastModified: true,
  } as CacheStrategy,

  DYNAMIC: {
    name: "dynamic",
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    cacheControl: ["public", "must-revalidate"],
    etag: true,
    lastModified: true,
  } as CacheStrategy,

  API: {
    name: "api",
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
    cacheControl: ["private", "must-revalidate"],
    vary: ["Authorization", "Accept-Language"],
    etag: true,
  } as CacheStrategy,

  USER_SPECIFIC: {
    name: "user-specific",
    maxAge: 1800, // 30 minutes
    cacheControl: ["private", "no-cache"],
    vary: ["Cookie", "Authorization"],
    etag: true,
  } as CacheStrategy,

  CDN_EDGE: {
    name: "cdn-edge",
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 7200, // 2 hours
    cacheControl: ["public", "s-maxage=3600"],
    etag: true,
    lastModified: true,
  } as CacheStrategy,
};

// ===== ADVANCED CACHE MANAGER =====

class AdvancedCacheManager {
  private static instance: AdvancedCacheManager;
  private cacheConfigs: Map<string, CacheConfig> = new Map();
  private metrics: CacheMetrics;
  private monitoringInterval?: NodeJS.Timeout;
  private warmingInterval?: NodeJS.Timeout;

  private constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      latency: { avg: 0, p95: 0, p99: 0 },
      size: { total: 0, byType: {} },
      hitRate: 0,
      efficiency: 0,
    };

    this.initializeDefaultConfigs();
    this.startMonitoring();
    this.startCacheWarming();
  }

  static getInstance(): AdvancedCacheManager {
    if (!AdvancedCacheManager.instance) {
      AdvancedCacheManager.instance = new AdvancedCacheManager();
    }
    return AdvancedCacheManager.instance;
  }

  private initializeDefaultConfigs(): void {
    // Static assets (CSS, JS, images, fonts)
    this.setCacheConfig("/_next/static/*", {
      strategy: CACHE_STRATEGIES.STATIC,
      cdn: { enabled: true },
      invalidation: { enabled: true, method: "purge" },
      warming: { enabled: true, urls: [], priority: "high" },
      monitoring: {
        enabled: true,
        metrics: ["hitRate", "latency"],
        alerts: {},
      },
    });

    // API routes
    this.setCacheConfig("/api/*", {
      strategy: CACHE_STRATEGIES.API,
      cdn: { enabled: false }, // Don't cache APIs at CDN level
      invalidation: { enabled: true, method: "ban" },
      warming: { enabled: false, urls: [] },
      monitoring: {
        enabled: true,
        metrics: ["errorRate", "latency"],
        alerts: {},
      },
    });

    // Dynamic pages
    this.setCacheConfig("/*.html", {
      strategy: CACHE_STRATEGIES.DYNAMIC,
      cdn: { enabled: true, provider: "cloudflare" },
      invalidation: { enabled: true, method: "purge" },
      warming: {
        enabled: true,
        urls: ["/", "/pricing", "/features"],
        priority: "normal",
      },
      monitoring: {
        enabled: true,
        metrics: ["hitRate", "latency"],
        alerts: {},
      },
    });

    // User-specific content
    this.setCacheConfig("/dashboard/*", {
      strategy: CACHE_STRATEGIES.USER_SPECIFIC,
      cdn: { enabled: false },
      invalidation: { enabled: false, method: "purge" }, // Don't cache user-specific content
      warming: { enabled: false, urls: [] },
      monitoring: { enabled: false, metrics: [], alerts: {} },
    });
  }

  // ===== PUBLIC API =====

  setCacheConfig(pattern: string, config: CacheConfig): void {
    this.cacheConfigs.set(pattern, config);
  }

  getCacheConfig(url: string): CacheConfig | undefined {
    // Find matching pattern (simple wildcard matching)
    for (const [pattern, config] of this.cacheConfigs.entries()) {
      if (this.matchesPattern(url, pattern)) {
        return config;
      }
    }
    return undefined;
  }

  async getResponse(url: string, request?: Request): Promise<Response | null> {
    const config = this.getCacheConfig(url);
    if (!config) return null;

    const startTime = performance.now();

    try {
      // Try Service Worker cache first
      const swCache = await SWCacheManager.openCache("dynamic");
      const cachedResponse = await swCache.match(url);

      if (cachedResponse) {
        this.recordMetric("hit", performance.now() - startTime);
        return cachedResponse;
      }

      // Try CDN cache or fetch fresh
      const freshResponse = await this.fetchWithCacheStrategy(
        url,
        config,
        request,
      );

      if (freshResponse) {
        this.recordMetric("miss", performance.now() - startTime);
        return freshResponse;
      }

      this.recordMetric("error", performance.now() - startTime);
      return null;
    } catch (error) {
      console.error("[CacheManager] Error fetching:", url, error);
      this.recordMetric("error", performance.now() - startTime);
      return null;
    }
  }

  private async fetchWithCacheStrategy(
    url: string,
    config: CacheConfig,
    originalRequest?: Request,
  ): Promise<Response | null> {
    const strategy = config.strategy;

    // Create request with appropriate headers
    const request = this.createCacheRequest(url, strategy, originalRequest);

    try {
      const response = await fetch(request);

      if (response.ok) {
        // Store in Service Worker cache if appropriate
        if (this.shouldCacheInSW(strategy)) {
          await this.storeInSWCache(url, response.clone(), strategy);
        }

        // Add cache headers for CDN
        const enhancedResponse = this.addCacheHeaders(response, strategy);

        return enhancedResponse;
      }

      return response;
    } catch (error) {
      console.warn("[CacheManager] Fetch failed:", error);
      return null;
    }
  }

  private createCacheRequest(
    url: string,
    strategy: CacheStrategy,
    originalRequest?: Request,
  ): Request {
    const headers = new Headers(originalRequest?.headers);

    // Add cache control headers
    if (strategy.cacheControl) {
      headers.set("Cache-Control", strategy.cacheControl.join(", "));
    }

    // Add vary headers
    if (strategy.vary) {
      headers.set("Vary", strategy.vary.join(", "));
    }

    return new Request(url, {
      ...originalRequest,
      headers,
    });
  }

  private shouldCacheInSW(strategy: CacheStrategy): boolean {
    // Don't cache user-specific or short-lived content in SW
    return strategy.maxAge > 60 && !strategy.cacheControl?.includes("private");
  }

  private async storeInSWCache(
    url: string,
    response: Response,
    strategy: CacheStrategy,
  ): Promise<void> {
    try {
      const cache = await SWCacheManager.openCache(strategy.name);
      const cacheEntry: CacheEntry = {
        url,
        response: response.clone(),
        timestamp: Date.now(),
        expiresAt: strategy.maxAge
          ? Date.now() + strategy.maxAge * 1000
          : undefined,
        etag: response.headers.get("etag") || undefined,
        lastModified: response.headers.get("last-modified") || undefined,
        strategy,
        metadata: {
          size: parseInt(response.headers.get("content-length") || "0", 10),
          contentType: response.headers.get("content-type") || "unknown",
          status: response.status,
          cacheControl: response.headers.get("cache-control") || "",
        },
      };

      // Store with metadata
      await cache.put(url, response);

      // Update metrics
      this.updateSizeMetrics(
        cacheEntry.metadata.size,
        cacheEntry.metadata.contentType,
      );
    } catch (error) {
      console.warn("[CacheManager] Failed to store in SW cache:", error);
    }
  }

  private addCacheHeaders(
    response: Response,
    strategy: CacheStrategy,
  ): Response {
    const headers = new Headers(response.headers);

    // Add comprehensive cache control
    const cacheControl = [
      `max-age=${strategy.maxAge}`,
      ...(strategy.staleWhileRevalidate
        ? [`stale-while-revalidate=${strategy.staleWhileRevalidate}`]
        : []),
      ...(strategy.cacheControl || []),
    ];

    headers.set("Cache-Control", cacheControl.join(", "));

    // Add other headers
    if (strategy.etag && !headers.has("ETag")) {
      headers.set(
        "ETag",
        `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`,
      );
    }

    if (strategy.lastModified && !headers.has("Last-Modified")) {
      headers.set("Last-Modified", new Date().toUTCString());
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // ===== CACHE INVALIDATION =====

  async invalidateCache(patterns: string[], tags?: string[]): Promise<void> {
    console.log("[CacheManager] Invalidating cache:", patterns, tags);

    // Invalidate Service Worker caches
    await this.invalidateSWCache(patterns);

    // Invalidate CDN cache
    await this.invalidateCDNCache(patterns, tags);
  }

  private async invalidateSWCache(patterns: string[]): Promise<void> {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        if (
          patterns.some((pattern) => this.matchesPattern(request.url, pattern))
        ) {
          await cache.delete(request);
        }
      }
    }
  }

  private async invalidateCDNCache(
    patterns: string[],
    tags?: string[],
  ): Promise<void> {
    // This would integrate with CDN provider APIs
    // For example, Cloudflare API, Fastly API, etc.

    const cdnConfig = {
      provider: "cloudflare" as const,
      apiToken: process.env.CDN_API_TOKEN,
      zoneId: process.env.CDN_ZONE_ID,
    };

    if (!cdnConfig.apiToken || !cdnConfig.zoneId) {
      console.warn("[CacheManager] CDN invalidation not configured");
      return;
    }

    try {
      // Example: Cloudflare purge
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${cdnConfig.zoneId}/purge_cache`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cdnConfig.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: patterns,
            tags: tags || [],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`CDN purge failed: ${response.status}`);
      }

      console.log("[CacheManager] CDN cache invalidated successfully");
    } catch (error) {
      console.error("[CacheManager] CDN invalidation failed:", error);
    }
  }

  // ===== CACHE WARMING =====

  private startCacheWarming(): void {
    // Warm critical pages every 30 minutes
    this.warmingInterval = setInterval(
      async () => {
        await this.warmCriticalCache();
      },
      30 * 60 * 1000,
    );

    // Initial warming
    setTimeout(() => this.warmCriticalCache(), 5000);
  }

  private async warmCriticalCache(): Promise<void> {
    const criticalUrls = ["/", "/pricing", "/features", "/api/health"];

    console.log("[CacheManager] Warming critical cache...");

    for (const url of criticalUrls) {
      try {
        await this.getResponse(url);
      } catch (error) {
        console.warn(`[CacheManager] Failed to warm ${url}:`, error);
      }
    }

    console.log("[CacheManager] Cache warming completed");
  }

  // ===== MONITORING =====

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
    }, 60000); // Every minute
  }

  private recordMetric(type: "hit" | "miss" | "error", latency: number): void {
    switch (type) {
      case "hit":
        this.metrics.hits++;
        break;
      case "miss":
        this.metrics.misses++;
        break;
      case "error":
        this.metrics.errors++;
        break;
    }

    // Update latency metrics
    this.updateLatencyMetrics(latency);
  }

  private updateLatencyMetrics(latency: number): void {
    // Simple moving average and percentiles
    // In production, you'd want more sophisticated calculations
    this.metrics.latency.avg = (this.metrics.latency.avg + latency) / 2;
  }

  private updateSizeMetrics(size: number, contentType: string): void {
    this.metrics.size.total += size;

    const type = contentType.split("/")[0] || "unknown";
    this.metrics.size.byType[type] =
      (this.metrics.size.byType[type] || 0) + size;
  }

  private updateMetrics(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;

    // Calculate efficiency (simplified)
    this.metrics.efficiency =
      this.metrics.hitRate * (1 - this.metrics.errors / Math.max(total, 1));
  }

  private checkAlerts(): void {
    const config = this.getCacheConfig("/");

    if (config?.monitoring.alerts) {
      const alerts = config.monitoring.alerts;

      if (
        alerts.hitRateThreshold &&
        this.metrics.hitRate < alerts.hitRateThreshold
      ) {
        console.warn(
          `[CacheManager] Low cache hit rate: ${this.metrics.hitRate}`,
        );
        // In production, send alert to monitoring system
      }

      if (
        alerts.latencyThreshold &&
        this.metrics.latency.avg > alerts.latencyThreshold
      ) {
        console.warn(
          `[CacheManager] High cache latency: ${this.metrics.latency.avg}ms`,
        );
        // In production, send alert to monitoring system
      }

      if (
        alerts.errorRateThreshold &&
        this.metrics.errors > alerts.errorRateThreshold
      ) {
        console.warn(
          `[CacheManager] High cache error rate: ${this.metrics.errors}`,
        );
        // In production, send alert to monitoring system
      }
    }
  }

  // ===== UTILITIES =====

  private matchesPattern(url: string, pattern: string): boolean {
    // Simple wildcard matching (*)
    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
    return regex.test(url);
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getCacheStats(): Record<string, any> {
    return {
      configs: Object.fromEntries(this.cacheConfigs),
      metrics: this.metrics,
      cacheNames: Array.from(this.cacheConfigs.keys()),
    };
  }

  // Cleanup
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }
  }
}

// ===== EXPORT =====

export const advancedCacheManager = AdvancedCacheManager.getInstance();

// Utility functions
export const setCacheConfig = (pattern: string, config: CacheConfig) =>
  advancedCacheManager.setCacheConfig(pattern, config);

export const getCacheConfig = (url: string) =>
  advancedCacheManager.getCacheConfig(url);

export const invalidateCache = (patterns: string[], tags?: string[]) =>
  advancedCacheManager.invalidateCache(patterns, tags);

export const getCacheMetrics = () => advancedCacheManager.getMetrics();
