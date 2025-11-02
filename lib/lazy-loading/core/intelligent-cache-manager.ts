"use client";

import { logger } from "../../observability/logger";

/**
 * Intelligent Cache Manager - Versão Simplificada e Econômica
 * Cache LRU inteligente com predictive preloading simples
 */

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number; // bytes
  ttl?: number; // time to live in ms
  priority: "low" | "medium" | "high";
  tags: string[]; // para agrupamento e invalidação
}

export interface CacheConfig {
  maxSize: number; // máximo entries
  maxMemory: number; // máximo bytes
  defaultTTL: number; // TTL padrão em ms
  compressionThreshold: number; // tamanho mínimo para compressão
  predictiveEnabled: boolean;
  cleanupInterval: number; // intervalo de limpeza em ms
}

export interface PredictivePattern {
  key: string;
  confidence: number; // 0-1
  nextKeys: string[]; // chaves que provavelmente serão acessadas
  lastUpdated: number;
  accessCount: number;
}

export interface CacheMetrics {
  totalEntries: number;
  totalMemory: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  compressions: number;
  predictiveHits: number;
  predictiveMisses: number;
  avgAccessTime: number;
  lastCleanup: number;
}

/**
 * LRU Cache Implementation
 */
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = []; // Para LRU ordering
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Adiciona ou atualiza uma entrada no cache
   */
  set(key: string, value: T, options: Partial<CacheEntry> = {}): boolean {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: options.accessCount || 1,
      size: this.calculateSize(value),
      ttl: options.ttl || this.config.defaultTTL,
      priority: options.priority || "medium",
      tags: options.tags || [],
    };

    // Remove entrada antiga se existir
    this.delete(key);

    // Verifica limites antes de adicionar
    if (!this.ensureCapacity(entry.size)) {
      return false; // Não conseguiu espaço
    }

    // Adiciona ao cache
    this.cache.set(key, entry);
    this.accessOrder.push(key);

    // Compressão se necessário
    if (entry.size > this.config.compressionThreshold) {
      this.compressEntry(entry);
    }

    return true;
  }

  /**
   * Obtém uma entrada do cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verifica TTL
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Atualiza acesso
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    // Move para o final da lista de acesso (mais recente)
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * Verifica se uma chave existe no cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== null && !this.isExpired(entry);
  }

  /**
   * Remove uma entrada do cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);

    // Remove da ordem de acesso
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    return true;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    size: number;
    memoryUsage: number;
    hitRate: number;
    entries: Array<{ key: string; accessCount: number; lastAccessed: number }>;
  } {
    const entries = Array.from(this.cache.values()).map(entry => ({
      key: entry.key,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
    }));

    return {
      size: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
      hitRate: this.calculateHitRate(),
      entries,
    };
  }

  /**
   * Calcula tamanho aproximado de um valor
   */
  private calculateSize(value: T): number {
    if (value === null || value === undefined) return 0;

    try {
      // Estimativa simples baseada em JSON string
      const jsonString = JSON.stringify(value);
      return jsonString.length * 2; // UTF-16
    } catch {
      // Fallback para tipos não serializáveis
      return 100; // 100 bytes estimados
    }
  }

  /**
   * Verifica se uma entrada expirou
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Atualiza ordem de acesso (move para o final)
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Garante que há capacidade para uma nova entrada
   */
  private ensureCapacity(neededSize: number): boolean {
    let currentMemory = this.getMemoryUsage();

    // Remove entradas LRU até ter espaço suficiente
    while (currentMemory + neededSize > this.config.maxMemory && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      const lruEntry = this.cache.get(lruKey);

      if (lruEntry) {
        currentMemory -= lruEntry.size;
        this.cache.delete(lruKey);
      }
    }

    // Se ainda não tem espaço suficiente, falha
    return currentMemory + neededSize <= this.config.maxMemory;
  }

  /**
   * Comprime uma entrada grande
   */
  private compressEntry(entry: CacheEntry): void {
    // Implementação simples de compressão
    // Em produção, usaria uma biblioteca como pako
    try {
      const jsonString = JSON.stringify(entry.value);
      // Simula compressão reduzindo tamanho em 50%
      entry.size = Math.floor(entry.size * 0.5);
      entry.value = { __compressed: true, data: btoa(jsonString) } as any;
    } catch (error) {
      logger.debug("Cache compression failed", {
        event: "ll_cache_compression_failed",
        ll_key: entry.key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Calcula hit rate do cache
   */
  private calculateHitRate(): number {
    const totalAccesses = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);

    if (totalAccesses === 0) return 0;

    // Hit rate estimado baseado em acessos frequentes
    const frequentAccesses = Array.from(this.cache.values())
      .filter(entry => entry.accessCount > 1)
      .reduce((sum, entry) => sum + entry.accessCount, 0);

    return frequentAccesses / totalAccesses;
  }

  /**
   * Obtém uso de memória atual
   */
  private getMemoryUsage(): number {
    return Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
  }
}

/**
 * Predictive Cache Engine - Versão Simples
 */
class PredictiveCacheEngine {
  private patterns: Map<string, PredictivePattern> = new Map();
  private accessHistory: Array<{ key: string; timestamp: number }> = [];
  private maxHistorySize = 1000;

  /**
   * Registra acesso a uma chave
   */
  recordAccess(key: string): void {
    this.accessHistory.push({
      key,
      timestamp: Date.now(),
    });

    // Mantém histórico limitado
    if (this.accessHistory.length > this.maxHistorySize) {
      this.accessHistory = this.accessHistory.slice(-this.maxHistorySize);
    }

    // Atualiza padrões preditivos
    this.updatePatterns(key);
  }

  /**
   * Obtém sugestões de preload baseado em padrões
   */
  getPreloadSuggestions(currentKey: string, maxSuggestions = 3): string[] {
    const pattern = this.patterns.get(currentKey);
    if (!pattern || pattern.confidence < 0.3) {
      return [];
    }

    // Ordena por confidence e retorna top N
    return pattern.nextKeys
      .sort((a, b) => {
        const aPattern = this.patterns.get(a);
        const bPattern = this.patterns.get(b);
        return (bPattern?.confidence || 0) - (aPattern?.confidence || 0);
      })
      .slice(0, maxSuggestions);
  }

  /**
   * Atualiza padrões baseado no histórico
   */
  private updatePatterns(currentKey: string): void {
    // Encontra acessos recentes (últimos 10)
    const recentAccesses = this.accessHistory.slice(-10);
    const currentIndex = recentAccesses.findIndex(access => access.key === currentKey);

    if (currentIndex === -1 || currentIndex === recentAccesses.length - 1) {
      return; // Não há próximos acessos
    }

    // Próximos acessos após o current
    const nextKeys = recentAccesses.slice(currentIndex + 1).map(access => access.key);

    // Atualiza padrão
    const existingPattern = this.patterns.get(currentKey) || {
      key: currentKey,
      confidence: 0,
      nextKeys: [],
      lastUpdated: Date.now(),
      accessCount: 0,
    };

    existingPattern.accessCount++;
    existingPattern.lastUpdated = Date.now();

    // Adiciona novos next keys ou aumenta confidence dos existentes
    nextKeys.forEach(nextKey => {
      const existingIndex = existingPattern.nextKeys.indexOf(nextKey);
      if (existingIndex === -1) {
        existingPattern.nextKeys.push(nextKey);
      }
    });

    // Calcula confidence baseado na consistência
    existingPattern.confidence = Math.min(1.0,
      (existingPattern.accessCount * 0.1) + (existingPattern.nextKeys.length * 0.2)
    );

    this.patterns.set(currentKey, existingPattern);
  }

  /**
   * Limpa padrões antigos
   */
  cleanup(maxAge = 3600000): void { // 1 hora
    const cutoff = Date.now() - maxAge;

    for (const [key, pattern] of this.patterns) {
      if (pattern.lastUpdated < cutoff) {
        this.patterns.delete(key);
      }
    }
  }
}

/**
 * Intelligent Cache Manager - Versão Simplificada
 */
export class IntelligentCacheManager {
  private static instance: IntelligentCacheManager;
  private lruCache: LRUCache<any>;
  private predictiveEngine: PredictiveCacheEngine;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = IntelligentCacheManager.getDefaultConfig()) {
    this.config = config;
    this.lruCache = new LRUCache(config);
    this.predictiveEngine = new PredictiveCacheEngine();

    this.metrics = {
      totalEntries: 0,
      totalMemory: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      compressions: 0,
      predictiveHits: 0,
      predictiveMisses: 0,
      avgAccessTime: 0,
      lastCleanup: Date.now(),
    };

    this.startCleanupTimer();
  }

  static getInstance(): IntelligentCacheManager {
    if (!IntelligentCacheManager.instance) {
      IntelligentCacheManager.instance = new IntelligentCacheManager();
    }
    return IntelligentCacheManager.instance;
  }

  /**
   * Configuração padrão
   */
  static getDefaultConfig(): CacheConfig {
    return {
      maxSize: 100, // 100 entries
      maxMemory: 5 * 1024 * 1024, // 5MB
      defaultTTL: 30 * 60 * 1000, // 30 minutos
      compressionThreshold: 1024 * 1024, // 1MB
      predictiveEnabled: true,
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
    };
  }

  /**
   * Armazena um valor no cache com preload inteligente
   */
  async set(key: string, value: any, options: Partial<CacheEntry> = {}): Promise<boolean> {
    const startTime = Date.now();

    const success = this.lruCache.set(key, value, options);

    if (success) {
      // Registra acesso para padrões preditivos
      this.predictiveEngine.recordAccess(key);

      // Preload inteligente se habilitado
      if (this.config.predictiveEnabled) {
        await this.performPredictivePreload(key);
      }

      this.updateMetrics(startTime);
    }

    return success;
  }

  /**
   * Obtém um valor do cache
   */
  async get(key: string): Promise<any | null> {
    const startTime = Date.now();

    const value = this.lruCache.get(key);

    if (value !== null) {
      // Registra acesso para padrões preditivos
      this.predictiveEngine.recordAccess(key);

      // Preload inteligente se habilitado
      if (this.config.predictiveEnabled) {
        await this.performPredictivePreload(key);
      }

      this.metrics.predictiveHits++;
    } else {
      this.metrics.predictiveMisses++;
    }

    this.updateMetrics(startTime);
    return value;
  }

  /**
   * Verifica se uma chave existe
   */
  has(key: string): boolean {
    return this.lruCache.has(key);
  }

  /**
   * Remove uma entrada
   */
  delete(key: string): boolean {
    return this.lruCache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.lruCache.clear();
    this.predictiveEngine.cleanup();
    this.resetMetrics();
  }

  /**
   * Obtém múltiplas entradas em batch
   */
  async getBatch(keys: string[]): Promise<Map<string, any>> {
    const result = new Map<string, any>();
    const startTime = Date.now();

    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        result.set(key, value);
      }
    }

    this.updateMetrics(startTime);
    return result;
  }

  /**
   * Preload inteligente baseado em padrões
   */
  private async performPredictivePreload(currentKey: string): Promise<void> {
    if (!this.config.predictiveEnabled) return;

    const suggestions = this.predictiveEngine.getPreloadSuggestions(currentKey, 2);

    for (const suggestedKey of suggestions) {
      // Só preload se não estiver no cache e houver espaço
      if (!this.has(suggestedKey) && this.lruCache.getStats().size < this.config.maxSize * 0.8) {
        // Em produção, aqui seria chamado o loader para buscar o conteúdo
        logger.debug("Predictive preload suggestion", {
          event: "ll_predictive_preload_suggestion",
          ll_current_key: currentKey,
          ll_suggested_key: suggestedKey,
        });
      }
    }
  }

  /**
   * Atualiza métricas após operação
   */
  private updateMetrics(operationStartTime: number): void {
    const now = Date.now();
    const operationTime = now - operationStartTime;

    // Atualiza métricas de tempo
    this.metrics.avgAccessTime = (this.metrics.avgAccessTime + operationTime) / 2;

    // Atualiza métricas do LRU cache
    const cacheStats = this.lruCache.getStats();
    this.metrics.totalEntries = cacheStats.size;
    this.metrics.totalMemory = cacheStats.memoryUsage;
    this.metrics.hitRate = cacheStats.hitRate;

    this.metrics.missRate = 1 - this.metrics.hitRate;
  }

  /**
   * Reseta métricas
   */
  private resetMetrics(): void {
    this.metrics = {
      totalEntries: 0,
      totalMemory: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      compressions: 0,
      predictiveHits: 0,
      predictiveMisses: 0,
      avgAccessTime: 0,
      lastCleanup: Date.now(),
    };
  }

  /**
   * Inicia timer de limpeza automática
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Executa limpeza automática
   */
  private performCleanup(): void {
    // Limpa padrões preditivos antigos
    this.predictiveEngine.cleanup();

    // Limpa entradas expiradas (o LRU cache já faz isso automaticamente)
    // Aqui poderíamos adicionar limpeza adicional se necessário

    this.metrics.lastCleanup = Date.now();

    logger.debug("Cache cleanup performed", {
      event: "ll_cache_cleanup_performed",
      ll_entries_after_cleanup: this.metrics.totalEntries,
    });
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtém estatísticas detalhadas
   */
  getStats() {
    return {
      config: this.config,
      cacheStats: this.lruCache.getStats(),
      metrics: this.metrics,
      predictivePatterns: Array.from(this.predictiveEngine['patterns'].values()).length,
      memoryEfficiency: this.metrics.totalMemory > 0 ?
        (this.metrics.totalEntries / this.metrics.totalMemory) * 1000 : 0, // entries per KB
    };
  }

  /**
   * Otimiza configurações baseado no uso
   */
  optimizeConfig(): CacheConfig {
    const stats = this.getStats();
    const newConfig = { ...this.config };

    // Ajusta maxSize baseado no uso
    if (stats.cacheStats.hitRate > 0.8 && stats.cacheStats.size > this.config.maxSize * 0.9) {
      newConfig.maxSize = Math.min(this.config.maxSize * 1.2, 500); // Aumenta até 500
    } else if (stats.cacheStats.hitRate < 0.5 && stats.cacheStats.size < this.config.maxSize * 0.5) {
      newConfig.maxSize = Math.max(this.config.maxSize * 0.8, 20); // Diminui até 20
    }

    // Ajusta maxMemory baseado no uso de memória
    if (stats.metrics.totalMemory > this.config.maxMemory * 0.9) {
      newConfig.maxMemory = Math.min(this.config.maxMemory * 1.1, 20 * 1024 * 1024); // Até 20MB
    }

    return newConfig;
  }

  /**
   * Para o manager e limpa recursos
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Export singleton
export const intelligentCacheManager = IntelligentCacheManager.getInstance();
