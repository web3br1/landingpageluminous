// API endpoint for performance monitoring
// Receives Core Web Vitals and other performance metrics

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { collectPerformanceMetrics } from "@/lib/production-monitoring";

interface PerformancePayload {
  metric: string;
  value: number;
  sessionId: string;
  timestamp: string;
  url: string;
  additionalData?: {
    budget?: number;
    exceeded?: number;
    navigationTiming?: any;
    resourceTiming?: any[];
    memoryUsage?: number;
    connectionSpeed?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: PerformancePayload = await request.json();

    // Validate payload
    if (
      !payload.metric ||
      typeof payload.value !== "number" ||
      !payload.sessionId
    ) {
      return NextResponse.json(
        { error: "Invalid performance payload" },
        { status: 400 },
      );
    }

    // Log performance metric
    logger.info("Performance Metric Reported", {
      metric: payload.metric,
      value: payload.value,
      sessionId: payload.sessionId,
      url: payload.url,
      timestamp: payload.timestamp,
      additionalData: payload.additionalData,
      source: "production_monitor",
    });

    // Check performance budgets and alert if necessary
    const alertTriggered = checkPerformanceAlerts(payload);

    // Here you would typically send to your monitoring service
    // Examples: DataDog, New Relic, CloudWatch, etc.

    return NextResponse.json({
      success: true,
      metricId: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertTriggered,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error processing performance payload", { error });
    return NextResponse.json(
      { error: "Failed to process performance metric" },
      { status: 500 },
    );
  }
}

// Performance alert checking
function checkPerformanceAlerts(payload: PerformancePayload): boolean {
  const { metric, value } = payload;
  let alertTriggered = false;

  // Core Web Vitals budgets
  const budgets = {
    lcp: 2500, // Largest Contentful Paint (2.5s)
    fid: 100, // First Input Delay (100ms)
    cls: 0.1, // Cumulative Layout Shift (0.1)
    fcp: 1800, // First Contentful Paint (1.8s)
    ttfb: 800, // Time to First Byte (800ms)
  };

  if (
    budgets[metric as keyof typeof budgets] &&
    value > budgets[metric as keyof typeof budgets]
  ) {
    logger.warn("Performance Budget Exceeded", {
      metric,
      value,
      budget: budgets[metric as keyof typeof budgets],
      exceeded: value - budgets[metric as keyof typeof budgets],
      sessionId: payload.sessionId,
      url: payload.url,
    });

    // Here you could trigger alerts, notifications, etc.
    alertTriggered = true;
  }

  // Additional performance checks
  if (metric === "memoryUsage" && value > 100 * 1024 * 1024) {
    // 100MB
    logger.warn("High Memory Usage Detected", {
      memoryUsage: value,
      sessionId: payload.sessionId,
    });
    alertTriggered = true;
  }

  return alertTriggered;
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Collect performance metrics
    const metrics = await collectPerformanceMetrics();

    // Log health check
    logger.info("Performance metrics collected", {
      lcp: metrics.coreWebVitals.lcp,
      fid: metrics.coreWebVitals.fid,
      cls: metrics.coreWebVitals.cls,
      fcp: metrics.coreWebVitals.fcp,
      ttfb: metrics.coreWebVitals.ttfb,
    });

    return NextResponse.json(
      {
        status: "ok",
        service: "performance-monitoring",
        timestamp: new Date().toISOString(),
        budgets: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
          fcp: 1800,
          ttfb: 800,
        },
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      },
    );
  } catch (error) {
    logger.error("Failed to collect performance metrics", { error });
    return NextResponse.json(
      { error: "Failed to collect performance metrics" },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      },
    );
  }
}

// Mock monitoring service function
async function getMonitoringService() {
  // In a real implementation, this would call your monitoring service
  // For now, return mock data
  return {
    coreWebVitals: {
      lcp: 1200,
      fid: 50,
      cls: 0.05,
      fcp: 800,
      ttfb: 200,
    },
  };
}
