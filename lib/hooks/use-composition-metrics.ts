import { useState, useEffect, useCallback } from "react";

export interface CompositionMetrics {
  totalRequests: number;
  successfulCompositions: number;
  failedCompositions: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  pageTypeBreakdown: Record<
    string,
    {
      count: number;
      avgTime: number;
      successRate: number;
    }
  >;
  recentErrors: Array<{
    timestamp: number;
    pageType: string;
    error: string;
    duration: number;
  }>;
  performanceTrends: Array<{
    timestamp: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  }>;
}

interface UseCompositionMetricsOptions {
  refreshInterval?: number; // em segundos
  enabled?: boolean;
}

interface UseCompositionMetricsReturn {
  metrics: CompositionMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useCompositionMetrics(
  options: UseCompositionMetricsOptions = {},
): UseCompositionMetricsReturn {
  const { refreshInterval = 30, enabled = true } = options;

  const [metrics, setMetrics] = useState<CompositionMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async (): Promise<void> => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/composition-metrics");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CompositionMetrics = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch metrics";
      setError(errorMessage);
      console.error("Failed to fetch composition metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const refetch = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (enabled) {
      fetchMetrics();
    }
  }, [fetchMetrics, enabled]);

  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(fetchMetrics, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval, enabled]);

  return {
    metrics,
    loading,
    error,
    refetch,
    lastUpdated,
  };
}
