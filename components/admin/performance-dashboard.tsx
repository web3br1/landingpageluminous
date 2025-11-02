"use client";

import {
  usePerformanceDashboard,
  usePerformanceAlerts,
} from "@/lib/hooks/use-global-performance";
import {
  GeoPerformance,
  PerformanceOptimization,
} from "@/lib/performance/global-optimizer";

interface PerformanceSummary {
  totalMetrics: number;
  totalOptimizations: number;
  geoCoverage: string[];
  timeRange: {
    oldest?: number;
    newest?: number;
  };
  recentOptimizations: PerformanceOptimization[];
}

export function PerformanceDashboard() {
  const { summary, exportDataForAnalysis, cleanupOldData } =
    usePerformanceDashboard();
  const alerts = usePerformanceAlerts();
  const [exportData, setExportData] = useState<{
    metrics: GeoPerformance[];
    optimizations: PerformanceOptimization[];
    summary: {
      totalMetrics: number;
      totalOptimizations: number;
      geoCoverage: string[];
      timeRange: { oldest: number; newest: number };
      recentOptimizations: PerformanceOptimization[];
    };
  } | null>(null);

  const handleExport = () => {
    // SSR safety: only run on client-side
    if (typeof document === "undefined" || typeof URL === "undefined") {
      console.warn("[PerformanceDashboard] Export not available in SSR");
      return;
    }

    const data = exportDataForAnalysis();
    setExportData(data);

    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatMetric = (value: number, unit: string) => {
    if (unit === "ms") return `${value}ms`;
    if (unit === "score") return value.toFixed(3);
    return value.toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Global Performance Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Export Data
          </button>
          <button
            onClick={() => cleanupOldData(168)} // 1 week
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Cleanup Old Data
          </button>
        </div>
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            ⚠️ Performance Alerts
          </h2>
          <ul className="space-y-1">
            {alerts.map((alert, index) => (
              <li key={index} className="text-red-700 dark:text-red-300">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Global Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Total Metrics</h3>
            <p className="text-3xl font-bold text-blue-600">
              {(summary as any).totalMetrics.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Performance data points
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Active Optimizations</h3>
            <p className="text-3xl font-bold text-green-600">
              {(summary as any).totalOptimizations.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Applied optimizations
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Geo Coverage</h3>
            <p className="text-3xl font-bold text-purple-600">
              {(summary as any).geoCoverage.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Countries covered
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Data Freshness</h3>
            <p className="text-lg font-bold text-orange-600">
              {(summary as any).timeRange.newest
                ? formatTimestamp((summary as any).timeRange.newest).split(",")[0]
                : "No data"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated
            </p>
          </div>
        </div>
      )}

      {/* Geographic Coverage */}
      {summary && (summary as any).geoCoverage.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Geographic Coverage</h2>
          <div className="flex flex-wrap gap-2">
            {(summary as any).geoCoverage.map((country) => (
              <span
                key={country}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {country}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Optimizations */}
      {summary && (summary as any).recentOptimizations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Optimizations</h2>
          <div className="space-y-3">
            {(summary as any).recentOptimizations.slice(0, 10).map((opt: unknown) => (
              <div key={(opt as any).id} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium capitalize">
                      {(opt as any).type} Optimization
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Target: {(opt as any).target}
                      {(opt as any).geo && ` • Geo: ${(opt as any).geo}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      +{(opt as any).improvement}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTimestamp((opt as any).timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Preview */}
      {exportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Data Preview</h2>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-x-auto">
            <pre>
              {JSON.stringify(exportData, null, 2).substring(0, 1000)}...
            </pre>
          </div>
        </div>
      )}

      {/* Performance Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 Performance Recommendations
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Monitor Core Web Vitals regularly using this dashboard</li>
          <li>• Focus optimizations on geographies with highest traffic</li>
          <li>• Use the export feature to analyze trends over time</li>
          <li>
            • Consider implementing automated optimizations based on performance
            thresholds
          </li>
        </ul>
      </div>
    </div>
  );
}
