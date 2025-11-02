/**
 * SSR-Safe React Hooks
 * Provides hooks that work safely in both SSR and client environments
 */

import { useEffect, useState, useCallback } from "react";
import { isClient } from "../utils/browser-storage";

/**
 * Hook that provides SSR-safe access to browser APIs
 * Delays execution until client-side hydration is complete
 */
export function useSSRSafe<T>(
  initializer: () => T,
  fallback: T
): T {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    if (isClient()) {
      try {
        const result = initializer();
        setValue(result);
      } catch (error) {
        console.warn("useSSRSafe: Error initializing value:", error);
      }
    }
  }, []);

  return value;
}

/**
 * Hook for SSR-safe event listeners
 * Only adds listeners on the client side
 */
export function useSSRSafeEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  useEffect(() => {
    if (!isClient()) return;

    const eventHandler = (e: WindowEventMap[K]) => {
      try {
        handler(e);
      } catch (error) {
        console.warn(`useSSRSafeEventListener: Error in ${event} handler:`, error);
      }
    };

    window.addEventListener(event, eventHandler, options);

    return () => {
      window.removeEventListener(event, eventHandler, options);
    };
  }, [event, handler, options]);
}

/**
 * Hook for SSR-safe IntersectionObserver
 */
export function useSSRSafeIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isClient() || !window.IntersectionObserver) {
      setObserver(null);
      return;
    }

    try {
      const obs = new IntersectionObserver(callback, options);
      setObserver(obs);

      return () => {
        obs.disconnect();
      };
    } catch (error) {
      console.warn("useSSRSafeIntersectionObserver: Failed to create observer:", error);
      setObserver(null);
    }
  }, [callback, options]);

  return observer;
}

/**
 * Hook for SSR-safe localStorage access
 */
export function useSSRSafeLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient()) return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useSSRSafeLocalStorage: Error reading ${key}:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (isClient()) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`useSSRSafeLocalStorage: Error writing ${key}:`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for SSR-safe sessionStorage access
 */
export function useSSRSafeSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient()) return initialValue;

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useSSRSafeSessionStorage: Error reading ${key}:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (isClient()) {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`useSSRSafeSessionStorage: Error writing ${key}:`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for SSR-safe media queries
 */
export function useSSRSafeMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (!isClient()) return;

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