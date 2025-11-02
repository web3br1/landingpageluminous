/**
 * Lazy Loading Performance Monitor - BLOCO 2: Lazy Loading
 *
 * Sistema de monitoramento e analytics para performance de lazy loading
 * Coleta métricas detalhadas e fornece insights para otimização
 */

import { logger } from '../observability/logger';
import { componentCache } from './component-cache-manager';

interface LazyLoadMetric {
  component: string;
  cacheKey: string;
  timestamp: number;
  loadTime: number; // in ms
  size: number; // in bytes
  strategy: 'viewport' | 'manual' | 'preload' | 'critical';
  cached: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  success: boolean;
  error?: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  intersectionDelay?: number; // time from intersection to load start
}

interface PerformanceSnapshot {
  timestamp: number;
  totalComponents: number;
  loadedComponents: number;
  cachedComponents: number;
  averageLoadTime: number;
  cacheHitRate: number;
  preloadEfficiency: number;
  bundleSize: number;
  memoryUsage: number;
  lcp: number;
  cls: number;
  fid: number;
}

export class LazyLoadingPerformanceMonitor {
  private metrics: LazyLoadMetric[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.initializeObservers();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    logger.info("Lazy loading performance monitoring started");
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    logger.info("Lazy loading performance monitoring stopped");
  }

