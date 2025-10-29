/**
 * Form API Mock Façade - Unified mock layer for form submissions
 * Uses MSW internally but provides a clean interface for testing
 */
import { rest } from "msw";
import { setupServer } from "msw/node";

export interface FormSubmissionMock {
  delay?: number;
  shouldSucceed?: boolean;
  responseData?: any;
  errorMessage?: string;
  statusCode?: number;
}

class FormApiMockFacade {
  private server: ReturnType<typeof setupServer> | null = null;
  private handlers: any[] = [];

  /**
   * Setup MSW server with form submission mocks
   */
  setup(mocks: Record<string, FormSubmissionMock> = {}) {
    // Default mock configuration
    const defaultMocks: Record<string, FormSubmissionMock> = {
      "/api/leads": {
        delay: 10, // Fast for tests
        shouldSucceed: true,
        responseData: { success: true, leadId: "test-lead-123" },
      },
      "/api/rate-limit/check": {
        delay: 5,
        shouldSucceed: true,
        responseData: {
          allowed: true,
          remaining: 999,
          resetTime: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      "/api/rate-limit/report": {
        delay: 5,
        shouldSucceed: true,
        responseData: { success: true },
      },
    };

    // Merge with provided mocks
    const allMocks = { ...defaultMocks, ...mocks };

    this.handlers = Object.entries(allMocks).map(([endpoint, config]) => {
      return rest.post(endpoint, async (req, res, ctx) => {
        // Simulate network delay
        if (config.delay) {
          await new Promise((resolve) => setTimeout(resolve, config.delay));
        }

        if (config.shouldSucceed === false) {
          return res(
            ctx.status(config.statusCode || 400),
            ctx.json({
              error: config.errorMessage || "Mock error",
              code: "MOCK_ERROR",
            }),
          );
        }

        return res(ctx.status(200), ctx.json(config.responseData));
      });
    });

    this.server = setupServer(...this.handlers);
    this.server.listen({ onUnhandledRequest: "warn" });

    return this.server;
  }

  /**
   * Configure specific endpoint behavior
   */
  mockEndpoint(endpoint: string, config: FormSubmissionMock) {
    if (!this.server) {
      throw new Error("Mock server not initialized. Call setup() first.");
    }

    const newHandler = rest.post(endpoint, async (req, res, ctx) => {
      if (config.delay) {
        await new Promise((resolve) => setTimeout(resolve, config.delay));
      }

      if (config.shouldSucceed === false) {
        return res(
          ctx.status(config.statusCode || 400),
          ctx.json({
            error: config.errorMessage || "Mock error",
            code: "MOCK_ERROR",
          }),
        );
      }

      return res(ctx.status(200), ctx.json(config.responseData));
    });

    // Replace existing handler or add new one
    const existingIndex = this.handlers.findIndex(
      (h) => h.info.endpoint === endpoint,
    );
    if (existingIndex >= 0) {
      this.handlers[existingIndex] = newHandler;
    } else {
      this.handlers.push(newHandler);
    }

    this.server.resetHandlers(...this.handlers);
  }

  /**
   * Simulate network error
   */
  simulateNetworkError(endpoint: string) {
    this.mockEndpoint(endpoint, {
      shouldSucceed: false,
      statusCode: 0, // Network error
      errorMessage: "Network Error",
    });
  }

  /**
   * Simulate rate limit exceeded
   */
  simulateRateLimitExceeded() {
    this.mockEndpoint("/api/rate-limit/check", {
      shouldSucceed: false,
      statusCode: 429,
      responseData: {
        error: "Rate limit exceeded",
        retryAfter: 60,
        limit: 5,
        remaining: 0,
      },
    });
  }

  /**
   * Reset to default successful behavior
   */
  resetToDefaults() {
    this.setup();
  }

  /**
   * Cleanup MSW server
   */
  teardown() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * Get server instance for advanced operations
   */
  getServer() {
    return this.server;
  }
}

// Export singleton instance
export const formApiMock = new FormApiMockFacade();

// Convenience functions for tests
export const setupFormApiMock = (
  mocks?: Record<string, FormSubmissionMock>,
) => {
  return formApiMock.setup(mocks);
};

export const teardownFormApiMock = () => {
  formApiMock.teardown();
};

export const mockFormSubmission = (config: FormSubmissionMock) => {
  formApiMock.mockEndpoint("/api/leads", config);
};

export const mockRateLimitCheck = (config: FormSubmissionMock) => {
  formApiMock.mockEndpoint("/api/rate-limit/check", config);
};

// Rate limiting mock for hooks - vitest/jest compatible
export const rateLimitMock = {
  checkLimit: vi.fn().mockResolvedValue(true), // Always allows by default
  reportViolation: vi.fn().mockResolvedValue(undefined),
  reset: vi.fn(),
  getTimeUntilReset: vi.fn().mockReturnValue({ minutes: 0, seconds: 0 }),
};

// Helper to configure rate limit mock behavior
export const configureRateLimitMock = (options: {
  allowRequests?: boolean;
  remainingAttempts?: number;
  retryAfter?: number;
  isBlocked?: boolean;
}) => {
  const {
    allowRequests = true,
    remainingAttempts = 999,
    retryAfter = 0,
    isBlocked = false,
  } = options;

  rateLimitMock.checkLimit.mockResolvedValue(allowRequests);
  rateLimitMock.getTimeUntilReset.mockReturnValue({
    minutes: Math.floor(retryAfter / 60),
    seconds: retryAfter % 60,
  });
};

// ===== EXTERNAL API MOCKS =====

// Geolocation API mock
export const geolocationMock = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

// Feature flags API mock
export const featureFlagsMock = {
  getFlags: vi.fn(),
  isEnabled: vi.fn(),
  getVariant: vi.fn(),
};

// Analytics API mock
export const analyticsMock = {
  track: vi.fn(),
  page: vi.fn(),
  identify: vi.fn(),
  group: vi.fn(),
  reset: vi.fn(),
};

// Helper to setup comprehensive API mocking for visual regression tests
export const setupComprehensiveAPIMocking = (server: any) => {
  // Geolocation API
  server.use(
    rest.get("/api/geolocation", (req, res, ctx) => {
      return res(
        ctx.json({
          latitude: -23.5505,
          longitude: -46.6333,
          accuracy: 100,
          country: "BR",
          region: "SP",
          city: "São Paulo",
        }),
      );
    }),
  );

  // Feature flags API
  server.use(
    rest.get("/api/feature-flags", (req, res, ctx) => {
      return res(
        ctx.json({
          abVariant: "A",
          geo: "BR",
          reducedMotion: false,
          userBucket: Math.floor(Math.random() * 100),
          theme: "light",
          analyticsEnabled: true,
          lazyLoading: true,
          experimentalFeatures: false,
        }),
      );
    }),
  );

  // Analytics API
  server.use(
    rest.post("/api/analytics", (req, res, ctx) => {
      return res(ctx.status(200));
    }),
    rest.post("/api/analytics/track", (req, res, ctx) => {
      return res(ctx.status(200));
    }),
  );

  // User preferences API
  server.use(
    rest.get("/api/user/preferences", (req, res, ctx) => {
      return res(
        ctx.json({
          theme: "system",
          language: "pt-BR",
          notifications: true,
          reducedMotion: false,
        }),
      );
    }),
  );

  // Performance monitoring API
  server.use(
    rest.post("/api/performance", (req, res, ctx) => {
      return res(ctx.status(200));
    }),
  );

  return server;
};

// Helper to configure geolocation mock behavior
export const configureGeolocationMock = (options: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
  timeout?: boolean;
}) => {
  const {
    latitude = -23.5505,
    longitude = -46.6333,
    accuracy = 100,
    error,
    timeout = false,
  } = options;

  if (error) {
    geolocationMock.getCurrentPosition.mockImplementation((success, fail) => {
      fail?.({ code: 1, message: error });
    });
  } else if (timeout) {
    geolocationMock.getCurrentPosition.mockImplementation((success, fail) => {
      setTimeout(() => {
        fail?.({ code: 3, message: "Timeout" });
      }, 10000);
    });
  } else {
    geolocationMock.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude,
          longitude,
          accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });
  }
};

