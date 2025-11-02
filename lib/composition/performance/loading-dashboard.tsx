"use client";

import React, { useState, useEffect } from "react";

/**
 * Loading Performance Dashboard - Phase 2
 * Internal dashboard showing loading metrics and business impact
 */

interface LoadingMetrics {
  // Performance metrics
  averageLoadTime: number;
  sectionsLoaded: number;
  sectionsFailed: number;
  cacheHitRate: number;

  // Business impact
  conversionRate: number;
  bounceRate: number;
  lcpScore: number;
  clsScore: number;

  // Loading strategies
  strategyUsage: {
    eager: number;
    progressive: number;
    deferred: number;
  };

  // Section performance
  sectionMetrics: Array<{
    sectionId: string;
    loadTime: number;
    priority: string;
    strategy: string;
    impact: number; // Business impact score
  }>;
}

export function LoadingPerformanceDashboard() {
  const [metrics, setMetrics] = useState<LoadingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch from a metrics API
    // For now, simulate with realistic data
    const fetchMetrics = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockMetrics: LoadingMetrics = {
        averageLoadTime: 245,
        sectionsLoaded: 8,
        sectionsFailed: 0,
        cacheHitRate: 0.87,

        conversionRate: 3.2,
        bounceRate: 42.1,
        lcpScore: 1850,
        clsScore: 0.08,

        strategyUsage: {
          eager: 3,      // Hero, pricing
          progressive: 4, // Features, testimonials
          deferred: 2,    // Admin tools
        },

        sectionMetrics: [
          {
            sectionId: "hero",
            loadTime: 120,
            priority: "hero",
            strategy: "eager",
            impact: 95 // Critical for first impression
          },
          {
            sectionId: "pricing",
            loadTime: 180,
            priority: "early",
            strategy: "progressive",
            impact: 88 // Key conversion driver
          },
          {
            sectionId: "features",
            loadTime: 220,
            priority: "early",
            strategy: "progressive",
            impact: 76 // Important for engagement
          },
          {
            sectionId: "testimonials",
            loadTime: 290,
            priority: "deferred",
            strategy: "deferred",
            impact: 65 // Nice to have
          },
          {
            sectionId: "faq",
            loadTime: 150,
            priority: "deferred",
            strategy: "progressive",
            impact: 58 // Secondary
          }
        ]
      };

      setMetrics(mockMetrics);
      setIsLoading(false);
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-dashboard-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-red-600">Failed to load metrics</div>;
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return "text-green-600 bg-green-50 border-green-200";
    if (value <= thresholds.warning) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="loading-performance-dashboard p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Loading Performance Dashboard
        </h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`p-4 rounded-lg border ${getStatusColor(metrics.lcpScore, { good: 2500, warning: 4000 })}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">LCP Score</p>
              <p className="text-2xl font-bold">{metrics.lcpScore}ms</p>
            </div>
            <div className="text-2xl">⚡</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(metrics.clsScore, { good: 0.1, warning: 0.25 })}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CLS Score</p>
              <p className="text-2xl font-bold">{metrics.clsScore}</p>
            </div>
            <div className="text-2xl">📏</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(metrics.conversionRate, { good: 5, warning: 2 })}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
            </div>
            <div className="text-2xl">🎯</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor(metrics.bounceRate, { good: 30, warning: 50 })}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold">{metrics.bounceRate}%</p>
            </div>
            <div className="text-2xl">🚪</div>
          </div>
        </div>
      </div>

      {/* Loading Strategies Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Loading Strategy Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.strategyUsage.eager}</div>
            <div className="text-sm text-blue-800">Eager Loads</div>
            <div className="text-xs text-blue-600 mt-1">Critical sections</div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{metrics.strategyUsage.progressive}</div>
            <div className="text-sm text-green-800">Progressive Loads</div>
            <div className="text-xs text-green-600 mt-1">Enhanced experience</div>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{metrics.strategyUsage.deferred}</div>
            <div className="text-sm text-orange-800">Deferred Loads</div>
            <div className="text-xs text-orange-600 mt-1">On-demand content</div>
          </div>
        </div>
      </div>

      {/* Section Performance Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Section Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Impact
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.sectionMetrics.map((section) => (
                <tr key={section.sectionId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {section.sectionId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {section.loadTime}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      section.strategy === 'eager' ? 'bg-blue-100 text-blue-800' :
                      section.strategy === 'progressive' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {section.strategy}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {section.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${section.impact}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{section.impact}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Optimization Recommendations
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {metrics.lcpScore > 2500 && (
            <li>• Hero section load time could be optimized for better LCP</li>
          )}
          {metrics.clsScore > 0.1 && (
            <li>• Consider skeleton components to prevent layout shift</li>
          )}
          {metrics.conversionRate < 3 && (
            <li>• Test more aggressive loading for pricing section</li>
          )}
          {metrics.strategyUsage.deferred > metrics.strategyUsage.eager && (
            <li>• Evaluate if some deferred sections should load earlier</li>
          )}
        </ul>
      </div>
    </div>
  );
}
