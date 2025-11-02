/**
 * Core Web Vitals Monitor - Monitoramento específico para CWV
 * LCP, FID, CLS com foco em lazy loading optimization
 */

import { logger } from "../observability/logger";
import { performanceMonitor } from "../observability/performance-monitor";

export interface CWVMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
}

export interface CWVThresholds {
  lcp: { good: number; poor: number }; // ms
  fid: { good: number; poor: number }; // ms
  cls: { good: number; poor: number }; // score
}

export interface CWVReport {
  metrics: CWVMetrics;
  scores: {
    lcp: 'good' | 'needs-improvement' | 'poor';
    fid: 'good' | 'needs-improvement' | 'poor';
    cls: 'good' | 'needs-improvement' | 'poor';
  };
  overall: 'good' | 'needs-improvement' | 'poor';
  recommendations: string[];
  timestamp: number;
}

class CWVMonitor {
  private metrics: CWVMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  };

  private observers: PerformanceObserver[] = [];
  private thresholds: CWVThresholds;
  private isMonitoring = false;

  constructor(thresholds: CWVThresholds = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 }
  }) {
    this.thresholds = thresholds;
  }

  /**
   * Inicia monitoramento de Core Web Vitals
   */
  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.initializeObservers();

    logger.info('CWV Monitor started');
  }

  /**
   * Para monitoramento
   */
  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;

    logger.info('CWV Monitor stopped');
  }

  /**
   * Inicializa todos os observers de performance
   */
  private initializeObservers(): void {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeNavigationTiming();
  }

  /**
   * Monitora Largest Contentful Paint (LCP)
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;

        this.metrics.lcp = lastEntry.startTime;

        // Alertar se LCP estiver ruim
        if (lastEntry.startTime > this.thresholds.lcp.poor) {
          logger.warn('Poor LCP detected', {
            lcp: lastEntry.startTime,
            element: lastEntry.element?.tagName,
            url: lastEntry.url
          });
        }

        performanceMonitor.recordMetric('lcp', lastEntry.startTime, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe LCP', { error });
    }
  }

  /**
   * Monitora First Input Delay (FID)
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as any; // FID entry type
          this.metrics.fid = fidEntry.processingStart - entry.startTime;

          if (this.metrics.fid > this.thresholds.fid.poor) {
            logger.warn('Poor FID detected', {
              fid: this.metrics.fid,
              inputType: fidEntry.name
            });
          }

          performanceMonitor.recordMetric('fid', this.metrics.fid, {
            inputType: fidEntry.name
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe FID', { error });
    }
  }

  /**
   * Monitora Cumulative Layout Shift (CLS)
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as any; // LayoutShift entry type
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });

        this.metrics.cls = clsValue;

        // Alertar se CLS estiver ruim
        if (clsValue > this.thresholds.cls.poor) {
          logger.warn('Poor CLS detected', { cls: clsValue });
        }

        performanceMonitor.recordMetric('cls', clsValue);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe CLS', { error });
    }
  }

  /**
   * Monitora First Contentful Paint (FCP)
   */
  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fcp = entry.startTime;
          performanceMonitor.recordMetric('fcp', entry.startTime);
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Failed to observe FCP', { error });
    }
  }

  /**
   * Monitora Navigation Timing para TTFB
   */
  private observeNavigationTiming(): void {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        performanceMonitor.recordMetric('ttfb', this.metrics.ttfb);
      }
    } catch (error) {
      logger.error('Failed to observe navigation timing', { error });
    }
  }

  /**
   * Gera relatório completo de Core Web Vitals
   */
  generateReport(): CWVReport {
    const scores = this.calculateScores();
    const recommendations = this.generateRecommendations(scores);

    return {
      metrics: { ...this.metrics },
      scores,
      overall: this.calculateOverallScore(scores),
      recommendations,
      timestamp: Date.now()
    };
  }

  /**
   * Calcula scores individuais para cada métrica
   */
  private calculateScores(): CWVReport['scores'] {
    return {
      lcp: this.calculateScore('lcp', this.metrics.lcp),
      fid: this.calculateScore('fid', this.metrics.fid),
      cls: this.calculateScore('cls', this.metrics.cls)
    };
  }

  /**
   * Calcula score para uma métrica individual
   */
  private calculateScore(metric: keyof CWVThresholds, value: number | null): 'good' | 'needs-improvement' | 'poor' {
    if (value === null) return 'needs-improvement';

    const threshold = this.thresholds[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Calcula score geral baseado nas métricas individuais
   */
  private calculateOverallScore(scores: CWVReport['scores']): 'good' | 'needs-improvement' | 'poor' {
    const scoreValues = Object.values(scores);
    const poorCount = scoreValues.filter(score => score === 'poor').length;
    const needsImprovementCount = scoreValues.filter(score => score === 'needs-improvement').length;

    if (poorCount > 0) return 'poor';
    if (needsImprovementCount > 1) return 'poor';
    if (needsImprovementCount === 1) return 'needs-improvement';
    return 'good';
  }

  /**
   * Gera recomendações baseado nos scores
   */
  private generateRecommendations(scores: CWVReport['scores']): string[] {
    const recommendations: string[] = [];

    if (scores.lcp === 'poor') {
      recommendations.push(
        'LCP ruim detectado. Considere:',
        '- Otimizar imagens hero com preload',
        '- Reduzir tempo de resposta do servidor',
        '- Remover recursos bloqueantes de renderização',
        '- Implementar lazy loading mais agressivo'
      );
    } else if (scores.lcp === 'needs-improvement') {
      recommendations.push(
        'LCP pode ser melhorado:',
        '- Usar formatos de imagem modernos (WebP/AVIF)',
        '- Implementar preload para recursos críticos',
        '- Otimizar CSS crítico'
      );
    }

    if (scores.fid === 'poor') {
      recommendations.push(
        'FID ruim detectado. Considere:',
        '- Quebrar tarefas longas em chunks menores',
        '- Usar Web Workers para processamento pesado',
        '- Minimizar uso de JavaScript no thread principal',
        '- Implementar virtual scrolling para listas grandes'
      );
    } else if (scores.fid === 'needs-improvement') {
      recommendations.push(
        'FID pode ser melhorado:',
        '- Otimizar event handlers',
        '- Reduzir complexidade de componentes',
        '- Implementar code splitting mais granular'
      );
    }

    if (scores.cls === 'poor') {
      recommendations.push(
        'CLS ruim detectado. Considere:',
        '- Definir dimensões explícitas para imagens/videos',
        '- Evitar inserção de conteúdo acima do fold',
        '- Usar CSS transforms ao invés de mudanças de layout',
        '- Implementar skeleton loaders com dimensões fixas'
      );
    } else if (scores.cls === 'needs-improvement') {
      recommendations.push(
        'CLS pode ser melhorado:',
        '- Reservar espaço para conteúdo dinâmico',
        '- Usar aspect-ratio para imagens',
        '- Evitar mudanças de layout durante carregamento'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Todas as Core Web Vitals estão boas! Continue monitorando para manter a performance.');
    }

    return recommendations;
  }

  /**
   * Registra evento personalizado relacionado a CWV
   */
  recordCWVEvent(eventType: string, data: Record<string, any>): void {
    performanceMonitor.recordMetric(`cwv_${eventType}`, 1, data);

    logger.info(`CWV Event: ${eventType}`, data);
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): CWVMetrics {
    return { ...this.metrics };
  }

  /**
   * Reseta métricas (útil para testes)
   */
  reset(): void {
    this.metrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null
    };
  }
}

// Singleton instance
export const cwvMonitor = new CWVMonitor();

// Export default para compatibilidade
export default cwvMonitor;
