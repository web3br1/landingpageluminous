/**
 * Storage Utilities - Browser storage helpers with type safety
 * Extracted from advanced-utils.ts to reduce file size
 */

/**
 * Storage utility interface
 */
export interface StorageUtility {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

/**
 * Create typed storage utility
 */
export function createStorage(storage: Storage): StorageUtility {
  return {
    get<T>(key: string): T | null {
      try {
        const item = storage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },

    set<T>(key: string, value: T): void {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Storage set failed for key "${key}":`, error);
      }
    },

    remove(key: string): void {
      storage.removeItem(key);
    },

    clear(): void {
      storage.clear();
    },

    has(key: string): boolean {
      return storage.getItem(key) !== null;
    },
  };
}

/**
 * Local storage utility
 */
export function createLocalStorage(): StorageUtility {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      get: () => null,
      set: () => {},
      remove: () => {},
      clear: () => {},
      has: () => false,
    };
  }
  return createStorage(window.localStorage);
}

/**
 * Session storage utility
 */
export function createSessionStorage(): StorageUtility {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      get: () => null,
      set: () => {},
      remove: () => {},
      clear: () => {},
      has: () => false,
    };
  }
  return createStorage(window.sessionStorage);
}

/**
 * Cache utility with TTL
 */
export function createCache(options: { ttl?: number; maxSize?: number } = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // 5 min default TTL
  const cache = new Map<string, { value: unknown; timestamp: number }>();

  return {
    get<T>(key: string): T | null {
      const entry = cache.get(key);
      if (!entry) return null;

      if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        return null;
      }

      return entry.value as T;
    },

    set<T>(key: string, value: T): void {
      if (cache.size >= maxSize) {
        // Remove oldest entry (simple LRU approximation)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      cache.set(key, { value, timestamp: Date.now() });
    },

    remove(key: string): void {
      cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },

    has(key: string): boolean {
      const entry = cache.get(key);
      if (!entry) return false;

      if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        return false;
      }

      return true;
    },

    size(): number {
      // Clean expired entries
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > ttl) {
          cache.delete(key);
        }
      }
      return cache.size;
    },
  };
}

/**
 * IndexedDB-like persistent cache (simplified)
 */
export function createPersistentCache(dbName: string = 'app-cache') {
  // Simplified implementation - in production would use IndexedDB
  const storage = createLocalStorage();
  const cacheKey = `persistent-cache-${dbName}`;

  return {
    async get<T>(key: string): Promise<T | null> {
      const cache = storage.get<Record<string, { value: T; timestamp: number }>>(cacheKey) || {};
      const entry = cache[key];

      if (!entry || Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) { // 24h TTL
        if (entry) {
          delete cache[key];
          storage.set(cacheKey, cache);
        }
        return null;
      }

      return entry.value;
    },

    async set<T>(key: string, value: T): Promise<void> {
      const cache = storage.get<Record<string, { value: T; timestamp: number }>>(cacheKey) || {};
      cache[key] = { value, timestamp: Date.now() };
      storage.set(cacheKey, cache);
    },

    async remove(key: string): Promise<void> {
      const cache = storage.get<Record<string, unknown>>(cacheKey) || {};
      delete cache[key];
      storage.set(cacheKey, cache);
    },

    async clear(): Promise<void> {
      storage.remove(cacheKey);
    },
  };
}
