// Component-specific circuit breaker for heavy components
// Prevents performance degradation when components become too resource-intensive

import { useEffect, useRef, useState } from "react";
import { getPerformanceCircuitBreaker } from "./use-performance-circuit-breaker";

interface ComponentCircuitBreakerConfig {
  componentName: string;
  maxTimers: number; // Max concurrent timers per component
  maxEventListeners: number; // Max concurrent event listeners per component
  maxMemoryUsage?: number; // Max memory usage in MB
  performanceThreshold: number; // Performance score threshold (0-1)
  cooldownPeriod: number; // Cooldown in ms after tripping
}

interface ComponentResourceTracker {
  timers: Set<NodeJS.Timeout>;
  eventListeners: Set<{
    element: EventTarget;
    event: string;
    listener: EventListener;
  }>;
  memoryUsage: number;
  lastPerformanceCheck: number;
}

class ComponentCircuitBreaker {
  private config: ComponentCircuitBreakerConfig;
  private resources: ComponentResourceTracker = {
    timers: new Set(),
    eventListeners: new Set(),
    memoryUsage: 0,
    lastPerformanceCheck: Date.now(),
  };

  private isOpen = false;
  private cooldownEndTime = 0;
  private performanceObserver?: PerformanceObserver;

  constructor(config: ComponentCircuitBreakerConfig) {
    this.config = config;
    this.initPerformanceMonitoring();
  }

