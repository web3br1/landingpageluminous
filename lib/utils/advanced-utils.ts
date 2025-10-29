// ===== ADVANCED UTILITIES =====
// Utilitários técnicos avançados para design system

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChapterId,
  HSLString,
  AnimationID,
  TokenName,
} from "../types/design-system";

// ===== TYPE-SAFE UTILITIES =====

/** Branded type utilities */
export const Brand = {
  /** Create a branded ChapterID */
  chapterId: (id: string): ChapterId => {
    if (!isChapterId(id)) {
      throw new Error(`Invalid chapter ID: ${id}`);
    }
    return id as ChapterId;
  },

  /** Create a branded AnimationID */
  animationId: (id: string): AnimationID =>
    `${id}_${Date.now()}` as AnimationID,

  /** Create a branded TokenName */
  tokenName: (name: string): TokenName => name as TokenName,
} as const;

/** Type guard for ChapterId */
export function isChapterId(value: unknown): value is ChapterId {
  return (
    typeof value === "string" &&
    [
      "hero",
      "howItWorks",
      "useCases",
      "features",
      "pricing",
      "ctaFinal",
    ].includes(value)
  );
}

/** Type guard for HSL string */
export function isHSLString(value: unknown): value is HSLString {
  if (typeof value !== "string") return false;

  const match = value.match(/^hsl\((\d+), (\d+)%, (\d+)%\)$/);
  if (!match) return false;

  const [, hue] = match;
  const hueValue = parseInt(hue, 10);
  return hueValue >= 0 && hueValue <= 360;
}

// ===== MEMORY MANAGEMENT =====

/** WeakMap-based cache for expensive computations */
class ComputationCache<T extends object, R> {
  private cache = new WeakMap<T, R>();
  private computeFn: (key: T) => R;

  constructor(computeFn: (key: T) => R) {
    this.computeFn = computeFn;
  }

  get(_key: T): R {
    if (!this.cache.has(_key)) {
      this.cache.set(_key, this.computeFn(_key));
    }
    return this.cache.get(_key)!;
  }

  clear(): void {
    this.cache = new WeakMap();
  }
}

/** Cached token computation */
export const tokenCache = new ComputationCache(
  (input: { chapter: ChapterId; component: string }) => {
    // Expensive computation here
    return {
      colors: generateColorsForChapter(input.chapter),
      spacing: getSpacingForComponent(input.component),
      animation: getAnimationForComponent(input.component),
    };
  },
);

// ===== ADVANCED HOOKS =====

/** Hook for debounced values */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/** Hook for debounced callbacks */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (..._args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(..._args);
      }, delay);
    },
    [callback, delay],
  ) as T;
}

/** Hook for throttled callbacks */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const lastRan = useRef<number>(Date.now());

  return useCallback(
    (..._args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(..._args);
        lastRan.current = Date.now();
      }
    },
    [callback, delay],
  ) as T;
}

/** Hook for previous value comparison */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<{ value: T; prev: T | undefined }>({
    value,
    prev: undefined,
  });

  if (ref.current.value !== value) {
    ref.current.prev = ref.current.value;
    ref.current.value = value;
  }

  return ref.current.prev;
}

/** Hook for intersection observer with advanced options */
export function useAdvancedIntersection(
  options: IntersectionObserverInit & {
    freezeOnceVisible?: boolean;
    triggerOnce?: boolean;
  } = {},
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = false,
    triggerOnce = false,
  } = options;

  const elementRef = useRef<Element | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const frozen = entry?.isIntersecting && freezeOnceVisible;
  const triggered = entry?.isIntersecting && triggerOnce;

  const updateEntry = useCallback(
    ([entry]: IntersectionObserverEntry[]): void => {
      setEntry(entry);
    },
    [],
  );

  const createObserver = useCallback(() => {
    const node = elementRef?.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || triggered || !node) {
      return null;
    }

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateEntry, observerParams);
    observer.observe(node);

    return observer;
  }, [threshold, root, rootMargin, frozen, triggered, updateEntry]);

  useEffect(() => {
    const observer = createObserver();

    return () => {
      observer?.disconnect();
    };
  }, [createObserver]);
}

