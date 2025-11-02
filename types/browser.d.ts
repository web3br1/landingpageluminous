// Browser API Type Declarations
// Add missing browser API types to fix TypeScript errors

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    originalDateNow?: typeof Date.now;
    originalRandom?: typeof Math.random;
    originalPerfNow?: typeof performance.now;
  }

  interface Document {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void>;
  }

  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>;
  }

  // Performance APIs
  interface PerformanceEntry {
    readonly name: string;
    readonly entryType: string;
    readonly startTime: number;
    readonly duration: number;
  }

  interface PerformanceNavigationTiming extends PerformanceEntry {
    readonly domContentLoadedEventEnd: number;
    readonly domContentLoadedEventStart: number;
    readonly domInteractive: number;
    readonly loadEventEnd: number;
    readonly loadEventStart: number;
  }

  interface PerformanceResourceTiming extends PerformanceEntry {
    readonly connectEnd: number;
    readonly connectStart: number;
    readonly domainLookupEnd: number;
    readonly domainLookupStart: number;
    readonly fetchStart: number;
    readonly redirectEnd: number;
    readonly redirectStart: number;
    readonly requestStart: number;
    readonly responseEnd: number;
    readonly responseStart: number;
    readonly secureConnectionStart: number;
  }

  interface PerformanceEventTiming extends PerformanceEntry {
    readonly processingStart: number;
    readonly target?: Node;
  }

  // Web APIs
  interface Navigator {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
    };
  }

  // Service Worker
  interface ServiceWorkerRegistration {
    readonly active: ServiceWorker | null;
    readonly installing: ServiceWorker | null;
    readonly waiting: ServiceWorker | null;
    update(): Promise<void>;
    unregister(): Promise<boolean>;
  }

  interface ServiceWorker {
    readonly scriptURL: string;
    readonly state:
      | "installing"
      | "installed"
      | "activating"
      | "activated"
      | "redundant";
    postMessage(message: unknown): void;
  }

  // Notifications
  interface NotificationOptions {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    data?: unknown;
  }

  interface NotificationPermissionCallback {
    (permission: NotificationPermission): void;
  }

  type NotificationPermission = "default" | "denied" | "granted";

  // HTML Elements
  interface HTMLImageElement {
    loading?: "lazy" | "eager";
    decoding?: "async" | "sync" | "auto";
  }

  interface HTMLLinkElement {
    relList: DOMTokenList;
  }

  // Utility functions
  function atob(encodedString: string): string;
  function btoa(rawString: string): string;
}

export {};
