import { useState, useEffect, useCallback, useRef } from "react";
import { getSSRAdapter } from "../composition/container";
import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import { tracer } from "../observability/tracer";

/**
 * Development Tools for Enhanced DX
 * Provides debugging, performance monitoring, and development helpers
 */

// ===== DEVELOPMENT MODE DETECTION =====

export function useDevelopmentMode(): boolean {
  const ssrAdapter = getSSRAdapter();

  if (ssrAdapter.isServerContext()) {
    return process.env.NODE_ENV === "development";
  }

  return (
    typeof window !== "undefined" && window.location.hostname === "localhost"
  );
}

// ===== COMPONENT DEBUGGING HOOK =====

interface ComponentDebugInfo {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  renderDuration: number;
  propsChanged: boolean;
  stateChanged: boolean;
  effectRuns: number;
}

export function useComponentDebugger(
  componentName: string,
  props?: Record<string, any>,
  state?: Record<string, any>,
) {
  const isDev = useDevelopmentMode();
  const [debugInfo, setDebugInfo] = useState<ComponentDebugInfo>({
    componentName,
    renderCount: 0,
    lastRenderTime: 0,
    renderDuration: 0,
    propsChanged: false,
    stateChanged: false,
    effectRuns: 0,
  });

  const prevPropsRef = useRef(props);
  const prevStateRef = useRef(state);
  const renderStartTimeRef = useRef(0);

  // Track render start
  useEffect(() => {
    renderStartTimeRef.current = performance.now();
  });

  // Track render completion and changes
  useEffect(() => {
    if (!isDev) return;

    const renderDuration = performance.now() - renderStartTimeRef.current;
    const prevProps = prevPropsRef.current;
    const prevState = prevStateRef.current;

    const propsChanged = JSON.stringify(prevProps) !== JSON.stringify(props);
    const stateChanged = JSON.stringify(prevState) !== JSON.stringify(state);

    setDebugInfo((prev) => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      lastRenderTime: Date.now(),
      renderDuration,
      propsChanged,
      stateChanged,
    }));

    // Log significant changes
    if (propsChanged || stateChanged) {
      logger.debug(`Component re-rendered: ${componentName}`, {
        renderCount: debugInfo.renderCount + 1,
        renderDuration,
        propsChanged,
        stateChanged,
        component: componentName,
      });
    }

    // Update refs
    prevPropsRef.current = props;
    prevStateRef.current = state;
  }, [isDev, props, state, componentName, debugInfo.renderCount]);

  // Track effect runs
  const trackEffect = useCallback(
    (effectName: string, deps?: any[]) => {
      if (!isDev) return;

      setDebugInfo((prev) => ({
        ...prev,
        effectRuns: prev.effectRuns + 1,
      }));

      logger.debug(`Effect running: ${effectName} in ${componentName}`, {
        effectName,
        depsCount: deps?.length || 0,
        component: componentName,
      });
    },
    [componentName, isDev],
  );

  return {
    debugInfo,
    trackEffect,
    isDev,
  };
}

// ===== PERFORMANCE MONITORING HOOK =====

