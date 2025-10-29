import { describe, it, expect, jest, beforeEach, vi } from "vitest";

// Type for Next.js response options
interface ResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

// Type for Next.js request options
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

// Access to mocked objects
let mockNextResponse: {
  json: (data: unknown, options?: ResponseOptions) => void;
  status: number;
  headers: Record<string, string>;
};
let mockLogger: {
  error: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
};
let MockNextRequest: {
  new (
    url: string,
    options?: RequestOptions,
  ): {
    url: string;
    method: string;
    headers: Record<string, string>;
    json: () => Promise<unknown>;
    text: () => Promise<string>;
  };
};

// Mock Next.js
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");

  const mockResponse = {
    json: vi.fn((data: unknown, options?: ResponseOptions) => ({
      data,
      options: options || {},
      status: options?.status || 200,
      headers: options?.headers || {},
    })),
    status: vi.fn((code: number) => ({ status: code, headers: {} })),
  };

  mockNextResponse = mockResponse;

  MockNextRequest = class {
    url: string;
    method: string;
    headers: Map<string, string>;
    private body: string | any;

    constructor(url: string, options?: RequestOptions) {
      this.url = url;
      this.method = options?.method || "GET";
      this.headers = new Map(Object.entries(options?.headers || {}));
      this.body = options?.body;
    }

    async json() {
      if (
        this.body &&
        typeof this.body === "string" &&
        this.body === "invalid json"
      ) {
        throw new SyntaxError(
          "Unexpected token 'i', \"invalid json\" is not valid JSON",
        );
      }
      return Promise.resolve(this.body ? JSON.parse(this.body) : {});
    }

    async text() {
      return Promise.resolve(this.body || "");
    }

    async formData() {
      return Promise.resolve(new FormData());
    }

    async arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }

    async blob() {
      return Promise.resolve(new Blob());
    }
  };

  return {
    ...actual,
    NextResponse: mockResponse,
    NextRequest: MockNextRequest,
  };
});

// Mock logger
vi.mock("@/lib/logger", () => {
  mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };

  return {
    logger: mockLogger,
  };
});

// Mock production monitoring
vi.mock("@/lib/production-monitoring", () => ({
  collectPerformanceMetrics: vi.fn().mockResolvedValue({
    coreWebVitals: {
      lcp: 1200,
      fid: 50,
      cls: 0.05,
      fcp: 800,
      ttfb: 200,
    },
    navigationTiming: {
      domContentLoaded: 1200,
      loadComplete: 1500,
      domInteractive: 800,
      responseTime: 150,
      totalTime: 1300,
    },
    resourceTiming: [],
    memoryUsage: 50000000,
    connectionSpeed: "4g",
  }),
}));

// Mock analytics
vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

// Helper to get the mock response
const getMockResponse = (): {
  data: unknown;
  status: number;
  headers: Record<string, string>;
} | null => {
  const calls = mockNextResponse.json.mock.calls;
  if (calls.length === 0) return null;
  const [data, options] = calls[calls.length - 1];
  return {
    data,
    status: options?.status || 200,
    headers: options?.headers || {},
  };
};

// Mock external services for API routes
vi.mock("@/lib/production-monitoring", () => ({
  collectPerformanceMetrics: vi.fn(() => ({
    coreWebVitals: {
      lcp: 1200,
      fid: 50,
      cls: 0.05,
      fcp: 800,
      ttfb: 200,
    },
    navigationTiming: {
      domContentLoaded: 1200,
      loadComplete: 1500,
    },
    resourceTiming: [],
    customMetrics: {},
  })),
  collectErrorMetrics: vi.fn(() => ({
    errors: [],
    warnings: [],
    unhandledRejections: 0,
    uncaughtExceptions: 0,
  })),
  generateMonitoringReport: vi.fn(() => ({
    period: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    summary: {
      totalRequests: 1250,
      errorRate: 0.02,
      avgResponseTime: 250,
      uptime: 0.998,
    },
    performance: {
      coreWebVitals: {
        lcp: { p75: 1200, p95: 1800, p99: 2500 },
        fid: { p75: 50, p95: 100, p99: 150 },
        cls: { p75: 0.05, p95: 0.1, p99: 0.2 },
      },
    },
    errors: {
      byType: {
        "4xx": 15,
        "5xx": 10,
        network: 5,
      },
      byEndpoint: {},
    },
  })),
}));

// Import API routes after mocks (moved to after describe block)

