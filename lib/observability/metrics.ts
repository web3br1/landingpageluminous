
// ===== METRIC TYPES =====

export enum MetricType {
  COUNTER = "counter",
  GAUGE = "gauge",
  HISTOGRAM = "histogram",
  SUMMARY = "summary",
}

export interface MetricValue {
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  labels?: string[];
}

// ===== METRICS COLLECTOR =====

export class MetricsCollector {
  private metrics: Map<string, MetricValue[]> = new Map();
  private definitions: Map<string, MetricDefinition> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: {
      enableRemote: boolean;
      remoteEndpoint?: string;
      flushInterval: number;
    },
  ) {
    if (config.enableRemote && config.remoteEndpoint) {
      this.startFlushInterval();
    }
  }

  // ===== METRIC DEFINITIONS =====

  defineMetric(definition: MetricDefinition): void {
    this.definitions.set(definition.name, definition);
  }

  // ===== COUNTER METRICS =====

  incrementCounter(
    name: string,
    value: number = 1,
    labels: Record<string, string> = {},
  ): void {
    this.recordMetric(name, MetricType.COUNTER, value, labels);
  }

  // ===== GAUGE METRICS =====

  setGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    this.recordMetric(name, MetricType.GAUGE, value, labels);
  }

  // ===== HISTOGRAM METRICS =====

  recordHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    this.recordMetric(name, MetricType.HISTOGRAM, value, labels);
  }

  // ===== SUMMARY METRICS =====

  recordSummary(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    this.recordMetric(name, MetricType.SUMMARY, value, labels);
  }

  // ===== TIMED OPERATIONS =====

  startTimer(name: string, labels: Record<string, string> = {}): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordHistogram(name, duration, labels);
    };
  }

  // ===== BUSINESS METRICS =====

  recordPageView(page: string, userId?: string, experimentId?: string): void {
    this.incrementCounter("page_views_total", 1, {
      page,
      user_id: userId || "anonymous",
      experiment_id: experimentId || "none",
    });
  }

  recordUserAction(action: string, component: string, userId?: string): void {
    this.incrementCounter("user_actions_total", 1, {
      action,
      component,
      user_id: userId || "anonymous",
    });
  }

  recordExperimentView(
    experimentId: string,
    variant: string,
    userId?: string,
  ): void {
    this.incrementCounter("experiment_views_total", 1, {
      experiment_id: experimentId,
      variant,
      user_id: userId || "anonymous",
    });
  }

  recordExperimentConversion(
    experimentId: string,
    variant: string,
    conversionType: string,
    userId?: string,
  ): void {
    this.incrementCounter("experiment_conversions_total", 1, {
      experiment_id: experimentId,
      variant,
      conversion_type: conversionType,
      user_id: userId || "anonymous",
    });
  }

  // ===== PERFORMANCE METRICS =====

  recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
  ): void {
    this.recordHistogram("api_call_duration_seconds", duration / 1000, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });

    this.incrementCounter("api_calls_total", 1, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });
  }

  recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
  ): void {
    this.recordHistogram("database_query_duration_seconds", duration / 1000, {
      operation,
      table,
    });
  }

  recordCacheHit(cacheName: string, hit: boolean): void {
    this.incrementCounter("cache_operations_total", 1, {
      cache: cacheName,
      result: hit ? "hit" : "miss",
    });
  }

  recordError(
    errorType: string,
    component: string,
    severity: "low" | "medium" | "high" | "critical" = "medium",
  ): void {
    this.incrementCounter("errors_total", 1, {
      type: errorType,
      component,
      severity,
    });
  }

  // ===== SYSTEM METRICS =====

  recordMemoryUsage(): void {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.setGauge("memory_usage_bytes", memUsage.heapUsed, {
        type: "heap_used",
      });
      this.setGauge("memory_usage_bytes", memUsage.heapTotal, {
        type: "heap_total",
      });
      this.setGauge("memory_usage_bytes", memUsage.external, {
        type: "external",
      });
      this.setGauge("memory_usage_bytes", memUsage.rss, { type: "rss" });
    }
  }

  recordCpuUsage(): void {
    // Note: CPU usage measurement would require additional libraries in Node.js
    // This is a placeholder for future implementation
  }

  // ===== PRIVATE METHODS =====

  private recordMetric(
    name: string,
    type: MetricType,
    value: number,
    labels: Record<string, string>,
  ): void {
    const metricValue: MetricValue = {
      value,
      labels,
      timestamp: Date.now(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metricValue);

    // Keep only last 1000 values per metric to prevent memory issues
    const values = this.metrics.get(name)!;
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
  }

  private async flush(): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    const metricsData = Array.from(this.metrics.entries()).map(
      ([name, values]) => ({
        name,
        type: this.definitions.get(name)?.type || MetricType.COUNTER,
        values,
      }),
    );

    if (metricsData.length === 0) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.METRICS_API_KEY || ""}`,
        },
        body: JSON.stringify({ metrics: metricsData }),
      });

      if (response.ok) {
        // Clear sent metrics
        this.metrics.clear();
      } else {
        console.error(
          "Failed to send metrics to remote endpoint:",
          response.status,
        );
      }
    } catch (error) {
      console.error("Error sending metrics to remote endpoint:", error);
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // ===== QUERY METHODS =====

  getMetricValues(name: string): MetricValue[] {
    return this.metrics.get(name) || [];
  }

  getAllMetrics(): Record<string, MetricValue[]> {
    return Object.fromEntries(this.metrics);
  }

  getMetricSummary(name: string): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const values = this.getMetricValues(name);
    if (values.length === 0) return null;

    const nums = values.map((v) => v.value);
    return {
      count: nums.length,
      sum: nums.reduce((a, b) => a + b, 0),
      avg: nums.reduce((a, b) => a + b, 0) / nums.length,
      min: Math.min(...nums),
      max: Math.max(...nums),
    };
  }

  // ===== CLEANUP =====

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    this.flush();
  }
}

// ===== METRICS FACTORY =====

export class MetricsFactory {
  private static instance: MetricsCollector | null = null;

  static getMetrics(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector({
        enableRemote: !!process.env.METRICS_ENDPOINT,
        remoteEndpoint: process.env.METRICS_ENDPOINT,
        flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL || "30000"), // 30 seconds
      });

      // Define standard metrics
      this.defineStandardMetrics(this.instance);
    }

    return this.instance;
  }

  private static defineStandardMetrics(metrics: MetricsCollector): void {
    // Business Metrics
    metrics.defineMetric({
      name: "page_views_total",
      type: MetricType.COUNTER,
      description: "Total number of page views",
      labels: ["page", "user_id", "experiment_id"],
    });

    metrics.defineMetric({
      name: "user_actions_total",
      type: MetricType.COUNTER,
      description: "Total number of user actions",
      labels: ["action", "component", "user_id"],
    });

    metrics.defineMetric({
      name: "experiment_views_total",
      type: MetricType.COUNTER,
      description: "Total number of experiment views",
      labels: ["experiment_id", "variant", "user_id"],
    });

    metrics.defineMetric({
      name: "experiment_conversions_total",
      type: MetricType.COUNTER,
      description: "Total number of experiment conversions",
      labels: ["experiment_id", "variant", "conversion_type", "user_id"],
    });

    // Performance Metrics
    metrics.defineMetric({
      name: "api_call_duration_seconds",
      type: MetricType.HISTOGRAM,
      description: "Duration of API calls in seconds",
      labels: ["endpoint", "method", "status_code"],
    });

    metrics.defineMetric({
      name: "api_calls_total",
      type: MetricType.COUNTER,
      description: "Total number of API calls",
      labels: ["endpoint", "method", "status_code"],
    });

    metrics.defineMetric({
      name: "database_query_duration_seconds",
      type: MetricType.HISTOGRAM,
      description: "Duration of database queries in seconds",
      labels: ["operation", "table"],
    });

    metrics.defineMetric({
      name: "cache_operations_total",
      type: MetricType.COUNTER,
      description: "Total number of cache operations",
      labels: ["cache", "result"],
    });

    // Error Metrics
    metrics.defineMetric({
      name: "errors_total",
      type: MetricType.COUNTER,
      description: "Total number of errors",
      labels: ["type", "component", "severity"],
    });

    // System Metrics
    metrics.defineMetric({
      name: "memory_usage_bytes",
      type: MetricType.GAUGE,
      description: "Memory usage in bytes",
      labels: ["type"],
    });
  }

  static destroy(): void {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}

// ===== GLOBAL METRICS INSTANCE =====

export const metrics = MetricsFactory.getMetrics();

// ===== UTILITY FUNCTIONS =====

export function withMetrics<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => R,
  labels: Record<string, string> = {},
): (...args: T) => R {
  return (...args: T) => {
    const endTimer = metrics.startTimer(
      `${operation}_duration_seconds`,
      labels,
    );

    try {
      const result = fn(...args);
      endTimer();
      return result;
    } catch (error) {
      metrics.recordError("operation_error", operation, "high");
      endTimer();
      throw error;
    }
  };
}

export async function withMetricsAsync<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
  args: T,
  labels: Record<string, string> = {},
): Promise<R> {
  const endTimer = metrics.startTimer(`${operation}_duration_seconds`, labels);

  try {
    const result = await fn(...args);
    endTimer();
    return result;
  } catch (error) {
    metrics.recordError("operation_error", operation, "high");
    endTimer();
    throw error;
  }
}

// ===== CLEANUP ON EXIT =====

process.on("exit", () => {
  MetricsFactory.destroy();
});

process.on("SIGINT", () => {
  MetricsFactory.destroy();
  process.exit();
});

process.on("SIGTERM", () => {
  MetricsFactory.destroy();
  process.exit();
});
