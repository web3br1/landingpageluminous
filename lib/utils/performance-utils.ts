/**
 * Performance Utilities - Measurement and optimization helpers
 * Extracted from advanced-utils.ts to reduce file size
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { deepEqual } from "./formatting-utils";

/**
 * Request animation frame hook
 */
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  return requestRef.current;
}

/**
 * Memoized computation hook
 */
export function useMemoizedComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList
): T {
  const cacheRef = useRef<Map<string, T>>(new Map());

  return useMemo(() => {
    const key = JSON.stringify(deps);
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }
    const result = computeFn();
    cacheRef.current.set(key, result);
    return result;
  }, deps);
}

/**
 * Deep comparison hook
 */
export function useDeepCompare<T>(value: T): T {
  const ref = useRef<T | undefined>(undefined);
  const previous = ref.current;

  const isEqual = deepEqual(previous, value);

  useEffect(() => {
    if (!isEqual) {
      ref.current = value;
    }
  });

  return isEqual ? previous! : value;
}

/**
 * Performance measurement utility
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const end = performance.now();
    console.debug(`[Performance:${name}] ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`[Performance:${name}] Failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Render counter hook for debugging
 */
export function useRenderCounter(componentName: string) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    console.debug(`[RenderCounter:${componentName}] ${renderCount.current} renders`);
  });

  return renderCount.current;
}

/**
 * Memory usage monitoring (Chrome only)
 */
export function getMemoryUsage(): { used: number; total: number; limit: number } | null {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  return {
    used: (performance as any).memory.usedJSHeapSize,
    total: (performance as any).memory.totalJSHeapSize,
    limit: (performance as any).memory.jsHeapSizeLimit,
  };
}

/**
 * CPU performance measurement
 */
export function measureCPUPerformance(iterations: number = 100000): number {
  const start = performance.now();

  // Simple CPU-intensive operation
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sin(i) * Math.cos(i);
  }

  const end = performance.now();
  return end - start;
}