/** Hook for resize observer */
export function useResizeObserver<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}

/** Hook for media queries with SSR support */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Default to false during SSR
    if (typeof window === "undefined") {
      setMatches(false);
      return;
    }

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/** Hook for local storage with SSR safety */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}

/** Hook for session storage */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}

// ===== ADVANCED COMPUTATIONS =====

/** Memoized color generation */
const generateColorsForChapter = (
  chapter: ChapterId,
): Record<string, HSLString> => {
  const hues: Record<ChapterId, number> = {
    hero: 280,
    howItWorks: 200,
    useCases: 190,
    features: 290,
    pricing: 40,
    ctaFinal: 340,
  };

  const hue = hues[chapter];
  return {
    primary: `hsl(${hue}, 70%, 60%)`,
    subtle: `hsl(${hue}, 30%, 95%)`,
    accent: `hsl(${hue}, 50%, 85%)`,
  };
};

/** Component-specific spacing */
const getSpacingForComponent = (component: string): Record<string, string> => {
  const spacings: Record<string, Record<string, string>> = {
    hero: {
      container: "py-20 md:py-32",
      content: "max-w-4xl",
    },
    card: {
      padding: "p-6 md:p-8",
      gap: "gap-4",
    },
    section: {
      container: "py-16 md:py-24",
      content: "max-w-6xl",
    },
  };

  return spacings[component] || {};
};

/** Component-specific animations */
const getAnimationForComponent = (component: string): Record<string, any> => {
  const animations: Record<string, Record<string, any>> = {
    hero: {
      title: { duration: 600, delay: 0 },
      subtitle: { duration: 600, delay: 200 },
      cta: { duration: 400, delay: 400 },
    },
    card: {
      enter: { duration: 300, stagger: 100 },
      hover: { scale: 1.02, duration: 200 },
    },
  };

  return animations[component] || {};
};

// ===== ASYNC UTILITIES =====

/** Async timeout utility */
export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), ms),
    ),
  ]);
}

/** Retry utility with exponential backoff */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/** Batch async operations */
export async function batchAsync<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

// ===== PERFORMANCE UTILITIES =====

/** RAF-based animation frame utility */
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>(undefined);
  const previousTimeRef = useRef<number>(undefined);

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback],
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  return requestRef.current;
}

/** Memoized computation with dependencies */
export function useMemoizedComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  cache?: ComputationCache<any, T>,
): T {
  return useMemo(() => {
    if (cache) {
      // Use cache if provided
      return cache.get({ deps } as any);
    }
    return computeFn();
  }, [cache, computeFn, deps]);
}

/** Deep comparison for objects */
export function useDeepCompare<T>(value: T): T {
  const ref = useRef<T>(undefined);
  const previous = ref.current;

  const isEqual = useMemo(() => {
    return JSON.stringify(previous) === JSON.stringify(value);
  }, [value, previous]);

  useEffect(() => {
    if (!isEqual) {
      ref.current = value;
    }
  });

  return isEqual ? (previous as T) : value;
}

// ===== DEBUGGING UTILITIES =====

