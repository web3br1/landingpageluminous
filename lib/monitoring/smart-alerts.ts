/**
 * Smart Alerts System - Fase 3
 * Sistema de alertas inteligentes com anomaly detection e thresholds dinâmicos
 */

import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import { getAdvancedMonitoringSystem } from "./advanced-metrics";

// ===== LOG-BASED ALERT SYSTEM =====

interface LogBasedAlertRule {
  id: string;
  name: string;
  description: string;
  eventType: string;
  conditions: {
    field: string;
    operator:
      | "equals"
      | "not_equals"
      | "greater_than"
      | "less_than"
      | "contains"
      | "regex";
    value: unknown;
  }[];
  severity: "low" | "medium" | "high" | "critical";
  cooldownMinutes: number;
  enabled: boolean;
  channels: ("email" | "slack" | "webhook" | "log")[];
  metadata?: Record<string, unknown>;
}

interface AlertInstance {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  event: unknown;
  severity: string;
  message: string;
  traceId?: string;
}

class LogBasedAlertEngine {
  private rules: Map<string, LogBasedAlertRule> = new Map();
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private cooldowns: Map<string, Date> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Performance alerts
    this.addRule({
      id: "hydration_mismatch_high",
      name: "High Hydration Mismatch Rate",
      description: "Too many hydration mismatches detected",
      eventType: "hydration_mismatch",
      conditions: [{ field: "severity", operator: "equals", value: "high" }],
      severity: "high",
      cooldownMinutes: 30,
      enabled: true,
      channels: ["slack", "log"],
    });

    this.addRule({
      id: "lazy_load_failure",
      name: "Lazy Loading Failures",
      description: "Components failing to lazy load",
      eventType: "lazy_load_error",
      conditions: [
        { field: "loadTime", operator: "greater_than", value: 5000 },
      ],
      severity: "medium",
      cooldownMinutes: 15,
      enabled: true,
      channels: ["log"],
    });

    // Composition alerts
    this.addRule({
      id: "composer_validation_failure",
      name: "Composer Validation Failures",
      description: "Composer validation consistently failing",
      eventType: "composer_validation",
      conditions: [{ field: "result", operator: "equals", value: "failure" }],
      severity: "high",
      cooldownMinutes: 10,
      enabled: true,
      channels: ["slack", "log"],
    });

    // Experiment alerts
    this.addRule({
      id: "experiment_conversion_drop",
      name: "Experiment Conversion Drop",
      description: "Significant drop in experiment conversion rate",
      eventType: "experiment_conversion",
      conditions: [
        { field: "conversionValue", operator: "less_than", value: 0.05 },
      ],
      severity: "medium",
      cooldownMinutes: 60,
      enabled: true,
      channels: ["email", "log"],
    });

    // Cache alerts
    this.addRule({
      id: "cache_hit_rate_low",
      name: "Low Cache Hit Rate",
      description: "Cache hit rate below acceptable threshold",
      eventType: "cache_miss",
      conditions: [{ field: "cacheSize", operator: "greater_than", value: 50 }],
      severity: "low",
      cooldownMinutes: 120,
      enabled: true,
      channels: ["log"],
    });

