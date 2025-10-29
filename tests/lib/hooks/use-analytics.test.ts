import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useSectionTracking,
  useScrollTracking,
  useExperimentTracking,
} from "@/lib/hooks/use-analytics";

// Mock dependencies
vi.mock("@/lib/analytics-core", () => ({
  analytics: {
    trackView: vi.fn(),
    trackScroll: vi.fn(),
    trackExperiment: vi.fn(),
    trackCtaClick: vi.fn(),
    trackSubmit: vi.fn(),
    trackTimeOnPage: vi.fn(),
    init: vi.fn(),
  },
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    getExperimentVariant: vi.fn(() => "test_variant"),
    trackConversion: vi.fn(),
  },
}));

describe("useSectionTracking hook", () => {
  let observeMock: any;
  let unobserveMock: any;
  let mockObserver: any;

  beforeEach(() => {
    observeMock = vi.fn();
    unobserveMock = vi.fn();

    // Use the global mock but ensure it behaves as expected for these tests
    const originalObserve = (global.IntersectionObserver as any).prototype
      .observe;
    mockObserver = {
      observe: observeMock,
      unobserve: unobserveMock,
      disconnect: vi.fn(),
    };

    // Override the observe method for these specific tests
    (global.IntersectionObserver as any).prototype.observe = observeMock;

    // Mock getElementById
    document.getElementById = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render without crashing when element exists", () => {
    // Mock element exists
    const mockElement = document.createElement("div");
    (document.getElementById as any).mockReturnValue(mockElement);

    // Simple smoke test - just verify the hook doesn't crash
    expect(() => {
      renderHook(() => useSectionTracking("hero"));
    }).not.toThrow();
  });

  it("should render without crashing when element does not exist", () => {
    // Mock element not found
    (document.getElementById as any).mockReturnValue(null);

    // Simple smoke test - just verify the hook doesn't crash
    expect(() => {
      renderHook(() => useSectionTracking("hero"));
    }).not.toThrow();
  });
});

describe("useScrollTracking hook", () => {
  it("should render without crashing", () => {
    // Simple smoke test
    expect(() => {
      renderHook(() => useScrollTracking());
    }).not.toThrow();
  });
});

describe("useExperimentTracking hook", () => {
  it("should render without crashing", () => {
    // Simple smoke test
    expect(() => {
      renderHook(() => useExperimentTracking("hero_test", "variant_a"));
    }).not.toThrow();
  });

  it("should render without crashing with goal", () => {
    // Simple smoke test with goal parameter
    expect(() => {
      renderHook(() =>
        useExperimentTracking("hero_test", "variant_a", "click"),
      );
    }).not.toThrow();
  });
});