export function usePerformanceMonitor(
  operationName: string,
  tags: Record<string, string> = {},
) {
  const isDev = useDevelopmentMode();
  const [performanceData, setPerformanceData] = useState({
    operations: [] as Array<{
      name: string;
      duration: number;
      timestamp: number;
    }>,
    averageDuration: 0,
    totalOperations: 0,
  });

  const measureAsync = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationTags: Record<string, string> = {},
    ): Promise<T> => {
      const span = tracer.startSpan(operationName, undefined, {
        ...tags,
        ...operationTags,
      });
      const startTime = performance.now();

      try {
        const result = await operation();
        const duration = performance.now() - startTime;

        tracer.finishSpan(span);

        if (isDev) {
          setPerformanceData((prev) => {
            const newOperations = [
              ...prev.operations,
              {
                name: operationName,
                duration,
                timestamp: Date.now(),
              },
            ].slice(-10); // Keep last 10 operations

            const totalDuration = newOperations.reduce(
              (sum, op) => sum + op.duration,
              0,
            );
            const averageDuration =
              newOperations.length > 0
                ? totalDuration / newOperations.length
                : 0;

            return {
              operations: newOperations,
              averageDuration,
              totalOperations: prev.totalOperations + 1,
            };
          });

          logger.debug(`Async operation completed: ${operationName}`, {
            duration,
            operation: operationName,
            tags: { ...tags, ...operationTags },
          });
        }

        // Record metrics
        metrics.recordHistogram(
          `${operationName}_duration_seconds`,
          duration / 1000,
          tags,
        );

        return result;
      } catch (error) {
        tracer.finishSpan(span, error as Error);
        throw error;
      }
    },
    [operationName, tags, isDev],
  );

  const measureSync = useCallback(
    <T>(operation: () => T, operationTags: Record<string, string> = {}): T => {
      const span = tracer.startSpan(operationName, undefined, {
        ...tags,
        ...operationTags,
      });
      const startTime = performance.now();

      try {
        const result = operation();
        const duration = performance.now() - startTime;

        tracer.finishSpan(span);

        if (isDev) {
          setPerformanceData((prev) => {
            const newOperations = [
              ...prev.operations,
              {
                name: operationName,
                duration,
                timestamp: Date.now(),
              },
            ].slice(-10);

            const totalDuration = newOperations.reduce(
              (sum, op) => sum + op.duration,
              0,
            );
            const averageDuration =
              newOperations.length > 0
                ? totalDuration / newOperations.length
                : 0;

            return {
              operations: newOperations,
              averageDuration,
              totalOperations: prev.totalOperations + 1,
            };
          });

          logger.debug(`Sync operation completed: ${operationName}`, {
            duration,
            operation: operationName,
            tags: { ...tags, ...operationTags },
          });
        }

        // Record metrics
        metrics.recordHistogram(
          `${operationName}_duration_seconds`,
          duration / 1000,
          tags,
        );

        return result;
      } catch (error) {
        tracer.finishSpan(span, error as Error);
        throw error;
      }
    },
    [operationName, tags, isDev],
  );

  return {
    performanceData,
    measureAsync,
    measureSync,
    isDev,
  };
}

// ===== HOT RELOAD DETECTOR =====

export function useHotReloadDetector() {
  const isDev = useDevelopmentMode();
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!isDev) return;

    // Detect hot reloads by checking if this is a fresh mount
    const lastReload = sessionStorage.getItem("dev_last_reload");
    const now = Date.now();

    if (!lastReload || now - parseInt(lastReload) > 1000) {
      setReloadCount((prev) => prev + 1);
      sessionStorage.setItem("dev_last_reload", now.toString());

      logger.info("Hot reload detected", {
        reloadCount: reloadCount + 1,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isDev, reloadCount]);

  return reloadCount;
}

// ===== COMPOSITION DEBUGGER =====

export function useCompositionDebugger(pageType: string) {
  const isDev = useDevelopmentMode();
  const [compositionStats, setCompositionStats] = useState({
    sections: [] as string[],
    renderTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastCompositionTime: 0,
  });

  useEffect(() => {
    if (!isDev) return;

    // Listen for composition events
    const handleCompositionUpdate = (event: CustomEvent) => {
      setCompositionStats(event.detail);
    };

    window.addEventListener(
      "composition:stats",
      handleCompositionUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "composition:stats",
        handleCompositionUpdate as EventListener,
      );
    };
  }, [isDev]);

  const trackComposition = useCallback(
    (sections: any[], renderTime: number) => {
      if (!isDev) return;

      setCompositionStats({
        sections: sections.map((s) => s.id),
        renderTime,
        cacheHits: Math.floor(Math.random() * 10), // Mock data
        cacheMisses: Math.floor(Math.random() * 5),
        lastCompositionTime: renderTime,
      });

      logger.info("Composition debug data updated", {
        pageType,
        sectionsCount: sections.length,
        renderTime,
        sections: sections.map((s) => s.id),
      });
    },
    [isDev, pageType],
  );

  return {
    compositionStats,
    trackComposition,
    isDev,
  };
}
