"use client";

import { logger } from "../../observability/logger";
import { smartThresholdManager, AdaptiveThresholds } from "./smart-threshold-manager";
import { intelligentCacheManager } from "./intelligent-cache-manager";

/**
 * Context-Aware Loader - Versão Simplificada e Econômica
 * Loader inteligente que se adapta ao contexto do usuário
 */

export interface LoadingContext {
  userId?: string;
  sessionId?: string;
  deviceType: "mobile" | "tablet" | "desktop";
  networkType: "slow-2g" | "2g" | "3g" | "4g" | "fast";
  connectionSpeed: "slow" | "medium" | "fast";
  userEngagement: "low" | "medium" | "high";
  batteryLevel?: "low" | "normal";
  timeOfDay: "peak" | "off-peak";
  scrollDepth: number;
  timeSpent: number;
}

export interface LoadingStrategy {
  priority: "hero" | "early" | "deferred";
  method: "eager" | "progressive" | "lazy";
  batchSize: number;
  preloadDistance: number;
  skeletonDuration: number;
  retryStrategy: "immediate" | "exponential" | "none";
  cacheStrategy: "aggressive" | "balanced" | "conservative";
}

export interface LoadingResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  loadTime: number;
  strategy: LoadingStrategy;
  context: LoadingContext;
  cached: boolean;
  retried: boolean;
  retryCount: number;
}

export interface LoaderConfig {
  enableCaching: boolean;
  enablePredictive: boolean;
  enableAdaptive: boolean;
  maxConcurrentLoads: number;
  timeoutMultiplier: number;
  retryEnabled: boolean;
}

/**
 * Context Detector - Versão Simplificada
 */
class ContextDetector {
  static async detectContext(): Promise<LoadingContext> {
    // Usa dados do Smart Threshold Manager
    const thresholds = await smartThresholdManager.getAdaptiveThresholds();

    return {
      deviceType: this.detectDeviceType(),
      networkType: this.detectNetworkType(),
      connectionSpeed: this.detectConnectionSpeed(),
      userEngagement: this.detectUserEngagement(),
      batteryLevel: this.detectBatteryLevel(),
      timeOfDay: this.detectTimeOfDay(),
      scrollDepth: this.getScrollDepth(),
      timeSpent: this.getTimeSpent(),
    };
  }

  static detectDeviceType(): LoadingContext["deviceType"] {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  }

  static detectNetworkType(): LoadingContext["networkType"] {
    if (typeof navigator === "undefined") return "4g";

    const connection = (navigator as any).connection;
    if (connection?.effectiveType) {
      const type = connection.effectiveType;
      if (type.includes("slow")) return "slow-2g";
      if (type.includes("2g")) return "2g";
      if (type.includes("3g")) return "3g";
      if (type.includes("4g")) return "4g";
    }

    return "fast";
  }

  static detectConnectionSpeed(): LoadingContext["connectionSpeed"] {
    if (typeof navigator === "undefined") return "medium";

    const connection = (navigator as any).connection;
    const downlink = connection?.downlink || 10;

    if (downlink < 2) return "slow";
    if (downlink < 10) return "medium";
    return "fast";
  }

  static detectUserEngagement(): LoadingContext["userEngagement"] {
    const timeSpent = this.getTimeSpent();
    const scrollDepth = this.getScrollDepth();

    if (timeSpent > 120 || scrollDepth > 70) return "high";
    if (timeSpent > 30 || scrollDepth > 30) return "medium";
    return "low";
  }

  static detectTimeOfDay(): LoadingContext["timeOfDay"] {
    const hour = new Date().getHours();
    return (hour >= 8 && hour <= 18) ? "peak" : "off-peak";
  }

  static async detectBatteryLevel(): Promise<LoadingContext["batteryLevel"]> {
    if (typeof navigator === "undefined") return "normal";

    try {
      const battery = await (navigator as any).getBattery?.();
      return battery?.level < 0.2 ? "low" : "normal";
    } catch {
      return "normal";
    }
  }

  static getScrollDepth(): number {
    if (typeof window === "undefined") return 0;

    const scrolled = window.scrollY;
    const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
    return maxHeight > 0 ? Math.round((scrolled / maxHeight) * 100) : 0;
  }