  private initPerformanceMonitoring() {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const avgDuration =
          entries.reduce((sum, entry) => sum + entry.duration, 0) /
          entries.length;

        // Calculate performance score (lower duration = higher score)
        const targetDuration = 16.67; // ~60fps
        const performanceScore = Math.max(
          0.1,
          Math.min(1.0, targetDuration / avgDuration),
        );

        if (performanceScore < this.config.performanceThreshold) {
          this.tripCircuit();
        }
      });

      this.performanceObserver.observe({ entryTypes: ["measure"] });
    } catch (error) {
      console.warn(
        `[ComponentCircuitBreaker:${this.config.componentName}] Performance monitoring not available:`,
        error,
      );
    }
  }

  canAddTimer(): boolean {
    if (this.isOpen) {
      if (Date.now() >= this.cooldownEndTime) {
        this.isOpen = false;
        return true;
      }
      return false;
    }

    if (this.resources.timers.size >= this.config.maxTimers) {
      console.warn(
        `[ComponentCircuitBreaker:${this.config.componentName}] Too many timers, tripping circuit`,
      );
      this.tripCircuit();
      return false;
    }

    return true;
  }

  canAddEventListener(): boolean {
    if (this.resources.eventListeners.size >= this.config.maxEventListeners) {
      console.warn(
        `[ComponentCircuitBreaker:${this.config.componentName}] Too many event listeners, tripping circuit`,
      );
      this.tripCircuit();
      return false;
    }

    return true;
  }

  canPerformHeavyOperation(): boolean {
    if (this.isOpen) {
      return Date.now() >= this.cooldownEndTime;
    }

    // Check memory usage if available
    if (
      this.config.maxMemoryUsage &&
      typeof performance !== "undefined" &&
      (performance as any).memory
    ) {
      const memoryMB =
        (performance as any).memory.usedJSHeapSize / (1024 * 1024);
      if (memoryMB > this.config.maxMemoryUsage) {
        console.warn(
          `[ComponentCircuitBreaker:${this.config.componentName}] Memory usage too high (${memoryMB.toFixed(2)}MB), tripping circuit`,
        );
        this.tripCircuit();
        return false;
      }
    }

    return true;
  }

  trackTimer(timer: NodeJS.Timeout): void {
    this.resources.timers.add(timer);
  }

  trackEventListener(
    element: EventTarget,
    event: string,
    listener: EventListener,
  ): void {
    this.resources.eventListeners.add({ element, event, listener });
  }

  removeTimer(timer: NodeJS.Timeout): void {
    this.resources.timers.delete(timer);
  }

  removeEventListener(
    element: EventTarget,
    event: string,
    listener: EventListener,
  ): void {
    this.resources.eventListeners.forEach((tracked, index) => {
      if (
        tracked.element === element &&
        tracked.event === event &&
        tracked.listener === listener
      ) {
        this.resources.eventListeners.delete(tracked);
      }
    });
  }

  private tripCircuit(): void {
    this.isOpen = true;
    this.cooldownEndTime = Date.now() + this.config.cooldownPeriod;
    console.warn(
      `[ComponentCircuitBreaker:${this.config.componentName}] Circuit tripped. Cooldown until ${new Date(this.cooldownEndTime).toISOString()}`,
    );
  }

  getStats() {
    return {
      isOpen: this.isOpen,
      timers: this.resources.timers.size,
      eventListeners: this.resources.eventListeners.size,
      memoryUsage: this.resources.memoryUsage,
      cooldownRemaining: Math.max(0, this.cooldownEndTime - Date.now()),
      config: this.config,
    };
  }

  cleanup(): void {
    // Clear all timers
    this.resources.timers.forEach((timer) => clearTimeout(timer));
    this.resources.timers.clear();

    // Remove all event listeners
    this.resources.eventListeners.forEach(({ element, event, listener }) => {
      element.removeEventListener(event, listener);
    });
    this.resources.eventListeners.clear();

    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Global registry for component circuit breakers
const componentCircuitBreakers = new Map<string, ComponentCircuitBreaker>();

export function getComponentCircuitBreaker(
  componentName: string,
  config?: Partial<ComponentCircuitBreakerConfig>,
): ComponentCircuitBreaker {
  if (!componentCircuitBreakers.has(componentName)) {
    const defaultConfig: ComponentCircuitBreakerConfig = {
      componentName,
      maxTimers: 5,
      maxEventListeners: 10,
      maxMemoryUsage: 50, // 50MB
      performanceThreshold: 0.8,
      cooldownPeriod: 10000, // 10 seconds
      ...config,
    };

    componentCircuitBreakers.set(
      componentName,
      new ComponentCircuitBreaker(defaultConfig),
    );
  }

  return componentCircuitBreakers.get(componentName)!;
}

// Hook for component-specific circuit breaker
export function useComponentCircuitBreaker(
  componentName: string,
  config?: Partial<ComponentCircuitBreakerConfig>,
) {
  const circuitBreakerRef = useRef<ComponentCircuitBreaker | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    circuitBreakerRef.current = getComponentCircuitBreaker(
      componentName,
      config,
    );

    // Update stats periodically
    const updateStats = () => {
      if (circuitBreakerRef.current) {
        setStats(circuitBreakerRef.current.getStats());
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds

    return () => {
      clearInterval(interval);
      if (circuitBreakerRef.current) {
        circuitBreakerRef.current.cleanup();
      }
    };
  }, [componentName, config]);

  const safeSetTimeout = (
    callback: () => void,
    delay: number,
  ): NodeJS.Timeout | null => {
    if (!circuitBreakerRef.current?.canAddTimer()) {
      console.warn(
        `[ComponentCircuitBreaker:${componentName}] Cannot add timer due to circuit breaker`,
      );
      return null;
    }

    const timer = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error(
          `[ComponentCircuitBreaker:${componentName}] Timer callback error:`,
          error,
        );
      }
    }, delay);

    circuitBreakerRef.current.trackTimer(timer);
    return timer;
  };

  const safeAddEventListener = (
    element: EventTarget,
    event: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): boolean => {
    if (!circuitBreakerRef.current?.canAddEventListener()) {
      console.warn(
        `[ComponentCircuitBreaker:${componentName}] Cannot add event listener due to circuit breaker`,
      );
      return false;
    }

    try {
      element.addEventListener(event, listener, options);
      circuitBreakerRef.current.trackEventListener(element, event, listener);
      return true;
    } catch (error) {
      console.error(
        `[ComponentCircuitBreaker:${componentName}] Failed to add event listener:`,
        error,
      );
      return false;
    }
  };

  const safeRemoveEventListener = (
    element: EventTarget,
    event: string,
    listener: EventListener,
  ): void => {
    try {
      element.removeEventListener(event, listener);
      if (circuitBreakerRef.current) {
        circuitBreakerRef.current.removeEventListener(element, event, listener);
      }
    } catch (error) {
      console.error(
        `[ComponentCircuitBreaker:${componentName}] Failed to remove event listener:`,
        error,
      );
    }
  };

  const canPerformOperation = (): boolean => {
    return circuitBreakerRef.current?.canPerformHeavyOperation() ?? true;
  };

  return {
    safeSetTimeout,
    safeAddEventListener,
    safeRemoveEventListener,
    canPerformOperation,
    stats,
    isTripped: stats?.isOpen ?? false,
  };
}

// Hook for heavy component monitoring
export function useHeavyComponentMonitor(componentName: string) {
  const circuitBreaker = getComponentCircuitBreaker(componentName);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const checkHealth = () => {
      const stats = circuitBreaker.getStats();
      const newWarnings: string[] = [];

      if (stats.isOpen) {
        newWarnings.push(
          "Circuit breaker is open - component operations limited",
        );
      }

      if (stats.timers > stats.config.maxTimers * 0.8) {
        newWarnings.push(
          `High timer usage: ${stats.timers}/${stats.config.maxTimers}`,
        );
      }

      if (stats.eventListeners > stats.config.maxEventListeners * 0.8) {
        newWarnings.push(
          `High event listener usage: ${stats.eventListeners}/${stats.config.maxEventListeners}`,
        );
      }

      setWarnings(newWarnings);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [circuitBreaker]);

  return {
    warnings,
    stats: circuitBreaker.getStats(),
    hasWarnings: warnings.length > 0,
  };
}

// Utility to cleanup all component circuit breakers (useful for tests)
export function cleanupAllComponentCircuitBreakers(): void {
  componentCircuitBreakers.forEach((breaker) => breaker.cleanup());
  componentCircuitBreakers.clear();
}
