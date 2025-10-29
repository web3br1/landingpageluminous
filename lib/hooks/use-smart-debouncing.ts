// Smart debouncing system with adaptive timing based on performance and user behavior
// Optimizes scroll handlers and other frequent events for better performance

import { useCallback, useEffect, useRef, useState } from "react";
import { getPerformanceCircuitBreaker } from "./use-performance-circuit-breaker";

interface DebounceConfig {
  minDelay: number;
  maxDelay: number;
  adaptive: boolean;
  performanceThreshold: number;
  userActivityThreshold: number;
}

interface SmartDebounceState {
  lastCallTime: number;
  callCount: number;
  averageCallInterval: number;
  performanceScore: number;
  userActivityScore: number;
}

class SmartDebouncer {
  private config: DebounceConfig;
  private state: SmartDebounceState = {
    lastCallTime: 0,
    callCount: 0,
    averageCallInterval: 1000,
    performanceScore: 1.0,
    userActivityScore: 1.0,
  };

  private timeouts = new Map<string, NodeJS.Timeout>();
  private performanceObserver?: PerformanceObserver;

  constructor(config: Partial<DebounceConfig> = {}) {
    this.config = {
      minDelay: 16, // ~60fps
      maxDelay: 1000, // 1 second max
      adaptive: true,
      performanceThreshold: 0.8, // 80% performance score
      userActivityThreshold: 0.7, // 70% activity score
      ...config,
    };

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
        this.state.performanceScore = Math.max(
          0.1,
          Math.min(1.0, targetDuration / avgDuration),
        );
      });

      this.performanceObserver.observe({ entryTypes: ["measure"] });
    } catch (error) {
      console.warn(
        "[Smart Debouncing] Performance monitoring not available:",
        error,
      );
    }
  }

  debounce<T extends (...args: any[]) => any>(
    id: string,
    fn: T,
    context?: any,
  ): T {
    const debouncedFn = ((...args: any[]) => {
      const now = Date.now();

      // Update call statistics
      if (this.state.lastCallTime > 0) {
        const interval = now - this.state.lastCallTime;
        this.state.averageCallInterval =
          this.state.averageCallInterval * 0.9 + interval * 0.1;
      }
      this.state.lastCallTime = now;
      this.state.callCount++;

      // Calculate user activity score based on call frequency
      const expectedInterval = this.state.averageCallInterval || 1000;
      const actualFrequency = 1000 / expectedInterval;
      this.state.userActivityScore = Math.max(
        0.1,
        Math.min(1.0, actualFrequency / 60),
      ); // Normalize to 60fps

      // Calculate adaptive delay
      let delay = this.config.minDelay;

      if (this.config.adaptive) {
        // Increase delay when performance is poor
        if (this.state.performanceScore < this.config.performanceThreshold) {
          delay = Math.min(
            this.config.maxDelay,
            delay * (1 / this.state.performanceScore),
          );
        }

        // Increase delay when user activity is low
        if (this.state.userActivityScore < this.config.userActivityThreshold) {
          delay = Math.min(
            this.config.maxDelay,
            delay * (1 / this.state.userActivityScore),
          );
        }

        // Decrease delay for high-frequency events (like rapid scrolling)
        if (this.state.averageCallInterval < 50) {
          // Very frequent calls
          delay = Math.max(this.config.minDelay, delay * 0.5);
        }
      }

      // Clear existing timeout
      const existingTimeout = this.timeouts.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        try {
          fn.apply(context, args);
          this.timeouts.delete(id);
        } catch (error) {
          console.error(
            `[Smart Debouncing] Error in debounced function ${id}:`,
            error,
          );
          this.timeouts.delete(id);
        }
      }, delay);

      this.timeouts.set(id, timeout);
    }) as T;

    return debouncedFn;
  }

  cancel(id: string) {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }

  cancelAll() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }

  getStats() {
    return {
      ...this.state,
      activeTimeouts: this.timeouts.size,
      config: this.config,
    };
  }

  destroy() {
    this.cancelAll();
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Global smart debouncer instance
let globalSmartDebouncer: SmartDebouncer | null = null;

export function getSmartDebouncer(): SmartDebouncer {
  if (!globalSmartDebouncer) {
    globalSmartDebouncer = new SmartDebouncer({
      minDelay: 16,
      maxDelay: 1000,
      adaptive: true,
      performanceThreshold: 0.8,
      userActivityThreshold: 0.7,
    });
  }
  return globalSmartDebouncer;
}

// Hook for smart debouncing with cleanup
export function useSmartDebounce<T extends (...args: any[]) => any>(
  fn: T,
  id: string,
  config?: Partial<DebounceConfig>,
): T {
  const debouncerRef = useRef<SmartDebouncer | null>(null);
  const [debouncedFn, setDebouncedFn] = useState<T | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const circuitBreaker = getPerformanceCircuitBreaker();

    // Only create debouncer if circuit breaker allows
    if (!circuitBreaker.canPerformDomOperation()) {
      console.warn("[Smart Debounce] Skipping due to performance constraints");
      setDebouncedFn(() => fn); // Return original function
      return;
    }

    if (!debouncerRef.current) {
      debouncerRef.current = new SmartDebouncer(config);
    }

    const debounced = debouncerRef.current.debounce(id, fn);
    setDebouncedFn(() => debounced);

    circuitBreaker.recordDomOperation();

    return () => {
      if (debouncerRef.current) {
        debouncerRef.current.cancel(id);
      }
    };
  }, [fn, id, config]);

  useEffect(() => {
    return () => {
      if (debouncerRef.current) {
        debouncerRef.current.destroy();
      }
    };
  }, []);

  return debouncedFn || fn;
}

