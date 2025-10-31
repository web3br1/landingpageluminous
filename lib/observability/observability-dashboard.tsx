"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { usePerformanceMonitor } from "@/lib/performance/optimized-lazy-loading";
import { withComponentContext, createTimedLogger } from "@/lib/architecture/logger-pattern";

/**
 * Observability Dashboard - Sprint T6
 * Centralized monitoring and analytics dashboard for the application
 */

interface ObservabilityMetrics {
  analytics: {
    journey: any;
    funnels: any;
    sessionHealth: 'good' | 'warning' | 'critical';
  };
  performance: {
    renderCount: number;
    averageLoadTime: number;
    memoryUsage: number;
    coreWebVitals: Record<string, number>;
  };
  errors: {
    total: number;
    rate: number;
    recent: Array<{
      message: string;
      timestamp: number;
      context: Record<string, unknown>;
    }>;
  };
  components: Array<{
    name: string;
    renderCount: number;
    lastRender: number;
    health: 'good' | 'warning' | 'critical';
  }>;
}

export function ObservabilityDashboard() {
  const [metrics, setMetrics] = useState<ObservabilityMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'performance' | 'errors'>('overview');

  const analytics = useAnalytics({
    trackErrors: true,
    trackPageViews: true,
    customTracking: { component: "observability-dashboard" }
  });

  const performanceMonitor = usePerformanceMonitor("ObservabilityDashboard");
  const logger = withComponentContext("observability", "dashboard");
  const timedLogger = createTimedLogger("observability", "metrics-collection");

  // Collect comprehensive metrics
  const collectMetrics = React.useCallback(async () => {
    try {
      (timedLogger as any).start();

      const journey = analytics.getJourney();
      const funnels = analytics.getFunnels();

      // Calculate session health
      const errorRate = (journey as any).errors.length / Math.max((journey as any).session.totalInteractions, 1);
      const sessionHealth: 'good' | 'warning' | 'critical' =
        errorRate > 0.1 ? 'critical' :
        errorRate > 0.05 ? 'warning' : 'good';

      // Performance metrics
      const performanceMetrics = {
        renderCount: performanceMonitor.renderCount,
        averageLoadTime: journey.performance.averageInteractionTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        coreWebVitals: {
          lcp: 0, // Would come from web-vitals
          fid: 0,
          cls: 0,
        },
      };

      // Component health tracking (mock data - would be collected from actual components)
      const components = [
        { name: 'Hero', renderCount: 1, lastRender: Date.now(), health: 'good' as const },
        { name: 'Features', renderCount: 2, lastRender: Date.now() - 1000, health: 'good' as const },
        { name: 'Pricing', renderCount: 1, lastRender: Date.now() - 2000, health: 'warning' as const },
      ];

      const newMetrics: ObservabilityMetrics = {
        analytics: {
          journey,
          funnels,
          sessionHealth,
        },
        performance: performanceMetrics,
        errors: {
          total: (journey as any).errors.length,
          rate: errorRate * 100,
          recent: (journey as any).errors.slice(-5),
        },
        components,
      };

      setMetrics(newMetrics);

      timedLogger.complete({
        metricsCollected: Object.keys(newMetrics).length,
        sessionHealth,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
      });

    } catch (error) {
      timedLogger.fail(error, {
        operation: "metrics-collection",
        component: "observability-dashboard"
      });

      logger.error(
        "Failed to collect observability metrics",
        error instanceof Error ? error : undefined,
        { activeTab }
      );
    }
  }, [analytics, performanceMonitor, timedLogger, logger, activeTab]);

  // Auto-refresh metrics every 10 seconds
  useEffect(() => {
    if (!isVisible) return;

    collectMetrics();
    const interval = setInterval(collectMetrics, 10000);
    return () => clearInterval(interval);
  }, [collectMetrics, isVisible]);

  // Keyboard shortcut to toggle dashboard (Ctrl+Shift+O)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'O') {
        event.preventDefault();
        setIsVisible(prev => !prev);
        analytics.trackEvent('observability', 'toggle_dashboard', 'keyboard', undefined, {
          visible: !isVisible,
          activeTab,
        }).catch(err => logger.warn("Failed to track dashboard toggle", { error: err }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analytics, logger, isVisible, activeTab]);

  // Health status indicators
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => {
          setIsVisible(true);
          analytics.trackEvent('observability', 'open_dashboard', 'button').catch(err =>
            logger.warn("Failed to track dashboard open", { error: err })
          );
        }}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        title="Open Observability Dashboard (Ctrl+Shift+O)"
      >
        📊 Obs
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Observability Dashboard</h2>
            <p className="text-sm text-gray-300">
              Real-time application monitoring and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={collectMetrics}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => {
                setIsVisible(false);
                analytics.trackEvent('observability', 'close_dashboard', 'button').catch(err =>
                  logger.warn("Failed to track dashboard close", { error: err })
                );
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 border-b">
          <div className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: '📈' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
              { id: 'performance', label: 'Performance', icon: '⚡' },
              { id: 'errors', label: 'Errors', icon: '🚨' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  analytics.trackEvent('observability', 'tab_switch', tab.id).catch(err =>
                    logger.warn("Failed to track tab switch", { error: err, tab: tab.id })
                  );
                }}
                className={`px-4 py-3 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          {!metrics ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Collecting metrics...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Session Health */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Session Health</p>
                        <p className={`text-2xl font-bold ${getHealthColor(metrics.analytics.sessionHealth)}`}>
                          {getHealthIcon(metrics.analytics.sessionHealth)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Page Views */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Page Views</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {metrics.analytics.journey.session.pageViews}
                        </p>
                      </div>
                      <span className="text-blue-500">👁️</span>
                    </div>
                  </div>

                  {/* Interactions */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Interactions</p>
                        <p className="text-2xl font-bold text-green-600">
                          {metrics.analytics.journey.session.totalInteractions}
                        </p>
                      </div>
                      <span className="text-green-500">🖱️</span>
                    </div>
                  </div>

                  {/* Errors */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Errors</p>
                        <p className={`text-2xl font-bold ${getHealthColor(metrics.errors.rate > 5 ? 'critical' : metrics.errors.rate > 2 ? 'warning' : 'good')}`}>
                          {metrics.errors.total}
                        </p>
                      </div>
                      <span className="text-red-500">🚨</span>
                    </div>
                  </div>

                  {/* Performance Overview */}
                  <div className="bg-white p-4 rounded-lg border md:col-span-2">
                    <h3 className="font-semibold mb-3">Performance Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Render Count</p>
                        <p className="text-lg font-semibold">{metrics.performance.renderCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Load Time</p>
                        <p className="text-lg font-semibold">
                          {metrics.performance.averageLoadTime.toFixed(0)}ms
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Funnel */}
                  <div className="bg-white p-4 rounded-lg border md:col-span-2">
                    <h3 className="font-semibold mb-3">Conversion Funnel</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Visitors</span>
                        <span className="font-semibold">{metrics.analytics.funnels.acquisition.visitors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversions</span>
                        <span className="font-semibold">{metrics.analytics.funnels.conversion.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Rate</span>
                        <span className="font-semibold text-green-600">
                          {metrics.analytics.funnels.conversion.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Journey Summary */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Journey Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Session Duration</span>
                          <span>{Math.round(metrics.analytics.journey.session.duration / 1000 / 60)}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pages Visited</span>
                          <span>{metrics.analytics.journey.pages.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversions</span>
                          <span>{metrics.analytics.journey.conversions.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Interactions */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Recent Interactions</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {metrics.analytics.journey.interactions.slice(-10).map((interaction, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{interaction.type}</span>
                            <span className="text-gray-500 ml-2">
                              {new Date(interaction.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Component Performance */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Component Performance</h3>
                      <div className="space-y-2">
                        {metrics.components.map((component) => (
                          <div key={component.name} className="flex justify-between items-center">
                            <span className="text-sm">{component.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${getHealthColor(component.health)}`}>
                                {component.renderCount} renders
                              </span>
                              <span>{getHealthIcon(component.health)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Memory Usage</h3>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {(metrics.performance.memoryUsage / 1024 / 1024).toFixed(1)} MB
                        </div>
                        <p className="text-sm text-gray-600">Used JS Heap</p>
                      </div>
                    </div>

                    {/* Core Web Vitals */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Core Web Vitals</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">LCP</span>
                          <span className={`font-semibold ${metrics.performance.coreWebVitals.lcp > 2500 ? 'text-red-600' : 'text-green-600'}`}>
                            {metrics.performance.coreWebVitals.lcp || 'N/A'}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">FID</span>
                          <span className={`font-semibold ${metrics.performance.coreWebVitals.fid > 100 ? 'text-red-600' : 'text-green-600'}`}>
                            {metrics.performance.coreWebVitals.fid || 'N/A'}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">CLS</span>
                          <span className={`font-semibold ${metrics.performance.coreWebVitals.cls > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                            {metrics.performance.coreWebVitals.cls || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors Tab */}
              {activeTab === 'errors' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Error Summary */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Error Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Errors</span>
                          <span className="font-semibold text-red-600">{metrics.errors.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Rate</span>
                          <span className={`font-semibold ${metrics.errors.rate > 5 ? 'text-red-600' : metrics.errors.rate > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {metrics.errors.rate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Errors */}
                    <div className="bg-white p-4 rounded-lg border lg:col-span-2">
                      <h3 className="font-semibold mb-3">Recent Errors</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {metrics.errors.recent.map((error, index) => (
                          <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{error.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(error.timestamp).toLocaleString()}
                                </p>
                                {error.context.url && (
                                  <p className="text-xs text-gray-500">
                                    URL: {error.context.url}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {metrics.errors.recent.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No recent errors</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
