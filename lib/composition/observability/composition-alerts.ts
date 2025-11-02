import { metrics } from "../../observability/metrics";
import { logger } from "../../observability/logger";

// ===== ALERT TYPES =====

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AlertType {
  PERFORMANCE_DEGRADATION = "performance_degradation",
  ERROR_RATE_SPIKE = "error_rate_spike",
  COMPOSITION_FAILURE = "composition_failure",
  SECTION_TIMEOUT = "section_timeout",
  MEMORY_LEAK = "memory_leak",
  EXPERIMENT_IMPACT = "experiment_impact",
  FALLBACK_OVERUSE = "fallback_overuse",
  CACHE_MISSES_HIGH = "cache_misses_high",
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  context: Record<string, unknown>;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  threshold: {
    metric: string;
    value: number;
    operator: "gt" | "lt" | "gte" | "lte" | "eq";
  };
}

// ===== ALERT MANAGER =====

export class CompositionAlertManager {
  private static instance: CompositionAlertManager | null = null;
  private activeAlerts: Map<string, Alert> = new Map();
  private alertThresholds: Map<AlertType, unknown> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultThresholds();
    this.startMonitoring();
  }

  static getInstance(): CompositionAlertManager {
    if (!this.instance) {
      this.instance = new CompositionAlertManager();
    }
    return this.instance;
  }

  // ===== THRESHOLD CONFIGURATION =====

  private initializeDefaultThresholds(): void {
    this.alertThresholds.set(AlertType.PERFORMANCE_DEGRADATION, {
      metric: "page_composition_duration_ms",
      threshold: 3000, // 3 seconds
      operator: "gt" as const,
      window: 5 * 60 * 1000, // 5 minutes
      minOccurrences: 3,
    });

    this.alertThresholds.set(AlertType.ERROR_RATE_SPIKE, {
      metric: "page_composition_errors_total",
      threshold: 0.1, // 10% error rate
      operator: "gt" as const,
      window: 10 * 60 * 1000, // 10 minutes
      minOccurrences: 5,
    });

    this.alertThresholds.set(AlertType.COMPOSITION_FAILURE, {
      metric: "page_composition_errors_total",
      threshold: 1, // Any composition failure
      operator: "gte" as const,
      window: 1 * 60 * 1000, // 1 minute
      minOccurrences: 1,
    });

    this.alertThresholds.set(AlertType.SECTION_TIMEOUT, {
      metric: "section_processing_duration_ms",
      threshold: 5000, // 5 seconds per section
      operator: "gt" as const,
      window: 5 * 60 * 1000, // 5 minutes
      minOccurrences: 2,
    });

    this.alertThresholds.set(AlertType.MEMORY_LEAK, {
      metric: "composition_memory_delta_bytes",
      threshold: 50 * 1024 * 1024, // 50MB increase
      operator: "gt" as const,
      window: 15 * 60 * 1000, // 15 minutes
      minOccurrences: 3,
    });

    this.alertThresholds.set(AlertType.FALLBACK_OVERUSE, {
      metric: "fallback_usage_total",
      threshold: 0.2, // 20% of requests use fallback
      operator: "gt" as const,
      window: 10 * 60 * 1000, // 10 minutes
      minOccurrences: 10,
    });

    this.alertThresholds.set(AlertType.CACHE_MISSES_HIGH, {
      metric: "cache_operations_total",
      threshold: 0.8, // 80% miss rate
      operator: "gt" as const,
      window: 5 * 60 * 1000, // 5 minutes
      minOccurrences: 20,
    });
  }

  // ===== ALERT MONITORING =====

  private startMonitoring(): void {
    // Check for alerts every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkAlertConditions();
    }, 30 * 1000);
  }

  private async checkAlertConditions(): Promise<void> {
    for (const [alertType, config] of this.alertThresholds) {
      await this.checkThreshold(alertType, config);
    }
  }

  private async checkThreshold(
    alertType: AlertType,
    config: unknown,
  ): Promise<void> {
    const configData = config as {
      metric: string;
      threshold: number;
      operator: string;
      window: number;
      minOccurrences: number;
    };
    const { metric, threshold, operator, window, minOccurrences } = configData;

    // Get recent metric values within the time window
    const metricValues = metrics.getMetricValues(metric);
    const recentValues = metricValues.filter(
      (v) => Date.now() - v.timestamp < window,
    );

    if (recentValues.length < minOccurrences) return;

    // Check if threshold is exceeded
    let exceeded = false;
    let actualValue: number = 0;

    switch (operator) {
      case "gt":
        actualValue = Math.max(...recentValues.map((v) => v.value));
        exceeded = actualValue > threshold;
        break;
      case "lt":
        actualValue = Math.min(...recentValues.map((v) => v.value));
        exceeded = actualValue < threshold;
        break;
      case "gte":
        actualValue = Math.max(...recentValues.map((v) => v.value));
        exceeded = actualValue >= threshold;
        break;
      case "lte":
        actualValue = Math.min(...recentValues.map((v) => v.value));
        exceeded = actualValue <= threshold;
        break;
      case "eq":
        actualValue = recentValues[recentValues.length - 1]?.value || 0;
        exceeded = actualValue === threshold;
        break;
    }

    if (exceeded) {
      this.raiseAlert(alertType, config, actualValue, recentValues);
    }
  }

  // ===== ALERT MANAGEMENT =====

  public raiseAlert(
    alertType: AlertType,
    config: unknown,
    actualValue: number,
    metricValues: unknown[],
  ): void {
    const alertId = `${alertType}_${Date.now()}`;

    // Check if similar alert is already active
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      (alert) => alert.type === alertType && !alert.resolved,
    );

    if (existingAlert) {
      // Update existing alert
      logger.warn(`Alert ${alertType} already active, updating`, {
        alertId: existingAlert.id,
        newValue: actualValue,
      });
      return;
    }

    const alert: Alert = {
      id: alertId,
      type: alertType,
      severity: this.getSeverityForAlertType(alertType),
      title: this.getTitleForAlertType(alertType),
      description: this.getDescriptionForAlertType(
        alertType,
        actualValue,
        config,
      ),
      context: {
        metric: (config as any).metric,
        threshold: (config as any).threshold,
        actualValue,
        timeWindow: (config as any).window,
        occurrences: metricValues.length,
      },
      timestamp: Date.now(),
      resolved: false,
      threshold: {
        metric: (config as any).metric,
        value: (config as any).threshold,
        operator: (config as any).operator,
      },
    };

    this.activeAlerts.set(alertId, alert);

    // Log and notify
    this.notifyAlert(alert);
  }

  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();

      logger.info(`Alert resolved: ${alert.title}`, {
        alertId,
        type: alert.type,
        duration: alert.resolvedAt - alert.timestamp,
      });

      // Keep resolved alerts for 24 hours then clean up
      setTimeout(
        () => {
          this.activeAlerts.delete(alertId);
        },
        24 * 60 * 60 * 1000,
      );
    }
  }

  // ===== ALERT NOTIFICATIONS =====

  private notifyAlert(alert: Alert): void {
    // Log the alert
    const logMethod = this.getLogMethodForSeverity(alert.severity);

    logMethod(`🚨 ALERT: ${alert.title}`, {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      description: alert.description,
      context: alert.context,
      threshold: alert.threshold,
    });

    // Send to external monitoring systems
    this.sendToMonitoringSystem(alert);

    // Send notifications based on severity
    if (
      alert.severity === AlertSeverity.CRITICAL ||
      alert.severity === AlertSeverity.HIGH
    ) {
      this.sendUrgentNotification(alert);
    }
  }

  private sendToMonitoringSystem(alert: Alert): void {
    // Send to external monitoring (Datadog, New Relic, etc.)
    if (process.env.MONITORING_WEBHOOK_URL) {
      fetch(process.env.MONITORING_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alert_id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          context: alert.context,
          timestamp: alert.timestamp,
        }),
      }).catch((error) => {
        logger.error("Failed to send alert to monitoring system", {
          error: error.message,
        });
      });
    }
  }

  private sendUrgentNotification(alert: Alert): void {
    // Send Slack, Teams, email notifications
    if (process.env.SLACK_WEBHOOK_URL) {
      fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `🚨 *${alert.severity.toUpperCase()} ALERT*\n\n*${alert.title}*\n\n${alert.description}\n\nContext: ${JSON.stringify(alert.context, null, 2)}`,
          username: "Composition Monitor",
          icon_emoji: ":warning:",
        }),
      }).catch((error) => {
        logger.error("Failed to send Slack notification", {
          error: error.message,
        });
      });
    }

    // Send email notification
    if (process.env.ALERT_EMAIL_WEBHOOK) {
      // Implementation would depend on email service
    }
  }

  // ===== UTILITY METHODS =====

  private getSeverityForAlertType(alertType: AlertType): AlertSeverity {
    switch (alertType) {
      case AlertType.COMPOSITION_FAILURE:
      case AlertType.ERROR_RATE_SPIKE:
        return AlertSeverity.CRITICAL;
      case AlertType.PERFORMANCE_DEGRADATION:
      case AlertType.SECTION_TIMEOUT:
      case AlertType.MEMORY_LEAK:
        return AlertSeverity.HIGH;
      case AlertType.EXPERIMENT_IMPACT:
      case AlertType.FALLBACK_OVERUSE:
        return AlertSeverity.MEDIUM;
      case AlertType.CACHE_MISSES_HIGH:
        return AlertSeverity.LOW;
      default:
        return AlertSeverity.MEDIUM;
    }
  }

  private getTitleForAlertType(alertType: AlertType): string {
    switch (alertType) {
      case AlertType.PERFORMANCE_DEGRADATION:
        return "Page Composition Performance Degraded";
      case AlertType.ERROR_RATE_SPIKE:
        return "High Error Rate in Page Composition";
      case AlertType.COMPOSITION_FAILURE:
        return "Critical: Page Composition Failing";
      case AlertType.SECTION_TIMEOUT:
        return "Section Processing Timeout";
      case AlertType.MEMORY_LEAK:
        return "Memory Leak Detected in Composition";
      case AlertType.EXPERIMENT_IMPACT:
        return "Experiment Having Unexpected Impact";
      case AlertType.FALLBACK_OVERUSE:
        return "High Fallback Usage Rate";
      case AlertType.CACHE_MISSES_HIGH:
        return "High Cache Miss Rate";
      default:
        return "Composition System Alert";
    }
  }

  private getDescriptionForAlertType(
    alertType: AlertType,
    actualValue: number,
    config: unknown,
  ): string {
    const configData = config as {
      metric: string;
      threshold: number;
      operator: string;
      window: number;
      minOccurrences: number;
    };
    const threshold = configData.threshold;
    const metric = configData.metric;

    switch (alertType) {
      case AlertType.PERFORMANCE_DEGRADATION:
        return `Page composition duration (${actualValue}ms) exceeded threshold (${threshold}ms)`;
      case AlertType.ERROR_RATE_SPIKE:
        return `Error rate (${(actualValue * 100).toFixed(1)}%) exceeded threshold (${(threshold * 100).toFixed(1)}%)`;
      case AlertType.COMPOSITION_FAILURE:
        return `Page composition failures detected (${actualValue} failures)`;
      case AlertType.SECTION_TIMEOUT:
        return `Section processing timeout (${actualValue}ms > ${threshold}ms)`;
      case AlertType.MEMORY_LEAK:
        return `Memory usage increased by ${(actualValue / 1024 / 1024).toFixed(1)}MB`;
      case AlertType.FALLBACK_OVERUSE:
        return `Fallback usage rate (${(actualValue * 100).toFixed(1)}%) too high`;
      case AlertType.CACHE_MISSES_HIGH:
        return `Cache miss rate (${(actualValue * 100).toFixed(1)}%) too high`;
      default:
        return `Alert triggered for ${metric}: ${actualValue} ${(configData as any).operator} ${threshold}`;
    }
  }

  private getLogMethodForSeverity(severity: AlertSeverity) {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return logger.error.bind(logger);
      case AlertSeverity.HIGH:
        return logger.error.bind(logger);
      case AlertSeverity.MEDIUM:
        return logger.warn.bind(logger);
      case AlertSeverity.LOW:
        return logger.info.bind(logger);
    }
  }

  // ===== PUBLIC API =====

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }

  getResolvedAlerts(hours: number = 24): Alert[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return Array.from(this.activeAlerts.values()).filter(
      (alert) =>
        alert.resolved && alert.resolvedAt && alert.resolvedAt > cutoff,
    );
  }

  updateThreshold(alertType: AlertType, newConfig: Partial<unknown>): void {
    const existing = this.alertThresholds.get(alertType);
    if (existing && typeof existing === 'object' && existing !== null) {
      this.alertThresholds.set(alertType, { ...existing, ...(newConfig as Record<string, unknown>) });
    }
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// ===== GLOBAL INSTANCE =====

export const compositionAlerts = CompositionAlertManager.getInstance();

// ===== UTILITY FUNCTIONS =====

export function alertOnCompositionFailure(
  pageType: PageType,
  error: Error,
): void {
  compositionAlerts.raiseAlert(
    AlertType.COMPOSITION_FAILURE,
    {
      metric: "page_composition_errors_total",
      threshold: 1,
      operator: "gte",
      window: 1 * 60 * 1000,
      minOccurrences: 1,
    },
    1,
    [],
  );
}

export function alertOnPerformanceDegradation(
  pageType: PageType,
  durationMs: number,
): void {
  if (durationMs > 3000) {
    // 3 seconds threshold
    compositionAlerts.raiseAlert(
      AlertType.PERFORMANCE_DEGRADATION,
      {
        metric: "page_composition_duration_ms",
        threshold: 3000,
        operator: "gt",
        window: 5 * 60 * 1000,
        minOccurrences: 3,
      },
      durationMs,
      [],
    );
  }
}

export function alertOnHighErrorRate(
  errorCount: number,
  totalRequests: number,
): void {
  const errorRate = errorCount / totalRequests;
  if (errorRate > 0.1) {
    // 10% threshold
    compositionAlerts.raiseAlert(
      AlertType.ERROR_RATE_SPIKE,
      {
        metric: "page_composition_errors_total",
        threshold: 0.1,
        operator: "gt",
        window: 10 * 60 * 1000,
        minOccurrences: 5,
      },
      errorRate,
      [],
    );
  }
}

// ===== CLEANUP =====

process.on("exit", () => {
  CompositionAlertManager.getInstance().destroy();
});

process.on("SIGINT", () => {
  CompositionAlertManager.getInstance().destroy();
  process.exit();
});

process.on("SIGTERM", () => {
  CompositionAlertManager.getInstance().destroy();
  process.exit();
});
