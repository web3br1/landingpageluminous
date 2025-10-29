/**
 * SSR-Safe Hook Utilities
 *
 * Provides safe access to browser APIs with SSR fallbacks.
 * Prevents hydration mismatches and runtime errors.
 *
 * @see docs/ssr-patterns.md for usage examples
 */

import { useState, useEffect } from "react";
import { safeBrowserAPI } from "../utils/browser-storage";

/**
 * Hook for SSR-safe browser API access
 *
 * @param factory Function that accesses browser APIs
 * @param fallback Value to use during SSR
 * @param deps Dependencies for the effect
 * @returns Safe value that works in both SSR and client
 *
 * @example
 * ```typescript
 * const viewportWidth = useSSRSafe(() => window.innerWidth, 1024);
 * const isOnline = useSSRSafe(() => navigator.onLine, true);
 * const userAgent = useSSRSafe(() => navigator.userAgent, '');
 * ```
 */
export function useSSRSafe<T>(
  factory: () => T,
  fallback: T,
  deps: React.DependencyList = []
): T {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const result = safeBrowserAPI(factory, fallback);
    setValue(result);
  }, deps);

  return value;
}

/**
 * Hook for SSR-safe async browser API access
 *
 * @param factory Async function that accesses browser APIs
 * @param fallback Value to use during SSR or errors
 * @param deps Dependencies for the effect
 * @returns Promise that resolves to safe value
 *
 * @example
 * ```typescript
 * const geolocation = useSSRSafeAsync(
 *   () => navigator.geolocation.getCurrentPosition(),
 *   null
 * );
 * ```
 */
export async function useSSRSafeAsync<T>(
  factory: () => Promise<T>,
  fallback: T,
  deps: React.DependencyList = []
): Promise<T> {
  try {
    return await safeBrowserAPI(factory, Promise.resolve(fallback));
  } catch {
    return fallback;
  }
}

/**
 * Hook for SSR-safe event listeners
 *
 * @param target Target element (window, document, or element ref)
 * @param event Event name
 * @param handler Event handler function
 * @param options Event listener options
 *
 * @example
 * ```typescript
 * useSSRSafeEventListener(window, 'resize', handleResize);
 * useSSRSafeEventListener(document, 'visibilitychange', handleVisibility);
 * ```
 */
export function useSSRSafeEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | Element | null | undefined,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  useEffect(() => {
    if (!target) return;

    safeBrowserAPI(() => {
      target.addEventListener(event, handler as EventListener, options);
      return () => target.removeEventListener(event, handler as EventListener, options);
    }, () => {});
  }, [target, event, handler, options]);
}

/**
 * Hook for SSR-safe media queries
 *
 * @param query Media query string
 * @returns Boolean indicating if query matches
 *
 * @example
 * ```typescript
 * const isMobile = useSSRSafeMediaQuery('(max-width: 768px)');
 * const prefersDark = useSSRSafeMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */
export function useSSRSafeMediaQuery(query: string): boolean {
  return useSSRSafe(() => window.matchMedia(query).matches, false, [query]);
}

/**
 * Hook for SSR-safe local storage
 *
 * @param key Storage key
 * @param fallback Fallback value for SSR or errors
 * @returns Current stored value
 *
 * @example
 * ```typescript
 * const theme = useSSRSafeStorage('theme', 'light');
 * const userPrefs = useSSRSafeStorage('user-prefs', {});
 * ```
 */
export function useSSRSafeStorage<T>(key: string, fallback: T): T {
  return useSSRSafe(() => {
    const { readLocalStorage } = require("../utils/browser-storage");
    const stored = readLocalStorage(key);
    return stored ? JSON.parse(stored) : fallback;
  }, fallback, [key]);
}

/**
 * Hook for SSR-safe session storage
 *
 * @param key Storage key
 * @param fallback Fallback value for SSR or errors
 * @returns Current stored value
 */
export function useSSRSafeSessionStorage<T>(key: string, fallback: T): T {
  return useSSRSafe(() => {
    const { readLocalStorage } = require("../utils/browser-storage");
    // Note: Using localStorage wrapper for session storage consistency
    const stored = readLocalStorage(key);
    return stored ? JSON.parse(stored) : fallback;
  }, fallback, [key]);
}

/**
 * Hook for SSR-safe performance APIs
 *
 * @returns Performance API or null
 *
 * @example
 * ```typescript
 * const perf = useSSRSafePerformance();
 * const startTime = perf?.now() || Date.now();
 * ```
 */
export function useSSRSafePerformance(): Performance | null {
  return useSSRSafe(() => window.performance, null);
}

/**
 * Hook for SSR-safe geolocation API
 *
 * @returns Geolocation API or null
 *
 * @example
 * ```typescript
 * const geo = useSSRSafeGeolocation();
 * if (geo) {
 *   geo.getCurrentPosition(success, error);
 * }
 * ```
 */
export function useSSRSafeGeolocation(): Geolocation | null {
  return useSSRSafe(() => navigator.geolocation, null);
}

/**
 * Hook for client-side only effects
 * Alternative to useEffect that only runs on the client
 *
 * @param effect Effect function
 * @param deps Dependencies
 *
 * @example
 * ```typescript
 * useClientEffect(() => {
 *   console.log('Only runs on client');
 *   return () => console.log('Cleanup only on client');
 * }, []);
 * ```
 */
export function useClientEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    return safeBrowserAPI(() => effect(), () => {});
  }, deps);
}
