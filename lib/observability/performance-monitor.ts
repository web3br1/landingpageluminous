/**
 * Performance Monitoring Utilities - SSR Safe
 * Provides performance metrics collection with SSR protection
 */

import { isClient } from "../utils/browser-storage";
import { logger } from "../architecture/logger-pattern";

/**
 * Performance entry types
 */
export type PerformanceEntryType =
  | "navigation"
  | "resource"
  | "paint"
  | "measure"
  | "longtask";

/**
 * Memory usage information
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Performance timing information
 */
export interface PerformanceTiming {
  navigationStart: number;
  loadEventEnd: number;
  domContentLoadedEventEnd: number;
  responseStart: number;
  requestStart: number;
}

/**
 * Gets memory usage information (Chrome/Edge only)
 */
export function getMemoryUsage(): MemoryInfo | null {
  if (!isClient()) {
    return null;
  }

  try {
    // @ts-ignore - performance.memory is Chrome-specific
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }
  } catch (error) {
    console.warn("getMemoryUsage: Failed to access memory info:", error);
  }

  return null;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.set(name, value);

    // Log metadata if provided
    if (metadata) {
      logger.debug(`Metric recorded: ${name}`, { value, metadata });
    }
  }

  /**
   * Get a recorded metric
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Measure Core Web Vitals
   */
  measureCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    return {
      lcp: getLCP(),
      fid: getFID(),
      cls: getCLS(),
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Gets navigation timing information
 */
export function getNavigationTiming(): PerformanceTiming | null {
  if (!isClient() || !performance.timing) {
    return null;
  }

  try {
    const timing = performance.timing;
    return {
      navigationStart: timing.navigationStart,
      loadEventEnd: timing.loadEventEnd,
      domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
      responseStart: timing.responseStart,
      requestStart: timing.requestStart,
    };
  } catch (error) {
    console.warn("getNavigationTiming: Failed to access timing info:", error);
    return null;
  }
}

/**
 * Measures time between two points
 */
export function measurePerformance(
  startMark: string,
  endMark: string,
  measureName?: string
): number | null {
  if (!isClient() || !performance.mark || !performance.measure) {
    return null;
  }

  try {
    const measure = measureName || `${startMark}_to_${endMark}`;
    performance.measure(measure, startMark, endMark);
    const entries = performance.getEntriesByName(measure);
    return entries.length > 0 ? entries[0].duration : null;
  } catch (error) {
    console.warn(`measurePerformance: Failed to measure ${startMark} to ${endMark}:`, error);
    return null;
  }
}

/**
 * Sets a performance mark
 */
export function setPerformanceMark(name: string): boolean {
  if (!isClient() || !performance.mark) {
    return false;
  }

  try {
    performance.mark(name);
    return true;
  } catch (error) {
    console.warn(`setPerformanceMark: Failed to set mark ${name}:`, error);
    return false;
  }
}

/**
 * Clears a performance mark
 */
export function clearPerformanceMark(name: string): boolean {
  if (!isClient() || !performance.clearMarks) {
    return false;
  }

  try {
    performance.clearMarks(name);
    return true;
  } catch (error) {
    console.warn(`clearPerformanceMark: Failed to clear mark ${name}:`, error);
    return false;
  }
}

/**
 * Clears a performance measure
 */
export function clearPerformanceMeasure(name: string): boolean {
  if (!isClient() || !performance.clearMeasures) {
    return false;
  }

  try {
    performance.clearMeasures(name);
    return true;
  } catch (error) {
    console.warn(`clearPerformanceMeasure: Failed to clear measure ${name}:`, error);
    return false;
  }
}

/**
 * Gets performance entries by type
 */
export function getPerformanceEntries(type: PerformanceEntryType): PerformanceEntry[] {
  if (!isClient()) {
    return [];
  }

  try {
    return performance.getEntriesByType(type);
  } catch (error) {
    console.warn(`getPerformanceEntries: Failed to get ${type} entries:`, error);
    return [];
  }
}

/**
 * Calculates page load time
 */
export function getPageLoadTime(): number | null {
  if (!isClient()) {
    return null;
  }

  try {
    const timing = performance.timing;
    return timing.loadEventEnd - timing.navigationStart;
  } catch (error) {
    console.warn("getPageLoadTime: Failed to calculate load time:", error);
    return null;
  }
}

/**
 * Calculates DOM content loaded time
 */
export function getDOMContentLoadedTime(): number | null {
  if (!isClient()) {
    return null;
  }

  try {
    const timing = performance.timing;
    return timing.domContentLoadedEventEnd - timing.navigationStart;
  } catch (error) {
    console.warn("getDOMContentLoadedTime: Failed to calculate DOM content loaded time:", error);
    return null;
  }
}

/**
 * Gets the largest contentful paint (LCP) metric
 */
export function getLCP(): number | null {
  if (!isClient()) {
    return null;
  }

  try {
    const entries = performance.getEntriesByType("largest-contentful-paint");
    if (entries.length > 0) {
      return entries[entries.length - 1].startTime;
    }
  } catch (error) {
    console.warn("getLCP: Failed to get LCP:", error);
  }

  return null;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.set(name, value);

    // Log metadata if provided
    if (metadata) {
      logger.debug(`Metric recorded: ${name}`, { value, metadata });
    }
  }

  /**
   * Get a recorded metric
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Measure Core Web Vitals
   */
  measureCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    return {
      lcp: getLCP(),
      fid: getFID(),
      cls: getCLS(),
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Gets the first input delay (FID) metric
 */
export function getFID(): number | null {
  if (!isClient()) {
    return null;
  }

  try {
    const entries = performance.getEntriesByType("first-input");
    if (entries.length > 0) {
      return (entries[0] as any).processingStart - entries[0].startTime;
    }
  } catch (error) {
    console.warn("getFID: Failed to get FID:", error);
  }

  return null;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.set(name, value);

    // Log metadata if provided
    if (metadata) {
      logger.debug(`Metric recorded: ${name}`, { value, metadata });
    }
  }

  /**
   * Get a recorded metric
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Measure Core Web Vitals
   */
  measureCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    return {
      lcp: getLCP(),
      fid: getFID(),
      cls: getCLS(),
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Gets the cumulative layout shift (CLS) metric
 */
export function getCLS(): number | null {
  if (!isClient()) {
    return null;
  }

  try {
    const entries = performance.getEntriesByType("layout-shift");
    let clsValue = 0;
    for (const entry of entries) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    return clsValue;
  } catch (error) {
    console.warn("getCLS: Failed to get CLS:", error);
  }

  return null;
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void;
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.set(name, value);

    // Log metadata if provided
    if (metadata) {
      logger.debug(`Metric recorded: ${name}`, { value, metadata });
    }
  }

  /**
   * Get a recorded metric
   */
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Measure Core Web Vitals
   */
  measureCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    return {
      lcp: getLCP(),
      fid: getFID(),
      cls: getCLS(),
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();