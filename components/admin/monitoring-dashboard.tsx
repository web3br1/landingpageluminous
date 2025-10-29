"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, Zap, Bug, RefreshCw } from "lucide-react";
import { Button } from "@/app/(marketing)/components/ui/button";
import { useResilientFetch } from "@/lib/network/use-resilient-fetch";

interface ErrorPattern {
  type: string;
  message: string;
  frequency: number;
  lastSeen: number;
  impact: "low" | "medium" | "high" | "critical";
  contexts: Array<{
    url: string;
    userAgent: string;
    timestamp: number;
    sessionId: string;
  }>;
}

interface PerformanceMetrics {
  coreWebVitals: {
    lcp: { average: number; p75: number; p95: number };
    fid: { average: number; p75: number; p95: number };
    cls: { average: number; p75: number; p95: number };
    fcp: { average: number; p75: number; p95: number };
    ttfb: { average: number; p75: number; p95: number };
  };
  errorRate: number;
  sessionCount: number;
  averageSessionDuration: number;
}

export function MonitoringDashboard() {
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<
    "overview" | "errors" | "performance"
  >("overview");

  // Fetch error patterns
  const {
    data: errorData,
    loading: loadingErrors,
    refetch: refetchErrors,
  } = useResilientFetch("/api/monitoring/report?type=errors&range=24h", {
    enabled: true,
    refetchInterval: 30000, // Refresh every 30 seconds
    onSuccess: (data) => {
      setErrorPatterns(data.data?.errorPatterns || []);
      setLastUpdate(new Date());
    },
  });

  // Fetch performance metrics
  const {
    data: perfData,
    loading: loadingMetrics,
    refetch: refetchMetrics,
  } = useResilientFetch("/api/monitoring/report?type=performance&range=24h", {
    enabled: true,
    refetchInterval: 30000, // Refresh every 30 seconds
    onSuccess: (data) => {
      setPerformanceMetrics(data.data?.metrics || null);
      setLastUpdate(new Date());
    },
  });

  const loading = loadingErrors || loadingMetrics;

  const loadMonitoringData = async () => {
    await Promise.all([refetchErrors(), refetchMetrics()]);
    setLastUpdate(new Date());
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <Bug className="w-4 h-4" />;
      case "medium":
        return <TrendingUp className="w-4 h-4" />;
      case "low":
        return <Zap className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatMetric = (value: number, unit: string = "ms") => {
    if (unit === "ms") {
      return `${value.toFixed(0)}ms`;
    }
    if (unit === "score") {
      return value.toFixed(3);
    }
    return value.toString();
  };

  const getMetricStatus = (metric: string, value: number) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return "unknown";

    if (value <= threshold.good) return "good";
    if (value <= threshold.poor) return "needs-improvement";
    return "poor";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "needs-improvement":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <Button
          onClick={loadMonitoringData}
          disabled={loading}
          variant="outline"
          size="sm"
          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "overview"
                  ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "errors"
                  ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Errors
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "performance"
                  ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Critical Issues Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Critical Errors
                  </h3>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {errorPatterns.filter((p) => p.impact === "critical").length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Require immediate attention
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Error Rate
                  </h3>
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Bug className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {performanceMetrics
                    ? `${(performanceMetrics.errorRate * 100).toFixed(1)}%`
                    : "N/A"}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last 24 hours
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Avg LCP
                  </h3>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div
                  className={`text-3xl font-bold mb-1 ${
                    performanceMetrics
                      ? getStatusColor(
                          getMetricStatus(
                            "lcp",
                            performanceMetrics.coreWebVitals.lcp.average,
                          ),
                        )
                      : "text-gray-600"
                  }`}
                >
                  {performanceMetrics
                    ? formatMetric(performanceMetrics.coreWebVitals.lcp.average)
                    : "N/A"}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Largest Contentful Paint
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Active Sessions
                  </h3>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {performanceMetrics
                    ? performanceMetrics.sessionCount.toLocaleString()
                    : "N/A"}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Current sessions
                </p>
              </div>
            </div>

            {/* Recent Critical Errors */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Critical Errors
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Most frequent critical errors in the last 24 hours
                </p>
              </div>
              <div>
                {errorPatterns.filter((p) => p.impact === "critical").length ===
                0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No critical errors detected. 🎉
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      All systems operating normally
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {errorPatterns
                      .filter((p) => p.impact === "critical")
                      .slice(0, 5)
                      .map((pattern, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-3 h-3 rounded-full ${getImpactColor(pattern.impact)}`}
                            />
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                {pattern.message}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {pattern.frequency} occurrences • Last seen{" "}
                                {formatTimeAgo(pattern.lastSeen)}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">
                            {getImpactIcon(pattern.impact)}
                            {pattern.impact}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === "errors" && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Error Patterns
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  All detected error patterns with frequency and impact analysis
                </p>
              </div>
              <div>
                {errorPatterns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bug className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No errors detected
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      System is running smoothly
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {errorPatterns.map((pattern, index) => (
                      <div
                        key={index}
                        className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-full">
                              {pattern.type}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 text-white text-xs font-medium rounded-full ${getImpactColor(pattern.impact)}`}
                            >
                              {getImpactIcon(pattern.impact)}
                              {pattern.impact}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {pattern.frequency} times
                          </span>
                        </div>
                        <p className="font-semibold mb-2 text-gray-900 dark:text-white">
                          {pattern.message}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Last seen: {formatTimeAgo(pattern.lastSeen)}
                        </p>
                        {pattern.contexts.length > 0 && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            Affected {pattern.contexts.length} sessions
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-8">
            {performanceMetrics && (
              <>
                {/* Core Web Vitals */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Core Web Vitals
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Key performance metrics for user experience
                    </p>
                  </div>
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(performanceMetrics.coreWebVitals).map(
                        ([metric, values]) => (
                          <div
                            key={metric}
                            className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold uppercase text-sm text-gray-900 dark:text-white">
                                {metric}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  getMetricStatus(metric, values.average) ===
                                  "good"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                    : getMetricStatus(
                                          metric,
                                          values.average,
                                        ) === "needs-improvement"
                                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                }`}
                              >
                                {getMetricStatus(metric, values.average)}
                              </span>
                            </div>
                            <div
                              className={`text-3xl font-bold mb-3 ${getStatusColor(
                                getMetricStatus(metric, values.average),
                              )}`}
                            >
                              {formatMetric(
                                values.average,
                                metric === "cls" ? "score" : "ms",
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span>P75:</span>
                                <span className="font-medium">
                                  {formatMetric(
                                    values.p75,
                                    metric === "cls" ? "score" : "ms",
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span>P95:</span>
                                <span className="font-medium">
                                  {formatMetric(
                                    values.p95,
                                    metric === "cls" ? "score" : "ms",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Performance Summary
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Overall performance metrics and user engagement
                    </p>
                  </div>
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                          Error Rate
                        </h4>
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                          {(performanceMetrics.errorRate * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Session error rate
                        </p>
                      </div>
                      <div className="p-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                          Active Sessions
                        </h4>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {performanceMetrics.sessionCount.toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current active users
                        </p>
                      </div>
                      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                          Avg Session Duration
                        </h4>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {Math.round(
                            performanceMetrics.averageSessionDuration / 60000,
                          )}
                          m
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Average time on site
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
