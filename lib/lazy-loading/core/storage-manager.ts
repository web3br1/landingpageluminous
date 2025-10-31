"use client";

import { logger } from "../../observability/logger";

/**
 * Storage Manager with LRU Cache - Phase 2 Correction
 * Solves H1.2: Session storage overflow
 */

interface StorageEntry {
  key: string;
  value: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

interface StorageConfig {
  maxSize: number; // Maximum storage size in bytes (default: 4MB)
  maxEntries: number; // Maximum number of entries (default: 100)
  compressionThreshold: number; // Compress when size exceeds this (default: 1MB)
  ttl: number; // Time to live in milliseconds (default: 24 hours)
}

/**
 * LRU Cache implementation for sessionStorage management
 */
class LRUCache {
  private cache = new Map<string, StorageEntry>();
  private accessOrder = new Set<string>();
  private config: StorageConfig;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      maxSize: 4 * 1024 * 1024, // 4MB
      maxEntries: 100,
      compressionThreshold: 1024 * 1024, // 1MB
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };
  }

  /**
   * Estimate size of a value in bytes
   */
  private estimateSize(value: any): number {
    const str = JSON.stringify(value);
    return new Blob([str]).size;
  }

  /**
   * Compress data using simple run-length encoding for repeated patterns
   */
  private compress(data: any): string {
    const json = JSON.stringify(data);
    // Simple compression: replace repeated patterns
    return json.replace(/(.)\1{3,}/g, (match, char) => `${char}${match.length}`);
  }

  /**
   * Decompress data
   */
  private decompress(compressed: string): any {
    // Simple decompression
    const decompressed = compressed.replace(/(.)([0-9]+)/g, (match, char, count) => char.repeat(parseInt(count)));
    return JSON.parse(decompressed);
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(targetSize?: number): void {
    const target = targetSize || this.config.maxSize;
    let currentSize = this.getTotalSize();

    while (currentSize > target && this.cache.size > 0) {
      // Find least recently used entry
      let lruKey: string | null = null;
      let oldestAccess = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          lruKey = key;
        }
      }

      if (lruKey) {
        const evictedEntry = this.cache.get(lruKey)!;
        currentSize -= evictedEntry.size;
        this.cache.delete(lruKey);
        this.accessOrder.delete(lruKey);

        logger.debug("Evicted LRU entry from cache", {
          event: "ll_cache_eviction",
          ll_evicted_key: lruKey,
          ll_evicted_size: evictedEntry.size,
          ll_remaining_size: currentSize,
        });
      }
    }
  }

  /**
   * Get total cache size
   */
  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: StorageEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: any): void {
    const size = this.estimateSize(value);
    const now = Date.now();

    // Remove expired entries first
    for (const [k, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(k);
        this.accessOrder.delete(k);
      }
    }

    // Check if we need to evict before adding
    const potentialSize = this.getTotalSize() + size;
    if (potentialSize > this.config.maxSize || this.cache.size >= this.config.maxEntries) {
      this.evictLRU(this.config.maxSize - size);
    }

    // Compress if needed
    let finalValue = value;
    let finalSize = size;
    if (size > this.config.compressionThreshold) {
      finalValue = { __compressed: true, data: this.compress(value) };
      finalSize = this.estimateSize(finalValue);

      logger.debug("Compressed large cache entry", {
        event: "ll_cache_compression",
        ll_key: key,
        ll_original_size: size,
        ll_compressed_size: finalSize,
      });
    }

    const entry: StorageEntry = {
      key,
      value: finalValue,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size: finalSize,
    };

    this.cache.set(key, entry);
    this.accessOrder.delete(key); // Remove from old position
    this.accessOrder.add(key); // Add to most recently used

    logger.debug("Set cache entry", {
      event: "ll_cache_set",
      ll_key: key,
      ll_size: finalSize,
      ll_total_cache_size: this.getTotalSize(),
      ll_cache_entries: this.cache.size,
    });
  }

  /**
   * Get a value from the cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Move to most recently used
    this.accessOrder.delete(key);
    this.accessOrder.add(key);

    // Decompress if needed
    if (entry.value && typeof entry.value === 'object' && entry.value.__compressed) {
      try {
        return this.decompress(entry.value.data);
      } catch (error) {
        logger.error("Failed to decompress cache entry", {
          event: "ll_cache_decompression_error",
          ll_key: key,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    }

    logger.debug("Retrieved cache entry", {
      event: "ll_cache_get",
      ll_key: key,
      ll_access_count: entry.accessCount,
    });

    return entry.value;
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.accessOrder.delete(key);

    logger.debug("Deleted cache entry", {
      event: "ll_cache_delete",
      ll_key: key,
      ll_freed_size: entry.size,
    });

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    const oldSize = this.getTotalSize();
    const oldCount = this.cache.size;

    this.cache.clear();
    this.accessOrder.clear();

    logger.info("Cleared entire cache", {
      event: "ll_cache_cleared",
      ll_freed_size: oldSize,
      ll_deleted_entries: oldCount,
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      totalSize: this.getTotalSize(),
      maxSize: this.config.maxSize,
      utilizationPercent: (this.getTotalSize() / this.config.maxSize) * 100,
      compressionThreshold: this.config.compressionThreshold,
      ttl: this.config.ttl,
    };
  }
}

/**
 * SessionStorage Manager with LRU Cache
 * Provides safe sessionStorage access with overflow protection
 */