  static getTimeSpent(): number {
    // Simples: tempo desde que a página carregou
    if (typeof window === "undefined") return 0;

    const startTime = (window as any).__pageLoadTime || Date.now();
    return Math.round((Date.now() - startTime) / 1000); // em segundos
  }
}

/**
 * Strategy Engine - Versão Simplificada
 */
class StrategyEngine {
  static determineStrategy(
    context: LoadingContext,
    thresholds: AdaptiveThresholds,
    sectionType: "hero" | "content" | "footer"
  ): LoadingStrategy {
    // Estratégia base baseada no tipo de seção
    let baseStrategy: Partial<LoadingStrategy> = {};

    switch (sectionType) {
      case "hero":
        baseStrategy = {
          priority: "hero",
          method: "eager",
          batchSize: 1,
        };
        break;
      case "content":
        baseStrategy = {
          priority: "early",
          method: "progressive",
          batchSize: Math.min(thresholds.batchSize, 3),
        };
        break;
      case "footer":
        baseStrategy = {
          priority: "deferred",
          method: "lazy",
          batchSize: 1,
        };
        break;
    }

    // Ajusta baseado no contexto

    // Rede lenta = mais conservador
    if (context.networkType === "slow-2g" || context.networkType === "2g") {
      baseStrategy.method = "lazy";
      baseStrategy.batchSize = Math.max(1, baseStrategy.batchSize! - 1);
    }

    // Usuário engajado = mais agressivo
    if (context.userEngagement === "high") {
      if (baseStrategy.priority === "early") baseStrategy.priority = "hero";
      if (baseStrategy.method === "lazy") baseStrategy.method = "progressive";
    }

    // Bateria baixa = conservador
    if (context.batteryLevel === "low") {
      baseStrategy.method = "lazy";
      baseStrategy.batchSize = 1;
    }

    // Horário comercial = mais agressivo (usuários trabalhando)
    if (context.timeOfDay === "peak") {
      if (baseStrategy.method === "lazy") baseStrategy.method = "progressive";
    }

    return {
      priority: baseStrategy.priority!,
      method: baseStrategy.method!,
      batchSize: baseStrategy.batchSize!,
      preloadDistance: thresholds.preloadDistance,
      skeletonDuration: thresholds.skeletonDuration,
      retryStrategy: this.determineRetryStrategy(context),
      cacheStrategy: this.determineCacheStrategy(context),
    };
  }

  static determineRetryStrategy(context: LoadingContext): "immediate" | "exponential" | "none" {
    // Redes ruins precisam de retry
    if (context.networkType === "slow-2g" || context.networkType === "2g") {
      return "exponential";
    }

    // Usuários engajados toleram retry
    if (context.userEngagement === "high") {
      return "immediate";
    }

    return "none";
  }

  static determineCacheStrategy(context: LoadingContext): "aggressive" | "balanced" | "conservative" {
    // Dispositivos móveis = mais cache (poupam dados)
    if (context.deviceType === "mobile") {
      return "aggressive";
    }

    // Rede lenta = mais cache
    if (context.connectionSpeed === "slow") {
      return "aggressive";
    }

    // Usuários engajados = cache balanceado
    if (context.userEngagement === "high") {
      return "balanced";
    }

    return "conservative";
  }
}

/**
 * Load Queue Manager - Gerencia concorrência
 */
class LoadQueueManager {
  private queue: Array<{
    id: string;
    priority: "hero" | "early" | "deferred";
    loader: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private activeLoads = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Adiciona uma tarefa à fila
   */
  async enqueue<T>(
    id: string,
    priority: "hero" | "early" | "deferred",
    loader: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        priority,
        loader,
        resolve,
        reject,
      });