/** Development-only logging */
export const devLog = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[DesignSystem] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[DesignSystem] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[DesignSystem] ${message}`, ...args);
  },
};

/** Performance measurement utility */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  devLog.info(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
  return result;
}

/** Component render counter (development only) */
export function useRenderCounter(componentName: string) {
  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    devLog.info(`${componentName} rendered ${renders.current} times`);
  });
}

// ===== SSR-SAFE UTILITIES =====

/** SSR-safe window access */
export function getWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

/** SSR-safe document access */
export function getDocument(): Document | null {
  return typeof document !== "undefined" ? document : null;
}

/** SSR-safe localStorage */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore errors in SSR or when localStorage is not available
    }
  },
};

// ===== UTILITY FUNCTIONS =====

/** Generate unique ID */
export function generateId(prefix: string = "ds"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ===== STORAGE UTILITIES =====

/** Generic storage utility interface */
export interface StorageUtility<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

/** Create storage utility */
export function createStorage(storage: Storage): StorageUtility {
  return {
    get: (key: string) => {
      try {
        const item = storage.getItem(key);
        return item ? JSON.parse(item) : undefined;
      } catch {
        return undefined;
      }
    },
    set: (key: string, value: any) => {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignore storage errors
      }
    },
    remove: (key: string) => {
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    },
    clear: () => {
      try {
        storage.clear();
      } catch {
        // Ignore storage errors
      }
    },
  };
}

/** Create localStorage utility */
export function createLocalStorage(): StorageUtility {
  if (typeof window === "undefined") {
    throw new Error("localStorage is not available");
  }
  return createStorage(window.localStorage);
}

/** Create sessionStorage utility */
export function createSessionStorage(): StorageUtility {
  if (typeof window === "undefined") {
    throw new Error("sessionStorage is not available");
  }
  return createStorage(window.sessionStorage);
}

// ===== CACHE UTILITY =====

/** Cache interface */
export interface Cache<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}

/** Create memory cache with TTL support */
export function createCache(
  options: { ttl?: number; maxSize?: number } = {},
): Cache {
  const { ttl = 0, maxSize = 100 } = options;
  const cache = new Map<string, { value: any; expires?: number }>();

  const getTime = () => {
    // Use performance.now() if available (for tests), otherwise Date.now()
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    }
    return Date.now();
  };

  return {
    get: (key: string) => {
      const entry = cache.get(key);
      if (!entry) return undefined;

      if (entry.expires && getTime() > entry.expires) {
        cache.delete(key);
        return undefined;
      }

      return entry.value;
    },
    set: (key: string, value: any) => {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
      }

      cache.set(key, {
        value,
        expires: ttl > 0 ? getTime() + ttl : undefined,
      });
    },
    has: (key: string) => {
      const entry = cache.get(key);
      if (!entry) return false;

      if (entry.expires && getTime() > entry.expires) {
        cache.delete(key);
        return false;
      }

      return true;
    },
    delete: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
  };
}

// ===== DEBOUNCE & THROTTLE =====

/** Create debounced function */
export function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  }) as T;
}

/** Create throttled function */
export function createThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T {
  let lastCall = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  }) as T;
}

// ===== EVENT EMITTER =====

/** Event emitter interface */
export interface EventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  removeAllListeners(event?: string): void;
}

/** Create event emitter */
export function createEventEmitter(): EventEmitter {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    on: (event: string, listener: (...args: any[]) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener);
    },
    off: (event: string, listener: (...args: any[]) => void) => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          listeners.delete(event);
        }
      }
    },
    emit: (event: string, ...args: any[]) => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((listener) => listener(...args));
      }
    },
    removeAllListeners: (event?: string) => {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },
  };
}

// ===== QUERY STRING UTILITIES =====

/** Create query string from object */
export function createQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  }

  return searchParams.toString().replace(/\+/g, "%20");
}

/** Parse query string to object */
export function parseQueryString(
  queryString: string,
): Record<string, string | string[]> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of params.entries()) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        (result[key] as string[]).push(value);
      } else {
        result[key] = [result[key] as string, value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ===== OBJECT UTILITIES =====

/** Deep clone object */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as T;
  }

  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/** Deep equal comparison */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

// ===== ID AND SLUG UTILITIES =====

/** Create unique ID */
export function createId(prefix: string = "id"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/** Create URL-friendly slug */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD") // Normalize accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// ===== FORMATTING UTILITIES =====

/** Format currency */
export function formatCurrency(
  value: number,
  currency: string = "BRL",
  locale: string = "pt-BR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/** Format date */
export function formatDate(
  date: Date | string | number,
  locale: string = "pt-BR",
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/** Format number */
export function formatNumber(
  value: number,
  locale: string = "pt-BR",
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

// ===== ASYNC UTILITY =====

/** Sleep utility */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * clamp(factor, 0, 1);
}

/** Check if value is within range */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/** Format bytes to human readable */
export function formatBytes(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert kebab-case to camelCase */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Convert camelCase to kebab-case */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}
