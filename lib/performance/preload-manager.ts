/**
 * Preload Manager - Sistema inteligente de preload baseado em performance
 * Otimiza LCP e Core Web Vitals através de preload estratégico
 */

import { logger } from "../observability/logger";
import { performanceMonitor } from "../observability/performance-monitor";

export interface PreloadResource {
  url: string;
  type: 'image' | 'font' | 'script' | 'style';
  priority: 'high' | 'medium' | 'low';
  crossOrigin?: boolean;
  integrity?: string;
}

interface PreloadQueueItem extends PreloadResource {
  priorityScore: number;
  resolve: () => void;
  reject: (error: Error) => void;
}

export interface PreloadConfig {
  enabled: boolean;
  maxConcurrentPreloads: number;
  preloadTimeout: number;
  enablePredictivePreload: boolean;
  resourcePriority: Record<string, number>;
}

class PreloadManager {
  private preloadedResources = new Set<string>();
  private preloadQueue: PreloadQueueItem[] = [];
  private activePreloads = 0;
  private config: PreloadConfig;
  private performanceData: Map<string, number> = new Map();

  constructor(config: PreloadConfig = {
    enabled: true,
    maxConcurrentPreloads: 3,
    preloadTimeout: 10000,
    enablePredictivePreload: true,
    resourcePriority: {
      'hero-image': 100,
      'font': 90,
      'critical-css': 80,
      'logo': 70,
      'icon': 50,
    }
  }) {
    this.config = config;
    this.initializePerformanceTracking();
  }

