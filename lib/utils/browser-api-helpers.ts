/**
 * Type-safe browser API helpers
 * SSR-safe access to browser globals
 */

export function safeWindowAccess<T>(accessor: () => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return accessor();
  } catch {
    return fallback;
  }
}

export function safeDocumentAccess<T>(accessor: () => T, fallback: T): T {
  if (typeof document === "undefined") return fallback;
  try {
    return accessor();
  } catch {
    return fallback;
  }
}

export function safeNavigatorAccess<T>(accessor: () => T, fallback: T): T {
  if (typeof navigator === "undefined") return fallback;
  try {
    return accessor();
  } catch {
    return fallback;
  }
}

// Type-safe property access
export function safePropertyAccess<
  T extends Record<string, unknown>,
  K extends keyof T,
>(obj: T | undefined, key: K, fallback: T[K]): T[K] {
  if (!obj || typeof obj !== "object") return fallback;
  return obj[key] ?? fallback;
}

// Safe object indexing
export function safeObjectAccess<T>(
  obj: Record<string, T> | undefined,
  key: string,
  fallback: T,
): T {
  if (!obj || typeof obj !== "object") return fallback;
  return obj[key] ?? fallback;
}

// ===== PERFORMANCE API HELPERS =====

// Safe Performance API access
export function safePerformanceAccess<T>(
  accessor: (perf: Performance) => T,
  fallback: T,
): T {
  if (typeof performance === "undefined") return fallback;
  try {
    return accessor(performance);
  } catch {
    return fallback;
  }
}

// Safe Performance.memory access
export function safePerformanceMemory(): {
  used: number;
  total: number;
  limit: number;
} | null {
  return safePerformanceAccess(
    (perf) => {
      if ("memory" in perf) {
        const memory = (perf as any).memory;
        return {
          used: memory.usedJSHeapSize || 0,
          total: memory.totalJSHeapSize || 0,
          limit: memory.jsHeapSizeLimit || 0,
        };
      }
      return null;
    },
    null,
  );
}

// ===== NAVIGATOR API HELPERS =====

// Safe Navigator.connection access
export function safeNavigatorConnection(): {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} | null {
  return safeNavigatorAccess(
    () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        return {
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          rtt: connection?.rtt,
        };
      }
      return null;
    },
    null,
  );
}

// Safe Navigator.getBattery access
export function safeNavigatorBattery(): Promise<{
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
} | null> {
  return safeNavigatorAccess(
    async () => {
      if ("getBattery" in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          return {
            charging: battery?.charging ?? false,
            chargingTime: battery?.chargingTime ?? 0,
            dischargingTime: battery?.dischargingTime ?? Infinity,
            level: battery?.level ?? 1,
          };
        } catch {
          return null;
        }
      }
      return null;
    },
    Promise.resolve(null),
  );
}

// ===== PERFORMANCE ENTRY HELPERS =====

// Safe PerformanceEntry property access
export function safePerformanceEntryAccess<T>(
  entry: PerformanceEntry | unknown,
  accessor: (entry: PerformanceEntry) => T,
  fallback: T,
): T {
  if (!entry || typeof entry !== "object" || !(entry instanceof PerformanceEntry)) {
    return fallback;
  }
  try {
    return accessor(entry);
  } catch {
    return fallback;
  }
}

// Safe PerformanceEventTiming access
export function safePerformanceEventTimingAccess<T>(
  entry: PerformanceEventTiming | unknown,
  accessor: (entry: PerformanceEventTiming) => T,
  fallback: T,
): T {
  if (!entry || typeof entry !== "object" || !(entry instanceof PerformanceEventTiming)) {
    return fallback;
  }
  try {
    return accessor(entry);
  } catch {
    return fallback;
  }
}