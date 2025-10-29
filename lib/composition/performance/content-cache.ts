// Content Cache - Intelligent caching for composition data
// Reduces redundant API calls and improves performance

import { getSSRAdapter } from "../container";
import { logger } from "@/lib/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxEntries: number;
  enableCompression: boolean;
}

export class ContentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  protected ssrAdapter = getSSRAdapter();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 100,
      enableCompression: false,
      ...config,
    };
  }

  /**
   * Get cached data if valid and not expired
   */
  get<T>(key: string): T | null {
    const startTime = performance.now();
    const entry = this.cache.get(key);
    const duration = performance.now() - startTime;

    if (!entry) {
      // Log cache miss
      logger.info("Cache operation completed", {
        event: "cache_miss",
        operation: "get",
        key,
        duration,
        cacheSize: this.cache.size,
        hitRate: this.calculateHitRate(),
      });
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);

      logger.info("Cache operation completed", {
        event: "cache_expired",
        operation: "get",
        key,
        duration,
        ttl: entry.ttl,
        age: Date.now() - entry.timestamp,
        cacheSize: this.cache.size,
      });
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Log cache hit
    logger.info("Cache operation completed", {
      event: "cache_hit",
      operation: "get",
      key,
      duration,
      accessCount: entry.accessCount,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      size: this.estimateSize(entry.data),
      cacheSize: this.cache.size,
    });

    return entry.data;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const startTime = performance.now();

    // Evict old entries if at capacity
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data: this.config.enableCompression ? this.compress(data) : data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    const wasEvicted = this.cache.size >= this.config.maxEntries;
    this.cache.set(key, entry);

    const duration = performance.now() - startTime;

    // Log cache set operation
    logger.info("Cache operation completed", {
      event: "cache_set",
      operation: "set",
      key,
      duration,
      ttl: entry.ttl,
      size: this.estimateSize(data),
      cacheSize: this.cache.size,
      wasEvicted,
      compressionEnabled: this.config.enableCompression,
    });
  }

  /**
   * Get or set data using a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    let data = this.get<T>(key);

    if (data !== null) {
      return data;
    }

    // Data not in cache, call factory
    data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? Date.now() - entry.timestamp <= entry.ttl : false;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = this.calculateTotalSize();

    return {
      entries: this.cache.size,
      maxEntries: this.config.maxEntries,
      totalSize,
      hitRate: this.calculateHitRate(),
      averageAccessCount:
        entries.reduce((sum, entry) => sum + entry.accessCount, 0) /
          entries.length || 0,
      oldestEntry: Math.min(...entries.map((e) => e.timestamp)),
      newestEntry: Math.max(...entries.map((e) => e.timestamp)),
    };
  }

  /**
   * Warm up cache with frequently accessed content
   */
  async warmup(
    keys: string[],
    factory: (key: string) => Promise<any>,
  ): Promise<void> {
    const promises = keys.map((key) => this.getOrSet(key, () => factory(key)));
    await Promise.all(promises);
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey = "";
    let lruTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private calculateTotalSize(): number {
    // Rough estimation of memory usage
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += this.estimateSize(entry.data) + 32; // 32 bytes for metadata
    }
    return totalSize;
  }

  private estimateSize(obj: any): number {
    // Simple size estimation
    const str = JSON.stringify(obj);
    return str ? str.length * 2 : 0; // Rough estimation: 2 bytes per character
  }

  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values());
    const totalAccesses = entries.reduce(
      (sum, entry) => sum + entry.accessCount,
      0,
    );
    const hits = entries.filter((entry) => entry.accessCount > 0).length;

    return totalAccesses > 0 ? hits / totalAccesses : 0;
  }

  private compress(data: any): any {
    // Simple compression for strings
    if (typeof data === "string" && data.length > 1000) {
      // In a real implementation, you'd use a proper compression algorithm
      // For now, just return as-is
      return data;
    }
    return data;
  }
}

// ===== PERSISTENT CACHE =====

// Cache that persists across page reloads using localStorage
export class PersistentContentCache extends ContentCache {
  private storageKey: string;

  constructor(storageKey = "content-cache", config: Partial<CacheConfig> = {}) {
    super(config);
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = this.ssrAdapter.safeLocalStorageAccess(
        this.storageKey,
        null,
      );
      if (stored && typeof stored === "object") {
        // Restore valid entries
        Object.entries(stored as Record<string, CacheEntry<any>>).forEach(
          ([key, entry]) => {
            if (this.isValidEntry(entry)) {
              super.set(key, entry.data, entry.ttl);
            }
          },
        );
      }
    } catch (error) {
      console.warn("Failed to restore cache from storage:", error);
    }
  }

  private saveToStorage(): void {
    const cacheData: Record<string, CacheEntry<any>> = {};

    // Get all current cache entries
    for (const [key, entry] of (this as any).cache) {
      cacheData[key] = entry;
    }

    this.ssrAdapter.safeWindowAccess(() => {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
      } catch (error) {
        console.warn("Failed to save cache to storage:", error);
      }
    }, undefined);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    super.set(key, data, ttl);
    this.saveToStorage();
  }

  delete(key: string): boolean {
    const result = super.delete(key);
    this.saveToStorage();
    return result;
  }

  clear(): void {
    super.clear();
    this.saveToStorage();
  }

  private isValidEntry(entry: CacheEntry<any>): boolean {
    return (
      entry &&
      typeof entry.timestamp === "number" &&
      typeof entry.ttl === "number" &&
      Date.now() - entry.timestamp <= entry.ttl
    );
  }
}

// ===== CACHE MANAGER =====

// Singleton cache manager
class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, ContentCache>();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  getCache(name: string, persistent = false): ContentCache {
    if (!this.caches.has(name)) {
      const cache = persistent
        ? new PersistentContentCache(`${name}-cache`)
        : new ContentCache();
      this.caches.set(name, cache);
    }
    return this.caches.get(name)!;
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  getStats() {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

export const cacheManager = CacheManager.getInstance();

// ===== CONVENIENCE FUNCTIONS =====

export function getCompositionCache(): ContentCache {
  return cacheManager.getCache("composition", true); // Persistent cache for compositions
}

export function getContentCache(): ContentCache {
  return cacheManager.getCache("content", false); // Memory-only cache for content
}

// React hook moved to separate client component file
// See use-content-cache.tsx for the hook implementation
