"use client";

import { logger } from "../../observability/logger";

/**
 * Performance Monitor - Versão Simplificada e Econômica
 * Monitora performance e alerta sobre problemas
 */

export interface PerformanceMetrics {
  timestamp: number;
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  inp: number; // Interaction to Next Paint
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
}

export interface LoadingMetrics {
  sectionId: string;
  loadTime: number;
  strategy: string;
  success: boolean;
  cached: boolean;
  retryCount: number;
  context: Record<string, any>;
}

export interface AlertCondition {
  id: string;
  name: string;
  description: string;
  metric: keyof PerformanceMetrics | keyof LoadingMetrics;
  operator: ">" | "<" | ">=" | "<=" | "==";
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  cooldownMs: number; // Evita spam de alertas
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  condition: AlertCondition;
  actualValue: number;
  context: Record<string, any>;
  resolved: boolean;
  resolvedAt?: number;
}

export interface MonitorConfig {
  enableWebVitals: boolean;
  enableLoadingMetrics: boolean;
  enableAlerts: boolean;
  alertCooldownMs: number;
  metricsRetentionMs: number; // Quanto tempo manter métricas
  samplingRate: number; // 0-1, taxa de amostragem
}

export interface PerformanceReport {
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalRequests: number;
    successRate: number;
    averageLoadTime: number;
    p95LoadTime: number;
    cacheHitRate: number;
  };
  webVitals: {
    lcp: { p50: number; p95: number; p99: number };
    cls: { p50: number; p95: number; p99: number };
    inp: { p50: number; p95: number; p99: number };
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
}

/**
 * Web Vitals Collector - Coleta métricas do Core Web Vitals
 */
class WebVitalsCollector {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Inicia coleta de Web Vitals
   */
  startCollection(): void {
    if (typeof window === "undefined" || !window.PerformanceObserver) {
      logger.warn("PerformanceObserver not supported", {
        event: "ll_performance_monitor_web_vitals_not_supported",
      });
      return;
    }

    this.setupLCPObserver();
    this.setupCLSObserver();
    this.setupINPObserver();
    this.setupFCPObserver();
    this.setupNavigationObserver();

    logger.info("Web Vitals collection started", {
      event: "ll_performance_monitor_web_vitals_started",
    });
  }

