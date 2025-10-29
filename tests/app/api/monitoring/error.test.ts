import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../../app/api/monitoring/error/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("../../../../lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("/api/monitoring/error", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST method", () => {
    it("should handle invalid JSON gracefully", async () => {
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid JSON format");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("should validate required error fields", async () => {
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify({
          context: {}, // Missing error field
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid error report format");
    });

    it("should validate required context fields", async () => {
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify({
          error: { message: "Test error", type: "TestError" },
          // Missing context fields
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid error report format");
    });

    it("should accept valid error payload", async () => {
      const validPayload = {
        error: {
          message: "Test error message",
          type: "JavaScriptError",
          code: "TEST_001",
          stack: "Error: Test\n    at testFunction",
          details: { additionalInfo: "test" },
        },
        context: {
          url: "https://example.com/page",
          userAgent: "Mozilla/5.0 (Test Browser)",
          timestamp: Date.now(),
          sessionId: "session-123",
          userId: "user-456",
          viewport: { width: 1920, height: 1080 },
          connection: { effectiveType: "4g", downlink: 10 },
          memory: { used: 50, total: 100, limit: 200 },
          experiments: ["hero_test", "cta_test"],
          sections: ["hero", "features"],
        },
      };

      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify(validPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.reportId).toBeDefined();
    });

    it("should handle optional fields correctly", async () => {
      const minimalPayload = {
        error: {
          message: "Minimal error",
          type: "Error",
        },
        context: {
          url: "https://example.com",
          userAgent: "Test Agent",
          timestamp: Date.now(),
          sessionId: "session-123",
          viewport: { width: 800, height: 600 },
          connection: { effectiveType: "3g", downlink: 1 },
        },
      };

      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify(minimalPayload),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it("should set security headers on all responses", async () => {
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify({
          error: { message: "test", type: "test" },
          context: {
            url: "test",
            userAgent: "test",
            timestamp: Date.now(),
            sessionId: "test",
            viewport: { width: 100, height: 100 },
            connection: { effectiveType: "test", downlink: 1 },
          },
        }),
      });

      const response = await POST(request);

      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("should validate error message length", async () => {
      const longMessage = "a".repeat(2000);
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify({
          error: { message: longMessage, type: "Error" },
          context: {
            url: "test",
            userAgent: "test",
            timestamp: Date.now(),
            sessionId: "test",
            viewport: { width: 100, height: 100 },
            connection: { effectiveType: "test", downlink: 1 },
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200); // Should still accept long messages
    });

    it("should validate error type", async () => {
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify({
          error: { message: "test", type: "" }, // Empty type
          context: {
            url: "test",
            userAgent: "test",
            timestamp: Date.now(),
            sessionId: "test",
            viewport: { width: 100, height: 100 },
            connection: { effectiveType: "test", downlink: 1 },
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400); // API validates empty type
    });

    it("should handle context validation edge cases", async () => {
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify({
          error: { message: "test", type: "Error" },
          context: {
            url: "",
            userAgent: "",
            timestamp: 0,
            sessionId: "",
            viewport: { width: 0, height: 0 },
            connection: { effectiveType: "", downlink: 0 },
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400); // API validates empty required fields
    });

    it("should generate report IDs", async () => {
      const payload = {
        error: { message: "test", type: "Error" },
        context: {
          url: "test",
          userAgent: "test",
          timestamp: Date.now(),
          sessionId: "test",
          viewport: { width: 100, height: 100 },
          connection: { effectiveType: "test", downlink: 1 },
        },
      };

      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.reportId).toBeDefined();
      expect(typeof data.reportId).toBe("string");
    });

    it("should log errors appropriately", async () => {
      const { logger } = await import("../../../../lib/logger");

      // Test invalid JSON logging
      const request = new NextRequest("http://localhost/api/monitoring/error", {
        method: "POST",
        body: "invalid",
      });

      await POST(request);

      expect(logger.error).toHaveBeenCalledWith(
        "Invalid JSON in error report payload",
        expect.any(Object),
      );
    });
  });
});