  /**
   * Inicializa rastreamento de performance para decisões de preload
   */
  private initializePerformanceTracking() {
    if (typeof window !== 'undefined') {
      // Track LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcpTime = entry.startTime;
            this.performanceData.set('lcp', lcpTime);

            // Se LCP > 2.5s, reduzir preloads concorrentes
            if (lcpTime > 2500) {
              this.config.maxConcurrentPreloads = Math.max(1, this.config.maxConcurrentPreloads - 1);
            }
          }
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Track navigation timing
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.performanceData.set('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.performanceData.set('loadComplete', navigation.loadEventEnd - navigation.loadEventStart);
        }
      });
    }
  }

  /**
   * Adiciona recurso à fila de preload
   */
  preload(resource: PreloadResource): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.enabled) {
        resolve();
        return;
      }

      if (this.preloadedResources.has(resource.url)) {
        resolve();
        return;
      }

      // Calcular prioridade baseada em dados de performance
      const priorityScore = this.calculatePriorityScore(resource);

      // Inserir na fila ordenada por prioridade
      const queueItem = { ...resource, priorityScore, resolve, reject };
      const insertIndex = this.preloadQueue.findIndex(item => item.priorityScore < priorityScore);
      if (insertIndex === -1) {
        this.preloadQueue.push(queueItem);
      } else {
        this.preloadQueue.splice(insertIndex, 0, queueItem);
      }

      this.processQueue();
    });
  }

  /**
   * Calcula score de prioridade baseado em performance e configuração
   */
  private calculatePriorityScore(resource: PreloadResource): number {
    let score = 0;

    // Base priority from config
    score += this.config.resourcePriority[resource.url] || 0;

    // Performance-based adjustments
    const lcpTime = this.performanceData.get('lcp') || 0;
    if (lcpTime > 2500 && resource.priority === 'high') {
      score -= 20; // Reduzir prioridade de recursos high se LCP estiver ruim
    }

    // Device capability adjustments
    if (typeof navigator !== 'undefined') {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          score -= 30; // Muito lento, reduzir drasticamente
        } else if (connection.effectiveType === '3g') {
          score -= 15; // Lento, reduzir moderadamente
        }
      }

      // Memory constraints
      if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
        score -= 10; // Dispositivo com pouca memória
      }
    }

    return Math.max(0, score);
  }

  /**
   * Processa fila de preloads respeitando limite concorrente
   */
  private async processQueue() {
    while (
      this.preloadQueue.length > 0 &&
      this.activePreloads < this.config.maxConcurrentPreloads
    ) {
      const item = this.preloadQueue.shift();
      if (!item) continue;

      this.activePreloads++;
      this.preloadedResources.add(item.url);

      try {
        await this.loadResource(item);
        item.resolve();
      } catch (error) {
        logger.warn(`Failed to preload resource: ${item.url}`, { error });
        item.reject(error);
      } finally {
        this.activePreloads--;
        this.processQueue();
      }
    }
  }

  /**
   * Carrega um recurso específico
   */
  private loadResource(resource: PreloadResource): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.type;

      if (resource.crossOrigin) {
        link.crossOrigin = 'anonymous';
      }

      if (resource.integrity) {
        link.integrity = resource.integrity;
      }

      // Timeout para evitar travamentos
      const timeout = setTimeout(() => {
        link.remove();
        reject(new Error(`Preload timeout for ${resource.url}`));
      }, this.config.preloadTimeout);

      link.onload = () => {
        clearTimeout(timeout);
        performanceMonitor.recordMetric('preload_success', 1, {
          resource: resource.url,
          type: resource.type,
          priority: resource.priority
        });
        resolve();
      };

      link.onerror = () => {
        clearTimeout(timeout);
        performanceMonitor.recordMetric('preload_error', 1, {
          resource: resource.url,
          type: resource.type,
          priority: resource.priority
        });
        reject(new Error(`Failed to preload ${resource.url}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Preload inteligente baseado no contexto da página
   */
  preloadCriticalResources(pageType: string) {
    const criticalResources: PreloadResource[] = [];

    // Sempre preload do logo
    criticalResources.push({
      url: '/images/logo.webp',
      type: 'image',
      priority: 'high'
    });

    // Preload baseado no tipo de página
    switch (pageType) {
      case 'landing':
        criticalResources.push(
          { url: '/fonts/inter-var.woff2', type: 'font', priority: 'high', crossOrigin: true },
          { url: '/images/hero-bg.webp', type: 'image', priority: 'high' },
          { url: '/css/critical.css', type: 'style', priority: 'high' }
        );
        break;

      case 'product':
        criticalResources.push(
          { url: '/images/product-hero.webp', type: 'image', priority: 'high' },
          { url: '/css/product.css', type: 'style', priority: 'medium' }
        );
        break;

      case 'pricing':
        criticalResources.push(
          { url: '/images/pricing-bg.webp', type: 'image', priority: 'high' },
          { url: '/css/pricing.css', type: 'style', priority: 'medium' }
        );
        break;
    }

    // Executar preloads
    criticalResources.forEach(resource => {
      this.preload(resource).catch(error => {
        logger.warn(`Critical resource preload failed: ${resource.url}`, { error });
      });
    });
  }

  /**
   * Preload preditivo baseado em comportamento do usuário
   */
  enablePredictivePreload() {
    if (!this.config.enablePredictivePreload || typeof window === 'undefined') {
      return;
    }

    // Detectar intenção do usuário através de scroll e hover
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollDepth = window.scrollY / document.documentElement.scrollHeight;

        // Se usuário rolou mais de 30%, preload recursos abaixo da dobra
        if (scrollDepth > 0.3) {
          this.preloadBelowFoldResources();
        }
      }, 100);
    };

    // Detectar hover em links de navegação
    const handleLinkHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
          this.predictivePreloadForRoute(href);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseover', handleLinkHover);
  }

  /**
   * Preload recursos abaixo da dobra
   */
  private preloadBelowFoldResources() {
    // Implementar lógica específica da aplicação
    // Por exemplo: preload de seções como features, testimonials, pricing
    logger.info('Preloading below-fold resources');
  }

  /**
   * Preload preditivo para rota específica
   */
  private predictivePreloadForRoute(route: string) {
    // Implementar lógica baseada em análise de rotas comuns
    logger.info(`Predictive preload for route: ${route}`);
  }

  /**
   * Obtém estatísticas de preload
   */
  getStats() {
    return {
      preloadedCount: this.preloadedResources.size,
      queueLength: this.preloadQueue.length,
      activePreloads: this.activePreloads,
      performanceData: Object.fromEntries(this.performanceData)
    };
  }
}

// Singleton instance
export const preloadManager = new PreloadManager();

// Export default para compatibilidade
export default preloadManager;

