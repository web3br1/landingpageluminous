/**
 * Advanced Monitoring & Metrics System - Fase 3
 * Sistema completo de métricas de negócio e técnicas para observabilidade avançada
 */

import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import { tracer } from "../observability/tracer";

/**
 * Business KPI Metrics Collector
 */
export class BusinessKPIs {
  private kpis: Map<string, number> = new Map();
  private historicalData: Map<string, number[]> = new Map();

  constructor(private retentionDays: number = 30) {
    // Initialize business KPIs
    this.initializeKPIs();
  }

  private initializeKPIs() {
    const initialKPIs = [
      "total_revenue",
      "monthly_recurring_revenue",
      "conversion_rate",
      "customer_acquisition_cost",
      "customer_lifetime_value",
      "churn_rate",
      "user_engagement_score",
      "feature_adoption_rate",
      "support_ticket_resolution_time",
      "net_promoter_score",
    ];

    initialKPIs.forEach((kpi) => {
      this.kpis.set(kpi, 0);
      this.historicalData.set(kpi, []);
    });
  }

  /**
   * Record business KPI
   */
  recordKPI(name: string, value: number, metadata?: Record<string, any>) {
    this.kpis.set(name, value);

    // Store historical data
    const history = this.historicalData.get(name) || [];
    history.push(value);

    // Keep only last N days of data
    if (history.length > this.retentionDays) {
      history.shift();
    }

    this.historicalData.set(name, history);

    // Record in metrics system
    metrics.recordHistogram(`business_kpi_${name}`, value, {
      kpi_name: name,
      ...metadata,
    });

    logger.info(`Business KPI recorded: ${name}`, {
      value,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Calculate KPI growth rate
   */
  getKPIGrowthRate(name: string, days: number = 7): number {
    const history = this.historicalData.get(name) || [];
    if (history.length < days * 2) return 0;

    const recent = history.slice(-days);
    const previous = history.slice(-days * 2, -days);

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const previousAvg =
      previous.reduce((sum, val) => sum + val, 0) / previous.length;

    if (previousAvg === 0) return 0;

    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }

  /**
   * Get KPI statistics
   */
  getKPIStats(name: string) {
    const current = this.kpis.get(name) || 0;
    const history = this.historicalData.get(name) || [];

    return {
      current,
      average:
        history.length > 0
          ? history.reduce((sum, val) => sum + val, 0) / history.length
          : 0,
      min: history.length > 0 ? Math.min(...history) : 0,
      max: history.length > 0 ? Math.max(...history) : 0,
      growth7d: this.getKPIGrowthRate(name, 7),
      growth30d: this.getKPIGrowthRate(name, 30),
      dataPoints: history.length,
    };
  }

  /**
   * Get all KPIs summary
   */
  getKPIsSummary() {
    const summary: Record<string, any> = {};

    for (const [name] of this.kpis) {
      summary[name] = this.getKPIStats(name);
    }

    return summary;
  }
}

/**
 * Technical Metrics Collector
 */
export class TechnicalMetrics {
  private metricsData: Map<string, any> = new Map();

  /**
   * Record Core Web Vitals
   */
  recordCoreWebVitals(
    vitals: {
      lcp?: number;
      cls?: number;
      inp?: number;
      fid?: number;
      ttfb?: number;
    },
    metadata?: Record<string, any>,
  ) {
    const span = tracer.startSpan(
      "record_core_web_vitals",
      undefined,
      metadata,
    );

    try {
      if (vitals.lcp !== undefined) {
        metrics.recordHistogram(
          "core_web_vitals_lcp_seconds",
          vitals.lcp / 1000,
          {
            vital: "lcp",
            ...metadata,
          },
        );
      }

      if (vitals.cls !== undefined) {
        metrics.recordHistogram("core_web_vitals_cls", vitals.cls, {
          vital: "cls",
          ...metadata,
        });
      }

      if (vitals.inp !== undefined) {
        metrics.recordHistogram(
          "core_web_vitals_inp_seconds",
          vitals.inp / 1000,
          {
            vital: "inp",
            ...metadata,
          },
        );
      }

      if (vitals.fid !== undefined) {
        metrics.recordHistogram(
          "core_web_vitals_fid_seconds",
          vitals.fid / 1000,
          {
            vital: "fid",
            ...metadata,
          },
        );
      }

      if (vitals.ttfb !== undefined) {
        metrics.recordHistogram(
          "core_web_vitals_ttfb_seconds",
          vitals.ttfb / 1000,
          {
            vital: "ttfb",
            ...metadata,
          },
        );
      }

      logger.info("Core Web Vitals recorded", {
        vitals,
        timestamp: Date.now(),
        ...metadata,
      });
    } finally {
      tracer.finishSpan(span);
    }
  }

  /**
   * Record API performance metrics
   */
  recordAPIPerformance(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    metadata?: Record<string, any>,
  ) {
    const span = tracer.startSpan("record_api_performance", undefined, {
      "api.endpoint": endpoint,
      "api.method": method,
      "api.status_code": statusCode.toString(),
      "api.response_time_ms": responseTime.toString(),
      ...metadata,
    });

    try {
      metrics.recordHistogram(
        "api_response_time_seconds",
        responseTime / 1000,
        {
          endpoint,
          method,
          status_code: statusCode.toString(),
          ...metadata,
        },
      );

      metrics.incrementCounter("api_requests_total", 1, {
        endpoint,
        method,
        status_code: statusCode.toString(),
        ...metadata,
      });

      // Record error rate
      if (statusCode >= 400) {
        metrics.incrementCounter("api_errors_total", 1, {
          endpoint,
          method,
          status_code: statusCode.toString(),
          ...metadata,
        });
      }

      logger.info("API performance recorded", {
        endpoint,
        method,
        responseTime,
        statusCode,
        timestamp: Date.now(),
        ...metadata,
      });
    } finally {
      tracer.finishSpan(span);
    }
  }

  /**
   * Record user engagement metrics
   */
  recordUserEngagement(
    action: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>,
  ) {
    const span = tracer.startSpan("record_user_engagement", undefined, {
      "engagement.action": action,
      ...(userId && { "user.id": userId }),
      ...(sessionId && { "session.id": sessionId }),
      ...metadata,
    });

    try {
      metrics.incrementCounter("user_engagement_total", 1, {
        action,
        ...(userId && { user_id: userId }),
        ...(sessionId && { session_id: sessionId }),
        ...metadata,
      });

      // Record session activity
      if (sessionId) {
        metrics.recordHistogram(
          "session_activity_duration",
          Date.now() / 1000,
          {
            session_id: sessionId,
            action,
            ...metadata,
          },
        );
      }

      logger.info("User engagement recorded", {
        action,
        userId,
        sessionId,
        timestamp: Date.now(),
        ...metadata,
      });
    } finally {
      tracer.finishSpan(span);
    }
  }

  /**
   * Record infrastructure metrics
   */
  recordInfrastructureMetrics(
    metricsData: {
      cpuUsage?: number;
      memoryUsage?: number;
      diskUsage?: number;
      networkIn?: number;
      networkOut?: number;
      activeConnections?: number;
    },
    metadata?: Record<string, any>,
  ) {
    const span = tracer.startSpan(
      "record_infrastructure_metrics",
      undefined,
      metadata,
    );

    try {
      if (metricsData.cpuUsage !== undefined) {
        metrics.recordHistogram(
          "infrastructure_cpu_usage_percent",
          metricsData.cpuUsage,
          metadata,
        );
      }

      if (metricsData.memoryUsage !== undefined) {
        metrics.recordHistogram(
          "infrastructure_memory_usage_percent",
          metricsData.memoryUsage,
          metadata,
        );
      }

      if (metricsData.diskUsage !== undefined) {
        metrics.recordHistogram(
          "infrastructure_disk_usage_percent",
          metricsData.diskUsage,
          metadata,
        );
      }

      if (metricsData.networkIn !== undefined) {
        metrics.recordHistogram(
          "infrastructure_network_in_bytes",
          metricsData.networkIn,
          metadata,
        );
      }

      if (metricsData.networkOut !== undefined) {
        metrics.recordHistogram(
          "infrastructure_network_out_bytes",
          metricsData.networkOut,
          metadata,
        );
      }

      if (metricsData.activeConnections !== undefined) {
        metrics.recordHistogram(
          "infrastructure_active_connections",
          metricsData.activeConnections,
          metadata,
        );
      }

      logger.info("Infrastructure metrics recorded", {
        metrics: metricsData,
        timestamp: Date.now(),
        ...metadata,
      });
    } finally {
      tracer.finishSpan(span);
    }
  }

  /**
   * Get technical metrics summary
   */
  getTechnicalMetricsSummary() {
    return {
      timestamp: Date.now(),
      summary: "Technical metrics collected and stored in observability system",
    };
  }
}

/**
 * User Experience Metrics Collector
 */
export class UserExperienceMetrics {
  private sessionData: Map<string, any> = new Map();
  private featureUsage: Map<string, number> = new Map();

  /**
   * Record session start
   */
  recordSessionStart(
    sessionId: string,
    userId?: string,
    metadata?: Record<string, any>,
  ) {
    const session = {
      sessionId,
      userId,
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      featuresUsed: new Set<string>(),
      deviceType: metadata?.deviceType,
      browser: metadata?.browser,
      referrer: metadata?.referrer,
    };

    this.sessionData.set(sessionId, session);

    metrics.incrementCounter("session_started_total", 1, {
      ...(userId && { user_id: userId }),
      ...(metadata?.deviceType && { device_type: metadata.deviceType }),
      ...metadata,
    });

    logger.info("Session started", {
      sessionId,
      userId,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Record session end
   */
  recordSessionEnd(sessionId: string, metadata?: Record<string, any>) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    const duration = Date.now() - session.startTime;

    metrics.recordHistogram("session_duration_seconds", duration / 1000, {
      ...(session.userId && { user_id: session.userId }),
      ...(session.deviceType && { device_type: session.deviceType }),
      page_views: session.pageViews.toString(),
      interactions: session.interactions.toString(),
      features_used: Array.from(session.featuresUsed).join(","),
      ...metadata,
    });

    this.sessionData.delete(sessionId);

    logger.info("Session ended", {
      sessionId,
      duration,
      pageViews: session.pageViews,
      interactions: session.interactions,
      featuresUsed: Array.from(session.featuresUsed),
      ...metadata,
    });
  }

  /**
   * Record page view
   */
  recordPageView(
    sessionId: string,
    page: string,
    metadata?: Record<string, any>,
  ) {
    const session = this.sessionData.get(sessionId);
    if (session) {
      session.pageViews++;
    }

    metrics.incrementCounter("page_views_total", 1, {
      page,
      session_id: sessionId,
      ...(session?.userId && { user_id: session.userId }),
      ...metadata,
    });

    logger.info("Page view recorded", {
      sessionId,
      page,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Record user interaction
   */
  recordInteraction(
    sessionId: string,
    interactionType: string,
    element?: string,
    metadata?: Record<string, any>,
  ) {
    const session = this.sessionData.get(sessionId);
    if (session) {
      session.interactions++;
    }

    metrics.incrementCounter("user_interactions_total", 1, {
      interaction_type: interactionType,
      ...(element && { element }),
      session_id: sessionId,
      ...(session?.userId && { user_id: session.userId }),
      ...metadata,
    });

    logger.info("User interaction recorded", {
      sessionId,
      interactionType,
      element,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Record feature usage
   */
  recordFeatureUsage(
    sessionId: string,
    feature: string,
    metadata?: Record<string, any>,
  ) {
    const session = this.sessionData.get(sessionId);
    if (session) {
      session.featuresUsed.add(feature);
    }

    const currentUsage = this.featureUsage.get(feature) || 0;
    this.featureUsage.set(feature, currentUsage + 1);

    metrics.incrementCounter("feature_usage_total", 1, {
      feature,
      session_id: sessionId,
      ...(session?.userId && { user_id: session.userId }),
      ...metadata,
    });

    logger.info("Feature usage recorded", {
      sessionId,
      feature,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  /**
   * Get UX metrics summary
   */
  getUXMetricsSummary() {
    const activeSessions = this.sessionData.size;
    const topFeatures = Array.from(this.featureUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return {
      activeSessions,
      totalFeaturesUsed: this.featureUsage.size,
      topFeatures,
      timestamp: Date.now(),
    };
  }
}

/**
 * Advanced Monitoring System - Main Coordinator
 */
export class AdvancedMonitoringSystem {
  private businessKPIs: BusinessKPIs;
  private technicalMetrics: TechnicalMetrics;
  private userExperienceMetrics: UserExperienceMetrics;
  private isInitialized: boolean = false;

  constructor() {
    this.businessKPIs = new BusinessKPIs();
    this.technicalMetrics = new TechnicalMetrics();
    this.userExperienceMetrics = new UserExperienceMetrics();
  }

  /**
   * Initialize the monitoring system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info("Advanced monitoring system initialized");
    this.isInitialized = true;
  }

  /**
   * Record business KPI
   */
  recordBusinessKPI(
    name: string,
    value: number,
    metadata?: Record<string, any>,
  ) {
    this.businessKPIs.recordKPI(name, value, metadata);
  }

  /**
   * Record Core Web Vitals
   */
  recordCoreWebVitals(
    vitals: {
      lcp?: number;
      cls?: number;
      inp?: number;
      fid?: number;
      ttfb?: number;
    },
    metadata?: Record<string, any>,
  ) {
    this.technicalMetrics.recordCoreWebVitals(vitals, metadata);
  }

  /**
   * Record API performance
   */
  recordAPIPerformance(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    metadata?: Record<string, any>,
  ) {
    this.technicalMetrics.recordAPIPerformance(
      endpoint,
      method,
      responseTime,
      statusCode,
      metadata,
    );
  }

  /**
   * Record user engagement
   */
  recordUserEngagement(
    action: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>,
  ) {
    this.technicalMetrics.recordUserEngagement(
      action,
      userId,
      sessionId,
      metadata,
    );
  }

  /**
   * Record infrastructure metrics
   */
  recordInfrastructureMetrics(
    metricsData: {
      cpuUsage?: number;
      memoryUsage?: number;
      diskUsage?: number;
      networkIn?: number;
      networkOut?: number;
      activeConnections?: number;
    },
    metadata?: Record<string, any>,
  ) {
    this.technicalMetrics.recordInfrastructureMetrics(metricsData, metadata);
  }

  /**
   * Record session start
   */
  recordSessionStart(
    sessionId: string,
    userId?: string,
    metadata?: Record<string, any>,
  ) {
    this.userExperienceMetrics.recordSessionStart(sessionId, userId, metadata);
  }

  /**
   * Record session end
   */
  recordSessionEnd(sessionId: string, metadata?: Record<string, any>) {
    this.userExperienceMetrics.recordSessionEnd(sessionId, metadata);
  }

  /**
   * Record page view
   */
  recordPageView(
    sessionId: string,
    page: string,
    metadata?: Record<string, any>,
  ) {
    this.userExperienceMetrics.recordPageView(sessionId, page, metadata);
  }

  /**
   * Record user interaction
   */
  recordInteraction(
    sessionId: string,
    interactionType: string,
    element?: string,
    metadata?: Record<string, any>,
  ) {
    this.userExperienceMetrics.recordInteraction(
      sessionId,
      interactionType,
      element,
      metadata,
    );
  }

  /**
   * Record feature usage
   */
  recordFeatureUsage(
    sessionId: string,
    feature: string,
    metadata?: Record<string, any>,
  ) {
    this.userExperienceMetrics.recordFeatureUsage(sessionId, feature, metadata);
  }

  /**
   * Get comprehensive monitoring report
   */
  getMonitoringReport() {
    return {
      businessKPIs: this.businessKPIs.getKPIsSummary(),
      technicalMetrics: this.technicalMetrics.getTechnicalMetricsSummary(),
      userExperience: this.userExperienceMetrics.getUXMetricsSummary(),
      timestamp: Date.now(),
      systemHealth: "operational",
    };
  }

  /**
   * Export metrics data for analysis
   */
  exportMetricsData() {
    return {
      businessKPIs: this.businessKPIs.getKPIsSummary(),
      userExperience: this.userExperienceMetrics.getUXMetricsSummary(),
      exportTimestamp: Date.now(),
    };
  }
}

// ===== SINGLETON INSTANCE =====

let monitoringSystemInstance: AdvancedMonitoringSystem | null = null;

export function getAdvancedMonitoringSystem(): AdvancedMonitoringSystem {
  if (!monitoringSystemInstance) {
    monitoringSystemInstance = new AdvancedMonitoringSystem();
  }
  return monitoringSystemInstance;
}

export function destroyMonitoringSystem(): void {
  if (monitoringSystemInstance) {
    // Cleanup if needed
    monitoringSystemInstance = null;
  }
}
