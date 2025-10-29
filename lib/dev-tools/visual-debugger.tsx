"use client";

import React, { useState, useEffect } from "react";
import { useDevelopmentMode } from "./development-hooks";
import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import { tracer } from "../observability/tracer";

/**
 * Visual Debugger Component
 * Provides real-time debugging information overlay for development
 */

interface DebugPanelProps {
  title: string;
  children: React.ReactNode;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-left-group";
  groupIndex?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function DebugPanel({
  title,
  children,
  position = "top-right",
  groupIndex = 0,
  collapsible = true,
  defaultCollapsed = false,
}: DebugPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isVisible, setIsVisible] = useState(true);

  const getPositionStyles = () => {
    const baseStyles = {
      "top-left": { top: "20px", left: "20px" },
      "top-right": { top: "20px", right: "20px" },
      "bottom-left": { bottom: "20px", left: "20px" },
      "bottom-right": { bottom: "20px", right: "20px" },
    };

    if (position === "top-left-group") {
      // Group panels vertically in top-left corner
      const panelHeight = 120; // Approximate height per panel
      const gap = 10; // Gap between panels
      return {
        top: `${20 + groupIndex * (panelHeight + gap)}px`,
        left: "20px",
      };
    }

    return baseStyles[position];
  };

  return (
    <div
      className="debug-panel"
      style={{
        position: "fixed",
        ...getPositionStyles(),
        width: "350px",
        maxHeight: "400px",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        overflow: "hidden",
      }}
    >
      <div
        className="debug-panel-header"
        style={{
          padding: "8px 12px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: collapsible ? "pointer" : "default",
        }}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
      >
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
          🐛 {title}
        </h4>
        <div style={{ display: "flex", gap: "4px" }}>
          {collapsible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {isCollapsed ? "▶" : "▼"}
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "#6b7280",
            }}
            title="Close panel"
          >
            ×
          </button>
        </div>
      </div>