// Hook for smart scroll debouncing
export function useSmartScrollDebounce(
  callback: (scrollY: number) => void,
  id: string = "scroll",
) {
  const circuitBreaker = getPerformanceCircuitBreaker();
  const lastScrollRef = useRef(0);
  const isThrottledRef = useRef(false);

  const debouncedCallback = useSmartDebounce(
    useCallback(
      (scrollY: number) => {
        if (isThrottledRef.current) return;

        try {
          // Only call if scroll changed significantly
          if (Math.abs(scrollY - lastScrollRef.current) > 10) {
            callback(scrollY);
            lastScrollRef.current = scrollY;
            circuitBreaker.recordDomOperation();
          }
        } catch (error) {
          console.warn("[Smart Scroll Debounce] Callback error:", error);
          // Temporarily throttle on error
          isThrottledRef.current = true;
          setTimeout(() => {
            isThrottledRef.current = false;
          }, 1000);
        }
      },
      [callback, circuitBreaker],
    ),
    id,
    {
      minDelay: 16, // ~60fps
      maxDelay: 200, // Max 200ms for scroll
      adaptive: true,
    },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          debouncedCallback(scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    if (circuitBreaker.canAddEventListener()) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      circuitBreaker.recordEventListener();

      return () => {
        window.removeEventListener("scroll", handleScroll);
        circuitBreaker.removeEventListener();
      };
    } else {
      console.warn(
        "[Smart Scroll Debounce] Skipping scroll listener due to performance constraints",
      );
    }
  }, [debouncedCallback, circuitBreaker]);

  return {
    isThrottled: circuitBreaker.isCircuitOpen(),
    stats: globalSmartDebouncer?.getStats(),
    circuitBreakerMetrics: circuitBreaker.getMetrics(),
  };
}

// Hook for smart resize debouncing
export function useSmartResizeDebounce(
  callback: (size: { width: number; height: number }) => void,
  id: string = "resize",
) {
  const circuitBreaker = getPerformanceCircuitBreaker();

  const debouncedCallback = useSmartDebounce(
    useCallback(
      (size: { width: number; height: number }) => {
        try {
          callback(size);
          circuitBreaker.recordDomOperation();
        } catch (error) {
          console.warn("[Smart Resize Debounce] Callback error:", error);
        }
      },
      [callback, circuitBreaker],
    ),
    id,
    {
      minDelay: 100, // Resize is less frequent
      maxDelay: 500,
      adaptive: true,
    },
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const size = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      debouncedCallback(size);
    };

    if (circuitBreaker.canAddEventListener()) {
      window.addEventListener("resize", handleResize, { passive: true });
      circuitBreaker.recordEventListener();

      return () => {
        window.removeEventListener("resize", handleResize);
        circuitBreaker.removeEventListener();
      };
    } else {
      console.warn(
        "[Smart Resize Debounce] Skipping resize listener due to performance constraints",
      );
    }
  }, [debouncedCallback, circuitBreaker]);

  return {
    isThrottled: circuitBreaker.isCircuitOpen(),
    stats: globalSmartDebouncer?.getStats(),
    circuitBreakerMetrics: circuitBreaker.getMetrics(),
  };
}

// Hook for smart input debouncing (for search, form inputs)
export function useSmartInputDebounce(
  callback: (value: string) => void,
  id: string = "input",
  delay: number = 300,
) {
  const circuitBreaker = getPerformanceCircuitBreaker();

  const debouncedCallback = useSmartDebounce(
    useCallback(
      (value: string) => {
        try {
          callback(value);
          circuitBreaker.recordDomOperation();
        } catch (error) {
          console.warn("[Smart Input Debounce] Callback error:", error);
        }
      },
      [callback, circuitBreaker],
    ),
    id,
    {
      minDelay: delay,
      maxDelay: delay * 2,
      adaptive: false, // Input should have consistent delay
    },
  );

  return debouncedCallback;
}

// Utility function to get debouncing statistics for debugging
export function getSmartDebouncingStats() {
  return {
    debouncer: globalSmartDebouncer?.getStats(),
    circuitBreaker: getPerformanceCircuitBreaker().getMetrics(),
  };
}