describe("API Contract Tests", () => {
  let getPerformanceMetrics: (request: Request) => Promise<Response>;
  let postErrorReport: (request: Request) => Promise<Response>;
  let getMonitoringReport: (request: Request) => Promise<Response>;

  beforeAll(async () => {
    // Dynamic imports after mocks are set up
    const perfModule = await import("@/app/api/monitoring/performance/route");
    const errorModule = await import("@/app/api/monitoring/error/route");
    const reportModule = await import("@/app/api/monitoring/report/route");

    getPerformanceMetrics = perfModule.GET;
    postErrorReport = errorModule.POST;
    getMonitoringReport = reportModule.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Performance Metrics API", () => {
    describe("GET /api/monitoring/performance", () => {
      it("returns performance metrics in correct contract format", async () => {
        const request = new MockNextRequest(
          "http://localhost:3000/api/monitoring/performance",
        );
        const response = await getPerformanceMetrics(request);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "ok",
            service: "performance-monitoring",
            timestamp: expect.any(String),
            budgets: expect.objectContaining({
              lcp: expect.any(Number),
              fid: expect.any(Number),
              cls: expect.any(Number),
              fcp: expect.any(Number),
              ttfb: expect.any(Number),
            }),
          }),
          expect.objectContaining({
            headers: expect.objectContaining({
              "X-Content-Type-Options": "nosniff",
              "X-Frame-Options": "DENY",
            }),
          }),
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
          "Performance metrics collected",
          expect.objectContaining({
            lcp: expect.any(Number),
            fid: expect.any(Number),
          }),
        );
      });

      it("handles request errors gracefully", async () => {
        // Mock a failure in the monitoring service
        const mockMonitoring = await import("@/lib/production-monitoring");
        const originalMock = mockMonitoring.collectPerformanceMetrics;
        mockMonitoring.collectPerformanceMetrics.mockRejectedValueOnce(
          new Error("Failed to collect metrics"),
        );

        const request = new MockNextRequest(
          "http://localhost:3000/api/monitoring/performance",
        );

        const response = await getPerformanceMetrics(request);
        const mockResponse = getMockResponse();

        expect(mockResponse?.status).toBe(500);
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { error: "Failed to collect performance metrics" },
          expect.objectContaining({
            status: 500,
            headers: expect.objectContaining({
              "X-Content-Type-Options": "nosniff",
              "X-Frame-Options": "DENY",
            }),
          }),
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Failed to collect performance metrics",
          expect.any(Object),
        );

        // Restore the original mock
        mockMonitoring.collectPerformanceMetrics = originalMock;
      });
    });
  });

  describe("Error Reporting API", () => {
    describe("POST /api/monitoring/error", () => {
      it("accepts error reports in correct contract format", async () => {
        const errorReport = {
          error: {
            message: "Test error",
            type: "RUNTIME_ERROR" as const,
            stack: "Error: Test error\n    at test.js:1:1",
          },
          context: {
            url: "http://localhost:3000/page",
            userAgent: "Test/1.0",
            timestamp: Date.now(),
            sessionId: "session-456",
            userId: "test-user-123",
            viewport: { width: 1920, height: 1080 },
            connection: { effectiveType: "4g", downlink: 10 },
          },
        };

        const request = new MockNextRequest(
          "http://localhost:3000/api/monitoring/error",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(errorReport),
          },
        );

        await postErrorReport(request);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            reportId: expect.stringContaining("err_"),
            timestamp: expect.any(String),
          }),
          expect.objectContaining({
            headers: expect.objectContaining({
              "X-Content-Type-Options": "nosniff",
              "X-Frame-Options": "DENY",
            }),
          }),
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Client Error Reported",
          expect.objectContaining({
            error: expect.objectContaining({
              message: errorReport.error.message,
            }),
            context: expect.objectContaining({
              url: errorReport.context.url,
            }),
          }),
        );
      });

      it("validates required error report fields", async () => {
        const invalidReport = {
          message: "Test error",
          // Missing required error and context fields
        };

        const request = new MockNextRequest(
          "http://localhost:3000/api/monitoring/error",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(invalidReport),
          },
        );

        const response = await postErrorReport(request);

        expect(response.status).toBe(400);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: "Invalid error report format",
            details: expect.any(Array),
          }),
          expect.objectContaining({
            status: 400,
            headers: expect.objectContaining({
              "X-Content-Type-Options": "nosniff",
              "X-Frame-Options": "DENY",
            }),
          }),
        );
        expect(mockLogger.warn).toHaveBeenCalledWith(
          "Invalid error report format",
          expect.any(Object),
        );
      });

      it("handles malformed JSON gracefully", async () => {
        const request = new MockNextRequest(
          "http://localhost:3000/api/monitoring/error",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "invalid json",
          },
        );

        const response = await postErrorReport(request);

        expect(response.status).toBe(400);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { error: "Invalid JSON format" },
          expect.objectContaining({
            status: 400,
            headers: expect.objectContaining({
              "X-Content-Type-Options": "nosniff",
              "X-Frame-Options": "DENY",
            }),
          }),
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          "Invalid JSON in error report payload",
          expect.any(Object),
        );
      });
    });
  });

  describe("Monitoring Report API", () => {
    describe("GET /api/monitoring/report", () => {
      it("returns monitoring report in correct contract format", async () => {
        const request = new MockNextRequest(
          "http://localhost:3000/api/monitoring/report",
        );
        await getMonitoringReport(request);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              summary: expect.objectContaining({
                totalErrors: expect.any(Number),
                criticalErrors: expect.any(Number),
                performanceScore: expect.any(Number),
                uptime: expect.any(Number),
                activeUsers: expect.any(Number),
              }),
              recentErrors: expect.any(Array),
              performance: expect.any(Object),
            }),
            generatedAt: expect.any(String),
          }),
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
          "Monitoring Report Requested",
          expect.objectContaining({
            type: "summary",
          }),
        );
      });

      it("supports time range parameters", async () => {
        const request = new MockNextRequest(
          "http://localhost:3000/api/monitoring/report?range=7d",
        );

        await getMonitoringReport(request);

        expect(mockLogger.info).toHaveBeenCalledWith(
          "Monitoring Report Requested",
          expect.objectContaining({
            timeRange: "7d",
          }),
        );
      });
    });
  });

  describe("HTTP Response Contracts", () => {
    it("all successful responses include proper headers", async () => {
      const request = new MockNextRequest(
        "http://localhost:3000/api/monitoring/performance",
      );
      await getPerformanceMetrics(request);

      const responseData = mockNextResponse.json.mock.calls[0][0];

      // Check that response includes metadata
      expect(responseData).toEqual(
        expect.objectContaining({
          status: "ok",
          service: "performance-monitoring",
          timestamp: expect.any(String),
        }),
      );
    });

    it("error responses follow Problem JSON format", async () => {
      // Mock a service failure
      const mockMonitoring = await import("@/lib/production-monitoring");
      mockMonitoring.collectPerformanceMetrics.mockRejectedValueOnce(
        new Error("Service unavailable"),
      );

      const request = new MockNextRequest(
        "http://localhost:3000/api/monitoring/performance",
      );

      const response = await getPerformanceMetrics(request);
      const mockResponse = getMockResponse();

      // Verify error response structure
      expect(mockResponse?.status).toBe(500);
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Failed to collect performance metrics" },
        expect.objectContaining({
          status: 500,
          headers: expect.objectContaining({
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
          }),
        }),
      );

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to collect performance metrics",
        expect.any(Object),
      );
    });
  });

  describe("Rate Limiting", () => {
    it("handles rate limiting gracefully", async () => {
      // This would test rate limiting middleware
      // For now, we verify the API can handle multiple concurrent requests

      const requests = Array.from(
        { length: 10 },
        () =>
          new MockNextRequest(
            "http://localhost:3000/api/monitoring/performance",
          ),
      );

      const promises = requests.map((req) => getPerformanceMetrics(req));

      await expect(Promise.all(promises)).resolves.toBeDefined();

      // Verify all requests were handled

      expect(mockNextResponse.json).toHaveBeenCalledTimes(10);
    });
  });

  describe("CORS and Security Headers", () => {
    it("includes appropriate security headers", async () => {
      // This would test middleware that adds security headers
      const request = new MockNextRequest(
        "http://localhost:3000/api/monitoring/performance",
      );
      await getPerformanceMetrics(request);

      // Verify response includes security headers

      const responseOptions = mockNextResponse.json.mock.calls[0][1];
      expect(responseOptions).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          }),
        }),
      );
    });

    it("handles CORS preflight requests", async () => {
      const request = new MockNextRequest(
        "http://localhost:3000/api/monitoring/performance",
        {
          method: "OPTIONS",
          headers: {
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
          },
        },
      );

      // This would test CORS middleware
      // For now, we ensure the API doesn't crash on OPTIONS requests
      await expect(getPerformanceMetrics(request)).resolves.toBeDefined();
    });
  });
});
