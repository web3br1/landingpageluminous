// TODO: Expand analytics and tracking test coverage
// - Test event deduplication and throttling
// - Test offline event queuing and sync
// - Test cross-domain tracking
// - Test privacy compliance (GDPR, CCPA)
// - Test user consent management
// - Test A/B testing integration with analytics
// - Test conversion funnel tracking
// - Test user journey analytics
// - Test performance impact of tracking
// - Test error tracking and reporting
// - Test custom event tracking
// - Test e-commerce tracking (if applicable)
// - Test social media tracking
// - Test video/audio tracking
// - Test form interaction tracking
// - Test scroll depth and engagement tracking
// - Test heat map data collection
// - Test session recording integration
// - Test third-party analytics conflicts

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock gtag to prevent conflicts
const mockGtag = vi.fn();
Object.defineProperty(window, "gtag", {
  writable: true,
  value: mockGtag,
});

// Import analytics after mocks
import { analytics, consent } from "@/lib/analytics-core";

describe("Analytics Core System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();

    // Clear consent cache between tests
    // @ts-ignore - accessing private method for testing
    if (global.consentManager?.clearConsent) {
      // @ts-ignore
      global.consentManager.clearConsent();
    }
  });

  describe("consent", () => {
    describe("get", () => {
      it("returns default consent when no stored value", async () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = await consent.get();

        expect(result).toEqual({
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
        });
      });

      it.skip("returns parsed stored consent", async () => {
        const storedConsent = {
          analytics: true,
          marketing: false,
          functional: true,
        };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));

        const result = await consent.get();

        expect(result).toEqual({
          essential: true,
          analytics: true,
          marketing: false,
          functional: true,
        });
      });

      it("returns default consent when localStorage throws", async () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error("Storage error");
        });

        const result = await consent.get();

        expect(result).toEqual({
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
        });
      });

      it("returns default consent on server side", async () => {
        // Temporarily set window to undefined
        const originalWindow = global.window;
        Object.defineProperty(global, "window", {
          value: undefined,
          writable: true,
        });

        const result = await consent.get();

        expect(result).toEqual({
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
        });

        // Restore window
        global.window = originalWindow;
      });
    });

    describe("set", () => {
      it("stores consent in localStorage", async () => {
        const consentData = {
          essential: true,
          analytics: true,
          marketing: true,
          functional: true,
        };

        await consent.set(consentData);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "dataflow-consent",
          JSON.stringify({
            essential: true,
            analytics: true,
            marketing: true,
            functional: true,
          }),
        );
      });

      it("does nothing on server side", async () => {
        const originalWindow = global.window;
        delete (global as any).window;

        const consentData = {
          analytics: true,
          marketing: true,
          functional: true,
        };

        await consent.set(consentData);

        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

        // Restore window
        global.window = originalWindow;
      });
    });

    describe("hasAnalytics", () => {
      it("returns true when analytics consent is granted", async () => {
        const storedConsent = {
          analytics: true,
          marketing: false,
          functional: false,
        };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));

        const result = await consent.hasAnalytics();

        expect(result).toBe(true);
      });

      it("returns false when analytics consent is not granted", async () => {
        const storedConsent = {
          analytics: false,
          marketing: false,
          functional: false,
        };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));

        const result = await consent.hasAnalytics();

        expect(result).toBe(false);
      });
    });

    describe("hasMarketing", () => {
      it("returns true when marketing consent is granted", async () => {
        const storedConsent = {
          analytics: false,
          marketing: true,
          functional: false,
        };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));

        const result = await consent.hasMarketing();

        expect(result).toBe(true);
      });

      it("returns false when marketing consent is not granted", async () => {
        const storedConsent = {
          analytics: false,
          marketing: false,
          functional: false,
        };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedConsent));

        const result = await consent.hasMarketing();

        expect(result).toBe(false);
      });
    });
  });

  describe("analytics", () => {
    let mockGtag: vi.Mock;
    let mockPlausible: vi.Mock;

    beforeEach(() => {
      mockGtag = vi.fn();
      mockPlausible = vi.fn();

      // Mock window globals
      Object.defineProperty(window, "gtag", {
        value: mockGtag,
        writable: true,
      });
      Object.defineProperty(window, "plausible", {
        value: mockPlausible,
        writable: true,
      });
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com" },
        writable: true,
      });
    });

    describe("init", () => {
      it("does nothing when consent is not granted", () => {
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({ analytics: false }),
        );

        // Should not throw
        expect(() => analytics.init()).not.toThrow();
      });

      it("handles initialization when consent is granted", () => {
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({ analytics: true }),
        );

        // Should not throw (we don't test DOM manipulation in unit tests)
        expect(() => analytics.init()).not.toThrow();
      });

      it("handles errors gracefully", () => {
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({ analytics: true }),
        );

        // Mock a problematic DOM environment
        const originalHead = document.head;
        Object.defineProperty(document, "head", {
          value: null,
          writable: true,
        });

        // Should not throw even with problematic DOM
        expect(() => analytics.init()).not.toThrow();

        // Restore
        Object.defineProperty(document, "head", {
          value: originalHead,
          writable: true,
        });
      });
    });

    describe("track", () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({ analytics: true }),
        );
      });

      it("calls gtag and plausible when consent is granted", () => {
        const event = "test_event";
        const properties = { key: "value" };

        analytics.track(event, properties);

        expect(mockGtag).toHaveBeenCalledWith("event", event, {
          ...properties,
          custom_parameter_1: "landing_page",
          page_location: "https://example.com",
        });

        expect(mockPlausible).toHaveBeenCalledWith(event, {
          props: properties,
        });
      });

      it("does nothing when consent is not granted", () => {
        mockLocalStorage.getItem.mockReturnValue(
          JSON.stringify({ analytics: false }),
        );

        analytics.track("test_event");

        expect(mockGtag).not.toHaveBeenCalled();
        expect(mockPlausible).not.toHaveBeenCalled();
      });

      it("handles undefined properties", () => {
        analytics.track("test_event");

        expect(mockGtag).toHaveBeenCalledWith("event", "test_event", {
          custom_parameter_1: "landing_page",
          page_location: "https://example.com",
        });

        expect(mockPlausible).toHaveBeenCalledWith("test_event", {
          props: undefined,
        });
      });

      it("handles missing window globals gracefully", () => {
        Object.defineProperty(window, "gtag", {
          value: undefined,
          writable: true,
        });
        Object.defineProperty(window, "plausible", {
          value: undefined,
          writable: true,
        });

        expect(() => {
          analytics.track("test_event");
        }).not.toThrow();
      });
    });
  });
});
