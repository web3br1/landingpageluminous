import React, { useState, useEffect, useCallback, useRef } from "react";
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
      logger.debug(`Component ${componentName} re-rendered`, {
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

      logger.debug(`Effect ${effectName} running in ${componentName}`, {
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
    async <T,>(
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
    <T,>(operation: () => T, operationTags: Record<string, string> = {}): T => {
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

// ===== ERROR BOUNDARY WITH DEBUGGING =====

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string;
}

export class DebugErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; componentName?: string }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const isDev = process.env.NODE_ENV === "development";

    // Log error with full context
    logger.logError(error, {
      componentName: this.props.componentName,
      errorId: this.state.errorId,
      errorBoundary: true,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Record error metrics
    metrics.recordError(
      "react_error_boundary",
      this.props.componentName || "unknown",
      "high",
    );

    if (isDev) {
      console.error(`[DEBUG ERROR BOUNDARY] ${this.props.componentName}:`, {
        error,
        errorInfo,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
      });
    }

    this.setState({
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development";

      if (isDev) {
        return (
          <div
            className="debug-error-boundary"
            style={{
              padding: "20px",
              margin: "20px",
              border: "2px solid #ef4444",
              borderRadius: "8px",
              backgroundColor: "#fef2f2",
              fontFamily: "monospace",
            }}
          >
            <h2 style={{ color: "#dc2626", marginBottom: "16px" }}>
              🚨 Error Boundary: {this.props.componentName}
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <strong>Error ID:</strong> {this.state.errorId}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <strong>Error:</strong> {this.state.error?.message}
            </div>
            <details style={{ marginBottom: "16px" }}>
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                Stack Trace
              </summary>
              <pre
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "12px",
                  borderRadius: "4px",
                  marginTop: "8px",
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "300px",
                }}
              >
                {this.state.error?.stack}
              </pre>
            </details>
            <details>
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                Component Stack
              </summary>
              <pre
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "12px",
                  borderRadius: "4px",
                  marginTop: "8px",
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "300px",
                }}
              >
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        );
      }

      // Production error UI
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ color: "#6b7280", marginBottom: "16px" }}>
            Algo deu errado
          </h2>
          <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
            Desculpe pelo inconveniente. Nossa equipe foi notificada.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===== DEVELOPMENT OVERLAY =====

export function DevelopmentOverlay() {
  const isDev = useDevelopmentMode();
  const [isVisible, setIsVisible] = useState(false);
  const [metricsData, setMetricsData] = useState({
    pageViews: 0,
    errors: 0,
    avgLoadTime: 0,
  });

  useEffect(() => {
    if (!isDev) return;

    // Update metrics periodically
    const interval = setInterval(() => {
      setMetricsData({
        pageViews: Math.floor(Math.random() * 1000), // Mock data
        errors: Math.floor(Math.random() * 10),
        avgLoadTime: Math.random() * 1000 + 500,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isDev]);

  if (!isDev) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
        title="Toggle Development Overlay"
      >
        🛠️
      </button>

      {/* Overlay Panel */}
      {isVisible && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "80px",
            width: "350px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
            zIndex: 9998,
            fontFamily: "system-ui, sans-serif",
            fontSize: "14px",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
              🛠️ Development Overlay
            </h3>
          </div>

          <div style={{ padding: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <strong>Page Views:</strong> {metricsData.pageViews}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Errors:</strong> {metricsData.errors}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <strong>Avg Load Time:</strong>{" "}
              {metricsData.avgLoadTime.toFixed(2)}ms
            </div>

            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "12px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "8px",
                }}
              >
                Reload
              </button>

              <button
                onClick={() => {
                  // Clear local storage for testing
                  if (typeof window !== "undefined") {
                    localStorage.clear();
                    alert("Local storage cleared");
                  }
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Clear Storage
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ===== COMPOSITION DEBUGGER =====

export function useCompositionDebugger(pageType: string) {
  const isDev = useDevelopmentMode();
  const [compositionData, setCompositionData] = useState({
    sections: [] as string[],
    renderTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });

  const trackComposition = useCallback(
    (sections: any[], renderTime: number) => {
      if (!isDev) return;

      setCompositionData({
        sections: sections.map((s) => s.id),
        renderTime,
        cacheHits: Math.floor(Math.random() * 10), // Mock data
        cacheMisses: Math.floor(Math.random() * 5),
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
    compositionData,
    trackComposition,
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