    // Error alerts
    this.addRule({
      id: "composition_error_critical",
      name: "Critical Composition Error",
      description: "Critical error in page composition",
      eventType: "composer_error",
      conditions: [{ field: "fallbackUsed", operator: "equals", value: false }],
      severity: "critical",
      cooldownMinutes: 5,
      enabled: true,
      channels: ["slack", "email"],
    });
  }

  addRule(rule: LogBasedAlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info("Alert rule added", {
      event: "alert_rule_added",
      ruleId: rule.id,
      eventType: rule.eventType,
      severity: rule.severity,
    });
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.info("Alert rule removed", {
      event: "alert_rule_removed",
      ruleId,
    });
  }

  processLogEntry(logEntry: unknown): void {
    const eventType = logEntry.event;

    if (!eventType) return;

    // Find matching rules
    const matchingRules = Array.from(this.rules.values()).filter(
      (rule) => rule.enabled && rule.eventType === eventType,
    );

    for (const rule of matchingRules) {
      if (this.checkCooldown(rule.id)) continue;
      if (this.evaluateConditions(rule.conditions, logEntry)) {
        this.triggerAlert(rule, logEntry);
      }
    }
  }

  private checkCooldown(ruleId: string): boolean {
    const lastTriggered = this.cooldowns.get(ruleId);
    if (!lastTriggered) return false;

    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const cooldownEnd = new Date(
      lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000,
    );
    return new Date() < cooldownEnd;
  }

  private evaluateConditions(
    conditions: LogBasedAlertRule["conditions"],
    logEntry: unknown,
  ): boolean {
    return conditions.every((condition) => {
      const fieldValue = logEntry[condition.field];

      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "not_equals":
          return fieldValue !== condition.value;
        case "greater_than":
          return typeof fieldValue === "number" && fieldValue > condition.value;
        case "less_than":
          return typeof fieldValue === "number" && fieldValue < condition.value;
        case "contains":
          return (
            typeof fieldValue === "string" &&
            fieldValue.includes(condition.value)
          );
        case "regex":
          return (
            typeof fieldValue === "string" &&
            new RegExp(condition.value).test(fieldValue)
          );
        default:
          return false;
      }
    });
  }

  private triggerAlert(rule: LogBasedAlertRule, event: unknown): void {
    const alertId = `${rule.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: AlertInstance = {
      id: alertId,
      ruleId: rule.id,
      triggeredAt: new Date(),
      event,
      severity: rule.severity,
      message: `${rule.name}: ${rule.description}`,
      traceId: (event as any).traceId,
    };

    this.activeAlerts.set(alertId, alert);
    this.cooldowns.set(rule.id, new Date());

    // Log the alert
    logger.warn("Alert triggered", {
      event: "alert_triggered",
      alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      eventType: rule.eventType,
      eventData: event,
      traceId: (event as any).traceId,
    });

    // Send to configured channels
    this.sendAlertToChannels(alert, rule.channels);
  }

  private async sendAlertToChannels(
    alert: AlertInstance,
    channels: string[],
  ): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case "log":
            // Already logged above
            break;
          case "slack":
            await this.sendSlackAlert(alert);
            break;
          case "email":
            await this.sendEmailAlert(alert);
            break;
          case "webhook":
            await this.sendWebhookAlert(alert);
            break;
        }
      } catch (error) {
        logger.error("Failed to send alert to channel", {
          event: "alert_delivery_failed",
          alertId: alert.id,
          channel,
          error:
            error instanceof Error
              ? error
              : { name: "Error", message: String(error) },
        });
      }
    }
  }

  private async sendSlackAlert(alert: AlertInstance): Promise<void> {
    // In production, integrate with Slack API
    logger.info("Slack alert would be sent", {
      event: "alert_slack_simulation",
      alertId: alert.id,
      message: alert.message,
      severity: alert.severity,
    });
  }

  private async sendEmailAlert(alert: AlertInstance): Promise<void> {
    // In production, integrate with email service
    logger.info("Email alert would be sent", {
      event: "alert_email_simulation",
      alertId: alert.id,
      message: alert.message,
      severity: alert.severity,
    });
  }

  private async sendWebhookAlert(alert: AlertInstance): Promise<void> {
    // In production, send to configured webhook
    logger.info("Webhook alert would be sent", {
      event: "alert_webhook_simulation",
      alertId: alert.id,
      message: alert.message,
      severity: alert.severity,
    });
  }

  getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolvedAt,
    );
  }

  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      logger.info("Alert resolved", {
        event: "alert_resolved",
        alertId,
        ruleId: alert.ruleId,
        duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime(),
      });
    }
  }

  getRules(): LogBasedAlertRule[] {
    return Array.from(this.rules.values());
  }
}

// Global instance
export const logBasedAlertEngine = new LogBasedAlertEngine();

// Hook to integrate with logging system
export function integrateAlertsWithLogger(): void {
  // In production, this would monkey-patch the logger to intercept logs
  // For now, we'll provide a function to manually process log entries
}

// Function to manually process a log entry for alerts
export function processLogForAlerts(logEntry: unknown): void {
  logBasedAlertEngine.processLogEntry(logEntry);
}

/**
 * Alert Severity Levels
 */
export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Alert Status
 */
export enum AlertStatus {
  ACTIVE = "active",
  RESOLVED = "resolved",
  ACKNOWLEDGED = "acknowledged",
}

/**
 * Alert Definition
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  metric: string;
  condition: "above" | "below" | "equals" | "not_equals" | "anomaly";
  threshold: number;
  duration: number; // seconds
  cooldown: number; // seconds between alerts
  enabled: boolean;
  channels: string[]; // ['email', 'slack', 'webhook']
  metadata?: Record<string, unknown>;
}

/**
 * Active Alert Instance
 */
export interface ActiveAlert {
  id: string;
  ruleId: string;
  triggeredAt: number;
  resolvedAt?: number;
  status: AlertStatus;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  metadata: Record<string, unknown>;
}

/**
 * Anomaly Detection Engine
 */
export class AnomalyDetector {
  private historicalData: Map<string, number[]> = new Map();
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Add data point for anomaly detection
   */
  addDataPoint(metric: string, value: number): void {
    let data = this.historicalData.get(metric) || [];
    data.push(value);

    // Keep only recent data
    if (data.length > this.maxHistorySize) {
      data = data.slice(-this.maxHistorySize);
    }

    this.historicalData.set(metric, data);
  }

  /**
   * Detect anomaly using statistical methods
   */
  detectAnomaly(
    metric: string,
    currentValue: number,
    sensitivity: number = 2,
  ): boolean {
    const data = this.historicalData.get(metric) || [];

    if (data.length < 10) {
      // Not enough data for anomaly detection
      return false;
    }

    // Calculate mean and standard deviation
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      // No variation in data
      return Math.abs(currentValue - mean) > sensitivity;
    }

    // Z-score based anomaly detection
    const zScore = Math.abs((currentValue - mean) / stdDev);

    return zScore > sensitivity;
  }

  /**
   * Get statistical summary for metric
   */
  getMetricStats(metric: string) {
    const data = this.historicalData.get(metric) || [];

    if (data.length === 0) {
      return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);

    return {
      count: data.length,
      mean,
      stdDev,
      min,
      max,
      lastValue: data[data.length - 1],
    };
  }

  /**
   * Clear historical data for metric
   */
  clearMetric(metric: string): void {
    this.historicalData.delete(metric);
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.historicalData.clear();
  }
}

/**
 * Smart Alert Manager
 */
export class SmartAlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  private lastTriggered: Map<string, number> = new Map();
  private anomalyDetector: AnomalyDetector;
  private monitoringSystem: unknown;

  constructor() {
    this.anomalyDetector = new AnomalyDetector();
    this.monitoringSystem = getAdvancedMonitoringSystem();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: "high_error_rate",
        name: "High Error Rate",
        description: "Error rate exceeded 5% threshold",
        severity: AlertSeverity.HIGH,
        metric: "error_rate",
        condition: "above",
        threshold: 0.05,
        duration: 300, // 5 minutes
        cooldown: 1800, // 30 minutes
        enabled: true,
        channels: ["email", "slack"],
      },
      {
        id: "core_web_vitals_lcp",
        name: "Poor LCP Performance",
        description: "Largest Contentful Paint above 4 seconds",
        severity: AlertSeverity.MEDIUM,
        metric: "core_web_vitals_lcp_seconds",
        condition: "above",
        threshold: 4.0,
        duration: 600, // 10 minutes
        cooldown: 3600, // 1 hour
        enabled: true,
        channels: ["email"],
      },
      {
        id: "webhook_queue_size",
        name: "Webhook Queue Backlog",
        description: "Webhook queue size exceeded 100 messages",
        severity: AlertSeverity.HIGH,
        metric: "webhook_queue_size",
        condition: "above",
        threshold: 100,
        duration: 300, // 5 minutes
        cooldown: 900, // 15 minutes
        enabled: true,
        channels: ["slack", "webhook"],
      },
      {
        id: "api_response_time",
        name: "Slow API Responses",
        description: "API response time above 2 seconds average",
        severity: AlertSeverity.MEDIUM,
        metric: "api_response_time_seconds",
        condition: "above",
        threshold: 2.0,
        duration: 300, // 5 minutes
        cooldown: 1800, // 30 minutes
        enabled: true,
        channels: ["email"],
      },
      {
        id: "conversion_rate_drop",
        name: "Conversion Rate Drop",
        description: "Conversion rate dropped by more than 20%",
        severity: AlertSeverity.CRITICAL,
        metric: "business_kpi_conversion_rate",
        condition: "anomaly",
        threshold: 2.0, // Z-score sensitivity
        duration: 3600, // 1 hour
        cooldown: 7200, // 2 hours
        enabled: true,
        channels: ["email", "slack"],
      },
      {
        id: "memory_usage_high",
        name: "High Memory Usage",
        description: "Memory usage above 90%",
        severity: AlertSeverity.HIGH,
        metric: "infrastructure_memory_usage_percent",
        condition: "above",
        threshold: 90,
        duration: 300, // 5 minutes
        cooldown: 1800, // 30 minutes
        enabled: true,
        channels: ["slack"],
      },
    ];

    defaultRules.forEach((rule) => this.addRule(rule));
  }

  /**
   * Add alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info("Alert rule added", {
      ruleId: rule.id,
      name: rule.name,
      severity: rule.severity,
    });
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      logger.info("Alert rule removed", { ruleId });
    }
    return removed;
  }

  /**
   * Update alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.set(ruleId, { ...rule, ...updates });
    logger.info("Alert rule updated", { ruleId, updates });
    return true;
  }

  /**
   * Evaluate all rules against current metrics
   */
  async evaluateRules(): Promise<void> {
    const monitoringReport = (this.monitoringSystem as any).getMonitoringReport();
    const now = Date.now();

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = await this.evaluateRule(rule, monitoringReport);

        if (shouldAlert) {
          // Check cooldown
          const lastTrigger = this.lastTriggered.get(ruleId) || 0;
          if (now - lastTrigger < rule.cooldown * 1000) {
            continue; // Still in cooldown
          }

          await this.triggerAlert(rule);
          this.lastTriggered.set(ruleId, now);
        }
      } catch (error) {
        logger.error("Error evaluating alert rule", {
          ruleId,
          ruleName: rule.name,
          error:
            error instanceof Error
              ? error
              : new Error("Unknown error evaluating alert rule"),
        });
      }
    }
  }

  /**
   * Evaluate single rule
   */
  private async evaluateRule(
    rule: AlertRule,
    monitoringData: unknown,
  ): Promise<boolean> {
    // For now, use mock data - in production this would query real metrics
    let currentValue: number;

    switch (rule.metric) {
      case "error_rate":
        currentValue = Math.random() * 0.1; // Mock error rate
        break;
      case "core_web_vitals_lcp_seconds":
        currentValue = 2 + Math.random() * 4; // Mock LCP
        break;
      case "webhook_queue_size":
        currentValue = Math.floor(Math.random() * 200); // Mock queue size
        break;
      case "api_response_time_seconds":
        currentValue = 1 + Math.random() * 3; // Mock API response time
        break;
      case "business_kpi_conversion_rate":
        currentValue = 0.05 + Math.random() * 0.1; // Mock conversion rate
        break;
      case "infrastructure_memory_usage_percent":
        currentValue = 70 + Math.random() * 30; // Mock memory usage
        break;
      default:
        currentValue = Math.random() * 100;
    }

    // Add to anomaly detector
    this.anomalyDetector.addDataPoint(rule.metric, currentValue);

    // Evaluate condition
    switch (rule.condition) {
      case "above":
        return currentValue > rule.threshold;
      case "below":
        return currentValue < rule.threshold;
      case "equals":
        return Math.abs(currentValue - rule.threshold) < 0.01;
      case "not_equals":
        return Math.abs(currentValue - rule.threshold) >= 0.01;
      case "anomaly":
        return this.anomalyDetector.detectAnomaly(
          rule.metric,
          currentValue,
          rule.threshold,
        );
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alertId = `alert_${rule.id}_${Date.now()}`;
    const alert: ActiveAlert = {
      id: alertId,
      ruleId: rule.id,
      triggeredAt: Date.now(),
      status: AlertStatus.ACTIVE,
      severity: rule.severity,
      message: `${rule.name}: ${rule.description}`,
      value: 0, // Would be populated with actual value
      threshold: rule.threshold,
      metadata: {
        rule: rule,
        triggeredBy: "smart_alert_manager",
      },
    };

    this.activeAlerts.set(alertId, alert);

    metrics.incrementCounter("alerts_triggered_total", 1, {
      rule_id: rule.id,
      severity: rule.severity,
      channels: rule.channels.join(","),
    });

    // Send notifications
    await this.sendNotifications(alert, rule.channels);

    logger.warn("Alert triggered", {
      alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      channels: rule.channels,
    });
  }

  /**
   * Send notifications via configured channels
   */
  private async sendNotifications(
    alert: ActiveAlert,
    channels: string[],
  ): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case "email":
            await this.sendEmailNotification(alert);
            break;
          case "slack":
            await this.sendSlackNotification(alert);
            break;
          case "webhook":
            await this.sendWebhookNotification(alert);
            break;
          default:
            logger.warn("Unknown notification channel", { channel });
        }
      } catch (error) {
        logger.error("Failed to send notification", {
          channel,
          alertId: alert.id,
          error:
            error instanceof Error
              ? error
              : new Error("Unknown notification error"),
        });
      }
    }
  }

  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(alert: ActiveAlert): Promise<void> {
    // In production, integrate with email service
    logger.info("Email notification sent", {
      alertId: alert.id,
      severity: alert.severity,
      message: alert.message,
    });
  }

  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlackNotification(alert: ActiveAlert): Promise<void> {
    // In production, integrate with Slack API
    logger.info("Slack notification sent", {
      alertId: alert.id,
      severity: alert.severity,
      message: alert.message,
    });
  }

  /**
   * Send webhook notification (placeholder)
   */
  private async sendWebhookNotification(alert: ActiveAlert): Promise<void> {
    // In production, send to configured webhook URLs
    logger.info("Webhook notification sent", {
      alertId: alert.id,
      severity: alert.severity,
      message: alert.message,
    });
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = AlertStatus.ACKNOWLEDGED;
    this.activeAlerts.set(alertId, alert);

    logger.info("Alert acknowledged", { alertId });

    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = Date.now();
    this.activeAlerts.set(alertId, alert);

    metrics.incrementCounter("alerts_resolved_total", 1, {
      rule_id: alert.ruleId,
      severity: alert.severity,
      duration_seconds: (
        (alert.resolvedAt! - alert.triggeredAt) /
        1000
      ).toString(),
    });

    logger.info("Alert resolved", { alertId });

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ActiveAlert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.status === AlertStatus.ACTIVE,
    );
  }

  /**
   * Get all alerts (active and resolved)
   */
  getAllAlerts(limit: number = 100): ActiveAlert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.triggeredAt - a.triggeredAt)
      .slice(0, limit);
  }

  /**
   * Get alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get system statistics
   */
  getStats() {
    const activeAlerts = this.getActiveAlerts();
    const resolvedAlerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.status === AlertStatus.RESOLVED,
    );

    return {
      totalRules: this.rules.size,
      activeAlerts: activeAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      totalAlerts: this.activeAlerts.size,
      alertsBySeverity: {
        [AlertSeverity.LOW]: activeAlerts.filter(
          (a) => a.severity === AlertSeverity.LOW,
        ).length,
        [AlertSeverity.MEDIUM]: activeAlerts.filter(
          (a) => a.severity === AlertSeverity.MEDIUM,
        ).length,
        [AlertSeverity.HIGH]: activeAlerts.filter(
          (a) => a.severity === AlertSeverity.HIGH,
        ).length,
        [AlertSeverity.CRITICAL]: activeAlerts.filter(
          (a) => a.severity === AlertSeverity.CRITICAL,
        ).length,
      },
    };
  }

  /**
   * Start monitoring loop
   */
  startMonitoring(intervalSeconds: number = 60): void {
    logger.info("Smart alert monitoring started", { intervalSeconds });

    setInterval(async () => {
      try {
        await this.evaluateRules();
      } catch (error) {
        logger.error("Error in alert monitoring loop", {
          error:
            error instanceof Error
              ? error
              : new Error("Unknown monitoring loop error"),
        });
      }
    }, intervalSeconds * 1000);
  }

  /**
   * Stop monitoring (for testing)
   */
  stopMonitoring(): void {
    // In a real implementation, clear the interval
    logger.info("Smart alert monitoring stopped");
  }
}

// ===== SINGLETON INSTANCE =====

let alertManagerInstance: SmartAlertManager | null = null;

export function getSmartAlertManager(): SmartAlertManager {
  if (!alertManagerInstance) {
    alertManagerInstance = new SmartAlertManager();
  }
  return alertManagerInstance;
}

export function destroyAlertManager(): void {
  if (alertManagerInstance) {
    alertManagerInstance.stopMonitoring();
    alertManagerInstance = null;
  }
}
