"use client";

/**
 * Lazy Loading Simplified System - Versão Econômica e Eficaz
 * 4 componentes inteligentes que entregam 80% dos benefícios com 20% da complexidade
 */

import { logger } from "../observability/logger";
import { smartThresholdManager, AdaptiveThresholds } from "./core/smart-threshold-manager";
import { intelligentCacheManager } from "./core/intelligent-cache-manager";
import { performanceMonitor } from "./core/performance-monitor";

/**
 * Configuração unificada do sistema simplificado
 */
export interface SimplifiedSystemConfig {
  // Smart Threshold Manager
  enableAdaptiveThresholds: boolean;

  // Intelligent Cache Manager
  enableCaching: boolean;
  enablePredictiveCache: boolean;
  cacheMaxSize: number;
  cacheMaxMemory: number;

  // Context-Aware Loader
  enableAdaptiveLoading: boolean;
  maxConcurrentLoads: number;

  // Performance Monitor
  enableMonitoring: boolean;
  enableAlerts: boolean;

  // Sistema geral
  debugMode: boolean;
  samplingRate: number; // 0-1
}

/**
 * Resultado unificado das operações
 */
export interface SystemResult<T = any> {
  success: boolean;
  data?: T;
  loadTime: number;
  cached: boolean;
  strategy: string;
  context: Record<string, any>;
  performance: {
    lcp?: number;
    cls?: number;
    inp?: number;
  };
}

/**
 * Sistema Simplificado Principal
 */
export class SimplifiedLazyLoadingSystem {
  private static instance: SimplifiedLazyLoadingSystem;
  private config: SimplifiedSystemConfig;
  private initialized = false;

  constructor(config: SimplifiedSystemConfig = SimplifiedLazyLoadingSystem.getDefaultConfig()) {
    this.config = config;
  }

  static getInstance(): SimplifiedLazyLoadingSystem {
    if (!SimplifiedLazyLoadingSystem.instance) {
      SimplifiedLazyLoadingSystem.instance = new SimplifiedLazyLoadingSystem();
    }
    return SimplifiedLazyLoadingSystem.instance;
  }

  /**
   * Configuração padrão - otimizada para economia
   */
  static getDefaultConfig(): SimplifiedSystemConfig {
    return {
      enableAdaptiveThresholds: true,
      enableCaching: true,
      enablePredictiveCache: true,
      cacheMaxSize: 100,
      cacheMaxMemory: 5 * 1024 * 1024, // 5MB
      enableAdaptiveLoading: true,
      maxConcurrentLoads: 3,
      enableMonitoring: true,
      enableAlerts: true,
      debugMode: false,
      samplingRate: 1.0,
    };
  }

