// Mocks padrão da plataforma - IntersectionObserver, ResizeObserver, etc.
// Contrato mínimo padronizado para testes consistentes

import { vi } from "vitest";

// ===== INTERSECTION OBSERVER MOCK =====
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];

  private _callback: IntersectionObserverCallback;
  private _observedElements = new Set<Element>();
  private _isObserving = false;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this._callback = callback;

    // Copia opções se fornecidas
    if (options) {
      Object.assign(this, {
        root: options.root || null,
        rootMargin: options.rootMargin || "0px",
        thresholds: Array.isArray(options.threshold)
          ? options.threshold
          : [options.threshold || 0],
      });
    }
  }

  observe(element: Element): void {
    this._observedElements.add(element);
    this._isObserving = true;

    // Simula entrada imediata para testes (pode ser controlado)
    if (typeof window !== "undefined") {
      setTimeout(() => {
        if (this._observedElements.has(element)) {
          const entry: IntersectionObserverEntry = {
            target: element,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: element.getBoundingClientRect(),
            intersectionRect: element.getBoundingClientRect(),
            rootBounds: null,
            time: Date.now(),
          };
          this._callback([entry], this);
        }
      }, 0);
    }
  }

  unobserve(element: Element): void {
    this._observedElements.delete(element);
    if (this._observedElements.size === 0) {
      this._isObserving = false;
    }
  }

  disconnect(): void {
    this._observedElements.clear();
    this._isObserving = false;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// ===== RESIZE OBSERVER MOCK =====
class MockResizeObserver implements ResizeObserver {
  private _callback: ResizeObserverCallback;
  private _observedElements = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this._callback = callback;
  }

  observe(element: Element): void {
    this._observedElements.add(element);

    // Simula resize imediato
    setTimeout(() => {
      if (this._observedElements.has(element)) {
        const entry: ResizeObserverEntry = {
          target: element,
          contentRect: element.getBoundingClientRect(),
          borderBoxSize: [
            {
              blockSize: element.clientHeight,
              inlineSize: element.clientWidth,
            },
          ],
          contentBoxSize: [
            {
              blockSize: element.clientHeight,
              inlineSize: element.clientWidth,
            },
          ],
          devicePixelContentBoxSize: [
            {
              blockSize: element.clientHeight,
              inlineSize: element.clientWidth,
            },
          ],
        };
        this._callback([entry], this);
      }
    }, 0);
  }

  unobserve(element: Element): void {
    this._observedElements.delete(element);
  }

  disconnect(): void {
    this._observedElements.clear();
  }
}

// ===== MUTATION OBSERVER MOCK =====
class MockMutationObserver implements MutationObserver {
  private _callback: MutationCallback;
  private _isObserving = false;

  constructor(callback: MutationCallback) {
    this._callback = callback;
  }

  observe(target: Node, options?: MutationObserverInit): void {
    this._isObserving = true;
    // Não simula mutações automaticamente - testes controlam quando chamar
  }

  disconnect(): void {
    this._isObserving = false;
  }

  takeRecords(): MutationRecord[] {
    return [];
  }
}

// ===== PERFORMANCE OBSERVER MOCK =====
class MockPerformanceObserver implements PerformanceObserver {
  private _callback: PerformanceObserverCallback;

  constructor(callback: PerformanceObserverCallback) {
    this._callback = callback;
  }

  observe(options?: PerformanceObserverInit): void {
    // Simula uma entrada de performance com callback correto
    setTimeout(() => {
      const entry: PerformanceEntry = {
        name: "test-performance-entry",
        entryType: "measure",
        startTime: 0,
        duration: 100,
        toJSON: () => ({}),
      };

      // Callback correto - passa um mock que tem getEntries()
      const mockList = {
        getEntries: () => [entry],
      };

      this._callback(mockList as any, this);
    }, 0);
  }

  disconnect(): void {
    // Disconnect logic
  }

  takeRecords(): PerformanceEntry[] {
    return [];
  }
}

// ===== TIMERS CONTROLADOS =====
export const mockTimers = {
  useFakeTimers: () => {
    vi.useFakeTimers();
  },

  useRealTimers: () => {
    vi.useRealTimers();
  },

  advanceTimersByTime: (ms: number) => {
    vi.advanceTimersByTime(ms);
  },

  runOnlyPendingTimers: () => {
    vi.runOnlyPendingTimers();
  },

  clearAllTimers: () => {
    vi.clearAllTimers();
  },
};

// ===== SETUP GLOBAL =====
export function setupPlatformMocks() {
  // Só configura mocks se window estiver disponível (ambiente jsdom)
  if (typeof window === "undefined") {
    return;
  }

  // IntersectionObserver
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });

  // ResizeObserver
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: MockResizeObserver,
  });

  // MutationObserver
  Object.defineProperty(window, "MutationObserver", {
    writable: true,
    configurable: true,
    value: MockMutationObserver,
  });

  // PerformanceObserver
  Object.defineProperty(window, "PerformanceObserver", {
    writable: true,
    configurable: true,
    value: MockPerformanceObserver,
  });

  // RequestIdleCallback (para SSR safety)
  Object.defineProperty(window, "requestIdleCallback", {
    writable: true,
    configurable: true,
    value: (callback: Function) => setTimeout(callback, 0),
  });

  Object.defineProperty(window, "cancelIdleCallback", {
    writable: true,
    configurable: true,
    value: (id: number) => clearTimeout(id),
  });
}

// ===== CLEANUP GLOBAL =====
export function cleanupPlatformMocks() {
  // Reset timers
  vi.clearAllTimers();
  vi.useRealTimers();

  // Reset mocks
  vi.clearAllMocks();

  // Cleanup global state if needed
  if (typeof window !== "undefined") {
    // Reset any global state that might persist
  }
}

// ===== EXPORTS =====
export {
  MockIntersectionObserver,
  MockResizeObserver,
  MockMutationObserver,
  MockPerformanceObserver,
};