// Helper to configure feature flags mock behavior
export const configureFeatureFlagsMock = (options: {
  abVariant?: "A" | "B";
  geo?: string;
  reducedMotion?: boolean;
  userBucket?: number;
  theme?: string;
  analyticsEnabled?: boolean;
  lazyLoading?: boolean;
  experimentalFeatures?: boolean;
}) => {
  const defaults = {
    abVariant: "A" as const,
    geo: "BR",
    reducedMotion: false,
    userBucket: 1,
    theme: "light",
    analyticsEnabled: true,
    lazyLoading: true,
    experimentalFeatures: false,
  };

  const config = { ...defaults, ...options };

  featureFlagsMock.getFlags.mockResolvedValue(config);
  featureFlagsMock.isEnabled.mockImplementation((flag: string) => {
    return config[flag as keyof typeof config] || false;
  });
  featureFlagsMock.getVariant.mockImplementation((experiment: string) => {
    if (experiment === "hero") return config.abVariant;
    return "control";
  });
};

// Helper to configure analytics mock behavior
export const configureAnalyticsMock = (options: {
  shouldTrack?: boolean;
  delay?: number;
  error?: boolean;
}) => {
  const { shouldTrack = true, delay = 0, error = false } = options;

  const mockFn = vi.fn().mockImplementation(async (...args: any[]) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (error) {
      throw new Error("Analytics error");
    }
    return shouldTrack ? undefined : null;
  });

  analyticsMock.track.mockImplementation(mockFn);
  analyticsMock.page.mockImplementation(mockFn);
  analyticsMock.identify.mockImplementation(mockFn);
  analyticsMock.group.mockImplementation(mockFn);
  analyticsMock.reset.mockImplementation(mockFn);
};