  /**
   * Inicializa o sistema simplificado
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const startTime = Date.now();

    try {
      logger.info("Initializing Simplified Lazy Loading System", {
        event: "ll_simplified_system_initializing",
        ll_config: this.config,
      });

      // Inicializa componentes na ordem correta
      await smartThresholdManager.getAdaptiveThresholds(); // Força inicialização
      intelligentCacheManager.getStats(); // Força inicialização
      contextAwareLoader.getStats(); // Força inicialização

      if (this.config.enableMonitoring) {
        performanceMonitor.initialize();
      }

      this.initialized = true;

      const initTime = Date.now() - startTime;

      logger.info("Simplified Lazy Loading System initialized", {
        event: "ll_simplified_system_initialized",
        ll_init_time: initTime,
        ll_components: ["SmartThresholdManager", "IntelligentCacheManager", "ContextAwareLoader", "PerformanceMonitor"],
      });

    } catch (error) {
      logger.error("Failed to initialize Simplified Lazy Loading System", {
        event: "ll_simplified_system_init_error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Carrega conteúdo de forma inteligente e adaptativa
   */
  async load<T>(
    key: string,
    loader: () => Promise<T>,
    options: {
      sectionType?: "hero" | "content" | "footer";
      priority?: "hero" | "early" | "deferred";
      force?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<SystemResult<T>> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Carrega via Context-Aware Loader
      const result = await contextAwareLoader.load(key, loader, options.sectionType, {
        priority: options.priority,
        force: options.force,
        metadata: options.metadata,
      });

      // Registra métricas de performance se habilitado
      if (this.config.enableMonitoring && this.shouldSample()) {
        performanceMonitor.recordLoadingMetric({
          sectionId: key,
          loadTime: result.loadTime,
          strategy: result.strategy.method,
          success: result.success,
          cached: result.cached,
          retryCount: result.retryCount,
          context: result.context,
        });
      }

      // Obtém métricas de performance atuais
      const performanceMetrics = this.config.enableMonitoring ?
        performanceMonitor.getStats().webVitals?.recentMetrics?.[0] : {};

      const systemResult: SystemResult<T> = {
        success: result.success,
        data: result.data,
        loadTime: result.loadTime,
        cached: result.cached,
        strategy: result.strategy.method,
        context: result.context,
        performance: {
          lcp: performanceMetrics?.lcp,
          cls: performanceMetrics?.cls,
          inp: performanceMetrics?.inp,
        },
      };

      if (this.config.debugMode) {
        logger.debug("Content loaded via Simplified System", {
          event: "ll_simplified_system_load_complete",
          ll_key: key,
          ll_result: systemResult,
        });
      }

      return systemResult;

    } catch (error) {
      const loadTime = Date.now() - startTime;

      logger.error("Load failed in Simplified System", {
        event: "ll_simplified_system_load_error",
        ll_key: key,
        ll_load_time: loadTime,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        loadTime,
        cached: false,
        strategy: "error",
        context: {},
        performance: {},
      };
    }
  }

  /**
   * Pré-carrega conteúdo baseado em padrões
   */
  async preload(key: string): Promise<void> {
    if (!this.config.enablePredictiveCache) return;

    try {
      await contextAwareLoader.preloadPredictive(key);

      if (this.config.debugMode) {
        logger.debug("Predictive preload initiated", {
          event: "ll_simplified_system_preload_initiated",
          ll_key: key,
        });
      }
    } catch (error) {
      logger.debug("Predictive preload failed", {
        event: "ll_simplified_system_preload_error",
        ll_key: key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obtém thresholds adaptativos atuais
   */
  async getAdaptiveThresholds(): Promise<AdaptiveThresholds> {
    return await smartThresholdManager.getAdaptiveThresholds();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return intelligentCacheManager.getStats();
  }

  /**
   * Obtém estatísticas do loader
   */
  getLoaderStats() {
    return contextAwareLoader.getStats();
  }

  /**
   * Gera relatório de performance
   */
  generatePerformanceReport(hoursBack = 1): any {
    if (!this.config.enableMonitoring) return null;
    return performanceMonitor.generateReport(hoursBack);
  }

  /**
   * Obtém estatísticas completas do sistema
   */
  getSystemStats() {
    return {
      initialized: this.initialized,
      config: this.config,
      thresholds: smartThresholdManager.getMetrics(),
      cache: this.getCacheStats(),
      loader: this.getLoaderStats(),
      performance: this.config.enableMonitoring ? performanceMonitor.getStats() : null,
      timestamp: Date.now(),
    };
  }

  /**
   * Otimiza configurações baseado no uso
   */
  async optimizeConfig(): Promise<SimplifiedSystemConfig> {
    const currentStats = this.getSystemStats();
    const newConfig = { ...this.config };

    // Otimiza cache baseado no uso
    if (currentStats.cache.hitRate < 0.5 && currentStats.cache.size < 50) {
      newConfig.cacheMaxSize = Math.min(currentStats.cache.size * 2, 200);
    }

    // Otimiza loader baseado na concorrência
    const queueUtilization = currentStats.loader.queueStats.utilization;
    if (queueUtilization > 0.8) {
      newConfig.maxConcurrentLoads = Math.min(currentStats.loader.queueStats.maxConcurrent + 1, 6);
    } else if (queueUtilization < 0.3 && currentStats.loader.queueStats.maxConcurrent > 2) {
      newConfig.maxConcurrentLoads = Math.max(currentStats.loader.queueStats.maxConcurrent - 1, 2);
    }

    // Otimiza sampling se houver muitos dados
    const totalMetrics = currentStats.loader.historyStats.reduce((sum, stat) => sum + stat.totalLoads, 0);
    if (totalMetrics > 10000) {
      newConfig.samplingRate = Math.max(newConfig.samplingRate * 0.8, 0.1);
    }

    logger.info("System config optimized", {
      event: "ll_simplified_system_config_optimized",
      ll_old_config: this.config,
      ll_new_config: newConfig,
    });

    this.config = newConfig;
    return newConfig;
  }

  /**
   * Limpa caches e histórico
   */
  clearCaches(): void {
    intelligentCacheManager.clear();
    contextAwareLoader.clearHistory();

    logger.info("System caches cleared", {
      event: "ll_simplified_system_caches_cleared",
    });
  }

  /**
   * Para o sistema e limpa recursos
   */
  destroy(): void {
    if (this.config.enableMonitoring) {
      performanceMonitor.destroy();
    }

    intelligentCacheManager.destroy();
    this.clearCaches();

    this.initialized = false;

    logger.info("Simplified Lazy Loading System destroyed", {
      event: "ll_simplified_system_destroyed",
    });
  }

  /**
   * Verifica se deve amostrar baseado na taxa configurada
   */
  private shouldSample(): boolean {
    return Math.random() <= this.config.samplingRate;
  }
}

// Export singleton e funções utilitárias
export const simplifiedLazyLoadingSystem = SimplifiedLazyLoadingSystem.getInstance();

/**
 * Função utilitária para carregamento rápido
 */
export async function smartLoad<T>(
  key: string,
  loader: () => Promise<T>,
  options?: Parameters<SimplifiedLazyLoadingSystem["load"]>[2]
): Promise<SystemResult<T>> {
  return simplifiedLazyLoadingSystem.load(key, loader, options);
}

/**
 * Hook React para carregamento inteligente (se usar React)
 */
export function useSmartLoad<T>(
  key: string,
  loader: () => Promise<T>,
  options?: Parameters<SimplifiedLazyLoadingSystem["load"]>[2]
) {
  // Em um ambiente React real, isso seria um hook
  // Por enquanto, retorna uma função para carregamento
  return {
    load: () => smartLoad(key, loader, options),
    preload: () => simplifiedLazyLoadingSystem.preload(key),
  };
}

/**
 * Utilitários de configuração
 */
export const SystemUtils = {
  /**
   * Cria configuração otimizada para dispositivos móveis
   */
  createMobileConfig(): SimplifiedSystemConfig {
    return {
      ...SimplifiedLazyLoadingSystem.getDefaultConfig(),
      maxConcurrentLoads: 2, // Menos concorrência em mobile
      cacheMaxSize: 50, // Cache menor
      cacheMaxMemory: 2 * 1024 * 1024, // 2MB
      samplingRate: 0.5, // Menos amostragem
    };
  },

  /**
   * Cria configuração otimizada para desktop
   */
  createDesktopConfig(): SimplifiedSystemConfig {
    return {
      ...SimplifiedLazyLoadingSystem.getDefaultConfig(),
      maxConcurrentLoads: 5, // Mais concorrência
      cacheMaxSize: 200, // Cache maior
      cacheMaxMemory: 10 * 1024 * 1024, // 10MB
      samplingRate: 1.0, // Amostragem completa
    };
  },

  /**
   * Cria configuração conservadora para redes lentas
   */
  createSlowNetworkConfig(): SimplifiedSystemConfig {
    return {
      ...SimplifiedLazyLoadingSystem.getDefaultConfig(),
      maxConcurrentLoads: 1, // Concorrência mínima
      enablePredictiveCache: false, // Sem preload preditivo
      cacheMaxSize: 25, // Cache mínimo
      samplingRate: 0.2, // Amostragem mínima
    };
  },
};

/**
 * Constantes e tipos exportados
 */
export type { SimplifiedSystemConfig, SystemResult };
