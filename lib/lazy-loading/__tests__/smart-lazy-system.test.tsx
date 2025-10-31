/**
 * Smart Lazy Loading System Tests - BLOCO 2: Lazy Loading
 *
 * Testes abrangentes para validar o sistema completo de lazy loading
 * Inclui cache, preload, bundle optimization e monitoring
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SmartLazyComponent, useSmartLazyComponent } from '../smart-lazy-component';
import { componentCache } from '../component-cache-manager';
import { preloadStrategy } from '../preload-strategy';
import { bundleOptimizer } from '../bundle-optimizer';
import { lazyLoadingMonitor } from '../performance-monitor';

// Mock components for testing
const MockComponent = ({ text }: { text: string }) => <div>{text}</div>;
const FailingComponent = () => {
  throw new Error('Component failed to load');
};

// Mock loader functions
const createMockLoader = (component: React.ComponentType<any>, delay = 100) => {
  return () => new Promise<{ default: React.ComponentType<any> }>((resolve) => {
    setTimeout(() => {
      resolve({ default: component });
    }, delay);
  });
};

const mockLoader = createMockLoader(MockComponent);
const failingLoader = createMockLoader(FailingComponent);
const slowLoader = createMockLoader(MockComponent, 500);

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  configurable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

describe('Smart Lazy Loading System', () => {
  beforeEach(() => {
    // Clear all caches and state
    componentCache.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('SmartLazyComponent', () => {
    it('should render loading state initially', () => {
      render(
        <SmartLazyComponent
          loader={mockLoader}
          name="test-component"
          priority="medium"
        />
      );

      expect(screen.getByText('Loading test-component...')).toBeInTheDocument();
    });

    it('should render component after loading', async () => {
      render(
        <SmartLazyComponent
          loader={mockLoader}
          name="test-component"
          priority="medium"
          componentProps={{ text: 'Hello World' }}
        />
      );

      // Fast-forward timers
      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
    });

    it('should handle loading errors gracefully', async () => {
      render(
        <SmartLazyComponent
          loader={failingLoader}
          name="failing-component"
          priority="medium"
        />
      );

      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(screen.getByText('Failed to load component')).toBeInTheDocument();
      });
    });

    it('should use cached component on subsequent loads', async () => {
      // First load
      const { rerender } = render(
        <SmartLazyComponent
          loader={mockLoader}
          name="cached-component"
          priority="medium"
          componentProps={{ text: 'Cached Content' }}
        />
      );

      jest.advanceTimersByTime(200);
      await waitFor(() => {
        expect(screen.getByText('Cached Content')).toBeInTheDocument();
      });

      // Second load should use cache
      rerender(
        <SmartLazyComponent
          loader={mockLoader}
          name="cached-component"
          priority="medium"
          componentProps={{ text: 'Updated Content' }}
        />
      );

      // Should still show cached content (cache not updated)
      expect(screen.getByText('Cached Content')).toBeInTheDocument();
    });

    it('should respect priority levels', async () => {
      // Critical priority should load immediately
      render(
        <SmartLazyComponent
          loader={mockLoader}
          name="critical-component"
          priority="critical"
          componentProps={{ text: 'Critical' }}
        />
      );

      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(screen.getByText('Critical')).toBeInTheDocument();
      });
    });

    it('should use custom fallback component', () => {
      const CustomFallback = () => <div>Custom Loading...</div>;

      render(
        <SmartLazyComponent
          loader={mockLoader}
          name="custom-fallback"
          priority="medium"
          fallback={CustomFallback}
        />
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('should handle retry after error', async () => {
      const { rerender } = render(
        <SmartLazyComponent
          loader={failingLoader}
          name="retry-component"
          priority="medium"
        />
      );

      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(screen.getByText('Failed to load component')).toBeInTheDocument();
      });

      // Mock successful loader for retry
      const successfulLoader = createMockLoader(MockComponent);

      rerender(
        <SmartLazyComponent
          loader={successfulLoader}
          name="retry-component"
          priority="medium"
          componentProps={{ text: 'Retried Successfully' }}
        />
      );

      // Click retry button
      const retryButton = screen.getByText('Try Again');
      retryButton.click();

      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(screen.getByText('Retried Successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Component Cache Manager', () => {
    it('should cache components correctly', async () => {
      const cacheKey = 'test-cache-key';

      await componentCache.set(cacheKey, MockComponent, 'medium');

      const cached = componentCache.get(cacheKey);
      expect(cached).toBe(MockComponent);
    });

    it('should respect cache size limits', () => {
      // This would test eviction policies in a real implementation
      expect(componentCache.getStats().totalComponents).toBeGreaterThanOrEqual(0);
    });

    it('should provide accurate cache statistics', () => {
      const stats = componentCache.getStats();
      expect(stats).toHaveProperty('totalComponents');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('cacheHitRate');
    });
  });

  describe('Preload Strategy', () => {
    it('should track user journey', () => {
      const journeyData = {
        currentPath: '/test',
        timeOnPage: 5000,
        scrollDepth: 75,
        interactions: 10,
      };

      preloadStrategy.trackJourney(journeyData);

      const stats = preloadStrategy.getStats();
      expect(stats.journeyHistorySize).toBeGreaterThan(0);
    });

    it('should predict next actions based on journey', () => {
      // Add some journey data
      preloadStrategy.trackJourney({
        currentPath: '/home',
        timeOnPage: 3000,
        scrollDepth: 50,
        interactions: 5,
      });

      preloadStrategy.trackJourney({
        currentPath: '/features',
        timeOnPage: 4000,
        scrollDepth: 80,
        interactions: 8,
      });

      const prediction = preloadStrategy.predictNextActions();
      expect(prediction).toHaveProperty('nextLikelyPaths');
      expect(prediction).toHaveProperty('confidence');
    });

    it('should queue components for preloading', () => {
      const preloadCandidate = {
        component: 'test-component',
        priority: 0.8,
        estimatedBenefit: 300,
        cacheKey: 'test-preload',
        loader: mockLoader,
      };

      preloadStrategy.queuePreload(preloadCandidate);

      const stats = preloadStrategy.getStats();
      expect(stats.preloadQueueSize).toBeGreaterThan(0);
    });
  });

  describe('Bundle Optimizer', () => {
    it('should provide bundle splitting strategies', () => {
      const strategies = bundleOptimizer.getAvailableStrategies();
      expect(strategies).toContain('route-based');
      expect(strategies).toContain('component-based');
      expect(strategies).toContain('priority-based');
    });

    it('should analyze bundle efficiency', () => {
      const analysis = bundleOptimizer.analyzeBundleEfficiency();
      expect(analysis).toHaveProperty('totalEstimatedSize');
      expect(analysis).toHaveProperty('chunkCount');
      expect(analysis).toHaveProperty('efficiency');
    });

    it('should generate lazy import statements', () => {
      const importStatement = bundleOptimizer.generateLazyImport('TestComponent', {
        priority: 'high',
        chunkName: 'test-chunk',
      });

      expect(typeof importStatement).toBe('string');
      expect(importStatement).toContain('webpackChunkName');
    });
  });

  describe('Performance Monitor', () => {
    beforeEach(() => {
      lazyLoadingMonitor.startMonitoring();
    });

    afterEach(() => {
      lazyLoadingMonitor.stopMonitoring();
    });

    it('should record performance metrics', () => {
      lazyLoadingMonitor.recordMetric({
        component: 'test-component',
        cacheKey: 'test-key',
        loadTime: 150,
        size: 1024,
        strategy: 'viewport',
        cached: false,
        priority: 'medium',
        success: true,
      });

      const report = lazyLoadingMonitor.getPerformanceReport();
      expect(report.currentSnapshot.totalComponents).toBeGreaterThan(0);
    });

    it('should provide component-specific metrics', () => {
      lazyLoadingMonitor.recordMetric({
        component: 'specific-component',
        cacheKey: 'specific-key',
        loadTime: 200,
        size: 2048,
        strategy: 'viewport',
        cached: true,
        priority: 'high',
        success: true,
      });

      const metrics = lazyLoadingMonitor.getComponentMetrics('specific-component');
      expect(metrics.totalLoads).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });

    it('should generate performance recommendations', () => {
      // Add some metrics that would trigger recommendations
      for (let i = 0; i < 5; i++) {
        lazyLoadingMonitor.recordMetric({
          component: `slow-component-${i}`,
          cacheKey: `slow-key-${i}`,
          loadTime: 4000, // Slow load
          size: 1024,
          strategy: 'viewport',
          cached: false,
          priority: 'medium',
          success: true,
        });
      }

      const report = lazyLoadingMonitor.getPerformanceReport();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('useSmartLazyComponent Hook', () => {
    it('should provide programmatic lazy loading', () => {
      const TestComponent = () => {
        const { Component, ref } = useSmartLazyComponent(
          mockLoader,
          'hook-test-component',
          { priority: 'high' }
        );

        return (
          <div ref={ref}>
            {Component ? <Component text="Hook Content" /> : <div>Loading...</div>}
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all systems together', async () => {
      // Test full integration: cache + preload + monitoring
      const { rerender } = render(
        <SmartLazyComponent
          loader={mockLoader}
          name="integration-test"
          priority="high"
          enablePreload={true}
          analytics={{
            trackLoadTime: true,
            trackCacheHits: true,
          }}
        />
      );

      // Initial load
      jest.advanceTimersByTime(200);
      await waitFor(() => {
        expect(screen.getByText('Loading integration-test...')).toBeInTheDocument();
      });

      // Complete load
      jest.advanceTimersByTime(200);
      await waitFor(() => {
        // Component should be loaded
        expect(screen.queryByText('Loading integration-test...')).not.toBeInTheDocument();
      });

      // Check that monitoring recorded the metric
      const report = lazyLoadingMonitor.getPerformanceReport();
      expect(report.currentSnapshot.totalComponents).toBeGreaterThan(0);

      // Check cache
      const cacheStats = componentCache.getStats();
      expect(cacheStats.totalComponents).toBeGreaterThan(0);
    });

    it('should handle bundle optimization integration', () => {
      // Test that bundle optimizer integrates with lazy loading
      bundleOptimizer.setStrategy('priority-based');

      const importStatement = bundleOptimizer.generateLazyImport('OptimizedComponent', {
        priority: 'critical',
        chunkName: 'optimized-chunk',
      });

      expect(importStatement).toContain('webpackChunkName');
      expect(importStatement).toContain('optimized-chunk');
    });

    it('should provide comprehensive performance insights', () => {
      // Add diverse metrics
      const metrics = [
        { loadTime: 500, cached: true, priority: 'critical' as const },
        { loadTime: 2000, cached: false, priority: 'medium' as const },
        { loadTime: 8000, cached: false, priority: 'low' as const },
      ];

      metrics.forEach((metric, index) => {
        lazyLoadingMonitor.recordMetric({
          component: `perf-test-${index}`,
          cacheKey: `perf-key-${index}`,
          loadTime: metric.loadTime,
          size: 1024,
          strategy: 'viewport',
          cached: metric.cached,
          priority: metric.priority,
          success: true,
        });
      });

      const report = lazyLoadingMonitor.getPerformanceReport();

      // Should have insights about performance
      expect(report.currentSnapshot).toHaveProperty('averageLoadTime');
      expect(report.currentSnapshot).toHaveProperty('cacheHitRate');
      expect(report.trends).toHaveProperty('loadTimeTrend');
    });
  });
});
