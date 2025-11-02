// API endpoint for performance monitoring
// Receives Core Web Vitals and other performance metrics

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  HTTP_STATUS,
} from "../../../../lib/architecture/api-handler";

// Mock performance metrics collection
const collectPerformanceMetrics = async () => ({
  coreWebVitals: {
    lcp: 1800,
    fid: 50,
    cls: 0.05,
    fcp: 1200,
    ttfb: 300,
  },
  memoryUsage: 45 * 1024 * 1024, // 45MB
  connectionSpeed: "4g",
});

// Import logger from shared if available, fallback to console
const logger = {
  error: (message: string, context?: any) => console.error(message, context),
  warn: (message: string, context?: any) => console.warn(message, context),
  info: (message: string, context?: any) => console.info(message, context),
};

// Schema for performance payload validation
const performancePayloadSchema = z.object({
  metric: z.string().min(1, "Metric is required"),
  value: z.number().min(0, "Value must be a positive number"),
  sessionId: z.string().min(1, "Session ID is required"),
  timestamp: z.string().min(1, "Timestamp is required"),
  url: z.string().url("Valid URL is required"),
  additionalData: z.object({
    budget: z.number().optional(),
    exceeded: z.number().optional(),
    navigationTiming: z.unknown().optional(),
    resourceTiming: z.array(z.unknown()).optional(),
    memoryUsage: z.number().optional(),
    connectionSpeed: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const parseResult = await parseRequestBody(request, performancePayloadSchema);
    if (!parseResult.success) {
      return (parseResult as { success: false; error: NextResponse }).error;
    }

    const payload = parseResult.data;

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

    return createSuccessResponse({
      success: true,
      metricId: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertTriggered,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error processing performance payload", { error });
    return createErrorResponse(
      "PERFORMANCE_PROCESSING_ERROR",
      "Failed to process performance metric",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Performance alert checking
function checkPerformanceAlerts(payload: z.infer<typeof performancePayloadSchema>): boolean {
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

    return createSuccessResponse({
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
    });
  } catch (error) {
    logger.error("Failed to collect performance metrics", { error });
    return createErrorResponse(
      "PERFORMANCE_METRICS_COLLECTION_ERROR",
      "Failed to collect performance metrics",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
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
