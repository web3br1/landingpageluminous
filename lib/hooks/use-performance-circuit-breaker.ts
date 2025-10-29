// Performance Circuit Breaker for DOM-heavy hooks
// Prevents performance degradation when DOM operations become too frequent

import React from "react";

interface PerformanceMetrics {
  domOperations: number;
  eventListeners: number;
  observers: number;
  lastCheckTime: number;
}

interface CircuitBreakerConfig {
  maxDomOperations: number; // Max operations per time window
  maxEventListeners: number; // Max concurrent event listeners
  maxObservers: number; // Max concurrent observers
  timeWindow: number; // Time window in ms
  cooldownPeriod: number; // Cooldown before allowing operations again
}

class PerformanceCircuitBreaker {
  private metrics: PerformanceMetrics = {
    domOperations: 0,
    eventListeners: 0,
    observers: 0,
    lastCheckTime: Date.now(),
  };

  private config: CircuitBreakerConfig;
  private isOpen = false;
  private cooldownEndTime = 0;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      maxDomOperations: 100,
      maxEventListeners: 20,
      maxObservers: 10,
      timeWindow: 1000, // 1 second
      cooldownPeriod: 5000, // 5 seconds
      ...config,
    };
  }

  canPerformDomOperation(): boolean {
    this.resetMetricsIfExpired();

    if (this.isOpen) {
      if (Date.now() >= this.cooldownEndTime) {
        this.isOpen = false;
        this.resetMetrics();
        return true;
      }
      return false;
    }

    if (this.metrics.domOperations >= this.config.maxDomOperations) {
      this.openCircuit();
      return false;
    }

    return true;
  }

  canAddEventListener(): boolean {
    if (this.metrics.eventListeners >= this.config.maxEventListeners) {
      console.warn(
        "[Performance Circuit Breaker] Too many event listeners, blocking new additions",
      );
      return false;
    }
    return true;
  }

  canAddObserver(): boolean {
    if (this.metrics.observers >= this.config.maxObservers) {
      console.warn(
        "[Performance Circuit Breaker] Too many observers, blocking new additions",
      );
      return false;
    }
    return true;
  }

  recordDomOperation(): void {
    this.metrics.domOperations++;
  }

  recordEventListener(): void {
    this.metrics.eventListeners++;
  }

  recordObserver(): void {
    this.metrics.observers++;
  }

  removeEventListener(): void {
    this.metrics.eventListeners = Math.max(0, this.metrics.eventListeners - 1);
  }

  removeObserver(): void {
    this.metrics.observers = Math.max(0, this.metrics.observers - 1);
  }

  private resetMetricsIfExpired(): void {
    const now = Date.now();
    if (now - this.metrics.lastCheckTime >= this.config.timeWindow) {
      this.resetMetrics();
    }
  }

  private resetMetrics(): void {
    this.metrics = {
      domOperations: 0,
      eventListeners: 0,
      observers: 0,
      lastCheckTime: Date.now(),
    };
  }

  private openCircuit(): void {
    this.isOpen = true;
    this.cooldownEndTime = Date.now() + this.config.cooldownPeriod;
    console.warn(
      `[Performance Circuit Breaker] Circuit opened. Cooldown until ${new Date(this.cooldownEndTime).toISOString()}`,
    );
  }

  getMetrics(): Readonly<PerformanceMetrics> {
    return { ...this.metrics };
  }

  isCircuitOpen(): boolean {
    return this.isOpen;
  }
}

// Global performance circuit breaker instance
let globalPerformanceCircuitBreaker: PerformanceCircuitBreaker | null = null;

export function getPerformanceCircuitBreaker(): PerformanceCircuitBreaker {
  if (!globalPerformanceCircuitBreaker) {
    globalPerformanceCircuitBreaker = new PerformanceCircuitBreaker({
      maxDomOperations: 100,
      maxEventListeners: 20,
      maxObservers: 10,
      timeWindow: 1000,
      cooldownPeriod: 5000,
    });
  }
  return globalPerformanceCircuitBreaker;
}

