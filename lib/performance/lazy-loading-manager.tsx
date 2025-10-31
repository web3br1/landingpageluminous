// Advanced lazy loading manager for performance optimization
// Manages lazy loading of components based on priority, viewport, and performance metrics

import React, {
  Suspense,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { safeNavigatorConnection, safeNavigatorBattery } from "../utils/browser-api-helpers";

// Custom useInView hook to replace react-intersection-observer
function useInView(
  options: {
    threshold?: number | number[];
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {},
) {
  const { threshold = 0, rootMargin = "0px", triggerOnce = false } = options;
  const [inView, setInView] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && triggerOnce) {
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, triggerOnce]);

  return { ref: setRef, inView };
}

interface LazyComponentConfig {
  component: () => Promise<{ default: React.ComponentType<unknown> }>;
  priority: "critical" | "high" | "medium" | "low";
  fallback?: React.ComponentType<unknown>;
  ssr?: boolean;
  preload?: boolean;
  loadCondition?: () => boolean;
}

interface LazyLoadingManagerProps {
  children: React.ReactNode;
  enablePerformanceMonitoring?: boolean;
  enablePreloading?: boolean;
  maxConcurrentLoads?: number;
}

interface LazyLoadMetrics {
  componentName: string;
  loadTime: number;
  loadSize: number;
  loadPriority: string;
  timestamp: number;
}

// Global lazy loading registry
const lazyRegistry = new Map<string, LazyComponentConfig>();
const loadQueue = new Map<string, Promise<unknown>>();
const loadMetrics = new Map<string, LazyLoadMetrics>();

// Priority-based loading queue
class LazyLoadQueue {
  private queue: Array<{
    id: string;
    priority: number;
    loadFn: () => Promise<unknown>;
  }> = [];
  private loading = new Set<string>();
  private maxConcurrent = 3;

  enqueue(id: string, priority: number, loadFn: () => Promise<unknown>) {
    this.queue.push({ id, priority, loadFn });
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
    this.processQueue();
  }

  private async processQueue() {
    if (this.loading.size >= this.maxConcurrent || this.queue.length === 0)
      return;

    const next = this.queue.shift();
    if (!next || this.loading.has(next.id)) return;

    this.loading.add(next.id);

    try {
      const startTime = performance.now();
      const result = await next.loadFn();
      const loadTime = performance.now() - startTime;

      // Track metrics
      loadMetrics.set(next.id, {
        componentName: next.id,
        loadTime,
        loadSize: 0, // Would need to be calculated separately
        loadPriority: this.getPriorityName(next.priority),
        timestamp: Date.now(),
      });

      console.log(
        `[Lazy Loading] ${next.id} loaded in ${loadTime.toFixed(2)}ms`,
      );
    } catch (error) {
      console.error(`[Lazy Loading] Failed to load ${next.id}:`, error);
    } finally {
      this.loading.delete(next.id);
      // Process next item
      setTimeout(() => this.processQueue(), 0);
    }
  }

  private getPriorityName(priority: number): string {
    if (priority >= 90) return "critical";
    if (priority >= 70) return "high";
    if (priority >= 50) return "medium";
    return "low";
  }
}

const loadQueueManager = new LazyLoadQueue();

