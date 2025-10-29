"use client";

// ===== PERFORMANCE MONITORING SYSTEM =====
// Sistema avançado de monitoramento de performance para design system

import React, { forwardRef } from "react";
import type {
  AnimationMetrics,
  RuntimeContext,
  AnimationPerformanceError,
  UseAnimationControllerReturn,
} from "@/lib/types/design-system";

// ===== PERFORMANCE BUDGETS =====
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  lcp: 2500, // ms - Largest Contentful Paint
  fid: 100, // ms - First Input Delay
  cls: 0.1, // score - Cumulative Layout Shift

  // Custom budgets
  animationFrameTime: 16.67, // ms (60fps)
  memoryUsage: 50 * 1024 * 1024, // 50MB
  concurrentAnimations: 3,
  bundleSize: 200 * 1024, // 200KB

  // Network budgets
  timeToInteractive: 3000, // ms
  firstContentfulPaint: 1800, // ms
} as const;

// ===== PERFORMANCE MONITOR CLASS =====
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, AnimationMetrics> = new Map();
  private observers: PerformanceObserver[] = [];
  private runtimeContext: RuntimeContext;

  private constructor() {
    this.runtimeContext = this.getInitialRuntimeContext();
    this.setupObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // ===== RUNTIME CONTEXT =====
  private getInitialRuntimeContext(): RuntimeContext {
    const viewport =
      typeof window !== "undefined"
        ? {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: window.innerWidth < 768,
            isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
            isDesktop: window.innerWidth >= 1024,
          }
        : {
            width: 1920,
            height: 1080,
            isMobile: false,
            isTablet: false,
            isDesktop: true,
          };

    return {
      viewport,
      preferences: {
        reducedMotion:
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        highContrast:
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-contrast: high)").matches,
        theme: "light", // This will be managed by theme provider
      },
      performance: {
        fps: 60,
        memoryUsage: 0,
        connectionSpeed: "fast",
      },
    };
  }

  private setupObservers(): void {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;

    // Monitor long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > PERFORMANCE_BUDGETS.animationFrameTime) {
            console.warn(`Long task detected: ${entry.duration}ms`);
            this.reportPerformanceIssue("long_task", {
              duration: entry.duration,
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn("Long task monitoring not supported");
    }

    // Monitor layout shifts
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        if (clsValue > PERFORMANCE_BUDGETS.cls) {
          console.warn(`High CLS detected: ${clsValue}`);
          this.reportPerformanceIssue("high_cls", { value: clsValue });
        }
      });
      layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(layoutShiftObserver);
    } catch (e) {
      console.warn("Layout shift monitoring not supported");
    }
  }

  // ===== METRICS TRACKING =====
  startAnimationTracking(animationId: string): void {
    this.metrics.set(animationId, {
      activeAnimations: 1,
      droppedFrames: 0,
      averageDuration: 0,
    });
  }

  updateAnimationMetrics(
    animationId: string,
    metrics: Partial<AnimationMetrics>,
  ): void {
    const existing = this.metrics.get(animationId);
    if (existing) {
      this.metrics.set(animationId, { ...existing, ...metrics });
    }
  }

  endAnimationTracking(animationId: string): AnimationMetrics | null {
    const metrics = this.metrics.get(animationId);
    if (metrics) {
      this.metrics.delete(animationId);

      // Check performance budgets
      if (metrics.activeAnimations > PERFORMANCE_BUDGETS.concurrentAnimations) {
        this.reportPerformanceIssue("concurrent_animations_exceeded", {
          animationId,
          count: metrics.activeAnimations,
        });
      }

      if (
        metrics.averageDuration >
        PERFORMANCE_BUDGETS.animationFrameTime * 2
      ) {
        this.reportPerformanceIssue("slow_animation", {
          animationId,
          duration: metrics.averageDuration,
        });
      }
    }
    return metrics || null;
  }

  // ===== PERFORMANCE CHECKS =====
  checkAnimationPerformance(animationId: string): boolean {
    const metrics = this.metrics.get(animationId);
    if (!metrics) return true;

    return (
      metrics.activeAnimations <= PERFORMANCE_BUDGETS.concurrentAnimations &&
      metrics.averageDuration <= PERFORMANCE_BUDGETS.animationFrameTime * 2 &&
      metrics.droppedFrames === 0
    );
  }

  // ===== RUNTIME CONTEXT UPDATES =====
  updateRuntimeContext(updates: Partial<RuntimeContext>): void {
    this.runtimeContext = {
      ...this.runtimeContext,
      ...updates,
      viewport: updates.viewport
        ? { ...this.runtimeContext.viewport, ...updates.viewport }
        : this.runtimeContext.viewport,
      preferences: updates.preferences
        ? { ...this.runtimeContext.preferences, ...updates.preferences }
        : this.runtimeContext.preferences,
      performance: updates.performance
        ? { ...this.runtimeContext.performance, ...updates.performance }
        : this.runtimeContext.performance,
    };
  }

  getRuntimeContext(): RuntimeContext {
    return this.runtimeContext;
  }

  // ===== PERFORMANCE REPORTING =====
  private reportPerformanceIssue(
    type: string,
    data: Record<string, unknown>,
  ): void {
    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Performance] ${type}:`, data);
    }

    // In production, you could send to monitoring service
    // Example: sendToMonitoring({ type, data, timestamp: Date.now() })
  }

  // ===== MEMORY MONITORING =====
  getMemoryUsage(): number {
    if (typeof window !== "undefined" && (window as any).performance?.memory) {
      return (window as any).performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  checkMemoryBudget(): boolean {
    const usage = this.getMemoryUsage();
    const isOverBudget = usage > PERFORMANCE_BUDGETS.memoryUsage;

    if (isOverBudget) {
      this.reportPerformanceIssue("memory_budget_exceeded", {
        usage,
        budget: PERFORMANCE_BUDGETS.memoryUsage,
      });
    }

    return !isOverBudget;
  }

  // ===== FRAME RATE MONITORING =====
  monitorFrameRate(callback: (fps: number) => void): () => void {
    // SSR safety: only run on client-side
    if (typeof window === "undefined" || !window.requestAnimationFrame) {
      return () => {};
    }

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        callback(fps);
        frameCount = 0;
        lastTime = currentTime;
      }

      if (fps < 30) {
        this.reportPerformanceIssue("low_fps", { fps });
      }

      requestAnimationFrame(measureFPS);
    };

    const rafId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(rafId);
  }

  // ===== CLEANUP =====
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// ===== PERFORMANCE HOOKS =====

/** Hook para monitoring de animações */
export function useAnimationPerformance(animationId: string) {
  const monitor = PerformanceMonitor.getInstance();

  React.useEffect(() => {
    monitor.startAnimationTracking(animationId);

    return () => {
      monitor.endAnimationTracking(animationId);
    };
  }, [animationId, monitor]);

  const updateMetrics = React.useCallback(
    (metrics: Partial<AnimationMetrics>) => {
      monitor.updateAnimationMetrics(animationId, metrics);
    },
    [animationId, monitor],
  );

  const isPerformingWell = React.useMemo(
    () => monitor.checkAnimationPerformance(animationId),
    [animationId, monitor],
  );

  return {
    updateMetrics,
    isPerformingWell,
    metrics: {}, // Metrics not accessible
  };
}

/** Hook para contexto de runtime */
export function useRuntimeContext() {
  const monitor = PerformanceMonitor.getInstance();
  const [context, setContext] = React.useState(monitor.getRuntimeContext());

  React.useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    const updateContext = () => {
      const newContext = monitor.getRuntimeContext();
      setContext((prev) => {
        // Only update if something changed
        return JSON.stringify(prev) !== JSON.stringify(newContext)
          ? newContext
          : prev;
      });
    };

    // Update on mount and when viewport changes
    updateContext();

    const handleResize = () => {
      monitor.updateRuntimeContext({
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          isMobile: window.innerWidth < 768,
          isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
          isDesktop: window.innerWidth >= 1024,
        },
      });
      updateContext();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [monitor]);

  return context;
}

/** Hook para monitoring de performance geral */
export function usePerformanceMonitoring() {
  const monitor = PerformanceMonitor.getInstance();
  const [metrics, setMetrics] = React.useState({
    fps: 60,
    memoryUsage: 0,
    activeAnimations: 0,
  });

  React.useEffect(() => {
    // Monitor FPS
    const stopFPSMonitoring = monitor.monitorFrameRate((fps) => {
      setMetrics((prev) => ({ ...prev, fps }));
    });

    // Monitor memory and animations
    const interval = setInterval(() => {
      const memoryUsage = monitor.getMemoryUsage();
      const activeAnimations = 0; // Cannot access private metrics

      setMetrics((prev) => ({
        ...prev,
        memoryUsage,
        activeAnimations,
      }));

      // Check budgets
      monitor.checkMemoryBudget();
    }, 1000);

    return () => {
      stopFPSMonitoring();
      clearInterval(interval);
    };
  }, [monitor]);

  return {
    ...metrics,
    runtimeContext: monitor.getRuntimeContext(),
    isWithinBudgets: {
      memory: monitor.checkMemoryBudget(),
      fps: metrics.fps >= 30,
      animations:
        metrics.activeAnimations <= PERFORMANCE_BUDGETS.concurrentAnimations,
    },
  };
}

// ===== PERFORMANCE UTILITIES =====

/** Debounce function for performance */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/** Throttle function for performance */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/** Lazy loading utility for components */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries: number = 3,
): React.LazyExoticComponent<T> {
  const retryImport = (attemptsLeft: number): Promise<{ default: T }> => {
    return importFunc().catch((error) => {
      if (attemptsLeft > 0) {
        console.warn(
          `Lazy loading failed, retrying... (${attemptsLeft} retries left)`,
        );
        return new Promise((resolve) =>
          setTimeout(() => resolve(retryImport(attemptsLeft - 1)), 1000),
        );
      } else {
        throw error;
      }
    });
  };

  return React.lazy(() => retryImport(retries));
}

/** Memory-aware component rendering */
export function withMemoryCheck<P extends object>(
  Component: React.ComponentType<P>,
) {
  const WrappedComponent = (props: P) => {
    const monitor = PerformanceMonitor.getInstance();
    const [shouldRender, setShouldRender] = React.useState(true);

    React.useEffect(() => {
      const checkMemory = () => {
        const isOverBudget = !monitor.checkMemoryBudget();
        setShouldRender(!isOverBudget);
      };

      checkMemory();
      const interval = setInterval(checkMemory, 5000); // Check every 5s

      return () => clearInterval(interval);
    }, [monitor]);

    return shouldRender ? <Component {...props} /> : null;
  };

  WrappedComponent.displayName = `withMemoryCheck(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}
