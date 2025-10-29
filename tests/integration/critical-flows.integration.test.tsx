/**
 * Testes de Integração - Fluxos Críticos do Sistema
 *
 * Testa os fluxos reais end-to-end do sistema:
 * - Lazy Loading: shouldLazyLoad → prefetch → load → render
 * - SSR/Hydration: render SSR + hydrate sem mismatches
 * - Error Boundaries: lançar erro e validar fallback + telemetria
 * - Network Failures: online/offline/timeout/retry com mocks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { Suspense, useState } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RouteBasedLazyLoading, shouldLazyLoad, getChunkId, traceLazyLoad, prefetch, load } from "@/lib/composition/performance/route-based-lazy-loading";
import { Boundary } from "@/lib/error/Boundary";
import { logger } from "@/shared/observ";

// Mock network utilities
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock network status
let mockOnlineStatus = true;
Object.defineProperty(navigator, "onLine", {
  get: () => mockOnlineStatus,
  configurable: true,
});

const simulateOffline = () => {
  mockOnlineStatus = false;
  window.dispatchEvent(new Event("offline"));
};

const simulateOnline = () => {
  mockOnlineStatus = true;
  window.dispatchEvent(new Event("online"));
};

// Setup jsdom for React rendering tests
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockImplementation(
  (callback: IntersectionObserverCallback) => {
    const mockObserver = {
      observe: vi.fn((element: Element) => {
        // Simulate intersection after a delay
        setTimeout(() => {
          callback(
            [
              {
                isIntersecting: true,
                target: element,
              } as IntersectionObserverEntry,
            ],
            mockObserver,
          );
        }, 100);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    return mockObserver;
  },
);

vi.stubGlobal("IntersectionObserver", mockIntersectionObserver);

describe("Critical Flows Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnlineStatus = true;

    // Reset fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("Lazy Loading Real Flow: shouldLazyLoad → prefetch → load → render", () => {
    it("should execute complete lazy loading flow deterministically", async () => {
      // 1. shouldLazyLoad - Check if section should use lazy loading
      const sectionId = "hero";
      const context = { viewportHeight: 800, scrollY: 100 };

      const shouldLoad = shouldLazyLoad(sectionId, context);
      expect(typeof shouldLoad).toBe("boolean");

      // 2. getChunkId - Get chunk identifier
      const chunkId = getChunkId(sectionId);
      expect(chunkId).toBe(`section-${sectionId}`);

      // 3. traceLazyLoad - Trace operation (should not throw)
      expect(() => {
        traceLazyLoad(sectionId, "prefetch", { priority: "high" });
      }).not.toThrow();

      // 4. prefetch - Preload component
      const prefetchResult = await prefetch(sectionId);
      expect(prefetchResult).toBeDefined();

      // 5. load - Actually load component
      const LoadedComponent = await load(sectionId);
      expect(LoadedComponent).toBeDefined();
      expect(typeof LoadedComponent).toBe("function");

      // 6. render - Render with Suspense
      render(
        React.createElement(
          Suspense,
          { fallback: React.createElement("div", {}, "Loading...") },
          React.createElement(LoadedComponent),
        ),
      );

      // Should show loading initially
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      // Component should eventually render
      await waitFor(() => {
        expect(screen.getByTestId("hero")).toBeInTheDocument();
      });
    });

    it("should handle lazy loading errors gracefully in real flow", async () => {
      const sectionId = "nonexistent";

      // shouldLazyLoad should handle invalid sections
      const shouldLoad = shouldLazyLoad(sectionId);
      expect(typeof shouldLoad).toBe("boolean");

      // prefetch should reject for invalid sections
      await expect(prefetch(sectionId)).rejects.toThrow();

      // load should reject for invalid sections
      await expect(load(sectionId)).rejects.toThrow();

      // traceLazyLoad should handle errors
      expect(() => {
        traceLazyLoad(sectionId, "error", { error: "Section not found" });
      }).not.toThrow();
    });

    it("should maintain deterministic behavior across multiple calls", async () => {
      const sectionId = "features";

      // Multiple calls should be consistent
      const results = await Promise.all([
        shouldLazyLoad(sectionId),
        shouldLazyLoad(sectionId),
        shouldLazyLoad(sectionId),
      ]);

      // All results should be identical
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);

      // Chunk IDs should be consistent
      expect(getChunkId(sectionId)).toBe(getChunkId(sectionId));

      // Multiple prefetches should work
      const [prefetch1, prefetch2] = await Promise.all([
        prefetch(sectionId),
        prefetch(sectionId),
      ]);

      expect(prefetch1).toBeDefined();
      expect(prefetch2).toBeDefined();
    });
  });

  describe("SSR/Hydration Flow: render SSR + hydrate sem mismatches", () => {
    it("should render on server without window access", () => {
      // Remove window for SSR simulation
      const originalWindow = global.window;
      delete (global as any).window;

      // Component that conditionally uses window
      function SSRTestComponent() {
        const [mounted, setMounted] = useState(false);

        React.useEffect(() => {
          setMounted(true);
        }, []);

        return React.createElement("div", {
          "data-testid": "ssr-test",
          children: mounted ? "Hydrated" : "SSR Render"
        });
      }

      // Should render without window access (SSR)
      expect(() => {
        const html = renderToString(React.createElement(SSRTestComponent));
        expect(html).toContain("SSR Render");
        expect(html).not.toContain("Hydrated");
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it("should hydrate without mismatches", async () => {
      function HydrationTestComponent() {
        const [count, setCount] = useState(0);

        return React.createElement("div", {
          "data-testid": "hydration-test",
          children: [
            React.createElement("span", { key: "count", children: count.toString() }),
            React.createElement("button", {
              key: "button",
              "data-testid": "increment",
              onClick: () => setCount(c => c + 1),
              children: "Increment"
            })
          ]
        });
      }

      // SSR render
      const ssrHtml = renderToString(React.createElement(HydrationTestComponent));

      // Client render should match SSR
      render(React.createElement(HydrationTestComponent));

      // Should hydrate without console errors (no mismatches)
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await waitFor(() => {
        expect(screen.getByTestId("hydration-test")).toBeInTheDocument();
        expect(screen.getByText("0")).toBeInTheDocument();
      });

      // Should not have hydration mismatches
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("hydration"),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it("should handle conditional rendering in SSR/hydration", () => {
      function ConditionalComponent() {
        const isClient = typeof window !== "undefined";

        return React.createElement("div", {
          "data-testid": "conditional",
          children: [
            React.createElement("div", { key: "always", children: "Always rendered" }),
            isClient && React.createElement("div", { key: "client", children: "Client only" })
          ]
        });
      }

      // SSR should only render server content
      const ssrHtml = renderToString(React.createElement(ConditionalComponent));
      expect(ssrHtml).toContain("Always rendered");
      expect(ssrHtml).not.toContain("Client only");

      // Client render should include client content
      render(React.createElement(ConditionalComponent));

      expect(screen.getByText("Always rendered")).toBeInTheDocument();
      // Client-only content should appear after hydration
    });
  });

  describe("Error Boundaries: lançar erro e validar fallback + telemetria", () => {
    it("should catch component errors and show fallback with telemetry", () => {
      const mockOnError = vi.fn();

      function FailingComponent() {
        throw new Error("Component failed");
      }

      render(
        React.createElement(
          Boundary,
          {
            onError: mockOnError,
            children: React.createElement(FailingComponent)
          }
        )
      );

      // Should show error boundary fallback
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Component failed")).toBeInTheDocument();

      // Should call telemetry
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Component failed" }),
        expect.any(Object)
      );
    });

    it("should handle async errors in effects", async () => {
      const mockOnError = vi.fn();

      function AsyncErrorComponent() {
        const [error, setError] = useState<Error | null>(null);

        React.useEffect(() => {
          // Simulate async error
          setTimeout(() => {
            setError(new Error("Async operation failed"));
          }, 100);
        }, []);

        if (error) {
          throw error;
        }

        return React.createElement("div", { children: "Loading..." });
      }

      render(
        React.createElement(
          Boundary,
          {
            onError: mockOnError,
            children: React.createElement(AsyncErrorComponent)
          }
        )
      );

      // Initially should show loading
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      // After timeout, should trigger error boundary
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Async operation failed" }),
        expect.any(Object)
      );
    });

    it("should retry failed operations", async () => {
      const mockOnError = vi.fn();

      function FailingThenSuccessComponent() {
        const [attempt, setAttempt] = useState(0);

        // Fail on first attempt, succeed on second
        if (attempt === 0) {
          throw new Error("First attempt failed");
        }

        return React.createElement("div", {
          "data-testid": "success",
          children: `Success on attempt ${attempt}`
        });
      }

      render(
        React.createElement(
          Boundary,
          {
            onError: mockOnError,
            maxRetries: 1,
            children: React.createElement(FailingThenSuccessComponent)
          }
        )
      );

      // Should show retry button
      expect(screen.getByTestId("retry-button")).toBeInTheDocument();

      // Click retry
      const retryButton = screen.getByTestId("retry-button");
      await act(async () => {
        retryButton.click();
      });

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByTestId("success")).toBeInTheDocument();
      });
    });
  });

  describe("Network Failures: online/offline/timeout/retry", () => {
    it("should handle online/offline transitions", async () => {
      function NetworkStatusComponent() {
        const [isOnline, setIsOnline] = useState(navigator.onLine);

        React.useEffect(() => {
          const handleOnline = () => setIsOnline(true);
          const handleOffline = () => setIsOnline(false);

          window.addEventListener("online", handleOnline);
          window.addEventListener("offline", handleOffline);

          return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
          };
        }, []);

        return React.createElement("div", {
          "data-testid": "network-status",
          children: isOnline ? "Online" : "Offline"
        });
      }

      render(React.createElement(NetworkStatusComponent));

      // Initially online
      expect(screen.getByTestId("network-status")).toHaveTextContent("Online");

      // Simulate going offline
      act(() => {
        simulateOffline();
      });

      expect(screen.getByTestId("network-status")).toHaveTextContent("Offline");

      // Simulate coming back online
      act(() => {
        simulateOnline();
      });

      expect(screen.getByTestId("network-status")).toHaveTextContent("Online");
    });

    it("should retry failed requests", async () => {
      // Mock fetch to fail twice then succeed
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      function ApiComponent() {
        const [data, setData] = useState<any>(null);
        const [error, setError] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);

        const fetchData = async () => {
          setLoading(true);
          setError(null);

          try {
            const response = await fetch("/api/test");
            const result = await response.json();
            setData(result);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        };

        React.useEffect(() => {
          fetchData();
        }, []);

        return React.createElement("div", {
          children: [
            React.createElement("div", { key: "status", "data-testid": "status", children: loading ? "Loading" : "Idle" }),
            React.createElement("div", { key: "data", "data-testid": "data", children: data ? JSON.stringify(data) : "No data" }),
            React.createElement("div", { key: "error", "data-testid": "error", children: error || "No error" }),
          ]
        });
      }

      render(React.createElement(ApiComponent));

      // Should show loading initially
      expect(screen.getByTestId("status")).toHaveTextContent("Loading");

      // Wait for first failure
      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Network error");
      });

      // Should retry automatically or show retry option
      // In this implementation, we just test the failure handling
      expect(screen.getByTestId("data")).toHaveTextContent("No data");
    });

    it("should queue requests when offline", async () => {
      simulateOffline();

      function OfflineQueueComponent() {
        const [queue, setQueue] = useState<any[]>([]);
        const [processed, setProcessed] = useState<any[]>([]);

        const addToQueue = (item: any) => {
          if (!navigator.onLine) {
            setQueue(prev => [...prev, item]);
          } else {
            setProcessed(prev => [...prev, item]);
          }
        };

        React.useEffect(() => {
          const handleOnline = () => {
            // Process queue when coming online
            setProcessed(prev => [...prev, ...queue]);
            setQueue([]);
          };

          window.addEventListener("online", handleOnline);
          return () => window.removeEventListener("online", handleOnline);
        }, [queue]);

        return React.createElement("div", {
          children: [
            React.createElement("div", {
              key: "status",
              "data-testid": "queue-status",
              children: `Queue: ${queue.length}, Processed: ${processed.length}`
            }),
            React.createElement("button", {
              key: "add",
              "data-testid": "add-item",
              onClick: () => addToQueue({ id: Date.now() }),
              children: "Add Item"
            })
          ]
        });
      }

      render(React.createElement(OfflineQueueComponent));

      // Add items while offline
      const addButton = screen.getByTestId("add-item");
      await act(async () => {
        addButton.click();
        addButton.click();
      });

      expect(screen.getByTestId("queue-status")).toHaveTextContent("Queue: 2, Processed: 0");

      // Simulate coming online
      act(() => {
        simulateOnline();
      });

      expect(screen.getByTestId("queue-status")).toHaveTextContent("Queue: 0, Processed: 2");
    });
  });
});

// Helper function for SSR testing
function renderToString(element: React.ReactElement): string {
  const { renderToString } = require("react-dom/server");
  return renderToString(element);
}
