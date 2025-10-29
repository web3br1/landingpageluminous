"use client";

import { useState, useEffect, useCallback } from "react";
import {
  advancedCacheManager,
  getCacheMetrics,
  invalidateCache,
} from "./advanced-cache-manager";

interface UseCacheManagerOptions {
  autoInvalidate?: boolean;
  invalidateInterval?: number;
  monitorMetrics?: boolean;
}

interface CacheManagerHookReturn {
  metrics: any;
  invalidatePatterns: (patterns: string[], tags?: string[]) => Promise<void>;
  clearAllCache: () => Promise<void>;
  getCacheStats: () => any;
  refreshCache: () => Promise<void>;
  isOnline: boolean;
}

export function useCacheManager(
  options: UseCacheManagerOptions = {},
): CacheManagerHookReturn {
  const {
    autoInvalidate = true,
    invalidateInterval = 3600000, // 1 hour
    monitorMetrics = true,
  } = options;

  const [metrics, setMetrics] = useState(getCacheMetrics());
  const [isOnline, setIsOnline] = useState(true); // Default to online for SSR safety

  // Update metrics periodically
  useEffect(() => {
    if (!monitorMetrics) return;

    const updateMetrics = () => {
      setMetrics(getCacheMetrics());
    };

    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [monitorMetrics]);

  // Monitor online/offline status
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

  // Auto-invalidate stale cache
  useEffect(() => {
    if (!autoInvalidate) return;

    const autoInvalidateCache = () => {
      // Invalidate old dynamic content every hour
      invalidateCache(["/api/*"], ["stale"]);
    };

    const interval = setInterval(autoInvalidateCache, invalidateInterval);

    return () => clearInterval(interval);
  }, [autoInvalidate, invalidateInterval]);

  const invalidatePatterns = useCallback(
    async (patterns: string[], tags?: string[]) => {
      try {
        await invalidateCache(patterns, tags);
        // Update metrics after invalidation
        setMetrics(getCacheMetrics());
      } catch (error) {
        console.error("[useCacheManager] Failed to invalidate cache:", error);
      }
    },
    [],
  );

  const clearAllCache = useCallback(async () => {
    try {
      // Clear all cache patterns
      await invalidateCache(["/*"]);
      setMetrics(getCacheMetrics());
    } catch (error) {
      console.error("[useCacheManager] Failed to clear cache:", error);
    }
  }, []);

  const getCacheStats = useCallback(() => {
    return advancedCacheManager.getCacheStats();
  }, []);

  const refreshCache = useCallback(async () => {
    try {
      // Refresh critical cache items
      await invalidateCache(["/", "/pricing", "/features"]);
      // Warm cache again
      setMetrics(getCacheMetrics());
    } catch (error) {
      console.error("[useCacheManager] Failed to refresh cache:", error);
    }
  }, []);

  return {
    metrics,
    invalidatePatterns,
    clearAllCache,
    getCacheStats,
    refreshCache,
    isOnline,
  };
}

// Hook for cache-aware data fetching
export function useCacheAwareFetch(url: string, options: RequestInit = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!url) return;

      setLoading(true);
      setError(null);

      try {
        let response: Response | null = null;

        if (!forceRefresh) {
          // Try cache first
          response = await advancedCacheManager.getResponse(
            url,
            new Request(url, options),
          );
        }

        if (!response) {
          // Fetch fresh
          response = await fetch(url, options);
          setIsFromCache(false);
        } else {
          setIsFromCache(true);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        let result: any;

        if (contentType?.includes("application/json")) {
          result = await response.json();
        } else {
          result = await response.text();
        }

        setData(result);
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("[useCacheAwareFetch] Error fetching:", url, error);
      } finally {
        setLoading(false);
      }
    },
    [url, options],
  );

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isFromCache,
    refetch,
  };
}

// Hook for cache performance monitoring
export function useCachePerformance() {
  const [performance, setPerformance] = useState({
    hitRate: 0,
    latency: 0,
    efficiency: 0,
    cacheSize: 0,
  });

  useEffect(() => {
    const updatePerformance = () => {
      const metrics = getCacheMetrics();
      const stats = advancedCacheManager.getCacheStats();

      setPerformance({
        hitRate: metrics.hitRate,
        latency: metrics.latency.avg,
        efficiency: metrics.efficiency,
        cacheSize: metrics.size.total,
      });
    };

    updatePerformance();
    const interval = setInterval(updatePerformance, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return performance;
}
