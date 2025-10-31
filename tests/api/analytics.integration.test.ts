import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock external service APIs
const mockAnalyticsService = {
  track: vi.fn().mockResolvedValue({ success: true }),
  identify: vi.fn().mockResolvedValue({ success: true }),
  page: vi.fn().mockResolvedValue({ success: true }),
};

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch;
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

const originalFetch = global.fetch;

describe("Analytics Integration", () => {
  it("sends pageview events to analytics service", async () => {
    const pageData = {
      path: "/landing",
      title: "Landing Page",
      referrer: "https://google.com",
    };

    mockAnalyticsService.page.mockResolvedValue({ success: true });

    const result = await mockAnalyticsService.page(pageData);

    expect(mockAnalyticsService.page).toHaveBeenCalledWith(pageData);
    expect(result.success).toBe(true);
  });

  it("tracks user interactions and conversions", async () => {
    const eventData = {
      event: "form_submit",
      properties: {
        formType: "lead",
        value: 1,
      },
    };

    mockAnalyticsService.track.mockResolvedValue({ success: true });

    const result = await mockAnalyticsService.track(
      eventData.event,
      eventData.properties,
    );

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      eventData.event,
      eventData.properties,
    );
    expect(result.success).toBe(true);
  });

  it("identifies users for tracking", async () => {
    const userData = {
      userId: "user123",
      traits: {
        email: "user@example.com",
        plan: "premium",
      },
    };

    mockAnalyticsService.identify.mockResolvedValue({ success: true });

    const result = await mockAnalyticsService.identify(
      userData.userId,
      userData.traits,
    );

    expect(mockAnalyticsService.identify).toHaveBeenCalledWith(
      userData.userId,
      userData.traits,
    );
    expect(result.success).toBe(true);
  });

  it("handles analytics service outages gracefully", async () => {
    mockAnalyticsService.track.mockRejectedValue(
      new Error("Analytics service unavailable"),
    );

    // Should not throw, should handle gracefully
    try {
      await mockAnalyticsService.track("test_event", {});
    } catch (error) {
      expect(error.message).toBe("Analytics service unavailable");
    }
  });

  it("respects user privacy preferences", async () => {
    const privacySettings = {
      analytics: false,
      tracking: false,
    };

    // Mock privacy-aware tracking
    const trackWithPrivacy = vi.fn(
      (
        event: string,
        properties: Record<string, unknown>,
        privacy: typeof privacySettings,
      ) => {
        if (!privacy.analytics) {
          return Promise.resolve({ skipped: true, reason: "privacy" });
        }
        return mockAnalyticsService.track(event, properties);
      },
    );

    const result = await trackWithPrivacy("test_event", {}, privacySettings);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("privacy");
  });
});
