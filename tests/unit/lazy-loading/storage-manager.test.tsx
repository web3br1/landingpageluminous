/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SessionStorageManager,
  AtomicStorage,
  LRUCache,
  PrivacyBehaviorStorage
} from "../../../lib/lazy-loading/core/storage-manager";

// Mock logger to avoid console output in tests
vi.mock("../../../lib/observability/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe.skip("Storage Manager - Phase 2 Corrections", () => {
  let storageManager: SessionStorageManager;

  beforeEach(() => {
    // Clear all storage before each test
    sessionStorage.clear();
    storageManager = SessionStorageManager.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe("H1.2: LRU Cache for sessionStorage overflow", () => {
    it("should evict LRU entries when cache is full", () => {
      const cache = new LRUCache({ maxSize: 20, maxEntries: 2 }); // Very small limit

      cache.set("key1", "value1"); // ~11 bytes (JSON overhead)
      cache.set("key2", "value2"); // ~11 bytes
      cache.set("key3", "value3"); // Should evict key1

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBe("value2");
      expect(cache.get("key3")).toBe("value3");
    });

    it("should compress large entries", () => {
      const cache = new LRUCache({ compressionThreshold: 50 });
      const largeValue = "a".repeat(100); // 100 chars

      cache.set("largeKey", largeValue);

      const entry = (cache as any).cache.get("largeKey");
      expect(entry.value.__compressed).toBe(true);
    });

    it("should handle TTL expiration", () => {
      vi.useFakeTimers();
      const cache = new LRUCache({ ttl: 100 }); // 100ms TTL
      cache.set("key1", "value1");

      // Fast-forward time
      vi.advanceTimersByTime(150);

      expect(cache.get("key1")).toBeNull();
      vi.useRealTimers();
    });
  });

  describe("H1.3: Atomic operations prevent race conditions", () => {
    it("should execute atomic operations sequentially", async () => {
      const results: number[] = [];

      // Start multiple atomic operations
      const promises = [
        AtomicStorage.atomicUpdate("counter", (current: number) => {
          results.push(1);
          return (current || 0) + 1;
        }, 0),
        AtomicStorage.atomicUpdate("counter", (current: number) => {
          results.push(2);
          return (current || 0) + 1;
        }, 0),
        AtomicStorage.atomicUpdate("counter", (current: number) => {
          results.push(3);
          return (current || 0) + 1;
        }, 0),
      ];

      await Promise.all(promises);

      const finalValue = storageManager.getItem("counter");
      expect(finalValue).toBe(3); // All operations completed
      expect(results).toHaveLength(3); // All operations executed
    });

    it("should retry on failure", async () => {
      let attempts = 0;

      const mockOperation = vi.fn()
        .mockImplementationOnce(() => {
          attempts++;
          throw new Error("Temporary failure");
        })
        .mockImplementationOnce(() => {
          attempts++;
          return "success";
        });

      const result = await AtomicStorage.atomicOperation("test", mockOperation, 2);
      expect(result).toBe("success");
      expect(attempts).toBe(2);
    });
  });

  describe("H1.5: Privacy encryption for sensitive data", () => {
    it("should encrypt sensitive behavior data", async () => {
      await PrivacyBehaviorStorage.storeBehavior("ll_clicked_pricing", true);

      // Verify data is encrypted (not plain text)
      const rawData = storageManager.getItem("enc_ll_clicked_pricing");
      expect(rawData).toBeDefined();
      expect(typeof rawData).toBe("string");
      expect(rawData).not.toBe("true"); // Not plain text
    });

    it("should decrypt and retrieve sensitive data", async () => {
      await PrivacyBehaviorStorage.storeBehavior("ll_hovered_cta", true);
      const retrieved = await PrivacyBehaviorStorage.retrieveBehavior("ll_hovered_cta");

      expect(retrieved).toBe(true);
    });

    it("should handle encryption failures gracefully", async () => {
      // Mock crypto.subtle to fail
      const originalCrypto = global.crypto;
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
      });

      await PrivacyBehaviorStorage.storeBehavior("ll_test_key", "test_value");

      // Should still store data (fallback to base64)
      const rawData = storageManager.getItem("enc_ll_test_key");
      expect(rawData).toBeDefined();

      // Restore crypto
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
      });
    });
  });

  describe("Storage quota handling", () => {
    it("should handle sessionStorage quota exceeded", () => {
      // Mock QuotaExceededError
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      // Should not throw, should evict cache instead
      expect(() => {
        storageManager.setItem("test", "large_value");
      }).not.toThrow();

      // Restore original
      sessionStorage.setItem = originalSetItem;
    });
  });

  describe("Storage statistics", () => {
    it("should provide accurate storage statistics", () => {
      storageManager.setItem("key1", "value1");
      storageManager.setItem("key2", "value2");

      const stats = storageManager.getStats();

      expect(stats.cache.entries).toBeGreaterThanOrEqual(2);
      expect(stats).toHaveProperty("sessionStorage.entries");
      expect(stats).toHaveProperty("total.entries");
      expect(typeof stats.total.entries).toBe("number");
    });
  });
});