  /**
   * Para coleta
   */
  stopCollection(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * LCP Observer
   */
  private setupLCPObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          this.recordMetric({
            lcp: lastEntry.startTime,
          });
        }
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug("LCP observer failed", {
        event: "ll_performance_monitor_lcp_observer_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * CLS Observer
   */
  private setupCLSObserver(): void {
    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        this.recordMetric({
          cls: clsValue,
        });
      });

      observer.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug("CLS observer failed", {
        event: "ll_performance_monitor_cls_observer_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * INP Observer
   */
  private setupINPObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        let maxINP = 0;

        for (const entry of entries) {
          if (entry.interactionId && entry.duration > maxINP) {
            maxINP = entry.duration;
          }
        }

        if (maxINP > 0) {
          this.recordMetric({
            inp: maxINP,
          });
        }
      });

      observer.observe({ entryTypes: ["event"] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug("INP observer failed", {
        event: "ll_performance_monitor_inp_observer_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * FCP Observer
   */
  private setupFCPObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        const fcpEntry = entries.find(entry => entry.name === "first-contentful-paint");

        if (fcpEntry) {
          this.recordMetric({
            fcp: fcpEntry.startTime,
          });
        }
      });

      observer.observe({ entryTypes: ["paint"] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug("FCP observer failed", {
        event: "ll_performance_monitor_fcp_observer_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Navigation Timing Observer
   */
  private setupNavigationObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        const navEntry = entries.find(entry => entry.entryType === "navigation");

        if (navEntry) {
          this.recordMetric({
            ttfb: navEntry.responseStart - navEntry.requestStart,
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          });
        }
      });

      observer.observe({ entryTypes: ["navigation"] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug("Navigation observer failed", {
        event: "ll_performance_monitor_navigation_observer_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Registra uma métrica
   */
  private recordMetric(partialMetrics: Partial<PerformanceMetrics>): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      lcp: partialMetrics.lcp || 0,
      cls: partialMetrics.cls || 0,
      inp: partialMetrics.inp || 0,
      fcp: partialMetrics.fcp || 0,
      ttfb: partialMetrics.ttfb || 0,
      domContentLoaded: partialMetrics.domContentLoaded || 0,
      loadComplete: partialMetrics.loadComplete || 0,
    };

    this.metrics.push(metrics);

    // Mantém apenas últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    logger.debug("Performance metrics recorded", {
      event: "ll_performance_monitor_metrics_recorded",
      ll_metrics: metrics,
    });
  }

  /**
   * Obtém métricas recentes
   */
  getRecentMetrics(limit = 10): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Calcula percentis
   */
  calculatePercentiles(values: number[]): { p50: number; p95: number; p99: number } {
    if (values.length === 0) return { p50: 0, p95: 0, p99: 0 };

    const sorted = [...values].sort((a, b) => a - b);

    return {
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    };
  }
}

/**
 * Loading Metrics Collector
 */
class LoadingMetricsCollector {
  private metrics: LoadingMetrics[] = [];

  /**
   * Registra métricas de carregamento
   */
  recordLoadingMetric(metric: LoadingMetrics): void {
    this.metrics.push(metric);

    // Mantém apenas últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    logger.debug("Loading metric recorded", {
      event: "ll_performance_monitor_loading_metric_recorded",
      ll_metric: metric,
    });
  }

  /**
   * Obtém métricas de carregamento recentes
   */
  getRecentMetrics(limit = 50): LoadingMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Calcula estatísticas de carregamento
   */
  getStats(): {
    totalRequests: number;
    successRate: number;
    averageLoadTime: number;
    p95LoadTime: number;
    cacheHitRate: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageLoadTime: 0,
        p95LoadTime: 0,
        cacheHitRate: 0,
      };
    }

    const successful = this.metrics.filter(m => m.success).length;
    const loadTimes = this.metrics.map(m => m.loadTime);
    const cached = this.metrics.filter(m => m.cached).length;

    const sortedLoadTimes = [...loadTimes].sort((a, b) => a - b);

    return {
      totalRequests: this.metrics.length,
      successRate: successful / this.metrics.length,
      averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
      p95LoadTime: sortedLoadTimes[Math.floor(sortedLoadTimes.length * 0.95)] || 0,
      cacheHitRate: cached / this.metrics.length,
    };
  }
}

/**
 * Alert System - Sistema de alertas simples
 */
class AlertSystem {
  private conditions: AlertCondition[] = [];
  private alerts: PerformanceAlert[] = [];
  private lastAlertTimes: Map<string, number> = new Map();

  /**
   * Adiciona condição de alerta
   */
  addCondition(condition: AlertCondition): void {
    this.conditions.push(condition);
  }

  /**
   * Remove condição de alerta
   */
  removeCondition(id: string): boolean {
    const index = this.conditions.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.conditions.splice(index, 1);
    return true;
  }

  /**
   * Avalia condições de alerta
   */
  evaluateAlerts(
    performanceMetrics: PerformanceMetrics,
    loadingStats: any,
    context: Record<string, any> = {}
  ): PerformanceAlert[] {
    const newAlerts: PerformanceAlert[] = [];

    for (const condition of this.conditions) {
      // Verifica cooldown
      const lastAlert = this.lastAlertTimes.get(condition.id) || 0;
      if (Date.now() - lastAlert < condition.cooldownMs) {
        continue;
      }

      // Obtém valor atual da métrica
      let actualValue: number;

      if (condition.metric in performanceMetrics) {
        actualValue = (performanceMetrics as any)[condition.metric];
      } else if (condition.metric in loadingStats) {
        actualValue = (loadingStats as any)[condition.metric];
      } else {
        continue; // Métrica não encontrada
      }

      // Verifica se condição é satisfeita
      let triggered = false;

      switch (condition.operator) {
        case ">": triggered = actualValue > condition.threshold; break;
        case "<": triggered = actualValue < condition.threshold; break;
        case ">=": triggered = actualValue >= condition.threshold; break;
        case "<=": triggered = actualValue <= condition.threshold; break;
        case "==": triggered = actualValue === condition.threshold; break;
      }

      if (triggered) {
        const alert: PerformanceAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          condition,
          actualValue,
          context,
          resolved: false,
        };

        newAlerts.push(alert);
        this.alerts.push(alert);
        this.lastAlertTimes.set(condition.id, Date.now());

        logger.warn("Performance alert triggered", {
          event: "ll_performance_monitor_alert_triggered",
          ll_alert: alert,
        });
      }
    }

    return newAlerts;
  }

