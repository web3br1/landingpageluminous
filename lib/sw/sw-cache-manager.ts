// ===== SERVICE WORKER CACHE MANAGER =====
// Wrapper for Service Worker Cache API

class SWCacheManager {
  static async openCache(cacheName: string): Promise<Cache> {
    return await caches.open(cacheName);
  }

  static async deleteOldCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    const validCaches = [
      "static-v1.0.0",
      "dynamic-v1.0.0",
      "api-v1.0.0",
      "images-v1.0.0",
      "fonts-v1.0.0",
    ];

    const deletions = cacheNames
      .filter((cacheName) => !validCaches.includes(cacheName))
      .map((cacheName) => caches.delete(cacheName));

    await Promise.all(deletions);
  }

  static async cleanupCache(
    cacheName: string,
    maxItems: number = 100,
  ): Promise<void> {
    const cache = await this.openCache(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
      // Remove oldest entries (simple LRU approximation)
      const entriesToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(
        entriesToDelete.map((request) => cache.delete(request)),
      );

      console.log(
        `[SWCacheManager] Cleaned up ${entriesToDelete.length} entries from ${cacheName}`,
      );
    }
  }

  static async getCacheSize(cacheName: string): Promise<number> {
    try {
      const cache = await this.openCache(cacheName);
      const keys = await cache.keys();
      let totalSize = 0;

      for (const request of keys) {
        try {
          const response = await cache.match(request);
          if (response) {
            const contentLength = response.headers.get("content-length");
            if (contentLength) {
              totalSize += parseInt(contentLength, 10);
            }
          }
        } catch (error) {
          // Ignore errors for individual cache entries
        }
      }

      return totalSize;
    } catch (error) {
      console.error("[SWCacheManager] Error calculating cache size:", error);
      return 0;
    }
  }

  static async invalidateCache(patterns: string[]): Promise<void> {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        if (
          patterns.some((pattern) => this.matchesPattern(request.url, pattern))
        ) {
          await cache.delete(request);
        }
      }
    }
  }

  private static matchesPattern(url: string, pattern: string): boolean {
    // Simple wildcard matching (*)
    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
    return regex.test(url);
  }
}

export { SWCacheManager };
