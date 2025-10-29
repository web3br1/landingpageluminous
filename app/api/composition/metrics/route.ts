import { NextRequest, NextResponse } from "next/server";
import { compositionMetrics } from "@/lib/composition/observability/composition-metrics";
import { compositionAlerts } from "@/lib/composition/observability/composition-alerts";
import { metrics } from "@/lib/observability/metrics";

// ===== METRICS API ENDPOINT =====

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    const includeAlerts = searchParams.get("alerts") === "true";
    const timeRange = parseInt(searchParams.get("range") || "3600000"); // 1 hour default

    // Get composition-specific metrics
    const compositionData: any = {
      timestamp: Date.now(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",

      // Core composition metrics
      pageCompositions: {
        started: getMetricSummary("page_composition_started_total"),
        completed: getMetricSummary("page_composition_completed_total"),
        errors: getMetricSummary("page_composition_errors_total"),
        averageDuration: getAverageDuration("page_composition_duration_ms"),
      },

      sectionProcessing: {
        started: getMetricSummary("section_processing_started_total"),
        completed: getMetricSummary("section_processing_completed_total"),
        errors: getMetricSummary("section_processing_errors_total"),
        averageDuration: getAverageDuration("section_processing_duration_ms"),
      },

      lazyLoading: {
        decisions: getMetricSummary("lazy_loading_decisions_total"),
        triggers: getMetricSummary("lazy_loading_triggers_total"),
      },

      fallbacks: {
        usage: getMetricSummary("fallback_usage_total"),
      },

      experiments: {
        applications: getMetricSummary("experiment_applications_total"),
      },

      // System health
      health: {
        serviceAvailability: 1, // Would be calculated from actual service checks
        errorRate: calculateErrorRate(),
        averageLatency: getAverageDuration("page_composition_duration_ms"),
        uptime: calculateUptime(),
      },
    };

    // Add alerts if requested
    if (includeAlerts) {
      compositionData.alerts = {
        active: compositionAlerts.getActiveAlerts(),
        resolved: compositionAlerts.getResolvedAlerts(24), // Last 24 hours
        summary: {
          critical: compositionAlerts
            .getActiveAlerts()
            .filter((a) => a.severity === "critical").length,
          high: compositionAlerts
            .getActiveAlerts()
            .filter((a) => a.severity === "high").length,
          medium: compositionAlerts
            .getActiveAlerts()
            .filter((a) => a.severity === "medium").length,
          low: compositionAlerts
            .getActiveAlerts()
            .filter((a) => a.severity === "low").length,
        },
      };
    }

    // Format response based on request
    if (format === "prometheus") {
      return new NextResponse(generatePrometheusFormat(compositionData), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    if (format === "influx") {
      return new NextResponse(generateInfluxFormat(compositionData), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Default JSON response
    return NextResponse.json(compositionData);
  } catch (error) {
    console.error("Error generating composition metrics:", error);

    return NextResponse.json(
      {
        error: "Failed to generate metrics",
        timestamp: Date.now(),
      },
      { status: 500 },
    );
  }
}

// ===== UTILITY FUNCTIONS =====

function getMetricSummary(metricName: string) {
  const summary = metrics.getMetricSummary(metricName);
  return summary || { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
}

function getAverageDuration(histogramName: string): number {
  const summary = metrics.getMetricSummary(histogramName);
  return summary ? summary.avg : 0;
}

function calculateErrorRate(): number {
  const totalCompositions = getMetricSummary(
    "page_composition_started_total",
  ).count;
  const errors = getMetricSummary("page_composition_errors_total").count;

  if (totalCompositions === 0) return 0;
  return (errors / totalCompositions) * 100;
}

function calculateUptime(): number {
  // This would typically be calculated from service start time
  // For now, return a placeholder
  return 99.9;
}

function generatePrometheusFormat(data: any): string {
  const lines: string[] = [];

  // Add HELP and TYPE comments
  lines.push(
    "# HELP composition_page_compositions_started_total Total number of page compositions started",
  );
  lines.push("# TYPE composition_page_compositions_started_total counter");
  lines.push(
    `composition_page_compositions_started_total ${data.pageCompositions.started.count}`,
  );

  lines.push(
    "# HELP composition_page_compositions_completed_total Total number of page compositions completed",
  );
  lines.push("# TYPE composition_page_compositions_completed_total counter");
  lines.push(
    `composition_page_compositions_completed_total ${data.pageCompositions.completed.count}`,
  );

  lines.push(
    "# HELP composition_page_compositions_errors_total Total number of page composition errors",
  );
  lines.push("# TYPE composition_page_compositions_errors_total counter");
  lines.push(
    `composition_page_compositions_errors_total ${data.pageCompositions.errors.count}`,
  );

  lines.push(
    "# HELP composition_page_composition_duration_ms Average page composition duration in milliseconds",
  );
  lines.push("# TYPE composition_page_composition_duration_ms gauge");
  lines.push(
    `composition_page_composition_duration_ms ${data.pageCompositions.averageDuration}`,
  );

  // Add more metrics as needed...

  return lines.join("\n");
}

function generateInfluxFormat(data: any): string {
  const lines: string[] = [];

  lines.push(
    `composition_metrics,environment=${data.environment},version=${data.version} page_compositions_started=${data.pageCompositions.started.count},page_compositions_completed=${data.pageCompositions.completed.count},page_compositions_errors=${data.pageCompositions.errors.count},average_duration_ms=${data.pageCompositions.averageDuration} ${data.timestamp}000000`,
  );

  return lines.join("\n");
}

// ===== HEALTH CHECK ENDPOINT =====

export async function HEAD() {
  // Simple health check
  return new NextResponse(null, { status: 200 });
}
