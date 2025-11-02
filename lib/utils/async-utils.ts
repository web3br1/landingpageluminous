/**
 * Async Utilities - Promise-based utilities and helpers
 * Extracted from advanced-utils.ts to reduce file size
 */

/**
 * Add timeout to a promise
 */
export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

/**
 * Safe async execution with fallback
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  timeoutMs?: number
): Promise<T> {
  try {
    const promise = operation();
    if (timeoutMs) {
      return await timeout(promise, timeoutMs);
    }
    return await promise;
  } catch (error) {
    console.warn("[safeExecute] Operation failed:", error);
    return fallback;
  }
}

/**
 * Retry async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce promise-returning functions
 */
export function createDebounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: unknown[]) => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }) as T;
}

/**
 * Throttle async functions
 */
export function createThrottleAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  let pendingPromise: Promise<unknown> | null = null;

  return ((...args: unknown[]) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      pendingPromise = fn(...args);
      return pendingPromise;
    }

    return pendingPromise || Promise.resolve(undefined);
  }) as T;
}
