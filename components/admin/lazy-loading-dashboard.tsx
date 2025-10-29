// Lazy Loading Performance Dashboard
// Admin component to monitor lazy loading performance metrics

"use client";

import React, { useState, useEffect } from "react";
import {
  lazyLoadingMetrics,
  LazyLoadSummary,
  LazyLoadMetric,
} from "@/lib/performance/lazy-loading-metrics";

interface LazyLoadingDashboardProps {
  refreshInterval?: number; // in milliseconds
}

export function LazyLoadingDashboard({
  refreshInterval = 5000,
}: LazyLoadingDashboardProps) {
  const [summary, setSummary] = useState<LazyLoadSummary | null>(null);
  const [metrics, setMetrics] = useState<LazyLoadMetric[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setSummary(lazyLoadingMetrics.getSummary());
      setMetrics(lazyLoadingMetrics.getMetrics());
    };

    updateMetrics();

    const interval = setInterval(updateMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!summary) {
    return <div>Loading metrics...</div>;
  }

  const successRate =
    summary.totalComponents > 0
      ? ((summary.loadedComponents / summary.totalComponents) * 100).toFixed(1)
      : "0.0";

  const formatTime = (ms: number) => `${ms.toFixed(1)}ms`;
  const formatBytes = (kb: number) => `${kb}KB`;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Lazy Loading Performance
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? "Collapse" : "Expand"} Details
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalComponents}
          </div>
          <div className="text-sm text-blue-600">Total Components</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {successRate}%
          </div>
          <div className="text-sm text-green-600">Success Rate</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {formatTime(summary.averageLoadTime)}
          </div>
          <div className="text-sm text-purple-600">Avg Load Time</div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {formatTime(summary.intersectionDelayStats.average)}
          </div>
          <div className="text-sm text-orange-600">Avg Intersection Delay</div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Components by Priority
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary.componentsByPriority).map(
            ([priority, count]) => (
              <div
                key={priority}
                className="bg-gray-50 p-3 rounded-lg text-center"
              >
                <div className="text-lg font-semibold text-gray-700">
                  {count}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {priority}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      {isExpanded && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Detailed Metrics
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Component
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intersection Delay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric, index) => (
                  <tr key={`${metric.componentName}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.componentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {metric.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.loadDuration
                        ? formatTime(metric.loadDuration)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.intersectionDelay
                        ? formatTime(metric.intersectionDelay)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          metric.success
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {metric.success ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                // SSR safety: only run on client-side
                if (
                  typeof document === "undefined" ||
                  typeof URL === "undefined"
                )
                  return;

                const data = lazyLoadingMetrics.exportMetrics();
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `lazy-loading-metrics-${new Date().toISOString()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Export Metrics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for components to report their own lazy loading metrics
export function useLazyLoadReporting(
  componentName: string,
  priority: LazyLoadMetric["priority"] = "medium",
) {
  useEffect(() => {
    // This would be called by the lazy loading system
    // For now, components can call this hook to report their metrics
  }, [componentName, priority]);
}
