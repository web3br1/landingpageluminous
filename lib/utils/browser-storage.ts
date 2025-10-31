/**
 * Browser Storage Utilities - SSR Safe
 * Provides safe access to localStorage and sessionStorage with SSR fallbacks
 */

/**
 * Checks if we're running in a browser environment
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Checks if we're running in a server environment
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Safely reads from localStorage with SSR protection
 */
export function readLocalStorage<T = string>(key: string): T | null {
  if (!isClient()) {
    return null;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return null;

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as T;
    }
  } catch (error) {
    console.warn(`Failed to read from localStorage for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely writes to localStorage with SSR protection
 */
export function writeLocalStorage(key: string, value: any): boolean {
  if (!isClient()) {
    return false;
  }

  try {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage for key "${key}":`, error);
    return false;
  }
}

/**
 * Safely removes from localStorage with SSR protection
 */
export function removeLocalStorage(key: string): boolean {
  if (!isClient()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from localStorage for key "${key}":`, error);
    return false;
  }
}

/**
 * Safely reads from sessionStorage with SSR protection
 */
export function readSessionStorage<T = string>(key: string): T | null {
  if (!isClient()) {
    return null;
  }

  try {
    const item = window.sessionStorage.getItem(key);
    if (item === null) return null;

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as T;
    }
  } catch (error) {
    console.warn(`Failed to read from sessionStorage for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely writes to sessionStorage with SSR protection
 */
export function writeSessionStorage(key: string, value: any): boolean {
  if (!isClient()) {
    return false;
  }

  try {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
    window.sessionStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Failed to write to sessionStorage for key "${key}":`, error);
    return false;
  }
}

/**
 * Safely removes from sessionStorage with SSR protection
 */
export function removeSessionStorage(key: string): boolean {
  if (!isClient()) {
    return false;
  }

  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from sessionStorage for key "${key}":`, error);
    return false;
  }
}

/**
 * Generic browser API accessor with SSR protection
 */
export function safeBrowserAPI<T>(
  apiGetter: () => T,
  fallback: T,
  errorMessage?: string
): T {
  if (!isClient()) {
    return fallback;
  }

  try {
    return apiGetter();
  } catch (error) {
    if (errorMessage) {
      console.warn(errorMessage, error);
    }
    return fallback;
  }
}