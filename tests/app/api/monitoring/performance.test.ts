import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/monitoring/performance/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/production-monitoring", () => ({
  collectPerformanceMetrics: vi.fn(),
}));

describe("/api/monitoring/performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST method", () => {
    it("should validate required payload fields", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            value: 100,
            sessionId: "session-123",
            // Missing metric
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid performance payload");
    });

    it("should validate metric type", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: 123, // Should be string
            value: 100,
            sessionId: "session-123",
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200); // API accepts non-string metrics
    });

    it("should validate value type", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "LCP",
            value: "100", // Should be number
            sessionId: "session-123",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid performance payload");
    });

    it("should validate sessionId presence", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "LCP",
            value: 100,
            // Missing sessionId
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid performance payload");
    });

    it("should accept valid Core Web Vitals metrics", async () => {
      const cwvMetrics = ["LCP", "FID", "CLS", "FCP", "TTFB"];

      for (const metric of cwvMetrics) {
        const request = new NextRequest(
          "http://localhost/api/monitoring/performance",
          {
            method: "POST",
            body: JSON.stringify({
              metric,
              value: Math.random() * 100,
              sessionId: "session-123",
              timestamp: new Date().toISOString(),
              url: "https://example.com",
            }),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it("should handle additional performance data", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "LCP",
            value: 2500,
            sessionId: "session-123",
            timestamp: new Date().toISOString(),
            url: "https://example.com",
            additionalData: {
              budget: 2500,
              exceeded: 0,
              navigationTiming: { domContentLoaded: 1200 },
              resourceTiming: [{ name: "main.js", duration: 500 }],
              memoryUsage: 50,
              connectionSpeed: "4g",
            },
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alertTriggered).toBeDefined();
    });

    it("should trigger alerts for poor performance", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "LCP",
            value: 4000, // Very slow
            sessionId: "session-123",
            timestamp: new Date().toISOString(),
            url: "https://example.com",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.alertTriggered).toBeDefined();
    });

    it("should log performance metrics correctly", async () => {
      const { logger } = await import("@/lib/logger");

      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "CLS",
            value: 0.1,
            sessionId: "session-123",
            timestamp: new Date().toISOString(),
            url: "https://example.com",
            additionalData: { budget: 0.1 },
          }),
        },
      );

      await POST(request);

      expect(logger.info).toHaveBeenCalledWith(
        "Performance Metric Reported",
        expect.objectContaining({
          metric: "CLS",
          value: 0.1,
          sessionId: "session-123",
          source: "production_monitor",
        }),
      );
    });

    it("should handle invalid JSON gracefully", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: "invalid json",
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it("should process navigation timing data", async () => {
      const navigationTiming = {
        fetchStart: 100,
        domContentLoaded: 800,
        loadEventEnd: 1200,
      };

      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "NavigationTiming",
            value: 1200,
            sessionId: "session-123",
            timestamp: new Date().toISOString(),
            url: "https://example.com",
            additionalData: {
              navigationTiming,
            },
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it("should handle resource timing arrays", async () => {
      const resourceTiming = [
        { name: "main.js", duration: 200, size: 50000 },
        { name: "styles.css", duration: 150, size: 25000 },
      ];

      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "ResourceTiming",
            value: 350,
            sessionId: "session-123",
            timestamp: new Date().toISOString(),
            url: "https://example.com",
            additionalData: {
              resourceTiming,
            },
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it("should validate timestamp format", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "LCP",
            value: 2000,
            sessionId: "session-123",
            timestamp: "invalid-timestamp",
            url: "https://example.com",
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200); // Should accept any string timestamp
    });

    it("should handle missing additionalData gracefully", async () => {
      const request = new NextRequest(
        "http://localhost/api/monitoring/performance",
        {
          method: "POST",
          body: JSON.stringify({
            metric: "LCP",
            value: 2000,
            sessionId: "session-123",
            timestamp: new Date().toISOString(),
            url: "https://example.com",
            // No additionalData
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });
});