      this.sortQueue();
      this.processQueue();
    });
  }

  /**
   * Processa a fila
   */
  private async processQueue(): Promise<void> {
    if (this.activeLoads >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.activeLoads++;

    try {
      const result = await task.loader();
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.activeLoads--;
      // Processa próxima tarefa
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * Ordena fila por prioridade
   */
  private sortQueue(): void {
    const priorityOrder = { hero: 3, early: 2, deferred: 1 };

    this.queue.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  /**
   * Cancela uma tarefa específica
   */
  cancel(id: string): boolean {
    const index = this.queue.findIndex(task => task.id === id);
    if (index === -1) return false;

    const task = this.queue.splice(index, 1)[0];
    task.reject(new Error("Load cancelled"));
    return true;
  }

  /**
   * Obtém estatísticas da fila
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeLoads: this.activeLoads,
      maxConcurrent: this.maxConcurrent,
      utilization: this.activeLoads / this.maxConcurrent,
    };
  }
}

/**
 * Context-Aware Loader - Versão Simplificada
 */
export class ContextAwareLoader {
  private static instance: ContextAwareLoader;
  private config: LoaderConfig;
  private queueManager: LoadQueueManager;
  private loadHistory: Map<string, LoadingResult[]> = new Map();

  constructor(config: LoaderConfig = ContextAwareLoader.getDefaultConfig()) {
    this.config = config;
    this.queueManager = new LoadQueueManager(config.maxConcurrentLoads);
  }

  static getInstance(): ContextAwareLoader {
    if (!ContextAwareLoader.instance) {
      ContextAwareLoader.instance = new ContextAwareLoader();
    }
    return ContextAwareLoader.instance;
  }

  /**
   * Configuração padrão
   */
  static getDefaultConfig(): LoaderConfig {
    return {
      enableCaching: true,
      enablePredictive: true,
      enableAdaptive: true,
      maxConcurrentLoads: 3,
      timeoutMultiplier: 1.5,
      retryEnabled: true,
    };
  }

  /**
   * Carrega conteúdo de forma context-aware
   */
  async load<T>(
    key: string,
    loader: () => Promise<T>,
    sectionType: "hero" | "content" | "footer" = "content",
    options: {
      force?: boolean;
      priority?: "hero" | "early" | "deferred";
      metadata?: Record<string, any>;
    } = {}
  ): Promise<LoadingResult<T>> {
    const startTime = Date.now();
    const loadId = `${key}_${startTime}`;

    try {
      // Detecta contexto atual
      const context = await ContextDetector.detectContext();

      // Obtém thresholds adaptativos
      const thresholds = await smartThresholdManager.getAdaptiveThresholds();

      // Determina estratégia
      const strategy = StrategyEngine.determineStrategy(context, thresholds, sectionType);

      // Override de prioridade se especificado
      if (options.priority) {
        strategy.priority = options.priority;
      }

      // Tenta cache primeiro se habilitado
      if (this.config.enableCaching && !options.force) {
        const cached = await intelligentCacheManager.get(key);
        if (cached !== null) {
          return this.createResult(true, cached, startTime, strategy, context, true, false, 0);
        }
      }

      // Carrega via queue manager
      const data = await this.queueManager.enqueue(
        loadId,
        strategy.priority,
        () => this.executeLoad(loader, strategy, context)
      );

      // Cache o resultado se habilitado
      if (this.config.enableCaching) {
        await intelligentCacheManager.set(key, data, {
          ttl: 30 * 60 * 1000, // 30 minutos
          priority: this.mapStrategyToPriority(strategy),
          tags: [`section:${sectionType}`, `strategy:${strategy.method}`],
        });
      }

      // Registra no histórico
      this.recordLoadResult(key, this.createResult(true, data, startTime, strategy, context, false, false, 0));

      return this.createResult(true, data, startTime, strategy, context, false, false, 0);

    } catch (error) {
      const loadError = error instanceof Error ? error : new Error(String(error));

      // Tenta retry se habilitado
      if (this.config.retryEnabled) {
        const retryResult = await this.attemptRetry(key, loader, sectionType, startTime, loadError);
        if (retryResult) {
          return retryResult;
        }
      }

      // Registra falha
      const failureResult = this.createResult(false, undefined, startTime,
        await this.getDefaultStrategy(sectionType), await ContextDetector.detectContext(),
        false, true, 0, loadError);

      this.recordLoadResult(key, failureResult);

      return failureResult;
    }
  }

  /**
   * Executa o carregamento com estratégia específica
   */
  private async executeLoad<T>(
    loader: () => Promise<T>,
    strategy: LoadingStrategy,
    context: LoadingContext
  ): Promise<T> {
    const timeout = Math.round(strategy.skeletonDuration * this.config.timeoutMultiplier);

    // Promise race entre loader e timeout
    return Promise.race([
      loader(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Load timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Tenta retry baseado na estratégia
   */
  private async attemptRetry<T>(
    key: string,
    loader: () => Promise<T>,
    sectionType: "hero" | "content" | "footer",
    originalStartTime: number,
    originalError: Error
  ): Promise<LoadingResult<T> | null> {
    const context = await ContextDetector.detectContext();
    const strategy = await this.getDefaultStrategy(sectionType);

    // Só retry se estratégia permitir
    if (strategy.retryStrategy === "none") {
      return null;
    }

    const maxRetries = strategy.retryAttempts || 1;
    let lastError = originalError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug("Retrying load", {
          event: "ll_load_retry_attempt",
          ll_key: key,
          ll_attempt: attempt,
          ll_max_retries: maxRetries,
          ll_strategy: strategy.retryStrategy,
        });

        // Delay baseado na estratégia
        if (strategy.retryStrategy === "exponential") {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        } else if (strategy.retryStrategy === "immediate") {
          await this.delay(100); // Quick retry
        }

        const data = await this.executeLoad(loader, strategy, context);

        // Retry bem-sucedido!
        return this.createResult(true, data, originalStartTime, strategy, context, false, true, attempt);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    return null; // Todos retries falharam
  }

  /**
   * Cria resultado padronizado
   */
  private createResult<T>(
    success: boolean,
    data: T | undefined,
    startTime: number,
    strategy: LoadingStrategy,
    context: LoadingContext,
    cached: boolean,
    retried: boolean,
    retryCount: number,
    error?: Error
  ): LoadingResult<T> {
    return {
      success,
      data,
      error,
      loadTime: Date.now() - startTime,
      strategy,
      context,
      cached,
      retried,
      retryCount,
    };
  }

  /**
   * Obtém estratégia padrão para um tipo de seção
   */
  private async getDefaultStrategy(sectionType: "hero" | "content" | "footer"): Promise<LoadingStrategy> {
    const context = await ContextDetector.detectContext();
    const thresholds = await smartThresholdManager.getAdaptiveThresholds();

    return StrategyEngine.determineStrategy(context, thresholds, sectionType);
  }

  /**
   * Mapeia estratégia para prioridade de cache
   */
  private mapStrategyToPriority(strategy: LoadingStrategy): "low" | "medium" | "high" {
    switch (strategy.priority) {
      case "hero": return "high";
      case "early": return "medium";
      case "deferred": return "low";
    }
  }

  /**
   * Registra resultado no histórico
   */
  private recordLoadResult(key: string, result: LoadingResult): void {
    const history = this.loadHistory.get(key) || [];
    history.push(result);

    // Mantém apenas os últimos 10 resultados
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    this.loadHistory.set(key, history);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Pré-carrega conteúdo baseado em padrões
   */
  async preloadPredictive(currentKey: string): Promise<void> {
    if (!this.config.enablePredictive) return;

    // Usa cache manager para obter sugestões
    const suggestions = (intelligentCacheManager as any).predictiveEngine?.getPreloadSuggestions(currentKey, 2) || [];

    for (const suggestion of suggestions) {
      if (!intelligentCacheManager.has(suggestion)) {
        logger.debug("Predictive preload initiated", {
          event: "ll_predictive_preload_initiated",
          ll_current_key: currentKey,
          ll_suggested_key: suggestion,
        });

        // Em produção, aqui seria chamado o loader apropriado
        // Por enquanto, apenas log
      }
    }
  }

  /**
   * Obtém estatísticas do loader
   */
  getStats() {
    const historyStats = Array.from(this.loadHistory.entries()).map(([key, results]) => {
      const successful = results.filter(r => r.success).length;
      const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
      const cacheHitRate = results.filter(r => r.cached).length / results.length;

      return {
        key,
        totalLoads: results.length,
        successRate: successful / results.length,
        avgLoadTime: Math.round(avgLoadTime),
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        lastLoad: results[results.length - 1]?.loadTime,
      };
    });

    return {
      config: this.config,
      queueStats: this.queueManager.getStats(),
      historyStats,
      totalKeys: this.loadHistory.size,
      averageSuccessRate: historyStats.reduce((sum, stat) => sum + stat.successRate, 0) / historyStats.length || 0,
    };
  }

  /**
   * Cancela um carregamento específico
   */
  cancelLoad(key: string): boolean {
    // Cancela na queue se estiver pendente
    return this.queueManager.cancel(key);
  }

  /**
   * Limpa histórico e cache
   */
  clearHistory(): void {
    this.loadHistory.clear();
    intelligentCacheManager.clear();
  }
}

// Export singleton
export const contextAwareLoader = ContextAwareLoader.getInstance();