  /**
   * Record lazy load performance metric
   */
  recordMetric(metric: Omit<LazyLoadMetric, 'timestamp' | 'userAgent'>): void {
    if (!this.isMonitoring) return;

    const fullMetric: LazyLoadMetric = {
      ...metric,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: (navigator as any).deviceMemory,
    };

    this.metrics.push(fullMetric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant events
    if (metric.loadTime > 5000) { // Slow load
      logger.warn("Slow lazy component load", {
        component: metric.component,
        loadTime: metric.loadTime,
        cached: metric.cached,
      });
    }

    if (!metric.success) {
      logger.error("Lazy component load failed", {
        component: metric.component,
        error: metric.error,
      });
    }
  }

  /**
   * Take performance snapshot
   */
  takeSnapshot(): PerformanceSnapshot {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes

    const totalComponents = recentMetrics.length;
    const loadedComponents = recentMetrics.filter(m => m.success).length;
    const cachedComponents = recentMetrics.filter(m => m.cached).length;

    const averageLoadTime = totalComponents > 0
      ? recentMetrics.reduce((sum, m) => sum + m.loadTime, 0) / totalComponents
      : 0;

    const cacheHitRate = totalComponents > 0 ? cachedComponents / totalComponents : 0;
    const preloadEfficiency = this.calculatePreloadEfficiency(recentMetrics);

    // Get Core Web Vitals (simplified)
    const vitals = this.getCoreWebVitals();

    const snapshot: PerformanceSnapshot = {
      timestamp: now,
      totalComponents,
      loadedComponents,
      cachedComponents,
      averageLoadTime: Math.round(averageLoadTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      preloadEfficiency: Math.round(preloadEfficiency * 100) / 100,
      bundleSize: this.estimateBundleSize(),
      memoryUsage: this.getMemoryUsage(),
      lcp: vitals.lcp,
      cls: vitals.cls,
      fid: vitals.fid,
    };

    this.snapshots.push(snapshot);

    // Keep only last 50 snapshots
    if (this.snapshots.length > 50) {
      this.snapshots = this.snapshots.slice(-50);
    }

    logger.debug("Performance snapshot taken", {
      totalComponents,
      cacheHitRate,
      averageLoadTime,
    });

    return snapshot;
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    currentSnapshot: PerformanceSnapshot;
    trends: {
      loadTimeTrend: 'improving' | 'stable' | 'declining';
      cacheHitRateTrend: 'improving' | 'stable' | 'declining';
      memoryUsageTrend: 'increasing' | 'stable' | 'decreasing';
    };
    recommendations: string[];
    alerts: string[];
  } {
    const currentSnapshot = this.takeSnapshot();
    const previousSnapshots = this.snapshots.slice(-5); // Last 5 snapshots

    const trends = this.calculateTrends(previousSnapshots);
    const recommendations = this.generateRecommendations(currentSnapshot, trends);
    const alerts = this.generateAlerts(currentSnapshot);

    return {
      currentSnapshot,
      trends,
      recommendations,
      alerts,
    };
  }

  /**
   * Get metrics by component
   */
  getComponentMetrics(componentName: string): {
    totalLoads: number;
    averageLoadTime: number;
    cacheHitRate: number;
    failureRate: number;
    lastLoadTime: number;
  } {
    const componentMetrics = this.metrics.filter(m => m.component === componentName);

    if (componentMetrics.length === 0) {
      return {
        totalLoads: 0,
        averageLoadTime: 0,
        cacheHitRate: 0,
        failureRate: 0,
        lastLoadTime: 0,
      };
    }

    const totalLoads = componentMetrics.length;
    const successfulLoads = componentMetrics.filter(m => m.success);
    const cachedLoads = componentMetrics.filter(m => m.cached);

    const averageLoadTime = successfulLoads.reduce((sum, m) => sum + m.loadTime, 0) / successfulLoads.length;
    const cacheHitRate = cachedLoads.length / totalLoads;
    const failureRate = (totalLoads - successfulLoads.length) / totalLoads;
    const lastLoadTime = Math.max(...componentMetrics.map(m => m.timestamp));

    return {
      totalLoads,
      averageLoadTime: Math.round(averageLoadTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      lastLoadTime,
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    metrics: LazyLoadMetric[];
    snapshots: PerformanceSnapshot[];
    summary: {
      totalMetrics: number;
      dateRange: { start: number; end: number };
      componentCount: number;
      cacheStats: ReturnType<typeof componentCache.getStats>;
    };
  } {
    const dateRange = {
      start: Math.min(...this.metrics.map(m => m.timestamp)),
      end: Math.max(...this.metrics.map(m => m.timestamp)),
    };

    const componentCount = new Set(this.metrics.map(m => m.component)).size;

    return {
      metrics: this.metrics,
      snapshots: this.snapshots,
      summary: {
        totalMetrics: this.metrics.length,
        dateRange,
        componentCount,
        cacheStats: componentCache.getStats(),
      },
    };
  }

  /**
   * Initialize Performance Observers
   */
  private initializeObservers(): void {
    // Monitor Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          // Store LCP for later retrieval
          (window as any)._lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Monitor Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          (window as any)._cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          (window as any)._fid = (lastEntry as any).processingStart - lastEntry.startTime;
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

      } catch (error) {
        logger.warn("Performance observers not supported", { error: String(error) });
      }
    }
  }

  /**
   * Calculate preload efficiency
   */
  private calculatePreloadEfficiency(metrics: LazyLoadMetric[]): number {
    const preloadMetrics = metrics.filter(m => m.strategy === 'preload');
    if (preloadMetrics.length === 0) return 0;

    const successfulPreloads = preloadMetrics.filter(m => m.success);
    return successfulPreloads.length / preloadMetrics.length;
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(snapshots: PerformanceSnapshot[]): {
    loadTimeTrend: 'improving' | 'stable' | 'declining';
    cacheHitRateTrend: 'improving' | 'stable' | 'declining';
    memoryUsageTrend: 'increasing' | 'stable' | 'decreasing';
  } {
    if (snapshots.length < 2) {
      return {
        loadTimeTrend: 'stable',
        cacheHitRateTrend: 'stable',
        memoryUsageTrend: 'stable',
      };
    }

    const recent = snapshots.slice(-3);
    const older = snapshots.slice(-6, -3);

    if (older.length === 0) {
      return {
        loadTimeTrend: 'stable',
        cacheHitRateTrend: 'stable',
        memoryUsageTrend: 'stable',
      };
    }

    const avgLoadTimeRecent = recent.reduce((sum, s) => sum + s.averageLoadTime, 0) / recent.length;
    const avgLoadTimeOlder = older.reduce((sum, s) => sum + s.averageLoadTime, 0) / older.length;

    const avgCacheHitRecent = recent.reduce((sum, s) => sum + s.cacheHitRate, 0) / recent.length;
    const avgCacheHitOlder = older.reduce((sum, s) => sum + s.cacheHitRate, 0) / older.length;

    const avgMemoryRecent = recent.reduce((sum, s) => sum + s.memoryUsage, 0) / recent.length;
    const avgMemoryOlder = older.reduce((sum, s) => sum + s.memoryUsage, 0) / older.length;

    return {
      loadTimeTrend: this.getTrend(avgLoadTimeRecent, avgLoadTimeOlder, 'lower'),
      cacheHitRateTrend: this.getTrend(avgCacheHitRecent, avgCacheHitOlder, 'higher'),
      memoryUsageTrend: this.getTrend(avgMemoryRecent, avgMemoryOlder, 'lower'),
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    snapshot: PerformanceSnapshot,
    trends: any
  ): string[] {
    const recommendations: string[] = [];

    if (snapshot.averageLoadTime > 3000) {
      recommendations.push("Average load time is high (>3s). Consider optimizing bundle sizes.");
    }

    if (snapshot.cacheHitRate < 0.5) {
      recommendations.push("Cache hit rate is low (<50%). Review caching strategy.");
    }

    if (trends.loadTimeTrend === 'declining') {
      recommendations.push("Load times are increasing. Check for memory leaks or bundle bloat.");
    }

    if (snapshot.memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push("High memory usage detected. Consider cache eviction policies.");
    }

    if (snapshot.lcp > 2500) {
      recommendations.push("LCP is high (>2.5s). Critical components may need optimization.");
    }

    return recommendations;
  }

  /**
   * Generate performance alerts
   */
  private generateAlerts(snapshot: PerformanceSnapshot): string[] {
    const alerts: string[] = [];

    if (snapshot.averageLoadTime > 5000) {
      alerts.push("CRITICAL: Average load time exceeds 5s");
    }

    if (snapshot.lcp > 4000) {
      alerts.push("CRITICAL: LCP exceeds 4s - severe performance issue");
    }

    if (snapshot.cls > 0.25) {
      alerts.push("WARNING: CLS exceeds 0.25 - layout shift issues");
    }

    if (snapshot.memoryUsage > 200 * 1024 * 1024) { // 200MB
      alerts.push("WARNING: Memory usage exceeds 200MB");
    }

    return alerts;
  }

  /**
   * Get trend direction
   */
  private getTrend(
    recent: number,
    older: number,
    preferred: 'higher' | 'lower'
  ): 'improving' | 'stable' | 'declining' {
    const change = recent - older;
    const threshold = Math.abs(older) * 0.1; // 10% change

    if (Math.abs(change) < threshold) return 'stable';

    if (preferred === 'lower') {
      return change < 0 ? 'improving' : 'declining';
    } else {
      return change > 0 ? 'improving' : 'declining';
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string | undefined {
    if ('connection' in navigator) {
      return (navigator as any).connection?.effectiveType;
    }
    return undefined;
  }

  /**
   * Estimate current bundle size
   */
  private estimateBundleSize(): number {
    // Simplified estimation - in a real implementation,
    // this would track actual bundle sizes
    return 1024 * 1024; // 1MB placeholder
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get Core Web Vitals
   */
  private getCoreWebVitals(): { lcp: number; cls: number; fid: number } {
    return {
      lcp: (window as any)._lcp || 0,
      cls: (window as any)._cls || 0,
      fid: (window as any)._fid || 0,
    };
  }
}

// Singleton instance
export const lazyLoadingMonitor = new LazyLoadingPerformanceMonitor();
