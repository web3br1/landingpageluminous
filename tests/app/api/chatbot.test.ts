import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/chatbot/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/chatbot/engine", () => ({
  chatbotEngine: {
    processMessage: vi.fn(),
  },
}));

vi.mock("@/lib/analytics-core", () => ({
  analytics: {
    trackEvent: vi.fn(),
    trackExperiment: vi.fn(),
  },
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    get: vi.fn(() => "default"),
  },
}));

describe("/api/chatbot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST method", () => {
    it("should return 400 for invalid message", async () => {
      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify({ message: "", context: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid message");
      expect(data.details).toContain("Message must be a string");
    });

    it("should return 400 for message too long", async () => {
      const longMessage = "a".repeat(1001);
      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify({ message: longMessage, context: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid message");
      expect(data.details).toContain("max 1000 characters");
    });

    it("should return 429 when rate limit exceeded", async () => {
      // Set up rate limiting
      if (typeof global !== "undefined" && !(global as any).rateLimit) {
        (global as any).rateLimit = new Map();
      }

      const rateLimit = (global as any).rateLimit;
      const clientIP = "127.0.0.1";
      const rateLimitKey = `chatbot:${clientIP}`;

      // Simulate rate limit exceeded
      rateLimit.set(rateLimitKey, {
        count: 10, // Max requests
        resetTime: Date.now() + 60000,
      });

      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        headers: { "x-forwarded-for": clientIP },
        body: JSON.stringify({ message: "Hello", context: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Rate limit exceeded");
    });

    it("should validate message length", async () => {
      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify({ message: "a".repeat(1001), context: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid message");
    });

    it("should initialize rate limiting", async () => {
      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ message: "Hello", context: {} }),
      });

      await POST(request);

      // Verify rate limiting structure exists
      const rateLimit = (global as any).rateLimit;
      expect(rateLimit).toBeDefined();
    });
  });
});