      {!isCollapsed && isVisible && (
        <div
          className="debug-panel-content"
          style={{
            padding: "12px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ===== PERFORMANCE DEBUGGER =====

export function PerformanceDebugger() {
  const isDev = useDevelopmentMode();
  const [performanceData, setPerformanceData] = useState({
    pageLoadTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    longTasks: [] as Array<{ duration: number; startTime: number }>,
  });

  useEffect(() => {
    if (!isDev) return;

    // Track page load time
    if (typeof window !== "undefined" && window.performance) {
      const loadTime = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (loadTime) {
        setPerformanceData((prev) => ({
          ...prev,
          pageLoadTime: loadTime.loadEventEnd - loadTime.fetchStart,
        }));
      }
    }

    // Track memory usage
    const updateMemoryUsage = () => {
      if (typeof window !== "undefined" && (performance as any).memory) {
        const memInfo = (performance as any).memory;
        setPerformanceData((prev) => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    updateMemoryUsage();
    const memoryInterval = setInterval(updateMemoryUsage, 5000);

    // Track network requests
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      let requestCount = 0;

      window.fetch = function (...args) {
        requestCount++;
        setPerformanceData((prev) => ({
          ...prev,
          networkRequests: requestCount,
        }));
        return originalFetch.apply(this, args);
      };
    }

    // Track long tasks
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const longTasks = entries
          .filter((entry) => entry.duration > 50)
          .map((entry) => ({
            duration: entry.duration,
            startTime: entry.startTime,
          }));

        setPerformanceData((prev) => ({
          ...prev,
          longTasks: [...prev.longTasks, ...longTasks].slice(-10),
        }));
      });

      observer.observe({ entryTypes: ["longtask"] });
    }

    return () => {
      clearInterval(memoryInterval);
    };
  }, [isDev]);

  if (!isDev) return null;

  return (
    <DebugPanel title="Performance" position="top-left-group" groupIndex={1}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div>
          <strong>Page Load:</strong> {performanceData.pageLoadTime.toFixed(2)}
          ms
        </div>
        <div>
          <strong>Memory:</strong> {performanceData.memoryUsage.toFixed(2)} MB
        </div>
        <div>
          <strong>Network Requests:</strong> {performanceData.networkRequests}
        </div>
        <div>
          <strong>Long Tasks:</strong> {performanceData.longTasks.length}
          {performanceData.longTasks.length > 0 && (
            <div
              style={{ marginTop: "4px", fontSize: "11px", color: "#dc2626" }}
            >
              Last:{" "}
              {performanceData.longTasks[
                performanceData.longTasks.length - 1
              ]?.duration.toFixed(2)}
              ms
            </div>
          )}
        </div>
      </div>
    </DebugPanel>
  );
}

// ===== COMPOSITION DEBUGGER =====

export function CompositionDebugger() {
  const isDev = useDevelopmentMode();
  const [compositionStats, setCompositionStats] = useState({
    totalSections: 0,
    renderedSections: 0,
    failedSections: 0,
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

  if (!isDev) return null;

  return (
    <DebugPanel title="Composition" position="top-left-group" groupIndex={2}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div>
          <strong>Sections:</strong> {compositionStats.renderedSections}/
          {compositionStats.totalSections}
        </div>
        <div
          style={{
            color: compositionStats.failedSections > 0 ? "#dc2626" : "#6b7280",
          }}
        >
          <strong>Failed:</strong> {compositionStats.failedSections}
        </div>
        <div>
          <strong>Cache:</strong> {compositionStats.cacheHits} hits,{" "}
          {compositionStats.cacheMisses} misses
        </div>
        <div>
          <strong>Last Render:</strong>{" "}
          {compositionStats.lastCompositionTime.toFixed(2)}ms
        </div>
      </div>
    </DebugPanel>
  );
}

// ===== ERROR DEBUGGER =====

export function ErrorDebugger() {
  const isDev = useDevelopmentMode();
  const [errorStats, setErrorStats] = useState({
    totalErrors: 0,
    recentErrors: [] as Array<{
      message: string;
      component: string;
      timestamp: number;
    }>,
  });

  useEffect(() => {
    if (!isDev) return;

    const handleError = (event: CustomEvent) => {
      setErrorStats((prev) => ({
        totalErrors: prev.totalErrors + 1,
        recentErrors: [
          ...prev.recentErrors,
          {
            message: event.detail.message,
            component: event.detail.component,
            timestamp: event.detail.timestamp,
          },
        ].slice(-5), // Keep last 5 errors
      }));
    };

    window.addEventListener("debug:error", handleError as EventListener);

    return () => {
      window.removeEventListener("debug:error", handleError as EventListener);
    };
  }, [isDev]);

  if (!isDev) return null;

  return (
    <DebugPanel title="Errors" position="top-left-group" groupIndex={3}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{ color: errorStats.totalErrors > 0 ? "#dc2626" : "#6b7280" }}
        >
          <strong>Total Errors:</strong> {errorStats.totalErrors}
        </div>

        {errorStats.recentErrors.length > 0 && (
          <div>
            <strong>Recent Errors:</strong>
            <div
              style={{
                marginTop: "4px",
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              {errorStats.recentErrors.map((error, index) => (
                <div
                  key={index}
                  style={{
                    padding: "4px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "4px",
                    marginBottom: "4px",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ fontWeight: "bold", color: "#dc2626" }}>
                    {error.component}
                  </div>
                  <div style={{ color: "#6b7280" }}>{error.message}</div>
                  <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DebugPanel>
  );
}

// ===== METRICS DEBUGGER =====

export function MetricsDebugger() {
  const isDev = useDevelopmentMode();
  const [metricsData, setMetricsData] = useState({
    pageViews: 0,
    userActions: 0,
    apiCalls: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    if (!isDev) return;

    const interval = setInterval(() => {
      // In a real implementation, you'd get this from the metrics collector
      setMetricsData({
        pageViews: Math.floor(Math.random() * 100),
        userActions: Math.floor(Math.random() * 50),
        apiCalls: Math.floor(Math.random() * 20),
        avgResponseTime: Math.random() * 500 + 100,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isDev]);

  if (!isDev) return null;

  return (
    <DebugPanel title="Metrics" position="top-left-group" groupIndex={4}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div>
          <strong>Page Views:</strong> {metricsData.pageViews}
        </div>
        <div>
          <strong>User Actions:</strong> {metricsData.userActions}
        </div>
        <div>
          <strong>API Calls:</strong> {metricsData.apiCalls}
        </div>
        <div>
          <strong>Avg Response:</strong>{" "}
          {metricsData.avgResponseTime.toFixed(2)}ms
        </div>
      </div>
    </DebugPanel>
  );
}

// ===== MAIN DEBUG OVERLAY =====

type PanelKey = "performance" | "composition" | "errors" | "metrics";

export function DebugOverlay() {
  const isDev = useDevelopmentMode();
  const [showControls, setShowControls] = useState(true);
  const [visiblePanels, setVisiblePanels] = useState<Record<PanelKey, boolean>>(
    {
      performance: true,
      composition: true,
      errors: true,
      metrics: true,
    },
  );

  const togglePanel = (panel: PanelKey) => {
    setVisiblePanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  };

  // Listen for keyboard shortcut to show controls
  useEffect(() => {
    const handleShowControls = () => {
      setShowControls(true);
    };

    window.addEventListener("showDebugControls", handleShowControls);
    return () =>
      window.removeEventListener("showDebugControls", handleShowControls);
  }, []);

  if (!isDev) return null;

  return (
    <>
      {showControls && (
        <DebugControllerPanel
          visiblePanels={visiblePanels}
          onTogglePanel={togglePanel}
          onToggleControls={() => setShowControls(false)}
        />
      )}
      {visiblePanels.performance && <PerformanceDebugger />}
      {visiblePanels.composition && <CompositionDebugger />}
      {visiblePanels.errors && <ErrorDebugger />}
      {visiblePanels.metrics && <MetricsDebugger />}
    </>
  );
}

// Helper component for the debug controller
function DebugControllerPanel({
  visiblePanels,
  onTogglePanel,
  onToggleControls,
}: {
  visiblePanels: Record<PanelKey, boolean>;
  onTogglePanel: (panel: PanelKey) => void;
  onToggleControls: () => void;
}) {
  return (
    <DebugPanel title="Debug Controls" position="top-left-group" groupIndex={0}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div
          style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}
        >
          Toggle debug panels:
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
          }}
        >
          <input
            type="checkbox"
            checked={visiblePanels.performance}
            onChange={() => onTogglePanel("performance")}
            style={{ margin: 0 }}
          />
          <span>Performance</span>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
          }}
        >
          <input
            type="checkbox"
            checked={visiblePanels.composition}
            onChange={() => onTogglePanel("composition")}
            style={{ margin: 0 }}
          />
          <span>Composition</span>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
          }}
        >
          <input
            type="checkbox"
            checked={visiblePanels.errors}
            onChange={() => onTogglePanel("errors")}
            style={{ margin: 0 }}
          />
          <span>Errors</span>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
          }}
        >
          <input
            type="checkbox"
            checked={visiblePanels.metrics}
            onChange={() => onTogglePanel("metrics")}
            style={{ margin: 0 }}
          />
          <span>Metrics</span>
        </label>

        <button
          onClick={onToggleControls}
          style={{
            marginTop: "8px",
            padding: "4px 8px",
            fontSize: "11px",
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Hide Controls
        </button>
      </div>
    </DebugPanel>
  );
}

// ===== DEBUG UTILITIES =====

export const DebugUtils = {
  // Log component render
  logRender: (componentName: string, props?: any) => {
    if (process.env.NODE_ENV === "development") {
      logger.debug(`Component render: ${componentName}`, { props });
    }
  },

  // Log performance timing
  async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;

      if (process.env.NODE_ENV === "development") {
        logger.debug(`Function timing: ${name}`, { duration });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`Function error: ${name}`, {
        duration,
        error: error as Error,
      });
      throw error;
    }
  },

  // Visual highlight element
  highlightElement: (
    element: HTMLElement,
    color = "#3b82f6",
    duration = 2000,
  ) => {
    if (process.env.NODE_ENV !== "development") return;

    const originalBorder = element.style.border;
    const originalBoxShadow = element.style.boxShadow;

    element.style.border = `2px solid ${color}`;
    element.style.boxShadow = `0 0 10px ${color}`;

    setTimeout(() => {
      element.style.border = originalBorder;
      element.style.boxShadow = originalBoxShadow;
    }, duration);
  },

  // Console table for debugging
  logTable: (data: any[], title?: string) => {
    if (process.env.NODE_ENV === "development") {
      if (title) console.log(`📊 ${title}`);
      console.table(data);
    }
  },

  // Memory usage logger
  logMemoryUsage: () => {
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      if ("memory" in performance) {
        const memInfo = (performance as any).memory;
        logger.info("Memory usage", {
          used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
        });
      }
    }
  },
};

// ===== REACT DEVTOOLS INTEGRATION =====

export function useReactDevTools() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      // Log when React DevTools is available
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        logger.info("React DevTools detected");
      }
    }
  }, []);
}

// ===== GLOBAL DEBUG API =====

// Make debug utilities available globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).DebugUtils = DebugUtils;
  (window as any).Logger = logger;
  (window as any).Metrics = metrics;
  (window as any).Tracer = tracer;

  // Add keyboard shortcuts for debug controls
  document.addEventListener("keydown", (event) => {
    // Ctrl+Shift+D: Toggle all debug panels visibility
    if (event.ctrlKey && event.shiftKey && event.key === "D") {
      event.preventDefault();
      const debugPanels = document.querySelectorAll(".debug-panel");
      debugPanels.forEach((panel) => {
        const isVisible = (panel as HTMLElement).style.display !== "none";
        (panel as HTMLElement).style.display = isVisible ? "none" : "block";
      });
    }

    // Ctrl+Shift+C: Show debug controls panel
    if (event.ctrlKey && event.shiftKey && event.key === "C") {
      event.preventDefault();
      // This will be handled by the DebugOverlay component
      const debugControlsEvent = new CustomEvent("showDebugControls");
      window.dispatchEvent(debugControlsEvent);
    }
  });

  logger.info(
    "Debug utilities loaded. Press Ctrl+Shift+D to toggle debug panels, Ctrl+Shift+C to show controls.",
  );
}
