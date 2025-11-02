/**
 * Component Cache Manager - BLOCO 2: Lazy Loading
 *
 * Sistema de cache inteligente para componentes lazy-loaded
 * Otimiza performance reduzindo re-downloads e renderizações desnecessárias
 */

import { logger } from "../observability/logger";

interface CachedComponent<T = any> {
  component: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // estimated size in bytes
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface CacheConfig {
  maxSize: number; // max components in cache
  maxMemory: number; // max memory in MB
  ttl: number; // time to live in ms
  enableCompression: boolean;
  enablePrefetch: boolean;
}

export class ComponentCacheManager {
  private cache = new Map<string, CachedComponent>();
  private memoryUsage = 0;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50,
      maxMemory: 100, // 100MB
      ttl: 30 * 60 * 1000, // 30 minutes
      enableCompression: false,
      enablePrefetch: true,
      ...config,
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // every 5 minutes
  }

  /**
   * Cache a component with metadata
   */
  set<T>(
    key: string,
    component: T,
    priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  ): void {
    try {
      const size = this.estimateSize(component);
      const cacheEntry: CachedComponent<T> = {
        component,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        priority,
      };

      // Check memory limits
      if (this.memoryUsage + size > this.config.maxMemory * 1024 * 1024) {
        this.evictLowPriority(size);
      }

      // Check cache size limits
      if (this.cache.size >= this.config.maxSize) {
        this.evictLeastRecentlyUsed();
      }

      this.cache.set(key, cacheEntry);
      this.memoryUsage += size;

      logger.debug("Component cached", {
        key,
        size: `${(size / 1024).toFixed(2)}KB`,
        priority,
        totalMemory: `${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      });
    } catch (error) {
      logger.warn("Failed to cache component", { key, error: String(error) });
    }
  }

  /**
   * Get cached component with access tracking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CachedComponent<T> | undefined;

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.memoryUsage -= entry.size;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    logger.debug("Component retrieved from cache", {
      key,
      accessCount: entry.accessCount,
    });

    return entry.component;
  }

  /**
   * Check if component exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.memoryUsage -= entry.size;
      return false;
    }

    return true;
  }

  /**
   * Prefetch component (warm cache)
   */
  async prefetch(key: string, loader: () => Promise<any>): Promise<void> {
    if (!this.config.enablePrefetch || this.has(key)) return;

    try {
      logger.debug("Prefetching component", { key });
      const component = await loader();
      this.set(key, component, 'low');
    } catch (error) {
      logger.warn("Prefetch failed", { key, error: String(error) });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const avgAccesses = entries.length > 0 ? totalAccesses / entries.length : 0;

    return {
      totalComponents: this.cache.size,
      memoryUsage: `${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      maxMemory: `${this.config.maxMemory}MB`,
      totalAccesses,
      averageAccesses: avgAccesses.toFixed(2),
      byPriority: {
        critical: entries.filter(e => e.priority === 'critical').length,
        high: entries.filter(e => e.priority === 'high').length,
        medium: entries.filter(e => e.priority === 'medium').length,
        low: entries.filter(e => e.priority === 'low').length,
      },
    };
  }

  /**
   * Clear cache completely
   */
  clear(): void {
    this.cache.clear();
    this.memoryUsage = 0;
    logger.info("Component cache cleared");
  }

  /**
   * Evict low priority components to free memory
   */
  private evictLowPriority(requiredSize: number): void {
    const priorityOrder = ['low', 'medium', 'high', 'critical'];
    const toEvict: string[] = [];

    for (const priority of priorityOrder) {
      const entries = Array.from(this.cache.entries())
        .filter(([_, entry]) => entry.priority === priority)
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed); // LRU

      for (const [key, entry] of entries) {
        toEvict.push(key);
        if (this.memoryUsage - entry.size <= this.config.maxMemory * 1024 * 1024 - requiredSize) {
          break;
        }
      }

      if (this.memoryUsage <= this.config.maxMemory * 1024 * 1024 - requiredSize) {
        break;
      }
    }

    for (const key of toEvict) {
      const entry = this.cache.get(key);
      if (entry) {
        this.memoryUsage -= entry.size;
        this.cache.delete(key);
      }
    }

    logger.debug("Evicted low priority components", { count: toEvict.length });
  }

  /**
   * Evict least recently used components
   */
  private evictLeastRecentlyUsed(): void {
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = Math.ceil(this.cache.size * 0.2); // remove 20%

    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = sortedEntries[i];
      this.memoryUsage -= entry.size;
      this.cache.delete(key);
    }

    logger.debug("Evicted LRU components", { count: toRemove });
  }

  /**
   * Periodic cleanup of expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key);
        this.memoryUsage -= entry.size;
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    if (expiredKeys.length > 0) {
      logger.debug("Cleaned up expired components", { count: expiredKeys.length });
    }
  }

  /**
   * Estimate component size (rough approximation)
   */
  private estimateSize(component: any): number {
    try {
      // Rough estimation based on JSON serialization
      const serialized = JSON.stringify(component);
      return serialized.length * 2; // ~2 bytes per character for JS objects
    } catch {
      return 1024 * 1024; // 1MB fallback for complex objects
    }
  }
}

// Singleton instance
export const componentCache = new ComponentCacheManager({
  maxSize: 50,
  maxMemory: 100, // 100MB
  ttl: 30 * 60 * 1000, // 30 minutes
  enablePrefetch: true,
});
