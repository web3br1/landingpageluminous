// SSR Adapter - Single Responsibility: Handle server/client environment differences
// Infrastructure Layer Service implementing ISSRAdapter

import { ISSRAdapter, EnvironmentInfo } from "../ports";

export class SSRAdapter implements ISSRAdapter {
  isServerContext(): boolean {
    return typeof window === "undefined";
  }

  isClientContext(): boolean {
    return typeof window !== "undefined";
  }

  getEnvironmentInfo(): EnvironmentInfo {
    const isServer = this.isServerContext();

    return {
      isServer,
      isClient: !isServer,
      isDevelopment: process.env.NODE_ENV === "development",
      isProduction: process.env.NODE_ENV === "production",
      nodeEnv: process.env.NODE_ENV || "development",
    };
  }

  // Utility methods for safe environment-specific operations

  safeWindowAccess<T>(operation: () => T, fallback: T): T {
    if (this.isServerContext()) {
      return fallback;
    }

    try {
      return operation();
    } catch (error) {
      console.warn("Window access failed, using fallback:", error);
      return fallback;
    }
  }

  safeLocalStorageAccess<T>(key: string, fallback: T): T {
    return this.safeWindowAccess(() => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (error) {
        console.warn("LocalStorage access failed:", error);
        return fallback;
      }
    }, fallback);
  }

  safeSessionStorageAccess<T>(key: string, fallback: T): T {
    return this.safeWindowAccess(() => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (error) {
        console.warn("SessionStorage access failed:", error);
        return fallback;
      }
    }, fallback);
  }

  // Safe async operations that work on both server and client
  safeAsyncOperation<T>(
    operation: () => Promise<T>,
    fallback: T,
    context: string = "unknown",
  ): Promise<T> {
    if (this.isServerContext()) {
      // On server, return fallback immediately for client-only operations
      console.log(`SSR: Skipping client-only operation in ${context}`);
      return Promise.resolve(fallback);
    }

    return operation().catch((error) => {
      console.warn(`Client operation failed in ${context}:`, error);
      return fallback;
    });
  }

  // Check if we're in a static generation context
  isStaticGeneration(): boolean {
    return (
      this.isServerContext() &&
      process.env.NEXT_PHASE === "phase-production-build"
    );
  }

  // Check if we're in ISR context
  isISR(): boolean {
    return this.isServerContext() && !this.isStaticGeneration();
  }

  // Safe timeout that respects SSR
  safeTimeout(callback: () => void, delay: number): () => void {
    if (this.isServerContext()) {
      // On server, don't schedule timeouts
      return () => {};
    }

    const id = setTimeout(callback, delay);
    return () => clearTimeout(id);
  }

  // Safe interval that respects SSR
  safeInterval(callback: () => void, delay: number): () => void {
    if (this.isServerContext()) {
      // On server, don't schedule intervals
      return () => {};
    }

    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }

  // Safe event listener that respects SSR
  safeAddEventListener(
    element: Element | Window | Document,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): () => void {
    if (this.isServerContext()) {
      return () => {};
    }

    try {
      element.addEventListener(type, listener, options);
      return () => element.removeEventListener(type, listener, options);
    } catch (error) {
      console.warn("Failed to add event listener:", error);
      return () => {};
    }
  }

  // Safe IntersectionObserver that respects SSR
  safeIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ): IntersectionObserver | null {
    if (this.isServerContext() || !window.IntersectionObserver) {
      return null;
    }

    try {
      return new IntersectionObserver(callback, options);
    } catch (error) {
      console.warn("Failed to create IntersectionObserver:", error);
      return null;
    }
  }

  // Safe ResizeObserver that respects SSR
  safeResizeObserver(callback: ResizeObserverCallback): ResizeObserver | null {
    if (this.isServerContext() || !window.ResizeObserver) {
      return null;
    }

    try {
      return new ResizeObserver(callback);
    } catch (error) {
      console.warn("Failed to create ResizeObserver:", error);
      return null;
    }
  }

  // Safe requestAnimationFrame that respects SSR
  safeRequestAnimationFrame(callback: () => void): number | null {
    if (this.isServerContext() || !window.requestAnimationFrame) {
      return null;
    }

    try {
      return window.requestAnimationFrame(callback);
    } catch (error) {
      console.warn("Failed to schedule animation frame:", error);
      return null;
    }
  }

  // Safe cancelAnimationFrame that respects SSR
  safeCancelAnimationFrame(id: number | null): void {
    if (this.isServerContext() || !window.cancelAnimationFrame || id === null) {
      return;
    }

    try {
      window.cancelAnimationFrame(id);
    } catch (error) {
      console.warn("Failed to cancel animation frame:", error);
    }
  }

  // Environment-specific console logging
  safeConsoleLog(level: "log" | "warn" | "error", ...args: unknown[]): void {
    if (this.isServerContext()) {
      // On server, use console with SSR prefix
      console[level]("[SSR]", ...args);
    } else {
      // On client, use console normally
      console[level](...args);
    }
  }

  // Safe JSON serialization that handles circular references
  safeStringify(obj: unknown, fallback: string = "{}"): string {
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.warn("Failed to stringify object, using fallback:", error);
      return fallback;
    }
  }

  // Safe JSON parsing with error handling
  safeParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.warn("Failed to parse JSON, using fallback:", error);
      return fallback;
    }
  }
}
