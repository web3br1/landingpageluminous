/**
 * Intersection Observer - Unit Tests
 * Sprint 1 - Foundation Setup
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock logger
vi.mock("../../../lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock IntersectionObserver
let mockObserve: any;
let mockDisconnect: any;
let mockUnobserve: any;
let mockIntersectionCallback: any;

beforeEach(() => {
  mockObserve = vi.fn();
  mockDisconnect = vi.fn();
  mockUnobserve = vi.fn();

  const mockIntersectionObserver = vi.fn().mockImplementation((callback, options) => {
    mockIntersectionCallback = callback;
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: mockUnobserve,
    };
  });

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  mockIntersectionCallback = null;
});

import {
  useIntersectionObserver,
  useViewportTrigger,
  GRANULAR_THRESHOLDS,
  createIntersectionConfig,
} from "../../../lib/lazy-loading/core/intersection-observer";

describe.skip("Intersection Observer - Phase 1 (Legacy - Replaced by Simplified System)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Granular Thresholds", () => {
    it("should have all required threshold values", () => {
      expect(GRANULAR_THRESHOLDS).toEqual([
        0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0
      ]);
    });
  });

  describe("Intersection Config Creation", () => {
    it("should create config for hero priority", () => {
      const config = createIntersectionConfig("hero");

      expect(config).toEqual({
        rootMargin: "100px",
        thresholds: GRANULAR_THRESHOLDS,
        triggerOnce: true,
      });
    });

    it("should create config for early priority", () => {
      const config = createIntersectionConfig("early");

      expect(config).toEqual({
        rootMargin: "200px",
        thresholds: GRANULAR_THRESHOLDS,
        triggerOnce: true,
      });
    });

    it("should create config for deferred priority", () => {
      const config = createIntersectionConfig("deferred");

      expect(config).toEqual({
        rootMargin: "50px",
        thresholds: [0.3, 0.5, 0.8],
        triggerOnce: true,
      });
    });
  });

  describe("useIntersectionObserver Hook", () => {
    it("should initialize IntersectionObserver with correct config", () => {
      const TestComponent = () => {
        const { ref } = useIntersectionObserver({
          rootMargin: "50px",
          thresholds: [0.1, 0.5],
        }, "test-section");

        return <div ref={ref} data-testid="observed">Test</div>;
      };

      render(<TestComponent />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          rootMargin: "50px",
          threshold: [0.1, 0.5],
        }
      );

      expect(mockObserve).toHaveBeenCalled();
    });

    it("should handle unsupported IntersectionObserver", () => {
      // Temporarily remove IntersectionObserver
      delete (window as any).IntersectionObserver;

      const TestComponent = () => {
        const { isSupported, ref } = useIntersectionObserver({}, "test-section");

        return (
          <div>
            <div data-testid="supported">{isSupported ? "yes" : "no"}</div>
            <div ref={ref} data-testid="observed">Test</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId("supported")).toHaveTextContent("no");

      // Restore
      (window as any).IntersectionObserver = mockIntersectionObserver;
    });

    it("should call IntersectionObserver callback with entry data", async () => {
      const TestComponent = () => {
        const { state } = useIntersectionObserver({}, "test-section");
        return <div data-testid="ratio">{state.intersectionRatio}</div>;
      };

      render(<TestComponent />);

      // Simulate intersection callback
      expect(mockIntersectionCallback).toBeDefined();

      mockIntersectionCallback([{
        isIntersecting: true,
        intersectionRatio: 0.5,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: {} as DOMRectReadOnly,
      }]);

      await waitFor(() => {
        expect(screen.getByTestId("ratio")).toHaveTextContent("0.5");
      });
    });
  });

  describe("useViewportTrigger Hook", () => {
    it("should trigger when intersection ratio >= 0.1", async () => {
      const onTrigger = vi.fn();

      const TestComponent = () => {
        const { ref, isTriggered } = useViewportTrigger("test-section", onTrigger);

        return (
          <div>
            <div ref={ref} data-testid="triggered">{isTriggered ? "yes" : "no"}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Simulate intersection above threshold
      const callback = mockIntersectionCallback;
      callback([{
        isIntersecting: true,
        intersectionRatio: 0.3,
      }]);

      await waitFor(() => {
        expect(onTrigger).toHaveBeenCalledWith(0.3);
        expect(screen.getByTestId("triggered")).toHaveTextContent("yes");
      });
    });

    it("should not trigger when intersection ratio < 0.1", async () => {
      const onTrigger = vi.fn();

      const TestComponent = () => {
        const { ref, isTriggered } = useViewportTrigger("test-section", onTrigger);

        return (
          <div>
            <div ref={ref} data-testid="triggered">{isTriggered ? "yes" : "no"}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Simulate intersection below threshold
      const callback = mockIntersectionCallback;
      callback([{
        isIntersecting: true,
        intersectionRatio: 0.05,
      }]);

      await waitFor(() => {
        expect(onTrigger).not.toHaveBeenCalled();
        expect(screen.getByTestId("triggered")).toHaveTextContent("no");
      });
    });

    it("should not trigger when not intersecting", async () => {
      const onTrigger = vi.fn();

      const TestComponent = () => {
        const { ref, isTriggered } = useViewportTrigger("test-section", onTrigger);

        return (
          <div>
            <div ref={ref} data-testid="triggered">{isTriggered ? "yes" : "no"}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Simulate no intersection
      const callback = mockIntersectionCallback;
      callback([{
        isIntersecting: false,
        intersectionRatio: 0,
      }]);

      await waitFor(() => {
        expect(onTrigger).not.toHaveBeenCalled();
        expect(screen.getByTestId("triggered")).toHaveTextContent("no");
      });
    });
  });

  describe("Cleanup", () => {
    it("should disconnect observer on unmount", () => {
      const { unmount } = render(
        <div>
          <TestObserverComponent />
        </div>
      );

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});

// Helper component for testing
const TestObserverComponent = () => {
  const { ref } = useIntersectionObserver({}, "test-section");
  return <div ref={ref} data-testid="observed">Test</div>;
};
