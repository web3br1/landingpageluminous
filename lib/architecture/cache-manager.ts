/**
 * Cache Manager Pattern - Unified caching strategies and management
 *
 * Eliminates code duplication in cache operations by providing consistent patterns
 * for different cache backends (in-memory, Redis, CDN) and cache strategies.
 */

import { z } from "zod";

// ===== CACHE CONFIGURATION SCHEMAS =====

export enum CacheBackend {
  MEMORY = "memory",
  REDIS = "redis",
  CDN = "cdn",
}

export const CacheConfigSchema = z.object({
  backend: z.nativeEnum(CacheBackend).default(CacheBackend.MEMORY),
  ttl: z.number().min(0).default(300), // 5 minutes default
  maxSize: z.number().min(0).optional(),
  namespace: z.string().default("default"),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

// ===== CACHE OPERATION RESULTS =====

export interface CacheResult<T = unknown> {
  success: true;
  data: T;
  fromCache?: boolean; // Only for get operations
}

export interface CacheError {
  success: false;
  error: string;
  code: string;
}

export type CacheOperationResult<T = unknown> = CacheResult<T> | CacheError;

// ===== CACHE BACKEND INTERFACE =====

export interface CacheBackendInterface {
  get<T>(key: string): Promise<CacheOperationResult<T>>;
  set<T>(key: string, value: T, ttl?: number): Promise<CacheOperationResult<void>>;
  delete(key: string): Promise<CacheOperationResult<void>>;
  clear(): Promise<CacheOperationResult<void>>;
  close(): Promise<void>;
}

// ===== SIMPLE CACHE MANAGER =====

export class CacheManager {
  private backends: Map<string, CacheBackendInterface> = new Map();
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Create a new cache with specific configuration
   */
  createCache(name: string, config: CacheConfig): CacheInstance {
    let backend: CacheBackendInterface;

    switch (config.backend) {
      case CacheBackend.MEMORY:
        backend = new MemoryCacheBackend(config);
        break;
      case CacheBackend.REDIS:
        backend = new RedisCacheBackend(config);
        break;
      case CacheBackend.CDN:
        backend = new CDNCachingBackend(config);
        break;
      default:
        throw new Error(`Unsupported cache backend: ${config.backend}`);
    }

    this.backends.set(name, backend);
    return new CacheInstance(backend, config, name);
  }

  /**
   * Get all registered cache names
   */
  getCacheNames(): string[] {
    return Array.from(this.backends.keys());
  }

  /**
   * Close all cache backends
   */
  async closeAll(): Promise<void> {
    const backends = Array.from(this.backends.values());
    this.backends.clear();

    await Promise.all(backends.map(backend => backend.close()));
  }
}

// ===== CACHE INSTANCE =====

export class CacheInstance {
  constructor(
    private backend: CacheBackendInterface,
    private config: CacheConfig,
    private name: string
  ) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<CacheOperationResult<T>> {
    try {
      return await this.backend.get<T>(key);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown cache error",
        code: "CACHE_GET_ERROR",
      };
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<CacheOperationResult<void>> {
    const effectiveTtl = ttl ?? this.config.ttl;

    try {
      return await this.backend.set(key, value, effectiveTtl);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown cache error",
        code: "CACHE_SET_ERROR",
      };
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<CacheOperationResult<T>> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached.success) {
      return cached;
    }

    // If not in cache, fetch and cache
    try {
      const data = await fetcher();
      await this.set(key, data, ttl);

      return {
        success: true,
        data,
        fromCache: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch data",
        code: "FETCH_ERROR",
      };
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<CacheOperationResult<void>> {
    try {
      return await this.backend.delete(key);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown cache error",
        code: "CACHE_DELETE_ERROR",
      };
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<CacheOperationResult<void>> {
    try {
      return await this.backend.clear();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown cache error",
        code: "CACHE_CLEAR_ERROR",
      };
    }
  }
}

// ===== MEMORY CACHE BACKEND =====

interface CacheEntry {
  value: unknown;
  expiresAt: number;
  createdAt: number;
}

class MemoryCacheBackend implements CacheBackendInterface {
  private cache = new Map<string, CacheEntry>();

  constructor(private config: CacheConfig) {}

  async get<T>(key: string): Promise<CacheOperationResult<T>> {
    const entry = this.cache.get(key);

    if (!entry) {
      return {
        success: false,
        error: "Key not found",
        code: "NOT_FOUND",
      };
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return {
        success: false,
        error: "Key expired",
        code: "EXPIRED",
      };
    }

    return {
      success: true,
      data: entry.value as T,
      fromCache: true,
    };
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<CacheOperationResult<void>> {
    const effectiveTtl = ttl ?? this.config.ttl;
    const expiresAt = Date.now() + (effectiveTtl * 1000);

    const entry: CacheEntry = {
      value,
      expiresAt,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);

    return { success: true, data: undefined };
  }

  async delete(key: string): Promise<CacheOperationResult<void>> {
    this.cache.delete(key);
    return { success: true, data: undefined };
  }

  async clear(): Promise<CacheOperationResult<void>> {
    this.cache.clear();
    return { success: true, data: undefined };
  }

  async close(): Promise<void> {
    this.cache.clear();
  }
}

// Placeholder for Redis backend
class RedisCacheBackend implements CacheBackendInterface {
  constructor(private config: CacheConfig) {}

  async get<T>(key: string): Promise<CacheOperationResult<T>> {
    throw new Error("Redis backend not implemented - requires Redis client");
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<CacheOperationResult<void>> {
    throw new Error("Redis backend not implemented - requires Redis client");
  }

  async delete(key: string): Promise<CacheOperationResult<void>> {
    throw new Error("Redis backend not implemented - requires Redis client");
  }

  async clear(): Promise<CacheOperationResult<void>> {
    throw new Error("Redis backend not implemented - requires Redis client");
  }

  async close(): Promise<void> {
    // Close Redis connection
  }
}

// Placeholder for CDN backend
class CDNCachingBackend implements CacheBackendInterface {
  constructor(private config: CacheConfig) {}

  async get<T>(key: string): Promise<CacheOperationResult<T>> {
    throw new Error("CDN backend not implemented - requires CDN client");
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<CacheOperationResult<void>> {
    throw new Error("CDN backend not implemented - requires CDN client");
  }

  async delete(key: string): Promise<CacheOperationResult<void>> {
    throw new Error("CDN backend not implemented - requires CDN client");
  }

  async clear(): Promise<CacheOperationResult<void>> {
    throw new Error("CDN backend not implemented - requires CDN client");
  }

  async close(): Promise<void> {
    // Close CDN connections
  }
}

// ===== GLOBAL CACHE MANAGER INSTANCE =====

export const cacheManager = CacheManager.getInstance();

// ===== UTILITY FUNCTIONS =====

/**
 * Create a namespaced cache
 */
export function createNamespacedCache(namespace: string, config: Partial<CacheConfig> = {}): CacheInstance {
  const fullConfig = CacheConfigSchema.parse({
    ...config,
    namespace,
  });

  return cacheManager.createCache(`${namespace}_${Date.now()}`, fullConfig);
}

/**
 * Cache decorator for functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: CacheInstance,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : `func_${fn.name}_${JSON.stringify(args)}`;
    return cache.getOrSet(key, () => fn(...args), ttl);
  }) as T;
}
