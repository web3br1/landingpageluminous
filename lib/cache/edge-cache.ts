// Edge Cache System for Global Performance
// Supports multiple cache backends: Vercel KV, Redis, Cloudflare KV

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  defaultTtl: number;
  maxEntries?: number;
  backend: "memory" | "redis" | "vercel-kv" | "cloudflare-kv";
  connectionString?: string;
  namespace?: string;
}

class EdgeCache {
  private config: CacheConfig;
  private memoryCache = new Map<string, CacheEntry>();
  private backend: any = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeBackend();
  }

  private initializeBackend() {
    switch (this.config.backend) {
      case "redis":
        // Redis backend (would require redis package)
        if (this.config.connectionString) {
          // this.backend = new Redis(this.config.connectionString)
        }
        break;

      case "vercel-kv":
        // Vercel KV backend
        if (process.env.KV_URL) {
          // Would use @vercel/kv package
          // this.backend = createClient({ url: process.env.KV_URL })
        }
        break;

      case "cloudflare-kv":
        // Cloudflare KV backend (available in CF Workers)
        // this.backend = CLOUDFLARE_KV_BINDING
        break;

      case "memory":
      default:
        // In-memory cache (good for development/single instance)
        this.backend = null;
        break;
    }
  }

  // Get cache entry with TTL check
  async get<T>(key: string): Promise<T | null> {
    const namespacedKey = this.getNamespacedKey(key);

    // Try backend first
    if (this.backend && this.config.backend !== "memory") {
      try {
        const data = await this.backend.get(namespacedKey);
        if (data) {
          const entry: CacheEntry<T> = JSON.parse(data);
          if (this.isExpired(entry)) {
            await this.delete(key);
            return null;
          }
          return entry.data;
        }
      } catch (error) {
        console.warn("Cache backend error:", error);
      }
    }

    // Fallback to memory cache
    const memoryEntry = this.memoryCache.get(namespacedKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    return null;
  }

  // Set cache entry with TTL
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {},
  ): Promise<void> {
    const ttl = options.ttl || this.config.defaultTtl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options.tags,
      metadata: options.metadata,
    };

    const namespacedKey = this.getNamespacedKey(key);

    // Set in backend
    if (this.backend && this.config.backend !== "memory") {
      try {
        await this.backend.set(namespacedKey, JSON.stringify(entry), {
          ex: ttl,
        });
      } catch (error) {
        console.warn("Cache backend set error:", error);
      }
    }

    // Always set in memory for fast access
    this.memoryCache.set(namespacedKey, entry);

    // Cleanup memory cache if needed
    if (
      this.config.maxEntries &&
      this.memoryCache.size > this.config.maxEntries
    ) {
      this.cleanupExpired();
    }
  }

  // Delete cache entry
  async delete(key: string): Promise<void> {
    const namespacedKey = this.getNamespacedKey(key);

    if (this.backend && this.config.backend !== "memory") {
      try {
        await this.backend.del(namespacedKey);
      } catch (error) {
        console.warn("Cache backend delete error:", error);
      }
    }

    this.memoryCache.delete(namespacedKey);
  }

  // Delete by tags
  async deleteByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    // Check memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && tags.some((tag) => entry.tags!.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    // Delete from memory
    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    // Backend cleanup would require more complex implementation
    // For now, just cleanup memory and let backend expire naturally
  }

  // Get or set with function
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: {
      ttl?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {},
  ): Promise<T> {
    let data = await this.get<T>(key);
    if (data !== null) {
      return data;
    }

    data = await factory();
    await this.set(key, data, options);
    return data;
  }

  // Clear all cache
  async clear(): Promise<void> {
    if (this.backend && this.config.backend !== "memory") {
      // Backend clearing would depend on the backend implementation
      console.warn("Backend cache clearing not implemented");
    }

    this.memoryCache.clear();
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.memoryCache.values()) {
      if (this.isExpired(entry)) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      backend: this.config.backend,
      memoryEntries: this.memoryCache.size,
      validEntries,
      expiredEntries,
      namespace: this.config.namespace,
    };
  }

  private getNamespacedKey(key: string): string {
    return this.config.namespace ? `${this.config.namespace}:${key}` : key;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl * 1000;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Global cache instance
const defaultConfig: CacheConfig = {
  defaultTtl: 300, // 5 minutes
  maxEntries: 1000,
  backend: (process.env.CACHE_BACKEND as any) || "memory",
  connectionString: process.env.REDIS_URL || process.env.KV_URL,
  namespace: process.env.CACHE_NAMESPACE || "luminaris",
};

export const edgeCache = new EdgeCache(defaultConfig);

// Cache utilities for common patterns
export const cacheUtils = {
  // Cache user personalization data
  getUserPersonalization: (userId: string) =>
    edgeCache.get(`user:${userId}:personalization`),

  setUserPersonalization: (userId: string, data: any, ttl = 1800) =>
    edgeCache.set(`user:${userId}:personalization`, data, {
      ttl,
      tags: ["user", "personalization"],
    }),

  // Cache page content
  getPageContent: (pageKey: string, variant?: string) =>
    edgeCache.get(`page:${pageKey}:${variant || "default"}`),

  setPageContent: (
    pageKey: string,
    content: any,
    variant?: string,
    ttl = 3600,
  ) =>
    edgeCache.set(`page:${pageKey}:${variant || "default"}`, content, {
      ttl,
      tags: ["page", pageKey],
    }),

  // Cache experiment variants
  getExperimentVariant: (experimentId: string, userId: string) =>
    edgeCache.get(`experiment:${experimentId}:user:${userId}`),

  setExperimentVariant: (
    experimentId: string,
    userId: string,
    variant: string,
    ttl = 86400,
  ) =>
    edgeCache.set(`experiment:${experimentId}:user:${userId}`, variant, {
      ttl,
      tags: ["experiment", experimentId],
    }),

  // Cache geo-based content
  getGeoContent: (country: string, contentKey: string) =>
    edgeCache.get(`geo:${country}:${contentKey}`),

  setGeoContent: (
    country: string,
    contentKey: string,
    content: any,
    ttl = 7200,
  ) =>
    edgeCache.set(`geo:${country}:${contentKey}`, content, {
      ttl,
      tags: ["geo", country],
    }),

  // Clear user-specific cache
  clearUserCache: (userId: string) =>
    edgeCache.deleteByTags([`user:${userId}`]),

  // Clear experiment cache
  clearExperimentCache: (experimentId: string) =>
    edgeCache.deleteByTags([experimentId]),

  // Clear geo cache
  clearGeoCache: (country?: string) =>
    country
      ? edgeCache.deleteByTags([country])
      : edgeCache.deleteByTags(["geo"]),
};

// Export cache instance for advanced usage
export { EdgeCache };