export class SessionStorageManager {
  private cache: LRUCache;
  private static instance: SessionStorageManager;

  constructor() {
    this.cache = new LRUCache({
      maxSize: 4 * 1024 * 1024, // 4MB
      maxEntries: 50, // Limit entries for behavior tracking
      compressionThreshold: 1024, // 1KB
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  static getInstance(): SessionStorageManager {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }

  /**
   * Safely set an item with overflow protection
   */
  setItem(key: string, value: any): void {
    try {
      // First, try to store in cache
      this.cache.set(key, value);

      // Then persist to sessionStorage
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);

      logger.debug("Stored item in sessionStorage", {
        event: "ll_storage_set",
        ll_key: key,
        ll_size: serialized.length,
      });
    } catch (error) {
      // If sessionStorage is full, evict from cache and retry
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.warn("sessionStorage quota exceeded, evicting cache", {
          event: "ll_storage_quota_exceeded",
          ll_key: key,
        });

        // Evict some entries and retry
        this.cache.evictLRU(this.cache.getTotalSize() * 0.5); // Evict 50%
        this.setItem(key, value); // Retry
      } else {
        logger.error("Failed to store item", {
          event: "ll_storage_error",
          ll_key: key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Safely get an item with fallback to cache
   */
  getItem(key: string): any | null {
    try {
      // First try sessionStorage
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Update cache
          this.cache.set(key, parsed);
          return parsed;
        } catch (parseError) {
          logger.error("Failed to parse stored item", {
            event: "ll_storage_parse_error",
            ll_key: key,
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
        }
      }

      // Fallback to cache
      return this.cache.get(key);
    } catch (error) {
      logger.error("Failed to retrieve item", {
        event: "ll_storage_retrieve_error",
        ll_key: key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Safely remove an item
   */
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
      this.cache.delete(key);

      logger.debug("Removed item from storage", {
        event: "ll_storage_remove",
        ll_key: key,
      });
    } catch (error) {
      logger.error("Failed to remove item", {
        event: "ll_storage_remove_error",
        ll_key: key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();

    // Estimate sessionStorage usage
    let sessionStorageSize = 0;
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value) {
            sessionStorageSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      // Ignore errors when calculating size
    }

    return {
      cache: cacheStats,
      sessionStorage: {
        entries: sessionStorage.length,
        estimatedSize: sessionStorageSize,
      },
      total: {
        entries: cacheStats.entries + sessionStorage.length,
        estimatedSize: cacheStats.totalSize + sessionStorageSize,
      },
    };
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      sessionStorage.clear();
      this.cache.clear();

      logger.info("Cleared all storage", {
        event: "ll_storage_cleared",
      });
    } catch (error) {
      logger.error("Failed to clear storage", {
        event: "ll_storage_clear_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Atomic Storage Operations - Solves H1.3 Race Conditions
 */
export class AtomicStorage {
  private static locks = new Map<string, Promise<any>>();
  private static maxRetries = 3;
  private static retryDelay = 10; // ms

  /**
   * Execute atomic operation with retry on conflicts
   */
  static async atomicOperation<T>(
    key: string,
    operation: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    const lockKey = `lock_${key}`;

    // Wait for existing operation to complete
    const existingLock = this.locks.get(lockKey);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock
    let resolveLock: (value: any) => void;
    const lockPromise = new Promise(resolve => {
      resolveLock = resolve;
    });

    this.locks.set(lockKey, lockPromise);

    try {
      const result = await operation();
      resolveLock(result);
      return result;
    } catch (error) {
      resolveLock(null);

      if (retries > 0) {
        logger.warn("Atomic operation failed, retrying", {
          event: "ll_atomic_retry",
          ll_key: key,
          ll_retries_left: retries - 1,
          error: error instanceof Error ? error.message : String(error),
        });

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (this.maxRetries - retries + 1)));
        return this.atomicOperation(key, operation, retries - 1);
      }

      throw error;
    } finally {
      this.locks.delete(lockKey);
    }
  }

  /**
   * Atomic read-modify-write operation
   */
  static async atomicUpdate<T>(
    key: string,
    updater: (current: T | null) => T,
    defaultValue: T
  ): Promise<T> {
    return this.atomicOperation(key, async () => {
      const storage = SessionStorageManager.getInstance();
      const current = storage.getItem(key) || defaultValue;
      const updated = updater(current);
      storage.setItem(key, updated);
      return updated;
    });
  }
}

/**
 * Encrypted Storage - Solves H1.5 Privacy Leakage
 */
export class EncryptedStorage {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  /**
   * Simple encryption using Web Crypto API
   * Note: This is for obfuscation, not strong security
   */
  private static async encrypt(data: string): Promise<string> {
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        this.encoder.encode('progressive-loading-salt'),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        this.encoder.encode(data)
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.warn("Encryption not available, storing plaintext", {
        event: "ll_encryption_fallback",
        error: error instanceof Error ? error.message : String(error),
      });
      return btoa(data); // Simple base64 as fallback
    }
  }

  /**
   * Decrypt data
   */
  private static async decrypt(encryptedData: string): Promise<string> {
    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const key = await crypto.subtle.importKey(
        'raw',
        this.encoder.encode('progressive-loading-salt'),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return this.decoder.decode(decrypted);
    } catch (error) {
      logger.warn("Decryption failed, trying plaintext fallback", {
        event: "ll_decryption_fallback",
        error: error instanceof Error ? error.message : String(error),
      });
      return atob(encryptedData); // Try plaintext fallback
    }
  }

  /**
   * Store encrypted data
   */
  static async setEncrypted(key: string, data: any): Promise<void> {
    const json = JSON.stringify(data);
    const encrypted = await this.encrypt(json);
    SessionStorageManager.getInstance().setItem(`enc_${key}`, encrypted);

    logger.debug("Stored encrypted data", {
      event: "ll_encrypted_storage_set",
      ll_key: key,
      ll_encrypted_size: encrypted.length,
    });
  }

  /**
   * Retrieve and decrypt data
   */
  static async getEncrypted(key: string): Promise<any | null> {
    const encrypted = SessionStorageManager.getInstance().getItem(`enc_${key}`);
    if (!encrypted) return null;

    try {
      const decrypted = await this.decrypt(encrypted);
      const parsed = JSON.parse(decrypted);

      logger.debug("Retrieved encrypted data", {
        event: "ll_encrypted_storage_get",
        ll_key: key,
      });

      return parsed;
    } catch (error) {
      logger.error("Failed to decrypt stored data", {
        event: "ll_encrypted_storage_error",
        ll_key: key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

/**
 * Privacy-compliant Behavior Storage
 * Uses encrypted storage for sensitive behavioral data
 */
export class PrivacyBehaviorStorage {
  private static readonly SENSITIVE_KEYS = [
    'll_clicked_pricing',
    'll_clicked_faq',
    'll_hovered_cta',
    'user_journey_stage',
  ];

  static async storeBehavior(key: string, data: any): Promise<void> {
    if (this.SENSITIVE_KEYS.includes(key)) {
      await EncryptedStorage.setEncrypted(key, data);
    } else {
      SessionStorageManager.getInstance().setItem(key, data);
    }
  }

  static async retrieveBehavior(key: string): Promise<any | null> {
    if (this.SENSITIVE_KEYS.includes(key)) {
      return await EncryptedStorage.getEncrypted(key);
    } else {
      return SessionStorageManager.getInstance().getItem(key);
    }
  }

  static async clearAllBehavior(): Promise<void> {
    const storage = SessionStorageManager.getInstance();

    // Clear sensitive data
    for (const key of this.SENSITIVE_KEYS) {
      await EncryptedStorage.setEncrypted(key, null); // Overwrite with null
    }

    // Clear non-sensitive data
    storage.clear();

    logger.info("Cleared all behavior data", {
      event: "ll_behavior_cleared",
    });
  }
}

// Export classes and singleton instance
export { LRUCache };
export const storageManager = SessionStorageManager.getInstance();