  /**
   * Resolve um alerta
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    logger.info("Performance alert resolved", {
      event: "ll_performance_monitor_alert_resolved",
      ll_alert_id: alertId,
    });

    return true;
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Obtém histórico de alertas
   */
  getAlertHistory(limit = 20): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }
}

/**
 * Performance Monitor - Versão Simplificada
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: MonitorConfig;
  private webVitalsCollector: WebVitalsCollector;
  private loadingCollector: LoadingMetricsCollector;
  private alertSystem: AlertSystem;
  private initialized = false;

  constructor(config: MonitorConfig = PerformanceMonitor.getDefaultConfig()) {
    this.config = config;
    this.webVitalsCollector = new WebVitalsCollector();
    this.loadingCollector = new LoadingMetricsCollector();
    this.alertSystem = new AlertSystem();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Configuração padrão
   */
  static getDefaultConfig(): MonitorConfig {
    return {
      enableWebVitals: true,
      enableLoadingMetrics: true,
      enableAlerts: true,
      alertCooldownMs: 30000, // 30 segundos
      metricsRetentionMs: 3600000, // 1 hora
      samplingRate: 1.0, // 100% amostragem
    };
  }

  /**
   * Inicializa o monitor
   */
  initialize(): void {
    if (this.initialized) return;

    // Configura alertas padrão
    this.setupDefaultAlerts();

    // Inicia coleta se habilitado
    if (this.config.enableWebVitals) {
      this.webVitalsCollector.startCollection();
    }

    this.initialized = true;

    logger.info("Performance Monitor initialized", {
      event: "ll_performance_monitor_initialized",
      ll_config: this.config,
    });
  }

  /**
   * Configura alertas padrão
   */
  private setupDefaultAlerts(): void {
    // LCP alto
    this.alertSystem.addCondition({
      id: "lcp_high",
      name: "LCP Muito Alto",
      description: "Largest Contentful Paint acima de 2.5s",
      metric: "lcp",
      operator: ">",
      threshold: 2500,
      severity: "high",
      cooldownMs: 60000, // 1 minuto
    });

    // CLS alto
    this.alertSystem.addCondition({
      id: "cls_high",
      name: "CLS Muito Alto",
      description: "Cumulative Layout Shift acima de 0.1",
      metric: "cls",
      operator: ">",
      threshold: 0.1,
      severity: "high",
      cooldownMs: 60000,
    });

    // INP alto
    this.alertSystem.addCondition({
      id: "inp_high",
      name: "INP Muito Alto",
      description: "Interaction to Next Paint acima de 200ms",
      metric: "inp",
      operator: ">",
      threshold: 200,
      severity: "medium",
      cooldownMs: 60000,
    });

    // Taxa de sucesso baixa
    this.alertSystem.addCondition({
      id: "success_rate_low",
      name: "Taxa de Sucesso Baixa",
      description: "Taxa de sucesso de carregamento abaixo de 90%",
      metric: "successRate",
      operator: "<",
      threshold: 0.9,
      severity: "medium",
      cooldownMs: 120000, // 2 minutos
    });

    // Tempo de carregamento alto
    this.alertSystem.addCondition({
      id: "load_time_high",
      name: "Tempo de Carregamento Alto",
      description: "Tempo médio de carregamento acima de 3s",
      metric: "averageLoadTime",
      operator: ">",
      threshold: 3000,
      severity: "medium",
      cooldownMs: 120000,
    });
  }

  /**
   * Registra métricas de carregamento
   */
  recordLoadingMetric(metric: LoadingMetrics): void {
    if (!this.config.enableLoadingMetrics) return;

    // Amostragem
    if (Math.random() > this.config.samplingRate) return;

    this.loadingCollector.recordLoadingMetric(metric);

    // Avalia alertas
    if (this.config.enableAlerts) {
      const loadingStats = this.loadingCollector.getStats();
      const alerts = this.alertSystem.evaluateAlerts({} as PerformanceMetrics, loadingStats, {
        sectionId: metric.sectionId,
        strategy: metric.strategy,
      });

      if (alerts.length > 0) {
        this.handleAlerts(alerts);
      }
    }
  }

  /**
   * Obtém relatório de performance
   */
  generateReport(hoursBack = 1): PerformanceReport {
    const endTime = Date.now();
    const startTime = endTime - (hoursBack * 3600000);

    const webVitals = this.webVitalsCollector.getRecentMetrics(100);
    const loadingStats = this.loadingCollector.getStats();
    const alerts = this.alertSystem.getAlertHistory(50);

    // Filtra métricas do período
    const periodWebVitals = webVitals.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);

    // Calcula percentis
    const lcpValues = periodWebVitals.map(m => m.lcp).filter(v => v > 0);
    const clsValues = periodWebVitals.map(m => m.cls).filter(v => v > 0);
    const inpValues = periodWebVitals.map(m => m.inp).filter(v => v > 0);

    const recommendations = this.generateRecommendations(loadingStats, periodWebVitals, alerts);

    return {
      period: { start: startTime, end: endTime },
      summary: loadingStats,
      webVitals: {
        lcp: this.webVitalsCollector.calculatePercentiles(lcpValues),
        cls: this.webVitalsCollector.calculatePercentiles(clsValues),
        inp: this.webVitalsCollector.calculatePercentiles(inpValues),
      },
      alerts: alerts.filter(a => a.timestamp >= startTime && a.timestamp <= endTime),
      recommendations,
    };
  }

  /**
   * Gera recomendações baseado nos dados
   */
  private generateRecommendations(
    loadingStats: any,
    webVitals: PerformanceMetrics[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // LCP alto
    const avgLCP = webVitals.reduce((sum, m) => sum + m.lcp, 0) / webVitals.length;
    if (avgLCP > 2500) {
      recommendations.push("LCP alto detectado. Considere otimizar imagens do hero e reduzir JavaScript inicial.");
    }

    // CLS alto
    const avgCLS = webVitals.reduce((sum, m) => sum + m.cls, 0) / webVitals.length;
    if (avgCLS > 0.1) {
      recommendations.push("CLS alto detectado. Reserve espaço para imagens e evite mudanças de layout.");
    }

    // Taxa de sucesso baixa
    if (loadingStats.successRate < 0.9) {
      recommendations.push("Taxa de sucesso baixa. Verifique conectividade e implemente melhor retry logic.");
    }

    // Cache hit rate baixa
    if (loadingStats.cacheHitRate < 0.5) {
      recommendations.push("Cache hit rate baixa. Considere aumentar TTL ou melhorar estratégia de cache.");
    }

    // Tempo de carregamento alto
    if (loadingStats.averageLoadTime > 2000) {
      recommendations.push("Tempo de carregamento alto. Considere lazy loading mais agressivo ou CDN.");
    }

    // Alertas frequentes
    const recentAlerts = alerts.filter(a => Date.now() - a.timestamp < 3600000).length;
    if (recentAlerts > 5) {
      recommendations.push("Muitos alertas recentes. Considere revisar thresholds ou otimizar performance geral.");
    }

    return recommendations;
  }

  /**
   * Trata alertas disparados
   */
  private handleAlerts(alerts: PerformanceAlert[]): void {
    for (const alert of alerts) {
      // Em produção, aqui seria enviado para dashboard, Slack, etc.
      logger.error("Performance alert", {
        event: "ll_performance_monitor_alert_handled",
        ll_alert_id: alert.id,
        ll_condition: alert.condition.name,
        ll_severity: alert.condition.severity,
        ll_actual_value: alert.actualValue,
        ll_threshold: alert.condition.threshold,
      });
    }
  }

  /**
   * Adiciona condição de alerta customizada
   */
  addAlertCondition(condition: AlertCondition): void {
    this.alertSystem.addCondition(condition);
  }

  /**
   * Remove condição de alerta
   */
  removeAlertCondition(id: string): boolean {
    return this.alertSystem.removeCondition(id);
  }

  /**
   * Resolve um alerta
   */
  resolveAlert(alertId: string): boolean {
    return this.alertSystem.resolveAlert(alertId);
  }

  /**
   * Obtém estatísticas do monitor
   */
  getStats() {
    return {
      config: this.config,
      initialized: this.initialized,
      webVitals: {
        recentMetrics: this.webVitalsCollector.getRecentMetrics(5),
      },
      loadingStats: this.loadingCollector.getStats(),
      alerts: {
        active: this.alertSystem.getActiveAlerts(),
        total: this.alertSystem.getAlertHistory().length,
      },
    };
  }

  /**
   * Para o monitor e limpa recursos
   */
  destroy(): void {
    this.webVitalsCollector.stopCollection();
    this.initialized = false;
  }
}

// Export singleton
export const performanceMonitor = PerformanceMonitor.getInstance();
