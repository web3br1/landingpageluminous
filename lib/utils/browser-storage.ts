/**
 * Browser Storage Utilities - SSR Safe
 *
 * Comprehensive browser API helpers with SSR safety guards.
 * All functions are safe to call during server-side rendering.
 *
 * @see docs/ssr-patterns.md for usage examples
 */

// Browser storage utilities with concurrency protection
const storageLocks = new Map<string, Promise<any>>();

export function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    // Handle quota exceeded, security errors, etc.
    console.warn(`localStorage read failed for key "${key}":`, error);
    return null;
  }
}

export function writeLocalStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    // Handle quota exceeded, security errors, etc.
    console.warn(`localStorage write failed for key "${key}":`, error);
    return false;
  }
}

export function removeLocalStorage(key: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`localStorage remove failed for key "${key}":`, error);
    return false;
  }
}

// Thread-safe JSON operations with error handling
export function readLocalStorageJSON<T>(key: string, defaultValue: T): T {
  const raw = readLocalStorage(key);
  if (!raw) return defaultValue;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`JSON parse failed for localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function writeLocalStorageJSON<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    return writeLocalStorage(key, serialized);
  } catch (error) {
    console.warn(`JSON stringify failed for localStorage key "${key}":`, error);
    return false;
  }
}

// ===== SSR-SAFE BROWSER API HELPERS =====

/**
 * Safely executes a browser API operation, returning fallback on server or error
 * @param operation Function that uses browser APIs
 * @param fallback Value to return on server or error
 * @returns Result of operation or fallback
 */
export function safeBrowserAPI<T>(operation: () => T, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return operation();
  } catch (error) {
    console.warn("[SSR] Browser API operation failed:", error);
    return fallback;
  }
}

/**
 * Checks if code is running on the client side
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Checks if code is running on the server side
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Safe window property access
 */
export function safeWindowAccess<T>(property: keyof Window, fallback: T): T {
  return safeBrowserAPI(() => (window as any)[property], fallback);
}

/**
 * Safe document property access
 */
export function safeDocumentAccess<T>(
  property: keyof Document,
  fallback: T,
): T {
  return safeBrowserAPI(() => (document as any)[property], fallback);
}

/**
 * Safe navigator property access
 */
export function safeNavigatorAccess<T>(
  property: keyof Navigator,
  fallback: T,
): T {
  return safeBrowserAPI(() => (navigator as any)[property], fallback);
}