// Hook for lazy loading with priority management
export function useLazyComponent<T extends React.ComponentType<unknown>>(
  componentId: string,
  config: LazyComponentConfig,
): {
  Component: T | null;
  isLoading: boolean;
  error: Error | null;
  load: () => void;
  priority: number;
} {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);

  // Calculate priority score
  const priority = React.useMemo(() => {
    const basePriority =
      { critical: 100, high: 75, medium: 50, low: 25 }[config.priority] || 50;
    // Boost priority for visible components
    return basePriority;
  }, [config.priority]);

  const load = useCallback(async () => {
    if (hasLoadedRef.current || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check custom load condition
      if (config.loadCondition && !config.loadCondition()) {
        console.log(
          `[Lazy Loading] Skipping ${componentId} due to load condition`,
        );
        return;
      }

      // Use queue manager for priority-based loading
      const loadPromise = new Promise<T>(async (resolve, reject) => {
        try {
          const module = await config.component();
          resolve(module.default as T);
        } catch (err) {
          reject(err);
        }
      });

      loadQueue.set(componentId, loadPromise);
      loadQueueManager.enqueue(componentId, priority, () => loadPromise);

      const LoadedComponent = await loadPromise;
      setComponent(() => LoadedComponent);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err as Error);
      console.error(`[Lazy Loading] Error loading ${componentId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [componentId, config, priority, isLoading]);

  // Auto-load for critical components
  useEffect(() => {
    if (config.priority === "critical" && !hasLoadedRef.current) {
      load();
    }
  }, [config.priority, load]);

  return { Component, isLoading, error, load, priority };
}

// Intersection observer hook for viewport-based lazy loading
export function useViewportLazyLoading(
  componentId: string,
  config: LazyComponentConfig,
  options: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {},
) {
  const { threshold = 0.1, rootMargin = "50px", triggerOnce = true } = options;
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const lazyHook = useLazyComponent(componentId, config);

  useEffect(() => {
    if (inView && config.priority !== "critical") {
      lazyHook.load();
    }
  }, [inView, config.priority, lazyHook]);

  return { ...lazyHook, ref, inView };
}

// Performance-aware lazy loading with battery/network detection
export function useSmartLazyLoading(
  componentId: string,
  config: LazyComponentConfig,
) {
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    isSlowConnection: false,
    isLowBattery: false,
    isDataSaver: false,
  });

  useEffect(() => {
    // Detect device capabilities
    const checkCapabilities = async () => {
      const connection = safeNavigatorConnection();
      const battery = await safeNavigatorBattery();

      setDeviceCapabilities({
        isSlowConnection:
          connection &&
          (connection.effectiveType === "slow-2g" ||
            connection.effectiveType === "2g"),
        isLowBattery: battery && battery.level < 0.2,
        isDataSaver: false, // Note: saveData not available in our helper
      });
    };

    if (typeof navigator !== "undefined") {
      checkCapabilities();
    }
  }, []);

  // Adjust priority based on device capabilities
  const adjustedConfig = React.useMemo(
    () => ({
      ...config,
      priority:
        deviceCapabilities.isSlowConnection ||
        deviceCapabilities.isLowBattery ||
        deviceCapabilities.isDataSaver
          ? ("low" as const)
          : config.priority,
    }),
    [config, deviceCapabilities],
  );

  return useLazyComponent(componentId, adjustedConfig);
}

// Lazy loading manager component
export function LazyLoadingManager({
  children,
  enablePerformanceMonitoring = true,
  enablePreloading = true,
  maxConcurrentLoads = 3,
}: LazyLoadingManagerProps) {
  const [metrics, setMetrics] = useState<LazyLoadMetrics[]>([]);

  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const updateMetrics = () => {
      setMetrics(Array.from(loadMetrics.values()));
    };

    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [enablePerformanceMonitoring]);

  // Preload critical components
  useEffect(() => {
    if (!enablePreloading) return;

    const criticalComponents = Array.from(lazyRegistry.entries()).filter(
      ([, config]) => config.priority === "critical" && config.preload,
    );

    criticalComponents.forEach(([id, config]) => {
      // Preload in background
      config
        .component()
        .catch((err) =>
          console.warn(`[Lazy Loading] Failed to preload ${id}:`, err),
        );
    });
  }, [enablePreloading]);

  return (
    <>
      {children}
      {enablePerformanceMonitoring &&
        process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs z-50">
            <div className="font-bold mb-1">Lazy Loading Metrics</div>
            <div>Total loaded: {metrics.length}</div>
            <div>
              Avg load time:{" "}
              {metrics.length > 0
                ? (
                    metrics.reduce((sum, m) => sum + m.loadTime, 0) /
                    metrics.length
                  ).toFixed(0)
                : 0}
              ms
            </div>
          </div>
        )}
    </>
  );
}

// Register lazy component for global management
export function registerLazyComponent(id: string, config: LazyComponentConfig) {
  lazyRegistry.set(id, config);
}

// Get loading metrics for debugging
export function getLazyLoadingMetrics() {
  return {
    registry: Array.from(lazyRegistry.keys()),
    queue: Array.from(loadQueue.keys()),
    metrics: Array.from(loadMetrics.values()),
    queueManager: loadQueueManager,
  };
}
