// API endpoint for monitoring reports
// Provides insights on error patterns and performance issues

import {
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS,
} from "../../../../lib/architecture/api-handler";

// Import logger from shared if available, fallback to console
const logger = {
  info: (message: string, context?: any) => console.info(message, context),
  error: (message: string, context?: any) => console.error(message, context),
  warn: (message: string, context?: any) => console.warn(message, context),
};

// Mock data for demonstration - in production, this would come from your monitoring database
const mockErrorPatterns = [
  {
    type: "FACTORY_ERROR",
    message: "Factory function call error (webpack runtime)",
    frequency: 15,
    lastSeen: Date.now() - 3600000, // 1 hour ago
    impact: "critical",
    contexts: [
      {
        url: "/dashboard",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        timestamp: Date.now() - 3600000,
        sessionId: "session_123",
        viewport: { width: 1920, height: 1080 },
        connection: { effectiveType: "4g", downlink: 10 },
      },
    ],
  },
  {
    type: "MODULE_LOADING",
    message: "Module loading error",
    frequency: 8,
    lastSeen: Date.now() - 7200000, // 2 hours ago
    impact: "high",
    contexts: [],
  },
];

const mockPerformanceMetrics = {
  coreWebVitals: {
    lcp: { average: 2100, p75: 2400, p95: 2800 },
    fid: { average: 85, p75: 120, p95: 150 },
    cls: { average: 0.08, p75: 0.12, p95: 0.15 },
    fcp: { average: 1600, p75: 1800, p95: 2000 },
    ttfb: { average: 600, p75: 800, p95: 1000 },
  },
  errorRate: 0.02, // 2%
  sessionCount: 1250,
  averageSessionDuration: 180000, // 3 minutes
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "summary";
    const timeRange = searchParams.get("range") || "24h";

    logger.info("Monitoring Report Requested", {
      type: reportType,
      timeRange,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
    });

    let reportData;

    switch (reportType) {
      case "errors":
        reportData = {
          errorPatterns: mockErrorPatterns,
          criticalErrors: mockErrorPatterns.filter(
            (p) => p.impact === "critical",
          ),
          errorRate: mockPerformanceMetrics.errorRate,
          timeRange,
        };
        break;

      case "performance":
        reportData = {
          metrics: mockPerformanceMetrics,
          timeRange,
        };
        break;

      case "summary":
      default:
        reportData = {
          summary: {
            totalErrors: mockErrorPatterns.reduce(
              (sum, p) => sum + p.frequency,
              0,
            ),
            criticalErrors: mockErrorPatterns.filter(
              (p) => p.impact === "critical",
            ).length,
            performanceScore: calculatePerformanceScore(mockPerformanceMetrics),
            uptime: 99.9,
            activeUsers: mockPerformanceMetrics.sessionCount,
          },
          recentErrors: mockErrorPatterns.slice(0, 5),
          performance: mockPerformanceMetrics.coreWebVitals,
          timeRange,
        };
        break;
    }

    return createSuccessResponse({
      success: true,
      data: reportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error generating monitoring report", { error });
    return createErrorResponse(
      "MONITORING_REPORT_GENERATION_FAILED",
      "Failed to generate report",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Calculate overall performance score (0-100)
function calculatePerformanceScore(
  metrics: typeof mockPerformanceMetrics,
): number {
  const scores = [];

  // LCP score (0-100)
  if (metrics.coreWebVitals.lcp.average <= 2500) {
    scores.push(100);
  } else if (metrics.coreWebVitals.lcp.average <= 4000) {
    scores.push(75);
  } else {
    scores.push(50);
  }

  // FID score
  if (metrics.coreWebVitals.fid.average <= 100) {
    scores.push(100);
  } else if (metrics.coreWebVitals.fid.average <= 300) {
    scores.push(75);
  } else {
    scores.push(50);
  }

  // CLS score
  if (metrics.coreWebVitals.cls.average <= 0.1) {
    scores.push(100);
  } else if (metrics.coreWebVitals.cls.average <= 0.25) {
    scores.push(75);
  } else {
    scores.push(50);
  }

  // Error rate score
  const errorScore = Math.max(0, 100 - metrics.errorRate * 1000);
  scores.push(errorScore);

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// POST endpoint for manual report generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, filters } = body;

    logger.info("Manual Report Generation Requested", {
      type,
      filters,
      requestedBy: "system", // In production, get from auth
    });

    // Generate custom report based on filters
    const report = {
      type,
      filters,
      data: mockErrorPatterns, // In production, query database
      generatedAt: new Date().toISOString(),
      status: "completed",
    };

    return createSuccessResponse({
      success: true,
      report,
    });
  } catch (error) {
    logger.error("Error generating custom report", { error });
    return createErrorResponse(
      "CUSTOM_REPORT_GENERATION_FAILED",
      "Failed to generate custom report",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