// Hook for debounced scroll handling with circuit breaker
export function useDebouncedScroll(
  callback: (scrollY: number) => void,
  delay: number = 16, // ~60fps
) {
  const circuitBreaker = getPerformanceCircuitBreaker();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastScrollRef = React.useRef(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      if (!circuitBreaker.canPerformDomOperation()) return;

      const currentScroll = window.scrollY;

      // Only proceed if scroll changed significantly
      if (Math.abs(currentScroll - lastScrollRef.current) < 10) return;

      lastScrollRef.current = currentScroll;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        try {
          callback(currentScroll);
          circuitBreaker.recordDomOperation();
        } catch (error) {
          console.warn("[Debounced Scroll] Callback error:", error);
        }
      }, delay);
    };

    if (circuitBreaker.canAddEventListener()) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      circuitBreaker.recordEventListener();

      return () => {
        window.removeEventListener("scroll", handleScroll);
        circuitBreaker.removeEventListener();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      console.warn(
        "[Debounced Scroll] Skipping scroll listener due to performance constraints",
      );
      return () => {};
    }
  }, [callback, delay]);

  return {
    isThrottled: circuitBreaker.isCircuitOpen(),
    metrics: circuitBreaker.getMetrics(),
  };
}

// Hook for throttled intersection observer with circuit breaker
export function useThrottledIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {},
  throttleMs: number = 100,
) {
  const circuitBreaker = getPerformanceCircuitBreaker();
  const elementRef = React.useRef<Element | null>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = React.useRef(0);

  const setRef = React.useCallback(
    (element: Element | null) => {
      if (elementRef.current) {
        // Clean up previous observer
        if (observerRef.current) {
          observerRef.current.unobserve(elementRef.current);
          circuitBreaker.removeObserver();
        }
      }

      elementRef.current = element;

      if (element && circuitBreaker.canAddObserver()) {
        try {
          observerRef.current = new IntersectionObserver((entries) => {
            const now = Date.now();
            if (now - lastCallRef.current >= throttleMs) {
              lastCallRef.current = now;
              entries.forEach((entry) => {
                try {
                  callback(entry);
                  circuitBreaker.recordDomOperation();
                } catch (error) {
                  console.warn(
                    "[Throttled Intersection] Callback error:",
                    error,
                  );
                }
              });
            }
          }, options);

          observerRef.current.observe(element);
          circuitBreaker.recordObserver();
        } catch (error) {
          console.warn(
            "[Throttled Intersection] Failed to create observer:",
            error,
          );
        }
      } else if (element && !circuitBreaker.canAddObserver()) {
        console.warn(
          "[Throttled Intersection] Skipping observer due to performance constraints",
        );
      }
    },
    [callback, options, throttleMs],
  );

  React.useEffect(() => {
    return () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
        circuitBreaker.removeObserver();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ref: setRef,
    isThrottled: circuitBreaker.isCircuitOpen(),
    metrics: circuitBreaker.getMetrics(),
  };
}

// Hook for batched DOM updates with circuit breaker
export function useBatchedDomUpdates() {
  const circuitBreaker = getPerformanceCircuitBreaker();
  const updatesRef = React.useRef<Array<() => void>>([]);
  const rafRef = React.useRef<number | null>(null);

  const batchUpdate = React.useCallback((updateFn: () => void) => {
    if (!circuitBreaker.canPerformDomOperation()) {
      console.warn(
        "[Batched Updates] Skipping update due to performance constraints",
      );
      return;
    }

    updatesRef.current.push(updateFn);

    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      const updates = updatesRef.current;
      updatesRef.current = [];

      updates.forEach((update) => {
        try {
          update();
          circuitBreaker.recordDomOperation();
        } catch (error) {
          console.warn("[Batched Updates] Update error:", error);
        }
      });

      rafRef.current = null;
    });
  }, []);

  React.useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Execute any pending updates
      updatesRef.current.forEach((update) => {
        try {
          update();
        } catch (error) {
          console.warn("[Batched Updates] Cleanup update error:", error);
        }
      });
      updatesRef.current = [];
    };
  }, []);

  return {
    batchUpdate,
    isThrottled: circuitBreaker.isCircuitOpen(),
    metrics: circuitBreaker.getMetrics(),
    pendingUpdates: updatesRef.current.length,
  };
}
